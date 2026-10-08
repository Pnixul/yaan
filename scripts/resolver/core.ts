import GeoJSONReader from "jsts/org/locationtech/jts/io/GeoJSONReader.js";
import Coordinate from "jsts/org/locationtech/jts/geom/Coordinate.js";
import Location from "jsts/org/locationtech/jts/geom/Location.js";
import SimplePointInAreaLocator from "jsts/org/locationtech/jts/algorithm/locate/SimplePointInAreaLocator.js";
import RelateOp from "jsts/org/locationtech/jts/operation/relate/RelateOp.js";
import { validCoordinates } from "../../src/lib/location";
import type { AdministrativeUnit, BoundaryGeometry } from "../../src/lib/administrative-boundary";
import type {
  AdministrativeDatasetProvider,
  AdministrativeResolution,
  AdministrativeResolver,
  AdministrativeResolverDataset,
} from "../../src/lib/administrative-resolver";
import { inspectGeometry, unitId } from "../boundaries/inspect.mjs";
import { topologyError } from "../boundaries/topology.mjs";

const text = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 && !/[\u0000-\u001f\u007f]/u.test(value);
const code = (value: unknown): value is string => text(value) && !/\s/u.test(value);

function readGeometry(geometry: BoundaryGeometry) {
  const inspection = inspectGeometry(geometry);
  if (inspection.errors.length || inspection.outsideWgs84Range || !inspection.bounds ||
    inspection.bounds[2] - inspection.bounds[0] >= 180 || topologyError(geometry)) {
    throw new Error("Invalid or unsupported geometry");
  }
  return new GeoJSONReader().read(geometry);
}

function validUnit(unit: AdministrativeUnit, level: string): boolean {
  return unit != null && unit.level === level && code(unit.officialCode) &&
    /^synthetic(?:-[a-z0-9]+)*$/u.test(unit.codeNamespace) &&
    unit.id === unitId(unit.codeNamespace, unit.level, unit.officialCode) &&
    text(unit.nameTh) && (unit.nameEn === undefined || text(unit.nameEn)) &&
    (unit.level === "khet" ? unit.parentId === undefined :
      code(unit.parentId) && unit.parentId.startsWith(`${unit.codeNamespace}:khet:`) &&
      unit.parentId.length > `${unit.codeNamespace}:khet:`.length);
}

function prepare(dataset: AdministrativeResolverDataset) {
  const p = dataset.provenance;
  if (dataset.coordinateReferenceSystem !== "OGC:CRS84" ||
    !text(p.id) || !p.id.startsWith("synthetic:") ||
    ![p.version, p.publisher, p.sourceReference, p.coverage?.id, p.coverage?.description].every(text) ||
    !["khet", "khwaeng"].includes(p.coverage.level) ||
    p.qualification.reference !== null ||
    !Array.isArray(p.knownLimitations) || !p.knownLimitations.length || !p.knownLimitations.every(text) ||
    !Array.isArray(dataset.boundaries) || !dataset.boundaries.length) {
    throw new Error("Incomplete dataset metadata");
  }
  const coverage = readGeometry(dataset.coverageGeometry);
  const ids = new Set<string>();
  const boundaries = dataset.boundaries.map(({ unit, geometry }) => {
    if (!validUnit(unit, p.coverage.level) || ids.has(unit.id)) throw new Error("Invalid administrative identity");
    ids.add(unit.id);
    const parsed = readGeometry(geometry);
    // Otherwise an exterior lookup could conceal a contradictory unit match.
    if (!RelateOp.covers(coverage, parsed)) throw new Error("Unit extends outside declared coverage");
    return { unit, geometry: parsed };
  }).sort((a, b) => a.unit.id < b.unit.id ? -1 : a.unit.id > b.unit.id ? 1 : 0);
  return { provenance: p, coverage, boundaries };
}

/** Pure in-memory foundation. The only admitted datasets at 2.6 are synthetic.
 * Preparation takes one isolated snapshot; no I/O, logging, retries or activation.
 * Future canonical admission needs a separately reviewed adapter/activation policy. */
export function createAdministrativeResolver(provider: AdministrativeDatasetProvider): AdministrativeResolver {
  let prepared: ReturnType<typeof prepare> | undefined;
  let failure: Extract<AdministrativeResolution, { status: "unavailable" }> = { status: "unavailable", reason: "no_dataset" };
  let dataset: AdministrativeResolverDataset | null = null;
  try { dataset = provider.getDataset(); }
  catch { failure = { status: "unavailable", reason: "provider_error" }; }
  if (dataset != null) {
    if (dataset.provenance?.qualification?.status !== "synthetic" ||
      dataset.provenance?.official !== false || dataset.provenance?.activation?.eligible !== false) {
      failure = { status: "unavailable", reason: "dataset_not_enabled" };
    } else {
      try { prepared = prepare(structuredClone(dataset)); }
      catch { failure = { status: "unavailable", reason: "invalid_dataset" }; }
    }
  }
  return {
    resolve(input: unknown): AdministrativeResolution {
      if (!input || typeof input !== "object" || Array.isArray(input) ||
        Object.keys(input).length !== 2 || !("latitude" in input) || !("longitude" in input) ||
        !Object.hasOwn(input, "latitude") || !Object.hasOwn(input, "longitude") ||
        !validCoordinates(input.longitude, input.latitude)) {
        return { status: "invalid_input", reason: "invalid_coordinates" };
      }
      if (!prepared) return { ...failure };
      try {
        const point = new Coordinate(input.longitude as number, input.latitude as number);
        const coverageRelation = SimplePointInAreaLocator.locate(point, prepared.coverage);
        const dataset = structuredClone(prepared.provenance);
        if (coverageRelation === Location.EXTERIOR) return { status: "outside_coverage", dataset };
        const matches: Extract<AdministrativeResolution, { status: "ambiguous" }>["matches"] = [];
        for (const boundary of prepared.boundaries) {
          const relation = SimplePointInAreaLocator.locate(point, boundary.geometry);
          if (relation !== Location.EXTERIOR) matches.push({
            unit: structuredClone(boundary.unit), relation: relation === Location.BOUNDARY ? "boundary" : "interior",
          });
        }
        const coverageBoundary = coverageRelation === Location.BOUNDARY;
        const reasons: ("boundary" | "overlap")[] = [];
        if (coverageBoundary || matches.some((m) => m.relation === "boundary")) reasons.push("boundary");
        if (matches.filter((m) => m.relation === "interior").length > 1) reasons.push("overlap");
        if (reasons.length) return { status: "ambiguous", reasons, matches, coverageBoundary, dataset };
        if (!matches.length) return { status: "unavailable", reason: "coverage_gap" };
        return { status: "resolved", unit: matches[0].unit, dataset };
      } catch { return { status: "unavailable", reason: "geometry_error" }; }
    },
  };
}

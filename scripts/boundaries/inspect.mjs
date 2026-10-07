// @ts-check
import { createHash } from "node:crypto";
import { topologyError } from "./topology.mjs";

/** @typedef {import('../../src/lib/administrative-boundary').BoundaryManifest} BoundaryManifest */
/** @typedef {import('../../src/lib/administrative-boundary').BoundaryBounds} Bounds */
/** @typedef {{ code: string, message: string, featureIndex?: number }} Issue */
/** @param {unknown} value @returns {value is Record<string, unknown>} */
const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
/** @param {unknown} value @returns {value is string} */
const text = (value) => typeof value === "string" && value.trim().length > 0;
/** @param {unknown} value @returns {value is string} */
const code = (value) => text(value) && value.isWellFormed() && value === value.trim() && !/[\s\u0000-\u001f\u007f]/u.test(value);
/** @param {unknown} value @returns {value is string} */
const hash = (value) => typeof value === "string" && /^[a-f0-9]{64}$/u.test(value);
/** @param {string | Buffer} value */
export const sha256 = (value) => createHash("sha256").update(value).digest("hex");
/** @param {unknown} value */
export const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

/** Validate the manifest shape separately from completeness/qualification. Unknowns must be null. */
/** @param {unknown} value @returns {{ manifest: BoundaryManifest | null, issues: Issue[] }} */
export function validateManifest(value) {
  /** @type {Issue[]} */
  const issues = [];
  /** @param {boolean} valid @param {string} path */
  const expect = (valid, path) => {
    if (!valid) issues.push({ code: "invalid-manifest", message: `Invalid or missing ${path}` });
  };
  /** @param {unknown} item */
  const nullableText = (item) => item === null || text(item);
  /** @param {unknown} item */
  const date = (item) => item === null || (typeof item === "string" && /^\d{4}-\d{2}-\d{2}$/u.test(item) &&
    Number.isFinite(Date.parse(item)) && new Date(item).toISOString().slice(0, 10) === item);
  /** @param {unknown} items */
  const checksums = (items) => Array.isArray(items) && items.length > 0 && items.every((item) =>
    record(item) && text(item.path) && !item.path.includes("\\") &&
    !item.path.startsWith("/") && !item.path.includes(":") &&
    item.path.split("/").every((part) => part !== ".." && part !== "." && part !== "") && hash(item.sha256)) &&
    new Set(items.map((item) => item.path)).size === items.length;
  if (!record(value)) return { manifest: null, issues: [{ code: "invalid-manifest", message: "Manifest must be an object" }] };
  expect(value.schemaVersion === 1, "schemaVersion (1)");
  expect(code(value.codeNamespace) && /^[a-z0-9][a-z0-9.-]*$/u.test(value.codeNamespace), "codeNamespace");
  const d = record(value.dataset) ? value.dataset : {};
  expect(text(d.id), "dataset.id");
  for (const key of ["publisher", "sourceReference", "version", "attribution"]) expect(nullableText(d[key]), `dataset.${key}`);
  const dates = record(d.dates) ? d.dates : {};
  for (const key of ["published", "effective", "retrieved"]) expect(date(dates[key]), `dataset.dates.${key}`);
  expect(checksums(d.artifacts), "dataset.artifacts (nonempty, unique paths and SHA-256)");
  const license = record(d.license) ? d.license : {};
  expect(["unspecified", "unresolved", "specified"].includes(String(license.status)), "dataset.license.status");
  expect(nullableText(license.reference), "dataset.license.reference");
  expect(nullableText(license.terms), "dataset.license.terms");
  if (license.status === "specified") expect(text(license.reference) && text(license.terms), "specified license evidence and terms");
  const coverage = record(d.coverage) ? d.coverage : {};
  expect(coverage.countryCode === "TH" && coverage.area === "Bangkok", "dataset.coverage (TH/Bangkok)");
  expect(coverage.level === "khet" || coverage.level === "khwaeng", "dataset.coverage.level");
  const crs = record(d.sourceCrs) ? d.sourceCrs : {};
  for (const key of ["definition", "authorityCode", "evidence"]) expect(nullableText(crs[key]), `dataset.sourceCrs.${key}`);
  expect(Array.isArray(d.knownLimitations) && d.knownLimitations.every(text), "dataset.knownLimitations");
  expect(Array.isArray(d.transformations), "dataset.transformations");
  if (Array.isArray(d.transformations)) for (const [i, step] of d.transformations.entries()) {
    expect(record(step) && ["tool", "version", "operation", "evidence"].every((key) => text(step[key])) &&
      checksums(step.inputChecksums) && nullableText(step.sourceCrs) && nullableText(step.targetCrs), `dataset.transformations[${i}]`);
  }
  const fields = record(value.fields) ? value.fields : {};
  expect(text(fields.code) && text(fields.nameTh), "fields.code/nameTh");
  expect(nullableText(fields.nameEn) && nullableText(fields.parentCode), "fields.nameEn/parentCode");
  if (coverage.level === "khwaeng") expect(text(fields.parentCode), "fields.parentCode for khwaeng");
  if (coverage.level === "khet") expect(fields.parentCode === null, "fields.parentCode must be null for khet");
  const mappings = Object.values(fields).filter(text);
  expect(new Set(mappings).size === mappings.length, "distinct field mappings");
  const input = record(value.inputCoordinates) ? value.inputCoordinates : {};
  expect(["unverified", "verified-wgs84-longitude-latitude", "requires-transformation"].includes(String(input.status)), "inputCoordinates.status");
  expect(nullableText(input.evidence), "inputCoordinates.evidence");
  if (input.status === "verified-wgs84-longitude-latitude") {
    expect(text(input.evidence) && text(crs.evidence) && (text(crs.definition) || text(crs.authorityCode)), "verified CRS/axis-order evidence");
  }
  const parent = value.parentInventory;
  expect(parent === null || (record(parent) && ["datasetId", "version", "sourceReference"].every((key) => text(parent[key])) &&
    hash(parent.sha256) && Array.isArray(parent.codes) && parent.codes.length > 0 && parent.codes.every(code) &&
    new Set(parent.codes).size === parent.codes.length), "parentInventory (null or sourced unique string codes)");
  const count = value.observedFeatureCount;
  expect(count === null || (record(count) && typeof count.count === "number" && Number.isSafeInteger(count.count) &&
    count.count > 0 && text(count.evidence)), "observedFeatureCount");
  const parentCount = value.observedParentCount;
  expect(parentCount == null || (record(parentCount) && typeof parentCount.count === "number" &&
    Number.isSafeInteger(parentCount.count) && parentCount.count > 0 && text(parentCount.evidence)), "observedParentCount");
  const encoding = value.sourceEncoding;
  expect(encoding == null || (record(encoding) && text(encoding.label) && text(encoding.artifactPath) && text(encoding.evidence) &&
    Array.isArray(d.artifacts) && d.artifacts.some((a) => record(a) && a.path === encoding.artifactPath)), "sourceEncoding (checksummed metadata reference)");
  return { manifest: issues.length ? null : /** @type {BoundaryManifest} */ (/** @type {unknown} */ (value)), issues };
}

/** @param {BoundaryManifest} manifest @returns {Issue[]} */
export function metadataIssues(manifest) {
  const d = manifest.dataset;
  /** @type {Issue[]} */
  const issues = [];
  for (const key of /** @type {const} */ (["publisher", "sourceReference", "version", "attribution"])) {
    if (d[key] === null) issues.push({ code: "unknown-metadata", message: `dataset.${key} is unknown` });
  }
  for (const key of /** @type {const} */ (["published", "effective", "retrieved"])) {
    if (d.dates[key] === null) issues.push({ code: "unknown-metadata", message: `dataset.dates.${key} is unknown` });
  }
  if (d.license.status !== "specified") issues.push({ code: "unresolved-license", message: `License is ${d.license.status}; no permission is inferred` });
  if (d.sourceCrs.definition === null && d.sourceCrs.authorityCode === null) issues.push({ code: "unknown-crs", message: "Source CRS is unknown" });
  if (d.coverage.level === "khwaeng" && manifest.parentInventory === null) issues.push({ code: "unchecked-hierarchy", message: "No sourced parent inventory supplied; parent membership cannot be checked" });
  return issues;
}

/** @param {unknown} geometry */
export function inspectGeometry(geometry) {
  /** @type {string[]} */
  const errors = [];
  /** @type {Bounds | null} */
  let bounds = null;
  let holes = 0;
  let parts = 0;
  let positions = 0;
  let outsideWgs84Range = false;
  if (!record(geometry) || !["Polygon", "MultiPolygon"].includes(String(geometry.type))) {
    return { errors: ["Expected Polygon or MultiPolygon geometry"], bounds, holes, parts, positions, outsideWgs84Range };
  }
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  if (!Array.isArray(polygons) || polygons.length === 0) errors.push("Empty or malformed polygon parts");
  else for (const polygon of polygons) {
    parts++;
    if (!Array.isArray(polygon) || polygon.length === 0) { errors.push("Polygon has no rings"); continue; }
    holes += polygon.length - 1;
    for (const ring of polygon) {
      if (!Array.isArray(ring) || ring.length < 4) { errors.push("Ring requires at least four positions"); continue; }
      let valid = true;
      for (const position of ring) {
        if (!Array.isArray(position) || position.length !== 2 || !position.every((n) => typeof n === "number" && Number.isFinite(n))) {
          errors.push("Expected finite two-dimensional positions; extra dimensions require an explicit conversion"); valid = false; continue;
        }
        const [x, y] = position;
        positions++;
        outsideWgs84Range ||= Math.abs(x) > 180 || Math.abs(y) > 90;
        if (bounds === null) bounds = [x, y, x, y];
        else bounds = [Math.min(bounds[0], x), Math.min(bounds[1], y), Math.max(bounds[2], x), Math.max(bounds[3], y)];
      }
      if (valid) {
        if (ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1]) errors.push("Ring is not closed");
        if (new Set(ring.map((p) => `${p[0]},${p[1]}`)).size < 3) errors.push("Ring has fewer than three distinct positions");
        // This detects zero area only. It is NOT a topology/self-intersection test.
        const origin = ring[0];
        const area = ring.slice(1).reduce((sum, p, i) => sum +
          (ring[i][0] - origin[0]) * (p[1] - origin[1]) - (p[0] - origin[0]) * (ring[i][1] - origin[1]), 0);
        if (!Number.isFinite(area) || area === 0) errors.push("Ring has zero or non-finite signed area");
      }
    }
  }
  return { errors: [...new Set(errors)], bounds, holes, parts, positions, outsideWgs84Range };
}

/** Stable injective namespacing; codes are never coerced or trimmed. */
/** @param {string} namespace @param {'khet' | 'khwaeng'} level @param {string} officialCode
 * @returns {import('../../src/lib/administrative-boundary').AdministrativeUnitId} */
export const unitId = (namespace, level, officialCode) => `${namespace}:${level}:${encodeURIComponent(officialCode)}`;

/** Structural inspection is deliberately separate from canonical qualification. */
/** @param {unknown} source @param {BoundaryManifest | null} manifest */
export function inspectGeoJson(source, manifest) {
  /** @type {Issue[]} */
  const issues = [];
  /** @type {import('../../src/lib/administrative-boundary').AdministrativeBoundary[]} */
  const boundaries = [];
  /** @type {Map<string, Set<string>>} */
  const schema = new Map();
  /** @type {Map<string, number>} */
  const geometryTypes = new Map();
  /** @type {Map<string, { name: unknown, parent: unknown }>} */
  const identities = new Map();
  /** @type {Set<string>} */
  const parents = new Set();
  /** @type {Bounds | null} */
  let bounds = null;
  let nullGeometries = 0, holes = 0, parts = 0, positions = 0;
  let validTopology = 0;
  /** @param {string} code @param {string} message @param {number} [featureIndex] */
  const issue = (code, message, featureIndex) => issues.push({ code, message, ...(featureIndex === undefined ? {} : { featureIndex }) });
  const features = record(source) && source.type === "FeatureCollection" && Array.isArray(source.features) ? source.features : [];
  if (!record(source) || source.type !== "FeatureCollection" || !Array.isArray(source.features)) issue("invalid-geojson", "Expected a GeoJSON FeatureCollection");
  if (!features.length) issue("empty-dataset", "No features available");
  // Legacy crs declarations need external interpretation; never let an attestation override a conflicting header.
  if (record(source) && Object.hasOwn(source, "crs")) issue("legacy-crs", "Explicit GeoJSON crs member requires reviewed conversion to RFC 7946; no CRS parsing is available");
  if (manifest?.observedFeatureCount && features.length !== manifest.observedFeatureCount.count) issue("feature-count-mismatch", "Count differs from this release's observed expectation");
  if (manifest && manifest.inputCoordinates.status !== "verified-wgs84-longitude-latitude") issue("unverified-crs", "GeoJSON candidate requires verified WGS84 longitude/latitude input");
  for (const [index, feature] of features.entries()) {
    const initialIssues = issues.length;
    if (!record(feature) || feature.type !== "Feature") { issue("invalid-feature", "Expected a Feature object", index); continue; }
    if (Object.hasOwn(feature, "crs") || (record(feature.geometry) && Object.hasOwn(feature.geometry, "crs"))) issue("legacy-crs", "Nested CRS declaration requires reviewed conversion", index);
    const props = record(feature.properties) ? feature.properties : {};
    for (const [key, value] of Object.entries(props)) {
      if (!schema.has(key)) schema.set(key, new Set());
      schema.get(key)?.add(value === null ? "null" : Array.isArray(value) ? "array" : typeof value);
    }
    const type = record(feature.geometry) && typeof feature.geometry.type === "string" ? feature.geometry.type : "missing/null";
    geometryTypes.set(type, (geometryTypes.get(type) ?? 0) + 1);
    if (feature.geometry == null) nullGeometries++;
    const geometry = inspectGeometry(feature.geometry);
    for (const error of geometry.errors) issue("malformed-geometry", error, index);
    if (!geometry.errors.length) {
      const error = topologyError(feature.geometry);
      if (error) issue("invalid-topology", error, index);
      else validTopology++;
    }
    holes += geometry.holes; parts += geometry.parts; positions += geometry.positions;
    if (geometry.bounds) {
      const b = geometry.bounds;
      bounds = bounds === null ? b : [Math.min(bounds[0], b[0]), Math.min(bounds[1], b[1]), Math.max(bounds[2], b[2]), Math.max(bounds[3], b[3])];
    }
    if (geometry.outsideWgs84Range && manifest?.inputCoordinates.status === "verified-wgs84-longitude-latitude") issue("invalid-wgs84-range", "Coordinates exceed longitude/latitude bounds", index);
    if (!manifest) continue;
    const fields = manifest.fields, level = manifest.dataset.coverage.level;
    const officialCode = props[fields.code], nameTh = props[fields.nameTh];
    const parent = fields.parentCode === null ? null : props[fields.parentCode];
    if (code(parent)) parents.add(parent);
    const nameEn = fields.nameEn === null ? undefined : props[fields.nameEn];
    if (!code(officialCode)) issue("missing-code", "Official code must be a nonempty string without whitespace; numeric codes are not coerced", index);
    if (!text(nameTh)) issue("missing-thai-name", "Missing sourced Thai name", index);
    if (level === "khwaeng" && !code(parent)) issue("missing-parent", "Khwaeng requires a string parent khet code", index);
    if (nameEn != null && !text(nameEn)) issue("invalid-english-name", "English name must be sourced text or absent", index);
    if (code(parent) && manifest.parentInventory && !manifest.parentInventory.codes.includes(parent)) issue("unknown-parent", "Parent code is absent from the supplied khet inventory", index);
    if (code(officialCode)) {
      const id = unitId(manifest.codeNamespace, level, officialCode);
      const previous = identities.get(id);
      if (previous) {
        issue("duplicate-code", `Duplicate official code: ${officialCode}`, index);
        issue("duplicate-identity", `Duplicate administrative identity: ${id}`, index);
        if (previous.name !== nameTh || previous.parent !== parent) issue("inconsistent-identity", "Same identity has conflicting name or parent", index);
      } else identities.set(id, { name: nameTh, parent });
      if (issues.length === initialIssues && text(nameTh) && geometry.bounds && manifest.dataset.version &&
        manifest.inputCoordinates.status === "verified-wgs84-longitude-latitude" &&
        !(record(source) && Object.hasOwn(source, "crs"))) {
        const identity = { id, officialCode, codeNamespace: manifest.codeNamespace, nameTh, ...(text(nameEn) ? { nameEn } : {}) };
        const unit = level === "khwaeng"
          ? { ...identity, level, parentId: unitId(manifest.codeNamespace, "khet", /** @type {string} */ (parent)) }
          : { ...identity, level };
        boundaries.push({ unit, dataset: { id: manifest.dataset.id, version: manifest.dataset.version },
          geometry: /** @type {import('../../src/lib/administrative-boundary').BoundaryGeometry} */ ({
            type: /** @type {Record<string, unknown>} */ (feature.geometry).type,
            coordinates: /** @type {Record<string, unknown>} */ (feature.geometry).coordinates,
          }),
          bounds: geometry.bounds, provenance: { sourceFeatureIndex: index, generalization: "unknown" } });
      }
    }
  }
  if (manifest?.observedParentCount && parents.size !== manifest.observedParentCount.count) issue("parent-count-mismatch", "Unique parent count differs from this release's observation");
  return {
    issues, boundaries,
    summary: { featureCount: features.length, schema: Object.fromEntries([...schema].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, types]) => [key, [...types].sort()])),
      geometryTypes: Object.fromEntries([...geometryTypes].sort()), bounds, nullGeometries, holes, parts, positions,
      declaredCrs: record(source) ? source.crs ?? null : null,
      hierarchy: manifest?.parentInventory ? "parent-code-membership-only" : "unchecked",
      identities: manifest ? {
        uniqueCodes: identities.size, uniqueParentCodes: parents.size,
        missingCodes: issues.filter((i) => i.code === "missing-code").length,
        missingNames: issues.filter((i) => i.code === "missing-thai-name").length,
        missingParents: issues.filter((i) => i.code === "missing-parent").length,
        inconsistentIdentities: issues.filter((i) => i.code === "inconsistent-identity").length,
      } : null,
      topology: validTopology === features.length && features.length > 0 ? "valid-per-feature" : "invalid-or-unchecked",
      validTopologyCount: validTopology },
  };
}

/** @param {BoundaryManifest | null} manifest */
export function activationBlockers(manifest) {
  return [
    "The local importer cannot activate datasets; a separate reviewed, versioned canonical qualification is required",
    "Per-feature topology validation does not establish dataset overlaps/gaps or coverage",
    "BMA khwaeng-to-khet spatial validation and independent GISTDA khet comparison are pending",
    "Source identity, CRS evidence, Thai encoding/names and inventory completeness require manual verification",
    ...(manifest?.dataset.license.status !== "specified" ? ["License terms remain unresolved/unspecified"] : ["License suitability for intended use requires review"]),
  ];
}

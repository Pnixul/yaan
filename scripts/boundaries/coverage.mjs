// @ts-check
import GeoJSONReader from "jsts/org/locationtech/jts/io/GeoJSONReader.js";
import IsValidOp from "jsts/org/locationtech/jts/operation/valid/IsValidOp.js";
import OverlayOp from "jsts/org/locationtech/jts/operation/overlay/OverlayOp.js";
import { signedArea, topologyError } from "./topology.mjs";

/** @typedef {import('jsts/org/locationtech/jts/geom/Geometry.js').default} Geometry */
/** @param {unknown} error */
const message = (error) => error instanceof Error ? error.message : String(error);
/** @param {Geometry} geometry */
function bounds(geometry) {
  const e = geometry.getEnvelopeInternal();
  return [e.getMinX(), e.getMinY(), e.getMaxX(), e.getMaxY()];
}
/** Use direct overlay, without JSTS's automatic snap/buffer fallbacks.
 * A numerical failure is an unavailable check, never a clean result.
 * @param {Geometry} a @param {Geometry} b @param {number} operation */
function overlay(a, b, operation) {
  const result = OverlayOp.overlayOp(a, b, operation);
  if (!new IsValidOp(result).isValid() || !Number.isFinite(result.getArea())) throw new Error("Invalid overlay result");
  return result;
}
/** Deterministic balanced union limits intermediate geometry growth.
 * @param {Geometry[]} geometries @returns {Geometry} */
function union(geometries) {
  if (geometries.length === 1) return geometries[0];
  const middle = Math.floor(geometries.length / 2);
  return overlay(union(geometries.slice(0, middle)), union(geometries.slice(middle)), OverlayOp.UNION);
}

/** Diagnostic measurements, not a coverage certificate or a repair operation.
 * Call with structurally valid polygons in the stated coordinate system.
 * @param {unknown[]} geometries @param {'EPSG:32647' | 'OGC:CRS84'} crs */
export function inspectCoverage(geometries, crs) {
  /** @type {{featureIndices: number[], area: number, bounds: number[]}[]} */
  const overlaps = [];
  /** @type {{featureIndices: number[], message: string}[]} */
  const errors = [];
  /** @type {{area: number, bounds: number[]}[] | null} */
  let enclosedVoids = null;
  /** @type {number | null} */
  let unionArea = null;
  /** @type {number | null} */
  let components = null;
  let checkedPairs = 0, envelopeExcludedPairs = 0;
  try {
    if (!geometries.length || geometries.some((g) => topologyError(g))) throw new Error("Requires nonempty, valid per-feature polygon geometry");
    const parsed = geometries.map((g) => new GeoJSONReader().read(g));
    for (let i = 0; i < parsed.length; i++) for (let j = i + 1; j < parsed.length; j++) {
      if (!parsed[i].getEnvelopeInternal().intersects(parsed[j].getEnvelopeInternal())) { envelopeExcludedPairs++; continue; }
      try {
        const intersection = overlay(parsed[i], parsed[j], OverlayOp.INTERSECTION);
        checkedPairs++;
        // Line/point contact has no polygon area. No invented sliver tolerance.
        const area = intersection.getArea();
        if (area > 0) overlaps.push({ featureIndices: [i, j], area, bounds: bounds(intersection) });
      } catch (error) { errors.push({ featureIndices: [i, j], message: message(error) }); }
    }
    try {
      const combined = union(parsed);
      const voids = [];
      for (let p = 0; p < combined.getNumGeometries(); p++) {
        const polygon = combined.getGeometryN(p);
        for (let h = 0; h < polygon.getNumInteriorRing(); h++) {
          const ring = polygon.getInteriorRingN(h);
          voids.push({ area: Math.abs(signedArea(ring.getCoordinates().map(({ x, y }) => [x, y]))) / 2, bounds: bounds(ring) });
        }
      }
      unionArea = combined.getArea();
      components = combined.getNumGeometries();
      enclosedVoids = voids;
    } catch (error) { errors.push({ featureIndices: [], message: `Union/gap diagnostic unavailable: ${message(error)}` }); }
  } catch (error) { errors.push({ featureIndices: [], message: message(error) }); }
  return {
    status: errors.length ? "incomplete" : "measured",
    coordinateReferenceSystem: crs,
    areaUnit: crs === "EPSG:32647" ? "square-metres-projected" : "square-degrees-not-ground-area",
    method: "JSTS direct pairwise intersection and balanced union; envelope exclusion; no snapping, repair, simplification or tolerance",
    checkedPairs, envelopeExcludedPairs, overlaps, enclosedVoids, unionArea, components, errors,
    coverage: { status: "unverified", reason: "No independently qualified Bangkok coverage reference supplied. Enclosed voids may be legitimate exclusions; exterior-connected gaps and missing territory cannot be identified from this dataset alone." },
  };
}

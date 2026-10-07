// @ts-check
import GeoJSONReader from "jsts/org/locationtech/jts/io/GeoJSONReader.js";
import IsValidOp from "jsts/org/locationtech/jts/operation/valid/IsValidOp.js";

/** Run only after structural validation. Validation never repairs or mutates input.
 * @param {unknown} geometry @returns {string | null} */
export function topologyError(geometry) {
  try {
    const operation = new IsValidOp(new GeoJSONReader().read(geometry));
    return operation.isValid() ? null : operation.getValidationError()?.toString() ?? "Invalid topology";
  } catch (error) {
    return error instanceof Error ? error.message : "Topology validation failed";
  }
}

/** Translation avoids cancellation for small rings in large projected coordinates.
 * @param {number[][]} ring */
export function signedArea(ring) {
  const [x, y] = ring[0];
  return ring.slice(1).reduce((sum, p, i) => sum +
    (ring[i][0] - x) * (p[1] - y) - (p[0] - x) * (ring[i][1] - y), 0);
}

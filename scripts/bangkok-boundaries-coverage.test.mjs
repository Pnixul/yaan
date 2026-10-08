import assert from "node:assert/strict";
import test from "node:test";
import { inspectCoverage } from "./boundaries/coverage.mjs";

const rectangle = (x, y, w, h) => ({ type: "Polygon", coordinates: [[[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]] });

test("shared edges and point contacts are not overlaps; coverage never becomes verified", () => {
  const result = inspectCoverage([rectangle(0, 0, 1, 1), rectangle(1, 0, 1, 1), rectangle(2, 1, 1, 1)], "EPSG:32647");
  assert.equal(result.status, "measured");
  assert.deepEqual(result.overlaps, []);
  assert.deepEqual(result.enclosedVoids, []);
  assert.equal(result.unionArea, 3);
  assert.equal(result.components, 2);
  assert.equal(result.checkedPairs + result.envelopeExcludedPairs, 3);
  assert.equal(result.coverage.status, "unverified");
});

test("overlapping, contained and duplicate features have auditable positive intersection areas", () => {
  const shapes = [rectangle(500000, 1500000, 10, 10), rectangle(500005, 1500000, 10, 10), rectangle(500001, 1500001, 1, 1)];
  const original = structuredClone(shapes);
  const result = inspectCoverage(shapes, "EPSG:32647");
  assert.equal(result.status, "measured");
  assert.deepEqual(result.overlaps.map(({ featureIndices, area }) => ({ featureIndices, area })), [
    { featureIndices: [0, 1], area: 50 }, { featureIndices: [0, 2], area: 1 },
  ]);
  assert.equal(result.unionArea, 150);
  assert.deepEqual(shapes, original);
  assert.deepEqual(inspectCoverage(shapes, "EPSG:32647"), result);
  assert.equal(inspectCoverage([shapes[0], shapes[0]], "EPSG:32647").overlaps[0].area, 100);
});

test("union holes are gap observations, including gaps between individually hole-free features", () => {
  const frame = [rectangle(0, 0, 3, 1), rectangle(0, 2, 3, 1), rectangle(0, 1, 1, 1), rectangle(2, 1, 1, 1)];
  const result = inspectCoverage(frame, "EPSG:32647");
  assert.deepEqual(result.enclosedVoids, [{ area: 1, bounds: [1, 1, 2, 2] }]);
  assert.equal(result.unionArea, 8);
  const filled = inspectCoverage([...frame, rectangle(1, 1, 1, 1)], "EPSG:32647");
  assert.deepEqual(filled.enclosedVoids, []);
  const open = inspectCoverage(frame.slice(1), "EPSG:32647");
  assert.deepEqual(open.enclosedVoids, []);
  assert.equal(open.coverage.status, "unverified");
});

test("holes and disconnected MultiPolygon parts survive measurement without ground-area claims for GeoJSON", () => {
  const outer = rectangle(0, 0, 4, 4).coordinates;
  outer.push(rectangle(1, 1, 1, 1).coordinates[0].reverse());
  const result = inspectCoverage([{ type: "MultiPolygon", coordinates: [outer, rectangle(10, 0, 1, 1).coordinates] }], "OGC:CRS84");
  assert.equal(result.components, 2);
  assert.equal(result.unionArea, 16);
  assert.equal(result.enclosedVoids[0].area, 1);
  assert.equal(result.areaUnit, "square-degrees-not-ground-area");
});

test("empty or invalid inputs leave measurements unavailable, never clean zero values", () => {
  for (const shapes of [[], [null], [{ type: "Polygon", coordinates: [[[0, 0], [2, 2], [2, 0], [0, 2], [0, 0]]] }]]) {
    const result = inspectCoverage(shapes, "EPSG:32647");
    assert.equal(result.status, "incomplete");
    assert.equal(result.unionArea, null);
    assert.equal(result.enclosedVoids, null);
    assert.ok(result.errors.length);
  }
});

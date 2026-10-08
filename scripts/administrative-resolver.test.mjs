import assert from "node:assert/strict";
import { test } from "node:test";
import { loadAdministrativeModule as load } from "./test-support/administrative-modules.mjs";
const { createAdministrativeResolver } = load("./resolver/core.ts");
const { syntheticResolverDataset, rectangle } = load("./fixtures/administrative-resolver.ts");
const resolver = (dataset = syntheticResolverDataset()) => createAdministrativeResolver({ getDataset: () => dataset });
const at = (instance, longitude, latitude) => instance.resolve({ latitude, longitude });
// VM objects use a different prototype, so compare the public JSON contract.
const plain = (value) => JSON.parse(JSON.stringify(value));

test("inside resolves stable IDs, sourced Thai names and explicit synthetic provenance", () => {
  const result = at(resolver(), 3, 4);
  assert.equal(result.status, "resolved");
  assert.equal(result.unit.id, "synthetic-yaan:khwaeng:a");
  assert.equal(result.unit.parentId, "synthetic-yaan:khet:parent");
  assert.equal(result.unit.nameTh, "แขวงทดสอบ ก (สังเคราะห์)");
  assert.equal(result.unit.nameEn, undefined);
  assert.equal(result.dataset.version, "1");
  assert.equal(result.dataset.qualification.status, "synthetic");
  assert.equal(result.dataset.official, false);
  assert.equal(result.dataset.activation.eligible, false);
  assert.equal(result.geometry, undefined);
  assert.equal(result.latitude, undefined);
});

test("declared coverage distinguishes unsupported locations from holes and missing unit coverage", () => {
  const core = resolver();
  assert.equal(at(core, 11, 4).status, "outside_coverage");
  assert.deepEqual(plain(at(core, 1.5, 1.5)), { status: "unavailable", reason: "coverage_gap" });
  const data = syntheticResolverDataset();
  data.boundaries.pop();
  assert.equal(at(resolver(data), 7, 4).reason, "coverage_gap");
  // An explicit coverage exclusion is outside coverage, not an inferred gap.
  data.coverageGeometry = data.boundaries[0].geometry;
  assert.equal(at(resolver(data), 1.5, 1.5).status, "outside_coverage");
});

test("shared borders, vertices, outer borders and hole edges never choose a unit", () => {
  const core = resolver();
  for (const [lon, lat] of [[5, 4], [5, 0], [0, 4], [0, 0], [1, 1.5], [1, 1]]) {
    const result = at(core, lon, lat);
    assert.equal(result.status, "ambiguous");
    assert.deepEqual(plain(result.reasons), ["boundary"]);
    assert.equal(result.unit, undefined);
  }
  assert.equal(at(core, 5, 4).matches.length, 2);
  assert.equal(at(core, 5, 0).coverageBoundary, true);
  assert.equal(at(core, 1, 1.5).coverageBoundary, false);
  assert.equal(at(core, 1, 1.5).matches.length, 1);
  const data = syntheticResolverDataset();
  data.boundaries = [data.boundaries[0]];
  const noUnit = at(resolver(data), 10, 4);
  assert.equal(noUnit.status, "ambiguous");
  assert.equal(noUnit.coverageBoundary, true);
  assert.equal(noUnit.matches.length, 0);
});

test("overlap and boundary/interior combinations are ambiguous and independent of source order", () => {
  const data = syntheticResolverDataset();
  data.boundaries[1].geometry = rectangle(3, 0, 10, 10);
  const forward = at(resolver(data), 4, 4);
  assert.equal(forward.status, "ambiguous");
  assert.deepEqual(plain(forward.reasons), ["overlap"]);
  assert.equal(forward.matches.length, 2);
  const mixed = at(resolver(data), 3, 4);
  assert.equal(mixed.status, "ambiguous");
  assert.deepEqual(plain(mixed.matches.map((m) => m.relation)), ["interior", "boundary"]);
  data.boundaries.reverse();
  assert.deepEqual(plain(at(resolver(data), 4, 4)), plain(forward));
});

test("MultiPolygon islands, holes, reversed winding and close boundary points", () => {
  const data = syntheticResolverDataset();
  data.boundaries = [data.boundaries[0]];
  data.boundaries[0].geometry = { type: "MultiPolygon", coordinates: [
    data.boundaries[0].geometry.coordinates,
    rectangle(6, 1, 7, 2).coordinates,
  ] };
  const core = resolver(data);
  assert.equal(at(core, 6.5, 1.5).status, "resolved");
  assert.equal(at(core, 1.5, 1.5).reason, "coverage_gap");
  assert.equal(at(core, 5 - 1e-10, 4).status, "resolved");
  assert.equal(at(core, 5 + 1e-10, 4).reason, "coverage_gap");
  for (const polygon of data.boundaries[0].geometry.coordinates) for (const ring of polygon) ring.reverse();
  assert.deepEqual(plain(at(resolver(data), 6.5, 1.5)), plain(at(core, 6.5, 1.5)));
});

test("strict coordinate validation precedes dataset errors; no coercion, swapping or clamping", () => {
  const core = resolver(null);
  for (const input of [null, [], [3, 4], {}, { latitude: 3 }, { lat: 3, lon: 4 },
    { latitude: "3", longitude: 4 }, { latitude: NaN, longitude: 4 },
    { latitude: 3, longitude: Infinity }, { latitude: 91, longitude: 4 },
    { latitude: -91, longitude: 4 }, { latitude: 3, longitude: 181 },
    { latitude: 3, longitude: -181 }, { latitude: 3, longitude: 4, accuracy: 1 },
    Object.assign(Object.create({ latitude: 3, longitude: 4 }), { extra: 1, other: 2 })]) {
    assert.equal(core.resolve(input).status, "invalid_input");
  }
  for (const [lon, lat] of [[180, 90], [-180, -90], [0, 0]]) assert.equal(at(core, lon, lat).reason, "no_dataset");
  // An asymmetric fixture demonstrates actual named-field/GeoJSON axis order.
  const data = syntheticResolverDataset();
  data.coverageGeometry = rectangle(30, 1, 35, 3);
  data.boundaries = [{ ...data.boundaries[0], geometry: data.coverageGeometry }];
  assert.equal(at(resolver(data), 32, 2).status, "resolved");
  assert.equal(at(resolver(data), 2, 32).status, "outside_coverage");
});

test("missing data, provider errors and every non-synthetic activation state fail closed", () => {
  assert.equal(at(resolver(null), 3, 4).reason, "no_dataset");
  const unavailable = createAdministrativeResolver({ getDataset() { throw new Error("private provider detail"); } });
  assert.deepEqual(plain(at(unavailable, 3, 4)), { status: "unavailable", reason: "provider_error" });
  for (const mutate of [
    (d) => { d.provenance.qualification.status = "unqualified"; },
    (d) => { d.provenance.qualification.status = "qualified"; },
    (d) => { d.provenance.activation.eligible = true; },
    (d) => { d.provenance.official = true; },
  ]) {
    const data = syntheticResolverDataset(); mutate(data);
    assert.equal(at(resolver(data), 3, 4).reason, "dataset_not_enabled");
  }
  // Shape of an inactive candidate is incompatible; no real file is read.
  assert.equal(at(resolver({ stage: "normalized-candidate", activation: { eligible: false } }), 3, 4).reason, "dataset_not_enabled");
});

test("missing provenance/identity, duplicate IDs and mixed levels invalidate the whole snapshot", () => {
  for (const mutate of [
    (d) => { d.provenance.version = null; },
    (d) => { d.provenance.sourceReference = ""; },
    (d) => { d.provenance.publisher = null; },
    (d) => { d.provenance.coverage = null; },
    (d) => { d.provenance.knownLimitations = []; },
    (d) => { d.boundaries = []; },
    (d) => { d.boundaries[0].unit.nameTh = null; },
    (d) => { d.boundaries[0].unit.parentId = null; },
    (d) => { d.boundaries[0].unit.id = "wrong:id"; },
    (d) => { d.boundaries[0].unit.codeNamespace = "bma"; },
    (d) => { d.boundaries.push(d.boundaries[0]); },
    (d) => { d.boundaries[0].unit.level = "khet"; },
  ]) {
    const data = syntheticResolverDataset(); mutate(data);
    assert.equal(at(resolver(data), 11, 4).reason, "invalid_dataset");
  }
});

test("malformed, self-intersecting, misprojected or out-of-coverage geometry is unavailable", () => {
  const geometries = [null, {}, { type: "Point", coordinates: [1, 1] },
    { type: "Polygon", coordinates: [] }, { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1]]] },
    { type: "Polygon", coordinates: [[[0, 0], [4, 4], [4, 0], [0, 3], [0, 0]]] },
    { type: "Polygon", coordinates: [[[0, 0], [1, 0], [2, 0], [0, 0]]] },
    { type: "Polygon", coordinates: [[[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 0, 1]]] },
    { type: "Polygon", coordinates: [[[0, 0], [NaN, 0], [1, 1], [0, 0]]] },
    rectangle(0, 0, 1000, 1000), rectangle(-170, 0, 170, 1), rectangle(0, 0, 11, 1),
    { type: "Polygon", coordinates: [rectangle(0, 0, 2, 2).coordinates[0], rectangle(3, 3, 4, 4).coordinates[0]] },
    { type: "MultiPolygon", coordinates: [rectangle(0, 0, 4, 4).coordinates, rectangle(2, 2, 5, 5).coordinates] },
  ];
  for (const geometry of geometries) {
    const data = syntheticResolverDataset(); data.boundaries[0].geometry = geometry;
    assert.equal(at(resolver(data), 8, 4).reason, "invalid_dataset");
  }
  const data = syntheticResolverDataset(); data.coordinateReferenceSystem = "EPSG:32647";
  assert.equal(at(resolver(data), 3, 4).reason, "invalid_dataset");
  data.coordinateReferenceSystem = "OGC:CRS84"; data.coverageGeometry = null;
  assert.equal(at(resolver(data), 3, 4).reason, "invalid_dataset");
});

test("snapshot and returned objects are isolated, repeatable, and khet datasets need no invented parent", () => {
  const data = syntheticResolverDataset();
  let reads = 0;
  const core = createAdministrativeResolver({ getDataset() { reads++; return data; } });
  const original = plain(at(core, 3, 4));
  data.boundaries.length = 0;
  const returned = at(core, 3, 4);
  returned.unit.nameTh = "changed";
  returned.dataset.qualification.status = "qualified";
  assert.deepEqual(plain(at(core, 3, 4)), original);
  assert.equal(reads, 1);
  const khet = syntheticResolverDataset();
  khet.provenance.coverage.level = "khet";
  for (const { unit } of khet.boundaries) {
    unit.level = "khet"; unit.id = unit.id.replace(":khwaeng:", ":khet:"); delete unit.parentId;
  }
  assert.equal(at(resolver(khet), 3, 4).unit.level, "khet");
});

test("geometry-engine failure returns a generic unavailable state without provider details", () => {
  const name = "jsts/org/locationtech/jts/algorithm/locate/SimplePointInAreaLocator.js";
  const { createAdministrativeResolver: create } = load("./resolver/core.ts", {
    [name]: { default: { locate() { throw new Error("sensitive internal detail"); } } },
  });
  assert.deepEqual(plain(at(create({ getDataset: syntheticResolverDataset }), 3, 4)), { status: "unavailable", reason: "geometry_error" });
});

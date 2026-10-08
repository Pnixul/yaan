import assert from "node:assert/strict";
import { test } from "node:test";
import { inspectGeometry, json, sha256 } from "./boundaries/inspect.mjs";
import { loadAdministrativeModule as load } from "./test-support/administrative-modules.mjs";

const { adaptAdministrativeDataset: adapt, evaluateDatasetGate: gate } = load("./resolver/adapter.ts");
const { createAdministrativeResolver } = load("./resolver/core.ts");
const { syntheticAdapterFixture: fixture, inactiveBmaMetadata } = load("./fixtures/administrative-adapter.ts");
const { syntheticResolverDataset, rectangle } = load("./fixtures/administrative-resolver.ts");
const plain = (value) => JSON.parse(JSON.stringify(value));
function denied(result, code) {
  assert.equal(result.status, "denied");
  assert.equal(result.activation.eligible, false);
  assert.equal(result.dataset, undefined);
  assert.equal(result.diagnostics[0].code, code);
}
// Simulate independent review of a changed TEST fixture to exercise validators
// beyond hash checks. Never used by adapter/gate code or real-data workflows.
function reviewedMutation(mutate) {
  const f = fixture(); mutate(f);
  f.bundle.datasetJson = json(f.dataset);
  f.qualification.subject = { id: f.dataset.provenance.id, version: f.dataset.provenance.version, sha256: sha256(f.bundle.datasetJson) };
  f.bundle.qualificationJson = json(f.qualification);
  f.authorization.subject = { ...f.qualification.subject };
  f.authorization.qualificationSha256 = sha256(f.bundle.qualificationJson);
  return f;
}

test("separately pinned synthetic evidence admits an unchanged resolver snapshot, never production", () => {
  const f = fixture();
  assert.equal(gate(f.bundle, f.authorization).status, "evidence_accepted");
  const result = adapt(f.bundle, f.authorization);
  assert.equal(result.status, "ready_for_offline_test");
  assert.equal(result.scope, "synthetic-offline-test");
  assert.equal(result.activation.eligible, false);
  assert.equal(result.dataset.provenance.activation.eligible, false);
  assert.equal(result.dataset.provenance.official, false);
  assert.deepEqual(plain(result.dataset), plain(syntheticResolverDataset()));
  const actual = createAdministrativeResolver({ getDataset: () => result.dataset });
  const prior = createAdministrativeResolver({ getDataset: syntheticResolverDataset });
  for (const [longitude, latitude] of [[3, 4], [11, 4], [5, 4], [1, 1.5], [1.5, 1.5]]) {
    assert.deepEqual(plain(actual.resolve({ longitude, latitude })), plain(prior.resolve({ longitude, latitude })));
  }
});

test("approval is deterministic, source/returned objects are detached, audit pins bind actual text", () => {
  const f = fixture(), before = plain(f);
  const first = adapt(f.bundle, f.authorization), again = adapt(f.bundle, f.authorization);
  assert.deepEqual(plain(first), plain(again));
  assert.deepEqual(plain(f), before);
  assert.equal(first.audit.subject.sha256, sha256(f.bundle.datasetJson));
  assert.equal(first.audit.qualificationSha256, sha256(f.bundle.qualificationJson));
  first.dataset.boundaries[0].unit.nameTh = "changed";
  first.audit.subject.sha256 = "0".repeat(64);
  assert.deepEqual(plain(adapt(f.bundle, f.authorization)), plain(again));
});

test("missing or self-supplied approval, malformed authorization and production scope are denied", () => {
  const f = fixture();
  denied(adapt({ ...f.bundle, trustedAuthorization: f.authorization }, null), "missing_authorization");
  for (const trusted of [{}, [], { ...f.authorization, decision: "denied" },
    { ...f.authorization, authorizedBy: "" }, { ...f.authorization, subject: { ...f.authorization.subject, sha256: "bad" } }]) {
    assert.equal(adapt(f.bundle, trusted).status, "denied");
  }
  denied(adapt(f.bundle, { ...f.authorization, scope: "production" }), "unsupported_scope");
  const enabled = reviewedMutation(({ dataset }) => { dataset.provenance.activation.eligible = true; });
  denied(adapt(enabled.bundle, enabled.authorization), "dataset_not_inactive");
});

test("changed payload, qualification, evidence bytes and claimed hashes cannot reuse trusted pins", () => {
  for (const mutate of [
    (f) => { f.bundle.datasetJson += " "; },
    (f) => { f.bundle.qualificationJson += " "; },
    (f) => { f.bundle.evidence[0].content += " tampered"; },
    (f) => { f.bundle.evidence[1].content += " tampered"; },
    (f) => { f.bundle.evidence[2].content += " tampered"; },
    (f) => { f.qualification.license.artifact.sha256 = "0".repeat(64); f.bundle.qualificationJson = json(f.qualification); },
    (f) => {
      f.dataset.features[0].unit.nameTh = "tampered"; f.bundle.datasetJson = json(f.dataset);
      f.qualification.subject.sha256 = sha256(f.bundle.datasetJson); f.bundle.qualificationJson = json(f.qualification);
    },
  ]) { const f = fixture(); mutate(f); denied(adapt(f.bundle, f.authorization), "integrity_mismatch"); }
  const f = reviewedMutation(({ qualification }) => { qualification.license.artifact.sha256 = "0".repeat(64); });
  denied(adapt(f.bundle, f.authorization), "integrity_mismatch");
});

test("release ID/version pins and supported envelope/report versions are exact", () => {
  const f = fixture();
  f.dataset.provenance.id = "synthetic:another"; f.bundle.datasetJson = json(f.dataset);
  denied(adapt(f.bundle, f.authorization), "dataset_identity_mismatch");
  f.dataset.provenance.id = f.authorization.subject.id; f.dataset.provenance.version = "2"; f.bundle.datasetJson = json(f.dataset);
  denied(adapt(f.bundle, f.authorization), "unsupported_dataset_version");
  for (const mutate of [(f) => { f.dataset.schemaVersion = 2; }, (f) => { f.qualification.schemaVersion = 2; }]) {
    const changed = reviewedMutation(mutate); denied(adapt(changed.bundle, changed.authorization), "unsupported_schema");
  }
  const replay = fixture(); replay.qualification.subject.version = "another-release";
  replay.bundle.qualificationJson = json(replay.qualification); replay.authorization.qualificationSha256 = sha256(replay.bundle.qualificationJson);
  denied(adapt(replay.bundle, replay.authorization), "invalid_qualification");
});

test("deferred, denied, absent, boolean or unverified qualification checks deny even when pinned", () => {
  for (const mutate of [
    (f) => { f.qualification.decision = "deferred"; }, (f) => { f.qualification.decision = "denied"; },
    (f) => { delete f.qualification.decision; }, (f) => { f.qualification.reviewedBy = null; },
    ...["crs", "geometry", "coverage", "hierarchy", "names"].map((key) => (f) => { f.qualification.checks[key] = "unverified"; }),
    (f) => { f.qualification.checks.geometry = true; },
  ]) { const f = reviewedMutation(mutate); denied(adapt(f.bundle, f.authorization), "invalid_qualification"); }
});

test("authority, license and authorization evidence are all mandatory, verified and checksummed", () => {
  for (const key of ["sourceAuthority", "license", "authorization"]) {
    for (const mutate of [(f) => { delete f.qualification[key]; }, (f) => { f.qualification[key].status = "unverified"; },
      (f) => { f.bundle.evidence = f.bundle.evidence.filter((e) => e.path !== f.qualification[key].artifact.path); }]) {
      const f = reviewedMutation(mutate);
      assert.equal(adapt(f.bundle, f.authorization).status, "denied");
    }
  }
  for (const mutate of [(f) => { f.qualification.license.terms = null; }, (f) => { f.qualification.license.permittedUse = "production"; }]) {
    const f = reviewedMutation(mutate); denied(adapt(f.bundle, f.authorization), "invalid_license");
  }
});

test("ambiguous/malformed evidence bundles, invalid JSON and absent fields fail closed", () => {
  const f = fixture();
  for (const bundle of [null, {}, { ...f.bundle, datasetJson: "{" }, { ...f.bundle, datasetJson: "null" },
    { ...f.bundle, qualificationJson: "[]" }, { ...f.bundle, evidence: [...f.bundle.evidence, f.bundle.evidence[0]] },
    { ...f.bundle, evidence: [...f.bundle.evidence, { path: "extra.txt", content: "ignored?" }] }]) {
    denied(adapt(bundle, f.authorization), "malformed_bundle");
  }
  const unsafe = reviewedMutation((f) => { f.bundle.evidence[0].path = "../source.txt"; f.qualification.sourceAuthority.artifact.path = "../source.txt"; });
  denied(adapt(unsafe.bundle, unsafe.authorization), "malformed_bundle");
});

test("CRS and coordinate order are explicit; no relabeling, axis swapping or projection fallback", () => {
  for (const crs of [null, "EPSG:32647", "EPSG:4326"]) {
    const f = reviewedMutation(({ dataset }) => { dataset.coordinateReferenceSystem = crs; });
    denied(adapt(f.bundle, f.authorization), "invalid_crs");
  }
  for (const order of [undefined, "latitude-longitude"]) {
    const f = reviewedMutation(({ dataset }) => { dataset.coordinateOrder = order; });
    denied(adapt(f.bundle, f.authorization), "invalid_coordinate_order");
  }
  for (const select of [(d) => d, (d) => d.coverageGeometry, (d) => d.features[0], (d) => d.features[0].geometry]) {
    const f = reviewedMutation(({ dataset }) => { select(dataset).crs = { name: "EPSG:32647" }; });
    denied(adapt(f.bundle, f.authorization), "invalid_crs");
  }
});

test("missing or duplicate identities, inconsistent feature versions and stale bounds are rejected", () => {
  for (const [mutate, code] of [
    [(f) => { f.dataset.features[0].unit.id = null; }, "invalid_identity"],
    [(f) => { f.dataset.features[0].unit.nameTh = null; }, "invalid_identity"],
    [(f) => { f.dataset.features.push(f.dataset.features[0]); }, "invalid_identity"],
    [(f) => { f.dataset.features[0].dataset.version = "other"; }, "dataset_identity_mismatch"],
    [(f) => { f.dataset.features[0].bounds[0] = 1; }, "invalid_bounds"],
    [(f) => { f.dataset.features[1].provenance.sourceFeatureIndex = 0; }, "invalid_features"],
    [(f) => { f.dataset.provenance.sourceReference = null; }, "resolver_validation_failed"],
  ]) { const f = reviewedMutation(mutate); denied(adapt(f.bundle, f.authorization), code); }
});

test("malformed geometry and contradictory coverage fail after evidence acceptance", () => {
  for (const [geometry, code] of [[null, "invalid_geometry"], [{ type: "Point", coordinates: [1, 1] }, "invalid_geometry"],
    [{ type: "Polygon", coordinates: [[[0, 0], [4, 4], [4, 0], [0, 3], [0, 0]]] }, "resolver_validation_failed"],
    [rectangle(0, 0, 1000, 1000), "invalid_geometry"]]) {
    const f = reviewedMutation(({ dataset }) => {
      dataset.features[0].geometry = geometry;
      dataset.features[0].bounds = inspectGeometry(geometry).bounds;
    });
    assert.equal(gate(f.bundle, f.authorization).status, "evidence_accepted");
    denied(adapt(f.bundle, f.authorization), code);
  }
  const f = reviewedMutation(({ dataset }) => { dataset.coverageGeometry = rectangle(0, 0, 2, 2); });
  denied(adapt(f.bundle, f.authorization), "resolver_validation_failed");
});

test("parent inventory must have unique valid khet identities and contain every child mapping", () => {
  for (const mutate of [
    (f) => { f.dataset.parents = []; }, (f) => { f.dataset.parents.push(f.dataset.parents[0]); },
    (f) => { f.dataset.parents[0].nameTh = null; }, (f) => { f.dataset.parents[0].level = "khwaeng"; },
    (f) => { f.dataset.features[0].unit.parentId = "synthetic-yaan:khet:missing"; },
  ]) { const f = reviewedMutation(mutate); denied(adapt(f.bundle, f.authorization), "invalid_hierarchy"); }
});

test("synthetic khet adapter approval requires no invented parents; resolver semantics remain intact", () => {
  const f = reviewedMutation(({ dataset }) => {
    dataset.parents = []; dataset.provenance.coverage.level = "khet";
    for (const { unit } of dataset.features) { unit.level = "khet"; unit.id = unit.id.replace(":khwaeng:", ":khet:"); delete unit.parentId; }
  });
  assert.equal(adapt(f.bundle, f.authorization).status, "ready_for_offline_test");
});

test("currently blocked BMA metadata and even asserted real qualification/eligibility never admit real geometry", () => {
  const f = fixture();
  assert.equal(inactiveBmaMetadata.qualification.status, "blocked");
  assert.equal(inactiveBmaMetadata.dataset.license.status, "unspecified");
  assert.equal(inactiveBmaMetadata.activation.eligible, false);
  assert.equal(inactiveBmaMetadata.boundaries, undefined);
  for (const eligible of [false, true]) {
    const metadataOnly = { ...inactiveBmaMetadata, activation: { eligible } };
    denied(adapt({ ...f.bundle, datasetJson: json(metadataOnly) }, f.authorization), "real_dataset_disabled");
  }
  for (const status of ["unqualified", "qualified"]) {
    const real = reviewedMutation(({ dataset }) => {
      dataset.kind = "real"; dataset.provenance.id = inactiveBmaMetadata.dataset.id;
      dataset.provenance.version = inactiveBmaMetadata.dataset.version;
      dataset.provenance.qualification.status = status; dataset.provenance.activation.eligible = true;
    });
    denied(adapt(real.bundle, real.authorization), "real_dataset_disabled");
  }
});

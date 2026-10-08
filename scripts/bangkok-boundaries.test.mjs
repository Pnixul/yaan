import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { inspectGeoJson, inspectGeometry, json, metadataIssues, sha256, validateManifest } from "./boundaries/inspect.mjs";
import { inspectLocalSource } from "./inspect-bangkok-boundaries.mjs";

const fixtureBytes = await readFile(new URL("../data/bangkok-boundaries/fixtures/synthetic.geojson", import.meta.url));
const fixture = () => JSON.parse(fixtureBytes.toString("utf8"));
function manifest() {
  return {
    schemaVersion: 1,
    dataset: {
      id: "yaan-synthetic-boundaries", publisher: "Repository synthetic fixture", sourceReference: "Repository-owned, not BMA data",
      version: "test-1", dates: { published: null, effective: null, retrieved: "2026-10-07" },
      artifacts: [{ path: "synthetic.geojson", sha256: sha256(fixtureBytes) }],
      license: { status: "unspecified", reference: null, terms: null }, attribution: "YAAN synthetic test only",
      coverage: { countryCode: "TH", area: "Bangkok", level: "khwaeng" },
      sourceCrs: { definition: "Synthetic WGS84 longitude/latitude", authorityCode: "OGC:CRS84", evidence: "Fixture authored in longitude/latitude" },
      knownLimitations: ["Not official geometry"], transformations: [],
    },
    codeNamespace: "yaan-synthetic",
    fields: { code: "unit_code", nameTh: "thai_name", nameEn: "english_name", parentCode: "parent_code" },
    inputCoordinates: { status: "verified-wgs84-longitude-latitude", evidence: "Repository-owned fixture coordinates authored in this order" },
    parentInventory: { datasetId: "synthetic-khet", version: "test-1", sourceReference: "Synthetic parent list", sha256: sha256("01"), codes: ["01"] },
    observedFeatureCount: { count: 2, evidence: "This synthetic release only" },
  };
}
const codes = (result) => result.issues.map((issue) => issue.code);

test("Polygon, holes, MultiPolygon parts, schema, extents, names and string identities are preserved", () => {
  const source = fixture();
  const result = inspectGeoJson(source, manifest());
  assert.deepEqual(result.issues, []);
  assert.deepEqual(result.summary.geometryTypes, { MultiPolygon: 1, Polygon: 1 });
  assert.equal(result.summary.featureCount, 2);
  assert.equal(result.summary.holes, 2);
  assert.equal(result.summary.parts, 3);
  assert.deepEqual(result.summary.bounds, [100, 13, 101.1, 13.4]);
  assert.deepEqual(result.summary.schema.unit_code, ["string"]);
  assert.equal(result.summary.topology, "valid-per-feature");
  result.boundaries.forEach((boundary, index) => {
    assert.deepEqual(boundary.geometry, source.features[index].geometry);
    assert.equal(boundary.unit.nameTh, source.features[index].properties.thai_name);
    assert.equal(boundary.unit.parentId, "yaan-synthetic:khet:01");
  });
  assert.equal(result.boundaries[0].unit.id, "yaan-synthetic:khwaeng:001");
  assert.equal(result.boundaries[0].unit.nameEn, undefined);
  assert.equal(result.boundaries[1].unit.nameEn, "Synthetic B");
});

test("missing/numeric codes, missing Thai names and missing/unknown parents are rejected", () => {
  for (const [field, value, expected] of [
    ["unit_code", undefined, "missing-code"], ["unit_code", 1, "missing-code"],
    ["unit_code", "\ud800", "missing-code"], ["unit_code", " 001", "missing-code"],
    ["thai_name", "", "missing-thai-name"], ["parent_code", null, "missing-parent"], ["parent_code", "02", "unknown-parent"],
  ]) {
    const source = fixture(); source.features[0].properties[field] = value;
    assert.ok(codes(inspectGeoJson(source, manifest())).includes(expected), `${field}: ${expected}`);
  }
});

test("duplicate codes/identities and conflicting hierarchy are reported", () => {
  const source = fixture();
  source.features[1].properties.unit_code = "001";
  source.features[1].properties.parent_code = "02";
  const issues = codes(inspectGeoJson(source, manifest()));
  for (const code of ["duplicate-code", "duplicate-identity", "inconsistent-identity", "unknown-parent"]) assert.ok(issues.includes(code));
});

test("malformed, null, unsupported, unclosed, degenerate and extra-dimensional geometry fail", () => {
  for (const geometry of [null, {}, { type: "Point", coordinates: [100, 13] },
    { type: "Polygon", coordinates: [] }, { type: "MultiPolygon", coordinates: [] },
    { type: "MultiPolygon", coordinates: [null] },
    { type: "Polygon", coordinates: [[[100, 13], [101, 13], [101, 14], [100, 14]]] },
    { type: "Polygon", coordinates: [[[100, 13], [101, 13], [102, 13], [100, 13]]] },
    { type: "Polygon", coordinates: [[[100, 13, 0], [101, 13, 0], [101, 14, 0], [100, 13, 0]]] },
    { type: "Polygon", coordinates: [[[100, 13], [NaN, 13], [101, 14], [100, 13]]] },
  ]) assert.ok(inspectGeometry(geometry).errors.length, JSON.stringify(geometry));
  const source = fixture(); source.features[0].geometry = null;
  const result = inspectGeoJson(source, manifest());
  assert.equal(result.summary.nullGeometries, 1);
  assert.ok(codes(result).includes("malformed-geometry"));
});

test("unknown metadata is representable and reported, not fabricated", () => {
  const m = manifest();
  m.dataset.publisher = null; m.dataset.version = null;
  m.dataset.sourceCrs = { definition: null, authorityCode: null, evidence: null };
  m.inputCoordinates = { status: "unverified", evidence: null }; m.parentInventory = null;
  assert.deepEqual(validateManifest(m).issues, []);
  const warnings = metadataIssues(m).map((issue) => issue.code);
  for (const code of ["unknown-metadata", "unresolved-license", "unknown-crs", "unchecked-hierarchy"]) assert.ok(warnings.includes(code));
  assert.ok(codes(inspectGeoJson(fixture(), m)).includes("unverified-crs"));
});

test("manifest schema validates dates, hashes, field mappings, evidence and hierarchy inventory", () => {
  assert.deepEqual(validateManifest(manifest()).issues, []);
  for (const mutate of [
    (m) => { m.schemaVersion = 2; },
    (m) => { delete m.dataset.license; },
    (m) => { m.dataset.license.status = "CC-BY"; },
    (m) => { m.dataset.license.status = "specified"; },
    (m) => { m.dataset.dates.retrieved = "2026-02-30"; },
    (m) => { m.dataset.artifacts[0].sha256 = "invalid"; },
    (m) => { m.dataset.artifacts[0].path = "../source.shp"; },
    (m) => { m.dataset.artifacts.push(m.dataset.artifacts[0]); },
    (m) => { m.inputCoordinates.evidence = null; },
    (m) => { m.fields.parentCode = null; },
    (m) => { m.fields.code = m.fields.nameTh; },
    (m) => { m.parentInventory.codes.push("01"); },
    (m) => { m.dataset.transformations.push({ tool: "unknown" }); },
  ]) {
    const m = manifest(); mutate(m);
    assert.equal(validateManifest(m).manifest, null);
  }
  for (const value of [null, [], "manifest", {}, { dataset: null }]) assert.ok(validateManifest(value).issues.length);
});

test("unsafe CRS and contradictory legacy declarations block normalization regardless of coordinate ranges", () => {
  for (const status of ["unverified", "requires-transformation"]) {
    const m = manifest(); m.inputCoordinates.status = status;
    const result = inspectGeoJson(fixture(), m);
    assert.ok(codes(result).includes("unverified-crs"));
    assert.deepEqual(result.boundaries, []);
  }
  const source = fixture(); source.crs = { type: "name", properties: { name: "EPSG:32647" } };
  assert.ok(codes(inspectGeoJson(source, manifest())).includes("legacy-crs"));
  delete source.crs; source.features[0].geometry.coordinates[0][1][0] = 500000;
  assert.ok(codes(inspectGeoJson(source, manifest())).includes("invalid-wgs84-range"));
});

test("feature count is a release observation only; khet has no khwaeng parent requirement", () => {
  const m = manifest(); m.observedFeatureCount = null;
  const source = fixture(); source.features.pop();
  assert.deepEqual(inspectGeoJson(source, m).issues, []);
  m.observedFeatureCount = { count: 2, evidence: "Synthetic release" };
  assert.ok(codes(inspectGeoJson(source, m)).includes("feature-count-mismatch"));
  m.observedFeatureCount = null; m.dataset.coverage.level = "khet"; m.fields.parentCode = null;
  assert.deepEqual(validateManifest(m).issues, []);
  const result = inspectGeoJson(source, m);
  assert.deepEqual(result.issues, []);
  assert.equal(result.boundaries[0].unit.parentId, undefined);
  assert.equal(result.boundaries[0].unit.id, "yaan-synthetic:khet:001");
});

async function workspace(t) {
  const directory = await mkdtemp(join(tmpdir(), "yaan-boundary-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const source = join(directory, "synthetic.geojson"), manifestPath = join(directory, "manifest.json");
  await writeFile(source, fixtureBytes); await writeFile(manifestPath, json(manifest()));
  return { directory, source, manifest: manifestPath };
}

test("local workflow is deterministic, checksummed and never activates; normalized geometry is lossless", async (t) => {
  const options = await workspace(t);
  const first = await inspectLocalSource(options), second = await inspectLocalSource(options);
  assert.deepEqual(first, second);
  assert.equal(first.report.normalization.eligible, true);
  assert.equal(first.report.activation.eligible, false);
  assert.equal(first.candidate.stage, "normalized-candidate");
  assert.equal(first.candidate.inspection.reportSha256, sha256(json(first.report)));
  assert.equal(first.candidate.inspection.manifestSha256, sha256(await readFile(options.manifest)));
  assert.equal(first.candidate.dataset.license.status, "unspecified");
  assert.deepEqual(first.candidate.boundaries.map((b) => b.geometry), fixture().features.map((f) => f.geometry));
  assert.equal(first.candidate.dataset.transformations.length, 1);
});

test("tampered artifacts, absent files, unknown version and malformed JSON cannot emit a candidate", async (t) => {
  const options = await workspace(t);
  for (const mutate of [
    (m) => { m.dataset.artifacts[0].sha256 = "0".repeat(64); },
    (m) => { m.dataset.artifacts.push({ path: "missing.prj", sha256: "0".repeat(64) }); },
    (m) => { m.dataset.version = null; },
    (m) => { m.inputCoordinates.status = "unverified"; },
  ]) {
    const m = manifest(); mutate(m); await writeFile(options.manifest, json(m));
    const result = await inspectLocalSource(options);
    assert.equal(result.candidate, null); assert.equal(result.report.normalization.eligible, false);
  }
  await writeFile(options.manifest, "{");
  assert.ok((await inspectLocalSource(options)).report.issues.some((i) => i.code === "invalid-manifest-json"));
  await writeFile(options.source, "{");
  assert.ok((await inspectLocalSource(options)).report.issues.some((i) => i.code === "invalid-geojson-json"));
});

test("incomplete Shapefile components are audited without guessing missing content", async (t) => {
  const { directory } = await workspace(t);
  const source = join(directory, "raw"); await mkdir(source);
  // Deliberately incomplete: missing required sidecars prevents decoding.
  await writeFile(join(source, "boundary.shp"), "synthetic opaque bytes");
  await writeFile(join(source, "boundary.prj"), "UNVERIFIED PROJECTION TEXT");
  const { report, candidate } = await inspectLocalSource({ source });
  assert.equal(candidate, null); assert.equal(report.summary, null);
  assert.deepEqual(report.components[0].required, { ".shp": true, ".shx": false, ".dbf": false, ".prj": true });
  assert.equal(report.sourceCrs.sidecars[0].interpreted, false);
  assert.equal(report.sourceCrs.sidecars[0].text, "UNVERIFIED PROJECTION TEXT");
  assert.ok(report.issues.some((i) => i.code === "missing-component"));
  assert.deepEqual((await inspectLocalSource({ source: join(source, "boundary.shp") })).report.artifacts, report.artifacts);
});

test("unsupported archives, orphan sidecars, ambiguous geometry and invalid UTF-8 fail explicitly", async (t) => {
  const options = await workspace(t);
  const archive = join(options.directory, "source.zip"); await writeFile(archive, "opaque archive fixture");
  const archived = await inspectLocalSource({ source: archive });
  assert.equal(archived.report.artifacts[0].sha256, sha256("opaque archive fixture"));
  assert.ok(archived.report.issues.some((i) => i.code === "unsupported-format"));
  const raw = join(options.directory, "raw"); await mkdir(raw);
  await writeFile(join(raw, "orphan.dbf"), "opaque DBF fixture");
  const orphan = await inspectLocalSource({ source: raw });
  assert.equal(orphan.report.components[0].required[".shp"], false);
  assert.ok(orphan.report.issues.some((i) => i.code === "missing-component"));
  await writeFile(join(raw, "one.geojson"), fixtureBytes); await writeFile(join(raw, "two.geojson"), fixtureBytes);
  assert.ok((await inspectLocalSource({ source: raw })).report.issues.some((i) => i.code === "ambiguous-source"));
  // Invalid UTF-8 inside a JSON string must not become a silently replaced sourced name.
  const corrupted = Buffer.concat([Buffer.from('{"type":"FeatureCollection","name":"'), Buffer.from([0xff]), Buffer.from('","features":[]}')]);
  await writeFile(options.source, corrupted);
  const invalid = await inspectLocalSource(options);
  assert.equal(invalid.candidate, null);
  assert.ok(invalid.report.issues.some((i) => i.code === "invalid-geojson-json"));
});

const cli = (args) => spawnSync(process.execPath, [fileURLToPath(new URL("./inspect-bangkok-boundaries.mjs", import.meta.url)), ...args], { encoding: "utf8" });
test("CLI exit codes, candidate gating and no-overwrite protection", async (t) => {
  const options = await workspace(t);
  const report = join(options.directory, "report.json"), candidate = join(options.directory, "candidate.json");
  const args = ["--source", options.source, "--manifest", options.manifest, "--report", report, "--candidate", candidate];
  assert.equal(cli(args).status, 0);
  assert.equal(JSON.parse(await readFile(candidate, "utf8")).activation.eligible, false);
  const rerun = cli(args); assert.equal(rerun.status, 2); assert.match(rerun.stderr, /overwrite/u);
  const discovery = cli(["--source", options.source]);
  assert.equal(discovery.status, 1); assert.equal(JSON.parse(discovery.stdout).summary.featureCount, 2);
  assert.equal(JSON.parse(discovery.stdout).qualification.datasetTopology, null);
  assert.equal(cli([]).status, 2);
  const raw = join(options.directory, "raw"); await mkdir(raw);
  await writeFile(join(raw, "synthetic.geojson"), fixtureBytes);
  const rawOutput = join(raw, "discovery.json");
  const protectedRun = cli(["--source", raw, "--report", rawOutput]);
  assert.equal(protectedRun.status, 2);
  assert.match(protectedRun.stderr, /outside the raw source directory/u);
  await assert.rejects(readFile(rawOutput), { code: "ENOENT" });
  await rm(candidate);
  const m = manifest(); m.inputCoordinates.status = "unverified"; await writeFile(options.manifest, json(m));
  assert.equal(cli(["--source", options.source, "--manifest", options.manifest, "--candidate", candidate]).status, 1);
  await assert.rejects(readFile(candidate), { code: "ENOENT" });
});

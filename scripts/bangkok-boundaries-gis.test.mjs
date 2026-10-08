import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { inspectLocalSource } from "./inspect-bangkok-boundaries.mjs";
import { inspectGeometry, json, sha256 } from "./boundaries/inspect.mjs";
import { transformGeometry, verifyUtm47 } from "./boundaries/shapefile.mjs";
import { signedArea, topologyError } from "./boundaries/topology.mjs";

// Repository-authored binary fixtures, never production BMA data.
const WKT = 'PROJCS["WGS_1984_UTM_Zone_47N",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["False_Easting",500000],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",99],PARAMETER["Scale_Factor",0.9996],PARAMETER["Latitude_Of_Origin",0],UNIT["Meter",1]]';
function square(x, y, size, hole = false) {
  const ring = [[x, y], [x, y + size], [x + size, y + size], [x + size, y], [x, y]];
  return hole ? ring.reverse() : ring;
}
const rings = () => [
  [square(500020, 1500020, 20, true), square(500000, 1500000, 100)], // hole before shell
  [square(500200, 1500000, 100), square(500400, 1500000, 100), square(500420, 1500020, 20, true)],
];

function shapeFiles(features) {
  const points = features.flat(2);
  const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
  const bounds = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  const records = features.map((parts, index) => {
    const count = parts.reduce((sum, ring) => sum + ring.length, 0);
    const record = Buffer.alloc(8 + 44 + parts.length * 4 + count * 16);
    record.writeInt32BE(index + 1, 0); record.writeInt32BE((record.length - 8) / 2, 4);
    record.writeInt32LE(5, 8);
    bounds.forEach((n, i) => record.writeDoubleLE(n, 12 + i * 8));
    record.writeInt32LE(parts.length, 44); record.writeInt32LE(count, 48);
    let point = 0;
    parts.forEach((ring, i) => {
      record.writeInt32LE(point, 52 + i * 4);
      for (const p of ring) {
        record.writeDoubleLE(p[0], 52 + parts.length * 4 + point * 16);
        record.writeDoubleLE(p[1], 60 + parts.length * 4 + point * 16);
        point++;
      }
    });
    return record;
  });
  const header = (length) => {
    const result = Buffer.alloc(100);
    result.writeInt32BE(9994); result.writeInt32BE(length / 2, 24);
    result.writeInt32LE(1000, 28); result.writeInt32LE(5, 32);
    bounds.forEach((n, i) => result.writeDoubleLE(n, 36 + i * 8));
    return result;
  };
  const length = 100 + records.reduce((sum, record) => sum + record.length, 0);
  const shp = Buffer.concat([header(length), ...records]);
  const shx = Buffer.concat([header(100 + records.length * 8), Buffer.alloc(records.length * 8)]);
  let offset = 100;
  records.forEach((record, i) => {
    shx.writeInt32BE(offset / 2, 100 + i * 8);
    shx.writeInt32BE((record.length - 8) / 2, 104 + i * 8);
    offset += record.length;
  });
  return { shp, shx };
}

function dbfFile({ encoding = "windows-874", numericCode = false, rows = [["001", " แขวงทดสอบ", "01"], ["002", "บางนา", "01"]] } = {}) {
  const fields = [["code", numericCode ? "N" : "C", 6], ["nameTh", "C", 60], ["parent", "C", 4]];
  const header = 33 + fields.length * 32, length = 1 + fields.reduce((sum, f) => sum + f[2], 0);
  const bytes = Buffer.alloc(header + rows.length * length + 1, 0);
  bytes[0] = 3; bytes.writeUInt32LE(rows.length, 4); bytes.writeUInt16LE(header, 8); bytes.writeUInt16LE(length, 10);
  fields.forEach(([name, type, size], i) => {
    bytes.write(name, 32 + i * 32, "ascii"); bytes[43 + i * 32] = type.charCodeAt(0); bytes[48 + i * 32] = size;
  });
  bytes[header - 1] = 13; bytes[bytes.length - 1] = 26;
  rows.forEach((row, i) => {
    let offset = header + i * length;
    bytes.fill(32, offset, offset + length); offset++;
    row.forEach((value, j) => {
      const text = encoding === "utf-8" ? Buffer.from(value) : Buffer.from([...value].map((c) => {
        const cp = c.codePointAt(0);
        assert.ok(cp < 128 || (cp >= 0x0e01 && cp <= 0x0e5b));
        return cp < 128 ? cp : cp - 0x0e00 + 0xa0;
      }));
      text.copy(bytes, offset); offset += fields[j][2];
    });
  });
  return bytes;
}

function artifacts(options = {}) {
  const { shp, shx } = shapeFiles(options.rings ?? rings());
  return { "boundary.shp": shp, "boundary.shx": shx, "boundary.dbf": dbfFile(options),
    "boundary.prj": Buffer.from(options.wkt ?? WKT), "boundary.cpg": Buffer.from(options.encoding === "utf-8" ? "65001" : "874") };
}

async function inspect(t, files = artifacts(), modify = () => {}) {
  const directory = await mkdtemp(join(tmpdir(), "yaan-gis-test-"));
  t.after(async () => {
    assert.ok(resolve(directory).startsWith(resolve(tmpdir()) + sep));
    await rm(directory, { recursive: true, force: true });
  });
  const raw = join(directory, "raw"); await mkdir(raw);
  for (const [name, bytes] of Object.entries(files)) await writeFile(join(raw, name), bytes);
  const manifest = {
    schemaVersion: 1, codeNamespace: "test",
    dataset: {
      id: "synthetic-gis", publisher: "YAAN fixture", sourceReference: "Repository-authored fixture", version: "1",
      dates: { published: null, effective: null, retrieved: "2026-10-08" },
      artifacts: Object.entries(files).map(([path, bytes]) => ({ path, sha256: sha256(bytes) })),
      license: { status: "unspecified", reference: null, terms: null }, attribution: "YAAN synthetic",
      coverage: { countryCode: "TH", area: "Bangkok", level: "khwaeng" },
      sourceCrs: { definition: WKT, authorityCode: "EPSG:32647", evidence: "Synthetic WKT" },
      knownLimitations: ["Synthetic, not BMA"], transformations: [],
    },
    fields: { code: "code", nameTh: "nameTh", parentCode: "parent", nameEn: null },
    inputCoordinates: { status: "requires-transformation", evidence: "Synthetic UTM metres" },
    parentInventory: { datasetId: "synthetic-parents", version: "1", sourceReference: "Synthetic", sha256: sha256("01"), codes: ["01"] },
    observedFeatureCount: { count: 2, evidence: "Synthetic release only" },
    observedParentCount: { count: 1, evidence: "Synthetic release only" },
  };
  modify(manifest);
  const path = join(directory, "manifest.json"); await writeFile(path, json(manifest));
  const options = { source: raw, manifest: path };
  return { ...(await inspectLocalSource(options)), options };
}

test("Thai DBF, holes and disconnected parts survive deterministic import with complete provenance", async (t) => {
  const { candidate, report, options } = await inspect(t);
  assert.deepEqual(report.issues, []);
  assert.ok(candidate);
  assert.equal(candidate.boundaries[0].unit.nameTh, " แขวงทดสอบ");
  assert.equal(candidate.boundaries[1].unit.nameTh, "บางนา");
  assert.equal(candidate.boundaries[0].unit.officialCode, "001");
  assert.equal(candidate.boundaries[0].unit.parentId, "test:khet:01");
  assert.equal(report.gis.encoding.label, "windows-874");
  assert.equal(report.qualification.status, "blocked");
  assert.equal(report.qualification.datasetTopology.coordinateReferenceSystem, "EPSG:32647");
  assert.equal(report.qualification.datasetTopology.enclosedVoids.length, 2);
  assert.equal(report.qualification.gates.sourceAuthority, "unverified-needs-resource-specific-evidence");
  assert.deepEqual(report.gis.beforeTransformation.bounds, [500000, 1500000, 500500, 1500100]);
  for (const summary of [report.gis.beforeTransformation, report.summary]) {
    assert.equal(summary.featureCount, 2); assert.equal(summary.parts, 3); assert.equal(summary.holes, 2);
    assert.deepEqual(summary.geometryTypes, { MultiPolygon: 1, Polygon: 1 });
    assert.equal(summary.topology, "valid-per-feature");
  }
  assert.equal(report.summary.identities.uniqueCodes, 2); assert.equal(report.summary.identities.uniqueParentCodes, 1);
  for (const boundary of candidate.boundaries) {
    const polygons = boundary.geometry.type === "Polygon" ? [boundary.geometry.coordinates] : boundary.geometry.coordinates;
    polygons.forEach((polygon) => polygon.forEach((ring, i) => assert.equal(signedArea(ring) > 0, i === 0)));
  }
  assert.equal(candidate.coordinateReferenceSystem, "OGC:CRS84");
  assert.equal(candidate.dataset.sourceCrs.authorityCode, "EPSG:32647");
  assert.equal(candidate.dataset.license.status, "unspecified");
  assert.equal(candidate.activation.eligible, false);
  assert.ok(candidate.activation.blockers.some((b) => b.includes("License")));
  assert.equal(candidate.releaseObservations.featureCount.count, 2);
  assert.match(candidate.dataset.transformations[0].operation, /no rounding, simplification or topology repair/u);
  assert.equal(report.tool.dependencies.shapefile, "0.6.6");
  const repeat = await inspectLocalSource(options);
  assert.deepEqual(repeat, { candidate, report });
});

test("JSON encoding metadata is inventoried alongside Shapefile; embedded archives and orphan CRS fail", async (t) => {
  const files = artifacts();
  delete files["boundary.cpg"];
  files["metadata.json"] = Buffer.from(JSON.stringify({ encoding: "windows-874" }));
  const result = await inspect(t, files, (manifest) => {
    manifest.sourceEncoding = { label: "windows-874", artifactPath: "metadata.json", evidence: "Synthetic metadata encoding declaration" };
  });
  assert.ok(result.candidate);
  assert.ok(result.report.artifacts.some((a) => a.path === "metadata.json"));
  const archived = await inspect(t, { ...artifacts(), "archive.zip": Buffer.from("archive") });
  assert.equal(archived.candidate, null);
  assert.ok(archived.report.issues.some((i) => i.code === "unsupported-archive"));
  const orphan = await inspect(t, { ...artifacts(), "orphan.prj": Buffer.from(WKT) });
  assert.equal(orphan.candidate, null);
  assert.ok(orphan.report.issues.some((i) => i.code === "missing-component"));
  const ambiguous = await inspect(t, { ...artifacts(), "converted.json": Buffer.from('{"type":"FeatureCollection","features":[]}') });
  assert.equal(ambiguous.candidate, null);
  assert.ok(ambiguous.report.issues.some((i) => i.code === "ambiguous-source"));
});

test("overlap findings and supplied license terms never qualify or activate a normalized candidate", async (t) => {
  const files = artifacts({ rings: [[square(500000, 1500000, 100)], [square(500050, 1500000, 100)]] });
  const { report, candidate } = await inspect(t, files, (manifest) => {
    manifest.dataset.license = { status: "specified", reference: "Synthetic terms", terms: "Fixture only" };
  });
  assert.equal(report.qualification.datasetTopology.overlaps[0].area, 5000);
  assert.equal(report.qualification.gates.overlapReview, "findings-require-review");
  assert.equal(report.qualification.gates.licenseSuitability, "terms-supplied-needs-review");
  assert.equal(report.qualification.status, "blocked");
  assert.equal(report.normalization.eligible, true);
  assert.equal(candidate.activation.eligible, false);
});

test("UTF-8 and numeric DBF identities preserve sourced characters and lexical leading zeros", async (t) => {
  const { candidate, report } = await inspect(t, artifacts({ encoding: "utf-8", numericCode: true }));
  assert.deepEqual(report.issues, []);
  assert.equal(candidate.boundaries[0].unit.nameTh, " แขวงทดสอบ");
  assert.equal(candidate.boundaries[0].unit.officialCode, "001");
});

test("encoding must have evidence; malformed bytes and contradictory labels fail closed", async (t) => {
  const missing = artifacts(); delete missing["boundary.cpg"];
  assert.equal((await inspect(t, missing)).candidate, null);
  missing["metadata.txt"] = Buffer.from("Synthetic encoding: windows-874");
  const attested = await inspect(t, missing, (m) => { m.sourceEncoding = { label: "windows-874", artifactPath: "metadata.txt", evidence: "Explicit source statement" }; });
  assert.ok(attested.candidate);
  const wrong = artifacts(); wrong["boundary.cpg"] = Buffer.from("UTF-8");
  assert.equal((await inspect(t, wrong)).candidate, null);
  const conflict = await inspect(t, artifacts(), (m) => { m.sourceEncoding = { label: "utf-8", artifactPath: "boundary.cpg", evidence: "Conflicting claim" }; });
  assert.match(conflict.report.issues.map((i) => i.message).join(" "), /contradicts/u);
});

test("CRS name alone cannot override zone, datum, units, axes or manifest mismatch", async (t) => {
  for (const wkt of [WKT.replace('Meridian",99', 'Meridian",105'), WKT.replace('Meter",1', 'Meter",0.3048'),
    WKT.replace('PRIMEM["Greenwich",0]', 'PRIMEM["Paris",2.33722917]'),
    WKT.replace('UNIT["Meter",1]]', 'UNIT["Meter",1],AXIS["Northing",NORTH],AXIS["Easting",EAST]]'),
    WKT.replace('D_WGS_1984', 'D_Indian_1975'), "not WKT"]) {
    assert.throws(() => verifyUtm47(wkt));
    assert.equal((await inspect(t, artifacts({ wkt }))).candidate, null);
  }
  assert.equal((await inspect(t, artifacts(), (m) => { m.dataset.sourceCrs.authorityCode = "EPSG:4326"; })).candidate, null);
  assert.equal((await inspect(t, artifacts(), (m) => { m.inputCoordinates.status = "verified-wgs84-longitude-latitude"; })).candidate, null);
});

test("UTM 47N independent central-meridian control and all-vertex normalization", () => {
  const transform = verifyUtm47(WKT);
  const [longitude, latitude] = transform.forward([500000, 0]);
  // Analytic UTM origin: false easting 500000, equator 0, central meridian 99E.
  assert.ok(Math.abs(longitude - 99) < 1e-10); assert.ok(Math.abs(latitude) < 1e-10);
  // Independent PROJ example: zone 32 (12E,56N), shifted to zone 47 (102E,56N).
  // https://proj.org/en/stable/operations/projections/utm.html
  const offAxis = transform.forward([687071.44, 6210141.33]);
  assert.ok(Math.abs(offAxis[0] - 102) < 1e-7); assert.ok(Math.abs(offAxis[1] - 56) < 1e-7);
  const source = { type: "MultiPolygon", coordinates: [[square(500000, 1500000, 100), square(500020, 1500020, 20, true)], [square(500200, 1500000, 100)]] };
  const snapshot = structuredClone(source), output = transformGeometry(source, transform);
  assert.deepEqual(source, snapshot);
  assert.equal(inspectGeometry(output).holes, 1); assert.equal(inspectGeometry(output).parts, 2);
  output.coordinates.forEach((polygon, i) => polygon.forEach((ring, j) => {
    const expected = source.coordinates[i][j].map((point) => transform.forward(point)).reverse();
    assert.deepEqual(ring, expected);
  }));
  assert.equal(topologyError(output), null);
});

test("malformed geometry, self-intersections, overlapping parts and orphan holes cannot emit candidates", async (t) => {
  const unclosed = rings(); unclosed[0][1][4] = [500001, 1500000];
  const crossing = rings(); crossing[0] = [[[500000,1500000],[500100,1500100],[500000,1500100],[500080,1500000],[500000,1500000]]];
  const overlap = rings(); overlap[0] = [square(500000,1500000,100), square(500050,1500050,100)];
  const orphan = rings(); orphan[0] = [square(500000,1500000,100), square(500200,1500000,20,true)];
  for (const bad of [unclosed, crossing, overlap, orphan]) {
    const { candidate, report } = await inspect(t, artifacts({ rings: bad }));
    assert.equal(candidate, null); assert.equal(report.normalization.eligible, false);
    assert.ok(report.issues.some((i) => i.code.startsWith("source-")));
  }
});

test("truncation, SHX mismatch, unsupported/deleted records and SHP/DBF count mismatch fail", async (t) => {
  for (const mutate of [
    (f) => { f["boundary.shp"] = f["boundary.shp"].subarray(0, 120); },
    (f) => { f["boundary.shx"].writeInt32BE(51, 100); },
    (f) => { f["boundary.shp"].writeInt32LE(15, 108); },
    (f) => { f["boundary.dbf"][f["boundary.dbf"].readUInt16LE(8)] = 42; },
    (f) => { f["boundary.dbf"] = dbfFile({ rows: [["001", "บางนา", "01"]] }); },
  ]) {
    const files = artifacts(); mutate(files);
    const { candidate, report } = await inspect(t, files);
    assert.equal(candidate, null); assert.ok(report.issues.some((i) => i.code === "shapefile-import-failed"));
  }
});

test("identity/hierarchy failures and release-specific count observations block normalization", async (t) => {
  const files = artifacts({ rows: [["001", "", ""], ["001", "บางนา", "02"]] });
  const { candidate, report } = await inspect(t, files);
  assert.equal(candidate, null);
  for (const code of ["missing-thai-name", "missing-parent", "unknown-parent", "duplicate-code", "inconsistent-identity"]) {
    assert.ok(report.issues.some((i) => i.code === code), code);
  }
  const mismatch = await inspect(t, artifacts(), (m) => { m.observedParentCount.count = 50; m.observedFeatureCount.count = 180; });
  assert.equal(mismatch.candidate, null);
  assert.ok(mismatch.report.issues.some((i) => i.code === "parent-count-mismatch"));
  const uncounted = await inspect(t, artifacts(), (m) => { m.observedParentCount = null; m.observedFeatureCount = null; });
  assert.ok(uncounted.candidate);
});

// @ts-check
import shapefile from "shapefile";
import proj4 from "proj4";
import { inspectGeoJson, inspectGeometry } from "./inspect.mjs";
import { signedArea, topologyError } from "./topology.mjs";
import { inspectCoverage } from "./coverage.mjs";

/** @typedef {import('../../src/lib/administrative-boundary').BoundaryManifest} Manifest */
/** @typedef {import('../../src/lib/administrative-boundary').BoundaryGeometry} Geometry */
/** @typedef {{path: string, content: Buffer, sha256: string}} Artifact */
/** @param {boolean} condition @param {string} message */
function requireSource(condition, message) {
  if (!condition) throw new Error(message);
}

/** Only the qualified source CRS is supported. Compare parameters, not its display name.
 * @param {string} definition */
export function verifyUtm47(definition) {
  requireSource(/^\s*PROJCS\s*\[/iu.test(definition), "Expected source ESRI/WKT1 projected CRS in .prj");
  const projection = new proj4.Proj(definition);
  const expected = new proj4.Proj("EPSG:32647");
  const p = /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (projection));
  const e = /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (expected));
  requireSource(["Transverse_Mercator", "Transverse Mercator", "tmerc", "etmerc", "utm"].includes(String(p.projName)), "CRS is not Transverse Mercator/UTM");
  requireSource(String(p.datumCode).toLowerCase() === "wgs84" && p.axis === "enu" &&
    p.to_meter === 1 && ["meter", "metre", "m"].includes(String(p.units)), "CRS datum, axes or metre units do not match EPSG:32647");
  for (const key of ["a", "b", "long0", "lat0", "x0", "y0", "k0"]) {
    requireSource(typeof p[key] === "number" && typeof e[key] === "number" &&
      Math.abs(p[key] - e[key]) <= Math.max(1, Math.abs(e[key])) * 1e-12, `CRS parameter ${key} does not match EPSG:32647`);
  }
  requireSource((p.from_greenwich == null || p.from_greenwich === 0) && !p.nadgrids &&
    Array.isArray(p.datum_params) && p.datum_params.every((v) => Number(v) === 0), "Unsupported prime meridian or datum transformation");
  const transform = proj4(projection, "EPSG:4326");
  const control = transform.forward([500000, 0]);
  requireSource(Math.abs(control[0] - 99) < 1e-10 && Math.abs(control[1]) < 1e-10, "UTM 47N central-meridian control failed");
  // PROJ's published zone-32 control, shifted 90 degrees east to zone 47.
  // https://proj.org/en/stable/operations/projections/utm.html
  // Published centimetre rounding (and GRS80 vs WGS84) fits a 1e-7 degree tolerance.
  const offAxis = transform.forward([687071.44, 6210141.33]);
  requireSource(Math.abs(offAxis[0] - 102) < 1e-7 && Math.abs(offAxis[1] - 56) < 1e-7, "UTM 47N independent off-axis control failed");
  return transform;
}

/** Audit record envelopes/indexes before handing geometry to the library. No geometry repair.
 * @param {Buffer} shp @param {Buffer} shx */
function auditShape(shp, shx) {
  for (const [name, bytes] of /** @type {const} */ ([["SHP", shp], ["SHX", shx]])) {
    requireSource(bytes.length >= 100, `${name}: truncated header`);
    requireSource(bytes.readInt32BE(0) === 9994 && bytes.readInt32LE(28) === 1000, `${name}: invalid header`);
    requireSource(bytes.readInt32BE(24) * 2 === bytes.length, `${name}: file length mismatch`);
    requireSource(bytes.readInt32LE(32) === 5, `${name}: only 2D Polygon (type 5) is supported; null/Z/M records are not discarded`);
  }
  requireSource((shx.length - 100) % 8 === 0, "SHX: invalid index length");
  /** @type {{rings: number, positions: number}[]} */
  const records = [];
  let offset = 100;
  while (offset < shp.length) {
    const index = records.length;
    requireSource(offset + 52 <= shp.length, `SHP record ${index}: truncated record`);
    const length = shp.readInt32BE(offset + 4) * 2;
    requireSource(shp.readInt32BE(offset) === index + 1 && length >= 44 && offset + 8 + length <= shp.length, `SHP record ${index}: invalid record number/length`);
    requireSource(shp.readInt32LE(offset + 8) === 5, `SHP record ${index}: unsupported or null geometry`);
    const rings = shp.readInt32LE(offset + 44), positions = shp.readInt32LE(offset + 48);
    requireSource(rings > 0 && positions >= rings * 4 && length === 44 + rings * 4 + positions * 16, `SHP record ${index}: malformed parts/points`);
    for (let r = 0; r < rings; r++) {
      const start = shp.readInt32LE(offset + 52 + r * 4);
      const end = r + 1 === rings ? positions : shp.readInt32LE(offset + 56 + r * 4);
      requireSource((r !== 0 || start === 0) && start >= 0 && end <= positions && end - start >= 4, `SHP record ${index}: invalid ring offsets`);
    }
    const entry = 100 + index * 8;
    requireSource(entry + 8 <= shx.length && shx.readInt32BE(entry) * 2 === offset &&
      shx.readInt32BE(entry + 4) * 2 === length, `SHX record ${index}: index disagrees with SHP`);
    records.push({ rings, positions });
    offset += 8 + length;
  }
  requireSource(records.length === (shx.length - 100) / 8, "SHP/SHX record counts differ");
  return records;
}

/** @param {string} label */
function encodingLabel(label) {
  const value = label.trim().replace(/^\uFEFF/u, "");
  const aliases = /** @type {Record<string, string>} */ ({ "874": "windows-874", "65001": "utf-8", "UTF8": "utf-8" });
  return new TextDecoder(aliases[value.toUpperCase()] ?? value, { fatal: true }).encoding;
}

/** Validate DBF framing, field types and all character bytes, retaining lexical source values.
 * shapefile trims strings and coerces numeric fields; identity fields must not lose zeros.
 * @param {Buffer} bytes @param {string} encoding @param {Manifest | null} manifest */
function auditDbf(bytes, encoding, manifest) {
  requireSource(bytes.length >= 33 && bytes[0] === 3, "DBF: only dBASE III without memo is supported");
  const count = bytes.readUInt32LE(4), header = bytes.readUInt16LE(8), length = bytes.readUInt16LE(10);
  requireSource(header >= 33 && header <= bytes.length && (header - 33) % 32 === 0 && bytes[header - 1] === 13, "DBF: malformed field header");
  const end = header + count * length;
  requireSource(length > 1 && (bytes.length === end || (bytes.length === end + 1 && bytes[end] === 26)), "DBF: record count/length mismatch");
  const decoder = new TextDecoder(encoding, { fatal: true });
  /** @type {{name: string, type: string, length: number, offset: number}[]} */
  const fields = [];
  let fieldOffset = 1;
  for (let i = 32; i < header - 1; i += 32) {
    const name = new TextDecoder("ascii", { fatal: true }).decode(bytes.subarray(i, i + 11)).split("\0")[0];
    const type = String.fromCharCode(bytes[i + 11]), size = bytes[i + 16];
    requireSource(/^[\x21-\x7e]+$/u.test(name) && !["__proto__", "constructor", "prototype"].includes(name) &&
      !fields.some((f) => f.name === name), "DBF: invalid or duplicate field name");
    requireSource(["C", "N", "F", "L", "D"].includes(type) && size > 0, `DBF: unsupported field ${name} (${type})`);
    fields.push({ name, type, length: size, offset: fieldOffset });
    fieldOffset += size;
  }
  requireSource(fieldOffset === length, "DBF: field lengths disagree with record length");
  const identityFields = [manifest?.fields.code, manifest?.fields.parentCode].filter(Boolean);
  /** @type {Record<string, string>[]} */
  const lexical = [];
  for (let row = 0; row < count; row++) {
    const offset = header + row * length;
    requireSource(bytes[offset] === 32, `DBF record ${row}: deleted or unsupported record flag; alignment must be reviewed`);
    /** @type {Record<string, string>} */
    const values = {};
    for (const field of fields) {
      const raw = bytes.subarray(offset + field.offset, offset + field.offset + field.length);
      const value = decoder.decode(raw);
      requireSource(!/[\u0000-\u001f\u007f\ufffd]/u.test(value), `DBF record ${row}, ${field.name}: invalid text/control characters`);
      if (field.type === "C") values[field.name] = value.replace(/ +$/u, "");
      if (identityFields.includes(field.name) && field.type !== "C") {
        requireSource(field.type === "N" && /^ *(?:[0-9]+)? *$/u.test(value), `DBF record ${row}, ${field.name}: identity must be a character field or integer lexical code`);
        values[field.name] = value.trim();
      }
    }
    lexical.push(values);
  }
  return { count, fields, languageDriverId: bytes[29], lexical };
}

/** @param {Geometry} geometry @param {import('proj4').Converter} transform @returns {Geometry} */
export function transformGeometry(geometry, transform) {
  /** @param {number[][][]} polygon */
  const convert = (polygon) => polygon.map((ring, i) => {
    const output = ring.map((p) => /** @type {[number, number]} */ (transform.forward(p)));
    // RFC 7946 winding: shells CCW, holes CW. Only reverse; never round/close/simplify.
    return (signedArea(output) > 0) === (i === 0) ? output : output.reverse();
  });
  return geometry.type === "Polygon"
    ? { type: "Polygon", coordinates: convert(geometry.coordinates) }
    : { type: "MultiPolygon", coordinates: geometry.coordinates.map(convert) };
}

/** @param {Artifact[]} artifacts @param {string} stem @param {Manifest | null} manifest */
export async function decodeShapefile(artifacts, stem, manifest) {
  /** @param {string} extension */
  const artifact = (extension) => {
    const matches = artifacts.filter((a) => a.path.toLowerCase() === `${stem}${extension}`);
    requireSource(matches.length === 1, `Expected exactly one ${extension} sidecar for ${stem}`);
    return matches[0];
  };
  const shp = artifact(".shp"), shx = artifact(".shx"), dbf = artifact(".dbf"), prj = artifact(".prj");
  const definition = new TextDecoder("utf-8", { fatal: true }).decode(prj.content);
  const transform = verifyUtm47(definition);
  if (manifest) {
    requireSource(manifest.inputCoordinates.status === "requires-transformation", "Shapefile inputCoordinates.status must be requires-transformation");
    requireSource(manifest.dataset.sourceCrs.authorityCode === null || manifest.dataset.sourceCrs.authorityCode === "EPSG:32647", "Manifest CRS contradicts .prj");
    if (manifest.dataset.sourceCrs.definition !== null) verifyUtm47(manifest.dataset.sourceCrs.definition);
  }
  const cpgs = artifacts.filter((a) => a.path.toLowerCase() === `${stem}.cpg`);
  requireSource(cpgs.length <= 1, "Ambiguous .cpg sidecars");
  const cpg = cpgs[0];
  const cpgText = cpg ? new TextDecoder("utf-8", { fatal: true }).decode(cpg.content) : null;
  const attestation = manifest?.sourceEncoding;
  const metadata = attestation ? artifacts.find((a) => a.path === attestation.artifactPath) : null;
  requireSource(cpgText !== null || Boolean(metadata && attestation?.evidence), "DBF encoding is unverified: provide .cpg or sourceEncoding referencing checksummed source metadata");
  const encoding = encodingLabel(cpgText ?? attestation?.label ?? "");
  if (attestation) requireSource(encodingLabel(attestation.label) === encoding, "Encoding metadata contradicts .cpg");
  const records = auditShape(shp.content, shx.content);
  const table = auditDbf(dbf.content, encoding, manifest);
  requireSource(table.count === records.length, "SHP/DBF record counts differ");
  // Explicit buffers prevent implicit file discovery, missing-DBF fallback or network access.
  const source = await shapefile.read(shp.content, dbf.content, { encoding });
  requireSource(source.features.length === records.length, "Parser changed the source record count");
  for (const [index, feature] of source.features.entries()) {
    feature.properties = { ...feature.properties, ...table.lexical[index] };
  }
  const before = inspectGeoJson(source, null);
  const issues = before.issues.map((issue) => ({ ...issue, code: `source-${issue.code}` }));
  /** @type {import('geojson').FeatureCollection<import('geojson').Geometry | null>} */
  const output = structuredClone(source);
  delete output.bbox;
  for (const [index, feature] of source.features.entries()) {
    const summary = inspectGeometry(feature.geometry);
    if (summary.errors.length || topologyError(feature.geometry)) {
      output.features[index].geometry = null;
      continue;
    }
    const geometry = /** @type {Geometry} */ (feature.geometry);
    const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    // shapefile promotes orphan holes to shells. Reject this instead of accepting altered meaning.
    const wrongWinding = polygons.some((polygon) => polygon.some((ring, r) => (signedArea(ring) < 0) !== (r === 0)));
    if (wrongWinding || summary.positions !== records[index].positions || summary.parts + summary.holes !== records[index].rings) {
      issues.push({ code: "source-ring-semantics", message: "Source winding or ring/point preservation failed; no repair performed", featureIndex: index });
      output.features[index].geometry = null;
      continue;
    }
    const normalized = transformGeometry(geometry, transform);
    const after = inspectGeometry(normalized);
    const error = after.errors.join("; ") || topologyError(normalized);
    if (error || after.outsideWgs84Range || after.parts !== summary.parts || after.holes !== summary.holes || after.positions !== summary.positions) {
      issues.push({ code: "transformed-geometry-invalid", message: error || "Transformed coordinate range or ring/part preservation failed", featureIndex: index });
      output.features[index].geometry = null;
    } else output.features[index].geometry = normalized;
  }
  const evidence = `${prj.path} sha256:${prj.sha256}; parsed parameters match EPSG:32647; [500000,0] -> [99,0] and PROJ off-axis [687071.44,6210141.33] -> [102,56] controls; output longitude/latitude`;
  return {
    source: output, issues,
    coverage: issues.length ? null : inspectCoverage(source.features.map((feature) => feature.geometry), "EPSG:32647"),
    sourceCrs: { definition, authorityCode: "EPSG:32647", evidence },
    encoding: { label: encoding, cpg: cpg ? { path: cpg.path, sha256: cpg.sha256, text: cpgText } : null,
      metadata: attestation ?? null, languageDriverId: table.languageDriverId },
    before: before.summary,
    dbf: { fields: table.fields, recordCount: table.count },
  };
}

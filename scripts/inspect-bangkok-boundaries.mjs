// @ts-check
import { lstat, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { activationBlockers, inspectGeoJson, json, metadataIssues, sha256, validateManifest } from "./boundaries/inspect.mjs";
import { decodeShapefile } from "./boundaries/shapefile.mjs";

/** @typedef {import('../src/lib/administrative-boundary').BoundaryCandidate} BoundaryCandidate */
/** @typedef {{code: string, message: string, featureIndex?: number}} Issue */
const TOOL_VERSION = "2.4";
const require = createRequire(import.meta.url);
/** Reject invalid UTF-8 instead of silently replacing bytes in sourced Thai names. */
/** @param {Buffer} bytes */
const decodeJson = (bytes) => JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));

/** Read only an explicit file, its Shapefile sidecars, or a flat artifact directory. */
/** @param {string} sourcePath */
async function readArtifacts(sourcePath) {
  const source = resolve(sourcePath);
  const info = await lstat(source);
  if (info.isSymbolicLink()) throw new Error("Source symlinks are not supported; supply the actual artifact path");
  const directory = info.isDirectory() ? source : dirname(source);
  let names = [basename(source)];
  if (info.isDirectory()) names = await readdir(directory);
  else if (extname(source).toLowerCase() === ".shp") {
    const stem = basename(source, extname(source)).toLowerCase();
    names = (await readdir(directory)).filter((name) => basename(name, extname(name)).toLowerCase() === stem &&
      [".shp", ".shx", ".dbf", ".prj", ".cpg", ".sbn", ".sbx"].includes(extname(name).toLowerCase()));
  }
  /** @type {{path: string, sha256: string, bytes: number, content: Buffer}[]} */
  const artifacts = [];
  for (const name of names.sort()) {
    const path = join(directory, name);
    const entry = await lstat(path);
    if (!entry.isFile() || entry.isSymbolicLink()) throw new Error(`Artifact must be a regular file (flat directories only): ${name}`);
    const content = await readFile(path);
    artifacts.push({ path: name, sha256: sha256(content), bytes: content.length, content });
  }
  return artifacts;
}

/** @param {{source: string, manifest?: string}} options */
export async function inspectLocalSource(options) {
  const artifacts = await readArtifacts(options.source);
  /** @type {Issue[]} */
  const issues = [];
  /** @type {Issue[]} */
  const warnings = [];
  let manifest = null;
  let manifestSha256 = null;
  if (options.manifest) {
    const bytes = await readFile(options.manifest);
    manifestSha256 = sha256(bytes);
    try {
      const validation = validateManifest(decodeJson(bytes));
      manifest = validation.manifest;
      issues.push(...validation.issues);
    } catch { issues.push({ code: "invalid-manifest-json", message: "Manifest is not valid UTF-8 JSON" }); }
  } else issues.push({ code: "missing-manifest", message: "Supply a release manifest after inspecting fields, checksums and CRS evidence" });
  if (manifest) {
    warnings.push(...metadataIssues(manifest));
    const expected = manifest.dataset.artifacts;
    for (const artifact of artifacts) {
      const match = expected.find((item) => item.path === artifact.path);
      if (!match || match.sha256 !== artifact.sha256) issues.push({ code: "checksum-mismatch", message: `Manifest checksum missing or mismatched: ${artifact.path}` });
    }
    for (const artifact of expected) if (!artifacts.some((item) => item.path === artifact.path)) issues.push({ code: "missing-artifact", message: `Manifest artifact absent: ${artifact.path}` });
  }
  const shapeFiles = artifacts.filter((a) => extname(a.path).toLowerCase() === ".shp");
  const shapeStems = [...new Set(artifacts.filter((a) => [".shp", ".shx", ".dbf"].includes(extname(a.path).toLowerCase()))
    .map((a) => basename(a.path, extname(a.path)).toLowerCase()))];
  const geojsonFiles = artifacts.filter((a) => [".geojson", ".json"].includes(extname(a.path).toLowerCase()));
  const projectionFiles = artifacts.filter((a) => [".prj", ".cpg"].includes(extname(a.path).toLowerCase()))
    .map((a) => ({ path: a.path, text: a.content.toString("utf8"), interpreted: false }));
  /** @type {{source: string, required: Record<string, boolean>}[]} */
  const components = [];
  for (const stem of shapeStems) {
    const required = Object.fromEntries([".shp", ".shx", ".dbf", ".prj"].map((extension) => [extension,
      artifacts.some((a) => a.path.toLowerCase() === `${stem}${extension}`)]));
    components.push({ source: `${stem}.shp`, required });
    for (const [extension, present] of Object.entries(required)) if (!present) issues.push({ code: "missing-component", message: `${stem}: missing ${extension}${extension === ".prj" ? " (CRS evidence required)" : ""}` });
    if (!artifacts.some((a) => a.path.toLowerCase() === `${stem}.cpg`) && !manifest?.sourceEncoding) warnings.push({ code: "unknown-encoding", message: `${stem}: no .cpg or checksummed encoding metadata` });
  }
  let inspection = null;
  let decoded = null;
  if (shapeFiles.length + geojsonFiles.length > 1 || shapeStems.length > 1) issues.push({ code: "ambiguous-source", message: "Supply exactly one geometry artifact/release per run; do not combine providers or original and converted geometry" });
  if (shapeFiles.length === 1 && shapeStems.length === 1 && !geojsonFiles.length && !issues.some((i) => i.code === "missing-component")) {
    try {
      decoded = await decodeShapefile(artifacts, shapeStems[0], manifest);
      issues.push(...decoded.issues);
      // This is an output attestation, never a relabeling/mutation of the raw-input manifest.
      const normalizedManifest = manifest ? { ...manifest, inputCoordinates: {
        status: /** @type {const} */ ("verified-wgs84-longitude-latitude"), evidence: decoded.sourceCrs.evidence,
      } } : null;
      inspection = inspectGeoJson(decoded.source, normalizedManifest);
      issues.push(...inspection.issues);
      for (const sidecar of projectionFiles) sidecar.interpreted = true;
    } catch (error) {
      issues.push({ code: "shapefile-import-failed", message: error instanceof Error ? error.message : "Shapefile import failed" });
    }
  }
  if (!shapeFiles.length && geojsonFiles.length === 1) {
    try {
      const source = decodeJson(geojsonFiles[0].content);
      inspection = inspectGeoJson(source, manifest);
      issues.push(...inspection.issues);
    } catch { issues.push({ code: "invalid-geojson-json", message: "Geometry artifact is not valid JSON or contains an invalid string encoding" }); }
  } else if (!shapeFiles.length && !geojsonFiles.length) issues.push({ code: "unsupported-format", message: "Missing capability: archive/container decoding. Supply an explicitly extracted Shapefile set or GeoJSON FeatureCollection; ZIP and other formats are not parsed." });
  const normalizationBlockers = [...issues];
  if (manifest) {
    for (const key of /** @type {const} */ (["publisher", "sourceReference", "version", "attribution"])) {
      if (!manifest.dataset[key]) normalizationBlockers.push({ code: "incomplete-provenance", message: `Candidate requires dataset.${key}` });
    }
    if (!manifest.dataset.dates.retrieved) normalizationBlockers.push({ code: "incomplete-provenance", message: "Candidate requires dataset.dates.retrieved" });
  }
  if (!inspection) normalizationBlockers.push({ code: "geometry-uninspected", message: "Geometry, fields, count and topology cannot be inferred from file names or projection text" });
  const toolFiles = ["./inspect-bangkok-boundaries.mjs", "./boundaries/inspect.mjs", "./boundaries/shapefile.mjs",
    "./boundaries/topology.mjs", "./boundaries/gis-types.d.ts", "../src/lib/administrative-boundary.ts", "../package-lock.json"];
  const toolInputs = await Promise.all(toolFiles.map(async (path) => ({ path, sha256: sha256(await readFile(new URL(path, import.meta.url))) })));
  const toolSha256 = sha256(json(toolInputs));
  const dependencies = Object.fromEntries(await Promise.all(["shapefile", "@types/shapefile", "proj4", "jsts"].map(async (name) => {
    const metadata = decodeJson(await readFile(require.resolve(`${name}/package.json`)));
    return [name, metadata.version];
  })));
  const releaseObservations = { featureCount: manifest?.observedFeatureCount ?? null, parentCount: manifest?.observedParentCount ?? null };
  const report = {
    schemaVersion: 1,
    stage: "inspected-source",
    tool: { name: "yaan-boundary-inspector", version: TOOL_VERSION, sha256: toolSha256, node: process.versions.node, dependencies, inputs: toolInputs },
    artifacts: artifacts.map(({ path, sha256, bytes }) => ({ path, sha256, bytes })),
    manifestSha256,
    dataset: manifest?.dataset ?? null,
    sourceCrs: { manifest: manifest?.dataset.sourceCrs ?? null, sidecars: projectionFiles, inputCoordinates: manifest?.inputCoordinates ?? null },
    components,
    releaseObservations,
    gis: decoded ? { sourceCrs: decoded.sourceCrs, encoding: decoded.encoding, dbf: decoded.dbf,
      beforeTransformation: decoded.before, targetCrs: "OGC:CRS84", geometryRepair: "none" } : null,
    summary: inspection?.summary ?? null,
    issues, warnings,
    normalization: { eligible: normalizationBlockers.length === 0, blockers: normalizationBlockers },
    activation: { eligible: /** @type {const} */ (false), blockers: activationBlockers(manifest) },
  };
  /** @type {BoundaryCandidate | null} */
  let candidate = null;
  if (normalizationBlockers.length === 0 && manifest?.dataset.version && manifestSha256 && inspection) {
    candidate = {
      stage: "normalized-candidate", coordinateReferenceSystem: "OGC:CRS84",
      dataset: { ...manifest.dataset, ...(decoded ? { sourceCrs: { ...decoded.sourceCrs,
        evidence: [manifest.dataset.sourceCrs.evidence, decoded.sourceCrs.evidence].filter(Boolean).join("; ") } } : {}),
        version: manifest.dataset.version, transformations: [...manifest.dataset.transformations, {
        tool: "yaan-boundary-inspector", version: `${TOOL_VERSION}+sha256:${toolSha256}`,
        operation: decoded
          ? `SHP/DBF decode (${decoded.encoding.label}); lexical string codes and names; EPSG:32647 to EPSG:4326 with longitude/latitude output; RFC 7946 winding; JSTS before/after validation; no rounding, simplification or topology repair. Dependencies: ${JSON.stringify(dependencies)}`
          : "Field mapping, bounds calculation and JSTS validation; coordinates/rings/parts preserved without reprojection or simplification",
        inputChecksums: report.artifacts.map(({ path, sha256 }) => ({ path, sha256 })),
        sourceCrs: decoded ? "EPSG:32647" : "OGC:CRS84", targetCrs: "OGC:CRS84",
        evidence: decoded ? `${decoded.sourceCrs.evidence}; encoding: ${JSON.stringify(decoded.encoding)}` : manifest.inputCoordinates.evidence ?? "",
      }] },
      boundaries: inspection.boundaries,
      inspection: { manifestSha256, toolSha256, reportSha256: sha256(json(report)) },
      releaseObservations,
      activation: report.activation,
    };
  }
  return { report, candidate };
}

/** @param {string[]} args */
async function main(args) {
  /** @type {Record<string, string>} */
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    if (!["--source", "--manifest", "--report", "--candidate"].includes(key) || !args[i + 1] || args[i + 1].startsWith("--") || options[key]) {
      throw new Error("Usage: node scripts/inspect-bangkok-boundaries.mjs --source <local file/directory> [--manifest <json>] [--report <new json>] [--candidate <new json>]");
    }
    options[key] = args[i + 1];
  }
  if (!options["--source"]) throw new Error("An explicit local --source path is required");
  const outputs = [options["--report"], options["--candidate"]].filter(Boolean).map((path) => resolve(path));
  if (new Set(outputs).size !== outputs.length) throw new Error("Report and candidate must have distinct output paths");
  for (const path of outputs) {
    try { await lstat(path); } catch (error) {
      if (/** @type {NodeJS.ErrnoException} */ (error).code === "ENOENT") continue;
      throw error;
    }
    throw new Error(`Refusing to overwrite an existing output: ${path}`);
  }
  const { report, candidate } = await inspectLocalSource({ source: options["--source"], manifest: options["--manifest"] });
  if (options["--candidate"] && candidate) await writeFile(options["--candidate"], json(candidate), { flag: "wx" });
  if (options["--report"]) await writeFile(options["--report"], json(report), { flag: "wx" });
  else process.stdout.write(json(report));
  // A clean inspection means candidate eligibility only. Activation is always false.
  process.exitCode = report.normalization.eligible ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : "Boundary inspection failed"}\n`);
    process.exitCode = 2;
  });
}

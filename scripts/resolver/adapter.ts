import type {
  DatasetAdapterResult, DatasetDenial, DatasetGateResult, DatasetRejectionCode,
  NormalizedAdministrativeDataset, OfflineDatasetAuthorization,
} from "../../src/lib/administrative-dataset-adapter";
import type { AdministrativeResolverDataset } from "../../src/lib/administrative-resolver";
import { inspectGeometry, sha256 } from "../boundaries/inspect.mjs";
import { validUnit, validateResolverDataset } from "./core";

const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0 &&
  v.isWellFormed() && !/[\u0000-\u001f\u007f]/u.test(v);
const hash = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{64}$/u.test(v);
const artifactPath = (v: unknown): v is string => text(v) && /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/u.test(v);

class Rejection extends Error {
  constructor(readonly code: DatasetRejectionCode, readonly path: string) { super(code); }
}
function requireCheck(value: unknown, code: DatasetRejectionCode, path: string): asserts value {
  if (!value) throw new Rejection(code, path);
}
function denial(error: unknown): DatasetDenial {
  return { status: "denied", activation: { eligible: false }, diagnostics: [{
    code: error instanceof Rejection ? error.code : "malformed_bundle",
    path: error instanceof Rejection ? error.path : "bundle",
  }] };
}
function parse(value: unknown): Record<string, unknown> {
  requireCheck(typeof value === "string" && value.isWellFormed(), "malformed_bundle", "json");
  const parsed: unknown = JSON.parse(value);
  requireCheck(record(parsed), "malformed_bundle", "json");
  return parsed;
}

/** Only caller-supplied bytes and separately trusted pins are compared. No evidence is fetched. */
function checkEvidence(input: unknown, trusted: unknown) {
  requireCheck(record(input), "malformed_bundle", "bundle");
  const data = parse(input.datasetJson);
  // No real release is admitted, regardless of asserted eligibility or review fields.
  const provenance = record(data.provenance) ? data.provenance : {};
  const qualification = record(provenance.qualification) ? provenance.qualification : {};
  requireCheck(data.kind === "synthetic" && text(provenance.id) && provenance.id.startsWith("synthetic:") &&
    qualification.status === "synthetic" && provenance.official === false, "real_dataset_disabled", "dataset.provenance");
  requireCheck(record(provenance.activation) && provenance.activation.eligible === false,
    "dataset_not_inactive", "dataset.provenance.activation");
  requireCheck(data.schemaVersion === 1, "unsupported_schema", "dataset.schemaVersion");
  requireCheck(data.coordinateReferenceSystem === "OGC:CRS84" && !Object.hasOwn(data, "crs"), "invalid_crs", "dataset.coordinateReferenceSystem");
  requireCheck(data.coordinateOrder === "longitude-latitude", "invalid_coordinate_order", "dataset.coordinateOrder");
  requireCheck(trusted != null, "missing_authorization", "trustedAuthorization");
  requireCheck(record(trusted), "invalid_authorization", "trustedAuthorization");
  requireCheck(trusted.scope === "synthetic-offline-test", "unsupported_scope", "trustedAuthorization.scope");
  requireCheck(trusted.schemaVersion === 1 && trusted.decision === "approved" &&
    text(trusted.authorizedBy) && text(trusted.reference) && hash(trusted.qualificationSha256) &&
    record(trusted.subject) && text(trusted.subject.id) && text(trusted.subject.version) && hash(trusted.subject.sha256),
    "invalid_authorization", "trustedAuthorization");
  const authorization = trusted as unknown as OfflineDatasetAuthorization;
  requireCheck(provenance.id === authorization.subject.id, "dataset_identity_mismatch", "dataset.provenance.id");
  requireCheck(provenance.version === authorization.subject.version, "unsupported_dataset_version", "dataset.provenance.version");
  requireCheck(sha256(input.datasetJson as string) === authorization.subject.sha256,
    "integrity_mismatch", "datasetJson");
  const report = parse(input.qualificationJson);
  requireCheck(sha256(input.qualificationJson as string) === authorization.qualificationSha256,
    "integrity_mismatch", "qualificationJson");
  requireCheck(report.schemaVersion === 1, "unsupported_schema", "qualification.schemaVersion");
  requireCheck(report.scope === "synthetic-offline-test", "unsupported_scope", "qualification.scope");
  requireCheck(report.decision === "approved" && text(report.reviewedBy) && text(report.reference) &&
    record(report.subject) && report.subject.id === authorization.subject.id &&
    report.subject.version === authorization.subject.version && report.subject.sha256 === authorization.subject.sha256 &&
    record(report.checks) && ["crs", "geometry", "coverage", "hierarchy", "names"].every((key) =>
      (report.checks as Record<string, unknown>)[key] === "verified"), "invalid_qualification", "qualification");
  requireCheck(Array.isArray(input.evidence), "missing_evidence", "bundle.evidence");
  const evidence = new Map<string, string>();
  for (const item of input.evidence) {
    requireCheck(record(item) && artifactPath(item.path) && typeof item.content === "string" &&
      item.content.trim().length > 0 && item.content.isWellFormed() && !evidence.has(item.path),
      "malformed_bundle", "bundle.evidence");
    evidence.set(item.path, item.content);
  }
  const referenced = new Set<string>();
  for (const key of ["sourceAuthority", "license", "authorization"] as const) {
    const item = report[key];
    requireCheck(record(item), "missing_evidence", `qualification.${key}`);
    requireCheck(item.status === "verified" && text(item.reference) && record(item.artifact) &&
      artifactPath(item.artifact.path) && hash(item.artifact.sha256), "unverified_evidence", `qualification.${key}`);
    const artifact = item.artifact;
    requireCheck(evidence.has(artifact.path as string), "missing_evidence", `qualification.${key}.artifact`);
    requireCheck(sha256(evidence.get(artifact.path as string)!) === artifact.sha256, "integrity_mismatch", `qualification.${key}.artifact`);
    if (key === "license") requireCheck(text(item.terms) && item.permittedUse === "offline-resolver-test", "invalid_license", "qualification.license");
    referenced.add(artifact.path as string);
  }
  requireCheck(referenced.size === evidence.size, "malformed_bundle", "bundle.evidence.unreferenced");
  return {
    data: data as unknown as NormalizedAdministrativeDataset,
    authorization,
  };
}

/** Evidence acceptance alone does not assert valid geometry or production authorization. */
export function evaluateDatasetGate(bundle: unknown, trustedAuthorization: unknown): DatasetGateResult {
  try {
    const { authorization } = checkEvidence(bundle, trustedAuthorization);
    return { status: "evidence_accepted", scope: "synthetic-offline-test", activation: { eligible: false },
      subject: { ...authorization.subject } };
  } catch (error) { return denial(error); }
}

/** Converts only evidence-pinned synthetic normalized data; never mutates input or activates it. */
export function adaptAdministrativeDataset(bundle: unknown, trustedAuthorization: unknown): DatasetAdapterResult {
  try {
    const { data, authorization } = checkEvidence(bundle, trustedAuthorization);
    requireCheck(Array.isArray(data.features) && data.features.length > 0, "invalid_features", "dataset.features");
    requireCheck(Array.isArray(data.parents), "invalid_hierarchy", "dataset.parents");
    const level = data.provenance.coverage?.level;
    requireCheck(level === "khwaeng" || level === "khet", "invalid_features", "dataset.provenance.coverage.level");
    requireCheck(!record(data.coverageGeometry) || !Object.hasOwn(data.coverageGeometry, "crs"), "invalid_crs", "dataset.coverageGeometry");
    const parents = new Set<string>();
    for (const parent of data.parents) {
      requireCheck(validUnit(parent, "khet") && !parents.has(parent.id), "invalid_hierarchy", "dataset.parents");
      parents.add(parent.id);
    }
    requireCheck(level !== "khet" || parents.size === 0, "invalid_hierarchy", "dataset.parents");
    const ids = new Set<string>(), sourceIndices = new Set<number>();
    const boundaries = data.features.map((feature, index) => {
      const path = `dataset.features[${index}]`;
      requireCheck(record(feature) && validUnit(feature.unit, level) && !ids.has(feature.unit.id), "invalid_identity", `${path}.unit`);
      requireCheck(!Object.hasOwn(feature, "crs") && (!record(feature.geometry) || !Object.hasOwn(feature.geometry, "crs")),
        "invalid_crs", `${path}.geometry`);
      ids.add(feature.unit.id);
      requireCheck(feature.dataset?.id === data.provenance.id && feature.dataset?.version === data.provenance.version,
        "dataset_identity_mismatch", `${path}.dataset`);
      requireCheck(feature.provenance && Number.isSafeInteger(feature.provenance.sourceFeatureIndex) &&
        feature.provenance.sourceFeatureIndex >= 0 && !sourceIndices.has(feature.provenance.sourceFeatureIndex) &&
        ["none", "source-defined", "unknown"].includes(feature.provenance.generalization), "invalid_features", `${path}.provenance`);
      sourceIndices.add(feature.provenance.sourceFeatureIndex);
      if (feature.unit.level === "khwaeng") requireCheck(parents.has(feature.unit.parentId), "invalid_hierarchy", `${path}.unit.parentId`);
      const inspected = inspectGeometry(feature.geometry);
      requireCheck(!inspected.errors.length && !inspected.outsideWgs84Range && inspected.bounds,
        "invalid_geometry", `${path}.geometry`);
      requireCheck(Array.isArray(feature.bounds) && feature.bounds.length === 4 &&
        feature.bounds.every((n, i) => n === inspected.bounds![i]), "invalid_bounds", `${path}.bounds`);
      return { unit: feature.unit, geometry: feature.geometry };
    });
    const dataset: AdministrativeResolverDataset = {
      coordinateReferenceSystem: data.coordinateReferenceSystem, provenance: data.provenance,
      coverageGeometry: data.coverageGeometry, boundaries,
    };
    requireCheck(validateResolverDataset(dataset), "resolver_validation_failed", "dataset");
    return {
      status: "ready_for_offline_test", scope: "synthetic-offline-test", activation: { eligible: false }, dataset,
      audit: { subject: { ...authorization.subject }, qualificationSha256: authorization.qualificationSha256,
        authorizationReference: authorization.reference },
    };
  } catch (error) { return denial(error); }
}

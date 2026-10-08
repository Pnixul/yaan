import type { AdministrativeBoundary, AdministrativeUnit, ArtifactChecksum, BoundaryGeometry } from "./administrative-boundary";
import type { AdministrativeResolverDataset, ResolverProvenance } from "./administrative-resolver";

/** Provider-neutral normalized envelope. Schema and publisher release versions are separate. */
export type NormalizedAdministrativeDataset = {
  schemaVersion: 1;
  kind: "synthetic" | "real";
  coordinateReferenceSystem: "OGC:CRS84";
  coordinateOrder: "longitude-latitude";
  provenance: ResolverProvenance;
  coverageGeometry: BoundaryGeometry;
  /** Complete parent identity inventory for khwaeng; empty for a khet dataset. */
  parents: AdministrativeUnit[];
  features: AdministrativeBoundary[];
};

export type DatasetSubject = { id: string; version: string; sha256: string };
export type ReviewedEvidence = {
  status: "verified" | "unverified";
  reference: string;
  artifact: ArtifactChecksum;
};

/** This decision is meaningful only when its exact bytes are independently authorized. */
export type OfflineQualificationDecision = {
  schemaVersion: 1;
  scope: "synthetic-offline-test";
  subject: DatasetSubject;
  decision: "approved" | "denied" | "deferred";
  reviewedBy: string;
  reference: string;
  checks: Record<"crs" | "geometry" | "coverage" | "hierarchy" | "names", "verified" | "unverified">;
  sourceAuthority: ReviewedEvidence;
  license: ReviewedEvidence & { terms: string; permittedUse: "offline-resolver-test" };
  authorization: ReviewedEvidence;
};

/** Trusted configuration supplied separately from the untrusted artifact bundle.
 * No producer of a dataset may issue this record on its own behalf in a future integration. */
export type OfflineDatasetAuthorization = {
  schemaVersion: 1;
  scope: "synthetic-offline-test";
  decision: "approved";
  subject: DatasetSubject;
  qualificationSha256: string;
  authorizedBy: string;
  reference: string;
};

/** Exact UTF-8 text is hashed, including whitespace. The caller owns all I/O. */
export type NormalizedDatasetBundle = {
  datasetJson: string;
  qualificationJson: string;
  evidence: { path: string; content: string }[];
};

export type DatasetRejectionCode =
  | "malformed_bundle" | "unsupported_schema" | "real_dataset_disabled"
  | "dataset_not_inactive" | "missing_authorization" | "invalid_authorization"
  | "unsupported_scope" | "dataset_identity_mismatch" | "unsupported_dataset_version"
  | "integrity_mismatch" | "invalid_qualification" | "missing_evidence"
  | "unverified_evidence" | "invalid_license" | "invalid_crs" | "invalid_coordinate_order"
  | "invalid_features" | "invalid_identity" | "invalid_bounds" | "invalid_geometry" | "invalid_hierarchy"
  | "resolver_validation_failed";

export type DatasetDenial = {
  status: "denied";
  activation: { eligible: false };
  /** Stable first-failure diagnostic; no source contents or exception strings. */
  diagnostics: { code: DatasetRejectionCode; path: string }[];
};
export type DatasetGateResult = DatasetDenial | {
  status: "evidence_accepted";
  scope: "synthetic-offline-test";
  activation: { eligible: false };
  subject: DatasetSubject;
};
export type DatasetAdapterResult = DatasetDenial | {
  status: "ready_for_offline_test";
  scope: "synthetic-offline-test";
  activation: { eligible: false };
  dataset: AdministrativeResolverDataset;
  audit: { subject: DatasetSubject; qualificationSha256: string; authorizationReference: string };
};

export type AdministrativeDatasetAdapter = (
  bundle: NormalizedDatasetBundle,
  trustedAuthorization: OfflineDatasetAuthorization | null,
) => DatasetAdapterResult;

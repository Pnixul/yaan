/** Official administrative identities are independent of search providers and UI fixtures. */
export type AdministrativeLevel = "khet" | "khwaeng";
export type AdministrativeUnitId = `${string}:${AdministrativeLevel}:${string}`;

type UnitIdentity = {
  id: AdministrativeUnitId;
  officialCode: string;
  codeNamespace: string;
  nameTh: string;
  /** Only an English name supplied by the identified source. */
  nameEn?: string;
};

export type AdministrativeUnit = UnitIdentity &
  (
    | { level: "khet"; parentId?: never }
    | { level: "khwaeng"; parentId: AdministrativeUnitId }
  );

export type ArtifactChecksum = {
  /** Relative artifact name; never a URL to fetch implicitly. */
  path: string;
  sha256: string;
};

export type ImportTransformation = {
  tool: string;
  version: string;
  operation: string;
  inputChecksums: ArtifactChecksum[];
  sourceCrs: string | null;
  targetCrs: string | null;
  evidence: string;
};

/** Null means unknown, not a default or an assertion of permission/quality. */
export type BoundaryDataset = {
  id: string;
  publisher: string | null;
  sourceReference: string | null;
  version: string | null;
  dates: {
    published: string | null;
    effective: string | null;
    retrieved: string | null;
  };
  artifacts: ArtifactChecksum[];
  license: {
    status: "unspecified" | "unresolved" | "specified";
    reference: string | null;
    /** Source terms, not an inferred SPDX identifier. */
    terms: string | null;
  };
  attribution: string | null;
  coverage: { countryCode: "TH"; area: "Bangkok"; level: AdministrativeLevel };
  sourceCrs: {
    definition: string | null;
    authorityCode: string | null;
    evidence: string | null;
  };
  knownLimitations: string[];
  transformations: ImportTransformation[];
};

/** Candidate/canonical coordinates only: verified WGS84 longitude, latitude. */
export type BoundaryPosition = [longitude: number, latitude: number];
export type BoundaryGeometry =
  | { type: "Polygon"; coordinates: BoundaryPosition[][] }
  | { type: "MultiPolygon"; coordinates: BoundaryPosition[][][] };
export type BoundaryBounds = [west: number, south: number, east: number, north: number];

export type AdministrativeBoundary = {
  unit: AdministrativeUnit;
  dataset: { id: string; version: string };
  geometry: BoundaryGeometry;
  bounds: BoundaryBounds;
  provenance: {
    sourceFeatureIndex: number;
    /** No simplification is performed by the Checkpoint 2 importer. */
    generalization: "none" | "source-defined" | "unknown";
  };
};

export type BoundaryManifest = {
  schemaVersion: 1;
  dataset: BoundaryDataset;
  codeNamespace: string;
  /** Explicit mappings, discovered from the release, never assumed DBF fields. */
  fields: { code: string; nameTh: string; nameEn: string | null; parentCode: string | null };
  inputCoordinates: {
    status: "unverified" | "verified-wgs84-longitude-latitude" | "requires-transformation";
    /** Audit reference to CRS and axis-order verification for the checksummed input. */
    evidence: string | null;
  };
  /** Required only when encoding is attested by a checksummed metadata artifact instead of .cpg. */
  sourceEncoding?: { label: string; artifactPath: string; evidence: string } | null;
  parentInventory: {
    datasetId: string;
    version: string;
    sourceReference: string;
    sha256: string;
    codes: string[];
  } | null;
  /** A release-specific observation; no global khwaeng-count invariant. */
  observedFeatureCount: { count: number; evidence: string } | null;
  observedParentCount?: { count: number; evidence: string } | null;
};

export type BoundaryDatasetStage =
  | "raw-source"
  | "inspected-source"
  | "normalized-candidate"
  | "validated-canonical";

/** This tool cannot create a validated-canonical release or activate one. */
export type BoundaryCandidate = {
  stage: "normalized-candidate";
  coordinateReferenceSystem: "OGC:CRS84";
  dataset: BoundaryDataset & { version: string };
  boundaries: AdministrativeBoundary[];
  inspection: { manifestSha256: string; toolSha256: string; reportSha256: string };
  releaseObservations: {
    featureCount: BoundaryManifest["observedFeatureCount"];
    parentCount: NonNullable<BoundaryManifest["observedParentCount"]> | null;
  };
  activation: { eligible: false; blockers: string[] };
};

import type {
  AdministrativeLevel,
  AdministrativeUnit,
  BoundaryGeometry,
} from "./administrative-boundary";

/** WGS84 degrees. Named fields deliberately avoid tuple axis-order ambiguity. */
export type AdministrativeCoordinate = { latitude: number; longitude: number };

export type ResolverProvenance = {
  id: string;
  version: string;
  publisher: string;
  sourceReference: string;
  qualification: {
    status: "synthetic" | "unqualified" | "qualified";
    /** Evidence reference, not permission to activate. Null for synthetic fixtures. */
    reference: string | null;
  };
  official: boolean;
  activation: { eligible: boolean };
  knownLimitations: string[];
  coverage: { id: string; description: string; level: AdministrativeLevel };
};

/** Adapter output; the core validates this snapshot before any point lookup. */
export type AdministrativeResolverDataset = {
  coordinateReferenceSystem: "OGC:CRS84";
  provenance: ResolverProvenance;
  /** Declared supported area, distinct from individual unit polygons. */
  coverageGeometry: BoundaryGeometry;
  boundaries: { unit: AdministrativeUnit; geometry: BoundaryGeometry }[];
};

/** Ingestion stays outside the resolver. No files, URLs or providers are auto-discovered. */
export interface AdministrativeDatasetProvider {
  getDataset(): AdministrativeResolverDataset | null;
}

export type AdministrativeResolution =
  | { status: "resolved"; unit: AdministrativeUnit; dataset: ResolverProvenance }
  | { status: "outside_coverage"; dataset: ResolverProvenance }
  | {
      status: "ambiguous";
      reasons: ("boundary" | "overlap")[];
      /** Sorted by stable ID for presentation only, never a ranking/tie-break. */
      matches: { unit: AdministrativeUnit; relation: "interior" | "boundary" }[];
      coverageBoundary: boolean;
      dataset: ResolverProvenance;
    }
  | {
      status: "unavailable";
      reason:
        | "no_dataset"
        | "provider_error"
        | "dataset_not_enabled"
        | "invalid_dataset"
        | "coverage_gap"
        | "geometry_error";
    }
  | { status: "invalid_input"; reason: "invalid_coordinates" };

export interface AdministrativeResolver {
  /** Accepts the named coordinate object; unknown allows safe request-boundary validation. */
  resolve(input: unknown): AdministrativeResolution;
}

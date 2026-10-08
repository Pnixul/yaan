import type {
  NormalizedAdministrativeDataset, NormalizedDatasetBundle,
  OfflineDatasetAuthorization, OfflineQualificationDecision,
} from "../../src/lib/administrative-dataset-adapter";
import { inspectGeometry, json, sha256 } from "../boundaries/inspect.mjs";
import { syntheticResolverDataset } from "./administrative-resolver";

/** Test-only evidence simulation. None of these strings is a real license or approval. */
export function syntheticAdapterFixture() {
  const source = syntheticResolverDataset();
  const dataset: NormalizedAdministrativeDataset = {
    schemaVersion: 1, kind: "synthetic", coordinateReferenceSystem: "OGC:CRS84", coordinateOrder: "longitude-latitude",
    provenance: source.provenance, coverageGeometry: source.coverageGeometry,
    parents: [{ id: "synthetic-yaan:khet:parent", officialCode: "parent", codeNamespace: "synthetic-yaan",
      level: "khet", nameTh: "เขตทดสอบ (สังเคราะห์)" }],
    features: source.boundaries.map(({ unit, geometry }, index) => ({
      unit, geometry, dataset: { id: source.provenance.id, version: source.provenance.version },
      bounds: inspectGeometry(geometry).bounds!, provenance: { sourceFeatureIndex: index, generalization: "none" },
    })),
  };
  const evidence = [
    { path: "source.txt", content: "SIMULATED: repository-authored test shapes, no real administrative authority." },
    { path: "license.txt", content: "SIMULATED license evidence for offline test fixtures only; no real-source permission asserted." },
    { path: "authorization.txt", content: "SIMULATED review authorization for this synthetic offline test; never production." },
  ];
  const datasetJson = json(dataset);
  const subject = { id: dataset.provenance.id, version: dataset.provenance.version, sha256: sha256(datasetJson) };
  const reviewed = (index: number) => ({ status: "verified" as const, reference: `synthetic:review/${evidence[index].path}`,
    artifact: { path: evidence[index].path, sha256: sha256(evidence[index].content) } });
  const qualification: OfflineQualificationDecision = {
    schemaVersion: 1, scope: "synthetic-offline-test", subject, decision: "approved",
    reviewedBy: "synthetic:test-reviewer", reference: "synthetic:qualification/1",
    checks: { crs: "verified", geometry: "verified", coverage: "verified", hierarchy: "verified", names: "verified" },
    sourceAuthority: reviewed(0),
    license: { ...reviewed(1), terms: "SIMULATED fixture-only permission", permittedUse: "offline-resolver-test" },
    authorization: reviewed(2),
  };
  const qualificationJson = json(qualification);
  const bundle: NormalizedDatasetBundle = { datasetJson, qualificationJson, evidence };
  // Trust-anchor simulation belongs ONLY to tests; the adapter never generates approvals.
  const authorization: OfflineDatasetAuthorization = {
    schemaVersion: 1, scope: "synthetic-offline-test", decision: "approved", subject: { ...subject },
    qualificationSha256: sha256(qualificationJson), authorizedBy: "synthetic:test-authorizer", reference: "synthetic:authorization/1",
  };
  return { dataset, qualification, bundle, authorization };
}

/** Metadata-only regression snapshot from Checkpoint 2.5; no real geometry or approval. */
export const inactiveBmaMetadata = {
  stage: "normalized-candidate",
  dataset: {
    id: "bma-bangkok-khwaeng", version: "yaan-snapshot-2026-10-08-zip-83d0f2cdd6ab",
    license: { status: "unspecified", reference: null, terms: null },
  },
  qualification: { status: "blocked", sourceAuthority: "unverified-needs-resource-specific-evidence" },
  activation: { eligible: false },
};

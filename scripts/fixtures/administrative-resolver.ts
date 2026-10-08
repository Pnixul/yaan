import type { AdministrativeResolverDataset } from "../../src/lib/administrative-resolver";
import type { BoundaryGeometry } from "../../src/lib/administrative-boundary";

/** Fictional rectangles far from Bangkok. No real administrative claims. */
export const rectangle = (west: number, south: number, east: number, north: number): BoundaryGeometry => ({
  type: "Polygon", coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]],
});

export function syntheticResolverDataset(): AdministrativeResolverDataset {
  return {
    coordinateReferenceSystem: "OGC:CRS84",
    provenance: {
      id: "synthetic:resolver-fixture", version: "1",
      publisher: "YAAN test authors",
      sourceReference: "repository:scripts/fixtures/administrative-resolver.ts",
      qualification: { status: "synthetic", reference: null },
      official: false, activation: { eligible: false },
      knownLimitations: ["Invented test geometry and names; no real administrative coverage."],
      coverage: { id: "synthetic:test-area", description: "Fictional test area", level: "khwaeng" },
    },
    coverageGeometry: rectangle(0, 0, 10, 10),
    boundaries: [
      {
        unit: { id: "synthetic-yaan:khwaeng:a", officialCode: "a", codeNamespace: "synthetic-yaan",
          level: "khwaeng", parentId: "synthetic-yaan:khet:parent", nameTh: "แขวงทดสอบ ก (สังเคราะห์)" },
        geometry: { type: "Polygon", coordinates: [
          [[0, 0], [5, 0], [5, 10], [0, 10], [0, 0]],
          [[1, 1], [1, 2], [2, 2], [2, 1], [1, 1]],
        ] },
      },
      {
        unit: { id: "synthetic-yaan:khwaeng:b", officialCode: "b", codeNamespace: "synthetic-yaan",
          level: "khwaeng", parentId: "synthetic-yaan:khet:parent", nameTh: "แขวงทดสอบ ข (สังเคราะห์)" },
        geometry: rectangle(5, 0, 10, 10),
      },
    ],
  };
}

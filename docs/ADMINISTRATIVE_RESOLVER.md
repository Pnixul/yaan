# Administrative coordinate resolver — Checkpoint 2.6

Status: pure, offline foundation tested only with synthetic data. **No endpoint, application integration or real dataset admission exists.** BMA qualification is deferred; its candidate remains inactive. Data policy belongs to [DATA.md](DATA.md), architecture to [TECH_STACK.md](TECH_STACK.md), and prior qualification to [the boundary workflow](../data/bangkok-boundaries/README.md).

## Structure and ownership

- `src/lib/administrative-resolver.ts`: provider-independent contracts; reuses `AdministrativeUnit`, administrative levels and `BoundaryGeometry` from `administrative-boundary.ts`.
- `scripts/resolver/core.ts`: `createAdministrativeResolver(provider)` prepares one isolated in-memory snapshot and returns an `AdministrativeResolver`. `resolve(input)` is deterministic for that snapshot; it performs no I/O, logging, mutation, asynchronous work or coordinate persistence.
- `scripts/fixtures/administrative-resolver.ts`: fictional shapes near longitude/latitude zero, invented Thai names, synthetic namespaces and explicit non-official provenance. Independent of both BMA artifacts and Explore mock fixtures.
- `scripts/administrative-resolver.test.mjs`: Node tests using the project's TypeScript transpilation convention and the actual installed GIS implementation.

`AdministrativeDatasetProvider.getDataset()` supplies a typed dataset snapshot or `null`. Acquisition, decoding, reprojection, qualification and release selection belong to a future adapter, not point lookup. Provider exceptions become generic `unavailable` results. The factory reads once; replacing data requires constructing another resolver. Provider and caller mutations cannot alter a prepared snapshot; returned objects are detached copies.

The pure implementation remains under `scripts` because JSTS is an existing **development-only** GIS dependency. It reuses `validCoordinates` from `location.ts`, geometry inspection and stable ID construction from `scripts/boundaries/inspect.mjs`, and existing topology validation. JSTS `SimplePointInAreaLocator` supplies polygon/hole/border classification; `RelateOp.covers` checks that every unit lies within the declared coverage. No new package or handwritten competing point-in-polygon algorithm is introduced. Preparation validates all features once; lookups scan the small dataset. A spatial index or runtime packaging decision is outside this checkpoint.

## Coordinates and dataset admission

Input is exactly `{ latitude: number, longitude: number }` in WGS84 degrees. Latitude is within `[-90, 90]`, longitude within `[-180, 180]`, and both must be finite numbers. Missing/extra fields, tuples, strings, null and non-finite numbers are invalid. There is no coercion, clamping, automatic axis swap or Bangkok bounding-box heuristic. Named coordinates convert to geometry order `[longitude, latitude]`.

Dataset geometry must declare `OGC:CRS84`: WGS84 longitude/latitude, two dimensions, Polygon or MultiPolygon with closed rings. The core does not accept projected metres or perform CRS conversion. It rejects malformed/invalid topology, out-of-range vertices and longitude extents of 180 degrees or more. This is a planar polygon interpretation of local longitude/latitude coordinates, not geodesic or antimeridian/polar resolution. Vertex precision is retained; no boundary buffer, epsilon, snapping or repair is applied. Near-border positional accuracy is not inferred.

Admission at 2.6 requires **all** of: `qualification.status: "synthetic"`, `official: false`, `activation.eligible: false`, a `synthetic:` dataset ID and synthetic unit namespaces. Every non-synthetic dataset is rejected, even one labelled `qualified` or with activation set to true. A normalized BMA candidate is not an adapter snapshot and cannot be passed through as an eligible dataset. There is no automatic provider, filesystem lookup or fallback.

The contract reserves `unqualified` and `qualified` states to make provenance explicit, not to enable them. A future real-data adapter must independently verify canonical qualification evidence, license suitability, source authority, version/checksum identity, spatial coverage and explicit activation authorization. A JSON flag is not evidence. Such an adapter and any runtime GIS dependency change require a separate checkpoint. Synthetic results must never be served by a future production endpoint.

## Metadata, coverage and match semantics

A snapshot declares one administrative level, one coverage geometry, source/publisher reference, version, qualification status/reference, activation status, limitations and units. Required metadata must be nonempty; unknown required metadata makes the entire snapshot unavailable. Required Thai names follow the existing `AdministrativeUnit` contract; the resolver never guesses or completes them. Optional sourced English names may be absent. `officialCode` is the shared identity field name, **not** proof of official status: synthetic codes remain synthetic. A khwaeng includes a stable parent ID only; no parent name or spatial containment claim is fabricated. Resolving a khet level uses a separate dataset snapshot, avoiding parent/child matches being misclassified as overlap.

All identities must be unique and consistent with the declared namespace/level/code. All geometries, including coverage, must pass structural and JSTS topology checks. A malformed feature invalidates the whole snapshot; it is never silently dropped. Individual polygons may overlap to exercise ambiguity handling; the core does not qualify their administrative correctness.

| Result | Meaning |
| --- | --- |
| `resolved` | Exactly one unit interior, with no unit/coverage boundary contact. Includes stable unit identity, sourced names, parent ID when applicable, and dataset provenance. |
| `outside_coverage` | Valid coordinates strictly outside the explicitly declared supported coverage, including its explicitly excluded holes. This is not a claim about an official Bangkok boundary. |
| `ambiguous` | Any unit or coverage border contact, or multiple unit interiors. Includes all touching/containing units and their `interior`/`boundary` relations, plus reasons and `coverageBoundary`. |
| `unavailable` | Missing/disabled data, invalid metadata/geometry, provider/geometry failure, or no unit match inside declared coverage (`coverage_gap`). Missing data never implies outside coverage or safety. |
| `invalid_input` | Invalid coordinate object. Evaluated before dataset availability so bad input remains a client error. |

Polygon holes exclude their interiors; hole edges are boundaries. MultiPolygon parts share one identity. A shared edge/vertex is ambiguous, as is an outer edge touched by only one unit. A coverage border can return ambiguity with an empty `matches` array. Boundary reasons take account of every match; `overlap` specifically means multiple interior matches. Matches are sorted lexically by stable ID solely for deterministic presentation, with no priority or arbitrary winner. The resolver does not infer confidence, geographic accuracy or legal boundary ownership.

## Future server API contract — documentation only

Reserved proposal: `POST /api/administrative/resolve`, JSON body containing only the named coordinate fields. The server chooses one admitted canonical dataset/version and administrative level; callers cannot supply dataset URLs, polygons, provider names or activation flags. This would remain separate from Geoapify search and accessible to guest exploration, subject to future operational controls. No route is implemented or exposed at 2.6.

Request example (deliberately synthetic coordinates):

```http
POST /api/administrative/resolve
Content-Type: application/json

{"latitude":4,"longitude":3}
```

Illustrative response from the **offline synthetic resolver**, not a live API or an acceptable production dataset:

```json
{
  "status": "resolved",
  "unit": {
    "id": "synthetic-yaan:khwaeng:a",
    "officialCode": "a",
    "codeNamespace": "synthetic-yaan",
    "level": "khwaeng",
    "parentId": "synthetic-yaan:khet:parent",
    "nameTh": "แขวงทดสอบ ก (สังเคราะห์)"
  },
  "dataset": {
    "id": "synthetic:resolver-fixture",
    "version": "1",
    "publisher": "YAAN test authors",
    "sourceReference": "repository:scripts/fixtures/administrative-resolver.ts",
    "qualification": { "status": "synthetic", "reference": null },
    "official": false,
    "activation": { "eligible": false },
    "knownLimitations": ["Invented test geometry and names; no real administrative coverage."],
    "coverage": { "id": "synthetic:test-area", "description": "Fictional test area", "level": "khwaeng" }
  }
}
```

| HTTP status | Response / semantics |
| --- | --- |
| `200` | `resolved`, `outside_coverage`, or `ambiguous` using `AdministrativeResolution`. Outside/ambiguity are valid lookup outcomes, not HTTP 404/409 errors. |
| `400` | Malformed JSON or invalid coordinates: `{"status":"invalid_input","reason":"invalid_coordinates"}`. |
| `503` | `unavailable` with a typed generic reason. Example with no active dataset: `{"status":"unavailable","reason":"no_dataset"}`. A known gap uses `coverage_gap`; it is not necessarily transient. No fabricated retry interval. |
| `405` | Unsupported method; `Allow: POST` and `{"error":"method_not_allowed"}`. |
| `415` | Non-JSON content type: `{"error":"unsupported_media_type"}`. |
| `413` | Body exceeds the future route's configured small request limit: `{"error":"request_too_large"}`. |
| `500` | Unexpected transport/server failure: `{"error":"internal_error"}`. No exception text or source payload. |

Examples for the supplied offline fixture: `(longitude 11, latitude 4)` is `outside_coverage` with dataset provenance; `(5,4)` is `ambiguous` with reason `boundary`, both units in `matches`, and `coverageBoundary: false`; `(1.5,1.5)` returns `{"status":"unavailable","reason":"coverage_gap"}`; a string latitude returns the `400` body above. Resolved/outside/ambiguous results always describe which dataset was consulted. Unavailable/invalid responses deliberately omit potentially incomplete or untrusted dataset metadata. Full polygon geometry and input coordinates are not returned.

All future responses must use `Cache-Control: no-store`. POST keeps precise coordinates out of query strings and ordinary URL/access logs; application, proxy and observability configuration must also suppress request bodies/precise coordinates. Do not persist lookups, build coordinate-keyed shared caches, log provider payloads or send coordinates to third parties. Process only coordinates intentionally submitted for the lookup; no background geolocation. This contract does not change existing Explore URL behavior or grant permission to store saved locations. Body limits, abuse controls, transport tests and active-dataset admission must be established before exposing an endpoint.

## Verification and stop boundary

```powershell
node --test scripts/administrative-resolver.test.mjs
npm test
npm run lint
npm run typecheck
npm run build
git diff --check
```

Focused tests use synthetic inputs only: interiors/exteriors, coverage exclusions/gaps, holes, borders/vertices, overlaps, MultiPolygon islands, winding, axis order, metadata/geometry failures, provider errors, snapshot isolation and dataset rejection. These tests provide no BMA qualification or API/production readiness claim. Checkpoint 2.6 ends at this foundation and documented contract; dataset qualification, runtime packaging, public API implementation and application integration remain deferred.

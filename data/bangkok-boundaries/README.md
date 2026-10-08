# Bangkok boundary import and qualification — Milestone 2.5

BMA khwaeng geometry is the primary canonical **candidate**. Source policy belongs to [DATA.md](../../docs/DATA.md); tooling architecture belongs to [TECH_STACK.md](../../docs/TECH_STACK.md). Synthetic fixtures are repository-authored, not official Bangkok evidence.

## Release observations and current qualification

Developer manual qualification of the selected BMA release observed:

- 180 khwaeng and 50 parent khet, unique subdistrict codes and explicit khwaeng → khet hierarchy;
- Thai administrative names;
- 2D Polygon Shapefile records, including multiple rings/parts;
- source CRS WGS 1984 / UTM Zone 47N, corresponding to EPSG:32647;
- geometry licensing **unspecified**.

These are observations for that release, not global validation constants. The earlier 169-khwaeng inventory observation is not this geometry release's count. Record the actual source reference, checksums, field mappings and encoding evidence before import. Milestone 2.4 was implemented without real artifacts. A real local release is now available; the executed Milestone 2.5 results and remaining blockers are recorded below.

## Stages and activation

`raw source → inspected source → normalized candidate → validated canonical dataset`

Every report and candidate has `activation.eligible: false`. An exit code of **0** means eligible to write a normalized candidate, never full qualification or approval for runtime activation. `qualification.status` remains `blocked`, with explicit gates for unresolved evidence. Dataset topology findings do not prevent a lossless, inactive normalized candidate; they prevent canonical qualification. Later qualification must establish license suitability, completeness/coverage, resolve inter-feature overlaps/gaps, source authority, BMA khwaeng-to-parent-khet spatial consistency and independent GISTDA khet agreement.

There is no activation switch, runtime loader, coordinate resolver, public API, React hook, official map layer, UI change, runtime GISTDA fallback or flood integration. Milestone 1 search behavior is unchanged.

## Local workflow

Use the repository's Node/npm environment (`npm ci` includes the pinned development tools). Raw artifacts and working outputs are ignored by Git. Nothing downloads sources, extracts archives or commits production geometry.

1. Manually obtain and extract the actual source into this convention:

   ```text
   data/bangkok-boundaries/raw/bma-khwaeng/<release>/
     <same-stem>.shp
     <same-stem>.shx
     <same-stem>.dbf
     <same-stem>.prj
     <same-stem>.cpg       (when supplied)
     <source metadata>    (when supplied)
   data/bangkok-boundaries/work/
   ```

   Supply a flat directory with exactly one Shapefile set, preserving original bytes. Directory mode checksums every artifact, including JSON/XML metadata. A `.shp` path also works but inventories only recognized same-stem sidecars; prefer directory mode for provenance. Keep the original archive separately with its acquisition URL and checksum. Do not put manifests/reports/converted copies inside the raw directory. Symlinks, multiple releases, archives and orphan components are rejected. The CLI rejects outputs within a raw directory or Shapefile source directory.

2. Create the work directory and run discovery (replace `<release>` with your local directory name):

   ```powershell
   New-Item -ItemType Directory -Force data/bangkok-boundaries/work
   node scripts/inspect-bangkok-boundaries.mjs --source "data/bangkok-boundaries/raw/bma-khwaeng/<release>" --report "data/bangkok-boundaries/work/discovery.json"
   ```

   Without a manifest, exit **1** is expected. When sidecars/encoding are sufficient, discovery reports DBF schema, parsed and normalized geometry statistics, bounds and topology. Otherwise it reports the explicit blocker and raw artifact hashes. Invalid/unsupported inputs never produce a candidate.

3. Copy `manifest.template.json` to `work/bma-release.manifest.json` and complete it from the actual release. The template is deliberately incomplete. Supply:

   - exact artifacts/checksums from discovery, dataset ID/version, publisher, source reference, retrieval date and attribution;
   - actual DBF field mappings for code, Thai name and parent code, plus English name only if sourced;
   - `dataset.sourceCrs.definition`: exact `.prj` WKT; `authorityCode`: `EPSG:32647`; `evidence`: source/inspection reference;
   - `inputCoordinates.status`: `requires-transformation`, with evidence describing the raw UTM source (do not label it WGS84 longitude/latitude);
   - `observedFeatureCount`: `{ "count": 180, "evidence": "<manual observation tied to this release>" }` and `observedParentCount`: `{ "count": 50, "evidence": "<release observation>" }` for the manually qualified release only;
   - separately sourced/versioned/checksummed `parentInventory` if available; otherwise `null`, retaining unchecked parent-inventory qualification;
   - `license.status`: `unspecified`, `reference`/`terms`: `null`; unknown publication/effective dates remain `null`.

   If no `.cpg` is supplied, use directory mode and set `sourceEncoding` to `{ "label": "<verified encoding>", "artifactPath": "<source metadata filename>", "evidence": "<exact source statement/review reference>" }`. The metadata must be present and checksummed. With `.cpg`, this field may stay `null`; any supplied attestation must agree. The importer records metadata evidence but cannot prove the truth of an operator's statement. Do not guess UTF-8 or Windows-874 from the presence of Thai names; check representative decoded names against the source.

   If the source has no publisher version, explicitly identify a YAAN snapshot tied to checksums; do not imply a publisher-assigned version. No official names, codes, metadata or license terms are invented.

4. Qualify and write an inactive candidate:

   ```powershell
   node scripts/inspect-bangkok-boundaries.mjs --source "data/bangkok-boundaries/raw/bma-khwaeng/<release>" --manifest "data/bangkok-boundaries/work/bma-release.manifest.json" --report "data/bangkok-boundaries/work/bma-release.report.json" --candidate "data/bangkok-boundaries/work/bma-release.candidate.json"
   ```

   Outputs must be new paths; existing files are never overwritten. Exit **0** means candidate eligibility; **1** means qualification/validation blockers; **2** means usage/I/O/output-path failure. A blocked run writes no candidate. Omit `--report` to print the report, or `--candidate` for inspection only. Inspect all warnings and activation blockers even on exit 0.

## Tooling and validation

Pinned **devDependencies only**: `shapefile@0.6.6`, `@types/shapefile@0.6.4`, `proj4@2.22.0`, `jsts@2.12.1`. None is imported into application/runtime code. No GDAL/native tool or additional encoding package is required.

- **Binary integrity:** SHP/SHX headers, record lengths/indexes, part offsets, DBF field/record lengths and SHP/DBF alignment are checked before parsing. Only 2D Polygon records and dBASE III without memo, using C/N/F/L/D fields, are supported. Null/Z/M shapes, deleted DBF records and unsupported formats fail explicitly instead of being dropped.
- **Encoding/attributes:** `.cpg` text and checksum, optional metadata evidence and DBF language-driver byte are retained. Code-page aliases 874 and 65001 are recognized; other labels must be supported by the decoder. The language-driver byte is reported, not used to guess encoding. Fatal character decoding rejects invalid bytes. Character values preserve sourced text after removing fixed-width ASCII padding on the right; no Unicode normalization, translation or generic trimming is applied. Mapped numeric DBF identity fields retain their original integer lexical bytes as strings, preserving any leading zeros; decimal/exponent identities fail instead of being coerced or padded.
- **CRS:** actual ESRI/WKT1 `.prj` parameters must match WGS84 / UTM 47N: datum/ellipsoid, metre units, easting/northing axes, meridian, scale and false offsets. Unsupported CRS, datum operations or contradictory manifest evidence fail. Source WKT is preserved. Proj4 transforms every vertex to EPSG:4326 using explicit longitude/latitude order, represented in the candidate as `OGC:CRS84`. Controls include the analytic UTM origin and an off-axis coordinate derived from the published [PROJ UTM example](https://proj.org/en/stable/operations/projections/utm.html).
- **Geometry:** structural checks and JSTS `IsValidOp` run before and after transformation. Polygon/MultiPolygon semantics retain holes and disconnected shells. Source winding and physical ring/point counts guard against the parser's orphan-hole promotion. Output winding follows RFC 7946. No topology repair, rounding, simplification, dimension dropping or ring closure is performed; invalid geometry blocks the entire candidate.
- **Identity/hierarchy:** explicit mapped string codes, sourced names and parents are checked; duplicate/conflicting identities, missing values and unknown parents are reported. Optional counts constrain this release only. Parent-code membership does not prove spatial containment.
- **Dataset topology:** JSTS direct intersections measure every envelope-intersecting feature pair; a balanced union measures union area, connected polygon parts and enclosed voids. Reports retain pair indices (zero-based source record indices), areas and bounds. Shared edges/points are not positive-area overlaps. Shapefile diagnostics use original EPSG:32647 coordinates and projected square metres, avoiding reprojection-induced segment differences. Verified GeoJSON uses square degrees, never ground-area claims. Direct overlay uses no snap/buffer fallback, repair or sliver tolerance; numerical failures remain explicit and affected measurements unavailable. Small slivers may reflect precision effects and need review. Voids include legitimate source holes and are not automatically defects. No exterior-connected gap or missing territory can be certified without an independently qualified coverage reference. Normalized coordinates still receive the existing per-feature checks; these dataset measurements describe the source plane only.

Reports contain feature count, unique child/parent counts, missing values, hierarchy issues, parsed and normalized Polygon/MultiPolygon counts, holes/parts/positions, bounds before/after, per-feature topology status, unsupported-record errors, release observations, checksums and license/provenance gaps. Without field mappings, identity statistics remain unqualified. A failed binary/CRS/encoding preflight leaves geometry statistics unavailable rather than fabricated.

Candidates link to exact report/manifest/tool hashes and preserve the original CRS, licensing and transformation chain. Reports record actual installed tool/dependency and Node versions. The tool hash covers the importer modules, type contracts and lockfile. Identical bytes, manifest, tools and Node version yield deterministic output. Source authenticity, metadata assertions, decoded name accuracy and actual Bangkok coverage still require review.

Existing verified WGS84 GeoJSON inputs remain supported with structural and JSTS checks. Legacy `crs` declarations are rejected; external conversions must preserve upstream checksums and tool/options/encoding/axis-order evidence in `dataset.transformations`. Unknown source generalization stays `unknown`.

## Verification commands

```powershell
node --test scripts/bangkok-boundaries.test.mjs scripts/bangkok-boundaries-gis.test.mjs scripts/bangkok-boundaries-coverage.test.mjs
npm test
npm run lint
npm run typecheck
npm run build
git diff --check
```

Tests construct deterministic synthetic binary artifacts in temporary directories. They cover Thai encodings, lexical identities, holes, disconnected parts, malformed records/topology, CRS mismatches, projection controls, provenance and activation gating. They do not qualify the real BMA dataset.

## Executed local release checkpoint — 8 October 2026

The existing ignored release `raw/bma-khwaeng/yaan-snapshot-2026-10-08-zip-83d0f2cdd6ab/` contains eight original artifacts. Its manifest and earlier reports/candidate were preserved. The existing manifest records an operator attestation of retrieval from `https://data.go.th/th/dataset/subdistrict1` on 7 October 2026. The relationship to the requested BKK Open Data candidate, “พื้นที่เขตการปกครองกรุงเทพมหานคร” (17 June 2024), is **not independently established**. Neither catalog availability nor a checksum proves authority or license permission. Publication/effective dates remain unknown; the snapshot identifier is YAAN-assigned.

Reproduce into new paths (these output names already exist after this checkpoint; choose a fresh suffix for subsequent runs):

```powershell
node scripts/inspect-bangkok-boundaries.mjs --source data/bangkok-boundaries/raw/bma-khwaeng/yaan-snapshot-2026-10-08-zip-83d0f2cdd6ab --manifest data/bangkok-boundaries/work/bma-release.manifest.json --report data/bangkok-boundaries/work/bma-release.qualification-2.5-final.report.json --candidate data/bangkok-boundaries/work/bma-release.qualification-2.5-final.candidate.json
```

The [report](work/bma-release.qualification-2.5-final.report.json) and [inactive candidate](work/bma-release.qualification-2.5-final.candidate.json) remain local/ignored. Executed checks confirm all eight manifest checksums, 180 unique khwaeng codes, 50 explicit parent codes, UTF-8 `.cpg` decoding and EPSG:32647 parameters. All 180 geometries pass per-feature checks before/after transformation: 178 Polygon and 2 MultiPolygon, 182 parts, 2 source holes and 85,775 positions. This establishes import integrity, not official name accuracy or complete coverage.

Dataset diagnostics completed without overlay errors: **106 positive-area overlap pairs and 223 enclosed voids**. Pairwise overlap areas sum to approximately 48,446.18 projected m² (not a deduplicated affected area); void areas sum to approximately 45,602.27 projected m². No tolerance or repair was applied. Review the full report's locations and individual measurements before interpreting these findings.

**Required manual evidence / exact next checkpoint:** review these topology findings against separately sourced, versioned and checksummed BMA khet geometry and a Bangkok coverage reference; supply the authoritative parent inventory and complete Thai names; then compare parent geometry with independent GISTDA khet geometry. Retain distinct provenance for each source. Resolve apparent source-name truncations and the existing parent-1027 name inconsistency recorded in the manifest. Supply resource-specific publisher/authority evidence connecting the exact local artifacts to the claimed release, and actual license terms/reference plus intended-use suitability review. Do not mark the 2024 catalog date as this geometry's publication/effective date without evidence. No raw Shapefile component is currently missing; these independent references, interpretation and permission evidence are the outstanding inputs. The next checkpoint is reviewed dataset qualification, **not runtime activation**.

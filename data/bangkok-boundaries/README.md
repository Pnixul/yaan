# Bangkok boundary import — Milestone 2.4

BMA khwaeng geometry is the primary canonical **candidate**. Source policy belongs to [DATA.md](../../docs/DATA.md); tooling architecture belongs to [TECH_STACK.md](../../docs/TECH_STACK.md). Synthetic fixtures are repository-authored, not official Bangkok evidence.

## Release observations and current qualification

Developer manual qualification of the selected BMA release observed:

- 180 khwaeng and 50 parent khet, unique subdistrict codes and explicit khwaeng → khet hierarchy;
- Thai administrative names;
- 2D Polygon Shapefile records, including multiple rings/parts;
- source CRS WGS 1984 / UTM Zone 47N, corresponding to EPSG:32647;
- geometry licensing **unspecified**.

These are observations for that release, not global validation constants. The earlier 169-khwaeng inventory observation is not this geometry release's count. Record the actual source reference, checksums, field mappings and encoding evidence before import. No real BMA raw artifacts were available in the implementation workspace; no real feature counts, bounds, topology or transformation results have been claimed as executed verification.

## Stages and activation

`raw source → inspected source → normalized candidate → validated canonical dataset`

Every report and candidate has `activation.eligible: false`. An exit code of **0** means eligible to write a normalized candidate, never approved for runtime activation. Unspecified licensing remains an activation blocker. Later qualification must establish license suitability, completeness/coverage, inter-feature overlaps/gaps, source authority, BMA khwaeng-to-parent-khet spatial consistency and independent GISTDA khet agreement. Per-feature JSTS validity does not establish these properties.

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

   Supply a flat directory with exactly one Shapefile set, preserving original bytes. Directory mode checksums every artifact, including metadata. A `.shp` path also works but inventories only recognized same-stem sidecars. Do not put manifests/reports/converted copies inside the raw directory. Symlinks, multiple releases, archives and orphan components are rejected.

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

Reports contain feature count, unique child/parent counts, missing values, hierarchy issues, parsed and normalized Polygon/MultiPolygon counts, holes/parts/positions, bounds before/after, per-feature topology status, unsupported-record errors, release observations, checksums and license/provenance gaps. Without field mappings, identity statistics remain unqualified. A failed binary/CRS/encoding preflight leaves geometry statistics unavailable rather than fabricated.

Candidates link to exact report/manifest/tool hashes and preserve the original CRS, licensing and transformation chain. Reports record actual installed tool/dependency and Node versions. The tool hash covers the importer modules, type contracts and lockfile. Identical bytes, manifest, tools and Node version yield deterministic output. Source authenticity, metadata assertions, decoded name accuracy and actual Bangkok coverage still require review.

Existing verified WGS84 GeoJSON inputs remain supported with structural and JSTS checks. Legacy `crs` declarations are rejected; external conversions must preserve upstream checksums and tool/options/encoding/axis-order evidence in `dataset.transformations`. Unknown source generalization stays `unknown`.

## Verification commands

```powershell
node --test scripts/bangkok-boundaries.test.mjs scripts/bangkok-boundaries-gis.test.mjs
npm test
npm run lint
npm run typecheck
npm run build
git diff --check
```

Tests construct deterministic synthetic binary artifacts in temporary directories. They cover Thai encodings, lexical identities, holes, disconnected parts, malformed records/topology, CRS mismatches, projection controls, provenance and activation gating. They do not qualify the real BMA dataset.

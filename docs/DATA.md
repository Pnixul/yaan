# YAAN — Data Principles

## Purpose

YAAN uses location-related data to help users understand everyday surroundings, approximate journeys, and area conditions around a reference place. Flood history is the first demonstrated condition.

Data should support informed decisions without creating a false sense of precision or certainty.

This document defines stable rules for how YAAN should treat, interpret, and communicate data.

Specific datasets, formulas, thresholds, and implementation details may evolve as research continues.

---

## Core Data Principle

### Real Location Foundation — Milestone 1

Geoapify provides real Bangkok search/geocoding labels, addresses, identities, coordinates and available administrative metadata. Thai labels come only from provider fields; English is retained when supplied. The provider’s Bangkok place filter limits searches, with country/city validation on returned data. This filter is not an official YAAN boundary dataset. Coverage is Bangkok only; provider parsing and coverage configuration remain separable for later Thailand expansion.

Observed response limitations: autocomplete can miss อารีย์ while forward geocoding finds it; use forward geocoding only when autocomplete is empty. Acronyms such as KMITL may rank campus facilities or bus stops rather than the university itself; the exact Chulalongkorn University match appeared below related landmarks during QA. Similar names can represent a mall and its transit stop. `district` can be an informal neighbourhood, and `county` can conflict with other fields. Preserve explicit เขต/แขวง values from suburb/quarter where supplied, without claiming official validation; omit ambiguous units. Provider points for streets/areas are representative locations, not building assessments.

Real references never receive mock nearby places, journey estimates, reports or illustrative polygons. Missing context means unavailable data, not safety. Official Bangkok administrative boundaries and all flood datasets (including BMA, HII and GISTDA) are outside this milestone. No flood scores or analysis radius have been introduced.

### Administrative Boundaries — Milestone 2.4

BMA official khwaeng administrative geometry is YAAN's primary canonical candidate. Developer manual qualification of the selected real Shapefile release observed 180 khwaeng, 50 parent khet, unique subdistrict codes, explicit hierarchy, Thai names, and Polygon records containing multiple rings/parts. The manually verified source CRS is WGS 1984 / UTM Zone 47N (EPSG:32647). These are release observations, not permanent invariants; the earlier 169-khwaeng inventory observation does not describe this geometry release. Actual DBF mappings and encoding still require artifact evidence, never assumed inventory field names. No real raw artifacts were available in the Milestone 2.4 implementation workspace, so these manual observations are not an executed import/topology qualification result.

Use multi-source validation with one validated, versioned canonical YAAN boundary dataset. Later checkpoints compare khwaeng membership/geometry against parent BMA khet inventory and geometry, then compare BMA khet geometry with independent GISTDA khet geometry. Retain separate source provenance; do not dynamically merge or choose geometries from different providers at runtime.

Provider administrative labels are search/display metadata, not official YAAN administrative resolution. Milestone 2.4 adds local Shapefile/DBF parsing, verified CRS transformation to WGS84 longitude/latitude (GeoJSON OGC:CRS84), and per-feature topology validation before and after transformation. Invalid geometry is rejected without topology repair; holes and disconnected parts are preserved. Coordinate resolution, official headings, APIs, hooks, map/UI integration and flood analysis are not provided yet.

Separate raw source, inspected source, normalized candidate and validated canonical stages. Successful import is not activation approval. Canonical geometry must preserve Polygon holes, disconnected MultiPolygon parts, string administrative codes and sourced Thai names, with verified WGS84 longitude/latitude semantics. No CRS relabeling, inferred official English names or invented metadata is permitted.

Version each source release with publisher/source reference, dates where known, artifact checksums, attribution, limitations, encoding/CRS evidence, tool/dependency versions and transformation/import evidence. Unknown metadata remains explicitly unknown. BMA geometry licensing remains `unspecified`; do not claim CC BY or other permission without source evidence. Activation remains blocked, even for a structurally and topologically valid candidate. Per-feature validity does not establish coverage, inter-feature nonoverlap, parent containment or independent source agreement. The operational manifest and inspection workflow are documented in `data/bangkok-boundaries/README.md`.

### Administrative Resolver Foundation — Checkpoint 2.6

BMA dataset qualification is intentionally deferred and the candidate remains inactive. The pure resolver foundation runs only against isolated synthetic fixtures with explicit non-official provenance. It distinguishes resolved, outside declared coverage, ambiguous, unavailable and invalid input; borders and overlaps never receive an arbitrary administrative assignment, and coverage gaps remain unavailable. Required missing metadata or invalid geometry blocks the dataset. No real-data provider, public endpoint or Explore integration is enabled. The contracts, CRS semantics, future API privacy requirements and activation boundary are defined in [ADMINISTRATIVE_RESOLVER.md](ADMINISTRATIVE_RESOLVER.md). Passing resolver tests does not qualify any real administrative source.

### Prototype Places and Journeys

Legacy Home example links, bare Explore and authenticated Saved fixture links still use local mock areas, places, categories, flood records, and route geometry. `mock-places.ts`, `mock-locations.ts` and `mock-routes.ts` remain solely for this demo and Saved membership; the obsolete mock search is removed. Saving real search locations is deferred. Sample place names and coordinates are illustrative, not a verified POI directory. Do not imply verified opening hours, access, services, or recommendations.

Reference locations and nearby destinations are distinct roles; any sample place can become a reference. Distances and times must follow the current origin and destination and be cleared when those selections change.

Mock route previews use hand-authored street corridors and access paths. Display distance is the length of that illustrative geometry. Walking and driving durations use simple display-only assumptions, without traffic or timetable data. Label routes and estimates as mocked and unverified, not usable navigation guidance. These assumptions are not a production routing methodology or flood-risk model.

The shaded flood-context shape remains illustrative, with no validated analysis radius or flood extent. No mock category or missing sample records establish a real-world condition.

### Area Evidence

YAAN should communicate:

**What the available evidence suggests about an area**

rather than:

**What will definitely happen at a specific place.**

Historical records can provide useful context, but they do not guarantee future outcomes.

---

## Data Categories

YAAN should distinguish between different types of information.

### Observed Data

Records that come directly from a source.

Examples may include:

- historical flood reports;
- report coordinates;
- timestamps;
- flood-related categories;
- other source-provided attributes.

Observed data should remain traceable to its source whenever possible.

### Derived Information

Information calculated or summarized by YAAN from observed data.

Examples may include:

- report counts around a location;
- commonly affected months;
- historical patterns;
- area-level risk categories;
- risk scores.

Derived information must never be presented as if it were directly observed.

### Missing or Insufficient Data

A lack of records must not automatically be interpreted as low risk.

Possible reasons for limited records include:

- incomplete geographic coverage;
- low reporting activity;
- missing historical periods;
- limitations of the source;
- differences in how data was collected.

YAAN should communicate insufficient data separately from low risk.

---

## Geographic Context

The initial product focus is Bangkok, Thailand.

Supported coverage must follow the actual quality and geographic coverage of available datasets.

Do not assume that a dataset suitable for Bangkok is representative of other provinces.

YAAN should not claim support for an area unless the available data is sufficient for the intended analysis.

---

## Location Analysis

YAAN analyzes the **area around a selected location**, not necessarily the selected building itself.

The analysis may use a geographic radius or another spatial method.

The exact method is determined by research and implementation requirements.

Until validated, no specific radius should be treated as a permanent product rule.

The interface must clearly communicate when results describe the surrounding area.

---

## Historical Analysis

Historical data may be used to identify patterns such as:

- how frequently flood-related reports appear;
- when reports commonly occur;
- how recently reports were recorded;
- where reports are concentrated around a location.

Historical frequency alone should not be treated as a complete measurement of future flood probability.

---

## Risk Representation

YAAN may use a risk representation to simplify complex evidence.

Possible forms include:

- descriptive categories;
- numeric scores;
- a combination of categories and scores.

The final representation must be understandable without requiring users to understand the underlying formula.

Any risk model should:

- use explainable inputs;
- avoid unnecessary precision;
- remain traceable to supporting evidence;
- communicate uncertainty;
- avoid implying prediction certainty.

The exact risk model is defined only after the methodology has been researched and validated.

---

## Data Sources

YAAN may combine multiple reliable sources when they provide complementary information.

Potential source categories include:

- public/open datasets;
- government or public-agency data;
- citizen-reported incident data;
- geospatial datasets;
- location/place providers.

A source should be evaluated for:

- geographic coverage;
- time coverage;
- update frequency;
- reliability;
- known bias;
- coordinate quality;
- accessibility;
- licensing and usage restrictions.

Do not introduce a data source solely because it is easy to access.

---

## Citizen-Reported Data

Citizen-reported data can provide valuable real-world evidence but may contain reporting bias.

Areas with more users or higher reporting activity may appear to have more incidents even when actual conditions are similar elsewhere.

YAAN must not treat report count alone as an objective measurement of total flood events without considering this limitation.

When citizen-reported data is used, its nature should remain transparent.

---

## Data Validation

Before using a dataset as part of a user-facing risk result:

1. inspect its structure and coverage;
2. verify that coordinates and timestamps are usable;
3. check representative locations;
4. identify obvious gaps or anomalies;
5. document important limitations;
6. confirm that the intended interpretation is supported by the data.

Small research experiments may be used to validate whether a source is useful before integrating it into the product.

---

## Data Transparency

Users should be able to understand:

- what type of data supports a result;
- where the data came from;
- whether the result is observed or derived;
- important limitations when relevant.

Transparency should not require every user to read technical methodology.

Provide a simple explanation first and deeper methodology on demand.

---

## Language Rules

Prefer wording such as:

> Flood reports have been recorded around this location.

> Historical reports were more common during these months.

> Available data for this area is limited.

Avoid unsupported wording such as:

> This building will flood.

> This area is completely safe from flooding.

> No reports means there is no flood risk.

The strength of the language must not exceed the strength of the evidence.

---

## Performance & Data Volume

Do not send unnecessary raw datasets to the client.

Prefer:

- server-side filtering or aggregation;
- requesting only relevant geographic data;
- caching when appropriate;
- lightweight map representations;
- progressive loading for detailed evidence.

The mobile experience should remain responsive even when the underlying dataset is large.

---

## Privacy

Do not collect precise user location unless it is necessary for a feature and the user has intentionally chosen to provide it.

Search text is sent through YAAN’s server to Geoapify. Successful search responses have a short private browser cache; YAAN does not persist provider responses or search history server-side. Selected normalized snapshots are intentionally placed in Explore URLs (including coordinates) for refresh/share/history; they are not stored in a database. Treat URL snapshots as untrusted display state, not verified administrative or risk evidence.

Personal location-related data should only be stored when required for an explicit user feature, such as saving a place.

---

## Research Decisions

The following implementation details should be determined through research rather than assumed:

- primary flood datasets;
- supporting datasets;
- analysis radius or spatial method;
- historical time window;
- risk model;
- weighting;
- thresholds;
- confidence or data-quality indicators;
- update strategy.

These decisions may evolve without changing the core data principles in this document.

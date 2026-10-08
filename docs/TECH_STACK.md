# YAAN — Technical Direction

## Technical Goal

YAAN should use a modern, maintainable web stack that supports:

- map-heavy interaction;
- location search;
- geospatial data;
- authentication;
- responsive mobile-first UI;
- server-side data processing;
- fast deployment and iteration.

Prefer simple architecture over unnecessary infrastructure.

The project should remain easy to understand, modify, and deploy during rapid development.

---

## Core Stack

### Framework

**Next.js — App Router**

Use Next.js as the main full-stack web framework.

Prefer Server Components by default and introduce Client Components only when browser-side interaction is required.

Map interaction, gestures, and other browser-dependent functionality will naturally require client-side components.

### UI

**React + TypeScript**

Use TypeScript throughout the application.

Avoid `any` unless there is a justified reason.

Shared domain concepts should have explicit types where useful.

### Styling

**Tailwind CSS**

Use Tailwind as the primary styling system.

Do not introduce an additional full UI framework by default.

Reusable components should follow YAAN's own design language.

### Theme and Color Foundation

`src/app/tokens.css` is the shared semantic palette for Light and Dark, consumed by the existing CSS and Tailwind token aliases. The root `data-theme="light|dark"` attribute selects colors and native `color-scheme`. Preserve existing component/layout boundaries; theme support does not require an application-wide client provider or additional dependency.

`src/lib/theme.ts` owns preference resolution and subscriptions. `yaan.theme` in localStorage stores only `light`, `dark`, or `system`; missing/invalid values resolve to System. Explicit Light/Dark overrides the OS. System follows `prefers-color-scheme` live, and storage events synchronize other tabs. Blocked storage falls back to System on initial load and permits in-memory page-session changes. This key contains no auth or location data.

A small static inline head script in the server root layout sets the resolved theme before body paint. Hydration suppression is limited to the root element's intentional attributes; the toggle reads the resolved appearance with `useSyncExternalStore` and writes an explicit Light or Dark preference. This avoids a theme cookie/request dependency and keeps Home statically renderable. Without JavaScript, the readable Light palette is the fallback. If a strict CSP is introduced, allow the exact bootstraps with a hash/nonce rather than enabling arbitrary inline scripts. `scripts/theme.test.mjs` covers bootstrap/runtime parity, preference events, blocked storage, core token contrast, and map paint isolation.

### Language and decorative assets

`src/lib/messages.ts` centralizes Thai translations and English product wording using English source messages as stable keys, including existing server feedback. Named interpolation keeps names separate from sentences. `language.ts` owns `yaan.language` (Thai default, explicit `th|en`), the root language attribute, pre-paint restoration and cross-tab events. Client UI uses `useI18n`; small `Message` boundaries allow Home and Account to retain Server Components. Stable translation functions avoid unrelated effects. No locale routing, request cookies, i18n dependency, domain IDs or auth contracts changed.

`ThemeIllustration` waits for the resolved theme before loading a single matching committed asset through Next Image. Reserved containers prevent layout shift; images are decorative, lazy and responsive. The Auth illustration is neither rendered nor requested below 1000px. Home uses CSS masks and semantic background gradients. `scripts/i18n.test.mjs` covers preference persistence, blocked storage, tab synchronization, interpolation and translation coverage for UI, fixture descriptions and server feedback.

---

## Backend & Database

### Supabase

Use Supabase for backend capabilities where appropriate.

Primary responsibilities may include:

- PostgreSQL database;
- authentication;
- user-owned data;
- saved locations;
- application data that requires persistence.

Use Row Level Security for user-owned data.

Do not expose privileged credentials to the client.

---

## Authentication

Use **Supabase Auth**.

Authentication should integrate with Next.js using the current supported SSR approach.

The core location exploration experience should not require authentication.

Authentication exists to support persistent personal features rather than gate the product.

### Implemented Auth Foundation

`@supabase/supabase-js` and `@supabase/ssr` provide email/password Auth with Supabase-managed cookie sessions. `src/lib/supabase/server.ts` creates a request-scoped SSR client for Server Components, Server Actions, and Route Handlers. It uses `cookies().getAll/setAll`; tokens are not manually stored in localStorage. Auth runs on the server, so the browser receives forms and server-rendered identity rather than a global Auth provider or Supabase client bundle. Add a browser client only when a browser-side Supabase feature needs one.

`src/proxy.ts` refreshes sessions with `getClaims()` and propagates refreshed cookies to both the request and response. Its matcher covers only Account and auth routes and never redirects guests. Account independently calls `getUser()` for current verified identity. Account is dynamically rendered, and Account/auth responses use private, no-store caching. Server Actions validate inputs, use Supabase's password APIs, and use validated return intent after successful sign in or immediate-session registration. Normal authentication and sign out return to `/account`; authentication started from Saved returns to `/saved`. Next.js supplies same-origin Server Action protections. Saved Places uses the same SSR client inside Server Actions, where cookie refresh writes are supported without expanding the proxy matcher or gating Explore.

`/auth/confirm` supports both the default confirmation-email PKCE code (`exchangeCodeForSession`, using the signup verifier cookie) and custom signup token hashes (`verifyOtp`). Success requires a returned session. It ignores query-string redirect destinations. A validated, email-matched browser cookie may resume a pending Save or return to Saved; otherwise it returns to Account. Confirmation responses are not cached and send a no-referrer policy. Registration uses the trusted `SITE_URL` origin, not a request Host header. The README documents both email templates and the default flow's same-browser requirement.

Required configuration: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (an `sb_publishable_` key), and server-only `SITE_URL`. Production uses HTTPS. Safe empty placeholders are in `.env.example`; `.env.local` remains ignored. No service-role key is used. Missing project configuration renders an unavailable state; a missing/invalid site origin blocks registration with an error.

Identity is stored only in Supabase-managed `auth.users`; the email-only Account needs no profile table or trigger. Do not duplicate Supabase's managed auth schema in application migrations or expose it through the Data API. The user-owned Saved table is defined below. Legacy guest saves are discarded without import.

### Saved Places Persistence

`public.saved_places` stores `user_id` (foreign key to `auth.users.id`, with delete cascade), `place_id` (the existing mock fixture ID), and `saved_at`. The composite primary key `(user_id, place_id)` deduplicates saves and indexes owner-filtered reads. There are no location snapshots, new place providers, or profile dependencies. Schema, explicit grants, and RLS are versioned in `supabase/migrations/20261004020906_create_saved_places.sql`.

Only `authenticated` gets SELECT, INSERT, and DELETE grants, each with an ownership policy using `(select auth.uid()) = user_id`. There is no UPDATE grant or policy: saved membership cannot be reassigned. The application uses the existing publishable-key client and session; no service-role key or privileged database function is involved.

`src/app/saved/actions.ts` verifies identity through `getUser()` on every read/write. Reads filter by owner and known fixture IDs, are bounded by fixture count, and return newest saves first. Mutations validate the place ID and accept an explicit save/unsave intent. Save uses insert-on-conflict-do-nothing, and unsave filters by owner and place, so retries are idempotent. An expected user ID from the current UI is compared with verified identity to reject stale account actions; it never supplies authorization.

The existing client store resolves signed-out/account mode before exposing saved state. Authenticated lists are held only in memory and loaded from Supabase; confirmed writes update the shared bookmark/list state. Pending mutations disable additional changes, failures preserve confirmed state and offer retry, and a failed read is not rendered as an empty or signed-out list. Identity/data revalidate on remount and window focus. Generation checks discard stale asynchronous results across navigation/account changes; in-flight writes followed by a focus refresh trigger another read after completion.

There is no guest storage or in-memory guest fallback. On subscription, the client attempts to remove the legacy `yaan.saved-places` localStorage key without reading it. Blocked browser storage does not affect account saving. Signing out hides account data without deleting saved rows. Changes from other account sessions become visible on reload, navigation, or window focus; realtime synchronization remains deferred.

### Pending Save and Auth Return

`auth-intent.ts` validates return paths against a small allowlist. A Save return must be `/explore` with known query keys, no duplicate parameters, and a selected fixture matching the requested place. Preserve the original URL, including supported content anchors. `/saved` is the only additional auth return destination; all other `next` values fall back to `/account`.

`beginSave` creates a random request ID and an HttpOnly, SameSite=Lax cookie (Secure in production) containing the validated place, return URL, and 24-hour expiry. The Account URL carries only that ID. Reads require a matching cookie/ID; normal Account visits never infer an intent from a cookie alone. There is one pending save per browser; a newer explicit Save replaces it. Cancel and sign out clear it. No personal location history, new database table, or privileged credentials are introduced.

Successful authentication calls `completeSaveIntent`, verifies identity with `getUser`, and invokes the existing idempotent owner-checked save action before redirecting to the original Explore URL. Successful writes consume the intent; errors retain it for an explicit retry on signed-in Account. Replays after consumption cannot save again. A signed-in Account visit with a valid intent resumes via a Server Action, never a database mutation during page rendering.

For signup, a second short-lived HttpOnly cookie binds the return intent to the submitted email. Keep `emailRedirectTo` fixed at `/auth/confirm`, preserving existing Supabase allowlists and both email templates. Confirmation resumes only when the returned session email matches that cookie; `getUser` and the expected session user ID also guard the save. Invalid confirmation returns to the pending Account state. Confirmation in another browser cannot access the intent; recovery is to sign in from the original Account page. The existing default PKCE flow also requires its original verifier cookie. Pending state is never passed as an arbitrary external redirect or stored in guest localStorage.

`npm test` runs Auth callback and Saved server/store regressions. `supabase/tests/saved_places.sql` exercises real database ownership, grants, idempotency, and cascade behavior using temporary test users in a transaction that rolls back.

---

## Maps

### Map Rendering

Use **MapLibre GL JS** as the primary map rendering library.

MapLibre should handle:

- interactive map rendering;
- camera movement;
- markers;
- geographic sources and layers;
- flood-related spatial visualization;
- custom map styling where appropriate.

Keep map-specific code isolated from unrelated application logic.

### Map Tiles & Styles

MapLibre does not define the final tile/style provider.

The provider may be selected separately based on:

- Thailand coverage;
- visual quality;
- performance;
- licensing;
- cost;
- customization requirements.

Avoid tightly coupling application logic to one tile provider.

The current development basemap remains OpenFreeMap Positron (`src/lib/map-config.ts`). `src/lib/map-theme.ts` adapts its observed vector source/layer roles to the same CSS map tokens. It changes paint in place on style load and root theme changes, preserving sources, filters, zoom-dependent widths, attribution, mock geometries, camera, and selection. The canvas is revealed after its initial theme is applied, avoiding a light-map flash in Dark Mode.

Provider limitations: geographic feature availability, label languages/density and zoom rules remain controlled by the external style/tiles. Raster road-shield sprites retain their original appearance and dark numerals, including in Dark Mode. The adapter recognizes Positron's current layer IDs and `openmaptiles` source; upstream schema changes may require updating it. Application marker labels appear on selection/hover/focus, with selected markers above passive ones; collisions with provider labels remain possible. Map fitting guards unloaded or zero-size viewports. The basemap remains unchanged by the Geoapify search integration; routing and flood providers remain deferred.

---

## Location Search & Geocoding

Geoapify is the Milestone 1 location search/geocoding provider. `GEOAPIFY_API_KEY` is server-only, read by `/api/locations` from `process.env.GEOAPIFY_API_KEY`; never expose a NEXT_PUBLIC version. `geoapify.ts` is server-only and owns provider requests, Bangkok place-filter configuration and normalization into `Location` (`location.ts`). Requests use Thai labels, five results and an eight-second timeout; an empty autocomplete response falls back once to forward geocoding. The fixed Bangkok place ID was resolved from Geoapify’s Bangkok city result (OSM relation 92277 / TH-10). No official polygons are downloaded or derived. Coverage remains Bangkok MVP; isolate coverage/provider changes for later all-Thailand support.

The browser calls only YAAN’s GET endpoint. It normalizes/validates a single `q` (2–200 characters), fixes the result cap, returns generic errors, and privately caches successes for 60 seconds. Credential-bearing upstream requests use no-store; no provider exceptions or responses are logged. Client requests debounce 300ms, abort on cleanup and reject stale completions. No new dependencies or database changes are needed.

Treat location search as a separate capability from map rendering.

The search provider should support the locations YAAN users are likely to search for, including:

- addresses;
- residences;
- workplaces;
- schools and universities;
- points of interest.

Provider selection should consider:

- Thai search quality;
- Bangkok coverage;
- POI coverage;
- autocomplete quality;
- rate limits;
- pricing;
- storage restrictions;
- licensing.

Abstract provider-specific logic behind a small internal interface where practical.

Do not spread provider-specific API calls throughout UI components.

---

## Administrative Boundary Data Foundation

Milestone 2 Checkpoint 2 defines provider-independent administrative units, dataset provenance/manifests and Polygon/MultiPolygon boundary contracts in `src/lib/administrative-boundary.ts`. These contracts are separate from search `Location`, mock areas/fixture IDs, React and MapLibre. Identity is namespaced by code system and level; khwaeng references its parent khet. Geometry is tied to a dataset version.

Milestone 2.4 extends `scripts/inspect-bangkok-boundaries.mjs` with import-only devDependencies: `shapefile@0.6.6`, `@types/shapefile@0.6.4`, `proj4@2.22.0`, and `jsts@2.12.1`. The script accepts explicit local artifacts only; it does not download releases or expose GIS packages to application/runtime code. Node handles inventory, SHA-256, DBF/SHP record-envelope safeguards and manifest validation; checked JSDoc connects tooling to the shared contracts. The Shapefile adapter verifies encoding evidence, preserves lexical identities/Thai character values, verifies actual .prj parameters against EPSG:32647, and transforms every vertex to WGS84 longitude/latitude. JSTS validates each geometry before and after transformation. Invalid/unsupported records fail closed; only ring winding is normalized, without topology repair or simplification. The older parser's orphan-hole promotion and string coercion are explicitly guarded. Narrow local declarations cover the two JSTS ESM entry points.

Reports/candidates record original artifact checksums, source and output statistics, encoding/CRS evidence, release-specific counts and exact installed dependency versions. The tool hash includes all importer modules, domain contracts and the lockfile. Synthetic binary fixtures cover Thai DBF encoding, ring/part preservation, malformed records, topology failures and independent projection controls. Real BMA import qualification requires an explicitly supplied local release; no raw production artifacts were present during this implementation.

Keep raw source → inspected source → normalized candidate → validated canonical dataset separate. Reports/candidates cannot activate runtime data. BMA khwaeng geometry is the primary candidate; BMA khet and independent GISTDA khet data support later validation, not runtime fallback. One reviewed, versioned canonical YAAN dataset will eventually serve runtime resolution. Source metadata, unresolved licensing, checksums and transformation evidence follow `DATA.md` and the workflow in `data/bangkok-boundaries/README.md`.

Checkpoint 2.6 adds provider-independent resolver contracts in `src/lib/administrative-resolver.ts` and a pure offline implementation in `scripts/resolver/core.ts`, reusing the existing coordinate validation and development-only GIS tools. It accepts only explicitly synthetic datasets, with fixtures isolated under `scripts/fixtures`; all real-data admission remains disabled. The provider boundary, result states, coordinate/coverage semantics and future server API contract are specified in [ADMINISTRATIVE_RESOLVER.md](ADMINISTRATIVE_RESOLVER.md). There is no runtime resolver integration, endpoint, fetching hook, official map layer or UI heading. Provider administrative labels remain unverified display metadata. Milestone 1 search ranking/provider behavior and Explore navigation remain unchanged.

## Flood Data

Flood datasets and risk methodology are defined by `DATA.md` and related research.

Prefer server-side processing for operations such as:

- geographic filtering;
- aggregation;
- historical summaries;
- risk calculation.

Do not send an entire raw flood dataset to the browser when only a small geographic subset is required.

---

## Application Architecture

The App Router exposes Home at `/`, Explore at `/explore`, Saved Places at `/saved`, and Supabase-backed Account at `/account`. A shared layout owns the responsive primary navigation. Home content stays server-rendered, with small client components for search and active navigation; MapLibre remains confined to Explore.

Saved Places keeps its shared client-store boundary and existing list/bookmark interaction model. Persistence is account-owned Supabase storage for authenticated users. Signed-out users see an authentication state. Place details still resolve through the existing fixtures.

Explore uses query parameters on `/explore`: `area`, `reference`, `place`, optional `category` (default `essentials`), and optional `view=conditions|route` (default Nearby). Existing Home and Saved `?area=…` / `?place=…` links remain supported; a place-only link opens inspection without choosing a reference. Generated URLs always include the area to distinguish an area with no reference from the default `/explore` sample reference.

Real search navigation uses `location`, `lat`, `lon`, `name`, `address`, `country` and optional normalized label/type/admin fields. `location.ts` serializes numeric coordinates without rounding and validates bounded single-valued fields on entry. These are untrusted display snapshots, not signed provider evidence; refresh/direct links do not require a provider call. A real reference takes precedence over legacy fixture parameters; invalid real links show recovery, never mock context. `exploration-state.ts` keeps a separate real location and prevents demo actions from attaching fixtures. MapLibre accepts a minimal reference point independently of mock areas. The real path supplies no demo POIs, routes, reports or polygon geometry.

For legacy links, `src/lib/explore-entry.ts` validates single-valued parameters against existing fixtures and serializes meaningful state. A valid place determines the area, followed by a valid reference, then an explicit area; a reference from another area is discarded. A selected place takes precedence over `view=conditions`; route view requires distinct origin/destination places in the same area. Unknown or repeated values are ignored. With no valid location, the existing default sample state applies.

`useExploreNavigation` reads meaningful state through `useSearchParams` and translates existing reducer actions into native `history.pushState` calls, integrated with the Next.js router. Equivalent destinations do not add history entries. The Explore page uses `connection()` for request-time rendering of the initial query state. URL navigation keeps the MapLibre component mounted; Back/Forward and refresh restore the same meaningful context. Camera revisions and flood history/report expansion remain local and reset on meaningful navigation. Sheet expansion, search input, and report visibility are also local. Real location selection uses this same history mechanism without a new state-management dependency.

The core location exploration prototype runs client-side with local typed fixtures. Keep areas and flood history, specific places and categories, mock route geometry, and interaction state separate from presentation components. The reference location is the origin for nearby distances and route previews.

Use the existing MapLibre basemap and worker setup. Geoapify supplies search only; real nearby POIs, routing, official administrative boundaries and flood datasets remain deferred. Supabase supports Account and authenticated Saved membership; legacy demo exploration and saved place details still use the established prototype fixtures.

Prefer clear separation between:

- UI components;
- map components;
- domain logic;
- data access;
- external providers;
- server-side analysis.

A possible direction is:

```text
src/
├── app/
├── components/
│   ├── ui/
│   ├── map/
│   └── risk/
├── lib/
│   ├── map/
│   ├── location/
│   ├── flood/
│   └── supabase/
├── types/
└── ...
```

This structure is directional, not mandatory.

Do not create abstractions or folders before they provide real value.

---

## Server vs Client

Prefer server-side execution for:

- database access;
- sensitive API credentials;
- flood-data processing;
- aggregation;
- provider calls that should not expose secrets.

Use client-side execution when required for:

- interactive maps;
- gestures;
- browser geolocation;
- immediate UI state;
- interactive transitions.

Avoid turning large sections of the application into Client Components unnecessarily.

---

## API & Provider Boundaries

External services should be treated as replaceable providers when practical.

Examples include:

- geocoding;
- place search;
- map tiles;
- external datasets.

Keep provider-specific behavior out of core product logic.

YAAN's domain model should not depend unnecessarily on the response format of an external API.

---

## UI Dependencies

Do not install multiple component libraries by default.

External UI components may be used when they:

- solve a meaningful problem;
- fit YAAN's design system;
- remain customizable;
- have acceptable performance cost.

Reference websites and component galleries are inspiration, not automatic dependencies.

---

## Animation

Start with CSS transitions and browser-native capabilities where sufficient.

Introduce an animation library only when the intended interaction clearly benefits from it.

Avoid selecting a library before the interaction requirements are known.

Prefer transform and opacity-based animation for common transitions.

---

## Performance

Performance is a technical requirement.

Prioritize:

- minimal unnecessary client JavaScript;
- efficient map rendering;
- geographic query limits;
- optimized assets;
- lazy loading;
- server-side aggregation;
- sensible caching;
- limited third-party dependencies.

Map-heavy features should be tested on mobile-sized devices during development.

---

## Deployment

Use **Vercel** as the primary deployment platform.

Production configuration and secrets must use environment variables.

Do not commit secrets or local environment files.

---

## Package Management

Use one package manager consistently throughout the project.

Do not mix lockfiles from different package managers.

The specific package manager may follow the project setup used when YAAN is initialized.

---

## Dependency Policy

Before adding a dependency, ask:

1. Does the platform or existing stack already solve this?
2. Does the dependency solve a meaningful problem?
3. Is it actively maintained?
4. What does it add to the client bundle?
5. Can it be replaced later without rewriting core product logic?

Avoid dependencies added only to save a few lines of straightforward code.

---

## Technical Guardrails

- Use TypeScript.
- Keep secrets server-side.
- Validate external data.
- Protect user-owned data with appropriate authorization.
- Keep map rendering separate from flood-risk logic.
- Keep geocoding/search providers replaceable where practical.
- Avoid premature abstraction.
- Avoid unnecessary Client Components.
- Avoid unnecessary dependencies.
- Optimize for mobile performance.
- Follow the product, UX, design, and data principles documented in `/docs`.
```

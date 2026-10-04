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

`src/proxy.ts` refreshes sessions with `getClaims()` and propagates refreshed cookies to both the request and response. Its matcher covers only Account and auth routes and never redirects guests. Account independently calls `getUser()` for current verified identity. Account is dynamically rendered, and Account/auth responses use private, no-store caching. Server Actions validate inputs, use Supabase's password APIs, and redirect only to `/account` after successful sign in, immediate-session registration, or sign out. Next.js supplies same-origin Server Action protections. Saved Places uses the same SSR client inside Server Actions, where cookie refresh writes are supported without expanding the proxy matcher or gating Explore.

`/auth/confirm` supports both the default confirmation-email PKCE code (`exchangeCodeForSession`, using the signup verifier cookie) and custom signup token hashes (`verifyOtp`). Success requires a returned session. It redirects to a fixed relative Account destination and does not accept user-controlled return URLs. Confirmation responses are not cached and send a no-referrer policy. Registration uses the trusted `SITE_URL` origin, not a request Host header. The README documents both email templates and the default flow's same-browser requirement.

Required configuration: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (an `sb_publishable_` key), and server-only `SITE_URL`. Production uses HTTPS. Safe empty placeholders are in `.env.example`; `.env.local` remains ignored. No service-role key is used. Missing project configuration renders an unavailable state; a missing/invalid site origin blocks registration with an error.

Identity is stored only in Supabase-managed `auth.users`; the email-only Account needs no profile table or trigger. Do not duplicate Supabase's managed auth schema in application migrations or expose it through the Data API. The user-owned Saved table is defined below. Guest-to-account import or merging remains deferred.

### Saved Places Persistence

`public.saved_places` stores `user_id` (foreign key to `auth.users.id`, with delete cascade), `place_id` (the existing mock fixture ID), and `saved_at`. The composite primary key `(user_id, place_id)` deduplicates saves and indexes owner-filtered reads. There are no location snapshots, new place providers, or profile dependencies. Schema, explicit grants, and RLS are versioned in `supabase/migrations/20261004020906_create_saved_places.sql`.

Only `authenticated` gets SELECT, INSERT, and DELETE grants, each with an ownership policy using `(select auth.uid()) = user_id`. There is no UPDATE grant or policy: saved membership cannot be reassigned. The application uses the existing publishable-key client and session; no service-role key or privileged database function is involved.

`src/app/saved/actions.ts` verifies identity through `getUser()` on every read/write. Reads filter by owner and known fixture IDs, are bounded by fixture count, and return newest saves first. Mutations validate the place ID and accept an explicit save/unsave intent. Save uses insert-on-conflict-do-nothing, and unsave filters by owner and place, so retries are idempotent. An expected user ID from the current UI is compared with verified identity to reject stale account actions; it never supplies authorization.

The existing client store resolves guest/account mode before exposing saved state. Authenticated lists are held only in memory and loaded from Supabase; confirmed writes update the shared bookmark/list state. Pending mutations disable additional changes, failures preserve confirmed state and offer retry, and a failed read is not rendered as an empty or guest list. Identity/data revalidate on remount and window focus. Generation checks discard stale asynchronous results across navigation/account changes; in-flight writes followed by a focus refresh trigger another read after completion.

Guests retain the `yaan.saved-places` localStorage list, including validation, deduplication, storage events, and an in-memory fallback when storage is unavailable. Guest and account lists are separate: signing in never uploads local saves, and signing out never deletes either list. Changes from other account sessions become visible on reload, navigation, or window focus; realtime synchronization and guest import are deferred.

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

---

## Location Search & Geocoding

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

Saved Places keeps its shared client-store boundary and existing list/bookmark interaction model. Persistence is account-owned Supabase storage for authenticated users and browser-local storage for guests, as defined above. Both modes resolve place details through the existing fixtures.

Explore uses query parameters on `/explore`: `area`, `reference`, `place`, optional `category` (default `essentials`), and optional `view=conditions|route` (default Nearby). Existing Home and Saved `?area=…` / `?place=…` links remain supported; a place-only link opens inspection without choosing a reference. Generated URLs always include the area to distinguish an area with no reference from the default `/explore` sample reference.

`src/lib/explore-entry.ts` validates single-valued parameters against existing fixtures and serializes meaningful state. A valid place determines the area, followed by a valid reference, then an explicit area; a reference from another area is discarded. A selected place takes precedence over `view=conditions`; route view requires distinct origin/destination places in the same area. Unknown or repeated values are ignored. With no valid location, the existing default sample state applies.

`useExploreNavigation` reads meaningful state through `useSearchParams` and translates existing reducer actions into native `history.pushState` calls, integrated with the Next.js router. Equivalent destinations do not add history entries. The Explore page uses `connection()` for request-time rendering of the initial query state. URL navigation keeps the MapLibre component mounted; Back/Forward and refresh restore the same meaningful context. Camera revisions and flood history/report expansion remain local and reset on meaningful navigation. Sheet expansion, search input, and report visibility are also local. No new persistence, authentication, API, or provider is involved.

The core location exploration prototype runs client-side with local typed fixtures. Keep areas and flood history, specific places and categories, mock route geometry, and interaction state separate from presentation components. The reference location is the origin for nearby distances and route previews.

Use the existing MapLibre basemap and worker setup. Geocoding, POI, routing, and flood-data providers remain deferred. Supabase supports Account and authenticated Saved membership; exploration and saved place details still use the established prototype fixtures.

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

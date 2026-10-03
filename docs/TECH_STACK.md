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

The App Router exposes Home at `/`, Explore at `/explore`, local Saved Places at `/saved`, and a minimal planned-feature placeholder at `/account`. A shared layout owns the responsive primary navigation. Home content stays server-rendered, with small client components for search and active navigation; MapLibre remains confined to Explore.

The Saved Places prototype stores only known mock place IDs in localStorage under `yaan.saved-places`. Its isolated client store exposes saved IDs, readiness, storage availability, and toggle/remove operations to the UI. Validate and deduplicate stored values, ignore unknown IDs, use a stable empty snapshot during server rendering, and listen for storage changes from other tabs. Storage failures retain an in-memory list with a visible session-only notice. This is not authenticated or server persistence; future Supabase integration should replace this state boundary without changing the list or bookmark interaction model.

Home links carry an `area` or `place` fixture ID in Explore's query parameters. Resolve those IDs against known mock data before initializing the existing exploration reducer, and ignore unknown values. A specific-place entry opens inspection without silently choosing a reference. Entry URLs preserve selection intent on reload; subsequent map state is not persisted or synchronized to the URL. No authentication, storage, or new provider is needed for this flow.

The core location exploration prototype runs client-side with local typed fixtures. Keep areas and flood history, specific places and categories, mock route geometry, and interaction state separate from presentation components. The reference location is the origin for nearby distances and route previews.

Use the existing MapLibre basemap and worker setup. No geocoding, POI, routing, database, or authentication integration is required for this prototype. Supabase and provider guidance elsewhere in this document describes future integration direction, not a requirement to install them now.

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

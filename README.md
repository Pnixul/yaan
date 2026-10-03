# YAAN

**Understand the area before making it part of your life.**

YAAN is a mobile-first location risk web application that helps people understand an area before deciding to live, move, or regularly spend time there.

The initial focus is **historical flood information and flood-related risk in Bangkok, Thailand**.

YAAN turns location-related data into information that is easier to understand, while keeping the underlying evidence and limitations accessible.

## Core Experience

**Find a place → Understand the surrounding area → Explore supporting evidence**

YAAN is designed around the location the user cares about rather than a complex data dashboard.

It is not intended to predict floods with certainty or replace general-purpose map applications.

## Tech Direction

The project is built around:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase
- MapLibre GL JS
- Vercel

Location search, geocoding, map tiles, and other external providers are selected separately based on product requirements.

See [`docs/TECH_STACK.md`](docs/TECH_STACK.md) for technical direction.

## Documentation

Project direction is defined in:

- [`PRODUCT.md`](docs/PRODUCT.md) — product purpose and boundaries
- [`UX.md`](docs/UX.md) — user experience principles
- [`DATA.md`](docs/DATA.md) — data and risk principles
- [`DESIGN.md`](docs/DESIGN.md) — visual and responsive direction
- [`TECH_STACK.md`](docs/TECH_STACK.md) — technical architecture and stack

AI coding agents should also follow [`AGENTS.md`](AGENTS.md).

## Project Structure

```text
yaan-location-risk/
├── AGENTS.md
├── README.md
└── docs/
    ├── PRODUCT.md
    ├── UX.md
    ├── DATA.md
    ├── DESIGN.md
    └── TECH_STACK.md
```

The application structure will evolve with implementation. Avoid creating architecture that is not yet required.

## Development

Development setup and commands will be documented here after the application is initialized.

The project should use one package manager consistently and must not commit secrets or local environment files.

## Status

YAAN is currently in active development.

The initial implementation focuses on establishing the core location-based flood experience before expanding into additional capabilities.

## Principles

YAAN should remain:

- useful;
- understandable;
- trustworthy;
- mobile-first;
- lightweight;
- intentionally designed.

For implementation decisions, prefer the relevant document in `/docs` over assumptions.
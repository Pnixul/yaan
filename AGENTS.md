# YAAN — Agent Instructions

## Purpose

This file defines how AI coding agents should work within the YAAN repository.

YAAN's product, UX, data, design, and technical direction are documented separately in `/docs`.

Agents should follow those documents without duplicating or inventing requirements.

---

## Source of Truth

Project documentation is located in `/docs`:

- `docs/PRODUCT.md` — product purpose, boundaries, and principles
- `docs/UX.md` — UX direction and interaction principles
- `docs/DATA.md` — data handling, risk communication, and limitations
- `docs/DESIGN.md` — visual direction, responsive behavior, and design principles
- `docs/TECH_STACK.md` — architecture, technologies, and dependency rules

Treat the relevant documentation as the source of truth.

If implementation and documentation conflict, do not silently choose one. Identify the conflict before making a significant change.

---

## Documentation Loading

Do **not** load every document for every task.

Read only the documentation relevant to the work being performed.

Use this routing:

- Product scope or feature behavior → `PRODUCT.md`
- User flow or interaction → `UX.md`
- Flood data, risk logic, methodology, or data limitations → `DATA.md`
- UI, responsive behavior, visual design, or motion → `DESIGN.md`
- Architecture, dependencies, providers, or infrastructure → `TECH_STACK.md`

Read multiple documents only when a task crosses multiple concerns.

For small implementation tasks, inspect the relevant code first and load additional documentation only when needed.

---

## Context & Token Efficiency

Use context efficiently without sacrificing implementation quality.

- Prefer targeted searches over scanning the entire repository.
- Open only files relevant to the current task.
- Do not repeatedly re-read unchanged files unless necessary.
- Search for symbols, components, routes, or functions before opening large files.
- Avoid reading generated files, build output, dependency directories, large datasets, or lockfiles unless required.
- Do not repeat information already available in `/docs`.
- Reference existing documentation instead of duplicating it in new files.
- Keep implementation explanations concise when the work is straightforward.
- Preserve important product, UX, data, design, security, and architecture constraints even when minimizing context.
- Never trade correctness, security, accessibility, or maintainability solely to reduce token usage.

### Concise final responses

For implementation, debugging, refactoring, testing, and inspection tasks, do the required work thoroughly, but keep final responses concise to conserve tokens.

By default, report only:

- what was completed, briefly;
- verification/tests run and whether they passed;
- blockers, unresolved issues, important risks, or decisions requiring developer input;
- the next action only when one is actually required.

Do not routinely:

- enumerate every changed file;
- repeat the task or implementation plan;
- describe unchanged code;
- restate requirements from the prompt;
- provide lengthy architectural explanations;
- include large code snippets or diffs;
- narrate routine implementation steps.

Provide detailed reports only when explicitly requested by the user or necessary to explain a failure, risk, or decision.

This rule controls reporting only. It must **not** reduce the thoroughness of implementation, investigation, testing, validation, or safety checks.

---

## Working Style

Before making a significant change:

1. Understand the user's requested outcome.
2. Inspect the existing implementation related to the task.
3. Read only the relevant project documentation.
4. Identify existing patterns that should be reused.
5. Implement the smallest coherent solution that satisfies the requirement.
6. Verify the result.

Do not expand the scope unless necessary to complete the requested work.

---

## Decision Making

Do not invent major product requirements.

When something is intentionally undecided or undocumented:

- do not silently turn an assumption into a permanent architecture decision;
- prefer a reversible implementation when possible;
- ask for clarification when the decision would significantly affect product behavior, architecture, data interpretation, cost, or UX.

Minor implementation details that do not affect these areas may be decided using established project patterns.

---

## Implementation Principles

Prefer:

- simple and maintainable code;
- clear boundaries between concerns;
- reusable components when reuse is real;
- explicit types;
- server-side processing where appropriate;
- lightweight client-side behavior;
- accessible interactions;
- responsive layouts;
- predictable error handling.

Avoid:

- premature abstraction;
- unnecessary dependencies;
- duplicated logic;
- oversized components when separation improves clarity;
- unnecessary Client Components;
- unnecessary client-side JavaScript;
- speculative features;
- large refactors unrelated to the current task.

---

## Dependency Rules

Do not add a dependency only for convenience.

Before adding one, consider:

1. whether the existing stack already solves the problem;
2. whether a small implementation would be simpler;
3. whether the dependency is actively maintained;
4. its client bundle and performance impact;
5. whether it fits YAAN's architecture and design direction;
6. whether it creates unnecessary provider or framework lock-in.

Major dependencies or provider changes require explicit justification.

Do not combine multiple UI libraries that introduce conflicting design systems.

---

## UI & Design

When implementing UI:

- follow `docs/DESIGN.md`;
- preserve the mobile-first approach;
- design desktop intentionally rather than stretching mobile layouts;
- maintain clear location context;
- keep risk information readable and calm;
- use motion only when it improves understanding;
- prioritize performance on mobile devices;
- do not rely on color alone to communicate important states.

References are inspiration, not requirements or automatic dependencies.

---

## Data & Risk

When working with flood or location-risk data:

- follow `docs/DATA.md`;
- distinguish observed data from derived information;
- never convert missing data into an assumption of safety;
- do not present historical evidence as future certainty;
- do not make building-level claims from area-level data;
- keep important limitations visible when they affect interpretation;
- validate external data before relying on it.

Do not invent a risk formula, weighting system, threshold, confidence model, or geographic radius unless it has been explicitly defined.

---

## Security & Privacy

- Never commit secrets.
- Keep privileged credentials server-side.
- Validate untrusted input and external data.
- Enforce authorization for user-owned resources.
- Use database security controls where appropriate.
- Do not persist precise user location unless the feature requires it and the user intentionally provides it.
- Collect only the personal data necessary for the feature.

---

## Performance

Performance is a product requirement, especially on mobile.

Prefer:

- limited client JavaScript;
- efficient map rendering;
- server-side filtering and aggregation;
- lazy loading when useful;
- optimized assets;
- restrained animation;
- small geographic data payloads.

Do not send large raw datasets to the browser when a filtered or aggregated result is sufficient.

---

## Scope Control

YAAN should not become a general-purpose map application.

Do not implement unrelated map, navigation, social, AI, analytics, or visualization features unless they directly support the requested product goal.

A technically interesting feature is not automatically a useful YAAN feature.

---

## Verification

Before considering work complete, verify the areas affected by the change.

Depending on the task, this may include:

- TypeScript correctness;
- linting;
- build success;
- relevant tests;
- mobile layout;
- desktop layout;
- keyboard interaction;
- loading, empty, and error states;
- map interaction;
- authorization;
- data interpretation;
- performance regressions.

Do not claim verification that was not actually performed.

---

## Documentation Maintenance

The files in `/docs` define stable project direction and should not be edited for minor implementation changes.

Update documentation only when a meaningful product, UX, data, design, or technical direction has changed.

Do not create duplicate documentation when an existing document already owns that concern.

Prefer Git history over maintaining unnecessary versioned copies such as:

- `PRODUCT_V2.md`
- `DESIGN_FINAL.md`
- `DESIGN_FINAL_V2.md`

Keep the current documentation representative of the current project direction.

---

## Final Principle

YAAN should remain:

**useful, understandable, trustworthy, lightweight, and intentionally designed.**

When multiple solutions are valid, prefer the one that achieves those qualities with less unnecessary complexity.
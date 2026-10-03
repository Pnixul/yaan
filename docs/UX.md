# YAAN — UX Direction

## UX Goal

YAAN should help users understand a location with as little effort as possible.

The experience should feel familiar to people who already use modern map and location-based products, while remaining focused on YAAN's purpose: understanding the area around a place.

Users should not need to understand flood datasets, risk models, or technical terminology to use the product.

---

## Core Journey

The primary journey is:

**Search an area or location → Explore the map → Choose a reference place → Filter nearby essentials → Inspect a place and approximate journey → Preview a route → Explore area conditions and history**

The exact screens and interactions may evolve, but this journey should remain simple and recognizable.

---

## Map-First Experience

The map provides spatial context and should be a major part of the experience.

Users should be able to:

- search for a place or address;
- explore the map manually;
- select a location;
- understand the area around that location;
- see relevant spatial evidence when useful.

The map should not expose unnecessary functionality simply because common map products provide it.

Every map feature should support YAAN's core purpose.

---

## Location Selection

YAAN should support users who are:

- already near the location;
- researching a location remotely;
- considering moving to a different area;
- exploring places without knowing an exact address.

Current location may be offered as a shortcut, but the experience must never assume that users are physically present in the area they want to check.

Search should remain a primary method of selecting a location.

Area results focus the map without silently becoming a specific reference point. Specific places can be inspected from search, a list, or a map marker, then intentionally chosen with an “Explore around this place” action.

Keep the reference visible in the panel and as a distinct map marker. Selecting a nearby destination does not replace it. Changing areas clears the old reference; choosing a new reference resets nearby selections and route previews.

## Everyday Context

Present a curated set of everyday places initially, with compact category controls associated with the map. Show one category at a time to limit clutter. Food, transport, shopping, health, education, parks, and attractions support understanding life around the reference location.

Nearby place details show the name, category, a useful short description, approximate distance, and approximate journey times. Directions opens a route preview in the same map experience with a clear origin, destination, and return to exploration. These are not full place pages or navigation instructions.

In the core exploration prototype, the existing persistent desktop panel offers Nearby and Area context views. Flood summary and history sit within Area context. Retain the mobile bottom-sheet structure and horizontal category controls without introducing a separate mobile journey.

---

## Information Hierarchy

Information should be presented in layers.

### First Layer — Immediate Understanding

Answer the most important question quickly:

> What would daily life around this selected location be like?

Use concise language and a small number of meaningful indicators.

Prioritize the selected reference location, then nearby everyday context, then conditions and history. Preserve the reference while users move between nearby places and area context.

### Second Layer — Context

Help users understand why the summary looks the way it does.

Examples may include:

- historical patterns;
- commonly affected periods;
- nearby reports;
- spatial context.

### Third Layer — Evidence

Provide deeper information for users who want to verify or understand the result.

Examples may include:

- individual historical records;
- data sources;
- methodology;
- limitations.

Users should not be forced through the third layer to understand the first.

---

## Progressive Disclosure

Avoid presenting all available information at once.

Prefer interactions that allow users to move naturally from a simple summary into deeper information.

Suitable patterns may include:

- expandable sections;
- cards;
- drawers;
- bottom sheets;
- detail views;
- contextual map layers.

The specific component is less important than maintaining a clear information hierarchy.

---

## Authentication

Authentication should not block the core exploration experience.

Users should be able to search locations and understand basic area information without signing in.

Ask users to authenticate only when an action requires persistent personal data, such as saving or organizing locations.

Authentication should feel like an extension of the experience, not an entry barrier.

---

## Saved Places

When personal location features are available, saved places should help users continue a real decision-making process.

The experience should make it easy to return to places the user is considering without repeatedly searching for them.

Saved information should remain concise and useful rather than becoming a complex management system.

---

## Mobile First

YAAN should be designed from the mobile experience outward.

Mobile interactions should prioritize:

- comfortable touch targets;
- minimal typing;
- clear hierarchy;
- thumb-friendly actions;
- readable information;
- efficient map interaction;
- lightweight transitions.

Desktop should not simply stretch the mobile layout.

Larger screens may use additional space for simultaneous context, such as displaying the map and location information together.

---

## Familiar, Not Imitative

YAAN may learn from established location-based products such as modern map, mobility, delivery, and travel applications.

Useful patterns include:

- prominent location search;
- map-based discovery;
- floating controls;
- contextual cards;
- bottom sheets;
- persistent but minimal navigation.

Use familiar interaction patterns to reduce learning effort, but do not copy another product's visual identity or unnecessary features.

---

## Risk Communication

Risk information must be understandable without relying on technical terminology.

Prefer human-readable explanations over raw scores when possible.

If numeric scores or categories are used, they should include enough context for users to understand what they mean.

Never rely on color alone to communicate risk.

The interface must clearly distinguish:

- historical evidence;
- derived risk;
- unavailable or insufficient data.

Uncertainty should be communicated without making the interface feel unnecessarily technical or alarming.

---

## Tone of Information

YAAN should feel approachable and informative rather than governmental, academic, or alarming.

User-facing language should be:

- concise;
- direct;
- understandable;
- calm;
- transparent.

Avoid unnecessarily technical wording when a simpler explanation communicates the same information.

Detailed terminology may appear in deeper evidence or methodology views when necessary.

---

## Interaction & Motion

Motion should help users understand:

- what changed;
- where information came from;
- what is currently selected;
- how map and content views relate to each other.

Suitable uses may include:

- map selection feedback;
- sheet transitions;
- content reveal;
- loading states;
- state changes.

Avoid motion that delays access to information or creates unnecessary performance cost.

The experience should remain usable when reduced motion is preferred.

---

## Loading & Data States

Location data may require time to search, fetch, or analyze.

YAAN should clearly handle:

- loading;
- no results;
- insufficient data;
- partial data;
- errors;
- unavailable services.

Do not represent missing information as low risk.

A lack of reports is not automatically evidence that an area is safe.

---

## Responsive Behavior

Responsive design should preserve the same user journey while adapting how information is arranged.

A possible pattern is:

**Mobile**
- map-focused layout;
- overlays or bottom sheets for contextual information;
- focused views for deeper details.

**Larger screens**
- map and information may appear side by side;
- additional context can remain visible without covering the map;
- interactions should remain consistent with mobile.

These are directional patterns, not fixed layout requirements.

---

## Accessibility

Core functionality should not depend solely on:

- color;
- animation;
- precise pointer input;
- complex gestures.

Important information should remain readable and understandable with assistive technologies and keyboard navigation where applicable.

---

## UX Guardrails

When designing a new interaction, prefer the option that:

1. helps users reach useful information faster;
2. reduces unnecessary decisions;
3. keeps the location context clear;
4. communicates uncertainty honestly;
5. works naturally on mobile;
6. avoids unnecessary device workload;
7. remains understandable without instructions.

If an interaction looks impressive but makes the product harder to understand or slower to use, choose the simpler interaction.

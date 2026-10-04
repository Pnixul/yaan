# YAAN — Design Direction

## Design Goal

YAAN should feel like a modern consumer location product rather than a technical flood dashboard.

The interface should be:

- clear;
- approachable;
- modern;
- distinctive;
- lightweight;
- polished.

The visual ambition can be high, but the runtime cost should remain low.

> **High visual ambition. Low runtime cost.**

---

## Design Character

YAAN combines three broad design ideas:

### Location Product

The spatial experience should feel familiar to users of modern map, mobility, delivery, and travel products.

### Consumer App

The interface should feel friendly and immediately usable without requiring users to learn a complex system.

### Data Product

Risk information and evidence must remain clear, trustworthy, and easy to understand.

YAAN should avoid looking like:

- a government portal;
- a GIS dashboard;
- an enterprise analytics tool;
- a generic admin dashboard;
- a clone of another map product.

---

## Mobile-First Design

Home and shared navigation extend the established YAAN palette, typography, and calm editorial composition. Home leads with a short value proposition and search, followed by useful example area links and a brief explanation. Use spacing, restrained surfaces, and Lucide icons for character; avoid decorative feature grids, invented metrics, testimonials, and heavy effects.

Start with a stacked layout at small widths. Progressively enhance Home into a wider introduction and example-area composition on desktop. Mobile primary navigation uses labelled icon links along the bottom; desktop uses header links. Reserve navigation space in both scrolling pages and the fixed-height Explore workspace, including safe-area insets. Keep clear focus styles and comfortable touch targets.

Design the core experience for mobile first.

Mobile layouts should prioritize:

- clear location context;
- large touch targets;
- short reading distances;
- strong information hierarchy;
- easy one-handed interaction where practical;
- minimal obstruction of the map;
- fast perceived performance.

Desktop layouts should take advantage of additional space rather than simply enlarging mobile components.

---

## Map & Interface Relationship

The map is functional context, not decorative background.

UI placed over the map should remain readable without hiding unnecessary amounts of spatial information.

Suitable interface patterns may include:

- floating search;
- compact map controls;
- contextual cards;
- drawers;
- bottom sheets;
- selected-location markers;
- lightweight map overlays.

Avoid covering most of the map unless the user intentionally enters a detail-focused state.

---

## Information Hierarchy

Every view should have a clear primary purpose.

For core location exploration, prioritize the reference place, nearby everyday context, then area conditions and history. Extend the existing calm editorial panel and muted map rather than changing the composition. Compact horizontal category controls belong with the map; POIs use restrained markers distinct from the reference pin and warm flood-report dots.

For risk-related views, prioritize:

1. location identity;
2. understandable summary;
3. key supporting indicators;
4. historical or spatial context;
5. detailed evidence and methodology.

Do not give every piece of information equal visual weight.

The interface should guide attention rather than display data as a collection of equally important cards.

---

## Visual Simplicity

Simple does not mean plain.

YAAN should create visual quality through:

- strong typography;
- intentional spacing;
- clear hierarchy;
- carefully designed components;
- meaningful iconography;
- refined interaction states;
- subtle depth;
- thoughtful motion.

Avoid relying on excessive decoration to make the product feel designed.

---

## Cards & Surfaces

Cards and surfaces should organize information, not fragment everything into boxes.

Use containers when they help:

- group related information;
- separate interaction layers;
- create hierarchy;
- support map overlays.

Avoid excessive nested cards or dashboard-style grids without a clear purpose.

Bottom sheets and drawers may be useful for map-based interactions, especially on mobile.

---

## Color

Visual Polish Pass 2A establishes a deep-blue-led foundation: calm, clean, geographic, and comfortable for extended use. Blue is deliberate emphasis for primary actions, navigation, selected states, focus, and map interactions. Avoid large saturated blue surfaces.

`src/app/tokens.css` owns semantic colors for both themes. Page, surface, and elevated surface are distinct; Light uses cool off-white / blue-gray with navy text, while Dark uses layered navy / blue-black with soft light text. Elevated Light controls can use white. Primary, hover, pressed, subtle, secondary, focus, disabled, destructive, success, warning, chart, and map tokens carry consistent meaning across routes. Component styles should consume these tokens rather than introduce local color literals.

Primary actions use a filled blue treatment. Secondary and utility actions use restrained surfaces or text; selected states also use labels, weight, borders, or marker shape. Keep amber warnings, green success feedback, and red errors/removal actions. Missing data uses neutral styling and explicit wording, never success styling.

The basemap uses muted blue water, green parks, distinct building footprints, and differentiated major/minor roads. Dark Mode has its own map palette. Reference pins, numbered ordinary places, selected places with visible labels, warm report dots, and route casing preserve distinct roles. The basemap remains quieter than interactive overlays.

Color supports:

- YAAN's brand identity;
- map readability;
- information hierarchy;
- risk communication;
- accessible contrast.

Risk levels must never depend on color alone.

When semantic colors are used, combine them with text, labels, icons, patterns, or other indicators.

Avoid making the entire product feel alarming simply because it deals with risk.

---

## Typography

The final typeface is TBD.

Typography should feel modern and approachable while remaining highly readable in Thai and English.

Prioritize:

- strong Thai rendering;
- clear distinction between headings and supporting information;
- comfortable mobile reading;
- numeric readability for scores and statistics.

Avoid excessively small text even when trying to achieve a minimal visual style.

---

## Iconography

Prefer consistent icons over emoji for core interface elements.

Icons should:

- be immediately understandable;
- use a consistent visual style;
- remain legible at mobile sizes;
- support labels rather than replace important text.

Emoji may be used only when intentionally part of the product's tone, not as a substitute for interface design.

---

## Motion

Motion should make YAAN feel responsive and polished.

Good uses include:

- location selection;
- map-to-content transitions;
- bottom sheet movement;
- result reveal;
- loading feedback;
- state transitions;
- subtle emphasis.

Motion should primarily use lightweight properties such as transforms and opacity where possible.

Avoid:

- long entrance sequences;
- constant decorative animation;
- heavy shaders on core screens;
- large particle systems;
- effects that compete with map interaction;
- animation that blocks access to information.

Respect reduced-motion preferences.

---

## Performance

Performance is part of the design.

YAAN should remain comfortable to use on typical mobile devices and mobile networks.

Prefer:

- lightweight UI;
- optimized assets;
- limited client-side JavaScript;
- efficient map rendering;
- lazy loading where appropriate;
- restrained animation;
- responsive feedback during data loading.

Do not add a visual effect unless its value justifies its runtime cost.

---

## Loading Experience

Loading states should feel intentional rather than empty.

Prefer:

- lightweight skeletons;
- progressive result reveal;
- clear map loading feedback;
- meaningful status text when analysis takes time.

Avoid fake complexity or long animations designed only to make analysis appear more advanced.

---

## Empty & Error States

Empty states should help users understand what to do next.

Examples include:

- no location selected;
- no historical reports found;
- insufficient data;
- search returned no result;
- service temporarily unavailable.

Do not visually treat "no data" as "safe."

Error states should remain calm, clear, and actionable.

---

## Responsive Design

Responsive behavior should be designed intentionally for each form factor.

### Mobile

Favor:

- map + overlay patterns;
- bottom sheets;
- focused content;
- compact navigation.

### Tablet

Use additional width to increase context without dramatically changing the interaction model.

### Desktop

Consider layouts such as:

**Map + persistent information panel**

when this improves usability.

Desktop should feel purposefully designed rather than like an enlarged phone screen.

---

## Accessibility

Accessibility is part of the visual system.

Maintain:

- sufficient contrast;
- readable text sizes;
- visible focus states;
- touch-friendly controls;
- keyboard usability where relevant;
- semantic labels;
- non-color risk indicators;
- reduced-motion support.

Visual polish must not reduce accessibility.

---

## Reference Strategy

References are used to study patterns and quality, not to copy complete visual systems.

### Interaction References

Products such as:

- Google Maps;
- Grab;
- LINE MAN;

may be studied for:

- map interaction;
- location search;
- contextual surfaces;
- mobile navigation;
- bottom-sheet behavior.

### Visual References

Curated design galleries and modern web products may be studied for:

- typography;
- composition;
- spacing;
- hierarchy;
- visual identity;
- motion quality.

### Component References

UI libraries and component collections may be used to study established interaction patterns.

A reference is **not automatically a dependency**.

Do not install a library simply because a component from that library was used as inspiration.

---

## Dependency Principle

> **Reference ≠ Dependency**

YAAN should maintain a coherent visual language.

Before introducing a UI or animation library, consider:

1. whether it solves a real implementation problem;
2. whether it fits YAAN's design direction;
3. whether the same result can be achieved simply;
4. its performance cost;
5. its impact on maintainability.

Avoid combining multiple UI libraries that introduce conflicting design languages.

---

## Visual Effects

Advanced effects such as shaders, particles, 3D, or canvas-based visuals are optional tools, not design goals.

They may be considered only when they:

- serve a clear purpose;
- preserve usability;
- perform well on target devices;
- degrade gracefully;
- do not distract from location and risk information.

Core workflows must never depend on expensive visual effects.

---

## Brand Direction

YAAN should develop its own visual identity rather than inheriting the identity of its references.

The name "YAAN" comes from the Thai word **ย่าน**, reinforcing the product's focus on understanding an area.

Brand exploration may include:

- logo;
- color system;
- typography;
- graphic language;
- illustration style;
- map styling.

Color and theme direction are established above. Other brand decisions remain open until intentionally defined.

---

## Design Guardrails

When making a visual decision:

1. Make the user's current location context clear.
2. Prioritize the information needed for the current decision.
3. Keep important actions obvious.
4. Avoid unnecessary visual noise.
5. Preserve mobile performance.
6. Use motion with purpose.
7. Keep risk information calm and understandable.
8. Maintain accessibility.
9. Prefer one coherent design language over many trendy components.
10. Do not sacrifice usability to make the interface look impressive.

YAAN should feel impressive because it is **well designed**, not because it contains many effects.

# YAAN — Product Direction

## Purpose

YAAN helps people understand an area before deciding to live, move, or regularly spend time there.

Instead of requiring users to search through multiple sources and interpret complex location data themselves, YAAN turns relevant evidence into information that is quick and easy to understand.

The initial focus is **historical flood information and flood-related risk in Bangkok, Thailand**.

---

## Problem

When choosing a place to live, people can easily find information such as price, distance, transportation, and nearby facilities.

However, understanding location-related risks is more difficult.

Information may be scattered across different sources, difficult to interpret, focused only on current conditions, or disconnected from the specific place a user is considering.

YAAN exists to make this information easier to understand in the context of a location the user actually cares about.

---

## Core Idea

YAAN starts with a **place**, not a data dashboard.

The core experience should remain simple:

**Find a place → Understand the surrounding area → Explore supporting evidence when needed**

A user may search for a residence, workplace, school, point of interest, or another location they want to understand.

Users do not need to be physically present at the location they are exploring.

---

## Product Principles

### Location First

The location the user cares about is the starting point of the experience.

Maps and spatial information should help users understand that location rather than becoming the product itself.

### Simple Before Detailed

Users should be able to understand the most important information quickly.

Detailed history, methodology, sources, and evidence should remain available without overwhelming the primary experience.

### Evidence Over Certainty

YAAN should help users make informed decisions using available evidence.

Risk estimates must not be presented as guarantees or predictions of what will definitely happen.

### Area Context Matters

A selected building or place and the surrounding area being analyzed are not necessarily the same thing.

YAAN must communicate this distinction clearly.

### Mobile First

The primary experience should work naturally on mobile devices while remaining fully usable and responsive on larger screens.

### Useful Over Impressive

YAAN should feel polished, distinctive, and enjoyable to use.

Visual effects and interactions should support usability and understanding rather than exist only for decoration.

Performance, accessibility, and clarity take priority over visual complexity.

### Progressive Disclosure

Show only the information needed for the current decision.

Allow users to explore deeper information when they choose to.

---

## Product Capabilities

YAAN may provide tools for:

- finding and exploring locations;
- understanding risks or relevant conditions around a location;
- viewing historical patterns and supporting evidence;
- understanding nearby context;
- saving or organizing places relevant to the user;
- comparing information when it helps users make a decision.

Specific features and interface implementations may evolve without changing the core product direction.

---

## Initial Focus

YAAN initially focuses on:

**Flood-related information in Bangkok, Thailand.**

Historical flood data may be used to help users understand patterns around a selected location.

The actual supported geographic area must follow the coverage and reliability of available datasets.

YAAN must not claim broader coverage than the underlying data can support.

---

## Data Responsibility

YAAN must clearly distinguish between:

- observed data;
- derived or estimated risk;
- missing or insufficient data.

Historical evidence does not guarantee future outcomes.

When data only supports area-level analysis, YAAN must not present the result as building-level certainty.

Prefer language such as:

> Flood reports have been recorded around this location.

Avoid unsupported statements such as:

> This building floods frequently.

Detailed data sources, methodology, limitations, analysis rules, and risk calculations are defined separately in `DATA.md`.

---

## Product Boundaries

YAAN is not intended to become a general-purpose replacement for map or navigation products.

Features should support the goal of understanding a location rather than reproducing unrelated map functionality.

Avoid adding complexity that does not meaningfully improve the user's ability to understand or evaluate an area.

AI should only be introduced when it provides clear value to the core experience, not simply because it is available.

---

## Long-Term Direction

The product architecture should allow YAAN to expand beyond flooding if future research and reliable data support additional location-related information.

Possible future areas may include other environmental or local risks.

These possibilities should not compromise the quality or focus of the current experience.

The long-term idea remains:

> **Understand the area before making it part of your life.**
# YAAN — Product Direction

## Purpose

YAAN helps people understand an area before deciding to live, move, or regularly spend time there.

Instead of requiring users to search through multiple sources and interpret complex location data themselves, YAAN turns relevant evidence into information that is quick and easy to understand.

The initial prototype focuses on **core location exploration in Bangkok, Thailand**: nearby everyday essentials, approximate journeys, and area context. Flood history is the first demonstrated area condition, not the whole product.

---

## Problem

When choosing where to live, work, study, or spend daily life, people often need separate searches for nearby essentials, routes, distances, and area conditions.

Information may be scattered across different sources, difficult to interpret, focused only on current conditions, or disconnected from the specific place a user is considering.

YAAN exists to make this information easier to understand in the context of a location the user actually cares about.

---

## Core Idea

YAAN starts with a **place**, not a data dashboard.

The core experience should remain simple:

**Search an area or place → Choose a reference location → Explore nearby essentials → Understand approximate journeys → Inspect area context**

A user may search for a residence, workplace, school, point of interest, or another location they want to understand.

Users do not need to be physically present at the location they are exploring.

---

## Product Principles

### Product Structure

Home introduces YAAN as a location-first product and offers search immediately. It supports people considering somewhere to live or stay, researching a move, getting to know an unfamiliar area, or understanding the neighbourhood they already live in. It is not a booking platform or general travel-discovery feed.

The implemented entry points are Home (`/`) and the established Explore workspace (`/explore`). Home provides search, example areas, and a brief explanation of nearby essentials, journey context, and area history. Explore remains the place for investigation; Home does not duplicate its map interactions.

Primary navigation contains Home, Explore, Saved, and Account. Saved Places is an authenticated account feature. Signed-out users can visit Saved to understand its value and sign in. Account supports email/password sign up, sign in, authenticated email identity, and sign out. About YAAN, Data & Sources, and supporting Privacy / Feedback content remain planned.

The interface defaults to Thai and offers English through a compact shared language control. Language and explicit Light/Dark preferences persist locally without changing account state or Explore URLs. Location search now uses Geoapify for real Bangkok places and addresses. Legacy demo links retain illustrative history, nearby places and routes; these are not verified conditions or navigation guidance.

Guest exploration is a product principle: Home, search, reference selection, nearby places, routes, and area context remain accessible without authentication. Authentication applies only to account-dependent functionality. Saving requires an account. A signed-out Save action carries the place and current Explore context through authentication, completes the save, and returns the user without requiring another Save click. Legacy browser-local saves are discarded, never imported.

### Location First

The location the user cares about is the starting point of the experience.

A home, office, university, station, or another specific place can be the reference location. YAAN is not accommodation-first. Nearby places and routes help answer what daily life around that reference could be like; they are not standalone directories or recommendations.

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

Milestone 1 establishes real Bangkok location search and reference selection through Geoapify. Selecting a search result opens Explore at its coordinates and establishes it as the reference, including a representative point for an area result. Nearby POIs, journeys, flood datasets and official administrative boundaries are not integrated for these real references. Legacy examples and Saved fixture links retain the labelled demo. The architecture must allow later expansion to all of Thailand, without claiming nationwide coverage now. The product hierarchy is:

1. selected reference location;
2. nearby everyday context;
3. area conditions and history;
4. supporting map information.

Search accepts places, addresses, streets and areas. The legacy demo retains category filters, place details, route previews and illustrative flood history.

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

YAAN is not a booking platform or property marketplace. The core exploration prototype includes account-owned Saved Places. It does not include reviews, posting, comparisons, recommendations, or personalization. Route previews provide location context rather than turn-by-turn navigation.

Features should support the goal of understanding a location rather than reproducing unrelated map functionality.

Avoid adding complexity that does not meaningfully improve the user's ability to understand or evaluate an area.

AI should only be introduced when it provides clear value to the core experience, not simply because it is available.

---

## Long-Term Direction

The product architecture should allow area context to expand beyond flooding if future research and reliable data support additional location-related information.

Possible future areas may include other environmental or local risks.

These possibilities should not compromise the quality or focus of the current experience.

The long-term idea remains:

> **Understand the area before making it part of your life.**

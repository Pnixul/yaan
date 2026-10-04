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

## Home and Navigation

### Home and Entry into Explore

Home answers what YAAN is and what the user can do through a concise introduction and prominent location search. Example neighbourhood links provide a quick alternative to typing. A short explanation of everyday places, approximate journeys, and area history follows; no long marketing journey is required.

Home and Explore share the same mock search. Selecting an area opens Explore focused on that area, without a reference place. Selecting a specific place opens its details in Explore; the user then chooses “Explore around this place” to establish the reference. Explore URLs preserve the area, reference, selected place, category, and Nearby / Area context / mock route view. Refreshing or sharing a URL restores that meaningful context inside the existing panels. Unknown or repeated parameters are ignored; without any valid location, Explore uses its default sample state.

Meaningful Explore actions add browser history entries; selecting the same destination does not. Browser Back/Forward restores previous URL contexts, including place details. “Back to nearby” (or “Back to area”) navigates explicitly to the corresponding list with its reference and category intact, so it also works after opening a shared link directly. “Explore around this place” establishes the reference and clears the selected destination and route preview. Directions and Clear route navigate between the mock route preview and place details. Sheet expansion, camera movement, search input, report visibility, and expanded flood history/report selection stay local and are not shareable state. Navigation resets expanded flood details; restored place details open in the existing detail panel.

### App Navigation

Home, Explore, Saved, and Account are directly accessible in a labelled bottom navigation bar on mobile, without a hamburger menu. Tablet and desktop use lightweight header links. The active destination has a visible selected state and an accessible current-page label.

Reserve space for the mobile navigation and safe-area inset: it must not cover document content, map attribution, or the location sheet. Keep the existing map and sheet interaction model, with adjustments for short screens. Search suggestions must remain reachable above navigation.

Saved offers account-owned lists with links back to Explore, or a sign-in state for signed-out visitors. Account offers sign in and sign up without introducing an authentication gate elsewhere.

### Appearance

A labelled Theme control in the shared header offers Light, Dark, and System on every route, including mobile. Default to System; follow OS changes while System is selected. Remember the explicit preference in this browser, independently of authentication. Use a native keyboard-accessible select, keep visible focus, and show the selected preference in text. Theme changes preserve the current URL, reference, selected place, route, camera, and pending actions. If browser storage is blocked, changes still apply for the current page session.

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

Saving requires authentication. A signed-out Save action opens Account with the selected place named and explains that signing in or creating an account will save it and return to the exact Explore URL. A pending save lasts up to 24 hours in this browser; starting another Save replaces it. Normal Account visits do not resume unrelated pending requests. A secondary “Return without saving” action cancels the request and restores Explore.

Account uses labelled email/password controls with sign-in and sign-up choices, pending feedback, native validation, and understandable server errors. While identity is resolving, show a checking state rather than a signed-out form. If account services cannot be reached, show a retry state rather than claiming the user has signed out.

When Supabase requires email confirmation, explain that the user is not signed in yet and should check their inbox. Do not claim that a new account was created or an email delivered when Supabase deliberately obscures an existing account. A valid confirmation link establishes the session. For a pending Save in the same browser, save the place and return to the original Explore context; otherwise return to Account (or Saved when authentication started there). Invalid or expired links preserve a valid pending request and offer sign-in recovery. Ask the user to open confirmation in the same browser; if they confirm elsewhere, they can return to the original Account page and sign in to finish saving. Registration with an immediate session follows the same return rules.

Signed-in Account shows the verified email, a primary Continue exploring action, secondary access to Saved Places, and a utility Sign out control. Sign out applies to this browser session and clears pending auth intent. Signed-out Account prioritizes the active credential submission, with sign-in/create-account mode choices disabled during submission. Missing deployment configuration leaves exploration available and explains that saving is unavailable.

Authentication should feel like an extension of the experience, not an entry barrier. Profile editing, password reset, OAuth, and account deletion remain deferred. Legacy guest saves are not retained or imported.

---

## Saved Places

Saved Places supports saving and unsaving from Explore place details. When signed in, membership persists to the user's account across reloads and new sessions. There is no guest or session-only saving. Remove the legacy browser list on the next Saved/bookmark mount without reading or importing it.

Resolve saved state before enabling bookmarks or showing the empty state. Account changes show pending feedback and update bookmark/list state only when persistence confirms success. Failures must offer retry without claiming success. A failed pending save leaves the user signed in on Account with “Retry save and return”; keep the intent until the save is confirmed or cancelled. Idempotent saves make retry safe. Recheck account identity when returning to Saved/Explore or refocusing the window, hiding the previous account's list during resolution. The Saved page remains directly accessible when signed out. Show an authentication state explaining cross-device access, a primary Sign in or create account action that returns to Saved, and a secondary Continue exploring link. Do not show the account empty state until authenticated loading succeeds.

The Saved page lists name, category, and area using existing mock data. It deliberately omits journey estimates because the list has no shared reference location. Selecting a saved place uses the existing specific-place Explore entry; it opens inspection without silently establishing a reference. Unsave removes the row, announces the change, and moves keyboard focus to the next available removal action or the empty-state heading. The empty state explains how to save and links back to Explore.

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

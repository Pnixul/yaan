import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function load(name, overrides = {}, cache = new Map()) {
  if (name in overrides) return overrides[name];
  if (cache.has(name)) return cache.get(name);
  const { outputText } = ts.transpileModule(
    readFileSync(new URL(`../src/lib/${name.replace("./", "")}.ts`, import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  );
  const exports = {};
  cache.set(name, exports);
  runInNewContext(outputText, {
    exports,
    URLSearchParams,
    window: overrides.window,
    require: (dependency) => load(dependency, overrides, cache),
  });
  return exports;
}

const { exploreEntry, exploreHref } = load("./explore-entry");
const { MOCK_PLACES } = load("./mock-places");
const { MOCK_AREAS } = load("./mock-locations");
const { explorationReducer } = load("./exploration-state");
const origin = MOCK_PLACES.find((place) => place.id === "ari-bts");
const destination = MOCK_PLACES.find((place) => place.areaId === "ari" && place.id !== origin.id);
const otherArea = MOCK_PLACES.find((place) => place.areaId !== "ari");
const read = (query = "") => exploreEntry(new URLSearchParams(query));
const meaningful = ({ areaId, referenceId, placeId, category, view, routing }) =>
  ({ areaId, referenceId, placeId, category, view, routing });

test("legacy Home and Saved URLs preserve entry semantics", () => {
  assert.equal(read().referenceId, origin.id);
  assert.equal(read("area=ari").referenceId, null);
  const saved = read(`place=${destination.id}`);
  assert.equal(saved.placeId, destination.id);
  assert.equal(saved.referenceId, null);
  assert.equal(saved.areaId, destination.areaId);
});

test("invalid, repeated and conflicting parameters resolve safely", () => {
  assert.deepEqual(meaningful(read("area=missing&place=missing&reference=missing&category=bad&view=bad")), meaningful(read()));
  assert.equal(read(`place=${destination.id}&place=${origin.id}`).placeId, null);
  assert.equal(read("area=ari&reference=ari-bts&reference=ari-bts").referenceId, null);
  const conflict = read(`area=ari&reference=${origin.id}&place=${otherArea.id}&view=route`);
  assert.equal(conflict.areaId, otherArea.areaId);
  assert.equal(conflict.referenceId, null);
  assert.equal(conflict.routing, false);
  assert.equal(read(`reference=${origin.id}&place=${origin.id}&view=route`).routing, false);
  assert.equal(read(`place=${destination.id}&view=route`).routing, false);
  assert.equal(read(`place=${destination.id}&view=conditions`).view, "nearby");
});

test("all meaningful exploration transitions survive URL round trips", () => {
  let state = read("area=ari");
  const actions = [
    { type: "inspect", place: origin },
    { type: "reference", place: origin },
    { type: "category", category: "food" },
    { type: "inspect", place: destination },
    { type: "route" },
    { type: "clear-route" },
    { type: "close-place" },
    { type: "view", view: "conditions" },
    { type: "history", show: true },
    { type: "report", report: MOCK_AREAS[0].reports[0] },
    { type: "view", view: "nearby" },
    { type: "inspect", place: otherArea },
    { type: "reference", place: otherArea },
    { type: "area", id: "ari" },
  ];
  for (const action of actions) {
    state = explorationReducer(state, action);
    const restored = read(exploreHref(state).split("?")[1]);
    assert.deepEqual(meaningful(restored), meaningful(state), action.type);
    assert.equal(restored.history, false);
    assert.equal(restored.report, null);
  }
});

// Exercise the real navigation hook with a small React/History boundary harness.
// Browser checks separately cover Next's useSearchParams/History integration.
function navigation(initial = "/explore") {
  const entries = [initial];
  let index = 0;
  let cursor = 0;
  let dirty = false;
  const slots = [];
  const window = {
    location: { get search() { return new URL(entries[index], "https://yaan.test").search; } },
    history: {
      pushState(_data, _unused, href) {
        entries.splice(index + 1, Infinity, href);
        index++;
      },
    },
  };
  const { useExploreNavigation: renderHook } = load("./use-explore-navigation", {
    window,
    react: {
      useMemo: (fn) => fn(),
      useCallback: (fn) => fn,
      useState(initialValue) {
        const slot = cursor++;
        if (!(slot in slots)) slots[slot] = initialValue;
        return [slots[slot], (value) => { slots[slot] = value; dirty = true; }];
      },
    },
    "next/navigation": { useSearchParams: () => new URLSearchParams(window.location.search) },
  });
  function render() {
    let result;
    let attempts = 0;
    do {
      assert.ok(attempts++ < 10, "navigation render must settle");
      cursor = 0;
      dirty = false;
      result = renderHook();
    } while (dirty);
    return result;
  }
  return {
    entries,
    render,
    act(action) { render().dispatch(action); return render(); },
    back() { index = Math.max(0, index - 1); return render(); },
    forward() { index = Math.min(entries.length - 1, index + 1); return render(); },
    refresh() { slots.length = 0; return render(); },
  };
}

test("details, mock route and list participate in Back/Forward and refresh", () => {
  const nav = navigation();
  nav.act({ type: "category", category: "food" });
  nav.act({ type: "inspect", place: destination });
  assert.equal(nav.back().state.placeId, null);
  assert.equal(nav.forward().state.placeId, destination.id);
  assert.equal(nav.refresh().state.referenceId, origin.id);
  assert.equal(nav.render().state.category, "food");
  nav.act({ type: "route" });
  assert.equal(nav.refresh().state.routing, true);
  assert.equal(nav.back().state.routing, false);
  assert.equal(nav.forward().state.routing, true);
  nav.act({ type: "clear-route" });
  assert.equal(nav.render().state.placeId, destination.id);
  nav.act({ type: "close-place" });
  assert.equal(nav.render().state.placeId, null);
  assert.equal(nav.render().state.referenceId, origin.id);
  assert.equal(nav.render().state.category, "food");
  assert.equal(nav.back().state.placeId, destination.id);
  assert.equal(nav.forward().state.placeId, null);
});

test("direct Saved detail can return to its area or establish a reference", () => {
  const nav = navigation(`/explore?place=${destination.id}`);
  nav.act({ type: "close-place" });
  assert.equal(nav.render().state.referenceId, null);
  assert.equal(nav.back().state.placeId, destination.id);
  nav.act({ type: "reference", place: destination });
  const restored = nav.refresh().state;
  assert.equal(restored.referenceId, destination.id);
  assert.equal(restored.placeId, null);
  assert.equal(nav.back().state.referenceId, null);
});

test("same destination and transient report changes do not add history entries", () => {
  const nav = navigation();
  nav.act({ type: "inspect", place: destination });
  nav.act({ type: "inspect", place: destination });
  assert.equal(nav.entries.length, 2);
  nav.act({ type: "view", view: "conditions" });
  nav.act({ type: "history", show: true });
  nav.act({ type: "report", report: MOCK_AREAS[0].reports[0] });
  assert.equal(nav.render().state.history, true);
  assert.equal(nav.entries.length, 3);
  assert.equal(nav.back().state.history, false);
  assert.equal(nav.forward().state.history, false);
  assert.equal(nav.render().state.report, null);
});

test("real selection, context tabs and demo navigation survive Back/Forward and refresh", () => {
  const nav = navigation();
  const location = { id: "geoapify:fixture", name: "มหาวิทยาลัย", address: "Bangkok", country: "Thailand", coordinates: [100.532872512345, 13.743089312345] };
  nav.act({ type: "location", location });
  assert.equal(nav.refresh().state.location.id, location.id);
  assert.equal(nav.refresh().state.location.coordinates[1], location.coordinates[1]);
  nav.act({ type: "view", view: "conditions" });
  assert.equal(nav.refresh().state.location.id, location.id);
  assert.equal(nav.back().state.view, "nearby");
  assert.equal(nav.back().state.location, null);
  assert.equal(nav.forward().state.location.id, location.id);
  nav.act({ type: "area", id: "ari" });
  assert.equal(nav.render().state.location, null);
});

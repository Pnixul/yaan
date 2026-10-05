import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as jsx from "react/jsx-runtime";

// Render the actual components against small hook/router boundaries, following
// the existing navigation harness. No DOM package or live provider is needed.
function component(file, overrides, react) {
  const { outputText } = ts.transpileModule(
    readFileSync(
      new URL(`../src/components/${file}.tsx`, import.meta.url),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  );
  const exports = {};
  runInNewContext(outputText, {
    exports,
    document: { getElementById: () => null },
    require(name) {
      if (name === "react/jsx-runtime") return jsx;
      if (name === "react") return react;
      if (name === "lucide-react")
        return new Proxy({}, { get: (_, key) => String(key) });
      if (name === "@/components/i18n")
        return { useI18n: () => ({ t: (text) => text }) };
      if (name in overrides) return overrides[name];
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return exports;
}
function all(node) {
  if (node == null || typeof node === "boolean") return [];
  if (Array.isArray(node)) return node.flatMap(all);
  if (typeof node !== "object") return [node];
  return [node, ...all(node.props?.children)];
}
const find = (tree, predicate) =>
  all(tree).find((node) => typeof node === "object" && predicate(node));
const text = (tree) =>
  all(tree)
    .filter((node) => typeof node === "string")
    .join(" ");

test("actual combobox renders states, rejects stale options and selects via keyboard", () => {
  const slots = [],
    effectSlots = [],
    queued = [];
  let cursor = 0,
    effectCursor = 0,
    update,
    tree;
  const selected = [];
  const react = {
    useId: () => "search-test",
    useRef: () => ({ current: null }),
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = initial;
      return [
        slots[i],
        (value) => {
          slots[i] = typeof value === "function" ? value(slots[i]) : value;
        },
      ];
    },
    useEffect(fn, deps) {
      const i = effectCursor++,
        prior = effectSlots[i];
      if (!prior || deps.some((value, j) => value !== prior.deps[j])) {
        queued.push(() => {
          prior?.cleanup?.();
          effectSlots[i] = { deps, cleanup: fn() };
        });
      }
    },
  };
  const { LocationSearch } = component(
    "location-search",
    {
      "@/lib/location": {
        normalizeQuery: (q) => q.trim(),
        MIN_QUERY_LENGTH: 2,
        MAX_QUERY_LENGTH: 200,
      },
      "@/lib/location-search-request": {
        requestLocations: (_query, callback) => {
          update = callback;
          return () => {};
        },
      },
    },
    react,
  );
  const render = () => {
    cursor = effectCursor = 0;
    tree = LocationSearch({ onSelect: (value) => selected.push(value) });
    queued.splice(0).forEach((fn) => fn());
    return tree;
  };
  const input = () => find(tree, (node) => node.type === "input");
  const type = (value) => {
    input().props.onChange({ target: { value } });
    render();
  };
  render();
  assert.equal(input().props["aria-expanded"], false);
  type("KMITL");
  assert.match(text(tree), /Searching Bangkok/);
  const real = {
    id: "geoapify:real",
    name: "มหาวิทยาลัย",
    address: "กรุงเทพมหานคร",
    coordinates: [100.7786, 13.7288],
  };
  update({ query: "KMITL", status: "ready", locations: [real] });
  render();
  assert.equal(
    find(tree, (node) => node.props.role === "option").props.id,
    "search-test-0",
  );
  input().props.onKeyDown({
    key: "ArrowDown",
    nativeEvent: {},
    preventDefault() {},
  });
  render();
  assert.equal(input().props["aria-activedescendant"], "search-test-0");
  find(tree, (node) => node.type === "form").props.onSubmit({
    preventDefault() {},
  });
  render();
  assert.equal(selected[0], real);
  assert.equal(input().props.value, "");
  type("new query");
  assert.equal(
    find(tree, (node) => node.props.role === "option"),
    undefined,
  );
  find(tree, (node) => node.type === "form").props.onSubmit({
    preventDefault() {},
  });
  assert.equal(
    selected.length,
    1,
    "Enter cannot select results for a previous query",
  );
  update({ query: "new query", status: "ready", locations: [] });
  render();
  assert.match(text(tree), /No locations found/);
  update({ query: "new query", status: "error", locations: [] });
  render();
  assert.match(text(tree), /Search is unavailable/);
  assert.ok(
    find(
      tree,
      (node) => node.type === "button" && text(node).includes("Retry search"),
    ),
  );
  input().props.onKeyDown({ key: "Escape", nativeEvent: {} });
  render();
  assert.equal(input().props["aria-expanded"], false);
});

test("Home selection uses the normalized real location navigation contract", () => {
  const pushes = [],
    passed = [];
  const { HomeSearch } = component(
    "home-search",
    {
      "next/navigation": {
        useRouter: () => ({ push: (href) => pushes.push(href) }),
      },
      "@/components/location-search": { LocationSearch: "LocationSearch" },
      "@/lib/location": {
        locationHref: (location) => {
          passed.push(location);
          return "/explore?location=real&lat=13.7&lon=100.5";
        },
      },
    },
    { useRef: () => ({ current: null }) },
  );
  const location = { id: "real", coordinates: [100.5, 13.7] };
  find(HomeSearch(), (node) => node.type === "LocationSearch").props.onSelect(
    location,
  );
  assert.equal(passed[0], location);
  assert.equal(pushes[0], "/explore?location=real&lat=13.7&lon=100.5");
});

test("Explore renders a real reference with no demo POIs, routes, reports or geometry", () => {
  const location = {
    id: "real",
    name: "สถานที่จริง",
    address: "กรุงเทพมหานคร",
    country: "Thailand",
    coordinates: [100.7786, 13.7288],
  };
  const state = {
    areaId: "ari",
    location,
    locationError: false,
    placeId: null,
    referenceId: null,
    view: "nearby",
    routing: false,
  };
  const overrides = {
    "next/dynamic": () => "NeighborhoodMap",
    "@/lib/use-explore-navigation": {
      useExploreNavigation: () => ({
        state,
        href: "/explore?location=real",
        dispatch() {},
      }),
    },
    "@/lib/mock-locations": { MOCK_AREAS: [{ id: "ari", name: "Ari" }] },
    "@/lib/mock-places": {
      MOCK_PLACES: [{ id: "demo", areaId: "ari", suggestedReference: true }],
      nearbyPlaces: () => {
        throw new Error("Must not query demo nearby");
      },
    },
    "@/lib/mock-routes": {
      buildMockRoute: () => {
        throw new Error("Must not build demo route");
      },
    },
  };
  for (const [file, name] of [
    ["location-search", "LocationSearch"],
    ["location-result", "LocationResult"],
    ["flood-context", "FloodContext"],
    ["nearby-context", "NearbyContext"],
    ["category-controls", "CategoryControls"],
  ])
    overrides[`@/components/${file}`] = { [name]: name };
  const react = {
    useState: (initial) => [initial, () => {}],
    useRef: () => ({ current: null }),
    useEffect() {},
    useMemo: (fn) => fn(),
    useCallback: (fn) => fn,
  };
  const { MapExperience } = component("map-experience", overrides, react);
  for (const view of ["nearby", "conditions"]) {
    state.view = view;
    const tree = MapExperience(),
      map = find(tree, (node) => node.type === "NeighborhoodMap").props;
    assert.equal(map.reference, location);
    assert.equal(map.location, null);
    assert.equal(map.places.length, 0);
    assert.equal(map.route, null);
    assert.equal(map.showReports, false);
    assert.equal(map.conditions, false);
    assert.equal(
      find(tree, (node) =>
        ["NearbyContext", "FloodContext", "CategoryControls"].includes(
          node.type,
        ),
      ),
      undefined,
    );
    assert.match(
      text(tree),
      view === "nearby"
        ? /Nearby places and journeys are not available/
        : /does not indicate safety/,
    );
  }
});

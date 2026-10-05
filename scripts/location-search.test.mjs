import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function load(name, context = {}, overrides = {}, cache = new Map()) {
  if (name === "server-only") return {};
  if (name in overrides) return overrides[name];
  if (cache.has(name)) return cache.get(name);
  const path = name.startsWith("@/")
    ? name.slice(2)
    : name.startsWith("./")
      ? `lib/${name.slice(2)}`
      : name;
  const { outputText } = ts.transpileModule(
    readFileSync(new URL(`../src/${path}.ts`, import.meta.url), "utf8"),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    },
  );
  const exports = {};
  cache.set(name, exports);
  runInNewContext(outputText, {
    exports,
    URL,
    URLSearchParams,
    Request,
    Response,
    AbortSignal,
    AbortController,
    process: { env: {} },
    ...context,
    require: (dependency) => load(dependency, context, overrides, cache),
  });
  return exports;
}

// Deliberately small synthetic provider fixture; automated tests never use a key/network.
const place = {
  place_id: "fixture-geoapify-id",
  name: "Chulalongkorn University",
  other_names: {
    "name:th": "จุฬาลงกรณ์มหาวิทยาลัย",
    "name:en": "Chulalongkorn University",
  },
  formatted: "254 ถนนพญาไท กรุงเทพมหานคร",
  country: "ประเทศไทย",
  country_code: "th",
  city: "กรุงเทพมหานคร",
  suburb: "เขตปทุมวัน",
  quarter: "แขวงวังใหม่",
  district: "สามย่าน",
  lon: 100.532872512345,
  lat: 13.743089312345,
  result_type: "amenity",
  category: "education.university",
};
const { normalizeGeoapify } = load("./geoapify");
const location = normalizeGeoapify({ results: [place] })[0];

test("provider normalization retains reliable labels and coordinates without raw objects", () => {
  assert.equal(location.name, place.other_names["name:th"]);
  assert.equal(location.englishName, place.name);
  assert.equal(location.district, "เขตปทุมวัน");
  assert.equal(location.subdistrict, "แขวงวังใหม่");
  assert.equal(location.coordinates[0], place.lon);
  assert.equal(location.coordinates[1], place.lat);
  assert.equal(location.category, "education.university");
  assert.equal(location.other_names, undefined);
  assert.equal(location.rank, undefined);
  const english = normalizeGeoapify({
    results: [{ ...place, other_names: undefined }],
  })[0];
  assert.equal(english.name, place.name);
  assert.equal(english.localName, undefined);
  const building = normalizeGeoapify({
    results: [
      {
        ...place,
        name: undefined,
        address_line1: "101",
        result_type: "building",
      },
    ],
  })[0];
  assert.equal(
    building.name,
    "101",
    "street translation must not rename a house",
  );
  const ambiguous = normalizeGeoapify({
    results: [
      {
        ...place,
        suburb: "Bang Kapi Khwaeng",
        county: "เขตบางเขน",
        quarter: undefined,
      },
    ],
  })[0];
  assert.equal(
    ambiguous.district,
    undefined,
    "conflicting county must not become an authoritative district",
  );
  assert.equal(ambiguous.subdistrict, undefined);
});

test("normalization rejects invalid/out-of-coverage results, deduplicates and caps", () => {
  assert.throws(() => normalizeGeoapify({ error: "bad" }));
  const bad = [
    null,
    {},
    { ...place, lat: "13" },
    { ...place, lon: Infinity },
    { ...place, lat: 91 },
    { ...place, city: "Chiang Mai" },
    { ...place, country_code: "us" },
  ];
  assert.equal(normalizeGeoapify({ results: bad }).length, 0);
  assert.equal(normalizeGeoapify({ results: [place, place] }).length, 1);
  assert.equal(
    normalizeGeoapify({
      results: Array.from({ length: 8 }, (_, i) => ({
        ...place,
        place_id: String(i),
      })),
    }).length,
    5,
  );
});

test("Geoapify calls have Bangkok place filter, Thai labels, fixed limit and empty-only fallback", async () => {
  const calls = [];
  const { searchGeoapify } = load("./geoapify", {
    fetch: async (url, options) => {
      calls.push({ url, options });
      return Response.json({ results: calls.length === 1 ? [] : [place] });
    },
  });
  assert.equal((await searchGeoapify("อารีย์", "test-key")).length, 1);
  assert.equal(calls.length, 2);
  assert.match(calls[0].url.pathname, /autocomplete$/);
  assert.match(calls[1].url.pathname, /search$/);
  assert.match(calls[0].url.searchParams.get("filter"), /^place:/);
  assert.equal(calls[0].url.searchParams.get("lang"), "th");
  assert.equal(calls[0].url.searchParams.get("limit"), "5");
  assert.equal(calls[0].options.cache, "no-store");
  assert.equal(calls[0].options.signal, calls[1].options.signal);
  calls.length = 1;
  await searchGeoapify("KMITL", "test-key");
  assert.equal(calls.length, 2, "nonempty autocomplete needs only one request");
});

test("API validates input, handles missing keys and never leaks upstream failures", async () => {
  const calls = [];
  const context = { process: { env: { GEOAPIFY_API_KEY: "test-key" } } };
  const overrides = {
    "@/lib/geoapify": {
      searchGeoapify: async (...args) => {
        calls.push(args);
        return [location];
      },
    },
  };
  const { GET } = load("app/api/locations/route", context, overrides);
  const request = (query) =>
    new Request(`https://yaan.test/api/locations?${query}`);
  for (const query of ["q=", "q=%20", "q=a"])
    assert.equal((await GET(request(query))).status, 200);
  for (const query of ["", "q=a&q=b", `q=${"a".repeat(201)}`, "q=abc%00"])
    assert.equal((await GET(request(query))).status, 400);
  assert.equal(calls.length, 0);
  const success = await GET(request("q=%20KMITL%20%20campus%20&limit=10000"));
  assert.equal(calls[0][0], "KMITL campus");
  assert.equal(success.headers.get("cache-control"), "private, max-age=60");
  assert.equal((await success.json()).locations[0].id, location.id);
  context.process.env = {};
  assert.equal((await GET(request("q=KMITL"))).status, 503);
  const unavailable = load("app/api/locations/route", {
    process: { env: { GEOAPIFY_API_KEY: "test-key" } },
    fetch: async () => {
      throw new Error("secret-provider-url-test-key");
    },
  });
  const failed = await unavailable.GET(request("q=KMITL"));
  assert.equal(failed.status, 502);
  assert.equal(failed.headers.get("cache-control"), "no-store");
  assert.doesNotMatch(await failed.text(), /secret|test-key|geoapify/i);
});

function searchHarness() {
  let next = 0;
  const timers = new Map(),
    requests = [],
    states = [];
  const { requestLocations } = load("./location-search-request", {
    setTimeout: (callback) => {
      timers.set(++next, callback);
      return next;
    },
    clearTimeout: (id) => timers.delete(id),
    fetch: (url, options) =>
      new Promise((resolve, reject) =>
        requests.push({ url, options, resolve, reject }),
      ),
  });
  return {
    requests,
    states,
    timers,
    search: (query) => requestLocations(query, (value) => states.push(value)),
    fire: () => {
      const callbacks = [...timers.values()];
      timers.clear();
      return callbacks.map((callback) => callback());
    },
  };
}

test("search skips empty/short input and debounces typing before endpoint calls", async () => {
  const h = searchHarness();
  for (const query of ["", "  ", "a", "a".repeat(201)]) h.search(query);
  assert.equal(h.timers.size, 0);
  h.search("KM")();
  h.search("KMI")();
  const cancel = h.search("KMITL");
  assert.equal(h.requests.length, 0);
  const work = h.fire();
  assert.equal(h.requests.length, 1);
  assert.equal(h.requests[0].url, "/api/locations?q=KMITL");
  assert.equal(h.states.at(-1).status, "loading");
  h.requests[0].resolve(Response.json({ locations: [location] }));
  await Promise.all(work);
  assert.equal(h.states.at(-1).locations[0].id, location.id);
  cancel();
  assert.equal(h.requests[0].options.signal.aborted, true);
});

test("late responses/errors cannot replace newer search results, including after clear", async () => {
  const h = searchHarness();
  const old = h.search("Ari"),
    oldWork = h.fire();
  old();
  h.search("KMITL");
  const currentWork = h.fire();
  h.requests[1].resolve(Response.json({ locations: [location] }));
  await Promise.all(currentWork);
  h.requests[0].resolve(Response.json({ locations: [{ id: "stale" }] }));
  await Promise.all(oldWork);
  assert.equal(h.states.at(-1).query, "KMITL");
  const cancel = h.search("Thong Lo"),
    pending = h.fire();
  cancel();
  h.search("");
  h.requests[2].reject(new Error("late failure"));
  await Promise.all(pending);
  assert.equal(h.states.at(-1).status, "idle");
});

test("search exposes empty and failure states", async () => {
  const h = searchHarness();
  h.search("unknown");
  const empty = h.fire();
  h.requests[0].resolve(Response.json({ locations: [] }));
  await Promise.all(empty);
  assert.equal(h.states.at(-1).status, "ready");
  assert.equal(h.states.at(-1).locations.length, 0);
  h.search("failure");
  const failed = h.fire();
  h.requests[1].resolve(new Response(null, { status: 503 }));
  await Promise.all(failed);
  assert.equal(h.states.at(-1).status, "error");
});

test("real selected location survives navigation exactly and cannot inherit demo content", () => {
  const { locationHref } = load("./location");
  const { exploreEntry, exploreHref } = load("./explore-entry");
  const { explorationReducer } = load("./exploration-state");
  const params = new URL(locationHref(location), "https://yaan.test")
    .searchParams;
  params.set("place", "ari-bts");
  params.set("reference", "ari-bts");
  params.set("view", "route");
  const entry = exploreEntry(params);
  assert.equal(entry.location.name, location.name);
  assert.equal(entry.location.coordinates[0], place.lon);
  assert.equal(entry.location.coordinates[1], place.lat);
  assert.equal(entry.referenceId, null);
  assert.equal(entry.placeId, null);
  assert.equal(entry.routing, false);
  assert.equal(exploreHref(entry), locationHref(location));
  const conditions = explorationReducer(entry, {
    type: "view",
    view: "conditions",
  });
  const restored = exploreEntry(
    new URL(exploreHref(conditions), "https://yaan.test").searchParams,
  );
  assert.equal(restored.location.district, location.district);
  assert.equal(restored.view, "conditions");
  assert.equal(
    explorationReducer(entry, { type: "inspect", place: { id: "ari-bts" } }),
    entry,
  );
  for (const invalid of [
    "location=id",
    "location=x&location=y",
    params.toString().replace(`lat=${place.lat}`, "lat=NaN"),
  ]) {
    const state = exploreEntry(new URLSearchParams(invalid));
    assert.equal(state.locationError, true);
    assert.equal(state.location, null);
    assert.equal(
      state.referenceId,
      null,
      "invalid real links must not fall back to Ari",
    );
  }
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function load(name, context = {}) {
  const { outputText } = ts.transpileModule(
    readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  );
  const exports = {};
  runInNewContext(outputText, { exports, ...context });
  return exports;
}

function browser(stored, dark = false, blocked = false) {
  const events = new Map();
  const mediaEvents = new Map();
  const media = {
    matches: dark,
    addEventListener: (name, callback) => mediaEvents.set(name, callback),
    removeEventListener: (name) => mediaEvents.delete(name),
  };
  const context = {
    Event,
    document: { documentElement: { dataset: {} } },
    matchMedia: () => media,
    localStorage: {
      getItem: () => { if (blocked) throw Error("Blocked"); return stored; },
      setItem: (key, value) => { if (blocked) throw Error("Blocked"); stored = value; },
    },
    window: {
      matchMedia: () => media,
      addEventListener: (name, callback) => events.set(name, callback),
      removeEventListener: (name) => events.delete(name),
      dispatchEvent: (event) => events.get(event.type)?.(event),
    },
  };
  return { context, events, mediaEvents, media, stored: () => stored };
}

test("first-paint bootstrap agrees with runtime resolution for valid, missing and invalid preferences", () => {
  const { THEME_BOOTSTRAP, normalizeTheme, resolveTheme } = load("theme");
  for (const value of [null, "light", "dark", "system", "invalid", "<script>"]) {
    for (const dark of [false, true]) {
      const { context } = browser(value, dark);
      runInNewContext(THEME_BOOTSTRAP, context);
      assert.equal(context.document.documentElement.dataset.themePreference, normalizeTheme(value));
      assert.equal(context.document.documentElement.dataset.theme, resolveTheme(normalizeTheme(value), dark));
    }
  }
});

test("blocked storage falls back to system and still allows session changes", () => {
  const { context } = browser("light", true, true);
  const theme = load("theme", context);
  runInNewContext(theme.THEME_BOOTSTRAP, context);
  assert.equal(context.document.documentElement.dataset.theme, "dark");
  theme.setThemePreference("light");
  assert.equal(theme.getThemePreference(), "light");
  assert.equal(context.document.documentElement.dataset.theme, "light");
});

test("explicit preference persists, overrides OS, tracks system live and synchronizes storage", () => {
  const env = browser(null, false);
  const theme = load("theme", env.context);
  runInNewContext(theme.THEME_BOOTSTRAP, env.context);
  let notifications = 0;
  const cleanup = theme.subscribeTheme(() => notifications++);
  theme.setThemePreference("light");
  assert.equal(env.stored(), "light");
  env.media.matches = true;
  env.mediaEvents.get("change")();
  assert.equal(env.context.document.documentElement.dataset.theme, "light");
  theme.setThemePreference("system");
  assert.equal(env.stored(), "system");
  assert.equal(env.context.document.documentElement.dataset.theme, "dark");
  env.media.matches = false;
  env.mediaEvents.get("change")();
  assert.equal(env.context.document.documentElement.dataset.theme, "light");
  env.events.get("storage")({ key: "unrelated", newValue: "dark" });
  assert.equal(theme.getThemePreference(), "system");
  env.events.get("storage")({ key: theme.THEME_STORAGE_KEY, newValue: "dark" });
  assert.equal(theme.getThemePreference(), "dark");
  env.events.get("storage")({ key: null, newValue: null });
  assert.equal(theme.getThemePreference(), "system");
  assert.equal(notifications, 6);
  cleanup();
  assert.equal(env.events.size, 0);
  assert.equal(env.mediaEvents.size, 0);
});

const css = readFileSync(new URL("../src/app/tokens.css", import.meta.url), "utf8");
const palettes = [...css.matchAll(/:root[^{}]*\{([^}]+)\}/g)].map(([, block]) =>
  Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[\da-f]{6});/g)].map(([, token, value]) => [token, value])),
);
function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map((v) => parseInt(v, 16) / 255)
    .map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

for (const [index, palette] of palettes.entries()) {
  const mode = index ? "dark" : "light";
  test(`${mode}: important text meets WCAG AA and control/focus boundaries meet 3:1`, () => {
    const textPairs = [
      ...["background", "surface", "surface-elevated", "secondary", "secondary-hover"].flatMap((surface) =>
        ["foreground", "muted-foreground"].map((text) => [text, surface])),
      ...["primary", "primary-hover", "primary-pressed"].map((fill) => ["primary-foreground", fill]),
      ["primary", "primary-soft"], ["primary", "background"],
      ["secondary-foreground", "secondary-hover"],
      ["success", "success-soft"], ["success", "surface"],
      ["warning", "warning-soft"], ["warning", "warning-emphasis"],
      ["destructive", "destructive-soft"], ["destructive", "background"],
      ["map-marker", "surface-elevated"], ["map-on-selected", "map-selected"],
      ["map-label", "map-label-halo"], ["map-water-label", "map-water"],
    ];
    for (const [text, surface] of textPairs) {
      const ratio = contrast(palette[text], palette[surface]);
      assert.ok(ratio >= 4.5, `${text} / ${surface}: ${ratio.toFixed(2)}`);
    }
    for (const token of ["focus", "input"]) {
      for (const surface of ["background", "surface", "surface-elevated"]) {
        const ratio = contrast(palette[token], palette[surface]);
        assert.ok(ratio >= 3, `${token} / ${surface}: ${ratio.toFixed(2)}`);
      }
    }
    for (const token of ["chart-bar", "chart-peak"]) {
      assert.ok(contrast(palette[token], palette.surface) >= 3, token);
    }
  });
}

test("map theme changes paint only and preserves source/filter/layout/geometry and shield sprites", () => {
  const { mapPaintTokens, applyMapTheme } = load("map-theme", {
    document: { documentElement: {} },
    getComputedStyle: () => ({ getPropertyValue: (name) => palettes[1][name.slice(2)] }),
  });
  const layers = [
    { id: "background", type: "background" },
    { id: "water", type: "fill", source: "openmaptiles", "source-layer": "water" },
    { id: "park", type: "fill", source: "openmaptiles", "source-layer": "park" },
    { id: "building", type: "fill", source: "openmaptiles", "source-layer": "building" },
    { id: "highway_minor", type: "line", source: "openmaptiles", "source-layer": "transportation" },
    { id: "highway_major_inner", type: "line", source: "openmaptiles", "source-layer": "transportation" },
    { id: "highway_major_casing", type: "line", source: "openmaptiles", "source-layer": "transportation" },
    { id: "label_city", type: "symbol", source: "openmaptiles", "source-layer": "place" },
    { id: "highway-shield-non-us", type: "symbol", source: "openmaptiles" },
    { id: "area-fill", type: "fill", source: "illustrative-area" },
    { id: "route-line", type: "line", source: "mock-route" },
    { id: "route-casing", type: "line", source: "mock-route" },
    { id: "future-overlay", type: "fill", source: "another-source" },
  ];
  assert.equal(mapPaintTokens(layers[1])["fill-color"], "map-water");
  assert.notEqual(mapPaintTokens(layers[4])["line-color"], mapPaintTokens(layers[5])["line-color"]);
  assert.equal(Object.keys(mapPaintTokens(layers[8])).length, 0);
  assert.equal(Object.keys(mapPaintTokens(layers[12])).length, 0);
  const before = JSON.stringify(layers);
  const paints = [];
  applyMapTheme({ getStyle: () => ({ layers }), setPaintProperty: (...args) => paints.push(args) });
  assert.equal(JSON.stringify(layers), before);
  assert.equal(paints.length, 13);
  assert.ok(paints.every(([, , color]) => /^#[\da-f]{6}$/.test(color)));
  assert.ok(paints.some(([id, , color]) => id === "route-line" && color === palettes[1]["map-route"]));
});

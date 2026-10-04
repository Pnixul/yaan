import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function load(name, context = {}) {
  const source = readFileSync(
    new URL(`../src/lib/${name}.ts`, import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  const exports = {};
  runInNewContext(outputText, { exports, ...context });
  return exports;
}
function browser(stored, blocked = false) {
  const events = new Map();
  const context = {
    Event,
    document: { documentElement: { lang: "" } },
    localStorage: {
      getItem: () => {
        if (blocked) throw Error("Blocked");
        return stored;
      },
      setItem: (_key, value) => {
        if (blocked) throw Error("Blocked");
        stored = value;
      },
    },
    window: {
      addEventListener: (name, fn) => events.set(name, fn),
      removeEventListener: (name) => events.delete(name),
      dispatchEvent: (event) => events.get(event.type)?.(event),
    },
  };
  return { context, events, stored: () => stored };
}

test("language defaults to Thai and restores only supported explicit preferences", () => {
  for (const stored of [null, "en", "th", "invalid", "<script>"]) {
    const { context } = browser(stored);
    const language = load("language", context);
    runInNewContext(language.LANGUAGE_BOOTSTRAP, context);
    assert.equal(language.getLanguage(), stored === "en" ? "en" : "th");
  }
});
test("language preference persists, synchronizes across tabs and cleans up listeners", () => {
  const env = browser(null);
  const language = load("language", env.context);
  let changes = 0;
  const unsubscribe = language.subscribeLanguage(() => changes++);
  language.setLanguage("en");
  assert.equal(env.stored(), "en");
  assert.equal(language.getLanguage(), "en");
  env.events.get("storage")({ key: "unrelated", newValue: "th" });
  assert.equal(language.getLanguage(), "en");
  env.events.get("storage")({
    key: language.LANGUAGE_STORAGE_KEY,
    newValue: "th",
  });
  assert.equal(language.getLanguage(), "th");
  env.events.get("storage")({ key: null, newValue: null });
  assert.equal(changes, 3);
  unsubscribe();
  assert.equal(env.events.size, 0);
});
test("blocked storage allows session-only switching without navigation or auth access", () => {
  const { context } = browser("en", true);
  const language = load("language", context);
  runInNewContext(language.LANGUAGE_BOOTSTRAP, context);
  assert.equal(language.getLanguage(), "th");
  // No location, history, cookies or authentication APIs exist in this harness.
  language.setLanguage("en");
  assert.equal(language.getLanguage(), "en");
});

const { thaiMessages, translate } = load("messages");
test("message interpolation preserves names and missing data limitations", () => {
  assert.equal(
    translate("en", "Save {name}", { name: "Ari BTS station" }),
    "Save Ari BTS station",
  );
  assert.equal(
    translate("th", "Save {name}", { name: "Ari BTS station" }),
    "บันทึก Ari BTS station",
  );
  assert.match(
    translate(
      "th",
      "This example has no report data. Missing reports do not mean an area is safe from flooding.",
    ),
    /ไม่ได้หมายความ/,
  );
  assert.equal(translate("en", "Mock data"), "Sample data");
});

const root = new URL("../", import.meta.url);
const components = readdirSync(new URL("src/components/", root))
  .filter((f) => f.endsWith(".tsx"))
  .map((f) => "src/components/" + f);
const account = readdirSync(new URL("src/app/account/", root))
  .filter((f) => f.endsWith(".tsx"))
  .map((f) => "src/app/account/" + f);
function ast(file) {
  return ts.createSourceFile(
    file,
    readFileSync(new URL(file, root), "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
}
function walk(node, inspect) {
  inspect(node);
  ts.forEachChild(node, (child) => walk(child, inspect));
}
function covered(message, file) {
  assert.ok(
    Object.hasOwn(thaiMessages, message),
    `Missing Thai copy in ${file}: ${message}`,
  );
}
test("rendered literal messages and accessible labels have Thai translations", () => {
  for (const file of [...components, ...account, "src/app/page.tsx"]) {
    walk(ast(file), (node) => {
      if (
        ts.isCallExpression(node) &&
        node.expression.getText() === "t" &&
        ts.isStringLiteral(node.arguments[0])
      )
        covered(node.arguments[0].text, file);
      if (ts.isJsxAttribute(node) && node.name.text === "text") {
        const value = ts.isJsxExpression(node.initializer)
          ? node.initializer.expression
          : node.initializer;
        if (value && ts.isStringLiteral(value)) covered(value.text, file);
      }
      if (ts.isJsxText(node) && /[a-z]{2}/i.test(node.text)) {
        assert.equal(
          node.text.trim(),
          "yaan",
          `Unlocalized UI text in ${file}: ${node.text.trim()}`,
        );
      }
    });
  }
});
test("fixture descriptions, categories and server feedback remain covered without changing models", () => {
  for (const file of [
    "src/lib/mock-places.ts",
    "src/lib/mock-locations.ts",
    "src/lib/supabase/auth-errors.ts",
    "src/lib/auth-intent-server.ts",
    "src/lib/saved-places.ts",
    "src/app/account/actions.ts",
    "src/app/account/intent-actions.ts",
    "src/app/saved/actions.ts",
  ]) {
    walk(ast(file), (node) => {
      if (
        ts.isCallExpression(node) &&
        node.expression.getText() === "place" &&
        ts.isStringLiteral(node.arguments[4])
      )
        covered(node.arguments[4].text, file);
      if (
        ts.isPropertyAssignment(node) &&
        ["label", "explanation", "error"].includes(node.name.getText())
      ) {
        walk(node.initializer, (child) => {
          if (ts.isStringLiteral(child)) covered(child.text, file);
        });
      }
      if (
        file.endsWith("auth-errors.ts") &&
        ts.isReturnStatement(node) &&
        node.expression &&
        ts.isStringLiteral(node.expression)
      )
        covered(node.expression.text, file);
    });
  }
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const places = [{ id: "place-a" }, { id: "place-b" }];
const copy = (value) => JSON.parse(JSON.stringify(value));
const tick = () => new Promise((resolve) => setImmediate(resolve));
function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function load(path, modules, globals = {}) {
  const { outputText } = ts.transpileModule(
    readFileSync(new URL(path, import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  );
  const exports = {};
  runInNewContext(outputText, {
    ...globals,
    exports,
    require(name) {
      if (name in modules) return modules[name];
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return exports;
}

function server({
  userId = "user-a",
  authError = null,
  databaseError = null,
  rows = [],
  configured = true,
} = {}) {
  const calls = [];
  const result = { data: rows, error: databaseError };
  const query = {};
  for (const method of [
    "select",
    "eq",
    "in",
    "order",
    "limit",
    "upsert",
    "delete",
  ]) {
    query[method] = (...args) => {
      calls.push([method, ...copy(args)]);
      return query;
    };
  }
  query.returns = async () => result;
  query.then = (resolve) => Promise.resolve(result).then(resolve);
  const client = {
    auth: {
      getUser: async () => {
        calls.push(["getUser"]);
        return {
          data: { user: userId ? { id: userId } : null },
          error: authError,
        };
      },
    },
    from: (table) => {
      calls.push(["from", table]);
      return query;
    },
  };
  return {
    calls,
    ...load("../src/app/saved/actions.ts", {
      "@/lib/supabase/server": {
        createClient: async () => (configured ? client : null),
      },
      "@supabase/supabase-js": {
        isAuthSessionMissingError: (error) => error.code === "missing_session",
      },
      "@/lib/mock-places": { MOCK_PLACES: places },
    }),
  };
}

test("load uses verified owner, bounded known-place filtering, and ignores unknown data", async () => {
  const api = server({
    rows: [
      { place_id: "place-b" },
      { place_id: "unknown" },
      { place_id: "place-b" },
      null,
    ],
  });
  assert.deepEqual(copy(await api.loadSavedPlaces()), {
    mode: "account",
    userId: "user-a",
    ids: ["place-b"],
  });
  assert.ok(
    api.calls.some(
      (call) => JSON.stringify(call) === '["eq","user_id","user-a"]',
    ),
  );
  assert.ok(
    api.calls.some((call) => call[0] === "in" && call[1] === "place_id"),
  );
  assert.ok(
    api.calls.some((call) => call[0] === "limit" && call[1] === places.length),
  );
});

test("only a missing session resolves to signed-out; configuration and service failures remain errors", async () => {
  for (const options of [
    { userId: null },
    { userId: null, authError: { code: "missing_session" } },
  ]) {
    const api = server(options);
    assert.equal((await api.loadSavedPlaces()).mode, "signed-out");
    assert.ok(!api.calls.some((call) => call[0] === "from"));
  }
  for (const options of [
    { configured: false },
    { authError: { code: "network_error" } },
    { databaseError: { message: "missing table" } },
  ]) {
    assert.equal((await server(options).loadSavedPlaces()).mode, "error");
  }
});

test("mutations reject invalid places, invalid operations, guests and stale account identity", async () => {
  for (const [options, id, saved, expected] of [
    [{}, "unknown", true, "user-a"],
    [{}, "place-a", "true", "user-a"],
    [{ userId: null }, "place-a", true, "user-a"],
    [{ userId: "user-b" }, "place-a", true, "user-a"],
    [{ authError: { code: "network_error" } }, "place-a", true, "user-a"],
  ]) {
    const api = server(options);
    assert.equal((await api.setSavedPlace(id, saved, expected)).ok, false);
    assert.ok(!api.calls.some((call) => call[0] === "from"));
  }
});

test("saving is idempotent and unsaving explicitly filters the verified owner and place", async () => {
  const api = server();
  assert.equal((await api.setSavedPlace("place-a", true, "user-a")).ok, true);
  assert.deepEqual(
    api.calls.find((call) => call[0] === "upsert"),
    [
      "upsert",
      { user_id: "user-a", place_id: "place-a" },
      { onConflict: "user_id,place_id", ignoreDuplicates: true },
    ],
  );
  api.calls.length = 0;
  assert.equal((await api.setSavedPlace("place-a", false, "user-a")).ok, true);
  assert.deepEqual(
    api.calls.filter((call) => call[0] === "eq"),
    [
      ["eq", "user_id", "user-a"],
      ["eq", "place_id", "place-a"],
    ],
  );
  assert.equal(
    (
      await server({ databaseError: {} }).setSavedPlace(
        "place-a",
        true,
        "user-a",
      )
    ).ok,
    false,
  );
});

function store({
  read = async () => ({ mode: "signed-out" }),
  write = async () => ({ ok: true }),
  stored = "[]",
  blocked = false,
} = {}) {
  let subscribe;
  let getSnapshot;
  let raw = stored;
  const events = new Map();
  const loadedStore = load(
    "../src/lib/saved-places.ts",
    {
      react: {
        useSyncExternalStore: (sub, get) => {
          subscribe = sub;
          getSnapshot = get;
          return get();
        },
      },
      "./mock-places": { MOCK_PLACES: places },
      "@/app/saved/actions": {
        loadSavedPlaces: () => read(),
        setSavedPlace: (...args) => write(...args),
      },
    },
    {
      window: {
        addEventListener: (name, handler) => events.set(name, handler),
        removeEventListener: (name) => events.delete(name),
      },
      localStorage: {
        removeItem: () => {
          if (blocked) throw new Error("blocked");
          raw = null;
        },
        getItem: () => {
          if (blocked) throw new Error("blocked");
          return raw;
        },
        setItem: (_key, value) => {
          if (blocked) throw new Error("blocked");
          raw = value;
        },
      },
    },
  );
  const actions = loadedStore.useSavedPlaces();
  return {
    ...actions,
    attach: () => subscribe(() => {}),
    state: () => copy(getSnapshot()),
    raw: () => raw,
    focus: () => events.get("focus")?.(),
    storage: () => events.get("storage")?.({ key: "yaan.saved-places" }),
  };
}

test("signed-out users cannot save and legacy guest data is discarded, never imported", async () => {
  let writes = 0;
  const local = store({
    stored: '["place-a"]',
    write: async () => {
      writes++;
      return { ok: true };
    },
  });
  local.attach();
  await tick();
  assert.equal(local.state().mode, "signed-out");
  assert.deepEqual(local.state().ids, []);
  assert.equal(local.raw(), null);
  assert.equal(await local.toggle("place-b"), false);
  assert.equal(writes, 0);
  const blocked = store({ blocked: true, stored: '["place-a"]' });
  blocked.attach();
  await tick();
  assert.deepEqual(blocked.state().ids, []);
  assert.equal(await blocked.toggle("place-b"), false);
});

test("account writes await confirmation, suppress double clicks, and never import guest storage", async () => {
  const request = deferred();
  const writes = [];
  const account = store({
    stored: '["place-b"]',
    read: async () => ({ mode: "account", userId: "user-a", ids: [] }),
    write: (...args) => {
      writes.push(args);
      return request.promise;
    },
  });
  account.attach();
  await tick();
  account.storage();
  assert.deepEqual(account.state().ids, []);
  const saving = account.toggle("place-a");
  assert.equal(account.state().pending, true);
  assert.deepEqual(account.state().ids, []);
  assert.equal(await account.toggle("place-a"), false);
  request.resolve({ ok: true });
  assert.equal(await saving, true);
  assert.deepEqual(account.state().ids, ["place-a"]);
  assert.equal(account.raw(), null);
  assert.deepEqual(writes, [["place-a", true, "user-a"]]);
});

test("failed load is not empty/guest; failed unsave keeps the confirmed list and allows retry", async () => {
  const unavailable = store({
    read: async () => ({ mode: "error", error: "Unavailable" }),
    stored: '["place-b"]',
  });
  unavailable.attach();
  await tick();
  assert.equal(unavailable.state().ready, false);
  assert.equal(unavailable.state().mode, null);
  assert.deepEqual(unavailable.state().ids, []);
  let succeeds = false;
  const account = store({
    read: async () => ({ mode: "account", userId: "user-a", ids: ["place-a"] }),
    write: async () =>
      succeeds ? { ok: true } : { ok: false, error: "Retry" },
  });
  account.attach();
  await tick();
  assert.equal(await account.remove("place-a"), false);
  assert.deepEqual(account.state().ids, ["place-a"]);
  assert.equal(account.state().pending, false);
  assert.equal(account.state().error, "Retry");
  succeeds = true;
  assert.equal(await account.remove("place-a"), true);
  assert.deepEqual(account.state().ids, []);
});

test("late loads cannot restore the previous account after navigation", async () => {
  const old = deferred();
  let read = () => old.promise;
  const account = store({ read: () => read() });
  const detach = account.attach();
  detach();
  read = async () => ({ mode: "account", userId: "user-b", ids: ["place-b"] });
  account.attach();
  await tick();
  old.resolve({ mode: "account", userId: "user-a", ids: ["place-a"] });
  await tick();
  assert.equal(account.state().userId, "user-b");
  assert.deepEqual(account.state().ids, ["place-b"]);
});

test("signout during a pending write discards stale account state and shows no saved list", async () => {
  const pending = deferred();
  let signedIn = true;
  const account = store({
    stored: '["place-b"]',
    read: async () =>
      signedIn
        ? { mode: "account", userId: "user-a", ids: [] }
        : { mode: "signed-out" },
    write: () => pending.promise,
  });
  account.attach();
  await tick();
  const saving = account.toggle("place-a");
  signedIn = false;
  account.focus();
  assert.deepEqual(account.state().ids, []);
  await tick();
  pending.resolve({ ok: true });
  assert.equal(await saving, false);
  assert.equal(account.state().mode, "signed-out");
  assert.deepEqual(account.state().ids, []);
  assert.equal(account.raw(), null);
});

test("expired or changed account during mutation reloads identity without claiming success", async () => {
  let signedIn = true;
  const account = store({
    read: async () =>
      signedIn
        ? { mode: "account", userId: "user-a", ids: ["place-a"] }
        : { mode: "signed-out" },
    write: async () => {
      signedIn = false;
      return { ok: false, sessionChanged: true, error: "Account changed" };
    },
  });
  account.attach();
  await tick();
  assert.equal(await account.remove("place-a"), false);
  assert.equal(account.state().mode, "signed-out");
  assert.deepEqual(account.state().ids, []);
  assert.equal(account.state().error, "Account changed");
});

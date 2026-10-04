import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { NextRequest, NextResponse } from "next/server.js";
import ts from "typescript";

const returnTo =
  "/explore?area=ari&reference=ari-bts&place=ari-cafe&category=food&view=route#area-summary";
const modules = new Map();
function source(path) {
  if (!modules.has(path))
    modules.set(
      path,
      ts.transpileModule(
        readFileSync(new URL(`../src/${path}.ts`, import.meta.url), "utf8"),
        { compilerOptions: { module: ts.ModuleKind.CommonJS } },
      ).outputText,
    );
  return modules.get(path);
}
function setup() {
  const jar = new Map();
  const cookieOptions = [];
  const saves = [];
  const rows = new Set();
  let user = null;
  let authError = null;
  let saveFailure = false;
  let confirmation = false;
  let now = Date.now();
  const cookieStore = {
    get: (key) => (jar.has(key) ? { value: jar.get(key) } : undefined),
    set: (key, value, options) => {
      jar.set(key, value);
      cookieOptions.push(options);
    },
    delete: (key) => jar.delete(key),
  };
  const session = () => (user ? { user } : null);
  const client = {
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
      signInWithPassword: async ({ email }) => {
        if (authError) return { error: authError, data: { session: null } };
        user = { id: "user-a", email };
        return { error: null, data: { session: session() } };
      },
      signUp: async ({ email, options }) => {
        assert.equal(
          options.emailRedirectTo,
          "https://yaan.example/auth/confirm",
        );
        if (!confirmation) user = { id: "user-a", email };
        return { error: authError, data: { session: session() } };
      },
      signOut: async () => {
        user = null;
        return { error: null };
      },
      exchangeCodeForSession: async () => ({
        error: authError,
        data: { session: session() },
      }),
      verifyOtp: async () => ({
        error: authError,
        data: { session: session() },
      }),
    },
  };
  const mocks = {
    "server-only": {},
    "node:crypto": { randomUUID },
    "next/headers": { cookies: async () => cookieStore },
    "next/navigation": {
      redirect: (url) => {
        throw Object.assign(new Error("redirect"), { url });
      },
    },
    "next/server": { NextResponse },
    "lib/supabase/server": { createClient: async () => client },
    "lib/supabase/config": {
      getConfirmationUrl: () => "https://yaan.example/auth/confirm",
    },
    "lib/supabase/auth-errors": {
      authErrorMessage: () => "Check your email and password.",
    },
    "app/saved/actions": {
      setSavedPlace: async (placeId, saved, userId) => {
        saves.push({ placeId, saved, userId });
        if (saveFailure) return { ok: false, error: "Unavailable" };
        rows.add(`${userId}:${placeId}`);
        return { ok: true };
      },
    },
  };
  const cache = new Map();
  function load(path) {
    if (path in mocks) return mocks[path];
    if (cache.has(path)) return cache.get(path);
    const exports = {};
    cache.set(path, exports);
    runInNewContext(source(path), {
      exports,
      URL,
      URLSearchParams,
      FormData,
      Date: class extends Date {
        static now() {
          return now;
        }
      },
      process: { env: { NODE_ENV: "production" } },
      require: (name) =>
        load(
          name.startsWith("@/")
            ? name.slice(2)
            : name.startsWith("./")
              ? path.slice(0, path.lastIndexOf("/") + 1) + name.slice(2)
              : name,
        ),
    });
    return exports;
  }
  return {
    jar,
    cookieOptions,
    saves,
    rows,
    load,
    user: (value) => {
      user = value;
    },
    authError: (value) => {
      authError = value;
    },
    failSave: (value) => {
      saveFailure = value;
    },
    confirmEmail: () => {
      confirmation = true;
    },
    expire: () => {
      now += 25 * 60 * 60 * 1000;
    },
  };
}
const form = (entries) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
};
async function redirect(promise) {
  try {
    await promise;
  } catch (error) {
    if (error.url) return error.url;
    throw error;
  }
  assert.fail("Expected a redirect");
}
async function begin(env) {
  const location = await redirect(
    env
      .load("app/account/intent-actions")
      .beginSave({}, form({ placeId: "ari-cafe", returnTo })),
  );
  return new URL(location, "https://yaan.example").searchParams.get("intent");
}
const credentials = (intent, mode = "signin") =>
  form({
    intent,
    mode,
    email: "test@example.com",
    password: "testing-password",
  });

test("return destinations reject external, ambiguous, repeated and mismatched URLs", () => {
  const { saveReturn, savedReturn } = setup().load("lib/auth-intent");
  assert.equal(saveReturn("ari-cafe", returnTo), returnTo);
  for (const url of [
    "https://evil.example/explore?place=ari-cafe",
    "//evil.example/explore?place=ari-cafe",
    "/\\evil.example/explore?place=ari-cafe",
    "/account",
    "/explore/../account?place=ari-cafe",
    "/explore?place=ari-cafe&place=ari-bts",
    "/explore?place=ari-bts",
    "/explore?place=ari-cafe&next=https://evil.example",
    "/explore?place=ari-cafe%0d%0aLocation:evil",
    "/explore?place=ari-cafe#unexpected",
    returnTo.repeat(20),
  ])
    assert.equal(saveReturn("ari-cafe", url), null, url);
  assert.equal(savedReturn("//evil.example"), "/account");
  assert.equal(savedReturn("/saved"), "/saved");
});

test("Save → failed sign-in → successful sign-in saves once and restores the exact URL", async () => {
  const env = setup();
  const id = await begin(env);
  const auth = env.load("app/account/actions");
  assert.equal(env.cookieOptions[0].httpOnly, true);
  assert.equal(env.cookieOptions[0].secure, true);
  assert.equal(env.cookieOptions[0].sameSite, "lax");
  env.authError({ code: "invalid_credentials" });
  assert.ok((await auth.authenticate({}, credentials(id))).error);
  assert.equal(env.saves.length, 0);
  assert.ok(env.jar.has("yaan.pending-save"));
  env.authError(null);
  assert.equal(
    await redirect(auth.authenticate({}, credentials(id))),
    returnTo,
  );
  assert.equal(env.rows.size, 1);
  assert.equal(env.jar.has("yaan.pending-save"), false);
  assert.equal(
    await redirect(auth.authenticate({}, credentials(id))),
    "/account?save=expired",
  );
  assert.equal(env.saves.length, 1);
});

test("failed automatic save retains intent for a safe retry, then cancellation removes it", async () => {
  const env = setup();
  const id = await begin(env);
  env.failSave(true);
  assert.equal(
    await redirect(
      env.load("app/account/actions").authenticate({}, credentials(id)),
    ),
    `/account?intent=${id}&save=error`,
  );
  const actions = env.load("app/account/intent-actions");
  assert.ok((await actions.finishSave({}, form({ intent: id }))).error);
  assert.ok(env.jar.has("yaan.pending-save"));
  env.failSave(false);
  assert.equal(
    await redirect(actions.finishSave({}, form({ intent: id }))),
    returnTo,
  );
  assert.equal(env.rows.size, 1);
  const other = await begin(env);
  assert.equal(
    await redirect(actions.cancelSave(form({ intent: other }))),
    returnTo,
  );
  assert.equal(env.jar.has("yaan.pending-save"), false);
});

test("expired, forged, cancelled, and stale-account requests never save", async () => {
  const env = setup();
  const id = await begin(env);
  const api = env.load("lib/auth-intent-server");
  env.user({ id: "user-b", email: "other@example.com" });
  assert.equal((await api.completeSaveIntent(id, "user-a")).ok, false);
  assert.equal((await api.completeSaveIntent(randomUUID())).ok, false);
  env.expire();
  assert.equal((await api.completeSaveIntent(id)).ok, false);
  assert.equal(env.saves.length, 0);
});

for (const query of [
  "?code=confirmation-code",
  "?token_hash=confirmation-hash&type=signup",
]) {
  test(`email confirmation resumes the browser-bound save (${query.split("=")[0]})`, async () => {
    const env = setup();
    const id = await begin(env);
    env.confirmEmail();
    const result = await env
      .load("app/account/actions")
      .authenticate({}, credentials(id, "signup"));
    assert.equal(result.confirmation, true);
    assert.equal(env.saves.length, 0);
    env.user({ id: "user-a", email: "test@example.com" });
    const response = await env
      .load("app/auth/confirm/route")
      .GET(
        new NextRequest(
          `https://yaan.example/auth/confirm${query}&next=//evil.example`,
        ),
      );
    assert.equal(response.headers.get("Location"), returnTo);
    assert.equal(env.rows.size, 1);
    assert.equal(env.jar.has("yaan.confirmation-return"), false);
  });
}

test("invalid confirmation preserves recovery, while another email cannot consume the intent", async () => {
  const env = setup();
  const id = await begin(env);
  env.confirmEmail();
  await env
    .load("app/account/actions")
    .authenticate({}, credentials(id, "signup"));
  const route = env.load("app/auth/confirm/route");
  const failed = await route.GET(
    new NextRequest("https://yaan.example/auth/confirm?error=expired"),
  );
  assert.equal(
    failed.headers.get("Location"),
    `/account?intent=${id}&confirmation=error`,
  );
  env.user({ id: "user-b", email: "different@example.com" });
  const other = await route.GET(
    new NextRequest("https://yaan.example/auth/confirm?code=test"),
  );
  assert.equal(other.headers.get("Location"), "/account");
  assert.equal(env.saves.length, 0);
});

test("normal Account and Saved sign-ins do not consume an unrelated pending request", async () => {
  const env = setup();
  await begin(env);
  const auth = env.load("app/account/actions");
  assert.equal(
    await redirect(auth.authenticate({}, credentials(""))),
    "/account",
  );
  const saved = credentials("");
  saved.set("next", "/saved");
  assert.equal(await redirect(auth.authenticate({}, saved)), "/saved");
  saved.set("next", "https://evil.example");
  assert.equal(await redirect(auth.authenticate({}, saved)), "/account");
  assert.equal(env.saves.length, 0);
  assert.equal(await redirect(auth.signOut()), "/account");
  assert.equal(env.jar.has("yaan.pending-save"), false);
});

test("registration with an immediate session completes the pending save", async () => {
  const env = setup();
  const id = await begin(env);
  assert.equal(
    await redirect(
      env
        .load("app/account/actions")
        .authenticate({}, credentials(id, "signup")),
    ),
    returnTo,
  );
  assert.equal(env.rows.size, 1);
});

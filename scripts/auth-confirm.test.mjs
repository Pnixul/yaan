import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { NextRequest, NextResponse } from "next/server.js";
import ts from "typescript";

// Exercise the real route with only the Supabase boundary stubbed. Use the
// existing TypeScript compiler and Node test runner; no test dependency needed.
const { outputText } = ts.transpileModule(
  readFileSync(
    new URL("../src/app/auth/confirm/route.ts", import.meta.url),
    "utf8",
  ),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
);

function loadHandler(client) {
  const exports = {};
  runInNewContext(outputText, {
    exports,
    require(name) {
      if (name === "next/server") return { NextResponse };
      if (name === "@/lib/supabase/server") {
        return { createClient: async () => client };
      }
      if (name === "@/lib/auth-intent")
        return { accountIntentHref: (id) => `/account?intent=${id}` };
      if (name === "@/lib/auth-intent-server")
        return { readConfirmationReturn: async () => null };
      throw new Error(`Unexpected route dependency: ${name}`);
    },
  });
  return exports.GET;
}

const success = {
  data: { session: { user: { id: "test-user" } } },
  error: null,
};

async function callback(query, result = success) {
  const calls = [];
  const invoke = (method, value) => {
    calls.push({ method, value });
    if (result instanceof Error) throw result;
    return result;
  };
  const handler = loadHandler({
    auth: {
      exchangeCodeForSession: async (code) => invoke("exchange", code),
      verifyOtp: async ({ token_hash, type }) =>
        invoke("verify", { token_hash, type }),
    },
  });
  const response = await handler(
    new NextRequest(`https://yaan.example/auth/confirm${query}`),
  );
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.equal(response.headers.get("Referrer-Policy"), "no-referrer");
  return { calls, location: response.headers.get("Location") };
}

test("standard confirmation exchanges its PKCE code before returning to Account", async () => {
  const { calls, location } = await callback(
    "?code=test-code&next=https://external.example",
  );
  assert.deepEqual(calls, [{ method: "exchange", value: "test-code" }]);
  assert.equal(location, "/account");
});

test("custom signup token-hash confirmation remains supported", async () => {
  const { calls, location } = await callback(
    "?token_hash=test-hash&type=signup&next=//external.example",
  );
  assert.deepEqual(calls, [
    { method: "verify", value: { token_hash: "test-hash", type: "signup" } },
  ]);
  assert.equal(location, "/account");
});

for (const query of [
  "?code=expired-code",
  "?token_hash=expired-hash&type=signup",
]) {
  test(`failed verification stays on the fixed Account error destination (${query.split("=")[0]})`, async () => {
    const { location } = await callback(query, {
      data: { session: null },
      error: { message: "private provider details" },
    });
    assert.equal(location, "/account?confirmation=error");
  });
}

test("provider exceptions do not leak details or become success", async () => {
  const { location } = await callback(
    "?code=test-code",
    new Error("private provider details"),
  );
  assert.equal(location, "/account?confirmation=error");
});

test("a response without a session does not claim successful authentication", async () => {
  const { location } = await callback("?code=test-code", {
    data: { session: null },
    error: null,
  });
  assert.equal(location, "/account?confirmation=error");
});

test("missing, unsupported, oversized and provider-error callbacks fail without auth calls", async () => {
  for (const query of [
    "",
    "?code=",
    "?token_hash=test-hash&type=recovery",
    `?code=${"x".repeat(2049)}`,
    "?code=test-code&error=access_denied",
    "?code=test-code&error_code=otp_expired",
  ]) {
    const { calls, location } = await callback(query);
    assert.deepEqual(calls, []);
    assert.equal(location, "/account?confirmation=error");
  }
});

test("missing project configuration fails safely", async () => {
  const handler = loadHandler(null);
  const response = await handler(
    new NextRequest("https://yaan.example/auth/confirm?code=test-code"),
  );
  assert.equal(response.headers.get("Location"), "/account?confirmation=error");
});

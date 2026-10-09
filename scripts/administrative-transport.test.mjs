import assert from "node:assert/strict";
import { test } from "node:test";
import { loadAdministrativeModule as load } from "./test-support/administrative-modules.mjs";

const { handleAdministrativeRequest: handle } = load("./resolver/transport.ts");
const { administrativeRequestFromPosition: fromPosition, MAX_ADMINISTRATIVE_REQUEST_BYTES: limit } =
  load("../src/lib/administrative-transport.ts");
const { createAdministrativeResolver: create } = load("./resolver/core.ts");
const { adaptAdministrativeDataset: adapt } = load("./resolver/adapter.ts");
const { syntheticAdapterFixture: fixture } = load("./fixtures/administrative-adapter.ts");
const { syntheticResolverDataset: dataset, rectangle } = load("./fixtures/administrative-resolver.ts");
const plain = (value) => JSON.parse(JSON.stringify(value));
const bytes = (value) => new TextEncoder().encode(value);
const request = (body = '{"latitude":4,"longitude":3}', extra = {}) => ({
  method: "POST", contentType: "application/json", body: bytes(body), ...extra,
});
const resolver = (data = dataset()) => create({ getDataset: () => data });
const lookup = (core, longitude, latitude) => handle(request(JSON.stringify(fromPosition([longitude, latitude]))), core);
function check(response, status, body) {
  assert.equal(response.status, status);
  assert.deepEqual(plain(response.headers), {
    "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8",
    ...(status === 405 ? { Allow: "POST" } : {}),
  });
  if (body) assert.deepEqual(plain(response.body), body);
  assert.equal(response.headers["Retry-After"], undefined);
  return response.body;
}
const invalid = { status: "invalid_input", reason: "invalid_coordinates" };

test("pinned synthetic adapter → resolver → transport produces public metadata only", () => {
  const f = fixture();
  const adapted = adapt(f.bundle, f.authorization);
  assert.equal(adapted.status, "ready_for_offline_test");
  const response = handle(request(), resolver(adapted.dataset));
  const body = check(response, 200);
  assert.equal(body.status, "resolved");
  assert.equal(body.unit.id, "synthetic-yaan:khwaeng:a");
  assert.equal(body.unit.nameTh, "แขวงทดสอบ ก (สังเคราะห์)");
  assert.equal(body.unit.parentId, "synthetic-yaan:khet:parent");
  assert.equal(body.dataset.qualification.status, "synthetic");
  assert.equal(body.dataset.official, false);
  assert.equal(body.dataset.version, "1");
  assert.equal(body.dataset.activation, undefined);
  assert.equal(body.dataset.qualification.reference, undefined);
  assert.equal(JSON.stringify(response).includes(f.authorization.reference), false);
  assert.equal(JSON.stringify(response).includes(f.authorization.subject.sha256), false);
  assert.equal(adapted.activation.eligible, false);
});

test("map order converts explicitly to named WGS84 coordinates without rounding or mutation", () => {
  const position = Object.freeze([32.1234567890123, 2.1234567890123]);
  assert.deepEqual(plain(fromPosition(position)), { longitude: position[0], latitude: position[1] });
  const data = dataset();
  data.coverageGeometry = rectangle(30, 1, 35, 3);
  data.boundaries = [{ ...data.boundaries[0], geometry: data.coverageGeometry }];
  assert.equal(check(lookup(resolver(data), ...position), 200).status, "resolved");
  assert.equal(check(lookup(resolver(data), position[1], position[0]), 200).status, "outside_coverage");
  let received;
  check(lookup({ resolve(input) { received = input; return { status: "unavailable", reason: "no_dataset" }; } }, ...position), 503);
  assert.deepEqual(plain(received), plain(fromPosition(position)));
});

test("borders, hole edges, overlaps and empty coverage-boundary matches stay ambiguous", () => {
  const core = resolver();
  for (const point of [[5, 4], [5, 0], [1, 1.5]]) {
    const body = check(lookup(core, ...point), 200);
    assert.equal(body.status, "ambiguous");
    assert.deepEqual(plain(body.reasons), ["boundary"]);
    assert.equal(body.unit, undefined);
    assert.deepEqual(plain(body.matches), plain(core.resolve(fromPosition(point)).matches));
  }
  const overlap = dataset();
  overlap.boundaries[1].geometry = rectangle(3, 0, 10, 10);
  const body = check(lookup(resolver(overlap), 4, 4), 200);
  assert.deepEqual(plain(body.reasons), ["overlap"]);
  assert.equal(body.matches.length, 2);
  overlap.boundaries.reverse();
  assert.deepEqual(plain(lookup(resolver(overlap), 4, 4).body), plain(body));
  const missing = dataset(); missing.boundaries.pop();
  const edge = check(lookup(resolver(missing), 10, 4), 200);
  assert.equal(edge.coverageBoundary, true);
  assert.deepEqual(plain(edge.matches), []);
});

test("outside declared coverage and uncovered interiors retain distinct outcomes", () => {
  assert.equal(check(lookup(resolver(), 11, 4), 200).status, "outside_coverage");
  check(lookup(resolver(), 1.5, 1.5), 503, { status: "unavailable", reason: "coverage_gap" });
  const data = dataset(); data.boundaries.pop(); data.coverageGeometry = data.boundaries[0].geometry;
  assert.equal(check(lookup(resolver(data), 1.5, 1.5), 200).status, "outside_coverage");
});

test("unavailable states remain generic 503 responses without metadata or fallback", () => {
  check(handle(request(), resolver(null)), 503, { status: "unavailable", reason: "no_dataset" });
  check(handle(request(), create({ getDataset() { throw new Error("private source URL"); } })), 503,
    { status: "unavailable", reason: "provider_error" });
  const disabled = dataset(); disabled.provenance.qualification.status = "qualified";
  check(handle(request(), resolver(disabled)), 503, { status: "unavailable", reason: "dataset_not_enabled" });
  const malformed = dataset(); malformed.boundaries = [];
  check(handle(request(), resolver(malformed)), 503, { status: "unavailable", reason: "invalid_dataset" });
  check(handle(request(), { resolve: () => ({ status: "unavailable", reason: "geometry_error", debug: "secret" }) }), 503,
    { status: "unavailable", reason: "geometry_error" });
  check(handle(request(), { resolve: () => ({ status: "invalid_input", reason: "private detail" }) }), 400, invalid);
});

test("denied synthetic evidence cannot become a transport success", () => {
  const f = fixture(); f.bundle.datasetJson += " ";
  const adapted = adapt(f.bundle, f.authorization);
  assert.equal(adapted.status, "denied");
  // Server composition handles denial explicitly, with no fixture/old-release fallback.
  const core = resolver(adapted.status === "ready_for_offline_test" ? adapted.dataset : null);
  check(handle(request(), core), 503, { status: "unavailable", reason: "no_dataset" });
});

test("JSON shape, duplicate members, fields, finite ranges and types are checked before resolving", () => {
  let calls = 0;
  const core = { resolve() { calls++; throw new Error("must not run"); } };
  for (const body of ["", "{", "null", "[]", "true", "4", '"location"', "{}",
    '{"latitude":4}', '{"lat":4,"lon":3}', '{"latitude":"4","longitude":3}',
    '{"latitude":null,"longitude":3}', '{"latitude":[],"longitude":3}',
    '{"latitude":{},"longitude":3}', '{"latitude":true,"longitude":3}',
    '{"latitude":NaN,"longitude":3}', '{"latitude":1e309,"longitude":3}',
    '{"latitude":4,"longitude":-1e309}', '{"latitude":91,"longitude":3}',
    '{"latitude":-91,"longitude":3}', '{"latitude":4,"longitude":181}',
    '{"latitude":4,"longitude":-181}', '{"latitude":4,"longitude":3,"accuracy":1}',
    '{"latitude":4,"latitude":5,"longitude":3}', '{"latitude":4,"long\\u0069tude":2,"longitude":3}',
    '{"latitude":4,"longitude":3}{}', '\ufeff{"latitude":4,"longitude":3}',
  ]) check(handle(request(body), core), 400, invalid);
  check(handle(request("", { body: new Uint8Array([0xc3, 0x28]) }), core), 400, invalid);
  assert.equal(calls, 0);
  for (const point of [[180, 90], [-180, -90], [0, 0]]) {
    check(lookup(resolver(null), ...point), 503, { status: "unavailable", reason: "no_dataset" });
  }
  assert.equal(check(handle(request('{"lat\\u0069tude":4,"longitude":3}'), resolver()), 200).status, "resolved");
});

test("clients cannot submit datasets, providers, evidence, authorization or activation", () => {
  let calls = 0;
  const core = { resolve() { calls++; } };
  for (const field of ["dataset", "datasetUrl", "version", "level", "provider", "geometry", "evidence",
    "qualification", "authorization", "trustedAuthorization", "activation", "__proto__"]) {
    check(handle(request(JSON.stringify({ latitude: 4, longitude: 3, [field]: "untrusted" })), core), 400, invalid);
  }
  assert.equal(calls, 0);
});

test("only POST is accepted and all method errors include Allow and no-store", () => {
  let calls = 0;
  for (const method of ["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "DELETE", "post", ""]) {
    check(handle(request("", { method, contentType: null }), { resolve() { calls++; } }), 405,
      { error: "method_not_allowed" });
  }
  assert.equal(calls, 0);
});

test("JSON media type accepts only the documented optional UTF-8 charset", () => {
  for (const contentType of ["application/json", "Application/JSON", "application/json; charset=utf-8",
    ' APPLICATION/JSON ; CHARSET="UTF-8" ']) {
    check(handle(request(undefined, { contentType }), resolver()), 200);
  }
  let calls = 0;
  for (const contentType of [null, "", "text/plain", "application/geo+json", "application/jsonp",
    "application/json; charset=utf-16", "application/json; charset=utf-8; charset=utf-8",
    "application/json; profile=anything", "application/json, text/plain", "application/json;", "application/json\r\n"]) {
    check(handle(request(undefined, { contentType }), { resolve() { calls++; } }), 415,
      { error: "unsupported_media_type" });
  }
  assert.equal(calls, 0);
});

test("body limit uses actual bytes before decoding/parsing, including multibyte and subarray inputs", () => {
  const body = '{"latitude":4,"longitude":3}';
  check(handle(request(body.padEnd(limit, " ")), resolver()), 200);
  let calls = 0;
  for (const oversized of [body.padEnd(limit + 1, " "), "ก".repeat(Math.ceil(limit / 3))]) {
    check(handle(request(oversized), { resolve() { calls++; } }), 413, { error: "request_too_large" });
  }
  const backing = new Uint8Array(limit + 100); backing.set(bytes(body), 40);
  check(handle(request("", { body: backing.subarray(40, 40 + bytes(body).length) }), resolver()), 200);
  assert.equal(calls, 0);
});

test("exceptions and malformed resolver outputs become no-store internal errors", () => {
  const privateResult = { status: "unavailable", reason: "secret authorization detail" };
  for (const core of [{ resolve() { throw new Error("secret body and credentials"); } },
    ...[null, undefined, {}, { status: "unexpected" }, privateResult,
      { status: "resolved" }, { status: "ambiguous", reasons: ["secret"] },
    ].map((result) => ({ resolve: () => result }))]) {
    check(handle(request(), core), 500, { error: "internal_error" });
  }
  const result = resolver().resolve(fromPosition([3, 4]));
  result.unit.nameTh = { private: "secret" };
  check(handle(request(), { resolve: () => result }), 500, { error: "internal_error" });
});

test("allowlisted serialization strips nested extras and detaches all public objects", () => {
  for (const point of [[3, 4], [5, 4], [11, 4]]) {
    const result = resolver().resolve(fromPosition(point));
    const secret = { authorization: "secret", latitude: 4, longitude: 3, geometry: "private" };
    Object.assign(result, secret);
    Object.assign(result.dataset, secret);
    Object.assign(result.dataset.coverage, secret);
    Object.assign(result.dataset.qualification, { reference: "secret" });
    const units = result.unit ? [result.unit] : (result.matches ?? []).map((match) => {
      Object.assign(match, secret); return match.unit;
    });
    for (const unit of units) Object.assign(unit, secret);
    const core = { resolve: () => result };
    const response = handle(request(), core);
    check(response, 200);
    for (const excluded of ["secret", '"latitude":', '"longitude":', '"geometry":', '"activation":', '"authorization":']) {
      assert.equal(JSON.stringify(response).includes(excluded), false);
    }
    const before = plain(response);
    response.body.dataset.coverage.description = "changed";
    response.body.dataset.knownLimitations.push("changed");
    response.body.dataset.qualification.status = "qualified";
    if (response.body.unit) response.body.unit.nameTh = "changed";
    if (response.body.matches) {
      response.body.matches[0].unit.nameTh = "changed";
      response.body.reasons.push("overlap");
    }
    assert.deepEqual(plain(handle(request(), core)), before);
  }
});

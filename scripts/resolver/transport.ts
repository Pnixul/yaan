import type { AdministrativeUnit } from "../../src/lib/administrative-boundary";
import type { AdministrativeResolver, ResolverProvenance } from "../../src/lib/administrative-resolver";
import {
  MAX_ADMINISTRATIVE_REQUEST_BYTES,
  type AdministrativeTransportRequest,
  type AdministrativeTransportResponse,
  type PublicAdministrativeDataset,
} from "../../src/lib/administrative-transport";
import { validCoordinates } from "../../src/lib/location";

// These guards constrain serialization, not geographic interpretation or admission.
function publicText<T extends string>(value: T): T {
  if (typeof value !== "string") throw new Error("Invalid resolver response");
  return value;
}
function publicUnit(unit: AdministrativeUnit): AdministrativeUnit {
  const identity = {
    id: publicText(unit.id), officialCode: publicText(unit.officialCode),
    codeNamespace: publicText(unit.codeNamespace), nameTh: publicText(unit.nameTh),
    ...(unit.nameEn === undefined ? {} : { nameEn: publicText(unit.nameEn) }),
  };
  if (unit.level === "khet") return { ...identity, level: "khet" };
  if (unit.level === "khwaeng") return { ...identity, level: "khwaeng", parentId: publicText(unit.parentId) };
  throw new Error("Invalid resolver response");
}
function publicDataset(data: ResolverProvenance): PublicAdministrativeDataset {
  const status = data.qualification.status;
  const level = data.coverage.level;
  if (!["synthetic", "unqualified", "qualified"].includes(status) ||
    typeof data.official !== "boolean" || !["khwaeng", "khet"].includes(level)) {
    throw new Error("Invalid resolver response");
  }
  return {
    id: publicText(data.id), version: publicText(data.version), publisher: publicText(data.publisher),
    sourceReference: publicText(data.sourceReference), official: data.official,
    qualification: { status }, knownLimitations: data.knownLimitations.map(publicText),
    coverage: { id: publicText(data.coverage.id), description: publicText(data.coverage.description), level },
  };
}

/** Offline only. The resolver is a server-owned dependency, never request data.
 * No acquisition, admission, I/O, logging or HTTP route is implemented here. */
export function handleAdministrativeRequest(
  request: AdministrativeTransportRequest,
  resolver: AdministrativeResolver,
): AdministrativeTransportResponse {
  const headers = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" } as const;
  const invalid = (): AdministrativeTransportResponse => ({
    status: 400, headers, body: { status: "invalid_input", reason: "invalid_coordinates" },
  });
  try {
    if (request.method !== "POST") return {
      status: 405, headers: { ...headers, Allow: "POST" }, body: { error: "method_not_allowed" },
    };
    // Deliberately narrow: JSON, optionally declaring UTF-8, without other parameters.
    if (typeof request.contentType !== "string" || /[\r\n]/u.test(request.contentType) ||
      !/^application\/json(?:[ \t]*;[ \t]*charset=(?:utf-8|"utf-8"))?$/iu.test(request.contentType.trim())) {
      return { status: 415, headers, body: { error: "unsupported_media_type" } };
    }
    if (request.body.byteLength > MAX_ADMINISTRATIVE_REQUEST_BYTES) return {
      status: 413, headers, body: { error: "request_too_large" },
    };
    let input: unknown;
    let body: string;
    try {
      body = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(request.body);
      input = JSON.parse(body);
    } catch { return invalid(); }
    if (!input || typeof input !== "object" || Array.isArray(input) ||
      Object.keys(input).length !== 2 || !Object.hasOwn(input, "latitude") || !Object.hasOwn(input, "longitude") ||
      !("latitude" in input) || !("longitude" in input) || !validCoordinates(input.longitude, input.latitude)) {
      return invalid();
    }
    // A valid flat object with these two numeric values has exactly two colons.
    // Extra colons reveal duplicate JSON members that JSON.parse would overwrite.
    if (body.split(":").length !== 3) return invalid();
    // Pass only named, validated coordinates; never forward the parsed request object.
    const result = resolver.resolve({ latitude: input.latitude, longitude: input.longitude });
    switch (result.status) {
      case "resolved": return { status: 200, headers, body: {
        status: "resolved", unit: publicUnit(result.unit), dataset: publicDataset(result.dataset),
      } };
      case "outside_coverage": return { status: 200, headers, body: {
        status: "outside_coverage", dataset: publicDataset(result.dataset),
      } };
      case "ambiguous": {
        if (typeof result.coverageBoundary !== "boolean" ||
          !result.reasons.length || !result.reasons.every((reason) => reason === "boundary" || reason === "overlap")) {
          throw new Error("Invalid resolver response");
        }
        return { status: 200, headers, body: {
          status: "ambiguous", reasons: [...result.reasons], coverageBoundary: result.coverageBoundary,
          matches: result.matches.map((match) => {
            if (match.relation !== "interior" && match.relation !== "boundary") throw new Error("Invalid resolver response");
            return { unit: publicUnit(match.unit), relation: match.relation };
          }), dataset: publicDataset(result.dataset),
        } };
      }
      case "invalid_input": return invalid();
      case "unavailable":
        switch (result.reason) {
          case "no_dataset": case "provider_error": case "dataset_not_enabled":
          case "invalid_dataset": case "coverage_gap": case "geometry_error":
            return { status: 503, headers, body: { status: "unavailable", reason: result.reason } };
        }
    }
    // Unknown/malformed results are server failures, not missing geographic data.
    throw new Error("Invalid resolver response");
  } catch {
    return { status: 500, headers, body: { error: "internal_error" } };
  }
}

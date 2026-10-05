import "server-only";
import { SEARCH_LIMIT, validCoordinates, type Location } from "./location";

// Geoapify Bangkok city (OSM relation 92277 / TH-10), verified 2026-10-06.
// This provider-side search filter does not import or display boundary geometry.
const BANGKOK_PLACE_ID =
  "513c725aa6951f594059b2e20ade46812b40f00101f9017568010000000000c0020892030742616e676b6f6b";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function text(value: unknown, max = 300): string | undefined {
  return typeof value === "string" &&
    value.trim() &&
    value.length <= max &&
    !/[\u0000-\u001f\u007f]/u.test(value)
    ? value.trim()
    : undefined;
}

export function normalizeGeoapify(value: unknown): Location[] {
  const results = record(value).results;
  if (!Array.isArray(results)) throw new Error("Invalid search response");
  const locations: Location[] = [];
  const seen = new Set<string>();
  for (const item of results) {
    const p = record(item),
      names = record(p.other_names);
    if (p.country_code !== "th" || !validCoordinates(p.lon, p.lat)) continue;
    // Defence against out-of-coverage provider results; never infer from a radius.
    if (
      ![p.city, p.state].some(
        (v) =>
          typeof v === "string" &&
          /^(กรุงเทพมหานคร|กรุงเทพ|Bangkok|Krung Thep Maha Nakhon)$/iu.test(v),
      )
    )
      continue;
    const primary = text(p.name) ?? text(p.address_line1);
    if (!primary) continue;
    // Building other_names can describe its street rather than the building.
    const localName =
      p.result_type !== "building" ? text(names["name:th"]) : undefined;
    const name = localName ?? primary;
    const address = text(p.formatted, 600);
    if (!address) continue;
    const providerId = text(p.place_id, 1000);
    const id = `geoapify:${providerId ?? `${p.lon},${p.lat}:${text(p.result_type, 80) ?? "location"}`}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const suburb = text(p.suburb, 150),
      quarter = text(p.quarter, 150);
    locations.push({
      id,
      name,
      localName:
        localName ?? (/[\u0e00-\u0e7f]/u.test(primary) ? primary : undefined),
      englishName:
        p.result_type !== "building" ? text(names["name:en"]) : undefined,
      address,
      coordinates: [p.lon as number, p.lat as number],
      type: text(p.result_type, 80),
      category: text(p.category, 100),
      // Only label explicit เขต/แขวง values as administrative units.
      // Observed county/district fields can conflict with suburb or describe
      // informal neighbourhoods. Do not promote them to an official district.
      district: suburb?.startsWith("เขต") ? suburb : undefined,
      subdistrict: quarter?.startsWith("แขวง") ? quarter : undefined,
      city: text(p.city, 150),
      province: text(p.state, 150),
      country: text(p.country, 100) ?? "Thailand",
    });
    if (locations.length === SEARCH_LIMIT) break;
  }
  return locations;
}

export async function searchGeoapify(
  query: string,
  apiKey: string,
): Promise<Location[]> {
  // One timeout budget for autocomplete and the optional empty-result fallback.
  const signal = AbortSignal.timeout(8000);
  async function search(endpoint: "autocomplete" | "search") {
    const url = new URL(`https://api.geoapify.com/v1/geocode/${endpoint}`);
    url.search = new URLSearchParams({
      text: query,
      format: "json",
      lang: "th",
      limit: String(SEARCH_LIMIT),
      filter: `place:${BANGKOK_PLACE_ID}`,
      bias: "proximity:100.5018,13.7563",
      apiKey,
    }).toString();
    // Do not persist searches or credential-bearing URLs in Next's fetch cache.
    const response = await fetch(url, { signal, cache: "no-store" });
    if (!response.ok) throw new Error("Search unavailable");
    return normalizeGeoapify(await response.json());
  }
  const results = await search("autocomplete");
  return results.length ? results : search("search");
}

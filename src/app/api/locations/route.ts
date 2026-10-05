import { searchGeoapify } from "@/lib/geoapify";
import {
  MAX_QUERY_LENGTH,
  MIN_QUERY_LENGTH,
  normalizeQuery,
} from "@/lib/location";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const queries = params.getAll("q");
  const error = (status: number) =>
    Response.json(
      { error: "Location search is unavailable. Please try again." },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  if (
    queries.length !== 1 ||
    queries[0].length > MAX_QUERY_LENGTH ||
    /[\u0000-\u0008\u000e-\u001f\u007f]/u.test(queries[0])
  )
    return error(400);
  const query = normalizeQuery(queries[0]);
  if (query.length < MIN_QUERY_LENGTH) return Response.json({ locations: [] });
  const key = process.env.GEOAPIFY_API_KEY;
  if (!key) return error(503);
  try {
    const locations = await searchGeoapify(query, key);
    return Response.json(
      { locations },
      {
        // Short-lived browser cache only; no shared cache of personal searches.
        headers: { "Cache-Control": "private, max-age=60" },
      },
    );
  } catch {
    // Never return or log provider URLs, bodies, exceptions, or credentials.
    return error(502);
  }
}

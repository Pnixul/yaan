import {
  MAX_QUERY_LENGTH,
  MIN_QUERY_LENGTH,
  normalizeQuery,
  type Location,
} from "./location";

export type SearchState = {
  query: string;
  status: "idle" | "loading" | "ready" | "error";
  locations: Location[];
};

// One cancellable lifetime per input value. Cleanup also ignores providers that
// finish after abort, so older responses can never replace current suggestions.
export function requestLocations(
  input: string,
  update: (state: SearchState) => void,
) {
  const query = normalizeQuery(input);
  const controller = new AbortController();
  let cancelled = false;
  const publish = (
    status: SearchState["status"],
    locations: Location[] = [],
  ) => {
    if (!cancelled) update({ query, status, locations });
  };
  if (query.length < MIN_QUERY_LENGTH || query.length > MAX_QUERY_LENGTH) {
    publish("idle");
    return () => {
      cancelled = true;
    };
  }
  const timer = setTimeout(async () => {
    publish("loading");
    try {
      const response = await fetch(
        `/api/locations?q=${encodeURIComponent(query)}`,
        { signal: controller.signal },
      );
      if (!response.ok) throw new Error("Search unavailable");
      const data = await response.json();
      if (!Array.isArray(data.locations))
        throw new Error("Invalid search response");
      publish("ready", data.locations);
    } catch {
      publish("error");
    }
  }, 300);
  return () => {
    cancelled = true;
    clearTimeout(timer);
    controller.abort();
  };
}

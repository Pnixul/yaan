import { initialExploration, type ExplorationState } from "./exploration-state";
import { MOCK_AREAS } from "./mock-locations";
import { CATEGORIES, MOCK_PLACES } from "./mock-places";
import { locationParams, readLocation } from "./location";

type SearchParams = Pick<URLSearchParams, "getAll">;

// Real snapshots and legacy demo links have separate entry paths.
export function exploreEntry(params: SearchParams): ExplorationState {
  function value(key: string) {
    const values = params.getAll(key);
    return values.length === 1 ? values[0] : undefined;
  }
  if (["location", "lat", "lon"].some((key) => params.getAll(key).length)) {
    const location = readLocation(params);
    return {
      ...initialExploration,
      location,
      locationError: !location,
      referenceId: null,
      view: value("view") === "conditions" ? "conditions" : "nearby",
    };
  }
  const place = MOCK_PLACES.find((item) => item.id === value("place"));
  const reference = MOCK_PLACES.find((item) => item.id === value("reference"));
  const area = MOCK_AREAS.find((item) => item.id === value("area"));
  // A selected place determines its area. Never keep a reference in another area.
  const areaId = place?.areaId ?? reference?.areaId ?? area?.id;
  const referenceId = areaId
    ? reference?.areaId === areaId
      ? reference.id
      : null
    : initialExploration.referenceId;
  const category = CATEGORIES.find((item) => item.id === value("category"));
  const conditions = value("view") === "conditions" && !place;
  return {
    ...initialExploration,
    areaId: areaId ?? initialExploration.areaId,
    referenceId,
    placeId: place?.id ?? null,
    category: category?.id ?? "essentials",
    view: conditions ? "conditions" : "nearby",
    routing:
      value("view") === "route" &&
      Boolean(place && referenceId && place.id !== referenceId),
  };
}

export function exploreHref(state: ExplorationState): string {
  if (state.location || state.locationError) {
    const params = state.location
      ? locationParams(state.location)
      : new URLSearchParams({ location: "invalid" });
    if (state.view === "conditions") params.set("view", "conditions");
    return `/explore?${params}`;
  }
  const params = new URLSearchParams({ area: state.areaId });
  if (state.referenceId) params.set("reference", state.referenceId);
  if (state.placeId) params.set("place", state.placeId);
  if (state.category !== "essentials") params.set("category", state.category);
  if (state.routing) params.set("view", "route");
  else if (state.view === "conditions") params.set("view", "conditions");
  return `/explore?${params}`;
}

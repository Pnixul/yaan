import { initialExploration, type ExplorationState } from "./exploration-state";
import { MOCK_AREAS } from "./mock-locations";
import { CATEGORIES, MOCK_PLACES } from "./mock-places";

type SearchParams = Pick<URLSearchParams, "getAll">;

// Only known fixtures and single-valued parameters can select Explore state.
export function exploreEntry(params: SearchParams): ExplorationState {
  function value(key: string) {
    const values = params.getAll(key);
    return values.length === 1 ? values[0] : undefined;
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
  const params = new URLSearchParams({ area: state.areaId });
  if (state.referenceId) params.set("reference", state.referenceId);
  if (state.placeId) params.set("place", state.placeId);
  if (state.category !== "essentials") params.set("category", state.category);
  if (state.routing) params.set("view", "route");
  else if (state.view === "conditions") params.set("view", "conditions");
  return `/explore?${params}`;
}

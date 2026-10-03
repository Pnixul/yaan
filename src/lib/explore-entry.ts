import { explorationReducer, initialExploration } from "./exploration-state";
import { MOCK_AREAS } from "./mock-locations";
import { MOCK_PLACES } from "./mock-places";

// URL values select local fixtures only. An area is never a reference place.
export function exploreEntry(areaId?: string, placeId?: string) {
  const place = MOCK_PLACES.find((item) => item.id === placeId);
  if (place) {
    const area = explorationReducer(initialExploration, {
      type: "area",
      id: place.areaId,
    });
    return explorationReducer(area, { type: "inspect", place });
  }
  if (MOCK_AREAS.some((area) => area.id === areaId)) {
    return explorationReducer(initialExploration, {
      type: "area",
      id: areaId!,
    });
  }
  return initialExploration;
}

import type { Category, MockPlace } from "./mock-places";
import type { MockReport } from "./mock-locations";
import type { Location } from "./location";

export type ExplorationState = {
  location: Location | null;
  locationError: boolean;
  areaId: string;
  referenceId: string | null;
  placeId: string | null;
  category: Category;
  view: "nearby" | "conditions";
  routing: boolean;
  history: boolean;
  report: MockReport | null;
  cameraRevision: number;
};
export const initialExploration: ExplorationState = {
  location: null,
  locationError: false,
  areaId: "ari",
  referenceId: "ari-bts",
  placeId: null,
  category: "essentials",
  view: "nearby",
  routing: false,
  history: false,
  report: null,
  cameraRevision: 0,
};
export type ExplorationAction =
  | { type: "location"; location: Location }
  | { type: "area"; id: string }
  | { type: "inspect" | "reference"; place: MockPlace }
  | { type: "category"; category: Category }
  | { type: "view"; view: ExplorationState["view"] }
  | { type: "route" | "clear-route" | "close-place" }
  | { type: "history"; show: boolean }
  | { type: "report"; report: MockReport };

export function explorationReducer(
  state: ExplorationState,
  action: ExplorationAction,
): ExplorationState {
  // Demo-only actions cannot attach fixtures to a real reference.
  if (
    (state.location || state.locationError) &&
    !["location", "area", "view"].includes(action.type)
  )
    return state;
  switch (action.type) {
    case "location":
      return {
        ...initialExploration,
        location: action.location,
        referenceId: null,
        cameraRevision: state.cameraRevision + 1,
      };
    case "area":
      return {
        ...initialExploration,
        areaId: action.id,
        referenceId: null,
        cameraRevision: state.cameraRevision + 1,
      };
    case "inspect":
      return {
        ...state,
        areaId: action.place.areaId,
        referenceId:
          action.place.areaId === state.areaId ? state.referenceId : null,
        placeId: action.place.id,
        view: "nearby",
        routing: false,
        report: null,
        history: false,
        cameraRevision: state.cameraRevision + 1,
      };
    case "reference":
      return {
        ...initialExploration,
        areaId: action.place.areaId,
        referenceId: action.place.id,
        cameraRevision: state.cameraRevision + 1,
      };
    case "category":
      return {
        ...state,
        category: action.category,
        view: "nearby",
        placeId: null,
        routing: false,
        report: null,
        history: false,
        cameraRevision: state.cameraRevision + 1,
      };
    case "view":
      return {
        ...state,
        view: action.view,
        placeId: null,
        routing: false,
        report: null,
        history: false,
        cameraRevision: state.cameraRevision + 1,
      };
    case "route":
      return {
        ...state,
        routing: Boolean(
          state.referenceId &&
          state.placeId &&
          state.referenceId !== state.placeId,
        ),
      };
    case "clear-route":
      return {
        ...state,
        routing: false,
        cameraRevision: state.cameraRevision + 1,
      };
    case "close-place":
      return {
        ...state,
        placeId: null,
        routing: false,
        cameraRevision: state.cameraRevision + 1,
      };
    case "history":
      return {
        ...state,
        history: action.show,
        report: action.show ? state.report : null,
      };
    case "report":
      return {
        ...state,
        view: "conditions",
        report: action.report,
        history: true,
        routing: false,
        placeId: null,
      };
  }
}

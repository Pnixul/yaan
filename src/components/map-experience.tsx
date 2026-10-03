"use client";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useReducer, useState } from "react";
import { ArrowUpRight, MapPin, X } from "lucide-react";
import { LocationSearch } from "@/components/location-search";
import { LocationResult } from "@/components/location-result";
import { FloodContext } from "@/components/flood-context";
import { NearbyContext } from "@/components/nearby-context";
import { CategoryControls } from "@/components/category-controls";
import { MOCK_AREAS, type MockReport } from "@/lib/mock-locations";
import {
  MOCK_PLACES,
  nearbyPlaces,
  type MockPlace,
  type SearchResult,
} from "@/lib/mock-places";
import { buildMockRoute } from "@/lib/mock-routes";
import {
  explorationReducer,
  initialExploration,
  type ExplorationState,
} from "@/lib/exploration-state";
const NeighborhoodMap = dynamic(() => import("@/components/neighborhood-map"), {
  ssr: false,
  loading: () => (
    <div className="map-loading" role="status">
      <MapPin size={24} />
      <span>Finding our bearings…</span>
    </div>
  ),
});
export function MapExperience({
  initialState = initialExploration,
}: {
  initialState?: ExplorationState;
}) {
  const [state, dispatch] = useReducer(explorationReducer, initialState);
  const [expanded, setExpanded] = useState(Boolean(initialState.placeId));
  const [showReports, setShowReports] = useState(true);
  const area = MOCK_AREAS.find((item) => item.id === state.areaId)!;
  const reference =
    MOCK_PLACES.find((item) => item.id === state.referenceId) ?? null;
  const selected =
    MOCK_PLACES.find((item) => item.id === state.placeId) ?? null;
  const places = useMemo(
    () =>
      reference
        ? nearbyPlaces(area.id, reference.id, state.category)
        : MOCK_PLACES.filter(
            (place) => place.areaId === area.id && place.suggestedReference,
          ),
    [area.id, reference, state.category],
  );
  const mapPlaces = useMemo(
    () =>
      state.view === "conditions"
        ? []
        : state.routing && selected
          ? [selected]
          : selected &&
              selected.id !== reference?.id &&
              !places.some((place) => place.id === selected.id)
            ? [...places, selected]
            : places,
    [state.view, state.routing, selected, reference, places],
  );
  const route = useMemo(
    () => (reference && selected ? buildMockRoute(reference, selected) : null),
    [reference, selected],
  );
  const inspect = useCallback((place: MockPlace) => {
    dispatch({ type: "inspect", place });
    setExpanded(true);
  }, []);
  const openReport = useCallback((report: MockReport) => {
    dispatch({ type: "report", report });
    setExpanded(true);
  }, []);
  function search(result: SearchResult) {
    if (result.kind === "area") {
      dispatch({ type: "area", id: result.id });
      setExpanded(false);
    } else {
      const place = MOCK_PLACES.find((item) => item.id === result.id);
      if (place) inspect(place);
    }
  }
  return (
    <main id="main-content" tabIndex={-1} className="yaan-app">
      <a href="#area-summary" className="skip-link">
        Skip to location details
      </a>
      <div className="explore-layout">
        <LocationResult
          area={area}
          reference={reference}
          expanded={expanded}
          view={state.view}
          contentKey={[
            area.id,
            reference?.id,
            selected?.id,
            state.view,
            state.history,
            state.routing,
          ].join(":")}
          onExpand={() => setExpanded(!expanded)}
          onView={(view) => {
            dispatch({ type: "view", view });
            setExpanded(true);
          }}
          onChangeReference={() => {
            dispatch({ type: "area", id: area.id });
            setExpanded(false);
          }}
        >
          {state.view === "conditions" ? (
            <>
              <div className="condition-heading">
                <span className="eyebrow">Area context</span>
                <h2>Flood history</h2>
                <p>
                  Around {area.name}. Area-level evidence, not a building
                  assessment.
                </p>
              </div>
              <FloodContext
                location={area}
                details={state.history}
                selectedReport={state.report}
                onDetails={(show) => {
                  dispatch({ type: "history", show });
                  setExpanded(true);
                }}
                onReport={openReport}
              />
            </>
          ) : (
            <NearbyContext
              reference={reference}
              selected={selected}
              places={places}
              category={state.category}
              route={route}
              routing={state.routing}
              onSelect={inspect}
              onReference={(place) => {
                dispatch({ type: "reference", place });
                setExpanded(false);
              }}
              onDirections={() => {
                dispatch({ type: "route" });
                setExpanded(false);
              }}
              onClearRoute={() => dispatch({ type: "clear-route" })}
              onClose={() => {
                dispatch({ type: "close-place" });
                setExpanded(false);
              }}
            />
          )}
        </LocationResult>
        <section
          className="map-section"
          aria-label="Explore Bangkok neighbourhoods"
        >
          <NeighborhoodMap
            location={area}
            reference={reference}
            places={mapPlaces}
            selectedPlace={selected}
            route={state.routing ? route : null}
            conditions={state.view === "conditions"}
            selectedReport={state.report}
            showReports={state.view === "conditions" && showReports}
            selection={state.cameraRevision}
            onReport={openReport}
            onPlace={inspect}
          />
          <div className="map-top exploration-map-top">
            <LocationSearch
              onSelect={search}
              onOpen={() => setExpanded(false)}
            />
            {reference && state.view === "nearby" ? (
              <CategoryControls
                selected={state.category}
                onChange={(category) => {
                  dispatch({ type: "category", category });
                  setExpanded(false);
                }}
              />
            ) : (
              <div className="map-intro">
                <span className="eyebrow">
                  {state.view === "conditions"
                    ? "One part of the bigger picture"
                    : "A closer look at Bangkok"}
                </span>
                <p>
                  {state.view === "conditions"
                    ? "The area’s history."
                    : "Where will your day begin?"}
                  <br />
                  <span>
                    {state.view === "conditions"
                      ? "Context, not a prediction."
                      : "Choose a place to explore around."}
                  </span>
                </p>
              </div>
            )}
          </div>
          <div className={`map-legend${state.routing ? " is-route" : ""}`}>
            {state.view === "conditions" ? (
              <>
                <span className="legend-area" />
                <span>Illustrative area</span>
                <span className="legend-divider" />
                <button
                  aria-pressed={showReports}
                  onClick={() => setShowReports(!showReports)}
                >
                  <span
                    className={`legend-dot${showReports ? "" : " is-hidden"}`}
                  />
                  Mock reports{" "}
                  <span className="legend-count">{area.reports.length}</span>
                </button>
              </>
            ) : state.routing && route ? (
              <>
                <span className="legend-route" />
                <span>Mock route · ~{route.walkMinutes} min walk</span>
                <span className="legend-divider" />
                <button
                  aria-label="Clear route preview"
                  onClick={() => dispatch({ type: "clear-route" })}
                >
                  <X size={14} /> Clear
                </button>
              </>
            ) : (
              <>
                <span className="legend-reference" />
                <span>{reference ? "Your reference" : "Sample places"}</span>
                <span className="legend-divider" />
                <span
                  className={state.routing ? "legend-route" : "legend-poi"}
                />
                <span>
                  {state.routing ? "Mock walking route" : "Everyday places"}
                </span>
              </>
            )}
          </div>
          <div className="map-caption">
            <ArrowUpRight size={15} />
            <span>Places, journeys & area context · All sample data</span>
          </div>
        </section>
      </div>
      <div className="sr-only" role="status">
        {reference
          ? `Exploring around ${reference.name}.`
          : `Exploring ${area.name}. Choose a reference place.`}{" "}
        {state.view === "nearby"
          ? `${places.length} sample places.`
          : "Mock flood context."}{" "}
        {state.routing && selected ? `Route preview to ${selected.name}.` : ""}
      </div>
    </main>
  );
}

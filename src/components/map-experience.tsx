"use client";

import { useI18n, Message } from "@/components/i18n";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useExploreNavigation } from "@/lib/use-explore-navigation";
const NeighborhoodMap = dynamic(() => import("@/components/neighborhood-map"), {
  ssr: false,
  loading: () => (
    <div className="map-loading" role="status">
      <MapPin size={24} />
      <span>
        <Message text={"Finding our bearings…"} />
      </span>
    </div>
  ),
});
export function MapExperience() {
  const { t } = useI18n();
  const { state, dispatch, href } = useExploreNavigation();
  const [previousHref, setPreviousHref] = useState(href);
  const [expanded, setExpanded] = useState(
    (Boolean(state.placeId) && !state.routing) || state.view === "conditions",
  );
  if (previousHref !== href) {
    setPreviousHref(href);
    setExpanded(
      (Boolean(state.placeId) && !state.routing) || state.view === "conditions",
    );
  }
  const [showReports, setShowReports] = useState(true);
  const routeHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (
      state.routing &&
      !expanded &&
      window.matchMedia("(max-width: 767px)").matches
    ) {
      routeHeading.current?.focus({ preventScroll: true });
    }
  }, [state.routing, expanded]);
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
  const inspect = useCallback(
    (place: MockPlace) => {
      dispatch({ type: "inspect", place });
      setExpanded(true);
    },
    [dispatch],
  );
  const openReport = useCallback(
    (report: MockReport) => {
      dispatch({ type: "report", report });
      setExpanded(true);
    },
    [dispatch],
  );
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
        {t("Skip to location details")}{" "}
      </a>
      <div className="explore-layout">
        <LocationResult
          area={area}
          reference={reference}
          expanded={expanded}
          mobileRoutePreview={
            state.routing && route && reference && selected ? (
              <>
                <h2 ref={routeHeading} tabIndex={-1}>
                  {t("Walking route")}
                </h2>
                <p>
                  {reference.name} → {selected.name}
                </p>
                <strong>
                  {t("Sample route · ~{minutes} min walk", {
                    minutes: route.walkMinutes,
                  })}
                </strong>
                <p>{t("Illustrative route · Not for navigation")}</p>
                <button
                  className="text-button"
                  onClick={() => dispatch({ type: "clear-route" })}
                >
                  <X size={16} /> {t("Clear route")}
                </button>
              </>
            ) : undefined
          }
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
                <span className="eyebrow">{t("Area context")}</span>
                <h2>{t("Flood history")}</h2>
                <p>
                  {t(
                    "Around {name}. Area-level evidence, not a building assessment.",
                    { name: area.name },
                  )}
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
          aria-label={t("Explore Bangkok neighbourhoods")}
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
                    ? t("One part of the bigger picture")
                    : t("A closer look at Bangkok")}
                </span>
                <p>
                  {state.view === "conditions"
                    ? "The area’s history."
                    : t("Where will your day begin?")}
                  <br />
                  <span>
                    {state.view === "conditions"
                      ? t("Context, not a prediction.")
                      : t("Choose a place to explore around.")}
                  </span>
                </p>
              </div>
            )}
          </div>
          <div className={`map-legend${state.routing ? " is-route" : ""}`}>
            {state.view === "conditions" ? (
              <>
                <span className="legend-area" />
                <span>{t("Illustrative area")}</span>
                <span className="legend-divider" />
                <button
                  aria-pressed={showReports}
                  onClick={() => setShowReports(!showReports)}
                >
                  <span
                    className={`legend-dot${showReports ? "" : " is-hidden"}`}
                  />
                  {t("Mock reports")}{" "}
                  <span className="legend-count">{area.reports.length}</span>
                </button>
              </>
            ) : state.routing && route ? (
              <>
                <span className="legend-route" />
                <span>
                  {t("Sample route · ~{minutes} min walk", {
                    minutes: route.walkMinutes,
                  })}
                </span>
                <span className="legend-divider" />
                <button
                  aria-label={t("Clear route preview")}
                  onClick={() => dispatch({ type: "clear-route" })}
                >
                  <X size={14} /> {t("Clear")}{" "}
                </button>
              </>
            ) : (
              <>
                <span className="legend-reference" />
                <span>
                  {reference ? t("Your reference") : t("Sample places")}
                </span>
                <span className="legend-divider" />
                <span
                  className={state.routing ? "legend-route" : "legend-poi"}
                />
                <span>
                  {state.routing
                    ? t("Mock walking route")
                    : t("Everyday places")}
                </span>
              </>
            )}
          </div>
          <div className="map-caption">
            <ArrowUpRight size={15} />
            <span>
              {t("Places, journeys & area context · All sample data")}
            </span>
          </div>
        </section>
      </div>
      <div className="sr-only" role="status">
        {reference
          ? t("Exploring around {name}", { name: reference.name })
          : t("Exploring {name}. Choose a reference place.", {
              name: area.name,
            })}{" "}
        {state.view === "nearby"
          ? t("{count} sample places.", { count: places.length })
          : t("Mock flood context.")}{" "}
        {state.routing && selected
          ? t("Route preview to {name}.", { name: selected.name })
          : ""}
      </div>
    </main>
  );
}

"use client";

import { useI18n } from "@/components/i18n";

import { useEffect, useRef, useState } from "react";
import {
  AttributionControl,
  LngLatBounds,
  Map,
  Marker,
  setWorkerUrl,
  type GeoJSONSource,
} from "maplibre-gl";
import type { Feature, FeatureCollection, LineString, Polygon } from "geojson";
import {
  Compass,
  LocateFixed,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import { DEMO_MAP_STYLE } from "@/lib/map-config";
import { applyMapTheme, mapColor } from "@/lib/map-theme";
import {
  MOCK_AREAS,
  formatReportDate,
  type MockArea,
  type MockReport,
} from "@/lib/mock-locations";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MockPlace } from "@/lib/mock-places";
import type { MockRoute } from "@/lib/mock-routes";

type Props = {
  location: MockArea;
  reference: MockPlace | null;
  places: MockPlace[];
  selectedPlace: MockPlace | null;
  route: MockRoute | null;
  conditions: boolean;
  onPlace: (place: MockPlace) => void;
  selectedReport: MockReport | null;
  showReports: boolean;
  selection: number;
  onReport: (report: MockReport) => void;
};

export default function NeighborhoodMap({
  location,
  reference,
  places,
  selectedPlace,
  route,
  conditions,
  onPlace,
  selectedReport,
  showReports,
  selection,
  onReport,
}: Props) {
  const { t, language } = useI18n();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const loadedMap = useRef<Map | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [ready, setReady] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!container.current) return;
    const mapContainer = container.current;
    mapContainer.dataset.themed = "false";
    let styleReady = false;
    let map: Map | undefined;
    let observer: ResizeObserver | undefined;
    let themeObserver: MutationObserver | undefined;
    const timeout = window.setTimeout(() => setStatus("error"), 20000);
    try {
      setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
      map = new Map({
        container: container.current,
        style: DEMO_MAP_STYLE,
        center: MOCK_AREAS.find((area) => area.id === "ari")!.coordinates,
        zoom: container.current.clientWidth < 600 ? 13.65 : 14.4,
        minZoom: 10,
        maxZoom: 18,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
      });
      mapRef.current = map;
      // Paint before revealing the canvas. Theme changes never replace the
      // style or remount the map, preserving camera and exploration state.
      const themeMap = () => {
        if (!styleReady || !map?.getStyle()?.layers) return;
        applyMapTheme(map);
      };
      map.on("style.load", () => {
        styleReady = true;
        themeMap();
        mapContainer.dataset.themed = "true";
      });
      themeObserver = new MutationObserver(themeMap);
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
      map.addControl(new AttributionControl({ compact: true }), "bottom-right");
      map.on("load", () => {
        loadedMap.current = map ?? null;
        window.clearTimeout(timeout);
        setStatus("ready");
        setReady((value) => value + 1);
      });
      map.on("error", () => {
        window.clearTimeout(timeout);
        setStatus("error");
      });
      observer = new ResizeObserver(() => map?.resize());
      observer.observe(container.current);
    } catch {
      window.clearTimeout(timeout);
      // Defer the browser capability error out of the synchronous effect.
      queueMicrotask(() => setStatus("error"));
    }
    return () => {
      window.clearTimeout(timeout);
      observer?.disconnect();
      themeObserver?.disconnect();
      map?.remove();
      mapRef.current = null;
      loadedMap.current = null;
    };
  }, [attempt]);

  useEffect(() => {
    mapRef.current
      ?.getCanvas()
      .setAttribute(
        "aria-label",
        t("Bangkok map. Use arrow keys to pan and plus or minus to zoom."),
      );
  }, [ready, attempt, t]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map?.getStyle()?.layers) return;
    const area: Feature<Polygon> = {
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [location.illustration] },
    };
    const source = map.getSource("illustrative-area") as
      GeoJSONSource | undefined;
    if (source) source.setData(area);
    else {
      map.addSource("illustrative-area", { type: "geojson", data: area });
      map.addLayer({
        id: "area-fill",
        type: "fill",
        source: "illustrative-area",
        paint: { "fill-color": mapColor("map-area"), "fill-opacity": 0.08 },
      });
      map.addLayer({
        id: "area-border",
        type: "line",
        source: "illustrative-area",
        paint: {
          "line-color": mapColor("map-area"),
          "line-width": 1.5,
          "line-opacity": 0.55,
          "line-dasharray": [3, 3],
        },
      });
    }
    map.setLayoutProperty(
      "area-fill",
      "visibility",
      conditions ? "visible" : "none",
    );
    map.setLayoutProperty(
      "area-border",
      "visibility",
      conditions ? "visible" : "none",
    );
  }, [ready, location, conditions]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !reference) return;
    const selected = document.createElement("div");
    selected.className = "place-marker";
    const pin = document.createElement("span");
    pin.className = "place-marker-pin";
    const label = document.createElement("span");
    label.className = "place-marker-label";
    label.textContent = t("Your reference");
    selected.append(pin, label);
    selected.setAttribute("role", "img");
    selected.setAttribute(
      "aria-label",
      t("Reference location: {name}", { name: reference.name }),
    );
    const marker = new Marker({
      element: selected,
      anchor: "bottom",
      offset: [0, -6],
    })
      .setLngLat(reference.coordinates)
      .addTo(map);
    return () => {
      marker.remove();
    };
  }, [ready, reference, t]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const markers: Marker[] = [];
    if (showReports) {
      for (const report of location.reports) {
        const element = document.createElement("button");
        element.type = "button";
        element.className = "report-marker";
        element.dataset.reportId = report.id;
        element.setAttribute(
          "aria-label",
          t("View sample report: {street}, {date}", {
            street: report.street,
            date: formatReportDate(report.date, language),
          }),
        );
        element.title = `${t("Mock report")} · ${report.street}`;
        element.addEventListener("click", () => onReport(report));
        const dot = document.createElement("span");
        element.append(dot);
        markers.push(
          new Marker({ element }).setLngLat(report.coordinates).addTo(map),
        );
      }
    }
    return () => markers.forEach((marker) => marker.remove());
  }, [ready, location, showReports, onReport, t, language]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const markers = places.map((place, index) => {
      const element = document.createElement("button");
      element.className = "poi-marker";
      element.type = "button";
      element.dataset.placeId = place.id;
      element.setAttribute(
        "aria-label",
        t("Explore {name}", { name: place.name }),
      );
      element.title = place.name;
      const pin = document.createElement("span");
      pin.className = "poi-marker-pin";
      pin.textContent = String(index + 1);
      const label = document.createElement("span");
      label.className = "poi-marker-label";
      label.textContent = place.name;
      element.append(pin, label);
      element.addEventListener("click", () => onPlace(place));
      return new Marker({ element }).setLngLat(place.coordinates).addTo(map);
    });
    return () => markers.forEach((marker) => marker.remove());
  }, [ready, places, onPlace, t]);

  useEffect(() => {
    mapRef.current
      ?.getContainer()
      .querySelectorAll<HTMLButtonElement>(".poi-marker")
      .forEach((marker) => {
        const selected = marker.dataset.placeId === selectedPlace?.id;
        marker.classList.toggle("is-selected", selected);
        marker.setAttribute("aria-pressed", String(selected));
      });
  }, [ready, places, selectedPlace, t]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map?.getStyle()?.layers) return;
    const data: FeatureCollection<LineString> = {
      type: "FeatureCollection",
      features: route
        ? [
            {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: route.coordinates },
            },
          ]
        : [],
    };
    const source = map.getSource("mock-route") as GeoJSONSource | undefined;
    if (source) source.setData(data);
    else {
      map.addSource("mock-route", { type: "geojson", data });
      map.addLayer({
        id: "route-casing",
        type: "line",
        source: "mock-route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": mapColor("map-route-casing"), "line-width": 8 },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "mock-route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": mapColor("map-route"), "line-width": 4 },
      });
    }
  }, [ready, route]);

  useEffect(() => {
    mapRef.current
      ?.getContainer()
      .querySelectorAll<HTMLButtonElement>(".report-marker")
      .forEach((marker) => {
        const selected = marker.dataset.reportId === selectedReport?.id;
        marker.classList.toggle("is-selected", selected);
        marker.setAttribute("aria-pressed", String(selected));
      });
  }, [ready, location, showReports, selectedReport, t, language]);

  useEffect(() => {
    const map = mapRef.current;
    // A new map can briefly coexist with the previous ready counter during
    // retry or Fast Refresh. Fit only a loaded map with a usable viewport.
    if (!ready || !map || loadedMap.current !== map) return;
    const width = container.current?.clientWidth ?? 0;
    const height = container.current?.clientHeight ?? 0;
    if (width < 1 || height < 1) return;
    const points =
      route?.coordinates ??
      (conditions
        ? location.illustration
        : [
            ...(reference ? [reference.coordinates] : []),
            ...places.map((place) => place.coordinates),
          ]);
    const bounds = new LngLatBounds();
    points.forEach((point) => bounds.extend(point));
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? 0
      : 550;
    if (points.length > 1) {
      const small = height < 500;
      map.fitBounds(bounds, {
        padding: {
          top: small ? Math.min(reference ? 160 : 115, height * 0.43) : 190,
          bottom: small ? Math.min(140, height * 0.34) : 125,
          left: Math.min(55, width * 0.15),
          right: Math.min(75, width * 0.2),
        },
        maxZoom: 16,
        duration,
      });
    } else
      mapRef.current?.easeTo({
        center: reference?.coordinates ?? location.coordinates,
        zoom: 14.4,
        duration,
      });
  }, [location, reference, places, conditions, route, selection, ready]);

  function recenter() {
    mapRef.current?.easeTo({
      center: reference?.coordinates ?? location.coordinates,
      zoom: (container.current?.clientWidth ?? 0) < 600 ? 13.65 : 14.4,
      bearing: 0,
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 450,
    });
  }

  return (
    <>
      <div ref={container} className="map-canvas" />
      {status !== "ready" && (
        <div className="map-state" role="status">
          {status === "loading" ? (
            <>
              <MapPin size={22} />
              <span>{t("Getting the neighbourhood ready…")}</span>
            </>
          ) : (
            <>
              <span>
                {t(
                  "Map unavailable. You can still explore the sample overview.",
                )}{" "}
              </span>
              <button
                onClick={() => {
                  setStatus("loading");
                  setAttempt((value) => value + 1);
                }}
              >
                <RotateCcw size={15} /> {t("Retry map")}{" "}
              </button>
            </>
          )}
        </div>
      )}
      <div className="map-controls" role="group" aria-label={t("Map controls")}>
        <span className="north-indicator" title={t("North")}>
          <span>N</span>
          <Compass size={24} strokeWidth={1.3} />
        </span>
        <div className="zoom-controls">
          <button
            aria-label={t("Zoom in")}
            title={t("Zoom in")}
            disabled={status !== "ready"}
            onClick={() => mapRef.current?.zoomIn({ duration: 0 })}
          >
            <Plus size={20} />
          </button>
          <button
            aria-label={t("Zoom out")}
            title={t("Zoom out")}
            disabled={status !== "ready"}
            onClick={() => mapRef.current?.zoomOut({ duration: 0 })}
          >
            <Minus size={20} />
          </button>
        </div>
        <button
          className="recenter-control"
          aria-label={t("Recenter on {name}", {
            name: reference?.name ?? location.name,
          })}
          title={t("Recenter on {name}", {
            name: reference?.name ?? location.name,
          })}
          disabled={status !== "ready"}
          onClick={recenter}
        >
          <LocateFixed size={20} />
        </button>
      </div>
      {selectedReport && (
        <div className="map-report-label">
          <span className="legend-dot" />
          <span>
            <strong>{selectedReport.street}</strong>
            <small>
              {formatReportDate(selectedReport.date, language)} ·{" "}
              {t("Fictional report")}
            </small>
          </span>
        </div>
      )}
    </>
  );
}

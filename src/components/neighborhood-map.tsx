"use client";

import { useEffect, useRef, useState } from "react";
import {
  AttributionControl,
  Map,
  Marker,
  setWorkerUrl,
  type GeoJSONSource,
} from "maplibre-gl";
import type { Feature, Polygon } from "geojson";
import {
  Compass,
  LocateFixed,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import { DEMO_MAP_STYLE } from "@/lib/map-config";
import {
  MOCK_LOCATIONS,
  formatReportDate,
  type MockLocation,
  type MockReport,
} from "@/lib/mock-locations";
import "maplibre-gl/dist/maplibre-gl.css";

type Props = {
  location: MockLocation;
  selectedReport: MockReport | null;
  showReports: boolean;
  selection: number;
  onReport: (report: MockReport) => void;
};

export default function NeighborhoodMap({
  location,
  selectedReport,
  showReports,
  selection,
  onReport,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [ready, setReady] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!container.current) return;
    let map: Map | undefined;
    let observer: ResizeObserver | undefined;
    const timeout = window.setTimeout(() => setStatus("error"), 20000);
    try {
      setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
      map = new Map({
        container: container.current,
        style: DEMO_MAP_STYLE,
        center: MOCK_LOCATIONS[0].coordinates,
        zoom: container.current.clientWidth < 600 ? 13.65 : 14.4,
        minZoom: 10,
        maxZoom: 18,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
      });
      mapRef.current = map;
      map.addControl(new AttributionControl({ compact: true }), "bottom-right");
      map
        .getCanvas()
        .setAttribute(
          "aria-label",
          "Bangkok map. Use arrow keys to pan and plus or minus to zoom.",
        );
      map.on("load", () => {
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
      map?.remove();
      mapRef.current = null;
    };
  }, [attempt]);

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
        paint: { "fill-color": "#347a80", "fill-opacity": 0.08 },
      });
      map.addLayer({
        id: "area-border",
        type: "line",
        source: "illustrative-area",
        paint: {
          "line-color": "#38787d",
          "line-width": 1.5,
          "line-opacity": 0.55,
          "line-dasharray": [3, 3],
        },
      });
    }
    const selected = document.createElement("div");
    selected.className = "place-marker";
    const pin = document.createElement("span");
    pin.className = "place-marker-pin";
    const label = document.createElement("span");
    label.className = "place-marker-label";
    label.textContent = location.name;
    selected.append(pin, label);
    selected.setAttribute("role", "img");
    selected.setAttribute("aria-label", `Selected place: ${location.place}`);
    const markers = [
      new Marker({ element: selected, anchor: "bottom", offset: [0, -6] })
        .setLngLat(location.coordinates)
        .addTo(map),
    ];
    if (showReports) {
      for (const report of location.reports) {
        const element = document.createElement("button");
        element.type = "button";
        element.className = "report-marker";
        element.dataset.reportId = report.id;
        element.setAttribute(
          "aria-label",
          `View mock report: ${report.street}, ${formatReportDate(report.date)}`,
        );
        element.title = `Mock report · ${report.street}`;
        element.addEventListener("click", () => onReport(report));
        const dot = document.createElement("span");
        element.append(dot);
        markers.push(
          new Marker({ element }).setLngLat(report.coordinates).addTo(map),
        );
      }
    }
    return () => markers.forEach((marker) => marker.remove());
  }, [ready, location, showReports, onReport]);

  useEffect(() => {
    mapRef.current
      ?.getContainer()
      .querySelectorAll<HTMLButtonElement>(".report-marker")
      .forEach((marker) => {
        const selected = marker.dataset.reportId === selectedReport?.id;
        marker.classList.toggle("is-selected", selected);
        marker.setAttribute("aria-pressed", String(selected));
      });
  }, [ready, location, showReports, selectedReport]);

  useEffect(() => {
    if (!ready) return;
    mapRef.current?.easeTo({
      center: location.coordinates,
      zoom: (container.current?.clientWidth ?? 0) < 600 ? 13.65 : 14.4,
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 650,
    });
  }, [location, selection, ready]);

  function recenter() {
    mapRef.current?.easeTo({
      center: location.coordinates,
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
              <span>Getting the neighbourhood ready…</span>
            </>
          ) : (
            <>
              <span>
                Map unavailable. You can still explore the sample overview.
              </span>
              <button
                onClick={() => {
                  setStatus("loading");
                  setAttempt((value) => value + 1);
                }}
              >
                <RotateCcw size={15} /> Retry map
              </button>
            </>
          )}
        </div>
      )}
      <div className="map-controls" role="group" aria-label="Map controls">
        <span className="north-indicator" title="North">
          <span>N</span>
          <Compass size={24} strokeWidth={1.3} />
        </span>
        <div className="zoom-controls">
          <button
            aria-label="Zoom in"
            title="Zoom in"
            disabled={status !== "ready"}
            onClick={() => mapRef.current?.zoomIn({ duration: 0 })}
          >
            <Plus size={20} />
          </button>
          <button
            aria-label="Zoom out"
            title="Zoom out"
            disabled={status !== "ready"}
            onClick={() => mapRef.current?.zoomOut({ duration: 0 })}
          >
            <Minus size={20} />
          </button>
        </div>
        <button
          className="recenter-control"
          aria-label={`Recenter on ${location.name}`}
          title={`Recenter on ${location.name}`}
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
              {formatReportDate(selectedReport.date)} · Fictional report
            </small>
          </span>
        </div>
      )}
    </>
  );
}

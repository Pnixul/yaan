"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowUpRight, FlaskConical, MapPin, Waves } from "lucide-react";
import { LocationSearch } from "@/components/location-search";
import { LocationResult } from "@/components/location-result";
import {
  MOCK_LOCATIONS,
  type MockLocation,
  type MockReport,
} from "@/lib/mock-locations";

const NeighborhoodMap = dynamic(() => import("@/components/neighborhood-map"), {
  ssr: false,
  loading: () => (
    <div className="map-loading" role="status">
      <MapPin size={24} />
      <span>Finding our bearings…</span>
    </div>
  ),
});

export function MapExperience() {
  const [location, setLocation] = useState(MOCK_LOCATIONS[0]);
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails] = useState(false);
  const [selectedReport, setSelectedReport] = useState<MockReport | null>(null);
  const [showReports, setShowReports] = useState(true);
  const [selection, setSelection] = useState(0);

  function select(location: MockLocation) {
    setLocation(location);
    setSelectedReport(null);
    setDetails(false);
    setExpanded(false);
    setSelection((value) => value + 1);
  }

  const openReport = useCallback((report: MockReport) => {
    setSelectedReport(report);
    setDetails(true);
    setExpanded(true);
  }, []);

  return (
    <main className="yaan-app">
      <a href="#area-summary" className="skip-link">
        Skip to area summary
      </a>
      <header className="app-header">
        <Link className="brand" href="/" aria-label="YAAN home">
          <span className="brand-icon">
            <Waves size={23} strokeWidth={1.8} />
          </span>
          <span>
            yaan<span className="brand-period">.</span>
          </span>
        </Link>
        <span className="brand-tagline">Every place has a story.</span>
        <div className="header-right">
          <span className="city-label">
            <MapPin size={14} /> Bangkok, Thailand
          </span>
          <span className="prototype-badge">
            <FlaskConical size={14} />
            <span>Visual prototype</span>
          </span>
        </div>
      </header>
      <div className="explore-layout">
        <LocationResult
          key={location.id}
          location={location}
          expanded={expanded}
          details={details}
          selectedReport={selectedReport}
          onExpand={() => {
            setExpanded(!expanded);
            if (expanded) setDetails(false);
          }}
          onDetails={(show) => {
            setDetails(show);
            if (show) setExpanded(true);
          }}
          onReport={openReport}
        />
        <section
          className="map-section"
          aria-label="Explore Bangkok neighbourhoods"
        >
          <NeighborhoodMap
            location={location}
            selectedReport={selectedReport}
            showReports={showReports}
            selection={selection}
            onReport={openReport}
          />
          <div className="map-top">
            <LocationSearch
              onSelect={select}
              onOpen={() => {
                setExpanded(false);
                setDetails(false);
              }}
            />
            <div className="map-intro">
              <span className="eyebrow">A closer look at Bangkok</span>
              <p>
                Find a place.
                <br />
                <span>Get to know its surroundings.</span>
              </p>
            </div>
          </div>
          <div className="map-legend">
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
              Mock reports
              <span className="legend-count">{location.reports.length}</span>
            </button>
          </div>
          <div className="map-caption">
            <ArrowUpRight size={15} />
            <span>Explore freely. Start with a neighbourhood.</span>
          </div>
        </section>
      </div>
      <div className="sr-only" role="status">
        Selected {location.name}, {location.district}. {location.category}. Mock
        data only.
      </div>
    </main>
  );
}

"use client";
import {
  ChevronDown,
  ChevronUp,
  CloudRain,
  Compass,
  LocateFixed,
  MapPin,
} from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { MockArea } from "@/lib/mock-locations";
import type { MockPlace } from "@/lib/mock-places";
type Props = {
  area: MockArea;
  reference: MockPlace | null;
  expanded: boolean;
  view: "nearby" | "conditions";
  contentKey: string;
  onExpand: () => void;
  onView: (view: "nearby" | "conditions") => void;
  onChangeReference: () => void;
  children: ReactNode;
};
export function LocationResult({
  area,
  reference,
  expanded,
  view,
  contentKey,
  onExpand,
  onView,
  onChangeReference,
  children,
}: Props) {
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroll.current?.scrollTo({ top: 0 });
  }, [contentKey]);
  return (
    <aside
      className={cn(
        "result-panel exploration-panel",
        expanded && "is-expanded",
      )}
      aria-label={
        reference
          ? `Exploring around ${reference.name}`
          : `Explore ${area.name}`
      }
    >
      <button
        className="sheet-handle"
        onClick={onExpand}
        aria-expanded={expanded}
        aria-controls="area-summary"
        aria-label={
          expanded ? "Collapse location details" : "Expand location details"
        }
      >
        <span />
        {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>
      <div
        ref={scroll}
        className="panel-scroll"
        id="area-summary"
        tabIndex={-1}
      >
        <div className="panel-topline">
          <span className="eyebrow">
            {reference ? "Your reference location" : "Explore a neighbourhood"}
          </span>
          <span className="sample-tag">Mock data</span>
        </div>
        <div
          className={cn("location-heading", reference && "reference-heading")}
        >
          <div>
            <p className="location-district">
              <MapPin size={13} />
              {area.district}, Bangkok
            </p>
            <h1>{reference?.name ?? area.name}</h1>
            <p className="area-subtitle">
              {area.name} <span lang="th">{area.thaiName}</span>
            </p>
          </div>
        </div>
        {reference ? (
          <div className="reference-strip">
            <LocateFixed size={16} />
            <span>Exploring from here</span>
            <button onClick={onChangeReference}>Change</button>
          </div>
        ) : (
          <p className="area-select-hint">
            {view === "nearby"
              ? "Pick a place on the map or below."
              : "Choose a starting point in Places."}
          </p>
        )}
        <div
          className="context-switch"
          role="group"
          aria-label="Location context"
        >
          <button
            aria-pressed={view === "nearby"}
            onClick={() => onView("nearby")}
          >
            <Compass size={16} />
            {reference ? "Nearby" : "Places"}
          </button>
          <button
            aria-pressed={view === "conditions"}
            onClick={() => onView("conditions")}
          >
            <CloudRain size={16} />
            Area context
          </button>
        </div>
        {children}
        <footer className="panel-footer">
          <span className="footer-mark">ย่าน</span>
          <span>A little context. A better sense of place.</span>
        </footer>
      </div>
    </aside>
  );
}

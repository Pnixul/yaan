"use client";

import { useI18n } from "@/components/i18n";

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
import type { Location } from "@/lib/location";
type Props = {
  area: MockArea | null;
  reference: Pick<Location, "name"> | null;
  realLocation?: Location | null;
  expanded: boolean;
  view: "nearby" | "conditions";
  contentKey: string;
  onExpand: () => void;
  onView: (view: "nearby" | "conditions") => void;
  onChangeReference: () => void;
  children: ReactNode;
  mobileRoutePreview?: ReactNode;
};
export function LocationResult({
  area,
  reference,
  realLocation,
  expanded,
  view,
  contentKey,
  onExpand,
  onView,
  onChangeReference,
  children,
  mobileRoutePreview,
}: Props) {
  const { t } = useI18n();
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
          ? t("Exploring around {name}", { name: reference.name })
          : t("Explore {name}", { name: area?.name ?? t("Bangkok") })
      }
    >
      <button
        className="sheet-handle"
        onClick={onExpand}
        aria-expanded={expanded}
        aria-controls="area-summary"
        aria-label={
          expanded
            ? t("Collapse location details")
            : t("Expand location details")
        }
      >
        <span className="sheet-grip" aria-hidden="true" />
        <span className="sheet-label">
          {t(expanded ? "Show map" : "Show details")}
        </span>
        {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>
      {mobileRoutePreview && (
        <div className="mobile-route-preview">{mobileRoutePreview}</div>
      )}
      <div
        ref={scroll}
        className="panel-scroll"
        id="area-summary"
        tabIndex={-1}
      >
        <div className="panel-topline">
          <span className="eyebrow">
            {reference
              ? t("Your reference location")
              : t("Explore a neighbourhood")}
          </span>
          <span className="sample-tag">
            {area ? t("Mock data") : "Geoapify"}
          </span>
        </div>
        <div
          className={cn("location-heading", reference && "reference-heading")}
        >
          <div>
            <p className="location-district">
              <MapPin size={13} />
              {[
                realLocation?.subdistrict,
                realLocation?.district ?? area?.district,
                t("Bangkok"),
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
            <h1>{reference?.name ?? area?.name ?? t("Choose a location")}</h1>
            <p className="area-subtitle">
              {realLocation ? (
                realLocation.address
              ) : (
                <>
                  {area?.name} <span lang="th">{area?.thaiName}</span>
                </>
              )}
            </p>
          </div>
        </div>
        {reference ? (
          <div className="reference-strip">
            <LocateFixed size={16} />
            <span>{t("Exploring from here")}</span>
            <button onClick={onChangeReference}>{t("Change")}</button>
          </div>
        ) : area ? (
          <p className="area-select-hint">
            {view === "nearby"
              ? t("Pick a place on the map or below.")
              : t("Choose a starting point in Places.")}
          </p>
        ) : null}
        <div
          className="context-switch"
          role="group"
          aria-label={t("Location context")}
        >
          <button
            aria-pressed={view === "nearby"}
            onClick={() => onView("nearby")}
          >
            <Compass size={16} />
            {reference ? t("Nearby") : t("Places")}
          </button>
          <button
            aria-pressed={view === "conditions"}
            onClick={() => onView("conditions")}
          >
            <CloudRain size={16} />
            {t("Area context")}{" "}
          </button>
        </div>
        {children}
        <footer className="panel-footer">
          <span className="footer-mark">ย่าน</span>
          <span>{t("A little context. A better sense of place.")}</span>
        </footer>
      </div>
    </aside>
  );
}

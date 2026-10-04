"use client";

import { useI18n } from "@/components/i18n";

import {
  ArrowLeft,
  ArrowRight,
  Car,
  Footprints,
  MapPin,
  Navigation,
  Route,
  X,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { categoryIcons } from "@/components/category-controls";
import { SavePlaceButton } from "@/components/save-place-button";
import {
  categoryLabel,
  CATEGORIES,
  type Category,
  type MockPlace,
} from "@/lib/mock-places";
import {
  buildMockRoute,
  formatDistance,
  type MockRoute,
} from "@/lib/mock-routes";

type Props = {
  reference: MockPlace | null;
  selected: MockPlace | null;
  places: MockPlace[];
  category: Category;
  route: MockRoute | null;
  routing: boolean;
  onSelect: (place: MockPlace) => void;
  onReference: (place: MockPlace) => void;
  onDirections: () => void;
  onClearRoute: () => void;
  onClose: () => void;
};

export function NearbyContext({
  reference,
  selected,
  places,
  category,
  route,
  routing,
  onSelect,
  onReference,
  onDirections,
  onClearRoute,
  onClose,
}: Props) {
  const { t, language } = useI18n();
  const title = useRef<HTMLHeadingElement>(null);
  const previousSelection = useRef(selected);
  useEffect(() => {
    if (selected || previousSelection.current)
      title.current?.focus({ preventScroll: true });
    previousSelection.current = selected;
  }, [selected, routing]);
  if (selected) {
    const Icon = categoryIcons[selected.category];
    const isReference = selected.id === reference?.id;
    return (
      <section className="nearby-detail">
        <div className="place-detail-toolbar">
          <button className="text-button" onClick={onClose}>
            <ArrowLeft size={16} />
            {reference ? t("Back to nearby") : t("Back to area")}
          </button>
          <SavePlaceButton key={selected.id} place={selected} />
        </div>
        <div className="place-detail-category">
          <Icon size={20} />
          <span>{t(categoryLabel(selected.category))}</span>
          <span className="sample-tag">{t("Sample place")}</span>
        </div>
        <h2 ref={title} tabIndex={-1}>
          {routing ? t("Walking route") : selected.name}
        </h2>
        {!routing && (
          <p className="place-description">{t(selected.description)}</p>
        )}
        {route && reference && (
          <>
            <div className="journey-endpoints">
              <span>
                <i />
                {reference.name}
                <small>{t("Your reference location")}</small>
              </span>
              <span>
                <MapPin size={15} />
                {selected.name}
                <small>{t("Destination")}</small>
              </span>
            </div>
            <div className="journey-stats">
              <div>
                <Footprints size={19} />
                <strong>
                  ~{route.walkMinutes}
                  <small> {t("min walk")}</small>
                </strong>
                <span>
                  {formatDistance(route.meters, language)} · {t("Sample route")}
                </span>
              </div>
              <div>
                <Car size={19} />
                <strong>
                  ~{route.driveMinutes}
                  <small> {t("min drive")}</small>
                </strong>
                <span>{t("Illustrative · No traffic data")}</span>
              </div>
            </div>
            {routing ? (
              <div className="route-active">
                <span>
                  <Route size={16} /> {t("Walking route preview")}{" "}
                </span>
                <button className="text-button" onClick={onClearRoute}>
                  <X size={16} /> {t("Clear route")}{" "}
                </button>
              </div>
            ) : (
              <button className="primary-button" onClick={onDirections}>
                <span>
                  <Navigation size={17} /> {t("Directions")}{" "}
                </span>
                <ArrowRight size={17} />
              </button>
            )}
            <p className="journey-disclaimer">
              {t(
                "Mock route and approximate times. Paths and access are unverified; this preview is not navigation guidance.",
              )}{" "}
            </p>
          </>
        )}
        {!isReference && (
          <button
            className={
              reference
                ? "secondary-button reference-action"
                : "primary-button reference-action"
            }
            onClick={() => onReference(selected)}
          >
            <MapPin size={17} /> {t("Explore around this place")}{" "}
            <ArrowRight size={16} />
          </button>
        )}
        {isReference && (
          <p className="reference-confirmation">
            <MapPin size={16} /> {t("You’re exploring around this place.")}{" "}
          </p>
        )}
      </section>
    );
  }
  return (
    <section
      className="nearby-overview"
      aria-label={
        reference
          ? t("Nearby everyday places")
          : t("Choose a reference location")
      }
    >
      <div className="nearby-section-heading">
        <div>
          <span className="eyebrow">
            {reference
              ? t("Your everyday surroundings")
              : t("Start with a place")}
          </span>
          <h2 ref={title} tabIndex={-1}>
            {reference
              ? t(
                  CATEGORIES.find((item) => item.id === category)?.label ??
                    "Essentials",
                )
              : t("Where will your day begin?")}
          </h2>
        </div>
        <span className="nearby-count">
          {places.length.toString().padStart(2, "0")}
        </span>
      </div>
      <p className="nearby-intro">
        {reference
          ? t("A few useful places, measured from your starting point.")
          : t(
              "Choose a station, workplace, home, or campus as your reference.",
            )}
      </p>
      <ul className="nearby-list">
        {places.map((place) => {
          const Icon = categoryIcons[place.category];
          const journey = reference ? buildMockRoute(reference, place) : null;
          return (
            <li key={place.id}>
              <button onClick={() => onSelect(place)}>
                <span className="nearby-list-icon">
                  <Icon size={18} />
                </span>
                <span className="nearby-list-name">
                  <strong>{place.name}</strong>
                  <small>
                    {t(categoryLabel(place.category))}
                    {journey &&
                      ` · ${formatDistance(journey.meters, language)}`}
                  </small>
                </span>
                <span className="nearby-list-time">
                  {journey ? (
                    <>
                      <Footprints size={14} />~{journey.walkMinutes}{" "}
                      {t("min")}{" "}
                    </>
                  ) : (
                    <ArrowRight size={16} />
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {!places.length && (
        <p className="empty-reports">
          {t(
            "No other places in this sample category. Try another category; this is not a complete directory.",
          )}{" "}
        </p>
      )}
      <p className="nearby-footnote">
        {reference
          ? t(
              "Distances and times follow illustrative routes. Sample places only.",
            )
          : t("These are sample locations, not listings or recommendations.")}
      </p>
    </section>
  );
}

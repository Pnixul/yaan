"use client";

import { useI18n } from "@/components/i18n";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BookmarkMinus,
} from "lucide-react";
import { useRef, useState } from "react";
import { categoryIcons } from "@/components/category-controls";
import { MOCK_AREAS } from "@/lib/mock-locations";
import { MOCK_PLACES, categoryLabel } from "@/lib/mock-places";
import { useSavedPlaces } from "@/lib/saved-places";

export function SavedPlaces() {
  const { t } = useI18n();
  const { ids, ready, mode, pending, error, remove, reload } = useSavedPlaces();
  const [announcement, setAnnouncement] = useState("");
  const list = useRef<HTMLUListElement>(null);
  const emptyHeading = useRef<HTMLHeadingElement>(null);
  const places = ids.flatMap(
    (id) => MOCK_PLACES.find((place) => place.id === id) ?? [],
  );

  return (
    <main id="main-content" tabIndex={-1} className="saved-page">
      <header className="saved-heading">
        <p className="eyebrow">
          {t("Your places")} {mode === "account" ? t("· Your account") : ""}
        </p>
        <h1>{t("Saved places")}</h1>
        <p>{t("A few places to come back to.")}</p>
      </header>
      <p className="saved-storage-note" role="status">
        {error && !ready
          ? t("Saved places are unavailable.")
          : !ready
            ? t("Loading saved places…")
            : mode === "account"
              ? t("Saved to your account. Available whenever you sign in.")
              : t("Sign in to access your saved places.")}
      </p>
      {mode === "signed-out" && (
        <section className="saved-empty" aria-labelledby="saved-signin-title">
          <Bookmark size={28} strokeWidth={1.5} aria-hidden="true" />
          <h2 id="saved-signin-title">{t("Keep your places together.")}</h2>
          <p>
            {t(
              "Sign in or create an account to save places and find them again on any device.",
            )}{" "}
          </p>
          <Link className="primary-button" href="/account?next=/saved">
            {t("Sign in or create account")} <ArrowRight size={18} />
          </Link>
          <Link className="home-explore-link" href="/explore">
            {t("Continue exploring")} <ArrowRight size={18} />
          </Link>
        </section>
      )}
      {error && (
        <div className="saved-storage-note" role="alert">
          <p>{t(error)}</p>
          <button
            type="button"
            className="text-button"
            onClick={() => void reload()}
          >
            {t("Try again")}{" "}
          </button>
        </div>
      )}
      {ready &&
        mode === "account" &&
        (places.length ? (
          <>
            <div className="saved-list-heading">
              <h2>
                {places.length} {places.length === 1 ? t("place") : t("places")}
              </h2>
              <span>{t("Sample locations")}</span>
            </div>
            <ul
              className="saved-list"
              ref={list}
              aria-label={t("Saved places")}
            >
              {places.map((place, index) => {
                const Icon = categoryIcons[place.category];
                const area = MOCK_AREAS.find(
                  (area) => area.id === place.areaId,
                );
                return (
                  <li key={place.id}>
                    <Link
                      className="saved-place-link"
                      href={`/explore?place=${encodeURIComponent(place.id)}`}
                    >
                      <span className="saved-category-icon">
                        <Icon size={21} aria-hidden="true" />
                      </span>
                      <span className="saved-place-name">
                        <strong>{place.name}</strong>
                        <small>
                          {t(categoryLabel(place.category))} · {area?.name}
                        </small>
                      </span>
                      <ArrowUpRight size={19} aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      className="saved-remove"
                      disabled={pending}
                      aria-label={t("Unsave {name}", { name: place.name })}
                      onClick={async () => {
                        setAnnouncement("");
                        if (!(await remove(place.id))) return;
                        setAnnouncement(
                          t("{name} removed from Saved Places.", {
                            name: place.name,
                          }),
                        );
                        requestAnimationFrame(() => {
                          const buttons =
                            list.current?.querySelectorAll<HTMLButtonElement>(
                              ".saved-remove",
                            );
                          if (buttons?.length)
                            buttons[
                              Math.min(index, buttons.length - 1)
                            ].focus();
                          else emptyHeading.current?.focus();
                        });
                      }}
                    >
                      <BookmarkMinus size={18} aria-hidden="true" />
                      <span>{t("Unsave")}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <Link className="home-explore-link" href="/explore">
              {t("Keep exploring")} <ArrowRight size={18} />
            </Link>
          </>
        ) : (
          <section className="saved-empty" aria-labelledby="saved-empty-title">
            <Bookmark size={28} strokeWidth={1.5} aria-hidden="true" />
            <h2 id="saved-empty-title" ref={emptyHeading} tabIndex={-1}>
              {t("Keep a place in mind.")}{" "}
            </h2>
            <p>
              {t(
                "Save a place from its details in Explore. It will appear here when you want another look.",
              )}{" "}
            </p>
            <Link className="home-explore-link" href="/explore">
              {t("Explore a location")} <ArrowRight size={18} />
            </Link>
          </section>
        ))}
      <span className="sr-only" role="status">
        {pending ? t("Updating saved places…") : announcement}
      </span>
    </main>
  );
}

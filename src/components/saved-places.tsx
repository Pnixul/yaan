"use client";

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
  const { ids, ready, persistent, mode, pending, error, remove, reload } =
    useSavedPlaces();
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
          Your places
          {mode === "guest"
            ? " · This browser"
            : mode === "account"
              ? " · Your account"
              : ""}
        </p>
        <h1>Saved places</h1>
        <p>A few places to come back to.</p>
      </header>
      <p className="saved-storage-note" role="status">
        {error && !ready
          ? "Saved places are unavailable."
          : !ready
            ? "Loading saved places…"
            : mode === "account"
              ? "Saved to your account. Available whenever you sign in."
              : persistent
                ? "Stored only in this browser. Clearing browser data removes them."
                : "Browser storage is unavailable. Changes last for this session only."}
      </p>
      {mode === "guest" && (
        <p className="saved-storage-note">
          <Link href="/account" className="underline">
            Sign in
          </Link>{" "}
          to save places to your account. Browser saves stay separate.
        </p>
      )}
      {error && (
        <div className="saved-storage-note" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="text-button"
            onClick={() => void reload()}
          >
            Try again
          </button>
        </div>
      )}
      {ready &&
        (places.length ? (
          <>
            <div className="saved-list-heading">
              <h2>
                {places.length} {places.length === 1 ? "place" : "places"}
              </h2>
              <span>Sample locations</span>
            </div>
            <ul className="saved-list" ref={list} aria-label="Saved places">
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
                          {categoryLabel(place.category)} · {area?.name}
                        </small>
                      </span>
                      <ArrowUpRight size={19} aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      className="saved-remove"
                      disabled={pending}
                      aria-label={`Unsave ${place.name}`}
                      onClick={async () => {
                        setAnnouncement("");
                        if (!(await remove(place.id))) return;
                        setAnnouncement(
                          `${place.name} removed from Saved Places.`,
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
                      <span>Unsave</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <Link className="home-explore-link" href="/explore">
              Keep exploring <ArrowRight size={18} />
            </Link>
          </>
        ) : (
          <section className="saved-empty" aria-labelledby="saved-empty-title">
            <Bookmark size={28} strokeWidth={1.5} aria-hidden="true" />
            <h2 id="saved-empty-title" ref={emptyHeading} tabIndex={-1}>
              Keep a place in mind.
            </h2>
            <p>
              Save a place from its details in Explore. It will appear here when
              you want another look.
            </p>
            <Link className="home-explore-link" href="/explore">
              Explore a location <ArrowRight size={18} />
            </Link>
          </section>
        ))}
      <span className="sr-only" role="status">
        {pending ? "Updating saved places…" : announcement}
      </span>
    </main>
  );
}

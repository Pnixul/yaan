"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useState } from "react";
import type { MockPlace } from "@/lib/mock-places";
import { useSavedPlaces } from "@/lib/saved-places";

export function SavePlaceButton({ place }: { place: MockPlace }) {
  const { ids, ready, persistent, pending, error, toggle, reload } =
    useSavedPlaces();
  const [announcement, setAnnouncement] = useState("");
  const saved = ids.includes(place.id);
  const Icon = saved ? BookmarkCheck : Bookmark;
  return (
    <div className="save-place-control">
      <button
        type="button"
        className="save-place-button"
        disabled={!ready || pending}
        aria-label={`Save ${place.name}`}
        aria-pressed={saved}
        onClick={async () => {
          setAnnouncement("");
          if (!(await toggle(place.id))) return;
          setAnnouncement(
            `${place.name} ${saved ? "removed from" : "added to"} Saved Places.`,
          );
        }}
      >
        <Icon size={17} aria-hidden="true" />{" "}
        {pending ? "Saving…" : saved ? "Saved" : "Save"}
      </button>
      <span className="sr-only" role="status">
        {announcement}
      </span>
      {error && (
        <div className="save-storage-note" role="alert">
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
      {ready && !persistent && (
        <p className="save-storage-note" role="status">
          Browser storage is unavailable. Changes last for this session only.
        </p>
      )}
    </div>
  );
}

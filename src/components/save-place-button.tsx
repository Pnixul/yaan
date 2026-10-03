"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useState } from "react";
import type { MockPlace } from "@/lib/mock-places";
import { useSavedPlaces } from "@/lib/saved-places";

export function SavePlaceButton({ place }: { place: MockPlace }) {
  const { ids, ready, persistent, toggle } = useSavedPlaces();
  const [announcement, setAnnouncement] = useState("");
  const saved = ids.includes(place.id);
  const Icon = saved ? BookmarkCheck : Bookmark;
  return (
    <div className="save-place-control">
      <button
        type="button"
        className="save-place-button"
        disabled={!ready}
        aria-label={`Save ${place.name}`}
        aria-pressed={saved}
        onClick={() => {
          toggle(place.id);
          setAnnouncement(
            `${place.name} ${saved ? "removed from" : "added to"} Saved Places.`,
          );
        }}
      >
        <Icon size={17} aria-hidden="true" /> {saved ? "Saved" : "Save"}
      </button>
      <span className="sr-only" role="status">
        {announcement}
      </span>
      {ready && !persistent && (
        <p className="save-storage-note" role="status">
          Browser storage is unavailable. Changes last for this session only.
        </p>
      )}
    </div>
  );
}

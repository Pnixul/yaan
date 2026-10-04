"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import type { MockPlace } from "@/lib/mock-places";
import { useSavedPlaces } from "@/lib/saved-places";
import { beginSave, type IntentState } from "@/app/account/intent-actions";

export function SavePlaceButton({ place }: { place: MockPlace }) {
  const { ids, ready, mode, pending, error, toggle, reload } = useSavedPlaces();
  const [authState, authAction, authPending] = useActionState<
    IntentState,
    FormData
  >((previous, form) => {
    form.set(
      "returnTo",
      window.location.pathname + window.location.search + window.location.hash,
    );
    return beginSave(previous, form);
  }, {});
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (authState.error) feedback.current?.focus();
  }, [authState.error]);
  const [announcement, setAnnouncement] = useState("");
  const saved = ids.includes(place.id);
  const Icon = saved ? BookmarkCheck : Bookmark;
  return (
    <div className="save-place-control">
      {mode === "signed-out" ? (
        <form action={authAction} aria-busy={authPending}>
          <input type="hidden" name="placeId" value={place.id} />
          <button
            type="submit"
            className="save-place-button"
            disabled={authPending}
            aria-label={`Sign in to save ${place.name}`}
          >
            <Bookmark size={17} aria-hidden="true" />{" "}
            {authPending ? "Opening sign in…" : "Sign in to save"}
          </button>
          {authState.error && (
            <p
              className="save-storage-note"
              ref={feedback}
              tabIndex={-1}
              role="alert"
            >
              {authState.error}
            </p>
          )}
        </form>
      ) : (
        <button
          type="button"
          className="save-place-button"
          disabled={!ready || pending}
          aria-pressed={ready ? saved : undefined}
          aria-label={`${saved ? "Unsave" : "Save"} ${place.name}`}
          onClick={async () => {
            setAnnouncement("");
            if (!(await toggle(place.id))) return;
            setAnnouncement(
              `${place.name} ${saved ? "removed from" : "added to"} Saved Places.`,
            );
          }}
        >
          <Icon size={17} aria-hidden="true" />{" "}
          {!ready
            ? error
              ? "Save unavailable"
              : "Checking…"
            : pending
              ? saved
                ? "Removing…"
                : "Saving…"
              : saved
                ? "Unsave"
                : "Save"}
        </button>
      )}
      <span className="sr-only" role="status">
        {authPending ? "Opening sign in to save this place." : announcement}
      </span>
      {error && (
        <div className="save-storage-note" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="text-button"
            onClick={() => void reload()}
          >
            {ready ? "Reload saved state" : "Try again"}
          </button>
        </div>
      )}
    </div>
  );
}

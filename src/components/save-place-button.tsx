"use client";

import { useI18n } from "@/components/i18n";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import type { MockPlace } from "@/lib/mock-places";
import { useSavedPlaces } from "@/lib/saved-places";
import { beginSave, type IntentState } from "@/app/account/intent-actions";

export function SavePlaceButton({ place }: { place: MockPlace }) {
  const { t } = useI18n();
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
            aria-label={t("Sign in to save {name}", { name: place.name })}
          >
            <Bookmark size={17} aria-hidden="true" />{" "}
            {authPending ? t("Opening sign in…") : t("Sign in to save")}
          </button>
          {authState.error && (
            <p
              className="save-storage-note"
              ref={feedback}
              tabIndex={-1}
              role="alert"
            >
              {t(authState.error)}
            </p>
          )}
        </form>
      ) : (
        <button
          type="button"
          className="save-place-button"
          disabled={!ready || pending}
          aria-pressed={ready ? saved : undefined}
          aria-label={t(saved ? "Unsave {name}" : "Save {name}", {
            name: place.name,
          })}
          onClick={async () => {
            setAnnouncement("");
            if (!(await toggle(place.id))) return;
            setAnnouncement(
              t(
                saved
                  ? "{name} removed from Saved Places."
                  : "{name} added to Saved Places.",
                { name: place.name },
              ),
            );
          }}
        >
          <Icon size={17} aria-hidden="true" />{" "}
          {!ready
            ? error
              ? t("Save unavailable")
              : t("Checking…")
            : pending
              ? saved
                ? t("Removing…")
                : t("Saving…")
              : saved
                ? t("Unsave")
                : t("Save")}
        </button>
      )}
      <span className="sr-only" role="status">
        {authPending ? t("Opening sign in to save this place.") : announcement}
      </span>
      {error && (
        <div className="save-storage-note" role="alert">
          <p>{t(error)}</p>
          <button
            type="button"
            className="text-button"
            onClick={() => void reload()}
          >
            {ready ? t("Reload saved state") : t("Try again")}
          </button>
        </div>
      )}
    </div>
  );
}

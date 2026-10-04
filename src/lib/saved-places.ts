"use client";

import { useSyncExternalStore } from "react";
import { MOCK_PLACES } from "./mock-places";
import { loadSavedPlaces, setSavedPlace } from "@/app/saved/actions";

const knownIds = new Set(MOCK_PLACES.map((place) => place.id));
type SavedState = {
  ids: string[];
  ready: boolean;
  userId: string | null;
  mode: "signed-out" | "account" | null;
  pending: boolean;
  error: string | null;
};
const serverState: SavedState = {
  ids: [],
  ready: false,
  userId: null,
  mode: null,
  pending: false,
  error: null,
};
let state = serverState;
let generation = 0;
const listeners = new Set<() => void>();

function publish(next: SavedState) {
  state = next;
  listeners.forEach((listener) => listener());
}

async function reload() {
  const current = ++generation;
  // Hide the previous account while identity is resolved, including on tab focus.
  publish(serverState);
  try {
    const result = await loadSavedPlaces();
    if (current !== generation || !listeners.size) return;
    if (result.mode === "signed-out")
      publish({ ...serverState, ready: true, mode: "signed-out" });
    else if (result.mode === "account") {
      publish({
        ...serverState,
        mode: "account",
        userId: result.userId,
        ids: result.ids,
        ready: true,
      });
    } else publish({ ...serverState, error: result.error });
  } catch {
    if (current === generation && listeners.size) {
      publish({
        ...serverState,
        error: "We couldn’t load your saved places. Please try again.",
      });
    }
  }
}

function onFocus() {
  void reload();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    // Discard the retired guest list without reading or importing it.
    try {
      localStorage.removeItem("yaan.saved-places");
    } catch {
      /* Storage may be blocked. */
    }
    window.addEventListener("focus", onFocus);
    void reload();
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      window.removeEventListener("focus", onFocus);
      generation++;
      state = serverState;
    }
  };
}

async function setSaved(id: string, saved: boolean): Promise<boolean> {
  if (!knownIds.has(id) || !state.ready || state.pending) return false;
  const ids = saved
    ? [id, ...state.ids.filter((item) => item !== id)]
    : state.ids.filter((item) => item !== id);
  if (!state.userId) return false;

  const current = ++generation;
  const userId = state.userId;
  publish({ ...state, pending: true, error: null });
  try {
    const result = await setSavedPlace(id, saved, userId);
    if (current !== generation) {
      // A focus/navigation refresh may have read before this write completed.
      // Re-read current identity; never apply a previous account's result.
      if (listeners.size) await reload();
      return false;
    }
    if (!result.ok) {
      if (result.sessionChanged) {
        await reload();
        if (state.ready) publish({ ...state, error: result.error });
      } else publish({ ...state, pending: false, error: result.error });
      return false;
    }
    publish({ ...state, ids, pending: false });
    return true;
  } catch {
    if (current === generation) {
      publish({
        ...state,
        pending: false,
        error:
          "We couldn’t confirm your change. Please retry or reload saved places.",
      });
    }
    return false;
  }
}

function toggle(id: string) {
  return setSaved(id, !state.ids.includes(id));
}

function remove(id: string) {
  return setSaved(id, false);
}

// The UI depends on this small interface, not the storage implementation.
export function useSavedPlaces() {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => state,
    () => serverState,
  );
  return { ...snapshot, toggle, remove, reload };
}

"use client";

import { useSyncExternalStore } from "react";
import { MOCK_PLACES } from "./mock-places";
import { loadSavedPlaces, setSavedPlace } from "@/app/saved/actions";

const STORAGE_KEY = "yaan.saved-places";
const knownIds = new Set(MOCK_PLACES.map((place) => place.id));
type SavedState = {
  ids: string[];
  ready: boolean;
  persistent: boolean;
  userId: string | null;
  mode: "guest" | "account" | null;
  pending: boolean;
  error: string | null;
};
const serverState: SavedState = {
  ids: [],
  ready: false,
  persistent: true,
  userId: null,
  mode: null,
  pending: false,
  error: null,
};
let state = serverState;
let generation = 0;
let guestIds: string[] = [];
let guestPersistent = true;
const listeners = new Set<() => void>();

// Persist IDs only, and treat browser storage as untrusted input.
function decode(raw: string | null): string[] {
  try {
    const value: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (id): id is string => typeof id === "string" && knownIds.has(id),
            ),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}

function publish(next: SavedState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function readStorage() {
  try {
    guestIds = decode(localStorage.getItem(STORAGE_KEY));
    guestPersistent = true;
  } catch {
    guestPersistent = false;
  }
  publish({
    ...serverState,
    ids: guestIds,
    ready: true,
    persistent: guestPersistent,
    mode: "guest",
  });
}

async function reload() {
  const current = ++generation;
  // Hide the previous account while identity is resolved, including on tab focus.
  publish(serverState);
  try {
    const result = await loadSavedPlaces();
    if (current !== generation || !listeners.size) return;
    if (result.mode === "guest") readStorage();
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

function onStorage(event: StorageEvent) {
  if (
    state.mode === "guest" &&
    (event.key === STORAGE_KEY || event.key === null)
  )
    readStorage();
}

function onFocus() {
  void reload();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    void reload();
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      generation++;
      state = serverState;
    }
  };
}

function write(ids: string[]) {
  let persistent = true;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    persistent = false;
  }
  guestIds = ids;
  guestPersistent = persistent;
  publish({ ...state, ids, persistent, error: null });
}

async function setSaved(id: string, saved: boolean): Promise<boolean> {
  if (!knownIds.has(id) || !state.ready || state.pending) return false;
  const ids = saved
    ? [id, ...state.ids.filter((item) => item !== id)]
    : state.ids.filter((item) => item !== id);
  if (state.mode === "guest") {
    write(ids);
    return true;
  }
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

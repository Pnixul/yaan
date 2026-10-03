"use client";

import { useSyncExternalStore } from "react";
import { MOCK_PLACES } from "./mock-places";

const STORAGE_KEY = "yaan.saved-places";
const knownIds = new Set(MOCK_PLACES.map((place) => place.id));
type SavedState = { ids: string[]; ready: boolean; persistent: boolean };
const serverState: SavedState = { ids: [], ready: false, persistent: true };
let state = serverState;
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
    publish({
      ids: decode(localStorage.getItem(STORAGE_KEY)),
      ready: true,
      persistent: true,
    });
  } catch {
    publish({ ...state, ready: true, persistent: false });
  }
}

function onStorage(event: StorageEvent) {
  if (event.key === STORAGE_KEY || event.key === null) readStorage();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener("storage", onStorage);
    // Preserve the in-memory fallback when storage is unavailable.
    if (!state.ready || state.persistent) readStorage();
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener("storage", onStorage);
  };
}

function write(ids: string[]) {
  let persistent = true;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    persistent = false;
  }
  publish({ ids, ready: true, persistent });
}

function toggle(id: string) {
  if (!knownIds.has(id) || !state.ready) return;
  write(
    state.ids.includes(id)
      ? state.ids.filter((saved) => saved !== id)
      : [id, ...state.ids],
  );
}

function remove(id: string) {
  write(state.ids.filter((saved) => saved !== id));
}

// The UI depends on this small interface, not the storage implementation.
export function useSavedPlaces() {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => state,
    () => serverState,
  );
  return { ...snapshot, toggle, remove };
}

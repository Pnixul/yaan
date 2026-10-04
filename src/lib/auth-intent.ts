import { exploreEntry } from "./explore-entry";

// Return destinations are a small allowlist, never arbitrary URLs.
export function savedReturn(value: unknown): "/saved" | "/account" {
  return value === "/saved" ? "/saved" : "/account";
}

export function saveReturn(placeId: unknown, value: unknown): string | null {
  if (
    typeof placeId !== "string" ||
    typeof value !== "string" ||
    value.length > 1024
  )
    return null;
  if (!value.startsWith("/explore") || /[\\\s]|%0[ad]/i.test(value))
    return null;
  try {
    const url = new URL(value, "https://yaan.invalid");
    if (url.origin !== "https://yaan.invalid" || url.pathname !== "/explore")
      return null;
    if (url.hash && !["#main-content", "#area-summary"].includes(url.hash))
      return null;
    const allowed = ["area", "reference", "place", "category", "view"];
    for (const key of url.searchParams.keys()) {
      if (!allowed.includes(key) || url.searchParams.getAll(key).length !== 1)
        return null;
    }
    return exploreEntry(url.searchParams).placeId === placeId ? value : null;
  } catch {
    return null;
  }
}

export function accountIntentHref(id: string): string {
  return `/account?intent=${encodeURIComponent(id)}`;
}

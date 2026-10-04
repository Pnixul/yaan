"use server";

import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { MOCK_PLACES } from "@/lib/mock-places";

const knownIds = new Set(MOCK_PLACES.map((place) => place.id));

export type SavedPlacesResult =
  | { mode: "signed-out" }
  | { mode: "account"; userId: string; ids: string[] }
  | { mode: "error"; error: string };

export type SaveResult =
  { ok: true } | { ok: false; error: string; sessionChanged?: boolean };

export async function loadSavedPlaces(): Promise<SavedPlacesResult> {
  try {
    const supabase = await createClient();
    if (!supabase)
      return {
        mode: "error",
        error:
          "Account services are unavailable. You can still explore; please try saving later.",
      };
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError && !isAuthSessionMissingError(authError)) throw authError;
    if (!auth.user) return { mode: "signed-out" };

    const { data, error } = await supabase
      .from("saved_places")
      .select("place_id")
      .eq("user_id", auth.user.id)
      .in("place_id", [...knownIds])
      .order("saved_at", { ascending: false })
      .order("place_id")
      .limit(knownIds.size)
      .returns<{ place_id: string }[]>();
    if (error || !Array.isArray(data)) throw error;

    return {
      mode: "account",
      userId: auth.user.id,
      ids: [
        ...new Set(
          data.flatMap((row) =>
            typeof row?.place_id === "string" && knownIds.has(row.place_id)
              ? [row.place_id]
              : [],
          ),
        ),
      ],
    };
  } catch {
    // An Auth/database outage must not silently switch account saves to local storage.
    return {
      mode: "error",
      error: "We couldn’t load your saved places. Please try again.",
    };
  }
}

export async function setSavedPlace(
  placeId: string,
  saved: boolean,
  expectedUserId: string,
): Promise<SaveResult> {
  if (
    typeof placeId !== "string" ||
    !knownIds.has(placeId) ||
    typeof saved !== "boolean"
  ) {
    return { ok: false, error: "This place cannot be saved." };
  }
  try {
    const supabase = await createClient();
    if (!supabase) throw new Error("Account services unavailable");
    const { data, error } = await supabase.auth.getUser();
    if (error && !isAuthSessionMissingError(error)) throw error;
    // The expected ID guards against account changes while a tab is open. It
    // never supplies authority: identity comes from getUser and is enforced by RLS.
    if (!data.user || data.user.id !== expectedUserId) {
      return {
        ok: false,
        sessionChanged: true,
        error:
          "Your account changed. Saved places have been reloaded; please try again.",
      };
    }
    const query = supabase.from("saved_places");
    const result = saved
      ? await query.upsert(
          { user_id: data.user.id, place_id: placeId },
          { onConflict: "user_id,place_id", ignoreDuplicates: true },
        )
      : await query
          .delete()
          .eq("user_id", data.user.id)
          .eq("place_id", placeId);
    if (result.error) throw result.error;
    return { ok: true };
  } catch {
    return {
      ok: false,
      error:
        "We couldn’t confirm your change. Please retry or reload saved places.",
    };
  }
}

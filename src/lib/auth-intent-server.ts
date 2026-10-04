import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { createClient } from "./supabase/server";
import { setSavedPlace } from "@/app/saved/actions";
import { saveReturn, savedReturn } from "./auth-intent";

const SAVE_COOKIE = "yaan.pending-save";
const CONFIRM_COOKIE = "yaan.confirmation-return";
const MAX_AGE = 24 * 60 * 60;
const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};
export type SaveIntent = {
  id: string;
  placeId: string;
  returnTo: string;
  expires: number;
};
type ConfirmationReturn = {
  intentId: string | null;
  next: string;
  email: string;
  expires: number;
};

async function readCookie(name: string): Promise<unknown> {
  try {
    return JSON.parse((await cookies()).get(name)?.value ?? "null");
  } catch {
    return null;
  }
}

export async function readSaveIntent(id: unknown): Promise<SaveIntent | null> {
  if (typeof id !== "string" || !/^[a-f0-9-]{36}$/.test(id)) return null;
  const value = (await readCookie(SAVE_COOKIE)) as Partial<SaveIntent> | null;
  if (
    !value ||
    value.id !== id ||
    typeof value.expires !== "number" ||
    value.expires <= Date.now()
  )
    return null;
  const returnTo = saveReturn(value.placeId, value.returnTo);
  return returnTo
    ? { id, placeId: value.placeId!, returnTo, expires: value.expires }
    : null;
}

export async function createSaveIntent(
  placeId: string,
  returnTo: string,
): Promise<SaveIntent> {
  if (!saveReturn(placeId, returnTo))
    throw new Error("Invalid save destination");
  const intent = {
    id: randomUUID(),
    placeId,
    returnTo,
    expires: Date.now() + MAX_AGE * 1000,
  };
  const store = await cookies();
  store.set(SAVE_COOKIE, JSON.stringify(intent), options);
  store.delete(CONFIRM_COOKIE);
  return intent;
}

export async function clearAuthIntent() {
  const store = await cookies();
  store.delete(SAVE_COOKIE);
  store.delete(CONFIRM_COOKIE);
}

export async function rememberConfirmation(
  intentId: string | null,
  next: string,
  email: string,
) {
  const value: ConfirmationReturn = {
    intentId,
    next: savedReturn(next),
    email: email.toLowerCase(),
    expires: Date.now() + MAX_AGE * 1000,
  };
  (await cookies()).set(CONFIRM_COOKIE, JSON.stringify(value), options);
}

export async function readConfirmationReturn(): Promise<ConfirmationReturn | null> {
  const value = (await readCookie(
    CONFIRM_COOKIE,
  )) as Partial<ConfirmationReturn> | null;
  if (
    !value ||
    typeof value.expires !== "number" ||
    value.expires <= Date.now() ||
    typeof value.email !== "string" ||
    value.email.length > 254
  )
    return null;
  const intent = await readSaveIntent(value.intentId);
  return {
    intentId: intent?.id ?? null,
    next: savedReturn(value.next),
    email: value.email,
    expires: value.expires,
  };
}

export async function completeSaveIntent(
  id: unknown,
  expectedUserId?: string,
): Promise<{ ok: true; returnTo: string } | { ok: false; error: string }> {
  const intent = await readSaveIntent(id);
  if (!intent)
    return {
      ok: false,
      error:
        "This save request has expired or was cancelled. Return to Explore to save the place.",
    };
  try {
    const supabase = await createClient();
    const identity = await supabase?.auth.getUser();
    const user = identity?.data.user;
    if (
      !user ||
      identity?.error ||
      (expectedUserId && user.id !== expectedUserId)
    ) {
      return {
        ok: false,
        error:
          "We couldn’t verify your account. Sign in again to finish saving.",
      };
    }
    const result = await setSavedPlace(intent.placeId, true, user.id);
    if (!result.ok)
      return {
        ok: false,
        error: result.sessionChanged
          ? "Your account changed. Check your account and sign in again to finish saving."
          : "You’re signed in, but we couldn’t save the place. Please retry.",
      };
    await clearAuthIntent();
    return { ok: true, returnTo: intent.returnTo };
  } catch {
    return {
      ok: false,
      error:
        "We couldn’t confirm the save. Please retry; this won’t create a duplicate.",
    };
  }
}

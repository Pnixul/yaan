"use server";

import { redirect } from "next/navigation";
import { accountIntentHref, saveReturn } from "@/lib/auth-intent";
import {
  clearAuthIntent,
  completeSaveIntent,
  createSaveIntent,
  readSaveIntent,
} from "@/lib/auth-intent-server";

export type IntentState = { error?: string };

export async function beginSave(
  _previous: IntentState,
  form: FormData,
): Promise<IntentState> {
  const placeId = form.get("placeId");
  const returnTo = saveReturn(placeId, form.get("returnTo"));
  if (!returnTo || typeof placeId !== "string")
    return { error: "Open the place in Explore and try saving again." };
  let id: string;
  try {
    id = (await createSaveIntent(placeId, returnTo)).id;
  } catch {
    return { error: "We couldn’t start sign-in. Please try again." };
  }
  redirect(accountIntentHref(id));
}

export async function finishSave(
  _previous: IntentState,
  form: FormData,
): Promise<IntentState> {
  const result = await completeSaveIntent(form.get("intent"));
  if (!result.ok) return { error: result.error };
  redirect(result.returnTo);
}

export async function cancelSave(form: FormData) {
  const intent = await readSaveIntent(form.get("intent"));
  if (intent) await clearAuthIntent();
  redirect(intent?.returnTo ?? "/explore");
}

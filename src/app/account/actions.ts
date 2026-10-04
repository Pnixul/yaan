"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getConfirmationUrl } from "@/lib/supabase/config";
import { authErrorMessage } from "@/lib/supabase/auth-errors";
import { accountIntentHref, savedReturn } from "@/lib/auth-intent";
import {
  clearAuthIntent,
  completeSaveIntent,
  readSaveIntent,
  rememberConfirmation,
} from "@/lib/auth-intent-server";

export type AuthFormState = {
  error?: string;
  confirmation?: boolean;
  email?: string;
};

export async function authenticate(
  _previous: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const mode = form.get("mode");
  const emailValue = form.get("email");
  const password = form.get("password");
  const email = typeof emailValue === "string" ? emailValue.trim() : "";
  const intent = await readSaveIntent(form.get("intent"));
  const next = savedReturn(form.get("next"));
  let userId: string | undefined;

  if (mode !== "signin" && mode !== "signup")
    return { error: "Choose sign in or sign up." };
  if (
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return { error: "Enter a valid email address.", email };
  }
  if (typeof password !== "string" || !password || password.length > 1024) {
    return {
      error: "Enter a password of no more than 1024 characters.",
      email,
    };
  }
  if (mode === "signup" && password.length < 8) {
    return { error: "Use at least 8 characters for your password.", email };
  }

  try {
    const supabase = await createClient();
    if (!supabase)
      return { error: "Account access is not available yet.", email };

    if (mode === "signup") {
      const emailRedirectTo = getConfirmationUrl();
      if (!emailRedirectTo)
        return {
          error:
            "Registration is temporarily unavailable. Please try again later.",
          email,
        };
      // The fixed callback uses a browser-bound return record, not an arbitrary redirect URL.
      await rememberConfirmation(intent?.id ?? null, next, email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo },
      });
      if (error) return { error: authErrorMessage(error), email };
      // Supabase can return an obfuscated existing user. Do not claim a new
      // account or a delivered email, and never treat a null session as signed in.
      if (!data.session) return { confirmation: true, email };
      userId = data.session.user.id;
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: authErrorMessage(error), email };
      if (!data.session)
        return {
          error:
            "We couldn’t establish your session. Please try signing in again.",
          email,
        };
      userId = data.session.user.id;
    }
  } catch {
    return {
      error: "We couldn’t reach account services. Please try again.",
      email,
    };
  }
  if (intent) {
    const result = await completeSaveIntent(intent.id, userId);
    redirect(
      result.ok
        ? result.returnTo
        : `${accountIntentHref(intent.id)}&save=error`,
    );
  }
  redirect(form.get("intent") ? "/account?save=expired" : next);
}

export async function signOut(): Promise<AuthFormState> {
  try {
    const supabase = await createClient();
    if (!supabase) return { error: "Account access is not available yet." };
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) return { error: "We couldn’t sign you out. Please try again." };
    await clearAuthIntent();
  } catch {
    return { error: "We couldn’t reach account services. Please try again." };
  }
  redirect("/account");
}

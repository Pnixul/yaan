"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { authenticate, signOut, type AuthFormState } from "./actions";

function CredentialsForm({ mode }: { mode: "signin" | "signup" }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    authenticate,
    {},
  );
  const feedback = useRef<HTMLDivElement>(null);
  const signingUp = mode === "signup";
  useEffect(() => {
    if (state.error || state.confirmation) feedback.current?.focus();
  }, [state]);

  return (
    <form action={action} className="account-form" aria-busy={pending}>
      <input type="hidden" name="mode" value={mode} />
      {state.confirmation && (
        <div
          className="account-message"
          role="status"
          tabIndex={-1}
          ref={feedback}
        >
          <h3>Check your email</h3>
          <p>
            If registration can proceed for {state.email}, you’ll receive a
            confirmation link. Open it to confirm your email. You are not signed
            in yet.
          </p>
          <p>
            Already registered? Use Sign in. If no email arrives, check your
            spam folder and try again later.
          </p>
        </div>
      )}
      {!state.confirmation && (
        <>
          <div className="account-field">
            <label htmlFor="account-email">Email</label>
            <input
              id="account-email"
              name="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              maxLength={254}
              defaultValue={state.email}
              disabled={pending}
            />
          </div>
          <div className="account-field">
            <label htmlFor="account-password">Password</label>
            <input
              id="account-password"
              name="password"
              type="password"
              autoComplete={signingUp ? "new-password" : "current-password"}
              required
              minLength={signingUp ? 8 : undefined}
              maxLength={1024}
              aria-describedby={signingUp ? "password-hint" : undefined}
              disabled={pending}
            />
            {signingUp && (
              <p id="password-hint">
                Use at least 8 characters. A longer, unique password is best.
              </p>
            )}
          </div>
          {state.error && (
            <div
              className="account-message account-error"
              role="alert"
              tabIndex={-1}
              ref={feedback}
            >
              {state.error}
            </div>
          )}
          <button className="account-button" disabled={pending} type="submit">
            {pending
              ? signingUp
                ? "Creating account…"
                : "Signing in…"
              : signingUp
                ? "Create account"
                : "Sign in"}
          </button>
          <span className="sr-only" role="status">
            {pending ? "Please wait while we process your request." : ""}
          </span>
        </>
      )}
    </form>
  );
}

export function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  return (
    <section aria-label="Account access">
      <div className="account-modes" aria-label="Sign in or sign up">
        <button
          type="button"
          aria-pressed={mode === "signin"}
          onClick={() => setMode("signin")}
        >
          Sign in
        </button>
        <button
          type="button"
          aria-pressed={mode === "signup"}
          onClick={() => setMode("signup")}
        >
          Sign up
        </button>
      </div>
      <CredentialsForm key={mode} mode={mode} />
    </section>
  );
}

export function SignOutForm() {
  const [state, action, pending] = useActionState(signOut, {});
  return (
    <form action={action} className="account-form" aria-busy={pending}>
      {state.error && (
        <p className="account-message account-error" role="alert">
          {state.error}
        </p>
      )}
      <button className="account-button" type="submit" disabled={pending}>
        {pending ? "Signing out…" : "Sign out"}
      </button>
      <span className="sr-only" role="status">
        {pending ? "Signing out…" : ""}
      </span>
    </form>
  );
}

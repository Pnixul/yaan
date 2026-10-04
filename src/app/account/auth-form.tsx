"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { authenticate, signOut, type AuthFormState } from "./actions";
import { cancelSave, finishSave } from "./intent-actions";
import { accountIntentHref } from "@/lib/auth-intent";

export function AuthForm({
  intentId = "",
  next = "/account",
}: {
  intentId?: string;
  next?: string;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
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
    <section aria-label="Account access">
      <div className="account-modes" aria-label="Sign in or create an account">
        <button
          type="button"
          disabled={pending}
          aria-pressed={!signingUp}
          onClick={() => setMode("signin")}
        >
          Sign in
        </button>
        <button
          type="button"
          disabled={pending}
          aria-pressed={signingUp}
          onClick={() => setMode("signup")}
        >
          Create account
        </button>
      </div>
      <form action={action} className="account-form" aria-busy={pending}>
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="intent" value={intentId} />
        <input type="hidden" name="next" value={next} />
        {state.confirmation && signingUp && (
          <div
            className="account-message"
            role="status"
            tabIndex={-1}
            ref={feedback}
          >
            <h3>Check your email</h3>
            <p>
              If registration can proceed for {state.email}, you’ll receive a
              confirmation link. Open it to confirm your email. You are not
              signed in yet.
            </p>
            <p>
              Open the link in this browser.{" "}
              {intentId
                ? "We’ll save your place and return you to Explore. If you confirm elsewhere, come back here and sign in to finish saving."
                : "Then you can continue using your account."}
            </p>
            <p>
              Already registered? Use Sign in. If no email arrives, check your
              spam folder and try again later.
            </p>
          </div>
        )}
        {(!state.confirmation || mode === "signin") && (
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
      {intentId && <CancelSaveForm intentId={intentId} disabled={pending} />}
    </section>
  );
}

export function PendingSaveForm({
  intentId,
  retry,
}: {
  intentId: string;
  retry: boolean;
}) {
  const [state, action, pending] = useActionState(finishSave, {});
  const started = useRef(false);
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (retry || started.current) return;
    started.current = true;
    const form = new FormData();
    form.set("intent", intentId);
    startTransition(() => action(form));
  }, [action, intentId, retry]);
  useEffect(() => {
    if (state.error || retry) feedback.current?.focus();
  }, [state.error, retry]);
  return (
    <>
      <form action={action} className="account-form" aria-busy={pending}>
        <input type="hidden" name="intent" value={intentId} />
        {(state.error || retry) && (
          <p
            ref={feedback}
            tabIndex={-1}
            role="alert"
            className="account-message account-error"
          >
            {state.error ??
              "You’re signed in, but we couldn’t save the place. Retry to finish and return to Explore."}
          </p>
        )}
        <button className="account-button" disabled={pending} type="submit">
          {pending ? "Saving and returning…" : "Retry save and return"}
        </button>
        <span className="sr-only" role="status">
          {pending ? "Saving your place…" : ""}
        </span>
      </form>
      {state.error && (
        <a className="account-retry" href={accountIntentHref(intentId)}>
          Check account and sign in again
        </a>
      )}
      <CancelSaveForm intentId={intentId} disabled={pending} />
    </>
  );
}

function CancelSaveForm({
  intentId,
  disabled,
}: {
  intentId: string;
  disabled: boolean;
}) {
  const [, action, pending] = useActionState(
    async (_previous: null, form: FormData) => {
      await cancelSave(form);
      return null;
    },
    null,
  );
  return (
    <form action={action}>
      <input type="hidden" name="intent" value={intentId} />
      <button
        className="account-retry text-button"
        disabled={disabled || pending}
        type="submit"
      >
        {pending ? "Returning…" : "Return without saving"}
      </button>
    </form>
  );
}

export function SignOutForm() {
  const [state, action, pending] = useActionState(signOut, {});
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.error) feedback.current?.focus();
  }, [state.error]);
  return (
    <form action={action} className="account-form" aria-busy={pending}>
      {state.error && (
        <p
          ref={feedback}
          tabIndex={-1}
          className="account-message account-error"
          role="alert"
        >
          {state.error}
        </p>
      )}
      <button
        className="account-signout text-button"
        type="submit"
        disabled={pending}
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
      <span className="sr-only" role="status">
        {pending ? "Signing out…" : ""}
      </span>
    </form>
  );
}

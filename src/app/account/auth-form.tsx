"use client";

import { useI18n } from "@/components/i18n";

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
  const { t } = useI18n();
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
    <section aria-label={t("Account access")}>
      <div
        className="account-modes"
        aria-label={t("Sign in or create an account")}
      >
        <button
          type="button"
          disabled={pending}
          aria-pressed={!signingUp}
          onClick={() => setMode("signin")}
        >
          {t("Sign in")}{" "}
        </button>
        <button
          type="button"
          disabled={pending}
          aria-pressed={signingUp}
          onClick={() => setMode("signup")}
        >
          {t("Create account")}{" "}
        </button>
      </div>
      <form action={action} className="account-form" aria-busy={pending}>
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="intent" value={intentId} />
        <input type="hidden" name="next" value={next} />
        {state.confirmation && signingUp && (
          <div
            className="account-message account-success"
            role="status"
            tabIndex={-1}
            ref={feedback}
          >
            <h3>{t("Check your email")}</h3>
            <p>
              {t(
                "If registration can proceed for {email}, you’ll receive a confirmation link. Open it to confirm your email. You are not signed in yet.",
                { email: state.email ?? "" },
              )}
            </p>
            <p>
              {t("Open the link in this browser.")}{" "}
              {intentId
                ? t(
                    "We’ll save your place and return you to Explore. If you confirm elsewhere, come back here and sign in to finish saving.",
                  )
                : t("Then you can continue using your account.")}
            </p>
            <p>
              {t(
                "Already registered? Use Sign in. If no email arrives, check your spam folder and try again later.",
              )}{" "}
            </p>
          </div>
        )}
        {(!state.confirmation || mode === "signin") && (
          <>
            <div className="account-field">
              <label htmlFor="account-email">{t("Email")}</label>
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
              <label htmlFor="account-password">{t("Password")}</label>
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
                  {t(
                    "Use at least 8 characters. A longer, unique password is best.",
                  )}{" "}
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
                {t(state.error)}
              </div>
            )}
            <button className="account-button" disabled={pending} type="submit">
              {pending
                ? signingUp
                  ? t("Creating account…")
                  : t("Signing in…")
                : signingUp
                  ? t("Create account")
                  : t("Sign in")}
            </button>
            <span className="sr-only" role="status">
              {pending ? t("Please wait while we process your request.") : ""}
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
  const { t } = useI18n();
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
            {state.error
              ? t(state.error)
              : t(
                  "You’re signed in, but we couldn’t save the place. Retry to finish and return to Explore.",
                )}
          </p>
        )}
        <button className="account-button" disabled={pending} type="submit">
          {pending ? t("Saving and returning…") : t("Retry save and return")}
        </button>
        <span className="sr-only" role="status">
          {pending ? t("Saving your place…") : ""}
        </span>
      </form>
      {state.error && (
        <a className="account-retry" href={accountIntentHref(intentId)}>
          {t("Check account and sign in again")}{" "}
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
  const { t } = useI18n();
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
        {pending ? t("Returning…") : t("Return without saving")}
      </button>
    </form>
  );
}

export function SignOutForm() {
  const { t } = useI18n();
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
          {t(state.error)}
        </p>
      )}
      <button
        className="account-signout text-button"
        type="submit"
        disabled={pending}
      >
        {pending ? t("Signing out…") : t("Sign out")}
      </button>
      <span className="sr-only" role="status">
        {pending ? t("Signing out…") : ""}
      </span>
    </form>
  );
}

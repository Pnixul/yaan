import { Message } from "@/components/i18n";
import { ThemeIllustration } from "@/components/theme-illustration";
import type { Metadata } from "next";
import Link from "next/link";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { AuthForm, PendingSaveForm, SignOutForm } from "./auth-form";
import { cancelSave } from "./intent-actions";
import { readSaveIntent } from "@/lib/auth-intent-server";
import { accountIntentHref, savedReturn } from "@/lib/auth-intent";
import { MOCK_PLACES } from "@/lib/mock-places";

export const metadata: Metadata = { title: "Account — YAAN" };
export const dynamic = "force-dynamic";

export default async function Account({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const intent = await readSaveIntent(params.intent);
  const place = MOCK_PLACES.find((item) => item.id === intent?.placeId);
  const next = savedReturn(params.next);
  const onward = intent ? (
    <form action={cancelSave}>
      <input type="hidden" name="intent" value={intent.id} />
      <button className="account-retry text-button" type="submit">
        <Message text={"Return without saving"} />{" "}
      </button>
    </form>
  ) : (
    <Link className="home-explore-link" href="/explore">
      <Message text={"Continue exploring →"} />{" "}
    </Link>
  );
  const supabase = await createClient();
  if (!supabase) {
    return (
      <>
        <p className="account-message" role="status">
          <Message
            text={
              "Account access is unavailable. You can still explore; saving requires an account."
            }
          />{" "}
        </p>
        {onward}
      </>
    );
  }

  let email: string | undefined;
  let signedIn = false;
  try {
    // Verify against Auth; never use unverified cookie session data as identity.
    const { data, error } = await supabase.auth.getUser();
    if (error && !isAuthSessionMissingError(error)) throw error;
    signedIn = Boolean(data.user);
    email = data.user?.email;
  } catch {
    return (
      <div className="account-message" role="alert">
        <p>
          <Message text={"We couldn’t check your account. Please try again."} />
        </p>
        <a
          className="account-retry"
          href={
            intent
              ? accountIntentHref(intent.id)
              : next === "/saved"
                ? "/account?next=/saved"
                : "/account"
          }
        >
          <Message text={"Try again"} />{" "}
        </a>
        {onward}
      </div>
    );
  }

  if (signedIn) {
    return (
      <section
        className="signed-in-account"
        aria-labelledby="signed-in-heading"
      >
        <h2 id="signed-in-heading">
          <Message text={"You’re signed in"} />
        </h2>
        {email && <p className="account-identity">{email}</p>}
        {intent ? (
          <>
            <p className="account-message">
              <Message
                text="Save {name} and return to where you left off."
                values={{ name: place?.name ?? "" }}
              />
            </p>
            <PendingSaveForm
              intentId={intent.id}
              retry={params.save === "error"}
            />
          </>
        ) : (
          <>
            {(params.intent || params.save === "expired") && (
              <p className="account-message" role="status">
                <Message
                  text={
                    "The save request has expired or was cancelled. Open the place in Explore to save it."
                  }
                />{" "}
              </p>
            )}
            <div className="account-onward">
              <Link className="account-button" href="/explore">
                <Message text={"Continue exploring"} />{" "}
              </Link>
              <Link className="secondary-button" href="/saved">
                <Message text={"View Saved Places"} />{" "}
              </Link>
            </div>
          </>
        )}
        {!intent && <SignOutForm />}
      </section>
    );
  }

  return (
    <div className="auth-composition">
      <div className="auth-content">
        {intent ? (
          <p className="account-message">
            <Message
              text="Sign in or create an account to save {name}. We’ll save it and return you to the same place in Explore."
              values={{ name: place?.name ?? "" }}
            />
          </p>
        ) : (
          <p className="account-message">
            <Message
              text={
                "Sign in to keep places in your account and find them again on any device."
              }
            />{" "}
          </p>
        )}
        {params.intent && !intent && (
          <p className="account-message" role="status">
            <Message
              text={
                "The save request has expired or was cancelled. You can still sign in, then open the place in Explore."
              }
            />{" "}
          </p>
        )}
        {params.confirmation === "error" && (
          <p className="account-message account-error" role="alert">
            <Message
              text={
                "We couldn’t confirm that link. It may have expired or already been used. Try signing in if you’ve already confirmed, or sign up again to request another email."
              }
            />{" "}
          </p>
        )}
        <AuthForm intentId={intent?.id} next={next} />
        {!intent && onward}
      </div>
      <aside className="auth-visual">
        <ThemeIllustration kind="auth" />
        <div className="auth-visual-copy">
          <h2>
            <Message text="Your next chapter starts with a place." />
          </h2>
          <p>
            <Message text="Get to know the neighbourhood. Keep the places that matter to you." />
          </p>
        </div>
      </aside>
    </div>
  );
}

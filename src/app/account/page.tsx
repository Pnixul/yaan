import type { Metadata } from "next";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { AuthForm, SignOutForm } from "./auth-form";

export const metadata: Metadata = { title: "Account — YAAN" };
export const dynamic = "force-dynamic";

export default async function Account({
  searchParams,
}: {
  searchParams: Promise<{ confirmation?: string }>;
}) {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <p className="account-message" role="status">
        Account access is not available yet. You can still explore and save
        places in this browser.
      </p>
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
        <p>We couldn’t check your account. Please try again.</p>
        <a className="account-retry" href="/account">
          Try again
        </a>
      </div>
    );
  }

  if (signedIn) {
    return (
      <section aria-labelledby="signed-in-heading">
        <h2 id="signed-in-heading">You’re signed in</h2>
        {email && <p className="account-identity">{email}</p>}
        <SignOutForm />
      </section>
    );
  }

  const { confirmation } = await searchParams;
  return (
    <>
      {confirmation === "error" && (
        <p className="account-message account-error" role="alert">
          We couldn’t confirm that link. It may have expired or already been
          used. Try signing in if you’ve already confirmed, or sign up again to
          request another email.
        </p>
      )}
      <AuthForm />
    </>
  );
}

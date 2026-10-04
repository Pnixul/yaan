import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { accountIntentHref } from "@/lib/auth-intent";
import {
  clearAuthIntent,
  completeSaveIntent,
  readConfirmationReturn,
} from "@/lib/auth-intent-server";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  let confirmed = false;
  let userId: string | undefined;
  let email: string | undefined;
  const returnContext = await readConfirmationReturn();

  if (!params.has("error") && !params.has("error_code")) {
    try {
      const supabase = await createClient();
      if (supabase && code && code.length <= 2048) {
        // The default ConfirmationURL confirms the email at Supabase, then
        // returns a PKCE code. Exchange it using the signup verifier cookie.
        const { data, error } =
          await supabase.auth.exchangeCodeForSession(code);
        confirmed = !error && Boolean(data.session);
        userId = data.session?.user.id;
        email = data.session?.user.email;
      } else if (
        supabase &&
        !code &&
        type === "signup" &&
        tokenHash &&
        tokenHash.length <= 2048
      ) {
        // Custom email templates can send a token hash directly to YAAN.
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "signup",
        });
        confirmed = !error && Boolean(data.session);
        userId = data.session?.user.id;
        email = data.session?.user.email;
      }
    } catch {
      // Never reflect provider errors, tokens, or user-supplied redirect targets.
    }
  }

  let destination = confirmed ? "/account" : "/account?confirmation=error";
  if (!confirmed && returnContext?.intentId) {
    destination = `${accountIntentHref(returnContext.intentId)}&confirmation=error`;
  } else if (
    confirmed &&
    returnContext &&
    email &&
    email.toLowerCase() === returnContext.email
  ) {
    if (returnContext?.intentId) {
      const result = await completeSaveIntent(returnContext.intentId, userId);
      destination = result.ok
        ? result.returnTo
        : `${accountIntentHref(returnContext.intentId)}&save=error`;
    } else {
      destination = returnContext?.next ?? "/account";
      await clearAuthIntent();
    }
  }
  // All return context comes from validated first-party cookies. Query-string
  // next/redirect values and the request Host cannot supply a destination.
  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: destination,
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  let confirmed = false;

  if (!params.has("error") && !params.has("error_code")) {
    try {
      const supabase = await createClient();
      if (supabase && code && code.length <= 2048) {
        // The default ConfirmationURL confirms the email at Supabase, then
        // returns a PKCE code. Exchange it using the signup verifier cookie.
        const { data, error } =
          await supabase.auth.exchangeCodeForSession(code);
        confirmed = !error && Boolean(data.session);
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
      }
    } catch {
      // Never reflect provider errors, tokens, or user-supplied redirect targets.
    }
  }

  // A relative, fixed destination cannot be turned into an open redirect by a
  // next/redirect query parameter or a forwarded Host header.
  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: confirmed ? "/account" : "/account?confirmation=error",
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}

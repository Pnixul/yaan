import type { AuthError } from "@supabase/supabase-js";

export function authErrorMessage(error: AuthError) {
  switch (error.code) {
    case "invalid_credentials":
      return "The email or password is incorrect. Please try again.";
    case "email_not_confirmed":
      return "Confirm your email using the link in your inbox, then sign in.";
    case "user_already_exists":
    case "email_exists":
      return "Unable to create this account. If you already registered, try signing in.";
    case "weak_password":
      return "Choose a stronger password. Use at least 8 characters with upper and lowercase letters, numbers, and symbols.";
    case "email_address_invalid":
    case "validation_failed":
      return "Check your email address and password, then try again.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a few minutes before trying again.";
    case "signup_disabled":
    case "email_provider_disabled":
      return "Email registration is currently unavailable. Please try again later.";
    default:
      return "We couldn’t complete that request. Please try again shortly.";
  }
}

import "server-only";

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key?.startsWith("sb_publishable_")) return null;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
      return null;
    }
    return { url: parsed.origin, key };
  } catch {
    return null;
  }
}

export function getConfirmationUrl() {
  try {
    const url = new URL(process.env.SITE_URL ?? "");
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (
      (url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      return null;
    return new URL("/auth/confirm", url).toString();
  } catch {
    return null;
  }
}

export type ThemePreference = "light" | "dark" | "system";
export const THEME_STORAGE_KEY = "yaan.theme";

export function normalizeTheme(value: unknown): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean) {
  return preference === "system" ? (systemDark ? "dark" : "light") : preference;
}

function applyTheme(preference: ThemePreference) {
  const root = document.documentElement;
  root.dataset.themePreference = preference;
  root.dataset.theme = resolveTheme(
    preference,
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
}

export function getThemePreference(): ThemePreference {
  return normalizeTheme(document.documentElement.dataset.themePreference);
}

export function setThemePreference(preference: ThemePreference) {
  applyTheme(preference);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // A blocked store still allows a preference for this page session.
  }
  window.dispatchEvent(new Event("yaan-theme-change"));
}

export function subscribeTheme(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    applyTheme(getThemePreference());
    onChange();
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
    applyTheme(normalizeTheme(event.newValue));
    onChange();
  };
  // Reconcile an OS change between the head script and hydration.
  applyTheme(getThemePreference());
  media.addEventListener("change", onSystemChange);
  window.addEventListener("storage", onStorage);
  window.addEventListener("yaan-theme-change", onChange);
  return () => {
    media.removeEventListener("change", onSystemChange);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("yaan-theme-change", onChange);
  };
}

// Static, trusted head script: resolve before the body paints, without cookies
// or making otherwise static routes dynamic. Keep parity covered by tests.
export const THEME_BOOTSTRAP = `(()=>{let p="system";try{const v=localStorage.getItem("${THEME_STORAGE_KEY}");if(v==="light"||v==="dark")p=v}catch{}const r=document.documentElement;r.dataset.themePreference=p;r.dataset.theme=p==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):p})()`;

export type Language = "th" | "en";
export const LANGUAGE_STORAGE_KEY = "yaan.language";

export function normalizeLanguage(value: unknown): Language {
  return value === "en" ? "en" : "th";
}
export function getLanguage(): Language {
  return normalizeLanguage(document.documentElement.lang);
}
export function setLanguage(language: Language) {
  document.documentElement.lang = language;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Language still works for this page session when storage is blocked.
  }
  window.dispatchEvent(new Event("yaan-language-change"));
}
export function subscribeLanguage(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== LANGUAGE_STORAGE_KEY && event.key !== null) return;
    document.documentElement.lang = normalizeLanguage(event.newValue);
    onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener("yaan-language-change", onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("yaan-language-change", onChange);
  };
}
export const LANGUAGE_BOOTSTRAP = `(()=>{let l="th";try{if(localStorage.getItem("${LANGUAGE_STORAGE_KEY}")==="en")l="en"}catch{}document.documentElement.lang=l})()`;

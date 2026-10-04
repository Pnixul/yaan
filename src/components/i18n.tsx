"use client";

import { useSyncExternalStore } from "react";
import { Languages } from "lucide-react";
import { getLanguage, setLanguage, subscribeLanguage, type Language } from "@/lib/language";
import { translators, type MessageValues } from "@/lib/messages";

export function useI18n() {
  const language = useSyncExternalStore<Language>(
    subscribeLanguage,
    getLanguage,
    () => "th",
  );
  return { language, t: translators[language] };
}
// Small text boundary lets server-rendered pages retain their server logic.
export function Message({
  text,
  values,
}: {
  text: string;
  values?: MessageValues;
}) {
  const { t } = useI18n();
  return t(text, values);
}
export function LanguageControl() {
  const { language, t } = useI18n();
  return (
    <button
      type="button"
      className="language-control"
      aria-label={t("Change language to English")}
      title={t("Change language to English")}
      onClick={() => setLanguage(language === "th" ? "en" : "th")}
    >
      <Languages size={17} aria-hidden="true" />
      <span lang={language === "th" ? "en" : "th"}>
        {language === "th" ? "EN" : "ไทย"}
      </span>
    </button>
  );
}

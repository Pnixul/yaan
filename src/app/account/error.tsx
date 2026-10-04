"use client";

import { useI18n } from "@/components/i18n";

export default function AccountError({ reset }: { reset: () => void }) {
  const { t } = useI18n();
  return (
    <div className="account-message" role="alert">
      <p>{t("Account services are temporarily unavailable.")}</p>
      <button className="account-button" type="button" onClick={reset}>
        {t("Try again")}{" "}
      </button>
    </div>
  );
}

"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { setThemePreference, subscribeTheme } from "@/lib/theme";
import { useI18n } from "@/components/i18n";

export function ThemeControl() {
  const { t } = useI18n();
  const theme = useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.dataset.theme ?? "light",
    () => "light",
  );
  const dark = theme === "dark";
  const label = t(dark ? "Switch to light mode" : "Switch to dark mode");
  return (
    <button
      type="button"
      className="theme-control"
      aria-label={label}
      title={label}
      onClick={() => setThemePreference(dark ? "light" : "dark")}
    >
      {dark ? (
        <Sun size={19} aria-hidden="true" />
      ) : (
        <Moon size={19} aria-hidden="true" />
      )}
    </button>
  );
}

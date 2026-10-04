"use client";

import { useSyncExternalStore } from "react";
import {
  getThemePreference,
  normalizeTheme,
  setThemePreference,
  subscribeTheme,
} from "@/lib/theme";

export function ThemeControl() {
  const preference = useSyncExternalStore(
    subscribeTheme,
    getThemePreference,
    () => "system",
  );
  return (
    <label className="theme-control">
      <span>Theme</span>
      <select
        value={preference}
        onChange={(event) => setThemePreference(normalizeTheme(event.target.value))}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </label>
  );
}

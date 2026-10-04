"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import { subscribeTheme } from "@/lib/theme";

function subscribeDesktop(onChange: () => void) {
  const media = window.matchMedia("(min-width: 1000px)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function ThemeIllustration({ kind }: { kind: "home" | "auth" }) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.dataset.theme ?? "light",
    () => null,
  );
  const desktop = useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia("(min-width: 1000px)").matches,
    () => false,
  );
  // Wait for the pre-paint preference; never fetch the wrong theme first.
  // Auth decoration is omitted on small screens, including its network request.
  if (!theme || (kind === "auth" && !desktop)) return null;
  return (
    <Image
      src={
        kind === "home"
          ? `/images/home/home-hero-${theme}.png`
          : `/images/auth/auth-visual-${theme}.png`
      }
      alt=""
      fill
      sizes={kind === "home" ? "(max-width: 767px) 100vw, 1400px" : "480px"}
      className="theme-illustration"
      loading="lazy"
    />
  );
}

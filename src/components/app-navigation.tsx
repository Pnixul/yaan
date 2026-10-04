"use client";

import { LanguageControl, useI18n } from "@/components/i18n";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Compass, Home, UserRound, Waves } from "lucide-react";
import { ThemeControl } from "@/components/theme-control";

const destinations = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/account", label: "Account", icon: UserRound },
];

export function AppNavigation() {
  const { t } = useI18n();
  const pathname = usePathname();
  return (
    <header className="app-header site-header">
      <a className="skip-link" href="#main-content">
        {t("Skip to content")}{" "}
      </a>
      <Link className="brand" href="/" aria-label={t("YAAN home")}>
        <span className="brand-icon">
          <Waves size={23} strokeWidth={1.8} />
        </span>
        <span>
          yaan<span className="brand-period">.</span>
        </span>
      </Link>
      <span className="brand-tagline">{t("Every place has a story.")}</span>
      <nav className="primary-nav" aria-label={t("Primary navigation")}>
        {destinations.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname === href ? "page" : undefined}
          >
            <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
            <span>{t(label)}</span>
          </Link>
        ))}
      </nav>
      <span className="site-prototype">
        {t("Prototype")} <span>{t("· Bangkok")}</span>
      </span>
      <div className="appearance-controls">
        <LanguageControl />
        <ThemeControl />
      </div>
    </header>
  );
}

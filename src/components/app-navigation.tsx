"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Compass, Home, UserRound, Waves } from "lucide-react";

const destinations = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/account", label: "Account", icon: UserRound },
];

export function AppNavigation() {
  const pathname = usePathname();
  return (
    <header className="app-header site-header">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Link className="brand" href="/" aria-label="YAAN home">
        <span className="brand-icon">
          <Waves size={23} strokeWidth={1.8} />
        </span>
        <span>
          yaan<span className="brand-period">.</span>
        </span>
      </Link>
      <span className="brand-tagline">Every place has a story.</span>
      <nav className="primary-nav" aria-label="Primary navigation">
        {destinations.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname === href ? "page" : undefined}
          >
            <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <span className="site-prototype">
        Prototype <span>· Bangkok</span>
      </span>
    </header>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import "./account.css";

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main-content" tabIndex={-1} className="account-page">
      <header className="account-heading">
        <p className="eyebrow">Your YAAN</p>
        <h1>Account</h1>
        <p>Explore freely. Sign in when you need your account.</p>
      </header>
      <div className="account-content">{children}</div>
      <p className="account-note">
        When signed in, Saved Places are stored in your account. Guest saves
        stay in this browser and aren’t imported into your account.
      </p>
      <Link className="home-explore-link" href="/explore">
        Keep exploring <span aria-hidden="true">→</span>
      </Link>
    </main>
  );
}

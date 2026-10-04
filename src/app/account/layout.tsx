import type { ReactNode } from "react";
import "./account.css";

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main-content" tabIndex={-1} className="account-page">
      <header className="account-heading">
        <p className="eyebrow">Your YAAN</p>
        <h1>Account</h1>
        <p>Keep useful places together, ready for another look.</p>
      </header>
      <div className="account-content">{children}</div>
      <p className="account-note">
        Saved Places belongs to your account. You can explore without signing
        in.
      </p>
    </main>
  );
}

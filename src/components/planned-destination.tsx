import Link from "next/link";
import { ArrowRight, UserRound } from "lucide-react";

export function PlannedDestination() {
  return (
    <main id="main-content" tabIndex={-1} className="planned-page">
      <UserRound size={30} strokeWidth={1.4} aria-hidden="true" />
      <p className="eyebrow">Planned · Not available in this prototype</p>
      <h1>Explore without an account.</h1>
      <p>
        Accounts and sign-in are planned for syncing personal places. For now,
        Saved Places stays in this browser. You don’t need an account to
        explore.
      </p>
      <Link href="/explore" className="home-explore-link">
        Explore a location <ArrowRight size={18} />
      </Link>
    </main>
  );
}

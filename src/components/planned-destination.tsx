import Link from "next/link";
import { ArrowRight, Bookmark, UserRound } from "lucide-react";

export function PlannedDestination({ kind }: { kind: "saved" | "account" }) {
  const saved = kind === "saved";
  const Icon = saved ? Bookmark : UserRound;
  return (
    <main id="main-content" tabIndex={-1} className="planned-page">
      <Icon size={30} strokeWidth={1.4} aria-hidden="true" />
      <p className="eyebrow">Planned · Not available in this prototype</p>
      <h1>
        {saved ? "A place for your places." : "Explore without an account."}
      </h1>
      <p>
        {saved
          ? "Saved places will help you return to locations that matter to you. Saving is not available yet."
          : "Accounts and sign-in are planned for personal features like saved places. You don’t need an account to explore."}
      </p>
      <Link href="/explore" className="home-explore-link">
        Explore a location <ArrowRight size={18} />
      </Link>
    </main>
  );
}

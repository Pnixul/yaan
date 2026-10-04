"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { exploreEntry, exploreHref } from "./explore-entry";
import { explorationReducer, type ExplorationAction } from "./exploration-state";
import type { MockReport } from "./mock-locations";

export function useExploreNavigation() {
  const params = useSearchParams();
  const entry = useMemo(() => exploreEntry(params), [params]);
  const href = exploreHref(entry);
  const [local, setLocal] = useState({
    href,
    history: false,
    report: null as MockReport | null,
    cameraRevision: 0,
  });
  // Reset only transient state on navigation, including browser Back/Forward.
  // The map stays mounted and meaningful state always comes from the URL.
  if (local.href !== href) {
    setLocal({
      href,
      history: false,
      report: null,
      cameraRevision: local.cameraRevision + 1,
    });
  }
  const dispatch = useCallback(
    (action: ExplorationAction) => {
      // Read the current URL so consecutive actions use the latest location.
      const current = exploreEntry(new URLSearchParams(window.location.search));
      const next = explorationReducer({ ...current, ...local }, action);
      const nextHref = exploreHref(next);
      if (nextHref !== exploreHref(current)) {
        window.history.pushState(null, "", nextHref);
      } else {
        setLocal({
          href,
          history: next.history,
          report: next.report,
          cameraRevision: next.cameraRevision,
        });
      }
    },
    [href, local],
  );

  return { state: { ...entry, ...local }, dispatch, href };
}

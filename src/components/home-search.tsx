"use client";

import { useI18n } from "@/components/i18n";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { LocationSearch } from "@/components/location-search";

export function HomeSearch() {
  const { t } = useI18n();
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  return (
    <div className="home-search" ref={container}>
      <LocationSearch
        onOpen={() => {
          // Keep suggestions above mobile navigation (and the on-screen keyboard).
          if (
            container.current &&
            container.current.getBoundingClientRect().top > 120 &&
            window.innerWidth < 768
          ) {
            container.current.scrollIntoView({ block: "start" });
          }
        }}
        onSelect={(location) => {
          const params = new URLSearchParams({ [location.kind]: location.id });
          router.push(`/explore?${params}`);
        }}
      />
      <p>{t("Try Ari, Thong Lo or Lat Krabang. Sample locations only.")}</p>
    </div>
  );
}

import type { Metadata } from "next";
import { MapExperience } from "@/components/map-experience";
import { exploreEntry } from "@/lib/explore-entry";

export const metadata: Metadata = { title: "Explore a location — YAAN" };

export default async function Explore({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const state = exploreEntry(
    typeof params.area === "string" ? params.area : undefined,
    typeof params.place === "string" ? params.place : undefined,
  );
  return (
    <MapExperience
      key={`${state.areaId}:${state.referenceId ?? ""}:${state.placeId ?? ""}`}
      initialState={state}
    />
  );
}

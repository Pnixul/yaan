import type { Metadata } from "next";
import { connection } from "next/server";
import { MapExperience } from "@/components/map-experience";

export const metadata: Metadata = { title: "Explore a location — YAAN" };

export default async function Explore() {
  // Render useSearchParams against the incoming request, including on refresh.
  await connection();
  return <MapExperience />;
}

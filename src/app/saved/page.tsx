import type { Metadata } from "next";
import { PlannedDestination } from "@/components/planned-destination";
export const metadata: Metadata = { title: "Saved places — YAAN" };
export default function Saved() {
  return <PlannedDestination kind="saved" />;
}

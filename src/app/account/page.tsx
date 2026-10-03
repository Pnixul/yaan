import type { Metadata } from "next";
import { PlannedDestination } from "@/components/planned-destination";
export const metadata: Metadata = { title: "Account — YAAN" };
export default function Account() {
  return <PlannedDestination kind="account" />;
}

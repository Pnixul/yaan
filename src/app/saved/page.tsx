import type { Metadata } from "next";
import { SavedPlaces } from "@/components/saved-places";
import "./saved.css";
export const metadata: Metadata = { title: "Saved places — YAAN" };
export default function Saved() {
  return <SavedPlaces />;
}

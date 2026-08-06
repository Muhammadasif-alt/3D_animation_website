import type { Metadata } from "next";
import GardenHero from "@/components/GardenHero";

export const metadata: Metadata = {
  title: "Garden Hero — Leaflife Layout",
  description:
    "Full-bleed garden hero inset in a rounded border, with a three-slide photo slider.",
};

export default function LandscapeFourPage() {
  return (
    <main>
      <GardenHero />
    </main>
  );
}

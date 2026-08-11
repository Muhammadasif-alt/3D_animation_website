import type { Metadata } from "next";
import DestinationHero from "@/components/DestinationHero";

export const metadata: Metadata = {
  title: "Landscape Hero 5 — Card to Background",
  description:
    "Full-bleed landscape hero with a strip of preview cards; the card you pick grows into the background photo.",
};

export default function LandscapeFivePage() {
  return (
    <main>
      <DestinationHero />
    </main>
  );
}

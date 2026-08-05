import type { Metadata } from "next";
import LandscapeHero from "@/components/LandscapeHero";

export const metadata: Metadata = {
  title: "Landscape & Outdoor Lighting — Hero Slider",
  description:
    "Horizontal push slider for landscape design and outdoor lighting work.",
};

export default function LandscapePage() {
  return (
    <main>
      <LandscapeHero />
    </main>
  );
}

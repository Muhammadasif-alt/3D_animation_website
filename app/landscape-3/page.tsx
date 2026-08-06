import type { Metadata } from "next";
import LandscapeHero3 from "@/components/LandscapeHero3";
import ProjectRevealSection from "@/components/ProjectRevealSection";

export const metadata: Metadata = {
  title: "Landscape Hero 3 — 3D Showcase",
  description:
    "Showcase hero with a tilting 3D image card, per-slide backdrop colour, and a square next-project thumbnail.",
};

export default function LandscapeThreePage() {
  return (
    <main>
      <LandscapeHero3 />
      <ProjectRevealSection />
    </main>
  );
}

import type { Metadata } from "next";
import LandscapeScrollHero from "@/components/LandscapeScrollHero";

export const metadata: Metadata = {
  title: "Landscape Hero 2 — Scroll-Scrub Video",
  description:
    "Pinned hero where scrolling scrubs the walkthrough video and staged captions fade in.",
};

export default function LandscapeTwoPage() {
  return (
    <main>
      <LandscapeScrollHero />
      {/* space to scroll into after the pin releases */}
      <section className="flex h-[60vh] items-center justify-center bg-[#0a0d0c]">
        <p className="text-sm uppercase tracking-[0.3em] text-white/40">
          Next section
        </p>
      </section>
    </main>
  );
}

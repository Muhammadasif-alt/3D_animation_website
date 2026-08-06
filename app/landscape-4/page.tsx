import type { Metadata } from "next";
import GardenHero from "@/components/GardenHero";

export const metadata: Metadata = {
  title: "Garden Hero — Leaflife Layout",
  description:
    "Full-bleed garden hero inset in a rounded border, with a three-slide photo slider.",
};

const SERVICES = [
  { n: "01", t: "Garden Design", d: "Concept, planting plans, and drawings you can build from." },
  { n: "02", t: "Landscaping", d: "Hardscape, structures, levels, drainage — built by our own crews." },
  { n: "03", t: "Maintenance", d: "Seasonal care that keeps a young garden looking intentional." },
];

export default function LandscapeFourPage() {
  return (
    <main className="bg-[#f3f3ef]">
      <GardenHero />

      {/* text-[#111] is explicit: the root layout sets text-bone (cream), which
          is invisible on this light section */}
      <section className="px-6 py-[16vh] text-[#111] md:px-14">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.32em] text-black/45">
          What we do
        </p>
        <div className="grid gap-10 border-t border-black/10 pt-10 md:grid-cols-3 md:gap-14">
          {SERVICES.map((s) => (
            <div key={s.n}>
              <span className="text-xs text-black/40">{s.n}</span>
              <h3 className="font-display mt-3 text-2xl uppercase md:text-3xl">{s.t}</h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-black/60">{s.d}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

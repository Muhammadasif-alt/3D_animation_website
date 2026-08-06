"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * ProjectRevealSection — pinned white section, copy on the left, a tall image
 * card on the right. Scrolling steps through the projects: the current copy
 * and photo travel UP and out while the next one rises in from below.
 *
 * Every step is given an explicit target for every index — above / here /
 * below — rather than a one-shot fromTo on change. That makes the state a pure
 * function of the index, so a re-fired ScrollTrigger can never strand a step
 * mid-fade (which is exactly how an earlier version lost its last slide).
 */

type Project = {
  key: string;
  index: string;
  title: string;
  desc: string;
  image: string;
};

const PROJECTS: Project[] = [
  {
    key: "estate",
    index: "01",
    title: "Hillside estate",
    desc: "We lit the architecture, the driveway, and the planting as one scene, so the whole property reads as a single composition after dark.",
    image: "/images/landscape/estate-aerial.png",
  },
  {
    key: "garden",
    index: "02",
    title: "Uplit garden",
    desc: "Mature trees grazed from below, shrub beds washed soft, and a patio you can actually sit on in October.",
    image: "/images/landscape/garden-uplighting.png",
  },
  {
    key: "driveway",
    index: "03",
    title: "Entrance & drive",
    desc: "Path lights and façade washes that guide you in without a single fixture glaring back at the street.",
    image: "/images/landscape/driveway-night.png",
  },
  {
    key: "living",
    index: "04",
    title: "Outdoor living",
    desc: "A sunken lounge, a fire pit, and a sauna tucked into the planting — built to work in every season.",
    image: "/images/landscape/outdoor-living.jpg",
  },
  {
    key: "design",
    index: "05",
    title: "Design & build",
    desc: "Bare lawn to finished garden: hardscape, structures, planting plans, and the irrigation nobody ever sees.",
    image: "/images/landscape/backyard-design.jpg",
  },
];

export default function ProjectRevealSection() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const copies = gsap.utils.toArray<HTMLElement>(".pr-copy", root);
    const shots = gsap.utils.toArray<HTMLElement>(".pr-shot", root);
    const total = PROJECTS.length;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set([copies[0], shots[0]], { autoAlpha: 1, yPercent: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      // snap to the opening state before anything animates
      gsap.set(copies, { yPercent: (k: number) => (k === 0 ? 0 : 55), autoAlpha: 0 });
      // autoAlpha:1 for all — the card clips them, so position alone hides them
      gsap.set(shots, { yPercent: (k: number) => (k === 0 ? 0 : 100), autoAlpha: 1 });

      let current = -1;

      /** state is a pure function of the index — no fromTo, nothing to strand */
      const show = (i: number) => {
        if (i === current) return;
        current = i;

        copies.forEach((el, k) => {
          gsap.to(el, {
            yPercent: k === i ? 0 : k < i ? -55 : 55,
            autoAlpha: k === i ? 1 : 0,
            duration: 0.85,
            ease: "power3.out",
            overwrite: true,
          });
        });

        // the card clips these, so -100/100 parks them fully out of frame
        shots.forEach((el, k) => {
          gsap.to(el, {
            yPercent: k === i ? 0 : k < i ? -100 : 100,
            duration: 0.95,
            ease: "power3.inOut",
            overwrite: true,
          });
        });
      };

      ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: `+=${total * 90}%`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          show(Math.min(total - 1, Math.floor(self.progress * total)));
          gsap.set(".pr-rail", { scaleX: self.progress });
        },
      });

      show(0);
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative flex w-full flex-col justify-center overflow-hidden bg-white px-[6vw] py-[10vh] text-[#111] [min-height:100svh]"
      aria-label="Selected projects"
    >
      {/* uneven columns: an even split left a dead strip down the middle on
          wide screens, because the copy is capped at max-w-md */}
      <div className="grid items-center gap-10 md:grid-cols-[1fr_1.35fr] md:gap-10">
        {/* ---------------- copy, stacked ---------------- */}
        <div className="relative order-2 min-h-[300px] md:order-1 md:min-h-[340px]">
          {PROJECTS.map((p, i) => (
            <div
              key={p.key}
              aria-hidden={i !== 0}
              className={`pr-copy ${
                i === 0 ? "relative" : "absolute inset-x-0 top-0"
              } opacity-0`}
            >
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.32em] text-[#111]/45">
                Project {p.index} — {PROJECTS.length}
              </p>
              <h2
                className="text-4xl leading-[1.05] md:text-6xl"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {p.title}
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#111]/65 md:text-base">
                {p.desc}
              </p>
              <a
                href="#work"
                className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#111]/25 px-7 py-3.5 text-sm font-medium transition hover:bg-[#111] hover:text-white"
              >
                Explore project
                <span aria-hidden>↗</span>
              </a>
            </div>
          ))}
        </div>

        {/* ---------------- image card, stacked and clipped ---------------- */}
        {/* NOT justify-self-end on the grid item: that makes it content-width,
            and the w-full card inside then resolves to zero. Keep the item
            stretched and push the card right with ml-auto instead. */}
        <div className="order-1 md:order-2">
          {/* portrait on phones; on desktop the aspect is dropped so the card
              can be sized by height and fill the column's width */}
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-[#eee] md:ml-auto md:aspect-auto md:h-[64vh] md:max-h-[620px] md:max-w-[720px]">
            {PROJECTS.map((p, i) => (
              // hidden pre-JS with OPACITY, never a transform class: a Tailwind
              // translate would be parsed by GSAP as an existing `y` and its
              // yPercent would stack on top of it (parking these at 200%)
              <div
                key={p.key}
                className={`pr-shot absolute inset-0 ${i === 0 ? "" : "opacity-0"}`}
              >
                <Image
                  src={p.image}
                  alt={p.title}
                  fill
                  priority={i === 0}
                  sizes="(max-width: 768px) 88vw, 460px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------- progress rail ---------------- */}
      <div className="mt-12 h-px w-full bg-[#111]/10 md:mt-16">
        <div className="pr-rail h-full w-full origin-left scale-x-0 bg-[#111]" />
      </div>
    </section>
  );
}

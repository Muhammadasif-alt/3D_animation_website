"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import HeroLinksMenu from "./HeroLinksMenu";

/**
 * DestinationHero — full-bleed landscape photo with a strip of four preview
 * cards. Click a card and THAT card's photo becomes the background: the new
 * layer is clipped to the card's exact on-screen rectangle and then grown to
 * fill the viewport, so the card literally opens into the hero.
 *
 *   ┌──────────────────────────────────────────────────────┐
 *   │ ◉ LANDVIEW      HOME  PROJECTS  SERVICES ▾  CONTACTS │
 *   │                                                      │
 *   │  — Aspen, Colorado          ┌──┐┌──┐┌──┐┌──┐         │
 *   │  HILLSIDE                   │  ││  ││  ││  │         │
 *   │  ESTATE                     │  ││  ││  ││  │         │
 *   │  paragraph                  └──┘└──┘└──┘└──┘         │
 *   │  [◧] [ DISCOVER LOCATION ]                           │
 *   │            ( ‹ ) ( › ) ─────────────────────      01 │
 *   └──────────────────────────────────────────────────────┘
 *
 * Five slides so the strip always shows the four that AREN'T on stage.
 */

type Slide = {
  key: string;
  image: string;
  region: string;
  lines: [string, string];
  blurb: string;
};

const SLIDES: Slide[] = [
  {
    key: "estate",
    image: "/images/landscape/estate-aerial.png",
    region: "Aspen — Colorado",
    lines: ["HILLSIDE", "ESTATE"],
    blurb:
      "Twelve acres read as one composition after dark — architecture, drive and planting lit as a single scene rather than three separate jobs.",
  },
  {
    key: "garden",
    image: "/images/landscape/garden-uplighting.png",
    region: "Lake District — England",
    lines: ["UPLIT", "GARDEN"],
    blurb:
      "Mature trees grazed from below, shrub beds washed soft, and a terrace you can still sit on in October without reaching for a lamp.",
  },
  {
    key: "driveway",
    image: "/images/landscape/driveway-night.png",
    region: "Litchfield — Connecticut",
    lines: ["ENTRANCE", "& DRIVE"],
    blurb:
      "Path lights and façade washes that walk you in from the gate, with not one fixture glaring back at the street.",
  },
  {
    key: "living",
    image: "/images/landscape/outdoor-living.jpg",
    region: "Hudson Valley — New York",
    lines: ["OUTDOOR", "LIVING"],
    blurb:
      "A sunken lounge, a fire pit and a sauna tucked into the planting — detailed to work in every season, not just August.",
  },
  {
    key: "design",
    image: "/images/landscape/backyard-design.jpg",
    region: "Marin County — California",
    lines: ["DESIGN", "& BUILD"],
    blurb:
      "Bare lawn to finished garden: levels, hardscape, structures, planting plans and the irrigation nobody is ever meant to notice.",
  },
];

/** how many previews sit in the strip; SLIDES.length must be this + 1 */
const CARDS = 4;
/** ms between auto-advances; 0 disables autoplay */
const AUTOPLAY_MS = 7000;

const NAV_LINKS = ["Home", "Projects", "Lighting", "Offers", "Contacts"];

export default function DestinationHero() {
  const rootRef = useRef<HTMLElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const railRef = useRef<HTMLSpanElement>(null);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // captured BEFORE the state change, because the card that was clicked gets
  // re-used for a different slide as soon as the strip re-renders
  const originRect = useRef<DOMRect | null>(null);
  const prevIndex = useRef(0);
  const firstRun = useRef(true);

  /** the four slides currently in the strip, in cycle order after the active one */
  const strip = Array.from({ length: CARDS }, (_, k) => (index + 1 + k) % SLIDES.length);

  const goTo = (next: number, from?: HTMLElement | null) => {
    if (next === index) return;
    originRect.current = from?.getBoundingClientRect() ?? null;
    setIndex(next);
  };

  const step = (dir: 1 | -1) => {
    const next = (index + dir + SLIDES.length) % SLIDES.length;
    // forward lands on the first card, so the reveal can grow out of it
    goTo(next, dir === 1 ? cardRefs.current[0] : null);
  };

  // --- slide change: grow the new photo out of the card that was clicked ----
  useEffect(() => {
    const prev = prevIndex.current;
    prevIndex.current = index;

    const ctx = gsap.context(() => {
      gsap.to(railRef.current, {
        scaleX: (index + 1) / SLIDES.length,
        duration: 0.8,
        ease: "power3.out",
        overwrite: true,
      });

      const layers = layerRefs.current;
      const incoming = layers[index];

      // first paint is the intro timeline's job — don't animate over it
      if (firstRun.current) {
        firstRun.current = false;
        gsap.set(incoming, { autoAlpha: 1, zIndex: 2 });
        return;
      }
      if (!incoming) return;

      const others = layers.filter((el, i) => el && i !== index) as HTMLDivElement[];
      const rect = originRect.current;
      originRect.current = null;

      // the outgoing photo must stay lit underneath: the reveal is a clip, so
      // anything outside the growing rectangle is still showing the old slide
      gsap.set(others, { zIndex: 1 });
      const outgoing = layers[prev];
      if (outgoing && outgoing !== incoming) gsap.set(outgoing, { autoAlpha: 1 });
      gsap.set(incoming, { zIndex: 2, autoAlpha: 1 });

      const shot = incoming.querySelector(".dh-shot");
      if (shot) gsap.fromTo(shot, { scale: 1.18 }, { scale: 1, duration: 1.5, ease: "power3.out" });

      if (rect) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        // same string shape both ends, px throughout — that's what lets GSAP
        // interpolate a clip-path at all
        const from = `inset(${rect.top}px ${w - rect.right}px ${h - rect.bottom}px ${rect.left}px round 18px)`;
        gsap.fromTo(
          incoming,
          { clipPath: from },
          {
            clipPath: "inset(0px 0px 0px 0px round 0px)",
            duration: 1.05,
            ease: "power3.inOut",
            onComplete: () => {
              gsap.set(incoming, { clearProps: "clipPath" });
              gsap.set(others, { autoAlpha: 0 });
            },
          }
        );
      } else {
        gsap.fromTo(incoming, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.9, ease: "power2.inOut" });
        gsap.to(others, { autoAlpha: 0, duration: 0.9, ease: "power2.inOut" });
      }

      gsap.fromTo(".dh-line", { yPercent: 115 }, { yPercent: 0, duration: 0.9, stagger: 0.07, ease: "power3.out" });
      gsap.fromTo(".dh-in", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.06, ease: "power3.out" });
      gsap.fromTo(".dh-card", { autoAlpha: 0, x: 36 }, { autoAlpha: 1, x: 0, duration: 0.7, stagger: 0.06, ease: "power3.out" });
      gsap.fromTo(".dh-count", { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: "power3.out" });
    }, rootRef);

    return () => ctx.revert();
  }, [index]);

  // --- intro reveal (once) --------------------------------------------------
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(".dh-nav > *", { autoAlpha: 0, y: -16, duration: 0.7, stagger: 0.07 }, 0.1)
        .from(".dh-line", { yPercent: 115, duration: 1.1, stagger: 0.09 }, 0.25)
        .from(".dh-in", { autoAlpha: 0, y: 26, duration: 0.8, stagger: 0.09 }, 0.6)
        .from(".dh-card", { autoAlpha: 0, x: 70, y: 40, duration: 0.9, stagger: 0.09 }, 0.45)
        .from(".dh-ctrl", { autoAlpha: 0, y: 24, duration: 0.7, stagger: 0.06 }, 0.9);
    }, root);

    return () => ctx.revert();
  }, []);

  // --- scroll: photo settles back, copy lifts away --------------------------
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ctx: gsap.Context | undefined;
    let killed = false;

    import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
      if (killed) return;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const scrub = { trigger: root, start: "top top", end: "bottom top", scrub: 0.6 };
        gsap.to(".dh-stage", { yPercent: 10, ease: "none", scrollTrigger: scrub });
        gsap.to(".dh-copy", { y: -80, autoAlpha: 0, ease: "none", scrollTrigger: { ...scrub, end: "65% top" } });
        gsap.to(".dh-strip", { y: 120, autoAlpha: 0, ease: "none", scrollTrigger: { ...scrub, end: "70% top" } });
      }, root);
    });

    return () => {
      killed = true;
      ctx?.revert();
    };
  }, []);

  // --- autoplay -------------------------------------------------------------
  useEffect(() => {
    if (!AUTOPLAY_MS || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(
      () => goTo((index + 1) % SLIDES.length, cardRefs.current[0]),
      AUTOPLAY_MS
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused]);

  // --- keyboard + swipe -----------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);

    const root = rootRef.current;
    let x0: number | null = null;
    let y0 = 0;
    const start = (e: TouchEvent) => {
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
    };
    const end = (e: TouchEvent) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
      x0 = null;
    };
    root?.addEventListener("touchstart", start, { passive: true });
    root?.addEventListener("touchend", end, { passive: true });

    return () => {
      window.removeEventListener("keydown", onKey);
      root?.removeEventListener("touchstart", start);
      root?.removeEventListener("touchend", end);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const active = SLIDES[index];

  return (
    <section
      ref={rootRef}
      className="relative w-full overflow-hidden bg-black [height:100svh]"
      aria-roledescription="carousel"
      aria-label="Selected locations"
    >
      {/* ---------------- background photos ---------------- */}
      {/* oversized so the scroll parallax never exposes a bare edge */}
      <div className="dh-stage absolute inset-x-0 -top-[6%] h-[112%]">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.key}
            ref={(el) => {
              layerRefs.current[i] = el;
            }}
            aria-hidden={i !== index}
            className={`absolute inset-0 ${i === 0 ? "" : "opacity-0"}`}
          >
            <div className="dh-shot absolute inset-0">
              <Image
                src={slide.image}
                alt={slide.lines.join(" ")}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </div>
        ))}
      </div>

      {/* legibility wash: heaviest bottom-left, where the copy sits */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-black/80 via-black/25 to-black/35" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-2/3 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-black/60 to-transparent" />

      {/* ---------------- nav ---------------- */}
      <header className="dh-nav absolute inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-5 md:px-12 md:py-7">
        <a href="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full ring-1 ring-white/60 md:h-10 md:w-10">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-white">
              <circle cx="12" cy="12" r="9" />
              <ellipse cx="12" cy="12" rx="4" ry="9" />
              <path d="M3.2 9h17.6M3.2 15h17.6" />
            </svg>
          </span>
          <span className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-white md:text-base">
            Landview
          </span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex xl:gap-11">
          {NAV_LINKS.slice(0, 2).map((item, i) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className={`relative py-1 text-[11px] uppercase tracking-[0.18em] transition ${
                i === 0 ? "text-white" : "text-white/70 hover:text-white"
              }`}
            >
              {item}
              {i === 0 && (
                <span className="absolute -bottom-1 left-0 h-[2px] w-6 bg-[#f2b33d]" aria-hidden />
              )}
            </a>
          ))}

          {/* same Services dropdown as every other hero, so you can hop pages */}
          <HeroLinksMenu triggerClassName="py-1 text-[11px] uppercase tracking-[0.18em] text-white/70 transition hover:text-white" />

          {NAV_LINKS.slice(2).map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="py-1 text-[11px] uppercase tracking-[0.18em] text-white/70 transition hover:text-white"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* phones get the page switcher on its own, the rest of the nav folds away */}
        <div className="lg:hidden">
          <HeroLinksMenu triggerClassName="rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white ring-1 ring-white/40" />
        </div>
      </header>

      {/* ---------------- copy ---------------- */}
      <div className="dh-copy absolute inset-x-5 top-[16%] z-30 md:inset-x-auto md:left-12 md:top-1/2 md:max-w-[540px] md:-translate-y-[56%]">
        <p className="dh-in mb-3 flex items-center gap-3 text-[13px] text-white/85 md:mb-4 md:text-base">
          <span className="h-px w-6 bg-white/80" aria-hidden />
          {active.region}
        </p>

        {/* each line rides in its own clip window so it rises from behind the
            line above instead of just fading */}
        <h1 className="font-display text-[3.1rem] font-semibold uppercase leading-[0.9] tracking-[-0.01em] text-white sm:text-7xl md:text-[5.6rem] lg:text-[6.4rem]">
          {active.lines.map((line, i) => (
            <span key={`${active.key}-${i}`} className="block overflow-hidden pb-[0.04em]">
              <span className="dh-line block">{line}</span>
            </span>
          ))}
        </h1>

        <p className="dh-in mt-5 max-w-md text-[13px] leading-relaxed text-white/75 md:mt-6 md:text-[15px]">
          {active.blurb}
        </p>

        <div className="dh-in mt-7 flex items-center gap-4 md:mt-9">
          <button
            type="button"
            aria-label="Save this location"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f2b33d] text-black transition hover:scale-105"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.5 3h11a1 1 0 0 1 1 1v16.2a.6.6 0 0 1-.93.5L12 17.2l-5.57 3.5a.6.6 0 0 1-.93-.5V4a1 1 0 0 1 1-1Z" />
            </svg>
          </button>
          <a
            href="#location"
            className="rounded-full border border-white/45 px-8 py-3.5 text-[11px] font-medium uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-black"
          >
            Discover location
          </a>
        </div>
      </div>

      {/* ---------------- preview cards ---------------- */}
      {/* the strip holds every slide that ISN'T on stage; clicking one grows
          its photo out of the card and into the background */}
      <div
        className="dh-strip absolute inset-x-0 bottom-[112px] z-30 flex gap-3 overflow-x-auto px-5 pb-2 md:inset-x-auto md:right-12 md:top-1/2 md:bottom-auto md:-translate-y-[34%] md:gap-4 md:overflow-visible md:px-0 md:pb-0"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {strip.map((slideIndex, k) => {
          const slide = SLIDES[slideIndex];
          return (
            <button
              key={`${slide.key}-${k}`}
              type="button"
              ref={(el) => {
                cardRefs.current[k] = el;
              }}
              onClick={(e) => goTo(slideIndex, e.currentTarget)}
              aria-label={`Show ${slide.lines.join(" ")}`}
              className="dh-card group relative aspect-[5/7] w-[42vw] shrink-0 overflow-hidden rounded-[18px] text-left ring-1 ring-white/15 transition-transform duration-500 will-change-transform hover:-translate-y-2.5 sm:w-[30vw] md:w-[clamp(150px,14.5vw,215px)]"
            >
              <Image
                src={slide.image}
                alt=""
                fill
                sizes="(max-width: 768px) 42vw, 200px"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.08]"
              />
              {/* frosted foot so the caption reads over any photo */}
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-black/80 via-black/45 to-transparent backdrop-blur-[2px]" />
              <span className="absolute inset-x-4 bottom-4">
                <span className="mb-1.5 flex items-center gap-2 text-[10px] text-white/80">
                  <span className="h-px w-3.5 bg-white/70" aria-hidden />
                  {slide.region}
                </span>
                <span className="font-display block text-[15px] font-semibold uppercase leading-[1.05] text-white md:text-base">
                  {slide.lines[0]}
                  <br />
                  {slide.lines[1]}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ---------------- controls ---------------- */}
      <div className="absolute inset-x-5 bottom-6 z-40 flex items-center gap-4 md:inset-x-12 md:bottom-9 md:gap-8">
        <div className="dh-ctrl flex items-center gap-3 md:ml-[38%]">
          {([-1, 1] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              onClick={() => step(dir)}
              aria-label={dir === 1 ? "Next location" : "Previous location"}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/45 text-white transition hover:bg-white hover:text-black md:h-14 md:w-14"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                {dir === 1 ? <path d="m9 5 7 7-7 7" /> : <path d="m15 5-7 7 7 7" />}
              </svg>
            </button>
          ))}
        </div>

        <span className="dh-ctrl relative hidden h-px flex-1 bg-white/25 md:block">
          <span ref={railRef} className="absolute inset-0 block origin-left scale-x-0 bg-white" />
        </span>

        <span className="dh-ctrl font-display ml-auto overflow-hidden text-3xl font-semibold text-white md:ml-0 md:text-5xl">
          <span className="dh-count block">{String(index + 1).padStart(2, "0")}</span>
        </span>
      </div>
    </section>
  );
}

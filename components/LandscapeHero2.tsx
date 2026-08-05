"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/**
 * LandscapeHero2 — circular conveyor
 *
 * Unlike LandscapeHero (one circle, cross-faded), here every slide is on stage
 * at once and they all shift one slot on each tick:
 *
 *        off -2          off -1        off 0        off +1        off +2
 *      (parked,       (left, small,  (centre,     (right, small, (parked,
 *       invisible)      behind)       focal)        behind)       invisible)
 *                          └──────────→ ┴ ──────────→
 *
 * Direction is left → centre → right, so `offset = index - i`: bumping the
 * index moves every circle one slot to the RIGHT.
 *
 * The ±2 slots are the recycling slots — they sit at opacity 0, which is what
 * makes the loop seamless. When a circle wraps from +2 straight to -2 it would
 * otherwise fly back across the whole stage; instead it teleports while nobody
 * can see it (see the `wrapped` check below).
 */

type Slide = {
  key: string;
  /** the huge word painted BEHIND the centre circle */
  word: string;
  title: string;
  desc: string;
  image: string;
};

const SLIDES: Slide[] = [
  {
    key: "estate",
    word: "ESTATES",
    title: "Estate Lighting",
    desc: "Whole-property lighting design that turns architecture, driveways, and planting into one composed night-time scene.",
    image: "/images/landscape/estate-aerial.png",
  },
  {
    key: "garden",
    word: "GARDENS",
    title: "Garden Uplighting",
    desc: "Warm uplighting on mature trees and grazed shrub beds — depth you only ever see after dark.",
    image: "/images/landscape/garden-uplighting.png",
  },
  {
    key: "driveway",
    word: "ENTRANCE",
    title: "Driveway Lighting",
    desc: "Path lights and façade washes that guide you in without ever glaring into the street.",
    image: "/images/landscape/driveway-night.png",
  },
  {
    key: "living",
    word: "LOUNGE",
    title: "Outdoor Living",
    desc: "Fire pits, sunken seating, and layered planting — built to work in every season, not just in July.",
    image: "/images/landscape/outdoor-living.jpg",
  },
  {
    key: "design",
    word: "DESIGN",
    title: "Design & Build",
    desc: "Full landscape design and construction: hardscape, structures, planting, and the irrigation nobody ever sees.",
    image: "/images/landscape/backyard-design.jpg",
  },
];

/**
 * Slot geometry, indexed by |offset|. `x` is xPercent — a share of the circle's
 * OWN width — so the whole arrangement stays correct at every screen size
 * without measuring anything.
 */
const SLOTS = [
  { x: 0, scale: 1, opacity: 1, z: 30, veil: 0 }, // centre
  // 64 puts the shoulder's inner edge inside the centre circle's radius, so it
  // genuinely tucks in BEHIND it rather than sitting alongside
  { x: 64, scale: 0.56, opacity: 1, z: 20, veil: 0.62 }, // shoulder
  { x: 120, scale: 0.38, opacity: 0, z: 10, veil: 0.7 }, // parked / recycling
];

/** ms between auto-advances; 0 disables autoplay */
const AUTOPLAY_MS = 4200;
const SHIFT = 1.05; // seconds per slot shift

/** signed distance from the centre slot, wrapped to the short way round */
function offsetOf(index: number, i: number) {
  const n = SLIDES.length;
  let off = (((index - i) % n) + n) % n;
  if (off > n / 2) off -= n;
  return off;
}

const SERIF = "'Playfair Display', 'Didot', Georgia, serif";

export default function LandscapeHero2() {
  const rootRef = useRef<HTMLElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const wordRefs = useRef<(HTMLDivElement | null)[]>([]);
  const copyRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevOffsets = useRef<number[]>(SLIDES.map((_, i) => offsetOf(0, i)));
  const [index, setIndex] = useState(0);

  const go = (dir: 1 | -1) =>
    setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length);

  // --- lay the conveyor out ------------------------------------------------
  useEffect(() => {
    const ctx = gsap.context(() => {
      slotRefs.current.forEach((slot, i) => {
        if (!slot) return;

        const item = slot.querySelector(".lh2-item");
        const veil = slot.querySelector(".lh2-veil");
        const off = offsetOf(index, i);
        const prev = prevOffsets.current[i] ?? off;
        const s = SLOTS[Math.min(Math.abs(off), SLOTS.length - 1)];
        const sign = Math.sign(off);

        // a jump of more than one slot means it wrapped round the back —
        // teleport it instead of sliding it across the stage
        const wrapped = Math.abs(off - prev) > 1;
        const dur = wrapped ? 0 : SHIFT;

        gsap.set(slot, { zIndex: s.z });
        gsap.to(item, {
          xPercent: s.x * sign,
          scale: s.scale,
          opacity: s.opacity,
          duration: dur,
          ease: "power3.inOut",
          overwrite: "auto",
        });
        gsap.to(veil, {
          opacity: s.veil,
          duration: dur || 0.3,
          ease: "power2.out",
          overwrite: "auto",
        });
      });

      // word + copy belong to whichever slide is centred
      wordRefs.current.forEach((el, i) => {
        gsap.to(el, {
          autoAlpha: i === index ? 1 : 0,
          scale: i === index ? 1 : 1.12,
          duration: SHIFT * 0.8,
          ease: "power3.out",
          overwrite: "auto",
        });
      });
      copyRefs.current.forEach((el, i) => {
        gsap.to(el, {
          autoAlpha: i === index ? 1 : 0,
          y: i === index ? 0 : 24,
          duration: SHIFT * 0.7,
          ease: "power3.out",
          overwrite: "auto",
        });
      });
    }, rootRef);

    prevOffsets.current = SLIDES.map((_, i) => offsetOf(index, i));
    return () => ctx.revert();
  }, [index]);

  // --- autoplay ------------------------------------------------------------
  useEffect(() => {
    if (!AUTOPLAY_MS) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let id = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), AUTOPLAY_MS);
    const root = rootRef.current;
    const stop = () => window.clearInterval(id);
    const start = () => {
      stop();
      id = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), AUTOPLAY_MS);
    };

    root?.addEventListener("mouseenter", stop);
    root?.addEventListener("mouseleave", start);
    return () => {
      stop();
      root?.removeEventListener("mouseenter", stop);
      root?.removeEventListener("mouseleave", start);
    };
  }, [index]);

  // --- keyboard + swipe ----------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
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
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
      x0 = null;
    };
    root?.addEventListener("touchstart", start, { passive: true });
    root?.addEventListener("touchend", end, { passive: true });

    return () => {
      window.removeEventListener("keydown", onKey);
      root?.removeEventListener("touchstart", start);
      root?.removeEventListener("touchend", end);
    };
  }, []);

  return (
    <section
      ref={rootRef}
      // svh so the mobile address bar can't push the controls off-screen
      className="relative h-screen w-full overflow-hidden bg-[#0a0d0c] [height:100svh]"
      aria-roledescription="carousel"
      aria-label="Our work"
    >
      {/* warm spotlight behind the centre slot */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[85vh] w-[85vh] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(212,175,55,0.30), rgba(212,175,55,0.08) 55%, transparent 74%)",
        }}
      />

      {/* ================= z-10 : giant words, BEHIND the circles ============ */}
      {SLIDES.map((slide, i) => (
        <div
          key={slide.key}
          ref={(el) => {
            wordRefs.current[i] = el;
          }}
          aria-hidden={i !== index}
          // On phones the three circles span the whole width, so nothing can
          // peek out from behind them — the word drops below the cluster
          // instead, with just its top edge tucked under the centre circle.
          className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center pt-[42vh] opacity-0 md:items-center md:pt-0"
        >
          <h2
            className="select-none whitespace-nowrap text-[22vw] leading-none drop-shadow-[0_8px_28px_rgba(0,0,0,0.6)] md:text-[clamp(5rem,19vw,18rem)]"
            style={{
              fontFamily: SERIF,
              letterSpacing: "-0.02em",
              backgroundImage:
                "linear-gradient(180deg, #ffffff 0%, #ffffff 55%, rgba(255,255,255,0.7) 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {slide.word}
          </h2>
        </div>
      ))}

      {/* ================= z-20 : the conveyor ============================== */}
      {SLIDES.map((slide, i) => (
        <div
          key={slide.key}
          ref={(el) => {
            slotRefs.current[i] = el;
          }}
          // each circle gets its own full-bleed centring layer, so GSAP only
          // ever has to deal with the offset transform on the inner element
          className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center pt-[17vh] md:items-center md:pt-0"
        >
          <button
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show ${slide.title}`}
            aria-current={i === index}
            className="lh2-item pointer-events-auto relative h-[62vw] w-[62vw] cursor-pointer overflow-hidden rounded-full md:h-[54vh] md:max-h-[600px] md:w-[54vh] md:max-w-[600px]"
            style={{ boxShadow: "0 50px 120px rgba(0,0,0,0.6)" }}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={i === 0}
              sizes="(max-width: 768px) 62vw, 600px"
              className="object-cover"
            />
            {/* dims the shoulder circles so the centre one clearly leads */}
            <div className="lh2-veil pointer-events-none absolute inset-0 bg-black/70" />
            <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/20" />
          </button>
        </div>
      ))}

      {/* ================= z-40 : copy ====================================== */}
      <div className="pointer-events-none absolute inset-0 z-40">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.key}
            ref={(el) => {
              copyRefs.current[i] = el;
            }}
            aria-hidden={i !== index}
            className="absolute inset-x-[5vw] bottom-[16vh] opacity-0 md:inset-x-auto md:bottom-[9vh] md:left-[4vw] md:max-w-lg"
          >
            <h3
              className="text-3xl text-white md:text-5xl"
              style={{ fontFamily: SERIF, fontWeight: 700 }}
            >
              {slide.title}
            </h3>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/75 md:mt-4 md:text-lg">
              {slide.desc}
            </p>
            <a
              href="#work"
              className="pointer-events-auto mt-5 inline-flex items-center gap-3 rounded-md bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:scale-105 md:mt-7 md:px-7 md:py-4"
            >
              See this project
              <span aria-hidden>↗</span>
            </a>
          </div>
        ))}
      </div>

      {/* ================= NAVBAR =========================================== */}
      <header className="absolute inset-x-0 top-0 z-50 flex items-center justify-between px-[5vw] py-5 md:px-[4vw] md:py-7">
        {/* 👉 apna brand name yahan */}
        <a
          href="/"
          className="text-3xl italic text-white md:text-4xl"
          style={{ fontFamily: SERIF }}
        >
          Lumen.
        </a>

        <nav className="hidden rounded-full bg-white/15 p-1.5 backdrop-blur-sm md:flex">
          {["Home", "About", "Work", "Contact"].map((item, i) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className={`rounded-full px-8 py-3 text-sm uppercase tracking-wide transition ${
                i === 0 ? "bg-white text-black" : "text-white hover:bg-white/10"
              }`}
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex gap-2 md:gap-3">
          <IconButton label="Call us">
            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
          </IconButton>
          <IconButton label="Search">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </IconButton>
        </div>
      </header>

      {/* ================= CONTROLS ========================================= */}
      <div className="absolute bottom-[4vh] right-[5vw] z-50 flex items-center gap-8 md:bottom-[7vh] md:right-[4vw]">
        <div className="hidden items-center gap-4 text-sm text-white/70 [text-shadow:0_2px_10px_rgba(0,0,0,0.7)] sm:flex">
          <span className="text-2xl text-white" style={{ fontFamily: SERIF }}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="h-px w-10 bg-white/30" />
          <span>{String(SLIDES.length).padStart(2, "0")}</span>
        </div>

        <div className="flex gap-3 md:gap-4">
          <ArrowButton label="Previous project" onClick={() => go(-1)} dir="left" />
          <ArrowButton label="Next project" onClick={() => go(1)} dir="right" />
        </div>
      </div>
    </section>
  );
}

function IconButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25 md:h-14 md:w-14"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </button>
  );
}

function ArrowButton({
  label,
  onClick,
  dir,
}: {
  label: string;
  onClick: () => void;
  dir: "left" | "right";
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="grid h-12 w-12 place-items-center rounded-full border border-white/60 text-white transition hover:bg-white hover:text-black md:h-16 md:w-16"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={dir === "left" ? "m14 6-6 6 6 6" : "m10 6 6 6-6 6"} />
      </svg>
    </button>
  );
}

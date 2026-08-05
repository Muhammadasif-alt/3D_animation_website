"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HeroLinksMenu from "@/components/HeroLinksMenu";

gsap.registerPlugin(ScrollTrigger);

/**
 * LandscapeScrollHero — pinned, scroll-scrubbed video hero.
 *
 * The section pins for 4 screen-heights. Over that distance:
 *   progress 0.00 → 0.18   intro: eyebrow + headline + buttons, then fades
 *   progress 0.24 → 0.50   caption 1, bottom LEFT
 *   progress 0.54 → 0.78   caption 2, bottom RIGHT
 *   progress 0.82 → end    closing caption + CTA, centred
 *
 * One ScrollTrigger scrubs the video, a second drives every text stage from a
 * single onUpdate — cheaper than one trigger per stage and it keeps the fade
 * windows in one readable table (STAGES below).
 *
 * NOTE: keep this hero alone on its page. Two pinned/GSAP heroes stacked in one
 * route previously stopped the whole page's client JS from running.
 */

const ACCENT = "#6EC79A"; // eyebrow / rules
const ACCENT_BTN = "#3E7A55"; // filled button

const NAV_LINK = "text-sm uppercase tracking-wide text-white/80 transition hover:text-white";

/** scroll distance the hero stays pinned for */
const SCROLL_LEN = "+=400%";

type Stage = {
  key: string;
  /** fade window: starts at `a`, fully in by `b`, holds to `c`, gone by `d` */
  a: number;
  b: number;
  c: number;
  d: number;
};

const STAGES: Stage[] = [
  { key: "intro", a: -0.01, b: 0.0, c: 0.1, d: 0.18 },
  { key: "one", a: 0.24, b: 0.3, c: 0.44, d: 0.5 },
  { key: "two", a: 0.54, b: 0.6, c: 0.72, d: 0.78 },
  // d > 1 so the closing stage never fades back out at the end of the pin
  { key: "three", a: 0.82, b: 0.88, c: 1.0, d: 1.2 },
];

function fadeAt(p: number, s: Stage) {
  if (p <= s.a || p >= s.d) return 0;
  if (p < s.b) return (p - s.a) / (s.b - s.a);
  if (p <= s.c) return 1;
  return (s.d - p) / (s.d - s.c);
}

export default function LandscapeScrollHero() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const wrap = wrapRef.current;
    if (!video || !wrap) return;

    // Reduced motion: no pinning, no scrub — the intro just sits over the
    // poster frame and the page scrolls normally.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(wrap.querySelectorAll("[data-stage]"), { opacity: 0 });
      gsap.set(wrap.querySelector('[data-stage="intro"]'), { opacity: 1, y: 0 });
      return;
    }

    video.pause();
    let ctx: gsap.Context | undefined;

    const init = () => {
      ctx = gsap.context(() => {
        const nodes = STAGES.map((s) =>
          wrap.querySelector<HTMLElement>(`[data-stage="${s.key}"]`)
        );
        const cue = wrap.querySelector(".lsh-cue");
        const bar = wrap.querySelector(".lsh-progress");

        // ONE trigger drives everything — video scrub, text stages, cue and
        // progress bar all read the same `self.progress`. A second standalone
        // ScrollTrigger for the text did not fire once this one had pinned.
        gsap.to(video, {
          currentTime: video.duration || 1,
          ease: "none",
          scrollTrigger: {
            trigger: wrap,
            start: "top top",
            end: SCROLL_LEN,
            scrub: 0.6,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const p = self.progress;
              nodes.forEach((node, i) => {
                if (!node) return;
                const o = fadeAt(p, STAGES[i]);
                gsap.set(node, { opacity: o, y: (1 - o) * 36 });
              });
              gsap.set(cue, { opacity: Math.max(0, 1 - p / 0.08) });
              gsap.set(bar, { scaleX: p });
            },
          },
        });
      }, wrap);
    };

    if (video.readyState >= 1) init();
    else video.addEventListener("loadedmetadata", init, { once: true });

    // iOS needs one touch before it will allow programmatic seeking
    const unlock = () => {
      video.play().then(() => video.pause()).catch(() => {});
      window.removeEventListener("touchstart", unlock);
    };
    window.addEventListener("touchstart", unlock, { passive: true });

    return () => {
      ctx?.revert();
      video.removeEventListener("loadedmetadata", init);
      window.removeEventListener("touchstart", unlock);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative h-screen w-full overflow-hidden bg-[#0a0d0c] [height:100svh]"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        // Scrub-optimised cut of Hero.mp4: every frame is a keyframe so seeking
        // is frame-accurate, and 20fps/CRF33 brings 31MB down to 12MB. Scrubbing
        // only works inside the buffered range, so the file has to stay light.
        src="/video/hero-scrub.mp4"
        poster="/video/hero-poster.jpg"
        muted
        playsInline
        preload="auto"
      />

      {/* legibility wash — heavier at the bottom where the captions sit */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/55" />

      {/* ================= NAVBAR ================= */}
      <header className="absolute inset-x-0 top-0 z-50 flex items-center justify-between px-[5vw] py-5 md:px-[4vw] md:py-7">
        {/* 👉 apna brand name yahan */}
        <a href="/" className="font-display text-2xl font-semibold text-white md:text-3xl">
          Lumen<span style={{ color: ACCENT }}>.</span>
        </a>

        <nav className="hidden items-center gap-9 md:flex">
          <a href="/" className={NAV_LINK}>
            Home
          </a>
          <a href="#about" className={NAV_LINK}>
            About
          </a>
          <HeroLinksMenu triggerClassName={NAV_LINK} />
          <a href="#contact" className={NAV_LINK}>
            Contact
          </a>
        </nav>

        <a
          href="#contact"
          className="rounded-full px-5 py-2.5 text-xs font-semibold text-white transition hover:brightness-110 md:px-6 md:py-3 md:text-sm"
          style={{ backgroundColor: ACCENT_BTN }}
        >
          Get a Quote
        </a>
      </header>

      {/* ================= STAGE 0 — intro ================= */}
      <div
        data-stage="intro"
        className="absolute inset-0 z-30 flex flex-col items-center justify-center px-[6vw] text-center"
      >
        <p
          className="mb-5 text-[11px] font-bold uppercase tracking-[0.32em] md:text-xs"
          style={{ color: ACCENT }}
        >
          Design Build Landscapes
        </p>

        <h1 className="font-display max-w-5xl text-[2.4rem] font-bold leading-[1.08] text-white md:text-7xl">
          Elevating Outdoor Living
          <br className="hidden sm:block" /> Through Exceptional Design
        </h1>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <a
            href="#start"
            className="rounded-md px-8 py-4 text-sm font-semibold text-white transition hover:scale-105"
            style={{ backgroundColor: ACCENT_BTN }}
          >
            Start Your Design
          </a>
          <a
            href="#work"
            className="rounded-md border border-white/70 px-8 py-4 text-sm font-semibold text-white transition hover:bg-white hover:text-black"
          >
            View Our Work
          </a>
        </div>
      </div>

      {/* ================= STAGE 1 — bottom LEFT ================= */}
      <div
        data-stage="one"
        className="absolute inset-x-[6vw] bottom-[14vh] z-30 max-w-xl opacity-0 md:inset-x-auto md:left-[5vw] md:bottom-[16vh]"
      >
        <Rule />
        <h2 className="font-display text-3xl font-bold text-white md:text-5xl">
          Built for Every Season
        </h2>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/80 md:mt-4 md:text-lg">
          Outdoor rooms you&apos;ll actually use in November — fire, cover, and warmth
          designed in from day one.
        </p>
      </div>

      {/* ================= STAGE 2 — bottom RIGHT ================= */}
      <div
        data-stage="two"
        className="absolute inset-x-[6vw] bottom-[14vh] z-30 max-w-xl opacity-0 md:inset-x-auto md:right-[5vw] md:bottom-[16vh] md:text-right"
      >
        <Rule className="md:ml-auto" />
        <h2 className="font-display text-3xl font-bold text-white md:text-5xl">
          Designed With the Architecture
        </h2>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/80 md:ml-auto md:mt-4 md:text-lg">
          Your landscape shouldn&apos;t fight the house. We design and build as one team,
          so it all reads as one property.
        </p>
      </div>

      {/* ================= STAGE 3 — closing, centred ================= */}
      <div
        data-stage="three"
        className="absolute inset-0 z-30 flex flex-col items-center justify-center px-[6vw] text-center opacity-0"
      >
        <h2 className="font-display max-w-3xl text-[2rem] font-bold leading-tight text-white md:text-6xl">
          Let&apos;s build the one
          <br />
          you never want to leave.
        </h2>
        <a
          href="#contact"
          className="mt-8 rounded-md px-9 py-4 text-sm font-semibold text-white transition hover:scale-105"
          style={{ backgroundColor: ACCENT_BTN }}
        >
          Book a Site Visit
        </a>
      </div>

      {/* scroll cue — fades out as soon as you start */}
      <div className="lsh-cue pointer-events-none absolute inset-x-0 bottom-7 z-40 flex flex-col items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/60">Scroll</span>
        <span className="h-9 w-px animate-pulse bg-white/40" />
      </div>

      {/* progress bar */}
      <div className="absolute bottom-0 left-0 z-40 h-[3px] w-full bg-white/10">
        <div
          className="lsh-progress h-full w-full origin-left scale-x-0"
          style={{ backgroundColor: ACCENT }}
        />
      </div>
    </div>
  );
}

function Rule({ className = "" }: { className?: string }) {
  return (
    <span
      className={`mb-5 block h-[3px] w-14 ${className}`}
      style={{ backgroundColor: ACCENT }}
    />
  );
}

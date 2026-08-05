"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import HeroLinksMenu from "@/components/HeroLinksMenu";
import { setFlavor } from "@/lib/flavorStore";

/**
 * IceCreamHero
 *
 * The "text hidden behind the bowl" effect is pure STACKING ORDER — no masking,
 * no clip-path. Each slide paints three layers on top of each other:
 *
 *   z-30  floating fruit pieces (optional cut-out PNGs, parallax)
 *   z-20  bowl PNG  ..............  MUST have a transparent background
 *   z-10  giant flavour word  .....  rendered in full, just covered by the bowl
 *   z-0   colored background gradient
 *
 * All four slides are mounted at once and cross-faded, because CSS gradients
 * cannot be tweened — opacity can.
 */

type Accent = {
  /** transparent PNG of a single fruit piece / leaf / chocolate chunk */
  src: string;
  /** tailwind positioning + size, e.g. "left-[12%] top-[28%] w-[7vw]" */
  className: string;
  /** how strongly it reacts to the mouse (1 = same as bowl) */
  depth?: number;
};

type Slide = {
  key: string;
  /** the huge word painted BEHIND the bowl */
  word: string;
  title: string;
  desc: string;
  /** background gradient: [inner, outer] */
  colors: [string, string];
  bowl: string;
  accents: Accent[];
};

const SLIDES: Slide[] = [
  {
    key: "strawberry",
    word: "STRAW",
    title: "Berry Pure",
    desc: "Fresh strawberries, creamy scoops, and white chocolate pieces in one smooth, dreamy dessert.",
    colors: ["#D10B43", "#96052C"],
    bowl: "/images/bowl-strawberry.webp",
    // Drop cut-out PNGs here to get the floating fruit, e.g.:
    // { src: "/images/acc-strawberry.png", className: "left-[14%] top-[24%] w-[9vw]", depth: 1.6 },
    accents: [],
  },
  {
    key: "berries",
    word: "BERRIES",
    title: "Blue Bliss",
    desc: "A smooth and refreshing blueberry ice cream made with ripe. Perfectly refreshing for any time of day.",
    colors: ["#7D10D6", "#45098A"],
    bowl: "/images/bowl-berries.webp",
    accents: [],
  },
  {
    key: "banana",
    word: "BANANA",
    title: "Banana Crush",
    desc: "A smooth and creamy banana ice cream made with white flavor. Perfectly satisfying for any time of day.",
    colors: ["#E8A800", "#B87A00"],
    bowl: "/images/bowl-banana.webp",
    accents: [],
  },
  {
    key: "kiwi",
    word: "KIWIS",
    title: "Kiwi Flavor",
    desc: "A smooth and refreshing kiwi ice cream. Rich and perfectly balanced for any time of day.",
    colors: ["#28A11F", "#0B5E12"],
    bowl: "/images/bowl-kiwi.webp",
    accents: [],
  },
];

/** ms between auto-advances; set to 0 to disable autoplay */
const AUTOPLAY_MS = 6000;

const SERIF = "'Playfair Display', 'Didot', Georgia, serif";

const NAV_LINK = "rounded-full px-8 py-3 text-sm uppercase tracking-wide transition";

export default function IceCreamHero() {
  const rootRef = useRef<HTMLElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevIndex = useRef(0);
  const [index, setIndex] = useState(0);

  const go = (next: number) =>
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);

  // --- slide transition ---------------------------------------------------
  useEffect(() => {
    const dir = index >= prevIndex.current ? 1 : -1;
    const first = slideRefs.current[index]?.dataset.mounted !== "yes";

    const ctx = gsap.context(() => {
      slideRefs.current.forEach((el, i) => {
        if (!el) return;
        el.dataset.mounted = "yes";

        const word = el.querySelector(".hero-word");
        const bowl = el.querySelector(".hero-bowl");
        const copy = el.querySelectorAll<HTMLElement>(".hero-copy > *");
        const accents = el.querySelectorAll<HTMLElement>(".hero-accent");
        const active = i === index;

        gsap.set(el, {
          zIndex: active ? 2 : 1,
          pointerEvents: active ? "auto" : "none",
        });

        if (!active) {
          gsap.to(el, { opacity: 0, duration: 0.55, ease: "power2.in", overwrite: true });
          gsap.to(bowl, {
            scale: 0.82,
            rotate: -dir * 22,
            duration: 0.55,
            ease: "power2.in",
            overwrite: true,
          });
          return;
        }

        const tl = gsap.timeline({ defaults: { overwrite: true } });
        tl.to(el, { opacity: 1, duration: first ? 0.4 : 0.7, ease: "power2.out" }, 0)
          .fromTo(
            bowl,
            { scale: 0.72, rotate: dir * 32, y: 40 },
            { scale: 1, rotate: 0, y: 0, duration: 1.15, ease: "power3.out" },
            0
          )
          .fromTo(
            word,
            { opacity: 0, scale: 1.22 },
            { opacity: 1, scale: 1, duration: 1, ease: "power3.out" },
            0.05
          )
          .fromTo(
            copy,
            { opacity: 0, y: 28 },
            { opacity: 1, y: 0, duration: 0.65, stagger: 0.07, ease: "power2.out" },
            0.2
          );

        if (accents.length) {
          tl.fromTo(
            accents,
            { opacity: 0, scale: 0.6 },
            { opacity: 1, scale: 1, duration: 0.8, stagger: 0.05, ease: "back.out(1.6)" },
            0.15
          );
        }
      });
    }, rootRef);

    prevIndex.current = index;
    return () => ctx.revert();
  }, [index]);

  // tell the hand-off section below which bowl is currently on stage
  useEffect(() => {
    setFlavor(index);
  }, [index]);

  // --- autoplay -----------------------------------------------------------
  useEffect(() => {
    if (!AUTOPLAY_MS) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [index]);

  // --- keyboard -----------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index]);

  // --- mouse parallax -----------------------------------------------------
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (e: MouseEvent) => {
      const { width, height } = root.getBoundingClientRect();
      const dx = (e.clientX / width - 0.5) * 2;
      const dy = (e.clientY / height - 0.5) * 2;
      const slide = slideRefs.current[index];
      if (!slide) return;

      gsap.to(slide.querySelector(".hero-bowl-wrap"), {
        x: dx * 18,
        y: dy * 14,
        duration: 0.9,
        ease: "power2.out",
      });
      slide.querySelectorAll<HTMLElement>(".hero-accent").forEach((el) => {
        const depth = Number(el.dataset.depth ?? 1);
        gsap.to(el, { x: dx * 26 * depth, y: dy * 20 * depth, duration: 1.1, ease: "power2.out" });
      });
    };

    root.addEventListener("mousemove", onMove);
    return () => root.removeEventListener("mousemove", onMove);
  }, [index]);

  return (
    <section
      ref={rootRef}
      className="relative h-screen w-full overflow-hidden bg-black"
      aria-roledescription="carousel"
    >
      {/* ================= SLIDES ================= */}
      {SLIDES.map((slide, i) => (
        <div
          key={slide.key}
          ref={(el) => {
            slideRefs.current[i] = el;
          }}
          className="absolute inset-0 opacity-0"
          aria-hidden={i !== index}
          style={{
            background: `radial-gradient(130% 110% at 22% 38%, ${slide.colors[0]} 0%, ${slide.colors[1]} 68%, ${slide.colors[1]} 100%)`,
          }}
        >
          {/* --- z-10 : giant word, sits BEHIND the bowl --- */}
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <h2
              className="hero-word select-none whitespace-nowrap leading-none text-white"
              style={{
                fontFamily: SERIF,
                fontSize: "clamp(6rem, 21vw, 20rem)",
                letterSpacing: "-0.02em",
                backgroundImage:
                  "linear-gradient(180deg, #ffffff 0%, #ffffff 55%, rgba(255,255,255,0.72) 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {slide.word}
            </h2>
          </div>

          {/* --- z-20 : bowl PNG, covers the middle of the word --- */}
          <div className="hero-bowl-wrap pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.bowl}
              alt={`${slide.title} ice cream bowl`}
              className="hero-bowl h-[78vh] max-h-[820px] w-auto max-w-[92vw] object-contain"
              draggable={false}
            />
          </div>

          {/* --- z-30 : floating fruit pieces (empty until PNGs are added) --- */}
          {slide.accents.map((acc, k) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={k}
              src={acc.src}
              alt=""
              data-depth={acc.depth ?? 1}
              className={`hero-accent pointer-events-none absolute z-30 object-contain ${acc.className}`}
              draggable={false}
            />
          ))}

          {/* --- z-40 : copy block --- */}
          <div className="hero-copy absolute bottom-[8vh] left-[4vw] z-40 max-w-xl">
            <h3
              className="text-4xl text-white md:text-5xl"
              style={{ fontFamily: SERIF, fontWeight: 700 }}
            >
              {slide.title}
            </h3>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/80 md:text-lg">
              {slide.desc}
            </p>
            <a
              href="#shop"
              className="mt-7 inline-flex items-center gap-3 rounded-md bg-white px-7 py-4 text-sm font-semibold text-black transition hover:scale-105"
            >
              Shop this flavor
              <span aria-hidden>↗</span>
            </a>
          </div>
        </div>
      ))}

      {/* ================= NAVBAR ================= */}
      <header className="absolute inset-x-0 top-0 z-50 flex items-center justify-between px-[4vw] py-7">
        <a href="/" className="text-4xl italic text-white" style={{ fontFamily: SERIF }}>
          Milk.
        </a>

        <nav className="hidden rounded-full bg-white/15 p-1.5 backdrop-blur-sm md:flex">
          <a href="#home" className={`${NAV_LINK} bg-white text-black`}>
            Home
          </a>
          <a href="#about" className={`${NAV_LINK} text-white hover:bg-white/10`}>
            About
          </a>

          <HeroLinksMenu triggerClassName={`${NAV_LINK} text-white hover:bg-white/10`} />

          <a href="#contact" className={`${NAV_LINK} text-white hover:bg-white/10`}>
            Contact
          </a>
        </nav>

        <div className="flex gap-3">
          <IconButton label="Cart">
            <path d="M3 5h2l2.4 9.6a2 2 0 0 0 2 1.5h6.9a2 2 0 0 0 2-1.5L20 8H6" />
            <circle cx="10" cy="20" r="1.4" />
            <circle cx="17" cy="20" r="1.4" />
          </IconButton>
          <IconButton label="Search">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </IconButton>
        </div>
      </header>

      {/* ================= ARROWS ================= */}
      <div className="absolute bottom-[6vh] right-[4vw] z-50 flex gap-4">
        <ArrowButton label="Previous flavor" onClick={() => go(index - 1)} dir="left" />
        <ArrowButton label="Next flavor" onClick={() => go(index + 1)} dir="right" />
      </div>
    </section>
  );
}

function IconButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      className="grid h-14 w-14 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
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
      className="grid h-16 w-16 place-items-center rounded-full border border-white/60 text-white transition hover:bg-white hover:text-black"
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

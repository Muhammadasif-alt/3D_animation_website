"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import HeroLinksMenu from "@/components/HeroLinksMenu";

/**
 * LandscapeHero
 *
 * Same idea as IceCreamHero: a giant word sits BEHIND a round subject and gets
 * covered in the middle. Pure stacking order, no masking.
 *
 *   z-40  copy
 *   z-20  circular photo   <-- a rectangular photo cropped to a circle, so it
 *                             behaves exactly like the transparent bowl PNG did
 *   z-10  giant word       <-- fully rendered, just hidden behind the circle
 *   z-0   colored gradient
 *
 * Entrance differs from the ice cream hero in one way: the bowl could rotate
 * because it was a top-down object, but a tilted landscape photo looks broken.
 * So the frame scales up while the photo inside pulls back from 1.25 — a
 * reveal instead of a spin.
 */

type Slide = {
  key: string;
  /** the huge word painted BEHIND the circle */
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

/** ms between auto-advances; set to 0 to disable autoplay */
const AUTOPLAY_MS = 6000;

const SERIF = "'Playfair Display', 'Didot', Georgia, serif";

const NAV_LINK = "rounded-full px-8 py-3 text-sm uppercase tracking-wide transition";

export default function LandscapeHero() {
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

        const word = el.querySelector(".lh-word");
        const frame = el.querySelector(".lh-frame");
        const photo = el.querySelector(".lh-photo");
        const ring = el.querySelector(".lh-ring");
        const copy = el.querySelectorAll<HTMLElement>(".lh-copy > *");
        const active = i === index;

        gsap.set(el, {
          zIndex: active ? 2 : 1,
          pointerEvents: active ? "auto" : "none",
        });

        if (!active) {
          gsap.to(el, { opacity: 0, duration: 0.55, ease: "power2.in", overwrite: true });
          gsap.to(frame, { scale: 0.86, duration: 0.55, ease: "power2.in", overwrite: true });
          return;
        }

        const tl = gsap.timeline({ defaults: { overwrite: true } });

        tl.to(el, { opacity: 1, duration: first ? 0.4 : 0.7, ease: "power2.out" }, 0)
          // frame grows into place
          .fromTo(
            frame,
            { scale: 0.72, y: 46 },
            { scale: 1, y: 0, duration: 1.15, ease: "power3.out" },
            0
          )
          // photo pulls back inside the frame — the reveal. It rests at 1.3,
          // not 1: the backdrop is the same shot, so an un-zoomed circle lined
          // up with it and the edge vanished. The zoom breaks the seam.
          .fromTo(
            photo,
            { scale: 1.6 },
            { scale: 1.3, duration: 1.4, ease: "power3.out" },
            0
          )
          // slow drift for as long as the slide is on screen
          .to(photo, { scale: 1.38, duration: 7, ease: "none" }, 1.4)
          .fromTo(
            ring,
            { scale: 0.9, opacity: 0, rotate: dir * -25 },
            { scale: 1, opacity: 1, rotate: 0, duration: 1.3, ease: "power3.out" },
            0.1
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
      });
    }, rootRef);

    prevIndex.current = index;
    return () => ctx.revert();
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

  // --- touch swipe --------------------------------------------------------
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
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
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1));
      x0 = null;
    };

    root.addEventListener("touchstart", start, { passive: true });
    root.addEventListener("touchend", end, { passive: true });
    return () => {
      root.removeEventListener("touchstart", start);
      root.removeEventListener("touchend", end);
    };
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

      gsap.to(slide.querySelector(".lh-frame-wrap"), {
        x: dx * 20,
        y: dy * 15,
        duration: 0.9,
        ease: "power2.out",
      });
    };

    root.addEventListener("mousemove", onMove);
    return () => root.removeEventListener("mousemove", onMove);
  }, [index]);

  return (
    <section
      ref={rootRef}
      // svh, not vh — vh ignores the mobile browser's address bar and pushes
      // the arrows off-screen on phones
      className="relative h-screen w-full overflow-hidden bg-black [height:100svh]"
      aria-roledescription="carousel"
    >
      {/* ================= SLIDES ================= */}
      {SLIDES.map((slide, i) => (
        <div
          key={slide.key}
          ref={(el) => {
            slideRefs.current[i] = el;
          }}
          className="absolute inset-0 bg-black opacity-0"
          aria-hidden={i !== index}
        >
          {/* --- z-0 : the same photo, full-bleed and sharp, as the backdrop.
                 The circle above it is a square crop of the same shot, so the
                 two never read as one flat image. --- */}
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={slide.image}
              alt=""
              aria-hidden
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
            {/* scrim does the separating now that there is no blur: backdrop
                sits ~45% down while the circle stays at full brightness, so
                the circle pops and both stay sharp */}
            <div className="absolute inset-0 bg-black/55" />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-black/5 to-transparent" />
          </div>

          {/* --- z-10 : giant word, sits BEHIND the circle.
                 On mobile the whole composition moves up, so the word is
                 pinned to the circle's centre instead of the viewport's. --- */}
          <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center pt-[27vh] md:items-center md:pt-0">
            {/* 25vw on phones so the word is WIDER than the circle and its
                outer letters still read — at 19vw it hid behind the circle */}
            <h2
              // drop-shadow, not text-shadow: the glyphs are a clipped
              // background, and this keeps them legible over the bright
              // daytime slides where white-on-lawn washes out
              className="lh-word select-none whitespace-nowrap text-[25vw] leading-none drop-shadow-[0_8px_28px_rgba(0,0,0,0.55)] md:text-[clamp(5rem,19vw,18rem)]"
              style={{
                fontFamily: SERIF,
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

          {/* --- z-20 : circular photo, covers the middle of the word --- */}
          <div className="lh-frame-wrap pointer-events-none absolute inset-0 z-20 flex items-start justify-center pt-[17vh] md:items-center md:pt-0">
            {/* mobile sizes off the WIDTH (62vw) — sizing off vh here made the
                circle wider than the phone and blew out the layout */}
            <div className="lh-frame relative h-[62vw] w-[62vw] md:h-[68vh] md:max-h-[720px] md:w-[68vh] md:max-w-[720px]">
              {/* thin orbit ring — gives the entrance a visible spin without
                  ever tilting the photo itself */}
              <div className="lh-ring absolute -inset-[3vw] rounded-full border border-white/25 md:-inset-[2.5vh]" />

              <div
                className="absolute inset-0 overflow-hidden rounded-full"
                style={{ boxShadow: "0 50px 130px rgba(0,0,0,0.55)" }}
              >
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  priority={i === 0}
                  sizes="(max-width: 768px) 84vw, 720px"
                  className="lh-photo object-cover"
                />
              </div>
            </div>
          </div>

          {/* --- z-40 : copy --- */}
          <div className="lh-copy absolute inset-x-[5vw] bottom-[17vh] z-40 md:inset-x-auto md:bottom-[8vh] md:left-[4vw] md:max-w-xl">
            <h3
              className="text-3xl text-white md:text-5xl"
              style={{ fontFamily: SERIF, fontWeight: 700 }}
            >
              {slide.title}
            </h3>
            <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-white/80 md:mt-4 md:text-lg">
              {slide.desc}
            </p>
            <a
              href="#work"
              className="mt-5 inline-flex items-center gap-3 rounded-md bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:scale-105 md:mt-7 md:px-7 md:py-4"
            >
              See this project
              <span aria-hidden>↗</span>
            </a>
          </div>
        </div>
      ))}

      {/* ================= NAVBAR ================= */}
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
          <a href="/" className={`${NAV_LINK} bg-white text-black`}>
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

      {/* ================= ARROWS ================= */}
      <div className="absolute bottom-[4vh] right-[5vw] z-50 flex items-center gap-8 md:bottom-[6vh] md:right-[4vw]">
        <div className="hidden items-center gap-4 text-sm text-white/70 [text-shadow:0_2px_10px_rgba(0,0,0,0.7)] sm:flex">
          <span className="text-2xl text-white" style={{ fontFamily: SERIF }}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="h-px w-10 bg-white/30" />
          <span>{String(SLIDES.length).padStart(2, "0")}</span>
        </div>

        <div className="flex gap-3 md:gap-4">
          <ArrowButton label="Previous project" onClick={() => go(index - 1)} dir="left" />
          <ArrowButton label="Next project" onClick={() => go(index + 1)} dir="right" />
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

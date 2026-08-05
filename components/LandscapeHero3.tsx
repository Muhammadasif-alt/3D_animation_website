"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import HeroLinksMenu from "@/components/HeroLinksMenu";

/**
 * LandscapeHero3 — product-showcase layout, adapted for landscape work.
 *
 *   ┌──────────────── nav ────────────────┐
 *   │  ‹ ›                                │
 *   │  HEADING          [ 3D image ]   01 │
 *   │  paragraph                       05 │
 *   │  [button]                           │
 *   │  socials                    [thumb] │   ← square, shows the NEXT slide
 *   └─────────────────────────────────────┘
 *
 * Everything the reference had that does not apply to landscape is gone:
 * no size picker, no price, no caption under the image.
 *
 * The background colour is tweened per slide (GSAP interpolates
 * backgroundColor), and the centre image is a perspective card that tilts with
 * the pointer — that is what sells the "3D" feel rather than a flat swap.
 */

type Slide = {
  key: string;
  /** two lines — they stack in the heading */
  headline: [string, string];
  desc: string;
  /** flat backdrop for this slide; all are dark enough for white text */
  bg: string;
  image: string;
};

const SLIDES: Slide[] = [
  {
    key: "estate",
    headline: ["Light the", "whole estate"],
    desc: "Whole-property lighting design that turns architecture, driveways, and planting into one composed night-time scene.",
    bg: "#16263F",
    image: "/images/landscape/estate-aerial.png",
  },
  {
    key: "garden",
    headline: ["Every tree", "becomes a sculpture"],
    desc: "Warm uplighting on mature trees and grazed shrub beds — depth you only ever see after dark.",
    bg: "#14331E",
    image: "/images/landscape/garden-uplighting.png",
  },
  {
    key: "driveway",
    headline: ["Arrive to", "a warm welcome"],
    desc: "Path lights and façade washes that guide you in without ever glaring into the street.",
    bg: "#7A3F10",
    image: "/images/landscape/driveway-night.png",
  },
  {
    key: "living",
    headline: ["Rooms", "without a roof"],
    desc: "Fire pits, sunken seating, and layered planting — built to work in every season, not just in July.",
    bg: "#4A4438",
    image: "/images/landscape/outdoor-living.jpg",
  },
  {
    key: "design",
    headline: ["From bare lawn", "to finished garden"],
    desc: "Full landscape design and construction: hardscape, structures, planting, and the irrigation nobody ever sees.",
    bg: "#1F5B2A",
    image: "/images/landscape/backyard-design.jpg",
  },
];

/** ms between auto-advances; 0 disables autoplay */
const AUTOPLAY_MS = 6000;

/** how strongly the backdrop photo shows through its slide colour */
const BG_OPACITY = 0.48;

const NAV_LINK = "rounded-full px-6 py-2.5 text-xs uppercase tracking-wide transition";

export default function LandscapeHero3() {
  const rootRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const copyRefs = useRef<(HTMLDivElement | null)[]>([]);
  const thumbRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const bgRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tiltRef = useRef<HTMLDivElement>(null);
  const prevIndex = useRef(0);
  const [index, setIndex] = useState(0);

  const go = (dir: 1 | -1) =>
    setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length);

  const nextIndex = (index + 1) % SLIDES.length;

  // --- background colour + card / copy transition -------------------------
  useEffect(() => {
    const dir = index >= prevIndex.current ? 1 : -1;

    // deliberately OUTSIDE the context: ctx.revert() would snap the backdrop
    // back to slide 0's colour on every change
    gsap.to(rootRef.current, {
      backgroundColor: SLIDES[index].bg,
      duration: 0.9,
      ease: "power2.inOut",
      overwrite: true,
    });

    const ctx = gsap.context(() => {
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const active = i === index;
        gsap.set(card, { zIndex: active ? 2 : 1, pointerEvents: "none" });

        if (!active) {
          gsap.to(card, {
            autoAlpha: 0,
            scale: 0.86,
            rotateY: -dir * 18,
            duration: 0.55,
            ease: "power2.in",
            overwrite: true,
          });
          return;
        }

        gsap.fromTo(
          card,
          { autoAlpha: 0, scale: 0.82, rotateY: dir * 26, y: 40 },
          {
            autoAlpha: 1,
            scale: 1,
            rotateY: 0,
            y: 0,
            duration: 1.05,
            ease: "power3.out",
            overwrite: true,
          }
        );
      });

      // backdrop photo cross-fade — lands at BG_OPACITY, never full strength
      bgRefs.current.forEach((bg, i) => {
        if (!bg) return;
        gsap.to(bg, {
          opacity: i === index ? BG_OPACITY : 0,
          duration: 0.9,
          ease: "power2.inOut",
          overwrite: true,
        });
      });

      // thumbnail ticker: outgoing exits upward, incoming rises from below
      const leaving = (prevIndex.current + 1) % SLIDES.length;
      thumbRefs.current.forEach((thumb, i) => {
        if (!thumb) return;
        if (i === nextIndex) {
          gsap.fromTo(
            thumb,
            { yPercent: 100 },
            { yPercent: 0, duration: 0.75, ease: "power3.out", overwrite: true }
          );
        } else if (i === leaving) {
          gsap.to(thumb, { yPercent: -100, duration: 0.75, ease: "power3.out", overwrite: true });
        } else {
          gsap.set(thumb, { yPercent: 100 });
        }
      });

      copyRefs.current.forEach((copy, i) => {
        if (!copy) return;
        const active = i === index;
        if (!active) {
          gsap.to(copy, { autoAlpha: 0, duration: 0.35, ease: "power2.in", overwrite: true });
          return;
        }
        gsap.set(copy, { autoAlpha: 1 });
        gsap.fromTo(
          copy.children,
          { autoAlpha: 0, y: 30 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.08,
            ease: "power3.out",
            overwrite: true,
          }
        );
      });
    }, rootRef);

    prevIndex.current = index;
    return () => ctx.revert();
  }, [index]);

  // --- autoplay -----------------------------------------------------------
  useEffect(() => {
    if (!AUTOPLAY_MS) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [index]);

  // --- keyboard + swipe ---------------------------------------------------
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

  // --- pointer tilt (the 3D part) -----------------------------------------
  useEffect(() => {
    const root = rootRef.current;
    const tilt = tiltRef.current;
    if (!root || !tilt) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover:hover)").matches) return;

    const onMove = (e: MouseEvent) => {
      const { width, height } = root.getBoundingClientRect();
      const dx = (e.clientX / width - 0.5) * 2;
      const dy = (e.clientY / height - 0.5) * 2;
      gsap.to(tilt, {
        rotateY: dx * 9,
        rotateX: -dy * 6,
        x: dx * 14,
        duration: 0.9,
        ease: "power2.out",
      });
    };
    const onLeave = () =>
      gsap.to(tilt, { rotateY: 0, rotateX: 0, x: 0, duration: 1.1, ease: "power2.out" });

    root.addEventListener("mousemove", onMove);
    root.addEventListener("mouseleave", onLeave);
    return () => {
      root.removeEventListener("mousemove", onMove);
      root.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative h-screen w-full overflow-hidden text-white [height:100svh]"
      style={{ backgroundColor: SLIDES[0].bg }}
      aria-roledescription="carousel"
    >
      {/* ================= z-0 — the slide's own photo as the backdrop =======
           Sits at ~38% over the slide's colour, so the tint still comes
           through and white text stays readable. scale-105 pushes the blurred
           edge past the viewport. */}
      {SLIDES.map((slide, i) => (
        <div
          key={slide.key}
          ref={(el) => {
            bgRefs.current[i] = el;
          }}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-0"
        >
          <Image
            src={slide.image}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            className="scale-105 object-cover blur-[5px]"
          />
        </div>
      ))}

      {/* darkens top-left only — where the copy sits on desktop AND on mobile —
          so the bright daytime slides don't wash the paragraph out */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-black/55 via-black/10 to-transparent"
      />

      {/* ================= NAVBAR ================= */}
      <header className="absolute inset-x-0 top-0 z-50 flex items-center justify-between px-[5vw] py-5 md:px-[4vw] md:py-6">
        {/* 👉 apna brand name yahan */}
        <a href="/" className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded bg-white text-[11px] font-bold text-black">
            LM
          </span>
          <span className="font-display text-base tracking-[0.18em] md:text-lg">
            LUMEN LANDSCAPES
          </span>
        </a>

        <nav className="hidden rounded-full bg-black/25 p-1.5 backdrop-blur-sm lg:flex">
          <a href="/" className={`${NAV_LINK} bg-white text-black`}>
            Projects
          </a>
          <HeroLinksMenu triggerClassName={`${NAV_LINK} text-white/85 hover:bg-white/10`} />
          <a href="#about-us" className={`${NAV_LINK} text-white/85 hover:bg-white/10`}>
            About Us
          </a>
          <a href="#contact" className={`${NAV_LINK} text-white/85 hover:bg-white/10`}>
            Contact
          </a>
        </nav>

        <div className="flex gap-2 md:gap-3">
          <IconButton label="Saved projects">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8Z" />
          </IconButton>
          <IconButton label="Enquiries">
            <path d="M4 4h16v16H4z" />
            <path d="m4 6 8 6 8-6" />
          </IconButton>
        </div>
      </header>

      {/* ================= LEFT — arrows, heading, button ================= */}
      {/* on phones the copy sits ABOVE the image; on desktop it is the left column */}
      <div className="absolute inset-x-[5vw] top-[13vh] z-40 md:inset-x-auto md:left-[4vw] md:top-1/2 md:w-[38vw] md:max-w-xl md:-translate-y-1/2">
        <div className="relative">
          {SLIDES.map((slide, i) => (
            <div
              key={slide.key}
              ref={(el) => {
                copyRefs.current[i] = el;
              }}
              aria-hidden={i !== index}
              // stacked so the block never reflows as the text length changes
              className={i === 0 ? "relative" : "absolute inset-x-0 top-0 opacity-0"}
            >
              <h1 className="font-display text-[2.1rem] font-semibold leading-[1.08] md:text-6xl">
                {slide.headline[0]}
                <br />
                {slide.headline[1]}
              </h1>
              <p className="mt-4 max-w-md text-[13px] leading-relaxed text-white/75 md:mt-6 md:text-[15px]">
                {slide.desc}
              </p>
              <a
                href="#work"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-105 md:mt-8"
              >
                View the project
                <span aria-hidden>›</span>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* ================= CENTRE — the 3D image ================= */}
      <div
        className="pointer-events-none absolute inset-x-0 top-[44vh] z-30 flex justify-center md:inset-y-0 md:left-[38vw] md:right-[14vw] md:top-0 md:items-center"
        style={{ perspective: "1400px" }}
      >
        <div ref={tiltRef} className="relative w-[80vw] md:w-full" style={{ transformStyle: "preserve-3d" }}>
          {/* contact shadow on the ground */}
          <div
            aria-hidden
            className="absolute inset-x-[12%] -bottom-6 h-10 rounded-[50%] blur-2xl md:-bottom-10 md:h-14"
            style={{ background: "rgba(0,0,0,0.55)" }}
          />

          {SLIDES.map((slide, i) => (
            <div
              key={slide.key}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              aria-hidden={i !== index}
              className={`${
                i === 0 ? "relative" : "absolute inset-0 opacity-0"
              } overflow-hidden rounded-2xl`}
              style={{ boxShadow: "0 45px 90px rgba(0,0,0,0.5)" }}
            >
              <div className="relative aspect-[4/3] w-full md:aspect-[16/10]">
                <Image
                  src={slide.image}
                  alt={`${slide.headline[0]} ${slide.headline[1]}`}
                  fill
                  priority={i === 0}
                  sizes="(max-width: 768px) 80vw, 48vw"
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= BOTTOM RIGHT — square next thumbnail ================= */}
      <button
        type="button"
        onClick={() => go(1)}
        aria-label={`Next project: ${SLIDES[nextIndex].headline.join(" ")}`}
        className="group absolute bottom-[3vh] right-[5vw] z-40 h-20 w-20 overflow-hidden rounded-xl ring-1 ring-white/25 transition hover:ring-white/70 md:bottom-[4vh] md:right-[4vw] md:h-28 md:w-28"
      >
        {/* all five stacked and clipped by the square — on each change the
            outgoing one slides up and out while the next rises in from below,
            so the thumbnail reads as travelling upward into the main stage */}
        {SLIDES.map((slide, i) => (
          <span
            key={slide.key}
            ref={(el) => {
              thumbRefs.current[i] = el;
            }}
            aria-hidden
            className="absolute inset-0 block"
          >
            <Image
              src={slide.image}
              alt=""
              fill
              sizes="112px"
              className="object-cover transition duration-500 group-hover:scale-110"
            />
          </span>
        ))}
        <span className="pointer-events-none absolute inset-0 bg-black/25 transition group-hover:bg-black/10" />
      </button>
    </section>
  );
}

function IconButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-full bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/40 md:h-11 md:w-11"
    >
      <svg
        width="18"
        height="18"
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

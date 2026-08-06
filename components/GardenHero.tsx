"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/**
 * GardenHero — full-bleed photo hero inset inside a rounded border.
 *
 * Layout mirrors the reference exactly:
 *
 *   ┌─ rounded inset ────────────────────────────────┐
 *   │ @leaflife   ABOUT SERVICES ...      ⌕      500+│
 *   │                                                │
 *   │ CREATE YOUR                                    │
 *   │ DREAM GARDEN                                   │
 *   │ paragraph                                      │
 *   │ [Get Started] [Explore Projects]               │
 *   │                                                │
 *   │ 01 ────────── 03            ┌ project card ┐   │
 *   └────────────────────────────────────────────────┘
 *
 * The headline stays put across slides — only the photo, the project card and
 * the counter change, which is how the reference reads.
 */

type Slide = {
  key: string;
  image: string;
  place: string;
  note: string;
};

const SLIDES: Slide[] = [
  {
    key: "courtyard",
    image: "/images/Hero_1.png",
    place: "Tropical Courtyard",
    note: "Layered palms and cut stone, planted for shade that works all day long.",
  },
  {
    key: "glasshouse",
    image: "/images/Hero_2.png",
    place: "The Glasshouse",
    note: "A propagation house we built and stocked as part of our nursery commission.",
  },
  {
    key: "hachioji",
    image: "/images/Hero_3.png",
    place: "Hachioji Garden",
    note: "We design Hachioji Garden as a part of our new Landscape Design Commission in the country.",
  },
];

/** ms between auto-advances; 0 disables autoplay */
const AUTOPLAY_MS = 5500;

export default function GardenHero() {
  const rootRef = useRef<HTMLElement>(null);
  const shotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const railRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const go = (dir: 1 | -1) =>
    setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length);

  // --- slide change ---------------------------------------------------------
  useEffect(() => {
    const ctx = gsap.context(() => {
      shotRefs.current.forEach((shot, i) => {
        if (!shot) return;
        const active = i === index;
        gsap.set(shot, { zIndex: active ? 2 : 1 });
        if (active) {
          gsap.fromTo(
            shot,
            { autoAlpha: 0, scale: 1.08 },
            { autoAlpha: 1, scale: 1, duration: 1.2, ease: "power3.out", overwrite: true }
          );
        } else {
          gsap.to(shot, { autoAlpha: 0, duration: 0.8, ease: "power2.inOut", overwrite: true });
        }
      });

      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        if (i === index) {
          gsap.set(card, { autoAlpha: 1 });
          gsap.fromTo(
            card.children,
            { autoAlpha: 0, y: 22 },
            { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.07, ease: "power3.out", overwrite: true }
          );
        } else {
          gsap.to(card, { autoAlpha: 0, duration: 0.3, ease: "power2.in", overwrite: true });
        }
      });

      gsap.to(railRef.current, {
        scaleX: (index + 1) / SLIDES.length,
        duration: 0.8,
        ease: "power3.out",
        overwrite: true,
      });
    }, rootRef);

    return () => ctx.revert();
  }, [index]);

  // --- intro reveal (once, on mount) ---------------------------------------
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".gh-line", { yPercent: 115, duration: 1.1, stagger: 0.09 }, 0.15)
        .from(".gh-in", { autoAlpha: 0, y: 26, duration: 0.8, stagger: 0.1 }, 0.55)
        .from(".gh-nav > *", { autoAlpha: 0, y: -14, duration: 0.6, stagger: 0.06 }, 0.1)
        // the two glass cards slide in from the edge they sit against
        .from(".gh-clients", { autoAlpha: 0, x: 40, duration: 0.8 }, 0.7)
        .from(".gh-project", { autoAlpha: 0, x: 40, duration: 0.8 }, 0.8)
        .from(".gh-counter", { autoAlpha: 0, x: -30, duration: 0.8 }, 0.8);
    }, root);

    return () => ctx.revert();
  }, []);

  // --- scroll: photo parallax + content drifting away ----------------------
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ctx: gsap.Context;
    let killed = false;

    // ScrollTrigger is only needed once the user can actually scroll, so it is
    // loaded on demand rather than shipped with the hero's first paint
    import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
      if (killed) return;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const scrub = {
          trigger: root,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        };

        // photo drifts slower than the page
        gsap.to(parallaxRef.current, { yPercent: 9, ease: "none", scrollTrigger: scrub });

        // copy lifts away and dims
        gsap.to(".gh-copy", {
          y: -70,
          autoAlpha: 0,
          ease: "none",
          scrollTrigger: { ...scrub, end: "60% top" },
        });

        // the card recedes: shrinks a touch and rounds off further
        gsap.to(root, {
          scale: 0.94,
          borderRadius: 48,
          ease: "none",
          scrollTrigger: scrub,
        });
      }, root);
    });

    return () => {
      killed = true;
      ctx?.revert();
    };
  }, []);

  // --- autoplay -------------------------------------------------------------
  useEffect(() => {
    if (!AUTOPLAY_MS) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [index]);

  // --- keyboard + swipe -----------------------------------------------------
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
    // the page keeps a light margin all round, so the hero reads as an inset
    // rounded card rather than a full-bleed banner
    <div className="bg-[#f3f3ef] p-2.5 md:p-3.5">
      <section
        ref={rootRef}
        className="relative w-full overflow-hidden rounded-[22px] bg-black md:rounded-[30px] [height:calc(100svh-20px)] md:[height:calc(100svh-28px)]"
        aria-roledescription="carousel"
        aria-label="Our gardens"
      >
        {/* ---------------- photos ----------------
             Wrapped so scroll parallax moves the whole stack; the per-slide
             tweens keep control of the individual shots inside. Oversized by
             16% so drifting it up never exposes an empty strip. */}
        <div ref={parallaxRef} className="absolute inset-x-0 -top-[8%] h-[116%]">
          {SLIDES.map((slide, i) => (
            <div
              key={slide.key}
              ref={(el) => {
                shotRefs.current[i] = el;
              }}
              aria-hidden={i !== index}
              className={`absolute inset-0 ${i === 0 ? "" : "opacity-0"}`}
            >
              <Image
                src={slide.image}
                alt={slide.place}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {/* legibility wash — strongest top-left where the nav and headline sit */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-br from-black/70 via-black/30 to-black/45" />

        {/* ---------------- nav ---------------- */}
        <header className="gh-nav absolute inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-5 md:px-10 md:py-7">
          <a href="/" className="text-sm text-white/90 md:text-base">
            @leaflife
          </a>

          <nav className="hidden gap-9 lg:flex">
            {["About", "Services", "Projects", "Contact"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-xs uppercase tracking-[0.12em] text-white/85 transition hover:text-white"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex gap-4 text-white/85">
            <button aria-label="Account" className="transition hover:text-white">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
              </svg>
            </button>
            <button aria-label="Search" className="transition hover:text-white">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4.5 4.5" />
              </svg>
            </button>
          </div>
        </header>

        {/* ---------------- 500+ clients card ---------------- */}
        <div className="gh-clients absolute right-5 top-[74px] z-40 hidden min-w-[210px] rounded-2xl bg-black/35 px-7 py-5 backdrop-blur-md md:right-10 md:top-24 md:block">
          <p className="text-xl font-semibold text-white md:text-2xl">500+</p>
          <p className="mt-0.5 text-[11px] text-white/70">Satisfied Clients</p>
          {/* outlined rings, lightly overlapped — filled discs at -8px read as
              one blob rather than three avatars */}
          <div className="mt-3 flex">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                aria-hidden
                className="h-7 w-7 rounded-full border border-white/55 bg-white/10 backdrop-blur-sm"
                style={{ marginLeft: i === 0 ? 0 : -9 }}
              />
            ))}
          </div>
        </div>

        {/* ---------------- headline ---------------- */}
        <div className="gh-copy absolute inset-x-5 top-[26%] z-30 md:inset-x-auto md:left-10 md:top-1/2 md:max-w-3xl md:-translate-y-1/2">
          {/* each line sits in its own clip window so it can rise out from
              behind the one above — a plain fade doesn't read as deliberate */}
          <h1 className="font-display text-[2.6rem] font-medium uppercase leading-[0.98] tracking-[-0.01em] text-white sm:text-6xl md:text-7xl lg:text-8xl">
            {["Create your", "Dream Garden"].map((line) => (
              <span key={line} className="block overflow-hidden pb-[0.06em]">
                <span className="gh-line block">{line}</span>
              </span>
            ))}
          </h1>
          <p className="gh-in mt-5 max-w-lg text-[13px] leading-relaxed text-white/75 md:mt-6 md:text-[15px]">
            Crafting dream gardens with passion, creativity, and sustainability for over
            a decade with our experienced landscape artists and gardener teams.
          </p>
          <div className="gh-in mt-7 flex flex-wrap items-center gap-3 md:mt-9 md:gap-4">
            <a
              href="#start"
              className="rounded-md bg-white px-7 py-3.5 text-sm font-medium text-black transition hover:scale-105"
            >
              Get Started
            </a>
            <a
              href="#projects"
              className="rounded-md px-7 py-3.5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Explore Projects
            </a>
          </div>
        </div>

        {/* ---------------- slide counter ---------------- */}
        <div className="gh-counter absolute bottom-6 left-5 z-40 flex items-center gap-4 md:bottom-10 md:left-10">
          <span className="text-xs text-white">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="relative block h-px w-28 bg-white/30 md:w-40">
            <span ref={railRef} className="absolute inset-0 block origin-left scale-x-0 bg-white" />
          </span>
          <span className="text-xs text-white/60">
            {String(SLIDES.length).padStart(2, "0")}
          </span>
        </div>

        {/* ---------------- project card ---------------- */}
        <div className="gh-project absolute bottom-20 left-5 right-5 z-40 md:bottom-10 md:left-auto md:right-10 md:w-[330px]">
          <div className="relative rounded-2xl bg-black/35 p-5 backdrop-blur-md">
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next garden"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-lg bg-white/15 text-white transition hover:bg-white hover:text-black"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </button>

            {SLIDES.map((slide, i) => (
              <div
                key={slide.key}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                aria-hidden={i !== index}
                className={`${i === 0 ? "relative" : "absolute inset-x-5 top-5"} pr-12 ${
                  i === 0 ? "" : "opacity-0"
                }`}
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="2.6" />
                  </svg>
                </span>
                <h2 className="mt-3 text-base font-semibold text-white">{slide.place}</h2>
                <p className="mt-1.5 text-xs leading-relaxed text-white/65">{slide.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

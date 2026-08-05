"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * FlavorScrollSection — pinned, scroll-driven product list.
 *
 * The section pins for (steps × 100%) of scroll. As you travel through it the
 * step index advances and everything swaps together: the big number, the copy,
 * the backdrop colour, and the bowl image.
 *
 * The bowl is the point: the incoming product rises into the same spot the
 * previous one just left, so it reads as one shelf of products cycling through
 * a single frame rather than four separate blocks stacked down the page.
 *
 * NOTE: this must be the only pinned/GSAP block on its page alongside the hero
 * — two pinned sections in one route previously stopped the page's client JS.
 */

type Product = {
  key: string;
  title: string;
  desc: string;
  price: string;
  /** flat backdrop for this step */
  bg: string;
  image: string;
};

const PRODUCTS: Product[] = [
  {
    key: "strawberry",
    title: "Berry Pure",
    desc: "Fresh strawberries, creamy scoops, and white chocolate pieces in one smooth, dreamy dessert.",
    price: "$6.50",
    bg: "#B00A38",
    image: "/images/bowl-strawberry.webp",
  },
  {
    key: "berries",
    title: "Blue Bliss",
    desc: "A smooth and refreshing blueberry ice cream made with ripe berries, churned slow and served cold.",
    price: "$6.90",
    bg: "#5E0BA8",
    image: "/images/bowl-berries.webp",
  },
  {
    key: "banana",
    title: "Banana Crush",
    desc: "Creamy banana folded through white chocolate chunks — the one the regulars come back for.",
    price: "$6.20",
    bg: "#C08A00",
    image: "/images/bowl-banana.webp",
  },
  {
    key: "kiwi",
    title: "Kiwi Flavor",
    desc: "Bright, tart kiwi balanced with vanilla cream. Light enough to finish, rich enough to remember.",
    price: "$6.70",
    bg: "#1B7A22",
    image: "/images/bowl-kiwi.webp",
  },
];

export default function FlavorScrollSection() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const steps = gsap.utils.toArray<HTMLElement>(".fs-step", root);
    const bowls = gsap.utils.toArray<HTMLElement>(".fs-bowl", root);
    const bgs = gsap.utils.toArray<HTMLElement>(".fs-bg", root);
    const total = PRODUCTS.length;

    // Reduced motion: drop the pin entirely and lay the products out as a
    // plain vertical list instead of animating between them.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set([steps, bowls], { opacity: 1, y: 0, scale: 1 });
      gsap.set(bgs[0], { opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      let current = -1;

      const show = (i: number) => {
        if (i === current) return;
        const dir = i > current ? 1 : -1;
        current = i;

        bgs.forEach((bg, k) =>
          gsap.to(bg, { opacity: k === i ? 1 : 0, duration: 0.5, ease: "power2.out", overwrite: true })
        );

        steps.forEach((step, k) => {
          if (k !== i) {
            gsap.to(step, { autoAlpha: 0, duration: 0.3, ease: "power2.in", overwrite: true });
            return;
          }
          gsap.set(step, { autoAlpha: 1 });
          gsap.fromTo(
            step.children,
            { autoAlpha: 0, y: 34 * dir },
            { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.06, ease: "power3.out", overwrite: true }
          );
        });

        // the bowl hand-off: outgoing leaves the frame, incoming rises into
        // the exact spot it vacated
        bowls.forEach((bowl, k) => {
          if (k !== i) {
            gsap.to(bowl, {
              autoAlpha: 0,
              y: -60 * dir,
              scale: 0.82,
              rotate: -12 * dir,
              duration: 0.45,
              ease: "power2.in",
              overwrite: true,
            });
            return;
          }
          gsap.fromTo(
            bowl,
            { autoAlpha: 0, y: 90 * dir, scale: 0.8, rotate: 16 * dir },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              rotate: 0,
              duration: 0.85,
              ease: "power3.out",
              overwrite: true,
            }
          );
        });
      };

      ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: `+=${total * 100}%`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // clamp so the last step doesn't flicker away at progress === 1
          const i = Math.min(total - 1, Math.floor(self.progress * total));
          show(i);
          gsap.set(".fs-progress", { scaleY: self.progress });
        },
      });

      show(0);
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative h-screen w-full overflow-hidden bg-[#0b0b0b] text-white [height:100svh]"
      aria-label="Our flavours"
    >
      {/* ---- backdrops, one per product, cross-faded ---- */}
      {PRODUCTS.map((p) => (
        <div
          key={p.key}
          aria-hidden
          className="fs-bg pointer-events-none absolute inset-0 z-0 opacity-0"
          style={{
            background: `radial-gradient(125% 105% at 25% 35%, ${p.bg} 0%, ${shade(p.bg)} 70%)`,
          }}
        />
      ))}

      {/* ---- section label ---- */}
      <p className="absolute left-[6vw] top-[9vh] z-30 text-[11px] font-bold uppercase tracking-[0.32em] text-white/60 md:left-[5vw]">
        Our Flavours
      </p>

      {/* ---- copy, one block per product, stacked ---- */}
      <div className="absolute inset-x-[6vw] top-[52vh] z-30 md:inset-x-auto md:left-[5vw] md:top-1/2 md:w-[42vw] md:max-w-xl md:-translate-y-1/2">
        {PRODUCTS.map((p, i) => (
          <div
            key={p.key}
            aria-hidden={i !== 0}
            className={`fs-step ${i === 0 ? "relative" : "absolute inset-x-0 top-0"} opacity-0`}
          >
            <span className="font-display block text-[5.5rem] font-bold leading-none text-white/90 md:text-[9rem]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="font-display mt-2 text-3xl font-semibold leading-tight md:mt-4 md:text-5xl">
              {p.title}
            </h3>
            <p className="mt-3 max-w-md text-[14px] leading-relaxed text-white/75 md:mt-5 md:text-base">
              {p.desc}
            </p>
            <div className="mt-5 flex items-center gap-5 md:mt-7">
              <a
                href="#shop"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-105"
              >
                Add to cart
              </a>
              <span className="font-display text-xl">{p.price}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ---- bowls, stacked in one frame ---- */}
      <div className="pointer-events-none absolute inset-x-0 top-[8vh] z-20 flex justify-center md:inset-y-0 md:left-[46vw] md:right-[8vw] md:top-0 md:items-center">
        <div className="relative aspect-square w-[62vw] md:w-full md:max-w-[560px]">
          {PRODUCTS.map((p) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={p.key}
              src={p.image}
              alt={p.title}
              draggable={false}
              className="fs-bowl absolute inset-0 h-full w-full object-contain opacity-0"
            />
          ))}
        </div>
      </div>

      {/* ---- scroll progress rail ---- */}
      <div className="absolute right-[4vw] top-1/2 z-30 hidden h-40 w-px -translate-y-1/2 bg-white/20 md:block">
        <div className="fs-progress h-full w-full origin-top scale-y-0 bg-white" />
      </div>
    </section>
  );
}

/** darker partner for the radial gradient's outer stop */
function shade(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * 0.45);
  const g = Math.round(((n >> 8) & 255) * 0.45);
  const b = Math.round((n & 255) * 0.45);
  return `rgb(${r}, ${g}, ${b})`;
}

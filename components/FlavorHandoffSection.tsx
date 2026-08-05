"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FLAVORS, getFlavor, subscribeFlavor } from "@/lib/flavorStore";

gsap.registerPlugin(ScrollTrigger);

/**
 * FlavorHandoffSection — a row of four product cards where ONE slot is empty.
 *
 * The empty slot always belongs to whichever flavour the hero above is
 * currently showing. As you scroll out of the hero, that exact bowl descends
 * from the hero's position and shrinks into its slot, filling the row.
 *
 * The flying bowl lives INSIDE its slot at natural size; scroll drives it
 * backwards from a large, high, off-slot start. Doing it that way means the
 * landing position is whatever the layout says it is — no measuring, and it
 * survives resizes and font loading without recalculation.
 */

/** how far above the slot the bowl starts, as a share of viewport height */
const DROP_FROM = 0.72;
/** how much bigger it is up at the hero */
const DROP_SCALE = 2.4;
/** how long the section stays pinned while the bowl lands */
const PIN_LENGTH = "110%";

export default function FlavorHandoffSection() {
  const rootRef = useRef<HTMLElement>(null);
  const flyRef = useRef<HTMLImageElement>(null);
  const [active, setActive] = useState(0);

  // follow the hero's current flavour
  useEffect(() => {
    setActive(getFlavor());
    return subscribeFlavor(setActive);
  }, []);

  // scroll-driven descent
  useEffect(() => {
    const root = rootRef.current;
    const fly = flyRef.current;
    if (!root || !fly) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(fly, { y: 0, scale: 1, autoAlpha: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      // The section pins so it holds still while the bowl comes down, instead
      // of the landing flying past mid-scroll. The tween occupies the first
      // 65% of the pinned window; the rest is a beat where the filled row just
      // sits there before the page moves on.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: `+=${PIN_LENGTH}`,
          pin: true,
          anticipatePin: 1,
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      });

      tl.fromTo(
        fly,
        {
          y: () => -window.innerHeight * DROP_FROM,
          scale: DROP_SCALE,
          autoAlpha: 1,
          rotate: -8,
        },
        { y: 0, scale: 1, rotate: 0, duration: 0.65, ease: "none" }
      ).to({}, { duration: 0.35 });
    }, root);

    return () => ctx.revert();
  }, [active]);

  return (
    <section
      ref={rootRef}
      // full viewport height so the pinned state fills the screen rather than
      // holding a part-height block
      className="relative flex w-full flex-col justify-center overflow-hidden bg-[#0d0d0d] px-[5vw] py-[10vh] text-white [min-height:100svh]"
      aria-label="Pick your next flavour"
    >
      <div className="mb-12 flex flex-wrap items-end justify-between gap-4 md:mb-16">
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.32em] text-white/55">
            The Line-Up
          </p>
          <h2
            className="text-4xl font-semibold leading-tight md:text-6xl"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Four tubs. One&nbsp;shelf.
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-white/60">
          Scroll and the flavour you were just looking at drops straight into its
          place on the shelf.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {FLAVORS.map((flavor, i) => {
          const isSlot = i === active;
          return (
            <article
              key={flavor.key}
              className="relative overflow-hidden rounded-3xl p-5 md:p-6"
              style={{
                background: isSlot
                  ? "rgba(255,255,255,0.045)"
                  : `linear-gradient(160deg, ${flavor.bg}, ${flavor.bg}99)`,
                // the waiting slot reads as an outline until it's filled
                boxShadow: isSlot ? "inset 0 0 0 2px rgba(255,255,255,0.18)" : "none",
              }}
            >
              <div className="relative aspect-square w-full">
                {isSlot ? (
                  <>
                    {/* the landing pad */}
                    <span
                      aria-hidden
                      className="absolute inset-[12%] rounded-full border border-dashed border-white/25"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      ref={flyRef}
                      key={flavor.key}
                      src={flavor.image}
                      alt={flavor.name}
                      draggable={false}
                      className="absolute inset-0 h-full w-full object-contain opacity-0 drop-shadow-[0_30px_45px_rgba(0,0,0,0.55)]"
                    />
                  </>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={flavor.image}
                    alt={flavor.name}
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                )}
              </div>

              <div className="mt-4 flex items-baseline justify-between gap-2">
                <h3 className="text-base font-semibold md:text-lg">{flavor.name}</h3>
                <span className="text-sm text-white/70">{flavor.price}</span>
              </div>
              <p className="mt-1 text-xs uppercase tracking-wide text-white/45">
                {isSlot ? "Now arriving" : "In stock"}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * ScrollVideoHero
 * - Video is PINNED full-screen and scrubbed by scroll position.
 * - Scroll down = camera moves forward through the house.
 * - Scroll up = video plays in reverse. (scrub handles this natively)
 * - Text overlays fade in/out at different progress stages.
 *
 * IMPORTANT: the video file must be encoded for frame-accurate seeking.
 * See README for the ffmpeg command (keyframe every frame).
 */
export default function ScrollVideoHero() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const wrap = wrapRef.current;
    if (!video || !wrap) return;

    video.pause();

    let ctx: gsap.Context;

    const init = () => {
      ctx = gsap.context(() => {
        // --- Scrub video with scroll ---
        gsap.to(video, {
          currentTime: video.duration || 1,
          ease: "none",
          scrollTrigger: {
            trigger: wrap,
            start: "top top",
            end: "+=400%", // 4 screen-heights of scroll = full video
            scrub: 0.6,    // smoothing; lower = tighter, higher = floatier
            pin: true,
            anticipatePin: 1,
          },
        });

        // --- Staged text overlays ---
        const stages = gsap.utils.toArray<HTMLElement>(".hero-stage");
        stages.forEach((stage, i) => {
          const total = stages.length;
          const slice = 1 / total;
          const stStart = i * slice;

          gsap.fromTo(
            stage,
            { opacity: 0, y: 60 },
            {
              opacity: 1,
              y: 0,
              ease: "none",
              scrollTrigger: {
                trigger: wrap,
                start: "top top",
                end: "+=400%",
                scrub: true,
                onUpdate: (self) => {
                  const p = self.progress;
                  // fade in during first 15% of the stage window,
                  // hold, fade out during last 15%
                  const local = (p - stStart) / slice;
                  let o = 0;
                  if (local >= 0 && local <= 1) {
                    if (local < 0.18) o = local / 0.18;
                    else if (local > 0.82) o = (1 - local) / 0.18;
                    else o = 1;
                  }
                  // Last stage stays visible at the end
                  if (i === total - 1 && p > stStart) {
                    o = Math.max(o, Math.min((p - stStart) / (0.18 * slice), 1));
                    if (p > 0.95) o = 1;
                  }
                  gsap.set(stage, {
                    opacity: o,
                    y: (1 - o) * 40,
                  });
                },
              },
            }
          );
        });

        // --- Progress bar ---
        gsap.to(".hero-progress", {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: wrap,
            start: "top top",
            end: "+=400%",
            scrub: true,
          },
        });
      }, wrap);
    };

    if (video.readyState >= 1) init();
    else video.addEventListener("loadedmetadata", init, { once: true });

    // iOS: needs a touch to allow programmatic seeking on some devices
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
    <section ref={wrapRef} className="relative h-screen w-full overflow-hidden bg-void">
      {/* Scrubbed video */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src="/video/walkthrough.mp4"
        muted
        playsInline
        preload="auto"
        poster="/video/walkthrough-poster.jpg"
      />

      {/* Cinematic overlay for text legibility */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/80 via-transparent to-void/60" />

      {/* Stage 1 — opening statement */}
      <div className="hero-stage absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-gold">
          Welcome Home
        </p>
        <h1 className="font-display text-5xl font-semibold leading-tight text-bone md:text-8xl">
          Step Inside
          <br />
          <span className="italic text-gold">Your Future.</span>
        </h1>
        <p className="mt-8 animate-pulse text-xs uppercase tracking-[0.3em] text-ash">
          Scroll to walk through
        </p>
      </div>

      {/* Stage 2 — mid walkthrough */}
      <div className="hero-stage absolute inset-0 flex items-end justify-start p-10 md:p-24 opacity-0">
        <div className="max-w-lg">
          <h2 className="font-display text-4xl font-semibold text-bone md:text-6xl">
            Designed for
            <br />
            <span className="italic text-gold">the way you live.</span>
          </h2>
          <p className="mt-5 text-ash md:text-lg">
            Every corner planned. Every material chosen with intent.
          </p>
        </div>
      </div>

      {/* Stage 3 — arrival / CTA */}
      <div className="hero-stage absolute inset-0 flex flex-col items-center justify-center text-center px-6 opacity-0">
        <h2 className="font-display text-5xl font-semibold text-bone md:text-7xl">
          This is where
          <br />
          <span className="italic text-gold">your story begins.</span>
        </h2>
        <a
          href="#projects"
          className="mt-10 rounded-full bg-gold px-9 py-4 text-sm font-bold text-void transition hover:scale-105"
        >
          Explore Projects
        </a>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-[3px] w-full origin-left scale-x-0 bg-gold hero-progress" />
    </section>
  );
}

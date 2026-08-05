"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Shared "Services" dropdown listing every hero page, so you can jump between
 * them from any of them. Each hero passes its own trigger styling; the panel
 * looks the same everywhere.
 */

export const HERO_PAGES = [
  { href: "/", label: "Ice Cream Hero", note: "Word behind the bowl" },
  { href: "/landscape", label: "Circle Hero", note: "Word behind a circular photo" },
  { href: "/landscape-2", label: "Scroll Video Hero", note: "Pinned, scroll-scrubbed video" },
  { href: "/landscape-3", label: "3D Showcase Hero", note: "Tilting card, colour per slide" },
];

export default function HeroLinksMenu({
  label = "Services",
  triggerClassName = "",
}: {
  label?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  // a short grace period so a quick pointer wobble off the menu doesn't shut it
  const openMenu = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 220);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <div className="relative" onMouseEnter={openMenu} onMouseLeave={scheduleClose}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 ${triggerClassName}`}
      >
        {label}
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className={`transition ${open ? "rotate-180" : ""}`}
        >
          <path d="m2 4.5 4 4 4-4" />
        </svg>
      </button>

      {open && (
        // the wrapper starts flush against the trigger and carries the visual
        // gap as PADDING — a margin here would leave a dead strip that closes
        // the menu the moment the pointer crosses it
        <div className="absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-3">
          <div className="overflow-hidden rounded-2xl bg-[#141414] p-2 shadow-2xl ring-1 ring-white/10">
            {HERO_PAGES.map((page) => (
              <a
                key={page.href}
                href={page.href}
                className="block rounded-xl px-4 py-3 text-left normal-case tracking-normal transition hover:bg-white/10"
              >
                <span className="block text-sm font-semibold text-white">{page.label}</span>
                <span className="mt-0.5 block text-xs text-white/55">{page.note}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

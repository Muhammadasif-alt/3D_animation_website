import type { Metadata } from "next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

export const metadata: Metadata = {
  title: "Cinematic Walkthrough — Scroll Video Experience",
  description: "Scroll-driven cinematic home walkthrough built with Next.js and GSAP.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@500,600,700&f[]=satoshi@400,500,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-void font-body text-bone antialiased">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}

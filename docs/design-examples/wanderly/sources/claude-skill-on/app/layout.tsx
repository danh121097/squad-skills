import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter } from "next/font/google";

import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { EditorialCursor } from "@/components/motion/editorial-cursor";
import { SiteNav } from "@/components/sections/site-nav";
import { SiteFooter } from "@/components/sections/site-footer";

import "./globals.css";

/**
 * Instrument Serif carries the voice — high contrast, narrow, slightly literary,
 * the closest Google Font to a fashion masthead. Inter is deliberately quiet
 * underneath it: labels, metadata, navigation. The gap between the two families
 * is doing the hierarchy work, so neither needs decoration.
 */
const editorialSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-editorial-serif",
  fallback: ["Georgia", "Times New Roman", "Times", "serif"],
});

const uiSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ui-sans",
  fallback: [
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "Helvetica",
    "Arial",
    "sans-serif",
  ],
});

export const metadata: Metadata = {
  title: "Wanderly — Go somewhere you'll remember",
  description:
    "Thoughtfully curated journeys, extraordinary places, and stories worth bringing home.",
};

export const viewport: Viewport = {
  themeColor: "#f7f5f0",
};

/**
 * Runs before the document paints. If the reader has asked for reduced motion we
 * never mark the document, so the pre-animation CSS in globals.css never applies
 * and the page renders in its finished, readable state. This is what keeps the
 * fallback honest instead of "the same animation, but quicker".
 */
const MOTION_BOOT = `try{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.dataset.motion='on'}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${editorialSerif.variable} ${uiSans.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-surface text-primary font-sans antialiased">
        <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT }} />
        <SmoothScroll>
          <a
            href="#main"
            className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-[200] focus-visible:bg-surface focus-visible:px-5 focus-visible:py-3 focus-visible:text-label focus-visible:font-medium focus-visible:tracking-[0.14em] focus-visible:uppercase"
          >
            Skip to content
          </a>
          <EditorialCursor />
          <SiteNav />
          <main id="main">{children}</main>
          <SiteFooter />
        </SmoothScroll>
      </body>
    </html>
  );
}

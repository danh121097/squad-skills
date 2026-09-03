"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import { lockScroll } from "@/components/motion/smooth-scroll";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/hooks/use-isomorphic-layout-effect";
import { motionIsReduced, useReducedMotion } from "@/lib/hooks/use-media-query";
import { navLinks } from "@/lib/content/site";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

/** Full-screen cinematic menu. Items rise in sequence; Escape closes. */
export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    lockScroll(open);
    if (!open) return;

    // One frame after `inert` is lifted, so the button is focusable.
    const frame = requestAnimationFrame(() => closeButton.current?.focus());
    return () => {
      cancelAnimationFrame(frame);
      lockScroll(false);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useIsomorphicLayoutEffect(() => {
    const el = panel.current;
    if (!el || reduced || motionIsReduced() || !open) return;

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>("[data-menu-item]", el);
      gsap.fromTo(
        items,
        { yPercent: 110 },
        { yPercent: 0, duration: 0.9, stagger: 0.07, ease: "power3.out", delay: 0.12 },
      );
      gsap.fromTo(
        "[data-menu-meta]",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.5, ease: "power3.out" },
      );
    }, el);

    return () => ctx.revert();
  }, [open, reduced]);

  return (
    <div
      ref={panel}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      inert={!open}
      /* Opacity alone, never `visibility`: a discrete visibility
         transition stays hidden for half its duration, which would make
         the panel unfocusable exactly when it opens. `inert` does the
         real work of keeping the closed menu out of reach. */
      className={`fixed inset-0 z-[110] bg-forest text-canvas transition-opacity duration-700 ease-editorial md:hidden ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="wrap flex h-full flex-col pb-12 pt-6">
        <div className="flex items-center justify-between">
          <span className="eyebrow">Wanderly</span>
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            className="-mr-2 p-2 text-canvas"
            aria-label="Close menu"
          >
            <X className="size-6" strokeWidth={1.25} aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Primary" className="mt-auto">
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.href} className="reveal-line">
                <a
                  data-menu-item
                  href={link.href}
                  onClick={onClose}
                  className="display block py-1 text-[13vw] leading-[1.02] xs:text-[54px]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div data-menu-meta className="mt-14 border-t border-canvas/12 pt-6">
          <p className="max-w-[36ch] text-[15px] leading-relaxed text-canvas/60">
            Thoughtfully curated journeys, extraordinary places, and stories worth
            bringing home.
          </p>
          <a
            href="#journeys"
            onClick={onClose}
            className="eyebrow link-underline mt-6 inline-block text-canvas"
          >
            Plan a trip
          </a>
        </div>
      </div>
    </div>
  );
}

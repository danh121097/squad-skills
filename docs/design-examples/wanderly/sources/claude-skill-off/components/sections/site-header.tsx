"use client";

import { Menu, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { MagneticButton } from "@/components/motion/magnetic-button";
import { Reveal } from "@/components/motion/reveal";
import { MobileMenu } from "@/components/sections/mobile-menu";
import { cx } from "@/lib/cx";
import { navLinks } from "@/lib/content/site";

/**
 * Transparent over the hero, then a floating off-white bar: blurred,
 * hairline-bordered, softly shadowed, and a little smaller.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <Reveal
        as="header"
        trigger="load"
        delay={0.65}
        distance={-14}
        duration={1}
        className="fixed inset-x-0 top-0 z-[100]"
      >
        <div className="wrap">
          <div
            className={cx(
              "flex items-center justify-between rounded-full",
              "transition-[background-color,border-color,box-shadow,padding,margin,color,backdrop-filter]",
              "duration-[700ms] ease-editorial",
              scrolled
                ? cx(
                    "mt-3 border border-ink/10 bg-canvas/80 px-4 py-2 text-ink backdrop-blur-xl",
                    "shadow-[0_18px_50px_-30px_rgba(17,23,19,0.55)] md:px-6 md:py-2.5",
                  )
                : "mt-5 border border-transparent px-0 py-3 text-canvas md:mt-7",
            )}
          >
            <a
              href="#top"
              className={cx(
                "font-sans font-semibold uppercase leading-none transition-all duration-[700ms] ease-editorial",
                scrolled
                  ? "text-[15px] tracking-[0.2em]"
                  : "text-[16px] tracking-[0.22em] md:text-[17px]",
              )}
            >
              Wanderly
            </a>

            <nav aria-label="Primary" className="hidden md:block">
              <ul className="flex items-center gap-8 lg:gap-10">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="link-underline text-[13px] tracking-[0.01em] opacity-90 transition-opacity duration-500 ease-editorial hover:opacity-100"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex items-center gap-2 md:gap-4">
              <button
                type="button"
                aria-label="Search destinations"
                data-cursor="button"
                className={cx(
                  "hidden size-9 items-center justify-center rounded-full transition-colors duration-500 ease-editorial md:inline-flex",
                  scrolled ? "hover:bg-ink/6" : "hover:bg-canvas/12",
                )}
              >
                <Search className="size-[18px]" strokeWidth={1.4} aria-hidden="true" />
              </button>

              {/* Wrapped rather than hidden in place: the button owns
                  `inline-flex`, which outranks a `hidden` passed in. */}
              <span className="hidden md:block">
                <MagneticButton
                  href="#journeys"
                  variant={scrolled ? "onLight" : "onImage"}
                  strength={5}
                  className="px-5 py-2.5 text-[12.5px]"
                >
                  Plan a trip
                </MagneticButton>
              </span>

              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                className="-mr-1.5 p-1.5 md:hidden"
              >
                <Menu className="size-6" strokeWidth={1.25} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </Reveal>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

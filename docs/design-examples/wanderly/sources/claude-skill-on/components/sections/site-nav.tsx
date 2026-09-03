"use client";

import { Menu, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useScrollLock } from "@/components/motion/smooth-scroll";
import { Container } from "@/components/ui/container";
import { PillButton } from "@/components/ui/pill-button";
import { DURATION, EASE, MOTION_OK, ScrollTrigger, gsap, useGSAP } from "@/lib/motion";
import { BRAND, NAV_LINKS } from "@/lib/content/site";

/**
 * Ultra-minimal nav that starts transparent over the hero and condenses into a
 * floating bar once the hero is behind you.
 *
 * The condensed state is driven by ScrollTrigger but expressed entirely in CSS
 * transitions on a `data-condensed` attribute, so the state change still
 * happens under reduced motion — it simply arrives without the tween. State is
 * information here, not decoration, and hiding it from reduced-motion users
 * would cost them the contrast the dark-on-light bar provides.
 */
export function SiteNav() {
  const header = useRef<HTMLElement>(null);
  const menuPanel = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [condensed, setCondensed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const setScrollLock = useScrollLock();

  useGSAP(
    () => {
      // Runs regardless of motion preference: this is a state toggle.
      const trigger = ScrollTrigger.create({
        start: "top -80",
        end: 99999,
        onToggle: (self) => setCondensed(self.isActive),
      });

      const media = gsap.matchMedia();
      media.add(MOTION_OK, () => {
        gsap.from(header.current, {
          autoAlpha: 0,
          duration: DURATION.slow,
          delay: 0.45,
          ease: EASE,
        });
      });

      return () => {
        trigger.kill();
        media.revert();
      };
    },
    { scope: header },
  );

  // Full-screen menu: staggered rise on open, and a real dialog contract.
  useGSAP(
    () => {
      if (!menuOpen) return;
      const media = gsap.matchMedia();

      media.add(MOTION_OK, () => {
        gsap.from("[data-menu-item]", {
          yPercent: 110,
          duration: DURATION.slow,
          ease: EASE,
          stagger: 0.07,
          delay: 0.05,
        });
      });

      return () => media.revert();
    },
    { dependencies: [menuOpen], scope: menuPanel },
  );

  useEffect(() => {
    setScrollLock(menuOpen);
    if (!menuOpen) return;

    const panel = menuPanel.current;
    panel?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panel) return;

      // Contain focus inside the overlay while it is open.
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, setScrollLock]);

  const closeMenu = () => {
    setMenuOpen(false);
    // Focus returns to the control that opened the overlay.
    menuButton.current?.focus();
  };

  return (
    <header
      ref={header}
      data-condensed={condensed}
      className="group/nav fixed inset-x-0 top-0 z-[120] pt-4 transition-[padding] duration-700 ease-editorial data-[condensed=true]:pt-3 motion-reduce:transition-none"
    >
      <Container>
        <div className="flex items-center justify-between gap-8 rounded-full border border-transparent px-0 py-4 transition-[background-color,border-color,box-shadow,padding,backdrop-filter] duration-700 ease-editorial group-data-[condensed=true]/nav:border-rule group-data-[condensed=true]/nav:bg-surface/80 group-data-[condensed=true]/nav:px-6 group-data-[condensed=true]/nav:py-2.5 group-data-[condensed=true]/nav:shadow-[0_18px_50px_-30px_rgba(17,17,17,0.5)] group-data-[condensed=true]/nav:backdrop-blur-xl motion-reduce:transition-none">
          <a
            href="#main"
            className="text-[0.8125rem] font-semibold tracking-[0.3em] text-on-inverse uppercase transition-colors duration-700 ease-editorial group-data-[condensed=true]/nav:text-primary motion-reduce:transition-none"
          >
            {BRAND}
          </a>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-9 lg:flex"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative text-[0.8125rem] text-on-inverse/85 transition-colors duration-700 ease-editorial after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-500 after:ease-editorial hover:text-on-inverse hover:after:scale-x-100 focus-visible:after:scale-x-100 group-data-[condensed=true]/nav:text-secondary group-data-[condensed=true]/nav:hover:text-primary motion-reduce:transition-none motion-reduce:after:transition-none"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Search journeys"
              className="hidden size-11 items-center justify-center rounded-full text-on-inverse transition-colors duration-700 ease-editorial group-data-[condensed=true]/nav:text-primary hover:bg-white/10 group-data-[condensed=true]/nav:hover:bg-primary/5 lg:inline-flex motion-reduce:transition-none"
            >
              <Search aria-hidden="true" strokeWidth={1.5} className="size-4" />
            </button>

            <span className="hidden lg:inline-flex">
              <PillButton
                href="#journeys"
                variant="onDark"
                className="group-data-[condensed=true]/nav:bg-primary group-data-[condensed=true]/nav:text-on-inverse"
              >
                Plan a trip
              </PillButton>
            </span>

            <button
              ref={menuButton}
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="inline-flex size-11 items-center justify-center rounded-full text-on-inverse transition-colors duration-700 ease-editorial group-data-[condensed=true]/nav:text-primary lg:hidden motion-reduce:transition-none"
            >
              <Menu aria-hidden="true" strokeWidth={1.5} className="size-5" />
              <span className="sr-only">Open menu</span>
            </button>
          </div>
        </div>
      </Container>

      {menuOpen ? (
        <div
          ref={menuPanel}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          tabIndex={-1}
          data-surface="inverse"
          className="fixed inset-0 z-[130] flex flex-col bg-surface-inverse px-5 pt-4 pb-12 text-on-inverse md:px-8"
        >
          <div className="flex items-center justify-between py-4">
            <span className="text-[0.8125rem] font-semibold tracking-[0.3em] uppercase">
              {BRAND}
            </span>
            <button
              type="button"
              onClick={closeMenu}
              className="inline-flex size-11 items-center justify-center rounded-full"
            >
              <X aria-hidden="true" strokeWidth={1.5} className="size-5" />
              <span className="sr-only">Close menu</span>
            </button>
          </div>

          <nav
            aria-label="Primary"
            className="flex flex-1 flex-col justify-center gap-2"
          >
            {NAV_LINKS.map((link) => (
              <span key={link.href} className="block overflow-hidden py-1">
                <a
                  data-menu-item=""
                  href={link.href}
                  onClick={closeMenu}
                  className="block font-display text-[clamp(2.75rem,13vw,4.5rem)] leading-[1.05] tracking-[-0.02em]"
                >
                  {link.label}
                </a>
              </span>
            ))}
          </nav>

          <div className="flex flex-col gap-6 border-t border-rule-inverse pt-8">
            <PillButton href="#journeys" variant="onDark">
              Plan a trip
            </PillButton>
            <p className="text-label uppercase text-on-inverse-muted">
              Curated journeys around the world
            </p>
          </div>
        </div>
      ) : null}
    </header>
  );
}

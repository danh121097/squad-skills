"use client";

import { Menu, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const links = ["Destinations", "Journeys", "Stories", "About"];

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    if (open) closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuTrigger.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("menu-open");
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <header
        className={`fixed left-1/2 top-0 z-50 w-full -translate-x-1/2 transition-all duration-700 ease-[var(--ease-out)] ${
          scrolled
            ? "top-3 w-[calc(100%-24px)] max-w-[1500px] rounded-full border border-black/10 bg-[var(--surface)]/90 text-[var(--text)] shadow-[0_12px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl"
            : "text-white"
        }`}
      >
        <nav className={`flex items-center justify-between px-5 transition-all duration-700 md:px-8 ${scrolled ? "h-16" : "h-24"}`} aria-label="Primary navigation">
          <a href="#top" className="text-sm font-extrabold tracking-[0.18em]">WANDERLY</a>
          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 md:flex">
            {links.map((link) => (
              <a key={link} href={`#${link.toLowerCase()}`} className="group relative py-2 text-[13px] font-semibold">
                {link}
                <span className="absolute bottom-0 left-0 h-px w-full origin-right scale-x-0 bg-current transition-transform duration-500 ease-[var(--ease-out)] group-hover:origin-left group-hover:scale-x-100" />
              </a>
            ))}
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <button type="button" aria-label="Search Wanderly" className="grid size-11 place-items-center rounded-full transition-colors hover:bg-current/10">
              <Search size={18} strokeWidth={1.7} />
            </button>
            <a href="#final-cta" style={{ color: scrolled ? "#ffffff" : "#111713" }} className={`rounded-full px-5 py-3 text-xs font-bold transition-colors ${scrolled ? "bg-[#111713]" : "bg-white"}`}>
              Plan a trip
            </a>
          </div>
          <button
            ref={menuTrigger}
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
            className="grid size-11 place-items-center md:hidden"
          >
            <Menu size={22} />
          </button>
        </nav>
      </header>

      <div id="mobile-menu" aria-hidden={!open} className={`fixed inset-0 z-[70] flex flex-col bg-[var(--night)] px-5 py-6 text-[var(--surface)] transition-[opacity,visibility] duration-700 ${open ? "visible opacity-100" : "invisible opacity-0"}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-extrabold tracking-[0.18em]">WANDERLY</span>
          <button ref={closeButton} type="button" aria-label="Close menu" onClick={() => { setOpen(false); menuTrigger.current?.focus(); }} className="grid size-11 place-items-center rounded-full border border-white/20">
            <X size={22} />
          </button>
        </div>
        <nav className="my-auto" aria-label="Mobile navigation">
          <ul className="space-y-1">
            {links.map((link, index) => (
              <li key={link} style={{ transitionDelay: open ? `${180 + index * 80}ms` : "0ms" }} className={`overflow-hidden transition-all duration-700 ease-[var(--ease-out)] ${open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
                <a href={`#${link.toLowerCase()}`} onClick={() => setOpen(false)} className="font-editorial block py-2 text-[clamp(3.5rem,17vw,6rem)] leading-[0.95]">{link}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-end justify-between border-t border-white/15 pt-5 text-xs uppercase tracking-[0.14em] text-white/60">
          <span>Travel well</span><span>Est. 2016</span>
        </div>
      </div>
    </>
  );
}

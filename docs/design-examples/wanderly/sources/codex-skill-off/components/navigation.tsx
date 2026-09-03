"use client";

import { Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const links = ["Destinations", "Journeys", "Stories", "About"];

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: "#hero",
      start: "80px top",
      onEnter: () => setScrolled(true),
      onLeaveBack: () => setScrolled(false),
    });
    return () => trigger.kill();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen || searchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, searchOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className={`site-nav ${scrolled ? "site-nav--scrolled" : ""}`}>
        <a href="#hero" className="brand-mark" aria-label="Wanderly home">WANDERLY</a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map((link) => (
            <a key={link} href={`#${link.toLowerCase()}`}>{link}</a>
          ))}
        </nav>
        <div className="nav-actions">
          <button className="icon-button search-button" type="button" aria-label="Open search" onClick={() => setSearchOpen(true)}>
            <Search aria-hidden="true" size={18} strokeWidth={1.7} />
          </button>
          <a className="nav-cta" href="#journeys">Plan a trip</a>
          <button className="icon-button menu-button" type="button" aria-label="Open menu" aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen(true)}>
            <Menu aria-hidden="true" size={21} strokeWidth={1.6} />
          </button>
        </div>
      </header>

      <div id="mobile-menu" className={`mobile-menu ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="menu-topline">
          <span>WANDERLY</span>
          <button className="icon-button" type="button" aria-label="Close menu" onClick={closeMenu}>
            <X aria-hidden="true" size={23} strokeWidth={1.5} />
          </button>
        </div>
        <nav aria-label="Mobile navigation">
          {links.map((link, index) => (
            <a key={link} href={`#${link.toLowerCase()}`} onClick={closeMenu} style={{ "--menu-index": index } as React.CSSProperties}>
              <span>0{index + 1}</span>{link}
            </a>
          ))}
        </nav>
        <p>Journeys made to stay with you.</p>
      </div>

      <div className={`search-overlay ${searchOpen ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Search journeys" aria-hidden={!searchOpen}>
        <button className="icon-button search-close" type="button" aria-label="Close search" onClick={() => setSearchOpen(false)}>
          <X aria-hidden="true" size={24} strokeWidth={1.5} />
        </button>
        <form className="search-form" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="site-search">Where do you want to disappear to?</label>
          <div>
            <input id="site-search" type="search" placeholder="A coast, a city, a feeling..." />
            <button type="submit" aria-label="Submit search"><Search aria-hidden="true" size={24} strokeWidth={1.5} /></button>
          </div>
        </form>
      </div>
    </>
  );
}

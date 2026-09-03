"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export function SomewhereNext() {
  const section = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!section.current || !frame.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.fromTo(frame.current, { scale: 0.88, borderRadius: 40 }, { scale: 1, borderRadius: 0, ease: "none", scrollTrigger: { trigger: section.current, start: "top bottom", end: "bottom bottom", scrub: 1 } });
    }, section);
    return () => context.revert();
  }, []);

  return (
    <section ref={section} className="somewhere-next" aria-labelledby="somewhere-title">
      <div ref={frame} className="somewhere-frame">
        <Image src="/assets/somewhere-next.jpg" alt="A remote mountain landscape opening into the distance" fill sizes="100vw" />
        <div className="somewhere-wash" />
        <div className="somewhere-copy"><p>Somewhere next</p><h2 id="somewhere-title">Where will<br />you disappear to?</h2></div>
      </div>
    </section>
  );
}

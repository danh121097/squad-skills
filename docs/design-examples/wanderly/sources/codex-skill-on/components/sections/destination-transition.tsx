"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import { TextReveal } from "@/components/motion/text-reveal";

export function DestinationTransition() {
  const root = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!root.current || !frame.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      gsap.fromTo(frame.current, { scale: 0.88, borderRadius: 40 }, {
        scale: 1,
        borderRadius: 0,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom bottom", scrub: 0.6 },
      });
    }, root);
    return () => context.revert();
  }, []);

  return (
    <section ref={root} className="relative h-[130svh] bg-[var(--surface-raised)]">
      <div ref={frame} className="sticky top-0 h-screen overflow-hidden text-white will-change-transform">
        <div className="absolute inset-0">
          <Image src="/assets/somewhere-next.jpg" alt="A remote mountain landscape inviting the next journey" fill sizes="100vw" className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-black/25" />
        <div className="page-shell absolute inset-0 flex flex-col justify-center">
          <p className="eyebrow mb-6 text-white/70">Somewhere next</p>
          <TextReveal as="h2" lines={["Where will", "you disappear to?"]} className="font-editorial text-[clamp(4.2rem,9vw,9rem)] leading-[0.88] tracking-[-0.055em]" />
        </div>
      </div>
    </section>
  );
}

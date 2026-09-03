"use client";

import Image from "next/image";
import { useRef } from "react";

import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/hooks/use-isomorphic-layout-effect";
import { motionIsReduced, useReducedMotion } from "@/lib/hooks/use-media-query";

/**
 * The showcase transition. The frame arrives inset with 40px corners and
 * opens out to fill the screen as you scroll — then holds while the
 * question sits on top of it.
 */
export function SomewhereNextSection() {
  const section = useRef<HTMLElement>(null);
  const visual = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const sectionEl = section.current;
    const visualEl = visual.current;
    if (!sectionEl || !visualEl || reduced || motionIsReduced()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        visualEl,
        { scale: 0.88, borderRadius: 40 },
        {
          scale: 1,
          borderRadius: 0,
          ease: "none",
          scrollTrigger: {
            trigger: sectionEl,
            start: "top top",
            end: "55% top",
            scrub: 0.7,
          },
        },
      );
    }, sectionEl);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={section} aria-label="Somewhere next" className="relative h-[190svh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div
          ref={visual}
          className="absolute inset-0 overflow-hidden will-change-transform"
        >
          <Image
            src="/assets/somewhere-next.jpg"
            alt="A range of unnamed peaks going blue in the late afternoon"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-forest/25" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-forest/60 to-transparent" />
        </div>

        <div className="wrap relative flex h-full flex-col items-center justify-center text-center text-canvas">
          <p className="eyebrow text-canvas/70">Somewhere next</p>
          <h2 className="display mt-8 text-[clamp(40px,8.4vw,116px)] leading-[0.98]">
            <span className="block">Where will</span>
            <span className="block">you disappear to?</span>
          </h2>
        </div>
      </div>
    </section>
  );
}

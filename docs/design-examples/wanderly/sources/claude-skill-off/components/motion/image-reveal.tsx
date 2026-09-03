"use client";

import Image from "next/image";
import { useRef } from "react";

import { cx } from "@/lib/cx";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/hooks/use-isomorphic-layout-effect";
import { motionIsReduced, useReducedMotion } from "@/lib/hooks/use-media-query";

type ImageRevealProps = {
  src: string;
  alt: string;
  sizes: string;
  /** How the photograph arrives: wiped open, or settling out of a slow push-in. */
  reveal?: "clip" | "scale" | "none";
  /** 0 disables parallax. 1 is the strongest drift used on this page. */
  parallax?: number;
  /** Pairs with a `group` ancestor. */
  hoverZoom?: boolean;
  priority?: boolean;
  quality?: number;
  delay?: number;
  className?: string;
  imageClassName?: string;
  /** Marks the frame as a "view" target for the custom cursor. */
  cursorView?: boolean;
};

/**
 * The single image primitive: clip-path or scale reveal on entry,
 * optional scroll parallax, optional hover zoom, lazy by default.
 * Only transform and clip-path are animated.
 */
export function ImageReveal({
  src,
  alt,
  sizes,
  reveal = "clip",
  parallax = 0,
  hoverZoom = false,
  priority = false,
  quality,
  delay = 0,
  className,
  imageClassName,
  cursorView = false,
}: ImageRevealProps) {
  const frame = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const frameEl = frame.current;
    const innerEl = inner.current;
    if (!frameEl || !innerEl || reduced || motionIsReduced()) return;

    const ctx = gsap.context(() => {
      if (reveal === "clip") {
        gsap.set(frameEl, { clipPath: "inset(100% 0% 0% 0%)" });
        gsap.to(frameEl, {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.4,
          delay,
          ease: "power3.inOut",
          scrollTrigger: { trigger: frameEl, start: "top 88%", once: true },
        });
      }

      if (reveal === "scale") {
        gsap.set(innerEl, { scale: 1.14 });
        gsap.to(innerEl, {
          scale: 1,
          duration: 1.8,
          delay,
          ease: "power3.out",
          scrollTrigger: { trigger: frameEl, start: "top 90%", once: true },
        });
      }

      if (parallax > 0) {
        const travel = 6 * parallax;
        gsap.fromTo(
          innerEl,
          { yPercent: -travel },
          {
            yPercent: travel,
            ease: "none",
            scrollTrigger: {
              trigger: frameEl,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      }
    }, frameEl);

    return () => ctx.revert();
  }, [reduced, reveal, parallax, delay]);

  const bleed = parallax > 0 ? `-${10 * parallax}%` : undefined;

  return (
    <div
      ref={frame}
      className={cx("relative overflow-hidden", className)}
      data-cursor={cursorView ? "view" : undefined}
    >
      <div
        ref={inner}
        className="absolute inset-x-0 will-change-transform"
        style={{ top: bleed ?? 0, bottom: bleed ?? 0 }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={quality}
          className={cx(
            "object-cover",
            hoverZoom &&
              "transition-transform duration-[1400ms] ease-editorial group-hover:scale-[1.04]",
            imageClassName,
          )}
        />
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useRef } from "react";

import {
  DURATION,
  EASE,
  MOTION_OK,
  MOTION_OK_DESKTOP,
  gsap,
  useGSAP,
} from "@/lib/motion";

type ImageRevealProps = {
  src: string;
  /** Empty string marks a companion crop that repeats an adjacent photograph
   *  and therefore adds nothing for a screen reader. */
  alt: string;
  sizes: string;
  /** Frame geometry: aspect ratio, radius, column span. */
  className?: string;
  imageClassName?: string;
  /** `clip` wipes upward, `scale` settles from 1.06, `none` leaves it alone. */
  reveal?: "clip" | "scale" | "none";
  /** Vertical drift in percent of the frame, desktop + motion only. */
  parallax?: number;
  /** Slow zoom when the enclosing `group` is hovered. Pointer devices only. */
  hoverZoom?: boolean;
  priority?: boolean;
  start?: string;
  delay?: number;
  /** Marks the frame as a target the custom cursor expands over. */
  cursorLabel?: boolean;
};

/**
 * The page's single image primitive.
 *
 * Every photograph on the page goes through here so that reveal, parallax and
 * hover zoom stay one vocabulary instead of four slightly different hand-rolled
 * versions. Parallax overshoots the frame by 12% on each side so the drift never
 * exposes an edge, and it is registered under a desktop-only media query: on
 * touch the image simply sits still, which is both the brief's instruction and
 * the cheaper thing for a phone to composite.
 */
export function ImageReveal({
  src,
  alt,
  sizes,
  className,
  imageClassName,
  reveal = "scale",
  parallax = 0,
  hoverZoom = false,
  priority = false,
  start = "top 82%",
  delay = 0,
  cursorLabel = false,
}: ImageRevealProps) {
  const frame = useRef<HTMLDivElement>(null);
  const mover = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(MOTION_OK, () => {
        const frameEl = frame.current;
        const moverEl = mover.current;
        if (!frameEl || !moverEl) return;

        if (reveal === "clip") {
          gsap.set(frameEl, { clipPath: "inset(100% 0 0 0)" });
          gsap.to(frameEl, {
            clipPath: "inset(0% 0 0 0)",
            duration: DURATION.cinematic,
            delay,
            ease: EASE,
            scrollTrigger: { trigger: frameEl, start, once: true },
          });
        }

        if (reveal === "scale") {
          gsap.set(moverEl, { scale: 1.06 });
          gsap.to(moverEl, {
            scale: 1,
            duration: DURATION.cinematic,
            delay,
            ease: EASE,
            scrollTrigger: { trigger: frameEl, start, once: true },
          });
        }
      });

      if (parallax > 0) {
        media.add(MOTION_OK_DESKTOP, () => {
          gsap.fromTo(
            mover.current,
            { yPercent: -parallax },
            {
              yPercent: parallax,
              ease: "none",
              scrollTrigger: {
                trigger: frame.current,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          );
        });
      }

      return () => media.revert();
    },
    { scope: frame },
  );

  return (
    <div
      ref={frame}
      data-reveal-clip={reveal === "clip" ? "" : undefined}
      data-cursor={cursorLabel ? "view" : undefined}
      className={`relative overflow-hidden bg-primary/5 ${className ?? ""}`}
    >
      <div
        ref={mover}
        className={`absolute ${parallax > 0 ? "-inset-y-[12%] inset-x-0" : "inset-0"} will-change-transform`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          className={`object-cover ${
            hoverZoom
              ? "motion-safe:transition-transform motion-safe:duration-[1200ms] motion-safe:ease-editorial motion-safe:group-hover:scale-[1.04]"
              : ""
          } ${imageClassName ?? ""}`}
        />
      </div>
    </div>
  );
}

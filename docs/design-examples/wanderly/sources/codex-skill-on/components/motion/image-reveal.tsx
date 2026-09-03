"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useLayoutEffect, useRef } from "react";

type ImageRevealProps = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  mode?: "clip" | "scale" | "parallax";
  hoverZoom?: boolean;
  cursorLabel?: string;
};

export function ImageReveal({
  src,
  alt,
  sizes,
  className = "",
  imageClassName = "",
  priority = false,
  mode = "clip",
  hoverZoom = false,
  cursorLabel,
}: ImageRevealProps) {
  const root = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    if (!root.current || !image.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      if (mode === "clip") {
        gsap.fromTo(root.current, { clipPath: "inset(100% 0 0 0)" }, {
          clipPath: "inset(0% 0 0 0)", duration: 1.25, ease: "power4.out",
          scrollTrigger: { trigger: root.current, start: "top 82%", once: true },
        });
      } else if (mode === "scale") {
        gsap.fromTo(image.current, { scale: 1.08 }, {
          scale: 1, duration: 1.35, ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 85%", once: true },
        });
      } else {
        gsap.fromTo(image.current, { yPercent: -5, scale: 1.08 }, {
          yPercent: 5, ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.7 },
        });
      }
    }, root);

    return () => context.revert();
  }, [mode]);

  return (
    <div
      ref={root}
      className={`image-frame ${hoverZoom ? "group" : ""} ${className}`}
      data-cursor={cursorLabel}
    >
      <Image
        ref={image}
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`${hoverZoom ? "transition-transform duration-[1200ms] ease-[var(--ease-out)] group-hover:scale-[1.04]" : ""} ${imageClassName}`}
      />
    </div>
  );
}

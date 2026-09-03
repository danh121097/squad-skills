"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

type ImageRevealProps = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  mode?: "clip" | "scale" | "parallax" | "none";
};

export function ImageReveal({
  src,
  alt,
  sizes,
  className = "",
  imageClassName = "",
  priority = false,
  mode = "clip",
}: ImageRevealProps) {
  const root = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!root.current || !image.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      if (mode === "clip") {
        gsap.fromTo(root.current, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: root.current, start: "top 82%", once: true } });
      }
      if (mode === "scale") {
        gsap.fromTo(image.current, { scale: 1.08 }, { scale: 1, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: root.current, start: "top 85%", once: true } });
      }
      if (mode === "parallax") {
        gsap.fromTo(image.current, { yPercent: -5, scale: 1.08 }, { yPercent: 5, scale: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 1 } });
      }
    }, root);
    return () => context.revert();
  }, [mode]);

  return (
    <div ref={root} className={`image-reveal ${className}`}>
      <Image ref={image} src={src} alt={alt} fill sizes={sizes} priority={priority} className={imageClassName} />
    </div>
  );
}

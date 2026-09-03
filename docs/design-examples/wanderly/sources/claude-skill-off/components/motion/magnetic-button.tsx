"use client";

import { ArrowRight } from "lucide-react";
import { useRef, type ReactNode } from "react";

import { cx } from "@/lib/cx";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/hooks/use-isomorphic-layout-effect";
import { useFinePointer, useReducedMotion } from "@/lib/hooks/use-media-query";

type Variant = "onImage" | "onDark" | "onLight" | "bare";

const variants: Record<Variant, string> = {
  // Sitting over photography: a hairline pill that fills on hover.
  onImage:
    "border border-canvas/50 text-canvas hover:bg-canvas hover:text-ink hover:border-canvas",
  // On the near-black sections.
  onDark: "bg-canvas text-forest hover:bg-canvas/88",
  // On the warm off-white.
  onLight: "bg-ink text-canvas hover:bg-forest",
  bare: "border border-canvas/25 text-canvas hover:border-canvas/70",
};

type MagneticButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  withArrow?: boolean;
  /** Magnetic travel ceiling, in px. The brief's 4–8px range. */
  strength?: number;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
};

/**
 * A pill that leans a few pixels toward the pointer and eases back when
 * it leaves. Pointer-driven, so it is inert on touch devices, and it is
 * switched off entirely under reduced motion.
 */
export function MagneticButton({
  children,
  href,
  variant = "onLight",
  withArrow = false,
  strength = 7,
  className,
  onClick,
  ariaLabel,
}: MagneticButtonProps) {
  const root = useRef<HTMLElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const finePointer = useFinePointer();
  const reduced = useReducedMotion();
  const magnetic = finePointer && !reduced;

  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    const labelEl = label.current;
    if (!el || !labelEl || !magnetic) return;

    const config = { duration: 0.7, ease: "power3.out" };
    const moveX = gsap.quickTo(el, "x", config);
    const moveY = gsap.quickTo(el, "y", config);
    const labelX = gsap.quickTo(labelEl, "x", config);
    const labelY = gsap.quickTo(labelEl, "y", config);

    const onMove = (event: PointerEvent) => {
      const box = el.getBoundingClientRect();
      const relX = event.clientX - (box.left + box.width / 2);
      const relY = event.clientY - (box.top + box.height / 2);
      const x = gsap.utils.clamp(-strength, strength, relX * 0.4);
      const y = gsap.utils.clamp(-strength, strength, relY * 0.6);
      moveX(x);
      moveY(y);
      labelX(x * 0.35);
      labelY(y * 0.35);
    };

    const onLeave = () => {
      moveX(0);
      moveY(0);
      labelX(0);
      labelY(0);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("blur", onLeave);

    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("blur", onLeave);
      gsap.set([el, labelEl], { x: 0, y: 0 });
    };
  }, [magnetic, strength]);

  const classes = cx(
    "group/btn inline-flex items-center justify-center gap-2.5 rounded-full",
    "px-7 py-3.5 text-[13px] font-medium tracking-[0.02em] will-change-transform",
    "transition-colors duration-500 ease-editorial",
    variants[variant],
    className,
  );

  const inner = (
    <span ref={label} className="inline-flex items-center gap-2.5 will-change-transform">
      {children}
      {withArrow ? (
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition-transform duration-500 ease-editorial group-hover/btn:translate-x-1"
          strokeWidth={1.5}
        />
      ) : null}
    </span>
  );

  if (href) {
    return (
      <a
        ref={root as React.RefObject<HTMLAnchorElement>}
        href={href}
        className={classes}
        aria-label={ariaLabel}
        data-cursor="button"
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      ref={root as React.RefObject<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      className={classes}
      aria-label={ariaLabel}
      data-cursor="button"
    >
      {inner}
    </button>
  );
}

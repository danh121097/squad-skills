"use client";

import { ArrowUpRight } from "lucide-react";
import type { MouseEvent } from "react";
import { useRef } from "react";

type MagneticButtonProps = {
  children: React.ReactNode;
  href?: string;
  tone?: "light" | "dark" | "outline";
  secondary?: boolean;
};

export function MagneticButton({ children, href = "#journeys", tone = "dark", secondary = false }: MagneticButtonProps) {
  const button = useRef<HTMLAnchorElement>(null);

  const move = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * 0.14;
    const y = (event.clientY - rect.top - rect.height / 2) * 0.14;
    event.currentTarget.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const reset = () => {
    if (button.current) button.current.style.transform = "translate3d(0, 0, 0)";
  };

  const tones = {
    light: "bg-[var(--surface)] text-[var(--night)]",
    dark: "bg-[var(--night)] text-[var(--surface)]",
    outline: "border border-white/30 text-[var(--surface)]",
  };

  return (
    <a
      ref={button}
      href={href}
      onMouseMove={move}
      onMouseLeave={reset}
      data-cursor="button"
      className={`${tones[tone]} ${secondary ? "bg-transparent" : ""} group inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-6 py-3 text-sm font-semibold transition-[transform,background-color,color] duration-500 ease-[var(--ease-out)]`}
    >
      <span>{children}</span>
      <ArrowUpRight size={16} strokeWidth={1.7} className="transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden="true" />
    </a>
  );
}

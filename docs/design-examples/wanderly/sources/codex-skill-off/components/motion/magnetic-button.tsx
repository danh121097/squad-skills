"use client";

import { ArrowUpRight } from "lucide-react";
import { useRef } from "react";

type MagneticButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "light" | "dark" | "text";
  className?: string;
};

export function MagneticButton({ href, children, variant = "dark", className = "" }: MagneticButtonProps) {
  const root = useRef<HTMLAnchorElement>(null);

  const move = (event: React.PointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType === "touch" || !root.current) return;
    const bounds = root.current.getBoundingClientRect();
    const x = (event.clientX - bounds.left - bounds.width / 2) * 0.14;
    const y = (event.clientY - bounds.top - bounds.height / 2) * 0.14;
    root.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const reset = () => {
    if (root.current) root.current.style.transform = "translate3d(0, 0, 0)";
  };

  return (
    <a ref={root} href={href} className={`magnetic-button magnetic-button--${variant} ${className}`} onPointerMove={move} onPointerLeave={reset}>
      <span>{children}</span>
      <ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.6} />
    </a>
  );
}

import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { Magnetic } from "@/components/motion/magnetic";

type PillButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "solid" | "outline" | "onDark" | "outlineOnDark";
  /** The 4px arrow step. Off for the nav's compact CTA. */
  withArrow?: boolean;
  /** Magnetic lean. Off for anything sitting inside the fixed nav, where a
   *  control that drifts under the pointer is more irritating than delightful. */
  magnetic?: boolean;
  className?: string;
};

const VARIANTS = {
  solid: "bg-primary text-on-inverse hover:bg-primary/90",
  outline: "border border-primary/25 text-primary hover:border-primary/60",
  onDark: "bg-on-inverse text-primary hover:bg-on-inverse/90",
  outlineOnDark:
    "border border-rule-inverse text-on-inverse hover:border-on-inverse/50",
} as const;

/**
 * The one filled control on the page. Everything else is an ArrowLink, which is
 * what keeps "Plan a trip" and "Explore journeys" reading as *the* actions
 * rather than as two buttons among twenty.
 *
 * Height is 44px at the smallest size so it clears WCAG 2.2 target-size (2.5.8)
 * on touch without a separate mobile variant.
 */
export function PillButton({
  href,
  children,
  variant = "solid",
  withArrow = false,
  magnetic = false,
  className,
}: PillButtonProps) {
  const button = (
    <a
      href={href}
      data-cursor="button"
      className={`group/pill inline-flex min-h-11 items-center gap-2.5 rounded-full px-6 py-3 text-[0.8125rem] font-medium tracking-[0.06em] transition-colors duration-500 ease-editorial motion-reduce:transition-none ${VARIANTS[variant]} ${className ?? ""}`}
    >
      <span>{children}</span>
      {withArrow ? (
        <ArrowRight
          aria-hidden="true"
          strokeWidth={1.5}
          className="size-4 transition-transform duration-500 ease-editorial group-hover/pill:translate-x-1 group-focus-visible/pill:translate-x-1 motion-reduce:transition-none"
        />
      ) : null}
    </a>
  );

  return magnetic ? <Magnetic>{button}</Magnetic> : button;
}

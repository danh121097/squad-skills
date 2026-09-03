import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

type ArrowLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  tone?: "primary" | "inverse" | "accent";
  size?: "sm" | "md";
};

/**
 * The page's quiet link: a hairline rule that wipes in from the left and an
 * arrow that steps 4px right.
 *
 * The underline is a pseudo-element scaling on the X axis rather than a
 * `text-decoration` toggle, so it animates on the compositor. Both the rule and
 * the arrow respond to `:focus-visible` as well as `:hover`, which is what
 * keeps the affordance available to keyboard users — the hover state is an
 * enhancement, never the only signal that this is a link.
 */
export function ArrowLink({
  href,
  children,
  className,
  tone = "primary",
  size = "md",
}: ArrowLinkProps) {
  const toneClass = {
    primary: "text-primary after:bg-primary",
    inverse: "text-on-inverse after:bg-on-inverse",
    accent: "text-accent after:bg-accent",
  }[tone];

  const sizeClass =
    size === "sm"
      ? "text-label font-medium uppercase gap-2"
      : "text-[0.8125rem] font-medium uppercase tracking-[0.14em] gap-2.5";

  return (
    <a
      href={href}
      className={`group/link relative inline-flex w-fit items-center ${sizeClass} ${toneClass} after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:transition-transform after:duration-500 after:ease-editorial hover:after:scale-x-100 focus-visible:after:scale-x-100 motion-reduce:after:transition-none ${className ?? ""}`}
    >
      <span>{children}</span>
      <ArrowRight
        aria-hidden="true"
        strokeWidth={1.5}
        className="size-4 transition-transform duration-500 ease-editorial group-hover/link:translate-x-1 group-focus-visible/link:translate-x-1 motion-reduce:transition-none"
      />
    </a>
  );
}

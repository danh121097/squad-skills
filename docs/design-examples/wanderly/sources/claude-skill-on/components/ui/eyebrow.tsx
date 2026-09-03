import type { ReactNode } from "react";

/**
 * The small uppercase label that opens most sections: 11px, 0.14em tracking.
 *
 * It is a <p>, not a heading — it names the territory but it is not a rung on
 * the document outline, and promoting it to h3 would put a second, competing
 * title above every real section heading.
 */
export function Eyebrow({
  children,
  className,
  tone = "muted",
}: {
  children: ReactNode;
  className?: string;
  tone?: "muted" | "accent" | "inverse";
}) {
  const toneClass = {
    muted: "text-secondary",
    accent: "text-accent",
    inverse: "text-on-inverse-muted",
  }[tone];

  return (
    <p
      className={`text-label font-medium uppercase ${toneClass} ${className ?? ""}`}
    >
      {children}
    </p>
  );
}

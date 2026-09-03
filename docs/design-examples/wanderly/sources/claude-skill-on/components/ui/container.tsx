import type { ElementType, ReactNode } from "react";

/**
 * The measure the whole page is set to: 1560px, with the brief's gutters
 * (20 / 32 / 48 / 80). Sections that bleed a photograph past the gutter opt out
 * by placing the figure outside the container rather than by inventing a
 * second, slightly different width somewhere else.
 */
export function Container({
  as: Tag = "div",
  className,
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      className={`mx-auto w-full max-w-[1560px] px-5 md:px-8 lg:px-12 xl:px-20 ${className ?? ""}`}
    >
      {children}
    </Tag>
  );
}

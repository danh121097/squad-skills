"use client";

import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const cursor = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const element = cursor.current;
    if (!element) return;

    const move = (event: PointerEvent) => {
      element.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-cursor]");
      const nextLabel = target?.dataset.cursor ?? "";
      setLabel(nextLabel === "button" ? "" : nextLabel);
      element.dataset.active = target ? "true" : "false";
    };

    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <div ref={cursor} className="pointer-events-none fixed left-0 top-0 z-[100] hidden size-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white mix-blend-difference transition-[width,height] duration-300 data-[active=true]:size-16 lg:flex" aria-hidden="true">
      {label && <span className="text-[9px] font-bold tracking-[0.15em] text-black mix-blend-normal">{label}</span>}
    </div>
  );
}

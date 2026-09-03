"use client";

import { useEffect, useRef } from "react";

export function CustomCursor() {
  const cursor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = cursor.current;
    if (!node || window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const move = (event: MouseEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        node.style.setProperty("--cursor-x", `${event.clientX}px`);
        node.style.setProperty("--cursor-y", `${event.clientY}px`);
        const target = (event.target as HTMLElement).closest<HTMLElement>("[data-cursor]");
        node.dataset.active = target ? "true" : "false";
        node.textContent = target?.dataset.cursor === "view" ? "VIEW" : "";
      });
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={cursor} className="custom-cursor" aria-hidden="true" />;
}

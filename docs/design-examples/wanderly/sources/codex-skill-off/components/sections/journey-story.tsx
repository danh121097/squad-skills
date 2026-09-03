"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { chapters } from "@/lib/content/travel-content";

export function JourneyStory() {
  const [active, setActive] = useState(0);
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const nodes = root.current?.querySelectorAll<HTMLElement>("[data-chapter]");
    if (!nodes) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(Number((visible.target as HTMLElement).dataset.chapter));
      },
      { rootMargin: "-30% 0px -30% 0px", threshold: [0.1, 0.5, 0.9] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={root} id="story" className="journey-story" aria-label="A week in Bali">
      <div className="story-visual" data-cursor="view">
        {chapters.map((chapter, index) => (
          <Image key={chapter.number} src={chapter.image} alt={chapter.title} fill sizes="50vw" className={index === active ? "is-active" : ""} />
        ))}
        <div className="story-progress"><span style={{ transform: `scaleX(${(active + 1) / chapters.length})` }} /></div>
      </div>
      <div className="story-chapters">
        {chapters.map((chapter, index) => (
          <article key={chapter.number} data-chapter={index} className={index === active ? "is-active" : ""}>
            <div className="chapter-mobile-image">
              <Image src={chapter.image} alt={chapter.title} fill sizes="100vw" />
            </div>
            <span>{chapter.number}</span>
            <h2>{chapter.title}</h2>
            <p>{chapter.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

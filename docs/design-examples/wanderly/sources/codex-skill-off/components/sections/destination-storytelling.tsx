"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { destinations } from "@/lib/content/travel-content";
import { TextReveal } from "@/components/motion/text-reveal";

export function DestinationStorytelling() {
  const [active, setActive] = useState(0);

  return (
    <section id="destinations" className="destinations section-shell" aria-labelledby="destinations-title">
      <div className="destinations-heading">
        <p className="eyebrow">Places worth getting lost in</p>
        <TextReveal as="h2" className="section-title" text={["Not just destinations.", "Stories waiting to happen."]} />
      </div>
      <div className="destination-composition">
        <div className="destination-visual" data-cursor="view">
          {destinations.map((destination, index) => (
            <Image
              key={destination.name}
              src={destination.image}
              alt={`${destination.name}, ${destination.country}`}
              fill
              sizes="(max-width: 767px) 100vw, 58vw"
              className={index === active ? "is-active" : ""}
            />
          ))}
          <span className="destination-index">0{active + 1} / 04</span>
        </div>
        <div className="destination-list">
          {destinations.map((destination, index) => (
            <article key={destination.name} className={index === active ? "is-active" : ""} onPointerEnter={() => setActive(index)} onFocusCapture={() => setActive(index)}>
              <div className="destination-mobile-image">
                <Image src={destination.image} alt={`${destination.name}, ${destination.country}`} fill sizes="100vw" />
              </div>
              <button type="button" onClick={() => setActive(index)} aria-pressed={index === active}>
                <span className="destination-country">{destination.country}</span>
                <span className="destination-name">{destination.name}</span>
              </button>
              <div className="destination-detail">
                <p>{destination.description}</p>
                <a href="#journeys">Explore <ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.5} /></a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

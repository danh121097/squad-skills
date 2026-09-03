"use client";

import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { TextReveal } from "@/components/motion/text-reveal";
import { destinations } from "@/lib/content/travel-content";

const layouts = [
  "md:col-span-7 md:row-span-2",
  "md:col-span-5 md:ml-[12%] md:mt-24",
  "md:col-span-4 md:ml-[20%] md:mt-28",
  "md:col-span-6 md:ml-auto md:mt-4",
];

const aspects = ["aspect-[4/5]", "aspect-[16/10]", "aspect-[4/5]", "aspect-[5/4]"];

export function DestinationStorytelling() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section id="destinations" className="section-space page-shell" aria-labelledby="destinations-heading">
      <div className="mb-16 md:mb-24 md:ml-[8.333%]">
        <p className="eyebrow mb-5 text-[var(--accent)]">Places worth getting lost in</p>
        <TextReveal as="h2" id="destinations-heading" lines={["Not just destinations.", "Stories waiting to happen."]} className="editorial-title max-w-5xl" />
      </div>

      <div className="grid gap-x-12 gap-y-20 md:grid-cols-12 md:gap-y-28">
        {destinations.map((destination, index) => (
          <article key={destination.name} className={layouts[index]}>
            <a href="#final-cta" className="group block" onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(null)} data-cursor="VIEW">
              <div className={`image-frame ${aspects[index]}`}>
                <Image
                  src={destination.image}
                  alt={destination.alt}
                  fill
                  sizes={index === 0 ? "(max-width: 767px) 100vw, 58vw" : "(max-width: 767px) 100vw, 42vw"}
                  className={`object-cover transition-transform duration-[1200ms] ease-[var(--ease-out)] ${active === index ? "scale-[1.045] translate-x-1" : "scale-100"}`}
                />
              </div>
              <div className="mt-5 grid grid-cols-[1fr_auto] gap-x-5 border-t border-black/15 pt-4">
                <div>
                  <p className="eyebrow mb-2 text-[var(--text-muted)]">{destination.country}</p>
                  <h3 className="font-editorial text-[clamp(2.6rem,4vw,4.7rem)] leading-none tracking-[-0.035em]">{destination.name}</h3>
                  <p className="mt-4 max-w-md text-sm leading-6 text-[var(--text-muted)]">{destination.description}</p>
                </div>
                <ArrowUpRight className="mt-1 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" size={20} aria-hidden="true" />
              </div>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

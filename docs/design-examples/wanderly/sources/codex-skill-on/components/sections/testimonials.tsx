"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { testimonials } from "@/lib/content/travel-content";

export function Testimonials() {
  const [active, setActive] = useState(0);
  const current = testimonials[active];
  const select = (next: number) => setActive((next + testimonials.length) % testimonials.length);

  return (
    <section className="section-space overflow-hidden bg-[var(--surface-raised)]" aria-labelledby="testimonial-heading">
      <div className="page-shell">
        <div className="mb-12 flex items-center justify-between">
          <p className="eyebrow text-[var(--accent)]">Letters from the road</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => select(active - 1)} aria-label="Previous testimonial" className="grid size-12 place-items-center rounded-full border border-black/20 transition-colors hover:bg-[var(--night)] hover:text-white"><ArrowLeft size={18} /></button>
            <button type="button" onClick={() => select(active + 1)} aria-label="Next testimonial" className="grid size-12 place-items-center rounded-full border border-black/20 transition-colors hover:bg-[var(--night)] hover:text-white"><ArrowRight size={18} /></button>
          </div>
        </div>

        <div key={active} className="animate-[quote-in_800ms_var(--ease-out)_both]" aria-live="polite">
          <blockquote>
            <p id="testimonial-heading" className="font-editorial max-w-[14ch] text-[clamp(3.6rem,7.4vw,7.8rem)] leading-[0.91] tracking-[-0.05em]">“{current.quote}”</p>
          </blockquote>
          <div className="mt-12 flex flex-wrap items-center gap-5 md:mt-16">
            <div className="flex -space-x-3" aria-hidden="true">
              {current.avatars.map((avatar, index) => <Image key={avatar} src={avatar} alt="" width={48} height={48} className="size-12 rounded-full border-2 border-[var(--surface-raised)] object-cover" />)}
            </div>
            <div>
              <p className="text-sm font-bold">{current.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.13em] text-[var(--text-muted)]">{current.route}</p>
            </div>
          </div>
        </div>

        <div className="mt-16 flex gap-2" aria-label={`Testimonial ${active + 1} of ${testimonials.length}`}>
          {testimonials.map((item, index) => (
            <button key={item.name} type="button" onClick={() => select(index)} aria-label={`Show testimonial ${index + 1}`} aria-current={active === index} className="group h-6 w-20 py-[11px]">
              <span className="block h-px bg-black/20"><span className={`block h-px origin-left bg-black transition-transform duration-700 ${active === index ? "scale-x-100" : "scale-x-0"}`} /></span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

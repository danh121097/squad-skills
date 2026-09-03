"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { testimonials } from "@/lib/content/travel-content";

export function Testimonials() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % testimonials.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

  const move = (direction: number) => setActive((value) => (value + direction + testimonials.length) % testimonials.length);

  return (
    <section className="testimonials section-shell" aria-label="Traveler stories">
      <div className="quote-viewport" aria-live="polite">
        {testimonials.map((testimonial, index) => (
          <figure key={testimonial.names} className={index === active ? "is-active" : ""} aria-hidden={index !== active}>
            <blockquote>“{testimonial.quote}”</blockquote>
            <figcaption>
              <div className="avatar-stack">
                {[1, 2, 3].map((avatar) => <Image key={avatar} src={`/assets/avatar-${avatar}.jpg`} alt="" width={36} height={36} />)}
              </div>
              <div><strong>{testimonial.names}</strong><span>{testimonial.route}</span></div>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="quote-controls">
        <div className="quote-progress">{testimonials.map((item, index) => <button key={item.names} type="button" onClick={() => setActive(index)} aria-label={`Show testimonial ${index + 1}`} aria-pressed={index === active}><span /></button>)}</div>
        <div>
          <button type="button" onClick={() => move(-1)} aria-label="Previous testimonial"><ArrowLeft aria-hidden="true" size={19} strokeWidth={1.5} /></button>
          <button type="button" onClick={() => move(1)} aria-label="Next testimonial"><ArrowRight aria-hidden="true" size={19} strokeWidth={1.5} /></button>
        </div>
      </div>
    </section>
  );
}

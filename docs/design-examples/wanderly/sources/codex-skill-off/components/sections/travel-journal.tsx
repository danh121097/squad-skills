import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { TextReveal } from "@/components/motion/text-reveal";

const stories = [
  { title: "48 hours lost in Tokyo", image: "/assets/journal-tokyo.jpg", className: "journal-lead" },
  { title: "The quiet side of Mallorca", image: "/assets/journal-mallorca.jpg", className: "journal-small" },
  { title: "Why the Dolomites never feel real", image: "/assets/journal-dolomites.jpg", className: "journal-small" },
] as const;

export function TravelJournal() {
  return (
    <section id="stories" className="journal section-shell" aria-labelledby="journal-title">
      <div className="journal-header">
        <p className="eyebrow">From the journal</p>
        <TextReveal as="h2" className="section-title" text={["Stories from", "somewhere else."]} />
      </div>
      <div className="journal-grid">
        {stories.map((story) => (
          <article key={story.title} className={story.className}>
            <a href="#stories" data-cursor="view" aria-label={`Read ${story.title}`}>
              <div className="journal-image"><Image src={story.image} alt="" fill sizes={story.className === "journal-lead" ? "(max-width: 767px) 100vw, 60vw" : "(max-width: 767px) 100vw, 32vw"} /></div>
              <div className="journal-meta"><span>Journal</span><span>8 min read</span></div>
              <h3>{story.title}</h3>
              <ArrowUpRight aria-hidden="true" size={21} strokeWidth={1.4} />
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

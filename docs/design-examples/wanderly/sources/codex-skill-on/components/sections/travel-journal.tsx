import { ArrowUpRight } from "lucide-react";
import { ImageReveal } from "@/components/motion/image-reveal";
import { TextReveal } from "@/components/motion/text-reveal";
import { articles } from "@/lib/content/travel-content";

export function TravelJournal() {
  return (
    <section id="stories" className="section-space page-shell" aria-labelledby="journal-heading">
      <div className="mb-16 flex flex-col justify-between gap-8 md:mb-24 md:flex-row md:items-end">
        <div>
          <p className="eyebrow mb-5 text-[var(--accent)]">From the journal</p>
          <TextReveal as="h2" id="journal-heading" lines={["Stories from", "somewhere else."]} className="editorial-title" />
        </div>
        <a href="#journal-grid" className="link-arrow w-fit border-b border-black/25 pb-2 text-sm font-bold">Read all stories <ArrowUpRight size={17} aria-hidden="true" /></a>
      </div>

      <div id="journal-grid" className="grid gap-x-8 gap-y-16 md:grid-cols-12 md:items-start">
        {articles.map((article, index) => (
          <article key={article.title} className={index === 0 ? "md:col-span-7" : index === 1 ? "md:col-span-4 md:col-start-9" : "md:col-span-4 md:col-start-8 md:mt-24"}>
            <a href="#final-cta" className="group block" data-cursor="READ">
              <ImageReveal src={article.image} alt={article.alt} sizes={index === 0 ? "(max-width: 767px) 100vw, 58vw" : "(max-width: 767px) 100vw, 34vw"} className={index === 0 ? "aspect-[5/4]" : "aspect-[4/5]"} mode="scale" hoverZoom cursorLabel="READ" />
              <div className="mt-5 flex items-start justify-between gap-6 border-t border-black/15 pt-4">
                <div>
                  <p className="eyebrow mb-3 text-[var(--text-muted)]">Journal · {article.read}</p>
                  <h3 className={`font-editorial leading-[0.98] tracking-[-0.035em] ${index === 0 ? "text-[clamp(3rem,5vw,5.5rem)]" : "text-[clamp(2.6rem,3.8vw,4rem)]"}`}>{article.title}</h3>
                </div>
                <ArrowUpRight size={20} className="shrink-0 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden="true" />
              </div>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

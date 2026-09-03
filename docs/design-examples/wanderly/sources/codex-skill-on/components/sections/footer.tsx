const columns = [
  { label: "Explore", links: ["Destinations", "Journeys", "Journal", "Travel guides"] },
  { label: "Company", links: ["About", "Careers", "Contact"] },
  { label: "Social", links: ["Instagram", "YouTube", "Pinterest"] },
];

export function Footer() {
  return (
    <footer id="about" className="bg-[var(--night)] pb-8 text-[var(--surface)]">
      <div className="page-shell">
        <div className="grid gap-12 border-t border-white/15 py-16 md:grid-cols-12 md:py-24">
          <div className="md:col-span-5">
            <p className="max-w-sm text-sm leading-6 text-white/50">Curated journeys for people who want to feel a place—not simply pass through it.</p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:col-span-7">
            {columns.map((column) => (
              <div key={column.label}>
                <p className="eyebrow mb-5 text-white/40">{column.label}</p>
                <ul className="space-y-3">
                  {column.links.map((link) => <li key={link}><a href="#top" className="text-sm text-white/75 transition-colors hover:text-white">{link}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p className="font-editorial overflow-hidden text-[clamp(5rem,16vw,16rem)] leading-[0.72] tracking-[-0.065em] text-white">WANDERLY</p>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/15 pt-5 text-[11px] uppercase tracking-[0.14em] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Wanderly</span>
          <div className="flex gap-6"><a href="#top" className="hover:text-white">Privacy</a><a href="#top" className="hover:text-white">Terms</a></div>
        </div>
      </div>
    </footer>
  );
}

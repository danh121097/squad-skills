const columns = [
  { title: "Explore", links: ["Destinations", "Journeys", "Journal", "Travel Guides"] },
  { title: "Company", links: ["About", "Careers", "Contact"] },
  { title: "Social", links: ["Instagram", "YouTube", "Pinterest"] },
] as const;

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-columns">
        <p>Journeys for people who want to feel the world, not collect it.</p>
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2>{column.title}</h2>
            {column.links.map((link) => <a key={link} href="#hero">{link}</a>)}
          </nav>
        ))}
      </div>
      <div className="footer-wordmark" aria-hidden="true">WANDERLY</div>
      <div className="footer-bottom"><span>© 2026 Wanderly</span><div><a href="#hero">Privacy</a><a href="#hero">Terms</a></div></div>
    </footer>
  );
}

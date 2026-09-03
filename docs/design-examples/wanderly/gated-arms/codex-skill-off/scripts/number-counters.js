function formatValue(element, value) {
  if (element.dataset.format === "compact") return `${Math.round(value / 1000)}K+`;
  const decimals = Number(element.dataset.decimals ?? 0);
  return value.toFixed(decimals);
}

export function initializeNumberCounters({ reducedMotion }) {
  const counters = document.querySelectorAll("[data-count]");
  if (reducedMotion.matches) return;

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const element = entry.target;
        const target = Number(element.dataset.count);
        const duration = 760;
        const startedAt = performance.now();

        const tick = (now) => {
          const elapsed = Math.min(1, (now - startedAt) / duration);
          const eased = 1 - Math.pow(1 - elapsed, 4);
          element.textContent = formatValue(element, target * eased);
          if (elapsed < 1) window.requestAnimationFrame(tick);
        };

        window.requestAnimationFrame(tick);
        currentObserver.unobserve(element);
      });
    },
    { threshold: 0.6 },
  );

  counters.forEach((counter) => observer.observe(counter));
}

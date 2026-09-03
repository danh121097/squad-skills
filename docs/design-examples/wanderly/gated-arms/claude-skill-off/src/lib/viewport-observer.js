/**
 * Viewport observer
 *
 * Thin wrapper over IntersectionObserver used by every reveal on the page.
 * If IntersectionObserver is missing the callback fires immediately, so the
 * content is shown rather than stranded in its hidden state.
 */

const registry = new Map();

function observerFor(key, options) {
  if (registry.has(key)) return registry.get(key);
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const handler = entry.target.__onEnter;
      if (typeof handler === 'function') handler(entry.target);
      observer.unobserve(entry.target);
      delete entry.target.__onEnter;
    });
  }, options);
  registry.set(key, observer);
  return observer;
}

/** Run `handler` once, the first time `element` is meaningfully on screen. */
export function whenInView(element, handler, options = {}) {
  if (!element) return;
  const threshold = options.threshold ?? 0.15;
  const rootMargin = options.rootMargin ?? '0px 0px -10% 0px';

  if (typeof IntersectionObserver !== 'function') {
    handler(element);
    return;
  }

  element.__onEnter = handler;
  observerFor(`${rootMargin}|${threshold}`, { threshold, rootMargin }).observe(element);
}

/**
 * Track which element of a set is currently "active" — used by the chapter
 * story. Calls `handler(index)` whenever the leading element changes.
 */
export function trackActive(elements, handler, options = {}) {
  if (!elements.length) return () => {};
  if (typeof IntersectionObserver !== 'function') {
    handler(0);
    return () => {};
  }

  const visible = new Map();
  let current = -1;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const index = elements.indexOf(entry.target);
        if (index < 0) return;
        if (entry.isIntersecting) visible.set(index, entry.intersectionRatio);
        else visible.delete(index);
      });

      let best = -1;
      let bestRatio = 0;
      visible.forEach((ratio, index) => {
        if (ratio > bestRatio || (ratio === bestRatio && index < best)) {
          best = index;
          bestRatio = ratio;
        }
      });

      if (best >= 0 && best !== current) {
        current = best;
        handler(best);
      }
    },
    {
      threshold: options.threshold ?? [0.15, 0.4, 0.65, 0.9],
      rootMargin: options.rootMargin ?? '-35% 0px -35% 0px',
    }
  );

  elements.forEach((element) => observer.observe(element));
  return () => observer.disconnect();
}

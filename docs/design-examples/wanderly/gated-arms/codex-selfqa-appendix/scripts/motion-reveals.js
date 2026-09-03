const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealEase = 'cubic-bezier(0.16, 1, 0.3, 1)';

function shouldAnimate() {
  return !reducedMotion.matches;
}

export function initHeroEntrance() {
  if (!shouldAnimate()) return;

  const heroImage = document.querySelector('[data-hero-image]');
  const headlineLines = document.querySelectorAll('.hero-title .reveal-mask > span');
  const supportingElements = document.querySelectorAll('.hero-eyebrow, .hero-copy, .hero-link');
  const nav = document.querySelector('.nav-shell');

  heroImage?.animate(
    [{ transform: 'scale(1.08)' }, { transform: 'scale(1)' }],
    { duration: 1200, easing: revealEase }
  );

  headlineLines.forEach((line, index) => {
    line.animate(
      [
        { transform: 'translateY(110%)' },
        { transform: 'translateY(0)' }
      ],
      { duration: 800, delay: 180 + index * 70, easing: revealEase, fill: 'backwards' }
    );
  });

  supportingElements.forEach((element, index) => {
    element.animate(
      [
        { opacity: 0, transform: 'translateY(1.5rem)' },
        { opacity: 1, transform: 'translateY(0)' }
      ],
      { duration: 700, delay: 340 + index * 70, easing: revealEase, fill: 'backwards' }
    );
  });

  nav?.animate(
    [{ opacity: 0, transform: 'translateY(-1rem)' }, { opacity: 1, transform: 'translateY(0)' }],
    { duration: 650, delay: 260, easing: revealEase, fill: 'backwards' }
  );
}

export function initLineReveals() {
  const groups = document.querySelectorAll('[data-line-reveal]');
  if (!groups.length) return;

  if (!shouldAnimate()) {
    groups.forEach((group) => group.querySelectorAll('.statement-lines > span').forEach((line) => line.classList.add('is-active')));
    return;
  }

  groups.forEach((group) => {
    const lines = [...group.querySelectorAll('.statement-lines > span')];
    if (!group.hasAttribute('data-progressive')) {
      const animatedLines = new WeakSet();
      const lineObserver = new IntersectionObserver(
        (entries) => {
          const current = entries.find((entry) => entry.isIntersecting);
          if (!current) return;
          lines.forEach((line) => line.classList.toggle('is-active', line === current.target));
          if (!animatedLines.has(current.target)) {
            current.target.animate(
              [{ transform: 'translateY(0.75rem)' }, { transform: 'translateY(0)' }],
              { duration: 620, easing: revealEase }
            );
            animatedLines.add(current.target);
          }
        },
        { rootMargin: '-42% 0px -42% 0px', threshold: 0 }
      );
      lines.forEach((line) => lineObserver.observe(line));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        lines.forEach((line, index) => {
          window.setTimeout(() => {
            line.classList.add('is-active');
            line.animate(
              [{ transform: 'translateY(0.75rem)' }, { transform: 'translateY(0)' }],
              { duration: 620, easing: revealEase }
            );
          }, index * 90);
        });
        observer.disconnect();
      },
      { threshold: 0.34 }
    );
    observer.observe(group);
  });
}

export function initImageAndTextReveals() {
  if (!shouldAnimate()) return;

  const targets = document.querySelectorAll('[data-image-reveal], [data-text-reveal]');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        if (entry.target.matches('[data-image-reveal]')) {
          const mode = entry.target.dataset.imageReveal;
          const keyframes = mode === 'scale'
            ? [{ transform: 'scale(0.96)' }, { transform: 'scale(1)' }]
            : [{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)' }];
          entry.target.animate(keyframes, { duration: 920, easing: revealEase });
        } else {
          entry.target.animate(
            [
              { opacity: 0, transform: 'translateY(2rem)' },
              { opacity: 1, transform: 'translateY(0)' }
            ],
            { duration: 760, delay: 160, easing: revealEase, fill: 'backwards' }
          );
        }
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.2 }
  );

  targets.forEach((target) => observer.observe(target));
}

export function initCounters() {
  const counterSection = document.querySelector('[data-counters]');
  const counters = document.querySelectorAll('[data-count]');
  if (!counterSection || !counters.length || !shouldAnimate()) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return;

      counters.forEach((counter) => {
        const target = Number(counter.dataset.count);
        const decimals = Number(counter.dataset.decimals || 0);
        const suffix = counter.dataset.suffix || '';
        const startedAt = performance.now();
        const duration = 1100;

        function update(now) {
          const progress = Math.min((now - startedAt) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 4);
          counter.textContent = `${(target * eased).toFixed(decimals)}${suffix}`;
          if (progress < 1) requestAnimationFrame(update);
        }

        requestAnimationFrame(update);
      });
      observer.disconnect();
    },
    { threshold: 0.35 }
  );

  observer.observe(counterSection);
}

export function initWordReveals() {
  if (!shouldAnimate()) return;
  const targets = document.querySelectorAll('[data-word-reveal]');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll('.word-mask > span').forEach((word, index) => {
          word.animate(
            [{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }],
            { duration: 620, delay: index * 45, easing: revealEase, fill: 'backwards' }
          );
        });
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );

  targets.forEach((target) => {
    const words = target.textContent.trim().split(/\s+/);
    target.replaceChildren(...words.flatMap((word, index) => {
      const mask = document.createElement('span');
      const inner = document.createElement('span');
      mask.className = 'word-mask';
      inner.textContent = word;
      mask.append(inner);
      return index === words.length - 1 ? [mask] : [mask, document.createTextNode(' ')];
    }));
    observer.observe(target);
  });
}

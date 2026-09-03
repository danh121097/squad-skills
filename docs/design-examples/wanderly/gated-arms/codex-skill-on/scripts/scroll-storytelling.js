import { motionPreferences } from "./motion-preferences.js";

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function initDestinationInteractions() {
  const root = document.querySelector("[data-destinations]");
  if (!root) return;

  const items = [...root.querySelectorAll("[data-destination]")];
  const images = [...root.querySelectorAll("[data-destination-image]")];

  function activate(id) {
    items.forEach((item) => item.classList.toggle("is-active", item.dataset.destination === id));
    images.forEach((image) => image.classList.toggle("is-active", image.dataset.destinationImage === id));
  }

  items.forEach((item) => {
    item.addEventListener("pointerenter", () => activate(item.dataset.destination));
    item.addEventListener("focusin", () => activate(item.dataset.destination));
  });
}

function initFocusLines() {
  const sections = [...document.querySelectorAll("[data-line-section]")];
  if (!sections.length) return () => {};

  return () => {
    sections.forEach((section) => {
      const lines = [...section.querySelectorAll("[data-focus-line]")];
      const rect = section.getBoundingClientRect();
      const progress = clamp((window.innerHeight * 0.72 - rect.top) / Math.max(rect.height * 0.62, 1));
      const current = Math.min(lines.length - 1, Math.floor(progress * lines.length));
      lines.forEach((line, index) => line.classList.toggle("is-current", index <= current));
    });
  };
}

function initStoryChapters() {
  const root = document.querySelector("[data-story]");
  if (!root) return () => {};
  const chapters = [...root.querySelectorAll("[data-story-chapter]")];
  const images = [...root.querySelectorAll("[data-story-image]")];
  const count = root.querySelector("[data-story-count]");

  return () => {
    if (window.innerWidth < 768) return;
    const targetY = window.innerHeight * 0.5;
    let closest = 0;
    let distance = Number.POSITIVE_INFINITY;
    chapters.forEach((chapter, index) => {
      const rect = chapter.getBoundingClientRect();
      const chapterCenter = rect.top + rect.height / 2;
      if (Math.abs(chapterCenter - targetY) < distance) {
        closest = index;
        distance = Math.abs(chapterCenter - targetY);
      }
    });
    chapters.forEach((chapter, index) => chapter.classList.toggle("is-active", index === closest));
    images.forEach((image, index) => image.classList.toggle("is-active", index === closest));
    count.textContent = String(closest + 1).padStart(2, "0");
  };
}

function initCountUp() {
  const root = document.querySelector("[data-stats]");
  if (!root) return;
  const counters = [...root.querySelectorAll("[data-count]")];

  const finish = () => counters.forEach((counter) => {
    const decimals = Number(counter.dataset.decimals || 0);
    counter.textContent = `${Number(counter.dataset.count).toFixed(decimals)}${counter.dataset.suffix || ""}`;
  });

  if (motionPreferences.reduced) {
    finish();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    const start = performance.now();
    const duration = 1200;

    function tick(now) {
      const progress = clamp((now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      counters.forEach((counter) => {
        const target = Number(counter.dataset.count);
        const decimals = Number(counter.dataset.decimals || 0);
        counter.textContent = `${(target * eased).toFixed(decimals)}${counter.dataset.suffix || ""}`;
      });
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, { threshold: 0.35 });

  observer.observe(root);
}

export function initScrollStorytelling() {
  const header = document.querySelector("[data-site-header]");
  const hero = document.querySelector("[data-hero]");
  const heroMedia = document.querySelector("[data-hero-media]");
  const horizontal = document.querySelector("[data-horizontal-section]");
  const track = document.querySelector("[data-horizontal-track]");
  const parallax = document.querySelector("[data-parallax]");
  const nextPlace = document.querySelector("[data-next-place]");
  const nextMedia = document.querySelector("[data-next-place-media]");
  const updateLines = initFocusLines();
  const updateStory = initStoryChapters();
  let frameRequested = false;

  initDestinationInteractions();
  initCountUp();

  function update() {
    frameRequested = false;
    header.classList.toggle("is-scrolled", window.scrollY > 36);
    updateLines();
    updateStory();

    if (!motionPreferences.reduced && window.innerWidth >= 768) {
      if (hero && heroMedia) {
        const rect = hero.getBoundingClientRect();
        const progress = clamp(-rect.top / Math.max(rect.height * 0.9, 1));
        const scale = 1 - progress * 0.08;
        const margin = progress * Math.min(window.innerWidth * 0.04, 64);
        heroMedia.style.transform = `translate3d(0, 0, 0) scale(${scale.toFixed(4)})`;
        heroMedia.style.borderRadius = `${progress * 32}px`;
        heroMedia.style.inset = `0 ${margin}px`;
      }

      if (horizontal && track) {
        const rect = horizontal.getBoundingClientRect();
        const scrollable = horizontal.offsetHeight - window.innerHeight;
        const progress = clamp(-rect.top / Math.max(scrollable, 1));
        const maxShift = Math.max(0, track.scrollWidth - window.innerWidth);
        track.style.transform = `translate3d(${-progress * maxShift}px, 0, 0)`;
      }

      if (parallax) {
        const rect = parallax.getBoundingClientRect();
        const visibleProgress = clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height));
        parallax.style.setProperty("--parallax-y", `${(visibleProgress - 0.5) * 7}%`);
      }

      if (nextPlace && nextMedia) {
        const rect = nextPlace.getBoundingClientRect();
        const scrollable = nextPlace.offsetHeight - window.innerHeight;
        const progress = clamp(-rect.top / Math.max(scrollable, 1));
        nextMedia.style.setProperty("--next-scale", String(0.88 + progress * 0.12));
        nextMedia.style.setProperty("--next-radius", `${(1 - progress) * 40}px`);
      }
    } else {
      if (heroMedia) {
        heroMedia.style.removeProperty("transform");
        heroMedia.style.removeProperty("border-radius");
        heroMedia.style.removeProperty("inset");
      }
      if (parallax) parallax.style.removeProperty("--parallax-y");
      if (nextMedia) {
        nextMedia.style.removeProperty("--next-scale");
        nextMedia.style.removeProperty("--next-radius");
      }
    }
  }

  function requestUpdate() {
    if (frameRequested) return;
    frameRequested = true;
    requestAnimationFrame(update);
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
  motionPreferences.onChange(requestUpdate);
  update();
}

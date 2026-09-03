const clamp = (value, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));

function sectionProgress(section) {
  const rect = section.getBoundingClientRect();
  const distance = Math.max(1, rect.height - window.innerHeight);
  return clamp(-rect.top / distance);
}

export function initializeScrollScenes() {
  const hero = document.querySelector("[data-hero]");
  const heroFrame = document.querySelector("[data-hero-frame]");
  const horizontal = document.querySelector("[data-horizontal-section]");
  const track = document.querySelector("[data-horizontal-track]");
  const somewhere = document.querySelector("[data-somewhere-next]");
  const somewhereFrame = somewhere?.querySelector(".somewhere-frame");
  const parallaxImages = [...document.querySelectorAll("[data-parallax-image]")];
  const visibleParallaxImages = new Set();

  const parallaxObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visibleParallaxImages.add(entry.target);
      else visibleParallaxImages.delete(entry.target);
    });
  });

  parallaxImages.forEach((image) => parallaxObserver.observe(image));

  let frameRequested = false;

  const render = () => {
    if (hero && heroFrame) {
      const progress = sectionProgress(hero);
      const inset = progress * Math.min(window.innerWidth * 0.04, 48);
      heroFrame.style.setProperty("--hero-inset", `${inset.toFixed(2)}px`);
      heroFrame.style.setProperty("--hero-radius", `${(progress * 32).toFixed(2)}px`);
      heroFrame.style.setProperty("--hero-scale", (1 - progress * 0.08).toFixed(4));
    }

    if (horizontal && track && window.innerWidth >= 768) {
      const progress = sectionProgress(horizontal);
      const maximum = Math.max(0, track.scrollWidth - window.innerWidth);
      track.style.transform = `translate3d(${(-maximum * progress).toFixed(2)}px, 0, 0)`;
    }

    if (somewhere && somewhereFrame) {
      const progress = sectionProgress(somewhere);
      const inset = (1 - progress) * (window.innerWidth < 768 ? 6 : 12);
      somewhereFrame.style.setProperty("--somewhere-inset", `${inset.toFixed(3)}vw`);
      somewhereFrame.style.setProperty("--somewhere-radius", `${((1 - progress) * 40).toFixed(2)}px`);
      somewhereFrame.style.setProperty("--somewhere-scale", (0.88 + progress * 0.12).toFixed(4));
    }

    visibleParallaxImages.forEach((image) => {
      const rect = image.parentElement.getBoundingClientRect();
      const centerOffset = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
      image.style.setProperty("--parallax-y", `${(clamp(centerOffset, -1, 1) * -12).toFixed(2)}px`);
    });

    frameRequested = false;
  };

  const requestRender = () => {
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(render);
  };

  window.addEventListener("scroll", requestRender, { passive: true });
  window.addEventListener("resize", requestRender, { passive: true });
  render();
}

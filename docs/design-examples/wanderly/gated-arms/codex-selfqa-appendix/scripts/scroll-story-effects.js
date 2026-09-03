const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktopMedia = window.matchMedia('(min-width: 56.3125rem)');

function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function sectionProgress(element) {
  const rect = element.getBoundingClientRect();
  const distance = Math.max(element.offsetHeight - window.innerHeight, 1);
  return clamp(-rect.top / distance);
}

export function initScrollStoryEffects() {
  const header = document.querySelector('[data-header]');
  const hero = document.querySelector('[data-hero]');
  const heroFrame = document.querySelector('[data-hero-frame]');
  const heroImage = document.querySelector('[data-hero-image]');
  const horizontal = document.querySelector('[data-horizontal]');
  const horizontalTrack = document.querySelector('[data-horizontal-track]');
  const somewhere = document.querySelector('[data-somewhere]');
  const somewhereFrame = document.querySelector('[data-somewhere-frame]');
  const parallaxImage = document.querySelector('[data-parallax]');
  let framePending = false;

  function render() {
    framePending = false;
    header?.classList.toggle('is-scrolled', window.scrollY > 48);

    if (reducedMotion.matches) return;

    if (hero && heroFrame && heroImage) {
      const progress = sectionProgress(hero);
      heroFrame.style.setProperty('--hero-scale', String(1 - progress * 0.08));
      heroFrame.style.setProperty('--hero-radius', `${progress * 32}px`);
      heroImage.style.setProperty('--hero-image-scale', String(1 + progress * 0.03));
    }

    if (desktopMedia.matches && horizontal && horizontalTrack) {
      const progress = sectionProgress(horizontal);
      const maximumShift = Math.max(horizontalTrack.scrollWidth - window.innerWidth, 0);
      horizontalTrack.style.setProperty('--horizontal-x', `${-maximumShift * progress}px`);
    }

    if (somewhere && somewhereFrame) {
      const progress = sectionProgress(somewhere);
      somewhereFrame.style.setProperty('--somewhere-scale', String(0.88 + progress * 0.12));
      somewhereFrame.style.setProperty('--somewhere-radius', `${40 * (1 - progress)}px`);
    }

    if (parallaxImage) {
      const rect = parallaxImage.parentElement.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        const viewportProgress = clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height));
        parallaxImage.style.setProperty('--parallax-y', `${-9 + viewportProgress * 9}%`);
      }
    }
  }

  function requestRender() {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(render);
  }

  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', requestRender, { passive: true });
  reducedMotion.addEventListener('change', requestRender);
  desktopMedia.addEventListener('change', requestRender);
  render();
}

export function initializeQuoteCarousel({ reducedMotion }) {
  const carousel = document.querySelector("[data-carousel]");
  if (!carousel) return;

  const slides = [...carousel.querySelectorAll("[data-testimonial]")];
  const previous = carousel.querySelector("[data-carousel-previous]");
  const next = carousel.querySelector("[data-carousel-next]");
  const progress = carousel.querySelector("[data-carousel-progress]");
  let activeIndex = 0;

  const showSlide = (index) => {
    activeIndex = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeIndex;
      slide.hidden = !isActive;
      slide.classList.toggle("is-active", isActive);

      if (isActive && !reducedMotion.matches) {
        slide.classList.remove("is-entering");
        void slide.offsetWidth;
        slide.classList.add("is-entering");
      }
    });

    progress?.style.setProperty("--progress-x", `${activeIndex * 100}%`);
  };

  previous?.addEventListener("click", () => showSlide(activeIndex - 1));
  next?.addEventListener("click", () => showSlide(activeIndex + 1));
}

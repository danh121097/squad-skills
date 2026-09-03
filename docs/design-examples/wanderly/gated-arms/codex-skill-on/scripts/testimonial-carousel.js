import { motionPreferences } from "./motion-preferences.js";

export function initTestimonialCarousel() {
  const root = document.querySelector("[data-carousel]");
  if (!root) return;

  const slides = [...root.querySelectorAll("[data-testimonial]")];
  const previous = root.querySelector("[data-carousel-prev]");
  const next = root.querySelector("[data-carousel-next]");
  const progress = root.querySelector("[data-carousel-progress]");
  const status = root.querySelector("[data-carousel-status]");
  let activeIndex = 0;

  function showSlide(index) {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === activeIndex;
      slide.hidden = !active;
      slide.classList.toggle("is-active", active);
      slide.classList.remove("is-entering");
      if (active && !motionPreferences.reduced) {
        requestAnimationFrame(() => slide.classList.add("is-entering"));
      }
    });
    progress.style.transform = `translateX(${activeIndex * 100}%)`;
    status.textContent = `Testimonial ${activeIndex + 1} of ${slides.length}`;
  }

  previous.addEventListener("click", () => showSlide(activeIndex - 1));
  next.addEventListener("click", () => showSlide(activeIndex + 1));
}

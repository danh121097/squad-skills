const testimonials = [
  {
    quote: '“We stopped checking the itinerary after day two. Everything just felt exactly where we were supposed to be.”',
    name: 'Emma & Daniel',
    route: 'London → Bali'
  },
  {
    quote: '“The mountains were immense, but it was the small, quiet details that stayed with us.”',
    name: 'Maya & Noor',
    route: 'Amsterdam → Dolomites'
  },
  {
    quote: '“We arrived looking for a place. We left remembering the people who opened it to us.”',
    name: 'Theo & James',
    route: 'Sydney → Kyoto'
  }
];

export function initTestimonialCarousel() {
  const carousel = document.querySelector('[data-carousel]');
  if (!carousel) return;

  const quote = carousel.querySelector('[data-quote] p');
  const name = carousel.querySelector('[data-quote-name]');
  const route = carousel.querySelector('[data-quote-route]');
  const current = carousel.querySelector('[data-carousel-current]');
  const progress = carousel.querySelector('[data-carousel-progress]');
  const previous = carousel.querySelector('[data-carousel-prev]');
  const next = carousel.querySelector('[data-carousel-next]');
  let activeIndex = 0;

  function render(nextIndex, direction) {
    activeIndex = (nextIndex + testimonials.length) % testimonials.length;
    const testimonial = testimonials[activeIndex];
    quote.textContent = testimonial.quote;
    name.textContent = testimonial.name;
    route.textContent = testimonial.route;
    current.textContent = String(activeIndex + 1);
    progress.style.setProperty('--carousel-progress', String((activeIndex + 1) / testimonials.length));

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      carousel.querySelector('blockquote').animate(
        [
          { opacity: 0, transform: `translateY(${direction * 1.5}rem)` },
          { opacity: 1, transform: 'translateY(0)' }
        ],
        { duration: 480, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );
    }
  }

  previous.addEventListener('click', () => render(activeIndex - 1, -1));
  next.addEventListener('click', () => render(activeIndex + 1, 1));
}

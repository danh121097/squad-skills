/* Traveller quote carousel.

   Local view state: which quote is showing. Manual only — nothing auto-advances, so there is no
   moving target to catch and no timing to pause. Inactive quotes are hidden with `visibility`,
   which removes them from the accessibility tree as well as the page. Without script the three
   quotes read as a plain sequence. */

export function initQuoteCarousel(scope = document) {
  const section = scope.querySelector("[data-voices]");
  if (!section) return;

  const quotes = Array.from(section.querySelectorAll("[data-voice]"));
  const dots = Array.from(section.querySelectorAll("[data-voice-dot]"));
  const previous = section.querySelector("[data-voice-prev]");
  const next = section.querySelector("[data-voice-next]");
  if (quotes.length < 2) return;

  let index = 0;

  const show = (nextIndex) => {
    index = (nextIndex + quotes.length) % quotes.length;
    quotes.forEach((quote) => {
      quote.classList.toggle("is-active", Number(quote.dataset.voice) === index);
    });
    dots.forEach((dot) => {
      dot.classList.toggle("is-active", Number(dot.dataset.voiceDot) === index);
    });
  };

  if (previous) previous.addEventListener("click", () => show(index - 1));
  if (next) next.addEventListener("click", () => show(index + 1));

  show(0);
}

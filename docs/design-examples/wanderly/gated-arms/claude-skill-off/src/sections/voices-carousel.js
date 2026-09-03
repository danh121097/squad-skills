/**
 * Traveller voices
 *
 * An editorial quote that changes, not a row of testimonial cards. The copy
 * lives in a plain array below; the first entry is also authored in the markup
 * so the section reads correctly before any script runs.
 *
 * It never auto-advances: constant movement would fight the rest of the page,
 * and an unannounced rotation is hostile to anyone reading slowly.
 */

const VOICES = [
  {
    quote:
      'We stopped checking the itinerary after day two. Everything just felt exactly where we were supposed to be.',
    name: 'Emma & Daniel',
    route: 'London \u2192 Bali',
  },
  {
    quote:
      'Nine days, no group chat, no schedule. I came back able to hear myself think again.',
    name: 'Priya N.',
    route: 'Toronto \u2192 Kyoto',
  },
  {
    quote:
      'The kind of trip you keep describing badly to friends, because the words never quite hold it.',
    name: 'Mateo & Luc\u00eda',
    route: 'Madrid \u2192 Dolomites',
  },
];

const SWAP_MS = 420;

export function initVoices({ motion, root = document }) {
  const inner = root.querySelector('[data-voices]');
  if (!inner) return;

  const quote = inner.querySelector('[data-voice-quote] p');
  const name = inner.querySelector('[data-voice-name]');
  const route = inner.querySelector('[data-voice-route]');
  const dots = Array.from(inner.querySelectorAll('[data-voice-dots] button'));
  const previous = inner.querySelector('[data-voice-prev]');
  const next = inner.querySelector('[data-voice-next]');
  if (!quote || !dots.length) return;

  let index = 0;
  let swapping = false;

  const paint = () => {
    const voice = VOICES[index];
    quote.textContent = voice.quote;
    if (name) name.textContent = voice.name;
    if (route) route.textContent = voice.route;
    dots.forEach((dot, position) => {
      const active = position === index;
      dot.classList.toggle('is-active', active);
      if (active) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  };

  const goTo = (target) => {
    const bounded = (target + VOICES.length) % VOICES.length;
    if (bounded === index || swapping) return;
    index = bounded;

    if (!motion) {
      paint();
      return;
    }

    swapping = true;
    inner.classList.add('is-swapping');
    window.setTimeout(() => {
      paint();
      inner.classList.remove('is-swapping');
      swapping = false;
    }, SWAP_MS);
  };

  dots.forEach((dot, position) => dot.addEventListener('click', () => goTo(position)));
  if (previous) previous.addEventListener('click', () => goTo(index - 1));
  if (next) next.addEventListener('click', () => goTo(index + 1));
}

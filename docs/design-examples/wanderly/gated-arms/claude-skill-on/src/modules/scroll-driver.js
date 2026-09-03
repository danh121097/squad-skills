/* One scroll loop for the whole page.

   Every scroll-linked behaviour registers a reader here instead of adding its own listener and
   its own requestAnimationFrame. The loop is event-driven: it wakes on scroll or resize, runs
   one frame, and goes back to sleep. Nothing animates on an idle page. */

const readers = new Set();
let frame = 0;
let listening = false;

function readViewport() {
  return {
    scrollY: window.scrollY || window.pageYOffset || 0,
    vh: window.innerHeight,
    vw: window.innerWidth,
  };
}

function runFrame() {
  frame = 0;
  const view = readViewport();
  readers.forEach((reader) => {
    try {
      reader(view);
    } catch (error) {
      /* one misbehaving reader must not stop the rest of the page */
    }
  });
}

function requestFrame() {
  if (frame) return;
  frame = window.requestAnimationFrame(runFrame);
}

function listen() {
  if (listening) return;
  listening = true;
  window.addEventListener("scroll", requestFrame, { passive: true });
  window.addEventListener("resize", requestFrame, { passive: true });
  window.addEventListener("orientationchange", requestFrame, { passive: true });
}

/** Register a scroll reader. Returns an unsubscribe function (its own teardown). */
export function registerScrollReader(reader) {
  readers.add(reader);
  listen();
  requestFrame();
  return () => {
    readers.delete(reader);
  };
}

/** Force a measurement pass — used after layout-changing work such as a resize relayout. */
export function refreshScroll() {
  requestFrame();
}

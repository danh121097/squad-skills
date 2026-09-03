/**
 * Scroll driver
 *
 * One passive scroll listener and one rAF frame for the whole page. Nothing
 * loops when the page is still, so there is no idle animation cost: a frame is
 * only ever scheduled in response to a real scroll or resize.
 *
 * Tasks receive (scrollY, viewportHeight) already measured, which keeps layout
 * reads batched ahead of the writes each task performs.
 */

const scrollTasks = new Set();
const resizeTasks = new Set();

let frameRequested = false;
let scrollY = 0;
let viewportHeight = 0;
let started = false;

function flush() {
  frameRequested = false;
  scrollY = window.scrollY || window.pageYOffset || 0;
  viewportHeight = window.innerHeight;
  scrollTasks.forEach((task) => {
    try {
      task(scrollY, viewportHeight);
    } catch (error) {
      scrollTasks.delete(task);
    }
  });
}

function requestFrame() {
  if (frameRequested) return;
  frameRequested = true;
  window.requestAnimationFrame(flush);
}

function handleResize() {
  resizeTasks.forEach((task) => {
    try {
      task();
    } catch (error) {
      resizeTasks.delete(task);
    }
  });
  requestFrame();
}

/** Register a per-scroll task. Returns an unsubscribe function. */
export function addScrollTask(task) {
  scrollTasks.add(task);
  requestFrame();
  return () => scrollTasks.delete(task);
}

/** Register a task that re-measures layout after a resize. */
export function addResizeTask(task) {
  resizeTasks.add(task);
  try {
    task();
  } catch (error) {
    resizeTasks.delete(task);
  }
  return () => resizeTasks.delete(task);
}

export function startScrollDriver() {
  if (started) return;
  started = true;
  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
  requestFrame();
}

/**
 * Small helper so tasks only touch the DOM when a value actually moved.
 * Avoids thousands of redundant style writes while scrolling.
 */
export function styleWriter(element) {
  const previous = new Map();
  return (property, value) => {
    if (previous.get(property) === value) return;
    previous.set(property, value);
    element.style.setProperty(property, value);
  };
}

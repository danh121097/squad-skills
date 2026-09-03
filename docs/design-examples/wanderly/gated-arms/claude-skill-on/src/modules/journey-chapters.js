/* Sticky chapter story.

   The chapter crossing the middle of the viewport becomes active; the held photograph
   dissolves to the matching frame with a small scale and a short blur, never a hard cut.
   Below 1024px the sticky plate is not rendered at all and each chapter shows its own image,
   so this behaviour simply has nothing to do. */

export function initJourneyChapters(scope = document) {
  const section = scope.querySelector("[data-chapters]");
  if (!section) return;

  const chapters = Array.from(section.querySelectorAll("[data-chapter]"));
  const images = Array.from(section.querySelectorAll("[data-chapter-image]"));
  if (!chapters.length || !images.length) return;

  const setActive = (index) => {
    images.forEach((image) => {
      image.classList.toggle("is-active", Number(image.dataset.chapterImage) === index);
    });
    chapters.forEach((chapter) => {
      chapter.classList.toggle("is-active", Number(chapter.dataset.chapter) === index);
    });
  };

  if (!("IntersectionObserver" in window)) {
    setActive(0);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(Number(entry.target.dataset.chapter));
      });
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
  );

  chapters.forEach((chapter) => observer.observe(chapter));
  setActive(0);
}

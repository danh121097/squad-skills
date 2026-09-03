export function initializeStoryChapters({ reducedMotion }) {
  if (reducedMotion.matches || window.matchMedia("(max-width: 767px)").matches) return;

  const chapters = [...document.querySelectorAll("[data-story-chapter]")];
  const images = [...document.querySelectorAll("[data-story-image]")];
  const count = document.querySelector("[data-story-count]");

  if (!chapters.length || !images.length) return;

  const activate = (index) => {
    chapters.forEach((chapter, chapterIndex) => chapter.classList.toggle("is-active", chapterIndex === index));
    images.forEach((image, imageIndex) => classListToggle(image, "is-active", imageIndex === index));
    if (count) count.textContent = String(index + 1).padStart(2, "0");
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const activeEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (activeEntry) activate(Number(activeEntry.target.dataset.storyChapter));
    },
    { rootMargin: "-34% 0px -34% 0px", threshold: [0, 0.25, 0.5, 0.75] },
  );

  chapters.forEach((chapter) => observer.observe(chapter));
}

function classListToggle(element, className, force) {
  element.classList.toggle(className, force);
}

export function initJourneyStory() {
  const chapters = [...document.querySelectorAll('[data-story-chapter]')];
  const images = [...document.querySelectorAll('[data-story-image]')];
  if (!chapters.length || !images.length) return;

  function activate(index) {
    chapters.forEach((chapter, chapterIndex) => chapter.classList.toggle('is-active', chapterIndex === index));
    images.forEach((image, imageIndex) => image.classList.toggle('is-active', imageIndex === index));
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      activate(Number(visible.target.dataset.storyChapter));
    },
    { rootMargin: '-24% 0px -24% 0px', threshold: [0.1, 0.3, 0.6] }
  );

  chapters.forEach((chapter) => observer.observe(chapter));
}

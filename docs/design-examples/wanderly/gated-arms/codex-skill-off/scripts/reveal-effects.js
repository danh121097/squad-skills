function observeLineStories() {
  document.querySelectorAll("[data-line-story]").forEach((story) => {
    const lines = [...story.querySelectorAll(".statement-line")];
    if (!lines.length) return;

    lines[0].classList.add("is-current");

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;
        lines.forEach((line) => line.classList.toggle("is-current", line === visible.target));
      },
      { rootMargin: "-38% 0px -38% 0px", threshold: [0, 0.5, 1] },
    );

    lines.forEach((line) => observer.observe(line));
  });
}

function observeClipReveals() {
  const revealTargets = document.querySelectorAll("[data-clip-reveal]");
  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        currentObserver.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.18 },
  );

  revealTargets.forEach((target) => observer.observe(target));
}

function prepareWordReveal(element) {
  const label = element.textContent.replace(/\s+/g, " ").trim();
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let currentNode = walker.nextNode();

  while (currentNode) {
    textNodes.push(currentNode);
    currentNode = walker.nextNode();
  }

  let wordIndex = 0;
  textNodes.forEach((textNode) => {
    const fragment = document.createDocumentFragment();

    textNode.textContent.split(/(\s+)/).forEach((part) => {
      if (!part || /^\s+$/.test(part)) {
        fragment.append(part);
        return;
      }

      const mask = document.createElement("span");
      const word = document.createElement("span");
      mask.className = "word-mask";
      mask.setAttribute("aria-hidden", "true");
      mask.style.setProperty("--word-delay", `${wordIndex * 35}ms`);
      word.textContent = part;
      mask.append(word);
      fragment.append(mask);
      wordIndex += 1;
    });

    textNode.replaceWith(fragment);
  });

  element.setAttribute("aria-label", label);
}

function observeWordReveals() {
  const headings = [...document.querySelectorAll("[data-word-reveal]")];
  headings.forEach(prepareWordReveal);

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-word-revealed");
        currentObserver.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -16% 0px", threshold: 0.35 },
  );

  headings.forEach((heading) => observer.observe(heading));
}

export function initializeRevealEffects({ reducedMotion }) {
  if (reducedMotion.matches) {
    document.querySelectorAll(".statement-line").forEach((line) => line.classList.add("is-current"));
    return;
  }

  observeLineStories();
  observeClipReveals();
  observeWordReveals();
}

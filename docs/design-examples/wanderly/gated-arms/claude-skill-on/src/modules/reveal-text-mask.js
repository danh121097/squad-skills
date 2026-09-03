/* Typography reveal.

   Splits a headline into masked words. Each word is its own clip box, so the line rewraps
   naturally at any viewport and the reveal still reads as type rising into place.

   `words` staggers every word; `lines` gives all words on a line the same delay, which reads as
   a line-by-line reveal but keeps the wrapping honest.

   The mask is a clip-path with a negative top inset rather than `overflow: hidden`, so ascenders
   are never trimmed and the hidden word adds no scrollable overflow to the page. */

const MODES = { WORDS: "words", LINES: "lines" };

export function splitIntoMasks(root, mode = MODES.WORDS) {
  if (!root || root.dataset.splitDone === "true") return;

  const lineNodes = Array.from(root.querySelectorAll(".line"));
  const lines = lineNodes.length ? lineNodes : [root];
  let wordCounter = 0;

  lines.forEach((line, lineIndex) => {
    const words = line.textContent.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return;

    line.textContent = "";
    line.classList.add("rt-line");

    words.forEach((word, index) => {
      const mask = document.createElement("span");
      mask.className = "rt-word";
      mask.style.setProperty("--i", String(mode === MODES.LINES ? lineIndex : wordCounter));

      const inner = document.createElement("span");
      inner.textContent = word;
      mask.appendChild(inner);
      line.appendChild(mask);

      if (index < words.length - 1) line.appendChild(document.createTextNode(" "));
      wordCounter += 1;
    });
  });

  root.dataset.splitDone = "true";
}

/** Prepare every headline that opted in through `data-reveal-text`. */
export function prepareTextReveals(scope = document) {
  Array.from(scope.querySelectorAll("[data-reveal-text]")).forEach((node) => {
    splitIntoMasks(node, node.dataset.revealText === MODES.LINES ? MODES.LINES : MODES.WORDS);
  });
}

/**
 * Captures the measurement primitives before candidate code can replace them.
 *
 * Every rendered gate is a measurement taken inside the page it is grading, so
 * the page can decide what the gate sees. Roughly thirty lines of candidate
 * JavaScript — wrapping `getComputedStyle`, patching
 * `Element.prototype.getBoundingClientRect`, pre-empting `window.axe` — turned
 * a run failing three critical gates into a clean pass. A gate whose
 * measurements the graded artifact can rewrite is not a gate.
 *
 * This script runs through Playwright's init hook, which fires before any page
 * script, and stores the original functions on a non-configurable,
 * non-writable global. A later assignment to that name is a `TypeError` in
 * strict mode and a silent no-op otherwise; neither replaces the captured
 * references.
 *
 * It is a mitigation, not a sandbox. A page still controls its own DOM, and
 * nothing here would stop a determined attacker with the same privileges. It
 * closes the accidental case and makes the deliberate one visible, which is
 * what a grading harness needs: `integrity()` re-checks the live globals
 * against the captured ones, and a mismatch is reported rather than measured
 * around.
 */
export const captureOriginalsScript = String.raw`
(() => {
  const originals = {
    axeWasPresent: Object.prototype.hasOwnProperty.call(window, 'axe'),
    getBoundingClientRect: Element.prototype.getBoundingClientRect,
    getComputedStyle: window.getComputedStyle,
    // Document and Element carry separate implementations of the same mixin
    // method; calling one on the other throws "Illegal invocation".
    documentQueryAll: Document.prototype.querySelectorAll,
    elementQueryAll: Element.prototype.querySelectorAll,
    stringify: JSON.stringify,
  };

  const integrity = () =>
    window.getComputedStyle === originals.getComputedStyle &&
    Element.prototype.getBoundingClientRect === originals.getBoundingClientRect &&
    Document.prototype.querySelectorAll === originals.documentQueryAll &&
    Element.prototype.querySelectorAll === originals.elementQueryAll &&
    JSON.stringify === originals.stringify &&
    !originals.axeWasPresent
      ? 'intact'
      : 'compromised';

  const selectorFor = (element) => {
    if (!element || element === document.body) return 'body';
    const parts = [];
    let node = element;
    while (node && node.nodeType === 1 && node !== document.body && parts.length < 5) {
      let part = node.tagName.toLowerCase();
      if (node.id) { parts.unshift(part + '#' + node.id); break; }
      const siblings = node.parentElement
        ? Array.from(node.parentElement.children).filter((c) => c.tagName === node.tagName)
        : [];
      if (siblings.length > 1) part += ':nth-of-type(' + (siblings.indexOf(node) + 1) + ')';
      const className = typeof node.className === 'string' ? node.className.trim().split(/\s+/)[0] : '';
      if (className) part += '.' + className;
      parts.unshift(part);
      node = node.parentElement;
    }
    return parts.join(' > ') || 'body';
  };
  Object.defineProperty(window, '__evalOriginals', {
    configurable: false,
    enumerable: false,
    value: Object.freeze({
      computedStyle: (element) => originals.getComputedStyle.call(window, element),
      integrity,
      queryAll: (root, selector) =>
        Array.from(
          (root.nodeType === 9 ? originals.documentQueryAll : originals.elementQueryAll).call(
            root,
            selector
          )
        ),
      rect: (element) => originals.getBoundingClientRect.call(element),
      // Defined here rather than on \u0060window\u0060 by the observation script: the
      // keyboard traversal calls it between evaluates, and a page global would
      // be clobberable in between, which is exactly what INV-KEYBOARD-001 reads.
      selectorFor,
    }),
    writable: false,
  });
})()
`;

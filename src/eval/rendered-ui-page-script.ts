/**
 * The observation script, kept as source text rather than a function.
 *
 * This repository's `tsconfig.json` declares only the ESNext and Node libs, so
 * DOM globals are deliberately untyped here; shipping the script as a string
 * keeps browser code out of the type surface instead of widening `lib` for the
 * whole repository. Playwright evaluates it and returns a plain object that the
 * gate runner consumes as a `ViewportSnapshot`.
 *
 * Everything it reads is a *rendered* value: `getComputedStyle` resolves custom
 * properties, inheritance, and cascade, so contrast comes from what a viewer
 * sees rather than from what a token file declares.
 */
export const collectObservationsScript = String.raw`
(() => {
  // Captured by the init script before any candidate code ran. Measuring
  // through these means a page that patches its own DOM methods cannot change
  // the numbers it is graded on, and \u0060integrity\u0060 reports when it tried.
  const measure = window.__evalOriginals;
  const observationIntegrity = measure ? measure.integrity() : 'compromised';

  if (!measure) {
    return {
      animations: [],
      clippedElements: [],
      contrastSamples: [],
      documentClientWidth: 0,
      documentScrollWidth: 0,
      interactiveTargets: [],
      observationIntegrity,
      renderedElementCount: 0,
    };
  }

  const selectorFor = measure.selectorFor;

  const parseColor = (value) => {
    const match = String(value).match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const parts = match[1].split(/[ ,/]+/).filter((p) => p.length > 0).map(Number);
    if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  };

  const luminance = (color) => {
    const channel = (value) => {
      const v = value / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
  };

  const blend = (front, back) =>
    front.a >= 1
      ? front
      : {
          r: front.r * front.a + back.r * (1 - front.a),
          g: front.g * front.a + back.g * (1 - front.a),
          b: front.b * front.a + back.b * (1 - front.a),
          a: 1,
        };

  const effectiveBackground = (element) => {
    let node = element;
    let layer = { r: 255, g: 255, b: 255, a: 1 };
    const stack = [];
    while (node && node.nodeType === 1) {
      const color = parseColor(measure.computedStyle(node).backgroundColor);
      if (color && color.a > 0) stack.push(color);
      if (color && color.a >= 1) break;
      node = node.parentElement;
    }
    for (let i = stack.length - 1; i >= 0; i -= 1) layer = blend(stack[i], layer);
    return layer;
  };

  const contrastRatio = (front, back) => {
    const light = Math.max(luminance(front), luminance(back));
    const dark = Math.min(luminance(front), luminance(back));
    return (light + 0.05) / (dark + 0.05);
  };

  const isVisible = (element) => {
    const style = measure.computedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
    const rect = measure.rect(element);
    return rect.width > 0 && rect.height > 0;
  };

  const hasOwnText = (element) =>
    Array.from(element.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);

  const interactiveSelector =
    'a[href],button,input:not([type="hidden"]),select,textarea,summary,' +
    '[role="button"],[role="link"],[role="checkbox"],[role="switch"],[role="tab"],[role="menuitem"],[tabindex]';

  // WCAG 1.4.3 and 1.4.11 both exempt an inactive user interface component. A
  // greyed-out button is greyed out on purpose, and failing it would push
  // candidates toward disabled states that read as enabled.
  const isInactive = (element) =>
    element.disabled === true ||
    element.getAttribute('aria-disabled') === 'true' ||
    element.closest('[disabled],[aria-disabled="true"],fieldset[disabled]') !== null;

  const contrastSamples = [];
  const seenContrast = new Set();
  for (const element of measure.queryAll(document.body, '*')) {
    if (!isVisible(element) || isInactive(element)) continue;
    const style = measure.computedStyle(element);

    if (hasOwnText(element)) {
      const foreground = parseColor(style.color);
      if (foreground) {
        const key = selectorFor(element) + '|text';
        if (!seenContrast.has(key)) {
          seenContrast.add(key);
          contrastSamples.push({
            bold: Number(style.fontWeight) >= 700 || style.fontWeight === 'bold',
            fontSizePx: parseFloat(style.fontSize) || 16,
            kind: 'text',
            ratio: contrastRatio(blend(foreground, effectiveBackground(element)), effectiveBackground(element)),
            selector: selectorFor(element),
          });
        }
      }
    }

    // Non-text contrast applies to the visual information needed to identify a
    // *component*, not to every line on the page. Sampling any bordered element
    // failed card dividers and hairline rules, which 1.4.11 explicitly does not
    // cover, and a false critical is worse here than a missed decorative one.
    const borderWidth = parseFloat(style.borderTopWidth) || 0;
    const borderColor = parseColor(style.borderTopColor);
    if (
      element.matches(interactiveSelector) &&
      borderWidth >= 1 &&
      borderColor &&
      borderColor.a > 0 &&
      element.parentElement
    ) {
      const key = selectorFor(element) + '|ui';
      if (!seenContrast.has(key)) {
        seenContrast.add(key);
        const behind = effectiveBackground(element.parentElement);
        contrastSamples.push({
          bold: false,
          fontSizePx: 0,
          kind: 'ui',
          ratio: contrastRatio(blend(borderColor, behind), behind),
          selector: selectorFor(element),
        });
      }
    }
  }

  const clippedElements = [];
  for (const element of measure.queryAll(document.body, '*')) {
    if (!isVisible(element)) continue;
    const style = measure.computedStyle(element);
    const clips = style.overflowX === 'hidden' || style.overflowX === 'clip';
    if (clips && element.scrollWidth > element.clientWidth + 1) clippedElements.push(selectorFor(element));
  }

  const interactiveTargets = [];
  for (const element of measure.queryAll(document, interactiveSelector)) {
    if (!isVisible(element)) continue;
    const rect = measure.rect(element);
    const tabIndex = element.getAttribute('tabindex');
    interactiveTargets.push({
      focusable: !element.hasAttribute('disabled') && tabIndex !== '-1' && !element.closest('[aria-hidden="true"]'),
      height: rect.height,
      selector: selectorFor(element),
      width: rect.width,
    });
  }

  const keyframeProperties = new Map();
  for (const sheet of Array.from(document.styleSheets)) {
    let rules;
    try { rules = Array.from(sheet.cssRules); } catch { continue; }
    for (const rule of rules) {
      if (rule.type !== CSSRule.KEYFRAMES_RULE) continue;
      const properties = new Set();
      for (const frame of Array.from(rule.cssRules)) {
        for (const property of Array.from(frame.style)) properties.add(property);
      }
      keyframeProperties.set(rule.name, Array.from(properties));
    }
  }

  const toMilliseconds = (value) => {
    const trimmed = String(value).trim();
    if (trimmed.endsWith('ms')) return parseFloat(trimmed) || 0;
    if (trimmed.endsWith('s')) return (parseFloat(trimmed) || 0) * 1000;
    return 0;
  };

  const animations = [];
  for (const element of measure.queryAll(document.body, '*')) {
    if (!isVisible(element)) continue;
    const style = measure.computedStyle(element);
    const selector = selectorFor(element);

    const transitionProperties = style.transitionProperty.split(',').map((p) => p.trim()).filter((p) => p && p !== 'none');
    const transitionDurations = style.transitionDuration.split(',').map(toMilliseconds);
    if (transitionProperties.length > 0) {
      const duration = Math.max.apply(null, transitionDurations.length > 0 ? transitionDurations : [0]);
      if (duration > 0) animations.push({ durationMs: duration, properties: transitionProperties, selector });
    }

    const animationNames = style.animationName.split(',').map((n) => n.trim()).filter((n) => n && n !== 'none');
    const animationDurations = style.animationDuration.split(',').map(toMilliseconds);
    for (let i = 0; i < animationNames.length; i += 1) {
      const duration = animationDurations[i] !== undefined ? animationDurations[i] : animationDurations[0] || 0;
      if (duration <= 0) continue;
      animations.push({
        durationMs: duration,
        properties: keyframeProperties.get(animationNames[i]) || [animationNames[i]],
        selector,
      });
    }
  }

  return {
    animations,
    clippedElements,
    contrastSamples,
    documentClientWidth: document.documentElement.clientWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    interactiveTargets,
    observationIntegrity,
    renderedElementCount: measure.queryAll(document.body, '*').length,
  };
})()
`;

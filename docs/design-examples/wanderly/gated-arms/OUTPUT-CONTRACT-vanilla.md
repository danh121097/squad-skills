# Output contract

Write the deliverable into `out/`. Every file you create must be inside `out/`.

A grader then builds `out/` with Vite and observes it in headless Chromium at five
viewports (320, 375, 768, 1280, 1920 wide), running deterministic gates for build,
axe-core accessibility, rendered text and non-text contrast, horizontal overflow and
clipping, keyboard reachability, `prefers-reduced-motion`, touch-target size, animation
cost, dependency use, and presentational scope.

Hard requirements:

- `out/index.html` is the Vite entry. It loads the page's own CSS and ES modules.
- `out/package.json` exists and declares no dependencies:
  `{ "name": "candidate", "private": true, "dependencies": {} }`
- **No dependencies and no network.** Do not install packages and do not import React,
  Vue, Tailwind, GSAP, Lenis, Framer Motion, Lucide, or any other library, from npm or a
  CDN. Write vanilla HTML, CSS, and ES modules, and express the same design and motion
  intent directly with CSS, the Web Animations API, `IntersectionObserver`, and scroll
  listeners. Icons are inline SVG.
- **Imagery is supplied.** It already sits in `out/public/assets/` and Vite copies that
  directory verbatim, so reference it as `/assets/<file>.jpg`. Do not add, fetch, or
  generate other images, and do not open the image files themselves — they are
  opaque binaries you reference by path, never content you need to read.
  Available files:
  `hero-coastline.jpg`, `amalfi.jpg`, `kyoto.jpg`, `bali.jpg`, `alps.jpg`,
  `exp-ocean.jpg`, `exp-mountains.jpg`, `exp-city.jpg`, `exp-wild.jpg`,
  `journey-bali.jpg`, `chapter-01.jpg`, `chapter-02.jpg`, `chapter-03.jpg`,
  `chapter-04.jpg`, `journal-tokyo.jpg`, `journal-mallorca.jpg`,
  `journal-dolomites.jpg`, `somewhere-next.jpg`, `avatar-1.jpg`, `avatar-2.jpg`,
  `avatar-3.jpg`.
  They are atmospheric placeholders standing in for commissioned photography; treat them
  as the photography and compose around them.
- **Fonts are not fetched.** Declare the intended editorial serif and UI sans as font
  stacks with real system fallbacks (for example a serif stack ending in `Georgia, serif`
  and a sans stack ending in `system-ui, sans-serif`). No `@import`, no `<link>` to a font
  host.
- **Presentational layer only.** No state management, data fetching, API calls, routing,
  persistence, storage, analytics, or credentials. Section content is authored in the
  markup or in a plain data array inside a module. Local view state — an open menu, a
  hovered card, the active carousel index — is presentational and is fine.
- Build the reusable behaviors the brief asks for as their own modules rather than
  inlining one-off code.
- Verify your own work before you finish: run `npx --no-install vite build` inside `out/`
  if Vite resolves, and otherwise re-read the markup for unclosed tags, broken module
  paths, and missing files. The build must succeed.

Finish when `out/` holds the complete page. Do not write a summary file, a README, or
notes into `out/`.

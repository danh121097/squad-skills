# Output contract

Write the deliverable into `out/`. Every file you create must be inside `out/`.

Build the page on the stack the brief names. This is a real application, not a
static mock: it installs, type-checks, and builds.

Hard requirements:

- **Stack, as the brief specifies.** Next.js (App Router) + TypeScript +
  Tailwind CSS + GSAP (with ScrollTrigger) + Lenis + `lucide-react` +
  `next/image` + `next/font`. Install them with `pnpm`. You have network access.
- `out/package.json`, `out/tsconfig.json`, and the Next.js config are yours to
  write. Pin nothing older than the current major of each package.
- **Imagery is supplied.** It already sits in `out/public/assets/`; reference it
  through `next/image` as `/assets/<file>.jpg`. Do not add, fetch, or generate
  other images, and do not open the image files themselves — they are opaque
  binaries you reference by path, never content you need to read.
  Available files:
  `hero-coastline.jpg`, `amalfi.jpg`, `kyoto.jpg`, `bali.jpg`, `alps.jpg`,
  `exp-ocean.jpg`, `exp-mountains.jpg`, `exp-city.jpg`, `exp-wild.jpg`,
  `journey-bali.jpg`, `chapter-01.jpg`, `chapter-02.jpg`, `chapter-03.jpg`,
  `chapter-04.jpg`, `journal-tokyo.jpg`, `journal-mallorca.jpg`,
  `journal-dolomites.jpg`, `somewhere-next.jpg`, `avatar-1.jpg`, `avatar-2.jpg`,
  `avatar-3.jpg`.
  They are atmospheric placeholders standing in for commissioned photography;
  treat them as the photography and compose around them. Their intrinsic size is
  not the layout's business — give `next/image` the sizes the design wants.
- **Fonts through `next/font`.** Pick the editorial serif and the UI sans the
  brief describes and load them with `next/font/google`, with real fallbacks
  declared. No raw `<link>` to a font host.
- **Presentational layer only.** No state management library, data fetching, API
  calls, routing beyond the single page, persistence, storage, analytics, or
  credentials. Section content is authored in the markup or in typed data modules
  under `lib/content/`. Local view state — an open menu, a hovered card, the
  active carousel index — is presentational and is fine.
- **Reusable behaviors are their own components**, as the brief asks: the text
  reveal, the image reveal, the magnetic button, and the cursor are each a
  component other sections use, not code inlined per section.
- **Motion respects `prefers-reduced-motion`**, and the fallback is a real
  fallback: content is present and legible with animation removed, not merely
  animated more quickly.
- **Verify before you finish.** Run, inside `out/`:
  - `pnpm install`
  - `pnpm exec tsc --noEmit`
  - `pnpm build`
    All three must succeed. If `pnpm build` fails, fix the cause; do not delete the
    failing section to make it pass.

Finish when `out/` holds the complete application and `pnpm build` succeeds. Do
not write a summary file, a README, or notes into `out/`.

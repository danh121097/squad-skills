# Task

Build the presentational layer for a premium, cinematic travel landing page for a
fictional travel brand called **Wanderly**.

The page should feel like a combination of Apple product storytelling, Airbnb travel
discovery, Awwwards-level editorial web design, premium travel magazines, and modern
luxury hospitality websites. The goal is NOT a typical travel booking website. It is a
visually impressive, highly polished frontend experience that could be featured in a
senior frontend developer portfolio: expensive, intentional, spacious, cinematic, and
highly interactive.

## Art direction

Apple's typography and scroll storytelling x Airbnb's emotional travel photography x
high-end editorial magazine layouts. Do NOT use a typical SaaS layout.

Avoid: excessive cards, unnecessary borders, excessive shadows, glassmorphism
everywhere, colorful gradients, generic dashboard layouts, repetitive 3-column
sections, overly rounded UI, stock-looking components.

Use: huge typography, cinematic imagery, asymmetric layouts, editorial composition,
overlapping elements, negative space, subtle motion, refined micro-interactions.

The page should feel more like an interactive travel story than a booking platform.

## Design system

Colors — main background `#F7F5F0` (warm editorial off-white), primary text `#111111`,
secondary text `#6B6B65`, dark section `#111713`, accent green `#385A4A`, warm accent
`#D7864A`. Avoid using too many colors; photography provides most of the visual color.

Typography — headings in an editorial serif (Instrument Serif, Cormorant Garamond, or
DM Serif Display), UI/body in a minimal sans (Inter, Manrope, or Geist). Strong contrast
between the two. Hero headline `clamp(72px, 8vw, 140px)`, line-height 0.9-1, slightly
negative letter spacing. Section headings 56-96px. Body 16-20px. Small labels 11-13px,
uppercase, letter-spacing 0.14em. Typography should feel like a luxury fashion editorial.

Global layout — max-width 1440-1600px. Horizontal padding: desktop 48-80px, tablet 32px,
mobile 20px. Sections commonly carry 120-200px of vertical breathing room. Whitespace is
a major part of the design.

## Sections

1. **Navigation** — ultra-minimal floating nav overlaying the hero. Left `WANDERLY`;
   center `Destinations`, `Journeys`, `Stories`, `About`; right a search control and a
   minimal pill CTA `Plan a trip`. Initially transparent with light text; after scrolling
   it becomes a floating bar with a slightly off-white background, subtle backdrop blur,
   dark text, a thin border, a soft shadow, and it shrinks slightly. On mobile: logo plus
   a menu button that opens a cinematic full-screen menu whose items animate upward
   sequentially.
2. **Cinematic hero** — full screen, `100svh`. A breathtaking cinematic destination
   visual with editorial, atmospheric character (Italian coast, Dolomites, Bali, Swiss
   Alps, Mediterranean coastline). Subtle bottom gradient; do not heavily darken it.
   Content sits toward the bottom. Small label `CURATED JOURNEYS AROUND THE WORLD`.
   Headline `Go somewhere` / `you'll remember.` at roughly 100-140px desktop. Supporting
   text "Thoughtfully curated journeys, extraordinary places, and stories worth bringing
   home." CTA `Explore journeys` with a minimal arrow animation. On load: the visual
   scales 1.08 -> 1, headline lines reveal through masked overflow, text slides upward,
   nav fades in, CTA last, roughly 1-1.5s of staggered timing. On scroll away from the
   hero the visual scales 1 -> 0.92, border-radius 0 -> 32px, and horizontal margins
   gradually appear, so the full-screen visual becomes an editorial image block.
3. **Intro statement** — minimal text-only section, huge typography: "Travel isn't about
   / seeing more places. / It's about feeling / something new." Lines reveal one by one
   on scroll; inactive lines sit at opacity 0.2 and the current line at 1. Clean
   background, no cards.
4. **Destination storytelling** — label `PLACES WORTH GETTING LOST IN`, heading "Not just
   destinations. / Stories waiting to happen." An asymmetric editorial showcase, not a
   regular grid: a large vertical visual on the left, a smaller landscape visual top
   right, a text block below. Destinations: Amalfi Coast (Italy), Kyoto (Japan), Bali
   (Indonesia), Swiss Alps (Switzerland). Each carries the name, the country, and a short
   editorial sentence — e.g. AMALFI COAST / Italy / "Sun-bleached villages, winding roads
   and endless Mediterranean blue." — plus a minimal `Explore ->` link. Hovering a
   destination name scales and subtly shifts the corresponding visual. Visuals use
   overflow hidden and a 4-12px radius; avoid overly rounded cards.
5. **Horizontal travel experience** — immersive horizontal section on background
   `#111713` with off-white text. Heading "Choose your kind / of escape." Panels: 01
   Ocean "Slow mornings. Salt air. Nothing planned."; 02 Mountains "Go where the signal
   disappears."; 03 City "Culture, chaos and unforgettable nights."; 04 Wild "Places that
   still feel untouched." Each panel is a full-height cinematic visual. On desktop,
   vertical scrolling drives horizontal movement; on mobile, native horizontal swipe.
6. **Featured journey** — label `FEATURED JOURNEY`, title "Seven days / in the slower
   side / of Bali." A large visual occupying about 65-70% of the width with supporting
   text in the remainder. Trip details: 7 days, 4 boutique stays, 12 experiences, max 8
   travelers. Price `From $1,240`. CTA `Discover the journey ->`. As the visual enters
   the viewport it reveals with clip-path `inset(100% 0 0 0)` -> `inset(0% 0 0 0)`, the
   text reveals slightly afterward, and the visual carries subtle parallax.
7. **Sticky journey story** — Apple-style storytelling: a sticky visual on the left, and
   scrolling content on the right. Chapters: 01 "Wake up above the jungle."; 02 "Swim
   beneath hidden waterfalls."; 03 "Eat where the locals eat."; 04 "Watch the sun
   disappear into the ocean." Each chapter has a large chapter number, a headline, and a
   short description. When a chapter becomes active the visual changes by crossfade,
   scale, and blur — never an abrupt switch.
8. **Manifesto** — minimal full-screen typography on the warm off-white background,
   centered: "The best trips / aren't measured / in miles." Each line progressively
   becomes visible on scroll. Roughly 100px of spacing around the text. No CTA, no extra
   UI.
9. **Travel journal** — editorial magazine section. Header `FROM THE JOURNAL`, heading
   "Stories from / somewhere else." Three articles in an editorial layout, NOT equal
   cards: article 1 large, occupying about 60% width; articles 2 and 3 smaller and
   vertical. Stories: "48 hours lost in Tokyo", "The quiet side of Mallorca", "Why the
   Dolomites never feel real". Metadata in tiny uppercase type: `JOURNAL`, `8 MIN READ`.
   On hover the visual zooms 1 -> 1.04 and the arrow translates right.
10. **Numbers** — ultra-minimal stats, huge numerals 80-120px: 42 COUNTRIES, 128 CURATED
    JOURNEYS, 18K+ TRAVELERS, 4.9 AVERAGE RATING. Numbers count up when visible. No
    cards; subtle horizontal separators only.
11. **Testimonials** — no traditional testimonial cards. A large editorial quote
    carousel: "We stopped checking the itinerary / after day two. Everything just felt /
    exactly where we were supposed to be." Below it: `Emma & Daniel`, `London -> Bali`,
    with tiny traveler avatars. Transitions fade and slide vertically, with a subtle
    progress indicator.
12. **Fullscreen destination transition** — a full-screen mountain or coastal visual.
    Label `SOMEWHERE NEXT`, large title "Where will / you disappear to?" As the user
    scrolls the visual scales 0.88 -> 1 and its radius goes 40px -> 0 until it fills the
    screen, like an Apple product showcase transition.
13. **Final CTA** — background `#111713`, minimal layout, huge serif headline "The world
    / is waiting." Small text "Find a journey worth remembering." CTA
    `Explore journeys ->` and a secondary CTA `Talk to a travel designer`. Buttons carry
    subtle magnetic behavior that responds gently to the pointer.
14. **Footer** — very large, background `#111713`, foreground `#F7F5F0`. Brand wordmark
    `WANDERLY` almost spanning the viewport. Columns — Explore: Destinations, Journeys,
    Journal, Travel Guides. Company: About, Careers, Contact. Social: Instagram, YouTube,
    Pinterest. Bottom row: `(c) 2026 Wanderly`, `Privacy`, `Terms`. Extremely subtle
    separators.

## Animation language

Animation quality is one of the most important parts of this work. Motion should feel
slow, smooth, premium, and purposeful, like Apple product pages. Avoid bouncy animation,
excessive spring, random floating elements, and constant movement.

Default transitions run 0.6-1.2s on `cubic-bezier(0.22, 1, 0.36, 1)`. Use fade,
translateY, scale, clip-path reveals, parallax, mask reveals, and staggered typography.
Avoid excessive rotation.

Build reusable behaviors rather than one-off code:

- a typography reveal supporting line-by-line and word-by-word masked vertical reveal
  (`overflow: hidden`, `translateY(110%)` -> `translateY(0)`);
- an image reveal supporting clip-path reveal, scale reveal, parallax, and hover zoom,
  with lazy loading;
- a magnetic button that shifts 4-8px toward the pointer and returns smoothly, disabled
  on touch devices;
- an optional subtle circular custom cursor, desktop only, that expands over visual links
  with the label `VIEW` and scales slightly over buttons — never distracting, disabled on
  mobile.

Micro-interactions: animated underline on nav links, arrow moving 4px on buttons, slow
image zoom, subtle fades, destination links reacting on the visual, staggered menu
reveal. Everything should feel intentional.

## Responsive behavior

The mobile experience must feel intentionally designed, not a shrunken desktop. Hero
stays `100svh` with a 48-64px headline. Destination layouts become stacked editorial
sections. Horizontal experiences use native swipe. Sticky storytelling becomes image,
text, image, text. Custom cursor, complex parallax, and magnetic effects are disabled on
touch devices. Large whitespace is maintained.

## Accessibility and performance

Support `prefers-reduced-motion`, semantic landmarks, keyboard navigation, visible focus
states, alt text, an accessible mobile menu, and a correct heading hierarchy. Animations
must never prevent access to content. Animate transform and opacity wherever possible and
avoid animating expensive properties. Lazy-load visuals and keep the page GPU-friendly.

## Final direction

Do not produce something that looks AI-generated. Avoid the obvious pattern of hero,
three cards, features, testimonials, CTA, footer. Create an editorial journey where each
section has its own composition and layout rhythm. Use asymmetry and deliberate
whitespace. Let images and typography dominate. Apple's restraint + Airbnb's emotion +
Awwwards' visual storytelling + a luxury travel magazine.

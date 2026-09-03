# Verdicts — real-stack round

Each pair judged twice with the order swapped, by a judge from the other
provider family. The judge saw the complete source of both arms and nothing
about how either was produced. Raw output, unedited.

## Claude pair (subjects) · judged by Codex `gpt-5.6-sol`, high effort

### Order A — Design 1 = skill off, Design 2 = skill on

```
RUB-HIER-001: D1=<n> D2=<n> winner=<1|2|tie> — <one line>
RUB-COHERE-001: D1=<n> D2=<n> winner=<1|2|tie> — <one line>
RUB-MOTION-001: D1=<n> D2=<n> winner=<1|2|tie> — <one line>
RUB-CONTENT-001: D1=<n> D2=<n> winner=<1|2|tie> — <one line>
RUB-SLOP-001: D1=<n> D2=<n> winner=<1|2|tie> — <one line>
OVERALL: winner=<1|2|tie> — <two lines max>
RUB-HIER-001: D1=5 D2=5 winner=tie — Both establish strong editorial scale, asymmetric composition, and deliberate section rhythm before decoration.
RUB-COHERE-001: D1=4 D2=5 winner=2 — D2 centralizes semantic tokens, containers, labels, links, buttons, and motion constants more consistently.
RUB-MOTION-001: D1=4 D2=5 winner=2 — D2 gives effects clearer ownership, capability-gated teardown, native fallbacks, and more complete live reduced-motion handling.
RUB-CONTENT-001: D1=5 D2=4 winner=1 — D1 supplies richer journey details, article summaries, price context, statistical notes, and responsive authored copy.
RUB-SLOP-001: D1=5 D2=5 winner=tie — Both avoid interchangeable card grids and decoration-led hierarchy in favor of distinctive editorial pacing and asymmetry.
OVERALL: winner=2 — D2 is the more coherent and technically disciplined design system.
RUB-HIER-001: D1=5 D2=5 winner=tie — Both establish strong editorial scale, asymmetric composition, and deliberate section rhythm before decoration.
RUB-COHERE-001: D1=4 D2=5 winner=2 — D2 centralizes semantic tokens, containers, labels, links, buttons, and motion constants more consistently.
RUB-MOTION-001: D1=4 D2=5 winner=2 — D2 gives effects clearer ownership, capability-gated teardown, native fallbacks, and more complete live reduced-motion handling.
RUB-CONTENT-001: D1=5 D2=4 winner=1 — D1 supplies richer journey details, article summaries, price context, statistical notes, and responsive authored copy.
RUB-SLOP-001: D1=5 D2=5 winner=tie — Both avoid interchangeable card grids and decoration-led hierarchy in favor of distinctive editorial pacing and asymmetry.
OVERALL: winner=2 — D2 is the more coherent and technically disciplined design system.
```

### Order B — Design 1 = skill on, Design 2 = skill off

```
RUB-HIER-001: D1=<n> D2=<n> winner=<1|2|tie> — <one line>
RUB-COHERE-001: D1=<n> D2=<n> winner=<1|2|tie> — <one line>
RUB-MOTION-001: D1=<n> D2=<n> winner=<1|2|tie> — <one line>
RUB-CONTENT-001: D1=<n> D2=<n> winner=<1|2|tie> — <one line>
RUB-SLOP-001: D1=<n> D2=<n> winner=<1|2|tie> — <one line>
OVERALL: winner=<1|2|tie> — <two lines max>
RUB-HIER-001: D1=5 D2=5 winner=tie — Both establish strong editorial hierarchy through scale, asymmetric composition, whitespace, and intentionally varied section rhythms.
RUB-COHERE-001: D1=5 D2=4 winner=1 — Design 1 more consistently centralizes semantic tokens, motion constants, containers, image behavior, links, labels, and buttons.
RUB-MOTION-001: D1=5 D2=3 winner=1 — Design 1 gives motion clear roles and capability-gated fallbacks; Design 2 retains some motion-dependent layouts and auto-advances testimonials without a persistent pause control.
RUB-CONTENT-001: D1=4 D2=5 winner=2 — Design 2 provides richer operational detail and better narrow-screen handling for authored copy, while both otherwise use credible content.
RUB-SLOP-001: D1=5 D2=5 winner=tie — Both avoid interchangeable card grids and decorative excess through editorial layouts, restrained palettes, hairlines, and photography-led composition.
OVERALL: winner=1 — Design 1 is the more disciplined system, especially in primitive reuse and reduced-motion integrity.
RUB-HIER-001: D1=5 D2=5 winner=tie — Both establish strong editorial hierarchy through scale, asymmetric composition, whitespace, and intentionally varied section rhythms.
RUB-COHERE-001: D1=5 D2=4 winner=1 — Design 1 more consistently centralizes semantic tokens, motion constants, containers, image behavior, links, labels, and buttons.
RUB-MOTION-001: D1=5 D2=3 winner=1 — Design 1 gives motion clear roles and capability-gated fallbacks; Design 2 retains some motion-dependent layouts and auto-advances testimonials without a persistent pause control.
RUB-CONTENT-001: D1=4 D2=5 winner=2 — Design 2 provides richer operational detail and better narrow-screen handling for authored copy, while both otherwise use credible content.
RUB-SLOP-001: D1=5 D2=5 winner=tie — Both avoid interchangeable card grids and decorative excess through editorial layouts, restrained palettes, hairlines, and photography-led composition.
OVERALL: winner=1 — Design 1 is the more disciplined system, especially in primitive reuse and reduced-motion integrity.
```

## Codex pair (subjects) · judged by Claude `claude-opus-5`

### Order A — Design 1 = skill off, Design 2 = skill on

    RUB-HIER-001: D1=4 D2=4 winner=tie — D1 drives hierarchy through a token scale plus hairline dl/stat rows; D2 through offset column spans and varied aspect ratios — both establish weight before ornament, neither leans on decoration.
    RUB-COHERE-001: D1=5 D2=3 winner=1 — D1 has a real token layer and reused primitives (`.section-shell`, `.section-title`, `.eyebrow`, ImageReveal/TextReveal/MagneticButton) applied consistently; D2 scatters one-off `text-[clamp(...)]`, ad-hoc tone maps, an invalid `hover:bg-current/10`, and a bogus `agentRules` next.config key.
    RUB-MOTION-001: D1=5 D2=3 winner=1 — D1 gates every effect on reduced-motion including cursor, autoplay carousel and count-up, and wires Lenis to `ScrollTrigger.update` via the gsap ticker; D2's Lenis loop is unsynced from ScrollTrigger, its cursor ignores reduced-motion, and JourneyStory triggers are gated on width not preference.
    RUB-CONTENT-001: D1=4 D2=4 winner=tie — D2 earns per-image alt text and variable-length avatar stacks/read times; D1 earns a dedicated responsive layer that re-solves every section for mobile, but clips detail copy at `max-height:144px` while D2's `max-w-[14ch]` quote at 7.8rem will run tall on a long testimonial.
    RUB-SLOP-001: D1=4 D2=3 winner=1 — both avoid the card-grid trap, but D2 adds rounded-full pill nav with blur+shadow, uniform rounded buttons and filler microcopy ("Read all stories", "Travel well / Est. 2016"); D1 keeps flat hairlines, mixed radii and copy that carries intent.
    OVERALL: winner=1 — D1 is the more disciplined system: explicit tokens, genuinely owned motion with honest reduced-motion fallbacks, and deliberate mobile re-composition rather than breakpoint prefixes.
    D2 has the livelier destination layout and better alt-text hygiene, but its utility sprawl, unsynced smooth-scroll wiring and pill/blur furniture read closer to default.
     D1 wins on structure, motion correctness and restraint; its weakness is content resilience, where fixed heights and placeholder metadata betray the editorial ambition.
    D2 has better data modelling and alt-text discipline but its scroll stack is mis-wired and its sections converge on one repeated card idea.

### Order B — Design 1 = skill on, Design 2 = skill off

    RUB-HIER-001: D1=4 D2=4 winner=tie — D1 buys hierarchy with asymmetric spans, offsets and varied aspects; D2 buys it with a sticky hero visual indexed by a typographic list, but repeats an identical eyebrow+1fr/2fr heading grid across three sections.
    RUB-COHERE-001: D1=3 D2=4 winner=2 — D2 centralises tokens/hairlines and reuses named primitives; D1 scatters magic values (black/12, /15, /20, /25, /30), an inline colour ternary, an invalid `hover:bg-current/10`, and bypasses its own ImageReveal in four sections.
    RUB-MOTION-001: D1=3 D2=4 winner=2 — D2 wires Lenis into ScrollTrigger.update + gsap.ticker with lagSmoothing(0) and rAF-throttles the cursor; D1 runs Lenis on a private rAF with no ScrollTrigger sync (pin/scrub desync risk) and setStates on every pointermove — both honour reduced-motion genuinely, D2 marginally deeper.
    RUB-CONTENT-001: D1=4 D2=4 winner=tie — D1 models variable avatar counts, per-article read times and real alt text; D2 hardcodes three avatars and "8 min read" for every story and caps detail copy at max-height 144px, but its responsive layer rebuilds every sticky/pinned section for touch down to 420px.
    RUB-SLOP-001: D1=4 D2=3 winner=1 — D1 keeps corners near-square and varies each section's heading treatment; D2 applies one 12px radius to nearly every image, adds an unrequested 6.5s auto-rotating quote carousel, and templates its alt text ("{title} travel landscape").
    OVERALL: winner=2 — D2 edges it on a real token system and correct scroll/motion plumbing, where D1's Lenis integration and utility sprawl are genuinely fragile.
    D1 has the better-composed page; D2 has the better-built one, and the gap is one refactor wide in either direction.

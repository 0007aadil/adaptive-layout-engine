# Adaptive Layout Engine for Multi-Surface Ads

Define an ad once — content, priority, hard constraints per element — and resolve it onto
any surface profile: a portrait phone screen, a landscape one, a wide broadcast lower-third,
a square touch kiosk, or a fifth profile nobody wrote code for.

```
AdSpec + SurfaceProfile → Constraint Resolver → Resolved Layout → Renderer
```

## Setup

```
npm install
```

## Running the demo

```
npm run dev
```

Opens the playground. The **Surfaces** grid resolves the selected ad spec against five
profiles at once: mobile portrait, mobile landscape, broadcast lower-third, a square kiosk,
and a deliberately undersized kiosk that demonstrates degradation. Click any card to inspect
it — the panel on the right shows every element's resolved box, its type size, and what (if
anything) was dropped and why.

The **Live profile** panel is a sixth, editable surface: drag width/height, and toggle tap
target, minimum type size, viewing distance and touch-only independently. It resolves through
the exact same code path as the five fixed profiles — nothing about it is special-cased — so
it doubles as a stand-in for "a new surface profile given live," per the assignment's
interview expectation.

Switch the ad spec itself from the dropdown in the header; there are three, all built from
the same five roles (`primary`, `hero`, `action`, `secondary`, `branding`).

## Tests

```
npm test
```

81 tests. Every sample spec resolved against every surface profile, checked for: staying
inside the surface, no overlapping text/button boxes, font sizes within their declared
bounds, `minTapTarget`/`minTextSize` never violated, the safe area respected, priority order
never inverted (nothing more important gets dropped while something less important
survives), determinism, and `defineAd()`'s runtime validation. Plus a dedicated test
reproducing the assignment's own example: shrinking a kiosk until branding drops while
headline, hero and CTA hold.

```
npm run typecheck
```

Also checks `src/engine/spec.typecheck.ts` — a file that exists purely to prove invalid specs
are compile-time errors (see below).

## Layout algorithm

`solve(spec, surface)` in [`src/engine/solve.ts`](src/engine/solve.ts):

1. **Content box** — the surface's `safeArea` inset, then a small proportional padding.
2. **Template** — `selectTemplate` reads the surface's aspect ratio and pixel count (never
   its id or name) and returns one of five archetypes: `strip`, `split`, `stack`, `column`,
   `overlay`. This is a rule-based cascade, not a per-surface branch — the same aspect ratio
   always gets the same archetype, whether or not the resolver has seen that exact surface
   before.
3. **Placement** — the template carves the content box into regions (e.g. a strip's
   branding/action columns either side of a copy block) and hands each region's elements to
   a shared stack allocator, which splits the region by role weight, fits each element into
   its slice, then redistributes whatever nobody claimed.
4. **Degradation** — if a region can't fit everything (including after a hard constraint like
   `minTapTarget` inflates an element past its slice), the whole region is reported as
   overflowing. The resolver removes the *least important* element still in play — priority 1
   is most important; ties aside, the highest priority number among the overflowing set is
   dropped — and reruns placement with the reduced set. This repeats until everything fits.
5. **Audit** — the resolved layout is checked for edge violations, tap-target/min-text-size
   violations, and box overlaps. These become `warnings`, not thrown errors, so a caller can
   see exactly what's still wrong for a given input.

### How priority/degradation is decided

Each element carries a `priority` (1 = most important). When a region overflows, the
candidate pool for removal is whichever elements actually caused *that* overflow; if the
overflow can't be attributed to a subset, the whole candidate set is eligible. Within that
pool, the element with the *highest* priority number — the least important — is dropped.
Because the whole placement is rerun from scratch after every drop, a surface that starts
too tight for all five elements will shed branding (priority 3) before it ever touches the
CTA or price (priority 2), which in turn are protected ahead of the headline or hero
(priority 1). `src/engine/engine.test.ts` asserts this ordering holds for every sample spec
against every surface, not just the one scenario the assignment describes.

## TypeScript design

- `ElementRole` and `ElementType` are closed literal unions. An element with an unrecognised
  role or type is a **compile-time error** for any normal caller.
  `src/engine/spec.typecheck.ts` proves this with a set of `@ts-expect-error` lines checked
  by `npm run typecheck` — if a change ever makes one of those lines legal, the now-unused
  directive fails the build on its own.
- `AdElement` is a discriminated union on `type`, so narrowing on `element.type === 'image'`
  gives you `src`/`aspect` and rules out `text`/`font` at the type level.
- `defineAd()` is the **runtime** backstop for anything that reaches the resolver without
  going through TypeScript — a duplicate id, a missing priority, an unrecognised role from an
  untyped caller, an image with no positive aspect ratio — and reports every problem it finds
  in one `Error`, not just the first.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full module breakdown and why the resolver is
split into several small files rather than one `resolver.ts`.

## Known limitations

- No animation or transition when switching surfaces.
- The element type set is fixed to `text | image | button`.
- Word-wrapping is greedy and measurement-aware, not a full paragraph-breaking algorithm.
- The five region templates cover the aspect-ratio and pixel-count ranges the sample and
  live-profile surfaces exercise well; an extreme, unusual aspect ratio could still land on a
  template that isn't the best possible arrangement for it.
- `minTapTarget` is enforced on each button's own box; it doesn't separately enforce spacing
  between two adjacent tap targets.

## Time spent

_To be filled in before submission — this needs your own honest estimate, not a generated
one._

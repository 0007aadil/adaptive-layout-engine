# Architecture

## Resolution flow

```
AdSpec + SurfaceProfile → Constraint Resolver → Resolved Layout → Renderer
   (src/spec.ts)         (src/resolver.ts)      (LayoutResult)   (src/render-dom.ts)
```

`solve(spec, surface)` in [`src/engine/solve.ts`](src/engine/solve.ts) is the resolver's entry
point:

1. **Content box.** The surface's `safeArea` is inset, then a small padding scaled to the
   surface's shorter side is inset again.
2. **Template.** `selectTemplate(surface)` reads only `width`, `height` and the aspect ratio
   they imply — never an id, a name, or a `switch` over known surfaces — and returns one of
   five archetypes: `strip` (very wide, e.g. a broadcast lower-third), `split` (landscape),
   `stack` (near-square, e.g. a kiosk), `column` (tall and small, e.g. a phone), `overlay`
   (tall and large, full-bleed art with copy over a scrim).
3. **Placement.** The template carves the content box into regions (a strip's brand/action
   columns, a split's art/copy halves) and hands each region's elements to a shared stack
   allocator.
4. **Degradation.** If any region overflows, the resolver removes the least important element
   still in play — priority 1 is most important; the highest priority *number* among whatever
   actually overflowed is dropped — and reruns placement from scratch with the reduced set.
   This repeats until everything fits or only the most important elements remain.
5. **Audit.** The resolved layout is checked for surface-edge violations, tap-target and
   min-text-size violations, and overlaps between text/button boxes. Violations become
   `warnings` on the result rather than being thrown — a reviewer can see exactly what, if
   anything, is still wrong with a given spec/surface pair.

## Why a new surface needs no resolver changes

Every decision in `selectTemplate` and `solve` reads a numeric or boolean field off
`SurfaceProfile` — `width`, `height`, `safeArea`, `minTapTarget`, `minTextSize`,
`viewingDistance`, `touchOnly` — and nothing ever branches on `surface.id` or `surface.name`.
A profile the resolver has never seen resolves through the same code path as the five in
`src/data/surfaces.ts`. The "Live profile" panel in the demo exists specifically to exercise
this: it lets you define an arbitrary width, height, tap target, minimum type size, viewing
distance and touch flag at runtime and watch it resolve immediately.

The same is true in the other direction: a new renderer (e.g. a Canvas backend) would consume
`LayoutResult` — a plain object of resolved rects, text runs and image crops — without
touching `src/engine/` at all. `src/render-dom.ts` is the only place that knows a DOM exists.

## Why the engine is split into small modules

The assignment's suggested tree names one file per stage (`spec.ts`, `surfaces.ts`,
`resolver.ts`, `render-dom.ts`). Those four files exist at the repo root and are the intended
import surface — but the resolver itself is further split under `src/engine/` because a
single-file constraint solver stops being readable well before it stops being correct:

| File | Responsibility |
|---|---|
| `types.ts` | The spec, surface and layout-output shapes. No logic. |
| `spec.ts` | `defineAd()` — runtime validation with reported errors. |
| `geometry.ts` | Rect math: inset, split, contain, intersect. No ad-domain knowledge. |
| `text.ts` | Binary-search font fitting and word wrapping, against an injected measurer. |
| `measure.ts` | The two measurer implementations (canvas-backed, and a deterministic metric table for tests). |
| `slots.ts` | Measures one element against a budget: role weights, the tap-target floor, the min-text-size floor. |
| `stack.ts` | Allocates a track's height across a list of elements by weight, then hands back what nobody claimed. |
| `templates.ts` | Carves a content box into regions per archetype and feeds each region to `stack`. |
| `solve.ts` | The degradation loop and the post-layout audit. |

Each module is independently testable and has one job. `src/engine/engine.test.ts` exercises
every sample spec against every surface profile through the public `solve()` function.

## TypeScript design

- `ElementRole` (`'primary' | 'secondary' | 'hero' | 'action' | 'branding'`) and `ElementType`
  (`'text' | 'image' | 'button'`) are closed literal unions. Constructing an element with a
  role or type outside those sets is a **compile-time error** for any normal caller —
  `src/engine/spec.typecheck.ts` exists purely to prove this: each `@ts-expect-error` line is
  itself checked by `tsc --noEmit` (`npm run typecheck`), so if a future change ever makes one
  of those lines legal, the unused-directive error fails the build.
- `AdElement` is a discriminated union on `type`, so `element.type === 'image'` narrows to
  `ImageElement` (with `src`/`aspect`) and rules out `text`/`font` — the compiler, not a
  runtime check, keeps the two apart.
- `defineAd()` is the **runtime** backstop for inputs that bypass the type system entirely —
  untyped JS, a cast, a JSON payload. It rejects duplicate ids, missing/invalid priorities, an
  unrecognised role, and an image with no positive aspect ratio, with a single `Error` listing
  every problem found rather than failing on the first one.
- `LayoutResult` (and `LayoutNode` within it) is the one shape a renderer needs: a resolved
  `Rect` per element, plus a fully-resolved `TextRender` or `ImageRender`. A Canvas renderer
  would read exactly the same fields a DOM renderer does.

## Known limitations

- No animation or transition when switching surfaces.
- The element type set is fixed to `text | image | button`; a new kind (e.g. video) would need
  a new branch in `slots.ts`.
- Text wrapping is measurement-aware (a real canvas context backs it in the browser — see
  `createCanvasMeasurer` in `src/engine/measure.ts`) but line-breaking itself is greedy
  word-wrap, not full Knuth-Plass.
- The region templates (`strip`, `split`, `stack`, `column`, `overlay`) are a fixed set keyed
  off aspect ratio and pixel count. They generalise well within the ranges the five sample
  surfaces and the live-profile panel cover, but an extreme, unusual aspect ratio could still
  land on a template that isn't the best possible arrangement for it.
- `minTapTarget` is enforced on a button's own box (height, and width as a floor); it does not
  additionally enforce spacing *between* two adjacent tap targets.

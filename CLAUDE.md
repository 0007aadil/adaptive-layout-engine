# Adaptive Layout Engine for Multi-Surface Ads

One creative definition, rendered correctly on any ad surface — 300x250 banners through
1080x1920 stories and 1920x1080 CTV frames. The engine picks a template from the frame
shape, fits type to the space it actually has, and drops the least important element when
the message no longer fits.

Submission for the Flam Frontend R&D assignment (option 1 of 5).

## Status

Engine and playground are working. 167 tests green, production build clean.
Not yet done: deploy, GitHub repo, README for reviewers.

## Running it

```
npm install
npm run dev        # playground on :5173
npm test           # engine test suite
npm run typecheck
npm run build
```

## Assumptions

The detailed brief lives on a Notion page that was not accessible, so the scope below was
inferred from the title. Correct any of these and the engine follows:

- "Multi-surface" means IAB display units, social placements, CTV and DOOH — hence the
  surface presets in `src/data/surfaces.ts`.
- A creative is authored once as content plus intent (priority, min/max type sizes, focal
  point), never as pixel positions.
- Degradation is expected behaviour, not failure: a 320x50 banner is supposed to carry less
  than a billboard.
- No backend. Static build, deployable anywhere.

## Architecture

```
src/engine/      framework-agnostic layout core (no React, no DOM)
src/components/  reusable UI primitives
src/features/    the playground that drives the engine
src/data/        surface presets and sample creatives
src/lib/         app-level singletons
```

The engine never imports from anything above it. That is what makes it testable in Node and
what would let it run server-side for ad delivery.

### Pipeline

`solve(creative, surface)` in `src/engine/solve.ts`:

1. **Content box** — surface minus safe area minus padding that scales with the frame.
2. **Template** — chosen from aspect ratio and pixel count (`selectTemplate`):
   `strip` (>3.2), `split` (>1.25), `stack` (>=0.8), `overlay` (tall and large), `column`.
3. **Placement** — the template carves regions and hands each to the stack allocator.
4. **Degradation** — if anything overflows, the lowest-priority droppable element is
   removed and the whole pass runs again. `required: true` elements never drop.
5. **Audit** — bounds, text overlap and crop severity become `warnings` on the result.

### Stack allocator (`src/engine/stack.ts`)

Each role has a weight (`WEIGHT` in `slots.ts`). A track is divided by weight, each element
is fitted into its budget, then the unclaimed space is handed back and everything is
re-fitted once. Budgets are recomputed from what each slot actually took, so they always sum
to the track — that invariant is what keeps content inside the frame.

### Type fitting (`src/engine/text.ts`)

`fitText` binary-searches whole-pixel font sizes for the largest that wraps inside the box
within its line budget. Measurement is injected (`TextMeasurer`), so tests run against a
deterministic metric table and the browser uses a cached canvas context.

CTA padding scales with the type inside it, so the budget is split between text and padding
before the size search runs — otherwise the pill fails to fit at sizes that would be fine.

## Decisions worth remembering

- **Injected measurement.** The alternative — measuring in the DOM — would have made the
  engine untestable and non-deterministic.
- **Weights, not fixed shares.** Fixed shares summed above 1.0 and caused the engine to drop
  a hero image on a 1080x1080 frame with room to spare.
- **Heroes are refused below 110px of frame height.** Cramming a 1.6 aspect image into a
  728x90 leaderboard produced a 13%-of-source crop. Better to drop it and say why.
- **`fill` excludes bleed art** so the number reads as copy density rather than always 100%.
- **No external fonts.** The measurer and the renderer must agree on metrics; a webfont that
  loads late makes them disagree.

## Conventions

- Comments explain why, not what. No AI attribution anywhere, including commits.
- Check `src/components/` for an existing component before writing a new one.
- Small single-purpose files. Reuse over volume.
- Every engine change needs a test; the suite covers all creatives x all surfaces.

## Next

- README aimed at a reviewer
- Deploy and wire the link into the README
- Push to github.com/0007aadil and open the PR

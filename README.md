# Adaptive Layout Engine for Multi-Surface Ads

Author an ad once; render it correctly on every surface it has to run on — from a 320x50
mobile banner to a 1920x1080 CTV frame.

The engine takes a creative described as *content and intent* (text, art, priority, type
bounds, focal point) and a surface description (size, channel, safe area). It returns a
resolved layout: where every element sits, at what type size, what got dropped and why.

## Try it

```
npm install
npm run dev
```

Pick a creative, drag the free-surface sliders, and watch the layout re-solve. "Show boxes"
draws the content box, the safe area and every element rect.

## How it works

```
solve(creative, surface) ->
  content box  ->  template  ->  region placement  ->  degradation  ->  audit
```

- **Template** comes from the frame's aspect ratio and size: `strip`, `split`, `stack`,
  `column` or full-bleed `overlay`.
- **Placement** divides each track by role weight, fits every element into its budget, then
  redistributes what nobody claimed and re-fits once.
- **Type** is fitted by binary search over whole-pixel sizes — the largest that wraps inside
  the box within its line budget. Text measurement is injected, so the same layout comes out
  in Node and in the browser.
- **Degradation** removes the lowest-priority element and re-solves whenever the message
  cannot fit. Elements marked `required` are never removed.
- **Audit** reports bounds violations, text collisions and severe image crops as warnings
  rather than silently shipping them.

## Tests

```
npm test
```

Every creative is solved against every surface and checked for: staying inside the frame,
no overlapping copy, required elements surviving, type within its declared bounds, safe
areas respected, and determinism.

## Layout

```
src/engine/      layout core — no React, no DOM, no imports from the app
src/components/  reusable UI primitives
src/features/    the playground
src/data/        surface presets and sample creatives
```

/**
 * Public entry point for defining an ad spec, matching the structure the
 * assignment names (`src/spec.ts`). The implementation lives in
 * `src/engine/spec.ts` alongside the types it validates against — see
 * ARCHITECTURE.md for why the engine is split into small modules instead of
 * one large file per pipeline stage.
 */
export { defineAd, type AdSpecInput } from './engine/spec'
export type { AdElement, AdSpec, ButtonElement, ElementRole, ElementType, FontSpec, ImageElement, Palette, TextElement } from './engine/types'

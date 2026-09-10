/**
 * Public entry point for surface profiles. `SurfaceProfile` and the resolver
 * that consumes it live in `src/engine/`; this file re-exports the type plus
 * the sample profiles used by the demo, matching the assignment's named
 * structure (`src/surfaces.ts`).
 */
export type { SurfaceProfile, ViewingDistance, Insets } from './engine/types'
export { SURFACES } from './data/surfaces'

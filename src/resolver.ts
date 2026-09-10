/**
 * Public entry point for the constraint resolver. The algorithm itself is
 * split across `src/engine/solve.ts` (the degradation loop and audit),
 * `src/engine/templates.ts` (region carving per aspect ratio) and
 * `src/engine/stack.ts` / `slots.ts` (per-track allocation and measurement) —
 * see ARCHITECTURE.md for why. This file is the single import a caller
 * actually needs, matching the assignment's named structure (`src/resolver.ts`).
 */
export { solve, type SolveOptions } from './engine/solve'
export { selectTemplate } from './engine/templates'
export type { DroppedElement, LayoutNode, LayoutResult, Rect, TemplateId, TextRender, ImageRender } from './engine/types'

import { measureSlot, weightOf, type Measured, type SlotContext } from './slots'
import type { AdElement, LayoutNode, Rect } from './types'

export interface StackOptions extends SlotContext {
  gap: number
  /** Where the block sits when it is shorter than the track. */
  justify?: 'center' | 'start' | 'space-between'
}

export interface Overflow {
  elementId: string
  reason: string
}

export interface StackResult {
  nodes: LayoutNode[]
  overflow: Overflow[]
  /** Vertical space the block consumed. */
  used: number
}

export const EMPTY_STACK: StackResult = { nodes: [], overflow: [], used: 0 }

/**
 * Splits a track by role weight, fits each element into its budget, then hands
 * the unclaimed space back for a second pass so type and imagery grow into it.
 */
export function stack(elements: AdElement[], box: Rect, options: StackOptions): StackResult {
  if (!elements.length) return EMPTY_STACK

  const gaps = options.gap * (elements.length - 1)
  const track = box.height - gaps
  if (track <= 0 || box.width <= 0) {
    return {
      ...EMPTY_STACK,
      overflow: elements.map((el) => ({ elementId: el.id, reason: 'Track has no room left' })),
    }
  }

  const weights = elements.map((el) => weightOf(el.role))
  const totalWeight = sum(weights)
  const measure = (budgets: number[]) =>
    elements.map((el, i) => measureSlot(el, { ...box, height: budgets[i] }, options))

  const budgets = weights.map((weight) => (track * weight) / totalWeight)
  let measured = measure(budgets)

  const overflow = elements.flatMap((el, i) =>
    measured[i] ? [] : [{ elementId: el.id, reason: 'Does not fit at its minimum size' }],
  )
  if (overflow.length) return { ...EMPTY_STACK, overflow }

  let slots = measured as Measured[]
  let used = sum(slots.map((slot) => slot.height))

  // A hard floor (minTapTarget, minTextSize) can inflate a slot past its own
  // weighted budget even though it measured successfully in isolation. Report
  // the whole block as overflowing rather than silently spilling past the
  // track — the caller degrades by priority across all of it, not just
  // whichever slot happened to be the one that grew.
  if (used - track > 0.5) {
    return {
      ...EMPTY_STACK,
      overflow: elements.map((el) => ({
        elementId: el.id,
        reason: 'Block exceeds its track once minimum sizes are applied',
      })),
    }
  }

  // Hand the unclaimed space back from what each slot actually took, so the
  // grown budgets still add up to the track.
  const slack = track - used
  if (slack > 1) {
    const grown = measure(slots.map((slot, i) => slot.height + (slack * weights[i]) / totalWeight))
    if (grown.every(Boolean)) {
      slots = grown as Measured[]
      used = sum(slots.map((slot) => slot.height))
    }
  }

  return { nodes: position(slots, box, used + gaps, options), overflow: [], used: used + gaps }
}

function position(slots: Measured[], box: Rect, used: number, options: StackOptions): LayoutNode[] {
  const justify = options.justify ?? 'center'
  const spare = Math.max(0, box.height - used)
  const spread = justify === 'space-between' && slots.length > 1 ? spare / (slots.length - 1) : 0
  let y = box.y + (justify === 'center' ? spare / 2 : 0)

  return slots.map((slot) => {
    const width = Math.min(slot.width, box.width)
    const x = options.align === 'center' ? box.x + (box.width - width) / 2 : box.x
    const node = slot.build({ x, y, width, height: slot.height })
    y += slot.height + options.gap + spread
    return node
  })
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}

import type { Insets, Rect } from './types'

export const EMPTY_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 }

export function insets(partial?: Partial<Insets>): Insets {
  return { ...EMPTY_INSETS, ...partial }
}

export function inset(rect: Rect, by: Insets | number): Rect {
  const i = typeof by === 'number' ? { top: by, right: by, bottom: by, left: by } : by
  return {
    x: rect.x + i.left,
    y: rect.y + i.top,
    width: Math.max(0, rect.width - i.left - i.right),
    height: Math.max(0, rect.height - i.top - i.bottom),
  }
}

export function splitH(rect: Rect, leftWidth: number, gap = 0): [Rect, Rect] {
  const w = clamp(leftWidth, 0, rect.width)
  return [
    { ...rect, width: w },
    { x: rect.x + w + gap, y: rect.y, width: Math.max(0, rect.width - w - gap), height: rect.height },
  ]
}

export function splitV(rect: Rect, topHeight: number, gap = 0): [Rect, Rect] {
  const h = clamp(topHeight, 0, rect.height)
  return [
    { ...rect, height: h },
    { x: rect.x, y: rect.y + h + gap, width: rect.width, height: Math.max(0, rect.height - h - gap) },
  ]
}

export function area(rect: Rect): number {
  return Math.max(0, rect.width) * Math.max(0, rect.height)
}

export function intersects(a: Rect, b: Rect, tolerance = 0.5): boolean {
  return (
    a.x + a.width - tolerance > b.x &&
    b.x + b.width - tolerance > a.x &&
    a.y + a.height - tolerance > b.y &&
    b.y + b.height - tolerance > a.y
  )
}

export function contains(outer: Rect, inner: Rect, tolerance = 0.5): boolean {
  return (
    inner.x >= outer.x - tolerance &&
    inner.y >= outer.y - tolerance &&
    inner.x + inner.width <= outer.x + outer.width + tolerance &&
    inner.y + inner.height <= outer.y + outer.height + tolerance
  )
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Largest rect of the given aspect that fits inside the bounds, aligned per anchor. */
export function fitAspect(bounds: Rect, aspect: number, anchor: 'start' | 'center' = 'center'): Rect {
  const boundsAspect = bounds.width / bounds.height
  const width = boundsAspect > aspect ? bounds.height * aspect : bounds.width
  const height = boundsAspect > aspect ? bounds.height : bounds.width / aspect
  if (anchor === 'start') {
    return { x: bounds.x, y: bounds.y, width, height }
  }
  return {
    x: bounds.x + (bounds.width - width) / 2,
    y: bounds.y + (bounds.height - height) / 2,
    width,
    height,
  }
}

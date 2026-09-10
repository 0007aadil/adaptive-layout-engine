import type { SurfaceProfile } from '../engine'

/** Short labels for the hard constraints a surface actually carries. */
export function describeConstraints(surface: SurfaceProfile): string[] {
  const badges: string[] = []
  if (surface.minTapTarget) badges.push(`${surface.minTapTarget}px tap`)
  if (surface.minTextSize) badges.push(`${surface.minTextSize}px min type`)
  if (surface.viewingDistance === 'far') badges.push('far viewing')
  if (surface.touchOnly) badges.push('touch only')
  return badges
}

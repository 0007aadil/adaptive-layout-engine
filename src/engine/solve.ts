import { area, clamp, contains, inset, insets, intersects } from './geometry'
import { createMetricMeasurer } from './measure'
import type { Overflow } from './stack'
import { place, selectTemplate, type PlaceContext } from './templates'
import type {
  AdElement,
  AdSpec,
  DroppedElement,
  LayoutNode,
  LayoutResult,
  Rect,
  SurfaceProfile,
  TemplateId,
  TextMeasurer,
} from './types'

export interface SolveOptions {
  measurer?: TextMeasurer
  /** Overrides the template the surface would normally get. */
  template?: TemplateId
}

/**
 * Places an ad spec onto a surface profile, shedding the least important
 * elements until what remains fits and every hard constraint is met. Pure:
 * the same spec, surface and measurer always produce the same layout.
 */
export function solve(spec: AdSpec, surface: SurfaceProfile, options: SolveOptions = {}): LayoutResult {
  const measurer = options.measurer ?? createMetricMeasurer()
  const template = options.template ?? selectTemplate(surface)
  const bleed: Rect = { x: 0, y: 0, width: surface.width, height: surface.height }
  const minSide = Math.min(surface.width, surface.height)

  const content = inset(inset(bleed, insets(surface.safeArea)), clamp(minSide * 0.055, 8, 64))
  const ctx: PlaceContext = {
    measurer,
    scale: clamp(minSide / 300, 0.7, 4),
    gap: clamp(minSide * 0.035, 6, 40),
    minTextSize: surface.minTextSize,
    minTapTarget: surface.minTapTarget,
    bleed,
  }

  let candidates = byPriority(spec.elements)
  const dropped: DroppedElement[] = []
  const warnings: string[] = []
  let nodes: LayoutNode[] = []

  for (let pass = 0; pass <= spec.elements.length; pass += 1) {
    const attempt = place(template, candidates, content, ctx)
    if (!attempt.overflow.length) {
      nodes = attempt.nodes
      break
    }

    const victim = pickVictim(candidates, attempt.overflow)
    if (!victim) {
      nodes = attempt.nodes
      warnings.push('The most important elements alone exceed this surface; content is clipped.')
      break
    }

    candidates = candidates.filter((el) => el.id !== victim.id)
    dropped.push({
      elementId: victim.id,
      role: victim.role,
      reason:
        attempt.overflow.find((item) => item.elementId === victim.id)?.reason ??
        'Dropped to make room for higher-priority content',
    })
  }

  warnings.push(...audit(nodes, bleed, surface))

  return {
    surface,
    template,
    content,
    nodes,
    dropped,
    fill: fillRatio(nodes, content),
    warnings,
  }
}

/** Most important (lowest priority number) first. */
function byPriority(elements: AdElement[]): AdElement[] {
  return [...elements].sort((a, b) => a.priority - b.priority)
}

/** Least important (highest priority number) among what actually overflowed. */
function pickVictim(candidates: AdElement[], overflow: Overflow[]): AdElement | undefined {
  const blocked = new Set(overflow.map((item) => item.elementId))
  const inOverflow = candidates.filter((el) => blocked.has(el.id))
  const pool = inOverflow.length ? inOverflow : candidates
  return pool.reduce<AdElement | undefined>(
    (worst, el) => (!worst || el.priority > worst.priority ? el : worst),
    undefined,
  )
}

/** Invariants the renderer relies on. Surfaced in the UI rather than thrown. */
function audit(nodes: LayoutNode[], bleed: Rect, surface: SurfaceProfile): string[] {
  const warnings: string[] = []

  for (const node of nodes) {
    if (!contains(bleed, node.rect)) {
      warnings.push(`${node.role} extends past the surface edge`)
    }
    if (node.image && node.image.coverage < 0.5) {
      warnings.push(`${node.role} is cropped to ${Math.round(node.image.coverage * 100)}% of the source`)
    }
    if (node.type === 'button' && surface.minTapTarget) {
      const short = node.rect.height < surface.minTapTarget - 0.5
      if (short) warnings.push(`${node.role} tap target is below the ${surface.minTapTarget}px minimum`)
    }
    if (node.text && surface.minTextSize && node.text.fontSize < surface.minTextSize - 0.5) {
      warnings.push(`${node.role} text is below the ${surface.minTextSize}px minimum for this viewing distance`)
    }
  }

  const boxed = nodes.filter((node) => node.text || node.type === 'button')
  for (let i = 0; i < boxed.length; i += 1) {
    for (let j = i + 1; j < boxed.length; j += 1) {
      if (intersects(boxed[i].rect, boxed[j].rect)) {
        warnings.push(`${boxed[i].role} and ${boxed[j].role} overlap`)
      }
    }
  }

  return warnings
}

function fillRatio(nodes: LayoutNode[], content: Rect): number {
  const covered = nodes
    .filter((node) => !node.image?.bleed)
    .reduce((total, node) => total + area(clip(node.rect, content)), 0)
  const box = area(content)
  return box ? clamp(covered / box, 0, 1) : 0
}

function clip(rect: Rect, bounds: Rect): Rect {
  const x = Math.max(rect.x, bounds.x)
  const y = Math.max(rect.y, bounds.y)
  return {
    x,
    y,
    width: Math.max(0, Math.min(rect.x + rect.width, bounds.x + bounds.width) - x),
    height: Math.max(0, Math.min(rect.y + rect.height, bounds.y + bounds.height) - y),
  }
}

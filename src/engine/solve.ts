import { area, clamp, contains, inset, insets, intersects } from './geometry'
import { createMetricMeasurer } from './measure'
import type { Overflow } from './stack'
import { place, selectTemplate, type PlaceContext } from './templates'
import type {
  AdElement,
  Creative,
  DroppedElement,
  LayoutNode,
  LayoutResult,
  Rect,
  Surface,
  TemplateId,
  TextMeasurer,
} from './types'

export interface SolveOptions {
  measurer?: TextMeasurer
  /** Overrides the template the surface would normally get. */
  template?: TemplateId
}

/**
 * Places a creative onto a surface, shedding the least important elements until
 * what remains fits. Pure: same inputs and measurer give the same layout.
 */
export function solve(creative: Creative, surface: Surface, options: SolveOptions = {}): LayoutResult {
  const measurer = options.measurer ?? createMetricMeasurer()
  const template = options.template ?? selectTemplate(surface)
  const bleed: Rect = { x: 0, y: 0, width: surface.width, height: surface.height }
  const minSide = Math.min(surface.width, surface.height)

  const content = inset(inset(bleed, insets(surface.safeArea)), clamp(minSide * 0.055, 8, 64))
  const ctx: PlaceContext = {
    measurer,
    scale: clamp(minSide / 300, 0.7, 4),
    gap: clamp(minSide * 0.035, 6, 40),
    bleed,
  }

  let candidates = byPriority(creative.elements)
  const dropped: DroppedElement[] = []
  const warnings: string[] = []
  let nodes: LayoutNode[] = []

  for (let pass = 0; pass <= creative.elements.length; pass += 1) {
    const attempt = place(template, candidates, content, ctx)
    if (!attempt.overflow.length) {
      nodes = attempt.nodes
      break
    }

    const victim = pickVictim(candidates, attempt.overflow)
    if (!victim) {
      nodes = attempt.nodes
      warnings.push('Required elements alone exceed this surface; content is clipped.')
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

  warnings.push(...audit(nodes, bleed, content))

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

function byPriority(elements: AdElement[]): AdElement[] {
  return [...elements].sort((a, b) => b.priority - a.priority)
}

function pickVictim(candidates: AdElement[], overflow: Overflow[]): AdElement | undefined {
  const droppable = candidates.filter((el) => !el.required)
  const blocked = new Set(overflow.map((item) => item.elementId))
  const inOverflow = droppable.filter((el) => blocked.has(el.id))
  const pool = inOverflow.length ? inOverflow : droppable
  return pool.reduce<AdElement | undefined>(
    (lowest, el) => (!lowest || el.priority < lowest.priority ? el : lowest),
    undefined,
  )
}

/** Invariants the renderer relies on. Surfaced in the UI rather than thrown. */
function audit(nodes: LayoutNode[], bleed: Rect, content: Rect): string[] {
  const warnings: string[] = []

  for (const node of nodes) {
    if (!contains(bleed, node.rect)) {
      warnings.push(`${node.role} extends past the surface edge`)
    }
    if (node.image && node.image.coverage < 0.5) {
      warnings.push(`${node.role} is cropped to ${Math.round(node.image.coverage * 100)}% of the source`)
    }
  }

  const text = nodes.filter((node) => node.text)
  for (let i = 0; i < text.length; i += 1) {
    for (let j = i + 1; j < text.length; j += 1) {
      if (intersects(text[i].rect, text[j].rect)) {
        warnings.push(`${text[i].role} and ${text[j].role} overlap`)
      }
    }
  }

  if (area(content) === 0) warnings.push('Safe area leaves no usable content box')
  return warnings
}

/** Bleed art is excluded so the number reads as copy density, not coverage. */
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

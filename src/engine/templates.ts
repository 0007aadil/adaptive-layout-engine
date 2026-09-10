import { clamp, inset, splitH } from './geometry'
import { cover } from './slots'
import { EMPTY_STACK, stack, type StackResult } from './stack'
import type {
  AdElement,
  ElementRole,
  ImageElement,
  Rect,
  Surface,
  TemplateId,
  TextMeasurer,
} from './types'

export interface PlaceContext {
  measurer: TextMeasurer
  scale: number
  gap: number
  /** Whole surface, so bleed templates can escape the content box. */
  bleed: Rect
}

const ORDER: ElementRole[] = ['logo', 'image', 'headline', 'subhead', 'cta', 'legal']

/** Below this, a hero image is noise rather than art direction. */
const MIN_HERO_HEIGHT = 110

export function selectTemplate(surface: Surface): TemplateId {
  const aspect = surface.width / surface.height
  const pixels = surface.width * surface.height

  if (aspect > 3.2) return 'strip'
  if (aspect > 1.25) return 'split'
  if (aspect >= 0.8) return 'stack'
  if (pixels >= 1_000_000) return 'overlay'
  return 'column'
}

export function place(
  template: TemplateId,
  elements: AdElement[],
  content: Rect,
  ctx: PlaceContext,
): StackResult {
  const ordered = [...elements].sort((a, b) => ORDER.indexOf(a.role) - ORDER.indexOf(b.role))
  switch (template) {
    case 'strip':
      return placeStrip(ordered, content, ctx)
    case 'split':
      return placeSplit(ordered, content, ctx)
    case 'overlay':
      return placeOverlay(ordered, content, ctx)
    default:
      return stack(ordered, content, track(ctx, 'center'))
  }
}

/** Leaderboards and long DOOH runs: one row, brand left, action right. */
function placeStrip(elements: AdElement[], content: Rect, ctx: PlaceContext): StackResult {
  const hero = elements.find((el) => el.role === 'image') as ImageElement | undefined
  const rest = elements.filter((el) => el !== hero)

  if (hero && content.height < MIN_HERO_HEIGHT) {
    return {
      ...EMPTY_STACK,
      overflow: [{ elementId: hero.id, reason: 'Banner is too short to carry a hero image' }],
    }
  }

  const logo = rest.filter((el) => el.role === 'logo')
  const cta = rest.filter((el) => el.role === 'cta')
  const copy = rest.filter((el) => el.role !== 'logo' && el.role !== 'cta')

  let remaining = content
  const parts: StackResult[] = []

  if (hero) parts.push({ ...EMPTY_STACK, nodes: [cover(hero, ctx.bleed, true)] })

  if (logo.length) {
    const [left, tail] = splitH(remaining, clamp(content.width * 0.16, 48, 320), ctx.gap)
    remaining = tail
    parts.push(stack(logo, left, track(ctx, 'center')))
  }
  if (cta.length) {
    const width = clamp(content.width * 0.2, 72, 420)
    const [head, right] = splitH(remaining, remaining.width - width - ctx.gap, ctx.gap)
    remaining = head
    parts.push(stack(cta, right, track(ctx, 'center')))
  }
  parts.push(stack(copy, remaining, track(ctx, 'left')))

  return merge(parts)
}

/** Landscape frames: art on one side, the whole message on the other. */
function placeSplit(elements: AdElement[], content: Rect, ctx: PlaceContext): StackResult {
  const hero = elements.find((el) => el.role === 'image') as ImageElement | undefined
  if (!hero) return stack(elements, content, track(ctx, 'center'))

  const [left, right] = splitH(content, content.width * 0.46, ctx.gap)
  return merge([
    { ...EMPTY_STACK, nodes: [cover(hero, left, false)] },
    stack(
      elements.filter((el) => el !== hero),
      right,
      track(ctx, 'left'),
    ),
  ])
}

/** Full-bleed art with the copy sitting over a scrim in the lower half. */
function placeOverlay(elements: AdElement[], content: Rect, ctx: PlaceContext): StackResult {
  const hero = elements.find((el) => el.role === 'image') as ImageElement | undefined
  if (!hero) return stack(elements, content, track(ctx, 'center'))

  const copyBox = inset(content, { top: content.height * 0.4, right: 0, bottom: 0, left: 0 })
  return merge([
    { ...EMPTY_STACK, nodes: [cover(hero, ctx.bleed, true)] },
    stack(
      elements.filter((el) => el !== hero),
      copyBox,
      track(ctx, 'center'),
    ),
  ])
}

function track(ctx: PlaceContext, align: 'left' | 'center') {
  return { measurer: ctx.measurer, scale: ctx.scale, align, gap: ctx.gap }
}

function merge(results: StackResult[]): StackResult {
  const overflow = results.flatMap((r) => r.overflow)
  if (overflow.length) return { ...EMPTY_STACK, overflow }
  return {
    nodes: results.flatMap((r) => r.nodes),
    overflow: [],
    used: Math.max(...results.map((r) => r.used), 0),
  }
}

import { clamp, fitAspect } from './geometry'
import { fitText, scaleFont } from './text'
import type { AdElement, ElementRole, ImageElement, LayoutNode, Rect, TextElement, TextMeasurer } from './types'

export interface SlotContext {
  measurer: TextMeasurer
  /** Type scale for this surface, so a CTV frame is not typeset like a 300x250. */
  scale: number
  align: 'left' | 'center'
}

/** A slot that has been measured against a budget but not yet positioned. */
export interface Measured {
  element: AdElement
  height: number
  /** Intrinsic width, used to align inside a wider track. */
  width: number
  build: (rect: Rect) => LayoutNode
}

/** Relative claim on a track's height. Normalised over whichever slots are present. */
const WEIGHT: Record<ElementRole, number> = {
  logo: 0.7,
  image: 2.8,
  headline: 2.2,
  subhead: 1.3,
  cta: 0.9,
  legal: 0.5,
}

export function weightOf(role: ElementRole): number {
  return WEIGHT[role]
}

export function measureSlot(element: AdElement, budget: Rect, ctx: SlotContext): Measured | null {
  if (budget.width <= 0 || budget.height <= 0) return null
  return element.role === 'image' || element.role === 'logo'
    ? measureImage(element as ImageElement, budget, ctx)
    : measureText(element as TextElement, budget, ctx)
}

/** A hero that covers a region outright, used by the bleed and split templates. */
export function cover(element: ImageElement, rect: Rect, bleed: boolean): LayoutNode {
  return {
    elementId: element.id,
    role: element.role,
    rect,
    image: {
      src: element.src,
      position: element.focal ?? { x: 0.5, y: 0.5 },
      coverage: coverageOf(rect, element.aspect),
      bleed,
    },
  }
}

function measureImage(element: ImageElement, budget: Rect, ctx: SlotContext): Measured | null {
  if (element.role === 'logo') {
    const height = clamp(
      Math.min(budget.height, (budget.width * 0.32) / element.aspect),
      10,
      64 * ctx.scale,
    )
    const width = Math.min(height * element.aspect, budget.width)
    return {
      element,
      height: width / element.aspect,
      width,
      build: (rect) => ({
        elementId: element.id,
        role: element.role,
        rect: fitAspect(rect, element.aspect),
        image: { src: element.src, position: { x: 0.5, y: 0.5 }, coverage: 1, bleed: false },
      }),
    }
  }

  return {
    element,
    height: budget.height,
    width: budget.width,
    build: (rect) => ({
      elementId: element.id,
      role: element.role,
      rect,
      image: {
        src: element.src,
        position: element.focal ?? { x: 0.5, y: 0.5 },
        coverage: coverageOf(rect, element.aspect),
        bleed: false,
      },
    }),
  }
}

/** Share of the source image still visible after an object-fit: cover crop. */
function coverageOf(rect: Rect, aspect: number): number {
  if (rect.height <= 0) return 0
  const target = rect.width / rect.height
  return target > aspect ? aspect / target : target / aspect
}

function measureText(element: TextElement, budget: Rect, ctx: SlotContext): Measured | null {
  const font = scaleFont(element.font, ctx.scale)
  const isCta = element.role === 'cta'

  // A pill's padding scales with the type inside it, so the budget has to be
  // split between text and padding before the size search runs.
  const inner = isCta ? font.lineHeight / (font.lineHeight + PAD_Y * 2) : 1
  const guess = Math.min(budget.height * inner / font.lineHeight, font.maxSize)
  const px = isCta ? padX(guess) : 0

  const fit = fitText(
    element.text,
    font,
    { ...budget, width: budget.width - px * 2, height: budget.height * inner },
    ctx.measurer,
    { align: ctx.align },
  )
  if (!fit) return null

  const width = lineWidth(fit.render, ctx.measurer)
  if (!isCta) {
    return {
      element,
      height: fit.height,
      width,
      build: (rect) => ({ elementId: element.id, role: element.role, rect, text: fit.render }),
    }
  }

  const padding = { x: padX(fit.render.fontSize), y: fit.render.fontSize * PAD_Y }
  return {
    element,
    height: fit.height + padding.y * 2,
    width: Math.min(width + padding.x * 2, budget.width),
    build: (rect) => ({ elementId: element.id, role: element.role, rect, text: fit.render }),
  }
}

const PAD_Y = 0.62
const padX = (size: number) => size * 1.15

function lineWidth(
  render: { family: string; weight: number; fontSize: number; tracking: number; lines: string[] },
  measurer: TextMeasurer,
): number {
  const metrics = {
    family: render.family,
    weight: render.weight,
    size: render.fontSize,
    tracking: render.tracking,
  }
  return render.lines.reduce((max, line) => Math.max(max, measurer.width(line, metrics)), 0)
}

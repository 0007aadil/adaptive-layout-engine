import { clamp, fitAspect } from './geometry'
import { fitText, scaleFont } from './text'
import type {
  AdElement,
  ButtonElement,
  ElementRole,
  FontSpec,
  ImageElement,
  LayoutNode,
  Rect,
  TextElement,
  TextMeasurer,
} from './types'

export interface SlotContext {
  measurer: TextMeasurer
  /** Type scale for this surface, so a CTV frame is not typeset like a mobile screen. */
  scale: number
  align: 'left' | 'center'
  /** Surface floor from `minTextSize`. Wins over an element's own minimum. */
  minTextSize?: number
  /** Surface floor from `minTapTarget`, enforced on `button` elements. */
  minTapTarget?: number
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
  branding: 0.7,
  hero: 2.8,
  primary: 2.2,
  secondary: 1.3,
  action: 0.9,
}

export function weightOf(role: ElementRole): number {
  return WEIGHT[role]
}

export function measureSlot(element: AdElement, budget: Rect, ctx: SlotContext): Measured | null {
  if (budget.width <= 0 || budget.height <= 0) return null
  return element.type === 'image'
    ? measureImage(element, budget, ctx)
    : measureText(element, budget, ctx)
}

/** A hero that covers a region outright, used by the bleed and split templates. */
export function cover(element: ImageElement, rect: Rect, bleed: boolean): LayoutNode {
  return {
    elementId: element.id,
    type: 'image',
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
  if (element.role === 'branding') {
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
        type: 'image',
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
    build: (rect) => cover(element, rect, false),
  }
}

/** Share of the source image still visible after an object-fit: cover crop. */
function coverageOf(rect: Rect, aspect: number): number {
  if (rect.height <= 0) return 0
  const target = rect.width / rect.height
  return target > aspect ? aspect / target : target / aspect
}

function measureText(element: TextElement | ButtonElement, budget: Rect, ctx: SlotContext): Measured | null {
  // minTextSize is an absolute pixel floor from the surface (e.g. broadcast at
  // viewing distance), so it applies to the final resolved size — applying it
  // before the aesthetic `scale` would let scale silently shrink it back down.
  const scaled = scaleFont(element.font, ctx.scale)
  const font = ctx.minTextSize
    ? { ...scaled, minSize: Math.max(scaled.minSize, ctx.minTextSize), maxSize: Math.max(scaled.maxSize, ctx.minTextSize) }
    : scaled
  const isButton = element.type === 'button'

  const fit = fitText(
    element.text,
    font,
    isButton ? shrinkForPadding(budget, font) : budget,
    ctx.measurer,
    { align: ctx.align },
  )
  if (!fit) return null

  const width = lineWidth(fit.render, ctx.measurer)
  if (!isButton) {
    return {
      element,
      height: fit.height,
      width,
      build: (rect) => ({ elementId: element.id, type: 'text', role: element.role, rect, text: fit.render }),
    }
  }

  const padding = { x: padX(fit.render.fontSize), y: fit.render.fontSize * PAD_Y }
  const minTap = ctx.minTapTarget ?? 0
  const height = Math.max(fit.height + padding.y * 2, minTap)
  const buttonWidth = Math.max(Math.min(width + padding.x * 2, budget.width), Math.min(minTap, budget.width))

  return {
    element,
    height,
    width: buttonWidth,
    build: (rect) => ({
      elementId: element.id,
      type: 'button',
      role: element.role,
      rect: { ...rect, height: Math.max(rect.height, minTap) },
      text: fit.render,
    }),
  }
}

const PAD_Y = 0.62
const padX = (size: number) => size * 1.15

/**
 * A pill's padding scales with the whatever size the search lands on, so the
 * budget has to be split between text and padding before that size is known.
 * Height splits exactly: both the line height and the vertical padding are
 * `size * constant`, so the fraction of the box left for text is independent
 * of size. Width can't be solved exactly — it depends on the text, not just
 * the size — so it uses that same fraction to guess a size and probes with
 * that guess's padding, close enough for the search that follows to correct.
 */
function shrinkForPadding(budget: Rect, font: FontSpec): Rect {
  const innerRatio = font.lineHeight / (font.lineHeight + PAD_Y * 2)
  const heightForText = budget.height * innerRatio
  const guessSize = Math.min(heightForText / font.lineHeight, font.maxSize)
  const px = padX(guessSize)
  return { ...budget, width: budget.width - px * 2, height: heightForText }
}

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

import type { FontSpec, Rect, TextMeasurer, TextRender } from './types'

export interface FitOptions {
  align?: 'left' | 'center'
  /** Font sizes are searched in whole pixels down to this floor. */
  step?: number
}

export interface FitResult {
  render: TextRender
  /** Height actually consumed, which is usually less than the box. */
  height: number
}

export function wrap(
  text: string,
  maxWidth: number,
  size: number,
  font: FontSpec,
  measurer: TextMeasurer,
): string[] {
  const source = font.uppercase ? text.toUpperCase() : text
  const words = source.split(/\s+/).filter(Boolean)
  const metrics = { family: font.family, weight: font.weight, size, tracking: font.tracking ?? 0 }
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (measurer.width(candidate, metrics) <= maxWidth || !current) {
      current = candidate
      continue
    }
    lines.push(current)
    current = word
  }
  if (current) lines.push(current)

  // A single word wider than the box still has to break somewhere.
  return lines.flatMap((line) =>
    measurer.width(line, metrics) > maxWidth ? hardBreak(line, maxWidth, metrics, measurer) : [line],
  )
}

function hardBreak(
  line: string,
  maxWidth: number,
  metrics: { family: string; weight: number; size: number; tracking: number },
  measurer: TextMeasurer,
): string[] {
  const out: string[] = []
  let current = ''
  for (const char of line) {
    if (current && measurer.width(current + char, metrics) > maxWidth) {
      out.push(current)
      current = char
    } else {
      current += char
    }
  }
  if (current) out.push(current)
  return out
}

/**
 * Largest whole-pixel size at which the text wraps inside the box within its
 * line budget. Returns null when even the minimum size overflows.
 */
export function fitText(
  text: string,
  font: FontSpec,
  box: Rect,
  measurer: TextMeasurer,
  options: FitOptions = {},
): FitResult | null {
  const align = options.align ?? 'left'
  if (box.width <= 0 || box.height <= 0 || !text.trim()) return null

  let low = Math.ceil(font.minSize)
  let high = Math.floor(font.maxSize)
  if (high < low) return null

  let best: { size: number; lines: string[] } | null = null
  while (low <= high) {
    const size = Math.floor((low + high) / 2)
    const lines = wrap(text, box.width, size, font, measurer)
    const height = lines.length * size * font.lineHeight
    if (lines.length <= font.maxLines && height <= box.height) {
      best = { size, lines }
      low = size + 1
    } else {
      high = size - 1
    }
  }

  if (!best) return null
  return {
    render: {
      lines: best.lines,
      fontSize: best.size,
      lineHeight: font.lineHeight,
      align,
      tracking: font.tracking ?? 0,
      uppercase: font.uppercase ?? false,
      family: font.family,
      weight: font.weight,
    },
    height: best.lines.length * best.size * font.lineHeight,
  }
}

export function scaleFont(font: FontSpec, factor: number): FontSpec {
  return {
    ...font,
    minSize: Math.max(6, font.minSize * factor),
    maxSize: Math.max(7, font.maxSize * factor),
  }
}

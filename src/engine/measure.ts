import type { TextMeasurer } from './types'

type Metrics = { family: string; weight: number; size: number; tracking: number }

const key = (text: string, m: Metrics) => `${m.family}|${m.weight}|${m.size}|${m.tracking}|${text}`

/** Real metrics from a 2D context. Measures at 100px once and scales, so the cache stays small. */
export function createCanvasMeasurer(): TextMeasurer {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const cache = new Map<string, number>()
  if (!ctx) return createMetricMeasurer()

  return {
    width(text, m) {
      const base: Metrics = { ...m, size: 100, tracking: 0 }
      const cacheKey = key(text, base)
      let unit = cache.get(cacheKey)
      if (unit === undefined) {
        ctx.font = `${m.weight} 100px ${m.family}`
        unit = ctx.measureText(text).width / 100
        cache.set(cacheKey, unit)
      }
      return unit * m.size + text.length * m.tracking * m.size
    },
  }
}

// Advance widths as a fraction of font size, averaged from a humanist sans.
// Used for tests and for the first paint before fonts settle.
const NARROW = new Set([...'ijltfIr.,:;!|\'"()[]{}/\\ '])
const WIDE = new Set([...'mwMW@%'])

/** Deterministic approximation with no DOM dependency. */
export function createMetricMeasurer(): TextMeasurer {
  return {
    width(text, m) {
      let advance = 0
      for (const char of text) {
        if (char === ' ') advance += 0.26
        else if (NARROW.has(char)) advance += 0.31
        else if (WIDE.has(char)) advance += 0.86
        else if (char >= 'A' && char <= 'Z') advance += 0.63
        else advance += 0.53
      }
      const weightFactor = 1 + (m.weight - 400) * 0.00016
      return advance * m.size * weightFactor + text.length * m.tracking * m.size
    },
  }
}

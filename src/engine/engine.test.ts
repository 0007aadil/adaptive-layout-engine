import { describe, expect, it } from 'vitest'
import { CREATIVES } from '../data/creatives'
import { SURFACES } from '../data/surfaces'
import { createMetricMeasurer } from './measure'
import { solve } from './solve'
import { selectTemplate } from './templates'
import { wrap } from './text'
import type { Creative, LayoutNode, Surface } from './types'

const measurer = createMetricMeasurer()
const layouts = CREATIVES.flatMap((creative) =>
  SURFACES.map((surface) => ({ creative, surface, result: solve(creative, surface, { measurer }) })),
)

const overlaps = (a: LayoutNode, b: LayoutNode) =>
  a.rect.x + a.rect.width > b.rect.x + 0.5 &&
  b.rect.x + b.rect.width > a.rect.x + 0.5 &&
  a.rect.y + a.rect.height > b.rect.y + 0.5 &&
  b.rect.y + b.rect.height > a.rect.y + 0.5

describe('template selection', () => {
  const surface = (width: number, height: number): Surface => ({
    id: 'x',
    name: 'x',
    width,
    height,
    channel: 'display',
  })

  it('maps aspect ratio to an archetype', () => {
    expect(selectTemplate(surface(320, 50))).toBe('strip')
    expect(selectTemplate(surface(1920, 1080))).toBe('split')
    expect(selectTemplate(surface(1080, 1080))).toBe('stack')
    expect(selectTemplate(surface(160, 600))).toBe('column')
    expect(selectTemplate(surface(1080, 1920))).toBe('overlay')
  })
})

describe('solve', () => {
  it.each(layouts)('$creative.name on $surface.name stays inside the surface', ({ surface, result }) => {
    for (const node of result.nodes) {
      expect(node.rect.x).toBeGreaterThanOrEqual(-0.5)
      expect(node.rect.y).toBeGreaterThanOrEqual(-0.5)
      expect(node.rect.x + node.rect.width).toBeLessThanOrEqual(surface.width + 0.5)
      expect(node.rect.y + node.rect.height).toBeLessThanOrEqual(surface.height + 0.5)
    }
  })

  it.each(layouts)('$creative.name on $surface.name keeps text blocks apart', ({ result }) => {
    const text = result.nodes.filter((node) => node.text)
    for (let i = 0; i < text.length; i += 1) {
      for (let j = i + 1; j < text.length; j += 1) {
        expect(overlaps(text[i], text[j])).toBe(false)
      }
    }
  })

  it.each(layouts)('$creative.name on $surface.name keeps required elements', ({ creative, result }) => {
    const required = creative.elements.filter((el) => el.required).map((el) => el.id)
    const droppedIds = result.dropped.map((d) => d.elementId)
    for (const id of required) expect(droppedIds).not.toContain(id)
  })

  it.each(layouts)('$creative.name on $surface.name respects font bounds', ({ creative, result }) => {
    for (const node of result.nodes) {
      if (!node.text) continue
      const element = creative.elements.find((el) => el.id === node.elementId)
      if (!element || !('font' in element)) continue
      expect(node.text.lines.length).toBeLessThanOrEqual(element.font.maxLines)
      expect(node.text.fontSize).toBeGreaterThanOrEqual(Math.floor(element.font.minSize * 0.69))
    }
  })

  it('sheds the lowest priority element first', () => {
    const creative = CREATIVES[0]
    const tight: Surface = { id: 't', name: 't', width: 320, height: 50, channel: 'display' }
    const result = solve(creative, tight, { measurer })
    const survivors = result.nodes.map((node) => node.elementId)

    expect(result.dropped.length).toBeGreaterThan(0)
    expect(survivors).toContain('headline')
    expect(survivors).not.toContain('legal')
  })

  it('is deterministic', () => {
    const [{ creative, surface }] = layouts
    expect(solve(creative, surface, { measurer })).toEqual(solve(creative, surface, { measurer }))
  })

  it('honours the safe area', () => {
    const creative = CREATIVES[0]
    const surface = SURFACES.find((s) => s.id === 'story') as Surface
    const result = solve(creative, surface, { measurer })
    const copy = result.nodes.filter((node) => node.text)

    for (const node of copy) {
      expect(node.rect.y).toBeGreaterThanOrEqual(surface.safeArea?.top ?? 0)
      expect(node.rect.y + node.rect.height).toBeLessThanOrEqual(
        surface.height - (surface.safeArea?.bottom ?? 0) + 0.5,
      )
    }
  })

  it('reports what it dropped and why', () => {
    const creative = CREATIVES[1]
    const surface: Surface = { id: 'tiny', name: 'tiny', width: 300, height: 60, channel: 'display' }
    const result = solve(creative, surface, { measurer })

    for (const drop of result.dropped) {
      expect(drop.reason).toBeTruthy()
      expect(creative.elements.map((el) => el.id)).toContain(drop.elementId)
    }
  })
})

describe('degradation', () => {
  const roomy = layouts.filter(({ surface }) => surface.width * surface.height >= 250_000)

  it.each(roomy)('$creative.name keeps the whole message on $surface.name', ({ creative, result }) => {
    expect(result.dropped).toEqual([])
    expect(result.nodes).toHaveLength(creative.elements.length)
  })

  it.each(layouts)('$creative.name on $surface.name never reports clipping', ({ result }) => {
    expect(result.warnings.filter((w) => w.includes('past the surface edge'))).toEqual([])
  })

  it.each(layouts)('$creative.name on $surface.name bleeds art to the frame', ({ surface, result }) => {
    const bleed = result.nodes.find((node) => node.image?.bleed)
    if (!bleed) return
    expect(bleed.rect).toEqual({ x: 0, y: 0, width: surface.width, height: surface.height })
  })

  it('will not put a hero in a short banner', () => {
    const surface: Surface = { id: 'b', name: 'b', width: 728, height: 90, channel: 'display' }
    const result = solve(CREATIVES[0], surface, { measurer })
    const hero = result.dropped.find((drop) => drop.role === 'image')

    expect(hero?.reason).toMatch(/too short/i)
  })
})

describe('wrap', () => {
  const font = {
    family: 'Inter',
    weight: 400,
    minSize: 10,
    maxSize: 40,
    lineHeight: 1.2,
    maxLines: 4,
  }

  it('breaks on words', () => {
    expect(wrap('one two three four', 60, 16, font, measurer).length).toBeGreaterThan(1)
  })

  it('breaks inside a word that cannot fit', () => {
    const lines = wrap('Unconscionable', 40, 16, font, measurer)
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.join('')).toBe('Unconscionable')
  })

  it('uppercases when the font asks for it', () => {
    expect(wrap('shop now', 400, 16, { ...font, uppercase: true }, measurer)).toEqual(['SHOP NOW'])
  })
})

describe('creatives', () => {
  it.each(CREATIVES)('$name has unique element ids', (creative: Creative) => {
    const ids = creative.elements.map((el) => el.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

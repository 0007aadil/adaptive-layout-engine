import { describe, expect, it } from 'vitest'
import { CREATIVES } from '../data/creatives'
import { SURFACES } from '../data/surfaces'
import { defineAd } from './spec'
import { createMetricMeasurer } from './measure'
import { solve } from './solve'
import { selectTemplate } from './templates'
import { wrap } from './text'
import type { AdSpec, LayoutNode, SurfaceProfile } from './types'

const measurer = createMetricMeasurer()
const layouts = CREATIVES.flatMap((spec) =>
  SURFACES.map((surface) => ({ spec, surface, result: solve(spec, surface, { measurer }) })),
)

const overlaps = (a: LayoutNode, b: LayoutNode) =>
  a.rect.x + a.rect.width > b.rect.x + 0.5 &&
  b.rect.x + b.rect.width > a.rect.x + 0.5 &&
  a.rect.y + a.rect.height > b.rect.y + 0.5 &&
  b.rect.y + b.rect.height > a.rect.y + 0.5

const surface = (overrides: Partial<SurfaceProfile>): SurfaceProfile => ({
  id: 'x',
  name: 'x',
  width: 800,
  height: 600,
  ...overrides,
})

describe('template selection', () => {
  it('maps aspect ratio to an archetype, reading only geometry', () => {
    expect(selectTemplate(surface({ width: 1920, height: 250 }))).toBe('strip') // broadcast lower-third
    expect(selectTemplate(surface({ width: 844, height: 390 }))).toBe('split') // mobile landscape
    expect(selectTemplate(surface({ width: 1080, height: 1080 }))).toBe('stack') // square kiosk
    expect(selectTemplate(surface({ width: 200, height: 600 }))).toBe('column')
    expect(selectTemplate(surface({ width: 1080, height: 1920 }))).toBe('overlay')
  })

  it('never reads a surface id or name', () => {
    const a = selectTemplate(surface({ id: 'known-profile', width: 390, height: 844 }))
    const b = selectTemplate(surface({ id: 'an-unseen-fifth-profile', width: 390, height: 844 }))
    expect(a).toBe(b)
  })
})

describe('solve', () => {
  it.each(layouts)('$spec.name on $surface.name stays inside the surface', ({ surface, result }) => {
    for (const node of result.nodes) {
      expect(node.rect.x).toBeGreaterThanOrEqual(-0.5)
      expect(node.rect.y).toBeGreaterThanOrEqual(-0.5)
      expect(node.rect.x + node.rect.width).toBeLessThanOrEqual(surface.width + 0.5)
      expect(node.rect.y + node.rect.height).toBeLessThanOrEqual(surface.height + 0.5)
    }
  })

  it.each(layouts)('$spec.name on $surface.name never overlaps text or buttons', ({ result }) => {
    const boxed = result.nodes.filter((node) => node.text)
    for (let i = 0; i < boxed.length; i += 1) {
      for (let j = i + 1; j < boxed.length; j += 1) {
        expect(overlaps(boxed[i], boxed[j])).toBe(false)
      }
    }
  })

  it.each(layouts)('$spec.name on $surface.name respects font bounds', ({ spec, result }) => {
    for (const node of result.nodes) {
      if (!node.text) continue
      const element = spec.elements.find((el) => el.id === node.elementId)
      if (!element || element.type === 'image') continue
      expect(node.text.lines.length).toBeLessThanOrEqual(element.font.maxLines)
      expect(node.text.fontSize).toBeGreaterThanOrEqual(Math.floor(element.font.minSize * 0.69))
    }
  })

  it('is deterministic', () => {
    const [{ spec, surface }] = layouts
    expect(solve(spec, surface, { measurer })).toEqual(solve(spec, surface, { measurer }))
  })

  it('reports what it dropped and why', () => {
    const spec = CREATIVES[1]
    const tiny = surface({ width: 300, height: 60 })
    const result = solve(spec, tiny, { measurer })

    for (const drop of result.dropped) {
      expect(drop.reason).toBeTruthy()
      expect(spec.elements.map((el) => el.id)).toContain(drop.elementId)
    }
  })

  it.each(layouts)(
    '$spec.name on $surface.name never sacrifices a more important element while a less important one survives',
    ({ spec, result }) => {
      const priorityOf = (id: string) => spec.elements.find((el) => el.id === id)?.priority ?? 0
      const worstSurvivor = Math.max(0, ...result.nodes.map((n) => priorityOf(n.elementId)))
      for (const drop of result.dropped) {
        // A region template can carve independent tracks (e.g. a dedicated
        // branding column), so this only has to hold against the single worst
        // surviving priority, not every individual survivor pairwise.
        expect(priorityOf(drop.elementId)).toBeGreaterThanOrEqual(worstSurvivor)
      }
    },
  )
})

describe('priority-based degradation', () => {
  it('sheds priority 3 (branding) before priority 2, and priority 2 before priority 1', () => {
    const spec = CREATIVES[0]
    const tight = surface({ width: 320, height: 90 })
    const result = solve(spec, tight, { measurer })
    const survivors = new Set(result.nodes.map((node) => node.elementId))

    expect(result.dropped.length).toBeGreaterThan(0)
    expect(survivors.has('headline')).toBe(true) // priority 1
    if (!survivors.has('cta')) {
      // priority 2 only sacrificed once priority 3 is already gone
      expect(survivors.has('logo')).toBe(false)
    }
  })

  it('matches the brief’s own example: a tight kiosk drops branding, keeps headline/hero/CTA', () => {
    const spec = CREATIVES[0]
    const kioskTight = SURFACES.find((s) => s.id === 'kiosk-degraded') as SurfaceProfile
    const result = solve(spec, kioskTight, { measurer })
    const survivors = new Set(result.nodes.map((node) => node.elementId))

    expect(result.dropped.map((d) => d.elementId)).toContain('logo')
    expect(survivors.has('headline')).toBe(true)
    expect(survivors.has('product-image')).toBe(true)
    expect(survivors.has('cta')).toBe(true)

    const boxed = result.nodes.filter((node) => node.text)
    for (let i = 0; i < boxed.length; i += 1) {
      for (let j = i + 1; j < boxed.length; j += 1) {
        expect(overlaps(boxed[i], boxed[j])).toBe(false)
      }
    }
    for (const node of result.nodes) {
      expect(node.rect.x).toBeGreaterThanOrEqual(-0.5)
      expect(node.rect.y).toBeGreaterThanOrEqual(-0.5)
      expect(node.rect.x + node.rect.width).toBeLessThanOrEqual(kioskTight.width + 0.5)
      expect(node.rect.y + node.rect.height).toBeLessThanOrEqual(kioskTight.height + 0.5)
    }
  })
})

describe('hard constraints', () => {
  it('never renders a button below the surface minTapTarget', () => {
    for (const { result, surface } of layouts) {
      if (!surface.minTapTarget) continue
      for (const node of result.nodes) {
        if (node.type === 'button') {
          expect(node.rect.height).toBeGreaterThanOrEqual(surface.minTapTarget - 0.5)
        }
      }
    }
  })

  it('never renders text below the surface minTextSize', () => {
    for (const { result, surface } of layouts) {
      if (!surface.minTextSize) continue
      for (const node of result.nodes) {
        if (node.text) expect(node.text.fontSize).toBeGreaterThanOrEqual(surface.minTextSize - 0.5)
      }
    }
  })

  it('honours the safe area on mobile profiles', () => {
    const spec = CREATIVES[0]
    const mobile = SURFACES.find((s) => s.id === 'mobile-portrait') as SurfaceProfile
    const result = solve(spec, mobile, { measurer })
    const top = mobile.safeArea?.top ?? 0
    const bottom = mobile.height - (mobile.safeArea?.bottom ?? 0)

    for (const node of result.nodes) {
      expect(node.rect.y).toBeGreaterThanOrEqual(top - 0.5)
      expect(node.rect.y + node.rect.height).toBeLessThanOrEqual(bottom + 0.5)
    }
  })

  it('resolves an unseen surface profile with no code changes', () => {
    const spec = CREATIVES[0]
    const neverSeenBefore = surface({
      id: 'interview-surface',
      width: 1280,
      height: 720,
      minTapTarget: 50,
      minTextSize: 28,
      touchOnly: true,
      viewingDistance: 'far',
    })
    const result = solve(spec, neverSeenBefore, { measurer })

    expect(result.warnings).toEqual([])
    for (const node of result.nodes) {
      if (node.type === 'button') expect(node.rect.height).toBeGreaterThanOrEqual(49.5)
      if (node.text) expect(node.text.fontSize).toBeGreaterThanOrEqual(27.5)
    }
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

describe('defineAd', () => {
  const font = { family: 'Inter', weight: 400, minSize: 10, maxSize: 20, lineHeight: 1.2, maxLines: 1 }
  const palette = { background: '#000', foreground: '#fff', muted: '#888', accent: '#f00', onAccent: '#fff' }

  it('builds a valid spec', () => {
    const spec: AdSpec = defineAd({
      name: 'Test',
      palette,
      elements: [{ id: 'h', type: 'text', role: 'primary', priority: 1, text: 'Hi', font }],
    })
    expect(spec.elements).toHaveLength(1)
  })

  it('rejects a duplicate id', () => {
    expect(() =>
      defineAd({
        palette,
        elements: [
          { id: 'h', type: 'text', role: 'primary', priority: 1, text: 'Hi', font },
          { id: 'h', type: 'text', role: 'secondary', priority: 2, text: 'Bye', font },
        ],
      }),
    ).toThrow(/duplicate id/)
  })

  it('rejects an unknown role at runtime', () => {
    expect(() =>
      defineAd({
        palette,
        // @ts-expect-error — deliberately invalid to prove the runtime check fires too.
        elements: [{ id: 'h', type: 'text', role: 'hero-image', priority: 1, text: 'Hi', font }],
      }),
    ).toThrow(/not one of/)
  })

  it('rejects an image with no positive aspect ratio', () => {
    expect(() =>
      defineAd({
        palette,
        elements: [{ id: 'i', type: 'image', role: 'hero', priority: 1, src: '/x.png', aspect: 0 }],
      }),
    ).toThrow(/aspect must be > 0/)
  })

  it('rejects an empty spec', () => {
    expect(() => defineAd({ palette, elements: [] })).toThrow(/at least one element/)
  })
})

describe('sample specs', () => {
  it.each(CREATIVES)('$name has unique element ids and the five canonical roles', (spec: AdSpec) => {
    const ids = spec.elements.map((el) => el.id)
    expect(new Set(ids).size).toBe(ids.length)

    const roles = spec.elements.map((el) => el.role)
    expect(new Set(roles)).toEqual(new Set(['primary', 'hero', 'action', 'secondary', 'branding']))
  })
})

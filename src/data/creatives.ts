import { defineAd, type AdSpec, type FontSpec } from '../engine'

const DISPLAY: FontSpec = {
  family: '"Inter Tight", Inter, system-ui, sans-serif',
  weight: 700,
  minSize: 13,
  maxSize: 46,
  lineHeight: 1.06,
  maxLines: 3,
  tracking: -0.02,
}

const BODY: FontSpec = {
  family: 'Inter, system-ui, sans-serif',
  weight: 450,
  minSize: 9,
  maxSize: 20,
  lineHeight: 1.35,
  maxLines: 3,
}

const ACTION: FontSpec = {
  family: 'Inter, system-ui, sans-serif',
  weight: 600,
  minSize: 9,
  maxSize: 17,
  lineHeight: 1.1,
  maxLines: 1,
  tracking: 0.01,
}

export const CREATIVES: AdSpec[] = [
  defineAd({
    id: 'aurora-spatial',
    name: 'Aurora — Spatial format',
    palette: {
      background: '#0f0f0f',
      foreground: '#ffffff',
      muted: '#a0a0a0',
      accent: '#e2703a',
      onAccent: '#0f0f0f',
    },
    elements: [
      { id: 'headline', type: 'text', role: 'primary', priority: 1, text: 'Ads that hold still long enough to be believed', font: DISPLAY },
      { id: 'product-image', type: 'image', role: 'hero', priority: 1, src: '/creatives/hero-dune.svg', aspect: 1.6, focal: { x: 0.58, y: 0.42 } },
      { id: 'cta', type: 'button', role: 'action', priority: 2, text: 'See it live', font: ACTION },
      { id: 'price', type: 'text', role: 'secondary', priority: 2, text: 'One spatial creative, delivered to every screen it has to run on.', font: BODY },
      { id: 'logo', type: 'image', role: 'branding', priority: 3, src: '/creatives/mark-aurora.svg', aspect: 4.25 },
    ],
  }),
  defineAd({
    id: 'atlas-runner',
    name: 'Atlas — Runner launch',
    palette: {
      background: '#0d1424',
      foreground: '#f7f3ea',
      muted: '#9fb0cc',
      accent: '#ef476f',
      onAccent: '#ffffff',
    },
    elements: [
      { id: 'headline', type: 'text', role: 'primary', priority: 1, text: 'Built for the long way round', font: DISPLAY },
      { id: 'product-image', type: 'image', role: 'hero', priority: 1, src: '/creatives/hero-runner.svg', aspect: 1.6, focal: { x: 0.62, y: 0.4 } },
      { id: 'cta', type: 'button', role: 'action', priority: 2, text: 'Shop the drop', font: ACTION },
      { id: 'price', type: 'text', role: 'secondary', priority: 2, text: 'The Atlas Trail 2 lands this Thursday. 240g, all-terrain, zero break-in.', font: BODY },
      { id: 'logo', type: 'image', role: 'branding', priority: 3, src: '/creatives/mark-atlas.svg', aspect: 4 },
    ],
  }),
  defineAd({
    id: 'meridian-card',
    name: 'Meridian — Cashback card',
    palette: {
      background: '#0f3d3e',
      foreground: '#f2f7f5',
      muted: '#9dc2bb',
      accent: '#ffd166',
      onAccent: '#0f3d3e',
    },
    elements: [
      { id: 'headline', type: 'text', role: 'primary', priority: 1, text: '3% back on everything you already buy', font: DISPLAY },
      { id: 'product-image', type: 'image', role: 'hero', priority: 1, src: '/creatives/hero-card.svg', aspect: 1, focal: { x: 0.5, y: 0.55 } },
      { id: 'cta', type: 'button', role: 'action', priority: 2, text: 'Apply in 3 minutes', font: ACTION },
      { id: 'price', type: 'text', role: 'secondary', priority: 2, text: 'No annual fee, no category juggling, no points to decode.', font: BODY },
      { id: 'logo', type: 'image', role: 'branding', priority: 3, src: '/creatives/mark-atlas.svg', aspect: 4 },
    ],
  }),
]

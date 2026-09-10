import type { Creative, FontSpec } from '../engine'

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

const LEGAL: FontSpec = {
  family: 'Inter, system-ui, sans-serif',
  weight: 400,
  minSize: 6,
  maxSize: 11,
  lineHeight: 1.25,
  maxLines: 2,
}

export const CREATIVES: Creative[] = [
  {
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
      { id: 'logo', role: 'logo', priority: 68, src: '/creatives/mark-aurora.svg', aspect: 4.25 },
      {
        id: 'hero',
        role: 'image',
        priority: 62,
        src: '/creatives/hero-dune.svg',
        aspect: 1.6,
        focal: { x: 0.58, y: 0.42 },
      },
      {
        id: 'headline',
        role: 'headline',
        priority: 100,
        required: true,
        text: 'Ads that hold still long enough to be believed',
        font: DISPLAY,
      },
      {
        id: 'subhead',
        role: 'subhead',
        priority: 48,
        text: 'One spatial creative, delivered to every screen it has to run on.',
        font: BODY,
      },
      { id: 'cta', role: 'cta', priority: 88, text: 'See it live', font: ACTION },
      {
        id: 'legal',
        role: 'legal',
        priority: 25,
        text: 'Rendered in-browser. No app install.',
        font: LEGAL,
      },
    ],
  },
  {
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
      { id: 'logo', role: 'logo', priority: 70, src: '/creatives/mark-atlas.svg', aspect: 4 },
      {
        id: 'hero',
        role: 'image',
        priority: 60,
        src: '/creatives/hero-runner.svg',
        aspect: 1.6,
        focal: { x: 0.62, y: 0.4 },
      },
      {
        id: 'headline',
        role: 'headline',
        priority: 100,
        required: true,
        text: 'Built for the long way round',
        font: DISPLAY,
      },
      {
        id: 'subhead',
        role: 'subhead',
        priority: 45,
        text: 'The Atlas Trail 2 lands this Thursday. 240g, all-terrain, zero break-in.',
        font: BODY,
      },
      { id: 'cta', role: 'cta', priority: 90, text: 'Shop the drop', font: ACTION },
      {
        id: 'legal',
        role: 'legal',
        priority: 20,
        text: 'Selected sizes only. While stocks last.',
        font: LEGAL,
      },
    ],
  },
  {
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
      { id: 'logo', role: 'logo', priority: 65, src: '/creatives/mark-atlas.svg', aspect: 4 },
      {
        id: 'hero',
        role: 'image',
        priority: 55,
        src: '/creatives/hero-card.svg',
        aspect: 1,
        focal: { x: 0.5, y: 0.55 },
      },
      {
        id: 'headline',
        role: 'headline',
        priority: 100,
        required: true,
        text: '3% back on everything you already buy',
        font: DISPLAY,
      },
      {
        id: 'subhead',
        role: 'subhead',
        priority: 50,
        text: 'No annual fee, no category juggling, no points to decode.',
        font: BODY,
      },
      { id: 'cta', role: 'cta', priority: 85, text: 'Apply in 3 minutes', font: ACTION },
      {
        id: 'legal',
        role: 'legal',
        priority: 30,
        required: true,
        text: 'Representative 24.9% APR variable. Credit subject to status.',
        font: LEGAL,
      },
    ],
  },
]

export interface Insets {
  top: number
  right: number
  bottom: number
  left: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export type SurfaceChannel = 'display' | 'social' | 'ctv' | 'dooh'

export interface Surface {
  id: string
  name: string
  width: number
  height: number
  channel: SurfaceChannel
  /** Chrome that content must stay clear of: player controls, notches, bezels. */
  safeArea?: Partial<Insets>
}

export type ElementRole = 'logo' | 'headline' | 'subhead' | 'image' | 'cta' | 'legal'

interface ElementBase {
  id: string
  role: ElementRole
  /** Higher survives longer. Ties break on declaration order. */
  priority: number
  /** Never dropped, even if the layout ends up overflowing. */
  required?: boolean
}

export interface FontSpec {
  family: string
  weight: number
  minSize: number
  maxSize: number
  /** Multiplier on font size. */
  lineHeight: number
  maxLines: number
  tracking?: number
  uppercase?: boolean
}

export interface TextElement extends ElementBase {
  role: 'headline' | 'subhead' | 'cta' | 'legal'
  text: string
  font: FontSpec
}

export interface ImageElement extends ElementBase {
  role: 'image' | 'logo'
  src: string
  /** Intrinsic width / height. */
  aspect: number
  /** Normalised point that must survive a crop. Defaults to centre. */
  focal?: { x: number; y: number }
}

export type AdElement = TextElement | ImageElement

export interface Palette {
  background: string
  foreground: string
  muted: string
  accent: string
  onAccent: string
}

export interface Creative {
  id: string
  name: string
  palette: Palette
  elements: AdElement[]
}

export type TemplateId = 'stack' | 'split' | 'strip' | 'column' | 'overlay'

export interface TextRender {
  lines: string[]
  fontSize: number
  lineHeight: number
  align: 'left' | 'center'
  tracking: number
  uppercase: boolean
  family: string
  weight: number
}

export interface ImageRender {
  src: string
  /** CSS object-position, already resolved from the focal point. */
  position: { x: number; y: number }
  /** Fraction of the source that survives the crop, for the inspector. */
  coverage: number
  /** Sits behind the copy rather than in its own track, so it needs a scrim. */
  bleed: boolean
}

export interface LayoutNode {
  elementId: string
  role: ElementRole
  rect: Rect
  text?: TextRender
  image?: ImageRender
}

export interface DroppedElement {
  elementId: string
  role: ElementRole
  reason: string
}

export interface LayoutResult {
  surface: Surface
  template: TemplateId
  content: Rect
  nodes: LayoutNode[]
  dropped: DroppedElement[]
  /** Share of the content box covered by copy and non-bleed art. */
  fill: number
  warnings: string[]
}

/** Injected so the solver stays pure and testable without a canvas. */
export interface TextMeasurer {
  width(text: string, font: { family: string; weight: number; size: number; tracking: number }): number
}

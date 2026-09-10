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

export type ElementType = 'text' | 'image' | 'button'

/** Semantic role, independent of surface. What the resolver reasons about when it degrades. */
export type ElementRole = 'primary' | 'secondary' | 'hero' | 'action' | 'branding'

interface ElementBase {
  id: string
  role: ElementRole
  /** 1 is most important. The resolver drops the highest number first when space runs out. */
  priority: number
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
  type: 'text'
  text: string
  font: FontSpec
}

export interface ButtonElement extends ElementBase {
  type: 'button'
  text: string
  font: FontSpec
}

export interface ImageElement extends ElementBase {
  type: 'image'
  src: string
  /** Intrinsic width / height. */
  aspect: number
  /** Normalised point that must survive a crop. Defaults to centre. */
  focal?: { x: number; y: number }
}

export type AdElement = TextElement | ButtonElement | ImageElement

export interface Palette {
  background: string
  foreground: string
  muted: string
  accent: string
  onAccent: string
}

export interface AdSpec {
  id: string
  name: string
  palette: Palette
  elements: AdElement[]
}

export type ViewingDistance = 'near' | 'far'

/**
 * A surface's real constraints, not just its box. The resolver only ever reads
 * these fields — never a surface id or name — which is what lets an unseen
 * fifth profile resolve correctly with no code changes.
 */
export interface SurfaceProfile {
  id: string
  name: string
  width: number
  height: number
  /** Chrome that content must stay clear of: notches, home indicators, bezels. */
  safeArea?: Partial<Insets>
  /** Minimum hit area for anything tappable. Enforced on `button` elements. */
  minTapTarget?: number
  /** Floor on rendered type size, regardless of an element's own minimum. */
  minTextSize?: number
  viewingDistance?: ViewingDistance
  touchOnly?: boolean
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
  type: ElementType
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
  surface: SurfaceProfile
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

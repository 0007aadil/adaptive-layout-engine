/**
 * Not a runtime test: this file only has to compile. `tsc --noEmit` (npm run
 * typecheck) is where these assertions actually run. Each @ts-expect-error
 * proves the type system rejects that mistake; if a later change makes the
 * "invalid" line legal, the unused directive itself fails the build.
 */
import type { AdElement, ButtonElement, ElementRole, ImageElement, TextElement } from './types'

const font = { family: 'Inter', weight: 500, minSize: 10, maxSize: 20, lineHeight: 1.2, maxLines: 1 }

const validHeadline: TextElement = { id: 'h', type: 'text', role: 'primary', priority: 1, text: 'Hi', font }
const validCta: ButtonElement = { id: 'c', type: 'button', role: 'action', priority: 2, text: 'Go', font }
const validImage: ImageElement = { id: 'i', type: 'image', role: 'hero', priority: 1, src: '/x.png', aspect: 1 }

// @ts-expect-error — "hero-image" is not a valid ElementRole.
const _badRole: ElementRole = 'hero-image'

// @ts-expect-error — a text element has no `src` or `aspect`.
const _textWithImageFields: TextElement = { id: 't', type: 'text', role: 'primary', priority: 1, src: '/x.png' }

// @ts-expect-error — `type` must be 'text' | 'image' | 'button'.
const _unknownType: AdElement = { id: 'u', type: 'video', role: 'hero', priority: 1 }

// @ts-expect-error — priority is required.
const _missingPriority: TextElement = { id: 'm', type: 'text', role: 'primary', text: 'Hi', font }

void [validHeadline, validCta, validImage]

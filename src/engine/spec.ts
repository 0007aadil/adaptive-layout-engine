import type { AdElement, AdSpec, ElementRole, Palette } from './types'

const ROLES: ReadonlySet<ElementRole> = new Set(['primary', 'secondary', 'hero', 'action', 'branding'])

export interface AdSpecInput {
  id?: string
  name?: string
  palette: Palette
  elements: AdElement[]
}

/**
 * Builds an AdSpec and rejects it at the boundary rather than letting a bad
 * spec fail silently or crash deep inside the resolver. An unknown role only
 * reaches here by bypassing TypeScript (a JS caller, a cast, bad JSON); the
 * type system already rejects it at compile time for normal callers.
 */
export function defineAd(input: AdSpecInput): AdSpec {
  const errors: string[] = []
  const seen = new Set<string>()

  if (!input.elements.length) errors.push('elements: at least one element is required')

  for (const element of input.elements) {
    const tag = element.id || '(missing id)'

    if (!element.id) errors.push(`element ${tag}: id is required`)
    else if (seen.has(element.id)) errors.push(`element ${tag}: duplicate id`)
    seen.add(element.id)

    if (!ROLES.has(element.role)) {
      errors.push(`element ${tag}: role "${element.role}" is not one of ${[...ROLES].join(', ')}`)
    }
    if (!Number.isFinite(element.priority) || element.priority < 1) {
      errors.push(`element ${tag}: priority must be a number >= 1, got ${element.priority}`)
    }

    if (element.type === 'image') {
      if (!element.src) errors.push(`element ${tag}: image requires src`)
      if (!(element.aspect > 0)) errors.push(`element ${tag}: image aspect must be > 0`)
    } else if (element.type === 'text' || element.type === 'button') {
      if (!element.text.trim()) errors.push(`element ${tag}: ${element.type} requires non-empty text`)
      if (!(element.font.minSize > 0) || !(element.font.maxSize >= element.font.minSize)) {
        errors.push(`element ${tag}: font.minSize/maxSize must satisfy 0 < minSize <= maxSize`)
      }
    } else {
      errors.push(`element ${tag}: unknown type "${(element as { type: string }).type}"`)
    }
  }

  if (errors.length) {
    throw new Error(`Invalid ad spec:\n  ${errors.join('\n  ')}`)
  }

  return {
    id: input.id ?? crypto.randomUUID(),
    name: input.name ?? 'Untitled ad',
    palette: input.palette,
    elements: input.elements,
  }
}

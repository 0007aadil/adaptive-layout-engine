import type { ReactNode } from 'react'

type Tone = 'neutral' | 'accent' | 'warn'

export function Tag({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`tag tag--${tone}`}>{children}</span>
}

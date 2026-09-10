import type { ReactNode } from 'react'

interface Props {
  label: string
  hint?: ReactNode
  children: ReactNode
}

export function Field({ label, hint, children }: Props) {
  return (
    <label className="field">
      <span className="field__label">
        {label}
        {hint && <span className="field__hint">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

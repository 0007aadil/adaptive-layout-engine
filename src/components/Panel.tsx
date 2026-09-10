import type { ReactNode } from 'react'

interface Props {
  title: string
  aside?: ReactNode
  children: ReactNode
}

export function Panel({ title, aside, children }: Props) {
  return (
    <section className="panel">
      <header className="panel__head">
        <h2>{title}</h2>
        {aside}
      </header>
      <div className="panel__body">{children}</div>
    </section>
  )
}

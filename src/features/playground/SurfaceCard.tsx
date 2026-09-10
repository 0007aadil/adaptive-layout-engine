import { AdFrame } from '../../components/AdFrame'
import { Tag } from '../../components/Tag'
import { describeConstraints } from '../../lib/constraints'
import type { LayoutResult, Palette } from '../../engine'

interface Props {
  layout: LayoutResult
  palette: Palette
  selected: boolean
  debug: boolean
  onSelect: () => void
}

export function SurfaceCard({ layout, palette, selected, debug, onSelect }: Props) {
  const { surface, dropped } = layout

  return (
    <button
      type="button"
      className={`card${selected ? ' card--selected' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div className="card__stage">
        <AdFrame layout={layout} palette={palette} maxSize={172} debug={debug} />
      </div>
      <div className="card__meta">
        <span className="card__name">{surface.name}</span>
        <span className="card__dims">
          {surface.width}x{surface.height}
        </span>
      </div>
      <div className="card__tags">
        <Tag tone="accent">{layout.template}</Tag>
        {describeConstraints(surface).map((badge) => (
          <Tag key={badge}>{badge}</Tag>
        ))}
        {dropped.length > 0 && <Tag tone="warn">-{dropped.length}</Tag>}
      </div>
    </button>
  )
}

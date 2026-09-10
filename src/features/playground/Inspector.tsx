import { AdFrame } from '../../components/AdFrame'
import { Panel } from '../../components/Panel'
import { Tag } from '../../components/Tag'
import type { Creative, LayoutResult } from '../../engine'

interface Props {
  layout: LayoutResult
  creative: Creative
  debug: boolean
}

export function Inspector({ layout, creative, debug }: Props) {
  const { surface, nodes, dropped, warnings } = layout
  const label = (id: string) => creative.elements.find((el) => el.id === id)?.role ?? id

  return (
    <Panel
      title={surface.name}
      aside={
        <span className="panel__aside">
          {surface.width}x{surface.height} · {layout.template} · {Math.round(layout.fill * 100)}% filled
        </span>
      }
    >
      <div className="inspector__stage">
        <AdFrame layout={layout} palette={creative.palette} maxSize={360} debug={debug} />
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Element</th>
            <th>Box</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node) => (
            <tr key={node.elementId}>
              <td>{node.role}</td>
              <td className="table__num">
                {Math.round(node.rect.width)}x{Math.round(node.rect.height)}
              </td>
              <td className="table__num">
                {node.text
                  ? `${node.text.fontSize}px / ${node.text.lines.length} line${node.text.lines.length > 1 ? 's' : ''}`
                  : `${Math.round((node.image?.coverage ?? 1) * 100)}% of source`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {dropped.length > 0 && (
        <ul className="notes">
          {dropped.map((drop) => (
            <li key={drop.elementId}>
              <Tag tone="warn">dropped</Tag>
              <span>
                <strong>{label(drop.elementId)}</strong> — {drop.reason}
              </span>
            </li>
          ))}
        </ul>
      )}

      {warnings.length > 0 && (
        <ul className="notes">
          {warnings.map((warning) => (
            <li key={warning}>
              <Tag>note</Tag>
              <span>{warning}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

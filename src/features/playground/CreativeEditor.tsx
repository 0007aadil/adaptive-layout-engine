import { Field } from '../../components/Field'
import { Panel } from '../../components/Panel'
import type { AdElement, AdSpec } from '../../engine'

interface Props {
  spec: AdSpec
  onChange: (id: string, patch: Partial<AdElement>) => void
}

export function CreativeEditor({ spec, onChange }: Props) {
  return (
    <Panel title="Ad spec" aside={<span className="panel__aside">{spec.name}</span>}>
      {spec.elements.map((element) => (
        <div className="editor__row" key={element.id}>
          {element.type === 'image' ? (
            <span className="field__label">
              {element.role}
              <span className="field__hint">{element.type}</span>
            </span>
          ) : (
            <Field label={element.role} hint={element.type}>
              <textarea
                className="input"
                rows={2}
                value={element.text}
                onChange={(event) => onChange(element.id, { text: event.target.value } as Partial<AdElement>)}
              />
            </Field>
          )}

          <Field label="Priority" hint={`${element.priority} · ${priorityHint(element.priority)}`}>
            <input
              className="range"
              type="range"
              min={1}
              max={5}
              step={1}
              value={element.priority}
              onChange={(event) => onChange(element.id, { priority: Number(event.target.value) })}
            />
          </Field>
        </div>
      ))}
    </Panel>
  )
}

function priorityHint(priority: number): string {
  if (priority <= 1) return 'never dropped in practice'
  if (priority === 2) return 'drops after branding'
  return 'first to drop'
}

import { Field } from '../../components/Field'
import { Panel } from '../../components/Panel'
import type { AdElement, Creative, TextElement } from '../../engine'

interface Props {
  creative: Creative
  onChange: (id: string, patch: Partial<AdElement>) => void
}

const isText = (element: AdElement): element is TextElement => 'text' in element

export function CreativeEditor({ creative, onChange }: Props) {
  return (
    <Panel title="Creative" aside={<span className="panel__aside">{creative.name}</span>}>
      {creative.elements.map((element) => (
        <div className="editor__row" key={element.id}>
          {isText(element) ? (
            <Field label={element.role}>
              <textarea
                className="input"
                rows={2}
                value={element.text}
                onChange={(event) => onChange(element.id, { text: event.target.value } as Partial<AdElement>)}
              />
            </Field>
          ) : (
            <span className="field__label">{element.role}</span>
          )}

          <div className="editor__controls">
            <Field label="Priority" hint={element.priority}>
              <input
                className="range"
                type="range"
                min={0}
                max={100}
                value={element.priority}
                onChange={(event) => onChange(element.id, { priority: Number(event.target.value) })}
              />
            </Field>
            <label className="check">
              <input
                type="checkbox"
                checked={element.required ?? false}
                onChange={(event) => onChange(element.id, { required: event.target.checked })}
              />
              Required
            </label>
          </div>
        </div>
      ))}
    </Panel>
  )
}

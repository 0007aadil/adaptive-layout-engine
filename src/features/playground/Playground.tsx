import { useMemo, useState } from 'react'
import { Field } from '../../components/Field'
import { Panel } from '../../components/Panel'
import { CREATIVES } from '../../data/creatives'
import { SURFACES } from '../../data/surfaces'
import { solve, type AdElement, type Creative, type Surface } from '../../engine'
import { measurer } from '../../lib/measurer'
import { CreativeEditor } from './CreativeEditor'
import { Inspector } from './Inspector'
import { SurfaceCard } from './SurfaceCard'

const CUSTOM_ID = 'custom'

export function Playground() {
  const [creative, setCreative] = useState<Creative>(CREATIVES[0])
  const [custom, setCustom] = useState({ width: 640, height: 400 })
  const [selectedId, setSelectedId] = useState(CUSTOM_ID)
  const [debug, setDebug] = useState(false)

  const surfaces = useMemo<Surface[]>(
    () => [
      { id: CUSTOM_ID, name: 'Free surface', channel: 'display', ...custom },
      ...SURFACES,
    ],
    [custom],
  )

  const layouts = useMemo(
    () => surfaces.map((surface) => solve(creative, surface, { measurer })),
    [creative, surfaces],
  )

  const selected = layouts.find((layout) => layout.surface.id === selectedId) ?? layouts[0]

  const updateElement = (id: string, patch: Partial<AdElement>) =>
    setCreative((current) => ({
      ...current,
      elements: current.elements.map((element) =>
        element.id === id ? ({ ...element, ...patch } as AdElement) : element,
      ),
    }))

  return (
    <div className="app">
      <header className="app__head">
        <div>
          <h1>Adaptive layout engine</h1>
          <p>
            One creative, {surfaces.length} surfaces. The engine picks a template from the frame,
            fits the type to the space it has, and sheds the least important element when the message
            no longer fits.
          </p>
        </div>
        <div className="app__controls">
          <Field label="Creative">
            <select
              className="input"
              value={creative.id}
              onChange={(event) =>
                setCreative(CREATIVES.find((item) => item.id === event.target.value) ?? CREATIVES[0])
              }
            >
              {CREATIVES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <label className="check">
            <input type="checkbox" checked={debug} onChange={(e) => setDebug(e.target.checked)} />
            Show boxes
          </label>
        </div>
      </header>

      <div className="app__body">
        <div className="matrix">
          {layouts.map((layout) => (
            <SurfaceCard
              key={layout.surface.id}
              layout={layout}
              palette={creative.palette}
              selected={layout.surface.id === selected.surface.id}
              debug={debug}
              onSelect={() => setSelectedId(layout.surface.id)}
            />
          ))}
        </div>

        <aside className="sidebar">
          <Inspector layout={selected} creative={creative} debug={debug} />

          <Panel title="Free surface" aside={<span className="panel__aside">drag to stress the engine</span>}>
            <Field label="Width" hint={`${custom.width}px`}>
              <input
                className="range"
                type="range"
                min={160}
                max={2560}
                step={8}
                value={custom.width}
                onChange={(e) => setCustom((c) => ({ ...c, width: Number(e.target.value) }))}
              />
            </Field>
            <Field label="Height" hint={`${custom.height}px`}>
              <input
                className="range"
                type="range"
                min={50}
                max={1920}
                step={8}
                value={custom.height}
                onChange={(e) => setCustom((c) => ({ ...c, height: Number(e.target.value) }))}
              />
            </Field>
          </Panel>

          <CreativeEditor creative={creative} onChange={updateElement} />
        </aside>
      </div>
    </div>
  )
}

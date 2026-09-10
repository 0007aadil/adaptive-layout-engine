import { useMemo, useState } from 'react'
import { Field } from '../../components/Field'
import { Panel } from '../../components/Panel'
import { CREATIVES } from '../../data/creatives'
import { SURFACES } from '../../data/surfaces'
import { solve, type AdElement, type AdSpec, type SurfaceProfile } from '../../engine'
import { measurer } from '../../lib/measurer'
import { CreativeEditor } from './CreativeEditor'
import { Inspector } from './Inspector'
import { SurfaceCard } from './SurfaceCard'

const LIVE_ID = 'live-profile'

interface LiveConstraints {
  width: number
  height: number
  touchOnly: boolean
  minTapTarget: number | null
  minTextSize: number | null
  viewingDistance: 'near' | 'far'
}

const DEFAULT_LIVE: LiveConstraints = {
  width: 720,
  height: 480,
  touchOnly: false,
  minTapTarget: null,
  minTextSize: null,
  viewingDistance: 'near',
}

export function Playground() {
  const [spec, setSpec] = useState<AdSpec>(CREATIVES[0])
  const [live, setLive] = useState<LiveConstraints>(DEFAULT_LIVE)
  const [selectedId, setSelectedId] = useState(LIVE_ID)
  const [debug, setDebug] = useState(false)

  const liveProfile: SurfaceProfile = useMemo(
    () => ({
      id: LIVE_ID,
      name: 'Live profile',
      width: live.width,
      height: live.height,
      touchOnly: live.touchOnly,
      viewingDistance: live.viewingDistance,
      ...(live.minTapTarget ? { minTapTarget: live.minTapTarget } : {}),
      ...(live.minTextSize ? { minTextSize: live.minTextSize } : {}),
    }),
    [live],
  )

  const surfaces = useMemo<SurfaceProfile[]>(() => [liveProfile, ...SURFACES], [liveProfile])

  const layouts = useMemo(
    () => surfaces.map((surface) => solve(spec, surface, { measurer })),
    [spec, surfaces],
  )

  const selected = layouts.find((layout) => layout.surface.id === selectedId) ?? layouts[0]

  const updateElement = (id: string, patch: Partial<AdElement>) =>
    setSpec((current) => ({
      ...current,
      elements: current.elements.map((element) =>
        element.id === id ? ({ ...element, ...patch } as AdElement) : element,
      ),
    }))

  return (
    <div className="app">
      <header className="app__head">
        <div>
          <h1>One spec, every surface</h1>
          <p>
            The resolver reads a surface's real constraints — safe area, minimum tap target,
            minimum type size, viewing distance — and never its name. Drop the same ad spec onto
            an unseen profile below and it still degrades correctly, with no code changes.
          </p>
        </div>
        <div className="app__controls">
          <select
            className="input"
            aria-label="Ad spec"
            value={spec.id}
            onChange={(event) => setSpec(CREATIVES.find((item) => item.id === event.target.value) ?? CREATIVES[0])}
          >
            {CREATIVES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <label className="check">
            <input type="checkbox" checked={debug} onChange={(e) => setDebug(e.target.checked)} />
            Show boxes
          </label>
        </div>
      </header>

      <div className="app__body">
        <div>
          <div className="section__head">
            <h2>Surfaces</h2>
            <span className="muted">
              {layouts.filter((layout) => layout.dropped.length === 0).length} of {layouts.length}{' '}
              carry the whole spec
            </span>
          </div>
          <div className="matrix">
            {layouts.map((layout) => (
              <SurfaceCard
                key={layout.surface.id}
                layout={layout}
                palette={spec.palette}
                selected={layout.surface.id === selected.surface.id}
                debug={debug}
                onSelect={() => setSelectedId(layout.surface.id)}
              />
            ))}
          </div>
        </div>

        <aside className="sidebar">
          <div className="section__head">
            <h2>Inspector</h2>
            <span className="muted">select any surface</span>
          </div>

          <Inspector layout={selected} spec={spec} debug={debug} />

          <Panel
            title="Live profile"
            aside={<span className="panel__aside">a 5th surface, defined live</span>}
          >
            <Field label="Width" hint={`${live.width}px`}>
              <input
                className="range"
                type="range"
                min={160}
                max={2560}
                step={8}
                value={live.width}
                onChange={(e) => setLive((c) => ({ ...c, width: Number(e.target.value) }))}
              />
            </Field>
            <Field label="Height" hint={`${live.height}px`}>
              <input
                className="range"
                type="range"
                min={160}
                max={1920}
                step={8}
                value={live.height}
                onChange={(e) => setLive((c) => ({ ...c, height: Number(e.target.value) }))}
              />
            </Field>

            <div className="editor__controls">
              <Field label="Tap target">
                <select
                  className="input"
                  value={live.minTapTarget ?? 0}
                  onChange={(e) => setLive((c) => ({ ...c, minTapTarget: Number(e.target.value) || null }))}
                >
                  <option value={0}>None</option>
                  <option value={44}>44px</option>
                  <option value={60}>60px</option>
                </select>
              </Field>
              <Field label="Min type">
                <select
                  className="input"
                  value={live.minTextSize ?? 0}
                  onChange={(e) => setLive((c) => ({ ...c, minTextSize: Number(e.target.value) || null }))}
                >
                  <option value={0}>None</option>
                  <option value={24}>24px</option>
                  <option value={32}>32px</option>
                  <option value={40}>40px</option>
                </select>
              </Field>
            </div>

            <div className="editor__controls">
              <Field label="Viewing distance">
                <select
                  className="input"
                  value={live.viewingDistance}
                  onChange={(e) =>
                    setLive((c) => ({ ...c, viewingDistance: e.target.value as LiveConstraints['viewingDistance'] }))
                  }
                >
                  <option value="near">Near</option>
                  <option value="far">Far</option>
                </select>
              </Field>
              <label className="check">
                <input
                  type="checkbox"
                  checked={live.touchOnly}
                  onChange={(e) => setLive((c) => ({ ...c, touchOnly: e.target.checked }))}
                />
                Touch only
              </label>
            </div>
          </Panel>

          <CreativeEditor spec={spec} onChange={updateElement} />
        </aside>
      </div>
    </div>
  )
}

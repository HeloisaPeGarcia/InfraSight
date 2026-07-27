import { useMemo, useState } from 'react'
import { TopologyCanvas } from '../components/TopologyCanvas'
import { PanelHeader, Tooltip } from '../components/ui'
import { api } from '../services/api'

export function Topology({
  edgeLabel,
  selectedResource,
  snapshot,
  targetResource,
  mode,
  plannedEdges,
  setEdgeLabel,
  setTargetResource,
  onAdd,
  onClear,
  onMode,
  onSelect,
  onUpdateResource,
}) {
  const [layout, setLayout] = useState('provider')
  const [showLabels, setShowLabels] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [positions, setPositions] = useState({})
  const [visualFilter, setVisualFilter] = useState('all')
  const [blastRadius, setBlastRadius] = useState(false)

  const impact = useMemo(() => {
    const incoming = snapshot.edges.filter((edge) => edge.to === selectedResource?.id)
    const outgoing = snapshot.edges.filter((edge) => edge.from === selectedResource?.id)
    const planned = plannedEdges.filter((edge) => edge.from === selectedResource?.id || edge.to === selectedResource?.id)
    return { incoming, outgoing, planned }
  }, [plannedEdges, selectedResource?.id, snapshot.edges])

  const providerCounts = useMemo(() => {
    return snapshot.resources.reduce((groups, resource) => {
      groups[resource.provider] = (groups[resource.provider] || 0) + 1
      return groups
    }, {})
  }, [snapshot.resources])

  function pan(x, y) {
    setOffset((current) => ({ x: current.x + x, y: current.y + y }))
  }

  function resetView() {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }

  function moveNode(id, point) {
    setPositions((current) => ({ ...current, [id]: point }))
  }

  function autoArrange(nextLayout) {
    setLayout(nextLayout)
    setPositions({})
  }

  function saveLayout() {
    api.saveTopologyLayout('default', { id: 'default', snapshot: 'local', positions }).catch(() => null)
  }

  function panCanvas(event) {
    if (event.target.closest?.('.resourceCardNode')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const start = { clientX: event.clientX, clientY: event.clientY, offsetX: offset.x, offsetY: offset.y }
    const target = event.currentTarget
    const move = (moveEvent) => setOffset({
      x: start.offsetX + moveEvent.clientX - start.clientX,
      y: start.offsetY + moveEvent.clientY - start.clientY,
    })
    const up = (upEvent) => {
      target.releasePointerCapture(upEvent.pointerId)
      target.removeEventListener('pointermove', move)
      target.removeEventListener('pointerup', up)
    }
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', up)
  }

  function wheelZoom(event) {
    event.preventDefault()
    setZoom((value) => Math.min(1.7, Math.max(0.6, value + (event.deltaY > 0 ? -0.06 : 0.06))))
  }

  function exportSvg() {
    const svg = document.querySelector('.topologyCanvas')
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'infrasight-topology.svg'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  function exportPng() {
    const svg = document.querySelector('.topologyCanvas')
    const data = new XMLSerializer().serializeToString(svg)
    const image = new Image()
    const url = URL.createObjectURL(new Blob([data], { type: 'image/svg+xml' }))
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 1600
      canvas.height = 1000
      const context = canvas.getContext('2d')
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const link = document.createElement('a')
      link.download = 'infrasight-topology.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
      URL.revokeObjectURL(url)
    }
    image.src = url
  }

  const highRiskIds = snapshot.findings?.filter((finding) => finding.severity === 'high').map((finding) => finding.resourceId) || []

  return (
    <div className="topologyWorkbench topologyWorkbenchInteractive">
      <section className="panel fullHeight topologyStage">
        <PanelHeader
          title="Topology Planner"
          meta={`${snapshot.resources.length} nodes / ${snapshot.edges.length} links`}
          tooltip="Use zoom, pan, labels and layouts to inspect dependencies before adding planned automation links."
        />

        <div className="topologyCommandBar">
          <div className="segmented compactSegmented">
            {['provider', 'radial'].map((item) => (
              <button className={layout === item ? 'active' : ''} key={item} type="button" onClick={() => autoArrange(item)}>
                {item}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setZoom((value) => Math.max(0.7, value - 0.1))}>-</button>
          <strong>{Math.round(zoom * 100)}%</strong>
          <button type="button" onClick={() => setZoom((value) => Math.min(1.5, value + 0.1))}>+</button>
          <button type="button" onClick={() => setShowLabels((value) => !value)}>{showLabels ? 'Hide labels' : 'Show labels'}</button>
          <button type="button" onClick={() => setBlastRadius((value) => !value)}>{blastRadius ? 'Blast on' : 'Blast off'}</button>
          <button type="button" onClick={resetView}>Reset</button>
          <button type="button" onClick={saveLayout}>Save layout</button>
          <button type="button" onClick={exportSvg}>Export SVG</button>
          <button type="button" onClick={exportPng}>Export PNG</button>
          <select value={visualFilter} onChange={(event) => setVisualFilter(event.target.value)}>
            <option value="all">all</option>
            <option value="prod">prod</option>
            <option value="AWS">AWS</option>
            <option value="GCP">GCP</option>
            <option value="Azure">Azure</option>
            <option value="critical">critical</option>
          </select>
        </div>

        <TopologyCanvas
          resources={snapshot.resources}
          edges={snapshot.edges}
          selectedResourceId={selectedResource?.id}
          targetResourceId={targetResource}
          onSelect={onSelect}
          layout={layout}
          zoom={zoom}
          offset={offset}
          showLabels={showLabels}
          showDraft={mode !== 'Explore'}
          positions={positions}
          onMove={moveNode}
          visualFilter={visualFilter}
          blastRadius={blastRadius}
          highRiskIds={highRiskIds}
          onCanvasPan={panCanvas}
          onWheelZoom={wheelZoom}
        />

        <div className="topologyFooter">
          <div className="providerLegend">
            {Object.entries(providerCounts).map(([provider, count]) => (
              <button key={provider} type="button" onClick={() => onSelect(snapshot.resources.find((resource) => resource.provider === provider)?.id)}>
                <span className={`legendDot legend${provider}`} />
                {provider}
                <strong>{count}</strong>
              </button>
            ))}
          </div>
          <div className="panPad" aria-label="Pan controls">
            <button type="button" onClick={() => pan(0, -28)}>Up</button>
            <button type="button" onClick={() => pan(-28, 0)}>Left</button>
            <button type="button" onClick={() => pan(28, 0)}>Right</button>
            <button type="button" onClick={() => pan(0, 28)}>Down</button>
          </div>
        </div>
      </section>

      <aside className="panel topologyTools">
        <PanelHeader title="Interaction Panel" meta={mode} tooltip="Switch modes, edit metadata, preview a link and add it to the local plan." />
        <div className="segmented">
          {['Explore', 'Plan', 'Remediate'].map((item) => (
            <button className={mode === item ? 'active' : ''} key={item} type="button" onClick={() => onMode(item)}>{item}</button>
          ))}
        </div>

        <div className="resourceDetails selectedResourceCard">
          <span className="miniEyebrow">{selectedResource?.provider} / {selectedResource?.environment || 'unknown'}</span>
          <h3>{selectedResource?.name}</h3>
          <p className="resourceSummary">{selectedResource?.type} in {selectedResource?.region}</p>
          <dl>
            <div><dt>Owner <Tooltip label="Local ownership metadata used by governance scoring.">?</Tooltip></dt><dd><input value={selectedResource?.owner || ''} onChange={(event) => onUpdateResource('owner', event.target.value)} /></dd></div>
            <div><dt>Criticality</dt><dd><select value={selectedResource?.criticality || 'medium'} onChange={(event) => onUpdateResource('criticality', event.target.value)}><option>low</option><option>medium</option><option>high</option></select></dd></div>
            <div><dt>Monthly cost</dt><dd>${selectedResource?.monthlyCost || 0}</dd></div>
            <div><dt>Status</dt><dd>{selectedResource?.status}</dd></div>
          </dl>
        </div>

        <div className="impactGrid">
          <ImpactCard label="Incoming" value={impact.incoming.length} />
          <ImpactCard label="Outgoing" value={impact.outgoing.length} />
          <ImpactCard label="Planned" value={impact.planned.length} />
        </div>

        <div className="formStack">
          <label>Target resource<select value={targetResource} onChange={(event) => setTargetResource(event.target.value)}>{snapshot.resources.map((resource) => <option key={resource.id} value={resource.id}>{resource.name}</option>)}</select></label>
          <label>Automation link<input value={edgeLabel} onChange={(event) => setEdgeLabel(event.target.value)} /></label>
          <button className="primary fullWidth" type="button" onClick={onAdd}>Add planned link</button>
          <button className="fullWidth" type="button" onClick={onClear}>Clear plan ({plannedEdges.length})</button>
        </div>

        <div className="plannedList">
          <strong>Planned links</strong>
          {plannedEdges.length === 0 && <small>No planned links yet.</small>}
          {plannedEdges.map((edge) => (
            <div key={`${edge.from}-${edge.to}-${edge.label}`}>
              <span>{nameFor(snapshot.resources, edge.from)}</span>
              <em>{edge.label}</em>
              <span>{nameFor(snapshot.resources, edge.to)}</span>
            </div>
          ))}
        </div>

        <div className="connectionList">
          <strong>Connections for {selectedResource?.name}</strong>
          {[...impact.outgoing, ...impact.incoming].length === 0 && <small>No direct connections.</small>}
          {impact.outgoing.map((edge) => (
            <button key={`out-${edge.from}-${edge.to}`} type="button" onClick={() => onSelect(edge.to)}>
              <span>outgoing</span>
              {edge.label} {'->'} {nameFor(snapshot.resources, edge.to)}
            </button>
          ))}
          {impact.incoming.map((edge) => (
            <button key={`in-${edge.from}-${edge.to}`} type="button" onClick={() => onSelect(edge.from)}>
              <span>incoming</span>
              {nameFor(snapshot.resources, edge.from)} {'->'} {edge.label}
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}

function ImpactCard({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function nameFor(resources, id) {
  return resources.find((resource) => resource.id === id)?.name || id
}

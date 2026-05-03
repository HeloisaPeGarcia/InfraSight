import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { ActionModal } from './components/ActionModal'
import { DetailsDrawer } from './components/DetailsDrawer'
import { Toasts, Tooltip } from './components/ui'
import { fallbackSnapshot } from './data/fallbackSnapshot'
import { Automation } from './views/Automation'
import { Governance } from './views/Governance'
import { Inventory } from './views/Inventory'
import { Overview } from './views/Overview'
import { Observability } from './views/Observability'
import { Drift } from './views/Drift'
import { ResourceDetail } from './views/ResourceDetail'
import { Topology } from './views/Topology'
import { buildInsights, exportSnapshot, filterResources, providers } from './utils/insights'
import { buildObservabilitySignals, buildPipelines, remediationFor } from './utils/devops'

const navItems = ['Overview', 'Topology', 'Inventory', 'Observability', 'Drift', 'Governance', 'Automation', 'Resource']

function App() {
  const [snapshot, setSnapshot] = useState(fallbackSnapshot)
  const [source, setSource] = useState('Local mock')
  const [activeView, setActiveView] = useState('Overview')
  const [selectedResourceId, setSelectedResourceId] = useState('aws_instance.api')
  const [topologyMode, setTopologyMode] = useState('Explore')
  const [plannedEdges, setPlannedEdges] = useState([])
  const [targetResource, setTargetResource] = useState('')
  const [edgeLabel, setEdgeLabel] = useState('auto-remediate')
  const [actions, setActions] = useState([])
  const [observability, setObservability] = useState([])
  const [plans, setPlans] = useState([])
  const [runbooks, setRunbooks] = useState([])
  const [scorecard, setScorecard] = useState({})
  const [modalAction, setModalAction] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [theme, setTheme] = useState('light')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [toasts, setToasts] = useState([])
  const [builder, setBuilder] = useState({
    trigger: 'pull_request',
    validate: 'terraform_plan_and_policy',
    approval: 'devops_lead',
    actionId: '',
  })
  const [filters, setFilters] = useState({ query: '', provider: 'All', status: 'All', environment: 'All' })

  useEffect(() => {
    loadJson('/api/snapshot', fallbackSnapshot).then((payload) => {
      setSnapshot(payload)
      setSource(payload === fallbackSnapshot ? 'Browser fallback' : 'Backend API')
      setSelectedResourceId(payload.resources[0]?.id || '')
      setTargetResource(payload.resources[1]?.id || payload.resources[0]?.id || '')
    })
    loadJson('/api/actions', []).then((payload) => {
      setActions(payload)
      setBuilder((current) => ({ ...current, actionId: payload[0]?.id || '' }))
    })
    loadJson('/api/observability', []).then(setObservability)
    loadJson('/api/plans', []).then(setPlans)
    loadJson('/api/runbooks', []).then(setRunbooks)
    loadJson('/api/score', {}).then(setScorecard)
  }, [])

  const workingSnapshot = useMemo(() => ({ ...snapshot, edges: [...snapshot.edges, ...plannedEdges] }), [plannedEdges, snapshot])
  const insights = useMemo(() => buildInsights(snapshot), [snapshot])
  const localObservability = observability.length ? observability : buildObservabilitySignals(snapshot.resources)
  const localPipelines = plans.length ? plans : buildPipelines(snapshot)
  const selectedResource = snapshot.resources.find((resource) => resource.id === selectedResourceId) || snapshot.resources[0]
  const selectedAction = actions.find((action) => action.resourceId === selectedResource?.id) || remediationFor(selectedResource, null)[0]
  const filteredResources = useMemo(() => filterResources(snapshot.resources, filters), [filters, snapshot.resources])
  const statuses = ['All', ...new Set(snapshot.resources.map((resource) => resource.status))]
  const environments = ['All', ...new Set(snapshot.resources.map((resource) => resource.environment || 'unknown'))]
  const commands = ['INFRA_STATE_FILE=terraform.tfstate infrasight', 'curl http://localhost:8080/api/actions', 'curl http://localhost:8080/api/report.md']

  function toast(message) {
    const id = Date.now()
    setToasts((current) => [...current, { id, message }])
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 2800)
  }

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function updateSelectedResource(key, value) {
    setSnapshot((current) => ({
      ...current,
      resources: current.resources.map((resource) => resource.id === selectedResource?.id ? { ...resource, [key]: value } : resource),
    }))
    toast('Resource metadata updated locally')
  }

  function addPlannedEdge() {
    if (!selectedResource || !targetResource || selectedResource.id === targetResource) return
    setPlannedEdges((current) => [...current, { from: selectedResource.id, to: targetResource, label: edgeLabel, planned: true }])
    toast('Planned topology link added')
  }

  function handleImport(event) {
    const file = event.target.files?.[0]
    if (!file) return
    file.text().then((content) => {
      const payload = JSON.parse(content)
      setSnapshot({ generatedAt: payload.generatedAt || new Date().toISOString(), resources: payload.resources || [], edges: payload.edges || [], findings: payload.findings || [] })
      setSource(file.name)
      setSelectedResourceId(payload.resources?.[0]?.id || '')
      setPlannedEdges([])
      toast('Snapshot imported and validated locally')
    })
  }

  function savePlan() {
    const plan = { ...builder, id: `plan-${Date.now()}`, name: `Pipeline ${builder.trigger}`, state: 'suggested', createdAt: new Date().toISOString() }
    fetch('/api/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plan) }).catch(() => null)
    setPlans((current) => [plan, ...current])
    toast('Pipeline plan saved')
  }

  function updateActionState(action, state) {
    const next = { ...action, state }
    fetch(`/api/actions/${action.id}/state`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }) }).catch(() => null)
    setActions((current) => current.map((item) => item.id === action.id ? next : item))
    setModalAction(next)
    toast(`Action moved to ${state}`)
  }

  function exportReport() {
    window.open('/api/report.md', '_blank')
    toast('Markdown report opened')
  }

  return (
    <div className={`appFrame theme-${theme}`}>
      <aside className="sidebar">
        <div className="brandMark"><span>IS</span><div><strong>InfraSight</strong><small>DevOps automation center</small></div></div>
        <nav aria-label="Main navigation">{navItems.map((item) => <button className={activeView === item ? 'active' : ''} key={item} type="button" onClick={() => setActiveView(item)}><span>{item.slice(0, 2)}</span>{item}</button>)}</nav>
        <div className="sourcePanel"><small>State source</small><strong>{source}</strong><label className="fileButton">Import JSON<input accept="application/json,.json,.tfstate" type="file" onChange={handleImport} /></label></div>
      </aside>
      <main className="content">
        <header className="topbar">
          <div><p className="eyebrow">DevOps local-first command center</p><h1>{activeView}</h1></div>
          <div className="headerActions">
            <Tooltip label="Open command palette."><button type="button" onClick={() => setPaletteOpen(true)}>Commands</button></Tooltip>
            <Tooltip label="Toggle light/dark theme."><button type="button" onClick={() => setTheme((value) => value === 'light' ? 'dark' : 'light')}>{theme}</button></Tooltip>
            <Tooltip label="Download the current normalized snapshot as JSON."><button type="button" onClick={() => { exportSnapshot(snapshot); toast('Snapshot exported') }}>Export snapshot</button></Tooltip>
            <Tooltip label="Open details, dry-run impact, and selected resource metadata."><button type="button" onClick={() => setDrawerOpen(true)}>Resource drawer</button></Tooltip>
            <Tooltip label="Go to the topology planner with provider grouping."><button className="primary" type="button" onClick={() => setActiveView('Topology')}>Open topology</button></Tooltip>
          </div>
        </header>
        <section className="controlStrip" aria-label="Workspace filters">
          <input aria-label="Search resources" placeholder="Search name, owner, region, type" type="search" value={filters.query} onChange={(event) => updateFilter('query', event.target.value)} />
          <select aria-label="Provider" value={filters.provider} onChange={(event) => updateFilter('provider', event.target.value)}>{providers.map((provider) => <option key={provider}>{provider}</option>)}</select>
          <select aria-label="Status" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select>
          <select aria-label="Environment" value={filters.environment} onChange={(event) => updateFilter('environment', event.target.value)}>{environments.map((environment) => <option key={environment}>{environment}</option>)}</select>
        </section>
        {activeView === 'Overview' && <Overview insights={insights} observability={localObservability} pipelines={localPipelines} selectedResource={selectedResource} snapshot={workingSnapshot} onSelect={setSelectedResourceId} />}
        {activeView === 'Topology' && <Topology edgeLabel={edgeLabel} selectedResource={selectedResource} snapshot={workingSnapshot} targetResource={targetResource} mode={topologyMode} plannedEdges={plannedEdges} setEdgeLabel={setEdgeLabel} setTargetResource={setTargetResource} onAdd={addPlannedEdge} onClear={() => setPlannedEdges([])} onMode={setTopologyMode} onSelect={setSelectedResourceId} onUpdateResource={updateSelectedResource} />}
        {activeView === 'Inventory' && <Inventory resources={filteredResources} onSelect={(id) => { setSelectedResourceId(id); setDrawerOpen(true) }} />}
        {activeView === 'Observability' && <Observability signals={localObservability} onSelect={(id) => { setSelectedResourceId(id); setActiveView('Resource') }} />}
        {activeView === 'Drift' && <Drift />}
        {activeView === 'Governance' && <Governance insights={insights} scorecard={scorecard} actions={actions} onOpenAction={setModalAction} onSelect={setSelectedResourceId} />}
        {activeView === 'Automation' && <Automation actions={actions} builder={builder} commands={commands} pipelines={localPipelines} runbooks={runbooks} setBuilder={setBuilder} onCreatePlan={savePlan} onOpenAction={setModalAction} onReport={exportReport} />}
        {activeView === 'Resource' && <ResourceDetail resource={selectedResource} action={selectedAction} signals={localObservability} />}
      </main>
      {drawerOpen && <DetailsDrawer action={selectedAction} resource={selectedResource} onClose={() => setDrawerOpen(false)} />}
      <ActionModal action={modalAction} onClose={() => setModalAction(null)} onState={updateActionState} />
      <Toasts toasts={toasts} />
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} onGo={(view) => { setActiveView(view); setPaletteOpen(false) }} />}
    </div>
  )
}

function loadJson(url, fallback) {
  return fetch(url).then((response) => response.ok ? response.json() : fallback).catch(() => fallback)
}

export default App

function CommandPalette({ onClose, onGo }) {
  return (
    <div className="modalBackdrop">
      <section className="commandPalette">
        <input autoFocus placeholder="Jump to a workspace..." />
        {navItems.map((item) => <button key={item} type="button" onClick={() => onGo(item)}>{item}</button>)}
        <button type="button" onClick={onClose}>Close</button>
      </section>
    </div>
  )
}

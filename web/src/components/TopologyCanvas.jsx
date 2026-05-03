import { providerClass } from '../utils/insights'

const card = { width: 172, height: 82 }

export function TopologyCanvas({
  resources,
  edges,
  selectedResourceId,
  targetResourceId,
  onSelect,
  compact = false,
  layout = 'provider',
  zoom = 1,
  offset = { x: 0, y: 0 },
  showLabels = true,
  showDraft = false,
  positions = {},
  onMove,
  visualFilter = 'all',
  blastRadius = false,
  highRiskIds = [],
  onCanvasPan,
  onWheelZoom,
}) {
  const groups = {
    AWS: { x: 140, y: compact ? 82 : 96, width: 220, height: compact ? 318 : 500 },
    GCP: { x: 395, y: compact ? 82 : 96, width: 220, height: compact ? 318 : 500 },
    Azure: { x: 650, y: compact ? 82 : 96, width: 220, height: compact ? 318 : 500 },
    Other: { x: 905, y: compact ? 82 : 96, width: 220, height: compact ? 318 : 500 },
  }
  const visibleProviders = new Set(resources.map((resource) => resource.provider || 'Other'))
  const positioned = layout === 'radial'
    ? radialPositions(resources, compact)
    : providerPositions(resources, groups, compact)
  const withSavedPositions = positioned.map((resource) => positions[resource.id] ? { ...resource, ...positions[resource.id] } : resource)
  const byId = new Map(withSavedPositions.map((resource) => [resource.id, resource]))
  const selected = byId.get(selectedResourceId)
  const target = byId.get(targetResourceId)
  const related = relatedIds(edges, selectedResourceId)

  return (
    <div className="topologyViewport">
      <svg className="topologyCanvas" viewBox={`0 0 1040 ${compact ? 460 : 700}`} onWheel={(event) => onWheelZoom?.(event)}>
        <defs>
          <marker id="topologyArrow" markerHeight="10" markerWidth="10" orient="auto" refX="9" refY="3">
            <path d="M0,0 L0,6 L9,3 z" />
          </marker>
          <marker id="topologyArrowPlanned" markerHeight="10" markerWidth="10" orient="auto" refX="9" refY="3">
            <path d="M0,0 L0,6 L9,3 z" />
          </marker>
        </defs>
        <rect
          className="canvasHitArea"
          height={compact ? 460 : 700}
          width="1040"
          onPointerDown={(event) => onCanvasPan?.(event)}
          onWheel={(event) => onWheelZoom?.(event)}
        />
        <g transform={`translate(${offset.x} ${offset.y}) scale(${zoom})`}>
          {layout === 'provider' && Object.entries(groups).filter(([provider]) => visibleProviders.has(provider)).map(([provider, group]) => (
            <g className="providerGroup" key={provider}>
              <rect x={group.x - group.width / 2} y={group.y} width={group.width} height={group.height} rx="8" />
              <text x={group.x} y={group.y + 28}>{provider}</text>
            </g>
          ))}

          {edges.map((edge) => {
            const from = byId.get(edge.from)
            const to = byId.get(edge.to)
            if (!from || !to) return null

            const route = connectionPath(from, to)
            return (
              <g className={`topologyEdge ${edge.planned ? 'planned' : ''}`} key={`${edge.from}-${edge.to}-${edge.label}`}>
                <path d={route.path} />
                {!compact && showLabels && (
                  <g className="edgeLabel" transform={`translate(${route.midX} ${route.midY})`}>
                    <rect x="-58" y="-14" width="116" height="24" rx="12" />
                    <text y="3">{shortLabel(edge.label)}</text>
                  </g>
                )}
              </g>
            )
          })}

          {showDraft && selected && target && selected.id !== target.id && (
            <g className="draftLink">
              <path d={connectionPath(selected, target).path} />
              {showLabels && (
                <g className="edgeLabel" transform={`translate(${connectionPath(selected, target).midX} ${connectionPath(selected, target).midY - 10})`}>
                  <rect x="-48" y="-14" width="96" height="24" rx="12" />
                  <text y="3">preview</text>
                </g>
              )}
            </g>
          )}

          {withSavedPositions.map((resource) => {
            const dimmed = shouldDim(resource, selectedResourceId, related, visualFilter, blastRadius)
            const hidden = !matchesFilter(resource, visualFilter)
            if (hidden) return null
            return (
            <g
              className={`resourceCardNode ${providerClass[resource.provider] || 'providerOther'} ${selectedResourceId === resource.id ? 'selected' : ''} ${targetResourceId === resource.id ? 'target' : ''} ${highRiskIds.includes(resource.id) ? 'riskHigh' : ''} ${dimmed ? 'dimmed' : ''}`}
              key={resource.id}
              onClick={() => onSelect(resource.id)}
              onPointerDown={(event) => startDrag(event, resource, zoom, onMove)}
              transform={`translate(${resource.x - card.width / 2} ${resource.y - card.height / 2})`}
            >
              <rect className="nodeCard" width={card.width} height={card.height} rx="8" />
              <rect className="nodeAccent" width="6" height={card.height} rx="3" />
              <text className="nodeProvider" x="18" y="19">{resource.provider}</text>
              <text className="nodeName" x="18" y="40">{fitText(resource.name, 18)}</text>
              <text className="nodeType" x="18" y="58">{fitText(cleanType(resource.type), 22)}</text>
              <text className="nodeMeta" x="18" y="74">{resource.owner || 'unassigned'} - ${resource.monthlyCost || 0}</text>
            </g>
          )})}
        </g>
      </svg>
    </div>
  )
}

function startDrag(event, resource, zoom, onMove) {
  if (!onMove) return
  event.stopPropagation()
  event.currentTarget.setPointerCapture(event.pointerId)
  const start = { x: event.clientX, y: event.clientY, resourceX: resource.x, resourceY: resource.y }
  const target = event.currentTarget

  function move(moveEvent) {
    const dx = (moveEvent.clientX - start.x) / zoom
    const dy = (moveEvent.clientY - start.y) / zoom
    onMove(resource.id, { x: start.resourceX + dx, y: start.resourceY + dy })
  }

  function up(upEvent) {
    target.releasePointerCapture(upEvent.pointerId)
    target.removeEventListener('pointermove', move)
    target.removeEventListener('pointerup', up)
  }

  target.addEventListener('pointermove', move)
  target.addEventListener('pointerup', up)
}

function relatedIds(edges, selectedId) {
  const ids = new Set([selectedId])
  edges.forEach((edge) => {
    if (edge.from === selectedId) ids.add(edge.to)
    if (edge.to === selectedId) ids.add(edge.from)
  })
  return ids
}

function shouldDim(resource, selectedId, related, visualFilter, blastRadius) {
  if (!matchesFilter(resource, visualFilter)) return true
  if (!blastRadius || !selectedId) return false
  return !related.has(resource.id)
}

function matchesFilter(resource, visualFilter) {
  if (visualFilter === 'all') return true
  if (visualFilter === 'prod') return resource.environment === 'prod'
  if (visualFilter === 'critical') return resource.criticality === 'high'
  return resource.provider === visualFilter
}

function providerPositions(resources, groups, compact) {
  const counters = {}
  const gapY = compact ? 90 : 98

  return resources.map((resource) => {
    const group = groups[resource.provider] || groups.Other
    const index = counters[resource.provider] || 0
    counters[resource.provider] = index + 1
    return {
      ...resource,
      x: group.x,
      y: group.y + 78 + index * gapY,
    }
  })
}

function radialPositions(resources, compact) {
  return resources.map((resource, index) => {
    const angle = (index / Math.max(resources.length, 1)) * Math.PI * 2 - Math.PI / 2
    const radiusX = compact ? 330 : 380
    const radiusY = compact ? 145 : 230
    return {
      ...resource,
      x: 520 + Math.cos(angle) * radiusX,
      y: (compact ? 225 : 350) + Math.sin(angle) * radiusY,
    }
  })
}

function connectionPath(from, to) {
  const fromPoint = anchorPoint(from, to)
  const toPoint = anchorPoint(to, from)
  const dx = Math.abs(toPoint.x - fromPoint.x)
  const curve = Math.max(42, dx * 0.42)
  const c1x = fromPoint.x + (toPoint.x > fromPoint.x ? curve : -curve)
  const c2x = toPoint.x - (toPoint.x > fromPoint.x ? curve : -curve)
  const midX = (fromPoint.x + toPoint.x) / 2
  const midY = (fromPoint.y + toPoint.y) / 2

  return {
    path: `M ${fromPoint.x} ${fromPoint.y} C ${c1x} ${fromPoint.y}, ${c2x} ${toPoint.y}, ${toPoint.x} ${toPoint.y}`,
    midX,
    midY,
  }
}

function anchorPoint(source, target) {
  const horizontal = Math.abs(target.x - source.x) > Math.abs(target.y - source.y)
  if (horizontal) {
    return {
      x: source.x + (target.x > source.x ? card.width / 2 : -card.width / 2),
      y: source.y,
    }
  }
  return {
    x: source.x,
    y: source.y + (target.y > source.y ? card.height / 2 : -card.height / 2),
  }
}

function cleanType(type) {
  return type.replace(/^(aws|google|azurerm)_/, '')
}

function fitText(value, length) {
  if (!value) return ''
  return value.length > length ? `${value.slice(0, length - 1)}...` : value
}

function shortLabel(value) {
  return fitText(value || 'depends', 16)
}

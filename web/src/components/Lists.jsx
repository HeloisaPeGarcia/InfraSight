export function SpendBars({ data, total }) {
  return (
    <div className="spendBars">
      {Object.entries(data).map(([label, value]) => (
        <div className="spendBar" key={label}>
          <div><strong>{label}</strong><span>${value}</span></div>
          <div className="barTrack">
            <span style={{ width: `${Math.round((value / Math.max(total, 1)) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function PipelineList({ pipelines }) {
  return (
    <div className="pipelineList">
      {pipelines.map((pipeline) => (
        <div className={`pipelineItem pipeline-${pipeline.status || pipeline.state || 'suggested'}`} key={pipeline.id || pipeline.name}>
          <div><span>{pipeline.stage || pipeline.validate}</span><strong>{pipeline.name}</strong><small>{pipeline.trigger}</small></div>
          <em>{pipeline.status || pipeline.state}</em>
          <code>{pipeline.command || `${pipeline.validate} -> ${pipeline.approval}`}</code>
        </div>
      ))}
    </div>
  )
}

export function ObservabilityList({ signals, onSelect }) {
  return (
    <div className="observabilityList">
      {signals.map((signal) => {
        const cpu = signal.metrics?.find((metric) => metric.name === 'cpu')
        const cost = signal.metrics?.find((metric) => metric.name === 'monthly_cost')
        return (
          <button key={signal.resourceId} type="button" onClick={() => onSelect(signal.resourceId)}>
            <span>{signal.connector}</span>
            <strong>{signal.resourceId}</strong>
            <small>CPU {cpu?.value}% - cost ${cost?.value} - SLO {Number(signal.slo?.current || 0).toFixed(2)}%</small>
          </button>
        )
      })}
    </div>
  )
}

export function RemediationList({ actions, onOpen }) {
  return (
    <div className="remediationList">
      {actions.map((action) => (
        <article key={action.id}>
          <div>
            <span className={`stateBadge ${action.state}`}>{action.state}</span>
            <strong>{action.title}</strong>
            <small>{action.type} - {action.scenario}</small>
          </div>
          <button type="button" onClick={() => onOpen(action)}>Review dry-run</button>
          <code>{action.githubActions}</code>
        </article>
      ))}
    </div>
  )
}

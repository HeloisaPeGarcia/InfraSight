import { PanelHeader, ProviderPill } from '../components/ui'

export function ResourceDetail({ resource, action, signals }) {
  if (!resource) {
    return <section className="panel emptyState"><PanelHeader title="Resource Detail" meta="No resource selected" /></section>
  }
  const signal = signals.find((item) => item.resourceId === resource.id)

  return (
    <div className="resourcePage">
      <section className="panel">
        <PanelHeader title={resource.name} meta={resource.id} />
        <ProviderPill provider={resource.provider} />
        <dl className="detailGrid">
          {Object.entries(resource).filter(([, value]) => typeof value !== 'object').map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}
        </dl>
      </section>
      <section className="panel">
        <PanelHeader title="Correlated Observability" meta={signal?.connector || 'mock'} />
        <div className="metricChartRow">{(signal?.metrics || []).map((metric) => <div className="miniChart" key={metric.name}><span>{metric.name}</span><strong>{metric.value}{metric.unit}</strong><div><i style={{ width: `${Math.min(100, metric.value)}%` }} /></div></div>)}</div>
      </section>
      <section className="panel">
        <PanelHeader title="Recommended Action" meta={action?.state || 'suggested'} />
        <p>{action?.summary}</p>
        <code>{action?.terraform}</code>
      </section>
    </div>
  )
}

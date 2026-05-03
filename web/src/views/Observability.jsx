import { PanelHeader } from '../components/ui'

export function Observability({ signals, onSelect }) {
  return (
    <div className="observabilityGrid">
      {signals.map((signal) => (
        <section className="panel" key={signal.resourceId}>
          <PanelHeader title={signal.resourceId} meta={signal.connector} />
          <div className="metricChartRow">
            {signal.metrics.map((metric) => (
              <div className="miniChart" key={metric.name}>
                <span>{metric.name}</span>
                <strong>{metric.value}{metric.unit}</strong>
                <div><i style={{ width: `${Math.min(100, metric.value)}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="signalLists">
            <article><strong>Alarms</strong>{signal.alarms.map((alarm) => <button key={alarm.name} onClick={() => onSelect(signal.resourceId)}>{alarm.severity} - {alarm.condition}</button>)}</article>
            <article><strong>Incidents</strong>{signal.incidents.map((incident) => <button key={incident.id} onClick={() => onSelect(signal.resourceId)}>{incident.status} - {incident.title}</button>)}</article>
            <article><strong>Logs</strong>{signal.logs.map((log) => <small key={log.message}>{log.level}: {log.message}</small>)}</article>
          </div>
        </section>
      ))}
    </div>
  )
}

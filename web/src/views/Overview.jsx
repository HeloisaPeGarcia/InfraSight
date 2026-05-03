import { Metric, PanelHeader } from '../components/ui'
import { ObservabilityList, PipelineList, SpendBars } from '../components/Lists'
import { TopologyCanvas } from '../components/TopologyCanvas'

export function Overview({ insights, observability, pipelines, selectedResource, snapshot, onSelect }) {
  return (
    <div className="viewGrid">
      <section className="metricGrid">
        <Metric label="Resources" value={snapshot.resources.length} helper="Tracked locally" tone="blue" />
        <Metric label="Monthly cost" value={`$${insights.totalCost}`} helper="Mock estimate" tone="amber" />
        <Metric label="Health score" value={`${insights.score}%`} helper="Policy weighted" tone="green" />
        <Metric label="Running" value={insights.running} helper="Active compute" tone="slate" />
      </section>
      <section className="panel topologyPreview">
        <PanelHeader title="Provider Topology" meta={`${snapshot.edges.length} links`} tooltip="Click a node to open its resource context and related actions." />
        <TopologyCanvas resources={snapshot.resources} edges={snapshot.edges} selectedResourceId={selectedResource?.id} onSelect={onSelect} compact />
      </section>
      <section className="panel">
        <PanelHeader title="CloudWatch / Monitor" meta="Mock connectors" tooltip="Local mock telemetry for CPU, cost, traffic, alarms, incidents, and SLOs." />
        <ObservabilityList signals={observability} onSelect={onSelect} />
      </section>
      <section className="panel">
        <PanelHeader title="Provider Spend" meta="Monthly" tooltip="Estimated locally from the hardcoded pricing dictionary." />
        <SpendBars data={insights.providerSpend} total={insights.totalCost} />
      </section>
      <section className="panel wide">
        <PanelHeader title="Pipeline Readiness" meta="DevOps flow" tooltip="Suggested pipeline states based on findings and saved plans." />
        <PipelineList pipelines={pipelines} />
      </section>
    </div>
  )
}

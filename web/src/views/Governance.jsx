import { PanelHeader } from '../components/ui'
import { RemediationList, SpendBars } from '../components/Lists'

export function Governance({ insights, scorecard, actions, onOpenAction, onSelect }) {
  return (
    <div className="governanceGrid">
      <section className="panel">
        <PanelHeader title="Score by Category" meta="CIS / FinOps / Well-Architected" tooltip="Each score is calculated locally from findings, ownership, cost, and reliability signals." />
        <div className="scoreGrid">
          {Object.entries(scorecard).map(([key, value]) => <div key={key}><span>{key}</span><strong>{value}</strong></div>)}
        </div>
      </section>
      <section className="panel">
        <PanelHeader title="Risk Findings" meta={`${insights.findings.length} open`} tooltip="Click a finding to select the affected resource." />
        <div className="findingList">
          {insights.findings.map((finding) => (
            <button key={finding.id} type="button" onClick={() => onSelect(finding.resourceId)}>
              <span className={`severity ${finding.severity}`}>{finding.severity}</span>
              <strong>{finding.title}</strong>
              <small>{finding.detail}</small>
            </button>
          ))}
        </div>
      </section>
      <section className="panel">
        <PanelHeader title="Environment Spend" meta="Allocation" tooltip="Estimated cost grouped by local environment metadata." />
        <SpendBars data={insights.environmentSpend} total={insights.totalCost} />
      </section>
      <section className="panel wide">
        <PanelHeader title="Correction Actions" meta="Approval-first" tooltip="Review dry-run plans before moving actions through approval states." />
        <RemediationList actions={actions} onOpen={onOpenAction} />
      </section>
    </div>
  )
}

import { PanelHeader, Tooltip } from '../components/ui'
import { PipelineList, RemediationList } from '../components/Lists'

export function Automation({ actions, builder, commands, pipelines, runbooks, setBuilder, onCreatePlan, onOpenAction, onReport }) {
  return (
    <section className="panel automationPanel">
      <PanelHeader title="Local Automation Toolkit" meta="Pipeline builder + runbooks" tooltip="Build an approval-first remediation pipeline without executing cloud changes." />
      <div className="builderGrid">
        {['trigger', 'validate', 'approval', 'actionId'].map((field) => (
          <label key={field}>
            <span>{field} <Tooltip label={tooltipFor(field)}>?</Tooltip></span>
            <select value={builder[field]} onChange={(event) => setBuilder((current) => ({ ...current, [field]: event.target.value }))}>
              {optionsFor(field, actions).map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        ))}
        <button className="primary fullWidth" type="button" onClick={onCreatePlan}>Save pipeline plan</button>
        <button className="fullWidth" type="button" onClick={onReport}>Export Markdown report</button>
      </div>
      <PanelHeader title="Saved / Suggested Pipelines" meta={`${pipelines.length} plans`} tooltip="Plans are stored locally and can be promoted through action states." />
      <PipelineList pipelines={pipelines} />
      <PanelHeader title="Runbook Catalog" meta={`${runbooks.length} scenarios`} tooltip="Scenario-oriented remediation playbooks for DevOps review." />
      <div className="runbookGrid">
        {runbooks.map((runbook) => (
          <article key={runbook.id}>
            <strong>{runbook.title}</strong>
            <small>{runbook.provider} - {runbook.scenario}</small>
            <ol>{runbook.steps.map((step) => <li key={step}>{step}</li>)}</ol>
          </article>
        ))}
      </div>
      <PanelHeader title="Action Catalog" meta={`${actions.length} actions`} tooltip="Open an action to review dry-run changes and move it across lifecycle states." />
      <RemediationList actions={actions} onOpen={onOpenAction} />
      <div className="commandGrid">{commands.map((command) => <code key={command}>{command}</code>)}</div>
    </section>
  )
}

function optionsFor(field, actions) {
  if (field === 'trigger') return ['pull_request', 'state_import', 'schedule', 'manual']
  if (field === 'validate') return ['terraform_plan_and_policy', 'cost_guardrail', 'security_scan', 'drift_check']
  if (field === 'approval') return ['devops_lead', 'security_owner', 'finops_owner', 'two_person_review']
  return actions.map((action) => action.id)
}

function tooltipFor(field) {
  if (field === 'trigger') return 'Defines when this pipeline starts.'
  if (field === 'validate') return 'Validation gate before approval.'
  if (field === 'approval') return 'Human approval owner for the runbook.'
  return 'Remediation action attached to this plan.'
}

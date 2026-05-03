import { useState } from 'react'

const tabs = ['Dry Run', 'Terraform', 'CLI', 'CI/CD', 'Rollback']
const checklist = ['Reviewed blast radius', 'Approved by DevOps', 'Approved by Security', 'Approved by FinOps', 'Rollback plan attached']

export function ActionModal({ action, onClose, onState }) {
  const [tab, setTab] = useState('Dry Run')
  const [checked, setChecked] = useState({})

  if (!action) {
    return null
  }

  const ready = checklist.every((item) => checked[item])

  return (
    <div className="modalBackdrop">
      <section className="modal">
        <div className="panelHeader">
          <h2>{action.title}</h2>
          <span>{action.state}</span>
        </div>
        <p>{action.summary}</p>
        <div className="statusTimeline">
          {['suggested', 'approved', 'queued', 'executed', 'verified'].map((state) => (
            <button className={action.state === state ? 'active' : ''} key={state} type="button" onClick={() => onState(action, state)}>{state}</button>
          ))}
        </div>
        <div className="modalTabs">
          {tabs.map((item) => <button className={tab === item ? 'active' : ''} key={item} type="button" onClick={() => setTab(item)}>{item}</button>)}
        </div>
        {tab === 'Dry Run' && (
          <div className="dryRunPanel">
            <strong>{action.dryRun?.summary}</strong>
            <ul>{(action.dryRun?.changes || []).map((change) => <li key={change}>{change}</li>)}</ul>
            <div className="executionChecklist">
              {checklist.map((item) => (
                <label key={item}><input type="checkbox" checked={Boolean(checked[item])} onChange={(event) => setChecked((current) => ({ ...current, [item]: event.target.checked }))} />{item}</label>
              ))}
            </div>
          </div>
        )}
        {tab === 'Terraform' && <code>{action.terraform}</code>}
        {tab === 'CLI' && <code>{action.cli}</code>}
        {tab === 'CI/CD' && <><code>{action.githubActions}</code><code>{action.gitlabCi}</code></>}
        {tab === 'Rollback' && <code>{`# Rollback plan\n# 1. Disable generated guardrail for ${action.resourceId}\n# 2. Revert Terraform change\n# 3. Re-run validation and close incident`}</code>}
        <div className="modalActions">
          <button disabled={!ready} type="button" onClick={() => onState(action, 'executed')}>Mark executed</button>
          <button type="button" onClick={() => onState(action, 'failed')}>Mark failed</button>
        </div>
        <button className="fullWidth" type="button" onClick={onClose}>Close</button>
      </section>
    </div>
  )
}

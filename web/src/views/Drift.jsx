import { useEffect, useState } from 'react'
import { PanelHeader } from '../components/ui'
import { api } from '../services/api'

export function Drift() {
  const [drift, setDrift] = useState(null)

  useEffect(() => {
    api.getDrift().then(setDrift).catch(() => setDrift({
      summary: 'Mock drift unavailable',
      added: [],
      changed: [],
      removed: [],
      terraformPlan: 'terraform plan -detailed-exitcode',
    }))
  }, [])

  if (!drift) {
    return <section className="panel skeletonPanel"><PanelHeader title="Drift Detection" meta="Loading" /></section>
  }

  return (
    <div className="driftGrid">
      <section className="panel">
        <PanelHeader title="Drift Detection" meta={drift.summary} />
        <div className="driftColumns">
          <DriftList title="Added" items={drift.added} />
          <DriftList title="Changed" items={drift.changed} />
          <DriftList title="Removed" items={drift.removed} />
        </div>
      </section>
      <section className="panel">
        <PanelHeader title="Terraform Plan Simulation" meta="dry-run" />
        <code>{drift.terraformPlan}</code>
      </section>
    </div>
  )
}

function DriftList({ title, items }) {
  return <article><strong>{title}</strong>{items.length === 0 && <small>None</small>}{items.map((item) => <span key={item}>{item}</span>)}</article>
}

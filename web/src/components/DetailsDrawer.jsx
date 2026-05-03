import { ProviderPill } from './ui'

export function DetailsDrawer({ action, onClose, resource }) {
  if (!resource) {
    return null
  }

  return (
    <aside className="detailsDrawer">
      <button className="drawerClose" type="button" onClick={onClose}>Close</button>
      <ProviderPill provider={resource.provider} />
      <h2>{resource.name}</h2>
      <dl>
        <div><dt>Type</dt><dd>{resource.type}</dd></div>
        <div><dt>Owner</dt><dd>{resource.owner || 'unassigned'}</dd></div>
        <div><dt>Region</dt><dd>{resource.region}</dd></div>
        <div><dt>Criticality</dt><dd>{resource.criticality || 'medium'}</dd></div>
        <div><dt>Cost</dt><dd>${resource.monthlyCost}</dd></div>
      </dl>
      {action && (
        <section className="drawerAction">
          <h3>{action.title}</h3>
          <p>{action.dryRun?.summary}</p>
          <ul>
            {(action.dryRun?.changes || []).map((change) => <li key={change}>{change}</li>)}
          </ul>
        </section>
      )}
    </aside>
  )
}

import { ProviderPill, PanelHeader } from '../components/ui'

export function Inventory({ resources, onSelect }) {
  return (
    <section className="panel">
      <PanelHeader title="Resource Inventory" meta={`${resources.length} matches`} />
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Provider</th><th>Environment</th><th>Owner</th><th>Status</th><th>Region</th><th>Cost</th></tr>
          </thead>
          <tbody>
            {resources.map((resource) => (
              <tr key={resource.id} onClick={() => onSelect(resource.id)}>
                <td><strong>{resource.name}</strong><span>{resource.type}</span></td>
                <td><ProviderPill provider={resource.provider} /></td>
                <td>{resource.environment || 'unknown'}</td>
                <td>{resource.owner || 'unassigned'}</td>
                <td><span className={`statusDot ${resource.status}`}>{resource.status}</span></td>
                <td>{resource.region}</td>
                <td>${resource.monthlyCost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

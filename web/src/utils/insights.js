export const providers = ['All', 'AWS', 'GCP', 'Azure', 'Other']

export const providerClass = {
  AWS: 'providerAws',
  GCP: 'providerGcp',
  Azure: 'providerAzure',
  Other: 'providerOther',
}

export function buildInsights(snapshot) {
  const resources = snapshot.resources
  const totalCost = sum(resources.map((resource) => resource.monthlyCost))
  const running = resources.filter((resource) => resource.status === 'running').length
  const environments = unique(resources.map((resource) => resource.environment || 'unknown'))
  const owners = unique(resources.map((resource) => resource.owner || 'unassigned'))
  const highCriticality = resources.filter((resource) => resource.criticality === 'high').length
  const findings = snapshot.findings || []
  const providerSpend = groupSpend(resources, 'provider')
  const environmentSpend = groupSpend(resources, 'environment')
  const topCost = [...resources].sort((a, b) => b.monthlyCost - a.monthlyCost).slice(0, 5)
  const unowned = resources.filter((resource) => !resource.owner || resource.owner === 'unassigned')
  const idle = resources.filter((resource) => ['idle', 'stopped'].includes(resource.status))

  return {
    totalCost,
    running,
    environments,
    owners,
    highCriticality,
    findings,
    providerSpend,
    environmentSpend,
    topCost,
    unowned,
    idle,
    score: Math.max(38, 100 - findings.length * 9 - unowned.length * 6 - idle.length * 3),
  }
}

export function filterResources(resources, filters) {
  const query = filters.query.trim().toLowerCase()

  return resources.filter((resource) => {
    const providerMatches = filters.provider === 'All' || resource.provider === filters.provider
    const statusMatches = filters.status === 'All' || resource.status === filters.status
    const envMatches = filters.environment === 'All' || resource.environment === filters.environment
    const textMatches =
      !query ||
      [
        resource.name,
        resource.type,
        resource.region,
        resource.owner,
        resource.environment,
        resource.status,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)

    return providerMatches && statusMatches && envMatches && textMatches
  })
}

export function exportSnapshot(snapshot) {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'infrasight-snapshot.json'
  link.click()
  URL.revokeObjectURL(url)
}

function groupSpend(resources, key) {
  return resources.reduce((groups, resource) => {
    const label = resource[key] || 'unknown'
    groups[label] = (groups[label] || 0) + resource.monthlyCost
    return groups
  }, {})
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0)
}

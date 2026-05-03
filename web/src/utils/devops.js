export function buildObservabilitySignals(resources) {
  return resources.slice(0, 8).map((resource, index) => {
    const cpu = 28 + ((index + resource.name.length) * 11) % 58
    const errors = Number(((index + 1) * 0.17).toFixed(2))
    return {
      resourceId: resource.id,
      provider: resource.provider,
      connector: connectorFor(resource.provider),
      metrics: [
        { name: 'cpu', value: cpu, unit: '%' },
        { name: 'error_rate', value: errors, unit: '%' },
        { name: 'traffic', value: (index + 1) * 41, unit: 'mbps' },
        { name: 'monthly_cost', value: resource.monthlyCost, unit: 'usd' },
      ],
      alarms: [{ name: `${resource.name}-health`, severity: cpu > 70 ? 'high' : 'medium', condition: 'local mock threshold' }],
      logs: [{ level: 'info', message: 'mock telemetry sampled locally' }],
      incidents: [{ id: `inc-${resource.id}`, status: cpu > 70 ? 'investigating' : 'monitoring', title: `${resource.name} review` }],
      slo: { name: 'availability', target: 99.9, current: 99.8 - errors / 10, burnRate: errors / 2 },
    }
  })
}

export function buildPipelines(snapshot) {
  const findings = snapshot.findings || []
  return [
    { id: 'plan-drift', name: 'Terraform drift scan', trigger: 'state_import', validate: 'terraform_plan_and_policy', approval: 'devops_lead', state: findings.length ? 'suggested' : 'approved' },
    { id: 'policy-gate', name: 'Policy gate', trigger: 'pull_request', validate: 'security_scan', approval: 'security_owner', state: findings.length ? 'queued' : 'approved' },
    { id: 'remediate-safe', name: 'Safe remediation', trigger: 'manual', validate: 'drift_check', approval: 'two_person_review', state: 'suggested' },
  ]
}

export function remediationFor(resource, finding) {
  if (!resource) return []
  const scenario = finding?.title || 'operational-guardrail'
  return [{
    id: `${resource.provider}-${resource.id}-local`,
    provider: resource.provider,
    type: resource.provider === 'Azure' ? 'Automation Runbook' : resource.provider === 'AWS' ? 'Lambda + EventBridge' : 'Cloud Function',
    scenario,
    state: 'suggested',
    resourceId: resource.id,
    title: `${resource.provider} remediation for ${resource.name}`,
    summary: 'Local fallback remediation template.',
    terraform: `# Terraform guardrail for ${resource.id}`,
    cli: `echo dry-run ${resource.id}`,
    githubActions: `name: InfraSight\non: workflow_dispatch`,
    gitlabCi: `infrasight:\n  when: manual`,
    dryRun: { summary: 'No changes executed.', changes: ['Generate guardrail', 'Request approval'], risks: ['Review production impact'] },
  }]
}

function connectorFor(provider) {
  if (provider === 'AWS') return 'CloudWatch + Lambda + EventBridge + SSM Automation'
  if (provider === 'Azure') return 'Azure Monitor + Automation Account + Logic Apps + Policy'
  if (provider === 'GCP') return 'Cloud Monitoring + Cloud Functions + Cloud Scheduler'
  return 'OpenTelemetry'
}

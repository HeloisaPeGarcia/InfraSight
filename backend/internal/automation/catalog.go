package automation

import (
	"fmt"
	"strings"
	"time"

	"infrasight/internal/domain"
	"infrasight/internal/policy"
)

func Actions(snapshot domain.Snapshot) []domain.AutomationAction {
	findings := policy.Evaluate(snapshot)
	actions := []domain.AutomationAction{}
	for _, finding := range findings {
		resource, ok := findResource(snapshot.Resources, finding.ResourceID)
		if !ok {
			continue
		}
		actions = append(actions, actionFor(resource, scenarioFor(finding), finding))
	}
	return actions
}

func Runbooks(snapshot domain.Snapshot) []domain.Runbook {
	seen := map[string]bool{}
	runbooks := []domain.Runbook{}
	for _, action := range Actions(snapshot) {
		key := action.Provider + "-" + action.Scenario
		if seen[key] {
			continue
		}
		seen[key] = true
		runbooks = append(runbooks, domain.Runbook{
			ID:        "rb-" + key,
			Scenario:  action.Scenario,
			Provider:  action.Provider,
			Title:     action.Title,
			Steps:     []string{"Review dry-run changes", "Request approval", "Apply generated snippet", "Observe alarms and SLO", "Close finding"},
			CreatedAt: time.Now().UTC(),
		})
	}
	return runbooks
}

func DefaultPlans(snapshot domain.Snapshot) []domain.Plan {
	actions := Actions(snapshot)
	plans := []domain.Plan{}
	for index, action := range actions {
		if index >= 3 {
			break
		}
		plans = append(plans, domain.Plan{
			ID:        fmt.Sprintf("plan-%03d", index+1),
			Name:      action.Title,
			Trigger:   "pull_request",
			Validate:  "terraform_plan_and_policy",
			Approval:  "devops_lead",
			ActionID:  action.ID,
			State:     "suggested",
			CreatedAt: time.Now().UTC(),
		})
	}
	return plans
}

func actionFor(resource domain.Resource, scenario string, finding domain.Finding) domain.AutomationAction {
	provider := resource.Provider
	title := titleFor(provider, scenario, resource.Name)
	return domain.AutomationAction{
		ID:         strings.ToLower(provider) + "-" + scenario + "-" + sanitize(resource.ID),
		Provider:   provider,
		Type:       typeFor(provider, scenario),
		Scenario:   scenario,
		State:      "suggested",
		ResourceID: resource.ID,
		Title:      title,
		Summary:    finding.Detail,
		Terraform:  terraformSnippet(resource, scenario),
		CLI:        cliSnippet(resource, scenario),
		GitHub:     githubSnippet(resource, scenario),
		GitLab:     gitlabSnippet(resource, scenario),
		DryRun: domain.DryRun{
			Summary: "No cloud changes are executed. InfraSight only generates an approval-ready remediation plan.",
			Changes: []string{
				"Attach monitoring and alert routing",
				"Apply missing metadata or network guardrail",
				"Create provider-native remediation function/runbook",
			},
			Risks: []string{"Requires provider credentials when executed outside InfraSight", "Network changes should be reviewed for production dependencies"},
		},
	}
}

func scenarioFor(finding domain.Finding) string {
	title := strings.ToLower(finding.Title)
	switch {
	case strings.Contains(title, "cost"):
		return "high-cost"
	case strings.Contains(title, "subnet"):
		return "public-subnet"
	case strings.Contains(title, "owner"):
		return "missing-owner"
	case strings.Contains(title, "tag"):
		return "missing-tags"
	case strings.Contains(title, "vm") || strings.Contains(title, "jump"):
		return "exposed-vm"
	case strings.Contains(title, "database"):
		return "critical-database"
	default:
		return "operational-guardrail"
	}
}

func titleFor(provider, scenario, name string) string {
	if provider == "AWS" {
		return "AWS Lambda remediation for " + name
	}
	if provider == "Azure" {
		return "Azure Automation runbook for " + name
	}
	if provider == "GCP" {
		return "GCP Cloud Function remediation for " + name
	}
	return "Provider-aware remediation for " + name
}

func typeFor(provider, scenario string) string {
	if provider == "AWS" {
		if scenario == "critical-database" {
			return "Systems Manager Automation"
		}
		return "Lambda + EventBridge"
	}
	if provider == "Azure" {
		return "Automation Account + Logic Apps"
	}
	if provider == "GCP" {
		return "Cloud Functions + Cloud Scheduler"
	}
	return "Runbook"
}

func terraformSnippet(resource domain.Resource, scenario string) string {
	if resource.Provider == "AWS" {
		return fmt.Sprintf(`resource "aws_cloudwatch_metric_alarm" "%s_guardrail" {
  alarm_name          = "%s-%s"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
}`, sanitize(resource.Name), resource.Name, scenario)
	}
	if resource.Provider == "Azure" {
		return fmt.Sprintf(`resource "azurerm_monitor_metric_alert" "%s_guardrail" {
  name                = "%s-%s"
  resource_group_name = "ops-rg"
  scopes              = ["%s"]
  severity            = 2
}`, sanitize(resource.Name), resource.Name, scenario, resource.ID)
	}
	return fmt.Sprintf(`# %s guardrail for %s
resource "google_monitoring_alert_policy" "%s_guardrail" {
  display_name = "%s-%s"
}`, resource.Provider, resource.Name, sanitize(resource.Name), resource.Name, scenario)
}

func cliSnippet(resource domain.Resource, scenario string) string {
	if resource.Provider == "AWS" {
		return fmt.Sprintf("aws events put-rule --name %s-%s --schedule-expression rate(5 minutes)", resource.Name, scenario)
	}
	if resource.Provider == "Azure" {
		return fmt.Sprintf("az monitor metrics alert create --name %s-%s --scopes %s", resource.Name, scenario, resource.ID)
	}
	return fmt.Sprintf("gcloud scheduler jobs create pubsub %s-%s --schedule='*/5 * * * *'", resource.Name, scenario)
}

func githubSnippet(resource domain.Resource, scenario string) string {
	return fmt.Sprintf(`name: InfraSight remediation
on: workflow_dispatch
jobs:
  dry-run:
    runs-on: ubuntu-latest
    steps:
      - run: echo "dry-run %s for %s"`, scenario, resource.ID)
}

func gitlabSnippet(resource domain.Resource, scenario string) string {
	return fmt.Sprintf(`infrasight_remediation:
  stage: deploy
  when: manual
  script:
    - echo "dry-run %s for %s"`, scenario, resource.ID)
}

func findResource(resources []domain.Resource, id string) (domain.Resource, bool) {
	for _, resource := range resources {
		if resource.ID == id {
			return resource, true
		}
	}
	return domain.Resource{}, false
}

func sanitize(value string) string {
	value = strings.ReplaceAll(value, ".", "_")
	value = strings.ReplaceAll(value, "-", "_")
	value = strings.ReplaceAll(value, "/", "_")
	return value
}

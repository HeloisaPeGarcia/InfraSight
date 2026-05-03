package policy

import (
	"fmt"
	"strings"

	"infrasight/internal/domain"
)

type Rule struct {
	ID        string `json:"id"`
	Scenario  string `json:"scenario"`
	Framework string `json:"framework"`
	Severity  string `json:"severity"`
}

var Rules = []Rule{
	{ID: "cost-high", Scenario: "high-cost", Framework: "FinOps", Severity: "medium"},
	{ID: "subnet-public", Scenario: "public-subnet", Framework: "AWS Well-Architected", Severity: "high"},
	{ID: "owner-missing", Scenario: "missing-owner", Framework: "CIS Controls", Severity: "medium"},
	{ID: "tag-missing", Scenario: "missing-tags", Framework: "CIS Controls", Severity: "low"},
	{ID: "vm-exposed", Scenario: "exposed-vm", Framework: "CIS Benchmarks", Severity: "high"},
	{ID: "db-critical", Scenario: "critical-database", Framework: "Well-Architected Reliability", Severity: "high"},
}

func Evaluate(snapshot domain.Snapshot) []domain.Finding {
	findings := append([]domain.Finding{}, snapshot.Findings...)
	seen := map[string]bool{}
	for _, finding := range findings {
		seen[finding.ID] = true
	}

	for _, resource := range snapshot.Resources {
		add := func(id, severity, title, detail string) {
			if seen[id] {
				return
			}
			seen[id] = true
			findings = append(findings, domain.Finding{ID: id, Severity: severity, ResourceID: resource.ID, Title: title, Detail: detail})
		}

		if resource.MonthlyCost >= 15 {
			add("cost-"+resource.ID, "medium", "High monthly cost", "Resource exceeds the local FinOps threshold.")
		}
		if resource.Owner == "" || resource.Owner == "unassigned" {
			add("owner-"+resource.ID, "medium", "Missing owner", "Resource has no accountable owner metadata.")
		}
		if len(resource.Tags) == 0 {
			add("tags-"+resource.ID, "low", "Missing tags", "Resource is missing governance tags.")
		}
		if resource.Environment == "prod" && strings.Contains(resource.Type, "subnet") && strings.Contains(strings.ToLower(resource.Name), "public") {
			add("public-"+resource.ID, "high", "Public production subnet", "Production subnet has public exposure naming.")
		}
		if strings.Contains(resource.Type, "virtual_machine") || strings.Contains(resource.Type, "instance") {
			if strings.Contains(strings.ToLower(resource.Name), "jump") || strings.Contains(strings.ToLower(resource.Name), "public") {
				add("vm-"+resource.ID, "high", "Potentially exposed VM", "VM pattern suggests public access or jump-host behavior.")
			}
		}
		if strings.Contains(resource.Type, "db") && resource.Criticality == "high" {
			add("db-"+resource.ID, "high", "Critical database guardrail", "Critical database should have backup, alert, and failover runbooks.")
		}
	}
	return findings
}

func Score(snapshot domain.Snapshot) domain.Scorecard {
	findings := Evaluate(snapshot)
	totalCost := 0
	unowned := 0
	for _, resource := range snapshot.Resources {
		totalCost += resource.MonthlyCost
		if resource.Owner == "" || resource.Owner == "unassigned" {
			unowned++
		}
	}

	high := countSeverity(findings, "high")
	medium := countSeverity(findings, "medium")
	return domain.Scorecard{
		Cost:        clamp(100 - totalCost),
		Security:    clamp(100 - high*14 - medium*5),
		Reliability: clamp(94 - high*8),
		Ownership:   clamp(100 - unowned*18),
		Compliance:  clamp(96 - len(findings)*6),
	}
}

func MarkdownReport(snapshot domain.Snapshot) string {
	score := Score(snapshot)
	findings := Evaluate(snapshot)
	report := fmt.Sprintf("# InfraSight Governance Report\n\n## Scorecard\n\n- Cost: %d\n- Security: %d\n- Reliability: %d\n- Ownership: %d\n- Compliance: %d\n\n## Findings\n", score.Cost, score.Security, score.Reliability, score.Ownership, score.Compliance)
	for _, finding := range findings {
		report += fmt.Sprintf("\n- **%s** (%s): %s\n", finding.Title, finding.Severity, finding.Detail)
	}
	return report
}

func countSeverity(findings []domain.Finding, severity string) int {
	count := 0
	for _, finding := range findings {
		if finding.Severity == severity {
			count++
		}
	}
	return count
}

func clamp(value int) int {
	if value < 0 {
		return 0
	}
	if value > 100 {
		return 100
	}
	return value
}

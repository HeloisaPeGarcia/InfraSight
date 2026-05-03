package observability

import (
	"math"

	"infrasight/internal/domain"
)

func Signals(snapshot domain.Snapshot) []domain.ObservabilitySignal {
	signals := []domain.ObservabilitySignal{}
	for index, resource := range snapshot.Resources {
		cpu := math.Mod(float64((index+1)*17+len(resource.Name)*3), 86)
		if cpu < 18 {
			cpu += 18
		}
		errors := math.Mod(float64(index+1)*0.23, 4.2)
		traffic := float64((index + 1) * 37)

		signals = append(signals, domain.ObservabilitySignal{
			ResourceID: resource.ID,
			Provider:   resource.Provider,
			Connector:  connector(resource.Provider),
			Metrics: []domain.Metric{
				{Name: "cpu", Value: round(cpu), Unit: "%"},
				{Name: "error_rate", Value: round(errors), Unit: "%"},
				{Name: "traffic", Value: traffic, Unit: "mbps"},
				{Name: "monthly_cost", Value: float64(resource.MonthlyCost), Unit: "usd"},
			},
			Alarms: []domain.Alarm{
				{Name: resource.Name + "-latency", Severity: severity(cpu), Condition: "p95 latency above local SLO"},
				{Name: resource.Name + "-cost", Severity: severity(float64(resource.MonthlyCost * 4)), Condition: "monthly estimate drift"},
			},
			Logs: []domain.LogEntry{
				{Level: "info", Message: connector(resource.Provider) + " connector sampled resource telemetry"},
				{Level: "warn", Message: "dry-run only: no provider API was called"},
			},
			Incidents: []domain.Incident{
				{ID: "inc-" + resource.ID, Status: incidentStatus(cpu), Title: resource.Name + " operational review"},
			},
			SLO: domain.SLO{Name: "availability", Target: 99.9, Current: round(99.95 - errors/10), BurnRate: round(errors / 2)},
		})
	}
	return signals
}

func connector(provider string) string {
	switch provider {
	case "AWS":
		return "CloudWatch + Lambda + EventBridge + SSM Automation"
	case "Azure":
		return "Azure Monitor + Automation Account + Logic Apps + Policy"
	case "GCP":
		return "Cloud Monitoring + Cloud Functions + Cloud Scheduler"
	default:
		return "Generic OpenTelemetry Connector"
	}
}

func severity(value float64) string {
	if value >= 70 {
		return "high"
	}
	if value >= 40 {
		return "medium"
	}
	return "low"
}

func incidentStatus(value float64) string {
	if value >= 70 {
		return "investigating"
	}
	return "monitoring"
}

func round(value float64) float64 {
	return math.Round(value*100) / 100
}

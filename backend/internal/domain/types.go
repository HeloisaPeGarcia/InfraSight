package domain

import "time"

type Snapshot struct {
	GeneratedAt time.Time  `json:"generatedAt"`
	Resources   []Resource `json:"resources"`
	Edges       []Edge     `json:"edges"`
	Findings    []Finding  `json:"findings"`
}

type Resource struct {
	ID            string            `json:"id"`
	Name          string            `json:"name"`
	Type          string            `json:"type"`
	Provider      string            `json:"provider"`
	Status        string            `json:"status"`
	Region        string            `json:"region"`
	Environment   string            `json:"environment"`
	Owner         string            `json:"owner"`
	Criticality   string            `json:"criticality"`
	InstanceClass string            `json:"instanceClass,omitempty"`
	MonthlyCost   int               `json:"monthlyCost"`
	Tags          map[string]string `json:"tags,omitempty"`
}

type Edge struct {
	From    string `json:"from"`
	To      string `json:"to"`
	Label   string `json:"label"`
	Planned bool   `json:"planned,omitempty"`
}

type Finding struct {
	ID         string `json:"id"`
	Severity   string `json:"severity"`
	ResourceID string `json:"resourceId"`
	Title      string `json:"title"`
	Detail     string `json:"detail"`
}

type AutomationAction struct {
	ID         string `json:"id"`
	Provider   string `json:"provider"`
	Type       string `json:"type"`
	Scenario   string `json:"scenario"`
	State      string `json:"state"`
	ResourceID string `json:"resourceId"`
	Title      string `json:"title"`
	Summary    string `json:"summary"`
	Terraform  string `json:"terraform"`
	CLI        string `json:"cli"`
	GitHub     string `json:"githubActions"`
	GitLab     string `json:"gitlabCi"`
	DryRun     DryRun `json:"dryRun"`
}

type DryRun struct {
	Summary string   `json:"summary"`
	Changes []string `json:"changes"`
	Risks   []string `json:"risks"`
}

type Plan struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Trigger   string    `json:"trigger"`
	Validate  string    `json:"validate"`
	Approval  string    `json:"approval"`
	ActionID  string    `json:"actionId"`
	State     string    `json:"state"`
	CreatedAt time.Time `json:"createdAt"`
}

type Runbook struct {
	ID        string    `json:"id"`
	Scenario  string    `json:"scenario"`
	Provider  string    `json:"provider"`
	Title     string    `json:"title"`
	Steps     []string  `json:"steps"`
	CreatedAt time.Time `json:"createdAt"`
}

type ObservabilitySignal struct {
	ResourceID string     `json:"resourceId"`
	Provider   string     `json:"provider"`
	Connector  string     `json:"connector"`
	Metrics    []Metric   `json:"metrics"`
	Alarms     []Alarm    `json:"alarms"`
	Logs       []LogEntry `json:"logs"`
	Incidents  []Incident `json:"incidents"`
	SLO        SLO        `json:"slo"`
}

type Metric struct {
	Name  string  `json:"name"`
	Value float64 `json:"value"`
	Unit  string  `json:"unit"`
}

type Alarm struct {
	Name      string `json:"name"`
	Severity  string `json:"severity"`
	Condition string `json:"condition"`
}

type LogEntry struct {
	Level   string `json:"level"`
	Message string `json:"message"`
}

type Incident struct {
	ID     string `json:"id"`
	Status string `json:"status"`
	Title  string `json:"title"`
}

type SLO struct {
	Name     string  `json:"name"`
	Target   float64 `json:"target"`
	Current  float64 `json:"current"`
	BurnRate float64 `json:"burnRate"`
}

type Scorecard struct {
	Cost        int `json:"cost"`
	Security    int `json:"security"`
	Reliability int `json:"reliability"`
	Ownership   int `json:"ownership"`
	Compliance  int `json:"compliance"`
}

type TopologyLayout struct {
	ID        string           `json:"id"`
	Snapshot  string           `json:"snapshot"`
	Positions map[string]Point `json:"positions"`
	CreatedAt time.Time        `json:"createdAt"`
	UpdatedAt time.Time        `json:"updatedAt"`
}

type Point struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type DriftReport struct {
	ID        string    `json:"id"`
	Summary   string    `json:"summary"`
	Added     []string  `json:"added"`
	Changed   []string  `json:"changed"`
	Removed   []string  `json:"removed"`
	Plan      string    `json:"terraformPlan"`
	CreatedAt time.Time `json:"createdAt"`
}

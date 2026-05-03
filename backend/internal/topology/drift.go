package topology

import (
	"fmt"
	"time"

	"infrasight/internal/domain"
)

func MockDrift(snapshot domain.Snapshot) domain.DriftReport {
	added := []string{}
	changed := []string{}
	for index, resource := range snapshot.Resources {
		if index%4 == 0 {
			changed = append(changed, resource.ID)
		}
	}
	if len(snapshot.Resources) > 0 {
		added = append(added, "planned.aws_cloudwatch_metric_alarm.guardrail")
	}
	return domain.DriftReport{
		ID:        "drift-" + time.Now().UTC().Format("20060102150405"),
		Summary:   fmt.Sprintf("%d changed, %d added, 0 removed", len(changed), len(added)),
		Added:     added,
		Changed:   changed,
		Removed:   []string{},
		Plan:      "terraform plan -detailed-exitcode\n# mock drift: tags, alarms, and guardrails require review",
		CreatedAt: time.Now().UTC(),
	}
}

package policy

import (
	"testing"

	"infrasight/internal/domain"
)

func TestScoreExplainsGovernanceSignals(t *testing.T) {
	score := Score(domain.Snapshot{Resources: []domain.Resource{
		{ID: "aws_instance.public", Name: "public-vm", Type: "aws_instance", Provider: "AWS", Owner: "unassigned", Environment: "prod", MonthlyCost: 25},
	}})
	if score.Security >= 100 || score.Ownership >= 100 || score.Cost >= 100 {
		t.Fatalf("expected score penalties, got %+v", score)
	}
}

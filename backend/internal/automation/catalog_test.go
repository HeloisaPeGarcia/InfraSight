package automation

import (
	"testing"

	"infrasight/internal/domain"
)

func TestActionsGenerateProviderSnippetsAndDryRun(t *testing.T) {
	snapshot := domain.Snapshot{
		Resources: []domain.Resource{
			{ID: "aws_instance.api", Name: "api-01", Type: "aws_instance", Provider: "AWS", Owner: "payments", Environment: "prod", MonthlyCost: 20},
		},
	}

	actions := Actions(snapshot)
	if len(actions) == 0 {
		t.Fatalf("expected generated actions")
	}
	action := actions[0]
	if action.State != "suggested" {
		t.Fatalf("expected suggested state, got %s", action.State)
	}
	if action.Terraform == "" || action.CLI == "" || action.GitHub == "" || action.GitLab == "" {
		t.Fatalf("expected all snippet formats to be generated")
	}
	if len(action.DryRun.Changes) == 0 {
		t.Fatalf("expected dry run changes")
	}
}

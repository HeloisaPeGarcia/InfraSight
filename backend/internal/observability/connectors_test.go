package observability

import (
	"testing"

	"infrasight/internal/domain"
)

func TestSignalsIncludeMetricsAndSLO(t *testing.T) {
	signals := Signals(domain.Snapshot{Resources: []domain.Resource{{ID: "aws_instance.api", Name: "api", Provider: "AWS"}}})
	if len(signals) != 1 {
		t.Fatalf("expected one signal")
	}
	if len(signals[0].Metrics) == 0 || signals[0].SLO.Target == 0 {
		t.Fatalf("expected metrics and SLO: %+v", signals[0])
	}
}

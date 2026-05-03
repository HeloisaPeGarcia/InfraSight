package infra

import (
	"time"

	"infrasight/internal/domain"
)

func MockSnapshot() domain.Snapshot {
	return domain.Snapshot{
		GeneratedAt: time.Now().UTC(),
		Resources: []domain.Resource{
			{ID: "aws_vpc.prod", Name: "prod-vpc", Type: "aws_vpc", Provider: "AWS", Status: "available", Region: "us-east-1", Environment: "prod", Owner: "platform", Criticality: "high"},
			{ID: "aws_subnet.public_a", Name: "public-a", Type: "aws_subnet", Provider: "AWS", Status: "available", Region: "us-east-1a", Environment: "prod", Owner: "network", Criticality: "medium"},
			{ID: "aws_instance.api", Name: "api-01", Type: "aws_instance", Provider: "AWS", Status: "running", Region: "us-east-1", Environment: "prod", Owner: "payments", Criticality: "high", InstanceClass: "t2.micro", MonthlyCost: 8},
			{ID: "aws_db_instance.billing", Name: "billing-db", Type: "aws_db_instance", Provider: "AWS", Status: "running", Region: "us-east-1", Environment: "prod", Owner: "finance", Criticality: "high", InstanceClass: "db.t3.micro", MonthlyCost: 15},
			{ID: "google_compute_network.core", Name: "core-network", Type: "google_compute_network", Provider: "GCP", Status: "active", Region: "global", Environment: "shared", Owner: "platform", Criticality: "high"},
			{ID: "google_compute_instance.worker", Name: "worker-a", Type: "google_compute_instance", Provider: "GCP", Status: "running", Region: "us-central1-a", Environment: "prod", Owner: "data", Criticality: "medium", InstanceClass: "e2-micro", MonthlyCost: 6},
			{ID: "azurerm_virtual_network.hub", Name: "hub-vnet", Type: "azurerm_virtual_network", Provider: "Azure", Status: "available", Region: "eastus", Environment: "shared", Owner: "network", Criticality: "high"},
			{ID: "azurerm_linux_virtual_machine.jump", Name: "jumpbox", Type: "azurerm_linux_virtual_machine", Provider: "Azure", Status: "running", Region: "eastus", Environment: "ops", Owner: "security", Criticality: "medium", InstanceClass: "B1s", MonthlyCost: 7},
		},
		Edges: []domain.Edge{
			{From: "aws_instance.api", To: "aws_subnet.public_a", Label: "attached to"},
			{From: "aws_db_instance.billing", To: "aws_subnet.public_a", Label: "private subnet"},
			{From: "aws_subnet.public_a", To: "aws_vpc.prod", Label: "inside"},
			{From: "google_compute_instance.worker", To: "google_compute_network.core", Label: "uses"},
			{From: "azurerm_linux_virtual_machine.jump", To: "azurerm_virtual_network.hub", Label: "joined to"},
			{From: "aws_instance.api", To: "aws_db_instance.billing", Label: "queries"},
		},
		Findings: []domain.Finding{
			{ID: "fin-001", Severity: "high", ResourceID: "aws_instance.api", Title: "Public subnet dependency", Detail: "Production compute is attached to a public subnet."},
			{ID: "fin-002", Severity: "medium", ResourceID: "azurerm_linux_virtual_machine.jump", Title: "Operational jump host", Detail: "Review access policy and session logging."},
		},
	}
}

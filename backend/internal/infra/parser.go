package infra

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"infrasight/internal/domain"
	"infrasight/internal/policy"
	"infrasight/internal/topology"
)

func LoadSnapshot() (domain.Snapshot, error) {
	path := strings.TrimSpace(os.Getenv("INFRA_STATE_FILE"))
	if path == "" {
		return MockSnapshot(), nil
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return domain.Snapshot{}, fmt.Errorf("read state file: %w", err)
	}

	var snapshot domain.Snapshot
	if err := json.Unmarshal(data, &snapshot); err == nil && len(snapshot.Resources) > 0 {
		if snapshot.GeneratedAt.IsZero() {
			snapshot.GeneratedAt = time.Now().UTC()
		}
		ApplyCosts(snapshot.Resources)
		enrichResources(snapshot.Resources)
		if err := topology.Validate(snapshot); err != nil {
			return domain.Snapshot{}, err
		}
		snapshot.Findings = policy.Evaluate(snapshot)
		return snapshot, nil
	}

	return ParseTerraformState(data)
}

func ParseTerraformState(data []byte) (domain.Snapshot, error) {
	var state struct {
		Resources []struct {
			Address   string `json:"address"`
			Mode      string `json:"mode"`
			Type      string `json:"type"`
			Name      string `json:"name"`
			Provider  string `json:"provider"`
			Instances []struct {
				Attributes   map[string]any `json:"attributes"`
				Dependencies []string       `json:"dependencies"`
			} `json:"instances"`
		} `json:"resources"`
	}

	if err := json.Unmarshal(data, &state); err != nil {
		return domain.Snapshot{}, fmt.Errorf("parse json: %w", err)
	}
	if len(state.Resources) == 0 {
		return domain.Snapshot{}, errors.New("state file did not contain resources")
	}

	resources := make([]domain.Resource, 0, len(state.Resources))
	edges := make([]domain.Edge, 0)
	known := map[string]bool{}

	for _, item := range state.Resources {
		if item.Mode == "data" {
			continue
		}

		id := firstNonEmpty(item.Address, item.Type+"."+item.Name)
		known[id] = true

		attributes := map[string]any{}
		if len(item.Instances) > 0 {
			attributes = item.Instances[0].Attributes
		}

		tags := readTags(attributes)
		instanceClass := firstString(attributes, "instance_type", "machine_type", "vm_size", "sku")
		resources = append(resources, domain.Resource{
			ID:            id,
			Name:          firstNonEmpty(firstString(attributes, "name"), tags["Name"], item.Name, id),
			Type:          item.Type,
			Provider:      providerName(item.Provider, item.Type),
			Status:        firstNonEmpty(firstString(attributes, "status", "power_state", "provisioning_state"), "running"),
			Region:        firstNonEmpty(firstString(attributes, "region", "location", "availability_zone", "zone"), "unknown"),
			Environment:   firstNonEmpty(tags["Environment"], tags["env"], "unknown"),
			Owner:         firstNonEmpty(tags["Owner"], tags["team"], "unassigned"),
			Criticality:   firstNonEmpty(tags["Criticality"], "medium"),
			InstanceClass: instanceClass,
			MonthlyCost:   Pricing[instanceClass],
			Tags:          tags,
		})
	}

	for _, item := range state.Resources {
		from := firstNonEmpty(item.Address, item.Type+"."+item.Name)
		for _, instance := range item.Instances {
			for _, dependency := range instance.Dependencies {
				if known[from] && known[dependency] {
					edges = append(edges, domain.Edge{From: from, To: dependency, Label: "depends on"})
				}
			}
		}
	}

	snapshot := domain.Snapshot{
		GeneratedAt: time.Now().UTC(),
		Resources:   resources,
		Edges:       edges,
	}
	snapshot.Findings = policy.Evaluate(snapshot)
	return snapshot, topology.Validate(snapshot)
}

func enrichResources(resources []domain.Resource) {
	for index := range resources {
		if resources[index].Environment == "" {
			resources[index].Environment = "unknown"
		}
		if resources[index].Owner == "" {
			resources[index].Owner = "unassigned"
		}
		if resources[index].Criticality == "" {
			resources[index].Criticality = "medium"
		}
	}
}

func providerName(provider, resourceType string) string {
	source := strings.ToLower(provider + " " + resourceType)
	switch {
	case strings.Contains(source, "azurerm"):
		return "Azure"
	case strings.Contains(source, "google"):
		return "GCP"
	case strings.Contains(source, "aws"):
		return "AWS"
	default:
		return "Other"
	}
}

func firstString(attributes map[string]any, keys ...string) string {
	for _, key := range keys {
		if value, ok := readAttribute(attributes, key); ok {
			if text, ok := value.(string); ok && strings.TrimSpace(text) != "" {
				return text
			}
		}
	}
	return ""
}

func readTags(attributes map[string]any) map[string]string {
	tags := map[string]string{}
	value, ok := readAttribute(attributes, "tags")
	if !ok {
		return tags
	}
	tagMap, ok := value.(map[string]any)
	if !ok {
		return tags
	}
	for key, tagValue := range tagMap {
		if text, ok := tagValue.(string); ok {
			tags[key] = text
		}
	}
	return tags
}

func readAttribute(attributes map[string]any, key string) (any, bool) {
	parts := strings.Split(key, ".")
	var current any = attributes
	for _, part := range parts {
		object, ok := current.(map[string]any)
		if !ok {
			return nil, false
		}
		current, ok = object[part]
		if !ok {
			return nil, false
		}
	}
	return current, true
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

package topology

import (
	"errors"
	"strings"

	"infrasight/internal/domain"
)

func Validate(snapshot domain.Snapshot) error {
	if len(snapshot.Resources) == 0 {
		return errors.New("snapshot must include at least one resource")
	}

	ids := map[string]bool{}
	for _, resource := range snapshot.Resources {
		if strings.TrimSpace(resource.ID) == "" {
			return errors.New("resource id is required")
		}
		if strings.TrimSpace(resource.Provider) == "" {
			return errors.New("resource provider is required")
		}
		ids[resource.ID] = true
	}
	for _, edge := range snapshot.Edges {
		if !ids[edge.From] || !ids[edge.To] {
			return errors.New("edge references unknown resource")
		}
	}
	return nil
}

package storage

import (
	"path/filepath"
	"testing"

	"infrasight/internal/domain"
)

func TestSaveAndLoadTopologyLayout(t *testing.T) {
	store, err := New(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatalf("new store: %v", err)
	}
	defer store.Close()
	layout := domain.TopologyLayout{ID: "default", Positions: map[string]domain.Point{"a": {X: 10, Y: 20}}}
	if err := store.SaveTopologyLayout(layout); err != nil {
		t.Fatalf("save layout: %v", err)
	}
	got, err := store.GetTopologyLayout("default")
	if err != nil {
		t.Fatalf("get layout: %v", err)
	}
	if got.Positions["a"].X != 10 {
		t.Fatalf("unexpected layout: %+v", got)
	}
}

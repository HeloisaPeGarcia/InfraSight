package storage

import (
	"database/sql"
	"encoding/json"
	"time"

	"infrasight/internal/domain"

	_ "modernc.org/sqlite"
)

type Store struct {
	db *sql.DB
}

func (s *Store) Close() error {
	return s.db.Close()
}

func New(path string) (*Store, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	store := &Store{db: db}
	if err := store.migrate(); err != nil {
		return nil, err
	}
	return store, nil
}

func (s *Store) migrate() error {
	statements := []string{
		`create table if not exists plans (id text primary key, payload text not null, created_at text not null)`,
		`create table if not exists runbooks (id text primary key, payload text not null, created_at text not null)`,
		`create table if not exists actions (id text primary key, payload text not null, state text not null, created_at text not null)`,
		`create table if not exists topology_layouts (id text primary key, payload text not null, updated_at text not null)`,
		`create table if not exists policies (id text primary key, payload text not null, updated_at text not null)`,
	}
	for _, statement := range statements {
		if _, err := s.db.Exec(statement); err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) GetTopologyLayout(id string) (domain.TopologyLayout, error) {
	row := s.db.QueryRow(`select payload from topology_layouts where id = ?`, id)
	var payload string
	if err := row.Scan(&payload); err != nil {
		return domain.TopologyLayout{}, err
	}
	var layout domain.TopologyLayout
	return layout, json.Unmarshal([]byte(payload), &layout)
}

func (s *Store) SaveTopologyLayout(layout domain.TopologyLayout) error {
	now := time.Now().UTC()
	if layout.CreatedAt.IsZero() {
		layout.CreatedAt = now
	}
	layout.UpdatedAt = now
	payload, err := json.Marshal(layout)
	if err != nil {
		return err
	}
	_, err = s.db.Exec(`insert into topology_layouts (id, payload, updated_at) values (?, ?, ?) on conflict(id) do update set payload = excluded.payload, updated_at = excluded.updated_at`, layout.ID, string(payload), now.Format(time.RFC3339))
	return err
}

func (s *Store) SavePolicy(id string, payload any) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	_, err = s.db.Exec(`insert into policies (id, payload, updated_at) values (?, ?, ?) on conflict(id) do update set payload = excluded.payload, updated_at = excluded.updated_at`, id, string(data), time.Now().UTC().Format(time.RFC3339))
	return err
}

func (s *Store) ListPlans() ([]domain.Plan, error) {
	rows, err := s.db.Query(`select payload from plans order by created_at desc`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var plans []domain.Plan
	for rows.Next() {
		var payload string
		if err := rows.Scan(&payload); err != nil {
			return nil, err
		}
		var plan domain.Plan
		if err := json.Unmarshal([]byte(payload), &plan); err != nil {
			return nil, err
		}
		plans = append(plans, plan)
	}
	return plans, rows.Err()
}

func (s *Store) SavePlan(plan domain.Plan) error {
	if plan.CreatedAt.IsZero() {
		plan.CreatedAt = time.Now().UTC()
	}
	return s.save("plans", plan.ID, "", plan.CreatedAt, plan)
}

func (s *Store) ListRunbooks() ([]domain.Runbook, error) {
	rows, err := s.db.Query(`select payload from runbooks order by created_at desc`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var runbooks []domain.Runbook
	for rows.Next() {
		var payload string
		if err := rows.Scan(&payload); err != nil {
			return nil, err
		}
		var runbook domain.Runbook
		if err := json.Unmarshal([]byte(payload), &runbook); err != nil {
			return nil, err
		}
		runbooks = append(runbooks, runbook)
	}
	return runbooks, rows.Err()
}

func (s *Store) SaveRunbook(runbook domain.Runbook) error {
	if runbook.CreatedAt.IsZero() {
		runbook.CreatedAt = time.Now().UTC()
	}
	return s.save("runbooks", runbook.ID, "", runbook.CreatedAt, runbook)
}

func (s *Store) ListActions() ([]domain.AutomationAction, error) {
	rows, err := s.db.Query(`select payload from actions order by created_at desc`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var actions []domain.AutomationAction
	for rows.Next() {
		var payload string
		if err := rows.Scan(&payload); err != nil {
			return nil, err
		}
		var action domain.AutomationAction
		if err := json.Unmarshal([]byte(payload), &action); err != nil {
			return nil, err
		}
		actions = append(actions, action)
	}
	return actions, rows.Err()
}

func (s *Store) SaveAction(action domain.AutomationAction) error {
	return s.save("actions", action.ID, action.State, time.Now().UTC(), action)
}

func (s *Store) UpdateActionState(id, state string) error {
	row := s.db.QueryRow(`select payload from actions where id = ?`, id)
	var payload string
	if err := row.Scan(&payload); err != nil {
		return err
	}
	var action domain.AutomationAction
	if err := json.Unmarshal([]byte(payload), &action); err != nil {
		return err
	}
	action.State = state
	next, err := json.Marshal(action)
	if err != nil {
		return err
	}
	_, err = s.db.Exec(`update actions set payload = ?, state = ? where id = ?`, string(next), state, id)
	return err
}

func (s *Store) save(table, id, state string, createdAt time.Time, value any) error {
	payload, err := json.Marshal(value)
	if err != nil {
		return err
	}
	if table == "actions" {
		_, err = s.db.Exec(`insert into actions (id, payload, state, created_at) values (?, ?, ?, ?) on conflict(id) do update set payload = excluded.payload, state = excluded.state`, id, string(payload), state, createdAt.Format(time.RFC3339))
		return err
	}
	_, err = s.db.Exec(`insert into `+table+` (id, payload, created_at) values (?, ?, ?) on conflict(id) do update set payload = excluded.payload`, id, string(payload), createdAt.Format(time.RFC3339))
	return err
}

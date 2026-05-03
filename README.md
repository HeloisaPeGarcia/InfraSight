# InfraSight

Zero-config, local-first DevOps command center for visualizing, governing, and planning automation for multicloud infrastructure.

InfraSight reads a local Terraform `.tfstate` file or a mock JSON snapshot, normalizes resources into an in-memory topology, enriches them with policy findings, mock observability signals, cost estimates, remediation runbooks, and serves a React dashboard from a Go single binary.

## What It Does

- Parses Terraform state and mock multicloud JSON snapshots.
- Shows a provider-grouped topology for AWS, Azure, GCP, and other resources.
- Lets users plan topology changes locally with planned automation links.
- Provides searchable inventory with provider, status, and environment filters.
- Estimates monthly cost from a local pricing dictionary.
- Scores governance by cost, security, reliability, ownership, and compliance.
- Generates findings for high cost, public subnet, missing owner, missing tags, exposed VM, and critical database scenarios.
- Generates provider-aware remediation actions with lifecycle states: `suggested`, `approved`, `queued`, `executed`, `failed`.
- Produces dry-run remediation plans before any cloud command is executed elsewhere.
- Generates snippets for Terraform, AWS CLI, Azure CLI, GitHub Actions, and GitLab CI.
- Provides a pipeline builder with trigger, validation, approval, and action selection.
- Provides mock observability connectors for CloudWatch, Azure Monitor, and Cloud Monitoring.
- Persists plans, runbooks, and actions in a local SQLite file.
- Embeds the React build into the Go backend with `//go:embed`.

## Architecture

```text
InfraSight
+-- backend/
|   +-- main.go                        # embeds frontend and starts Fiber
|   +-- internal/automation             # runbook/action/snippet generation
|   +-- internal/domain                 # shared API types
|   +-- internal/infra                  # Terraform/mock parsing and pricing
|   +-- internal/observability          # mock cloud monitoring connectors
|   +-- internal/policy                 # rules, scorecard, Markdown reports
|   +-- internal/server                 # HTTP API and static serving
|   +-- internal/storage                # local SQLite persistence
|   +-- internal/topology               # snapshot validation
+-- web/
|   +-- src/App.tsx                     # app shell and orchestration
|   +-- src/components                  # UI, drawer, modal, topology, lists
|   +-- src/views                       # overview, topology, inventory, governance, automation
|   +-- src/data                        # browser fallback snapshot
|   +-- src/utils                       # dashboard calculations and local fallbacks
+-- examples/mock-multicloud.json      # sample multicloud snapshot
```

## Requirements

- Go `1.25+`
- Node.js and npm
- No external database or cloud credentials are required.

InfraSight uses a local SQLite file through the Go driver `modernc.org/sqlite`.

## Run Locally

Build the frontend first. Vite outputs directly into `backend/dist`, which is the directory embedded by Go.

```powershell
cd web
npm install
npm run build
cd ..
```

Run the backend:

```powershell
cd backend
go run .
```

Open:

```text
http://localhost:8080
```

## Run With Example Data

```powershell
cd backend
$env:INFRA_STATE_FILE = "..\examples\mock-multicloud.json"
go run .
```

## Build Single Binary

```powershell
cd web
npm run build
cd ..
cd backend
go build -buildvcs=false -o infrasight.exe .
```

Then run:

```powershell
.\infrasight.exe
```

## Configuration

Environment variables:

- `PORT`: HTTP port. Defaults to `8080`.
- `INFRA_STATE_FILE`: optional path to a Terraform state or mock JSON snapshot.
- `INFRASIGHT_DB`: optional SQLite file path. Defaults to `backend/infrasight.db` when running from `backend`.

## API

Core:

- `GET /api/health`
- `GET /api/snapshot`
- `GET /api/export`
- `POST /api/validate`

Cost and policy:

- `GET /api/pricing`
- `GET /api/policies`
- `GET /api/score`
- `GET /api/report.md`

Automation:

- `GET /api/automation/actions`
- `GET /api/actions`
- `POST /api/actions`
- `PATCH /api/actions/:id/state`
- `GET /api/plans`
- `POST /api/plans`
- `GET /api/runbooks`
- `POST /api/runbooks`

Observability:

- `GET /api/observability`

## Local Data Model

Snapshots use this shape:

```json
{
  "generatedAt": "2026-05-02T00:00:00Z",
  "resources": [],
  "edges": [],
  "findings": []
}
```

Resources include provider, status, region, environment, owner, criticality, instance class, monthly cost, and optional tags.

Actions include:

- provider and scenario
- lifecycle state
- Terraform snippet
- provider CLI snippet
- GitHub Actions snippet
- GitLab CI snippet
- dry-run summary, changes, and risks

## DevOps Flow

1. Import or load a local state file.
2. Review topology grouped by provider.
3. Inspect cost, governance score, findings, and observability signals.
4. Open an action and review the dry-run.
5. Move the action through `suggested`, `approved`, `queued`, `executed`, or `failed`.
6. Build and save a pipeline plan.
7. Export a JSON snapshot or Markdown governance report.

## Development Commands

Frontend:

```powershell
cd web
npm run lint
npm run build
```

Backend:

```powershell
cd backend
$env:GOCACHE = (Join-Path (Get-Location) ".gocache")
go test ./...
go build -buildvcs=false -o infrasight.exe .
```

Use the local `GOCACHE` command if Windows blocks writes to the default Go cache under `AppData`.

## Notes

- Cloud integrations are intentionally mocked and local-first. InfraSight does not call AWS, Azure, or GCP APIs.
- Generated Terraform, CLI, GitHub Actions, and GitLab CI snippets are dry-run scaffolds for review and adaptation.
- SQLite is used only for local persistence of plans, runbooks, and action states.
- The topology planner currently stores planned links in browser state; persisted topology plans can be added on top of `/api/plans`.

## Troubleshooting

If `go build` fails with VCS stamping errors:

```powershell
go build -buildvcs=false -o infrasight.exe .
```

If Go cannot write to the default cache:

```powershell
$env:GOCACHE = (Join-Path (Get-Location) ".gocache")
go test ./...
```

If the UI serves old assets, rebuild the frontend:

```powershell
cd web
npm run build
```

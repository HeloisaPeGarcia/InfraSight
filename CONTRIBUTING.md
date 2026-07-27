# 🤝 Contributing to InfraSight

Thank you for your interest in contributing to **InfraSight**! This document provides guidelines and instructions for contributing to the project.

We welcome contributions of all kinds: bug reports, feature requests, documentation improvements, code enhancements, and more.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Code Style & Standards](#code-style--standards)
- [Documentation](#documentation)
- [Common Issues & Troubleshooting](#common-issues--troubleshooting)

---

## 🎯 Code of Conduct

By participating in this project, you agree to:

- **Be respectful** in all interactions
- **Be inclusive** and welcome diverse perspectives
- **Report violations** by contacting project maintainers privately
- **Assume good intent** in discussions and feedback

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Go** 1.25+ ([Download](https://go.dev/doc/install))
- **Node.js** v18+ and **npm** 9+ ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))
- **SQLite3** (optional, for local testing)

### Fork & Clone

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:

```bash
git clone https://github.com/YOUR-USERNAME/InfraSight.git
cd InfraSight
```

3. **Add upstream remote** to keep in sync:

```bash
git remote add upstream https://github.com/HeloisaPeGarcia/InfraSight.git
git fetch upstream
```

---

## 💻 Development Setup

### 1. Install Frontend Dependencies

```bash
cd web
npm install
cd ..
```

### 2. Install Go Dependencies

```bash
cd backend
go mod download
cd ..
```

### 3. Build Frontend Assets

```bash
cd web
npm run build
cd ..
```

### 4. Run Development Server

**Option A: Backend + Frontend Built-in**
```bash
cd backend
go run .
```
Browse to: `http://localhost:8080`

**Option B: Frontend Dev Server + Backend (Hot-reload)**

Terminal 1 - Frontend:
```bash
cd web
npm run dev
```

Terminal 2 - Backend:
```bash
cd backend
go run .
```

> The React app runs on `http://localhost:5173` (Vite), while Go serves on `http://localhost:8080`. Update your proxy settings in `vite.config.ts` if needed.

### 5. Load Test Data

```bash
cd backend
INFRA_STATE_FILE="../examples/mock-multicloud.json" go run .
```

---

## 📁 Project Structure

```
InfraSight/
├── backend/               # Go backend (Fiber HTTP server, core engines)
│   ├── main.go
│   ├── go.mod             # Go dependencies
│   ├── handlers/          # HTTP request handlers (/api/*)
│   ├── models/            # Data structures & domain models
│   ├── services/          # Business logic (parser, policies, drift, etc.)
│   └── storage/           # SQLite persistence layer
│
├── web/                   # React frontend (Vite, TypeScript)
│   ├── package.json       # Node dependencies
│   ├── vite.config.ts     # Vite build configuration
│   ├── tsconfig.json      # TypeScript configuration
│   ├── eslint.config.js   # Linting rules
│   ├── index.html         # HTML entry point
│   └── src/
│       ├── App.tsx        # Root React component
│       ├── components/    # Reusable React components
│       ├── views/         # Page-level components
│       ├── services/      # API client (api.ts)
│       └── styles/        # Global CSS & component styles
│
├── examples/              # Sample state files & JSON snapshots
│   └── mock-multicloud.json
│
└── CONTRIBUTING.md        # This file
```

### Key Directory Purposes

| Directory | Purpose |
| :--- | :--- |
| `backend/handlers/` | HTTP endpoints, request validation, error handling |
| `backend/models/` | Resource types (EC2, RDS, etc.), policy findings, cost models |
| `backend/services/` | Parser, policy engine, drift detection, remediation generation |
| `backend/storage/` | Database schema, query builders, persistence logic |
| `web/components/` | SVG Canvas, UI widgets, forms, modals |
| `web/views/` | Full-page components (Topology, Governance, Drift, Automation) |
| `web/services/api.ts` | Centralized HTTP client with error boundaries |

---

## 🔧 Making Changes

### Create a Feature Branch

Use descriptive branch names following this convention:

```bash
git checkout -b <type>/<short-description>
```

**Examples:**
- `feature/opa-policy-integration` — New feature
- `fix/canvas-zoom-lag` — Bug fix
- `docs/setup-guide` — Documentation
- `refactor/api-service-layer` — Code quality
- `perf/state-parser-optimization` — Performance improvement
- `test/governance-scoring` — Tests only

### Commit Message Convention

Follow conventional commits for clarity and automatic changelog generation:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

**Scope:** `backend`, `web`, `parser`, `policies`, `canvas`, `api`, `storage`, etc.

**Examples:**

```
feat(parser): support Azure Resource Manager state files

- Add ARM template parsing logic
- Normalize resources to common topology model
- Add unit tests for ARM resources

Closes #42
```

```
fix(canvas): prevent memory leak on zoom event listeners

- Properly unsubscribe from resize observer on component unmount
- Add cleanup in useEffect dependencies

Fixes #123
```

---

## 🧪 Testing

### Backend Tests (Go)

```bash
cd backend
go test ./...                    # Run all tests
go test -v ./...                # Verbose output
go test -cover ./...            # Code coverage
go test -race ./...             # Race condition detection
```

**Writing Tests:**

- Test files: `*_test.go` in the same directory
- Use the `testing` package or popular assertion libraries
- Aim for >70% code coverage in core engines
- Test both happy path and error cases

**Example:**
```go
func TestPolicyEvaluation(t *testing.T) {
    // Arrange
    resource := NewEC2Instance(...)
    
    // Act
    findings := EvaluatePolicy(resource)
    
    // Assert
    if len(findings) != 1 {
        t.Errorf("expected 1 finding, got %d", len(findings))
    }
}
```

### Frontend Tests (TypeScript/React)

```bash
cd web
npm run lint                     # ESLint check
npm run build                    # TypeScript type-check + build
```

**Future:** Vitest/Jest setup recommended for component tests.

### Manual Testing Checklist

- [ ] Start fresh build: `npm run build && go build -o infrasight .`
- [ ] Test with provided example: `INFRA_STATE_FILE=examples/mock-multicloud.json ./infrasight`
- [ ] Verify API endpoints with `curl` or Postman
- [ ] Check React console for errors (F12 → Console)
- [ ] Test in multiple browsers (Chrome, Firefox, Safari)

---

## 📤 Submitting Changes

### Before You Push

1. **Sync with upstream:**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests & linters:**
   ```bash
   cd backend && go test ./... && cd ..
   cd web && npm run lint && cd ..
   ```

3. **Build production binary** (optional):
   ```bash
   cd web && npm run build && cd ..
   cd backend && go build -o infrasight . && cd ..
   ```

4. **Commit & push:**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   git push origin <your-branch-name>
   ```

### Creating a Pull Request

1. **Visit GitHub** and create a Pull Request from your fork to `HeloisaPeGarcia/InfraSight:main`

2. **Fill out the PR template:**

```markdown
## Description
Brief explanation of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change
- [ ] Documentation

## Related Issue
Closes #123

## Testing
- [ ] Added unit tests
- [ ] Manual testing completed
- [ ] No new warnings

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] No new TODOs without context
- [ ] Documentation updated (if applicable)
```

3. **Request reviews** from maintainers

4. **Address feedback** promptly and push updates

### PR Merge Criteria

Your PR will be merged when:

- ✅ Tests pass (CI/CD pipeline)
- ✅ Code review approved
- ✅ No conflicts with `main` branch
- ✅ At least 1 maintainer sign-off

---

## 📐 Code Style & Standards

### Go Backend

**Formatting:**
```bash
cd backend
go fmt ./...                    # Auto-format all Go files
```

**Linting (Recommended):**
```bash
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
golangci-lint run ./...
```

**Style Guide:**
- Use `CamelCase` for exported functions, `camelCase` for internal
- Keep functions small and focused (single responsibility)
- Error handling: `if err != nil { return fmt.Errorf(...) }`
- Meaningful variable names (no single letters except loops)
- Add comments for exported functions and non-obvious logic

**Example:**
```go
// ProcessTerraformState reads and normalizes a .tfstate file.
func ProcessTerraformState(filePath string) (*TopologyModel, error) {
    // Implementation
}
```

### TypeScript/React Frontend

**Formatting & Linting:**
```bash
cd web
npm run lint                    # ESLint check
npm run lint -- --fix          # Auto-fix issues
```

**Style Guide:**
- Use TypeScript for all new files (`.tsx`, `.ts`)
- Props should be typed interfaces: `interface MyProps { ... }`
- Functional components with hooks preferred
- Use `const` / `let`, avoid `var`
- JSX closing tags on separate lines for multi-line elements

**Example:**
```typescript
interface CanvasProps {
    resources: Resource[];
    onNodeSelect: (id: string) => void;
}

export const Canvas: React.FC<CanvasProps> = ({ resources, onNodeSelect }) => {
    return (
        <svg className="topology-canvas">
            {/* Implementation */}
        </svg>
    );
};
```

### CSS

**Conventions:**
- Use utility-first approach or scoped component styles
- Prefer CSS variables for theming: `var(--color-primary)`
- BEM naming for complex components: `.canvas__node`, `.canvas__node--selected`
- Mobile-first responsive design

**Example:**
```css
.topology-canvas {
    --node-size: 24px;
    
    display: flex;
    gap: 1rem;
}

.topology-canvas__node {
    width: var(--node-size);
    height: var(--node-size);
    border-radius: 50%;
}

.topology-canvas__node--selected {
    stroke: var(--color-primary);
    stroke-width: 2px;
}
```

---

## 📚 Documentation

### When to Update Documentation

- New API endpoint? → Update `README.md` API table
- New feature? → Add to "Features" section
- Architecture change? → Update architecture diagram
- Setup changes? → Update Quick Start Guide

### How to Document

**README Updates:**
```markdown
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/new-feature` | `GET` | Explain what it does. |
```

**Code Comments:**
```go
// ValidateSnapshot checks that JSON conforms to the topology schema.
// Returns an error if resources are missing required fields.
func ValidateSnapshot(data []byte) error {
    // Implementation
}
```

**Inline Explanations:**
```typescript
// Canvas positions use SVG coordinates (0,0 = top-left)
// We offset by half the node diameter to center nodes on drag
const adjustedX = clientX - (NODE_SIZE / 2);
```

---

## 🐛 Common Issues & Troubleshooting

### "Port 8080 already in use"

```bash
# Kill process on port 8080 (macOS/Linux)
lsof -ti:8080 | xargs kill -9

# Or use a different port (update in backend/main.go)
INFRA_PORT=8081 go run .
```

### "npm: command not found"

```bash
# Install Node.js & npm
curl https://nodejs.org/dist/v20.0.0/node-v20.0.0-darwin-x64.tar.xz | tar xz
export PATH=$PATH:./node-v20.0.0-darwin-x64/bin
```

### "go: unsupported Go version"

```bash
# Update Go to 1.25+
go install golang.org/dl/go1.25@latest
~/sdk/go1.25/bin/go version
```

### Frontend not loading when running backend

1. Check `vite.config.ts` proxy settings
2. Ensure `npm run build` completed successfully
3. Verify Go is serving static files: `curl http://localhost:8080/index.html`

### "sqlite: database is locked"

- SQLite may be locked if multiple processes access it
- Run only one Go instance at a time
- Or disable persistence by removing SQLite initialization

### TypeScript errors in VS Code

```bash
# Reload TypeScript language server
# VS Code: Cmd+Shift+P → TypeScript: Restart TS Server
```

---

## 🔍 Resources & References

- [Go Documentation](https://pkg.go.dev/)
- [React 19 Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Configuration](https://vitejs.dev/config/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Terraform State Format](https://developer.hashicorp.com/terraform/language/state)

---

## ❓ Questions?

- **Bug Reports**: [Open an Issue](https://github.com/HeloisaPeGarcia/InfraSight/issues)
- **Feature Requests**: [Discussions](https://github.com/HeloisaPeGarcia/InfraSight/discussions)
- **Questions**: Ask in PR or Issue comments

---

## 📜 License

By contributing to InfraSight, you agree that your contributions will be licensed under the **MIT License**.

---

**Thank you for contributing! 🙌 Your efforts make InfraSight better for everyone.**

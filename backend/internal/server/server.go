package server

import (
	"io/fs"
	"log"
	"net/http"
	"time"

	"infrasight/internal/automation"
	"infrasight/internal/config"
	"infrasight/internal/domain"
	"infrasight/internal/infra"
	"infrasight/internal/observability"
	"infrasight/internal/policy"
	"infrasight/internal/storage"
	"infrasight/internal/topology"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/filesystem"
)

type Server struct {
	app *fiber.App
	cfg config.Config
}

func New(webFS fs.FS) *Server {
	cfg := config.Load()
	app := fiber.New(fiber.Config{AppName: "InfraSight"})
	app.Use(func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		log.Printf(`{"method":"%s","path":"%s","status":%d,"duration_ms":%d}`, c.Method(), c.Path(), c.Response().StatusCode(), time.Since(start).Milliseconds())
		return err
	})
	store, err := storage.New(cfg.DB)
	if err != nil {
		panic(err)
	}

	app.Get("/api/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"ok": true, "service": "infrasight", "apiVersion": "v1"})
	})

	app.Get("/api/version", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"apiVersion": "v1", "app": "InfraSight"})
	})

	app.Get("/api/snapshot", func(c *fiber.Ctx) error {
		snapshot, err := infra.LoadSnapshot()
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		return c.JSON(snapshot)
	})

	app.Get("/api/pricing", func(c *fiber.Ctx) error {
		return c.JSON(infra.Pricing)
	})

	app.Get("/api/automation/actions", func(c *fiber.Ctx) error {
		snapshot, err := infra.LoadSnapshot()
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		return c.JSON(automation.Actions(snapshot))
	})

	app.Get("/api/observability", func(c *fiber.Ctx) error {
		snapshot, err := infra.LoadSnapshot()
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		return c.JSON(observability.Signals(snapshot))
	})

	app.Get("/api/policies", func(c *fiber.Ctx) error {
		return c.JSON(policy.Rules)
	})

	app.Post("/api/policies", func(c *fiber.Ctx) error {
		var payload map[string]any
		if err := c.BodyParser(&payload); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		if err := store.SavePolicy("default", payload); err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"ok": true})
	})

	app.Get("/api/score", func(c *fiber.Ctx) error {
		snapshot, err := infra.LoadSnapshot()
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		return c.JSON(policy.Score(snapshot))
	})

	app.Get("/api/report.md", func(c *fiber.Ctx) error {
		snapshot, err := infra.LoadSnapshot()
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		c.Set("Content-Type", "text/markdown")
		return c.SendString(policy.MarkdownReport(snapshot))
	})

	app.Post("/api/validate", func(c *fiber.Ctx) error {
		var snapshot domain.Snapshot
		if err := c.BodyParser(&snapshot); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		if err := topology.Validate(snapshot); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		return c.JSON(fiber.Map{"ok": true})
	})

	app.Get("/api/topology/layout/:id", func(c *fiber.Ctx) error {
		layout, err := store.GetTopologyLayout(c.Params("id"))
		if err != nil {
			return c.JSON(domain.TopologyLayout{ID: c.Params("id"), Positions: map[string]domain.Point{}})
		}
		return c.JSON(layout)
	})

	app.Post("/api/topology/layout/:id", func(c *fiber.Ctx) error {
		var layout domain.TopologyLayout
		if err := c.BodyParser(&layout); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		layout.ID = c.Params("id")
		if layout.Positions == nil {
			layout.Positions = map[string]domain.Point{}
		}
		if err := store.SaveTopologyLayout(layout); err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(layout)
	})

	app.Get("/api/drift", func(c *fiber.Ctx) error {
		snapshot, err := infra.LoadSnapshot()
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		return c.JSON(topology.MockDrift(snapshot))
	})

	app.Get("/api/plans", func(c *fiber.Ctx) error {
		plans, err := store.ListPlans()
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		if len(plans) == 0 {
			snapshot, err := infra.LoadSnapshot()
			if err != nil {
				return fiber.NewError(fiber.StatusBadRequest, err.Error())
			}
			plans = automation.DefaultPlans(snapshot)
		}
		return c.JSON(plans)
	})

	app.Post("/api/plans", func(c *fiber.Ctx) error {
		var plan domain.Plan
		if err := c.BodyParser(&plan); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		if plan.ID == "" {
			plan.ID = "plan-" + time.Now().UTC().Format("20060102150405")
		}
		if plan.State == "" {
			plan.State = "suggested"
		}
		if err := store.SavePlan(plan); err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(plan)
	})

	app.Get("/api/runbooks", func(c *fiber.Ctx) error {
		runbooks, err := store.ListRunbooks()
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		if len(runbooks) == 0 {
			snapshot, err := infra.LoadSnapshot()
			if err != nil {
				return fiber.NewError(fiber.StatusBadRequest, err.Error())
			}
			runbooks = automation.Runbooks(snapshot)
		}
		return c.JSON(runbooks)
	})

	app.Post("/api/runbooks", func(c *fiber.Ctx) error {
		var runbook domain.Runbook
		if err := c.BodyParser(&runbook); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		if runbook.ID == "" {
			runbook.ID = "runbook-" + time.Now().UTC().Format("20060102150405")
		}
		if err := store.SaveRunbook(runbook); err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(runbook)
	})

	app.Get("/api/actions", func(c *fiber.Ctx) error {
		actions, err := store.ListActions()
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		if len(actions) == 0 {
			snapshot, err := infra.LoadSnapshot()
			if err != nil {
				return fiber.NewError(fiber.StatusBadRequest, err.Error())
			}
			actions = automation.Actions(snapshot)
		}
		return c.JSON(actions)
	})

	app.Post("/api/actions", func(c *fiber.Ctx) error {
		var action domain.AutomationAction
		if err := c.BodyParser(&action); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		if action.State == "" {
			action.State = "suggested"
		}
		if err := store.SaveAction(action); err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(action)
	})

	app.Patch("/api/actions/:id/state", func(c *fiber.Ctx) error {
		var body struct {
			State string `json:"state"`
		}
		if err := c.BodyParser(&body); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		if err := store.UpdateActionState(c.Params("id"), body.State); err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"ok": true, "state": body.State})
	})

	app.Get("/api/export", func(c *fiber.Ctx) error {
		snapshot, err := infra.LoadSnapshot()
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		c.Set("Content-Disposition", "attachment; filename=infrasight-snapshot.json")
		return c.JSON(snapshot)
	})

	app.Use(filesystem.New(filesystem.Config{
		Root:         http.FS(webFS),
		NotFoundFile: "index.html",
	}))

	return &Server{app: app, cfg: cfg}
}

func (s *Server) Listen() error {
	return s.app.Listen(":" + s.cfg.Port)
}

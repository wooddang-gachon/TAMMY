// Package ai wraps Genkit flows behind a small, typed API.
//
// Every exported method is stateless: nothing about a user is retained between
// calls, which is what lets the service run on Cloud Run with any number of
// interchangeable instances.
package ai

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/firebase/genkit/go/ai"
	"github.com/firebase/genkit/go/genkit"
	"github.com/firebase/genkit/go/plugins/googlegenai"

	"github.com/yeongin-ji/tammy-ai-server/internal/apperr"
	"github.com/yeongin-ji/tammy-ai-server/internal/config"
	"github.com/yeongin-ji/tammy-ai-server/internal/media"
	"github.com/yeongin-ji/tammy-ai-server/prompts"
)

// Prompt names, matching the .prompt filenames under /prompts.
const (
	promptChat                = "chat"
	promptVisionFood          = "vision_food"
	promptNutritionResearch   = "nutrition_research"
	promptNutritionStructure  = "nutrition_structure"
	promptReportDiet          = "report_diet"
	promptReportMindfulness   = "report_mindfulness"
	promptReportLifestyle     = "report_lifestyle"
	promptReportHydration     = "report_hydration"
	promptReportRetrospective = "report_retrospective"
)

// allPrompts is verified at startup so a typo or malformed frontmatter fails
// the deploy rather than the first user request that touches it.
var allPrompts = []string{
	promptChat,
	promptVisionFood,
	promptNutritionResearch,
	promptNutritionStructure,
	promptReportDiet,
	promptReportMindfulness,
	promptReportLifestyle,
	promptReportHydration,
	promptReportRetrospective,
}

// Client executes the server's Genkit flows.
type Client struct {
	g        *genkit.Genkit
	cfg      *config.Config
	resolver *media.Resolver
}

// New initializes Genkit, loads the embedded prompts, and verifies every
// prompt resolves.
func New(ctx context.Context, cfg *config.Config) (*Client, error) {
	// WithPromptFS makes Init load the embedded templates instead of scanning
	// ./prompts on disk. Loading them a second time by hand would panic on
	// duplicate partial registration.
	g := genkit.Init(ctx,
		genkit.WithPlugins(&googlegenai.GoogleAI{APIKey: cfg.GeminiAPIKey}),
		genkit.WithDefaultModel(cfg.ChatModel),
		genkit.WithPromptFS(prompts.FS),
		// //go:embed *.prompt places the files at the FS root.
		genkit.WithPromptDir("."),
	)

	for _, name := range allPrompts {
		if genkit.LookupPrompt(g, name) == nil {
			return nil, fmt.Errorf("prompt %q failed to load", name)
		}
	}

	httpClient := &http.Client{Timeout: cfg.ImageFetchTimeout}

	return &Client{
		g:        g,
		cfg:      cfg,
		resolver: media.NewResolver(httpClient, cfg.MaxImageBytes),
	}, nil
}

// Genkit exposes the underlying instance for tests that need to inspect
// registered prompts.
func (c *Client) Genkit() *genkit.Genkit { return c.g }

// execute runs a prompt and decodes its structured output into out.
// extra carries per-call options such as media attachments or a model override.
func execute(ctx context.Context, g *genkit.Genkit, name string, input any, out any, extra ...ai.PromptExecuteOption) error {
	p := genkit.LookupPrompt(g, name)
	if p == nil {
		return apperr.ErrInternal.WithCause(fmt.Errorf("prompt %q not registered", name))
	}

	opts := append([]ai.PromptExecuteOption{ai.WithInput(input)}, extra...)

	resp, err := p.Execute(ctx, opts...)
	if err != nil {
		return wrapModelErr(name, err)
	}

	if out == nil {
		return nil
	}
	if err := resp.Output(out); err != nil {
		// The body is deliberately absent: report output can quote the user's
		// emotion diary verbatim, and these logs ship to Cloud Logging. The
		// prompt name and output length are enough to diagnose a schema drift.
		slog.Error("model output did not match schema",
			"prompt", name, "error", err, "output_len", len(resp.Text()))
		return apperr.ErrModelFailed.WithCause(fmt.Errorf("decode %s output: %w", name, err))
	}
	return nil
}

// executeText runs a prompt that returns free-form text rather than a schema.
func executeText(ctx context.Context, g *genkit.Genkit, name string, input any, extra ...ai.PromptExecuteOption) (string, error) {
	p := genkit.LookupPrompt(g, name)
	if p == nil {
		return "", apperr.ErrInternal.WithCause(fmt.Errorf("prompt %q not registered", name))
	}

	opts := append([]ai.PromptExecuteOption{ai.WithInput(input)}, extra...)

	resp, err := p.Execute(ctx, opts...)
	if err != nil {
		return "", wrapModelErr(name, err)
	}
	return resp.Text(), nil
}

// wrapModelErr converts a Genkit failure into the API error envelope,
// distinguishing timeouts so the service server can retry sensibly.
func wrapModelErr(prompt string, err error) error {
	if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled) {
		return apperr.ErrModelTimeout.WithCause(fmt.Errorf("%s: %w", prompt, err))
	}
	return apperr.ErrModelFailed.WithCause(fmt.Errorf("%s: %w", prompt, err))
}

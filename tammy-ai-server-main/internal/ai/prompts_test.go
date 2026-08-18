package ai

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/firebase/genkit/go/genkit"

	"github.com/yeongin-ji/tammy-ai-server/internal/config"
	"github.com/yeongin-ji/tammy-ai-server/internal/dto"
)

// newTestClient builds a Client exactly as production does, so these tests
// exercise the real initialization path. No model call is made, so the key is
// never used.
func newTestClient(t *testing.T) *Client {
	t.Helper()

	c, err := New(context.Background(), &config.Config{
		GeminiAPIKey:  "test-key-not-used",
		ChatModel:     "googleai/gemini-3.5-flash-lite",
		VisionModel:   "googleai/gemini-3.5-flash-lite",
		ReportModel:   "googleai/gemini-3.5-flash-lite",
		ResearchModel: "googleai/gemini-3.5-flash-lite",
		MaxImageBytes: 1 << 20,
	})
	if err != nil {
		t.Fatalf("client init failed: %v", err)
	}
	return c
}

// TestPromptsLoad guards the .prompt files: a malformed frontmatter block or a
// picoschema typo would otherwise only surface on the first live request.
func TestPromptsLoad(t *testing.T) {
	c := newTestClient(t)

	for _, name := range allPrompts {
		if genkit.LookupPrompt(c.Genkit(), name) == nil {
			t.Errorf("prompt %q did not load", name)
		}
	}
}

// TestInitFromModuleRootDoesNotDoubleLoad runs initialization from the
// directory that actually contains ./prompts on disk. Genkit's default
// behaviour is to scan that directory, which combined with the embedded FS
// would panic on a duplicate partial — the exact failure this guards against.
func TestInitFromModuleRootDoesNotDoubleLoad(t *testing.T) {
	root, err := filepath.Abs("../..")
	if err != nil {
		t.Fatalf("resolve module root: %v", err)
	}
	if _, err := os.Stat(filepath.Join(root, "prompts")); err != nil {
		t.Skipf("prompts directory not present at %s", root)
	}

	// Chdir is process-wide; t.Chdir restores it when the test finishes.
	t.Chdir(root)

	// A panic here is a real regression, so let it fail the test loudly.
	newTestClient(t)
}

// TestPromptsRender exercises the Handlebars templates, including the shared
// persona and report-rules partials, with representative input.
func TestPromptsRender(t *testing.T) {
	ctx := context.Background()
	g := newTestClient(t).Genkit()

	cases := []struct {
		prompt      string
		input       map[string]any
		wantPersona bool
		wantRules   bool
	}{
		{promptChat, map[string]any{"userMessage": "오늘 너무 지쳤어", "nickname": "우당탕탕", "history": "사용자: 안녕"}, true, false},
		{promptVisionFood, map[string]any{"mealType": "LUNCH"}, true, false},
		{promptNutritionResearch, map[string]any{"foodList": "- 김치찌개"}, false, false},
		{promptNutritionStructure, map[string]any{"foodList": "- 김치찌개", "research": "열량: 243"}, false, false},
		{promptReportDiet, map[string]any{"nickname": "우당탕탕", "period": "2026-08-01 ~ 2026-08-05", "density": densityGuide(dto.DensityThin), "data": "## 2026-08-05"}, true, true},
		{promptReportMindfulness, map[string]any{"nickname": "", "period": "", "density": "", "data": "# 감정일기"}, true, true},
		{promptReportLifestyle, map[string]any{"nickname": "", "period": "", "density": "", "data": "## 2026-08-05"}, true, true},
		{promptReportHydration, map[string]any{"nickname": "", "period": "", "density": "", "goal": 1500, "data": "## 2026-08-05"}, true, true},
		{promptReportRetrospective, map[string]any{"nickname": "", "period": "", "density": densityGuide(dto.DensityRich), "data": "# 대화 기록"}, true, true},
	}

	for _, tc := range cases {
		t.Run(tc.prompt, func(t *testing.T) {
			p := genkit.LookupPrompt(g, tc.prompt)
			if p == nil {
				t.Fatalf("prompt %q not registered", tc.prompt)
			}

			actionOpts, err := p.Render(ctx, tc.input)
			if err != nil {
				t.Fatalf("render failed: %v", err)
			}
			if len(actionOpts.Messages) == 0 {
				t.Fatal("rendered prompt produced no messages")
			}

			// The research prompt is the one flow that returns free-form text.
			if tc.prompt != promptNutritionResearch {
				if actionOpts.Output == nil || actionOpts.Output.JsonSchema == nil {
					t.Error("expected an output schema from the frontmatter")
				}
			}

			var rendered strings.Builder
			for _, m := range actionOpts.Messages {
				for _, part := range m.Content {
					rendered.WriteString(part.Text)
				}
			}
			text := rendered.String()

			// A missing partial renders as empty rather than erroring, so assert
			// on distinctive text from each partial.
			if tc.wantPersona && !strings.Contains(text, "작은 요정") {
				t.Error("persona partial did not render")
			}
			if tc.wantRules && !strings.Contains(text, "리포트 작성 규칙") {
				t.Error("report rules partial did not render")
			}

			// The density block lives inside the shared rules partial, so a
			// broken conditional there would silently drop the guidance.
			if guide, ok := tc.input["density"].(string); ok && guide != "" {
				if !strings.Contains(text, "이번 기록의 밀도") || !strings.Contains(text, guide) {
					t.Error("density guidance did not render")
				}
			}
		})
	}
}

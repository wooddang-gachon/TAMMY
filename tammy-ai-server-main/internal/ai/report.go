package ai

import (
	"context"
	"strings"

	"github.com/firebase/genkit/go/ai"

	"github.com/yeongin-ji/tammy-ai-server/internal/dto"
)

// maxRetrospectiveTurns is deliberately larger than maxHistoryTurns: the
// long-term review is supposed to see the whole arc of the relationship.
// It still needs a ceiling to stay inside the model's context window.
const maxRetrospectiveTurns = 400

// defaultWaterGoalML is used when the caller does not supply a target.
const defaultWaterGoalML = 1500

// DietReport reviews the user's eating habits day by day.
func (c *Client) DietReport(ctx context.Context, req dto.DietReportRequest) (*dto.ReportResponse, error) {
	return c.report(ctx, promptReportDiet, map[string]any{
		"nickname": strings.TrimSpace(req.Nickname),
		"period":   renderPeriod(req.Period),
		"density":  densityGuide(req.DataDensity),
		"data":     renderDiet(req.DailyRecords),
	})
}

// MindfulnessReport reviews the cycle's emotional record — quick taps,
// conversations, and diary entries — for patterns.
func (c *Client) MindfulnessReport(ctx context.Context, req dto.MindfulnessReportRequest) (*dto.ReportResponse, error) {
	return c.report(ctx, promptReportMindfulness, map[string]any{
		"nickname": strings.TrimSpace(req.Nickname),
		"period":   renderPeriod(req.Period),
		"density":  densityGuide(req.DataDensity),
		"data":     renderMindfulness(req),
	})
}

// LifestyleReport reviews movement, favouring frequent light activity.
func (c *Client) LifestyleReport(ctx context.Context, req dto.LifestyleReportRequest) (*dto.ReportResponse, error) {
	return c.report(ctx, promptReportLifestyle, map[string]any{
		"nickname": strings.TrimSpace(req.Nickname),
		"period":   renderPeriod(req.Period),
		"density":  densityGuide(req.DataDensity),
		"data":     renderExercise(req.ExerciseLogs, req.DailySteps),
	})
}

// HydrationReport reviews water intake and its role in metabolism.
func (c *Client) HydrationReport(ctx context.Context, req dto.HydrationReportRequest) (*dto.ReportResponse, error) {
	goal := req.DailyGoalML
	if goal <= 0 {
		goal = defaultWaterGoalML
	}
	return c.report(ctx, promptReportHydration, map[string]any{
		"nickname": strings.TrimSpace(req.Nickname),
		"period":   renderPeriod(req.Period),
		"density":  densityGuide(req.DataDensity),
		"goal":     goal,
		"data":     renderWater(req.WaterLogs, goal),
	})
}

// RetrospectiveReport reviews all four pillars over a long horizon. The service
// server publishes it monthly, so the period is normally one calendar month.
func (c *Client) RetrospectiveReport(ctx context.Context, req dto.RetrospectiveReportRequest) (*dto.ReportResponse, error) {
	return c.report(ctx, promptReportRetrospective, map[string]any{
		"nickname": strings.TrimSpace(req.Nickname),
		"period":   renderPeriod(req.Period),
		"density":  densityGuide(req.DataDensity),
		"data":     renderRetrospective(req),
	})
}

// report runs a report prompt and tidies the result. All five share this path
// because they differ only in prompt and input data.
func (c *Client) report(ctx context.Context, prompt string, input map[string]any) (*dto.ReportResponse, error) {
	var out dto.ReportResponse
	if err := execute(ctx, c.g, prompt, input, &out, ai.WithModelName(c.cfg.ReportModel)); err != nil {
		return nil, err
	}

	out.Title = strings.TrimSpace(out.Title)
	out.Markdown = strings.TrimSpace(out.Markdown)
	out.NextActionChecks = trimAll(out.NextActionChecks)
	return &out, nil
}

func trimAll(items []string) []string {
	out := make([]string, 0, len(items))
	for _, s := range items {
		if s = strings.TrimSpace(s); s != "" {
			out = append(out, s)
		}
	}
	return out
}

func orEmpty(s string) string {
	if strings.TrimSpace(s) == "" {
		return emptyRecords
	}
	return s
}

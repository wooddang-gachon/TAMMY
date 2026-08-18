package ai

import (
	"context"
	"net/url"
	"strings"

	"github.com/firebase/genkit/go/ai"

	"github.com/yeongin-ji/tammy-ai-server/internal/dto"
)

// LookupNutrition researches nutrition facts for the given foods.
//
// This runs in two passes on purpose. The first pass uses Gemini's Google
// Search tool, which cannot be combined with a constrained JSON schema; the
// second pass turns that free-form research into the response structure.
// Genkit does not surface groundingMetadata, so citations are recovered from
// the research text itself.
func (c *Client) LookupNutrition(ctx context.Context, req dto.NutritionLookupRequest) (*dto.NutritionLookupResponse, error) {
	names := dedupeNames(req.FoodNames)
	if len(names) == 0 {
		return &dto.NutritionLookupResponse{Items: []dto.NutritionItem{}}, nil
	}

	foodList := renderFoodList(names)

	research, err := executeText(ctx, c.g, promptNutritionResearch,
		map[string]any{"foodList": foodList},
		ai.WithModelName(c.cfg.ResearchModel),
	)
	if err != nil {
		return nil, err
	}

	var out dto.NutritionLookupResponse
	err = execute(ctx, c.g, promptNutritionStructure,
		map[string]any{"foodList": foodList, "research": research},
		&out,
		ai.WithModelName(c.cfg.ResearchModel),
	)
	if err != nil {
		return nil, err
	}

	out.Items = alignItems(names, out.Items)
	return &out, nil
}

// dedupeNames trims, drops blanks, and removes duplicates while preserving the
// caller's ordering.
func dedupeNames(names []string) []string {
	seen := make(map[string]bool, len(names))
	result := make([]string, 0, len(names))
	for _, n := range names {
		n = strings.TrimSpace(n)
		if n == "" || seen[n] {
			continue
		}
		seen[n] = true
		result = append(result, n)
	}
	return result
}

func renderFoodList(names []string) string {
	var b strings.Builder
	for i, n := range names {
		if i > 0 {
			b.WriteString("\n")
		}
		b.WriteString("- ")
		b.WriteString(n)
	}
	return b.String()
}

// alignItems guarantees exactly one item per requested food, in request order,
// so the caller can zip the response against its own list. Foods the model
// skipped come back with zeroed figures and zero confidence.
func alignItems(names []string, items []dto.NutritionItem) []dto.NutritionItem {
	byName := make(map[string]dto.NutritionItem, len(items))
	for _, it := range items {
		byName[strings.TrimSpace(it.Name)] = it
	}

	aligned := make([]dto.NutritionItem, 0, len(names))
	for _, name := range names {
		it, ok := byName[name]
		if !ok {
			aligned = append(aligned, dto.NutritionItem{
				Name:    name,
				Sources: []dto.NutritionSource{},
			})
			continue
		}
		it.Name = name
		it.Confidence = clamp01(it.Confidence)
		it.Sources = sanitizeSources(it.Sources)
		aligned = append(aligned, it)
	}
	return aligned
}

// sanitizeSources drops citations without a usable absolute URL, which is the
// cheapest guard against the model inventing references.
func sanitizeSources(sources []dto.NutritionSource) []dto.NutritionSource {
	cleaned := make([]dto.NutritionSource, 0, len(sources))
	for _, s := range sources {
		s.URL = strings.TrimSpace(s.URL)
		if s.URL == "" {
			continue
		}
		u, err := url.Parse(s.URL)
		if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" {
			continue
		}
		s.Title = strings.TrimSpace(s.Title)
		s.Publisher = strings.TrimSpace(s.Publisher)
		cleaned = append(cleaned, s)
	}
	return cleaned
}

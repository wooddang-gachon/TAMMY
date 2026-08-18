package ai

import (
	"context"
	"strings"

	"github.com/firebase/genkit/go/ai"

	"github.com/yeongin-ji/tammy-ai-server/internal/dto"
)

// boxScale is the coordinate range Gemini emits for box_2d.
const boxScale = 1000.0

// visionOutput mirrors the model's schema. It keeps Gemini's native box_2d
// format — [ymin, xmin, ymax, xmax] scaled 0-1000 — because asking directly
// for normalized x/y/width/height fights the model's training and produces
// badly degraded coordinates. Conversion happens here instead.
type visionOutput struct {
	IsIdentified bool             `json:"isIdentified"`
	Foods        []detectedFood2D `json:"foods"`
	Comment      string           `json:"comment"`
}

// detectedFood2D is one food as the model reports it, before conversion.
type detectedFood2D struct {
	Name string `json:"name"`
	// Box2D is [ymin, xmin, ymax, xmax] on a 0-1000 scale.
	Box2D      []int   `json:"box2d"`
	Confidence float64 `json:"confidence"`
}

// AnalyzeFood recognizes every food in an image and returns normalized
// bounding boxes for each one.
func (c *Client) AnalyzeFood(ctx context.Context, req dto.VisionAnalyzeRequest) (*dto.VisionAnalyzeResponse, error) {
	img, err := c.resolver.Resolve(ctx, req.ImageURL, req.ImageBase64)
	if err != nil {
		return nil, err
	}

	input := map[string]any{
		"mealType": strings.TrimSpace(req.MealType),
	}

	var raw visionOutput
	err = execute(ctx, c.g, promptVisionFood, input, &raw,
		ai.WithModelName(c.cfg.VisionModel),
		ai.WithMessages(ai.NewUserMessage(ai.NewMediaPart(img.MimeType, img.DataURI()))),
	)
	if err != nil {
		return nil, err
	}

	out := dto.VisionAnalyzeResponse{
		IsIdentified: raw.IsIdentified,
		Foods:        convertFoods(raw.Foods),
		Comment:      strings.TrimSpace(raw.Comment),
	}

	// The model occasionally claims success while returning nothing; keep the
	// flag and the payload consistent so the service server's fallback fires.
	if len(out.Foods) == 0 {
		out.IsIdentified = false
	}
	return &out, nil
}

// convertFoods maps the model's box_2d entries onto the public normalized
// bounding box, dropping entries that are unusable.
func convertFoods(foods []detectedFood2D) []dto.DetectedFood {
	cleaned := make([]dto.DetectedFood, 0, len(foods))
	for _, f := range foods {
		name := strings.TrimSpace(f.Name)
		if name == "" {
			continue
		}
		cleaned = append(cleaned, dto.DetectedFood{
			Name:        name,
			BoundingBox: boxFrom2D(f.Box2D),
			Confidence:  clamp01(f.Confidence),
		})
	}
	return cleaned
}

// boxFrom2D converts [ymin, xmin, ymax, xmax] on a 0-1000 scale into the
// normalized origin-plus-size box the API exposes. A malformed array yields
// the zero box rather than an error, since the food name is still useful.
func boxFrom2D(box []int) dto.BoundingBox {
	if len(box) != 4 {
		return dto.BoundingBox{}
	}

	yMin, xMin, yMax, xMax := box[0], box[1], box[2], box[3]
	// The model sometimes swaps the pairs; ordering matters more than which
	// corner it meant.
	if yMin > yMax {
		yMin, yMax = yMax, yMin
	}
	if xMin > xMax {
		xMin, xMax = xMax, xMin
	}

	return clampBox(dto.BoundingBox{
		X:      float64(xMin) / boxScale,
		Y:      float64(yMin) / boxScale,
		Width:  float64(xMax-xMin) / boxScale,
		Height: float64(yMax-yMin) / boxScale,
	})
}

// clampBox keeps the origin inside [0,1] and trims width/height so the box
// never extends past the image edge.
func clampBox(b dto.BoundingBox) dto.BoundingBox {
	b.X = clamp01(b.X)
	b.Y = clamp01(b.Y)
	b.Width = clamp01(b.Width)
	b.Height = clamp01(b.Height)

	if b.X+b.Width > 1 {
		b.Width = 1 - b.X
	}
	if b.Y+b.Height > 1 {
		b.Height = 1 - b.Y
	}
	return b
}

func clamp01(v float64) float64 {
	if v < 0 {
		return 0
	}
	if v > 1 {
		return 1
	}
	return v
}

package dto

// VisionAnalyzeRequest is the payload for food image recognition.
// Exactly one of ImageURL or ImageBase64 must be supplied.
type VisionAnalyzeRequest struct {
	// Publicly reachable image URL. Mutually exclusive with imageBase64.
	ImageURL string `json:"imageUrl,omitempty" example:"https://storage.googleapis.com/tammy/meal_1.jpg"`
	// Base64 encoded image bytes. A `data:` URI prefix is accepted and stripped.
	ImageBase64 string `json:"imageBase64,omitempty"`
	// Optional meal context that helps disambiguate similar dishes.
	// One of BREAKFAST, LUNCH, DINNER, SNACK.
	MealType string `json:"mealType,omitempty" example:"LUNCH"`
}

// BoundingBox locates a food item within the image using normalized coordinates.
// All values are in the range [0, 1] relative to image width/height, so the
// client can scale them to any rendered size.
type BoundingBox struct {
	X      float64 `json:"x" example:"0.12"`
	Y      float64 `json:"y" example:"0.30"`
	Width  float64 `json:"width" example:"0.44"`
	Height float64 `json:"height" example:"0.38"`
}

// DetectedFood is a single food item recognized in the image.
type DetectedFood struct {
	// Korean food name, as the user would call it.
	Name string `json:"name" example:"김치찌개"`
	// Normalized location of this item in the image.
	BoundingBox BoundingBox `json:"boundingBox"`
	// Model confidence in the range [0, 1].
	Confidence float64 `json:"confidence" example:"0.92"`
}

// VisionAnalyzeResponse is the result of food image recognition.
type VisionAnalyzeResponse struct {
	// False when no food could be recognized; the service server then shows
	// its manual-input fallback UI.
	IsIdentified bool `json:"isIdentified" example:"true"`
	// Every food item found, in reading order. Empty when isIdentified is false.
	Foods []DetectedFood `json:"foods"`
	// A short Tammy-voice remark about the meal.
	Comment string `json:"comment" example:"오늘 점심 든든하게 챙겼구나, 좋다!"`
}

package dto

// NutritionLookupRequest asks for nutrition facts for a set of foods.
type NutritionLookupRequest struct {
	// Food names to research. Must contain at least one entry.
	FoodNames []string `json:"foodNames" binding:"required,min=1,dive,required" example:"김치찌개,공기밥"`
}

// NutritionSource cites where a nutrition figure came from.
type NutritionSource struct {
	Title     string `json:"title" example:"식품영양성분 데이터베이스 - 김치찌개"`
	URL       string `json:"url" example:"https://various.foodsafetykorea.go.kr/nutrient/"`
	Publisher string `json:"publisher,omitempty" example:"식품의약품안전처"`
}

// NutritionItem holds researched nutrition facts for one food.
type NutritionItem struct {
	Name string `json:"name" example:"김치찌개"`
	// Serving the figures below describe, in grams.
	ServingSizeG float64 `json:"servingSizeG" example:"400"`

	CaloriesKcal   float64 `json:"caloriesKcal" example:"243"`
	CarbohydrateG  float64 `json:"carbohydrateG" example:"12.4"`
	ProteinG       float64 `json:"proteinG" example:"15.2"`
	FatG           float64 `json:"fatG" example:"13.8"`
	VitaminPercent int     `json:"vitaminPercent" example:"35"`
	MineralPercent int     `json:"mineralPercent" example:"42"`

	// Where the figures came from. May be empty when the model fell back to
	// general knowledge, in which case Confidence will be low.
	Sources []NutritionSource `json:"sources"`
	// Model confidence in the range [0, 1].
	Confidence float64 `json:"confidence" example:"0.81"`
}

// NutritionLookupResponse returns one item per requested food name.
type NutritionLookupResponse struct {
	Items []NutritionItem `json:"items"`
}

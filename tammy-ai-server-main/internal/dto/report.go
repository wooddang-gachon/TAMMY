package dto

// ReportResponse is the shared envelope for all five reports.
// Markdown is the report body; Title and NextActionChecks map directly onto
// the service server's summaryTitle / nextActionChecks fields.
type ReportResponse struct {
	Title string `json:"title" example:"우당탕탕님의 이번 주 식습관 이야기 🌱"`
	// The report body as a Markdown string, written in Tammy's voice.
	Markdown string `json:"markdown"`
	// Short, concrete, opt-in suggestions. Never phrased as commands.
	NextActionChecks []string `json:"nextActionChecks" example:"내일 아침엔 물 한 잔부터 시작해볼까?"`
}

// Period bounds a report. Both are RFC3339 dates or timestamps.
type Period struct {
	Start string `json:"start,omitempty" example:"2026-07-29"`
	End   string `json:"end,omitempty" example:"2026-08-05"`
}

// Data density buckets. The service server counts the activities behind a
// report and labels it, so a short cycle reads as "short and sweet" instead of
// as a thin report. Omit the field to let the model judge from the data alone.
const (
	DensityThin   = "thin"   // fewer than 5 activities
	DensityNormal = "normal" // 5 to 20
	DensityRich   = "rich"   // more than 20
)

// ---------- 식습관 (diet) ----------

// FoodEntry is one food inside a meal.
type FoodEntry struct {
	Name          string  `json:"name" example:"김치찌개"`
	CaloriesKcal  float64 `json:"caloriesKcal" example:"243"`
	CarbohydrateG float64 `json:"carbohydrateG" example:"12.4"`
	ProteinG      float64 `json:"proteinG" example:"15.2"`
	FatG          float64 `json:"fatG" example:"13.8"`
}

// MealEntry is one meal occasion.
type MealEntry struct {
	// One of BREAKFAST, LUNCH, DINNER, SNACK.
	MealType string `json:"mealType" example:"LUNCH"`
	// RFC3339 timestamp of the meal, optional.
	RegisteredAt string      `json:"registeredAt,omitempty" example:"2026-08-05T12:30:00Z"`
	Foods        []FoodEntry `json:"foods"`
}

// DailyDietRecord groups every meal logged on one date.
type DailyDietRecord struct {
	Date  string      `json:"date" example:"2026-08-05"`
	Meals []MealEntry `json:"meals"`
}

// DietReportRequest carries the user's meal history grouped by date.
type DietReportRequest struct {
	UserID       int64             `json:"userId" binding:"required" example:"12"`
	Nickname     string            `json:"nickname,omitempty" example:"우당탕탕"`
	Period       Period            `json:"period"`
	DataDensity  string            `json:"dataDensity,omitempty" binding:"omitempty,oneof=thin normal rich" example:"normal"`
	DailyRecords []DailyDietRecord `json:"dailyRecords" binding:"required"`
}

// ---------- 마음챙김 (mindfulness) ----------

// EmotionRecord is one quick-button emotion tap.
type EmotionRecord struct {
	// One of HAPPY, SAD, ANGRY, STRESSED, CALM.
	Emotion string `json:"emotion" binding:"required,oneof=HAPPY SAD ANGRY STRESSED CALM" example:"STRESSED"`
	// RFC3339 timestamp, optional; lets the report comment on timing.
	RecordedAt string `json:"recordedAt,omitempty" example:"2026-08-05T21:00:00+09:00"`
}

// EmotionDiary is one diary entry written by the user.
//
// Content is the user's own words and is the most sensitive input this server
// handles. It is never logged, and diaryId is deliberately not shown to the
// model so it cannot leak into the report body.
type EmotionDiary struct {
	DiaryID int64  `json:"diaryId,omitempty" example:"331"`
	Date    string `json:"date,omitempty" example:"2026-08-05"`
	// One of HAPPY, SAD, ANGRY, STRESSED, CALM.
	Mood    string `json:"mood,omitempty" example:"STRESSED"`
	Content string `json:"content" binding:"required" example:"오늘은 프로젝트 마감이 다가와서 부담이 컸다."`
}

// MindfulnessReportRequest carries everything the user expressed emotionally
// during the cycle — quick taps, conversations, and diary entries — to be
// reviewed psychologically: mood shifts, hard days, emotional eating signals.
//
// All three sources are optional; send whichever the user actually produced.
type MindfulnessReportRequest struct {
	UserID      int64  `json:"userId" binding:"required" example:"12"`
	Nickname    string `json:"nickname,omitempty" example:"우당탕탕"`
	Period      Period `json:"period"`
	DataDensity string `json:"dataDensity,omitempty" binding:"omitempty,oneof=thin normal rich" example:"normal"`
	// Prior turns in chronological order, oldest first.
	ChatLogs []ChatTurn `json:"chatLogs,omitempty"`
	// Quick-button taps, which carry an emotion but no text.
	EmotionRecords []EmotionRecord `json:"emotionRecords,omitempty"`
	// Diary entries, oldest first.
	Diaries []EmotionDiary `json:"diaries,omitempty"`
}

// ---------- 생활습관 (lifestyle) ----------

// ExerciseEntry is one logged activity.
type ExerciseEntry struct {
	Date               string  `json:"date" example:"2026-08-05"`
	ExerciseName       string  `json:"exerciseName,omitempty" example:"걷기"`
	DurationMinutes    int     `json:"durationMinutes" example:"25"`
	BurnedCaloriesKcal float64 `json:"burnedCaloriesKcal" example:"96"`
	IsCompleted        bool    `json:"isCompleted" example:"true"`
}

// LifestyleReportRequest carries movement/activity history. The report
// emphasises frequent light movement over intense workouts.
type LifestyleReportRequest struct {
	UserID       int64           `json:"userId" binding:"required" example:"12"`
	Nickname     string          `json:"nickname,omitempty" example:"우당탕탕"`
	Period       Period          `json:"period"`
	DataDensity  string          `json:"dataDensity,omitempty" binding:"omitempty,oneof=thin normal rich" example:"normal"`
	ExerciseLogs []ExerciseEntry `json:"exerciseLogs" binding:"required"`
	// Optional step counts by date, when the client can supply them.
	DailySteps map[string]int `json:"dailySteps,omitempty"`
}

// ---------- 수분 (hydration) ----------

// WaterEntry is one water intake record.
type WaterEntry struct {
	Date string `json:"date" example:"2026-08-05"`
	// RFC3339 timestamp, optional; lets the report comment on timing.
	RecordedAt string `json:"recordedAt,omitempty" example:"2026-08-05T09:10:00Z"`
	IntakeML   int    `json:"intakeMl" example:"250"`
}

// HydrationReportRequest carries water intake history.
type HydrationReportRequest struct {
	UserID      int64        `json:"userId" binding:"required" example:"12"`
	Nickname    string       `json:"nickname,omitempty" example:"우당탕탕"`
	Period      Period       `json:"period"`
	DataDensity string       `json:"dataDensity,omitempty" binding:"omitempty,oneof=thin normal rich" example:"normal"`
	WaterLogs   []WaterEntry `json:"waterLogs" binding:"required"`
	// Daily target in millilitres. Defaults to 1500 when omitted.
	DailyGoalML int `json:"dailyGoalMl,omitempty" example:"1500"`
}

// ---------- 장기 회고 (retrospective) ----------

// RetrospectiveReportRequest carries the full history across all four pillars
// for a wellness-wide review. The service server publishes this monthly, so
// Period is normally one calendar month.
type RetrospectiveReportRequest struct {
	UserID       int64             `json:"userId" binding:"required" example:"12"`
	Nickname     string            `json:"nickname,omitempty" example:"우당탕탕"`
	Period       Period            `json:"period"`
	DataDensity  string            `json:"dataDensity,omitempty" binding:"omitempty,oneof=thin normal rich" example:"rich"`
	ChatLogs     []ChatTurn        `json:"chatLogs"`
	DailyRecords []DailyDietRecord `json:"dailyRecords,omitempty"`
	ExerciseLogs []ExerciseEntry   `json:"exerciseLogs,omitempty"`
	WaterLogs    []WaterEntry      `json:"waterLogs,omitempty"`
	// Emotional inputs, mirroring the mindfulness report.
	EmotionRecords []EmotionRecord `json:"emotionRecords,omitempty"`
	Diaries        []EmotionDiary  `json:"diaries,omitempty"`
}

package ai

import (
	"strings"
	"testing"

	"github.com/yeongin-ji/tammy-ai-server/internal/dto"
)

func TestRenderDietSortsAndTotals(t *testing.T) {
	got := renderDiet([]dto.DailyDietRecord{
		{
			Date: "2026-08-05",
			Meals: []dto.MealEntry{{
				MealType: "DINNER",
				Foods: []dto.FoodEntry{
					{Name: "김치찌개", CaloriesKcal: 243},
					{Name: "공기밥", CaloriesKcal: 300},
				},
			}},
		},
		{
			Date:  "2026-08-01",
			Meals: []dto.MealEntry{{MealType: "BREAKFAST", Foods: []dto.FoodEntry{{Name: "토스트", CaloriesKcal: 150}}}},
		},
	})

	if idx1, idx5 := strings.Index(got, "2026-08-01"), strings.Index(got, "2026-08-05"); idx1 > idx5 {
		t.Error("days should be rendered oldest first")
	}
	if !strings.Contains(got, "약 543kcal") {
		t.Errorf("per-day total missing or wrong:\n%s", got)
	}
	if !strings.Contains(got, "저녁") || !strings.Contains(got, "아침") {
		t.Errorf("meal types should be localized:\n%s", got)
	}
}

func TestRenderDietEmpty(t *testing.T) {
	if got := renderDiet(nil); got != emptyRecords {
		t.Errorf("empty diet = %q, want %q", got, emptyRecords)
	}
}

func TestRenderDietDayWithoutMeals(t *testing.T) {
	got := renderDiet([]dto.DailyDietRecord{{Date: "2026-08-05"}})
	if !strings.Contains(got, "식사 기록이 없어") {
		t.Errorf("a logged day with no meals should say so:\n%s", got)
	}
}

func TestRenderWaterTotalsAndGoal(t *testing.T) {
	got := renderWater([]dto.WaterEntry{
		{Date: "2026-08-05", IntakeML: 250, RecordedAt: "2026-08-05T09:00:00Z"},
		{Date: "2026-08-05", IntakeML: 500},
		{Date: "2026-08-04", IntakeML: 300},
	}, 1500)

	if !strings.Contains(got, "총 750ml (2회)") {
		t.Errorf("daily total or count wrong:\n%s", got)
	}
	if !strings.Contains(got, "목표 1500ml 대비 50%") {
		t.Errorf("goal percentage missing:\n%s", got)
	}
	if idx4, idx5 := strings.Index(got, "2026-08-04"), strings.Index(got, "2026-08-05"); idx4 > idx5 {
		t.Error("days should be sorted oldest first")
	}
}

func TestRenderWaterWithoutGoalOmitsPercentage(t *testing.T) {
	got := renderWater([]dto.WaterEntry{{Date: "2026-08-05", IntakeML: 250}}, 0)
	if strings.Contains(got, "대비") {
		t.Errorf("no goal supplied, so no percentage should appear:\n%s", got)
	}
}

func TestRenderExerciseMergesStepsAndLogs(t *testing.T) {
	got := renderExercise(
		[]dto.ExerciseEntry{
			{Date: "2026-08-05", ExerciseName: "걷기", DurationMinutes: 25, BurnedCaloriesKcal: 96, IsCompleted: true},
			{Date: "2026-08-04", DurationMinutes: 10, IsCompleted: false},
		},
		map[string]int{"2026-08-05": 8000, "2026-08-03": 3000},
	)

	if !strings.Contains(got, "걷기 25분") {
		t.Errorf("activity missing:\n%s", got)
	}
	if !strings.Contains(got, "완료하지 못함") {
		t.Errorf("incomplete activity should be marked:\n%s", got)
	}
	if !strings.Contains(got, "8000보") {
		t.Errorf("step count missing:\n%s", got)
	}
	// A steps-only date must still appear, since gaps matter to the report.
	if !strings.Contains(got, "2026-08-03") {
		t.Errorf("date present only in steps was dropped:\n%s", got)
	}
}

func TestRenderExerciseEmpty(t *testing.T) {
	if got := renderExercise(nil, nil); got != emptyRecords {
		t.Errorf("empty exercise = %q, want %q", got, emptyRecords)
	}
}

func TestRenderPeriod(t *testing.T) {
	tests := []struct {
		in   dto.Period
		want string
	}{
		{dto.Period{Start: "2026-08-01", End: "2026-08-05"}, "2026-08-01 ~ 2026-08-05"},
		{dto.Period{Start: "2026-08-01"}, "2026-08-01 ~"},
		{dto.Period{End: "2026-08-05"}, "~ 2026-08-05"},
		{dto.Period{}, ""},
	}

	for _, tt := range tests {
		if got := renderPeriod(tt.in); got != tt.want {
			t.Errorf("renderPeriod(%+v) = %q, want %q", tt.in, got, tt.want)
		}
	}
}

// retrospectiveSections are every heading renderRetrospective must emit.
var retrospectiveSections = []string{
	"# 대화 기록", "# 감정 기록 (퀵버튼)", "# 감정일기",
	"# 식사 기록", "# 활동 기록", "# 수분 기록",
}

func TestRenderRetrospectiveIncludesAllPillars(t *testing.T) {
	got := renderRetrospective(dto.RetrospectiveReportRequest{
		ChatLogs:       []dto.ChatTurn{{Role: dto.RoleUser, Text: "힘들어"}},
		EmotionRecords: []dto.EmotionRecord{{Emotion: "STRESSED", RecordedAt: "2026-08-05T21:00:00+09:00"}},
		Diaries:        []dto.EmotionDiary{{Date: "2026-08-05", Mood: "STRESSED", Content: "부담이 컸다"}},
		DailyRecords:   []dto.DailyDietRecord{{Date: "2026-08-05"}},
		ExerciseLogs:   []dto.ExerciseEntry{{Date: "2026-08-05", DurationMinutes: 10}},
		WaterLogs:      []dto.WaterEntry{{Date: "2026-08-05", IntakeML: 250}},
	})

	for _, section := range retrospectiveSections {
		if !strings.Contains(got, section) {
			t.Errorf("missing section %q:\n%s", section, got)
		}
	}
}

func TestRenderRetrospectiveHandlesMissingPillars(t *testing.T) {
	got := renderRetrospective(dto.RetrospectiveReportRequest{})

	// Every section must still be present, marked empty, so the model knows
	// the data is absent rather than silently assuming it.
	if strings.Count(got, emptyRecords) != len(retrospectiveSections) {
		t.Errorf("every section should be marked empty:\n%s", got)
	}
}

func TestRenderMindfulnessIncludesAllSources(t *testing.T) {
	got := renderMindfulness(dto.MindfulnessReportRequest{
		ChatLogs:       []dto.ChatTurn{{Role: dto.RoleUser, Text: "힘들어"}},
		EmotionRecords: []dto.EmotionRecord{{Emotion: "STRESSED", RecordedAt: "2026-08-05T21:00:00+09:00"}},
		Diaries:        []dto.EmotionDiary{{Date: "2026-08-05", Mood: "STRESSED", Content: "부담이 컸다"}},
	})

	for _, want := range []string{"# 감정 기록 (퀵버튼)", "# 대화 기록", "# 감정일기", "부담이 컸다"} {
		if !strings.Contains(got, want) {
			t.Errorf("missing %q:\n%s", want, got)
		}
	}
}

// The diary id is an internal identifier with no use to the model, so it must
// never reach the prompt — that is what keeps it out of the report body.
func TestRenderDiariesOmitsDiaryID(t *testing.T) {
	got := renderDiaries([]dto.EmotionDiary{
		{DiaryID: 90331, Date: "2026-08-05", Mood: "STRESSED", Content: "부담이 컸다"},
	})

	if strings.Contains(got, "90331") {
		t.Errorf("diary id leaked into the prompt:\n%s", got)
	}
	if !strings.Contains(got, "부담이 컸다") {
		t.Errorf("diary body missing:\n%s", got)
	}
}

func TestRenderEmotionRecordsCountsAndOrders(t *testing.T) {
	got := renderEmotionRecords([]dto.EmotionRecord{
		{Emotion: "HAPPY", RecordedAt: "2026-08-05T09:00:00+09:00"},
		{Emotion: "STRESSED", RecordedAt: "2026-08-05T21:00:00+09:00"},
		{Emotion: "STRESSED", RecordedAt: "2026-08-06T21:00:00+09:00"},
	})

	// Most frequent first, so the model reads the dominant emotion up front.
	if !strings.Contains(got, "전체: STRESSED 2회, HAPPY 1회") {
		t.Errorf("totals not ordered by frequency:\n%s", got)
	}
	if !strings.Contains(got, "2026-08-05 — HAPPY 1회, STRESSED 1회") {
		t.Errorf("daily breakdown missing or misordered:\n%s", got)
	}
}

func TestDensityGuideOnlyForThinAndRich(t *testing.T) {
	if densityGuide(dto.DensityNormal) != "" {
		t.Error("normal density should add no guidance")
	}
	if densityGuide("") != "" {
		t.Error("absent density should add no guidance")
	}
	if densityGuide(dto.DensityThin) == "" || densityGuide(dto.DensityRich) == "" {
		t.Error("thin and rich should both produce guidance")
	}
}

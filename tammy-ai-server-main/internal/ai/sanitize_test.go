package ai

import (
	"strings"
	"testing"

	"github.com/yeongin-ji/tammy-ai-server/internal/dto"
)

func TestClampBox(t *testing.T) {
	tests := []struct {
		name string
		in   dto.BoundingBox
		want dto.BoundingBox
	}{
		{
			name: "already valid",
			in:   dto.BoundingBox{X: 0.1, Y: 0.2, Width: 0.3, Height: 0.4},
			want: dto.BoundingBox{X: 0.1, Y: 0.2, Width: 0.3, Height: 0.4},
		},
		{
			name: "negative origin clamps to zero",
			in:   dto.BoundingBox{X: -0.5, Y: -0.2, Width: 0.3, Height: 0.4},
			want: dto.BoundingBox{X: 0, Y: 0, Width: 0.3, Height: 0.4},
		},
		{
			name: "overflowing box is trimmed to the edge",
			in:   dto.BoundingBox{X: 0.8, Y: 0.9, Width: 0.5, Height: 0.5},
			want: dto.BoundingBox{X: 0.8, Y: 0.9, Width: 0.2, Height: 0.1},
		},
		{
			name: "out of range dimensions clamp",
			in:   dto.BoundingBox{X: 0, Y: 0, Width: 3.2, Height: 1.7},
			want: dto.BoundingBox{X: 0, Y: 0, Width: 1, Height: 1},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := clampBox(tt.in)
			if !approxBox(got, tt.want) {
				t.Errorf("clampBox() = %+v, want %+v", got, tt.want)
			}
			if got.X+got.Width > 1.0001 || got.Y+got.Height > 1.0001 {
				t.Errorf("clampBox() produced a box outside the unit square: %+v", got)
			}
		})
	}
}

func TestBoxFrom2D(t *testing.T) {
	tests := []struct {
		name string
		in   []int
		want dto.BoundingBox
	}{
		{
			// Gemini emits [ymin, xmin, ymax, xmax] on a 0-1000 scale.
			name: "typical box",
			in:   []int{300, 120, 680, 560},
			want: dto.BoundingBox{X: 0.12, Y: 0.30, Width: 0.44, Height: 0.38},
		},
		{
			name: "full frame",
			in:   []int{0, 0, 1000, 1000},
			want: dto.BoundingBox{X: 0, Y: 0, Width: 1, Height: 1},
		},
		{
			name: "reversed pairs are normalized",
			in:   []int{680, 560, 300, 120},
			want: dto.BoundingBox{X: 0.12, Y: 0.30, Width: 0.44, Height: 0.38},
		},
		{
			name: "out of range values are clamped",
			in:   []int{-100, -50, 1400, 1200},
			want: dto.BoundingBox{X: 0, Y: 0, Width: 1, Height: 1},
		},
		{
			name: "wrong length yields the zero box",
			in:   []int{300, 120, 680},
			want: dto.BoundingBox{},
		},
		{
			name: "nil yields the zero box",
			in:   nil,
			want: dto.BoundingBox{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := boxFrom2D(tt.in)
			if !approxBox(got, tt.want) {
				t.Errorf("boxFrom2D(%v) = %+v, want %+v", tt.in, got, tt.want)
			}
		})
	}
}

func TestConvertFoods(t *testing.T) {
	got := convertFoods([]detectedFood2D{
		{Name: "  김치찌개  ", Box2D: []int{300, 120, 680, 560}, Confidence: 1.8},
		{Name: "   ", Box2D: []int{0, 0, 100, 100}, Confidence: 0.9},
		{Name: "공기밥", Box2D: []int{100, 100, 400, 400}, Confidence: -0.3},
		{Name: "국", Box2D: nil, Confidence: 0.7},
	})

	if len(got) != 3 {
		t.Fatalf("expected the blank-named entry to be dropped, got %d items", len(got))
	}
	if got[0].Name != "김치찌개" {
		t.Errorf("name not trimmed: %q", got[0].Name)
	}
	if got[0].Confidence != 1 {
		t.Errorf("confidence not clamped to 1: %v", got[0].Confidence)
	}
	if got[1].Confidence != 0 {
		t.Errorf("confidence not clamped to 0: %v", got[1].Confidence)
	}
	// A missing box must not discard the food name, which is still useful.
	if got[2].Name != "국" {
		t.Errorf("food with a malformed box should be retained, got %+v", got[2])
	}
}

func TestNormalizeEmotion(t *testing.T) {
	tests := []struct {
		name       string
		in         dto.EmotionStatus
		wantState  string
		wantMotion string
	}{
		{
			name:       "valid values pass through",
			in:         dto.EmotionStatus{State: "STRESSED", MotionType: "PAT_PAT_HEAD"},
			wantState:  "STRESSED",
			wantMotion: "PAT_PAT_HEAD",
		},
		{
			name:       "lowercase is upcased",
			in:         dto.EmotionStatus{State: "happy", MotionType: "jump_joy"},
			wantState:  "HAPPY",
			wantMotion: "JUMP_JOY",
		},
		{
			// COMFORTED appears in the service server's sample data but is not
			// in its EmotionState enum, so it must not pass through.
			name:       "value outside the service enum falls back to CALM",
			in:         dto.EmotionStatus{State: "COMFORTED", MotionType: "PAT_PAT_HEAD"},
			wantState:  "CALM",
			wantMotion: "PAT_PAT_HEAD",
		},
		{
			name:       "unknown motion falls back to one matching the state",
			in:         dto.EmotionStatus{State: "SAD", MotionType: "BREAKDANCE"},
			wantState:  "SAD",
			wantMotion: "HUG",
		},
		{
			name:       "empty input yields safe defaults",
			in:         dto.EmotionStatus{},
			wantState:  "CALM",
			wantMotion: "SIT_BESIDE",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := normalizeEmotion(tt.in)
			if got.State != tt.wantState {
				t.Errorf("state = %q, want %q", got.State, tt.wantState)
			}
			if got.MotionType != tt.wantMotion {
				t.Errorf("motionType = %q, want %q", got.MotionType, tt.wantMotion)
			}
		})
	}
}

func TestRenderHistoryTrimsToLimit(t *testing.T) {
	history := make([]dto.ChatTurn, 50)
	for i := range history {
		history[i] = dto.ChatTurn{Role: dto.RoleUser, Text: "메시지"}
	}
	history[49].Text = "마지막"
	history[0].Text = "처음"

	got := renderHistory(history, 10)

	if strings.Contains(got, "처음") {
		t.Error("oldest turn should have been trimmed away")
	}
	if !strings.Contains(got, "마지막") {
		t.Error("most recent turn must be retained")
	}
	if lines := strings.Count(got, "\n") + 1; lines != 10 {
		t.Errorf("expected 10 turns, got %d", lines)
	}
}

func TestRenderHistoryLabelsSpeakers(t *testing.T) {
	got := renderHistory([]dto.ChatTurn{
		{Role: dto.RoleUser, Text: "안녕"},
		{Role: dto.RoleTammy, Text: "반가워"},
		{Role: dto.RoleUser, Text: "   "}, // blank turns are skipped
	}, 10)

	if !strings.Contains(got, "사용자: 안녕") {
		t.Errorf("user turn mislabelled: %q", got)
	}
	if !strings.Contains(got, "타미: 반가워") {
		t.Errorf("tammy turn mislabelled: %q", got)
	}
	if strings.Count(got, "\n") != 1 {
		t.Errorf("blank turn should have been dropped: %q", got)
	}
}

func TestAlignItemsFillsMissingFoods(t *testing.T) {
	names := []string{"김치찌개", "공기밥", "계란말이"}
	// The model returned them out of order and skipped one.
	items := []dto.NutritionItem{
		{Name: "계란말이", CaloriesKcal: 200, Confidence: 0.9},
		{Name: "김치찌개", CaloriesKcal: 243, Confidence: 1.5},
	}

	got := alignItems(names, items)

	if len(got) != 3 {
		t.Fatalf("expected one item per requested name, got %d", len(got))
	}
	for i, name := range names {
		if got[i].Name != name {
			t.Errorf("position %d = %q, want %q", i, got[i].Name, name)
		}
	}
	if got[1].Confidence != 0 || got[1].CaloriesKcal != 0 {
		t.Errorf("missing food should be zeroed, got %+v", got[1])
	}
	if got[0].Confidence != 1 {
		t.Errorf("confidence should be clamped to 1, got %v", got[0].Confidence)
	}
}

func TestDedupeNames(t *testing.T) {
	got := dedupeNames([]string{" 김치찌개 ", "", "김치찌개", "공기밥", "   "})
	want := []string{"김치찌개", "공기밥"}

	if len(got) != len(want) {
		t.Fatalf("got %v, want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Errorf("position %d = %q, want %q", i, got[i], want[i])
		}
	}
}

func TestSanitizeSourcesDropsUnusableURLs(t *testing.T) {
	got := sanitizeSources([]dto.NutritionSource{
		{Title: "식약처 DB", URL: "https://various.foodsafetykorea.go.kr/"},
		{Title: "출처 없음", URL: ""},
		{Title: "상대 경로", URL: "/nutrient/db"},
		{Title: "스킴 없음", URL: "ftp://example.com/x"},
		{Title: "공백", URL: "   "},
	})

	if len(got) != 1 {
		t.Fatalf("expected only the absolute http(s) source to survive, got %+v", got)
	}
	if got[0].Title != "식약처 DB" {
		t.Errorf("wrong source retained: %+v", got[0])
	}
}

func approxBox(a, b dto.BoundingBox) bool {
	const eps = 1e-9
	d := func(x, y float64) bool {
		diff := x - y
		return diff < eps && diff > -eps
	}
	return d(a.X, b.X) && d(a.Y, b.Y) && d(a.Width, b.Width) && d(a.Height, b.Height)
}

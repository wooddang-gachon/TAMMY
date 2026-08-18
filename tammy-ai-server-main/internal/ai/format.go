package ai

import (
	"fmt"
	"sort"
	"strings"

	"github.com/yeongin-ji/tammy-ai-server/internal/dto"
)

// The renderers below turn raw logs into a compact transcript for the model.
// Formatting in Go rather than in Handlebars keeps the .prompt files readable
// and gives the model prose it summarizes far more reliably than nested JSON.

const emptyRecords = "(기록 없음)"

func renderPeriod(p dto.Period) string {
	switch {
	case p.Start != "" && p.End != "":
		return p.Start + " ~ " + p.End
	case p.Start != "":
		return p.Start + " ~"
	case p.End != "":
		return "~ " + p.End
	default:
		return ""
	}
}

// renderDiet lays meals out day by day with a per-day calorie subtotal.
func renderDiet(records []dto.DailyDietRecord) string {
	if len(records) == 0 {
		return emptyRecords
	}

	sorted := append([]dto.DailyDietRecord(nil), records...)
	sort.SliceStable(sorted, func(i, j int) bool { return sorted[i].Date < sorted[j].Date })

	var b strings.Builder
	for _, day := range sorted {
		fmt.Fprintf(&b, "## %s\n", day.Date)
		if len(day.Meals) == 0 {
			b.WriteString("  (이 날은 식사 기록이 없어)\n")
			continue
		}

		var dayKcal float64
		for _, meal := range day.Meals {
			label := mealLabel(meal.MealType)
			if meal.RegisteredAt != "" {
				fmt.Fprintf(&b, "  - %s (%s)\n", label, meal.RegisteredAt)
			} else {
				fmt.Fprintf(&b, "  - %s\n", label)
			}
			for _, f := range meal.Foods {
				fmt.Fprintf(&b, "      %s — %.0fkcal (탄 %.1fg / 단 %.1fg / 지 %.1fg)\n",
					f.Name, f.CaloriesKcal, f.CarbohydrateG, f.ProteinG, f.FatG)
				dayKcal += f.CaloriesKcal
			}
		}
		fmt.Fprintf(&b, "  하루 합계: 약 %.0fkcal\n", dayKcal)
	}
	return strings.TrimRight(b.String(), "\n")
}

func mealLabel(mealType string) string {
	switch strings.ToUpper(mealType) {
	case "BREAKFAST":
		return "아침"
	case "LUNCH":
		return "점심"
	case "DINNER":
		return "저녁"
	case "SNACK":
		return "간식"
	default:
		return "식사"
	}
}

// renderExercise groups activities by date so streaks and gaps are visible.
func renderExercise(logs []dto.ExerciseEntry, steps map[string]int) string {
	if len(logs) == 0 && len(steps) == 0 {
		return emptyRecords
	}

	byDate := make(map[string][]dto.ExerciseEntry)
	for _, l := range logs {
		byDate[l.Date] = append(byDate[l.Date], l)
	}

	dates := unionDates(keysOfExercise(byDate), keysOfSteps(steps))

	var b strings.Builder
	for _, d := range dates {
		fmt.Fprintf(&b, "## %s\n", d)
		for _, l := range byDate[d] {
			name := l.ExerciseName
			if name == "" {
				name = "활동"
			}
			status := ""
			if !l.IsCompleted {
				status = " (완료하지 못함)"
			}
			fmt.Fprintf(&b, "  - %s %d분, 약 %.0fkcal 소모%s\n",
				name, l.DurationMinutes, l.BurnedCaloriesKcal, status)
		}
		if s, ok := steps[d]; ok {
			fmt.Fprintf(&b, "  - 걸음 수: %d보\n", s)
		}
		if len(byDate[d]) == 0 && steps[d] == 0 {
			b.WriteString("  (활동 기록 없음)\n")
		}
	}
	return strings.TrimRight(b.String(), "\n")
}

// renderWater reports each day's total plus the individual intakes, letting the
// model comment on both volume and how evenly it was spread.
func renderWater(logs []dto.WaterEntry, goalML int) string {
	if len(logs) == 0 {
		return emptyRecords
	}

	byDate := make(map[string][]dto.WaterEntry)
	for _, l := range logs {
		byDate[l.Date] = append(byDate[l.Date], l)
	}

	dates := make([]string, 0, len(byDate))
	for d := range byDate {
		dates = append(dates, d)
	}
	sort.Strings(dates)

	var b strings.Builder
	for _, d := range dates {
		entries := byDate[d]
		total := 0
		times := make([]string, 0, len(entries))
		for _, e := range entries {
			total += e.IntakeML
			if e.RecordedAt != "" {
				times = append(times, e.RecordedAt)
			}
		}

		fmt.Fprintf(&b, "## %s — 총 %dml (%d회)", d, total, len(entries))
		if goalML > 0 {
			fmt.Fprintf(&b, ", 목표 %dml 대비 %d%%", goalML, total*100/goalML)
		}
		b.WriteString("\n")
		if len(times) > 0 {
			fmt.Fprintf(&b, "  마신 시각: %s\n", strings.Join(times, ", "))
		}
	}
	return strings.TrimRight(b.String(), "\n")
}

// renderEmotionRecords condenses quick-button taps into totals plus a daily
// breakdown. The individual taps carry no text, so a full list would be noise.
func renderEmotionRecords(records []dto.EmotionRecord) string {
	if len(records) == 0 {
		return emptyRecords
	}

	total := make(map[string]int, len(dto.EmotionStates))
	byDate := make(map[string]map[string]int)
	for _, r := range records {
		e := strings.ToUpper(strings.TrimSpace(r.Emotion))
		if e == "" {
			continue
		}
		total[e]++

		// RFC3339 always starts with the YYYY-MM-DD date, so slicing is safe
		// and avoids parsing timestamps we only ever group by day.
		if len(r.RecordedAt) >= 10 {
			d := r.RecordedAt[:10]
			if byDate[d] == nil {
				byDate[d] = make(map[string]int)
			}
			byDate[d][e]++
		}
	}
	if len(total) == 0 {
		return emptyRecords
	}

	var b strings.Builder
	fmt.Fprintf(&b, "전체: %s\n", joinCounts(total))

	if len(byDate) > 0 {
		dates := make([]string, 0, len(byDate))
		for d := range byDate {
			dates = append(dates, d)
		}
		sort.Strings(dates)

		b.WriteString("날짜별:\n")
		for _, d := range dates {
			fmt.Fprintf(&b, "  %s — %s\n", d, joinCounts(byDate[d]))
		}
	}
	return strings.TrimRight(b.String(), "\n")
}

// joinCounts renders a count map most-frequent first, breaking ties by name so
// the same input always produces the same prompt.
func joinCounts(counts map[string]int) string {
	keys := make([]string, 0, len(counts))
	for k := range counts {
		keys = append(keys, k)
	}
	sort.Slice(keys, func(i, j int) bool {
		if counts[keys[i]] != counts[keys[j]] {
			return counts[keys[i]] > counts[keys[j]]
		}
		return keys[i] < keys[j]
	})

	parts := make([]string, 0, len(keys))
	for _, k := range keys {
		parts = append(parts, fmt.Sprintf("%s %d회", k, counts[k]))
	}
	return strings.Join(parts, ", ")
}

// renderDiaries lays diary entries out oldest first, body untouched.
//
// DiaryID is intentionally omitted: the model has no use for it, and leaving it
// out removes any chance of an internal id surfacing in the report body.
func renderDiaries(diaries []dto.EmotionDiary) string {
	if len(diaries) == 0 {
		return emptyRecords
	}

	sorted := append([]dto.EmotionDiary(nil), diaries...)
	sort.SliceStable(sorted, func(i, j int) bool { return sorted[i].Date < sorted[j].Date })

	var b strings.Builder
	for _, d := range sorted {
		header := d.Date
		if header == "" {
			header = "(날짜 미상)"
		}
		if mood := strings.TrimSpace(d.Mood); mood != "" {
			header += " · 그날의 기분: " + mood
		}
		fmt.Fprintf(&b, "## %s\n%s\n\n", header, strings.TrimSpace(d.Content))
	}
	return strings.TrimRight(b.String(), "\n")
}

// renderMindfulness stitches the three emotional sources into one document.
func renderMindfulness(req dto.MindfulnessReportRequest) string {
	var b strings.Builder

	b.WriteString("# 감정 기록 (퀵버튼)\n")
	b.WriteString(renderEmotionRecords(req.EmotionRecords))

	b.WriteString("\n\n# 대화 기록\n")
	b.WriteString(orEmpty(renderHistory(req.ChatLogs, maxRetrospectiveTurns)))

	b.WriteString("\n\n# 감정일기\n")
	b.WriteString(renderDiaries(req.Diaries))

	return b.String()
}

// renderRetrospective stitches all four pillars into one document so the model
// can reason about how they influence each other.
func renderRetrospective(req dto.RetrospectiveReportRequest) string {
	var b strings.Builder

	b.WriteString("# 대화 기록\n")
	if chat := renderHistory(req.ChatLogs, maxRetrospectiveTurns); chat != "" {
		b.WriteString(chat)
	} else {
		b.WriteString(emptyRecords)
	}

	b.WriteString("\n\n# 감정 기록 (퀵버튼)\n")
	b.WriteString(renderEmotionRecords(req.EmotionRecords))

	b.WriteString("\n\n# 감정일기\n")
	b.WriteString(renderDiaries(req.Diaries))

	b.WriteString("\n\n# 식사 기록\n")
	b.WriteString(renderDiet(req.DailyRecords))

	b.WriteString("\n\n# 활동 기록\n")
	b.WriteString(renderExercise(req.ExerciseLogs, nil))

	b.WriteString("\n\n# 수분 기록\n")
	b.WriteString(renderWater(req.WaterLogs, 0))

	return b.String()
}

// densityGuide turns the caller's density label into a line of tone guidance.
// Normal needs no guidance — it is what the base rules already assume — so it
// renders nothing and the prompt block stays out of the way.
func densityGuide(density string) string {
	switch strings.ToLower(strings.TrimSpace(density)) {
	case dto.DensityThin:
		return "이번 여행은 기록이 많지 않아. 짧지만 굵었던 여정으로 다뤄줘. " +
			"분량을 억지로 늘리지 말고, 기록이 적다는 사실을 아쉬워하거나 짚지 마."
	case dto.DensityRich:
		return "이번 여행은 기록이 넉넉해. 초반과 후반이 어떻게 달라졌는지, " +
			"흐름의 변화까지 짚어줘도 좋아."
	default:
		return ""
	}
}

func keysOfExercise(m map[string][]dto.ExerciseEntry) []string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	return out
}

func keysOfSteps(m map[string]int) []string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	return out
}

// unionDates merges two date key sets into one sorted, deduplicated slice.
func unionDates(a, b []string) []string {
	seen := make(map[string]bool, len(a)+len(b))
	for _, s := range append(a, b...) {
		seen[s] = true
	}
	out := make([]string, 0, len(seen))
	for s := range seen {
		out = append(out, s)
	}
	sort.Strings(out)
	return out
}

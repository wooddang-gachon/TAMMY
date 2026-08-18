package ai

import (
	"context"
	"fmt"
	"slices"
	"strings"

	"github.com/firebase/genkit/go/ai"

	"github.com/yeongin-ji/tammy-ai-server/internal/dto"
)

// maxHistoryTurns bounds how much history reaches the model. The service
// server may send an entire conversation; only the most recent turns matter
// for a reply, and trimming keeps latency and cost predictable.
const maxHistoryTurns = 30

// Chat produces Tammy's reply and analyses the emotion behind the user's
// utterance.
func (c *Client) Chat(ctx context.Context, req dto.ChatRequest) (*dto.ChatResponse, error) {
	input := map[string]any{
		"userMessage": req.UserMessage,
		"nickname":    strings.TrimSpace(req.Nickname),
		"history":     renderHistory(req.History, maxHistoryTurns),
	}

	var out dto.ChatResponse
	if err := execute(ctx, c.g, promptChat, input, &out, ai.WithModelName(c.cfg.ChatModel)); err != nil {
		return nil, err
	}

	out.ReplyText = strings.TrimSpace(out.ReplyText)
	out.Emotion = normalizeEmotion(out.Emotion)
	return &out, nil
}

// renderHistory formats the trailing `limit` turns as a readable transcript.
// Passing pre-rendered text keeps the template simple and gives the model a
// clearer view of the conversation than nested structures do.
func renderHistory(history []dto.ChatTurn, limit int) string {
	if len(history) > limit {
		history = history[len(history)-limit:]
	}

	var b strings.Builder
	for _, t := range history {
		text := strings.TrimSpace(t.Text)
		if text == "" {
			continue
		}
		speaker := "타미"
		if t.Role == dto.RoleUser {
			speaker = "사용자"
		}
		if t.CreatedAt != "" {
			fmt.Fprintf(&b, "[%s] %s: %s\n", t.CreatedAt, speaker, text)
		} else {
			fmt.Fprintf(&b, "%s: %s\n", speaker, text)
		}
	}
	return strings.TrimSpace(b.String())
}

// normalizeEmotion guarantees the response carries values the service server's
// enums accept, since these are written straight into emotion_logs.
func normalizeEmotion(e dto.EmotionStatus) dto.EmotionStatus {
	e.State = strings.ToUpper(strings.TrimSpace(e.State))
	e.MotionType = strings.ToUpper(strings.TrimSpace(e.MotionType))

	if !slices.Contains(dto.EmotionStates, e.State) {
		e.State = "CALM"
	}
	if !slices.Contains(dto.MotionTypes, e.MotionType) {
		e.MotionType = defaultMotionFor(e.State)
	}
	return e
}

// defaultMotionFor picks a safe animation when the model returns an unknown one.
func defaultMotionFor(state string) string {
	switch state {
	case "HAPPY":
		return "JUMP_JOY"
	case "SAD":
		return "HUG"
	case "ANGRY":
		return "NOD_SLOWLY"
	case "STRESSED":
		return "PAT_PAT_HEAD"
	default:
		return "SIT_BESIDE"
	}
}

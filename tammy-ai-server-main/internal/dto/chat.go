package dto

// Chat message roles exchanged with the service server.
const (
	RoleUser  = "user"
	RoleTammy = "tammy"
)

// ChatTurn is one past message in the conversation history.
type ChatTurn struct {
	// Either "user" or "tammy".
	Role string `json:"role" binding:"required,oneof=user tammy" example:"user"`
	Text string `json:"text" binding:"required" example:"오늘 야근해서 너무 지쳤어"`
	// RFC3339 timestamp. Optional; used only to give the model a sense of pacing.
	CreatedAt string `json:"createdAt,omitempty" example:"2026-08-05T21:14:00Z"`
}

// ChatRequest carries the current utterance plus the full history the service
// server chose to send. This server keeps no state between calls.
type ChatRequest struct {
	UserID      int64  `json:"userId" binding:"required" example:"12"`
	UserMessage string `json:"userMessage" binding:"required" example:"오늘 회사에서 일이 너무 많아서 힘들고 지쳤어"`
	// Prior turns in chronological order, oldest first. May be empty.
	History []ChatTurn `json:"history"`
	// Optional display name so Tammy can address the user naturally.
	Nickname string `json:"nickname,omitempty" example:"우당탕탕"`
}

// EmotionStatus is the analysis of the *user's* emotional state, plus the
// matching Tammy animation the client should play.
type EmotionStatus struct {
	// One of HAPPY, SAD, ANGRY, STRESSED, CALM — matching the service server's
	// EmotionState enum so it can be written straight into emotion_logs.
	State string `json:"state" example:"STRESSED"`
	// Tammy's reaction animation, one of the MotionType values.
	MotionType string `json:"motionType" example:"PAT_PAT_HEAD"`
}

// ChatResponse is Tammy's reply plus the emotion read from the user.
type ChatResponse struct {
	ReplyText string        `json:"replyText" example:"오늘 정말 많이 힘들었구나. 괜찮아, 우리 잠깐 바람 쐬러 갈까?"`
	Emotion   EmotionStatus `json:"emotion"`
}

// EmotionState values mirror the service server's Prisma enum exactly.
var EmotionStates = []string{"HAPPY", "SAD", "ANGRY", "STRESSED", "CALM"}

// MotionType values are Tammy's reaction animations.
//
// NOTE: the service server has no enum for this — only the example value
// "PAT_PAT_HEAD" appears in its interfaces. This list is the AI server's
// proposal and must be reconciled with the client's actual animation set.
var MotionTypes = []string{
	"PAT_PAT_HEAD", // comforting a struggling user
	"JUMP_JOY",     // celebrating with the user
	"HUG",          // deep empathy for sadness
	"NOD_SLOWLY",   // quiet listening
	"CHEER_UP",     // gentle encouragement
	"SIT_BESIDE",   // simply staying near, no suggestion
}

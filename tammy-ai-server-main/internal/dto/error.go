package dto

// ErrorResponse is the body returned for every non-2xx response.
// Code is a stable machine-readable identifier; the service server keys its
// fallback behaviour off it, so codes must not be renamed casually.
type ErrorResponse struct {
	Code    string `json:"code" example:"AI_MODEL_ERROR"`
	Message string `json:"message" example:"AI 모델 호출에 실패했습니다."`
}

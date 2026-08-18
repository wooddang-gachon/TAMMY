// Package apperr defines the error envelope shared across every endpoint.
package apperr

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/yeongin-ji/tammy-ai-server/internal/dto"
)

// Error is an API error carrying an HTTP status alongside the wire body.
// The embedded dto.ErrorResponse is what clients actually receive; Status and
// cause stay server-side.
type Error struct {
	Status int `json:"-"`
	dto.ErrorResponse

	cause error
}

func (e *Error) Error() string {
	if e.cause != nil {
		return fmt.Sprintf("%s: %s: %v", e.Code, e.Message, e.cause)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

func (e *Error) Unwrap() error { return e.cause }

// Is matches any *Error carrying the same code. WithCause returns a clone, so
// without this errors.Is could never match the sentinels below once a cause
// had been attached.
func (e *Error) Is(target error) bool {
	t, ok := target.(*Error)
	return ok && t.Code == e.Code
}

// WithCause returns a copy carrying an underlying error for logging.
// It copies rather than mutating so the package-level sentinels below stay
// safe to share across concurrent requests.
func (e *Error) WithCause(err error) *Error {
	clone := *e
	clone.cause = err
	return &clone
}

// New builds an ad-hoc API error.
func New(status int, code, message string) *Error {
	return &Error{
		Status:        status,
		ErrorResponse: dto.ErrorResponse{Code: code, Message: message},
	}
}

// As extracts an *Error from an error chain, reporting whether one was found.
func As(err error) (*Error, bool) {
	var e *Error
	ok := errors.As(err, &e)
	return e, ok
}

// Predefined errors. Messages are Korean because the service server surfaces
// them to the client largely unchanged.
var (
	ErrInvalidRequest = New(http.StatusBadRequest, "INVALID_REQUEST",
		"요청 형식이 올바르지 않습니다.")

	ErrImageRequired = New(http.StatusBadRequest, "IMAGE_REQUIRED",
		"imageUrl 또는 imageBase64 중 하나는 반드시 필요합니다.")

	ErrImageFetchFailed = New(http.StatusBadGateway, "IMAGE_FETCH_FAILED",
		"이미지를 가져오지 못했습니다.")

	ErrImageTooLarge = New(http.StatusRequestEntityTooLarge, "IMAGE_TOO_LARGE",
		"이미지 용량이 허용 범위를 초과했습니다.")

	ErrUnsupportedMediaType = New(http.StatusUnsupportedMediaType, "UNSUPPORTED_IMAGE_TYPE",
		"지원하지 않는 이미지 형식입니다.")

	ErrUnauthorized = New(http.StatusUnauthorized, "UNAUTHORIZED",
		"내부 API 인증에 실패했습니다.")

	ErrModelFailed = New(http.StatusBadGateway, "AI_MODEL_ERROR",
		"AI 모델 호출에 실패했습니다.")

	ErrModelTimeout = New(http.StatusGatewayTimeout, "AI_MODEL_TIMEOUT",
		"AI 모델 응답이 지연되어 요청이 만료되었습니다.")

	ErrInternal = New(http.StatusInternalServerError, "INTERNAL_ERROR",
		"서버 내부 오류가 발생했습니다.")
)

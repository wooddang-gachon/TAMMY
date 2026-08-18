// Package handler exposes the AI flows as HTTP endpoints.
package handler

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/yeongin-ji/tammy-ai-server/internal/ai"
	"github.com/yeongin-ji/tammy-ai-server/internal/apperr"
)

// Handler holds the dependencies shared by every endpoint.
type Handler struct {
	AI *ai.Client
}

// New builds a Handler.
func New(client *ai.Client) *Handler {
	return &Handler{AI: client}
}

// bind parses and validates the JSON body, writing a 400 and reporting false
// when the payload is unusable.
func bind[T any](c *gin.Context, target *T) bool {
	if err := c.ShouldBindJSON(target); err != nil {
		fail(c, apperr.ErrInvalidRequest.WithCause(err))
		return false
	}
	return true
}

// fail writes an error response, mapping unknown errors to a 500 so internal
// details never reach the caller.
func fail(c *gin.Context, err error) {
	appErr, ok := apperr.As(err)
	if !ok {
		appErr = apperr.ErrInternal.WithCause(err)
	}

	// Client mistakes are noise at error level; upstream failures are not.
	logAt := slog.LevelError
	if appErr.Status < http.StatusInternalServerError {
		logAt = slog.LevelWarn
	}
	slog.Log(c.Request.Context(), logAt, "request failed",
		"path", c.FullPath(),
		"code", appErr.Code,
		"status", appErr.Status,
		"error", errors.Unwrap(appErr),
	)

	c.AbortWithStatusJSON(appErr.Status, appErr)
}

// HealthCheck godoc
//
//	@Summary		헬스 체크
//	@Description	Cloud Run 및 로드밸런서용 상태 확인 엔드포인트입니다. 인증이 필요하지 않습니다.
//	@Tags			health
//	@Produce		json
//	@Success		200	{object}	map[string]string
//	@Router			/healthz [get]
func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

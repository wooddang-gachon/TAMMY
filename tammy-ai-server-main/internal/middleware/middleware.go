// Package middleware provides cross-cutting HTTP concerns.
package middleware

import (
	"crypto/subtle"
	"log/slog"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/yeongin-ji/tammy-ai-server/internal/apperr"
)

// InternalAPIKeyHeader authenticates the service server. Cloud Run accepts
// unauthenticated callers, so this header is the access control for /v1.
const InternalAPIKeyHeader = "X-Internal-Api-Key"

// APIKeyAuth rejects requests without the shared secret. An empty key makes the
// middleware a no-op, which config.Load only permits in debug and test runs.
func APIKeyAuth(key string) gin.HandlerFunc {
	if key == "" {
		slog.Warn("internal API key auth disabled; every /v1 endpoint is open")
		return func(c *gin.Context) { c.Next() }
	}

	expected := []byte(key)
	return func(c *gin.Context) {
		got := []byte(c.GetHeader(InternalAPIKeyHeader))
		// Constant-time compare so the header cannot be brute-forced by timing.
		if subtle.ConstantTimeCompare(got, expected) != 1 {
			c.AbortWithStatusJSON(apperr.ErrUnauthorized.Status, apperr.ErrUnauthorized)
			return
		}
		c.Next()
	}
}

// RequestLogger emits one structured line per request. Cloud Run Logging picks
// these up as structured entries.
func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()

		// Skip health checks; they would otherwise dominate the logs.
		if c.FullPath() == "/healthz" {
			return
		}

		slog.Info("request",
			"method", c.Request.Method,
			"path", c.FullPath(),
			"status", c.Writer.Status(),
			"duration_ms", time.Since(start).Milliseconds(),
		)
	}
}

// Recovery converts a panic into a 500 using the standard error envelope,
// keeping the stack trace in the logs rather than the response.
func Recovery() gin.HandlerFunc {
	return gin.CustomRecoveryWithWriter(nil, func(c *gin.Context, recovered any) {
		slog.Error("panic recovered", "path", c.FullPath(), "panic", recovered)
		c.AbortWithStatusJSON(apperr.ErrInternal.Status, apperr.ErrInternal)
	})
}

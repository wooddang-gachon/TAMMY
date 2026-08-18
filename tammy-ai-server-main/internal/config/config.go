// Package config loads runtime configuration from environment variables.
package config

import (
	"fmt"
	"log/slog"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

// Config holds all runtime settings for the AI server.
type Config struct {
	Port         string
	GinMode      string
	GeminiAPIKey string

	// VisionModel handles image understanding and bounding box inference.
	VisionModel string
	// ChatModel handles the Tammy persona conversation.
	ChatModel string
	// ReportModel handles the five long-form wellness reports.
	ReportModel string
	// ResearchModel handles web-search grounded nutrition lookup.
	ResearchModel string

	// InternalAPIKey is required in the X-Internal-Api-Key header. The service
	// is deployed with --allow-unauthenticated, so this key is the only thing
	// in front of /v1; Load refuses to start without it outside debug mode.
	InternalAPIKey string

	// ImageFetchTimeout bounds how long we wait when downloading an imageUrl.
	ImageFetchTimeout time.Duration
	// MaxImageBytes caps decoded image size to protect against oversized uploads.
	MaxImageBytes int64
	// RequestTimeout bounds a single inbound request end to end.
	RequestTimeout time.Duration
}

// Load reads configuration from the environment, applying defaults.
// It fails only when a setting has no safe default.
//
// A .env file is loaded first as a convenience for local development. Real
// environment variables always win, and a missing file is not an error —
// Cloud Run injects everything directly.
func Load() (*Config, error) {
	if err := godotenv.Load(); err != nil && !os.IsNotExist(err) {
		slog.Debug("no .env file loaded", "error", err)
	}

	c := &Config{
		Port:              env("PORT", "8000"),
		GinMode:           env("GIN_MODE", "release"),
		GeminiAPIKey:      firstNonEmpty(os.Getenv("GEMINI_API_KEY"), os.Getenv("GOOGLE_API_KEY")),
		VisionModel:       env("VISION_MODEL", "googleai/gemini-3.5-flash-lite"),
		ChatModel:         env("CHAT_MODEL", "googleai/gemini-3.5-flash-lite"),
		ReportModel:       env("REPORT_MODEL", "googleai/gemini-3.5-flash-lite"),
		ResearchModel:     env("RESEARCH_MODEL", "googleai/gemini-3.5-flash-lite"),
		InternalAPIKey:    os.Getenv("INTERNAL_API_KEY"),
		ImageFetchTimeout: envDuration("IMAGE_FETCH_TIMEOUT", 15*time.Second),
		MaxImageBytes:     envInt64("MAX_IMAGE_BYTES", 8<<20), // 8 MiB
		RequestTimeout:    envDuration("REQUEST_TIMEOUT", 120*time.Second),
	}

	if c.GeminiAPIKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY (or GOOGLE_API_KEY) must be set")
	}
	// Cloud Run lets unauthenticated callers reach this service, so an empty key
	// would leave /v1 open to the internet. Fail closed rather than start that
	// way; debug and test runs stay key-optional for local convenience.
	if c.InternalAPIKey == "" && c.GinMode != "debug" && c.GinMode != "test" {
		return nil, fmt.Errorf("INTERNAL_API_KEY must be set when GIN_MODE=%s; the service accepts unauthenticated callers", c.GinMode)
	}
	return c, nil
}

func env(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if s := strings.TrimSpace(v); s != "" {
			return s
		}
	}
	return ""
}

func envDuration(key string, fallback time.Duration) time.Duration {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	d, err := time.ParseDuration(v)
	if err != nil {
		return fallback
	}
	return d
}

func envInt64(key string, fallback int64) int64 {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	n, err := strconv.ParseInt(v, 10, 64)
	if err != nil {
		return fallback
	}
	return n
}

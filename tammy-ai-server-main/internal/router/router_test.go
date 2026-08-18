package router

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/yeongin-ji/tammy-ai-server/internal/config"
	"github.com/yeongin-ji/tammy-ai-server/internal/dto"
	"github.com/yeongin-ji/tammy-ai-server/internal/handler"
	"github.com/yeongin-ji/tammy-ai-server/internal/middleware"
)

// These tests cover the paths that resolve before any model call — auth,
// routing, and request validation — so a nil AI client is never dereferenced.
func newTestRouter(apiKey string) *gin.Engine {
	gin.SetMode(gin.TestMode)
	cfg := &config.Config{GinMode: gin.TestMode, InternalAPIKey: apiKey}
	return New(cfg, handler.New(nil))
}

func TestHealthCheckNeedsNoAuth(t *testing.T) {
	// Both paths answer: Cloud Run's frontend swallows /healthz, so /health is
	// the alias external monitors can actually reach.
	for _, path := range []string{"/health", "/healthz"} {
		r := newTestRouter("secret")

		w := httptest.NewRecorder()
		r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, path, nil))

		if w.Code != http.StatusOK {
			t.Errorf("GET %s status = %d, want 200", path, w.Code)
		}
	}
}

func TestV1RejectsMissingAPIKey(t *testing.T) {
	r := newTestRouter("secret")

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/v1/chat/process", strings.NewReader(`{}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", w.Code)
	}

	var body dto.ErrorResponse
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("response was not the error envelope: %v", err)
	}
	if body.Code != "UNAUTHORIZED" {
		t.Errorf("code = %q, want UNAUTHORIZED", body.Code)
	}
}

func TestV1RejectsWrongAPIKey(t *testing.T) {
	r := newTestRouter("secret")

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/v1/chat/process", strings.NewReader(`{}`))
	req.Header.Set(middleware.InternalAPIKeyHeader, "wrong")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", w.Code)
	}
}

func TestInvalidBodyReturns400(t *testing.T) {
	r := newTestRouter("secret")

	// Valid key, but userMessage is required and missing.
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/v1/chat/process", strings.NewReader(`{"userId":1}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set(middleware.InternalAPIKeyHeader, "secret")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", w.Code)
	}

	var body dto.ErrorResponse
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("response was not the error envelope: %v", err)
	}
	if body.Code != "INVALID_REQUEST" {
		t.Errorf("code = %q, want INVALID_REQUEST", body.Code)
	}
	// The internal validation error must not leak to the caller.
	if strings.Contains(body.Message, "Field validation") {
		t.Errorf("internal validator detail leaked: %q", body.Message)
	}
}

func TestMalformedJSONReturns400(t *testing.T) {
	r := newTestRouter("secret")

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/v1/reports/diet", strings.NewReader(`{not json`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set(middleware.InternalAPIKeyHeader, "secret")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestEmptyAPIKeyDisablesAuth(t *testing.T) {
	r := newTestRouter("")

	// Auth is off, so this should get past the middleware and fail validation.
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/v1/chat/process", strings.NewReader(`{"userId":1}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400 (auth disabled, validation still applies)", w.Code)
	}
}

func TestAllEndpointsAreMounted(t *testing.T) {
	r := newTestRouter("secret")

	want := map[string]string{
		"POST /v1/vision/analyze-food":   "",
		"POST /v1/nutrition/lookup":      "",
		"POST /v1/chat/process":          "",
		"POST /v1/reports/diet":          "",
		"POST /v1/reports/mindfulness":   "",
		"POST /v1/reports/lifestyle":     "",
		"POST /v1/reports/hydration":     "",
		"POST /v1/reports/retrospective": "",
		"GET /health":                    "",
		"GET /healthz":                   "",
	}

	for _, route := range r.Routes() {
		delete(want, route.Method+" "+route.Path)
	}

	for missing := range want {
		t.Errorf("route not mounted: %s", missing)
	}
}

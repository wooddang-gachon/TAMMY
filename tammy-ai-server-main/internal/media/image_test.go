package media

import (
	"context"
	"encoding/base64"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/yeongin-ji/tammy-ai-server/internal/apperr"
)

// Minimal valid magic-byte prefixes; the resolver only sniffs the header.
var (
	jpegBytes = append([]byte{0xFF, 0xD8, 0xFF, 0xE0}, make([]byte, 32)...)
	pngBytes  = append([]byte("\x89PNG\r\n\x1a\n"), make([]byte, 32)...)
	gifBytes  = append([]byte("GIF89a"), make([]byte, 32)...)
)

func newResolver(maxBytes int64) *Resolver {
	return NewResolver(&http.Client{}, maxBytes)
}

func TestResolveRequiresAnImage(t *testing.T) {
	_, err := newResolver(1024).Resolve(context.Background(), "", "")
	if !errors.Is(err, apperr.ErrImageRequired) {
		t.Errorf("expected ErrImageRequired, got %v", err)
	}
}

func TestResolveFromBareBase64(t *testing.T) {
	payload := base64.StdEncoding.EncodeToString(jpegBytes)

	img, err := newResolver(1024).Resolve(context.Background(), "", payload)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if img.MimeType != "image/jpeg" {
		t.Errorf("mime = %q, want image/jpeg", img.MimeType)
	}
	if !strings.HasPrefix(img.DataURI(), "data:image/jpeg;base64,") {
		t.Errorf("unexpected data URI prefix: %q", img.DataURI()[:40])
	}
}

func TestResolveFromDataURI(t *testing.T) {
	payload := "data:image/png;base64," + base64.StdEncoding.EncodeToString(pngBytes)

	img, err := newResolver(1024).Resolve(context.Background(), "", payload)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if img.MimeType != "image/png" {
		t.Errorf("mime = %q, want image/png", img.MimeType)
	}
}

func TestResolveSniffingOverridesDeclaredType(t *testing.T) {
	// Client claims PNG but the bytes are JPEG; the bytes win.
	payload := "data:image/png;base64," + base64.StdEncoding.EncodeToString(jpegBytes)

	img, err := newResolver(1024).Resolve(context.Background(), "", payload)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if img.MimeType != "image/jpeg" {
		t.Errorf("mime = %q, want image/jpeg from sniffing", img.MimeType)
	}
}

func TestResolveRejectsUnsupportedFormat(t *testing.T) {
	payload := base64.StdEncoding.EncodeToString(gifBytes)

	_, err := newResolver(1024).Resolve(context.Background(), "", payload)
	if !errors.Is(err, apperr.ErrUnsupportedMediaType) {
		t.Errorf("expected ErrUnsupportedMediaType, got %v", err)
	}
}

func TestResolveRejectsOversizedBase64(t *testing.T) {
	big := append(jpegBytes, make([]byte, 4096)...)
	payload := base64.StdEncoding.EncodeToString(big)

	_, err := newResolver(64).Resolve(context.Background(), "", payload)
	if !errors.Is(err, apperr.ErrImageTooLarge) {
		t.Errorf("expected ErrImageTooLarge, got %v", err)
	}
}

func TestResolveRejectsMalformedBase64(t *testing.T) {
	_, err := newResolver(1024).Resolve(context.Background(), "", "!!!not base64!!!")

	appErr, ok := apperr.As(err)
	if !ok || appErr.Code != "INVALID_REQUEST" {
		t.Errorf("expected INVALID_REQUEST, got %v", err)
	}
}

func TestResolveFromURL(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "image/jpeg")
		w.Write(jpegBytes)
	}))
	defer srv.Close()

	img, err := newResolver(1024).Resolve(context.Background(), srv.URL+"/meal.jpg", "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if img.MimeType != "image/jpeg" {
		t.Errorf("mime = %q, want image/jpeg", img.MimeType)
	}
}

func TestResolvePrefersBase64OverURL(t *testing.T) {
	called := false
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.Write(jpegBytes)
	}))
	defer srv.Close()

	_, err := newResolver(1024).Resolve(context.Background(), srv.URL, base64.StdEncoding.EncodeToString(pngBytes))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if called {
		t.Error("base64 was supplied, so no network fetch should have happened")
	}
}

func TestResolveURLUpstreamFailure(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "gone", http.StatusNotFound)
	}))
	defer srv.Close()

	_, err := newResolver(1024).Resolve(context.Background(), srv.URL, "")
	if !errors.Is(err, apperr.ErrImageFetchFailed) {
		t.Errorf("expected ErrImageFetchFailed, got %v", err)
	}
}

func TestResolveURLOversizedBody(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write(append(jpegBytes, make([]byte, 4096)...))
	}))
	defer srv.Close()

	_, err := newResolver(64).Resolve(context.Background(), srv.URL, "")
	if !errors.Is(err, apperr.ErrImageTooLarge) {
		t.Errorf("expected ErrImageTooLarge, got %v", err)
	}
}

func TestResolveRejectsNonHTTPScheme(t *testing.T) {
	_, err := newResolver(1024).Resolve(context.Background(), "file:///etc/passwd", "")

	appErr, ok := apperr.As(err)
	if !ok || appErr.Code != "INVALID_REQUEST" {
		t.Errorf("expected INVALID_REQUEST for non-http scheme, got %v", err)
	}
}

func TestSniff(t *testing.T) {
	tests := []struct {
		name string
		in   []byte
		want string
	}{
		{"jpeg", jpegBytes, "image/jpeg"},
		{"png", pngBytes, "image/png"},
		{"gif is unsupported", gifBytes, ""},
		{"too short", []byte{0xFF}, ""},
		{"webp", append([]byte("RIFF\x00\x00\x00\x00WEBP"), make([]byte, 8)...), "image/webp"},
		{"heic", append([]byte("\x00\x00\x00\x18ftypheic"), make([]byte, 8)...), "image/heic"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := sniff(tt.in); got != tt.want {
				t.Errorf("sniff() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestResolveURLSendsUserAgent(t *testing.T) {
	var gotUA string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotUA = r.Header.Get("User-Agent")
		w.Write(jpegBytes)
	}))
	defer srv.Close()

	if _, err := newResolver(1024).Resolve(context.Background(), srv.URL, ""); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// Several CDNs (Wikimedia among them) return 403 without one.
	if gotUA != userAgent {
		t.Errorf("User-Agent = %q, want %q", gotUA, userAgent)
	}
}

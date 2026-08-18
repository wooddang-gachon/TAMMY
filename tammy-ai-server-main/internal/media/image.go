// Package media resolves inbound images into a form the model can consume.
package media

import (
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/yeongin-ji/tammy-ai-server/internal/apperr"
)

// userAgent identifies this service when downloading an imageUrl.
const userAgent = "tammy-ai-server/1.0 (+https://github.com/yeongin-ji/tammy-ai-server)"

// allowedTypes are the image MIME types Gemini accepts.
var allowedTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/webp": true,
	"image/heic": true,
	"image/heif": true,
}

// Image is a resolved image ready to be attached to a model request.
type Image struct {
	MimeType string
	// Base64 holds the raw standard-encoded image bytes (no data: prefix).
	Base64 string
}

// DataURI renders the image as a data URI, which is how Genkit media parts
// carry inline binary content.
func (i Image) DataURI() string {
	return "data:" + i.MimeType + ";base64," + i.Base64
}

// Resolver turns either an image URL or a base64 payload into an Image.
type Resolver struct {
	client   *http.Client
	maxBytes int64
}

// NewResolver builds a Resolver bound to an HTTP client and a size ceiling.
func NewResolver(client *http.Client, maxBytes int64) *Resolver {
	return &Resolver{client: client, maxBytes: maxBytes}
}

// Resolve prefers base64 when both inputs are supplied, since it avoids a
// network round trip. It returns apperr values so handlers can pass them
// straight through.
func (r *Resolver) Resolve(ctx context.Context, imageURL, imageBase64 string) (*Image, error) {
	imageURL = strings.TrimSpace(imageURL)
	imageBase64 = strings.TrimSpace(imageBase64)

	switch {
	case imageBase64 != "":
		return r.fromBase64(imageBase64)
	case imageURL != "":
		return r.fromURL(ctx, imageURL)
	default:
		return nil, apperr.ErrImageRequired
	}
}

// fromBase64 accepts both a bare base64 string and a full data URI.
func (r *Resolver) fromBase64(payload string) (*Image, error) {
	mimeType := ""

	if strings.HasPrefix(payload, "data:") {
		// data:<mime>;base64,<payload>
		comma := strings.Index(payload, ",")
		if comma < 0 {
			return nil, apperr.ErrInvalidRequest.WithCause(fmt.Errorf("malformed data URI"))
		}
		header := payload[5:comma]
		payload = payload[comma+1:]
		mimeType, _, _ = strings.Cut(header, ";")
	}

	// Tolerate whitespace and URL-safe alphabets from sloppy encoders.
	payload = strings.NewReplacer("\n", "", "\r", "", " ", "").Replace(payload)
	raw, err := decodeBase64(payload)
	if err != nil {
		return nil, apperr.ErrInvalidRequest.WithCause(fmt.Errorf("base64 decode: %w", err))
	}

	if int64(len(raw)) > r.maxBytes {
		return nil, apperr.ErrImageTooLarge
	}

	// Trust sniffing over a client-declared MIME type, which is often wrong.
	if sniffed := sniff(raw); sniffed != "" {
		mimeType = sniffed
	}
	if !allowedTypes[mimeType] {
		return nil, apperr.ErrUnsupportedMediaType
	}

	return &Image{
		MimeType: mimeType,
		Base64:   base64.StdEncoding.EncodeToString(raw),
	}, nil
}

func (r *Resolver) fromURL(ctx context.Context, url string) (*Image, error) {
	if !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
		return nil, apperr.ErrInvalidRequest.WithCause(fmt.Errorf("imageUrl must be http(s)"))
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, apperr.ErrInvalidRequest.WithCause(err)
	}
	// Go sends no User-Agent by default and several CDNs answer 403 to that.
	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("Accept", "image/*")

	resp, err := r.client.Do(req)
	if err != nil {
		return nil, apperr.ErrImageFetchFailed.WithCause(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, apperr.ErrImageFetchFailed.WithCause(
			fmt.Errorf("upstream returned %d", resp.StatusCode))
	}

	// Read one byte past the cap so we can tell "exactly at limit" from "over".
	raw, err := io.ReadAll(io.LimitReader(resp.Body, r.maxBytes+1))
	if err != nil {
		return nil, apperr.ErrImageFetchFailed.WithCause(err)
	}
	if int64(len(raw)) > r.maxBytes {
		return nil, apperr.ErrImageTooLarge
	}

	mimeType := sniff(raw)
	if mimeType == "" {
		mimeType, _, _ = strings.Cut(resp.Header.Get("Content-Type"), ";")
		mimeType = strings.TrimSpace(mimeType)
	}
	if !allowedTypes[mimeType] {
		return nil, apperr.ErrUnsupportedMediaType
	}

	return &Image{
		MimeType: mimeType,
		Base64:   base64.StdEncoding.EncodeToString(raw),
	}, nil
}

// decodeBase64 tries the standard alphabet first, then the URL-safe one, and
// falls back to unpadded variants.
func decodeBase64(s string) ([]byte, error) {
	encodings := []*base64.Encoding{
		base64.StdEncoding,
		base64.URLEncoding,
		base64.RawStdEncoding,
		base64.RawURLEncoding,
	}
	var lastErr error
	for _, enc := range encodings {
		raw, err := enc.DecodeString(s)
		if err == nil {
			return raw, nil
		}
		lastErr = err
	}
	return nil, lastErr
}

// sniff identifies the image type from its magic bytes, returning "" when the
// format is unrecognized.
func sniff(raw []byte) string {
	switch {
	case len(raw) >= 3 && raw[0] == 0xFF && raw[1] == 0xD8 && raw[2] == 0xFF:
		return "image/jpeg"
	case len(raw) >= 8 && string(raw[:8]) == "\x89PNG\r\n\x1a\n":
		return "image/png"
	case len(raw) >= 12 && string(raw[:4]) == "RIFF" && string(raw[8:12]) == "WEBP":
		return "image/webp"
	case len(raw) >= 12 && string(raw[4:8]) == "ftyp":
		switch string(raw[8:12]) {
		case "heic", "heix", "hevc", "heim", "heis", "hevm":
			return "image/heic"
		case "mif1", "msf1", "heif":
			return "image/heif"
		}
	}
	return ""
}

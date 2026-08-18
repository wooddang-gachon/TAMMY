# ---- build ----
FROM golang:1.25-alpine AS build

WORKDIR /src

# Cache dependencies separately from source so edits don't re-download modules.
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# CGO off keeps the binary static so it runs on a scratch base.
# Prompts are embedded via //go:embed, so nothing else ships alongside it.
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w" \
    -o /out/server ./cmd/server

# ---- runtime ----
FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /
COPY --from=build /out/server /server

# Cloud Run overrides this with its own PORT value.
ENV PORT=8000
EXPOSE 8000

USER nonroot:nonroot
ENTRYPOINT ["/server"]

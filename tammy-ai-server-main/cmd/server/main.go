// Command server runs the TAMMY AI server.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/yeongin-ji/tammy-ai-server/internal/ai"
	"github.com/yeongin-ji/tammy-ai-server/internal/config"
	"github.com/yeongin-ji/tammy-ai-server/internal/handler"
	"github.com/yeongin-ji/tammy-ai-server/internal/router"

	_ "github.com/yeongin-ji/tammy-ai-server/docs"
)

//	@title			TAMMY AI Server API
//	@version		1.0
//	@description	웰니스 펫 에이전트 '타미'의 AI 서버입니다. 서비스 서버와 내부 통신하며, 상태를 저장하지 않습니다.
//	@description	Cloud Run은 인증되지 않은 호출을 허용하며, 접근 제어는 `X-Internal-Api-Key` 헤더가 담당합니다.

//	@license.name	MIT

// @securityDefinitions.apikey	InternalApiKey
// @in							header
// @name						X-Internal-Api-Key
// @description				서비스 서버와 공유하는 내부 API 키
func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})))

	if err := run(); err != nil {
		slog.Error("server exited with error", "error", err)
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	// Genkit initialization loads and validates every prompt, so a bad
	// template fails startup rather than a live request.
	ctx := context.Background()
	client, err := ai.New(ctx, cfg)
	if err != nil {
		return err
	}

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: router.New(cfg, handler.New(client)),
		// Reports over long histories are slow; allow generous write time but
		// keep header reads tight to shed slow-loris connections.
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       cfg.RequestTimeout,
		WriteTimeout:      cfg.RequestTimeout,
		IdleTimeout:       120 * time.Second,
	}

	// Cloud Run sends SIGTERM before reclaiming an instance; drain in-flight
	// requests rather than dropping them.
	shutdownDone := make(chan struct{})
	go func() {
		defer close(shutdownDone)

		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGTERM, syscall.SIGINT)
		<-sigCh

		slog.Info("shutdown signal received, draining connections")
		drainCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		if err := srv.Shutdown(drainCtx); err != nil {
			slog.Error("graceful shutdown failed", "error", err)
		}
	}()

	slog.Info("tammy ai server listening", "port", cfg.Port, "mode", cfg.GinMode)

	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}

	<-shutdownDone
	slog.Info("server stopped")
	return nil
}

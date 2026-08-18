// Package router wires the HTTP routes.
package router

import (
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"github.com/yeongin-ji/tammy-ai-server/internal/config"
	"github.com/yeongin-ji/tammy-ai-server/internal/handler"
	"github.com/yeongin-ji/tammy-ai-server/internal/middleware"
)

// New builds the Gin engine with every route mounted.
func New(cfg *config.Config, h *handler.Handler) *gin.Engine {
	gin.SetMode(cfg.GinMode)

	r := gin.New()
	r.Use(middleware.Recovery(), middleware.RequestLogger())

	// Health stays unauthenticated so Cloud Run and external monitors can probe it.
	//
	// /healthz is also registered, but on Cloud Run that exact path is swallowed
	// by the Google frontend and never reaches the container, so /health is the
	// one to point external monitors at.
	r.GET("/health", h.HealthCheck)
	r.GET("/healthz", h.HealthCheck)

	auth := middleware.APIKeyAuth(cfg.InternalAPIKey)

	// The service accepts unauthenticated callers, so the docs sit behind the
	// same key as the API rather than advertising the surface to the internet.
	r.GET("/swagger/*any", auth, ginSwagger.WrapHandler(swaggerFiles.Handler))

	v1 := r.Group("/v1", auth)
	{
		v1.POST("/vision/analyze-food", h.AnalyzeFood)
		v1.POST("/nutrition/lookup", h.LookupNutrition)
		v1.POST("/chat/process", h.ProcessChat)

		reports := v1.Group("/reports")
		{
			reports.POST("/diet", h.DietReport)
			reports.POST("/mindfulness", h.MindfulnessReport)
			reports.POST("/lifestyle", h.LifestyleReport)
			reports.POST("/hydration", h.HydrationReport)
			reports.POST("/retrospective", h.RetrospectiveReport)
		}
	}

	return r
}

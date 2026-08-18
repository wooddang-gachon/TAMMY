package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/yeongin-ji/tammy-ai-server/internal/dto"
)

// All five reports return the same envelope: a Tammy-voiced Markdown body plus
// a title and a short list of gentle suggestions. Only the input differs.
//
// Every request also accepts an optional `dataDensity` of thin | normal | rich.
// The service server labels the cycle by activity count so a short trip reads
// as "short and sweet" rather than as a thin report. Numbers and charts stay on
// the client — the body only ever talks about what they mean.

// DietReport godoc
//
//	@Summary		식습관 리포트
//	@Description	날짜별 식사 기록을 받아 꾸준히 건강한 식습관을 유지하도록 돕는 리포트를 마크다운으로 반환합니다.
//	@Description	칭찬할 부분을 먼저 짚고, 아쉬운 부분은 개선 가능성을 강조하는 방식으로 작성됩니다.
//	@Tags			reports
//	@Accept			json
//	@Produce		json
//	@Param			request	body		dto.DietReportRequest	true	"날짜별 식사 기록"
//	@Success		200		{object}	dto.ReportResponse
//	@Failure		400		{object}	dto.ErrorResponse	"요청 형식 오류"
//	@Failure		502		{object}	dto.ErrorResponse	"모델 오류"
//	@Failure		504		{object}	dto.ErrorResponse	"모델 응답 지연"
//	@Router			/v1/reports/diet [post]
func (h *Handler) DietReport(c *gin.Context) {
	var req dto.DietReportRequest
	if !bind(c, &req) {
		return
	}
	res, err := h.AI.DietReport(c.Request.Context(), req)
	if err != nil {
		fail(c, err)
		return
	}
	c.JSON(http.StatusOK, res)
}

// MindfulnessReport godoc
//
//	@Summary		마음챙김 리포트
//	@Description	감정 기록(퀵버튼), 대화 로그, 감정일기를 받아 심리적 측면에서 분석합니다. 세 소스는 모두 선택이며, 사용자가 실제로 남긴 것만 보내면 됩니다.
//	@Description	감정적 식사 신호, 힘들었던 일, 감정의 변화를 중심으로 작성되며, 일기가 있으면 리포트의 중심에 둡니다.
//	@Description	일기 원문은 가장 민감한 입력입니다. 어떤 로그에도 기록되지 않으며 `diaryId`는 모델에 전달되지 않습니다.
//	@Description	심리 진단은 수행하지 않으며, 위험 신호가 반복되면 전문가 상담을 부드럽게 권합니다.
//	@Tags			reports
//	@Accept			json
//	@Produce		json
//	@Param			request	body		dto.MindfulnessReportRequest	true	"감정 기록 · 대화 로그 · 감정일기"
//	@Success		200		{object}	dto.ReportResponse
//	@Failure		400		{object}	dto.ErrorResponse	"요청 형식 오류"
//	@Failure		502		{object}	dto.ErrorResponse	"모델 오류"
//	@Failure		504		{object}	dto.ErrorResponse	"모델 응답 지연"
//	@Router			/v1/reports/mindfulness [post]
func (h *Handler) MindfulnessReport(c *gin.Context) {
	var req dto.MindfulnessReportRequest
	if !bind(c, &req) {
		return
	}
	res, err := h.AI.MindfulnessReport(c.Request.Context(), req)
	if err != nil {
		fail(c, err)
		return
	}
	c.JSON(http.StatusOK, res)
}

// LifestyleReport godoc
//
//	@Summary		생활습관 리포트
//	@Description	운동/활동 기록을 받아 분석합니다. 격한 운동이 아니라 **가벼운 움직임을 자주** 하는 것이 좋다는 관점으로 작성됩니다.
//	@Description	`dailySteps`는 날짜(YYYY-MM-DD)를 키로 하는 걸음 수 맵으로, 선택 항목입니다.
//	@Tags			reports
//	@Accept			json
//	@Produce		json
//	@Param			request	body		dto.LifestyleReportRequest	true	"운동/활동 기록"
//	@Success		200		{object}	dto.ReportResponse
//	@Failure		400		{object}	dto.ErrorResponse	"요청 형식 오류"
//	@Failure		502		{object}	dto.ErrorResponse	"모델 오류"
//	@Failure		504		{object}	dto.ErrorResponse	"모델 응답 지연"
//	@Router			/v1/reports/lifestyle [post]
func (h *Handler) LifestyleReport(c *gin.Context) {
	var req dto.LifestyleReportRequest
	if !bind(c, &req) {
		return
	}
	res, err := h.AI.LifestyleReport(c.Request.Context(), req)
	if err != nil {
		fail(c, err)
		return
	}
	c.JSON(http.StatusOK, res)
}

// HydrationReport godoc
//
//	@Summary		수분 분석 리포트
//	@Description	수분 섭취 기록을 받아 분석합니다. 원활한 대사에서 수분이 하는 역할을 강조하며 작성됩니다.
//	@Description	`dailyGoalMl`을 생략하면 1500ml를 기본 목표로 사용합니다.
//	@Tags			reports
//	@Accept			json
//	@Produce		json
//	@Param			request	body		dto.HydrationReportRequest	true	"수분 섭취 기록"
//	@Success		200		{object}	dto.ReportResponse
//	@Failure		400		{object}	dto.ErrorResponse	"요청 형식 오류"
//	@Failure		502		{object}	dto.ErrorResponse	"모델 오류"
//	@Failure		504		{object}	dto.ErrorResponse	"모델 응답 지연"
//	@Router			/v1/reports/hydration [post]
func (h *Handler) HydrationReport(c *gin.Context) {
	var req dto.HydrationReportRequest
	if !bind(c, &req) {
		return
	}
	res, err := h.AI.HydrationReport(c.Request.Context(), req)
	if err != nil {
		fail(c, err)
		return
	}
	c.JSON(http.StatusOK, res)
}

// RetrospectiveReport godoc
//
//	@Summary		장기 회고 리포트
//	@Description	전체 대화 로그와 함께 식사/활동/수분/감정 기록을 받아 웰니스 관점에서 네 가지 측면을 다각도로 분석합니다.
//	@Description	서비스 서버는 이 리포트를 매월 1일에 발행하므로 `period`는 보통 한 달입니다.
//	@Description	각 측면을 개별적으로 보는 것이 아니라 **서로 어떻게 연결되는지**에 초점을 맞춥니다.
//	@Description	입력이 가장 큰 엔드포인트이므로 응답 시간이 가장 깁니다. 서비스 서버에서는 비동기 처리를 권장합니다.
//	@Description	대화 로그는 최근 400턴까지만 모델에 전달됩니다.
//	@Tags			reports
//	@Accept			json
//	@Produce		json
//	@Param			request	body		dto.RetrospectiveReportRequest	true	"전체 기록"
//	@Success		200		{object}	dto.ReportResponse
//	@Failure		400		{object}	dto.ErrorResponse	"요청 형식 오류"
//	@Failure		502		{object}	dto.ErrorResponse	"모델 오류"
//	@Failure		504		{object}	dto.ErrorResponse	"모델 응답 지연"
//	@Router			/v1/reports/retrospective [post]
func (h *Handler) RetrospectiveReport(c *gin.Context) {
	var req dto.RetrospectiveReportRequest
	if !bind(c, &req) {
		return
	}
	res, err := h.AI.RetrospectiveReport(c.Request.Context(), req)
	if err != nil {
		fail(c, err)
		return
	}
	c.JSON(http.StatusOK, res)
}

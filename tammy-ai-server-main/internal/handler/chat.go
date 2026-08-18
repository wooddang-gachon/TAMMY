package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/yeongin-ji/tammy-ai-server/internal/dto"
)

// ProcessChat godoc
//
//	@Summary		타미 대화 처리 및 감정 분석
//	@Description	현재 발화와 이전 대화 히스토리를 받아 타미 페르소나로 답변하고, **사용자 발화에 대한 감정 분석 결과**를 함께 반환합니다.
//	@Description	이 서버는 상태를 저장하지 않으므로 대화 맥락이 필요하면 `history`에 이전 턴을 담아 보내야 합니다.
//	@Description	`history`는 오래된 순서대로 정렬되어야 하며, 최근 30턴만 모델에 전달됩니다.
//	@Description	`emotion.state`는 서비스 서버의 `EmotionState` enum(HAPPY, SAD, ANGRY, STRESSED, CALM)과 동일합니다.
//	@Description	`emotion.motionType`은 타미의 반응 모션입니다.
//	@Tags			chat
//	@Accept			json
//	@Produce		json
//	@Param			request	body		dto.ChatRequest	true	"현재 발화와 대화 히스토리"
//	@Success		200		{object}	dto.ChatResponse
//	@Failure		400		{object}	dto.ErrorResponse	"요청 형식 오류"
//	@Failure		502		{object}	dto.ErrorResponse	"모델 오류"
//	@Failure		504		{object}	dto.ErrorResponse	"모델 응답 지연"
//	@Router			/v1/chat/process [post]
func (h *Handler) ProcessChat(c *gin.Context) {
	var req dto.ChatRequest
	if !bind(c, &req) {
		return
	}

	res, err := h.AI.Chat(c.Request.Context(), req)
	if err != nil {
		fail(c, err)
		return
	}
	c.JSON(http.StatusOK, res)
}

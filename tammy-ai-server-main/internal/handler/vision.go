package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/yeongin-ji/tammy-ai-server/internal/dto"
)

// AnalyzeFood godoc
//
//	@Summary		음식 이미지 분석 및 음식명/바운딩박스 추출
//	@Description	이미지를 받아 사진 속 음식을 모두 인식하고, 각 음식의 이름과 정규화된 바운딩 박스 좌표를 반환합니다.
//	@Description	`imageUrl` 또는 `imageBase64` 중 하나는 반드시 필요하며, 둘 다 주어지면 `imageBase64`가 우선합니다.
//	@Description	바운딩 박스는 이미지 크기와 무관한 0.0~1.0 정규화 좌표입니다.
//	@Description	영양 정보는 이 엔드포인트에서 제공하지 않습니다. 반환된 음식명으로 `/v1/nutrition/lookup`을 호출하세요.
//	@Tags			vision
//	@Accept			json
//	@Produce		json
//	@Param			request	body		dto.VisionAnalyzeRequest	true	"분석할 이미지"
//	@Success		200		{object}	dto.VisionAnalyzeResponse
//	@Failure		400		{object}	dto.ErrorResponse	"요청 형식 오류 또는 이미지 누락"
//	@Failure		413		{object}	dto.ErrorResponse	"이미지 용량 초과"
//	@Failure		415		{object}	dto.ErrorResponse	"지원하지 않는 이미지 형식"
//	@Failure		502		{object}	dto.ErrorResponse	"이미지 다운로드 실패 또는 모델 오류"
//	@Router			/v1/vision/analyze-food [post]
func (h *Handler) AnalyzeFood(c *gin.Context) {
	var req dto.VisionAnalyzeRequest
	if !bind(c, &req) {
		return
	}

	res, err := h.AI.AnalyzeFood(c.Request.Context(), req)
	if err != nil {
		fail(c, err)
		return
	}
	c.JSON(http.StatusOK, res)
}

package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/yeongin-ji/tammy-ai-server/internal/dto"
)

// LookupNutrition godoc
//
//	@Summary		음식명 배열로 영양 정보 조회
//	@Description	음식 이름 배열을 받아 웹 검색을 통해 각 음식의 칼로리, 탄수화물, 단백질, 지방, 비타민/무기질 충족률을 조사하고 출처를 함께 반환합니다.
//	@Description	응답의 `items`는 요청한 `foodNames`와 **같은 순서, 같은 개수**로 반환되므로 인덱스로 짝지을 수 있습니다.
//	@Description	검색으로 확인하지 못한 음식은 수치가 0, `confidence`가 0으로 채워집니다.
//	@Description	웹 검색과 구조화를 위해 모델을 두 번 호출하므로 다른 엔드포인트보다 응답이 느립니다.
//	@Tags			nutrition
//	@Accept			json
//	@Produce		json
//	@Param			request	body		dto.NutritionLookupRequest	true	"조회할 음식명 목록"
//	@Success		200		{object}	dto.NutritionLookupResponse
//	@Failure		400		{object}	dto.ErrorResponse	"요청 형식 오류"
//	@Failure		502		{object}	dto.ErrorResponse	"모델 오류"
//	@Failure		504		{object}	dto.ErrorResponse	"모델 응답 지연"
//	@Router			/v1/nutrition/lookup [post]
func (h *Handler) LookupNutrition(c *gin.Context) {
	var req dto.NutritionLookupRequest
	if !bind(c, &req) {
		return
	}

	res, err := h.AI.LookupNutrition(c.Request.Context(), req)
	if err != nil {
		fail(c, err)
		return
	}
	c.JSON(http.StatusOK, res)
}

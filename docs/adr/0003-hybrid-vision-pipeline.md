# ADR 0003: Hybrid Vision Pipeline (Local Edge ONNX + Cloud LLM Fallback)

## Status
Accepted

## Context
식단 사진을 통한 영양 분석 시, 매 요청마다 클라우드 멀티모달 LLM(Gemini Vision 등)을 호출하면 사용자 1인당 발생하는 API 토큰 비용이 급증하고, 네트워크 왕복 및 LLM 추론 시간(평균 3~8초)으로 인해 모바일 즉각 기록 경험이 저해됩니다. 반면 순수 로컬 모델만 사용할 경우 복합 상차림(다품종 한정식 등)에 대한 정밀 인식이 어렵습니다.

## Decision
1. **Tier 1 (Local Edge Inference via ONNX)**:
   - 백엔드 프로세스 내에 경량화된 `YOLOv8-Food` (`best.onnx`) 모델과 Sharp 이미지 프로세서를 내장.
   - 메모리 내 직접 추론을 통해 300~500ms 이내에 Bounding Box 및 음식 라벨을 추출하고, 사전 구축된 식약처 표준 영양 DB(15,000건)와 인메모리/인덱스 매핑.
   - 단일 음식/기본 식단에 대해 API 호출 비용 $0 및 초저지연 응답 달성.
2. **Tier 2 (Cloud LLM Fallback via Go AI Server)**:
   - 로컬 검출 신뢰도(Confidence)가 기준치 미만이거나 복합 다품종 식단인 경우, GCP Cloud Run에 배포된 Go + Genkit (Gemini 3.5 Flash Lite) 비전 파이프라인으로 자동 2차 질의.
   - 웹 검색 기반 영양 정보 조회 및 정밀 파싱 지원.

## Consequences
- **장점**: 대다수의 일상 식단 기록 시 API 비용을 $0으로 절감하고 즉각적인 UI 반응성 확보. 장애 발생 시 식약처 DB 수동 검색으로 무결한 폴백 보장.
- **트레이드오프**: 백엔드 서버의 초기 메모리 풋프린트 증가(ONNX 런타임 및 모델 로드) 및 식약처 DB 1.5만 건 시딩 관리 필요.

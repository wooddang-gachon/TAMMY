# TAMMY Architecture Decision Records (ADRs)

| 번호 | 제목 | 상태 | 핵심 내용 |
| :--- | :--- | :--- | :--- |
| [0001](file:///Users/wooddang-mac/Desktop/code/1.%20Study/TAMMY/docs/adr/0001-star-travel-two-gauge-and-lifecycle.md) | Star Travel Two-Gauge System and Lifecycle Separation | Accepted | 전역 Fuel(0~100) + 행성별 Distance(100~0) 2-게이지 및 출발/도착 분리 |
| [0002](file:///Users/wooddang-mac/Desktop/code/1.%20Study/TAMMY/docs/adr/0002-idempotency-and-retro-backfill.md) | Idempotency and Retro Backfill Strategy | Accepted | `clientRequestId` 기반 멱등성 보장 및 회고 리포트 자동 백필 |
| [0003](file:///Users/wooddang-mac/Desktop/code/1.%20Study/TAMMY/docs/adr/0003-hybrid-vision-pipeline.md) | Hybrid Vision Pipeline (Local Edge ONNX + Cloud LLM Fallback) | Accepted | 백엔드 내장 ONNX YOLOv8(비용 $0) + Cloud Gemini Vision 2단계 파이프라인 |
| [0004](file:///Users/wooddang-mac/Desktop/code/1.%20Study/TAMMY/docs/adr/0004-text-emotion-sprite-sync-over-audio.md) | Text-Based Conversational Chat with Emotion-Sprite Sync | Accepted | STT/TTS 배제 및 텍스트 감정 분석 + 6종 타미 픽셀 모션 동기화 |

# ADR 0004: Text-Based Conversational Chat with Emotion-Sprite Sync (Exclusion of Audio STT/TTS)

## Status
Accepted

## Context
초기 기획에서 Web Speech API 기반의 STT(음성인식) 및 TTS(음성합성) 인터페이스 도입을 검토하였으나, 모바일 브라우저별 API 지원 파편화(iOS Safari vs Android Chrome), 공공장소/사무실 환경에서의 음성 입력 사용성 저하, 배경 소음으로 인한 오인식, 그리고 음성 재생 지연으로 인한 대화 흐름 끊김 문제가 식별되었습니다.

## Decision
1. **오디오 엔진(STT / TTS) 배제**:
   - 실시간 오디오 파이프라인(마이크 권한, 브라우저 음성합성 엔진)을 시스템 핵심 스펙에서 제외하여 클라이언트 번들 크기 경량화 및 크로스 브라우징 안정성 확보.
2. **텍스트 기반 공감 대화 및 감정 모션 동기화 집중**:
   - 사용자의 텍스트 채팅 입력을 기반으로 Cloud AI Server(Gemini)가 5대 감정 상태(`HAPPY`, `SAD`, `ANGRY`, `STRESSED`, `CALM`)를 신속히 판별.
   - 응답에 6종의 타미 픽셀 모션 태그(`PAT_PAT_HEAD`, `JUMP_JOY`, `HUG`, `NOD_SLOWLY`, `CHEER_UP`, `SIT_BESIDE`)를 부여하여 프론트엔드 스프라이트 애니메이션을 동기화.

## Consequences
- **장점**: 모든 모바일/데스크톱 브라우저에서 100% 일관된 대화 UX 제공, 마이크 권한 요청 거부로 인한 이탈 방지, 텍스트 일기/채팅 데이터의 안전한 감사 로깅.
- **트레이드오프**: 운전 중이나 손을 쓸 수 없는 핸즈프리 환경에서의 음성 인터랙션 미지원.

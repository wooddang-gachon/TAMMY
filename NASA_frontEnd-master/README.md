# TAMMY — AI Health Care App (Frontend)

공감형 픽셀 요정 **타미(TAMMY)**와 함께하는 AI 헬스케어 앱의 React 프론트엔드입니다.
디자인 레퍼런스는 프로젝트 루트의 `TAMMY v2.dc.html` (HTML 프로토타입)이며, 이 프로젝트는 그것을 실서비스 구조로 옮긴 코드입니다.

## 기술 스택
- React 18 + TypeScript
- Tailwind CSS (디자인 토큰: `tailwind.config.ts`)
- Framer Motion (플로팅 · 스프링 · 진행률 애니메이션)
- Vite

## 실행
```bash
npm install
npm run dev
```

## 구조
```
src/
  api/client.ts        # API 클라이언트 (USE_MOCK 플래그로 mock ↔ 실서버 전환)
  mocks/               # Mock Data — 백엔드 응답 스키마와 동일
  types.ts             # 도메인 타입 (API 응답과 1:1)
  hooks/
    useFuel.tsx        # ★ 우주여행 성장 시스템 (연료·행성·보상·도착 연출)
    useChat.ts         # TAMMY 대화 + 장기기억 (localStorage)
    useSpeech.ts       # STT(SpeechRecognition) / TTS(SpeechSynthesis), ko-KR
  components/
    ui/                # Card, PrimaryButton, ProgressBar 등 공통 UI
    space/             # SpaceStrip(홈 미니 우주), RewardToast, ArrivalOverlay
    layout/BottomNav
  screens/             # Home / Chat / Food / Exercise / Report / Travel
```

## API 연결 방법
`src/api/client.ts`의 `USE_MOCK = false`, `VITE_API_URL` 설정 후 아래 엔드포인트만 구현하면
모든 화면이 그대로 동작합니다.

| Method | Path | 응답 타입 | 화면 |
|---|---|---|---|
| POST | /food | `NutritionData` | 음식 분석 |
| GET | /exercise | `ExercisePlan` | AI 운동 추천 |
| GET | /report | `MonthlyReport` | 월간 리포트 |
| POST | /chat | `{ reply, memory }` | TAMMY 채팅 |

## 우주여행 성장 시스템 (핵심)
`useFuel()`이 단일 소스입니다. 건강 행동이 일어나는 곳에서 이벤트만 발행하세요:

```ts
const { addFuel } = useFuel();
addFuel('FOOD_ANALYZED');  // +5 연료
addFuel('WORKOUT_DONE');   // +10 연료
addFuel('GOAL_ACHIEVED');  // +15 연료
```

자동으로 처리되는 것:
- 홈 `SpaceStrip` 우주선이 스프링 애니메이션으로 전진
- `RewardToast` 보상 토스트 (+N 연료 + 타미 리액션)
- 연료 100% 도달 시 다음 행성으로 이동 + `ArrivalOverlay` 도착 연출 (행성 확대 · Confetti · 타미 축하)
- localStorage 저장 (`tammy.space.v1`)

보상 정책은 `src/mocks/planets.ts`의 `FUEL_REWARDS`에서 관리하며, 추후 백엔드 정책과 동기화하면 됩니다.

## 음성 (실동작)
- **STT**: 채팅 입력창 마이크 버튼 — Web Speech API `SpeechRecognition` (ko-KR), 실시간 입력, 듣는 중 Pulse, 미지원/권한 거부 안내 처리
- **TTS**: 타미 메시지의 🔊 버튼 — `SpeechSynthesis` (ko-KR), 재클릭 시 중지, AI 답변 자동 읽기

## 디자인 토큰
`tailwind.config.ts` 참조 — cream `#FFF9F5`, ink `#5C4A66`, lavender `#C9B6FF`, pink `#F0A8C8`,
space `#4E4368`, 카드 radius 26px, 그림자 `0 10px 28px rgba(160,130,190,.14)`.
폰트: Pretendard Variable.

## 캐릭터 에셋
`src/assets/px-*.png` — 공식 TAMMY 픽셀 캐릭터 (투명 배경). `image-rendering: pixelated`(`.pixelated`)로 렌더링하세요. 캐릭터는 절대 재해석하지 않습니다.

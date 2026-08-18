# 서비스 서버 연동 변경 요청서

AI 서버(이 레포)와 서비스 서버([NASA_backEnd](https://github.com/wooddang-gachon/NASA_backEnd))의 계약을 맞추기 위해 **서비스 서버 측에 필요한 변경**을 정리한 문서입니다.

기준 파일은 `src/services/aiService.ts` 와 `src/interfaces/` 입니다.

---

## 요약

| 항목 | 서비스 서버 현재 | AI 서버 |
|---|---|---|
| 비전 엔드포인트 | 1회 호출로 음식명 + 영양소 | **2단계 분리** (인식 → 영양 조회) |
| 음식명 | `foodName: string` (단수) | `foods[]` (배열) + 바운딩 박스 |
| 이미지 전송 | `imageUrl` | `imageUrl` **또는** `imageBase64` (둘 다 지원) |
| 리포트 | 1개 (`/v1/reports/summarize`) | **5개** 엔드포인트 |
| 리포트 입력 | 집계 스칼라 4개 | 날짜별 원시 로그 |
| 대화 컨텍스트 | `recentMemories[]` | `history[]` (대화 로그 전체) |
| 기억 캡슐 추출 | `extractedMemory` 기대 | **제공하지 않음** (합의 완료) |
| 서버 간 인증 | 없음 | `X-Internal-Api-Key` 헤더 |

Base URL은 기존 `AI_SERVER_URL` 을 그대로 쓰면 됩니다. 경로도 `/v1/chat/process`, `/v1/vision/analyze-food` 는 유지했습니다.

---

## 1. 대화 API — `/v1/chat/process`

### 요청 변경

```diff
  {
    "userId": 12,
    "userMessage": "오늘 회사에서 일이 너무 많아서 힘들고 지쳤어",
-   "recentMemories": ["업무 스트레스로 심신이 많이 지쳐있는 상태"]
+   "history": [
+     { "role": "user",  "text": "안녕",   "createdAt": "2026-08-05T21:10:00Z" },
+     { "role": "tammy", "text": "왔구나!", "createdAt": "2026-08-05T21:10:02Z" }
+   ],
+   "nickname": "우당탕탕"
  }
```

- `history`는 **오래된 순서대로** 정렬해서 보내주세요. 최근 30턴만 모델에 전달됩니다.
- `chat_messages` 테이블에서 바로 뽑아 매핑하면 됩니다. `sender: "USER"` → `role: "user"`, `sender: "TAMMY"` → `role: "tammy"`.
- `nickname`은 선택 항목입니다. 주면 타미가 자연스러울 때 이름을 불러줍니다.

### 응답 변경

```diff
  {
    "replyText": "오늘 정말 많이 힘들었구나. 괜찮아, 우리 잠깐 바람 쐬러 갈까?",
    "emotion": { "state": "STRESSED", "motionType": "PAT_PAT_HEAD" }
-   "extractedMemory": { "category": "EMOTION_STATE", "content": "..." }
  }
```

### 필요한 작업

- `AiChatInternalPayload`에서 `recentMemories` 제거, `history` / `nickname` 추가
- `AiChatInternalResponse`에서 `extractedMemory` 제거
- `chatService.processChat`에서 `long_term_memories` 조회/upsert 로직 제거
- `chatService`가 `history`를 구성하도록 수정
- `src/interfaces/chat.ts` 주석의 `AI Server (Python/FastAPI)` → Go/Genkit으로 정정

### 감정 값 주의

`emotion.state`는 Prisma `EmotionState` enum(`HAPPY`/`SAD`/`ANGRY`/`STRESSED`/`CALM`)만 반환하도록 AI 서버에서 보정합니다. 그대로 `emotion_logs`에 기록해도 안전합니다.

현재 서비스 서버 코드에는 enum에 없는 값이 섞여 있어 **정리가 필요**합니다.

- `src/interfaces/chat.ts` 의 예시 `"COMFORTING"`
- `src/services/reportService.ts:95` 의 `dominantEmotions: ["STRESSED", "COMFORTED"]`

또한 현재 `chatService`는 감정을 응답에 담기만 하고 **`emotion_logs`에 저장하지 않습니다**. 마음챙김 리포트가 감정 로그에 의존한다면 저장 로직 추가가 필요합니다.

### ❗ 확인이 필요한 항목: `motionType`

서비스 서버에는 `motionType`에 대한 enum이 없고, `src/interfaces/chat.ts`에 예시로 `"PAT_PAT_HEAD"` 하나만 있습니다.

AI 서버는 아래 6개를 반환하도록 정의했지만, 이는 **AI 서버 측 제안**입니다.

| 값 | 사용 상황 |
|---|---|
| `PAT_PAT_HEAD` | 힘들어하는 사용자를 토닥일 때 |
| `JUMP_JOY` | 사용자와 함께 기뻐할 때 |
| `HUG` | 깊은 슬픔에 공감할 때 |
| `NOD_SLOWLY` | 조용히 들어줄 때 |
| `CHEER_UP` | 부드럽게 응원할 때 |
| `SIT_BESIDE` | 제안 없이 그냥 곁에 있어줄 때 |

**클라이언트의 실제 애니메이션 세트를 알려주시면 그에 맞게 조정하겠습니다.**

---

## 2. 비전 API — `/v1/vision/analyze-food`

가장 변경이 큰 부분입니다. **영양 정보가 이 엔드포인트에서 빠졌습니다.**

### 요청

```json
{ "imageUrl": "https://...", "mealType": "LUNCH" }
```

기존 요청 그대로 동작합니다. `imageBase64`도 지원하므로 클라이언트가 직접 올리는 흐름도 가능합니다.

### 응답 변경

```diff
  {
    "isIdentified": true,
-   "foodName": "김치찌개",
-   "totalCaloriesKcal": 243,
-   "carbohydrateG": 12.4,
-   "proteinG": 15.2,
-   "fatG": 13.8,
-   "vitaminPercent": 35,
-   "mineralPercent": 42,
+   "foods": [
+     {
+       "name": "김치찌개",
+       "boundingBox": { "x": 0.12, "y": 0.30, "width": 0.44, "height": 0.38 },
+       "confidence": 0.92
+     },
+     {
+       "name": "공기밥",
+       "boundingBox": { "x": 0.58, "y": 0.34, "width": 0.30, "height": 0.30 },
+       "confidence": 0.97
+     }
+   ],
    "comment": "오늘 점심 든든하게 챙겼구나, 좋다!"
  }
```

### 왜 분리했나

1. 사진 한 장에 여러 음식이 담기는 것이 일반적인데 `foodName`은 단수였습니다. DB의 `meals` ↔ `meal_items[]` 구조는 이미 다중 음식을 지원하므로, DTO만 맞추면 됩니다.
2. 인식 결과를 **사용자가 검수·수정한 뒤** 영양 정보를 조회하는 흐름을 지원하기 위해서입니다. 사용자가 "공기밥"을 "현미밥"으로 고쳤다면 고친 이름으로 영양 정보를 조회해야 정확합니다.

### 필요한 작업

- `AiVisionInternalResponse` / `FoodAnalyzeResponse` 를 배열 구조로 변경
- `foodService.analyzeFoodVision` 이 영양 정보를 기대하지 않도록 수정
- 영양 정보가 필요한 시점에 `/v1/nutrition/lookup` 호출 추가
- `meal_items[]` 저장 로직 연결 (현재 `logMeal`은 `comment`에 `foodName`을 문자열로 넣고 있음)
- `isIdentified: false` 처리는 그대로 유지 가능 (`SHOW_RETRY_AND_MANUAL_INPUT` 폴백)

### 바운딩 박스

**0.0 ~ 1.0 정규화 좌표**입니다. 원본 이미지 픽셀 크기를 곱해서 사용하세요.

```
left = x * imageWidth        top    = y * imageHeight
width = width * imageWidth   height = height * imageHeight
```

DB에 저장할 계획이라면 `meal_items`에 좌표 컬럼 4개가 필요합니다. 저장하지 않고 분석 응답에서만 쓰고 버려도 됩니다.

---

## 3. 영양 조회 API — `/v1/nutrition/lookup` (신규)

```jsonc
// 요청
{ "foodNames": ["김치찌개", "공기밥"] }

// 응답
{
  "items": [
    {
      "name": "김치찌개",
      "servingSizeG": 400,
      "caloriesKcal": 243,
      "carbohydrateG": 12.4,
      "proteinG": 15.2,
      "fatG": 13.8,
      "vitaminPercent": 35,
      "mineralPercent": 42,
      "sources": [
        {
          "title": "식품영양성분 데이터베이스 - 김치찌개",
          "url": "https://various.foodsafetykorea.go.kr/nutrient/",
          "publisher": "식품의약품안전처"
        }
      ],
      "confidence": 0.81
    }
  ]
}
```

- `items`는 요청한 `foodNames`와 **같은 순서, 같은 개수**로 반환됩니다. 인덱스로 짝지으면 됩니다.
- 검색으로 확인하지 못한 음식은 수치가 `0`, `confidence`가 `0`입니다. `confidence`가 낮으면 사용자에게 직접 입력을 유도하는 것을 권장합니다.
- `sources`는 URL이 검증된 것만 담깁니다. 비어 있을 수 있습니다.
- **웹 검색을 수행하므로 다른 엔드포인트보다 느립니다.** 필요하다면 `foods` 테이블에 캐싱하는 것을 권장합니다.

### 필요한 작업

- `aiService`에 `lookupNutrition` 메서드 추가
- 응답의 `sources`를 저장할 계획이라면 컬럼 또는 JSON 필드 추가 (현재 `foods` 테이블에 없음)

---

## 4. 리포트 API — 1개 → 5개

`/v1/reports/summarize` 는 **없어졌습니다.** 아래 5개로 나뉩니다.

| Path | 입력 |
|---|---|
| `/v1/reports/diet` | 날짜별 식사 기록 |
| `/v1/reports/mindfulness` | 대화 로그 |
| `/v1/reports/lifestyle` | 운동/활동 기록 |
| `/v1/reports/hydration` | 수분 기록 |
| `/v1/reports/retrospective` | 위 전부 + 전체 대화 로그 |

### 응답 (5개 공통)

```json
{
  "title": "우당탕탕님의 이번 주 식습관 이야기 🌱",
  "markdown": "## 이번 주, 잘 챙겨온 것들\n...",
  "nextActionChecks": ["내일 아침엔 물 한 잔부터 시작해볼까?"]
}
```

기존 `AiReportInternalResponse` 와 거의 그대로 매핑됩니다.

| AI 서버 | 서비스 서버 기존 |
|---|---|
| `title` | `summaryTitle` |
| `markdown` | `findings` |
| `nextActionChecks` | `nextActionChecks` |

`markdown`은 마크다운 문자열입니다. 클라이언트에서 마크다운 렌더링이 필요합니다.

### 요청 예시

```jsonc
// POST /v1/reports/diet
{
  "userId": 12,
  "nickname": "우당탕탕",
  "period": { "start": "2026-07-29", "end": "2026-08-05" },
  "dailyRecords": [
    {
      "date": "2026-08-05",
      "meals": [
        {
          "mealType": "LUNCH",
          "registeredAt": "2026-08-05T12:30:00Z",
          "foods": [
            { "name": "김치찌개", "caloriesKcal": 243, "carbohydrateG": 12.4, "proteinG": 15.2, "fatG": 13.8 }
          ]
        }
      ]
    }
  ]
}
```

```jsonc
// POST /v1/reports/hydration
{
  "userId": 12,
  "period": { "start": "2026-07-29", "end": "2026-08-05" },
  "waterLogs": [
    { "date": "2026-08-05", "recordedAt": "2026-08-05T09:10:00Z", "intakeMl": 250 }
  ],
  "dailyGoalMl": 1500
}
```

```jsonc
// POST /v1/reports/lifestyle
{
  "userId": 12,
  "period": { "start": "2026-07-29", "end": "2026-08-05" },
  "exerciseLogs": [
    { "date": "2026-08-05", "exerciseName": "걷기", "durationMinutes": 25, "burnedCaloriesKcal": 96, "isCompleted": true }
  ],
  "dailySteps": { "2026-08-05": 8200 }
}
```

`mindfulness` 는 `chatLogs`(대화 API의 `history`와 동일한 형태), `retrospective` 는 위 전부를 함께 받습니다. 전체 스키마는 Swagger를 참고하세요.

### ❗ 필요한 작업 — 원시 로그 조회 쿼리 신규 구현

현재 `reportService.generateOndemandReport` 는 집계 스칼라 4개만 보내고 있고, **그중 2개는 하드코딩된 더미값**입니다.

```ts
// src/services/reportService.ts:91
const weeklyStats = {
  waterGoalAchievedDays: 5,        // ← 하드코딩
  workoutCompletedDays: dashboardData.weeklyWorkoutCompletedDays,
  avgCalories: 1850,               // ← 하드코딩
  dominantEmotions: ["STRESSED", "COMFORTED"],  // ← 하드코딩 + enum 외 값
};
```

5개 리포트는 각각 원시 로그를 필요로 하므로, 아래 조회가 새로 필요합니다.

| 리포트 | 필요한 테이블 |
|---|---|
| diet | `meals` + `meal_items` + `foods` (날짜별 그룹핑) |
| mindfulness | `chat_messages` |
| lifestyle | `exercise_logs` + `exercises` |
| hydration | `water_logs` |
| retrospective | 위 전부 |

또한 `reportService.getReportById` 와 `getJobStatus` 도 현재 하드코딩된 값을 반환하고 있습니다.

### 장기 회고 리포트 주의

입력이 가장 크고 응답이 가장 느립니다(전체 대화 로그). 대화 로그는 최근 400턴까지만 모델에 전달됩니다.

`generateAsyncReport` 가 현재 `setTimeout` 기반 가짜 큐이므로, 실제 비동기 처리(작업 큐 + 상태 저장)가 필요합니다.

---

## 5. 인증

모든 `/v1/*` 요청에 헤더가 필요합니다.

```
X-Internal-Api-Key: <shared secret>
```

```diff
  const response = await fetch(`${config.ai.serverUrl}/v1/chat/process`, {
    method: "POST",
-   headers: { "Content-Type": "application/json" },
+   headers: {
+     "Content-Type": "application/json",
+     "X-Internal-Api-Key": config.ai.internalApiKey,
+   },
    body: JSON.stringify(payload),
  });
```

`.env`에 `AI_INTERNAL_API_KEY` 추가가 필요합니다. AI 서버는 `--allow-unauthenticated` 로 배포되어 ID 토큰을 요구하지 않으므로, **이 헤더가 유일한 인증 수단입니다.** 생략하면 401이 돌아옵니다.

### 사용하지 않는 설정

`src/config/index.ts:26` 의 `apiKey: process.env.NVIDIA_GLM_5_2_API_KEY` 는 AI 서버가 Gemini를 사용하므로 더 이상 쓰이지 않습니다. AI 서버가 자체적으로 키를 관리합니다.

---

## 6. 에러 처리

모든 비-2xx 응답이 동일한 형태로 통일되었습니다.

```json
{ "code": "AI_MODEL_ERROR", "message": "AI 모델 호출에 실패했습니다." }
```

기존 `AiServerError` 의 503 폴백은 그대로 두되, 응답 본문의 `code`를 활용하면 더 세밀한 처리가 가능합니다.

| Code | Status | 권장 처리 |
|---|---|---|
| `INVALID_REQUEST` | 400 | 요청 버그 — 로깅 후 500 |
| `IMAGE_REQUIRED` | 400 | 동일 |
| `UNAUTHORIZED` | 401 | 설정 오류 — 알림 |
| `IMAGE_TOO_LARGE` | 413 | 사용자에게 재촬영 안내 |
| `UNSUPPORTED_IMAGE_TYPE` | 415 | 동일 |
| `AI_MODEL_ERROR` | 502 | 재시도 후 폴백 UI |
| `IMAGE_FETCH_FAILED` | 502 | 이미지 URL 확인 |
| `AI_MODEL_TIMEOUT` | 504 | 재시도 |

---

## 체크리스트

- [ ] `motionType` 허용 목록을 클라이언트 애니메이션과 맞추기 **(AI 서버 회신 필요)**
- [ ] `AiChatInternalPayload` — `recentMemories` 제거, `history`/`nickname` 추가
- [ ] `AiChatInternalResponse` — `extractedMemory` 제거
- [ ] `chatService` — 기억 캡슐 로직 제거, `history` 구성
- [ ] `chatService` — `emotion_logs` 저장 추가 여부 결정
- [ ] `EmotionState` enum 외 값(`COMFORTED`, `COMFORTING`) 정리
- [ ] 비전 응답을 `foods[]` 배열 구조로 변경
- [ ] `/v1/nutrition/lookup` 호출 추가
- [ ] `meal_items[]` 저장 로직 연결
- [ ] 리포트 5종 엔드포인트로 분리
- [ ] 리포트용 원시 로그 조회 쿼리 구현 (하드코딩 더미값 제거)
- [ ] `X-Internal-Api-Key` 헤더 추가
- [ ] 장기 회고 리포트 비동기 처리
- [ ] `NVIDIA_GLM_5_2_API_KEY` 설정 제거

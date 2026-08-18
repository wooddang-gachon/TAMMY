# TAMMY AI Server

웰니스 펫 에이전트 **타미(Tammy)** 의 AI 서버입니다.
서비스 서버와 내부 REST API로 통신하며, **상태를 저장하지 않습니다**(stateless). 대화 맥락이나 기록은 매 요청마다 서비스 서버가 전달합니다.

- **Go 1.25** + [Gin](https://gin-gonic.com/)
- **[Genkit for Go](https://genkit.dev/go/docs/)** + Gemini (`gemini-3.5-flash-lite`)
- 프롬프트는 **[dotprompt](https://google.github.io/dotprompt/)** 로 관리하고, 하이퍼파라미터와 출력 스키마는 frontmatter에 선언
- **GCP Cloud Run** 배포

---

## 빠른 시작

```bash
cp .env.example .env   # GEMINI_API_KEY 채우기
make run
```

`.env`는 로컬 개발 편의를 위해 자동으로 로드됩니다. 실제 환경 변수가 항상 우선하며, 파일이 없어도 오류가 아닙니다(Cloud Run은 환경 변수를 직접 주입합니다).

```bash
open http://localhost:8000/swagger/index.html
```

| 명령 | 설명 |
|---|---|
| `make run` | 로컬 실행 (debug 모드) |
| `make test` | 테스트 (race detector 포함) |
| `make lint` | `gofmt` + `go vet` |
| `make docs` | Swagger 문서 재생성 |
| `make docker` | 컨테이너 이미지 빌드 |
| `make deploy` | Cloud Run 배포 |

---

## API

Cloud Run은 `--allow-unauthenticated` 로 배포되어 IAM 인증 없이 호출할 수 있습니다. 대신 모든 `/v1` 엔드포인트가 `X-Internal-Api-Key` 헤더를 요구하며, 이 키가 유일한 접근 제어 수단입니다. 그래서 `INTERNAL_API_KEY`가 비어 있으면 서버는 아예 뜨지 않습니다(로컬 `debug`·`test` 모드만 예외).

| Method | Path | 설명 |
|---|---|---|
| POST | `/v1/vision/analyze-food` | 이미지에서 음식 인식 + 바운딩 박스 |
| POST | `/v1/nutrition/lookup` | 음식명 배열 → 영양 정보 + 출처 (웹 검색) |
| POST | `/v1/chat/process` | 타미 대화 + 사용자 감정 분석 |
| POST | `/v1/reports/diet` | 식습관 리포트 |
| POST | `/v1/reports/mindfulness` | 마음챙김 리포트 |
| POST | `/v1/reports/lifestyle` | 생활습관 리포트 |
| POST | `/v1/reports/hydration` | 수분 분석 리포트 |
| POST | `/v1/reports/retrospective` | 장기 회고 리포트 |
| GET | `/health` | 헬스 체크 (인증 불필요) |

> `/healthz`도 같은 응답을 주지만, Cloud Run에서는 이 경로가 Google 프론트엔드에 가로막혀 컨테이너까지 오지 않습니다. 외부 모니터링은 **`/health`** 를 보세요.

전체 스키마는 `/swagger/index.html` 을 참고하세요. 이 경로도 API 키를 요구하므로, 배포본 문서를 브라우저로 볼 땐 리포지토리의 `docs/swagger.yaml` 을 쓰거나 로컬(`make run`)에서 여세요.

### 이미지 입력

`/v1/vision/analyze-food` 는 `imageUrl`과 `imageBase64`를 **모두** 지원합니다. 둘 다 오면 네트워크 왕복이 없는 `imageBase64`가 우선합니다.

```json
{ "imageUrl": "https://storage.googleapis.com/tammy/meal_1.jpg", "mealType": "LUNCH" }
{ "imageBase64": "data:image/jpeg;base64,/9j/4AAQ...", "mealType": "LUNCH" }
```

바운딩 박스는 **0.0 ~ 1.0 정규화 좌표**입니다. 원본 이미지 픽셀 크기를 곱해서 사용하세요.

```
left = x * imageWidth        top    = y * imageHeight
width = width * imageWidth   height = height * imageHeight
```

> 내부적으로는 Gemini의 네이티브 형식(`box_2d = [ymin, xmin, ymax, xmax]`, 0~1000 정수)으로 받아 위 형식으로 변환합니다. 모델에 직접 `x/y/width/height`를 요구하면 좌표 품질이 크게 떨어지기 때문입니다. 이 변환은 서버 내부에서만 일어나며 API 계약에는 영향이 없습니다.

한정식처럼 반찬이 많은 상차림은 항목이 40개를 넘기도 합니다. `vision_food.prompt`의 `maxOutputTokens`가 부족하면 JSON이 잘려 `AI_MODEL_ERROR`가 발생하므로 여유 있게(8192) 잡아두었습니다.

### 영양 정보 조회

음식 인식과 영양 조회는 **의도적으로 분리**되어 있습니다. 인식 결과를 사용자가 검수·수정한 뒤 조회하는 흐름을 지원하기 위해서입니다.

응답의 `items`는 요청한 `foodNames`와 **같은 순서, 같은 개수**로 반환되므로 인덱스로 짝지을 수 있습니다. 검색으로 확인하지 못한 음식은 수치가 `0`, `confidence`가 `0`으로 채워집니다.

이 엔드포인트는 웹 검색과 구조화를 위해 모델을 **두 번** 호출하므로 다른 엔드포인트보다 느립니다.

### 감정 값

`emotion.state`는 서비스 서버의 Prisma `EmotionState` enum과 정확히 일치합니다.

```
HAPPY | SAD | ANGRY | STRESSED | CALM
```

모델이 목록에 없는 값을 반환하면 `CALM`으로 보정되므로, 응답을 `emotion_logs`에 그대로 기록해도 안전합니다.

`emotion.motionType`은 타미의 반응 모션입니다.

```
PAT_PAT_HEAD | JUMP_JOY | HUG | NOD_SLOWLY | CHEER_UP | SIT_BESIDE
```

> ⚠️ `motionType` 목록은 **AI 서버 측 제안**입니다. 서비스 서버와 클라이언트에는 아직 이에 대응하는 enum이 없습니다. 클라이언트의 실제 애니메이션 세트와 맞춰야 합니다. → [SERVICE_INTEGRATION.md](SERVICE_INTEGRATION.md)

### 리포트 입력

리포트는 집계된 수치가 아니라 **날짜별 원시 로그**를 받습니다. 수치와 차트는 화면이 따로 보여주고, 이 서버는 그 기록이 사용자에게 어떤 의미인지만 씁니다.

마음챙김과 장기 회고는 감정을 **세 갈래**로 받습니다. 셋 다 선택 항목이니 사용자가 실제로 남긴 것만 보내면 됩니다.

| 필드 | 내용 | 리포트에서의 무게 |
|---|---|---|
| `emotionRecords[]` | 퀵버튼 감정 탭. 감정과 시각만 있고 글이 없음 | 분포와 흐름만. 사연을 추측하지 않음 |
| `chatLogs[]` | 타미와 주고받은 대화 | 맥락이 가장 풍부함 |
| `diaries[]` | 사용자가 직접 쓴 감정일기 | **가장 무겁게 다룸.** 일기가 있으면 리포트의 중심 |

일기 본문은 이 서버가 다루는 가장 민감한 입력입니다. 로그에 남기지 않으며, `diaryId`는 모델에 전달하지 않아 리포트 본문에 식별자가 새어나갈 수 없습니다.

모든 리포트는 `dataDensity`를 선택적으로 받습니다. 서비스 서버가 리포트 뒤의 활동 수를 세어 붙여주면, 기록이 적은 주기가 "빈약한 리포트"가 아니라 "짧지만 밀도 있는 이야기"로 읽힙니다.

```
thin (5개 미만) | normal (5~20) | rich (20 초과)
```

생략하면 지침 자체를 렌더하지 않으므로 프롬프트가 길어지지 않습니다. 모델이 데이터만 보고 알아서 판단합니다.

---

## 프로젝트 구조

```
cmd/server/          진입점, 그레이스풀 셧다운
internal/ai/         Genkit 플로우 (vision, nutrition, chat, report)
internal/dto/        요청·응답 타입 — 공개 계약
internal/handler/    HTTP 핸들러 + Swagger 주석
internal/media/      이미지 URL/base64 해석, 크기·형식 검증
internal/middleware/ 인증, 로깅, 패닉 복구
internal/router/     라우팅
internal/apperr/     에러 봉투 (code + message)
prompts/             dotprompt 템플릿 (바이너리에 임베드)
docs/                Swagger 생성물 — 직접 수정하지 마세요
```

### 프롬프트

`prompts/*.prompt` 는 `//go:embed`로 바이너리에 포함됩니다. 컨테이너에 프롬프트 파일을 따로 넣을 필요가 없습니다.

밑줄로 시작하는 파일은 **partial**입니다.

- `_persona.prompt` — 타미 페르소나. 대화와 리포트 전체가 공유합니다.
- `_report_rules.prompt` — 리포트 공통 작성 규칙.

하이퍼파라미터(`temperature`, `topP`, `maxOutputTokens`)와 출력 스키마는 각 `.prompt` 파일의 frontmatter에 있습니다. 환경 변수(`CHAT_MODEL` 등)로 모델만 덮어쓸 수 있습니다.

프롬프트를 수정한 뒤에는 반드시 테스트를 돌리세요. frontmatter 오류나 partial 누락을 잡아냅니다.

```bash
go test ./internal/ai/ -run TestPrompts
```

---

## 설정

| 변수 | 기본값 | 설명 |
|---|---|---|
| `GEMINI_API_KEY` | — | **필수.** `GOOGLE_API_KEY`로도 인식 |
| `PORT` | `8000` | Cloud Run이 자동 주입 |
| `GIN_MODE` | `release` | |
| `INTERNAL_API_KEY` | — | **필수** (`debug`·`test` 모드 제외). 비우면 기동 실패 |
| `VISION_MODEL` / `CHAT_MODEL` / `REPORT_MODEL` / `RESEARCH_MODEL` | `googleai/gemini-3.5-flash-lite` | frontmatter를 덮어씀 |
| `IMAGE_FETCH_TIMEOUT` | `15s` | |
| `MAX_IMAGE_BYTES` | `8388608` (8 MiB) | |
| `REQUEST_TIMEOUT` | `120s` | |

---

## 에러

모든 비-2xx 응답은 동일한 형태입니다.

```json
{ "code": "AI_MODEL_ERROR", "message": "AI 모델 호출에 실패했습니다." }
```

| Code | Status | |
|---|---|---|
| `INVALID_REQUEST` | 400 | 요청 형식 오류 |
| `IMAGE_REQUIRED` | 400 | `imageUrl`/`imageBase64` 둘 다 없음 |
| `UNAUTHORIZED` | 401 | 내부 API 키 불일치 |
| `IMAGE_TOO_LARGE` | 413 | |
| `UNSUPPORTED_IMAGE_TYPE` | 415 | JPEG/PNG/WebP/HEIC만 지원 |
| `AI_MODEL_ERROR` | 502 | 모델 호출 실패 |
| `IMAGE_FETCH_FAILED` | 502 | `imageUrl` 다운로드 실패 |
| `AI_MODEL_TIMEOUT` | 504 | |
| `INTERNAL_ERROR` | 500 | |

`code`는 서비스 서버의 폴백 동작과 연결되므로 함부로 이름을 바꾸지 마세요.

---

## 배포

```bash
make deploy
```

프롬프트가 임베드되어 있어 이미지는 정적 바이너리 하나뿐입니다(distroless, non-root, ~57MB).

시크릿은 Secret Manager로 주입합니다.

```bash
gcloud secrets create gemini-api-key --replication-policy=automatic
gcloud secrets create tammy-internal-api-key --replication-policy=automatic
```

장기 회고 리포트는 입력이 크고 응답이 느립니다. Cloud Run 타임아웃을 넉넉히(300s) 잡고, 서비스 서버에서는 비동기로 호출하는 것을 권장합니다.

---

## 서비스 서버 연동

현재 서비스 서버([NASA_backEnd](https://github.com/wooddang-gachon/NASA_backEnd))가 기대하는 계약과 이 서버의 계약에는 차이가 있습니다. 필요한 변경 사항은 [SERVICE_INTEGRATION.md](SERVICE_INTEGRATION.md)에 정리되어 있습니다.

---

## 실측 응답 시간

`gemini-3.5-flash-lite` 기준으로 측정한 값입니다(참고용).

| 엔드포인트 | 응답 시간 |
|---|---|
| `/v1/chat/process` | ~2s |
| `/v1/vision/analyze-food` (단일 음식) | ~5s |
| `/v1/vision/analyze-food` (한정식 40품) | ~8s |
| `/v1/nutrition/lookup` (3개 음식, 웹 검색 포함) | ~9s |
| 리포트 (식습관/마음챙김/생활습관/수분) | 3~6s |
| 리포트 (장기 회고) | 입력 크기에 비례, 3s~ |

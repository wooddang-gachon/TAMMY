# AI 상투적 어조(AI Cliché) 제거 및 학술·공학 기술 보고서 스타일 변환 가이드라인

본 가이드라인은 대규모 언어 모델(LLM)이 생성한 텍스트 특유의 홍보성 어조, 과장된 수식어, 구조적 상투성을 제거하고, IEEE/ACM 및 한국정보과학회(KIISE) 학술 논문과 산업계 공학 기술 보고서 수준의 정밀하고 객관적인 문체로 변환하기 위한 체계적 방법론을 제시합니다.

---

## 1. AI 생성 텍스트의 대표적 패턴 및 제거 대상 (AI Cliché & Anti-Patterns)

LLM 기반 텍스트 생성기는 통계적 특성상 일반화된 미사여구, 과도한 낙관론, 모호한 강조 표현을 빈번하게 생성합니다. 기술 보고서 및 학술 문서에서 반드시 제거해야 할 5대 패턴은 다음과 같습니다.

### 1.1. 과장된 수식어 및 마케팅성 버즈워드 (Hyperbolic Modifiers)
- **제거 대상 단어**: "전인적인(holistic)", "혁신적인(revolutionary/groundbreaking)", "비약적인(drastic)", "원천 차단(completely eliminate)", "극대화/최적화(maximize/optimize - 수치 없는 남용)", "완벽한(flawless/seamless)", "게임 체인저(game-changer)", "탁월한(exceptional)"
- **문제점**: 실증적 수치나 엔지니어링 한계에 대한 고찰 없이 절대적 효용성을 주장하여 공학적 신뢰성을 저해함.

### 1.2. 구조적 상투성과 기계적 서식 남용 (Structural Monotony)
- **과도한 볼드체 및 콜론(:) 나열**: 모든 문장의 서두에 볼드체 키워드와 콜론을 배치하여 읽기 피로도를 가중시키는 현상 (예: **핵심 기능**: 본 기능은 ~).
- **동어 반복형 인트로/아웃트로**: "현대 사회에서 ~의 중요성은 날로 커지고 있습니다", "본 시스템은 ~를 위한 획기적인 발걸음이 될 것입니다"와 같은 상투적 서론 및 결론.
- **불필요한 접속부사 및 추임새**: "또한", "더 나아가", "주목할 점은", "결론적으로 말하자면", "Delve into", "Crucial", "Vital", "Beacon".

### 1.3. 주체 및 메커니즘의 모호성 (Vague Agency & Mechanism)
- "AI가 데이터를 종합적으로 분석하여 스마트하게 추천합니다"와 같이 내부 알고리즘, 입력 파라미터, 의사결정 트리가 생략된 피상적 서술.

### 1.4. 절대적 보장 표현 (Unsubstantiated Absolutes)
- 분산 시스템이나 인공지능 추론의 확률적 특성을 무시한 "100% 보장", "오류 없는 작동", "즉각적인 실시간 처리(지연 시간 수치 없음)" 등의 단정적 표현.

---

## 2. 학술 논문 및 공학 보고서의 문체 원칙 (Engineering Principles)

IEEE Computer Society, ACM, 한국정보과학회 등 주요 학술 기구에서 요구하는 기술 문서 작성의 5대 핵심 원칙입니다.

### 2.1. 정량성과 증거 기반 서술 (Quantitative Precision)
- 모호한 정성적 형용사를 구체적인 벤치마크 수치, 오차 범위, 복잡도(Big-O), 신뢰구간(95% CI)으로 치환합니다.
- 예: "속도가 매우 빠르다" → "p99 기준 응답 지연 시간이 48ms 이내이다"

### 2.2. 인과관계와 메커니즘의 명시 (Causal Specificity)
- 상태 변화나 성능 향상의 기술적 원인(Trigger/Mechanism)을 주어-동사 구조로 명확히 연결합니다.
- 예: "효율성이 증대된다" → "ONNX 런타임의 양자화(INT8) 모델을 활용하여 GPU 메모리 점유율을 42% 절감함으로써 동시 처리량을 증대시킨다"

### 2.3. 가치중립성과 객관적 어조 (Neutral & Factual Tone)
- 감정적 수식, 주관적 평가(자랑, 자화자찬), 설득조의 문장을 배제하고 시스템의 설계 사양, 동작 방식, 측정된 결과를 사실 위주로 기록합니다.

### 2.4. 전략적 능동태/수동태 및 주어 설정 (Strategic Voice)
- **연구자의 기여 및 설계 결정**: 제1인칭 복수 능동태 또는 명확한 시스템 주어 사용 (예: "본 연구에서는 분산 합의 알고리즘을 설계하였다", "API 게이트웨이는 요청을 검증한다").
- **실험 절차 및 데이터 처리**: 객관성을 확보하기 위해 동작/데이터 중심 서술 또는 피동 표현 활용 (예: "입력 이미지는 640×640 해상도로 리샘플링된 후 정규화된다").

### 2.5. 간결성과 명사구 남용 억제 (Conciseness without Heavy Nominalization)
- 의미 없는 중첩 명사구(명사화의 연속)를 간결한 서술형 동사로 변환하여 문맥 전달력을 높입니다.
- 예: "~에 대한 분석의 수행을 진행하였다" → "~를 분석하였다"

---

## 3. 기획/기술 보고서 섹션별 학술적 변환 예시 (Before & After)

### 3.1. 문제 정의 및 배경 (Problem Statement & Background)
- **Before (AI 생성 스타일)**:
  "현대 사회의 바쁜 일상 속에서 많은 현대인들은 불규칙한 생활 습관으로 인해 심각한 건강 위협에 직면해 있습니다. 기존 헬스케어 앱들은 지나치게 복잡하고 사용자를 지치게 만들어 대다수의 사용자가 초기에 이탈하는 안타까운 문제가 발생하고 있습니다. 이는 전인적인 웰니스 케어의 부재 때문입니다."
- **After (학술 논문 스타일)**:
  "디지털 헬스케어 애플리케이션의 높은 초기 이탈률(설치 후 30일 이내 90% 이상)은 수동 데이터 입력에 따른 기록 피로도(logging fatigue)와 정량적 지표 기반 피드백이 유발하는 심리적 부담에 기인한다. 선행 연구에 따르면, 단순 칼로리 트래킹 방식은 사용자의 73%에서 부정적 정서 반응을 유발하는 것으로 보고되었다."

### 3.2. 기술 스택 및 아키텍처 (Tech Stack & System Architecture)
- **Before (AI 생성 스타일)**:
  "본 프로젝트는 최첨단 기술들의 완벽한 조화를 자랑합니다! Node.js 백엔드와 강력한 Go 언어 기반의 AI 서버를 마이크로서비스로 구성하여 극한의 안정성과 번개처럼 빠른 속도를 동시에 달성했습니다."
- **After (공학 보고서 스타일)**:
  "시스템 아키텍처는 비즈니스 로직 및 트랜잭션 처리를 담당하는 Node.js 기반 코어 서버와 고성능 추론 파이프라인을 전담하는 Go 기반 AI 마이크로서비스로 분리 설계되었다. 각 서비스는 REST API 및 내부 토큰 인증을 통해 통신하며, 상태 비저장(Stateless) 구조를 유지하여 수평적 확장성을 확보하였다."

### 3.3. 인공지능 파이프라인 (AI Inference Pipeline)
- **Before (AI 생성 스타일)**:
  "TAMMY의 혁신적인 2단계 하이브리드 비전 AI는 온디바이스 딥러닝과 클라우드 초거대 생성형 모델의 장점만을 결합하여 어떤 복잡한 음식이라도 100% 완벽하고 스마트하게 인식해 냅니다."
- **After (학술 논문 스타일)**:
  "비전 추론 파이프라인은 연산 비용 절감과 인식 범용성 간의 트레이드오프를 해결하기 위해 2계층(2-Tier) 하이브리드 구조로 구성된다. 1차적으로 임베디드 ONNX YOLOv8 모델이 단일 음식에 대해 500ms 미만의 지연 시간으로 국소 추론을 수행하며, 분류 신뢰도(Confidence Score)가 임계값(0.60) 미만이거나 복합 식단인 경우에 한하여 2차 클라우드 멀티모달 LLM(Gemini Vision) 및 검색 기반 그라운딩(Search Grounding) 파이프라인으로 폴백(Fallback)된다."

### 3.4. 시스템 설계 및 데이터 무결성 (System Design & Reliability)
- **Before (AI 생성 스타일)**:
  "우리는 강력한 멱등성 매커니즘을 통해 네트워크가 불안정한 환경에서도 데이터가 절대 유실되거나 중복되지 않도록 원천 차단하는 무결점 설계를 완성했습니다."
- **After (공학 보고서 스타일)**:
  "모바일 네트워크의 패킷 재전송에 따른 게이지 왜곡 및 중복 상태 전이를 방지하기 위해, 상태 변경 API에 UUID 기반의 고유 요청 식별자(clientRequestId) 검증 계층을 구현하였다. 트랜잭션 감사 로그(Audit Log)를 통해 중복 수신된 요청에 대해 상태 변이 없이 이전 처리 결과를 반환함으로써 분산 환경에서의 멱등성을 보장한다."

### 3.5. 성능 및 평가 (Performance & Evaluation)
- **Before (AI 생성 스타일)**:
  "실험 결과, 제안하는 하이브리드 아키텍처는 기존 방식 대비 비약적인 성능 향상과 획기적인 비용 절감 효과를 입증하며 게임 체인저로서의 면모를 입증하였습니다."
- **After (학술 논문 스타일)**:
  "1,000건의 복합 식단 이미지를 대상으로 벤치마크를 수행한 결과, 제안하는 2계층 추론 파이프라인은 전수 클라우드 LLM 호출 방식 대비 API 토큰 비용을 84.6% 절감하였으며, 평균 응답 시간(Mean Latency)을 2,140ms에서 412ms로 80.7% 단축시켰다. F1-score는 0.912를 달성하여 정확도 손실을 최소화하였다."

---

## 4. 공학 논문 서술을 위한 어휘 대체 사전 (Vocabulary Mapping Table)

| 범주 | 홍보성/모호한 표현 (지양) | 학술적/실증적 표현 (권장) | 영문 표준 용어 |
| :--- | :--- | :--- | :--- |
| **시스템 성능** | 비약적으로 향상된 | 통계적으로 유의미하게 개선된 (p < 0.01) | statistically significant improvement |
| | 번개처럼 빠른 속도 | 저지연 처리 특성 (p99 < 50ms) | low-latency processing |
| | 완벽하게 처리하는 | 오차율 ±0.5% 이내로 수렴하는 | converges within a margin of error |
| | 극대화하다 | 최대화하다 / 수율을 N% 향상시키다 | maximize / improve yield by N% |
| **시스템 설계** | 전인적인 케어 | 다중 도메인 통합 관리 (신체·영양·정서) | multi-domain integrated management |
| | 혁신적인 아키텍처 | 2계층 분산 파이프라인 구조 | 2-tier decoupled pipeline architecture |
| | 완벽한 호환성 | 표준 프로토콜(REST/OpenAPI) 준수 | protocol compliance / interoperability |
| | 강력한 보안 | 역할 기반 접근 제어(RBAC) 및 암호화 적용 | end-to-end encryption and RBAC |
| **문제 해결** | 원천 차단하다 | 발생 확률을 0.01% 이하로 억제하다 / 방지하다 | mitigate / prevent / suppress |
| | 스마트하게 해결하다 | 휴리스틱 알고리즘을 기반으로 최적화하다 | optimize via heuristic algorithm |
| | 획기적으로 줄이다 | 이전 베이스라인 대비 45% 감축하다 | reduce by 45% compared to baseline |
| | 완벽한 데이터 보장 | 분산 트랜잭션 멱등성 및 원자성 보장 | ensure idempotency and ACID properties |
| **연구/기술 소개** | 본 연구는 엄청난 가치를 지님 | 본 연구의 기여는 다음과 같이 요약된다 | The main contributions are summarized as |
| | ~에 대해 깊이 파고들다 | ~의 상관관계를 체계적으로 분석하다 | systematically analyze the correlation |
| | 놀라운 결과를 도출함 | 실증적 실험을 통해 유효성을 입증함 | empirically validate the effectiveness |

---

## 5. 참고 학술 가이드라인 및 공학 표준 출처

1. **IEEE Computer Society Style Guide**
   - Transactions and Journals Writing Standards: 능동태의 명확한 사용(We proposed vs It is proposed), 과장된 형용사 배제 원칙, 약어 및 기술 용어의 최초 등장 시 정의 규칙.
2. **ACM Author Rights & Publishing Guidelines**
   - ACM Computing Surveys & SIG Guidelines: 재현 가능성(Reproducibility) 확보를 위한 하드웨어 사양, 하이퍼파라미터, 데이터셋 분할 기준의 명시적 서술 지침.
3. **한국정보과학회(KIISE) 논문지 집필요령**
   - 국문 학술 논문 작성 표준: 번역투 문장 억제, 불필요한 외래어 남용 지양, 명사화 피동 구문(~에 대한 조사를 행하였다 → ~를 조사하였다)의 능동적 정제 원칙.
4. **The Elements of Style (Strunk & White) & The Sense of Style (Steven Pinker)**
   - 기술 작문(Technical Writing)의 고전 원칙: 불필요한 단어의 생략(Omit needless words), 전문 용어의 일관성 유지(Lexical consistency), 추상적 관념의 구체적 메커니즘화.

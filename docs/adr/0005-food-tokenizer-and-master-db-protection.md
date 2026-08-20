# ADR 0005: FoodTokenizer and Master DB Protection Strategy

## Status
Accepted

## Context
사용자가 입력하거나 비전 모델이 추출한 음식명은 '매운 수제 치즈 닭갈비 2인분', '아이스 아메리카노 1잔'과 같이 조리법, 맵기, 부재료 수식어와 수량 단위가 혼합되어 있습니다. 식약처 국가 표준 영양 데이터베이스(15,000건)에 이러한 비정형 키워드를 무분별하게 신규 레코드로 자동 삽입(Auto-create)할 경우, 마스터 데이터의 오염, 중복 영양소 데이터 폭증, 무결성 훼손이 발생합니다.

## Decision
1. **규칙 기반 음식명 토크나이저 (`FoodTokenizer`) 도입**:
   - 20여 종의 수식어/접두어 사전(`FOOD_MODIFIER_DICTIONARY`)과 수량 정규식 패턴(`QUANTITY_PATTERN`)을 통해 원본 텍스트를 `modifiers`, `quantity`, `coreFoodName`, `normalizedName`으로 사전 분리합니다.
2. **식약처 마스터 DB 보호 3단계 스마트 매칭 파이프라인 (`getOrMapFood`)**:
   - **1단계 (캐시 조회)**: `food_mappings` 중간 테이블에서 원본명(`raw_name`)을 1차 조회하여 기존 매핑 결과(`EXACT` / `ALIAS`)를 즉시 반환.
   - **2단계 (토크나이저 마스터 검색)**: 정규화된 `coreFoodName`으로 `foods` 마스터 테이블을 검색. 매칭 성공 시 `foods` 테이블은 수정하지 않고 `food_mappings`에 `ALIAS`로 연결 레코드를 자동 캐싱 등록 (**Master Protection Principle**).
   - **3단계 (AI 웹 검색 Fallback)**: 마스터 DB에 상위 개념조차 없는 희귀/신메뉴는 AI 서버(`/v1/nutrition/lookup`) 웹 검색 그라운딩 영양 조회를 호출하여 안전하게 반환 (`isAiFallback: true`).
3. **섭취량(Gram) 비례 영양소 자동 계산**:
   - `intakeGram / standardServingG` 비율에 따라 칼로리 및 3대 영양소, 비타민/무기질을 정밀 환산 집계.

## Consequences
- **긍정적 효과**: 15,000건의 식약처 공공데이터 마스터 무결성을 100% 보존하면서, 사용자의 다채로운 수식어 입력을 지능적으로 캐싱하여 DB 검색 지연 시간과 외부 API 호출 비용을 최소화함.
- **주의사항**: 새로운 수식어 유형 등장 시 `FOOD_MODIFIER_DICTIONARY` 사전을 지속적으로 유지보수해야 함.

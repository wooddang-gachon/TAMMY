import type { CalorieTrendItem, NutritionBalanceInfo } from '../../types';

/**
 * 리포트 화면 뷰모델 타입.
 *
 * ⚠️ 이 파일의 타입은 Swagger의 API 응답 스키마가 아니라, 화면이 필요로 하는 "형태"를
 * 정의한 프론트 전용 뷰모델이다. 실제 데이터 출처는 아래와 같이 나뉜다.
 *
 *  - ReportSummary / ChartData → GET /dashboard/summary (DashboardSummaryInfo) 를 최소 가공한 값. 실측.
 *  - Insight / Recommendation  → Swagger에 대응 필드가 없다. 백엔드 협의 전까지 항상 빈 배열([])이며,
 *                                 화면은 이 값을 그대로 표시만 할 뿐 생성하지 않는다.
 */

/** GET /dashboard/summary 기반 — 실제 응답 필드만 가공 (건강점수·목표달성률 등은 Swagger에 없어 포함하지 않음) */
export interface ReportSummary {
  /** calorieTrends.length — 실측 */
  totalRecords: number;
  /** calorieTrends[].caloriesKcal 평균 — 실측 */
  averageCalories: number;
  /** weeklyWorkoutCompletedDays — 실측 */
  weeklyWorkoutCompletedDays: number;
  /** calorieTrends[].date 최솟값~최댓값 — 실측 데이터로부터 계산한 표시용 기간 (데이터 없으면 null) */
  period: string | null;
}

/** GET /dashboard/summary 응답 필드 그대로 (가공 없음) */
export interface ChartData {
  calorieTrends: CalorieTrendItem[];
  nutritionBalance: NutritionBalanceInfo;
  weeklyWorkoutCompletedDays: number;
}

/** ⚠️ 백엔드 협의 필요 — Swagger에 AI 인사이트 응답 필드가 없다. 항상 빈 배열. */
export interface Insight {
  emoji: string;
  text: string;
}

/** ⚠️ 백엔드 협의 필요 — Swagger에 추천 행동 응답 필드가 없다. 항상 빈 배열. */
export interface Recommendation {
  id: string;
  text: string;
}

export interface ReportViewModel {
  summary: ReportSummary;
  chart: ChartData;
  insight: Insight[];
  recommendation: Recommendation[];
}

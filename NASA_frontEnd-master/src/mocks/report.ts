import type { DashboardSummaryInfo } from '../types';

/**
 * 개발용 fallback (USE_MOCK=true 일 때만 사용).
 * GET /dashboard/summary 의 실제 응답 스키마(DashboardSummaryInfo)와 1:1로 맞춘 샘플 데이터.
 * 백엔드 연동 시 USE_MOCK=false 로 바꾸면 이 파일은 더 이상 참조되지 않는다.
 */
export const mockDashboardSummary: DashboardSummaryInfo = {
  calorieTrends: [
    { date: '2026-08-04', caloriesKcal: 1820 },
    { date: '2026-08-05', caloriesKcal: 1700 },
    { date: '2026-08-06', caloriesKcal: 1950 },
    { date: '2026-08-07', caloriesKcal: 1760 },
    { date: '2026-08-08', caloriesKcal: 1880 },
    { date: '2026-08-09', caloriesKcal: 1690 },
    { date: '2026-08-10', caloriesKcal: 1810 },
  ],
  nutritionBalance: {
    carbohydratePercent: 48,
    proteinPercent: 27,
    fatPercent: 15,
    vitaminPercent: 6,
    mineralPercent: 4,
  },
  weeklyWorkoutCompletedDays: 4,
};

import { useCallback, useEffect, useState } from 'react';
import type { DashboardSummaryInfo } from '../../types';
import { api } from '../../api/client';
import type { ReportViewModel } from './types';

const average = (values: number[]): number =>
  values.length ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : 0;

const formatPeriod = (dates: string[]): string | null => {
  if (!dates.length) return null;
  const sorted = [...dates].sort();
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return first === last ? first : first + ' ~ ' + last;
};

/**
 * DashboardSummaryInfo(GET /dashboard/summary 실제 응답) → 화면 뷰모델 가공.
 * insight/recommendation은 Swagger에 대응 필드가 없으므로 항상 빈 배열로 둔다 — 프론트에서 지어내지 않는다.
 */
function toViewModel(raw: DashboardSummaryInfo): ReportViewModel {
  return {
    summary: {
      totalRecords: raw.calorieTrends.length,
      averageCalories: average(raw.calorieTrends.map((t) => t.caloriesKcal)),
      weeklyWorkoutCompletedDays: raw.weeklyWorkoutCompletedDays,
      period: formatPeriod(raw.calorieTrends.map((t) => t.date)),
    },
    chart: {
      calorieTrends: raw.calorieTrends,
      nutritionBalance: raw.nutritionBalance,
      weeklyWorkoutCompletedDays: raw.weeklyWorkoutCompletedDays,
    },
    insight: [],
    recommendation: [],
  };
}

/** 리포트 화면 데이터 조회 — API 호출 / 로딩·에러 상태 / 최소 가공만 담당. 화면은 반환된 데이터를 표시만 한다. */
export function useReportService() {
  const [data, setData] = useState<ReportViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await api.getDashboardSummary();
      setData(toViewModel(raw));
    } catch (e) {
      setError(e instanceof Error ? e.message : '리포트를 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}

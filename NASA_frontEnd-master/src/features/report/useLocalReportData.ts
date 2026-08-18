import { useCallback, useEffect, useState } from 'react';
import { reportsApi, type LocalReportData } from '../../api/reports';

/** 감정/수분/생활습관/회고 로컬 집계 — GET /dashboard/summary(useReportService)와 별개 소스 */
export function useLocalReportData() {
  const [data, setData] = useState<LocalReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setData(await reportsApi.getLocalReportData());
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, reload };
}

import { useCallback, useEffect, useState } from 'react';
import type { WaterRecord } from '../api/types';
import { waterApi } from '../api/water';
import { getCurrentUserId } from '../api/_storage';
import { recordId, today } from './useWellnessRecords';

/** 물 기록 — 화면은 이 훅만 통해 waterApi에 접근한다 */
export function useWater() {
  const [records, setRecords] = useState<WaterRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setRecords(await waterApi.list());
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const logWater = useCallback(async (amount: number, date: string = today()) => {
    const record: WaterRecord = { id: recordId(), userId: getCurrentUserId(), date, amount, createdAt: Date.now() };
    await waterApi.create(record);
    await reload();
    return record;
  }, [reload]);

  const todayTotal = records.filter((r) => r.date === today()).reduce((sum, r) => sum + r.amount, 0);

  return { records, loading, logWater, todayTotal, reload };
}

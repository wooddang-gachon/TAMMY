import { useCallback, useEffect, useState } from 'react';
import type { ReflectionRecord } from '../api/types';
import { reflectionsApi } from '../api/reflections';
import { getCurrentUserId } from '../api/_storage';
import { recordId, today } from './useWellnessRecords';

/** 회고(하루/주간) — 화면은 이 훅만 통해 reflectionsApi에 접근한다 */
export function useReflections() {
  const [reflections, setReflections] = useState<ReflectionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setReflections(await reflectionsApi.list());
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const saveReflection = useCallback(async (period: 'daily' | 'weekly', content: string, date: string = today()) => {
    const now = Date.now();
    const record: ReflectionRecord = { id: recordId(), userId: getCurrentUserId(), date, period, content, createdAt: now, updatedAt: now };
    await reflectionsApi.create(record);
    await reload();
    return record;
  }, [reload]);

  return { reflections, loading, saveReflection, reload };
}

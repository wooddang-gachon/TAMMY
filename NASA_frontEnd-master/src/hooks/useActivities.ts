import { useCallback, useEffect, useState } from 'react';
import type { ActivityLogRecord } from '../api/types';
import { activitiesApi } from '../api/activities';
import { getCurrentUserId } from '../api/_storage';
import { recordId, today } from './useWellnessRecords';

/** 생활습관 활동 기록 — 화면은 이 훅만 통해 activitiesApi에 접근한다 */
export function useActivities() {
  const [logs, setLogs] = useState<ActivityLogRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setLogs(await activitiesApi.list());
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const logActivity = useCallback(async (activityType: string, minutes: number, note = '', date: string = today()) => {
    const record: ActivityLogRecord = { id: recordId(), userId: getCurrentUserId(), date, activityType, minutes, note, createdAt: Date.now() };
    await activitiesApi.create(record);
    await reload();
    return record;
  }, [reload]);

  return { logs, loading, logActivity, reload };
}

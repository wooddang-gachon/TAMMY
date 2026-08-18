import { useCallback, useEffect, useState } from 'react';
import type { EmotionEntry, EmotionRecord, DiaryRecord, Mood } from '../api/types';
import { emotionsApi } from '../api/emotions';
import { getCurrentUserId } from '../api/_storage';
import { recordId, today } from './useWellnessRecords';

/** 감정 기록(mood) + 감정일기(diary) — 화면은 이 훅만 통해 emotionsApi에 접근한다 */
export function useEmotions() {
  const [entries, setEntries] = useState<EmotionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setEntries(await emotionsApi.list());
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const logMood = useCallback(async (mood: Mood, date: string = today()) => {
    const record: EmotionRecord = { id: recordId(), userId: getCurrentUserId(), date, mood, type: 'mood', createdAt: Date.now() };
    await emotionsApi.createMood(record);
    await reload();
    return record;
  }, [reload]);

  const saveDiary = useCallback(async (mood: Mood, content: string, date: string = today(), tags: string[] = []) => {
    const now = Date.now();
    const record: DiaryRecord = { id: recordId(), userId: getCurrentUserId(), date, mood, content, tags, type: 'diary', createdAt: now, updatedAt: now };
    await emotionsApi.createDiary(record);
    await reload();
    return record;
  }, [reload]);

  const moods = entries.filter((e): e is EmotionRecord => e.type === 'mood');
  const diaries = entries.filter((e): e is DiaryRecord => e.type === 'diary');

  return { entries, moods, diaries, loading, logMood, saveDiary, reload };
}

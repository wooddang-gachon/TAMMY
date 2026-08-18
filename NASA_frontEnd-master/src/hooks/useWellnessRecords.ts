import { useEffect, useMemo, useState } from 'react';
import { getCurrentUserId } from '../api/_storage';

export type PhotoRecord = { id: string; userId?: string; createdAt?: string; imageUrl: string; date: string; title: string; description: string; category: string };
export type MoodRecord = { id: string; userId?: string; date: string; mood: string; content: string; createdAt: number };
export type SleepRecord = { id: string; userId?: string; date: string; bedtime: string; wakeTime: string; duration: string; quality: string; note: string };
export type ActivityRecord = { id: string; userId?: string; date: string; type: string; minutes: string; amount: string; note: string };
export type HealthRecord = { id: string; userId?: string; date: string; condition: string; note: string; medication: boolean };
export type WellnessRecords = { photos: PhotoRecord[]; moods: MoodRecord[]; sleep: SleepRecord[]; activities: ActivityRecord[]; health: HealthRecord[] };

const KEY = 'tammy.wellness-records.v1';
const empty: WellnessRecords = { photos: [], moods: [], sleep: [], activities: [], health: [] };
const loadAll = (): WellnessRecords => { try { return { ...empty, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; } catch { return empty; } };

/** userId가 없는(과거) 레코드는 데모 사용자 소유로 취급한다 — 데이터 유실 없이 사용자별로 분리한다 */
const ownedBy = <T extends { userId?: string }>(list: T[], userId: string): T[] => list.filter((r) => (r.userId ?? 'demo-user') === userId);

/**
 * photos/moods/sleep/activities/health 통합 저장소.
 * localStorage에는 항상 전체 사용자의 레코드를 보관하고(덮어써 유실되지 않도록),
 * 화면에는 getCurrentUserId()로 필터링된 값만 노출한다 — 호출부(PhotoGallery, QuickActions 등)는
 * 그대로 두고 이 훅 내부에서만 사용자별 분리를 적용한다.
 */
export function useWellnessRecords() {
  const [all, setAll] = useState<WellnessRecords>(loadAll);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(all)); }, [all]);

  const userId = getCurrentUserId();
  const records = useMemo<WellnessRecords>(() => ({
    photos: ownedBy(all.photos, userId),
    moods: ownedBy(all.moods, userId),
    sleep: ownedBy(all.sleep, userId),
    activities: ownedBy(all.activities, userId),
    health: ownedBy(all.health, userId),
  }), [all, userId]);

  const add = <K extends keyof WellnessRecords>(kind: K, record: WellnessRecords[K][number]) => {
    const stamped = { ...record, userId: record.userId ?? userId };
    setAll((prev) => ({ ...prev, [kind]: [stamped, ...prev[kind]] }));
  };

  return { records, add };
}

export const today = () => new Date().toISOString().slice(0, 10);
export const recordId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

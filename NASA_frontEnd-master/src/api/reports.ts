import { emotionsApi } from './emotions';
import { waterApi } from './water';
import { activitiesApi } from './activities';
import { reflectionsApi } from './reflections';
import type { DiaryRecord, Mood, ReflectionRecord } from './types';

const MOODS: Mood[] = ['😊 매우 좋아요', '🙂 좋아요', '😐 보통이에요', '😔 우울해요', '😢 많이 힘들어요'];

const currentMonth = () => new Date().toISOString().slice(0, 7); // YYYY-MM
const inCurrentMonth = (date: string) => date.startsWith(currentMonth());

export interface EmotionDistribution { mood: Mood; count: number; pct: number }
export interface LocalReportData {
  emotion: { distribution: EmotionDistribution[]; totalEntries: number; recentDiaries: DiaryRecord[] };
  water: { totalMl: number; averageMlPerDay: number; byDate: { date: string; amount: number }[] };
  activity: { totalMinutes: number; byType: { type: string; minutes: number }[] };
  reflection: { recent: ReflectionRecord[] };
}

/**
 * Report 화면에 붙이는 로컬(mock) 집계 — GET /dashboard/summary(client.ts)와는 별개다.
 * 감정/수분/생활습관/회고는 아직 백엔드가 없으므로 emotions/water/activities/reflections api를
 * 직접 조합해 "현재 월" 기준으로 집계한다. 실제 데이터만 계산하며 값을 지어내지 않는다.
 */
export const reportsApi = {
  async getLocalReportData(): Promise<LocalReportData> {
    const [moods, diaries, waterRecords, activityLogs, reflections] = await Promise.all([
      emotionsApi.listMoods(),
      emotionsApi.listDiaries(),
      waterApi.list(),
      activitiesApi.list(),
      reflectionsApi.list(),
    ]);

    const monthMoods = [...moods, ...diaries].filter((e) => inCurrentMonth(e.date));
    const distribution: EmotionDistribution[] = MOODS.map((mood) => {
      const count = monthMoods.filter((e) => e.mood === mood).length;
      return { mood, count, pct: monthMoods.length ? Math.round((count / monthMoods.length) * 100) : 0 };
    });
    const recentDiaries = [...diaries].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

    const monthWater = waterRecords.filter((w) => inCurrentMonth(w.date));
    const totalMl = monthWater.reduce((s, w) => s + w.amount, 0);
    const activeDays = new Set(monthWater.map((w) => w.date)).size || 1;
    const byDateMap = new Map<string, number>();
    monthWater.forEach((w) => byDateMap.set(w.date, (byDateMap.get(w.date) ?? 0) + w.amount));
    const byDate = [...byDateMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => ({ date, amount }));

    const monthActivities = activityLogs.filter((a) => inCurrentMonth(a.date));
    const totalMinutes = monthActivities.reduce((s, a) => s + a.minutes, 0);
    const byTypeMap = new Map<string, number>();
    monthActivities.forEach((a) => byTypeMap.set(a.activityType, (byTypeMap.get(a.activityType) ?? 0) + a.minutes));
    const byType = [...byTypeMap.entries()].map(([type, minutes]) => ({ type, minutes }));

    const recentReflections = [...reflections].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

    return {
      emotion: { distribution, totalEntries: monthMoods.length, recentDiaries },
      water: { totalMl, averageMlPerDay: Math.round(totalMl / activeDays), byDate },
      activity: { totalMinutes, byType },
      reflection: { recent: recentReflections },
    };
  },
};

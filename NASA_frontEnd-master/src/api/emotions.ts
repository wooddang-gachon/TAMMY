import type { EmotionEntry, EmotionRecord, DiaryRecord } from './types';
import { createRecordStore, getCurrentUserId } from './_storage';

/**
 * 감정 기록(mood) + 감정일기(diary) API.
 * 지금은 localStorage mock이며, 백엔드가 준비되면 이 파일 내부만 실제
 * POST/GET /emotions 호출로 바꾸면 된다(화면은 emotionsApi 시그니처만 본다).
 */
const store = createRecordStore<EmotionEntry>('tammy.emotions.v1');

export const emotionsApi = {
  /** 전체(감정 기록 + 감정일기) */
  async list(userId: string = getCurrentUserId()): Promise<EmotionEntry[]> {
    return store.list(userId);
  },
  /** 감정 기록만(type: 'mood') */
  async listMoods(userId: string = getCurrentUserId()): Promise<EmotionRecord[]> {
    return (await store.list(userId)).filter((e): e is EmotionRecord => e.type === 'mood');
  },
  /** 감정일기만(type: 'diary') */
  async listDiaries(userId: string = getCurrentUserId()): Promise<DiaryRecord[]> {
    return (await store.list(userId)).filter((e): e is DiaryRecord => e.type === 'diary');
  },
  async createMood(record: EmotionRecord): Promise<EmotionRecord> {
    return store.create(record) as Promise<EmotionRecord>;
  },
  async createDiary(record: DiaryRecord): Promise<DiaryRecord> {
    return store.create(record) as Promise<DiaryRecord>;
  },
  async updateDiary(id: string, patch: Partial<DiaryRecord>, userId: string = getCurrentUserId()): Promise<DiaryRecord | null> {
    return store.update(id, patch, userId) as Promise<DiaryRecord | null>;
  },
  async remove(id: string, userId: string = getCurrentUserId()): Promise<void> {
    return store.remove(id, userId);
  },
};

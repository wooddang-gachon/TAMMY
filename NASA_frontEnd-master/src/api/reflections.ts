import type { ReflectionRecord } from './types';
import { createRecordStore, getCurrentUserId } from './_storage';

/** 회고(하루/주간) API. 지금은 localStorage mock — 백엔드 연동 시 이 파일 내부만 교체하면 된다. */
const store = createRecordStore<ReflectionRecord>('tammy.reflections.v1');

export const reflectionsApi = {
  async list(userId: string = getCurrentUserId()): Promise<ReflectionRecord[]> {
    return store.list(userId);
  },
  async create(record: ReflectionRecord): Promise<ReflectionRecord> {
    return store.create(record);
  },
  async update(id: string, patch: Partial<ReflectionRecord>, userId: string = getCurrentUserId()): Promise<ReflectionRecord | null> {
    return store.update(id, patch, userId);
  },
  async remove(id: string, userId: string = getCurrentUserId()): Promise<void> {
    return store.remove(id, userId);
  },
};

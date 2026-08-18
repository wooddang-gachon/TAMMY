import type { WaterRecord } from './types';
import { createRecordStore, getCurrentUserId } from './_storage';

/** 물 기록 API. 지금은 localStorage mock — 백엔드 연동 시 이 파일 내부만 교체하면 된다. */
const store = createRecordStore<WaterRecord>('tammy.water.v1');

export const waterApi = {
  async list(userId: string = getCurrentUserId()): Promise<WaterRecord[]> {
    return store.list(userId);
  },
  async create(record: WaterRecord): Promise<WaterRecord> {
    return store.create(record);
  },
  async remove(id: string, userId: string = getCurrentUserId()): Promise<void> {
    return store.remove(id, userId);
  },
};

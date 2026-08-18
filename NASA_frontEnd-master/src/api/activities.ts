import type { ActivityLogRecord } from './types';
import { createRecordStore, getCurrentUserId } from './_storage';

/** 생활습관 활동 기록 API(운동 화면과 별개). 지금은 localStorage mock. */
const store = createRecordStore<ActivityLogRecord>('tammy.activities.v1');

export const activitiesApi = {
  async list(userId: string = getCurrentUserId()): Promise<ActivityLogRecord[]> {
    return store.list(userId);
  },
  async create(record: ActivityLogRecord): Promise<ActivityLogRecord> {
    return store.create(record);
  },
  async remove(id: string, userId: string = getCurrentUserId()): Promise<void> {
    return store.remove(id, userId);
  },
};

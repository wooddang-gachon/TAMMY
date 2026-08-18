import type { MemoryRecord, MemoryType } from './types';
import { createRecordStore, getCurrentUserId } from './_storage';

/**
 * AI 장기기억(Memory) mock API.
 * 실제 AI 분석 파이프라인이 없으므로 이 모듈은 구조(CRUD)만 제공하고, content를 생성/추론하지 않는다 —
 * 호출부(향후 백엔드 AI 분석 결과)가 만든 값을 저장/조회만 한다.
 * 백엔드 연동 시: POST /memories, GET /memories 형태로 내부만 교체하면 된다.
 */
const store = createRecordStore<MemoryRecord>('tammy.ai-memories.v1');

export const memoriesApi = {
  async list(userId: string = getCurrentUserId()): Promise<MemoryRecord[]> {
    return store.list(userId);
  },
  async listByType(type: MemoryType, userId: string = getCurrentUserId()): Promise<MemoryRecord[]> {
    return (await store.list(userId)).filter((m) => m.type === type);
  },
  async create(record: MemoryRecord): Promise<MemoryRecord> {
    return store.create(record);
  },
  async update(id: string, patch: Partial<MemoryRecord>, userId: string = getCurrentUserId()): Promise<MemoryRecord | null> {
    return store.update(id, patch, userId);
  },
  async remove(id: string, userId: string = getCurrentUserId()): Promise<void> {
    return store.remove(id, userId);
  },
};

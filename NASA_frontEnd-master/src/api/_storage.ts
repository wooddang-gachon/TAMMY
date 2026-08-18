/**
 * localStorage 기반 사용자별 레코드 저장소 헬퍼.
 *
 * 목적: emotions/water/reflections/memories 같은 새 api/*.ts 모듈이 각자
 * localStorage 읽기/쓰기 보일러플레이트를 중복 구현하지 않도록 한다(photos.ts의
 * read/write 패턴을 일반화한 것). 모든 레코드는 userId를 가지며, list()는 항상
 * 해당 userId의 레코드만 반환한다 — 사용자 간 데이터가 섞이지 않는다.
 *
 * 백엔드 연동 시: 이 파일과 각 api/*.ts의 내부 구현만 실제 fetch 호출로 바꾸면 되고,
 * 화면(컴포넌트)은 각 api 모듈의 함수 시그니처가 그대로 유지되는 한 수정할 필요가 없다.
 */

const AUTH_USER_KEY = 'tammy.auth.userId';
const DEFAULT_USER_ID = 'demo-user';

/** 현재 로그인된 사용자 id. 아직 로그인하지 않았다면 데모 사용자로 동작한다. */
export function getCurrentUserId(): string {
  try {
    return localStorage.getItem(AUTH_USER_KEY) ?? DEFAULT_USER_ID;
  } catch {
    return DEFAULT_USER_ID;
  }
}

export function setCurrentUserId(userId: string | null): void {
  try {
    if (userId) localStorage.setItem(AUTH_USER_KEY, userId);
    else localStorage.removeItem(AUTH_USER_KEY);
  } catch { /* ignore */ }
}

export interface StoredRecord {
  id: string;
  userId: string;
}

export function createRecordStore<T extends StoredRecord>(storageKey: string) {
  const readAll = (): T[] => {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  };
  const writeAll = (records: T[]) => {
    localStorage.setItem(storageKey, JSON.stringify(records));
  };

  return {
    /** 항상 userId로 필터링된 목록만 반환한다(다른 사용자 데이터 비노출) */
    async list(userId: string = getCurrentUserId()): Promise<T[]> {
      return readAll().filter((r) => r.userId === userId);
    },
    async create(record: T): Promise<T> {
      writeAll([record, ...readAll()]);
      return record;
    },
    async update(id: string, patch: Partial<T>, userId: string = getCurrentUserId()): Promise<T | null> {
      const all = readAll().map((r) => (r.id === id && r.userId === userId ? { ...r, ...patch } : r));
      writeAll(all);
      return all.find((r) => r.id === id && r.userId === userId) ?? null;
    },
    async remove(id: string, userId: string = getCurrentUserId()): Promise<void> {
      writeAll(readAll().filter((r) => !(r.id === id && r.userId === userId)));
    },
  };
}

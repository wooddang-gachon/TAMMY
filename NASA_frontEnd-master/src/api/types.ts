/**
 * 신규 api/*.ts 모듈이 쓰는 도메인 타입.
 * src/types.ts는 "실제 백엔드 Swagger 응답 스키마 1:1"용이라 손대지 않고,
 * 아직 백엔드가 없는(=이번 작업에서 새로 추가하는) 기록형 데이터는 여기 모은다.
 * 백엔드 연동 시 이 타입들을 실제 응답 스키마에 맞춰 조정하면 된다.
 */

export const MOOD_OPTIONS = ['😊 매우 좋아요', '🙂 좋아요', '😐 보통이에요', '😔 우울해요', '😢 많이 힘들어요'] as const;
export type Mood = (typeof MOOD_OPTIONS)[number];

/** 감정 기록 — mood만 빠르게 남긴다(글 없음) */
export interface EmotionRecord {
  id: string;
  userId: string;
  date: string;
  mood: Mood;
  type: 'mood';
  createdAt: number;
}

/** 감정일기 — mood + 글. 감정 기록과 별도 데이터로 관리한다(type으로 구분) */
export interface DiaryRecord {
  id: string;
  userId: string;
  date: string;
  mood: Mood;
  content: string;
  /** 선택 태그(예: #건강, #휴식) — 없으면 빈 배열 */
  tags?: string[];
  type: 'diary';
  createdAt: number;
  updatedAt: number;
}

export type EmotionEntry = EmotionRecord | DiaryRecord;

/** 물 기록 — 200ml/300ml/500ml처럼 한 번의 탭으로 남기는 수분 섭취 기록 */
export interface WaterRecord {
  id: string;
  userId: string;
  date: string;
  /** ml */
  amount: number;
  createdAt: number;
}

/**
 * 로그인 사용자 — 실제 백엔드(POST /auth/login·/auth/signup, GET /users/me) 응답 기준.
 * isReal=false면 백엔드 없이 계속 쓸 수 있게 해주는 로컬 데모 사용자(api/auth.ts의 mock 경로).
 */
export interface AuthUser {
  id: number | string;
  email: string;
  nickname: string;
  authProvider?: string;
  /** ISO date string — GET /users/me 응답에만 존재, 로그인 직후에는 비어있을 수 있음 */
  createdAt?: string;
  currentFuel?: number | null;
  isReal: boolean;
}

/** 생활습관 활동 기록(운동과 별개 — 걷기/스트레칭/독서/명상 같은 가벼운 습관) */
export interface ActivityLogRecord {
  id: string;
  userId: string;
  date: string;
  activityType: string;
  minutes: number;
  note: string;
  createdAt: number;
}

/**
 * AI 장기기억(Memory) 레코드 구조.
 * ⚠️ 실제 AI 분석 파이프라인은 아직 없다 — 이 타입과 mock API는 "구조"만 준비해두는 것이며,
 * content를 임의로 지어내 실제 분석 결과인 것처럼 보여주지 않는다(값이 없으면 빈 배열).
 * useChat.ts의 대화 중 추출 메모리(문자열 배열, tammy.memories.v1)와는 별개의 구조화된 저장소다.
 */
export type MemoryType = 'lifestyle' | 'meal' | 'water' | 'emotion' | 'activity' | 'reflection';

export interface MemoryRecord {
  id: string;
  userId: string;
  type: MemoryType;
  content: string;
  /** 이 기억이 어디서 파생됐는지(예: 'diary:xxxx', 'water-weekly-summary') */
  source: string;
  createdAt: number;
  updatedAt: number;
}

/** 하루/주간 회고 */
export interface ReflectionRecord {
  id: string;
  userId: string;
  date: string;
  period: 'daily' | 'weekly';
  content: string;
  createdAt: number;
  updatedAt: number;
}

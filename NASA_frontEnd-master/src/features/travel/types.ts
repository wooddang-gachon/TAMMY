export interface Planet {
  id: string;
  name: string;
  accent: string;
  image: string;
  desc: string;
  reward: string;
  /** 지구 기준 총 거리(AU) */
  auTotal: number;
  /** 행성 상세 화면에 로드할 섹션 */
  detail: string[];
}

export type PlanetStatus = 'locked' | 'traveling' | 'completed';

export interface PlanetProgress {
  /** 잔여 거리 0~100 (0이면 탐험 완료) */
  distance: number;
}

/** 백엔드 응답과 1:1 — GET /travel */
export interface TravelState {
  /** 대화량 기반 연료 0~100 */
  fuel: number;
  progress: Record<string, PlanetProgress>;
}

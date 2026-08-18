/**
 * 여행 가능 조건 + 상태 판정 — 순수 함수만 모아둔 도메인 로직 (React/GSAP 의존 없음).
 *
 * 여행은 아래 두 조건을 모두 만족할 때만 가능하다.
 *   A. 탐험 게이지(Fuel)가 100%
 *   B. 현재 별 - 목적지 별 거리가 여행 가능 거리(MAX_TRAVEL_DISTANCE_AU) 이하
 */

/** 한 번에 여행 가능한 최대 거리(AU). 게임 밸런스 상수 — API/Swagger와 무관한 프론트 전용 값. */
export const MAX_TRAVEL_DISTANCE_AU = 2;

export type TravelUiState = 'IDLE' | 'CANNOT_TRAVEL' | 'READY_TO_TRAVEL' | 'TRAVELING' | 'ARRIVED';

export function canTravel(progress: number, distanceAu: number): boolean {
  return progress >= 100 && distanceAu <= MAX_TRAVEL_DISTANCE_AU;
}

export interface TravelGateInput {
  /** 목적지가 선택된 상태인가 */
  destinationSelected: boolean;
  /** 탐험 게이지 0~100 */
  progress: number;
  /** 현재 별 - 목적지 별 거리 (AU) */
  distanceAu: number;
  isTraveling: boolean;
  arrived: boolean;
}

export function getTravelUiState({ destinationSelected, progress, distanceAu, isTraveling, arrived }: TravelGateInput): TravelUiState {
  if (arrived) return 'ARRIVED';
  if (isTraveling) return 'TRAVELING';
  if (!destinationSelected) return 'IDLE';
  return canTravel(progress, distanceAu) ? 'READY_TO_TRAVEL' : 'CANNOT_TRAVEL';
}

/** CANNOT_TRAVEL일 때 사용자에게 보여줄 이유 — 게이지 부족이 우선, 그 다음 거리 초과 */
export function getBlockedReason(progress: number, distanceAu: number): 'GAUGE_NOT_FULL' | 'TOO_FAR' | null {
  if (progress < 100) return 'GAUGE_NOT_FULL';
  if (distanceAu > MAX_TRAVEL_DISTANCE_AU) return 'TOO_FAR';
  return null;
}

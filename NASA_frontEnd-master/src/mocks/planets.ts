import type { Planet, FuelEvent } from '../types';

export const PLANETS: Planet[] = [
  { id: 'earth', name: '지구', emoji: '🏠' },
  { id: 'vitality', name: '활력별', emoji: '🪐' },
  { id: 'nutrition', name: '영양별', emoji: '🌱' },
  { id: 'challenge', name: '챌린지별', emoji: '💪' },
  { id: 'tammy', name: 'TAMMY Planet', emoji: '🌟' },
];

/** 행동별 연료 보상 — 백엔드 정책과 동기화 */
export const FUEL_REWARDS: Record<FuelEvent, { amount: number; emoji: string; text: string }> = {
  FOOD_ANALYZED: { amount: 5, emoji: '😋', text: '균형 잡힌 식사네! 앞으로 조금 더 전진했어!' },
  WORKOUT_DONE: { amount: 10, emoji: '😊', text: '대단해! 우주선이 힘차게 전진했어!' },
  GOAL_ACHIEVED: { amount: 15, emoji: '🎉', text: '오늘 목표 완료! 연료 최대 충전!' },
  QUICK_LOG: { amount: 3, emoji: '😊', text: '기록 완료! 잘하고 있어!' },
};

import type { Planet } from './types';

/** 확정된 5개 행성 — 이름·구조는 기획 확정본 기준 */
export const PLANETS: Planet[] = [
  {
    id: 'meal', name: '식사별', accent: '#DBA83C', image: '/planets/meal.png',
    desc: '식사 기록과 AI 음식 분석으로 건강한 식습관을 만들어가요',
    reward: '식사 패턴 리포트', auTotal: 1.24,
    detail: ['식사 기록', '사진 AI 분석', '식사 인사이트'],
  },
  {
    id: 'water', name: '수분별', accent: '#7EC8E3', image: '/planets/water.png',
    desc: '꾸준한 물 섭취 습관으로 몸과 마음을 촉촉하게',
    reward: '수분 습관 리포트', auTotal: 0.86,
    detail: ['수분 기록 히스토리', '일일 섭취량'],
  },
  {
    id: 'emotion', name: '감정별', accent: '#F0A8C8', image: '/planets/emotion.png',
    desc: '감정을 이해하고 AI와 함께 마음을 돌보며 정서적 안정을 찾아가요',
    reward: '감정 리포트', auTotal: 2.15,
    detail: ['감정 타임라인', '감정일기', 'AI 상담'],
  },
  {
    id: 'lifestyle', name: '생활습관별', accent: '#A8DFC0', image: '/planets/lifestyle.png',
    desc: '운동과 활동, 건강한 습관으로 더 나은 나를 만들어요',
    reward: '활동 패턴 리포트', auTotal: 1.78,
    detail: ['습관 기록', '활동'],
  },
  {
    id: 'reflection', name: '회고별', accent: '#C9B6FF', image: '/planets/reflection.png',
    desc: '하루와 한 주를 돌아보며 성장과 변화를 정리해요',
    reward: 'AI 회고 리포트', auTotal: 0.52,
    detail: ['일일 회고', '주간 회고', 'AI 피드백'],
  },
];

/** Fuel = AI Companion과의 대화량. 건강 점수가 아님 */
export const FUEL_REWARDS = [
  { emoji: '🍽', label: '음식 기록', fuel: 10 },
  { emoji: '💧', label: '물 마시기', fuel: 5 },
  { emoji: '💗', label: '감정 기록', fuel: 8 },
  { emoji: '📖', label: '감정일기 작성', fuel: 8 },
  { emoji: '✏️', label: '회고 작성', fuel: 15 },
];

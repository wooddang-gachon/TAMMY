import type { NutritionData } from '../types';

export const mockNutrition: NutritionData[] = [
  { food: '닭가슴살', calories: 320, carbohydrate: 8, protein: 38, fat: 6, comment: '단백질이 충분해! 💪 타미도 힘이 나!' },
  { food: '닭가슴살 샐러드', calories: 358, carbohydrate: 22, protein: 28, fat: 18, comment: '건강한 한 끼다! 타미도 배부르고 행복해 🥗' },
  { food: '연어 포케볼', calories: 480, carbohydrate: 45, protein: 32, fat: 16, comment: '영양 균형이 완벽해! 😊' },
  { food: '크림 파스타', calories: 720, carbohydrate: 82, protein: 18, fat: 34, comment: '배부르다~ 😵 다음 끼니는 가볍게 먹어볼까?' },
];

export const DAILY_KCAL_GOAL = 1800;

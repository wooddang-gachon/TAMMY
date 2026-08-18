/** 도메인 타입 — 백엔드 API 응답 스키마와 1:1 매핑 */

export interface NutritionData {
  food: string;
  calories: number;
  carbohydrate: number; // g
  protein: number; // g
  fat: number; // g
  /** TAMMY 코멘트 (AI 생성) */
  comment?: string;
}

export interface Exercise {
  id: string;
  name: string;
  emoji: string;
  bodyPart: string;
  reps: string;
  sets: number;
  seconds: number; // 세트당 시간
  calories: number;
  howTo: string[];
  caution: string;
}

export interface ExercisePlan {
  title: string;
  emoji: string;
  totalMinutes: number;
  totalCalories: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  exercises: Exercise[];
}

export interface UserProfile {
  gender: '여성' | '남성';
  age: number;
  height: number;
  weight: number;
  goal: '체중 감량' | '근육 증가' | '체력 향상' | '건강 관리';
  experience: '초급' | '중급' | '고급';
  place: '집' | '헬스장';
  minutes: '15분' | '30분' | '45분' | '60분 이상';
}

/** GET /dashboard/summary — Swagger CalorieTrendItem 1:1 */
export interface CalorieTrendItem {
  date: string;
  caloriesKcal: number;
}

/** GET /dashboard/summary — Swagger NutritionBalanceInfo 1:1 */
export interface NutritionBalanceInfo {
  carbohydratePercent: number;
  proteinPercent: number;
  fatPercent: number;
  vitaminPercent: number;
  mineralPercent: number;
}

/** GET /dashboard/summary — Swagger DashboardSummaryInfo 1:1 (parameters 없음, 쿼리 불가) */
export interface DashboardSummaryInfo {
  calorieTrends: CalorieTrendItem[];
  nutritionBalance: NutritionBalanceInfo;
  weeklyWorkoutCompletedDays: number;
}

/** 모든 백엔드 응답의 공통 봉투 — Swagger ApiResponse_*_ 스키마 1:1 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  code: number;
}

/** POST /auth/login, /auth/signup 등 응답의 user 필드 — 백엔드 UserAuthProfile 1:1 (UserProfile과는 다른 개념) */
export interface AuthUserProfile {
  id: number;
  email: string;
  nickname: string;
  authProvider: 'LOCAL' | 'KAKAO' | 'GOOGLE' | 'APPLE';
}

/** GET /users/me 응답 — 백엔드 UserProfileResponseData 1:1 */
export interface MeProfile {
  userId: number;
  nickname: string;
  gender?: string | null;
  age?: number | null;
  currentFuel?: number | null;
  tammyStatus?: { level: number; currentExp: number };
  createdAt?: string;
}

/** POST /food-vision/scan 응답 — 백엔드 FoodVisionScanResponse 1:1 */
export interface DetectedFoodItem {
  foodName: string;
  estimatedGram?: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  confidence?: number;
}

export interface FoodVisionScanResponse {
  scanEngine: string;
  isFallbackUsed: boolean;
  imageId: string;
  imageUrl: string;
  detectedFoods: DetectedFoodItem[];
}

/** POST /food-log/confirm — 백엔드 FoodLogConfirmRequest/Response 1:1 */
export interface FoodItemInput {
  foodName: string;
  gram?: number;
  boxId?: number;
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
}
export interface FoodLogConfirmRequest {
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  imageId?: string | number;
  imageUrl?: string;
  comment?: string;
  foods?: FoodItemInput[];
  foodName?: string;
  intakeGram?: number;
}
export interface FoodLogConfirmResponse {
  mealId: string | number;
  earnedFuel: number;
  totalCalories: number;
}

/** POST /quick-log — 백엔드 QuickLogApiRequest/Response 1:1 */
export type LogCategory = 'WATER' | 'EMOTION' | 'JOURNAL' | 'EXERCISE';
export interface QuickLogApiRequest {
  category: LogCategory;
  amount?: number;
  emotionType?: string;
  journalContent?: string;
  exerciseName?: string;
  durationMinutes?: number;
}
export interface QuickLogApiResponse {
  logId: string | number;
  category: string;
  earnedFuel: number;
  totalFuel: number;
  createdAt?: string;
}

/** POST /planet-travel/start, GET /planet-travel/state — 백엔드 DTO 1:1 */
export type PlanetType = 'MEAL' | 'WATER' | 'EMOTION' | 'LIFESTYLE' | 'RETROSPECT';
export interface PlanetTravelStartApiRequest {
  planetType: PlanetType;
  fuelSpent: number;
}
export interface TravelResultSummary {
  id: string | number;
  userId: number;
  title: string;
  summaryContent: string;
  recommendations: string[];
}
export interface PlanetTravelStartApiResponse {
  travelId: string | number;
  travelResultId: string | number;
  remainingFuel: number;
  status: string;
  travelResult?: TravelResultSummary;
}
export interface PlanetStateItem {
  planetType: PlanetType;
  name: string;
  targetDistance: number;
  currentDistance: number;
  isCompleted: boolean;
  completedAt?: string | null;
}
export interface TravelStateInfoResponse {
  currentPlanet?: string;
  activePlanet?: PlanetType | null;
  explorationProgressPercent: number;
  currentFuel: number;
  requiredFuelForNextPlanet?: number;
  totalStarCount: number;
  completedStarCount: number;
  tammyRelationshipLevel: number;
  planetList: PlanetStateItem[];
}

/** GET /travel-results/{id} — 백엔드 TravelResultDetailInfo 1:1 */
export interface TravelResultDetailInfo {
  reportId?: string | number;
  travelResultId?: string | number;
  userId?: number;
  title: string;
  summaryContent: string;
  recommendations: string[];
  createdAt?: string;
}

/** GET /users/tammy/history — 백엔드 TammyHistoryResponse 1:1 */
export interface TammyHistoryLogItem {
  id: number;
  changeReason: string;
  deltaExp: number;
  snapshotLevel: number;
  snapshotTotalExp: number;
  createdAt: string;
}
export interface TammyHistoryResponse {
  logs: TammyHistoryLogItem[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'tammy';
  text: string;
  createdAt: number;
}

export interface Planet {
  id: string;
  name: string;
  emoji: string;
}

export interface SpaceState {
  fuel: number; // 0–100, 다음 행성까지 진행률
  planetIdx: number; // 마지막으로 도착한 행성 index
}

export type FuelEvent = 'FOOD_ANALYZED' | 'WORKOUT_DONE' | 'GOAL_ACHIEVED' | 'QUICK_LOG';

import type {
  NutritionData,
  AuthUserProfile,
  MeProfile,
  FoodVisionScanResponse,
  FoodLogConfirmRequest,
  FoodLogConfirmResponse,
  QuickLogApiRequest,
  QuickLogApiResponse,
  PlanetTravelStartApiRequest,
  PlanetTravelStartApiResponse,
  TravelStateInfoResponse,
  TravelResultDetailInfo,
  TammyHistoryResponse,
  ApiResponse,
  DashboardSummaryInfo,
} from '../types';

import { mockNutrition } from '../mocks/food';
import { mockDashboardSummary } from '../mocks/report';
import { mockReply } from '../mocks/chat';

// 일단 테스트할 때는 false
const USE_MOCK = false;

// 백엔드는 /api/v1 프리픽스 하위에 마운트되어 있다(src/config/index.ts의 api.prefix).
// .env에 VITE_API_URL=http://localhost:3000/api/v1 같은 식으로 재정의 가능
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** 진행 중인 리프레시가 있으면 그 Promise를 공유해 401이 동시에 여러 개 터져도 refresh는 한 번만 나간다 */
let refreshInFlight: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(BASE_URL + '/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const data: ApiResponse<{ accessToken: string; refreshToken: string }> = await res.json();
        if (!data.data) return false;
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

/**
 * 공통 fetch 래퍼.
 * - localStorage의 accessToken을 모든 요청에 Authorization: Bearer로 자동 첨부한다.
 * - 401을 받으면(만료된 accessToken) refreshToken으로 한 번만 자동 갱신을 시도하고,
 *   성공하면 원 요청을 새 토큰으로 1회 재시도한다. 그래도 실패하면 세션을 정리하고 에러를 던진다
 *   (화면단에서 로그인 필요 상태로 처리하도록).
 */
async function http<T>(
  path: string,
  init: RequestInit = {},
  _retried = false
): Promise<T> {
  const accessToken = localStorage.getItem('accessToken');

  const headers = new Headers(init.headers);

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const res = await fetch(BASE_URL + path, {
    ...init,
    headers,
  });

  if (res.status === 401 && !_retried && localStorage.getItem('refreshToken')) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return http<T>(path, init, true);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  /**
   * POST /auth/signup
   */
  async signUp(email: string, password: string, nickname: string) {
    const res = await http<
      ApiResponse<{ user: AuthUserProfile; accessToken: string; refreshToken: string }>
    >('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, nickname }),
    });

    if (!res.data) {
      throw new Error(res.message || '회원가입에 실패했습니다.');
    }

    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);

    return res.data;
  },

  /**
   * POST /auth/login
   */
  async login(email: string, password: string) {
    const res = await http<
      ApiResponse<{
        user: AuthUserProfile;
        accessToken: string;
        refreshToken: string;
      }>
    >('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!res.data) {
      throw new Error(res.message || '로그인에 실패했습니다.');
    }

    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);

    return res.data;
  },

  /**
   * GET /users/me
   */
  async getMe() {
    const res = await http<ApiResponse<MeProfile>>('/users/me');

    if (!res.data) {
      throw new Error(res.message || '사용자 정보를 불러오지 못했습니다.');
    }

    return res.data;
  },

  /**
   * GET /users/tammy/history
   */
  async getTammyHistory() {
    const res = await http<ApiResponse<TammyHistoryResponse>>('/users/tammy/history');
    if (!res.data) {
      throw new Error(res.message || '타미 성장 히스토리를 불러오지 못했습니다.');
    }
    return res.data;
  },

  /**
   * POST /food-vision/scan
   * 음식 사진 → AI 영양 분석
   */
  async analyzeFood(
    image: File | null,
    mealType = 'LUNCH'
  ): Promise<NutritionData & { raw: FoodVisionScanResponse }> {
    if (USE_MOCK) {
      await delay(2000);
      const m = mockNutrition[Math.floor(Math.random() * mockNutrition.length)];
      return { ...m, raw: { scanEngine: 'MOCK', isFallbackUsed: true, imageId: 'mock', imageUrl: '', detectedFoods: [] } };
    }

    if (!image) {
      throw new Error('음식 사진이 필요합니다.');
    }

    const accessToken = localStorage.getItem('accessToken');

    const form = new FormData();
    form.append('file', image);
    form.append('mealType', mealType);

    const res = await fetch(
      BASE_URL + '/food-vision/scan',
      {
        method: 'POST',
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {},
        body: form,
      }
    );

    if (!res.ok) {
      throw new Error(
        `API ${res.status}: /food-vision/scan`
      );
    }

    const data: ApiResponse<FoodVisionScanResponse> = await res.json();

    if (!data.data) {
      throw new Error(
        data.message || '음식 분석에 실패했습니다.'
      );
    }

    // 백엔드는 감지된 음식 배열(detectedFoods)을 반환한다 — FE 카드 UI는 단일 음식
    // 형태(NutritionData)를 기대하므로 감지 항목을 합산해 매핑한다.
    // raw도 함께 돌려줘서 food-log/confirm 호출 시 imageId/boxId 등 원본 필드를 그대로 넘길 수 있게 한다.
    const foods = data.data.detectedFoods;
    if (!foods.length) {
      throw new Error('음식을 인식하지 못했습니다.');
    }
    return {
      food: foods.map((f) => f.foodName).join(', '),
      calories: Math.round(foods.reduce((sum, f) => sum + f.calories, 0)),
      carbohydrate: Math.round(foods.reduce((sum, f) => sum + f.carbs, 0)),
      protein: Math.round(foods.reduce((sum, f) => sum + f.protein, 0)),
      fat: Math.round(foods.reduce((sum, f) => sum + f.fat, 0)),
      raw: data.data,
    };
  },

  /**
   * POST /food-log/confirm
   * 스캔된(또는 수동) 식단을 실제 오늘 식단으로 확정 저장
   */
  async confirmFoodLog(body: FoodLogConfirmRequest): Promise<FoodLogConfirmResponse> {
    const res = await http<ApiResponse<FoodLogConfirmResponse>>('/food-log/confirm', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!res.data) {
      throw new Error(res.message || '식단 기록에 실패했습니다.');
    }
    return res.data;
  },

  /**
   * POST /quick-log
   * 물/감정/일기/운동 1-Tap 기록
   */
  async quickLog(body: QuickLogApiRequest): Promise<QuickLogApiResponse> {
    const res = await http<ApiResponse<QuickLogApiResponse>>('/quick-log', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!res.data) {
      throw new Error(res.message || '퀵기록에 실패했습니다.');
    }
    return res.data;
  },

  /**
   * GET /dashboard/summary
   */
  async getDashboardSummary(): Promise<DashboardSummaryInfo> {
    if (USE_MOCK) {
      await delay(400);
      return mockDashboardSummary;
    }

    const res =
      await http<ApiResponse<DashboardSummaryInfo>>(
        '/dashboard/summary'
      );

    if (!res.data) {
      throw new Error(
        res.message ||
          '대시보드 데이터를 불러오지 못했습니다.'
      );
    }

    return res.data;
  },

  /**
   * POST /planet-travel/start
   */
  async startPlanetTravel(body: PlanetTravelStartApiRequest): Promise<PlanetTravelStartApiResponse> {
    const res = await http<ApiResponse<PlanetTravelStartApiResponse>>('/planet-travel/start', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!res.data) {
      throw new Error(res.message || '별여행 시작에 실패했습니다.');
    }
    return res.data;
  },

  /**
   * GET /planet-travel/state
   */
  async getTravelState(): Promise<TravelStateInfoResponse> {
    const res = await http<ApiResponse<TravelStateInfoResponse>>('/planet-travel/state');
    if (!res.data) {
      throw new Error(res.message || '우주여행 현황을 불러오지 못했습니다.');
    }
    return res.data;
  },

  /**
   * GET /travel-results/{travelResultId}
   */
  async getTravelResult(travelResultId: string | number): Promise<TravelResultDetailInfo> {
    const res = await http<ApiResponse<TravelResultDetailInfo>>(`/travel-results/${travelResultId}`);
    if (!res.data) {
      throw new Error(res.message || '탐사 결과 진단서를 불러오지 못했습니다.');
    }
    return res.data;
  },

  /**
   * POST /chat/message
   * TAMMY 실제 AI 대화
   */
  async chat(
    message: string,
    _history: { role: string; text: string }[] = [],
    _memories: string[] = []
  ): Promise<{
    reply: string;
    memory: string | null;
    /** 백엔드가 이번 대화로 실제 지급한 연료 — 없으면(mock 등) null */
    gainedFuel: number | null;
  }> {
    if (USE_MOCK) {
      await delay(1000);

      return {
        reply: mockReply(message),
        memory: null,
        gainedFuel: null,
      };
    }

    const res = await http<ApiResponse<any>>(
      '/chat/message',
      {
        method: 'POST',
        body: JSON.stringify({
          messageText: message,
        }),
      }
    );

    if (!res.data) {
      throw new Error(
        res.message || 'TAMMY 응답을 받지 못했습니다.'
      );
    }

    // 백엔드 실제 응답 형태를 확인하기 전까지
    // 여러 형태를 안전하게 처리
    const data = res.data;

    return {
      reply:
        data.reply ??
        data.message ??
        data.response ??
        data.text ??
        String(data),
      memory: data.memory ?? null,
      gainedFuel: typeof data.gainedFuel === 'number' ? data.gainedFuel : null,
    };
  },
};

import { useState } from 'react';
import { StarTravelScene, PlanetDetailTransition, PLANETS } from '../features/travel';
import type { TravelState } from '../features/travel';

const INITIAL_TRAVEL_STATE: TravelState = {
  fuel: 68,
  progress: PLANETS.reduce<Record<string, { distance: number }>>((acc, p, i) => {
    acc[p.id] = { distance: i === 0 ? 42 : 100 };
    return acc;
  }, {}),
};

/**
 * Space Travel — GSAP로 애니메이션되는 행성 캐러셀(StarTravelScene) 진입점.
 * ⚠️ 이 화면의 fuel/progress는 여행 연출 전용 로컬 상태이며, 홈/채팅 탭에 표시되는
 * 전역 useFuel 연료와는 별개다(두 상태를 하나로 합치는 작업은 이번 범위 밖).
 */
export function TravelScreen({ onGoHome, onGoReport, onOpenPlanetReport }: { onGoHome: () => void; onGoReport: () => void; onOpenPlanetReport: (planetId: string, travelResultId?: string | number) => void }) {
  const [state, setState] = useState<TravelState>(INITIAL_TRAVEL_STATE);
  const [detailPlanetId, setDetailPlanetId] = useState<string | null>(null);
  // 실제 POST /planet-travel/start가 준 travelResultId — planetId별로 기억해뒀다가 "탐험 이야기" 진입 시 함께 넘긴다.
  const [travelResultIds, setTravelResultIds] = useState<Record<string, string | number>>({});

  const handleFuelSpent = (planetId: string, distance: number, fuel: number) => {
    setState((s) => ({ fuel, progress: { ...s.progress, [planetId]: { distance } } }));
  };

  const detailPlanet = detailPlanetId ? PLANETS.find((p) => p.id === detailPlanetId) : null;

  if (detailPlanet) {
    return (
      <PlanetDetailTransition planet={detailPlanet} onBack={() => setDetailPlanetId(null)}>
        <button
          onClick={() => onOpenPlanetReport(detailPlanet.id, travelResultIds[detailPlanet.id])}
          className="mt-1 flex w-full items-center gap-3 rounded-3xl border border-white/10 bg-white/[.09] p-4 text-left"
        >
          <span className="text-[22px]">🌌</span>
          <span className="flex-1">
            <span className="block text-[13.5px] font-black text-white">{detailPlanet.name} 탐험 이야기</span>
            <span className="mt-0.5 block text-[11px] font-bold text-[#9C88BE]">이 별의 전용 리포트 보러 가기</span>
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B4A0D2" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
        <button
          onClick={onGoReport}
          className="mt-2.5 flex w-full items-center gap-3 rounded-3xl border border-white/10 bg-white/[.09] p-4 text-left"
        >
          <span className="text-[22px]">📊</span>
          <span className="flex-1">
            <span className="block text-[13.5px] font-black text-white">월간 AI 건강 리포트</span>
            <span className="mt-0.5 block text-[11px] font-bold text-[#9C88BE]">음식 · 운동 · AI 분석 보러 가기</span>
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B4A0D2" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </PlanetDetailTransition>
    );
  }

  return (
    <StarTravelScene
      state={state}
      onFuelSpent={handleFuelSpent}
      onOpenDetail={(planetId) => setDetailPlanetId(planetId)}
      onGoHome={onGoHome}
      onGoReport={onGoReport}
      onTravelStarted={(planetId, travelResultId) => setTravelResultIds((ids) => ({ ...ids, [planetId]: travelResultId }))}
    />
  );
}

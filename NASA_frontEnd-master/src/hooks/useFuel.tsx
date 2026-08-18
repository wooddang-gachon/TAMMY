import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { FuelEvent, SpaceState } from '../types';
import { FUEL_REWARDS, PLANETS } from '../mocks/planets';

/**
 * 우주여행 성장 시스템의 단일 소스.
 * 운동 완료 / 음식 분석 / 목표 달성 시 addFuel(event)만 호출하면
 * 게이지 · 우주선 위치 · 도착 연출 · 보상 토스트가 앱 전체에 자동 반영됩니다.
 */
interface Reward { amount: number; emoji: string; text: string }

interface FuelContextValue {
  fuel: number;
  planetIdx: number;
  targetIdx: number;
  reward: Reward | null;
  boosting: boolean;
  arrivedIdx: number | null;
  addFuel: (event: FuelEvent) => void;
  /** 백엔드가 실제로 돌려준 gainedFuel 같은 임의 수치를 그대로 반영할 때 사용 (예: POST /chat/message 응답) */
  addFuelAmount: (amount: number, reaction?: { emoji: string; text: string }) => void;
  dismissArrival: () => void;
}

const FuelContext = createContext<FuelContextValue | null>(null);
const STORAGE_KEY = 'tammy.space.v1';

function load(): SpaceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SpaceState;
  } catch { /* ignore */ }
  return { fuel: 68, planetIdx: 0 };
}

export function FuelProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SpaceState>(load);
  const [reward, setReward] = useState<Reward | null>(null);
  const [boosting, setBoosting] = useState(false);
  const [arrivedIdx, setArrivedIdx] = useState<number | null>(null);
  const timer = useRef<number>();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const applyReward = useCallback((r: Reward) => {
    setState((s) => {
      let fuel = s.fuel + r.amount;
      let planetIdx = s.planetIdx;
      if (fuel >= 100 && planetIdx < PLANETS.length - 1) {
        fuel -= 100;
        planetIdx += 1;
        setArrivedIdx(planetIdx);
      } else if (fuel > 100) fuel = 100;
      return { fuel, planetIdx };
    });
    setReward(r);
    setBoosting(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setReward(null);
      setBoosting(false);
    }, 2800);
  }, []);

  const addFuel = useCallback((event: FuelEvent) => applyReward(FUEL_REWARDS[event]), [applyReward]);

  const addFuelAmount = useCallback((amount: number, reaction?: { emoji: string; text: string }) => {
    if (amount <= 0) return;
    applyReward({ amount, emoji: reaction?.emoji ?? '😊', text: reaction?.text ?? `연료 +${amount} 획득!` });
  }, [applyReward]);

  const value = useMemo<FuelContextValue>(() => ({
    fuel: state.fuel,
    planetIdx: state.planetIdx,
    targetIdx: Math.min(state.planetIdx + 1, PLANETS.length - 1),
    reward,
    boosting,
    arrivedIdx,
    addFuel,
    addFuelAmount,
    dismissArrival: () => setArrivedIdx(null),
  }), [state, reward, boosting, arrivedIdx, addFuel, addFuelAmount]);

  return <FuelContext.Provider value={value}>{children}</FuelContext.Provider>;
}

export function useFuel(): FuelContextValue {
  const ctx = useContext(FuelContext);
  if (!ctx) throw new Error('useFuel must be used within FuelProvider');
  return ctx;
}

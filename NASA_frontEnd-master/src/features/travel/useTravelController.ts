import { useCallback, useEffect, useRef, useState } from 'react';

export type TravelPhase = 'idle' | 'ignite' | 'launch' | 'warp' | 'travel' | 'arrival';

export const PHASE_MS = { ignite: 700, launch: 1000, warp: 1500 } as const;

/** easeInOutExpo — 워프 구간의 가속/감속 곡선 */
export const easeInOutExpo = (x: number): number =>
  x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2;

interface TravelPlan {
  planetId: string;
  /** 진행도 단위 거리(0~100) */
  fromDistance: number;
  toDistance: number;
  /** 1 진행도당 AU 환산 계수 */
  auPerUnit: number;
  fuelFrom: number;
  fuelSpend: number;
}

interface TravelState {
  phase: TravelPhase;
  /** 진행도 단위 잔여 거리 */
  distance: number;
  fuel: number;
  /** 워프 중 카메라 흔들림 (±2px) */
  shake: number;
}

/**
 * 시네마틱 여행 컨트롤러.
 * ignite(700) → launch(1000) → warp(1500) → travel(거리 비례) → arrival
 * 거리·연료는 requestAnimationFrame으로 매 프레임 갱신됩니다(레이아웃 시프트 없음).
 */
export function useTravelController(opts: {
  onArrive: (planetId: string, finalDistance: number, finalFuel: number) => void;
  /** 사운드 훅 (선택) */
  onPhase?: (phase: TravelPhase) => void;
}) {
  const [state, setState] = useState<TravelState>({ phase: 'idle', distance: 0, fuel: 0, shake: 0 });
  const plan = useRef<TravelPlan | null>(null);
  const raf = useRef<number>();
  const timers = useRef<number[]>([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const setPhase = useCallback((phase: TravelPhase) => {
    setState((s) => ({ ...s, phase }));
    opts.onPhase?.(phase);
  }, [opts]);

  const runTravel = useCallback(() => {
    const p = plan.current;
    if (!p) return;
    const duration = 1600 + Math.min(2400, p.fuelSpend * 34); // 남은 거리에 따라 항해 시간 변화
    const t0 = performance.now();
    setPhase('travel');
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / duration);
      const e = easeInOutExpo(k);
      setState((s) => ({
        ...s,
        distance: p.fromDistance + (p.toDistance - p.fromDistance) * e,
        fuel: p.fuelFrom - p.fuelSpend * e,
        shake: (Math.random() * 2 - 1) * 2,
      }));
      if (k < 1) raf.current = requestAnimationFrame(step);
      else {
        setPhase('arrival');
        navigator.vibrate?.([12, 40, 18]);
        opts.onArrive(p.planetId, Math.max(0, p.toDistance), Math.max(0, p.fuelFrom - p.fuelSpend));
      }
    };
    raf.current = requestAnimationFrame(step);
  }, [opts, setPhase]);

  const start = useCallback((p: TravelPlan) => {
    if (state.phase !== 'idle') return;
    plan.current = p;
    setState({ phase: 'ignite', distance: p.fromDistance, fuel: p.fuelFrom, shake: 0 });
    opts.onPhase?.('ignite');
    clearTimers();
    timers.current.push(window.setTimeout(() => setPhase('launch'), PHASE_MS.ignite));
    timers.current.push(window.setTimeout(() => setPhase('warp'), PHASE_MS.ignite + PHASE_MS.launch));
    timers.current.push(window.setTimeout(runTravel, PHASE_MS.ignite + PHASE_MS.launch + PHASE_MS.warp));
  }, [opts, runTravel, setPhase, state.phase]);

  const reset = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    clearTimers();
    plan.current = null;
    setState({ phase: 'idle', distance: 0, fuel: 0, shake: 0 });
  }, []);

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); clearTimers(); }, []);

  return {
    ...state,
    planetId: plan.current?.planetId ?? null,
    auRemaining: plan.current ? plan.current.auPerUnit * state.distance : 0,
    progressPct: Math.round(100 - state.distance),
    active: state.phase !== 'idle',
    warping: state.phase === 'warp' || state.phase === 'travel',
    start,
    reset,
  };
}

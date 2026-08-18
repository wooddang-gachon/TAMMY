import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/** 친밀도(Affinity) — 절대 감소하지 않음. TAMMY v4 AFFINITY_STAGES 그대로 이식. */
export const AFFINITY_STAGES = [
  { min: 0, emoji: '🌱', name: '첫 만남' },
  { min: 100, emoji: '🤝', name: '친구' },
  { min: 300, emoji: '🚀', name: '동행자' },
  { min: 700, emoji: '🌌', name: '최고의 파트너' },
  { min: 1200, emoji: '⭐', name: 'Soul Mate' },
] as const;

export function affinityStage(v: number): (typeof AFFINITY_STAGES)[number] {
  let cur: (typeof AFFINITY_STAGES)[number] = AFFINITY_STAGES[0];
  for (const s of AFFINITY_STAGES) if (v >= s.min) cur = s;
  return cur;
}

interface AffinityContextValue {
  affinity: number;
  stage: (typeof AFFINITY_STAGES)[number];
  expPct: number;
  addAffinity: (amount: number) => void;
}

const AffinityContext = createContext<AffinityContextValue | null>(null);
const STORAGE_KEY = 'tammy.affinity.v1';

function load(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as number;
  } catch { /* ignore */ }
  return 320;
}

export function AffinityProvider({ children }: { children: ReactNode }) {
  const [affinity, setAffinity] = useState<number>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(affinity));
  }, [affinity]);

  const addAffinity = useCallback((amount: number) => {
    setAffinity((a) => a + amount);
  }, []);

  const value = useMemo<AffinityContextValue>(() => ({
    affinity,
    stage: affinityStage(affinity),
    expPct: Math.min(100, Math.round((affinity % 400) / 4)),
    addAffinity,
  }), [affinity, addAffinity]);

  return <AffinityContext.Provider value={value}>{children}</AffinityContext.Provider>;
}

export function useAffinity(): AffinityContextValue {
  const ctx = useContext(AffinityContext);
  if (!ctx) throw new Error('useAffinity must be used within AffinityProvider');
  return ctx;
}

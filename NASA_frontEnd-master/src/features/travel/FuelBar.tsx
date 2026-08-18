import { motion } from 'framer-motion';

/** 연료 바 — 글로우 펄스 + 파티클. Fuel은 AI와의 대화량을 의미 */
export function FuelBar({ fuel, compact = false }: { fuel: number; compact?: boolean }) {
  const pct = Math.max(0, Math.min(100, fuel));
  return (
    <div className={compact ? 'w-[210px]' : 'w-full'}>
      <div className="flex justify-between text-[9.5px] font-extrabold text-[#B4A0D2]">
        <span>Fuel</span>
        <motion.span key={Math.round(pct)} initial={{ opacity: 0.4, y: -3 }} animate={{ opacity: 1, y: 0 }} className="tabular-nums text-butter-deep">
          {Math.round(pct)}%
        </motion.span>
      </div>
      <div className="relative mt-1.5 h-[6px] overflow-hidden rounded-full bg-white/15">
        <motion.div
          className="h-full rounded-full will-change-transform"
          style={{ background: 'linear-gradient(90deg, #F5B841, #FFD9A0)', boxShadow: '0 0 12px rgba(245,184,65,.8)' }}
          animate={{ width: `${pct}%`, opacity: [1, 0.86, 1] }}
          transition={{ width: { type: 'spring', stiffness: 60, damping: 15 }, opacity: { duration: 2, repeat: Infinity } }}
        />
      </div>
    </div>
  );
}

/** 거리 인디케이터 — 매 프레임 갱신되는 AU 카운터 (tabular-nums로 레이아웃 시프트 방지) */
export function DistanceIndicator({ au, progressPct, totalAu }: { au: number; progressPct: number; totalAu?: number }) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[27px] font-black tabular-nums text-white">{au.toFixed(2)}</span>
          <span className="text-[13px] font-black text-[#C4B2DE]">AU</span>
        </div>
        {totalAu != null && <div className="mt-0.5 text-[10px] font-bold text-[#9C88BE]">전체 거리 {totalAu.toFixed(2)} AU</div>}
      </div>
      <span className="text-[26px] font-black tabular-nums text-butter-deep">
        {progressPct}
        <span className="text-sm">%</span>
      </span>
    </div>
  );
}

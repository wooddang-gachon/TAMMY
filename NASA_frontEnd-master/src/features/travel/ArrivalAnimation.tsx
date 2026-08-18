import { motion } from 'framer-motion';
import type { Planet } from './types';

/** 도착 연출 — 0.8 → 1.05 → 1.0 소프트 바운스 + 골드 파티클 폭발 + 링 발광 */
export function ArrivalAnimation({ planet, onContinue }: { planet: Planet; onContinue: () => void }) {
  const COLORS = ['#FFD9A0', '#F5B841', '#C9B6FF', '#F0A8C8', '#7EC8E3'];
  return (
    <div className="flex flex-col items-center px-7 text-center">
      <div className="relative">
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full will-change-transform"
            style={{ width: i % 3 ? 6 : 9, height: i % 3 ? 6 : 9, background: COLORS[i % COLORS.length], marginLeft: -4, marginTop: -4 }}
            animate={{ x: Math.cos((i / 18) * Math.PI * 2) * 150, y: Math.sin((i / 18) * Math.PI * 2) * 150, opacity: [1, 0], scale: [1, 0.2] }}
            transition={{ duration: 1.5, delay: i * 0.035, repeat: Infinity, ease: [0.2, 0.8, 0.3, 1] }}
          />
        ))}
        {/* PHASE 6(PLANET TRANSITION)이 행성을 1.35까지 확대해두고 넘겨준다 — 여기서도 1.35에서 시작해
            이어받아 자연스럽게 안착시킨다(0.8부터 다시 튀어나오는 컷 없음). */}
        <motion.img
          src={planet.image}
          alt={planet.name}
          className="relative w-[210px] will-change-transform"
          style={{ filter: `drop-shadow(0 0 46px ${planet.accent}8c) drop-shadow(0 0 90px rgba(201,182,255,.45))` }}
          initial={{ scale: 1.35 }}
          animate={{ scale: [1.35, 0.96, 1], rotate: [0, 6] }}
          transition={{ scale: { duration: 0.55, ease: [0.3, 1, 0.4, 1] }, rotate: { duration: 40, repeat: Infinity, ease: 'linear' } }}
        />
      </div>
      <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mt-6 text-xs font-black tracking-wide text-butter-deep">
        ✨ 목적지 도착
      </motion.p>
      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-2 text-[25px] font-black text-white">
        {planet.name}
      </motion.h2>
      <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }} className="mt-2 text-xs font-bold leading-relaxed text-[#B4A0D2]">
        한 걸음 더 건강한 나에게 도착했어요.
        <br />
        이번 여정의 이야기를 정리해뒀어요 🌱
      </motion.p>
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        whileTap={{ scale: 0.96 }}
        onClick={onContinue}
        className="mt-6 rounded-[20px] bg-gradient-to-br from-lavender-deep to-lavender px-8 py-3.5 text-[13.5px] font-black text-white shadow-[0_12px_30px_rgba(140,110,190,.5)]"
      >
        이야기 확인하기 🚀
      </motion.button>
    </div>
  );
}

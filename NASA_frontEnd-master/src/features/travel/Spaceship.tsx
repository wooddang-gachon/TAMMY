import { motion } from 'framer-motion';
import type { TravelPhase } from './useTravelController';

/** 우주선 — 단계별 자세/추진. 엔진 불꽃과 배기 파티클 포함 */
export function Spaceship({ phase }: { phase: TravelPhase }) {
  const pose =
    phase === 'ignite' ? { y: 6, rotate: -8, scale: 1 } :
    phase === 'launch' ? { y: -26, rotate: -16, scale: 1.06 } :
    phase === 'arrival' ? { y: 0, rotate: -8, scale: 0.8 } :
    { y: -40, rotate: -24, scale: 1.1 };
  const thrusting = phase === 'launch' || phase === 'warp' || phase === 'travel';
  return (
    <motion.div className="relative inline-block will-change-transform" animate={pose} transition={{ type: 'spring', stiffness: 90, damping: 14 }}>
      <motion.div
        className="text-[52px] leading-none"
        style={{ filter: 'drop-shadow(0 0 22px rgba(126,200,227,.85)) drop-shadow(0 8px 26px rgba(201,182,255,.6))' }}
        animate={phase === 'travel' ? { y: [0, -6, 0], rotate: [-24, -20, -24] } : {}}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
      >
        🚀
      </motion.div>
      {/* 엔진 불꽃 */}
      {thrusting && (
        <motion.span
          className="absolute left-1/2 top-full -translate-x-1/2 rounded-full will-change-transform"
          style={{ width: 14, height: 30, background: 'linear-gradient(180deg, #BFE9FF, #4FA8E0 55%, transparent)', filter: 'blur(1px)' }}
          animate={{ scaleY: [0.7, 1.25, 0.85, 1.1], opacity: [0.8, 1, 0.85, 1] }}
          transition={{ duration: 0.28, repeat: Infinity }}
        />
      )}
      {/* 배기 파티클 */}
      {thrusting && Array.from({ length: 6 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-full h-1 w-1 rounded-full bg-[#BFE9FF] will-change-transform"
          animate={{ y: [0, 48], x: [(i - 3) * 2, (i - 3) * 7], opacity: [1, 0], scale: [1, 0.3] }}
          transition={{ duration: 0.6, delay: i * 0.08, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </motion.div>
  );
}

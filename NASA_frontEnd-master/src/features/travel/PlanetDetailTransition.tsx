import { motion } from 'framer-motion';
import type { Planet } from './types';

/**
 * 행성 상세 전환 — 카메라가 행성으로 들어가듯 확대되며 크로스페이드.
 * 배경은 블러 처리되고 상세 내용이 페이드 인합니다(급격한 페이지 전환 없음).
 */
export function PlanetDetailTransition({ planet, children, onBack }: { planet: Planet; children?: React.ReactNode; onBack: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative min-h-full overflow-hidden pb-[110px]">
      {/* 카메라 인: 행성이 화면을 채우며 블러 배경이 됨 */}
      <motion.img
        src={planet.image}
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 will-change-transform"
        initial={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
        animate={{ scale: 3.4, opacity: 0.32, filter: 'blur(22px)' }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: 210 }}
      />
      <div className="absolute inset-0 bg-[#1C1435]/70" />

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.5 }} className="relative">
        <header className="flex items-center gap-2.5 px-5 pt-3">
          <motion.button whileTap={{ scale: 0.92 }} onClick={onBack} className="flex h-[38px] w-[38px] items-center justify-center rounded-widget bg-white/90">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#5C4A66" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </motion.button>
          <h1 className="text-lg font-black text-white">{planet.name}</h1>
        </header>

        <p className="mx-5 mt-3 text-[12px] font-bold leading-relaxed text-[#C4B2DE]">{planet.desc}</p>

        <div className="mx-4 mt-4 flex flex-col gap-2.5">
          {planet.detail.map((section, i) => (
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.08 }}
              className="rounded-3xl border border-white/10 bg-white/[.07] p-4"
            >
              <span className="text-[13px] font-black text-white">{section}</span>
            </motion.div>
          ))}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }} className="rounded-3xl border border-mint/25 bg-mint/10 p-4">
            <span className="text-[11.5px] font-black text-mint">🌱 {planet.reward}</span>
          </motion.div>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

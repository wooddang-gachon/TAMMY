import { motion } from 'framer-motion';

export type Tab = 'home' | 'food' | 'activities' | 'travel' | 'my';

const TABS: { key: Tab; label: string; paths: string[] }[] = [
  { key: 'home', label: '홈', paths: ['M3 10.5L12 3l9 7.5', 'M5 9.5V21h14V9.5'] },
  { key: 'food', label: '기록', paths: ['M3 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V2', 'M7 2v20', 'M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3z', 'M21 15v7'] },
  { key: 'activities', label: '활동', paths: ['M22 12h-4l-3 9L9 3l-3 9H2'] },
  { key: 'travel', label: '여행', paths: ['M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z'] },
  { key: 'my', label: '마이', paths: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'] },
];

/** 하단 탭 5개 — TAMMY v4 기준: 홈 · 기록 · 활동 · 여행 · 마이 */
export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-[linear-gradient(180deg,rgba(255,249,245,0),rgba(255,249,245,.92)_40%)] px-3.5 pb-2.5 pt-2.5">
      <div className="pointer-events-auto flex justify-around rounded-[30px] bg-white/92 px-2 pb-[7px] pt-[9px] shadow-[0_14px_36px_rgba(120,90,150,.22)] backdrop-blur-xl">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <motion.button key={t.key} whileTap={{ scale: 0.9 }} onClick={() => onChange(t.key)} className="flex min-w-[54px] flex-col items-center gap-[3px]">
              <span
                className="flex h-[34px] w-[46px] items-center justify-center rounded-[18px] transition-all duration-300"
                style={{
                  background: active ? 'linear-gradient(135deg, #C9B6FF, #F0A8C8)' : 'transparent',
                  boxShadow: active ? '0 6px 14px rgba(160,130,190,.45)' : 'none',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FFFFFF' : '#B9A8C9'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {t.paths.map((d, i) => <path key={i} d={d} />)}
                </svg>
              </span>
              <span className={'text-[10px] font-extrabold ' + (active ? 'text-[#9B85D6]' : 'text-[#C3B3D2]')}>{t.label}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}

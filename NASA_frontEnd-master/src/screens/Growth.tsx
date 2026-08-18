import { motion } from 'framer-motion';
import { useAffinity } from '../hooks/useAffinity';
import tammyHero from '../assets/px-hero.png';
import { BackButton } from './Food';

const GROWTH_STATS = [
  { emoji: '💗', label: '공감도', value: '1,250', pct: 84, bg: '#FBF0F4', color: '#E9899E', bar: 'linear-gradient(90deg, #F0A8C8, #E9899E)' },
  { emoji: '🍀', label: '건강 지수', value: '87', pct: 87, bg: '#E9F6EE', color: '#55A374', bar: 'linear-gradient(90deg, #A8DFC0, #55A374)' },
  { emoji: '⚡', label: '활동 지수', value: '92', pct: 92, bg: '#FFF7E4', color: '#DBA83C', bar: 'linear-gradient(90deg, #FFE8A5, #DBA83C)' },
  { emoji: '🌟', label: '행복 지수', value: '90', pct: 90, bg: '#F6F1FB', color: '#9B85D6', bar: 'linear-gradient(90deg, #C9B6FF, #9B85D6)' },
];

const JOURNEY = [
  { title: '별빛 숲 별', desc: '2026.05 — 첫 여행 완료', emoji: '🌲', state: 'done' as const },
  { title: '뭉글 구름 별', desc: '2026.06 — 다음 목적지, D-12', emoji: '☁️', state: 'now' as const },
  { title: '반짝 호수 별', desc: '2026.07 예정', emoji: '💦', state: 'todo' as const },
  { title: '타미별', desc: '최종 목적지 — 핑크 하트 행성 💗', emoji: '💗', state: 'final' as const },
];

const TITLE_COLOR: Record<string, string> = { now: '#9B85D6', final: '#5C4A66', todo: '#B7A6C6', done: '#5C4A66' };
const LINE_BG: Record<string, string> = { done: '#D9C8F0' };

/** Growth — TAMMY v4 "성장" 화면: 친밀도(Affinity) 히어로 + 성장 기록 + 타미별까지의 여정 */
export function GrowthScreen({ onBack }: { onBack: () => void }) {
  const { affinity, expPct, stage } = useAffinity();

  return (
    <div className="flex min-h-full flex-col pb-[110px]">
      <div className="flex flex-none items-center gap-2.5 px-5 pt-1">
        <BackButton onClick={onBack} />
        <h1 className="text-lg font-black text-ink">성장</h1>
      </div>

      <div className="relative mx-4 mt-1.5 flex-none overflow-hidden rounded-[34px] bg-[linear-gradient(175deg,#43395C_0%,#6B5B8E_70%,#9A7FBE_100%)] px-[22px] pb-[26px] pt-6 text-center shadow-[0_18px_40px_rgba(90,70,130,.4)]">
        <span className="pointer-events-none absolute left-[30px] top-[22px] text-[11px] text-[#D8C9F0]" style={{ animation: 'twinkle 2.6s ease-in-out infinite' }}>✦</span>
        <span className="pointer-events-none absolute right-9 top-[50px] text-[8px] text-[#D8C9F0]" style={{ animation: 'twinkle 3.2s ease-in-out 1s infinite' }}>✦</span>
        <span className="pointer-events-none absolute bottom-[60px] left-[46px] text-[8px] text-[#D8C9F0]" style={{ animation: 'twinkle 2.1s ease-in-out .5s infinite' }}>✦</span>

        <span className="inline-flex items-center gap-[7px] rounded-full bg-white/14 px-4 py-[7px]">
          <span className="text-[13px]">{stage.emoji}</span>
          <span className="text-[13px] font-black text-white">{stage.name} · 타미와 함께</span>
        </span>

        <div className="mt-3.5 flex justify-center">
          <motion.img src={tammyHero} alt="타미" className="pixelated w-40 drop-shadow-[0_20px_26px_rgba(30,20,50,.5)]" animate={{ y: [0, -9, 0] }} transition={{ duration: 3.4, repeat: Infinity }} />
        </div>

        <div className="mt-4">
          <div className="mb-[7px] flex justify-between text-[11.5px] font-extrabold text-[#C4B2DE]">
            <span>친밀도 (Affinity)</span>
            <span>친밀도 {affinity}</span>
          </div>
          <div className="h-[10px] overflow-hidden rounded-full bg-white/16">
            <motion.div className="h-full rounded-full bg-[linear-gradient(90deg,#C9B6FF,#FFD9EA)]" animate={{ width: expPct + '%' }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
          </div>
        </div>
      </div>

      <div className="mx-4 mt-4 flex-none rounded-card bg-white px-5 py-[18px] shadow-card">
        <span className="text-[15px] font-black text-ink">성장 기록</span>
        <div className="mt-3.5 flex flex-col gap-[13px]">
          {GROWTH_STATS.map((g) => (
            <div key={g.label} className="flex items-center gap-3">
              <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[20px] text-base" style={{ background: g.bg }}>{g.emoji}</span>
              <div className="flex-1">
                <div className="mb-1.5 flex justify-between">
                  <span className="text-[13px] font-extrabold text-ink">{g.label}</span>
                  <span className="text-[13px] font-black" style={{ color: g.color }}>{g.value}</span>
                </div>
                <div className="h-[7px] overflow-hidden rounded-full bg-[#F2EBF7]">
                  <motion.div className="h-full rounded-full" style={{ background: g.bar }} initial={{ width: 0 }} animate={{ width: g.pct + '%' }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-4 mt-3.5 flex-none rounded-card bg-white px-5 py-[18px] pb-5 shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-black text-ink">타미별까지의 여정</span>
          <span className="text-xs font-extrabold text-lavender-deep">3 / 12</span>
        </div>
        <div className="mt-3 flex flex-col gap-0.5">
          {JOURNEY.map((j, i) => (
            <div key={j.title} className="flex gap-3.5">
              <div className="flex w-[30px] flex-none flex-col items-center">
                <div
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-2xl text-[13px]"
                  style={{
                    background: j.state === 'now' ? 'linear-gradient(135deg, #EFE6FB, #FBE3F0)' : j.state === 'done' ? '#F1EAF8' : '#FAF6FC',
                    border: j.state === 'now' ? '2px solid #C9B6FF' : 'none',
                    boxShadow: j.state === 'now' ? '0 6px 14px rgba(160,130,190,.3)' : 'none',
                  }}
                >
                  {j.emoji}
                </div>
                {i < JOURNEY.length - 1 && <div className="min-h-[22px] w-[3px] flex-1 rounded-[2px]" style={{ background: LINE_BG[j.state] ?? '#F0E8F6' }} />}
              </div>
              <div className="pb-4">
                <div className="text-[13.5px] font-black" style={{ color: TITLE_COLOR[j.state] }}>{j.title}</div>
                <div className="mt-[3px] text-[11.5px] font-bold text-soft">{j.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

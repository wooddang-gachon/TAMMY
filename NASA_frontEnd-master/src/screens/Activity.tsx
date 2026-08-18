import { motion } from 'framer-motion';

const RHYTHM = [
  { emoji: '☀️', time: '8:10', left: '2%' },
  { emoji: '🥗', time: '12:35', left: '34%' },
  { emoji: '☕', time: '15:20', left: '60%' },
  { emoji: '🍚', time: '19:05', left: '90%' },
];

const HABITS = [
  { label: '아침 챙겨 먹기', value: '주 5일', pct: 71, color: '#55A374', bar: 'linear-gradient(90deg, #A8DFC0, #55A374)' },
  { label: '식사 규칙성', value: '지난주 ▲12%', pct: 82, color: '#9B85D6', bar: 'linear-gradient(90deg, #C9B6FF, #9B85D6)' },
  { label: '야식 줄이기', value: '주 1회', pct: 85, color: '#E9899E', bar: 'linear-gradient(90deg, #F0A8C8, #E9899E)' },
];

const BALANCE = [
  { label: '탄수화물', pct: '48%', color: '#DBA83C', bg: '#FFF7E4' },
  { label: '단백질', pct: '32%', color: '#E9899E', bg: '#FBF0F4' },
  { label: '지방', pct: '20%', color: '#55A374', bg: '#E9F6EE' },
];

const INTAKE = [
  { emoji: '☀️', name: '오트밀 & 바나나', meal: '아침', time: '오전 8:10', kcal: '320 kcal', tag: '규칙적', tagColor: '#55A374', tagBg: '#E9F6EE' },
  { emoji: '🥗', name: '닭가슴살 샐러드', meal: '점심', time: '오후 12:35', kcal: '358 kcal', tag: '단백질 풍부', tagColor: '#9B85D6', tagBg: '#F0EAFB' },
  { emoji: '☕', name: '아메리카노', meal: '간식', time: '오후 3:20', kcal: '5 kcal', tag: '카페인 체크', tagColor: '#C79A3E', tagBg: '#FFF7E4' },
  { emoji: '🍚', name: '된장찌개 정식', meal: '저녁', time: '오후 7:05', kcal: '520 kcal', tag: '조금 늦음', tagColor: '#C58AA0', tagBg: '#FBF0F4' },
];

/** Activities — TAMMY v4 "활동" 화면: 식사 리듬 · 습관 변화 · 오늘 먹은 것들 · 영양 밸런스 */
export function ActivityScreen() {
  const items = INTAKE.map((f, i) => ({ ...f, i }));

  return (
    <div className="pb-[110px] pt-1.5">
      <header className="px-[22px] pt-1">
        <h1 className="text-2xl font-black tracking-tight text-ink">활동</h1>
        <p className="mt-[3px] text-[13px] font-bold text-muted">타미와 함께한 건강한 하루 🌿</p>
      </header>

      {/* 오늘의 식사 리듬 */}
      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="mx-4 mt-3.5 rounded-card bg-white px-5 py-[18px] shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-black text-ink">🕒 오늘의 식사 리듬</span>
          <span className="rounded-full bg-[#E9F6EE] px-2.5 py-1 text-[11px] font-extrabold text-mint-deep">규칙적이에요</span>
        </div>
        <div className="relative mt-4 h-11">
          <div className="absolute inset-x-[0] top-[21px] h-[3px] rounded-[2px] bg-[#F0E8F6]" />
          {RHYTHM.map((r) => (
            <div key={r.time} className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: r.left }}>
              <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[14px] bg-gradient-to-br from-lavender to-pink text-[13px]">{r.emoji}</div>
              <span className="mt-[3px] text-[9px] font-extrabold text-muted">{r.time}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 이번 주 식습관 변화 */}
      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mx-4 mt-3.5 rounded-card bg-white px-5 py-[18px] shadow-card">
        <span className="text-[15px] font-black text-ink">📈 이번 주 식습관 변화</span>
        <div className="mt-3.5 flex flex-col gap-[13px]">
          {HABITS.map((h) => (
            <div key={h.label}>
              <div className="mb-1.5 flex justify-between">
                <span className="text-xs font-extrabold text-ink">{h.label}</span>
                <span className="text-[11.5px] font-black" style={{ color: h.color }}>{h.value}</span>
              </div>
              <div className="h-[7px] overflow-hidden rounded-full bg-[#F2EBF7]">
                <motion.div className="h-full rounded-full" style={{ background: h.bar }} initial={{ width: 0 }} animate={{ width: h.pct + '%' }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 오늘 먹은 것들 */}
      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mx-4 mt-3.5 rounded-card bg-white px-5 py-[18px] shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-black text-ink">🍽️ 오늘 먹은 것들</span>
          <span className="text-[10.5px] font-bold text-soft">기록만 · 분석은 리포트에서</span>
        </div>
        {items.length === 0 ? (
          <div className="px-2.5 pb-1.5 pt-[22px] text-center">
            <span className="text-[26px]">🍽️</span>
            <p className="mt-2 text-xs font-bold leading-relaxed text-muted">오늘 기록된 식사가 아직 없어요<br />채팅이나 + 버튼으로 편하게 남겨봐!</p>
          </div>
        ) : (
          <div className="mt-[13px] flex flex-col gap-2.5">
            {items.map((f) => (
              <div key={f.i} className="rounded-[18px] bg-surface-2 px-[14px] py-[13px]">
                <div className="flex items-center gap-[11px]">
                  <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[18px] bg-white text-[15px]">{f.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-black text-ink">{f.name}</div>
                    <div className="mt-px truncate text-[10px] font-bold text-soft">{f.meal} · {f.time} · {f.kcal}</div>
                  </div>
                  <span className="flex-none whitespace-nowrap rounded-full px-[9px] py-[3px] text-[9.5px] font-extrabold" style={{ color: f.tagColor, background: f.tagBg }}>{f.tag}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* 영양 밸런스 */}
      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mx-4 mt-3.5 rounded-card bg-white px-5 py-[18px] shadow-card">
        <span className="text-[15px] font-black text-ink">🥗 오늘의 영양 밸런스</span>
        <div className="mt-3.5 flex gap-2.5">
          {BALANCE.map((b) => (
            <div key={b.label} className="flex-1 rounded-[18px] px-1.5 py-3 text-center" style={{ background: b.bg }}>
              <div className="text-[15px] font-black" style={{ color: b.color }}>{b.pct}</div>
              <div className="mt-[3px] text-[10px] font-extrabold text-muted">{b.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

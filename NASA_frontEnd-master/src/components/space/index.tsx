import { AnimatePresence, motion } from 'framer-motion';
import { useFuel } from '../../hooks/useFuel';
import { PLANETS } from '../../mocks/planets';
import tammyHappy from '../../assets/px-happy.png';

/** 홈 상단 상시 노출 미니 우주 — 연료에 따라 우주선이 실시간 이동 */
export function SpaceStrip({ onClick }: { onClick?: () => void }) {
  const { fuel, targetIdx, boosting } = useFuel();
  const target = PLANETS[targetIdx];
  return (
    <motion.button
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="relative mx-4 mt-3.5 block w-auto overflow-hidden rounded-card bg-gradient-to-br from-space-deep to-space-light p-4 text-left shadow-[0_12px_30px_rgba(90,70,130,.35)]"
    >
      <Stars />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-[#C4B2DE]">{target.name}까지</span>
          <span className="text-[15px] font-black text-white">{fuel}%</span>
        </div>
        <span className="text-[10.5px] font-extrabold text-[#9C88BE]">다음 행성까지 {100 - fuel}% ›</span>
      </div>
      <div className="relative mt-2 h-[34px]">
        <div className="absolute inset-x-[4%] top-1/2 h-[5px] -translate-y-1/2 rounded-[3px] bg-white/15" />
        <motion.div
          className="absolute left-[4%] top-1/2 h-[5px] -translate-y-1/2 rounded-[3px] bg-gradient-to-r from-lavender to-pink shadow-[0_0_10px_rgba(201,182,255,.6)]"
          animate={{ width: fuel * 0.78 + '%' }}
          transition={{ type: 'spring', stiffness: 60, damping: 15 }}
        />
        <motion.span
          className="absolute top-1/2 z-[2] -translate-y-[58%] text-[22px] drop-shadow-[0_3px_6px_rgba(0,0,0,.4)]"
          animate={{ left: 4 + fuel * 0.78 + '%', y: boosting ? [0, -12, 0, -6, 0] : 0 }}
          transition={{ left: { type: 'spring', stiffness: 60, damping: 15 }, y: { duration: 0.9 } }}
        >
          🚀
        </motion.span>
        <motion.span animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute right-0 top-1/2 -translate-y-[52%] text-2xl">
          {target.emoji}
        </motion.span>
      </div>
    </motion.button>
  );
}

/** 행동 보상 토스트 — addFuel 호출 시 자동 표시 */
export function RewardToast() {
  const { reward } = useFuel();
  return (
    <AnimatePresence>
      {reward && (
        <motion.div
          initial={{ opacity: 0, y: -18, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          className="absolute left-1/2 top-[62px] z-[45] flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-full bg-space-deep/95 py-2 pl-2.5 pr-4 shadow-[0_14px_34px_rgba(30,20,50,.45)] backdrop-blur-lg"
        >
          <motion.img src={tammyHappy} alt="" className="pixelated h-[30px] w-[30px] object-contain" animate={{ y: [0, -8, 0] }} transition={{ duration: 0.6 }} />
          <div>
            <div className="text-[11.5px] font-black text-[#FFD9EA]">+{reward.amount} 연료 {reward.emoji}</div>
            <div className="mt-px text-[10.5px] font-bold text-[#C4B2DE]">{reward.text}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** 행성 도착 축하 연출 */
export function ArrivalOverlay() {
  const { arrivedIdx, dismissArrival } = useFuel();
  const planet = arrivedIdx != null ? PLANETS[arrivedIdx] : null;
  const colors = ['#FFAFCF', '#C9B6FF', '#FFE8A5', '#A8DFC0', '#D7F0FF'];
  return (
    <AnimatePresence>
      {planet && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#2C2344] via-space to-[#7B639C]"
        >
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute top-0 rounded-sm"
              style={{ left: (4 + (i * 37) % 92) + '%', width: i % 3 === 0 ? 10 : 7, height: i % 3 === 0 ? 10 : 12, background: colors[i % colors.length] }}
              animate={{ y: [0, 360], rotate: [0, 340], opacity: [1, 0] }}
              transition={{ duration: 2 + (i % 5) * 0.35, delay: i * 0.13, repeat: Infinity, ease: 'linear' }}
            />
          ))}
          <motion.div
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 120, damping: 12 }}
            className="flex h-[150px] w-[150px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_38%_32%,rgba(255,255,255,.22),rgba(255,255,255,.04))] text-[84px] shadow-[0_0_60px_20px_rgba(201,182,255,.45)]"
          >
            {planet.emoji}
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6 text-[13px] font-extrabold text-[#C4B2DE]">새로운 행성 도착!</motion.p>
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="mt-1.5 text-3xl font-black tracking-tight text-white">{planet.name}</motion.h2>
          <motion.img src={tammyHappy} alt="TAMMY" className="pixelated mt-5 w-[110px] drop-shadow-[0_16px_20px_rgba(10,5,25,.5)]" animate={{ y: [0, -14, 0, -7, 0] }} transition={{ delay: 0.9, duration: 1.4, repeat: Infinity }} />
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mt-3 text-sm font-extrabold text-[#FFD9EA]">"축하해! 우리가 해냈어! 🎉"</motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={dismissArrival}
            className="mt-6 rounded-[22px] bg-white px-8 py-3.5 text-sm font-black text-ink shadow-[0_12px_30px_rgba(10,5,25,.4)]"
          >
            계속 여행하기 🚀
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Stars() {
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        backgroundImage:
          'radial-gradient(circle 1.5px at 18% 30%, rgba(255,255,255,.8) 0, transparent 100%), radial-gradient(circle 1px at 62% 18%, rgba(255,255,255,.6) 0, transparent 100%), radial-gradient(circle 1.5px at 84% 58%, rgba(255,255,255,.7) 0, transparent 100%), radial-gradient(circle 1px at 38% 74%, rgba(255,255,255,.5) 0, transparent 100%)',
      }}
      animate={{ backgroundPosition: ['0px 0px', '-200px 40px'] }}
      transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
    />
  );
}

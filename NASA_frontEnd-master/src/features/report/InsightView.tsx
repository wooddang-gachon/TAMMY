import { motion } from 'framer-motion';
import tammyHappy from '../../assets/px-happy.png';
import type { Insight } from './types';

/**
 * 생성형 AI 코멘트 출력 전용 — 표시만 하고 생성은 하지 않는다.
 * ⚠️ GET /dashboard/summary(Swagger)에는 AI 인사이트 텍스트 필드가 없어 insight는 항상 빈 배열로 들어온다.
 * 값이 오면 그대로 렌더링하고, 없으면 백엔드 협의가 필요하다는 상태를 있는 그대로 보여준다.
 */
export function InsightView({ insight }: { insight: Insight[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="mx-4 mt-3.5 rounded-[28px] bg-gradient-to-br from-space to-space-light p-5 shadow-[0_14px_34px_rgba(110,90,150,.4)]">
      <div className="flex items-center gap-2.5">
        <motion.img src={tammyHappy} alt="" className="pixelated h-[46px] w-[46px] object-contain" animate={{ y: [0, -6, 0] }} transition={{ duration: 2.8, repeat: Infinity }} />
        <h2 className="text-[15px] font-black text-white">타미 건강 분석</h2>
      </div>
      <div className="mt-3.5 flex flex-col gap-2">
        {insight.length > 0 ? (
          insight.map((f, i) => (
            <p key={i} className="flex items-start gap-2 rounded-2xl bg-white/10 p-3 text-xs font-bold leading-relaxed text-[#E4D9F5]">
              <span className="flex-none">{f.emoji}</span>{f.text}
            </p>
          ))
        ) : (
          <p className="rounded-2xl bg-white/10 p-3 text-xs font-bold leading-relaxed text-[#E4D9F5]/70">
            AI 인사이트는 백엔드 연동 후 제공될 예정이에요. (백엔드 협의 필요)
          </p>
        )}
      </div>
    </motion.div>
  );
}

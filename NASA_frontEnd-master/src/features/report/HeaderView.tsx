import { motion } from 'framer-motion';
import tammyHero from '../../assets/px-hero.png';

/**
 * 리포트 제목 + 기간.
 * title은 Swagger 응답에 없는 화면 고정 문구(다른 섹션 타이틀과 동일한 방식)이고,
 * period만 GET /dashboard/summary의 calorieTrends 날짜 범위로부터 계산한 실측값이다.
 */
export function HeaderView({ title, period }: { title: string; period: string | null }) {
  return (
    <div className="mx-4 mt-3.5 rounded-[28px] bg-gradient-to-br from-[#EFE6FB] to-[#FBEFF2] p-5 shadow-[0_12px_30px_rgba(160,130,190,.2)]">
      <div className="flex items-center gap-3">
        <motion.img src={tammyHero} alt="" className="pixelated h-12 w-12 object-contain" animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }} />
        <div>
          <h2 className="text-base font-black text-ink">{title}</h2>
          <p className="mt-0.5 text-[11.5px] font-bold text-lavender-deep">
            {period ? period + ' · ' : ''}주간 칼로리 추이와 3개월 영양 밸런스를 보여줘</p>
        </div>
      </div>
    </div>
  );
}

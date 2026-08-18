import { motion } from 'framer-motion';
import { Card, SectionTitle } from '../../components/ui';
import type { LocalReportData } from '../../api/reports';

/** 이번 달 감정 분포 + 최근 감정일기 — emotions api(로컬)에서 실측한 값만 표시한다 */
export function EmotionReportView({ emotion }: { emotion: LocalReportData['emotion'] }) {
  return (
    <Card className="mx-4 mt-3.5" delay={0.16}>
      <SectionTitle right={<span className="text-[11.5px] font-extrabold text-muted">이번 달 {emotion.totalEntries}건</span>}>💭 감정 분포</SectionTitle>
      {emotion.totalEntries > 0 ? (
        <div className="mt-3.5 flex flex-col gap-2">
          {emotion.distribution.map((d) => (
            <div key={d.mood} className="flex items-center gap-2.5">
              <span className="w-[92px] flex-none text-xs font-extrabold text-[#8A76A0]">{d.mood}</span>
              <div className="h-[9px] flex-1 overflow-hidden rounded-full bg-[#F2EBF7]">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-lavender to-pink" initial={{ width: 0 }} animate={{ width: d.pct + '%' }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
              </div>
              <span className="w-8 flex-none text-right text-[11.5px] font-black text-ink">{d.pct}%</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3.5 text-xs font-bold text-muted">이번 달 기록된 감정이 없어요.</p>
      )}

      {emotion.recentDiaries.length > 0 && (
        <>
          <h3 className="mt-4 text-[13px] font-black text-ink">최근 감정일기</h3>
          <div className="mt-2.5 flex flex-col gap-2">
            {emotion.recentDiaries.map((d) => (
              <div key={d.id} className="rounded-widget bg-surface-2 p-3">
                <div className="flex justify-between text-[11px] font-extrabold text-muted"><span>{d.mood}</span><span>{d.date}</span></div>
                <p className="mt-1 text-xs font-bold text-ink">{d.content}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

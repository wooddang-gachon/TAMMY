import { motion } from 'framer-motion';
import { Card, SectionTitle } from '../../components/ui';
import type { LocalReportData } from '../../api/reports';

/** 이번 달 수분 총량/평균/날짜별 변화 — water api(로컬)에서 실측한 값만 표시한다 */
export function WaterReportView({ water }: { water: LocalReportData['water'] }) {
  const max = Math.max(1, ...water.byDate.map((d) => d.amount));
  return (
    <Card className="mx-4 mt-3.5" delay={0.19}>
      <SectionTitle right={<span className="text-[11.5px] font-extrabold text-muted">일 평균 {water.averageMlPerDay.toLocaleString()}ml</span>}>💧 수분 섭취</SectionTitle>
      <p className="mt-1 text-xl font-black text-[#7EC8E3]">{water.totalMl.toLocaleString()} <span className="text-xs font-extrabold text-muted">ml · 이번 달 총합</span></p>
      {water.byDate.length > 0 ? (
        <div className="mt-3.5 flex items-end gap-1.5" style={{ height: 64 }}>
          {water.byDate.map((d) => (
            <motion.div
              key={d.date}
              className="flex-1 rounded-t-md bg-gradient-to-t from-[#7EC8E3] to-[#A8DFC0]"
              style={{ minWidth: 4 }}
              initial={{ height: 0 }}
              animate={{ height: Math.max(4, (d.amount / max) * 64) }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              title={d.date + ' · ' + d.amount + 'ml'}
            />
          ))}
        </div>
      ) : (
        <p className="mt-3.5 text-xs font-bold text-muted">이번 달 기록된 수분 섭취가 없어요.</p>
      )}
    </Card>
  );
}

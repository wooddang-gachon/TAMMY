import { Card, SectionTitle } from '../../components/ui';
import type { LocalReportData } from '../../api/reports';

/** 이번 달 생활습관 활동 — activities api(로컬)에서 실측한 값만 표시한다 */
export function ActivityReportView({ activity }: { activity: LocalReportData['activity'] }) {
  return (
    <Card className="mx-4 mt-3.5" delay={0.22}>
      <SectionTitle right={<span className="text-[11.5px] font-extrabold text-muted">총 {activity.totalMinutes}분</span>}>🌙 생활습관 활동</SectionTitle>
      {activity.byType.length > 0 ? (
        <div className="mt-3.5 flex flex-col gap-2">
          {activity.byType.map((t) => (
            <div key={t.type} className="flex items-center justify-between rounded-widget bg-surface-2 p-3">
              <span className="text-xs font-extrabold text-[#8A76A0]">{t.type}</span>
              <span className="text-[12.5px] font-black text-ink">{t.minutes}분</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3.5 text-xs font-bold text-muted">이번 달 기록된 생활습관이 없어요.</p>
      )}
    </Card>
  );
}

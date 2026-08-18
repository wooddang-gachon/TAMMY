import { Card, SectionTitle } from '../../components/ui';
import type { LocalReportData } from '../../api/reports';

/** 최근 회고 — reflections api(로컬)에서 실측한 값만 표시한다 */
export function ReflectionReportView({ reflection }: { reflection: LocalReportData['reflection'] }) {
  return (
    <Card className="mx-4 mt-3.5" delay={0.25}>
      <SectionTitle>📝 최근 회고</SectionTitle>
      {reflection.recent.length > 0 ? (
        <div className="mt-3.5 flex flex-col gap-2">
          {reflection.recent.map((r) => (
            <div key={r.id} className="rounded-widget bg-surface-2 p-3">
              <div className="flex justify-between text-[11px] font-extrabold text-muted">
                <span>{r.period === 'daily' ? '하루 회고' : '주간 회고'}</span>
                <span>{r.date}</span>
              </div>
              <p className="mt-1 text-xs font-bold text-ink">{r.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3.5 text-xs font-bold text-muted">아직 기록된 회고가 없어요.</p>
      )}
    </Card>
  );
}

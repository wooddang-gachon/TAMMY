import type { ReportSummary } from './types';

/**
 * 핵심 지표 — GET /dashboard/summary 응답으로부터 실측 가능한 값만 표시한다.
 * "건강 점수" / "목표 달성률"은 Swagger 응답에 대응 필드가 없어 값을 지어내지 않고
 * 백엔드 협의가 필요하다는 것을 화면에 그대로 노출한다.
 */
export function SummaryView({ summary }: { summary: ReportSummary }) {
  return (
    <div className="mx-4 mt-3.5 grid grid-cols-2 gap-2.5">
      <Stat label="총 기록 수" value={summary.totalRecords + '건'} color="text-lavender-deep" />
      <Stat label="일 평균 섭취" value={summary.averageCalories.toLocaleString() + ' kcal'} color="text-pink-deep" />
      <Stat label="주간 운동 완료" value={summary.weeklyWorkoutCompletedDays + ' / 7일'} color="text-ink" />
      <Stat label="목표 달성률" value="백엔드 협의 필요" color="text-muted" muted />
    </div>
  );
}

function Stat({ label, value, color, muted }: { label: string; value: string; color: string; muted?: boolean }) {
  return (
    <div className={'rounded-widget bg-white p-3.5 text-center shadow-card ' + (muted ? 'opacity-70' : '')}>
      <p className="text-[11px] font-extrabold text-muted">{label}</p>
      <p className={'mt-1 font-black ' + color + ' ' + (muted ? 'text-[12.5px]' : 'text-xl')}>{value}</p>
    </div>
  );
}

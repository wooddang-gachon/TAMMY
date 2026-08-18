import { BackButton } from './Food';
import {
  HeaderView, SummaryView, ChartView, InsightView, RecommendationView, useReportService,
  EmotionReportView, WaterReportView, ActivityReportView, ReflectionReportView, useLocalReportData,
} from '../features/report';
import { PhotoGallery } from '../components/PhotoGallery';

export function ReportScreen({ onBack }: { onBack: () => void }) {
  const { data, loading, error } = useReportService();
  const { data: local } = useLocalReportData();

  return (
    <div className="pb-[110px] pt-1.5">
      <header className="flex items-center gap-2.5 px-5 pt-1">
        <BackButton onClick={onBack} />
        <h1 className="text-lg font-black text-ink">여행 이야기</h1>
      </header>
      {loading && <p className="m-4 text-xs text-muted">리포트를 불러오는 중...</p>}
      {error && <p className="m-4 text-xs text-pink-deep">{error}</p>}
      {data && (
        <>
          <HeaderView title="AI 건강 리포트" period={data.summary.period} />
          <SummaryView summary={data.summary} />
          <ChartView chart={data.chart} />
          {local && (
            <>
              <EmotionReportView emotion={local.emotion} />
              <WaterReportView water={local.water} />
              <ActivityReportView activity={local.activity} />
              <ReflectionReportView reflection={local.reflection} />
            </>
          )}
          <InsightView insight={data.insight} />
          <RecommendationView recommendation={data.recommendation} />
          <PhotoGallery />
        </>
      )}
    </div>
  );
}

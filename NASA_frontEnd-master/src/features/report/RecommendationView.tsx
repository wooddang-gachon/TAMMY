import { Card, SectionTitle } from '../../components/ui';
import type { Recommendation } from './types';

/**
 * AI 추천 행동 출력.
 * ⚠️ GET /dashboard/summary(Swagger)에는 추천 행동 필드가 없어 recommendation은 항상 빈 배열로 들어온다.
 * 값이 오면 그대로 렌더링하고, 없으면 백엔드 협의가 필요하다는 상태를 있는 그대로 보여준다.
 */
export function RecommendationView({ recommendation }: { recommendation: Recommendation[] }) {
  return (
    <Card className="mx-4 mt-3.5" delay={0.24}>
      <SectionTitle>📋 다음 추천</SectionTitle>
      <div className="mt-3 flex flex-col gap-2">
        {recommendation.length > 0 ? (
          recommendation.map((r) => (
            <div key={r.id} className="flex items-center gap-2.5 rounded-2xl bg-surface-2 p-3">
              <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-xl bg-gradient-to-br from-lavender to-pink">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              </span>
              <span className="text-[12.5px] font-extrabold text-ink">{r.text}</span>
            </div>
          ))
        ) : (
          <div className="rounded-2xl bg-surface-2 p-3 text-[12.5px] font-extrabold text-muted">
            추천 항목은 백엔드 연동 후 제공될 예정이에요. (백엔드 협의 필요)
          </div>
        )}
      </div>
    </Card>
  );
}

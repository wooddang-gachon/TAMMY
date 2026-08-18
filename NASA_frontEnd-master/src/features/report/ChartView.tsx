import { motion } from 'framer-motion';
import { Card, SectionTitle } from '../../components/ui';
import type { ChartData } from './types';
import type { CalorieTrendItem, NutritionBalanceInfo } from '../../types';

const avg = (a: number[]) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0);

const NUTRITION_META: { key: keyof NutritionBalanceInfo; label: string; color: string }[] = [
  { key: 'carbohydratePercent', label: '탄수화물', color: '#FFD98E' },
  { key: 'proteinPercent', label: '단백질', color: '#F0A8C8' },
  { key: 'fatPercent', label: '지방', color: '#A8DFC0' },
  { key: 'vitaminPercent', label: '비타민', color: '#9FD3F0' },
  { key: 'mineralPercent', label: '미네랄', color: '#D9C8F0' },
];

/**
 * GET /dashboard/summary 가 실제로 제공하는 필드(calorieTrends, nutritionBalance,
 * weeklyWorkoutCompletedDays)만 그린다. topFoods / 일별 운동 분(分) / 소모 칼로리 / 근력 비율은
 * Swagger 응답에 없으므로 표시하지 않는다 — 필요하다면 [4] 백엔드 요청 목록 참고.
 *
 * chart(ChartData)만 props로 받으므로, 이 SVG 구현을 다른 차트 라이브러리로 교체해도
 * ChartView의 외부 계약(props)은 그대로 유지된다.
 */
export function ChartView({ chart }: { chart: ChartData }) {
  const kcalValues = chart.calorieTrends.map((t) => t.caloriesKcal);

  return (
    <>
      <Card className="mx-4 mt-3.5" delay={0.06}>
        <SectionTitle right={<span className="text-[11.5px] font-extrabold text-muted">평균 {avg(kcalValues).toLocaleString()} kcal/일</span>}>🍽 칼로리 & 영양 분석</SectionTitle>
        {chart.calorieTrends.length > 0 ? (
          <>
            <LineChart data={chart.calorieTrends} className="mt-3.5" />
            <DateAxis dates={chart.calorieTrends.map((t) => t.date)} />
          </>
        ) : (
          <p className="mt-3.5 text-xs font-bold text-muted">표시할 칼로리 기록이 없어요.</p>
        )}
        <div className="mt-4 flex items-center gap-4">
          <Donut nutritionBalance={chart.nutritionBalance} />
          <div className="flex flex-1 flex-col gap-2">
            {NUTRITION_META.map((m) => (
              <div key={m.key} className="flex items-center gap-2">
                <span className="h-[11px] w-[11px] flex-none rounded-md" style={{ background: m.color }} />
                <span className="flex-1 text-xs font-extrabold text-[#8A76A0]">{m.label}</span>
                <span className="text-[12.5px] font-black text-ink">{chart.nutritionBalance[m.key]}%</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="mx-4 mt-3.5" delay={0.12}>
        <SectionTitle>🏋 주간 운동 완료</SectionTitle>
        <p className="mt-3 text-[12.5px] font-extrabold text-[#8A76A0]">이번 주 {chart.weeklyWorkoutCompletedDays}일 / 7일 완료</p>
        <div className="mt-2.5 flex gap-1.5">
          {Array.from({ length: 7 }, (_, i) => (
            <motion.div
              key={i}
              className={'h-3 flex-1 rounded-full ' + (i < chart.weeklyWorkoutCompletedDays ? 'bg-gradient-to-r from-lavender to-pink' : 'bg-[#F2EBF7]')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            />
          ))}
        </div>
      </Card>
    </>
  );
}

const DateAxis = ({ dates }: { dates: string[] }) => (
  <div className="mt-1.5 flex justify-between px-1.5 text-[10px] font-extrabold text-[#C3B3D2]">
    <span>{dates[0]}</span>
    {dates.length > 1 && <span>{dates[dates.length - 1]}</span>}
  </div>
);

function LineChart({ data, className }: { data: CalorieTrendItem[]; className?: string }) {
  const W = 300, H = 80;
  const values = data.map((d) => d.caloriesKcal);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = data.map((d, i) => [(data.length > 1 ? i / (data.length - 1) : 0) * W, H - ((d.caloriesKcal - min) / range) * H] as const);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return (
    <svg viewBox={'0 0 ' + W + ' ' + H} className={'block h-20 w-full ' + (className ?? '')}>
      <defs>
        <linearGradient id="kcalFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9B6FF" stopOpacity=".45" /><stop offset="100%" stopColor="#C9B6FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[20, 40, 60].map((y) => <line key={y} x1="0" y1={y} x2={W} y2={y} stroke="#F2EBF7" />)}
      <path d={line + ' L' + W + ' ' + H + ' L0 ' + H + ' Z'} fill="url(#kcalFill)" />
      <motion.path d={line} fill="none" stroke="#A48BD8" strokeWidth="2.4" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }} />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill="#FFF" stroke="#A48BD8" strokeWidth="2.5" />
    </svg>
  );
}

function Donut({ nutritionBalance }: { nutritionBalance: NutritionBalanceInfo }) {
  const R = 34, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <svg viewBox="0 0 90 90" className="h-24 w-24 flex-none">
      {NUTRITION_META.map((m) => {
        const pct = nutritionBalance[m.key];
        const el = (
          <motion.circle
            key={m.key} cx="45" cy="45" r={R} fill="none" stroke={m.color} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={(C * pct) / 100 - 3 + ' ' + (C - (C * pct) / 100 + 3)}
            strokeDashoffset={(-acc * C) / 100 + C / 4}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
          />
        );
        acc += pct;
        return el;
      })}
      <text x="45" y="43" textAnchor="middle" className="fill-muted text-[10px] font-extrabold">영양</text>
      <text x="45" y="56" textAnchor="middle" className="fill-ink text-[11px] font-black">비율</text>
    </svg>
  );
}

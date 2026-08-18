import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PLANETS } from '../features/travel/planets';
import { api } from '../api/client';
import type { TravelResultDetailInfo } from '../types';
import { BackButton } from './Food';

type Viz =
  | { type: 'bar'; unit: string; bars: [string, number, string][] }
  | { type: 'donut'; segs: [string, number, string][] }
  | { type: 'heat'; peak: string; cells: number[] };

interface PlanetReportData {
  emoji: string;
  period: string;
  count: string;
  summary: [string, string][];
  viz: Viz;
  comment: string;
  detailTitle: string;
  detailTags: string[];
  highlights?: [string, string][];
  suggestions: string[];
}

/** TAMMY v4 buildPlanetReport() 6슬롯 스키마 — 그대로 이식 */
const REPORTS: Record<string, PlanetReportData> = {
  식사별: {
    emoji: '🍽', period: '2026.08.04 ~ 08.07 · 3일간', count: '8끼',
    summary: [['평균', '612kcal'], ['총 끼니', '8끼'], ['규칙적으로 챙긴 날', '2/3']],
    viz: { type: 'bar', unit: 'g', bars: [['탄수화물', 68, '#DBA83C'], ['단백질', 28, '#F0A8C8'], ['지방', 19, '#A8DFC0']] },
    comment: '이번 여행은 3일 동안 규칙적으로 챙긴 날이 이어졌네. 특히 저녁 시간대 식사가 안정적이었어.',
    detailTitle: '자주 먹은 음식', detailTags: ['#연어샐러드', '#닭가슴살', '#현미밥'],
    suggestions: ['아침을 거르는 날이 아직 있어요. 과일 한 조각부터 어때요?', '저녁 시간대는 안정적이에요 — 지금처럼 이어가요'],
  },
  수분별: {
    emoji: '💧', period: '2026.08.01 ~ 08.05 · 5일간', count: '20회',
    summary: [['일평균', '1,000ml'], ['총 기록', '20회'], ['목표 달성한 날', '3/5']],
    viz: { type: 'heat', peak: '오후 2시', cells: [2, 3, 5, 8, 6, 9, 7, 4, 3, 6, 8, 5, 3, 2, 4, 6, 7, 5, 3, 2, 1, 2, 3, 2] },
    comment: '물 마시는 습관이 자리를 잡았어! 오후엔 잘 챙기는데 아침엔 조금 뜸하네.',
    detailTitle: '자주 마신 시간대', detailTags: ['#오후2시', '#점심직후', '#저녁6시'],
    suggestions: ['일어나자마자 한 잔부터 시작해볼까?', '오후 패턴은 이미 좋아요 — 그대로 유지해봐요'],
  },
  감정별: {
    emoji: '💗', period: '2026.07.28 ~ 08.03 · 7일간', count: '20회',
    summary: [['주요 감정', 'STRESSED'], ['감정일기', '5편'], ['감정 활동', '20회']],
    viz: { type: 'donut', segs: [['😊', 6, '#F0A8C8'], ['😟', 3, '#DBA83C'], ['😫', 8, '#A48BD8'], ['😐', 3, '#B7A6C6'], ['😢', 0, '#7EC8E3']] },
    comment: '이번 여행에선 프로젝트 마감 얘기가 자주 나왔어. 후반엔 산책하면 안정된다는 얘기가 나온 게 인상적이야.',
    detailTitle: '감정일기 하이라이트',
    highlights: [['08-05 😫', '프로젝트 마감이 다가와서 부담이 컸다...'], ['08-07 😊', '며칠 잘 못 자다가 오늘 푹 잤다. 몸이 가벼워졌다.']],
    detailTags: ['#프로젝트', '#산책', '#마감', '#부담', '#안정'],
    suggestions: ['감정일기 3회 이상 유지 중이에요', '산책이 도움 되고 있어요 — 생활습관별과 함께 챙겨봐요'],
  },
  생활습관별: {
    emoji: '🏃', period: '2026.08.01 ~ 08.06 · 6일간', count: '10회 · 210분',
    summary: [['연속 기록일', '6일'], ['총 활동', '10회'], ['총 활동 시간', '210분']],
    viz: { type: 'bar', unit: '회', bars: [['운동', 6, '#A8DFC0'], ['걷기', 4, '#7EC8E3'], ['스트레칭', 0, '#C9B6FF']] },
    comment: '격한 운동보다 꾸준함이 더 값져! 이번엔 하루도 안 빠졌네.',
    detailTitle: '이번 여행의 활동', detailTags: ['#6일연속', '#운동6회', '#걷기4회'],
    suggestions: ['다음 여행엔 스트레칭도 한 번 넣어볼까?', '연속 기록이 이어지고 있어요 — 오늘도 가볍게!'],
  },
  회고별: {
    emoji: '🌙', period: '2026.07.01 ~ 07.31 · 31일간', count: '도착 17회',
    summary: [['웰니스 스코어', '78 (+6)'], ['총 도착', '17회'], ['기록한 날', '28/31']],
    viz: { type: 'bar', unit: '회', bars: [['식사', 4, '#DBA83C'], ['수분', 6, '#7EC8E3'], ['감정', 4, '#F0A8C8'], ['습관', 3, '#A8DFC0']] },
    comment: '지난 한 달은 감정 기복이 있었지만 식사와 운동이 안정적으로 자리 잡은 시기였어요.',
    detailTitle: '이번 달 키워드', detailTags: ['#수분습관', '#운동꾸준함', '#감정기록'],
    suggestions: ['아침 식사 규칙성을 다음 목표로 잡아볼까요?', '수분·운동 습관은 잘 자리 잡았어요 — 유지해봐요'],
  },
};

function BarViz({ viz }: { viz: Extract<Viz, { type: 'bar' }> }) {
  const max = Math.max(1, ...viz.bars.map((b) => b[1]));
  return (
    <div className="flex h-[90px] items-end gap-3.5">
      {viz.bars.map(([label, value, color]) => (
        <div key={label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-[10.5px] font-black text-ink">{value}{viz.unit}</span>
          <motion.div
            className="w-full rounded-t-[8px]"
            style={{ background: color }}
            initial={{ height: 0 }}
            animate={{ height: Math.max(4, (value / max) * 62) }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
          <span className="text-[10px] font-extrabold text-muted">{label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutViz({ viz }: { viz: Extract<Viz, { type: 'donut' }> }) {
  const total = Math.max(1, viz.segs.reduce((s, x) => s + x[1], 0));
  let acc = 0;
  return (
    <div className="flex items-center gap-[18px]">
      <svg viewBox="0 0 42 42" className="h-[108px] w-[108px] flex-none -rotate-90">
        <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#F2EBF7" strokeWidth="6" />
        {viz.segs.map(([emoji, count, color]) => {
          const pct = (count / total) * 100;
          const offset = -acc;
          acc += pct;
          return <circle key={emoji} cx="21" cy="21" r="15.9155" fill="none" stroke={color} strokeWidth="6" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={offset} />;
        })}
      </svg>
      <div className="flex flex-1 flex-col gap-[7px]">
        {viz.segs.map(([emoji, count, color]) => (
          <div key={emoji} className="flex items-center gap-2">
            <span className="h-[11px] w-[11px] flex-none rounded-[6px]" style={{ background: color }} />
            <span className="text-[15px]">{emoji}</span>
            <span className="flex-1 text-[11.5px] font-black text-ink">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeatViz({ viz }: { viz: Extract<Viz, { type: 'heat' }> }) {
  return (
    <div>
      <div className="flex h-[46px] items-end gap-[3px]">
        {viz.cells.map((v, i) => (
          <div key={i} className="flex-1 rounded-[2px]" style={{ height: Math.max(3, v * 4), background: '#7EC8E3', opacity: 0.4 + v / 12 }} />
        ))}
      </div>
      <p className="mt-2 text-[10.5px] font-extrabold text-muted">가장 많이 마신 시간: {viz.peak}</p>
    </div>
  );
}

/** Planet Report — TAMMY v4 6-슬롯 행성 리포트(헤더·요약·시각화·코멘트·특화블록·제안) */
export function PlanetReportScreen({ planetId, travelResultId, onBack }: { planetId: string; travelResultId?: string | number; onBack: () => void }) {
  const planet = PLANETS.find((p) => p.id === planetId) ?? PLANETS[0];
  const pr = REPORTS[planet.name] ?? REPORTS['식사별'];
  const [real, setReal] = useState<TravelResultDetailInfo | null>(null);

  // 실제 POST /planet-travel/start에서 나온 travelResultId가 있을 때만 GET /travel-results/{id}를 시도한다.
  // 요약/시각화/태그 슬롯은 백엔드가 주지 않는 데이터라 그대로 두고, title/comment/suggestions만 실제 값으로 덮는다.
  // 실패해도(DB/네트워크 문제) 기존 정적 REPORTS로 조용히 폴백한다 — 화면이 끊기지 않는다.
  useEffect(() => {
    if (!travelResultId) { setReal(null); return; }
    let cancelled = false;
    api.getTravelResult(travelResultId).then((data) => { if (!cancelled) setReal(data); }).catch(() => {});
    return () => { cancelled = true; };
  }, [travelResultId]);

  return (
    <div className="flex min-h-full flex-col pb-[110px]">
      <div className="flex flex-none items-center gap-2.5 px-5 pt-2">
        <BackButton onClick={onBack} />
        <h1 className="text-lg font-black text-ink">{pr.emoji} {planet.name} 리포트</h1>
      </div>

      <div className="mx-4 mt-3.5 flex-none rounded-[26px] bg-[linear-gradient(160deg,#EFE6FB,#FBEFF2)] px-5 py-[18px] shadow-[0_10px_28px_rgba(160,130,190,.16)]">
        <div className="text-[13px] font-black text-ink">{real?.title ?? `${planet.name} 여행, 잘 다녀왔어!`}</div>
        <div className="mt-[3px] text-[11.5px] font-bold text-lavender-deep">{pr.period} · {pr.count}</div>
      </div>

      <div className="mx-4 mt-3 flex flex-none gap-2 overflow-x-auto">
        {pr.summary.map(([label, value]) => (
          <div key={label} className="flex-none rounded-2xl bg-white px-[15px] py-2.5 text-center shadow-[0_8px_20px_rgba(160,130,190,.12)]">
            <div className="whitespace-nowrap text-[10px] font-extrabold text-muted">{label}</div>
            <div className="mt-0.5 whitespace-nowrap text-sm font-black text-ink">{value}</div>
          </div>
        ))}
      </div>

      <div className="mx-4 mt-3 flex-none rounded-card bg-white px-5 py-[18px] shadow-card">
        {pr.viz.type === 'bar' && <BarViz viz={pr.viz} />}
        {pr.viz.type === 'donut' && <DonutViz viz={pr.viz} />}
        {pr.viz.type === 'heat' && <HeatViz viz={pr.viz} />}
      </div>

      <div className="mx-4 mt-3 flex flex-none gap-2.5 rounded-[20px] bg-surface px-4 py-3.5">
        <span className="text-[15px]">💬</span>
        <span className="whitespace-pre-line text-xs font-bold leading-relaxed text-[#6E5B78]">{real?.summaryContent ?? pr.comment}</span>
      </div>

      <div className="mx-4 mt-3 flex-none rounded-2xl bg-white px-[18px] py-4 shadow-[0_8px_20px_rgba(160,130,190,.1)]">
        <div className="mb-2.5 text-[12.5px] font-black text-ink">{pr.detailTitle}</div>
        {pr.highlights && (
          <div className="mb-2.5 flex flex-col gap-2">
            {pr.highlights.map(([tag, text]) => (
              <div key={tag} className="rounded-[14px] bg-surface-2 px-3 py-2.5">
                <div className="text-[10px] font-black text-lavender-deep">{tag}</div>
                <div className="mt-[3px] text-[11.5px] font-bold leading-relaxed text-ink">"{text}"</div>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {pr.detailTags.map((t) => (
            <span key={t} className="rounded-full bg-[#F3EDFA] px-[11px] py-1 text-[10.5px] font-extrabold text-lavender-deep">{t}</span>
          ))}
        </div>
      </div>

      <div className="mx-4 mt-3 flex flex-none flex-col gap-2">
        {(real?.recommendations ?? pr.suggestions).map((s) => (
          <div key={s} className="flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-3 shadow-[0_6px_16px_rgba(160,130,190,.1)]">
            <span className="flex h-5 w-5 flex-none items-center justify-center rounded-[11px] bg-gradient-to-br from-lavender-deep to-lavender">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            </span>
            <span className="text-xs font-bold leading-relaxed text-ink">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

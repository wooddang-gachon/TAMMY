import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useChat } from '../hooks/useChat';
import { useFuel } from '../hooks/useFuel';
import { useAffinity } from '../hooks/useAffinity';
import { useWater } from '../hooks/useWater';
import { useEmotions } from '../hooks/useEmotions';
import { PLANETS } from '../mocks/planets';
import { MOOD_OPTIONS } from '../api/types';
import { api } from '../api/client';
import tammyHero from '../assets/px-hero.png';

interface Props {
  onOpenChat: () => void;
  onOpenFood: () => void;
  onOpenReport: () => void;
  onOpenDiary: () => void;
  onOpenTravel: () => void;
  onOpenGrowth: () => void;
}

const TAP_LINES = ['오늘도 잘하고 있어 😊', '이야기 들어줄까?', '오늘 리포트 만들어줄까?', '오늘 하루는 어땠어?'];
const SUGGEST_CHIPS = ['오늘 하루를 정리해볼까?', '오늘 기분이 어땠어?', '식사는 잘 했어?', '오늘 감사했던 일이 있어?', '잠깐 이야기할래?'];

type StageCard = { emoji: string; title: string; meta: string } | null;

/** 대화 속 웰니스 의도 감지 → 자동 연료/친밀도 적립 (기존 ChatHub 로직 이식) */
type IntentType = 'WORKOUT' | 'FOOD' | 'WATER' | 'EMOTION';
function detectIntent(text: string): { type: IntentType; exp: number } | null {
  if (/workout|exercise|run|walk|gym|운동|걷기|달리기/i.test(text)) return { type: 'WORKOUT', exp: 30 };
  if (/meal|food|breakfast|lunch|dinner|eat|식사|음식|먹었/i.test(text)) return { type: 'FOOD', exp: 20 };
  if (/water|drink|물|마셨/i.test(text)) return { type: 'WATER', exp: 5 };
  if (/mood|happy|sad|stress|기분|행복|우울|스트레스/i.test(text)) return { type: 'EMOTION', exp: 10 };
  return null;
}

/** Home — TAMMY v4 "Home Chat Hub": 중앙 무대 위 타미 + 단일 말풍선, 히스토리 드로어, FAB */
export function HomeScreen({ onOpenChat, onOpenFood, onOpenReport, onOpenDiary, onOpenTravel, onOpenGrowth }: Props) {
  const { messages, typing, send } = useChat();
  const { fuel, targetIdx, addFuel, addFuelAmount } = useFuel();
  const { affinity, expPct, stage, addAffinity } = useAffinity();
  const { logWater } = useWater();
  const { logMood } = useEmotions();
  const target = PLANETS[targetIdx];

  const [draft, setDraft] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [sparkle, setSparkle] = useState(false);
  const [bubbleOverride, setBubbleOverride] = useState<string | null>(null);
  const [stageCard, setStageCard] = useState<StageCard>(null);
  const [userEcho, setUserEcho] = useState<string | null>(null);
  const [reportJob, setReportJob] = useState<{ pct: number; done: boolean } | null>(null);
  const sparkleTimer = useRef<number>();
  const echoTimer = useRef<number>();

  const lastTammy = [...messages].reverse().find((m) => m.role === 'tammy');
  const bubbleText = bubbleOverride ?? lastTammy?.text ?? '안녕! 오늘 기분은 어때?';

  useEffect(() => {
    if (!reportJob || reportJob.done) return;
    const id = window.setTimeout(() => {
      setReportJob((j) => (j ? { pct: Math.min(100, j.pct + 14), done: j.pct + 14 >= 100 } : j));
    }, 420);
    return () => window.clearTimeout(id);
  }, [reportJob]);

  const tapTammy = () => {
    setSparkle(true);
    window.clearTimeout(sparkleTimer.current);
    sparkleTimer.current = window.setTimeout(() => setSparkle(false), 1600);
    setStageCard(null);
    setBubbleOverride(TAP_LINES[Math.floor(Math.random() * TAP_LINES.length)]);
  };

  const onSend = async (raw = draft) => {
    const text = raw.trim();
    if (!text) return;
    setDraft('');
    setBubbleOverride(null);
    setStageCard(null);
    setUserEcho(text);
    window.clearTimeout(echoTimer.current);
    echoTimer.current = window.setTimeout(() => setUserEcho(null), 3200);

    // 친밀도는 실제 백엔드 chat 응답에 대응 필드가 없어 로컬 추정치를 그대로 쓴다.
    const intent = detectIntent(text);
    if (intent) addAffinity(intent.exp);

    const reply = await send(text);
    if (reply?.gainedFuel != null) {
      // 실제 백엔드가 이번 대화로 지급한 연료를 그대로 반영 (로컬 추정치보다 우선)
      addFuelAmount(reply.gainedFuel, { emoji: '💬', text: '대화로 연료를 얻었어!' });
    } else if (intent) {
      // 서버 연동 실패/모의 모드 등 실제 값이 없을 때만 로컬 추정치로 폴백
      addFuel(intent.type === 'WORKOUT' ? 'WORKOUT_DONE' : 'FOOD_ANALYZED');
    }
  };

  const now = () => {
    const d = new Date();
    const h = d.getHours();
    return (h < 12 ? '오전 ' + (h || 12) : '오후 ' + (h === 12 ? 12 : h - 12)) + ':' + String(d.getMinutes()).padStart(2, '0');
  };

  // 로컬 hook(useWater/useEmotions)은 "지난 기록" 리스트를 화면에 보여주기 위해 계속 쓴다 —
  // 백엔드엔 퀵기록을 다시 읽어오는 GET API가 없어(POST /quick-log만 존재) 로컬 저장이 유일한
  // 조회 경로다. 대신 실제 서버에도 POST /quick-log를 함께 보내 진짜 연동이 되도록 한다.
  // 인증/DB 문제로 서버 호출이 실패해도 로컬 기록·연료 적립은 이미 반영되어 있어 UX는 끊기지 않는다.
  const quickLog = (emoji: string, label: string, action: () => void, remote: () => Promise<unknown>) => {
    setFabOpen(false);
    action();
    setBubbleOverride(null);
    setStageCard({ emoji, title: label, meta: now() });
    addFuel('QUICK_LOG');
    remote().catch(() => { /* 서버 미연결/DB 불가 시에도 로컬 기록은 유지 */ });
  };

  const fabItems = [
    { emoji: '📷', label: '사진 촬영', onClick: () => { setFabOpen(false); onOpenFood(); } },
    { emoji: '📊', label: '리포트 생성', onClick: () => { setFabOpen(false); setReportJob({ pct: 0, done: false }); } },
    { emoji: '💧', label: '물 마시기', onClick: () => quickLog('💧', '물 마시기', () => logWater(250), () => api.quickLog({ category: 'WATER', amount: 250 })) },
    { emoji: '💗', label: '감정 기록', onClick: () => quickLog('💗', '감정 기록', () => logMood(MOOD_OPTIONS[1]), () => api.quickLog({ category: 'EMOTION', emotionType: 'HAPPY' })) },
    { emoji: '📖', label: '감정일기 작성', onClick: () => { setFabOpen(false); onOpenDiary(); } },
  ];

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[linear-gradient(180deg,#F3EDFA_0%,#FDF3F0_100%)]">
      {/* history drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 z-[39] bg-[#3C2D50]/[.18]"
            />
            <motion.div
              initial={{ x: '-100%', opacity: 0.4 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '-100%', opacity: 0.4 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 z-40 w-[248px] overflow-y-auto rounded-r-[28px] bg-white/74 p-4 pt-[18px] shadow-[12px_0_40px_rgba(120,90,150,.22)] backdrop-blur-xl"
            >
              <div className="flex items-center justify-between px-1 pb-3.5">
                <span className="text-sm font-black text-ink">💬 채팅 내역</span>
                <button onClick={() => setDrawerOpen(false)} className="flex h-[26px] w-[26px] items-center justify-center rounded-[14px] border-none bg-white/80 font-black text-muted">✕</button>
              </div>
              {messages.length > 0 ? (
                <div className="mb-3.5">
                  <div className="px-1.5 pb-[7px] text-[11px] font-black text-lavender-deep">💬 일상 대화</div>
                  <button onClick={() => { setDrawerOpen(false); onOpenChat(); }} className="mb-1.5 w-full rounded-[14px] bg-white/70 px-3 py-2.5 text-left text-xs font-bold text-[#6E5B78]">
                    대화 이어가기 ({messages.length})
                  </button>
                </div>
              ) : (
                <div className="px-1 py-7 text-center">
                  <span className="text-[26px]">💬</span>
                  <p className="mt-2 text-[12.5px] font-extrabold leading-relaxed text-muted">아직 대화 기록이 없어요<br />타미에게 편하게 말을 걸어봐!</p>
                </div>
              )}
              <div className="mt-1 border-t border-[rgba(160,130,190,.15)] px-1.5 pt-2.5">
                <p className="text-[10px] font-bold leading-relaxed text-soft">🔒 대화는 이 기기에만 저장돼요. 언제든 개별 기록을 삭제하거나 되돌릴 수 있어요.</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* header */}
      <div className="flex flex-none items-center justify-between px-5 pt-1">
        <motion.button whileTap={{ scale: 0.92 }} onClick={() => setDrawerOpen((o) => !o)} className="flex h-[38px] w-[38px] items-center justify-center rounded-[20px] border-none bg-white/85 shadow-[0_6px_16px_rgba(160,130,190,.15)]" aria-label="채팅 내역">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8A76A0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M3 12h14" /><path d="M3 18h10" /></svg>
        </motion.button>
        <div className="text-[15px] font-black text-ink">타미</div>
      </div>

      {/* stage */}
      <div className="relative flex min-h-0 flex-1 flex-col items-center overflow-y-auto overflow-x-hidden px-[22px] pb-3.5 pt-2">
        <span className="pointer-events-none absolute left-[30px] top-3.5 text-[11px]" style={{ animation: 'twinkle 2.6s ease-in-out infinite' }}>✦</span>
        <span className="pointer-events-none absolute right-[34px] top-10 text-[8px] text-lavender" style={{ animation: 'twinkle 3.2s ease-in-out 1s infinite' }}>✦</span>

        <div className="my-auto flex w-full flex-none flex-col items-center">
          {stageCard ? (
            <motion.div key="card" initial={{ opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="w-full max-w-[300px] rounded-[20px] bg-white px-[15px] py-[13px] shadow-[0_10px_26px_rgba(160,130,190,.18)]">
              <div className="flex items-start gap-[9px]">
                <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[18px] bg-[#FFF7E4] text-base">{stageCard.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-black text-ink">{stageCard.title}</div>
                  <div className="mt-0.5 truncate text-[10px] font-bold text-muted">{stageCard.meta}</div>
                </div>
                <span className="flex-none whitespace-nowrap rounded-full bg-[#E9F6EE] px-2 py-[3px] text-[10px] font-extrabold text-mint-deep">✓ 기록됨</span>
              </div>
            </motion.div>
          ) : (
            <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full max-w-[300px] rounded-[22px] bg-white px-[15px] py-3 shadow-[0_10px_24px_rgba(160,130,190,.18)]">
              {typing ? (
                <div className="flex gap-[5px]">
                  {[0, 1, 2].map((d) => <span key={d} className="h-[7px] w-[7px] rounded-full bg-lavender" style={{ animation: `blink 1.1s ease-in-out ${d * 0.22}s infinite` }} />)}
                </div>
              ) : (
                <span className="text-sm font-extrabold leading-relaxed text-ink">{bubbleText}</span>
              )}
              <span className="absolute -bottom-[9px] left-1/2 h-[18px] w-[18px] -translate-x-1/2 rotate-45 rounded-[3px] bg-white" />
            </motion.div>
          )}

          <motion.button whileTap={{ scale: 0.96 }} onClick={tapTammy} className="relative mt-[18px] border-none bg-transparent p-0" aria-label="타미와 이야기하기">
            <span
              className="pointer-events-none absolute left-1/2 top-1/2 h-[190px] w-[190px] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(201,182,255,.35), rgba(201,182,255,0) 68%)',
                opacity: sparkle ? 1 : 0.55,
                animation: sparkle ? 'glowPulse 1.2s ease-in-out infinite' : 'none',
              }}
            />
            <img src={tammyHero} alt="타미" className="pixelated relative w-[200px] drop-shadow-[0_22px_20px_rgba(120,80,140,.3)]" />
            {sparkle && (
              <>
                <span className="absolute right-0.5 top-1 text-[15px]" style={{ animation: 'twinkle .9s ease-in-out infinite' }}>✨</span>
                <span className="absolute -left-0.5 top-[30px] text-[11px]" style={{ animation: 'twinkle 1.1s ease-in-out .3s infinite' }}>✨</span>
              </>
            )}
          </motion.button>
          <p className="mt-1.5 whitespace-nowrap text-[10px] font-bold text-soft">타미를 탭해서 이야기해 보세요</p>

          <AnimatePresence>
            {userEcho && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
                className="mt-3.5 max-w-[260px] flex-none self-end truncate rounded-full bg-gradient-to-br from-lavender-deep to-lavender px-[15px] py-2.5 text-xs font-extrabold text-white shadow-[0_6px_16px_rgba(140,110,190,.28)]"
              >
                {userEcho}
              </motion.div>
            )}
          </AnimatePresence>

          {/* gauges */}
          <div className="mt-3 flex w-full flex-none gap-2">
            <button onClick={onOpenTravel} className="flex-1 rounded-2xl bg-white/85 px-3 py-2 text-left">
              <div className="flex justify-between whitespace-nowrap text-[10px] font-extrabold">
                <span className="text-muted">🚀 {target.name}까지</span>
                <span className="text-lavender-deep">{fuel}%</span>
              </div>
              <div className="mt-[5px] h-[6px] overflow-hidden rounded-full bg-[#F2EBF7]">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-lavender to-pink" animate={{ width: fuel + '%' }} transition={{ type: 'spring', stiffness: 60, damping: 15 }} />
              </div>
            </button>
            <button onClick={onOpenGrowth} className="flex-1 rounded-2xl bg-white/85 px-3 py-2 text-left">
              <div className="flex justify-between whitespace-nowrap text-[10px] font-extrabold">
                <span className="text-muted">{stage.emoji} {stage.name}</span>
                <span className="text-pink-deep">친밀도 {affinity}</span>
              </div>
              <div className="mt-[5px] h-[6px] overflow-hidden rounded-full bg-[#F2EBF7]">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-butter to-pink" animate={{ width: expPct + '%' }} transition={{ type: 'spring', stiffness: 60, damping: 15 }} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* FAB overlay scrim */}
      {fabOpen && <div onClick={() => setFabOpen(false)} className="absolute inset-0 z-[41]" />}

      <div className="relative flex-none px-5 pb-2.5">
        {/* report job card */}
        <AnimatePresence>
          {reportJob && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-2.5 rounded-[20px] border border-[#EDE4F5] bg-white/97 px-4 py-[13px] shadow-[0_16px_40px_rgba(120,90,150,.26)] backdrop-blur-xl">
              {reportJob.done ? (
                <div className="flex items-center gap-[11px]">
                  <span className="text-2xl" style={{ animation: 'hopJump 1.2s ease-in-out infinite', display: 'inline-block' }}>🎉</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-black text-ink">리포트가 완성되었어요! 🎉</div>
                    <div className="mt-0.5 text-[10px] font-bold text-lavender-deep">식단 · 감정 · 활동 종합 분석</div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => { setReportJob(null); onOpenReport(); }}
                    className="flex-none whitespace-nowrap rounded-full bg-gradient-to-br from-lavender-deep to-lavender px-3.5 py-2.5 text-[11.5px] font-black text-white"
                    style={{ animation: 'glowPulse 1.8s ease-in-out infinite' }}
                  >
                    리포트 보기
                  </motion.button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ animation: 'float 2s ease-in-out infinite', display: 'inline-block' }}>📊</span>
                      <span className="text-xs font-black text-ink">리포트 생성 중…</span>
                    </div>
                    <span className="text-xs font-black text-lavender-deep">{reportJob.pct}%</span>
                  </div>
                  <div className="mt-2 h-[7px] overflow-hidden rounded-full bg-[#F2EBF7]">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-lavender to-pink" animate={{ width: reportJob.pct + '%' }} />
                  </div>
                  <p className="mt-[7px] text-[9.5px] font-bold text-soft">화면을 계속 사용해도 분석은 이어져요</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB row */}
        <div className="relative flex justify-end pb-2">
          <AnimatePresence>
            {fabOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.9 }}
                className="absolute bottom-full right-0 z-[43] mb-2.5 flex flex-col gap-[7px]"
              >
                {fabItems.map((f) => (
                  <motion.button key={f.label} whileTap={{ scale: 0.94 }} onClick={f.onClick} className="flex items-center gap-[9px] whitespace-nowrap rounded-full border-none bg-white/95 py-2.5 pl-[11px] pr-[15px] shadow-[0_8px_20px_rgba(160,130,190,.25)] backdrop-blur-md">
                    <span className="text-base">{f.emoji}</span>
                    <span className="text-[12.5px] font-black text-ink">{f.label}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setFabOpen((o) => !o)}
            animate={{ rotate: fabOpen ? 90 : 0 }}
            className="relative z-[42] flex h-[50px] w-[50px] flex-none items-center justify-center rounded-[26px] border-none bg-gradient-to-br from-lavender to-pink text-xl font-black text-white shadow-[0_10px_26px_rgba(160,130,190,.45)]"
            aria-label="빠른 기록"
          >
            {fabOpen ? '✕' : '＋'}
          </motion.button>
        </div>

        {/* suggestion chips */}
        <div className="flex gap-2 overflow-x-auto pb-2.5 pr-[62px]">
          {SUGGEST_CHIPS.map((c) => (
            <motion.button key={c} whileTap={{ scale: 0.95 }} onClick={() => onSend(c)} className="flex-none whitespace-nowrap rounded-full bg-white/85 px-3.5 py-2 text-xs font-extrabold text-[#8A76A0] shadow-[0_4px_10px_rgba(160,130,190,.12)]">
              {c}
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-[28px] bg-white py-[7px] pl-[18px] pr-2 shadow-[0_10px_26px_rgba(160,130,190,.2)]">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
            placeholder="타미에게 이야기해 보세요"
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-soft"
          />
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => onSend()} className="flex h-10 w-10 flex-none items-center justify-center rounded-[22px] bg-gradient-to-br from-lavender to-pink shadow-[0_5px_14px_rgba(160,130,190,.4)]" aria-label="보내기">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
          </motion.button>
        </div>
      </div>
      <div className="h-[74px] flex-none" />
    </div>
  );
}

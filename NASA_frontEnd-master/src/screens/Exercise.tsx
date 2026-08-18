import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { mockPlan } from '../mocks/exercise';
import { useFuel } from '../hooks/useFuel';
import { Card, PrimaryButton, ProgressBar } from '../components/ui';
import { BackButton } from './Food';
import tammyHappy from '../assets/px-happy.png';

type Stage = 'plan' | 'detail' | 'active' | 'done';

/**
 * Exercise — AI 추천 → 상세 → 타이머 진행 → 완료(연료 +10)
 * ⚠️ 백엔드에 운동 추천 API가 없어(NASA_backEnd에 ExerciseController 자체가 존재하지 않음)
 * mock 플랜을 그대로 사용한다. 과거에는 존재하지 않는 api.getExercisePlan()을 호출해
 * 런타임에 항상 실패하는 코드가 있었다 — 제거함.
 */
export function ExerciseScreen({ onBack }: { onBack: () => void }) {
  const plan = mockPlan;
  const [stage, setStage] = useState<Stage>('plan');
  const [exIdx, setExIdx] = useState(0);
  const [set, setSet] = useState(1);
  const [remain, setRemain] = useState(0);
  const [running, setRunning] = useState(false);
  const [betweenEx, setBetweenEx] = useState(false);
  const { addFuel } = useFuel();
  const timer = useRef<number>();

  const ex = plan.exercises[exIdx];

  const start = (i: number) => {
    window.clearInterval(timer.current);
    setExIdx(i);
    setSet(1);
    setRemain(plan.exercises[i].seconds);
    setRunning(true);
    setBetweenEx(false);
    setStage('active');
  };

  useEffect(() => {
    if (stage !== 'active' || !running) return;
    timer.current = window.setInterval(() => {
      setRemain((r) => {
        if (r > 1) return r - 1;
        setSet((s) => {
          if (s < plan.exercises[exIdx].sets) return s + 1;
          setRunning(false);
          setBetweenEx(true);
          return s;
        });
        return plan.exercises[exIdx].seconds;
      });
    }, 1000);
    return () => window.clearInterval(timer.current);
  }, [stage, running, exIdx, plan]);

  const next = () => {
    if (exIdx < plan.exercises.length - 1) start(exIdx + 1);
    else {
      setStage('done');
      addFuel('WORKOUT_DONE'); // 우주선 전진!
    }
  };

  return (
    <div className="pb-[110px] pt-1.5">
      <header className="flex items-center gap-2.5 px-5 pt-1">
        <BackButton onClick={stage === 'plan' ? onBack : () => setStage('plan')} />
        <h1 className="text-lg font-black text-ink">AI 운동 추천</h1>
      </header>

      <AnimatePresence mode="wait">
        {stage === 'plan' && (
          <motion.div key="plan" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="mx-4 mt-3.5 rounded-[28px] bg-gradient-to-br from-[#EFE6FB] to-[#FBEFF2] p-5 shadow-[0_10px_28px_rgba(160,130,190,.16)]">
              <span className="text-xs font-extrabold text-lavender-deep">오늘의 추천 운동</span>
              <h2 className="mt-1.5 text-2xl font-black text-ink">{plan.emoji} {plan.title}</h2>
              <p className="mt-1 text-[13px]">{'⭐'.repeat(plan.difficulty)}{'☆'.repeat(5 - plan.difficulty)}</p>
              <div className="mt-3.5 flex gap-2.5">
                <Stat label="총 운동시간" value={plan.totalMinutes + '분'} />
                <Stat label="예상 소모" value={plan.totalCalories + ' kcal'} accent />
              </div>
            </div>
            <div className="mx-4 mt-3.5 flex flex-col gap-2.5">
              {plan.exercises.map((e, i) => (
                <motion.button key={e.id} whileTap={{ scale: 0.97 }} onClick={() => { setExIdx(i); setStage('detail'); }} className="flex items-center gap-3 rounded-3xl bg-white p-4 text-left shadow-[0_8px_20px_rgba(160,130,190,.12)]">
                  <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-3xl bg-surface text-[21px]">{e.emoji}</span>
                  <span className="flex-1">
                    <span className="block text-[14.5px] font-black text-ink">{e.name}</span>
                    <span className="mt-0.5 block text-[11.5px] font-bold text-muted">{e.reps} × {e.sets}세트 · {e.calories} kcal</span>
                  </span>
                  <Chevron />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {stage === 'detail' && (
          <motion.div key="detail" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <Card className="mx-4 mt-3.5">
              <div className="text-center">
                <span className="text-[52px]">{ex.emoji}</span>
                <h2 className="mt-1.5 text-[21px] font-black text-ink">{ex.name}</h2>
                <div className="mt-2 flex justify-center gap-1.5">
                  <Pill className="bg-surface text-lavender-deep">{ex.bodyPart}</Pill>
                  <Pill className="bg-[#FBF0F4] text-pink-deep">{ex.reps} × {ex.sets}세트</Pill>
                  <Pill className="bg-[#E9F6EE] text-mint-deep">세트당 {ex.seconds}초</Pill>
                </div>
              </div>
              <h3 className="mt-4 text-[13.5px] font-black text-ink">운동 방법</h3>
              <ol className="mt-2.5 flex flex-col gap-2">
                {ex.howTo.map((t, i) => (
                  <li key={i} className="flex items-start gap-2.5 rounded-2xl bg-surface-2 p-3">
                    <span className="mt-px flex h-5 w-5 flex-none items-center justify-center rounded-[11px] bg-gradient-to-br from-lavender to-pink text-[11px] font-black text-white">{i + 1}</span>
                    <span className="text-[12.5px] font-bold leading-relaxed text-[#6E5B78]">{t}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-3.5 flex items-start gap-2.5 rounded-widget bg-[#FFF7E4] p-3 text-xs font-bold leading-relaxed text-[#8A6A2E]"><span>⚠️</span>{ex.caution}</p>
              <PrimaryButton className="mt-4" onClick={() => start(exIdx)}>▶ 운동 시작</PrimaryButton>
            </Card>
          </motion.div>
        )}

        {stage === 'active' && (
          <motion.div key="active" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <Card className="mx-4 mt-3.5 text-center">
              <p className="text-[11.5px] font-extrabold text-muted">운동 {exIdx + 1} / {plan.exercises.length}</p>
              <h2 className="mt-1 text-[22px] font-black text-ink">{ex.emoji} {ex.name}</h2>
              <span className="mt-2 inline-block rounded-full bg-surface px-3.5 py-1.5 text-xs font-black text-lavender-deep">세트 {set} / {ex.sets}</span>
              {betweenEx ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-4">
                  <span className="text-[40px]">🎉</span>
                  <p className="mt-1.5 text-[15px] font-black text-ink">세트 완료! 잘했어!</p>
                  <PrimaryButton className="mt-3.5" onClick={next}>{exIdx >= plan.exercises.length - 1 ? '운동 완료! 🎉' : '다음 운동으로 이동 →'}</PrimaryButton>
                </motion.div>
              ) : (
                <>
                  <p className="mt-2 text-[64px] font-black tracking-tight text-lavender-deep">{remain}<small className="text-xl font-extrabold text-[#C3B3D2]">초</small></p>
                  <ProgressBar pct={((ex.seconds - remain) / ex.seconds) * 100} className="mt-3" />
                  <div className="mt-4 flex items-center gap-2.5 rounded-widget bg-surface p-3 text-left">
                    <motion.img src={tammyHappy} alt="" className="pixelated h-10 w-10 object-contain" animate={{ y: [0, -7, 0] }} transition={{ duration: 2, repeat: Infinity }} />
                    <span className="text-[12.5px] font-extrabold text-[#7B65A0]">조금만 더 힘내! 💪 타미가 응원할게!</span>
                  </div>
                  <div className="mt-3.5 flex gap-2.5">
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => setRunning((r) => !r)} className="flex-[1.3] rounded-widget bg-surface py-3 text-[13px] font-black text-[#8A76A0]">{running ? '⏸ 일시정지' : '▶ 계속하기'}</motion.button>
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => setStage('plan')} className="flex-1 rounded-widget bg-[#FBF3F6] py-3 text-[13px] font-black text-[#C3A2AE]">그만하기</motion.button>
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        )}

        {stage === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 16 }} className="mx-4 mt-3.5 rounded-[30px] bg-gradient-to-br from-[#EFE6FB] to-[#FBEFF2] px-5 py-6 text-center shadow-pop">
            <span className="text-5xl">🎉</span>
            <h2 className="mt-2 text-[21px] font-black text-ink">오늘 운동 완료!</h2>
            <motion.img src={tammyHappy} alt="TAMMY" className="pixelated mx-auto mt-2.5 w-[110px] drop-shadow-[0_14px_16px_rgba(120,80,140,.25)]" animate={{ y: [0, -14, 0, -7, 0] }} transition={{ duration: 1.4, repeat: Infinity }} />
            <p className="mt-2 text-[13px] font-extrabold text-lavender-deep">"오늘 목표를 달성했어! 정말 대단해!"</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Stat label="운동 시간" value={plan.totalMinutes + '분'} />
              <Stat label="소모 칼로리" value={plan.totalCalories + ' kcal'} accent />
              <Stat label="완료 운동" value={plan.exercises.length + '개'} />
            </div>
            <p className="mt-3 flex items-center justify-center gap-2 rounded-widget bg-white/80 p-3 text-[12.5px] font-black text-pink-deep">🔥 연속 운동 5일차! 배지 획득까지 2일 남았어!</p>
            <PrimaryButton className="mt-4" onClick={onBack}>좋아! 홈으로 🏠</PrimaryButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const Stat = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <div className="flex-1 rounded-widget bg-white/80 px-2 py-3 text-center">
    <p className="text-[10.5px] font-extrabold text-muted">{label}</p>
    <p className={'mt-0.5 text-[15px] font-black ' + (accent ? 'text-pink-deep' : 'text-ink')}>{value}</p>
  </div>
);
const Pill = ({ children, className }: { children: React.ReactNode; className: string }) => (
  <span className={'rounded-full px-3 py-1.5 text-[11px] font-extrabold ' + className}>{children}</span>
);
const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C3B3D2" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
);

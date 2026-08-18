import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { NutritionData, FoodVisionScanResponse } from '../types';
import { api } from '../api/client';
import { DAILY_KCAL_GOAL } from '../mocks/food';
import { useFuel } from '../hooks/useFuel';
import { Card, PrimaryButton, ProgressBar, SectionTitle } from '../components/ui';
import tammyHappy from '../assets/px-happy.png';
import saladFallback from '../assets/salad.png';

type Stage = 'idle' | 'scanning' | 'done' | 'failed';
type ScanResult = NutritionData & { raw: FoodVisionScanResponse };

interface GalleryItem {
  id: string;
  preview: string;
  result: NutritionData;
  time: string;
}

const nowLabel = () => {
  const d = new Date();
  const h = d.getHours();
  return (h < 12 ? '오전 ' + (h || 12) : '오후 ' + (h === 12 ? 12 : h - 12)) + ':' + String(d.getMinutes()).padStart(2, '0');
};

/** 현재 시각대로 끼니 종류를 추정 — Food.tsx에는 별도 끼니 선택 UI가 없어(v4 원본에도 없음) 자동 판단한다 */
const mealTypeNow = (): 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' => {
  const h = new Date().getHours();
  if (h < 11) return 'BREAKFAST';
  if (h < 16) return 'LUNCH';
  if (h < 21) return 'DINNER';
  return 'SNACK';
};

/** Food Analysis — TAMMY v4 "Food AI": 촬영/갤러리 → AI 분석 → 영양소 카드 → 최근 7일 갤러리 → 연료 보상 */
export function FoodScreen({ onBack }: { onBack: () => void }) {
  const [stage, setStage] = useState<Stage>('idle');
  const [preview, setPreview] = useState<string>(saladFallback);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [qty, setQty] = useState(1);
  const [todayKcal, setTodayKcal] = useState(1240);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const { addFuel } = useFuel();

  const analyze = async (file: File | null) => {
    setPreview(file ? URL.createObjectURL(file) : saladFallback);
    setStage('scanning');
    setQty(1);
    try {
      const data = await api.analyzeFood(file, mealTypeNow());
      setResult(data);
      setStage('done');
    } catch {
      setStage('failed');
    }
  };

  const logMeal = () => {
    if (result) {
      const kcal = result.calories * qty;
      setTodayKcal((k) => k + kcal);
      setGallery((g) => [{ id: 'g' + Date.now(), preview, result: { ...result, calories: kcal }, time: nowLabel() }, ...g].slice(0, 7));

      // 실제 확정 저장 API — 스캔 단계에서 받은 imageId/detectedFoods를 그대로 넘긴다.
      // ⚠️ foods[].calories/carbs/protein/fat는 DTO 소스(food.dto.ts)엔 선택 필드로 있지만,
      // 실서버(34.64.242.167)에 배포된 빌드의 검증기는 이 필드들을 "excess property"로 거부한다
      // (배포본이 소스보다 오래된 것으로 보임 — 400 VALIDATION_ERROR로 직접 확인). 실서버가 실제로
      // 받아들이는 최소 필드(foodName/gram/boxId)만 보낸다 — 영양값은 백엔드의 getOrMapFood()가 채운다.
      // 인증/DB 문제로 실패해도(이 환경처럼) 위의 로컬 갤러리·칼로리 반영은 이미 끝나 있어 화면은 계속 동작한다.
      api.confirmFoodLog({
        mealType: mealTypeNow(),
        imageId: result.raw.imageId,
        imageUrl: result.raw.imageUrl,
        foods: result.raw.detectedFoods.map((f) => ({
          foodName: f.foodName,
          gram: f.estimatedGram,
        })),
      }).catch(() => {});
    }
    setStage('idle');
    setResult(null);
    addFuel('FOOD_ANALYZED'); // 우주선 전진 + 토스트
  };

  const removeGalleryItem = (id: string) => setGallery((g) => g.filter((it) => it.id !== id));

  const nutrients = result
    ? [
        { emoji: '🔥', label: 'Calories', value: result.calories * qty + ' kcal', pct: Math.min(100, ((result.calories * qty) / 800) * 100), bar: 'from-[#F8B7A0] to-[#EF8A6D]', bg: 'bg-[#FDF1EC]' },
        { emoji: '🍚', label: 'Carbs', value: result.carbohydrate * qty + 'g', pct: Math.min(100, result.carbohydrate * qty), bar: 'from-butter to-butter-deep', bg: 'bg-[#FFF7E4]' },
        { emoji: '🥩', label: 'Protein', value: result.protein * qty + 'g', pct: Math.min(100, ((result.protein * qty) / 40) * 100), bar: 'from-pink to-pink-deep', bg: 'bg-[#FBF0F4]' },
        { emoji: '🥑', label: 'Fat', value: result.fat * qty + 'g', pct: Math.min(100, ((result.fat * qty) / 40) * 100), bar: 'from-mint to-mint-deep', bg: 'bg-[#E9F6EE]' },
      ]
    : [];

  return (
    <div className="pb-[110px] pt-1.5">
      <header className="flex items-center gap-2.5 px-5 pt-1">
        <BackButton onClick={onBack} />
        <h1 className="text-lg font-black text-ink">음식 분석</h1>
      </header>

      <Card className="mx-4 mt-3.5">
        <SectionTitle right={<span className="text-[13px] font-black text-lavender-deep">{todayKcal.toLocaleString()} / {DAILY_KCAL_GOAL.toLocaleString()} kcal</span>}>오늘 섭취 칼로리</SectionTitle>
        <ProgressBar pct={Math.min(100, (todayKcal / DAILY_KCAL_GOAL) * 100)} className="mt-3" barClassName="!bg-gradient-to-r !from-butter !to-pink" />
      </Card>

      {/* 최근 7일 갤러리 */}
      <Card className="mx-4 mt-3.5">
        <SectionTitle right={<span className="text-[11px] font-extrabold text-muted">{gallery.length}개</span>}>🖼️ 최근 7일 갤러리</SectionTitle>
        {gallery.length === 0 ? (
          <p className="mt-3 text-[11.5px] font-bold leading-relaxed text-soft">아직 기록이 없어요. 사진을 찍으면 이곳에 일주일간 보관돼요.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2.5">
            {gallery.map((g) => (
              <div key={g.id} className="rounded-[18px] bg-surface-2 px-[14px] py-3">
                <div className="flex items-center gap-2.5">
                  <img src={g.preview} alt="" className="h-9 w-9 flex-none rounded-[12px] object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-black text-ink">{g.result.food}</div>
                    <div className="mt-0.5 truncate text-[10px] font-bold text-soft">{g.time} · {g.result.calories} kcal</div>
                  </div>
                  <span className="flex-none whitespace-nowrap rounded-full bg-[#E9F6EE] px-2.5 py-1 text-[10px] font-extrabold text-mint-deep">✓ 기록됨</span>
                </div>
                <div className="mt-2.5 flex gap-1.5">
                  <motion.button whileTap={{ scale: 0.96 }} className="flex-1 rounded-xl bg-white py-2 text-[11px] font-black text-[#8A76A0]">✏️ 수정</motion.button>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => removeGalleryItem(g.id)} className="flex-none rounded-xl bg-[#FBF3F6] px-3 py-2 text-[11px] font-black text-[#C3A2AE]">삭제</motion.button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <AnimatePresence mode="wait">
        {stage === 'failed' && (
          <motion.div key="failed" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-4 mt-3.5 rounded-[30px] border-2 border-dashed border-[#F0D9C8] bg-white px-5 py-6 text-center shadow-card">
            <span className="text-[34px]">🥺</span>
            <h2 className="mt-2.5 text-sm font-black text-ink">음식을 알아보지 못했어요</h2>
            <p className="mt-1.5 text-[11.5px] font-bold leading-relaxed text-muted">사진이 흐리거나 여러 음식이 겹쳐 있을 수 있어요.<br />다시 찍거나 직접 입력해 주세요.</p>
            <div className="mt-4 flex gap-2.5">
              <PrimaryButton className="flex-1 !py-3.5 text-[12.5px]" onClick={() => analyze(null)}>📷 다시 촬영</PrimaryButton>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => setStage('idle')} className="flex-1 rounded-widget bg-surface py-3.5 text-[12.5px] font-black text-[#8A76A0]">✏️ 수동 입력</motion.button>
            </div>
          </motion.div>
        )}

        {stage === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-4 mt-3.5 rounded-[30px] border-2 border-dashed border-[#E3D7EC] bg-white px-5 py-8 text-center">
            <span className="text-[44px]">🍽️</span>
            <h2 className="mt-3 text-base font-black text-ink">오늘 먹은 음식을 분석해 볼까?</h2>
            <p className="mt-1.5 text-xs font-bold leading-relaxed text-muted">사진 한 장이면 타미가 칼로리와<br />영양 정보를 알려줄게!</p>
            <div className="mt-4 flex gap-2.5">
              <PrimaryButton className="flex-1 !py-3.5 text-[13px]" onClick={() => analyze(null)}>📷 사진 촬영</PrimaryButton>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => fileRef.current?.click()} className="flex-1 rounded-widget bg-surface py-3.5 text-[13px] font-black text-[#8A76A0]">
                🖼️ 갤러리
              </motion.button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => analyze(e.target.files?.[0] ?? null)} />
            </div>
          </motion.div>
        )}

        {stage === 'scanning' && (
          <motion.div key="scan" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative mx-4 mt-3.5 overflow-hidden rounded-[30px] shadow-pop">
            <img src={preview} alt="분석 중인 음식" className="block h-[230px] w-full object-cover" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-[#5A4682]/50">
              <motion.span className="h-[34px] w-[34px] rounded-2xl border-4 border-white/35 border-t-white" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
              <span className="text-[13px] font-extrabold text-white">AI 분석 중… 잠깐만 기다려 줘!</span>
            </div>
          </motion.div>
        )}

        {stage === 'done' && result && (
          <motion.div key="done" initial={{ opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="mx-4 mt-3.5 overflow-hidden rounded-[30px] bg-white shadow-pop">
            <img src={preview} alt={result.food} className="block h-[150px] w-full object-cover" />
            <div className="p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[17px] font-black text-ink">{result.food}</h2>
                <span className="text-xl font-black text-lavender-deep">{result.calories * qty} <small className="text-xs font-extrabold">kcal</small></span>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <motion.button whileTap={{ scale: 0.95 }} className="whitespace-nowrap rounded-xl bg-surface px-3 py-2 text-[11px] font-black text-[#8A76A0]">✏️ 음식 수정</motion.button>
                <div className="flex flex-1 items-center justify-end gap-2">
                  <span className="text-[11px] font-extrabold text-muted">수량</span>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-7 w-7 items-center justify-center rounded-[15px] bg-surface text-[15px] font-black text-[#8A76A0]">−</motion.button>
                  <span className="min-w-[18px] text-center text-[13px] font-black text-ink">{qty}</span>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setQty((q) => q + 1)} className="flex h-7 w-7 items-center justify-center rounded-[15px] bg-surface text-[15px] font-black text-[#8A76A0]">+</motion.button>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {nutrients.map((n) => (
                  <div key={n.label} className="flex items-center gap-3">
                    <span className={'flex h-9 w-9 flex-none items-center justify-center rounded-[19px] text-[15px] ' + n.bg}>{n.emoji}</span>
                    <div className="flex-1">
                      <div className="mb-1.5 flex justify-between">
                        <span className="text-xs font-extrabold text-[#8A76A0]">{n.label}</span>
                        <span className="text-[12.5px] font-black text-ink">{n.value}</span>
                      </div>
                      <ProgressBar pct={n.pct} className="!h-[7px]" barClassName={'!bg-gradient-to-r ' + n.bar} />
                    </div>
                  </div>
                ))}
              </div>
              {result.comment && (
                <div className="mt-4 flex items-center gap-2.5 rounded-widget bg-surface p-3">
                  <motion.img src={tammyHappy} alt="" className="pixelated h-10 w-10 object-contain" animate={{ y: [0, -6, 0] }} transition={{ duration: 2.6, repeat: Infinity }} />
                  <span className="text-[12.5px] font-extrabold leading-relaxed text-[#7B65A0]">{result.comment}</span>
                </div>
              )}
              <div className="mt-4 flex gap-2.5">
                <PrimaryButton className="flex-[1.4] !py-3.5 text-[13px]" onClick={logMeal}>✓ 오늘 식단에 기록</PrimaryButton>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setStage('idle'); setResult(null); }} className="flex-1 rounded-widget bg-surface py-3.5 text-[13px] font-black text-[#8A76A0]">
                  다시 분석
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.92 }} onClick={onClick} className="flex h-[38px] w-[38px] items-center justify-center rounded-widget bg-white shadow-[0_6px_16px_rgba(160,130,190,.18)]" aria-label="뒤로">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8A76A0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
    </motion.button>
  );
}

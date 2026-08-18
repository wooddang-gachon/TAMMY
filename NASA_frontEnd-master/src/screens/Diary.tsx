import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEmotions } from '../hooks/useEmotions';
import { useFuel } from '../hooks/useFuel';
import { api } from '../api/client';
import type { Mood } from '../api/types';
import tammyHappy from '../assets/px-happy.png';
import { BackButton } from './Food';

const DIARY_MOODS: { emoji: string; label: string; fb: string; mapped: Mood }[] = [
  { emoji: '😊', label: '기뻐요', fb: '좋은 하루였구나! 이런 날이 더 자주 오면 좋겠다 💛', mapped: '😊 매우 좋아요' },
  { emoji: '🥰', label: '사랑', fb: '마음이 따뜻해지는 하루였네. 나도 덩달아 기뻐 💗', mapped: '😊 매우 좋아요' },
  { emoji: '😐', label: '그저그래', fb: '평범한 하루도 잘 지나온 거야. 오늘도 수고했어 ☁️', mapped: '😐 보통이에요' },
  { emoji: '😢', label: '슬퍼요', fb: '많이 속상했구나… 이야기해줘서 고마워. 내가 옆에 있을게 🥺', mapped: '😢 많이 힘들어요' },
  { emoji: '😫', label: '지쳐요', fb: '오늘 정말 애썼어. 지금은 아무것도 안 해도 괜찮아 🌙', mapped: '😔 우울해요' },
  { emoji: '😠', label: '화나요', fb: '그럴 만했어. 화나는 마음도 네 것이니까 눌러 담지 마 🍃', mapped: '😔 우울해요' },
];

const TAG_OPTIONS = ['#일', '#관계', '#건강', '#휴식', '#운동', '#가족'];

/** Emotion Diary — TAMMY v4 "감정일기" 화면 */
export function DiaryScreen({ onBack }: { onBack: () => void }) {
  const { diaries, saveDiary } = useEmotions();
  const { addFuel } = useFuel();
  const [mood, setMood] = useState(-1);
  const [text, setText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const canSave = mood >= 0 && text.trim().length > 0;

  const toggleTag = (t: string) => setTags((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]));

  const onSave = () => {
    if (!canSave) return;
    const m = DIARY_MOODS[mood];
    saveDiary(m.mapped, text.trim(), undefined, tags);
    addFuel('QUICK_LOG');
    // 실서버에도 일기 내용을 퀵기록(JOURNAL)으로 남긴다 — "지난 일기" 목록 자체는 백엔드에
    // 조회 API가 없어 계속 로컬(useEmotions)에서 읽지만, 기록 행위 자체는 실제로 전송한다.
    api.quickLog({ category: 'JOURNAL', journalContent: text.trim() }).catch(() => {});
    setSavedFeedback(m.fb);
    setText('');
    setTags([]);
    setMood(-1);
    window.setTimeout(() => setSavedFeedback(null), 4200);
  };

  const recent = [...diaries].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  return (
    <div className="flex min-h-full flex-col pb-[110px] pt-1.5">
      <div className="flex flex-none items-center gap-2.5 px-5 pt-1">
        <BackButton onClick={onBack} />
        <h1 className="text-lg font-black text-ink">📖 감정일기</h1>
      </div>

      <div className="mx-4 mt-3.5 rounded-card bg-white px-5 py-[18px] shadow-card">
        <div className="text-[13px] font-black text-ink">오늘의 감정</div>
        <div className="mt-[11px] flex gap-1.5">
          {DIARY_MOODS.map((m, i) => (
            <motion.button
              key={m.label}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMood((v) => (v === i ? -1 : i))}
              className="flex min-w-0 flex-1 flex-col items-center gap-[5px] rounded-[18px] py-[11px] pb-[9px]"
              style={{
                background: mood === i ? 'linear-gradient(160deg, #EFE6FB, #FBE3F0)' : '#FAF6FC',
                outline: mood === i ? '2px solid #C9B6FF' : 'none',
              }}
            >
              <span className="text-xl">{m.emoji}</span>
              <span className="whitespace-nowrap text-[9.5px] font-extrabold" style={{ color: mood === i ? '#9B85D6' : '#B7A6C6' }}>{m.label}</span>
            </motion.button>
          ))}
        </div>

        <div className="mt-[18px] text-[13px] font-black text-ink">한 줄 일기</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="오늘 어떤 하루였어? 한 줄이면 충분해요."
          rows={3}
          className="mt-2.5 w-full resize-none rounded-[18px] border-[1.5px] border-[#EDE4F5] bg-surface-2 px-[15px] py-[13px] text-[13px] font-bold leading-relaxed text-ink outline-none"
        />

        <div className="mt-3.5 text-xs font-black text-ink">태그 <span className="text-[10px] font-bold text-soft">선택</span></div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {TAG_OPTIONS.map((t) => (
            <motion.button
              key={t}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleTag(t)}
              className="rounded-full px-[13px] py-[7px] text-[11.5px] font-extrabold"
              style={{
                background: tags.includes(t) ? 'linear-gradient(135deg, #C9B6FF, #F0A8C8)' : '#F6F1FB',
                color: tags.includes(t) ? '#FFFFFF' : '#8A76A0',
              }}
            >
              {t}
            </motion.button>
          ))}
        </div>

        <motion.button
          whileTap={canSave ? { scale: 0.97 } : undefined}
          onClick={onSave}
          className="mt-4 w-full rounded-[20px] py-[15px] text-sm font-black text-white"
          style={{
            background: canSave ? 'linear-gradient(135deg, #A48BD8, #C9B6FF)' : 'rgba(201,182,255,.35)',
            boxShadow: canSave ? '0 10px 26px rgba(140,110,190,.4)' : 'none',
            cursor: canSave ? 'pointer' : 'default',
          }}
        >
          일기 저장하기
        </motion.button>
      </div>

      <AnimatePresence>
        {savedFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
            className="mx-4 mt-3 flex items-center gap-[11px] rounded-[22px] bg-[linear-gradient(160deg,#EFE6FB,#FBEFF2)] px-[17px] py-[15px]"
          >
            <motion.img src={tammyHappy} alt="" className="pixelated w-[42px]" animate={{ y: [0, -6, 0] }} transition={{ duration: 1.3, repeat: Infinity }} />
            <span className="flex-1 text-[12.5px] font-extrabold leading-relaxed text-ink">{savedFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-4 mt-3 rounded-card bg-white px-5 py-[18px] shadow-card">
        <div className="text-[13px] font-black text-ink">지난 일기</div>
        {recent.length === 0 ? (
          <p className="mt-[11px] text-[11.5px] font-bold leading-relaxed text-soft">아직 작성한 일기가 없어요. 오늘의 한 줄부터 남겨볼까요?</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2.5">
            {recent.map((d) => (
              <div key={d.id} className="rounded-[18px] bg-surface-2 px-[14px] py-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">{d.mood.split(' ')[0]}</span>
                  <span className="text-[10.5px] font-black text-lavender-deep">{d.date}</span>
                </div>
                <div className="mt-1.5 text-xs font-bold leading-relaxed text-ink">{d.content}</div>
                {!!d.tags?.length && <div className="mt-1.5 text-[10px] font-extrabold text-soft">{d.tags.join(' ')}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useChat } from '../hooks/useChat';
import { useSpeechToText, useTextToSpeech } from '../hooks/useSpeech';
import tammyHero from '../assets/px-hero.png';

const QUICK_CHIPS = ['오늘 좀 힘들었어 😮‍💨', '산책 다녀올게 🍃', '고마워 타미 💕'];

export function ChatScreen() {
  const { messages, memories, typing, send } = useChat();
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const { listening, supported, toggle } = useSpeechToText(setDraft);
  const { speakingId, speak } = useTextToSpeech();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const onMic = () => {
    if (!supported) {
      setNotice('이 브라우저에서는 음성인식을 지원하지 않아 🥲 크롬이나 사파리에서 시도해 줘!');
      return;
    }
    toggle();
  };

  const onSend = async (text = draft) => {
    setDraft('');
    const reply = await send(text);
    if (reply && window.speechSynthesis) speak(reply.text, reply.id); // AI 답변 자동 읽기
  };

  const onSpeak = (text: string, id: string) => {
    if (!window.speechSynthesis) {
      setNotice('이 브라우저에서는 음성 읽기를 지원하지 않아 🥲');
      return;
    }
    speak(text, id);
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#F3EDFA] to-[#FDF3F0]">
      {/* header */}
      <header className="flex flex-none items-center gap-3 px-5 pb-3 pt-2.5">
        <div className="relative">
          <img src={tammyHero} alt="타미" className="pixelated h-11 w-11 rounded-3xl border-[2.5px] border-white bg-[#FDF6EC] object-cover shadow-[0_6px_14px_rgba(160,130,190,.25)]" />
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-[2.5px] border-[#F3EDFA] bg-[#7ED9A0]" />
        </div>
        <div className="flex-1">
          <h1 className="text-base font-black text-ink">타미</h1>
          <p className="text-[11.5px] font-bold text-lavender-deep">{listening ? '🎤 듣는 중…' : typing ? '입력 중…' : '언제나 네 편 · 온라인'}</p>
        </div>
        {memories.length > 0 && (
          <span className="rounded-full bg-[#EFE7FB] px-3 py-1.5 text-[11px] font-extrabold text-lavender-deep">💜 기억 {memories.length}개</span>
        )}
      </header>

      {/* messages */}
      <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 pb-3">
        <span className="self-center rounded-full bg-white/70 px-3.5 py-1.5 text-[11px] font-bold text-[#B39CC4]">오늘</span>
        {messages.map((m, i) => {
          const mine = m.role === 'user';
          const prev = messages[i - 1];
          const showAvatar = !mine && (!prev || prev.role === 'user');
          const speaking = speakingId === m.id;
          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={'flex items-end gap-2 ' + (mine ? 'justify-end' : 'justify-start') + (!mine && !showAvatar ? ' pl-10' : '')}>
              {showAvatar && <img src={tammyHero} alt="" className="pixelated h-8 w-8 flex-none rounded-2xl border-2 border-white bg-[#FDF6EC] object-cover" />}
              <div className={'max-w-[236px] px-[15px] py-[11px] text-sm font-semibold leading-relaxed ' + (mine ? 'rounded-[20px_20px_6px_20px] bg-gradient-to-br from-lavender-deep to-lavender text-white shadow-[0_6px_16px_rgba(140,110,190,.35)]' : 'rounded-[20px_20px_20px_6px] bg-white text-ink shadow-[0_4px_12px_rgba(160,130,190,.14)]')}>
                {m.text}
              </div>
              {!mine && (
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => onSpeak(m.text, m.id)}
                  animate={speaking ? { opacity: [1, 0.45, 1] } : { opacity: 1 }}
                  transition={speaking ? { duration: 1, repeat: Infinity } : {}}
                  className={'mb-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-2xl shadow-[0_3px_8px_rgba(160,130,190,.2)] ' + (speaking ? 'bg-gradient-to-br from-lavender-deep to-lavender' : 'bg-white/85')}
                  aria-label="음성으로 듣기"
                >
                  <SpeakerIcon color={speaking ? '#FFF' : '#B9A8C9'} />
                </motion.button>
              )}
            </motion.div>
          );
        })}
        {typing && (
          <div className="flex items-end gap-2">
            <motion.img src={tammyHero} alt="" className="pixelated h-8 w-8 rounded-2xl border-2 border-white bg-[#FDF6EC] object-cover" animate={{ y: [0, -5, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />
            <div className="flex gap-1.5 rounded-[20px_20px_20px_6px] bg-white px-4 py-[13px] shadow-[0_4px_12px_rgba(160,130,190,.15)]">
              {[0, 1, 2].map((d) => (
                <motion.span key={d} className="h-[7px] w-[7px] rounded-full bg-lavender" animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 1.1, delay: d * 0.22, repeat: Infinity }} />
              ))}
            </div>
          </div>
        )}
        <AnimatePresence>
          {notice && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setNotice(null)} className="self-center rounded-2xl bg-butter/70 px-4 py-2 text-[11.5px] font-extrabold text-[#8A6A2E]">
              {notice}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* listening wave */}
      <AnimatePresence>
        {listening && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} className="mx-5 mb-2.5 flex flex-none items-center gap-3.5 rounded-3xl bg-gradient-to-br from-space-light to-[#8B76B8] px-[18px] py-3.5 shadow-[0_12px_30px_rgba(110,90,150,.4)]">
            <div className="flex h-[26px] flex-1 items-center gap-[3px]">
              {Array.from({ length: 18 }).map((_, i) => (
                <motion.span key={i} className="h-full flex-1 rounded-[3px] bg-[#D8C9F0]" animate={{ scaleY: [0.35, 1, 0.35] }} transition={{ duration: 0.9, delay: i * 0.07, repeat: Infinity }} />
              ))}
            </div>
            <span className="text-xs font-extrabold text-[#E4D9F5]">듣는 중…</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* input */}
      <div className="flex-none px-5 pb-[110px]">
        <div className="flex gap-2 overflow-x-auto pb-2.5">
          {QUICK_CHIPS.map((c) => (
            <motion.button key={c} whileTap={{ scale: 0.95 }} onClick={() => onSend(c)} className="flex-none rounded-full bg-white/85 px-3.5 py-2 text-xs font-extrabold text-[#8A76A0] shadow-[0_4px_10px_rgba(160,130,190,.12)]">
              {c}
            </motion.button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-[28px] bg-white py-[7px] pl-[18px] pr-2 shadow-[0_10px_26px_rgba(160,130,190,.2)]">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
            placeholder={listening ? '말해 보세요, 듣고 있어요…' : '타미에게 이야기해 보세요'}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-soft"
          />
          {/* 마이크 — 듣는 중 Pulse */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onMic}
            animate={listening ? { boxShadow: ['0 0 0 0px rgba(160,130,190,.35)', '0 0 0 9px rgba(160,130,190,0)'] } : {}}
            transition={listening ? { duration: 1.1, repeat: Infinity } : {}}
            className={'flex h-10 w-10 flex-none items-center justify-center rounded-[22px] ' + (listening ? 'bg-gradient-to-br from-[#8B76B8] to-lavender-deep' : 'bg-[#F3EDFA]')}
            aria-label="음성 입력"
          >
            <MicIcon color={listening ? '#FFF' : '#9B85D6'} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => onSend()} className="flex h-10 w-10 flex-none items-center justify-center rounded-[22px] bg-gradient-to-br from-lavender to-pink shadow-[0_5px_14px_rgba(160,130,190,.4)]" aria-label="보내기">
            <SendIcon />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

const MicIcon = ({ color }: { color: string }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><path d="M12 19v4" />
  </svg>
);
const SpeakerIcon = ({ color }: { color: string }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

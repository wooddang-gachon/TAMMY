import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useVoiceInteraction, type VoiceErrorKind } from '../hooks/useVoiceInteraction';
import tammyHero from '../assets/px-hero.png';
import tammyHappy from '../assets/px-happy.png';

/**
 * TAMMY 음성 상호작용 — 전체 오버레이.
 * idle(트리거 버튼) → permission → listening(실시간 자막+파형) → processing → confirm(수정 가능)
 * → responding(타미가 답함) → finished(계속 말하기 제안) / error(친근한 복구 문구)
 *
 * "말하는 도구"가 아니라 "타미와 대화하는 느낌"을 목표로 함:
 * - 인식된 문장은 절대 자동 전송하지 않고 항상 확인 단계를 거침
 * - 에러 메시지는 기술 용어 없이 다정한 문장으로만 표시
 * - 응답 후에는 자동으로 다시 듣지 않고, 사용자가 원할 때만 이어 말하기
 */
interface Props {
  onSubmit: (text: string) => Promise<void> | void;
  onSpeak: (text: string, id: string, done?: () => void) => void;
}

const ERROR_COPY: Record<VoiceErrorKind, { title: string; desc: string; cta: string }> = {
  'no-speech': { title: '아직 아무 말도 못 들었어', desc: '준비되면 마이크를 살짝 눌러줘', cta: '다시 말하기' },
  denied: { title: '마이크 권한이 필요해', desc: '설정에서 마이크 접근을 허용해 주면 나랑 편하게 얘기할 수 있어', cta: '설정 확인하기' },
  network: { title: '지금은 음성 인식이 잠깐 안 돼', desc: '대신 타이핑으로 말해줄래?', cta: '알겠어' },
  noisy: { title: '음... 잘 안 들렸어', desc: '주변이 조금 시끄러운가봐, 다시 한 번 말해줄래?', cta: '다시 시도' },
  unsupported: { title: '이 브라우저에서는 아직 지원하지 않아', desc: '크롬이나 사파리 최신 버전에서 시도해줘', cta: '확인' },
};

export function VoiceInteraction({ onSubmit, onSpeak }: Props) {
  const [open, setOpen] = useState(false);
  const v = useVoiceInteraction({
    onSubmit,
    onSpeak: (text, done) => onSpeak(text, 'voice-reply', done),
  });

  const trigger = () => {
    setOpen(true);
    if (!v.permissionAsked) v.requestPermission();
    else v.beginListening();
  };

  const closeAll = () => { v.close(); setOpen(false); };

  return (
    <>
      {/* 트리거 — 홈 하단 큰 마이크(음성 우선 사용자에게 키보드보다 우선 노출) */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={trigger}
        aria-label="타미에게 말하기"
        className="flex h-10 w-10 flex-none items-center justify-center rounded-[22px] bg-[#F3EDFA]"
      >
        <MicIcon color="#9B85D6" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] flex flex-col justify-end bg-[#3B3154]/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="rounded-t-[32px] bg-cream px-6 pb-8 pt-5 shadow-[0_-20px_60px_rgba(90,70,130,.35)]"
            >
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[#E3D7EC]" />

              {v.state === 'permission' && (
                <PermissionStep
                  onAllow={() => v.beginListening()}
                  onLater={closeAll}
                />
              )}
              {v.state === 'listening' && (
                <ListeningStep liveText={v.liveText} seconds={v.seconds} onCancel={() => { v.cancel(); setOpen(false); }} onStop={v.stopAndConfirm} />
              )}
              {v.state === 'processing' && <ProcessingStep />}
              {v.state === 'confirm' && (
                <ConfirmStep
                  text={v.finalText}
                  onChange={v.editFinalText}
                  onDiscard={() => { v.discard(); setOpen(false); }}
                  onRetry={v.retry}
                  onSend={v.send}
                />
              )}
              {v.state === 'responding' && <RespondingStep />}
              {v.state === 'finished' && (
                <FinishedStep reply={v.tammyReply} onKeepTalking={v.keepTalking} onClose={closeAll} />
              )}
              {v.state === 'error' && v.errorKind && (
                <ErrorStep kind={v.errorKind} onRetry={v.retry} onClose={closeAll} />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── 상태별 화면 ──────────────────────────────────────────

function PermissionStep({ onAllow, onLater }: { onAllow: () => void; onLater: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <motion.img src={tammyHero} alt="타미" className="pixelated h-20 w-20" animate={{ y: [0, -6, 0] }} transition={{ duration: 2.4, repeat: Infinity }} />
      <div>
        <h2 className="text-base font-black text-ink">타미랑 목소리로 얘기해 볼까?</h2>
        <p className="mt-1.5 text-[13px] font-bold leading-relaxed text-muted">자연스럽게 대화하려면 마이크 권한이 필요해.<br />음성은 대화 중에만 사용되고 저장되지 않아.</p>
      </div>
      <button onClick={onAllow} className="w-full rounded-[20px] bg-gradient-to-br from-lavender to-pink py-3.5 text-sm font-black text-white shadow-[0_10px_24px_rgba(160,130,190,.4)]">허락할게 🎤</button>
      <button onClick={onLater} className="text-[12.5px] font-bold text-muted">나중에 할게</button>
    </div>
  );
}

function ListeningStep({ liveText, seconds, onCancel, onStop }: { liveText: string; seconds: number; onCancel: () => void; onStop: () => void }) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <motion.div
          className="absolute inset-0 -m-3 rounded-full bg-lavender/30"
          animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.15, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
        <motion.img src={tammyHero} alt="듣는 중" className="pixelated relative h-20 w-20" animate={{ y: [0, -5, 0] }} transition={{ duration: 1.2, repeat: Infinity }} />
      </div>
      <p className="text-[12px] font-extrabold text-lavender-deep">듣고 있어요 · {mm}:{ss}</p>

      {/* 실시간 파형 */}
      <div className="flex h-8 items-center gap-1">
        {Array.from({ length: 22 }).map((_, i) => (
          <motion.span
            key={i}
            className="w-[3px] rounded-full bg-gradient-to-b from-lavender to-pink"
            animate={{ height: [6, 10 + ((i * 37) % 22), 6] }}
            transition={{ duration: 0.6 + (i % 5) * 0.08, repeat: Infinity, delay: i * 0.03 }}
          />
        ))}
      </div>

      {/* 실시간 자막 */}
      <div className="min-h-[52px] w-full rounded-2xl bg-white px-4 py-3 text-center text-[14px] font-bold text-ink shadow-[0_4px_14px_rgba(160,130,190,.12)]">
        {liveText || <span className="text-soft">말을 시작해 봐…</span>}
      </div>

      <div className="mt-1 flex w-full gap-3">
        <button onClick={onCancel} className="flex-1 rounded-2xl bg-white py-3 text-[13px] font-black text-muted shadow-sm">취소</button>
        <button onClick={onStop} className="flex-1 rounded-2xl bg-gradient-to-br from-lavender to-pink py-3 text-[13px] font-black text-white shadow-[0_8px_20px_rgba(160,130,190,.35)]">말 끝냈어</button>
      </div>
    </div>
  );
}

function ProcessingStep() {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <motion.div className="h-10 w-10 rounded-full border-[3px] border-lavender/30 border-t-lavender-deep" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
      <p className="text-[13px] font-bold text-muted">타미가 듣고 있어…</p>
    </div>
  );
}

function ConfirmStep({ text, onChange, onDiscard, onRetry, onSend }: { text: string; onChange: (t: string) => void; onDiscard: () => void; onRetry: () => void; onSend: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-[12.5px] font-extrabold text-muted">이렇게 들었어, 맞아?</p>
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full resize-none rounded-2xl bg-white px-4 py-3 text-[14px] font-bold text-ink shadow-[0_4px_14px_rgba(160,130,190,.12)] outline-none focus:ring-2 focus:ring-lavender/40"
      />
      <div className="flex gap-2">
        <button onClick={onDiscard} className="flex-1 rounded-2xl bg-white py-3 text-[12.5px] font-black text-muted shadow-sm">삭제</button>
        <button onClick={onRetry} className="flex-1 rounded-2xl bg-white py-3 text-[12.5px] font-black text-muted shadow-sm">다시 말하기</button>
        <button onClick={onSend} className="flex-[1.4] rounded-2xl bg-gradient-to-br from-lavender to-pink py-3 text-[12.5px] font-black text-white shadow-[0_8px_20px_rgba(160,130,190,.35)]">이대로 보내기</button>
      </div>
    </div>
  );
}

function RespondingStep() {
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <motion.img src={tammyHappy} alt="타미가 답하는 중" className="pixelated h-16 w-16" animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
      <div className="flex gap-1.5">
        {[0, 1, 2].map((d) => (
          <motion.span key={d} className="h-2 w-2 rounded-full bg-lavender" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, delay: d * 0.2, repeat: Infinity }} />
        ))}
      </div>
    </div>
  );
}

function FinishedStep({ reply, onKeepTalking, onClose }: { reply: string; onKeepTalking: () => void; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <img src={tammyHappy} alt="" className="pixelated h-16 w-16" />
      <p className="rounded-2xl bg-white px-4 py-3 text-[13.5px] font-bold text-ink shadow-[0_4px_14px_rgba(160,130,190,.12)]">{reply}</p>
      <div className="flex w-full gap-3">
        <button onClick={onClose} className="flex-1 rounded-2xl bg-white py-3 text-[13px] font-black text-muted shadow-sm">그만할게</button>
        <button onClick={onKeepTalking} className="flex-1 rounded-2xl bg-gradient-to-br from-lavender to-pink py-3 text-[13px] font-black text-white shadow-[0_8px_20px_rgba(160,130,190,.35)]">계속 얘기할래 🎤</button>
      </div>
    </div>
  );
}

function ErrorStep({ kind, onRetry, onClose }: { kind: VoiceErrorKind; onRetry: () => void; onClose: () => void }) {
  const copy = ERROR_COPY[kind];
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="text-3xl">🥺</span>
      <div>
        <h3 className="text-[14px] font-black text-ink">{copy.title}</h3>
        <p className="mt-1 text-[12.5px] font-bold text-muted">{copy.desc}</p>
      </div>
      <div className="flex w-full gap-3">
        <button onClick={onClose} className="flex-1 rounded-2xl bg-white py-3 text-[13px] font-black text-muted shadow-sm">닫기</button>
        <button onClick={onRetry} className="flex-1 rounded-2xl bg-gradient-to-br from-lavender to-pink py-3 text-[13px] font-black text-white shadow-[0_8px_20px_rgba(160,130,190,.35)]">{copy.cta}</button>
      </div>
    </div>
  );
}

const MicIcon = ({ color }: { color: string }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <path d="M12 19v4" />
  </svg>
);

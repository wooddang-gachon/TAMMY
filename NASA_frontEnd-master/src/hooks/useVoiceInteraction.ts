import { useCallback, useEffect, useRef, useState } from 'react';

export type VoiceState =
  | 'idle'
  | 'permission'
  | 'listening'
  | 'processing'
  | 'confirm'
  | 'responding'
  | 'finished'
  | 'error';

export type VoiceErrorKind = 'no-speech' | 'denied' | 'network' | 'noisy' | 'unsupported';

interface UseVoiceInteractionOptions {
  /** 확정된 텍스트를 실제 전송(의도 감지 → 기록/대화)하는 콜백 */
  onSubmit: (text: string) => Promise<void> | void;
  /** 타미 응답을 소리 내어 읽어줄 때 사용 (TTS) */
  onSpeak?: (text: string, done: () => void) => void;
}

/**
 * TAMMY 음성 상호작용 상태머신.
 * idle → permission → listening(실시간 자막) → processing → confirm(수정 가능) → responding → finished
 * 언제든 error로 빠지고, retry로 listening 복귀 가능.
 */
export function useVoiceInteraction({ onSubmit, onSpeak }: UseVoiceInteractionOptions) {
  const [state, setState] = useState<VoiceState>('idle');
  const [liveText, setLiveText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [errorKind, setErrorKind] = useState<VoiceErrorKind | null>(null);
  const [tammyReply, setTammyReply] = useState('');
  const [permissionAsked, setPermissionAsked] = useState(false);

  const recRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<number>();
  const silenceRef = useRef<number>();

  const supported = !!(window.SpeechRecognition ?? window.webkitSpeechRecognition);

  const vibrate = (pattern: number | number[]) => navigator.vibrate?.(pattern);

  const stopTimer = () => { window.clearInterval(timerRef.current); };

  const buildRecognizer = useCallback(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return null;
    const rec = new SR();
    rec.lang = 'ko-KR';
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setLiveText(text);
      window.clearTimeout(silenceRef.current);
      // 3초 무음이면 자동으로 인식 종료 → 확정
      silenceRef.current = window.setTimeout(() => finishListening(text), 1600);
    };
    rec.onerror = (e: { error: string }) => {
      stopTimer();
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') fail('denied');
      else if (e.error === 'no-speech') fail('no-speech');
      else if (e.error === 'network') fail('network');
      else fail('noisy');
    };
    rec.onend = () => {};
    return rec;
  }, []);

  const requestPermission = useCallback(() => {
    setPermissionAsked(true);
    setState('permission');
  }, []);

  const beginListening = useCallback(() => {
    if (!supported) { setState('error'); setErrorKind('unsupported'); return; }
    const rec = buildRecognizer();
    if (!rec) return;
    recRef.current = rec;
    setLiveText('');
    setSeconds(0);
    try {
      rec.start();
      setState('listening');
      vibrate(15);
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      fail('denied');
    }
  }, [buildRecognizer, supported]);

  const finishListening = (text: string) => {
    stopTimer();
    window.clearTimeout(silenceRef.current);
    try { recRef.current?.stop(); } catch { /* noop */ }
    const trimmed = text.trim();
    if (!trimmed) { fail('no-speech'); return; }
    vibrate(20);
    setState('processing');
    // 짧은 처리 연출 후 확인 단계로 (실제로는 STT 최종화/의도 사전분석 등)
    window.setTimeout(() => {
      setFinalText(trimmed);
      setState('confirm');
    }, 500);
  };

  const cancel = useCallback(() => {
    stopTimer();
    window.clearTimeout(silenceRef.current);
    try { recRef.current?.stop(); } catch { /* noop */ }
    setLiveText('');
    setState('idle');
  }, []);

  const stopAndConfirm = useCallback(() => finishListening(liveText), [liveText]);

  const editFinalText = (text: string) => setFinalText(text);

  const retry = useCallback(() => {
    setErrorKind(null);
    setFinalText('');
    setLiveText('');
    beginListening();
  }, [beginListening]);

  const send = useCallback(async () => {
    if (!finalText.trim()) return;
    setState('responding');
    await onSubmit(finalText);
    // 데모용 응답 — 실제로는 onSubmit 결과(채팅 마지막 타미 메시지)를 받아와야 함
    const reply = '알겠어! 잘 기록해 뒀어 😊';
    setTammyReply(reply);
    if (onSpeak) {
      onSpeak(reply, () => setState('finished'));
    } else {
      window.setTimeout(() => setState('finished'), 900);
    }
  }, [finalText, onSubmit, onSpeak]);

  const discard = useCallback(() => {
    setFinalText('');
    setLiveText('');
    setState('idle');
  }, []);

  const keepTalking = useCallback(() => {
    // 연속 대화: 응답 끝나면 다시 듣기 (사용자가 명시적으로 탭)
    setTammyReply('');
    beginListening();
  }, [beginListening]);

  const fail = (kind: VoiceErrorKind) => {
    setErrorKind(kind);
    setState('error');
  };

  useEffect(() => () => { stopTimer(); try { recRef.current?.stop(); } catch { /* noop */ } }, []);

  return {
    state, liveText, finalText, seconds, errorKind, tammyReply, supported, permissionAsked,
    requestPermission, beginListening, cancel, stopAndConfirm, editFinalText, retry, send, discard, keepTalking,
    close: () => setState('idle'),
  };
}

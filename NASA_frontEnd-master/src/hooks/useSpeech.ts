import { useCallback, useEffect, useRef, useState } from 'react';

/** STT — Web Speech API (ko-KR). 미지원 브라우저에서는 supported=false */
export function useSpeechToText(onResult: (text: string) => void) {
  const recRef = useRef<SpeechRecognition | null>(null);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.lang = 'ko-KR';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let t = '';
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      onResult(t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    return () => rec.abort();
  }, [onResult]);

  const toggle = useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    if (listening) { rec.stop(); setListening(false); }
    else { try { rec.start(); setListening(true); } catch { /* already started */ } }
  }, [listening]);

  return { listening, supported, toggle };
}

/** TTS — SpeechSynthesis (ko-KR) */
export function useTextToSpeech() {
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const speak = useCallback((text: string, id: string) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (speakingId === id) { synth.cancel(); setSpeakingId(null); return; }
    synth.cancel();
    const clean = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '');
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'ko-KR';
    u.rate = 1.02;
    u.pitch = 1.15;
    u.onend = () => setSpeakingId(null);
    u.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    synth.speak(u);
  }, [speakingId]);

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeakingId(null);
  }, []);

  return { speakingId, speak, cancel };
}

// ---- Web Speech API 타입 보강 ----
declare global {
  interface Window {
    SpeechRecognition?: { new (): SpeechRecognition };
    webkitSpeechRecognition?: { new (): SpeechRecognition };
  }
  interface SpeechRecognition extends EventTarget {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    onresult: ((e: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    onerror: ((e: { error: string }) => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
  }
  interface SpeechRecognitionEvent {
    results: { [i: number]: { [i: number]: { transcript: string } }; length: number };
  }
}

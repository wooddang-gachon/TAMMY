import { useRef, useState } from 'react';

/**
 * VoiceButton — 실제 오디오 캡처 기반 STT
 * navigator.mediaDevices.getUserMedia() → MediaRecorder → Whisper API → text → onResult(text)
 *
 * Web Speech API(useSpeech.ts)와 달리 실제 오디오 blob을 서버(Whisper)로 전송하는 경로.
 * 브라우저 호환성이 넓고(사파리 포함) 서버에서 원하는 STT 모델을 자유롭게 교체할 수 있다.
 */
interface Props {
  onResult: (text: string) => void;
  disabled?: boolean;
}

type Status = 'idle' | 'recording' | 'transcribing' | 'error';

const WHISPER_ENDPOINT = import.meta.env.VITE_WHISPER_API_URL ?? '/api/voice/transcribe';

export function VoiceButton({ onResult, disabled }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const start = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => transcribe(new Blob(chunksRef.current, { type: mime }));
      recorder.start();
      recorderRef.current = recorder;
      setStatus('recording');
    } catch (err) {
      setStatus('error');
      setErrorMsg(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? '마이크 권한이 필요해요. 브라우저 설정에서 허용해 주세요 🎤'
          : '마이크를 사용할 수 없어요. 다른 브라우저에서 시도해 주세요.',
      );
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setStatus('transcribing');
  };

  // MediaRecorder blob → Whisper API → 텍스트 → 채팅 입력에 반영
  const transcribe = async (blob: Blob) => {
    try {
      const form = new FormData();
      form.append('audio', blob, 'voice.webm');
      form.append('language', 'ko');
      const res = await fetch(WHISPER_ENDPOINT, { method: 'POST', body: form });
      if (!res.ok) throw new Error('transcribe failed');
      const { text } = (await res.json()) as { text: string };
      onResult(text);
      setStatus('idle');
    } catch {
      setStatus('error');
      setErrorMsg('음성을 텍스트로 바꾸지 못했어요. 다시 말해 줄래?');
    }
  };

  const onClick = () => {
    if (disabled) return;
    if (status === 'recording') stop();
    else if (status === 'idle' || status === 'error') start();
  };

  return (
    <div className="relative flex-none">
      <button
        onClick={onClick}
        disabled={status === 'transcribing'}
        aria-label="음성 입력"
        className={
          'flex h-10 w-10 items-center justify-center rounded-[22px] transition-all ' +
          (status === 'recording'
            ? 'animate-pulse bg-gradient-to-br from-[#8B76B8] to-lavender-deep'
            : status === 'transcribing'
              ? 'bg-[#F3EDFA] opacity-60'
              : 'bg-[#F3EDFA]')
        }
      >
        {status === 'transcribing' ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-lavender-deep/30 border-t-lavender-deep" />
        ) : (
          <MicIcon color={status === 'recording' ? '#FFF' : '#9B85D6'} />
        )}
      </button>
      {errorMsg && (
        <div className="absolute bottom-12 right-0 w-52 rounded-2xl bg-[#5C4A66] px-3 py-2 text-[11px] font-bold leading-relaxed text-white shadow-lg">
          {errorMsg}
        </div>
      )}
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

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../types';
import { api } from '../api/client';
import { initialMessages } from '../mocks/chat';

const CHAT_KEY = 'tammy.chat.v1';
const MEM_KEY = 'tammy.memories.v1';

/** TAMMY 대화 + 장기기억. POST /chat 만 연결하면 그대로 동작 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem(CHAT_KEY);
      if (raw) { const arr = JSON.parse(raw); if (Array.isArray(arr) && arr.length) return arr; }
    } catch { /* ignore */ }
    return initialMessages;
  });
  const [memories, setMemories] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(MEM_KEY) ?? '[]'); } catch { return []; }
  });
  const [typing, setTyping] = useState(false);
  const idRef = useRef(0);

  useEffect(() => { localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-80))); }, [messages]);
  useEffect(() => { localStorage.setItem(MEM_KEY, JSON.stringify(memories.slice(-40))); }, [memories]);

  const send = useCallback(async (text: string): Promise<(ChatMessage & { gainedFuel: number | null }) | null> => {
    const trimmed = text.trim();
    if (!trimmed) return null;
    const userMsg: ChatMessage = { id: 'u' + Date.now() + idRef.current++, role: 'user', text: trimmed, createdAt: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setTyping(true);
    try {
      const history = messages.slice(-14).map((m) => ({ role: m.role, text: m.text }));
      const { reply, memory, gainedFuel } = await api.chat(trimmed, history, memories);
      const tammyMsg: ChatMessage = { id: 't' + Date.now() + idRef.current++, role: 'tammy', text: reply, createdAt: Date.now() };
      setMessages((m) => [...m, tammyMsg]);
      if (memory) setMemories((ms) => (ms.includes(memory) ? ms : [...ms, memory]));
      return { ...tammyMsg, gainedFuel };
    } finally {
      setTyping(false);
    }
  }, [messages, memories]);

  return { messages, memories, typing, send };
}

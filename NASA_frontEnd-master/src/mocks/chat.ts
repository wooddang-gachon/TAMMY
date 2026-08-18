import type { ChatMessage } from '../types';

export const initialMessages: ChatMessage[] = [
  { id: 'm1', role: 'tammy', text: '오늘 하루 어땠어? 무슨 일이 있었는지 들려줄래? 🌱', createdAt: Date.now() - 60000 },
];

/** Mock 응답 — POST /chat 연결 전까지 사용 */
export function mockReply(text: string): string {
  if (text.includes('고마')) return '헤헤, 나도 고마워! 함께라서 매일이 반짝반짝해 💕';
  if (text.includes('산책')) return '좋아! 다녀오면 연료 +5! 조심히 다녀와 🍃';
  if (text.includes('힘들') || text.includes('피곤')) return '오늘 정말 수고했어. 괜찮아, 나는 언제나 네 편이야 ☁️';
  if (text.includes('슬')) return '많이 속상했구나… 내가 꼭 안아줄게. 천천히 이야기해 줘 💗';
  return '응응, 듣고 있어! 조금 더 이야기해 줄래?';
}

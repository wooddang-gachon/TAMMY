import type { AuthUser } from './types';
import { setCurrentUserId } from './_storage';

const SESSION_KEY = 'tammy.auth.demo-user.v1';
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function readSession(): AuthUser | null {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null');
  } catch {
    return null;
  }
}

function writeSession(user: AuthUser | null) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
  // 로그인한 사용자의 id로 이후 모든 api/*.ts 호출의 userId 네임스페이스가 바뀐다.
  // 로그아웃하면 데모 사용자(demo-user)로 되돌아간다 — 앱은 로그인 없이도 계속 쓸 수 있다.
  setCurrentUserId(user ? String(user.id) : null);
}

/**
 * 데모 인증(로컬 전용) — 실제 백엔드(POST /auth/login 등, src/api/client.ts + useAuth.tsx)가
 * 연결된 뒤에도, 이 환경에 DB가 없거나 오프라인일 때 앱을 계속 써볼 수 있도록 남겨둔 fallback이다.
 * useAuth.tsx의 loginDemo()에서만 호출되며, 진짜 로그인 경로(useAuth.login/signup)는 이 모듈을 거치지 않는다.
 */
export const demoAuthApi = {
  async login(nickname: string): Promise<AuthUser> {
    await delay(300);
    const existing = readSession();
    const user: AuthUser = existing
      ? { ...existing, nickname }
      : { id: 'demo-' + Date.now().toString(36), email: `${nickname}@demo.local`, nickname, isReal: false };
    writeSession(user);
    return user;
  },
  async logout(): Promise<void> {
    await delay(100);
    writeSession(null);
  },
  async me(): Promise<AuthUser | null> {
    return readSession();
  },
};

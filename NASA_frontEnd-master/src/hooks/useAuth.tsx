import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthUser } from '../api/types';
import { demoAuthApi } from '../api/auth';
import { setCurrentUserId } from '../api/_storage';
import { api } from '../api/client';

interface AuthContextValue {
  /** 로그인하지 않았으면 null(데모 사용자로 계속 이용 가능) */
  user: AuthUser | null;
  loading: boolean;
  /** 실제 백엔드 POST /auth/login */
  login: (email: string, password: string) => Promise<void>;
  /** 실제 백엔드 POST /auth/signup */
  signUp: (email: string, password: string, nickname: string) => Promise<void>;
  /** 백엔드(또는 이 환경의 DB) 없이도 앱을 계속 써볼 수 있는 로컬 전용 데모 로그인 */
  loginDemo: (nickname: string) => Promise<void>;
  logout: () => void;
  /** 가장 최근 로그인/회원가입 시도의 에러 메시지(백엔드 message 그대로) */
  authError: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** GET /users/me 응답을 화면이 쓰는 AuthUser 형태로 합친다 */
function mergeMeIntoUser(prev: AuthUser, me: Awaited<ReturnType<typeof api.getMe>>): AuthUser {
  return {
    ...prev,
    id: me.userId,
    nickname: me.nickname,
    createdAt: me.createdAt ? String(me.createdAt) : prev.createdAt,
    currentFuel: me.currentFuel ?? prev.currentFuel,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        // 이전 세션의 실제 토큰이 남아있으면 GET /users/me로 복원을 시도한다.
        try {
          const me = await api.getMe();
          const real: AuthUser = { id: me.userId, email: '', nickname: me.nickname, isReal: true, createdAt: me.createdAt ? String(me.createdAt) : undefined, currentFuel: me.currentFuel };
          setCurrentUserId(String(me.userId));
          setUser(real);
          setLoading(false);
          return;
        } catch {
          // 토큰 만료/DB 불가 등 — 세션을 지우고 데모 경로로 폴백한다.
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      const demoUser = await demoAuthApi.me();
      setUser(demoUser);
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    try {
      const { user: authUser } = await api.login(email, password);
      let merged: AuthUser = { id: authUser.id, email: authUser.email, nickname: authUser.nickname, authProvider: authUser.authProvider, isReal: true };
      try {
        const me = await api.getMe();
        merged = mergeMeIntoUser(merged, me);
      } catch {
        // /users/me가 실패해도(DB 지연 등) 로그인 자체는 유효하므로 계속 진행한다.
      }
      setCurrentUserId(String(authUser.id));
      setUser(merged);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
      throw err;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, nickname: string) => {
    setAuthError(null);
    try {
      const { user: authUser } = await api.signUp(email, password, nickname);
      const merged: AuthUser = { id: authUser.id, email: authUser.email, nickname: authUser.nickname, authProvider: authUser.authProvider, isReal: true };
      setCurrentUserId(String(authUser.id));
      setUser(merged);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
      throw err;
    }
  }, []);

  const loginDemo = useCallback(async (nickname: string) => {
    setAuthError(null);
    const u = await demoAuthApi.login(nickname);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    demoAuthApi.logout();
    setCurrentUserId(null);
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, signUp, loginDemo, logout, authError }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

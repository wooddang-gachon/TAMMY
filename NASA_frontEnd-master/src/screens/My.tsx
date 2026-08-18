import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useAffinity } from '../hooks/useAffinity';
import tammyHero from '../assets/px-hero.png';

const BADGES = [
  { emoji: '🌱', name: '첫 만남', on: true, bg: '#E9F6EE' },
  { emoji: '💧', name: '물 마스터', on: true, bg: '#EAF5FD' },
  { emoji: '🚀', name: '첫 여행', on: true, bg: '#F6F1FB' },
  { emoji: '⭐', name: '타미별', on: false, bg: '#FAF6FC' },
];

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative h-[26px] w-[46px] flex-none rounded-full border-none transition-colors"
      style={{ background: on ? 'linear-gradient(135deg, #C9B6FF, #F0A8C8)' : '#EAE3F2' }}
    >
      <motion.div className="absolute top-[3px] h-5 w-5 rounded-full bg-white shadow" animate={{ left: on ? 23 : 3 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
    </button>
  );
}

/** My — TAMMY v4 "마이" 화면: 프로필 · 친밀도/스트릭/별 · 배지 · 설정 */
export function MyScreen() {
  const { user, login, signUp, loginDemo, logout, authError } = useAuth();
  const { affinity, stage } = useAffinity();
  const [notif, setNotif] = useState(true);
  const [dnd, setDnd] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const days = user?.createdAt ? Math.max(1, Math.round((Date.now() - new Date(user.createdAt).getTime()) / 86400000)) : 87;

  const submit = async () => {
    if (!email.trim() || !password.trim() || (mode === 'signup' && !nickname.trim())) return;
    setSubmitting(true);
    try {
      if (mode === 'login') await login(email.trim(), password);
      else await signUp(email.trim(), password, nickname.trim());
    } catch {
      // authError 상태로 이미 노출됨
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-[110px] pt-1.5">
      <div className="px-[22px] pt-1">
        <h1 className="text-2xl font-black tracking-tight text-ink">마이</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} className="mx-4 mt-4 flex items-center gap-[15px] rounded-[28px] bg-[linear-gradient(165deg,#EFE6FB,#FBEFF2)] px-5 py-5 shadow-[0_10px_28px_rgba(160,130,190,.16)]">
        <img src={tammyHero} alt="" className="pixelated h-[62px] w-[62px] flex-none rounded-[32px] border-[3px] border-white bg-[#FDF6EC] object-cover shadow-[0_8px_20px_rgba(160,130,190,.3)]" />
        <div className="flex-1">
          <div className="text-[17px] font-black text-ink">{user?.nickname ?? '세은'}</div>
          <div className="mt-[3px] text-xs font-bold text-lavender-deep">타미와 함께한 지 {days}일째 💜</div>
        </div>
        <button className="flex-none rounded-full bg-white/80 px-3.5 py-2 text-xs font-extrabold text-[#8A76A0]">편집</button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="mx-4 mt-3.5 grid grid-cols-3 gap-2.5">
        <div className="rounded-[22px] bg-white px-2.5 py-3.5 text-center shadow-[0_8px_20px_rgba(160,130,190,.12)]">
          <div className="text-[17px]">{stage.emoji}</div>
          <div className="mt-1 text-[15px] font-black text-ink">{stage.name}</div>
          <div className="text-[10.5px] font-bold text-muted">친밀도 {affinity}</div>
        </div>
        <div className="rounded-[22px] bg-white px-2.5 py-3.5 text-center shadow-[0_8px_20px_rgba(160,130,190,.12)]">
          <div className="text-[17px]">🔥</div>
          <div className="mt-1 text-[15px] font-black text-ink">21일</div>
          <div className="text-[10.5px] font-bold text-muted">연속 기록</div>
        </div>
        <div className="rounded-[22px] bg-white px-2.5 py-3.5 text-center shadow-[0_8px_20px_rgba(160,130,190,.12)]">
          <div className="text-[17px]">⭐</div>
          <div className="mt-1 text-[15px] font-black text-ink">3개</div>
          <div className="text-[10.5px] font-bold text-muted">방문한 별</div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mx-4 mt-3.5 rounded-card bg-white px-5 py-[18px] shadow-card">
        <span className="text-[15px] font-black text-ink">달성 배지</span>
        <div className="mt-3 flex gap-2.5">
          {BADGES.map((b) => (
            <div key={b.name} className="flex flex-1 flex-col items-center gap-[5px] rounded-[20px] px-1 pb-2.5 pt-[13px] text-center" style={{ background: b.bg, border: b.on ? 'none' : '1.5px dashed #E3D7EC' }} title={b.name}>
              <span className="text-xl" style={{ filter: b.on ? 'none' : 'grayscale(1) opacity(.4)' }}>{b.emoji}</span>
              <span className="text-[9.5px] font-extrabold" style={{ color: b.on ? '#7B65A0' : '#8A76A0' }}>{b.name}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="mx-4 mt-3.5 rounded-card bg-white px-5 py-2 shadow-card">
        <div className="flex items-center justify-between border-b border-[#F5EEF7] py-[13px]">
          <div className="flex items-center gap-[11px]"><span className="text-[15px]">🔔</span><span className="text-sm font-extrabold text-ink">알림</span></div>
          <Toggle on={notif} onClick={() => setNotif((v) => !v)} />
        </div>
        <div className="flex items-center justify-between border-b border-[#F5EEF7] py-[13px]">
          <div className="flex items-center gap-[11px]"><span className="text-[15px]">🌙</span><span className="text-sm font-extrabold text-ink">방해 금지</span></div>
          <Toggle on={dnd} onClick={() => setDnd((v) => !v)} />
        </div>
        <div className="flex items-center justify-between py-[13px]">
          <div className="flex items-center gap-[11px]"><span className="text-[15px]">🎨</span><span className="text-sm font-extrabold text-ink">테마</span></div>
          <div className="flex items-center gap-[7px]">
            <span className="text-xs font-bold text-soft">라벤더 드림</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C3B3D2" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="mx-4 mt-3.5 flex items-center gap-3 rounded-[24px] bg-[linear-gradient(135deg,#6B5B8E,#8B76B8)] px-[18px] py-[15px] shadow-[0_12px_30px_rgba(110,90,150,.35)]">
        <img src={tammyHero} alt="" className="pixelated h-11 w-11 flex-none rounded-3xl border-[2.5px] border-white/50 bg-[#FDF6EC] object-cover" />
        <p className="text-[12.5px] font-extrabold leading-relaxed text-[#F0E9FA]">타미는 언제나 너의 편이야! 💞<br />함께 공감하고, 성장하고, 여행하자.</p>
      </motion.div>

      {/* 계정 — 실제 백엔드(POST /auth/login, /auth/signup) 인증 */}
      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mx-4 mt-3.5 rounded-card bg-white px-5 py-[18px] shadow-card">
        {user?.isReal ? (
          <button onClick={logout} className="w-full rounded-widget bg-surface py-3 text-[13px] font-black text-[#8A76A0]">로그아웃</button>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-soft">
                {user ? '지금은 데모 계정으로 이용 중이에요.' : '로그인하면 기록을 안전하게 보관해요.'}
              </p>
              <button onClick={() => setMode((m) => (m === 'login' ? 'signup' : 'login'))} className="flex-none text-[11px] font-black text-lavender-deep">
                {mode === 'login' ? '회원가입' : '로그인'}
              </button>
            </div>
            <div className="mt-2.5 flex flex-col gap-2">
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" type="email" className="rounded-xl bg-surface p-3 text-sm text-ink outline-none" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 (8자 이상)" type="password" className="rounded-xl bg-surface p-3 text-sm text-ink outline-none" />
              {mode === 'signup' && (
                <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="닉네임" className="rounded-xl bg-surface p-3 text-sm text-ink outline-none" />
              )}
            </div>
            {authError && <p className="mt-2 text-[11px] font-bold text-pink-deep">{authError}</p>}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={submit}
              className="mt-2.5 w-full rounded-[18px] bg-gradient-to-br from-lavender to-pink py-3 text-[13px] font-black text-white disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? '처리 중…' : mode === 'login' ? '로그인' : '회원가입'}
            </motion.button>
            {!user && (
              <button onClick={() => loginDemo('세은')} className="mt-2 w-full text-center text-[11px] font-bold text-soft underline">
                데모로 계속하기
              </button>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}

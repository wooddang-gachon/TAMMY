import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useLayoutEffect, useRef } from 'react';
import type { Planet } from './types';
import { floatPlanet } from '../../animations/planetAnimations';

const SPRING = { type: 'spring' as const, stiffness: 220, damping: 26 };

/**
 * 행성 캐러셀 — 목적지 "선택"만 담당한다(여행은 여기서 시작하지 않는다).
 * 가로 스와이프로 중앙에 오는 행성이 선택 후보이며, 탭하면 onSelectDestination이 호출된다.
 * 실제 여행 시작은 상위 화면의 "여행하기" 버튼(또는 중앙 행성 재탭)에서만 일어난다.
 *
 * 중앙 행성의 부유 효과는 GSAP이 전담한다 — framer-motion과 같은 엘리먼트의
 * transform을 동시에 건드리지 않도록, 행성 본체 <img>만 GSAP 전담으로 두고
 * 바깥 <motion.button>은 기존 위치/스케일/블러 로직을 그대로 유지한다.
 *
 * onRegisterPlanetEl로 각 행성 <img>의 실제 DOM 엘리먼트를 상위(StarTravelScene)에 등록한다 —
 * 발사 타임라인이 getBoundingClientRect()로 "진짜" 목적지 좌표를 읽기 위함이다.
 * lockedId/lockPulseId는 PHASE 1(TARGET LOCK) 연출 전용 상태다.
 */
export function PlanetCarousel({
  planets, index, selectedId, progress, lockedId, lockPulseId, onIndexChange, onSelectDestination, onRegisterPlanetEl,
}: {
  planets: Planet[];
  index: number;
  selectedId: string | null;
  progress: Record<string, { distance: number }>;
  /** 발사 시퀀스가 진행 중인 동안(락~비행~도착) 지속되는 타깃 id — 다른 행성을 어둡게 만든다 */
  lockedId?: string | null;
  /** PHASE 1의 짧은 orbit/glow 펄스를 한 번 재생시키는 id */
  lockPulseId?: string | null;
  onIndexChange: (i: number) => void;
  onSelectDestination: (planet: Planet) => void;
  onRegisterPlanetEl?: (id: string, el: HTMLElement | null) => void;
}) {
  const CARD = 132;
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRefs = useRef(new Map<string, HTMLImageElement>());

  // 중앙 행성에만 부유 효과 — 선택되지 않은 행성은 애초에 대상이 아니므로 과도하게 움직이지 않는다.
  useLayoutEffect(() => {
    const el = imgRefs.current.get(planets[index]?.id);
    if (!el || !containerRef.current) return;
    const ctx = gsap.context(() => {
      floatPlanet(el, { amplitude: 5, duration: 3.6 });
    }, containerRef);
    return () => {
      ctx.revert();
      gsap.set(el, { y: 0 });
    };
  }, [index, planets]);

  return (
    <div ref={containerRef} className="overflow-hidden">
      <motion.div
        className="flex items-center will-change-transform"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.14}
        onDragEnd={(_, info) => {
          if (info.offset.x < -30) onIndexChange(Math.min(planets.length - 1, index + 1));
          else if (info.offset.x > 30) onIndexChange(Math.max(0, index - 1));
        }}
        animate={{ x: 149 - index * CARD }}
        transition={SPRING}
      >
        {planets.map((p, i) => {
          const isCenter = i === index;
          const isSelected = p.id === selectedId;
          const isLocked = !!lockedId && lockedId === p.id;
          const isDimmedByLock = !!lockedId && lockedId !== p.id;
          const isLockPulse = !!lockPulseId && lockPulseId === p.id;
          const dist = progress[p.id]?.distance ?? 100;
          const done = dist <= 0;
          return (
            <motion.button
              key={p.id}
              onClick={() => (isCenter ? onSelectDestination(p) : onIndexChange(i))}
              className="flex-none text-center"
              style={{ width: CARD }}
              animate={{
                scale: isDimmedByLock ? (isCenter ? 0.86 : 0.62) : isLocked ? 1.06 : isCenter ? 1 : 0.72,
                opacity: isDimmedByLock ? 0.22 : isCenter ? 1 : 0.5,
                filter: isDimmedByLock ? 'blur(2px)' : isCenter ? 'blur(0px)' : 'blur(1px)',
              }}
              transition={SPRING}
            >
              <div className="relative mx-auto flex items-center justify-center" style={{ width: isCenter ? 92 : 68, height: isCenter ? 92 : 68 }}>
                {/* PHASE 1 — TARGET LOCK: 짧게 한 번 터지는 orbit/glow 펄스 */}
                {isLockPulse && (
                  <motion.span
                    key={`lock-pulse-${p.id}`}
                    className="absolute rounded-full border-2"
                    style={{ inset: '-22%', borderColor: p.accent }}
                    initial={{ scale: 0.55, opacity: 0.95 }}
                    animate={{ scale: 1.35, opacity: 0 }}
                    transition={{ duration: 0.42, ease: 'easeOut' }}
                  />
                )}
                {/* 선택 표시 링 */}
                {isSelected && (
                  <motion.span
                    className="absolute rounded-full border-2"
                    style={{ inset: '-10%', borderColor: p.accent }}
                    animate={{ scale: isLocked ? [1, 1.1, 1] : [1, 1.06, 1], opacity: [0.9, 0.5, 0.9] }}
                    transition={{ duration: isLocked ? 0.9 : 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                {/* 링 회전 */}
                <motion.span
                  className="absolute rounded-[50%] border-2 will-change-transform"
                  style={{
                    inset: '32% -16%',
                    borderTopColor: 'transparent',
                    borderRightColor: `${p.accent}${isCenter ? 'cc' : '55'}`,
                    borderBottomColor: `${p.accent}${isCenter ? 'cc' : '55'}`,
                    borderLeftColor: `${p.accent}${isCenter ? 'cc' : '55'}`,
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: isCenter ? 14 : 26, repeat: Infinity, ease: 'linear' }}
                />
                {/* 행성 본체 — GSAP 전담(부유 효과 + PHASE 6 확대). framer-motion animate는 여기 걸지 않는다. */}
                <img
                  ref={(el) => {
                    if (el) imgRefs.current.set(p.id, el);
                    else imgRefs.current.delete(p.id);
                    onRegisterPlanetEl?.(p.id, el);
                  }}
                  src={p.image}
                  alt={p.name}
                  className="h-full w-full object-contain will-change-transform"
                  style={{
                    filter: isLocked
                      ? `drop-shadow(0 0 26px ${p.accent}) drop-shadow(0 0 46px ${p.accent}aa)`
                      : isCenter
                        ? `drop-shadow(0 0 14px ${p.accent}aa)`
                        : `drop-shadow(0 0 8px ${p.accent}55)`,
                    transition: 'filter .35s ease',
                  }}
                />
              </div>
              <span
                className="mt-2 inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10.5px] font-black text-white"
                style={{ background: `${p.accent}${isCenter ? 'ee' : 'aa'}`, boxShadow: isCenter ? `0 4px 12px ${p.accent}55` : 'none' }}
              >
                {p.name}
              </span>
              {done && <span className="mt-1 block text-[9px] font-black text-mint">✨ 탐험 완료</span>}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}

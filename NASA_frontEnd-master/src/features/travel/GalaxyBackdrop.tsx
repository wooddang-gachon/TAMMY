import { motion } from 'framer-motion';
import { useLayoutEffect, useRef, useState } from 'react';
import { createStarField, createStarTwinkle } from '../../animations/starAnimations';

const TWINKLE_STAR_COUNT = 22;

/**
 * 은하 배경 — 무빙 네뷸라 + 패럴랙스 별 + 유성 + GSAP 반짝임 별(별마다 delay/duration이 다름).
 * boostParallax가 true면(ACCELERATION/CRUISE 중) 별 레이어가 훨씬 빠르게 흘러 화면 전체가
 * 살짝 패럴랙스되는 느낌을 준다 — 우주선 자체의 transform은 건드리지 않는다(별도 레이어).
 */
export function GalaxyBackdrop({ intensity = 1, boostParallax = false }: { intensity?: number; boostParallax?: boolean }) {
  const [seeds] = useState(() => createStarField(TWINKLE_STAR_COUNT));
  const scopeRef = useRef<HTMLDivElement>(null);
  const starRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useLayoutEffect(() => {
    if (!scopeRef.current) return;
    const ctx = createStarTwinkle(scopeRef.current, starRefs.current, seeds);
    return () => ctx.revert();
  }, [seeds]);

  return (
    <div ref={scopeRef} className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* nebula */}
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 240px 170px at 18% 12%, rgba(201,182,255,.30), transparent 70%), radial-gradient(ellipse 280px 190px at 86% 34%, rgba(240,168,200,.22), transparent 72%), radial-gradient(ellipse 220px 160px at 40% 78%, rgba(126,200,227,.18), transparent 74%)',
        }}
        animate={{ scale: boostParallax ? [1, 1.1, 1] : [1, 1.06, 1], x: [0, -10, 0], y: [0, 8, 0] }}
        transition={{ duration: boostParallax ? 3.5 : 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* parallax star layers */}
      {[
        { dur: 42, opacity: 0.9, size: '1.5px' },
        { dur: 28, opacity: 0.6, size: '1px' },
      ].map((l, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 will-change-transform"
          style={{
            opacity: l.opacity * intensity,
            backgroundImage: `radial-gradient(circle ${l.size} at 12% 18%, #fff 0, transparent 100%), radial-gradient(circle ${l.size} at 34% 8%, #fff 0, transparent 100%), radial-gradient(circle ${l.size} at 68% 22%, #fff 0, transparent 100%), radial-gradient(circle ${l.size} at 88% 12%, #fff 0, transparent 100%), radial-gradient(circle ${l.size} at 22% 52%, #fff 0, transparent 100%), radial-gradient(circle ${l.size} at 76% 62%, #fff 0, transparent 100%), radial-gradient(circle ${l.size} at 48% 88%, #fff 0, transparent 100%)`,
          }}
          animate={{ backgroundPosition: ['0px 0px', `${-140 - i * 90}px ${40 + i * 20}px`] }}
          transition={{ duration: boostParallax ? l.dur / 5 : l.dur, repeat: Infinity, ease: 'linear' }}
        />
      ))}
      {/* GSAP 개별 반짝임 별 — 별마다 delay/duration이 조금씩 다르다 */}
      <div className="absolute inset-0" style={{ opacity: intensity }}>
        {seeds.map((s, i) => (
          <span
            key={i}
            ref={(el) => { starRefs.current[i] = el; }}
            className="absolute rounded-full bg-white will-change-transform"
            style={{ left: s.left + '%', top: s.top + '%', width: s.size, height: s.size }}
          />
        ))}
      </div>

      {/* shooting stars */}
      {[
        { top: '16%', w: 120, delay: 1.5, dur: 7 },
        { top: '46%', w: 90, delay: 4.5, dur: 9 },
      ].map((s, i) => (
        <motion.div
          key={i}
          className="absolute h-[2px] rounded-full will-change-transform"
          style={{ top: s.top, left: '-14%', width: s.w, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.85))' }}
          animate={{ x: [0, 560], y: [0, 190], opacity: [0, 1, 1, 0] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

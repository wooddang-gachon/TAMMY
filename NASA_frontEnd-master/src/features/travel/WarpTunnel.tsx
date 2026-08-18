import { motion } from 'framer-motion';

/**
 * 워프 터널 — 별이 광선으로 늘어나며 우주선 반대 방향으로 흐른다.
 * directionDeg는 우주선의 실제 이동 각도(atan2, screen 기준)로, 이 각도만큼 컨테이너를 회전시켜
 * 스트릭의 기본 진행 방향(로컬 +Y, 아래쪽)이 항상 "이동 방향의 반대"를 향하게 만든다.
 * boost가 true면(ACCELERATION/CRUISE) 더 빠르고 길게 흐른다.
 */
export function WarpTunnel({ active, directionDeg = 90, boost = false }: { active: boolean; directionDeg?: number; boost?: boolean }) {
  if (!active) return null;
  const rotate = directionDeg + 90;
  const speed = boost ? 0.62 : 1;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-[-40%]" style={{ transform: `rotate(${rotate}deg)` }}>
        {Array.from({ length: 26 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute w-[2px] rounded-full will-change-transform"
            style={{
              left: `${3 + (i * 37) % 94}%`,
              top: `${4 + (i * 53) % 90}%`,
              height: (60 + (i % 5) * 34) * (boost ? 1.3 : 1),
              background: `linear-gradient(180deg, transparent, ${i % 3 === 0 ? 'rgba(201,182,255,.95)' : i % 3 === 1 ? 'rgba(126,200,227,.9)' : 'rgba(255,255,255,.8)'}, transparent)`,
            }}
            animate={{ y: ['-120%', '220%'], scaleY: [0.4, 1.6], opacity: [0, 1, 0] }}
            transition={{ duration: (0.34 + (i % 6) * 0.07) * speed, delay: i * 0.024 * speed, repeat: Infinity, ease: 'linear' }}
          />
        ))}
      </div>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 50% 45%, rgba(126,200,227,.18), transparent 62%), radial-gradient(ellipse at 50% 45%, rgba(201,182,255,.22), transparent 78%)',
        }}
      />
    </div>
  );
}

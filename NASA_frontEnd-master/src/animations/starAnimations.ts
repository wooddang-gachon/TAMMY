import gsap from 'gsap';

export interface StarSeed {
  /** % 단위 위치 */
  left: number;
  top: number;
  /** px */
  size: number;
  delay: number;
  duration: number;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * 별 개수만큼 위치/타이밍 시드를 생성한다.
 * 컴포넌트에서 useState(() => createStarField(n))처럼 한 번만 만들어 재사용해야
 * 리렌더될 때마다 별 위치가 바뀌지 않는다.
 */
export function createStarField(count: number): StarSeed[] {
  return Array.from({ length: count }, () => ({
    left: rand(2, 98),
    top: rand(2, 96),
    size: rand(1, 2.6),
    delay: rand(0, 4),
    duration: rand(1.4, 3.2),
  }));
}

/**
 * stars(각 별 DOM)에 별마다 다른 delay/duration으로 반짝이는 트윈을 건다.
 * gsap.context로 스코프를 잡아 반환하므로, 호출부는 ctx.revert()만 하면
 * 이 함수가 만든 모든 트윈이 한 번에 정리된다.
 */
export function createStarTwinkle(scope: Element, stars: (HTMLElement | null)[], seeds: StarSeed[]): gsap.Context {
  return gsap.context(() => {
    stars.forEach((el, i) => {
      if (!el) return;
      const seed = seeds[i];
      gsap.fromTo(
        el,
        { opacity: 0.2, scale: 0.9 },
        {
          opacity: rand(0.75, 1),
          scale: rand(1.1, 1.35),
          duration: seed?.duration ?? rand(1.4, 3.2),
          delay: seed?.delay ?? rand(0, 4),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        },
      );
    });
  }, scope);
}

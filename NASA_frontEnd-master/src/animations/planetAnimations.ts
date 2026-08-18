import gsap from 'gsap';

/**
 * 행성이 둥실 부유하는 효과. 선택된(중앙) 행성에만 적용하고,
 * 선택되지 않은 행성은 이 함수를 호출하지 않는 방식으로 과도한 움직임을 막는다.
 */
export function floatPlanet(el: HTMLElement, opts: { amplitude?: number; duration?: number } = {}): gsap.core.Tween {
  const amplitude = opts.amplitude ?? 8;
  const duration = opts.duration ?? 3.6;
  return gsap.to(el, { y: -amplitude, duration, repeat: -1, yoyo: true, ease: 'sine.inOut' });
}

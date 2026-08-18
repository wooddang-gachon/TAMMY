import gsap from 'gsap';

/** 목적지를 새로 선택했을 때 경로 패널의 목적지 아이콘에 짧게 강조 펄스를 준다 */
export function pulseSelection(el: HTMLElement): gsap.core.Tween {
  return gsap.fromTo(el, { scale: 0.7, opacity: 0.4 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2.4)' });
}

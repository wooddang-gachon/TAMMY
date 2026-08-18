import gsap from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(MotionPathPlugin);

/**
 * PHASE 2(TAKE OFF) ~ PHASE 5(ARRIVAL). PHASE 1(TARGET LOCK)과 PHASE 6(PLANET TRANSITION)은
 * 우주선의 비행 물리와 무관한 UI 연출이라 StarTravelScene이 별도로 소유한다.
 */
export type DeparturePhase = 'takeoff' | 'accelerate' | 'cruise' | 'arrival';

export interface DepartureOptions {
  onPhase?: (phase: DeparturePhase) => void;
  /** 실제 이동 방향(도, screen atan2 기준) — 워프이펙트가 반대 방향으로 흐르도록 전달한다 */
  onDirection?: (angleDeg: number) => void;
}

export interface DepartureElements {
  /** TAMMY 우주선 + 엔진을 한 그룹으로 담는 엘리먼트 — x/y/scale/rotate를 단독 소유한다 */
  shipGroupEl: HTMLElement;
  /** 엔진 글로우 엘리먼트 — opacity/scaleY만 별도로 조절(그룹의 x/y/rotate에 자연히 함께 실려 이동) */
  engineEl?: HTMLElement | null;
}

/**
 * TAKE OFF → ACCELERATION → CRUISE → ARRIVAL 단일 타임라인을 만든다.
 * shipAnchorRect/targetRect는 항상 호출 시점에 getBoundingClientRect()로 실측한 값을 받는다(순간 이동 없음).
 * 가속+순항 구간은 하나의 연속된 MotionPath 트윈으로 처리해 두 트윈 사이의 좌표 불연속(순간 이동)을 만들지 않는다.
 */
export function buildDepartureTimeline(
  { shipGroupEl, engineEl }: DepartureElements,
  shipAnchorRect: DOMRect,
  targetRect: DOMRect,
  opts: DepartureOptions = {},
): gsap.core.Timeline {
  const shipCenter = { x: shipAnchorRect.left + shipAnchorRect.width / 2, y: shipAnchorRect.top + shipAnchorRect.height / 2 };
  const targetCenter = { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height / 2 };

  const dx = targetCenter.x - shipCenter.x;
  const dy = targetCenter.y - shipCenter.y;
  const distance = Math.hypot(dx, dy) || 1;

  const travelAngle = Math.atan2(dy, dx) * (180 / Math.PI);
  opts.onDirection?.(travelAngle);

  // 진행 방향에 수직인 벡터로 살짝 휘어지는 via-point를 만든다(직선 이동 금지)
  const perpX = -dy / distance;
  const perpY = dx / distance;
  const bow = gsap.utils.clamp(26, 96, distance * 0.22);
  const bendSign = dx >= 0 ? 1 : -1;
  const viaX = dx * 0.52 + perpX * bow * bendSign;
  const viaY = dy * 0.52 + perpY * bow * bendSign;

  const bankDeg = gsap.utils.clamp(-16, 16, (travelAngle + 90) / 6);
  const flightDuration = gsap.utils.clamp(1.05, 2.5, distance / 260);

  const tl = gsap.timeline();

  // PHASE 2 — TAKE OFF: 살짝 눌렸다가 튀어나가는 anticipation + 기울어짐 + 엔진 강화
  tl.call(() => opts.onPhase?.('takeoff'))
    .to(shipGroupEl, { scale: 0.92, y: '+=6', duration: 0.14, ease: 'power1.out' })
    .to(shipGroupEl, { scale: 1.08, y: '-=10', rotate: bankDeg * 0.5, duration: 0.22, ease: 'back.out(2.1)' });
  if (engineEl) {
    tl.to(engineEl, { opacity: 0.65, scaleY: 1.2, duration: 0.14 }, 0);
    tl.to(engineEl, { opacity: 1, scaleY: 2.1, duration: 0.22 }, '<');
  }

  // PHASE 3+4 — ACCELERATION → CRUISE: 하나의 연속 곡선 경로(직선 이동 아님). cruise는 이 트윈 도중 라벨로 알린다.
  tl.addLabel('flight')
    .to(shipGroupEl, {
      motionPath: { path: [{ x: 0, y: 0 }, { x: viaX, y: viaY }, { x: dx, y: dy }], curviness: 1.2 },
      scale: 1.05,
      duration: flightDuration,
      ease: 'power1.inOut',
    }, 'flight')
    .call(() => opts.onPhase?.('accelerate'), undefined, 'flight')
    .call(() => opts.onPhase?.('cruise'), undefined, `flight+=${flightDuration * 0.4}`);

  // 이동 방향에 맞춰 자연스럽게 기울었다가 접근하며 다시 정렬(포지션 트윈과 별개 프로퍼티라 충돌 없음)
  tl.to(shipGroupEl, { rotate: bankDeg, duration: flightDuration * 0.42, ease: 'power2.out' }, 'flight')
    .to(shipGroupEl, { rotate: bankDeg * 0.2, duration: flightDuration * 0.58, ease: 'power1.inOut' }, `flight+=${flightDuration * 0.42}`);

  if (engineEl) {
    tl.to(engineEl, { opacity: 1, scaleY: 2.6, duration: flightDuration * 0.4 }, 'flight');
    tl.to(engineEl, { opacity: 1, scaleY: 3, duration: flightDuration * 0.6 }, `flight+=${flightDuration * 0.4}`);
  }

  // PHASE 5 — ARRIVAL: 목적지 근처에서 감속 + 살짝 흔들리며 안정적으로 정착
  const arriveStart = `flight+=${flightDuration}`;
  tl.call(() => opts.onPhase?.('arrival'), undefined, arriveStart)
    .to(shipGroupEl, { scale: 0.94, rotate: 0, duration: 0.22, ease: 'power2.out' }, arriveStart)
    .to(shipGroupEl, { x: '+=7', rotate: 3, duration: 0.09, ease: 'power1.inOut' })
    .to(shipGroupEl, { x: '-=12', rotate: -3, duration: 0.12, ease: 'power1.inOut' })
    .to(shipGroupEl, { x: '+=5', rotate: 0, scale: 1, duration: 0.16, ease: 'back.out(2)' });
  if (engineEl) tl.to(engineEl, { opacity: 0.35, scaleY: 1.1, duration: 0.4, ease: 'power2.out' }, arriveStart);

  return tl;
}

/** 우주선 그룹을 도킹 기준 원점(x:0,y:0,scale:1,rotate:0)으로 되돌린다 — 매 발사 직전 반드시 호출 */
export function resetDeparture(shipGroupEl: HTMLElement): void {
  gsap.set(shipGroupEl, { x: 0, y: 0, scale: 1, rotate: 0 });
}

/** 대기 상태 — 우주선이 아주 약하게 상하로 떠 있는 효과 */
export function floatShip(el: HTMLElement, opts: { amplitude?: number; duration?: number } = {}): gsap.core.Tween {
  const amplitude = opts.amplitude ?? 5;
  const duration = opts.duration ?? 3.4;
  return gsap.to(el, { y: -amplitude, duration, repeat: -1, yoyo: true, ease: 'sine.inOut' });
}

/** 대기 중 엔진의 약한 글로우 깜빡임 */
export function idleEngineGlow(el: HTMLElement): gsap.core.Tween {
  return gsap.to(el, { opacity: 0.35, duration: 1.6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
}

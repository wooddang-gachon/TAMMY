import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PLANETS, FUEL_REWARDS } from './planets';
import type { Planet, TravelState } from './types';
import type { PlanetType } from '../../types';
import { api } from '../../api/client';
import { useFuel } from '../../hooks/useFuel';
import { getTravelUiState, getBlockedReason, canTravel, MAX_TRAVEL_DISTANCE_AU } from './travelGate';
import { GalaxyBackdrop } from './GalaxyBackdrop';
import { PlanetCarousel } from './PlanetCarousel';
import { WarpTunnel } from './WarpTunnel';
import { ArrivalAnimation } from './ArrivalAnimation';
import { buildDepartureTimeline, resetDeparture, floatShip, idleEngineGlow, type DeparturePhase } from '../../animations/rocketAnimations';
import { pulseSelection } from '../../animations/transitionAnimations';
import shipImg from '../../assets/ship-fly.png';

/** PHASE 1(TARGET LOCK) ~ PHASE 6(PLANET TRANSITION) 전체 시퀀스 상태 */
type SequencePhase = 'lock' | DeparturePhase | 'transition';

const PHASE_LABEL: Record<SequencePhase, string> = {
  lock: '목표 지정 중…',
  takeoff: '엔진 점화 중…',
  accelerate: '가속 중…',
  cruise: '항해 중…',
  arrival: '접근 · 감속 중…',
  transition: '착륙 중…',
};

const LOCK_PHASE_MS = 420;
const SHIP_BOX = 176;

const HOME_STAR = { emoji: '🏠', name: '지구' };

/** 로컬 행성 id → 백엔드 PlanetType enum (POST /planet-travel/start) */
const PLANET_TYPE: Record<string, PlanetType> = {
  meal: 'MEAL',
  water: 'WATER',
  emotion: 'EMOTION',
  lifestyle: 'LIFESTYLE',
  reflection: 'RETROSPECT',
};

/**
 * Star Travel 씬.
 *
 * 화면 계층: 우주 배경 → 별/은하 → 현재 별·목적지 별 → 거리/경로 → 목적지 선택(캐러셀)
 *           → TAMMY 우주선(전체 화면 오버레이) → 엔진 효과 → 여행 가능 상태 → 여행하기 버튼
 *
 * 우주선은 카드 안에 갇혀있지 않고 sceneRef 바로 아래 절대 위치 레이어로 떠 있어서
 * 발사 시 화면 어디로든(실제 행성 좌표까지) 클리핑 없이 날아갈 수 있다.
 *
 * 목적지를 클릭하면 PHASE 1(TARGET LOCK) → 2(TAKE OFF) → 3(ACCELERATION) → 4(CRUISE)
 * → 5(ARRIVAL) → 6(PLANET TRANSITION) 순서로 단일 시퀀스가 실행된다.
 * 여행 가능 조건: 탐험 게이지 100% AND 거리 <= MAX_TRAVEL_DISTANCE_AU (travelGate.ts) — "여행하기" 버튼 경로에서만 강제된다.
 * 캐러셀에서 중앙 행성을 다시 탭하는 경로는 데모 프리뷰로 게이트를 우회한다(기존 동작 유지).
 *
 * 탐험 게이지는 앱 전역 useFuel()의 fuel(대화/기록으로 쌓이는 연료, 홈·채팅 탭과 동일한 값)을 그대로 쓴다.
 * per-planet 도착 여부(state.progress)만 이 화면 로컬 상태로 별도 관리한다.
 */
export function StarTravelScene({
  state, onFuelSpent, onOpenDetail, onGoHome, onGoReport, onTravelStarted,
}: {
  state: TravelState;
  onFuelSpent: (planetId: string, distance: number, fuel: number) => void;
  onOpenDetail: (planetId: string) => void;
  onGoHome?: () => void;
  onGoReport?: () => void;
  /** 실제 POST /planet-travel/start가 travelResultId를 돌려주면 상위(TravelScreen)로 전달 */
  onTravelStarted?: (planetId: string, travelResultId: string | number) => void;
}) {
  const { fuel: gauge } = useFuel();
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isTraveling, setIsTraveling] = useState(false);
  const [phase, setPhase] = useState<SequencePhase | null>(null);
  const [lockPulseId, setLockPulseId] = useState<string | null>(null);
  const [travelAngle, setTravelAngle] = useState(90);
  const [arrived, setArrived] = useState(false);

  const sceneRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const shipGroupRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<HTMLSpanElement>(null);
  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);
  const planetElsRef = useRef(new Map<string, HTMLElement>());
  const launchCtxRef = useRef<gsap.Context | null>(null);
  const lockTimerRef = useRef<number | undefined>(undefined);
  const isTravelingRef = useRef(false);

  const selectedPlanet = selectedId ? PLANETS.find((p) => p.id === selectedId) ?? null : null;
  const distanceAu = selectedPlanet?.auTotal ?? 0;

  const uiState = getTravelUiState({
    destinationSelected: !!selectedPlanet,
    progress: gauge,
    distanceAu,
    isTraveling,
    arrived,
  });
  const blockedReason = selectedPlanet ? getBlockedReason(gauge, distanceAu) : null;

  // 우주선을 도킹 카드(dockRef)의 현재 화면 위치에 맞춘다 — sceneRef 기준 상대 좌표로 계산하므로
  // 스크롤/리사이즈와 무관하게 항상 카드 중앙에 정확히 놓인다. 비행 중에는 호출하지 않는다(누적 방지).
  const positionShipAtDock = () => {
    if (isTravelingRef.current) return;
    if (!dockRef.current || !shipGroupRef.current || !sceneRef.current) return;
    const dockRect = dockRef.current.getBoundingClientRect();
    const sceneRect = sceneRef.current.getBoundingClientRect();
    const shipRect = shipGroupRef.current.getBoundingClientRect();
    const left = dockRect.left - sceneRect.left + dockRect.width / 2 - shipRect.width / 2;
    const top = dockRect.top - sceneRect.top + dockRect.height / 2 - shipRect.height / 2;
    gsap.set(shipGroupRef.current, { left, top, x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 });
  };

  useLayoutEffect(() => {
    isTravelingRef.current = isTraveling;
  }, [isTraveling]);

  useLayoutEffect(() => {
    positionShipAtDock();
    const onResize = () => positionShipAtDock();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 여행 전(IDLE/CANNOT_TRAVEL/READY_TO_TRAVEL/ARRIVED)에는 우주선이 아주 약하게 떠 있고 엔진은 약하게 빛난다.
  // 시퀀스가 진행 중(phase !== null)에는 GSAP 타임라인이 같은 엘리먼트의 transform을 전담하므로 이 effect는 꺼져 있어야 한다.
  useLayoutEffect(() => {
    if (phase !== null || !shipGroupRef.current) return;
    const ctx = gsap.context(() => {
      floatShip(shipGroupRef.current!, { amplitude: 5, duration: 3.4 });
      if (engineRef.current) idleEngineGlow(engineRef.current);
    }, sceneRef);
    return () => {
      ctx.revert();
      if (shipGroupRef.current) gsap.set(shipGroupRef.current, { y: 0 });
      if (engineRef.current) gsap.set(engineRef.current, { opacity: 0.25, scaleY: 1 });
    };
  }, [phase]);

  useEffect(() => () => {
    launchCtxRef.current?.revert();
    window.clearTimeout(lockTimerRef.current);
  }, []);

  // 목적지를 새로 선택할 때마다 경로 패널의 목적지 아이콘을 짧게 강조한다(장식용, 비행 물리와 무관)
  useEffect(() => {
    if (!selectedId || !toRef.current) return;
    const ctx = gsap.context(() => { pulseSelection(toRef.current!); }, sceneRef);
    return () => ctx.revert();
  }, [selectedId]);

  // PHASE 3(ACCELERATION) → 5(ARRIVAL): 실측 좌표로 곡선 경로를 그려 실제 목적지까지 날아간다.
  const runFlight = (planet: Planet) => {
    const shipEl = shipGroupRef.current;
    const targetEl = planetElsRef.current.get(planet.id);
    if (!shipEl || !targetEl || !sceneRef.current) {
      setIsTraveling(false);
      setPhase(null);
      setLockPulseId(null);
      return;
    }
    resetDeparture(shipEl);
    const shipAnchorRect = shipEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    launchCtxRef.current?.revert();
    launchCtxRef.current = gsap.context(() => {
      const tl = buildDepartureTimeline(
        { shipGroupEl: shipEl, engineEl: engineRef.current },
        shipAnchorRect,
        targetRect,
        { onPhase: setPhase, onDirection: setTravelAngle },
      );
      tl.eventCallback('onComplete', () => runPlanetTransition(planet));
    }, sceneRef);
  };

  // PHASE 6 — PLANET TRANSITION: 우주선은 행성 뒤로 사라지듯 페이드, 행성은 1 → 1.15 → 1.35로 확대된 뒤
  // 도착 오버레이로 이어받는다(그 오버레이도 같은 확대 상태에서 시작해 컷이 튀지 않는다).
  const runPlanetTransition = (planet: Planet) => {
    setPhase('transition');
    const shipEl = shipGroupRef.current;
    const targetEl = planetElsRef.current.get(planet.id);

    launchCtxRef.current?.revert();
    launchCtxRef.current = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setIsTraveling(false);
          setPhase(null);
          setArrived(true);
          onFuelSpent(planet.id, 0, gauge); // 탐험 완료 표시(distance:0). 전역 게이지(gauge)는 이 화면이 소유하지 않으므로 그대로 전달만 한다.
        },
      });
      if (shipEl) tl.to(shipEl, { opacity: 0, scale: 0.68, duration: 0.32, ease: 'power2.in' }, 0);
      if (targetEl) {
        tl.to(targetEl, { scale: 1.15, duration: 0.22, ease: 'power2.out' }, 0.04)
          .to(targetEl, { scale: 1.35, duration: 0.3, ease: 'power1.inOut' });
      } else {
        tl.to({}, { duration: 0.5 });
      }
    }, sceneRef);
  };

  // PHASE 1 — TARGET LOCK: 선택한 행성 강조 + 다른 행성 dim + orbit/glow 펄스(0.3~0.5s), 그 다음 실제 발사로 이어간다.
  const startSequence = (planet: Planet, preview = false) => {
    if ((!preview && uiState !== 'READY_TO_TRAVEL') || isTraveling) return;
    positionShipAtDock();
    setArrived(false);
    setIsTraveling(true);
    setPhase('lock');
    setLockPulseId(planet.id);

    window.clearTimeout(lockTimerRef.current);
    lockTimerRef.current = window.setTimeout(() => {
      setLockPulseId(null);
      runFlight(planet);
    }, LOCK_PHASE_MS);
  };

  const handleLaunch = () => {
    if (!selectedPlanet) return;
    startSequence(selectedPlanet);
    // 실제 여행 시작 API — 연출과 별개로 병행 호출한다(응답을 기다리다 발사 연출이 늦어지면 안 됨).
    // DB/인증 문제로 실패해도 로컬 GSAP 시퀀스는 그대로 진행된다.
    const planetType = PLANET_TYPE[selectedPlanet.id];
    if (planetType) {
      api.startPlanetTravel({ planetType, fuelSpent: Math.round(gauge) })
        .then((res) => onTravelStarted?.(selectedPlanet.id, res.travelResultId))
        .catch(() => {});
    }
  };

  // 데모에서는 (중앙에 있는) 행성을 누르는 즉시 여행 연출을 보여준다.
  // 목적지 선택 UI가 먼저 반영된 뒤 우주선을 출발시킨다.
  const handlePlanetClick = (planet: Planet) => {
    if (isTraveling) return;
    setIndex(PLANETS.findIndex((p) => p.id === planet.id));
    setSelectedId(planet.id);
    requestAnimationFrame(() => startSequence(planet, true));
  };

  const lockedId = isTraveling ? selectedId : null;

  return (
    <div ref={sceneRef} className="relative min-h-full overflow-hidden bg-[radial-gradient(ellipse_at_50%_40%,#3A2C63_0%,#1C1435_62%,#0E0A1E_100%)] pb-[110px]">
      <GalaxyBackdrop
        intensity={phase === 'cruise' || phase === 'accelerate' ? 0.55 : 1}
        boostParallax={phase === 'cruise' || phase === 'accelerate'}
      />
      {(phase === 'accelerate' || phase === 'cruise') && (
        <div className="pointer-events-none absolute inset-0 z-10">
          <WarpTunnel active directionDeg={travelAngle} boost={phase === 'cruise'} />
        </div>
      )}

      {/* TAMMY 우주선 — sceneRef 최상단의 절대 위치 레이어. 어떤 카드에도 갇히지 않아 클리핑 없이 행성까지 날아간다. */}
      <div
        ref={shipGroupRef}
        className="pointer-events-none absolute z-[15] will-change-transform"
        style={{ width: SHIP_BOX, height: SHIP_BOX, left: 0, top: 0 }}
      >
        <span
          ref={engineRef}
          className="absolute rounded-full opacity-25"
          style={{
            left: '66%',
            top: '56%',
            width: 62,
            height: 62,
            transform: 'translate(-50%,-50%)',
            background: 'radial-gradient(circle, rgba(255,205,225,.9), rgba(170,135,255,.5) 45%, transparent 74%)',
            filter: 'blur(7px)',
            zIndex: -1,
          }}
        />
        <img
          src={shipImg}
          alt="TAMMY 우주선"
          className="relative h-full w-full object-contain"
          style={{ filter: 'drop-shadow(0 18px 24px rgba(15,8,35,.55))' }}
        />
      </div>

      <header className="relative px-5 pt-1.5 text-center">
        {onGoHome && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onGoHome}
            className="absolute left-5 top-1 flex h-9 w-9 items-center justify-center rounded-[19px] border-none bg-white/92"
            aria-label="홈으로"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5C4A66" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </motion.button>
        )}
        {onGoReport && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onGoReport}
            className="absolute right-5 top-1 flex items-center gap-[5px] rounded-full border border-lavender/40 bg-white/[.08] px-3 py-2"
          >
            <span className="text-[11px]">📋</span>
            <span className="whitespace-nowrap text-[11px] font-extrabold text-[#E4D9F5]">여행 기록</span>
          </motion.button>
        )}
        <h1
          className="whitespace-nowrap px-[92px] pt-0.5 text-2xl font-black tracking-wide"
          style={{ background: 'linear-gradient(90deg,#7EC8E3,#C9B6FF,#F0A8C8)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          STAR TRAVEL
        </h1>
        <p className="mt-1.5 text-[11.5px] font-bold leading-relaxed text-[#B4A0D2]">
          TAMMY와 함께 건강한 습관을
          <br />
          우주여행으로 만들어가요
        </p>
      </header>

      {/* 현재 별 + 목적지 별 / 경로 */}
      <section className="relative mx-4 mt-4 flex items-center justify-between rounded-3xl border border-white/12 bg-white/[.06] px-5 py-3.5">
        <div ref={fromRef} className="flex flex-col items-center gap-1">
          <span className="text-[26px] leading-none">{HOME_STAR.emoji}</span>
          <span className="text-[10px] font-bold text-[#B4A0D2]">{HOME_STAR.name}</span>
        </div>
        <div className="mx-3 flex-1 border-t-2 border-dashed border-lavender/30" />
        <div ref={toRef} className="flex flex-col items-center gap-1">
          <span className="text-[26px] leading-none">{selectedPlanet ? '🪐' : '❔'}</span>
          <span className="max-w-[74px] truncate text-[10px] font-bold text-[#B4A0D2]">{selectedPlanet?.name ?? '목적지 선택'}</span>
        </div>
      </section>

      {/* 목적지 선택 캐러셀 */}
      <div className="relative mt-4">
        <PlanetCarousel
          planets={PLANETS}
          index={index}
          selectedId={selectedId}
          progress={state.progress}
          lockedId={lockedId}
          lockPulseId={lockPulseId}
          onIndexChange={setIndex}
          onSelectDestination={handlePlanetClick}
          onRegisterPlanetEl={(id, el) => {
            if (el) planetElsRef.current.set(id, el);
            else planetElsRef.current.delete(id);
          }}
        />
      </div>

      {/* TAMMY 우주선 도킹 카드 — 실제 비주얼(이미지)은 위쪽 절대 레이어가 담당하고, 여긴 위치 기준점 + 상태 라벨만 그린다 */}
      <section className="relative mx-4 mt-4 flex flex-col items-center justify-center rounded-3xl border border-white/12 bg-white/[.05] py-7">
        <div ref={dockRef} style={{ width: SHIP_BOX, height: SHIP_BOX }} aria-hidden />
        <p className="mt-3 text-[11px] font-black tracking-widest text-[#7EC8E3]">
          {isTraveling && phase ? PHASE_LABEL[phase] : arrived ? '도착!' : '출발 대기 중'}
        </p>
      </section>

      {/* 여행 가능 상태 + 여행하기 버튼 */}
      <section className="relative mx-4 mt-4 rounded-3xl border border-white/12 bg-white/[.06] p-4">
        {selectedPlanet ? (
          <>
            <p className="text-[13px] font-black text-white">{selectedPlanet.name}</p>
            <div className="mt-3 flex gap-2.5">
              <div className="flex-1 rounded-2xl bg-white/[.06] p-3 text-center">
                <p className="text-[10px] font-extrabold text-[#9C88BE]">탐험 게이지</p>
                <p className="mt-1 text-xl font-black text-white">{Math.round(gauge)}%</p>
              </div>
              <div className="flex-1 rounded-2xl bg-white/[.06] p-3 text-center">
                <p className="text-[10px] font-extrabold text-[#9C88BE]">거리</p>
                <p className="mt-1 text-xl font-black text-white">{distanceAu.toFixed(2)} <span className="text-xs">AU</span></p>
              </div>
            </div>
            <p className={'mt-3 text-center text-[11.5px] font-bold ' + (uiState === 'READY_TO_TRAVEL' || uiState === 'ARRIVED' ? 'text-mint' : uiState === 'TRAVELING' ? 'text-[#7EC8E3]' : 'text-[#FFB4C6]')}>
              {uiState === 'READY_TO_TRAVEL' && '✅ 여행 가능'}
              {uiState === 'TRAVELING' && '🚀 비행 중…'}
              {uiState === 'ARRIVED' && '🎉 도착했어요!'}
              {blockedReason === 'GAUGE_NOT_FULL' && '아직 여행할 수 없어요 · 탐험 게이지를 100% 채워주세요'}
              {blockedReason === 'TOO_FAR' && `아직 이 별까지 여행할 수 없어요 (최대 ${MAX_TRAVEL_DISTANCE_AU} AU)`}
            </p>
            <motion.button
              whileTap={canTravel(gauge, distanceAu) ? { scale: 0.97 } : undefined}
              disabled={uiState !== 'READY_TO_TRAVEL'}
              onClick={handleLaunch}
              className="mt-3.5 w-full rounded-[20px] py-3.5 text-[13.5px] font-black text-white disabled:opacity-45"
              style={{ background: uiState === 'READY_TO_TRAVEL' ? 'linear-gradient(135deg,#A48BD8,#C9B6FF)' : 'rgba(201,182,255,.22)' }}
            >
              🚀 여행하기
            </motion.button>
          </>
        ) : (
          <p className="py-2 text-center text-[12px] font-bold text-[#9C88BE]">위에서 목적지를 선택해줘</p>
        )}
      </section>

      {/* Quick Record — 게이지를 채우는 방법 안내 */}
      <section className="relative mx-4 mt-3 rounded-3xl border border-white/12 bg-white/[.06] p-4">
        <h2 className="text-[13px] font-black text-white">기록할수록 게이지가 채워져요 ✨</h2>
        <div className="mt-3 flex flex-col gap-2">
          {FUEL_REWARDS.map((r) => (
            <div key={r.label} className="flex items-center gap-2.5">
              <span className="text-[13px]">{r.emoji}</span>
              <span className="flex-1 text-[11.5px] font-extrabold text-[#C4B2DE]">{r.label}</span>
              <span className="text-[11.5px] font-black text-mint">+{r.fuel} Fuel</span>
            </div>
          ))}
        </div>
      </section>

      {/* 도착 연출 → Planet Detail 전환 */}
      {arrived && selectedPlanet && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[radial-gradient(ellipse_at_50%_40%,#3A2C63_0%,#1C1435_62%,#0E0A1E_100%)]">
          <ArrivalAnimation planet={selectedPlanet} onContinue={() => onOpenDetail(selectedPlanet.id)} />
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';

/**
 * Bespoke "Graph Motion" Brand Emblem SVG (`logo dan brand yang sesuai dengan Graph Motion di halaman home`):
 * Combines:
 * 1. Three ascending 3D Isometric Graph Columns on the left ("Graph")
 * 2. A sweeping, perforated 3D Cinema Film Ribbon & Play-Delta Prism looping around them ("Motion")
 * 3. Glowing Bezier Keyframe Diamonds (`◆`) and an orbital 60 FPS optical ring
 * 4. Continuous 5-second (5000ms) creative GIF-style loop animation when `animated` is active (default: true).
 */
export interface GraphMotionIntroMotion {
  barScales?: [number, number, number];
  ribbonDraw?: number;
  prismScale?: number;
  shimmerProgress?: number;
  ringRotationDeg?: number;
  sprocketOffset?: number;
  diamondBobPx?: [number, number, number];
  diamondRotDeg?: number;
  emblemTiltDeg?: number;
  emblemPulseScale?: number;
  wordmarkScrubberProgress?: number;
}

export const GRAPH_MOTION_GIF_LOOP_DURATION_MS = 5000;

/**
 * Pure, deterministic 5-second (5000ms) GIF-style creative loop calculator for the Graph Motion brand logo.
 * Cycles continuously every 5.0 seconds through 4 signature motion-graphics acts:
 * - Act 1 (0.0s - 1.25s): Isometric 3D Graph Columns staggered spring wave & keyframe diamond lift
 * - Act 2 (1.25s - 2.50s): 3D Perforated Cinema Film Ribbon speed-sweep & rolling sprocket perforations
 * - Act 3 (2.50s - 3.75s): Golden Play-Delta Prism double-beat pop, diagonal studio sheen & wordmark timeline scrub
 * - Act 4 (3.75s - 5.00s): Harmonic equalizer wave & 360° orbital timecode ring lock-in for seamless loop
 */
export function computeGraphMotionGifLoopState(elapsedMs: number): Required<GraphMotionIntroMotion> {
  const safeMs = Number.isFinite(elapsedMs) && elapsedMs >= 0 ? elapsedMs : 0;
  const phase = (safeMs % GRAPH_MOTION_GIF_LOOP_DURATION_MS) / GRAPH_MOTION_GIF_LOOP_DURATION_MS; // [0..1) over 5.0s
  const tau = phase * Math.PI * 2;

  // Staggered spring-wave for the 3 ascending isometric columns ("Graph")
  const barWave = (barIndex: number): number => {
    const offset = barIndex * 0.11;
    const localP = (phase - offset + 1) % 1;
    if (localP < 0.18) {
      // Energetic dip-and-launch at start of 5s cycle
      const u = localP / 0.18;
      return 0.42 + 0.76 * Math.sin(u * Math.PI * 0.65);
    }
    if (localP < 0.36) {
      // Elastic overshoot settle
      const u = (localP - 0.18) / 0.18;
      return 1.18 - 0.18 * u + Math.sin(u * Math.PI * 2) * 0.06;
    }
    // Continuous living equalizer harmonic breathing across the rest of the 5s loop
    return 1 + Math.sin((localP - 0.36) * Math.PI * 4 + barIndex * 1.1) * 0.12;
  };

  const b0 = Number(Math.max(0.25, Math.min(1.28, barWave(0))).toFixed(4));
  const b1 = Number(Math.max(0.25, Math.min(1.28, barWave(1))).toFixed(4));
  const b2 = Number(Math.max(0.25, Math.min(1.28, barWave(2))).toFixed(4));

  // Film ribbon draw & continuous sprocket motion ("Motion")
  let ribbonDraw = 1;
  if (phase < 0.12) {
    // Quick sleek re-trace at start of loop
    const u = phase / 0.12;
    ribbonDraw = 0.28 + 0.72 * (1 - Math.pow(1 - u, 3));
  } else if (phase > 0.92) {
    // Smooth pre-loop tail tuck so 1.0 -> 0.0 is seamless
    const u = (phase - 0.92) / 0.08;
    ribbonDraw = 1 - 0.72 * (u * u);
  }
  ribbonDraw = Number(ribbonDraw.toFixed(4));

  // Continuous rolling film sprocket perforations along the ribbon
  const sprocketOffset = Number((phase * 72).toFixed(2));

  // Play-Delta Prism kinetic double-beat pop around Act 2-3
  let prismScale = 1 + Math.sin(tau * 2) * 0.06;
  if (phase >= 0.45 && phase <= 0.72) {
    const u = (phase - 0.45) / 0.27;
    prismScale = 1 + Math.sin(u * Math.PI * 2) * 0.22;
  }
  prismScale = Number(Math.max(0.75, Math.min(1.3, prismScale)).toFixed(4));

  // Diagonal studio specular sheen sweep across emblem during Act 3 (2.4s - 3.9s)
  let shimmerProgress = 0;
  if (phase >= 0.48 && phase <= 0.78) {
    shimmerProgress = Number(((phase - 0.48) / 0.3).toFixed(4));
  }

  // Continuous 360-degree orbital timecode ring rotation every 5 seconds
  const ringRotationDeg = Number((phase * 360).toFixed(2));

  // Keyframe diamonds bobbing & spinning above the 3 columns
  const diamondBobPx: [number, number, number] = [
    Number((Math.sin(tau * 2) * -3.2).toFixed(2)),
    Number((Math.sin(tau * 2 - 0.9) * -3.8).toFixed(2)),
    Number((Math.sin(tau * 2 - 1.8) * -4.2).toFixed(2)),
  ];
  const diamondRotDeg = Number((45 + Math.sin(tau) * 45).toFixed(2));

  // Subtle 3D floating tilt & breathing scale for the whole emblem
  const emblemTiltDeg = Number((Math.sin(tau) * 4.5).toFixed(2));
  const emblemPulseScale = Number((1 + Math.sin(tau * 2) * 0.035).toFixed(4));

  // Timeline playhead scrubber progress beneath "Graph Motion" wordmark
  const wordmarkScrubberProgress = Number(phase.toFixed(4));

  return {
    barScales: [b0, b1, b2],
    ribbonDraw,
    prismScale,
    shimmerProgress,
    ringRotationDeg,
    sprocketOffset,
    diamondBobPx,
    diamondRotDeg,
    emblemTiltDeg,
    emblemPulseScale,
    wordmarkScrubberProgress,
  };
}

type LoopSubscriber = (state: Required<GraphMotionIntroMotion>) => void;
const gifLoopSubscribers = new Set<LoopSubscriber>();
let gifLoopIntervalId: number | null = null;
let gifLoopOriginMs = 0;

function startSharedGifLoopIfNeeded() {
  if (gifLoopIntervalId !== null || typeof window === 'undefined') return;
  gifLoopOriginMs = performance.now();
  // 25 FPS (40ms) matches authentic GIF cadence while keeping main-thread CPU & React renders ultra-light
  gifLoopIntervalId = window.setInterval(() => {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (gifLoopSubscribers.size === 0) return;
    const elapsed = Math.max(0, performance.now() - gifLoopOriginMs);
    const nextState = computeGraphMotionGifLoopState(elapsed);
    gifLoopSubscribers.forEach((cb) => cb(nextState));
  }, 40);
}

function stopSharedGifLoopIfIdle() {
  if (gifLoopSubscribers.size === 0 && gifLoopIntervalId !== null && typeof window !== 'undefined') {
    window.clearInterval(gifLoopIntervalId);
    gifLoopIntervalId = null;
  }
}

function useGraphMotionGifLoop(enabled: boolean): Required<GraphMotionIntroMotion> | null {
  const [loopState, setLoopState] = useState<Required<GraphMotionIntroMotion>>(() =>
    computeGraphMotionGifLoopState(0)
  );

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const subscriber: LoopSubscriber = (next) => {
      setLoopState(next);
    };
    gifLoopSubscribers.add(subscriber);
    startSharedGifLoopIfNeeded();
    return () => {
      gifLoopSubscribers.delete(subscriber);
      stopSharedGifLoopIfIdle();
    };
  }, [enabled]);

  return enabled ? loopState : null;
}

export const GraphMotionLogoMark: React.FC<{
  className?: string;
  animated?: boolean;
  introMotion?: GraphMotionIntroMotion;
}> = ({ className = 'w-9 h-9', animated = true, introMotion }) => {
  const uid = React.useId().replace(/:/g, '');
  const liveLoop = useGraphMotionGifLoop(Boolean(animated && !introMotion));
  const activeMotion = introMotion || liveLoop;

  const bars = activeMotion?.barScales ?? [1, 1, 1];
  const ribbonDraw = activeMotion?.ribbonDraw ?? 1;
  const prismScale = activeMotion?.prismScale ?? 1;
  const shimmer = activeMotion?.shimmerProgress ?? 0;
  const ringRot = activeMotion?.ringRotationDeg ?? 0;
  const sprocketOffset = activeMotion?.sprocketOffset ?? 0;
  const diamondBob = activeMotion?.diamondBobPx ?? [0, 0, 0];
  const diamondRot = activeMotion?.diamondRotDeg ?? 45;
  const emblemTilt = activeMotion?.emblemTiltDeg ?? 0;
  const emblemScale = activeMotion?.emblemPulseScale ?? 1;

  const ribbonPathLength = 240;
  const ribbonDashOffset = Math.max(0, ribbonPathLength * (1 - ribbonDraw));
  const perfLength = 120;
  const perfDashOffset = Math.max(0, perfLength * (1 - ribbonDraw)) - sprocketOffset;
  const sheenOffset = -90 + shimmer * 220;

  const gradRibbon = `gmRibbonGrad-${uid}`;
  const gradBar1 = `gmBarGrad1-${uid}`;
  const gradBar2 = `gmBarGrad2-${uid}`;
  const gradPrism = `gmPrismAmber-${uid}`;
  const gradSheen = `gmSheenGrad-${uid}`;
  const clipEmblem = `gmEmblemClip-${uid}`;

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-testid="graph-motion-logo-svg"
      data-gif-loop={animated && !introMotion ? '5s-active' : 'custom'}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradRibbon} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
        <linearGradient id={gradBar1} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id={gradBar2} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id={gradPrism} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id={gradSheen} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={clipEmblem}>
          <circle cx="60" cy="60" r="52" />
        </clipPath>
      </defs>

      <g
        transform={`translate(60 60) scale(${emblemScale}) rotate(${emblemTilt}) translate(-60 -60)`}
      >
        {/* Outer Orbital 60 FPS Timecode Ring */}
        <g transform={`rotate(${ringRot} 60 60)`}>
          <circle
            cx="60"
            cy="60"
            r="52"
            stroke={`url(#${gradRibbon})`}
            strokeWidth="2.2"
            strokeDasharray="16 8 4 8"
            opacity="0.68"
          />
          <circle
            cx="60"
            cy="8"
            r="2.6"
            fill="#fbbf24"
            opacity={ribbonDraw > 0.2 ? 0.95 : 0}
          />
          <circle
            cx="60"
            cy="112"
            r="2.2"
            fill="#38bdf8"
            opacity={ribbonDraw > 0.35 ? 0.85 : 0}
          />
        </g>

        {/* Inner Isometric Coordinate Horizon Arc */}
        <path
          d="M 18 76 Q 60 98 102 72"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.48 * Math.min(1, bars[0] * 1.4)}
        />

        {/* 1. THREE ASCENDING 3D ISOMETRIC GRAPH COLUMNS ("GRAPH") */}
        {/* Bar 1 (Left Short) — anchored at baseline y=80 */}
        <g
          transform={`translate(33 80) scale(1 ${Math.max(0.001, bars[0])}) translate(-33 -80)`}
          opacity={Math.min(1, bars[0] * 2.5)}
        >
          <path d="M 24 80 L 24 56 L 34 50 L 34 74 Z" fill={`url(#${gradBar1})`} />
          <path d="M 34 50 L 42 55 L 42 79 L 34 74 Z" fill="#0369a1" />
          <rect
            x="27"
            y={43 + diamondBob[0]}
            width="6"
            height="6"
            transform={`rotate(${diamondRot} 30 ${46 + diamondBob[0]})`}
            fill="#38bdf8"
          />
        </g>

        {/* Bar 2 (Middle Medium) — anchored at baseline y=82 */}
        <g
          transform={`translate(53 82) scale(1 ${Math.max(0.001, bars[1])}) translate(-53 -82)`}
          opacity={Math.min(1, bars[1] * 2.5)}
        >
          <path d="M 44 82 L 44 42 L 54 36 L 54 76 Z" fill={`url(#${gradBar2})`} />
          <path d="M 54 36 L 62 41 L 62 81 L 54 76 Z" fill="#0284c7" />
          <rect
            x="47"
            y={29 + diamondBob[1]}
            width="6"
            height="6"
            transform={`rotate(${diamondRot} 50 ${32 + diamondBob[1]})`}
            fill="#e0f2fe"
          />
        </g>

        {/* Bar 3 (Right Tallest) — anchored at baseline y=84 */}
        <g
          transform={`translate(73 84) scale(1 ${Math.max(0.001, bars[2])}) translate(-73 -84)`}
          opacity={Math.min(1, bars[2] * 2.5)}
        >
          <path d="M 64 84 L 64 26 L 74 20 L 74 78 Z" fill="#ffffff" />
          <path d="M 74 20 L 82 25 L 82 83 L 74 78 Z" fill="#38bdf8" />
          <rect
            x="67"
            y={13 + diamondBob[2]}
            width="7"
            height="7"
            transform={`rotate(${diamondRot} 70.5 ${16.5 + diamondBob[2]})`}
            fill="#fbbf24"
          />
        </g>

        {/* 2. SWEEPING 3D PERFORATED CINEMA FILM RIBBON ("MOTION") */}
        <path
          d="M 14 68 C 28 24, 68 18, 98 44 C 110 55, 102 86, 68 92 C 42 96, 22 86, 16 74"
          stroke={`url(#${gradRibbon})`}
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeDasharray={ribbonPathLength}
          strokeDashoffset={ribbonDashOffset}
          opacity={ribbonDraw > 0.01 ? 1 : 0}
          fill="none"
        />
        {/* Film Sprocket Perforation Dots along the Motion Ribbon */}
        {ribbonDraw > 0.15 && (
          <path
            d="M 16 66 C 30 25, 68 19, 97 44"
            stroke="#020617"
            strokeWidth="2.6"
            strokeDasharray="3 6"
            strokeDashoffset={perfDashOffset}
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* 3. KINETIC PLAY-DELTA PRISM AT RIGHT APEX */}
        <g
          transform={`translate(86 58) scale(${Math.max(0.001, prismScale)}) translate(-86 -58)`}
          opacity={Math.min(1, prismScale * 2.5)}
        >
          <path d="M 76 42 L 104 58 L 76 74 Z" fill={`url(#${gradPrism})`} />
          <path d="M 76 42 L 104 58 L 84 58 Z" fill="#fef3c7" opacity="0.88" />
        </g>

        {/* Diagonal Studio Specular Sheen Sweep during 5s GIF Loop or Act II Emblem Lock-in */}
        {shimmer > 0.02 && shimmer < 0.98 && (
          <g clipPath={`url(#${clipEmblem})`}>
            <rect
              x={sheenOffset}
              y="-20"
              width="28"
              height="160"
              transform="rotate(24 60 60)"
              fill={`url(#${gradSheen})`}
            />
          </g>
        )}
      </g>
    </svg>
  );
};

export const GraphMotionBrandLockup: React.FC<{
  isLight?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}> = ({ isLight = false, size = 'md', animated = true, className = '' }) => {
  const liveLoop = useGraphMotionGifLoop(animated);
  const scrubP = liveLoop?.wordmarkScrubberProgress ?? 0;

  const iconSize =
    size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const textSize =
    size === 'sm'
      ? 'text-lg sm:text-[20px]'
      : size === 'lg'
      ? 'text-2xl sm:text-[26px]'
      : 'text-xl sm:text-[23px]';

  // Subtle 5-second loop kinetic motion on the wordmark + timeline playhead scrubber
  const graphLiftPx = animated ? Math.sin(scrubP * Math.PI * 2) * -1.2 : 0;
  const motionSlidePx = animated ? Math.cos(scrubP * Math.PI * 2) * 1.4 : 0;
  const scrubberWidthPct = animated ? 32 + Math.sin(scrubP * Math.PI) * 68 : 40;
  const playheadLeftPct = animated ? scrubP * 92 : 35;

  return (
    <span
      data-testid="graph-motion-brand-lockup"
      data-gif-loop={animated ? '5s-active' : 'static'}
      className={`group inline-flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 ${className}`}
    >
      <GraphMotionLogoMark
        className={`${iconSize} shrink-0 drop-shadow-[0_0_16px_rgba(56,189,248,0.5)]`}
        animated={animated}
        introMotion={liveLoop ?? undefined}
      />
      <span className="relative inline-flex items-baseline gap-1.5">
        <span
          style={{
            transform: animated ? `translateY(${graphLiftPx.toFixed(2)}px)` : undefined,
          }}
          className={`${textSize} inline-block font-extrabold tracking-[-0.035em] bg-clip-text text-transparent bg-gradient-to-r ${
            isLight
              ? 'from-slate-950 via-blue-800 to-blue-600'
              : 'from-white via-sky-100 to-sky-300'
          }`}
        >
          Graph
        </span>
        <span
          style={{
            transform: animated ? `translateX(${motionSlidePx.toFixed(2)}px)` : undefined,
          }}
          className={`${textSize} inline-block font-light tracking-[-0.015em] bg-clip-text text-transparent bg-gradient-to-r ${
            isLight
              ? 'from-blue-600 via-sky-500 to-indigo-500'
              : 'from-sky-300 via-cyan-200 to-indigo-300'
          }`}
        >
          Motion
        </span>
        {/* Animated 5-Second NLE Timeline Scrubber Bar & Keyframe Playhead under Wordmark */}
        <span
          aria-hidden="true"
          className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full overflow-visible pointer-events-none"
        >
          <span
            style={{ width: `${scrubberWidthPct.toFixed(1)}%` }}
            className="block h-full bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300 rounded-full opacity-90"
          />
          {animated && (
            <span
              style={{ left: `${playheadLeftPct.toFixed(1)}%` }}
              className="absolute -top-[2px] w-1.5 h-1.5 rotate-45 bg-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.95)]"
            />
          )}
        </span>
      </span>
    </span>
  );
};

export const GraphMotionBrandLogo: React.FC<{
  size?: number;
  className?: string;
  animated?: boolean;
}> = ({ size = 28, className = '', animated = true }) => {
  const sizeClass =
    size <= 20
      ? 'w-5 h-5'
      : size <= 24
      ? 'w-6 h-6'
      : size <= 32
      ? 'w-8 h-8'
      : 'w-9 h-9';
  return (
    <GraphMotionLogoMark
      className={`${sizeClass} shrink-0 ${className}`.trim()}
      animated={animated}
    />
  );
};
export default GraphMotionBrandLogo;

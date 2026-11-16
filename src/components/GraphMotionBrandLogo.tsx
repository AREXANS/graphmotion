import React from 'react';

/**
 * Bespoke "Graph Motion" Brand Emblem SVG (`logo dan brand yang sesuai dengan Graph Motion di halaman home`):
 * Combines:
 * 1. Three ascending 3D Isometric Graph Columns on the left ("Graph")
 * 2. A sweeping, perforated 3D Cinema Film Ribbon & Play-Delta Prism looping around them ("Motion")
 * 3. Glowing Bezier Keyframe Diamonds (`◆`) and an orbital 60 FPS optical ring
 */
export const GraphMotionLogoMark: React.FC<{
  className?: string;
  animated?: boolean;
}> = ({ className = 'w-9 h-9', animated = false }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="gmRibbonGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#e0f2fe" />
        <stop offset="100%" stopColor="#818cf8" />
      </linearGradient>
      <linearGradient id="gmBarGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#7dd3fc" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
      <linearGradient id="gmBarGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#e0f2fe" />
        <stop offset="100%" stopColor="#38bdf8" />
      </linearGradient>
      <linearGradient id="gmPrismAmber" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="55%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
    </defs>

    {/* Outer Orbital 60 FPS Timecode Ring */}
    <circle
      cx="60"
      cy="60"
      r="52"
      stroke="url(#gmRibbonGrad)"
      strokeWidth="2.2"
      strokeDasharray="16 8 4 8"
      opacity="0.58"
      className={animated ? 'origin-center animate-[spin_14s_linear_infinite]' : ''}
    />

    {/* Inner Isometric Coordinate Horizon Arc */}
    <path
      d="M 18 76 Q 60 98 102 72"
      stroke="#38bdf8"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.45"
    />

    {/* 1. THREE ASCENDING 3D ISOMETRIC GRAPH COLUMNS ("GRAPH") */}
    {/* Bar 1 (Left Short) */}
    <path
      d="M 24 80 L 24 56 L 34 50 L 34 74 Z"
      fill="url(#gmBarGrad1)"
    />
    <path
      d="M 34 50 L 42 55 L 42 79 L 34 74 Z"
      fill="#0369a1"
    />
    {/* Bar 2 (Middle Medium) */}
    <path
      d="M 44 82 L 44 42 L 54 36 L 54 76 Z"
      fill="url(#gmBarGrad2)"
    />
    <path
      d="M 54 36 L 62 41 L 62 81 L 54 76 Z"
      fill="#0284c7"
    />
    {/* Bar 3 (Right Tallest) */}
    <path
      d="M 64 84 L 64 26 L 74 20 L 74 78 Z"
      fill="#ffffff"
    />
    <path
      d="M 74 20 L 82 25 L 82 83 L 74 78 Z"
      fill="#38bdf8"
    />

    {/* 2. SWEEPING 3D PERFORATED CINEMA FILM RIBBON ("MOTION") */}
    <path
      d="M 14 68 C 28 24, 68 18, 98 44 C 110 55, 102 86, 68 92 C 42 96, 22 86, 16 74"
      stroke="url(#gmRibbonGrad)"
      strokeWidth="7.5"
      strokeLinecap="round"
      fill="none"
    />
    {/* Film Sprocket Perforation Dots along the Motion Ribbon */}
    <path
      d="M 16 66 C 30 25, 68 19, 97 44"
      stroke="#020617"
      strokeWidth="2.6"
      strokeDasharray="3 6"
      strokeLinecap="round"
      fill="none"
    />

    {/* 3. KINETIC PLAY-DELTA PRISM AT RIGHT APEX */}
    <path
      d="M 76 42 L 104 58 L 76 74 Z"
      fill="url(#gmPrismAmber)"
    />
    <path
      d="M 76 42 L 104 58 L 84 58 Z"
      fill="#fef3c7"
      opacity="0.85"
    />

    {/* Glowing Keyframe Diamond Nodes */}
    <rect
      x="27"
      y="43"
      width="6"
      height="6"
      transform="rotate(45 30 46)"
      fill="#38bdf8"
    />
    <rect
      x="47"
      y="29"
      width="6"
      height="6"
      transform="rotate(45 50 32)"
      fill="#e0f2fe"
    />
    <rect
      x="67"
      y="13"
      width="7"
      height="7"
      transform="rotate(45 70.5 16.5)"
      fill="#fbbf24"
    />
  </svg>
);

export const GraphMotionBrandLockup: React.FC<{
  isLight?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}> = ({ isLight = false, size = 'md', animated = false, className = '' }) => {
  const iconSize =
    size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const textSize =
    size === 'sm'
      ? 'text-lg sm:text-[20px]'
      : size === 'lg'
      ? 'text-2xl sm:text-[26px]'
      : 'text-xl sm:text-[23px]';

  return (
    <span
      data-testid="graph-motion-brand-lockup"
      className={`group inline-flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 ${className}`}
    >
      <GraphMotionLogoMark
        className={`${iconSize} shrink-0 drop-shadow-[0_0_16px_rgba(56,189,248,0.5)]`}
        animated={animated}
      />
      <span className="relative inline-flex items-baseline gap-1.5">
        <span
          className={`${textSize} font-extrabold tracking-[-0.035em] bg-clip-text text-transparent bg-gradient-to-r ${
            isLight
              ? 'from-slate-950 via-blue-800 to-blue-600'
              : 'from-white via-sky-100 to-sky-300'
          }`}
        >
          Graph
        </span>
        <span
          className={`${textSize} font-light tracking-[-0.015em] bg-clip-text text-transparent bg-gradient-to-r ${
            isLight
              ? 'from-blue-600 via-sky-500 to-indigo-500'
              : 'from-sky-300 via-cyan-200 to-indigo-300'
          }`}
        >
          Motion
        </span>
        <span
          aria-hidden="true"
          className="absolute -bottom-1 left-0 h-[1.5px] w-9 group-hover:w-full transition-all duration-300 bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300 rounded-full opacity-85"
        />
      </span>
    </span>
  );
};

export const GraphMotionBrandLogo: React.FC<{
  size?: number;
  className?: string;
  animated?: boolean;
}> = ({ size = 28, className = '', animated = false }) => {
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


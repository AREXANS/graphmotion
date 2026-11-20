import React from 'react';
import { type StyleModuleInfo } from '../../data/satset-modules.ts';

// 1. BANG MOTION (Bang Tutorial Signature)
export const BangMotionThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#0d0d0f" />
    {/* Dynamic angled red-orange hero slab */}
    <polygon points="0,20 120,4 120,86 0,102" fill="#ff3b00" />
    {/* Yellow contrast ribbon */}
    <polygon points="90,8 108,6 108,88 90,90" fill="#ffe600" />
    {/* Bold typography */}
    <text x="50" y="55" fill="white" fontSize="11" fontWeight="900" fontFamily="Impact, sans-serif" letterSpacing="0.5">
      BANG MOTION
    </text>
    <rect x="18" y="64" width="70" height="11" rx="2" fill="#0d0d0f" />
    <text x="53" y="72" fill="#ffe600" fontSize="5.5" fontWeight="900" fontFamily="monospace" textAnchor="middle">
      ★ ANTI-PPT CINEMATIC
    </text>
    {/* Viewfinder crosshairs */}
    <path d="M12 24 L12 14 L22 14" stroke="#ffe600" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M108 24 L108 14 L98 14" stroke="#ffe600" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 96 L12 106 L22 106" stroke="#ffe600" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M108 96 L108 106 L98 106" stroke="#ffe600" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 2. STICKMAN SHORTS (from claude-stickman-shorts)
export const StickmanThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#0f172a" />
    {/* Ground line */}
    <line x1="10" y1="92" x2="110" y2="92" stroke="#334155" strokeWidth="1.5" />
    {/* Ground shadow */}
    <ellipse cx="60" cy="94" rx="20" ry="4" fill="rgba(0,0,0,0.5)" />
    {/* Running Stickman figure */}
    <circle cx="62" cy="46" r="9" fill="#fef08a" stroke="#fbbf24" strokeWidth="2.5" />
    {/* Eyes */}
    <circle cx="65" cy="45" r="1.5" fill="#0f172a" />
    {/* Torso */}
    <line x1="60" y1="55" x2="56" y2="74" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
    {/* Arm front with red band */}
    <polyline points="59,58 70,66 76,62" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="70" cy="66" r="2.5" fill="#ef4444" />
    {/* Arm back */}
    <polyline points="59,58 48,66 42,70" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Running legs */}
    <polyline points="56,74 70,82 72,92" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="56,74 44,80 40,90" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Speech Bubble GASPOL */}
    <rect x="68" y="22" width="44" height="16" rx="5" fill="white" stroke="#0f172a" strokeWidth="1.5" />
    <polygon points="76,38 72,43 82,38" fill="white" />
    <polygon points="76,38 72,43 82,38" stroke="#0f172a" strokeWidth="1.5" />
    <text x="90" y="33" fill="#0f172a" fontSize="6.5" fontWeight="900" textAnchor="middle">GASPOL! 🔥</text>
    {/* DAY 1 Badge */}
    <rect x="14" y="14" width="38" height="11" rx="4" fill="#ef4444" />
    <text x="33" y="22" fill="white" fontSize="5" fontWeight="900" textAnchor="middle">DAY 1 STREAK</text>
  </svg>
);

// 3. BENTO GRID (Apple Keynote Style)
export const BentoGridThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#090d16" />
    {/* Card 1: Top-Left Hero */}
    <rect x="12" y="14" width="56" height="46" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1" />
    {/* Progress circle */}
    <circle cx="32" cy="37" r="12" stroke="#334155" strokeWidth="3" fill="none" />
    <path d="M32 25 A 12 12 0 1 1 20 37" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" fill="none" />
    <text x="32" y="40" fill="white" fontSize="6" fontWeight="bold" textAnchor="middle">84%</text>
    <text x="20" y="24" fill="#94a3b8" fontSize="4.5" fontWeight="bold">ENGINE</text>
    {/* Card 2: Top-Right Bars */}
    <rect x="74" y="14" width="34" height="46" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1" />
    <rect x="80" y="38" width="5" height="16" rx="1.5" fill="#3b82f6" />
    <rect x="88" y="26" width="5" height="28" rx="1.5" fill="#6366f1" />
    <rect x="96" y="32" width="5" height="22" rx="1.5" fill="#38bdf8" />
    <text x="80" y="22" fill="#94a3b8" fontSize="4.5" fontWeight="bold">DATA</text>
    {/* Card 3: Bottom-Left Toggle */}
    <rect x="12" y="66" width="44" height="40" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1" />
    <rect x="20" y="82" width="26" height="14" rx="7" fill="#10b981" />
    <circle cx="38" cy="89" r="5" fill="white" />
    <text x="20" y="76" fill="#94a3b8" fontSize="4.5" fontWeight="bold">SYNC</text>
    {/* Card 4: Bottom-Right Wave */}
    <rect x="62" y="66" width="46" height="40" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1" />
    <path d="M68 88 Q74 76 80 88 T92 88 T102 88" stroke="#ec4899" strokeWidth="2" fill="none" />
    <text x="70" y="76" fill="#94a3b8" fontSize="4.5" fontWeight="bold">LIVE</text>
    {/* Specular glare */}
    <line x1="8" y1="12" x2="112" y2="108" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
  </svg>
);

// 4. PAPAN KAPUR (Chalkboard)
export const PapanKapurThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#1b2824" />
    {/* Wooden shelf bottom */}
    <rect x="0" y="106" width="120" height="14" fill="#854d0e" />
    <rect x="0" y="106" width="120" height="2" fill="#a16207" />
    {/* Chalk pieces */}
    <rect x="30" y="109" width="16" height="5" rx="1.5" fill="#fef08a" />
    <rect x="52" y="109" width="18" height="5" rx="1.5" fill="white" />
    {/* Chalk eraser */}
    <rect x="78" y="107" width="28" height="7" rx="1.5" fill="#451a03" />
    {/* Geometry chalk drawing */}
    <polygon points="34,70 66,70 50,38" stroke="white" strokeWidth="1.5" strokeDasharray="3 2" fill="none" />
    <path d="M50 38 A 12 12 0 0 1 58 48" stroke="#fef08a" strokeWidth="1.5" fill="none" />
    <text x="63" y="46" fill="#fef08a" fontSize="5" fontWeight="bold">θ</text>
    {/* Math formula */}
    <text x="84" y="44" fill="white" fontSize="6.5" fontStyle="italic" fontFamily="serif">E = mc²</text>
    <text x="84" y="62" fill="#6ee7b7" fontSize="6" fontWeight="bold">Δy / Δx</text>
    {/* Chalk heading */}
    <text x="60" y="24" fill="white" fontSize="7" fontWeight="bold" textAnchor="middle" letterSpacing="1">
      PAPAN KAPUR
    </text>
  </svg>
);

// 5. ISOMETRIK CERAH (Pastel 3D Cubes)
export const IsometrikCerahThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#f8fafc" />
    {/* Isometric base grid lines */}
    <path d="M10 60 L60 90 L110 60" stroke="#e2e8f0" strokeWidth="1" fill="none" />
    {/* Base Cube 1 (Mint) */}
    <polygon points="36,65 56,53 56,69 36,81" fill="#10b981" />
    <polygon points="36,65 16,53 16,69 36,81" fill="#059669" />
    <polygon points="36,49 56,37 36,25 16,37" fill="#6ee7b7" transform="translate(0, 16)" />
    {/* Base Cube 2 (Sky Blue) */}
    <polygon points="84,65 104,53 104,69 84,81" fill="#0284c7" />
    <polygon points="84,65 64,53 64,69 84,81" fill="#0369a1" />
    <polygon points="84,49 104,37 84,25 64,37" fill="#7dd3fc" transform="translate(0, 16)" />
    {/* Top Peak Cube (Coral Pink) */}
    <polygon points="60,45 80,33 80,51 60,63" fill="#db2777" />
    <polygon points="60,45 40,33 40,51 60,63" fill="#be185d" />
    <polygon points="60,27 80,15 60,3 40,15" fill="#f472b6" transform="translate(0, 18)" />
    {/* Gold coin hovering on top */}
    <circle cx="60" cy="18" r="6" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
    <text x="60" y="104" fill="#0f172a" fontSize="6.5" fontWeight="bold" textAnchor="middle">ISOMETRIK CERAH</text>
  </svg>
);

// 6. INFOGRAFIS POP (Calendar & Checkmarks)
export const InfografisPopThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#f0fdf4" />
    {/* 3D Calendar Card */}
    <rect x="22" y="14" width="76" height="52" rx="7" fill="white" stroke="#dcfce7" strokeWidth="1.5" />
    {/* Calendar Red Header */}
    <rect x="22" y="14" width="76" height="16" rx="7" fill="#ef4444" />
    <rect x="22" y="24" width="76" height="6" fill="#ef4444" />
    <text x="60" y="26" fill="white" fontSize="7" fontWeight="bold" textAnchor="middle">HARI INI</text>
    {/* Day Number */}
    <text x="60" y="55" fill="#0f172a" fontSize="22" fontWeight="900" textAnchor="middle">09</text>
    {/* Checklist Card */}
    <rect x="18" y="72" width="84" height="34" rx="6" fill="white" stroke="#86efac" strokeWidth="1.5" />
    {/* Check 1 */}
    <circle cx="32" cy="83" r="5" fill="#10b981" />
    <polyline points="29,83 31,85 35,81" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="42" y1="83" x2="88" y2="83" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
    {/* Check 2 */}
    <circle cx="32" cy="95" r="5" fill="#10b981" />
    <polyline points="29,95 31,97 35,93" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="42" y1="95" x2="78" y2="95" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
    {/* Confetti */}
    <circle cx="102" cy="24" r="2.5" fill="#f59e0b" />
    <rect x="12" y="35" width="4" height="4" rx="1" fill="#3b82f6" />
    <rect x="100" y="65" width="4" height="4" rx="1" fill="#ec4899" />
  </svg>
);

// 7. KINETIK HUD (Sleep Clock & EKG)
export const KinetikHudThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#030712" />
    {/* Outer HUD Tick Ring */}
    <circle cx="60" cy="50" r="32" stroke="rgba(56,189,248,0.3)" strokeWidth="1" strokeDasharray="3 3" />
    <circle cx="60" cy="50" r="36" stroke="rgba(56,189,248,0.15)" strokeWidth="1" />
    {/* Digital Clock */}
    <text x="56" y="54" fill="white" fontSize="14" fontWeight="900" fontFamily="monospace" textAnchor="middle">07:30</text>
    <text x="76" y="47" fill="#38bdf8" fontSize="6" fontWeight="bold" fontFamily="monospace">AM</text>
    {/* EKG Heartbeat Line */}
    <path d="M15 90 L40 90 L44 95 L48 76 L52 100 L56 86 L60 90 L105 90" stroke="#34d399" strokeWidth="2" strokeLinecap="round" fill="none" />
    {/* Pulse BPM */}
    <text x="60" y="106" fill="#10b981" fontSize="6.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">❤ 72 BPM • OPTIMAL</text>
  </svg>
);

// 8. PITCH MINIMAL (Swiss Geometry)
export const PitchMinimalThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#09090b" />
    {/* Hairline circle compass */}
    <circle cx="60" cy="54" r="34" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
    {/* Blue protractor sweep */}
    <path d="M60 20 A 34 34 0 0 1 88 74" stroke="#3b82f6" strokeWidth="2.5" fill="none" />
    <line x1="60" y1="54" x2="88" y2="74" stroke="#60a5fa" strokeWidth="1.5" />
    <circle cx="60" cy="54" r="3" fill="white" />
    <text x="60" y="58" fill="white" fontSize="12" fontWeight="900" fontFamily="monospace" textAnchor="middle">45°</text>
    {/* Label */}
    <text x="60" y="28" fill="#94a3b8" fontSize="5.5" fontWeight="bold" textAnchor="middle" letterSpacing="1">PIVOT ANGLE</text>
    <rect x="25" y="96" width="70" height="12" rx="3" fill="#22c55e" />
    <text x="60" y="104.5" fill="white" fontSize="6" fontWeight="900" fontFamily="monospace" textAnchor="middle">+420% TAM</text>
  </svg>
);

// 9. UI WEBSITE (Safari Mockup)
export const UiWebThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#f1f5f9" />
    {/* Browser Window */}
    <rect x="14" y="20" width="92" height="78" rx="6" fill="white" stroke="#cbd5e1" strokeWidth="1" />
    {/* Toolbar */}
    <rect x="14" y="20" width="92" height="16" rx="6" fill="#f8fafc" />
    <rect x="14" y="32" width="92" height="4" fill="#f8fafc" />
    <line x1="14" y1="36" x2="106" y2="36" stroke="#e2e8f0" strokeWidth="1" />
    {/* Traffic Lights */}
    <circle cx="22" cy="28" r="2.5" fill="#ef4444" />
    <circle cx="28" cy="28" r="2.5" fill="#f59e0b" />
    <circle cx="34" cy="28" r="2.5" fill="#10b981" />
    {/* URL bar */}
    <rect x="42" y="24" width="56" height="8" rx="4" fill="white" stroke="#cbd5e1" strokeWidth="0.8" />
    <text x="70" y="30" fill="#64748b" fontSize="4.5" textAnchor="middle">satsetmotion.id</text>
    {/* Button */}
    <rect x="36" y="58" width="48" height="16" rx="4" fill="#ea580c" />
    <text x="60" y="68.5" fill="white" fontSize="5.5" fontWeight="bold" textAnchor="middle">Buat Video ➔</text>
    {/* Mouse cursor arrow */}
    <polygon points="68,68 68,82 72,78 76,86 79,84 75,76 81,75" fill="#0f172a" stroke="white" strokeWidth="1" />
    {/* Heading */}
    <text x="60" y="48" fill="#0f172a" fontSize="6.5" fontWeight="bold" textAnchor="middle">Landing Page Pro</text>
  </svg>
);

// 10. KINETIC TYPE (kinetograph)
export const KineticTypeThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#09090b" />
    {/* Diagonal striped bg */}
    <line x1="-20" y1="20" x2="60" y2="-20" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
    <line x1="10" y1="70" x2="90" y2="30" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
    {/* Yellow Box */}
    <rect x="12" y="42" width="96" height="34" fill="#facc15" />
    {/* Black Bold Impact text */}
    <text x="60" y="65" fill="#09090b" fontSize="16" fontWeight="900" fontFamily="Impact, sans-serif" textAnchor="middle" letterSpacing="0.5">
      SEKARANG!
    </text>
    {/* Punchy subheaders */}
    <text x="60" y="32" fill="white" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">FOKUS HASIL</text>
    <rect x="30" y="84" width="60" height="12" rx="3" fill="#ef4444" />
    <text x="60" y="92.5" fill="white" fontSize="5.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">★ 100% EKSEKUSI ★</text>
  </svg>
);

// 11. RETRO PIXEL RPG
export const RetroPixelThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#38bdf8" />
    {/* 8-bit Clouds */}
    <rect x="16" y="18" width="28" height="8" fill="white" />
    <rect x="22" y="14" width="16" height="6" fill="white" />
    {/* Ground tiles */}
    <rect x="0" y="88" width="120" height="8" fill="#22c55e" />
    <rect x="0" y="96" width="120" height="24" fill="#78350f" />
    {/* Brick details */}
    <rect x="8" y="100" width="16" height="6" fill="#92400e" />
    <rect x="32" y="100" width="16" height="6" fill="#92400e" />
    <rect x="56" y="100" width="16" height="6" fill="#92400e" />
    {/* Mystery Box '?' */}
    <rect x="48" y="42" width="24" height="24" fill="#eab308" stroke="#713f12" strokeWidth="2" />
    <text x="60" y="59" fill="white" fontSize="14" fontWeight="bold" fontFamily="monospace" textAnchor="middle">?</text>
    {/* Pixel Hero */}
    <rect x="54" y="70" width="12" height="6" fill="#ef4444" />
    <rect x="55" y="76" width="10" height="6" fill="#fde047" />
    <rect x="54" y="82" width="12" height="8" fill="#0284c7" />
    {/* Sword */}
    <rect x="68" y="74" width="8" height="3" fill="#cbd5e1" />
    {/* HP Hearts */}
    <text x="60" y="12" fill="#ef4444" fontSize="8" fontFamily="monospace" textAnchor="middle">❤❤❤ LVL 99</text>
  </svg>
);

// 12. GLITCH POP
export const GlitchPopThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#050505" />
    {/* CRT scanlines */}
    <line x1="0" y1="20" x2="120" y2="20" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
    <line x1="0" y1="40" x2="120" y2="40" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
    <line x1="0" y1="60" x2="120" y2="60" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
    <line x1="0" y1="80" x2="120" y2="80" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
    {/* RGB Split text */}
    <text x="58" y="58" fill="#06b6d4" fontSize="17" fontWeight="900" fontFamily="Impact, sans-serif" textAnchor="middle">GLITCH POP</text>
    <text x="62" y="60" fill="#ec4899" fontSize="17" fontWeight="900" fontFamily="Impact, sans-serif" textAnchor="middle">GLITCH POP</text>
    <text x="60" y="59" fill="white" fontSize="17" fontWeight="900" fontFamily="Impact, sans-serif" textAnchor="middle">GLITCH POP</text>
    {/* Glitch slices */}
    <rect x="18" y="44" width="45" height="4" fill="#06b6d4" />
    <rect x="65" y="66" width="38" height="3" fill="#ec4899" />
    <text x="60" y="86" fill="#38bdf8" fontSize="5.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">[ CYBER AUDIO SYNC ]</text>
  </svg>
);

// 13. BUBBLE GUM 3D
export const BubbleGumThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <defs>
      <radialGradient id="bubbleJelly" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="30%" stopColor="#f472b6" />
        <stop offset="85%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#be185d" />
      </radialGradient>
    </defs>
    <rect width="120" height="120" fill="#fdf2f8" />
    {/* Floor shadow */}
    <ellipse cx="60" cy="98" rx="26" ry="6" fill="rgba(236,72,153,0.25)" />
    {/* 3D Glossy Jelly Ball */}
    <circle cx="60" cy="62" r="26" fill="url(#bubbleJelly)" />
    {/* Specular Glare */}
    <ellipse cx="50" cy="52" rx="7" ry="3.5" transform="rotate(-30 50 52)" fill="white" opacity="0.8" />
    {/* Floating kinetic accent orbs */}
    <circle cx="92" cy="42" r="2.5" fill="#facc15" />
    <circle cx="28" cy="74" r="2" fill="#38bdf8" />
    <text x="60" y="24" fill="#db2777" fontSize="7" fontWeight="bold" textAnchor="middle">BUBBLE GUM 3D</text>
  </svg>
);

// 14. KOMIK STRIP
export const KomikStripThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#fef08a" />
    {/* Manga radial rays */}
    <polygon points="60,60 0,0 25,0" fill="#fde047" />
    <polygon points="60,60 50,0 75,0" fill="#fde047" />
    <polygon points="60,60 100,0 120,25" fill="#fde047" />
    <polygon points="60,60 120,50 120,75" fill="#fde047" />
    <polygon points="60,60 120,100 95,120" fill="#fde047" />
    <polygon points="60,60 70,120 45,120" fill="#fde047" />
    <polygon points="60,60 20,120 0,95" fill="#fde047" />
    <polygon points="60,60 0,70 0,45" fill="#fde047" />
    {/* Halftone dots */}
    <circle cx="15" cy="15" r="2" fill="#ea580c" opacity="0.3" />
    <circle cx="25" cy="15" r="2" fill="#ea580c" opacity="0.3" />
    <circle cx="15" cy="25" r="2" fill="#ea580c" opacity="0.3" />
    {/* Starburst POW */}
    <polygon
      points="60,30 68,44 84,40 76,54 90,62 74,68 78,84 64,76 56,90 50,76 34,82 40,66 26,58 40,52 32,38 48,44"
      fill="#ef4444"
      stroke="#000000"
      strokeWidth="2"
    />
    <polygon
      points="60,35 66,47 80,43 73,55 84,62 71,67 74,80 63,73 57,84 52,73 38,78 43,65 31,58 43,53 36,41 50,47"
      fill="#facc15"
    />
    <text x="60" y="65" fill="#000000" fontSize="13" fontWeight="900" fontFamily="Impact, sans-serif" textAnchor="middle">
      POW!
    </text>
  </svg>
);

// 15. CLAYMATION
export const ClaymationThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#f5eedc" />
    {/* Shadow */}
    <ellipse cx="60" cy="88" rx="28" ry="7" fill="rgba(74,52,42,0.2)" />
    {/* Clay character blob */}
    <ellipse cx="60" cy="62" rx="30" ry="26" fill="#fb7185" />
    {/* Clay thumbprint texture swirl */}
    <circle cx="54" cy="58" r="16" stroke="rgba(190,24,93,0.3)" strokeWidth="2" fill="none" />
    {/* Clay Eyes */}
    <circle cx="50" cy="54" r="5" fill="white" />
    <circle cx="51" cy="54" r="2.5" fill="#0f172a" />
    <circle cx="70" cy="54" r="5" fill="white" />
    <circle cx="69" cy="54" r="2.5" fill="#0f172a" />
    {/* Smile */}
    <path d="M52 66 Q60 74 68 66" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" fill="none" />
    <rect x="25" y="16" width="70" height="13" rx="4" fill="#38bdf8" />
    <text x="60" y="25" fill="white" fontSize="6.5" fontWeight="bold" textAnchor="middle">CLAY STOPMOTION</text>
  </svg>
);

// 17. MINIMAL SWISS (Modernist Typography & Swiss Grid)
export const MinimalSwissThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#f4f4f5" />
    {/* Swiss Red Accent Block */}
    <rect x="12" y="12" width="96" height="28" fill="#e11d48" />
    <text x="18" y="31" fill="white" fontSize="12" fontWeight="900" fontFamily="Helvetica, Arial, sans-serif" letterSpacing="0.5">
      SWISS 72
    </text>
    <text x="96" y="30" fill="white" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="end">
      № 01
    </text>
    {/* Clean Grid Lines */}
    <line x1="12" y1="46" x2="108" y2="46" stroke="#18181b" strokeWidth="1.5" />
    <line x1="12" y1="78" x2="108" y2="78" stroke="#d4d4d8" strokeWidth="1" />
    <line x1="60" y1="46" x2="60" y2="108" stroke="#18181b" strokeWidth="1" />
    {/* Bold Helvetica Numerals & Alignment */}
    <text x="18" y="72" fill="#18181b" fontSize="22" fontWeight="900" fontFamily="Helvetica, Arial, sans-serif">
      GRID
    </text>
    <text x="68" y="62" fill="#71717a" fontSize="5.5" fontWeight="bold" fontFamily="Helvetica, sans-serif">
      TYPOGRAPHY
    </text>
    <text x="68" y="72" fill="#e11d48" fontSize="6.5" fontWeight="900" fontFamily="monospace">
      100% RATIO
    </text>
    {/* Bottom Footer Specs */}
    <rect x="12" y="86" width="42" height="18" fill="#18181b" />
    <text x="33" y="98" fill="white" fontSize="6" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
      HELVETICA
    </text>
    <text x="68" y="96" fill="#18181b" fontSize="6" fontWeight="bold" fontFamily="monospace">
      BASEL • 1957
    </text>
  </svg>
);

// 18. NOVEL VISUAL (Visual Novel Dialogue Box & Sakura)
export const NovelVisualThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    {/* Twilight anime background */}
    <defs>
      <linearGradient id="vnSky" x1="0" y1="0" x2="0" y2="120">
        <stop offset="0%" stopColor="#312e81" />
        <stop offset="60%" stopColor="#831843" />
        <stop offset="100%" stopColor="#fda4af" />
      </linearGradient>
    </defs>
    <rect width="120" height="120" fill="url(#vnSky)" />
    {/* Anime Character Silhouette Portrait */}
    <circle cx="60" cy="40" r="14" fill="#1e1b4b" opacity="0.9" />
    {/* Hair strands */}
    <path d="M46 36 Q60 22 74 36 Q70 52 60 52 Q50 52 46 36 Z" fill="#1e1b4b" />
    <ellipse cx="60" cy="62" rx="20" ry="12" fill="#1e1b4b" opacity="0.9" />
    {/* Floating Sakura Blossom Petals */}
    <path d="M22 28 Q26 24 28 28 Q26 32 22 28 Z" fill="#fbcfe8" opacity="0.85" />
    <path d="M92 36 Q96 32 98 36 Q96 40 92 36 Z" fill="#fbcfe8" opacity="0.9" />
    <path d="M38 52 Q41 49 43 52 Q41 55 38 52 Z" fill="#fbcfe8" opacity="0.8" />
    {/* Visual Novel Dialogue Box */}
    <rect x="8" y="68" width="104" height="44" rx="6" fill="#0f172a" fillOpacity="0.88" stroke="#f472b6" strokeWidth="1.2" />
    {/* Character Nameplate */}
    <rect x="14" y="62" width="38" height="12" rx="3" fill="#be185d" />
    <text x="33" y="70.5" fill="white" fontSize="5.5" fontWeight="bold" textAnchor="middle">
      Akane
    </text>
    {/* Dialogue Text Lines */}
    <text x="16" y="84" fill="#fdf2f8" fontSize="5.5" fontWeight="medium">
      "Waktu itu... semuanya dimulai."
    </text>
    <text x="16" y="94" fill="#f472b6" fontSize="5" fontWeight="bold">
      [ Klik untuk melanjutkan ]
    </text>
    {/* Blinking Prompt Triangle */}
    <polygon points="102,100 106,104 98,104" fill="#f472b6" />
  </svg>
);

// 19. LINE ART DRAMA (Continuous Expressive Line Art)
export const LineArtDramaThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#fbf8f3" />
    {/* Abstract earthy organic color blobs */}
    <ellipse cx="42" cy="52" rx="24" ry="32" fill="#fed7aa" opacity="0.55" />
    <ellipse cx="80" cy="65" rx="20" ry="26" fill="#fecdd3" opacity="0.45" />
    {/* Continuous Line Face Contour */}
    <path
      d="M32 86 C 30 70, 36 50, 48 38 C 58 28, 70 30, 72 40 C 73 48, 64 52, 60 56 C 56 60, 56 66, 62 70 C 70 76, 82 72, 88 84"
      stroke="#18181b"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    {/* Eye & Brow */}
    <path d="M48 46 Q54 44 60 48" stroke="#18181b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <circle cx="53" cy="50" r="1.8" fill="#18181b" />
    {/* Red String of Fate */}
    <path
      d="M12 98 Q 40 80, 53 50 T 96 35 T 112 50"
      stroke="#dc2626"
      strokeWidth="1.5"
      strokeDasharray="3 2"
      fill="none"
    />
    <circle cx="53" cy="50" r="3" fill="#dc2626" opacity="0.3" />
    {/* Label */}
    <rect x="24" y="98" width="72" height="14" rx="3" fill="#18181b" />
    <text x="60" y="108" fill="#fafaf9" fontSize="6" fontWeight="bold" letterSpacing="0.8" textAnchor="middle">
      LINE ART DRAMA
    </text>
  </svg>
);

// 20. SILUET MISTERI (Noir Streetlight & Shadow)
export const SiluetMisteriThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    {/* Noir Dark Mist */}
    <rect width="120" height="120" fill="#090d16" />
    {/* Warm Streetlight Cone */}
    <polygon points="30,22 10,120 78,120 38,22" fill="#fef08a" opacity="0.18" />
    <circle cx="34" cy="22" r="6" fill="#fef08a" opacity="0.85" />
    <circle cx="34" cy="22" r="16" fill="#fef08a" opacity="0.25" />
    {/* Streetlamp Pole */}
    <line x1="34" y1="22" x2="34" y2="105" stroke="#334155" strokeWidth="2" />
    <path d="M28 22 C 28 14, 38 14, 40 22" stroke="#334155" strokeWidth="2" fill="none" />
    <rect x="28" y="22" width="12" height="4" rx="1" fill="#1e293b" />
    {/* Ground Wet Pavement Reflection */}
    <line x1="0" y1="105" x2="120" y2="105" stroke="#1e293b" strokeWidth="1" />
    {/* Detective Trenchcoat Silhouette */}
    <ellipse cx="64" cy="74" rx="6" ry="6" fill="#020617" />
    {/* Fedora Hat */}
    <ellipse cx="64" cy="71" rx="8" ry="2" fill="#020617" />
    <path d="M59 71 L69 71 L67 67 L61 67 Z" fill="#020617" />
    {/* Long Trenchcoat */}
    <polygon points="58,78 70,78 74,104 54,104" fill="#020617" />
    {/* Long Shadow on pavement */}
    <polygon points="54,104 74,104 115,115 85,115" fill="#020617" opacity="0.75" />
    {/* Title Badge */}
    <rect x="44" y="14" width="66" height="14" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1" />
    <text x="77" y="24" fill="#facc15" fontSize="6" fontWeight="bold" textAnchor="middle" letterSpacing="0.5">
      SILUET NOIR
    </text>
  </svg>
);

// 21. CHIBI ADVENTURE (Kawaii Big Head Adventure)
export const ChibiAdventureThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    {/* Pastel sky */}
    <rect width="120" height="120" fill="#fdf4ff" />
    {/* Pastel rolling hills */}
    <ellipse cx="25" cy="115" rx="55" ry="22" fill="#86efac" />
    <ellipse cx="95" cy="115" rx="50" ry="24" fill="#4ade80" />
    {/* Floating ambient highlights */}
    <circle cx="20" cy="28" r="2" fill="#facc15" />
    <circle cx="102" cy="22" r="2.5" fill="#f472b6" />
    {/* Chibi Oversized Head */}
    <circle cx="56" cy="48" r="19" fill="#fef08a" stroke="#d97706" strokeWidth="1.8" />
    {/* Cute Big Anime Eyes with Highlights */}
    <ellipse cx="49" cy="48" rx="3.5" ry="5.5" fill="#1e1b4b" />
    <circle cx="50" cy="46" r="1.5" fill="white" />
    <ellipse cx="63" cy="48" rx="3.5" ry="5.5" fill="#1e1b4b" />
    <circle cx="64" cy="46" r="1.5" fill="white" />
    {/* Blush Cheeks */}
    <ellipse cx="44" cy="54" rx="3.5" ry="2" fill="#f43f5e" opacity="0.6" />
    <ellipse cx="68" cy="54" rx="3.5" ry="2" fill="#f43f5e" opacity="0.6" />
    {/* Smile */}
    <path d="M53 54 Q56 58 59 54" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    {/* Tiny Hero Body */}
    <rect x="50" y="67" width="12" height="14" rx="3" fill="#3b82f6" />
    {/* Tiny Wooden Sword */}
    <rect x="66" y="62" width="16" height="4" rx="1.5" fill="#b45309" transform="rotate(-30 66 62)" />
    {/* Tiny Bouncy Slime Monster */}
    <path d="M88 88 Q96 74 104 88 Q100 96 92 96 Z" fill="#22c55e" />
    <circle cx="93" cy="85" r="1.2" fill="#064e3b" />
    <circle cx="98" cy="85" r="1.2" fill="#064e3b" />
    {/* Header banner */}
    <rect x="18" y="10" width="84" height="13" rx="4" fill="#c084fc" />
    <text x="60" y="19.5" fill="white" fontSize="6.5" fontWeight="900" textAnchor="middle">
      ★ CHIBI QUEST ★
    </text>
  </svg>
);

// 22. SKETCHBOOK STORY (Spiral Notebook & Graphite Pencil)
export const SketchbookStoryThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#fdfbf7" />
    {/* Spiral Binder Rings on Left */}
    <rect x="0" y="0" width="18" height="120" fill="#f5f0e8" />
    <line x1="18" y1="0" x2="18" y2="120" stroke="#e7dfd5" strokeWidth="1.5" />
    {[12, 28, 44, 60, 76, 92, 108].map((y) => (
      <g key={y}>
        <rect x="4" y={y - 3} width="12" height="6" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
        <circle cx="10" cy={y} r="1.5" fill="#475569" />
      </g>
    ))}
    {/* Pencil Hatching Drawing (Isometric Cube) */}
    <polygon points="56,36 82,46 56,60 30,50" stroke="#475569" strokeWidth="1.5" fill="none" />
    <polygon points="30,50 56,60 56,86 30,76" stroke="#475569" strokeWidth="1.5" fill="#f1f5f9" />
    <polygon points="56,60 82,46 82,72 56,86" stroke="#475569" strokeWidth="1.5" fill="#e2e8f0" />
    {/* Hatching Lines */}
    <line x1="34" y1="56" x2="52" y2="64" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
    <line x1="34" y1="64" x2="52" y2="72" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
    <line x1="34" y1="72" x2="52" y2="80" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
    {/* Yellow HB Pencil */}
    <g transform="rotate(35 88 88)">
      <rect x="76" y="80" width="34" height="6" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
      <polygon points="76,80 66,83 76,86" fill="#fde68a" />
      <polygon points="69,82 66,83 69,84" fill="#334155" />
      <rect x="105" y="80" width="7" height="6" fill="#f43f5e" />
    </g>
    {/* Eraser Shavings */}
    <circle cx="38" cy="94" r="1" fill="#94a3b8" />
    <circle cx="44" cy="98" r="1.2" fill="#94a3b8" />
    <text x="68" y="110" fill="#475569" fontSize="6" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
      SKETCHBOOK 2B
    </text>
  </svg>
);

// 23. BOARDGAME QUEST (Isometric Hex Map & Meeple Token)
export const BoardgameQuestThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#14532d" />
    {/* Hexagon 1: Meadow */}
    <polygon points="40,30 60,18 80,30 80,52 60,64 40,52" fill="#22c55e" stroke="#15803d" strokeWidth="2" />
    {/* Hexagon 2: Desert Road */}
    <polygon points="20,64 40,52 60,64 60,86 40,98 20,86" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
    {/* Hexagon 3: Castle Peak */}
    <polygon points="60,64 80,52 100,64 100,86 80,98 60,86" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />
    {/* Wooden Red Meeple Player Token */}
    <circle cx="40" cy="62" r="4.5" fill="#ef4444" />
    <path d="M35 68 Q40 66 45 68 L48 80 L42 80 L40 74 L38 80 L32 80 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
    {/* 3D Rolling White Dice with Red Pips */}
    <g transform="translate(68, 24)">
      <polygon points="16,10 26,4 36,10 26,16" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
      <polygon points="16,10 26,16 26,28 16,22" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
      <polygon points="26,16 36,10 36,22 26,28" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
      {/* Pips */}
      <circle cx="26" cy="10" r="1.5" fill="#ef4444" />
      <circle cx="21" cy="16" r="1.2" fill="#1e293b" />
      <circle cx="21" cy="22" r="1.2" fill="#1e293b" />
      <circle cx="31" cy="16" r="1.2" fill="#1e293b" />
      <circle cx="31" cy="22" r="1.2" fill="#1e293b" />
    </g>
    <rect x="18" y="102" width="84" height="13" rx="3" fill="#0f172a" />
    <text x="60" y="111" fill="#facc15" fontSize="6" fontWeight="bold" textAnchor="middle" letterSpacing="0.8">
      BOARDGAME QUEST
    </text>
  </svg>
);

// 24. BOUNCE CARTOON (Rubberhose Squash & Stretch Ball)
export const BounceCartoonThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#fffbeb" />
    {/* Ground Baseline */}
    <line x1="10" y1="96" x2="110" y2="96" stroke="#ca8a04" strokeWidth="2" strokeDasharray="4 2" />
    {/* Impact Dust Puff Clouds */}
    <ellipse cx="40" cy="94" rx="10" ry="4" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
    <ellipse cx="80" cy="94" rx="10" ry="4" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
    {/* Motion Action Speed Arc */}
    <path d="M20 30 Q 35 15, 60 70" stroke="#f97316" strokeWidth="2.5" strokeDasharray="3 3" fill="none" />
    {/* Squashed Impact Ball on Ground */}
    <ellipse cx="60" cy="88" rx="28" ry="12" fill="#ef4444" stroke="#991b1b" strokeWidth="2" />
    {/* Eye on ball looking up */}
    <ellipse cx="54" cy="84" rx="3.5" ry="4.5" fill="white" />
    <circle cx="55" cy="83" r="1.8" fill="#18181b" />
    <ellipse cx="66" cy="84" rx="3.5" ry="4.5" fill="white" />
    <circle cx="65" cy="83" r="1.8" fill="#18181b" />
    {/* Stretched Airborne Ball Ghost (top-left) */}
    <ellipse cx="32" cy="28" rx="10" ry="16" fill="#fca5a5" opacity="0.6" transform="rotate(-25 32 28)" />
    {/* Big Impact "BOING!" text */}
    <text x="60" y="44" fill="#ea580c" fontSize="14" fontWeight="900" fontFamily="Impact, sans-serif" textAnchor="middle" letterSpacing="1">
      BOING!!
    </text>
  </svg>
);

// 25. HYPER ZOOM (Speed Lines Tunnel & Comic Zoom)
export const HyperZoomThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#050508" />
    {/* Radial Converging Warp Lines into Center */}
    {[0, 20, 40, 60, 80, 100, 120].map((pos) => (
      <g key={pos}>
        <line x1={pos} y1="0" x2="60" y2="60" stroke="#38bdf8" strokeWidth={pos % 40 === 0 ? 2 : 1} opacity="0.75" />
        <line x1={pos} y1="120" x2="60" y2="60" stroke="#f43f5e" strokeWidth={pos % 40 === 0 ? 2 : 1} opacity="0.75" />
        <line x1="0" y1={pos} x2="60" y2="60" stroke="#facc15" strokeWidth={pos % 40 === 0 ? 2 : 1} opacity="0.75" />
        <line x1="120" y1={pos} x2="60" y2="60" stroke="#a855f7" strokeWidth={pos % 40 === 0 ? 2 : 1} opacity="0.75" />
      </g>
    ))}
    {/* Concentric Tunnel Rings */}
    <circle cx="60" cy="60" r="42" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
    <circle cx="60" cy="60" r="26" stroke="#38bdf8" strokeWidth="2" />
    <circle cx="60" cy="60" r="12" stroke="#facc15" strokeWidth="2.5" />
    {/* Center Warp Core */}
    <circle cx="60" cy="60" r="5" fill="white" />
    {/* Big Kinetic ZOOM Banner */}
    <rect x="15" y="48" width="90" height="24" rx="4" fill="#ef4444" transform="rotate(-6 60 60)" />
    <text x="60" y="66" fill="white" fontSize="15" fontWeight="900" fontFamily="Impact, sans-serif" textAnchor="middle" transform="rotate(-6 60 60)" letterSpacing="1">
      HYPER ZOOM
    </text>
  </svg>
);

// 26. STICKER BOMB (Y2K Die-Cut Layered Vinyl Stickers)
export const StickerBombThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    {/* Acid Checkerboard Background */}
    <rect width="120" height="120" fill="#a855f7" />
    <path d="M0 0 L60 0 L0 60 Z M60 0 L120 0 L0 120 Z M60 60 L120 60 L60 120 Z" fill="#9333ea" opacity="0.4" />
    {/* Sticker 1: Holographic Star (Bottom-Left) */}
    <g transform="rotate(-15 32 75)">
      <polygon points="32,55 36,68 50,68 39,76 43,90 32,81 21,90 25,76 14,68 28,68" fill="white" />
      <polygon points="32,58 35,69 46,69 37,76 40,87 32,80 24,87 27,76 18,69 29,69" fill="#06b6d4" />
    </g>
    {/* Sticker 2: Acid Smiley (Top-Right) */}
    <g transform="rotate(12 85 40)">
      <circle cx="85" cy="40" r="22" fill="white" />
      <circle cx="85" cy="40" r="19" fill="#facc15" />
      <ellipse cx="79" cy="36" rx="2.5" ry="4" fill="#000000" />
      <ellipse cx="91" cy="36" rx="2.5" ry="4" fill="#000000" />
      <path d="M78 44 Q85 52 92 44" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </g>
    {/* Sticker 3: Lightning Bolt (Center Overlap) */}
    <g transform="rotate(-8 55 58)">
      <polygon points="56,26 42,56 54,56 46,86 68,52 56,52" fill="white" stroke="white" strokeWidth="3" strokeLinejoin="round" />
      <polygon points="56,26 42,56 54,56 46,86 68,52 56,52" fill="#ef4444" />
    </g>
    {/* Sticker 4: "Y2K" pill with peel corner */}
    <rect x="22" y="92" width="76" height="18" rx="6" fill="white" />
    <rect x="24" y="94" width="72" height="14" rx="4" fill="#18181b" />
    <text x="60" y="104.5" fill="#22c55e" fontSize="8" fontWeight="900" fontFamily="Impact, sans-serif" textAnchor="middle" letterSpacing="1">
      ★ STICKER BOMB ★
    </text>
  </svg>
);

// 27. CONFETTI BLAST (Party Popper & Festive Streamers)
export const ConfettiBlastThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#0f172a" />
    {/* Golden Party Popper Cone (bottom-left) */}
    <polygon points="12,110 38,98 22,78" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
    <ellipse cx="30" cy="88" rx="12" ry="6" fill="#f97316" transform="rotate(-35 30 88)" />
    {/* Blast Flash Halo */}
    <circle cx="34" cy="82" r="16" fill="#fde047" opacity="0.3" />
    {/* Coiled Streamers Ribbons */}
    <path d="M36 78 Q 45 60, 60 65 T 85 45 T 105 30" stroke="#ec4899" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M38 84 Q 55 82, 70 70 T 100 78" stroke="#06b6d4" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    {/* Geometric Confetti Pieces */}
    <rect x="52" y="32" width="6" height="6" rx="1" fill="#facc15" transform="rotate(25 52 32)" />
    <rect x="74" y="24" width="5" height="7" rx="1" fill="#3b82f6" transform="rotate(-40 74 24)" />
    <rect x="92" y="48" width="6" height="6" rx="1" fill="#22c55e" transform="rotate(15 92 48)" />
    <circle cx="70" cy="46" r="3" fill="#f43f5e" />
    <circle cx="86" cy="62" r="2.5" fill="#a855f7" />
    <circle cx="58" cy="88" r="3.5" fill="#f59e0b" />
    {/* Sparkling glints */}
    <path d="M88 18 Q88 24 82 24 Q88 24 88 30 Q88 24 94 24 Q88 24 88 18 Z" fill="white" />
    <text x="60" y="112" fill="#fde047" fontSize="6.5" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.5">
      CONFETTI BLAST
    </text>
  </svg>
);

// 28. CORPORATE CLEAN (SaaS Glassmorphic KPI Dashboard)
export const CorporateCleanThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#f8fafc" />
    {/* Frosted Glass SaaS KPI Card */}
    <rect x="12" y="16" width="96" height="88" rx="10" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
    {/* Header & Green ARR Growth Pill */}
    <text x="22" y="32" fill="#64748b" fontSize="6" fontWeight="bold">
      ANNUAL REVENUE
    </text>
    <rect x="68" y="23" width="32" height="11" rx="4" fill="#dcfce7" />
    <text x="84" y="31" fill="#15803d" fontSize="5.5" fontWeight="900" textAnchor="middle">
      +248% ARR
    </text>
    {/* Big Primary Metric */}
    <text x="22" y="52" fill="#0f172a" fontSize="16" fontWeight="900" fontFamily="sans-serif">
      $1,420,800
    </text>
    {/* Sparkline Graph Area */}
    <defs>
      <linearGradient id="corpArea" x1="0" y1="0" x2="0" y2="35">
        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
      </linearGradient>
    </defs>
    <polygon points="22,86 36,78 50,82 66,68 82,72 98,58 98,86" fill="url(#corpArea)" />
    <polyline points="22,86 36,78 50,82 66,68 82,72 98,58" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Data points */}
    <circle cx="66" cy="68" r="2.5" fill="#2563eb" />
    <circle cx="98" cy="58" r="3" fill="#2563eb" stroke="white" strokeWidth="1.5" />
    {/* Bottom status badge */}
    <line x1="12" y1="92" x2="108" y2="92" stroke="#f1f5f9" strokeWidth="1" />
    <circle cx="24" cy="98" r="2" fill="#10b981" />
    <text x="30" y="100" fill="#64748b" fontSize="5" fontWeight="bold">
      LIVE PRODUCTION PIPELINE
    </text>
  </svg>
);

// 29. BOTANICAL PASTEL (Watercolor Monstera & Foliage)
export const BotanicalPastelThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#f7fee7" />
    {/* Soft Sun Aura */}
    <circle cx="85" cy="35" r="18" fill="#fef08a" opacity="0.6" />
    {/* Terracotta Ceramic Vase */}
    <path d="M48 85 L72 85 L68 106 L52 106 Z" fill="#ea580c" opacity="0.85" />
    <rect x="46" y="82" width="28" height="5" rx="2" fill="#c2410c" />
    {/* Monstera Split Leaf */}
    <path
      d="M60 84 C 55 58, 30 50, 26 32 C 38 28, 52 35, 58 46 C 62 36, 75 30, 84 34 C 84 48, 70 65, 60 84 Z"
      fill="#65a30d"
      opacity="0.9"
    />
    <path d="M60 84 C 58 60, 56 42, 54 34" stroke="#365314" strokeWidth="1.5" fill="none" />
    {/* Slits in monstera */}
    <path d="M42 38 Q48 42 56 46" stroke="#f7fee7" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M68 40 Q64 45 58 48" stroke="#f7fee7" strokeWidth="2" strokeLinecap="round" fill="none" />
    {/* Eucalyptus Sprig */}
    <path d="M60 84 Q75 62 88 55" stroke="#4d7c0f" strokeWidth="1.5" fill="none" />
    <ellipse cx="72" cy="70" rx="5" ry="3.5" fill="#a3e635" transform="rotate(-20 72 70)" />
    <ellipse cx="82" cy="62" rx="4.5" ry="3" fill="#a3e635" transform="rotate(25 82 62)" />
    <text x="60" y="114" fill="#365314" fontSize="6" fontWeight="bold" textAnchor="middle">
      BOTANICAL PASTEL
    </text>
  </svg>
);

// 30. ZEN PAPER (Crisp 3D Origami Crane)
export const ZenPaperThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#fafaf9" />
    {/* Japanese Washi Textured Sun */}
    <circle cx="60" cy="52" r="26" fill="#ef4444" opacity="0.12" />
    <circle cx="60" cy="52" r="16" fill="#ef4444" opacity="0.25" />
    {/* Crane Cast Shadow on paper */}
    <polygon points="35,92 85,92 70,100 45,100" fill="#e7e5e4" />
    {/* 3D Origami Crane Facets */}
    {/* Body center triangle */}
    <polygon points="60,38 48,72 72,72" fill="#ffffff" stroke="#d6d3d1" strokeWidth="1" />
    {/* Left wing (shaded) */}
    <polygon points="60,38 18,48 48,72" fill="#e7e5e4" stroke="#d6d3d1" strokeWidth="1" />
    {/* Right wing (bright) */}
    <polygon points="60,38 102,48 72,72" fill="#f5f5f4" stroke="#d6d3d1" strokeWidth="1" />
    {/* Crane Head & Neck */}
    <polygon points="60,38 64,22 61,16 57,24" fill="#ffffff" stroke="#d6d3d1" strokeWidth="1" />
    {/* Crane Tail */}
    <polygon points="60,72 60,90 56,76" fill="#d6d3d1" />
    {/* Red Crown accent */}
    <polygon points="64,22 61,16 63,18" fill="#ef4444" />
    {/* Minimal Label */}
    <text x="60" y="112" fill="#78716c" fontSize="6" fontWeight="bold" letterSpacing="1.5" textAnchor="middle">
      ZEN ORIGAMI
    </text>
  </svg>
);

// 31. LO-FI CHILL (Rainy Window & Steaming Mug)
export const LofiChillThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    {/* Night Room Gradient */}
    <defs>
      <linearGradient id="lofiGrad" x1="0" y1="0" x2="0" y2="120">
        <stop offset="0%" stopColor="#1e1b4b" />
        <stop offset="50%" stopColor="#2e1065" />
        <stop offset="100%" stopColor="#3b0764" />
      </linearGradient>
    </defs>
    <rect width="120" height="120" fill="url(#lofiGrad)" />
    {/* Window Frame with Rain */}
    <rect x="14" y="14" width="50" height="60" fill="#0f172a" stroke="#475569" strokeWidth="2" />
    <line x1="39" y1="14" x2="39" y2="74" stroke="#475569" strokeWidth="1.5" />
    <line x1="14" y1="44" x2="64" y2="44" stroke="#475569" strokeWidth="1.5" />
    {/* Rain drops on glass */}
    <line x1="22" y1="20" x2="20" y2="28" stroke="#38bdf8" strokeWidth="1" opacity="0.7" />
    <line x1="32" y1="32" x2="30" y2="42" stroke="#38bdf8" strokeWidth="1" opacity="0.7" />
    <line x1="48" y1="24" x2="46" y2="34" stroke="#38bdf8" strokeWidth="1" opacity="0.7" />
    <line x1="56" y1="50" x2="54" y2="60" stroke="#38bdf8" strokeWidth="1" opacity="0.7" />
    {/* Warm Cozy Desk Lamp Glow */}
    <circle cx="95" cy="30" r="18" fill="#fde047" opacity="0.25" />
    <circle cx="95" cy="30" r="6" fill="#fef08a" />
    <line x1="95" y1="36" x2="95" y2="75" stroke="#713f12" strokeWidth="2" />
    {/* Wooden Desk Surface */}
    <rect x="0" y="75" width="120" height="45" fill="#451a03" />
    <line x1="0" y1="75" x2="120" y2="75" stroke="#78350f" strokeWidth="1.5" />
    {/* Steaming Ceramic Coffee Mug */}
    <rect x="42" y="80" width="18" height="22" rx="3" fill="#f8fafc" />
    <path d="M60 84 Q66 84 66 91 Q66 98 60 98" stroke="#f8fafc" strokeWidth="2" fill="none" />
    {/* Steam curls */}
    <path d="M48 76 Q46 70 48 64 Q50 58 48 54" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M54 76 Q56 70 54 64 Q52 58 54 54" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Cassette Tape */}
    <rect x="70" y="86" width="34" height="20" rx="3" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
    <circle cx="78" cy="96" r="3" fill="#e4e4e7" />
    <circle cx="96" cy="96" r="3" fill="#e4e4e7" />
    <text x="60" y="114" fill="#cbd5e1" fontSize="6" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
      LO-FI CHILL BEATS
    </text>
  </svg>
);

// 32. SOFT GLOW (Ambient Aurora Glow Halo)
export const SoftGlowThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#090a10" />
    {/* Multi-color ambient blurred radial orbs */}
    <defs>
      <radialGradient id="glowViolet" cx="35%" cy="40%" r="55%">
        <stop offset="0%" stopColor="#c084fc" stopOpacity="0.85" />
        <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.5" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
      <radialGradient id="glowCyan" cx="70%" cy="65%" r="50%">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
        <stop offset="50%" stopColor="#0284c7" stopOpacity="0.4" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
      <radialGradient id="glowPeach" cx="50%" cy="30%" r="45%">
        <stop offset="0%" stopColor="#fb7185" stopOpacity="0.7" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
    </defs>
    <rect width="120" height="120" fill="url(#glowViolet)" />
    <rect width="120" height="120" fill="url(#glowCyan)" />
    <rect width="120" height="120" fill="url(#glowPeach)" />
    {/* Floating Bokeh Light Spheres */}
    <circle cx="60" cy="55" r="22" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="rgba(255,255,255,0.08)" />
    <circle cx="34" cy="74" r="8" fill="white" opacity="0.3" />
    <circle cx="86" cy="38" r="10" fill="white" opacity="0.25" />
    <circle cx="60" cy="55" r="3" fill="white" opacity="0.9" />
    {/* Glass card pill */}
    <rect x="20" y="88" width="80" height="18" rx="6" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
    <text x="60" y="100" fill="white" fontSize="6.5" fontWeight="bold" textAnchor="middle" letterSpacing="1">
      AMBIENT GLOW
    </text>
  </svg>
);

// 33. CYBER HUD (Tactical Hologram Target Reticle)
export const CyberHudThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#020817" />
    {/* Tactical Grid Background */}
    <line x1="0" y1="60" x2="120" y2="60" stroke="#0ea5e9" strokeWidth="0.5" opacity="0.3" />
    <line x1="60" y1="0" x2="60" y2="120" stroke="#0ea5e9" strokeWidth="0.5" opacity="0.3" />
    {/* Outer Targeting Rings */}
    <circle cx="60" cy="60" r="44" stroke="#0284c7" strokeWidth="1.2" strokeDasharray="6 3" />
    <circle cx="60" cy="60" r="32" stroke="#38bdf8" strokeWidth="2" />
    <circle cx="60" cy="60" r="18" stroke="#06b6d4" strokeWidth="1" strokeDasharray="3 3" />
    {/* Tactical Locking Brackets */}
    <path d="M42 48 L42 42 L48 42" stroke="#38bdf8" strokeWidth="2.5" />
    <path d="M78 48 L78 42 L72 42" stroke="#38bdf8" strokeWidth="2.5" />
    <path d="M42 72 L42 78 L48 78" stroke="#38bdf8" strokeWidth="2.5" />
    <path d="M78 72 L78 78 L72 78" stroke="#38bdf8" strokeWidth="2.5" />
    {/* Crosshair Center */}
    <circle cx="60" cy="60" r="3" fill="#ef4444" />
    {/* Tactical Coordinates & Status */}
    <text x="60" y="24" fill="#38bdf8" fontSize="5.5" fontWeight="900" fontFamily="monospace" textAnchor="middle">
      LOCK // 34.92° N • 138.4° E
    </text>
    <rect x="25" y="96" width="70" height="12" rx="3" fill="#082f49" stroke="#0284c7" strokeWidth="0.8" />
    <text x="60" y="104.5" fill="#38bdf8" fontSize="5.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
      TACTICAL RADAR 60 FPS
    </text>
  </svg>
);

// 34. MATRIX CODE (Cascading Digital Green Rain Terminal)
export const MatrixCodeThumbnail: React.FC = () => (
  <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#000000" />
    {/* Cascading Green Glyphs Stream */}
    {[
      { x: 12, chars: ['0', '1', '7', '9'], brightIdx: 3 },
      { x: 24, chars: ['日', '本', '語', 'タ', 'ル'], brightIdx: 4 },
      { x: 36, chars: ['1', '0', '1', '1', '0', 'X'], brightIdx: 5 },
      { x: 48, chars: ['シ', 'ス', 'テ', 'ム'], brightIdx: 3 },
      { x: 60, chars: ['M', 'A', 'T', 'R', 'I', 'X'], brightIdx: 5 },
      { x: 72, chars: ['0', '1', '1', '0', '1'], brightIdx: 4 },
      { x: 84, chars: ['デ', 'ー', 'タ', '流'], brightIdx: 3 },
      { x: 96, chars: ['1', '1', '0', '1'], brightIdx: 3 },
      { x: 108, chars: ['Z', '7', '3', '0'], brightIdx: 2 },
    ].map((col, cIdx) => (
      <g key={cIdx}>
        {col.chars.map((char, rIdx) => {
          const isBright = rIdx === col.brightIdx;
          const y = 18 + rIdx * 15;
          return (
            <text
              key={rIdx}
              x={col.x}
              y={y}
              fill={isBright ? '#ffffff' : rIdx > col.brightIdx - 2 ? '#22c55e' : '#15803d'}
              fontSize="9"
              fontWeight={isBright ? '900' : 'bold'}
              fontFamily="monospace"
              textAnchor="middle"
            >
              {char}
            </text>
          );
        })}
      </g>
    ))}
    {/* CRT Scanline bar */}
    <rect x="0" y="80" width="120" height="12" fill="#22c55e" opacity="0.1" />
    {/* Title Bottom Glow */}
    <rect x="18" y="96" width="84" height="14" rx="3" fill="#052e16" stroke="#22c55e" strokeWidth="1" />
    <text x="60" y="106" fill="#4ade80" fontSize="6.5" fontWeight="900" fontFamily="monospace" textAnchor="middle" letterSpacing="1">
      CYBER MATRIX
    </text>
  </svg>
);

// 35. RICH FALLBACK FOR UNKNOWN CUSTOM MODULES (Guarantees zero plain emoji thumbnails)
export const RichFallbackThumbnail: React.FC<{ module: StyleModuleInfo }> = ({ module }) => {
  return (
    <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
      <defs>
        <linearGradient id={`grad-${module.id}`} x1="0" y1="0" x2="120" y2="120">
          <stop stopColor={module.accentColor} />
          <stop offset="1" stopColor={module.secondaryColor} />
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill={`url(#grad-${module.id})`} />
      {/* Decorative vector framing rings */}
      <circle cx="60" cy="50" r="36" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="60" cy="50" r="28" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      {/* Center Icon badge circle */}
      <circle cx="60" cy="50" r="18" fill="white" opacity="0.95" />
      <text x="60" y="56" fontSize="18" textAnchor="middle">{module.icon}</text>
      {/* Bottom Title banner */}
      <rect x="12" y="86" width="96" height="18" rx="5" fill="rgba(0,0,0,0.6)" />
      <text x="60" y="98" fill="white" fontSize="6.5" fontWeight="900" textAnchor="middle" letterSpacing="0.5">
        {module.title.toUpperCase()}
      </text>
    </svg>
  );
};


import React, { useEffect, useRef } from 'react';
import { StyleModuleInfo } from '../data/satset-modules';
import { Check, Plus } from 'lucide-react';
import { renderSatsetStyleLiveDemoFrame } from '../utils/custom-style-runtime';
import {
  BangMotionThumbnail,
  StickmanThumbnail,
  BentoGridThumbnail,
  PapanKapurThumbnail,
  IsometrikCerahThumbnail,
  InfografisPopThumbnail,
  KinetikHudThumbnail,
  PitchMinimalThumbnail,
  UiWebThumbnail,
  KineticTypeThumbnail,
  RetroPixelThumbnail,
  GlitchPopThumbnail,
  BubbleGumThumbnail,
  KomikStripThumbnail,
  ClaymationThumbnail,
  MinimalSwissThumbnail,
  NovelVisualThumbnail,
  LineArtDramaThumbnail,
  SiluetMisteriThumbnail,
  ChibiAdventureThumbnail,
  SketchbookStoryThumbnail,
  BoardgameQuestThumbnail,
  BounceCartoonThumbnail,
  HyperZoomThumbnail,
  StickerBombThumbnail,
  ConfettiBlastThumbnail,
  CorporateCleanThumbnail,
  BotanicalPastelThumbnail,
  ZenPaperThumbnail,
  LofiChillThumbnail,
  SoftGlowThumbnail,
  CyberHudThumbnail,
  MatrixCodeThumbnail,
  RichFallbackThumbnail,
} from './thumbnails/ExtendedThumbnails';

interface StyleThumbnailCardProps {
  module: StyleModuleInfo;
  isSelected: boolean;
  isApplied: boolean;
  onSelect: () => void;
}

const StyleCanvasSnapshot: React.FC<{ module: StyleModuleInfo }> = ({ module }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
      renderSatsetStyleLiveDemoFrame(ctx, canvas.width, canvas.height, module.id, 1.75, {
        ratio: '9:16',
        customStyle: module.customStyleDefinition,
      });
    } catch {
      // Fallback handled if needed
    }
  }, [module.id, module.customStyleDefinition]);

  return (
    <canvas
      ref={canvasRef}
      width={180}
      height={320}
      className="w-full h-full object-cover object-center block"
    />
  );
};

export const StyleThumbnailCard: React.FC<StyleThumbnailCardProps> = ({
  module,
  isSelected,
  isApplied,
  onSelect,
}) => {
  const isCustom = module.id === 'custom';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col text-left rounded-2xl transition-all duration-200 p-1.5 ${
        isSelected
          ? 'bg-blue-50/90 ring-2 ring-blue-500 shadow-md'
          : 'bg-white hover:bg-zinc-50 border border-zinc-200/90 hover:border-zinc-300'
      }`}
    >
      {/* Thumbnail artwork */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-zinc-900 flex items-center justify-center">
        {/* Render specific illustrated thumbnail based on style */}
        <ThumbnailGraphic module={module} />

        {/* Applied badge */}
        {isApplied && (
          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-emerald-500/95 text-white text-[9px] font-extrabold flex items-center gap-0.5 shadow-xs">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
            <span>Aktif</span>
          </div>
        )}

        {/* Tag badge */}
        {module.tag && !isApplied && (
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[9px] font-extrabold uppercase tracking-wider">
            {module.tag}
          </div>
        )}
      </div>

      {/* Title */}
      <div className="mt-1.5 px-1 pb-1">
        <h4 className="font-extrabold text-xs text-zinc-900 group-hover:text-blue-600 transition truncate">
          {isCustom ? 'Buat gaya sendiri!' : module.title}
        </h4>
        <p className="text-[10px] text-zinc-400 truncate mt-0.5">
          {module.subtitle}
        </p>
      </div>
    </button>
  );
};

/**
 * Dedicated vector artwork thumbnail for every style card
 * Matching the exact visual style in Screenshot_20261109-180622 and Screen_Recording_20261109_184056
 */
export const ThumbnailGraphic: React.FC<{ module: StyleModuleInfo }> = ({ module }) => {
  const id = module.id;

  // 0. Otomatis / Default (Non-preview dynamic adaptive mode)
  if (id === 'otomatis') {
    return (
      <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
        <rect width="120" height="120" fill="#0f172a" />
        <rect x="14" y="14" width="92" height="92" rx="18" fill="#1e293b" stroke="#334155" strokeWidth="2" strokeDasharray="5 4" />
        <text x="60" y="55" textAnchor="middle" fill="#60a5fa" fontSize="13" fontWeight="800" fontFamily="sans-serif">
          ACAK
        </text>
        <text x="60" y="72" textAnchor="middle" fill="#cbd5e1" fontSize="9.5" fontWeight="700" fontFamily="sans-serif">
          SESUAI KONSEP
        </text>
      </svg>
    );
  }

  if (id !== 'custom') {
    return <StyleCanvasSnapshot module={module} />;
  }

  // 1. Diorama Data
  if (id === 'diorama_data') {
    return (
      <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
        <rect width="120" height="120" fill="#f0fdf4" />
        {/* Isometric ground */}
        <polygon points="60,22 106,46 60,70 14,46" fill="#bbf7d0" />
        <polygon points="14,46 60,70 60,86 14,62" fill="#86efac" />
        <polygon points="60,70 106,46 106,62 60,86" fill="#4ade80" />
        {/* Pond */}
        <ellipse cx="60" cy="46" rx="16" ry="9" fill="#7dd3fc" />
        {/* Dirt path */}
        <path d="M30 52 Q60 62 88 54" stroke="#fde047" strokeWidth="4" strokeLinecap="round" fill="none" />
        {/* House */}
        <polygon points="28,34 40,26 40,40 28,48" fill="#f87171" />
        <polygon points="40,26 52,34 52,48 40,40" fill="#ef4444" />
        <polygon points="28,34 40,26 52,34 40,42" fill="#dc2626" />
        {/* Trees */}
        <polygon points="85,30 90,44 80,44" fill="#15803d" />
        <polygon points="95,36 99,48 91,48" fill="#16a34a" />
        {/* Gold coin */}
        <circle cx="60" cy="60" r="4.5" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
        {/* Label Kota kecilmu */}
        <rect x="22" y="6" width="76" height="13" rx="4" fill="white" />
        <text x="60" y="15" fill="#15803d" fontSize="7" fontWeight="bold" textAnchor="middle">Kota kecilmu</text>
      </svg>
    );
  }

  // 2. Scribble 3D
  if (id === 'scribble3d') {
    return (
      <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
        <rect width="120" height="120" fill="#2e1065" />
        {/* Scribble background doodle rays */}
        <path d="M20 20 L35 32 M100 20 L85 32 M10 70 L28 66 M105 70 L90 66" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
        <path d="M40 10 L44 18 M76 10 L72 18" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
        {/* Tilted 3D Phone with screen */}
        <g transform="rotate(-12 60 60)">
          <rect x="36" y="24" width="48" height="72" rx="10" fill="#09090b" stroke="#a855f7" strokeWidth="2.5" />
          <rect x="40" y="28" width="40" height="64" rx="6" fill="#3b0764" />
          {/* Glowing Play Icon & Title on screen */}
          <polygon points="56,52 68,60 56,68" fill="#facc15" />
          <text x="60" y="44" fill="#ffffff" fontSize="7" fontWeight="900" textAnchor="middle">MOTIVASI</text>
        </g>
        {/* Bottom speech card */}
        <rect x="10" y="98" width="100" height="16" rx="4" fill="black" opacity="0.8" />
        <text x="60" y="109" fill="white" fontSize="6" fontWeight="bold" textAnchor="middle">Jujur, kamu gak butuh motivasi</text>
      </svg>
    );
  }

  // 3. Scribble 2D
  if (id === 'scribble2d') {
    return (
      <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
        <rect width="120" height="120" fill="#fafaf9" />
        {/* Blue watering can pouring water */}
        <path d="M85 24 L104 20 L98 38 L80 34 Z" fill="#38bdf8" />
        <path d="M78 30 Q70 40 64 52" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="2 3" fill="none" />
        <circle cx="62" cy="56" r="1.5" fill="#0284c7" />
        <circle cx="66" cy="62" r="1.5" fill="#0284c7" />
        {/* Terracotta pot with hatched texture */}
        <polygon points="40,70 80,70 74,102 46,102" fill="#d97706" />
        <rect x="36" y="65" width="48" height="6" rx="2" fill="#b45309" />
        {/* Seedling sprout */}
        <path d="M60 66 Q60 50 56 42" stroke="#22c55e" strokeWidth="3" fill="none" />
        <ellipse cx="50" cy="46" rx="6" ry="4" fill="#86efac" />
        <ellipse cx="64" cy="44" rx="5" ry="3.5" fill="#4ade80" />
        {/* Subtext */}
        <text x="60" y="114" fill="#78716c" fontSize="5.5" fontWeight="bold" textAnchor="middle">masih kosong aja?</text>
      </svg>
    );
  }

  // 4. Modern Flat
  if (id === 'modern_flat') {
    return (
      <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
        <rect width="120" height="120" fill="#eff6ff" />
        {/* Blue 3D Stepped bar columns */}
        <g transform="translate(10, 10)">
          <rect x="20" y="55" width="18" height="35" rx="3" fill="#93c5fd" />
          <polygon points="20,55 26,49 44,49 38,55" fill="#bfdbfe" />
          <polygon points="38,55 44,49 44,84 38,90" fill="#60a5fa" />

          <rect x="42" y="38" width="18" height="52" rx="3" fill="#60a5fa" />
          <polygon points="42,38 48,32 66,32 60,38" fill="#93c5fd" />
          <polygon points="60,38 66,32 66,84 60,90" fill="#3b82f6" />

          <rect x="64" y="20" width="18" height="70" rx="3" fill="#2563eb" />
          <polygon points="64,20 70,14 88,14 82,20" fill="#60a5fa" />
          <polygon points="82,20 88,14 88,84 82,90" fill="#1d4ed8" />
        </g>
        {/* Speech Card */}
        <rect x="12" y="8" width="96" height="18" rx="4" fill="#1e40af" />
        <text x="60" y="20" fill="white" fontSize="6.5" fontWeight="bold" textAnchor="middle">Baru maju satu langkah...</text>
      </svg>
    );
  }

  // 5. Cerita Sinematik
  if (id === 'cerita_sinematik') {
    return (
      <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
        <rect width="120" height="120" fill="#451a03" />
        {/* Room with warm light casting from open door */}
        <polygon points="55,15 110,15 110,105 55,105" fill="#fef3c7" />
        <polygon points="10,85 55,105 110,105 10,105" fill="#78350f" opacity="0.6" />
        {/* Door frame */}
        <rect x="52" y="12" width="58" height="96" fill="none" stroke="#78350f" strokeWidth="3" />
        {/* Wall clock */}
        <circle cx="32" cy="30" r="9" fill="#fde68a" stroke="#78350f" strokeWidth="1.5" />
        <line x1="32" y1="30" x2="32" y2="25" stroke="#78350f" strokeWidth="1.5" />
        <line x1="32" y1="30" x2="37" y2="30" stroke="#78350f" strokeWidth="1.5" />
        {/* Character stepping into light */}
        <circle cx="76" cy="50" r="7" fill="#1c1917" />
        <rect x="71" y="58" width="10" height="24" rx="3" fill="#1c1917" />
        <line x1="73" y1="82" x2="68" y2="102" stroke="#1c1917" strokeWidth="3" strokeLinecap="round" />
        <line x1="79" y1="82" x2="84" y2="102" stroke="#1c1917" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  // 6. Futuristik
  if (id === 'futuristik') {
    return (
      <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
        <rect width="120" height="120" fill="#041e2f" />
        {/* Concentric futuristic HUD rings */}
        <circle cx="60" cy="55" r="38" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="6 4" />
        <circle cx="60" cy="55" r="30" stroke="#38bdf8" strokeWidth="2" />
        <circle cx="60" cy="55" r="22" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3 3" />
        {/* Monospace percentage */}
        <text x="60" y="60" fill="#38bdf8" fontSize="14" fontWeight="900" textAnchor="middle" fontFamily="monospace">
          00%
        </text>
        {/* Subtitle card */}
        <rect x="10" y="96" width="100" height="16" rx="4" fill="#082f49" stroke="#0284c7" strokeWidth="0.8" />
        <text x="60" y="107" fill="#38bdf8" fontSize="6" fontWeight="bold" textAnchor="middle">Masa depan gak bakal datang</text>
      </svg>
    );
  }

  // 7. Celengan Pecah / Pop Ceria
  if (id === 'celengan_pecah' || id === 'pop_ceria') {
    return (
      <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
        <rect width="120" height="120" fill="#312e81" />
        {/* Piggy bank body */}
        <ellipse cx="60" cy="62" rx="32" ry="24" fill="#34d399" />
        {/* Snout */}
        <ellipse cx="32" cy="63" rx="9" ry="7" fill="#6ee7b7" />
        <circle cx="30" cy="63" r="1.5" fill="#065f46" />
        <circle cx="34" cy="63" r="1.5" fill="#065f46" />
        {/* Eye */}
        <circle cx="45" cy="52" r="3.5" fill="white" />
        <circle cx="44" cy="52" r="2" fill="#065f46" />
        {/* Ears */}
        <polygon points="46,42 52,32 56,45" fill="#10b981" />
        {/* Coin slot */}
        <rect x="62" y="39" width="14" height="3" rx="1.5" fill="#065f46" />
        {/* Falling coin */}
        <circle cx="69" cy="27" r="7" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
        <text x="69" y="30" fill="#78350f" fontSize="7" fontWeight="bold" textAnchor="middle">$</text>
        {/* Float label */}
        <rect x="75" y="52" width="32" height="14" rx="4" fill="#fbbf24" />
        <text x="91" y="62" fill="#78350f" fontSize="8" fontWeight="bold" textAnchor="middle">+Rp</text>
        {/* Subtext */}
        <text x="60" y="110" fill="#c7d2fe" fontSize="5.5" fontWeight="bold" textAnchor="middle">Jujur, badan kamu kayak celengan</text>
      </svg>
    );
  }

  // 8. Lanskap Kertas / Papercut
  if (id === 'papercut' || id === 'lanskap_kertas') {
    return (
      <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
        <rect width="120" height="120" fill="#e0f2fe" />
        {/* Rising Sun */}
        <circle cx="88" cy="34" r="14" fill="#f59e0b" />
        {/* Back mountains */}
        <polygon points="10,120 50,42 90,120" fill="#93c5fd" />
        {/* Mid mountains */}
        <polygon points="35,120 75,52 115,120" fill="#60a5fa" />
        {/* Front mountains */}
        <polygon points="0,120 40,68 80,120" fill="#3b82f6" />
        {/* Red Flag on peak */}
        <line x1="50" y1="42" x2="50" y2="30" stroke="#1e293b" strokeWidth="1.5" />
        <polygon points="50,30 62,35 50,40" fill="#ef4444" />
        {/* Subtitle */}
        <text x="60" y="112" fill="#1e3a8a" fontSize="5.5" fontWeight="bold" textAnchor="middle">Kamu lihat puncaknya, ciut duluan?</text>
      </svg>
    );
  }

  // 9. Paper Cutout / Bunga Tumbuh
  if (id === 'bunga_tumbuh' || id === 'paper_cutout') {
    return (
      <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
        <rect width="120" height="120" fill="#fefce8" />
        {/* Sun */}
        <circle cx="95" cy="22" r="11" fill="#fde047" />
        {/* Green grass hill */}
        <ellipse cx="60" cy="115" rx="70" ry="25" fill="#86efac" />
        {/* Stem */}
        <path d="M60 95 Q58 72 60 52" stroke="#22c55e" strokeWidth="3" fill="none" />
        <path d="M59 72 Q48 68 52 60" fill="#4ade80" />
        {/* Petals */}
        <circle cx="60" cy="42" r="6" fill="#f472b6" />
        <circle cx="50" cy="50" r="6" fill="#f472b6" />
        <circle cx="70" cy="50" r="6" fill="#f472b6" />
        <circle cx="54" cy="60" r="6" fill="#f472b6" />
        <circle cx="66" cy="60" r="6" fill="#f472b6" />
        {/* Center */}
        <circle cx="60" cy="52" r="5" fill="#facc15" />
        <text x="60" y="112" fill="#15803d" fontSize="6" fontWeight="bold" textAnchor="middle">Mulai dari langkah kecil</text>
      </svg>
    );
  }

  // 10. Vintage Film / Monochrome Film
  if (id === 'vintage_film' || id === 'monochrome_film') {
    return (
      <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
        <rect width="120" height="120" fill="#27272a" />
        {/* Left film perforations */}
        <rect x="0" y="0" width="14" height="120" fill="#18181b" />
        <rect x="3" y="10" width="8" height="12" rx="2" fill="#52525b" />
        <rect x="3" y="32" width="8" height="12" rx="2" fill="#52525b" />
        <rect x="3" y="54" width="8" height="12" rx="2" fill="#52525b" />
        <rect x="3" y="76" width="8" height="12" rx="2" fill="#52525b" />
        <rect x="3" y="98" width="8" height="12" rx="2" fill="#52525b" />
        {/* Right film perforations */}
        <rect x="106" y="0" width="14" height="120" fill="#18181b" />
        <rect x="109" y="10" width="8" height="12" rx="2" fill="#52525b" />
        <rect x="109" y="32" width="8" height="12" rx="2" fill="#52525b" />
        <rect x="109" y="54" width="8" height="12" rx="2" fill="#52525b" />
        <rect x="109" y="76" width="8" height="12" rx="2" fill="#52525b" />
        <rect x="109" y="98" width="8" height="12" rx="2" fill="#52525b" />
        {/* Scattered Polaroids */}
        <g transform="rotate(-6 45 45)">
          <rect x="25" y="22" width="34" height="40" rx="2" fill="white" />
          <rect x="28" y="25" width="28" height="24" fill="#a1a1aa" />
        </g>
        <g transform="rotate(8 75 50)">
          <rect x="58" y="26" width="34" height="40" rx="2" fill="white" />
          <rect x="61" y="29" width="28" height="24" fill="#71717a" />
        </g>
        {/* Bottom Banner */}
        <rect x="20" y="96" width="80" height="15" rx="3" fill="black" />
        <text x="60" y="107" fill="white" fontSize="6.5" fontWeight="900" textAnchor="middle">CARI KOS PULUHAN FOTO</text>
      </svg>
    );
  }

  // 11. Cara Kerja
  if (id === 'cara_kerja') {
    return (
      <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
        <rect width="120" height="120" fill="#f8fafc" />
        {/* Isometric 3D Laptop opening */}
        <g transform="translate(18, 16)">
          {/* Base */}
          <polygon points="42,50 82,62 42,78 2,64" fill="#cbd5e1" stroke="#334155" strokeWidth="1.5" />
          <polygon points="2,64 42,78 42,84 2,70" fill="#94a3b8" />
          <polygon points="42,78 82,62 82,68 42,84" fill="#64748b" />
          {/* Trackpad */}
          <polygon points="34,68 50,72 44,75 28,71" fill="#e2e8f0" />
          {/* Floating Screen (110 degrees) */}
          <polygon points="42,50 82,62 70,22 30,12" fill="#2563eb" stroke="#1e3a8a" strokeWidth="1.5" />
          <polygon points="42,48 78,59 68,25 32,16" fill="#3b82f6" />
          {/* Glowing Code lines on screen */}
          <line x1="38" y1="26" x2="60" y2="33" stroke="white" strokeWidth="1.5" />
          <line x1="42" y1="34" x2="66" y2="42" stroke="white" strokeWidth="1.5" />
          <text x="54" y="52" fill="#facc15" fontSize="6" fontWeight="bold" textAnchor="middle">MENYALA</text>
        </g>
        {/* Caption */}
        <text x="60" y="112" fill="#334155" fontSize="6" fontWeight="bold" textAnchor="middle">Dari luar kelihatan tenang</text>
      </svg>
    );
  }

  // 12. Neon Game
  if (id === 'neon_game') {
    return (
      <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
        <rect width="120" height="120" fill="#09090b" />
        {/* Neon grid lines */}
        <line x1="10" y1="85" x2="110" y2="85" stroke="#22c55e" strokeWidth="2" />
        <line x1="10" y1="100" x2="110" y2="100" stroke="#15803d" strokeWidth="1" strokeDasharray="4 4" />
        {/* Stage 1 Header */}
        <rect x="25" y="14" width="70" height="18" rx="4" fill="#3b0764" stroke="#a855f7" strokeWidth="1.5" />
        <text x="60" y="26" fill="#f0abfc" fontSize="8" fontWeight="900" textAnchor="middle">STAGE 1</text>
        {/* Green neon cube hero */}
        <rect x="36" y="52" width="18" height="18" rx="3" fill="#22c55e" stroke="#86efac" strokeWidth="2" />
        <circle cx="42" cy="58" r="2" fill="black" />
        <circle cx="48" cy="58" r="2" fill="black" />
        {/* Orange neon spike */}
        <polygon points="76,85 84,65 92,85" fill="#f97316" stroke="#fdba74" strokeWidth="1.5" />
        {/* Score float */}
        <text x="45" y="44" fill="#facc15" fontSize="7" fontWeight="bold">+1</text>
        {/* Bottom */}
        <text x="60" y="112" fill="#a1a1aa" fontSize="6" fontWeight="bold" textAnchor="middle">Lompati rintangan coding</text>
      </svg>
    );
  }

  // 13. Jejak Cahaya
  if (id === 'jejak_cahaya') {
    return (
      <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
        <rect width="120" height="120" fill="#090d16" />
        {/* Glowing star dots */}
        <circle cx="25" cy="25" r="1" fill="#38bdf8" />
        <circle cx="95" cy="35" r="1.5" fill="#38bdf8" />
        <circle cx="80" cy="80" r="1" fill="#38bdf8" />
        {/* Glowing calendar outline */}
        <rect x="35" y="32" width="50" height="42" rx="4" fill="none" stroke="#38bdf8" strokeWidth="2" />
        <line x1="45" y1="28" x2="45" y2="34" stroke="#38bdf8" strokeWidth="2" />
        <line x1="75" y1="28" x2="75" y2="34" stroke="#38bdf8" strokeWidth="2" />
        <line x1="35" y1="44" x2="85" y2="44" stroke="#38bdf8" strokeWidth="1.5" />
        {/* Calendar dots */}
        <circle cx="48" cy="54" r="2" fill="#38bdf8" />
        <circle cx="60" cy="54" r="2" fill="#38bdf8" />
        <circle cx="72" cy="54" r="2" fill="#38bdf8" />
        <circle cx="48" cy="64" r="2" fill="#f43f5e" />
        {/* Subtitle card */}
        <rect x="10" y="94" width="100" height="18" rx="4" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
        <text x="60" y="106" fill="#38bdf8" fontSize="6.5" fontWeight="bold" textAnchor="middle">Lacak ke mana perginya</text>
      </svg>
    );
  }

  // 14. Robekan Kertas / Edukasi Kertas
  if (id === 'robekan_kertas' || id === 'edukasi_kertas') {
    return (
      <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
        <rect width="120" height="120" fill="#f5f0e8" />
        {/* Cutout Sun */}
        <circle cx="28" cy="36" r="12" fill="#facc15" />
        <g stroke="#facc15" strokeWidth="2">
          <line x1="28" y1="18" x2="28" y2="22" />
          <line x1="28" y1="50" x2="28" y2="54" />
          <line x1="10" y1="36" x2="14" y2="36" />
          <line x1="42" y1="36" x2="46" y2="36" />
        </g>
        {/* Cutout Earth globe */}
        <circle cx="78" cy="56" r="24" fill="#3b82f6" />
        <ellipse cx="78" cy="56" rx="10" ry="16" fill="#22c55e" />
        {/* Tags */}
        <rect x="25" y="76" width="30" height="12" rx="3" fill="#fbbf24" />
        <text x="40" y="85" fill="#78350f" fontSize="6" fontWeight="900" textAnchor="middle">SIANG?</text>
        <rect x="68" y="76" width="30" height="12" rx="3" fill="#1e293b" />
        <text x="83" y="85" fill="white" fontSize="6" fontWeight="900" textAnchor="middle">MALAM?</text>
        {/* Subtext */}
        <text x="60" y="110" fill="#44403c" fontSize="6" fontWeight="bold" textAnchor="middle">Kenapa ada siang dan malam?</text>
      </svg>
    );
  }

  // 15. Tenang Minimalis
  if (id === 'tenang_minimalis') {
    return (
      <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
        <rect width="120" height="120" fill="#f4ece1" />
        {/* Soft rising red sun */}
        <circle cx="85" cy="35" r="14" fill="#ea580c" opacity="0.9" />
        {/* Mist gradient hills */}
        <path d="M0 75 Q40 55 80 75 T120 70 L120 120 L0 120 Z" fill="#d6c7b2" opacity="0.7" />
        <path d="M0 90 Q50 78 120 92 L120 120 L0 120 Z" fill="#b8a894" />
        {/* Stacked zen stones */}
        <ellipse cx="42" cy="104" rx="16" ry="6" fill="#57534e" />
        <ellipse cx="42" cy="96" rx="12" ry="5" fill="#78716c" />
        <ellipse cx="42" cy="89" rx="8" ry="4" fill="#a8a29e" />
        {/* Birds */}
        <path d="M25 32 Q29 28 33 32 Q37 28 41 32" stroke="#78716c" strokeWidth="1" fill="none" />
        <text x="60" y="114" fill="#57534e" fontSize="6" fontWeight="bold" textAnchor="middle">Udara tenang di bukit</text>
      </svg>
    );
  }

  // 16. Blueprint
  if (id === 'blueprint') {
    return (
      <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
        <rect width="120" height="120" fill="#0369a1" />
        {/* Blueprint grid */}
        <line x1="0" y1="30" x2="120" y2="30" stroke="#38bdf8" strokeWidth="0.5" opacity="0.5" />
        <line x1="0" y1="60" x2="120" y2="60" stroke="#38bdf8" strokeWidth="0.5" opacity="0.5" />
        <line x1="0" y1="90" x2="120" y2="90" stroke="#38bdf8" strokeWidth="0.5" opacity="0.5" />
        <line x1="30" y1="0" x2="30" y2="120" stroke="#38bdf8" strokeWidth="0.5" opacity="0.5" />
        <line x1="60" y1="0" x2="60" y2="120" stroke="#38bdf8" strokeWidth="0.5" opacity="0.5" />
        <line x1="90" y1="0" x2="90" y2="120" stroke="#38bdf8" strokeWidth="0.5" opacity="0.5" />
        {/* CAD House drafting lines */}
        <polygon points="60,28 92,52 28,52" stroke="white" strokeWidth="1.5" fill="none" />
        <rect x="36" y="52" width="48" height="36" stroke="white" strokeWidth="1.5" fill="none" />
        <rect x="52" y="66" width="16" height="22" stroke="white" strokeWidth="1" fill="none" />
        {/* Dimension arrow */}
        <line x1="26" y1="52" x2="26" y2="88" stroke="#facc15" strokeWidth="1" />
        <text x="18" y="72" fill="#facc15" fontSize="6" fontWeight="bold">h=12m</text>
        <text x="60" y="110" fill="white" fontSize="6.5" fontWeight="bold" textAnchor="middle">CAD PRESISI ARSITEKTUR</text>
      </svg>
    );
  }

  // 17. Bang Motion
  if (id === 'bang_motion') {
    return <BangMotionThumbnail />;
  }

  // 18. Stickman Shorts
  if (id === 'stickman_shorts' || id === 'stickman') {
    return <StickmanThumbnail />;
  }

  // 19. Chibi Adventure (Unique)
  if (id === 'chibi_adventure') {
    return <ChibiAdventureThumbnail />;
  }

  // 20. Bento Grid
  if (id === 'bento_grid') {
    return <BentoGridThumbnail />;
  }

  // 21. Corporate Clean (Unique SaaS KPI)
  if (id === 'corporate_clean') {
    return <CorporateCleanThumbnail />;
  }

  // 22. Papan Kapur
  if (id === 'papan_kapur') {
    return <PapanKapurThumbnail />;
  }

  // 23. Isometrik Cerah
  if (id === 'isometrik_cerah') {
    return <IsometrikCerahThumbnail />;
  }

  // 24. Boardgame Quest (Unique Tabletop Hex)
  if (id === 'boardgame_quest') {
    return <BoardgameQuestThumbnail />;
  }

  // 25. Infografis Pop
  if (id === 'infografis_pop') {
    return <InfografisPopThumbnail />;
  }

  // 26. Confetti Blast (Unique Party Blast)
  if (id === 'confetti_blast') {
    return <ConfettiBlastThumbnail />;
  }

  // 27. Kinetik HUD
  if (id === 'kinetik_hud') {
    return <KinetikHudThumbnail />;
  }

  // 28. Cyber HUD (Unique Tactical Hologram)
  if (id === 'cyber_hud') {
    return <CyberHudThumbnail />;
  }

  // 29. Pitch Minimal
  if (id === 'pitch_minimal') {
    return <PitchMinimalThumbnail />;
  }

  // 30. Minimal Swiss (Unique Helvetica Grid)
  if (id === 'minimal_swiss') {
    return <MinimalSwissThumbnail />;
  }

  // 31. UI Website
  if (id === 'uiweb') {
    return <UiWebThumbnail />;
  }

  // 32. Kinetic Type
  if (id === 'kinetic_type') {
    return <KineticTypeThumbnail />;
  }

  // 33. Hyper Zoom (Unique Warp Speed Tunnel)
  if (id === 'hyper_zoom') {
    return <HyperZoomThumbnail />;
  }

  // 34. Retro Pixel RPG
  if (id === 'retro_pixel_rpg') {
    return <RetroPixelThumbnail />;
  }

  // 35. Cyber Matrix (Unique Green Code Rain)
  if (id === 'matrix_code') {
    return <MatrixCodeThumbnail />;
  }

  // 36. Glitch Pop
  if (id === 'glitch_pop') {
    return <GlitchPopThumbnail />;
  }

  // 37. Bubble Gum 3D
  if (id === 'bubble_gum') {
    return <BubbleGumThumbnail />;
  }

  // 38. Bounce Cartoon (Unique Squash & Stretch)
  if (id === 'bounce_cartoon') {
    return <BounceCartoonThumbnail />;
  }

  // 39. Komik Strip
  if (id === 'komik_strip') {
    return <KomikStripThumbnail />;
  }

  // 40. Sticker Bomb (Unique Y2K Vinyl)
  if (id === 'sticker_bomb') {
    return <StickerBombThumbnail />;
  }

  // 41. Claymation
  if (id === 'stopmotion_clay' || id === 'claymation') {
    return <ClaymationThumbnail />;
  }


  // 43. Novel Visual (Unique Light Novel Dialog)
  if (id === 'novel_visual') {
    return <NovelVisualThumbnail />;
  }

  // 44. Line Art Drama (Unique Expressive One-Line)
  if (id === 'line_art_drama') {
    return <LineArtDramaThumbnail />;
  }

  // 45. Siluet Misteri (Unique Noir Fog Silhouette)
  if (id === 'siluet_misteri') {
    return <SiluetMisteriThumbnail />;
  }

  // 46. Sketchbook Story (Unique Spiral Notebook)
  if (id === 'sketchbook_story') {
    return <SketchbookStoryThumbnail />;
  }

  // 47. Botanical Pastel (Unique Watercolor Monstera)
  if (id === 'botanical_pastel') {
    return <BotanicalPastelThumbnail />;
  }

  // 48. Zen Origami (Unique 3D Paper Crane)
  if (id === 'zen_paper') {
    return <ZenPaperThumbnail />;
  }

  // 49. Lo-Fi Chill (Unique Rain & Coffee)
  if (id === 'lofi_chill') {
    return <LofiChillThumbnail />;
  }

  // 50. Soft Glow (Unique Ambient Aurora)
  if (id === 'soft_glow') {
    return <SoftGlowThumbnail />;
  }

  // 51. Custom Style (+)
  if (id === 'custom') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-xl hover:border-blue-400 transition">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-1.5 shadow-xs">
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </div>
        <span className="text-[11px] font-extrabold text-zinc-800 text-center">
          Buat gaya sendiri!
        </span>
      </div>
    );
  }

  // Saved Custom User Style (e.g. Cyber HUD or any custom user style)
  if (id.startsWith('custom_') || module.renderType === 'custom' || module.category === 'custom') {
    if (id.includes('cyber') || module.title.toLowerCase().includes('cyber') || module.title.toLowerCase().includes('hud')) {
      return <CyberHudThumbnail />;
    }
    return (
      <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
        <rect width="120" height="120" fill="#0b0f19" />
        {/* Subtle grid */}
        <line x1="0" y1="30" x2="120" y2="30" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="0" y1="60" x2="120" y2="60" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="0" y1="90" x2="120" y2="90" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="30" y1="0" x2="30" y2="120" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="60" y1="0" x2="60" y2="120" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="90" y1="0" x2="90" y2="120" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        {/* Glowing concentric circle & spark */}
        <circle cx="60" cy="55" r="32" stroke={module.secondaryColor || '#00e5ff'} strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx="60" cy="55" r="22" fill={`${module.accentColor || '#00ff66'}22`} stroke={module.accentColor || '#00ff66'} strokeWidth="2" />
        <polygon points="60,40 65,50 76,55 65,60 60,70 55,60 44,55 55,50" fill={module.accentColor || '#00ff66'} />
        {/* Label */}
        <rect x="15" y="94" width="90" height="18" rx="4" fill="rgba(0,0,0,0.7)" stroke={module.accentColor || '#00ff66'} strokeWidth="0.8" />
        <text x="60" y="106" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">
          {module.title.slice(0, 14)}
        </text>
      </svg>
    );
  }

  // Rich vector card for any remaining module (never a plain icon over gradient)
  return <RichFallbackThumbnail module={module} />;
};

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronRight,
  Code2,
  Compass,
  Layers,
  Play,
  RotateCcw,
  RotateCw,
  Sparkles,
  X,
} from 'lucide-react';
import { GraphMotionBrandLockup, GraphMotionLogoMark } from './GraphMotionBrandLogo.tsx';
import { StyleLivePreviewPlayer } from './StyleLivePreviewPlayer.tsx';
import {
  computeScrollChoreography,
  computeSlowMoAndFrameLock,
  computeFilmRibbonPoint,
  computePointerParallax,
  evaluateClickSpinBounce,
  computeMorphoCursorWakeState,
  getChapterParticleObjectZone,
  computeScrollCameraObjectState,
  computeBrandIntroState,
  computeCameraOrGraphicParticlePoint,
  computeGraphicSplinePoint,
  computeLockedParticleWorldPosition,
  computeChapterExplanationCameraMotion,
  getConstellationBlueprintForObject,
  REMOTION_STYLE_PLANETS,
  computeInteractivePlanetTransform,
  computeLabStudioHorizonState,
  computeConstellationReelSafeScreenPose,
  computeConstellationParticleTouchScatter,
  type ChapterZoomMode,
  type BrandIntroState,
  type ParticleObjectKind,
  type RemotionPlanetSpec,
} from '../utils/landing-3d-kinematics.ts';

export type StudioStageTarget = 'ide' | 'naskah' | 'suara' | 'animasi';

export interface CreatorSessionUser {
  name: string;
  email: string;
  roleBadge: string;
}

interface LandingPage3DProps {
  currentUser?: CreatorSessionUser | null;
  onUserAuthenticated?: (user: CreatorSessionUser) => void;
  onEnterStudio: (
    user: CreatorSessionUser,
    initialStage?: StudioStageTarget
  ) => void;
  themeMode?: 'dark' | 'light';
  onChangeThemeMode?: (mode: 'dark' | 'light') => void;
  onThemeModeChange?: (mode: 'dark' | 'light') => void;
}

type SpatialZone =
  | 'mid-left'
  | 'top-right'
  | 'top-left'
  | 'mid-right'
  | 'bottom-left'
  | 'bottom-right';

type TransitionStyle =
  | 'liquid-tilt-left'
  | 'origami-skew-bottom-right'
  | 'sonic-ripple-top-left'
  | 'frame-flip-top-right';

interface StoryChapterSpec {
  indexLabel: string;
  kicker: string;
  title: string;
  titleLead: string;
  titleHighlight: string;
  description: string;
  explanationTitle: string;
  explanationDetail: string;
  transitionTag: string;
  graphicType: 'chart3d' | 'storyboard' | 'waveform' | 'spring60fps';
  ctaLabel: string;
  secondaryLabel: string;
  stage: StudioStageTarget;
  headlineZone: SpatialZone;
  explanationZone: SpatialZone;
  transitionStyle: TransitionStyle;
  zoomBadgeLabel: string;
  codePreview: string;
  metricValue: string;
}

const STORY_CHAPTERS: StoryChapterSpec[] = [
  {
    indexLabel: '01 / 05',
    kicker: 'REACT-TO-REMOTION ENGINE',
    title: 'Ubah Kode Menjadi Video Menakjubkan',
    titleLead: 'Ubah Kode Menjadi',
    titleHighlight: 'Video Menakjubkan.',
    description:
      'Jelajahi galaksi produksi 360° berbasis React: putar pandangan galaksi 360° untuk melihat 12 planet style Remotion, klik planet untuk membuka pratinjau video, dan sentuh rasi bintang 60 FPS.',
    explanationTitle: 'Galaksi 360° Planet Style Remotion & Rasi Bintang',
    explanationDetail:
      '12 planet fotorealistik tertambat tetap pada orbit galaksinya. Geser layar 360° untuk menjelajahi seluruh planet, klik planet untuk memutar popup video style Remotion, dan sentuh partikel rasi bintang.',
    transitionTag: 'CONSTELLATION CAMERA α',
    graphicType: 'chart3d',
    ctaLabel: 'Mulai Sekarang',
    secondaryLabel: 'Hubungkan Project',
    stage: 'ide',
    headlineZone: 'mid-left',
    explanationZone: 'bottom-right',
    transitionStyle: 'liquid-tilt-left',
    zoomBadgeLabel: 'ORBITAL · RASI KAMERA · FRAME 01',
    codePreview: `<Composition id="GraphMotionReel" component={MainScene} fps={60} />`,
    metricValue: '60 FPS · TSX',
  },
  {
    indexLabel: '02 / 05',
    kicker: 'IDEASI & NASKAH STORYBOARD',
    title: 'Susun naskah dan adegan secara otomatis.',
    titleLead: 'Susun Naskah & Adegan',
    titleHighlight: 'Secara Otomatis.',
    description:
      'Dari satu topik singkat dan aset yang Anda unggah, AI menyusun hook 3 detik pertama, membagi sekuens adegan, dan mencocokkan pergerakan animasi secara otomatis.',
    explanationTitle: 'Rasi Bintang Clapperboard & Planet Storyboard',
    explanationDetail:
      'Bintang utama α HINGE-SYNC dan β CLAP-BAR membentuk konstelasi papan klaper 3D sementara planet-planet di sekitarnya menampilkan pratinjau style video Remotion.',
    transitionTag: 'ORION SLATE CONSTELLATION',
    graphicType: 'storyboard',
    ctaLabel: 'Buka Alur Naskah',
    secondaryLabel: 'Lanjut ke Suara ↓',
    stage: 'naskah',
    headlineZone: 'bottom-right',
    explanationZone: 'top-left',
    transitionStyle: 'origami-skew-bottom-right',
    zoomBadgeLabel: 'ORBITAL · RASI CLAPPER · FRAME 02',
    codePreview: `<Sequence from={0} durationInFrames={90}><HookScene /></Sequence>`,
    metricValue: '4 ADEGAN',
  },
  {
    indexLabel: '03 / 05',
    kicker: 'RASI BINTANG GRAFIK & VOKAL 24KHZ',
    title: 'Sinkronisasi gelombang suara di tiap frame.',
    titleLead: 'Sinkronisasi Vokal',
    titleHighlight: 'Presisi di Tiap Frame.',
    description:
      'Sintesis vokal karakter 24kHz dengan pemotongan jeda hening otomatis, efek SFX bebas sesuai referensi AI, serta rasi bintang grafik spline 3D.',
    explanationTitle: 'Rasi Bintang Grafik Spline & Planet Diorama',
    explanationDetail:
      'Titik bintang α PEAK +240%, ε KEYFRAME, dan ζ INFLECTION merangkai rasi bintang grafik isometrik yang bereaksi terhadap sentuhan kursor Anda.',
    transitionTag: 'CYGNUS GRAPHIC SPLINE',
    graphicType: 'waveform',
    ctaLabel: 'Coba Studio Suara',
    secondaryLabel: 'Lanjut ke Kanvas ↓',
    stage: 'suara',
    headlineZone: 'top-left',
    explanationZone: 'bottom-right',
    transitionStyle: 'sonic-ripple-top-left',
    zoomBadgeLabel: 'ORBITAL · RASI GRAFIK · FRAME 03',
    codePreview: `const mouth = interpolate(amp[frame], [0, 1], [0.1, 0.95]);`,
    metricValue: '24 kHz WAV',
  },
  {
    indexLabel: '04 / 05',
    kicker: 'KANVAS REMOTION 60 FPS',
    title: 'Pratinjau interaktif dan ekspor kode TSX.',
    titleLead: 'Pratinjau Interaktif &',
    titleHighlight: 'Ekspor Kode TSX.',
    description:
      'Atur kode scene Remotion terlebih dahulu, sesuaikan SFX dinamis dari AI, dan ekspor langsung menjadi bundel komponen React 60 FPS murni.',
    explanationTitle: 'Rasi Bintang Prisma 60fps & Orbit Planet Style',
    explanationDetail:
      'Konstelasi heksagram Lyra Prisma (α APEX-60FPS) berputar presisi bersama planet-planet bulat yang menampilkan berbagai contoh style Remotion.',
    transitionTag: 'LYRA PRISM CONSTELLATION',
    graphicType: 'spring60fps',
    ctaLabel: 'Buka Kanvas 60fps',
    secondaryLabel: 'Masuk Studio ↓',
    stage: 'animasi',
    headlineZone: 'top-right',
    explanationZone: 'bottom-left',
    transitionStyle: 'frame-flip-top-right',
    zoomBadgeLabel: 'ORBITAL · RASI PRISMA · FRAME 04',
    codePreview: `const scale = spring({ fps: 60, frame, config: { damping: 14 } });`,
    metricValue: 'SPRING 60FPS',
  },
];

interface CosmosPanState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isPanning: boolean;
}

/**
 * Draws a photorealistic galaxy-themed celestial planet globe (`design kualitasnya seperti planet sungguhan galaxy theme`)
 * featuring:
 * - 3-stop spherical planetary albedo lighting from `planet.surfacePalette`
 * - Rotating planetary continents, gas-giant cloud bands, polar ice caps, and storm vortices
 * - Subtle embedded live 60 FPS Remotion style motion-graphic hologram in the upper atmosphere
 * - Deep crescent terminator night-side shadow + nocturnal city-light micro-clusters
 * - Rayleigh scattering atmospheric limb glow & solar specular reflection
 */
function drawPlanetRemotionStyleFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  planet: RemotionPlanetSpec,
  elapsedSec: number
) {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const r = Math.min(w, h) * 0.5;
  const [highlightHex, midtoneHex, deepShadowHex] = planet.surfacePalette;

  ctx.clearRect(0, 0, w, h);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  // 1. Photorealistic 3D Spherical Planetary Albedo Base (Vibrant sun-lit day hemisphere to deep cosmic night terminator)
  const baseGrad = ctx.createRadialGradient(
    cx - r * 0.36,
    cy - r * 0.38,
    r * 0.04,
    cx + r * 0.18,
    cy + r * 0.22,
    r * 1.15
  );
  baseGrad.addColorStop(0, '#ffffff');
  baseGrad.addColorStop(0.14, highlightHex);
  baseGrad.addColorStop(0.54, midtoneHex);
  baseGrad.addColorStop(0.86, deepShadowHex);
  baseGrad.addColorStop(1, '#020512');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Photorealistic Planetary Geology: High-Contrast Rotating Cloud Bands, Continents & Great Cyclonic Vortex
  const rotScroll = elapsedSec * 14 + planet.orbitPhaseRad * 25;
  ctx.save();
  if (
    planet.planetArchetype === 'gas-giant-rings' ||
    planet.planetArchetype === 'red-canyon-rings' ||
    planet.planetArchetype === 'obsidian-nebula' ||
    planet.planetArchetype === 'terracotta-moon'
  ) {
    // Banded Gas Giant / Zonal Atmospheric Jet Streams with spherical curvature
    const bandCount = 9;
    for (let b = 0; b < bandCount; b++) {
      const latNorm = (b / (bandCount - 1)) * 2 - 1; // -1..+1
      const bandY = cy + latNorm * r * 0.86;
      const chordW = Math.sqrt(Math.max(0.05, 1 - latNorm * latNorm)) * r;
      const bandH = r * (b % 2 === 0 ? 0.13 : 0.08);

      ctx.fillStyle =
        b % 3 === 0
          ? 'rgba(255, 255, 255, 0.26)'
          : b % 2 === 0
            ? 'rgba(2, 8, 28, 0.34)'
            : 'rgba(255, 255, 255, 0.14)';
      ctx.beginPath();
      ctx.ellipse(
        cx,
        bandY,
        chordW * 1.04,
        bandH + Math.sin(elapsedSec * 0.8 + b) * 1.5,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Great Planetary Anticyclone Storm Eye (like Jupiter's Great Red/Cyan Spot)
    const stormPhase = ((rotScroll * 0.018) % (Math.PI * 2));
    const stormX = cx + Math.sin(stormPhase) * r * 0.42;
    const stormY = cy + r * 0.18;
    const stormVis = Math.cos(stormPhase);
    if (stormVis > -0.2) {
      ctx.save();
      ctx.translate(stormX, stormY);
      ctx.rotate(-0.18);
      const stormGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 0.24);
      stormGrad.addColorStop(0, 'rgba(255,255,255,0.92)');
      stormGrad.addColorStop(0.45, highlightHex);
      stormGrad.addColorStop(1, 'rgba(2,6,23,0)');
      ctx.fillStyle = stormGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.22 * Math.max(0.35, stormVis), r * 0.13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else {
    // Terran / Super-Earth / Exoplanet Continental Landmasses & Swirling Cloud Layer
    for (let c = 0; c < 5; c++) {
      const lonAngle = (elapsedSec * 0.28 + c * 1.25 + planet.orbitPhaseRad) % (Math.PI * 2);
      const projX = Math.sin(lonAngle);
      const visZ = Math.cos(lonAngle);
      if (visZ < -0.15) continue;

      const contX = cx + projX * r * 0.56;
      const contY = cy + Math.sin(c * 2.1 + 0.4) * r * 0.44;
      const foreshorten = Math.max(0.28, visZ);

      ctx.fillStyle =
        c % 2 === 0 ? 'rgba(255, 255, 255, 0.28)' : 'rgba(2, 12, 34, 0.36)';
      ctx.beginPath();
      ctx.ellipse(
        contX,
        contY,
        r * (0.28 + (c % 3) * 0.07) * foreshorten,
        r * (0.17 + (c % 2) * 0.06),
        c * 0.5,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Polar Ice Cap / Aurora Crown at top & bottom poles
    const poleGrad = ctx.createRadialGradient(cx, cy - r * 0.88, 2, cx, cy - r * 0.88, r * 0.48);
    poleGrad.addColorStop(0, 'rgba(255, 255, 255, 0.72)');
    poleGrad.addColorStop(0.55, 'rgba(186, 230, 253, 0.28)');
    poleGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
    ctx.fillStyle = poleGrad;
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.85, r * 0.48, 0, Math.PI * 2);
    ctx.fill();
  }

  // Translucent Spherical Cloud Wisps drifting across the planet
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  for (let wisp = 0; wisp < 4; wisp++) {
    const wy = cy + (wisp - 1.5) * r * 0.34;
    const wxOffset = Math.sin(elapsedSec * 0.55 + wisp * 1.7 + planet.orbitPhaseRad) * r * 0.25;
    ctx.beginPath();
    ctx.arc(cx + wxOffset, wy + r * 0.7, r * 0.78, -Math.PI * 0.62, -Math.PI * 0.38);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Embedded Live Remotion Style Holographic Telemetry Motif (blended crisply inside the sunlit planet atmosphere)
  ctx.save();
  ctx.globalAlpha = 0.88;
  if (planet.styleId === 'studio_3d_room' || planet.styleId === 'precision_cad') {
    const camOrbit = Math.sin(elapsedSec * 1.6) * 9;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.52)';
    ctx.lineWidth = 1.1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 9 + camOrbit * 0.25, cy + 4);
      ctx.lineTo(cx + i * 20 - camOrbit, h);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(2, 12, 32, 0.38)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    const scrX = cx - 22 + camOrbit * 0.3;
    const scrY = cy - 16;
    ctx.fillRect(scrX, scrY, 44, 25);
    ctx.strokeRect(scrX, scrY, 44, 25);
    ctx.fillStyle = planet.accentHex;
    ctx.beginPath();
    ctx.arc(scrX + 12 + Math.sin(elapsedSec * 2.4) * 5, scrY + 12.5, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (planet.styleId === 'diorama_data' || planet.styleId === 'mars_colony') {
    const bars = [0.36, 0.6, 0.48, 0.78];
    for (let b = 0; b < 4; b++) {
      const pulse = Math.sin(elapsedSec * 2.4 + b * 0.9) * 0.07;
      const bh = (bars[b] + pulse) * (r * 0.64);
      const bx = cx - 24 + b * 14;
      const by = cy + 20 - bh;
      ctx.fillStyle = b === 3 ? '#ffffff' : planet.accentHex;
      ctx.fillRect(bx, by, 9, bh);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, 9, 2);
    }
  } else if (planet.styleId === 'editorial_motion_grid' || planet.styleId === 'paper_cutout') {
    const slide = Math.sin(elapsedSec * 2.0) * 6;
    ctx.fillStyle = 'rgba(2, 10, 28, 0.34)';
    ctx.fillRect(cx - 26, cy - 18, 52, 36);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.lineWidth = 1.25;
    ctx.strokeRect(cx - 26, cy - 18, 52, 36);
    ctx.fillStyle = planet.accentHex;
    ctx.fillRect(cx - 22, cy - 14, 28 + slide, 6.5);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(cx - 22, cy - 3, 20, 14);
  } else if (planet.styleId === 'isometric' || planet.styleId === 'midnight_cyber') {
    const rot = elapsedSec * 1.05;
    for (let k = 0; k < 6; k++) {
      const a = rot + (k * Math.PI) / 3;
      const vx = cx + Math.cos(a) * 20;
      const vy = cy + Math.sin(a) * 12;
      ctx.fillStyle = k % 2 === 0 ? '#ffffff' : planet.accentHex;
      ctx.fillRect(vx - 3.5, vy - 3.5, 7, 7);
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (planet.styleId === 'stickman_hud' || planet.styleId === 'claymorphism') {
    const wave = Math.sin(elapsedSec * 3.8) * 0.35;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy - 12, 6, 0, Math.PI * 2);
    ctx.moveTo(cx, cy - 6);
    ctx.lineTo(cx, cy + 8);
    ctx.moveTo(cx, cy - 2);
    ctx.lineTo(cx + 11, cy - 9 + Math.sin(elapsedSec * 4.5) * 5);
    ctx.moveTo(cx, cy - 2);
    ctx.lineTo(cx - 11, cy + 3);
    ctx.moveTo(cx, cy + 8);
    ctx.lineTo(cx - 7 + wave * 4, cy + 20);
    ctx.moveTo(cx, cy + 8);
    ctx.lineTo(cx + 7 - wave * 4, cy + 20);
    ctx.stroke();
  } else {
    const barCount = 9;
    for (let i = 0; i < barCount; i++) {
      const u = i / (barCount - 1);
      const amp =
        0.24 +
        0.65 *
          Math.abs(Math.sin(elapsedSec * 3.4 + i * 0.65)) *
          Math.sin(u * Math.PI);
      const bh = amp * (r * 0.68);
      const bx = cx - 24 + i * 6;
      ctx.fillStyle = i % 2 === 0 ? '#ffffff' : planet.accentHex;
      ctx.fillRect(bx, cy - bh * 0.5, 3.5, bh);
    }
  }
  ctx.restore();

  // 4. Balanced Crescent Planetary Terminator Shadow (preserves vibrant day-side geology while shading the night crescent)
  const terminatorGrad = ctx.createRadialGradient(
    cx - r * 0.48,
    cy - r * 0.46,
    r * 0.32,
    cx + r * 0.25,
    cy + r * 0.28,
    r * 1.18
  );
  terminatorGrad.addColorStop(0, 'rgba(255, 255, 255, 0.24)');
  terminatorGrad.addColorStop(0.55, 'rgba(255, 255, 255, 0)');
  terminatorGrad.addColorStop(0.76, 'rgba(2, 8, 23, 0.38)');
  terminatorGrad.addColorStop(0.9, 'rgba(1, 4, 15, 0.72)');
  terminatorGrad.addColorStop(1, 'rgba(0, 2, 8, 0.92)');
  ctx.fillStyle = terminatorGrad;
  ctx.fillRect(0, 0, w, h);

  // 5. Nocturnal City-Light Micro-Clusters glowing on the dark night-side crescent of the planet
  for (let n = 0; n < 9; n++) {
    const ang = 0.2 + n * 0.16;
    const distR = r * (0.56 + ((n * 19) % 30) * 0.01);
    const nx = cx + Math.cos(ang) * distR;
    const ny = cy + Math.sin(ang) * distR;
    const pulse = 0.4 + 0.6 * Math.sin(elapsedSec * 2.2 + n * 1.7);
    ctx.fillStyle =
      n % 2 === 0
        ? `rgba(254, 240, 138, ${0.55 * pulse})`
        : `rgba(125, 211, 252, ${0.5 * pulse})`;
    ctx.beginPath();
    ctx.arc(nx, ny, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. Rayleigh Atmospheric Scattering Limb Fresnel Rim (luminous sunward crescent arc)
  const rimGrad = ctx.createLinearGradient(0, 0, w, h);
  rimGrad.addColorStop(0, '#ffffff');
  rimGrad.addColorStop(0.35, highlightHex);
  rimGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.12)');
  rimGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
  ctx.strokeStyle = rimGrad;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 1.2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Photorealistic 360° Galaxy Nebula, Deep-Space Starfield & Giant Curved Planet Horizon Canvas
 * rendered at the very bottom-back (`z-[2]`), rotating smoothly through 360° as the user
 * drags sideways (`geser 360°`) or scrolls (`gulir`).
 */
const LabStudioGiantPlanetHorizonCanvas: React.FC<{
  scrollProgressRef: React.MutableRefObject<number>;
  cosmosPanRef: React.MutableRefObject<CosmosPanState>;
  isLight: boolean;
}> = ({ scrollProgressRef, cosmosPanRef, isLight }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isLightRef = useRef<boolean>(isLight);
  useEffect(() => {
    isLightRef.current = isLight;
  }, [isLight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth || 1440);
    let height = (canvas.height = window.innerHeight || 900);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth || 1440;
      height = canvas.height = window.innerHeight || 900;
    };
    window.addEventListener('resize', onResize, { passive: true });

    let rafId = 0;
    let disposed = false;
    const startMs = performance.now();

    const drawHorizon = () => {
      if (disposed) return;
      const elapsedSec = (performance.now() - startMs) / 1000;
      const pan = cosmosPanRef.current;

      const hz = computeLabStudioHorizonState(
        scrollProgressRef.current,
        pan.x,
        pan.y,
        elapsedSec
      );

      ctx.clearRect(0, 0, width, height);

      // 0. 360° Panoramic Galaxy Nebula Clouds that wrap seamlessly as the user pans 360°
      if (!isLightRef.current) {
        const nebulaClusters = [
          { az: 35, yNorm: 0.28, rNorm: 0.34, col0: 'rgba(56, 189, 248, 0.13)', col1: 'rgba(79, 70, 229, 0.06)' },
          { az: 125, yNorm: 0.42, rNorm: 0.38, col0: 'rgba(129, 140, 248, 0.14)', col1: 'rgba(14, 165, 233, 0.05)' },
          { az: 215, yNorm: 0.24, rNorm: 0.36, col0: 'rgba(45, 212, 191, 0.12)', col1: 'rgba(56, 189, 248, 0.05)' },
          { az: 305, yNorm: 0.36, rNorm: 0.35, col0: 'rgba(59, 130, 246, 0.14)', col1: 'rgba(147, 51, 234, 0.05)' },
        ];
        for (const neb of nebulaClusters) {
          const deltaAz = ((((neb.az - hz.galaxyYawDeg + 180) % 360) + 360) % 360) - 180;
          if (Math.abs(deltaAz) > 135) continue;
          const nebX = width * 0.5 + (deltaAz / 95) * (width * 0.55);
          const nebY = height * neb.yNorm + Math.max(-90, Math.min(90, pan.y * 0.18));
          const nebR = Math.max(width, height) * neb.rNorm;
          const nebGrad = ctx.createRadialGradient(nebX, nebY, nebR * 0.05, nebX, nebY, nebR);
          nebGrad.addColorStop(0, neb.col0);
          nebGrad.addColorStop(0.52, neb.col1);
          nebGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
          ctx.fillStyle = nebGrad;
          ctx.beginPath();
          ctx.arc(nebX, nebY, nebR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 1. Deep-space 360° parallax starfield that wraps continuously around the galaxy
      const starShiftX = pan.x * 0.65;
      const starShiftY = pan.y * 0.28 - scrollProgressRef.current * 180;
      ctx.save();
      for (let i = 0; i < 140; i++) {
        const rawX = (((i * 263 + 59) % 1009) / 1009) * width + starShiftX * (0.45 + (i % 4) * 0.28);
        const rawY = (((i * 421 + 97) % 1013) / 1013) * height + starShiftY * (0.4 + (i % 4) * 0.25);
        const sx = ((rawX % width) + width) % width;
        const sy = ((rawY % height) + height) % height;
        const twinkle = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(elapsedSec * (1.1 + (i % 5) * 0.35) + i * 1.9));
        const r = i % 11 === 0 ? 1.7 : i % 4 === 0 ? 1.15 : 0.75;
        ctx.fillStyle = isLightRef.current
          ? `rgba(37, 99, 235, ${twinkle * 0.35})`
          : i % 9 === 0
          ? `rgba(147, 197, 253, ${twinkle * 0.85})`
          : i % 13 === 0
          ? `rgba(167, 243, 208, ${twinkle * 0.78})`
          : `rgba(248, 250, 252, ${twinkle * 0.65})`;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 1b. 360° Space Observatory Celestial Equator & Azimuth Compass Arc
      // (`bisa di putar kamera 360° seperti bisa memantau luar angkasa`)
      ctx.save();
      const viewportHalfSpanPx = Math.min(540, Math.max(142, width * 0.39));
      const eclipticBaseY = height * 0.46 + Math.max(-75, Math.min(75, pan.y * 0.22));
      ctx.strokeStyle = isLightRef.current
        ? 'rgba(37, 99, 235, 0.14)'
        : 'rgba(56, 189, 248, 0.14)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      for (let deg = -54; deg <= 54; deg += 3) {
        const px = width * 0.5 + (deg / 38) * viewportHalfSpanPx;
        const py = eclipticBaseY + Math.sin((deg * Math.PI) / 180) * 20;
        if (deg === -54) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      for (let az = 0; az < 360; az += 15) {
        const deltaDeg = ((((az - hz.galaxyYawDeg + 180) % 360) + 360) % 360) - 180;
        if (Math.abs(deltaDeg) > 54) continue;
        const tickX = width * 0.5 + (deltaDeg / 38) * viewportHalfSpanPx;
        const tickY = eclipticBaseY + Math.sin((deltaDeg * Math.PI) / 180) * 20;
        const edgeFade = Math.max(0, Math.min(1, 1 - Math.abs(deltaDeg) / 54));
        const isSectorMajor = az % 30 === 0;

        ctx.strokeStyle = isLightRef.current
          ? `rgba(37, 99, 235, ${(isSectorMajor ? 0.38 : 0.2) * edgeFade})`
          : `rgba(125, 211, 252, ${(isSectorMajor ? 0.38 : 0.18) * edgeFade})`;
        ctx.lineWidth = isSectorMajor ? 1.3 : 0.9;
        ctx.beginPath();
        ctx.moveTo(tickX, tickY - (isSectorMajor ? 8 : 4));
        ctx.lineTo(tickX, tickY + (isSectorMajor ? 8 : 4));
        ctx.stroke();

        if (isSectorMajor) {
          ctx.fillStyle = isLightRef.current
            ? `rgba(29, 78, 216, ${0.42 * edgeFade})`
            : `rgba(186, 230, 253, ${0.45 * edgeFade})`;
          ctx.font = '600 9px ui-monospace, SFMono-Regular, Menlo, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${az}°`, tickX, tickY - 12);
        }
      }
      ctx.restore();

      // 2. Giant Curved Planetary Globe at Bottom (`seperti di video 00:03-00:05, 00:22, 00:26`)
      const planetR = Math.max(width, height) * 1.38;
      const planetCx = width * 0.5 + hz.horizonPanX;
      const horizonTopY = height * 0.81 - hz.horizonLiftPx;
      const planetCy = horizonTopY + planetR;

      ctx.save();
      ctx.translate(planetCx, horizonTopY);
      ctx.rotate((hz.horizonTiltDeg * Math.PI) / 180);
      ctx.translate(-planetCx, -horizonTopY);

      // 2a. Outer Exosphere Blue-Cyan Atmospheric Glow above the Planet Limb
      const exoGrad = ctx.createRadialGradient(
        planetCx,
        planetCy,
        planetR * 0.96,
        planetCx,
        planetCy,
        planetR * 1.11
      );
      exoGrad.addColorStop(0, isLightRef.current ? 'rgba(56, 189, 248, 0.45)' : 'rgba(186, 230, 253, 0.62)');
      exoGrad.addColorStop(0.22, isLightRef.current ? 'rgba(37, 99, 235, 0.25)' : 'rgba(56, 189, 248, 0.36)');
      exoGrad.addColorStop(0.55, isLightRef.current ? 'rgba(59, 130, 246, 0.08)' : 'rgba(29, 78, 216, 0.14)');
      exoGrad.addColorStop(1, 'rgba(2, 8, 23, 0)');
      ctx.fillStyle = exoGrad;
      ctx.beginPath();
      ctx.arc(planetCx, planetCy, planetR * 1.11, Math.PI * 1.12, Math.PI * 1.88);
      ctx.closePath();
      ctx.fill();

      // 2b. Solid Curved Planetary Body with Deep Nocturnal Ocean & Terminator Shading
      ctx.save();
      ctx.beginPath();
      ctx.arc(planetCx, planetCy, planetR, 0, Math.PI * 2);
      ctx.clip();

      const bodyGrad = ctx.createRadialGradient(
        planetCx - width * 0.08,
        horizonTopY + 18,
        10,
        planetCx,
        horizonTopY + 260,
        width * 0.85
      );
      if (isLightRef.current) {
        bodyGrad.addColorStop(0, '#bae6fd');
        bodyGrad.addColorStop(0.28, '#38bdf8');
        bodyGrad.addColorStop(0.65, '#0369a1');
        bodyGrad.addColorStop(1, '#082f49');
      } else {
        bodyGrad.addColorStop(0, '#38bdf8');
        bodyGrad.addColorStop(0.14, '#0c4a6e');
        bodyGrad.addColorStop(0.42, '#04132c');
        bodyGrad.addColorStop(0.82, '#020714');
        bodyGrad.addColorStop(1, '#01030a');
      }
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(0, horizonTopY - 60, width, height - horizonTopY + 220);

      // 2c. Sparkling Nocturnal Surface City-Light Clusters & Continental Grid (`00:25-00:28` in video)
      const surfShift = hz.surfaceRotationShiftPx;
      for (let c = 0; c < 64; c++) {
        const angleSpread = ((c / 64) - 0.5) * 0.62 + ((surfShift * 0.00045) % 0.18) - 0.09;
        const depthFromLimb = 14 + ((c * 79) % 165) + Math.sin(c * 2.1) * 12;
        const lx = planetCx + Math.sin(angleSpread) * (planetR - depthFromLimb);
        const ly = planetCy - Math.cos(angleSpread) * (planetR - depthFromLimb);
        if (ly < horizonTopY + 4 || ly > height + 20) continue;

        const pulse = 0.45 + 0.55 * Math.sin(elapsedSec * 2.4 + c * 1.3);
        const isWarmCluster = c % 3 !== 0;
        ctx.fillStyle = isWarmCluster
          ? `rgba(254, 240, 138, ${0.65 * pulse})`
          : `rgba(125, 211, 252, ${0.7 * pulse})`;
        const dotR = c % 7 === 0 ? 2.1 : 1.25;
        ctx.beginPath();
        ctx.arc(lx, ly, dotR, 0, Math.PI * 2);
        ctx.fill();

        if (c % 5 === 0) {
          ctx.strokeStyle = `rgba(186, 230, 253, ${0.18 * pulse})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(lx, ly);
          ctx.lineTo(lx + 18 * Math.cos(c), ly + 7 * Math.sin(c));
          ctx.stroke();
        }
      }
      ctx.restore();

      // 2d. Razor-Sharp Incandescent White-Cyan Atmospheric Limb Arc
      ctx.strokeStyle = isLightRef.current
        ? 'rgba(2, 132, 199, 0.85)'
        : 'rgba(224, 242, 254, 0.94)';
      ctx.lineWidth = 2.6;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.arc(planetCx, planetCy, planetR, Math.PI * 1.22, Math.PI * 1.78);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 2e. Blinding Solar Limb Sunrise Flare & Radial Sunbeams (`00:03-00:05` & `00:22` in video)
      const sunAngle = -Math.PI * 0.5 - 0.06 + (hz.horizonPanX / Math.max(1, width)) * 0.14;
      const sunX = planetCx + Math.cos(sunAngle) * planetR;
      const sunY = planetCy + Math.sin(sunAngle) * planetR;
      const flareR = Math.min(width, height) * (0.28 + 0.1 * hz.solarFlareIntensity);

      const sunBurst = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, flareR);
      sunBurst.addColorStop(0, `rgba(255, 255, 255, ${0.96 * hz.solarFlareIntensity})`);
      sunBurst.addColorStop(0.16, `rgba(224, 242, 254, ${0.78 * hz.solarFlareIntensity})`);
      sunBurst.addColorStop(0.42, `rgba(56, 189, 248, ${0.38 * hz.solarFlareIntensity})`);
      sunBurst.addColorStop(0.75, `rgba(37, 99, 235, ${0.12 * hz.solarFlareIntensity})`);
      sunBurst.addColorStop(1, 'rgba(2, 8, 23, 0)');
      ctx.fillStyle = sunBurst;
      ctx.beginPath();
      ctx.arc(sunX, sunY, flareR, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(sunX, sunY);
      const streakW = Math.min(width * 0.55, 560) * hz.solarFlareIntensity;
      const streakGrad = ctx.createLinearGradient(-streakW, 0, streakW, 0);
      streakGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      streakGrad.addColorStop(0.35, `rgba(125, 211, 252, ${0.55 * hz.solarFlareIntensity})`);
      streakGrad.addColorStop(0.5, `rgba(255, 255, 255, ${0.95 * hz.solarFlareIntensity})`);
      streakGrad.addColorStop(0.65, `rgba(125, 211, 252, ${0.55 * hz.solarFlareIntensity})`);
      streakGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = streakGrad;
      ctx.fillRect(-streakW, -2.2, streakW * 2, 4.4);

      for (let ray = 0; ray < 8; ray++) {
        const ra = (ray / 8) * Math.PI - Math.PI + Math.sin(elapsedSec * 0.5 + ray) * 0.04;
        const rayLen = flareR * (0.65 + (ray % 2) * 0.35);
        ctx.strokeStyle = `rgba(224, 242, 254, ${0.22 * hz.solarFlareIntensity})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ra) * rayLen, Math.sin(ra) * rayLen * 0.65);
        ctx.stroke();
      }
      ctx.restore();

      ctx.restore();

      rafId = requestAnimationFrame(drawHorizon);
    };

    rafId = requestAnimationFrame(drawHorizon);
    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  }, [cosmosPanRef, scrollProgressRef]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="labstudio-planet-horizon-canvas"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full"
    />
  );
};

/**
 * Photorealistic Galaxy-Themed Remotion Style Planet (`planetnya tetap ditempatnya gabisa di geser pindah pindah`)
 * - Locked strictly in its orbital galaxy coordinate (`data-locked-in-orbit="true"`): individual dragging is disabled!
 * - Rotates smoothly across the viewport as the user pans the 360° galaxy view (`geser kesamping dan geser 360°`).
 * - Clicking the planet opens the Remotion Style Video Popup Modal (`saat planet style video di klik akan menampilkan popup video style remotion nya`).
 */
const RemotionStylePlanetSphere: React.FC<{
  planet: RemotionPlanetSpec;
  scrollProgressRef: React.MutableRefObject<number>;
  cosmosPanRef: React.MutableRefObject<CosmosPanState>;
  isLight: boolean;
  onSelectPlanet: (planet: RemotionPlanetSpec) => void;
}> = ({ planet, scrollProgressRef, cosmosPanRef, isLight, onSelectPlanet }) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const haloRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerNormRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const isHoveredRef = useRef<boolean>(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let rafId = 0;
    let disposed = false;
    const startMs = performance.now();

    const onWindowPointerMove = (e: PointerEvent) => {
      pointerNormRef.current = {
        x: (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1,
        y: -(e.clientY / Math.max(1, window.innerHeight)) * 2 + 1,
      };
    };
    window.addEventListener('pointermove', onWindowPointerMove, { passive: true });

    const tick = () => {
      if (disposed) return;
      const elapsedSec = (performance.now() - startMs) / 1000;
      const viewportHalfSpanPx = Math.min(
        540,
        Math.max(142, (window.innerWidth || 1440) * 0.39)
      );

      const tf = computeInteractivePlanetTransform(
        planet,
        elapsedSec,
        scrollProgressRef.current,
        pointerNormRef.current.x,
        pointerNormRef.current.y,
        cosmosPanRef.current.x,
        cosmosPanRef.current.y,
        isHoveredRef.current,
        viewportHalfSpanPx
      );

      if (wrapperRef.current) {
        wrapperRef.current.style.transform = `translate3d(${tf.translateX.toFixed(
          1
        )}px, ${tf.translateY.toFixed(1)}px, 0) scale(${tf.scale.toFixed(3)})`;
        wrapperRef.current.style.opacity = tf.frustumOpacity.toFixed(3);
        wrapperRef.current.style.pointerEvents = tf.isVisibleInFrustum
          ? 'auto'
          : 'none';
        wrapperRef.current.setAttribute(
          'data-visible-in-frustum',
          tf.isVisibleInFrustum ? 'true' : 'false'
        );
      }
      if (haloRef.current) {
        haloRef.current.style.opacity = tf.haloIntensity.toFixed(2);
      }

      if (tf.isVisibleInFrustum) {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            drawPlanetRemotionStyleFrame(
              ctx,
              canvas.width,
              canvas.height,
              planet,
              elapsedSec
            );
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onWindowPointerMove);
    };
  }, [cosmosPanRef, planet, scrollProgressRef]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Do NOT call e.stopPropagation() — dragging starting on a planet pans the 360° galaxy view,
    // while the planet itself stays locked at its orbital galaxy coordinate!
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerDownPosRef.current) return;
    const travel = Math.hypot(
      e.clientX - pointerDownPosRef.current.x,
      e.clientY - pointerDownPosRef.current.y
    );
    pointerDownPosRef.current = null;
    if (travel < 10) {
      e.stopPropagation();
      onSelectPlanet(planet);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectPlanet(planet);
    }
  };

  return (
    <div
      ref={wrapperRef}
      role="button"
      tabIndex={0}
      aria-label={`Buka pratinjau video Remotion ${planet.planetName} (${planet.styleTitle})`}
      data-testid={`interactive-planet-${planet.id}`}
      data-planet-style={planet.styleId}
      data-preview-style={planet.previewStyleId}
      data-locked-in-orbit="true"
      data-azimuth-deg={planet.azimuthDeg}
      data-depth-layer="behind"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => {
        isHoveredRef.current = true;
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
        setIsHovered(false);
      }}
      style={{
        left: '50%',
        top: `${planet.anchorTopPct}%`,
        width: planet.sizePx,
        height: planet.sizePx,
        marginLeft: -planet.sizePx * 0.5,
        marginTop: -planet.sizePx * 0.5,
      }}
      className="group absolute block pointer-events-auto select-none cursor-pointer focus:outline-none"
    >
      <div className="relative w-full h-full scale-[0.58] sm:scale-[0.88] lg:scale-100 transition-transform duration-300">
        {/* Deep-Space Rayleigh Atmospheric Corona Halo */}
        <div
          ref={haloRef}
          aria-hidden="true"
          style={{
            background: `radial-gradient(circle, ${planet.atmosphereColor} 0%, rgba(56,189,248,0.16) 46%, rgba(2,6,23,0) 74%)`,
          }}
          className="pointer-events-none absolute -inset-8 rounded-full blur-md transition-opacity duration-300"
        />

        {/* 3D Tilted Saturn-Style Planetary Ring — BACK HALF (behind sphere) */}
        {planet.hasRings && (
          <svg
            aria-hidden="true"
            viewBox="0 0 220 220"
            style={{
              transform: `rotate(${planet.ringTiltDeg}deg)`,
            }}
            className="pointer-events-none absolute -inset-[36%] w-[172%] h-[172%] z-0 overflow-visible"
          >
            <path
              d="M 18 110 A 92 28 0 0 1 202 110"
              fill="none"
              stroke={planet.accentHex}
              strokeOpacity={0.38}
              strokeWidth="8"
            />
            <path
              d="M 28 110 A 82 23 0 0 1 192 110"
              fill="none"
              stroke="#e0f2fe"
              strokeOpacity={0.25}
              strokeWidth="2.5"
            />
          </svg>
        )}

        {/* Photorealistic 3D Celestial Planet Globe */}
        <div
          style={{
            boxShadow: isLight
              ? `inset -10px -12px 22px rgba(2,8,23,0.68), inset 4px 5px 12px rgba(255,255,255,0.52), 0 14px 34px ${planet.atmosphereColor}`
              : `inset -12px -14px 26px rgba(0,2,8,0.75), inset 4px 5px 14px rgba(224,242,254,0.38), 0 0 32px ${planet.atmosphereColor}`,
            borderColor: isHovered
              ? planet.accentHex
              : 'rgba(226, 232, 240, 0.45)',
          }}
          className="relative z-10 w-full h-full rounded-full overflow-hidden border transition-all duration-200 group-hover:scale-[1.04]"
        >
          <canvas
            ref={canvasRef}
            width={148}
            height={148}
            className="w-full h-full block rounded-full"
          />

          {/* Subtle Interactive Play-Preview Hover Indicator on the Planet Globe */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/35 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <span
              style={{ borderColor: planet.accentHex }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/85 border text-[9px] font-mono font-bold tracking-wider text-white shadow-lg"
            >
              <Play className="w-2.5 h-2.5 fill-current text-cyan-300" />
              <span>VIDEO</span>
            </span>
          </div>
        </div>

        {/* 3D Tilted Saturn-Style Planetary Ring — FRONT HALF (crossing in front of sphere) */}
        {planet.hasRings && (
          <svg
            aria-hidden="true"
            viewBox="0 0 220 220"
            style={{
              transform: `rotate(${planet.ringTiltDeg}deg)`,
            }}
            className="pointer-events-none absolute -inset-[36%] w-[172%] h-[172%] z-20 overflow-visible"
          >
            <path
              d="M 202 110 A 92 28 0 0 1 18 110"
              fill="none"
              stroke={planet.accentHex}
              strokeOpacity={0.72}
              strokeWidth="8.5"
            />
            <path
              d="M 192 110 A 82 23 0 0 1 28 110"
              fill="none"
              stroke="#ffffff"
              strokeOpacity={0.58}
              strokeWidth="2.5"
            />
          </svg>
        )}

        {/* Solar Specular Rim Star-Flare on Illuminated Planet Limb */}
        <div
          aria-hidden="true"
          style={{
            top: '14%',
            left: '16%',
          }}
          className="pointer-events-none absolute z-30 w-3 h-3 -translate-x-1/2 -translate-y-1/2"
        >
          <span className="absolute inset-0 rounded-full bg-white blur-[2px]" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-[1.5px] bg-gradient-to-b from-transparent via-white to-transparent" />
        </div>

        {/* Clean Editorial Caption Lockup BELOW the Planet Sphere */}
        <div
          data-testid={`planet-style-badge-${planet.id}`}
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2.5 w-[154px] flex flex-col items-center text-center"
        >
          <span
            className={`text-[7.5px] font-mono tracking-[0.14em] uppercase leading-none mb-0.5 ${
              isLight ? 'text-slate-500' : 'text-sky-300/80'
            }`}
          >
            {planet.remotionTag} · {planet.azimuthDeg}°
          </span>
          <span
            className={`text-[11px] font-bold tracking-[-0.01em] leading-tight truncate max-w-full ${
              isLight
                ? 'text-slate-900'
                : 'text-white drop-shadow-[0_1px_8px_rgba(2,6,23,0.95)]'
            }`}
          >
            {planet.planetName}
          </span>
          <span
            className={`text-[9.5px] font-medium leading-tight truncate max-w-full ${
              isLight ? 'text-blue-700' : 'text-sky-200/85'
            }`}
          >
            {planet.styleTitle}
          </span>
        </div>
      </div>
    </div>
  );
};


/**
 * Generates a high-resolution 3072x512 continuous Cinema Film Strip Texture (`RepeatWrapping`)
 * featuring 6 rich Motion Graphic Object Frames (3D Isometric Charts, Stickman/Character Rig,
 * 24kHz Waveform & Viseme, 3D Polyhedron & Spring Bezier, 9:16 Mobile UI Stack, and TSX Node Constellation).
 */
function createContinuousFilmStripTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 3072;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // 1. Metallic dark sapphire-chrome film base
    const baseGrad = ctx.createLinearGradient(0, 0, 0, 512);
    baseGrad.addColorStop(0, '#94a3b8');
    baseGrad.addColorStop(0.1, '#334155');
    baseGrad.addColorStop(0.125, '#040d24');
    baseGrad.addColorStop(0.875, '#040d24');
    baseGrad.addColorStop(0.9, '#334155');
    baseGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, 3072, 512);

    // 2. Top & Bottom Perforated Sprocket Holes (96 holes along 3072px)
    const numHoles = 96;
    const holeSpacing = 3072 / numHoles;
    for (let i = 0; i < numHoles; i++) {
      const hx = i * holeSpacing + 6;
      ctx.fillStyle = '#01040d';
      ctx.fillRect(hx, 13, 18, 32);
      ctx.fillRect(hx, 467, 18, 32);

      ctx.strokeStyle = 'rgba(226, 232, 240, 0.58)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hx, 13, 18, 32);
      ctx.strokeRect(hx, 467, 18, 32);
    }

    // Glowing cyan/gold track lines separating sprocket band from the active motion graphic frames
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.72)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.lineTo(3072, 60);
    ctx.moveTo(0, 452);
    ctx.lineTo(3072, 452);
    ctx.stroke();

    // 3. Draw 6 Consecutive 512px-wide Motion Graphic Storyboard Frames
    const frameW = 512;
    const frameTop = 66;
    const frameH = 380;

    for (let f = 0; f < 6; f++) {
      const fx = f * frameW;

      const fGrad = ctx.createLinearGradient(
        fx,
        frameTop,
        fx + frameW,
        frameTop + frameH
      );
      fGrad.addColorStop(0, '#04102b');
      fGrad.addColorStop(0.5, '#082052');
      fGrad.addColorStop(1, '#030a1c');
      ctx.fillStyle = fGrad;
      ctx.fillRect(fx + 8, frameTop, frameW - 16, frameH);

      const barGrad = ctx.createLinearGradient(fx, frameTop, fx + 10, frameTop);
      barGrad.addColorStop(0, '#334155');
      barGrad.addColorStop(0.5, '#e2e8f0');
      barGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = barGrad;
      ctx.fillRect(fx - 4, frameTop - 3, 8, frameH + 6);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.13)';
      ctx.lineWidth = 1;
      for (let gx = fx + 40; gx < fx + frameW - 16; gx += 48) {
        ctx.beginPath();
        ctx.moveTo(gx, frameTop);
        ctx.lineTo(gx, frameTop + frameH);
        ctx.stroke();
      }
      for (let gy = frameTop + 36; gy < frameTop + frameH; gy += 48) {
        ctx.beginPath();
        ctx.moveTo(fx + 12, gy);
        ctx.lineTo(fx + frameW - 12, gy);
        ctx.stroke();
      }

      ctx.strokeStyle =
        f % 2 === 0 ? 'rgba(56, 189, 248, 0.72)' : 'rgba(251, 191, 36, 0.68)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(fx + 14, frameTop + 6, frameW - 28, frameH - 12);

      if (f === 0) {
        // FRAME 0: 3D Isometric Bar Chart + Glowing Donut Ring Motion Graphic Object
        const glow = ctx.createRadialGradient(
          fx + 256,
          frameTop + 190,
          15,
          fx + 256,
          frameTop + 190,
          210
        );
        glow.addColorStop(0, 'rgba(56, 189, 248, 0.55)');
        glow.addColorStop(0.55, 'rgba(37, 99, 235, 0.22)');
        glow.addColorStop(1, 'rgba(4, 16, 43, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(fx + 16, frameTop + 8, frameW - 32, frameH - 16);

        const barHeights = [95, 145, 190, 235];
        const barColors = ['#38bdf8', '#60a5fa', '#fbbf24', '#34d399'];
        for (let b = 0; b < 4; b++) {
          const bx = fx + 52 + b * 54;
          const bh = barHeights[b];
          const by = frameTop + 322 - bh;
          ctx.fillStyle = barColors[b];
          ctx.fillRect(bx, by, 34, bh);
          ctx.fillStyle = '#e0f2fe';
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + 12, by - 10);
          ctx.lineTo(bx + 46, by - 10);
          ctx.lineTo(bx + 34, by);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
          ctx.beginPath();
          ctx.moveTo(bx + 34, by);
          ctx.lineTo(bx + 46, by - 10);
          ctx.lineTo(bx + 46, by + bh - 10);
          ctx.lineTo(bx + 34, by + bh);
          ctx.closePath();
          ctx.fill();
        }

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 18;
        ctx.beginPath();
        ctx.arc(fx + 375, frameTop + 175, 64, -0.4, Math.PI * 1.35);
        ctx.stroke();

        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 18;
        ctx.beginPath();
        ctx.arc(fx + 375, frameTop + 175, 64, Math.PI * 1.4, Math.PI * 1.88);
        ctx.stroke();

        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('+240%', fx + 346, frameTop + 182);

        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#7dd3fc';
        ctx.fillText('3D DATA DIORAMA · MOTION OBJECT', fx + 34, frameTop + 38);
      } else if (f === 1) {
        // FRAME 1: Animated Character / Stickman Motion Rig + Kinetic Hook Banner
        const glow = ctx.createRadialGradient(
          fx + 256,
          frameTop + 185,
          12,
          fx + 256,
          frameTop + 185,
          210
        );
        glow.addColorStop(0, 'rgba(251, 191, 36, 0.55)');
        glow.addColorStop(0.5, 'rgba(56, 189, 248, 0.28)');
        glow.addColorStop(1, 'rgba(4, 16, 43, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(fx + 16, frameTop + 8, frameW - 32, frameH - 16);

        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(fx + 38, frameTop + 32, 260, 38);
        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = '#020617';
        ctx.fillText('HOOK 3 DETIK PERTAMA!', fx + 52, frameTop + 57);

        const cx = fx + 165;
        const cy = frameTop + 150;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(cx, cy - 32, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, cy - 10);
        ctx.lineTo(cx - 8, cy + 62);
        ctx.stroke();
        ctx.strokeStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(cx - 48, cy + 8);
        ctx.lineTo(cx - 2, cy + 12);
        ctx.lineTo(cx + 46, cy - 24);
        ctx.stroke();
        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(cx - 42, cy + 115);
        ctx.lineTo(cx - 8, cy + 62);
        ctx.lineTo(cx + 38, cy + 98);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
        ctx.setLineDash([8, 6]);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(fx + 290, frameTop + 230, 95, Math.PI * 1.1, Math.PI * 1.85);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(fx + 350, frameTop + 135, 92, 92);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(fx + 350, frameTop + 135, 92, 92);
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = '#020617';
        ctx.fillText('SCENE 01', fx + 358, frameTop + 186);
      } else if (f === 2) {
        // FRAME 2: 24kHz Dual Electric-Cyan & Warm-Amber Audio Waveform + Lip-Sync Viseme Ring
        const waveGlow = ctx.createRadialGradient(
          fx + 256,
          frameTop + 188,
          12,
          fx + 256,
          frameTop + 188,
          220
        );
        waveGlow.addColorStop(0, 'rgba(56, 189, 248, 0.54)');
        waveGlow.addColorStop(0.45, 'rgba(245, 158, 11, 0.34)');
        waveGlow.addColorStop(1, 'rgba(4, 14, 39, 0)');
        ctx.fillStyle = waveGlow;
        ctx.fillRect(fx + 16, frameTop + 8, frameW - 32, frameH - 16);

        const cy = frameTop + 205;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        for (let x = 28; x <= frameW - 28; x += 5) {
          const norm = (x - 28) / (frameW - 56);
          const env = Math.sin(norm * Math.PI);
          const amp =
            (Math.sin(x * 0.15) * 72 +
              Math.cos(x * 0.33) * 48 +
              Math.sin(x * 0.08) * 34) *
            env;
          if (x === 28) ctx.moveTo(fx + x, cy - amp);
          else ctx.lineTo(fx + x, cy - amp);
        }
        ctx.stroke();

        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        for (let x = 28; x <= frameW - 28; x += 5) {
          const norm = (x - 28) / (frameW - 56);
          const env = Math.sin(norm * Math.PI);
          const amp =
            (Math.cos(x * 0.13) * 58 + Math.sin(x * 0.29) * 42) * env;
          if (x === 28) ctx.moveTo(fx + x, cy + amp);
          else ctx.lineTo(fx + x, cy + amp);
        }
        ctx.stroke();

        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#bae6fd';
        ctx.fillText(
          '24KHZ NEURAL VOICE · AUTO LIP-SYNC',
          fx + 34,
          frameTop + 38
        );
      } else if (f === 3) {
        // FRAME 3: 3D Geometric Polyhedron Object + Spring() Bezier Keyframe Graph
        const core = ctx.createRadialGradient(
          fx + 170,
          frameTop + 190,
          10,
          fx + 256,
          frameTop + 190,
          210
        );
        core.addColorStop(0, 'rgba(255, 251, 235, 0.85)');
        core.addColorStop(0.3, 'rgba(251, 191, 36, 0.55)');
        core.addColorStop(0.65, 'rgba(56, 189, 248, 0.34)');
        core.addColorStop(1, 'rgba(4, 14, 39, 0)');
        ctx.fillStyle = core;
        ctx.fillRect(fx + 16, frameTop + 8, frameW - 32, frameH - 16);

        const gx = fx + 135;
        const gy = frameTop + 195;
        const gr = 74;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.32)';
        ctx.beginPath();
        for (let s = 0; s < 6; s++) {
          const ang = (s * Math.PI) / 3 - Math.PI / 6;
          const px = gx + Math.cos(ang) * gr;
          const py = gy + Math.sin(ang) * gr;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        for (let s = 0; s < 6; s += 2) {
          const ang = (s * Math.PI) / 3 - Math.PI / 6;
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.lineTo(gx + Math.cos(ang) * gr, gy + Math.sin(ang) * gr);
          ctx.stroke();
        }

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(fx + 245, frameTop + 295);
        ctx.bezierCurveTo(
          fx + 310,
          frameTop + 295,
          fx + 335,
          frameTop + 90,
          fx + 455,
          frameTop + 110
        );
        ctx.stroke();

        const kfPts = [
          [fx + 245, frameTop + 295],
          [fx + 348, frameTop + 152],
          [fx + 455, frameTop + 110],
        ];
        for (const [kx, ky] of kfPts) {
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.moveTo(kx, ky - 10);
          ctx.lineTo(kx + 10, ky);
          ctx.lineTo(kx, ky + 10);
          ctx.lineTo(kx - 10, ky);
          ctx.closePath();
          ctx.fill();
        }

        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#fde68a';
        ctx.fillText(
          '3D VECTOR MESH · SPRING() 60 FPS',
          fx + 34,
          frameTop + 38
        );
      } else if (f === 4) {
        // FRAME 4: 9:16 Vertical Reels UI Card Stack & Motion Timeline Tracks
        const glow = ctx.createRadialGradient(
          fx + 256,
          frameTop + 190,
          12,
          fx + 256,
          frameTop + 190,
          210
        );
        glow.addColorStop(0, 'rgba(56, 189, 248, 0.5)');
        glow.addColorStop(1, 'rgba(4, 14, 39, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(fx + 16, frameTop + 8, frameW - 32, frameH - 16);

        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.fillRect(fx + 48, frameTop + 56, 148, 268);
        ctx.strokeRect(fx + 48, frameTop + 56, 148, 268);

        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(fx + 108, frameTop + 165);
        ctx.lineTo(fx + 108, frameTop + 215);
        ctx.lineTo(fx + 148, frameTop + 190);
        ctx.closePath();
        ctx.fill();

        const trackLabels = ['VIDEO 60FPS', 'VOICE 24KHZ', 'BUBBLE FX', 'SUBTITLE'];
        const trackColors = ['#38bdf8', '#fbbf24', '#34d399', '#a855f7'];
        for (let t = 0; t < 4; t++) {
          const ty = frameTop + 76 + t * 62;
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.fillRect(fx + 225, ty, 245, 38);
          ctx.fillStyle = trackColors[t];
          ctx.fillRect(fx + 225 + t * 18, ty + 6, 175 - t * 12, 26);
          ctx.font = 'bold 12px monospace';
          ctx.fillStyle = '#020617';
          ctx.fillText(trackLabels[t], fx + 236 + t * 18, ty + 24);
        }
      } else {
        // FRAME 5: React / Remotion TSX Code + Glowing Cyan Wireframe Arch
        const archGlow = ctx.createRadialGradient(
          fx + 256,
          frameTop + 95,
          10,
          fx + 256,
          frameTop + 95,
          170
        );
        archGlow.addColorStop(0, 'rgba(56, 189, 248, 0.65)');
        archGlow.addColorStop(0.5, 'rgba(37, 99, 235, 0.25)');
        archGlow.addColorStop(1, 'rgba(4, 14, 39, 0)');
        ctx.fillStyle = archGlow;
        ctx.fillRect(fx + 16, frameTop + 8, frameW - 32, 180);

        ctx.strokeStyle = '#7dd3fc';
        ctx.lineWidth = 2.5;
        for (let r = 34; r <= 82; r += 16) {
          ctx.beginPath();
          ctx.arc(fx + 256, frameTop + 115, r, Math.PI, 0, false);
          ctx.stroke();
        }

        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('function GraphMotionReel() {', fx + 38, frameTop + 165);
        ctx.font = '15px monospace';
        ctx.fillStyle = '#e0f2fe';
        ctx.fillText(
          '  const frame = useCurrentFrame();',
          fx + 38,
          frameTop + 195
        );
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(
          '  const scale = spring({ fps: 60, frame });',
          fx + 38,
          frameTop + 225
        );
        ctx.fillStyle = '#ffffff';
        ctx.fillText(
          '  return <KineticScene scale={scale} />;',
          fx + 38,
          frameTop + 260
        );
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('}', fx + 38, frameTop + 290);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(3.8, 1);
  texture.needsUpdate = true;
  return texture;
}


/**
 * Unified 60 FPS Procedural "Graph Motion" Brand Intro & Smooth Camera-Shift Docking to Top-Left Corner:
 * - Renders a live 60 FPS procedural canvas drawing 3D Bezier Motion Splines, Rising Isometric Graph Bars,
 *   and an expanding Radial Cinema Iris that opens directly into the 3D Film Reel scene (`transisi yang smooth dan menyatu`).
 * - At the end of the brand animation (`camera-dock-topleft`), the 3D camera shift physically carries the
 *   Graph Motion Logo & Brand Lockup from the center of the screen (`50vw, 46vh`) smoothly into the
 *   Top-Left Header corner (`pojok kiri atas`) with zero jump!
 */
const GoogleGIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4 shrink-0',
}) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3.01h3.88c2.27-2.09 3.54-5.17 3.54-8.88z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.96H1.27v3.11A12 12 0 0 0 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.28V6.61H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39l4.01-3.11z"
    />
    <path
      fill="#EA4335"
      d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.61l4.01 3.11C6.23 6.88 8.88 4.77 12 4.77z"
    />
  </svg>
);

const GRAPH_LETTERS = ['G', 'r', 'a', 'p', 'h'] as const;

const GraphMotionBrandIntroOverlay: React.FC<{
  introState: BrandIntroState;
  onSkipIntro?: () => void;
}> = ({ introState, onSkipIntro }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const emblemBoxRef = useRef<HTMLDivElement | null>(null);
  const introStateRef = useRef<BrandIntroState>(introState);
  const dockTargetRef = useRef<{ left: number; top: number }>({
    left: typeof window !== 'undefined' && window.innerWidth < 640 ? 16 : 56,
    top: typeof window !== 'undefined' && window.innerWidth < 640 ? 16 : 20,
  });
  introStateRef.current = introState;

  const isOverlayVisible =
    introState.isActive ||
    introState.overlayOpacity > 0.01 ||
    introState.dockToHeaderProgress < 0.99;

  useEffect(() => {
    if (!isOverlayVisible) return;
    const calibrateTarget = () => {
      const targetEl = document.querySelector('[data-testid="brand-wordmark-lockup"]');
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        if (rect.width > 10 && rect.height > 10) {
          dockTargetRef.current = { left: rect.left, top: rect.top };
          return;
        }
      }
      const isMob = window.innerWidth < 640;
      dockTargetRef.current = {
        left: isMob ? 16 : Math.max(56, (window.innerWidth - 1400) / 2 + 56),
        top: isMob ? 16 : 20,
      };
    };

    calibrateTarget();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth || 1440);
    let height = (canvas.height = window.innerHeight || 900);

    let rafId = 0;
    let disposed = false;
    const startMs = performance.now();

    const evalCubicPt = (
      u: number,
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      x3: number,
      y3: number
    ) => {
      const inv = 1 - u;
      const b0 = inv * inv * inv;
      const b1 = 3 * inv * inv * u;
      const b2 = 3 * inv * u * u;
      const b3 = u * u * u;
      return {
        x: b0 * x0 + b1 * x1 + b2 * x2 + b3 * x3,
        y: b0 * y0 + b1 * y1 + b2 * y2 + b3 * y3,
      };
    };

    const drawKineticBrandCanvas = () => {
      if (disposed) return;
      const elapsed = (performance.now() - startMs) / 1000;
      const st = introStateRef.current;

      ctx.clearRect(0, 0, width, height);

      if (!st.isActive && st.overlayOpacity <= 0.01) {
        return;
      }

      const dockT = st.dockToHeaderProgress;
      const portalU = st.portalShutterExpand;
      const isMob = width < 640;

      let cx = width * st.brandAnchorXNorm;
      let cy = height * st.brandAnchorYNorm + st.dockArcLiftPx;
      const emblemRect = emblemBoxRef.current?.getBoundingClientRect();
      if (emblemRect && emblemRect.width > 8 && dockT < 0.96) {
        cx = emblemRect.left + emblemRect.width * 0.5;
        cy = emblemRect.top + emblemRect.height * 0.5;
      }

      // 1. Deep Sapphire Backdrop with 6-Blade Hexagonal Cinema Aperture Iris Cutout
      //    As portalU -> 1, the hexagonal lens shutter opens from the center to unveil the 3D reels!
      const maxDiag = Math.hypot(width, height);
      const apertureRadius = portalU * maxDiag * 0.82;
      const apertureRot = portalU * 0.68 + 0.25;

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, width, height);
      if (apertureRadius > 6) {
        const irisCx = width * 0.5;
        const irisCy = height * 0.46;
        for (let s = 0; s < 6; s++) {
          const ang = apertureRot + (s * Math.PI) / 3;
          const vx = irisCx + Math.cos(ang) * apertureRadius;
          const vy = irisCy + Math.sin(ang) * apertureRadius;
          if (s === 0) ctx.moveTo(vx, vy);
          else ctx.lineTo(vx, vy);
        }
        ctx.closePath();
      }
      ctx.clip('evenodd');

      const bgGrad = ctx.createRadialGradient(
        cx,
        cy,
        18,
        width * 0.5,
        height * 0.48,
        maxDiag * 0.72
      );
      bgGrad.addColorStop(0, `rgba(7, 25, 68, ${st.overlayOpacity * 0.96})`);
      bgGrad.addColorStop(0.48, `rgba(3, 12, 34, ${st.overlayOpacity * 0.98})`);
      bgGrad.addColorStop(1, `rgba(1, 5, 15, ${st.overlayOpacity})`);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Whip-Zoom & Dutch-Angle Camera Stage Transform
      const stageAlpha = Math.max(0, (1 - dockT * 1.12) * st.overlayOpacity);
      if (stageAlpha > 0.015) {
        ctx.save();
        const camZoom = 1 + (st.cameraCutZoom - 1) * (1 - dockT);
        const camRollRad = (st.cameraDutchDeg * (1 - dockT) * Math.PI) / 180;
        ctx.translate(width * 0.5, height * 0.46);
        ctx.scale(camZoom, camZoom);
        ctx.rotate(camRollRad);
        ctx.translate(-width * 0.5, -height * 0.46);

        // 2A. 3D Perspective NLE Keyframe Horizon Grid (converging floor & ceiling lines)
        const horizonY = height * 0.46;
        const vanishX = width * 0.5;
        const gridAlpha = 0.14 * stageAlpha * st.bezierCurveDraw;
        ctx.strokeStyle = `rgba(56, 189, 248, ${gridAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let r = -6; r <= 6; r++) {
          const edgeX = vanishX + r * (width * 0.16);
          ctx.moveTo(vanishX + r * 42, horizonY + 54);
          ctx.lineTo(edgeX, height + 20);
          ctx.moveTo(vanishX + r * 42, horizonY - 54);
          ctx.lineTo(edgeX, -20);
        }
        // Horizontal perspective depth rungs
        const depthSteps = [0.18, 0.34, 0.54, 0.78];
        for (const d of depthSteps) {
          const yBot = horizonY + 54 + d * (height - horizonY - 40);
          const yTop = horizonY - 54 - d * (horizonY - 40);
          ctx.moveTo(width * 0.06, yBot);
          ctx.lineTo(width * 0.94, yBot);
          ctx.moveTo(width * 0.06, yTop);
          ctx.lineTo(width * 0.94, yTop);
        }
        ctx.stroke();

        // 2B. Asymmetric Kinetic Matte Ribbons with Film Sprocket Track Marks
        const wipe = st.kitPanelWipe;
        const peelOut = Math.pow(dockT, 1.3);
        const slabShift = (1 - wipe) * (width * 0.45) + peelOut * (width * 0.75);
        const diagSpan = height * 0.5;
        const drawSlashSlab = (
          xCenter: number,
          slabW: number,
          fill: string,
          alpha: number
        ) => {
          ctx.fillStyle = fill;
          ctx.globalAlpha = alpha * stageAlpha;
          ctx.beginPath();
          ctx.moveTo(xCenter - slabW * 0.5 + diagSpan, -60);
          ctx.lineTo(xCenter + slabW * 0.5 + diagSpan, -60);
          ctx.lineTo(xCenter + slabW * 0.5 - diagSpan, height + 60);
          ctx.lineTo(xCenter - slabW * 0.5 - diagSpan, height + 60);
          ctx.closePath();
          ctx.fill();
        };
        drawSlashSlab(width * 0.86 + slabShift, 150, '#0a2259', 0.34);
        drawSlashSlab(width * 0.92 + slabShift * 1.15, 22, '#38bdf8', 0.28);
        drawSlashSlab(width * 0.948 + slabShift * 1.22, 4, '#fbbf24', 0.68);

        drawSlashSlab(width * 0.13 - slabShift, 165, '#081b49', 0.34);
        drawSlashSlab(width * 0.065 - slabShift * 1.15, 20, '#0ea5e9', 0.26);
        drawSlashSlab(width * 0.036 - slabShift * 1.22, 3.5, '#fbbf24', 0.62);
        ctx.globalAlpha = 1;

        // 2C. Signature NLE Cubic-Bezier Speed-Graph Curve & Live Keyframe Tangent Handles!
        //     Cradles underneath the wordmark lockup and sweeps up to the right apex so
        //     "Graph Motion" and "CREATIVE MOTION ENGINE" have 100% unobstructed legibility!
        const curveSpanW = isMob ? width * 0.88 : Math.min(920, width * 0.72);
        const p0x = width * 0.5 - curveSpanW * 0.5;
        const p0y = horizonY + (isMob ? 132 : 164);
        const p3x = width * 0.5 + curveSpanW * 0.5;
        const p3y = horizonY - (isMob ? 116 : 154);
        const cp1x = p0x + curveSpanW * 0.42;
        const cp1y = horizonY + (isMob ? 138 : 168) - st.speedGraphPeak * 18;
        const cp2x = p0x + curveSpanW * 0.72;
        const cp2y = horizonY + (isMob ? 64 : 78) - st.speedGraphPeak * 28;

        // Shaded Velocity Bell-Curve Area underneath the Bezier Spine
        if (st.bezierCurveDraw > 0.08) {
          const steps = 44;
          const maxStep = Math.max(2, Math.floor(steps * st.bezierCurveDraw));
          const velGrad = ctx.createLinearGradient(p0x, p3y, p3x, p0y);
          velGrad.addColorStop(0, `rgba(37, 99, 235, ${0.02 * stageAlpha})`);
          velGrad.addColorStop(
            0.5,
            `rgba(56, 189, 248, ${(0.12 + st.speedGraphPeak * 0.16) * stageAlpha})`
          );
          velGrad.addColorStop(1, `rgba(251, 191, 36, ${0.05 * stageAlpha})`);

          ctx.fillStyle = velGrad;
          ctx.beginPath();
          for (let i = 0; i <= maxStep; i++) {
            const u = i / steps;
            const pt = evalCubicPt(u, p0x, p0y, cp1x, cp1y, cp2x, cp2y, p3x, p3y);
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          // Close along the baseline velocity wave
          for (let i = maxStep; i >= 0; i--) {
            const u = i / steps;
            const pt = evalCubicPt(u, p0x, p0y, cp1x, cp1y, cp2x, cp2y, p3x, p3y);
            const bell = Math.sin(u * Math.PI) * (36 + st.speedGraphPeak * 58);
            ctx.lineTo(pt.x, pt.y + bell);
          }
          ctx.closePath();
          ctx.fill();

          // Glowing Cubic Bezier Spine Stroke
          const spineGrad = ctx.createLinearGradient(p0x, p0y, p3x, p3y);
          spineGrad.addColorStop(0, `rgba(56, 189, 248, ${0.75 * stageAlpha})`);
          spineGrad.addColorStop(0.55, `rgba(224, 242, 254, ${0.92 * stageAlpha})`);
          spineGrad.addColorStop(1, `rgba(251, 191, 36, ${0.88 * stageAlpha})`);
          ctx.strokeStyle = spineGrad;
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          for (let i = 0; i <= maxStep; i++) {
            const u = i / steps;
            const pt = evalCubicPt(u, p0x, p0y, cp1x, cp1y, cp2x, cp2y, p3x, p3y);
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();

          // Live Keyframe Diamonds & Extending Bezier Tangent Handle Levers (`o---◆---o`)
          const keyframeUs = [0.08, 0.54, 0.92];
          const handleLen = (isMob ? 34 : 54) * st.tangentHandleSpread;
          keyframeUs.forEach((ku, idx) => {
            if (st.bezierCurveDraw < ku) return;
            const kp = evalCubicPt(ku, p0x, p0y, cp1x, cp1y, cp2x, cp2y, p3x, p3y);
            const kpNext = evalCubicPt(
              Math.min(1, ku + 0.02),
              p0x,
              p0y,
              cp1x,
              cp1y,
              cp2x,
              cp2y,
              p3x,
              p3y
            );
            const tangAng =
              Math.atan2(kpNext.y - kp.y, kpNext.x - kp.x) +
              Math.sin(elapsed * 2.2 + idx) * 0.08;
            const hx1 = kp.x - Math.cos(tangAng) * handleLen;
            const hy1 = kp.y - Math.sin(tangAng) * handleLen;
            const hx2 = kp.x + Math.cos(tangAng) * handleLen;
            const hy2 = kp.y + Math.sin(tangAng) * handleLen;

            // Tangent Stem Line
            ctx.strokeStyle = `rgba(251, 191, 36, ${0.72 * stageAlpha})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(hx1, hy1);
            ctx.lineTo(hx2, hy2);
            ctx.stroke();

            // Circular Tangent Control Knobs at both ends
            ctx.fillStyle = `rgba(2, 8, 23, ${stageAlpha})`;
            ctx.strokeStyle = `rgba(251, 191, 36, ${0.95 * stageAlpha})`;
            ctx.lineWidth = 1.8;
            [
              [hx1, hy1],
              [hx2, hy2],
            ].forEach(([ kx, ky ]) => {
              ctx.beginPath();
              ctx.arc(kx, ky, 3.6, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            });

            // Keyframe Anchor Diamond (`◆`)
            ctx.save();
            ctx.translate(kp.x, kp.y);
            ctx.rotate(Math.PI / 4);
            ctx.fillStyle =
              idx === 1
                ? `rgba(251, 191, 36, ${0.98 * stageAlpha})`
                : `rgba(56, 189, 248, ${0.95 * stageAlpha})`;
            ctx.fillRect(-4.5, -4.5, 9, 9);
            ctx.restore();
          });
        }

        // 3. Concentric Trim-Path Rings, Lens Tick Marks & Radial Burst locked dead-center on Emblem
        const centerScale = st.brandScale * (isMob ? 0.76 : 1);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(centerScale, centerScale);

        const halo = ctx.createRadialGradient(0, 0, 10, 0, 0, 185);
        halo.addColorStop(0, `rgba(56, 189, 248, ${0.3 * stageAlpha})`);
        halo.addColorStop(0.55, `rgba(37, 99, 235, ${0.12 * stageAlpha})`);
        halo.addColorStop(1, 'rgba(2, 8, 23, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, 185, 0, Math.PI * 2);
        ctx.fill();

        // Precision 36-Tick Cinema Lens Calibration Dial around Emblem
        const dialRot = (st.irisRotationDeg * 0.45 * Math.PI) / 180;
        ctx.strokeStyle = `rgba(125, 211, 252, ${0.34 * stageAlpha * st.shutterOpenProgress})`;
        ctx.lineWidth = 1.4;
        for (let tIdx = 0; tIdx < 36; tIdx++) {
          const a = dialRot + (tIdx / 36) * Math.PI * 2;
          const isMajor = tIdx % 3 === 0;
          const rInner = isMajor ? 102 : 105;
          const rOuter = isMajor ? 111 : 109;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * rInner, Math.sin(a) * rInner);
          ctx.lineTo(Math.cos(a) * rOuter, Math.sin(a) * rOuter);
          ctx.stroke();
        }

        // Bold Outer Cobalt Trim-Path Arc (counter-clockwise)
        const rotOuter = (-st.irisRotationDeg * 0.9 * Math.PI) / 180;
        const arcSpan1 = Math.PI * 0.66 * st.shutterOpenProgress;
        ctx.lineCap = 'round';
        for (let seg = 0; seg < 2; seg++) {
          const baseA = rotOuter + seg * Math.PI;
          ctx.strokeStyle = `rgba(37, 99, 235, ${0.58 * stageAlpha})`;
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.arc(0, 0, 90, baseA, baseA + arcSpan1);
          ctx.stroke();
        }

        // Crisp Mid Cyan & Gold Trim-Path Arc (clockwise)
        const rotMid = (st.irisRotationDeg * 1.4 * Math.PI) / 180;
        const arcSpan2 = Math.PI * 0.52 * st.ribbonDrawProgress;
        for (let seg = 0; seg < 3; seg++) {
          const baseA = rotMid + seg * ((Math.PI * 2) / 3);
          ctx.strokeStyle =
            seg === 0
              ? `rgba(251, 191, 36, ${0.88 * stageAlpha})`
              : `rgba(56, 189, 248, ${0.76 * stageAlpha})`;
          ctx.lineWidth = seg === 0 ? 3.8 : 2.8;
          ctx.beginPath();
          ctx.arc(0, 0, 72, baseA, baseA + arcSpan2);
          ctx.stroke();
        }

        // 12 Radial Motion-Kit Shockwave Burst Ticks on Play Prism Impact
        const shockU = st.shockwaveProgress;
        if (shockU > 0.02 && shockU < 0.99) {
          const ringR = 46 + shockU * 116;
          ctx.strokeStyle = `rgba(125, 211, 252, ${(1 - shockU) * 0.78 * stageAlpha})`;
          ctx.lineWidth = Math.max(1.2, (1 - shockU) * 6);
          ctx.beginPath();
          ctx.arc(0, 0, ringR, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = `rgba(251, 191, 36, ${(1 - shockU) * 0.88 * stageAlpha})`;
          ctx.lineWidth = 2.4;
          for (let k = 0; k < 12; k++) {
            const ang = (k / 12) * Math.PI * 2 + elapsed * 0.45;
            const rIn = ringR - 12 * (1 - shockU);
            const rOut = ringR + 16 * (1 - shockU * 0.4);
            ctx.beginPath();
            ctx.moveTo(Math.cos(ang) * rIn, Math.sin(ang) * rIn);
            ctx.lineTo(Math.cos(ang) * rOut, Math.sin(ang) * rOut);
            ctx.stroke();
          }
        }

        // Orbiting Keyframe Diamonds
        const satAng = elapsed * 1.25;
        const satOrbit = 116;
        for (let n = 0; n < 3; n++) {
          const a = satAng + (n * Math.PI * 2) / 3;
          const sx = Math.cos(a) * satOrbit;
          const sy = Math.sin(a) * satOrbit * 0.72;
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(a + Math.PI / 4);
          ctx.fillStyle =
            n === 0
              ? `rgba(251, 191, 36, ${0.9 * stageAlpha})`
              : `rgba(125, 211, 252, ${0.75 * stageAlpha})`;
          const sz = (n === 0 ? 7.5 : 5.5) * Math.min(1, st.emblemElasticScale);
          ctx.fillRect(-sz * 0.5, -sz * 0.5, sz, sz);
          ctx.restore();
        }
        ctx.restore();

        // 4. Broadcast Framing Corner Guides
        const framePad = isMob ? 20 : 40;
        const bracketLen = isMob ? 16 : 24;
        const frameAlpha = 0.3 * stageAlpha * st.shutterOpenProgress;
        ctx.strokeStyle = `rgba(125, 211, 252, ${frameAlpha})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(framePad, framePad + bracketLen);
        ctx.lineTo(framePad, framePad);
        ctx.lineTo(framePad + bracketLen, framePad);
        ctx.moveTo(width - framePad - bracketLen, framePad);
        ctx.lineTo(width - framePad, framePad);
        ctx.lineTo(width - framePad, framePad + bracketLen);
        ctx.moveTo(framePad, height - framePad - bracketLen);
        ctx.lineTo(framePad, height - framePad);
        ctx.lineTo(framePad + bracketLen, height - framePad);
        ctx.stroke();

        ctx.restore();
      }

      // 5. Dual-Rim Glowing Hexagonal Aperture Portal during Act III Dock
      if (apertureRadius > 10 && st.overlayOpacity > 0.04) {
        const irisCx = width * 0.5;
        const irisCy = height * 0.46;
        ctx.save();
        ctx.strokeStyle = `rgba(56, 189, 248, ${st.overlayOpacity * 0.75})`;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        for (let s = 0; s < 6; s++) {
          const ang = apertureRot + (s * Math.PI) / 3;
          const vx = irisCx + Math.cos(ang) * apertureRadius;
          const vy = irisCy + Math.sin(ang) * apertureRadius;
          if (s === 0) ctx.moveTo(vx, vy);
          else ctx.lineTo(vx, vy);
        }
        ctx.closePath();
        ctx.stroke();

        // Inner Gold Shutter Blade bevel ring
        ctx.strokeStyle = `rgba(251, 191, 36, ${st.overlayOpacity * 0.42})`;
        ctx.lineWidth = 1.3;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        for (let s = 0; s < 6; s++) {
          const ang = apertureRot + (s * Math.PI) / 3;
          const vx = irisCx + Math.cos(ang) * (apertureRadius * 0.94);
          const vy = irisCy + Math.sin(ang) * (apertureRadius * 0.94);
          if (s === 0) ctx.moveTo(vx, vy);
          else ctx.lineTo(vx, vy);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      ctx.restore();

      // Drawn outside the clip so the parabolic keyframe motion-path trail stays visible across the opening portal
      if (dockT > 0.03 && dockT < 0.95) {
        const endX = dockTargetRef.current.left + 22;
        const endY = dockTargetRef.current.top + 18;
        const sampleDockPt = (u: number) => ({
          x: (1 - u) * (width * 0.5) + u * endX,
          y: (1 - u) * (height * 0.46) + u * endY + Math.sin(u * Math.PI) * -42,
        });

        ctx.save();
        ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - dockT) * 0.45})`;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([5, 7]);
        ctx.beginPath();
        for (let s = 0; s <= 24; s++) {
          const pt = sampleDockPt(s / 24);
          if (s === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        for (let g = 1; g <= 4; g++) {
          const gt = Math.max(0, dockT - g * 0.06);
          const pt = sampleDockPt(gt);
          ctx.save();
          ctx.translate(pt.x, pt.y);
          ctx.rotate(Math.PI / 4);
          ctx.fillStyle =
            g === 1
              ? `rgba(251, 191, 36, ${(1 - dockT) * 0.78})`
              : `rgba(56, 189, 248, ${(1 - dockT) * 0.48})`;
          const dSz = Math.max(3, 9.5 - g * 1.5);
          ctx.fillRect(-dSz * 0.5, -dSz * 0.5, dSz, dSz);
          ctx.restore();
        }
        ctx.restore();
      }

      rafId = requestAnimationFrame(drawKineticBrandCanvas);
    };

    const onResize = () => {
      if (!canvas) return;
      const nextW = window.innerWidth || 1440;
      const nextH = window.innerHeight || 900;
      if (canvas.width !== nextW || canvas.height !== nextH) {
        width = canvas.width = nextW;
        height = canvas.height = nextH;
      }
      calibrateTarget();
      drawKineticBrandCanvas();
    };
    window.addEventListener('resize', onResize, { passive: true });

    drawKineticBrandCanvas();
    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  }, [isOverlayVisible]);

  if (!isOverlayVisible) {
    return null;
  }

  const stage = introState.morphStage;
  const dockT = introState.dockToHeaderProgress;
  const isDockingComplete = dockT >= 0.98;
  const target = dockTargetRef.current;
  const isCompactViewport = typeof window !== 'undefined' && window.innerWidth < 640;

  const emblemPx = isCompactViewport ? 58 - dockT * 26 : 86 - dockT * 50;
  const titleFontPx = isCompactViewport ? 30 - dockT * 12 : 48 - dockT * 25;
  const motionWipeClip = Math.round((1 - introState.wordMotionWipe) * 100);
  const motionSlideX = (1 - introState.wordMotionWipe) * -26;
  const razorSliceOffsetPx = (1 - introState.wordMotionWipe) * 14 * (1 - dockT);
  const chromaPx = introState.chromaticSplitPx * (1 - dockT);
  const trimPct = Math.round(introState.trackTrimBar * (100 - dockT * 68));
  const scrubLeftPct = Math.round(introState.scrubNeedleProgress * 96);
  const taglineOpacity =
    Math.max(0, Math.min(1, (introState.wordMotionWipe - 0.25) * 1.55)) *
    Math.max(0, 1 - dockT * 1.9);

  return (
    <div
      data-testid="brand-intro-overlay"
      data-morph-stage={stage}
      data-dock-progress={dockT.toFixed(2)}
      className="fixed inset-0 z-[70] pointer-events-none select-none overflow-hidden"
    >
      {/* 60 FPS NLE Speed-Graph Curve, Bezier Tangent Handles & 6-Blade Shutter Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 w-full h-full"
      />

      {/* Flying "Graph Motion" Brand Emblem & Kinetic Showreel Typography Lockup */}
      <div
        data-testid="brand-intro-flying-lockup"
        style={{
          left: `calc(${(1 - dockT) * 50}vw + ${dockT * target.left}px)`,
          top: `calc(${(1 - dockT) * 46}vh + ${dockT * target.top}px + ${introState.dockArcLiftPx.toFixed(1)}px)`,
          transform: `translate(${(1 - dockT) * -50}%, ${(1 - dockT) * -50}%) scale(${(
            1 +
            (introState.cameraCutZoom - 1) * 0.45 * (1 - dockT)
          ).toFixed(3)})`,
          opacity: isDockingComplete ? 0 : 1,
        }}
        className="fixed z-20 flex flex-col items-start justify-center max-w-[92vw] will-change-transform"
      >
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Elastic Tilt-Settling Studio Emblem */}
          <div
            ref={emblemBoxRef}
            style={{
              width: `${emblemPx}px`,
              height: `${emblemPx}px`,
              transform: `scale(${introState.emblemElasticScale.toFixed(3)}) rotate(${(
                introState.emblemTiltDeg * (1 - dockT)
              ).toFixed(2)}deg)`,
            }}
            className="relative flex items-center justify-center shrink-0 drop-shadow-[0_0_26px_rgba(56,189,248,0.65)]"
          >
            <GraphMotionLogoMark
              className="w-full h-full"
              introMotion={{
                barScales: introState.barStagger,
                ribbonDraw: introState.ribbonDrawProgress,
                prismScale: introState.playPrismScale,
                shimmerProgress: introState.shimmerSweepProgress,
                ringRotationDeg: introState.irisRotationDeg,
              }}
            />
          </div>

          {/* Per-Character Kinetic "Graph" Cascade + Razor-Blade Split "Motion" */}
          <div className="flex flex-col">
            <div
              style={{
                fontSize: `${titleFontPx}px`,
                textShadow:
                  chromaPx > 0.35
                    ? `${-chromaPx.toFixed(1)}px 0 rgba(56,189,248,0.75), ${chromaPx.toFixed(1)}px 0 rgba(251,191,36,0.75)`
                    : 'none',
              }}
              className="flex items-baseline gap-2 leading-none whitespace-nowrap"
            >
              {/* Word 1: Per-Character 3D Kinetic Spring Cascade ("G-r-a-p-h") */}
              <span
                aria-label="Graph"
                className="inline-flex items-baseline overflow-hidden py-1 -my-1 tracking-[-0.035em]"
              >
                {GRAPH_LETTERS.map((ch, idx) => {
                  const prog = introState.letterStagger[idx] ?? introState.wordGraphSlide;
                  const liftY = (1 - prog) * 38;
                  const rotDeg = (1 - Math.min(1, prog)) * -18;
                  const scaleY = 0.72 + Math.min(1.16, prog) * 0.28;
                  return (
                    <span
                      key={ch}
                      style={{
                        transform: `translateY(${liftY.toFixed(1)}px) rotate(${rotDeg.toFixed(1)}deg) scaleY(${scaleY.toFixed(2)})`,
                        opacity: Math.min(1, prog * 2.4),
                      }}
                      className="inline-block origin-bottom font-extrabold bg-clip-text text-transparent bg-gradient-to-b from-white via-sky-100 to-cyan-300"
                    >
                      {ch}
                    </span>
                  );
                })}
              </span>

              {/* Word 2: Razor-Blade Horizontal Split-Shear + Track-Matte Wipe ("Motion") */}
              <span className="relative inline-block overflow-hidden py-1 -my-1">
                {/* Top Half Slice */}
                <span
                  style={{
                    clipPath: `inset(0 ${motionWipeClip}% 48% 0)`,
                    transform: `translateX(${(motionSlideX + razorSliceOffsetPx).toFixed(1)}px)`,
                    opacity: Math.min(1, introState.wordMotionWipe * 2.5),
                  }}
                  className="inline-block font-light tracking-[-0.015em] bg-clip-text text-transparent bg-gradient-to-r from-sky-200 via-cyan-200 to-indigo-200"
                >
                  Motion
                </span>
                {/* Bottom Half Counter-Shear Slice (locks into 0px alignment on settle) */}
                <span
                  aria-hidden="true"
                  style={{
                    clipPath: `inset(52% ${motionWipeClip}% 0 0)`,
                    transform: `translateX(${(motionSlideX - razorSliceOffsetPx * 0.75).toFixed(1)}px)`,
                    opacity: Math.min(1, introState.wordMotionWipe * 2.5),
                  }}
                  className="absolute inset-0 inline-block py-1 font-light tracking-[-0.015em] bg-clip-text text-transparent bg-gradient-to-r from-sky-300 via-cyan-200 to-indigo-300"
                >
                  Motion
                </span>
                {/* Leading Laser Razor-Cut Bar during sweep */}
                {introState.wordMotionWipe > 0.04 && introState.wordMotionWipe < 0.94 && (
                  <span
                    aria-hidden="true"
                    style={{
                      left: `${Math.round(introState.wordMotionWipe * 100)}%`,
                    }}
                    className="absolute top-1 bottom-1 w-[3px] rounded-full bg-gradient-to-b from-amber-300 via-white to-cyan-300 shadow-[0_0_14px_rgba(251,191,36,0.95)]"
                  />
                )}
              </span>
            </div>

            {/* NLE Keyframe Timeline Playhead Bar + Scrubbing Bezier Diamond */}
            <div className="relative mt-2 h-[2.5px] w-full">
              <div
                style={{
                  width: `${trimPct}%`,
                  opacity: introState.trackTrimBar,
                }}
                className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300 shadow-[0_0_12px_rgba(56,189,248,0.85)]"
              />
              {dockT < 0.45 && introState.trackTrimBar > 0.18 && (
                <span
                  aria-hidden="true"
                  style={{
                    left: `${scrubLeftPct}%`,
                    opacity: Math.max(0, 1 - dockT * 2.4),
                  }}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-amber-300 border border-white/80 shadow-[0_0_12px_rgba(251,191,36,1)]"
                />
              )}
            </div>
          </div>
        </div>

        {/* Clean Editorial Studio Sub-Eyebrow with Bezier Tangent Icon */}
        {dockT < 0.55 && taglineOpacity > 0.02 && (
          <div
            style={{ opacity: taglineOpacity }}
            className="mt-3 pl-1 flex items-center gap-2 sm:gap-2.5 text-[9.5px] sm:text-[11px] font-mono tracking-[0.16em] sm:tracking-[0.26em] uppercase text-sky-200/90 whitespace-nowrap"
          >
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full border border-amber-300" />
              <span className="h-[1.5px] w-4 bg-gradient-to-r from-amber-300 to-sky-400" />
              <span className="w-1.5 h-1.5 rotate-45 bg-sky-300" />
            </span>
            <span>CREATIVE MOTION ENGINE</span>
          </div>
        )}
      </div>

      {/* Interactive Skip Intro Control */}
      {onSkipIntro && dockT < 0.72 && (
        <button
          type="button"
          data-testid="skip-brand-intro-btn"
          onClick={onSkipIntro}
          style={{ opacity: Math.max(0, 1 - dockT * 1.6) }}
          className="pointer-events-auto fixed bottom-6 right-6 sm:bottom-8 sm:right-10 z-30 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-sky-400/25 bg-slate-950/75 hover:bg-slate-900 hover:border-sky-300/50 text-[11px] font-mono uppercase tracking-[0.18em] text-sky-200 transition-colors cursor-pointer"
        >
          <span>Lewati Intro</span>
          <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
};

/**
 * Interactive Camera & Motion-Graphic Objects + Direct Cursor/Touch Visual Gesture Wake:
 * - Renders a large, bold 3D-stippled & holographic wireframe **Kamera (`camera`)** at its new
 *   default position (`anchorXNorm = 0.49, anchorYNorm = 0.42`) in Bab 01 and **Graphic Objek (`graphic`)**
 *   at its new default position (`anchorXNorm = 0.67, anchorYNorm = 0.43`) in Bab 03.
 * - Automatically moves, scales, tilts, appears, and disappears in real-time sync with the 3D camera
 *   scroll shift (`awal kemunculan dan menghilangnya melalui pergeseran kamera setiap kali di scroll
 *   kan posisinya berubah otomatis objek itu bergerak juga sesuai gulirannya dari mulai muncul dan hilang`).
 * - Continuously renders the interactive Crescent Light-Wake, Comet Spine, and Sparkle Burst trail
 *   directly following the user's cursor (`pointermove`/`pointerdown`) or finger touch (`touchmove`/`touchstart`).
 */
const InteractiveMorphoParticleWakeCanvas: React.FC<{
  activeChapterIdx: number;
  scrollProgressRef: React.MutableRefObject<number>;
  scrollVelocityRef: React.MutableRefObject<number>;
  introSweepProgressRef: React.MutableRefObject<number>;
  isLight: boolean;
}> = ({
  activeChapterIdx,
  scrollProgressRef,
  scrollVelocityRef,
  introSweepProgressRef,
  isLight,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isLightRef = useRef<boolean>(isLight);
  const currentZone = getChapterParticleObjectZone(activeChapterIdx);

  useEffect(() => {
    isLightRef.current = isLight;
  }, [isLight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth || 1440);
    let height = (canvas.height = window.innerHeight || 900);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth || 1440;
      height = canvas.height = window.innerHeight || 900;
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // 1. Initialize 960 Stippled Bioluminescent Particles forming the Constellation Stardust
    interface SwarmDot {
      x: number;
      y: number;
      dispX: number;
      dispY: number;
      vx: number;
      vy: number;
      size: number;
      hueType: 0 | 1 | 2;
      heat: number;
    }

    const PARTICLE_COUNT = 960;
    const particles: SwarmDot[] = Array.from(
      { length: PARTICLE_COUNT },
      (_, i) => ({
        x: width * 0.55,
        y: height * 0.27,
        dispX: 0,
        dispY: 0,
        vx: 0,
        vy: 0,
        size: 1.35 + (i % 4) * 0.48,
        hueType: (i % 3) as 0 | 1 | 2,
        heat: 0,
      })
    );

    // 2. High-velocity Sparkle Burst Particles emitted from the Cursor/Touch Crescent Gesture Wake
    interface BurstSpark {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
      isWhiteCore: boolean;
    }
    const burstSparks: BurstSpark[] = [];

    const spawnBurstSparks = (
      cx: number,
      cy: number,
      swipeAngle: number,
      energy: number,
      count: number
    ) => {
      for (let i = 0; i < count; i++) {
        if (burstSparks.length > 220) burstSparks.shift();
        const spread = (Math.random() - 0.5) * 2.2;
        const ang =
          swipeAngle +
          Math.PI * 0.5 * (Math.random() > 0.5 ? 1 : -1) +
          spread;
        const speed = (1.4 + Math.random() * 4.2) * (0.5 + energy * 0.75);
        burstSparks.push({
          x: cx + (Math.random() - 0.5) * 16,
          y: cy + (Math.random() - 0.5) * 16,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          life: 1.0,
          maxLife: 0.42 + Math.random() * 0.48,
          size: 1.35 + Math.random() * 2.3,
          isWhiteCore: Math.random() < 0.48,
        });
      }
    };

    // 3. Trail nodes for the Direct Cursor/Touch Crescent Light-Wake
    interface TrailNode {
      x: number;
      y: number;
      vx: number;
      vy: number;
      energy: number;
    }
    const TRAIL_LENGTH = 20;
    const trail: TrailNode[] = Array.from({ length: TRAIL_LENGTH }, () => ({
      x: width * 0.55,
      y: height * 0.27,
      vx: 0,
      vy: 0,
      energy: 0.72,
    }));

    let rawPointerX = width * 0.55;
    let rawPointerY = height * 0.27;
    let smoothWakeX = width * 0.55;
    let smoothWakeY = height * 0.27;
    let prevNormX = 0.0;
    let prevNormY = 0.16;
    let lastUserTouchMs = -9999;
    let isPointerDown = false;
    let wakeEnergy = 0.75;
    let swipeAngleRad = -0.52;
    let prevObjectKind: ParticleObjectKind = 'none';

    const recordInput = (clientX: number, clientY: number, boost = 0) => {
      rawPointerX = clientX;
      rawPointerY = clientY;
      lastUserTouchMs = performance.now();
      if (boost > 0) {
        wakeEnergy = Math.min(1, Math.max(wakeEnergy, boost));
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      recordInput(e.clientX, e.clientY, 0.88);
    };
    const onPointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      recordInput(e.clientX, e.clientY, 1.0);
      spawnBurstSparks(e.clientX, e.clientY, swipeAngleRad, 1.0, 26);
    };
    const onPointerUp = () => {
      isPointerDown = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        recordInput(t.clientX, t.clientY, 0.96);
      }
    };
    const onTouchStart = (e: TouchEvent) => {
      isPointerDown = true;
      if (e.touches.length > 0) {
        const t = e.touches[0];
        recordInput(t.clientX, t.clientY, 1.0);
        spawnBurstSparks(t.clientX, t.clientY, swipeAngleRad, 1.0, 28);
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onPointerUp, { passive: true });

    let rafId = 0;
    let isDisposed = false;
    const startMs = performance.now();
    let prevSec = 0;

    const renderFrame = () => {
      if (isDisposed) return;
      const nowMs = performance.now();
      const elapsedSec = (nowMs - startMs) / 1000;
      const dt = Math.min(0.06, Math.max(0.004, elapsedSec - prevSec));
      prevSec = elapsedSec;

      ctx.clearRect(0, 0, width, height);

      if (introSweepProgressRef.current < 0.35) {
        rafId = requestAnimationFrame(renderFrame);
        return;
      }

      // Compute 100% reel-free screen pose that slides (`menggeser`) and fades out (`menghilang`) when scrolled!
      const safePose = computeConstellationReelSafeScreenPose(
        scrollProgressRef.current,
        introSweepProgressRef.current,
        scrollVelocityRef.current,
        width,
        height
      );
      const anchorX = safePose.screenX;
      const anchorY = safePose.screenY;
      const objScale = safePose.scale;
      const objOpacity = safePose.opacity;
      const tiltRad = safePose.tiltRad;
      const SAFE_RX = 82 * objScale;
      const SAFE_RY = 68 * objScale;

      if (canvas) {
        canvas.dataset.constellationOpacity = objOpacity.toFixed(2);
        canvas.dataset.constellationSlideX = Math.round(safePose.slideOffsetX).toString();
        canvas.dataset.constellationSlideY = Math.round(safePose.slideOffsetY).toString();
      }

      // Reset local cursor dispersion cleanly when switching between chapter object kinds
      if (prevObjectKind !== safePose.kind) {
        prevObjectKind = safePose.kind;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          particles[i].dispX = 0;
          particles[i].dispY = 0;
          particles[i].vx = 0;
          particles[i].vy = 0;
          if (safePose.visible && safePose.kind !== 'none') {
            const pt = computeCameraOrGraphicParticlePoint(
              i,
              PARTICLE_COUNT,
              safePose.kind,
              elapsedSec
            );
            const world = computeLockedParticleWorldPosition(
              pt.localX * 0.65,
              pt.localY * 0.65,
              anchorX,
              anchorY,
              tiltRad,
              objScale,
              0,
              0
            );
            particles[i].x = world.x;
            particles[i].y = world.y;
          }
        }
      }

      const timeSinceUserSec = (nowMs - lastUserTouchMs) / 1000;

      let targetWakeX = rawPointerX;
      let targetWakeY = rawPointerY;

      if (timeSinceUserSec > 2.2) {
        const sweepT = elapsedSec * 1.35;
        const idleCenterX = safePose.visible ? anchorX : width * 0.55;
        const idleCenterY = safePose.visible ? anchorY : height * 0.28;
        targetWakeX = idleCenterX + Math.cos(sweepT) * (SAFE_RX * 0.45);
        targetWakeY = idleCenterY + Math.sin(sweepT * 1.4) * (SAFE_RY * 0.42);
      }

      smoothWakeX += (targetWakeX - smoothWakeX) * 0.34;
      smoothWakeY += (targetWakeY - smoothWakeY) * 0.34;

      const normX = (rawPointerX / Math.max(1, width)) * 2 - 1;
      const normY = -(rawPointerY / Math.max(1, height)) * 2 + 1;

      const wakeState = computeMorphoCursorWakeState(
        normX,
        normY,
        prevNormX,
        prevNormY,
        dt,
        wakeEnergy,
        isPointerDown || timeSinceUserSec <= 1.8
      );
      prevNormX = normX;
      prevNormY = normY;
      wakeEnergy = Math.max(0.58, wakeState.wakeEnergy);

      const stepDx = smoothWakeX - trail[0].x;
      const stepDy = smoothWakeY - trail[0].y;
      if (Math.hypot(stepDx, stepDy) > 0.6) {
        swipeAngleRad = Math.atan2(stepDy, stepDx);
      }

      for (let i = TRAIL_LENGTH - 1; i > 0; i--) {
        trail[i].x += (trail[i - 1].x - trail[i].x) * 0.5;
        trail[i].y += (trail[i - 1].y - trail[i].y) * 0.5;
        trail[i].vx = trail[i - 1].x - trail[i].x;
        trail[i].vy = trail[i - 1].y - trail[i].y;
        trail[i].energy = trail[i - 1].energy * 0.93;
      }
      trail[0].vx = stepDx;
      trail[0].vy = stepDy;
      trail[0].x = smoothWakeX;
      trail[0].y = smoothWakeY;
      trail[0].energy = wakeEnergy;

      if (Math.hypot(stepDx, stepDy) > 1.4) {
        spawnBurstSparks(smoothWakeX, smoothWakeY, swipeAngleRad, wakeEnergy, 4);
      }

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';

      // =======================================================================
      // A & B. CELESTIAL STAR CONSTELLATION (`RASI BINTANG`) OBJECTS
      // Compact 72px radius in guaranteed reel-free pockets; slides & disappears on scroll!
      // =======================================================================
      if (safePose.visible && safePose.kind !== 'none' && objOpacity > 0.02) {
        const constellation = getConstellationBlueprintForObject(
          safePose.kind,
          elapsedSec
        );
        const CONSTELLATION_RADIUS = 72;

        ctx.save();
        ctx.globalAlpha = objOpacity;
        ctx.translate(anchorX, anchorY);
        ctx.rotate(tiltRad);
        ctx.scale(objScale, objScale);

        // 1. Compact Celestial Nebula Aura behind the Constellation (never touches reels)
        const backGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, 88);
        backGlow.addColorStop(
          0,
          isLightRef.current
            ? 'rgba(56, 189, 248, 0.16)'
            : 'rgba(56, 189, 248, 0.22)'
        );
        backGlow.addColorStop(
          0.58,
          isLightRef.current
            ? 'rgba(37, 99, 235, 0.06)'
            : 'rgba(99, 102, 241, 0.09)'
        );
        backGlow.addColorStop(1, 'rgba(2, 8, 23, 0)');
        ctx.fillStyle = backGlow;
        ctx.beginPath();
        ctx.arc(0, 0, 88, 0, Math.PI * 2);
        ctx.fill();

        // Compact single inner astrolabe circle (radius 64px)
        ctx.save();
        ctx.setLineDash([3, 5]);
        ctx.strokeStyle = isLightRef.current
          ? 'rgba(37, 99, 235, 0.22)'
          : 'rgba(125, 211, 252, 0.2)';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.arc(0, 0, 64, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 2. Subtle Dashed Celestial Silhouette scaled to compact constellation bounds
        ctx.save();
        ctx.scale(0.64, 0.64);
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = isLightRef.current
          ? 'rgba(37, 99, 235, 0.32)'
          : 'rgba(56, 189, 248, 0.28)';
        ctx.lineWidth = 1.2;

        if (safePose.kind === 'camera') {
          for (const [cx, cy, r] of [
            [-58, -62, 22],
            [6, -58, 24],
          ] as const) {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.strokeRect(-86, -31, 124, 84);
          ctx.beginPath();
          ctx.arc(-24, 11, 18, 0, Math.PI * 2);
          ctx.stroke();
        } else if (safePose.kind === 'graphic') {
          const barX = [-64, -16, 36, 88];
          const barH = [42, 76, 62, 118];
          for (let b = 0; b < 4; b++) {
            const h = barH[b] + Math.sin(elapsedSec * 2.2 + b * 1.1) * 5;
            ctx.strokeRect(barX[b] - 9, 68 - h, 18, h);
          }
          ctx.beginPath();
          for (let s = 0; s <= 24; s++) {
            const u = s / 24;
            const sp = computeGraphicSplinePoint(u, elapsedSec);
            if (s === 0) ctx.moveTo(sp.x, sp.y);
            else ctx.lineTo(sp.x, sp.y);
          }
          ctx.stroke();
        } else if (safePose.kind === 'clapper') {
          ctx.strokeRect(-90, -24, 180, 92);
          ctx.beginPath();
          ctx.arc(0, 22, 20, 0, Math.PI * 2);
          ctx.stroke();
        } else if (safePose.kind === 'prism') {
          ctx.save();
          ctx.rotate(0.42);
          ctx.beginPath();
          ctx.ellipse(0, 0, 102, 38, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.beginPath();
          for (let s = 0; s <= 32; s++) {
            const u = s / 32;
            const wx = -98 + u * 196;
            const wy =
              Math.sin(u * Math.PI * 5 - elapsedSec * 3.2) *
              46 *
              Math.sin(u * Math.PI);
            if (s === 0) ctx.moveTo(wx, wy);
            else ctx.lineTo(wx, wy);
          }
          ctx.stroke();
        }
        ctx.restore();

        // 3. Draw Luminous Constellation Lines (`Garis Rasi Bintang`) connecting Star Vertices
        for (let eIdx = 0; eIdx < constellation.edges.length; eIdx++) {
          const edge = constellation.edges[eIdx];
          const sFrom = constellation.stars[edge.fromIdx];
          const sTo = constellation.stars[edge.toIdx];
          if (!sFrom || !sTo) continue;

          const x1 = sFrom.nx * CONSTELLATION_RADIUS;
          const y1 = sFrom.ny * CONSTELLATION_RADIUS;
          const x2 = sTo.nx * CONSTELLATION_RADIUS;
          const y2 = sTo.ny * CONSTELLATION_RADIUS;

          ctx.save();
          if (edge.tier === 'guide') {
            ctx.setLineDash([4, 5]);
            ctx.strokeStyle = isLightRef.current
              ? 'rgba(79, 70, 229, 0.42)'
              : 'rgba(129, 140, 248, 0.46)';
            ctx.lineWidth = 1.1;
          } else {
            ctx.strokeStyle = isLightRef.current
              ? 'rgba(2, 132, 199, 0.84)'
              : 'rgba(125, 211, 252, 0.88)';
            ctx.lineWidth = 1.85;
          }
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          if (edge.tier === 'primary') {
            const pulseU = (elapsedSec * 0.55 + eIdx * 0.19) % 1;
            const px = x1 + (x2 - x1) * pulseU;
            const py = y1 + (y2 - y1) * pulseU;
            ctx.fillStyle = isLightRef.current ? '#0284c7' : '#ffffff';
            ctx.beginPath();
            ctx.arc(px, py, 2.0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // 4. Draw Major Constellation Star Vertices (`Bintang Utama Rasi`) with Diffraction Spikes & Labels
        for (let sIdx = 0; sIdx < constellation.stars.length; sIdx++) {
          const star = constellation.stars[sIdx];
          const sx = star.nx * CONSTELLATION_RADIUS;
          const sy = star.ny * CONSTELLATION_RADIUS;
          const twinkle =
            0.84 + 0.16 * Math.sin(elapsedSec * 3.4 + sIdx * 1.3);
          const starRad = (2.4 + star.magnitude * 2.8) * twinkle;

          const corona = ctx.createRadialGradient(
            sx,
            sy,
            0.5,
            sx,
            sy,
            starRad * 3.8
          );
          if (star.tint === 'amber') {
            corona.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
            corona.addColorStop(0.35, 'rgba(251, 191, 36, 0.48)');
            corona.addColorStop(1, 'rgba(251, 191, 36, 0)');
          } else if (star.tint === 'indigo') {
            corona.addColorStop(0, 'rgba(224, 231, 255, 0.92)');
            corona.addColorStop(0.35, 'rgba(129, 140, 248, 0.45)');
            corona.addColorStop(1, 'rgba(99, 102, 241, 0)');
          } else {
            corona.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
            corona.addColorStop(0.35, 'rgba(56, 189, 248, 0.52)');
            corona.addColorStop(1, 'rgba(56, 189, 248, 0)');
          }
          ctx.fillStyle = corona;
          ctx.beginPath();
          ctx.arc(sx, sy, starRad * 3.8, 0, Math.PI * 2);
          ctx.fill();

          if (star.spikes > 0) {
            const spikeLen = starRad * (star.spikes === 6 ? 3.3 : 2.5);
            ctx.strokeStyle =
              star.tint === 'amber'
                ? 'rgba(253, 224, 71, 0.85)'
                : isLightRef.current
                ? 'rgba(2, 132, 199, 0.8)'
                : 'rgba(224, 242, 254, 0.88)';
            ctx.lineWidth = 1.1;
            const spikePairs = star.spikes / 2;
            for (let sp = 0; sp < spikePairs; sp++) {
              const ang = (sp * Math.PI) / spikePairs;
              ctx.beginPath();
              ctx.moveTo(
                sx - Math.cos(ang) * spikeLen,
                sy - Math.sin(ang) * spikeLen
              );
              ctx.lineTo(
                sx + Math.cos(ang) * spikeLen,
                sy + Math.sin(ang) * spikeLen
              );
              ctx.stroke();
            }
          }

          ctx.fillStyle =
            star.tint === 'amber'
              ? '#fef08a'
              : isLightRef.current
              ? '#0369a1'
              : '#ffffff';
          ctx.beginPath();
          ctx.arc(sx, sy, starRad * 0.72, 0, Math.PI * 2);
          ctx.fill();
        }

        // ZERO TEXT IN RASI BINTANG (`di rasi bintang ga ada text apapun`):
        // No star designations and no constellation header text are rendered on the canvas.

        ctx.restore();

        // Render Constellation Stardust Particles aligned along the Constellation Star Vertices & Edges
        // that scatter dynamically (`particel nya menyebar jika terkena visual sentuhannya`) when touched by the visual wake!
        const CONSTELLATION_STARDUST_COUNT = 220;
        const activeTouchWakeNodes = [
          { x: smoothWakeX, y: smoothWakeY, weight: 1.0 },
          { x: trail[1].x, y: trail[1].y, weight: 0.88 },
          { x: trail[2].x, y: trail[2].y, weight: 0.76 },
          { x: trail[3].x, y: trail[3].y, weight: 0.64 },
          { x: trail[5].x, y: trail[5].y, weight: 0.48 },
          { x: trail[7].x, y: trail[7].y, weight: 0.34 },
        ];
        const scatterRadiusScreen = 135 * Math.max(0.75, objScale) * (0.82 + wakeEnergy * 0.35);
        const maxScatterDispScreen = 145 * Math.max(0.8, objScale);

        ctx.save();
        ctx.globalAlpha = objOpacity;
        for (let i = 0; i < CONSTELLATION_STARDUST_COUNT; i++) {
          const p = particles[i];
          const edgeCount = Math.max(1, constellation.edges.length);
          const edge = constellation.edges[i % edgeCount];
          const sFrom = constellation.stars[edge.fromIdx] ?? constellation.stars[0];
          const sTo = constellation.stars[edge.toIdx] ?? constellation.stars[0];
          const u = ((i * 73) % 101) / 100;
          const jitterAngle = i * 2.39996;
          const jitterRad = (i % 5 === 0 ? 7 : 2.5) * Math.sin(i * 1.7 + elapsedSec * 0.9);
          const localX =
            (sFrom.nx + (sTo.nx - sFrom.nx) * u) * CONSTELLATION_RADIUS +
            Math.cos(jitterAngle) * jitterRad;
          const localY =
            (sFrom.ny + (sTo.ny - sFrom.ny) * u) * CONSTELLATION_RADIUS +
            Math.sin(jitterAngle) * jitterRad;
          const isCore = u < 0.08 || u > 0.92;

          const lockedPos = computeLockedParticleWorldPosition(
            localX,
            localY,
            anchorX,
            anchorY,
            tiltRad,
            objScale,
            0,
            0
          );

          const scatterStep = computeConstellationParticleTouchScatter({
            particleLocalX: lockedPos.x,
            particleLocalY: lockedPos.y,
            dispX: p.dispX,
            dispY: p.dispY,
            velX: p.vx,
            velY: p.vy,
            touchPointsLocal: objOpacity > 0.25 ? activeTouchWakeNodes : [],
            wakeVx: stepDx,
            wakeVy: stepDy,
            scatterRadiusPx: scatterRadiusScreen,
            maxScatterDispPx: maxScatterDispScreen,
          });

          p.dispX = scatterStep.nextDispX;
          p.dispY = scatterStep.nextDispY;
          p.vx = scatterStep.nextVelX;
          p.vy = scatterStep.nextVelY;

          if (scatterStep.scatterExcitation > 0.08) {
            p.heat = Math.min(1, p.heat + scatterStep.scatterExcitation * 0.65);
            if (i % 9 === 0 && scatterStep.scatterExcitation > 0.42 && burstSparks.length < 96) {
              spawnBurstSparks(
                lockedPos.x + p.dispX,
                lockedPos.y + p.dispY,
                Math.atan2(p.vy, p.vx),
                scatterStep.scatterExcitation,
                1
              );
            }
            if (i % 4 === 0 && scatterStep.scatterExcitation > 0.2) {
              ctx.strokeStyle = isLightRef.current
                ? `rgba(2, 132, 199, ${scatterStep.scatterExcitation * 0.42})`
                : `rgba(125, 211, 252, ${scatterStep.scatterExcitation * 0.52})`;
              ctx.lineWidth = 0.95;
              ctx.beginPath();
              ctx.moveTo(lockedPos.x + p.dispX, lockedPos.y + p.dispY);
              ctx.lineTo(lockedPos.x, lockedPos.y);
              ctx.stroke();
            }
          } else {
            p.heat *= 0.91;
          }

          if (objOpacity < 0.85) {
            p.dispX *= objOpacity;
            p.dispY *= objOpacity;
          }

          p.x = lockedPos.x + p.dispX;
          p.y = lockedPos.y + p.dispY;

          const r =
            (isCore ? 1.75 : 1.05 + (i % 3) * 0.22) *
            (1 + p.heat * 0.45) *
            Math.min(1.1, objScale * 0.92);

          if (p.heat > 0.55 || isCore) {
            ctx.fillStyle = isLightRef.current
              ? `rgba(2, 132, 199, ${0.86 + p.heat * 0.14})`
              : `rgba(255, 255, 255, ${0.88 + p.heat * 0.12})`;
          } else if (p.hueType === 0) {
            ctx.fillStyle = isLightRef.current
              ? 'rgba(37, 99, 235, 0.78)'
              : `rgba(56, 189, 248, ${0.76 + p.heat * 0.22})`;
          } else if (p.hueType === 1) {
            ctx.fillStyle = isLightRef.current
              ? 'rgba(79, 70, 229, 0.72)'
              : `rgba(129, 140, 248, ${0.72 + p.heat * 0.24})`;
          } else {
            ctx.fillStyle = isLightRef.current
              ? 'rgba(14, 165, 233, 0.76)'
              : `rgba(186, 230, 253, ${0.78 + p.heat * 0.2})`;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Switch to additive blending for the glowing Sparkle Burst & Crescent Light-Wake
      ctx.globalCompositeOperation = isLightRef.current
        ? 'source-over'
        : 'lighter';

      // =======================================================================
      // C. RENDER SPARKLE BURST PARTICLES FROM CURSOR / TOUCH GESTURE WAKE
      // =======================================================================
      for (let i = burstSparks.length - 1; i >= 0; i--) {
        const sp = burstSparks[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vx *= 0.92;
        sp.vy *= 0.92;
        sp.life -= dt / sp.maxLife;
        if (sp.life <= 0) {
          burstSparks.splice(i, 1);
          continue;
        }
        const alpha = Math.max(0, sp.life);
        ctx.fillStyle = sp.isWhiteCore
          ? `rgba(255, 255, 255, ${alpha * 0.94})`
          : `rgba(56, 189, 248, ${alpha * 0.85})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }

      // =======================================================================
      // D. RENDER BLINDING WHITE-CYAN CRESCENT LIGHT WAKE AT CURSOR / TOUCH POSITION
      // =======================================================================
      if (wakeEnergy > 0.08) {
        for (let i = 0; i < TRAIL_LENGTH - 1; i += 2) {
          const tNorm = 1 - i / TRAIL_LENGTH;
          const node = trail[i];
          const rad = (16 + tNorm * 52) * wakeEnergy;
          const aura = ctx.createRadialGradient(
            node.x,
            node.y,
            rad * 0.05,
            node.x,
            node.y,
            rad
          );
          aura.addColorStop(
            0,
            `rgba(255, 255, 255, ${0.36 * tNorm * wakeEnergy})`
          );
          aura.addColorStop(
            0.32,
            `rgba(56, 189, 248, ${0.3 * tNorm * wakeEnergy})`
          );
          aura.addColorStop(
            0.68,
            `rgba(99, 102, 241, ${0.15 * tNorm * wakeEnergy})`
          );
          aura.addColorStop(1, 'rgba(2, 8, 23, 0)');
          ctx.fillStyle = aura;
          ctx.beginPath();
          ctx.arc(node.x, node.y, rad, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.save();
        ctx.translate(smoothWakeX, smoothWakeY);
        ctx.rotate(swipeAngleRad);

        const crescR = 38 + wakeEnergy * 32;
        ctx.beginPath();
        ctx.arc(
          -crescR * 0.35,
          0,
          crescR,
          -Math.PI * 0.56,
          Math.PI * 0.56,
          false
        );
        ctx.arc(
          -crescR * 0.12,
          0,
          crescR * 0.84,
          Math.PI * 0.56,
          -Math.PI * 0.56,
          true
        );
        ctx.closePath();
        const crescGrad = ctx.createRadialGradient(
          crescR * 0.5,
          0,
          2,
          crescR * 0.25,
          0,
          crescR * 1.15
        );
        crescGrad.addColorStop(0, `rgba(255, 255, 255, ${0.96 * wakeEnergy})`);
        crescGrad.addColorStop(
          0.38,
          `rgba(125, 211, 252, ${0.84 * wakeEnergy})`
        );
        crescGrad.addColorStop(
          0.72,
          `rgba(56, 189, 248, ${0.4 * wakeEnergy})`
        );
        crescGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
        ctx.fillStyle = crescGrad;
        ctx.fill();
        ctx.restore();

        for (let pass = 0; pass < 2; pass++) {
          for (let i = 0; i < TRAIL_LENGTH - 2; i++) {
            const tNorm = Math.pow(1 - i / (TRAIL_LENGTH - 1), 1.4);
            const p0 = trail[i];
            const p1 = trail[i + 1];
            const p2 = trail[i + 2];
            const mid1X = (p0.x + p1.x) * 0.5;
            const mid1Y = (p0.y + p1.y) * 0.5;
            const mid2X = (p1.x + p2.x) * 0.5;
            const mid2Y = (p1.y + p2.y) * 0.5;
            ctx.beginPath();
            ctx.moveTo(i === 0 ? p0.x : mid1X, i === 0 ? p0.y : mid1Y);
            ctx.quadraticCurveTo(p1.x, p1.y, mid2X, mid2Y);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            if (pass === 0) {
              ctx.strokeStyle = `rgba(56, 189, 248, ${
                0.52 * tNorm * wakeEnergy
              })`;
              ctx.lineWidth = (17 * tNorm + 1.5) * wakeEnergy;
            } else {
              ctx.strokeStyle = `rgba(255, 255, 255, ${
                0.94 * tNorm * wakeEnergy
              })`;
              ctx.lineWidth = (7 * tNorm + 1) * wakeEnergy;
            }
            ctx.stroke();
          }
        }
      }

      ctx.restore();
      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onPointerUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="interactive-morpho-wake-canvas"
      data-object-visible={currentZone.visible ? 'true' : 'false'}
      data-object-kind={currentZone.kind}
      aria-hidden="true"
      className="fixed inset-0 z-[3] h-screen w-screen pointer-events-none opacity-100"
    />
  );
};

/**
 * Renders the multi-stage creative 3D-synced transition carrier for the Explanation Pod:
 * - Chapter 01 (`liquid-tilt-left`): Morpho Crescent Light Arc + Giant Bioluminescent Iris Lens + Shimmer Sweep
 * - Chapter 02 (`origami-skew-bottom-right`): 3D Hologram Prism Viewfinder Brackets + Vertical Laser Scanbeam
 * - Chapter 03 (`sonic-ripple-top-left`): 24kHz Concentric Sonic Shockwave Rings + Live 8-Bar Spectrum Visualizer
 * - Chapter 04 (`frame-flip-top-right`): Self-Drawing Bezier `spring()` Curve + Golden Keyframe Diamond Locks
 */
const CreativeExplanationCarrier: React.FC<{
  style: TransitionStyle;
  isLight: boolean;
}> = ({ style, isLight }) => {
  if (style === 'liquid-tilt-left') {
    return (
      <>
        {/* Stage 1: Spherical Orbital Planet & Ring Carrier inside the pod corner */}
        <motion.div
          data-testid="giant-bubble-transition-carrier"
          aria-hidden="true"
          initial={{ opacity: 0.92, scale: 0.52, rotate: -18 }}
          animate={{
            opacity: [0.92, 0.72, 0.34],
            scale: [0.52, 1.08, 1.0],
            rotate: [-18, 8, 0],
          }}
          transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: isLight
              ? 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.95) 0%, rgba(56,189,248,0.42) 42%, rgba(30,58,138,0.55) 100%)'
              : 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.9) 0%, rgba(56,189,248,0.45) 36%, rgba(15,23,42,0.92) 100%)',
            boxShadow:
              'inset -6px -8px 16px rgba(2,6,23,0.75), 0 0 24px rgba(56,189,248,0.35)',
          }}
          className="pointer-events-none absolute left-2.5 top-2.5 w-16 h-16 rounded-full border border-sky-300/60"
        >
          <span
            style={{ transform: 'rotate(-20deg) scaleY(0.36)' }}
            className="absolute -inset-2.5 rounded-full border border-dashed border-amber-300/75"
          />
        </motion.div>

        {/* Stage 2: Diagonal Celestial Star-Sheen Sweep across the card */}
        <motion.div
          aria-hidden="true"
          initial={{ x: '-110%', opacity: 0.95 }}
          animate={{ x: '210%', opacity: 0 }}
          transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background:
              'linear-gradient(105deg, transparent 20%, rgba(56,189,248,0.35) 45%, rgba(255,255,255,0.85) 50%, rgba(99,102,241,0.35) 55%, transparent 80%)',
          }}
          className="pointer-events-none absolute inset-y-0 w-2/3 z-20 rounded-2xl"
        />
      </>
    );
  }

  if (style === 'origami-skew-bottom-right') {
    return (
      <>
        {/* 3D Hologram Viewfinder Corner Brackets integrated flush inside the pod frame */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1.5 left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-sky-300/80 rounded-tl"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1.5 right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-amber-300/80 rounded-tr"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1.5 left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-amber-300/80 rounded-bl"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1.5 right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-sky-300/80 rounded-br"
        />
        {/* Sweeping Laser Hologram Scanbeam */}
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0.9, scaleX: 0.12 }}
          animate={{ opacity: [0.9, 0.55, 0.1], scaleX: 1 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute inset-0 rounded-2xl border border-amber-300/45 bg-gradient-to-r from-sky-400/20 via-indigo-400/10 to-amber-300/10 origin-left"
        />
      </>
    );
  }

  if (style === 'sonic-ripple-top-left') {
    return (
      <>
        {/* Concentric 24kHz Sonic Shockwave Ring contained cleanly inside pod */}
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0.85, scale: 0.35 }}
          animate={{ opacity: [0.85, 0.45, 0.16], scale: [0.35, 1.15, 1.0] }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="pointer-events-none absolute left-2 top-2 w-20 h-20 rounded-full border border-sky-300/50 shadow-[0_0_24px_rgba(56,189,248,0.3)]"
        />
        {/* Live Animated 6-Bar 24kHz Audio Equalizer Badge */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-3.5 right-4 flex items-end gap-0.5 h-3.5 opacity-80"
        >
          {[0.45, 0.95, 0.6, 1.0, 0.5, 0.8].map((h, i) => (
            <motion.span
              key={i}
              animate={{ scaleY: [h, 1.15 - h * 0.5, h] }}
              transition={{
                duration: 0.75 + i * 0.1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ height: `${h * 100}%` }}
              className="w-0.5 origin-bottom rounded-full bg-gradient-to-t from-sky-400 to-amber-300"
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      {/* Animated Spring Keyframe Lock Accent contained cleanly inside top-right corner */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0.85, scale: 0.4, rotate: -35 }}
        animate={{ opacity: 0.2, scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 190, damping: 14 }}
        className="pointer-events-none absolute right-2 top-2 w-12 h-12 rounded-xl border border-amber-300/45 bg-gradient-to-br from-amber-300/20 via-sky-400/15 to-indigo-500/15 shadow-[0_0_20px_rgba(251,191,36,0.22)]"
      />
    </>
  );
};

/**
 * Renders a crisp vector Motion Graphic Mini-Illustration inside the floating
 * Explanation Pod so every chapter visually showcases its graphic object.
 */
const ChapterGraphicIllustration: React.FC<{
  type: StoryChapterSpec['graphicType'];
  isLight: boolean;
}> = ({ type, isLight }) => {
  if (type === 'chart3d') {
    return (
      <svg
        viewBox="0 0 120 72"
        className="relative z-10 w-24 h-16 shrink-0"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="barCyan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="barAmber" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
        <rect x="10" y="36" width="14" height="28" rx="3" fill="url(#barCyan)" />
        <rect x="30" y="22" width="14" height="42" rx="3" fill="url(#barCyan)" />
        <rect x="50" y="10" width="14" height="54" rx="3" fill="url(#barAmber)" />
        <circle
          cx="92"
          cy="36"
          r="18"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="6"
          strokeDasharray="78 30"
        />
        <circle
          cx="92"
          cy="36"
          r="18"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="6"
          strokeDashoffset="-82"
          strokeDasharray="28 80"
        />
        <circle cx="80" cy="14" r="3.5" fill="#7dd3fc" opacity="0.85" />
      </svg>
    );
  }

  if (type === 'storyboard') {
    return (
      <svg
        viewBox="0 0 120 72"
        className="relative z-10 w-24 h-16 shrink-0"
        aria-hidden="true"
      >
        <rect
          x="6"
          y="10"
          width="32"
          height="52"
          rx="5"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
        />
        <circle cx="22" cy="24" r="5" fill="#fbbf24" />
        <path
          d="M15 46 L22 34 L29 46"
          stroke="#38bdf8"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M44 36 H56"
          stroke="#fbbf24"
          strokeWidth="2.5"
          strokeDasharray="3 3"
        />
        <rect
          x="62"
          y="10"
          width="50"
          height="52"
          rx="6"
          fill="rgba(56,189,248,0.14)"
          stroke="#fbbf24"
          strokeWidth="2"
        />
        <rect x="70" y="20" width="34" height="8" rx="2" fill="#fbbf24" />
        <rect x="70" y="34" width="24" height="6" rx="2" fill="#38bdf8" />
        <circle cx="100" cy="48" r="5" fill="#38bdf8" />
      </svg>
    );
  }

  if (type === 'waveform') {
    return (
      <svg
        viewBox="0 0 120 72"
        className="relative z-10 w-24 h-16 shrink-0"
        aria-hidden="true"
      >
        <path
          d="M6 36 Q 20 8, 34 36 T 62 36 T 90 36 T 114 36"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M6 36 Q 20 62, 34 36 T 62 36 T 90 36 T 114 36"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="34" cy="18" r="4" fill="#7dd3fc" />
        <circle cx="76" cy="54" r="5" fill="#fbbf24" />
        <circle
          cx="96"
          cy="16"
          r="6"
          fill="none"
          stroke={isLight ? '#0284c7' : '#bae6fd'}
          strokeWidth="2"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 120 72"
      className="relative z-10 w-24 h-16 shrink-0"
      aria-hidden="true"
    >
      <path
        d="M12 58 C 42 58, 48 14, 106 16"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <polygon points="12,50 20,58 12,66 4,58" fill="#fbbf24" />
      <polygon points="58,28 66,36 58,44 50,36" fill="#38bdf8" />
      <polygon points="106,8 114,16 106,24 98,16" fill="#fbbf24" />
      <circle cx="30" cy="22" r="5.5" fill="rgba(56,189,248,0.45)" />
      <circle cx="88" cy="50" r="7" fill="rgba(251,191,36,0.4)" />
    </svg>
  );
};

export const LandingPage3D: React.FC<LandingPage3DProps> = ({
  currentUser,
  onUserAuthenticated,
  onEnterStudio,
  themeMode: controlledThemeMode,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const themeMode = controlledThemeMode ?? 'dark';

  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);
  const [scrollDirection, setScrollDirection] = useState<1 | -1>(1);
  const scrollDirectionRef = useRef<1 | -1>(1);
  const headlineCameraMotionRef = useRef<HTMLDivElement | null>(null);
  const podCameraMotionRef = useRef<HTMLDivElement | null>(null);
  const cameraTrajectoryLabelRef = useRef<HTMLSpanElement | null>(null);
  const cameraVectorDeltaRef = useRef<HTMLSpanElement | null>(null);
  const cameraWindowBarRef = useRef<HTMLDivElement | null>(null);
  const [activeZoomMode, setActiveZoomMode] =
    useState<ChapterZoomMode>('zoom-out');
  const [signedInUser, setSignedInUser] = useState<CreatorSessionUser | null>(
    currentUser || null
  );
  const [authLoadingMode, setAuthLoadingMode] = useState<
    'signin' | 'signup' | null
  >(null);
  const [authFeedback, setAuthFeedback] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (currentUser) {
      setSignedInUser(currentUser);
    }
  }, [currentUser]);

  // Brand Intro & Real-Time Scroll-Camera Trajectory Refs
  // Play the full Graph Motion brand intro animation on initial entry by default
  const initialPlayFullscreenIntro =
    typeof window === 'undefined' ||
    new URLSearchParams(window.location.search).get('skipIntro') !== '1';
  const scrollProgressRef = useRef<number>(0);
  const scrollVelocityRef = useRef<number>(0);
  const cosmosPanRef = useRef<CosmosPanState>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    isPanning: false,
  });
  const introSweepProgressRef = useRef<number>(initialPlayFullscreenIntro ? 0 : 1);
  const isIntroSkippedRef = useRef<boolean>(!initialPlayFullscreenIntro);
  const introClockSecRef = useRef<number>(initialPlayFullscreenIntro ? 0 : 4.0);
  const introFreezeSecRef = useRef<number | null>(null);
  const lastBrandIntroKeyRef = useRef<string>(initialPlayFullscreenIntro ? '' : 'complete');
  const [brandIntro, setBrandIntro] = useState<BrandIntroState>(() =>
    computeBrandIntroState(initialPlayFullscreenIntro ? 0 : 4.0, !initialPlayFullscreenIntro)
  );
  const [selectedPlanetModal, setSelectedPlanetModal] =
    useState<RemotionPlanetSpec | null>(null);
  const galaxyAzimuthReadoutRef = useRef<HTMLSpanElement | null>(null);

  // Interactive Global 360° Drag/Swipe Panning for the Planetary Galaxy & Giant Horizon
  // (`setiap di geser kesamping dan geser 360° bisa melihat seluruh planet planet lainnya`)
  useEffect(() => {
    let isPointerDragging = false;
    let lastClientX = 0;
    let lastClientY = 0;

    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.closest(
          'button, a, input, [data-testid="planet-remotion-video-modal"]'
        )
      ) {
        return;
      }
      isPointerDragging = true;
      cosmosPanRef.current.isPanning = true;
      lastClientX = e.clientX;
      lastClientY = e.clientY;
    };

    const onMove = (e: PointerEvent) => {
      if (!isPointerDragging) return;
      const dx = e.clientX - lastClientX;
      const dy = e.clientY - lastClientY;
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      // Unclamped X for continuous 360° horizontal galaxy panning across all 12 planets!
      cosmosPanRef.current.x += dx * 1.15;
      cosmosPanRef.current.y = Math.max(
        -220,
        Math.min(220, cosmosPanRef.current.y + dy * 0.85)
      );
      cosmosPanRef.current.vx = dx * 0.55;
      cosmosPanRef.current.vy = dy * 0.45;
    };

    const onUp = () => {
      isPointerDragging = false;
      cosmosPanRef.current.isPanning = false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement | null)?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') {
        // Rotate 360° space camera 30° counter-clockwise (to previous planet sector)
        cosmosPanRef.current.vx = 14;
        cosmosPanRef.current.x += 120;
      } else if (e.key === 'ArrowRight') {
        // Rotate 360° space camera 30° clockwise (to next planet sector)
        cosmosPanRef.current.vx = -14;
        cosmosPanRef.current.x -= 120;
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 2) {
        cosmosPanRef.current.x -= e.deltaX * 1.1;
        cosmosPanRef.current.vx = -e.deltaX * 0.35;
      }
    };

    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onUp, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('wheel', onWheel);
    };
  }, []);

  useEffect(() => {
    introClockSecRef.current = isIntroSkippedRef.current ? 4.0 : 0;
    introFreezeSecRef.current = null;
    let rafId = 0;
    let disposed = false;
    let prevProgress = 0;
    let prevTimeMs = performance.now();
    let smoothVel = 0;
    let lastChap = 0;
    let lastZoom: ChapterZoomMode = 'zoom-out';

    const updateIntroLoop = () => {
      if (disposed) return;
      const nowMs = performance.now();
      const dt = Math.min(0.1, Math.max(0.001, (nowMs - prevTimeMs) / 1000));
      prevTimeMs = nowMs;

      if (!cosmosPanRef.current.isPanning) {
        cosmosPanRef.current.x += cosmosPanRef.current.vx;
        cosmosPanRef.current.y += cosmosPanRef.current.vy;
        cosmosPanRef.current.vx *= 0.92;
        cosmosPanRef.current.vy *= 0.91;
        // Keep X unclamped so 360° rotational inertia wraps smoothly around the entire galaxy!
        cosmosPanRef.current.y = Math.max(
          -220,
          Math.min(220, cosmosPanRef.current.y)
        );
      }
      if (galaxyAzimuthReadoutRef.current) {
        const yawDeg = Math.round(
          (((-cosmosPanRef.current.x * 0.25 + scrollProgressRef.current * 54) %
            360) +
            360) %
            360
        );
        galaxyAzimuthReadoutRef.current.textContent = `${yawDeg}° / 360°`;
      }

      const currentScroll =
        window.scrollY || document.documentElement.scrollTop || 0;
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const rawProgress = Math.max(0, Math.min(1, currentScroll / maxScroll));
      const lerpAlpha = 1 - Math.exp(-dt * 16.0);
      scrollProgressRef.current +=
        (rawProgress - scrollProgressRef.current) * Math.max(0.22, lerpAlpha);

      const smoothP = scrollProgressRef.current;
      const instVel = (smoothP - prevProgress) / Math.max(0.004, dt);
      if (Math.abs(instVel) > 0.004) {
        const nextDir: 1 | -1 = instVel >= 0 ? 1 : -1;
        if (scrollDirectionRef.current !== nextDir) {
          scrollDirectionRef.current = nextDir;
          setScrollDirection(nextDir);
        }
      }
      prevProgress = smoothP;
      smoothVel += (instVel - smoothVel) * 0.25;
      scrollVelocityRef.current = smoothVel;

      const isMobile = window.innerWidth < 768;
      const choreo = computeScrollChoreography(
        smoothP * maxScroll,
        maxScroll,
        isMobile
      );

      if (choreo.activeChapterIndex !== lastChap) {
        const nextDir: 1 | -1 =
          choreo.activeChapterIndex >= lastChap ? 1 : -1;
        scrollDirectionRef.current = nextDir;
        setScrollDirection(nextDir);
        lastChap = choreo.activeChapterIndex;
        setActiveChapterIdx(choreo.activeChapterIndex);
      }
      if (choreo.zoomMode !== lastZoom) {
        lastZoom = choreo.zoomMode;
        setActiveZoomMode(choreo.zoomMode);
      }

      // Continuous 60fps scroll-camera appear/disappear transform (same smoothstep physics as Camera & Graphic objects)
      const camMotion = computeChapterExplanationCameraMotion(
        smoothP,
        choreo.activeChapterIndex,
        scrollDirectionRef.current,
        smoothVel
      );
      if (headlineCameraMotionRef.current) {
        const ht = camMotion.headlineTransform;
        headlineCameraMotionRef.current.style.transform = `perspective(1150px) translate3d(${ht.translateX.toFixed(
          2
        )}px, ${ht.translateY.toFixed(2)}px, ${ht.translateZ.toFixed(
          2
        )}px) rotateX(${ht.rotateXDeg.toFixed(
          2
        )}deg) rotateY(${ht.rotateYDeg.toFixed(
          2
        )}deg) rotateZ(${ht.rotateZDeg.toFixed(2)}deg) scale(${ht.scale.toFixed(
          3
        )})`;
        headlineCameraMotionRef.current.style.opacity = ht.opacity.toFixed(3);
        headlineCameraMotionRef.current.style.filter =
          ht.blurPx > 0.15 ? `blur(${ht.blurPx.toFixed(1)}px)` : 'none';
        headlineCameraMotionRef.current.style.pointerEvents =
          ht.opacity > 0.08 ? 'auto' : 'none';
      }
      if (podCameraMotionRef.current) {
        const pt = camMotion.podTransform;
        podCameraMotionRef.current.style.transform = `perspective(1150px) translate3d(${pt.translateX.toFixed(
          2
        )}px, ${pt.translateY.toFixed(2)}px, ${pt.translateZ.toFixed(
          2
        )}px) rotateX(${pt.rotateXDeg.toFixed(
          2
        )}deg) rotateY(${pt.rotateYDeg.toFixed(
          2
        )}deg) rotateZ(${pt.rotateZDeg.toFixed(2)}deg) scale(${pt.scale.toFixed(
          3
        )})`;
        podCameraMotionRef.current.style.opacity = pt.opacity.toFixed(3);
        podCameraMotionRef.current.style.filter =
          pt.blurPx > 0.15 ? `blur(${pt.blurPx.toFixed(1)}px)` : 'none';
        podCameraMotionRef.current.style.pointerEvents =
          pt.opacity > 0.08 ? 'auto' : 'none';
      }
      if (cameraTrajectoryLabelRef.current) {
        cameraTrajectoryLabelRef.current.textContent = `${
          camMotion.scrollDirection === 1 ? 'SCROLL DOWN ↘' : 'SCROLL UP ↖'
        } · ${camMotion.cameraShiftVector.trajectoryLabel}`;
      }
      if (cameraVectorDeltaRef.current) {
        const cv = camMotion.cameraShiftVector;
        cameraVectorDeltaRef.current.textContent = `ΔCAM (${
          cv.panX >= 0 ? '+' : ''
        }${cv.panX.toFixed(2)}, ${cv.panY >= 0 ? '+' : ''}${cv.panY.toFixed(
          2
        )}) · ROLL ${cv.rollDeg >= 0 ? '+' : ''}${cv.rollDeg.toFixed(1)}°`;
      }
      if (cameraWindowBarRef.current) {
        cameraWindowBarRef.current.style.width = `${Math.max(
          8,
          Math.round(camMotion.windowProgress * 100)
        )}%`;
      }

      if (currentScroll > 15) {
        isIntroSkippedRef.current = true;
      }
      if (!isIntroSkippedRef.current) {
        if (introFreezeSecRef.current !== null) {
          introClockSecRef.current = introFreezeSecRef.current;
        } else {
          introClockSecRef.current += Math.min(0.05, dt);
        }
      }
      const elapsedIntroSec = introClockSecRef.current;
      const nextState = computeBrandIntroState(
        elapsedIntroSec,
        isIntroSkippedRef.current
      );
      introSweepProgressRef.current = nextState.cameraSweepProgress;
      const nextBrandKey = nextState.isActive
        ? `${nextState.morphStage}|${nextState.barStagger[0].toFixed(3)}|${nextState.barStagger[2].toFixed(3)}|${nextState.ribbonDrawProgress.toFixed(3)}|${nextState.playPrismScale.toFixed(3)}|${nextState.wordRevealProgress.toFixed(3)}|${nextState.dockToHeaderProgress.toFixed(3)}|${nextState.overlayOpacity.toFixed(3)}`
        : 'complete';
      if (nextBrandKey !== lastBrandIntroKeyRef.current) {
        lastBrandIntroKeyRef.current = nextBrandKey;
        setBrandIntro(nextState);
      }

      rafId = requestAnimationFrame(updateIntroLoop);
    };

    (
      window as unknown as {
        __replayGraphMotionIntro?: (startOffsetSec?: number, freezeAtSec?: number | null) => void;
      }
    ).__replayGraphMotionIntro = (startOffsetSec = 0, freezeAtSec: number | null = null) => {
      isIntroSkippedRef.current = false;
      introClockSecRef.current = startOffsetSec;
      introFreezeSecRef.current = freezeAtSec;
      const immediate = computeBrandIntroState(startOffsetSec, false);
      introSweepProgressRef.current = immediate.cameraSweepProgress;
      lastBrandIntroKeyRef.current = `${immediate.morphStage}|${startOffsetSec.toFixed(3)}`;
      setBrandIntro(immediate);
    };

    rafId = requestAnimationFrame(updateIntroLoop);
    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
    };
  }, []);

  const themeModeRef = useRef<'dark' | 'light'>(themeMode);
  useEffect(() => {
    themeModeRef.current = themeMode;
  }, [themeMode]);

  const triggerSpinRef = useRef<() => void>(() => {});

  const defaultSessionUser: CreatorSessionUser = signedInUser ||
    currentUser || {
      name: 'Kreator Graph',
      email: 'creator@graphmotion.id',
      roleBadge: 'Creator Studio',
    };

  const scrollToProgress = (targetProgress: number) => {
    const maxScroll = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
    window.scrollTo({
      top: targetProgress * maxScroll,
      behavior: 'auto',
    });
  };

  const handleNextExplanationChapter = () => {
    const chapterTargets = [0.25, 0.5, 0.75, 0.96];
    const target = chapterTargets[Math.min(activeChapterIdx, chapterTargets.length - 1)] ?? 0.96;
    scrollToProgress(target);
  };

  const handleGoogleAuth = async (mode: 'signin' | 'signup') => {
    setAuthLoadingMode(mode);
    setAuthFeedback(null);
    try {
      const { authenticateWithGoogle } = await import('../firebase.ts');
      const firebaseUser = await authenticateWithGoogle(mode);
      const sessionUser: CreatorSessionUser = {
        name:
          firebaseUser.displayName ||
          firebaseUser.email?.split('@')[0] ||
          'Kreator Google',
        email: firebaseUser.email || 'creator@graphmotion.id',
        roleBadge: 'Google Account',
      };
      setSignedInUser(sessionUser);
      try {
        localStorage.setItem(
          'satset_creator_session',
          JSON.stringify(sessionUser)
        );
      } catch {
        // ignore
      }
      setAuthFeedback({
        type: 'success',
        text:
          mode === 'signup'
            ? `Akun Google terdaftar: ${sessionUser.email}`
            : `Masuk dengan Google: ${sessionUser.email}`,
      });
      onUserAuthenticated?.(sessionUser);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'
      ) {
        setAuthFeedback({
          type: 'error',
          text: 'Popup Google ditutup sebelum proses selesai.',
        });
      } else if (code === 'auth/popup-blocked') {
        setAuthFeedback({
          type: 'error',
          text: 'Popup browser diblokir. Izinkan popup untuk Sign in / Sign up with Google.',
        });
      } else {
        setAuthFeedback({
          type: 'error',
          text:
            err instanceof Error
              ? err.message
              : 'Gagal menghubungkan akun Google.',
        });
      }
    } finally {
      setAuthLoadingMode(null);
    }
  };

  // ===========================================================================
  // THREE.JS SCENE: 100% PURE, FULL-BLEED, ULTRA-LONG 3D CINEMA FILM REELS
  // - Alpha-transparent WebGL canvas (`z-[4]`) so `BACK_REEL_WATER_BUBBLES` (`z-[2]`)
  //   sit genuinely BEHIND the 3D reels and are occluded by the film strip!
  // - Slow-Mo Dwell & Per-Frame Contextual Zoom-In / Zoom-Out when stopping at a chapter
  // ===========================================================================
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const scene = new THREE.Scene();
    const darkBgColor = new THREE.Color(0x020817);
    const lightBgColor = new THREE.Color(0xeef6ff);
    // Keep scene.background null so the WebGL canvas is transparent where the 3D reel is absent,
    // allowing the background bubble layer (`z-[2]`) to sit genuinely BEHIND the 3D film strip!
    scene.background = null;
    scene.fog = new THREE.FogExp2(0x020817, 0.042);

    const width = Math.max(1, window.innerWidth || container.clientWidth || 1280);
    const height = Math.max(1, window.innerHeight || container.clientHeight || 800);

    const camera = new THREE.PerspectiveCamera(39, width / height, 0.1, 65);
    camera.position.set(0.12, 0.04, 5.65);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
      });
    } catch {
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height, true);
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Environment Reflection (optional if WebGL context supports PMREM)
    let envTex: THREE.Texture | null = null;
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      envTex = pmremGenerator.fromScene(
        new RoomEnvironment(),
        0.04
      ).texture;
      scene.environment = envTex;
      pmremGenerator.dispose();
    } catch {
      envTex = null;
    }

    // Cinematic 3-Point + Warm Amber & Cyan Volumetric Lighting
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x020617, 1.55);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 2.4);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const rimBlueLight = new THREE.DirectionalLight(0x0284c7, 2.85);
    rimBlueLight.position.set(-5, -3, 3);
    scene.add(rimBlueLight);

    const focalGoldLight = new THREE.PointLight(0xf59e0b, 6.8, 7.0);
    focalGoldLight.position.set(0.2, 0.1, 1.5);
    scene.add(focalGoldLight);

    const foregroundBlueLight = new THREE.PointLight(0x38bdf8, 6.5, 7.2);
    foregroundBlueLight.position.set(-1.1, 0.6, 1.8);
    scene.add(foregroundBlueLight);

    const brushedChromeMat = new THREE.MeshStandardMaterial({
      color: 0xdbeafe,
      metalness: 0.92,
      roughness: 0.15,
    });

    // High-resolution Continuous Perforated Film Strip Texture with Motion Graphic Objects
    const filmStripTex = createContinuousFilmStripTexture();
    filmStripTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const filmRibbonMat = new THREE.MeshPhysicalMaterial({
      map: filmStripTex,
      emissiveMap: filmStripTex,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 1.18,
      roughness: 0.15,
      metalness: 0.32,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      side: THREE.DoubleSide,
    });

    const reelMasterGroup = new THREE.Group();
    scene.add(reelMasterGroup);

    // =========================================================================
    // 1. ULTRA-LONG FULL-BLEED 3D PERFORATED CINEMA FILM REELS RIBBON MESH
    // =========================================================================
    const CONTROL_COUNT = 120;
    const splinePoints = Array.from(
      { length: CONTROL_COUNT },
      () => new THREE.Vector3()
    );
    const ribbonSpline = new THREE.CatmullRomCurve3(splinePoints);

    const RIBBON_SEGS = 320;
    const RIBBON_HALF_WIDTH = 0.68;
    const ribbonVertexCount = (RIBBON_SEGS + 1) * 2;
    const ribbonPositions = new Float32Array(ribbonVertexCount * 3);
    const ribbonUVs = new Float32Array(ribbonVertexCount * 2);
    const ribbonIndices: number[] = [];

    for (let i = 0; i <= RIBBON_SEGS; i++) {
      const u = i / RIBBON_SEGS;
      ribbonUVs[i * 4 + 0] = u;
      ribbonUVs[i * 4 + 1] = 1.0;
      ribbonUVs[i * 4 + 2] = u;
      ribbonUVs[i * 4 + 3] = 0.0;

      if (i < RIBBON_SEGS) {
        const a = i * 2;
        const b = i * 2 + 1;
        const c = (i + 1) * 2;
        const d = (i + 1) * 2 + 1;
        ribbonIndices.push(a, b, c, b, d, c);
      }
    }

    const ribbonGeo = new THREE.BufferGeometry();
    ribbonGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(ribbonPositions, 3)
    );
    ribbonGeo.setAttribute('uv', new THREE.BufferAttribute(ribbonUVs, 2));
    ribbonGeo.setIndex(ribbonIndices);

    const ribbonMesh = new THREE.Mesh(ribbonGeo, filmRibbonMat);
    ribbonMesh.frustumCulled = false;
    reelMasterGroup.add(ribbonMesh);

    // =========================================================================
    // 2. SLEEK METALLIC FILM STRIP RIM RAILS (Integral top & bottom film border)
    // =========================================================================
    const RAIL_SEGMENTS = 160;
    const railGeo = new THREE.CylinderGeometry(0.018, 0.018, 1.0, 8);
    const topRailMeshes: THREE.Mesh[] = [];
    const bottomRailMeshes: THREE.Mesh[] = [];

    for (let s = 0; s < RAIL_SEGMENTS; s++) {
      const topR = new THREE.Mesh(railGeo, brushedChromeMat);
      const botR = new THREE.Mesh(railGeo, brushedChromeMat);
      topR.frustumCulled = false;
      botR.frustumCulled = false;
      reelMasterGroup.add(topR, botR);
      topRailMeshes.push(topR);
      bottomRailMeshes.push(botR);
    }

    // Pre-allocated math helpers
    const _baseWidthAxis = new THREE.Vector3(0.22, 0.28, 0.934).normalize();
    const _widthAxis = new THREE.Vector3();
    const _pt = new THREE.Vector3();
    const _ptNext = new THREE.Vector3();
    const _yAxis = new THREE.Vector3(0, 1, 0);
    const _zAxis = new THREE.Vector3(0, 0, 1);
    const _railStart = new THREE.Vector3();
    const _railEnd = new THREE.Vector3();
    const _railMid = new THREE.Vector3();
    const _railDir = new THREE.Vector3();
    const _lookTarget = new THREE.Vector3();

    let scrollY = window.scrollY || 0;
    let maxScrollY = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
    let pointerX = 0;
    let pointerY = 0;
    let smoothPointerX = 0;
    let smoothPointerY = 0;
    let lastClickSpinStartSec = -999;

    const startTimeMs = performance.now();
    triggerSpinRef.current = () => {
      lastClickSpinStartSec = (performance.now() - startTimeMs) / 1000;
    };

    let currentCamX = 0.12;
    let currentCamY = 0.04;
    let currentCamZ = 5.65;
    let currentLookX = -0.05;
    let currentLookY = -0.02;
    let currentLookZ = 0.0;
    let currentRollZ = -0.05;
    let currentFov = 39;
    let smoothScrollProgress = 0;
    let prevElapsedSec = 0;
    let prevScrollProgress = 0;
    let smoothScrollVelocity = 0;
    let virtualElapsedSec = 0;
    let currentUvOffsetX = 0;

    const handleScroll = () => {
      scrollY = window.scrollY || 0;
      maxScrollY = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
    };

    const handlePointerMove = (e: PointerEvent) => {
      pointerX = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      pointerY = -(e.clientY / Math.max(1, window.innerHeight)) * 2 + 1;
    };

    const syncViewportSize = () => {
      if (!container) return;
      const w = window.innerWidth || container.clientWidth;
      const h = window.innerHeight || container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, true);
      maxScrollY = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      renderer.render(scene, camera);
    };

    const resizeObserver = new ResizeObserver(syncViewportSize);
    resizeObserver.observe(container);

    window.addEventListener('resize', syncViewportSize, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, {
      passive: true,
    });

    let frameId = 0;
    let isDisposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 16);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 4);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 16);
        }
      };
      frameId = window.setTimeout(poll, 4);
    }

    function updateFullBleedReelsGeometry(
      elapsedSec: number,
      scrollProgress: number,
      macroSep: number,
      targetUvOffsetX: number,
      uvLerp: number
    ) {
      // Continuously stream the film strip frames along the ribbon (`reelsnya tetap berjalan`)
      // while the 3D spatial curve itself remains deterministically locked to the active chapter!
      currentUvOffsetX += (targetUvOffsetX - currentUvOffsetX) * uvLerp;
      const streamingUvOffset = (currentUvOffsetX + elapsedSec * 0.11) % 1.0;
      filmStripTex.offset.x = streamingUvOffset;

      // 1. Update spline control points along the deterministic chapter-locked 3D curve
      // (`posisi lengkungan reelsnya jangan bergerak bebas, menyesuaikan tiap penjelasannya posisi reels tetap`)
      for (let i = 0; i < CONTROL_COUNT; i++) {
        const u = i / (CONTROL_COUNT - 1);
        const st = computeFilmRibbonPoint(
          u,
          0,
          scrollProgress,
          macroSep
        );
        splinePoints[i].set(st.x, st.y, st.z);
      }

      // Deterministic banking orientation of the ribbon cross-section per chapter
      const bankTilt = Math.sin(scrollProgress * Math.PI * 2.0) * 0.22;
      _widthAxis
        .copy(_baseWidthAxis)
        .applyAxisAngle(_zAxis, bankTilt)
        .normalize();

      // 2. Update the 320-segment Full-Bleed Perforated Film Strip Ribbon Mesh & streaming UV coordinates
      const posAttr = ribbonGeo.getAttribute(
        'position'
      ) as THREE.BufferAttribute;
      const uvAttr = ribbonGeo.getAttribute('uv') as THREE.BufferAttribute;
      for (let i = 0; i <= RIBBON_SEGS; i++) {
        const u = i / RIBBON_SEGS;
        ribbonSpline.getPoint(u, _pt);

        const topX = _pt.x + _widthAxis.x * RIBBON_HALF_WIDTH;
        const topY = _pt.y + _widthAxis.y * RIBBON_HALF_WIDTH;
        const topZ = _pt.z + _widthAxis.z * RIBBON_HALF_WIDTH;

        const botX = _pt.x - _widthAxis.x * RIBBON_HALF_WIDTH;
        const botY = _pt.y - _widthAxis.y * RIBBON_HALF_WIDTH;
        const botZ = _pt.z - _widthAxis.z * RIBBON_HALF_WIDTH;

        posAttr.setXYZ(i * 2, topX, topY, topZ);
        posAttr.setXYZ(i * 2 + 1, botX, botY, botZ);

        const scrolledU = u - streamingUvOffset;
        uvAttr.setXY(i * 2, scrolledU, 1.0);
        uvAttr.setXY(i * 2 + 1, scrolledU, 0.0);
      }
      posAttr.needsUpdate = true;
      uvAttr.needsUpdate = true;
      ribbonGeo.computeVertexNormals();

      // 3. Update Top & Bottom Brushed-Chrome Film Rim Rails
      for (let s = 0; s < RAIL_SEGMENTS; s++) {
        const u0 = s / RAIL_SEGMENTS;
        const u1 = (s + 1) / RAIL_SEGMENTS;
        ribbonSpline.getPoint(u0, _pt);
        ribbonSpline.getPoint(u1, _ptNext);

        _railStart.copy(_pt).addScaledVector(_widthAxis, RIBBON_HALF_WIDTH);
        _railEnd.copy(_ptNext).addScaledVector(_widthAxis, RIBBON_HALF_WIDTH);
        _railMid.addVectors(_railStart, _railEnd).multiplyScalar(0.5);
        _railDir.subVectors(_railEnd, _railStart);
        const lenTop = _railDir.length() * 1.12;
        _railDir.normalize();

        const topMesh = topRailMeshes[s];
        topMesh.position.copy(_railMid);
        topMesh.quaternion.setFromUnitVectors(_yAxis, _railDir);
        topMesh.scale.set(1, lenTop, 1);

        _railStart.copy(_pt).addScaledVector(_widthAxis, -RIBBON_HALF_WIDTH);
        _railEnd.copy(_ptNext).addScaledVector(_widthAxis, -RIBBON_HALF_WIDTH);
        _railMid.addVectors(_railStart, _railEnd).multiplyScalar(0.5);
        _railDir.subVectors(_railEnd, _railStart);
        const lenBot = _railDir.length() * 1.12;
        _railDir.normalize();

        const botMesh = bottomRailMeshes[s];
        botMesh.position.copy(_railMid);
        botMesh.quaternion.setFromUnitVectors(_yAxis, _railDir);
        botMesh.scale.set(1, lenBot, 1);
      }

      // Track central ribbon bend with volumetric lights
      ribbonSpline.getPoint(0.48, _pt);
      focalGoldLight.position.set(_pt.x, _pt.y, _pt.z + 1.2);
      foregroundBlueLight.position.set(_pt.x - 0.8, _pt.y + 0.5, _pt.z + 1.6);
    }

    function tick() {
      if (isDisposed) return;
      const elapsedSec = (performance.now() - startTimeMs) / 1000;
      const dt = Math.min(0.15, Math.max(0.001, elapsedSec - prevElapsedSec));
      prevElapsedSec = elapsedSec;

      const isMobile = window.innerWidth < 768;
      const dtLerp = 1 - Math.exp(-dt * 14.0);
      const camLerp = isSoftwareGl ? 0.92 : Math.max(0.28, dtLerp);

      scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      maxScrollY = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );

      const targetBg =
        themeModeRef.current === 'light' ? lightBgColor : darkBgColor;
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.lerp(targetBg, isSoftwareGl ? 0.65 : 0.14);
      }

      smoothPointerX += (pointerX - smoothPointerX) * 0.12;
      smoothPointerY += (pointerY - smoothPointerY) * 0.12;

      smoothScrollProgress = scrollProgressRef.current;
      const choreo = computeScrollChoreography(
        smoothScrollProgress * maxScrollY,
        maxScrollY,
        isMobile
      );

      const introElapsedSec = introClockSecRef.current;
      const introState = computeBrandIntroState(
        introElapsedSec,
        isIntroSkippedRef.current || scrollY > 15
      );
      introSweepProgressRef.current = introState.cameraSweepProgress;

      const instVelocity =
        (smoothScrollProgress - prevScrollProgress) / Math.max(0.004, dt);
      prevScrollProgress = smoothScrollProgress;
      smoothScrollVelocity += (instVelocity - smoothScrollVelocity) * 0.22;

      const slowMo = computeSlowMoAndFrameLock(
        smoothScrollProgress,
        smoothScrollVelocity,
        virtualElapsedSec
      );
      virtualElapsedSec += dt * slowMo.timeScale;

      const parallax = computePointerParallax(
        smoothPointerX,
        smoothPointerY,
        1.0
      );
      const spinBounce = evaluateClickSpinBounce(
        elapsedSec - lastClickSpinStartSec,
        0.95
      );

      updateFullBleedReelsGeometry(
        elapsedSec,
        smoothScrollProgress,
        choreo.macroCouplerSeparation,
        slowMo.targetUvOffsetX,
        isSoftwareGl ? 0.65 : 0.12
      );

      // Keep reelMasterGroup rotation fixed per chapter (no free pointer drift) so the 3D curve
      // stays in its exact chapter pose (`posisi lengkungan reelsnya jangan bergerak bebas`).
      reelMasterGroup.rotation.x = spinBounce.isActive
        ? spinBounce.bounceYOffset * 0.15
        : 0;
      reelMasterGroup.rotation.y = 0;

      // Subtle specular light shift from pointer parallax without moving the 3D reel curve
      focalGoldLight.position.x += parallax.posX * 0.35;
      focalGoldLight.position.y += parallax.posY * 0.35;

      // Apply smooth 3D camera redirection offset from the Graph Motion Brand Intro (`introCamOffset`)
      // plus 360° Space Observatory Camera Yaw/Pitch parallax (`bisa di putar kamera 360° seperti bisa memantau luar angkasa`)
      const galaxyYawRad =
        ((-cosmosPanRef.current.x * 0.25 + smoothScrollProgress * 54) * Math.PI) /
        180;
      const spaceCamYawOffsetX = Math.sin(galaxyYawRad) * 0.34;
      const spaceCamPitchOffsetY =
        Math.max(-1, Math.min(1, cosmosPanRef.current.y / 220)) * 0.22;

      const targetCamX =
        choreo.camPosX + introState.introCamOffset.dPosX + spaceCamYawOffsetX;
      const targetCamY =
        choreo.camPosY + introState.introCamOffset.dPosY + spaceCamPitchOffsetY;
      const targetCamZ =
        choreo.camPosZ +
        slowMo.slowMoDollyOffsetZ +
        introState.introCamOffset.dPosZ;
      const targetLookX =
        choreo.lookAtX +
        introState.introCamOffset.dLookX +
        spaceCamYawOffsetX * 0.45;
      const targetLookY =
        choreo.lookAtY +
        introState.introCamOffset.dLookY +
        spaceCamPitchOffsetY * 0.45;
      const targetRollZ =
        choreo.camRollZ +
        introState.introCamOffset.dRollZ +
        Math.sin(galaxyYawRad) * 0.025;
      const targetFov =
        choreo.camFov +
        slowMo.slowMoFovOffset +
        introState.introCamOffset.dFov;

      currentCamX += (targetCamX - currentCamX) * camLerp;
      currentCamY += (targetCamY - currentCamY) * camLerp;
      currentCamZ += (targetCamZ - currentCamZ) * camLerp;

      currentLookX += (targetLookX - currentLookX) * camLerp;
      currentLookY += (targetLookY - currentLookY) * camLerp;
      currentLookZ += (choreo.lookAtZ - currentLookZ) * camLerp;
      currentRollZ += (targetRollZ - currentRollZ) * camLerp;
      currentFov += (targetFov - currentFov) * camLerp;

      camera.position.set(currentCamX, currentCamY, currentCamZ);
      camera.up.set(Math.sin(currentRollZ), Math.cos(currentRollZ), 0);
      _lookTarget.set(currentLookX, currentLookY, currentLookZ);
      camera.lookAt(_lookTarget);

      if (Math.abs(camera.fov - currentFov) > 0.05) {
        camera.fov = currentFov;
        camera.updateProjectionMatrix();
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    const initChoreo = computeScrollChoreography(
      scrollY,
      maxScrollY,
      window.innerWidth < 768
    );
    const initSlowMo = computeSlowMoAndFrameLock(
      initChoreo.scrollProgress,
      0,
      0
    );
    const initIntro = computeBrandIntroState(0, scrollY > 15);
    smoothScrollProgress = initChoreo.scrollProgress;
    prevScrollProgress = initChoreo.scrollProgress;
    scrollProgressRef.current = initChoreo.scrollProgress;
    introSweepProgressRef.current = initIntro.cameraSweepProgress;
    currentUvOffsetX = initSlowMo.targetUvOffsetX;
    currentCamX = initChoreo.camPosX + initIntro.introCamOffset.dPosX;
    currentCamY = initChoreo.camPosY + initIntro.introCamOffset.dPosY;
    currentCamZ =
      initChoreo.camPosZ +
      initSlowMo.slowMoDollyOffsetZ +
      initIntro.introCamOffset.dPosZ;
    currentLookX = initChoreo.lookAtX + initIntro.introCamOffset.dLookX;
    currentLookY = initChoreo.lookAtY + initIntro.introCamOffset.dLookY;
    currentLookZ = initChoreo.lookAtZ;
    currentRollZ = initChoreo.camRollZ + initIntro.introCamOffset.dRollZ;
    currentFov =
      initChoreo.camFov +
      initSlowMo.slowMoFovOffset +
      initIntro.introCamOffset.dFov;

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    tick();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', syncViewportSize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pointermove', handlePointerMove);

      ribbonGeo.dispose();
      railGeo.dispose();

      brushedChromeMat.dispose();
      filmRibbonMat.dispose();
      filmStripTex.dispose();

      envTex?.dispose();
      renderer.dispose();
    };
  }, []);

  const isLight = themeMode === 'light';
  const activeStory =
    STORY_CHAPTERS[Math.min(STORY_CHAPTERS.length - 1, activeChapterIdx)];

  // Spatial zone CSS classes so headlines & explanation pods appear in varied, fitting screen spots
  const getZonePositionClasses = (zone: SpatialZone): string => {
    switch (zone) {
      case 'mid-left':
        return 'top-[54%] sm:top-[40%] -translate-y-1/2 left-5 right-5 sm:right-auto sm:left-14 lg:left-20';
      case 'top-right':
        return 'top-24 sm:top-28 right-6 sm:right-14 lg:right-20';
      case 'top-left':
        return 'top-24 sm:top-28 left-6 sm:left-14 lg:left-20';
      case 'mid-right':
        return 'top-[42%] -translate-y-1/2 right-6 sm:right-14 lg:right-20';
      case 'bottom-left':
        return 'bottom-14 sm:bottom-16 left-6 sm:left-14 lg:left-20';
      case 'bottom-right':
      default:
        return 'bottom-14 sm:bottom-16 right-6 sm:right-14 lg:right-20';
    }
  };

  const initialCamMotion = computeChapterExplanationCameraMotion(
    scrollProgressRef.current,
    activeChapterIdx,
    scrollDirection,
    0
  );
  const initHt = initialCamMotion.headlineTransform;
  const initPt = initialCamMotion.podTransform;

  return (
    <div
      className={`relative min-h-screen w-full overflow-x-hidden transition-colors duration-500 ${
        isLight ? 'bg-[#eef6ff] text-slate-950' : 'bg-[#020817] text-[#f8fafc]'
      }`}
    >
      {/* Subtle Celestial Coordinate Grid & Deep-Space Vignette (z-[1], behind everything) */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          backgroundImage: isLight
            ? 'linear-gradient(to right, rgba(37,99,235,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(37,99,235,0.055) 1px, transparent 1px)'
            : 'linear-gradient(to right, rgba(56,189,248,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(56,189,248,0.04) 1px, transparent 1px)',
          backgroundSize: '96px 96px',
        }}
      />
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background: isLight
            ? 'radial-gradient(circle at 50% 45%, transparent 45%, rgba(224,242,254,0.68) 100%)'
            : 'radial-gradient(circle at 50% 45%, transparent 38%, rgba(2,8,23,0.82) 100%)',
        }}
      />

      {/* =====================================================================
          0. CREATIVE "GRAPH MOTION" BRAND INTRO OVERLAY (`z-[70]`)
      ===================================================================== */}
      <GraphMotionBrandIntroOverlay
        introState={brandIntro}
        onSkipIntro={() => {
          isIntroSkippedRef.current = true;
          introFreezeSecRef.current = null;
          introClockSecRef.current = 4.0;
          lastBrandIntroKeyRef.current = 'complete';
          setBrandIntro(computeBrandIntroState(4.0, true));
        }}
      />

      {/* =====================================================================
          1. BACK-MOST PHOTOREALISTIC PLANET HORIZON & REMOTION STYLE PLANETS (`z-[2]`)
             Placed strictly at the very back (`berada dipaling belakang jangan sampai menghalangi
             di depan reels ataupun rasi bintangnya`):
             - `z-[2]`: Giant Photorealistic Planet Horizon + All Remotion Style Video Planets
             - `z-[3]`: Rasi Bintang (Star Constellations)
             - `z-[4]`: 3D Film Reels
      ===================================================================== */}
      <div
        data-testid="planet-orbital-back-layer"
        style={{ opacity: brandIntro.bab01UiReveal }}
        className="fixed inset-0 z-[2] pointer-events-none overflow-hidden transition-opacity duration-300"
      >
        <LabStudioGiantPlanetHorizonCanvas
          scrollProgressRef={scrollProgressRef}
          cosmosPanRef={cosmosPanRef}
          isLight={isLight}
        />
        {REMOTION_STYLE_PLANETS.map((planet) => (
          <RemotionStylePlanetSphere
            key={planet.id}
            planet={planet}
            scrollProgressRef={scrollProgressRef}
            cosmosPanRef={cosmosPanRef}
            isLight={isLight}
            onSelectPlanet={(p) => setSelectedPlanetModal(p)}
          />
        ))}
      </div>

      {/* =====================================================================
          2. CELESTIAL RASI BINTANG & CURSOR WAKE (`z-[3]` — IN FRONT OF PLANETS, BEHIND 3D REELS)
             Slides & disappears smoothly when scrolled (`menggeser lalu menghilang saat di gulir`)
             and never touches the 3D Film Reels.
      ===================================================================== */}
      <InteractiveMorphoParticleWakeCanvas
        activeChapterIdx={activeChapterIdx}
        scrollProgressRef={scrollProgressRef}
        scrollVelocityRef={scrollVelocityRef}
        introSweepProgressRef={introSweepProgressRef}
        isLight={isLight}
      />

      {/* =====================================================================
          3. FIXED FULL-VIEWPORT THREE.JS 3D FULL-BLEED FILM REEL STAGE (`z-[4]`)
             In front of all planets (`z-[2]`) and constellations (`z-[3]`), with pointer-events-none
             so background planets can still be clicked to open their Remotion video popup!
      ===================================================================== */}
      <div
        ref={mountRef}
        data-testid="three-canvas-stage"
        style={{ opacity: brandIntro.reelsStageReveal }}
        className="fixed inset-0 z-[4] h-screen w-screen pointer-events-none overflow-hidden transition-opacity duration-200"
      />

      {/* =====================================================================
          MINIMALIST TOP BAR: BRAND MARK + 360° GALAXY COMPASS PAN CONTROL
      ===================================================================== */}
      <header
        style={{ opacity: brandIntro.bab01UiReveal }}
        className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-14 py-4 sm:py-5 pointer-events-none transition-opacity duration-300"
      >
        <div className="mx-auto max-w-[1400px] flex items-center justify-between gap-4">
          <div
            data-testid="brand-wordmark-lockup"
            style={{
              opacity: brandIntro.dockToHeaderProgress >= 0.96 ? 1 : 0,
            }}
            className="relative inline-flex items-center gap-2.5 sm:gap-3 text-left whitespace-nowrap shrink-0 transition-opacity duration-150 drop-shadow-[0_2px_12px_rgba(2,8,23,0.88)]"
          >
            <GraphMotionBrandLockup isLight={isLight} size="md" animated={true} />
          </div>

          <div
            data-testid="galaxy-360-pan-control"
            className="pointer-events-auto flex items-center justify-end gap-1.5 sm:gap-2 min-w-0"
          >
            <button
              type="button"
              data-testid="galaxy-360-rotate-left-btn"
              aria-label="Putar kamera 360 derajat ke kiri (-30 derajat)"
              onClick={() => {
                // Smoothly rotate 30° counter-clockwise (120px pan = 30° at 0.25 deg/px)
                cosmosPanRef.current.vx = 14;
                cosmosPanRef.current.x += 120;
              }}
              title="Putar kamera luar angkasa 30° ke kiri (atau geser layar / tekan panah kiri)"
              className={`inline-flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-[11px] font-mono font-semibold transition-all cursor-pointer active:scale-95 ${
                isLight
                  ? 'bg-white/90 border-blue-200 text-blue-800 hover:border-blue-400 shadow-sm'
                  : 'bg-[#041029]/85 border-sky-400/35 text-sky-200 hover:border-sky-300 hover:bg-[#071a42]/90 shadow-[0_0_16px_rgba(56,189,248,0.16)]'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="hidden md:inline ml-1">-30°</span>
            </button>

            <button
              type="button"
              data-testid="galaxy-360-rotate-btn"
              onClick={() => {
                // Smoothly rotate 30° clockwise around the 360° galaxy (120px pan = 30° at 0.25 deg/px)
                cosmosPanRef.current.vx = -14;
                cosmosPanRef.current.x -= 120;
              }}
              title="Geser layar ke samping atau klik untuk memutar kamera luar angkasa 360° memantau 12 planet style Remotion"
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-mono font-semibold tracking-wider transition-all cursor-pointer active:scale-95 ${
                isLight
                  ? 'bg-white/90 border-blue-200 text-blue-800 hover:border-blue-400 shadow-sm'
                  : 'bg-[#041029]/85 border-sky-400/35 text-sky-200 hover:border-sky-300 hover:bg-[#071a42]/90 shadow-[0_0_20px_rgba(56,189,248,0.18)]'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="hidden sm:inline">KAMERA 360° · 12 PLANET</span>
              <span
                ref={galaxyAzimuthReadoutRef}
                data-testid="galaxy-360-azimuth-readout"
                className="px-1.5 py-0.5 rounded bg-sky-500/15 text-cyan-300 tabular-nums whitespace-nowrap"
              >
                0° / 360°
              </span>
              <RotateCw className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            </button>

            <button
              type="button"
              data-testid="galaxy-360-rotate-right-btn"
              aria-label="Putar kamera 360 derajat ke kanan (+30 derajat)"
              onClick={() => {
                // Smoothly rotate 30° clockwise (120px pan = 30° at 0.25 deg/px)
                cosmosPanRef.current.vx = -14;
                cosmosPanRef.current.x -= 120;
              }}
              title="Putar kamera luar angkasa 30° ke kanan (atau geser layar / tekan panah kanan)"
              className={`inline-flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-[11px] font-mono font-semibold transition-all cursor-pointer active:scale-95 ${
                isLight
                  ? 'bg-white/90 border-blue-200 text-blue-800 hover:border-blue-400 shadow-sm'
                  : 'bg-[#041029]/85 border-sky-400/35 text-sky-200 hover:border-sky-300 hover:bg-[#071a42]/90 shadow-[0_0_16px_rgba(56,189,248,0.16)]'
              }`}
            >
              <span className="hidden md:inline mr-1">+30°</span>
              <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            </button>

            {signedInUser && (
              <span
                data-testid="google-user-badge"
                className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-medium whitespace-nowrap ${
                  isLight
                    ? 'bg-white/90 border-blue-200 text-slate-700'
                    : 'bg-[#05122e]/85 border-sky-400/30 text-sky-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{signedInUser.email}</span>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================================
          DYNAMIC MULTI-ZONE EDITORIAL OVERLAY FOR CHAPTERS 01 - 04
          - Unveiled smoothly (`brandIntro.bab01UiReveal >= 0.35`) as the 3D camera
            finishes its smooth redirection from the Brand Intro into Bab 01!
      ===================================================================== */}
      <div
        style={{ opacity: brandIntro.bab01UiReveal }}
        className="fixed inset-0 z-20 pointer-events-none transition-opacity duration-300"
      >
        {brandIntro.bab01UiReveal >= 0.35 &&
          activeChapterIdx < 4 &&
          activeStory && (
            <div className="fixed inset-0 pointer-events-none">
              {/* 1. PRIMARY HEADLINE & CTA LOCKUP (Driven Continuously at 60fps by 3D Scroll-Camera Shift Trajectory) */}
              <div
                key={`headline-zone-${activeChapterIdx}`}
                data-testid="chapter-headline-lockup"
                data-zone={activeStory.headlineZone}
                data-scroll-direction={scrollDirection === 1 ? 'down' : 'up'}
                className={`fixed pointer-events-none max-w-[460px] ${getZonePositionClasses(
                  activeStory.headlineZone
                )}`}
              >
                <div
                  ref={headlineCameraMotionRef}
                  style={{
                    background: isLight
                      ? 'radial-gradient(ellipse at 35% 45%, rgba(238,246,255,0.96) 0%, rgba(238,246,255,0.82) 64%, rgba(238,246,255,0) 90%)'
                      : 'radial-gradient(ellipse at 35% 45%, rgba(2,8,23,0.95) 0%, rgba(2,8,23,0.78) 64%, rgba(2,8,23,0) 90%)',
                    transformStyle: 'preserve-3d',
                    willChange: 'transform, opacity, filter',
                    transform: `perspective(1150px) translate3d(${initHt.translateX.toFixed(
                      2
                    )}px, ${initHt.translateY.toFixed(
                      2
                    )}px, ${initHt.translateZ.toFixed(
                      2
                    )}px) rotateX(${initHt.rotateXDeg.toFixed(
                      2
                    )}deg) rotateY(${initHt.rotateYDeg.toFixed(
                      2
                    )}deg) rotateZ(${initHt.rotateZDeg.toFixed(
                      2
                    )}deg) scale(${initHt.scale.toFixed(3)})`,
                    opacity: initHt.opacity,
                    filter:
                      initHt.blurPx > 0.15
                        ? `blur(${initHt.blurPx.toFixed(1)}px)`
                        : 'none',
                    pointerEvents: initHt.opacity > 0.08 ? 'auto' : 'none',
                  }}
                  className="p-5 sm:p-6 rounded-3xl"
                >
                  {/* Editorial Micro-Spec Kicker Bar with Hairline Rule */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="inline-flex rounded-full h-2 w-2 bg-cyan-300 shrink-0 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                    <span
                      className={`text-[11px] font-mono font-semibold tracking-[0.2em] uppercase tabular-nums whitespace-nowrap shrink-0 ${
                        isLight ? 'text-blue-700' : 'text-sky-300'
                      }`}
                    >
                      {activeStory.indexLabel}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`h-[1px] w-5 ${
                        isLight ? 'bg-blue-400/60' : 'bg-sky-400/50'
                      }`}
                    />
                    <span
                      className={`text-[11px] font-mono tracking-[0.16em] uppercase ${
                        isLight ? 'text-indigo-700' : 'text-indigo-200/95'
                      }`}
                    >
                      {activeStory.kicker}
                    </span>
                  </div>

                  {/* Split Editorial Display Headline: Ultra-Crisp Lead + Iridescent Morpho Gradient Highlight */}
                  <h1
                    data-testid={
                      activeChapterIdx === 0
                        ? 'hero-planet-title'
                        : 'editorial-split-title'
                    }
                    className="text-3xl sm:text-[42px] font-extrabold tracking-[-0.032em] leading-[1.09] mb-4 text-balance"
                  >
                    <span
                      className={`block ${
                        isLight
                          ? 'text-slate-950'
                          : 'text-white drop-shadow-[0_2px_18px_rgba(2,8,23,0.9)]'
                      }`}
                    >
                      {activeStory.titleLead}
                    </span>
                    <span
                      className={`block mt-1 bg-clip-text text-transparent bg-gradient-to-r ${
                        isLight
                          ? 'from-blue-700 via-sky-600 to-indigo-600'
                          : 'from-sky-200 via-cyan-300 to-indigo-300 drop-shadow-[0_0_24px_rgba(56,189,248,0.28)]'
                      }`}
                    >
                      {activeStory.titleHighlight}
                    </span>
                  </h1>

                  {/* Refined Lead Copy with High-Legibility Contrast */}
                  <p
                    className={`text-sm sm:text-[15px] leading-[1.68] pl-3.5 border-l-2 mb-6 ${
                      isLight
                        ? 'text-slate-700 border-blue-500/60'
                        : 'text-slate-200/95 border-sky-400/60'
                    }`}
                  >
                    {activeStory.description}
                  </p>

                  {/* Primary Buka Studio Action + Next Explanation Chapter Button */}
                  <div className="flex flex-wrap items-center gap-3.5">
                    <button
                      type="button"
                      data-testid={
                        activeChapterIdx === 0
                          ? 'hero-get-started-btn'
                          : 'editorial-open-stage-btn'
                      }
                      onClick={() =>
                        onEnterStudio(defaultSessionUser, activeStory.stage)
                      }
                      className="group relative inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-200 text-slate-950 text-xs sm:text-sm font-bold tracking-[-0.01em] shadow-[0_0_28px_rgba(56,189,248,0.45)] hover:shadow-[0_0_38px_rgba(56,189,248,0.75)] transition-all duration-200 active:scale-95 cursor-pointer"
                    >
                      <span>Buka Studio</span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>

                    <button
                      type="button"
                      data-testid="next-chapter-btn"
                      onClick={handleNextExplanationChapter}
                      className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs sm:text-[13px] font-medium transition-all cursor-pointer ${
                        isLight
                          ? 'bg-white/85 border-blue-200 text-slate-800 hover:border-blue-400 hover:bg-white'
                          : 'bg-[#071636]/80 border-sky-400/35 text-sky-100 hover:border-sky-300/75 hover:bg-[#0b214d]/90'
                      }`}
                    >
                      <span>Bab Penjelasan Selanjutnya</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                    </button>
                  </div>

                  {/* Interactive Gesture Object Micro-Cue */}
                  {getChapterParticleObjectZone(activeChapterIdx).visible && (
                    <div
                      className={`mt-4 flex items-center gap-2 text-[10px] font-mono tracking-wider ${
                        isLight ? 'text-blue-700/80' : 'text-sky-300/75'
                      }`}
                    >
                      <Layers className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>
                        {activeChapterIdx === 0
                          ? 'Geser planet video Remotion & sentuh Rasi Bintang Kamera Sinema 3D'
                          : activeChapterIdx === 1
                          ? 'Geser planet video Remotion & sentuh Rasi Bintang Papan Klaper 3D'
                          : activeChapterIdx === 2
                          ? 'Geser planet video Remotion & sentuh Rasi Bintang Grafik & Spline 3D'
                          : 'Geser planet video Remotion & sentuh Rasi Bintang Prisma 60FPS'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. COMPLEMENTARY EXPLANATION & GRAPHIC OBJECT POD (`penjelasan teks nya`)
                  Driven Continuously at 60fps by Scroll-Camera Shift Trajectory (Smooth like Camera & Graphic Objects) */}
              <aside
                key={`pod-zone-${activeChapterIdx}`}
                data-testid="chapter-explanation-pod"
                data-zone={activeStory.explanationZone}
                data-zoom-mode={activeZoomMode}
                data-transition-tag={activeStory.transitionTag}
                data-scroll-direction={scrollDirection === 1 ? 'down' : 'up'}
                className={`hidden md:flex flex-col fixed pointer-events-none max-w-[440px] rounded-2xl ${getZonePositionClasses(
                  activeStory.explanationZone
                )}`}
              >
                <div
                  ref={podCameraMotionRef}
                  style={{
                    transformStyle: 'preserve-3d',
                    willChange: 'transform, opacity, filter',
                    transform: `perspective(1150px) translate3d(${initPt.translateX.toFixed(
                      2
                    )}px, ${initPt.translateY.toFixed(
                      2
                    )}px, ${initPt.translateZ.toFixed(
                      2
                    )}px) rotateX(${initPt.rotateXDeg.toFixed(
                      2
                    )}deg) rotateY(${initPt.rotateYDeg.toFixed(
                      2
                    )}deg) rotateZ(${initPt.rotateZDeg.toFixed(
                      2
                    )}deg) scale(${initPt.scale.toFixed(3)})`,
                    opacity: initPt.opacity,
                    filter:
                      initPt.blurPx > 0.15
                        ? `blur(${initPt.blurPx.toFixed(1)}px)`
                        : 'none',
                    pointerEvents: initPt.opacity > 0.08 ? 'auto' : 'none',
                  }}
                  className={`relative flex flex-col p-4 sm:p-5 rounded-2xl border overflow-hidden ${
                    isLight
                      ? 'bg-white/95 border-blue-200/95 text-slate-900 shadow-[0_18px_45px_rgba(37,99,235,0.14)]'
                      : 'bg-[#041029]/95 border-sky-400/40 text-slate-100 shadow-[0_20px_50px_rgba(2,8,23,0.9),0_0_32px_rgba(56,189,248,0.16)]'
                  }`}
                >
                  {/* Giant Bubble / Hologram / Sonic / Spring Creative Transition Carrier */}
                  <CreativeExplanationCarrier
                    key={`carrier-${activeChapterIdx}`}
                    style={activeStory.transitionStyle}
                    isLight={isLight}
                  />

                  {/* Top Metadata Header Bar inside Explanation Pod */}
                  <div className="relative z-10 flex items-center justify-between gap-3 pb-2.5 mb-2.5 border-b border-sky-400/20">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold tracking-wider uppercase whitespace-nowrap shrink-0 ${
                        activeStory.zoomBadgeLabel.includes('ZOOM-IN')
                          ? isLight
                            ? 'text-amber-700'
                            : 'text-amber-300'
                          : isLight
                          ? 'text-blue-700'
                          : 'text-sky-300'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                      {activeStory.zoomBadgeLabel}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-mono tracking-wider uppercase border whitespace-nowrap shrink-0 ${
                        isLight
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-sky-950/70 border-sky-400/30 text-cyan-200'
                      }`}
                    >
                      {activeStory.transitionTag}
                    </span>
                  </div>

                  {/* Live 3D Camera-Shift Vector Telemetry Strip (syncs dynamically with scroll direction) */}
                  <div
                    data-testid="chapter-camera-shift-telemetry"
                    className={`relative z-10 mb-3 px-2.5 py-1.5 rounded-lg border flex flex-col gap-1.5 ${
                      isLight
                        ? 'bg-blue-50/80 border-blue-200/80 text-slate-700'
                        : 'bg-[#020817]/80 border-sky-400/25 text-sky-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[9px] font-mono tabular-nums">
                      <span
                        ref={cameraTrajectoryLabelRef}
                        className={`font-semibold tracking-wider uppercase truncate ${
                          isLight ? 'text-blue-700' : 'text-cyan-300'
                        }`}
                      >
                        { `${
                          initialCamMotion.scrollDirection === 1
                            ? 'SCROLL DOWN ↘'
                            : 'SCROLL UP ↖'
                        } · ${
                          initialCamMotion.cameraShiftVector.trajectoryLabel
                        }` }
                      </span>
                      <span
                        ref={cameraVectorDeltaRef}
                        className={`shrink-0 ${
                          isLight ? 'text-slate-600' : 'text-sky-300/80'
                        }`}
                      >
                        {`ΔCAM (${
                          initialCamMotion.cameraShiftVector.panX >= 0
                            ? '+'
                            : ''
                        }${initialCamMotion.cameraShiftVector.panX.toFixed(
                          2
                        )}, ${
                          initialCamMotion.cameraShiftVector.panY >= 0
                            ? '+'
                            : ''
                        }${initialCamMotion.cameraShiftVector.panY.toFixed(
                          2
                        )}) · ROLL ${
                          initialCamMotion.cameraShiftVector.rollDeg >= 0
                            ? '+'
                            : ''
                        }${initialCamMotion.cameraShiftVector.rollDeg.toFixed(
                          1
                        )}°`}
                      </span>
                    </div>
                    <div
                      className={`w-full h-1 rounded-full overflow-hidden ${
                        isLight ? 'bg-blue-200/70' : 'bg-sky-950'
                      }`}
                    >
                      <div
                        ref={cameraWindowBarRef}
                        className="h-full bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300 rounded-full"
                        style={{
                          width: `${Math.max(
                            8,
                            Math.round(initialCamMotion.windowProgress * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Main Body: Graphic Object Mini-Illustration + Editorial Explanation */}
                  <div className="relative z-10 flex items-start gap-4">
                    <ChapterGraphicIllustration
                      type={activeStory.graphicType}
                      isLight={isLight}
                    />

                    <div className="min-w-0 flex-1">
                      <h3
                        className={`text-sm sm:text-[15px] font-bold tracking-[-0.015em] leading-snug mb-1.5 ${
                          isLight
                            ? 'text-slate-950'
                            : 'bg-clip-text text-transparent bg-gradient-to-r from-white via-sky-100 to-cyan-200'
                        }`}
                      >
                        {activeStory.explanationTitle}
                      </h3>

                      <p
                        className={`text-xs leading-[1.6] ${
                          isLight ? 'text-slate-600' : 'text-slate-200/90'
                        }`}
                      >
                        {activeStory.explanationDetail}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Live TSX Code Telemetry Bar inside Explanation Pod */}
                  <div
                    className={`relative z-10 mt-3.5 pt-2.5 border-t flex items-center justify-between gap-3 text-[10px] font-mono tabular-nums ${
                      isLight
                        ? 'border-blue-200/70 text-blue-800'
                        : 'border-sky-400/20 text-sky-300/90'
                    }`}
                  >
                    <span className="truncate min-w-0 flex-1">
                      {activeStory.codePreview}
                    </span>
                    <span
                      className={`whitespace-nowrap shrink-0 px-2 py-0.5 rounded text-[9px] font-semibold ${
                        isLight
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-sky-400/15 text-cyan-200 border border-sky-400/25'
                      }`}
                    >
                      {activeStory.metricValue}
                    </span>
                  </div>
                </div>
              </aside>
            </div>
          )}
      </div>

      {/* =====================================================================
          SCROLL TRACK CONTAINERS (5 x 100vh Sections Driving Dynamic Reels Curve)
      ===================================================================== */}
      <div className="relative z-10 w-full pointer-events-none">
        <section
          id="section-hero"
          data-testid="phase-0-horizon-section"
          className="h-screen w-full"
        />

        <section id="section-manifesto" className="h-screen w-full" />

        <section
          id="section-inspector"
          data-testid="phase-1-editorial-section"
          className="h-screen w-full"
        />

        <section id="section-resurface" className="h-screen w-full" />

        <section
          id="section-portal"
          data-testid="phase-2-login-section"
          className="min-h-screen w-full flex items-center justify-start px-6 sm:px-14 lg:px-20 py-24"
        >
          <AnimatePresence>
            {activeChapterIdx === 4 && (
              <motion.div
                key="portal-minimal-lockup"
                initial={{
                  opacity: 0,
                  scale: 0.84,
                  y: 36,
                }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{
                  type: 'spring',
                  stiffness: 130,
                  damping: 17,
                }}
                style={{
                  background: isLight
                    ? 'radial-gradient(ellipse at center, rgba(238,246,255,0.95) 0%, rgba(238,246,255,0.75) 68%, rgba(238,246,255,0) 92%)'
                    : 'radial-gradient(ellipse at center, rgba(2,8,23,0.94) 0%, rgba(2,8,23,0.75) 68%, rgba(2,8,23,0) 92%)',
                }}
                className="pointer-events-auto w-full max-w-lg p-6 rounded-3xl"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="inline-flex rounded-full h-2 w-2 bg-cyan-300 shrink-0 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                  <span
                    className={`text-[11px] font-mono font-semibold tracking-[0.2em] uppercase tabular-nums ${
                      isLight ? 'text-blue-700' : 'text-sky-300'
                    }`}
                  >
                    05 / 05
                  </span>
                  <span
                    aria-hidden="true"
                    className={`h-[1px] w-5 ${
                      isLight ? 'bg-blue-400/60' : 'bg-sky-400/50'
                    }`}
                  />
                  <span
                    className={`text-[11px] font-mono tracking-[0.16em] uppercase ${
                      isLight ? 'text-indigo-700' : 'text-indigo-200'
                    }`}
                  >
                    HUBUNGKAN PROJECT & STUDIO
                  </span>
                </div>

                <h2 className="text-3xl sm:text-[42px] font-extrabold tracking-[-0.032em] leading-[1.09] mb-4 text-balance">
                  <span
                    className={`block ${
                      isLight ? 'text-slate-950' : 'text-white'
                    }`}
                  >
                    Mulai produksi video
                  </span>
                  <span
                    className={`block mt-1 bg-clip-text text-transparent bg-gradient-to-r ${
                      isLight
                        ? 'from-blue-700 via-sky-600 to-indigo-600'
                        : 'from-sky-200 via-cyan-300 to-indigo-300'
                    }`}
                  >
                    pertama Anda di Studio.
                  </span>
                </h2>

                <p
                  className={`text-sm sm:text-[15px] leading-[1.68] pl-3.5 border-l-2 mb-6 ${
                    isLight
                      ? 'text-slate-700 border-blue-500/60'
                      : 'text-slate-200/95 border-sky-400/60'
                  }`}
                >
                  Masuk atau daftar dengan akun Google Anda, lalu langsung
                  buka ruang kerja Graph Motion 60 FPS.
                </p>

                {signedInUser && (
                  <div
                    data-testid="portal-signed-in-status"
                    className={`mb-4 px-3.5 py-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                      isLight
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-emerald-950/50 border-emerald-400/35 text-emerald-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span className="truncate">
                      Masuk sebagai {signedInUser.name} ({signedInUser.email})
                    </span>
                  </div>
                )}

                {authFeedback && (
                  <div
                    role="status"
                    className={`mb-4 px-3.5 py-2.5 rounded-xl border text-xs ${
                      authFeedback.type === 'error'
                        ? isLight
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : 'bg-red-950/55 border-red-400/40 text-red-200'
                        : isLight
                        ? 'bg-sky-50 border-sky-200 text-sky-800'
                        : 'bg-sky-950/55 border-sky-400/40 text-sky-200'
                    }`}
                  >
                    {authFeedback.text}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    data-testid="portal-google-signin-btn"
                    disabled={authLoadingMode !== null}
                    onClick={() => handleGoogleAuth('signin')}
                    className={`inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-60 ${
                      isLight
                        ? 'bg-white border-blue-200 text-slate-900 hover:border-blue-400 shadow-sm'
                        : 'bg-[#071636]/90 border-sky-400/35 text-white hover:border-sky-300 hover:bg-[#0b214d]'
                    }`}
                  >
                    <GoogleGIcon className="w-4 h-4 shrink-0" />
                    <span>
                      {authLoadingMode === 'signin'
                        ? 'Menghubungkan...'
                        : 'Sign in with Google'}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="portal-google-signup-btn"
                    disabled={authLoadingMode !== null}
                    onClick={() => handleGoogleAuth('signup')}
                    className={`inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-60 ${
                      isLight
                        ? 'bg-blue-50 border-blue-300 text-blue-900 hover:bg-blue-100 shadow-sm'
                        : 'bg-[#0a1d47]/90 border-cyan-300/40 text-cyan-100 hover:border-cyan-200 hover:text-white'
                    }`}
                  >
                    <GoogleGIcon className="w-4 h-4 shrink-0" />
                    <span>
                      {authLoadingMode === 'signup'
                        ? 'Mendaftar...'
                        : 'Sign up with Google'}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="portal-enter-studio-btn"
                    onClick={() => onEnterStudio(defaultSessionUser, 'ide')}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-200 text-slate-950 text-xs sm:text-sm font-bold whitespace-nowrap shadow-[0_0_24px_rgba(56,189,248,0.45)] hover:shadow-[0_0_34px_rgba(56,189,248,0.75)] transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Buka Studio</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* =====================================================================
          REMOTION STYLE VIDEO POPUP MODAL (`saat planet style video di klik akan menampilkan popup video style remotion nya`)
      ===================================================================== */}
      <AnimatePresence>
        {selectedPlanetModal && (
          <motion.div
            key="planet-remotion-video-modal-backdrop"
            data-testid="planet-remotion-video-modal"
            data-planet-id={selectedPlanetModal.id}
            data-preview-style={selectedPlanetModal.previewStyleId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedPlanetModal(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: 'spring', stiffness: 210, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-4xl rounded-3xl border overflow-hidden shadow-[0_28px_80px_rgba(2,6,23,0.95),0_0_45px_rgba(56,189,248,0.22)] ${
                isLight
                  ? 'bg-white border-blue-200 text-slate-900'
                  : 'bg-[#040f28]/95 border-sky-400/40 text-slate-100'
              }`}
            >
              {/* Top Modal Header Bar */}
              <div
                className={`flex items-center justify-between gap-4 px-5 sm:px-6 py-4 border-b ${
                  isLight ? 'border-blue-100 bg-blue-50/60' : 'border-sky-400/20 bg-[#020819]/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    style={{
                      background: `radial-gradient(circle at 32% 30%, ${selectedPlanetModal.surfacePalette[0]} 0%, ${selectedPlanetModal.surfacePalette[1]} 48%, ${selectedPlanetModal.surfacePalette[2]} 100%)`,
                      boxShadow: `0 0 18px ${selectedPlanetModal.atmosphereColor}`,
                    }}
                    className="w-9 h-9 rounded-full border border-white/40 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold tracking-[0.16em] uppercase px-2 py-0.5 rounded bg-sky-500/15 text-cyan-300 border border-sky-400/30">
                        {selectedPlanetModal.remotionTag}
                      </span>
                      <span className="text-[10px] font-mono tracking-wider text-sky-300/75">
                        ORBIT AZIMUTH {selectedPlanetModal.azimuthDeg}°
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold tracking-[-0.02em] truncate mt-0.5">
                      {selectedPlanetModal.planetName} — {selectedPlanetModal.styleTitle}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  data-testid="planet-modal-close-btn"
                  aria-label="Tutup popup video style Remotion"
                  onClick={() => setSelectedPlanetModal(null)}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    isLight
                      ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                      : 'border-sky-400/30 text-sky-200 hover:bg-sky-400/15 hover:text-white'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body: Live 60 FPS Remotion Style Video Preview Player + TSX Code & Planet Selector */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 sm:p-6">
                {/* Left 7 Cols: Live Multi-Scene Remotion Style Video Player */}
                <div className="lg:col-span-7 flex flex-col gap-3">
                  <div
                    data-testid="planet-modal-video-player-stage"
                    className="relative w-full aspect-video rounded-2xl overflow-hidden border border-sky-400/35 bg-[#020617] shadow-[0_12px_36px_rgba(2,6,23,0.85)]"
                  >
                    <StyleLivePreviewPlayer
                      key={selectedPlanetModal.previewStyleId}
                      style={{ id: selectedPlanetModal.previewStyleId }}
                      ratio="16:9"
                      compact={false}
                      className="w-full h-full"
                    />
                  </div>

                  {/* Quick 360° Galaxy Planet Switcher Strip inside Modal */}
                  <div className="flex flex-col gap-1.5">
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider ${
                        isLight ? 'text-slate-500' : 'text-sky-300/75'
                      }`}
                    >
                      Jelajahi 12 Planet Style Video Remotion di Galaksi 360°:
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {REMOTION_STYLE_PLANETS.map((p) => {
                        const isSelected = p.id === selectedPlanetModal.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            data-testid={`modal-switch-planet-${p.id}`}
                            onClick={() => setSelectedPlanetModal(p)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                              isSelected
                                ? 'bg-sky-500/25 border-cyan-300 text-white shadow-[0_0_14px_rgba(56,189,248,0.35)]'
                                : isLight
                                ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-blue-50'
                                : 'bg-[#071636]/75 border-sky-400/20 text-sky-200/85 hover:border-sky-400/50 hover:text-white'
                            }`}
                          >
                            <span
                              style={{ backgroundColor: p.accentHex }}
                              className="w-2 h-2 rounded-full shrink-0"
                            />
                            <span>{p.planetName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right 5 Cols: Style Description, Live TSX Composition Code & Open in Studio CTA */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-3.5">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-cyan-400 uppercase tracking-wider mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Spesifikasi Planet & Style Remotion</span>
                      </div>
                      <p
                        className={`text-xs sm:text-[13px] leading-relaxed ${
                          isLight ? 'text-slate-600' : 'text-slate-300'
                        }`}
                      >
                        {selectedPlanetModal.description}
                      </p>
                    </div>

                    {/* TSX Code Preview Box */}
                    <div
                      className={`rounded-2xl border p-3.5 font-mono text-[11px] leading-relaxed overflow-x-auto ${
                        isLight
                          ? 'bg-slate-900 border-slate-800 text-sky-200'
                          : 'bg-[#020614] border-sky-400/25 text-sky-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-sky-400/20 text-[10px] text-sky-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Code2 className="w-3.5 h-3.5" />
                          <span>RemotionScene.tsx</span>
                        </span>
                        <span>60 FPS · REACT</span>
                      </div>
                      <pre className="whitespace-pre-wrap break-words text-[10.5px] text-cyan-200/95">
                        {selectedPlanetModal.tsxSnippet}
                      </pre>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
                    <button
                      type="button"
                      data-testid="planet-modal-open-studio-btn"
                      onClick={() => {
                        const targetPlanet = selectedPlanetModal;
                        setSelectedPlanetModal(null);
                        onEnterStudio(
                          defaultSessionUser,
                          targetPlanet ? 'animasi' : 'ide'
                        );
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-200 text-slate-950 text-xs sm:text-sm font-bold shadow-[0_0_24px_rgba(56,189,248,0.45)] hover:shadow-[0_0_34px_rgba(56,189,248,0.75)] transition-all cursor-pointer active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Gunakan Style Ini di Studio</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

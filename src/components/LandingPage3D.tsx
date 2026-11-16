import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronRight,
  Layers,
} from 'lucide-react';
import { authenticateWithGoogle } from '../firebase';
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
  type ChapterZoomMode,
  type BrandIntroState,
  type ParticleObjectKind,
} from '../utils/landing-3d-kinematics';

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
      'Platform produksi berbasis React untuk merancang motion graphics, partikel interaktif, dan video reel 60 FPS secara terprogram.',
    explanationTitle: 'Kamera Sinema 3D & Gelombang Partikel',
    explanationDetail:
      'Saat berhenti, pita reels melambat (slow-mo) dalam sudut Wide Zoom-Out sementara gestur kursor memicu sabit cahaya pada objek kamera 3D di ruang kosong.',
    transitionTag: 'CAMERA CRESCENT IRIS',
    graphicType: 'chart3d',
    ctaLabel: 'Mulai Sekarang',
    secondaryLabel: 'Hubungkan Project',
    stage: 'ide',
    headlineZone: 'mid-left',
    explanationZone: 'bottom-right',
    transitionStyle: 'liquid-tilt-left',
    zoomBadgeLabel: 'SLOW-MO · WIDE ZOOM-OUT · FRAME 01',
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
      'Dari satu topik singkat, sistem merancang hook 3 detik pertama, membagi sekuens reel, dan memetakan objek visual tiap babak.',
    explanationTitle: 'Macro Zoom-In Frame Storyboard',
    explanationDetail:
      'Kamera 3D melakukan Zoom-In mendekati frame karakter & hook di area ruang kosong dengan pemindaian prisma holografik.',
    transitionTag: 'PRISM HOLOGRAM UNFOLD',
    graphicType: 'storyboard',
    ctaLabel: 'Buka Alur Naskah',
    secondaryLabel: 'Lanjut ke Suara ↓',
    stage: 'naskah',
    headlineZone: 'bottom-right',
    explanationZone: 'top-left',
    transitionStyle: 'origami-skew-bottom-right',
    zoomBadgeLabel: 'SLOW-MO · MACRO ZOOM-IN · FRAME 02',
    codePreview: `<Sequence from={0} durationInFrames={90}><HookScene /></Sequence>`,
    metricValue: '4 ADEGAN',
  },
  {
    indexLabel: '03 / 05',
    kicker: 'VOKAL 24KHZ & AUTO LIP-SYNC',
    title: 'Sinkronisasi gelombang suara di tiap frame.',
    titleLead: 'Sinkronisasi Vokal',
    titleHighlight: 'Presisi di Tiap Frame.',
    description:
      'Sintesis vokal karakter 24kHz dengan pemotongan jeda hening otomatis serta ekstraksi amplitudo untuk lip-sync real-time.',
    explanationTitle: 'Canopy Zoom-Out Spektrum 24kHz',
    explanationDetail:
      'Kamera menyapu lengkungan kanopi untuk memperlihatkan gelombang vokal 24kHz dan pusaran partikel akustik di balik reels.',
    transitionTag: 'SONIC SHOCKWAVE MASK',
    graphicType: 'waveform',
    ctaLabel: 'Coba Studio Suara',
    secondaryLabel: 'Lanjut ke Kanvas ↓',
    stage: 'suara',
    headlineZone: 'top-left',
    explanationZone: 'bottom-right',
    transitionStyle: 'sonic-ripple-top-left',
    zoomBadgeLabel: 'SLOW-MO · CANOPY ZOOM-OUT · FRAME 03',
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
      'Setiap frame pada pita reel dianimasikan dengan fisika pegas spring() dan siap diekspor menjadi bundel komponen React murni.',
    explanationTitle: 'Close-Up Zoom-In Kurva Spring 60fps',
    explanationDetail:
      'Fokus kamera melakukan Zoom-In tajam ke frame poligon 3D & kurva bezier spring() di ruang kosong sebelah kiri.',
    transitionTag: 'SPRING HELIX SNAP',
    graphicType: 'spring60fps',
    ctaLabel: 'Buka Kanvas 60fps',
    secondaryLabel: 'Masuk Studio ↓',
    stage: 'animasi',
    headlineZone: 'top-right',
    explanationZone: 'bottom-left',
    transitionStyle: 'frame-flip-top-right',
    zoomBadgeLabel: 'SLOW-MO · MACRO ZOOM-IN · FRAME 04',
    codePreview: `const scale = spring({ fps: 60, frame, config: { damping: 14 } });`,
    metricValue: 'SPRING 60FPS',
  },
];

interface BubbleSpec {
  id: number;
  left: string;
  top: string;
  size: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
  borderRadius: string;
  tint: 'cyan' | 'sky' | 'amber';
  depthLayer: 'behind' | 'front';
}

/**
 * Majority of water bubbles (5 bubbles) sit BEHIND the 3D Film Reels (`z-[2]`, behind the `z-[4]` WebGL canvas)
 * so the 3D reels physically pass in front of them and are never obstructed!
 */
const BACK_REEL_WATER_BUBBLES: BubbleSpec[] = [
  {
    id: 101,
    left: '26%',
    top: '28%',
    size: 68,
    delay: 0.0,
    duration: 7.2,
    driftX: 18,
    driftY: -34,
    borderRadius: '64% 36% 58% 42% / 48% 62% 38% 52%',
    tint: 'cyan',
    depthLayer: 'behind',
  },
  {
    id: 102,
    left: '46%',
    top: '44%',
    size: 86,
    delay: 0.5,
    duration: 8.4,
    driftX: -22,
    driftY: -40,
    borderRadius: '54% 46% 62% 38% / 56% 44% 56% 44%',
    tint: 'sky',
    depthLayer: 'behind',
  },
  {
    id: 103,
    left: '64%',
    top: '34%',
    size: 58,
    delay: 1.1,
    duration: 6.8,
    driftX: 15,
    driftY: -32,
    borderRadius: '58% 42% 48% 52% / 52% 48% 52% 48%',
    tint: 'amber',
    depthLayer: 'behind',
  },
  {
    id: 104,
    left: '36%',
    top: '64%',
    size: 62,
    delay: 0.8,
    duration: 7.6,
    driftX: -16,
    driftY: -36,
    borderRadius: '48% 52% 64% 36% / 58% 42% 58% 42%',
    tint: 'cyan',
    depthLayer: 'behind',
  },
  {
    id: 105,
    left: '74%',
    top: '58%',
    size: 52,
    delay: 1.4,
    duration: 6.5,
    driftX: 14,
    driftY: -30,
    borderRadius: '62% 38% 52% 48% / 46% 58% 42% 54%',
    tint: 'sky',
    depthLayer: 'behind',
  },
];

/**
 * Only 2 small, delicate accent bubbles sit IN FRONT of the 3D Film Reels (`z-[5]`),
 * placed near the outer edges so the reels are never blocked by front bubbles.
 */
const FRONT_REEL_WATER_BUBBLES: BubbleSpec[] = [
  {
    id: 201,
    left: '14%',
    top: '18%',
    size: 22,
    delay: 0.3,
    duration: 5.6,
    driftX: 10,
    driftY: -22,
    borderRadius: '56% 44% 52% 48% / 50% 54% 46% 50%',
    tint: 'cyan',
    depthLayer: 'front',
  },
  {
    id: 202,
    left: '86%',
    top: '74%',
    size: 26,
    delay: 1.0,
    duration: 6.2,
    driftX: -12,
    driftY: -26,
    borderRadius: '50% 50% 58% 42% / 54% 46% 54% 46%',
    tint: 'amber',
    depthLayer: 'front',
  },
];

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
 * Bespoke "Graph Motion" Brand Emblem SVG (`logo dan brand yang sesuai dengan Graph Motion nya`):
 * Combines:
 * 1. Three ascending 3D Isometric Graph Columns on the left ("Graph")
 * 2. A sweeping, perforated 3D Cinema Film Ribbon & Play-Delta Prism looping around them ("Motion")
 * 3. Glowing Bezier Keyframe Diamonds (`◆`) and an orbital 60 FPS optical ring
 */
const GraphMotionLogoMark: React.FC<{
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

const GraphMotionBrandIntroOverlay: React.FC<{
  introState: BrandIntroState;
}> = ({ introState }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const introStateRef = useRef<BrandIntroState>(introState);
  introStateRef.current = introState;

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

    const drawKineticBrandCanvas = () => {
      if (disposed) return;
      const elapsed = (performance.now() - startMs) / 1000;
      const st = introStateRef.current;

      ctx.clearRect(0, 0, width, height);

      if (!st.isActive && st.overlayOpacity <= 0.01) {
        return;
      }

      const dockT = st.dockToHeaderProgress;
      const cx = width * st.brandAnchorXNorm;
      const cy = height * st.brandAnchorYNorm;

      // 1. Radial Iris Stage Backdrop: solid deep sapphire during genesis/convergence,
      // then opens radially from the center outward as the camera shifts and docks the brand to top-left!
      const irisRadius = dockT * Math.hypot(width, height) * 0.85;
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.48,
        Math.max(4, irisRadius * 0.55),
        width * 0.5,
        height * 0.48,
        Math.max(width * 0.75, irisRadius + 360)
      );
      const alphaCore = Math.max(0, 1 - dockT * 1.45) * st.overlayOpacity;
      const alphaEdge = st.overlayOpacity;
      bgGrad.addColorStop(0, `rgba(2, 8, 23, ${alphaCore})`);
      bgGrad.addColorStop(0.55, `rgba(3, 12, 34, ${alphaEdge * 0.92})`);
      bgGrad.addColorStop(1, `rgba(2, 6, 17, ${alphaEdge})`);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Animated 3D Perspective Coordinate Grid & Bezier Motion Splines converging toward the Brand Lockup
      const splineAlpha = Math.max(0, (1 - dockT * 1.15) * st.overlayOpacity);
      if (splineAlpha > 0.02) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Draw 3 sweeping Bezier Motion Graph Ribbons across the stage
        for (let s = 0; s < 3; s++) {
          ctx.beginPath();
          const hue =
            s === 0
              ? `rgba(56, 189, 248, ${0.42 * splineAlpha})`
              : s === 1
              ? `rgba(129, 140, 248, ${0.34 * splineAlpha})`
              : `rgba(251, 191, 36, ${0.28 * splineAlpha})`;
          ctx.strokeStyle = hue;
          ctx.lineWidth = 2.6 - s * 0.5;

          const drawProgress = Math.min(1, elapsed / 1.05);
          const steps = 64;
          const maxStep = Math.max(2, Math.floor(steps * drawProgress));

          for (let i = 0; i <= maxStep; i++) {
            const u = i / steps;
            const spanX = width * 0.72 * (1 - dockT * 0.65);
            const px = cx + (u - 0.5) * spanX;
            const wave =
              Math.sin(u * Math.PI * 3.2 - elapsed * 3.4 + s * 1.1) *
              (68 - s * 14) *
              Math.sin(u * Math.PI) *
              (1 - dockT * 0.75);
            const py = cy + wave + (s - 1) * 16 * (1 - dockT);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }

        // Draw Orbiting Keyframe Diamonds & Light Stream Particles trailing the Brand Lockup
        // as the camera shift carries it toward the Top-Left corner!
        for (let k = 0; k < 18; k++) {
          const ang = (k / 18) * Math.PI * 2 + elapsed * 1.45;
          const rad =
            (92 + (k % 3) * 34) * (1 - dockT * 0.55) * st.brandScale;
          const kx = cx + Math.cos(ang) * rad;
          const ky = cy + Math.sin(ang) * (rad * 0.58);

          ctx.fillStyle =
            k % 3 === 0
              ? `rgba(251, 191, 36, ${0.75 * splineAlpha})`
              : `rgba(56, 189, 248, ${0.68 * splineAlpha})`;
          ctx.beginPath();
          ctx.arc(kx, ky, k % 3 === 0 ? 2.6 : 1.8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      rafId = requestAnimationFrame(drawKineticBrandCanvas);
    };

    rafId = requestAnimationFrame(drawKineticBrandCanvas);
    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  if (
    !introState.isActive &&
    introState.overlayOpacity <= 0.01 &&
    introState.dockToHeaderProgress >= 0.99
  ) {
    return null;
  }

  const stage = introState.morphStage;
  const dockT = introState.dockToHeaderProgress;

  // Compute exact pixel/viewport interpolation from Center Screen (50vw, 46vh)
  // to the Top-Left Header Brand slot (`left: 56px, top: 24px`) so the camera shift
  // smoothly places the Graph Motion brand right into the top-left corner!
  const isDockingComplete = dockT >= 0.98;

  return (
    <div
      data-testid="brand-intro-overlay"
      data-morph-stage={stage}
      data-dock-progress={dockT.toFixed(2)}
      className="fixed inset-0 z-[70] pointer-events-none select-none overflow-hidden"
    >
      {/* 60 FPS Procedural Spline, Isometric Graph & Radial Iris Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 w-full h-full"
      />

      {/* Flying "Graph Motion" Brand Emblem & Wordmark Lockup:
          Starts centered at (50vw, 46vh) and smoothly glides via camera-shift into the Top-Left Corner (`pojok kiri atas`) */}
      <div
        data-testid="brand-intro-flying-lockup"
        style={{
          left: `calc(${(1 - dockT) * 50}vw + ${dockT * 56}px)`,
          top: `calc(${(1 - dockT) * 46}vh + ${dockT * 24}px)`,
          transform: `translate(${(1 - dockT) * -50}%, ${(1 - dockT) * -50}%)`,
          opacity: isDockingComplete ? 0 : 1,
        }}
        className="fixed z-20 flex flex-col items-start justify-center will-change-transform"
      >
        <div className="flex items-center gap-3.5">
          {/* Bespoke Graph Motion Emblem (scales smoothly from 84px hero size -> 36px navbar size) */}
          <div
            style={{
              width: `${84 - dockT * 48}px`,
              height: `${84 - dockT * 48}px`,
            }}
            className="relative flex items-center justify-center shrink-0 drop-shadow-[0_0_28px_rgba(56,189,248,0.65)]"
          >
            <GraphMotionLogoMark className="w-full h-full" animated />
          </div>

          {/* Unified "Graph Motion" Typography Lockup (scales smoothly from 46px hero size -> 23px navbar size) */}
          <div className="flex flex-col">
            <div
              style={{
                fontSize: `${44 - dockT * 21}px`,
              }}
              className="flex items-baseline gap-2 leading-none whitespace-nowrap"
            >
              <span className="font-extrabold tracking-[-0.035em] bg-clip-text text-transparent bg-gradient-to-r from-white via-sky-100 to-cyan-300">
                Graph
              </span>
              <span className="font-light tracking-[-0.015em] bg-clip-text text-transparent bg-gradient-to-r from-sky-300 via-cyan-200 to-indigo-300">
                Motion
              </span>
            </div>

            {/* Glowing Bezier Spline Underline */}
            <div
              style={{
                width: `${100 - dockT * 62}%`,
              }}
              className="mt-1.5 h-[2px] rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300 shadow-[0_0_12px_rgba(56,189,248,0.8)]"
            />
          </div>
        </div>

        {/* Subtitle Telemetry Tag (fades out cleanly as the logo docks into the Top-Left header) */}
        {dockT < 0.75 && (
          <div
            style={{ opacity: Math.max(0, 1 - dockT * 1.45) }}
            className="mt-3 self-center flex items-center gap-2 px-3 py-1 rounded-full border border-sky-400/30 bg-slate-950/70 backdrop-blur-md text-[10px] font-mono tracking-[0.24em] uppercase text-sky-200"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>
              {stage === 'graph-genesis'
                ? 'INITIALIZING 3D SPLINE & GRAPH ENGINE'
                : stage === 'emblem-convergence'
                ? 'PROGRAMMATIC 3D REELS & MOTION GRAPHICS'
                : 'CAMERA SHIFT → BAB 01 STUDIO'}
            </span>
          </div>
        )}
      </div>
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
  introSweepProgressRef: React.MutableRefObject<number>;
  isLight: boolean;
}> = ({ activeChapterIdx, scrollProgressRef, introSweepProgressRef, isLight }) => {
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

    // 1. Initialize 960 Stippled Bioluminescent Particles forming the large Camera / Graphic Object
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
        x: width * 0.49,
        y: height * 0.42,
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
      x: width * 0.49,
      y: height * 0.42,
      vx: 0,
      vy: 0,
      energy: 0.72,
    }));

    let rawPointerX = width * 0.49;
    let rawPointerY = height * 0.42;
    let smoothWakeX = width * 0.49;
    let smoothWakeY = height * 0.42;
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

      // Keep gesture wake & particle objects completely hidden during the pure Brand Intro
      // ("sebelum muncul bab animasi reels, gestur objek, gelembung semuanya")
      if (introSweepProgressRef.current < 0.35) {
        rafId = requestAnimationFrame(renderFrame);
        return;
      }

      // Compute real-time scroll-camera-driven trajectory for Camera (Bab 01) & Graphic (Bab 03)
      const zone = computeScrollCameraObjectState(
        scrollProgressRef.current,
        introSweepProgressRef.current
      );
      const anchorX = width * zone.anchorXNorm;
      const anchorY = height * zone.anchorYNorm;
      const baseScale = Math.min(
        1.24,
        Math.max(0.9, Math.min(width, height) / 690)
      );
      const objScale = baseScale * (zone.scaleMultiplier ?? 1.0);
      const objOpacity = zone.opacity ?? 1.0;
      const tiltRad = zone.perspectiveTiltRad ?? 0;
      const cosTilt = Math.cos(tiltRad);
      const sinTilt = Math.sin(tiltRad);
      const SAFE_RX = 148 * objScale;
      const SAFE_RY = 108 * objScale;

      // Reset local cursor dispersion cleanly when switching between chapter object kinds
      if (prevObjectKind !== zone.kind) {
        prevObjectKind = zone.kind;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          particles[i].dispX = 0;
          particles[i].dispY = 0;
          particles[i].vx = 0;
          particles[i].vy = 0;
          if (zone.visible && zone.kind !== 'none') {
            const pt = computeCameraOrGraphicParticlePoint(
              i,
              PARTICLE_COUNT,
              zone.kind,
              elapsedSec
            );
            const world = computeLockedParticleWorldPosition(
              pt.localX,
              pt.localY,
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

      // Direct Cursor / Finger Touch Tracking:
      // When the user moves or touches the screen, the Crescent Light-Wake follows their exact cursor/finger!
      // When idle (>2.2s without input), it glides in a gentle figure-8 around the active object's moving position.
      let targetWakeX = rawPointerX;
      let targetWakeY = rawPointerY;

      if (timeSinceUserSec > 2.2) {
        const sweepT = elapsedSec * 1.35;
        const idleCenterX = zone.visible ? anchorX : width * 0.52;
        const idleCenterY = zone.visible ? anchorY : height * 0.38;
        targetWakeX = idleCenterX + Math.cos(sweepT) * (SAFE_RX * 0.52);
        targetWakeY = idleCenterY + Math.sin(sweepT * 1.4) * (SAFE_RY * 0.46);
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

      // Shift trail nodes following the cursor/finger wake
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
      // A & B. SCROLL-CAMERA-DRIVEN CAMERA (CH 01) OR GRAPHIC OBJECT (CH 03)
      // =======================================================================
      if (zone.visible && zone.kind !== 'none' && objOpacity > 0.02) {
        ctx.save();
        ctx.globalAlpha = objOpacity;
        ctx.translate(anchorX, anchorY);
        ctx.rotate(tiltRad);
        ctx.scale(objScale, objScale);

        // Ambient radial back-glow behind the Camera / Graphic Object so it stands out boldly
        const backGlow = ctx.createRadialGradient(0, 0, 8, 0, 0, 142);
        backGlow.addColorStop(
          0,
          isLightRef.current
            ? 'rgba(56, 189, 248, 0.16)'
            : 'rgba(56, 189, 248, 0.22)'
        );
        backGlow.addColorStop(
          0.55,
          isLightRef.current
            ? 'rgba(37, 99, 235, 0.08)'
            : 'rgba(99, 102, 241, 0.1)'
        );
        backGlow.addColorStop(1, 'rgba(2, 8, 23, 0)');
        ctx.fillStyle = backGlow;
        ctx.beginPath();
        ctx.arc(0, 0, 142, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isLightRef.current
          ? 'rgba(37, 99, 235, 0.55)'
          : 'rgba(56, 189, 248, 0.55)';
        ctx.lineWidth = 1.65;

        if (zone.kind === 'camera') {
          // 1. Dual 35mm Top Film Reels with rotating spokes
          for (const [cx, cy, r, dir] of [
            [-52, -58, 22, 1],
            [-6, -62, 26, -1],
          ] as const) {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.34, 0, Math.PI * 2);
            ctx.stroke();
            for (let s = 0; s < 3; s++) {
              const ang = elapsedSec * 1.8 * dir + (s * Math.PI * 2) / 3;
              ctx.beginPath();
              ctx.moveTo(
                cx + Math.cos(ang) * (r * 0.34),
                cy + Math.sin(ang) * (r * 0.34)
              );
              ctx.lineTo(
                cx + Math.cos(ang) * (r * 0.92),
                cy + Math.sin(ang) * (r * 0.92)
              );
              ctx.stroke();
            }
          }
          // 2. Camera Chassis Body
          ctx.strokeRect(-72, -34, 114, 70);
          // 3. Central Optical Sensor Ring & Crosshair
          ctx.beginPath();
          ctx.arc(-12, 1, 16, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(-12, 1, 7, 0, Math.PI * 2);
          ctx.stroke();
          // 4. Stepped Telephoto Lens Barrel & Flared Matte Box Hood
          ctx.strokeRect(42, -20, 44, 40);
          ctx.beginPath();
          ctx.moveTo(86, -22);
          ctx.lineTo(120, -38);
          ctx.lineTo(120, 38);
          ctx.lineTo(86, 22);
          ctx.closePath();
          ctx.stroke();
          // 5. Rear-Left Optical Viewfinder
          ctx.beginPath();
          ctx.moveTo(-72, -24);
          ctx.lineTo(-106, -30);
          ctx.lineTo(-106, -16);
          ctx.lineTo(-72, -12);
          ctx.closePath();
          ctx.stroke();
        } else if (zone.kind === 'clapper') {
          // BAB 02: 3D Cinema Clapperboard & Storyboard Timeline Wireframe
          const clapAngle = -0.32 * (0.5 + 0.5 * Math.sin(elapsedSec * 2.6));
          ctx.save();
          ctx.translate(-74, -18);
          ctx.rotate(clapAngle);
          ctx.strokeRect(0, -16, 148, 16);
          for (let s = 18; s < 138; s += 26) {
            ctx.beginPath();
            ctx.moveTo(s, 0);
            ctx.lineTo(s + 10, -16);
            ctx.stroke();
          }
          ctx.restore();

          // Slate Board & Storyboard Frame
          ctx.strokeRect(-74, -14, 148, 70);
          ctx.beginPath();
          ctx.moveTo(-74, 6);
          ctx.lineTo(74, 6);
          ctx.stroke();
          // Play Ring at Center
          ctx.beginPath();
          ctx.arc(0, 28, 18, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-6, 20);
          ctx.lineTo(10, 28);
          ctx.lineTo(-6, 36);
          ctx.closePath();
          ctx.stroke();
        } else if (zone.kind === 'prism') {
          // BAB 04: 3D Geometric Polyhedron & 60 FPS Gyroscope Gimbal Wireframe
          const rot = elapsedSec * 0.85;
          ctx.beginPath();
          for (let s = 0; s < 6; s++) {
            const ang = (s * Math.PI) / 3 + rot;
            const px = Math.cos(ang) * 56;
            const py = Math.sin(ang) * 56;
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();

          for (let s = 0; s < 6; s++) {
            const ang = (s * Math.PI) / 3 + rot;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(ang) * 56, Math.sin(ang) * 56);
            ctx.stroke();
          }
          // Tilted Elliptical Gyro Orbit
          ctx.save();
          ctx.rotate(0.42);
          ctx.beginPath();
          ctx.ellipse(0, 0, 86, 32, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (zone.kind === 'waveform') {
          // BAB 05: 24kHz Acoustic Synthesizer & Portal Constellation Wireframe
          ctx.beginPath();
          ctx.ellipse(0, 0, 76, 62, 0, 0, Math.PI * 2);
          ctx.stroke();
          for (let c = 0; c < 9; c++) {
            const cx = -72 + c * 18;
            const h = 18 + Math.sin(c * 0.9 + elapsedSec * 2.8) * 14 + 18;
            ctx.strokeRect(cx - 4, -h * 0.5, 8, h);
          }
          ctx.beginPath();
          for (let s = 0; s <= 32; s++) {
            const u = s / 32;
            const wx = -88 + u * 176;
            const wy =
              Math.sin(u * Math.PI * 5 - elapsedSec * 3.2) *
              42 *
              Math.sin(u * Math.PI);
            if (s === 0) ctx.moveTo(wx, wy);
            else ctx.lineTo(wx, wy);
          }
          ctx.stroke();
        } else {
          // BAB 03: 3D Isometric Graphic & Spline Wireframe ('graphic')
          // 1. Isometric X/Y Coordinate Axes
          ctx.beginPath();
          ctx.moveTo(-96, -64);
          ctx.lineTo(-96, 48);
          ctx.lineTo(108, 48);
          ctx.stroke();
          // 2. 4 Rising 3D Data Bars
          const barX = [-70, -36, -2, 32];
          const barH = [44, 72, 58, 96];
          for (let b = 0; b < 4; b++) {
            const h = barH[b] + Math.sin(elapsedSec * 2.2 + b * 1.1) * 6;
            ctx.strokeRect(barX[b] - 10, 48 - h, 20, h);
          }
          // 3. Rising Spline Curve & Keyframe Diamonds (1:1 shared formula with particles)
          ctx.beginPath();
          for (let s = 0; s <= 24; s++) {
            const u = s / 24;
            const sp = computeGraphicSplinePoint(u, elapsedSec);
            if (s === 0) ctx.moveTo(sp.x, sp.y);
            else ctx.lineTo(sp.x, sp.y);
          }
          ctx.stroke();
          // 4. Orbital Gauge Ring on Right
          ctx.beginPath();
          ctx.arc(82, -6, 26, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(82, -6, 11, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();

        // Render Stippled Camera / Graphic Particles rigidly locked to the wireframe's camera-shift transform
        // while keeping local cursor-wake vortex dispersion intact (0px separation during scroll transitions!)
        const swipeSpeed = Math.hypot(stepDx, stepDy);
        const isUserRecentlyActive = timeSinceUserSec <= 2.0;
        const maxLocalDisp = (isUserRecentlyActive ? 42 : 14) * objScale;
        const dispersionScale = isUserRecentlyActive ? 1.0 : 0.35;

        ctx.save();
        ctx.globalAlpha = objOpacity;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const p = particles[i];
          const targetPt = computeCameraOrGraphicParticlePoint(
            i,
            PARTICLE_COUNT,
            zone.kind,
            elapsedSec
          );
          const lockedPos = computeLockedParticleWorldPosition(
            targetPt.localX,
            targetPt.localY,
            anchorX,
            anchorY,
            tiltRad,
            objScale,
            0,
            0
          );

          // Elastic spring returning local cursor dispersion (dispX, dispY) smoothly back to (0, 0)
          p.vx += -p.dispX * 0.28;
          p.vy += -p.dispY * 0.28;

          // Direct proximity vortex dispersion when cursor/finger sweeps near the particle's rigid anchor
          const curX = lockedPos.x + p.dispX;
          const curY = lockedPos.y + p.dispY;
          const dx = curX - smoothWakeX;
          const dy = curY - smoothWakeY;
          const distSq = dx * dx + dy * dy;
          const wakeRad = 72 * objScale * (0.75 + wakeEnergy * 0.4);

          if (distSq < wakeRad * wakeRad && objOpacity > 0.35) {
            const dist = Math.max(1, Math.sqrt(distSq));
            const falloff = 1 - dist / wakeRad;
            const swirlForce =
              falloff * falloff * (1.2 + wakeEnergy * 1.9) * dispersionScale;
            const tangX = -dy / dist;
            const tangY = dx / dist;
            const radX = dx / dist;
            const radY = dy / dist;
            p.vx += (tangX * 0.65 + radX * 0.45) * swirlForce;
            p.vy += (tangY * 0.65 + radY * 0.45) * swirlForce;
            p.heat = Math.min(1, p.heat + falloff * 0.55);
          } else if (swipeSpeed > 2.2 && isUserRecentlyActive && objOpacity > 0.35) {
            p.vx += Math.cos(swipeAngleRad + i) * 0.12;
            p.vy += Math.sin(swipeAngleRad + i) * 0.12;
            p.heat = Math.min(1, p.heat + 0.06);
          } else {
            p.heat *= 0.9;
          }

          p.vx *= 0.72;
          p.vy *= 0.72;
          p.dispX += p.vx;
          p.dispY += p.vy;

          // Dampen dispersion cleanly during camera-shift fades and cap to compact local radius
          if (objOpacity < 0.85) {
            p.dispX *= objOpacity;
            p.dispY *= objOpacity;
          }
          const dispMag = Math.hypot(p.dispX, p.dispY);
          if (dispMag > maxLocalDisp && dispMag > 0.001) {
            const s = maxLocalDisp / dispMag;
            p.dispX *= s;
            p.dispY *= s;
          }

          p.x = lockedPos.x + p.dispX;
          p.y = lockedPos.y + p.dispY;

          const isCore = targetPt.partRole === 'core';
          const r =
            (isCore ? 1.55 : 1.05 + (i % 3) * 0.22) *
            (1 + p.heat * 0.45) *
            Math.min(1.15, objScale * 0.92);

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

        // Sculpted Crescent Bow Wave Arc at the leading edge of cursor / finger touch
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

        // Smooth Comet Spine connecting the cursor/finger trail points
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
      className="fixed inset-0 z-[6] h-screen w-screen pointer-events-none opacity-100"
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
        {/* Stage 1: Bioluminescent Morpho Iris Glow contained cleanly inside the pod corner */}
        <motion.div
          data-testid="giant-bubble-transition-carrier"
          aria-hidden="true"
          initial={{ opacity: 0.9, scale: 0.45, rotate: -18 }}
          animate={{
            opacity: [0.9, 0.68, 0.28],
            scale: [0.45, 1.12, 1.0],
            rotate: [-18, 6, 0],
          }}
          transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
          style={{
            borderRadius: '62% 38% 54% 46% / 48% 60% 40% 52%',
            background: isLight
              ? 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.95) 0%, rgba(56,189,248,0.34) 42%, rgba(99,102,241,0.12) 72%, rgba(56,189,248,0.4) 100%)'
              : 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.88) 0%, rgba(56,189,248,0.38) 38%, rgba(99,102,241,0.18) 70%, rgba(125,211,252,0.45) 100%)',
            boxShadow:
              'inset 2px 3px 12px rgba(255,255,255,0.75), 0 0 28px rgba(56,189,248,0.3)',
          }}
          className="pointer-events-none absolute left-2 top-2 w-20 h-20 border border-sky-200/45"
        >
          <span className="absolute top-[20%] left-[24%] w-5 h-2.5 rounded-full bg-white/85 -rotate-25" />
        </motion.div>

        {/* Stage 2: Diagonal Iridescent Light-Sheen Sweep across the card */}
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
  const scrollProgressRef = useRef<number>(0);
  const introSweepProgressRef = useRef<number>(0);
  const isIntroSkippedRef = useRef<boolean>(false);
  const introResetTimeMsRef = useRef<number>(performance.now());
  const lastBrandIntroKeyRef = useRef<string>('');
  const [brandIntro, setBrandIntro] = useState<BrandIntroState>(() =>
    computeBrandIntroState(0, false)
  );

  useEffect(() => {
    introResetTimeMsRef.current = performance.now();
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
      const elapsedIntroSec =
        (nowMs - introResetTimeMsRef.current) / 1000;
      const nextState = computeBrandIntroState(
        elapsedIntroSec,
        isIntroSkippedRef.current
      );
      introSweepProgressRef.current = nextState.cameraSweepProgress;
      const nextBrandKey = `${nextState.isActive ? 1 : 0}|${nextState.dockToHeaderProgress.toFixed(3)}|${nextState.bab01UiReveal.toFixed(3)}|${nextState.reelsStageReveal.toFixed(3)}|${nextState.overlayOpacity.toFixed(3)}|${nextState.brandScale.toFixed(3)}`;
      if (nextBrandKey !== lastBrandIntroKeyRef.current) {
        lastBrandIntroKeyRef.current = nextBrandKey;
        setBrandIntro(nextState);
      }

      rafId = requestAnimationFrame(updateIntroLoop);
    };

    (
      window as unknown as {
        __replayGraphMotionIntro?: (startOffsetSec?: number) => void;
      }
    ).__replayGraphMotionIntro = (startOffsetSec = 0) => {
      isIntroSkippedRef.current = false;
      introResetTimeMsRef.current =
        performance.now() - startOffsetSec * 1000;
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

      const introElapsedSec =
        (performance.now() - introResetTimeMsRef.current) / 1000;
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
      // so the camera swoops from its deep zenith orbital intro angle smoothly into Bab 01!
      const targetCamX = choreo.camPosX + introState.introCamOffset.dPosX;
      const targetCamY = choreo.camPosY + introState.introCamOffset.dPosY;
      const targetCamZ =
        choreo.camPosZ +
        slowMo.slowMoDollyOffsetZ +
        introState.introCamOffset.dPosZ;
      const targetLookX = choreo.lookAtX + introState.introCamOffset.dLookX;
      const targetLookY = choreo.lookAtY + introState.introCamOffset.dLookY;
      const targetRollZ = choreo.camRollZ + introState.introCamOffset.dRollZ;
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

  const renderBubbleItem = (b: BubbleSpec) => {
    const isBehind = b.depthLayer === 'behind';
    const bubbleBg =
      b.tint === 'amber'
        ? 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.8) 0%, rgba(251,191,36,0.22) 36%, rgba(56,189,248,0.05) 72%, rgba(251,191,36,0.38) 100%)'
        : b.tint === 'cyan'
        ? 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.84) 0%, rgba(56,189,248,0.26) 38%, rgba(14,165,233,0.05) 72%, rgba(125,211,252,0.44) 100%)'
        : 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.82) 0%, rgba(125,211,252,0.24) 38%, rgba(37,99,235,0.05) 72%, rgba(186,230,253,0.42) 100%)';

    return (
      <motion.div
        key={b.id}
        data-depth-layer={b.depthLayer}
        initial={false}
        animate={{
          opacity: isBehind ? [0.28, 0.62, 0.34] : [0.24, 0.52, 0.28],
          scale: [0.9, 1.08, 0.94],
          x: [0, b.driftX, -b.driftX * 0.5],
          y: [0, b.driftY, b.driftY * 0.4],
        }}
        transition={{
          duration: b.duration,
          delay: b.delay * 0.2,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        }}
        style={{
          left: b.left,
          top: b.top,
          width: b.size,
          height: b.size,
          borderRadius: b.borderRadius,
          background: bubbleBg,
          boxShadow: isLight
            ? 'inset 2px 3px 8px rgba(255,255,255,0.9), 0 6px 18px rgba(56,189,248,0.16)'
            : 'inset 2px 3px 10px rgba(255,255,255,0.65), 0 0 22px rgba(56,189,248,0.2)',
        }}
        className="absolute border border-sky-200/35"
      >
        <span className="absolute top-[18%] left-[22%] w-[24%] h-[16%] rounded-full bg-white/80 -rotate-25" />
      </motion.div>
    );
  };

  return (
    <div
      className={`relative min-h-screen w-full overflow-x-hidden transition-colors duration-500 ${
        isLight ? 'bg-[#eef6ff] text-slate-950' : 'bg-[#020817] text-[#f8fafc]'
      }`}
    >
      {/* Subtle Coordinate Grid & Corner Contrast Vignette (z-[1], behind everything) */}
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
             Plays for the first ~3.2s on initial load before revealing the reels,
             bubbles, gesture objects, and Bab 01 UI via a smooth 3D camera redirection!
      ===================================================================== */}
      <GraphMotionBrandIntroOverlay introState={brandIntro} />

      {/* =====================================================================
          1. BACKGROUND WATER BUBBLE LAYER (`z-[2]` — BEHIND THE 3D FILM REELS!)
             Held back during the initial Brand Intro and unveiled smoothly as the
             3D camera redirects into Bab 01.
      ===================================================================== */}
      <div
        data-testid="water-bubble-back-layer"
        aria-hidden="true"
        style={{ opacity: brandIntro.bab01UiReveal }}
        className="fixed inset-0 z-[2] pointer-events-none overflow-hidden transition-opacity duration-300"
      >
        {BACK_REEL_WATER_BUBBLES.map(renderBubbleItem)}
      </div>

      {/* =====================================================================
          2. FIXED FULL-VIEWPORT THREE.JS 3D FULL-BLEED FILM REEL STAGE (`z-[4]`)
             Held at opacity 0 during the pure Brand Intro and unveiled smoothly
             as the 3D camera redirects into Bab 01!
      ===================================================================== */}
      <div
        ref={mountRef}
        data-testid="three-canvas-stage"
        style={{ opacity: brandIntro.reelsStageReveal }}
        className="fixed inset-0 z-[4] h-screen w-screen overflow-hidden transition-opacity duration-200"
      />

      {/* =====================================================================
          3. SPARSE FOREGROUND WATER BUBBLE ACCENT LAYER (`z-[5]` — IN FRONT OF REELS)
      ===================================================================== */}
      <div
        data-testid="water-bubble-splash-layer"
        aria-hidden="true"
        style={{ opacity: brandIntro.bab01UiReveal }}
        className="fixed inset-0 z-[5] pointer-events-none overflow-hidden transition-opacity duration-300"
      >
        {FRONT_REEL_WATER_BUBBLES.map(renderBubbleItem)}
      </div>

      {/* =====================================================================
          4. INTERACTIVE MORPHO CRESCENT LIGHT-WAKE & SCROLL-CAMERA PARTICLE OBJECTS (`z-[6]`)
      ===================================================================== */}
      <InteractiveMorphoParticleWakeCanvas
        activeChapterIdx={activeChapterIdx}
        scrollProgressRef={scrollProgressRef}
        introSweepProgressRef={introSweepProgressRef}
        isLight={isLight}
      />

      {/* =====================================================================
          MINIMALIST TOP BAR: BRAND MARK ONLY (CTA & AUTH ONLY IN CHAPTER PANELS)
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
            className="relative inline-flex items-center gap-2.5 sm:gap-3 text-left whitespace-nowrap shrink-0 transition-opacity duration-150"
          >
            <GraphMotionLogoMark className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 drop-shadow-[0_0_16px_rgba(56,189,248,0.5)]" />
            <span className="relative inline-flex items-baseline gap-1.5">
              <span
                className={`text-lg sm:text-[23px] font-extrabold tracking-[-0.035em] bg-clip-text text-transparent bg-gradient-to-r ${
                  isLight
                    ? 'from-slate-950 via-blue-800 to-blue-600'
                    : 'from-white via-sky-100 to-sky-300'
                }`}
              >
                Graph
              </span>
              <span
                className={`text-lg sm:text-[23px] font-light tracking-[-0.015em] bg-clip-text text-transparent bg-gradient-to-r ${
                  isLight
                    ? 'from-blue-600 via-sky-500 to-indigo-500'
                    : 'from-sky-300 via-cyan-200 to-indigo-300'
                }`}
              >
                Motion
              </span>
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-0 h-[1.5px] w-9 bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300 rounded-full opacity-85"
              />
            </span>
          </div>

          {signedInUser && (
            <div className="pointer-events-auto flex items-center justify-end min-w-0">
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
            </div>
          )}
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
                          ? 'Geser kursor / sentuh layar untuk interaksi partikel Kamera Sinema 3D'
                          : activeChapterIdx === 1
                          ? 'Geser kursor / sentuh layar untuk interaksi partikel Papan Klaper & Storyboard 3D'
                          : activeChapterIdx === 2
                          ? 'Geser kursor / sentuh layar untuk interaksi partikel Grafik Isometrik & Spline 3D'
                          : 'Geser kursor / sentuh layar untuk interaksi partikel Prisma Poligon & Gyro 60FPS'}
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
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import { AspectRatio, StoryboardChapter, UiLanguage } from '../types';
import { calculateChapterAtTime, getEase } from '../utils/motion-timeline';

interface MotionCanvasProps {
  chapters: StoryboardChapter[];
  currentTimeMs: number;
  totalDurationMs: number;
  aspectRatio: AspectRatio;
  language: UiLanguage;
  isPlaying: boolean;
  onCanvasRef?: (canvas: HTMLCanvasElement | null) => void;
}

const deterministicHash = (seed: number): number => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
};

export function renderStoryboardFrameToCanvas(
  ctx: CanvasRenderingContext2D,
  chapters: StoryboardChapter[],
  currentTimeMs: number,
  width: number,
  height: number,
  language: UiLanguage
) {
  const { index, localTimeMs, progress } = calculateChapterAtTime(currentTimeMs, chapters);
  const activeChapter = chapters[index] || chapters[0];

  // Clear frame
  ctx.save();
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, width, height);

  if (!activeChapter) {
    ctx.restore();
    return;
  }

  const {
    motionGraphicType = 'glitch-terminal-decrypt',
    accentColor = '#38bdf8',
    secondaryColor = '#f43f5e',
    transitionType = 'zoomPunch',
    durationMs = 4000,
  } = activeChapter;

  const chapterDurationSec = durationMs / 1000;
  const localSec = localTimeMs / 1000;

  // Apply Transition Effects (first 0.45s of chapter with MotionMaxxing snapSettle)
  const transitionWindow = 450; // ms
  const transProgress = Math.min(1, localTimeMs / transitionWindow);
  const easeTrans =
    transProgress <= 0
      ? 0
      : transProgress >= 1
      ? 1
      : transProgress < 0.24
      ? (transProgress / 0.24) * 0.58
      : 0.58 + (1 - Math.pow(1 - (transProgress - 0.24) / 0.76, 3.2)) * 0.42;

  ctx.save();
  if (transitionType === 'zoomPunch' && transProgress < 1) {
    const scale = 1.25 - 0.25 * easeTrans;
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2);
  } else if (transitionType === 'whipPan' && transProgress < 1) {
    const offsetX = (1 - easeTrans) * width * 0.8;
    ctx.translate(offsetX, 0);
  } else if (transitionType === 'crossfade' && transProgress < 1) {
    ctx.globalAlpha = easeTrans;
  } else if (transitionType === 'iris' && transProgress < 1) {
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, easeTrans * Math.max(width, height) * 0.75, 0, Math.PI * 2);
    ctx.clip();
  }

  // Background Subtle Ambient Glow Grid
  drawAmbientGrid(ctx, width, height, accentColor, localSec);

  // Render Procedural Motion Graphic Archetype
  renderArchetype(ctx, width, height, motionGraphicType, accentColor, secondaryColor, localSec, chapterDurationSec, progress, activeChapter, language);

  // Apply Glitch transition post-processing if transitionType is glitch and in transition window
  if (transitionType === 'glitch' && transProgress < 1) {
    applyGlitchSlices(ctx, width, height, 1 - transProgress, localSec);
  }

  // Apply Light Flash
  if (transitionType === 'lightFlash' && transProgress < 1) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * (1 - easeTrans)})`;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();

  // Foreground Cinematic HUD & Subtitle Overlay
  drawCinematicHUD(ctx, width, height, activeChapter, currentTimeMs, progress, language);

  ctx.restore();
}

export const MotionCanvas: React.FC<MotionCanvasProps> = ({
  chapters,
  currentTimeMs,
  aspectRatio,
  language,
  isPlaying,
  onCanvasRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onCanvasRefLatest = useRef(onCanvasRef);
  onCanvasRefLatest.current = onCanvasRef;

  // Aspect ratio canvas dimensions
  const getDimensions = (): { width: number; height: number } => {
    switch (aspectRatio) {
      case '9:16':
        return { width: 540, height: 960 };
      case '1:1':
        return { width: 720, height: 720 };
      case '4:5':
        return { width: 640, height: 800 };
      case '16:9':
      default:
        return { width: 960, height: 540 };
    }
  };

  const { width, height } = getDimensions();

  useEffect(() => {
    if (onCanvasRefLatest.current && canvasRef.current) {
      onCanvasRefLatest.current(canvasRef.current);
    }
  }, []);

  // Main 60fps or frame-by-frame procedural render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }) || canvas.getContext('2d');
    if (!ctx) return;

    renderStoryboardFrameToCanvas(ctx, chapters, currentTimeMs, width, height, language);
  }, [currentTimeMs, chapters, width, height, language, isPlaying]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-zinc-950 overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        data-testid="motion-stage-canvas"
        className="max-h-full max-w-full object-contain rounded-lg shadow-2xl border border-zinc-800"
      />
    </div>
  );
};

// ==========================================
// PROCEDURAL ARCHETYPE RENDERERS
// ==========================================

function renderArchetype(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  type: string,
  accent: string,
  secondary: string,
  time: number,
  _duration: number,
  progress: number,
  chapter: StoryboardChapter,
  language: UiLanguage
) {
  const cx = w / 2;
  const cy = h / 2;

  switch (type) {
    case 'boxed-word-relay': {
      // High-impact words encased in animated bounding boxes
      const wordsEn = ['REASONING', 'SYNTHESIS', 'ACCELERATE', 'KITEVA'];
      const wordsZh = ['深度推理', '全维合成', '动能跃迁', '智构视界'];
      const words = language === 'zh' ? wordsZh : wordsEn;

      const activeWordIndex = Math.min(words.length - 1, Math.floor(progress * words.length));
      const wordProgress = (progress * words.length) % 1;
      const easeWord = getEase('easeOutQuad', wordProgress);

      ctx.save();
      ctx.translate(cx, cy);

      // Staggered previous words as faint echoes
      words.forEach((word, idx) => {
        const yOffset = (idx - activeWordIndex) * 72;
        const isActive = idx === activeWordIndex;
        const alpha = isActive ? 1 : Math.max(0.1, 0.45 - Math.abs(idx - activeWordIndex) * 0.25);

        ctx.font = '900 48px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const textWidth = ctx.measureText(word).width;

        if (isActive) {
          // Bounding Box with animated corner brackets
          const boxPadX = 28 + (1 - easeWord) * 40;
          const boxPadY = 16;
          const bw = textWidth + boxPadX * 2;
          const bh = 56 + boxPadY * 2;

          ctx.strokeStyle = accent;
          ctx.lineWidth = 3;
          ctx.strokeRect(-bw / 2, yOffset - bh / 2, bw, bh);

          // Glowing fill
          ctx.fillStyle = `${accent}18`;
          ctx.fillRect(-bw / 2, yOffset - bh / 2, bw, bh);

          // Accent corner ticks
          ctx.fillStyle = secondary;
          const tickSize = 10;
          ctx.fillRect(-bw / 2 - 2, yOffset - bh / 2 - 2, tickSize, 4);
          ctx.fillRect(-bw / 2 - 2, yOffset - bh / 2 - 2, 4, tickSize);
          ctx.fillRect(bw / 2 + 2 - tickSize, yOffset + bh / 2 - 2, tickSize, 4);
          ctx.fillRect(bw / 2 - 2, yOffset + bh / 2 - 2 - tickSize, 4, tickSize);

          // Laser Cursor Trail
          const cursorX = -bw / 2 + bw * easeWord;
          ctx.strokeStyle = secondary;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(cursorX, yOffset - bh / 2 - 6);
          ctx.lineTo(cursorX, yOffset + bh / 2 + 6);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        }

        ctx.fillText(word, 0, yOffset);
      });

      ctx.restore();
      break;
    }

    case 'split-flap-counter': {
      // Mechanical Airport departure board flip effect
      const chars = (language === 'zh' ? '量子超算·智构矩阵·1024' : 'KITEVA // PROTOCOL: 99.9%').split('');
      const charWidth = 32;
      const totalW = chars.length * charWidth;
      const startX = cx - totalW / 2;

      ctx.save();
      ctx.translate(startX, cy);

      chars.forEach((ch, idx) => {
        const x = idx * charWidth;
        const flipDelay = idx * 0.08;
        const localCharProgress = Math.max(0, Math.min(1, (progress - flipDelay) * 3));
        const flipAngle = localCharProgress * Math.PI;

        // Flap Background container
        ctx.fillStyle = '#18181b';
        ctx.fillRect(x + 2, -36, charWidth - 4, 72);
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2, -36, charWidth - 4, 72);

        // Center split divider
        ctx.strokeStyle = '#09090b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 2, 0);
        ctx.lineTo(x + charWidth - 2, 0);
        ctx.stroke();

        // Animated letter
        ctx.font = 'bold 30px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = localCharProgress < 1 && idx % 2 === 0 ? accent : '#f8fafc';

        // Flipping tile illusion
        ctx.save();
        ctx.translate(x + charWidth / 2, 0);
        if (localCharProgress < 0.5) {
          ctx.scale(1, Math.cos(flipAngle));
        }
        ctx.fillText(ch, 0, 0);
        ctx.restore();
      });

      ctx.restore();
      break;
    }

    case 'glitch-terminal-decrypt': {
      // Hex Matrix and Decrypting Terminal
      const title = chapter.title.toUpperCase();
      const decryptChars = '0123456789ABCDEF!@#$%&*';
      const revealCount = Math.floor(progress * title.length);

      let displayed = '';
      const timeStep = Math.floor(time * 18);
      for (let i = 0; i < title.length; i++) {
        if (i <= revealCount) {
          displayed += title[i];
        } else {
          const rand = decryptChars[Math.floor(deterministicHash(timeStep * 31 + i * 17) * decryptChars.length)];
          displayed += rand;
        }
      }

      ctx.save();
      ctx.translate(cx, cy);

      // Terminal Box Frame
      const boxW = Math.min(w - 80, 680);
      const boxH = 220;
      ctx.strokeStyle = `${accent}88`;
      ctx.lineWidth = 2;
      ctx.strokeRect(-boxW / 2, -boxH / 2, boxW, boxH);

      // Header Bar
      ctx.fillStyle = `${accent}22`;
      ctx.fillRect(-boxW / 2, -boxH / 2, boxW, 36);
      ctx.fillStyle = accent;
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`TERMINAL://AUTH_DECRYPT [T+${(time).toFixed(2)}s]`, -boxW / 2 + 16, -boxH / 2 + 22);

      // Decrypted Text
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(displayed, 0, 10);

      // Binary Waterfalls in background of box
      ctx.font = '10px monospace';
      ctx.fillStyle = `${accent}33`;
      for (let col = -boxW / 2 + 20; col < boxW / 2 - 20; col += 60) {
        const binVal = Math.sin(col + time * 10).toString(2).slice(2, 8);
        ctx.fillText(binVal, col, 70);
      }

      ctx.restore();
      break;
    }

    case 'orbital-wireframe-gyro': {
      // 3D Gimbal Wireframe Rings
      ctx.save();
      ctx.translate(cx, cy);

      const ringCount = 4;
      const baseRadius = Math.min(w, h) * 0.28;

      for (let i = 0; i < ringCount; i++) {
        const r = baseRadius * (1 - i * 0.2);
        const rotX = time * (0.8 + i * 0.3);
        const rotY = time * (1.1 - i * 0.2);

        ctx.save();
        ctx.scale(Math.cos(rotX), Math.sin(rotY) * 0.6 + 0.4);
        ctx.rotate(time * 0.5 + (i * Math.PI) / ringCount);

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = i % 2 === 0 ? accent : secondary;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Nodes on ring perimeter
        const nodeCount = 6;
        for (let n = 0; n < nodeCount; n++) {
          const angle = (n * Math.PI * 2) / nodeCount + time * 0.6;
          const nx = Math.cos(angle) * r;
          const ny = Math.sin(angle) * r;

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // Center Core Pulsing Singularity
      const coreR = 18 + Math.sin(time * 6) * 5;
      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, coreR * 2);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, accent);
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, coreR * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      break;
    }

    case 'cyber-horizon-grid': {
      // Perspective Retro Synthwave Grid & Sun
      ctx.save();

      // Burning Retro Sun
      const sunY = cy - 20;
      const sunR = Math.min(w, h) * 0.22;
      const sunGrad = ctx.createLinearGradient(cx, sunY - sunR, cx, sunY + sunR);
      sunGrad.addColorStop(0, '#fbbf24');
      sunGrad.addColorStop(0.6, '#f43f5e');
      sunGrad.addColorStop(1, '#7c3aed');

      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(cx, sunY, sunR, 0, Math.PI, true);
      ctx.fill();

      // Sun Blinds / Horizontal Bars
      ctx.fillStyle = '#090d16';
      for (let b = 0; b < 7; b++) {
        const barY = sunY - sunR * 0.6 + b * 14;
        ctx.fillRect(cx - sunR, barY, sunR * 2, 4 + b * 1.5);
      }

      // Horizon line
      ctx.strokeStyle = secondary;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.stroke();

      // Undulating Perspective Grid Ground
      ctx.strokeStyle = `${accent}bb`;
      ctx.lineWidth = 1.5;

      // Perspective Rays
      const rayCount = 20;
      for (let r = 0; r <= rayCount; r++) {
        const bottomX = (r / rayCount) * w * 2 - w * 0.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(bottomX, h);
        ctx.stroke();
      }

      // Moving Horizontal Distance Bars
      const speed = (time * 120) % 40;
      for (let y = cy + 2; y < h; y += 8 + (y - cy) * 0.35) {
        const movingY = y + (speed * (y - cy)) / (h - cy);
        if (movingY < h) {
          ctx.beginPath();
          ctx.moveTo(0, movingY);
          ctx.lineTo(w, movingY);
          ctx.stroke();
        }
      }

      ctx.restore();
      break;
    }

    case 'quantum-torus-knot': {
      // Parametric 3D Torus Curve
      ctx.save();
      ctx.translate(cx, cy);

      const p = 3;
      const q = 5;
      const scale = Math.min(w, h) * 0.22;
      const points = 240;

      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const phi = (i / points) * Math.PI * 2;
        const r = 0.5 * (2 + Math.sin(q * phi + time * 1.5));
        const px = r * Math.cos(p * phi + time * 0.8) * scale;
        const py = r * Math.sin(p * phi + time * 0.8) * scale;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }

      ctx.strokeStyle = accent;
      ctx.lineWidth = 4;
      ctx.shadowColor = secondary;
      ctx.shadowBlur = 15;
      ctx.stroke();

      ctx.restore();
      break;
    }

    case 'circular-radar-pulse': {
      // Multi-layer Radar Targeting Dial
      ctx.save();
      ctx.translate(cx, cy);

      const radarR = Math.min(w, h) * 0.3;

      // Outer Ticks Ring
      ctx.strokeStyle = `${accent}66`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, radarR, 0, Math.PI * 2);
      ctx.stroke();

      // Angle Ticks
      for (let a = 0; a < 360; a += 15) {
        const rad = (a * Math.PI) / 180;
        const tickLen = a % 45 === 0 ? 12 : 6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(rad) * (radarR - tickLen), Math.sin(rad) * (radarR - tickLen));
        ctx.lineTo(Math.cos(rad) * radarR, Math.sin(rad) * radarR);
        ctx.stroke();
      }

      // Concentric Internal Rings
      [0.35, 0.65].forEach((frac) => {
        ctx.beginPath();
        ctx.arc(0, 0, radarR * frac, 0, Math.PI * 2);
        ctx.strokeStyle = `${accent}33`;
        ctx.stroke();
      });

      // Rotating Sweep Beam
      const sweepAngle = time * 2.5;
      const sweepGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, radarR);
      sweepGrad.addColorStop(0, `${accent}bb`);
      sweepGrad.addColorStop(1, 'transparent');

      ctx.save();
      ctx.rotate(sweepAngle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radarR, 0, Math.PI * 0.28);
      ctx.closePath();
      ctx.fillStyle = sweepGrad;
      ctx.fill();

      // Lead line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(radarR, 0);
      ctx.stroke();
      ctx.restore();

      // Target Blips
      const targets = [
        { angle: 0.8, dist: 0.55 },
        { angle: 2.2, dist: 0.75 },
        { angle: 4.1, dist: 0.4 },
      ];
      targets.forEach((t) => {
        const bx = Math.cos(t.angle) * radarR * t.dist;
        const by = Math.sin(t.angle) * radarR * t.dist;
        ctx.fillStyle = secondary;
        ctx.beginPath();
        ctx.arc(bx, by, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = secondary;
        ctx.strokeRect(bx - 10, by - 10, 20, 20);
      });

      ctx.restore();
      break;
    }

    case 'quantum-candlestick-surge': {
      // Fintech High-frequency Trading Candles & Exponential Curve
      ctx.save();
      ctx.translate(cx - 240, cy);

      const candleCount = 18;
      const candleW = 16;
      const gap = 12;

      for (let i = 0; i < candleCount; i++) {
        const x = i * (candleW + gap);
        const candleProgress = Math.sin(time * 3 + i * 0.4);
        const isGreen = candleProgress > -0.1;
        const candleH = 25 + Math.abs(candleProgress) * 70;
        const wickH = candleH + 30;

        ctx.strokeStyle = isGreen ? '#10b981' : '#ef4444';
        ctx.lineWidth = 2;
        // Wick
        ctx.beginPath();
        ctx.moveTo(x + candleW / 2, -wickH / 2);
        ctx.lineTo(x + candleW / 2, wickH / 2);
        ctx.stroke();

        // Body
        ctx.fillStyle = isGreen ? '#10b981' : '#ef4444';
        ctx.fillRect(x, -candleH / 2, candleW, candleH);
      }

      // Moving Exponential Surge Line
      ctx.strokeStyle = accent;
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let i = 0; i < candleCount; i++) {
        const x = i * (candleW + gap) + candleW / 2;
        const y = -Math.pow(i / candleCount, 2) * 120 + Math.sin(time * 4 + i) * 15;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.restore();
      break;
    }

    default: {
      // Default Modern Geometric Morph & Kinetic Pulse
      ctx.save();
      ctx.translate(cx, cy);

      const pulse = Math.sin(time * 4) * 0.15 + 1;
      const rot = time * 0.6;

      ctx.rotate(rot);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.strokeRect(-90 * pulse, -90 * pulse, 180 * pulse, 180 * pulse);

      ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = secondary;
      ctx.strokeRect(-70 * pulse, -70 * pulse, 140 * pulse, 140 * pulse);

      ctx.restore();
      break;
    }
  }
}

function drawAmbientGrid(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string, time: number) {
  ctx.save();
  ctx.strokeStyle = `${accent}14`;
  ctx.lineWidth = 1;
  const gridSize = 48;

  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Floating ambient micro particles
  ctx.fillStyle = `${accent}66`;
  for (let p = 0; p < 24; p++) {
    const px = (p * 83 + time * 15) % w;
    const py = (p * 47 + Math.sin(time + p) * 30 + 100) % h;
    ctx.beginPath();
    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function applyGlitchSlices(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number, timeSec = 0) {
  const slices = Math.floor(intensity * 12);
  const quantTime = Math.floor(timeSec * 24);
  for (let s = 0; s < slices; s++) {
    const h1 = deterministicHash(quantTime * 43 + s * 13);
    const h2 = deterministicHash(quantTime * 67 + s * 29);
    const h3 = deterministicHash(quantTime * 89 + s * 41);
    const sliceY = Math.max(0, Math.min(h - 24, Math.floor(h1 * h)));
    const sliceH = Math.max(6, Math.floor(8 + h2 * 24));
    const shiftX = Math.round((h3 - 0.5) * 60 * intensity);

    try {
      const imgData = ctx.getImageData(0, sliceY, w, sliceH);
      ctx.putImageData(imgData, shiftX, sliceY);
    } catch {
      // Ignore boundary issues
    }
  }
}

function drawCinematicHUD(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  chapter: StoryboardChapter,
  currentTimeMs: number,
  chapterProgress: number,
  language: UiLanguage
) {
  ctx.save();

  // Top Left: Chapter Meta Ticker
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 12px monospace';
  ctx.textAlign = 'left';
  const displayTitle = language === 'zh' && chapter.titleZh ? chapter.titleZh : chapter.title;
  ctx.fillText(`KITEVA // ${displayTitle.toUpperCase()}`, 24, 32);

  // Top Right: Live Timecode and Framerate badge
  const sec = (currentTimeMs / 1000).toFixed(2);
  ctx.textAlign = 'right';
  ctx.fillText(`60.0 FPS · REC [${sec}s]`, w - 24, 32);

  // Bottom Center: Synchronized Lower-Third Subtitle & Script Callout
  const scriptText = language === 'zh' && chapter.scriptZh ? chapter.scriptZh : chapter.script;
  if (scriptText) {
    const bannerW = Math.min(w - 64, 760);
    const bannerH = 46;
    const bannerX = (w - bannerW) / 2;
    const bannerY = h - 68;

    // Semi-translucent dark glass backdrop
    ctx.fillStyle = 'rgba(9, 13, 22, 0.82)';
    ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);

    // Accent line on bottom of banner
    ctx.fillStyle = chapter.accentColor || '#38bdf8';
    ctx.fillRect(bannerX, bannerY + bannerH - 3, bannerW * chapterProgress, 3);

    // Subtitle text with typewriter reveal or clean fade
    ctx.fillStyle = '#f8fafc';
    ctx.font = '500 15px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(scriptText, w / 2, bannerY + bannerH / 2 - 1);
  }

  // Four corner viewport crop markers
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.5;
  const markerLen = 14;

  // Top-left
  ctx.beginPath();
  ctx.moveTo(16, 16 + markerLen);
  ctx.lineTo(16, 16);
  ctx.lineTo(16 + markerLen, 16);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(w - 16 - markerLen, 16);
  ctx.lineTo(w - 16, 16);
  ctx.lineTo(w - 16, 16 + markerLen);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(16, h - 16 - markerLen);
  ctx.lineTo(16, h - 16);
  ctx.lineTo(16 + markerLen, h - 16);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(w - 16 - markerLen, h - 16);
  ctx.lineTo(w - 16, h - 16);
  ctx.lineTo(w - 16, h - 16 - markerLen);
  ctx.stroke();

  ctx.restore();
}

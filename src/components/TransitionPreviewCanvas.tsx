import React, { useEffect, useRef } from 'react';
import { renderSatsetTransitionFrame } from '../utils/custom-style-runtime';
import { getTransitionMeta } from '../utils/character-catalog';

interface TransitionPreviewCanvasProps {
  transitionId: string;
  size?: number;
  animate?: boolean;
  accentColor?: string;
  className?: string;
}

const drawMiniatureSceneA = (ctx: CanvasRenderingContext2D) => {
  // Bright slate-blue "Scene A" frame
  const grad = ctx.createLinearGradient(0, 0, 0, 1920);
  grad.addColorStop(0, '#0f295c');
  grad.addColorStop(1, '#1e40af');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);

  // Clean geometric visual blocks on Scene A
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.roundRect(140, 340, 800, 180, 60);
  ctx.fill();

  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(540, 1050, 290, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 220px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('01', 540, 1060);
};

const drawMiniatureSceneB = (ctx: CanvasRenderingContext2D) => {
  // Warm amber/gold "Scene B" frame
  const grad = ctx.createLinearGradient(0, 0, 0, 1920);
  grad.addColorStop(0, '#78350f');
  grad.addColorStop(1, '#f59e0b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
  ctx.beginPath();
  ctx.roundRect(140, 340, 800, 180, 60);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(240, 740, 600, 620, 110);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.font = '800 220px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('02', 540, 1060);
};

export const TransitionPreviewCanvas: React.FC<TransitionPreviewCanvasProps> = ({
  transitionId,
  size = 44,
  animate = false,
  accentColor = '#38bdf8',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const meta = getTransitionMeta(transitionId);
  const engineId = meta.engineId === 'auto' ? 'whip-left' : meta.engineId;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(size * 0.78);
    const h = size;
    const pxW = Math.round(w * dpr);
    const pxH = Math.round(h * dpr);
    if (canvas.width !== pxW || canvas.height !== pxH) {
      canvas.width = pxW;
      canvas.height = pxH;
    }

    let rafId = 0;
    const startWall = performance.now();

    const drawProgress = (progress: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(0, 0, w, h, Math.max(6, Math.round(w * 0.2)));
      ctx.clip();

      ctx.scale(w / 1080, h / 1920);
      try {
        renderSatsetTransitionFrame(
          ctx,
          engineId,
          progress,
          drawMiniatureSceneA,
          drawMiniatureSceneB,
          accentColor,
          '#041029'
        );
      } catch {
        drawMiniatureSceneA(ctx);
      }

      // If 'otomatis', overlay a subtle dual-frame sparkle badge at top-right
      if (meta.engineId === 'auto') {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(870, 210, 110, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    if (!animate) {
      // Mid-transition snapshot that visually demonstrates the exact motion effect
      const staticProgress =
        engineId === 'flash'
          ? 0.42
          : engineId === 'dip'
          ? 0.32
          : engineId === 'fade'
          ? 0.5
          : engineId === 'swipe'
          ? 0.48
          : engineId === 'sambung'
          ? 0.5
          : 0.46;
      drawProgress(staticProgress);
      return;
    }

    let lastTick = 0;
    const tick = (now: number) => {
      if (!lastTick || now - lastTick >= 42) {
        lastTick = now;
        const cycle = ((now - startWall) / 1450) % 1;
        // Pause slightly on Scene A (0..0.15), animate transition (0.15..0.75), hold Scene B (0.75..1.0)
        const p = cycle < 0.15 ? 0 : cycle > 0.75 ? 1 : (cycle - 0.15) / 0.6;
        drawProgress(Math.max(0.02, Math.min(0.98, p)));
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [engineId, meta.engineId, size, animate, accentColor]);

  const w = Math.round(size * 0.78);
  return (
    <canvas
      ref={canvasRef}
      style={{ width: w, height: size }}
      className={`shrink-0 rounded-lg border border-sky-400/30 shadow-2xs pointer-events-none select-none ${className}`}
      aria-hidden="true"
    />
  );
};

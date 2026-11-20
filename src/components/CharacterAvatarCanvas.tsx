import React, { useEffect, useRef } from 'react';
import { type CharacterDimension, type CharacterFraming } from '../types/satset.ts';
import { createSatsetSContext } from '../utils/custom-style-runtime.ts';
import {
  getCharacterMeta,
  getEngineCharacterConfig,
  resolveCharacterOption,
} from '../utils/character-catalog.ts';
import { type CustomCharacterConfig } from '../utils/custom-character.ts';

interface CharacterAvatarCanvasProps {
  characterId: string;
  customCharacter?: CustomCharacterConfig;
  pose?: string;
  viewMode?: CharacterFraming;
  dimension?: CharacterDimension;
  size?: number;
  className?: string;
  animated?: boolean;
  darkBg?: boolean;
}

export const CharacterAvatarCanvas: React.FC<CharacterAvatarCanvasProps> = ({
  characterId,
  customCharacter,
  pose = 'stand',
  viewMode,
  dimension = '3d',
  size = 44,
  className = '',
  animated = false,
  darkBg = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const resolvedId = resolveCharacterOption(characterId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pxW = Math.round(size * dpr);
    const pxH = Math.round(size * dpr);
    if (canvas.width !== pxW || canvas.height !== pxH) {
      canvas.width = pxW;
      canvas.height = pxH;
    }

    let rafId = 0;
    const startWall = performance.now();

    const drawWithOptional2DCrop = (drawFn: () => void, isOrb: boolean) => {
      if (dimension === '2d' && !isOrb && (viewMode === 'bust' || viewMode === 'closeup')) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, size, size);
        ctx.clip();
        if (viewMode === 'closeup') {
          ctx.translate(size * 0.5, size * 0.52);
          ctx.scale(2.1, 2.1);
          ctx.translate(-size * 0.5, -size * 0.31);
        } else {
          ctx.translate(size * 0.5, size * 0.56);
          ctx.scale(1.5, 1.5);
          ctx.translate(-size * 0.5, -size * 0.46);
        }
        drawFn();
        ctx.restore();
      } else {
        drawFn();
      }
    };

    const drawFrame = (now: number) => {
      const t = animated ? ((now - startWall) / 1000) % 3 : 0.35;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      if (resolvedId === 'none') {
        const cx = size / 2;
        const cy = size / 2;
        const r = size * 0.28;
        ctx.strokeStyle = darkBg ? '#94a3b8' : '#64748b';
        ctx.lineWidth = Math.max(1.75, size * 0.05);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.72, cy + r * 0.72);
        ctx.lineTo(cx + r * 0.72, cy - r * 0.72);
        ctx.stroke();
        return;
      }

      if (resolvedId === 'auto' || (resolvedId === 'custom' && !customCharacter)) {
        const use3D = dimension !== '2d';
        const s = createSatsetSContext(ctx, t, 3, darkBg ? 'night' : 'paper', 'modern', undefined, {
          finish: 'flat',
          dark: darkBg,
          character: {
            id: resolvedId,
            label: resolvedId,
            gender: 'male',
            look:
              resolvedId === 'auto'
                ? {
                    hair: 'short',
                    shirt: '#38bdf8',
                    jacket: '#0f172a',
                    jacketOpen: true,
                    pants: '#1e3a8a',
                    __is3DStudioCreator: use3D,
                    __characterDimension: dimension,
                  }
                : {
                    hair: 'quiff',
                    shirt: '#f59e0b',
                    jacket: '#2563eb',
                    jacketOpen: true,
                    pants: '#1e293b',
                    __is3DStudioCreator: use3D,
                    __characterDimension: dimension,
                  },
          },
        });
        ctx.fillStyle = resolvedId === 'auto' ? 'rgba(56, 189, 248, 0.14)' : 'rgba(245, 158, 11, 0.16)';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size * 0.42, 0, Math.PI * 2);
        ctx.fill();

        drawWithOptional2DCrop(() => {
          s.person(size * 0.5, size * 0.96, {
            pose: resolvedId === 'auto' ? 'wave' : 'present',
            size: size * 0.92,
            facing: 1,
            viewMode,
          });
        }, viewMode === 'orb');

        ctx.fillStyle = resolvedId === 'auto' ? '#38bdf8' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(size * 0.8, size * 0.2, Math.max(2.2, size * 0.065), 0, Math.PI * 2);
        ctx.fill();
        return;
      }

      const meta = getCharacterMeta(resolvedId, customCharacter);
      const engineChar = getEngineCharacterConfig(
        resolvedId,
        meta.gender === 'female' ? 'wanita' : 'pria',
        customCharacter,
        dimension
      );

      const s = createSatsetSContext(ctx, t, 3, darkBg ? 'night' : 'paper', 'modern', undefined, {
        finish: 'flat',
        dark: darkBg,
        character: engineChar,
      });

      const charHeight = meta.look?.stick === 'side' ? size * 0.96 : size * 0.94;
      const isOrb = resolvedId === 'maskot_orb_3d' || viewMode === 'orb';
      drawWithOptional2DCrop(() => {
        s.person(size * 0.5, size * 0.94, {
          pose: pose || (meta.look?.stick === 'side' ? 'walk' : 'stand'),
          size: charHeight,
          facing: 1,
          viewMode,
        });
      }, isOrb);

      if (animated) {
        rafId = requestAnimationFrame(drawFrame);
      }
    };

    drawFrame(startWall);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [resolvedId, customCharacter, pose, viewMode, dimension, size, animated, darkBg]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className={`shrink-0 pointer-events-none select-none ${className}`}
      aria-hidden="true"
    />
  );
};

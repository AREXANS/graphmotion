import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { StyleModuleInfo } from '../data/satset-modules';
import { CustomStyleDefinition } from '../types/custom-style';
import {
  renderSatsetStyleLiveDemoFrame,
  getSatsetStyleDemoSfxTimeline,
  preloadSatsetProjectAssets,
  resolveSatsetStyleId,
  getSatsetStyleDef,
} from '../utils/custom-style-runtime';
import { soundEngine } from '../utils/audio-synth';

interface StyleLivePreviewPlayerProps {
  module?: StyleModuleInfo;
  style?: StyleModuleInfo | { id: string; customStyle?: CustomStyleDefinition };
  isApplied?: boolean;
  compact?: boolean;
  className?: string;
  customStyle?: CustomStyleDefinition;
  captionOverride?: string;
  transitionOverride?: string;
  pace?: 'tenang' | 'energik';
  ratio?: '9:16' | '1:1' | '16:9';
}

export const StyleLivePreviewPlayer: React.FC<StyleLivePreviewPlayerProps> = ({
  module,
  style,
  isApplied = false,
  compact = false,
  className = '',
  customStyle,
  captionOverride,
  transitionOverride,
  pace,
  ratio = '9:16',
}) => {
  const targetObj = module || style || { id: 'scribble3d' };
  const styleId = targetObj.id || 'scribble3d';
  const effectiveCustomStyle: CustomStyleDefinition | undefined =
    customStyle ||
    (targetObj as StyleModuleInfo).customStyleDefinition ||
    (targetObj as any).customStyle;
  const effectiveCustomStyleRef = useRef<CustomStyleDefinition | undefined>(effectiveCustomStyle);
  effectiveCustomStyleRef.current = effectiveCustomStyle;
  const customStyleKey = effectiveCustomStyle
    ? `${effectiveCustomStyle.id}:${effectiveCustomStyle.rawCode?.length || 0}`
    : '';

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [audioMuted, setAudioMuted] = useState(false);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [sceneProgress, setSceneProgress] = useState(0);
  const elapsedRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);

  const isAutoStyle = styleId === 'otomatis' && !effectiveCustomStyle;

  // Collect authentic Satset demo SFX & transition events for this style
  const demoSfxData = useMemo(() => {
    if (compact || isAutoStyle) return null;
    return getSatsetStyleDemoSfxTimeline(styleId, {
      ratio,
      customStyle: effectiveCustomStyleRef.current,
      captionOverride,
      transitionOverride,
      pace,
    });
  }, [compact, isAutoStyle, styleId, ratio, customStyleKey, captionOverride, transitionOverride, pace]);

  // Reset timeline to 0 when switching style
  useEffect(() => {
    elapsedRef.current = 0;
    lastTickRef.current = null;
    setActiveSceneIdx(0);
    setSceneProgress(0);
    setIsPlaying(true);

    if (isAutoStyle) return;

    const curCustom = effectiveCustomStyleRef.current;
    const resolvedArt = curCustom ? curCustom.id : resolveSatsetStyleId(styleId);
    const styleDef = getSatsetStyleDef(resolvedArt, 'crayon');
    preloadSatsetProjectAssets({
      art: resolvedArt,
      look: curCustom?.look || styleDef?.look || 'scribble3d',
    }).catch(() => {});
  }, [styleId, customStyleKey, isAutoStyle]);

  // Schedule authentic theme-flavored SFX & transitions when playing full preview (!compact)
  useEffect(() => {
    if (compact || isAutoStyle || !isPlaying || audioMuted || !demoSfxData) {
      return;
    }

    const stopFn = soundEngine.scheduleCollectedSfxEvents(demoSfxData.events, elapsedRef.current);
    return () => {
      stopFn();
    };
  }, [compact, isAutoStyle, isPlaying, audioMuted, demoSfxData]);

  const drawAtTimeRef = useRef<((t: number) => void) | null>(null);

  useEffect(() => {
    if (isAutoStyle) {
      drawAtTimeRef.current = null;
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const sceneDuration = 4.2;
    const totalDuration = demoSfxData?.totalDur || 16.8;

    const drawFrame = (t: number) => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);

      renderSatsetStyleLiveDemoFrame(ctx, w, h, styleId, t, {
        ratio,
        customStyle: effectiveCustomStyleRef.current,
        captionOverride,
        transitionOverride,
        pace,
      });
    };

    drawAtTimeRef.current = drawFrame;

    if (!isPlaying) {
      drawFrame(elapsedRef.current);
      return () => {
        drawAtTimeRef.current = null;
      };
    }

    const render = (now: number) => {
      if (lastTickRef.current === null) {
        lastTickRef.current = now;
      }
      const dt = Math.min(0.05, (now - lastTickRef.current) / 1000);
      lastTickRef.current = now;

      const nextElapsed = elapsedRef.current + dt;
      if (nextElapsed >= totalDuration) {
        elapsedRef.current = nextElapsed % totalDuration;
        // Reschedule SFX for the new loop
        if (!compact && !audioMuted && demoSfxData) {
          soundEngine.scheduleCollectedSfxEvents(demoSfxData.events, elapsedRef.current);
        }
      } else {
        elapsedRef.current = nextElapsed;
      }

      const t = elapsedRef.current;
      const curIdx = Math.min(3, Math.floor(t / sceneDuration));
      const curProg = (t - curIdx * sceneDuration) / sceneDuration;

      if (!compact) {
        setActiveSceneIdx((prev) => (prev !== curIdx ? curIdx : prev));
        setSceneProgress((prev) =>
          Math.round(prev * 12) !== Math.round(curProg * 12) ? curProg : prev
        );
      }

      drawFrame(t);
      animId = requestAnimationFrame(render);
    };

    lastTickRef.current = null;
    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      drawAtTimeRef.current = null;
    };
  }, [styleId, compact, isAutoStyle, customStyleKey, captionOverride, transitionOverride, pace, ratio, isPlaying, audioMuted, demoSfxData]);

  const handleJumpToScene = (idx: number, offsetSec = 0.02) => {
    const newTime = idx * 4.2 + offsetSec;
    elapsedRef.current = newTime;
    setActiveSceneIdx(idx);
    setSceneProgress(offsetSec / 4.2);
    drawAtTimeRef.current?.(newTime);
    if (!compact && isPlaying && !audioMuted && demoSfxData) {
      soundEngine.scheduleCollectedSfxEvents(demoSfxData.events, newTime);
    }
  };

  const canvasW =
    ratio === '16:9' ? (compact ? 480 : 960) : ratio === '1:1' ? (compact ? 360 : 720) : compact ? 360 : 540;
  const canvasH =
    ratio === '16:9' ? (compact ? 270 : 540) : ratio === '1:1' ? (compact ? 360 : 720) : compact ? 640 : 960;

  if (isAutoStyle) {
    if (compact) {
      return (
        <div
          className={`relative overflow-hidden bg-zinc-900 flex flex-col items-center justify-center p-2 text-center select-none ${className}`}
        >
          <span className="px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-400/30 text-[9px] font-black tracking-wider text-blue-300 uppercase">
            ACAK PER KONSEP
          </span>
          <span className="mt-1 text-[8px] font-semibold text-zinc-400 leading-tight">
            Tanpa Pratinjau Visual
          </span>
        </div>
      );
    }

    return (
      <div className={`flex flex-col items-center select-none ${className}`}>
        <div className="relative w-[240px] sm:w-[266px] aspect-[9/16] rounded-[38px] border-[6px] border-zinc-900 bg-zinc-950 shadow-2xl overflow-hidden flex flex-col items-center justify-center p-5 text-center">
          {isApplied && (
            <div className="absolute top-5 right-4 z-20">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-white text-[9px] font-extrabold tracking-wide shadow-xs">
                ✓ DIPAKAI
              </span>
            </div>
          )}

          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3.5 shadow-inner">
            <span className="text-lg font-black text-blue-400 tracking-tighter">◎</span>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-[9px] font-extrabold tracking-wider uppercase mb-2.5">
            MODE ACAK & ADAPTIF
          </span>

          <h4 className="text-white text-[13px] font-extrabold leading-snug mb-2">
            Tanpa Pratinjau Visual Tetap
          </h4>

          <p className="text-zinc-400 text-[10.5px] leading-relaxed font-medium">
            Gaya <strong className="text-zinc-200">Otomatis</strong> tidak menampilkan animasi pratinjau karena visualnya diacak dan berganti secara dinamis di setiap adegan menyesuaikan konsep serta pengaturan yang sedang dibahas—tanpa harus mengikuti satu gaya yang tersedia.
          </p>

          <div className="mt-4 w-full rounded-xl bg-zinc-900/90 border border-zinc-800/90 px-3 py-2.5 text-left space-y-1.5">
            <div className="flex items-center justify-between text-[9.5px]">
              <span className="text-zinc-400 font-semibold">Komposisi Babak</span>
              <span className="text-blue-300 font-bold">Berganti Otomatis</span>
            </div>
            <div className="flex items-center justify-between text-[9.5px]">
              <span className="text-zinc-400 font-semibold">Referensi Gaya</span>
              <span className="text-emerald-300 font-bold">Bebas & Kontekstual</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`relative overflow-hidden bg-[#141210] ${className}`}>
        <canvas
          ref={canvasRef}
          width={canvasW}
          height={canvasH}
          className="w-full h-full object-cover block"
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div className="relative w-[240px] sm:w-[266px] aspect-[9/16] rounded-[38px] border-[6px] border-zinc-900 bg-zinc-950 shadow-2xl overflow-hidden flex flex-col">
        {/* Top 4-Scene Segmented Progress Bar (satsetmotion.id style) */}
        <div className="absolute top-3 left-3.5 right-3.5 z-20 flex items-center gap-1.5">
          {[0, 1, 2, 3].map((idx) => {
            const fillPct =
              idx < activeSceneIdx ? 100 : idx === activeSceneIdx ? Math.round(sceneProgress * 100) : 0;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleJumpToScene(idx)}
                title={`Lompat ke Scene ${idx + 1}`}
                className="flex-1 h-1.5 rounded-full bg-black/35 backdrop-blur-xs overflow-hidden cursor-pointer border border-white/15"
              >
                <div
                  className="h-full bg-white rounded-full transition-none"
                  style={{ width: `${fillPct}%` }}
                />
              </button>
            );
          })}
        </div>

        {/* Top Scene Pill & Applied Status + Sound Toggle */}
        <div className="absolute top-6 left-3.5 right-3.5 z-20 flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-xs text-white text-[9px] font-extrabold tracking-wide border border-white/15 pointer-events-none">
            BAB {activeSceneIdx + 1}/4
          </span>
          <div className="flex items-center gap-1.5">
            {isApplied && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[9px] font-extrabold tracking-wide shadow-xs pointer-events-none">
                ✓ DIPAKAI
              </span>
            )}
            <button
              type="button"
              onClick={() => setAudioMuted((m) => !m)}
              title={audioMuted ? 'Nyalakan suara SFX gaya ini' : 'Bisukan suara SFX'}
              className="w-6 h-6 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-xs border border-white/15 transition cursor-pointer"
            >
              {audioMuted ? <VolumeX className="w-3 h-3 text-white/70" /> : <Volume2 className="w-3 h-3 text-[#38bdf8]" />}
            </button>
          </div>
        </div>

        {/* Main Remotion / Canvas 2D Live Engine Stage */}
        <canvas
          ref={canvasRef}
          width={canvasW}
          height={canvasH}
          onClick={() => setIsPlaying((p) => !p)}
          className="w-full h-full object-cover block cursor-pointer"
        />

        {/* Bottom Play/Pause + Chapter Dots Overlay */}
        <div className="absolute bottom-2.5 left-3.5 right-3.5 z-20 flex items-center justify-between">
          <button
            type="button"
            aria-label={isPlaying ? 'Jeda' : 'Putar'}
            onClick={() => setIsPlaying((p) => !p)}
            className="w-7 h-7 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-xs border border-white/15 transition cursor-pointer"
            title={isPlaying ? 'Jeda' : 'Putar'}
          >
            {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
          </button>

          <div className="flex items-center gap-1 bg-black/45 backdrop-blur-xs px-2 py-1 rounded-full border border-white/10">
            {[0, 1, 2, 3].map((idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Babak ${idx + 1}`}
                onClick={() => handleJumpToScene(idx)}
                className={`w-4 h-4 rounded-full text-[9px] font-black transition flex items-center justify-center cursor-pointer ${
                  activeSceneIdx === idx
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-white/75 hover:text-white'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <button
            type="button"
            aria-label="Ulangi dari Bab 1"
            onClick={() => handleJumpToScene(0)}
            className="w-7 h-7 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-xs border border-white/15 transition cursor-pointer"
            title="Ulangi dari Bab 1"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

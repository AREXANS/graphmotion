import React, { useEffect, useMemo, useRef } from 'react';
import { SatsetProject } from '../types/satset';
import { getStoredCustomStyles } from '../utils/custom-style-parser';
import {
  renderSatsetTimelineFrame,
  preloadSatsetProjectAssets,
  syncCustomStylesToSatsetEngine,
  resolveSatsetStyleId,
  getSatsetStyleDef,
  getSatsetLayout,
} from '../utils/custom-style-runtime';
import { soundEngine } from '../utils/audio-synth';
import { buildSatsetTimelineForProject } from '../utils/satset-timeline-builder';
import { Remotion3DStageEngine } from '../utils/remotion-3d-stage';

interface SatsetCanvasPlayerProps {
  project: SatsetProject;
  currentTimeSeconds: number;
  isPlaying: boolean;
  sfxEnabled?: boolean;
  sfxVolume?: number;
  onCanvasRef?: (canvas: HTMLCanvasElement | null) => void;
  onSceneError?: (err: { sceneNumber: number; message: string } | null) => void;
  bareCanvas?: boolean;
}

const SatsetCanvasPlayerInner: React.FC<SatsetCanvasPlayerProps> = ({
  project,
  currentTimeSeconds,
  isPlaying,
  sfxEnabled = true,
  sfxVolume = 0.96,
  onCanvasRef,
  onSceneError,
  bareCanvas = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const onCanvasRefLatest = useRef(onCanvasRef);
  onCanvasRefLatest.current = onCanvasRef;
  const onSceneErrorLatest = useRef(onSceneError);
  onSceneErrorLatest.current = onSceneError;
  const lastReportedErrorRef = useRef<string>('');
  const lastScheduledPlayTimeRef = useRef<number>(-1);
  const lastScheduledWallTimeRef = useRef<number>(0);
  const engine3dRef = useRef<Remotion3DStageEngine | null>(null);
  const webglFailedRef = useRef<boolean>(false);

  const projectRef = useRef(project);
  projectRef.current = project;

  const rawRatio = project.aspect_ratio || '9:16';
  const ratio: '9:16' | '1:1' | '16:9' | '3:4' =
    rawRatio === '16:9'
      ? '16:9'
      : rawRatio === '1:1'
      ? '1:1'
      : rawRatio === '3:4'
      ? '3:4'
      : '9:16';

  const layout = getSatsetLayout(ratio);
  // Render directly at native engine layout dimensions (1:1 crisp pixel mapping, zero fractional scaling shimmer)
  const width = layout.W;
  const height = layout.H;

  const scenes = useMemo(
    () => (project.scenes && project.scenes.length > 0 ? project.scenes : []),
    [project.scenes]
  );
  const totalDuration =
    scenes.reduce((acc, s) => acc + (s.target_duration_sec || s.durationSeconds || 3.5), 0) ||
    project.target_duration_sec ||
    project.durationSeconds ||
    15;
  const clampedTime = Math.max(0, Math.min(currentTimeSeconds, Math.max(0.01, totalDuration - 0.001)));

  // Determine active scene index
  let accumulated = 0;
  let activeSceneIndex = 0;
  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i];
    const sDuration = s.target_duration_sec || s.durationSeconds || 3.5;
    const nextAcc = accumulated + sDuration;
    if (clampedTime <= nextAcc || i === scenes.length - 1) {
      activeSceneIndex = i;
      break;
    }
    accumulated = nextAcc;
  }

  const activeScene = scenes[activeSceneIndex] || scenes[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      ctxRef.current = canvas.getContext('2d', { alpha: false }) || canvas.getContext('2d');
      if (onCanvasRefLatest.current) {
        onCanvasRefLatest.current(canvas);
      }
    }
    return () => {
      if (engine3dRef.current) {
        engine3dRef.current.dispose();
        engine3dRef.current = null;
      }
    };
  }, []);

  // Sync SFX enable & volume into soundEngine
  useEffect(() => {
    soundEngine.setSfxEnabled(sfxEnabled);
    soundEngine.setSfxVolume(sfxVolume);
  }, [sfxEnabled, sfxVolume]);

  // Sync active style into soundEngine so UI SFX clicks also match the theme flavor
  useEffect(() => {
    const rawStyleId = project.gaya_video || activeScene?.visualModule || 'scribble3d';
    soundEngine.setActiveStyle(rawStyleId);
  }, [activeScene?.visualModule, project.gaya_video]);

  // Preload Google Fonts & style assets whenever style or font changes
  useEffect(() => {
    const customStyles = getStoredCustomStyles();
    syncCustomStylesToSatsetEngine(customStyles);
    const rawStyleId = project.gaya_video || activeScene?.visualModule || 'scribble3d';
    const resolvedArt = resolveSatsetStyleId(rawStyleId);
    const styleDef = getSatsetStyleDef(resolvedArt, 'crayon');
    preloadSatsetProjectAssets({
      art: resolvedArt,
      look: styleDef?.look || 'scribble3d',
      font: (project as any).subtitle_font,
    }).catch(() => {});
  }, [project.gaya_video, activeScene?.visualModule, (project as any).subtitle_font]);

  // Build timelineScenes & projectMeta via shared builder
  const { timelineScenes, projectMeta } = useMemo(() => {
    return buildSatsetTimelineForProject(project);
  }, [project]);

  const timelineDataRef = useRef({ timelineScenes, projectMeta });
  timelineDataRef.current = { timelineScenes, projectMeta };
  const clampedTimeRef = useRef(clampedTime);
  clampedTimeRef.current = clampedTime;

  const timelineSfxSignature = useMemo(() => {
    const metaKey = `${projectMeta.art || ''}|${projectMeta.pace || ''}|${projectMeta.transition || ''}|${projectMeta.caption || ''}`;
    const scenesKey = timelineScenes
      .map((ts: any) => {
        const sfxCalls = String(ts.code || '').match(/s\.sfx\([^)]+\)/g)?.join(',') || '';
        return `${ts.duration}|${ts.transition || ''}|${ts.camera || ''}|${ts.sfxCue || ''}|${(ts.wordAt || []).length}|${sfxCalls}`;
      })
      .join(';');
    return `${metaKey}::${scenesKey}`;
  }, [timelineScenes, projectMeta]);

  // Schedule & resync authentic Satset SFX timeline (transitions, in-scene s.sfx, theme flavors)
  useEffect(() => {
    if (!isPlaying || !sfxEnabled) {
      soundEngine.stopTimelineSfx();
      lastScheduledPlayTimeRef.current = -1;
      return;
    }

    const startFrom = clampedTimeRef.current;
    const { timelineScenes: curScenes, projectMeta: curMeta } = timelineDataRef.current;
    soundEngine.startTimelineSfx(curScenes, curMeta, startFrom);
    lastScheduledPlayTimeRef.current = startFrom;
    lastScheduledWallTimeRef.current = performance.now();

    return () => {
      soundEngine.stopTimelineSfx();
    };
  }, [isPlaying, sfxEnabled, timelineSfxSignature]);

  // Detect explicit timeline seek or loop wrap-around while playing and sync SFX lookahead clock
  useEffect(() => {
    if (!isPlaying || !sfxEnabled) return;
    if (lastScheduledPlayTimeRef.current < 0) return;

    const isBackwardJump = clampedTime < lastScheduledPlayTimeRef.current - 0.18;
    const isForwardSeekJump = clampedTime - playClockTimeRef.current > 0.55;

    if (isBackwardJump || isForwardSeekJump) {
      soundEngine.syncTimelineSfxClock(clampedTime, true);
      lastScheduledPlayTimeRef.current = clampedTime;
      lastScheduledWallTimeRef.current = performance.now();
    } else {
      lastScheduledPlayTimeRef.current = clampedTime;
    }
  }, [clampedTime, isPlaying, sfxEnabled]);

  // Render current frame to GPU-accelerated Canvas 2D (internal silky 60fps RAF loop during playback)
  const renderAtTime = useRef<(tSec: number) => void>(() => {});
  renderAtTime.current = (tSec: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = ctxRef.current || canvas.getContext('2d', { alpha: false }) || canvas.getContext('2d');
    if (!ctx) return;
    ctxRef.current = ctx;

    const clamped = Math.max(0, Math.min(tSec, Math.max(0.01, totalDuration - 0.001)));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const curProject = projectRef.current;
    const wants3D = (curProject.render_dimension ?? '3d') === '3d' && !webglFailedRef.current;

    let rendered3D = false;
    if (wants3D && timelineScenes.length > 0) {
      try {
        if (!engine3dRef.current) {
          engine3dRef.current = new Remotion3DStageEngine();
        }
        rendered3D = Boolean(
          engine3dRef.current.renderCompositeFrame(
            ctx,
            curProject,
            timelineScenes,
            projectMeta as any,
            clamped,
            width,
            height
          )
        );
      } catch {
        webglFailedRef.current = true;
        rendered3D = false;
      }
    }

    const captured: Array<{ sceneNumber: number; message: string }> = [];
    if (!rendered3D) {
      renderSatsetTimelineFrame(
        ctx,
        timelineScenes,
        clamped,
        (err: { index?: number; message?: string }) => {
          if (err && captured.length === 0) {
            captured.push({
              sceneNumber: (err.index ?? activeSceneIndex) + 1,
              message: err.message || 'Kode animasi gagal dikompilasi atau dijalankan.',
            });
          }
        },
        projectMeta as any
      );
    }

    const frameError = captured[0] ?? null;
    const errKey = frameError ? `${frameError.sceneNumber}:${frameError.message}` : '';
    if (errKey !== lastReportedErrorRef.current) {
      lastReportedErrorRef.current = errKey;
      onSceneErrorLatest.current?.(frameError);
    }
  };

  const playClockTimeRef = useRef(0);

  useEffect(() => {
    if (!isPlaying) {
      playClockTimeRef.current = clampedTime;
      renderAtTime.current(clampedTime);
      return;
    }

    // Resync internal clock only if external prop explicitly jumped (seek / replay / chapter click)
    if (Math.abs(clampedTime - playClockTimeRef.current) > 0.45) {
      playClockTimeRef.current = clampedTime;
    }
  }, [clampedTime, isPlaying, totalDuration, width, height, timelineScenes, projectMeta, project.render_dimension]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    playClockTimeRef.current = clampedTimeRef.current;
    let lastNow = performance.now();
    let rafId = 0;
    const dur = Math.max(0.01, totalDuration);

    const loop = (now: number) => {
      const dt = Math.min(0.1, Math.max(0, (now - lastNow) / 1000));
      lastNow = now;
      const tNow = (playClockTimeRef.current + dt) % dur;
      playClockTimeRef.current = tNow;
      if (sfxEnabled) {
        if (!soundEngine.hasActiveTimelineSfx()) {
          const { timelineScenes: curScenes, projectMeta: curMeta } = timelineDataRef.current;
          soundEngine.startTimelineSfx(curScenes, curMeta, tNow);
        }
        soundEngine.syncTimelineSfxClock(tNow);
      }
      renderAtTime.current(tNow);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isPlaying, sfxEnabled, totalDuration, width, height, timelineScenes, projectMeta]);

  const isLandscape = ratio === '16:9';
  const isSquare = ratio === '1:1';
  const isPortrait34 = ratio === '3:4';

  if (bareCanvas) {
    return (
      <div className="relative w-full h-full bg-zinc-950 overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-full object-cover block"
        />
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center p-2 select-none">
      <div
        className={`relative ${
          isLandscape
            ? 'w-[360px] sm:w-[460px] aspect-[16/9] rounded-[24px] border-[4px]'
            : isSquare
            ? 'w-[280px] sm:w-[320px] aspect-square rounded-[28px] border-[4px]'
            : isPortrait34
            ? 'w-[270px] sm:w-[310px] aspect-[3/4] rounded-[32px] border-[4px]'
            : 'w-[260px] sm:w-[300px] aspect-[9/16] rounded-[44px] border-[5px]'
        } bg-zinc-900 p-2.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border-zinc-700/80 flex flex-col items-center overflow-hidden`}
      >
        {!isLandscape && !isSquare && !isPortrait34 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-30 flex items-center justify-between px-3">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
            <div className="w-2 h-2 rounded-full bg-zinc-700" />
          </div>
        )}

        <div
          className={`relative w-full h-full ${
            isLandscape
              ? 'rounded-[16px]'
              : isSquare
              ? 'rounded-[20px]'
              : isPortrait34
              ? 'rounded-[24px]'
              : 'rounded-[40px]'
          } overflow-hidden bg-black flex items-center justify-center`}
        >
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-full h-full object-cover block"
          />
        </div>

        {!isLandscape && !isSquare && !isPortrait34 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-zinc-600 rounded-full z-20" />
        )}
      </div>
    </div>
  );
};

export const SatsetCanvasPlayer = React.memo(SatsetCanvasPlayerInner, (prev, next) => {
  if (
    prev.isPlaying !== next.isPlaying ||
    prev.project !== next.project ||
    prev.sfxEnabled !== next.sfxEnabled ||
    prev.sfxVolume !== next.sfxVolume ||
    prev.bareCanvas !== next.bareCanvas
  ) {
    return false;
  }
  if (prev.isPlaying && next.isPlaying) {
    // Allow internal RAF loop to drive frames at 60fps without parent 11Hz React reconciliation churn
    return Math.abs(next.currentTimeSeconds - prev.currentTimeSeconds) < 0.45;
  }
  return Math.abs(next.currentTimeSeconds - prev.currentTimeSeconds) < 0.001;
});


import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  Code,
  Camera,
  FileJson,
  Layers,
  Wand2,
} from 'lucide-react';
import { AspectRatio, StoryboardChapter, StoryboardProject, UiLanguage } from '../types';
import { MotionCanvas, renderStoryboardFrameToCanvas } from './MotionCanvas';
import { clampTime, formatTimecode, calculateChapterAtTime, generateAudioSfxSchedule } from '../utils/motion-timeline';
import { soundEngine } from '../utils/audio-synth';
import { getTranslation } from '../i18n/translations';
import {
  EXPORT_RESOLUTION_SPECS,
  ExportResolutionPreset,
  buildExportFilename,
  getExportPixelDimensions,
  recordHighResCanvasVideo,
  triggerBlobDownload,
} from '../utils/video-export';

interface ProductionDeskProps {
  project: StoryboardProject;
  language: UiLanguage;
  onUpdateProject: (updated: StoryboardProject) => void;
  onNavigateToRoom: () => void;
}

export const ProductionDesk: React.FC<ProductionDeskProps> = ({
  project,
  language,
  onUpdateProject,
  onNavigateToRoom,
}) => {
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.75);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [exportResolution, setExportResolution] = useState<ExportResolutionPreset>('1080p');
  const [waveformBars, setWaveformBars] = useState<number[]>([]);
  const [refinementInput, setRefinementInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const exportAbortRef = useRef<AbortController | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number | null>(null);
  const timelineBarRef = useRef<HTMLDivElement | null>(null);

  const totalDurationMs = project.chapters.reduce((sum, ch) => sum + ch.durationMs, 0) || 10000;
  const { index: activeChapterIndex } = calculateChapterAtTime(currentTimeMs, project.chapters);
  const activeChapter = project.chapters[activeChapterIndex] || project.chapters[0];

  // Sync Audio Sfx schedule
  const sfxSchedule = useRef(generateAudioSfxSchedule(project.chapters));
  const triggeredSfxRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    sfxSchedule.current = generateAudioSfxSchedule(project.chapters);
    triggeredSfxRef.current.clear();
  }, [project.chapters]);

  // Waveform visualization interval
  useEffect(() => {
    const waveInterval = setInterval(() => {
      if (isPlaying) {
        setWaveformBars(soundEngine.getWaveformData());
      }
    }, 80);
    return () => clearInterval(waveInterval);
  }, [isPlaying]);

  // Main playback loop
  const currentTimeMsRef = useRef(currentTimeMs);
  currentTimeMsRef.current = currentTimeMs;

  useEffect(() => {
    if (!isPlaying) {
      soundEngine.stopSoundtrack();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      lastTickTimeRef.current = null;
      return;
    }

    soundEngine.startSoundtrack(project.audioMood);

    const loop = (timestamp: number) => {
      if (lastTickTimeRef.current === null) {
        lastTickTimeRef.current = timestamp;
      }
      const delta = (timestamp - lastTickTimeRef.current) * playbackSpeed;
      lastTickTimeRef.current = timestamp;

      const prev = currentTimeMsRef.current;
      const next = prev + delta;

      sfxSchedule.current.forEach((sfx, idx) => {
        if (prev <= sfx.timestampMs && next >= sfx.timestampMs && !triggeredSfxRef.current.has(idx)) {
          triggeredSfxRef.current.add(idx);
          soundEngine.triggerSfx(sfx.type);
        }
      });

      if (next >= totalDurationMs) {
        if (isLooping) {
          triggeredSfxRef.current.clear();
          currentTimeMsRef.current = 0;
          setCurrentTimeMs(0);
          animationFrameRef.current = requestAnimationFrame(loop);
        } else {
          currentTimeMsRef.current = totalDurationMs;
          setCurrentTimeMs(totalDurationMs);
          setIsPlaying(false);
          soundEngine.stopSoundtrack();
        }
        return;
      }

      currentTimeMsRef.current = next;
      setCurrentTimeMs(next);
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      soundEngine.stopSoundtrack();
    };
  }, [isPlaying, playbackSpeed, totalDurationMs, isLooping, project.audioMood]);

  const togglePlay = () => {
    soundEngine.unlock().catch(() => {});
    if (currentTimeMs >= totalDurationMs) {
      setCurrentTimeMs(0);
      triggeredSfxRef.current.clear();
    }
    setIsPlaying((prev) => !prev);
  };

  const handleSeek = (newTimeMs: number) => {
    const clamped = clampTime(newTimeMs, totalDurationMs);
    setCurrentTimeMs(clamped);
    // Reset triggered SFX that are ahead of seek point
    triggeredSfxRef.current.clear();
    sfxSchedule.current.forEach((sfx, idx) => {
      if (sfx.timestampMs < clamped) {
        triggeredSfxRef.current.add(idx);
      }
    });
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineBarRef.current) return;
    const rect = timelineBarRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    handleSeek(ratio * totalDurationMs);
  };

  const stepFrame = (frames: number) => {
    setIsPlaying(false);
    const msPerFrame = 1000 / 30; // 30fps
    handleSeek(currentTimeMs + frames * msPerFrame);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    soundEngine.setVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
      soundEngine.setMute(false);
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundEngine.setMute(nextMute);
  };

  // High-res 1080p / 2K / 4K MP4 Video Export
  const handleStartRecording = async () => {
    if (isRecording) return;
    setIsRecording(true);
    setRecordProgress(0);
    setIsPlaying(false);

    const abortController = new AbortController();
    exportAbortRef.current = abortController;

    try {
      const { width, height } = getExportPixelDimensions(project.aspectRatio, exportResolution);
      const spec = EXPORT_RESOLUTION_SPECS[exportResolution];
      const baseDims =
        project.aspectRatio === '9:16'
          ? { w: 540, h: 960 }
          : project.aspectRatio === '1:1'
            ? { w: 720, h: 720 }
            : project.aspectRatio === '4:5'
              ? { w: 640, h: 800 }
              : { w: 960, h: 540 };

      const result = await recordHighResCanvasVideo({
        width,
        height,
        fps: 60,
        durationSec: totalDurationMs / 1000,
        videoBitsPerSecond: spec.videoBitsPerSecond,
        preferMp4WebCodecs: true,
        renderFrame: (ctx, timeSec, cw, ch) => {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 0, cw, ch);
          ctx.save();
          ctx.scale(cw / baseDims.w, ch / baseDims.h);
          renderStoryboardFrameToCanvas(
            ctx,
            project.chapters,
            timeSec * 1000,
            baseDims.w,
            baseDims.h,
            language
          );
          ctx.restore();
        },
        onProgress: (pct) => setRecordProgress(pct),
        signal: abortController.signal,
      });

      const filename = buildExportFilename(project.title, exportResolution, result.extension);
      triggerBlobDownload(result.url, filename);
      setTimeout(() => URL.revokeObjectURL(result.url), 60_000);
    } catch (err) {
      console.error('Recording error:', err);
    } finally {
      setIsRecording(false);
      setRecordProgress(0);
      exportAbortRef.current = null;
    }
  };

  // Snapshot PNG Frame
  const handleSnapshotFrame = () => {
    if (!canvasElementRef.current) return;
    const canvas = canvasElementRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `kiteva-frame-${formatTimecode(currentTimeMs)}.png`;
    a.click();
  };

  // Export Storyboard JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `kiteva-storyboard-${project.id}.json`;
    a.click();
  };

  // Chapter Update Handler
  const handleChapterFieldChange = (field: keyof StoryboardChapter, value: unknown) => {
    const updatedChapters = [...project.chapters];
    updatedChapters[activeChapterIndex] = {
      ...updatedChapters[activeChapterIndex],
      [field]: value,
    };
    onUpdateProject({
      ...project,
      chapters: updatedChapters,
    });
  };

  // AI Refine Handler
  const handleRefineChapter = async () => {
    if (!refinementInput.trim()) return;
    setIsRefining(true);
    try {
      const res = await fetch('/api/agent/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter: activeChapter,
          instruction: refinementInput,
          language,
        }),
      });
      const data = await res.json();
      if (data.chapter) {
        const updatedChapters = [...project.chapters];
        updatedChapters[activeChapterIndex] = data.chapter;
        onUpdateProject({
          ...project,
          chapters: updatedChapters,
        });
        setRefinementInput('');
      }
    } catch (err) {
      console.error('Refinement failed:', err);
    } finally {
      setIsRefining(false);
    }
  };

  const handleAspectRatioChange = (ar: AspectRatio) => {
    onUpdateProject({
      ...project,
      aspectRatio: ar,
    });
  };

  const progressPercent = totalDurationMs > 0 ? (currentTimeMs / totalDurationMs) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-sm tracking-wide text-zinc-200">
              {language === 'zh' && project.titleZh ? project.titleZh : project.title}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-zinc-800" />

          {/* Aspect Ratio Switcher */}
          <div className="flex items-center gap-1 bg-zinc-800/60 p-0.5 rounded-md border border-zinc-700/60 text-xs">
            {(['16:9', '9:16', '1:1', '4:5'] as AspectRatio[]).map((ar) => (
              <button
                key={ar}
                onClick={() => handleAspectRatioChange(ar)}
                className={`px-2 py-0.5 rounded transition ${
                  project.aspectRatio === ar
                    ? 'bg-sky-500 text-white font-medium shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {ar}
              </button>
            ))}
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          {/* Resolution Switcher: 1080p / 2K / 4K */}
          <div className="hidden sm:flex items-center gap-0.5 bg-zinc-800/70 p-0.5 rounded-md border border-zinc-700/60 text-[11px] font-mono">
            {(['1080p', '2K', '4K'] as ExportResolutionPreset[]).map((res) => (
              <button
                key={res}
                type="button"
                onClick={() => setExportResolution(res)}
                className={`px-2 py-1 rounded transition cursor-pointer ${
                  exportResolution === res
                    ? 'bg-sky-500 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {res}
              </button>
            ))}
          </div>

          {/* Record Video Button */}
          <button
            onClick={handleStartRecording}
            disabled={isRecording}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition shadow-sm cursor-pointer ${
              isRecording
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>
              {isRecording
                ? `${getTranslation(language, 'recording')} ${recordProgress}%`
                : `${getTranslation(language, 'exportVideo')} .MP4 (${exportResolution})`}
            </span>
          </button>

          {/* Snapshot PNG */}
          <button
            onClick={handleSnapshotFrame}
            title={getTranslation(language, 'snapshotFrame')}
            className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJson}
            title={getTranslation(language, 'exportJson')}
            className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition"
          >
            <FileJson className="w-4 h-4" />
          </button>

          {/* Code Inspector Toggle */}
          <button
            onClick={() => setIsInspectorOpen((prev) => !prev)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border transition ${
              isInspectorOpen
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Inspector</span>
          </button>
        </div>
      </div>

      {/* Main Studio Viewport (Canvas Stage + Inspector Drawer) */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Stage Canvas Area */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-4 bg-zinc-950">
          <MotionCanvas
            chapters={project.chapters}
            currentTimeMs={currentTimeMs}
            totalDurationMs={totalDurationMs}
            aspectRatio={project.aspectRatio}
            language={language}
            isPlaying={isPlaying}
            onCanvasRef={(ref) => {
              canvasElementRef.current = ref;
            }}
          />
        </div>

        {/* Code & Chapter Inspector Drawer */}
        {isInspectorOpen && (
          <div className="w-96 border-l border-zinc-800 bg-zinc-900/95 flex flex-col z-30 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-sky-400" />
                <h3 className="font-semibold text-sm text-zinc-100">
                  {getTranslation(language, 'inspectorTitle')}
                </h3>
              </div>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 text-xs px-2 py-1 rounded bg-zinc-800"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Active Chapter Selector */}
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Active Chapter</label>
                <select
                  value={activeChapterIndex}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    let acc = 0;
                    for (let i = 0; i < idx; i++) acc += project.chapters[i].durationMs;
                    handleSeek(acc);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200"
                >
                  {project.chapters.map((ch, idx) => (
                    <option key={ch.id} value={idx}>
                      {idx + 1}. {language === 'zh' && ch.titleZh ? ch.titleZh : ch.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  {getTranslation(language, 'chapterName')}
                </label>
                <input
                  type="text"
                  value={activeChapter.title}
                  onChange={(e) => handleChapterFieldChange('title', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200"
                />
              </div>

              {/* Duration and Transition */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">
                    {getTranslation(language, 'chapterDuration')}
                  </label>
                  <input
                    type="number"
                    step="500"
                    min="1000"
                    max="15000"
                    value={activeChapter.durationMs}
                    onChange={(e) => handleChapterFieldChange('durationMs', Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">
                    {getTranslation(language, 'transitionType')}
                  </label>
                  <select
                    value={activeChapter.transitionType || 'zoomPunch'}
                    onChange={(e) => handleChapterFieldChange('transitionType', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-zinc-200"
                  >
                    <option value="zoomPunch">Zoom Punch</option>
                    <option value="whipPan">Whip Pan</option>
                    <option value="crossfade">Crossfade</option>
                    <option value="glitch">Glitch</option>
                    <option value="lightFlash">Light Flash</option>
                    <option value="iris">Iris Wipe</option>
                  </select>
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">
                    {getTranslation(language, 'accentColor')}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={activeChapter.accentColor}
                      onChange={(e) => handleChapterFieldChange('accentColor', e.target.value)}
                      className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <span className="text-zinc-300 font-mono text-[11px]">{activeChapter.accentColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">
                    {getTranslation(language, 'secondaryColor')}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={activeChapter.secondaryColor}
                      onChange={(e) => handleChapterFieldChange('secondaryColor', e.target.value)}
                      className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <span className="text-zinc-300 font-mono text-[11px]">{activeChapter.secondaryColor}</span>
                  </div>
                </div>
              </div>

              {/* Voice Script */}
              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  {getTranslation(language, 'voiceScript')}
                </label>
                <textarea
                  rows={2}
                  value={activeChapter.script}
                  onChange={(e) => handleChapterFieldChange('script', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200"
                />
              </div>

              {/* Visual Notes */}
              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  {getTranslation(language, 'visualNotes')}
                </label>
                <textarea
                  rows={2}
                  value={activeChapter.visualNotes}
                  onChange={(e) => handleChapterFieldChange('visualNotes', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200"
                />
              </div>

              {/* In-line AI Refine Box */}
              <div className="pt-2 border-t border-zinc-800">
                <label className="flex items-center gap-1.5 text-indigo-400 font-medium mb-1.5">
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>AI Chapter Director Refine</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Make it more neon cyberpunk with gold sparks..."
                    value={refinementInput}
                    onChange={(e) => setRefinementInput(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200"
                  />
                  <button
                    onClick={handleRefineChapter}
                    disabled={isRefining || !refinementInput.trim()}
                    className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1 transition"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>{isRefining ? '...' : 'Refine'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Playback Transport & Control Bar */}
      <div className="px-6 py-2.5 bg-zinc-900 border-t border-zinc-800/80 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          {/* Replay */}
          <button
            onClick={() => handleSeek(0)}
            title={getTranslation(language, 'replay')}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Step -1 Frame */}
          <button
            onClick={() => stepFrame(-1)}
            title={getTranslation(language, 'prevFrame')}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play / Pause Toggle */}
          <button
            onClick={togglePlay}
            title={isPlaying ? getTranslation(language, 'pause') : getTranslation(language, 'play')}
            className="w-9 h-9 rounded-full bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold flex items-center justify-center shadow-lg shadow-sky-500/20 transition transform active:scale-95"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          {/* Step +1 Frame */}
          <button
            onClick={() => stepFrame(1)}
            title={getTranslation(language, 'nextFrame')}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Timecode counter */}
          <div className="font-mono text-xs px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
            <span className="text-sky-400 font-semibold">{formatTimecode(currentTimeMs)}</span>
            <span className="text-zinc-500"> / </span>
            <span className="text-zinc-400">{formatTimecode(totalDurationMs)}</span>
          </div>
        </div>

        {/* Speed, Loop, and Volume */}
        <div className="flex items-center gap-4">
          {/* Speed selector */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-zinc-500 text-[11px] font-medium mr-1">Speed:</span>
            {[0.5, 1.0, 1.5, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition ${
                  playbackSpeed === s
                    ? 'bg-zinc-700 text-white font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-zinc-800" />

          {/* Loop button */}
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium border transition ${
              isLooping
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'text-zinc-500 border-zinc-800 hover:text-zinc-300'
            }`}
          >
            Loop
          </button>

          {/* Volume and Mute */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-zinc-400 hover:text-zinc-200 transition"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Multi-Track Timeline Stage */}
      <div className="h-48 bg-zinc-950 border-t border-zinc-800 flex flex-col z-10 select-none">
        {/* Timeline Header and Ruler */}
        <div
          ref={timelineBarRef}
          onClick={handleTimelineClick}
          className="relative h-6 bg-zinc-900 border-b border-zinc-800 cursor-pointer overflow-hidden"
        >
          {/* Time markers every 1s */}
          {Array.from({ length: Math.ceil(totalDurationMs / 1000) + 1 }, (_, i) => {
            const leftPercent = (i * 1000 * 100) / totalDurationMs;
            return (
              <div
                key={i}
                style={{ left: `${leftPercent}%` }}
                className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none"
              >
                <div className="h-2 w-[1px] bg-zinc-700" />
                <span className="text-[9px] font-mono text-zinc-500 mt-0.5">{i}s</span>
              </div>
            );
          })}

          {/* Scrubber Seekhead Indicator */}
          <div
            style={{
              transform: `translateX(${progressPercent}%)`,
              left: 0,
            }}
            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 pointer-events-none z-30 transition-transform duration-75"
          >
            <div className="w-2.5 h-2.5 -ml-1 -top-0.5 bg-rose-500 rounded-full shadow-md" />
          </div>
        </div>

        {/* Tracks Container */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 relative">
          {/* Track 1: Visual Chapters */}
          <div className="flex items-center gap-3">
            <span className="w-24 text-[11px] font-semibold text-zinc-400 shrink-0 truncate">
              {getTranslation(language, 'trackVisual')}
            </span>
            <div className="flex-1 h-7 bg-zinc-900/80 rounded border border-zinc-800/80 flex overflow-hidden relative">
              {project.chapters.map((ch, idx) => {
                const widthPercent = (ch.durationMs / totalDurationMs) * 100;
                const isActive = idx === activeChapterIndex;
                return (
                  <div
                    key={ch.id}
                    onClick={() => {
                      let acc = 0;
                      for (let i = 0; i < idx; i++) acc += project.chapters[i].durationMs;
                      handleSeek(acc);
                    }}
                    style={{ width: `${widthPercent}%` }}
                    className={`h-full border-r border-zinc-800/80 px-2 flex items-center justify-between cursor-pointer transition ${
                      isActive
                        ? 'bg-sky-500/25 border-sky-500/60 font-semibold text-white'
                        : 'hover:bg-zinc-800/50 text-zinc-400'
                    }`}
                  >
                    <span className="text-[10px] truncate">
                      {idx + 1}. {language === 'zh' && ch.titleZh ? ch.titleZh : ch.title}
                    </span>
                    <span className="text-[9px] font-mono px-1 rounded bg-zinc-950/60 text-zinc-300">
                      {(ch.durationMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track 2: Motion Archetypes */}
          <div className="flex items-center gap-3">
            <span className="w-24 text-[11px] font-semibold text-zinc-400 shrink-0 truncate">
              {getTranslation(language, 'trackMotion')}
            </span>
            <div className="flex-1 h-6 bg-zinc-900/60 rounded border border-zinc-800/60 flex overflow-hidden">
              {project.chapters.map((ch) => {
                const widthPercent = (ch.durationMs / totalDurationMs) * 100;
                return (
                  <div
                    key={ch.id}
                    style={{
                      width: `${widthPercent}%`,
                      borderLeft: `3px solid ${ch.accentColor}`,
                    }}
                    className="h-full bg-zinc-800/40 px-2 flex items-center border-r border-zinc-800/80"
                  >
                    <span className="text-[9px] font-mono text-zinc-300 truncate">
                      {ch.motionGraphicType}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track 3: Narration & Subtitles */}
          <div className="flex items-center gap-3">
            <span className="w-24 text-[11px] font-semibold text-zinc-400 shrink-0 truncate">
              {getTranslation(language, 'trackScript')}
            </span>
            <div className="flex-1 h-6 bg-zinc-900/60 rounded border border-zinc-800/60 flex overflow-hidden">
              {project.chapters.map((ch) => {
                const widthPercent = (ch.durationMs / totalDurationMs) * 100;
                return (
                  <div
                    key={ch.id}
                    style={{ width: `${widthPercent}%` }}
                    className="h-full bg-indigo-950/30 border-r border-zinc-800 px-2 flex items-center"
                  >
                    <span className="text-[9px] italic text-indigo-200 truncate">
                      "{language === 'zh' && ch.scriptZh ? ch.scriptZh : ch.script}"
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track 4: Audio Soundtrack Waveform & SFX Cues */}
          <div className="flex items-center gap-3">
            <span className="w-24 text-[11px] font-semibold text-zinc-400 shrink-0 truncate">
              {getTranslation(language, 'trackAudio')}
            </span>
            <div className="flex-1 h-7 bg-zinc-900/80 rounded border border-zinc-800/80 flex items-center px-2 relative overflow-hidden">
              {/* Synthetic Frequency Waveform visualizer */}
              <div className="flex items-center gap-1 w-full h-4">
                {(waveformBars.length > 0 ? waveformBars : Array.from({ length: 48 }, () => 20)).map((val, i) => {
                  const barHeight = Math.max(3, Math.min(16, (val / 255) * 16));
                  return (
                    <div
                      key={i}
                      style={{ height: `${barHeight}px` }}
                      className="flex-1 bg-emerald-500/50 rounded-sm transition-all duration-75"
                    />
                  );
                })}
              </div>

              {/* SFX Marker Chips on timeline */}
              {sfxSchedule.current.map((sfx, idx) => {
                const sfxLeft = (sfx.timestampMs / totalDurationMs) * 100;
                return (
                  <div
                    key={idx}
                    style={{ left: `${sfxLeft}%` }}
                    className="absolute top-1 bottom-1 flex items-center -ml-2 pointer-events-none"
                  >
                    <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-amber-500/80 text-zinc-950 font-bold shadow">
                      {sfx.type.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

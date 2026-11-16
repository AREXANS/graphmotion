import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Code2,
  Sliders,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  Volume2,
  Film,
  Download,
  Share2,
  Type,
  Palette,
  User,
  Image as ImageIcon,
  FileText,
  Copy,
  Check,
  Send,
  Upload,
  AlertTriangle,
  Box,
  Layers,
} from 'lucide-react';
import { SatsetProject, SatsetScene } from '../types/satset';
import { buildAnimasiPrompt, generateRemotionCode } from '../utils/remotion-generator';
import {
  buildContextualSatsetSceneCode,
  applySmartSceneRevision,
  resolveAutoStyleForConceptAndScene,
} from '../utils/contextual-scene-builder';
import { soundEngine } from '../utils/audio-synth';
import { voiceStudio } from '../utils/voice-studio';
import { SatsetCanvasPlayer } from './SatsetCanvasPlayer';
import { GraphMotionBrandLogo } from './GraphMotionBrandLogo';
import {
  processUploadedTutorialMediaFiles,
  registerSceneUploadedMediaAsset,
  getStepFocusRegion,
} from '../utils/website-media-engine';
import {
  CAPTION_SIZES,
  CAPTION_POSITIONS,
  SATSET_FONT_LIST,
  SATSET_TRANSITIONS,
  SATSET_CAMERA_MODES,
  getSatsetStyleDemoScenes,
  resolveSatsetStyleId,
  getSatsetStyleDef,
  getSatsetStyleSfxFlavor,
} from '../utils/custom-style-runtime';

const CAPTION_WIDTH_CHOICES = [
  { id: 0.72, label: 'Sempit' },
  { id: 1, label: 'Normal' },
  { id: 1.15, label: 'Lebar' },
] as const;
import { SATSET_MODULES } from '../data/satset-modules';
import { computePreciseSceneWordTimings } from '../utils/pipeline-sync';
import {
  parseBatchSceneCodes,
  parseSingleSceneCode,
  buildSampleBatchCode,
} from '../utils/scene-code-parser';
import {
  CHARACTER_CATALOG,
  getCharacterMeta,
  resolveCharacterOption,
} from '../utils/character-catalog';
import { getStoredCustomCharacters } from '../utils/custom-character';
import {
  EXPORT_RESOLUTION_SPECS,
  ExportResolutionPreset,
  exportSatsetProjectToMp4,
  formatBytes,
  getExportPixelDimensions,
  normalizeExportResolution,
  triggerBlobDownload,
} from '../utils/video-export';
import { SendToAiModal } from './SendToAiModal';
import { collectProjectPromptImages, PromptMediaAttachment } from '../utils/ai-platform-router';
import {
  evaluateProductionStageGate,
  calibrateScenesForStagedProduction,
  PRODUCTION_FIXED_RULES,
  sanitizeSfxCueName,
  ProductionStageId,
} from '../utils/production-stage-rules';

interface SatsetAnimationStudioProps {
  project: SatsetProject;
  onUpdateProject: (p: SatsetProject) => void;
  onOpenRemotionCode: (p: SatsetProject) => void;
  onNavigateToVoice: () => void;
  onOpenStyleModal?: () => void;
  themeMode?: 'dark' | 'light';
}

export type AnimasiSubTab = 'atur' | 'preview';

export const SatsetAnimationStudio: React.FC<SatsetAnimationStudioProps> = ({
  project,
  onUpdateProject,
  onOpenRemotionCode,
  onNavigateToVoice,
  onOpenStyleModal,
  themeMode = 'dark',
}) => {
  const isDark = themeMode === 'dark';
  const [subTab, setSubTab] = useState<AnimasiSubTab>('preview');
  const [selectedSceneIdx, setSelectedSceneIdx] = useState<number>(0);
  const [perPromptCount, setPerPromptCount] = useState<number>(6);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [activeQuickTab, setActiveQuickTab] = useState<
    'subtitle' | 'latar' | 'logo' | 'thumbnail' | 'judul'
  >('subtitle');
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(true);
  const [sfxVolume, setSfxVolume] = useState<number>(95);
  const [voEnabled, setVoEnabled] = useState<boolean>(true);
  const [isSpeakingScenePreview, setIsSpeakingScenePreview] = useState<boolean>(false);
  const [isVideoSettingsOpen, setIsVideoSettingsOpen] = useState<boolean>(false);
  const [copiedBatchKey, setCopiedBatchKey] = useState<string | null>(null);
  const [inlinePasteGroup, setInlinePasteGroup] = useState<{ start: number; end: number } | null>(null);
  const [pasteCodeInput, setPasteCodeInput] = useState<string>('');
  const [isPasteModalOpen, setIsPasteModalOpen] = useState<boolean>(false);
  const [scenePasteInput, setScenePasteInput] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [animationSavedSuccess, setAnimationSavedSuccess] = useState<{
    start: number;
    end: number;
    count: number;
    warning?: string;
  } | null>(null);
  const [inlinePasteError, setInlinePasteError] = useState<string | null>(null);
  const [inlinePasteWarning, setInlinePasteWarning] = useState<string | null>(null);
  const [modalPasteError, setModalPasteError] = useState<string | null>(null);
  const [canvasSceneError, setCanvasSceneError] = useState<{
    sceneNumber: number;
    message: string;
  } | null>(null);
  const handleCanvasSceneError = useCallback(
    (err: { sceneNumber: number; message: string } | null) => {
      setCanvasSceneError((prev) => {
        if (prev?.sceneNumber === err?.sceneNumber && prev?.message === err?.message) {
          return prev;
        }
        return err;
      });
    },
    []
  );
  const [exportSuccessBanner, setExportSuccessBanner] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<{
    url: string;
    filename: string;
    width: number;
    height: number;
    bytes: number;
    extension: 'mp4' | 'webm';
    resolution: ExportResolutionPreset;
  } | null>(null);
  const [bgmUrl, setBgmUrl] = useState<string | null>((project as any).bgm_url || null);
  const [bgmName, setBgmName] = useState<string>((project as any).bgm_name || '');
  const [bgmVolume, setBgmVolume] = useState<number>(28);
  const bgmInputRef = useRef<HTMLInputElement | null>(null);
  const sceneMediaInputRef = useRef<HTMLInputElement | null>(null);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const [revisionInstruction, setRevisionInstruction] = useState<string>('');
  const [revisionScope, setRevisionScope] = useState<'scene' | 'all'>('scene');
  const [isRevisingAI, setIsRevisingAI] = useState<boolean>(false);
  const [revisionStatusMsg, setRevisionStatusMsg] = useState<string | null>(null);
  const exportAbortRef = useRef<AbortController | null>(null);
  const [previewMode, setPreviewMode] = useState<'live' | 'placeholder'>('live');
  const [aiBatchPicker, setAiBatchPicker] = useState<{
    startNum: number;
    endNum: number;
    promptText: string;
    mediaItems: PromptMediaAttachment[];
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedResolution: ExportResolutionPreset = normalizeExportResolution(
    project.export_resolution || '1080p'
  );
  const selectedFps: 30 | 60 = project.export_fps === 30 ? 30 : 60;
  const exportDimensions = getExportPixelDimensions(
    project.aspect_ratio || '9:16',
    selectedResolution
  );

  const customCharacters = useMemo(() => getStoredCustomCharacters(), [project.character, project.custom_character]);

  const scenes = useMemo(
    () => (project.scenes && project.scenes.length > 0 ? project.scenes : []),
    [project.scenes]
  );
  const totalDuration = scenes.reduce(
    (acc, cur) => acc + (cur.target_duration_sec || cur.durationSeconds || 7.5),
    0
  );

  // Stable key so style/subtitle/resolution/transition/cache edits NEVER restart Voice Over!
  const sceneNarrationKey = useMemo(
    () =>
      scenes
        .map((s) => `${s.id || s.scene_number}|${(s.narration_text || s.voiceScript || '').trim()}`)
        .join(';;'),
    [scenes]
  );

  const activeScene: SatsetScene = scenes[selectedSceneIdx] || scenes[0] || {
    id: 's-fallback',
    scene_number: 1,
    narration_text: 'Katanya orang sukses itu selalu bangun pagi penuh semangat.',
    on_screen_text: 'KATANYA ORANG SUKSES / BANGUN PAGI / PADAHAL ADA YANG SALAH',
    target_duration_sec: 7.5,
  };

  // Check if a specific scene has been animated (e.g. its prompt result was pasted)
  const isSceneAnimated = (sceneIdx: number): boolean => {
    const sceneNum = sceneIdx + 1;
    // Check if code was pasted for this scene
    if (project.scene_codes && project.scene_codes[sceneNum] && project.scene_codes[sceneNum].trim().length > 0) {
      return true;
    }
    // Check if scenes_animated_count explicitly covers this scene (> sceneIdx)
    if (typeof project.scenes_animated_count === 'number' && project.scenes_animated_count > sceneIdx) {
      return true;
    }
    return false;
  };

  const animatedCount = scenes.filter((_, idx) => isSceneAnimated(idx)).length;
  const isAllAnimated = animatedCount >= scenes.length && scenes.length > 0;
  const currentSceneIsAnimated = isSceneAnimated(selectedSceneIdx);

  const getSampleRemotionCode = (sceneNum: number, sceneText: string) => {
    const idx = Math.max(0, sceneNum - 1);
    const targetScene = scenes[idx] || {
      ...activeScene,
      scene_number: sceneNum,
      narration_text: sceneText || activeScene.narration_text,
    };
    return buildContextualSatsetSceneCode(targetScene, project, idx, Math.max(1, scenes.length)).code;
  };

  const handleOpenPasteModal = () => {
    const existing = project.scene_codes?.[selectedSceneIdx + 1] || '';
    setScenePasteInput(existing);
    setModalPasteError(null);
    setIsPasteModalOpen(true);
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentTimeSecRef = useRef(currentTimeSec);
  currentTimeSecRef.current = currentTimeSec;
  const playbackRunIdRef = useRef<number>(1);
  const spokenSceneKeyRef = useRef<string>('');
  const latestScenesRef = useRef(scenes);
  latestScenesRef.current = scenes;
  const latestProjectRef = useRef(project);
  latestProjectRef.current = project;

  // Ensure soundEngine SFX is enabled and calibrated to sfxVolume on mount
  useEffect(() => {
    soundEngine.setSfxEnabled(sfxEnabled);
    soundEngine.setSfxVolume(sfxVolume / 100);
  }, [sfxEnabled, sfxVolume]);

  // Cleanup audio & abort controller strictly on component unmount
  useEffect(() => {
    return () => {
      voiceStudio.stop();
      soundEngine.stopTimelineSfx();
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        bgmAudioRef.current = null;
      }
      exportAbortRef.current?.abort();
    };
  }, []);

  // Sync optional uploaded Background Music (BGM) with timeline Play/Pause
  useEffect(() => {
    if (!bgmUrl) {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        bgmAudioRef.current = null;
      }
      return;
    }

    if (!bgmAudioRef.current || bgmAudioRef.current.src !== bgmUrl) {
      if (bgmAudioRef.current) bgmAudioRef.current.pause();
      const audio = new Audio(bgmUrl);
      audio.loop = true;
      bgmAudioRef.current = audio;
    }

    const audio = bgmAudioRef.current;
    audio.volume = Math.max(0, Math.min(1, (bgmVolume / 100) * (voEnabled ? 0.55 : 0.9)));

    if (isPlaying) {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        try {
          audio.currentTime = currentTimeSecRef.current % audio.duration;
        } catch {
          // ignore
        }
      }
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [bgmUrl, bgmVolume, isPlaying, voEnabled]);

  const findSceneIndexAtTime = useCallback(
    (tSec: number) => {
      const list = latestScenesRef.current;
      let accumulated = 0;
      for (let i = 0; i < list.length; i++) {
        const dur = list[i].target_duration_sec || list[i].durationSeconds || 7.5;
        if (tSec >= accumulated && tSec < accumulated + dur) {
          return i;
        }
        accumulated += dur;
      }
      return Math.max(0, list.length - 1);
    },
    []
  );

  // Smooth playback clock (HUD throttled ~10fps while SatsetCanvasPlayer renders 60fps canvas + timeline SFX internally)
  useEffect(() => {
    if (!isPlaying) return;
    let rafId = 0;
    let lastNow = performance.now();
    let lastHudSyncAt = lastNow;

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastNow) / 1000);
      lastNow = now;
      const next = currentTimeSecRef.current + dt;
      if (totalDuration <= 0 || next >= totalDuration) {
        currentTimeSecRef.current = 0;
        spokenSceneKeyRef.current = '';
        voiceStudio.stop();
        soundEngine.stopTimelineSfx();
        soundEngine.stopSoundtrack();
        setCurrentTimeSec(0);
        setSelectedSceneIdx(0);
        setIsPlaying(false);
        return;
      }
      currentTimeSecRef.current = next;
      const nextIdx = findSceneIndexAtTime(next);
      setSelectedSceneIdx((prev) => (prev !== nextIdx ? nextIdx : prev));
      if (now - lastHudSyncAt >= 90) {
        lastHudSyncAt = now;
        setCurrentTimeSec(next);
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, totalDuration, findSceneIndexAtTime]);

  // Pre-warm batch scene audio cache (debounced) without cutting off ongoing playback or spamming TTS API while typing
  useEffect(() => {
    const uploadedUrl = (project as any).voice_audio_url;
    if (project.voice_skipped || (uploadedUrl && String(uploadedUrl).startsWith('blob:'))) {
      return;
    }
    const activeVoice = project.voice_character || project.voice_option || 'charon';
    const sceneTexts = latestScenesRef.current
      .map((s) => (s.narration_text || s.voiceScript || '').trim())
      .filter(Boolean);
    if (sceneTexts.length === 0) return;

    const timer = window.setTimeout(() => {
      voiceStudio
        .synthesizeBatchScenes(sceneTexts, activeVoice, project.speech_style)
        .catch(() => {});
    }, 250);
    return () => window.clearTimeout(timer);
  }, [
    project.voice_character,
    project.voice_option,
    project.voice_skipped,
    (project as any).voice_audio_url,
    project.speech_style,
    sceneNarrationKey,
  ]);

  // Synchronize Voice Over narration per scene when timeline is playing (guarded against replay loops)
  useEffect(() => {
    if (!isPlaying || !voEnabled || project.voice_skipped) {
      spokenSceneKeyRef.current = '';
      if (!isSpeakingScenePreview) {
        voiceStudio.stop();
      }
      return;
    }

    const curProject = latestProjectRef.current;
    const curScenes = latestScenesRef.current;

    // Continuous custom uploaded narration track (e.g. user's MP3 from Step 3)
    const uploadedUrl = (curProject as any).voice_audio_url;
    if (uploadedUrl && String(uploadedUrl).startsWith('blob:')) {
      const projectRunKey = `${playbackRunIdRef.current}:PROJECT_AUDIO:${uploadedUrl}`;
      if (spokenSceneKeyRef.current !== projectRunKey) {
        spokenSceneKeyRef.current = projectRunKey;
        voiceStudio.playProjectAudioAtTime(uploadedUrl, currentTimeSecRef.current);
      }
      return;
    }

    const sceneToSpeak = curScenes[selectedSceneIdx] || curScenes[0];
    const narration = (
      sceneToSpeak?.narration_text ||
      sceneToSpeak?.voiceScript ||
      sceneToSpeak?.on_screen_text ||
      ''
    ).trim();
    if (!narration) return;

    const speakKey = `${playbackRunIdRef.current}:${selectedSceneIdx}:${narration}`;
    // Already triggered narration for this exact scene in the active playback run -> NEVER replay!
    if (spokenSceneKeyRef.current === speakKey) {
      return;
    }
    spokenSceneKeyRef.current = speakKey;

    let sceneStartSec = 0;
    for (let i = 0; i < selectedSceneIdx; i++) {
      sceneStartSec += curScenes[i]?.target_duration_sec || curScenes[i]?.durationSeconds || 7.5;
    }
    const dur = sceneToSpeak?.target_duration_sec || sceneToSpeak?.durationSeconds || 7.5;
    const offsetWithinScene = Math.max(0, currentTimeSecRef.current - sceneStartSec);
    // Avoid starting if we are right at the last 0.35s tail of the scene
    if (dur - offsetWithinScene < 0.35) return;

    const activeVoice = curProject.voice_character || curProject.voice_option || 'charon';
    const activeVoiceId = voiceStudio.resolveVoiceProfile(activeVoice).id;
    const savedVoiceId = (sceneToSpeak as any)?.audio_voice_id
      ? voiceStudio.resolveVoiceProfile(String((sceneToSpeak as any).audio_voice_id)).id
      : null;
    const validSceneAudioUrl =
      sceneToSpeak?.audio_url &&
      !String(sceneToSpeak.audio_url).includes('/audio/samples/') &&
      (!savedVoiceId || savedVoiceId === activeVoiceId) &&
      (!(sceneToSpeak as any).audio_text ||
        String((sceneToSpeak as any).audio_text).trim() === narration)
        ? sceneToSpeak.audio_url
        : null;
    const cachedSceneAudio =
      validSceneAudioUrl || voiceStudio.getCachedSceneAudio(narration, activeVoice);

    voiceStudio.speak(narration, {
      profileId: activeVoice,
      style: curProject.tempo === 'santai' ? 'teduh' : 'energik',
      audioUrl: cachedSceneAudio || undefined,
      antiGoogleRobot: true,
      instantSync: true,
      maxDurationSec: dur,
      startOffsetSec: offsetWithinScene,
    });
  }, [
    isPlaying,
    selectedSceneIdx,
    voEnabled,
    project.voice_skipped,
    project.voice_character,
    project.voice_option,
    project.tempo,
    sceneNarrationKey,
    isSpeakingScenePreview,
  ]);

  const handleTogglePlay = () => {
    soundEngine.unlock();
    setIsSpeakingScenePreview(false);
    if (isPlaying) {
      playbackRunIdRef.current++;
      spokenSceneKeyRef.current = '';
      setIsPlaying(false);
      voiceStudio.stop();
      soundEngine.stopTimelineSfx();
      soundEngine.stopSoundtrack();
    } else {
      playbackRunIdRef.current++;
      spokenSceneKeyRef.current = '';
      let startIdx = selectedSceneIdx;
      if (currentTimeSec >= totalDuration - 0.2) {
        currentTimeSecRef.current = 0;
        setCurrentTimeSec(0);
        setSelectedSceneIdx(0);
        startIdx = 0;
      }
      setIsPlaying(true);
      const activeSceneForSfx = scenes[startIdx] || scenes[0];
      soundEngine.playSfx(activeSceneForSfx?.sfxCue || 'whoosh', {
        styleId: project.gaya_video,
        gain: 0.9,
      });
    }
  };

  const handleSeek = (time: number) => {
    soundEngine.unlock();
    playbackRunIdRef.current++;
    spokenSceneKeyRef.current = '';
    currentTimeSecRef.current = time;
    setCurrentTimeSec(time);
    const nextIdx = findSceneIndexAtTime(time);
    setSelectedSceneIdx((prev) => (prev !== nextIdx ? nextIdx : prev));
  };

  const handleReplay = () => {
    soundEngine.unlock();
    playbackRunIdRef.current++;
    spokenSceneKeyRef.current = '';
    setIsSpeakingScenePreview(false);
    currentTimeSecRef.current = 0;
    setCurrentTimeSec(0);
    setSelectedSceneIdx(0);
    setIsPlaying(true);
    soundEngine.playSfx('whoosh', { styleId: project.gaya_video, gain: 0.95 });
  };

  const handlePrevScene = () => {
    soundEngine.unlock();
    if (selectedSceneIdx > 0) {
      const newIdx = selectedSceneIdx - 1;
      let t = 0;
      for (let i = 0; i < newIdx; i++) {
        t += scenes[i].target_duration_sec || scenes[i].durationSeconds || 7.5;
      }
      playbackRunIdRef.current++;
      spokenSceneKeyRef.current = '';
      currentTimeSecRef.current = t;
      setSelectedSceneIdx(newIdx);
      setCurrentTimeSec(t);
      soundEngine.playSfx('click');
    }
  };

  const handleNextScene = () => {
    soundEngine.unlock();
    if (selectedSceneIdx < scenes.length - 1) {
      const newIdx = selectedSceneIdx + 1;
      let t = 0;
      for (let i = 0; i < newIdx; i++) {
        t += scenes[i].target_duration_sec || scenes[i].durationSeconds || 7.5;
      }
      playbackRunIdRef.current++;
      spokenSceneKeyRef.current = '';
      currentTimeSecRef.current = t;
      setSelectedSceneIdx(newIdx);
      setCurrentTimeSec(t);
      soundEngine.playSfx('click');
    }
  };

  const handleKirimKeAI = (startNum: number, endNum: number) => {
    const promptText = buildAnimasiPrompt(project, startNum, endNum);
    const mediaItems = collectProjectPromptImages(project, { start: startNum, end: endNum });
    soundEngine.playSfx('click');
    setAiBatchPicker({
      startNum,
      endNum,
      promptText,
      mediaItems,
    });
  };

  const [isProductionPipelineOpen, setIsProductionPipelineOpen] = useState<boolean>(true);
  const [activeStageTab, setActiveStageTab] = useState<ProductionStageId | 'fixed_rules'>('stage_2_character');
  const [calibrationBannerMsg, setCalibrationBannerMsg] = useState<string[] | null>(null);

  const productionGate = useMemo(() => {
    const mappedScenes = scenes.map((sc, idx) => ({
      id: sc.id || sc.scene_number || idx + 1,
      text: sc.narration_text || sc.voiceScript || sc.on_screen_text || '',
      highlight: sc.on_screen_text || (sc as any).highlight || '',
      sfx: sc.sfxCue || 'whoosh',
      code: project.scene_codes?.[idx + 1] || '',
      duration: sc.target_duration_sec || sc.durationSeconds || 7.5,
      role: sc.role,
    }));
    return evaluateProductionStageGate({
      topic: project.topic || project.judul_video,
      styleId: project.gaya_video,
      characterId: project.character,
      scenes: mappedScenes,
    });
  }, [project.topic, project.judul_video, project.gaya_video, project.character, project.scene_codes, scenes]);

  const handleRunStagedProductionCalibration = () => {
    soundEngine.unlock();
    soundEngine.playSfx('tap', { styleId: project.gaya_video });
    const mappedInput = scenes.map((sc, idx) => ({
      id: sc.id || sc.scene_number || idx + 1,
      text: sc.narration_text || sc.voiceScript || sc.on_screen_text || '',
      highlight: sc.on_screen_text || (sc as any).highlight || '',
      sfx: sc.sfxCue || 'whoosh',
      code: project.scene_codes?.[idx + 1] || '',
    }));
    const { scenes: calibratedItems, fixesApplied } = calibrateScenesForStagedProduction(mappedInput);

    const nextSceneCodes: Record<number, string> = { ...(project.scene_codes || {}) };
    const nextScenes: SatsetScene[] = scenes.map((sc, idx) => {
      const cal = calibratedItems[idx];
      const updatedScene: SatsetScene = {
        ...sc,
        narration_text: cal?.text || sc.narration_text,
        on_screen_text: sc.on_screen_text || cal?.highlight || `POIN ${idx + 1}`,
        sfxCue: sanitizeSfxCueName(cal?.sfx || sc.sfxCue, idx),
      };
      if (cal?.code) {
        nextSceneCodes[idx + 1] = cal.code;
      } else {
        nextSceneCodes[idx + 1] = buildContextualSatsetSceneCode(
          updatedScene,
          project,
          idx,
          Math.max(1, scenes.length)
        ).code;
      }
      return updatedScene;
    });

    onUpdateProject({
      ...project,
      scenes: nextScenes,
      scene_codes: nextSceneCodes,
      scenes_animated_count: nextScenes.length,
    });
    setCalibrationBannerMsg(fixesApplied);
  };

  const handleSalinPrompt = (startNum: number, endNum: number, key: string) => {
    const prompt = buildAnimasiPrompt(project, startNum, endNum);
    navigator.clipboard.writeText(prompt);
    setCopiedBatchKey(key);
    soundEngine.playSfx('tap');
    setTimeout(() => setCopiedBatchKey(null), 2500);
  };

  const handleApplyAllScenesReady = () => {
    soundEngine.playSfx('tap');
    onUpdateProject({
      ...project,
      scenes_animated_count: scenes.length,
    });
  };

  const handleExportVideo = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportError(null);
    setExportSuccessBanner(false);
    setExportProgress(2);
    if (exportResult?.url) {
      URL.revokeObjectURL(exportResult.url);
      setExportResult(null);
    }

    const abortController = new AbortController();
    exportAbortRef.current = abortController;
    soundEngine.playSfx('whoosh', { styleId: project.gaya_video });

    try {
      const res = await exportSatsetProjectToMp4({
        project,
        resolution: selectedResolution,
        fps: selectedFps,
        voEnabled,
        sfxEnabled,
        sfxVolume: sfxVolume / 100,
        bgmUrl,
        bgmVolume: bgmVolume / 100,
        signal: abortController.signal,
        onProgress: (pct) => setExportProgress(pct),
      });

      setExportResult({
        url: res.url,
        filename: res.filename,
        width: res.width,
        height: res.height,
        bytes: res.bytes,
        extension: res.extension,
        resolution: res.resolution,
      });
      setExportProgress(100);
      setIsExporting(false);
      setExportSuccessBanner(true);
      soundEngine.playSfx('ding', { styleId: project.gaya_video });
      triggerBlobDownload(res.url, res.filename);
    } catch (err: any) {
      setIsExporting(false);
      if (abortController.signal.aborted) {
        setExportError('Export video dibatalkan.');
      } else {
        setExportError(err?.message || 'Gagal merender file .mp4. Coba resolusi 1080p atau 2K.');
      }
    } finally {
      if (exportAbortRef.current === abortController) {
        exportAbortRef.current = null;
      }
    }
  };

  const handleBgmFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (bgmUrl && bgmUrl.startsWith('blob:')) {
      URL.revokeObjectURL(bgmUrl);
    }
    const nextUrl = URL.createObjectURL(file);
    setBgmUrl(nextUrl);
    setBgmName(file.name);
    soundEngine.playSfx('ding', { styleId: project.gaya_video });
    onUpdateProject({
      ...project,
      bgm_url: nextUrl,
      bgm_name: file.name,
    } as any);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-20" data-testid="satset-animation-studio">
      {/* ========================================================== */}
      {/* TOP SEGMENTED SUBTABS: [ Atur ] and [ Preview 8 ] */}
      {/* ========================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 pb-1">
        <div
          className={`inline-flex p-1 rounded-xl border ${
            isDark
              ? 'bg-[#020817]/90 border-blue-500/25 shadow-inner'
              : 'bg-sky-100/80 border-sky-200/90 shadow-inner'
          }`}
        >
          <button
            onClick={() => setSubTab('atur')}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              subTab === 'atur'
                ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-600/30'
                : isDark
                  ? 'text-slate-400 hover:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Atur Prompt & Gaya
          </button>
          <button
            onClick={() => setSubTab('preview')}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'preview'
                ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-600/30'
                : isDark
                  ? 'text-slate-400 hover:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Preview & Timeline</span>
            <span className="px-1.5 py-0.5 rounded bg-sky-400/20 text-sky-300 font-mono text-[10px] font-bold">
              {scenes.length || 8}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            data-testid="toggle-staged-pipeline-btn"
            onClick={() => {
              soundEngine.playSfx('click');
              setIsProductionPipelineOpen((prev) => !prev);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition flex items-center gap-1.5 cursor-pointer ${
              isDark
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Alur 4-Tahap & Aturan Tetap ({productionGate.overallScore}%)</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenRemotionCode(project)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              isDark
                ? 'bg-[#041029] border-blue-500/30 text-sky-300 hover:bg-blue-950/70'
                : 'bg-white border-sky-200 text-blue-700 hover:bg-sky-50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Buka Kode TSX</span>
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* STAGED 4-PHASE REMOTION PRODUCTION PIPELINE & FIXED RULES  */}
      {/* ========================================================== */}
      {isProductionPipelineOpen && (
        <div
          data-testid="staged-production-pipeline"
          className={`rounded-2xl p-4 sm:p-5 border space-y-4 ${
            isDark
              ? 'bg-[#03112b]/95 border-sky-500/30 text-slate-100 shadow-[0_18px_42px_rgba(2,8,23,0.6)]'
              : 'bg-white border-sky-200 text-slate-900 shadow-sm'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-400/30 text-sky-300 font-mono text-[10px] font-extrabold uppercase tracking-wider">
                  PROSES PRODUKSI BERTAHAP (4 FASE WAJIB)
                </span>
                <span
                  data-testid="production-gate-score-badge"
                  className={`px-2 py-0.5 rounded font-mono text-[10px] font-extrabold ${
                    productionGate.readyForRender
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  Skor QC: {productionGate.overallScore}% ({productionGate.completedStageCount}/{productionGate.totalStages} Tahap Lulus)
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-extrabold">
                Aturan Tetap Produksi Animasi & Karakter Remotion (Anti-Asal Jadi)
              </h3>
              <p className={`text-[11px] leading-snug ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Memastikan wajah karakter Oval V-Jaw (tidak bulat), lengan 2-segmen lentur berayun pendulum, rambut multi-layer Bezier rapi, objek 3D Studio Room & 3 Pedestal jelas tanpa bertumpuk, serta bebas suara &ldquo;ting-ting&rdquo; di luar tempo VO.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                data-testid="apply-staged-calibration-btn"
                onClick={handleRunStagedProductionCalibration}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-md shadow-emerald-900/30 transition active:scale-95 cursor-pointer"
              >
                ✓ Kalibrasi & Terapkan 4 Tahap Otomatis
              </button>
            </div>
          </div>

          {calibrationBannerMsg && (
            <div
              data-testid="calibration-success-banner"
              className={`rounded-xl p-3 border text-xs space-y-1 ${
                isDark
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold">Hasil Kalibrasi Bertahap Berhasil Diterapkan:</span>
                <button
                  type="button"
                  onClick={() => setCalibrationBannerMsg(null)}
                  className="text-[11px] font-bold opacity-75 hover:opacity-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                {calibrationBannerMsg.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 4 Stage Tabs + Fixed Rules Tab */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {productionGate.stages.map((st) => {
              const isSelected = activeStageTab === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  data-testid={`stage-tab-${st.id}`}
                  onClick={() => setActiveStageTab(st.id)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-blue-950/80 border-sky-400 text-white'
                        : 'bg-sky-50 border-blue-600 text-slate-900'
                      : isDark
                        ? 'bg-[#020817]/70 border-blue-500/20 text-slate-300 hover:border-blue-400/40'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-sky-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-[10px] font-extrabold text-sky-400">
                      TAHAP 0{st.stepNumber}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded ${
                        st.score === 100
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {st.score}%
                    </span>
                  </div>
                  <div className="text-[11px] font-extrabold mt-1 line-clamp-1">
                    {st.title.replace(/^Tahap \d · /, '')}
                  </div>
                </button>
              );
            })}

            <button
              type="button"
              data-testid="stage-tab-fixed-rules"
              onClick={() => setActiveStageTab('fixed_rules')}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                activeStageTab === 'fixed_rules'
                  ? isDark
                    ? 'bg-blue-950/80 border-sky-400 text-white'
                    : 'bg-sky-50 border-blue-600 text-slate-900'
                  : isDark
                    ? 'bg-[#020817]/70 border-blue-500/20 text-slate-300 hover:border-blue-400/40'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-sky-300'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-[10px] font-extrabold text-amber-400">
                  STANDAR BAKU
                </span>
                <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                  4 ATURAN
                </span>
              </div>
              <div className="text-[11px] font-extrabold mt-1 line-clamp-1">
                Aturan Tetap Studio
              </div>
            </button>
          </div>

          {/* Selected Stage Checklist or Fixed Rules Detail */}
          {activeStageTab === 'fixed_rules' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1" data-testid="fixed-rules-grid">
              {PRODUCTION_FIXED_RULES.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-3 rounded-xl border space-y-1.5 ${
                    isDark
                      ? 'bg-[#020817]/80 border-blue-500/25'
                      : 'bg-slate-50 border-sky-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-extrabold text-amber-400">
                      {rule.code}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400">
                      ✓ AKTIF PERMANEN
                    </span>
                  </div>
                  <h4 className="text-xs font-extrabold">{rule.title}</h4>
                  <p className={`text-[11px] leading-snug ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {rule.summary}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            (() => {
              const selectedStage =
                productionGate.stages.find((s) => s.id === activeStageTab) || productionGate.stages[0];
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1" data-testid="active-stage-checklist">
                  {selectedStage.items.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                        isDark
                          ? 'bg-[#020817]/80 border-blue-500/20'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-extrabold ${
                          item.passed
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {item.passed ? '✓' : '!'}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold leading-snug">{item.label}</div>
                        <div className={`text-[11px] leading-snug ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {item.detail}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* SUBTAB 1: ATUR (PROMPT KELOMPOK SCENE KE AI) */}
      {/* ========================================================== */}
      {subTab === 'atur' && (
        <div className="space-y-4">
          {/* Notification banner: Belum ada suara */}
          <div
            className={`rounded-2xl p-4 sm:p-5 border flex items-center justify-between gap-3 ${
              isDark
                ? 'bg-[#041029]/95 border-blue-500/25 text-slate-100'
                : 'bg-white border-sky-200/80 text-slate-900 shadow-xs'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                  isDark
                    ? 'bg-blue-500/15 border-blue-500/30 text-sky-400'
                    : 'bg-sky-50 border-sky-200 text-blue-600'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
              </div>
              <p className={`text-[11px] sm:text-xs leading-snug ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Pastikan suara narator sudah disinkronkan agar durasi adegan dan ketukan kata mengikuti ucapan narator secara presisi.
              </p>
            </div>
            <button
              onClick={onNavigateToVoice}
              className="text-xs font-bold text-sky-400 hover:underline shrink-0 cursor-pointer"
            >
              Ke tab Suara ➔
            </button>
          </div>

          {/* Card Animasi scene 0/8 siap */}
          <div
            className={`rounded-2xl p-5 sm:p-6 border space-y-4 ${
              isDark
                ? 'bg-[#041029]/95 border-blue-500/20 shadow-[0_20px_50px_rgba(2,8,23,0.65)]'
                : 'bg-white border-sky-200/80 shadow-sm'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400 block">
                  REMOTION SCENE BATCH COMPILER
                </span>
                <h3 className={`font-extrabold text-xs sm:text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  Animasi scene {animatedCount}/{scenes.length || 8} siap
                </h3>
              </div>

              <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <span>Batch per prompt:</span>
                <select
                  value={perPromptCount}
                  onChange={(e) => setPerPromptCount(Number(e.target.value))}
                  className={`border rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none cursor-pointer ${
                    isDark
                      ? 'bg-[#020817] border-blue-500/25 text-slate-100'
                      : 'bg-sky-50/50 border-sky-200 text-slate-900'
                  }`}
                >
                  <option value={1}>1 scene (paling aman)</option>
                  <option value={2}>2 scene</option>
                  <option value={4}>4 scene</option>
                  <option value={6}>6 scene</option>
                  <option value={8}>8 scene</option>
                </select>
              </div>
            </div>

            <p className={`text-[11px] leading-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Per kelompok: klik Kirim ke AI → pilih AI tujuan (Claude / ChatGPT / Gemini) beserta gambar yang diatur → tempel kode jawaban untuk merender animasi.
            </p>

            <div className="pt-1 flex items-center justify-end gap-2 flex-wrap">
              {animatedCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playSfx('click');
                    onUpdateProject({
                      ...project,
                      scenes_animated_count: 0,
                      scene_codes: {},
                    });
                  }}
                  className="text-[11px] font-bold text-rose-400 hover:text-rose-300 bg-rose-500/15 border border-rose-500/30 px-3 py-1.5 rounded-xl transition cursor-pointer"
                >
                  ↺ Reset Status Animasi
                </button>
              )}
              <button
                type="button"
                onClick={handleApplyAllScenesReady}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                + Tandai Semua Scene Siap ({scenes.length || 8} Scene)
              </button>
            </div>
          </div>

          {/* Dynamic Scene Groups */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(() => {
              const total = scenes.length || 8;
              const groups: { start: number; end: number; key: string }[] = [];
              for (let i = 1; i <= total; i += perPromptCount) {
                const start = i;
                const end = Math.min(i + perPromptCount - 1, total);
                groups.push({ start, end, key: `group-${start}-${end}` });
              }

              return groups.map((grp) => {
                const grpCount = grp.end - grp.start + 1;
                const isReady = animatedCount >= grp.end;
                const readyCount = isReady ? grpCount : Math.max(0, animatedCount - grp.start + 1);

                return (
                  <div
                    key={grp.key}
                    className={`rounded-2xl p-5 border space-y-3.5 ${
                      isDark
                        ? 'bg-[#041029]/95 border-blue-500/20'
                        : 'bg-white border-sky-200/80 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className={`font-extrabold text-xs sm:text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {grp.start === grp.end ? `Scene ${grp.start}` : `Scene ${grp.start}–${grp.end}`}
                      </h4>
                      <span className="font-mono text-[11px] text-sky-400 font-bold tabular-nums">
                        {readyCount}/{grpCount} siap
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleKirimKeAI(grp.start, grp.end)}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.99] text-white text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Kirim ke AI</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSalinPrompt(grp.start, grp.end, grp.key)}
                          className={`px-4 py-2.5 rounded-xl border text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                            isDark
                              ? 'bg-[#020817] border-blue-500/30 text-sky-300 hover:bg-blue-950/60'
                              : 'bg-sky-50 border-sky-200 text-blue-700 hover:bg-sky-100'
                          }`}
                        >
                          {copiedBatchKey === grp.key ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-sky-400" />
                              <span>Salin prompt</span>
                            </>
                          )}
                        </button>
                      </div>

                      <button
                        type="button"
                        data-testid={`batch-paste-shortcut-${grp.start}-${grp.end}`}
                        onClick={() => {
                          setInlinePasteError(null);
                          setInlinePasteWarning(null);
                          setInlinePasteGroup({ start: grp.start, end: grp.end });
                          setTimeout(() => {
                            document
                              .querySelector('[data-testid="inline-paste-container"]')
                              ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 80);
                        }}
                        className="text-[11px] font-semibold text-sky-400 hover:underline pt-0.5 block cursor-pointer"
                      >
                        Sudah punya kode? Tempel di sini
                      </button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {/* Inline Paste Container */}
          {inlinePasteGroup && (
            <div
              data-testid="inline-paste-container"
              className={`rounded-2xl p-5 border space-y-3 ${
                isDark
                  ? 'bg-[#020817]/95 border-sky-400/40'
                  : 'bg-sky-50/70 border-sky-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  Tempel Kode Animasi Scene {inlinePasteGroup.start}–{inlinePasteGroup.end}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const resolvedStyle = resolveSatsetStyleId(project.gaya_video || 'diorama');
                      const sample = buildSampleBatchCode(
                        resolvedStyle,
                        inlinePasteGroup.start,
                        inlinePasteGroup.end
                      );
                      setInlinePasteError(null);
                      setInlinePasteWarning(null);
                      setPasteCodeInput(sample);
                    }}
                    className="text-[11px] font-bold text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Code2 className="w-3 h-3" />
                    <span>Gunakan Contoh Jawaban AI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInlinePasteError(null);
                      setInlinePasteWarning(null);
                      setInlinePasteGroup(null);
                    }}
                    className="text-xs text-slate-400 hover:text-white px-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <p className={`text-[11px] leading-snug ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Tempel jawaban blok kode JavaScript Canvas 2D (<code className="text-sky-400 font-mono">s.*</code>) yang dipisah dengan penanda{' '}
                <code className="text-sky-400 font-mono">{`// ===== SCENE ${inlinePasteGroup.start} =====`}</code>{' '}
                untuk setiap adegan agar masing-masing scene animasinya unik dan tidak error.
              </p>

              <textarea
                data-testid="inline-paste-textarea"
                rows={6}
                value={pasteCodeInput}
                onChange={(e) => {
                  setPasteCodeInput(e.target.value);
                  if (inlinePasteError) setInlinePasteError(null);
                  if (inlinePasteWarning) setInlinePasteWarning(null);
                }}
                placeholder={`// ===== SCENE ${inlinePasteGroup.start} =====\n// Tulis atau tempel instruksi s.* Canvas 2D untuk Scene ${inlinePasteGroup.start}...\ns.text3d("JUDUL SCENE", s.cx, s.cy - 40, { size: 54, color: s.c.orange, draw: s.pop(0.1) });`}
                className={`w-full border rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-sky-400 ${
                  isDark
                    ? 'bg-[#041029] border-blue-500/30 text-emerald-300'
                    : 'bg-white border-sky-200 text-slate-900'
                }`}
              />

              {inlinePasteError && (
                <div
                  data-testid="inline-paste-error"
                  className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-3.5 py-2.5 text-xs text-rose-300 flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{inlinePasteError}</span>
                </div>
              )}

              {inlinePasteWarning && (
                <div
                  data-testid="inline-paste-warning"
                  className="rounded-xl border border-amber-500/40 bg-amber-500/15 px-3.5 py-2.5 text-xs text-amber-200 flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{inlinePasteWarning}</span>
                </div>
              )}

              <button
                type="button"
                data-testid="inline-paste-save-btn"
                onClick={() => {
                  const start = inlinePasteGroup.start;
                  const end = inlinePasteGroup.end;
                  const parsed = parseBatchSceneCodes(pasteCodeInput, start, end);

                  if (!parsed.ok) {
                    soundEngine.playSfx('click');
                    setInlinePasteError(parsed.error || 'Kode animasi tidak valid atau belum dipisah per scene.');
                    return;
                  }

                  soundEngine.playSfx('ding');
                  const existingCodes = { ...(project.scene_codes || {}) };
                  for (const sNum of parsed.parsedSceneNumbers) {
                    if (parsed.scenesByNumber[sNum]) {
                      existingCodes[sNum] = parsed.scenesByNumber[sNum];
                    }
                  }

                  const highestSaved = Math.max(...parsed.parsedSceneNumbers);
                  const updatedProject: SatsetProject = {
                    ...project,
                    scenes_animated_count: Math.max(animatedCount, highestSaved),
                    scene_codes: existingCodes,
                  };

                  onUpdateProject(updatedProject);
                  setInlinePasteError(null);
                  setInlinePasteWarning(null);
                  setCanvasSceneError(null);
                  setAnimationSavedSuccess({
                    start: parsed.parsedSceneNumbers[0] ?? start,
                    end: highestSaved,
                    count: parsed.parsedSceneNumbers.length,
                    warning: parsed.warning,
                  });
                  setInlinePasteGroup(null);
                  setPasteCodeInput('');
                  const firstTargetIdx = Math.max(0, (parsed.parsedSceneNumbers[0] ?? start) - 1);
                  setSelectedSceneIdx(firstTargetIdx);
                  let targetTime = 0.2;
                  for (let i = 0; i < firstTargetIdx; i++) {
                    targetTime += scenes[i]?.target_duration_sec || scenes[i]?.durationSeconds || 7.5;
                  }
                  setCurrentTimeSec(targetTime);
                  setSubTab('preview');
                }}
                className="w-full py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Simpan & Terapkan Kode Animasi</span>
              </button>
            </div>
          )}

          {/* Card: Pengaturan video (Collapsible) */}
          <div
            className={`rounded-2xl border overflow-hidden ${
              isDark
                ? 'bg-[#041029]/95 border-blue-500/20'
                : 'bg-white border-sky-200/80 shadow-xs'
            }`}
          >
            <button
              type="button"
              onClick={() => setIsVideoSettingsOpen(!isVideoSettingsOpen)}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-sky-400" />
                <div>
                  <span className={`text-xs font-extrabold block ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    Pengaturan Parameter Video
                  </span>
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {project.gaya_video === 'otomatis'
                      ? 'Otomatis (Menyesuaikan Konsep Bahasan)'
                      : SATSET_MODULES.find((m) => m.id === project.gaya_video)?.title || 'Diorama Data'}{' '}
                    · {project.tempo === 'santai' ? 'Santai' : 'Energik'} · {project.aspect_ratio || '9:16'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-sky-400">
                <span>Ubah</span>
                {isVideoSettingsOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </div>
            </button>

            {isVideoSettingsOpen && (
              <div className={`p-5 pt-3 text-xs space-y-4 border-t border-blue-500/15 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {/* Row 1: Gaya video */}
                <div className="flex flex-wrap items-center justify-between gap-2 py-1">
                  <div>
                    <span className="text-xs font-bold block">Gaya video</span>
                    {project.gaya_video === 'otomatis' && (
                      <span className="text-[10px] text-sky-400 font-semibold block">
                        Menyesuaikan gaya visual otomatis dengan konsep apa yang sedang dibahas di tiap scene
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      data-testid="animasi-quick-auto-style-btn"
                      onClick={() => {
                        soundEngine.playSfx('sparkle');
                        onUpdateProject({
                          ...project,
                          gaya_video: 'otomatis',
                          styleModule: 'otomatis',
                        });
                      }}
                      className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                        project.gaya_video === 'otomatis'
                          ? 'bg-sky-400 text-slate-950 border-sky-300'
                          : isDark
                          ? 'bg-[#020817] border-sky-400/30 text-sky-300 hover:border-sky-400'
                          : 'bg-sky-50 border-sky-200 text-blue-700 hover:border-blue-400'
                      }`}
                    >
                      Otomatis (Sesuai Konsep)
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenStyleModal?.()}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                        isDark
                          ? 'bg-[#020817] border-blue-500/30 text-slate-100 hover:border-sky-400'
                          : 'bg-sky-50 border-sky-200 text-slate-900 hover:border-blue-400'
                      }`}
                    >
                      <span className="font-extrabold text-xs">
                        {project.gaya_video === 'otomatis'
                          ? 'Otomatis (Sesuai Konsep)'
                          : SATSET_MODULES.find((m) => m.id === project.gaya_video)?.title ||
                            getSatsetStyleDef(resolveSatsetStyleId(project.gaya_video), 'crayon')?.label ||
                            project.gaya_video ||
                            'Diorama Data'}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-sky-400" />
                    </button>
                  </div>
                </div>

                {/* Row 2: Karakter & Dimensi + Framing */}
                <div className="flex items-center justify-between gap-2 py-1">
                  <span className="text-xs font-bold">Karakter</span>
                  <select
                    value={resolveCharacterOption(project.character || 'none')}
                    onChange={(e) => {
                      const val = e.target.value;
                      const customFound = customCharacters.find((c) => c.id === val);
                      const meta = getCharacterMeta(val, customFound);
                      soundEngine.playSfx('tap', { styleId: project.gaya_video });
                      onUpdateProject({
                        ...project,
                        character: val as any,
                        character_framing: val === 'maskot_orb_3d' ? 'orb' : project.character_framing,
                        character_gender: meta.gender === 'female' ? 'wanita' : 'pria',
                        custom_character: customFound || undefined,
                      });
                    }}
                    className={`max-w-[240px] px-3 py-1.5 rounded-xl border text-xs font-bold focus:outline-none ${
                      isDark
                        ? 'bg-[#020817] border-blue-500/30 text-slate-100'
                        : 'bg-sky-50 border-sky-200 text-slate-900'
                    }`}
                  >
                    {CHARACTER_CATALOG.filter((c) => c.id !== 'custom').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                    {customCharacters.length > 0 && (
                      <optgroup label="Karakter Buatanmu">
                        {customCharacters.map((cc) => (
                          <option key={cc.id} value={cc.id}>
                            ★ {cc.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                {/* Dimensi Avatar (3D Studio vs 2D Vektor) */}
                {project.character && project.character !== 'none' && (
                  <div className="flex items-center justify-between gap-2 py-1">
                    <span className="text-xs font-bold">Dimensi Avatar</span>
                    <div className="grid grid-cols-2 gap-1 bg-blue-500/10 p-1 rounded-xl">
                      {(
                        [
                          { id: '3d', label: '3D Studio' },
                          { id: '2d', label: '2D Vektor' },
                        ] as const
                      ).map((dim) => {
                        const activeDim = project.character_dimension || '3d';
                        return (
                          <button
                            key={dim.id}
                            type="button"
                            data-testid={`anim-dimension-${dim.id}`}
                            onClick={() => {
                              soundEngine.playSfx('tap', { styleId: project.gaya_video });
                              onUpdateProject({
                                ...project,
                                character_dimension: dim.id,
                              });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer whitespace-nowrap shrink-0 ${
                              activeDim === dim.id
                                ? 'bg-blue-600 text-white shadow-xs'
                                : isDark
                                ? 'text-slate-300 hover:text-white'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {dim.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Framing / Tampilan Badan */}
                {project.character && project.character !== 'none' && (
                  <div className="flex items-center justify-between gap-2 py-1">
                    <span className="text-xs font-bold">Tampilan Badan</span>
                    <div className="grid grid-cols-4 gap-1 bg-blue-500/10 p-1 rounded-xl">
                      {(
                        [
                          { id: 'full', label: 'Full' },
                          { id: 'bust', label: 'Setengah' },
                          { id: 'closeup', label: 'Close-Up' },
                          { id: 'orb', label: 'Orb 3D' },
                        ] as const
                      ).map((fr) => {
                        const activeFraming =
                          project.character_framing ||
                          (project.character === 'maskot_orb_3d' ? 'orb' : 'full');
                        return (
                          <button
                            key={fr.id}
                            type="button"
                            onClick={() => {
                              soundEngine.playSfx('tap', { styleId: project.gaya_video });
                              onUpdateProject({
                                ...project,
                                character_framing: fr.id,
                              });
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer whitespace-nowrap shrink-0 ${
                              activeFraming === fr.id
                                ? 'bg-blue-600 text-white shadow-xs'
                                : isDark
                                ? 'text-slate-300 hover:text-white'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {fr.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Row 3: Warna brand */}
                <div className="flex items-center justify-between py-1 gap-2">
                  <span className="text-xs font-bold">Warna brand</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      aria-label="Pilih warna brand"
                      value={
                        project.warna_brand && project.warna_brand !== 'auto'
                          ? project.warna_brand
                          : project.website_promo?.primaryColor || '#2563EB'
                      }
                      onChange={(e) =>
                        onUpdateProject({
                          ...project,
                          warna_brand: e.target.value,
                          brandColor: e.target.value,
                        })
                      }
                      className="w-7 h-7 rounded-lg border border-blue-500/30 cursor-pointer bg-transparent p-0.5"
                    />
                    <select
                      data-testid="studio-brand-color-select"
                      value={
                        project.warna_brand && project.warna_brand !== 'auto'
                          ? project.warna_brand
                          : project.website_promo?.primaryColor || 'auto'
                      }
                      onChange={(e) =>
                        onUpdateProject({
                          ...project,
                          warna_brand: e.target.value,
                          brandColor: e.target.value === 'auto' ? undefined : e.target.value,
                        })
                      }
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold focus:outline-none ${
                        isDark
                          ? 'bg-[#020817] border-blue-500/30 text-slate-100'
                          : 'bg-sky-50 border-sky-200 text-slate-900'
                      }`}
                    >
                      <option value="auto">Ikut gaya</option>
                      {project.website_promo?.primaryColor && (
                        <option value={project.website_promo.primaryColor}>
                          Otomatis Brand Web ({project.website_promo.primaryColor})
                        </option>
                      )}
                      {project.warna_brand &&
                        project.warna_brand !== 'auto' &&
                        project.warna_brand !== project.website_promo?.primaryColor &&
                        !['#2563EB', '#38bdf8', '#10b981'].includes(project.warna_brand) && (
                          <option value={project.warna_brand}>
                            Warna Brand ({project.warna_brand})
                          </option>
                        )}
                      <option value="#2563EB">Biru Satset (#2563EB)</option>
                      <option value="#38bdf8">Cyan Studio (#38bdf8)</option>
                      <option value="#10b981">Hijau Emerald (#10b981)</option>
                    </select>
                  </div>
                </div>

                {/* Row 4: Tempo */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-bold">Tempo</span>
                  <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${isDark ? 'bg-[#020817] border-blue-500/25' : 'bg-sky-50 border-sky-200'}`}>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateProject({
                          ...project,
                          tempo: 'energik',
                        })
                      }
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        project.tempo !== 'santai'
                          ? 'bg-[#2563EB] text-white'
                          : isDark
                            ? 'text-slate-400 hover:text-white'
                            : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Energik
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateProject({
                          ...project,
                          tempo: 'santai',
                        })
                      }
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        project.tempo === 'santai'
                          ? 'bg-[#2563EB] text-white'
                          : isDark
                            ? 'text-slate-400 hover:text-white'
                            : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Santai
                    </button>
                  </div>
                </div>

                {/* Row 5: Transisi */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-bold">Transisi</span>
                  <select
                    value={project.transition || 'auto'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'auto') {
                        soundEngine.playSfx('sparkle', { styleId: project.gaya_video });
                      } else {
                        soundEngine.playTransitionSfx(val, project.gaya_video);
                      }
                      onUpdateProject({
                        ...project,
                        transition: val as any,
                      });
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold focus:outline-none ${
                      isDark
                        ? 'bg-[#020817] border-blue-500/30 text-slate-100'
                        : 'bg-sky-50 border-sky-200 text-slate-900'
                    }`}
                  >
                    <option value="auto">Otomatis (bervariasi sesuai gaya)</option>
                    {(SATSET_TRANSITIONS as Array<{ id: string; label: string; hint: string }>).map((tr) => (
                      <option key={tr.id} value={tr.id}>
                        {tr.label} - {tr.hint}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Row 6: Ukuran video */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-bold">Rasio Video</span>
                  <div className={`flex items-center gap-1 p-1 rounded-xl border ${isDark ? 'bg-[#020817] border-blue-500/25' : 'bg-sky-50 border-sky-200'}`}>
                    {(['9:16', '16:9', '1:1', '3:4'] as const).map((ratio) => {
                      const isActive =
                        (project.aspect_ratio || '9:16') === ratio ||
                        (ratio === '9:16' && !project.aspect_ratio);
                      return (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() =>
                            onUpdateProject({
                              ...project,
                              aspect_ratio: ratio as any,
                            })
                          }
                          className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition cursor-pointer ${
                            isActive
                              ? 'bg-[#2563EB] text-white'
                              : isDark
                                ? 'text-slate-400 hover:text-white'
                                : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {ratio}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* SUBTAB 2: PREVIEW 8 (PHONE STAGE, SCENE INSPECTOR, EXPORT, TIMELINE) */}
      {/* ========================================================== */}
      {subTab === 'preview' && (
        <div className="space-y-4">
          {/* Success Banner: Animasi Berhasil Disimpan & Diterapkan */}
          {animationSavedSuccess && (
            <div
              className={`rounded-2xl p-5 border space-y-3 ${
                isDark
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-slate-100'
                  : 'bg-emerald-50 border-emerald-300 text-slate-900'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm sm:text-base">
                        Kode Animasi Berhasil Disimpan!
                      </h4>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold uppercase">
                        Tersimpan
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 leading-snug ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      Scene {animationSavedSuccess.start}–{animationSavedSuccess.end} ({animationSavedSuccess.count} scene) sudah aktif dan langsung diterapkan ke preview kanvas.
                    </p>
                    {animationSavedSuccess.warning && (
                      <p className="text-[11px] mt-1.5 text-amber-300 font-semibold">
                        Catatan: {animationSavedSuccess.warning}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAnimationSavedSuccess(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Scene Compilation / Runtime Diagnostic Banner */}
          {canvasSceneError && (
            <div
              data-testid="canvas-scene-error-banner"
              className="rounded-2xl p-4 border border-rose-500/40 bg-rose-950/50 text-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-rose-200">
                    Error Kode Animasi pada Scene {canvasSceneError.sceneNumber}
                  </h4>
                  <p className="text-[11px] font-mono text-rose-300/90 mt-0.5 break-all">
                    {canvasSceneError.message}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const idx = Math.max(0, canvasSceneError.sceneNumber - 1);
                  setSelectedSceneIdx(idx);
                  setScenePasteInput(project.scene_codes?.[canvasSceneError.sceneNumber] || '');
                  setModalPasteError(null);
                  setIsPasteModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shrink-0 cursor-pointer transition"
              >
                Perbaiki Kode Scene {canvasSceneError.sceneNumber}
              </button>
            </div>
          )}

          {/* Top notification banner */}
          <div
            className={`rounded-2xl p-4 sm:p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDark
                ? 'bg-[#041029]/95 border-blue-500/25 text-slate-100'
                : 'bg-white border-sky-200/80 text-slate-900 shadow-xs'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                  isDark
                    ? 'bg-blue-500/15 border-blue-500/30 text-sky-400'
                    : 'bg-sky-50 border-sky-200 text-blue-600'
                }`}
              >
                <Film className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 flex-1">
                <h4 className="text-xs sm:text-sm font-bold">
                  {isAllAnimated
                    ? 'Semua scene sudah siap dianimasikan'
                    : `${scenes.length - animatedCount} scene menggunakan simulasi gaya otomatis`}
                </h4>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Di tab Atur: klik "Kirim ke AI" di tiap kelompok, lalu tempel kode kustom bila ingin memodifikasi scene.
                </p>
              </div>
            </div>

            <button
              onClick={() => setSubTab('atur')}
              className="py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition active:scale-95 shrink-0 cursor-pointer"
            >
              Buka Tab Atur
            </button>
          </div>

          {/* Preview Mode Selector & Quick Action Bar */}
          <div className="flex items-center justify-between px-1 pt-1 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div
                className={`flex items-center gap-1 p-1 rounded-xl border ${
                  isDark
                    ? 'bg-[#020817]/90 border-blue-500/25'
                    : 'bg-sky-100/80 border-sky-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setPreviewMode('live');
                    if (!isPlaying) {
                      handleTogglePlay();
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-[11px] font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                    previewMode === 'live'
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Play className="w-3 h-3" />
                  <span>Simulasi Hidup (60fps)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('placeholder')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                    previewMode === 'placeholder'
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Mode Blueprint</span>
                </button>
              </div>

              <div
                data-testid="render-dimension-toggle"
                className={`flex items-center gap-1 p-1 rounded-xl border ${
                  isDark
                    ? 'bg-[#020817]/90 border-cyan-500/30'
                    : 'bg-white border-sky-200'
                }`}
              >
                <button
                  type="button"
                  data-testid="toggle-3d-webgl"
                  onClick={() => {
                    soundEngine.unlock();
                    soundEngine.playSfx('click', { styleId: project.gaya_video });
                    onUpdateProject({ ...project, render_dimension: '3d' });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                    (project.render_dimension ?? '3d') === '3d'
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-xs'
                      : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Box className="w-3 h-3" />
                  <span>3D WebGL</span>
                </button>
                <button
                  type="button"
                  data-testid="toggle-2d-motion"
                  onClick={() => {
                    soundEngine.unlock();
                    soundEngine.playSfx('click', { styleId: project.gaya_video });
                    onUpdateProject({ ...project, render_dimension: '2d' });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                    project.render_dimension === '2d'
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>2.5D Motion</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span
                data-testid="scene-choreography-badge"
                className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-mono font-bold ${
                  isDark
                    ? 'bg-[#041029] border-sky-400/25 text-sky-300'
                    : 'bg-sky-50 border-sky-200 text-blue-800'
                }`}
              >
                {(project.render_dimension ?? '3d') === '3d' ? 'Stage: 3D WebGL' : 'Stage: 2.5D'} ·{' '}
                {project.gaya_video === 'otomatis'
                  ? `Gaya Otomatis: ${resolveAutoStyleForConceptAndScene(project, activeScene, selectedSceneIdx).styleTitle}`
                  : `Gaya: ${SATSET_MODULES.find((m) => m.id === project.gaya_video)?.title || 'Diorama Data'}`}{' '}
                · Kamera: {activeScene?.camera || activeScene?.camera_movement || 'Zoom In/Out Bertahap'}
              </span>

              <button
                type="button"
                onClick={handleOpenPasteModal}
                className={`px-3.5 py-1.5 rounded-xl border text-[11px] font-extrabold transition flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                  isDark
                    ? 'bg-[#041029] border-blue-500/30 text-sky-300 hover:bg-blue-950/80'
                    : 'bg-white border-sky-200 text-blue-700 hover:bg-sky-50'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Tempel Kustom Scene {selectedSceneIdx + 1}</span>
              </button>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <div
              className={`${
                project.aspect_ratio === '16:9'
                  ? 'w-[340px] sm:w-[460px] aspect-[16/9] rounded-[24px] border-[4px]'
                  : project.aspect_ratio === '1:1'
                  ? 'w-[280px] sm:w-[320px] aspect-square rounded-[28px] border-[4px]'
                  : project.aspect_ratio === '3:4'
                  ? 'w-[270px] sm:w-[310px] aspect-[3/4] rounded-[34px] border-[5px]'
                  : 'w-[280px] sm:w-[310px] aspect-[9/16] rounded-[44px] border-[6px]'
              } bg-[#020817] p-2.5 shadow-2xl border-slate-800/95 relative overflow-hidden flex flex-col justify-between`}
            >
              {/* LIVE REMOTION ANIMATION GRAPHIC VIDEO (Clean Stage — Only Official Graph Motion Watermark) */}
              {previewMode === 'live' || currentSceneIsAnimated ? (
                <div
                  onClick={handleTogglePlay}
                  title={isPlaying ? 'Klik untuk jeda animasi' : 'Klik untuk memutar animasi & suara'}
                  className="absolute inset-0 z-0 bg-zinc-950 overflow-hidden cursor-pointer"
                >
                  <SatsetCanvasPlayer
                    project={project}
                    currentTimeSeconds={currentTimeSec}
                    isPlaying={isPlaying}
                    sfxEnabled={sfxEnabled}
                    sfxVolume={sfxVolume / 100}
                    bareCanvas={true}
                    onSceneError={handleCanvasSceneError}
                    onCanvasRef={(c) => {
                      canvasRef.current = c;
                    }}
                  />
                </div>
              ) : (
                <div className="my-auto z-10 flex flex-col items-center justify-center text-center px-4">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-sky-400/60 flex flex-col items-center justify-center bg-blue-950/50 backdrop-blur-xs">
                    <span className="text-[10px] font-bold text-sky-300 leading-tight text-center">
                      mode<br />blueprint
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenPasteModal}
                    className="mt-3 px-3.5 py-1.5 rounded-full bg-[#2563EB] text-white text-[10px] font-extrabold shadow-sm transition flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <Code2 className="w-3 h-3" />
                    <span>Tempel prompt scene</span>
                  </button>
                </div>
              )}

              {/* Subtitle Banner at bottom of phone only if in blueprint placeholder mode */}
              {previewMode === 'placeholder' && !currentSceneIsAnimated && (
                <div className="z-10 px-3 pb-3 space-y-2 pointer-events-none mt-auto">
                  <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl py-2 px-3 shadow-lg border border-blue-500/30 text-center pointer-events-auto">
                    <p className="text-xs sm:text-[13px] font-black text-white tracking-tight leading-snug">
                      {activeScene.on_screen_text || activeScene.hookText || activeScene.headline || 'Padahal pekerjaan sudah'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================== */}
          {/* PLAYER CONTROLS (Play button, Replay, Scrubber, Timecode, Segmented bars) */}
          {/* ========================================================== */}
          <div
            className={`rounded-2xl p-4 border space-y-2.5 ${
              isDark
                ? 'bg-[#041029]/95 border-blue-500/20'
                : 'bg-white border-sky-200/80 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Round play button */}
              <button
                type="button"
                data-testid="play-pause-btn"
                aria-label={isPlaying ? 'Jeda Animasi' : 'Putar Animasi'}
                title={isPlaying ? 'Jeda Animasi' : 'Putar Animasi'}
                onClick={handleTogglePlay}
                className="w-10 h-10 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-95 text-white flex items-center justify-center shadow-md shadow-blue-600/25 transition shrink-0 cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              {/* Replay button */}
              <button
                type="button"
                data-testid="replay-btn"
                aria-label="Putar Ulang"
                onClick={handleReplay}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition shrink-0 cursor-pointer ${
                  isDark
                    ? 'bg-[#020817] border-blue-500/25 text-slate-300 hover:text-white hover:border-sky-400'
                    : 'bg-sky-50 border-sky-200 text-slate-700 hover:bg-sky-100'
                }`}
                title="Putar Ulang"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Scrubber slider */}
              <div className="flex-1 relative flex items-center">
                <input
                  type="range"
                  aria-label="Scrubber Timeline Animasi"
                  min="0"
                  max={totalDuration}
                  step="0.1"
                  value={currentTimeSec}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[#2563EB] ${
                    isDark ? 'bg-slate-800' : 'bg-sky-200'
                  }`}
                />
              </div>

              {/* Timecode */}
              <span className={`text-xs font-mono font-bold shrink-0 tabular-nums ${isDark ? 'text-sky-300' : 'text-blue-700'}`}>
                {formatTime(currentTimeSec)} / {formatTime(totalDuration)}
              </span>
            </div>

            {/* Segmented chapter bar beneath scrubber */}
            <div className="grid grid-cols-8 gap-1.5 px-0.5">
              {scenes.map((_, idx) => {
                const isActive = idx === selectedSceneIdx;
                const isPassed = idx < selectedSceneIdx;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      let t = 0;
                      for (let i = 0; i < idx; i++) {
                        t += scenes[i].target_duration_sec || scenes[i].durationSeconds || 7.5;
                      }
                      handleSeek(t);
                    }}
                    className={`h-1.5 rounded-full transition cursor-pointer ${
                      isActive
                        ? 'bg-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.6)]'
                        : isPassed
                        ? 'bg-[#2563EB]'
                        : isDark
                        ? 'bg-slate-800 hover:bg-slate-700'
                        : 'bg-sky-200 hover:bg-sky-300'
                    }`}
                  />
                );
              })}
            </div>

            {/* Direct Sound Effects (SFX) Control Bar under Video Player */}
            <div
              data-testid="player-sfx-control-bar"
              className={`flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs ${
                isDark ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  data-testid="player-sfx-toggle-btn"
                  onClick={() => {
                    const next = !sfxEnabled;
                    setSfxEnabled(next);
                    soundEngine.setSfxEnabled(next);
                    if (next) soundEngine.playSfx('whoosh', { styleId: project.gaya_video });
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition ${
                    sfxEnabled
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : isDark
                        ? 'bg-slate-900 border-slate-700 text-slate-400'
                        : 'bg-slate-100 border-slate-300 text-slate-500'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>SFX &amp; Sound Effect: {sfxEnabled ? 'AKTIF' : 'MATI'}</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sfxVolume}
                    aria-label="Volume Efek Suara SFX"
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSfxVolume(val);
                      soundEngine.setSfxVolume(val / 100);
                    }}
                    className="w-20 h-1.5 rounded-lg appearance-none cursor-pointer accent-blue-600 bg-slate-800"
                  />
                  <span className="font-mono text-[11px] font-semibold text-blue-400 tabular-nums">
                    {sfxVolume}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 mr-1">Tes SFX:</span>
                {(['whoosh', 'pop', 'click', 'ding'] as const).map((cue) => (
                  <button
                    key={cue}
                    type="button"
                    data-testid={`player-sfx-test-${cue}`}
                    onClick={() => {
                      soundEngine.setSfxEnabled(true);
                      if (!sfxEnabled) setSfxEnabled(true);
                      soundEngine.playSfx(cue, { styleId: project.gaya_video });
                    }}
                    className={`px-2 py-0.5 rounded border font-mono text-[10px] font-semibold uppercase cursor-pointer transition ${
                      isDark
                        ? 'bg-[#020817] border-slate-800 text-slate-200 hover:border-blue-500'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-400'
                    }`}
                  >
                    ♪ {cue}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* SCENE INSPECTOR CARD */}
          {/* ========================================================== */}
          <div
            className={`rounded-2xl p-5 sm:p-6 border space-y-4 ${
              isDark
                ? 'bg-[#041029]/95 border-blue-500/20 shadow-[0_20px_50px_rgba(2,8,23,0.65)]'
                : 'bg-white border-sky-200/80 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevScene}
                  disabled={selectedSceneIdx === 0}
                  className={`p-1.5 rounded-lg border disabled:opacity-30 cursor-pointer ${
                    isDark
                      ? 'bg-[#020817] border-blue-500/25 text-slate-300 hover:text-white'
                      : 'bg-sky-50 border-sky-200 text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h4 className={`font-extrabold text-xs sm:text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  Scene {selectedSceneIdx + 1}{' '}
                  <span className={`font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    dari {scenes.length || 8}
                  </span>
                </h4>
                <button
                  type="button"
                  onClick={handleNextScene}
                  disabled={selectedSceneIdx === scenes.length - 1}
                  className={`p-1.5 rounded-lg border disabled:opacity-30 cursor-pointer ${
                    isDark
                      ? 'bg-[#020817] border-blue-500/25 text-slate-300 hover:text-white'
                      : 'bg-sky-50 border-sky-200 text-slate-700 hover:text-slate-950'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isSpeakingScenePreview) {
                      voiceStudio.stop();
                      setIsSpeakingScenePreview(false);
                      return;
                    }
                    setIsPlaying(false);
                    setIsSpeakingScenePreview(true);
                    soundEngine.playSfx('pop', { styleId: project.gaya_video });
                    voiceStudio.speak(activeScene.narration_text || activeScene.voiceScript || '', {
                      profileId: project.voice_character || project.voice_option || 'fenrir',
                      audioUrl: activeScene.audio_url,
                      antiGoogleRobot: true,
                      onEnd: () => setIsSpeakingScenePreview(false),
                    });
                  }}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer border ${
                    isSpeakingScenePreview
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : isDark
                        ? 'bg-[#020817] hover:bg-blue-950 text-sky-300 border-blue-500/30'
                        : 'bg-sky-50 hover:bg-sky-100 text-blue-700 border-sky-200'
                  }`}
                  title="Dengarkan Voice Over & SFX Scene ini"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>{isSpeakingScenePreview ? 'Hentikan VO' : 'Dengar VO'}</span>
                </button>

                <span
                  className={`px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                    currentSceneIsAnimated
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : isDark
                        ? 'bg-blue-500/15 text-sky-300 border-blue-500/30'
                        : 'bg-sky-50 text-blue-700 border-sky-200'
                  }`}
                >
                  {currentSceneIsAnimated ? 'TERSTRUKTUR' : 'SIMULASI OTOMATIS'}
                </span>
              </div>
            </div>

            {/* Narration Script Textarea */}
            <div className="space-y-1">
              <textarea
                rows={3}
                value={activeScene.narration_text || activeScene.voiceScript || ''}
                onChange={(e) => {
                  const newText = e.target.value;
                  const updated = scenes.map((s, i) => {
                    if (i !== selectedSceneIdx) return s;
                    const dur = s.target_duration_sec || s.durationSeconds || 7.5;
                    const emph = s.emphasis_words || s.emphasisWords || [];
                    const timing = computePreciseSceneWordTimings(
                      newText,
                      emph,
                      project.tempo === 'santai' ? 'santai' : 'energik',
                      dur
                    );
                    return {
                      ...s,
                      narration_text: newText,
                      voiceScript: newText,
                      word_timings: timing.wordTimings,
                    };
                  });
                  onUpdateProject({ ...project, scenes: updated });
                }}
                className={`w-full border rounded-xl p-3.5 text-xs sm:text-sm font-bold leading-relaxed focus:outline-none focus:border-sky-400 transition resize-none ${
                  isDark
                    ? 'bg-[#020817]/90 border-blue-500/25 text-slate-100'
                    : 'bg-sky-50/40 border-sky-200 text-slate-900'
                }`}
              />
            </div>

            {/* Kata ditebalkan */}
            <div className="space-y-1">
              <label className={`block text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Kata ditebalkan (Highlight)
              </label>
              <input
                type="text"
                value={(activeScene.emphasis_words || activeScene.emphasisWords || []).join(' ')}
                onChange={(e) => {
                  const words = e.target.value.split(' ').filter(Boolean);
                  const updated = scenes.map((s, i) => {
                    if (i !== selectedSceneIdx) return s;
                    const dur = s.target_duration_sec || s.durationSeconds || 7.5;
                    const text = s.narration_text || s.voiceScript || '';
                    const timing = computePreciseSceneWordTimings(
                      text,
                      words,
                      project.tempo === 'santai' ? 'santai' : 'energik',
                      dur
                    );
                    return {
                      ...s,
                      emphasis_words: words,
                      emphasisWords: words,
                      word_timings: timing.wordTimings,
                    };
                  });
                  onUpdateProject({ ...project, scenes: updated });
                }}
                className={`w-full border rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold focus:outline-none focus:border-sky-400 transition ${
                  isDark
                    ? 'bg-[#020817]/90 border-blue-500/25 text-sky-300'
                    : 'bg-sky-50/40 border-sky-200 text-slate-900'
                }`}
              />
            </div>

            {/* Row: Latar & Detik */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-9 space-y-1">
                <label className={`block text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Suasana Latar Adegan
                </label>
                <div className="relative">
                  <select
                    value={activeScene.theme || 'paper'}
                    onChange={(e) => {
                      const updated = scenes.map((s, i) =>
                        i === selectedSceneIdx ? { ...s, theme: e.target.value } : s
                      );
                      onUpdateProject({ ...project, scenes: updated });
                    }}
                    className={`w-full appearance-none border rounded-xl pl-9 pr-8 py-2.5 text-xs font-semibold focus:outline-none cursor-pointer ${
                      isDark
                        ? 'bg-[#020817]/90 border-blue-500/25 text-slate-100'
                        : 'bg-sky-50/40 border-sky-200 text-slate-900'
                    }`}
                  >
                    <option value="paper">Senja / tengah</option>
                    <option value="dusk">Terang / pagi</option>
                    <option value="night">Malam / gelap</option>
                  </select>
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <ChevronDown className="w-3.5 h-3.5 text-sky-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="col-span-3 space-y-1">
                <label className={`block text-[11px] font-semibold text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Durasi (dtk)
                </label>
                <input
                  type="text"
                  value={activeScene.target_duration_sec || activeScene.durationSeconds || 7.5}
                  onChange={(e) => {
                    const val = Math.max(1.5, parseFloat(e.target.value.replace(',', '.')) || 4);
                    const updated = scenes.map((s, i) => {
                      if (i !== selectedSceneIdx) return s;
                      const text = s.narration_text || s.voiceScript || '';
                      const emph = s.emphasis_words || s.emphasisWords || [];
                      const timing = computePreciseSceneWordTimings(
                        text,
                        emph,
                        project.tempo === 'santai' ? 'santai' : 'energik',
                        val
                      );
                      return {
                        ...s,
                        target_duration_sec: val,
                        durationSeconds: val,
                        word_timings: timing.wordTimings,
                      };
                    });
                    onUpdateProject({ ...project, scenes: updated });
                  }}
                  className={`w-full border rounded-xl px-2 py-2.5 text-center font-mono text-xs font-bold focus:outline-none tabular-nums ${
                    isDark
                      ? 'bg-[#020817]/90 border-blue-500/25 text-sky-300'
                      : 'bg-sky-50/40 border-sky-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Visual 3D description box + Authentic Website / Tutorial Media Upload */}
            <div
              className={`rounded-xl p-4 border text-[11px] leading-relaxed font-sans space-y-3 ${
                isDark
                  ? 'bg-[#020817]/80 border-blue-500/20 text-slate-300'
                  : 'bg-sky-50/50 border-sky-200/80 text-slate-600'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
                    BAHAN FOTO / VIDEO ADEGAN &amp; TAMPILAN WEB (SCENE {selectedSceneIdx + 1})
                  </span>
                  <span className="text-[11px] opacity-85">
                    {activeScene.media_type === 'video'
                      ? `Video bahan: ${activeScene.media_filename || 'Video terunggah'}`
                      : activeScene.media_type === 'image'
                      ? `Foto/Gambar bahan: ${activeScene.media_filename || 'Gambar terunggah'}`
                      : activeScene.website_step?.screenshotDataUrl || activeScene.media_url
                      ? `Tampilan asli website (${activeScene.website_step?.urlDisplay || project.source_url || 'Live Snapshot'})`
                      : 'Unggah foto, screenshot, atau video bahan untuk dianimasikan oleh Remotion di gaya ini'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    ref={sceneMediaInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      const items = await processUploadedTutorialMediaFiles(files);
                      e.target.value = '';
                      if (items.length === 0) return;
                      const item = items[0];
                      const isWebProject =
                        project.start_mode === 'url' ||
                        Boolean(project.website_promo) ||
                        project.gaya_video === 'uiweb';
                      const nextScenes = scenes.map((s, idx) => {
                        if (idx !== selectedSceneIdx) return s;
                        const updatedScene: SatsetScene = {
                          ...s,
                          media_url: item.url,
                          media_type: item.type,
                          media_key: item.key,
                          media_filename: item.filename,
                          visualModule: isWebProject
                            ? 'uiweb'
                            : s.visualModule || project.gaya_video || 'diorama_data',
                          focus_region:
                            s.focus_region ||
                            getStepFocusRegion(s.website_step?.layoutVariant, idx),
                        };
                        registerSceneUploadedMediaAsset(updatedScene);
                        return updatedScene;
                      });
                      const existingCodes = { ...(project.scene_codes || {}) };
                      delete existingCodes[selectedSceneIdx + 1];
                      soundEngine.playSfx('ding', { styleId: project.gaya_video });
                      onUpdateProject({
                        ...project,
                        scenes: nextScenes,
                        scene_codes: existingCodes,
                      });
                    }}
                  />
                  <button
                    type="button"
                    data-testid="upload-scene-media-btn"
                    onClick={() => sceneMediaInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Foto / Video Scene</span>
                  </button>
                </div>
              </div>

              {(activeScene.media_url || activeScene.website_step?.screenshotDataUrl) && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-blue-500/25">
                  {activeScene.media_type === 'video' && activeScene.media_url ? (
                    <video
                      src={activeScene.media_url}
                      muted
                      playsInline
                      className="w-24 h-14 object-cover rounded-lg border border-sky-400/30 shrink-0"
                    />
                  ) : (
                    <img
                      src={activeScene.media_url || activeScene.website_step?.screenshotDataUrl}
                      alt={`Langkah ${selectedSceneIdx + 1}`}
                      className="w-24 h-14 object-cover rounded-lg border border-sky-400/30 shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="text-[11px] font-extrabold text-sky-300 truncate">
                      {activeScene.website_step?.screenTitle || activeScene.media_filename || `Langkah ${selectedSceneIdx + 1}`}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2">
                      Kamera Remotion otomatis melakukan zoom-in &amp; pan ke area fokus media ini disertai highlight &amp; SFX.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-400 block mb-0.5">
                  ARAHAN VISUAL &amp; KOMPOSISI REMOTION
                </span>
                {activeScene.visual ||
                  activeScene.visualDescription ||
                  (() => {
                    const mod = SATSET_MODULES.find((m) => m.id === project.gaya_video);
                    const def = getSatsetStyleDef(resolveSatsetStyleId(project.gaya_video || 'diorama'), 'crayon');
                    const label = mod?.title || def?.label || project.gaya_video || 'Motion Grafis';
                    const dir = def?.direction || mod?.description || 'Ilustrasi visual fokus objek utama bergerak halus sesuai narasi.';
                    return `${label}: ${dir}`;
                  })()}
              </div>
            </div>

            {/* AI Revision Panel (Smart Motion Skills) */}
            <div
              data-testid="ai-animation-revision-panel"
              className={`rounded-xl p-4 border space-y-3 ${
                isDark
                  ? 'bg-slate-950/85 border-slate-800 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400 block">
                    Revisi Hasil Akhir Animasi dengan AI
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Minta AI merevisi bagian animasi, naskah, fokus zoom gambar/video, atau gerakan kamera yang masih kurang.
                  </p>
                </div>

                <div className="inline-flex rounded-lg p-0.5 border border-slate-700 bg-slate-900">
                  <button
                    type="button"
                    data-testid="revision-scope-scene"
                    onClick={() => setRevisionScope('scene')}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                      revisionScope === 'scene'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Scene {selectedSceneIdx + 1}
                  </button>
                  <button
                    type="button"
                    data-testid="revision-scope-all"
                    onClick={() => setRevisionScope('all')}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                      revisionScope === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Semua Scene ({scenes.length})
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  'Perbesar zoom gambar & fokus ke langkah inti',
                  'Persingkat headline agar lebih tajam & jelas',
                  'Percepat transisi & buat gerakan kamera lebih dinamis',
                  'Perjelas highlight kata kunci & kontras latar gelap',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRevisionInstruction(preset)}
                    className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900/90 hover:border-sky-400/50 text-[10px] font-medium text-slate-300 transition cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  data-testid="ai-revision-input"
                  value={revisionInstruction}
                  onChange={(e) => setRevisionInstruction(e.target.value)}
                  placeholder={
                    revisionScope === 'scene'
                      ? `Tulis revisi untuk Scene ${selectedSceneIdx + 1} (misal: zoom ke kanan atas, ganti headline, tambah durasi)...`
                      : 'Tulis revisi untuk seluruh animasi (misal: perjelas manfaat website & percepat ritme kamera)...'
                  }
                  className={`flex-1 rounded-xl px-3.5 py-2 text-xs font-medium border focus:outline-none focus:border-sky-400 ${
                    isDark
                      ? 'bg-[#020817] border-slate-800 text-white placeholder:text-slate-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
                <button
                  type="button"
                  data-testid="apply-ai-revision-btn"
                  disabled={isRevisingAI || !revisionInstruction.trim()}
                  onClick={async () => {
                    const instr = revisionInstruction.trim();
                    if (!instr) return;
                    setIsRevisingAI(true);
                    setRevisionStatusMsg(null);
                    try {
                      let nextProject: SatsetProject | null = null;
                      let summary = '';
                      try {
                        const res = await fetch('/api/satset/revise-animation', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            project,
                            instruction: instr,
                            scope: revisionScope,
                            sceneIndex: selectedSceneIdx,
                          }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          if (data.project) {
                            nextProject = data.project;
                            summary =
                              data.summary ||
                              `Revisi AI diterapkan (${
                                revisionScope === 'scene'
                                  ? `Scene ${selectedSceneIdx + 1}`
                                  : 'Semua Scene'
                              }).`;
                          }
                        }
                      } catch {
                        // Local fallback below
                      }

                      if (!nextProject) {
                        const indicesToRevise =
                          revisionScope === 'scene'
                            ? [selectedSceneIdx]
                            : scenes.map((_, idx) => idx);
                        const nextScenes = [...scenes];
                        const nextSceneCodes: Record<number, string> = {
                          ...(project.scene_codes || {}),
                        };
                        const localSummaries: string[] = [];
                        for (const idx of indicesToRevise) {
                          const existing = nextScenes[idx];
                          if (!existing) continue;
                          const revResult = applySmartSceneRevision(
                            existing,
                            project,
                            instr,
                            idx,
                            nextScenes.length
                          );
                          const revised = revResult.updatedScene;
                          const dur =
                            revised.target_duration_sec ||
                            revised.durationSeconds ||
                            7.5;
                          const timing = computePreciseSceneWordTimings(
                            revised.narration_text || revised.voiceScript || '',
                            revised.emphasis_words || revised.emphasisWords || [],
                            project.tempo === 'santai' ? 'santai' : 'energik',
                            dur
                          );
                          const syncedScene: SatsetScene = {
                            ...revised,
                            word_timings: timing.wordTimings,
                          };
                          nextScenes[idx] = syncedScene;
                          nextSceneCodes[idx + 1] = revResult.updatedCode;
                          if (localSummaries.length < 2) {
                            localSummaries.push(`Scene ${idx + 1}: ${revResult.summary}`);
                          }
                        }
                        summary =
                          localSummaries.join(' | ') ||
                          (revisionScope === 'scene'
                            ? `Scene ${selectedSceneIdx + 1} berhasil direvisi sesuai instruksi: "${instr}".`
                            : `Seluruh ${nextScenes.length} adegan berhasil direvisi sesuai instruksi: "${instr}".`);
                        const tempProj: SatsetProject = {
                          ...project,
                          scenes: nextScenes,
                          scene_codes: nextSceneCodes,
                          revision_history: [
                            {
                              id: `rev-${Date.now()}`,
                              timestamp: Date.now(),
                              instruction: instr,
                              scope: revisionScope,
                              sceneNumber:
                                revisionScope === 'scene'
                                  ? selectedSceneIdx + 1
                                  : undefined,
                              summary,
                            },
                            ...(project.revision_history || []),
                          ],
                        };
                        tempProj.remotionCode = generateRemotionCode(tempProj, tempProj.fps || 30);
                        nextProject = tempProj;
                      }

                      soundEngine.playSfx('ding', { styleId: project.gaya_video });
                      onUpdateProject(nextProject);
                      setRevisionStatusMsg(summary);
                      setRevisionInstruction('');
                    } finally {
                      setIsRevisingAI(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isRevisingAI ? 'Merevisi Animasi...' : 'Terapkan Revisi AI'}</span>
                </button>
              </div>

              {revisionStatusMsg && (
                <div
                  data-testid="ai-revision-status-msg"
                  className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-medium text-emerald-300 flex items-center justify-between gap-2"
                >
                  <span>{revisionStatusMsg}</span>
                  {project.revision_history && project.revision_history.length > 0 && (
                    <span className="text-[10px] font-mono text-emerald-400 shrink-0">
                      {project.revision_history.length}x revisi
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons: Buat animasi & Tempel kode */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  handleKirimKeAI(selectedSceneIdx + 1, selectedSceneIdx + 1);
                  handleOpenPasteModal();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.99] text-white text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Buat animasi AI</span>
              </button>

              <button
                type="button"
                onClick={handleOpenPasteModal}
                className={`py-2.5 px-4 rounded-xl border text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                  isDark
                    ? 'bg-[#020817] border-blue-500/30 text-sky-300 hover:bg-blue-950/80'
                    : 'bg-white border-sky-200 text-blue-700 hover:bg-sky-50'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Tempel kode</span>
              </button>
            </div>
          </div>

          {/* ========================================================== */}
          {/* QUICK TAB ROW: Subtitle, Latar, Logo, Thumbnail, Judul */}
          {/* ========================================================== */}
          <div
            className={`rounded-2xl p-4 border space-y-3 ${
              isDark
                ? 'bg-[#041029]/95 border-blue-500/20'
                : 'bg-white border-sky-200/80 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-around flex-wrap gap-1">
              {[
                { id: 'subtitle', label: 'Subtitle', icon: Type },
                { id: 'latar', label: 'Latar & Kamera', icon: Palette },
                { id: 'logo', label: 'Watermark', icon: User },
                { id: 'thumbnail', label: 'Thumbnail', icon: ImageIcon },
                { id: 'judul', label: 'Judul Hook', icon: FileText },
              ].map((tab) => {
                const isActive = activeQuickTab === tab.id;
                const IconComp = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveQuickTab(tab.id as any)}
                    className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl transition cursor-pointer ${
                      isActive
                        ? 'bg-[#2563EB] text-white shadow-sm'
                        : isDark
                          ? 'text-slate-400 hover:text-white hover:bg-[#020817]/60'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* QUICK TAB CONTENT PANEL */}
            <div className="pt-3 border-t border-blue-500/15 px-1 pb-1 space-y-3">
              {activeQuickTab === 'subtitle' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      Gaya Subtitle (16 gaya khas Graph Motion)
                    </span>
                    <span className="font-mono text-[10px] font-bold text-sky-400 bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 rounded-md">
                      Aktif:{' '}
                      {!project.subtitle_style || project.subtitle_style === 'satsetYellow' || project.subtitle_style === 'auto'
                        ? `Ikut gaya (${
                            getSatsetStyleDef(
                              resolveSatsetStyleId(
                                project.gaya_video === 'otomatis'
                                  ? resolveAutoStyleForConceptAndScene(project, project.scenes?.[0], 0).styleId
                                  : project.gaya_video
                              ),
                              'crayon'
                            )?.caption || 'pop'
                          })`
                        : project.subtitle_style}
                    </span>
                  </div>

                  {/* 17 Subtitle Mode Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateProject({
                          ...project,
                          subtitle_style: 'auto' as any,
                          show_subtitles: true,
                        } as any)
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                        !project.subtitle_style || project.subtitle_style === 'satsetYellow' || (project.subtitle_style as string) === 'auto'
                          ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                          : isDark
                            ? 'bg-[#020817] text-slate-300 border-blue-500/25 hover:border-sky-400'
                            : 'bg-sky-50/60 text-slate-700 border-sky-200 hover:border-blue-400'
                      }`}
                    >
                      Ikut Gaya
                    </button>
                    {(CAPTION_SIZES as Array<{ id: string; label: string; hint: string }>).map((cap) => {
                      const isSel = (project.subtitle_style as string) === cap.id;
                      return (
                        <button
                          key={cap.id}
                          type="button"
                          title={cap.hint}
                          onClick={() => {
                            soundEngine.playSfx('tick', { styleId: project.gaya_video });
                            onUpdateProject({
                              ...project,
                              subtitle_style: cap.id as any,
                              show_subtitles: cap.id !== 'off',
                            } as any);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                            isSel
                              ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                              : isDark
                                ? 'bg-[#020817] text-slate-300 border-blue-500/25 hover:border-sky-400'
                                : 'bg-sky-50/60 text-slate-700 border-sky-200 hover:border-blue-400'
                          }`}
                        >
                          {cap.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Font, Size, Posisi 9-Arah & Lebar Subtitle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div className="space-y-1">
                      <label className={`block text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Font Subtitle
                      </label>
                      <select
                        value={(project as any).subtitle_font || 'auto'}
                        onChange={(e) =>
                          onUpdateProject({
                            ...project,
                            subtitle_font: e.target.value,
                          } as any)
                        }
                        className={`w-full border rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none ${
                          isDark
                            ? 'bg-[#020817] border-blue-500/25 text-slate-100'
                            : 'bg-sky-50/50 border-sky-200 text-slate-900'
                        }`}
                      >
                        <option value="auto">Ikut gaya (Bawaan)</option>
                        {(SATSET_FONT_LIST as Array<{ id: string; label: string; hint: string }>).map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.label} - {f.hint}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className={`block text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Ukuran Teks
                      </label>
                      <div className={`flex items-center gap-1 p-1 rounded-xl border ${isDark ? 'bg-[#020817] border-blue-500/25' : 'bg-sky-50 border-sky-200'}`}>
                        {[
                          { id: 'sm', label: 'Kecil' },
                          { id: 'md', label: 'Sedang' },
                          { id: 'lg', label: 'Besar' },
                        ].map((sz) => (
                          <button
                            key={sz.id}
                            type="button"
                            onClick={() => {
                              soundEngine.playSfx('tick', { styleId: project.gaya_video });
                              onUpdateProject({
                                ...project,
                                subtitle_size: sz.id,
                              } as any);
                            }}
                            className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                              ((project as any).subtitle_size || 'md') === sz.id
                                ? 'bg-[#2563EB] text-white'
                                : isDark
                                  ? 'text-slate-400 hover:text-white'
                                  : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {sz.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className={`block text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Posisi Subtitle
                      </label>
                      <select
                        value={(project as any).subtitle_position || 'auto'}
                        onChange={(e) => {
                          soundEngine.playSfx('tick', { styleId: project.gaya_video });
                          onUpdateProject({
                            ...project,
                            subtitle_position: e.target.value,
                          } as any);
                        }}
                        className={`w-full border rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none ${
                          isDark
                            ? 'bg-[#020817] border-blue-500/25 text-slate-100'
                            : 'bg-sky-50/50 border-sky-200 text-slate-900'
                        }`}
                      >
                        {(CAPTION_POSITIONS as Array<{ id: string; label: string }>).map((pos) => (
                          <option key={pos.id} value={pos.id}>
                            {pos.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className={`block text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Lebar Teks Subtitle
                      </label>
                      <div className={`flex items-center gap-1 p-1 rounded-xl border ${isDark ? 'bg-[#020817] border-blue-500/25' : 'bg-sky-50 border-sky-200'}`}>
                        {CAPTION_WIDTH_CHOICES.map((cw) => (
                          <button
                            key={cw.id}
                            type="button"
                            onClick={() => {
                              soundEngine.playSfx('tick', { styleId: project.gaya_video });
                              onUpdateProject({
                                ...project,
                                caption_width: cw.id,
                              } as any);
                            }}
                            className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                              Number((project as any).caption_width || 1) === cw.id
                                ? 'bg-[#2563EB] text-white'
                                : isDark
                                  ? 'text-slate-400 hover:text-white'
                                  : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {cw.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeQuickTab === 'latar' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <label className={`block text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Suasana Latar
                      </label>
                      <select
                        value={(project as any).background_override || 'auto'}
                        onChange={(e) =>
                          onUpdateProject({
                            ...project,
                            background_override: e.target.value,
                          } as any)
                        }
                        className={`w-full border rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none ${
                          isDark
                            ? 'bg-[#020817] border-blue-500/25 text-slate-100'
                            : 'bg-sky-50/50 border-sky-200 text-slate-900'
                        }`}
                      >
                        <option value="auto">Otomatis per scene</option>
                        <option value="paper">Selalu Terang (Paper)</option>
                        <option value="dusk">Selalu Senja (Dusk)</option>
                        <option value="night">Selalu Gelap (Night)</option>
                        <option value="polos">Polos Tanpa Pola</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className={`block text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Gerakan Kamera (Scene {selectedSceneIdx + 1})
                      </label>
                      <select
                        value={activeScene.camera_movement || (activeScene as any).cameraMotion || 'auto'}
                        onChange={(e) => {
                          const updated = scenes.map((s, i) =>
                            i === selectedSceneIdx
                              ? { ...s, camera_movement: e.target.value as any, cameraMotion: e.target.value }
                              : s
                          );
                          onUpdateProject({ ...project, scenes: updated });
                        }}
                        className={`w-full border rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none ${
                          isDark
                            ? 'bg-[#020817] border-blue-500/25 text-slate-100'
                            : 'bg-sky-50/50 border-sky-200 text-slate-900'
                        }`}
                      >
                        <option value="auto">Otomatis sesuai gaya</option>
                        {(SATSET_CAMERA_MODES as Array<{ id: string; label: string; hint: string }>).map((cam) => (
                          <option key={cam.id} value={cam.id}>
                            {cam.label} - {cam.hint}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className={`block text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Transisi (Scene {selectedSceneIdx + 1})
                      </label>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={activeScene.transition_type || (activeScene as any).transition || project.transition || 'auto'}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'auto') {
                              soundEngine.playSfx('sparkle', { styleId: project.gaya_video });
                            } else {
                              soundEngine.playTransitionSfx(val, project.gaya_video);
                            }
                            const updated = scenes.map((s, i) =>
                              i === selectedSceneIdx
                                ? { ...s, transition_type: val as any, transition: val }
                                : s
                            );
                            onUpdateProject({ ...project, scenes: updated });
                          }}
                          className={`flex-1 min-w-0 border rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none ${
                            isDark
                              ? 'bg-[#020817] border-blue-500/25 text-slate-100'
                              : 'bg-sky-50/50 border-sky-200 text-slate-900'
                          }`}
                        >
                          <option value="auto">Otomatis sesuai gaya</option>
                          {(SATSET_TRANSITIONS as Array<{ id: string; label: string; hint: string }>).map((tr) => (
                            <option key={tr.id} value={tr.id}>
                              {tr.label} - {tr.hint}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          title="Tes efek suara transisi scene ini"
                          onClick={() =>
                            soundEngine.playTransitionSfx(
                              activeScene.transition_type || (activeScene as any).transition || project.transition || 'whip-left',
                              project.gaya_video
                            )
                          }
                          className={`px-2 py-1.5 rounded-xl border text-[11px] font-bold shrink-0 cursor-pointer ${
                            isDark
                              ? 'bg-[#020817] border-blue-500/30 text-sky-300 hover:border-sky-400'
                              : 'bg-sky-50 border-sky-200 text-blue-700 hover:bg-sky-100'
                          }`}
                        >
                          ▶ SFX
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Kamera tenang toggle (satsetmotion.id parity) */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={Boolean((project as any).calm_camera)}
                        onChange={(e) => {
                          soundEngine.playSfx('tap', { styleId: project.gaya_video });
                          onUpdateProject({
                            ...project,
                            calm_camera: e.target.checked,
                          } as any);
                        }}
                        className="rounded w-3.5 h-3.5 accent-[#2563EB]"
                      />
                      <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                        Kamera tenang (haluskan guncangan &amp; zoom)
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = scenes.map((s) => ({
                          ...s,
                          transition_type: activeScene.transition_type || project.transition || 'auto',
                          transition: activeScene.transition_type || project.transition || 'auto',
                        }));
                        soundEngine.playSfx('sparkle', { styleId: project.gaya_video });
                        onUpdateProject({ ...project, scenes: updated });
                      }}
                      className="text-[11px] font-bold text-sky-400 hover:underline cursor-pointer"
                    >
                      Terapkan transisi ke semua scene
                    </button>
                  </div>
                </div>
              )}

              {activeQuickTab === 'logo' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraphMotionBrandLogo size={20} />
                      <label className={`block text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Watermark Logo Graph Motion Resmi
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateProject({
                          ...project,
                          watermark: project.watermark === '' ? 'Graph Motion' : '',
                        })
                      }
                      className="text-[11px] font-bold text-sky-400 hover:underline cursor-pointer"
                    >
                      {project.watermark === '' ? 'Tampilkan Logo Graph Motion' : 'Sembunyikan'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={project.watermark === '' ? '' : project.watermark || 'Graph Motion'}
                    onChange={(e) =>
                      onUpdateProject({
                        ...project,
                        watermark: e.target.value,
                      })
                    }
                    placeholder="Graph Motion (kosongkan jika tanpa watermark)"
                    className={`w-full border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-sky-400 ${
                      isDark
                        ? 'bg-[#020817] border-blue-500/25 text-slate-100'
                        : 'bg-sky-50/50 border-sky-200 text-slate-900'
                    }`}
                  />
                </div>
              )}

              {(activeQuickTab === 'thumbnail' || activeQuickTab === 'judul') && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      Judul Hook 0.5 Detik Pertama
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !(project as any).hook_enabled;
                        onUpdateProject({
                          ...project,
                          hook_enabled: next,
                          hook_top: (project as any).hook_top || 'FAKTA PENTING',
                          hook_big: (project as any).hook_big || (project.title || 'MULAI SEKARANG').slice(0, 22),
                          hook_bottom: (project as any).hook_bottom || 'Tonton sampai habis',
                        } as any);
                        if (next) setCurrentTimeSec(0.1);
                      }}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        (project as any).hook_enabled
                          ? 'bg-[#2563EB] text-white'
                          : isDark
                            ? 'bg-[#020817] border border-blue-500/25 text-slate-300'
                            : 'bg-sky-50 border border-sky-200 text-slate-600'
                      }`}
                    >
                      {(project as any).hook_enabled ? 'Aktif (0.5d)' : 'Nonaktif'}
                    </button>
                  </div>

                  {(project as any).hook_enabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={(project as any).hook_top || ''}
                        onChange={(e) =>
                          onUpdateProject({ ...project, hook_top: e.target.value } as any)
                        }
                        placeholder="Teks kecil atas"
                        className={`border rounded-xl px-2.5 py-1.5 text-xs font-bold ${
                          isDark
                            ? 'bg-[#020817] border-blue-500/25 text-slate-100'
                            : 'bg-sky-50/50 border-sky-200 text-slate-900'
                        }`}
                      />
                      <input
                        type="text"
                        value={(project as any).hook_big || ''}
                        onChange={(e) =>
                          onUpdateProject({ ...project, hook_big: e.target.value } as any)
                        }
                        placeholder="JUDUL UTAMA"
                        className={`border rounded-xl px-2.5 py-1.5 text-xs font-extrabold ${
                          isDark
                            ? 'bg-[#020817] border-blue-500/25 text-sky-300'
                            : 'bg-sky-50/50 border-sky-200 text-slate-900'
                        }`}
                      />
                      <input
                        type="text"
                        value={(project as any).hook_bottom || ''}
                        onChange={(e) =>
                          onUpdateProject({ ...project, hook_bottom: e.target.value } as any)
                        }
                        placeholder="Subjudul bawah"
                        className={`border rounded-xl px-2.5 py-1.5 text-xs font-bold ${
                          isDark
                            ? 'bg-[#020817] border-blue-500/25 text-slate-100'
                            : 'bg-sky-50/50 border-sky-200 text-slate-900'
                        }`}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {exportSuccessBanner && exportResult && (
            <div
              data-testid="export-mp4-success-banner"
              className="bg-emerald-500/15 border border-emerald-500/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-300 font-bold"
            >
              <div className="space-y-0.5">
                <span className="block">
                  ✓ Video {exportResult.resolution} ({exportResult.width}×{exportResult.height} ·{' '}
                  {formatBytes(exportResult.bytes)}) selesai dirender sebagai .{exportResult.extension}!
                </span>
                <span className="text-[11px] text-emerald-400/80 font-mono font-normal block">
                  File: {exportResult.filename}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid="export-mp4-redownload-btn"
                  onClick={() => triggerBlobDownload(exportResult.url, exportResult.filename)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh lagi (.{exportResult.extension})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExportSuccessBanner(false)}
                  className="text-emerald-300 hover:text-white px-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {exportError && (
            <div className="bg-rose-500/15 border border-rose-500/40 rounded-2xl p-4 flex items-center justify-between text-xs text-rose-300 font-bold">
              <span>{exportError}</span>
              <button
                type="button"
                onClick={() => setExportError(null)}
                className="text-rose-300 hover:text-white px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* ========================================================== */}
          {/* EXPORT VIDEO CARD (MP4 · 1080p / 2K / 4K · VO · SFX · BGM) */}
          {/* ========================================================== */}
          <div
            className={`rounded-2xl p-5 sm:p-6 border space-y-4 ${
              isDark
                ? 'bg-[#041029]/95 border-blue-500/20 shadow-[0_20px_50px_rgba(2,8,23,0.65)]'
                : 'bg-white border-sky-200/80 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-blue-500/15">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400 block">
                  RENDER &amp; AUDIO MIXER
                </span>
                <h4 className={`font-extrabold text-xs sm:text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  Export video {selectedResolution} ({exportDimensions.width}×{exportDimensions.height}) · {selectedFps} FPS
                </h4>
              </div>
              <span className="font-mono text-[10px] font-bold px-2.5 py-1 rounded bg-blue-500/15 text-sky-300 border border-blue-500/30">
                .MP4 · H.264
              </span>
            </div>

            {/* Resolusi & FPS Selector (1080p / 2K / 4K) */}
            <div className="space-y-2 pb-2 border-b border-blue-500/15">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Kualitas Resolusi Video
                </span>
                <div
                  className={`inline-flex items-center gap-1 p-1 rounded-xl border ${
                    isDark ? 'bg-[#020817] border-blue-500/25' : 'bg-sky-50 border-sky-200'
                  }`}
                >
                  {([30, 60] as const).map((fpsOpt) => (
                    <button
                      key={fpsOpt}
                      type="button"
                      onClick={() => {
                        soundEngine.playSfx('tick', { styleId: project.gaya_video });
                        onUpdateProject({ ...project, export_fps: fpsOpt });
                      }}
                      className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition cursor-pointer ${
                        selectedFps === fpsOpt
                          ? 'bg-[#2563EB] text-white'
                          : isDark
                            ? 'text-slate-400 hover:text-white'
                            : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {fpsOpt} FPS
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['1080p', '2K', '4K'] as ExportResolutionPreset[]).map((resId) => {
                  const spec = EXPORT_RESOLUTION_SPECS[resId];
                  const dims = getExportPixelDimensions(project.aspect_ratio || '9:16', resId);
                  const active = selectedResolution === resId;
                  return (
                    <button
                      key={resId}
                      type="button"
                      data-testid={`export-res-btn-${resId}`}
                      onClick={() => {
                        soundEngine.playSfx('click', { styleId: project.gaya_video });
                        onUpdateProject({ ...project, export_resolution: resId });
                      }}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        active
                          ? 'bg-[#2563EB] border-sky-400 text-white shadow-sm shadow-blue-600/30'
                          : isDark
                            ? 'bg-[#020817] border-blue-500/25 text-slate-300 hover:border-sky-400/60'
                            : 'bg-sky-50/70 border-sky-200 text-slate-800 hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold">{resId}</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                            active ? 'bg-white/20 text-white' : 'bg-blue-500/15 text-sky-400'
                          }`}
                        >
                          {spec.bitrateLabel}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono block mt-0.5 ${
                          active ? 'text-sky-100' : isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {dims.width}×{dims.height}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Suara Narator (Voice Over) toggle */}
            <div className="flex items-center justify-between text-xs pb-2 border-b border-blue-500/15">
              <button
                type="button"
                onClick={() => {
                  const next = !voEnabled;
                  setVoEnabled(next);
                  if (!next) {
                    voiceStudio.stop();
                    spokenSceneKeyRef.current = '';
                  } else {
                    soundEngine.playSfx('pop', { styleId: project.gaya_video });
                  }
                }}
                className={`flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                <Volume2 className={`w-3.5 h-3.5 ${voEnabled ? 'text-sky-400' : 'text-slate-500'}`} />
                <span>Suara narator (VO) {voEnabled ? 'ON' : 'OFF'}</span>
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {project.voice_character || 'Fenrir'}
                </span>
                <button
                  type="button"
                  onClick={onNavigateToVoice}
                  className="text-[11px] font-bold text-sky-400 hover:underline cursor-pointer"
                >
                  Atur VO ➔
                </button>
              </div>
            </div>

            {/* Efek suara & Transisi ON slider */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const next = !sfxEnabled;
                  setSfxEnabled(next);
                  soundEngine.setSfxEnabled(next);
                  if (next) soundEngine.playSfx('pop', { styleId: project.gaya_video });
                }}
                className={`flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                <Volume2 className={`w-3.5 h-3.5 ${sfxEnabled ? 'text-sky-400' : 'text-slate-500'}`} />
                <span>Efek suara &amp; transisi {sfxEnabled ? 'ON' : 'OFF'}</span>
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={sfxVolume}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSfxVolume(val);
                  soundEngine.setSfxVolume(val / 100);
                }}
                className={`flex-1 h-1.5 rounded-lg appearance-none cursor-pointer accent-[#2563EB] ${
                  isDark ? 'bg-slate-800' : 'bg-sky-200'
                }`}
              />
              <span className={`text-xs font-mono font-bold w-8 text-right tabular-nums ${isDark ? 'text-sky-300' : 'text-blue-700'}`}>
                {sfxVolume}%
              </span>
            </div>

            {/* Quick SFX Audition & Style Flavor bar */}
            <div
              className={`flex flex-wrap items-center justify-between gap-2 text-[11px] border rounded-xl px-3.5 py-2.5 ${
                isDark
                  ? 'bg-[#020817]/80 border-blue-500/20 text-slate-300'
                  : 'bg-sky-50/60 border-sky-200 text-slate-700'
              }`}
            >
              <span>
                Karakter SFX tema:{' '}
                <strong className="text-sky-400 uppercase font-mono">
                  {getSatsetStyleSfxFlavor(resolveSatsetStyleId(project.gaya_video))}
                </strong>
              </span>
              <div className="flex items-center flex-wrap gap-1.5">
                {(['pop', 'whoosh', 'ding'] as const).map((cue) => (
                  <button
                    key={cue}
                    type="button"
                    onClick={() => soundEngine.playSfx(cue, { styleId: project.gaya_video })}
                    className={`px-2 py-0.5 rounded-md border font-mono text-[10px] font-bold uppercase cursor-pointer transition ${
                      isDark
                        ? 'bg-[#041029] border-blue-500/25 text-slate-200 hover:border-sky-400'
                        : 'bg-white border-sky-200 text-blue-700 hover:bg-sky-50'
                    }`}
                  >
                    ♪ {cue}
                  </button>
                ))}
                <button
                  type="button"
                  data-testid="test-transition-sfx-btn"
                  onClick={() =>
                    soundEngine.playTransitionSfx(
                      activeScene.transition_type || project.transition || 'whip-left',
                      project.gaya_video
                    )
                  }
                  className="font-bold text-sky-400 hover:underline cursor-pointer pl-1"
                >
                  ▶ Tes suara transisi
                </button>
              </div>
            </div>

            {/* Musik latar (opsional): Upload audio + Volume slider + Remove */}
            <div className="space-y-2 pt-1">
              <input
                ref={bgmInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleBgmFileSelected}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <span className={`font-semibold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    Musik latar (opsional)
                  </span>
                  {bgmName && (
                    <span className="text-[10px] font-mono text-sky-400 truncate block max-w-[220px]">
                      ♫ {bgmName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {bgmUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        if (bgmUrl.startsWith('blob:')) URL.revokeObjectURL(bgmUrl);
                        setBgmUrl(null);
                        setBgmName('');
                        onUpdateProject({ ...project, bgm_url: null, bgm_name: '' } as any);
                      }}
                      className="px-2.5 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-[11px] font-bold cursor-pointer hover:bg-rose-500/20"
                    >
                      Hapus
                    </button>
                  )}
                  <button
                    type="button"
                    data-testid="select-bgm-btn"
                    onClick={() => bgmInputRef.current?.click()}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 ${
                      isDark
                        ? 'bg-[#020817] border-blue-500/25 text-sky-300 hover:border-sky-400'
                        : 'bg-sky-50 border-sky-200 text-blue-700 hover:bg-sky-100'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{bgmName ? 'Ganti audio' : 'Pilih file audio'}</span>
                  </button>
                </div>
              </div>

              {bgmUrl && (
                <div className="flex items-center gap-3 text-xs pl-1">
                  <span className={`text-[11px] font-semibold shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Volume BGM
                  </span>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={bgmVolume}
                    onChange={(e) => setBgmVolume(Number(e.target.value))}
                    className={`flex-1 h-1.5 rounded-lg appearance-none cursor-pointer accent-[#2563EB] ${
                      isDark ? 'bg-slate-800' : 'bg-sky-200'
                    }`}
                  />
                  <span className="font-mono text-[11px] font-bold text-sky-400 w-8 text-right tabular-nums">
                    {bgmVolume}%
                  </span>
                </div>
              )}
            </div>

            {/* Export Button (.mp4 download) */}
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                data-testid="export-mp4-btn"
                onClick={handleExportVideo}
                disabled={isExporting}
                className="flex-1 py-3.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-75 active:scale-[0.99] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2 relative overflow-hidden cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isExporting
                    ? `Merender .MP4 (${selectedResolution})... ${exportProgress}%`
                    : `Export & Unduh .MP4 (${selectedResolution})`}
                </span>
                <span className="px-2 py-0.5 rounded bg-white/20 text-white font-mono text-[10px] font-bold">
                  {selectedFps} FPS
                </span>
              </button>

              {isExporting && (
                <button
                  type="button"
                  onClick={() => exportAbortRef.current?.abort()}
                  className="py-3.5 px-4 rounded-xl border border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 text-xs font-extrabold cursor-pointer transition"
                >
                  Batal
                </button>
              )}
            </div>
          </div>

          {/* ========================================================== */}
          {/* TIMELINE STRIP CARD */}
          {/* ========================================================== */}
          <div
            className={`rounded-2xl p-5 border space-y-3 ${
              isDark
                ? 'bg-[#041029]/95 border-blue-500/20'
                : 'bg-white border-sky-200/80 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-sky-400" />
                <span className={`font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  Timeline Sekuens
                </span>
                <span className={`font-mono text-[11px] tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {scenes.length || 8} scene · {totalDuration.toFixed(1)} dtk · {animatedCount} siap
                </span>
              </div>
            </div>

            {/* Horizontal scrollable thumbnails strip */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar">
              {scenes.map((scene, idx) => {
                const isActive = idx === selectedSceneIdx;
                const isAnim = isSceneAnimated(idx);
                const dur = scene.target_duration_sec || scene.durationSeconds || 7.5;

                return (
                  <button
                    key={scene.id || idx}
                    type="button"
                    onClick={() => {
                      setSelectedSceneIdx(idx);
                      let t = 0;
                      for (let i = 0; i < idx; i++) {
                        t += scenes[i].target_duration_sec || scenes[i].durationSeconds || 7.5;
                      }
                      handleSeek(t);
                    }}
                    className={`w-[74px] h-[98px] rounded-xl shrink-0 p-2 flex flex-col justify-between border-2 transition relative overflow-hidden text-left cursor-pointer ${
                      isActive
                        ? 'border-sky-400 bg-blue-950/90 shadow-[0_0_16px_rgba(56,189,248,0.3)]'
                        : isDark
                          ? 'border-blue-500/25 hover:border-blue-400/50 bg-[#020817]'
                          : 'border-sky-200 hover:border-blue-400 bg-sky-50/70'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono text-[9px] font-bold text-sky-400">
                        S{(idx + 1).toString().padStart(2, '0')}
                      </span>
                      <span className={`font-mono text-[9px] tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {dur}s
                      </span>
                    </div>

                    {isAnim ? (
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-lg border border-dashed border-sky-400/50 flex items-center justify-center mx-auto">
                        <Play className="w-3 h-3 text-sky-400/70" />
                      </div>
                    )}

                    <div
                      className={`rounded px-1 py-0.5 text-center truncate text-[8px] font-mono font-bold ${
                        isDark ? 'bg-[#041029] text-slate-300' : 'bg-white text-slate-700'
                      }`}
                    >
                      {isAnim ? 'CUSTOM' : 'AUTO'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: TEMPEL HASIL PROMPT SCENE (REMOTION ANIMATED GRAPHICS) */}
      {/* ========================================================== */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl border space-y-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 ${
              isDark
                ? 'bg-[#041029] border-blue-500/30 text-slate-100'
                : 'bg-white border-sky-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-sky-400 flex items-center justify-center">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">
                    Tempel Hasil Prompt Scene {selectedSceneIdx + 1}
                  </h3>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Animasi video grafik Remotion akan langsung tampil di layar preview
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPasteModalOpen(false)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition cursor-pointer ${
                  isDark
                    ? 'bg-[#020817] text-slate-400 hover:text-white'
                    : 'bg-sky-50 text-slate-500 hover:text-slate-900'
                }`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              <div
                className={`p-3.5 border rounded-xl text-[11px] leading-relaxed ${
                  isDark
                    ? 'bg-[#020817]/90 border-blue-500/25 text-slate-300'
                    : 'bg-sky-50/70 border-sky-200 text-slate-700'
                }`}
              >
                <strong className="text-sky-400 block mb-0.5 font-mono uppercase tracking-wider text-[10px]">
                  ALUR KERJA GRAPH MOTION:
                </strong>
                Kirim perintah ke AI pilihanmu → salin jawabannya → tempel di bawah ini. Begitu disimpan, kanvas preview akan menampilkan <strong>video grafik animasi Remotion</strong> untuk Scene {selectedSceneIdx + 1}.
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Kode Animasi Canvas 2D (`s.*`) / Jawaban AI
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const sample = getSampleRemotionCode(
                        selectedSceneIdx + 1,
                        activeScene.narration_text || activeScene.voiceScript || 'Kenapa Pagi Terasa Berat?'
                      );
                      setModalPasteError(null);
                      setScenePasteInput(sample);
                    }}
                    className="text-[11px] font-bold text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Code2 className="w-3 h-3" />
                    <span>Gunakan Contoh Animasi Siap Pakai</span>
                  </button>
                </div>

                <textarea
                  data-testid="modal-paste-textarea"
                  rows={8}
                  value={scenePasteInput}
                  onChange={(e) => {
                    setScenePasteInput(e.target.value);
                    if (modalPasteError) setModalPasteError(null);
                  }}
                  placeholder={`// Tempel body kode Canvas 2D (s.*) untuk Scene ${selectedSceneIdx + 1} di sini...\n// Contoh:\ns.text3d("FOKUS UTAMA", s.cx, s.cy - 40, {\n  size: 56,\n  color: s.c.orange,\n  draw: s.pop(0.1),\n});`}
                  className="w-full bg-[#020817] border border-blue-500/30 rounded-xl p-3.5 text-xs font-mono text-emerald-300 placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />

                {modalPasteError && (
                  <div
                    data-testid="modal-paste-error"
                    className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-3.5 py-2.5 text-xs text-rose-300 flex items-start gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{modalPasteError}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-blue-500/20 flex flex-col sm:flex-row items-center gap-2 justify-between">
              <div>
                {currentSceneIsAnimated && (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playSfx('click');
                      const existingCodes = { ...(project.scene_codes || {}) };
                      delete existingCodes[selectedSceneIdx + 1];
                      const updated = {
                        ...project,
                        scene_codes: existingCodes,
                      };
                      onUpdateProject(updated);
                      setCanvasSceneError(null);
                      setModalPasteError(null);
                      setIsPasteModalOpen(false);
                    }}
                    className="text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/15 border border-rose-500/30 px-3 py-2 rounded-xl transition cursor-pointer"
                  >
                    Hapus Animasi Scene Ini
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    const totalScenes = scenes.length || 8;
                    const batchAttempt = parseBatchSceneCodes(scenePasteInput, 1, totalScenes);
                    if (batchAttempt.ok && batchAttempt.parsedSceneNumbers.length > 1) {
                      soundEngine.playSfx('ding');
                      const existingCodes = { ...(project.scene_codes || {}) };
                      for (const num of batchAttempt.parsedSceneNumbers) {
                        if (batchAttempt.scenesByNumber[num]) {
                          existingCodes[num] = batchAttempt.scenesByNumber[num];
                        }
                      }
                      const highest = Math.max(...batchAttempt.parsedSceneNumbers);
                      onUpdateProject({
                        ...project,
                        scenes_animated_count: Math.max(animatedCount, highest),
                        scene_codes: existingCodes,
                      });
                      setModalPasteError(null);
                      setCanvasSceneError(null);
                      setIsPasteModalOpen(false);
                      setAnimationSavedSuccess({
                        start: batchAttempt.parsedSceneNumbers[0] ?? 1,
                        end: highest,
                        count: batchAttempt.parsedSceneNumbers.length,
                        warning: batchAttempt.warning,
                      });
                      return;
                    }

                    const singleAttempt = parseSingleSceneCode(scenePasteInput, selectedSceneIdx + 1);
                    if (!singleAttempt.ok || !singleAttempt.code) {
                      soundEngine.playSfx('click');
                      setModalPasteError(
                        singleAttempt.error ||
                          'Kode belum valid. Untuk mengisi banyak scene berbeda sekaligus, pisahkan dengan `// ===== SCENE N =====`.'
                      );
                      return;
                    }

                    soundEngine.playSfx('ding');
                    const existingCodes = { ...(project.scene_codes || {}) };
                    for (let s = 1; s <= totalScenes; s++) {
                      existingCodes[s] = singleAttempt.code;
                    }
                    const updated = {
                      ...project,
                      scenes_animated_count: totalScenes,
                      scene_codes: existingCodes,
                    };
                    onUpdateProject(updated);
                    setModalPasteError(null);
                    setCanvasSceneError(null);
                    setIsPasteModalOpen(false);
                    setAnimationSavedSuccess({ start: 1, end: totalScenes, count: totalScenes });
                  }}
                  className={`flex-1 sm:flex-initial py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    isDark
                      ? 'bg-[#020817] border-blue-500/30 text-slate-200 hover:border-sky-400'
                      : 'bg-sky-50 border-sky-200 text-slate-800 hover:bg-sky-100'
                  }`}
                >
                  Terapkan ke Semua ({scenes.length || 8} Scene)
                </button>

                <button
                  type="button"
                  data-testid="modal-paste-save-btn"
                  onClick={() => {
                    const parsed = parseSingleSceneCode(scenePasteInput, selectedSceneIdx + 1);
                    if (!parsed.ok || !parsed.code) {
                      soundEngine.playSfx('click');
                      setModalPasteError(
                        parsed.error || 'Kode animasi tidak valid. Periksa sintaks JavaScript `s.*`.'
                      );
                      return;
                    }

                    soundEngine.playSfx('ding');
                    const existingCodes = { ...(project.scene_codes || {}) };
                    existingCodes[selectedSceneIdx + 1] = parsed.code;

                    const updatedCount = Math.max(animatedCount, selectedSceneIdx + 1);
                    const updated = {
                      ...project,
                      scenes_animated_count: updatedCount,
                      scene_codes: existingCodes,
                    };
                    onUpdateProject(updated);
                    setModalPasteError(null);
                    setCanvasSceneError(null);
                    setIsPasteModalOpen(false);
                    setAnimationSavedSuccess({
                      start: selectedSceneIdx + 1,
                      end: selectedSceneIdx + 1,
                      count: 1,
                    });
                  }}
                  className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan & Tampilkan Animasi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SendToAiModal
        isOpen={Boolean(aiBatchPicker)}
        onClose={() => setAiBatchPicker(null)}
        title={
          aiBatchPicker
            ? `Pilih AI untuk Scene ${aiBatchPicker.startNum}–${aiBatchPicker.endNum}`
            : 'Pilih AI Tujuan Pengiriman'
        }
        subtitle="Pilih platform AI terlebih dahulu — kode prompt adegan & seluruh gambar media pada batch ini akan disiapkan otomatis."
        promptText={aiBatchPicker?.promptText || ''}
        mediaItems={aiBatchPicker?.mediaItems || []}
        onDispatched={() => {
          if (aiBatchPicker) {
            setInlinePasteError(null);
            setInlinePasteWarning(null);
            setInlinePasteGroup({
              start: aiBatchPicker.startNum,
              end: aiBatchPicker.endNum,
            });
            setTimeout(() => {
              document
                .querySelector('[data-testid="inline-paste-container"]')
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 80);
          }
        }}
      />
    </div>
  );
};

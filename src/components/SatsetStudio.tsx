import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Send,
  Copy,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Download,
  Camera,
  Code2,
  Mic,
  Music,
  Plus,
  Trash2,
  ArrowRight,
  Check,
  Crown,
  Lightbulb,
  FileText,
  Volume2,
  Film,
  Lock,
  Flame,
  Globe,
  Radio,
  Palette,
  Zap,
  Crop,
  Layers,
  Clock,
  FolderOpen,
  Home,
  Sun,
  Moon,
  Upload,
  LayoutGrid,
  AlertTriangle,
} from 'lucide-react';
import {
  SatsetProject,
  SatsetScene,
  SatsetStyleModule,
  VoiceOption,
  SubtitleStyle,
  ContentType,
  StartMode,
  LanguageOption,
  AspectRatio,
  TempoOption,
  CharacterOption,
  CharacterDimension,
  TransitionOption,
  BgmStyle,
  IdeaConcept,
} from '../types/satset';
import { SATSET_MODULES, StyleModuleInfo } from '../data/satset-modules';
import { SatsetCanvasPlayer } from './SatsetCanvasPlayer';
import { VoiceSoundStudio } from './VoiceSoundStudio';
import { PromptBlueprintModal } from './PromptBlueprintModal';
import { ProjectManagerModal } from './ProjectManagerModal';
import { StyleModulePickerModal } from './StyleModulePickerModal';
import { CustomStyleModal } from './CustomStyleModal';
import { CharacterPickerModal } from './CharacterPickerModal';
import { TransitionPickerModal } from './TransitionPickerModal';
import { CharacterMotionDemoModal } from './CharacterMotionDemoModal';
import { CharacterBuilderModal } from './CharacterBuilderModal';
import { CharacterAvatarCanvas } from './CharacterAvatarCanvas';
import { TransitionPreviewCanvas } from './TransitionPreviewCanvas';
import {
  getCharacterMeta,
  getTransitionMeta,
  resolveCharacterOption,
} from '../utils/character-catalog';
import { CustomCharacterConfig } from '../utils/custom-character';
import { getStoredCustomStyles, CustomStyleDefinition } from '../utils/custom-style-parser';
import {
  exportSatsetProjectToMp4,
  normalizeExportResolution,
  triggerBlobDownload,
} from '../utils/video-export';
import { SatsetAnimationStudio } from './SatsetAnimationStudio';
import { soundEngine } from '../utils/audio-synth';
import {
  generateRemotionCode,
  buildPromptBlueprint,
  buildNarasiPrompt,
  parseAndValidateAIBlueprint,
  SAMPLE_AI_NARASI_JSON,
} from '../utils/remotion-generator';
import {
  synchronizeProjectPipeline,
  getPipelineStepStatus,
} from '../utils/pipeline-sync';
import { SendToAiModal } from './SendToAiModal';
import { collectProjectPromptImages, PromptMediaAttachment } from '../utils/ai-platform-router';
import {
  extractWebsiteUrl,
  buildWebsitePromoProfile,
  buildWebsitePromoConcepts,
  buildWebsitePromoScenes,
  buildNonRepeatingScenesFromConcept,
} from '../utils/website-promo-engine';
import { resolveAutoStyleForConceptAndScene } from '../utils/contextual-scene-builder';
import {
  computeAutoTargetDuration,
  ensureWebsitePromoSnapshotsRegistered,
  getStepFocusRegion,
  processUploadedTutorialMediaFiles,
  registerSceneUploadedMediaAsset,
} from '../utils/website-media-engine';
import { CreatorSessionUser } from './LandingPage3D';
import { GraphMotionBrandLockup, GraphMotionLogoMark } from './GraphMotionBrandLogo';

interface SatsetStudioProps {
  initialProject: SatsetProject;
  projects?: SatsetProject[];
  initialStep?: StudioNavStep;
  currentUser?: CreatorSessionUser | null;
  themeMode?: 'dark' | 'light';
  onChangeThemeMode?: (mode: 'dark' | 'light') => void;
  onBackToLanding?: () => void;
  onOpenRemotionCode: (p: SatsetProject) => void;
  onOpenAutoRemotion: () => void;
  onSelectProject?: (id: string) => void;
  onCreateNewProject?: (name: string) => void;
  onDeleteProject?: (id: string) => void;
  onUpdateProject?: (p: SatsetProject) => void;
}

export type StudioNavStep = 'ide' | 'naskah' | 'suara' | 'animasi';
type IdeSubTab = 'atur' | 'pilih_ide';
type NaskahSubTab = 'atur' | 'naskah';

export const SatsetStudio: React.FC<SatsetStudioProps> = ({
  initialProject,
  projects = [],
  initialStep = 'ide',
  currentUser,
  themeMode = 'dark',
  onChangeThemeMode,
  onBackToLanding,
  onOpenRemotionCode,
  onOpenAutoRemotion,
  onSelectProject,
  onCreateNewProject,
  onDeleteProject,
  onUpdateProject,
}) => {
  const isLight = themeMode === 'light';
  const hasActiveProject = projects.length > 0;
  const [emptyStudioProjectName, setEmptyStudioProjectName] = useState('');
  const [project, setProject] = useState<SatsetProject>(() =>
    synchronizeProjectPipeline(initialProject)
  );
  const [currentStep, setCurrentStep] = useState<StudioNavStep>(initialStep);
  const [ideSubTab, setIdeSubTab] = useState<IdeSubTab>('atur');
  const [naskahSubTab, setNaskahSubTab] = useState<NaskahSubTab>('atur');
  const [creatorNote, setCreatorNote] = useState<string>('jangan lupa follow');
  const [isDurationDropdownOpen, setIsDurationDropdownOpen] = useState(false);
  const [showPasteTooltip, setShowPasteTooltip] = useState<boolean>(true);
  const [isVideoSettingsOpen, setIsVideoSettingsOpen] = useState<boolean>(false);
  const [copiedNarasiPrompt, setCopiedNarasiPrompt] = useState(false);
  const [inlinePasteText, setInlinePasteText] = useState('');
  const [showInlinePasteBox, setShowInlinePasteBox] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [promptModalMode, setPromptModalMode] = useState<'idea' | 'narasi'>('idea');
  const [promptModalPasteOnly, setPromptModalPasteOnly] = useState<boolean>(true);
  const [showTempoTooltip, setShowTempoTooltip] = useState<boolean>(true);
  const [showNextTooltip, setShowNextTooltip] = useState<boolean>(true);
  const narasiPasteRef = useRef<HTMLDivElement | null>(null);

  // Modals
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [aiPickerState, setAiPickerState] = useState<{
    isOpen: boolean;
    mode: 'idea' | 'narasi';
    title: string;
    subtitle: string;
    promptText: string;
    mediaItems: PromptMediaAttachment[];
  } | null>(null);
  const [isCustomStyleModalOpen, setIsCustomStyleModalOpen] = useState(false);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [isCharacterDemoOpen, setIsCharacterDemoOpen] = useState(false);
  const [demoPreviewCharacter, setDemoPreviewCharacter] = useState<CharacterOption | null>(null);
  const [demoPreviewDimension, setDemoPreviewDimension] = useState<CharacterDimension | null>(null);
  const [isCharacterBuilderOpen, setIsCharacterBuilderOpen] = useState(false);
  const [editingCustomCharacter, setEditingCustomCharacter] = useState<CustomCharacterConfig | null>(null);
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement | null>(null);

  // Accordions for "Karakter" & "Warna brand" collapsed by default for a clean UI
  const [isCharacterOpen, setIsCharacterOpen] = useState(false);
  const [isBrandColorOpen, setIsBrandColorOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Form values in Tab 1 (Ide - Atur)
  const initialTargetDur = project.target_duration_sec || project.durationSeconds || 60;
  const [startMode, setStartMode] = useState<StartMode>(project.start_mode || 'topic');
  const [language, setLanguage] = useState<LanguageOption>(project.language || 'id');
  const [contentType, setContentType] = useState<ContentType>(project.content_type || 'motivasi');
  const [topic, setTopic] = useState(project.topik_video || project.topic || '');
  const [websiteUrlInput, setWebsiteUrlInput] = useState<string>(
    project.source_url || extractWebsiteUrl(project.topik_video || '') || ''
  );
  const [isAnalyzingWebsite, setIsAnalyzingWebsite] = useState<boolean>(false);
  const [websitePromoStatus, setWebsitePromoStatus] = useState<string | null>(null);
  const [durationPreset, setDurationPreset] = useState<'auto' | '30' | '50' | '60' | 'custom'>(
    project.duration_mode ||
      (initialTargetDur === 30
        ? '30'
        : initialTargetDur === 50
        ? '50'
        : initialTargetDur === 60
        ? '60'
        : 'auto')
  );
  const [customDuration, setCustomDuration] = useState<number>(initialTargetDur);
  const tutorialMediaInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedModule, setSelectedModule] = useState<SatsetStyleModule>(project.gaya_video || project.styleModule || 'otomatis');
  const [character, setCharacter] = useState<CharacterOption>(() => resolveCharacterOption(project.character || 'kreator_3d_studio'));
  const [characterFraming, setCharacterFraming] = useState<'full' | 'bust' | 'closeup' | 'orb'>(project.character_framing || 'full');
  const [characterDimension, setCharacterDimension] = useState<CharacterDimension>(project.character_dimension || '3d');
  const [characterGender, setCharacterGender] = useState<'pria' | 'wanita'>(project.character_gender || 'pria');
  const [characterWithObjects, setCharacterWithObjects] = useState<boolean>(project.character_with_objects ?? true);
  const [characterFullBackstory, setCharacterFullBackstory] = useState<boolean>(project.character_full_backstory ?? false);

  const [brandColorMode, setBrandColorMode] = useState<'auto' | 'custom'>(project.brand_mode || 'auto');
  const [brandColor, setBrandColor] = useState(project.warna_brand || project.brandColor || '#2563EB');
  const [brandSecondaryColor, setBrandSecondaryColor] = useState(project.brand_secondary_color || '#1e3a8a');
  const [brandAccentColor, setBrandAccentColor] = useState(project.brand_accent_color || '#facc15');
  const [brandPresetName, setBrandPresetName] = useState(project.brand_preset_name || 'Kopi Senja');

  const [transition, setTransition] = useState<TransitionOption>(project.transition || 'otomatis');
  const [tempo, setTempo] = useState<TempoOption>(project.tempo || 'energik');
  const [targetAudience, setTargetAudience] = useState<string>(project.target_audience || 'pelajar');
  const [ideaCount, setIdeaCount] = useState<number>(project.idea_count || 5);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(project.aspect_ratio || '9:16');
  const [watermark, setWatermark] = useState(project.watermark || 'Graph Motion');
  const [customStylePrompt, setCustomStylePrompt] = useState(project.custom_style_prompt || '');

  // Animation & Player states for Tab 4
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const currentTimeSecRef = useRef<number>(0);
  const lastTriggeredSceneRef = useRef<number>(-1);

  const totalDuration = project.target_duration_sec || project.durationSeconds || 30;
  const totalFrames = Math.round(totalDuration * (project.fps || 30));
  const currentFrame = Math.round(currentTimeSec * (project.fps || 30));

  const lastSyncedProjectIdRef = useRef<string>(initialProject.id);
  const onUpdateProjectRef = useRef(onUpdateProject);
  onUpdateProjectRef.current = onUpdateProject;

  // Sync state only when switching to a different project ID
  useEffect(() => {
    if (lastSyncedProjectIdRef.current === initialProject.id) {
      return;
    }
    lastSyncedProjectIdRef.current = initialProject.id;
    const explicitTargetDur = initialProject.target_duration_sec || initialProject.durationSeconds;
    const synced = synchronizeProjectPipeline(initialProject);
    if (explicitTargetDur && explicitTargetDur >= 15 && synced.scenes.length <= 2) {
      synced.target_duration_sec = explicitTargetDur;
      synced.durationSeconds = explicitTargetDur;
    }
    setProject(synced);
    setTopic(synced.topik_video || synced.topic || '');
    const nextDur = synced.target_duration_sec || synced.durationSeconds || 60;
    setDurationPreset(nextDur === 30 ? '30' : nextDur === 50 ? '50' : nextDur === 60 ? '60' : 'custom');
    setCustomDuration(nextDur);
    if (synced.start_mode) setStartMode(synced.start_mode);
    if (synced.language) setLanguage(synced.language);
    if (synced.content_type) setContentType(synced.content_type);
    if (synced.gaya_video) setSelectedModule(synced.gaya_video);
    if (synced.aspect_ratio) setAspectRatio(synced.aspect_ratio);
    if (synced.character) setCharacter(resolveCharacterOption(synced.character));
    if (synced.character_framing) setCharacterFraming(synced.character_framing);
    if (synced.character_dimension) setCharacterDimension(synced.character_dimension);
    if (synced.character_gender) setCharacterGender(synced.character_gender);
    if (synced.character_with_objects !== undefined) setCharacterWithObjects(synced.character_with_objects);
    if (synced.character_full_backstory !== undefined) setCharacterFullBackstory(synced.character_full_backstory);
    if (synced.warna_brand) setBrandColor(synced.warna_brand);
    if (synced.brand_secondary_color) setBrandSecondaryColor(synced.brand_secondary_color);
    if (synced.brand_accent_color) setBrandAccentColor(synced.brand_accent_color);
    if (synced.brand_mode) setBrandColorMode(synced.brand_mode);
    if (synced.transition) setTransition(synced.transition);
    if (synced.tempo) setTempo(synced.tempo);
    if (synced.target_audience) setTargetAudience(synced.target_audience);
    if (synced.idea_count) setIdeaCount(synced.idea_count);
  }, [initialProject]);

  useEffect(() => {
    if (initialStep) {
      setCurrentStep(initialStep);
    }
  }, [initialStep]);

  // Close unified header menu on outside click or Escape key
  useEffect(() => {
    if (!isHeaderMenuOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
        setIsHeaderMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsHeaderMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isHeaderMenuOpen]);

  const handleUpdateFullProject = useCallback(
    (
      updated: SatsetProject,
      syncOptions?: { recalculateDurations?: boolean; forceStyleSync?: boolean }
    ) => {
      const synchronized = synchronizeProjectPipeline(updated, syncOptions);
      const withCode = {
        ...synchronized,
        remotionCode: generateRemotionCode(synchronized, 30),
      };
      setProject(withCode);
      onUpdateProjectRef.current?.(withCode);
    },
    []
  );

  // Playback Loop (never calls sibling setState inside a state updater)
  useEffect(() => {
    if (!isPlaying) {
      soundEngine.stopSoundtrack();
      return;
    }

    soundEngine.startSoundtrack(
      project.bgm_style === 'upbeat_synth' ? 'cyberSynth' : 'lofiBeat',
      project.bgm_volume ?? 0.6
    );

    lastTimeRef.current = performance.now();
    let lastHudSyncAt = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.1, Math.max(0, (now - lastTimeRef.current) / 1000));
      lastTimeRef.current = now;

      const next = currentTimeSecRef.current + dt;
      if (next >= totalDuration) {
        currentTimeSecRef.current = totalDuration;
        setCurrentTimeSec(totalDuration);
        setIsPlaying(false);
        soundEngine.stopSoundtrack();
        return;
      }

      currentTimeSecRef.current = next;
      // Throttle parent React HUD updates (~10fps); SatsetCanvasPlayer renders smooth 60fps canvas internally
      if (now - lastHudSyncAt >= 90) {
        lastHudSyncAt = now;
        setCurrentTimeSec(next);
      }
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      soundEngine.stopSoundtrack();
    };
  }, [isPlaying, totalDuration, project.scenes, project.bgm_style, project.bgm_volume]);

  const togglePlay = () => {
    soundEngine.unlock().catch(() => {});
    if (currentTimeSec >= totalDuration) {
      currentTimeSecRef.current = 0;
      setCurrentTimeSec(0);
      lastTriggeredSceneRef.current = -1;
    }
    setIsPlaying((prev) => !prev);
  };

  const handleSeek = (newSec: number) => {
    const clamped = Math.max(0, Math.min(newSec, totalDuration));
    currentTimeSecRef.current = clamped;
    setCurrentTimeSec(clamped);
    lastTriggeredSceneRef.current = -1;
  };

  const autoCalculatedDuration = useMemo(
    () =>
      computeAutoTargetDuration(
        project.scenes,
        project.uploaded_tutorial_media,
        tempo === 'santai' ? 'santai' : 'energik'
      ),
    [project.scenes, project.uploaded_tutorial_media, tempo]
  );

  const calculatedDuration =
    durationPreset === 'auto'
      ? autoCalculatedDuration
      : durationPreset === '30'
      ? 30
      : durationPreset === '50'
      ? 50
      : durationPreset === '60'
      ? 60
      : customDuration;

  const handleChangeTargetDuration = (
    preset: 'auto' | '30' | '50' | '60' | 'custom',
    overrideCustom?: number
  ) => {
    setDurationPreset(preset);
    const nextCustom =
      overrideCustom !== undefined ? Math.max(10, Math.min(180, overrideCustom)) : customDuration;
    if (overrideCustom !== undefined) {
      setCustomDuration(nextCustom);
    }
    const nextDur =
      preset === 'auto'
        ? autoCalculatedDuration
        : preset === '30'
        ? 30
        : preset === '50'
        ? 50
        : preset === '60'
        ? 60
        : nextCustom;
    const nextProject: SatsetProject = {
      ...project,
      duration_mode: preset,
      target_duration_sec: nextDur,
      durationSeconds: nextDur,
    };
    setProject(nextProject);
    onUpdateProjectRef.current?.(nextProject);
  };

  const handleUploadTutorialMediaFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const items = await processUploadedTutorialMediaFiles(files);
    if (items.length === 0) return;

    const isWebsiteMode = startMode === 'url' || Boolean(project.website_promo);
    const existingUploads = [...(project.uploaded_tutorial_media || []), ...items];
    const baseScenes = [...(project.scenes || [])];
    const targetCount = Math.max(baseScenes.length, items.length);
    const updatedScenes: SatsetScene[] = [];

    for (let i = 0; i < targetCount; i++) {
      const existingScene = baseScenes[i] || {
        id: `scene-${i + 1}`,
        scene_number: i + 1,
        sceneNumber: i + 1,
        role: i === 0 ? 'hook' : i === targetCount - 1 ? 'cta' : 'body_core_point',
        target_duration_sec: 5,
        durationSeconds: 5,
        narration_text: `Langkah ke-${i + 1}: perhatikan visual pada tahapan ini dan ikuti poin utama yang disorot.`,
        on_screen_text: `TAHAP 0${i + 1}`,
        emphasis_words: ['Langkah', 'visual', 'utama'],
      };
      const assignedMedia = items[i] || (i < existingUploads.length ? existingUploads[i] : undefined);
      if (assignedMedia) {
        const mediaDur =
          assignedMedia.type === 'video' && assignedMedia.durationSec
            ? Math.max(3.5, Math.min(10, Math.round(assignedMedia.durationSec * 10) / 10))
            : existingScene.target_duration_sec || 5;
        const merged: SatsetScene = {
          ...existingScene,
          target_duration_sec: mediaDur,
          durationSeconds: mediaDur,
          media_url: assignedMedia.url,
          media_type: assignedMedia.type,
          media_key: assignedMedia.key,
          media_filename: assignedMedia.filename,
          visualModule: isWebsiteMode ? 'uiweb' : existingScene.visualModule || selectedModule,
          focus_region:
            existingScene.focus_region ||
            getStepFocusRegion(existingScene.website_step?.layoutVariant, i),
          website_step: isWebsiteMode
            ? existingScene.website_step || {
                stepNumber: i + 1,
                totalSteps: targetCount,
                stepBadge: `LANGKAH 0${i + 1}`,
                urlDisplay: project.source_url || assignedMedia.filename,
                brandName: project.project_title || 'Studio Web',
                screenTitle: assignedMedia.filename.replace(/\.[^.]+$/, ''),
                screenSubtitle: `Langkah ${i + 1} dari ${targetCount}`,
                highlightMetric: assignedMedia.type === 'video' ? 'VIDEO ASLI' : 'VISUAL ASLI',
                actionLabel: `Langkah ${i + 1}`,
                layoutVariant: i === 0 ? 'hero_overview' : 'dashboard_metrics',
                uiCards: [
                  { label: `TAHAP 0${i + 1}`, value: assignedMedia.filename.slice(0, 22), badge: 'AKTIF' },
                  { label: 'KAMERA', value: 'Fokus Area Penting', badge: 'SMOOTH' },
                  { label: 'REMOTION', value: 'Animasi Sinkron', badge: 'READY' },
                ],
                primaryColor: brandColor,
                secondaryColor: brandSecondaryColor,
                accentColor: brandAccentColor,
              }
            : existingScene.website_step,
        };
        registerSceneUploadedMediaAsset(merged);
        updatedScenes.push(merged);
      } else {
        updatedScenes.push(existingScene);
      }
    }

    const autoDur = computeAutoTargetDuration(updatedScenes, existingUploads, 'energik');
    setDurationPreset('auto');
    setCustomDuration(autoDur);
    soundEngine.playSfx('sparkle');
    setWebsitePromoStatus(
      `${items.length} bahan foto/video (${items.map((x) => x.filename).join(', ')}) berhasil dipasang ke ${updatedScenes.length} adegan Remotion.`
    );
    handleUpdateFullProject(
      {
        ...project,
        duration_mode: 'auto',
        target_duration_sec: autoDur,
        durationSeconds: autoDur,
        uploaded_tutorial_media: existingUploads,
        scenes: updatedScenes,
        scene_codes: {},
      },
      { recalculateDurations: false, forceStyleSync: true }
    );
  };

  const handleUploadSingleSceneMedia = async (sceneIdx: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const items = await processUploadedTutorialMediaFiles([files[0]]);
    const item = items[0];
    if (!item) return;

    const isWebsiteMode = startMode === 'url' || Boolean(project.website_promo);
    const updatedScenes = [...project.scenes];
    const targetScene = updatedScenes[sceneIdx];
    if (!targetScene) return;

    const mediaDur =
      item.type === 'video' && item.durationSec
        ? Math.max(3.5, Math.min(10, Math.round(item.durationSec * 10) / 10))
        : targetScene.target_duration_sec || 5;

    const nextScene: SatsetScene = {
      ...targetScene,
      target_duration_sec: mediaDur,
      durationSeconds: mediaDur,
      media_url: item.url,
      media_type: item.type,
      media_key: item.key,
      media_filename: item.filename,
      visualModule: isWebsiteMode ? 'uiweb' : targetScene.visualModule || selectedModule,
      focus_region: targetScene.focus_region || {
        fx: 0.5,
        fy: 0.45,
        zoom: 1.15,
      },
    };
    registerSceneUploadedMediaAsset(nextScene);
    updatedScenes[sceneIdx] = nextScene;

    const nextCodes = { ...(project.scene_codes || {}) };
    const scNo = nextScene.nomor || nextScene.scene_number || nextScene.sceneNumber || sceneIdx + 1;
    delete nextCodes[scNo];

    soundEngine.playSfx('sparkle');
    handleUpdateFullProject(
      {
        ...project,
        uploaded_tutorial_media: [...(project.uploaded_tutorial_media || []), item],
        scenes: updatedScenes,
        scene_codes: nextCodes,
      },
      { recalculateDurations: false, forceStyleSync: true }
    );
  };

  // Kirim perintah ke AI: buka pemilih AI terlebih dahulu beserta prompt & gambar yang diatur
  const handleKirimKeAI = () => {
    setIsPlaying(false);
    setPromptModalMode('idea');
    const currentP: Partial<SatsetProject> = {
      ...project,
      project_title: project.project_title || project.title || topic || 'Proyek Video',
      topik_video: topic,
      target_duration_sec: calculatedDuration,
      gaya_video: selectedModule,
      warna_brand: brandColor,
      tempo,
      aspect_ratio: aspectRatio,
    };
    const promptText = buildPromptBlueprint(currentP);
    const mediaItems = collectProjectPromptImages(currentP);
    soundEngine.playSfx('click');

    setAiPickerState({
      isOpen: true,
      mode: 'idea',
      title: 'Pilih AI untuk Prompt Ide Video',
      subtitle:
        'Pilih AI tujuan terlebih dahulu (Claude, ChatGPT, Gemini, dll). Prompt & gambar yang diatur akan langsung diarahkan ke AI pilihanmu.',
      promptText,
      mediaItems,
    });
  };

  // Kirim perintah narasi ke AI: buka pemilih AI terlebih dahulu beserta prompt & gambar yang diatur
  const handleKirimNarasiKeAI = () => {
    setIsPlaying(false);
    setPromptModalMode('narasi');
    const currentP: Partial<SatsetProject> = {
      ...project,
      project_title: project.project_title || project.title || 'Kenapa Pagi Terasa Berat?',
      topik_video: topic,
      target_duration_sec: calculatedDuration,
      gaya_video: selectedModule,
      warna_brand: brandColor,
      tempo,
      aspect_ratio: aspectRatio,
      selected_idea_id: project.selected_idea_id,
      idea_concepts: project.idea_concepts,
      creator_note: creatorNote,
    };
    const promptText = buildNarasiPrompt(currentP, creatorNote);
    const mediaItems = collectProjectPromptImages(currentP);
    soundEngine.playSfx('click');

    setAiPickerState({
      isOpen: true,
      mode: 'narasi',
      title: 'Pilih AI untuk Prompt Narasi Scene',
      subtitle:
        'Pilih AI tujuan terlebih dahulu. Setelah dipilih, AI akan dibuka dengan prompt narasi lengkap & aset media proyek.',
      promptText,
      mediaItems,
    });
  };

  const handleSalinPromptNarasi = () => {
    const currentP: Partial<SatsetProject> = {
      ...project,
      project_title: project.project_title || project.title || 'Kenapa Pagi Terasa Berat?',
      topik_video: topic,
      target_duration_sec: calculatedDuration,
      gaya_video: selectedModule,
      warna_brand: brandColor,
      tempo,
      aspect_ratio: aspectRatio,
      selected_idea_id: project.selected_idea_id,
      idea_concepts: project.idea_concepts,
      creator_note: creatorNote,
    };
    const promptText = buildNarasiPrompt(currentP, creatorNote);
    try {
      navigator.clipboard.writeText(promptText);
      setCopiedNarasiPrompt(true);
      setTimeout(() => setCopiedNarasiPrompt(false), 2500);
    } catch (e) {
      // ignore
    }
  };

  const handleApplyInlineNarasi = (textToApply: string) => {
    setPasteError(null);
    const res = parseAndValidateAIBlueprint(textToApply);
    if (!res.success || !res.project) {
      setPasteError(res.error || 'Format JSON tidak valid.');
      return;
    }
    handleUpdateFullProject({
      ...project,
      ...res.project,
      gaya_video: res.project.gaya_video || selectedModule,
      character,
      aspect_ratio: res.project.aspect_ratio || aspectRatio,
      warna_brand: brandColor,
      tempo,
      creator_note: creatorNote,
    } as SatsetProject);
    setNaskahSubTab('naskah');
    setShowInlinePasteBox(false);
    setInlinePasteText('');
  };

  // Smart Website Auto-Promotion Pipeline:
  // Analyzes any website URL entered by the user, generates 5 tailored promo concepts,
  // and builds 8 distinct step-by-step website screenshot/UI walkthrough scenes with Remotion code and SFX.
  const handleAutoPromoteWebsite = async (
    rawUrlOverride?: string,
    nextStep: StudioNavStep = 'naskah'
  ) => {
    const candidateInput = (rawUrlOverride ?? websiteUrlInput ?? topic).trim();
    const normalizedUrl = extractWebsiteUrl(candidateInput);
    if (!normalizedUrl) {
      setWebsitePromoStatus('Masukkan alamat URL website terlebih dahulu (contoh: https://namabrand.com).');
      soundEngine.playSfx('click');
      return;
    }
    setWebsiteUrlInput(normalizedUrl);
    setStartMode('url');
    setContentType('promosi');
    setIsAnalyzingWebsite(true);
    setWebsitePromoStatus(null);
    soundEngine.playSfx('click');

    const targetDur = calculatedDuration >= 36 ? calculatedDuration : 48;
    const targetScenesCount = 8;
    setCustomDuration(targetDur);
    setDurationPreset('auto');

    try {
      const resp = await fetch('/api/website-promo/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: normalizedUrl,
          target_duration_sec: targetDur,
          scene_count: targetScenesCount,
          gaya_video: selectedModule,
          character,
          tempo,
          aspect_ratio: aspectRatio,
          voice_option: project.voice_option || 'fenrir',
          subtitle_style: project.subtitle_style || 'satsetYellow',
          watermark: 'Graph Motion',
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data?.project && data?.profile) {
          const p = data.project as SatsetProject;
          const prof = data.profile;
          ensureWebsitePromoSnapshotsRegistered(prof, p.scenes);
          setTopic(`${prof.url} - ${prof.brandName}: ${prof.tagline}`);
          setBrandColor(prof.primaryColor);
          setBrandSecondaryColor(prof.secondaryColor);
          setBrandAccentColor(prof.accentColor);
          setBrandColorMode('custom');
          setBrandPresetName(prof.brandName);
          setWatermark('Graph Motion');

          handleUpdateFullProject(
            {
              ...project,
              ...p,
              watermark: 'Graph Motion',
              duration_mode: 'auto',
              subtitle_position: 'auto',
              id: project.id,
            },
            { recalculateDurations: false, forceStyleSync: true }
          );
          soundEngine.playSfx('sparkle');
          setWebsitePromoStatus(
            `Bahan gambar/video asli dari ${prof.brandName} (${p.scenes.length} scene) siap dipakai.`
          );
          setCurrentStep(nextStep);
          if (nextStep === 'naskah') {
            setNaskahSubTab('naskah');
          }
          setIsAnalyzingWebsite(false);
          return;
        }
      }
    } catch {
      // Fallback to instant client-side website promo generator below
    }

    // Instant client-side Website Auto-Promotion Engine fallback
    const profile = buildWebsitePromoProfile(normalizedUrl);
    const concepts = buildWebsitePromoConcepts(profile);
    const scenes = buildWebsitePromoScenes(profile, targetScenesCount, targetDur, concepts[0]);
    ensureWebsitePromoSnapshotsRegistered(profile, scenes);
    const nextTopic = `${profile.url} - ${profile.brandName}: ${profile.tagline}`;
    setTopic(nextTopic);
    setBrandColor(profile.primaryColor);
    setBrandSecondaryColor(profile.secondaryColor);
    setBrandAccentColor(profile.accentColor);
    setBrandColorMode('custom');
    setBrandPresetName(profile.brandName);
    setWatermark('Graph Motion');

    const updated: SatsetProject = {
      ...project,
      project_title: `${profile.brandName} - ${profile.tagline}`,
      title: `${profile.brandName} - ${profile.tagline}`,
      start_mode: 'url',
      source_url: profile.url,
      website_promo: profile,
      content_type: 'promosi',
      topik_video: nextTopic,
      topic: nextTopic,
      duration_mode: 'auto',
      subtitle_position: 'auto',
      target_duration_sec: targetDur,
      durationSeconds: targetDur,
      gaya_video: selectedModule,
      styleModule: selectedModule,
      character,
      warna_brand: profile.primaryColor,
      brandColor: profile.primaryColor,
      brand_secondary_color: profile.secondaryColor,
      brand_accent_color: profile.accentColor,
      brand_mode: 'custom',
      brand_preset_name: profile.brandName,
      tempo,
      aspect_ratio: aspectRatio,
      watermark: 'Graph Motion',
      idea_concepts: concepts,
      selected_idea_id: concepts[0].id,
      scenes,
    };

    handleUpdateFullProject(updated, { recalculateDurations: false, forceStyleSync: true });
    soundEngine.playSfx('sparkle');
    setWebsitePromoStatus(
      `Berhasil menganalisis ${profile.url} (${profile.brandName}): ${scenes.length} scene langkah website + tampilan asli website siap diputar!`
    );
    setCurrentStep(nextStep);
    if (nextStep === 'naskah') {
      setNaskahSubTab('naskah');
    }
    setIsAnalyzingWebsite(false);
  };

  // Choose concept from "Pilih Ide" -> Build structured, non-repeating narrative arc calibrated to calculatedDuration
  const handleSelectConcept = (concept: IdeaConcept) => {
    const targetScenesCount =
      calculatedDuration >= 90 ? 10 : calculatedDuration >= 60 ? 8 : calculatedDuration >= 50 ? 6 : 4;

    const updatedScenes = buildNonRepeatingScenesFromConcept(
      concept,
      {
        ...project,
        topik_video: topic,
        source_url: startMode === 'url' ? websiteUrlInput : project.source_url,
        gaya_video: selectedModule,
        warna_brand: brandColor,
        brand_secondary_color: brandSecondaryColor,
        brand_accent_color: brandAccentColor,
      },
      targetScenesCount,
      calculatedDuration
    );

    const updated: SatsetProject = {
      ...project,
      selected_idea_id: concept.id,
      project_title: concept.title,
      title: concept.title,
      target_duration_sec: calculatedDuration,
      durationSeconds: calculatedDuration,
      gaya_video: selectedModule,
      styleModule: selectedModule,
      character,
      warna_brand: brandColor,
      brandColor,
      tempo,
      aspect_ratio: aspectRatio,
      scenes: updatedScenes,
    };
    handleUpdateFullProject(updated, { recalculateDurations: false, forceStyleSync: true });
    setCurrentStep('naskah');
    setNaskahSubTab('naskah');
  };


  // Update specific scene field in Tab 2 (Naskah)
  const handleUpdateScene = (idx: number, field: keyof SatsetScene, val: any) => {
    const updatedScenes = [...project.scenes];
    updatedScenes[idx] = {
      ...updatedScenes[idx],
      [field]: val,
    };
    if (field === 'on_screen_text') updatedScenes[idx].hookText = val;
    if (field === 'hookText') updatedScenes[idx].on_screen_text = val;
    if (field === 'narration_text') updatedScenes[idx].voiceScript = val;
    if (field === 'voiceScript') updatedScenes[idx].narration_text = val;
    if (field === 'target_duration_sec') updatedScenes[idx].durationSeconds = Number(val);
    if (field === 'durationSeconds') updatedScenes[idx].target_duration_sec = Number(val);

    const updated = { ...project, scenes: updatedScenes };
    handleUpdateFullProject(updated);
  };

  const handleAddScene = () => {
    const newIdx = project.scenes.length + 1;
    const newScene: SatsetScene = {
      id: `sc-${newIdx}-${Date.now().toString(36)}`,
      scene_number: newIdx,
      role: 'body_core_point',
      target_duration_sec: 5,
      durationSeconds: 5,
      narration_text: 'Tulis penjelasan poin baru di sini...',
      voiceScript: 'Tulis penjelasan poin baru di sini...',
      on_screen_text: `Poin ${newIdx}: Langkah Nyata`,
      hookText: `Poin ${newIdx}: Langkah Nyata`,
      emphasis_words: ['Langkah', 'Nyata'],
      emphasisWords: ['Langkah', 'Nyata'],
      visual_animation: {
        layout: 'split_text_and_graphic',
        remotion_animation: 'spring_pop_in',
        asset_elements: ['check_icon'],
      },
      sfx: {
        file: 'pop_ding.mp3',
        type: 'pop',
        play_at_second: 0.2,
      },
      visualModule: selectedModule,
      accentColor: brandColor,
      secondaryColor: '#facc15',
      sfxCue: 'pop',
      visualDescription: 'Adegan baru ditambahkan',
    };

    const updatedScenes = [...project.scenes, newScene];
    handleUpdateFullProject({ ...project, scenes: updatedScenes });
  };

  const handleDeleteScene = (idx: number) => {
    if (project.scenes.length <= 1) return;
    const updatedScenes = project.scenes.filter((_, i) => i !== idx).map((s, i) => ({
      ...s,
      scene_number: i + 1,
      sceneNumber: i + 1,
    }));
    handleUpdateFullProject({ ...project, scenes: updatedScenes });
  };

  const handleStartRecording = async () => {
    setIsRecording(true);
    setRecordProgress(0);
    setIsPlaying(false);
    currentTimeSecRef.current = 0;
    setCurrentTimeSec(0);

    try {
      const resolution = normalizeExportResolution(project.export_resolution || '1080p');
      const res = await exportSatsetProjectToMp4({
        project,
        resolution,
        fps: project.export_fps === 30 ? 30 : 60,
        voEnabled: true,
        sfxEnabled: true,
        onProgress: (pct) => setRecordProgress(pct),
      });
      triggerBlobDownload(res.url, res.filename);
      setTimeout(() => URL.revokeObjectURL(res.url), 60_000);
      setRecordProgress(100);
    } catch (err) {
      console.error('MP4 Export error:', err);
    } finally {
      setIsRecording(false);
    }
  };

  const handleSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `satset-frame-${currentTimeSec.toFixed(1)}s.png`;
    a.click();
  };

  // Find active module metadata (including custom user-created styles)
  const activeModuleMeta = useMemo<StyleModuleInfo>(() => {
    const customStyles = getStoredCustomStyles();
    const activeCustom = customStyles.find((c) => c.id === selectedModule);
    if (activeCustom) {
      return {
        id: activeCustom.id as SatsetStyleModule,
        title: activeCustom.name,
        subtitle: 'Gaya Kustom Pengguna',
        category: 'custom' as const,
        categoryLabel: 'BUATAN SENDIRI',
        categories: ['custom'],
        description: activeCustom.prompt || 'Gaya kustom buatan sendiri dengan instruksi AI & Canvas Remotion.',
        accentColor: activeCustom.colors?.[0] || '#38bdf8',
        secondaryColor: activeCustom.colors?.[1] || '#818cf8',
        defaultSfx: 'pop',
        icon: 'Layers',
        renderType: 'custom' as const,
        customStyleDefinition: activeCustom,
        demoChapters: [
          {
            chapterNumber: 1,
            totalChapters: 4,
            badgeText: '01',
            headline: 'Mulai dari langkah kecil',
            subtext: activeCustom.prompt || 'Mulai dari langkah kecil.',
            highlightWord: 'langkah',
          },
        ],
      };
    }
    return SATSET_MODULES.find((m) => m.id === selectedModule) || SATSET_MODULES[0];
  }, [selectedModule, isStyleModalOpen, isCustomStyleModalOpen]);

  const handleSaveCustomStyleDirectly = (newStyle: CustomStyleDefinition) => {
    const newMod = newStyle.id as SatsetStyleModule;
    setSelectedModule(newMod);
    if (newStyle.colors && newStyle.colors.length > 0) {
      setBrandColor(newStyle.colors[0]);
    }
    const updatedScenes = project.scenes.map((s) => ({
      ...s,
      visualModule: newMod,
      accentColor: newStyle.colors?.[0] || s.accentColor,
      secondaryColor: newStyle.colors?.[1] || s.secondaryColor,
    }));
    handleUpdateFullProject({
      ...project,
      gaya_video: newMod,
      warna_brand: newStyle.colors?.[0] || project.warna_brand,
      scenes: updatedScenes,
    });
    setIsCustomStyleModalOpen(false);
  };

  const pipelineStages = useMemo(() => getPipelineStepStatus(project), [project]);

  return (
    <div
      data-testid="graph-motion-studio-root"
      className={`flex flex-col h-full overflow-hidden font-sans relative transition-colors duration-300 ${
        isLight
          ? 'studio-theme-light bg-[#eef6ff] text-slate-900'
          : 'studio-theme-dark bg-[#03091c] text-[#f0f9ff]'
      }`}
    >
      {/* Subtle architectural Graph Motion spatial grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: isLight
            ? 'radial-gradient(rgba(37, 99, 235, 0.22) 1.2px, transparent 1.2px)'
            : 'radial-gradient(rgba(56, 189, 248, 0.24) 1.2px, transparent 1.2px)',
          backgroundSize: '22px 22px',
        }}
      />

      {/* TOP BAR: Brand/Back, Active Project Selector, Theme Switcher, 3D Home Link & Code Export */}
      <header
        className={`h-14 border-b px-2.5 sm:px-6 flex items-center justify-between gap-2 shrink-0 z-30 relative transition-colors ${
          isLight
            ? 'border-blue-200 bg-white/95 shadow-2xs'
            : 'border-sky-400/20 bg-[#05102a]/95 shadow-lg shadow-black/30'
        }`}
      >
        {/* Left: Back button + Brand + Project Title */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
          {hasActiveProject && currentStep !== 'ide' && (
            <button
              type="button"
              onClick={() => {
                if (currentStep === 'animasi') setCurrentStep('suara');
                else if (currentStep === 'suara') setCurrentStep('naskah');
                else if (currentStep === 'naskah') setCurrentStep('ide');
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-blue-500/15 flex items-center justify-center text-sky-400 transition cursor-pointer shrink-0"
              title="Kembali ke tahap sebelumnya"
            >
              <ChevronDown className="w-5 h-5 rotate-90" />
            </button>
          )}

          <button
            type="button"
            data-testid="studio-brand-logo-btn"
            onClick={() => onBackToLanding?.()}
            className="group relative inline-flex items-center px-1 sm:px-1.5 py-1 rounded-xl hover:bg-blue-500/10 transition cursor-pointer shrink-0"
            title="Kembali ke Halaman Utama 3D"
          >
            <span className="inline-flex sm:hidden">
              <GraphMotionLogoMark
                className="w-7 h-7 drop-shadow-[0_0_12px_rgba(56,189,248,0.45)]"
              />
            </span>
            <span className="hidden sm:inline-flex">
              <GraphMotionBrandLockup isLight={isLight} size="sm" />
            </span>
          </button>

          <button
            type="button"
            data-testid="studio-project-selector-btn"
            onClick={() => setIsProjectModalOpen(true)}
            className={`flex items-center gap-1 sm:gap-1.5 cursor-pointer group py-1.5 px-2.5 sm:px-3 rounded-xl border transition min-w-0 max-w-full sm:max-w-xs ${
              isLight
                ? 'border-blue-200/80 bg-blue-50/70 hover:border-blue-400 text-slate-900'
                : 'border-sky-400/25 bg-[#091b42]/80 hover:border-sky-400/60 text-sky-100'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="font-bold text-xs sm:text-sm group-hover:text-sky-400 transition tracking-tight truncate min-w-0">
              {hasActiveProject
                ? project.idea_concepts?.find((c) => c.id === project.selected_idea_id)?.title ||
                  project.project_title ||
                  project.title ||
                  'Proyek Tanpa Judul'
                : 'Belum Ada Proyek'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          </button>
        </div>

        {/* Right CTA: Unified Single Icon Menu for Beranda, Tema Gelap/Terang, & Kode & Export */}
        <div ref={headerMenuRef} className="relative flex items-center shrink-0">
          <button
            type="button"
            data-testid="studio-header-menu-btn"
            aria-label="Menu & Pengaturan Tab Studio"
            aria-expanded={isHeaderMenuOpen}
            title="Beranda 3D, Tema Gelap/Terang, Kode & Export"
            onClick={() => setIsHeaderMenuOpen((prev) => !prev)}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition cursor-pointer relative ${
              isHeaderMenuOpen
                ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/25'
                : isLight
                ? 'bg-blue-50/90 border-blue-200 text-blue-800 hover:bg-blue-100'
                : 'bg-[#091b42] border-sky-400/30 text-sky-200 hover:border-sky-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span
              aria-hidden="true"
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${
                isLight
                  ? 'bg-amber-400 border-white'
                  : 'bg-sky-400 border-[#05102a]'
              }`}
            />
          </button>

          {isHeaderMenuOpen && (
            <div
              data-testid="studio-header-menu-dropdown"
              role="menu"
              aria-label="Tab & Pengaturan Studio"
              className={`absolute right-0 top-full mt-2 w-64 rounded-2xl border p-2.5 shadow-2xl z-50 space-y-2 backdrop-blur-xl ${
                isLight
                  ? 'bg-white/95 border-blue-200 text-slate-900 shadow-blue-950/15'
                  : 'bg-[#061433]/98 border-sky-400/30 text-slate-100 shadow-black/60'
              }`}
            >
              {currentUser && (
                <div
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl border ${
                    isLight
                      ? 'bg-blue-50/70 border-blue-100'
                      : 'bg-[#030b20]/80 border-sky-400/15'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-sky-400 text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                    {(currentUser.name || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{currentUser.name}</p>
                    {currentUser.email && (
                      <p className={`text-[10px] truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {currentUser.email}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <span
                  className={`block px-2 pt-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isLight ? 'text-slate-500' : 'text-sky-400/80'
                  }`}
                >
                  Navigasi &amp; Tab
                </span>

                {onBackToLanding && (
                  <button
                    type="button"
                    role="menuitem"
                    data-testid="studio-back-landing-btn"
                    onClick={() => {
                      setIsHeaderMenuOpen(false);
                      onBackToLanding();
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isLight
                        ? 'text-slate-800 hover:bg-blue-50 hover:text-blue-700'
                        : 'text-slate-200 hover:bg-blue-950/80 hover:text-sky-300'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Home className="w-3.5 h-3.5 text-sky-400" />
                      <span>Beranda 3D</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                )}

                {hasActiveProject && (
                  <button
                    type="button"
                    role="menuitem"
                    data-testid="studio-menu-code-export-btn"
                    onClick={() => {
                      setIsHeaderMenuOpen(false);
                      onOpenRemotionCode(project);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white shadow-sm transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Kode &amp; Export</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                  </button>
                )}

                <button
                  type="button"
                  role="menuitem"
                  data-testid="studio-menu-uploader-btn"
                  onClick={() => {
                    setIsHeaderMenuOpen(false);
                    onOpenAutoRemotion();
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isLight
                      ? 'text-slate-800 hover:bg-blue-50 hover:text-blue-700'
                      : 'text-slate-200 hover:bg-blue-950/80 hover:text-sky-300'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Upload className="w-3.5 h-3.5 text-sky-400" />
                    <span>Upload Modul TSX</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              </div>

              <div className={`pt-2 border-t ${isLight ? 'border-blue-100' : 'border-sky-400/15'} space-y-1.5`}>
                <span
                  className={`block px-2 text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isLight ? 'text-slate-500' : 'text-sky-400/80'
                  }`}
                >
                  Tema Tampilan
                </span>
                <div
                  role="group"
                  aria-label="Pilih Tema Studio"
                  className={`grid grid-cols-2 gap-1 p-1 rounded-xl border text-[11px] font-semibold ${
                    isLight
                      ? 'bg-blue-50 border-blue-200 text-slate-700'
                      : 'bg-[#030b20] border-sky-400/25 text-blue-200'
                  }`}
                >
                  <button
                    type="button"
                    data-testid="studio-theme-dark-btn"
                    onClick={() => onChangeThemeMode?.('dark')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      !isLight
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-blue-950'
                    }`}
                  >
                    <Moon className="w-3 h-3" />
                    <span>Deep Blue</span>
                  </button>
                  <button
                    type="button"
                    data-testid="studio-theme-light-btn"
                    onClick={() => onChangeThemeMode?.('light')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      isLight
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-blue-300/75 hover:text-white'
                    }`}
                  >
                    <Sun className="w-3 h-3" />
                    <span>Ice Blue</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* MAIN BODY WORKSPACE (SCROLLABLE) */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 pt-5 sm:pt-7 pb-28 sm:pb-32 z-10 relative">
        {!hasActiveProject ? (
          <div
            data-testid="studio-empty-project-state"
            className="max-w-2xl mx-auto my-8 sm:my-14"
          >
            <div
              className={`rounded-3xl p-7 sm:p-10 border text-center space-y-6 transition-colors ${
                isLight
                  ? 'bg-white/95 border-blue-200 shadow-[0_24px_60px_rgba(37,99,235,0.10)]'
                  : 'bg-[#041029]/95 border-sky-400/25 shadow-[0_28px_80px_rgba(2,8,23,0.9)]'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${
                    isLight
                      ? 'bg-blue-50 border-blue-200 shadow-sm'
                      : 'bg-[#07183c] border-sky-400/30 shadow-[0_0_30px_rgba(56,189,248,0.18)]'
                  }`}
                >
                  <GraphMotionLogoMark className="w-10 h-10" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-sky-400 font-bold">
                  WORKSPACE STUDIO KOSONG
                </span>
                <h2
                  className={`text-xl sm:text-2xl font-extrabold tracking-tight ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  Belum Ada Proyek Video Remotion
                </h2>
                <p
                  className={`text-xs sm:text-sm max-w-md mx-auto leading-relaxed ${
                    isLight ? 'text-slate-600' : 'text-blue-100/75'
                  }`}
                >
                  Halaman tools Remotion saat ini masih kosong karena kamu belum membuat proyek. Buat proyek pertamamu di bawah ini atau buka menu Kelola Proyek untuk memulai pipeline Ide, Narasi, Suara, dan Animasi.
                </p>
              </div>

              <div
                className={`p-4 sm:p-5 rounded-2xl border text-left space-y-3 max-w-lg mx-auto ${
                  isLight
                    ? 'bg-blue-50/60 border-blue-200/90'
                    : 'bg-[#071636]/90 border-sky-400/25'
                }`}
              >
                <label
                  htmlFor="empty-studio-project-input"
                  className={`block text-[11px] font-mono uppercase tracking-wider font-bold ${
                    isLight ? 'text-blue-900' : 'text-sky-300'
                  }`}
                >
                  Judul Proyek Video Baru
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    id="empty-studio-project-input"
                    data-testid="empty-studio-project-input"
                    type="text"
                    value={emptyStudioProjectName}
                    onChange={(e) => setEmptyStudioProjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && emptyStudioProjectName.trim()) {
                        onCreateNewProject?.(emptyStudioProjectName.trim());
                        setEmptyStudioProjectName('');
                      }
                    }}
                    placeholder="Contoh: Edukasi Finansial 60 Detik..."
                    className={`flex-1 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm border focus:outline-none transition ${
                      isLight
                        ? 'bg-white border-blue-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-600'
                        : 'bg-[#041029] border-sky-400/30 text-white placeholder:text-sky-200/40 focus:border-sky-400'
                    }`}
                  />
                  <button
                    type="button"
                    data-testid="empty-studio-create-btn"
                    onClick={() => {
                      const titleToCreate = emptyStudioProjectName.trim() || 'Proyek Video Pertamaku';
                      onCreateNewProject?.(titleToCreate);
                      setEmptyStudioProjectName('');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-400 hover:from-blue-500 hover:to-sky-300 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-sky-500/20 shrink-0"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Buat Proyek Baru</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  data-testid="empty-studio-open-manager-btn"
                  onClick={() => setIsProjectModalOpen(true)}
                  className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                    isLight
                      ? 'bg-white border-blue-200 text-blue-800 hover:bg-blue-50'
                      : 'bg-[#071636] border-sky-400/30 text-sky-200 hover:border-sky-400 hover:text-white'
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
                  <span>Buka Kelola Proyek</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
        <div className="max-w-4xl mx-auto space-y-5">
          {/* ========================================================== */}
          {/* TAHAP 1: IDE (GRAPH MOTION ARCHITECTURAL WORKSPACE) */}
          {/* ========================================================== */}
          {currentStep === 'ide' && (
            <div className="space-y-5">
              {/* SUBTAB HEADER: Atur vs Pilih ide */}
              <div
                className={`p-1 rounded-xl border flex items-center max-w-md mx-auto ${
                  isLight
                    ? 'bg-white border-blue-200/90 shadow-xs'
                    : 'bg-[#041029] border-sky-400/25'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setIdeSubTab('atur')}
                  className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg transition cursor-pointer ${
                    ideSubTab === 'atur'
                      ? 'bg-sky-400 text-slate-950 shadow-xs'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Atur Parameter Ide
                </button>
                <button
                  type="button"
                  onClick={() => setIdeSubTab('pilih_ide')}
                  className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                    ideSubTab === 'pilih_ide'
                      ? 'bg-sky-400 text-slate-950 shadow-xs'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <span>Pilih Ide</span>
                  {project.idea_concepts && project.idea_concepts.length > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold leading-none ${
                        ideSubTab === 'pilih_ide'
                          ? 'bg-slate-950 text-sky-300'
                          : 'bg-sky-400/20 text-sky-300'
                      }`}
                    >
                      {project.idea_concepts.length}
                    </span>
                  )}
                </button>
              </div>

              {/* SUBTAB: ATUR FORM */}
              {ideSubTab === 'atur' && (
                <div
                  className={`rounded-2xl p-5 sm:p-7 border space-y-5 ${
                    isLight
                      ? 'bg-white border-blue-200/90 shadow-[0_14px_34px_rgba(37,99,235,0.06)]'
                      : 'bg-[#041029]/95 border-sky-400/25 shadow-[0_20px_50px_rgba(2,8,23,0.85)]'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                    <h2
                      className={`text-sm sm:text-base font-bold tracking-tight ${
                        isLight ? 'text-slate-950' : 'text-white'
                      }`}
                    >
                      Atur Konsep &amp; Bahan Video
                    </h2>
                    <span
                      data-testid="step1-aspect-duration-badge"
                      className={`text-[11px] font-mono tabular-nums px-2.5 py-1 rounded-lg border ${
                        isLight
                          ? 'bg-slate-100 border-slate-200 text-slate-700'
                          : 'bg-[#020817] border-slate-800 text-slate-300'
                      }`}
                    >
                      {aspectRatio} ·{' '}
                      {durationPreset === 'auto'
                        ? 'Otomatis (Sesuai Narasi)'
                        : `${calculatedDuration} dtk`}
                    </span>
                  </div>

                  {/* Grid Row: Mulai dari, Bahasa, Jenis konten */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Mulai dari
                      </label>
                      <select
                        value={startMode === 'url' ? 'topic' : startMode}
                        onChange={(e) => setStartMode(e.target.value as StartMode)}
                        className="w-full rounded-xl px-3 py-2 text-xs font-semibold border focus:outline-none"
                      >
                        <option value="topic">Tulis topik</option>
                        <option value="script">Punya naskah</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Bahasa
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as LanguageOption)}
                        className="w-full rounded-xl px-3 py-2 text-xs font-semibold border focus:outline-none"
                      >
                        <option value="id">Indonesia</option>
                        <option value="en">English</option>
                        <option value="jv">Jawa</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Jenis konten
                      </label>
                      <select
                        value={contentType}
                        onChange={(e) => setContentType(e.target.value as ContentType)}
                        className="w-full rounded-xl px-3 py-2 text-xs font-semibold border focus:outline-none"
                      >
                        <option value="motivasi">Motivasi</option>
                        <option value="edukasi">Edukasi</option>
                        <option value="storytelling">Cerita &amp; Dokumenter</option>
                        <option value="tips">Tips &amp; Strategi</option>
                        <option value="promosi">Review &amp; Produk</option>
                      </select>
                    </div>
                  </div>

                  {/* Row: Topik video */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Topik atau bahasan video
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Contoh: Disiplin diri membangun kebiasaan pagi, atau strategi finansial..."
                        className="flex-1 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium border focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* COMPACT PHOTO & VIDEO UPLOAD FOR ALL REMOTION ANIMATION STYLES */}
                  <div
                    data-testid="regular-remotion-media-upload-card"
                    className={`rounded-xl p-3.5 border flex flex-col gap-2.5 ${
                      isLight
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-[#020817]/80 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold block">
                          Bahan Foto / Video Adegan (opsional, untuk semua gaya Remotion)
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          Unggah screenshot, foto produk, atau klip MP4 agar dipakai langsung di dalam animasi
                        </span>
                      </div>

                      <div>
                        <input
                          ref={tutorialMediaInputRef}
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            handleUploadTutorialMediaFiles(e.target.files);
                            e.target.value = '';
                          }}
                        />
                        <button
                          type="button"
                          data-testid="upload-tutorial-media-btn"
                          onClick={() => tutorialMediaInputRef.current?.click()}
                          className="py-1.5 px-3 rounded-xl border border-slate-700 bg-slate-900 hover:border-blue-400 text-slate-200 font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <Upload className="w-3.5 h-3.5 text-blue-400" />
                          <span>Upload Foto / Video</span>
                        </button>
                      </div>
                    </div>

                    {project.uploaded_tutorial_media && project.uploaded_tutorial_media.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {project.uploaded_tutorial_media.map((item, mIdx) => (
                          <div
                            key={item.id || mIdx}
                            className="rounded-lg border border-slate-800 bg-[#041029] overflow-hidden"
                          >
                            {item.type === 'video' ? (
                              <video
                                src={item.url}
                                muted
                                playsInline
                                width={160}
                                height={84}
                                className="w-full h-14 object-cover"
                              />
                            ) : (
                              <img
                                src={item.url}
                                alt={item.filename}
                                width={160}
                                height={84}
                                className="w-full h-14 object-cover"
                              />
                            )}
                            <div className="px-2 py-0.5 flex items-center justify-between gap-1 text-[9px] font-mono text-slate-300">
                              <span className="truncate">
                                S{mIdx + 1}: {item.filename}
                              </span>
                              <span className="uppercase text-emerald-400 shrink-0">
                                {item.type}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Grid Row: Durasi video & Ukuran video */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-200">
                        Target Durasi Video
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { id: 'auto', label: 'Otomatis (Sesuai Konsep Narasi)' },
                          { id: '30', label: '30 dtk' },
                          { id: '50', label: '50 dtk' },
                          { id: '60', label: '60 dtk' },
                          { id: 'custom', label: 'Kustom' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            data-testid={`duration-preset-${item.id}`}
                            onClick={() =>
                              handleChangeTargetDuration(
                                item.id as 'auto' | '30' | '50' | '60' | 'custom'
                              )
                            }
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition border cursor-pointer ${
                              durationPreset === item.id
                                ? 'bg-sky-400 border-sky-300 text-slate-950 shadow-xs'
                                : isLight
                                ? 'bg-slate-50 border-blue-200 text-slate-700 hover:bg-blue-50'
                                : 'bg-[#071636] border-sky-400/25 text-slate-200 hover:border-sky-300'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>

                      {durationPreset === 'auto' && (
                        <p
                          data-testid="auto-duration-explanation"
                          className="text-[11px] text-sky-400/90 leading-relaxed pt-0.5"
                        >
                          Durasi otomatis menyesuaikan konsep dan alur narasinya sampai tuntas — tidak ditentukan atau dibatasi angka detik kaku.
                        </p>
                      )}

                      {durationPreset === 'custom' && (
                        <div className="pt-1.5 flex items-center gap-2">
                          <input
                            type="number"
                            min="10"
                            max="180"
                            value={customDuration}
                            onChange={(e) =>
                              handleChangeTargetDuration('custom', Number(e.target.value))
                            }
                            className="w-24 rounded-xl px-3 py-1.5 text-xs font-bold font-mono text-center border"
                          />
                          <span className="text-xs text-slate-400">detik</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-200">
                        Rasio Kanvas Video
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { r: '9:16', label: '9:16 Reels' },
                          { r: '16:9', label: '16:9 Wide' },
                          { r: '1:1', label: '1:1 Square' },
                          { r: '3:4', label: '3:4 Feed' },
                        ].map((u) => (
                          <button
                            key={u.r}
                            type="button"
                            onClick={() => setAspectRatio(u.r as AspectRatio)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold font-mono transition border cursor-pointer ${
                              aspectRatio === u.r
                                ? 'bg-sky-400 border-sky-300 text-slate-950 shadow-xs'
                                : isLight
                                ? 'bg-slate-50 border-blue-200 text-slate-700 hover:bg-blue-50'
                                : 'bg-[#071636] border-sky-400/25 text-slate-200 hover:border-sky-300'
                            }`}
                          >
                            {u.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Row 6: Gaya video */}
                  <div className="space-y-2">
                    <div
                      onClick={() => setIsStyleModalOpen(true)}
                      data-testid="open-style-module-picker-btn"
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between group ${
                        isLight
                          ? 'bg-slate-50/80 border-blue-200 hover:border-blue-500'
                          : 'bg-[#071636]/90 border-sky-400/25 hover:border-sky-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-400/15 border border-sky-400/30 text-sky-400 flex items-center justify-center">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold block">
                            Modul Gaya Visual Remotion
                          </span>
                          <span
                            data-testid="auto-style-explanation"
                            className="text-[11px] text-slate-400 block"
                          >
                            {selectedModule === 'otomatis'
                              ? 'Menyesuaikan gaya visual secara otomatis dengan konsep dan topik apa yang sedang dibahas di setiap bagian narasi'
                              : activeModuleMeta.categoryLabel ||
                                `${SATSET_MODULES.length} modul motion graphics tersedia`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                            isLight
                              ? 'bg-white border-blue-200'
                              : 'bg-[#041029] border-sky-400/30'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: activeModuleMeta.accentColor,
                              }}
                            />
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: activeModuleMeta.secondaryColor,
                              }}
                            />
                          </div>
                          <span
                            data-testid="selected-style-badge-label"
                            className="text-xs font-bold text-sky-400"
                          >
                            {selectedModule === 'otomatis'
                              ? 'Otomatis (Sesuai Konsep)'
                              : activeModuleMeta.title}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-sky-400" />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                      <button
                        type="button"
                        data-testid="quick-auto-style-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundEngine.playSfx('sparkle');
                          setSelectedModule('otomatis');
                          const updatedScenes = project.scenes.map((s, idx) => {
                            const sceneRes = resolveAutoStyleForConceptAndScene(
                              { ...project, topik_video: topic, content_type: contentType, gaya_video: 'otomatis' },
                              s,
                              idx
                            );
                            return {
                              ...s,
                              visualModule: sceneRes.styleId,
                            };
                          });
                          handleUpdateFullProject({
                            ...project,
                            gaya_video: 'otomatis',
                            styleModule: 'otomatis',
                            scenes: updatedScenes,
                          });
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                          selectedModule === 'otomatis'
                            ? 'bg-sky-400 text-slate-950 border-sky-300 shadow-xs'
                            : isLight
                            ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                            : 'bg-[#041029] border-sky-400/30 text-sky-300 hover:border-sky-400'
                        }`}
                      >
                        <Zap className="w-3 h-3" />
                        <span>
                          {selectedModule === 'otomatis'
                            ? 'Gaya Otomatis Aktif — Menyesuaikan Konsep Bahasan'
                            : 'Pakai Gaya Otomatis (Menyesuaikan Konsep Bahasan)'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCustomStyleModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 hover:underline cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Kustomisasi Gaya Sendiri</span>
                      </button>
                    </div>
                  </div>

                  {/* Row 7: Karakter (Accordion & Clickable Modal with Real Canvas Previews) */}
                  {(() => {
                    const activeCharMeta = getCharacterMeta(character, project.custom_character);
                    return (
                      <div
                        className={`border rounded-xl overflow-hidden ${
                          isLight
                            ? 'bg-slate-50/70 border-blue-200'
                            : 'bg-[#071636]/80 border-sky-400/25'
                        }`}
                      >
                        <div
                          onClick={() => setIsCharacterOpen(!isCharacterOpen)}
                          className="p-3.5 flex items-center justify-between cursor-pointer select-none transition"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl border flex items-center justify-center overflow-hidden ${
                                isLight
                                  ? 'bg-white border-blue-200'
                                  : 'bg-[#041029] border-sky-400/30'
                              }`}
                            >
                                <CharacterAvatarCanvas
                                  characterId={character}
                                  customCharacter={project.custom_character}
                                  pose={activeCharMeta.look?.stick === 'side' ? 'walk' : 'stand'}
                                  viewMode={characterFraming}
                                  dimension={characterDimension}
                                  size={38}
                                  darkBg={!isLight}
                                />
                            </div>
                            <div>
                              <span className="text-xs font-bold block">
                                Karakter Aktor Visual
                              </span>
                              <span className="text-[11px] text-slate-400 block">
                                {activeCharMeta.description}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                                isLight
                                  ? 'bg-white border-blue-200 text-blue-800'
                                  : 'bg-[#041029] border-sky-400/30 text-sky-200'
                              }`}
                            >
                              {activeCharMeta.name}
                            </span>
                            {isCharacterOpen ? (
                              <ChevronUp className="w-4 h-4 text-sky-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-sky-400" />
                            )}
                          </div>
                        </div>

                        {isCharacterOpen && (
                          <div className="p-4 border-t border-sky-400/15 space-y-3">
                            <div
                              onClick={() => setIsCharacterModalOpen(true)}
                              className={`p-3 border rounded-xl flex items-center justify-between gap-3 cursor-pointer transition ${
                                isLight
                                  ? 'bg-white border-blue-200 hover:border-blue-400'
                                  : 'bg-[#041029] border-sky-400/25 hover:border-sky-400/60'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 overflow-hidden ${
                                    isLight
                                      ? 'bg-blue-50/70 border-blue-200'
                                      : 'bg-[#071636] border-sky-400/30'
                                  }`}
                                >
                                  <CharacterAvatarCanvas
                                    characterId={character}
                                    customCharacter={project.custom_character}
                                    pose={activeCharMeta.look?.stick === 'side' ? 'walk' : 'wave'}
                                    viewMode={characterFraming}
                                    dimension={characterDimension}
                                    size={40}
                                    darkBg={!isLight}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-xs font-bold block truncate">
                                    {activeCharMeta.name}
                                  </span>
                                  <span className="text-[11px] text-slate-400 block line-clamp-1">
                                    {activeCharMeta.description}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  data-testid="studio-open-character-builder-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCustomCharacter(
                                      String(character).startsWith('custom_') && project.custom_character
                                        ? project.custom_character
                                        : null
                                    );
                                    setIsCharacterBuilderOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 text-xs font-bold border border-amber-400/35 transition cursor-pointer"
                                >
                                  {String(character).startsWith('custom_') ? 'Edit' : '+ Buat'}
                                </button>
                                <button
                                  type="button"
                                  data-testid="studio-open-character-picker-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsCharacterModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-sky-400/15 hover:bg-sky-400/25 text-sky-300 text-xs font-bold border border-sky-400/35 transition cursor-pointer"
                                >
                                  Ganti Karakter
                                </button>
                              </div>
                            </div>

                            {/* Dimensi Avatar (3D Studio vs 2D Vektor) */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                              <span className="text-xs font-semibold text-slate-300">
                                Dimensi Avatar:
                              </span>
                              <div className="flex items-center gap-1 bg-[#041029] p-1 rounded-lg border border-sky-400/20">
                                {(
                                  [
                                    { id: '3d', label: '3D Studio' },
                                    { id: '2d', label: '2D Vektor' },
                                  ] as const
                                ).map((dim) => (
                                  <button
                                    key={dim.id}
                                    type="button"
                                    data-testid={`studio-dimension-${dim.id}`}
                                    onClick={() => {
                                      setCharacterDimension(dim.id);
                                      soundEngine.playSfx('tap');
                                      handleUpdateFullProject({
                                        ...project,
                                        character_dimension: dim.id,
                                      });
                                    }}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                                      characterDimension === dim.id
                                        ? 'bg-sky-400 text-slate-950'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {dim.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Framing / Tampilan Badan */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                              <span className="text-xs font-semibold text-slate-300">
                                Tampilan Badan:
                              </span>
                              <div className="flex items-center gap-1 bg-[#041029] p-1 rounded-lg border border-sky-400/20">
                                {(
                                  [
                                    { id: 'full', label: 'Full Body' },
                                    { id: 'bust', label: 'Setengah' },
                                    { id: 'closeup', label: 'Close-Up' },
                                    { id: 'orb', label: 'Orb 3D' },
                                  ] as const
                                ).map((fr) => (
                                  <button
                                    key={fr.id}
                                    type="button"
                                    onClick={() => {
                                      setCharacterFraming(fr.id);
                                      soundEngine.playSfx('tap');
                                      handleUpdateFullProject({
                                        ...project,
                                        character_framing: fr.id,
                                      });
                                    }}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                                      characterFraming === fr.id
                                        ? 'bg-sky-400 text-slate-950'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {fr.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs font-semibold text-slate-300">
                                Narator (selain karakter):
                              </span>
                              <div className="flex items-center gap-1 bg-[#041029] p-1 rounded-lg border border-sky-400/20">
                                {(['pria', 'wanita'] as const).map((g) => (
                                  <button
                                    key={g}
                                    type="button"
                                    onClick={() => {
                                      setCharacterGender(g);
                                      soundEngine.playSfx('tap');
                                      handleUpdateFullProject({
                                        ...project,
                                        character_gender: g,
                                      });
                                    }}
                                    className={`px-3 py-1 rounded-md text-xs font-bold capitalize transition cursor-pointer ${
                                      characterGender === g
                                        ? 'bg-sky-400 text-slate-950'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {g}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                              <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={characterWithObjects}
                                  onChange={(e) => {
                                    setCharacterWithObjects(e.target.checked);
                                    handleUpdateFullProject({
                                      ...project,
                                      character_with_objects: e.target.checked,
                                    });
                                  }}
                                  className="rounded w-3.5 h-3.5 accent-sky-400"
                                />
                                <span className="font-medium text-xs">
                                  Tokoh + benda
                                </span>
                              </label>

                              <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={characterFullBackstory}
                                  onChange={(e) => {
                                    setCharacterFullBackstory(e.target.checked);
                                    handleUpdateFullProject({
                                      ...project,
                                      character_full_backstory: e.target.checked,
                                    });
                                  }}
                                  className="rounded w-3.5 h-3.5 accent-sky-400"
                                />
                                <span className="font-medium text-xs">
                                  Cerita (latar lengkap)
                                </span>
                              </label>
                            </div>

                            <button
                              type="button"
                              data-testid="studio-open-character-demo-btn"
                              onClick={() => {
                                setDemoPreviewCharacter(character);
                                setIsCharacterDemoOpen(true);
                              }}
                              className="text-xs text-sky-400 font-bold hover:underline flex items-center gap-1 cursor-pointer pt-0.5"
                            >
                              <span>▷ Lihat demo gerakan karakter</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Row 8: Warna brand */}
                  <div
                    className={`border rounded-xl overflow-hidden ${
                      isLight
                        ? 'bg-slate-50/70 border-blue-200'
                        : 'bg-[#071636]/80 border-sky-400/25'
                    }`}
                  >
                    <div
                      onClick={() => setIsBrandColorOpen(!isBrandColorOpen)}
                      className="p-3.5 flex items-center justify-between cursor-pointer select-none transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-400/15 border border-sky-400/30 text-sky-400 flex items-center justify-center">
                          <Palette className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold block">
                            Palet Warna Brand
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            Skema warna primer, sekunder, dan aksen adegan
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                            isLight
                              ? 'bg-white border-blue-200'
                              : 'bg-[#041029] border-sky-400/30'
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: brandColor }}
                          />
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: brandSecondaryColor }}
                          />
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: brandAccentColor }}
                          />
                          <span className="text-xs font-bold ml-1">
                            {brandColorMode === 'auto'
                              ? 'Ikut Gaya'
                              : brandPresetName || 'Kustom'}
                          </span>
                        </div>
                        {isBrandColorOpen ? (
                          <ChevronUp className="w-4 h-4 text-sky-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-sky-400" />
                        )}
                      </div>
                    </div>

                    {isBrandColorOpen && (
                      <div className="p-4 border-t border-sky-400/15 space-y-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setBrandColorMode('auto');
                              soundEngine.playSfx('tap');
                              handleUpdateFullProject({
                                ...project,
                                brand_mode: 'auto',
                              });
                            }}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition cursor-pointer ${
                              brandColorMode === 'auto'
                                ? 'bg-sky-400 border-sky-300 text-slate-950'
                                : 'bg-[#041029] border-sky-400/25 text-slate-300'
                            }`}
                          >
                            Otomatis (Ikut Modul)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setBrandColorMode('custom');
                              soundEngine.playSfx('tap');
                              handleUpdateFullProject({
                                ...project,
                                brand_mode: 'custom',
                              });
                            }}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition cursor-pointer ${
                              brandColorMode === 'custom'
                                ? 'bg-sky-400 border-sky-300 text-slate-950'
                                : 'bg-[#041029] border-sky-400/25 text-slate-300'
                            }`}
                          >
                            Warna Brand Kustom
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                          <div className="bg-[#041029] border border-sky-400/25 rounded-xl p-2.5 space-y-1.5">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                              Primer
                            </span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={brandColor}
                                onChange={(e) => {
                                  const c = e.target.value;
                                  setBrandColor(c);
                                  setBrandColorMode('custom');
                                  handleUpdateFullProject({
                                    ...project,
                                    warna_brand: c,
                                    brandColor: c,
                                    brand_mode: 'custom',
                                  });
                                }}
                                className="w-6 h-6 rounded cursor-pointer border border-sky-400/30 shrink-0"
                              />
                              <input
                                type="text"
                                value={brandColor}
                                onChange={(e) => {
                                  const c = e.target.value;
                                  setBrandColor(c);
                                  setBrandColorMode('custom');
                                  handleUpdateFullProject({
                                    ...project,
                                    warna_brand: c,
                                    brandColor: c,
                                    brand_mode: 'custom',
                                  });
                                }}
                                className="w-full text-[11px] font-mono font-bold bg-transparent focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="bg-[#041029] border border-sky-400/25 rounded-xl p-2.5 space-y-1.5">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                              Sekunder
                            </span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={brandSecondaryColor}
                                onChange={(e) => {
                                  const c = e.target.value;
                                  setBrandSecondaryColor(c);
                                  setBrandColorMode('custom');
                                  handleUpdateFullProject({
                                    ...project,
                                    brand_secondary_color: c,
                                    brand_mode: 'custom',
                                  });
                                }}
                                className="w-6 h-6 rounded cursor-pointer border border-sky-400/30 shrink-0"
                              />
                              <input
                                type="text"
                                value={brandSecondaryColor}
                                onChange={(e) => {
                                  const c = e.target.value;
                                  setBrandSecondaryColor(c);
                                  setBrandColorMode('custom');
                                  handleUpdateFullProject({
                                    ...project,
                                    brand_secondary_color: c,
                                    brand_mode: 'custom',
                                  });
                                }}
                                className="w-full text-[11px] font-mono font-bold bg-transparent focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="bg-[#041029] border border-sky-400/25 rounded-xl p-2.5 space-y-1.5">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                              Aksen
                            </span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={brandAccentColor}
                                onChange={(e) => {
                                  const c = e.target.value;
                                  setBrandAccentColor(c);
                                  setBrandColorMode('custom');
                                  handleUpdateFullProject({
                                    ...project,
                                    brand_accent_color: c,
                                    brand_mode: 'custom',
                                  });
                                }}
                                className="w-6 h-6 rounded cursor-pointer border border-sky-400/30 shrink-0"
                              />
                              <input
                                type="text"
                                value={brandAccentColor}
                                onChange={(e) => {
                                  const c = e.target.value;
                                  setBrandAccentColor(c);
                                  setBrandColorMode('custom');
                                  handleUpdateFullProject({
                                    ...project,
                                    brand_accent_color: c,
                                    brand_mode: 'custom',
                                  });
                                }}
                                className="w-full text-[11px] font-mono font-bold bg-transparent focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          {[
                            {
                              name: 'Graph Sapphire',
                              c1: '#2563EB',
                              c2: '#020817',
                              c3: '#38bdf8',
                            },
                            {
                              name: 'Ocean Deep',
                              c1: '#0284c7',
                              c2: '#0f172a',
                              c3: '#fbbf24',
                            },
                            {
                              name: 'Neon Cyber',
                              c1: '#6366f1',
                              c2: '#09090b',
                              c3: '#22d3ee',
                            },
                            {
                              name: 'Emerald Matrix',
                              c1: '#10b981',
                              c2: '#064e3b',
                              c3: '#a7f3d0',
                            },
                          ].map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => {
                                setBrandColor(preset.c1);
                                setBrandSecondaryColor(preset.c2);
                                setBrandAccentColor(preset.c3);
                                setBrandPresetName(preset.name);
                                setBrandColorMode('custom');
                                soundEngine.playSfx('sparkle');
                                handleUpdateFullProject({
                                  ...project,
                                  warna_brand: preset.c1,
                                  brandColor: preset.c1,
                                  brand_secondary_color: preset.c2,
                                  brand_accent_color: preset.c3,
                                  brand_preset_name: preset.name,
                                  brand_mode: 'custom',
                                });
                              }}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#041029] border border-sky-400/25 hover:border-sky-400 text-xs transition cursor-pointer"
                            >
                              <div className="flex items-center -space-x-1">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: preset.c1 }}
                                />
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: preset.c2 }}
                                />
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: preset.c3 }}
                                />
                              </div>
                              <span className="font-semibold text-[11px]">
                                {preset.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Grid Row: Tempo & Transisi */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      className={`p-3.5 rounded-xl border flex items-center justify-between ${
                        isLight
                          ? 'bg-slate-50/70 border-blue-200'
                          : 'bg-[#071636]/80 border-sky-400/25'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Zap className="w-4 h-4 text-sky-400" />
                        <span className="text-xs font-bold">Tempo Ritme</span>
                      </div>

                      <div className="flex items-center gap-1 p-1 rounded-lg bg-[#041029] border border-sky-400/20">
                        <button
                          type="button"
                          onClick={() => {
                            setTempo('energik');
                            setShowTempoTooltip(false);
                            soundEngine.playSfx('kick');
                            handleUpdateFullProject({
                              ...project,
                              tempo: 'energik',
                            });
                          }}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                            tempo === 'energik'
                              ? 'bg-sky-400 text-slate-950'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Energik
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTempo('santai');
                            setShowTempoTooltip(false);
                            soundEngine.playSfx('chime');
                            handleUpdateFullProject({
                              ...project,
                              tempo: 'santai',
                            });
                          }}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                            tempo === 'santai'
                              ? 'bg-sky-400 text-slate-950'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Santai
                        </button>
                      </div>
                    </div>

                    <div
                      onClick={() => setIsTransitionModalOpen(true)}
                      data-testid="studio-open-transition-picker-btn"
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        isLight
                          ? 'bg-slate-50/70 border-blue-200 hover:border-blue-500'
                          : 'bg-[#071636]/80 border-sky-400/25 hover:border-sky-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <TransitionPreviewCanvas
                          transitionId={transition}
                          size={34}
                          animate={false}
                        />
                        <span className="text-xs font-bold">
                          Transisi Adegan
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-sky-400">
                          {getTransitionMeta(transition).name}
                        </span>
                        <ChevronRight className="w-4 h-4 text-sky-400" />
                      </div>
                    </div>
                  </div>

                  {/* Pengaturan tambahan (opsional) */}
                  <div className="border-t border-sky-400/15 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                      className="text-xs font-bold text-slate-400 flex items-center gap-1.5 hover:text-sky-300 transition cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-sky-400" />
                      <span>Parameter Tambahan (Audiens &amp; Watermark)</span>
                      {isAdvancedOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isAdvancedOpen && (
                      <div className="p-4 mt-3 bg-[#071636]/70 rounded-xl border border-sky-400/20 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">
                            Target Audiens
                          </label>
                          <input
                            type="text"
                            value={targetAudience}
                            onChange={(e) => {
                              setTargetAudience(e.target.value);
                              handleUpdateFullProject({
                                ...project,
                                target_audience: e.target.value,
                              });
                            }}
                            placeholder="mis. kreator, profesional muda"
                            className="w-full rounded-lg px-3 py-2 text-xs font-medium border"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">
                            Jumlah Variasi Ide
                          </label>
                          <div className="flex items-center gap-1.5">
                            {[3, 5, 8, 10].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => {
                                  setIdeaCount(num);
                                  handleUpdateFullProject({
                                    ...project,
                                    idea_count: num,
                                  });
                                }}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition cursor-pointer ${
                                  ideaCount === num
                                    ? 'bg-sky-400 border-sky-300 text-slate-950'
                                    : 'bg-[#041029] border-sky-400/25 text-slate-300'
                                }`}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">
                            Watermark Handle
                          </label>
                          <input
                            type="text"
                            value={watermark}
                            onChange={(e) => {
                              setWatermark(e.target.value);
                              handleUpdateFullProject({
                                ...project,
                                watermark: e.target.value,
                              });
                            }}
                            className="w-full rounded-lg px-3 py-2 text-xs font-mono font-medium border"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Bar: Kirim perintah ke AI + Alternatif Paste */}
                  <div className="pt-4 border-t border-sky-400/15 space-y-2.5">
                    <button
                      type="button"
                      data-testid="ide-send-ai-btn"
                      onClick={handleKirimKeAI}
                      className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-200 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(56,189,248,0.35)] hover:shadow-[0_0_35px_rgba(56,189,248,0.6)] transition active:scale-[0.99] cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Generate &amp; Kirim Prompt Ide</span>
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        data-testid="ide-paste-shortcut-btn"
                        onClick={() => {
                          setPromptModalMode('idea');
                          setPromptModalPasteOnly(true);
                          setIsPromptModalOpen(true);
                        }}
                        className={`text-xs font-semibold hover:underline transition cursor-pointer ${
                          isLight ? 'text-blue-600 hover:text-blue-700' : 'text-sky-300 hover:text-sky-200'
                        }`}
                      >
                        Sudah punya kode? Tempel di sini
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB: PILIH IDE */}
              {ideSubTab === 'pilih_ide' &&
                (() => {
                  const concepts =
                    project.idea_concepts && project.idea_concepts.length > 0
                      ? project.idea_concepts
                      : [];
                  const activeId = project.selected_idea_id || concepts[0]?.id;
                  const selectedConcept =
                    concepts.find((c) => c.id === activeId) || concepts[0];

                  return (
                    <div className="space-y-4">
                      {/* Top Selected Idea Card */}
                      <div
                        className={`rounded-2xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isLight
                            ? 'bg-white border-blue-200 shadow-xs'
                            : 'bg-[#041029]/95 border-sky-400/30'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
                              KONSEP TERPILIH
                            </span>
                          </div>
                          <h3 className="font-extrabold text-sm sm:text-base truncate">
                            {selectedConcept?.title ||
                              'Kenapa Pagi Terasa Berat?'}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (selectedConcept) {
                              handleSelectConcept(selectedConcept);
                            }
                          }}
                          className="shrink-0 py-2.5 px-5 rounded-xl bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-200 text-slate-950 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(56,189,248,0.35)] transition cursor-pointer"
                        >
                          <span>Lanjut ke Narasi</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Section Header */}
                      <div className="flex items-center justify-between px-1">
                        <h2 className="font-extrabold text-sm sm:text-base">
                          Daftar Konsep Ide Video
                        </h2>
                        <span className="text-xs font-mono text-sky-400">
                          {concepts.length} konsep tersedia
                        </span>
                      </div>

                      {/* Idea Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {concepts.map((concept, cIdx) => {
                          const isSelected = activeId === concept.id;
                          return (
                            <div
                              key={concept.id}
                              onClick={() => {
                                const updated = {
                                  ...project,
                                  selected_idea_id: concept.id,
                                  project_title: concept.title,
                                };
                                handleUpdateFullProject(updated);
                              }}
                              className={`rounded-2xl p-5 transition cursor-pointer relative border ${
                                isSelected
                                  ? isLight
                                    ? 'bg-blue-50/70 border-2 border-blue-600 shadow-sm'
                                    : 'bg-[#081d4a]/90 border-2 border-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.18)]'
                                  : isLight
                                  ? 'bg-white border-blue-200/80 hover:border-blue-400'
                                  : 'bg-[#041029]/90 border-sky-400/20 hover:border-sky-400/50'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono font-bold text-[11px] text-sky-400 tracking-wider uppercase">
                                  KONSEP 0{cIdx + 1}
                                </span>
                                {isSelected && (
                                  <span className="px-2 py-0.5 rounded bg-sky-400 text-slate-950 text-[10px] font-mono font-extrabold">
                                    AKTIF
                                  </span>
                                )}
                              </div>

                              <h3 className="font-extrabold text-sm leading-snug mb-2.5">
                                {concept.title}
                              </h3>

                              {(concept.hook || concept.hookProposal) && (
                                <div className="my-2.5 bg-[#071636]/90 border-l-2 border-sky-400 px-3 py-2 rounded-r-lg">
                                  <p className="text-xs font-mono font-semibold text-sky-200">
                                    "{concept.hook || concept.hookProposal}"
                                  </p>
                                </div>
                              )}

                              <p className="text-xs text-slate-300 leading-relaxed">
                                {concept.angle}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
            </div>
          )}

          {/* ========================================================== */}
          {/* TAHAP 2: NASKAH / NARASI (SUBTAB: ATUR VS NASKAH) */}
          {/* ========================================================== */}
          {currentStep === 'naskah' && (
            <div className="space-y-5">
              {/* SUBTAB HEADER: Atur vs Naskah */}
              <div
                className={`p-1 rounded-xl border flex items-center max-w-md mx-auto ${
                  isLight
                    ? 'bg-white border-blue-200/90 shadow-xs'
                    : 'bg-[#041029] border-sky-400/25'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setNaskahSubTab('atur')}
                  className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg transition cursor-pointer ${
                    naskahSubTab === 'atur'
                      ? 'bg-sky-400 text-slate-950 shadow-xs'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Atur Struktur Narasi
                </button>
                <button
                  type="button"
                  onClick={() => setNaskahSubTab('naskah')}
                  className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                    naskahSubTab === 'naskah'
                      ? 'bg-sky-400 text-slate-950 shadow-xs'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <span>Editor Naskah Adegan</span>
                  {project.scenes && project.scenes.length > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold leading-none ${
                        naskahSubTab === 'naskah'
                          ? 'bg-slate-950 text-sky-300'
                          : 'bg-sky-400/20 text-sky-300'
                      }`}
                    >
                      {project.scenes.length}
                    </span>
                  )}
                </button>
              </div>

              {/* SUBTAB ATUR */}
              {naskahSubTab === 'atur' &&
                (() => {
                  const concepts = project.idea_concepts || [];
                  const activeId = project.selected_idea_id || concepts[0]?.id;
                  const selectedConcept =
                    concepts.find((c) => c.id === activeId) ||
                    concepts[0] || {
                      title:
                        project.project_title ||
                        project.title ||
                        'Kenapa Pagi Terasa Berat?',
                      hook: 'KATANYA ORANG SUKSES / BANGUN PAGI / PADAHAL ADA YANG SALAH',
                      hookProposal: 'KATANYA ORANG SUKSES / BANGUN PAGI / PADAHAL ADA YANG SALAH',
                    };
                  const hookText =
                    selectedConcept.hook ||
                    selectedConcept.hookProposal ||
                    'KATANYA ORANG SUKSES / BANGUN PAGI / PADAHAL ADA YANG SALAH';
                  const targetScenesCount =
                    calculatedDuration >= 60
                      ? 8
                      : calculatedDuration >= 50
                      ? 6
                      : 4;
                  const avgSecStr = (calculatedDuration / targetScenesCount)
                    .toFixed(1)
                    .replace('.0', '');

                  return (
                    <div className="space-y-4">
                      {/* Top Selected Idea Card */}
                      <div
                        className={`rounded-2xl p-5 border space-y-1.5 ${
                          isLight
                            ? 'bg-white border-blue-200/90 shadow-xs'
                            : 'bg-[#041029]/95 border-sky-400/25'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                            KONSEP AKTIF
                          </span>
                        </div>
                        <h3 className="font-extrabold text-sm sm:text-base leading-snug">
                          {selectedConcept.title}
                        </h3>
                        {hookText && (
                          <p className="text-xs font-mono text-sky-300">
                            Hook: {hookText}
                          </p>
                        )}
                      </div>

                      {/* Main Settings Card */}
                      <div
                        className={`rounded-2xl p-5 sm:p-7 border space-y-5 ${
                          isLight
                            ? 'bg-white border-blue-200/90 shadow-xs'
                            : 'bg-[#041029]/95 border-sky-400/25'
                        }`}
                      >
                        {/* Duration row */}
                        <div className="flex items-center justify-between border-b border-sky-400/15 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-sky-400/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
                              <Clock className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-xs sm:text-sm font-extrabold block">
                                Durasi Target:{' '}
                                {calculatedDuration >= 60
                                  ? '60 Detik (1 Menit)'
                                  : `${calculatedDuration} Detik`}
                              </span>
                              <p className="text-[11px] font-mono text-slate-400">
                                {targetScenesCount} Scene · ±{avgSecStr}s per
                                adegan
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setIsDurationDropdownOpen(!isDurationDropdownOpen)
                            }
                            className="flex items-center gap-1.5 text-xs font-bold bg-[#071636] border border-sky-400/30 text-sky-200 px-3.5 py-2 rounded-xl transition cursor-pointer"
                          >
                            <span>Ubah Durasi</span>
                            {isDurationDropdownOpen ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {isDurationDropdownOpen && (
                          <div className="p-3.5 bg-[#071636] border border-sky-400/25 rounded-xl flex flex-wrap items-center gap-2">
                            {[
                              { id: 'auto', label: `Otomatis (${autoCalculatedDuration} dtk)` },
                              { id: '30', label: '30 dtk (4 scene)' },
                              { id: '50', label: '50 dtk (6 scene)' },
                              { id: '60', label: '60 dtk (8 scene)' },
                              { id: 'custom', label: 'Kustom' },
                            ].map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  handleChangeTargetDuration(
                                    item.id as 'auto' | '30' | '50' | '60' | 'custom'
                                  );
                                  setIsDurationDropdownOpen(false);
                                }}
                                className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                                  durationPreset === item.id
                                    ? 'bg-sky-400 text-slate-950'
                                    : 'bg-[#041029] border border-sky-400/25 text-slate-200'
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Catatan untuk penulis */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold">
                            Catatan Arahan Naskah / Call-To-Action (Opsional)
                          </label>
                          <textarea
                            rows={2}
                            value={creatorNote}
                            onChange={(e) => setCreatorNote(e.target.value)}
                            placeholder="Contoh: akhiri dengan ajakan follow dan simpan video ini"
                            className="w-full rounded-xl p-3 text-xs border focus:outline-none resize-none font-medium"
                          />
                        </div>

                        {/* Step 1: Kirim perintah ke AI */}
                        <div className="space-y-2.5 pt-2 border-t border-sky-400/15">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-sky-400 text-slate-950 flex items-center justify-center text-[11px] font-mono font-extrabold">
                              1
                            </span>
                            <span className="text-xs font-extrabold">
                              Generate / Kirim Blueprint Prompt Narasi ke AI
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                            <button
                              type="button"
                              data-testid="narasi-send-ai-btn"
                              onClick={handleKirimNarasiKeAI}
                              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-200 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(56,189,248,0.3)] transition cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Buka &amp; Kirim Prompt Narasi</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleSalinPromptNarasi}
                              className="py-3 px-4 rounded-xl bg-[#071636] border border-sky-400/35 hover:border-sky-300 text-sky-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                            >
                              {copiedNarasiPrompt ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-sky-400" />
                              )}
                              <span>
                                {copiedNarasiPrompt
                                  ? 'Prompt Tersalin'
                                  : 'Salin Prompt Narasi'}
                              </span>
                            </button>
                          </div>

                          <div>
                            <button
                              type="button"
                              data-testid="narasi-paste-shortcut-btn"
                              onClick={() => {
                                setShowInlinePasteBox(true);
                                setTimeout(() => {
                                  narasiPasteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, 80);
                              }}
                              className={`text-xs font-semibold hover:underline transition cursor-pointer ${
                                isLight ? 'text-blue-600 hover:text-blue-700' : 'text-sky-300 hover:text-sky-200'
                              }`}
                            >
                              Sudah punya kode? Tempel di sini
                            </button>
                          </div>
                        </div>

                        {/* Step 2: Tempel jawaban AI */}
                        <div ref={narasiPasteRef} className="space-y-3 pt-2 border-t border-sky-400/15">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded bg-sky-400 text-slate-950 flex items-center justify-center text-[11px] font-mono font-extrabold">
                                2
                              </span>
                              <span className="text-xs font-extrabold">
                                Impor Struktur JSON Naskah Adegan
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleApplyInlineNarasi(SAMPLE_AI_NARASI_JSON)
                              }
                              className="text-[11px] text-sky-300 font-bold bg-[#071636] hover:bg-[#0a1e46] px-3 py-1.5 rounded-lg border border-sky-400/30 transition cursor-pointer"
                            >
                              + Muat Contoh Naskah (8 Scene)
                            </button>
                          </div>

                          {!showInlinePasteBox && (
                            <div
                              onClick={() => setShowInlinePasteBox(true)}
                              className={`p-6 rounded-xl border border-dashed cursor-pointer transition flex flex-col items-center justify-center text-center space-y-2 ${
                                isLight
                                  ? 'border-blue-300 bg-blue-50/40 hover:bg-blue-50'
                                  : 'border-sky-400/35 bg-[#071636]/50 hover:bg-[#071636]'
                              }`}
                            >
                              <div className="w-10 h-10 rounded-xl bg-sky-400/15 border border-sky-400/30 text-sky-400 flex items-center justify-center">
                                <Copy className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold">
                                Klik untuk Menempel JSON Naskah Adegan
                              </span>
                              <span className="text-[11px] text-slate-400">
                                Mendukung format storyboard JSON dengan narasi,
                                teks layar, kata kunci penekanan, dan kamera
                              </span>
                            </div>
                          )}

                          {showInlinePasteBox && (
                            <div
                              data-testid="narasi-inline-paste-box"
                              className="p-4 bg-[#071636] border border-sky-400/30 rounded-xl space-y-3"
                            >
                              <textarea
                                rows={6}
                                value={inlinePasteText}
                                onChange={(e) => {
                                  setInlinePasteText(e.target.value);
                                  if (pasteError) setPasteError(null);
                                }}
                                placeholder="Tempel JSON naskah adegan di sini..."
                                className="w-full rounded-xl p-3 font-mono text-xs border focus:outline-none"
                              />

                              {pasteError && (
                                <p className="text-xs text-rose-400 font-medium">
                                  {pasteError}
                                </p>
                              )}

                              <div className="flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() => setShowInlinePasteBox(false)}
                                  className="text-xs text-slate-400 hover:text-white font-bold cursor-pointer"
                                >
                                  Tutup
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleApplyInlineNarasi(inlinePasteText)
                                  }
                                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Terapkan ke Naskah</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

              {/* SUBTAB NASKAH: SCENE CARDS LIST */}
              {naskahSubTab === 'naskah' &&
                (() => {
                  const totalWordsCount = project.scenes.reduce((acc, s) => {
                    const txt = (s.narration_text || s.voiceScript || '').trim();
                    return acc + (txt ? txt.split(/\s+/).length : 0);
                  }, 0);
                  const actualScenesDuration = project.scenes.reduce(
                    (acc, s) => acc + Number(s.target_duration_sec || s.durationSeconds || 4),
                    0
                  );
                  const isTooShortForTarget =
                    durationPreset !== 'auto' &&
                    calculatedDuration >= 40 &&
                    actualScenesDuration < calculatedDuration * 0.78;

                  return (
                    <div className="space-y-4">
                      <div
                        className={`rounded-2xl p-5 border flex flex-wrap items-center justify-between gap-4 ${
                          isLight
                            ? 'bg-white border-blue-200/90 shadow-xs'
                            : 'bg-[#041029]/95 border-sky-400/25'
                        }`}
                      >
                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-400 block">
                            Tahap 02 · Editor Naskah &amp; Visual Adegan
                          </span>
                          <h3 className="font-bold text-sm sm:text-base mt-0.5">
                            Susunan Naskah, Bahan Foto/Video &amp; Kamera per Adegan
                          </h3>
                          <p className="text-xs font-mono text-slate-400 tabular-nums">
                            {project.scenes.length} Adegan · Target:{' '}
                            {durationPreset === 'auto' ? `Otomatis (${calculatedDuration} dtk)` : `${calculatedDuration} dtk`} · Naskah Saat Ini:{' '}
                            {Math.round(actualScenesDuration * 10) / 10} dtk ({totalWordsCount} kata)
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => tutorialMediaInputRef.current?.click()}
                            className="px-3.5 py-2 rounded-xl bg-[#071636] border border-sky-400/35 hover:border-sky-300 text-sky-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5 text-sky-400" />
                            <span>Upload Foto / Video Bahan</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleAddScene}
                            className="px-3.5 py-2 rounded-xl bg-[#071636] border border-sky-400/30 hover:border-sky-300 text-sky-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-sky-400" />
                            <span>Tambah Scene</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setCurrentStep('suara')}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
                          >
                            <span>Lanjut ke Suara</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {isTooShortForTarget && (
                        <div className="rounded-2xl p-4 border border-amber-400/40 bg-amber-500/10 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-200 leading-relaxed">
                              Naskah saat ini baru berisi <strong className="font-bold">{totalWordsCount} kata</strong> (~{actualScenesDuration.toFixed(1)} dtk), masih lebih singkat dari target{' '}
                              <strong className="font-bold">{calculatedDuration} detik</strong>. Untuk hasil {calculatedDuration} detik penuh, pastikan setiap adegan berisi sekitar 18 sampai 23 kata atau buat ulang via prompt narasi terbaru.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNaskahSubTab('atur')}
                            className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold transition cursor-pointer shrink-0"
                          >
                            Buka Atur Struktur ({calculatedDuration}d)
                          </button>
                        </div>
                      )}

                  {/* List of Scenes */}
                  <div className="space-y-3.5">
                    {project.scenes.map((sc, idx) => {
                      const isHook = idx === 0;
                      const isCta = idx === project.scenes.length - 1;
                      const roleLabel = isHook
                        ? 'HOOK PEMBUKA'
                        : isCta
                        ? 'CALL TO ACTION'
                        : 'ARGUMEN INTI';

                      return (
                        <div
                          key={sc.id || idx}
                          className={`rounded-2xl p-5 border space-y-3.5 transition ${
                            isLight
                              ? 'bg-white border-blue-200/90 hover:border-blue-400 shadow-xs'
                              : 'bg-[#041029]/95 border-sky-400/20 hover:border-sky-400/45'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-400/15 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-extrabold text-xs text-slate-950 bg-sky-400 px-2.5 py-0.5 rounded-md">
                                SCENE 0
                                {sc.scene_number || sc.sceneNumber || idx + 1}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#071636] border border-sky-400/30 text-sky-300">
                                {roleLabel}
                              </span>
                              {sc.camera && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#071636] text-slate-300">
                                  CAM: {sc.camera}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="px-2.5 py-1 rounded-lg bg-[#071636] border border-sky-400/30 hover:border-sky-300 text-sky-200 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition">
                                <Upload className="w-3 h-3 text-sky-400" />
                                <span>{sc.media_url ? 'Ganti Foto/Video' : 'Upload Foto/Video Scene'}</span>
                                <input
                                  type="file"
                                  accept="image/*,video/*"
                                  data-testid={`scene-media-upload-input-${idx + 1}`}
                                  onChange={(e) => {
                                    handleUploadSingleSceneMedia(idx, e.target.files);
                                    e.target.value = '';
                                  }}
                                  className="hidden"
                                />
                              </label>

                              <span className="text-[11px] font-mono text-slate-400">
                                Durasi (s):
                              </span>
                              <input
                                type="number"
                                min="2"
                                max="30"
                                step="0.5"
                                value={
                                  sc.target_duration_sec ||
                                  sc.durationSeconds ||
                                  7.5
                                }
                                onChange={(e) =>
                                  handleUpdateScene(
                                    idx,
                                    'target_duration_sec',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-16 rounded-lg px-2 py-1 text-xs font-mono font-bold text-center border"
                              />

                              {project.scenes.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteScene(idx)}
                                  className="p-1.5 text-slate-400 hover:text-rose-400 transition ml-1 cursor-pointer"
                                  title="Hapus Scene"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            <div>
                              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                Teks Layar Utama (Headline Hook)
                              </label>
                              <input
                                type="text"
                                value={sc.on_screen_text || sc.hookText || ''}
                                onChange={(e) =>
                                  handleUpdateScene(
                                    idx,
                                    'on_screen_text',
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-xl px-3 py-2 text-xs font-bold border focus:outline-none"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                  Kata Penekanan
                                </label>
                                <input
                                  type="text"
                                  value={(
                                    sc.emphasis_words ||
                                    sc.emphasisWords ||
                                    []
                                  ).join(', ')}
                                  onChange={(e) =>
                                    handleUpdateScene(
                                      idx,
                                      'emphasis_words',
                                      e.target.value
                                        .split(',')
                                        .map((w) => w.trim())
                                        .filter(Boolean)
                                    )
                                  }
                                  className="w-full rounded-xl px-2.5 py-2 text-xs font-mono font-bold border"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                  Efek Suara (SFX)
                                </label>
                                <select
                                  value={sc.sfxCue || 'pop'}
                                  onChange={(e) =>
                                    handleUpdateScene(
                                      idx,
                                      'sfxCue',
                                      e.target.value
                                    )
                                  }
                                  className="w-full rounded-xl px-2.5 py-2 text-xs font-medium border"
                                >
                                  <option value="pop">Pop Impact</option>
                                  <option value="whoosh">Whoosh Transition</option>
                                  <option value="ding">Chime Ding</option>
                                  <option value="click">Mechanical Click</option>
                                  <option value="sparkle">Synth Sparkle</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                              Kalimat Narator Voice Over (TTS)
                            </label>
                            <textarea
                              rows={2}
                              value={sc.narration_text || sc.voiceScript || ''}
                              onChange={(e) =>
                                handleUpdateScene(
                                  idx,
                                  'narration_text',
                                  e.target.value
                                )
                              }
                              className="w-full rounded-xl px-3 py-2 text-xs border resize-none focus:outline-none"
                            />
                          </div>

                          {sc.media_url && (
                            <div
                              data-testid={`scene-regular-media-preview-${idx + 1}`}
                              className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/70"
                            >
                              {sc.media_type === 'video' ? (
                                <video
                                  src={sc.media_url}
                                  muted
                                  playsInline
                                  className="w-24 h-16 object-cover rounded-lg border border-slate-700 shrink-0"
                                />
                              ) : (
                                <img
                                  src={sc.media_url}
                                  alt={sc.media_filename || `Scene ${idx + 1}`}
                                  className="w-24 h-16 object-cover rounded-lg border border-slate-700 shrink-0"
                                />
                              )}
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <span className="block text-xs font-bold text-sky-300 truncate">
                                  Bahan Visual Scene {idx + 1}: {sc.media_filename || 'Media Terunggah'}
                                </span>
                                <span className="block text-[11px] text-slate-400">
                                  Dirender otomatis ke kanvas Remotion ({sc.visualModule || project.gaya_video}) lengkap dengan pan &amp; zoom kamera.
                                </span>
                              </div>
                            </div>
                          )}

                          {(sc.visual || sc.visualDescription) && (
                            <div className="p-3 bg-[#071636]/70 rounded-xl border border-sky-400/20">
                              <span className="block text-[10px] font-mono font-bold text-sky-400 mb-0.5 uppercase tracking-wider">
                                Arahan Visual &amp; Kamera Remotion:
                              </span>
                              <p className="text-xs text-slate-300 leading-snug">
                                {sc.visual || sc.visualDescription}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                );
              })()}
            </div>
          )}

          {/* ========================================================== */}
          {/* TAHAP 3: SUARA (VOICE OVER & SOUND SFX) */}
          {/* ========================================================== */}
          {currentStep === 'suara' && (
            <VoiceSoundStudio
              project={project}
              themeMode={themeMode}
              onUpdateProject={handleUpdateFullProject}
              onNextToAnimation={() => {
                soundEngine.unlock();
                setCurrentStep('animasi');
              }}
            />
          )}

          {/* ========================================================== */}
          {/* TAHAP 4: ANIMASI (PLAYER REMOTION & EXPORT) */}
          {/* ========================================================== */}
          {currentStep === 'animasi' && (
            <SatsetAnimationStudio
              project={project}
              themeMode={themeMode}
              onUpdateProject={handleUpdateFullProject}
              onOpenRemotionCode={onOpenRemotionCode}
              onNavigateToVoice={() => setCurrentStep('suara')}
              onOpenStyleModal={() => setIsStyleModalOpen(true)}
            />
          )}
        </div>
        )}
      </main>

      {/* ========================================================== */}
      {/* FIXED BOTTOM NAVIGATION BAR: 1. IDE, 2. NARASI, 3. SUARA, 4. ANIMASI */}
      {/* ========================================================== */}
      {hasActiveProject && (
      <nav
        className={`fixed bottom-0 left-0 right-0 h-16 border-t z-40 flex items-center justify-around px-4 backdrop-blur-xl transition-colors ${
          isLight
            ? 'bg-white/95 border-blue-200'
            : 'bg-[#041029]/95 border-sky-400/25'
        }`}
      >
        {[
          {
            id: 'ide',
            num: '1',
            label: 'Ide',
            unlockedIcon: Lightbulb,
            stepIndex: 1,
          },
          {
            id: 'naskah',
            num: '2',
            label: 'Narasi',
            unlockedIcon: FileText,
            stepIndex: 2,
          },
          {
            id: 'suara',
            num: '3',
            label: 'Suara',
            unlockedIcon: Mic,
            stepIndex: 3,
          },
          {
            id: 'animasi',
            num: '4',
            label: 'Animasi',
            unlockedIcon: Film,
            stepIndex: 4,
          },
        ].map((item) => {
          const isActive = currentStep === item.id;
          const currentIdx =
            currentStep === 'ide'
              ? 1
              : currentStep === 'naskah'
              ? 2
              : currentStep === 'suara'
              ? 3
              : 4;
          const isUnlocked =
            item.stepIndex <= currentIdx ||
            (project.scenes && project.scenes.length > 0);
          const IconComponent =
            isActive || isUnlocked ? item.unlockedIcon : Lock;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                soundEngine.unlock();
                setCurrentStep(item.id as StudioNavStep);
              }}
              className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 text-center transition group cursor-pointer ${
                isActive
                  ? isLight
                    ? 'text-blue-700'
                    : 'text-sky-300'
                  : isUnlocked
                  ? isLight
                    ? 'text-slate-600 hover:text-blue-700'
                    : 'text-slate-300 hover:text-sky-300'
                  : 'text-slate-500'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                  isActive
                    ? 'bg-sky-400 text-slate-950 shadow-[0_0_16px_rgba(56,189,248,0.45)]'
                    : isUnlocked
                    ? isLight
                      ? 'bg-blue-50 text-slate-700 group-hover:text-blue-700'
                      : 'bg-[#071636] text-slate-300 group-hover:text-sky-300'
                    : 'bg-transparent text-slate-500'
                }`}
              >
                <IconComponent
                  className={`w-3.5 h-3.5 ${
                    isActive ? 'stroke-[2.5]' : 'stroke-2'
                  }`}
                />
              </div>
              <span
                className={`text-[11px] font-mono tracking-tight ${
                  isActive
                    ? isLight
                      ? 'font-extrabold text-blue-700'
                      : 'font-extrabold text-sky-300'
                    : isUnlocked
                    ? isLight
                      ? 'font-semibold text-slate-700'
                      : 'font-semibold text-slate-300'
                    : 'font-medium text-slate-500'
                }`}
              >
                {item.num}. {item.label}
              </span>
            </button>
          );
        })}
      </nav>
      )}

      {/* MODALS */}
      <ProjectManagerModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        projects={projects}
        currentProjectId={hasActiveProject ? project.id : ''}
        themeMode={themeMode}
        onSelectProject={(id) => {
          onSelectProject?.(id);
          const p = projects.find((x) => x.id === id);
          if (p) handleUpdateFullProject(p);
        }}
        onCreateNewProject={(name) => {
          onCreateNewProject?.(name);
          setCurrentStep('ide');
          setIdeSubTab('atur');
        }}
        onDeleteProject={(id) => onDeleteProject?.(id)}
      />

      <StyleModulePickerModal
        isOpen={isStyleModalOpen}
        onClose={() => setIsStyleModalOpen(false)}
        selectedModule={selectedModule}
        onSelectModule={(mod) => {
          setSelectedModule(mod);
          handleUpdateFullProject(
            {
              ...project,
              gaya_video: mod,
              styleModule: mod,
            } as SatsetProject,
            { recalculateDurations: false, forceStyleSync: true }
          );
        }}
        customPrompt={customStylePrompt}
        onCustomPromptChange={(val) => setCustomStylePrompt(val)}
      />

      <PromptBlueprintModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        mode={promptModalMode}
        pasteOnly={promptModalPasteOnly}
        creatorNote={creatorNote}
        project={{
          ...project,
          project_title: project.project_title || project.title || topic || 'Proyek Video',
          topik_video: topic,
          target_duration_sec: calculatedDuration,
          gaya_video: selectedModule,
          character,
          warna_brand: brandColor,
          tempo,
          aspect_ratio: aspectRatio,
          selected_idea_id: project.selected_idea_id,
          idea_concepts: project.idea_concepts,
        }}
        onApplyProject={(updated) => {
          handleUpdateFullProject({
            ...project,
            ...updated,
            gaya_video: updated.gaya_video || selectedModule,
            character,
            aspect_ratio: updated.aspect_ratio || aspectRatio,
            warna_brand: brandColor,
            tempo,
            creator_note: creatorNote,
          } as SatsetProject);
          if (updated.idea_concepts && updated.idea_concepts.length > 0 && promptModalMode === 'idea') {
            setIdeSubTab('pilih_ide');
            setCurrentStep('ide');
          } else {
            setCurrentStep('naskah');
            setNaskahSubTab('naskah');
          }
        }}
      />

      <CustomStyleModal
        isOpen={isCustomStyleModalOpen}
        onClose={() => setIsCustomStyleModalOpen(false)}
        onSaveStyle={handleSaveCustomStyleDirectly}
      />

      <CharacterPickerModal
        isOpen={isCharacterModalOpen}
        onClose={() => setIsCharacterModalOpen(false)}
        selectedCharacter={character}
        selectedFraming={characterFraming}
        selectedDimension={characterDimension}
        customCharacter={project.custom_character}
        characterGender={characterGender}
        characterWithObjects={characterWithObjects}
        characterFullBackstory={characterFullBackstory}
        scenesCount={project.scenes.length}
        onSelectCharacter={(char, opts) => {
          setCharacter(char);
          if (opts?.gender) setCharacterGender(opts.gender);
          if (opts?.withObjects !== undefined) setCharacterWithObjects(opts.withObjects);
          if (opts?.fullBackstory !== undefined) setCharacterFullBackstory(opts.fullBackstory);
          if (opts?.framing) setCharacterFraming(opts.framing);
          if (opts?.dimension) setCharacterDimension(opts.dimension);
          handleUpdateFullProject({
            ...project,
            character: char,
            character_framing: opts?.framing || characterFraming,
            character_dimension: opts?.dimension || characterDimension,
            custom_character: opts?.customCharacter ?? (String(char).startsWith('custom_') ? project.custom_character : undefined),
            character_gender: opts?.gender || characterGender,
            character_with_objects: opts?.withObjects ?? characterWithObjects,
            character_full_backstory: opts?.fullBackstory ?? characterFullBackstory,
          });
        }}
        onOpenDemo={(charId, dim) => {
          setDemoPreviewCharacter(charId || character);
          setDemoPreviewDimension(dim || characterDimension);
          setIsCharacterDemoOpen(true);
        }}
        onOpenBuilder={(editChar) => {
          setEditingCustomCharacter(editChar || null);
          setIsCharacterBuilderOpen(true);
        }}
      />

      <CharacterMotionDemoModal
        isOpen={isCharacterDemoOpen}
        onClose={() => {
          setIsCharacterDemoOpen(false);
          setDemoPreviewCharacter(null);
          setDemoPreviewDimension(null);
        }}
        character={demoPreviewCharacter || character}
        framing={characterFraming}
        dimension={demoPreviewDimension || characterDimension}
        customCharacter={project.custom_character}
        onSelectCharacter={(char, fr, dim) => {
          setCharacter(char);
          if (fr) setCharacterFraming(fr);
          if (dim) setCharacterDimension(dim);
          const meta = getCharacterMeta(char, project.custom_character);
          const nextGender = !meta.neutral
            ? meta.gender === 'female'
              ? 'wanita'
              : 'pria'
            : characterGender;
          setCharacterGender(nextGender);
          handleUpdateFullProject({
            ...project,
            character: char,
            character_framing: fr || characterFraming,
            character_dimension: dim || demoPreviewDimension || characterDimension,
            character_gender: nextGender,
          });
          setIsCharacterModalOpen(false);
        }}
      />

      <CharacterBuilderModal
        isOpen={isCharacterBuilderOpen}
        onClose={() => {
          setIsCharacterBuilderOpen(false);
          setEditingCustomCharacter(null);
        }}
        initialCharacter={editingCustomCharacter}
        themeMode={themeMode}
        onSaveAndUse={(saved) => {
          const nextGender = saved.gender === 'cewek' ? 'wanita' : 'pria';
          setCharacter(saved.id);
          setCharacterGender(nextGender);
          handleUpdateFullProject({
            ...project,
            character: saved.id,
            custom_character: saved,
            character_gender: nextGender,
          });
          setIsCharacterBuilderOpen(false);
          setEditingCustomCharacter(null);
        }}
      />

      <TransitionPickerModal
        isOpen={isTransitionModalOpen}
        onClose={() => setIsTransitionModalOpen(false)}
        selectedTransition={transition}
        onSelectTransition={(tr) => {
          setTransition(tr);
          handleUpdateFullProject({
            ...project,
            transition: tr,
          });
        }}
      />

      <SendToAiModal
        isOpen={Boolean(aiPickerState?.isOpen)}
        onClose={() => setAiPickerState(null)}
        title={aiPickerState?.title}
        subtitle={aiPickerState?.subtitle}
        promptText={aiPickerState?.promptText || ''}
        mediaItems={aiPickerState?.mediaItems || []}
        onDispatched={() => {
          if (aiPickerState?.mode === 'idea') {
            setPromptModalMode('idea');
            setPromptModalPasteOnly(true);
            setIsPromptModalOpen(true);
          } else if (aiPickerState?.mode === 'narasi') {
            setShowInlinePasteBox(true);
            setTimeout(() => {
              narasiPasteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
          }
        }}
      />

    </div>
  );
};

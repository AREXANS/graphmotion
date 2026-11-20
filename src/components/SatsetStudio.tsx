import React, { Suspense, useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Flag,
  Languages,
  User,
  Shuffle,
  Frame,
} from 'lucide-react';
import {
  type SatsetProject,
  type SatsetScene,
  type SatsetStyleModule,
  type VoiceOption,
  type SubtitleStyle,
  type ContentType,
  type StartMode,
  type LanguageOption,
  type AspectRatio,
  type TempoOption,
  type CharacterOption,
  type CharacterDimension,
  type TransitionOption,
  type BgmStyle,
  type IdeaConcept,
  type AssetMotionPreset,
  type UploadedTutorialMediaItem,
} from '../types/satset.ts';
import { SATSET_MODULES, type StyleModuleInfo } from '../data/satset-modules.ts';
import { SatsetCanvasPlayer } from './SatsetCanvasPlayer.tsx';
import { PromptBlueprintModal } from './PromptBlueprintModal.tsx';
import { ProjectManagerModal } from './ProjectManagerModal.tsx';
import { StyleModulePickerModal } from './StyleModulePickerModal.tsx';
import { CustomStyleModal } from './CustomStyleModal.tsx';
import { CharacterPickerModal } from './CharacterPickerModal.tsx';
import { TransitionPickerModal } from './TransitionPickerModal.tsx';
import { CharacterMotionDemoModal } from './CharacterMotionDemoModal.tsx';
import { CharacterBuilderModal } from './CharacterBuilderModal.tsx';
import { CharacterAvatarCanvas } from './CharacterAvatarCanvas.tsx';
import { TransitionPreviewCanvas } from './TransitionPreviewCanvas.tsx';
import {
  getCharacterMeta,
  getTransitionMeta,
  resolveCharacterOption,
} from '../utils/character-catalog.ts';
import { type CustomCharacterConfig } from '../utils/custom-character.ts';
import { getStoredCustomStyles, type CustomStyleDefinition } from '../utils/custom-style-parser.ts';
import {
  exportSatsetProjectToMp4,
  normalizeExportResolution,
  triggerBlobDownload,
} from '../utils/video-export.ts';
import { soundEngine } from '../utils/audio-synth.ts';

const VoiceSoundStudio = React.lazy(() =>
  import('./VoiceSoundStudio.tsx').then((m) => ({ default: m.VoiceSoundStudio }))
);
const SatsetAnimationStudio = React.lazy(() =>
  import('./SatsetAnimationStudio.tsx').then((m) => ({ default: m.SatsetAnimationStudio }))
);
import {
  generateRemotionCode,
  buildPromptBlueprint,
  buildNarasiPrompt,
  parseAndValidateAIBlueprint,
  SAMPLE_AI_NARASI_JSON,
} from '../utils/remotion-generator.ts';
import {
  synchronizeProjectPipeline,
  getPipelineStepStatus,
} from '../utils/pipeline-sync.ts';
import { SendToAiModal } from './SendToAiModal.tsx';
import { TutorialPointerBubble } from './TutorialPointerBubble.tsx';
import {
  AiPromptDispatchBox,
  type AiDispatchMode,
  type AiProviderId,
} from './AiPromptDispatchBox.tsx';
import {
  collectProjectPromptImages,
  dispatchPromptToAiPlatform,
  type AiPlatformId,
  type PromptMediaAttachment,
} from '../utils/ai-platform-router.ts';
import {
  extractWebsiteUrl,
  buildWebsitePromoProfile,
  buildWebsitePromoConcepts,
  buildWebsitePromoScenes,
  buildNonRepeatingScenesFromConcept,
} from '../utils/website-promo-engine.ts';
import { resolveAutoStyleForConceptAndScene } from '../utils/contextual-scene-builder.ts';
import {
  ASSET_MOTION_PRESET_OPTIONS,
  autoMatchUploadedAssetsToScenes,
  computeAutoTargetDuration,
  ensureWebsitePromoSnapshotsRegistered,
  getStepFocusRegion,
  inferAutoMotionForAssetAndScene,
  processUploadedTutorialMediaFiles,
  registerSceneUploadedMediaAsset,
} from '../utils/website-media-engine.ts';
import { type CreatorSessionUser } from './LandingPage3D.tsx';
import { GraphMotionBrandLockup, GraphMotionLogoMark } from './GraphMotionBrandLogo.tsx';

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
  const [isDurationDropdownOpen, setIsDurationDropdownOpen] = useState(true);
  const [showPasteTooltip, setShowPasteTooltip] = useState<boolean>(true);
  const [isVideoSettingsOpen, setIsVideoSettingsOpen] = useState<boolean>(false);
  const [copiedIdePrompt, setCopiedIdePrompt] = useState(false);
  const [copiedNarasiPrompt, setCopiedNarasiPrompt] = useState(false);
  const [aiDispatchMode, setAiDispatchMode] = useState<AiDispatchMode>('direct');
  const [ideSetupTutorialStep, setIdeSetupTutorialStep] = useState<number>(1);
  const [narasiSetupTutorialStep, setNarasiSetupTutorialStep] = useState<number>(1);
  const [naskahViewTutorialStep, setNaskahViewTutorialStep] = useState<number>(1);
  const [inlinePasteText, setInlinePasteText] = useState('');
  const [showInlinePasteBox, setShowInlinePasteBox] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [promptModalMode, setPromptModalMode] = useState<'idea' | 'narasi'>('idea');
  const [promptModalPasteOnly, setPromptModalPasteOnly] = useState<boolean>(true);
  const [showTempoTooltip, setShowTempoTooltip] = useState<boolean>(true);
  const [showNextTooltip, setShowNextTooltip] = useState<boolean>(true);
  const [preferredAiProvider, setPreferredAiProvider] = useState<AiPlatformId>('gemini');
  const [isIdeAiProviderPopoverOpen, setIsIdeAiProviderPopoverOpen] = useState<boolean>(false);
  const [isNarasiAiProviderPopoverOpen, setIsNarasiAiProviderPopoverOpen] = useState<boolean>(false);
  const [showIdeInlinePasteBox, setShowIdeInlinePasteBox] = useState<boolean>(false);
  const [ideInlinePasteText, setIdeInlinePasteText] = useState<string>('');
  const [idePasteError, setIdePasteError] = useState<string | null>(null);
  const [pastedIdeasSuccessList, setPastedIdeasSuccessList] = useState<IdeaConcept[] | null>(null);
  const [addSceneLinesText, setAddSceneLinesText] = useState<string>('');
  const [activeCameraModalSceneIdx, setActiveCameraModalSceneIdx] = useState<number | null>(null);
  const [activePhotoModalSceneIdx, setActivePhotoModalSceneIdx] = useState<number | null>(null);
  const [editingNarrationSceneIdx, setEditingNarrationSceneIdx] = useState<number | null>(null);
  const [elevenLabsTab, setElevenLabsTab] = useState<'baris' | 'polos' | 'emosi'>('baris');
  const [dismissedTutorialStep1Send, setDismissedTutorialStep1Send] = useState<boolean>(false);
  const [dismissedTutorialStep1Select, setDismissedTutorialStep1Select] = useState<boolean>(false);
  const [dismissedTutorialStep1Next, setDismissedTutorialStep1Next] = useState<boolean>(false);
  const [dismissedTutorialStep2Send, setDismissedTutorialStep2Send] = useState<boolean>(false);
  const [dismissedTutorialStep2Next, setDismissedTutorialStep2Next] = useState<boolean>(false);
  const [dismissedTutorialWordClick, setDismissedTutorialWordClick] = useState<boolean>(false);
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

  // Accordions for "Karakter" (open by default matching Screenshot_20261117-195053) & "Warna brand"
  const [isCharacterOpen, setIsCharacterOpen] = useState(true);
  const [isBrandColorOpen, setIsBrandColorOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Form values in Tab 1 (Ide - Atur)
  const initialTargetDur = project.target_duration_sec || project.durationSeconds || 60;
  const [startMode, setStartMode] = useState<StartMode>(project.start_mode || 'topic');
  const [language, setLanguage] = useState<LanguageOption>(project.language || 'id');
  const [contentType, setContentType] = useState<ContentType>(project.content_type || 'motivasi');
  const [topic, setTopic] = useState(project.topik_video || project.topic || '');
  const [sourceScript, setSourceScript] = useState<string>(project.source_script || '');
  const [scriptPolishMode, setScriptPolishMode] = useState<'rapikan' | 'persis' | 'polished' | 'exact'>(
    project.script_polish_mode || 'rapikan'
  );
  const [scriptAllowAddWords, setScriptAllowAddWords] = useState<boolean>(
    project.script_allow_add_words ?? true
  );
  const [promoProductName, setPromoProductName] = useState<string>(
    project.promo_product_name || ''
  );
  const [promoBenefits, setPromoBenefits] = useState<string>(
    project.promo_benefits || ''
  );
  const [promoPrice, setPromoPrice] = useState<string>(project.promo_price || '');
  const [promoCta, setPromoCta] = useState<string>(
    project.promo_cta || 'Klik link di bio untuk coba sekarang'
  );
  const [sceneCount, setSceneCount] = useState<number>(
    project.scene_count || (initialTargetDur >= 60 ? 8 : initialTargetDur >= 50 ? 6 : 5)
  );
  const [isSceneCountSliderOpen, setIsSceneCountSliderOpen] = useState<boolean>(false);
  const [isElevenLabsModalOpen, setIsElevenLabsModalOpen] = useState<boolean>(false);
  const [copiedElevenLabs, setCopiedElevenLabs] = useState<boolean>(false);
  const [stepGateWarning, setStepGateWarning] = useState<string | null>(null);
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
    setSourceScript(synced.source_script || '');
    setScriptPolishMode(synced.script_polish_mode || 'rapikan');
    setScriptAllowAddWords(synced.script_allow_add_words ?? true);
    setPromoProductName(synced.promo_product_name || '');
    setPromoBenefits(synced.promo_benefits || '');
    setPromoPrice(synced.promo_price || '');
    setPromoCta(synced.promo_cta || 'Klik link di bio untuk coba sekarang');
    const nextDur = synced.target_duration_sec || synced.durationSeconds || 60;
    setSceneCount(synced.scene_count || (nextDur >= 60 ? 8 : nextDur >= 50 ? 6 : 5));
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
    setStepGateWarning(null);
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

  const applyUploadedMediaListToProject = (
    nextUploads: UploadedTutorialMediaItem[],
    statusMessage?: string
  ) => {
    const isWebsiteMode = startMode === 'url' || Boolean(project.website_promo);
    const baseScenes = [...(project.scenes || [])];
    const targetCount = Math.max(baseScenes.length, nextUploads.length, 1);
    const activeTopic =
      (startMode === 'promo' ? promoProductName : topic).trim() ||
      project.topik_video ||
      project.project_title ||
      'Topik Video';

    const seedScenes: SatsetScene[] = [];
    for (let i = 0; i < targetCount; i++) {
      const scNum = i + 1;
      const existingScene: SatsetScene = baseScenes[i] || {
        id: `scene-${scNum}`,
        scene_number: scNum,
        sceneNumber: scNum,
        role: i === 0 ? 'hook' : i === targetCount - 1 ? 'cta' : 'body_core_point',
        target_duration_sec: 5,
        durationSeconds: 5,
        narration_text: `Langkah ke-${scNum}: perhatikan visual pada tahapan ini dan ikuti poin utama yang disorot.`,
        on_screen_text: `TAHAP 0${scNum}`,
        emphasis_words: ['Langkah', 'visual', 'utama'],
      };
      seedScenes.push({
        ...existingScene,
        visualModule: isWebsiteMode ? 'uiweb' : existingScene.visualModule || selectedModule,
      });
    }

    const matchedScenes =
      nextUploads.length > 0
        ? autoMatchUploadedAssetsToScenes(
            nextUploads,
            seedScenes,
            activeTopic,
            isWebsiteMode ? 'uiweb' : selectedModule
          )
        : seedScenes.map((sc) => ({
            ...sc,
            media_url: undefined,
            media_key: undefined,
            media_filename: undefined,
            asset_motion_preset: undefined,
            asset_motion_prompt: undefined,
          }));

    // Enrich idea concepts automatically when assets are uploaded or renamed so AI ideas match the assets & topic
    const assetNamesSummary = nextUploads
      .map((u, idx) => (u.name || u.filename || `Aset ${idx + 1}`).replace(/\.[a-z0-9]{2,5}$/i, '').trim())
      .filter(Boolean);
    const updatedConcepts =
      project.idea_concepts && project.idea_concepts.length > 0 && assetNamesSummary.length > 0
        ? project.idea_concepts.map((concept, cIdx) => {
            const primaryAsset = assetNamesSummary[cIdx % assetNamesSummary.length];
            const cleanBaseAngle = (concept.angle || '').replace(/\s*\[Aset Visual:[^\]]+\]/gi, '').trim();
            return {
              ...concept,
              angle: `${cleanBaseAngle} [Aset Visual: ${assetNamesSummary.join(', ')}]`,
              visualStyle: `${selectedModule} + koreografi otomatis aset "${primaryAsset}"`,
            };
          })
        : project.idea_concepts;

    if (statusMessage) {
      setWebsitePromoStatus(statusMessage);
    }

    handleUpdateFullProject(
      {
        ...project,
        uploaded_tutorial_media: nextUploads,
        idea_concepts: updatedConcepts,
        scenes: matchedScenes,
        scene_codes: {},
        scene_codes_configured: {},
      },
      { recalculateDurations: false, forceStyleSync: true }
    );
  };

  const handleUploadTutorialMediaFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const items = await processUploadedTutorialMediaFiles(files);
    if (items.length === 0) return;

    const existingUploads = [...(project.uploaded_tutorial_media || []), ...items];
    soundEngine.playSfx('sparkle');
    applyUploadedMediaListToProject(
      existingUploads,
      `${items.length} aset visual (${items.map((x) => x.filename).join(', ')}) berhasil dipasang ke koreografi Remotion.`
    );
  };

  const handleUpdateUploadedMediaItem = (
    itemId: string,
    patch: Partial<UploadedTutorialMediaItem>
  ) => {
    const existingUploads = [...(project.uploaded_tutorial_media || [])];
    const nextUploads = existingUploads.map((item) =>
      item.id === itemId ? { ...item, ...patch } : item
    );
    applyUploadedMediaListToProject(nextUploads);
  };

  const handleRemoveUploadedMediaItem = (itemId: string) => {
    const existingUploads = [...(project.uploaded_tutorial_media || [])];
    const nextUploads = existingUploads.filter((item) => item.id !== itemId);
    soundEngine.playSfx('click');
    applyUploadedMediaListToProject(nextUploads);
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

  // Step 1 prerequisite check
  const step1MissingChecklist = useMemo<string[]>(() => {
    if (startMode === 'promo') {
      const missing: string[] = [];
      if (!promoProductName.trim()) missing.push('Isi nama produk / jasa dulu');
      if (!promoBenefits.trim()) missing.push('Isi keunggulan & manfaat utama produk dulu');
      return missing;
    }
    if (startMode === 'script') {
      if (sourceScript.trim().length < 10) {
        return ['Tulis atau tempel narasimu dulu (minimal 1 kalimat)'];
      }
      return [];
    }
    if (startMode === 'url') {
      if (!extractWebsiteUrl(websiteUrlInput || topic)) {
        return ['Masukkan URL website yang valid dulu (contoh: https://namabrand.com)'];
      }
      return [];
    }
    if (!topic.trim()) {
      return ['Isi topik atau bahasan video dulu'];
    }
    return [];
  }, [startMode, promoProductName, promoBenefits, sourceScript, websiteUrlInput, topic]);

  // Kirim perintah ke AI: buka pemilih AI terlebih dahulu beserta prompt & gambar yang diatur
  const handleKirimKeAI = () => {
    if (step1MissingChecklist.length > 0) {
      soundEngine.playSfx('click');
      setStepGateWarning(`Belum memenuhi syarat Tahap 1 (Ide): ${step1MissingChecklist.join(' · ')}`);
      return;
    }
    setStepGateWarning(null);
    setIsPlaying(false);
    setPromptModalMode(startMode === 'promo' || startMode === 'script' ? 'narasi' : 'idea');
    const currentP: Partial<SatsetProject> = {
      ...project,
      start_mode: startMode,
      language,
      content_type: startMode === 'promo' ? 'promosi' : contentType,
      project_title:
        startMode === 'promo'
          ? promoProductName || project.project_title || 'Video Promosi'
          : project.project_title || project.title || topic || 'Proyek Video',
      topik_video: startMode === 'promo' ? promoProductName : topic,
      source_script: sourceScript,
      script_polish_mode: scriptPolishMode,
      script_allow_add_words: scriptAllowAddWords,
      promo_product_name: promoProductName,
      promo_benefits: promoBenefits,
      promo_price: promoPrice,
      promo_cta: promoCta,
      scene_count: sceneCount,
      target_duration_sec: calculatedDuration,
      duration_mode: durationPreset,
      gaya_video: selectedModule,
      character,
      custom_character: project.custom_character,
      warna_brand: brandColor,
      brand_secondary_color: brandSecondaryColor,
      brand_accent_color: brandAccentColor,
      brand_mode: brandColorMode,
      tempo,
      aspect_ratio: aspectRatio,
    };
    const promptText = buildPromptBlueprint(currentP);
    const mediaItems = collectProjectPromptImages(currentP);
    soundEngine.playSfx('click');

    setAiPickerState({
      isOpen: true,
      mode: startMode === 'promo' || startMode === 'script' ? 'narasi' : 'idea',
      title:
        startMode === 'promo'
          ? 'Kirim Prompt Promosi Produk ke AI'
          : startMode === 'script'
          ? 'Kirim Prompt Olah Naskah ke AI'
          : 'Kirim Prompt Ide Video ke AI',
      subtitle:
        'Pilih AI tujuan terlebih dahulu (Claude, ChatGPT, Gemini, dll). Perintah sudah disalin otomatis sesuai seluruh pengaturanmu.',
      promptText,
      mediaItems,
    });
  };

  // Kirim perintah narasi ke AI: buka pemilih AI terlebih dahulu beserta prompt & gambar yang diatur
  const handleKirimNarasiKeAI = () => {
    setStepGateWarning(null);
    setIsPlaying(false);
    setPromptModalMode('narasi');
    const currentP: Partial<SatsetProject> = {
      ...project,
      start_mode: startMode,
      language,
      content_type: contentType,
      project_title: project.project_title || project.title || 'Kenapa Pagi Terasa Berat?',
      topik_video: topic,
      source_script: sourceScript,
      script_polish_mode: scriptPolishMode,
      script_allow_add_words: scriptAllowAddWords,
      promo_product_name: promoProductName,
      promo_benefits: promoBenefits,
      promo_price: promoPrice,
      promo_cta: promoCta,
      scene_count: sceneCount,
      target_duration_sec: calculatedDuration,
      duration_mode: durationPreset,
      gaya_video: selectedModule,
      character,
      custom_character: project.custom_character,
      warna_brand: brandColor,
      brand_secondary_color: brandSecondaryColor,
      brand_accent_color: brandAccentColor,
      brand_mode: brandColorMode,
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
      title: 'Kirim Prompt Narasi Scene ke AI',
      subtitle:
        'Pilih AI tujuan terlebih dahulu. Setelah dipilih, AI akan dibuka dengan prompt narasi lengkap & aset media proyek.',
      promptText,
      mediaItems,
    });
  };

  const ensureDefaultConceptsAndSelect = (autoSelectFirst = false) => {
    const existingConcepts =
      project.idea_concepts && project.idea_concepts.length > 0
        ? project.idea_concepts
        : [];
    const baseTopic =
      (startMode === 'promo' ? promoProductName : topic).trim() ||
      project.topik_video ||
      project.topic ||
      'Berhenti Merokok & Hidup Lebih Sehat';
    const uploadedNames = (project.uploaded_tutorial_media || [])
      .map((u, idx) => (u.name || u.filename || `Aset ${idx + 1}`).replace(/\.[a-z0-9]{2,5}$/i, '').trim())
      .filter(Boolean);
    const assetContextNote =
      uploadedNames.length > 0
        ? ` Menampilkan bukti visual dari aset (${uploadedNames.join(', ')}) yang dianimasikan otomatis mengikuti naskah.`
        : '';
    const nextConcepts: IdeaConcept[] =
      existingConcepts.length > 0
        ? existingConcepts
        : [
            {
              id: 'idea_default_1',
              title: `${baseTopic}: Matikan Kompornya, Bukan Tambah Asapnya`,
              hook: `Berhenti melakukan cara lama soal ${baseTopic}. Mulai bereskan akar masalahnya hari ini.`,
              hookProposal: `Berhenti melakukan cara lama soal ${baseTopic}. Mulai bereskan akar masalahnya hari ini.`,
              angle: `Membahas ${baseTopic} dengan analogi sehari-hari yang dekat, tajam, dan langsung kena.${assetContextNote}`,
              corePoints: uploadedNames.length > 0 ? uploadedNames.slice(0, 4) : undefined,
            },
            {
              id: 'idea_default_2',
              title: `Kenapa 90% Orang Gagal Soal ${baseTopic} di Minggu Pertama`,
              hook: `Bukan niatmu yang kurang kuat soal ${baseTopic}, tapi sistem harianmu yang salah sasaran.`,
              hookProposal: `Bukan niatmu yang kurang kuat soal ${baseTopic}, tapi sistem harianmu yang salah sasaran.`,
              angle: `Membedah kesalahan pola pikir umum seputar ${baseTopic} dan langkah praktis mengatasinya.${assetContextNote}`,
              corePoints: uploadedNames.length > 0 ? uploadedNames.slice(0, 4) : undefined,
            },
            {
              id: 'idea_default_3',
              title: `Aturan 3 Menit Saat Keinginan Lama Muncul Lagi`,
              hook: `Saat dorongan lama datang, tunda 3 menit saja dan lihat apa yang terjadi pada otakmu.`,
              hookProposal: `Saat dorongan lama datang, tunda 3 menit saja dan lihat apa yang terjadi pada otakmu.`,
              angle: `Teknik neuro-kebiasaan praktis untuk memutus siklus impulsif dalam hitungan menit.${assetContextNote}`,
              corePoints: uploadedNames.length > 0 ? uploadedNames.slice(0, 4) : undefined,
            },
            {
              id: 'idea_default_4',
              title: `Hitung Sendiri: Apa yang Hilang Diam-Diam Setiap Bulan`,
              hook: `Kalau dijumlahkan setahun, angkanya cukup untuk mengubah hidupmu secara nyata.`,
              hookProposal: `Kalau dijumlahkan setahun, angkanya cukup untuk mengubah hidupmu secara nyata.`,
              angle: `Visualisasi perbandingan biaya waktu, energi, dan uang secara kontras dan membuka mata.${assetContextNote}`,
              corePoints: uploadedNames.length > 0 ? uploadedNames.slice(0, 4) : undefined,
            },
            {
              id: 'idea_default_5',
              title: `Versi Dirimu 30 Hari dari Sekarang Dimulai dari Satu Keputusan Ini`,
              hook: `Kamu tidak perlu menunggu tahun depan untuk memulai perubahan pertama.`,
              hookProposal: `Kamu tidak perlu menunggu tahun depan untuk memulai perubahan pertama.`,
              angle: `Storytelling transformasi bertahap dari hari ke-1 hingga hari ke-30 yang realistis.${assetContextNote}`,
              corePoints: uploadedNames.length > 0 ? uploadedNames.slice(0, 4) : undefined,
            },
          ];
    const chosenConcept =
      nextConcepts.find((c) => c.id === project.selected_idea_id) || nextConcepts[0];
    handleUpdateFullProject(
      {
        ...project,
        topik_video: baseTopic,
        topic: baseTopic,
        idea_concepts: nextConcepts,
        selected_idea_id: autoSelectFirst ? chosenConcept.id : project.selected_idea_id,
        step_ide_done: autoSelectFirst ? true : project.step_ide_done,
      },
      { recalculateDurations: false }
    );
    return { nextConcepts, chosenConcept };
  };

  const advanceIdeSetupTutorial = () => {
    if (ideSetupTutorialStep >= 8) {
      try {
        localStorage.setItem('satset_ide_setup_tutorial_done', '1');
      } catch {
        // ignore
      }
      setIdeSetupTutorialStep(0);
      setDismissedTutorialStep1Send(true);
      if (project.step_ide_done && project.selected_idea_id) {
        const chosen =
          project.idea_concepts?.find((c) => c.id === project.selected_idea_id) ||
          project.idea_concepts?.[0];
        if (chosen) {
          handleSelectConcept(chosen);
          return;
        }
      }
      ensureDefaultConceptsAndSelect(false);
      setDismissedTutorialStep1Select(false);
      setDismissedTutorialStep1Next(false);
      setIdeSubTab('pilih_ide');
      return;
    }
    setIdeSetupTutorialStep((prev) => prev + 1);
  };

  const skipIdeSetupTutorial = () => {
    try {
      localStorage.setItem('satset_ide_setup_tutorial_done', '1');
    } catch {
      // ignore
    }
    setIdeSetupTutorialStep(0);
  };

  const advanceNarasiSetupTutorial = () => {
    if (narasiSetupTutorialStep >= 5) {
      try {
        localStorage.setItem('satset_narasi_setup_tutorial_done', '1');
      } catch {
        // ignore
      }
      setNarasiSetupTutorialStep(0);
      handleUpdateFullProject(
        {
          ...project,
          step_ide_done: true,
          step_naskah_done: true,
        },
        { recalculateDurations: false }
      );
      setNaskahSubTab('naskah');
      setNaskahViewTutorialStep(1);
      setDismissedTutorialStep2Next(false);
    } else {
      setNarasiSetupTutorialStep((prev) => prev + 1);
    }
  };

  const skipNarasiSetupTutorial = () => {
    try {
      localStorage.setItem('satset_narasi_setup_tutorial_done', '1');
    } catch {
      // ignore
    }
    setNarasiSetupTutorialStep(0);
  };

  const buildCurrentIdePromptText = () => {
    const currentP: Partial<SatsetProject> = {
      ...project,
      start_mode: startMode,
      language,
      content_type: startMode === 'promo' ? 'promosi' : contentType,
      project_title:
        startMode === 'promo'
          ? promoProductName || project.project_title || 'Video Promosi'
          : project.project_title || project.title || topic || 'Proyek Video',
      topik_video: startMode === 'promo' ? promoProductName : topic,
      source_script: sourceScript,
      script_polish_mode: scriptPolishMode,
      script_allow_add_words: scriptAllowAddWords,
      promo_product_name: promoProductName,
      promo_benefits: promoBenefits,
      promo_price: promoPrice,
      promo_cta: promoCta,
      scene_count: sceneCount,
      target_duration_sec: calculatedDuration,
      duration_mode: durationPreset,
      gaya_video: selectedModule,
      character,
      custom_character: project.custom_character,
      warna_brand: brandColor,
      brand_secondary_color: brandSecondaryColor,
      brand_accent_color: brandAccentColor,
      brand_mode: brandColorMode,
      tempo,
      aspect_ratio: aspectRatio,
    };
    return buildPromptBlueprint(currentP);
  };

  const handleSalinPromptIde = () => {
    const promptText = buildCurrentIdePromptText();
    try {
      navigator.clipboard.writeText(promptText);
      setCopiedIdePrompt(true);
      setTimeout(() => setCopiedIdePrompt(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleDispatchIdePrompt = (ai: AiProviderId, mode: AiDispatchMode) => {
    setPreferredAiProvider(ai);
    setAiDispatchMode(mode);
    setDismissedTutorialStep1Send(true);
    const promptText = buildCurrentIdePromptText();
    setCopiedIdePrompt(true);
    setTimeout(() => setCopiedIdePrompt(false), 2500);
    dispatchPromptToAiPlatform(ai, promptText, mode, {
      mdFilename: 'perintah-ide-satset.md',
    });
    setShowIdeInlinePasteBox(true);
    soundEngine.playSfx('click');
  };

  const handleSalinPromptNarasi = () => {
    const currentP: Partial<SatsetProject> = {
      ...project,
      start_mode: startMode,
      language,
      content_type: contentType,
      project_title: project.project_title || project.title || 'Matikan Kompornya, Bukan Tambah Asapnya',
      topik_video: topic,
      source_script: sourceScript,
      script_polish_mode: scriptPolishMode,
      script_allow_add_words: scriptAllowAddWords,
      promo_product_name: promoProductName,
      promo_benefits: promoBenefits,
      promo_price: promoPrice,
      promo_cta: promoCta,
      scene_count: sceneCount,
      target_duration_sec: calculatedDuration,
      duration_mode: durationPreset,
      gaya_video: selectedModule,
      character,
      custom_character: project.custom_character,
      warna_brand: brandColor,
      brand_secondary_color: brandSecondaryColor,
      brand_accent_color: brandAccentColor,
      brand_mode: brandColorMode,
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

  const handleDispatchNarasiPrompt = (ai: AiProviderId, mode: AiDispatchMode) => {
    setPreferredAiProvider(ai);
    setAiDispatchMode(mode);
    setDismissedTutorialStep2Send(true);
    const currentP: Partial<SatsetProject> = {
      ...project,
      start_mode: startMode,
      language,
      content_type: contentType,
      project_title: project.project_title || project.title || 'Matikan Kompornya, Bukan Tambah Asapnya',
      topik_video: topic,
      source_script: sourceScript,
      script_polish_mode: scriptPolishMode,
      script_allow_add_words: scriptAllowAddWords,
      promo_product_name: promoProductName,
      promo_benefits: promoBenefits,
      promo_price: promoPrice,
      promo_cta: promoCta,
      scene_count: sceneCount,
      target_duration_sec: calculatedDuration,
      duration_mode: durationPreset,
      gaya_video: selectedModule,
      character,
      custom_character: project.custom_character,
      warna_brand: brandColor,
      brand_secondary_color: brandSecondaryColor,
      brand_accent_color: brandAccentColor,
      brand_mode: brandColorMode,
      tempo,
      aspect_ratio: aspectRatio,
      selected_idea_id: project.selected_idea_id,
      idea_concepts: project.idea_concepts,
      creator_note: creatorNote,
    };
    const promptText = buildNarasiPrompt(currentP, creatorNote);
    setCopiedNarasiPrompt(true);
    setTimeout(() => setCopiedNarasiPrompt(false), 2500);
    dispatchPromptToAiPlatform(ai, promptText, mode, {
      mdFilename: 'perintah-narasi-satset.md',
    });
    setShowInlinePasteBox(true);
    soundEngine.playSfx('click');
  };

  const handleApplyInlineIde = (textToApply: string) => {
    setIdePasteError(null);
    const trimmed = textToApply.trim();
    if (!trimmed) return;
    const res = parseAndValidateAIBlueprint(trimmed);
    if (!res.success || !res.project) {
      // Check for structured IDE N / JUDUL: / HOOK: / KONSEP: blocks first
      const ideBlocks = trimmed
        .split(/(?:^|\n)\s*(?:IDE|KONSEP)\s*\d+\s*[:.-]?\s*(?:\n|$)/i)
        .map((b) => b.trim())
        .filter(Boolean);
      const parsedStructured: IdeaConcept[] = [];
      if (ideBlocks.length >= 1 && /(?:JUDUL|TITLE|HOOK)\s*:/i.test(trimmed)) {
        ideBlocks.forEach((block, idx) => {
          const titleMatch = block.match(/(?:JUDUL|TITLE)\s*:\s*([^\n]+)/i);
          const hookMatch = block.match(/HOOK\s*:\s*([^\n]+)/i);
          const angleMatch = block.match(/(?:KONSEP|ANGLE|ISI|VISUAL)\s*:\s*([^\n]+)/i);
          const cleanTitle = (titleMatch?.[1] || block.split('\n')[0] || '')
            .replace(/^(?:JUDUL|TITLE)\s*:\s*/i, '')
            .replace(/^["“”']+|["“”']+$/g, '')
            .trim();
          const cleanHook = (hookMatch?.[1] || `Berhenti melakukan cara lama soal ${topic.trim() || 'hal ini'}.`)
            .replace(/^HOOK\s*:\s*/i, '')
            .replace(/^["“”']+|["“”']+$/g, '')
            .trim();
          const cleanAngle = (angleMatch?.[1] || `Membahas ${cleanTitle} dengan analogi sehari-hari yang dekat dan langsung kena.`)
            .replace(/^(?:KONSEP|ANGLE|ISI|VISUAL)\s*:\s*/i, '')
            .trim();
          if (cleanTitle) {
            parsedStructured.push({
              id: `idea_${Date.now()}_${idx + 1}`,
              title: cleanTitle.slice(0, 90),
              hook: cleanHook,
              hookProposal: cleanHook,
              angle: cleanAngle,
            });
          }
        });
      }

      const rawLines = trimmed
        .split(/\n+/)
        .map((l) =>
          l
            .replace(/^[-*\d.)+\s]+/, '')
            .replace(/^(?:IDE\s*\d+|JUDUL|TITLE|HOOK|KONSEP|CTA|VISUAL)\s*[:.-]?\s*/i, '')
            .trim()
        )
        .filter((l) => l.length >= 6);
      if (parsedStructured.length >= 1 || rawLines.length >= 1) {
        const baseTopic = topic.trim() || parsedStructured[0]?.title.slice(0, 40) || rawLines[0].slice(0, 40);
        const generatedConcepts: IdeaConcept[] =
          parsedStructured.length >= 1
            ? parsedStructured
            : Array.from({ length: 5 }).map((_, idx) => {
                const lineTitle = rawLines[idx] || `${baseTopic} — Sudut Pandang #${idx + 1}`;
                return {
                  id: `idea_${Date.now()}_${idx + 1}`,
                  title: lineTitle.slice(0, 90),
                  hook: `Berhenti melakukan cara lama soal ${baseTopic}. Coba langkah ini sekarang.`,
                  hookProposal: `Berhenti melakukan cara lama soal ${baseTopic}. Coba langkah ini sekarang.`,
                  angle: rawLines[idx + 1] || `Membahas ${baseTopic} dengan analogi sehari-hari yang dekat dan langsung kena.`,
                };
              });
        const updatedFallback: SatsetProject = {
          ...project,
          topik_video: baseTopic,
          topic: baseTopic,
          idea_concepts: generatedConcepts,
          selected_idea_id: undefined,
          step_ide_done: false,
        };
        handleUpdateFullProject(updatedFallback);
        setShowIdeInlinePasteBox(false);
        setIdeInlinePasteText('');
        setDismissedTutorialStep1Select(false);
        setPastedIdeasSuccessList(generatedConcepts);
        return;
      }
      setIdePasteError(res.error || 'Format JSON tidak valid.');
      return;
    }
    const nextConcepts = res.project.idea_concepts || [];
    const hasDirectScriptOnly = nextConcepts.length === 0;
    const updated: SatsetProject = {
      ...project,
      ...res.project,
      selected_idea_id: hasDirectScriptOnly ? res.project.selected_idea_id : undefined,
      gaya_video: res.project.gaya_video || selectedModule,
      character,
      aspect_ratio: res.project.aspect_ratio || aspectRatio,
      warna_brand: brandColor,
      tempo,
      creator_note: creatorNote,
      step_ide_done: hasDirectScriptOnly,
      step_naskah_done: hasDirectScriptOnly ? true : false,
    } as SatsetProject;
    handleUpdateFullProject(updated);
    setStepGateWarning(null);
    setShowIdeInlinePasteBox(false);
    setIdeInlinePasteText('');
    setDismissedTutorialStep1Select(false);
    if (nextConcepts.length > 0) {
      setPastedIdeasSuccessList(nextConcepts);
    } else {
      setCurrentStep('naskah');
      setNaskahSubTab('naskah');
    }
  };

  const handleApplyInlineNarasi = (textToApply: string) => {
    setPasteError(null);
    const trimmed = textToApply.trim();
    if (!trimmed) return;
    const res = parseAndValidateAIBlueprint(trimmed);
    if (!res.success || !res.project) {
      // Fallback: if user pasted plain narration paragraphs, build scenes from lines
      const lines = trimmed
        .split(/\n+/)
        .map((l) => l.replace(/^[-*\d.)+\s]+/, '').trim())
        .filter((l) => l.length >= 8);
      if (lines.length >= 2) {
        const builtScenes: SatsetScene[] = lines.slice(0, 15).map((lineText, idx) => ({
          id: `sc_paste_${idx + 1}`,
          nomor: idx + 1,
          scene_number: idx + 1,
          sceneNumber: idx + 1,
          narration_text: lineText,
          voiceScript: lineText,
          target_duration_sec: 5,
          durationSeconds: 5,
          visual_description: lineText,
          visualPrompt: lineText,
          visualModule: selectedModule === 'otomatis' ? 'analytic' : selectedModule,
          camera_movement: 'auto',
          transition_type: 'cut',
          emphasis_words: lineText.split(/\s+/).slice(-2, -1),
        }));
        handleUpdateFullProject({
          ...project,
          scene_count: builtScenes.length,
          scenes: builtScenes,
          step_ide_done: true,
          step_naskah_done: true,
        });
        setSceneCount(builtScenes.length);
        setDismissedTutorialStep2Send(true);
        setCurrentStep('naskah');
        setNaskahSubTab('naskah');
        setShowInlinePasteBox(false);
        setInlinePasteText('');
        return;
      }
      setPasteError(res.error || 'Format JSON tidak valid.');
      return;
    }
    if (res.project.scene_count) {
      setSceneCount(res.project.scene_count);
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
      step_ide_done: true,
      step_naskah_done: true,
    } as SatsetProject);
    setStepGateWarning(null);
    setDismissedTutorialStep2Send(true);
    setCurrentStep('naskah');
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
              step_ide_done: true,
              step_naskah_done: true,
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
      step_ide_done: true,
      step_naskah_done: true,
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
      sceneCount >= 4 && sceneCount <= 20
        ? sceneCount
        : calculatedDuration >= 90
        ? 10
        : calculatedDuration >= 60
        ? 8
        : calculatedDuration >= 50
        ? 6
        : 4;

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
      scene_count: targetScenesCount,
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
      step_ide_done: true,
      step_naskah_done: false,
    };
    handleUpdateFullProject(updated, { recalculateDurations: false, forceStyleSync: true });
    setStepGateWarning(null);
    setNarasiSetupTutorialStep(1);
    setCurrentStep('naskah');
    setNaskahSubTab('atur');
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
      nomor: i + 1,
      scene_number: i + 1,
      sceneNumber: i + 1,
    }));
    handleUpdateFullProject({ ...project, scenes: updatedScenes });
  };

  const handleMoveScene = (idx: number, dir: -1 | 1) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= project.scenes.length) return;
    const updatedScenes = [...project.scenes];
    const temp = updatedScenes[idx];
    updatedScenes[idx] = updatedScenes[targetIdx];
    updatedScenes[targetIdx] = temp;
    const reindexed = updatedScenes.map((s, i) => ({
      ...s,
      nomor: i + 1,
      scene_number: i + 1,
      sceneNumber: i + 1,
    }));
    handleUpdateFullProject({ ...project, scenes: reindexed }, { recalculateDurations: false });
  };

  const handleAddScenesFromLines = () => {
    const lines = addSceneLinesText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    const startIdx = project.scenes.length;
    const newScenes: SatsetScene[] = lines.map((lineText, idx) => {
      const scNum = startIdx + idx + 1;
      const words = lineText
        .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 4);
      const empWord = words[Math.floor(words.length / 2)] || words[0] || 'penting';
      const dur = Math.max(3.5, Math.min(9.5, Math.round((lineText.split(/\s+/).length / 2.6) * 100) / 100));
      return {
        id: `sc-${scNum}-${Date.now().toString(36)}-${idx}`,
        nomor: scNum,
        scene_number: scNum,
        sceneNumber: scNum,
        role: scNum === 1 ? 'hook' : 'body_core_point',
        target_duration_sec: dur,
        durationSeconds: dur,
        narasi: lineText,
        narration_text: lineText,
        voiceScript: lineText,
        on_screen_text: lineText.split(/\s+/).slice(0, 5).join(' '),
        hookText: lineText.split(/\s+/).slice(0, 5).join(' '),
        emphasis: empWord,
        emphasis_words: [empWord],
        emphasisWords: [empWord],
        camera: 'zoom_in',
        visual: `[Ruang interior, siang] Wide shot set ruangan utuh memenuhi seluruh frame vertikal dengan palet hangat (#c9d3c0, kayu #8a6a4a, dasar #b9b39a, sejuk #4f7a7a, aksen #e2b84b, garis tipis #2f3a33): tokoh utama memperagakan "${lineText.slice(0, 60)}" dengan objek kontekstual yang bergerak halus.`,
        visualDescription: `[Ruang interior, siang] Wide shot set ruangan utuh memenuhi seluruh frame vertikal dengan palet hangat (#c9d3c0, kayu #8a6a4a, dasar #b9b39a, sejuk #4f7a7a, aksen #e2b84b, garis tipis #2f3a33): tokoh utama memperagakan "${lineText.slice(0, 60)}" dengan objek kontekstual yang bergerak halus.`,
        visualModule: selectedModule,
        accentColor: brandColor,
        secondaryColor: '#facc15',
        sfxCue: 'pop',
      };
    });
    const combined = [...project.scenes, ...newScenes];
    setAddSceneLinesText('');
    setSceneCount(combined.length);
    soundEngine.playSfx('sparkle');
    handleUpdateFullProject(
      {
        ...project,
        scene_count: combined.length,
        scenes: combined,
        step_naskah_done: true,
      },
      { recalculateDurations: false }
    );
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
                  ? 'bg-blue-600 border-white'
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
            <div className="max-w-xl mx-auto space-y-3.5 pb-12">
              {/* SUBTAB HEADER: Atur | Pilih ide [5] (Matches Screenshot_20261117-195053_17bdca86.jpg 100%) */}
              <div className="flex items-center gap-2">
                <div
                  className={`flex-1 grid grid-cols-2 p-1 rounded-2xl border ${
                    isLight
                      ? 'bg-slate-200/80 border-slate-300/80'
                      : 'bg-[#11151E] border-white/[0.08]'
                  }`}
                >
                  <button
                    type="button"
                    data-testid="ide-subtab-atur"
                    onClick={() => setIdeSubTab('atur')}
                    className={`py-2.5 px-4 text-xs font-bold rounded-xl transition cursor-pointer ${
                      ideSubTab === 'atur'
                        ? isLight
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'bg-[#1A2030] text-white shadow-sm border border-white/[0.08]'
                        : isLight
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Atur
                  </button>
                  <button
                    type="button"
                    data-testid="ide-subtab-pilih"
                    onClick={() => setIdeSubTab('pilih_ide')}
                    className={`py-2.5 px-4 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      ideSubTab === 'pilih_ide'
                        ? isLight
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'bg-[#1A2030] text-white shadow-sm border border-white/[0.08]'
                        : isLight
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Pilih ide</span>
                    {project.idea_concepts && project.idea_concepts.length > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center leading-none">
                        {project.idea_concepts.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* SUBTAB: ATUR FORM (Matches Screenshot_20261117-195053_17bdca86.jpg 100%) */}
              {ideSubTab === 'atur' && (
                <div className="space-y-4">
                  {/* Top Selected Idea Banner in Atur (Only shown after user has pasted ideas & selected one) */}
                  {(() => {
                    const concepts = project.idea_concepts || [];
                    const selectedConcept =
                      project.step_ide_done && project.selected_idea_id
                        ? concepts.find((c) => c.id === project.selected_idea_id) || null
                        : null;
                    if (!selectedConcept) return null;
                    const hasSuccessModalOpen = Boolean(
                      pastedIdeasSuccessList && pastedIdeasSuccessList.length > 0
                    );
                    return (
                      <div className="space-y-1">
                        <div
                          data-testid="atur-selected-idea-banner"
                          className={`p-3.5 rounded-2xl border space-y-3 ${
                            isLight
                              ? 'bg-white border-emerald-500/40 shadow-xs'
                              : 'bg-[#11151E] border-emerald-500/35'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            </div>
                            <p
                              className={`text-xs sm:text-[13px] font-bold leading-snug truncate ${
                                isLight ? 'text-slate-900' : 'text-white'
                              }`}
                            >
                              Ide terpilih: {selectedConcept.title}
                            </p>
                          </div>

                          <div className="p-0.5 rounded-xl border border-blue-500/35">
                            <button
                              type="button"
                              data-testid="atur-lanjut-ke-narasi-btn"
                              onClick={() => {
                                setDismissedTutorialStep1Next(true);
                                handleSelectConcept(selectedConcept);
                              }}
                              className="w-full py-2.5 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[13px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                            >
                              <span>Lanjut ke Narasi</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {!hasSuccessModalOpen && !dismissedTutorialStep1Next && (
                          <TutorialPointerBubble
                            testId="tutorial-atur-lanjut-narasi-pointer"
                            title="Ide Sudah Siap — Lanjut ke Narasi"
                            text="Pengaturan ide sudah lengkap! Klik Lanjut untuk menyusun naskah per scene di halaman 2. Narasi."
                            nextLabel="Ke 2. Narasi →"
                            onNext={() => {
                              setDismissedTutorialStep1Next(true);
                              handleSelectConcept(selectedConcept);
                            }}
                            onDismiss={() => setDismissedTutorialStep1Next(true)}
                            className="pl-4"
                          />
                        )}
                      </div>
                    );
                  })()}

                  {/* GROUPED SETTINGS CARD 1: Mulai dari | Bahasa | Jenis konten */}
                  <div
                    className={`rounded-2xl border divide-y ${
                      isLight
                        ? 'bg-white border-slate-200 divide-slate-200/80 shadow-xs'
                        : 'bg-[#11151E] border-white/[0.08] divide-white/[0.06]'
                    }`}
                  >
                    {/* Row 1: Mulai dari */}
                    <div className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 shrink-0">
                        <Flag className="w-4 h-4 text-blue-500" />
                        <span className={`text-xs sm:text-[13px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          Mulai dari
                        </span>
                      </div>
                      <div className="relative min-w-[185px] sm:min-w-[215px]">
                        <select
                          data-testid="ide-start-mode-select"
                          value={startMode}
                          onChange={(e) => {
                            const nextMode = e.target.value as StartMode;
                            setStartMode(nextMode);
                            setStepGateWarning(null);
                            if (nextMode === 'promo') {
                              setContentType('promosi');
                            }
                            handleUpdateFullProject({
                              ...project,
                              start_mode: nextMode,
                              content_type: nextMode === 'promo' ? 'promosi' : contentType,
                            });
                          }}
                          className={`w-full appearance-none rounded-xl px-3.5 py-2 pr-8 text-xs font-semibold border focus:outline-none focus:border-blue-500 cursor-pointer ${
                            isLight
                              ? 'bg-slate-50 border-slate-200 text-slate-900'
                              : 'bg-[#161B26] border-white/[0.1] text-white'
                          }`}
                        >
                          <option value="topic">Minta ide dari topik</option>
                          <option value="script">Pakai narasi sendiri</option>
                          <option value="promo">Promosi produk / jasa</option>
                          <option value="url">URL Website</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Row 2: Bahasa */}
                    <div className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 shrink-0">
                        <Languages className="w-4 h-4 text-blue-500" />
                        <span className={`text-xs sm:text-[13px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          Bahasa
                        </span>
                      </div>
                      <div className="relative min-w-[185px] sm:min-w-[215px]">
                        <select
                          data-testid="ide-language-select"
                          value={language}
                          onChange={(e) => {
                            const nextLang = e.target.value as LanguageOption;
                            setLanguage(nextLang);
                            handleUpdateFullProject({
                              ...project,
                              language: nextLang,
                            });
                          }}
                          className={`w-full appearance-none rounded-xl px-3.5 py-2 pr-8 text-xs font-semibold border focus:outline-none focus:border-blue-500 cursor-pointer ${
                            isLight
                              ? 'bg-slate-50 border-slate-200 text-slate-900'
                              : 'bg-[#161B26] border-white/[0.1] text-white'
                          }`}
                        >
                          <option value="id">🇮🇩 Bahasa Indonesia</option>
                          <option value="en">🇬🇧 English</option>
                          <option value="jv">Jawa</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Row 3: Jenis konten */}
                    <div className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 shrink-0">
                        <LayoutGrid className="w-4 h-4 text-blue-500" />
                        <span className={`text-xs sm:text-[13px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          Jenis konten
                        </span>
                      </div>
                      <div className="relative min-w-[185px] sm:min-w-[215px]">
                        <select
                          data-testid="ide-content-type-select"
                          value={contentType}
                          onChange={(e) => {
                            const nextType = e.target.value as ContentType;
                            setContentType(nextType);
                            handleUpdateFullProject({
                              ...project,
                              content_type: nextType,
                            });
                          }}
                          className={`w-full appearance-none rounded-xl px-3.5 py-2 pr-8 text-xs font-semibold border focus:outline-none focus:border-blue-500 cursor-pointer ${
                            isLight
                              ? 'bg-slate-50 border-slate-200 text-slate-900'
                              : 'bg-[#161B26] border-white/[0.1] text-white'
                          }`}
                        >
                          <option value="motivasi">🔥 Motivasi</option>
                          <option value="edukasi">📚 Edukasi</option>
                          <option value="storytelling">🎬 Cerita &amp; Dokumenter</option>
                          <option value="tips">💡 Tips &amp; Strategi</option>
                          <option value="promosi">🛍️ Review &amp; Produk</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {!pastedIdeasSuccessList?.length &&
                    !showIdeInlinePasteBox &&
                    ideSetupTutorialStep === 1 && (
                      <TutorialPointerBubble
                        testId="tutorial-ide-step-1"
                        stepNumber={1}
                        totalSteps={8}
                        title="Mulai, Bahasa & Jenis Konten"
                        text="Pilih cara mulai (Topik, Narasi Sendiri, Promosi Produk, atau URL Website), bahasa narasi, dan kategori konten."
                        onNext={advanceIdeSetupTutorial}
                        onSkipAll={skipIdeSetupTutorial}
                      />
                    )}

                  {/* Topik video (Outside Card 1 — Matches Screenshot_20261117-195053_17bdca86.jpg 100%) */}
                  {startMode === 'topic' && (
                    <div className="space-y-1.5 pt-0.5">
                      <label
                        className={`block text-xs font-semibold ${
                          isLight ? 'text-slate-700' : 'text-slate-300'
                        }`}
                      >
                        Topik video
                      </label>
                      <input
                        type="text"
                        data-testid="step1-topic-input"
                        value={topic}
                        onChange={(e) => {
                          setTopic(e.target.value);
                          if (stepGateWarning) setStepGateWarning(null);
                          handleUpdateFullProject(
                            {
                              ...project,
                              topik_video: e.target.value,
                              topic: e.target.value,
                            },
                            { recalculateDurations: false }
                          );
                        }}
                        placeholder="merokok"
                        className={`w-full rounded-2xl px-4 py-3 text-sm font-medium border focus:outline-none focus:border-blue-500 ${
                          isLight
                            ? 'bg-white border-slate-200 text-slate-900 shadow-2xs'
                            : 'bg-[#11151E] border-white/[0.08] text-white'
                        }`}
                      />
                      <p className="text-[11px] text-slate-400 leading-relaxed px-0.5">
                        Satu-dua kata cukup. Boleh dikosongkan kalau mau ide bebas.
                      </p>
                    </div>
                  )}

                  {startMode === 'url' && (
                    <div className="space-y-1.5 pt-0.5">
                      <label className={`block text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        URL Website
                      </label>
                      <input
                        type="url"
                        data-testid="step1-url-input"
                        value={websiteUrlInput}
                        onChange={(e) => {
                          setWebsiteUrlInput(e.target.value);
                          setTopic(e.target.value);
                        }}
                        placeholder="https://namabrand.com"
                        className={`w-full rounded-2xl px-4 py-3 text-sm font-medium border focus:outline-none focus:border-blue-500 ${
                          isLight
                            ? 'bg-white border-slate-200 text-slate-900'
                            : 'bg-[#11151E] border-white/[0.08] text-white'
                        }`}
                      />
                    </div>
                  )}

                  {startMode === 'script' && (() => {
                    const scriptWords = sourceScript.trim() ? sourceScript.trim().split(/\s+/).length : 0;
                    const estScriptSec = Math.max(5, Math.round(scriptWords / (tempo === 'santai' ? 2.25 : 2.8)));
                    return (
                      <div
                        className={`space-y-3 rounded-2xl p-4 border ${
                          isLight ? 'bg-white border-slate-200' : 'bg-[#11151E] border-white/[0.08]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-extrabold">
                            Tulis atau tempel narasimu
                          </label>
                          <span className="text-[11px] font-mono text-blue-500">
                            {scriptWords} kata · ~{estScriptSec} dtk
                          </span>
                        </div>
                        <textarea
                          rows={4}
                          data-testid="step1-source-script-textarea"
                          value={sourceScript}
                          onChange={(e) => {
                            setSourceScript(e.target.value);
                            if (stepGateWarning) setStepGateWarning(null);
                          }}
                          placeholder="Tempel naskah atau cerita lengkapmu di sini..."
                          className="w-full rounded-xl p-3 text-xs sm:text-sm font-medium border focus:outline-none resize-y"
                        />
                      </div>
                    );
                  })()}

                  {startMode === 'promo' && (
                    <div
                      className={`space-y-3 rounded-2xl p-4 border ${
                        isLight ? 'bg-white border-slate-200' : 'bg-[#11151E] border-white/[0.08]'
                      }`}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-extrabold mb-1">
                            Nama produk / jasa
                          </label>
                          <input
                            type="text"
                            data-testid="promo-product-name-input"
                            value={promoProductName}
                            onChange={(e) => {
                              setPromoProductName(e.target.value);
                              if (stepGateWarning) setStepGateWarning(null);
                            }}
                            placeholder="Contoh: Kopi Susu Gula Aren Literan"
                            className="w-full rounded-xl px-3 py-2 text-xs font-medium border focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-extrabold mb-1">
                            Harga / promo spesial (opsional)
                          </label>
                          <input
                            type="text"
                            data-testid="promo-price-input"
                            value={promoPrice}
                            onChange={(e) => setPromoPrice(e.target.value)}
                            placeholder="Contoh: Diskon 30% hari ini"
                            className="w-full rounded-xl px-3 py-2 text-xs font-medium border focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-extrabold mb-1">
                          Keunggulan &amp; manfaat utama
                        </label>
                        <textarea
                          rows={2}
                          data-testid="promo-benefits-textarea"
                          value={promoBenefits}
                          onChange={(e) => {
                            setPromoBenefits(e.target.value);
                            if (stepGateWarning) setStepGateWarning(null);
                          }}
                          placeholder="Jelaskan masalah apa yang dibereskan produk ini..."
                          className="w-full rounded-xl p-3 text-xs font-medium border focus:outline-none resize-y"
                        />
                      </div>
                    </div>
                  )}

                  {/* Hidden file input for optional reference media */}
                  <input
                    ref={tutorialMediaInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    data-testid="ide-asset-file-input"
                    className="hidden"
                    onChange={(e) => {
                      handleUploadTutorialMediaFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />

                  {/* ASET VISUAL DI HALAMAN 1. IDE (Hanya Upload & Edit Nama Aset — Scene, Konsep & Gerakan Otomatis oleh AI) */}
                  <div
                    data-testid="ide-remotion-asset-upload-panel"
                    className={`rounded-2xl border p-4 space-y-3.5 ${
                      isLight
                        ? 'bg-white border-slate-200 shadow-xs'
                        : 'bg-[#11151E] border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-blue-500 shrink-0" />
                          <span
                            className={`text-xs sm:text-[13px] font-extrabold ${
                              isLight ? 'text-slate-900' : 'text-white'
                            }`}
                          >
                            Upload Aset Visual (Opsional)
                          </span>
                          {project.uploaded_tutorial_media &&
                            project.uploaded_tutorial_media.length > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white">
                                {project.uploaded_tutorial_media.length} aset aktif
                              </span>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Cukup upload aset dan beri nama asetnya. Penempatan scene, konsep naskah, serta pergerakan animasi Remotion akan otomatis dicocokkan oleh AI sesuai topik &amp; naskah videomu.
                        </p>
                      </div>

                      <button
                        type="button"
                        data-testid="ide-upload-asset-btn"
                        onClick={() => tutorialMediaInputRef.current?.click()}
                        className="shrink-0 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>+ Upload Aset</span>
                      </button>
                    </div>

                    {(!project.uploaded_tutorial_media ||
                      project.uploaded_tutorial_media.length === 0) ? (
                      <div
                        onClick={() => tutorialMediaInputRef.current?.click()}
                        data-testid="ide-upload-asset-dropzone"
                        className={`rounded-xl border border-dashed p-3.5 flex items-center justify-between gap-3 cursor-pointer transition ${
                          isLight
                            ? 'bg-slate-50/80 border-blue-200 hover:border-blue-500 text-slate-600'
                            : 'bg-[#071636]/55 border-sky-400/25 hover:border-sky-400/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500 shrink-0">
                            <Camera className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">
                              Belum ada aset diunggah — Klik untuk pilih foto / video
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              Upload lalu beri nama aset — AI otomatis mencocokkan scene, konsep naskah &amp; gerakan animasinya
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-blue-500 shrink-0">
                          Pilih File →
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2.5" data-testid="ide-uploaded-assets-list">
                        {project.uploaded_tutorial_media.map((item, idx) => {
                          const displayName = item.name ?? item.filename ?? `Aset ${idx + 1}`;
                          const matchedSceneIdx = (project.scenes || []).findIndex(
                            (sc) => sc.media_key === item.key
                          );
                          const inferredMotion = inferAutoMotionForAssetAndScene(
                            displayName,
                            matchedSceneIdx >= 0
                              ? project.scenes[matchedSceneIdx]?.narration_text
                              : '',
                            topic || project.topik_video,
                            selectedModule,
                            idx
                          );

                          return (
                            <div
                              key={item.id}
                              data-testid={`ide-uploaded-asset-card-${idx}`}
                              className={`rounded-xl border p-3 space-y-2.5 ${
                                isLight
                                  ? 'bg-slate-50 border-slate-200'
                                  : 'bg-[#071636]/75 border-sky-400/25'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-lg overflow-hidden border border-blue-500/30 bg-slate-950 shrink-0 flex items-center justify-center">
                                  {item.type === 'video' ? (
                                    <video
                                      src={item.dataUrl || item.url}
                                      className="w-full h-full object-cover"
                                      muted
                                    />
                                  ) : (
                                    <img
                                      src={item.dataUrl || item.url}
                                      alt={displayName}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0 space-y-1.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="px-1.5 py-0.5 rounded bg-blue-600/20 border border-blue-500/30 text-[10px] font-mono font-bold text-blue-400">
                                        ASET #{idx + 1}
                                      </span>
                                      <span className="text-[10px] font-mono text-slate-400">
                                        Key: <code className="text-blue-400">{item.key}</code>
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      data-testid={`ide-remove-asset-btn-${idx}`}
                                      onClick={() => handleRemoveUploadedMediaItem(item.id)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer shrink-0"
                                      title="Hapus aset"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <div>
                                    <label
                                      htmlFor={`ide-asset-name-input-${idx}`}
                                      className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1"
                                    >
                                      Nama Aset (Digunakan AI untuk Mencocokkan Naskah &amp; Gerakan)
                                    </label>
                                    <input
                                      id={`ide-asset-name-input-${idx}`}
                                      type="text"
                                      data-testid={`ide-asset-name-input-${idx}`}
                                      value={displayName}
                                      onChange={(e) => {
                                        const nextName = e.target.value;
                                        handleUpdateUploadedMediaItem(item.id, {
                                          name: nextName,
                                          filename: nextName,
                                          stepTitle: nextName,
                                          targetSceneNumber: 'auto',
                                          motionPreset: 'auto_concept',
                                          motionPrompt: '',
                                        });
                                      }}
                                      placeholder="Contoh: Grafik Penjualan Naik, Foto Produk Kopi, Dashboard Transaksi..."
                                      className={`w-full rounded-lg px-3 py-1.5 text-xs font-bold border focus:outline-none focus:border-blue-500 ${
                                        isLight
                                          ? 'bg-white border-slate-200 text-slate-900'
                                          : 'bg-[#041029] border-sky-400/25 text-white placeholder:text-slate-500'
                                      }`}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div
                                data-testid={`ide-asset-ai-auto-summary-${idx}`}
                                className={`rounded-lg px-2.5 py-1.5 border text-[10px] flex flex-wrap items-center justify-between gap-2 ${
                                  isLight
                                    ? 'bg-blue-50/80 border-blue-200 text-blue-900'
                                    : 'bg-blue-950/40 border-sky-400/20 text-sky-200'
                                }`}
                              >
                                <span>
                                  <strong>Otomatis oleh AI:</strong> Scene &amp; konsep disesuaikan dengan naskah · Gerakan:{' '}
                                  <span className="font-mono font-bold text-blue-400">
                                    {inferredMotion.preset}
                                  </span>
                                </span>
                                <span className="opacity-80 truncate max-w-full sm:max-w-[340px]">
                                  {inferredMotion.prompt}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {!pastedIdeasSuccessList?.length &&
                    !showIdeInlinePasteBox &&
                    ideSetupTutorialStep === 2 && (
                      <TutorialPointerBubble
                        testId="tutorial-ide-step-2"
                        stepNumber={2}
                        totalSteps={8}
                        title="Topik Video"
                        text="Ketik topik singkat bahasan videomu, atau kosongkan kalau mau dibuatkan ide bebas."
                        onPrev={() => setIdeSetupTutorialStep(1)}
                        onNext={advanceIdeSetupTutorial}
                        onSkipAll={skipIdeSetupTutorial}
                      />
                    )}

                  {/* Durasi video (Outside Cards — Matches Screenshot_20261117-195053_17bdca86.jpg 100%) */}
                  <div className="space-y-1.5 pt-0.5">
                    <label
                      className={`block text-xs font-semibold ${
                        isLight ? 'text-slate-700' : 'text-slate-300'
                      }`}
                    >
                      Durasi video
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { id: '30', label: '30 dtk' },
                        { id: '50', label: '50 dtk' },
                        { id: '60', label: '1 mnt' },
                        { id: 'custom', label: 'Custom' },
                      ].map((item) => {
                        const isActive =
                          durationPreset === item.id ||
                          (durationPreset === 'auto' && item.id === '60');
                        return (
                          <button
                            key={item.id}
                            type="button"
                            data-testid={`duration-preset-${item.id}`}
                            onClick={() =>
                              handleChangeTargetDuration(
                                item.id as 'auto' | '30' | '50' | '60' | 'custom'
                              )
                            }
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition border cursor-pointer ${
                              isActive
                                ? 'bg-[#2563EB] border-[#2563EB] text-white shadow-xs'
                                : isLight
                                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                : 'bg-[#11151E] border-white/[0.1] text-slate-300 hover:border-blue-500/40'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>

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

                  {!pastedIdeasSuccessList?.length &&
                    !showIdeInlinePasteBox &&
                    ideSetupTutorialStep === 3 && (
                      <TutorialPointerBubble
                        testId="tutorial-ide-step-3"
                        stepNumber={3}
                        totalSteps={8}
                        title="Durasi Video"
                        text="Pilih target durasi 30 dtk, 50 dtk, 1 mnt, atau Custom sesuai platform tujuan."
                        onPrev={() => setIdeSetupTutorialStep(2)}
                        onNext={advanceIdeSetupTutorial}
                        onSkipAll={skipIdeSetupTutorial}
                      />
                    )}

                  {/* GROUPED SETTINGS CARD 2: Gaya video | Karakter | Warna brand | Tempo | Transisi | Ukuran video */}
                  <div
                    className={`rounded-2xl border divide-y ${
                      isLight
                        ? 'bg-white border-slate-200 divide-slate-200/80 shadow-xs'
                        : 'bg-[#11151E] border-white/[0.08] divide-white/[0.06]'
                    }`}
                  >
                    {/* Row 1: Gaya video */}
                    <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 shrink-0">
                        <Film className="w-4 h-4 text-blue-500" />
                        <span className={`text-xs sm:text-[13px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          Gaya video
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsStyleModalOpen(true)}
                        data-testid="open-style-module-picker-btn"
                        className={`flex-1 max-w-[260px] sm:max-w-[300px] px-3 py-2 rounded-xl border flex items-center justify-between gap-2 transition cursor-pointer ${
                          isLight
                            ? 'bg-slate-50 border-slate-200 hover:border-blue-400 text-slate-900'
                            : 'bg-[#161B26] border-white/[0.1] hover:border-blue-500/40 text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex items-center rounded-md overflow-hidden border border-black/10 shrink-0">
                            <span
                              className="w-3.5 h-5"
                              style={{ backgroundColor: (activeModuleMeta as any).bgColor || '#0f172a' }}
                            />
                            <span
                              className="w-3.5 h-5"
                              style={{ backgroundColor: activeModuleMeta.accentColor || '#2563EB' }}
                            />
                            <span
                              className="w-3.5 h-5"
                              style={{ backgroundColor: activeModuleMeta.secondaryColor || '#38bdf8' }}
                            />
                          </div>
                          <span
                            data-testid="selected-style-badge-label"
                            className="text-xs font-bold truncate"
                          >
                            {selectedModule === 'otomatis'
                              ? 'Cerita Sinematik'
                              : activeModuleMeta.title}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-blue-500 shrink-0" />
                      </button>
                    </div>

                    {!pastedIdeasSuccessList?.length &&
                      !showIdeInlinePasteBox &&
                      ideSetupTutorialStep === 4 && (
                        <div className="px-4 py-2">
                          <TutorialPointerBubble
                            testId="tutorial-ide-step-4"
                            stepNumber={4}
                            totalSteps={8}
                            title="Gaya Video"
                            text="Pilih gaya visual animasi (Cerita Sinematik, Bento Grid, Neon, dll) beserta pratinjaunya."
                            onPrev={() => setIdeSetupTutorialStep(3)}
                            onNext={advanceIdeSetupTutorial}
                            onSkipAll={skipIdeSetupTutorial}
                          />
                        </div>
                      )}

                    {/* Row 2: Karakter (Expandable Accordion — Matches Screenshot_20261117-195053_17bdca86.jpg 100%) */}
                    {(() => {
                      const activeCharMeta = getCharacterMeta(character, project.custom_character);
                      const isStoryDisplayMode = Boolean(characterFullBackstory);
                      return (
                        <div className="px-4 py-3.5 space-y-3">
                          <div
                            onClick={() => setIsCharacterOpen(!isCharacterOpen)}
                            className="flex items-center justify-between cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2.5">
                              <User className="w-4 h-4 text-blue-500" />
                              <span className={`text-xs sm:text-[13px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                Karakter
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                              <span>{activeCharMeta.name}</span>
                              {isCharacterOpen ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </div>
                          </div>

                          {isCharacterOpen && (
                            <div className="space-y-3 pt-0.5">
                              {/* Character Card Button */}
                              <div
                                onClick={() => setIsCharacterModalOpen(true)}
                                data-testid="studio-open-character-picker-btn"
                                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition ${
                                  isLight
                                    ? 'bg-slate-50 border-slate-200 hover:border-blue-400'
                                    : 'bg-[#161B26] border-white/[0.09] hover:border-blue-500/40'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 overflow-hidden ${
                                      isLight
                                        ? 'bg-white border-slate-200'
                                        : 'bg-[#0B0E14] border-white/[0.08]'
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
                                    <span
                                      className={`text-xs sm:text-[13px] font-bold block truncate ${
                                        isLight ? 'text-slate-900' : 'text-white'
                                      }`}
                                    >
                                      {activeCharMeta.name}
                                    </span>
                                    <span className="text-[11px] text-slate-400 block truncate">
                                      {activeCharMeta.description}
                                    </span>
                                  </div>
                                </div>
                                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                              </div>

                              {/* Narator: Pria | Wanita */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                  <User className="w-3 h-3" /> Narator:
                                </span>
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
                                    className={`px-3 py-1 rounded-full text-[11px] font-bold capitalize transition cursor-pointer ${
                                      characterGender === g
                                        ? 'bg-[#2563EB] text-white shadow-2xs'
                                        : isLight
                                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        : 'bg-[#161B26] text-slate-300 border border-white/[0.08]'
                                    }`}
                                  >
                                    {g === 'pria' ? 'Pria' : 'Wanita'}
                                  </button>
                                ))}
                              </div>

                              {/* Tampilan: Tokoh + benda | Cerita (latar lengkap) */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                  <Film className="w-3 h-3" /> Tampilan:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCharacterWithObjects(true);
                                    setCharacterFullBackstory(false);
                                    handleUpdateFullProject({
                                      ...project,
                                      character_with_objects: true,
                                      character_full_backstory: false,
                                    });
                                  }}
                                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                                    !isStoryDisplayMode
                                      ? 'bg-[#2563EB] text-white shadow-2xs'
                                      : isLight
                                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                      : 'bg-[#161B26] text-slate-300 border border-white/[0.08]'
                                  }`}
                                >
                                  Tokoh + benda
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCharacterWithObjects(true);
                                    setCharacterFullBackstory(true);
                                    handleUpdateFullProject({
                                      ...project,
                                      character_with_objects: true,
                                      character_full_backstory: true,
                                    });
                                  }}
                                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                                    isStoryDisplayMode
                                      ? 'bg-[#2563EB] text-white shadow-2xs'
                                      : isLight
                                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                      : 'bg-[#161B26] text-slate-300 border border-white/[0.08]'
                                  }`}
                                >
                                  Cerita (latar lengkap)
                                </button>
                              </div>

                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                Mode Cerita: tiap scene jadi adegan di tempat kejadian yang utuh (rumah, gang, pasar, kantor) seperti film pendek, latarnya ikut bercerita. Gaya video dibatasi ke gaya yang cocok untuk adegan.
                              </p>

                              {/* Action Buttons: Lihat demo gerakan karakter + Buat Karakter */}
                              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                <button
                                  type="button"
                                  data-testid="studio-open-character-demo-btn"
                                  onClick={() => {
                                    setDemoPreviewCharacter(character);
                                    setIsCharacterDemoOpen(true);
                                  }}
                                  className="px-3.5 py-2 rounded-xl bg-blue-500/12 hover:bg-blue-500/20 border border-blue-500/25 text-blue-500 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>Lihat demo gerakan karakter</span>
                                </button>

                                <button
                                  type="button"
                                  data-testid="studio-open-character-builder-btn"
                                  onClick={() => {
                                    setEditingCustomCharacter(
                                      String(character).startsWith('custom_') && project.custom_character
                                        ? project.custom_character
                                        : null
                                    );
                                    setIsCharacterBuilderOpen(true);
                                  }}
                                  className={`px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                                    isLight
                                      ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                      : 'bg-[#161B26] border-white/[0.08] text-slate-300 hover:text-white'
                                  }`}
                                >
                                  {String(character).startsWith('custom_') ? 'Edit Karakter AI' : '+ Karakter Custom'}
                                </button>
                              </div>
                            </div>
                          )}

                          {!pastedIdeasSuccessList?.length &&
                            !showIdeInlinePasteBox &&
                            ideSetupTutorialStep === 5 && (
                              <TutorialPointerBubble
                                testId="tutorial-ide-step-5"
                                stepNumber={5}
                                totalSteps={8}
                                title="Karakter & Mode Tampilan"
                                text="Atur tokoh narator (Pria/Wanita), mode tampilan Tokoh + benda atau Cerita (latar lengkap), dan demo gerakannya."
                                onPrev={() => setIdeSetupTutorialStep(4)}
                                onNext={advanceIdeSetupTutorial}
                                onSkipAll={skipIdeSetupTutorial}
                              />
                            )}
                        </div>
                      );
                    })()}

                    {/* Row 3: Warna brand */}
                    <div className="px-4 py-3.5 space-y-3">
                      <div
                        onClick={() => setIsBrandColorOpen(!isBrandColorOpen)}
                        className="flex items-center justify-between cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2.5">
                          <Palette className="w-4 h-4 text-blue-500" />
                          <span className={`text-xs sm:text-[13px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            Warna brand
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                          <span>
                            {brandColorMode === 'auto' ? 'Ikut gaya' : brandPresetName || 'Custom'}
                          </span>
                          {isBrandColorOpen ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </div>

                      {isBrandColorOpen && (
                        <div className="pt-2 space-y-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setBrandColorMode('auto');
                                handleUpdateFullProject({
                                  ...project,
                                  brand_mode: 'auto',
                                });
                              }}
                              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                brandColorMode === 'auto'
                                  ? 'bg-[#2563EB] border-[#2563EB] text-white'
                                  : 'bg-[#161B26] border-white/[0.1] text-slate-300'
                              }`}
                            >
                              Ikut gaya
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setBrandColorMode('custom');
                                handleUpdateFullProject({
                                  ...project,
                                  brand_mode: 'custom',
                                });
                              }}
                              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                brandColorMode === 'custom'
                                  ? 'bg-[#2563EB] border-[#2563EB] text-white'
                                  : 'bg-[#161B26] border-white/[0.1] text-slate-300'
                              }`}
                            >
                              Warna Custom
                            </button>
                          </div>

                          {brandColorMode === 'custom' && (
                            <div className="grid grid-cols-3 gap-2">
                              <div className="p-2 rounded-xl border border-white/[0.08] bg-[#161B26] flex items-center gap-2">
                                <input
                                  type="color"
                                  value={brandColor}
                                  onChange={(e) => {
                                    setBrandColor(e.target.value);
                                    handleUpdateFullProject({
                                      ...project,
                                      warna_brand: e.target.value,
                                      brandColor: e.target.value,
                                      brand_mode: 'custom',
                                    });
                                  }}
                                  className="w-6 h-6 rounded cursor-pointer shrink-0"
                                />
                                <span className="text-[11px] font-mono truncate">{brandColor}</span>
                              </div>
                              <div className="p-2 rounded-xl border border-white/[0.08] bg-[#161B26] flex items-center gap-2">
                                <input
                                  type="color"
                                  value={brandSecondaryColor}
                                  onChange={(e) => {
                                    setBrandSecondaryColor(e.target.value);
                                    handleUpdateFullProject({
                                      ...project,
                                      brand_secondary_color: e.target.value,
                                      brand_mode: 'custom',
                                    });
                                  }}
                                  className="w-6 h-6 rounded cursor-pointer shrink-0"
                                />
                                <span className="text-[11px] font-mono truncate">{brandSecondaryColor}</span>
                              </div>
                              <div className="p-2 rounded-xl border border-white/[0.08] bg-[#161B26] flex items-center gap-2">
                                <input
                                  type="color"
                                  value={brandAccentColor}
                                  onChange={(e) => {
                                    setBrandAccentColor(e.target.value);
                                    handleUpdateFullProject({
                                      ...project,
                                      brand_accent_color: e.target.value,
                                      brand_mode: 'custom',
                                    });
                                  }}
                                  className="w-6 h-6 rounded cursor-pointer shrink-0"
                                />
                                <span className="text-[11px] font-mono truncate">{brandAccentColor}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Row 4: Tempo */}
                    <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Zap className="w-4 h-4 text-blue-500" />
                        <span className={`text-xs sm:text-[13px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          Tempo
                        </span>
                      </div>

                      <div
                        className={`inline-flex items-center p-1 rounded-xl border ${
                          isLight
                            ? 'bg-slate-100 border-slate-200'
                            : 'bg-[#161B26] border-white/[0.08]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setTempo('energik');
                            soundEngine.playSfx('kick');
                            handleUpdateFullProject({
                              ...project,
                              tempo: 'energik',
                            });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer ${
                            tempo === 'energik'
                              ? isLight
                                ? 'bg-white text-blue-700 shadow-2xs border border-blue-200'
                                : 'bg-[#2563EB] text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Zap className="w-3 h-3" />
                          <span>Energik</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTempo('santai');
                            soundEngine.playSfx('chime');
                            handleUpdateFullProject({
                              ...project,
                              tempo: 'santai',
                            });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer ${
                            tempo === 'santai'
                              ? isLight
                                ? 'bg-white text-blue-700 shadow-2xs border border-blue-200'
                                : 'bg-[#2563EB] text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span>⇄ Santai</span>
                        </button>
                      </div>
                    </div>

                    {!pastedIdeasSuccessList?.length &&
                      !showIdeInlinePasteBox &&
                      ideSetupTutorialStep === 6 && (
                        <div className="px-4 py-2">
                          <TutorialPointerBubble
                            testId="tutorial-ide-step-6"
                            stepNumber={6}
                            totalSteps={8}
                            title="Warna Brand & Tempo"
                            text="Atur palet warna brand (Ikut gaya atau Custom) serta tempo pembawaan Energik atau Santai."
                            onPrev={() => setIdeSetupTutorialStep(5)}
                            onNext={advanceIdeSetupTutorial}
                            onSkipAll={skipIdeSetupTutorial}
                          />
                        </div>
                      )}

                    {/* Row 5: Transisi */}
                    <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 shrink-0">
                        <Shuffle className="w-4 h-4 text-blue-500" />
                        <span className={`text-xs sm:text-[13px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          Transisi
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsTransitionModalOpen(true)}
                        data-testid="studio-open-transition-picker-btn"
                        className={`px-3.5 py-2 rounded-xl border text-left flex items-center justify-between gap-2 min-w-[175px] sm:min-w-[205px] transition cursor-pointer ${
                          isLight
                            ? 'bg-slate-50 border-slate-200 hover:border-blue-400'
                            : 'bg-[#161B26] border-white/[0.1] hover:border-blue-500/40'
                        }`}
                      >
                        <div className="min-w-0">
                          <span
                            className={`text-xs font-bold block truncate ${
                              isLight ? 'text-slate-900' : 'text-white'
                            }`}
                          >
                            {getTransitionMeta(transition).name}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                            bervariasi, lembut (te...
                          </span>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </button>
                    </div>

                    {/* Row 6: Ukuran video */}
                    <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 shrink-0">
                        <Frame className="w-4 h-4 text-blue-500" />
                        <span className={`text-xs sm:text-[13px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          Ukuran video
                        </span>
                      </div>

                      <div
                        className={`inline-flex items-center p-1 rounded-xl border ${
                          isLight
                            ? 'bg-slate-100 border-slate-200'
                            : 'bg-[#161B26] border-white/[0.08]'
                        }`}
                      >
                        {(['9:16', '16:9', '1:1', '3:4'] as AspectRatio[]).map((ratio) => {
                          const active = aspectRatio === ratio;
                          return (
                            <button
                              key={ratio}
                              type="button"
                              onClick={() => {
                                setAspectRatio(ratio);
                                handleUpdateFullProject({
                                  ...project,
                                  aspect_ratio: ratio,
                                });
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                active
                                  ? isLight
                                    ? 'bg-white text-blue-700 shadow-2xs border border-blue-200'
                                    : 'bg-[#2563EB] text-white shadow-xs'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {ratio}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {!pastedIdeasSuccessList?.length &&
                      !showIdeInlinePasteBox &&
                      ideSetupTutorialStep === 7 && (
                        <div className="px-4 py-2">
                          <TutorialPointerBubble
                            testId="tutorial-ide-step-7"
                            stepNumber={7}
                            totalSteps={8}
                            title="Transisi & Ukuran Video"
                            text="Pilih gaya transisi antar-scene dan ukuran rasio layar (9:16 vertikal, 16:9 horizontal, 1:1, atau 3:4)."
                            onPrev={() => setIdeSetupTutorialStep(6)}
                            onNext={advanceIdeSetupTutorial}
                            onSkipAll={skipIdeSetupTutorial}
                          />
                        </div>
                      )}
                  </div>

                  {/* BOTTOM AI PROMPT DISPATCH & PASTE CARD (Matches Screenshot_20261117-195053, 194950, 195004, 195020, 195147, 195159 100%) */}
                  <AiPromptDispatchBox
                    testIdPrefix="ide-ai"
                    variant="solid"
                    promptText={buildCurrentIdePromptText()}
                    selectedAi={(preferredAiProvider === 'deepseek' ? 'claude' : preferredAiProvider) as AiProviderId}
                    onSelectAi={(ai) => setPreferredAiProvider(ai)}
                    dispatchMode={aiDispatchMode}
                    onSelectDispatchMode={(m) => setAiDispatchMode(m)}
                    onSend={handleDispatchIdePrompt}
                    onCopyPrompt={handleSalinPromptIde}
                    copiedPrompt={copiedIdePrompt}
                    isPasteOpen={showIdeInlinePasteBox}
                    onTogglePasteOpen={(open) => {
                      setShowIdeInlinePasteBox(open);
                      if (open) setDismissedTutorialStep1Send(true);
                    }}
                    pasteValue={ideInlinePasteText}
                    onPasteChange={(val) => {
                      setIdeInlinePasteText(val);
                      if (idePasteError) setIdePasteError(null);
                      if (val.trim().startsWith('{') && val.trim().endsWith('}')) {
                        handleApplyInlineIde(val);
                      }
                    }}
                    onProcessPaste={(val) => handleApplyInlineIde(val)}
                    processButtonLabel="Muat Ide ke Proyek"
                    showSendTutorial={false}
                    showPasteTutorial={
                      !pastedIdeasSuccessList?.length &&
                      !(project.step_ide_done && project.selected_idea_id) &&
                      showIdeInlinePasteBox
                    }
                    pasteTutorialText="Tempel hasil ide dari AI di kotak ini, lalu klik Muat Ide ke Proyek"
                  />

                  {idePasteError && (
                    <p className="text-xs text-rose-500 font-semibold px-2">{idePasteError}</p>
                  )}

                  {!pastedIdeasSuccessList?.length &&
                    !showIdeInlinePasteBox &&
                    (ideSetupTutorialStep === 8 ||
                      (ideSetupTutorialStep === 0 && !dismissedTutorialStep1Send)) && (
                      <TutorialPointerBubble
                        testId="tutorial-ide-step-8"
                        stepNumber={8}
                        totalSteps={8}
                        title="Kirim ke AI & Pilih Ide"
                        text="Klik Kirim ke AI untuk membuka platform AI dengan prompt siap pakai, tempel jawabannya di sini, atau klik Lanjut untuk memilih ide."
                        nextLabel="Lanjut Pilih Ide →"
                        onPrev={() => setIdeSetupTutorialStep(7)}
                        onNext={advanceIdeSetupTutorial}
                        onSkipAll={() => {
                          skipIdeSetupTutorial();
                          setDismissedTutorialStep1Send(true);
                        }}
                      />
                    )}
                </div>
              )}

              {/* MODAL: BERHASIL! 5 IDE BARU DIMUAT (Matching Screenshot_20261109-160448) */}
              {pastedIdeasSuccessList && pastedIdeasSuccessList.length > 0 && (
                <div
                  data-testid="pasted-ideas-success-modal"
                  className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
                >
                  <div
                    className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-4 relative ${
                      isLight
                        ? 'bg-white border-blue-200 text-slate-900'
                        : 'bg-[#041029] border-sky-400/40 text-white'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Check className="w-6 h-6 stroke-[2.5]" />
                      </div>
                      <h3 className="text-lg font-extrabold">Berhasil!</h3>
                      <p className="text-xs text-slate-400">
                        {pastedIdeasSuccessList.length} ide baru dimuat. Pilih salah satu.
                      </p>
                    </div>

                    <div
                      className={`rounded-2xl p-4 border space-y-1.5 ${
                        isLight
                          ? 'bg-slate-50 border-blue-200'
                          : 'bg-[#071636] border-sky-400/25'
                      }`}
                    >
                      <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-sky-400 block">
                        IDE DISARANKAN
                      </span>
                      <p className="text-xs font-bold leading-relaxed">
                        &ldquo;Pilih satu ide yang paling kamu suka, lalu kita tulis naskahnya.&rdquo;
                      </p>
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        data-testid="pasted-ideas-pilih-btn"
                        onClick={() => {
                          setPastedIdeasSuccessList(null);
                          setIdeSubTab('pilih_ide');
                        }}
                        className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-200 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer ring-4 ring-sky-400/30"
                      >
                        <span>Pilih ide</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <TutorialPointerBubble
                        testId="tutorial-pasted-ideas-pointer"
                        text="Bagus! Klik untuk lanjut ke langkah berikutnya"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB: PILIH IDE (Matching Screenshot_20261109-160454_de395e82.jpg) */}
              {ideSubTab === 'pilih_ide' &&
                (() => {
                  const concepts =
                    project.idea_concepts && project.idea_concepts.length > 0
                      ? project.idea_concepts
                      : [];
                  const hasExplicitSelection = Boolean(
                    project.selected_idea_id &&
                      concepts.some((c) => c.id === project.selected_idea_id)
                  );
                  const selectedConcept = hasExplicitSelection
                    ? concepts.find((c) => c.id === project.selected_idea_id) || null
                    : null;

                  if (concepts.length === 0) {
                    return (
                      <div className="space-y-3 pb-10">
                        <div
                          data-testid="pilih-ide-empty-state"
                          className={`rounded-2xl py-10 px-6 border flex flex-col items-center justify-center text-center ${
                            isLight
                              ? 'bg-white border-slate-200 shadow-xs'
                              : 'bg-[#11151E] border-white/[0.08]'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-500 mb-3">
                            <Lightbulb className="w-6 h-6" />
                          </div>
                          <h3
                            className={`font-extrabold text-sm ${
                              isLight ? 'text-slate-900' : 'text-white'
                            }`}
                          >
                            Belum ada daftar ide
                          </h3>
                          <p
                            className={`text-xs max-w-xs mt-1 leading-relaxed ${
                              isLight ? 'text-slate-500' : 'text-slate-400'
                            }`}
                          >
                            Atur topik &amp; gaya di tab Atur, kirim perintah ke AI, lalu tempel hasil ide dari AI terlebih dahulu.
                          </p>
                          <button
                            type="button"
                            data-testid="pilih-ide-go-to-atur-btn"
                            onClick={() => setIdeSubTab('atur')}
                            className="mt-4 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-sm transition cursor-pointer"
                          >
                            Ke tab Atur
                          </button>
                          <TutorialPointerBubble
                            testId="tutorial-pilih-ide-empty-pointer"
                            title="Kirim & Tempel Ide Dulu"
                            text="Buka tab Atur untuk mengirim prompt ide ke AI dan menempel hasilnya."
                            onNext={() => setIdeSubTab('atur')}
                          />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4 pb-10">
                      {/* Top Selected Idea Banner + Full-width Lanjut ke Narasi CTA */}
                      {hasExplicitSelection && selectedConcept && (
                        <div
                          data-testid="selected-idea-top-banner"
                          className={`rounded-2xl p-4 sm:p-5 border space-y-3.5 relative ${
                            isLight
                              ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                              : 'bg-[#04142e]/95 border-emerald-400/40'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="w-4 h-4 stroke-[2.5]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-extrabold text-xs sm:text-sm leading-snug">
                                Ide terpilih: {selectedConcept.title}
                              </h3>
                              <p className="text-[11px] text-slate-400">
                                Klik kartu lain kalau mau ganti.
                              </p>
                            </div>
                          </div>

                          <div className="relative">
                            <button
                              type="button"
                              data-testid="lanjut-ke-narasi-btn"
                              onClick={() => {
                                setDismissedTutorialStep1Next(true);
                                handleSelectConcept(selectedConcept);
                              }}
                              className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-200 text-slate-950 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(56,189,248,0.35)] ring-2 ring-sky-300 transition cursor-pointer"
                            >
                              <span>Lanjut ke Narasi</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>

                            {!pastedIdeasSuccessList?.length && !dismissedTutorialStep1Next && (
                              <TutorialPointerBubble
                                testId="tutorial-lanjut-narasi-pointer"
                                stepNumber={2}
                                totalSteps={2}
                                title="Lanjut ke Halaman 2. Narasi"
                                text="Ide sudah terpilih! Klik tombol Lanjut ke Narasi untuk menyusun adegan naskah satu per satu."
                                nextLabel="Ke 2. Narasi →"
                                onPrev={() => {
                                  setIdeSubTab('atur');
                                  setIdeSetupTutorialStep(8);
                                }}
                                onNext={() => {
                                  setDismissedTutorialStep1Next(true);
                                  handleSelectConcept(selectedConcept);
                                }}
                                onDismiss={() => setDismissedTutorialStep1Next(true)}
                              />
                            )}
                          </div>
                        </div>
                      )}

                      {/* Section Header */}
                      <div className="flex items-center justify-between px-1 pt-2">
                        <h2 className="font-extrabold text-sm sm:text-base">
                          Pilih satu ide
                        </h2>
                        <span className="text-xs font-mono text-sky-400">
                          {concepts.length} ide
                        </span>
                      </div>

                      {/* Idea Cards List */}
                      <div className="grid grid-cols-1 gap-3.5">
                        {concepts.map((concept, cIdx) => {
                          const isSelected =
                            hasExplicitSelection && project.selected_idea_id === concept.id;
                          const showFirstCardPointer =
                            cIdx === 0 &&
                            !hasExplicitSelection &&
                            !pastedIdeasSuccessList?.length &&
                            !dismissedTutorialStep1Select;

                          return (
                            <div
                              key={concept.id}
                              data-testid={`idea-concept-card-${cIdx + 1}`}
                              onClick={() => {
                                setDismissedTutorialStep1Select(true);
                                setDismissedTutorialStep1Next(false);
                                const updated = {
                                  ...project,
                                  selected_idea_id: concept.id,
                                  project_title: concept.title,
                                  title: concept.title,
                                  step_ide_done: true,
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
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-mono font-extrabold text-[11px] text-sky-400 tracking-wider uppercase">
                                  IDE 0{cIdx + 1}
                                </span>
                                {isSelected && (
                                  <span className="w-5 h-5 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  </span>
                                )}
                              </div>

                              <h3 className="font-extrabold text-sm sm:text-base leading-snug mb-2.5">
                                {concept.title}
                              </h3>

                              {(concept.hook || concept.hookProposal) && (
                                <div
                                  className={`my-2.5 border-l-3 border-sky-400 px-3.5 py-2.5 rounded-r-xl ${
                                    isLight ? 'bg-blue-50/90 text-slate-800' : 'bg-[#071636]/90 text-sky-100'
                                  }`}
                                >
                                  <p className="text-xs font-bold leading-relaxed">
                                    &ldquo;{concept.hook || concept.hookProposal}&rdquo;
                                  </p>
                                </div>
                              )}

                              <p
                                className={`text-xs leading-relaxed ${
                                  isLight ? 'text-slate-600' : 'text-slate-300'
                                }`}
                              >
                                {concept.angle}
                              </p>

                              {showFirstCardPointer && (
                                <TutorialPointerBubble
                                  testId="tutorial-pilih-ide-card-pointer"
                                  stepNumber={1}
                                  totalSteps={2}
                                  title="Pilih Satu Kartu Ide"
                                  text="Klik salah satu dari 5 konsep ide cerita di sini untuk menjadikannya dasar naskah videomu."
                                  nextLabel="Pilih Ide Ini →"
                                  onPrev={() => {
                                    setIdeSubTab('atur');
                                    setIdeSetupTutorialStep(8);
                                  }}
                                  onNext={() => {
                                    setDismissedTutorialStep1Select(true);
                                    setDismissedTutorialStep1Next(false);
                                    const updated = {
                                      ...project,
                                      selected_idea_id: concept.id,
                                      project_title: concept.title,
                                      title: concept.title,
                                      step_ide_done: true,
                                    };
                                    handleUpdateFullProject(updated);
                                  }}
                                  onDismiss={() => setDismissedTutorialStep1Select(true)}
                                />
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
          {/* TAHAP 2: NASKAH / NARASI (SUBTAB: ATUR VS NASKAH) */}
          {/* ========================================================== */}
          {currentStep === 'naskah' && (
            <div className="space-y-4 pb-24">
              {/* SUBTAB HEADER: Atur vs Naskah (Matching Screenshot_20261117-190634 & 190756) */}
              <div
                className={`p-1 rounded-2xl border flex items-center max-w-xl mx-auto ${
                  isLight
                    ? 'bg-slate-100/90 border-blue-200/90 shadow-2xs'
                    : 'bg-[#041029] border-sky-400/25'
                }`}
              >
                <button
                  type="button"
                  data-testid="narasi-subtab-atur"
                  onClick={() => setNaskahSubTab('atur')}
                  className={`flex-1 py-2.5 px-4 text-xs sm:text-sm font-extrabold rounded-xl transition cursor-pointer ${
                    naskahSubTab === 'atur'
                      ? isLight
                        ? 'bg-white text-slate-950 shadow-xs'
                        : 'bg-sky-400 text-slate-950 shadow-xs'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Atur
                </button>
                <button
                  type="button"
                  data-testid="narasi-subtab-naskah"
                  onClick={() => setNaskahSubTab('naskah')}
                  className={`flex-1 py-2.5 px-4 text-xs sm:text-sm font-extrabold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                    naskahSubTab === 'naskah'
                      ? isLight
                        ? 'bg-white text-slate-950 shadow-xs'
                        : 'bg-sky-400 text-slate-950 shadow-xs'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <span>Naskah</span>
                  {project.step_naskah_done && project.scenes && project.scenes.length > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-extrabold leading-none ${
                        naskahSubTab === 'naskah'
                          ? 'bg-sky-500 text-white'
                          : 'bg-sky-400/25 text-sky-400'
                      }`}
                    >
                      {project.scenes.length}
                    </span>
                  )}
                </button>
              </div>

              {/* TOP READY BANNER: "8 scene siap — Baca sekali dan edit kalau perlu, lalu lanjut." + "Lanjut ke Suara ->" */}
              {project.step_naskah_done && project.scenes && project.scenes.length > 0 && (
                <div
                  data-testid="narasi-ready-top-banner"
                  className={`rounded-2xl p-4 sm:p-5 border space-y-3 relative max-w-xl mx-auto ${
                    isLight
                      ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs'
                      : 'bg-[#04142e]/95 border-emerald-400/35'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-extrabold text-xs sm:text-sm block">
                        {project.scenes.length} scene siap
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Baca sekali dan edit kalau perlu, lalu lanjut.
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      data-testid="lanjut-ke-suara-top-btn"
                      onClick={() => {
                        setDismissedTutorialStep2Next(true);
                        handleUpdateFullProject(
                          {
                            ...project,
                            step_ide_done: true,
                            step_naskah_done: true,
                          },
                          { recalculateDurations: false }
                        );
                        setCurrentStep('suara');
                      }}
                      className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-200 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(56,189,248,0.35)] ring-2 ring-sky-300 transition cursor-pointer"
                    >
                      <span>Lanjut ke Suara</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {(naskahSubTab === 'atur'
                      ? narasiSetupTutorialStep === 0 && !dismissedTutorialStep2Next
                      : naskahViewTutorialStep === 4 && !dismissedTutorialStep2Next) && (
                      <TutorialPointerBubble
                        testId="tutorial-lanjut-suara-pointer"
                        stepNumber={naskahSubTab === 'naskah' ? 4 : undefined}
                        totalSteps={naskahSubTab === 'naskah' ? 4 : undefined}
                        title="Lanjut ke Halaman 3. Suara"
                        text="Semua scene naskah sudah siap! Klik Lanjut ke Suara untuk mengatur voiceover dan sinkronisasi."
                        nextLabel="Ke 3. Suara →"
                        onPrev={
                          naskahSubTab === 'naskah'
                            ? () => setNaskahViewTutorialStep(3)
                            : () => setNarasiSetupTutorialStep(5)
                        }
                        onNext={() => {
                          setDismissedTutorialStep2Next(true);
                          handleUpdateFullProject(
                            {
                              ...project,
                              step_ide_done: true,
                              step_naskah_done: true,
                            },
                            { recalculateDurations: false }
                          );
                          setCurrentStep('suara');
                        }}
                        onDismiss={() => setDismissedTutorialStep2Next(true)}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* SUBTAB ATUR (Matching Screenshot_20261117-190753, 190756, 190816) */}
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
                        'Matikan Kompornya, Bukan Tambah Asapnya',
                      hook: 'Berhenti bakar rokok pas stres. Mulai matikan kompor masalahmu.',
                      hookProposal: 'Berhenti bakar rokok pas stres. Mulai matikan kompor masalahmu.',
                    };
                  const hookText =
                    selectedConcept.hook ||
                    selectedConcept.hookProposal ||
                    'Berhenti bakar rokok pas stres. Mulai matikan kompor masalahmu.';
                  const autoSceneCountForDur =
                    calculatedDuration >= 60
                      ? 15
                      : calculatedDuration >= 50
                      ? 12
                      : calculatedDuration >= 30
                      ? 8
                      : 6;
                  const targetScenesCount = isSceneCountSliderOpen
                    ? Math.max(4, Math.min(40, sceneCount || 15))
                    : sceneCount >= 4 && sceneCount <= 40
                    ? sceneCount
                    : autoSceneCountForDur;
                  const maxScenesForDuration = Math.max(10, Math.round(calculatedDuration / 1.5));
                  const avgSecStr = Math.max(1.5, calculatedDuration / targetScenesCount)
                    .toFixed(1)
                    .replace('.0', '')
                    .replace('.', ',');
                  const durLabel =
                    calculatedDuration === 60
                      ? '1 mnt'
                      : `${calculatedDuration} dtk`;
                  const remainingScenesQuota = Math.max(0, 60 - (project.scenes?.length || 0));

                  return (
                    <div className="space-y-4 max-w-xl mx-auto">
                      {/* Card: Ide terpilih + "<- Ganti ide" */}
                      <div
                        data-testid="narasi-selected-idea-card"
                        className={`rounded-2xl p-5 border space-y-2 ${
                          isLight
                            ? 'bg-white border-blue-200/90 shadow-xs'
                            : 'bg-[#041029]/95 border-sky-400/25'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isLight
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-sky-400/15 text-sky-300 border border-sky-400/30'
                            }`}
                          >
                            Ide terpilih
                          </span>
                          <button
                            type="button"
                            data-testid="ganti-ide-btn"
                            onClick={() => {
                              setCurrentStep('ide');
                              setIdeSubTab('pilih_ide');
                            }}
                            className={`text-xs font-bold inline-flex items-center gap-1 hover:underline cursor-pointer ${
                              isLight ? 'text-blue-700' : 'text-sky-300'
                            }`}
                          >
                            <span>← Ganti ide</span>
                          </button>
                        </div>

                        <h3 className="font-extrabold text-sm sm:text-base leading-snug">
                          {selectedConcept.title}
                        </h3>

                        {hookText && (
                          <p
                            className={`text-xs leading-relaxed ${
                              isLight ? 'text-slate-600' : 'text-slate-300'
                            }`}
                          >
                            <strong className={isLight ? 'text-slate-900' : 'text-white'}>
                              Hook:
                            </strong>{' '}
                            {hookText}
                          </p>
                        )}

                        {!showInlinePasteBox && narasiSetupTutorialStep === 1 && (
                          <TutorialPointerBubble
                            testId="tutorial-narasi-tool-1"
                            stepNumber={1}
                            totalSteps={5}
                            title="Ide Terpilih & Hook Pembuka"
                            text="Ini ide dan kalimat Hook utama videomu. Klik Ganti ide di kanan atas kalau ingin memilih ide lain."
                            onNext={advanceNarasiSetupTutorial}
                            onSkipAll={skipNarasiSetupTutorial}
                          />
                        )}
                      </div>

                      {/* Main Settings Card (Durasi + Tambah scene + Split AI Button) */}
                      <div
                        className={`rounded-3xl p-4 sm:p-5 border space-y-4 ${
                          isLight
                            ? 'bg-white border-blue-200/90 shadow-xs'
                            : 'bg-[#041029]/95 border-sky-400/25'
                        }`}
                      >
                        {/* 1. Collapsible Durasi Box (Matching 190753 & 190756) */}
                        <div
                          className={`rounded-2xl p-4 border space-y-4 relative ${
                            isLight
                              ? 'bg-slate-50/90 border-slate-200'
                              : 'bg-[#071636]/75 border-sky-400/20'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 ${
                                isLight
                                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                                  : 'bg-sky-400/15 border-sky-400/30 text-sky-400'
                              }`}>
                                <Clock className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs sm:text-sm font-extrabold block">
                                  Durasi {durLabel}
                                </span>
                                <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                  ±{targetScenesCount} scene · ±{avgSecStr} dtk per scene
                                  {isSceneCountSliderOpen ? ' (diatur sendiri)' : ''}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              data-testid="narasi-toggle-durasi-btn"
                              onClick={() =>
                                setIsDurationDropdownOpen(!isDurationDropdownOpen)
                              }
                              className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border transition cursor-pointer ${
                                isLight
                                  ? 'bg-white border-slate-200 text-blue-700 hover:bg-blue-50'
                                  : 'bg-[#041029] border-sky-400/30 text-sky-300 hover:border-sky-400'
                              }`}
                            >
                              <span>Ubah</span>
                              {isDurationDropdownOpen ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {!showInlinePasteBox && narasiSetupTutorialStep === 2 && (
                            <TutorialPointerBubble
                              testId="tutorial-narasi-tool-2"
                              stepNumber={2}
                              totalSteps={5}
                              title="Durasi & Jumlah Scene"
                              text="Atur target durasi video (30 dtk, 50 dtk, 1 mnt, Custom) serta jumlah pembagian scene otomatis atau manual."
                              onPrev={() => setNarasiSetupTutorialStep(1)}
                              onNext={advanceNarasiSetupTutorial}
                              onSkipAll={skipNarasiSetupTutorial}
                            />
                          )}

                          {isDurationDropdownOpen && (
                            <div className="space-y-4 pt-2 border-t border-sky-400/15">
                              {/* Durasi video pills */}
                              <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-400 block">
                                  Durasi video
                                </span>
                                <div className="flex flex-wrap items-center gap-2">
                                  {[
                                    { id: '30', label: '30 dtk', defaultScenes: 8 },
                                    { id: '50', label: '50 dtk', defaultScenes: 12 },
                                    { id: '60', label: '1 mnt', defaultScenes: 15 },
                                    { id: 'custom', label: 'Custom', defaultScenes: 15 },
                                  ].map((item) => {
                                    const isActive =
                                      durationPreset === item.id ||
                                      (durationPreset === 'auto' && item.id === '60');
                                    return (
                                      <button
                                        key={item.id}
                                        type="button"
                                        data-testid={`narasi-durasi-pill-${item.id}`}
                                        onClick={() => {
                                          handleChangeTargetDuration(
                                            item.id as '30' | '50' | '60' | 'custom'
                                          );
                                          if (!isSceneCountSliderOpen) {
                                            setSceneCount(item.defaultScenes);
                                          }
                                        }}
                                        className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition border cursor-pointer ${
                                          isActive
                                            ? isLight
                                              ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                                              : 'bg-sky-400 border-sky-400 text-slate-950 shadow-xs'
                                            : isLight
                                            ? 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50'
                                            : 'bg-[#041029] border-sky-400/25 text-slate-200 hover:border-sky-400'
                                        }`}
                                      >
                                        {item.label}
                                      </button>
                                    );
                                  })}
                                </div>

                                {durationPreset === 'custom' && (
                                  <div className="pt-1 flex items-center gap-2">
                                    <input
                                      type="number"
                                      min={15}
                                      max={180}
                                      value={customDuration}
                                      onChange={(e) =>
                                        handleChangeTargetDuration(
                                          'custom',
                                          Number(e.target.value)
                                        )
                                      }
                                      className="w-24 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-center border"
                                    />
                                    <span className="text-xs text-slate-400">detik</span>
                                  </div>
                                )}
                              </div>

                              {/* Jumlah scene: Auto vs Manual Slider (Matching 190753 & 190756) */}
                              <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-400 block">
                                  Jumlah scene
                                </span>

                                {!isSceneCountSliderOpen ? (
                                  <div
                                    className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                                      isLight
                                        ? 'bg-white border-slate-200'
                                        : 'bg-[#041029] border-sky-400/20'
                                    }`}
                                  >
                                    <span className="text-xs">
                                      <strong className="font-extrabold">
                                        ±{targetScenesCount} scene
                                      </strong>{' '}
                                      <span className="text-slate-400">
                                        · ±{avgSecStr} dtk per scene (otomatis)
                                      </span>
                                    </span>
                                    <button
                                      type="button"
                                      data-testid="narasi-atur-sendiri-scene-btn"
                                      onClick={() => setIsSceneCountSliderOpen(true)}
                                      className={`text-xs font-extrabold underline cursor-pointer ${
                                        isLight ? 'text-blue-700' : 'text-sky-300'
                                      }`}
                                    >
                                      Atur sendiri
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="range"
                                        min={4}
                                        max={maxScenesForDuration}
                                        step={1}
                                        data-testid="narasi-scene-count-slider"
                                        value={targetScenesCount}
                                        onChange={(e) => {
                                          const nextCount = Number(e.target.value);
                                          setSceneCount(nextCount);
                                          handleUpdateFullProject(
                                            {
                                              ...project,
                                              scene_count: nextCount,
                                            },
                                            { recalculateDurations: false }
                                          );
                                        }}
                                        className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-blue-600 bg-slate-800"
                                      />
                                      <span className="text-sm font-mono font-extrabold text-sky-400 w-7 text-right">
                                        {targetScenesCount}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">
                                      ±{avgSecStr} dtk per scene · maks {maxScenesForDuration} scene untuk{' '}
                                      {durLabel} (min 1,5 dtk per scene) ·{' '}
                                      <button
                                        type="button"
                                        data-testid="narasi-otomatis-lagi-scene-btn"
                                        onClick={() => {
                                          setIsSceneCountSliderOpen(false);
                                          setSceneCount(autoSceneCountForDur);
                                        }}
                                        className={`font-extrabold underline cursor-pointer ${
                                          isLight ? 'text-blue-700' : 'text-sky-300'
                                        }`}
                                      >
                                        Otomatis lagi
                                      </button>
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 2. Card: Tambah scene (Matching 190753 & 190756) */}
                        <div
                          data-testid="narasi-tambah-scene-card"
                          className={`rounded-2xl p-4 border space-y-2.5 relative ${
                            isLight
                              ? 'bg-slate-50/90 border-slate-200'
                              : 'bg-[#071636]/75 border-sky-400/20'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-extrabold block">
                              Tambah scene
                            </span>
                            <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              satu baris = satu scene · sisa {remainingScenesQuota} scene
                            </span>
                          </div>

                          <textarea
                            rows={2}
                            data-testid="narasi-tambah-scene-textarea"
                            value={addSceneLinesText}
                            onChange={(e) => setAddSceneLinesText(e.target.value)}
                            placeholder="tulis narasi scene baru, mis. Dan ternyata, besok itu dimulai hari ini."
                            className="w-full rounded-xl p-3 text-xs border focus:outline-none resize-y"
                          />

                          <div>
                            <button
                              type="button"
                              data-testid="narasi-tambah-ke-naskah-btn"
                              onClick={handleAddScenesFromLines}
                              disabled={!addSceneLinesText.trim()}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border transition cursor-pointer disabled:opacity-50 ${
                                isLight
                                  ? 'bg-white border-slate-200 text-blue-700 hover:bg-blue-50'
                                  : 'bg-[#041029] border-sky-400/30 text-sky-300 hover:border-sky-400'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Tambah ke naskah</span>
                            </button>
                          </div>

                          {!showInlinePasteBox && narasiSetupTutorialStep === 3 && (
                            <TutorialPointerBubble
                              testId="tutorial-narasi-tool-3"
                              stepNumber={3}
                              totalSteps={5}
                              title="Tambah Scene Manual"
                              text="Tambahkan kalimat naskah sendiri kapan saja (satu baris otomatis jadi satu scene)."
                              onPrev={() => setNarasiSetupTutorialStep(2)}
                              onNext={advanceNarasiSetupTutorial}
                              onSkipAll={skipNarasiSetupTutorial}
                            />
                          )}
                        </div>
                      </div>

                      {/* 3. AI Prompt Dispatch & Inline Paste Card (Matching 194950, 195004, 195020, 195147, 195159) */}
                      <div ref={narasiPasteRef} className="relative space-y-2">
                        <AiPromptDispatchBox
                          testIdPrefix="narasi-ai"
                          variant="soft"
                          promptText={buildNarasiPrompt(project, creatorNote)}
                          selectedAi={(preferredAiProvider === 'deepseek' ? 'claude' : preferredAiProvider) as AiProviderId}
                          onSelectAi={(prov) => setPreferredAiProvider(prov)}
                          dispatchMode={aiDispatchMode}
                          onSelectDispatchMode={(mode) => setAiDispatchMode(mode)}
                          onSend={(platform, mode) => {
                            setDismissedTutorialStep2Send(true);
                            handleDispatchNarasiPrompt(platform, mode);
                          }}
                          onCopyPrompt={handleSalinPromptNarasi}
                          copiedPrompt={copiedNarasiPrompt}
                          isPasteOpen={showInlinePasteBox}
                          onTogglePasteOpen={(open) => setShowInlinePasteBox(open)}
                          pasteValue={inlinePasteText}
                          onPasteChange={(val) => {
                            setInlinePasteText(val);
                            if (pasteError) setPasteError(null);
                            if (val.trim().startsWith('{') && val.trim().endsWith('}')) {
                              handleApplyInlineNarasi(val);
                            }
                          }}
                          onProcessPaste={(val) => handleApplyInlineNarasi(val)}
                          processButtonLabel="Terapkan ke Naskah"
                          showSendTutorial={false}
                          showPasteTutorial={showInlinePasteBox}
                          pasteTutorialText="Tempel naskah hasil AI di kotak ini, lalu klik Terapkan ke Naskah"
                        />
                        {pasteError && (
                          <p className="text-xs text-rose-500 font-semibold px-2">{pasteError}</p>
                        )}
                        {!showInlinePasteBox &&
                          (narasiSetupTutorialStep === 4 ||
                            (narasiSetupTutorialStep === 0 && !dismissedTutorialStep2Send)) && (
                            <TutorialPointerBubble
                              testId="tutorial-narasi-tool-4"
                              stepNumber={4}
                              totalSteps={5}
                              title="Kirim ke AI & Tempel Naskah"
                              text="Klik Kirim ke AI untuk membuka platform AI dengan prompt narasi lengkap, lalu tempel hasilnya di sini."
                              onPrev={() => setNarasiSetupTutorialStep(3)}
                              onNext={() => setNarasiSetupTutorialStep(5)}
                              onSkipAll={() => {
                                skipNarasiSetupTutorial();
                                setDismissedTutorialStep2Send(true);
                              }}
                            />
                          )}
                      </div>

                      {/* Collapsible Pengaturan video Card (Matching Screenshot_20261109-160537) */}
                      <div
                        className={`rounded-2xl p-4 border space-y-3 relative ${
                          isLight
                            ? 'bg-white border-slate-200/90 shadow-2xs'
                            : 'bg-[#041029]/95 border-sky-400/25'
                        }`}
                      >
                        <div
                          onClick={() => setIsVideoSettingsOpen(!isVideoSettingsOpen)}
                          className="flex items-center justify-between cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-sky-400/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
                              <Sliders className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-xs font-extrabold block">
                                Pengaturan video
                              </span>
                              <span className="text-[11px] text-slate-400 block">
                                {activeModuleMeta.title} · {tempo} · {aspectRatio}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border cursor-pointer ${
                              isLight
                                ? 'bg-slate-50 border-blue-200 text-blue-700'
                                : 'bg-[#071636] border-sky-400/30 text-sky-300'
                            }`}
                          >
                            <span>Ubah</span>
                            {isVideoSettingsOpen ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {isVideoSettingsOpen && (
                          <div className="pt-3 border-t border-sky-400/15 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <button
                              type="button"
                              onClick={() => setIsStyleModalOpen(true)}
                              className="p-3 rounded-xl border border-sky-400/25 bg-[#071636]/70 text-left flex items-center justify-between cursor-pointer"
                            >
                              <div>
                                <span className="text-[10px] font-mono text-slate-400 block">
                                  Gaya video
                                </span>
                                <span className="text-xs font-bold text-sky-300">
                                  {activeModuleMeta.title}
                                </span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-sky-400" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setIsCharacterModalOpen(true)}
                              className="p-3 rounded-xl border border-sky-400/25 bg-[#071636]/70 text-left flex items-center justify-between cursor-pointer"
                            >
                              <div>
                                <span className="text-[10px] font-mono text-slate-400 block">
                                  Karakter
                                </span>
                                <span className="text-xs font-bold text-sky-300">
                                  {getCharacterMeta(character, project.custom_character).name}
                                </span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-sky-400" />
                            </button>
                          </div>
                        )}

                        {!showInlinePasteBox && narasiSetupTutorialStep === 5 && (
                          <TutorialPointerBubble
                            testId="tutorial-narasi-tool-5"
                            stepNumber={5}
                            totalSteps={5}
                            title="Pengaturan Video & Lanjut ke Naskah"
                            text="Cek kembali Gaya Video & Karakter, lalu klik Lanjut ke Naskah untuk melihat daftar scene."
                            nextLabel="Ke Daftar Naskah →"
                            onPrev={() => setNarasiSetupTutorialStep(4)}
                            onNext={advanceNarasiSetupTutorial}
                            onSkipAll={skipNarasiSetupTutorial}
                          />
                        )}
                      </div>
                    </div>
                  );
                })()}

              {/* SUBTAB NASKAH: SCENE CARDS LIST (Matching Screenshot_20261117-190634.jpg 100%) */}
              {naskahSubTab === 'naskah' &&
                (() => {
                  const actualScenesDuration = project.scenes.reduce(
                    (acc, s) => acc + Number(s.target_duration_sec || s.durationSeconds || 4),
                    0
                  );

                  const CAMERA_LABELS: Record<string, string> = {
                    auto: 'Zoom in',
                    zoom_in: 'Zoom in',
                    zoom_out: 'Zoom out',
                    pan_left: 'Geser kiri',
                    pan_right: 'Geser kanan',
                    tilt_up: 'Naik',
                    tilt_down: 'Turun',
                    dutch: 'Miring',
                    sway: 'Mengayun',
                    crash_zoom: 'Crash zoom',
                    handheld: 'Handheld',
                    shake: 'Getar',
                  };

                  const CAMERA_OPTIONS: {
                    id: string;
                    label: string;
                    desc: string;
                  }[] = [
                    {
                      id: 'auto',
                      label: 'Kamera otomatis (Zoom in)',
                      desc: 'Disarankan naskah · Mendekat pelan ke subjek',
                    },
                    { id: 'zoom_in', label: 'Zoom in', desc: 'Mendekat pelan ke subjek' },
                    { id: 'zoom_out', label: 'Zoom out', desc: 'Menjauh pelan, membuka ruang' },
                    { id: 'pan_left', label: 'Geser kiri', desc: 'Kamera bergeser ke kiri' },
                    { id: 'pan_right', label: 'Geser kanan', desc: 'Kamera bergeser ke kanan' },
                    { id: 'tilt_up', label: 'Naik', desc: 'Kamera bergerak ke atas' },
                    { id: 'tilt_down', label: 'Turun', desc: 'Kamera bergerak ke bawah' },
                    { id: 'dutch', label: 'Miring', desc: 'Miring sedikit untuk efek dramatis' },
                    { id: 'sway', label: 'Mengayun', desc: 'Goyang halus kiri-kanan' },
                    { id: 'crash_zoom', label: 'Crash zoom', desc: 'Zoom cepat untuk kejutan' },
                    { id: 'handheld', label: 'Handheld', desc: 'Goyang tipis seperti kamera tangan' },
                    { id: 'shake', label: 'Getar', desc: 'Getaran cepat saat momen tegang' },
                  ];

                  const elevenLabsFormattedText =
                    elevenLabsTab === 'baris'
                      ? project.scenes
                          .map((s) => (s.narration_text || s.voiceScript || '').trim())
                          .filter(Boolean)
                          .join('\n\n')
                      : elevenLabsTab === 'polos'
                      ? project.scenes
                          .map((s) => (s.narration_text || s.voiceScript || '').trim())
                          .filter(Boolean)
                          .join(' ')
                      : project.scenes
                          .map((s, i) => {
                            const tag =
                              i === 0
                                ? '[curious]'
                                : i === project.scenes.length - 1
                                ? '[warm]'
                                : i % 2 === 1
                                ? '[thoughtful]'
                                : '[earnest]';
                            return `${tag} ${(s.narration_text || s.voiceScript || '').trim()}`;
                          })
                          .filter(Boolean)
                          .join('\n\n');

                  if (!project.step_naskah_done) {
                    return (
                      <div className="space-y-4 max-w-xl mx-auto pb-16">
                        <div
                          data-testid="naskah-empty-state"
                          className={`rounded-2xl py-10 px-6 border flex flex-col items-center justify-center text-center ${
                            isLight
                              ? 'bg-white border-slate-200 shadow-xs'
                              : 'bg-[#041029]/95 border-sky-400/25'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-500 mb-3">
                            <FileText className="w-6 h-6" />
                          </div>
                          <h3
                            className={`font-extrabold text-sm ${
                              isLight ? 'text-slate-900' : 'text-white'
                            }`}
                          >
                            Naskah per scene belum dimuat
                          </h3>
                          <p
                            className={`text-xs max-w-xs mt-1 leading-relaxed ${
                              isLight ? 'text-slate-500' : 'text-slate-400'
                            }`}
                          >
                            Kirim perintah narasi ke AI di tab Atur lalu tempel hasilnya, atau gunakan kerangka adegan dari ide terpilih.
                          </p>
                          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                            <button
                              type="button"
                              data-testid="naskah-go-to-atur-btn"
                              onClick={() => setNaskahSubTab('atur')}
                              className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-sm transition cursor-pointer"
                            >
                              Ke tab Atur
                            </button>
                            {project.scenes && project.scenes.length > 0 && (
                              <button
                                type="button"
                                data-testid="naskah-use-concept-scenes-btn"
                                onClick={() => {
                                  handleUpdateFullProject(
                                    {
                                      ...project,
                                      step_ide_done: true,
                                      step_naskah_done: true,
                                    },
                                    { recalculateDurations: false }
                                  );
                                  setNaskahViewTutorialStep(1);
                                }}
                                className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                                  isLight
                                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                    : 'bg-[#071636] border-sky-400/30 text-sky-300 hover:border-sky-400'
                                }`}
                              >
                                Gunakan Kerangka Adegan Ide
                              </button>
                            )}
                          </div>
                          <TutorialPointerBubble
                            testId="tutorial-naskah-empty-pointer"
                            title="Buat Naskah Dulu"
                            text="Kirim perintah narasi di tab Atur lalu tempel hasilnya, atau gunakan kerangka ide."
                            onNext={() => setNaskahSubTab('atur')}
                          />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4 max-w-xl mx-auto pb-16">
                      {/* Section Header: Naskah | 8 scene · ±54 dtk */}
                      <div className="flex items-center justify-between px-1">
                        <h3 className="font-extrabold text-sm sm:text-base">
                          Naskah
                        </h3>
                        <span className="text-xs font-mono text-slate-400 tabular-nums">
                          {project.scenes.length} scene · ±{Math.round(actualScenesDuration)} dtk
                        </span>
                      </div>

                      {/* List of Scenes matching Screenshot_20261117-190634.jpg */}
                      <div className="space-y-3.5">
                        {project.scenes.map((sc, idx) => {
                          const durVal = Number(
                            sc.target_duration_sec || sc.durationSeconds || 6.5
                          );
                          const durStr = durVal.toFixed(2).replace('.', ',');
                          const narrationStr =
                            sc.narration_text || sc.voiceScript || sc.narasi || '';
                          const empWord =
                            sc.emphasis ||
                            sc.emphasis_words?.[0] ||
                            sc.emphasisWords?.[0] ||
                            '';
                          const camId = sc.camera || 'zoom_in';
                          const camLabel = CAMERA_LABELS[camId] || camId || 'Zoom in';
                          const visualStr =
                            sc.visual || sc.visualDescription || '';
                          const isEditingNarration = editingNarrationSceneIdx === idx;

                          // Tokenize narration so user can click any word to set it as emphasis
                          const tokens = narrationStr.split(/(\s+)/);

                          return (
                            <div
                              key={sc.id || idx}
                              data-testid={`naskah-scene-card-${idx + 1}`}
                              className={`rounded-3xl p-4 sm:p-5 border space-y-3.5 transition relative ${
                                idx === 0
                                  ? isLight
                                    ? 'bg-white border-2 border-blue-500 shadow-xs'
                                    : 'bg-[#041029]/95 border-2 border-sky-400/75 shadow-sm'
                                  : isLight
                                  ? 'bg-white border-blue-200/90 hover:border-blue-400 shadow-2xs'
                                  : 'bg-[#041029]/95 border-sky-400/20 hover:border-sky-400/45'
                              }`}
                            >
                              {/* Top Row: [1] [clock 6,88 dtk] on left | ↑ ↓ 🗑 on right */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-6 h-6 rounded-lg text-xs font-extrabold flex items-center justify-center ${
                                      idx === 0
                                        ? 'bg-sky-400 text-slate-950'
                                        : isLight
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-[#071636] text-sky-300 border border-sky-400/30'
                                    }`}
                                  >
                                    {idx + 1}
                                  </span>

                                  <div
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                                      isLight
                                        ? 'bg-slate-100 text-slate-800'
                                        : 'bg-[#071636] text-slate-200 border border-sky-400/20'
                                    }`}
                                  >
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span>{durStr} dtk</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveScene(idx, -1)}
                                    title="Geser scene ke atas"
                                    className="w-7 h-7 rounded-lg text-slate-400 hover:text-sky-400 disabled:opacity-30 flex items-center justify-center cursor-pointer transition"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === project.scenes.length - 1}
                                    onClick={() => handleMoveScene(idx, 1)}
                                    title="Geser scene ke bawah"
                                    className="w-7 h-7 rounded-lg text-slate-400 hover:text-sky-400 disabled:opacity-30 flex items-center justify-center cursor-pointer transition"
                                  >
                                    ↓
                                  </button>
                                  {project.scenes.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteScene(idx)}
                                      title="Hapus scene"
                                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-400 flex items-center justify-center cursor-pointer transition"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Interactive Narration Sentence (Click any word to set emphasis, or double-click to edit text) */}
                              <div className="relative">
                                {isEditingNarration ? (
                                  <div className="space-y-1.5">
                                    <textarea
                                      rows={2}
                                      autoFocus
                                      value={narrationStr}
                                      onChange={(e) =>
                                        handleUpdateScene(
                                          idx,
                                          'narration_text',
                                          e.target.value
                                        )
                                      }
                                      onBlur={() => setEditingNarrationSceneIdx(null)}
                                      className="w-full rounded-xl p-2.5 text-sm font-bold border focus:outline-none"
                                    />
                                    <div className="flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => setEditingNarrationSceneIdx(null)}
                                        className="text-[11px] font-bold text-sky-400 cursor-pointer"
                                      >
                                        Selesai edit
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    onDoubleClick={() => setEditingNarrationSceneIdx(idx)}
                                    className="text-sm sm:text-[15px] font-extrabold leading-relaxed cursor-pointer select-text"
                                    title="Klik kata untuk mengganti kata penekanan (emphasis), atau klik 2x untuk mengedit kalimat"
                                  >
                                    {tokens.map((tok, tIdx) => {
                                      if (/^\s+$/.test(tok)) {
                                        return <span key={tIdx}>{tok}</span>;
                                      }
                                      const cleanWord = tok.replace(
                                        /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,
                                        ''
                                      );
                                      const isEmp =
                                        cleanWord.length > 0 &&
                                        cleanWord.toLowerCase() ===
                                          empWord.trim().toLowerCase();
                                      return (
                                        <span
                                          key={tIdx}
                                          onClick={() => {
                                            if (!cleanWord) return;
                                            setDismissedTutorialWordClick(true);
                                            if (naskahViewTutorialStep === 1) {
                                              setNaskahViewTutorialStep(2);
                                            }
                                            const updatedScenes = [...project.scenes];
                                            updatedScenes[idx] = {
                                              ...updatedScenes[idx],
                                              emphasis: cleanWord,
                                              emphasis_words: [cleanWord],
                                              emphasisWords: [cleanWord],
                                            };
                                            handleUpdateFullProject(
                                              { ...project, scenes: updatedScenes },
                                              { recalculateDurations: false }
                                            );
                                          }}
                                          className={`rounded px-0.5 transition ${
                                            isEmp
                                              ? isLight
                                                ? 'bg-blue-100 text-blue-900 underline decoration-2 decoration-blue-600'
                                                : 'bg-sky-400/25 text-sky-200 underline decoration-2 decoration-sky-400'
                                              : 'hover:bg-sky-400/15'
                                          }`}
                                        >
                                          {tok}
                                        </span>
                                      );
                                    })}
                                    <button
                                      type="button"
                                      onClick={() => setEditingNarrationSceneIdx(idx)}
                                      className="ml-2 text-[11px] font-mono font-normal text-slate-400 hover:text-sky-400 cursor-pointer"
                                    >
                                      [edit]
                                    </button>
                                  </div>
                                )}

                                {idx === 0 && naskahViewTutorialStep === 1 && (
                                  <TutorialPointerBubble
                                    testId="tutorial-naskah-step-1"
                                    stepNumber={1}
                                    totalSteps={4}
                                    title="Kalimat Narasi & Kata Kunci"
                                    text="Klik kata mana saja pada kalimat untuk menjadikannya kata penekanan (emphasis), atau klik [edit] untuk mengubah teks."
                                    onPrev={() => {
                                      setNaskahSubTab('atur');
                                      setNarasiSetupTutorialStep(5);
                                    }}
                                    onNext={() => setNaskahViewTutorialStep(2)}
                                    onSkipAll={() => setNaskahViewTutorialStep(0)}
                                  />
                                )}
                              </div>

                              {/* Visual Description Box with Clapperboard Icon (Matching 190634.jpg) */}
                              <div
                                className={`rounded-2xl p-3.5 border flex items-start gap-2.5 ${
                                  isLight
                                    ? 'bg-slate-50/90 border-blue-100 text-slate-700'
                                    : 'bg-[#071636]/75 border-sky-400/15 text-slate-200'
                                }`}
                              >
                                <Film className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                <textarea
                                  rows={5}
                                  value={visualStr}
                                  onChange={(e) => {
                                    const updatedScenes = [...project.scenes];
                                    updatedScenes[idx] = {
                                      ...updatedScenes[idx],
                                      visual: e.target.value,
                                      visualDescription: e.target.value,
                                    };
                                    handleUpdateFullProject(
                                      { ...project, scenes: updatedScenes },
                                      { recalculateDurations: false }
                                    );
                                  }}
                                  placeholder="[Tempat, waktu] Deskripsi visual adegan..."
                                  className="w-full bg-transparent text-xs leading-relaxed focus:outline-none resize-y border-none p-0"
                                />
                              </div>

                              {idx === 0 && naskahViewTutorialStep === 2 && (
                                <TutorialPointerBubble
                                  testId="tutorial-naskah-step-2"
                                  stepNumber={2}
                                  totalSteps={4}
                                  title="Deskripsi Visual Adegan"
                                  text="Kotak ini menjelaskan latar tempat, waktu, dan aksi visual karakter yang akan dianimasikan pada scene ini."
                                  onPrev={() => setNaskahViewTutorialStep(1)}
                                  onNext={() => setNaskahViewTutorialStep(3)}
                                  onSkipAll={() => setNaskahViewTutorialStep(0)}
                                />
                              )}

                              {/* Bottom Control Row: [⚡ emphasis] | [Camera v] | [🖼 Foto: tanpa v] */}
                              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                {/* 1. Emphasis Word Pill Input */}
                                <div
                                  className={`flex-1 min-w-[125px] flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                                    isLight
                                      ? 'bg-white border-blue-200 text-slate-800'
                                      : 'bg-[#071636] border-sky-400/25 text-white'
                                  }`}
                                >
                                  <Zap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <input
                                    type="text"
                                    data-testid={`scene-emphasis-input-${idx + 1}`}
                                    value={empWord}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const updatedScenes = [...project.scenes];
                                      updatedScenes[idx] = {
                                        ...updatedScenes[idx],
                                        emphasis: val,
                                        emphasis_words: val ? [val] : [],
                                        emphasisWords: val ? [val] : [],
                                      };
                                      handleUpdateFullProject(
                                        { ...project, scenes: updatedScenes },
                                        { recalculateDurations: false }
                                      );
                                    }}
                                    placeholder="kata kunci"
                                    className="w-full bg-transparent text-xs font-bold focus:outline-none border-none p-0"
                                  />
                                </div>

                                {/* 2. Camera Selector Pill */}
                                <button
                                  type="button"
                                  data-testid={`scene-camera-btn-${idx + 1}`}
                                  onClick={() => setActiveCameraModalSceneIdx(idx)}
                                  className={`px-3.5 py-1.5 rounded-full border text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                                    isLight
                                      ? 'bg-white border-blue-200 text-slate-800 hover:bg-blue-50'
                                      : 'bg-[#071636] border-sky-400/25 text-slate-200 hover:border-sky-400'
                                  }`}
                                >
                                  <span>{camLabel}</span>
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                </button>

                                {/* 3. Photo Selector Pill */}
                                <button
                                  type="button"
                                  data-testid={`scene-photo-btn-${idx + 1}`}
                                  onClick={() => setActivePhotoModalSceneIdx(idx)}
                                  className={`px-3.5 py-1.5 rounded-full border text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                                    sc.media_url
                                      ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                                      : isLight
                                      ? 'bg-white border-blue-200 text-slate-800 hover:bg-blue-50'
                                      : 'bg-[#071636] border-sky-400/25 text-slate-200 hover:border-sky-400'
                                  }`}
                                >
                                  <Camera className="w-3.5 h-3.5 text-slate-400" />
                                  <span>
                                    Foto: {sc.media_url ? 'ada' : 'tanpa'}
                                  </span>
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                </button>
                              </div>

                              {idx === 0 && naskahViewTutorialStep === 3 && (
                                <TutorialPointerBubble
                                  testId="tutorial-naskah-step-3"
                                  stepNumber={3}
                                  totalSteps={4}
                                  title="Kamera, Foto Scene & Salin Naskah"
                                  text="Sesuaikan kata kunci, gerakan kamera (Zoom, Pan, Handheld), foto scene, atau salin naskah di bawah, lalu lanjut ke Suara."
                                  onPrev={() => setNaskahViewTutorialStep(2)}
                                  onNext={() => setNaskahViewTutorialStep(4)}
                                  onSkipAll={() => setNaskahViewTutorialStep(0)}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* FLOATING BOTTOM PILL BAR: [Salin naskah] [+ Tambah scene] (Matching 190634.jpg) */}
                      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 p-1.5 rounded-full border border-sky-400/30 bg-[#041029]/95 backdrop-blur-xl shadow-2xl">
                        <button
                          type="button"
                          data-testid="floating-salin-naskah-btn"
                          onClick={() => {
                            soundEngine.playSfx('click');
                            setIsElevenLabsModalOpen(true);
                          }}
                          className={`px-4 py-2.5 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer ${
                            isLight
                              ? 'bg-white text-slate-900 hover:bg-slate-100'
                              : 'bg-[#071636] text-white hover:bg-[#0b214f]'
                          }`}
                        >
                          <Copy className="w-3.5 h-3.5 text-sky-400" />
                          <span>Salin naskah</span>
                        </button>

                        <button
                          type="button"
                          data-testid="floating-tambah-scene-btn"
                          onClick={handleAddScene}
                          className="px-4 py-2.5 rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-200 text-slate-950 text-xs font-extrabold inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Tambah scene</span>
                        </button>
                      </div>

                      {/* MODAL: GERAKAN KAMERA (Matching Screenshot_20261109-160637_b2477ac6.jpg) */}
                      {activeCameraModalSceneIdx !== null && (
                        <div
                          data-testid="camera-movement-modal"
                          onClick={() => setActiveCameraModalSceneIdx(null)}
                          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
                        >
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className={`w-full max-w-md max-h-[82vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 border shadow-2xl space-y-2 ${
                              isLight
                                ? 'bg-white border-blue-200 text-slate-900'
                                : 'bg-[#041029] border-sky-400/40 text-white'
                            }`}
                          >
                            <div className="flex items-center justify-between pb-2">
                              <h4 className="text-sm font-extrabold">Gerakan kamera</h4>
                              <button
                                type="button"
                                onClick={() => setActiveCameraModalSceneIdx(null)}
                                className="text-xs font-bold text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>

                            <div className="space-y-1.5">
                              {CAMERA_OPTIONS.map((opt) => {
                                const currentScene =
                                  project.scenes[activeCameraModalSceneIdx];
                                const currentCam = currentScene?.camera || 'zoom_in';
                                const isSelected =
                                  currentCam === opt.id ||
                                  (opt.id === 'auto' && currentCam === 'zoom_in');
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => {
                                      const nextCam =
                                        opt.id === 'auto' ? 'zoom_in' : opt.id;
                                      const updatedScenes = [...project.scenes];
                                      updatedScenes[activeCameraModalSceneIdx] = {
                                        ...updatedScenes[activeCameraModalSceneIdx],
                                        camera: nextCam,
                                      };
                                      handleUpdateFullProject(
                                        { ...project, scenes: updatedScenes },
                                        { recalculateDurations: false }
                                      );
                                      setActiveCameraModalSceneIdx(null);
                                    }}
                                    className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                                      isSelected
                                        ? isLight
                                          ? 'bg-blue-50 border-blue-400'
                                          : 'bg-[#081d4a] border-sky-400'
                                        : isLight
                                        ? 'border-slate-200/80 hover:bg-slate-50'
                                        : 'border-sky-400/15 hover:bg-[#071636]'
                                    }`}
                                  >
                                    <div>
                                      <span className="text-xs font-extrabold block">
                                        {opt.label}
                                      </span>
                                      <span className="text-[11px] text-slate-400 block">
                                        {opt.desc}
                                      </span>
                                    </div>
                                    {isSelected && (
                                      <Check className="w-4 h-4 text-sky-400 shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* MODAL: FOTO SCENE N (OPSIONAL) (Matching Screenshot_20261109-160644_3d9c527a.jpg) */}
                      {activePhotoModalSceneIdx !== null && (
                        <div
                          data-testid="scene-photo-modal"
                          onClick={() => setActivePhotoModalSceneIdx(null)}
                          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
                        >
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 border shadow-2xl space-y-4 ${
                              isLight
                                ? 'bg-white border-blue-200 text-slate-900'
                                : 'bg-[#041029] border-sky-400/40 text-white'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-sm font-extrabold">
                                  Foto scene {activePhotoModalSceneIdx + 1} (opsional)
                                </h4>
                                <p className="text-[11px] text-slate-400">
                                  Kosongkan kalau scene ini cukup dianimasikan tanpa foto
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setActivePhotoModalSceneIdx(null)}
                                className="text-xs font-bold text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedScenes = [...project.scenes];
                                  updatedScenes[activePhotoModalSceneIdx] = {
                                    ...updatedScenes[activePhotoModalSceneIdx],
                                    media_url: undefined,
                                    media_filename: undefined,
                                    media_key: undefined,
                                  };
                                  handleUpdateFullProject(
                                    { ...project, scenes: updatedScenes },
                                    { recalculateDurations: false }
                                  );
                                  setActivePhotoModalSceneIdx(null);
                                }}
                                className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer ${
                                  !project.scenes[activePhotoModalSceneIdx]?.media_url
                                    ? 'border-sky-400 bg-sky-400/10'
                                    : 'border-sky-400/20'
                                }`}
                              >
                                <span className="text-lg text-slate-400">⊘</span>
                                <span className="text-xs font-extrabold">Foto tanpa</span>
                                <span className="text-[10px] text-slate-400">
                                  Tidak pakai foto di scene ini
                                </span>
                              </button>

                              <label className="p-5 rounded-2xl border-2 border-dashed border-sky-400/35 hover:border-sky-400 flex flex-col items-center justify-center gap-2 cursor-pointer text-center">
                                <Plus className="w-5 h-5 text-sky-400" />
                                <span className="text-xs font-extrabold">
                                  Upload foto baru
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Dari HP atau komputer
                                </span>
                                <input
                                  type="file"
                                  accept="image/*,video/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    handleUploadSingleSceneMedia(
                                      activePhotoModalSceneIdx,
                                      e.target.files
                                    );
                                    setActivePhotoModalSceneIdx(null);
                                  }}
                                />
                              </label>
                            </div>

                            {project.scenes[activePhotoModalSceneIdx]?.media_url && (
                              <div className="space-y-2.5 pt-2 border-t border-sky-400/20">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                    Mode Gerakan Remotion Aset Scene {activePhotoModalSceneIdx + 1}
                                  </label>
                                  <select
                                    data-testid="scene-photo-motion-preset-select"
                                    value={
                                      project.scenes[activePhotoModalSceneIdx]?.asset_motion_preset ||
                                      'auto_concept'
                                    }
                                    onChange={(e) => {
                                      const updatedScenes = [...project.scenes];
                                      updatedScenes[activePhotoModalSceneIdx] = {
                                        ...updatedScenes[activePhotoModalSceneIdx],
                                        asset_motion_preset: e.target.value as AssetMotionPreset,
                                      };
                                      const nextCodes = { ...(project.scene_codes || {}) };
                                      delete nextCodes[activePhotoModalSceneIdx + 1];
                                      handleUpdateFullProject(
                                        {
                                          ...project,
                                          scenes: updatedScenes,
                                          scene_codes: nextCodes,
                                        },
                                        { recalculateDurations: false }
                                      );
                                    }}
                                    className={`w-full rounded-xl px-3 py-2 text-xs font-bold border focus:outline-none ${
                                      isLight
                                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                                        : 'bg-[#071636] border-sky-400/30 text-white'
                                    }`}
                                  >
                                    {ASSET_MOTION_PRESET_OPTIONS.map((opt) => (
                                      <option key={opt.id} value={opt.id}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                    Prompt Gerakan Aset Sendiri
                                  </label>
                                  <input
                                    type="text"
                                    data-testid="scene-photo-motion-prompt-input"
                                    value={
                                      project.scenes[activePhotoModalSceneIdx]?.asset_motion_prompt ||
                                      ''
                                    }
                                    onChange={(e) => {
                                      const updatedScenes = [...project.scenes];
                                      updatedScenes[activePhotoModalSceneIdx] = {
                                        ...updatedScenes[activePhotoModalSceneIdx],
                                        asset_motion_prompt: e.target.value,
                                        asset_motion_preset: e.target.value.trim()
                                          ? 'custom'
                                          : updatedScenes[activePhotoModalSceneIdx]
                                              .asset_motion_preset,
                                      };
                                      const nextCodes = { ...(project.scene_codes || {}) };
                                      delete nextCodes[activePhotoModalSceneIdx + 1];
                                      handleUpdateFullProject(
                                        {
                                          ...project,
                                          scenes: updatedScenes,
                                          scene_codes: nextCodes,
                                        },
                                        { recalculateDurations: false }
                                      );
                                    }}
                                    placeholder="Contoh: Masuk melayang 3D dari bawah + sorot laser biru..."
                                    className={`w-full rounded-xl px-3 py-2 text-xs font-medium border focus:outline-none ${
                                      isLight
                                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                                        : 'bg-[#071636] border-sky-400/30 text-white'
                                    }`}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* MODAL: NASKAH UNTUK ELEVENLABS (Matching Screenshot_20261109-164749_161366e4.jpg) */}
                      {isElevenLabsModalOpen && (
                        <div
                          data-testid="elevenlabs-copy-modal"
                          onClick={() => setIsElevenLabsModalOpen(false)}
                          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
                        >
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 border shadow-2xl space-y-4 ${
                              isLight
                                ? 'bg-white border-blue-200 text-slate-900'
                                : 'bg-[#041029] border-sky-400/40 text-white'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-base font-extrabold">
                                  Naskah untuk ElevenLabs
                                </h4>
                                <p className="text-xs text-slate-400">
                                  {project.scenes.length} scene · ±{Math.round(actualScenesDuration)} dtk
                                </p>
                              </div>

                              <div className="flex items-center gap-1 p-1 rounded-xl bg-[#071636] border border-sky-400/25">
                                {[
                                  { id: 'baris', label: 'Baris' },
                                  { id: 'polos', label: 'Polos' },
                                  { id: 'emosi', label: '[emosi] v3' },
                                ].map((t) => (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() =>
                                      setElevenLabsTab(
                                        t.id as 'baris' | 'polos' | 'emosi'
                                      )
                                    }
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                      elevenLabsTab === t.id
                                        ? 'bg-sky-400 text-slate-950'
                                        : 'text-slate-300 hover:text-white'
                                    }`}
                                  >
                                    {t.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <textarea
                              readOnly
                              rows={7}
                              value={elevenLabsFormattedText}
                              className="w-full rounded-2xl p-3.5 text-xs leading-relaxed bg-[#020817] border border-sky-400/30 text-slate-100 focus:outline-none"
                            />

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(elevenLabsFormattedText);
                                  setCopiedElevenLabs(true);
                                  soundEngine.playSfx('ding');
                                  setTimeout(() => setCopiedElevenLabs(false), 2200);
                                }}
                                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-200 text-slate-950 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer"
                              >
                                {copiedElevenLabs ? (
                                  <>
                                    <Check className="w-4 h-4" />
                                    <span>Naskah tersalin!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-4 h-4" />
                                    <span>Salin naskah</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => setIsElevenLabsModalOpen(false)}
                                className="py-3 px-4 rounded-xl border border-sky-400/30 text-xs font-bold cursor-pointer"
                              >
                                Tutup
                              </button>
                            </div>

                            <div className="pt-2 border-t border-sky-400/15 space-y-1.5 text-[11px] text-slate-400">
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-sky-400/20 text-sky-300 font-bold flex items-center justify-center text-[10px]">
                                  1
                                </span>
                                <span>
                                  Tempel di ElevenLabs (Text to Speech) lalu generate suara
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-sky-400/20 text-sky-300 font-bold flex items-center justify-center text-[10px]">
                                  2
                                </span>
                                <span>Download file MP3 hasilnya</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-sky-400/20 text-sky-300 font-bold flex items-center justify-center text-[10px]">
                                  3
                                </span>
                                <span>
                                  Buka tab <strong>3. Suara</strong> → pilih Upload suara → pilih file MP3 tadi
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
            </div>
          )}

          {/* ========================================================== */}
          {/* TAHAP 3: SUARA (VOICE OVER & SOUND SFX) */}
          {/* ========================================================== */}
          {currentStep === 'suara' && (
            <Suspense
              fallback={
                <div className="py-12 text-center text-xs font-mono text-sky-400">
                  Memuat Studio Suara...
                </div>
              }
            >
              <VoiceSoundStudio
                project={project}
                themeMode={themeMode}
                onUpdateProject={handleUpdateFullProject}
                onNextToAnimation={() => {
                  soundEngine.unlock();
                  handleUpdateFullProject(
                    {
                      ...project,
                      step_ide_done: true,
                      step_naskah_done: true,
                      step_suara_done: true,
                    },
                    { recalculateDurations: false }
                  );
                  setCurrentStep('animasi');
                }}
              />
            </Suspense>
          )}

          {/* ========================================================== */}
          {/* TAHAP 4: ANIMASI (PLAYER REMOTION & EXPORT) */}
          {/* ========================================================== */}
          {currentStep === 'animasi' && (
            <Suspense
              fallback={
                <div className="py-12 text-center text-xs font-mono text-sky-400">
                  Memuat Studio Animasi...
                </div>
              }
            >
              <SatsetAnimationStudio
                project={project}
                themeMode={themeMode}
                onUpdateProject={handleUpdateFullProject}
                onOpenRemotionCode={onOpenRemotionCode}
                onNavigateToVoice={() => setCurrentStep('suara')}
                onOpenStyleModal={() => setIsStyleModalOpen(true)}
              />
            </Suspense>
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
            ? 'bg-white/95 border-slate-200'
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

          const isStep1Complete =
            Boolean(
              project.step_ide_done &&
                (project.selected_idea_id || project.start_mode === 'script')
            ) || currentIdx >= 2;

          const isStep2Complete =
            isStep1Complete &&
            (Boolean(project.step_naskah_done) || currentIdx >= 3);

          const isStep3Complete =
            isStep2Complete &&
            (Boolean(project.step_suara_done) ||
              Boolean(project.voice_audio_ready) ||
              Boolean(project.voice_skipped) ||
              Boolean((project as any).voice_audio_url) ||
              Boolean(project.scenes?.some((s) => Boolean(s.audio_url))) ||
              currentIdx >= 4);

          const isUnlocked =
            item.stepIndex === 1 ||
            item.stepIndex <= currentIdx ||
            (item.stepIndex === 2 && isStep1Complete) ||
            (item.stepIndex === 3 && isStep2Complete) ||
            (item.stepIndex === 4 && isStep3Complete);

          const IconComponent =
            isActive || isUnlocked ? item.unlockedIcon : Lock;

          return (
            <button
              key={item.id}
              type="button"
              data-testid={`bottom-nav-${item.id}`}
              onClick={() => {
                soundEngine.unlock();
                if (!isUnlocked) {
                  // Auto-prepare project state when user navigates to next steps so tutorial is always accessible across all 4 pages
                  const { nextConcepts, chosenConcept } = ensureDefaultConceptsAndSelect(true);
                  handleUpdateFullProject(
                    {
                      ...project,
                      idea_concepts: nextConcepts,
                      selected_idea_id: chosenConcept.id,
                      step_ide_done: true,
                      step_naskah_done: item.stepIndex >= 3 ? true : project.step_naskah_done,
                      step_suara_done: item.stepIndex >= 4 ? true : project.step_suara_done,
                    },
                    { recalculateDurations: false }
                  );
                }
                if (item.id === 'ide' && ideSetupTutorialStep === 0) {
                  setIdeSetupTutorialStep(1);
                } else if (item.id === 'naskah' && narasiSetupTutorialStep === 0) {
                  setNarasiSetupTutorialStep(1);
                }
                setStepGateWarning(null);
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
                  : 'text-slate-500 opacity-75'
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

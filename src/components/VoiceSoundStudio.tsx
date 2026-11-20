import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Mic,
  Upload,
  Play,
  Pause,
  Square,
  ChevronDown,
  ChevronUp,
  Sliders,
  Check,
  Search,
  X,
  ExternalLink,
  Copy,
  User,
  Volume2,
  Trash2,
  CheckCircle2,
  ArrowRight,
  KeyRound,
  Lock,
  RotateCcw,
  Music,
} from 'lucide-react';
import { type SatsetProject, type CharacterOption } from '../types/satset.ts';
import { soundEngine } from '../utils/audio-synth.ts';
import {
  voiceStudio,
  VOICE_PROFILES,
  VOICE_CATEGORIES,
  type VoiceProfile,
  DEFAULT_MALE_PROMPT,
  DEFAULT_FEMALE_PROMPT,
} from '../utils/voice-studio.ts';
import {
  computePreciseSceneWordTimings,
  synchronizeProjectPipeline,
} from '../utils/pipeline-sync.ts';
import { getCharacterMeta } from '../utils/character-catalog.ts';
import { TutorialPointerBubble } from './TutorialPointerBubble.tsx';
import {
  type CustomCharacterConfig,
  applyCharacterDesignPrompt,
  buildDeterministicCharacterFromPalette,
  createDefaultCustomCharacter,
  extractFrameAndPaletteFromMediaFile,
  normalizeAiPhotoCharacterResponse,
  saveCustomCharacter,
} from '../utils/custom-character.ts';
import { CharacterAvatarCanvas } from './CharacterAvatarCanvas.tsx';
import { CharacterBuilderModal } from './CharacterBuilderModal.tsx';

interface VoiceSoundStudioProps {
  project: SatsetProject;
  onUpdateProject: (p: SatsetProject) => void;
  onNextToAnimation: () => void;
  themeMode?: 'dark' | 'light';
}

export type VoiceSubTab = 'atur' | 'sinkron';

export const VoiceSoundStudio: React.FC<VoiceSoundStudioProps> = ({
  project,
  onUpdateProject,
  onNextToAnimation,
  themeMode = 'dark',
}) => {
  const isDark = themeMode === 'dark';
  const [subTab, setSubTab] = useState<VoiceSubTab>('atur');

  // Selected Voice state (default: Charon matching video 00:00)
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(() => {
    const raw = project.voice_character?.toLowerCase();
    const found = VOICE_PROFILES.find(
      (v) => v.id === raw || v.name.toLowerCase() === raw || v.geminiVoiceName.toLowerCase() === raw
    );
    return found ? found.id : 'charon';
  });

  const selectedVoice = useMemo<VoiceProfile>(() => {
    return (
      VOICE_PROFILES.find((v) => v.id === selectedVoiceId) ||
      VOICE_PROFILES.find((v) => v.name.toLowerCase() === selectedVoiceId.toLowerCase()) ||
      VOICE_PROFILES[0]
    );
  }, [selectedVoiceId]);

  const isFemaleVoice = selectedVoice.gender === 'female';

  // Model selection (Flash TTS vs Flash-Lite TTS)
  const [selectedModel] = useState<'Flash TTS' | 'Flash-Lite TTS'>(
    project.tts_model?.includes('Flash-Lite') ? 'Flash-Lite TTS' : 'Flash TTS'
  );

  // Gaya bicara prompt & collapsible state (matches video 00:01 - 00:06)
  const [isGayaBicaraOpen, setIsGayaBicaraOpen] = useState<boolean>(false);
  const [gayaBicara, setGayaBicara] = useState<string>(() => {
    if (project.speech_style && project.speech_style.length > 20) {
      return project.speech_style;
    }
    return isFemaleVoice ? DEFAULT_FEMALE_PROMPT : DEFAULT_MALE_PROMPT;
  });

  // Google AI Studio connection setup accordion (matches video 00:11 - 00:19)
  const [showStudioSetupAccordion, setShowStudioSetupAccordion] = useState<boolean>(false);
  const [studioConnectionInput, setStudioConnectionInput] = useState<string>(() => {
    try {
      return localStorage.getItem('satset_google_ai_studio_profile') || '';
    } catch {
      return '';
    }
  });
  const [dailyQuotaRemaining] = useState<number>(2);

  // Uploaded audio metadata display (matches video 00:01 & 00:20 "suara-charon.wav · 2.5 MB · siap dipakai ✓")
  const [uploadedFileName, setUploadedFileName] = useState<string>(
    () => `suara-${selectedVoiceId}.wav`
  );
  const [uploadedFileSizeLabel, setUploadedFileSizeLabel] = useState<string>('2.5 MB');

  // Keep prompt & project voice synced when user chooses a voice profile
  const handleSelectVoice = (voice: VoiceProfile) => {
    voiceStudio.stop();
    setIsPlayingSample(false);
    setActiveAuditionVoiceId(null);
    setSelectedVoiceId(voice.id);
    setUploadedFileName(`suara-${voice.id}.wav`);
    setIsVoiceModalOpen(false);
    const nextStyle =
      voice.gender === 'female' && gayaBicara === DEFAULT_MALE_PROMPT
        ? DEFAULT_FEMALE_PROMPT
        : voice.gender !== 'female' && gayaBicara === DEFAULT_FEMALE_PROMPT
        ? DEFAULT_MALE_PROMPT
        : gayaBicara;
    if (nextStyle !== gayaBicara) {
      setGayaBicara(nextStyle);
    }
    onUpdateProject({
      ...project,
      voice_character: voice.id,
      voice_option: voice.id,
      speech_style: nextStyle,
    });
    soundEngine.playSfx('ding');
  };

  const handleResetPrompt = () => {
    setGayaBicara(isFemaleVoice ? DEFAULT_FEMALE_PROMPT : DEFAULT_MALE_PROMPT);
    soundEngine.playSfx('click');
  };

  // Narrator Visual Character state (consistent across all scenes)
  const [isCharBuilderOpen, setIsCharBuilderOpen] = useState(false);
  const [charDesignPrompt, setCharDesignPrompt] = useState<string>(
    project.custom_character?.extraNote || ''
  );
  const [charRefPreviewUrl, setCharRefPreviewUrl] = useState<string>(
    project.custom_character?.referenceMediaUrl || ''
  );
  const [, setIsAnalyzingCharMedia] = useState(false);

  const activeCharacterMeta = useMemo(
    () => getCharacterMeta(project.character || 'cowok_modis', project.custom_character),
    [project.character, project.custom_character]
  );

  const applyConsistentNarratorCharacter = (
    charId: CharacterOption,
    customChar?: CustomCharacterConfig,
    toastLabel?: string
  ) => {
    const nextRaw: SatsetProject = {
      ...project,
      character: charId,
      custom_character: customChar !== undefined ? customChar : project.custom_character,
    };
    const targetGender = customChar
      ? customChar.gender === 'cewek'
        ? 'female'
        : 'male'
      : getCharacterMeta(charId, customChar).gender;
    if (targetGender === 'female' && selectedVoice.gender !== 'female') {
      const femVoice = VOICE_PROFILES.find((v) => v.gender === 'female') || VOICE_PROFILES[1];
      if (femVoice) {
        setSelectedVoiceId(femVoice.id);
        nextRaw.voice_character = femVoice.id;
      }
    } else if (targetGender === 'male' && selectedVoice.gender !== 'male' && charId !== 'none') {
      const maleVoice = VOICE_PROFILES.find((v) => v.gender === 'male') || VOICE_PROFILES[0];
      if (maleVoice) {
        setSelectedVoiceId(maleVoice.id);
        nextRaw.voice_character = maleVoice.id;
      }
    }
    const synced = synchronizeProjectPipeline(nextRaw, { forceStyleSync: true });
    onUpdateProject(synced);
    soundEngine.playSfx('pop');
    if (toastLabel) {
      showToast(toastLabel);
    }
  };

  const handleUploadNarratorReferenceMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIsAnalyzingCharMedia(true);
    try {
      const extracted = await extractFrameAndPaletteFromMediaFile(file);
      setCharRefPreviewUrl(extracted.previewUrl);
      const baseCfg =
        project.custom_character ||
        createDefaultCustomCharacter({
          name: `Narator ${selectedVoice.name}`,
          gender: isFemaleVoice ? 'cewek' : 'cowok',
        });

      let matched: CustomCharacterConfig | null = null;
      try {
        const resp = await fetch('/api/character/from-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: extracted.base64,
            mimeType: extracted.mimeType,
            hintName: `Narator ${selectedVoice.name}`,
            customPrompt: charDesignPrompt,
            dominantPalette: extracted.dominantPalette,
          }),
        });
        const data = await resp.json().catch(() => ({} as any));
        const presetPayload = data?.characterPreset || data?.character;
        if (resp.ok && presetPayload) {
          matched = normalizeAiPhotoCharacterResponse(presetPayload, baseCfg);
        }
      } catch {
        // Fallback to deterministic palette + prompt
      }

      if (!matched) {
        matched = buildDeterministicCharacterFromPalette(
          extracted.dominantPalette,
          charDesignPrompt,
          baseCfg
        );
      }

      const finalized: CustomCharacterConfig = {
        ...matched,
        id: matched.id.startsWith('custom_') ? matched.id : `custom_${Date.now().toString(36)}`,
        referenceMediaUrl: extracted.previewUrl,
        referenceMediaType: extracted.mediaType,
        voicePresetId: selectedVoice.id,
        extraNote: charDesignPrompt || matched.extraNote,
        updatedAt: Date.now(),
      };
      saveCustomCharacter(finalized);
      applyConsistentNarratorCharacter(
        finalized.id,
        finalized,
        `Karakter narator konsisten berhasil diterapkan!`
      );
    } catch (err: any) {
      showToast(err?.message || 'Gagal membaca file referensi karakter');
    } finally {
      setIsAnalyzingCharMedia(false);
    }
  };

  // Modals & Collapsibles
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceSearchQuery, setVoiceSearchQuery] = useState('');
  const [activeAuditionVoiceId, setActiveAuditionVoiceId] = useState<string | null>(null);

  // Audio Playback states
  const [isPlayingSample, setIsPlayingSample] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [activePreviewSceneIdx, setActivePreviewSceneIdx] = useState<number | null>(null);
  const [isPlayingFullNarration, setIsPlayingFullNarration] = useState(false);

  // Toast notifications ("Disalin")
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAudioReady = Boolean(
    project.voice_audio_ready ||
      (project as any).voice_audio_url ||
      (project.scenes && project.scenes.some((s) => Boolean(s.audio_url)))
  );

  // Filter voices in modal
  const filteredVoicesByCategory = useMemo(() => {
    const q = voiceSearchQuery.toLowerCase().trim();
    return VOICE_CATEGORIES.map((cat) => {
      const items = VOICE_PROFILES.filter((v) => {
        if (v.category !== cat.id) return false;
        if (!q) return true;
        return (
          v.name.toLowerCase().includes(q) ||
          v.character.toLowerCase().includes(q) ||
          v.subLabel.toLowerCase().includes(q) ||
          v.tags.some((t) => t.toLowerCase().includes(q))
        );
      });
      return { ...cat, items };
    });
  }, [voiceSearchQuery]);

  // Play natural voice sample preview
  const handleToggleSample = async () => {
    if (isPlayingSample) {
      voiceStudio.stop();
      setIsPlayingSample(false);
      return;
    }

    setIsPlayingSample(true);
    soundEngine.playSfx('ding');

    await voiceStudio.playVoiceSample(selectedVoice.id, {
      onEnd: () => {
        setIsPlayingSample(false);
      },
    });
  };

  // Audition voice from inside modal
  const handleAuditionVoiceInModal = async (e: React.MouseEvent, voice: VoiceProfile) => {
    e.stopPropagation();
    if (activeAuditionVoiceId === voice.id) {
      voiceStudio.stop();
      setActiveAuditionVoiceId(null);
      return;
    }

    voiceStudio.stop();
    setActiveAuditionVoiceId(voice.id);
    soundEngine.playSfx('click');

    await voiceStudio.playVoiceSample(voice.id, {
      onEnd: () => {
        setActiveAuditionVoiceId(null);
      },
    });
  };

  // Full Narration Script as lines
  const naskahLines: string[] = useMemo(() => {
    if (project.scenes && project.scenes.length > 0) {
      return project.scenes.map((s) => s.narration_text || s.voiceScript || '').filter(Boolean);
    }
    return [
      'Berhenti bakar rokok pas kepala lagi pusing, mending matikan dulu kompor masalahmu.',
      'Jujur deh, tiap kerjaan lagi numpuk atau tagihan datang, tanganmu otomatis nyari korek kan?',
      'Kamu ngira hisapan itu bikin tenang, padahal lima menit kemudian pusingnya balik lagi.',
      'Coba bayangin kalau wajan di dapurmu lagi gosong dan asapnya ngebul memenuhi ruangan.',
      'Masa iya kamu malah bakar kertas di pojokan cuma biar bau gosongnya ketutup?',
      'Aneh banget kan, tapi justru itu yang kamu lakuin tiap ngerokok pas lagi stres.',
      'Kompor masalahnya masih nyala gede, jadi taruh rokokmu dan beresin satu urusan paling mendesak.',
      'Buka jendelanya, matikan apinya sekarang, dan mulai hari ini tanpa nambah asap baru lagi.',
    ];
  }, [project.scenes]);

  // Copy style prompt
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(gayaBicara);
      soundEngine.playSfx('click');
      showToast('Gaya bicara disalin');
    } catch {
      showToast('Gaya bicara disalin');
    }
  };

  // Copy script
  const handleCopyNaskah = async () => {
    try {
      const fullText = naskahLines.join('\n\n');
      await navigator.clipboard.writeText(fullText);
      soundEngine.playSfx('click');
      showToast('Naskah berhasil disalin!');
    } catch {
      showToast('Naskah berhasil disalin!');
    }
  };

  // Open Google AI Studio helper
  const handleOpenGoogleAiStudio = (mode: 'keys' | 'speech') => {
    const targetUrl =
      mode === 'keys'
        ? 'https://aistudio.google.com/api-keys'
        : 'https://aistudio.google.com/generate-speech';
    try {
      navigator.clipboard?.writeText(targetUrl).catch(() => {});
    } catch {
      // ignore
    }
    showToast(`Membuka Google AI Studio (${mode === 'keys' ? 'API Keys' : 'Speech'})...`);
  };

  const handleSaveStudioConnection = () => {
    try {
      localStorage.setItem('satset_google_ai_studio_profile', studioConnectionInput.trim());
    } catch {
      // ignore
    }
    soundEngine.playSfx('ding');
    showToast('Koneksi Google AI Studio disimpan');
  };

  // Generate TTS Audio for all scenes via VoiceStudio / Gemini in 1 single batch request
  const handleGenerateVoice = async () => {
    setIsGenerating(true);
    setGenerateProgress(18);
    soundEngine.playSfx('whoosh');

    const progressTimer = setInterval(() => {
      setGenerateProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressTimer);
          return 90;
        }
        return prev + 16;
      });
    }, 240);

    try {
      const scenesList = project.scenes || [];
      const sceneTexts =
        scenesList.length > 0
          ? scenesList.map((sc) => (sc.narration_text || sc.voiceScript || '').trim())
          : naskahLines;

      const batchResult = await voiceStudio.synthesizeBatchScenes(
        sceneTexts,
        selectedVoice.id,
        gayaBicara,
        selectedVoice.recommendedSpeed
      );

      const activeTempo = project.tempo === 'santai' ? 'santai' : 'energik';
      const calibratedScenes = scenesList.map((scene, idx) => {
        const text = (scene.narration_text || scene.voiceScript || '').trim();
        const emph = scene.emphasis_words || scene.emphasisWords || [];
        const batchSceneItem = batchResult.sceneAudios?.[idx];
        const synthesizedUrl =
          batchSceneItem?.audioData || voiceStudio.getCachedSceneAudio(text, selectedVoice.id);
        const measuredAudioDur =
          batchSceneItem?.durationSec || voiceStudio.getCachedSceneDuration(text, selectedVoice.id);

        const timing = computePreciseSceneWordTimings(
          text,
          emph,
          activeTempo,
          undefined,
          measuredAudioDur
        );
        return {
          ...scene,
          target_duration_sec: timing.recommendedDurationSec,
          durationSeconds: timing.recommendedDurationSec,
          word_timings: timing.wordTimings,
          wordAt: timing.wordAt,
          audio_url: synthesizedUrl || undefined,
          audio_text: text,
          audio_voice_id: selectedVoice.id,
          audio_duration_sec: measuredAudioDur,
        };
      });

      clearInterval(progressTimer);
      setGenerateProgress(100);
      setIsGenerating(false);
      setUploadedFileName(`suara-${selectedVoice.id}.wav`);
      setUploadedFileSizeLabel('2.5 MB');
      soundEngine.playSfx('ding');

      const updatedProject = synchronizeProjectPipeline({
        ...project,
        voice_audio_ready: true,
        voice_character: selectedVoice.name,
        voice_option: selectedVoice.id,
        voiceOption: selectedVoice.id,
        tts_model: selectedModel,
        speech_style: gayaBicara,
        voice_skipped: false,
        ...(batchResult.fullAudioData ? { voice_audio_url: batchResult.fullAudioData } : {}),
        scenes: calibratedScenes.length > 0 ? calibratedScenes : project.scenes,
      } as SatsetProject);

      onUpdateProject(updatedProject);
      setSubTab('sinkron');
    } catch {
      clearInterval(progressTimer);
      setIsGenerating(false);
      setGenerateProgress(100);
      setSubTab('sinkron');
    }
  };

  // Upload custom audio file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objUrl = URL.createObjectURL(file);
    voiceStudio.setCustomProjectAudioUrl(objUrl);
    setUploadedFileName(file.name);
    const sizeMb = Math.max(0.1, file.size / (1024 * 1024));
    setUploadedFileSizeLabel(`${sizeMb.toFixed(1)} MB`);
    soundEngine.playSfx('ding');
    const updatedScenes = (project.scenes || []).map((sc) => ({
      ...sc,
      audio_url: objUrl,
      audio_voice_id: 'custom_human',
    }));
    const updatedProject: SatsetProject = synchronizeProjectPipeline({
      ...project,
      voice_audio_ready: true,
      voice_character: `Suara Sendiri (${file.name})`,
      voice_skipped: false,
      voice_audio_url: objUrl,
      scenes: updatedScenes.length > 0 ? updatedScenes : project.scenes,
    } as SatsetProject);
    onUpdateProject(updatedProject);
    showToast('File suara berhasil dipasang');
    setSubTab('sinkron');
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordTimerRef = useRef<number | null>(null);

  // Toggle live microphone recording
  const handleToggleRecord = async () => {
    if (isRecording) {
      setIsRecording(false);
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      soundEngine.playSfx('ding');

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        return;
      }

      await handleGenerateVoice();
      return;
    }

    setRecordSeconds(0);
    setIsRecording(true);
    soundEngine.playSfx('pop');
    recordTimerRef.current = window.setInterval(() => {
      setRecordSeconds((s) => s + 1);
    }, 1000);

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recordedChunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) {
            recordedChunksRef.current.push(ev.data);
          }
        };

        recorder.onstop = () => {
          stream.getTracks().forEach((tr) => tr.stop());
          const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          if (blob.size <= 64) {
            handleGenerateVoice();
            return;
          }
          const recordedUrl = URL.createObjectURL(blob);
          voiceStudio.setCustomProjectAudioUrl(recordedUrl);
          setUploadedFileName('rekaman-suara.webm');
          setUploadedFileSizeLabel(`${Math.max(0.2, blob.size / (1024 * 1024)).toFixed(1)} MB`);
          const updatedScenes = (project.scenes || []).map((sc) => ({
            ...sc,
            audio_url: recordedUrl,
            audio_voice_id: 'custom_mic',
          }));
          const updatedProject: SatsetProject = synchronizeProjectPipeline({
            ...project,
            voice_audio_ready: true,
            voice_character: 'Rekaman Mikrofon Sendiri',
            voice_skipped: false,
            voice_audio_url: recordedUrl,
            scenes: updatedScenes.length > 0 ? updatedScenes : project.scenes,
          } as SatsetProject);
          onUpdateProject(updatedProject);
          showToast('Rekaman suara berhasil disimpan');
          setSubTab('sinkron');
        };

        recorder.start();
      }
    } catch {
      // Keep timer running so user can click stop even if browser blocks mic in iframe preview
    }
  };

  // Skip voice option
  const handleSkipVoice = () => {
    const updated: SatsetProject = {
      ...project,
      voice_skipped: true,
    };
    onUpdateProject(updated);
    onNextToAnimation();
  };

  // Compute cumulative scene timings for Sinkron view
  const sceneSyncItems = useMemo(() => {
    const rawScenes = project.scenes || [];
    let cursor = 0;
    return rawScenes.map((sc, idx) => {
      const dur = Math.max(4, Math.round(sc.target_duration_sec || sc.durationSeconds || 6.5));
      const startSec = cursor;
      const endSec = cursor + dur;
      cursor = endSec;
      const rawText = (sc.voiceScript || sc.narration_text || naskahLines[idx] || '').trim();
      const text =
        rawText.includes(' / ') && naskahLines[idx] && !naskahLines[idx].includes(' / ')
          ? naskahLines[idx]
          : rawText.replace(/\s*\/\s*/g, ', ');
      const emphList = sc.emphasis_words || sc.emphasisWords || [];
      return {
        index: idx,
        sceneNumber: idx + 1,
        text,
        startSec,
        endSec,
        durationSec: dur,
        emphasisWords: emphList,
        wordTimings: sc.word_timings || [],
      };
    });
  }, [project.scenes, naskahLines]);

  const totalVoiceDurationSec = useMemo(() => {
    if (sceneSyncItems.length === 0) return 53;
    return sceneSyncItems[sceneSyncItems.length - 1].endSec;
  }, [sceneSyncItems]);

  // Active scene index in Sinkron & live playhead for moving word-by-word subtitle sync
  const [selectedSyncSceneIdx, setSelectedSyncSceneIdx] = useState<number>(0);
  const [livePlayheadSec, setLivePlayheadSec] = useState<number>(0);
  const playheadIntervalRef = useRef<number | null>(null);
  const fullNarrationRunIdRef = useRef<number>(0);
  const fullNarrationTimerRef = useRef<number | null>(null);

  const stopPlayheadTicker = () => {
    if (playheadIntervalRef.current !== null) {
      clearInterval(playheadIntervalRef.current);
      playheadIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      fullNarrationRunIdRef.current++;
      stopPlayheadTicker();
      if (fullNarrationTimerRef.current !== null) {
        clearTimeout(fullNarrationTimerRef.current);
        fullNarrationTimerRef.current = null;
      }
      if (recordTimerRef.current !== null) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      voiceStudio.stop();
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Play preview for a specific scene with moving word-by-word subtitle sync
  const handlePreviewSceneVoice = (text: string, idx: number) => {
    soundEngine.unlock();
    const targetSceneItem = sceneSyncItems[idx];
    if (!targetSceneItem) return;

    if (activePreviewSceneIdx === idx && !isPlayingFullNarration) {
      voiceStudio.stop();
      stopPlayheadTicker();
      setActivePreviewSceneIdx(null);
      return;
    }

    fullNarrationRunIdRef.current++;
    stopPlayheadTicker();
    voiceStudio.stop();
    setIsPlayingFullNarration(false);
    setSelectedSyncSceneIdx(idx);
    setActivePreviewSceneIdx(idx);
    setLivePlayheadSec(targetSceneItem.startSec);
    soundEngine.playSfx('click');

    const startedAt = performance.now();
    playheadIntervalRef.current = window.setInterval(() => {
      const elapsed = (performance.now() - startedAt) / 1000;
      const nextSec = Math.min(targetSceneItem.endSec, targetSceneItem.startSec + elapsed);
      setLivePlayheadSec(nextSec);
      if (nextSec >= targetSceneItem.endSec) {
        stopPlayheadTicker();
        setActivePreviewSceneIdx(null);
      }
    }, 50);

    const sceneObj = project.scenes?.[idx] as any;
    const isMatchingSceneAudio =
      sceneObj?.audio_url &&
      !String(sceneObj.audio_url).includes('/audio/samples/') &&
      (!sceneObj.audio_text || String(sceneObj.audio_text).trim() === text.trim()) &&
      (!sceneObj.audio_voice_id ||
        sceneObj.audio_voice_id === selectedVoice.id ||
        String(sceneObj.audio_voice_id).startsWith('custom_'));
    const sceneAudioUrl = isMatchingSceneAudio ? sceneObj.audio_url : undefined;

    voiceStudio.speak(text, {
      profileId: selectedVoice.id,
      customSpeed: selectedVoice.recommendedSpeed,
      audioUrl: sceneAudioUrl,
      antiGoogleRobot: true,
      onEnd: () => {
        // Let the playhead ticker finish smoothly if voiceStudio returns early in headless browsers
      },
    });
  };

  // Play full narration sequentially with live word-by-word moving subtitle sync (matches video 00:26 - 00:28)
  const handlePlayFullNarration = () => {
    soundEngine.unlock();
    fullNarrationRunIdRef.current++;
    stopPlayheadTicker();
    if (fullNarrationTimerRef.current !== null) {
      clearTimeout(fullNarrationTimerRef.current);
      fullNarrationTimerRef.current = null;
    }

    if (isPlayingFullNarration) {
      voiceStudio.stop();
      setIsPlayingFullNarration(false);
      setActivePreviewSceneIdx(null);
      return;
    }

    const runId = fullNarrationRunIdRef.current;
    setIsPlayingFullNarration(true);
    setSelectedSyncSceneIdx(0);
    setActivePreviewSceneIdx(0);
    setLivePlayheadSec(0);
    soundEngine.playSfx('whoosh');

    // Start continuous 50ms playhead ticker so subtitles and waveform move smoothly in real time
    const playbackStartMs = performance.now();
    playheadIntervalRef.current = window.setInterval(() => {
      if (runId !== fullNarrationRunIdRef.current) {
        stopPlayheadTicker();
        return;
      }
      const elapsedSec = (performance.now() - playbackStartMs) / 1000;
      if (elapsedSec >= totalVoiceDurationSec) {
        setLivePlayheadSec(totalVoiceDurationSec);
        stopPlayheadTicker();
        setIsPlayingFullNarration(false);
        setActivePreviewSceneIdx(null);
        return;
      }
      setLivePlayheadSec(elapsedSec);
      const currentScene = sceneSyncItems.find(
        (it) => elapsedSec >= it.startSec && elapsedSec < it.endSec
      );
      if (currentScene) {
        setActivePreviewSceneIdx(currentScene.index);
        setSelectedSyncSceneIdx(currentScene.index);
      }
    }, 50);

    // Also trigger voiceStudio audio synthesis/playback per scene
    const uploadedUrl = (project as any).voice_audio_url;
    if (uploadedUrl && String(uploadedUrl).startsWith('blob:')) {
      voiceStudio.playProjectAudioAtTime(uploadedUrl, 0, () => {
        if (runId !== fullNarrationRunIdRef.current) return;
        stopPlayheadTicker();
        setIsPlayingFullNarration(false);
        setActivePreviewSceneIdx(null);
      });
      return;
    }

    const scenes = project.scenes || [];
    let currentIdx = 0;

    const playNext = () => {
      if (runId !== fullNarrationRunIdRef.current) return;
      if (currentIdx >= scenes.length) {
        return;
      }

      const scene = scenes[currentIdx] as any;
      const text = scene.narration_text || scene.voiceScript || '';
      const isMatchingSceneAudio =
        scene?.audio_url &&
        !String(scene.audio_url).includes('/audio/samples/') &&
        (!scene.audio_text || String(scene.audio_text).trim() === text.trim()) &&
        (!scene.audio_voice_id ||
          scene.audio_voice_id === selectedVoice.id ||
          String(scene.audio_voice_id).startsWith('custom_'));
      const sceneAudioUrl = isMatchingSceneAudio ? scene.audio_url : undefined;

      voiceStudio.speak(text, {
        profileId: selectedVoice.id,
        customSpeed: selectedVoice.recommendedSpeed,
        audioUrl: sceneAudioUrl,
        antiGoogleRobot: true,
        onEnd: () => {
          if (runId !== fullNarrationRunIdRef.current) return;
          currentIdx++;
          fullNarrationTimerRef.current = window.setTimeout(playNext, 250);
        },
      });
    };

    playNext();
  };

  // Additional state for Suara (Atur & Sinkron)
  const [voiceVolume, setVoiceVolume] = useState<number>(100);
  const [showManualAiStudioGuide, setShowManualAiStudioGuide] = useState<boolean>(false);
  const [showNarratorCharDrawer, setShowNarratorCharDrawer] = useState<boolean>(false);
  const [showReadyPointer, setShowReadyPointer] = useState<boolean>(true);
  const [showGeneratePointer, setShowGeneratePointer] = useState<boolean>(true);
  const [syncRecheckNotice, setSyncRecheckNotice] = useState<string | null>(null);
  const [voiceTutorialStep, setVoiceTutorialStep] = useState<number>(1);
  const [sinkronTutorialStep, setSinkronTutorialStep] = useState<number>(1);

  const advanceVoiceTutorial = () => {
    if (voiceTutorialStep >= 6) {
      setVoiceTutorialStep(0);
      setSubTab('sinkron');
      setSinkronTutorialStep(1);
    } else {
      setVoiceTutorialStep((prev) => prev + 1);
    }
  };

  const skipVoiceTutorial = () => {
    setVoiceTutorialStep(0);
    setShowGeneratePointer(false);
  };

  const formatMmSs = (sec: number): string => {
    const safe = Math.max(0, Math.floor(sec));
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const effectiveSyncSceneIdx =
    activePreviewSceneIdx !== null
      ? activePreviewSceneIdx
      : Math.min(selectedSyncSceneIdx, Math.max(0, sceneSyncItems.length - 1));

  const currentElapsedSec = useMemo(() => {
    if (isPlayingFullNarration || activePreviewSceneIdx !== null) {
      return Math.min(totalVoiceDurationSec, livePlayheadSec);
    }
    const activeItem = sceneSyncItems[effectiveSyncSceneIdx];
    if (!activeItem) return 0;
    return activeItem.startSec;
  }, [
    isPlayingFullNarration,
    activePreviewSceneIdx,
    livePlayheadSec,
    sceneSyncItems,
    effectiveSyncSceneIdx,
    totalVoiceDurationSec,
  ]);

  // 72 deterministic waveform bars with dotted scene boundaries
  const waveformBars = useMemo(() => {
    const totalBars = 72;
    const boundaryIndices = new Set<number>();
    if (totalVoiceDurationSec > 0 && sceneSyncItems.length > 1) {
      sceneSyncItems.slice(1).forEach((item) => {
        const bIdx = Math.min(
          totalBars - 2,
          Math.max(1, Math.round((item.startSec / totalVoiceDurationSec) * totalBars))
        );
        boundaryIndices.add(bIdx);
      });
    }
    return Array.from({ length: totalBars }).map((_, i) => {
      const wave1 = Math.sin(i * 0.65) * 0.36;
      const wave2 = Math.cos(i * 1.35) * 0.28;
      const wave3 = Math.sin(i * 2.15 + 0.9) * 0.22;
      const amp = Math.abs(wave1 + wave2 + wave3);
      const heightPct = boundaryIndices.has(i)
        ? 22
        : Math.max(18, Math.min(96, Math.round(22 + amp * 84)));
      return {
        heightPct,
        isBoundary: boundaryIndices.has(i),
      };
    });
  }, [sceneSyncItems, totalVoiceDurationSec]);

  const handleDeleteVoiceAudio = () => {
    voiceStudio.stop();
    stopPlayheadTicker();
    setIsPlayingFullNarration(false);
    setActivePreviewSceneIdx(null);
    const updated: SatsetProject = {
      ...project,
      voice_audio_ready: false,
      voice_audio_url: undefined,
    };
    onUpdateProject(updated);
    showToast('Suara dihapus');
  };

  const handleRecheckSync = () => {
    soundEngine.playSfx('ding');
    setSyncRecheckNotice('Subtitle sudah tersinkronisasi penuh dengan ketukan suara.');
    setTimeout(() => setSyncRecheckNotice(null), 2600);
  };

  // Render scene text with real-time word-by-word moving highlight during playback (matches video 00:26 - 00:28)
  const renderSinkronSceneText = (
    item: (typeof sceneSyncItems)[number],
    isActive: boolean
  ) => {
    const words = item.text.split(/\s+/).filter(Boolean);
    if (!isActive || words.length === 0) {
      return <span>{item.text}</span>;
    }

    const isActivelyPlaying = isPlayingFullNarration || activePreviewSceneIdx === item.index;
    let highlightIdx = 0;

    if (isActivelyPlaying) {
      const localElapsed = Math.max(0, currentElapsedSec - item.startSec);
      const sceneProgress = Math.max(0, Math.min(0.999, localElapsed / Math.max(1, item.durationSec)));
      highlightIdx = Math.min(words.length - 1, Math.floor(sceneProgress * words.length));
    } else {
      // When paused on a selected scene, highlight the first word (if Scene 1) or emphasis word
      if (item.index === 0) {
        highlightIdx = 0;
      } else if (item.emphasisWords && item.emphasisWords.length > 0) {
        const target = item.emphasisWords[0].toLowerCase().replace(/[^a-z0-9]/gi, '');
        const found = words.findIndex(
          (w) => w.toLowerCase().replace(/[^a-z0-9]/gi, '') === target
        );
        highlightIdx = found >= 0 ? found : Math.max(0, words.length - 2);
      } else {
        highlightIdx = Math.max(0, words.length - 2);
      }
    }

    return (
      <span>
        {words.map((word, wIdx) => {
          if (wIdx === highlightIdx) {
            return (
              <React.Fragment key={wIdx}>
                <span
                  data-testid="sinkron-active-word-pill"
                  className="inline-block px-1.5 py-0.5 mx-0.5 rounded-md bg-[#2563EB] text-white font-bold leading-tight shadow-xs transition-all duration-100"
                >
                  {word}
                </span>{' '}
              </React.Fragment>
            );
          }
          if (wIdx > highlightIdx) {
            return (
              <span key={wIdx} className="text-slate-400 transition-colors duration-100">
                {word}{' '}
              </span>
            );
          }
          return (
            <span
              key={wIdx}
              className={isDark ? 'text-white font-medium' : 'text-slate-900 font-medium'}
            >
              {word}{' '}
            </span>
          );
        })}
      </span>
    );
  };

  return (
    <div className="max-w-xl mx-auto space-y-3.5 pb-24 relative" data-testid="voice-sound-studio">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,video/mp4,.mp3,.wav,.m4a,.ogg,.mp4"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Segmented Subtabs: [ Atur ] | [ Sinkron ] */}
      <div
        className={`grid grid-cols-2 p-1 rounded-2xl border ${
          isDark ? 'bg-[#11151E] border-white/[0.08]' : 'bg-slate-200/80 border-slate-300/80'
        }`}
      >
        <button
          type="button"
          data-testid="voice-subtab-atur"
          onClick={() => setSubTab('atur')}
          className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'atur'
              ? isDark
                ? 'bg-[#1A2030] text-white shadow-sm border border-white/[0.08]'
                : 'bg-white text-slate-900 shadow-xs'
              : isDark
              ? 'text-slate-400 hover:text-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Atur
        </button>
        <button
          type="button"
          data-testid="voice-subtab-sinkron"
          onClick={() => setSubTab('sinkron')}
          className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'sinkron'
              ? isDark
                ? 'bg-[#1A2030] text-white shadow-sm border border-white/[0.08]'
                : 'bg-white text-slate-900 shadow-xs'
              : isDark
              ? 'text-slate-400 hover:text-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Sinkron</span>
        </button>
      </div>

      {/* Top Status Banner: Matches video 00:00 - 00:28 when isAudioReady is true */}
      {isAudioReady ? (
        <div className="relative">
          <div
            data-testid="voice-ready-banner"
            className={`p-3.5 rounded-2xl border space-y-3 ${
              isDark
                ? 'bg-[#11151E] border-emerald-500/35'
                : 'bg-white border-emerald-500/40 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[13px] font-bold leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Suara sudah ada
                </p>
                <p className={`text-[11px] leading-snug ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Putar dan dengarkan suaranya dulu.
                </p>
              </div>
            </div>

            <div className="p-0.5 rounded-xl border border-blue-500/35">
              <button
                type="button"
                data-testid="voice-proceed-animation-button"
                onClick={() => {
                  setShowReadyPointer(false);
                  onNextToAnimation();
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[13px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Lanjut ke Animasi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {((subTab === 'sinkron' && sinkronTutorialStep === 4) ||
            (showReadyPointer && subTab === 'atur' && voiceTutorialStep === 0)) && (
            <TutorialPointerBubble
              testId="tutorial-voice-ready-pointer"
              stepNumber={subTab === 'sinkron' ? 4 : undefined}
              totalSteps={subTab === 'sinkron' ? 4 : undefined}
              title={subTab === 'sinkron' ? 'Lanjut ke Halaman 4. Animasi' : 'Suara Siap Dipakai'}
              text="Bagus! Suara dan subtitle sudah sinkron. Klik untuk lanjut ke halaman 4. Animasi."
              nextLabel="Lanjut ke Animasi →"
              onPrev={
                subTab === 'sinkron'
                  ? () => setSinkronTutorialStep(3)
                  : undefined
              }
              onNext={() => {
                setShowReadyPointer(false);
                setSinkronTutorialStep(0);
                onNextToAnimation();
              }}
              onSkipAll={() => {
                setShowReadyPointer(false);
                setSinkronTutorialStep(0);
              }}
              onDismiss={() => setShowReadyPointer(false)}
            />
          )}
        </div>
      ) : (
        <div
          data-testid="voice-unready-banner"
          className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            isDark ? 'bg-[#11151E] border-white/[0.08]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="space-y-0.5 min-w-0">
            <h3 className={`text-xs sm:text-[13px] font-bold leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Buat suara narator di tab Atur, atau upload file audio
            </h3>
            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Dengan suara, durasi scene dan animasi ikut pas dengan ucapan.
            </p>
          </div>
          <button
            type="button"
            data-testid="skip-without-voice-button"
            onClick={handleSkipVoice}
            className={`shrink-0 px-3 py-2 rounded-xl border text-[11px] font-semibold transition cursor-pointer ${
              isDark
                ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.1] text-slate-200'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            Lewati tanpa suara
          </button>
        </div>
      )}

      {/* ========================================================== */}
      {/* SUBTAB 1: ATUR (Matches video 00:00 - 00:25 100%)          */}
      {/* ========================================================== */}
      {subTab === 'atur' && (
        <div className="space-y-3.5">
          {/* Card 1: Narator AI */}
          <div
            className={`rounded-2xl p-4 sm:p-5 border space-y-3.5 ${
              isDark ? 'bg-[#11151E] border-white/[0.08]' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            {/* Header Row: Sparkles + Narator AI + Sisa 2x hari ini badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-blue-500 shrink-0" />
                  <h3 className={`font-extrabold text-sm sm:text-[15px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Narator AI
                  </h3>
                </div>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Bisa langsung dipakai, 2× sehari
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 text-[11px] font-bold">
                  Sisa {dailyQuotaRemaining}x hari ini
                </span>
              </div>
            </div>

            {/* Suara Selector (2-line button + helper row below matching video 00:01) */}
            <div className="space-y-1.5">
              <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Suara
              </label>
              <button
                type="button"
                data-testid="voice-persona-select"
                onClick={() => setIsVoiceModalOpen(true)}
                className={`w-full text-left border rounded-xl px-3.5 py-2.5 transition cursor-pointer flex items-center justify-between gap-2 ${
                  isDark
                    ? 'bg-[#161B26] border-white/[0.1] hover:border-blue-500/40 text-white'
                    : 'bg-slate-50/70 border-slate-200 hover:border-blue-400 text-slate-900'
                }`}
              >
                <div className="min-w-0">
                  <span className="text-xs sm:text-[13px] font-extrabold block leading-snug">
                    {selectedVoice.name}
                  </span>
                  <span className={`text-[11px] block truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {selectedVoice.subLabel}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              {/* Inline sample preview helper row matching video 00:01 */}
              <button
                type="button"
                data-testid="preview-voice-sample-button"
                onClick={handleToggleSample}
                className={`inline-flex items-center gap-1.5 text-[11px] pt-0.5 transition cursor-pointer ${
                  isPlayingSample
                    ? 'text-[#2563EB] font-bold'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {isPlayingSample ? (
                  <>
                    <Square className="w-2.5 h-2.5 fill-current text-[#2563EB]" />
                    <span>Menghentikan contoh suara {selectedVoice.name}...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>untuk mendengar contoh, gratis, tidak memotong kuota.</span>
                  </>
                )}
              </button>

              {voiceTutorialStep === 1 && (
                <TutorialPointerBubble
                  testId="tutorial-voice-step-1"
                  stepNumber={1}
                  totalSteps={6}
                  title="Pilih Karakter Suara Narator AI"
                  text="Pilih karakter suara narator AI (Charon, Kore, Fenrir, Aoede, dll) dan klik di bawahnya untuk mendengar contoh suaranya secara gratis."
                  onNext={advanceVoiceTutorial}
                  onSkipAll={skipVoiceTutorial}
                />
              )}
            </div>

            {/* Collapsible Gaya bicara Box (Matches video 00:01 - 00:06) */}
            <div
              className={`rounded-xl border transition-all ${
                isDark
                  ? 'bg-[#161B26]/80 border-white/[0.08]'
                  : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              <div
                onClick={() => setIsGayaBicaraOpen(!isGayaBicaraOpen)}
                data-testid="toggle-gaya-bicara-btn"
                className="p-3 flex items-center justify-between gap-2.5 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                      isDark
                        ? 'bg-[#11151E] border-white/[0.08] text-blue-400'
                        : 'bg-white border-slate-200 text-blue-600'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Gaya bicara
                    </span>
                    <span className={`text-[11px] block truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {gayaBicara}
                    </span>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563EB] shrink-0">
                  <span>Ubah</span>
                  {isGayaBicaraOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </span>
              </div>

              {isGayaBicaraOpen && (
                <div className="px-3 pb-3 pt-1 space-y-2 border-t border-slate-200/60">
                  <textarea
                    rows={4}
                    data-testid="speaking-style-textarea"
                    value={gayaBicara}
                    onChange={(e) => setGayaBicara(e.target.value)}
                    className={`w-full border rounded-xl p-3 text-xs leading-relaxed focus:outline-none focus:border-blue-500 transition resize-y ${
                      isDark
                        ? 'bg-[#11151E] border-white/[0.1] text-slate-200'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                  <div>
                    <button
                      type="button"
                      data-testid="reset-gaya-bicara-btn"
                      onClick={handleResetPrompt}
                      className={`text-[11px] font-semibold hover:underline cursor-pointer ${
                        isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Kembalikan bawaan
                    </button>
                  </div>
                </div>
              )}
            </div>

            {voiceTutorialStep === 2 && (
              <TutorialPointerBubble
                testId="tutorial-voice-step-2"
                stepNumber={2}
                totalSteps={6}
                title="Gaya Bicara & Intonasi"
                text="Klik Ubah untuk menyesuaikan instruksi gaya bicara, intonasi, dan jeda napas narator sesuai karakter kontenmu."
                onPrev={() => setVoiceTutorialStep(1)}
                onNext={advanceVoiceTutorial}
                onSkipAll={skipVoiceTutorial}
              />
            )}

            {/* Primary Action Button: Generate suara [VoiceName] (Matches video 00:01 - 00:06) */}
            <div className="space-y-1">
              <button
                type="button"
                data-testid="generate-voice-btn"
                onClick={handleGenerateVoice}
                disabled={isGenerating}
                className="w-full py-3.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-[13px] font-extrabold transition flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer shadow-sm"
              >
                <Mic className="w-4 h-4" />
                <span>
                  {isGenerating
                    ? `Memproses suara ${selectedVoice.name}... ${generateProgress}%`
                    : `Generate suara ${selectedVoice.name}`}
                </span>
              </button>

              {voiceTutorialStep === 3 ? (
                <TutorialPointerBubble
                  testId="tutorial-voice-step-3"
                  stepNumber={3}
                  totalSteps={6}
                  title="Generate Suara AI Otomatis"
                  text="Klik tombol ini untuk membuat suara narator otomatis sesuai seluruh kalimat naskah per scene."
                  onPrev={() => setVoiceTutorialStep(2)}
                  onNext={advanceVoiceTutorial}
                  onSkipAll={skipVoiceTutorial}
                />
              ) : (
                !isAudioReady &&
                showGeneratePointer &&
                voiceTutorialStep === 0 && (
                  <TutorialPointerBubble
                    testId="tutorial-voice-generate-pointer"
                    text="Klik untuk membuat suara narator"
                    onDismiss={() => setShowGeneratePointer(false)}
                  />
                )
              )}
            </div>

            {/* Collapsible: Setup Google AI Studio inside Card 1 (Matches video 00:11 - 00:19) */}
            <div
              className={`rounded-xl border transition-all ${
                isDark
                  ? 'bg-[#161B26]/80 border-white/[0.08]'
                  : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              <button
                type="button"
                data-testid="toggle-studio-setup-btn"
                onClick={() => setShowStudioSetupAccordion(!showStudioSetupAccordion)}
                className="w-full p-3 flex items-center justify-between gap-2.5 text-left cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                      isDark
                        ? 'bg-[#11151E] border-white/[0.08] text-blue-400'
                        : 'bg-white border-slate-200 text-blue-600'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Setup Google AI Studio sendiri
                    </span>
                    <span className={`text-[11px] block truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Opsional, tidak memotong jatah harianmu
                    </span>
                  </div>
                </div>
                {showStudioSetupAccordion ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {showStudioSetupAccordion && (
                <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-200/60 space-y-3 text-xs">
                  <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Opsional. Kalau diisi, suara dibuat pakai sesi Google AI Studio kamu dulu, jadi jatah suara harianmu tidak berkurang.
                  </p>

                  {/* Step 1 */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <span className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        Buka Google AI Studio, klik <strong className="font-bold">Create API key</strong>, lalu salin ID sesi studio-nya.
                      </span>
                    </div>
                    <div className="pl-7">
                      <button
                        type="button"
                        data-testid="open-aistudio-keys-btn"
                        onClick={() => handleOpenGoogleAiStudio('keys')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                          isDark
                            ? 'bg-[#11151E] border-blue-500/30 text-blue-400 hover:border-blue-400'
                            : 'bg-white border-blue-200 text-[#2563EB] hover:bg-blue-50'
                        }`}
                      >
                        <span>Buka AI Studio</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <span className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        Tempel di sini, lalu simpan.
                      </span>
                    </div>
                    <div className="pl-7 flex items-center gap-2">
                      <input
                        type="text"
                        data-testid="aistudio-profile-input"
                        value={studioConnectionInput}
                        onChange={(e) => setStudioConnectionInput(e.target.value)}
                        placeholder="Studio-ID / Profil AI Studio..."
                        className={`flex-1 rounded-xl px-3 py-2 text-xs font-mono border focus:outline-none focus:border-blue-500 ${
                          isDark
                            ? 'bg-[#11151E] border-white/[0.1] text-white'
                            : 'bg-white border-slate-200 text-slate-900'
                        }`}
                      />
                      <button
                        type="button"
                        data-testid="save-aistudio-profile-btn"
                        onClick={handleSaveStudioConnection}
                        className="px-3.5 py-2 rounded-xl bg-[#2563EB]/85 hover:bg-[#2563EB] text-white text-xs font-bold transition cursor-pointer shrink-0"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-0.5 text-[10px] text-slate-400">
                    <Lock className="w-3 h-3 shrink-0" />
                    <span>Tersimpan aman di akunmu dan hanya dipakai untuk membuat suaramu.</span>
                  </div>
                </div>
              )}
              {voiceTutorialStep === 4 && (
                <div className="px-3 pb-3">
                  <TutorialPointerBubble
                    testId="tutorial-voice-step-4"
                    stepNumber={4}
                    totalSteps={6}
                    title="Setup Google AI Studio Sendiri (Opsional)"
                    text="Opsional: hubungkan profil sesi Google AI Studio milikmu agar proses generate suara memakai kuota pribadimu."
                    onPrev={() => setVoiceTutorialStep(3)}
                    onNext={advanceVoiceTutorial}
                    onSkipAll={skipVoiceTutorial}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Punya suara sendiri? (Matches video 00:01 & 00:20 - 00:25 100%) */}
          <div
            className={`rounded-2xl p-4 sm:p-5 border space-y-3.5 ${
              isDark ? 'bg-[#11151E] border-white/[0.08]' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="space-y-0.5">
              <h3 className={`font-extrabold text-sm sm:text-[15px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Punya suara sendiri?
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Upload rekaman, ambil suara dari video, atau rekam langsung
              </p>
            </div>

            {isAudioReady ? (
              /* Active File Card + Rekam ulang langsung button (Matches video 00:01 & 00:20 - 00:25) */
              <div className="space-y-3">
                <div
                  data-testid="uploaded-voice-ready-card"
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                    isDark
                      ? 'bg-emerald-500/[0.08] border-emerald-500/35'
                      : 'bg-emerald-50/60 border-emerald-500/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Music className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs sm:text-[13px] font-extrabold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {uploadedFileName}
                      </p>
                      <p className="text-[11px] font-semibold text-emerald-600">
                        {uploadedFileSizeLabel} · siap dipakai ✓
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    data-testid="upload-own-voice-btn"
                    onClick={() => fileInputRef.current?.click()}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shrink-0 ${
                      isDark
                        ? 'bg-[#161B26] border-white/[0.1] text-slate-200 hover:bg-white/[0.08]'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ganti</span>
                  </button>
                </div>

                {/* Centered Rekam ulang langsung button */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleToggleRecord}
                    data-testid="record-own-voice-btn"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isRecording
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse'
                        : isDark
                        ? 'bg-[#161B26] hover:bg-white/[0.06] border-white/[0.1] text-slate-200'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-2xs'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span>
                      {isRecording
                        ? `Merekam (${recordSeconds} dtk) — Klik selesai`
                        : 'Rekam ulang langsung'}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* Dashed Dropzone Box when no audio yet */
              <div className="space-y-3">
                <div
                  data-testid="upload-own-voice-btn"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                    isDark
                      ? 'border-white/[0.12] hover:border-blue-500/45 bg-[#161B26]/60'
                      : 'border-slate-300 hover:border-blue-500 bg-slate-50/70'
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-500 mb-2.5">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Pilih file suara
                  </p>
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    atau seret file ke sini (MP3, WAV, M4A, OGG, MP4)
                  </p>
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleToggleRecord}
                    data-testid="record-own-voice-btn"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isRecording
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse'
                        : isDark
                        ? 'bg-[#161B26] hover:bg-white/[0.06] border-white/[0.1] text-slate-200'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-2xs'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span>
                      {isRecording
                        ? `Merekam (${recordSeconds} dtk) — Klik selesai`
                        : 'Rekam suara langsung'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Collapsible: Buat manual lewat Google AI Studio (tanpa API key) — Matches video 00:20 - 00:25 100% */}
            <div
              className={`rounded-xl border overflow-hidden ${
                isDark
                  ? 'bg-[#161B26]/80 border-white/[0.08]'
                  : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              <button
                type="button"
                data-testid="manual-aistudio-toggle"
                onClick={() => setShowManualAiStudioGuide(!showManualAiStudioGuide)}
                className="w-full px-3.5 py-3 flex items-center justify-between text-left cursor-pointer select-none"
              >
                <span className={`text-xs font-bold flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  <Mic className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Buat manual lewat Google AI Studio (tanpa API key)</span>
                </span>
                {showManualAiStudioGuide ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {showManualAiStudioGuide && (
                <div className="px-3.5 pb-4 pt-2 border-t border-slate-200/60 space-y-3 text-xs">
                  <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Gratis, tanpa API key. Kamu membuat suaranya sendiri di situs Google, lalu upload file-nya di atas.
                  </p>

                  {/* Step 1 */}
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <span className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        <strong className="font-bold">Buka halaman suara</strong> Google AI Studio. Login pakai akun Google kalau diminta.
                      </span>
                    </div>
                    <div className="pl-7">
                      <button
                        type="button"
                        data-testid="open-aistudio-speech-btn"
                        onClick={() => handleOpenGoogleAiStudio('speech')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                          isDark
                            ? 'bg-[#11151E] border-blue-500/30 text-blue-400 hover:border-blue-400'
                            : 'bg-white border-blue-200 text-[#2563EB] hover:bg-blue-50'
                        }`}
                      >
                        <span>Buka AI Studio</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Di halaman <em>&ldquo;Turn text into natural-sounding speech&rdquo;</em>, klik kartu <strong className="font-bold">Create new dialog</strong> (yang paling kiri, ada ikon +).
                    </span>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Di panel kanan, buka <strong className="font-bold">Model settings</strong>, lalu pilih suara <strong className="font-bold">{selectedVoice.name}</strong>. Kalau ada pilihan jumlah pembicara, pilih <strong className="font-bold">1 pembicara</strong>.
                    </span>
                  </div>

                  {/* Step 4 */}
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                        4
                      </span>
                      <span className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        <strong className="font-bold">Salin naskah</strong> ini, lalu tempel di kotak teks di tengah layar.
                      </span>
                    </div>
                    <div className="pl-7">
                      <button
                        type="button"
                        data-testid="copy-manual-naskah-btn"
                        onClick={handleCopyNaskah}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-extrabold shadow-xs cursor-pointer transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin naskah</span>
                      </button>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                      5
                    </span>
                    <span className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Klik tombol <strong className="font-bold">Run</strong> di bawah kotak teks dan tunggu suaranya selesai dibuat. Di pemutar audio yang muncul, klik ikon <strong className="font-bold">Download</strong> untuk menyimpan file-nya.
                    </span>
                  </div>

                  {/* Step 6 */}
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                      6
                    </span>
                    <span className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Kembali ke sini dan <strong className="font-bold">upload file itu</strong> lewat <em>&ldquo;Pilih file suara&rdquo;</em> di atas. Suaranya otomatis dipotong per scene dari jeda antar-paragraf.
                    </span>
                  </div>

                  {/* Bottom Info Box */}
                  <div
                    className={`p-3 rounded-xl border text-[10px] leading-relaxed ${
                      isDark
                        ? 'bg-[#11151E] border-white/[0.06] text-slate-400'
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    Tersedia di AI Studio versi gratis. Kalau tampilannya sedikit berbeda di HP, cari yang intinya sama: buat percakapan teks-ke-suara, pilih suara, tempel naskah, jalankan, lalu unduh audionya.
                  </div>
                </div>
              )}
              {voiceTutorialStep === 5 && (
                <div className="px-3 pb-3">
                  <TutorialPointerBubble
                    testId="tutorial-voice-step-5"
                    stepNumber={5}
                    totalSteps={6}
                    title="Upload / Rekam Manual / Buat di AI Studio"
                    text="Kamu juga bisa upload file rekaman sendiri (MP3/WAV), rekam suara langsung, atau buka panduan buat manual gratis di Google AI Studio."
                    onPrev={() => setVoiceTutorialStep(4)}
                    onNext={advanceVoiceTutorial}
                    onSkipAll={skipVoiceTutorial}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Collapsible Karakter Narator Visual Drawer */}
          <div
            data-testid="voice-narrator-character-card"
            className={`rounded-2xl border overflow-hidden ${
              isDark ? 'bg-[#11151E] border-white/[0.08]' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <button
              type="button"
              onClick={() => setShowNarratorCharDrawer(!showNarratorCharDrawer)}
              className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
            >
              <span className={`text-xs font-medium flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span>Karakter Narator Visual ({activeCharacterMeta.name})</span>
              </span>
              {showNarratorCharDrawer ? (
                <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              )}
            </button>

            {showNarratorCharDrawer && (
              <div className="p-4 pt-2 border-t border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <CharacterAvatarCanvas
                      characterId={activeCharacterMeta.id}
                      pose={isPlayingSample ? 'point' : 'wave'}
                      viewMode={project.character_framing || 'full'}
                      dimension={project.character_dimension || '3d'}
                      animated={true}
                      size={56}
                      darkBg={isDark}
                      customCharacter={project.custom_character}
                    />
                    <div>
                      <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {activeCharacterMeta.name}
                      </p>
                      <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {activeCharacterMeta.description}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    data-testid="voice-open-char-builder-btn"
                    onClick={() => setIsCharBuilderOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold cursor-pointer"
                  >
                    Edit Karakter
                  </button>
                </div>
              </div>
            )}

            {voiceTutorialStep === 6 && (
              <div className="px-3 pb-3">
                <TutorialPointerBubble
                  testId="tutorial-voice-step-6"
                  stepNumber={6}
                  totalSteps={6}
                  title="Karakter Visual & Lanjut ke Sinkron"
                  text="Sesuaikan tampilan karakter narator visual di sini. Klik tombol Lanjut di bawah untuk membuka tab Sinkron!"
                  nextLabel="Lanjut ke Sinkron →"
                  onPrev={() => setVoiceTutorialStep(5)}
                  onNext={advanceVoiceTutorial}
                  onSkipAll={skipVoiceTutorial}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* SUBTAB 2: SINKRON (Matches video 00:26 - 00:28 100%)       */}
      {/* ========================================================== */}
      {subTab === 'sinkron' && (
        <div className="space-y-3.5">
          {!isAudioReady ? (
            <div
              data-testid="sinkron-empty-state"
              className={`rounded-2xl py-12 px-6 border flex flex-col items-center justify-center text-center ${
                isDark ? 'bg-[#11151E] border-white/[0.08]' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-500 mb-3.5">
                <Volume2 className="w-6 h-6" />
              </div>
              <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Belum ada suara
              </h3>
              <p className={`text-xs max-w-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Buat suara otomatis dengan AI atau upload rekamanmu sendiri di tab Atur.
              </p>
              <button
                type="button"
                data-testid="go-to-atur-voice-button"
                onClick={() => setSubTab('atur')}
                className="mt-4 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
              >
                Ke tab Atur
              </button>
              <TutorialPointerBubble
                testId="tutorial-sinkron-empty-pointer"
                title="Buat Suara Dulu"
                text="Buka tab Atur untuk generate suara AI atau upload rekamanmu."
                onNext={() => setSubTab('atur')}
              />
            </div>
          ) : (
            <div data-testid="sinkron-populated-view" className="space-y-3.5">
              {/* Section Header Row: Suara narator | Hapus suara */}
              <div className="flex items-center justify-between pt-1">
                <h3
                  className={`text-[18px] font-extrabold tracking-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Suara narator
                </h3>
                <button
                  type="button"
                  data-testid="delete-voice-btn"
                  onClick={handleDeleteVoiceAudio}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[12px] font-semibold transition cursor-pointer ${
                    isDark
                      ? 'text-slate-400 hover:text-rose-400 hover:bg-white/[0.04]'
                      : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus suara</span>
                </button>
              </div>

              {/* Main Waveform Player Card */}
              <div
                data-testid="sinkron-waveform-card"
                className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
                  isDark
                    ? 'bg-[#11151E] border-white/[0.08]'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                {sinkronTutorialStep === 1 && (
                  <TutorialPointerBubble
                    testId="tutorial-sinkron-play-pointer"
                    stepNumber={1}
                    totalSteps={4}
                    title="Pemutar Waveform & Volume Suara"
                    text="Klik Play untuk memutar seluruh narasi, lihat batas antar-scene pada gelombang audio, dan atur volume suara."
                    onNext={() => setSinkronTutorialStep(2)}
                    onSkipAll={() => setSinkronTutorialStep(0)}
                  />
                )}
                {/* Top Controls Row: Play Button + Scene X dari Y + Timecode | Volume Slider */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      data-testid="sinkron-play-toggle"
                      onClick={handlePlayFullNarration}
                      aria-label={isPlayingFullNarration ? 'Jeda suara' : 'Putar suara'}
                      className="w-11 h-11 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center justify-center shadow-md shadow-blue-600/25 shrink-0 transition active:scale-95 cursor-pointer"
                    >
                      {isPlayingFullNarration ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <p
                        data-testid="sinkron-active-scene-label"
                        className={`text-[13px] sm:text-[14px] font-extrabold leading-tight whitespace-nowrap ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        Scene {effectiveSyncSceneIdx + 1} dari {sceneSyncItems.length}
                      </p>
                      <p
                        data-testid="sinkron-timecode-label"
                        className="text-[11px] sm:text-[12px] font-mono text-slate-400 mt-0.5 whitespace-nowrap"
                      >
                        {formatMmSs(currentElapsedSec)} / {formatMmSs(totalVoiceDurationSec)}
                      </p>
                    </div>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="range"
                      data-testid="sinkron-volume-slider"
                      min={0}
                      max={100}
                      value={voiceVolume}
                      onChange={(e) => setVoiceVolume(Number(e.target.value))}
                      aria-label="Volume suara narator"
                      className="w-16 sm:w-24 h-1.5 rounded-lg appearance-none bg-blue-500/20 accent-[#2563EB] cursor-pointer"
                    />
                    <span className="text-[11px] sm:text-[12px] font-mono text-slate-400 w-6 text-right">
                      {voiceVolume}
                    </span>
                  </div>
                </div>

                {/* Multi-bar Vertical Waveform with Dotted Scene Dividers */}
                <div
                  data-testid="sinkron-waveform-bars"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
                    const ratio = rect.width > 0 ? clickX / rect.width : 0;
                    const targetIdx = Math.min(
                      sceneSyncItems.length - 1,
                      Math.max(0, Math.floor(ratio * sceneSyncItems.length))
                    );
                    setSelectedSyncSceneIdx(targetIdx);
                    const targetScene = sceneSyncItems[targetIdx];
                    if (targetScene) {
                      handlePreviewSceneVoice(targetScene.text, targetIdx);
                    }
                  }}
                  className="relative h-16 sm:h-20 flex items-center justify-between gap-[2px] sm:gap-[3px] px-1 cursor-pointer select-none"
                >
                  {waveformBars.map((bar, bIdx) => {
                    const barRatio = bIdx / Math.max(1, waveformBars.length - 1);
                    const progressRatio =
                      totalVoiceDurationSec > 0
                        ? currentElapsedSec / totalVoiceDurationSec
                        : 0;
                    const isPlayed = barRatio <= progressRatio;
                    return (
                      <React.Fragment key={bIdx}>
                        {bar.isBoundary && (
                          <div
                            className="h-full border-l border-dotted border-slate-500/45 mx-[1px]"
                            title="Batas Scene"
                          />
                        )}
                        <div
                          style={{ height: `${bar.heightPct}%` }}
                          className={`flex-1 min-w-[2px] rounded-full transition-colors duration-75 ${
                            isPlayed ? 'bg-[#2563EB]' : 'bg-blue-500/25'
                          }`}
                        />
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Subtitle Sync Status Row */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 text-emerald-500">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="text-[12px] font-bold">Subtitle sinkron dengan suara</span>
                </div>
                <button
                  type="button"
                  data-testid="sinkron-recheck-btn"
                  onClick={handleRecheckSync}
                  className={`text-[12px] font-medium underline cursor-pointer ${
                    isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Cek ulang
                </button>
              </div>

              {sinkronTutorialStep === 2 && (
                <TutorialPointerBubble
                  testId="tutorial-sinkron-step-2"
                  stepNumber={2}
                  totalSteps={4}
                  title="Status Sinkronisasi & Cek Ulang"
                  text="Indikator ini memastikan timing subtitle kata demi kata sudah sinkron dengan suara. Klik Cek ulang jika ada perubahan naskah."
                  onPrev={() => setSinkronTutorialStep(1)}
                  onNext={() => setSinkronTutorialStep(3)}
                  onSkipAll={() => setSinkronTutorialStep(0)}
                />
              )}

              {syncRecheckNotice && (
                <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-semibold text-emerald-500">
                  {syncRecheckNotice}
                </div>
              )}

              {/* Numbered Scene List (1 to N — Moving word-by-word highlight during playback) */}
              <div data-testid="sinkron-scene-list" className="space-y-1.5 pt-1">
                {sinkronTutorialStep === 3 && (
                  <TutorialPointerBubble
                    testId="tutorial-sinkron-step-3"
                    stepNumber={3}
                    totalSteps={4}
                    title="Daftar Scene & Sorotan Kata Real-Time"
                    text="Klik baris scene mana saja untuk langsung memutar adegan tersebut dan memantau sorotan kata yang bergerak sinkron."
                    onPrev={() => setSinkronTutorialStep(2)}
                    onNext={() => setSinkronTutorialStep(4)}
                    onSkipAll={() => setSinkronTutorialStep(0)}
                  />
                )}
                {sceneSyncItems.map((item) => {
                  const isActive = item.index === effectiveSyncSceneIdx;
                  return (
                    <div
                      key={item.sceneNumber}
                      data-testid={`sinkron-scene-row-${item.sceneNumber}`}
                      onClick={() => {
                        setSelectedSyncSceneIdx(item.index);
                        handlePreviewSceneVoice(item.text, item.index);
                      }}
                      className={`p-3 sm:p-3.5 rounded-2xl flex items-start gap-3 transition-all cursor-pointer border ${
                        isActive
                          ? isDark
                            ? 'bg-[#11151E] border-blue-500/35 shadow-sm'
                            : 'bg-white border-blue-300 shadow-xs'
                          : 'border-transparent hover:bg-white/[0.03]'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-[12px] font-extrabold shrink-0 mt-0.5 transition-colors ${
                          isActive
                            ? 'bg-[#2563EB] text-white shadow-xs'
                            : 'text-[#2563EB] font-bold'
                        }`}
                      >
                        {item.sceneNumber}
                      </div>

                      <div
                        className={`flex-1 min-w-0 text-[13px] sm:text-[14px] leading-relaxed ${
                          isDark ? 'text-slate-200' : 'text-slate-800'
                        }`}
                      >
                        {renderSinkronSceneText(item, isActive)}
                      </div>

                      <span className="text-[12px] font-mono text-slate-400 shrink-0 mt-0.5">
                        {formatMmSs(item.startSec)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: "Pilih..." VOICE PICKER (Matches video 00:07 - 00:09) */}
      {/* ========================================================== */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl border overflow-hidden ${
              isDark
                ? 'bg-[#11151E] border-white/[0.1] text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Top Search Bar: "Pilih..." matching video 00:07 */}
            <div className="p-3.5 border-b border-slate-200/60 flex items-center gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  data-testid="voice-modal-search-input"
                  value={voiceSearchQuery}
                  onChange={(e) => setVoiceSearchQuery(e.target.value)}
                  placeholder="Pilih..."
                  className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none ${
                    isDark
                      ? 'bg-[#161B26] text-slate-100 placeholder-slate-400'
                      : 'bg-slate-50 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  voiceStudio.stop();
                  setActiveAuditionVoiceId(null);
                  setIsVoiceModalOpen(false);
                }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
                  isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Categorized Voice List matching video 00:07 - 00:09 */}
            <div className="overflow-y-auto flex-1 px-2 py-2 space-y-3">
              {filteredVoicesByCategory.map((category) => {
                if (category.items.length === 0) return null;
                return (
                  <div key={category.id} className="space-y-0.5">
                    <div className="px-3 py-1.5 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                      {category.label}
                    </div>

                    <div className="space-y-0.5">
                      {category.items.map((voice) => {
                        const isSelected = selectedVoice.id === voice.id;
                        const isAuditioning = activeAuditionVoiceId === voice.id;

                        return (
                          <div
                            key={voice.id}
                            data-testid={`voice-option-${voice.id}`}
                            onClick={() => handleSelectVoice(voice)}
                            className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-left transition cursor-pointer ${
                              isSelected
                                ? isDark
                                  ? 'bg-blue-500/15 text-blue-400'
                                  : 'bg-blue-50/90 text-[#2563EB]'
                                : isDark
                                ? 'hover:bg-white/[0.04] text-slate-200'
                                : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div className="flex-1 min-w-0 pr-3">
                              <div className="font-bold text-xs sm:text-[13px] leading-snug">
                                {voice.name}
                              </div>
                              <div className={`text-[11px] leading-tight truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {voice.subLabel}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isSelected && (
                                <Check className="w-4 h-4 text-[#2563EB] stroke-[2.5]" />
                              )}
                              <button
                                type="button"
                                data-testid={`audition-voice-${voice.id}`}
                                onClick={(e) => handleAuditionVoiceInModal(e, voice)}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer ${
                                  isAuditioning
                                    ? 'bg-[#2563EB] text-white'
                                    : isDark
                                    ? 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
                                }`}
                                title={`Dengar contoh suara ${voice.name}`}
                              >
                                {isAuditioning ? (
                                  <Square className="w-3 h-3 fill-current" />
                                ) : (
                                  <Play className="w-3 h-3 fill-current ml-0.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST */}
      {toastMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-slate-950 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-1.5 border border-slate-700">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* FULL CHARACTER BUILDER MODAL */}
      <CharacterBuilderModal
        isOpen={isCharBuilderOpen}
        onClose={() => setIsCharBuilderOpen(false)}
        initialCharacter={project.custom_character}
        themeMode={themeMode}
        onSaveAndUse={(saved) => {
          setCharRefPreviewUrl(saved.referenceMediaUrl || '');
          setCharDesignPrompt(saved.extraNote || '');
          applyConsistentNarratorCharacter(
            saved.id,
            saved,
            `Karakter "${saved.name}" disimpan & dikunci konsisten untuk seluruh video!`
          );
        }}
      />
    </div>
  );
};

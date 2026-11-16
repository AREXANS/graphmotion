import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Mic,
  ArrowUp,
  Upload,
  Play,
  Pause,
  Square,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sliders,
  Wind,
  Headphones,
  Waves,
  Check,
  Search,
  X,
  ExternalLink,
  Copy,
  CheckCheck,
  User,
  Camera,
} from 'lucide-react';
import { SatsetProject, CharacterOption } from '../types/satset';
import { soundEngine } from '../utils/audio-synth';
import {
  voiceStudio,
  VOICE_PROFILES,
  VOICE_CATEGORIES,
  VoiceProfile,
  DEFAULT_MALE_PROMPT,
  DEFAULT_FEMALE_PROMPT,
  SAMPLE_AUDIO_TEXT,
} from '../utils/voice-studio';
import {
  computePreciseSceneWordTimings,
  synchronizeProjectPipeline,
} from '../utils/pipeline-sync';
import { CHARACTER_CATALOG, getCharacterMeta } from '../utils/character-catalog';
import {
  CustomCharacterConfig,
  applyCharacterDesignPrompt,
  buildDeterministicCharacterFromPalette,
  createDefaultCustomCharacter,
  extractFrameAndPaletteFromMediaFile,
  normalizeAiPhotoCharacterResponse,
  saveCustomCharacter,
} from '../utils/custom-character';
import { CharacterAvatarCanvas } from './CharacterAvatarCanvas';
import { CharacterBuilderModal } from './CharacterBuilderModal';

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

  // Selected Voice state (default: Fenrir or project.voice_character)
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(() => {
    const raw = project.voice_character?.toLowerCase();
    const found = VOICE_PROFILES.find(
      (v) => v.id === raw || v.name.toLowerCase() === raw || v.geminiVoiceName.toLowerCase() === raw
    );
    return found ? found.id : 'fenrir';
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
  const [selectedModel, setSelectedModel] = useState<'Flash TTS' | 'Flash-Lite TTS'>(
    (project.tts_model?.includes('Flash-Lite') ? 'Flash-Lite TTS' : 'Flash TTS')
  );

  // Gaya bicara prompt
  const [gayaBicara, setGayaBicara] = useState<string>(() => {
    if (project.speech_style && project.speech_style.length > 20) {
      return project.speech_style;
    }
    return isFemaleVoice ? DEFAULT_FEMALE_PROMPT : DEFAULT_MALE_PROMPT;
  });

  // Keep prompt & project voice synced when user chooses a voice profile
  const handleSelectVoice = (voice: VoiceProfile) => {
    voiceStudio.stop();
    setIsPlayingSample(false);
    setActiveAuditionVoiceId(null);
    setSelectedVoiceId(voice.id);
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
  const [isAnalyzingCharMedia, setIsAnalyzingCharMedia] = useState(false);
  const charMediaInputRef = useRef<HTMLInputElement | null>(null);

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
    // Auto-sync voice gender if customChar or preset specifies male/female
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
      setToastMessage(toastLabel);
      setTimeout(() => setToastMessage(null), 3200);
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
        `Karakter narator konsisten dari ${extracted.mediaType === 'video' ? 'video' : 'foto'} berhasil diterapkan ke semua scene!`
      );
    } catch (err: any) {
      setToastMessage(err?.message || 'Gagal membaca file referensi karakter');
      setTimeout(() => setToastMessage(null), 3200);
    } finally {
      setIsAnalyzingCharMedia(false);
    }
  };

  const handleApplyNarratorPromptDesign = (overridePrompt?: string) => {
    const activePrompt = (typeof overridePrompt === 'string' ? overridePrompt : charDesignPrompt).trim();
    if (!activePrompt) return;
    const baseCfg =
      project.custom_character ||
      createDefaultCustomCharacter({
        name: `Narator ${selectedVoice.name}`,
        gender: isFemaleVoice ? 'cewek' : 'cowok',
      });
    const updated = applyCharacterDesignPrompt(activePrompt, baseCfg);
    const matchedVoiceForGender =
      updated.gender === 'cewek' && !isFemaleVoice
        ? VOICE_PROFILES.find((v) => v.gender === 'female') || selectedVoice
        : updated.gender === 'cowok' && isFemaleVoice
        ? VOICE_PROFILES.find((v) => v.gender === 'male') || selectedVoice
        : selectedVoice;
    const syncedName =
      !updated.name || updated.name.startsWith('Narator ')
        ? `Narator ${matchedVoiceForGender.name}`
        : updated.name;
    const finalized: CustomCharacterConfig = {
      ...updated,
      name: syncedName,
      id: updated.id.startsWith('custom_') ? updated.id : `custom_${Date.now().toString(36)}`,
      referenceMediaUrl: charRefPreviewUrl || updated.referenceMediaUrl,
      voicePresetId: matchedVoiceForGender.id,
      updatedAt: Date.now(),
    };
    saveCustomCharacter(finalized);
    applyConsistentNarratorCharacter(
      finalized.id,
      finalized,
      `Desain karakter "${finalized.name}" diterapkan konsisten di seluruh scene!`
    );
  };

  // Modals & Collapsibles
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceSearchQuery, setVoiceSearchQuery] = useState('');
  const [isNaskahExpanded, setIsNaskahExpanded] = useState(false);
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
    }, 2000);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAudioReady = Boolean(
    project.voice_audio_ready ||
      (project.scenes && project.scenes.some((s) => s.word_timings && s.word_timings.length > 0))
  );

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      voiceStudio.stop();
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

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

  // Full Narration Script as 8 lines
  const naskahLines: string[] = useMemo(() => {
    if (project.scenes && project.scenes.length > 0) {
      return project.scenes.map((s) => s.narration_text || s.voiceScript || '').filter(Boolean);
    }
    return [
      'Katanya orang sukses selalu bangun pagi, tapi kenapa membuka mata saja kadang terasa berat banget?',
      'Banyak yang mengira rasa malas pagi bakal hilang kalau kita nunggu mood dan semangat datang.',
      'Padahal, semangat bukan syarat untuk bergerak. Bergerak dulu, baru semangat menyusul!',
      'Bayangkan tubuhmu ditarik dua magnet: satu ke kasur, satu ke pekerjaanmu.',
      'Semakin lama kamu diam, tarikan kasur bakal makin kuat.',
      'Putuskan tarikan itu dalam dua menit pertama: cuci muka, buka laptop, dan selesaikan satu tugas sederhana.',
      'Nah, setelah mulai bergerak, biasanya pekerjaan terasa lebih ringan. Semangat bisa muncul setelah kamu mulai.',
      'Jadi besok, menangkan sepuluh menit pertamamu. Mulai dari hal kecil, dan jangan lupa follow!',
    ];
  }, [project.scenes]);

  // Copy style prompt
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(gayaBicara);
      soundEngine.playSfx('click');
      showToast('Disalin');
    } catch {
      // Fallback
      showToast('Disalin');
    }
  };

  // Copy script
  const handleCopyNaskah = async () => {
    try {
      const fullText = naskahLines.join('\n\n');
      await navigator.clipboard.writeText(fullText);
      soundEngine.playSfx('click');
      showToast('Disalin');
    } catch {
      showToast('Disalin');
    }
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

      // Single-request multi-scene synthesis (uses only 1 RPM, trims silence, measures exact scene durations)
      const batchResult = await voiceStudio.synthesizeBatchScenes(
        sceneTexts,
        selectedVoice.id,
        gayaBicara,
        selectedVoice.recommendedSpeed
      );

      // Calibrate scene durations and clause-aware word_timings locked to exact spoken audio duration
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

  // Toggle live microphone recording ("Membuat suara sendiri")
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

  // Play preview for a specific scene
  const handlePreviewSceneVoice = (text: string, idx: number) => {
    if (activePreviewSceneIdx === idx) {
      voiceStudio.stop();
      setActivePreviewSceneIdx(null);
      return;
    }

    voiceStudio.stop();
    setActivePreviewSceneIdx(idx);
    soundEngine.playSfx('click');

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
        setActivePreviewSceneIdx(null);
      },
    });
  };

  const fullNarrationRunIdRef = React.useRef<number>(0);
  const fullNarrationTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      fullNarrationRunIdRef.current++;
      if (fullNarrationTimerRef.current !== null) {
        clearTimeout(fullNarrationTimerRef.current);
        fullNarrationTimerRef.current = null;
      }
      if (recordTimerRef.current !== null) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      voiceStudio.stop();
    };
  }, []);

  // Play full narration sequentially (guarded against overlapping timer chains)
  const handlePlayFullNarration = () => {
    soundEngine.unlock();
    fullNarrationRunIdRef.current++;
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
    soundEngine.playSfx('whoosh');

    // If user uploaded/recorded a continuous narration track, play it straight through once
    const uploadedUrl = (project as any).voice_audio_url;
    if (uploadedUrl && String(uploadedUrl).startsWith('blob:')) {
      setActivePreviewSceneIdx(0);
      voiceStudio.playProjectAudioAtTime(uploadedUrl, 0, () => {
        if (runId !== fullNarrationRunIdRef.current) return;
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
        setIsPlayingFullNarration(false);
        setActivePreviewSceneIdx(null);
        return;
      }

      const scene = scenes[currentIdx] as any;
      setActivePreviewSceneIdx(currentIdx);
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
          fullNarrationTimerRef.current = window.setTimeout(playNext, 350);
        },
      });
    };

    playNext();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-20 relative" data-testid="voice-sound-studio">
      {/* Segmented Subtabs: [ Atur ] and [ Sinkron ] */}
      <div className="flex items-center justify-between gap-3">
        <div
          className={`inline-flex p-1 rounded-xl border ${
            isDark
              ? 'bg-[#041029] border-slate-800'
              : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={() => setSubTab('atur')}
            className={`px-5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              subTab === 'atur'
                ? 'bg-[#2563EB] text-white'
                : isDark
                  ? 'text-slate-400 hover:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Atur
          </button>
          <button
            type="button"
            onClick={() => setSubTab('sinkron')}
            className={`px-5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'sinkron'
                ? 'bg-[#2563EB] text-white'
                : isDark
                  ? 'text-slate-400 hover:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Sinkron</span>
            {isAudioReady && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={handleSkipVoice}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
            isDark
              ? 'bg-[#041029] border-slate-800 text-slate-300 hover:border-slate-700'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Lewat tanpa suara
        </button>
      </div>

      {/* SUBTAB 1: ATUR */}
      {subTab === 'atur' && (
        <div className="space-y-4">
          {/* Card 1: Pilih Suara Manusia (Human Voice Actor / Studio) */}
          <div
            className={`rounded-2xl p-5 border space-y-4 ${
              isDark
                ? 'bg-[#041029]/90 border-slate-800'
                : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  Pilihan Voice Over Manusia
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Suara narator manusia asli (bukan robot browser) yang sinkron dengan tiap adegan
                </p>
              </div>
            </div>

            {/* Suara Field: Opens Modal */}
            <div className="space-y-2">
              <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Suara Narator
              </label>
              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(true)}
                className={`w-full text-left border rounded-xl px-4 py-3 transition cursor-pointer flex items-center justify-between ${
                  isDark
                    ? 'bg-[#020817] border-slate-800 hover:border-blue-500/50 text-slate-100'
                    : 'bg-slate-50 border-slate-200 hover:border-blue-400 text-slate-900'
                }`}
              >
                <div>
                  <div className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {selectedVoice.name}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {selectedVoice.subLabel}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleSample}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer select-none ${
                    isPlayingSample
                      ? 'border-[#2563EB] bg-[#2563EB] text-white'
                      : isDark
                        ? 'border-slate-800 bg-[#020817] hover:border-slate-700 text-slate-200'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {isPlayingSample ? (
                    <>
                      <Square className="w-3 h-3 fill-current" />
                      <span>Hentikan contoh</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                      <span>Dengar contoh {selectedVoice.name}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Gaya bicara */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>Gaya bicara</span>
                  <span className="text-slate-500">·</span>
                  <button
                    type="button"
                    onClick={handleResetPrompt}
                    className="text-blue-500 hover:underline font-semibold cursor-pointer transition"
                  >
                    reset
                  </button>
                </div>
              </div>
              <textarea
                rows={3}
                value={gayaBicara}
                onChange={(e) => setGayaBicara(e.target.value)}
                className={`w-full border rounded-xl p-3 text-xs leading-relaxed focus:outline-none focus:border-blue-500 transition resize-none ${
                  isDark
                    ? 'bg-[#020817] border-slate-800 text-slate-200'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>

            {/* Action Button: Generate suara [VoiceName] */}
            <div>
              <button
                type="button"
                onClick={handleGenerateVoice}
                disabled={isGenerating}
                className="w-full py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>
                  {isGenerating
                    ? `Memproses suara ${selectedVoice.name}... ${generateProgress}%`
                    : `Gunakan suara ${selectedVoice.name}`}
                </span>
              </button>
            </div>
          </div>

          {/* Card 1B: Karakter Narator & Visual Konsisten (Pilihan / Desain Sendiri / Referensi Foto & Video) */}
          <div
            data-testid="voice-narrator-character-card"
            className={`rounded-2xl p-5 border space-y-4 ${
              isDark
                ? 'bg-[#041029]/90 border-sky-400/25'
                : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-sky-400 mb-0.5">
                  <Waves className="w-3.5 h-3.5" />
                  <span>Aktor Voice Over · Konsisten di Semua Scene</span>
                </div>
                <h3 className={`font-bold text-sm sm:text-base ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  Karakter Narator Visual (Pilih, Desain Sendiri, atau dari Foto/Video)
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Pilih karakter narator, kustomisasi lewat prompt/studio, atau kirim referensi foto/video untuk dijadikan karakter konsisten sepanjang video.
                </p>
              </div>

              <button
                type="button"
                data-testid="voice-open-char-builder-btn"
                onClick={() => {
                  soundEngine.playSfx('tap');
                  setIsCharBuilderOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-sky-500/15 border border-sky-400/40 hover:bg-sky-500/25 text-sky-300 text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                <User className="w-3.5 h-3.5" />
                <span>Edit Karakter Lengkap</span>
              </button>
            </div>

            <input
              ref={charMediaInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleUploadNarratorReferenceMedia}
              className="hidden"
              data-testid="voice-narrator-reference-input"
            />

            {/* Live Stage + Reference Media & Design Controls */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
              {/* Left: Live Animated Character Preview */}
              <div
                className={`md:col-span-4 rounded-2xl p-3.5 border flex flex-col items-center justify-between gap-2 ${
                  isDark ? 'bg-[#020817] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <CharacterAvatarCanvas
                    characterId={activeCharacterMeta.id}
                    pose={isPlayingSample ? 'point' : 'wave'}
                    viewMode={project.character_framing || 'full'}
                    dimension={project.character_dimension || '3d'}
                    animated={true}
                    size={112}
                    darkBg={isDark}
                    customCharacter={project.custom_character}
                  />
                  {charRefPreviewUrl && (
                    <img
                      src={charRefPreviewUrl}
                      alt="Referensi Narator"
                      className="absolute -bottom-1 -right-2 w-10 h-10 rounded-xl object-cover border-2 border-sky-400 shadow-md"
                      title="Media referensi karakter aktif"
                    />
                  )}
                </div>
                <div className="text-center">
                  <div className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {activeCharacterMeta.name}
                  </div>
                  <div className={`text-[11px] line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {activeCharacterMeta.description}
                  </div>
                </div>
                <div
                  className={`inline-flex items-center gap-1 p-1 rounded-xl border ${
                    isDark ? 'bg-[#041029] border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
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
                        data-testid={`voice-dimension-${dim.id}`}
                        onClick={() => {
                          soundEngine.playSfx('tap');
                          onUpdateProject({
                            ...project,
                            character_dimension: dim.id,
                          });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer whitespace-nowrap shrink-0 ${
                          activeDim === dim.id
                            ? 'bg-[#2563EB] text-white shadow-xs'
                            : isDark
                              ? 'text-slate-400 hover:text-slate-100'
                              : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {dim.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Preset Chips + Reference Photo/Video Upload + Custom Prompt */}
              <div className="md:col-span-8 flex flex-col justify-between space-y-3.5">
                {/* Quick Preset Selector */}
                <div className="space-y-1.5">
                  <label className={`block text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Pilih Cepat Karakter Narator
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CHARACTER_CATALOG.filter((c) =>
                      [
                        'auto',
                        'kreator_3d_studio',
                        'kreator_3d_headphone',
                        'cowok_modis',
                        'cowok_kantoran',
                        'cowok_santai',
                        'cewek_berhijab',
                        'cewek_modis',
                        'cewek_mandiri',
                        'stickman_samping',
                        'none',
                      ].includes(c.id)
                    ).map((item) => {
                      const isActive =
                        (project.character || 'auto') === item.id &&
                        !String(project.character || '').startsWith('custom_');
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-testid={`voice-narrator-preset-${item.id}`}
                          onClick={() => applyConsistentNarratorCharacter(item.id, undefined, `Karakter narator diubah ke ${item.name}`)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            isActive
                              ? 'bg-[#2563EB] border-sky-400 text-white shadow-xs'
                              : isDark
                                ? 'bg-[#020817] border-slate-800 text-slate-300 hover:border-sky-400/50'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-400'
                          }`}
                        >
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Design / Prompt Input */}
                <div className="space-y-1.5">
                  <label className={`block text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Desain Sendiri / Instruksi Edit Karakter AI (Manusia / Humanoid)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={charDesignPrompt}
                      onChange={(e) => setCharDesignPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyNarratorPromptDesign();
                        }
                      }}
                      placeholder="Contoh: humanoid rubah biru berpakaian modern dan aksesoris kacamata..."
                      data-testid="voice-narrator-design-input"
                      className={`flex-1 rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-blue-500 ${
                        isDark
                          ? 'bg-[#020817] border-slate-800 text-slate-100 placeholder:text-slate-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyNarratorPromptDesign()}
                      data-testid="voice-narrator-apply-design-btn"
                      className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-extrabold transition cursor-pointer shrink-0"
                    >
                      Terapkan Desain
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {[
                      'humanoid rubah biru berpakaian modern dan aksesoris kacamata',
                      'humanoid kucing oranye pakai hoodie modern dan headphone',
                      'cowok berkacamata kotak pakai jaket modern',
                    ].map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => {
                          setCharDesignPrompt(sample);
                          handleApplyNarratorPromptDesign(sample);
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition cursor-pointer ${
                          isDark
                            ? 'bg-[#020817] border-slate-800 text-sky-300 hover:border-sky-400/50'
                            : 'bg-slate-50 border-slate-200 text-blue-700 hover:bg-blue-50'
                        }`}
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Photo / Video Reference */}
                <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                  <button
                    type="button"
                    disabled={isAnalyzingCharMedia}
                    onClick={() => charMediaInputRef.current?.click()}
                    data-testid="voice-narrator-upload-ref-btn"
                    className={`px-3.5 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-2 transition cursor-pointer ${
                      isDark
                        ? 'bg-[#071636] border-sky-400/35 hover:border-sky-300 text-sky-200'
                        : 'bg-sky-50 border-blue-200 hover:border-blue-400 text-blue-700'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 text-sky-400" />
                    <span>
                      {isAnalyzingCharMedia
                        ? 'Mengekstrak Karakter dari Media...'
                        : 'Upload Foto / Video Referensi Karakter'}
                    </span>
                  </button>
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Otomatis diedit jadi karakter konsisten di semua scene
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Buat / Rekam / Upload Suara Sendiri */}
          <div
            className={`rounded-2xl p-5 border space-y-4 ${
              isDark
                ? 'bg-[#041029]/90 border-slate-800'
                : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  Buat atau Upload Suara Sendiri
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Rekam langsung suara kamu lewat mikrofon atau unggah file rekaman MP3, WAV, M4A, MP4
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNaskahExpanded(!isNaskahExpanded)}
                className="text-xs font-semibold text-blue-500 hover:underline cursor-pointer"
              >
                {isNaskahExpanded ? 'Tutup teks naskah' : `Baca teks (${naskahLines.length} scene)`}
              </button>
            </div>

            {isNaskahExpanded && (
              <div
                className={`p-3.5 rounded-xl border space-y-2 text-xs leading-relaxed ${
                  isDark
                    ? 'bg-[#020817] border-slate-800 text-slate-200'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/40">
                  <span className="font-semibold text-slate-400">Naskah untuk dibaca saat merekam:</span>
                  <button
                    type="button"
                    onClick={handleCopyNaskah}
                    className="inline-flex items-center gap-1 text-blue-500 font-semibold hover:underline cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Salin naskah</span>
                  </button>
                </div>
                {naskahLines.map((line, idx) => (
                  <p key={idx} className="pb-1 border-b border-slate-800/30 last:border-none last:pb-0">
                    <span className="font-mono text-[10px] text-blue-400 mr-1.5">#{idx + 1}</span>
                    {line}
                  </p>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/mp4"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Rekam langsung dari mikrofon */}
              <button
                type="button"
                onClick={handleToggleRecord}
                data-testid="record-own-voice-btn"
                className={`p-4 rounded-xl border text-left transition cursor-pointer flex items-center gap-3 ${
                  isRecording
                    ? 'bg-rose-500/15 border-rose-500/50 text-rose-200'
                    : isDark
                      ? 'bg-[#020817] border-slate-800 hover:border-blue-500/50 text-slate-100'
                      : 'bg-slate-50 border-slate-200 hover:border-blue-400 text-slate-900'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isRecording ? 'bg-rose-600 text-white animate-pulse' : 'bg-[#2563EB] text-white'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold">
                    {isRecording ? `Merekam... (${recordSeconds} dtk) · Klik Selesai` : 'Rekam Suara Sendiri'}
                  </div>
                  <div className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {isRecording ? 'Klik lagi untuk menyimpan rekaman' : 'Gunakan mikrofon perangkat kamu'}
                  </div>
                </div>
              </button>

              {/* Upload file audio/video */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                data-testid="upload-own-voice-btn"
                className={`p-4 rounded-xl border text-left transition cursor-pointer flex items-center gap-3 ${
                  isDark
                    ? 'bg-[#020817] border-slate-800 hover:border-blue-500/50 text-slate-100'
                    : 'bg-slate-50 border-slate-200 hover:border-blue-400 text-slate-900'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-sky-400 flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold">Upload File Suara / Video</div>
                  <div className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Format MP3, WAV, M4A, OGG, MP4
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* SUBTAB 2: SINKRON */}
      {/* ========================================================== */}
      {subTab === 'sinkron' && (
        <div className="space-y-4">
          {!isAudioReady ? (
            /* Empty state */
            <div
              className={`rounded-2xl p-10 sm:p-14 border text-center space-y-2 ${
                isDark
                  ? 'bg-[#041029]/95 border-blue-500/20 text-slate-100'
                  : 'bg-white border-sky-200/80 text-slate-900 shadow-xs'
              }`}
            >
              <h3 className="font-black text-base sm:text-lg">
                Belum ada suara
              </h3>
              <p className={`text-xs max-w-sm mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Generate dengan Gemini atau upload file audio di tab Atur. Suara akan dipotong otomatis per scene di sini.
              </p>
            </div>
          ) : (
            /* Synchronized Audio Player */
            <div className="space-y-4">
              <div
                className={`rounded-2xl p-5 sm:p-6 border space-y-4 ${
                  isDark
                    ? 'bg-[#041029]/95 border-blue-500/20 shadow-[0_20px_50px_rgba(2,8,23,0.65)]'
                    : 'bg-white border-sky-200/80 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-extrabold text-sm sm:text-base ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        Suara Narator Alami
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                        Sinkron Siap
                      </span>
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {selectedVoice.name} ({selectedVoice.subLabel}) · Bahasa Indonesia
                    </p>
                  </div>
                  <button
                    onClick={() => setSubTab('atur')}
                    className="flex items-center gap-1 text-xs font-bold text-sky-400 hover:underline cursor-pointer"
                  >
                    <span>Ganti suara</span>
                  </button>
                </div>

                {/* Audio controls row with Play button & Scrubbar */}
                <div
                  className={`rounded-xl p-4 border space-y-3 ${
                    isDark
                      ? 'bg-[#020817]/90 border-blue-500/25'
                      : 'bg-sky-50/60 border-sky-200/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handlePlayFullNarration}
                      className="w-11 h-11 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center justify-center shadow-md shadow-blue-600/25 shrink-0 transition active:scale-95 cursor-pointer"
                    >
                      {isPlayingFullNarration ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs font-mono font-bold mb-1.5 tabular-nums">
                        <span className="text-sky-400">
                          {isPlayingFullNarration
                            ? `Scene ${(activePreviewSceneIdx !== null ? activePreviewSceneIdx + 1 : 1)}`
                            : '0:00'}
                        </span>
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                          Total: {(project.scenes || []).reduce((acc, s) => acc + (s.target_duration_sec || 5), 0).toFixed(1)}s
                        </span>
                      </div>
                      <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-sky-200'}`}>
                        <div
                          className="bg-[#2563EB] h-full transition-all duration-300"
                          style={{
                            width: isPlayingFullNarration
                              ? `${Math.min(100, (((activePreviewSceneIdx || 0) + 1) / (project.scenes.length || 1)) * 100)}%`
                              : isPlayingSample
                              ? '35%'
                              : '0%',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Waveform Graphic */}
                  <div
                    className={`h-14 w-full rounded-xl p-2 border flex items-center justify-between gap-1 overflow-hidden ${
                      isDark
                        ? 'bg-[#041029] border-blue-500/20'
                        : 'bg-white border-sky-200/80'
                    }`}
                  >
                    {Array.from({ length: 48 }).map((_, i) => {
                      const isActive = isPlayingFullNarration || isPlayingSample || activePreviewSceneIdx !== null;
                      const h = isActive
                        ? Math.sin(i * 0.45 + Date.now() * 0.003) * 16 + Math.cos(i * 0.8) * 12 + 22
                        : Math.sin(i * 0.4) * 14 + 18;
                      const isMarker = i % 8 === 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center justify-center h-full">
                          <div
                            style={{ height: `${Math.max(6, Math.min(44, h))}px` }}
                            className={`w-1 rounded-full transition-all duration-100 ${
                              isMarker
                                ? 'bg-sky-400'
                                : isActive
                                ? 'bg-blue-500'
                                : isDark
                                ? 'bg-blue-500/30'
                                : 'bg-sky-300'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className={`flex items-center justify-between text-[11px] pt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span>Durasi scene & timestamp kata otomatis pas dengan nafas & tempo ({project.tempo === 'santai' ? 'Santai' : 'Energik'})</span>
                    <button
                      type="button"
                      onClick={handlePlayFullNarration}
                      className="font-bold text-sky-400 hover:underline cursor-pointer"
                    >
                      {isPlayingFullNarration ? 'Hentikan Putar' : '▶ Putar Seluruh Narasi'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleGenerateVoice}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                      isDark
                        ? 'bg-[#020817] border-blue-500/25 text-slate-200 hover:border-sky-400/50'
                        : 'bg-sky-50 border-sky-200 text-slate-700 hover:bg-sky-100'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Sinkron ulang</span>
                  </button>

                  <button
                    onClick={() => onNextToAnimation()}
                    className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-extrabold hover:bg-[#1D4ED8] shadow-md shadow-blue-600/20 transition active:scale-95 cursor-pointer"
                  >
                    <span>Lanjutkan ke Animasi ➔</span>
                  </button>
                </div>
              </div>

              {/* Per-scene alignment list with word-level timing verification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {project.scenes?.map((scene, idx) => {
                  const text = scene.narration_text || scene.voiceScript || '';
                  const isActive = activePreviewSceneIdx === idx;
                  const dur = scene.target_duration_sec || scene.durationSeconds || 5;
                  const timings =
                    Array.isArray(scene.word_timings) && scene.word_timings.length > 0
                      ? scene.word_timings
                      : computePreciseSceneWordTimings(
                          text,
                          scene.emphasis_words || scene.emphasisWords || [],
                          project.tempo === 'santai' ? 'santai' : 'energik',
                          dur
                        ).wordTimings;

                  return (
                    <div
                      key={scene.id || idx}
                      className={`p-4 rounded-2xl border transition ${
                        isActive
                          ? isDark
                            ? 'border-sky-400 bg-blue-950/60'
                            : 'border-blue-500 bg-sky-50/90'
                          : isDark
                            ? 'border-blue-500/20 bg-[#041029]/90 hover:border-blue-500/40'
                            : 'border-sky-200/80 bg-white hover:border-sky-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs tabular-nums">
                          <span className="font-mono font-bold text-sky-400 bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded-md">
                            Scene {idx + 1}
                          </span>
                          <span className={`font-mono font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {dur}s · {timings.length} kata
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePreviewSceneVoice(text, idx)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            isActive
                              ? 'bg-[#2563EB] text-white'
                              : isDark
                                ? 'bg-[#020817] border border-blue-500/25 text-sky-300 hover:bg-blue-950'
                                : 'bg-sky-50 border border-sky-200 text-blue-700 hover:bg-sky-100'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <Pause className="w-3 h-3 fill-current" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current ml-0.5" />
                              <span>Dengar</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                        "{text}"
                      </p>
                      {timings.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-blue-500/15 flex flex-wrap gap-1 tabular-nums">
                          {timings.slice(0, 8).map((wt, wIdx) => (
                            <span
                              key={wIdx}
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                wt.isEmphasis
                                  ? 'bg-[#2563EB]/25 text-sky-300 border border-sky-400/30 font-bold'
                                  : isDark
                                    ? 'bg-[#020817] text-slate-400'
                                    : 'bg-sky-50 text-slate-600'
                              }`}
                            >
                              {wt.word} ({wt.startSec.toFixed(1)}s)
                            </span>
                          ))}
                          {timings.length > 8 && (
                            <span className="text-[10px] font-mono text-slate-400 px-1 py-0.5">
                              +{timings.length - 8} kata
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: "Pilih..." VOICE PICKER */}
      {/* ========================================================== */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl border overflow-hidden ${
              isDark
                ? 'bg-[#041029] border-blue-500/30 text-slate-100'
                : 'bg-white border-sky-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-blue-500/20 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-base">
                Pilih Karakter Suara Gemini
              </h3>
              <button
                type="button"
                onClick={() => {
                  voiceStudio.stop();
                  setActiveAuditionVoiceId(null);
                  setIsVoiceModalOpen(false);
                }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
                  isDark
                    ? 'bg-[#020817] text-slate-400 hover:text-white'
                    : 'bg-sky-50 text-slate-500 hover:text-slate-900'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-3 border-b border-blue-500/15 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={voiceSearchQuery}
                  onChange={(e) => setVoiceSearchQuery(e.target.value)}
                  placeholder="Cari karakter suara..."
                  className={`w-full border rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-sky-400 ${
                    isDark
                      ? 'bg-[#020817] border-blue-500/25 text-slate-100 placeholder-slate-500'
                      : 'bg-sky-50/50 border-sky-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            {/* Voice List with Categories */}
            <div className="overflow-y-auto flex-1 p-2 space-y-4">
              {filteredVoicesByCategory.map((category) => {
                if (category.items.length === 0) return null;
                return (
                  <div key={category.id} className="space-y-1">
                    <div className="px-3 py-1 font-mono text-[10px] font-bold tracking-wider text-sky-400 uppercase">
                      {category.label}
                    </div>

                    <div className="space-y-1">
                      {category.items.map((voice) => {
                        const isSelected = selectedVoice.id === voice.id;
                        const isAuditioning = activeAuditionVoiceId === voice.id;

                        return (
                          <div
                            key={voice.id}
                            onClick={() => handleSelectVoice(voice)}
                            className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition cursor-pointer border ${
                              isSelected || isAuditioning
                                ? isDark
                                  ? 'bg-blue-950/80 border-sky-400/40 text-white'
                                  : 'bg-sky-50 border-blue-400 text-slate-900'
                                : isDark
                                  ? 'border-transparent hover:bg-[#020817]/70 text-slate-200'
                                  : 'border-transparent hover:bg-sky-50/50 text-slate-800'
                            }`}
                          >
                            <div className="flex-1 pr-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-xs sm:text-sm">
                                  {voice.name}
                                </span>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-sky-400 stroke-[2.5]" />
                                )}
                              </div>
                              <div className={`text-[11px] leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {voice.subLabel}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleAuditionVoiceInModal(e, voice)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition cursor-pointer active:scale-95 ${
                                isAuditioning
                                  ? 'bg-[#2563EB] text-white'
                                  : isDark
                                    ? 'border border-blue-500/30 bg-[#020817] text-sky-300 hover:border-sky-400'
                                    : 'border border-sky-200 bg-white text-blue-600 hover:border-blue-400'
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
          <div className="bg-[#041029] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-1.5 border border-sky-400/40">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* FULL CHARACTER BUILDER MODAL (Accessible directly from Voice Over Studio) */}
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

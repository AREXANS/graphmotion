import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  Send,
  Camera,
  RotateCcw,
  Play,
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
  Pencil,
  Film,
  Plus,
  Trash2,
  AlertTriangle,
  Sliders,
  Code2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { type CustomStyleDefinition } from '../types/custom-style.ts';
import {
  type ReferenceFrameBuffer,
  type VisualReferenceAnalysis,
  SAMPLE_TACTILE_PAPERCRAFT_CODE,
  analyzeCanvasFramesForStyle,
  buildCustomStylePrompt,
  buildCustomStyleRepairPrompt,
  generateCustomStyleCodeFromAnalysis,
  parseCustomStyleCode,
  saveCustomStyleToStorage,
} from '../utils/custom-style-parser.ts';
import {
  renderSatsetStyleLiveDemoFrame,
  getSatsetStyleDemoSfxTimeline,
  SATSET_CAPTION_MODES,
} from '../utils/custom-style-runtime.ts';
import { soundEngine } from '../utils/audio-synth.ts';
import {
  type AiPlatformId,
  type PromptMediaAttachment,
  AI_PLATFORMS,
  dispatchPromptToAiPlatform,
  enrichPromptWithMedia,
  readClipboardOrFallbackText,
} from '../utils/ai-platform-router.ts';

interface CustomStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveStyle: (style: CustomStyleDefinition) => void;
  initialStyle?: CustomStyleDefinition | null;
}

type CreationMode = 'tulis' | 'foto' | 'video';

const PRESET_EXAMPLES = [
  {
    name: 'Tactile Papercraft Lab',
    prompt:
      'Gaya animasi edukasi papercraft & kolase guntingan kertas berlapis (shadow-box diorama) yang hangat, bersih, dan taktil: alas potong meja kerja hijau gelap (#1E2D29), kertas krem gading (#F7F1E3), kertas kraft cokelat (#D4B483), kertas origami koral (#E05A47), kertas toska (#2A8C82), kuning oker (#E9B44C), dan karton biru malam (#152238). Ciri khas wajib: setiap potongan kertas punya bayangan jatuh nyata (+6px, +8px gelap transparan), tepi organik tipis (wobble: 0.4-0.6), tepi sobekan bergerigi, garis lipatan putus-putus, dan selotip kertas (masking tape) miring di sudut kartu. Memainkan kamera virtual dinamis dengan foley suara kertas autentik (paper_slide, paper_fold, paper_rip, paper_crumple, paper_snip, paper_pop, paper_slap).',
    sampleCode: SAMPLE_TACTILE_PAPERCRAFT_CODE,
  },
  {
    name: 'Tanah liat',
    prompt:
      'Stop-motion tanah liat (claymation): objek 3D gemuk dan membulat dengan permukaan sedikit mengilap, cahaya studio hangat, warna terakota, krem, dan hijau zaitun. Satu objek besar di tengah, sudut 3/4. Gerakan patah-patah seperti 12fps dan memantul saat mendarat.',
  },
  {
    name: 'Sketsa pensil',
    prompt:
      'Sketsa pensil grafit di atas kertas krem bertekstur: garis tangan arsir kasar ekspresif dengan bayangan silang (cross-hatching), warna hitam arang, abu-abu grafit, dan aksen merah marun. Satu objek utama digambar bertahap seolah sedang dibuat langsung.',
  },
  {
    name: 'Cyberpunk',
    prompt:
      'Antarmuka HUD futuristik cyberpunk 3D: objek silinder dan layar hologram melayang dengan tepi menyala neon cyan (#00E5FF) dan magenta (#FF2A85) di atas latar biru gelap pekat. Gerakan presisi cepat dengan kilatan garis scan data.',
  },
  {
    name: 'Kartun anak',
    prompt:
      'Ilustrasi buku cerita anak 2D ceria: bentuk membulat lembut dengan garis tepi tebal rapi, warna kuning matahari, biru langit, dan merah koral hangat. Objek memantul lentur (squash and stretch) dengan bintang dan titik-titik kecil di sekelilingnya.',
  },
];

const AI_TARGETS: AiPlatformId[] = ['claude', 'chatgpt', 'gemini'];

export const CustomStyleModal: React.FC<CustomStyleModalProps> = ({
  isOpen,
  onClose,
  onSaveStyle,
  initialStyle,
}) => {
  const [activeMode, setActiveMode] = useState<CreationMode>('tulis');
  const [styleName, setStyleName] = useState<string>(initialStyle?.name || '');
  const [stylePrompt, setStylePrompt] = useState<string>(initialStyle?.prompt || '');
  const [pastedCode, setPastedCode] = useState<string>(initialStyle?.rawCode || '');

  // Collapsible sections & modals matching reference video
  const [isClaudeSectionOpen, setIsClaudeSectionOpen] = useState<boolean>(true);
  const [isLimitSectionOpen, setIsLimitSectionOpen] = useState<boolean>(false);
  const [showFormatErrorModal, setShowFormatErrorModal] = useState<boolean>(false);
  const [showErrorDetailsInModal, setShowErrorDetailsInModal] = useState<boolean>(false);
  const [persistedParseErrors, setPersistedParseErrors] = useState<string[]>([]);
  const [lastInvalidText, setLastInvalidText] = useState<string>('');

  // Copy / toast / tutorial bubble states
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [copiedRepair, setCopiedRepair] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [tutorialBubbleStep, setTutorialBubbleStep] = useState<'send' | 'paste' | 'none'>('send');

  // AI target selector for split button "Kirim ke AI | v"
  const [selectedAiTarget, setSelectedAiTarget] = useState<AiPlatformId>('claude');
  const [showAiDropdown, setShowAiDropdown] = useState<boolean>(false);

  // Native paste floating pill + blue caret teardrop
  const [showNativePastePopup, setShowNativePastePopup] = useState<boolean>(false);
  const [isTextareaFocused, setIsTextareaFocused] = useState<boolean>(false);

  // Photo & Video mode states
  const [refImages, setRefImages] = useState<PromptMediaAttachment[]>([]);
  const [isAnalyzingPhotos, setIsAnalyzingPhotos] = useState<boolean>(false);
  const [videoFile, setVideoFile] = useState<{ name: string; url: string; durationSec: number } | null>(null);
  const [videoFrames, setVideoFrames] = useState<ReferenceFrameBuffer[]>([]);
  const [isGeneratingFromVideo, setIsGeneratingFromVideo] = useState<boolean>(false);
  const [refAnalysis, setRefAnalysis] = useState<VisualReferenceAnalysis | null>(null);

  // Live preview player state when valid code is parsed
  const [activePreviewChapter, setActivePreviewChapter] = useState<number>(1);
  const [previewPlaying, setPreviewPlaying] = useState<boolean>(true);
  const [previewSoundOn, setPreviewSoundOn] = useState<boolean>(true);
  const [customCaptionOverride, setCustomCaptionOverride] = useState<string>('');
  const [customRatio, setCustomRatio] = useState<'9:16' | '1:1' | '3:4' | '16:9'>(
    initialStyle?.preferredRatio || '9:16'
  );
  const [customSafeScale, setCustomSafeScale] = useState<number>(
    initialStyle?.safeScale ?? 0.92
  );

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const refImgInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const pasteTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const firedModalSfxRef = useRef<Set<string>>(new Set());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2400);
  };

  // Sync state when opening modal
  useEffect(() => {
    if (!isOpen) return;
    setActiveMode('tulis');
    if (initialStyle) {
      setStyleName(initialStyle.name || '');
      setStylePrompt(initialStyle.prompt || '');
      setPastedCode(initialStyle.rawCode || '');
      setCustomRatio(initialStyle.preferredRatio || '9:16');
      setCustomSafeScale(initialStyle.safeScale ?? 0.92);
    } else {
      setStyleName('');
      setStylePrompt('');
      setPastedCode('');
      setCustomRatio('9:16');
      setCustomSafeScale(0.92);
    }
    setRefAnalysis(null);
    setVideoFrames([]);
    setPersistedParseErrors([]);
    setLastInvalidText('');
    setShowFormatErrorModal(false);
    setShowErrorDetailsInModal(false);
    setCopiedPrompt(false);
    setCopiedRepair(false);
    setTutorialBubbleStep('send');
    setIsClaudeSectionOpen(true);
    setIsLimitSectionOpen(false);
    setShowAiDropdown(false);
    setShowNativePastePopup(false);
    setActivePreviewChapter(1);
  }, [isOpen, initialStyle]);

  // Switch collapsible default when changing creation mode (matches video: collapsed on Dari video)
  const handleSelectMode = (mode: CreationMode) => {
    setActiveMode(mode);
    if (mode === 'video') {
      setIsClaudeSectionOpen(false);
    } else {
      setIsClaudeSectionOpen(true);
    }
  };

  // In the video (f_13_ready.png), filling either the prompt (e.g. clicking a chip) or the name activates Step 1 & Step 2
  const isReadyForAi = Boolean(stylePrompt.trim() || styleName.trim() || refAnalysis);

  // Parse pasted code continuously
  const parseResult = useMemo(() => {
    return parseCustomStyleCode(pastedCode);
  }, [pastedCode]);

  const parsedStyle = parseResult.style;

  // Effective errors to display (either live from non-empty pastedCode or persisted after "Kosongkan")
  const activeErrors = useMemo(() => {
    if (pastedCode.trim()) {
      return parseResult.isValid ? [] : parseResult.errors;
    }
    return persistedParseErrors;
  }, [pastedCode, parseResult, persistedParseErrors]);

  const hasErrorState = activeErrors.length > 0 && !parseResult.isValid;

  // Build the exact custom style prompt (starts with truncation guard & ends with === AKHIR PERINTAH ===)
  const promptToSend = useMemo(() => {
    if (!styleName.trim() && !stylePrompt.trim() && !refAnalysis) {
      return '';
    }
    const base = buildCustomStylePrompt(styleName.trim(), stylePrompt.trim(), refAnalysis);
    return enrichPromptWithMedia(base, refImages);
  }, [styleName, stylePrompt, refAnalysis, refImages]);

  // Build the repair prompt when AI response has invalid format
  const repairPromptText = useMemo(() => {
    return buildCustomStyleRepairPrompt(pastedCode || lastInvalidText, activeErrors);
  }, [pastedCode, lastInvalidText, activeErrors]);

  // Dynamic tag detector ("Terbaca sebagai: objek 3D , mengilap ...")
  const detectedStyleTags = useMemo(() => {
    const positivePrompt = stylePrompt.split(/hindari|jangan|dilarang/i)[0] || '';
    const text = `${styleName} ${positivePrompt}`.toLowerCase();
    const is3D =
      text.includes('3d') ||
      text.includes('balok') ||
      text.includes('silinder') ||
      text.includes('bola') ||
      text.includes('dimensi') ||
      text.includes('clay') ||
      text.includes('tanah liat') ||
      text.includes('isometrik') ||
      text.includes('diorama') ||
      (!text.includes('2d') && refAnalysis?.look === '3d');
    const isGlow =
      text.includes('glow') ||
      text.includes('neon') ||
      text.includes('cahaya') ||
      text.includes('menyala') ||
      text.includes('cyber') ||
      refAnalysis?.finish === 'glow';
    const isScribble =
      text.includes('sketsa') ||
      text.includes('coretan') ||
      text.includes('scribble') ||
      text.includes('pensil') ||
      text.includes('tangan') ||
      text.includes('arsir') ||
      text.includes('kapur') ||
      refAnalysis?.finish === 'scribble';
    const isGlossy =
      text.includes('glossy') ||
      text.includes('mengilap') ||
      text.includes('kaca') ||
      text.includes('glass') ||
      text.includes('kilap') ||
      refAnalysis?.finish === 'glossy';

    const look = is3D ? 'objek 3D' : '2D';
    let finish = 'datar';
    if (isGlossy) finish = 'mengilap';
    else if (isGlow) finish = 'neon';
    else if (isScribble) finish = 'sketsa';

    return { look, finish };
  }, [styleName, stylePrompt, refAnalysis]);

  // Copy main style prompt
  const handleCopyStylePrompt = async () => {
    if (!promptToSend) return;
    try {
      await navigator.clipboard.writeText(promptToSend);
    } catch {
      // ignore fallback
    }
    setCopiedPrompt(true);
    setTutorialBubbleStep('paste');
    showToast('Disalin');
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  // Copy repair prompt ("Salin perbaikan" / "Salin perbaikan untuk AI")
  const handleCopyRepairPrompt = async () => {
    try {
      await navigator.clipboard.writeText(repairPromptText);
    } catch {
      // ignore fallback
    }
    setCopiedRepair(true);
    showToast('Disalin');
    setTimeout(() => setCopiedRepair(false), 2500);
  };

  // Dispatch directly to the selected AI platform (Claude / ChatGPT / Gemini) with prompt in URL + clipboard
  const handleSendToAiDirect = async (targetOverride?: AiPlatformId) => {
    if (!promptToSend) return;
    const target = targetOverride || selectedAiTarget;
    const platformObj = AI_PLATFORMS.find((p) => p.id === target) || AI_PLATFORMS[0];
    soundEngine.playSfx('click');
    setTutorialBubbleStep('paste');
    setShowAiDropdown(false);
    dispatchPromptToAiPlatform(target, promptToSend);
    showToast(`Prompt disalin & membuka ${platformObj.name}`);
  };

  // Evaluate pasted text and trigger error modal if invalid
  const evaluatePastedText = (text: string) => {
    setPastedCode(text);
    setShowNativePastePopup(false);
    setTutorialBubbleStep('none');

    if (!text.trim()) {
      return;
    }

    const res = parseCustomStyleCode(text);
    if (res.isValid && res.style) {
      setPersistedParseErrors([]);
      setLastInvalidText('');
      activePreviewChapterRef.current = 1;
      setActivePreviewChapter(1);
      if (res.style.name && !styleName.trim()) setStyleName(res.style.name);
      if (res.style.prompt && !stylePrompt.trim()) setStylePrompt(res.style.prompt);
      soundEngine.playSfx('ding');
      showToast('Gaya berhasil diproses!');
    } else {
      setPersistedParseErrors(res.errors);
      setLastInvalidText(text);
      setShowFormatErrorModal(true);
    }
  };

  // Read from clipboard when user taps "Tempel" pill or dropzone
  const handlePasteFromClipboard = async () => {
    setShowNativePastePopup(false);
    const clipText = await readClipboardOrFallbackText();
    if (clipText && clipText.trim()) {
      evaluatePastedText(clipText);
      return;
    }
    pasteTextareaRef.current?.focus();
  };

  // Clear textarea ("Kosongkan") while keeping error banner & repair button visible (matches f_37_foto_api.png)
  const handleClearPastedCode = () => {
    if (pastedCode.trim() && !parseResult.isValid) {
      setPersistedParseErrors(parseResult.errors);
      setLastInvalidText(pastedCode);
    }
    setPastedCode('');
    setShowNativePastePopup(false);
  };

  // Core helper to analyze uploaded reference photos with immediate deep canvas detection + background AI Vision refinement
  const runPhotoReferenceDetection = async (
    targetImages: PromptMediaAttachment[],
    alsoGenerateAnimationCode: boolean
  ) => {
    if (targetImages.length === 0) return;
    setIsAnalyzingPhotos(true);
    soundEngine.playSfx('click');

    try {
      const buffers: ReferenceFrameBuffer[] = [];
      for (const img of targetImages.slice(0, 4)) {
        const buf = await extractImageFrameBuffer(img.url);
        if (buf) buffers.push(buf);
      }

      // Immediate local deep canvas analysis so UI & 4-scene preview respond in <20ms
      const immediateAnalysis = analyzeCanvasFramesForStyle(buffers, {
        sourceType: 'foto',
        filename: targetImages[0]?.filename,
        userNote: stylePrompt.trim(),
      });

      const immediateName = styleName.trim() || immediateAnalysis.suggestedName;
      const immediatePrompt = immediateAnalysis.detailedPrompt;
      setRefAnalysis(immediateAnalysis);
      setStyleName(immediateName);
      setStylePrompt(immediatePrompt);
      setIsClaudeSectionOpen(true);

      if (alsoGenerateAnimationCode) {
        const immediateCode = generateCustomStyleCodeFromAnalysis(
          immediateAnalysis,
          immediateName,
          immediatePrompt
        );
        setPastedCode(immediateCode);
        setPersistedParseErrors([]);
        soundEngine.playSfx('ding');
        showToast(`Animasi gaya "${immediateName}" berhasil dibuat sesuai referensi foto!`);
      } else {
        showToast('Referensi foto berhasil dideteksi & ditulis ke prompt gaya');
      }

      setIsAnalyzingPhotos(false);

      // Background multimodal AI Vision refinement
      void runDeepStyleReferenceDetection(buffers, {
        sourceType: 'foto',
        filename: targetImages[0]?.filename,
        hintName: immediateName,
        userNote: stylePrompt.trim(),
      })
        .then((refined) => {
          if (!refined || refined.detectedBy !== 'ai_vision') return;
          setRefAnalysis(refined);
          const refinedName = styleName.trim() || refined.suggestedName || immediateName;
          setStyleName(refinedName);
          setStylePrompt(refined.detailedPrompt);
          if (alsoGenerateAnimationCode) {
            setPastedCode(
              generateCustomStyleCodeFromAnalysis(refined, refinedName, refined.detailedPrompt)
            );
          }
        })
        .catch(() => {});
    } catch {
      const fallbackDesc =
        'Gaya visual dari foto referensi: objek 3D dengan pencahayaan hangat bertekstur halus, palet warna kontras terkurasi, satu objek fokus di tengah dengan sudut 3/4, dan gerakan kamera lembut.';
      if (!styleName.trim()) setStyleName('Gaya Foto Referensi');
      setStylePrompt(fallbackDesc);
      setIsAnalyzingPhotos(false);
    }
  };

  // Upload 1-4 reference photos and immediately run visual detection
  const handleRefImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const slice = files.slice(0, Math.max(0, 4 - refImages.length));
    if (slice.length === 0) {
      e.target.value = '';
      return;
    }

    const readPromises = slice
      .filter((f) => f.type.startsWith('image/'))
      .map(
        (file, idx) =>
          new Promise<PromptMediaAttachment | null>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = typeof reader.result === 'string' ? reader.result : '';
              if (!dataUrl) {
                resolve(null);
                return;
              }
              resolve({
                id: `style-ref-${Date.now()}-${idx}`,
                key: `ref_gaya_${refImages.length + idx + 1}`,
                filename: file.name,
                type: 'image',
                url: dataUrl,
                sceneHint: `Referensi Gaya "${styleName.trim() || 'Kustom'}"`,
              });
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          })
      );

    void Promise.all(readPromises).then((loaded) => {
      const valid = loaded.filter((item): item is PromptMediaAttachment => Boolean(item));
      if (valid.length === 0) return;
      const merged = [...refImages, ...valid].slice(0, 4);
      setRefImages(merged);
      void runPhotoReferenceDetection(merged, false);
    });

    e.target.value = '';
  };

  // Extract dominant color palette & contrast from uploaded photo(s) to write a detailed Indonesian style description
  const handleAnalyzePhotos = async () => {
    await runPhotoReferenceDetection(refImages, false);
  };

  // Directly synthesize executable 4-scene custom style animation from uploaded reference photo(s)
  const handleGenerateStyleFromPhotos = async () => {
    if (refAnalysis && refAnalysis.sourceType === 'foto') {
      const finalName = styleName.trim() || refAnalysis.suggestedName;
      const finalPrompt = stylePrompt.trim() || refAnalysis.detailedPrompt;
      setStyleName(finalName);
      setStylePrompt(finalPrompt);
      const generatedCode = generateCustomStyleCodeFromAnalysis(refAnalysis, finalName, finalPrompt);
      setPastedCode(generatedCode);
      setPersistedParseErrors([]);
      setIsClaudeSectionOpen(true);
      soundEngine.playSfx('ding');
      showToast(`Animasi gaya "${finalName}" berhasil dibuat sesuai referensi foto!`);
      return;
    }
    await runPhotoReferenceDetection(refImages, true);
  };

  // Handle video file selection ("Pilih video" / "Ganti video") & immediately sample 4 keyframes
  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoFile({
      name: file.name,
      url,
      durationSec: 12,
    });

    // Immediately compute initial video reference analysis from filename & user notes so UI updates at 0ms
    const prevSuggested = refAnalysis?.suggestedName || '';
    const initialVideoAnalysis = analyzeCanvasFramesForStyle([], {
      sourceType: 'video',
      filename: file.name,
      userNote: stylePrompt.trim(),
      durationSec: 12,
    });
    setRefAnalysis(initialVideoAnalysis);
    setStyleName((prev) =>
      !prev.trim() || prev.trim() === prevSuggested ? initialVideoAnalysis.suggestedName : prev
    );
    setStylePrompt(initialVideoAnalysis.detailedPrompt);

    // Extract 4 keyframes across the video timeline & refine visual style + motion energy
    const extracted = await extractVideoKeyframesBuffers(url);
    setVideoFrames(extracted.frames);
    setVideoFile({
      name: file.name,
      url,
      durationSec: extracted.durationSec,
    });
    if (extracted.frames.length > 0) {
      const localVideoAnalysis = analyzeCanvasFramesForStyle(extracted.frames, {
        sourceType: 'video',
        filename: file.name,
        userNote: stylePrompt.trim(),
        durationSec: extracted.durationSec,
      });
      setRefAnalysis(localVideoAnalysis);
      setStyleName((prev) =>
        !prev.trim() ||
        prev.trim() === prevSuggested ||
        prev.trim() === initialVideoAnalysis.suggestedName
          ? localVideoAnalysis.suggestedName
          : prev
      );
      setStylePrompt(localVideoAnalysis.detailedPrompt);
    }
  };

  // Generate style + 4-scene demo from selected video ("Buat gaya dari video")
  const handleGenerateStyleFromVideo = async () => {
    if (!videoFile) return;
    setIsGeneratingFromVideo(true);
    soundEngine.playSfx('click');

    try {
      let framesToAnalyze = videoFrames;
      let dur = videoFile.durationSec || 12;
      if (framesToAnalyze.length === 0) {
        const extracted = await extractVideoKeyframesBuffers(videoFile.url);
        framesToAnalyze = extracted.frames;
        dur = extracted.durationSec;
        setVideoFrames(framesToAnalyze);
      }

      const immediateAnalysis =
        refAnalysis && refAnalysis.sourceType === 'video'
          ? refAnalysis
          : analyzeCanvasFramesForStyle(framesToAnalyze, {
              sourceType: 'video',
              filename: videoFile.name,
              userNote: stylePrompt.trim(),
              durationSec: dur,
            });

      setRefAnalysis(immediateAnalysis);
      const finalName =
        immediateAnalysis.suggestedName || styleName.trim() || 'Gaya Video Sinematik';
      const finalPrompt = immediateAnalysis.detailedPrompt;

      setStyleName(finalName);
      setStylePrompt(finalPrompt);

      const generatedCode = generateCustomStyleCodeFromAnalysis(
        immediateAnalysis,
        finalName,
        finalPrompt
      );
      setPastedCode(generatedCode);
      setPersistedParseErrors([]);
      setIsClaudeSectionOpen(true);
      setIsGeneratingFromVideo(false);
      soundEngine.playSfx('ding');
      showToast(`Gaya "${finalName}" + 4 scene demo berhasil dibuat sesuai referensi video!`);

      // Optional background AI Vision refinement
      void runDeepStyleReferenceDetection(framesToAnalyze, {
        sourceType: 'video',
        filename: videoFile.name,
        hintName: finalName,
        userNote: stylePrompt.trim(),
        durationSec: dur,
      })
        .then((refined) => {
          if (!refined || refined.detectedBy !== 'ai_vision') return;
          setRefAnalysis(refined);
          setStylePrompt(refined.detailedPrompt);
          setPastedCode(
            generateCustomStyleCodeFromAnalysis(refined, finalName, refined.detailedPrompt)
          );
        })
        .catch(() => {});
    } catch {
      setIsGeneratingFromVideo(false);
      showToast('Gagal menganalisis video referensi');
    }
  };

  const activePreviewChapterRef = useRef(activePreviewChapter);
  activePreviewChapterRef.current = activePreviewChapter;

  // Live 4-scene canvas preview + Web Audio SFX playback when valid style code is parsed
  useEffect(() => {
    if (!isOpen || !parsedStyle || !parsedStyle.scenes) return;

    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const styleWithCaption: CustomStyleDefinition = {
      ...parsedStyle,
      preferredRatio: customRatio,
      safeScale: customSafeScale,
      ...(customCaptionOverride ? { caption: customCaptionOverride as any } : {}),
    };

    const sfxData = getSatsetStyleDemoSfxTimeline(styleWithCaption.id, {
      ratio: customRatio,
      safeScale: customSafeScale,
      customStyle: styleWithCaption,
      captionOverride: customCaptionOverride || styleWithCaption.caption,
    });

    const getChapterDur = (ch: number) =>
      styleWithCaption.sceneDurations?.[ch] ||
      sfxData.scenes?.[ch - 1]?.duration ||
      4.2;

    const getChapterOffset = (ch: number) => {
      let sum = 0;
      for (let i = 1; i < ch; i++) sum += getChapterDur(i);
      return sum;
    };

    let animId = 0;
    const initDur = getChapterDur(activePreviewChapterRef.current);
    let localTime = previewPlaying ? 0 : Math.min(1.85, initDur * 0.45);
    let prevGlobalTime = getChapterOffset(activePreviewChapterRef.current) + localTime;
    let lastStamp = performance.now();
    firedModalSfxRef.current.clear();

    const loop = (stamp: number) => {
      const dt = Math.min(0.1, (stamp - lastStamp) / 1000);
      lastStamp = stamp;

      const curChapter = activePreviewChapterRef.current;
      const curDur = getChapterDur(curChapter);

      if (previewPlaying) {
        localTime += dt;
        if (localTime >= curDur) {
          localTime = 0;
          firedModalSfxRef.current.clear();
          const nextChapter = (curChapter % 4) + 1;
          activePreviewChapterRef.current = nextChapter;
          setActivePreviewChapter(nextChapter);
          prevGlobalTime = getChapterOffset(nextChapter);
        }
      }

      const w = canvas.width;
      const h = canvas.height;
      const globalTime = getChapterOffset(activePreviewChapterRef.current) + localTime;

      // Trigger signature style Web Audio SFX cues in real time as playhead crosses them
      if (previewPlaying && previewSoundOn && sfxData.events?.length) {
        for (const ev of sfxData.events) {
          if (ev.t >= prevGlobalTime - 0.04 && ev.t <= globalTime + 0.03) {
            const key = `${ev.name}@${Math.round(ev.t * 40)}`;
            if (!firedModalSfxRef.current.has(key)) {
              firedModalSfxRef.current.add(key);
              soundEngine.playSatsetCueNow(
                ev.name,
                Math.min(0.88, (ev.gain || 0.7) * 0.85),
                ev.pitch || 1,
                ev.flavor || styleWithCaption.sfxFlavor
              );
            }
          }
        }
      }
      prevGlobalTime = globalTime;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);

      renderSatsetStyleLiveDemoFrame(ctx, w, h, styleWithCaption.id, globalTime, {
        ratio: customRatio,
        safeScale: customSafeScale,
        customStyle: styleWithCaption,
        captionOverride: customCaptionOverride || styleWithCaption.caption,
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [
    isOpen,
    parsedStyle,
    activePreviewChapter,
    previewPlaying,
    previewSoundOn,
    customCaptionOverride,
    customRatio,
    customSafeScale,
  ]);

  const handleApplyToProject = () => {
    if (!parsedStyle) return;
    const finalStyle: CustomStyleDefinition = {
      ...parsedStyle,
      name: styleName.trim() || parsedStyle.name,
      prompt: stylePrompt.trim() || parsedStyle.prompt,
      preferredRatio: customRatio,
      safeScale: customSafeScale,
      ...(customCaptionOverride ? { caption: customCaptionOverride as any } : {}),
    };
    saveCustomStyleToStorage(finalStyle);
    onSaveStyle(finalStyle);
    onClose();
  };

  if (!isOpen) return null;

  const currentAiPlatform =
    AI_PLATFORMS.find((p) => p.id === selectedAiTarget) || AI_PLATFORMS[0];
  const currentAiName =
    currentAiPlatform.id === 'claude' ? 'Claude' : currentAiPlatform.name;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
        <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-xl max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* ============================================================== */}
          {/* HEADER (Blue Theme + Exact Layout Match)                       */}
          {/* ============================================================== */}
          <div className="px-5 pt-5 pb-3.5 border-b border-slate-200 flex items-start justify-between shrink-0 bg-white">
            <div className="pr-4">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                Buat gaya sendiri
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Mulai dari tulisan, foto, atau video yang gayanya kamu suka. Hasilnya mengisi nama &amp; prompt di bawah, lalu tersimpan otomatis begitu jadi.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup modal buat gaya sendiri"
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ============================================================== */}
          {/* SCROLLABLE BODY                                                */}
          {/* ============================================================== */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            
            {/* 3-TAB MODE SELECTOR: Tulis sendiri | Dari foto | Dari video */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-1.5 grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleSelectMode('tulis')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeMode === 'tulis'
                    ? 'bg-blue-600 text-white shadow-xs border border-blue-500'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Tulis sendiri</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectMode('foto')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeMode === 'foto'
                    ? 'bg-blue-600 text-white shadow-xs border border-blue-500'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Dari foto</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectMode('video')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeMode === 'video'
                    ? 'bg-blue-600 text-white shadow-xs border border-blue-500'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Dari video</span>
              </button>
            </div>

            {/* ============================================================ */}
            {/* MODE PANEL: DARI FOTO                                        */}
            {/* ============================================================ */}
            {activeMode === 'foto' && (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Upload 1–4 gambar yang gayanya kamu suka. Sistem membaca gayanya dengan detail (teknik, bentuk, garis, warna, suasana) lalu menulis deskripsinya di kotak atas. Tulisanmu di kotak atas ikut dipakai sebagai catatan.
                </p>

                <input
                  ref={refImgInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleRefImageUpload}
                />

                <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                  {refImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-white group"
                    >
                      <img
                        src={img.url}
                        alt={img.filename}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setRefImages((prev) => prev.filter((item) => item.id !== img.id))
                        }
                        aria-label="Hapus foto"
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center text-[11px] hover:bg-black cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {refImages.length < 4 && (
                    <button
                      type="button"
                      onClick={() => refImgInputRef.current?.click()}
                      className="w-20 h-16 rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-white flex flex-col items-center justify-center gap-0.5 text-slate-600 hover:text-blue-600 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-[10px] font-bold">Tambah foto</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={refImages.length === 0 || isAnalyzingPhotos}
                    onClick={handleAnalyzePhotos}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 border transition ${
                      refImages.length > 0
                        ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-2xs cursor-pointer'
                        : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>
                      {isAnalyzingPhotos
                        ? 'Membaca detail foto...'
                        : 'Tulis deskripsi dari foto'}
                    </span>
                  </button>

                  {refImages.length > 0 && (
                    <button
                      type="button"
                      disabled={isAnalyzingPhotos}
                      onClick={handleGenerateStyleFromPhotos}
                      className="px-3.5 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Buat animasi gaya dari foto</span>
                    </button>
                  )}
                </div>

                {refAnalysis && refAnalysis.sourceType === 'foto' && refImages.length > 0 && (
                  <div
                    data-testid="photo-reference-detection-card"
                    className="rounded-xl bg-blue-50/70 border border-blue-200 p-3 space-y-2 text-[11px] text-slate-700"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-extrabold text-blue-800">
                        Hasil Deteksi Referensi Foto: {refAnalysis.suggestedName}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold text-[10px] uppercase">
                          {refAnalysis.look}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white border border-blue-200 text-blue-700 font-bold text-[10px]">
                          {refAnalysis.finish}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white border border-blue-200 text-slate-600 font-semibold text-[10px]">
                          {refAnalysis.background.paper.pattern}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500">Palet Terdeteksi:</span>
                      {refAnalysis.colors.map((hex, i) => (
                        <span
                          key={`${hex}-${i}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[10px] font-bold text-slate-700"
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-black/15"
                            style={{ backgroundColor: hex }}
                          />
                          {hex}
                        </span>
                      ))}
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      <strong>Pencahayaan &amp; Gerak:</strong> {refAnalysis.lightingMood}. {refAnalysis.motionNotes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* MODE PANEL: DARI VIDEO                                       */}
            {/* ============================================================ */}
            {activeMode === 'video' && (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Upload video yang gayanya kamu suka (maks. 2 menit; lebih panjang dipotong). Sistem mengamati warna, bentuk, tulisan, subtitle, cara gerak, dan transisinya, lalu langsung membuat gayanya + 4 scene demo yang meniru videomu. Saat dipakai, isi animasinya mengikuti naskah videomu sendiri. Tulisanmu di kotak atas ikut dipakai sebagai catatan.
                </p>

                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoFileChange}
                />

                {!videoFile ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl border border-dashed border-blue-300 hover:border-blue-500 bg-white text-slate-700 hover:text-blue-600 text-xs font-extrabold inline-flex items-center gap-2 transition cursor-pointer"
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>Pilih video</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative w-20 h-32 rounded-xl overflow-hidden bg-black border border-slate-200 shrink-0">
                        <video
                          src={videoFile.url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      </div>

                      {videoFrames.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          {videoFrames.map((vf, idx) =>
                            vf.dataUrl ? (
                              <div
                                key={idx}
                                className="relative w-12 h-20 rounded-lg overflow-hidden border border-blue-200 bg-slate-900 shrink-0"
                                title={`Keyframe ${idx + 1}`}
                              >
                                <img
                                  src={vf.dataUrl}
                                  alt={`Keyframe ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/70 text-white text-[8px] font-bold">
                                  F{idx + 1}
                                </span>
                              </div>
                            ) : null
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Ganti video</span>
                      </button>
                    </div>

                    {refAnalysis && refAnalysis.sourceType === 'video' && (
                      <div
                        data-testid="video-reference-detection-card"
                        className="rounded-xl bg-blue-50/70 border border-blue-200 p-3 space-y-2 text-[11px] text-slate-700"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-extrabold text-blue-800">
                            Hasil Deteksi Referensi Video: {refAnalysis.suggestedName}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold text-[10px] uppercase">
                              {refAnalysis.look}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-white border border-blue-200 text-blue-700 font-bold text-[10px]">
                              {refAnalysis.finish}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-white border border-blue-200 text-slate-600 font-semibold text-[10px]">
                              Tempo Gerak {refAnalysis.motionEnergy ?? 50}%
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500">Palet Video:</span>
                          {refAnalysis.colors.map((hex, i) => (
                            <span
                              key={`${hex}-${i}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[10px] font-bold text-slate-700"
                            >
                              <span
                                className="w-3 h-3 rounded-full border border-black/15"
                                style={{ backgroundColor: hex }}
                              />
                              {hex}
                            </span>
                          ))}
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          <strong>Analisis Gerak &amp; Suasana:</strong> {refAnalysis.motionNotes}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Perkiraan biaya: <strong className="text-slate-700">250 token–460 token</strong> per video (dipotong dari Token AI setelah selesai, sesuai pemakaian).
                </p>

                {videoFile && (
                  <button
                    type="button"
                    onClick={handleGenerateStyleFromVideo}
                    disabled={isGeneratingFromVideo}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold inline-flex items-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>
                      {isGeneratingFromVideo
                        ? 'Menganalisis & membuat gaya dari video...'
                        : 'Buat gaya dari video'}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* FIELD 1: Nama gaya                                           */}
            {/* ============================================================ */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-800">
                Nama gaya
              </label>
              <input
                type="text"
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
                placeholder="mis. Tanah Liat, Komik Jadul, Brand Kopi Saya"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
              />
            </div>

            {/* ============================================================ */}
            {/* FIELD 2: Deskripsi / prompt gaya + Contoh chips              */}
            {/* ============================================================ */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-800">
                Deskripsi / prompt gaya
              </label>
              <textarea
                rows={4}
                value={stylePrompt}
                onChange={(e) => setStylePrompt(e.target.value)}
                placeholder="Ceritakan seperti ke ilustrator: gaya gambarnya, warna, suasana, bentuk objek, dan cara geraknya. Makin detail, makin mirip."
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 leading-relaxed"
              />

              {/* Contoh chips (Tactile Papercraft Lab, Tanah liat, Sketsa pensil, Cyberpunk, Kartun anak) */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-slate-500 font-medium mr-0.5">
                  Contoh:
                </span>
                {PRESET_EXAMPLES.map((ex) => (
                  <button
                    key={ex.name}
                    type="button"
                    data-testid={`preset-example-chip-${ex.name}`}
                    onClick={() => {
                      setStylePrompt(ex.prompt);
                      if (ex.sampleCode) {
                        setStyleName(ex.name);
                        setIsClaudeSectionOpen(true);
                        evaluatePastedText(ex.sampleCode);
                      } else if (tutorialBubbleStep === 'none') {
                        setTutorialBubbleStep('send');
                      }
                    }}
                    className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 hover:border-blue-300 text-[11px] font-semibold transition cursor-pointer"
                  >
                    {ex.name}
                  </button>
                ))}
              </div>
            </div>

            {/* ============================================================ */}
            {/* FIELD 3: PENGGANTI RASIO & SAFE-FIT ANTI-TERPOTONG            */}
            {/* ============================================================ */}
            <div
              data-testid="custom-style-ratio-card"
              className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 space-y-2.5 shadow-2xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="block text-xs font-extrabold text-slate-800">
                    Pengganti Rasio &amp; Bingkai Anti-Terpotong
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Sesuaikan rasio kanvas agar objek &amp; teks gaya baru selalu pas di tengah tanpa terpotong.
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-[10px] font-extrabold">
                  Auto Safe-Fit Aktif
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {(
                  [
                    { id: '9:16', label: '9:16', desc: 'Vertikal' },
                    { id: '1:1', label: '1:1', desc: 'Kotak' },
                    { id: '3:4', label: '3:4', desc: 'Potret' },
                    { id: '16:9', label: '16:9', desc: 'Lanskap' },
                  ] as const
                ).map((item) => {
                  const active = customRatio === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`custom-style-ratio-btn-${item.id}`}
                      onClick={() => setCustomRatio(item.id)}
                      className={`py-2 px-2.5 rounded-xl border text-center transition cursor-pointer ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <div className="text-xs font-extrabold leading-tight">{item.label}</div>
                      <div
                        className={`text-[10px] font-semibold ${
                          active ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {item.desc}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <span className="text-[11px] font-bold text-slate-600">
                  Skala Ruang Aman Objek:
                </span>
                <div className="inline-flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                  {(
                    [
                      { val: 0.84, label: '84% (Lega)' },
                      { val: 0.92, label: '92% (Anti-Terpotong)' },
                      { val: 1.0, label: '100% (Penuh)' },
                    ] as const
                  ).map((sc) => {
                    const active = Math.abs(customSafeScale - sc.val) < 0.02;
                    return (
                      <button
                        key={sc.val}
                        type="button"
                        data-testid={`custom-style-scale-btn-${Math.round(sc.val * 100)}`}
                        onClick={() => setCustomSafeScale(sc.val)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                          active
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {sc.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* CARD: Kembangkan dengan Claude (opsional)                    */}
            {/* ============================================================ */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setIsClaudeSectionOpen((prev) => !prev)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100/70 transition cursor-pointer"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <Code2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-extrabold text-slate-900">
                    Kembangkan dengan Claude
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    (opsional)
                  </span>
                </div>
                {isClaudeSectionOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {isClaudeSectionOpen && (
                <div className="px-4 pb-4 space-y-3.5">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Cukup tulis ide kasar di kotak atas (mis. &quot;kayak iklan Apple tapi warna-warni&quot;) — Claude akan merinci gaya visualnya dan membuat contoh animasinya.
                  </p>

                  {!isReadyForAi ? (
                    <div className="text-xs text-slate-400 italic">
                      Tulis dulu nama atau ide gayanya di atas.
                    </div>
                  ) : (
                    <div className="space-y-4 pt-0.5">
                      
                      {/* STEP 1: Kirim perintah ke AI */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                            1
                          </span>
                          <span className="text-xs font-extrabold text-slate-800">
                            Kirim perintah ke AI
                          </span>
                        </div>

                        <div className="relative flex flex-wrap items-center gap-2">
                          {/* Split blue button: [Kirim ke AI | v] */}
                          <div className="relative inline-flex items-stretch rounded-xl shadow-xs">
                            <button
                              type="button"
                              onClick={() => handleSendToAiDirect()}
                              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-l-xl flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>
                                {selectedAiTarget === 'claude'
                                  ? 'Kirim ke AI'
                                  : `Kirim ke ${currentAiName}`}
                              </span>
                            </button>
                            <button
                              type="button"
                              aria-label="Pilih platform AI"
                              onClick={() => setShowAiDropdown((prev) => !prev)}
                              className="px-2 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-r-xl border-l border-white/20 flex items-center justify-center transition cursor-pointer"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>

                            {showAiDropdown && (
                              <div className="absolute left-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30">
                                {AI_TARGETS.map((targetId) => {
                                  const cfg =
                                    AI_PLATFORMS.find((p) => p.id === targetId) ||
                                    AI_PLATFORMS[0];
                                  const isSelected = selectedAiTarget === targetId;
                                  return (
                                    <button
                                      key={targetId}
                                      type="button"
                                      onClick={() => {
                                        setSelectedAiTarget(targetId);
                                        handleSendToAiDirect(targetId);
                                      }}
                                      className={`w-full px-3 py-2 text-left text-xs font-bold flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                                        isSelected ? 'text-blue-600' : 'text-slate-800'
                                      }`}
                                    >
                                      <span>{cfg.name}</span>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Salin prompt gaya button */}
                          <button
                            type="button"
                            onClick={handleCopyStylePrompt}
                            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                              copiedPrompt
                                ? 'bg-blue-50 border-blue-400 text-blue-600'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            {copiedPrompt ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-blue-600 stroke-[2.5]" />
                                <span>Tersalin</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                                <span>Salin prompt gaya</span>
                              </>
                            )}
                          </button>

                          {/* Floating tutorial bubble */}
                          {tutorialBubbleStep === 'send' && !pastedCode && !hasErrorState && (
                            <div
                              onClick={() => setTutorialBubbleStep('paste')}
                              className="mt-1 inline-flex items-center gap-2 bg-slate-900 text-white text-[11px] font-bold px-3 py-2 rounded-xl shadow-lg border border-blue-500/30 cursor-pointer"
                            >
                              <span className="text-sky-400">👆</span>
                              <span>
                                Klik untuk mengirim perintah ke AI ({currentAiName})
                              </span>
                            </div>
                          )}
                        </div>

                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              setTutorialBubbleStep('paste');
                              pasteTextareaRef.current?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center',
                              });
                              pasteTextareaRef.current?.focus();
                            }}
                            className="text-[11px] text-slate-500 hover:text-blue-600 underline cursor-pointer"
                          >
                            Sudah dapat jawaban AI? Tempel di sini
                          </button>
                        </div>
                      </div>

                      {/* STEP 2: Tempel jawaban AI */}
                      <div className="space-y-2.5 pt-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                              2
                            </span>
                            <span className="text-xs font-extrabold text-slate-800">
                              Tempel jawaban AI
                            </span>
                          </div>
                          <button
                            type="button"
                            data-testid="load-sample-papercraft-code-btn"
                            onClick={() => {
                              setStyleName('Tactile Papercraft Lab');
                              evaluatePastedText(SAMPLE_TACTILE_PAPERCRAFT_CODE);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-extrabold transition cursor-pointer"
                          >
                            Muat Contoh Kode + Web Audio
                          </button>
                        </div>

                        {/* Floating tutorial bubble after copying/sending */}
                        {tutorialBubbleStep === 'paste' && !pastedCode && (
                          <div className="inline-flex items-center gap-2 bg-slate-900 text-white text-[11px] font-bold px-3 py-2 rounded-xl shadow-lg border border-blue-500/30">
                            <span className="text-sky-400">👆</span>
                            <span>
                              Sudah salin jawaban AI? Tahan kotak ini, lalu pilih Tempel
                            </span>
                          </div>
                        )}

                        {/* Warning banner when invalid response was pasted */}
                        {hasErrorState && (
                          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-500">
                            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <span className="font-bold leading-relaxed">
                              Jawaban ini belum bisa diproses. Kirim perbaikan ke AI (tombol di bawah), lalu tempel jawaban barunya.
                            </span>
                          </div>
                        )}

                        {/* Dropzone or Filled Textarea */}
                        {!pastedCode ? (
                          <div
                            onClick={() => {
                              setShowNativePastePopup(true);
                              pasteTextareaRef.current?.focus();
                            }}
                            onContextMenu={() => {
                              setShowNativePastePopup(true);
                            }}
                            className="relative border-2 border-dashed border-blue-400/60 rounded-2xl p-4 bg-white space-y-2.5 flex flex-col items-center text-center cursor-text"
                          >
                            {/* Floating native-style "Tempel" pill + blue caret handle */}
                            {(showNativePastePopup || isTextareaFocused) && (
                              <div className="absolute left-3 top-2 z-20 flex flex-col items-start">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePasteFromClipboard();
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-lg cursor-pointer"
                                >
                                  Tempel
                                </button>
                                <div className="ml-2 mt-1 w-3.5 h-3.5 rounded-full rounded-tl-none rotate-45 bg-sky-400 shadow-xs" />
                              </div>
                            )}

                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                              <ClipboardCheck className="w-5 h-5" />
                            </div>

                            <div className="space-y-1.5">
                              <h4 className="text-xs sm:text-sm font-extrabold text-blue-600">
                                Tahan kotak ini, lalu pilih Tempel
                              </h4>

                              <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] text-slate-500">
                                <span>① Tunggu Claude selesai menjawab</span>
                                <span>
                                  ② Klik <strong className="text-slate-800">Copy</strong> di bawah jawabannya
                                </span>
                                <span>
                                  ③ Tahan kotak ini, pilih <strong className="text-slate-800">Tempel</strong>
                                </span>
                              </div>
                            </div>

                            <textarea
                              ref={pasteTextareaRef}
                              data-testid="custom-style-paste-textarea"
                              rows={2}
                              value={pastedCode}
                              onFocus={() => setIsTextareaFocused(true)}
                              onBlur={() => {
                                setTimeout(() => setIsTextareaFocused(false), 180);
                              }}
                              onPaste={(e) => {
                                const clip = e.clipboardData?.getData('text') || '';
                                if (clip) {
                                  e.preventDefault();
                                  evaluatePastedText(clip);
                                }
                              }}
                              onChange={(e) => evaluatePastedText(e.target.value)}
                              placeholder="Tempel jawaban Claude (satu blok kode) di sini..."
                              className="w-full bg-transparent border-0 p-1 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none text-center resize-none"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <textarea
                              ref={pasteTextareaRef}
                              data-testid="custom-style-paste-textarea"
                              rows={4}
                              value={pastedCode}
                              onChange={(e) => evaluatePastedText(e.target.value)}
                              className="w-full bg-white border border-blue-500 rounded-xl p-3 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
                            />

                            {/* Action buttons below non-empty textarea: [Proses jawaban] and [Kosongkan] */}
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => evaluatePastedText(pastedCode)}
                                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                              >
                                <ClipboardCheck className="w-3.5 h-3.5" />
                                <span>Proses jawaban</span>
                              </button>

                              <button
                                type="button"
                                onClick={handleClearPastedCode}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                              >
                                Kosongkan
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Detailed error box + "Salin perbaikan untuk AI" button */}
                        {hasErrorState && (
                          <div className="space-y-2.5 pt-1">
                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-500 leading-relaxed">
                              {activeErrors[0]}
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5">
                              <button
                                type="button"
                                onClick={handleCopyRepairPrompt}
                                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>
                                  {copiedRepair
                                    ? 'Perbaikan tersalin!'
                                    : 'Salin perbaikan untuk AI'}
                                </span>
                              </button>

                              <span className="text-[11px] text-slate-500 leading-snug flex-1 min-w-[180px]">
                                Kirim di chat Claude yang tadi (bukan chat baru), lalu tempel jawaban barunya di atas.{' '}
                                <button
                                  type="button"
                                  onClick={() => setShowFormatErrorModal(true)}
                                  className="underline font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                                >
                                  Caranya?
                                </button>
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Live Preview when valid code is parsed */}
                        {parseResult.isValid && parsedStyle && (
                          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 animate-in fade-in duration-200">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </span>
                                <span className="text-xs font-extrabold text-emerald-600">
                                  Gaya siap dipakai: {parsedStyle.name} ({parsedStyle.look}, {parsedStyle.finish})
                                </span>
                                <span
                                  data-testid="custom-style-audio-engine-badge"
                                  className="px-2 py-0.5 rounded-md bg-blue-600/15 border border-blue-500/30 text-blue-700 text-[10px] font-extrabold"
                                >
                                  {parsedStyle.customAudioCode
                                    ? 'Engine Web Audio Khusus Aktif'
                                    : `Web Audio Foley: ${(parsedStyle.sfxFlavor || 'editorial').toUpperCase()}`}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                {parsedStyle.colors.map((c, i) => (
                                  <span
                                    key={i}
                                    className="w-3.5 h-3.5 rounded-full border border-black/20"
                                    style={{ backgroundColor: c }}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="bg-slate-950 rounded-xl p-2.5 flex flex-col items-center gap-2">
                              <div className="w-full flex items-center justify-between text-[10px] text-slate-400">
                                <span className="text-white font-bold">
                                  Demo Gaya Scene {activePreviewChapter}/4 ({parsedStyle.sceneDurations?.[activePreviewChapter] || 4.2}s)
                                </span>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4].map((num) => (
                                    <button
                                      key={num}
                                      type="button"
                                      data-testid={`custom-style-preview-scene-btn-${num}`}
                                      onClick={() => {
                                        activePreviewChapterRef.current = num;
                                        setActivePreviewChapter(num);
                                      }}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                                        activePreviewChapter === num
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-slate-800 text-slate-400'
                                      }`}
                                    >
                                      {num}
                                    </button>
                                  ))}
                                  <button
                                    type="button"
                                    aria-label={previewSoundOn ? 'Matikan suara pratinjau' : 'Nyalakan suara pratinjau'}
                                    onClick={() => setPreviewSoundOn((prev) => !prev)}
                                    className={`p-1 rounded ml-1 cursor-pointer transition ${
                                      previewSoundOn
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                    title={previewSoundOn ? 'Suara Foley Aktif' : 'Suara Foley Mati'}
                                  >
                                    {previewSoundOn ? (
                                      <Volume2 className="w-2.5 h-2.5" />
                                    ) : (
                                      <VolumeX className="w-2.5 h-2.5" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPreviewPlaying(!previewPlaying)}
                                    className="p-1 rounded bg-slate-800 text-slate-300 cursor-pointer"
                                  >
                                    {previewPlaying ? (
                                      <RotateCcw className="w-2.5 h-2.5" />
                                    ) : (
                                      <Play className="w-2.5 h-2.5" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              <div className="w-full flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800">
                                <span className="text-[10px] font-bold text-slate-300">
                                  Rasio Pratinjau (Anti-Terpotong):
                                </span>
                                <div className="flex items-center gap-1">
                                  {(['9:16', '1:1', '3:4', '16:9'] as const).map((r) => (
                                    <button
                                      key={r}
                                      type="button"
                                      data-testid={`custom-style-preview-ratio-${r}`}
                                      onClick={() => setCustomRatio(r)}
                                      className={`px-2 py-0.5 rounded text-[9px] font-extrabold transition cursor-pointer ${
                                        customRatio === r
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-slate-800 text-slate-400 hover:text-white'
                                      }`}
                                    >
                                      {r}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="w-full flex items-center justify-between gap-2 bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800">
                                <span className="text-[10px] font-bold text-slate-300">
                                  Gaya Subtitle:
                                </span>
                                <select
                                  value={customCaptionOverride || parsedStyle.caption || 'pop'}
                                  onChange={(e) => setCustomCaptionOverride(e.target.value)}
                                  className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded border border-slate-700 focus:outline-none"
                                >
                                  {(SATSET_CAPTION_MODES as Array<{ id: string; label: string }>).map(
                                    (cap) => (
                                      <option key={cap.id} value={cap.id}>
                                        {cap.label} ({cap.id})
                                      </option>
                                    )
                                  )}
                                </select>
                              </div>

                              <div
                                className={`relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-lg transition-all duration-200 ${
                                  customRatio === '16:9'
                                    ? 'aspect-[16/9] w-64 sm:w-72'
                                    : customRatio === '1:1'
                                      ? 'aspect-square w-48 sm:w-52'
                                      : customRatio === '3:4'
                                        ? 'aspect-[3/4] w-44 sm:w-48'
                                        : 'aspect-[9/16] w-40 sm:w-44'
                                }`}
                              >
                                <canvas
                                  ref={previewCanvasRef}
                                  data-testid="custom-style-preview-canvas"
                                  width={
                                    customRatio === '16:9'
                                      ? 640
                                      : customRatio === '1:1'
                                        ? 540
                                        : customRatio === '3:4'
                                          ? 480
                                          : 480
                                  }
                                  height={
                                    customRatio === '16:9'
                                      ? 360
                                      : customRatio === '1:1'
                                        ? 540
                                        : customRatio === '3:4'
                                          ? 640
                                          : 854
                                  }
                                  className="w-full h-full object-contain block"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ============================================================ */}
            {/* BLUE INFO BAR: Terbaca sebagai: objek 3D , mengilap ...       */}
            {/* ============================================================ */}
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
              <Sliders className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Terbaca sebagai:{' '}
                <strong className="font-extrabold text-blue-600">
                  {detectedStyleTags.look}
                </strong>{' '}
                ,{' '}
                <strong className="font-extrabold text-blue-600">
                  {detectedStyleTags.finish}
                </strong>{' '}
                . Sebut &quot;2D&quot;, &quot;3D&quot;, &quot;neon&quot;, &quot;mengilap&quot;, atau &quot;sketsa&quot; di prompt untuk mengubahnya.
              </span>
            </div>

            {/* ============================================================ */}
            {/* ACCORDION: Penting: gaya sendiri ada batasnya                 */}
            {/* ============================================================ */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setIsLimitSectionOpen((prev) => !prev)}
                className="w-full px-3.5 py-2.5 flex items-center gap-2 text-left text-xs font-extrabold text-slate-700 cursor-pointer"
              >
                {isLimitSectionOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                )}
                <span>Penting: gaya sendiri ada batasnya, baca dulu ya</span>
              </button>

              {isLimitSectionOpen && (
                <div className="px-3.5 pb-3 text-[11px] text-slate-600 space-y-1.5 leading-relaxed border-t border-slate-200 pt-2">
                  <p>
                    Mesin animasi menggambar dengan bentuk geometri 2D &amp; 3D (balok, bola, silinder, kerucut, garis, kurva, dan partikel).
                  </p>
                  <p>
                    Gaya ini cocok untuk <strong>objek, ikon, produk, bangunan, diagram, dan karakter maskot tanpa wajah</strong> — bukan foto manusia realistis atau video rekaman kamera.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================== */}
          {/* FOOTER BAR (Blue Theme: Batal | Kirim ke AI / Simpan)          */}
          {/* ============================================================== */}
          <div className="px-5 py-3.5 border-t border-slate-200 bg-white flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition cursor-pointer"
            >
              Batal
            </button>

            {parseResult.isValid ? (
              <button
                type="button"
                onClick={handleApplyToProject}
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan &amp; pakai</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSendToAiDirect()}
                disabled={!isReadyForAi}
                className={`py-2 px-4 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition ${
                  isReadyForAi
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim ke AI</span>
              </button>
            )}
          </div>

          {/* Floating Toast Notification ("Disalin") */}
          {toastMessage && (
            <div className="fixed bottom-5 right-5 z-70 bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl border border-blue-400/30 animate-in fade-in slide-in-from-bottom-2 duration-150">
              {toastMessage}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* POPUP MODAL: Gagal diproses: AI-nya belum pas formatnya         */}
      {/* ============================================================== */}
      {showFormatErrorModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                    Gagal diproses: AI-nya belum pas formatnya
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tenang, tidak perlu mulai dari awal. Cukup minta AI memperbaiki jawabannya:
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowFormatErrorModal(false)}
                aria-label="Tutup popup perbaikan"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 4 Numbered Instructions */}
            <div className="space-y-2.5 text-xs text-slate-800 pt-1">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">
                  1
                </span>
                <span className="leading-relaxed">
                  Klik tombol <strong>Salin perbaikan</strong> di bawah.
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">
                  2
                </span>
                <span className="leading-relaxed">
                  Buka lagi <strong>chat AI yang sama</strong> (jangan buat chat baru, supaya AI masih ingat).
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">
                  3
                </span>
                <span className="leading-relaxed">
                  <strong>Tempel (Paste)</strong> dan kirim ke AI, lalu tunggu jawaban barunya selesai.
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">
                  4
                </span>
                <span className="leading-relaxed">
                  Salin jawaban barunya, kembali ke sini, lalu tempel lagi di kotak jawaban.
                </span>
              </div>
            </div>

            {/* Blue Note Box */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
              Isi pesan perbaikannya sudah otomatis menyebutkan bagian mana yang salah, jadi kamu tidak perlu mengetik apa-apa.
            </div>

            {/* Collapsible: Apa yang belum pas? */}
            <div>
              <button
                type="button"
                onClick={() => setShowErrorDetailsInModal((prev) => !prev)}
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 cursor-pointer"
              >
                {showErrorDetailsInModal ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                <span>Apa yang belum pas?</span>
              </button>

              {showErrorDetailsInModal && (
                <div className="mt-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-500 leading-relaxed">
                  {activeErrors.join(' ')}
                </div>
              )}
            </div>

            {/* Full-width blue button: Salin perbaikan */}
            <button
              type="button"
              onClick={() => {
                handleCopyRepairPrompt();
                setShowFormatErrorModal(false);
              }}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>Salin perbaikan</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

async function extractImageFrameBuffer(dataUrl: string): Promise<ReferenceFrameBuffer | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = 48;
        const h = 48;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);

        // Also create a compact JPEG dataUrl for server vision analysis
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 240;
        thumbCanvas.height = Math.max(135, Math.round((240 * (img.height || 240)) / Math.max(1, img.width || 240)));
        const tCtx = thumbCanvas.getContext('2d');
        if (tCtx) {
          tCtx.drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);
        }
        const compactDataUrl = tCtx ? thumbCanvas.toDataURL('image/jpeg', 0.8) : dataUrl;

        resolve({
          width: w,
          height: h,
          data: imageData.data,
          dataUrl: compactDataUrl,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

async function extractVideoKeyframesBuffers(
  videoUrl: string
): Promise<{ frames: ReferenceFrameBuffer[]; durationSec: number }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    let settled = false;
    const finish = (frames: ReferenceFrameBuffer[], durationSec: number) => {
      if (settled) return;
      settled = true;
      resolve({ frames, durationSec });
    };

    const timeoutId = setTimeout(() => {
      finish([], 12);
    }, 1200);

    video.onloadedmetadata = async () => {
      try {
        const rawDur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 8;
        const cappedDur = Math.min(120, Math.max(1, rawDur));
        const ratios = [0.12, 0.36, 0.62, 0.86];
        const frames: ReferenceFrameBuffer[] = [];

        for (const r of ratios) {
          const targetTime = Math.min(cappedDur - 0.05, Math.max(0.05, cappedDur * r));
          await new Promise<void>((resSeek) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              resSeek();
            };
            video.addEventListener('seeked', onSeeked);
            try {
              video.currentTime = targetTime;
            } catch {
              video.removeEventListener('seeked', onSeeked);
              resSeek();
            }
            setTimeout(() => {
              video.removeEventListener('seeked', onSeeked);
              resSeek();
            }, 180);
          });

          const w = 48;
          const h = 48;
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, w, h);
            const imgData = ctx.getImageData(0, 0, w, h);

            const thumbCanvas = document.createElement('canvas');
            thumbCanvas.width = 180;
            thumbCanvas.height = 320;
            const tCtx = thumbCanvas.getContext('2d');
            if (tCtx) {
              tCtx.drawImage(video, 0, 0, 180, 320);
            }
            frames.push({
              width: w,
              height: h,
              data: imgData.data,
              dataUrl: tCtx ? thumbCanvas.toDataURL('image/jpeg', 0.78) : undefined,
              timestampSec: targetTime,
            });
          }
        }

        clearTimeout(timeoutId);
        finish(frames, Math.round(cappedDur));
      } catch {
        clearTimeout(timeoutId);
        finish([], 12);
      }
    };

    video.onerror = () => {
      clearTimeout(timeoutId);
      finish([], 12);
    };

    video.src = videoUrl;
  });
}

async function runDeepStyleReferenceDetection(
  frames: ReferenceFrameBuffer[],
  options: {
    sourceType: 'foto' | 'video';
    filename?: string;
    hintName?: string;
    userNote?: string;
    durationSec?: number;
  }
): Promise<VisualReferenceAnalysis> {
  const localAnalysis = analyzeCanvasFramesForStyle(frames, {
    sourceType: options.sourceType,
    filename: options.filename,
    userNote: options.userNote,
    durationSec: options.durationSec,
  });

  const imagesPayload = frames
    .map((f) => f.dataUrl)
    .filter((u): u is string => Boolean(u && u.startsWith('data:image/')))
    .slice(0, 4);

  if (imagesPayload.length === 0) {
    return localAnalysis;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6500);
    const resp = await fetch('/api/satset/analyze-style-reference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: imagesPayload,
        sourceType: options.sourceType,
        hintName: options.hintName,
        userNote: options.userNote,
        clientAnalysis: localAnalysis,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (resp.ok) {
      const json = await resp.json();
      if (json?.analysis && json.analysis.detailedPrompt) {
        return {
          ...localAnalysis,
          ...json.analysis,
          frameThumbnails: localAnalysis.frameThumbnails,
        };
      }
    }
  } catch {
    // Fallback to deep client canvas analysis
  }

  return localAnalysis;
}

import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  Camera,
  SlidersHorizontal,
  UserCheck,
  Check,
  X,
  Upload,
  Moon,
  Sun,
  RotateCw,
  AlertCircle,
} from 'lucide-react';
import { createSatsetSContext } from '../utils/custom-style-runtime.ts';
import { soundEngine } from '../utils/audio-synth.ts';
import {
  ACCESSORY_PRESETS,
  BOTTOM_PRESETS,
  BUILDER_VIEW_POSES,
  type BuilderTabId,
  type BuilderViewMode,
  COLOR_PICKER_GRID,
  type CustomCharacterConfig,
  HAIR_PRESETS,
  ONESET_PRESETS,
  SHOE_PRESETS,
  SKIN_TONE_PRESETS,
  SPECIES_PRESETS,
  TOP_PRESETS,
  applyCharacterDesignPrompt,
  buildCharacterTraitsSummary,
  buildDeterministicCharacterFromPalette,
  createDefaultCustomCharacter,
  customCharacterToEngineLook,
  extractFrameAndPaletteFromMediaFile,
  getSkinToneLabel,
  normalizeAiPhotoCharacterResponse,
  saveCustomCharacter,
} from '../utils/custom-character.ts';

interface CharacterBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCharacter?: CustomCharacterConfig | null;
  onSaveAndUse: (saved: CustomCharacterConfig) => void;
  themeMode?: 'dark' | 'light';
}

interface ColorModalTarget {
  label: string;
  currentColor: string;
  onApply: (hex: string) => void;
}

/**
 * Renders a static cropped mini canvas thumbnail of a character with one specific preset applied.
 * Runs a single synchronous canvas draw per mount/prop change — no RAF loop.
 */
const PartThumbnailCanvas: React.FC<{
  draft: CustomCharacterConfig;
  focus: 'head' | 'full' | 'top' | 'bottom' | 'shoes';
  overrideCfg: Partial<CustomCharacterConfig>;
  darkStage?: boolean;
  size?: number;
}> = ({ draft, focus, overrideCfg, darkStage = false, size = 56 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.round(size * dpr);
    if (canvas.width !== px || canvas.height !== px) {
      canvas.width = px;
      canvas.height = px;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const previewDraft: CustomCharacterConfig = { ...draft, ...overrideCfg };
    const mapped = customCharacterToEngineLook(previewDraft, 'depan');
    const s = createSatsetSContext(ctx, 0.35, 3, darkStage ? 'night' : 'paper', 'modern', undefined, {
      finish: 'flat',
      dark: darkStage,
      character: {
        id: previewDraft.id,
        label: previewDraft.name,
        gender: mapped.gender,
        look: mapped.look,
      },
    });

    if (focus === 'head') {
      s.person(size * 0.5, size * 2.18, { pose: 'stand', size: size * 2.0, facing: 1 });
    } else if (focus === 'top') {
      s.person(size * 0.5, size * 1.56, { pose: 'stand', size: size * 1.55, facing: 1 });
    } else if (focus === 'bottom') {
      s.person(size * 0.5, size * 0.92, { pose: 'stand', size: size * 1.65, facing: 1 });
    } else if (focus === 'shoes') {
      s.person(size * 0.5, size * 0.78, { pose: 'stand', size: size * 2.1, facing: 1 });
    } else {
      s.person(size * 0.5, size * 0.94, { pose: 'stand', size: size * 0.92, facing: 1 });
    }
  }, [draft, focus, overrideCfg, darkStage, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="pointer-events-none select-none shrink-0"
      aria-hidden="true"
    />
  );
};

/**
 * Downscales an uploaded photo on an offscreen canvas so base64 stays light & fast for Gemini analysis.
 */
async function compressImageFileToBase64(file: File): Promise<{ base64: string; mimeType: string; previewUrl: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.readAsDataURL(file);
  });

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 1024;
      const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = c.toDataURL('image/jpeg', 0.85);
        resolve({
          base64: compressed.replace(/^data:[^;]+;base64,/, ''),
          mimeType: 'image/jpeg',
          previewUrl: compressed,
        });
      } else {
        resolve({
          base64: dataUrl.replace(/^data:[^;]+;base64,/, ''),
          mimeType: file.type || 'image/jpeg',
          previewUrl: dataUrl,
        });
      }
    };
    img.onerror = () => {
      resolve({
        base64: dataUrl.replace(/^data:[^;]+;base64,/, ''),
        mimeType: file.type || 'image/jpeg',
        previewUrl: dataUrl,
      });
    };
    img.src = dataUrl;
  });
}

export const CharacterBuilderModal: React.FC<CharacterBuilderModalProps> = ({
  isOpen,
  onClose,
  initialCharacter,
  onSaveAndUse,
  themeMode = 'light',
}) => {
  const [draft, setDraft] = useState<CustomCharacterConfig>(() =>
    initialCharacter ? { ...initialCharacter } : createDefaultCustomCharacter()
  );
  const [viewMode, setViewMode] = useState<BuilderViewMode>('depan');
  const [poseIndex, setPoseIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<BuilderTabId>('dasar');
  const [stageThemeDark, setStageThemeDark] = useState<boolean>(themeMode === 'dark');

  // Color Picker Sub-Modal state
  const [colorModal, setColorModal] = useState<ColorModalTarget | null>(null);
  const [pickerHex, setPickerHex] = useState<string>('#2563eb');

  // Photo / Video AI Upload Drawer / State
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>('');
  const [photoLoading, setPhotoLoading] = useState<boolean>(false);
  const [photoError, setPhotoError] = useState<string>('');
  const [designPromptInput, setDesignPromptInput] = useState<string>('');
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const stageCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(
      initialCharacter
        ? { ...initialCharacter }
        : createDefaultCustomCharacter()
    );
    setViewMode('depan');
    setPoseIndex(0);
    setActiveTab('dasar');
    setPhotoError('');
    setPhotoPreviewUrl(initialCharacter?.referenceMediaUrl || '');
    setDesignPromptInput(initialCharacter?.extraNote || '');
    setStageThemeDark(themeMode === 'dark');
  }, [isOpen, initialCharacter, themeMode]);

  // Live Character Stage Rendering (static single draw on Depan/Samping/Belakang, throttled ~24fps on Gerak)
  useEffect(() => {
    if (!isOpen) return;
    const canvas = stageCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 360;
    const h = 300;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    let rafId = 0;
    const startWall = performance.now();
    let lastDraw = 0;
    const activePoseObj = BUILDER_VIEW_POSES[poseIndex] || BUILDER_VIEW_POSES[0];

    const render = (now: number) => {
      if (viewMode === 'gerak' && lastDraw && now - lastDraw < 42) {
        rafId = requestAnimationFrame(render);
        return;
      }
      lastDraw = now;

      const t = viewMode === 'gerak' ? (now - startWall) / 1000 : 0.35;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Soft warm beige stage or deep navy studio stage
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      if (stageThemeDark) {
        grad.addColorStop(0, '#091532');
        grad.addColorStop(1, '#111f42');
      } else {
        grad.addColorStop(0, '#f4f1ea');
        grad.addColorStop(1, '#e7e2d8');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Floor oval shadow under feet
      const floorY = h * 0.84;
      ctx.fillStyle = stageThemeDark ? 'rgba(0,0,0,0.42)' : 'rgba(15,23,42,0.12)';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, floorY + 4, 48, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      const mapped = customCharacterToEngineLook(draft, viewMode);
      const s = createSatsetSContext(
        ctx,
        t,
        4,
        stageThemeDark ? 'night' : 'paper',
        'modern',
        undefined,
        {
          finish: 'flat',
          dark: stageThemeDark,
          character: {
            id: draft.id,
            label: draft.name,
            gender: mapped.gender,
            look: mapped.look,
          },
        }
      );

      s.person(w * 0.5, floorY, {
        pose: viewMode === 'gerak' ? activePoseObj.pose : 'stand',
        size: 210,
        facing: 1,
        turn: viewMode === 'samping' ? 1 : undefined,
        view: viewMode === 'belakang' ? 'back' : undefined,
      });

      if (viewMode === 'gerak') {
        rafId = requestAnimationFrame(render);
      }
    };

    render(startWall);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isOpen, draft, viewMode, poseIndex, stageThemeDark]);

  if (!isOpen) return null;

  const openColorDialog = (label: string, currentColor: string, onApply: (hex: string) => void) => {
    soundEngine.playSfx('tap');
    const clean = /^#[0-9a-fA-F]{6}$/.test(currentColor) ? currentColor : '#2563eb';
    setPickerHex(clean);
    setColorModal({ label, currentColor: clean, onApply });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setPhotoError('');
    setPhotoLoading(true);
    try {
      const extracted = await extractFrameAndPaletteFromMediaFile(file);
      setPhotoPreviewUrl(extracted.previewUrl);

      try {
        const resp = await fetch('/api/character/from-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: extracted.base64,
            mimeType: extracted.mimeType,
            hintName: draft.name,
            customPrompt: designPromptInput,
            dominantPalette: extracted.dominantPalette,
          }),
        });
        const data = await resp.json().catch(() => ({} as any));
        const presetPayload = data?.characterPreset || data?.character;
        if (resp.ok && presetPayload) {
          const matched = normalizeAiPhotoCharacterResponse(presetPayload, draft);
          setDraft({
            ...matched,
            referenceMediaUrl: extracted.previewUrl,
            referenceMediaType: extracted.mediaType,
            extraNote: designPromptInput || matched.extraNote,
          });
          soundEngine.playSfx('ding');
          return;
        }
      } catch {
        // Fall through to deterministic palette + prompt builder
      }

      const fallbackMatched = buildDeterministicCharacterFromPalette(
        extracted.dominantPalette,
        designPromptInput,
        draft
      );
      setDraft({
        ...fallbackMatched,
        referenceMediaUrl: extracted.previewUrl,
        referenceMediaType: extracted.mediaType,
      });
      soundEngine.playSfx('ding');
    } catch (err: any) {
      setPhotoError(err?.message || 'Gagal menganalisis media referensi.');
      soundEngine.playSfx('tap');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleApplyDesignPrompt = () => {
    if (!designPromptInput.trim()) return;
    soundEngine.playSfx('pop');
    setDraft((prev) => applyCharacterDesignPrompt(designPromptInput, prev));
  };

  const handleToggleAccessory = (accId: string) => {
    soundEngine.playSfx('click');
    setDraft((prev) => {
      const exists = prev.accessories.includes(accId);
      const nextAcc = exists
        ? prev.accessories.filter((a) => a !== accId)
        : [...prev.accessories, accId];
      const nextColors = { ...prev.accessoryColors };
      if (!exists && !nextColors[accId]) {
        const preset = ACCESSORY_PRESETS.find((p) => p.id === accId);
        if (preset) nextColors[accId] = preset.defaultColor;
      }
      return { ...prev, accessories: nextAcc, accessoryColors: nextColors };
    });
  };

  const handleSave = () => {
    soundEngine.playSfx('pop');
    const effectiveDraft =
      designPromptInput.trim() && designPromptInput.trim() !== (draft.extraNote || '').trim()
        ? applyCharacterDesignPrompt(designPromptInput.trim(), draft)
        : draft;
    const cleanName = effectiveDraft.name.trim() || 'Karakter Kustom';
    const finalized: CustomCharacterConfig = {
      ...effectiveDraft,
      id: effectiveDraft.id.startsWith('custom_')
        ? effectiveDraft.id
        : `custom_${Date.now().toString(36)}`,
      name: cleanName,
      updatedAt: Date.now(),
    };
    saveCustomCharacter(finalized);
    onSaveAndUse(finalized);
    onClose();
  };

  const activeHairPreset = HAIR_PRESETS.find((h) => h.id === draft.hairStyle) || HAIR_PRESETS[1];
  const activeOneSet = ONESET_PRESETS.find((o) => o.id === draft.oneSetId) || ONESET_PRESETS[0];
  const activeTop = TOP_PRESETS.find((t) => t.id === draft.topStyle) || TOP_PRESETS[0];
  const activeBottom = BOTTOM_PRESETS.find((b) => b.id === draft.bottomStyle) || BOTTOM_PRESETS[0];
  const activeShoe = SHOE_PRESETS.find((s) => s.id === draft.shoeStyle) || SHOE_PRESETS[0];
  const traitsSummary = buildCharacterTraitsSummary(draft);
  const currentGerakPose = BUILDER_VIEW_POSES[poseIndex] || BUILDER_VIEW_POSES[0];

  const isDark = stageThemeDark;

  const TABS: Array<{ id: BuilderTabId; label: string }> = [
    { id: 'dasar', label: 'Dasar' },
    { id: 'rambut', label: 'Rambut' },
    { id: 'oneset', label: 'One-set' },
    { id: 'baju', label: 'Baju' },
    { id: 'bawahan', label: 'Bawahan' },
    { id: 'sepatu', label: 'Sepatu' },
    { id: 'aksesoris', label: 'Aksesoris' },
    { id: 'nama', label: 'Nama' },
    { id: 'foto_ai', label: 'Foto AI' },
  ];

  return (
    <>
      <div
        data-testid="character-builder-modal"
        className="fixed inset-0 z-55 bg-black/75 flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <div
          className={`w-full max-w-2xl h-[96vh] sm:h-[90vh] rounded-t-3xl sm:rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${
            isDark
              ? 'bg-[#041029] border-sky-400/25 text-slate-100'
              : 'bg-white border-zinc-200 text-zinc-900'
          }`}
        >
          {/* Top App Bar */}
          <div
            className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${
              isDark ? 'border-sky-400/20 bg-[#041029]' : 'border-zinc-100 bg-white'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex items-center gap-1.5 font-extrabold text-sm transition cursor-pointer ${
                isDark ? 'text-slate-100 hover:text-sky-300' : 'text-zinc-900 hover:text-blue-600'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>CharacterBuilder</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="builder-open-photo-ai-btn"
                onClick={() => {
                  soundEngine.playSfx('tap');
                  setActiveTab('foto_ai');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer border ${
                  activeTab === 'foto_ai'
                    ? 'bg-gradient-to-r from-[#2563EB] to-[#0ea5e9] text-white border-transparent shadow-sm'
                    : isDark
                    ? 'bg-sky-400/15 border-sky-400/35 text-sky-300 hover:bg-sky-400/25'
                    : 'bg-sky-50 border-blue-200 text-blue-700 hover:bg-sky-100'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Dari Foto AI</span>
              </button>

              <button
                type="button"
                onClick={() => setStageThemeDark((prev) => !prev)}
                aria-label="Ubah tema panggung"
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1 border transition cursor-pointer ${
                  isDark
                    ? 'bg-[#071636] border-sky-400/25 text-slate-300 hover:text-white'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isDark ? 'Terang' : 'Bulan tema'}</span>
              </button>
            </div>
          </div>

          {/* Live Stage Area + 4 View Modes */}
          <div
            className={`px-4 pt-3 pb-2.5 border-b shrink-0 flex flex-col items-center ${
              isDark ? 'bg-[#06122e] border-sky-400/15' : 'bg-[#f4f1ea] border-zinc-200/80'
            }`}
          >
            <div className="relative w-full max-w-[260px] h-[168px] sm:h-[188px] rounded-2xl overflow-hidden flex items-center justify-center">
              <canvas
                ref={stageCanvasRef}
                data-testid="character-builder-stage-canvas"
                className="w-full h-full object-contain"
              />

              {viewMode === 'gerak' && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playSfx('tap');
                    setPoseIndex((prev) => (prev + 1) % BUILDER_VIEW_POSES.length);
                  }}
                  className="absolute bottom-2 inset-x-0 mx-auto w-fit px-3 py-1 rounded-full bg-white/90 text-zinc-800 text-[11px] font-bold shadow border border-zinc-200/80 flex items-center gap-1.5 cursor-pointer hover:bg-white transition"
                >
                  <span>{currentGerakPose.label}</span>
                  <RotateCw className="w-3 h-3 text-blue-600" />
                </button>
              )}
            </div>

            {/* 4 View Pill Selector: Depan | Samping | Belakang | Gerak */}
            <div
              className={`mt-2 inline-flex p-1 rounded-xl border ${
                isDark ? 'bg-[#041029] border-sky-400/20' : 'bg-white border-zinc-200 shadow-2xs'
              }`}
            >
              {(
                [
                  { id: 'depan', label: 'Depan' },
                  { id: 'samping', label: 'Samping' },
                  { id: 'belakang', label: 'Belakang' },
                  { id: 'gerak', label: 'Gerak' },
                ] as const
              ).map((vm) => (
                <button
                  key={vm.id}
                  type="button"
                  data-testid={`builder-view-${vm.id}`}
                  onClick={() => {
                    soundEngine.playSfx('tap');
                    setViewMode(vm.id);
                  }}
                  className={`px-3.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                    viewMode === vm.id
                      ? isDark
                        ? 'bg-sky-400 text-slate-950 shadow-xs'
                        : 'bg-zinc-900 text-white shadow-xs'
                      : isDark
                      ? 'text-slate-300 hover:text-white'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {vm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Horizontal Category Tabs (Dasar, Rambut, One-set, Baju, Bawahan, Sepatu, Aksesoris, Nama, Foto AI) */}
          <div
            className={`px-3 border-b flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 ${
              isDark ? 'border-sky-400/15 bg-[#041029]' : 'border-zinc-200 bg-white'
            }`}
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`builder-tab-${tab.id}`}
                  onClick={() => {
                    soundEngine.playSfx('tap');
                    setActiveTab(tab.id);
                  }}
                  className={`px-3 py-2.5 text-xs font-extrabold whitespace-nowrap border-b-2 transition cursor-pointer inline-flex items-center gap-1 ${
                    active
                      ? isDark
                        ? 'border-sky-400 text-sky-300'
                        : 'border-zinc-900 text-zinc-900'
                      : isDark
                      ? 'border-transparent text-slate-400 hover:text-slate-200'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  {tab.id === 'foto_ai' && <Camera className="w-3 h-3 text-blue-500" />}
                  <span>{tab.label}</span>
                  {tab.id === 'aksesoris' && draft.accessories.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] leading-tight">
                      {draft.accessories.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Scrollable Tab Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Hidden file input always mounted so both Foto/Video AI tab and shortcut trigger work */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handlePhotoUpload}
              className="hidden"
              data-testid="builder-photo-file-input"
            />

            {/* TAB: FOTO AI */}
            {activeTab === 'foto_ai' && (
              <div className="space-y-4">
                <div
                  className={`rounded-2xl border p-4 sm:p-5 space-y-3.5 ${
                    isDark ? 'bg-[#071636] border-sky-400/25' : 'bg-sky-50/70 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#0ea5e9] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm">Desain Karakter Konsisten dari Foto / Video &amp; Prompt</h4>
                      <p className={`text-xs mt-0.5 leading-relaxed ${isDark ? 'text-slate-300' : 'text-zinc-600'}`}>
                        Upload foto atau video seseorang, atau ketik arahan desain karaktermu. Sistem membaca warna kulit, gaya rambut/hijab, pakaian, serta aksesoris lalu menjadikannya narator visual yang konsisten di seluruh scene video.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-sky-400">
                      Instruksi Desain / Edit Karakter AI (Manusia / Humanoid)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={designPromptInput}
                        onChange={(e) => setDesignPromptInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyDesignPrompt();
                          }
                        }}
                        placeholder="Contoh: humanoid rubah biru berpakaian modern dan aksesoris kacamata..."
                        data-testid="builder-design-prompt-input"
                        className={`flex-1 rounded-xl px-3 py-2 text-xs border focus:outline-none ${
                          isDark
                            ? 'bg-[#041029] border-sky-400/30 text-slate-100 placeholder:text-slate-500'
                            : 'bg-white border-blue-200 text-zinc-900 placeholder:text-zinc-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleApplyDesignPrompt}
                        data-testid="builder-apply-design-prompt-btn"
                        className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-extrabold transition cursor-pointer shrink-0"
                      >
                        Terapkan Desain
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                    <button
                      type="button"
                      disabled={photoLoading}
                      onClick={() => photoInputRef.current?.click()}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#0ea5e9] hover:brightness-105 text-white text-xs font-extrabold inline-flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-60"
                    >
                      <Upload className="w-4 h-4" />
                      <span>
                        {photoLoading
                          ? 'Menganalisis referensi foto/video...'
                          : 'Upload Foto / Video Referensi'}
                      </span>
                    </button>

                    {photoPreviewUrl && (
                      <div className="flex items-center gap-2.5">
                        <img
                          src={photoPreviewUrl}
                          alt="Referensi karakter"
                          className="w-12 h-12 rounded-xl object-cover border border-blue-400/40 shadow-xs"
                        />
                        <span className={`text-[11px] font-semibold ${isDark ? 'text-sky-300' : 'text-blue-700'}`}>
                          {photoLoading ? 'Memindai detail penampilan...' : 'Referensi karakter aktif & konsisten!'}
                        </span>
                      </div>
                    )}
                  </div>

                  {photoError && (
                    <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-500 text-xs font-semibold flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{photoError}</span>
                    </div>
                  )}

                  {draft.photoObservation && !photoError && (
                    <div
                      className={`p-3 rounded-xl border text-xs leading-relaxed ${
                        isDark
                          ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}
                    >
                      <strong className="block mb-0.5">Karakter Konsisten Siap Digunakan:</strong>
                      {draft.photoObservation} — Kamu masih bisa menyempurnakan bagian apa pun di tab Dasar, Rambut, Baju, atau Aksesoris.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: DASAR (AI Prompt Desain + Wujud/Spesies + Gender + Warna Kulit/Bulu + Foto AI shortcut) */}
            {activeTab === 'dasar' && (
              <div className="space-y-5">
                {/* AI Character Design Prompt Box directly in Dasar tab */}
                <div
                  className={`p-3.5 rounded-2xl border space-y-2.5 ${
                    isDark ? 'bg-[#071636]/95 border-sky-400/30' : 'bg-sky-50/75 border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold inline-flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                      Buat Desain Karakter Narator AI dari Teks
                    </span>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={photoLoading}
                      className="px-2.5 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[10px] font-extrabold inline-flex items-center gap-1 shrink-0 transition cursor-pointer"
                    >
                      <Camera className="w-3 h-3" />
                      <span>{photoLoading ? 'Memindai...' : 'Upload Foto'}</span>
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={designPromptInput}
                      onChange={(e) => setDesignPromptInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyDesignPrompt();
                        }
                      }}
                      placeholder="Contoh: humanoid rubah biru berpakaian modern dan aksesoris kacamata"
                      data-testid="builder-dasar-design-prompt-input"
                      className={`flex-1 rounded-xl px-3 py-2 text-xs border focus:outline-none ${
                        isDark
                          ? 'bg-[#041029] border-sky-400/30 text-slate-100 placeholder:text-slate-500'
                          : 'bg-white border-blue-200 text-zinc-900 placeholder:text-zinc-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleApplyDesignPrompt}
                      data-testid="builder-dasar-apply-prompt-btn"
                      className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-extrabold transition cursor-pointer shrink-0"
                    >
                      Buat Desain AI
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
                          setDesignPromptInput(sample);
                          soundEngine.playSfx('click');
                          setDraft((prev) => applyCharacterDesignPrompt(sample, prev));
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition cursor-pointer ${
                          isDark
                            ? 'bg-[#041029]/80 border-sky-400/20 text-sky-300 hover:border-sky-400/50'
                            : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
                        }`}
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>

                {photoError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-500 text-xs font-semibold">
                    {photoError}
                  </div>
                )}

                {/* Wujud / Spesies Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold">Wujud / Spesies Karakter</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SPECIES_PRESETS.map((sp) => {
                      const active = (draft.species || 'human') === sp.id;
                      return (
                        <button
                          key={sp.id}
                          type="button"
                          data-testid={`builder-species-${sp.id}`}
                          onClick={() => {
                            soundEngine.playSfx('click');
                            setDraft((prev) => ({
                              ...prev,
                              species: sp.id,
                              earStyle: sp.earStyle,
                              muzzleStyle: sp.muzzleStyle,
                              tailStyle: sp.tailStyle,
                              furPrimaryColor:
                                sp.id === 'human' ? undefined : sp.defaultPrimaryColor,
                              furSecondaryColor:
                                sp.id === 'human' ? undefined : sp.defaultSecondaryColor,
                              skinColor: sp.defaultPrimaryColor,
                              hairColor:
                                sp.id === 'human' ? prev.hairColor : sp.defaultPrimaryColor,
                              name:
                                sp.id === 'human'
                                  ? prev.name
                                  : sp.label,
                            }));
                          }}
                          className={`px-2.5 py-2 rounded-xl border text-[11px] font-extrabold transition cursor-pointer flex items-center gap-2 ${
                            active
                              ? isDark
                                ? 'bg-sky-400/20 border-sky-400 text-sky-200'
                                : 'bg-white border-zinc-900 text-zinc-900 ring-1 ring-zinc-900'
                              : isDark
                              ? 'bg-[#071636] border-sky-400/20 text-slate-400 hover:text-white'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0"
                            style={{ backgroundColor: sp.defaultPrimaryColor }}
                          />
                          <span className="truncate">{sp.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-extrabold">Gender</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(
                      [
                        { id: 'cowok', label: 'Cowok' },
                        { id: 'cewek', label: 'Cewek' },
                      ] as const
                    ).map((g) => {
                      const active = draft.gender === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            soundEngine.playSfx('click');
                            setDraft((prev) => ({
                              ...prev,
                              gender: g.id,
                              hairStyle:
                                g.id === 'cewek' && prev.hairStyle === 'lurus_rapi'
                                  ? 'gondrong'
                                  : g.id === 'cowok' && prev.hairStyle === 'gondrong'
                                  ? 'lurus_rapi'
                                  : prev.hairStyle,
                            }));
                          }}
                          className={`py-2.5 rounded-xl border text-xs font-extrabold transition cursor-pointer ${
                            active
                              ? isDark
                                ? 'bg-sky-400/20 border-sky-400 text-sky-200'
                                : 'bg-white border-zinc-900 text-zinc-900 ring-1 ring-zinc-900'
                              : isDark
                              ? 'bg-[#071636] border-sky-400/20 text-slate-400 hover:text-white'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                          }`}
                        >
                          {g.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-extrabold">Warna kulit</span>
                    <span className={isDark ? 'text-slate-400' : 'text-zinc-500'}>
                      {getSkinToneLabel(draft.skinColor)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {SKIN_TONE_PRESETS.map((tone) => {
                      const active = draft.skinColor.toLowerCase() === tone.hex.toLowerCase();
                      return (
                        <button
                          key={tone.id}
                          type="button"
                          title={tone.label}
                          aria-label={`Warna kulit ${tone.label}`}
                          onClick={() => {
                            soundEngine.playSfx('tap');
                            setDraft((prev) => ({ ...prev, skinColor: tone.hex }));
                          }}
                          style={{ backgroundColor: tone.hex }}
                          className={`w-9 h-9 rounded-full border-2 transition cursor-pointer ${
                            active
                              ? 'border-blue-600 ring-2 ring-blue-500/40 scale-105'
                              : 'border-zinc-300/80 hover:scale-105'
                          }`}
                        />
                      );
                    })}
                    <button
                      type="button"
                      onClick={() =>
                        openColorDialog('Warna kulit', draft.skinColor, (hex) =>
                          setDraft((prev) => ({ ...prev, skinColor: hex }))
                        )
                      }
                      className={`px-3 py-1.5 rounded-full border text-[11px] font-bold transition cursor-pointer ${
                        isDark
                          ? 'bg-[#071636] border-sky-400/25 text-sky-300 hover:border-sky-400'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      Pilih warna lain...
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: RAMBUT */}
            {activeTab === 'rambut' && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {HAIR_PRESETS.map((preset) => {
                    const active = draft.hairStyle === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playSfx('click');
                          setDraft((prev) => ({ ...prev, hairStyle: preset.id }));
                        }}
                        className={`relative p-1.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                          active
                            ? isDark
                              ? 'bg-sky-400/15 border-sky-400 ring-1 ring-sky-400'
                              : 'bg-sky-50/70 border-zinc-900 ring-1 ring-zinc-900'
                            : isDark
                            ? 'bg-[#071636] border-sky-400/15 hover:border-sky-400/40'
                            : 'bg-zinc-50/60 border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        {active && (
                          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-zinc-900 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                        <PartThumbnailCanvas
                          draft={draft}
                          focus="head"
                          overrideCfg={{ hairStyle: preset.id, oneSetId: 'none' }}
                          darkStage={isDark}
                          size={50}
                        />
                        <span className="text-[10px] font-bold text-center leading-tight line-clamp-2">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {draft.hairStyle !== 'botak' && (
                  <div className={`pt-2 border-t space-y-2 ${isDark ? 'border-sky-400/15' : 'border-zinc-100'}`}>
                    <span className="text-xs font-extrabold block">Warna {activeHairPreset.label}</span>
                    <button
                      type="button"
                      onClick={() =>
                        openColorDialog(`Warna ${activeHairPreset.label}`, draft.hairColor, (hex) =>
                          setDraft((prev) => ({ ...prev, hairColor: hex }))
                        )
                      }
                      className={`inline-flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                        isDark ? 'bg-[#071636] border-sky-400/25' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      <span
                        className="w-6 h-6 rounded-full border border-zinc-300"
                        style={{ backgroundColor: draft.hairColor }}
                      />
                      <span>Rambut</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB: ONE-SET */}
            {activeTab === 'oneset' && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {ONESET_PRESETS.map((preset) => {
                    const active = draft.oneSetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playSfx('click');
                          const nextColors: Record<string, string> = {};
                          preset.colorSlots?.forEach((slot) => {
                            nextColors[slot.key] = slot.defaultColor;
                          });
                          setDraft((prev) => ({
                            ...prev,
                            oneSetId: preset.id,
                            oneSetColors: nextColors,
                          }));
                        }}
                        className={`relative p-1.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                          active
                            ? isDark
                              ? 'bg-sky-400/15 border-sky-400 ring-1 ring-sky-400'
                              : 'bg-sky-50/70 border-zinc-900 ring-1 ring-zinc-900'
                            : isDark
                            ? 'bg-[#071636] border-sky-400/15 hover:border-sky-400/40'
                            : 'bg-zinc-50/60 border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        {active && (
                          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-zinc-900 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                        {preset.id === 'none' ? (
                          <div className="w-[50px] h-[50px] flex items-center justify-center text-zinc-400">
                            <X className="w-6 h-6" />
                          </div>
                        ) : (
                          <PartThumbnailCanvas
                            draft={draft}
                            focus="full"
                            overrideCfg={{
                              oneSetId: preset.id,
                              oneSetColors: Object.fromEntries(
                                (preset.colorSlots || []).map((s) => [s.key, s.defaultColor])
                              ),
                            }}
                            darkStage={isDark}
                            size={50}
                          />
                        )}
                        <span className="text-[10px] font-bold text-center leading-tight line-clamp-2">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {activeOneSet.id !== 'none' && activeOneSet.colorSlots && (
                  <div className={`pt-2 border-t space-y-2 ${isDark ? 'border-sky-400/15' : 'border-zinc-100'}`}>
                    <span className="text-xs font-extrabold block">Warna {activeOneSet.label}</span>
                    <div className="flex flex-wrap gap-2.5">
                      {activeOneSet.colorSlots.map((slot) => {
                        const hex = draft.oneSetColors?.[slot.key] || slot.defaultColor;
                        return (
                          <button
                            key={slot.key}
                            type="button"
                            onClick={() =>
                              openColorDialog(`Warna ${slot.label}`, hex, (newHex) =>
                                setDraft((prev) => ({
                                  ...prev,
                                  oneSetColors: { ...prev.oneSetColors, [slot.key]: newHex },
                                }))
                              )
                            }
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                              isDark ? 'bg-[#071636] border-sky-400/25' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                            }`}
                          >
                            <span
                              className="w-6 h-6 rounded-full border border-zinc-300"
                              style={{ backgroundColor: hex }}
                            />
                            <span>{slot.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: BAJU */}
            {activeTab === 'baju' && (
              <div className="space-y-4">
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-zinc-500'}`}>
                  Bagian dalam hanya terlihat saat atasan bisa terbuka. Memilih baju melepas one-set seragam.
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {TOP_PRESETS.map((preset) => {
                    const active = draft.oneSetId === 'none' && draft.topStyle === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playSfx('click');
                          setDraft((prev) => ({ ...prev, oneSetId: 'none', topStyle: preset.id }));
                        }}
                        className={`relative p-1.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                          active
                            ? isDark
                              ? 'bg-sky-400/15 border-sky-400 ring-1 ring-sky-400'
                              : 'bg-sky-50/70 border-zinc-900 ring-1 ring-zinc-900'
                            : isDark
                            ? 'bg-[#071636] border-sky-400/15 hover:border-sky-400/40'
                            : 'bg-zinc-50/60 border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        {active && (
                          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-zinc-900 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                        <PartThumbnailCanvas
                          draft={draft}
                          focus="top"
                          overrideCfg={{ oneSetId: 'none', topStyle: preset.id }}
                          darkStage={isDark}
                          size={50}
                        />
                        <span className="text-[10px] font-bold text-center leading-tight line-clamp-2">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className={`pt-2 border-t space-y-2 ${isDark ? 'border-sky-400/15' : 'border-zinc-100'}`}>
                  <span className="text-xs font-extrabold block">Warna {activeTop.label}</span>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        openColorDialog(`Warna ${activeTop.label}`, draft.topColor, (hex) =>
                          setDraft((prev) => ({ ...prev, oneSetId: 'none', topColor: hex }))
                        )
                      }
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                        isDark ? 'bg-[#071636] border-sky-400/25' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      <span
                        className="w-6 h-6 rounded-full border border-zinc-300"
                        style={{ backgroundColor: draft.topColor }}
                      />
                      <span>{activeTop.hasInner ? 'Luar' : 'Baju'}</span>
                    </button>

                    {activeTop.hasInner && (
                      <button
                        type="button"
                        onClick={() =>
                          openColorDialog('Warna kaos dalam', draft.innerTopColor, (hex) =>
                            setDraft((prev) => ({ ...prev, oneSetId: 'none', innerTopColor: hex }))
                          )
                        }
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                          isDark ? 'bg-[#071636] border-sky-400/25' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        <span
                          className="w-6 h-6 rounded-full border border-zinc-300"
                          style={{ backgroundColor: draft.innerTopColor }}
                        />
                        <span>Kaos dalam</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: BAWAHAN */}
            {activeTab === 'bawahan' && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {BOTTOM_PRESETS.map((preset) => {
                    const active = draft.oneSetId === 'none' && draft.bottomStyle === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playSfx('click');
                          setDraft((prev) => ({ ...prev, oneSetId: 'none', bottomStyle: preset.id }));
                        }}
                        className={`relative p-1.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                          active
                            ? isDark
                              ? 'bg-sky-400/15 border-sky-400 ring-1 ring-sky-400'
                              : 'bg-sky-50/70 border-zinc-900 ring-1 ring-zinc-900'
                            : isDark
                            ? 'bg-[#071636] border-sky-400/15 hover:border-sky-400/40'
                            : 'bg-zinc-50/60 border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        {active && (
                          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-zinc-900 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                        <PartThumbnailCanvas
                          draft={draft}
                          focus="bottom"
                          overrideCfg={{ oneSetId: 'none', bottomStyle: preset.id }}
                          darkStage={isDark}
                          size={50}
                        />
                        <span className="text-[10px] font-bold text-center leading-tight line-clamp-2">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className={`pt-2 border-t space-y-2 ${isDark ? 'border-sky-400/15' : 'border-zinc-100'}`}>
                  <span className="text-xs font-extrabold block">Warna {activeBottom.label}</span>
                  <button
                    type="button"
                    onClick={() =>
                      openColorDialog(`Warna ${activeBottom.label}`, draft.bottomColor, (hex) =>
                        setDraft((prev) => ({ ...prev, oneSetId: 'none', bottomColor: hex }))
                      )
                    }
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                      isDark ? 'bg-[#071636] border-sky-400/25' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-full border border-zinc-300"
                      style={{ backgroundColor: draft.bottomColor }}
                    />
                    <span>{activeBottom.isSkirt ? 'Rok' : 'Celana'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: SEPATU */}
            {activeTab === 'sepatu' && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {SHOE_PRESETS.map((preset) => {
                    const active = draft.shoeStyle === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playSfx('click');
                          setDraft((prev) => ({ ...prev, shoeStyle: preset.id }));
                        }}
                        className={`relative p-1.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                          active
                            ? isDark
                              ? 'bg-sky-400/15 border-sky-400 ring-1 ring-sky-400'
                              : 'bg-sky-50/70 border-zinc-900 ring-1 ring-zinc-900'
                            : isDark
                            ? 'bg-[#071636] border-sky-400/15 hover:border-sky-400/40'
                            : 'bg-zinc-50/60 border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        {active && (
                          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-zinc-900 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                        <PartThumbnailCanvas
                          draft={draft}
                          focus="shoes"
                          overrideCfg={{ shoeStyle: preset.id }}
                          darkStage={isDark}
                          size={50}
                        />
                        <span className="text-[10px] font-bold text-center leading-tight line-clamp-2">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {draft.shoeStyle !== 'tanpa' && (
                  <div className={`pt-2 border-t space-y-2 ${isDark ? 'border-sky-400/15' : 'border-zinc-100'}`}>
                    <span className="text-xs font-extrabold block">Warna {activeShoe.label}</span>
                    <button
                      type="button"
                      onClick={() =>
                        openColorDialog(`Warna ${activeShoe.label}`, draft.shoeColor, (hex) =>
                          setDraft((prev) => ({ ...prev, shoeColor: hex }))
                        )
                      }
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                        isDark ? 'bg-[#071636] border-sky-400/25' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      <span
                        className="w-6 h-6 rounded-full border border-zinc-300"
                        style={{ backgroundColor: draft.shoeColor }}
                      />
                      <span>Sepatu</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB: AKSESORIS */}
            {activeTab === 'aksesoris' && (
              <div className="space-y-4">
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-zinc-500'}`}>
                  Boleh pilih lebih dari satu
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {/* None button clears all accessories */}
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playSfx('click');
                      setDraft((prev) => ({ ...prev, accessories: [], accessoryColors: {} }));
                    }}
                    className={`relative p-1.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      draft.accessories.length === 0
                        ? isDark
                          ? 'bg-sky-400/15 border-sky-400 ring-1 ring-sky-400'
                          : 'bg-sky-50/70 border-zinc-900 ring-1 ring-zinc-900'
                        : isDark
                        ? 'bg-[#071636] border-sky-400/15 hover:border-sky-400/40'
                        : 'bg-zinc-50/60 border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    <div className="w-[50px] h-[50px] flex items-center justify-center text-zinc-400">
                      <X className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold">Tanpa</span>
                  </button>

                  {ACCESSORY_PRESETS.map((acc) => {
                    const active = draft.accessories.includes(acc.id);
                    const focus =
                      acc.category === 'eyewear' || acc.category === 'headwear' || acc.category === 'face'
                        ? 'head'
                        : acc.category === 'prop'
                        ? 'full'
                        : 'top';
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => handleToggleAccessory(acc.id)}
                        className={`relative p-1.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                          active
                            ? isDark
                              ? 'bg-sky-400/15 border-sky-400 ring-1 ring-sky-400'
                              : 'bg-sky-50/70 border-zinc-900 ring-1 ring-zinc-900'
                            : isDark
                            ? 'bg-[#071636] border-sky-400/15 hover:border-sky-400/40'
                            : 'bg-zinc-50/60 border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        {active && (
                          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-zinc-900 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                        <PartThumbnailCanvas
                          draft={draft}
                          focus={focus}
                          overrideCfg={{
                            accessories: [acc.id],
                            accessoryColors: { [acc.id]: draft.accessoryColors?.[acc.id] || acc.defaultColor },
                          }}
                          darkStage={isDark}
                          size={50}
                        />
                        <span className="text-[10px] font-bold text-center leading-tight line-clamp-2">
                          {acc.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {draft.accessories.length > 0 && (
                  <div className={`pt-3 border-t space-y-3 ${isDark ? 'border-sky-400/15' : 'border-zinc-100'}`}>
                    {draft.accessories.map((accId) => {
                      const preset = ACCESSORY_PRESETS.find((a) => a.id === accId);
                      if (!preset) return null;
                      const hex = draft.accessoryColors?.[accId] || preset.defaultColor;
                      return (
                        <div key={accId} className="space-y-1.5">
                          <span className="text-xs font-extrabold block">Warna {preset.label}</span>
                          <button
                            type="button"
                            onClick={() =>
                              openColorDialog(`Warna ${preset.label}`, hex, (newHex) =>
                                setDraft((prev) => ({
                                  ...prev,
                                  accessoryColors: { ...prev.accessoryColors, [accId]: newHex },
                                }))
                              )
                            }
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
                              isDark ? 'bg-[#071636] border-sky-400/25' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                            }`}
                          >
                            <span
                              className="w-5 h-5 rounded-full border border-zinc-300"
                              style={{ backgroundColor: hex }}
                            />
                            <span>{preset.colorLabel}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: NAMA & SIFAT */}
            {activeTab === 'nama' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold">Nama karakter</label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="mis. Mas Bro, Kak Rara"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-blue-500 ${
                      isDark
                        ? 'bg-[#071636] border-sky-400/25 text-slate-100'
                        : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold">Sifat</span>
                    <span className={isDark ? 'text-slate-400' : 'text-zinc-500'}>
                      Ditulis otomatis, dipakai AI saat membuat adegan
                    </span>
                  </div>
                  <div
                    data-testid="builder-traits-summary"
                    className={`rounded-xl border p-3.5 text-xs leading-relaxed ${
                      isDark
                        ? 'bg-[#071636] border-sky-400/20 text-slate-200'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                    }`}
                  >
                    {traitsSummary}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold">Catatan tambahan gaya / ekspresi (opsional)</label>
                  <input
                    type="text"
                    value={draft.extraNote || ''}
                    onChange={(e) => setDraft((prev) => ({ ...prev, extraNote: e.target.value }))}
                    placeholder="mis. pembawaan tenang, sering menunjuk grafik"
                    className={`w-full rounded-xl border px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 ${
                      isDark
                        ? 'bg-[#071636] border-sky-400/25 text-slate-100'
                        : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sticky Bottom Action Bar: Simpan & pakai */}
          <div
            className={`px-4 py-3 border-t shrink-0 ${
              isDark ? 'bg-[#041029] border-sky-400/20' : 'bg-white border-zinc-200'
            }`}
          >
            <button
              type="button"
              data-testid="builder-save-and-use-btn"
              onClick={handleSave}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#0ea5e9] hover:brightness-105 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition active:scale-[0.99] cursor-pointer"
            >
              Simpan &amp; pakai
            </button>
          </div>
        </div>
      </div>

      {/* Color Picker Sub-Modal: Pilih warna (matching video reference 0:20-0:22) */}
      {colorModal && (
        <div
          data-testid="builder-color-picker-modal"
          className="fixed inset-0 z-70 bg-black/75 flex items-center justify-center p-4"
        >
          <div
            className={`w-full max-w-sm rounded-3xl border p-5 shadow-2xl space-y-4 ${
              isDark
                ? 'bg-[#0c1a36] border-sky-400/30 text-slate-100'
                : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm">Pilih warna</h4>
              <span className={`text-[11px] font-semibold ${isDark ? 'text-sky-300' : 'text-zinc-500'}`}>
                {colorModal.label}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {COLOR_PICKER_GRID.map((swatch) => {
                const selected = pickerHex.toLowerCase() === swatch.hex.toLowerCase();
                return (
                  <button
                    key={swatch.hex}
                    type="button"
                    title={swatch.name}
                    aria-label={swatch.name}
                    onClick={() => {
                      soundEngine.playSfx('tap');
                      setPickerHex(swatch.hex);
                    }}
                    style={{ backgroundColor: swatch.hex }}
                    className={`h-11 rounded-xl border-2 transition cursor-pointer ${
                      selected
                        ? 'border-blue-500 ring-2 ring-blue-400/50 scale-105'
                        : 'border-zinc-300/60 hover:scale-105'
                    }`}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <label className="inline-flex items-center gap-2 text-xs font-extrabold cursor-pointer text-blue-500 hover:underline">
                <span>Sesuaikan</span>
                <input
                  type="color"
                  value={pickerHex}
                  onChange={(e) => setPickerHex(e.target.value)}
                  className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                />
              </label>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono opacity-75">{pickerHex}</span>
                <div
                  className="w-8 h-8 rounded-lg border border-zinc-400/50"
                  style={{ backgroundColor: pickerHex }}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setColorModal(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                Batal
              </button>
              <button
                type="button"
                data-testid="builder-color-setel-btn"
                onClick={() => {
                  soundEngine.playSfx('click');
                  colorModal.onApply(pickerHex);
                  setColorModal(null);
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#0ea5e9] text-white text-xs font-extrabold cursor-pointer"
              >
                Setel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

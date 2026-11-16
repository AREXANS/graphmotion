import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Wand2,
  Copy,
  Check,
  Send,
  Camera,
  RotateCcw,
  Play,
  ClipboardCheck,
  HelpCircle,
  Upload,
  Trash2,
} from 'lucide-react';
import { CustomStyleDefinition } from '../types/custom-style';
import {
  buildCustomStylePrompt,
  parseCustomStyleCode,
  saveCustomStyleToStorage,
  SAMPLE_CYBER_HUD_CODE,
} from '../utils/custom-style-parser';
import {
  renderSatsetStyleLiveDemoFrame,
  SATSET_CAPTION_MODES,
} from '../utils/custom-style-runtime';
import { soundEngine } from '../utils/audio-synth';
import { SendToAiModal } from './SendToAiModal';
import { PromptMediaAttachment, enrichPromptWithMedia } from '../utils/ai-platform-router';

interface CustomStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveStyle: (style: CustomStyleDefinition) => void;
  initialStyle?: CustomStyleDefinition | null;
}

const PRESET_EXAMPLES = [
  {
    name: 'Tanah liat',
    prompt:
      'Gaya stop-motion plastisin tanah liat claymation 3D bertekstur lembut, warna pastel hangat #FF9E7D #FFD166 #06D6A0, objek dengan lekukan tangan alami dan bayangan lembut. Komposisi dekat dengan kamera melayang halus.',
  },
  {
    name: 'Sketsa pensil',
    prompt:
      'Gaya sketsa pensil hitam putih arsir kasar di atas kertas buram bertekstur, garis tangan bergetar dinamis, goresan ekspresif dan arsir silang. Hindari warna pekat atau gradasi digital glossy.',
  },
  {
    name: 'Cyberpunk',
    prompt:
      'Wireframe neon HUD taktis sci-fi 3D tajam, garis scan bercahaya cyan elektrik #00E5FF dan aksen pink #FF0055 di atas latar grid komputasi gelap. Efek glow menyala dan angka digital berputar cepat.',
  },
  {
    name: 'Kartun anak',
    prompt:
      'Ilustrasi kartun anak 2D cerah ceria, garis outline tebal bulat rapi tanpa sudut tajam, warna primer ceria #FF4D4D #FFB800 #3B82F6. Gerakan membal lentur buncis dengan senyum ramah faceless.',
  },
];

export const CustomStyleModal: React.FC<CustomStyleModalProps> = ({
  isOpen,
  onClose,
  onSaveStyle,
  initialStyle,
}) => {
  // Inputs start empty by default as requested
  const [styleName, setStyleName] = useState<string>(initialStyle?.name || '');
  const [stylePrompt, setStylePrompt] = useState<string>(initialStyle?.prompt || '');
  const [pastedCode, setPastedCode] = useState<string>(initialStyle?.rawCode || '');

  const [showFormatErrorModal, setShowFormatErrorModal] = useState(false);
  const [hasRevisions, setHasRevisions] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [activePreviewChapter, setActivePreviewChapter] = useState(1);
  const [previewPlaying, setPreviewPlaying] = useState(true);
  const [refImages, setRefImages] = useState<PromptMediaAttachment[]>([]);
  const [isAiPickerOpen, setIsAiPickerOpen] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const refImgInputRef = useRef<HTMLInputElement | null>(null);
  const firedModalSfxRef = useRef<Set<string>>(new Set());

  // Sync state when opening
  useEffect(() => {
    if (initialStyle) {
      setStyleName(initialStyle.name || '');
      setStylePrompt(initialStyle.prompt || '');
      setPastedCode(initialStyle.rawCode || '');
      setHasRevisions(true);
    } else {
      setStyleName('');
      setStylePrompt('');
      setPastedCode('');
      setHasRevisions(false);
    }
    setCopiedPrompt(false);
    setShowFormatErrorModal(false);
    setActivePreviewChapter(1);
  }, [isOpen, initialStyle]);

  // Key requirement: Salin prompt dan kirim AI hanya muncul ketika sudah mengisi nama DAN deskripsi prompt
  const isReadyForAi = Boolean(styleName.trim() && stylePrompt.trim());

  // Parse pasted code continuously
  const parseResult = useMemo(() => {
    return parseCustomStyleCode(pastedCode);
  }, [pastedCode]);

  const parsedStyle = parseResult.style;

  // Build the detailed prompt for AI enriched with any uploaded reference images
  const promptToSend = useMemo(() => {
    if (!styleName.trim() && !stylePrompt.trim()) {
      return '';
    }
    const base = buildCustomStylePrompt(styleName.trim() || 'Gaya Kustom', stylePrompt.trim());
    return enrichPromptWithMedia(base, refImages);
  }, [styleName, stylePrompt, refImages]);

  // Dynamic analysis ("Terbaca sebagai: objek 3D, menyala...")
  const detectedStyleTags = useMemo(() => {
    const text = (styleName + ' ' + stylePrompt).toLowerCase();
    const is3D = text.includes('3d') || text.includes('balok') || text.includes('silinder') || text.includes('bola') || text.includes('dimensi') || text.includes('clay') || text.includes('tanah liat');
    const isGlow = text.includes('glow') || text.includes('neon') || text.includes('cahaya') || text.includes('menyala') || text.includes('cyber');
    const isScribble = text.includes('sketsa') || text.includes('coretan') || text.includes('pensil') || text.includes('tangan') || text.includes('arsir');
    const isGlossy = text.includes('glossy') || text.includes('mengilap') || text.includes('kaca') || text.includes('glass');

    const look = is3D ? 'objek 3D' : '2D';
    let finish = 'clean';
    if (isGlow) finish = 'menyala';
    else if (isScribble) finish = 'sketsa';
    else if (isGlossy) finish = 'mengilap';

    return { look, finish };
  }, [styleName, stylePrompt]);

  // Copy prompt helper
  const copyPromptText = () => {
    if (!promptToSend) return;
    try {
      navigator.clipboard.writeText(promptToSend);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch {
      // fallback
    }
  };

  // Direct paste from clipboard handler (matches video 01:07 - 01:16)
  const handlePasteFromClipboard = async () => {
    try {
      let text = '';
      if (navigator.clipboard && navigator.clipboard.readText) {
        text = await navigator.clipboard.readText();
      }
      if (!text || text.trim().length === 0) {
        setShowFormatErrorModal(true);
        return;
      }
      setPastedCode(text);
      const res = parseCustomStyleCode(text);
      if (res.isValid && res.style) {
        setHasRevisions(true);
        if (res.style.name && !styleName) setStyleName(res.style.name);
        if (res.style.prompt && !stylePrompt) setStylePrompt(res.style.prompt);
        soundEngine.playSfx('ding');
      } else {
        setShowFormatErrorModal(true);
      }
    } catch {
      setShowFormatErrorModal(true);
    }
  };

  const handleRefImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.slice(0, 4).forEach((file, idx) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        if (!dataUrl) return;
        setRefImages((prev) => [
          ...prev,
          {
            id: `style-ref-${Date.now()}-${idx}`,
            key: `ref_gaya_${prev.length + 1}`,
            filename: file.name,
            type: 'image',
            url: dataUrl,
            sceneHint: `Referensi Gaya "${styleName.trim() || 'Kustom'}"`,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Send to AI: open AI target picker first before redirecting to the selected AI
  const handleSendToAi = () => {
    if (!promptToSend) return;
    soundEngine.playSfx('click');
    setIsAiPickerOpen(true);
  };

  // Load sample on demand for testing
  const handleLoadSample = () => {
    setStyleName('Cyber HUD Telemetry');
    setStylePrompt(
      'Gaya antarmuka taktis HUD neon 3D dengan bilah scan data cyan elektrik (#38BDF8), tombol kapsul bercahaya (#2563EB), dan kartu metrik modern di atas grid komputasi gelap (#020817).'
    );
    setPastedCode(SAMPLE_CYBER_HUD_CODE);
    setHasRevisions(true);
  };

  const [customCaptionOverride, setCustomCaptionOverride] = useState<string>('');

  const activePreviewChapterRef = useRef(activePreviewChapter);
  activePreviewChapterRef.current = activePreviewChapter;

  // Mini canvas player for previewing custom code with full satsetmotion.id 4-scene timeline, camera rig, transitions & subtitles
  useEffect(() => {
    if (!isOpen || !parsedStyle || !parsedStyle.scenes) return;

    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let localTime = 0;
    let lastStamp = performance.now();

    const loop = (stamp: number) => {
      const dt = Math.min(0.1, (stamp - lastStamp) / 1000);
      lastStamp = stamp;

      if (previewPlaying) {
        localTime += dt;
        if (localTime >= 3.0) {
          localTime = 0;
          firedModalSfxRef.current.clear();
          const nextChapter = (activePreviewChapterRef.current % 4) + 1;
          activePreviewChapterRef.current = nextChapter;
          soundEngine.playSfx('ding');
          setActivePreviewChapter(nextChapter);
        }
      }

      const w = canvas.width;
      const h = canvas.height;
      const globalTime = (activePreviewChapterRef.current - 1) * 3 + localTime;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const styleWithCaption: CustomStyleDefinition = customCaptionOverride
        ? { ...parsedStyle, caption: customCaptionOverride as any }
        : parsedStyle;

      renderSatsetStyleLiveDemoFrame(ctx, w, h, styleWithCaption.id, globalTime, {
        customStyle: styleWithCaption,
        captionOverride: customCaptionOverride || styleWithCaption.caption,
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, parsedStyle, previewPlaying, customCaptionOverride]);

  const handleApplyToProject = () => {
    if (!parsedStyle) return;
    const finalStyle: CustomStyleDefinition = customCaptionOverride
      ? { ...parsedStyle, caption: customCaptionOverride as any }
      : parsedStyle;
    saveCustomStyleToStorage(finalStyle);
    onSaveStyle(finalStyle);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
        <div className="bg-[#FAF8F5] rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
        
        {/* ============================================================== */}
        {/* HEADER                                                         */}
        {/* ============================================================== */}
        <div className="px-5 pt-5 pb-3 bg-white border-b border-zinc-100 flex items-start justify-between shrink-0">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-zinc-900 leading-tight">
              Buat gaya sendiri
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-lg leading-relaxed">
              Tulis bebas gaya visual yang kamu mau. Claude memakai tulisan ini untuk setiap animasi dan mendesain latarnya sendiri.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* SCROLLABLE BODY                                                */}
        {/* ============================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Field 1: Nama gaya */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-zinc-800">
              Nama gaya
            </label>
            <input
              type="text"
              value={styleName}
              onChange={(e) => setStyleName(e.target.value)}
              placeholder="mis. Tanah Liat, Komik Jadul, Brand Kopi Saya"
              className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
            />
          </div>

          {/* Field 2: Deskripsi / prompt gaya */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-800">
              Deskripsi / prompt gaya
            </label>
            <textarea
              rows={4}
              value={stylePrompt}
              onChange={(e) => setStylePrompt(e.target.value)}
              placeholder="Ceritakan seperti ke ilustrator: gaya gambarnya, warna, suasana, bentuk objek, dan cara geraknya. Makin detail, makin mirip."
              className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-xs sm:text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 leading-relaxed shadow-2xs"
            />

            {/* Contoh chips (Tanah liat, Sketsa pensil, Cyberpunk, Kartun anak) */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-zinc-500 font-medium mr-0.5">Contoh:</span>
              {PRESET_EXAMPLES.map((ex) => (
                <button
                  key={ex.name}
                  type="button"
                  onClick={() => {
                    setStyleName(ex.name);
                    setStylePrompt(ex.prompt);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 text-[11px] font-bold transition cursor-pointer"
                >
                  {ex.name}
                </button>
              ))}
            </div>
          </div>

          {/* ============================================================ */}
          {/* CARD 1: Dari foto referensi (opsional)                       */}
          {/* ============================================================ */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-zinc-700" />
                <span className="text-xs font-extrabold text-zinc-900">
                  Referensi Foto &amp; Karakteristik Gaya
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">
                  (opsional)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  ref={refImgInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleRefImageUpload}
                />
                <button
                  type="button"
                  onClick={() => refImgInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  <span>Unggah Gambar Referensi</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="px-2.5 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-extrabold transition cursor-pointer shadow-2xs"
                >
                  + Muat Demo Gaya (4 Scene Live)
                </button>
              </div>
            </div>

            {refImages.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {refImages.map((img) => (
                  <div
                    key={img.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200"
                  >
                    <img
                      src={img.url}
                      alt={img.filename}
                      className="w-8 h-8 rounded-lg object-cover border border-zinc-200"
                    />
                    <span className="text-[11px] font-semibold text-zinc-700 max-w-[120px] truncate">
                      {img.filename}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRefImages((prev) => prev.filter((item) => item.id !== img.id))}
                      className="text-zinc-400 hover:text-rose-600 p-0.5 cursor-pointer"
                      aria-label="Hapus gambar referensi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-zinc-600 leading-relaxed">
              Unggah foto/gambar referensi jika ada (akan ikut disiapkan saat kamu pilih AI), atau klik <strong>+ Muat Demo Gaya (4 Scene Live)</strong> untuk langsung mencoba preview 4 scene interaktif.
            </p>
          </div>

          {/* ============================================================ */}
          {/* CARD 2: Kembangkan dengan AI (opsional)                      */}
          {/* ============================================================ */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Wand2 className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-extrabold text-zinc-900">
                  Kembangkan dengan AI
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">
                  (opsional)
                </span>
              </div>
              {!isReadyForAi && (
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
                >
                  + Coba Contoh Jawaban AI
                </button>
              )}
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Cukup tulis ide kasar di kotak atas, mis. &quot;kayak iklan Apple tapi warna-warni&quot;. Saat kamu klik <strong>Kirim ke AI</strong>, kamu bisa memilih AI tujuan (Claude, ChatGPT, Gemini, dll) terlebih dahulu beserta prompt &amp; gambar referensinya.
            </p>

            {/* CONDITIONAL DISPLAY: */}
            {/* If NOT ready (user has not filled both name and prompt), show the placeholder box */}
            {!isReadyForAi ? (
              <div className="bg-[#FAF7F2] border border-dashed border-[#E5DECF] rounded-xl p-3.5 text-center text-xs text-zinc-500 font-medium">
                Tulis dulu nama atau ide gayanya di atas, atau klik <strong>+ Coba Contoh Jawaban AI</strong>.
              </div>
            ) : (
              /* If READY (user filled name and prompt), show Step 1 & Step 2 matching Screenshot 2 */
              <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                
                {/* STEP 1: Kirim perintah ke AI */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                      1
                    </span>
                    <span className="text-xs font-bold text-zinc-800">
                      Kirim perintah ke AI
                    </span>
                  </div>

                  <div className="relative flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleSendToAi}
                      className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-xs transition transform active:scale-95 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim ke AI</span>
                    </button>

                    {/* White button: Salin prompt gaya */}
                    <button
                      type="button"
                      onClick={copyPromptText}
                      className="px-4 py-2.5 bg-white hover:bg-zinc-50 active:bg-zinc-100 border border-zinc-300 text-zinc-800 font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-2xs transition cursor-pointer"
                    >
                      {copiedPrompt ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                          <span className="text-emerald-700">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Salin prompt gaya</span>
                        </>
                      )}
                    </button>

                    {/* Tooltip matching screenshot: "Klik di sini untuk mengirim perintah ke AI" */}
                    {showTooltip && (
                      <div
                        onClick={() => setShowTooltip(false)}
                        className="absolute left-10 -bottom-9 z-10 bg-zinc-900 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 animate-bounce cursor-pointer"
                      >
                        <div className="absolute -top-1 left-4 w-2 h-2 bg-zinc-900 rotate-45" />
                        <span>Klik di sini untuk mengirim perintah ke AI</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.querySelector('[data-testid="custom-style-paste-textarea"]') as HTMLTextAreaElement | null;
                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el?.focus();
                      }}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      Sudah punya kode? Tempel di sini
                    </button>
                  </div>
                </div>

                {/* STEP 2: Tempel jawaban AI */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                        2
                      </span>
                      <span className="text-xs font-bold text-zinc-800">
                        Tempel jawaban AI
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleLoadSample}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
                    >
                      + Coba Contoh Jawaban AI
                    </button>
                  </div>

                  {/* Dropzone Container matching Video (01:06 - 01:17) */}
                  <div className="relative border-2 border-dashed border-blue-400/90 rounded-2xl p-4 bg-white shadow-2xs space-y-3 flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <ClipboardCheck className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs sm:text-sm font-extrabold text-zinc-900">
                        Tempel jawaban AI di sini
                      </h4>
                      
                      {/* 3 Numbered Steps row */}
                      <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-[11px] text-zinc-600 pt-1">
                        <span className="flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-black">
                            1
                          </span>
                          <span>Tunggu AI selesai menjawab</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-black">
                            2
                          </span>
                          <span>Klik <strong>Copy</strong> di bawah jawabannya</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-black">
                            3
                          </span>
                          <span>Tahan kotak ini, pilih <strong>Tempel</strong></span>
                        </span>
                      </div>
                    </div>

                    {/* Direct Clipboard Paste Button */}
                    <button
                      type="button"
                      onClick={handlePasteFromClipboard}
                      className="px-4 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-700 text-xs font-extrabold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Tempel dari Clipboard</span>
                    </button>

                    {/* Textarea for pasting code */}
                    <textarea
                      data-testid="custom-style-paste-textarea"
                      rows={4}
                      value={pastedCode}
                      onChange={(e) => {
                        setPastedCode(e.target.value);
                        setHasRevisions(Boolean(e.target.value.trim()));
                      }}
                      placeholder="Tempel jawaban kode dari AI di sini..."
                      className="w-full bg-zinc-50/80 border border-zinc-200 rounded-xl p-3 text-xs font-mono text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 leading-relaxed text-left"
                    />
                  </div>

                  {/* Revision status banner */}
                  {(hasRevisions || parseResult.isValid) && (
                    <div className="p-2.5 px-3.5 rounded-xl bg-blue-50/80 border border-blue-200/90 flex items-center justify-between text-xs animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[11px] font-bold text-blue-950">
                          Sudah ada revisi: 01 penataan di template ini (terakhir diedit: pilih Tempel)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Preview when valid code is pasted */}
                  {parseResult.isValid && parsedStyle && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                          <span className="text-xs font-extrabold text-emerald-950">
                            Gaya berhasil diparse: {parsedStyle.name} ({parsedStyle.look}, {parsedStyle.finish})
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

                      {/* Mini Live Preview */}
                      <div className="bg-zinc-950 rounded-xl p-2.5 flex flex-col items-center gap-2">
                        <div className="w-full flex items-center justify-between text-[10px] text-zinc-400">
                          <span className="text-white font-bold">
                            Live Preview Scene {activePreviewChapter}/4 (Remotion + Transisi + Kamera)
                          </span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => setActivePreviewChapter(num)}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                                  activePreviewChapter === num
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400'
                                }`}
                              >
                                {num}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setPreviewPlaying(!previewPlaying)}
                              className="p-1 rounded bg-zinc-800 text-zinc-300 ml-1 cursor-pointer"
                            >
                              {previewPlaying ? <RotateCcw className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="w-full flex items-center justify-between gap-2 bg-zinc-900/90 px-2.5 py-1.5 rounded-lg border border-zinc-800">
                          <span className="text-[10px] font-bold text-zinc-300">Gaya Subtitle:</span>
                          <select
                            value={customCaptionOverride || parsedStyle.caption || 'pop'}
                            onChange={(e) => setCustomCaptionOverride(e.target.value)}
                            className="bg-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded border border-zinc-700 focus:outline-none"
                          >
                            {(SATSET_CAPTION_MODES as Array<{ id: string; label: string }>).map((cap) => (
                              <option key={cap.id} value={cap.id}>
                                {cap.label} ({cap.id})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="relative aspect-[9/16] w-44 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-lg">
                          <canvas
                            ref={previewCanvasRef}
                            width={360}
                            height={640}
                            className="w-full h-full object-cover block"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tag detector row */}
          <div className="px-1 text-[11px] text-zinc-500 leading-relaxed flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              Terbaca sebagai:{' '}
              <strong className="text-zinc-800 font-bold">{detectedStyleTags.look}</strong> ,{' '}
              <strong className="text-zinc-800 font-bold">{detectedStyleTags.finish}</strong> . Sebut
              &quot;2D&quot;, &quot;3D&quot;, &quot;neon&quot;, &quot;mengilap&quot;, atau &quot;sketsa&quot; di
              prompt untuk mengubahnya.
            </span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* FOOTER BAR                                                     */}
        {/* ============================================================== */}
        <div className="px-5 py-3.5 border-t border-zinc-200/80 bg-white flex items-center justify-between shrink-0 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl text-zinc-700 hover:text-zinc-900 font-extrabold text-xs transition hover:bg-zinc-100 border border-zinc-200 text-center cursor-pointer"
          >
            Batal
          </button>

          {parseResult.isValid ? (
            <button
              type="button"
              onClick={handleApplyToProject}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-extrabold text-xs shadow-md transition transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan &amp; pakai</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSendToAi}
              disabled={!isReadyForAi}
              className={`flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition transform active:scale-95 ${
                isReadyForAi
                  ? 'bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white cursor-pointer'
                  : 'bg-blue-300 text-white/80 cursor-not-allowed opacity-80'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim ke AI</span>
            </button>
          )}
        </div>
      </div>
    </div>

      {/* ============================================================== */}
      {/* POPUP MODAL: Oops! AI-nya belum pas formatnya... (Video 01:08) */}
      {/* ============================================================== */}
      {showFormatErrorModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-zinc-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-zinc-900 leading-snug">
                  Oops! AI-nya belum pas formatnya...
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Format jawaban AI belum sesuai format penataan
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Kami butuh script Remotion asli dari AI yang mengatur animasi, bukan deskripsi teks saja. Caranya tinggal:
            </p>

            <div className="space-y-2 text-xs text-zinc-700 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-100">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  <strong>Kirim atau salin prompt gaya:</strong> Klik tombol &quot;Kirim ke AI&quot; atau &quot;Salin prompt gaya&quot; di atas.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  <strong>Jalankan di AI pilihanmu:</strong> AI akan membuatkan blok koding gaya animasinya.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  <strong>Tempel di kotak &quot;Tempel jawaban AI di sini&quot;:</strong> Tekan tombol Tempel di bawah.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                  4
                </span>
                <span>
                  <strong>Selesai jawaban beres:</strong> Kalau sudah benar, otomatis muncul pratinjau animasinya di sini.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFormatErrorModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
              >
                Nanti saja
              </button>
              <button
                type="button"
                onClick={() => {
                  copyPromptText();
                  setShowFormatErrorModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin prompt lagi</span>
              </button>
            </div>
          </div>
        </div>
      )}
      <SendToAiModal
        isOpen={isAiPickerOpen}
        onClose={() => setIsAiPickerOpen(false)}
        title="Pilih AI untuk Buat Gaya Animasi"
        subtitle="Pilih platform AI tujuanmu — prompt spesifikasi gaya kustom & gambar referensi akan langsung dibuka ke AI pilihanmu."
        promptText={promptToSend}
        mediaItems={refImages}
        onDispatched={() => {
          setTimeout(() => {
            const el = document.querySelector('[data-testid="custom-style-paste-textarea"]') as HTMLTextAreaElement | null;
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el?.focus();
          }, 100);
        }}
      />
    </>
  );
};

import React, { useState } from 'react';
import {
  X,
  Send,
  Copy,
  Check,
  ExternalLink,
  Image as ImageIcon,
  Download,
  Bot,
  Terminal,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Link2,
} from 'lucide-react';
import {
  AI_PLATFORMS,
  type AiPlatformId,
  type AiPlatformOption,
  type PromptMediaAttachment,
  buildAiTargetUrl,
  enrichPromptWithMedia,
} from '../utils/ai-platform-router.ts';
import { type PromptSendMode } from '../types/satset.ts';
import { soundEngine } from '../utils/audio-synth.ts';
import { AiProviderIcon, type AiProviderId } from './AiPromptDispatchBox.tsx';

interface SendToAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  promptText: string;
  mediaItems?: PromptMediaAttachment[];
  sendMode?: PromptSendMode;
  onChangeSendMode?: (mode: PromptSendMode) => void;
  onDispatched?: (platform: AiPlatformOption, enrichedPrompt: string) => void;
}

/**
 * Converts any image URL or dataUrl into a PNG Blob via offscreen canvas
 * so it can be written directly to the browser clipboard for Ctrl+V into any AI chat.
 */
async function imageUrlToPngBlob(url: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 512;
        canvas.height = img.naturalHeight || img.height || 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => resolve(blob), 'image/png');
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export const SendToAiModal: React.FC<SendToAiModalProps> = ({
  isOpen,
  onClose,
  title = 'Kirim ke AI',
  subtitle = 'Pilih platform AI favoritmu — perintah sudah siap disalin dan langsung dibuka di tab baru.',
  promptText,
  mediaItems = [],
  sendMode = 'direct',
  onChangeSendMode,
  onDispatched,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedImgIdx, setCopiedImgIdx] = useState<number | null>(null);
  const [imgCopyHint, setImgCopyHint] = useState<string | null>(null);
  const [showHowTo, setShowHowTo] = useState(true);
  const [showRawPrompt, setShowRawPrompt] = useState(false);
  const [localSendMode, setLocalSendMode] = useState<PromptSendMode>(sendMode);

  if (!isOpen) return null;

  const activeMode = onChangeSendMode ? sendMode : localSendMode;
  const setMode = (mode: PromptSendMode) => {
    setLocalSendMode(mode);
    onChangeSendMode?.(mode);
  };

  const baseEnriched = enrichPromptWithMedia(promptText, mediaItems);
  const fullPrompt =
    activeMode === 'style_link'
      ? `Gunakan referensi panduan gaya Graph Motion Studio (${window.location.origin}/style-guide.md) untuk menjaga konsistensi kanvas dan karakter faceless.\n\n${baseEnriched}`
      : activeMode === 'md_file'
      ? `Baca file lampiran "perintah-graph-motion.md" yang saya unggah bersama pesan ini, lalu kerjakan seluruh instruksinya secara lengkap hingga batas === AKHIR PERINTAH ===.\n\nRingkasan cepat:\n${baseEnriched}`
      : baseEnriched;

  const copyPromptToClipboard = async () => {
    soundEngine.playSfx('click');
    try {
      await navigator.clipboard.writeText(fullPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2400);
    } catch {
      // ignore clipboard denial in restricted environments
    }
  };

  const handleDownloadPromptMd = () => {
    soundEngine.playSfx('tap');
    const blob = new Blob([baseEnriched], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'perintah-graph-motion.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const handleCopyImage = async (item: PromptMediaAttachment, idx: number) => {
    soundEngine.playSfx('click');
    setImgCopyHint(null);
    try {
      if (item.type === 'image' && typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        const pngBlob = await imageUrlToPngBlob(item.url);
        if (pngBlob) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
          setCopiedImgIdx(idx);
          setImgCopyHint(`Gambar "${item.filename}" tersalin — tekan Ctrl+V di chat AI setelah terbuka.`);
          setTimeout(() => setCopiedImgIdx(null), 2600);
          return;
        }
      }
      await navigator.clipboard.writeText(item.url);
      setCopiedImgIdx(idx);
      setImgCopyHint(`Tautan media "${item.filename}" tersalin ke clipboard.`);
      setTimeout(() => setCopiedImgIdx(null), 2400);
    } catch {
      setImgCopyHint('Gagal menyalin gambar otomatis — gunakan tombol Unduh di sampingnya untuk melampirkan file.');
    }
  };

  const handleDownloadMedia = (item: PromptMediaAttachment) => {
    soundEngine.playSfx('tap');
    const a = document.createElement('a');
    a.href = item.url;
    a.download = item.filename || 'media-aset.png';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSelectPlatform = (platform: AiPlatformOption) => {
    soundEngine.playSfx('whoosh');
    if (activeMode === 'md_file') {
      handleDownloadPromptMd();
    }
    try {
      const writePromise = navigator.clipboard?.writeText?.(fullPrompt);
      if (writePromise && typeof writePromise.catch === 'function') {
        writePromise.catch(() => {});
      }
    } catch {
      // fallback silently
    }

    const target = buildAiTargetUrl(platform.id as AiPlatformId, fullPrompt);
    const link = document.createElement('a');
    link.href = target.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onDispatched?.(platform, fullPrompt);
    onClose();
  };

  return (
    <div
      data-testid="ai-picker-modal"
      className="fixed inset-0 z-[70] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-[#07132c] text-slate-100 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-sky-400/30 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-sky-400/15 bg-[#040d21] flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white leading-snug">
                {title}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-relaxed">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pilihan AI"
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* 4-Step "Cara kirim ke AI" Walkthrough Guide */}
          <div className="rounded-2xl border border-sky-400/30 bg-[#081736] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowHowTo((prev) => !prev)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-white/5 transition cursor-pointer"
            >
              <span className="inline-flex items-center gap-2 text-xs font-extrabold text-sky-300">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                <span>Cara kirim ke AI (4 langkah mudah)</span>
              </span>
              {showHowTo ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showHowTo && (
              <div className="px-4 pb-3.5 pt-1 border-t border-sky-400/15 space-y-2 text-[11px] sm:text-xs text-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-[#040f26] border border-sky-400/15 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      <strong className="text-white">Tab baru terbuka</strong>, perintah sudah otomatis tersalin — langsung tekan <strong className="text-sky-300">Ctrl+V</strong> (atau <strong className="text-sky-300">Tempel</strong>) di kotak chat AI.
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#040f26] border border-sky-400/15 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Klik tombol <strong className="text-white">Kirim</strong> di AI, lalu tunggu sampai jawabannya selesai ditulis penuh.
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#040f26] border border-sky-400/15 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Klik <strong className="text-white">ikon Copy / Salin kode</strong> di pojok blok jawaban AI.
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#040f26] border border-sky-400/15 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </span>
                    <span>
                      Balik ke tab <strong className="text-sky-300">Graph Motion</strong> ini — kotak <strong className="text-sky-300">Tempel jawaban AI</strong> sudah siap, klik <strong className="text-white">Tempel</strong>.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Prompt Send Mode Selector (Prompt langsung / Style link / File .md) */}
          <div className="rounded-2xl border border-sky-400/20 bg-[#041029] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="text-[11px] font-bold text-slate-300">
              Mode pengiriman perintah:
            </div>
            <div className="inline-flex rounded-xl bg-[#07193d] p-1 border border-sky-400/20 gap-1">
              <button
                type="button"
                data-testid="send-mode-direct"
                onClick={() => setMode('direct')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer inline-flex items-center gap-1 ${
                  activeMode === 'direct'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Terminal className="w-3 h-3" />
                <span>Prompt langsung</span>
              </button>
              <button
                type="button"
                data-testid="send-mode-style-link"
                onClick={() => setMode('style_link')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer inline-flex items-center gap-1 ${
                  activeMode === 'style_link'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Link2 className="w-3 h-3" />
                <span>Sisip link</span>
              </button>
              <button
                type="button"
                data-testid="send-mode-md-file"
                onClick={() => setMode('md_file')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer inline-flex items-center gap-1 ${
                  activeMode === 'md_file'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>File .md</span>
              </button>
            </div>
          </div>

          {/* Configured Images / Media Preview Strip */}
          {mediaItems.length > 0 && (
            <div className="rounded-2xl border border-sky-400/20 bg-[#041029] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="text-xs font-extrabold text-white">
                    Gambar / Media yang Diatur ({mediaItems.length})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-36 overflow-y-auto pr-0.5">
                {mediaItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-[#071636] border border-sky-400/20"
                  >
                    {item.type === 'video' ? (
                      <video
                        src={item.url}
                        muted
                        playsInline
                        className="w-12 h-12 rounded-lg object-cover bg-slate-900 shrink-0"
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt={item.filename}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-900 shrink-0 border border-white/10"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-white truncate">
                        {item.filename}
                      </div>
                      <div className="text-[10px] font-mono text-sky-300 truncate">
                        {item.sceneHint || item.key}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {item.type === 'image' && (
                          <button
                            type="button"
                            data-testid={`ai-picker-copy-image-${idx}`}
                            onClick={() => handleCopyImage(item, idx)}
                            className="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/35 text-sky-200 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition"
                          >
                            {copiedImgIdx === idx ? (
                              <>
                                <Check className="w-2.5 h-2.5 text-emerald-400" />
                                <span>Tersalin</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-2.5 h-2.5" />
                                <span>Salin Gambar</span>
                              </>
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDownloadMedia(item)}
                          className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-200 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition"
                        >
                          <Download className="w-2.5 h-2.5" />
                          <span>Unduh</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {imgCopyHint && (
                <p className="text-[11px] text-sky-300 font-semibold">{imgCopyHint}</p>
              )}
            </div>
          )}

          {/* AI Platform Selector Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                <span>Pilih AI Tujuan:</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {fullPrompt.length.toLocaleString('id-ID')} karakter
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AI_PLATFORMS.map((platform, idx) => (
                <button
                  key={platform.id}
                  type="button"
                  data-testid={`ai-picker-option-${platform.id}`}
                  onClick={() => handleSelectPlatform(platform)}
                  className={`group text-left p-3.5 rounded-2xl transition flex items-start justify-between gap-3 cursor-pointer shadow-sm active:scale-[0.99] ${
                    idx === 0
                      ? 'bg-gradient-to-r from-[#132956] to-[#0d2049] hover:from-[#19356e] hover:to-[#122b61] border-2 border-sky-400/70'
                      : 'bg-[#0b1938] hover:bg-[#112554] border border-sky-400/20 hover:border-sky-400/60'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    {platform.id === 'claude' ||
                    platform.id === 'chatgpt' ||
                    platform.id === 'gemini' ? (
                      <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                        <AiProviderIcon
                          provider={platform.id as AiProviderId}
                          className="w-9 h-9"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs"
                        style={{ backgroundColor: '#2563EB' }}
                      >
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs sm:text-sm text-white group-hover:text-sky-200 transition">
                          {platform.name}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                            idx === 0
                              ? 'bg-[#2563EB] text-white'
                              : 'bg-white/10 text-sky-200'
                          }`}
                        >
                          {idx === 0 ? 'Disarankan' : platform.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                        {platform.tagline}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-sky-300 shrink-0 mt-0.5 transition" />
                </button>
              ))}
            </div>
          </div>

          {/* Copy Prompt Only / Download .md / View Raw Prompt */}
          <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="ai-picker-copy-only"
                onClick={copyPromptToClipboard}
                className="px-3.5 py-2 rounded-xl bg-sky-400/15 hover:bg-sky-400/25 border border-sky-400/35 text-sky-200 text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Perintah Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin perintah saja</span>
                  </>
                )}
              </button>

              <button
                type="button"
                data-testid="ai-picker-download-md"
                onClick={handleDownloadPromptMd}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-sky-300" />
                <span>Unduh file .md</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowRawPrompt((prev) => !prev)}
              className="text-[11px] font-bold text-sky-300 hover:text-sky-200 underline underline-offset-2 cursor-pointer"
            >
              {showRawPrompt ? 'Sembunyikan isi perintah' : 'Lihat isi perintah lengkap'}
            </button>
          </div>

          {showRawPrompt && (
            <div className="rounded-2xl border border-sky-400/25 bg-[#030a1a] p-3">
              <pre className="text-[10px] font-mono text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                {fullPrompt}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-sky-400/15 bg-[#040d21] flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400">
            Perintah diakhiri dengan penanda <code className="text-sky-300 font-mono">=== AKHIR PERINTAH ===</code>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-white/15 text-xs font-bold text-slate-300 hover:bg-white/10 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

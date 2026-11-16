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
} from 'lucide-react';
import {
  AI_PLATFORMS,
  AiPlatformId,
  AiPlatformOption,
  PromptMediaAttachment,
  buildAiTargetUrl,
  enrichPromptWithMedia,
} from '../utils/ai-platform-router';
import { soundEngine } from '../utils/audio-synth';

interface SendToAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  promptText: string;
  mediaItems?: PromptMediaAttachment[];
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
  title = 'Pilih AI Tujuan Pengiriman',
  subtitle = 'Pilih platform AI terlebih dahulu — prompt dan gambar yang diatur akan langsung disiapkan & dibuka ke AI pilihanmu.',
  promptText,
  mediaItems = [],
  onDispatched,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedImgIdx, setCopiedImgIdx] = useState<number | null>(null);
  const [imgCopyHint, setImgCopyHint] = useState<string | null>(null);

  if (!isOpen) return null;

  const fullPrompt = enrichPromptWithMedia(promptText, mediaItems);

  const copyPromptToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2200);
    } catch {
      // ignore clipboard denial in restricted environments
    }
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
      <div className="bg-[#07132c] text-slate-100 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-sky-400/30 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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
          {/* Configured Images / Media Preview Strip */}
          <div className="rounded-2xl border border-sky-400/20 bg-[#041029] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="text-xs font-extrabold text-white">
                  Gambar / Media yang Diatur ({mediaItems.length})
                </span>
              </div>
              <button
                type="button"
                onClick={copyPromptToClipboard}
                className="px-2.5 py-1 rounded-lg bg-sky-400/15 hover:bg-sky-400/25 border border-sky-400/30 text-sky-300 text-[11px] font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Prompt Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Prompt Lengkap</span>
                  </>
                )}
              </button>
            </div>

            {mediaItems.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-40 overflow-y-auto pr-0.5">
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
                <p className="text-[11px] text-emerald-300/90 font-medium">
                  Daftar &amp; instruksi seluruh aset gambar sudah disisipkan otomatis ke dalam prompt. Untuk melampirkan file gambar langsung di chat AI, klik <strong>Salin Gambar</strong> lalu tekan <strong>Ctrl+V</strong> di AI tujuan.
                </p>
                {imgCopyHint && (
                  <p className="text-[11px] text-amber-300 font-semibold">{imgCopyHint}</p>
                )}
              </>
            ) : (
              <p className="text-[11px] text-slate-400">
                Belum ada gambar/video khusus yang diunggah — seluruh parameter konsep, gaya, karakter, dan durasi tetap ikut dikirim di prompt.
              </p>
            )}
          </div>

          {/* AI Platform Selector Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                <span>Pilih Platform AI untuk Membuka Prompt Sekarang:</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {fullPrompt.length.toLocaleString('id-ID')} karakter
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AI_PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  data-testid={`ai-picker-option-${platform.id}`}
                  onClick={() => handleSelectPlatform(platform)}
                  className="group text-left p-3.5 rounded-2xl bg-[#0b1938] hover:bg-[#112554] border border-sky-400/20 hover:border-sky-400/60 transition flex items-start justify-between gap-3 cursor-pointer shadow-sm active:scale-[0.99]"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs"
                      style={{ backgroundColor: platform.accentHex }}
                    >
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs sm:text-sm text-white group-hover:text-sky-200 transition">
                          {platform.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-mono font-bold text-sky-200">
                          {platform.badge}
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
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-sky-400/15 bg-[#040d21] flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400">
            Prompt otomatis tersalin ke clipboard saat kamu memilih AI.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-white/15 text-xs font-bold text-slate-300 hover:bg-white/10 transition cursor-pointer"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};

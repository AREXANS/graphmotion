import React, { useState, useRef, useEffect, useId } from 'react';
import {
  Send,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ClipboardPaste,
  Link2,
  FileText,
  X,
} from 'lucide-react';
import { TutorialPointerBubble } from './TutorialPointerBubble';
import { readClipboardOrFallbackText } from '../utils/ai-platform-router.ts';

export type AiProviderId = 'claude' | 'chatgpt' | 'gemini';
export type AiDispatchMode = 'direct' | 'link' | 'md';

export interface AiPromptDispatchBoxProps {
  promptText: string;
  selectedAi: AiProviderId;
  onSelectAi: (ai: AiProviderId) => void;
  dispatchMode: AiDispatchMode;
  onSelectDispatchMode: (mode: AiDispatchMode) => void;
  onSend: (ai: AiProviderId, mode: AiDispatchMode) => void;
  onCopyPrompt: () => void;
  copiedPrompt?: boolean;
  isPasteOpen: boolean;
  onTogglePasteOpen: (open: boolean) => void;
  pasteValue: string;
  onPasteChange: (val: string) => void;
  onProcessPaste?: (val: string) => void;
  processButtonLabel?: string;
  pastePlaceholder?: string;
  showSendTutorial?: boolean;
  sendTutorialText?: string;
  onDismissSendTutorial?: () => void;
  showPasteTutorial?: boolean;
  pasteTutorialText?: string;
  onDismissPasteTutorial?: () => void;
  variant?: 'solid' | 'soft';
  testIdPrefix?: string;
}

export const AI_PROVIDER_META: Record<
  AiProviderId,
  {
    name: string;
    recommended?: boolean;
    description: string;
    directDesc: string;
    linkDesc: string;
    mdDesc: string;
  }
> = {
  claude: {
    name: 'Claude',
    recommended: true,
    description: 'Paling cocok dengan Satset. Perintah langsung terisi.',
    directDesc: 'Perintah terisi di chat Claude, tinggal kirim.',
    linkDesc: 'Sisipkan link referensi gaya ke dalam prompt Claude.',
    mdDesc: 'File perintah terunduh, lalu lampirkan di Claude. Paling aman untuk perintah panjang.',
  },
  chatgpt: {
    name: 'ChatGPT',
    description: 'Perintah pendek langsung terkirim, yang panjang disalin, tinggal tempel.',
    directDesc: 'Perintah terisi di chat ChatGPT, tinggal kirim.',
    linkDesc: 'Sisipkan link referensi gaya ke dalam prompt ChatGPT.',
    mdDesc: 'File perintah terunduh, lalu lampirkan di ChatGPT. Paling aman untuk perintah panjang.',
  },
  gemini: {
    name: 'Gemini',
    description: 'Perintah disalin otomatis, tinggal tempel di Gemini.',
    directDesc: 'Perintah terisi di chat Gemini, tinggal kirim.',
    linkDesc: 'Gemini tidak bisa membuka link.',
    mdDesc: 'File perintah terunduh, lalu lampirkan di Gemini. Paling aman untuk perintah panjang.',
  },
};

const OPENAI_BLOSSOM_PATH =
  'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3975.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z';

export const AiProviderIcon: React.FC<{ provider: AiProviderId; className?: string }> = ({
  provider,
  className = 'w-5 h-5',
}) => {
  const rawUid = useId();
  const uid = rawUid.replace(/[^a-zA-Z0-9_-]/g, '');

  if (provider === 'claude') {
    // Uploaded Reference 1: Terracotta orange (#D97757) badge with organic 12-ray white Claude sunburst
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        data-ai-logo="claude"
        aria-hidden="true"
      >
        <rect width="24" height="24" rx="5.5" fill="#D97757" />
        <g stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round">
          {/* 12 organic radiating rays matching Claude sunburst */}
          <line x1="12.1" y1="12.3" x2="8.8" y2="5.1" strokeWidth="2.1" />
          <line x1="12.3" y1="12.2" x2="13.2" y2="5.2" strokeWidth="1.75" />
          <line x1="12.6" y1="12.2" x2="16.8" y2="6.8" strokeWidth="2.35" />
          <line x1="12.7" y1="12.4" x2="19.0" y2="11.0" strokeWidth="1.65" />
          <line x1="12.7" y1="12.6" x2="18.9" y2="13.5" strokeWidth="1.65" />
          <line x1="12.6" y1="12.8" x2="17.5" y2="17.0" strokeWidth="1.45" />
          <line x1="12.4" y1="12.9" x2="15.4" y2="18.1" strokeWidth="1.95" />
          <line x1="12.1" y1="12.9" x2="11.7" y2="19.1" strokeWidth="1.65" />
          <line x1="11.9" y1="12.8" x2="8.3" y2="17.9" strokeWidth="1.65" />
          <line x1="11.8" y1="12.6" x2="6.6" y2="15.6" strokeWidth="1.65" />
          <line x1="11.7" y1="12.4" x2="5.2" y2="12.0" strokeWidth="1.45" />
          <line x1="11.9" y1="12.1" x2="6.3" y2="7.9" strokeWidth="1.95" />
        </g>
        <circle cx="12.2" cy="12.5" r="2.75" fill="#FFFFFF" />
      </svg>
    );
  }
  if (provider === 'chatgpt') {
    // Uploaded Reference 2: Crisp white badge with black 6-petal interwoven OpenAI knot & central hexagon
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        data-ai-logo="chatgpt"
        aria-hidden="true"
      >
        <rect width="24" height="24" rx="5.5" fill="#FFFFFF" />
        <g transform="translate(2.16, 2.16) scale(0.82)">
          <path d={OPENAI_BLOSSOM_PATH} fill="#000000" />
        </g>
      </svg>
    );
  }
  // Uploaded Reference 3: White rounded squircle badge with 4-color Google gradient Gemini curved 4-point star
  const starClipId = `gemini-star-clip-${uid}`;
  const redGradId = `gemini-red-${uid}`;
  const yellowGradId = `gemini-yellow-${uid}`;
  const greenGradId = `gemini-green-${uid}`;
  const blueGradId = `gemini-blue-${uid}`;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      data-ai-logo="gemini"
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="5.8" fill="#FFFFFF" />
      <defs>
        <clipPath id={starClipId}>
          <path d="M12 3.1C12.35 8.15 15.85 11.65 20.9 12C15.85 12.35 12.35 15.85 12 20.9C11.65 15.85 8.15 12.35 3.1 12C8.15 11.65 11.65 8.15 12 3.1Z" />
        </clipPath>
        <linearGradient id={blueGradId} x1="8" y1="8" x2="21" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D74F5" />
        </linearGradient>
        <radialGradient id={redGradId} cx="11.5" cy="4.2" r="7.2" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EA4335" />
          <stop offset="48%" stopColor="#EA4335" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#EA4335" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={yellowGradId} cx="4.2" cy="12" r="6.8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FBBC04" />
          <stop offset="50%" stopColor="#FBBC04" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#FBBC04" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={greenGradId} cx="11.6" cy="19.8" r="6.8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34A853" />
          <stop offset="48%" stopColor="#34A853" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#34A853" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${starClipId})`}>
        <rect x="2" y="2" width="20" height="20" fill={`url(#${blueGradId})`} />
        <rect x="2" y="2" width="20" height="20" fill={`url(#${redGradId})`} />
        <rect x="2" y="2" width="20" height="20" fill={`url(#${greenGradId})`} />
        <rect x="2" y="2" width="20" height="20" fill={`url(#${yellowGradId})`} />
      </g>
    </svg>
  );
};

export const AiPromptDispatchBox: React.FC<AiPromptDispatchBoxProps> = ({
  selectedAi,
  onSelectAi,
  dispatchMode,
  onSelectDispatchMode,
  onSend,
  onCopyPrompt,
  copiedPrompt = false,
  isPasteOpen,
  onTogglePasteOpen,
  pasteValue,
  onPasteChange,
  onProcessPaste,
  processButtonLabel,
  showSendTutorial = false,
  sendTutorialText = 'Klik untuk kirim prompt ke AI pilihanmu',
  onDismissSendTutorial,
  showPasteTutorial = false,
  pasteTutorialText = 'Setelah AI menjawab, salin lalu tempel hasilnya di sini',
  onDismissPasteTutorial,
  variant = 'solid',
  testIdPrefix = 'ai-dispatch',
}) => {
  const [openMenu, setOpenMenu] = useState<'none' | 'mode' | 'provider'>('none');
  const [isPasteFocused, setIsPasteFocused] = useState(false);
  const [showNativePastePopup, setShowNativePastePopup] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const useSolidStyle = variant === 'solid' && !isPasteOpen;

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenMenu('none');
        setShowNativePastePopup(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [openMenu]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const activeMeta = AI_PROVIDER_META[selectedAi] || AI_PROVIDER_META.gemini;

  const handleClipboardReadAndPaste = async () => {
    textareaRef.current?.focus();
    setShowNativePastePopup(false);
    const clipText = await readClipboardOrFallbackText();
    if (clipText && clipText.trim()) {
      onPasteChange(clipText);
    }
  };

  return (
    <div
      ref={containerRef}
      data-testid={`${testIdPrefix}-card`}
      className="relative rounded-2xl bg-[#11151E] border border-white/[0.08] p-3.5 sm:p-4 shadow-sm transition-all"
    >
      {/* Expanded Inline "Tempel jawaban AI" Box (Matches Screenshot_20261117-195147 & 195159 100%) */}
      {isPasteOpen && (
        <div
          data-testid={`${testIdPrefix}-paste-panel`}
          className="mb-3.5 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <span className="text-[14px] font-bold text-white">Tempel jawaban AI</span>
            <button
              type="button"
              data-testid={`${testIdPrefix}-close-paste`}
              onClick={() => {
                setShowNativePastePopup(false);
                onTogglePasteOpen(false);
              }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              aria-label="Tutup kotak tempel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div
            className={`relative rounded-2xl border-2 border-dashed transition-all p-1 ${
              isPasteFocused || showNativePastePopup || pasteValue.trim()
                ? 'border-blue-500/75 bg-blue-500/[0.07]'
                : 'border-blue-500/45 bg-blue-500/[0.04] hover:border-blue-500/65'
            }`}
          >
            {/* Floating Mobile-Native "Tempel" Popup Bubble + Blue Teardrop Caret Handle (Matches Screenshot_20261117-195159) */}
            {!pasteValue.trim() && (isPasteFocused || showNativePastePopup) && (
              <>
                <button
                  type="button"
                  data-testid={`${testIdPrefix}-native-paste-popup`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void handleClipboardReadAndPaste();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void handleClipboardReadAndPaste();
                  }}
                  className="absolute -top-12 -left-1 z-50 px-6 py-3 rounded-[20px] bg-[#3c4043] hover:bg-[#4a4e52] active:scale-95 text-white text-[15px] font-medium tracking-wide shadow-[0_8px_24px_rgba(0,0,0,0.45)] border border-white/10 cursor-pointer transition-transform select-none"
                >
                  Tempel
                </button>

                {/* Caret Line + Blue Selection Teardrop Handle at top-left of textarea */}
                <div
                  aria-hidden="true"
                  data-testid={`${testIdPrefix}-caret-teardrop-indicator`}
                  className="pointer-events-none select-none absolute top-3.5 left-4 z-20 flex flex-col items-center"
                >
                  <span className="w-[2px] h-5 bg-current opacity-85 animate-pulse" />
                  <span
                    className="w-6 h-6 -mt-0.5 bg-[#8ab4f8] shadow-sm"
                    style={{
                      borderRadius: '0 50% 50% 50%',
                      transform: 'rotate(45deg)',
                    }}
                  />
                </div>
              </>
            )}

            <textarea
              ref={textareaRef}
              data-testid={`${testIdPrefix}-paste-textarea`}
              value={pasteValue}
              inputMode="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              style={{
                WebkitUserSelect: 'text',
                userSelect: 'text',
                WebkitTouchCallout: 'default',
              }}
              onFocus={() => {
                setIsPasteFocused(true);
                setShowNativePastePopup(true);
              }}
              onBlur={() => {
                window.setTimeout(() => {
                  setIsPasteFocused(false);
                }, 180);
              }}
              onPointerDown={() => {
                if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = window.setTimeout(() => {
                  setShowNativePastePopup(true);
                  textareaRef.current?.focus();
                }, 260);
              }}
              onPointerUp={() => {
                if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
              }}
              onContextMenu={() => {
                setShowNativePastePopup(true);
              }}
              onClick={() => {
                setShowNativePastePopup(true);
              }}
              onChange={(e) => {
                setShowNativePastePopup(false);
                onPasteChange(e.target.value);
              }}
              rows={4}
              aria-label="Tempel jawaban AI"
              className="relative z-10 w-full min-h-[126px] bg-transparent px-3.5 py-3 text-[13px] text-white placeholder-transparent focus:outline-none resize-y leading-relaxed font-mono select-text cursor-text"
            />

            {!pasteValue.trim() && (
              <div
                aria-hidden="true"
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none px-4 text-center z-0"
              >
                <span
                  data-testid={`${testIdPrefix}-center-paste-icon`}
                  className={`pointer-events-none w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-colors shadow-sm ${
                    isPasteFocused || showNativePastePopup
                      ? 'bg-blue-600 text-white shadow-blue-600/25'
                      : 'bg-white text-blue-600 border border-blue-500/20'
                  }`}
                >
                  <ClipboardPaste className="w-5 h-5" />
                </span>
                <span className="pointer-events-none text-[13px] sm:text-[14px] font-bold text-blue-400">
                  Tahan kotak ini, lalu pilih Tempel
                </span>
              </div>
            )}
          </div>

          {pasteValue.trim() && onProcessPaste && (
            <button
              type="button"
              data-testid={`${testIdPrefix}-process-paste`}
              onClick={() => onProcessPaste(pasteValue)}
              className="mt-2.5 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[13px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>{processButtonLabel || 'Proses Jawaban AI'}</span>
            </button>
          )}
        </div>
      )}

      {/* Main Split Button Bar (Matches Screenshot_20261117-195053, 194950, 195004, 195020 100%) */}
      <div className="relative flex items-stretch gap-2">
        {/* Left + Middle Joined Split Button */}
        <div
          className={`flex-1 flex items-stretch rounded-xl overflow-hidden transition-all ${
            useSolidStyle
              ? 'bg-blue-600 border border-blue-500 shadow-md shadow-blue-600/20'
              : 'bg-blue-500/[0.10] border border-blue-500/25'
          }`}
        >
          <button
            type="button"
            data-testid={`${testIdPrefix}-send-btn`}
            onClick={() => {
              setOpenMenu('none');
              onSend(selectedAi, dispatchMode);
            }}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2.5 text-[14px] sm:text-[15px] font-bold transition-colors cursor-pointer ${
              useSolidStyle
                ? 'text-white hover:bg-blue-500'
                : 'text-blue-400 hover:bg-blue-500/[0.15]'
            }`}
          >
            <Send className="w-4 h-4 shrink-0" />
            <span>
              {isPasteOpen ? `Kirim lagi ke ${activeMeta.name}` : `Kirim ke ${activeMeta.name}`}
            </span>
          </button>

          <div
            className={`w-[1px] my-2 ${
              useSolidStyle ? 'bg-white/25' : 'bg-blue-500/20'
            }`}
          />

          <button
            type="button"
            data-testid={`${testIdPrefix}-mode-trigger`}
            onClick={() => setOpenMenu(openMenu === 'mode' ? 'none' : 'mode')}
            aria-label={`Pilih cara kirim ke ${activeMeta.name}`}
            className={`px-3.5 flex items-center justify-center transition-colors cursor-pointer ${
              useSolidStyle
                ? `text-white hover:bg-blue-500 ${openMenu === 'mode' ? 'bg-blue-700' : ''}`
                : `text-blue-400 hover:bg-blue-500/[0.18] ${
                    openMenu === 'mode' ? 'bg-blue-500/[0.20]' : ''
                  }`
            }`}
          >
            {openMenu === 'mode' ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Right AI Provider Selector Button */}
        <button
          type="button"
          data-testid={`${testIdPrefix}-provider-trigger`}
          onClick={() => setOpenMenu(openMenu === 'provider' ? 'none' : 'provider')}
          aria-label="Kirim ke AI mana?"
          className={`px-3 py-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
            openMenu === 'provider'
              ? 'bg-blue-500/[0.14] border-blue-500/35 text-blue-400'
              : 'bg-[#161B26] border-white/[0.09] hover:border-blue-500/30 text-neutral-200'
          }`}
        >
          <AiProviderIcon provider={selectedAi} className="w-5 h-5 rounded-md shadow-xs" />
          {openMenu === 'provider' ? (
            <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          )}
        </button>

        {/* Popover 1: KIRIM KE [AI] SEBAGAI (Matches Screenshot_20261117-195020_c1683324.jpg) */}
        {openMenu === 'mode' && (
          <div
            data-testid={`${testIdPrefix}-mode-popover`}
            className="absolute right-0 top-full mt-2 w-[300px] sm:w-[325px] rounded-2xl bg-[#161B26] border border-white/[0.1] shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
              KIRIM KE {activeMeta.name.toUpperCase()} SEBAGAI
            </div>

            <div className="space-y-1 mt-0.5">
              {/* Option 1: Prompt langsung */}
              <button
                type="button"
                data-testid={`${testIdPrefix}-mode-direct`}
                onClick={() => {
                  onSelectDispatchMode('direct');
                  setOpenMenu('none');
                }}
                className={`w-full text-left p-2.5 rounded-xl flex items-start gap-3 transition-colors cursor-pointer ${
                  dispatchMode === 'direct'
                    ? 'bg-blue-500/[0.10] border border-blue-500/20'
                    : 'hover:bg-white/[0.04]'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    dispatchMode === 'direct'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-white/[0.05] text-neutral-400'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-bold text-white">Prompt langsung</span>
                    {dispatchMode === 'direct' && (
                      <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[12px] text-neutral-400 leading-snug mt-0.5">
                    {activeMeta.directDesc}
                  </p>
                </div>
              </button>

              {/* Option 2: Sisip link */}
              <button
                type="button"
                data-testid={`${testIdPrefix}-mode-link`}
                disabled={selectedAi === 'gemini'}
                onClick={() => {
                  if (selectedAi === 'gemini') return;
                  onSelectDispatchMode('link');
                  setOpenMenu('none');
                }}
                className={`w-full text-left p-2.5 rounded-xl flex items-start gap-3 transition-colors ${
                  selectedAi === 'gemini'
                    ? 'opacity-50 cursor-not-allowed'
                    : dispatchMode === 'link'
                    ? 'bg-blue-500/[0.10] border border-blue-500/20 cursor-pointer'
                    : 'hover:bg-white/[0.04] cursor-pointer'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] text-neutral-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Link2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-bold text-neutral-300">Sisip link</span>
                    {dispatchMode === 'link' && selectedAi !== 'gemini' && (
                      <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[12px] text-neutral-400 leading-snug mt-0.5">
                    {activeMeta.linkDesc}
                  </p>
                </div>
              </button>

              {/* Option 3: File .md */}
              <button
                type="button"
                data-testid={`${testIdPrefix}-mode-md`}
                onClick={() => {
                  onSelectDispatchMode('md');
                  setOpenMenu('none');
                }}
                className={`w-full text-left p-2.5 rounded-xl flex items-start gap-3 transition-colors cursor-pointer ${
                  dispatchMode === 'md'
                    ? 'bg-blue-500/[0.10] border border-blue-500/20'
                    : 'hover:bg-white/[0.04]'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    dispatchMode === 'md'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-white/[0.05] text-neutral-400'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-bold text-white">File .md</span>
                    {dispatchMode === 'md' && (
                      <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[12px] text-neutral-400 leading-snug mt-0.5">
                    {activeMeta.mdDesc}
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Popover 2: KIRIM KE AI MANA? (Matches Screenshot_20261117-195004_63afb65a.jpg) */}
        {openMenu === 'provider' && (
          <div
            data-testid={`${testIdPrefix}-provider-popover`}
            className="absolute right-0 top-full mt-2 w-[300px] sm:w-[330px] rounded-2xl bg-[#161B26] border border-white/[0.1] shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
              KIRIM KE AI MANA?
            </div>

            <div className="space-y-1 mt-0.5">
              {(['claude', 'chatgpt', 'gemini'] as AiProviderId[]).map((providerKey) => {
                const meta = AI_PROVIDER_META[providerKey];
                const isSelected = selectedAi === providerKey;
                return (
                  <button
                    key={providerKey}
                    type="button"
                    data-testid={`${testIdPrefix}-provider-${providerKey}`}
                    onClick={() => {
                      onSelectAi(providerKey);
                      if (providerKey === 'gemini' && dispatchMode === 'link') {
                        onSelectDispatchMode('direct');
                      }
                      setOpenMenu('none');
                    }}
                    className={`w-full text-left p-2.5 rounded-xl flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-500/[0.10] border border-blue-500/20'
                        : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <AiProviderIcon provider={providerKey} className="w-8 h-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-bold text-white">{meta.name}</span>
                          {meta.recommended && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25">
                              Disarankan
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                      </div>
                      <p className="text-[12px] text-neutral-400 leading-snug mt-0.5">
                        {meta.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Tutorial Pointer under Send button */}
      {showSendTutorial && !isPasteOpen && (
        <TutorialPointerBubble
          text={sendTutorialText}
          onDismiss={onDismissSendTutorial}
          className="mt-1 mb-1 pl-4"
        />
      )}

      {/* Bottom Secondary Links: Salin prompt · Tempel jawaban */}
      <div className="mt-2.5 pt-1 flex items-center justify-center gap-2.5 text-[12px] font-semibold text-neutral-300">
        <button
          type="button"
          data-testid={`${testIdPrefix}-copy-btn`}
          onClick={onCopyPrompt}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/[0.05] text-neutral-300 hover:text-white transition-colors cursor-pointer"
        >
          {copiedPrompt ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Prompt disalin</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-neutral-400" />
              <span>Salin prompt</span>
            </>
          )}
        </button>

        {!isPasteOpen && (
          <>
            <span className="text-neutral-600 select-none">·</span>
            <button
              type="button"
              data-testid={`${testIdPrefix}-open-paste-btn`}
              onClick={() => onTogglePasteOpen(true)}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/[0.05] text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-neutral-400" />
              <span>Tempel jawaban</span>
            </button>
          </>
        )}
      </div>

      {showPasteTutorial && (
        <TutorialPointerBubble
          text={pasteTutorialText}
          onDismiss={onDismissPasteTutorial}
          className="mt-1 pl-6"
        />
      )}
    </div>
  );
};

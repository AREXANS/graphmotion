import React from 'react';
import { X } from 'lucide-react';

export interface TutorialPointerBubbleProps {
  visible?: boolean;
  title?: string;
  text: string;
  stepNumber?: number;
  totalSteps?: number;
  arrowPosition?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  nextLabel?: string;
  onPrev?: () => void;
  onNext?: () => void;
  onSkipAll?: () => void;
  onDismiss?: () => void;
  className?: string;
  testId?: string;
}

/**
 * Interactive step-by-step tutorial callout bubble (#2563EB) with directional pointer arrow,
 * step badge (1/N), bold step title, detailed 1-by-1 explanation, and Prev/Next/Skip navigation.
 */
export const TutorialPointerBubble: React.FC<TutorialPointerBubbleProps> = ({
  visible = true,
  title,
  text,
  stepNumber,
  totalSteps,
  arrowPosition = 'top-left',
  nextLabel,
  onPrev,
  onNext,
  onSkipAll,
  onDismiss,
  className = '',
  testId = 'tutorial-pointer-bubble',
}) => {
  if (!visible) return null;

  const isTopArrow = arrowPosition.startsWith('top-');
  const arrowAlignClass = arrowPosition.endsWith('-left')
    ? 'left-6'
    : arrowPosition.endsWith('-right')
      ? 'right-6'
      : 'left-1/2 -translate-x-1/2';

  const handleClose = onSkipAll || onDismiss;
  const resolvedNextLabel =
    nextLabel ||
    (stepNumber !== undefined && totalSteps !== undefined && stepNumber >= totalSteps
      ? 'Selesai & Lanjut →'
      : 'Lanjut →');

  return (
    <div
      data-testid={testId}
      className={`relative z-30 rounded-xl bg-[#2563EB] text-white px-4 py-3 shadow-lg shadow-blue-600/35 border border-blue-400/35 select-none animate-in fade-in slide-in-from-top-1 duration-200 ${className}`}
    >
      {/* Top Pointer Arrow */}
      {isTopArrow && (
        <span
          aria-hidden="true"
          className={`absolute -top-1.5 ${arrowAlignClass} w-3.5 h-3.5 bg-[#2563EB] rotate-45 rounded-[2px] border-l border-t border-blue-400/35`}
        />
      )}

      {/* Bottom Pointer Arrow */}
      {!isTopArrow && (
        <span
          aria-hidden="true"
          className={`absolute -bottom-1.5 ${arrowAlignClass} w-3.5 h-3.5 bg-[#2563EB] rotate-45 rounded-[2px] border-r border-b border-blue-400/35`}
        />
      )}

      <div className="relative z-10 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {stepNumber !== undefined && totalSteps !== undefined && (
                <span
                  data-testid={`${testId}-step-badge`}
                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/20 text-[11px] font-black tracking-wide uppercase text-white shrink-0"
                >
                  Langkah {stepNumber}/{totalSteps}
                </span>
              )}
              {title && (
                <span
                  data-testid={`${testId}-title`}
                  className="text-[13px] sm:text-[13.5px] font-extrabold text-white leading-snug"
                >
                  {title}
                </span>
              )}
            </div>
            <p
              data-testid={`${testId}-text`}
              className="text-[12.5px] sm:text-[13px] font-semibold leading-relaxed text-white/95"
            >
              {text}
            </p>
          </div>

          {handleClose && (
            <button
              type="button"
              data-testid={`${testId}-dismiss`}
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="w-6 h-6 rounded-md bg-black/15 hover:bg-black/30 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              aria-label="Tutup panduan"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}
        </div>

        {(onPrev || onNext || onSkipAll) && (
          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/20">
            <div className="flex items-center gap-2">
              {onSkipAll && (
                <button
                  type="button"
                  data-testid={`${testId}-skip`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSkipAll();
                  }}
                  className="text-[11px] font-bold text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  Lewati
                </button>
              )}
              {onPrev && (
                <button
                  type="button"
                  data-testid={`${testId}-prev`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrev();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-[11px] transition-all cursor-pointer active:scale-95"
                >
                  ← Sebelumnya
                </button>
              )}
            </div>

            {onNext && (
              <button
                type="button"
                data-testid={`${testId}-next`}
                onClick={(e) => {
                  e.stopPropagation();
                  onNext();
                }}
                className="ml-auto px-3 py-1 rounded-lg bg-white text-[#2563EB] hover:bg-blue-50 font-extrabold text-[11.5px] shadow-xs transition-all cursor-pointer active:scale-95"
              >
                {resolvedNextLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default TutorialPointerBubble;

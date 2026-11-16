import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { TransitionOption } from '../types/satset';
import { soundEngine } from '../utils/audio-synth';
import {
  TRANSITION_CATALOG,
  TransitionCatalogItem,
} from '../utils/character-catalog';
import { TransitionPreviewCanvas } from './TransitionPreviewCanvas';

export { TRANSITION_CATALOG as TRANSITION_OPTIONS };

interface TransitionPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTransition: TransitionOption;
  onSelectTransition: (tr: TransitionOption) => void;
}

export const TransitionPickerModal: React.FC<TransitionPickerModalProps> = ({
  isOpen,
  onClose,
  selectedTransition,
  onSelectTransition,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!isOpen) return null;

  const normalizedSelected =
    selectedTransition === 'menyusut' ? 'blur_lembut' : selectedTransition;

  const handlePick = (item: TransitionCatalogItem) => {
    if (item.id === 'otomatis') {
      soundEngine.playSfx('sparkle');
    } else {
      soundEngine.playTransitionSfx(item.id);
    }
    onSelectTransition(item.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-white">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-zinc-900">
              Transisi antar scene
            </h3>
            <p className="text-[11px] text-zinc-500">
              Pilih gaya perpindahan antar adegan (arahkan kursor / pilih untuk animasi langsung)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pemilih transisi"
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 18 Transition List with Real Visual Previews */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5">
          {TRANSITION_CATALOG.map((item) => {
            const isSelected = normalizedSelected === item.id;
            const isHovered = hoveredId === item.id;
            return (
              <div
                key={item.id}
                data-testid={`transition-option-${item.id}`}
                onClick={() => handlePick(item)}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`px-3 py-2.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-2 group ${
                  isSelected
                    ? 'bg-sky-50 border-blue-500 shadow-xs'
                    : 'bg-white border-zinc-200/80 hover:border-blue-300 hover:bg-zinc-50/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <TransitionPreviewCanvas
                    transitionId={item.id}
                    size={46}
                    animate={isSelected || isHovered}
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-xs sm:text-sm text-zinc-900">
                        {item.name}
                      </span>
                      {item.id === 'otomatis' && (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-700">
                          REKOMENDASI
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 line-clamp-1 leading-snug">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 pl-2">
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-zinc-300 group-hover:border-blue-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

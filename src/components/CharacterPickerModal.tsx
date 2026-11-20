import React, { useEffect, useState } from 'react';
import { X, Check, AlertCircle, Play, Plus, Pencil, Trash2 } from 'lucide-react';
import { type CharacterDimension, type CharacterFraming, type CharacterOption } from '../types/satset.ts';
import { soundEngine } from '../utils/audio-synth.ts';
import {
  CHARACTER_CATALOG,
  CHARACTER_FRAMING_OPTIONS,
  type CharacterCatalogItem,
  resolveCharacterOption,
} from '../utils/character-catalog.ts';
import {
  type CustomCharacterConfig,
  buildCharacterTraitsSummary,
  deleteCustomCharacter,
  getStoredCustomCharacters,
} from '../utils/custom-character.ts';
import { CharacterAvatarCanvas } from './CharacterAvatarCanvas.tsx';

export { CHARACTER_CATALOG as CHARACTER_OPTIONS };

interface CharacterPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCharacter: CharacterOption;
  selectedFraming?: CharacterFraming;
  selectedDimension?: CharacterDimension;
  customCharacter?: CustomCharacterConfig;
  onSelectCharacter: (
    char: CharacterOption,
    options?: {
      gender?: 'pria' | 'wanita';
      withObjects?: boolean;
      fullBackstory?: boolean;
      framing?: CharacterFraming;
      dimension?: CharacterDimension;
      customCharacter?: CustomCharacterConfig;
    }
  ) => void;
  characterGender?: 'pria' | 'wanita';
  characterWithObjects?: boolean;
  characterFullBackstory?: boolean;
  onOpenDemo: (charId?: CharacterOption, dimension?: CharacterDimension) => void;
  onOpenBuilder?: (editChar?: CustomCharacterConfig) => void;
  scenesCount?: number;
}

export const CharacterPickerModal: React.FC<CharacterPickerModalProps> = ({
  isOpen,
  onClose,
  selectedCharacter,
  selectedFraming = 'full',
  selectedDimension = '3d',
  customCharacter,
  onSelectCharacter,
  characterGender = 'pria',
  characterWithObjects = true,
  characterFullBackstory = false,
  onOpenDemo,
  onOpenBuilder,
  scenesCount = 5,
}) => {
  const [gender, setGender] = useState<'pria' | 'wanita'>(characterGender);
  const [withObjects, setWithObjects] = useState<boolean>(characterWithObjects);
  const [fullBackstory, setFullBackstory] = useState<boolean>(characterFullBackstory);
  const [framing, setFraming] = useState<CharacterFraming>(selectedFraming);
  const [dimension, setDimension] = useState<CharacterDimension>(selectedDimension);
  const [activeCategory, setActiveCategory] = useState<'semua' | 'humanoid' | 'cowok' | 'cewek' | 'stickman'>('semua');
  const [customChars, setCustomChars] = useState<CustomCharacterConfig[]>([]);

  // Switch confirmation state
  const [pendingCharacter, setPendingCharacter] = useState<CharacterOption | null>(null);
  const [pendingCustomChar, setPendingCustomChar] = useState<CustomCharacterConfig | undefined>(undefined);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setCustomChars(getStoredCustomCharacters());
      setFraming(selectedFraming || 'full');
      setDimension(selectedDimension || '3d');
    }
  }, [isOpen, customCharacter, selectedFraming, selectedDimension]);

  if (!isOpen) return null;

  const resolvedSelected = resolveCharacterOption(selectedCharacter);

  const visibleItems = CHARACTER_CATALOG.filter((item) => {
    if (activeCategory === 'semua') return true;
    return item.category === activeCategory || item.id === 'custom';
  });

  const handlePickCustom = (cc: CustomCharacterConfig) => {
    soundEngine.playSfx('click');
    const chosenGender: 'pria' | 'wanita' = cc.gender === 'cewek' ? 'wanita' : 'pria';
    if (cc.id === resolvedSelected || scenesCount <= 0) {
      onSelectCharacter(cc.id, {
        gender: chosenGender,
        withObjects,
        fullBackstory,
        framing,
        dimension,
        customCharacter: cc,
      });
      onClose();
      return;
    }
    setPendingCharacter(cc.id);
    setPendingCustomChar(cc);
    setShowConfirmModal(true);
  };

  const handlePick = (item: CharacterCatalogItem) => {
    if (item.id === 'custom') {
      soundEngine.playSfx('click');
      onClose();
      onOpenBuilder?.();
      return;
    }

    soundEngine.playSfx('click');
    const chosenGender: 'pria' | 'wanita' =
      item.neutral ? gender : item.gender === 'female' ? 'wanita' : 'pria';
    const nextFraming: CharacterFraming =
      item.id === 'maskot_orb_3d' ? 'orb' : framing;

    if (item.id === resolvedSelected) {
      onSelectCharacter(item.id, {
        gender: chosenGender,
        withObjects,
        fullBackstory,
        framing: nextFraming,
        dimension,
      });
      onClose();
      return;
    }

    if (scenesCount > 0) {
      setPendingCharacter(item.id);
      setPendingCustomChar(undefined);
      setShowConfirmModal(true);
    } else {
      onSelectCharacter(item.id, {
        gender: chosenGender,
        withObjects,
        fullBackstory,
        framing: nextFraming,
        dimension,
      });
      onClose();
    }
  };

  const handleConfirmSwitch = () => {
    if (pendingCharacter) {
      soundEngine.playSfx('pop');
      const nextFraming: CharacterFraming =
        pendingCharacter === 'maskot_orb_3d' ? 'orb' : framing;
      if (pendingCustomChar) {
        onSelectCharacter(pendingCharacter, {
          gender: pendingCustomChar.gender === 'cewek' ? 'wanita' : 'pria',
          withObjects,
          fullBackstory,
          framing: nextFraming,
          dimension,
          customCharacter: pendingCustomChar,
        });
      } else {
        const item = CHARACTER_CATALOG.find((c) => c.id === pendingCharacter);
        const chosenGender: 'pria' | 'wanita' =
          item && !item.neutral ? (item.gender === 'female' ? 'wanita' : 'pria') : gender;
        onSelectCharacter(pendingCharacter, {
          gender: chosenGender,
          withObjects,
          fullBackstory,
          framing: nextFraming,
          dimension,
        });
      }
      setShowConfirmModal(false);
      setPendingCharacter(null);
      setPendingCustomChar(undefined);
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/65 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-white gap-2">
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base text-zinc-900">
                Karakter 2D / 3D &amp; Humanoid
              </h3>
              <p className="text-[11px] text-zinc-500">
                {CHARACTER_CATALOG.length - 1 + customChars.length} pilihan unik · mode 3D Studio &amp; 2D Vektor
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-0.5 bg-zinc-100 p-0.5 rounded-xl border border-zinc-200">
                {(
                  [
                    { id: '3d', label: '3D Studio' },
                    { id: '2d', label: '2D Vektor' },
                  ] as const
                ).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    data-testid={`picker-dimension-${d.id}`}
                    onClick={() => {
                      setDimension(d.id);
                      soundEngine.playSfx('tap');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-extrabold transition cursor-pointer whitespace-nowrap shrink-0 ${
                      dimension === d.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup pemilih karakter"
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Options Strip: Framing, Category Filter pills & Gender */}
          <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-100 space-y-2.5 shrink-0">
            {/* Body / Framing Mode Selector */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  Framing / Tampilan Badan ({dimension === '3d' ? '3D' : '2D'})
                </span>
                <span className="text-[10px] font-bold text-blue-600">
                  {framing === 'full'
                    ? `Full Body ${dimension === '2d' ? '2D' : '3D'}`
                    : framing === 'bust'
                    ? `Setengah Badan ${dimension === '2d' ? '2D' : '3D'}`
                    : framing === 'closeup'
                    ? `Close-Up ${dimension === '2d' ? '2D' : '3D'}`
                    : dimension === '2d'
                    ? 'Orb 2D'
                    : 'Orb 3D'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 bg-zinc-200/70 p-1 rounded-xl">
                {CHARACTER_FRAMING_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`framing-option-${opt.id}`}
                    onClick={() => {
                      setFraming(opt.id);
                      soundEngine.playSfx('tap');
                    }}
                    className={`px-2 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-extrabold transition cursor-pointer whitespace-nowrap ${
                      framing === opt.id
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {opt.id === 'full'
                      ? 'Full Body'
                      : opt.id === 'bust'
                      ? 'Setengah'
                      : opt.id === 'closeup'
                      ? 'Close-Up'
                      : dimension === '2d'
                      ? 'Orb 2D'
                      : 'Orb 3D'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-zinc-200/70 p-1 rounded-xl overflow-x-auto">
                {(
                  [
                    { id: 'semua', label: 'Semua' },
                    { id: 'humanoid', label: 'Humanoid 3D' },
                    { id: 'cowok', label: 'Cowok' },
                    { id: 'cewek', label: 'Cewek' },
                    { id: 'stickman', label: 'Gaya 3D' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(tab.id);
                      soundEngine.playSfx('tap');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer whitespace-nowrap ${
                      activeCategory === tab.id
                        ? 'bg-white text-zinc-900 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-zinc-200/70 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setGender('pria');
                    soundEngine.playSfx('tap');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                    gender === 'pria'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Pria
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGender('wanita');
                    soundEngine.playSfx('tap');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                    gender === 'wanita'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Wanita
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={withObjects}
                  onChange={(e) => setWithObjects(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 accent-blue-600"
                />
                <span className="font-semibold text-[11px]">Tokoh + benda visual</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={fullBackstory}
                  onChange={(e) => setFullBackstory(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 accent-blue-600"
                />
                <span className="font-semibold text-[11px]">Cerita latar lengkap</span>
              </label>
            </div>
          </div>

          {/* List of characters with genuine 3D canvas illustrations */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
            {/* Custom Built Characters Section */}
            {customChars.length > 0 && (
              <div className="space-y-1.5 pb-2 border-b border-zinc-100">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                    Karakter buatanmu ({customChars.length})
                  </span>
                </div>
                {customChars.map((cc) => {
                  const isSelected = resolvedSelected === cc.id;
                  return (
                    <div
                      key={cc.id}
                      data-testid={`custom-character-option-${cc.id}`}
                      onClick={() => handlePickCustom(cc)}
                      className={`px-3 py-2.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-2 group ${
                        isSelected
                          ? 'bg-sky-50 border-blue-500 shadow-xs'
                          : 'bg-white border-zinc-200/80 hover:border-blue-300 hover:bg-zinc-50/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border overflow-hidden ${
                            isSelected
                              ? 'bg-white border-blue-400 shadow-2xs'
                              : 'bg-zinc-50 border-zinc-200/80 group-hover:border-blue-300'
                          }`}
                        >
                          <CharacterAvatarCanvas
                            characterId={cc.id}
                            customCharacter={cc}
                            pose="stand"
                            viewMode={framing}
                            dimension={dimension}
                            size={42}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-xs sm:text-sm text-zinc-900">
                              {cc.name}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                              CUSTOM {dimension.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 line-clamp-1 leading-snug">
                            {buildCharacterTraitsSummary(cc)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            soundEngine.playSfx('sparkle');
                            onOpenDemo(cc.id, dimension);
                          }}
                          className="px-2 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-zinc-700 hover:text-blue-700 text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Demo</span>
                        </button>
                        {onOpenBuilder && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              soundEngine.playSfx('click');
                              onClose();
                              onOpenBuilder(cc);
                            }}
                            aria-label={`Edit ${cc.name}`}
                            className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-blue-50 text-zinc-600 hover:text-blue-700 transition cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            soundEngine.playSfx('tap');
                            const updated = deleteCustomCharacter(cc.id);
                            setCustomChars(updated);
                          }}
                          aria-label={`Hapus ${cc.name}`}
                          className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-rose-50 text-zinc-500 hover:text-rose-600 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs ml-0.5">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {visibleItems.map((item) => {
              const isSelected = resolvedSelected === item.id;
              return (
                <div
                  key={item.id}
                  data-testid={`character-option-${item.id}`}
                  onClick={() => handlePick(item)}
                  className={`px-3 py-2.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-2 group ${
                    isSelected
                      ? 'bg-sky-50 border-blue-500 shadow-xs'
                      : 'bg-white border-zinc-200/80 hover:border-blue-300 hover:bg-zinc-50/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border overflow-hidden ${
                        isSelected
                          ? 'bg-white border-blue-400 shadow-2xs'
                          : 'bg-zinc-50 border-zinc-200/80 group-hover:border-blue-300'
                      }`}
                    >
                      {item.id === 'custom' ? (
                        <Plus className="w-5 h-5 text-blue-600" />
                      ) : (
                        <CharacterAvatarCanvas
                          characterId={item.id}
                          pose={item.look?.stick === 'side' ? 'walk' : 'stand'}
                          viewMode={item.id === 'maskot_orb_3d' ? 'orb' : framing}
                          dimension={dimension}
                          size={42}
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs sm:text-sm text-zinc-900">
                          {item.name}
                        </span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-700">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 line-clamp-1 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.canDemo && (
                      <button
                        type="button"
                        data-testid={`character-demo-btn-${item.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          soundEngine.playSfx('sparkle');
                          onOpenDemo(item.id, dimension);
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-zinc-700 hover:text-blue-700 text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Demo</span>
                      </button>
                    )}

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Switch Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h4 className="font-extrabold text-base text-zinc-900">Ganti karakter?</h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                {scenesCount} scene sudah disiapkan. Mengganti karakter akan memperbarui aktor visual &amp; prompt animasi pada semua adegan.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingCharacter(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-zinc-700 text-xs font-extrabold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSwitch}
                className="flex-1 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-extrabold shadow-md shadow-blue-500/20 transition cursor-pointer active:scale-98"
              >
                Ganti karakter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

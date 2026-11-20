import React, { useState, useMemo } from 'react';
import { X, Check, AlertCircle, Clock, Plus } from 'lucide-react';
import { type SatsetStyleModule } from '../types/satset.ts';
import { SATSET_MODULES, type StyleModuleInfo } from '../data/satset-modules.ts';
import { StyleLivePreviewPlayer } from './StyleLivePreviewPlayer.tsx';
import { StyleThumbnailCard } from './StyleThumbnailCard.tsx';
import { CustomStyleModal } from './CustomStyleModal.tsx';
import {
  getStoredCustomStyles,
  type CustomStyleDefinition,
} from '../utils/custom-style-parser.ts';
import { soundEngine } from '../utils/audio-synth.ts';

interface StyleModulePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModule: SatsetStyleModule;
  onSelectModule: (moduleId: SatsetStyleModule) => void;
  customPrompt?: string;
  onCustomPromptChange?: (val: string) => void;
}

type CategoryTab =
  | 'semua'
  | 'motion3d'
  | 'mograph'
  | 'videoeditor'
  | 'cerita'
  | 'ceria'
  | 'modern'
  | 'tenang'
  | 'teknologi'
  | 'tangan'
  | 'spesial'
  | 'custom';

export const StyleModulePickerModal: React.FC<StyleModulePickerModalProps> = ({
  isOpen,
  onClose,
  selectedModule,
  onSelectModule,
  customPrompt = '',
  onCustomPromptChange,
}) => {
  // Currently previewed style in the left phone player (defaults to selectedModule)
  const [previewModuleId, setPreviewModuleId] = useState<SatsetStyleModule>(selectedModule);
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('semua');
  const [showDemoTooltip, setShowDemoTooltip] = useState(true);
  const [showApplyTooltip, setShowApplyTooltip] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customStylesList, setCustomStylesList] = useState<CustomStyleDefinition[]>(() => getStoredCustomStyles());

  // Reload custom styles when modal is opened
  React.useEffect(() => {
    if (isOpen) {
      setCustomStylesList(getStoredCustomStyles());
      setPreviewModuleId(selectedModule);
      setShowDemoTooltip(true);
      setShowApplyTooltip(false);
    }
  }, [isOpen, selectedModule]);

  // Convert custom style definitions to StyleModuleInfo
  const customModuleInfos = useMemo<StyleModuleInfo[]>(() => {
    return customStylesList.map((cs) => ({
      id: cs.id as SatsetStyleModule,
      title: cs.name,
      subtitle: 'Gaya buatanmu sendiri',
      tag: 'BUATANMU',
      categoryLabel: 'BUATAN SENDIRI',
      description: cs.prompt || 'Gaya visual kustom yang dirancang via AI untuk video vertikal 9:16.',
      accentColor: cs.colors[0] || '#00FF66',
      secondaryColor: cs.colors[1] || '#00E5FF',
      defaultSfx: 'ding',
      icon: '🎨',
      category: 'custom',
      categories: ['custom', 'semua'],
      renderType: 'custom',
      customStyleDefinition: cs,
      demoChapters: [
        {
          chapterNumber: 1,
          totalChapters: 4,
          badgeText: 'BAB 1 DARI 4',
          headline: 'Mulai dari langkah kecil.',
          subtext: 'Mulai dari langkah kecil.',
          highlightWord: 'langkah',
        },
        {
          chapterNumber: 2,
          totalChapters: 4,
          badgeText: 'BAB 2 DARI 4',
          headline: 'Konsisten tiap hari.',
          subtext: 'Konsisten tiap hari.',
          highlightWord: 'tiap hari',
        },
        {
          chapterNumber: 3,
          totalChapters: 4,
          badgeText: 'BAB 3 DARI 4',
          headline: 'Gagal itu bagian dari proses.',
          subtext: 'Gagal itu bagian dari proses.',
          highlightWord: 'proses',
        },
        {
          chapterNumber: 4,
          totalChapters: 4,
          badgeText: 'BAB 4 DARI 4',
          headline: 'Kamu pasti bisa!',
          subtext: 'Kamu pasti bisa!',
          highlightWord: 'pasti bisa',
        },
      ],
    }));
  }, [customStylesList]);

  // Find preview module info object
  const activePreviewModule = useMemo<StyleModuleInfo>(() => {
    const foundCustom = customModuleInfos.find((m) => m.id === previewModuleId);
    if (foundCustom) return foundCustom;
    return (
      SATSET_MODULES.find((m) => m.id === previewModuleId) ||
      SATSET_MODULES[0]
    );
  }, [previewModuleId, customModuleInfos]);

  // Filtered modules by category tab (guaranteed unique by ID and title)
  const filteredModules = useMemo(() => {
    const customCreateCard = SATSET_MODULES.find((m) => m.id === 'custom')!;
    const baseList =
      activeCategory === 'custom'
        ? [...customModuleInfos, customCreateCard]
        : activeCategory === 'semua'
          ? [
              ...customModuleInfos,
              ...SATSET_MODULES.filter((m) => m.id !== 'custom'),
              customCreateCard,
            ]
          : [
              ...SATSET_MODULES.filter(
                (m) => m.id !== 'custom' && m.categories.includes(activeCategory)
              ),
              customCreateCard,
            ];

    const seenIds = new Set<string>();
    const seenTitles = new Set<string>();
    return baseList.filter((item) => {
      if (!item) return false;
      const idKey = item.id.trim().toLowerCase();
      const titleKey = item.title.trim().toLowerCase();
      if (seenIds.has(idKey) || (item.id !== 'custom' && seenTitles.has(titleKey))) {
        return false;
      }
      seenIds.add(idKey);
      seenTitles.add(titleKey);
      return true;
    });
  }, [activeCategory, customModuleInfos]);

  if (!isOpen) return null;

  const isCurrentApplied = previewModuleId === selectedModule;
  const totalUniqueStylesCount =
    SATSET_MODULES.filter((m) => m.id !== 'custom').length + customModuleInfos.length;

  const handleApplyCurrent = () => {
    soundEngine.setActiveStyle(previewModuleId);
    soundEngine.playSfx('ding', { styleId: previewModuleId });
    onSelectModule(previewModuleId);
    setShowApplyTooltip(false);
  };

  const handleFinish = () => {
    soundEngine.setActiveStyle(previewModuleId);
    soundEngine.playSfx('ding', { styleId: previewModuleId });
    onSelectModule(previewModuleId);
    onClose();
  };

  const handleSelectCard = (id: SatsetStyleModule) => {
    if (id === 'custom') {
      setIsCustomModalOpen(true);
      return;
    }
    soundEngine.setActiveStyle(id);
    soundEngine.playSfx('pop', { styleId: id });
    setPreviewModuleId(id);
    if (showDemoTooltip) setShowDemoTooltip(false);
    if (id !== selectedModule) {
      setShowApplyTooltip(true);
    } else {
      setShowApplyTooltip(false);
    }
  };

  const handleSaveCustomStyle = (newStyle: CustomStyleDefinition) => {
    const updated = getStoredCustomStyles();
    setCustomStylesList(updated);
    setPreviewModuleId(newStyle.id as SatsetStyleModule);
    onSelectModule(newStyle.id as SatsetStyleModule);
    setActiveCategory('custom');
    setIsCustomModalOpen(false);
    setShowApplyTooltip(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* ============================================================== */}
        {/* MODAL HEADER (Graph Motion Blue Theme)                         */}
        {/* ============================================================== */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              Pilih gaya video
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {totalUniqueStylesCount} gaya · Klik untuk melihat demonya
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="open-custom-style-btn"
              onClick={() => setIsCustomModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat gaya sendiri</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MODAL BODY: TWO COLUMN SPLIT LAYOUT                            */}
        {/* ============================================================== */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-zinc-200">
          
          {/* ============================================================ */}
          {/* LEFT PANE: 9:16 LIVE ANIMATED PHONE STAGE PREVIEW            */}
          {/* ============================================================ */}
          <div className="md:col-span-5 lg:col-span-4 p-3 sm:p-4 flex flex-col items-center justify-center bg-zinc-100/60 overflow-y-auto">
            <div className="w-full flex justify-center py-1">
              <StyleLivePreviewPlayer
                module={activePreviewModule}
                isApplied={isCurrentApplied}
              />
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT PANE: DYNAMIC STYLE INFO, BANNERS, TABS, CARDS GRID    */}
          {/* ============================================================ */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full bg-white overflow-hidden">
            
            {/* Scrollable container */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5">
              
              {/* STYLE SPOTLIGHT HEADER (Dynamic based on selected card, matches frame_004) */}
              <div className="space-y-1.5 pb-2 border-b border-zinc-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold tracking-wider text-blue-600 uppercase">
                    {activePreviewModule.categoryLabel || 'TEKNOLOGI & DATA'}
                  </span>
                  
                  {/* 4 Color Palette circles */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                      style={{ backgroundColor: activePreviewModule.accentColor }}
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                      style={{ backgroundColor: activePreviewModule.secondaryColor }}
                    />
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 border border-black/10 shadow-2xs" />
                    <span className="w-3.5 h-3.5 rounded-full bg-zinc-900 border border-black/10 shadow-2xs" />
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                  {activePreviewModule.title}
                </h2>

                <p className="text-xs text-zinc-500 leading-relaxed font-normal">
                  {activePreviewModule.description}
                </p>
              </div>

              {activePreviewModule.id === 'otomatis' ? (
                <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-400/35 text-[11px] leading-relaxed flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-sky-400 block text-xs">
                      Mode Acak & Adaptif Sesuai Konsep (Tanpa Pratinjau Tetap)
                    </span>
                    <p className="text-zinc-500 text-[11px] mt-0.5">
                      Gaya Otomatis tidak menampilkan pratinjau animasi visual karena setiap adegan akan diacak dan berganti gaya secara otomatis menyesuaikan konsep, isi kalimat, serta pengaturan yang sedang dibahas tanpa harus mengikuti satu gaya yang tersedia.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* WARNING BANNER 1 (Pink/Red: Saran model: Opus disarankan) */}
                  <div className="p-3 rounded-2xl bg-red-50/80 border border-red-200/70 text-[11px] text-red-700 leading-relaxed flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-red-900 block text-xs">
                        Saran model: Opus disarankan
                      </span>
                      <p className="text-red-700/90 text-[11px] mt-0.5">
                        Objeknya dirakit dari banyak bagian. Model yang lebih ringan sering membuat bentuknya berantakan.
                      </p>
                    </div>
                  </div>

                  {/* INFO BANNER 2 (Blue: Render sedang) */}
                  <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200/70 text-[11px] text-blue-800 leading-relaxed flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-1 font-extrabold text-blue-900 text-xs">
                        <span>Render sedang</span>
                      </div>
                      <p className="text-blue-800/90 text-[11px] mt-0.5">
                        Lancar di laptop. Di HP lama, preview bisa sedikit patah-patah dan export lebih lama.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* CATEGORY FILTER TABS */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none no-scrollbar">
                <CategoryTabButton
                  active={activeCategory === 'semua'}
                  onClick={() => setActiveCategory('semua')}
                  label="Semua"
                  count={SATSET_MODULES.length + customModuleInfos.length}
                />
                <CategoryTabButton
                  active={activeCategory === 'motion3d'}
                  onClick={() => setActiveCategory('motion3d')}
                  label="Motion 3D"
                  count={SATSET_MODULES.filter((m) => m.categories.includes('motion3d')).length}
                />
                <CategoryTabButton
                  active={activeCategory === 'mograph'}
                  onClick={() => setActiveCategory('mograph')}
                  label="Motion Graphics"
                  count={SATSET_MODULES.filter((m) => m.categories.includes('mograph')).length}
                />
                <CategoryTabButton
                  active={activeCategory === 'videoeditor'}
                  onClick={() => setActiveCategory('videoeditor')}
                  label="Video Editor"
                  count={SATSET_MODULES.filter((m) => m.categories.includes('videoeditor')).length}
                />
                <CategoryTabButton
                  active={activeCategory === 'cerita'}
                  onClick={() => setActiveCategory('cerita')}
                  label="Cerita"
                  count={SATSET_MODULES.filter((m) => m.categories.includes('cerita')).length}
                />
                <CategoryTabButton
                  active={activeCategory === 'ceria'}
                  onClick={() => setActiveCategory('ceria')}
                  label="Ceria & Energik"
                  count={SATSET_MODULES.filter((m) => m.categories.includes('ceria')).length}
                />
                <CategoryTabButton
                  active={activeCategory === 'modern'}
                  onClick={() => setActiveCategory('modern')}
                  label="Rapi & Modern"
                  count={SATSET_MODULES.filter((m) => m.categories.includes('modern')).length}
                />
                <CategoryTabButton
                  active={activeCategory === 'tenang'}
                  onClick={() => setActiveCategory('tenang')}
                  label="Tenang & Lembut"
                  count={SATSET_MODULES.filter((m) => m.categories.includes('tenang')).length}
                />
                <CategoryTabButton
                  active={activeCategory === 'teknologi'}
                  onClick={() => setActiveCategory('teknologi')}
                  label="Teknologi & Data"
                  count={SATSET_MODULES.filter((m) => m.categories.includes('teknologi')).length}
                />
                <CategoryTabButton
                  active={activeCategory === 'tangan'}
                  onClick={() => setActiveCategory('tangan')}
                  label="Gambar Tangan"
                  count={SATSET_MODULES.filter((m) => m.categories.includes('tangan')).length}
                />
                <CategoryTabButton
                  active={activeCategory === 'spesial'}
                  onClick={() => setActiveCategory('spesial')}
                  label="Spesial"
                  count={SATSET_MODULES.filter((m) => m.categories.includes('spesial')).length}
                />
                <CategoryTabButton
                  active={activeCategory === 'custom'}
                  onClick={() => setActiveCategory('custom')}
                  label="Buatan Sendiri"
                  count={customModuleInfos.length}
                />
              </div>

              {/* TOOLTIP POPOVER */}
              {showDemoTooltip && (
                <div className="relative z-20 flex items-center justify-between p-2.5 px-3.5 bg-zinc-900 text-white rounded-xl shadow-lg text-xs animate-in fade-in duration-300">
                  <div className="flex items-center gap-2">
                    <span className="text-sky-400">👆</span>
                    <span className="font-medium text-[11px]">
                      Klik gaya lain untuk melihat demonya
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDemoTooltip(false)}
                    className="ml-3 px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sky-400 text-[10px] font-bold transition flex items-center gap-1"
                  >
                    <span>Lewati</span>
                    <span>➔</span>
                  </button>
                </div>
              )}

              {/* STYLE CARDS GRID (3 columns on desktop, 2 on tablet) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {filteredModules.map((mod) => (
                  <StyleThumbnailCard
                    key={mod.id}
                    module={mod}
                    isSelected={previewModuleId === mod.id}
                    isApplied={selectedModule === mod.id}
                    onSelect={() => handleSelectCard(mod.id)}
                  />
                ))}
              </div>

              {/* EMPTY STATE FOR CUSTOM TAB */}
              {activeCategory === 'custom' && customModuleInfos.length === 0 && (
                <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 text-center space-y-1.5 mt-2">
                  <p className="text-xs font-bold text-blue-950">
                    Belum ada gaya buatan sendiri
                  </p>
                  <p className="text-[11px] text-zinc-600 max-w-md mx-auto">
                    Klik kartu &quot;Buat gaya sendiri!&quot; di atas untuk meracik gaya visual kustom pertamamu dengan panduan prompt AI.
                  </p>
                </div>
              )}
            </div>

            {/* ========================================================== */}
            {/* FOOTER (Matches Video & Screenshot: ✓ Pakai gaya ini / ✓ Dipakai & Selesai) */}
            {/* ========================================================== */}
            <div className="p-3.5 px-5 border-t border-zinc-200/80 bg-zinc-50 flex items-center justify-between shrink-0 relative">
              
              {/* Left action or status */}
              <div className="flex items-center gap-2">
                {isCurrentApplied ? (
                  <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold shadow-2xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Dipakai</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyCurrent}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-xs font-extrabold shadow-md transition transform active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Pakai gaya ini</span>
                  </button>
                )}
              </div>

              {/* Right: Selesai Button */}
              <button
                type="button"
                onClick={handleFinish}
                className="px-5 py-2 rounded-xl border border-blue-200 bg-blue-50/80 text-blue-600 hover:text-blue-700 hover:bg-blue-100 active:bg-blue-100 font-extrabold text-xs transition cursor-pointer"
              >
                Selesai
              </button>

              {/* Floating Tooltip below "Pakai gaya ini" */}
              {showApplyTooltip && !isCurrentApplied && (
                <div className="absolute bottom-14 left-5 z-30 bg-zinc-900 text-white rounded-xl p-2.5 px-3.5 shadow-xl text-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="space-y-0.5">
                    <p className="font-bold text-[11px] text-white">
                      Suka gaya ini? Klik untuk memakainya
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowApplyTooltip(false)}
                    className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sky-400 text-[10px] font-bold transition flex items-center gap-1"
                  >
                    <span>Lewati</span>
                    <span>➔</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isCustomModalOpen && (
        <CustomStyleModal
          isOpen={isCustomModalOpen}
          onClose={() => setIsCustomModalOpen(false)}
          onSaveStyle={handleSaveCustomStyle}
        />
      )}
    </div>
  );
};

// =======================================================================
// CATEGORY TAB BUTTON COMPONENT
// =======================================================================
interface CategoryTabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}

const CategoryTabButton: React.FC<CategoryTabButtonProps> = ({
  active,
  onClick,
  label,
  count,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
        active
          ? 'bg-zinc-900 text-white shadow-xs'
          : 'bg-zinc-100 hover:bg-zinc-200/70 text-zinc-600'
      }`}
    >
      <span>{label}</span>
      <span
        className={`text-[10px] px-1 py-0.2 rounded-md ${
          active ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-200 text-zinc-500'
        }`}
      >
        {count}
      </span>
    </button>
  );
};

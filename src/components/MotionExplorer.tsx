import React, { useState } from 'react';
import { Search, Plus, Layers, Filter, Code, Eye, ExternalLink, Tag } from 'lucide-react';
import { MotionCategory, MotionStyleItem, UiLanguage } from '../types';
import { MOTION_CATALOG } from '../data/motion-catalog';
import { getTranslation } from '../i18n/translations';

interface MotionExplorerProps {
  language: UiLanguage;
  onSelectStyleForBrief: (item: MotionStyleItem) => void;
}

export const MotionExplorer: React.FC<MotionExplorerProps> = ({
  language,
  onSelectStyleForBrief,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeModalItem, setActiveModalItem] = useState<MotionStyleItem | null>(null);

  const categories: { id: string; label: string; labelZh: string }[] = [
    { id: 'all', label: 'All Categories', labelZh: '全部类别' },
    { id: 'kineticTypography', label: 'Kinetic Typography', labelZh: '动力学排版' },
    { id: 'threeDimensional', label: '3D & Spatial', labelZh: '3D 空间力学' },
    { id: 'geometricMorph', label: 'Geometric Morphing', labelZh: '几何形变' },
    { id: 'dataInfographics', label: 'Data & Infographics', labelZh: '数据信息图表' },
    { id: 'brandAtmosphere', label: 'Atmosphere & FX', labelZh: '质感与氛围' },
  ];

  const filteredCatalog = MOTION_CATALOG.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory;

    const matchesName = item.name.toLowerCase().includes(query) || item.nameZh.includes(query);
    const matchesDesc = item.description.toLowerCase().includes(query) || item.descriptionZh.includes(query);
    const matchesTags = item.tags.some((t) => t.toLowerCase().includes(query));
    const matchesKeywords = item.promptKeywords.some((k) => k.toLowerCase().includes(query));

    return matchesCategory && (matchesName || matchesDesc || matchesTags || matchesKeywords);
  });

  return (
    <div className="h-full overflow-y-auto bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
            <Layers className="w-3.5 h-3.5" />
            <span>Motion Archetypes & Technology Pool</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            {getTranslation(language, 'catalogTitle')}
          </h1>
          <p className="text-zinc-400 text-sm">
            {getTranslation(language, 'catalogSubtitle')}
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder={getTranslation(language, 'searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                {language === 'zh' ? cat.labelZh : cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCatalog.map((item) => (
            <div
              key={item.id}
              className="group rounded-xl bg-zinc-900/70 border border-zinc-800/90 hover:border-zinc-700 p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5"
            >
              <div className="space-y-3">
                {/* Card Top: Tag + Colors */}
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                    {language === 'zh' ? item.categoryNameZh : item.categoryName}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      style={{ backgroundColor: item.accentColor }}
                      className="w-3 h-3 rounded-full shadow-sm"
                      title="Accent Color"
                    />
                    <span
                      style={{ backgroundColor: item.secondaryColor }}
                      className="w-3 h-3 rounded-full shadow-sm"
                      title="Secondary Color"
                    />
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="font-bold text-base text-zinc-100 group-hover:text-indigo-300 transition">
                    {language === 'zh' ? item.nameZh : item.name}
                  </h3>
                  <p className="text-zinc-400 text-xs mt-1.5 line-clamp-3 leading-relaxed">
                    {language === 'zh' ? item.descriptionZh : item.description}
                  </p>
                </div>

                {/* Tech Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.technologies.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-950 border border-zinc-800/80 text-zinc-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => setActiveModalItem(item)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800/70 hover:bg-zinc-800 text-zinc-300 flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{getTranslation(language, 'viewDetails')}</span>
                </button>

                <button
                  onClick={() => onSelectStyleForBrief(item)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/80 hover:bg-indigo-600 text-white flex items-center gap-1.5 transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{getTranslation(language, 'addToBrief')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Style Details Modal */}
        {activeModalItem && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span
                    style={{ backgroundColor: activeModalItem.accentColor }}
                    className="w-3.5 h-3.5 rounded-full"
                  />
                  <h3 className="text-lg font-bold text-zinc-100">
                    {language === 'zh' ? activeModalItem.nameZh : activeModalItem.name}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModalItem(null)}
                  className="text-zinc-400 hover:text-zinc-200 text-sm font-semibold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Visual Archetype Description
                  </h4>
                  <p className="text-zinc-300 leading-relaxed">
                    {language === 'zh' ? activeModalItem.descriptionZh : activeModalItem.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                    <span className="text-zinc-500 font-mono text-[10px]">RENDER ENGINE</span>
                    <p className="font-bold text-zinc-200 uppercase">{activeModalItem.renderEngine}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                    <span className="text-zinc-500 font-mono text-[10px]">CATEGORY</span>
                    <p className="font-bold text-zinc-200">{activeModalItem.categoryName}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Prompt Engineering Keywords
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeModalItem.promptKeywords.map((k) => (
                      <span
                        key={k}
                        className="px-2 py-1 rounded bg-indigo-950/60 border border-indigo-800 text-indigo-300 font-mono text-[11px]"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => setActiveModalItem(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition"
                >
                  {getTranslation(language, 'close')}
                </button>
                <button
                  onClick={() => {
                    onSelectStyleForBrief(activeModalItem);
                    setActiveModalItem(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{getTranslation(language, 'addToBrief')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { SATSET_MODULES, type StyleModuleInfo } from '../data/satset-modules.ts';
import { type SatsetStyleModule } from '../types/satset.ts';
import { ThumbnailGraphic } from './StyleThumbnailCard.tsx';

interface SatsetGalleryProps {
  onSelectModuleForVideo: (moduleId: SatsetStyleModule) => void;
}

export const SatsetGallery: React.FC<SatsetGalleryProps> = ({ onSelectModuleForVideo }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6 text-zinc-900">
      {/* Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
          Modul Visual Animasi
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900">
          Ini hasilnya. Diproduksi langsung di Graph Motion.
        </h2>
        <p className="text-zinc-600 text-sm leading-relaxed">
          Semua contoh gaya visual di bawah ini diproduksi langsung oleh AI engine Graph Motion &amp; Remotion Studio. Pilih gaya yang paling cocok untuk brand dan kontenmu.
        </p>
      </div>

      {/* Grid of Styles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {SATSET_MODULES.map((mod) => (
          <div
            key={mod.id}
            className="group bg-white rounded-3xl p-5 border border-zinc-200 shadow-sm hover:shadow-xl hover:border-blue-500 transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Card Thumbnail Mockup - High Fidelity Vector Graphic */}
              <div
                className="w-full h-44 rounded-2xl border border-zinc-200/80 relative overflow-hidden group-hover:scale-102 transition shadow-inner bg-zinc-900"
              >
                <ThumbnailGraphic module={mod} />

                {mod.tag && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#2563eb] text-white uppercase shadow-sm z-10">
                    {mod.tag}
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-extrabold text-base text-zinc-900 group-hover:text-blue-600 transition">
                  {mod.title}
                </h3>
                <p className="text-xs font-semibold text-blue-600 mt-0.5">{mod.subtitle}</p>
                <p className="text-zinc-500 text-xs mt-2 line-clamp-3 leading-relaxed">
                  {mod.description}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-400">SFX: {mod.defaultSfx}</span>
              <button
                onClick={() => onSelectModuleForVideo(mod.id)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
              >
                <span>Pakai Gaya Ini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Style Callout Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-3xl p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="text-3xl">✂️ 🎨</span>
          <h3 className="text-2xl font-extrabold tracking-tight">
            Bisa bikin gaya desain sendiri secara kustom.
          </h3>
          <p className="text-blue-100 text-sm leading-relaxed">
            Ceritakan referensi gaya yang kamu mau, misalnya “kolase kertas”, “komik jadul”, atau warna brand-mu. Graph Motion meracik jadi gaya animasi baru dan kode Remotion yang bisa kamu pakai berulang kali.
          </p>
        </div>

        <button
          onClick={() => onSelectModuleForVideo('custom')}
          className="px-6 py-3.5 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-extrabold text-sm shadow-lg transition active:scale-95 shrink-0"
        >
          Racik Gaya Kustom AI
        </button>
      </div>
    </div>
  );
};

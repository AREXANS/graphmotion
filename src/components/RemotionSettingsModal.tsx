import React from 'react';
import {
  X,
  Sliders,
  RotateCcw,
  FileCode,
  Check,
  Trash2,
  Undo2,
  Tv,
  Layers,
  Volume2,
  Film,
  Zap,
} from 'lucide-react';
import { SatsetProject } from '../types/satset';

interface RemotionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: SatsetProject;
  onResetRemotionSettings: () => void;
  onRevertRules: () => void;
  onDeleteCurrentProject: () => void;
  onOpenRemotionCode: () => void;
}

export const RemotionSettingsModal: React.FC<RemotionSettingsModalProps> = ({
  isOpen,
  onClose,
  project,
  onResetRemotionSettings,
  onRevertRules,
  onDeleteCurrentProject,
  onOpenRemotionCode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#FAF8F5] rounded-3xl w-full max-w-lg shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* HEADER */}
        <div className="px-5 py-4 bg-white border-b border-zinc-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 leading-tight">
                Pengaturan Tools Remotion
              </h3>
              <p className="text-[11px] text-zinc-500">
                Kelola mesin render, aturan, dan konfigurasi animasi video
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Active Configuration Summary Card */}
          <div className="bg-white rounded-2xl p-4 border border-zinc-200 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-blue-500" />
                <span>Status Render Remotion</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
                Engine Siap (v4.0)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                <span className="text-zinc-400 block text-[10px]">Resolusi &amp; FPS</span>
                <span className="font-extrabold text-zinc-800">
                  {project.aspect_ratio === '16:9' ? '1280 x 720' : project.aspect_ratio === '1:1' ? '1080 x 1080' : '720 x 1280'} · 30 FPS
                </span>
              </div>

              <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                <span className="text-zinc-400 block text-[10px]">Target Durasi</span>
                <span className="font-extrabold text-zinc-800">
                  {project.target_duration_sec || project.durationSeconds || 60} detik ({Math.ceil((project.target_duration_sec || 60) * 30)} frame)
                </span>
              </div>

              <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                <span className="text-zinc-400 block text-[10px]">Gaya Animasi</span>
                <span className="font-extrabold text-zinc-800 truncate block">
                  {project.gaya_video || project.styleModule || 'Diorama Data'}
                </span>
              </div>

              <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                <span className="text-zinc-400 block text-[10px]">Audio &amp; Subtitle</span>
                <span className="font-extrabold text-zinc-800 truncate block">
                  {project.voice_character || 'Charon'} · {project.subtitle_style || 'satsetYellow'}
                </span>
              </div>
            </div>
          </div>

          {/* Action 1: Reset Settingan Tools Remotion */}
          <div className="bg-white rounded-2xl p-4 border border-blue-200/90 shadow-2xs space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <RotateCcw className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-zinc-900">
                  Reset Settingan Tools Remotion
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Kembalikan durasi (60s), rasio 9:16, gaya default, tempo energik, dan audio standar studio.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onResetRemotionSettings();
                onClose();
              }}
              className="w-full mt-1 py-2 px-3.5 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Semua Settingan Remotion ke Default</span>
            </button>
          </div>

          {/* Action 2: Batalkan Aturan Proyek */}
          <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-2xs space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
                <Undo2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-zinc-900">
                  Batalkan Aturan Proyek
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Batalkan perubahan form yang belum disimpan dan kembalikan aturan semula.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onRevertRules();
                onClose();
              }}
              className="w-full mt-1 py-2 px-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Kembalikan Aturan Semula</span>
            </button>
          </div>

          {/* Action 3: Hapus Proyek Ini */}
          <div className="bg-white rounded-2xl p-4 border border-rose-200/80 shadow-2xs space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-rose-900">
                  Hapus Proyek Ini
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Hapus proyek &quot;{project.project_title || project.title}&quot;. Jika ini proyek terakhir, proyek baru yang bersih akan dibuat.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Yakin ingin menghapus proyek "${project.project_title || project.title}"? Semua scene dan naskah akan dihapus.`)) {
                  onDeleteCurrentProject();
                  onClose();
                }
              }}
              className="w-full mt-1 py-2 px-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Proyek Ini Sekarang</span>
            </button>
          </div>

          {/* Action 4: Buka Kode Remotion */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                onOpenRemotionCode();
                onClose();
              }}
              className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <FileCode className="w-4 h-4 text-sky-400" />
              <span>Buka Editor &amp; Export Kode Remotion (TSX)</span>
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-5 py-3 bg-zinc-100/80 border-t border-zinc-200/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

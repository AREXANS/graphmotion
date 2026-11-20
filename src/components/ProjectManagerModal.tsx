import React, { useState } from 'react';
import {
  X,
  Plus,
  Folder,
  FolderOpen,
  Trash2,
  Clock,
  CheckCircle2,
  Film,
} from 'lucide-react';
import { type SatsetProject } from '../types/satset.ts';
import { GraphMotionLogoMark } from './GraphMotionBrandLogo.tsx';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: SatsetProject[];
  currentProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateNewProject: (name: string) => void;
  onDeleteProject: (id: string) => void;
  themeMode?: 'dark' | 'light';
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  projects,
  currentProjectId,
  onSelectProject,
  onCreateNewProject,
  onDeleteProject,
  themeMode = 'dark',
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const isLight = themeMode === 'light';

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onCreateNewProject(newProjectName.trim());
    setNewProjectName('');
    onClose();
  };

  return (
    <div
      data-testid="project-manager-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-colors ${
          isLight
            ? 'bg-white border-blue-200 text-slate-900 shadow-blue-900/15'
            : 'bg-[#041029] border-sky-400/30 text-[#f0f9ff] shadow-[0_24px_60px_rgba(2,8,23,0.92)]'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isLight
              ? 'border-blue-100 bg-blue-50/70'
              : 'border-sky-400/20 bg-[#061536]'
          }`}
        >
          <div className="flex items-center gap-3">
            <GraphMotionLogoMark className="w-8 h-8 shrink-0 drop-shadow-[0_0_12px_rgba(56,189,248,0.45)]" />
            <div>
              <h3
                className={`font-extrabold text-base tracking-tight ${
                  isLight ? 'text-slate-950' : 'text-white'
                }`}
              >
                Kelola Proyek Video
              </h3>
              <p
                className={`text-[11px] font-mono ${
                  isLight ? 'text-blue-700' : 'text-sky-300/80'
                }`}
              >
                GRAPH MOTION // PROJECT WORKSPACE ({projects.length} PROYEK)
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="close-project-modal-btn"
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition cursor-pointer ${
              isLight
                ? 'bg-white border-blue-200 text-slate-600 hover:text-slate-950 hover:bg-blue-50'
                : 'bg-[#091e4a] border-sky-400/25 text-sky-200 hover:text-white hover:border-sky-400'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create New Project Form */}
        <form
          onSubmit={handleCreate}
          className={`p-4 border-b ${
            isLight
              ? 'border-blue-100 bg-slate-50/70'
              : 'border-sky-400/15 bg-[#030b1e]/80'
          }`}
        >
          <label
            className={`block text-[11px] font-mono font-bold uppercase tracking-wider mb-2 ${
              isLight ? 'text-blue-800' : 'text-sky-300'
            }`}
          >
            + Buat Proyek Baru
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              data-testid="new-project-name-input"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Ketik judul proyek baru (contoh: Edukasi Finansial)..."
              className={`flex-1 rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none transition ${
                isLight
                  ? 'bg-white border-blue-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500'
                  : 'bg-[#071636] border-sky-400/30 text-white placeholder:text-sky-300/40 focus:border-sky-400'
              }`}
            />
            <button
              type="submit"
              data-testid="submit-create-project-btn"
              disabled={!newProjectName.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-300 hover:from-sky-300 hover:to-cyan-200 disabled:opacity-40 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-[0_0_20px_rgba(56,189,248,0.35)]"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Proyek</span>
            </button>
          </div>
        </form>

        {/* Project List or Empty State */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          <div className="flex items-center justify-between px-1 mb-1">
            <span
              className={`text-[11px] font-mono font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-500' : 'text-sky-300/75'
              }`}
            >
              Daftar Proyek Anda ({projects.length})
            </span>
          </div>

          {projects.length === 0 ? (
            <div
              data-testid="project-manager-empty-state"
              className={`rounded-2xl border border-dashed p-8 text-center flex flex-col items-center justify-center space-y-3 ${
                isLight
                  ? 'bg-blue-50/50 border-blue-200 text-slate-700'
                  : 'bg-[#061433]/65 border-sky-400/25 text-sky-100'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
                  isLight
                    ? 'bg-white border-blue-200 text-blue-600'
                    : 'bg-[#091e4a] border-sky-400/30 text-sky-300 shadow-[0_0_24px_rgba(56,189,248,0.2)]'
                }`}
              >
                <FolderOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-xs">
                <h4
                  className={`text-sm font-extrabold ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  Belum Ada Proyek yang Dibuat
                </h4>
                <p
                  className={`text-xs leading-relaxed ${
                    isLight ? 'text-slate-600' : 'text-sky-200/75'
                  }`}
                >
                  Daftar proyek masih kosong. Ketik nama proyek di kolom atas lalu klik{' '}
                  <strong className="text-sky-400">Buat Proyek</strong> untuk mulai menggunakan tools Remotion.
                </p>
              </div>
            </div>
          ) : (
            projects.map((p) => {
              const isSelected = p.id === currentProjectId;
              const title = p.project_title || p.title || 'Proyek Tanpa Judul';
              const sceneCount = p.scenes?.length || 0;
              const dur = p.target_duration_sec || p.durationSeconds || 30;
              const styleMod = p.gaya_video || p.styleModule || 'scribble3d';

              return (
                <div
                  key={p.id}
                  data-testid={`project-item-${p.id}`}
                  onClick={() => {
                    onSelectProject(p.id);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? isLight
                        ? 'bg-blue-50 border-blue-500 shadow-sm'
                        : 'bg-[#0a2152] border-sky-400 shadow-[0_0_22px_rgba(56,189,248,0.18)]'
                      : isLight
                      ? 'bg-white border-blue-200/80 hover:border-blue-400'
                      : 'bg-[#061433]/90 border-sky-400/20 hover:border-sky-400/50'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 pr-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                        isSelected
                          ? 'bg-sky-400 text-slate-950 border-sky-300'
                          : isLight
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-[#091e4a] border-sky-400/25 text-sky-300'
                      }`}
                    >
                      <Film className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`font-bold text-sm truncate ${
                            isSelected
                              ? isLight
                                ? 'text-blue-700'
                                : 'text-sky-300'
                              : isLight
                              ? 'text-slate-900'
                              : 'text-white'
                          }`}
                        >
                          {title}
                        </h4>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-300 border border-sky-400/40 text-[10px] font-bold flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Aktif
                          </span>
                        )}
                      </div>
                      <div
                        className={`flex items-center gap-3 mt-1 text-[11px] font-mono ${
                          isLight ? 'text-slate-500' : 'text-sky-200/70'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {dur} dtk
                        </span>
                        <span>•</span>
                        <span>{sceneCount} Adegan</span>
                        <span>•</span>
                        <span className="text-sky-400 truncate max-w-[120px]">
                          {styleMod}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    data-testid={`delete-project-btn-${p.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(p.id);
                    }}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition shrink-0 cursor-pointer ${
                      isLight
                        ? 'text-slate-400 hover:bg-red-50 hover:text-red-600'
                        : 'text-sky-300/50 hover:bg-red-500/20 hover:text-red-400'
                    }`}
                    title="Hapus proyek"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

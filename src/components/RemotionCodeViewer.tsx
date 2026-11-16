import React, { useState, useMemo, useEffect } from 'react';
import { SatsetProject } from '../types/satset';
import { generateRemotionCode } from '../utils/remotion-generator';
import {
  Copy,
  Check,
  Download,
  Code2,
  Terminal,
  FileCode,
  Sliders,
  UploadCloud,
  Layers,
  Film,
  Box,
} from 'lucide-react';

interface RemotionCodeViewerProps {
  project: SatsetProject;
  themeMode?: 'dark' | 'light';
  onOpenUploader?: () => void;
}

export const RemotionCodeViewer: React.FC<RemotionCodeViewerProps> = ({
  project,
  themeMode = 'dark',
  onOpenUploader,
}) => {
  const [activeFile, setActiveFile] = useState<
    'composition' | 'root' | 'blueprint' | 'guide'
  >('composition');
  const [codeDimension, setCodeDimension] = useState<'2d' | '3d'>(
    project.render_dimension ?? '3d'
  );
  useEffect(() => {
    setCodeDimension(project.render_dimension ?? '3d');
  }, [project.render_dimension]);
  const [copied, setCopied] = useState(false);

  const isLight = themeMode === 'light';
  const generated = useMemo(
    () => generateRemotionCode(project, project.fps || 30, { renderDimension: codeDimension }),
    [project, codeDimension]
  );
  const compositionCode = generated.compositionTsx;
  const rootCode = generated.rootTsx;
  const blueprintCode = generated.blueprintJson;

  const currentCode =
    activeFile === 'composition'
      ? compositionCode
      : activeFile === 'root'
      ? rootCode
      : blueprintCode;

  const lineCount = useMemo(
    () => currentCode.split('\n').length,
    [currentCode]
  );
  const projectTitle = project.project_title || project.title || 'GraphMotionProject';
  const aspectRatio = project.aspect_ratio || '9:16';
  const durationSec = project.target_duration_sec || project.durationSeconds || 30;
  const totalFrames = Math.max(30, Math.round(durationSec * (project.fps || 30)));
  const sceneCount = project.scenes?.length || 0;
  const characterLabel = (project.character || 'stickman_samping').toUpperCase();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      data-testid="remotion-code-viewer"
      className="max-w-6xl mx-auto space-y-6 pb-16"
    >
      {/* Architectural Graph Motion Header Card */}
      <div
        className={`relative rounded-2xl border p-6 sm:p-8 overflow-hidden transition-colors ${
          isLight
            ? 'bg-white border-blue-200/90 text-slate-950 shadow-[0_14px_34px_rgba(37,99,235,0.08)]'
            : 'bg-[#041029]/95 border-sky-400/25 text-slate-100 shadow-[0_20px_50px_rgba(2,8,23,0.85)]'
        }`}
      >
        <div className="flex flex-col gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex h-2 w-2 rounded-full bg-sky-400 shrink-0" />
              <span
                className={`text-[11px] font-mono font-semibold uppercase tracking-[0.18em] ${
                  isLight ? 'text-blue-700' : 'text-sky-300'
                }`}
              >
                REMOTION STUDIO // TSX COMPILER
              </span>
              <span
                aria-hidden="true"
                className={`h-[1px] w-6 ${
                  isLight ? 'bg-blue-300' : 'bg-sky-400/40'
                }`}
              />
              <span
                className={`text-[11px] font-mono tabular-nums ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {aspectRatio} · 30 FPS · {totalFrames} FRAMES
              </span>
            </div>

            <h1
              className={`text-2xl sm:text-3xl font-extrabold tracking-[-0.025em] ${
                isLight ? 'text-slate-950' : 'text-white'
              }`}
            >
              Export Kode Remotion TSX & Blueprint
            </h1>

            <p
              className={`text-xs sm:text-sm leading-relaxed ${
                isLight ? 'text-slate-600' : 'text-slate-300'
              }`}
            >
              Komposisi proyek{' '}
              <span
                className={`font-semibold ${
                  isLight ? 'text-blue-700' : 'text-sky-300'
                }`}
              >
                {projectTitle}
              </span>{' '}
              dikompilasi otomatis ke komponen React Remotion murni beserta
              interpolasi keyframe, kamera, dan sinkronisasi subtitle.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div
              data-testid="tsx-dimension-toggle"
              className={`flex items-center gap-1 p-1 rounded-xl border ${
                isLight
                  ? 'bg-blue-50/70 border-blue-200'
                  : 'bg-[#020817] border-sky-400/30'
              }`}
            >
              <button
                type="button"
                data-testid="tsx-mode-3d"
                onClick={() => setCodeDimension('3d')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  codeDimension === '3d'
                    ? 'bg-sky-400 text-slate-950 shadow-xs'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>3D WebGL (@remotion/three)</span>
              </button>
              <button
                type="button"
                data-testid="tsx-mode-2d"
                onClick={() => setCodeDimension('2d')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  codeDimension === '2d'
                    ? 'bg-sky-400 text-slate-950 shadow-xs'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>2.5D Motion</span>
              </button>
            </div>

            {onOpenUploader && (
              <button
                type="button"
                onClick={onOpenUploader}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  isLight
                    ? 'bg-blue-50/90 border-blue-200 text-blue-800 hover:bg-blue-100'
                    : 'bg-[#071636] border-sky-400/30 text-sky-200 hover:border-sky-300 hover:text-white'
                }`}
              >
                <UploadCloud className="w-4 h-4 text-sky-400" />
                <span>Import File TSX</span>
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                handleDownload('SatsetComposition.tsx', compositionCode)
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-200 text-slate-950 text-xs font-bold shadow-[0_0_24px_rgba(56,189,248,0.35)] hover:shadow-[0_0_32px_rgba(56,189,248,0.6)] transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh SatsetComposition.tsx</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownload('Root.tsx', rootCode)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                isLight
                  ? 'bg-white border-blue-200 text-slate-800 hover:bg-slate-50'
                  : 'bg-[#071636] border-sky-400/30 text-slate-100 hover:border-sky-300'
              }`}
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>Unduh Root.tsx</span>
            </button>
          </div>
        </div>

        {/* Telemetry Summary Strip */}
        <div
          className={`mt-6 pt-5 border-t grid grid-cols-2 sm:grid-cols-4 gap-4 ${
            isLight ? 'border-blue-100' : 'border-sky-400/15'
          }`}
        >
          <div>
            <div
              className={`text-[10px] font-mono uppercase tracking-wider ${
                isLight ? 'text-slate-500' : 'text-sky-300/70'
              }`}
            >
              Jumlah Adegan
            </div>
            <div
              className={`mt-0.5 text-lg font-extrabold font-mono tabular-nums ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {sceneCount} Scene
            </div>
          </div>

          <div>
            <div
              className={`text-[10px] font-mono uppercase tracking-wider ${
                isLight ? 'text-slate-500' : 'text-sky-300/70'
              }`}
            >
              Durasi Timeline
            </div>
            <div
              className={`mt-0.5 text-lg font-extrabold font-mono tabular-nums ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {durationSec.toFixed(1)}s ({totalFrames}f)
            </div>
          </div>

          <div>
            <div
              className={`text-[10px] font-mono uppercase tracking-wider ${
                isLight ? 'text-slate-500' : 'text-sky-300/70'
              }`}
            >
              Rasio & Karakter
            </div>
            <div
              className={`mt-0.5 text-lg font-extrabold font-mono tabular-nums ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {aspectRatio} · {characterLabel}
            </div>
          </div>

          <div>
            <div
              className={`text-[10px] font-mono uppercase tracking-wider ${
                isLight ? 'text-slate-500' : 'text-sky-300/70'
              }`}
            >
              Baris Kode Aktif
            </div>
            <div
              className={`mt-0.5 text-lg font-extrabold font-mono tabular-nums ${
                isLight ? 'text-blue-700' : 'text-sky-300'
              }`}
            >
              {lineCount} LOC
            </div>
          </div>
        </div>
      </div>

      {/* File Navigation & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Pilih Berkas Remotion"
          className={`flex flex-wrap items-center gap-1.5 p-1 rounded-xl border ${
            isLight
              ? 'bg-white border-blue-200/90'
              : 'bg-[#041029] border-sky-400/25'
          }`}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeFile === 'composition'}
            onClick={() => setActiveFile('composition')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeFile === 'composition'
                ? 'bg-sky-400 text-slate-950 font-bold shadow-xs'
                : isLight
                ? 'text-slate-600 hover:text-slate-950 hover:bg-blue-50/60'
                : 'text-slate-300 hover:text-white hover:bg-[#071636]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>SatsetComposition.tsx</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeFile === 'root'}
            onClick={() => setActiveFile('root')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeFile === 'root'
                ? 'bg-sky-400 text-slate-950 font-bold shadow-xs'
                : isLight
                ? 'text-slate-600 hover:text-slate-950 hover:bg-blue-50/60'
                : 'text-slate-300 hover:text-white hover:bg-[#071636]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Root.tsx</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeFile === 'blueprint'}
            onClick={() => setActiveFile('blueprint')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeFile === 'blueprint'
                ? 'bg-sky-400 text-slate-950 font-bold shadow-xs'
                : isLight
                ? 'text-slate-600 hover:text-slate-950 hover:bg-blue-50/60'
                : 'text-slate-300 hover:text-white hover:bg-[#071636]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Prompt Blueprint JSON</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeFile === 'guide'}
            onClick={() => setActiveFile('guide')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeFile === 'guide'
                ? 'bg-sky-400 text-slate-950 font-bold shadow-xs'
                : isLight
                ? 'text-slate-600 hover:text-slate-950 hover:bg-blue-50/60'
                : 'text-slate-300 hover:text-white hover:bg-[#071636]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Panduan CLI Remotion</span>
          </button>
        </div>

        {activeFile !== 'guide' && (
          <div className="flex items-center gap-2">
            {activeFile === 'blueprint' && (
              <button
                type="button"
                onClick={() =>
                  handleDownload(
                    `${projectTitle
                      .toLowerCase()
                      .replace(/\s+/g, '-')}-blueprint.json`,
                    blueprintCode
                  )
                }
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  isLight
                    ? 'bg-white border-blue-200 text-slate-800 hover:bg-blue-50'
                    : 'bg-[#071636] border-sky-400/30 text-sky-200 hover:border-sky-300'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Blueprint</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                copied
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                  : isLight
                  ? 'bg-white border-blue-200 text-slate-800 hover:bg-blue-50'
                  : 'bg-[#071636] border-sky-400/30 text-sky-100 hover:border-sky-300'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tersalin ke Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-sky-400" />
                  <span>Salin Kode</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeFile === 'guide' ? (
        <div
          className={`rounded-2xl border p-6 sm:p-8 space-y-6 ${
            isLight
              ? 'bg-white border-blue-200/90 text-slate-900'
              : 'bg-[#041029]/95 border-sky-400/25 text-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-400/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2
                className={`text-lg font-bold ${
                  isLight ? 'text-slate-950' : 'text-white'
                }`}
              >
                Alur Produksi di Remotion Studio Lokal
              </h2>
              <p
                className={`text-xs ${
                  isLight ? 'text-slate-600' : 'text-slate-300'
                }`}
              >
                Jalankan komposisi ini di lingkungan Node.js lokal untuk render
                MP4/WebM dengan akselerasi FFmpeg.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`rounded-xl border p-5 space-y-3 ${
                isLight
                  ? 'bg-blue-50/50 border-blue-200/80'
                  : 'bg-[#071636]/80 border-sky-400/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-400">
                  LANGKAH 01
                </span>
                <Layers className="w-4 h-4 text-sky-400" />
              </div>
              <h3
                className={`text-sm font-bold ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                Inisialisasi Proyek Remotion
              </h3>
              <p
                className={`text-xs leading-relaxed ${
                  isLight ? 'text-slate-600' : 'text-slate-300'
                }`}
              >
                Buat repositori Remotion baru melalui terminal atau gunakan
                workspace Remotion yang sudah ada.
              </p>
              <pre className="p-3 rounded-lg bg-[#020817] border border-sky-400/20 text-sky-300 font-mono text-xs overflow-x-auto">
                {codeDimension === '3d'
                  ? 'npx create-video@latest\nnpm i @remotion/three three @types/three'
                  : 'npx create-video@latest'}
              </pre>
            </div>

            <div
              className={`rounded-xl border p-5 space-y-3 ${
                isLight
                  ? 'bg-blue-50/50 border-blue-200/80'
                  : 'bg-[#071636]/80 border-sky-400/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-400">
                  LANGKAH 02
                </span>
                <FileCode className="w-4 h-4 text-sky-400" />
              </div>
              <h3
                className={`text-sm font-bold ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                Salin Berkas TSX
              </h3>
              <p
                className={`text-xs leading-relaxed ${
                  isLight ? 'text-slate-600' : 'text-slate-300'
                }`}
              >
                Tempatkan{' '}
                <code className="text-sky-400 font-mono">
                  SatsetComposition.tsx
                </code>{' '}
                dan <code className="text-sky-400 font-mono">Root.tsx</code> ke
                dalam folder <code className="text-sky-400 font-mono">src/</code>
                .
              </p>
              <pre className="p-3 rounded-lg bg-[#020817] border border-sky-400/20 text-sky-300 font-mono text-xs overflow-x-auto">
                cp SatsetComposition.tsx Root.tsx ./src/
              </pre>
            </div>

            <div
              className={`rounded-xl border p-5 space-y-3 ${
                isLight
                  ? 'bg-blue-50/50 border-blue-200/80'
                  : 'bg-[#071636]/80 border-sky-400/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">
                  LANGKAH 03
                </span>
                <Terminal className="w-4 h-4 text-amber-400" />
              </div>
              <h3
                className={`text-sm font-bold ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                Preview & Render MP4
              </h3>
              <p
                className={`text-xs leading-relaxed ${
                  isLight ? 'text-slate-600' : 'text-slate-300'
                }`}
              >
                Buka timeline editor interaktif atau render langsung ke berkas
                video MP4 kualitas studio.
              </p>
              <pre className="p-3 rounded-lg bg-[#020817] border border-sky-400/20 text-amber-300 font-mono text-xs overflow-x-auto">
                npx remotion studio{'\n'}npx remotion render SatsetVideo out.mp4
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-sky-400/25 bg-[#020817] overflow-hidden shadow-[0_20px_50px_rgba(2,8,23,0.9)]">
          <div className="px-4 py-3 bg-[#041029] border-b border-sky-400/20 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
              </div>
              <span className="text-sky-200 font-semibold">
                {activeFile === 'composition'
                  ? 'src/SatsetComposition.tsx'
                  : activeFile === 'root'
                  ? 'src/Root.tsx'
                  : 'satset-prompt-blueprint.json'}
              </span>
            </div>
            <span className="text-sky-400/80 text-[11px] tabular-nums">
              TypeScript React · {lineCount} baris
            </span>
          </div>

          <pre className="p-5 sm:p-6 text-xs font-mono text-sky-100 overflow-x-auto leading-relaxed max-h-[620px] overflow-y-auto selection:bg-sky-500/30">
            <code>{currentCode}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

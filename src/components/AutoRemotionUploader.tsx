import React, { useState } from 'react';
import { SATSET_MODULES } from '../data/satset-modules.ts';
import {
  type SatsetProject,
  type SatsetScene,
  type SatsetStyleModule,
  type UploadedTutorialMediaItem,
} from '../types/satset.ts';
import { parseAndValidateAIBlueprint } from '../utils/remotion-generator.ts';
import {
  parseReactToVideoInput,
  type ParsedReactScenePreview,
} from '../utils/react-to-video-parser.ts';
import { synchronizeProjectPipeline } from '../utils/pipeline-sync.ts';
import {
  processUploadedTutorialMediaFiles,
  registerSceneUploadedMediaAsset,
  getStepFocusRegion,
} from '../utils/website-media-engine.ts';
import {
  UploadCloud,
  Wand2,
  FileCode2,
  ArrowRight,
  Code2,
  CheckCircle2,
  Layers,
  Image as ImageIcon,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface AutoRemotionUploaderProps {
  onProjectReady: (project: SatsetProject) => void;
  onOpenRemotionCode: (project: SatsetProject) => void;
  themeMode?: 'dark' | 'light';
}

const selectableModules = SATSET_MODULES.filter((m) => m.id !== 'custom').slice(0, 15);

const SAMPLE_REACT_TO_VIDEO_TSX = `import React from 'react';
import { Sequence, AbsoluteFill } from 'remotion';

export const DemoExplainerComposition: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#020817' }}>
    <Sequence from={0} durationInFrames={120} name="Hook Pembuka">
      <h1>Berhenti Bikin Slide Video Kaku!</h1>
      <p>Sekarang komponen React bisa langsung berubah jadi animasi 3D berpegas.</p>
    </Sequence>
    <Sequence from={120} durationInFrames={135} name="Grafik Retensi">
      <h2>Retensi Naik 340% Dengan Motion</h2>
      <p>Grafik batang tumbuh bertahap dan kamera push-in pelan menjaga mata penonton.</p>
    </Sequence>
    <Sequence from={255} durationInFrames={135} name="Langkah Praktis">
      <h2>Tiga Langkah Ekspor Remotion</h2>
      <p>Pertama ekstrak TSX, kedua sinkron pose karakter, ketiga render 30 FPS siap upload.</p>
    </Sequence>
    <Sequence from={390} durationInFrames={120} name="CTA Aksi">
      <h2>Simpan & Render Video Sekarang!</h2>
      <p>Klik export Remotion untuk mendapatkan komposisi lengkap tanpa kode kaku.</p>
    </Sequence>
  </AbsoluteFill>
);`;

export const AutoRemotionUploader: React.FC<AutoRemotionUploaderProps> = ({
  onProjectReady,
  onOpenRemotionCode,
  themeMode = 'dark',
}) => {
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([
    'diorama_data',
    'cara_kerja',
    'neon_game',
    'kinetik_hud',
  ]);
  const [topic, setTopic] = useState(
    'Kenapa kerja keras saja tanpa leverage sistem tidak akan membuatmu bebas finansial'
  );
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [rawCodePreview, setRawCodePreview] = useState<string>('');
  const [parseStatus, setParseStatus] = useState<string | null>(null);
  const [parsedScenesPreview, setParsedScenesPreview] = useState<ParsedReactScenePreview[]>([]);
  const [uploadedMediaItems, setUploadedMediaItems] = useState<UploadedTutorialMediaItem[]>([]);

  const isLight = themeMode === 'light';

  const analyzeReactCodeContent = (content: string, sourceLabel: string) => {
    setUploadedFileName(sourceLabel);
    setRawCodePreview(content);
    if (!content.trim()) {
      setParsedScenesPreview([]);
      setParseStatus(null);
      return;
    }
    const parsed = parseReactToVideoInput(content, sourceLabel, topic);
    setAspectRatio(parsed.detectedAspectRatio === '16:9' ? '16:9' : '9:16');
    setParsedScenesPreview(parsed.scenesPreview);
    setParseStatus(
      `Berhasil mengekstrak ${parsed.scenesPreview.length} adegan (${parsed.project.target_duration_sec}s · ${parsed.sourceKind}) dari ${sourceLabel}`
    );
  };

  const toggleModule = (id: string) => {
    setSelectedModuleIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      analyzeReactCodeContent(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const processed = await processUploadedTutorialMediaFiles(files);
    e.target.value = '';
    if (processed.length > 0) {
      setUploadedMediaItems((prev) => [...prev, ...processed]);
    }
  };

  const attachUploadedMediaToProject = (proj: SatsetProject): SatsetProject => {
    if (uploadedMediaItems.length === 0) return proj;
    const nextScenes = proj.scenes.map((sc, idx) => {
      const mediaItem = uploadedMediaItems[idx];
      if (!mediaItem) return sc;
      const updated: SatsetScene = {
        ...sc,
        media_url: mediaItem.url,
        media_type: mediaItem.type,
        media_key: mediaItem.key,
        media_filename: mediaItem.filename,
        focus_region: sc.focus_region || getStepFocusRegion(undefined, idx),
      };
      registerSceneUploadedMediaAsset(updated);
      return updated;
    });
    return {
      ...proj,
      scenes: nextScenes,
    };
  };

  const handleImportDetectedTsxToStudio = () => {
    if (!rawCodePreview.trim()) return;
    const parsed = parseReactToVideoInput(
      rawCodePreview,
      uploadedFileName || 'UploadedRemotion.tsx',
      topic
    );
    const parsedProject = attachUploadedMediaToProject({
      ...parsed.project,
      aspect_ratio: aspectRatio,
    });
    onProjectReady(parsedProject);
  };

  const handleGenerateAutoRemotion = (openCodeDirectly: boolean) => {
    if (rawCodePreview.trim()) {
      const parsed = parseReactToVideoInput(
        rawCodePreview,
        uploadedFileName || 'UploadedRemotion.tsx',
        topic
      );
      const parsedProject = attachUploadedMediaToProject({
        ...parsed.project,
        aspect_ratio: aspectRatio,
      });
      if (openCodeDirectly) {
        onOpenRemotionCode(parsedProject);
      } else {
        onProjectReady(parsedProject);
      }
      return;
    }

    const activeMods =
      selectedModuleIds.length > 0
        ? selectedModuleIds
        : ['studio_3d_room', 'editorial_motion_grid', 'cara_kerja', 'neon_game'];
    const scenes: SatsetScene[] = activeMods.map((modId, idx) => {
      const mod =
        SATSET_MODULES.find((m) => m.id === modId) || SATSET_MODULES[0];
      const mediaItem = uploadedMediaItems[idx];
      const narration =
        idx === 0
          ? `${topic}. Mari kita bedah secara visual!`
          : idx === activeMods.length - 1
          ? `Mulai bangun sistem dan aset digitalmu hari ini!`
          : `Pada tahap ke-${idx}, modul ${mod.title} memvisualisasikan konsep ini secara terukur.`;
      const sceneObj: SatsetScene = {
        id: `auto-sc-${idx + 1}`,
        scene_number: idx + 1,
        role:
          idx === 0
            ? 'hook'
            : idx === activeMods.length - 1
            ? 'cta'
            : idx === 1
            ? 'contrast_example'
            : 'body_core_point',
        target_duration_sec: 4.5,
        durationSeconds: 4.5,
        narration_text: narration,
        voiceScript: narration,
        on_screen_text: `${mod.title.toUpperCase()}`,
        hookText: `${mod.title.toUpperCase()}`,
        emphasis_words: [mod.title.split(' ')[0]],
        visual_animation: {
          layout:
            idx === 1
              ? 'split_compare_cards'
              : idx === 2
              ? 'animated_bar_metrics'
              : 'hero_kinetic_stage',
          remotion_animation: 'spring_overshoot_pop',
          asset_elements: [mod.title.split(' ')[0].toUpperCase(), '3D RIG', '60 FPS'],
        },
        sfx: { file: 'sfx_studio3d_whoosh.mp3', type: 'whoosh', play_at_second: 0 },
        visualModule: mod.id,
        accentColor: mod.accentColor,
        secondaryColor: mod.secondaryColor,
        media_url: mediaItem?.url,
        media_type: mediaItem?.type,
        media_key: mediaItem?.key,
        media_filename: mediaItem?.filename,
        focus_region: mediaItem ? getStepFocusRegion(undefined, idx) : undefined,
      };
      if (mediaItem) {
        registerSceneUploadedMediaAsset(sceneObj);
      }
      return sceneObj;
    });

    const primaryStyle = (activeMods[0] as SatsetStyleModule) || 'studio_3d_room';
    const rawProject: SatsetProject = {
      id: `proj-auto-${Date.now()}`,
      project_title: uploadedFileName
        ? `Import ${uploadedFileName}`
        : `React to Video (${activeMods.length} Gaya)`,
      title: uploadedFileName
        ? `Import ${uploadedFileName}`
        : `React to Video (${activeMods.length} Gaya)`,
      topic,
      topik_video: topic,
      aspect_ratio: aspectRatio,
      target_duration_sec: scenes.reduce((s, x) => s + (x.target_duration_sec || 4.5), 0),
      durationSeconds: scenes.reduce((s, x) => s + (x.durationSeconds || 4.5), 0),
      fps: 30,
      render_dimension: '3d',
      tempo: 'energik',
      character: 'kreator_3d_studio',
      gaya_video: primaryStyle,
      styleModule: primaryStyle,
      scenes,
      createdAt: Date.now(),
    };
    const project = synchronizeProjectPipeline(rawProject);

    if (openCodeDirectly) {
      onOpenRemotionCode(project);
    } else {
      onProjectReady(project);
    }
  };

  return (
    <div
      data-testid="auto-remotion-uploader"
      className="max-w-5xl mx-auto space-y-6 pb-16"
    >
      {/* Header Banner */}
      <div
        className={`rounded-2xl border p-6 sm:p-8 transition-colors ${
          isLight
            ? 'bg-white border-slate-200 text-slate-950 shadow-xs'
            : 'bg-slate-950/90 border-slate-800 text-slate-100'
        }`}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider ${
              isLight ? 'text-blue-700' : 'text-sky-400'
            }`}
          >
            Auto Remotion · Komposisi TSX &amp; Bahan Media
          </span>
        </div>

        <h1
          className={`text-xl sm:text-2xl font-bold tracking-tight ${
            isLight ? 'text-slate-950' : 'text-white'
          }`}
        >
          Import Komposisi TSX, Foto/Video Bahan, atau Rakit Modul Visual
        </h1>
        <p
          className={`mt-1 text-xs sm:text-sm max-w-2xl leading-relaxed ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}
        >
          Unggah berkas <code className="font-mono text-sky-400">.tsx</code> /{' '}
          <code className="font-mono text-sky-400">.json</code> dari referensi
          Remotion, sertakan foto atau video bahan adegan, atau pilih kombinasi
          modul gaya visual di bawah.
        </p>

        {/* Dropzone Grid: TSX Code & Photo/Video Materials */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label
            className={`group flex flex-col items-center justify-center rounded-xl border border-dashed p-6 cursor-pointer transition-all ${
              isLight
                ? 'border-slate-300 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-500'
                : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-sky-400/50'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-sky-400/15 border border-sky-400/30 flex items-center justify-center text-sky-400 mb-2.5">
              <UploadCloud className="w-5 h-5" />
            </div>
            <span
              className={`text-xs sm:text-sm font-bold text-center ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {uploadedFileName
                ? `Berkas Kode: ${uploadedFileName}`
                : 'Pilih berkas kode .tsx / .ts / .json'}
            </span>
            <span
              className={`text-[11px] mt-1 text-center ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Ekstrak otomatis Sequence, useCurrentFrame, dan narasi
            </span>
            <input
              type="file"
              accept=".tsx,.ts,.json,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <label
            data-testid="auto-remotion-media-dropzone"
            className={`group flex flex-col items-center justify-center rounded-xl border border-dashed p-6 cursor-pointer transition-all ${
              isLight
                ? 'border-slate-300 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-500'
                : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-sky-400/50'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-sky-400 mb-2.5">
              <ImageIcon className="w-5 h-5" />
            </div>
            <span
              className={`text-xs sm:text-sm font-bold text-center ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {uploadedMediaItems.length > 0
                ? `${uploadedMediaItems.length} Foto/Video Bahan Terpasang`
                : 'Upload Foto / Video Bahan Animasi'}
            </span>
            <span
              className={`text-[11px] mt-1 text-center ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Gambar atau video akan dianimasikan ke dalam adegan Remotion
            </span>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              data-testid="auto-remotion-media-input"
              onChange={handleMediaUpload}
              className="hidden"
            />
          </label>
        </div>

        {uploadedMediaItems.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 p-3 rounded-xl border border-slate-800 bg-slate-900/60">
            {uploadedMediaItems.map((item, idx) => (
              <div
                key={item.key}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
              >
                <span className="font-mono text-[10px] text-sky-400 font-bold">
                  Scene {idx + 1}:
                </span>
                <span className="truncate max-w-[140px]">{item.filename}</span>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setUploadedMediaItems([])}
              className="ml-auto px-2.5 py-1 rounded-lg text-[11px] font-medium text-rose-300 hover:bg-rose-500/10 inline-flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Bersihkan Media</span>
            </button>
          </div>
        )}

        {/* Quick TSX Paste Editor + Extracted Scene Storyboard Preview */}
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-700' : 'text-sky-300'
              }`}
            >
              Atau Tempel Kode React / Remotion TSX Langsung
            </span>
            <button
              type="button"
              data-testid="load-sample-tsx-btn"
              onClick={() => analyzeReactCodeContent(SAMPLE_REACT_TO_VIDEO_TSX, 'DemoExplainer.tsx')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition cursor-pointer ${
                isLight
                  ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                  : 'bg-[#071636] border-sky-400/35 text-sky-200 hover:border-sky-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Muat Contoh TSX 4-Adegan</span>
            </button>
          </div>
          <textarea
            data-testid="react-to-video-tsx-input"
            value={rawCodePreview}
            onChange={(e) => analyzeReactCodeContent(e.target.value, uploadedFileName || 'PastedComponent.tsx')}
            placeholder="Tempel kode <Sequence> React/Remotion TSX atau Blueprint JSON di sini..."
            rows={4}
            className={`w-full rounded-xl border p-3.5 font-mono text-xs leading-relaxed focus:outline-none ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                : 'bg-[#020817] border-sky-400/25 text-sky-100 focus:border-sky-400'
            }`}
          />
        </div>

        <div>
          {rawCodePreview && parsedScenesPreview.length > 0 && (
            <div
              data-testid="parsed-react-scenes-preview"
              className={`mt-4 rounded-xl border p-4 space-y-3 ${
                isLight
                  ? 'bg-emerald-50/80 border-emerald-300 text-slate-900'
                  : 'bg-[#051829] border-emerald-400/35 text-slate-100'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{parseStatus || 'Kode berhasil dianalisis'}</span>
                </div>
                <button
                  type="button"
                  onClick={handleImportDetectedTsxToStudio}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Buka Hasil Ekstraksi di Studio</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {parsedScenesPreview.map((sc) => (
                  <div
                    key={sc.sceneNumber}
                    className={`rounded-lg border p-3 text-left ${
                      isLight
                        ? 'bg-white border-emerald-200 text-slate-800'
                        : 'bg-[#020817]/90 border-sky-400/25 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase text-sky-400">
                        S0{sc.sceneNumber} · {sc.template}
                      </span>
                      <span className="text-[10px] font-mono text-amber-400 font-bold">
                        {sc.durationSec}s
                      </span>
                    </div>
                    <div className="text-xs font-bold line-clamp-1">{sc.headline}</div>
                    <div className="text-[11px] opacity-75 line-clamp-2 mt-0.5">
                      {sc.narration}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Topic & Aspect Ratio Configuration */}
      <div
        className={`rounded-2xl border p-6 sm:p-8 space-y-6 ${
          isLight
            ? 'bg-white border-blue-200/90 text-slate-950 shadow-[0_14px_34px_rgba(37,99,235,0.06)]'
            : 'bg-[#041029]/95 border-sky-400/25 text-slate-100'
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2">
            <label
              className={`block text-[11px] font-mono font-semibold uppercase tracking-wider mb-2 ${
                isLight ? 'text-blue-800' : 'text-sky-300'
              }`}
            >
              Topik / Premis Narasi Video
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none ${
                isLight
                  ? 'bg-slate-50 border-blue-200 text-slate-900'
                  : 'bg-[#020817] border-sky-400/30 text-white'
              }`}
            />
          </div>

          <div>
            <label
              className={`block text-[11px] font-mono font-semibold uppercase tracking-wider mb-2 ${
                isLight ? 'text-blue-800' : 'text-sky-300'
              }`}
            >
              Rasio Kanvas
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['9:16', '16:9'] as const).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold font-mono transition cursor-pointer ${
                    aspectRatio === ratio
                      ? 'bg-sky-400 border-sky-300 text-slate-950 shadow-xs'
                      : isLight
                      ? 'bg-slate-50 border-blue-200 text-slate-700 hover:bg-blue-50'
                      : 'bg-[#071636] border-sky-400/25 text-slate-200 hover:border-sky-300'
                  }`}
                >
                  {ratio === '9:16' ? '9:16 Reels' : '16:9 Wide'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Style Modules Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  isLight ? 'text-slate-800' : 'text-sky-200'
                }`}
              >
                Pilih Urutan Modul Style ({selectedModuleIds.length} Dipilih)
              </span>
            </div>
            <span
              className={`text-xs font-mono tabular-nums ${
                isLight ? 'text-blue-700' : 'text-sky-400'
              }`}
            >
              Estimasi: {selectedModuleIds.length * 5}s
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {selectableModules.map((mod) => {
              const selected = selectedModuleIds.includes(mod.id);
              const orderIndex = selectedModuleIds.indexOf(mod.id) + 1;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => toggleModule(mod.id)}
                  className={`p-3 rounded-xl border text-left transition relative cursor-pointer ${
                    selected
                      ? isLight
                        ? 'border-blue-600 bg-blue-50/90 text-slate-950 shadow-xs'
                        : 'border-sky-400 bg-[#0a2252] text-white shadow-[0_0_20px_rgba(56,189,248,0.18)]'
                      : isLight
                      ? 'border-blue-200/70 bg-white hover:border-blue-400 text-slate-700'
                      : 'border-sky-400/20 bg-[#071636]/70 hover:border-sky-400/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        selected
                          ? 'bg-sky-400 text-slate-950'
                          : isLight
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-[#041029] text-sky-300'
                      }`}
                    >
                      {mod.categoryLabel || 'STYLE'}
                    </span>
                    {selected && (
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-mono font-extrabold flex items-center justify-center">
                        #{orderIndex}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold line-clamp-1">
                    {mod.title}
                  </div>
                  <div
                    className={`text-[10px] line-clamp-1 mt-0.5 ${
                      isLight ? 'text-slate-500' : 'text-sky-200/70'
                    }`}
                  >
                    {mod.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div
          className={`pt-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
            isLight ? 'border-blue-100' : 'border-sky-400/15'
          }`}
        >
          <button
            type="button"
            onClick={() => handleGenerateAutoRemotion(true)}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
              isLight
                ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800'
                : 'bg-[#071636] border-sky-400/35 text-sky-100 hover:border-sky-300 hover:bg-[#0a1e46]'
            }`}
          >
            <Code2 className="w-4 h-4 text-sky-400" />
            <span>Lihat Kode TSX Komposisi</span>
          </button>

          <button
            type="button"
            onClick={() => handleGenerateAutoRemotion(false)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-200 text-slate-950 text-xs sm:text-sm font-bold shadow-[0_0_25px_rgba(56,189,248,0.4)] hover:shadow-[0_0_35px_rgba(56,189,248,0.65)] transition cursor-pointer"
          >
            <FileCode2 className="w-4 h-4" />
            <span>Terapkan & Buka di Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

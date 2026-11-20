import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { type CharacterDimension, type CharacterFraming, type CharacterOption } from '../types/satset.ts';
import { soundEngine } from '../utils/audio-synth.ts';
import { createSatsetSContext } from '../utils/custom-style-runtime.ts';
import {
  CHARACTER_CATALOG,
  CHARACTER_DEMO_POSES,
  CHARACTER_FRAMING_OPTIONS,
  CHARACTER_STORY_STEPS,
  getCharacterMeta,
  getEngineCharacterConfig,
  resolveCharacterOption,
} from '../utils/character-catalog.ts';
import {
  type CustomCharacterConfig,
  getStoredCustomCharacters,
} from '../utils/custom-character.ts';

interface CharacterMotionDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: string;
  framing?: CharacterFraming;
  dimension?: CharacterDimension;
  customCharacter?: CustomCharacterConfig;
  onSelectCharacter?: (
    char: CharacterOption,
    framing?: CharacterFraming,
    dimension?: CharacterDimension
  ) => void;
}

const BUILTIN_DEMOABLE = CHARACTER_CATALOG.filter((c) => c.canDemo);

export const CharacterMotionDemoModal: React.FC<CharacterMotionDemoModalProps> = ({
  isOpen,
  onClose,
  character,
  framing: initialFraming = 'full',
  dimension: initialDimension = '3d',
  customCharacter,
  onSelectCharacter,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const demoableCharacters = useMemo(() => {
    const stored = isOpen ? getStoredCustomCharacters() : [];
    const mergedCustom = [...stored];
    if (customCharacter && !mergedCustom.some((c) => c.id === customCharacter.id)) {
      mergedCustom.unshift(customCharacter);
    }
    const customItems = mergedCustom.map((cc) => getCharacterMeta(cc.id, cc));
    return [...customItems, ...BUILTIN_DEMOABLE];
  }, [isOpen, customCharacter]);

  const [previewCharId, setPreviewCharId] = useState<CharacterOption>(() => {
    const resolved = resolveCharacterOption(character);
    return demoableCharacters.some((c) => c.id === resolved) ? resolved : 'kreator_3d_studio';
  });
  const [previewFraming, setPreviewFraming] = useState<CharacterFraming>(initialFraming);
  const [previewDimension, setPreviewDimension] = useState<CharacterDimension>(initialDimension);
  const [demoTab, setDemoTab] = useState<'cerita' | 'pose'>('cerita');
  const [storyIdx, setStoryIdx] = useState<number>(0);
  const [selectedPose, setSelectedPose] = useState<string>('stand');

  useEffect(() => {
    if (!isOpen) return;
    const resolved = resolveCharacterOption(character);
    if (demoableCharacters.some((c) => c.id === resolved)) {
      setPreviewCharId(resolved);
    } else if (customCharacter && resolved === 'custom') {
      setPreviewCharId(customCharacter.id);
    } else {
      setPreviewCharId('kreator_3d_studio');
    }
    setPreviewFraming(resolved === 'maskot_orb_3d' ? 'orb' : initialFraming || 'full');
    setPreviewDimension(initialDimension || '3d');
    setStoryIdx(0);
    setSelectedPose('stand');
  }, [isOpen, character, initialFraming, initialDimension, customCharacter, demoableCharacters]);

  const charMeta = getCharacterMeta(previewCharId, customCharacter);
  const activePoseId =
    demoTab === 'cerita'
      ? CHARACTER_STORY_STEPS[storyIdx]?.pose || 'walk'
      : selectedPose;
  const activeCaption =
    demoTab === 'cerita'
      ? CHARACTER_STORY_STEPS[storyIdx]?.caption || 'Mulai dari langkah kecil'
      : `Pose: ${
          CHARACTER_DEMO_POSES.find((p) => p.id === selectedPose)?.label || selectedPose
        }`;

  useEffect(() => {
    if (!isOpen) return;

    const startTime = performance.now();
    let lastDraw = 0;

    const render = (now: number) => {
      if (lastDraw && now - lastDraw < 28) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }
      lastDraw = now;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const t = (now - startTime) / 1000;
      const w = canvas.width;
      const h = canvas.height;

      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#0b1836');
      bg.addColorStop(0.68, '#161b2e');
      bg.addColorStop(1, '#1e2438');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const floorY = h * 0.78;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.fillRect(0, floorY, w, h - floorY);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, floorY);
      ctx.lineTo(w, floorY);
      ctx.stroke();

      for (let i = 0; i < 6; i++) {
        const px = ((i * 67 + t * 14) % (w - 40)) + 20;
        const py = 50 + ((i * 49) % (floorY - 90)) + Math.sin(t * 1.8 + i) * 6;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(56, 189, 248, 0.45)' : 'rgba(250, 204, 21, 0.4)';
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      const charX =
        demoTab === 'cerita' && activePoseId === 'walk' && previewFraming === 'full'
          ? w * 0.28 + Math.sin(t * 0.9) * (w * 0.18)
          : w * 0.5;

      if (previewFraming !== 'closeup') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(charX, floorY + 6, 46, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      const engineChar = getEngineCharacterConfig(
        previewCharId,
        charMeta.gender === 'female' ? 'wanita' : 'pria',
        customCharacter,
        previewDimension
      );

      const s = createSatsetSContext(ctx, t, 4, 'night', 'modern', undefined, {
        finish: 'flat',
        dark: true,
        character: engineChar,
      });

      const isOrbMode = previewCharId === 'maskot_orb_3d' || previewFraming === 'orb';
      if (previewDimension === '2d' && !isOrbMode && (previewFraming === 'bust' || previewFraming === 'closeup')) {
        const zoomedY = previewFraming === 'closeup' ? h * 1.22 : h * 0.96;
        const zoomedSize = previewFraming === 'closeup' ? 500 : 350;
        s.person(charX, zoomedY, {
          pose: activePoseId,
          size: zoomedSize,
          facing: 1,
          viewMode: previewFraming,
        });
      } else {
        s.person(charX, previewFraming === 'closeup' ? h * 0.72 : floorY, {
          pose: activePoseId,
          size: previewFraming === 'closeup' ? 270 : previewFraming === 'bust' ? 255 : 235,
          facing: 1,
          viewMode: previewFraming,
        });
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, previewCharId, previewFraming, previewDimension, activePoseId, demoTab, charMeta.gender, customCharacter]);

  if (!isOpen) return null;

  const currentIdx = Math.max(
    0,
    demoableCharacters.findIndex((c) => c.id === previewCharId)
  );
  const handlePrevChar = () => {
    soundEngine.playSfx('tap');
    const prevIdx = (currentIdx - 1 + demoableCharacters.length) % demoableCharacters.length;
    setPreviewCharId(demoableCharacters[prevIdx].id);
  };
  const handleNextChar = () => {
    soundEngine.playSfx('tap');
    const nextIdx = (currentIdx + 1) % demoableCharacters.length;
    setPreviewCharId(demoableCharacters[nextIdx].id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-zinc-200 text-zinc-900">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <h3 className="font-extrabold text-sm sm:text-base text-zinc-900">
              Demo {previewDimension.toUpperCase()}: {charMeta.name}{' '}
              <span className="text-xs font-semibold text-zinc-400">
                {currentIdx + 1}/{demoableCharacters.length}
              </span>
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{charMeta.description}</p>
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
                  data-testid={`demo-dimension-${d.id}`}
                  onClick={() => {
                    setPreviewDimension(d.id);
                    soundEngine.playSfx('tap');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-extrabold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    previewDimension === d.id
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
              aria-label="Tutup demo karakter"
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Switcher + Framing Strip */}
        <div className="px-5 pt-3 pb-2 border-b border-zinc-100 space-y-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDemoTab('cerita');
                soundEngine.playSfx('tap');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                demoTab === 'cerita'
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              Contoh cerita
            </button>
            <button
              type="button"
              onClick={() => {
                setDemoTab('pose');
                soundEngine.playSfx('tap');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                demoTab === 'pose'
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              Semua pose ({CHARACTER_DEMO_POSES.length})
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1 bg-zinc-100 p-1 rounded-xl">
            {CHARACTER_FRAMING_OPTIONS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setPreviewFraming(f.id);
                  soundEngine.playSfx('tap');
                }}
                className={`py-1 rounded-lg text-[10px] sm:text-[11px] font-extrabold transition cursor-pointer ${
                  previewFraming === f.id
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                {f.id === 'full'
                  ? 'Full Body'
                  : f.id === 'bust'
                  ? 'Setengah'
                  : f.id === 'closeup'
                  ? 'Close-Up'
                  : previewDimension === '2d'
                  ? 'Orb 2D'
                  : 'Orb 3D'}
              </button>
            ))}
          </div>
        </div>

        {/* Viewport Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3">
          <div className="flex items-center justify-center gap-3">
            {demoTab === 'cerita' && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSfx('tap');
                  setStoryIdx(
                    (prev) => (prev - 1 + CHARACTER_STORY_STEPS.length) % CHARACTER_STORY_STEPS.length
                  );
                }}
                aria-label="Adegan cerita sebelumnya"
                className="w-9 h-9 rounded-full border border-zinc-200 bg-white hover:bg-zinc-100 flex items-center justify-center text-zinc-700 transition cursor-pointer shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <div className="relative w-[196px] sm:w-[214px] aspect-[9/16] rounded-2xl overflow-hidden border border-zinc-800 bg-[#0b1836] shadow-lg shrink-0">
              <canvas
                ref={canvasRef}
                width={320}
                height={568}
                className="w-full h-full object-cover"
              />
              {/* Bottom caption overlay like the live stage */}
              <div className="absolute inset-x-3 bottom-4 text-center pointer-events-none">
                <span className="inline-block px-3 py-1 rounded-lg bg-black/75 text-white text-[11px] font-bold shadow">
                  {activeCaption}
                </span>
              </div>
            </div>

            {demoTab === 'cerita' && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSfx('tap');
                  setStoryIdx((prev) => (prev + 1) % CHARACTER_STORY_STEPS.length);
                }}
                aria-label="Adegan cerita berikutnya"
                className="w-9 h-9 rounded-full border border-zinc-200 bg-white hover:bg-zinc-100 flex items-center justify-center text-zinc-700 transition cursor-pointer shrink-0"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {demoTab === 'cerita' ? (
            <div className="flex items-center justify-center gap-1.5">
              {CHARACTER_STORY_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setStoryIdx(idx)}
                  aria-label={`Langkah cerita ${idx + 1}`}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    storyIdx === idx ? 'w-5 bg-[#2563EB]' : 'w-2 bg-zinc-300'
                  }`}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 justify-center pb-5">
              {CHARACTER_DEMO_POSES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPose(p.id);
                    soundEngine.playSfx('click');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                    selectedPose === p.id
                      ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer: Cycle Characters & Apply */}
        <div className="px-5 py-3.5 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevChar}
              aria-label="Karakter sebelumnya"
              className="px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Sebelumnya</span>
            </button>
            <button
              type="button"
              onClick={handleNextChar}
              aria-label="Karakter berikutnya"
              className="px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
            >
              <span className="hidden sm:inline">Berikutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playSfx('pop');
              onSelectCharacter?.(previewCharId, previewFraming, previewDimension);
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#0ea5e9] text-white font-extrabold text-xs shadow-md shadow-blue-500/20 hover:brightness-105 active:scale-98 transition inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Pakai karakter ini</span>
          </button>
        </div>
      </div>
    </div>
  );
};

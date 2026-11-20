import { type SatsetProject, type SatsetScene, type AspectRatio, type WebsiteStepVisual } from '../types/satset.ts';
import { SATSET_MODULES } from '../data/satset-modules.ts';
import {
  resolveSatsetStyleId,
  getSatsetStyleDef,
  getSatsetStyleExamples,
  getSatsetStyleDemoScenes,
  getSatsetLayout,
} from './custom-style-runtime.ts';
import { getCharacterMeta, resolveCharacterOption } from './character-catalog.ts';
import { extractWebsiteUrl, buildWebsitePromoProfile } from './website-promo-engine.ts';
import { resolveAutoStyleForConceptAndScene } from './contextual-scene-builder.ts';
import { collectProjectPromptImages, enrichPromptWithMedia } from './ai-platform-router.ts';

export interface RemotionTimelineItem {
  sceneId: string;
  sceneIndex: number;
  fromFrame: number;
  durationInFrames: number;
  toFrame: number;
}

export function getResolutionForAspectRatio(ratio: AspectRatio = '9:16'): { width: number; height: number } {
  switch (ratio) {
    case '16:9':
      return { width: 1920, height: 1080 };
    case '1:1':
      return { width: 1080, height: 1080 };
    case '9:16':
    default:
      return { width: 1080, height: 1920 };
  }
}

/**
 * Calculates frame offsets and durations for Remotion Sequences.
 */
export function calculateRemotionTimeline(
  scenes: { durationSeconds?: number; target_duration_sec?: number }[],
  fps = 30
): { items: RemotionTimelineItem[]; totalFrames: number } {
  let currentFrame = 0;
  const items: RemotionTimelineItem[] = [];

  scenes.forEach((scene, index) => {
    const durationSec = scene.target_duration_sec || scene.durationSeconds || 4;
    const durationFrames = Math.max(1, Math.round(durationSec * fps));
    items.push({
      sceneId: (scene as SatsetScene).id || `scene-${index + 1}`,
      sceneIndex: index,
      fromFrame: currentFrame,
      durationInFrames: durationFrames,
      toFrame: currentFrame + durationFrames,
    });
    currentFrame += durationFrames;
  });

  return { items, totalFrames: currentFrame };
}

/**
 * Tokenizes text for animated Remotion subtitles with emphasis detection.
 */
export function generateSubtitleTokens(text: string, emphasisWords: string[] = []): { word: string; isEmphasis: boolean }[] {
  const words = text.split(/\s+/).filter(Boolean);
  const normalizedEmphasis = emphasisWords.map((w) => w.toLowerCase().replace(/[^a-z0-9]/gi, ''));

  return words.map((word) => {
    const clean = word.toLowerCase().replace(/[^a-z0-9]/gi, '');
    const isEmphasis = normalizedEmphasis.includes(clean);
    return { word, isEmphasis };
  });
}

/**
 * Generates ready-to-run Remotion React components (Composition.tsx, Root.tsx, instructions).
 */
export interface GenerateRemotionOptions {
  renderDimension?: '2d' | '2.5d' | '3d';
}

export function generateRemotionCode(
  project: SatsetProject,
  fps = 30,
  options?: GenerateRemotionOptions
): {
  compositionTsx: string;
  rootTsx: string;
  instructions: string;
  blueprintJson: string;
} {
  const { items, totalFrames } = calculateRemotionTimeline(project.scenes, fps);
  const res = getResolutionForAspectRatio(project.aspect_ratio || '9:16');
  const brandColor = project.warna_brand || project.brandColor || '#2563EB';
  const watermark = project.watermark || '@satset.creator';
  const tempo = project.tempo || 'energik';
  const springDamping = tempo === 'energik' ? 12 : 18;
  const springStiffness = tempo === 'energik' ? 160 : 90;
  const renderDimension: '2d' | '2.5d' | '3d' =
    options?.renderDimension || project.render_dimension || '2d';

  const resolveStyleRemotionSfx = (styleMod: string, role: string, customCue?: string) => {
    const st = String(styleMod || '').toLowerCase();
    if (/voxel|pixel|8bit|retro|mabar|neongame|dither/.test(st)) {
      return {
        flavor: '8bit',
        file: customCue && customCue !== 'whoosh' ? `${customCue}.mp3` : 'sfx_8bit_laser.mp3',
        beat2File: 'sfx_8bit_blip.mp3',
        beat3File: 'sfx_8bit_coin.mp3',
        beat4File: 'sfx_8bit_powerup.mp3',
        transitionFile: 'sfx_8bit_warp.mp3',
        type: '8bit_arcade',
        playbackRate: 1.08,
        volume: 0.82,
      };
    }
    if (/paper|kolase|arsip|diorama|edukasi|zine|scrapbook/.test(st)) {
      return {
        flavor: 'paper',
        file: role === 'hook' ? 'sfx_paper_rip.mp3' : 'sfx_paper_pageflip.mp3',
        beat2File: 'sfx_paper_rustle.mp3',
        beat3File: 'sfx_paper_stamp.mp3',
        beat4File: 'sfx_paper_fold.mp3',
        transitionFile: 'sfx_paper_swipe.mp3',
        type: 'paper_craft',
        playbackRate: 0.98,
        volume: 0.86,
      };
    }
    if (/chalk|kapur|sketsa|blueprint|oneline/.test(st)) {
      return {
        flavor: 'chalk',
        file: 'sfx_chalk_stroke.mp3',
        beat2File: 'sfx_wood_tock.mp3',
        beat3File: 'sfx_chalk_sketch.mp3',
        beat4File: 'sfx_finger_snap.mp3',
        transitionFile: 'sfx_board_wipe.mp3',
        type: 'chalk_sketch',
        playbackRate: 1.0,
        volume: 0.82,
      };
    }
    if (/precision|isometrik|belah|garis|mekanik/.test(st)) {
      return {
        flavor: 'mechanical',
        file: 'sfx_mech_whip.mp3',
        beat2File: 'sfx_watch_tick.mp3',
        beat3File: 'sfx_gear_tock.mp3',
        beat4File: 'sfx_precision_snap.mp3',
        transitionFile: 'sfx_pneumatic_slide.mp3',
        type: 'mechanical_cad',
        playbackRate: 1.04,
        volume: 0.84,
      };
    }
    if (/terminal|kilat|glitch|matrix|code/.test(st)) {
      return {
        flavor: 'terminal',
        file: 'sfx_cyber_glitch.mp3',
        beat2File: 'sfx_mech_key_type.mp3',
        beat3File: 'sfx_crt_beep.mp3',
        beat4File: 'sfx_terminal_notify.mp3',
        transitionFile: 'sfx_digital_glitch_cut.mp3',
        type: 'cyber_terminal',
        playbackRate: 1.1,
        volume: 0.8,
      };
    }
    if (/worldforge|roma|mars|monofilm|hyper_zoom|cinema|noir/.test(st)) {
      return {
        flavor: 'cinema',
        file: role === 'hook' ? 'sfx_cinema_sub_boom.mp3' : 'sfx_cinema_whoosh_deep.mp3',
        beat2File: 'sfx_lens_focus_pull.mp3',
        beat3File: 'sfx_tension_riser.mp3',
        beat4File: 'sfx_cinema_impact_hit.mp3',
        transitionFile: 'sfx_cinema_whip_low.mp3',
        type: 'cinematic_epic',
        playbackRate: 0.92,
        volume: 0.9,
      };
    }
    if (/lempung|clay|bounce|sticker|confetti|popart|heboh/.test(st)) {
      return {
        flavor: 'clay',
        file: 'sfx_clay_boing.mp3',
        beat2File: 'sfx_cartoon_pop.mp3',
        beat3File: 'sfx_clay_step.mp3',
        beat4File: 'sfx_party_tada.mp3',
        transitionFile: 'sfx_rubber_whip.mp3',
        type: 'clay_cartoon',
        playbackRate: 1.05,
        volume: 0.85,
      };
    }
    if (/cair|liquid|bubble|aurora|glow|cahaya|tenang|kuas|siluet|rasi|cerita/.test(st)) {
      return {
        flavor: 'liquid',
        file: 'sfx_liquid_swish.mp3',
        beat2File: 'sfx_water_bubble.mp3',
        beat3File: 'sfx_crystal_drop.mp3',
        beat4File: 'sfx_ambient_chime.mp3',
        transitionFile: 'sfx_soft_breeze.mp3',
        type: 'liquid_ambient',
        playbackRate: 0.96,
        volume: 0.78,
      };
    }
    if (/kaset|tiket|vhs|vinyl/.test(st)) {
      return {
        flavor: 'retro_tape',
        file: 'sfx_analog_shutter.mp3',
        beat2File: 'sfx_vinyl_scratch.mp3',
        beat3File: 'sfx_typewriter_hit.mp3',
        beat4File: 'sfx_vintage_bell.mp3',
        transitionFile: 'sfx_tape_rewind.mp3',
        type: 'retro_analog',
        playbackRate: 0.98,
        volume: 0.84,
      };
    }
    if (/editorial|mograph|infopop|pitch|uiweb|panduan|carakerja|modern|produk|reel|kinetik/.test(st)) {
      return {
        flavor: 'editorial',
        file: 'sfx_editorial_swipe.mp3',
        beat2File: 'sfx_ui_cursor_click.mp3',
        beat3File: 'sfx_hud_data_scan.mp3',
        beat4File: 'sfx_editorial_chime.mp3',
        transitionFile: 'sfx_editorial_split_swish.mp3',
        type: 'editorial_mograph',
        playbackRate: 1.02,
        volume: 0.84,
      };
    }
    return {
      flavor: 'studio3d',
      file: 'sfx_studio3d_whoosh.mp3',
      beat2File: 'sfx_bento_card_slide.mp3',
      beat3File: 'sfx_glass_notify.mp3',
      beat4File: 'sfx_studio_harmonic_ding.mp3',
      transitionFile: 'sfx_studio_depth_swish.mp3',
      type: 'studio_3d',
      playbackRate: 1.0,
      volume: 0.85,
    };
  };

  const scenesNormalized = project.scenes.map((s, idx) => {
    const rawMod = s.visualModule || project.gaya_video || project.styleModule || 'scribble3d';
    const effectiveMod =
      rawMod === 'otomatis'
        ? resolveAutoStyleForConceptAndScene(project, s, idx).styleId
        : rawMod;
    const roleResolved = s.role || (idx === 0 ? 'hook' : idx === project.scenes.length - 1 ? 'cta' : 'body_core_point');
    const styleSfx = resolveStyleRemotionSfx(effectiveMod, roleResolved, s.sfxCue);
    return {
      id: s.id || `sc-${idx + 1}`,
      scene_number: s.scene_number || s.sceneNumber || idx + 1,
      role: roleResolved,
      target_duration_sec: s.target_duration_sec || s.durationSeconds || 4,
      narration_text: s.narration_text || s.voiceScript || '',
      on_screen_text: s.on_screen_text || s.hookText || `Poin ${idx + 1}`,
      emphasis_words: s.emphasis_words || s.emphasisWords || [],
      visual_animation: s.visual_animation || {
        layout: 'centered_title_with_floating_icons',
        remotion_animation: 'spring_pop_in',
        asset_elements: ['sparkle_icon', 'star_badge'],
      },
      sfx: {
        ...styleSfx,
        ...(s.sfx || {}),
        file: s.sfx?.file && s.sfx.file !== 'whoosh_impact.mp3' ? s.sfx.file : styleSfx.file,
        type: (s.sfx?.type && s.sfx.type !== 'whoosh' ? s.sfx.type : styleSfx.type) as any,
        play_at_second: s.sfx?.play_at_second ?? 0.0,
      },
      visualModule: effectiveMod,
      accentColor: s.accentColor || brandColor,
      secondaryColor: s.secondaryColor || '#facc15',
      media_url: s.media_url || s.website_step?.screenshotDataUrl || undefined,
      media_type: s.media_type || 'image',
      asset_motion_preset: s.asset_motion_preset || 'auto_concept',
      asset_motion_prompt: s.asset_motion_prompt || undefined,
      focus_region: s.focus_region || { fx: 0.5, fy: 0.42, zoom: 1.16 },
      website_step: s.website_step || undefined,
    };
  });
  const projectTitleEscaped = JSON.stringify(project.project_title || project.title || 'Satset Motion');
  const activeCharacterEscaped = JSON.stringify(project.character || 'none');
  const activeSubtitleStyleEscaped = JSON.stringify(project.subtitle_style || project.subtitleStyle || 'auto');

  const commonHeaderTsx = `// Komposisi Remotion 4 oleh Graph Motion Studio (${
    renderDimension === '3d'
      ? '3D Full Tiga Dimensi WebGL @remotion/three'
      : renderDimension === '2.5d'
      ? '2.5D Campur Hybrid Motion'
      : '2D Anime Cel-Shaded Motion'
  })
// Simpan ke: src/SatsetComposition.tsx

import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  Video,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { TransitionSeries, springTiming } from '@remotion/transitions';
import { slide } from '@remotion/transitions/slide';
import { fade } from '@remotion/transitions/fade';
import { loadFont as loadDisplayFont } from '@remotion/google-fonts/Baloo2';
import { loadFont as loadUiFont } from '@remotion/google-fonts/PlusJakartaSans';
${renderDimension === '3d' ? `import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';` : ''}

const displayFontLoaded = loadDisplayFont();
const uiFontLoaded = loadUiFont();

export const FPS = ${fps};
export const W = ${res.width};
export const H = ${res.height};
export const TRANSITION_FRAMES = 14;

export const THEME = {
  bg: '#F4EFE3',
  ink: '#141B3A',
  primary: '${brandColor}',
  accent: '#FFD23F',
  sky: '#4CC9F0',
  white: '#FFFFFF',
  darkStage: '#020B24',
} as const;

export const FONT = {
  display: \`"\${displayFontLoaded.fontFamily}", "Baloo 2", "Fredoka", system-ui, sans-serif\`,
  ui: \`"\${uiFontLoaded.fontFamily}", "Plus Jakarta Sans", system-ui, sans-serif\`,
} as const;

export const SPRING = {
  snappy: { damping: 18, stiffness: 220, mass: 0.8 },  // teks/UI: cepat, overshoot kecil
  bouncy: { damping: 9, stiffness: 140, mass: 0.9 },   // objek/karakter: overshoot terasa
  soft:   { damping: 22, stiffness: 90, mass: 1.0 },   // kamera/latar: halus, tanpa pantulan
  heavy:  { damping: 14, stiffness: 120, mass: 1.6 },  // benda berat: mendarat mantap
} as const;

export interface WordTiming {
  text: string;
  start: number;
  end: number;
}

export interface SceneData {
  id: string;
  scene_number: number;
  role: string;
  target_duration_sec: number;
  narration_text: string;
  on_screen_text: string;
  emphasis_words: string[];
  visual_animation: {
    layout: string;
    remotion_animation: string;
    asset_elements: string[];
  };
  sfx: {
    flavor?: string;
    file: string;
    beat2File?: string;
    beat3File?: string;
    beat4File?: string;
    transitionFile?: string;
    type: string;
    play_at_second: number;
    playbackRate?: number;
    volume?: number;
  };
  visualModule: string;
  accentColor: string;
  secondaryColor: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  asset_motion_preset?: string;
  asset_motion_prompt?: string;
  focus_region?: {
    fx: number;
    fy: number;
    zoom: number;
    label?: string;
  };
  website_step?: {
    stepNumber: number;
    totalSteps: number;
    stepBadge: string;
    urlDisplay: string;
    brandName: string;
    screenTitle: string;
    screenSubtitle: string;
    highlightMetric: string;
    actionLabel: string;
    layoutVariant: string;
    screenshotDataUrl?: string;
    uiCards: Array<{
      label: string;
      value: string;
      badge?: string;
      accent?: string;
    }>;
  };
}

export const PROJECT_TITLE = ${projectTitleEscaped};
export const ACTIVE_CHARACTER = ${activeCharacterEscaped};
export const SUBTITLE_STYLE = ${activeSubtitleStyleEscaped};
export const scenes: SceneData[] = ${JSON.stringify(scenesNormalized, null, 2)};

export const calcTotalFrames = (sceneList: SceneData[], fpsVal: number): number => {
  const sum = sceneList.reduce((acc, s) => acc + Math.max(30, Math.round((s.target_duration_sec || 4) * fpsVal)), 0);
  const overlap = Math.max(0, sceneList.length - 1) * TRANSITION_FRAMES;
  return Math.max(30, sum - overlap);
};

// Bangun timing kata deterministik relatif terhadap scene (dalam detik)
const buildWordTimings = (text: string, durationSec: number): WordTiming[] => {
  const tokens = text.trim().split(/\\s+/).filter(Boolean);
  if (tokens.length === 0) return [];
  const usable = Math.max(0.8, durationSec - 0.32);
  const weights = tokens.map((w) => Math.max(1, w.length * 0.25 + 0.75) + (/[.!?]$/.test(w) ? 0.9 : /[,;]$/.test(w) ? 0.4 : 0));
  const totalW = weights.reduce((a, b) => a + b, 0) || 1;
  let cur = 0.08;
  return tokens.map((word, idx) => {
    const dur = (weights[idx] / totalW) * usable;
    const item: WordTiming = { text: word, start: cur, end: cur + dur };
    cur += dur;
    return item;
  });
};

// Helper 3 Fase: Masuk berpegas + Tahan hidup + Keluar halus
const useEnter = (delaySec = 0, config: (typeof SPRING)[keyof typeof SPRING] = SPRING.bouncy) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: Math.max(0, frame - Math.round(delaySec * fps)), fps, config });
};

const useExit = (exitSec = 0.32) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const exitFrames = Math.max(6, Math.round(exitSec * fps));
  return interpolate(
    frame,
    [Math.max(0, durationInFrames - exitFrames), durationInFrames],
    [1, 0],
    { easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
};

const Pop: React.FC<{ delay?: number; from?: 'bottom' | 'left' | 'right' | 'scale'; children: React.ReactNode }> = ({
  delay = 0,
  from = 'bottom',
  children,
}) => {
  const p = useEnter(delay, SPRING.bouncy);
  const exit = useExit(0.28);
  const anti = interpolate(p, [0, 0.14, 1], [0, -10, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const d = (1 - p) * 76 + anti;
  const tx = from === 'left' ? -d : from === 'right' ? d : 0;
  const ty = from === 'bottom' ? d : 0;
  const sc = (0.64 + 0.36 * p) * (0.9 + 0.1 * exit);
  return (
    <div style={{ transform: \`translate(\${tx.toFixed(1)}px, \${ty.toFixed(1)}px) scale(\${sc.toFixed(3)})\`, opacity: Math.min(1, p * 2.2) * exit }}>
      {children}
    </div>
  );
};

const Float: React.FC<{ amp?: number; speed?: number; phase?: number; children: React.ReactNode }> = ({
  amp = 6,
  speed = 0.55,
  phase = 0,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const y = Math.sin((frame / fps) * Math.PI * 2 * speed + phase) * amp;
  return <div style={{ transform: \`translateY(\${y.toFixed(2)}px)\` }}>{children}</div>;
};
`;

  const sharedOverlayTsx = `
// Kamera Editorial Berkelanjutan (Push-in halus 1.0 -> 1.06 + pan tanpa memengaruhi Caption)
const CameraRig: React.FC<{
  children: React.ReactNode;
  tempo: 'energik' | 'santai';
  styleTheme: string;
  durationInFrames: number;
  sceneIndex: number;
  isHook?: boolean;
}> = ({ children, tempo, styleTheme, durationInFrames, sceneIndex, isHook = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isEnergik = tempo === 'energik';
  const tNorm = interpolate(frame, [0, Math.max(1, durationInFrames)], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const hookPull = styleTheme === 'studio_3d_room' && isHook
    ? spring({ frame: Math.max(0, frame - 2), fps, config: SPRING.bouncy })
    : 1;

  const beatMid = spring({
    frame: Math.max(0, frame - Math.round(durationInFrames * 0.38)),
    fps,
    config: isEnergik ? SPRING.snappy : SPRING.soft,
  });

  const dirSign = sceneIndex % 2 === 0 ? 1 : -1;
  const continuousPush = 1 + 0.055 * tNorm;
  const hookZoom = (1 - hookPull) * 0.18;
  const camZoom = continuousPush + hookZoom + beatMid * (isEnergik ? 0.018 : 0.01);
  const camPanX = (1 - hookPull) * 72 + tNorm * 18 * dirSign;
  const camPanY = (1 - hookPull) * -18 + Math.sin(tNorm * Math.PI) * -8;
  const camTilt = (beatMid - 0.5) * 0.35 * dirSign * tNorm;

  return (
    <AbsoluteFill
      style={{
        transform: \`scale(\${camZoom.toFixed(4)}) translate3d(\${camPanX.toFixed(1)}px, \${camPanY.toFixed(1)}px, 0) rotate(\${camTilt.toFixed(2)}deg)\`,
        transformOrigin: 'center center',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// Lapisan Latar Belakang Parallax 3-Layer (Non-linear, seed deterministik pakai random())
const ParallaxBackdrop: React.FC<{
  seed: string;
  isDark: boolean;
  accent: string;
  secondary: string;
}> = ({ seed, isDark, accent, secondary }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const pan = interpolate(frame, [0, Math.max(1, durationInFrames)], [0, -28], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const items = Array.from({ length: 14 }, (_, i) => {
    const rx = random(\`\${seed}-x-\${i}\`);
    const ry = random(\`\${seed}-y-\${i}\`);
    const size = 14 + random(\`\${seed}-s-\${i}\`) * 32;
    const speed = 0.4 + random(\`\${seed}-sp-\${i}\`) * 0.5;
    const driftY = Math.sin((frame / fps) * Math.PI * 2 * speed + i) * 9;
    return {
      x: rx * width,
      y: ry * (height * 0.72) + pan * 0.4 + driftY,
      size,
      kind: i % 3,
      op: 0.12 + random(\`\${seed}-o-\${i}\`) * 0.18,
    };
  });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: -60,
          background: isDark
            ? \`radial-gradient(circle at 28% 24%, \${accent}33 0%, transparent 52%), radial-gradient(circle at 78% 72%, \${secondary}24 0%, transparent 48%), linear-gradient(180deg, #061233 0%, #020817 100%)\`
            : \`radial-gradient(circle at 30% 22%, \${secondary}30 0%, transparent 54%), radial-gradient(circle at 76% 70%, \${accent}22 0%, transparent 50%), linear-gradient(180deg, #FAF7F0 0%, #EAE2D3 100%)\`,
        }}
      />
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
        {items.map((it, idx) =>
          it.kind === 0 ? (
            <circle key={idx} cx={it.x} cy={it.y} r={it.size * 0.5} fill={accent} opacity={it.op} />
          ) : it.kind === 1 ? (
            <rect
              key={idx}
              x={it.x}
              y={it.y}
              width={it.size * 0.7}
              height={it.size * 0.7}
              rx={4}
              transform={\`rotate(45 \${it.x + it.size * 0.35} \${it.y + it.size * 0.35})\`}
              fill={secondary}
              opacity={it.op}
            />
          ) : (
            <circle key={idx} cx={it.x} cy={it.y} r={it.size * 0.65} fill="none" stroke={accent} strokeWidth={2.5} opacity={it.op} />
          )
        )}
      </svg>
    </AbsoluteFill>
  );
};

// Chip Label 2-Kata Maksimal dengan Padding Aman (>56px pada 9:16)
const TopicChip: React.FC<{ text: string; accent: string; delay?: number }> = ({ text, accent, delay = 0.08 }) => {
  const shortLabel = text.trim().split(/\\s+/).slice(0, 2).join(' ').toUpperCase();
  const { width } = useVideoConfig();
  const isPortrait = width <= 1120;
  return (
    <Pop delay={delay} from="bottom">
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          padding: isPortrait ? '14px 28px' : '10px 22px',
          borderRadius: 16,
          backgroundColor: accent,
          color: THEME.white,
          fontFamily: FONT.display,
          fontWeight: 900,
          fontSize: isPortrait ? 56 : 30,
          lineHeight: 1.05,
          letterSpacing: -0.5,
          boxShadow: '0 10px 24px rgba(15,23,42,0.22)',
        }}
      >
        <span>{shortLabel}</span>
      </div>
    </Pop>
  );
};

// Caption Konsisten di LUAR CameraRig (Maks 4 kata/halaman, anti-lompat dengan opacity pre-render)
const EditorialSubtitleOverlay: React.FC<{
  text: string;
  emphasisWords: string[];
  styleTheme: string;
  subtitleStyle: string;
  durationInFrames: number;
  sceneIndex?: number;
}> = ({ text, emphasisWords, subtitleStyle, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  if (!text.trim() || subtitleStyle === 'off' || subtitleStyle === 'none') return null;

  const t = frame / fps;
  const durationSec = durationInFrames / fps;
  const wordTimings = buildWordTimings(text, durationSec);
  if (wordTimings.length === 0) return null;

  const perPage = 4;
  const pages: WordTiming[][] = [];
  for (let i = 0; i < wordTimings.length; i += perPage) {
    pages.push(wordTimings.slice(i, i + perPage));
  }
  const page = [...pages].reverse().find((p) => t >= p[0].start - 0.05) || pages[0];
  if (!page || t > page[page.length - 1].end + 0.55) return null;

  const normEmph = emphasisWords.map((w) => w.toLowerCase().replace(/[^a-z0-9]/gi, ''));
  const isPortrait = width <= 1120;

  return (
    <div
      style={{
        position: 'absolute',
        left: isPortrait ? 80 : 120,
        right: isPortrait ? 140 : 120,
        bottom: isPortrait ? 420 : 72,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: isPortrait ? '6px 22px' : '4px 16px',
        fontFamily: FONT.display,
        fontSize: isPortrait ? 84 : 58,
        fontWeight: 900,
        lineHeight: 1.15,
        textAlign: 'center',
        pointerEvents: 'none',
      }}
    >
      {page.map((w, i) => {
        const p = spring({
          frame: Math.max(0, frame - Math.round(w.start * fps)),
          fps,
          config: SPRING.snappy,
        });
        const clean = w.text.toLowerCase().replace(/[^a-z0-9]/gi, '');
        const isEmph = normEmph.includes(clean);
        const active = t >= w.start && t < w.end;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: t >= w.start ? 1 : 0,
              transform: \`scale(\${((0.86 + 0.14 * p) * (active ? 1.08 : 1)).toFixed(3)}) translateY(\${((1 - p) * 14).toFixed(1)}px)\`,
              color: active || isEmph ? THEME.accent : THEME.white,
              WebkitTextStroke: isPortrait ? '12px #111111' : '8px #111111',
              paintOrder: 'stroke fill',
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
`;

  const creatorAndScenes2DTsx = `
// Library 12 Pose Karakter Berlapis dengan Spring Blend + Follow-Through Lag 5 Frame
export type PoseKey =
  | 'idle'
  | 'talk'
  | 'point'
  | 'think'
  | 'celebrate'
  | 'shrug'
  | 'surprised'
  | 'walk'
  | 'present'
  | 'idea'
  | 'thumbs'
  | 'cheer'
  | 'wave'
  | 'stand';

type PoseAngles = { lSh: number; lEl: number; rSh: number; rEl: number; head: number; body: number; squash: number };

const POSE_TABLE: Record<PoseKey, PoseAngles> = {
  idle:      { lSh: -12, lEl: 16,  rSh: 12,  rEl: -16, head: 0,   body: 0,  squash: 0 },
  stand:     { lSh: -12, lEl: 16,  rSh: 12,  rEl: -16, head: 0,   body: 0,  squash: 0 },
  talk:      { lSh: -26, lEl: 34,  rSh: -32, rEl: -28, head: -4,  body: -2, squash: -0.02 },
  present:   { lSh: -18, lEl: 22,  rSh: -42, rEl: -32, head: -6,  body: -2, squash: 0 },
  point:     { lSh: -14, lEl: 18,  rSh: -74, rEl: -14, head: -8,  body: -4, squash: 0 },
  think:     { lSh: 56,  lEl: 58,  rSh: 14,  rEl: -18, head: 11,  body: 3,  squash: 0.02 },
  idea:      { lSh: -14, lEl: 20,  rSh: -88, rEl: -48, head: -5,  body: -2, squash: -0.04 },
  celebrate: { lSh: 82,  lEl: 38,  rSh: -84, rEl: -42, head: 0,   body: 0,  squash: -0.07 },
  cheer:     { lSh: 80,  lEl: 40,  rSh: -82, rEl: -44, head: 0,   body: 0,  squash: -0.06 },
  shrug:     { lSh: 42,  lEl: 62,  rSh: -42, rEl: -62, head: 8,   body: 2,  squash: 0.05 },
  surprised: { lSh: 62,  lEl: 26,  rSh: -62, rEl: -26, head: -4,  body: 4,  squash: 0.08 },
  walk:      { lSh: 30,  lEl: 24,  rSh: -32, rEl: -24, head: 2,   body: -5, squash: 0.02 },
  thumbs:    { lSh: -16, lEl: 18,  rSh: -46, rEl: -38, head: -3,  body: -1, squash: -0.02 },
  wave:      { lSh: -14, lEl: 18,  rSh: -86, rEl: -46, head: 4,   body: 2,  squash: -0.03 },
};

export type PoseCue = { at: number; pose: PoseKey };

const mixPose = (a: PoseAngles, b: PoseAngles, t: number): PoseAngles => ({
  lSh: a.lSh + (b.lSh - a.lSh) * t,
  lEl: a.lEl + (b.lEl - a.lEl) * t,
  rSh: a.rSh + (b.rSh - a.rSh) * t,
  rEl: a.rEl + (b.rEl - a.rEl) * t,
  head: a.head + (b.head - a.head) * t,
  body: a.body + (b.body - a.body) * t,
  squash: a.squash + (b.squash - a.squash) * t,
});

const usePoseBlend = (cues: PoseCue[], lagFrames = 0): PoseAngles => {
  const frame = useCurrentFrame() - lagFrames;
  const { fps } = useVideoConfig();
  let cur = POSE_TABLE[cues[0]?.pose || 'idle'] || POSE_TABLE.idle;
  for (let i = 1; i < cues.length; i++) {
    const startF = Math.round(cues[i].at * fps);
    if (frame >= startF) {
      const t = spring({ frame: frame - startF, fps, config: SPRING.bouncy });
      cur = mixPose(cur, POSE_TABLE[cues[i].pose] || POSE_TABLE.idle, t);
    }
  }
  return cur;
};

const Creator3DNarratorRig: React.FC<{
  pose: PoseKey;
  cues?: PoseCue[];
  talkWords?: WordTiming[];
  facing?: 1 | -1;
  hasHeadphones?: boolean;
  viewMode?: 'full' | 'bust';
  scale?: number;
  seed?: string;
}> = ({
  pose,
  cues,
  talkWords = [],
  facing = 1,
  hasHeadphones = false,
  viewMode = 'full',
  scale = 1,
  seed = 'mascot',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const activeCues: PoseCue[] = cues && cues.length > 0 ? cues : [{ at: 0, pose }];
  const main = usePoseBlend(activeCues, 0);
  const lag = usePoseBlend(activeCues, 5); // Kepala & rambut terlambat 5 frame = follow-through

  const enter = spring({ frame, fps, config: SPRING.bouncy });
  const exit = useExit(0.28);
  const reveal = enter * exit;

  const isCyberFox = ACTIVE_CHARACTER.includes('rubah');
  const charPalette = isCyberFox
    ? { skin: '#fde6d8', hair: '#0077ff', hairDark: '#0b3b91', hairHi: '#60a5fa', hoodie: '#0b132b', iris: '#0284c7' }
    : ACTIVE_CHARACTER.includes('kucing')
    ? { skin: '#e9d5ff', hair: '#9333ea', hairDark: '#581c87', hairHi: '#c084fc', hoodie: '#1e1b4b', iris: '#0f172a' }
    : ACTIVE_CHARACTER.includes('panda')
    ? { skin: '#f8fafc', hair: '#10b981', hairDark: '#065f46', hairHi: '#6ee7b7', hoodie: '#064e3b', iris: '#0f172a' }
    : { skin: '#f3bfa0', hair: '#ff5c28', hairDark: '#b91c1c', hairHi: '#fdba74', hoodie: '#18181b', iris: '#0f172a' };

  const breathe = Math.sin(t * Math.PI * 2 * 0.45) * 2.2;
  const sway = Math.sin(t * Math.PI * 2 * 0.35) * 1.4;

  // Kedip terjadwal deterministik memakai random(seed) tiap 2.6 - 4.0 detik
  const period = Math.max(45, Math.round(fps * (2.6 + random(\`blink-\${seed}\`) * 1.4)));
  const fMod = frame % period;
  const blinkLen = Math.round(fps * 0.14);
  const eyeOpen = fMod < blinkLen ? 1 - 0.92 * Math.sin((fMod / blinkLen) * Math.PI) : 1;

  const isHappyEyes = pose === 'cheer' || pose === 'celebrate' || pose === 'thumbs' || pose === 'wave';
  const talking = talkWords.length > 0 ? talkWords.some((w) => t >= w.start && t <= w.end) : true;
  const talkOpen = talking ? 0.32 + 0.68 * Math.abs(Math.sin(frame * 0.48) * Math.cos(frame * 0.21)) : 0.08;
  const lookDir = Math.sin(t * 1.6) * 2.4;

  const pendShoulder = Math.sin(t * 3.8);
  const pendElbow = Math.sin(t * 3.8 - 0.65);
  const pendWrist = Math.sin(t * 3.8 - 1.25);

  const rightShoulderRot = main.rSh + pendShoulder * 4.5;
  const rightElbowRot = main.rEl + pendElbow * 6.5;
  const leftShoulderRot = main.lSh - pendShoulder * 4.5;
  const leftElbowRot = main.lEl - pendElbow * 6.5;
  const squashY = 1 + main.squash + breathe * 0.004;
  const boxHeight = viewMode === 'bust' ? 275 : 420;

  return (
    <svg
      width={300 * scale}
      height={boxHeight * scale}
      viewBox={viewMode === 'bust' ? '0 0 300 275' : '0 0 300 420'}
      style={{
        overflow: 'visible',
        opacity: Math.min(1, reveal * 2),
      }}
    >
      <defs>
        <radialGradient id="skin3d" cx="42%" cy="35%" r="65%">
          <stop offset="0%" stopColor={charPalette.skin} />
          <stop offset="100%" stopColor="#d49674" />
        </radialGradient>
        <linearGradient id="hoodie3d" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="55%" stopColor={charPalette.hoodie} />
          <stop offset="100%" stopColor="#09090b" />
        </linearGradient>
        <linearGradient id="hair3d" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={charPalette.hairHi} />
          <stop offset="35%" stopColor={charPalette.hair} />
          <stop offset="100%" stopColor={charPalette.hairDark} />
        </linearGradient>
      </defs>

      {/* Bayangan elips di lantai (floorY = 398) mengecil saat karakter naik/scale */}
      {viewMode === 'full' && (
        <ellipse
          cx="150"
          cy="402"
          rx={72 * (0.6 + 0.4 * Math.min(1.1, reveal))}
          ry={14}
          fill="rgba(2, 6, 23, 0.28)"
        />
      )}

      {/* Transform origin = telapak kaki (150, 398) supaya skala & squash tumbuh dari lantai */}
      <g transform={\`translate(150, 398) scale(\${(facing * Math.max(0.01, reveal)).toFixed(3)}, \${(Math.max(0.01, reveal) * squashY).toFixed(3)}) rotate(\${(main.body + sway * 0.35).toFixed(2)}) translate(-150, -398)\`}>
        {isCyberFox && (
          <path
            d="M192 252 C245 256 276 226 268 182 C250 176 228 205 192 232 Z"
            fill="#0077ff"
            stroke="#0b1d51"
            strokeWidth="3"
          />
        )}
        {isCyberFox && (
          <path d="M242 204 Q274 196 268 182 Q250 176 234 192 Z" fill="#fde047" />
        )}

        {viewMode === 'full' && (
          <g>
            <rect x="115" y="278" width="28" height="106" rx="14" fill="#0f172a" />
            <rect x="157" y="278" width="28" height="106" rx="14" fill="#0f172a" />
            <rect x="106" y="374" width="44" height="22" rx="10" fill={isCyberFox ? '#0b132b' : '#dc2626'} />
            <rect x="105" y="390" width="46" height="9" rx="4.5" fill="#ffffff" />
            <rect x="152" y="374" width="44" height="22" rx="10" fill={isCyberFox ? '#0b132b' : '#dc2626'} />
            <rect x="151" y="390" width="46" height="9" rx="4.5" fill="#ffffff" />
          </g>
        )}

        {/* Lengan Kiri 2-Segmen */}
        <g transform={\`translate(104, 174) rotate(\${leftShoulderRot.toFixed(1)})\`}>
          <path d="M-11 0 C-12 18 -10 34 -9 44 L9 44 C10 34 12 18 11 0 Z" fill="url(#hoodie3d)" />
          <circle cx="0" cy="44" r="9.5" fill="url(#hoodie3d)" />
          <g transform={\`translate(0, 44) rotate(\${leftElbowRot.toFixed(1)})\`}>
            <path d="M-9.5 0 L-7.5 38 C-7.5 42 7.5 42 7.5 38 L9.5 0 Z" fill="url(#hoodie3d)" />
            <g transform={\`translate(0, 41) rotate(\${(pendWrist * 9).toFixed(1)})\`}>
              <ellipse cx="0" cy="4" rx="10.5" ry="12.5" fill="url(#skin3d)" />
              <ellipse cx="7" cy="1" rx="4.2" ry="6.5" transform="rotate(24 7 1)" fill="url(#skin3d)" />
            </g>
          </g>
        </g>

        {/* Torso bernapas */}
        <g transform={\`translate(0, \${breathe.toFixed(1)})\`}>
          <rect x="100" y="158" width="100" height="128" rx="34" fill="url(#hoodie3d)" />
          {isCyberFox ? (
            <>
              <rect x="134" y="162" width="32" height="114" rx="6" fill="#ffffff" />
              <line x1="134" y1="164" x2="134" y2="274" stroke="#00e5ff" strokeWidth="4" />
              <line x1="166" y1="164" x2="166" y2="274" stroke="#00e5ff" strokeWidth="4" />
              <path d="M174 196 L186 208 M186 196 L174 208" stroke="#00e5ff" strokeWidth="3.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="M126 164 Q150 182 174 164" fill="none" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
              <path d="M140 198 L150 206 L160 198 L150 212 Z" fill="#ef4444" />
            </>
          )}
        </g>

        {/* Lengan Kanan 2-Segmen */}
        <g transform={\`translate(196, 174) rotate(\${rightShoulderRot.toFixed(1)})\`}>
          <path d="M-11 0 C-12 18 -10 34 -9 44 L9 44 C10 34 12 18 11 0 Z" fill="url(#hoodie3d)" />
          <circle cx="0" cy="44" r="9.5" fill="url(#hoodie3d)" />
          <g transform={\`translate(0, 44) rotate(\${rightElbowRot.toFixed(1)})\`}>
            <path d="M-9.5 0 L-7.5 39 C-7.5 43 7.5 43 7.5 39 L9.5 0 Z" fill="url(#hoodie3d)" />
            <g transform={\`translate(0, 42) rotate(\${(pendWrist * 11).toFixed(1)})\`}>
              <ellipse cx="0" cy="4" rx="10.5" ry="12.5" fill="url(#skin3d)" />
              <ellipse cx="-7" cy="1" rx="4.2" ry="6.5" transform="rotate(-24 -7 1)" fill="url(#skin3d)" />
            </g>
          </g>
        </g>

        {/* Leher & Kepala dengan Follow-Through Lag 5 Frame */}
        <g transform={\`translate(150, \${(96 + breathe * 0.7).toFixed(1)}) rotate(\${(lag.head + sway * 0.9).toFixed(1)})\`}>
          <path
            d="M-50 -8 C-56 -56 -28 -80 0 -80 C28 -80 56 -56 50 -8 C46 10 38 18 32 12 C-32 12 -46 10 -50 -8 Z"
            fill={charPalette.hairDark}
          />
          {isCyberFox && (
            <g>
              <polygon points="-46,-28 -64,-90 -14,-56" fill="#0b1d51" />
              <polygon points="-41,-32 -56,-78 -20,-54" fill="#0077ff" />
              <polygon points="-37,-34 -47,-62 -25,-48" fill="#ffffff" />
              <polygon points="46,-28 64,-90 14,-56" fill="#0b1d51" />
              <polygon points="41,-32 56,-78 20,-54" fill="#0077ff" />
              <polygon points="37,-34 47,-62 25,-48" fill="#ffffff" />
            </g>
          )}
          <rect x="-12" y="42" width="24" height="26" rx="10" fill="url(#skin3d)" />
          <ellipse cx="-47" cy="2" rx="7.5" ry="11" fill="url(#skin3d)" />
          <ellipse cx="47" cy="2" rx="7.5" ry="11" fill="url(#skin3d)" />
          <path
            d="M-47 -12 C-48 -50 -27 -62 0 -62 C27 -62 48 -50 47 -12 C46 14 31 38 12 49 C4 53 -4 53 -12 49 C-31 38 -46 14 -47 -12 Z"
            fill="url(#skin3d)"
          />
          <ellipse cx="-26" cy="13" rx="8.5" ry="4.5" fill="#fb7185" opacity="0.28" />
          <ellipse cx="26" cy="13" rx="8.5" ry="4.5" fill="#fb7185" opacity="0.28" />
          <path d="M-29 -16 Q-19 -21 -9 -15" fill="none" stroke={isCyberFox ? '#0b3b91' : '#1e293b'} strokeWidth="3.2" strokeLinecap="round" />
          <path d="M9 -15 Q19 -21 29 -16" fill="none" stroke={isCyberFox ? '#0b3b91' : '#1e293b'} strokeWidth="3.2" strokeLinecap="round" />

          {isHappyEyes ? (
            <>
              <path d="M-29 -2 Q-19 -12 -9 -2" fill="none" stroke="#18181b" strokeWidth="4.2" strokeLinecap="round" />
              <path d="M9 -2 Q19 -12 29 -2" fill="none" stroke="#18181b" strokeWidth="4.2" strokeLinecap="round" />
            </>
          ) : (
            <g transform={\`translate(\${lookDir.toFixed(1)}, 0)\`}>
              <ellipse cx="-19" cy="-2" rx="8.5" ry={10.5 * eyeOpen} fill="#ffffff" />
              <ellipse cx="-18" cy="-1.5" rx="6.2" ry={8.2 * eyeOpen} fill={charPalette.iris} />
              <circle cx="-20" cy="-5" r={2.5 * eyeOpen} fill="#ffffff" />
              <ellipse cx="19" cy="-2" rx="8.5" ry={10.5 * eyeOpen} fill="#ffffff" />
              <ellipse cx="20" cy="-1.5" rx="6.2" ry={8.2 * eyeOpen} fill={charPalette.iris} />
              <circle cx="18" cy="-5" r={2.5 * eyeOpen} fill="#ffffff" />
            </g>
          )}

          <path d="M-2 7 Q0 10 2 7" fill="none" stroke="#b4694e" strokeWidth="2.2" strokeLinecap="round" />
          <ellipse cx="0" cy="24" rx={7.5 + talkOpen * 3.8} ry={2.2 + talkOpen * 5.8} fill="#7f1d1d" />
          <rect x="-5.5" y="19.5" width="11" height="3.2" rx="1.5" fill="#ffffff" opacity={talkOpen > 0.35 ? 1 : 0} />

          <path
            d="M-49 -10 C-56 -52 -28 -78 2 -78 C32 -78 56 -50 49 -10 C42 -28 28 -36 12 -28 C-4 -38 -22 -36 -34 -24 C-41 -18 -45 -12 -49 -10 Z"
            fill="url(#hair3d)"
          />
          <path d="M-34 -56 C-26 -84 -4 -92 8 -70 C-2 -68 -18 -62 -34 -56 Z" fill="url(#hair3d)" />
          <path d="M-8 -66 C6 -94 30 -90 34 -60 C20 -64 6 -66 -8 -66 Z" fill="url(#hair3d)" />
          <path d="M18 -56 C36 -78 54 -66 48 -38 C38 -46 28 -52 18 -56 Z" fill="url(#hair3d)" />
          <path d="M-26 -46 C-12 -44 -2 -26 -8 -16 C-18 -22 -24 -34 -26 -46 Z" fill="url(#hair3d)" />
          <path d="M-4 -48 C12 -44 22 -26 16 -14 C6 -22 -2 -34 -4 -48 Z" fill="url(#hair3d)" />
          <path d="M-28 -50 Q0 -66 28 -48" fill="none" stroke={charPalette.hairHi} strokeWidth="3" strokeLinecap="round" opacity="0.55" />

          {isCyberFox && (
            <g fill="#fde047">
              <path d="M-24 -40 Q-34 -62 -10 -46 Z" />
              <path d="M4 -44 Q16 -72 22 -42 Z" />
              <path d="M24 -36 Q40 -54 36 -28 Z" />
            </g>
          )}

          {hasHeadphones && !isCyberFox && (
            <g>
              <path d="M-51 0 C-55 -66 55 -66 51 0" fill="none" stroke="#18181b" strokeWidth="9" strokeLinecap="round" />
              <rect x="-60" y="-14" width="16" height="34" rx="8" fill="#18181b" stroke="#ff471a" strokeWidth="3" />
              <rect x="44" y="-14" width="16" height="34" rx="8" fill="#18181b" stroke="#ff471a" strokeWidth="3" />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
};

// Style 1: 3D Studio Room Scene (Lantai + Lampu Gantung + Monitor + 3 Pedestal + Karakter Berakting)
const Studio3DRoomScene: React.FC<{ scene: SceneData; sceneIndex: number; totalScenes: number; watermark: string; durationInFrames: number }> = ({
  scene,
  sceneIndex,
  totalScenes,
  watermark,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const isWide = width > 1200;
  const isCta = scene.role === 'cta' || (sceneIndex === totalScenes - 1 && totalScenes > 1);
  const k1 = spring({ frame, fps, config: SPRING.bouncy });
  const k2 = spring({ frame: Math.max(0, frame - Math.round(durationInFrames * 0.2)), fps, config: SPRING.bouncy });
  const k3 = spring({ frame: Math.max(0, frame - Math.round(durationInFrames * 0.44)), fps, config: SPRING.bouncy });
  const k4 = spring({ frame: Math.max(0, frame - Math.round(durationInFrames * 0.7)), fps, config: SPRING.snappy });
  const exit = useExit(0.3);
  const isFollowed = frame >= Math.round(durationInFrames * 0.72);

  const wallHeadline = (scene.on_screen_text || 'STUDIO 3D').split('/')[0].trim().slice(0, 18).toUpperCase();
  const tags = (scene.visual_animation?.asset_elements || ['SCRIPT', 'RIG 3D', 'RENDER']).slice(0, 3);
  const stepBadges = ['01', '02', '03'];
  const wordTimings = buildWordTimings(scene.narration_text, durationInFrames / fps);
  const durSec = durationInFrames / fps;
  const cues: PoseCue[] = isCta
    ? [
        { at: 0, pose: 'wave' },
        { at: durSec * 0.45, pose: 'celebrate' },
      ]
    : [
        { at: 0, pose: sceneIndex % 2 === 0 ? 'present' : 'point' },
        { at: durSec * 0.38, pose: 'talk' },
        { at: durSec * 0.72, pose: 'thumbs' },
      ];

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #f3f0ea 0%, #dad3c8 58%, #7c5534 58%, #5c3d23 100%)', overflow: 'hidden' }}>
      <ParallaxBackdrop seed={\`studio-\${scene.id}\`} isDark={false} accent="#ff471a" secondary="#4CC9F0" />

      {/* Lampu Gantung Studio */}
      <div style={{ position: 'absolute', left: isWide ? 140 : 72, top: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: exit }}>
        <div style={{ width: 4, height: isWide ? 115 : 220, background: '#475569' }} />
        <div style={{ width: 112, height: 56, borderRadius: '54px 54px 10px 10px', background: 'linear-gradient(135deg, #f5cbc2, #b87b6f)', boxShadow: '0 24px 50px rgba(255,244,214,0.55)' }} />
      </div>

      {/* Badge Brand di Safe Zone */}
      <div style={{ position: 'absolute', top: isWide ? 44 : 230, left: 72, fontWeight: 900, fontSize: 28, color: THEME.ink, fontFamily: FONT.ui, opacity: 0.78 * exit }}>
        {watermark}
      </div>

      {/* Judul 3D Wall Zone (min 56px pada 9:16) */}
      <div
        style={{
          position: 'absolute',
          right: isWide ? 130 : 140,
          left: isWide ? undefined : 72,
          top: isWide ? 84 : 275,
          transform: \`scale(\${(k1 * exit).toFixed(3)})\`,
          fontFamily: FONT.display,
          fontSize: isWide ? 66 : 64,
          fontWeight: 900,
          lineHeight: 1.06,
          color: '#ff471a',
          textShadow: '2px 2px 0 #a8240d, 5px 5px 0 #7c1908',
        }}
      >
        {wallHeadline}
      </div>

      {/* Showcase Monitor Pseudo-3D (>= 430px lebar di 9:16) */}
      <div
        style={{
          position: 'absolute',
          right: isWide ? 130 : 140,
          top: isWide ? 185 : 410,
          width: isWide ? 520 : 520,
          borderRadius: 24,
          border: '4px solid #ff471a',
          background: '#0f172a',
          boxShadow: '0 22px 44px rgba(15,23,42,0.32)',
          overflow: 'hidden',
          opacity: exit,
          transform: \`perspective(1000px) rotateY(\${interpolate(k2, [0, 1], [-18, -4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }).toFixed(1)}deg) scale(\${k2.toFixed(3)}) translateY(\${(Math.sin(frame / 10) * 5).toFixed(1)}px)\`,
        }}
      >
        <div style={{ padding: '12px 18px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: FONT.ui, fontWeight: 800, fontSize: 18, color: '#38bdf8' }}>SCENE 0{scene.scene_number}</span>
          <span style={{ fontFamily: FONT.ui, fontSize: 16, fontWeight: 800, color: '#10b981' }}>
            {scene.asset_motion_prompt ? scene.asset_motion_prompt.slice(0, 18).toUpperCase() : '30 FPS READY'}
          </span>
        </div>
        {scene.media_url && (
          <div style={{ position: 'relative', width: '100%', height: 220, overflow: 'hidden', background: '#020617' }}>
            {scene.media_type === 'video' ? (
              <Video
                src={scene.media_url}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: \`scale(\${interpolate(frame, [0, durationInFrames], [1, scene.focus_region?.zoom || 1.2], { extrapolateRight: 'clamp' }).toFixed(3)})\`,
                }}
              />
            ) : (
              <Img
                src={scene.media_url}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: \`scale(\${interpolate(frame, [0, durationInFrames], [1, scene.focus_region?.zoom || 1.2], { extrapolateRight: 'clamp' }).toFixed(3)}) translateY(\${(Math.sin(frame / 12) * 6).toFixed(1)}px)\`,
                }}
              />
            )}
          </div>
        )}
        <div style={{ padding: '22px 24px' }}>
          <div style={{ fontFamily: FONT.display, fontSize: isWide ? 28 : 34, lineHeight: 1.15, fontWeight: 900, color: '#ffffff' }}>
            {scene.on_screen_text}
          </div>
        </div>
      </div>

      {/* 3 Pedestal Naik Berurutan dengan Stagger */}
      <div style={{ position: 'absolute', right: isWide ? 115 : 140, top: isWide ? undefined : 760, bottom: isWide ? 90 : undefined, display: 'flex', gap: 24, alignItems: 'flex-end', opacity: exit }}>
        {tags.map((label, i) => {
          const p = i === 0 ? k1 : i === 1 ? k2 : k3;
          const floatY = Math.sin(frame / 8 + i * 1.4) * 5;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: \`scaleY(\${Math.max(0.01, p).toFixed(3)})\`, transformOrigin: 'bottom center' }}>
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  background: '#0f172a',
                  border: i === 1 ? '4px solid #ff471a' : '3px solid #38bdf8',
                  marginBottom: 14 + floatY,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <polygon points={i === 1 ? '12,2 22,12 12,22 2,12' : '5,3 20,12 5,21'} fill={i === 1 ? '#fbbf24' : '#38bdf8'} />
                </svg>
              </div>
              <div style={{ width: 132, height: 22, borderRadius: '50%', background: i === 1 ? '#ff471a' : '#f97316', border: '4px solid #fff7ed', marginBottom: -10, zIndex: 2 }} />
              <div
                style={{
                  width: 132,
                  height: 126 + (i === 1 ? 28 : i === 2 ? 12 : 0),
                  borderRadius: '0 0 18px 18px',
                  background: 'linear-gradient(90deg, #e2e8f0, #ffffff, #cbd5e1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '0 8px',
                }}
              >
                <span style={{ background: i === 1 ? '#ff471a' : '#2563eb', color: '#ffffff', fontSize: 16, fontWeight: 900, padding: '3px 10px', borderRadius: 10 }}>
                  STEP {stepBadges[i]}
                </span>
                <span style={{ background: '#0f172a', color: '#ffffff', fontSize: 16, fontWeight: 800, padding: '4px 10px', borderRadius: 10, maxWidth: 118, textAlign: 'center' }}>
                  {String(label).split(/\\s+/)[0].slice(0, 10).toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Karakter 3D di Lantai Studio (Berakting sesuai narasi) */}
      {ACTIVE_CHARACTER !== 'none' && (
        <div style={{ position: 'absolute', left: isWide ? 140 : 48, top: isWide ? '34%' : 650 }}>
          <Creator3DNarratorRig
            pose={isCta ? (isFollowed ? 'celebrate' : 'wave') : sceneIndex % 2 === 0 ? 'present' : 'point'}
            cues={cues}
            talkWords={wordTimings}
            facing={1}
            hasHeadphones={ACTIVE_CHARACTER === 'kreator_3d_headphone' || ACTIVE_CHARACTER === 'kreator_3d_studio'}
            scale={isWide ? 1.25 : 1.38}
            seed={\`studio-char-\${scene.id}\`}
          />
        </div>
      )}

      {isCta && (
        <div
          style={{
            position: 'absolute',
            left: '48%',
            top: isWide ? '44%' : 640,
            transform: \`translate(-50%, -50%) scale(\${(k3 * exit).toFixed(3)})\`,
            background: '#0f172a',
            border: '3px solid #FFD23F',
            borderRadius: 28,
            padding: '24px 36px',
            display: 'flex',
            alignItems: 'center',
            gap: 22,
          }}
        >
          <div style={{ fontFamily: FONT.display, fontSize: 56, fontWeight: 900, color: '#ffffff' }}>
            {isFollowed ? 'TERSIMPAN' : 'FOLLOW +'}
          </div>
          <div style={{ padding: '12px 24px', borderRadius: 16, background: isFollowed ? '#10b981' : '#ff471a', fontWeight: 900, fontSize: 28, color: '#ffffff', transform: \`scale(\${1 + k4 * 0.08})\` }}>
            {isFollowed ? 'SIAP ✓' : 'SIMPAN'}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// Style 2: Editorial Motion Grid dengan Pseudo-3D Cards, Grafik Tumbuh & Karakter Berakting
const EditorialMotionGridScene: React.FC<{ scene: SceneData; sceneIndex: number; totalScenes: number; watermark: string; durationInFrames: number }> = ({
  scene,
  sceneIndex,
  totalScenes,
  watermark,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const isWide = width > 1200;
  const isCyberDark = sceneIndex % 2 === 0;
  const isCta = scene.role === 'cta' || (sceneIndex === totalScenes - 1 && totalScenes > 1);
  const ink = isCyberDark ? '#f8fafc' : '#141B3A';
  const cardBg = isCyberDark ? 'rgba(7, 20, 54, 0.94)' : 'rgba(255, 255, 255, 0.96)';
  const border = isCyberDark ? '#4CC9F0' : '#243A8F';

  const k1 = useEnter(0.05, SPRING.bouncy);
  const k2 = useEnter(0.24, SPRING.bouncy);
  const k3 = useEnter(0.42, SPRING.bouncy);
  const exit = useExit(0.3);
  const isFollowed = frame >= Math.round(durationInFrames * 0.72);
  const steps = (scene.visual_animation?.asset_elements || ['Riset Topik', 'Rig 3D', 'Sync Audio']).slice(0, 3);
  const rollViews = Math.round(
    interpolate(frame, [0, Math.max(20, durationInFrames * 0.65)], [0, 128400], {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  ).toLocaleString('en-US');

  const variant = isCta ? 5 : sceneIndex === 0 ? 0 : sceneIndex % 4;
  const tiltX = interpolate(k1, [0, 1], [24, 2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const tiltY = interpolate(k1, [0, 1], [-16, Math.sin(frame / 18) * 6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const durSec = durationInFrames / fps;
  const wordTimings = buildWordTimings(scene.narration_text, durSec);
  const cues: PoseCue[] = isCta
    ? [
        { at: 0, pose: 'wave' },
        { at: durSec * 0.42, pose: 'celebrate' },
      ]
    : [
        { at: 0, pose: sceneIndex % 2 === 0 ? 'talk' : 'think' },
        { at: durSec * 0.36, pose: 'point' },
        { at: durSec * 0.7, pose: 'idea' },
      ];

  return (
    <AbsoluteFill style={{ color: ink, overflow: 'hidden' }}>
      <ParallaxBackdrop seed={\`grid-\${scene.id}\`} isDark={isCyberDark} accent={border} secondary={THEME.accent} />

      <div style={{ position: 'absolute', top: isWide ? 48 : 230, left: 72, right: 140, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: exit }}>
        <TopicChip text={watermark.replace(/^@/, '') || 'GRAPH MOTION'} accent={isCyberDark ? '#243A8F' : '#141B3A'} />
        <span style={{ fontSize: 22, fontWeight: 800, color: border, fontFamily: FONT.ui }}>
          SCENE 0{scene.scene_number}
        </span>
      </div>

      {/* Konten Zona Utama y: 320..1180 */}
      <div
        style={{
          position: 'absolute',
          left: isWide ? 120 : 72,
          right: isWide ? 360 : 140,
          top: isWide ? 160 : 340,
          perspective: 1100,
          opacity: exit,
        }}
      >
        {variant === 5 ? (
          <Float amp={7} speed={0.5}>
            <div style={{ transform: \`perspective(950px) rotateX(\${tiltX}deg) rotateY(\${tiltY}deg) scale(\${k2})\`, background: 'linear-gradient(135deg, #071436, #1e3a8a)', border: '3px solid #4CC9F0', color: '#ffffff', padding: '38px 42px', borderRadius: 28 }}>
              <div style={{ fontFamily: FONT.display, fontSize: 60, fontWeight: 900, lineHeight: 1.08 }}>{scene.on_screen_text}</div>
              <div style={{ marginTop: 22, display: 'inline-block', padding: '14px 32px', borderRadius: 16, background: isFollowed ? '#10b981' : THEME.accent, color: THEME.ink, fontFamily: FONT.display, fontWeight: 900, fontSize: 56 }}>
                {isFollowed ? 'TERSIMPAN ✓' : 'SIMPAN & SHARE'}
              </div>
            </div>
          </Float>
        ) : variant === 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, transform: \`perspective(950px) rotateY(\${tiltY}deg)\` }}>
            {steps.map((st, i) => {
              const p = i === 0 ? k1 : i === 1 ? k2 : k3;
              const flipCard = interpolate(p, [0, 1], [28, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              return (
                <div
                  key={i}
                  style={{
                    background: cardBg,
                    border: \`3px solid \${p > 0.5 ? '#10b981' : border}\`,
                    borderRadius: 22,
                    padding: '22px 28px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transform: \`perspective(700px) rotateX(\${flipCard}deg) translateX(\${((1 - p) * 64).toFixed(1)}px)\`,
                    opacity: Math.min(1, p * 2),
                  }}
                >
                  <span style={{ fontFamily: FONT.display, fontSize: isWide ? 36 : 56, fontWeight: 900 }}>
                    0{i + 1}. {String(st).slice(0, 16)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : variant === 2 ? (
          <Float amp={5} speed={0.45}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 420, padding: '36px 36px', background: cardBg, borderRadius: 28, border: \`3px solid \${border}\`, transform: \`perspective(950px) rotateX(\${tiltX}deg) rotateY(\${tiltY}deg) scale(\${k1})\` }}>
              {[130, 195, 250, 310].map((h, i) => {
                const kh = i === 0 ? k1 : i === 1 ? k2 : k3;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: FONT.display, fontSize: 32, fontWeight: 900, color: i === 3 ? '#10b981' : border }}>
                      +{Math.round(h * 0.4 * kh)}%
                    </span>
                    <div
                      style={{
                        width: 92,
                        height: Math.max(18, h * kh),
                        borderRadius: 16,
                        background: i === 3 ? 'linear-gradient(180deg, #FFD23F, #f59e0b)' : 'linear-gradient(180deg, #4CC9F0, #243A8F)',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </Float>
        ) : (
          <Float amp={6} speed={0.5}>
            <div style={{ transform: \`perspective(950px) rotateX(\${tiltX}deg) rotateY(\${tiltY}deg) scale(\${(0.76 + 0.24 * k1).toFixed(3)})\`, background: cardBg, border: \`3px solid \${border}\`, borderRadius: 30, padding: '38px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ fontFamily: FONT.display, fontSize: isWide ? 60 : 68, fontWeight: 900, lineHeight: 1.08 }}>
                {scene.on_screen_text}
              </div>
              <div style={{ fontFamily: FONT.display, fontSize: isWide ? 36 : 56, fontWeight: 800, color: border }}>
                {rollViews} VIEWS
              </div>
            </div>
          </Float>
        )}
      </div>

      {/* Karakter Berakting di Sisi Berlawanan Hero (Kaki menyentuh lantai) */}
      {ACTIVE_CHARACTER !== 'none' && (
        <div style={{ position: 'absolute', right: isWide ? 80 : 140, top: isWide ? '30%' : 660 }}>
          <Creator3DNarratorRig
            pose={isCta ? (isFollowed ? 'celebrate' : 'wave') : sceneIndex % 2 === 0 ? 'present' : 'idea'}
            cues={cues}
            talkWords={wordTimings}
            facing={-1}
            hasHeadphones={true}
            viewMode="full"
            scale={isWide ? 1.2 : 1.32}
            seed={\`grid-char-\${scene.id}\`}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};

// Scene Router Multi-Template (Hook, Konsep, Bandingkan, Grafik, Langkah, Metafora, CTA)
const SceneRenderer: React.FC<{
  scene: SceneData;
  sceneIndex: number;
  totalScenes: number;
  watermark: string;
  tempo: 'energik' | 'santai';
  durationInFrames: number;
}> = ({ scene, sceneIndex, totalScenes, watermark, tempo, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const isWide = width > 1200;

  if (scene.visualModule === 'studio_3d_room' && !scene.website_step) {
    return <Studio3DRoomScene scene={scene} sceneIndex={sceneIndex} totalScenes={totalScenes} watermark={watermark} durationInFrames={durationInFrames} />;
  }
  if (scene.visualModule === 'editorial_motion_grid' && !scene.website_step) {
    return <EditorialMotionGridScene scene={scene} sceneIndex={sceneIndex} totalScenes={totalScenes} watermark={watermark} durationInFrames={durationInFrames} />;
  }

  const entrance = useEnter(0.04, SPRING.bouncy);
  const k2 = useEnter(0.24, SPRING.bouncy);
  const k3 = useEnter(0.42, SPRING.bouncy);
  const exit = useExit(0.3);
  const durSec = durationInFrames / fps;
  const wordTimings = buildWordTimings(scene.narration_text, durSec);
  const webStep = scene.website_step;

  const isHook = sceneIndex === 0 || scene.role === 'hook';
  const isCta = scene.role === 'cta' || (sceneIndex === totalScenes - 1 && totalScenes > 1);
  const isCompare = scene.visual_animation?.layout === 'split_compare_cards' || scene.role === 'contrast_example';
  const isChart = scene.visual_animation?.layout === 'animated_bar_metrics';
  const isSteps = scene.visual_animation?.layout === 'staggered_steps_stack' || scene.role === 'solution';
  const chips = (scene.visual_animation?.asset_elements || ['CEPAT', 'BERPEGAS', 'HALUS']).slice(0, 3);

  const cues: PoseCue[] = isHook
    ? [{ at: 0, pose: 'surprised' }, { at: durSec * 0.45, pose: 'point' }]
    : isCta
    ? [{ at: 0, pose: 'wave' }, { at: durSec * 0.5, pose: 'celebrate' }]
    : [
        { at: 0, pose: sceneIndex % 2 === 0 ? 'present' : 'think' },
        { at: durSec * 0.4, pose: 'talk' },
        { at: durSec * 0.72, pose: 'thumbs' },
      ];

  const charOnLeft = sceneIndex % 2 === 0;

  return (
    <AbsoluteFill style={{ overflow: 'hidden', color: THEME.white }}>
      <ParallaxBackdrop seed={\`sc-\${scene.id}\`} isDark={true} accent={scene.accentColor} secondary={scene.secondaryColor} />

      <div style={{ position: 'absolute', top: isWide ? 48 : 230, left: 72, right: 140, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: exit }}>
        <TopicChip text={chips[0] || watermark} accent={THEME.primary} />
        <span style={{ fontSize: 22, fontFamily: FONT.ui, fontWeight: 800, color: THEME.sky }}>
          0{scene.scene_number} / 0{totalScenes}
        </span>
      </div>

      {/* Hero Object >= 430px Lebar di Sisi Berlawanan Karakter */}
      <div
        style={{
          position: 'absolute',
          left: isWide ? (charOnLeft ? 480 : 120) : charOnLeft ? 290 : 72,
          right: isWide ? (charOnLeft ? 120 : 480) : charOnLeft ? 140 : 290,
          top: isWide ? 180 : 340,
          opacity: exit,
          perspective: 1100,
        }}
      >
        {webStep ? (
          <Float amp={6} speed={0.5}>
            <div style={{ borderRadius: 28, border: \`3px solid \${scene.accentColor}\`, background: '#0f172a', overflow: 'hidden', transform: \`perspective(950px) rotateY(\${(Math.sin(frame / 20) * 6).toFixed(1)}deg) scale(\${entrance.toFixed(3)})\` }}>
              {(scene.media_url || webStep.screenshotDataUrl) && (
                <div style={{ width: '100%', height: isWide ? 340 : 380, overflow: 'hidden' }}>
                  {scene.media_type === 'video' ? (
                    <Video src={scene.media_url || webStep.screenshotDataUrl || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Img src={scene.media_url || webStep.screenshotDataUrl || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
              )}
              <div style={{ padding: 28 }}>
                <div style={{ fontFamily: FONT.display, fontSize: isWide ? 34 : 56, fontWeight: 900, lineHeight: 1.1 }}>{webStep.screenTitle}</div>
                <div style={{ marginTop: 14, padding: '12px 24px', borderRadius: 14, background: scene.accentColor, fontFamily: FONT.display, fontSize: isWide ? 24 : 56, fontWeight: 900, textAlign: 'center' }}>
                  {webStep.actionLabel}
                </div>
              </div>
            </div>
          </Float>
        ) : isCompare ? (
          <div style={{ display: 'flex', gap: 18 }}>
            <Pop delay={0.08} from="left">
              <div style={{ flex: 1, minWidth: 220, background: 'rgba(239,68,68,0.16)', border: '3px solid #ef4444', borderRadius: 24, padding: 26 }}>
                <div style={{ fontFamily: FONT.display, fontSize: 56, fontWeight: 900, color: '#fca5a5' }}>SLIDE KAKU</div>
              </div>
            </Pop>
            <Pop delay={0.26} from="right">
              <div style={{ flex: 1, minWidth: 220, background: 'rgba(16,185,129,0.2)', border: '3px solid #10b981', borderRadius: 24, padding: 26 }}>
                <div style={{ fontFamily: FONT.display, fontSize: 56, fontWeight: 900, color: '#6ee7b7' }}>PEGAS 3D</div>
              </div>
            </Pop>
          </div>
        ) : isChart ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 390, background: 'rgba(15,23,42,0.88)', border: \`3px solid \${THEME.sky}\`, borderRadius: 28, padding: 28 }}>
            {[120, 210, 295].map((h, i) => {
              const p = i === 0 ? entrance : i === 1 ? k2 : k3;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: FONT.display, fontSize: 32, fontWeight: 900, color: THEME.accent }}>{Math.round(h * p)}%</span>
                  <div style={{ width: 96, height: Math.max(20, h * p), borderRadius: 16, background: i === 2 ? THEME.accent : THEME.sky }} />
                </div>
              );
            })}
          </div>
        ) : isSteps ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {chips.map((item, i) => (
              <Pop key={i} delay={0.1 + i * 0.16} from="bottom">
                <div style={{ background: 'rgba(15,23,42,0.9)', border: \`3px solid \${THEME.sky}\`, borderRadius: 22, padding: '20px 26px', fontFamily: FONT.display, fontSize: 56, fontWeight: 900 }}>
                  0{i + 1}. {String(item).split(/\\s+/)[0]}
                </div>
              </Pop>
            ))}
          </div>
        ) : (
          <Float amp={7} speed={0.55}>
            <div style={{ background: 'rgba(15,23,42,0.9)', border: \`4px solid \${THEME.accent}\`, borderRadius: 30, padding: '38px 36px', transform: \`perspective(950px) rotateY(\${(Math.sin(frame / 22) * 8).toFixed(1)}deg) scale(\${entrance.toFixed(3)})\` }}>
              <h2 style={{ fontFamily: FONT.display, fontSize: isWide ? 60 : 66, fontWeight: 900, lineHeight: 1.08, color: THEME.white, margin: 0 }}>
                {scene.on_screen_text}
              </h2>
            </div>
          </Float>
        )}
      </div>

      {/* Karakter Berakting di Sisi Berlawanan dari Hero */}
      {ACTIVE_CHARACTER !== 'none' && (
        <div
          style={{
            position: 'absolute',
            left: charOnLeft ? 44 : undefined,
            right: charOnLeft ? undefined : 120,
            top: isWide ? '34%' : 660,
          }}
        >
          <Creator3DNarratorRig
            pose={isCta ? 'celebrate' : sceneIndex % 2 === 0 ? 'present' : 'point'}
            cues={cues}
            talkWords={wordTimings}
            facing={charOnLeft ? 1 : -1}
            hasHeadphones={ACTIVE_CHARACTER === 'kreator_3d_headphone' || ACTIVE_CHARACTER === 'kreator_3d_studio'}
            scale={isWide ? 1.2 : 1.32}
            seed={\`scene-char-\${scene.id}\`}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};
`;

  const true3DScenesTsx = `
// True 3D WebGL Remotion Stage Components (Powered by @remotion/three + Three.js)
export type PoseKey =
  | 'idle'
  | 'talk'
  | 'point'
  | 'think'
  | 'celebrate'
  | 'shrug'
  | 'surprised'
  | 'walk'
  | 'present'
  | 'idea'
  | 'thumbs'
  | 'cheer'
  | 'wave'
  | 'stand';

const Creator3DNarratorRig: React.FC<{
  pose: PoseKey | string;
  hasHeadphones?: boolean;
}> = ({ pose, hasHeadphones = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const k = spring({ frame, fps, config: SPRING.bouncy });
  const exit = useExit(0.28);
  const kActive = k * exit;
  const sway = Math.sin(t * 2.1) * 0.08;
  const headLag = Math.sin((frame - 5) / 14) * 0.09;
  const pendShoulder = Math.sin(t * 3.8) * 0.09;
  const pendElbow = Math.sin(t * 3.8 - 0.65) * 0.14;
  const rShoulderZ = (pose === 'cheer' || pose === 'celebrate' ? -1.45 * kActive : pose === 'point' ? -0.92 * kActive : -0.52 * kActive) + pendShoulder;
  const rElbowZ = (pose === 'cheer' || pose === 'celebrate' ? -0.68 * kActive : pose === 'point' ? -0.34 * kActive : -0.34 * kActive) + pendElbow;
  const lShoulderZ = (pose === 'cheer' || pose === 'celebrate' ? 1.45 * kActive : 0.18) - pendShoulder * 0.7;
  const lElbowZ = (pose === 'cheer' || pose === 'celebrate' ? 0.65 * kActive : 0.24) - pendElbow * 0.7;
  const isCyberFox = ACTIVE_CHARACTER.includes('rubah');
  const skinCol = isCyberFox ? '#fde6d8' : '#f3c1a2';
  const hairCol = isCyberFox ? '#0077ff' : '#ff5c28';
  const hoodieCol = isCyberFox ? '#0b132b' : '#1e293b';
  const irisCol = isCyberFox ? '#0284c7' : '#111827';

  return (
    <group position={[-1.45, 0, 0.65]} rotation={[0, 0.18 + sway, 0]} scale={[Math.max(0.01, kActive), Math.max(0.01, kActive), Math.max(0.01, kActive)]}>
      {/* Bayangan lantai */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 24]} />
        <meshBasicMaterial color="#020617" transparent opacity={0.32} />
      </mesh>
      {/* Kaki menempel di floorY = 0 */}
      <mesh position={[-0.14, 0.38, 0]}><capsuleGeometry args={[0.085, 0.42, 8, 12]} /><meshStandardMaterial color="#0f172a" /></mesh>
      <mesh position={[0.14, 0.38, 0]}><capsuleGeometry args={[0.085, 0.42, 8, 12]} /><meshStandardMaterial color="#0f172a" /></mesh>
      <mesh position={[0, 1.06, 0]}><capsuleGeometry args={[0.24, 0.42, 10, 16]} /><meshStandardMaterial color={hoodieCol} roughness={0.6} /></mesh>
      {isCyberFox && (
        <>
          <mesh position={[0, 1.06, 0.21]}><boxGeometry args={[0.18, 0.42, 0.06]} /><meshStandardMaterial color="#ffffff" /></mesh>
          <mesh position={[0, 0.85, -0.34]} rotation={[-0.65, Math.sin(t * 4.5) * 0.25, 0]}><capsuleGeometry args={[0.14, 0.32, 8, 12]} /><meshStandardMaterial color="#0077ff" /></mesh>
          <mesh position={[0, 1.06, -0.52]} rotation={[-0.55, Math.sin(t * 4.5) * 0.25, 0]}><coneGeometry args={[0.15, 0.32, 12]} /><meshStandardMaterial color="#fde047" /></mesh>
        </>
      )}
      <group position={[-0.29, 1.24, 0]} rotation={[0.12, 0, lShoulderZ]}>
        <mesh position={[0, -0.11, 0]}><cylinderGeometry args={[0.068, 0.056, 0.22, 14]} /><meshStandardMaterial color={hoodieCol} /></mesh>
        <group position={[0, -0.22, 0]} rotation={[-0.28, 0, lElbowZ]}>
          <mesh position={[0, -0.10, 0]}><cylinderGeometry args={[0.055, 0.044, 0.20, 14]} /><meshStandardMaterial color={hoodieCol} /></mesh>
          <mesh position={[0, -0.22, 0]} scale={[0.88, 1.12, 0.72]}><sphereGeometry args={[0.052, 12, 10]} /><meshStandardMaterial color={skinCol} /></mesh>
        </group>
      </group>
      <group position={[0.29, 1.24, 0]} rotation={[-0.18, 0, rShoulderZ]}>
        <mesh position={[0, -0.11, 0]}><cylinderGeometry args={[0.068, 0.056, 0.22, 14]} /><meshStandardMaterial color={hoodieCol} /></mesh>
        <group position={[0, -0.22, 0]} rotation={[-0.34, 0, rElbowZ]}>
          <mesh position={[0, -0.10, 0]}><cylinderGeometry args={[0.055, 0.044, 0.20, 14]} /><meshStandardMaterial color={hoodieCol} /></mesh>
          <mesh position={[0, -0.22, 0]} scale={[0.88, 1.12, 0.72]}><sphereGeometry args={[0.052, 12, 10]} /><meshStandardMaterial color={skinCol} /></mesh>
        </group>
      </group>
      {/* Kepala dengan follow-through lag 5 frame */}
      <group position={[0, 1.66 + Math.sin(t * 2.8) * 0.02, 0]} rotation={[0, headLag, 0]}>
        <mesh scale={[0.89, 1.05, 0.95]}><sphereGeometry args={[0.34, 24, 20]} /><meshStandardMaterial color={skinCol} roughness={0.48} /></mesh>
        <mesh position={[0, -0.18, 0.03]} rotation={[Math.PI, 0, 0]} scale={[0.82, 0.65, 0.85]}><coneGeometry args={[0.24, 0.26, 20]} /><meshStandardMaterial color={skinCol} roughness={0.48} /></mesh>
        <mesh position={[-0.11, 0.03, 0.30]}><sphereGeometry args={[0.045, 12, 10]} /><meshBasicMaterial color={irisCol} /></mesh>
        <mesh position={[0.11, 0.03, 0.30]}><sphereGeometry args={[0.045, 12, 10]} /><meshBasicMaterial color={irisCol} /></mesh>
        <mesh position={[0, 0.11, -0.02]} scale={[0.91, 1.02, 0.97]}><sphereGeometry args={[0.355, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.56]} /><meshStandardMaterial color={hairCol} roughness={0.38} /></mesh>
        <mesh position={[-0.10, 0.30, 0.18]} rotation={[0.35, 0.2, 0.45]} scale={[1.2, 0.42, 0.65]}><capsuleGeometry args={[0.055, 0.16, 8, 12]} /><meshStandardMaterial color={hairCol} roughness={0.35} /></mesh>
        <mesh position={[0.08, 0.32, 0.16]} rotation={[0.28, -0.2, -0.38]} scale={[1.25, 0.42, 0.65]}><capsuleGeometry args={[0.06, 0.18, 8, 12]} /><meshStandardMaterial color={hairCol} roughness={0.35} /></mesh>
        <mesh position={[0.20, 0.24, 0.12]} rotation={[0.22, -0.3, -0.55]} scale={[1.15, 0.40, 0.62]}><capsuleGeometry args={[0.05, 0.15, 8, 12]} /><meshStandardMaterial color={hairCol} roughness={0.35} /></mesh>
        {isCyberFox && (
          <>
            <mesh position={[-0.24, 0.36, 0]} rotation={[0, 0, 0.32]}><coneGeometry args={[0.13, 0.36, 12]} /><meshStandardMaterial color="#0077ff" /></mesh>
            <mesh position={[0.24, 0.36, 0]} rotation={[0, 0, -0.32]}><coneGeometry args={[0.13, 0.36, 12]} /><meshStandardMaterial color="#0077ff" /></mesh>
            <mesh position={[0.04, 0.44, 0.12]} rotation={[0.3, 0, -0.2]}><coneGeometry args={[0.07, 0.24, 8]} /><meshStandardMaterial color="#fde047" /></mesh>
          </>
        )}
        {hasHeadphones && !isCyberFox && (
          <mesh rotation={[0, 0, 0]}><torusGeometry args={[0.35, 0.032, 10, 28, Math.PI]} /><meshStandardMaterial color="#18181b" metalness={0.5} /></mesh>
        )}
      </group>
    </group>
  );
};

const PedestalWithProp3D: React.FC<{ x: number; z: number; height: number; delay: number; accent: string; idx: number }> = ({
  x, z, height, delay, accent, idx,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const grow = Math.max(0.001, spring({ frame: Math.max(0, frame - delay), fps, config: SPRING.bouncy }));
  const floatY = Math.sin(frame / 10 + idx) * 0.07;
  const propColor = idx === 0 ? '#4CC9F0' : idx === 1 ? accent : '#FFD23F';
  return (
    <group position={[x, 0, z]} scale={[1, grow, 1]}>
      <mesh position={[0, height * 0.5, 0]}><cylinderGeometry args={[0.38, 0.41, height, 28]} /><meshStandardMaterial color="#f8fafc" roughness={0.32} /></mesh>
      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.4, 0.035, 12, 28]} /><meshStandardMaterial color={propColor} emissive={propColor} emissiveIntensity={0.55} /></mesh>
      <mesh position={[0, height * 0.58, 0.39]}><boxGeometry args={[0.48, 0.16, 0.04]} /><meshStandardMaterial color="#0f172a" roughness={0.4} /></mesh>
      <mesh position={[0, height + 0.38 + floatY, 0]} rotation={[0.18, Math.sin(frame / 18 + idx) * 0.32, 0]}>
        {idx === 0 ? (
          <boxGeometry args={[0.34, 0.42, 0.06]} />
        ) : idx === 1 ? (
          <octahedronGeometry args={[0.26, 0]} />
        ) : (
          <dodecahedronGeometry args={[0.24, 0]} />
        )}
        <meshStandardMaterial color={propColor} emissive={propColor} emissiveIntensity={0.38} metalness={0.48} roughness={0.25} />
      </mesh>
    </group>
  );
};

const ThreeCameraRig: React.FC<{ sceneIndex: number; durationInFrames: number; isHook: boolean }> = ({
  sceneIndex, durationInFrames, isHook,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { camera } = useThree();
  const pull = isHook ? spring({ frame: Math.max(0, frame - 3), fps, config: SPRING.bouncy }) : 1;
  const tNorm = interpolate(frame, [0, Math.max(1, durationInFrames)], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const dir = sceneIndex % 2 === 0 ? 1 : -1;
  const z = isHook
    ? interpolate(pull, [0, 1], [6.2, 8.6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) - tNorm * 0.45
    : 8.8 - tNorm * 0.85;
  const x = isHook
    ? interpolate(pull, [0, 1], [-0.9, 0.1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) + dir * tNorm * 0.35
    : dir * tNorm * 0.55;
  camera.position.set(x, 2.25, z);
  camera.lookAt(0, 1.55, 0);
  return null;
};

const Studio3DRoomScene: React.FC<{ scene: SceneData; sceneIndex: number; totalScenes: number; watermark: string; durationInFrames: number }> = ({
  scene, sceneIndex, watermark, durationInFrames,
}) => {
  const { width, height } = useVideoConfig();
  const isPortrait = width <= 1120;
  const accent = '#ff471a';
  return (
    <AbsoluteFill style={{ backgroundColor: '#dfd4c4' }}>
      <ThreeCanvas width={width} height={height}>
        <color attach="background" args={['#dfd4c4']} />
        <fog attach="fog" args={['#dfd4c4', 12, 28]} />
        <hemisphereLight args={['#fffbeb', '#78553a', 0.7]} />
        <directionalLight position={[4.5, 8, 6]} intensity={2.1} color="#fff7ed" />
        <directionalLight position={[-5, 4, 3]} intensity={0.75} color="#93c5fd" />
        <ThreeCameraRig sceneIndex={sceneIndex} durationInFrames={durationInFrames} isHook={sceneIndex === 0} />
        <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[32, 32]} /><meshStandardMaterial color="#8b623f" roughness={0.78} /></mesh>
        <PedestalWithProp3D x={-0.25} z={0.4} height={0.88} delay={2} accent={accent} idx={0} />
        <PedestalWithProp3D x={0.72} z={0.15} height={1.15} delay={10} accent={accent} idx={1} />
        <PedestalWithProp3D x={1.68} z={0.45} height={0.96} delay={18} accent={accent} idx={2} />
        {ACTIVE_CHARACTER !== 'none' && <Creator3DNarratorRig pose={sceneIndex % 2 === 0 ? 'present' : 'point'} />}
      </ThreeCanvas>
      <div style={{ position: 'absolute', top: isPortrait ? 240 : 48, left: 72, right: 140, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <TopicChip text={watermark.replace(/^@/, '') || 'STUDIO 3D'} accent={accent} />
        <div style={{ fontFamily: FONT.display, fontSize: isPortrait ? 60 : 48, fontWeight: 900, lineHeight: 1.08, color: THEME.ink }}>
          {scene.on_screen_text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const EditorialMotionGridScene: React.FC<{ scene: SceneData; sceneIndex: number; totalScenes: number; watermark: string; durationInFrames: number }> = ({
  scene, sceneIndex, watermark, durationInFrames,
}) => {
  const { width, height } = useVideoConfig();
  const isPortrait = width <= 1120;
  const isCyberDark = sceneIndex % 2 === 0;
  const bg = isCyberDark ? '#020b24' : '#e8f2ff';
  const accent = isCyberDark ? '#4CC9F0' : '#243A8F';
  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <ThreeCanvas width={width} height={height}>
        <color attach="background" args={[bg]} />
        <fog attach="fog" args={[bg, 12, 28]} />
        <hemisphereLight args={['#dbeafe', '#1e293b', 0.7]} />
        <directionalLight position={[4.5, 8, 6]} intensity={2.0} />
        <ThreeCameraRig sceneIndex={sceneIndex} durationInFrames={durationInFrames} isHook={sceneIndex === 0} />
        <gridHelper args={[28, 28, accent, accent]} position={[0, 0.01, 0]} />
        <PedestalWithProp3D x={-0.25} z={0.4} height={0.88} delay={2} accent={accent} idx={0} />
        <PedestalWithProp3D x={0.72} z={0.15} height={1.15} delay={10} accent={accent} idx={1} />
        <PedestalWithProp3D x={1.68} z={0.45} height={0.96} delay={18} accent={accent} idx={2} />
        {ACTIVE_CHARACTER !== 'none' && <Creator3DNarratorRig pose={sceneIndex % 2 === 0 ? 'present' : 'point'} />}
      </ThreeCanvas>
      <div style={{ position: 'absolute', top: isPortrait ? 240 : 48, left: 72, right: 140, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <TopicChip text={watermark.replace(/^@/, '') || 'MOTION GRID'} accent={accent} />
        <div style={{ fontFamily: FONT.display, fontSize: isPortrait ? 60 : 48, fontWeight: 900, lineHeight: 1.08, color: isCyberDark ? THEME.white : THEME.ink }}>
          {scene.on_screen_text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SceneRenderer: React.FC<{
  scene: SceneData;
  sceneIndex: number;
  totalScenes: number;
  watermark: string;
  tempo: 'energik' | 'santai';
  durationInFrames: number;
}> = (props) => {
  if (props.scene.visualModule === 'studio_3d_room' && !props.scene.website_step) {
    return <Studio3DRoomScene {...props} />;
  }
  return <EditorialMotionGridScene {...props} />;
};
`;

  const mainCompositionBody = `
export const SatsetComposition: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.darkStage, color: THEME.white, fontFamily: FONT.ui, overflow: 'hidden' }}>
      <TransitionSeries>
        {scenes.map((scene, idx) => {
          const durationInFrames = Math.max(30, Math.round((scene.target_duration_sec || 4) * fps));
          const elements: React.ReactNode[] = [];

          if (idx > 0) {
            elements.push(
              <TransitionSeries.Transition
                key={\`tr-\${scene.id}\`}
                presentation={idx % 2 === 0 ? fade() : slide({ direction: idx % 4 === 1 ? 'from-right' : 'from-left' })}
                timing={springTiming({ config: { damping: 180 }, durationInFrames: TRANSITION_FRAMES })}
              />
            );
          }

          elements.push(
            <TransitionSeries.Sequence key={scene.id} durationInFrames={durationInFrames}>
              <AbsoluteFill>
                {/* Isi visual berada DI DALAM CameraRig */}
                <CameraRig
                  tempo="${tempo}"
                  styleTheme={scene.visualModule}
                  durationInFrames={durationInFrames}
                  sceneIndex={idx}
                  isHook={idx === 0 || scene.role === 'hook'}
                >
                  <SceneRenderer
                    scene={scene}
                    sceneIndex={idx}
                    totalScenes={scenes.length}
                    watermark="${watermark}"
                    tempo="${tempo}"
                    durationInFrames={durationInFrames}
                  />
                  <Sequence from={0} durationInFrames={Math.max(15, Math.round(durationInFrames * 0.35))} premountFor={fps}>
                    <Audio src={\`/sfx/\${scene.sfx.file || 'sfx_studio3d_whoosh.mp3'}\`} volume={scene.sfx.volume ?? 0.84} playbackRate={scene.sfx.playbackRate ?? 1.0} />
                  </Sequence>
                  <Sequence from={Math.max(6, Math.round(durationInFrames * 0.26))} durationInFrames={Math.max(15, Math.round(durationInFrames * 0.35))} premountFor={fps}>
                    <Audio src={\`/sfx/\${scene.sfx.beat2File || 'sfx_bento_card_slide.mp3'}\`} volume={(scene.sfx.volume ?? 0.84) * 0.78} playbackRate={scene.sfx.playbackRate ?? 1.0} />
                  </Sequence>
                  <Sequence from={Math.max(12, Math.round(durationInFrames * 0.52))} durationInFrames={Math.max(15, Math.round(durationInFrames * 0.35))} premountFor={fps}>
                    <Audio src={\`/sfx/\${scene.sfx.beat3File || 'sfx_hud_data_scan.mp3'}\`} volume={(scene.sfx.volume ?? 0.84) * 0.82} playbackRate={scene.sfx.playbackRate ?? 1.0} />
                  </Sequence>
                  <Sequence from={Math.max(18, Math.round(durationInFrames * 0.76))} durationInFrames={Math.max(15, Math.round(durationInFrames * 0.24))} premountFor={fps}>
                    <Audio src={\`/sfx/\${scene.sfx.beat4File || 'sfx_editorial_chime.mp3'}\`} volume={(scene.sfx.volume ?? 0.84) * 0.85} playbackRate={scene.sfx.playbackRate ?? 1.0} />
                  </Sequence>
                  {idx < scenes.length - 1 && (
                    <Sequence from={Math.max(0, durationInFrames - TRANSITION_FRAMES)} durationInFrames={TRANSITION_FRAMES} premountFor={fps}>
                      <Audio src={\`/sfx/\${scene.sfx.transitionFile || 'swish_transition.mp3'}\`} volume={0.68} playbackRate={scene.sfx.playbackRate ?? 1.0} />
                    </Sequence>
                  )}
                </CameraRig>

                {/* Caption wajib DI LUAR CameraRig agar tidak ikut zoom */}
                <EditorialSubtitleOverlay
                  text={scene.narration_text}
                  emphasisWords={scene.emphasis_words}
                  styleTheme={scene.visualModule}
                  subtitleStyle={SUBTITLE_STYLE}
                  durationInFrames={durationInFrames}
                  sceneIndex={idx}
                />
              </AbsoluteFill>
            </TransitionSeries.Sequence>
          );

          return elements;
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
`;

  const compositionTsx = `${commonHeaderTsx}
${mainCompositionBody}
${sharedOverlayTsx}
${renderDimension === '3d' ? true3DScenesTsx : creatorAndScenes2DTsx}
`;

  const overlapFrames = Math.max(0, scenesNormalized.length - 1) * 14;
  const netDurationFrames = Math.max(30, totalFrames - overlapFrames);

  const rootTsx = `// Remotion 4 Root entry oleh Graph Motion Studio (${renderDimension === '3d' ? '3D WebGL' : '2.5D Motion'})
// Simpan ke: src/Root.tsx

import React from 'react';
import { CalculateMetadataFunction, Composition } from 'remotion';
import {
  SatsetComposition,
  FPS,
  W,
  H,
  scenes,
  calcTotalFrames,
} from './SatsetComposition';

export const calculateMetadata: CalculateMetadataFunction<Record<string, unknown>> = () => {
  return {
    durationInFrames: calcTotalFrames(scenes, FPS),
    fps: FPS,
    width: W,
    height: H,
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SatsetMotionVideo"
        component={SatsetComposition}
        durationInFrames={${netDurationFrames}}
        fps={${fps}}
        width={${res.width}}
        height={${res.height}}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
`;

  const corePackages = '@remotion/transitions @remotion/google-fonts';
  const extraInstallNote =
    renderDimension === '3d'
      ? `\n2b. Instal paket animasi, font, transisi, dan 3D WebGL:\n   \`\`\`bash\n   npm i ${corePackages} @remotion/three three @react-three/fiber @types/three\n   \`\`\`\n`
      : `\n2b. Instal paket transisi & font Remotion 4:\n   \`\`\`bash\n   npm i ${corePackages}\n   \`\`\`\n`;

  const instructions = `# Panduan Render Remotion 4 (${renderDimension === '3d' ? '3D WebGL' : '2.5D Studio Motion'})

1. Pastikan Node.js v18+ terpasang.
2. Buat proyek Remotion baru (jika belum ada):
   \`\`\`bash
   npx create-video@latest my-satset-video
   \`\`\`
${extraInstallNote}
3. Masuk ke direktori proyek:
   \`\`\`bash
   cd my-satset-video
   \`\`\`

4. Salin kode komponen:
   - Simpan "SatsetComposition.tsx" ke "src/SatsetComposition.tsx".
   - Perbarui "src/Root.tsx" dengan kode tab "Root.tsx".

5. Jalankan preview interaktif:
   \`\`\`bash
   npx remotion preview
   \`\`\`

6. Render video akhir ke MP4:
   \`\`\`bash
   npx remotion render SatsetMotionVideo out/satset-video.mp4
   \`\`\`
`;

  const blueprintJson = JSON.stringify(
    {
      project_title: project.project_title || project.title || 'Proyek Satset Motion',
      render_dimension: renderDimension,
      aspect_ratio: project.aspect_ratio || '9:16',
      fps: fps,
      bgm_style: project.bgm_style || 'energetic_lofi',
      scenes: scenesNormalized.map((s) => ({
        scene_number: s.scene_number,
        role: s.role,
        target_duration_sec: s.target_duration_sec,
        narration_text: s.narration_text,
        on_screen_text: s.on_screen_text,
        visual_animation: s.visual_animation,
        sfx: s.sfx,
      })),
    },
    null,
    2
  );

  return { compositionTsx, rootTsx, instructions, blueprintJson };
}

const IDE_METAPHOR_POOL = [
  'kompas & arah',
  'parasut',
  'lalu lintas & lampu merah',
  'perjalanan & peta',
  'magnet & tarik-menarik',
  'baterai & pengisi daya',
  'kemudi kapal',
  'rem & gas sepeda',
  'termos & suhu',
  'timbangan pasar',
  'kacamata buram',
  'ransel pendaki',
  'ban serep',
  'jam pasir',
  'kamera & fokus lensa',
  'payung & hujan',
  'alarm pagi',
  'efek domino berderet',
  'resep masakan',
  'kompor & panci',
];

const IDE_HOOK_ANGLES = [
  'hook berupa tantangan langsung ke penonton',
  'hook berupa pengakuan jujur yang relatable',
  'hook berupa kalimat yang dibalik di akhir (plot twist)',
  'hook berupa angka atau fakta yang mengejutkan',
  'hook berupa mitos populer yang dipatahkan',
  'hook berupa pertanyaan menohok yang bikin tersindir',
  'hook berupa kebiasaan kecil sehari-hari yang sering luput',
  'hook berupa perbandingan dua pilihan yang kontras',
];

const IDE_TONE_POOL = [
  'nada tegas seperti pelatih',
  'nada serius tapi santai',
  'nada jenaka tapi ngena',
  'nada hangat seperti kakak',
  'nada tenang seperti ngobrol malam',
  'nada jujur seperti curhat teman',
];

function selectVariedIdeaIngredients(seedStr: string): string[] {
  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const startMeta = Math.abs(hash) % IDE_METAPHOR_POOL.length;
  const startHook = Math.abs(hash >> 3) % IDE_HOOK_ANGLES.length;
  const startTone = Math.abs(hash >> 7) % IDE_TONE_POOL.length;

  const lines: string[] = [];
  for (let i = 0; i < 5; i++) {
    const metaphor = IDE_METAPHOR_POOL[(startMeta + i * 3) % IDE_METAPHOR_POOL.length];
    const hook = IDE_HOOK_ANGLES[(startHook + i) % IDE_HOOK_ANGLES.length];
    const tone = IDE_TONE_POOL[(startTone + i) % IDE_TONE_POOL.length];
    lines.push(`${i + 1}. lensa metafora "${metaphor}" · ${hook} · ${tone}`);
  }
  return lines;
}

const SATSET_POSE_DICTIONARY =
  'stand - berdiri, wave - melambai, walk - berjalan, run - berlari, jump - melompat girang, cheer - bersorak, fist - kepalkan tangan ke atas, clap - bertepuk tangan, dance - berjoget, open - merentangkan tangan, point - menunjuk, reach - meraih ke atas, hold - memegang / menyodorkan sesuatu, phone* - main HP sambil menunduk, think - berpikir, shrug - angkat bahu, hips - tangan di pinggang, headache - memegang kepala, cover - menutup muka, scared - kaget / takut, shout - berteriak, sad - lesu, bow - membungkuk, pray - berdoa, sit - duduk, walksad - berjalan lesu, strut - berjalan percaya diri, tiptoe - mengendap-endap berjinjit, climb - memanjat, push - mendorong benda berat ke, pull - menarik tali sekuat tenaga, hammer* - memukul dengan palu, dig* - menggali dengan sekop, sweep* - menyapu, lift* - angkat barbel ke atas, carry* - berjalan membawa kardus, read* - membaca buku, write* - mencatat di papan jalan, drink* - minum dari gelas, throw* - melempar bola, kick - menendang ke depan, punch - meninju bergantian, catch - menangkap sesuatu dari atas, nod - mengangguk setuju, stop - tangan ke depan, salute - hormat, thumbs - acungkan jempol, crossarms - melipat tangan di dada, chest - tangan di dada, listen - tangan di telinga, look - tangan di atas mata, hush - telunjuk di mulut, whisper - berbisik, handshake - mengulurkan tangan, give* - menyerahkan kado, receive - menadahkan dua tangan, idea - telunjuk ke atas, explain - menjelaskan dengan dua tangan, present - menunjuk ke papan atau, angry - marah, laugh - tertawa, sigh - menghela napas, tired - kelelahan, facepalm - menepuk dahi, flex - pamer otot, proud - bangga, wipe - mengusap keringat di dahi, yawn - menguap, stretch - peregangan, nervous - gugup, crouch - jongkok, kneel - berlutut satu kaki, sitthink - duduk sambil berpikir, sitsad - duduk sedih, sleep - tertidur sambil duduk, lie - tidur berbaring telentang di, liethink - berbaring melamun / tidak, sittype* - duduk mengetik di laptop, ride - naik motor atau sepeda, behind - tangan bertaut di belakang, skyward - menatap ke langit, pockets - tangan di saku, laptop* - duduk menghadap depan sambil, you - menunjuk ke penonton, love - tangan membentuk hati di, selfhug - memeluk diri sendiri, hot - kepanasan, music - menikmati musik, yes - tinju ditarik ke bawah, gasp - kaget, beckon - memanggil dengan tangan, count - menghitung dengan jari, okay - tanda OK dengan jari, peace - tanda damai, pointdown - menunjuk ke bawah, scratch - menggaruk kepala, invite - mempersilakan, watch - melihat jam tangan, call* - menelepon, selfie* - swafoto, camera* - memotret, cash* - menghitung uang, eat* - makan pakai sendok, stir* - mengaduk panci, paint* - mengecat dinding dengan roller, water* - menyiram tanaman, fish* - memancing, guitar* - main gitar, speech* - pidato pakai mikrofon, drive* - menyetir mobil, shop* - berjalan menenteng belanjaan, umbrella* - memegang payung, inspect* - memeriksa dengan kaca pembesar, board* - menulis di papan, knock - mengetuk pintu, pickup - memungut sesuatu dari lantai, skip* - lompat tali, jumpingjack - lompat bintang, squat - squat olahraga, balance - berdiri satu kaki, march - berjalan baris-berbaris, sidebend - peregangan menyamping, golf* - bersiap memukul bola golf, curl* - angkat dumbel, highfive - tos, dab - gaya dab, stomp - menghentak kaki, lean - bersandar santai, takbir - takbir, ruku - rukuk, sujud - sujud, tahiyat - duduk tahiyat, meditate - duduk bersila (* = bendanya digambar otomatis).';

const TRUNCATION_GUARD_HEADER =
  '(Perintah ini panjang dan diakhiri baris "=== AKHIR PERINTAH ===". Kalau baris itu TIDAK ada di bagian paling akhir, berarti perintahnya terpotong saat ditempel: jangan kerjakan apa pun, jawab hanya dengan kalimat "PERINTAH TERPOTONG".)';

function ensureAkhirPerintah(prompt: string): string {
  let trimmed = prompt.trim();
  if (!trimmed.startsWith('(Perintah ini panjang dan diakhiri baris "=== AKHIR PERINTAH ==="')) {
    trimmed = `${TRUNCATION_GUARD_HEADER}\n\n${trimmed}`;
  }
  if (!trimmed.endsWith('=== AKHIR PERINTAH ===')) {
    trimmed = `${trimmed}\n\n=== AKHIR PERINTAH ===`;
  }
  return trimmed;
}

/**
 * Builds the exact dynamic prompt blueprint for Claude / Gemini / ChatGPT
 * driven by all current studio settings (`prompt buat ide.md`).
 */
export function buildPromptBlueprint(project: Partial<SatsetProject>): string {
  // If user is in 'promo' or 'script' start mode, Step 1 directly builds the scene narrative blueprint
  if (project.start_mode === 'promo' || project.start_mode === 'script') {
    return buildNarasiPrompt(project);
  }

  const topic =
    (project.topik_video || project.topic || '').trim() || 'disiplin, fokus, kebiasaan harian';
  const jenisMap: Record<string, string> = {
    motivasi: 'motivasi',
    edukasi: 'edukasi & penjelasan',
    promosi: 'promosi produk',
    storytelling: 'storytelling',
    tips: 'tips praktis',
  };
  const jenis = jenisMap[project.content_type || 'motivasi'] || project.content_type || 'motivasi';
  const bahasa =
    project.language === 'en'
      ? 'Bahasa Inggris'
      : project.language === 'jv'
      ? 'Bahasa Jawa'
      : 'Bahasa Indonesia';

  const isAutoDuration = project.duration_mode === 'auto';
  const durasiSec = Number(project.target_duration_sec || project.durationSeconds || 60);
  const durasiRange = isAutoDuration
    ? 'otomatis menyesuaikan konsep dan kedalaman narasi (tanpa batas waktu kaku)'
    : durasiSec >= 55
    ? '45-60 detik'
    : durasiSec >= 35
    ? '30-45 detik'
    : `${Math.max(15, durasiSec - 5)}-${durasiSec} detik`;
  const durasiLabel = isAutoDuration
    ? 'Otomatis sesuai konsep & alur narasi (bebas tanpa batas detik kaku)'
    : durasiSec >= 60
    ? `${Math.round((durasiSec / 60) * 10) / 10} mnt`
    : `${durasiSec} detik`;

  const gayaRaw = project.gaya_video || project.styleModule || 'scribble3d';
  const isAutoStyle = gayaRaw === 'otomatis';
  const autoResolved = isAutoStyle ? resolveAutoStyleForConceptAndScene(project) : null;
  const effectiveGaya = autoResolved ? autoResolved.styleId : gayaRaw;
  const resolvedStyleId = resolveSatsetStyleId(effectiveGaya);
  const styleDef = getSatsetStyleDef(resolvedStyleId, 'crayon');
  const modInfo = SATSET_MODULES.find(
    (m) => m.id === effectiveGaya || resolveSatsetStyleId(m.id) === resolvedStyleId
  );

  const styleLabel = isAutoStyle
    ? 'Otomatis (Menyesuaikan Konsep Bahasan)'
    : styleDef?.label || modInfo?.title || (effectiveGaya === 'scribble3d' ? 'Scribble 3D' : 'Motion Graphics');
  const styleHint = isAutoStyle
    ? 'gaya visual otomatis menyesuaikan konsep dan topik apa yang sedang dibahas pada masing-masing ide/adegan'
    : styleDef?.hint ||
      modInfo?.description ||
      'scribble 3D: objek 3D low-poly, arsiran coretan, latar cerah bertitik';
  const styleDirection = isAutoStyle
    ? 'Pilih dan sesuaikan gaya visual terbaik secara otomatis mengikuti konsep, suasana, dan topik yang sedang dibahas (misalnya 3D Diorama untuk data/ekonomi, Editorial/Infografis untuk strategi, Sinematik/Kertas untuk cerita, atau kapur/ilustrasi untuk penjelasan konsep).'
    : styleDef?.direction ||
      modInfo?.description ||
      `Ilustrasi ${styleLabel} (${styleHint}) dengan komposisi fokus, objek nyata berlapis, dan gerak deterministik yang halus.`;

  const tempoDesc =
    project.tempo === 'santai'
      ? 'Nuansa: santai dan berbobot, mengalir alami, transisi halus, nada ramah dan hangat.'
      : 'Nuansa: energik dan membakar semangat, ritme cepat, potongan scene pendek, banyak gerakan.';

  const charRaw = project.character || 'auto';
  const charMode = resolveCharacterOption(charRaw);
  const charMeta = getCharacterMeta(charMode, project.custom_character);
  const hasFixedChar = charMode !== 'none' && charMode !== 'auto';

  const characterStatusBlock =
    charMode === 'none'
      ? `Video dipilih TANPA TOKOH UTAMA: utamakan visualisasi benda nyata, simbol, angka, atau metafora. Jika ada scene yang benar-benar menyebut orang lain sebagai pemeran sampingan, ikuti aturan \`who\` di bawah.`
      : hasFixedChar
      ? `Tokoh utama terpilih: "${charMeta.name}" (${charMeta.description}). Saat tokoh utama tampil, engine otomatis merakit rupanya dari Character Builder (tetap WAJIB faceless tanpa wajah). Untuk pemeran lain selain tokoh utama, ikuti aturan \`who\` di bawah.`
      : `Belum ada tokoh tetap: semua orang dirakit engine dari Character Builder (lihat aturan \`who\` di bawah).`;

  const hasBrandCustom =
    project.brand_mode === 'custom' ||
    Boolean(project.warna_brand && project.warna_brand !== 'auto');
  const primaryHex = hasBrandCustom && project.warna_brand
    ? project.warna_brand
    : styleDef?.colors?.[0] || '#ff6a13';
  const secondaryHex =
    (hasBrandCustom && project.brand_secondary_color) ||
    styleDef?.colors?.[1] ||
    '#1e3a8a';
  const accentHex =
    (hasBrandCustom && project.brand_accent_color) ||
    styleDef?.colors?.[2] ||
    '#ffc93c';

  const bahanList = selectVariedIdeaIngredients(
    `${topic}|${jenis}|${resolvedStyleId}|${durasiSec}|${project.tempo || 'energik'}`
  ).join('\n');

  const previousIdeasBlock =
    Array.isArray(project.idea_concepts) && project.idea_concepts.length > 0
      ? `\n## Sudah pernah dipakai - JANGAN diulang atau dimiripkan (judul, metafora, maupun hook)\n${project.idea_concepts
          .map((c) => `- "${c.title}" — ${c.hook || c.hookProposal || ''}`)
          .join('\n')}\n`
      : '';

  const rawUrl = (project as any).source_url as string | undefined;
  const detectedUrl = extractWebsiteUrl(rawUrl || topic);
  const webProfile = detectedUrl
    ? project.website_promo || buildWebsitePromoProfile(detectedUrl)
    : undefined;
  const sourceExtra = webProfile
    ? `\nTarget Website Promosi Otomatis: ${webProfile.url} (${webProfile.brandName} — ${webProfile.tagline}).\nRingkasan Hero Website: ${webProfile.description}\nMetrik Utama Website: ${webProfile.metrics.map((m) => `${m.label}: ${m.value}`).join(' · ')}\nAlur Langkah Website: ${webProfile.steps.map((s) => `[${s.stepBadge}] ${s.title}: ${s.subtitle}`).join(' -> ')}`
    : project.start_mode === 'url' && rawUrl
    ? `\nURL / artikel referensi: ${rawUrl}`
    : '';

  const basePrompt = `Kamu adalah penulis konten video pendek ${jenis} berbahasa ${bahasa} (TikTok, Reels, Shorts, Threads) yang terkenal karena idenya selalu segar dan tidak pasaran.
Gaya video: ${styleLabel} (${styleHint}). ${tempoDesc} Durasi ${durasiRange}.
Gaya animasi "${styleLabel}": KARTU GAYA (hanya cara menggambar; isi gambar SELALU dari narasi). ${styleDirection} (Apa pun gayanya, setiap orang/tokoh WAJIB faceless: tanpa mata, alis, hidung, mulut, atau ekspresi wajah.)
Tokoh TIDAK wajib ada di setiap scene. Tampilkan orang hanya kalau teks scene memang membicarakan orang (aku, kamu, dia, teman, keluarga, pembeli); scene tentang benda, angka, konsep, tempat, waktu, atau metafora cukup dengan bendanya saja. Biasanya sepertiga sampai separuh scene memakai orang.
${characterStatusBlock}
PENTING, supaya tiap orang SAMA di semua scene: engine merakit SEMUA orang selain tokoh utama dari Character Builder dan MENGUNCI rupanya (wajah, rambut, kulit, baju) dari \`who\`. Jadi setiap orang selain narator WAJIB diberi \`who\` (lihat baris "Pemeran" tiap scene: pakai kata itu PERSIS, mis. \`who: "ayah"\`, \`who: "kakak"\`) dan \`build\` ("male"/"female", sama di setiap scene), dan JANGAN beri opsi rupa: hair, hairColor, skin, body, glasses, shirt, pants, jacket, shoes. Tulis cukup \`s.person(x, y, { who: "ayah", build: "male", size, pose, facing })\`. Opsi rupa yang kamu tulis untuk orang ber-\`who\` diabaikan engine, dan orang TANPA \`who\` bisa berganti rupa antar scene. Hanya orang asing yang muncul sekali (penjual, kurir, orang lewat) boleh tanpa \`who\`; beri \`role\` kalau profesinya jelas. Narator ("aku") juga diberi \`who: "aku"\` dan \`build\`.
Pakaian religius (peci, baju koko, hijab, khimar, cadar) HANYA untuk orang yang konteksnya religius atau memang digambarkan begitu, dan TIDAK PERNAH untuk orang yang berperan negatif: yang bersalah, penipu, pencuri, pemalas, yang dimarahi atau diejek, pelaku kesalahan.
Pakaian mengikuti peran & konteks, bukan kebiasaan. Contoh: orang yang berutang = kaos kusut & celana pendek; penagih = kemeja rapi atau jaket; pekerja kantoran = kemeja + dasi; anak muda = hoodie/kaos.
Pilih pose yang paling pas dengan emosi kalimatnya dan variasikan antar scene (jangan berdiri/melambai terus): ${SATSET_POSE_DICTIONARY}
Palet warna BRAND (wajib): utama ${primaryHex}, kedua ${secondaryHex}, aksen ${accentHex}. Di kode tersedia sebagai \`s.c.brand1\`, \`s.c.brand2\`, \`s.c.brand3\` (warna palet \`s.c.orange/red/pink\`, \`s.c.teal/blue/navy/sky/green/purple\`, dan \`s.c.yellow\` juga otomatis menjadi turunan warna brand). Sekitar 80% warna objek harus dari palet brand (boleh versi lebih terang/gelapnya); sisanya hanya netral (putih, abu, hitam, cokelat). JANGAN menulis warna hex lain untuk objek. Palet ini mengalahkan warna yang disebut gaya.

Saat diminta ide:
- Setiap ide punya pesan yang jelas. Harus bisa divisualkan dengan benda nyata yang mudah dikenali atau sosok orang tanpa wajah (siluet berpakaian).
- "visualStyle" ditulis lengkap dengan formula: [gaya] + [pencahayaan/suasana] + [palet warna] + [komposisi/kamera] + [metafora utama]. Contoh: "isometrik pastel, cahaya pagi lembut, mint dan peach, sudut atas 45 derajat, rak buku yang tersusun".
- Hook harus menohok dan bikin berhenti scroll dalam 1 detik pertama, bukan klise kosong.
- HINDARI metafora dan kalimat pasaran: tangga kesuksesan, tetesan air melubangi batu, kepompong jadi kupu-kupu, pohon dari biji kecil, gunung es, kunci & pintu terkunci, "proses tidak mengkhianati hasil", "1% setiap hari". Kalau memakai benda umum, beri sudut yang tak terduga.
- Setiap ide harus berbeda jelas satu sama lain: beda pesan, beda metafora, beda jenis hook.
- ${bahasa} yang natural untuk anak muda, tidak alay. Judul, hook, dan pesan inti ditulis dengan kata-kata sederhana.
Bahasa SEDERHANA, harus langsung dipahami sekali dengar oleh siapa saja (anak SMP sampai orang tua):
- Pakai kata sehari-hari yang biasa diucapkan di obrolan. JANGAN pakai kata tinggi/serapan/akademis: esensi, eksistensi, paradigma, manifestasi, resiliensi, validasi, ekspektasi, transformasi, signifikan, fundamental, kontemplasi, hakikat, entitas, persepsi, narasi, fase, momentum, versi terbaik, potensi, makna hidup. Ganti dengan kata biasa (mis. "ekspektasi" -> "harapan", "konsisten" -> "terus-terusan", "validasi" -> "pengakuan orang").
- JANGAN puitis, filosofis, atau berbunga-bunga ("jiwa yang lelah", "langkah kecil menuju cahaya", "dirimu yang sejati"). Katakan maksudnya langsung.
- Satu kalimat satu maksud, pendek, susunan biasa (subjek-kata kerja-objek). Hindari kalimat bertingkat dan kiasan di dalam kiasan.
- Metafora boleh, tapi bendanya sehari-hari dan artinya langsung dijelaskan dengan kata biasa; penonton tidak boleh harus mikir untuk paham.

## Tugas
Buat 5 ide video pendek ${jenis}.
Topik / kata kunci: ${topic}. Dekati topik ini dari sudut yang berbeda di setiap ide.${sourceExtra}

Durasi video: ${durasiLabel}. Tiap ide harus punya bahan yang pas untuk durasi itu: video panjang butuh beberapa poin, contoh, atau alur cerita; video pendek cukup satu gagasan yang tajam.

Bahan wajib per ide (ide ke-n memakai baris ke-n; boleh ditafsirkan kreatif, tapi jangan diganti):
${bahanList}
${previousIdeasBlock}
## Hook thumbnail ("hook")
Judul cover di setengah detik pertama video, di atas gambar adegan. Tugasnya satu: bikin orang BERHENTI scroll dalam sekali lirik. Tiga bagian yang dibaca berurutan jadi satu kalimat utuh: "atas" 2-4 kata pembuka, "besar" 1-3 kata yang jadi pukulannya, "bawah" 3-6 kata penutup yang membuka rasa penasaran. Format ditulis dengan garis miring pemisah: "ATAS / BESAR / BAWAH".
Cara bikin yang nendang:
- Buka CELAH PENASARAN: sebut kejadian atau fakta yang janggal, tapi sembunyikan jawabannya ("...dan aku baru tahu kenapa", "...ternyata bukan karena malas").
- Spesifik dan konkret mengalahkan umum: angka, waktu, benda, orang dekat (ayah, ibu, kakak, sahabat, bos). "3 TAHUN", "TIAP SUBUH", "UANG 5 RIBU" lebih kuat daripada "lama" atau "sedikit".
- Ada taruhan perasaan atau kontras: rahasia, kebohongan baik, pengorbanan diam-diam, kebiasaan kecil yang mengubah hidup, kesalahan yang hampir semua orang lakukan.
- "besar" = kata PALING mengejutkan dari kalimatnya, bukan kata sambung.
- Untuk motivasi/tips/fakta polanya sama: kontradiksi atau angka yang bikin kaget ("BERHENTI NGEJAR / PRODUKTIF / malah bikin kerjaan beres", "CUMA / 2 MENIT / tiap pagi, hasilnya kerasa sebulan").
DILARANG: kata kosong ("Kisah Inspiratif", "Wajib Tonton", "Bikin Nangis", "Viral"), tanda seru berderet, emoji, membocorkan akhir cerita, janji palsu yang tidak ada di video, dan menyalin judul video orang lain. Bahasa ngobrol sehari-hari, total maksimal 12 kata.
"scene" = nomor scene (mulai 1) yang gambarnya paling menggambarkan suasana ceritanya untuk latar cover (lebih baik adegan dengan tokoh dan tempat kejadiannya, bukan penutup).

## Format jawaban
Jawab HANYA dengan satu blok kode \`\`\`json berisi:
{
  "ideas": [
    {
      "title": "judul singkat",
      "hook": "kalimat pembuka yang bikin berhenti scroll",
      "angle": "pesan inti 1-2 kalimat",
      "visualStyle": "gaya + pencahayaan + palet + komposisi + metafora utama"
    }
  ]
}
Jangan gunakan artifact/canvas dan jangan menambahkan penjelasan di luar format yang diminta.`;

  return ensureAkhirPerintah(enrichPromptWithMedia(basePrompt, collectProjectPromptImages(project)));
}

/**
 * Builds the exact narrative prompt blueprint for Claude / Gemini / ChatGPT
 * conforming to satsetmotion.id guidelines and user prompt specification (`prompt narasi naskah.md`).
 */
export function buildNarasiPrompt(project: Partial<SatsetProject>, creatorNote?: string): string {
  const isAutoDuration = project.duration_mode === 'auto';
  const durasiSec = Number(project.target_duration_sec || project.durationSeconds || 60);
  const tempo = project.tempo || 'energik';
  const explicitScenes = Number(project.scene_count || 0);
  const targetScenes =
    explicitScenes >= 4 && explicitScenes <= 25
      ? explicitScenes
      : durasiSec >= 90
      ? Math.min(18, Math.round(durasiSec / 7.5))
      : durasiSec >= 60
      ? 8
      : durasiSec >= 50
      ? 6
      : durasiSec >= 40
      ? 5
      : 4;
  const secPerScene = durasiSec / targetScenes;
  const avgSec = secPerScene.toFixed(1).replace('.0', '');
  const minSceneDurStr = Math.max(2.5, secPerScene - 1.5).toFixed(1).replace('.0', '');
  const maxSceneDurStr = (secPerScene + 1.5).toFixed(1).replace('.0', '');

  // Calibrated to actual Indonesian Voice Over speaking rate
  const wordsPerSec = tempo === 'santai' ? 2.25 : 2.8;
  const speechWindowPerScene = Math.max(2.2, secPerScene - (tempo === 'santai' ? 0.42 : 0.32));
  const wordsPerSceneTarget = Math.max(8, Math.round(speechWindowPerScene * wordsPerSec));
  const minWordsPerScene = durasiSec >= 60 && targetScenes === 8 ? 18 : Math.max(7, wordsPerSceneTarget - 3);
  const maxWordsPerScene = durasiSec >= 60 && targetScenes === 8 ? 23 : wordsPerSceneTarget + 4;
  const estimatedWords = Math.round(targetScenes * wordsPerSceneTarget);
  const minTotalWords = durasiSec >= 60 && targetScenes === 8 ? 144 : Math.round(estimatedWords * 0.85);
  const maxTotalWords = Math.round(estimatedWords * 1.15);
  const durasiRange = isAutoDuration
    ? '45-60 detik'
    : durasiSec >= 55
    ? '45-60 detik'
    : durasiSec >= 35
    ? '30-45 detik'
    : `${Math.max(15, durasiSec - 5)}-${durasiSec} detik`;
  const durasiLabel = isAutoDuration
    ? '1 mnt'
    : durasiSec >= 60
    ? `${Math.round((durasiSec / 60) * 10) / 10} mnt`
    : `${durasiSec} dtk`;

  const selectedIdea =
    project.idea_concepts?.find((c) => c.id === project.selected_idea_id) ||
    project.idea_concepts?.[0] || {
      id: 'c-1',
      title: project.project_title || project.title || 'Kenapa Pagi Terasa Berat?',
      hook: 'KATANYA ORANG SUKSES / BANGUN PAGI / PADAHAL ADA YANG SALAH',
      hookProposal: 'KATANYA ORANG SUKSES / BANGUN PAGI / PADAHAL ADA YANG SALAH',
      angle:
        'Banyak orang mengira rasa malas pagi hilang kalau kita menunggu semangat datang. Itu keliru. Semangat bukan syarat untuk mulai bergerak. Bayangkan tubuhmu seperti benda yang ditarik dua magnet.',
      visualStyle:
        'Diorama Data 3D, cahaya matahari pagi cerah, rumput mint dengan aksen koral dan emas, satu papan miniatur rumah dengan tempat tidur di satu sisi dan meja kerja di sisi lain.',
    };

  const gayaRaw = project.gaya_video || project.styleModule || 'scribble3d';
  const isAutoStyle = gayaRaw === 'otomatis';
  const autoResolved = isAutoStyle ? resolveAutoStyleForConceptAndScene(project) : null;
  const effectiveGaya = autoResolved ? autoResolved.styleId : gayaRaw;
  const resolvedStyleId = resolveSatsetStyleId(effectiveGaya);
  const styleDef = getSatsetStyleDef(resolvedStyleId, 'crayon');
  const modInfo = SATSET_MODULES.find(
    (m) => m.id === effectiveGaya || resolveSatsetStyleId(m.id) === resolvedStyleId
  );
  const isDiorama = !isAutoStyle && resolvedStyleId === 'diorama';
  const aspectRatio = project.aspect_ratio || '9:16';
  const ratioLabel =
    aspectRatio === '16:9'
      ? 'lanskap 16:9'
      : aspectRatio === '1:1'
      ? 'persegi 1:1'
      : aspectRatio === '3:4'
      ? 'potret 3:4'
      : 'vertikal 9:16';

  const charMode = resolveCharacterOption(project.character || 'auto');
  const charMeta = getCharacterMeta(charMode, project.custom_character);
  const hasFixedChar = charMode !== 'none' && charMode !== 'auto';

  const characterStatusBlock =
    charMode === 'none'
      ? `Video dipilih TANPA KARAKTER / TANPA TOKOH UTAMA: utamakan visualisasi benda nyata, simbol, angka, atau metafora. Jika ada scene yang benar-benar menyebut orang lain sebagai pemeran sampingan, ikuti aturan \`who\` di bawah.`
      : hasFixedChar
      ? `Tokoh utama terpilih: "${charMeta.name}" (${charMeta.description}). Saat tokoh utama tampil, engine otomatis merakit rupanya dari Character Builder (tetap WAJIB faceless tanpa wajah). Untuk pemeran lain selain tokoh utama, ikuti aturan \`who\` di bawah.`
      : `Belum ada tokoh tetap: semua orang dirakit engine dari Character Builder (lihat aturan \`who\` di bawah).`;

  const gayaTitle = isAutoStyle
    ? 'Otomatis (Menyesuaikan Konsep Bahasan)'
    : styleDef?.label || modInfo?.title || (isDiorama ? 'Diorama Data' : 'Scribble 3D');
  const gayaSubtitle = isAutoStyle
    ? 'gaya visual otomatis menyesuaikan dengan konsep dan topik apa yang sedang dibahas di setiap scene'
    : styleDef?.hint || modInfo?.subtitle || 'scribble 3D: objek 3D low-poly, arsiran coretan, latar cerah bertitik';
  const activeStyleSpec = isAutoStyle
    ? 'OTOMATIS SESUAI KONSEP: sesuaikan gaya visual di setiap bagian dengan konsep apa yang sedang dibahas pada narasi (tidak dikunci ke satu gaya kaku).'
    : isDiorama
    ? `${styleDef?.direction || modInfo?.description || ''} DIORAMA DATA: seluruh video terjadi di SATU papan miniatur isometrik yang saling menyambung antar scene, dan seluruh objek WAJIB 3D SUNGGUHAN (\`s.isoBox\`, \`s.isoCylinder\`, \`s.box\`).`.trim()
    : styleDef?.direction ||
      modInfo?.description ||
      `KARTU GAYA (hanya cara menggambar; isi gambar SELALU dari narasi). ${gayaTitle}: ${gayaSubtitle}.`;

  const hasBrandCustom =
    project.brand_mode === 'custom' ||
    Boolean(project.warna_brand && project.warna_brand !== 'auto');
  const primaryHex = hasBrandCustom && project.warna_brand
    ? project.warna_brand
    : styleDef?.colors?.[0] || '#ff6a13';
  const secondaryHex =
    (hasBrandCustom && project.brand_secondary_color) ||
    styleDef?.colors?.[1] ||
    '#1e3a8a';
  const accentHex =
    (hasBrandCustom && project.brand_accent_color) ||
    styleDef?.colors?.[2] ||
    '#ffc93c';

  const jenisMap: Record<string, string> = {
    motivasi: 'motivasi',
    edukasi: 'edukasi & penjelasan',
    promosi: 'promosi produk / jasa',
    storytelling: 'storytelling',
    tips: 'tips praktis',
  };
  const jenis =
    project.start_mode === 'promo'
      ? 'promosi produk / jasa'
      : jenisMap[project.content_type || 'motivasi'] || project.content_type || 'motivasi';

  const note = (creatorNote || project.creator_note || '').trim();
  const visualStyleLine = selectedIdea.visualStyle || `${gayaTitle}, ${gayaSubtitle}`;
  const rawScriptInput = (project.source_script || project.custom_narration || '').trim();

  // Build Task & Context section based on start_mode ('promo', 'script', or 'topic' selected idea)
  let contextAndTaskBlock = '';
  if (project.start_mode === 'promo') {
    const prodName = (project.promo_product_name || project.topik_video || 'Produk Unggulan').trim();
    const prodBenefits = (project.promo_benefits || 'Membantu menyelesaikan masalah lebih cepat, praktis, dan hemat biaya').trim();
    const prodPrice = (project.promo_price || '').trim();
    const prodCta = (project.promo_cta || 'Klik link di bio untuk coba sekarang').trim();
    contextAndTaskBlock = `## Data Promosi Produk / Jasa
- Nama produk / jasa: ${prodName}
- Keunggulan & manfaat utama: ${prodBenefits}
${prodPrice ? `- Harga / promo spesial: ${prodPrice}\n` : ''}- Ajakan (CTA) penutup: ${prodCta}
- Gaya visual: ${visualStyleLine}

## Tugas
Tulis naskah video promosi yang persuasif dan tidak terasa seperti iklan membosankan sebanyak ${targetScenes} scene (alur: hook masalah nyata penonton -> kenapa cara lama ribet -> kenalkan "${prodName}" + manfaat utamanya -> bukti/keunggulan${prodPrice ? ` + promo "${prodPrice}"` : ''} -> ajakan "${prodCta}").
Durasi target: ${durasiLabel} -> ${targetScenes} scene, rata-rata ~${avgSec} detik per scene, total sekitar ${estimatedWords} kata (${minTotalWords}-${maxTotalWords} kata).`;
  } else if (project.start_mode === 'script' && rawScriptInput) {
    const rawScript = rawScriptInput;
    const polishMode = project.script_polish_mode || 'rapikan';
    const allowAddWords = project.script_allow_add_words !== false;
    contextAndTaskBlock = `## Naskah dari Kreator
"""
${rawScript}
"""
- Mode pengolahan naskah: ${
      polishMode === 'persis' || polishMode === 'exact'
        ? 'PERSIS NASKAHKU — pertahankan kalimat asli kreator semirip mungkin, hanya bagi menjadi bagian per scene yang pas.'
        : 'RAPIKAN DENGAN AI — perhalus kalimat agar enak diucapkan secara lisan, hook lebih tajam, dan alur antar-scene mengalir.'
    }
- Tambah kata otomatis: ${
      allowAddWords
        ? `AKTIF — jika naskah kreator kurang panjang untuk ${targetScenes} scene (~${estimatedWords} kata), kembangkan contoh dan penjelasannya secara alami agar pas dengan durasi ${durasiLabel}.`
        : 'NONAKTIF — jangan menambah gagasan baru di luar naskah kreator.'
    }

## Tugas
Bagi dan susun naskah di atas menjadi ${targetScenes} scene lengkap dengan arahan visual per scene.
Durasi target: ${durasiLabel} -> ${targetScenes} scene, rata-rata ~${avgSec} detik per scene.`;
  } else {
    contextAndTaskBlock = `## Ide terpilih
- Judul: ${selectedIdea.title}
- Hook: ${selectedIdea.hook || selectedIdea.hookProposal}
- Pesan: ${selectedIdea.angle}
- Gaya visual: ${visualStyleLine}

## Tugas
Tulis narasi sebanyak ${targetScenes} scene.

## Panjang video (aturan ini MENANG atas aturan panjang teks per scene di atas)
Video ini PANJANG (${durasiLabel}):
- Target: ${targetScenes} scene, rata-rata ~${avgSec} detik per scene, total sekitar ${estimatedWords} kata (${minTotalWords}-${maxTotalWords} kata).
- Tiap scene WAJIB berisi kalimat utuh (${minWordsPerScene}-${maxWordsPerScene} kata).
- Susun seperti cerita atau penjelasan bertahap: hook kuat di scene pertama, lalu beberapa bagian yang mengalir (masalah -> contoh nyata -> titik balik -> langkah praktis -> ajakan penutup), dengan kalimat penghubung antar-scene. Jangan mengulang ide yang sama untuk mengisi waktu; tambahkan contoh konkret, situasi sehari-hari, atau langkah detail.
- "visual" tiap scene tetap satu adegan yang jelas, tapi berkembang dalam beberapa tahap sepanjang ~${avgSec} detik (objek muncul, detail menyusul, ada perubahan/puncak), sesuai kalimat yang sedang diucapkan.
- Isi "duration" tiap scene sekitar ${avgSec} detik (boleh bervariasi ${minSceneDurStr}-${maxSceneDurStr} detik mengikuti panjang teksnya) supaya jumlah "duration" semua scene mendekati ${durasiSec} detik.
- Cek ulang sebelum menjawab: hitung perkiraan kata di semua "text", pastikan totalnya MINIMAL ${minTotalWords} kata.`;
  }

  const baseNarasi = `Kamu adalah penulis naskah video pendek ${jenis} berbahasa Indonesia (TikTok, Reels, Shorts, Threads) yang terkenal karena idenya selalu segar dan tidak pasaran.
Gaya video: ${gayaTitle} (${gayaSubtitle}). Nuansa: ${
    tempo === 'santai'
      ? 'santai dan berbobot, mengalir alami, transisi halus, nada ramah dan hangat'
      : 'energik dan membakar semangat, ritme cepat, potongan scene pendek, banyak gerakan'
  }. Durasi ${durasiRange}.
Gaya animasi "${gayaTitle}": ${activeStyleSpec} (Apa pun gayanya, setiap orang/tokoh WAJIB faceless: tanpa mata, alis, hidung, mulut, atau ekspresi wajah.)
Tokoh TIDAK wajib ada di setiap scene. Tampilkan orang hanya kalau teks scene memang membicarakan orang (aku, kamu, dia, teman, keluarga, pembeli); scene tentang benda, angka, konsep, tempat, waktu, atau metafora cukup dengan bendanya saja. Biasanya sepertiga sampai separuh scene memakai orang.
${characterStatusBlock}
PENTING, supaya tiap orang SAMA di semua scene: engine merakit SEMUA orang selain tokoh utama dari Character Builder dan MENGUNCI rupanya (wajah, rambut, kulit, baju) dari \`who\`. Jadi setiap orang selain narator WAJIB diberi \`who\` (lihat baris "Pemeran" tiap scene: pakai kata itu PERSIS, mis. \`who: "ayah"\`, \`who: "kakak"\`) dan \`build\` ("male"/"female", sama di setiap scene), dan JANGAN beri opsi rupa: hair, hairColor, skin, body, glasses, shirt, pants, jacket, shoes. Tulis cukup \`s.person(x, y, { who: "ayah", build: "male", size, pose, facing })\`. Opsi rupa yang kamu tulis untuk orang ber-\`who\` diabaikan engine, dan orang TANPA \`who\` bisa berganti rupa antar scene. Hanya orang asing yang muncul sekali (penjual, kurir, orang lewat) boleh tanpa \`who\`; beri \`role\` kalau profesinya jelas. Narator ("aku") juga diberi \`who: "aku"\` dan \`build\`.
Pakaian religius (peci, baju koko, hijab, khimar, cadar) HANYA untuk orang yang konteksnya religius atau memang digambarkan begitu, dan TIDAK PERNAH untuk orang yang berperan negatif: yang bersalah, penipu, pencuri, pemalas, yang dimarahi atau diejek, pelaku kesalahan.
Pakaian mengikuti peran & konteks, bukan kebiasaan. Contoh: orang yang berutang = kaos kusut & celana pendek; penagih = kemeja rapi atau jaket; pekerja kantoran = kemeja + dasi; anak muda = hoodie/kaos.
Pilih pose yang paling pas dengan emosi kalimatnya dan variasikan antar scene (jangan berdiri/melambai terus): ${SATSET_POSE_DICTIONARY}
Palet warna BRAND (wajib): utama ${primaryHex}, kedua ${secondaryHex}, aksen ${accentHex}. Di kode tersedia sebagai \`s.c.brand1\`, \`s.c.brand2\`, \`s.c.brand3\` (warna palet \`s.c.orange/red/pink\`, \`s.c.teal/blue/navy/sky/green/purple\`, dan \`s.c.yellow\` juga otomatis menjadi turunan warna brand). Sekitar 80% warna objek harus dari palet brand (boleh versi lebih terang/gelapnya); sisanya hanya netral (putih, abu, hitam, cokelat). JANGAN menulis warna hex lain untuk objek. Palet ini mengalahkan warna yang disebut gaya.
Kalau ada arahan gaya dari kreator, tulis setiap "visual" dan pilih "theme" mengikuti arahan itu.

Ubah ide yang dipilih menjadi narasi scene per scene.

## Cara menulis narasi (paling penting)
Tulis seperti orang yang NGOMONG LANGSGUNG ke temannya, bukan seperti poster kata-kata mutiara. Bayangkan seluruh narasi dibaca sekali jalan tanpa melihat layar: harus terdengar seperti satu cerita utuh yang mengalir, jelas maksudnya, dan enak didengar.
- Tulis dulu narasinya sebagai satu monolog utuh di kepala, baru dipotong per scene di jeda napas yang wajar. Scene boleh berisi 1-2 kalimat yang mengalir ke scene berikutnya.
- Panjang teks per scene bervariasi alami: ada yang singkat dan nendang (5-8 kata) untuk penekanan, ada yang lebih panjang (10-${maxWordsPerScene} kata) saat menjelaskan.
- Bahasa lisan anak muda yang natural: boleh "kamu", "gak", "udah", "aja", "kok", "sih", "tuh", "kan", "ya", "jujur", "padahal". Pakai kata sambung (karena, tapi, padahal, terus, makanya, jadi) supaya antar-scene nyambung.
Bahasa SEDERHANA, harus langsung dipahami sekali dengar oleh siapa saja (anak SMP sampai orang tua):
- Pakai kata sehari-hari yang biasa diucapkan di obrolan. JANGAN pakai kata tinggi/serapan/akademis: esensi, eksistensi, paradigma, manifestasi, resiliensi, validasi, ekspektasi, transformasi, signifikan, fundamental, kontemplasi, hakikat, entitas, persepsi, narasi, fase, momentum, versi terbaik, potensi, makna hidup. Ganti dengan kata biasa (mis. "ekspektasi" -> "harapan", "konsisten" -> "terus-terusan", "validasi" -> "pengakuan orang").
- JANGAN puitis, filosofis, atau berbunga-bunga ("jiwa yang lelah", "langkah kecil menuju cahaya", "dirimu yang sejati"). Katakan maksudnya langsung.
- Satu kalimat satu maksud, pendek, susunan biasa (subjek-kata kerja-objek). Hindari kalimat bertingkat dan kiasan di dalam kiasan.
- Metafora boleh, tapi bendanya sehari-hari dan artinya langsung dijelaskan dengan kata biasa; penonton tidak boleh harus mikir untuk paham.
- Tes: kalau ada kata yang jarang dipakai di obrolan warung kopi, ganti.
- Konkret, bukan abstrak. Ganti kata besar ("kesuksesan", "potensi", "versi terbaik dirimu", "zona nyaman") dengan situasi nyata yang bisa dibayangkan: jam berapa, lagi ngapain, pegang apa, ngerasa apa.
- Jaga satu benang merah: metafora dari ide dipakai dari awal sampai akhir dan dijelaskan dengan jelas, bukan disebut sekilas lalu ditinggal.
- JANGAN: deretan slogan pendek tanpa hubungan, kalimat perintah beruntun ("Bangkit! Lawan! Gas!"), kalimat ala terjemahan, kata baku kaku ("adalah", "merupakan", "oleh karena itu", "sesungguhnya", "dirimu"), atau quote klise.
- Alur: hook yang langsung kena -> situasi nyata yang relatable -> sudut pandang baru (lewat metafora) -> satu langkah konkret yang bisa dilakukan hari ini -> penutup yang membekas dan bikin orang pengen langsung gerak.
- Struktur penahan penonton (berlaku di atas alur tadi, tanpa mengubah jenis videonya):
  - Hook (scene 1): kalimat pertama langsung sebut topiknya + apa yang dipertaruhkan buat penonton (masalah yang kerasa, pertanyaan yang mengganjal, atau hal yang mengejutkan). Jangan mulai dengan salam, perkenalan, atau basa-basi.
  - Lock-in: scene tepat setelah hook menegaskan janji hook dan memberi alasan untuk bertahan sampai akhir: satu bukti atau situasi nyata, atau "ada N hal/cara/langkah..." kalau isinya berupa daftar.
  - Kalau ada beberapa poin, alasan, atau fakta yang urutannya bebas: taruh yang terkuat KEDUA di awal, dan yang TERKUAT jadi klimaks menjelang akhir. Langkah yang harus berurutan dan alur cerita tetap mengikuti urutan logisnya.
  - Rehook: di peralihan ke bagian berikutnya, pakai kalimat penghubung yang bikin penasaran lagi (mis. "tapi justru di sini masalahnya,", "nah bagian ini yang jarang disadari:", "dan yang terakhir ini paling sering dilupain:"). Cukup 1-3 kali per video, di peralihan yang penting saja, harus terdengar alami, bukan template.
  - Penutup: rangkum pesannya dalam satu kalimat yang gampang diingat, lalu ajakan yang menyatu dengan isi (mis. coba satu hal ini hari ini, simpan biar gak lupa, atau kirim ke teman yang lagi ngalamin hal yang sama), bukan sekadar "jangan lupa like dan subscribe".

Contoh perbedaan (jangan ditiru katanya, tiru rasanya):
- KAKU (jangan): "Disiplin adalah kunci utama. Fokus pada tujuanmu. Jangan menyerah pada proses. Kesuksesan menantimu."
- MENGALIR (benar): "Kamu pernah gak sih udah niat banget mau mulai, tapi baru buka HP lima menit tahu-tahu udah sejam? Masalahnya bukan karena kamu malas, tapi karena otakmu dikasih terlalu banyak pilihan sekaligus."
- "visual": deskripsi ilustrasi KONKRET + gerakannya, untuk kanvas ${ratioLabel}. Awali dengan latar tempat & waktu singkat di kurung siku (mis. "[Kamar kost malam]" atau "[Konsep di atas meja]"), lalu \`Shot kamera: <jenis shot & fokus>.\` (mis. \`Shot kamera: close-up tangan dan dompet di meja.\` atau \`Shot kamera: wide kamar dari samping, fokus ke pintu.\` — variasikan antar scene: wide, medium, close-up objek, over-shoulder, sudut atas, low angle; jangan medium lurus terus). Jika scene menampilkan orang, WAJIB tambahkan \`Pemeran: ...\` setelahnya (mis. \`Pemeran: aku (pria), ayah (pria), ibu (wanita).\`) memakai kata panggilan yang SAMA PERSIS di setiap scene tempat orang itu muncul (\`aku\`, \`ayah\`, \`ibu\`, \`kakak\`, \`adik\`, \`teman\`, \`bos\`, dll.) supaya wajah dan bajunya dikunci konsisten oleh engine di semua scene; untuk scene tanpa orang, jangan tulis \`Pemeran:\`. Lanjutkan dengan objek utama dan aksinya. Gerakan dinamis: jatuh lalu membal, terbang masuk dari samping, berputar, menumpuk, pecah jadi burst. Teks 3D hanya boleh untuk angka atau 1 kata singkat (mis. "1%", "STOP"), bukan kalimat. Sebut benda NYATA yang dimaksud teks secara spesifik (motor, HP, celengan, laptop, kunci) lengkap dengan ciri khas bentuknya (mis. "motor skuter oranye: dua roda, jok cokelat, stang, lampu depan bulat"), karena objek akan dirakit dari banyak bentuk dasar dan harus langsung dikenali. JANGAN menggantinya dengan bentuk abstrak atau cuma sebagiannya (motor jangan jadi roda saja; rumah jangan jadi segitiga saja). Visual harus menggambarkan PERSIS kata kunci kalimatnya sebagai aksi yang terlihat, sampai penonton paham maksud kalimatnya walau suara dimatikan: "satu langkah" = sepasang kaki/jejak yang melangkah satu kali, bukan sepatu diam; "menabung" = koin masuk celengan; "waktu habis" = jam pasir tinggal sedikit. Kalau teks tentang orang atau tindakan manusia, boleh pakai sosok manusia tanpa wajah yang melakukan aksi itu (berjalan, duduk lesu, meraih sesuatu, kepal tangan). TANPA WAJAH: jangan menggambar mata, hidung, atau mulut pada benda apa pun (termasuk manusia, hewan, matahari, awan). Satu objek utama + maksimal 2-3 objek pendukung, sisanya ruang kosong.
- "theme": "paper" = versi latar terang, "dusk" = versi latar menengah, "night" = versi latar gelap. ${isDiorama ? 'Untuk Diorama Data pakai tema "paper" agar latar papan miniatur menyambung.' : 'Selingi agar tidak monoton.'}
- "duration": sekitar ${avgSec} detik (rentang ${minSceneDurStr} - ${maxSceneDurStr} detik, sesuai panjang kalimat).
- "emphasis": SATU kata terpenting dari "text" (tulis persis seperti di teks) untuk di-highlight. Kamera akan menghentak/zoom tepat saat kata ini muncul.
- "camera": gerakan kamera scene ini, pilih id yang paling cocok dengan isi dan emosinya:
  - "push": mendekat pelan ke objek; membangun fokus/ketegangan
  - "pull": mundur dari dekat; reveal, lega, gambaran besar
  - "pan-left": kamera menyapu ke kiri; perjalanan, waktu berjalan
  - "pan-right": kamera menyapu ke kanan; maju, progres
  - "tilt-up": kamera naik; harapan, bangkit, target
  - "tilt-down": kamera turun; jatuh, beban, kenyataan
  - "roll": frame berputar miring; bingung, dunia terbalik, overthinking
  - "orbit": kamera mengayun kiri-kanan; ragu, menimbang pilihan
  - "crash": zoom kilat + hentakan; kejutan, tamparan kenyataan
  - "handheld": goyang tangan alami; jujur, curhat, dekat
  - "shake": frame bergetar keras; benturan, gagal, ledakan, marah, panik
  Buat kameranya dinamis: scene berurutan JANGAN memakai gerakan yang sama, pakai banyak variasi sepanjang video. Pakai "shake" atau "crash" untuk momen benturan/kaget/gagal/ledakan, tapi jangan lebih dari sekitar 1 dari 4 scene supaya tetap terasa menghentak.

${contextAndTaskBlock}
${note ? `\nCatatan tambahan dari kreator: ${note}\n` : ''}
## Latar
Desain latar khusus untuk video ini (unik, jangan pakai warna generik): 3 versi yang dipakai sebagai tema scene.
- "paper" = versi terang (teks gelap harus terbaca), "dusk" = versi menengah/berwarna, "night" = versi gelap (teks terang harus terbaca).
- Warna "top" dan "bottom" (hex) membentuk gradasi; selaraskan dengan gaya "${gayaTitle}" dan suasana pesan video.
- "pattern" salah satu: none, navy, dots, grid, bigGrid, lines, stars, halftone, grain, chalk, wash, horizon, sunburst, mist, hud, stripes, dotsup, neonwave, slash, hills, peaks, house, dither, washi, plate, sunset, film, room, deepgrid, shore, craft, softgrid, ridge.
- Acuan gaya ini (variasikan, jangan sama persis): paper: #fbfaf6 -> #f0ede4 (dots); dusk: #f5efe2 -> #e6decb (grid); night: #1c2233 -> #101420 (stars).

## Hook thumbnail ("hook")
Judul cover di setengah detik pertama video, di atas gambar adegan. Tugasnya satu: bikin orang BERHENTI scroll dalam sekali lirik. Tiga bagian yang dibaca berurutan jadi satu kalimat utuh: "atas" 2-4 kata pembuka, "besar" 1-3 kata yang jadi pukulannya, "bawah" 3-6 kata penutup yang membuka rasa penasaran.
Cara bikin yang nendang:
- Buka CELAH PENASARAN: sebut kejadian atau fakta yang janggal dari isi narasi, tapi sembunyikan jawabannya ("...dan aku baru tahu kenapa", "...ternyata bukan karena malas", "...sampai hari itu tiba").
- Spesifik dan konkret mengalahkan umum: angka, waktu, benda, orang dekat (ayah, ibu, kakak, sahabat, bos). "3 TAHUN", "TIAP SUBUH", "UANG 5 RIBU" lebih kuat daripada "lama" atau "sedikit".
- Ada taruhan perasaan atau kontras: rahasia, kebohongan baik, pengorbanan diam-diam, kebiasaan kecil yang mengubah hidup, kesalahan yang hampir semua orang lakukan.
- "besar" = kata PALING mengejutkan dari kalimatnya, bukan kata sambung.
- Untuk motivasi/tips/fakta polanya sama: kontradiksi atau angka yang bikin kaget ("BERHENTI NGEJAR / PRODUKTIF / malah bikin kerjaan beres", "CUMA / 2 MENIT / tiap pagi, hasilnya kerasa sebulan").
DILARANG: kata kosong ("Kisah Inspiratif", "Wajib Tonton", "Bikin Nangis", "Viral"), tanda seru berderet, emoji, membocorkan akhir cerita, janji palsu yang tidak ada di video, dan menyalin judul video orang lain. Bahasa ngobrol sehari-hari, total maksimal 12 kata.
"scene" = nomor scene (mulai 1) yang gambarnya paling menggambarkan suasana ceritanya untuk latar cover (lebih baik adegan dengan tokoh dan tempat kejadiannya, bukan penutup).

## SEO YouTube ("seo")
Metadata upload (YouTube, TikTok, Reels) supaya video ini mudah ditemukan lewat pencarian dan saran video, dan enak dibaca. Tulis dalam bahasa video ini, untuk penonton yang mengetik di kolom cari.
- Tentukan dulu 1 KATA KUNCI UTAMA (frasa 2-4 kata yang benar-benar diketik orang saat mencari topik ini, mis. "cara berhenti overthinking", "bikin video animasi", "tips hemat uang", bukan istilah puitis) dan 2-3 KATA KUNCI TURUNAN (variasi atau masalah yang dekat).
- "title": maksimal 70 karakter, kata kunci utama di awal, lalu alasan untuk mengklik (manfaat, angka, atau rasa penasaran) yang jujur sesuai isi video. Tanpa huruf kapital semua, tanpa hashtag, maksimal 1 emoji.
- "description": deskripsi panjang (YouTube) yang RAPI, BUKAN satu paragraf panjang. Pisahkan bagian dengan baris kosong (tulis "\\n\\n" di dalam string JSON) dan tiap poin dengan "\\n". Susunannya:
  1) Pembuka 1-2 kalimat pendek: kata kunci utama di kalimat pertama + apa yang didapat penonton (dua baris ini yang tampil di hasil pencarian, jadi harus langsung menarik).
  2) Satu baris judul bagian (mis. "Di video ini:" atau "Yang kamu dapat:"), lalu 3-4 poin, satu poin per baris, diawali emoji yang cocok dengan isinya (mis. "✅ ", "💡 ", "🎬 "). Poin diambil dari isi video, singkat (maksimal ~12 kata), dan memuat kata kunci turunan secara alami.
  3) Satu kalimat penutup yang menguatkan manfaatnya, lalu baris ajakan yang spesifik (mis. "Simpan video ini biar gak lupa, dan kirim ke teman yang lagi butuh."). Video promosi: ajakan + kontak/link persis seperti dari kreator.
  Total maksimal ~700 karakter, kalimat pendek, bahasa santai sesuai video. Jangan menyalin narasi kata per kata, jangan menumpuk kata kunci, jangan menulis hashtag di deskripsi (ditambahkan otomatis di bawahnya).
- "short": caption pendek untuk TikTok/Reels/Shorts: 1-2 kalimat (maksimal ~150 karakter) yang bikin penasaran atau langsung kena, bahasa santai sesuai isi video, boleh 1 emoji. Tanpa hashtag (ditambahkan otomatis), jangan sama persis dengan judul.
- "tags": 10-15 kata kunci, campuran: kata kunci utama, variasi dan sinonimnya, frasa panjang yang spesifik (long-tail), dan 2-3 topik umum. Huruf kecil, tanpa "#", total di bawah 400 karakter.
- "hashtags": 4-6 hashtag yang BENAR-BENAR dipakai orang di TikTok/Instagram/YouTube untuk topik ini, diurutkan dari paling spesifik ke umum: 2-3 hashtag spesifik isi video (dari kata kunci utama/turunan, mis. "#berhentimenunda", "#videoanimasi"), 1-2 hashtag niche/komunitas yang relevan (mis. "#kontenkreator", "#motivasiindonesia", "#tipsproduktif"), dan paling banyak 1 yang umum tapi tetap nyambung dengan topiknya. Huruf kecil, tanpa spasi, bahasa sesuai video. DILARANG hashtag generik yang tidak berhubungan dengan isi (#viral, #fyp, #foryou, #foryoupage, #trending, #explore), hashtag yang hampir sama satu sama lain, dan "#shorts" atau "#satsetmotion" (keduanya ditambahkan otomatis).

## Format jawaban
Jawab HANYA dengan satu blok kode \`\`\`json berisi:
{
  "title": "judul video",
  "seo": {
    "title": "judul YouTube yang dicari orang",
    "description": "deskripsi YouTube",
    "short": "caption pendek TikTok/Reels",
    "tags": ["kata kunci", "..."],
    "hashtags": ["#katakunci", "..."]
  },
  "hook": { "atas": "AYAH NGGAK PERNAH", "besar": "MAKAN SIANG", "bawah": "dan aku baru tahu kenapa.", "scene": 5 },
  "background": {
    "paper": { "top": "#fbfaf6", "bottom": "#f0ede4", "pattern": "dots" },
    "dusk": { "top": "#f5efe2", "bottom": "#e6decb", "pattern": "grid" },
    "night": { "top": "#1c2233", "bottom": "#101420", "pattern": "stars" }
  },
  "scenes": [
    {
      "text": "teks narasi di layar",
      "visual": "deskripsi ilustrasi dan gerakannya",
      "theme": "paper",
      "duration": ${avgSec},
      "emphasis": "kata",
      "camera": "push",
      "sfx": "efek suara bebas sesuai adegan / gaya remotion (mis. whoosh, ketik, hujan, laser, pageflip, alarm, detak_jantung, dll.)"
    }
  ]
}
Jangan gunakan artifact/canvas dan jangan menambahkan penjelasan di luar format yang diminta.`;

  return ensureAkhirPerintah(enrichPromptWithMedia(baseNarasi, collectProjectPromptImages(project)));
}

/**
 * Shared Satset Motion Canvas Engine Contract & Style Reference Block
 * used by both `buildAnimasiPrompt` (`prompt scene.md`) and `buildSingleSceneRevisionPrompt` (`prompt revisi per-scene udah jadi.md`).
 */
function buildCanvasEngineContractBlock(params: {
  gayaTitle: string;
  gayaHint: string;
  gayaDirection: string;
  ratioLabel: string;
  layout: ReturnType<typeof getSatsetLayout>;
  subtitleZoneLine: string;
  charSection: string;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  finishSection: string;
  examplesSection: string;
}): string {
  const {
    gayaTitle,
    gayaHint,
    gayaDirection,
    ratioLabel,
    layout,
    subtitleZoneLine,
    charSection,
    primaryHex,
    secondaryHex,
    accentHex,
    finishSection,
    examplesSection,
  } = params;

  return `Kamu adalah animator motion graphics yang menulis kode JavaScript Canvas untuk engine Satset Motion.

## Kontrak
Tulis ISI body dari \`function (s, ctx) { ... }\` (tanpa pembungkus fungsi). Dipanggil setiap frame (~30fps). Jangan gambar latar atau subtitle (sudah digambar engine).

## Kanvas (${ratioLabel})
- Ukuran logis: ${layout.W} x ${layout.H}. Origin (0, 0) di kiri atas.
- Pusat ilustrasi: (${layout.cx}, ${layout.cy}). Area aman ilustrasi: x ${layout.art[0]}..${layout.art[2]}, y ${layout.art[1]}..${layout.art[3]}. Garis tanah: y = ${layout.ground}.
${layout.W !== 720 ? `- CATATAN PENTING RASIO NON-VERTIKAL: Contoh di bawah memakai koordinat referensi 720x1280; saat menulis kode di rasio ${ratioLabel}, selalu sesuaikan pusat ke (${layout.cx}, ${layout.cy}) dan rentang X ke ${layout.art[0]}..${layout.art[2]}!\n` : ''}${subtitleZoneLine}
- \`s.W = ${layout.W}\`, \`s.H = ${layout.H}\`, \`s.cx = ${layout.cx}\`, \`s.cy = ${layout.cy}\`, \`s.groundY = ${layout.ground}\`.

## Waktu & easing
- \`s.t\` = detik sejak scene mulai (0 .. dur), \`s.dur\` = durasi scene, \`s.p\` = progres 0..1.
- \`s.spring(start = 0, preset = "snappy")\` -> nilai pegas fisik mulai di \`start\` detik (0 -> ~1, sedikit melewati 1 lalu balik seimbang, jadi gerak terasa hidup dan berenergi). Preset: \`"smooth"\` (tanpa pantul), \`"snappy"\` (cepat, sedikit membal), \`"bouncy"\` (membal jelas), \`"heavy"\` (berat, berayun), atau objek \`{ damping, stiffness, mass }\`. UTAMAKAN \`s.spring\` daripada \`s.at\` untuk posisi, skala, dan rotasi.
- \`s.stagger(i, start = 0, gap = 0.06, preset = "snappy")\` -> nilai spring untuk item ke-\`i\` dalam grup (tiap item otomatis telat \`gap\` detik).
- \`s.keys([[detik, nilai], ...], easing = "inOut")\` -> keyframe multi-tahap sepanjang \`s.t\`. Contoh: \`s.keys([[0, 0], [0.4, 1.1], [0.55, 1], [3.5, 1], [4.0, 0]])\`.
- \`s.at(start, len = 0.6)\` -> progres 0..1 sudah di-ease-out, mulai di \`start\` detik selama \`len\` detik.
- \`s.pop(start, len = 0.5)\` -> kurva membal (overshoot) untuk skala masuk.
- \`s.ease.out(x)\`, \`s.ease.inOut(x)\`, \`s.ease.back(x)\`, \`s.ease.elastic(x)\`, \`s.ease.in(x)\`, \`s.ease.outExpo(x)\`.
- \`s.lerp(a, b, k)\`, \`s.clamp(x, a, b)\`, \`s.wave(freq = 1, amp = 1, phase = 0)\`, \`s.rand(i)\` -> angka acak deterministik 0..1.

## Menggambar 2D
Semua primitif punya gaya hand-drawn otomatis. Opsi umum \`o = { stroke, fill, width, wobble, hatch, hatchColor, dash, alpha, draw }\`:
- \`draw\`: 0..1 untuk efek menggambar bertahap (pakai \`s.at(...)\`).
- \`hatch\`: true untuk arsiran pensil di dalam bentuk.
- \`s.line(x1, y1, x2, y2, o)\`
- \`s.polyline([[x,y], ...], o)\`, \`s.shape([[x,y], ...], o)\` (tertutup, bisa \`fill\` & \`hatch\`)
- \`s.curve([[x,y], ...], o)\` (kurva halus melewati titik)
- \`s.rect(x, y, w, h, { ...o, r })\` (x, y = KIRI ATAS)
- \`s.circle(x, y, r, o)\`, \`s.ellipse(x, y, rx, ry, o)\`, \`s.arc(x, y, r, a1, a2, o)\`
- \`s.arrow(x1, y1, x2, y2, { ...o, head, curve })\` (curve != 0 untuk panah melengkung)
- \`s.text(str, x, y, { size = 44, color, align = "center", rotate = 0, weight = 900, outline, shadow })\`
- \`s.text3d(str, x, y, { size = 72, depth = 12, angle = 0.7, fill, side, stroke, rotate, scale })\` -> teks tebal 3D berbayang
- \`s.words(str, x, y, { start = 0, gap = 0.07, size = 46, color, highlight, highlightColor, maxWidth })\` -> kalimat masuk kata per kata dengan spring (highlight = kata atau array kata yang diberi warna aksen)
- \`s.card(x, y, w, h, { r = 22, fill, stroke, shadow = 8, width, wobble, hatch, rotate, scale, alpha }, () => { /* isi kartu: (0,0) = pusat kartu */ })\`
- \`s.tag(str, x, y, { fill, color, stroke, size = 30, padX, padY, r, rotate, scale, shadow })\` -> badge/label kapsul siap pakai
- \`s.shadow(x, y, rx, ry = rx * 0.28, alpha = 0.16)\` -> bayangan lembut di lantai
- \`s.check(x, y, size, o)\`, \`s.cross(x, y, size, o)\`
- \`s.dash(x, y, r, count = 8, len = 18, o)\` (garis aksen memancar), \`s.sparkle(x, y, size, o)\`, \`s.rays(x, y, r1, r2, count, o)\`
- \`s.burst(x, y, start, { count = 14, r1 = 16, r2 = 110, size = 7, color, len = 0.7 })\` -> partikel meledak keluar mulai di \`start\` detik
- \`s.ground(y = s.groundY, o)\`
- \`s.group({ x = 0, y = 0, rotate = 0, scale = 1, scaleX, scaleY, alpha = 1 }, () => { ... })\` — PENTING: di dalam callback \`s.group\`, origin \`(0, 0)\` sudah bergeser ke \`(x, y)\` grup. Jadi gambar anak di sekitar \`(0, 0)\` (mis. \`s.rect(-40, -20, 80, 40)\`), JANGAN memasukkan koordinat kanvas seperti \`(360, 560)\` lagi di dalam grup karena objek akan terlempar keluar layar.

## Menggambar 3D
Semua objek 3D digambar di pusat (x, y) dengan proyeksi kamera, pencahayaan tiap sisi, bayangan jatuh, dan tepi hand-drawn otomatis.
Opsi 3D \`o3 = { rx = 0.35, ry = 0.55, rz = 0, scale = 1, fill, stroke, width = 3, wobble, hatch = true, shade = 0.24, shadow = true, fov = 520, alpha = 1, draw = 1, edges = "strong" | "soft" | "none", round = 0, ortho = false }\`:
- \`rx, ry, rz\`: rotasi radian (animasikan dengan \`s.t\` atau \`s.at\` supaya objek berputar hidup).
- \`draw\`: 0..1 untuk pop-in membal (mis. \`draw: s.pop(0.1)\`).
- \`edges\`: \`"soft"\` untuk tepi tipis halus, \`"none"\` untuk permukaan mulus tanpa garis tepi (cocok untuk gaya bersih/isometrik/kertas), \`"strong"\` untuk garis coretan tegas.
- \`round\`: 0..1 untuk membulatkan sudut balok/kubus (mis. \`round: 0.2\` untuk bentuk seperti bantal/kartu tebal).
- \`ortho\`: \`true\` untuk proyeksi isometrik sejajar tanpa distorsi perspektif.
- \`s.box(x, y, w, h, d, o3)\`, \`s.cube(x, y, size, o3)\` -> balok / kubus 3D
- \`s.cylinder(x, y, r, h, { ...o3, segs = 16 })\` -> silinder / koin / tiang / kue 3D
- \`s.cone(x, y, r, h, { ...o3, segs = 4..16 })\` -> kerucut / piramida (\`segs: 4\` = piramida)
- \`s.sphere(x, y, r, o3)\` -> bola / planet 3D dengan cincin lintang-bujur
- \`s.extrude(x, y, [[px,py], ...], depth, o3)\` -> bentuk 2D apa saja dijadikan 3D tebal!
  Bentuk siap pakai untuk \`s.extrude\`:
  - \`s.shapes.star(outerR, innerR, points = 5)\`
  - \`s.shapes.heart(size)\`
  - \`s.shapes.arrow(w, h)\`
  - \`s.shapes.bolt(w, h)\` (petir)
  - \`s.shapes.roundRect(w, h, r)\`
  - \`s.shapes.polygon(r, sides)\`
  Contoh: \`s.extrude(360, 520, s.shapes.star(110, 48, 5), 45, { fill: s.c.yellow, rx: 0.3, ry: s.t * 0.9, draw: s.pop(0.1) })\`
- Helper grid isometrik (lantai sejajar): \`s.iso(i, j, z = 0, { originX, originY, tile = 38 })\` -> \`[x, y]\`, \`s.isoBox(i, j, base, w, h, d, o3)\`, \`s.isoCylinder(i, j, base, r, h, o3)\` — ukuran dalam satuan petak grid, otomatis tersusun rapi dari belakang ke depan.

## Orang siap pakai
- \`s.person(x, y, { pose = "stand", style, size = 220, facing = 1, lean = 0, nod = 0, progress = s.t, draw = 1, role, build, skin, shirt, pants, jacket, shoes, hair, hairColor, hat, hatColor, glasses, hijab, peci, koko, sarong, khimar, niqab, beard, bag, tie, apron, robe, vest, scarf, prop, color, fill })\`:
  Menggambar manusia proporsional TANPA WAJAH di atas kaki \`(x, y)\` (jadi \`y\` = garis tanah/lantai tempat berdiri). **Jangan rakit manusia sendiri dari circle + line / stickman manual** — selalu pakai \`s.person\` supaya proporsinya bagus dan hidup (otomatis bernapas).
  - \`style\`: otomatis mengikuti pengaturan karakter (termasuk pakaian & hijab/peci/cadar yang dipilih pengguna). JANGAN kirim \`style\`, \`shirt\`, \`pants\`, \`hair\`, \`hijab\`, \`peci\`, \`niqab\`, dll. untuk tokoh utama kecuali scene memang membutuhkan peran khusus (\`role\`).
  - \`role\` (opsional, untuk tokoh tambahan): \`"office"\`, \`"doctor"\`, \`"chef"\`, \`"student"\`, \`"worker"\`, \`"driver"\`, \`"seller"\`, \`"kid"\`, \`"elder"\`, \`"athlete"\`, \`"artist"\`, \`"ustadz"\`, \`"santri"\`, \`"hijabi"\`, \`"niqabi"\`, \`"mother"\`, \`"father"\`, \`"chill"\`.
  - \`pose\`: ${SATSET_POSE_DICTIONARY}
  - Untuk pose \`walk\`/\`run\`, gerakkan juga posisi \`x\` dengan \`s.lerp\` supaya orangnya benar-benar berpindah tempat.

## Efek suara
\`s.sfx(name, time = 0, gain = 1, pitch)\` — bunyi otomatis diputar sekali saat \`s.t\` melewati \`time\` detik. Pasang 2-4 efek suara per scene yang PAS dengan gerakan objek dan suasana gaya Remotion "${gayaTitle}". Kamu BEBAS menggunakan nama SFX apa pun yang sesuai dengan referensi adegan atau gaya Remotion (tidak terbatas pada daftar contoh di bawah, engine synthesizer Satset akan otomatis merakit karakter suaranya):
- \`"pop"\`: objek muncul / gelembung / kartu kecil (\`s.pop\`, \`s.spring\` bouncy)
- \`"whoosh"\`: objek meluncur / panah terbang / sapuan masuk
- \`"thud"\` / \`"boom"\`: benda berat jatuh ke lantai, batu mendarat, pintu tertutup
- \`"click"\` / \`"tick"\`: tombol, langkah checklist, jarum jam, ketukan
- \`"ding"\`: ide muncul, lampu menyala, tanda centang, poin penting
- \`"coin"\`: uang, koin, angka naik, skor bertambah
- \`"sparkle"\` / \`"chime"\`: bintang, kilau, pencapaian, penutup positif
- \`"buzz"\`: tanda silang, salah, gagal, peringatan
- \`"rise"\`: grafik/roket naik, energi terkumpul
- Rekaman suara ASLI & SFX kontekstual bebas sesuai gaya "${gayaTitle}", untuk adegan yang punya tempat, objek, atau kejadian nyata. Suasana latar (taruh sekali di \`time: 0.05\` dengan \`gain: 0.45\` kalau tempatnya jelas): \`"hujan"\`, \`"hujan_deras"\`, \`"angin"\`, \`"keramaian"\`, \`"pasar"\`, \`"jalan"\` (lalu lintas kota), \`"burung"\` (pagi/taman), \`"jangkrik"\` (malam), \`"ombak"\` (pantai/laut), \`"sungai"\`, \`"api"\` (api unggun), \`"kereta"\`, \`"anak"\` (anak bermain), \`"kafe"\`, \`"kantor"\`. Kejadian & gaya spesifik (taruh tepat di detik aksinya): \`"petir"\`, \`"pintu"\` (pintu ditutup), \`"pintu_buka"\`, \`"ketuk"\` (ketuk pintu), \`"langkah"\` (langkah kaki), \`"lari"\`, \`"jantung"\` (detak jantung tegang), \`"tepuk"\` (tepuk tangan), \`"sorak"\` (orang bersorak), \`"tawa"\`, \`"bayi"\` (bayi menangis), \`"ayam"\` (ayam berkokok pagi), \`"kucing"\`, \`"anjing"\`, \`"motor"\`, \`"mobil"\`, \`"klakson"\`, \`"rem"\` (ban berdecit), \`"jam"\` (detak jam), \`"alarm"\` (beker berbunyi), \`"telepon"\` (dering), \`"notif"\` (notifikasi HP), \`"ketik"\` (mengetik keyboard), \`"koin"\`, \`"kasir"\` (mesin kasir), \`"tuang"\` (menuang air/kopi), \`"tetes"\` (tetesan air), \`"kaca_pecah"\`, \`"goreng"\` (masak mendesis), \`"bel"\` (bel sepeda/toko), \`"kamera"\` (jepretan foto), \`"kertas"\` / \`"pageflip"\` (membalik halaman), \`"laser"\` / \`"blip"\` (8-bit/retro), \`"glitch"\` (cyber/terminal), \`"chalk"\` (tulis kapur), \`"boing"\` (clay/kartun), \`"resleting"\`, \`"korek"\`, \`"ledakan"\`, \`"pukul"\` (pukulan/benturan), \`"napas"\` (tarik napas), \`"batuk"\`, \`"helaan"\` (hela napas lelah), atau nama SFX deskriptif lainnya sesuai objek yang dianimasikan.
Selaraskan \`time\` persis dengan \`start\` dari \`s.spring\`/\`s.pop\`/\`s.at\` objeknya.

- Palet \`s.c\`: \`ink\` (otomatis gelap di tema terang, terang di tema gelap), \`paper\`, \`red\`, \`pink\`, \`orange\`, \`yellow\`, \`green\`, \`teal\`, \`blue\`, \`navy\`, \`purple\`, \`brown\`, \`sky\`, \`white\`, \`gray\`, \`glow\`, \`brand1\`, \`brand2\`, \`brand3\`.
- Kalau butuh Canvas 2D mentah: \`ctx\` tersedia (koordinat sudah dalam ${layout.W}x${layout.H}).
- SATUAN SUDUT: semua \`rotate\`, \`rx\`, \`ry\`, \`rz\` memakai RADIAN, BUKAN derajat. Miring sedikit = \`0.05\`..\`0.15\` (sekitar 3°..9°); 45° = \`0.78\`; 90° = \`1.57\`. Jangan pernah menulis angka derajat seperti \`rotate: -8\` atau \`rotate: 15\` karena \`-8 rad\` artinya berputar 458°!

## Arahan gaya
- Gaya video: ${gayaTitle} (${gayaHint}).
- Tempo: ${layout.W ? 'aktif' : 'normal'}.
- Utamakan bentuk 3D (\`s.box\`, \`s.cube\`, \`s.cylinder\`, \`s.cone\`, \`s.sphere\`, \`s.extrude\`) sebagai objek utama; padukan dengan elemen 2D (panah, garis aksen, teks, sparkle, shadow) di sekelilingnya.

## Objek 3D yang keren (bukan kotak polos)
- **DILARANG menaruh satu kubus/silinder/bola sendirian sebagai objek utama.** Setiap benda 3D utama WAJIB dirakit sebagai **model komposit dari 5-14 bagian 3D + detail permukaan 2D** supaya langsung dikenali bentuk aslinya.
- Rakit benda nyata dari bagian-bagiannya:
  - **Roket** = badan \`cylinder\` putih + moncong \`cone\` merah di atas + 3 sirip \`extrude\` segitiga di samping + jendela bulat \`circle\` biru di badan + nosel \`cone\` gelap di bawah + semburan api \`cone\`/\`extrude\` kuning-oranye yang membesar-mengecil dengan \`s.wave\` + \`s.burst\` saat meluncur.
  - **Piala / trofi** = alas \`box\` bertingkat + tiang \`cylinder\` kecil + mangkuk \`cylinder\`/\`cone\` emas (\`s.c.yellow\`) + bintang \`extrude(s.shapes.star(...))\` di depan + \`s.sparkle\` berkilau di sekeliling.
  - **Koin / medali** = \`cylinder\` pipih (\`r: 95, h: 24\`) yang berputar (\`ry: s.t * 1.4\`) + cincin dalam + simbol \`s.text3d\` di tengah + beberapa koin kecil berterbangan dengan \`s.stagger\`.
  - **Gedung / rumah / toko** = badan \`box\` + atap \`cone(..., { segs: 4 })\` atau \`box\` pipih lebar + deretan jendela \`rect\` menyala + pintu + pohon \`cylinder\` + \`sphere\`/\`cone\` di samping.
  - **Laptop / HP / layar** = alas/badan \`box\` tipis (\`round: 0.18\`) + layar \`card\` atau \`rect\` gelap + grafik/bar/ikon yang bergerak di dalam layar + notifikasi \`tag\` yang pop-in di sampingnya.
  - **Otak / ide / pikiran** = gugus beberapa \`sphere\` berdekatan + bohlam (\`sphere\` kuning + leher \`cylinder\` abu + \`s.rays\` + \`s.sparkle\`) atau petir \`extrude(s.shapes.bolt(...))\` yang menyala.
  - **Baterai / energi** = badan \`cylinder\` atau \`box\` (\`round: 0.2\`) + kepala kutub \`cylinder\` kecil di atas + 3-4 balok level energi di dalamnya yang terisi bertahap dengan \`s.stagger\` dari merah ke hijau + ikon petir.
  - **Tangga / progres / grafik 3D** = 4-5 \`box\` yang tingginya naik bertahap dengan \`s.stagger\` + panah 3D \`extrude(s.shapes.arrow(...))\` menanjak di atasnya + \`s.person\` atau bintang di puncak.
  - **Gembok / kunci / brankas** = badan \`box\` tebal (\`round: 0.2\`) + lengkung \`arc\` tebal di atas yang terangkat terbuka saat \`s.at\` + lubang kunci di depan + kilau \`s.sparkle\` saat terbuka.
  - **Target / sasaran** = 3 \`cylinder\` pipih konsentris (merah-putih-merah) + anak panah (\`cylinder\` tipis + ujung \`cone\` + sirip) yang melesat dari samping lalu menancap membal dengan \`s.spring(..., "bouncy")\` + \`s.burst\` saat kena tengah.
  - **Jam / waktu** = badan \`cylinder\` pipih tebal + bingkai + dua telinga lonceng \`sphere\`/\`cylinder\` di atas yang bergetar (\`s.wave(18, 4)\`) + jarum jam berputar cepat di depannya.
  - **Timbangan / perbandingan** = tiang tengah \`cylinder\` + alas \`box\` + palang yang miring dengan \`s.spring\` + dua piringan dengan beban 3D berbeda di kiri-kanan.
- **Animasikan dalam 3D sejati**: rotasikan \`ry\`/\`rx\` dengan \`s.spring\` + goyangan halus \`s.wave\`, susun bagian-bagiannya muncul berurutan dengan \`s.stagger(i, 0.08, 0.06, "bouncy")\`, beri \`s.shadow\` di lantai yang ikut membesar/mengecil sesuai tinggi lompatan objek, dan tambahkan benda-benda kecil 3D (bintang, kubus kecil, koin, partikel) yang mengorbit di sekeliling objek utama.
- Padukan sudut: untuk benda tunggal pakai perspektif (\`rx: 0.28..0.42\`, \`ry\` berputar pelan); untuk adegan ruangan/kota/meja kerja pakai \`ortho: true\` atau \`s.isoBox\`/\`s.isoCylinder\` supaya berdiri rapi di atas bidang tanah.

## Mode cerita (adegan di latar lengkap)
Kalau isi scene berupa **cerita, kejadian sehari-hari, atau ada orang di suatu tempat** (mis. di kamar, ruang tamu, kantor, sekolah, jalan, warung, masjid, toko — bukan sekadar diagram abstrak):
- **WAJIB gambar tempatnya dulu sebagai latar adegan (background layer)** sebelum menggambar orang dan objek utama, supaya orang tidak mengambang di kanvas kosong. Pilih 3-5 elemen lingkungan sederhana yang langsung menunjukkan tempatnya:
  - **Dalam ruangan** (kamar, kantor, kelas, rumah): garis lantai \`s.ground(850)\` + dinding belakang tipis, jendela (\`s.rect\` dengan garis silang & cahaya miring atau bulan/matahari di luarnya), pintu, jam dinding, rak buku, lukisan/bingkai kecil, lampu gantung dari atas, tanaman pot di pojok, meja/kursi/kasur tempat orang berinteraksi.
  - **Luar ruangan** (jalan, taman, kota, halaman, pasar): garis tanah/trotoar + siluet gedung atau rumah-rumah di belakang (alpha rendah \`0.25..0.45\` agar tampak jauh), pohon/semak, tiang lampu jalan, rambu, bangku taman, awan bergerak pelan (\`x + s.t * 12\`), matahari/bulan/bintang di langit atas.
- **Kedalaman 3 lapis (parallax)**:
  1. **Latar jauh** (gedung/jendela/awan/rak di belakang): ukuran lebih kecil, \`alpha: 0.3..0.55\`, masuk cepat di \`0.0s\`, bergeser pelan berlawanan arah atau bernapas halus.
  2. **Latar tengah (panggung utama)**: lantai \`s.ground\`, perabot/benda tempat kejadian, dan \`s.person\` yang berakting sesuai kalimat.
  3. **Latar depan / aksen**: label/angka pendek (bila perlu), efek cuaca/suasana (butir hujan miring, uap kopi naik, daun jatuh, kilau lampu), atau siluet tepi meja/daun di pinggir bawah.
- **Akting & interaksi nyata**: orang di dalam cerita HARUS berinteraksi dengan benda di tempatnya — duduk di kursi menghadap meja & laptop (\`pose: "sittype"\`), berbaring di kasur (\`pose: "liethink"\`), berjalan menyusuri jalan dari kiri ke kanan sambil \`x\` berpindah (\`pose: "walk"\` / \`"walksad"\`), menunjuk ke papan/grafik (\`pose: "present"\`), memegang kepala di depan tumpukan tagihan (\`pose: "headache"\`). Jika ada 2 orang (mis. ngobrol, menasihati, menolak, memberi), hadapkan mereka berlawanan (\`facing: 1\` dan \`facing: -1\`) dan beri pose yang saling merespons pada detik yang pas.

## Orang & wajah
- Setiap manusia/tokoh WAJIB tanpa wajah (faceless): kepala polos tanpa mata, alis, hidung, atau mulut. Emosi ditunjukkan lewat pose tubuh, gerak tangan, kemiringan kepala, dan objek di sekitarnya. Jangan menggambar wajah pada benda apa pun (matahari, awan, koin, dll.).
- Tokoh TIDAK wajib ada di setiap scene. Tampilkan orang hanya kalau teks scene memang membicarakan orang (aku, kamu, dia, teman, keluarga, pembeli); scene tentang benda, angka, konsep, tempat, waktu, atau metafora cukup dengan bendanya saja. Biasanya sepertiga sampai separuh scene memakai orang.
- ${charSection}
- PENTING, supaya tiap orang SAMA di semua scene: engine merakit SEMUA orang selain tokoh utama dari Character Builder dan MENGUNCI rupanya (wajah, rambut, kulit, baju) dari \`who\`. Jadi setiap orang selain narator WAJIB diberi \`who\` (lihat baris "Pemeran" tiap scene: pakai kata itu PERSIS, mis. \`who: "ayah"\`, \`who: "kakak"\`) dan \`build\` ("male"/"female", sama di setiap scene), dan JANGAN beri opsi rupa: hair, hairColor, skin, body, glasses, shirt, pants, jacket, shoes. Tulis cukup \`s.person(x, y, { who: "ayah", build: "male", size, pose, facing })\`. Opsi rupa yang kamu tulis untuk orang ber-\`who\` diabaikan engine, dan orang TANPA \`who\` bisa berganti rupa antar scene. Hanya orang asing yang muncul sekali (penjual, kurir, orang lewat) boleh tanpa \`who\`; beri \`role\` kalau profesinya jelas. Narator ("aku") juga diberi \`who: "aku"\` dan \`build\`.
- Pakaian religius (peci, baju koko, hijab, khimar, cadar) HANYA untuk orang yang konteksnya religius atau memang digambarkan begitu, dan TIDAK PERNAH untuk orang yang berperan negatif: yang bersalah, penipu, pencuri, pemalas, yang dimarahi atau diejek, pelaku kesalahan.
- Pakaian mengikuti peran & konteks, bukan kebiasaan. Contoh: orang yang berutang = kaos kusut & celana pendek; penagih = kemeja rapi atau jaket; pekerja kantoran = kemeja + dasi; anak muda = hoodie/kaos.

## Objek harus langsung dikenali
Setiap benda yang disebut narasi atau visual HARUS digambar lengkap dengan ciri khas bentuknya (siluet + bagian-bagian utamanya), sampai anak kecil pun langsung tahu itu benda apa dalam sekali lihat:
- Rakit benda dari 4-8 bentuk dasar yang membentuk bagian nyatanya:
  - Motor/sepeda = 2 roda (circle + ban luar + jari-jari), bodi/rangka, jok, stang + spion, lampu depan, knalpot, garis jalan di bawahnya.
  - Mobil = bodi bawah + kabin atas berjendela, 2 roda, lampu depan & belakang.
  - HP/smartphone = badan rect bersudut bulat, bingkai layar dalam, speaker kecil di atas, isi layar yang relevan (ikon/chat/grafik).
  - Rumah = badan dinding, atap segitiga/trapesium, pintu, jendela berbingkai.
  - Jam = lingkaran luar + bingkai, titik pusat, jarum jam & menit, tanda angka/strip di tepi.
  - Celengan/uang = bentuk celengan utuh + celah koin di atas + koin bulat berlambang yang masuk ke celah; uang kertas = persegi panjang berlapis dengan lingkaran tengah & sudut.
  - Buku = sampul kiri-kanan terbuka atau tumpukan halaman terlihat di sisi + garis-garis isi.
- DILARANG menggambar benda nyata sebagai satu kotak/lingkaran abstrak yang hanya ditempeli tulisan namanya, atau hanya sebagian kecilnya (motor jangan jadi roda saja; rumah jangan jadi segitiga saja).
- Kalau bendanya tentang manusia atau tindakan manusia (melangkah, bekerja, lelah, berdoa, berpikir, memegang HP), gunakan \`s.person(x, y, { pose, ... })\` — jangan menggambar tubuh manusia sendiri dari garis/lingkaran.

## Komposisi (bawaan; boleh dilanggar DENGAN SENGAJA kalau memperkuat kalimat)
- Jadikan visualnya **langsung menceritakan maksud kalimat**: begitu penonton melihat gambarnya tanpa suara sekalipun, mereka paham pesannya. Pilih metafora konkret yang bergerak (mis. "waktu habis" = jam pasir/baterai menguras; "beban pikiran" = sosok menunduk dengan batu besar di atas kepala; "konsisten" = balok-balok yang tersusun naik satu per satu).
- **Titik fokus jelas**: satu adegan utama yang kuat di area ilustrasi, didukung 2-4 elemen pendamping (label pendek, panah, angka, ikon kecil, tanah/bayangan) yang muncul bertahap mengikuti kalimat.
- **Jangan menumpuk objek di titik yang sama**: beri jarak antar elemen supaya tidak saling menutupi dan setiap bentuk terbaca jelas.
- **Teks di dalam kanvas** hanya untuk kata kunci/angka singkat (1-3 kata, ukuran >= 38) sebagai label objek atau penekanan. Jangan menulis ulang kalimat narasi karena sudah ada di subtitle bawah.
- Jangan taruh elemen di bawah y = ${layout.ground + 30} (area subtitle).
- **Tata letak wajib berganti antar scene**: jika scene sebelumnya objek utama di tengah, scene berikutnya geser ke kiri + pendukung di kanan, atau susun diagonal, atas-bawah, berderet horizontal, melingkar, atau split kiri-vs-kanan.

## Bebas berkreasi (bikin keren, jangan template)
Semua aturan di atas adalah pegangan dasar supaya rapi, BUKAN batasan kreativitas. Kamu bebas penuh menentukan cara paling keren untuk memvisualkan kalimatnya:
- **Gunakan seluruh kanvas secara dramatis**: objek boleh meluncur masuk dari luar layar (\`x = -120\` -> \`360\`), jatuh dari langit (\`y = -150\` -> \`groundY\`), memenuhi layar dari dekat (close-up besar) lalu mundur, atau dilihat dari sudut tak biasa (dari atas meja, dari bawah menatap gedung tinggi, dari balik bahu).
- **Buat adegan yang punya cerita kecil di dalam 1 scene**: ada keadaan awal -> ada kejadian/aksi di tengah (sesuatu berubah, patah, menyala, tumbuh, bertabrakan, terbuka, terisi) -> ada hasil akhir yang memuaskan saat kata penekanan diucapkan.
- **Detail kecil yang bikin hidup**: uap tipis di atas cangkir kopi, bayangan yang membesar saat benda mendekati lantai, kertas kecil berterbangan saat tumpukan jatuh, kilau di sudut benda berharga, garis kecepatan di belakang objek yang melesat, riak lingkaran saat sesuatu menyentuh tanah.
- **Kontras ukuran & ruang**: berani pasang satu benda RAKSASA berhadapan dengan sesuatu yang kecil (mis. batu beban besar vs orang kecil; satu angka \`text3d\` besar di tengah dengan objek-objek kecil mengelilinginya), atau ruang lega yang sunyi untuk kalimat yang emosional.
- Kalau sebuah ide visual terasa biasa saja ("kotak di tengah + teks di atasnya"), BUANG dan ganti dengan adegan yang punya aksi, sudut, atau metafora yang bikin orang berhenti menonton.

## Kualitas gerak (standar motion designer profesional)
- **Wajib pakai \`s.spring\` & \`s.stagger\`**: semua kemunculan, perpindahan, dan perubahan skala harus memakai \`s.spring(start, preset)\` atau \`s.stagger(i, start, gap, preset)\` supaya ada akselerasi, overshoot halus, dan settle alami — jangan gerak linear kaku.
- **Koreografi bertahap mengikuti suara**: lihat baris \`Waktu kata diucapkan\` di setiap scene. Munculkan objek utama di \`0.0 - 0.25s\`, elemen kedua tepat saat katanya diucapkan, dan **ledakan visual / perubahan keadaan tepat di detik kata penekanan** (skala membesar dengan \`s.spring(tKata, "bouncy")\`, objek berubah warna/terbuka/menyala, \`s.burst\`, \`s.rays\`, atau \`s.text3d\` kata kunci).
- **Secondary motion & follow-through**: saat objek utama mendarat, tambahkan reaksi kecil di sekitarnya (bayangan melebar, debu/partikel kecil di lantai, label bergoyang \`rotate: s.wave(2, 0.04)\`, panah menggambar dirinya sendiri dengan \`draw: s.at(...)\`).
- **Selalu hidup sampai akhir scene**: setelah semua elemen masuk, beri gerak idle halus (\`s.wave\` untuk melayang/bernapas, rotasi 3D \`ry: 0.5 + s.t * 0.35\`, partikel kecil) — kanvas tidak boleh membeku diam.
- **Pasang \`s.sfx\`** yang sinkron dengan momen gerak utama (2-4 bunyi per scene).

${finishSection}

## Arahan gaya: CARA menggambar (PRIORITAS UTAMA)
${gayaDirection}
Palet warna BRAND (wajib): utama ${primaryHex}, kedua ${secondaryHex}, aksen ${accentHex}. Di kode tersedia sebagai \`s.c.brand1\`, \`s.c.brand2\`, \`s.c.brand3\` (warna palet \`s.c.orange/red/pink\`, \`s.c.teal/blue/navy/sky/green/purple\`, dan \`s.c.yellow\` juga otomatis menjadi turunan warna brand). Sekitar 80% warna objek harus dari palet brand (boleh versi lebih terang/gelapnya); sisanya hanya netral (putih, abu, hitam, cokelat). JANGAN menulis warna hex lain untuk objek. Palet ini mengalahkan warna yang disebut gaya.
PENTING: patuhi palet warna, cara memilih fill/stroke, ketebalan garis, hatch/wobble, dan jenis primitif dari arahan gaya di atas di SETIAP scene. Jangan kembali ke gaya default kalau arahan gaya meminta hal berbeda.

## Gaya = CARA menggambar, bukan ISI gambar
- **APA yang digambar** (objek, adegan, metafora, teks angka/label) **100% ditentukan oleh kalimat narasi dan deskripsi "Visual" di tiap scene**. Kalau kalimatnya tentang "menabung sedikit demi sedikit", gambarnya celengan & koin; kalau tentang "begadang main HP", gambarnya orang di kasur dengan cahaya HP — apa pun gaya videonya.
- **BAGAIMANA cara menggambarnya** (2D atau 3D, garis tebal atau tanpa garis, arsiran atau mulus, warna kartu/latar, cara objek masuk) barulah mengikuti arahan gaya di atas.
- Kalau arahan gaya di atas menyebut benda contoh (mis. "roket", "pohon", "kota", "grafik"), anggap itu **cuma contoh cara mewarnai dan membentuk objek**, JANGAN digambar kecuali memang diminta oleh narasi scene tersebut.

${examplesSection}

## Contoh pola gerak (ambil polanya, bukan warna atau bentuknya)
\`\`\`js
// Scene: "Tiga langkah kecil yang diulang setiap hari jauh lebih kuat dari satu rencana besar."
const baseY = 760;
s.ground(baseY + 70);
const labels = ["Bangun", "Bergerak", "Ulangi"];
for (let i = 0; i < 3; i++) {
  const m = s.stagger(i, 0.1, 0.22, "bouncy");
  const h = (i + 1) * 85 * m;
  const x = 180 + i * 180;
  s.shadow(x, baseY + 55, 62 * m);
  s.box(x, baseY - h / 2, 115, h, 75, {
    fill: i === 2 ? s.c.yellow : s.c.teal,
    rx: 0.3, ry: 0.5 + s.wave(0.4, 0.06, i),
    draw: m,
  });
  s.tag(labels[i], x, baseY - h - 48, { fill: s.c.paper, color: s.c.ink, scale: m });
}
s.sfx("pop", 0.1); s.sfx("pop", 0.32); s.sfx("ding", 0.54);
const starP = s.spring(0.85, "bouncy");
s.extrude(540, baseY - 340 + s.wave(1.2, 8), s.shapes.star(58, 26, 5), 26, {
  fill: s.c.orange, rx: 0.25, ry: s.t * 1.1, scale: starP,
});
s.burst(540, baseY - 340, 0.88, { count: 14, color: s.c.yellow });
\`\`\`

## Kerahkan kemampuan terbaikmu
Anggap setiap scene sebagai karya portofolio motion graphics terbaikmu. Jangan menulis kode minimal yang sekadar jalan:
- Rancang komposisi yang seimbang, berlapis (latar, objek utama, detail pendamping, aksen gerak), dan enak dilihat di layar ${ratioLabel}.
- Susun objek dari beberapa bentuk yang saling melengkapi sehingga bentuknya kaya dan langsung dikenali, bukan satu kotak atau lingkaran polos.
- Buat gerakan yang terasa hidup dari detik pertama sampai terakhir: masuk dengan \`s.spring\`/\`s.stagger\`, bereaksi tepat di detik kata penting, dan tetap bernapas halus dengan \`s.wave\`.
- Sebelum menulis tiap scene, bayangkan dulu adegannya seperti potongan video animasi pendek terbaik di TikTok/Reels, lalu wujudkan selengkap mungkin.`;
}

/**
 * Builds the animation code generation prompt for Claude / Gemini for a specific batch of scenes.
 * Matches exact procedural HTML Canvas motion graphics contract (`prompt scene.md`).
 */
export function buildAnimasiPrompt(
  project: Partial<SatsetProject>,
  startSceneNumber: number,
  endSceneNumber: number
): string {
  const scenes = project.scenes || [];
  const targetScenes = scenes.filter((s, idx) => {
    const num = s.scene_number || idx + 1;
    return num >= startSceneNumber && num <= endSceneNumber;
  });

  const gayaRaw = project.gaya_video || project.styleModule || 'scribble3d';
  const autoResolved =
    gayaRaw === 'otomatis' ? resolveAutoStyleForConceptAndScene(project, targetScenes[0], startSceneNumber - 1) : null;
  const effectiveGaya = autoResolved ? autoResolved.styleId : gayaRaw;
  const resolvedStyleId = resolveSatsetStyleId(effectiveGaya);
  const styleDef =
    getSatsetStyleDef(resolvedStyleId, 'crayon') || getSatsetStyleDef('scribble3d', 'crayon');
  const modInfo = SATSET_MODULES.find(
    (m) => m.id === effectiveGaya || resolveSatsetStyleId(m.id) === resolvedStyleId
  );

  const gayaTitle = styleDef?.label || modInfo?.title || 'Scribble 3D';
  const gayaHint = styleDef?.hint || modInfo?.description || 'scribble 3D: objek 3D low-poly, arsiran coretan, latar cerah bertitik';
  const gayaDirection =
    (styleDef?.direction ||
      modInfo?.description ||
      `${gayaTitle}: ${gayaHint}. Rancang objek utama yang jelas dengan komposisi kuat dan animasi halus.`) +
    (autoResolved ? `\n- Mode Gaya Otomatis aktif: sistem memilih "${autoResolved.styleTitle}" karena ${autoResolved.reason}` : '');

  const ratio = (project.aspect_ratio || '9:16') as AspectRatio;
  const layout = getSatsetLayout(ratio === '16:9' || ratio === '1:1' || ratio === '3:4' ? ratio : '9:16');
  const ratioLabel =
    ratio === '16:9'
      ? 'lanskap 16:9'
      : ratio === '1:1'
      ? 'persegi 1:1'
      : ratio === '3:4'
      ? 'potret 3:4'
      : 'vertikal 9:16';

  const finishMode = styleDef?.finish || 'scribble';
  const finishSection =
    finishMode === 'glow'
      ? `## Finishing: MENYALA (glow)\nEngine otomatis membuat garis dan isian memancarkan cahaya sesuai warnanya, tanpa efek coretan. Pakai warna terang/jenuh kontras agar pendar cahayanya tajam.`
      : finishMode === 'glossy'
      ? `## Finishing: GLOSSY (kilap halus)\nObjek 3D tampil dengan permukaan mulus berkilau dan gradasi warna lembut tanpa coretan tinta.`
      : finishMode === 'scribble'
      ? `## Finishing: SCRIBBLE (arsiran tangan)\nObjek 3D dan 2D menampilkan tekstur coretan pensil/tinta serta garis tepi ekspresif.`
      : `## Finishing: GARIS BERSIH (clean)\nEngine menggambar semua bentuk dengan garis mulus dan warna rata, tanpa goyangan tangan dan tanpa arsiran pensil (wobble & hatch dimatikan otomatis). Fokus pada komposisi rapi, tipografi tajam, dan gerakan spring yang presisi.`;

  const charMode = resolveCharacterOption(project.character || 'auto');
  const charMeta = getCharacterMeta(charMode, project.custom_character);
  const hasFixedChar = charMode !== 'none' && charMode !== 'auto';
  const charSection =
    charMode === 'none'
      ? `Karakter: TANPA KARAKTER MANUSIA. Jangan menggambar orang/stickman/siluet wajah; gambarkan seluruh konsep lewat objek nyata, simbol, tipografi 3D, dan metafora visual.`
      : hasFixedChar
      ? `Tokoh UTAMA: "${charMeta.name}" (${charMeta.description}). Saat dia muncul, panggil \`s.person(x, y, { pose, size, facing })\` TANPA menimpa opsi pakaian & rambut. Setiap tokoh WAJIB faceless (tanpa wajah).`
      : `Belum ada tokoh tetap: semua orang dirakit engine dari Character Builder (lihat aturan \`who\` di bawah).`;

  const hasBrandCustom =
    project.brand_mode === 'custom' ||
    Boolean(project.warna_brand && project.warna_brand !== 'auto');
  const primaryHex = hasBrandCustom && project.warna_brand
    ? project.warna_brand
    : styleDef?.colors?.[0] || '#ff6a13';
  const secondaryHex =
    (hasBrandCustom && project.brand_secondary_color) ||
    styleDef?.colors?.[1] ||
    '#1e3a8a';
  const accentHex =
    (hasBrandCustom && project.brand_accent_color) ||
    styleDef?.colors?.[2] ||
    '#ffc93c';

  const customSubBox = project.subtitle_custom_box;
  const subCx = customSubBox ? Math.round(customSubBox.x + customSubBox.w / 2) : layout.cx;
  const subCy = customSubBox ? Math.round(customSubBox.y + customSubBox.h / 2) : layout.capY;
  const subtitleZoneLine = customSubBox
    ? `- Teks narasi (subtitle) dipindah kreator ke sekitar (${subCx}, ${subCy}): JANGAN menaruh tulisan lain atau titik fokus di kotak x ${customSubBox.x} - ${customSubBox.x + customSubBox.w}, y ${customSubBox.y} - ${customSubBox.y + customSubBox.h}; objek dan latar boleh lewat di belakangnya. Seluruh layar, termasuk bagian bawah, boleh dipakai ilustrasi.\n- PENTING - kreator memindahkan subtitle ke kotak x: ${customSubBox.x}, y: ${customSubBox.y} (rentang x: ${customSubBox.x}..${customSubBox.x + customSubBox.w}, y: ${customSubBox.y}..${customSubBox.y + customSubBox.h}).`
    : `- Zona subtitle berada di sekitar y = ${layout.capY} (pita ${layout.capBand[0]}..${layout.capBand[1]}). Jangan taruh label penting atau titik fokus tepat tertumpuk di situ.`;

  const storyOverviewLines = scenes
    .map((s, idx) => {
      const n = s.scene_number || idx + 1;
      const mark = n >= startSceneNumber && n <= endSceneNumber ? '>>>' : '   ';
      const txt = (s.narration_text || s.voiceScript || '').slice(0, 75);
      const vis = (s.visual || s.visualDescription || '').slice(0, 85);
      return `${mark} [Scene ${n}] "${txt}" -> ${vis || '-'}`;
    })
    .join('\n');

  const rawExamples = getSatsetStyleExamples(resolvedStyleId);
  const exampleEntries: Array<[string, string]> =
    rawExamples && rawExamples.length > 0
      ? rawExamples.slice(0, 2)
      : getSatsetStyleDemoScenes(resolvedStyleId)
          .slice(0, 2)
          .map((d) => [d.text, d.code]);

  const examplesSection = exampleEntries
    .map(
      ([label, code], idx) =>
        `${idx === 0 ? `## Contoh TEKNIK gaya ${gayaTitle} (tiru hanya cara memakai primitif, warna, dan geraknya; JANGAN menyalin objek atau tata letaknya ke scene tugas)\n` : ''}### Contoh ${idx + 1}: "${label}"\n\`\`\`js\n${code.trim()}\n\`\`\``
    )
    .join('\n\n');

  const sceneBriefs = targetScenes
    .map((s, idx) => {
      const num = s.scene_number || startSceneNumber + idx;
      const dur = Number(s.target_duration_sec || s.durationSeconds || 6.5);
      const text = s.narration_text || s.voiceScript || '';
      const visual = s.visual || s.visualDescription || '';
      const theme = s.theme || (idx % 2 === 0 ? 'paper' : 'dusk');
      const emphasis = Array.isArray(s.emphasis_words) && s.emphasis_words.length > 0
        ? s.emphasis_words.join(', ')
        : Array.isArray(s.emphasisWords) && s.emphasisWords.length > 0
        ? s.emphasisWords.join(', ')
        : (s as { emphasis?: string }).emphasis || '-';

      const words = text.split(/\s+/).filter(Boolean);
      const timings = words
        .map((w, i) => `${w} ${(0.0 + (i * Math.max(1.2, dur - 0.5)) / Math.max(words.length, 1)).toFixed(1)}`)
        .join(' · ');

      const mediaHint =
        s.media_key || s.media_url || s.website_step
          ? `\n- ASET GAMBAR/VIDEO WEB ASLI TERSEDIA (\`media_key: "${s.media_key || `web_step_${num}`}"\`): Gunakan gambar/video web tersebut secara PROPORSIONAL (~25%–35% area kanvas sebagai floating PiP card, split-screen preview, atau zoom-lens callout) dengan \`s.photo("${s.media_key || `web_step_${num}`}", ${Math.round(layout.cx + (num % 2 === 0 ? -110 : 110))}, ${Math.round(layout.cy - 45)}, ${Math.round(layout.W * 0.38)}, ${Math.round(layout.H * 0.14)}, { frame: "browser", zoom: 1 + s.p * 0.16, fx: ${s.focus_region?.fx ?? 0.5}, fy: ${s.focus_region?.fy ?? 0.42}, draw: s.pop(0.08, 0.35), time: s.t })\` DAN jelaskan mekanisme mendalamnya menggunakan animasi motion graphics 2D/3D (\`s.box\`, \`s.cylinder\`, \`s.cube\`, \`s.polyline\`, \`s.arc\`, \`s.card\`, \`s.stagger\`) yang berbeda tiap scene!`
          : '';

      return `### Scene ${num}
- Teks: "${text}"
- Kata penekanan: ${emphasis}
- Visual: ${visual || `Visual metafora konkrit sesuai gaya ${gayaTitle} yang menggambarkan "${text}".`}${mediaHint}
- Tema latar: ${theme} (pakai warna kontras dengan tema "${theme}")
- Gerakan kamera engine: ${s.camera || s.camera_movement || 'otomatis'} (engine sudah menggerakkan kamera; fokuskan kode pada aksi objek)
- Durasi: ${dur} detik (ancang timing \`s.at\` sepanjang 0..${dur}s)
- Waktu kata diucapkan (detik): ${timings} — selaraskan \`s.at(detik, ...)\` dengan kemunculan kata yang bersangkutan, terutama kata penekanan.`;
    })
    .join('\n\n');

  const firstNum = startSceneNumber;
  const secondNum = startSceneNumber < endSceneNumber ? startSceneNumber + 1 : null;

  const contractBlock = buildCanvasEngineContractBlock({
    gayaTitle,
    gayaHint,
    gayaDirection,
    ratioLabel,
    layout,
    subtitleZoneLine,
    charSection,
    primaryHex,
    secondaryHex,
    accentHex,
    finishSection,
    examplesSection,
  });

  const baseAnimPrompt = `${contractBlock}

## Tugas
Tulis kode animasi untuk ${targetScenes.length} scene berikut. Tiap scene HARUS punya komposisi, objek utama, dan gerakan yang BERBEDA satu sama lain (jangan mengulang tata letak scene sebelumnya).

Alur seluruh video (tanda >>> = scene yang kamu kerjakan sekarang; pastikan tiap scene BERBEDA jelas dari tetangganya):
${storyOverviewLines || `>>> [Scene ${startSceneNumber}..${endSceneNumber}]`}

${sceneBriefs}

## Format jawaban (penting)
Jawab HANYA dengan SATU blok kode \`\`\`js. Pisahkan tiap scene dengan komentar persis \`// ===== SCENE N =====\` seperti ini:

\`\`\`js
// ===== SCENE ${firstNum} =====
// kode scene ${firstNum} di sini
${secondNum ? `\n// ===== SCENE ${secondNum} =====\n// kode scene ${secondNum} di sini` : ''}
\`\`\`

Jangan menulis \`function(s, ctx)\`, DILARANG menulis \`import ...\`, \`export ...\`, JSX/React, jangan memecah jadi beberapa blok kode, jangan gunakan artifact/canvas, dan jangan menambahkan penjelasan di luar blok kode.`;

  return ensureAkhirPerintah(
    enrichPromptWithMedia(
      baseAnimPrompt,
      collectProjectPromptImages(project, { start: startSceneNumber, end: endSceneNumber })
    )
  );
}

/**
 * Builds the single-scene revision prompt (`prompt revisi per-scene udah jadi.md`).
 * Includes the full Canvas contract, the current scene's JS code, and the creator's revision note.
 */
export function buildSingleSceneRevisionPrompt(
  project: Partial<SatsetProject>,
  sceneIndex: number,
  revisionNote?: string
): string {
  const scenes = project.scenes || [];
  const scene = scenes[sceneIndex] || scenes[0];
  const sceneNum = scene?.scene_number || sceneIndex + 1;
  const currentCode =
    project.scene_codes?.[sceneNum] ||
    project.scene_codes?.[sceneIndex] ||
    `const enter = s.spring(0.05, "bouncy");\ns.box(360, 560, 220, 150, 70, { fill: s.c.brand1, draw: enter });`;
  const text = scene?.narration_text || scene?.voiceScript || '';
  const visual = scene?.visual || scene?.visualDescription || '';
  const theme = scene?.theme || 'paper';
  const dur = Number(scene?.target_duration_sec || scene?.durationSeconds || 5);
  const emphasis =
    Array.isArray(scene?.emphasis_words) && scene.emphasis_words.length > 0
      ? scene.emphasis_words.join(', ')
      : (scene as any)?.emphasis || '-';

  const words = text.split(/\s+/).filter(Boolean);
  const timings = words
    .map((w, i) => `${w} ${(0.0 + (i * Math.max(1.2, dur - 0.5)) / Math.max(words.length, 1)).toFixed(1)}`)
    .join(' · ');

  const gayaRaw = project.gaya_video || project.styleModule || 'scribble3d';
  const resolvedStyleId = resolveSatsetStyleId(gayaRaw === 'otomatis' ? 'scribble3d' : gayaRaw);
  const styleDef =
    getSatsetStyleDef(resolvedStyleId, 'crayon') || getSatsetStyleDef('scribble3d', 'crayon');
  const gayaTitle = styleDef?.label || 'Scribble 3D';
  const gayaHint = styleDef?.hint || 'scribble 3D: objek 3D low-poly, arsiran coretan, latar cerah bertitik';
  const gayaDirection = styleDef?.direction || `${gayaTitle}: ${gayaHint}.`;

  const ratio = (project.aspect_ratio || '9:16') as AspectRatio;
  const layout = getSatsetLayout(ratio === '16:9' || ratio === '1:1' || ratio === '3:4' ? ratio : '9:16');
  const ratioLabel =
    ratio === '16:9'
      ? 'lanskap 16:9'
      : ratio === '1:1'
      ? 'persegi 1:1'
      : ratio === '3:4'
      ? 'potret 3:4'
      : 'vertikal 9:16';

  const finishMode = styleDef?.finish || 'scribble';
  const finishSection =
    finishMode === 'glow'
      ? `## Finishing: MENYALA (glow)\nEngine otomatis membuat garis dan isian memancarkan cahaya sesuai warnanya, tanpa efek coretan. Pakai warna terang/jenuh kontras agar pendar cahayanya tajam.`
      : finishMode === 'glossy'
      ? `## Finishing: GLOSSY (kilap halus)\nObjek 3D tampil dengan permukaan mulus berkilau dan gradasi warna lembut tanpa coretan tinta.`
      : finishMode === 'scribble'
      ? `## Finishing: SCRIBBLE (arsiran tangan)\nObjek 3D dan 2D menampilkan tekstur coretan pensil/tinta serta garis tepi ekspresif.`
      : `## Finishing: GARIS BERSIH (clean)\nEngine menggambar semua bentuk dengan garis mulus dan warna rata, tanpa goyangan tangan dan tanpa arsiran pensil (wobble & hatch dimatikan otomatis). Fokus pada komposisi rapi, tipografi tajam, dan gerakan spring yang presisi.`;

  const charMode = resolveCharacterOption(project.character || 'auto');
  const charMeta = getCharacterMeta(charMode, project.custom_character);
  const hasFixedChar = charMode !== 'none' && charMode !== 'auto';
  const charSection =
    charMode === 'none'
      ? `Karakter: TANPA KARAKTER MANUSIA. Jangan menggambar orang/stickman/siluet wajah; gambarkan seluruh konsep lewat objek nyata, simbol, tipografi 3D, dan metafora visual.`
      : hasFixedChar
      ? `Tokoh UTAMA: "${charMeta.name}" (${charMeta.description}). Saat dia muncul, panggil \`s.person(x, y, { pose, size, facing })\` TANPA menimpa opsi pakaian & rambut. Setiap tokoh WAJIB faceless (tanpa wajah).`
      : `Belum ada tokoh tetap: semua orang dirakit engine dari Character Builder (lihat aturan \`who\` di bawah).`;

  const hasBrandCustom =
    project.brand_mode === 'custom' ||
    Boolean(project.warna_brand && project.warna_brand !== 'auto');
  const primaryHex = hasBrandCustom && project.warna_brand
    ? project.warna_brand
    : styleDef?.colors?.[0] || '#ff6a13';
  const secondaryHex =
    (hasBrandCustom && project.brand_secondary_color) ||
    styleDef?.colors?.[1] ||
    '#1e3a8a';
  const accentHex =
    (hasBrandCustom && project.brand_accent_color) ||
    styleDef?.colors?.[2] ||
    '#ffc93c';

  const customSubBox = project.subtitle_custom_box;
  const subCx = customSubBox ? Math.round(customSubBox.x + customSubBox.w / 2) : layout.cx;
  const subCy = customSubBox ? Math.round(customSubBox.y + customSubBox.h / 2) : layout.capY;
  const subtitleZoneLine = customSubBox
    ? `- Teks narasi (subtitle) dipindah kreator ke sekitar (${subCx}, ${subCy}): JANGAN menaruh tulisan lain atau titik fokus di kotak x ${customSubBox.x} - ${customSubBox.x + customSubBox.w}, y ${customSubBox.y} - ${customSubBox.y + customSubBox.h}; objek dan latar boleh lewat di belakangnya. Seluruh layar, termasuk bagian bawah, boleh dipakai ilustrasi.\n- PENTING - kreator memindahkan subtitle ke kotak x: ${customSubBox.x}, y: ${customSubBox.y} (rentang x: ${customSubBox.x}..${customSubBox.x + customSubBox.w}, y: ${customSubBox.y}..${customSubBox.y + customSubBox.h}).`
    : `- Zona subtitle berada di y = ${layout.capY} (pita ${layout.capBand[0]}..${layout.capBand[1]}). Jangan taruh elemen penting di situ.`;

  const rawExamples = getSatsetStyleExamples(resolvedStyleId);
  const exampleEntries: Array<[string, string]> =
    rawExamples && rawExamples.length > 0
      ? rawExamples.slice(0, 2)
      : getSatsetStyleDemoScenes(resolvedStyleId)
          .slice(0, 2)
          .map((d) => [d.text, d.code]);

  const examplesSection = exampleEntries
    .map(
      ([label, code], idx) =>
        `${idx === 0 ? `## Contoh TEKNIK gaya ${gayaTitle} (tiru hanya cara memakai primitif, warna, dan geraknya; JANGAN menyalin objek atau tata letaknya ke scene tugas)\n` : ''}### Contoh ${idx + 1}: "${label}"\n\`\`\`js\n${code.trim()}\n\`\`\``
    )
    .join('\n\n');

  const cleanNote = (revisionNote || '').trim() || 'Buat visual dan gerakannya lebih hidup, rapi, dan sesuai kalimat narasi.';

  const contractBlock = buildCanvasEngineContractBlock({
    gayaTitle,
    gayaHint,
    gayaDirection,
    ratioLabel,
    layout,
    subtitleZoneLine,
    charSection,
    primaryHex,
    secondaryHex,
    accentHex,
    finishSection,
    examplesSection,
  });

  const prompt = `${contractBlock}

## Tugas
Revisi kode animasi scene berikut.
- Teks: "${text}"
- Kata penekanan: ${emphasis}
- Visual: ${visual}
- Tema latar: ${theme} (pakai warna kontras dengan tema "${theme}")
- Durasi: ${dur} detik (ancang timing \`s.at\` sepanjang 0..${dur}s)
- Waktu kata diucapkan (detik): ${timings} — selaraskan \`s.at(detik, ...)\` dengan kemunculan kata yang bersangkutan, terutama kata penekanan.

Kode saat ini (REVISI KODE SAAT INI):
\`\`\`js
// ===== SCENE ${sceneNum} =====
${currentCode.trim()}
\`\`\`

Arahan revisi: ${cleanNote}

## Format jawaban
Jawab HANYA dengan satu blok kode \`\`\`js berisi body fungsi yang sudah direvisi (tanpa \`function(s, ctx)\`, tanpa penjelasan).
Jangan gunakan artifact/canvas dan jangan menambahkan penjelasan di luar format yang diminta.`;

  return ensureAkhirPerintah(prompt);
}

const THUMBNAIL_STYLE_DESCRIPTIONS: Record<string, { label: string; desc: string }> = {
  sesuai_video: {
    label: 'Sesuai Gaya Video',
    desc: 'ilustrasi sinematik bertekstur dengan kedalaman 3 lapis (latar jauh berkabut, panggung tengah dengan cahaya hangat, siluet depan), goresan tangan yang ekspresif tapi rapi',
  },
  pixar_3d: {
    label: 'Ilustrasi 3D Pixar/Studio',
    desc: 'render 3D studio lembut ala film animasi modern, material clay/matte halus, rim light hangat, kedalaman ruang sinematik',
  },
  ilustrasi_3d: {
    label: 'Ilustrasi 3D Pixar/Studio',
    desc: 'render 3D studio lembut ala film animasi modern, material clay/matte halus, rim light hangat, kedalaman ruang sinematik',
  },
  sinematik: {
    label: 'Sinematik Dramatis',
    desc: 'ilustrasi digital sinematik dengan kontras chiaroscuro kuat, sorot cahaya dramatis, atmosfer film dokumenter',
  },
  komik_tebal: {
    label: 'Komik Garis Tebal',
    desc: 'ilustrasi komik modern dengan garis tinta hitam tegas, bayangan cel-shading tajam, dan warna pop kontras',
  },
  anime: {
    label: 'Anime Sinematik',
    desc: 'ilustrasi anime layar lebar bergaya Makoto Shinkai dengan langit bercahaya, detail lingkungan kaya, dan warna emosional',
  },
  cat_air: {
    label: 'Cat Air Editorial',
    desc: 'lukisan cat air dan gouache di atas kertas bertekstur dengan sapuan kuas ekspresif dan tepi tinta halus',
  },
  retro_poster: {
    label: 'Poster Retro Vintage',
    desc: 'ilustrasi poster mid-century retro dengan tekstur screen-print/grain halus dan bentuk geometris tegas',
  },
  neon_cyber: {
    label: 'Neon Futuristik',
    desc: 'panggung gelap futuristik dengan pendar cahaya neon cyan, magenta, dan kuning elektrik yang kontras',
  },
  kertas_potong: {
    label: 'Papercut Berlapis',
    desc: 'diorama potongan kertas berlapis-lapis dengan bayangan jatuh nyata antar layer kertas bertekstur',
  },
  lempung_3d: {
    label: 'Claymation 3D',
    desc: 'kerajinan lempung/plastisin 3D buatan tangan dengan tekstur lembut dan pencahayaan studio hangat',
  },
  isometrik: {
    label: 'Diorama Isometrik 3D',
    desc: 'papan miniatur 3D sudut atas dengan bangunan dan objek detail yang rapi dan bersih',
  },
  sketsa_tinta: {
    label: 'Sketsa Tinta & Kapur',
    desc: 'goresan pena tinta dan arsiran silang ekspresif dengan aksen warna sorot yang tajam',
  },
  flat_modern: {
    label: 'Flat Editorial Modern',
    desc: 'ilustrasi vektor editorial modern ala Kurzgesagt dengan gradasi halus dan bentuk geometris tegas',
  },
  piksel_retro: {
    label: 'Pixel Art 16-Bit',
    desc: 'ilustrasi pixel art 16-bit detail tinggi dengan pencahayaan atmosferik modern',
  },
};

/**
 * Builds the ChatGPT / Image Generator Thumbnail prompt (`bagian thumbnail animasi prompt ChatGPT.md`).
 */
export function buildThumbnailAiPrompt(
  project: Partial<SatsetProject>,
  options?: {
    artStyle?: string;
    textMode?: 'with_text' | 'no_text';
    colorMode?: 'colorful' | 'brand' | 'rich';
    darkBg?: boolean;
  }
): string {
  const ratio = (project.aspect_ratio || '9:16') as AspectRatio;
  const res = getResolutionForAspectRatio(ratio);
  const orientLabel =
    ratio === '16:9'
      ? `Horizontal 16:9 (${res.width}x${res.height}, lanskap penuh)`
      : ratio === '1:1'
      ? `Persegi 1:1 (${res.width}x${res.height}, kotak penuh)`
      : `Vertikal ${ratio} (${res.width}x${res.height}, potret penuh untuk TikTok / Reels / YouTube Shorts)`;

  const hook = project.hook_structure || {
    atas: 'KATANYA ORANG SUKSES',
    besar: 'BANGUN PAGI',
    bawah: 'dan aku baru tahu kenapa.',
    scene: 1,
  };
  const atas = (hook.atas || 'RAHASIA DI BALIK').trim();
  const besar = (hook.besar || 'LANGKAH PERTAMA').trim();
  const bawah = (hook.bawah || 'dan aku baru tahu kenapa.').trim();
  const fullHookText = `${atas} / ${besar} / ${bawah}`.trim();

  const scenes = project.scenes || [];
  const storySummary = scenes
    .slice(0, 6)
    .map((s) => s.narration_text || s.voiceScript || '')
    .filter(Boolean)
    .join(' ')
    .slice(0, 650);

  const keywordsList = Array.from(
    new Set(
      scenes
        .flatMap((s) => s.emphasis_words || s.emphasisWords || [(s as any).emphasis])
        .filter(Boolean)
    )
  )
    .slice(0, 6)
    .join(', ');

  const sceneVisualBullets =
    scenes.length > 0
      ? scenes
          .slice(0, 4)
          .map((s) => `  - ${(s.visual || s.visualDescription || s.narration_text || '').trim()}`)
          .join('\n')
      : '  - Adegan utama dengan objek metafora yang kontras dan emosional.';

  const charMode = resolveCharacterOption(project.character || 'auto');
  const charMeta = getCharacterMeta(charMode, project.custom_character);
  const tokohLine =
    charMode === 'none'
      ? 'Tanpa karakter manusia (fokus pada objek utama dan lingkungan)'
      : `${charMeta.name} (${charMeta.description}, tanpa wajah/faceless)`;

  const artStyleKey = options?.artStyle || project.thumbnail_art_style || 'sesuai_video';
  const styleEntry =
    THUMBNAIL_STYLE_DESCRIPTIONS[artStyleKey] || THUMBNAIL_STYLE_DESCRIPTIONS.sesuai_video;

  const textMode = options?.textMode || project.thumbnail_text_mode || 'with_text';
  const colorMode = options?.colorMode || project.thumbnail_color_mode || 'colorful';
  const darkBg = options?.darkBg ?? project.thumbnail_dark_bg ?? false;

  const brandColors = [
    project.warna_brand || '#ff6a13',
    project.brand_secondary_color || '#1e3a8a',
    project.brand_accent_color || '#ffc93c',
  ].join(', ');

  const colorSection =
    colorMode === 'brand'
      ? `Gunakan palet warna brand utama (${brandColors}) yang kontras tinggi${darkBg ? ' di atas latar belakang gelap dramatis' : ''}.`
      : `Warna kaya, hidup, dan kontras tinggi${darkBg ? ' di atas latar belakang gelap dramatis' : ''}. Bebas memilih warna yang paling pas dengan suasana cerita (hangat keemasan, biru malam, hijau segar, merah dramatis, dll.) supaya subjek utama langsung menonjol dari latar.`;

  const textSection =
    textMode === 'no_text'
      ? `## Teks di gambar
Mode TANPA TEKS:
- JANGAN menulis huruf, angka, kata, atau tipografi apa pun di dalam gambar (kosongkan ruang atas ~35% agar kreator bisa menaruh judul sendiri).`
      : `## Teks di gambar
Tulis judul singkat di sepertiga atas gambar, huruf tebal besar yang mudah dibaca di layar HP:
- Baris kecil di atas: "${atas}"
- Kata utama PALING BESAR & warna mencolok (kuning/oranye/putih dengan outline gelap tebal): "${besar}"
- Baris bawah: "${bawah}"
Ejaan Bahasa Indonesia HARUS persis seperti di atas, jangan ditambah atau diubah. Selain teks judul ini, jangan taruh tulisan, angka, watermark, atau logo lain.`;

  const prompt = `Buatkan GAMBAR thumbnail video sekarang. Langsung generate gambarnya, jangan tanya balik dan jangan balas dengan teks saja.
Buatkan 1 gambar THUMBNAIL video pendek yang langsung bikin orang berhenti scroll.

## Ukuran
${orientLabel}. Gambar harus memenuhi seluruh kanvas dari tepi ke tepi tanpa bingkai atau ruang kosong di pinggir.

## Gaya gambar
${styleEntry.desc}.

## Warna
${colorSection}

## Isi video (thumbnail harus menggambarkan ini)
- Judul: "${project.project_title || project.title || 'Video Motion Graphics'}"
- Hook video: ${fullHookText}
- Narasi: "${storySummary || fullHookText}"
- Kata kunci: ${keywordsList || besar}
- Adegan di video:
${sceneVisualBullets}
- Tokoh utama: ${tokohLine}

## Komposisi
- Satu adegan fokus yang langsung menceritakan inti video dalam sekali lirik (bukan kolase banyak kotak).
- Subjek utama besar dan jelas di tengah-bawah (sekitar 55-75% tinggi kanvas), dengan pencahayaan dramatis dan kedalaman latar (depan-tengah-belakang).
- Sisakan ruang yang agak bersih di sepertiga atas kanvas untuk teks judul supaya tidak menutupi objek utama.

${textSection}

## Wajib tanpa wajah
Setiap tokoh manusia WAJIB TANPA WAJAH (faceless mannequin): kepala mulus polos tanpa mata, alis, hidung, atau mulut. Ekspresi hanya dari bahasa tubuh, tangan, dan pose. Jangan menaruh wajah pada benda apa pun.`;

  return ensureAkhirPerintah(prompt);
}

/**
 * Builds the standalone SEO Metadata regeneration prompt (`bagian judul animasi prompt.md`).
 */
export function buildSeoMetadataPrompt(project: Partial<SatsetProject>): string {
  const projectId = project.id || 'p_video_1';
  const title = project.project_title || project.title || 'Video Pendek';
  const scenes = project.scenes || [];
  const numberedScript =
    scenes.length > 0
      ? scenes
          .map((s, idx) => `${s.scene_number || idx + 1}. ${(s.narration_text || s.voiceScript || '').trim()}`)
          .filter((line) => line.length > 3)
          .join('\n')
      : `1. ${title}`;

  const prompt = `Kamu ahli SEO media sosial (YouTube, TikTok, Reels) untuk video pendek. Tulis metadata upload video-video berikut supaya cepat ditemukan lewat pencarian.

## SEO YouTube ("seo")
## Aturan
- Untuk setiap video, tentukan 1 KATA KUNCI UTAMA (frasa 2-4 kata yang benar-benar diketik orang di kolom cari, bukan kalimat puitis) dan 2-3 kata kunci turunan, sesuai bahasa naskahnya.
- "title": maksimal 70 karakter, kata kunci utama di awal + alasan jujur untuk mengklik (manfaat, angka, atau rasa penasaran) sesuai isi naskah. Tanpa HURUF KAPITAL SEMUA, tanpa hashtag, maksimal 1 emoji.
- "description": deskripsi panjang (YouTube) yang RAPI, dipisah baris kosong ("\\n\\n") dan baris baru ("\\n"), BUKAN satu paragraf:
  1) Pembuka 1-2 kalimat pendek: kata kunci utama di kalimat pertama + manfaat video.
  2) Baris judul bagian (mis. "Di video ini:"), lalu 3-4 poin satu per baris diawali emoji yang cocok (mis. "✅ ", "💡 "), singkat (maks ~12 kata), diambil dari isi naskah.
  3) Kalimat penutup + baris ajakan spesifik (simpan/bagikan; untuk promosi: ajakan dari naskah).
  Maksimal ~700 karakter, bahasa santai sesuai naskah, tanpa hashtag (ditambahkan otomatis).
- "short": caption pendek TikTok/Reels/Shorts, 1-2 kalimat (maksimal ~150 karakter) yang bikin penasaran, bahasa santai sesuai naskah, boleh 1 emoji, tanpa hashtag, jangan sama persis dengan judul.
- "tags": 10-15 kata kunci (kata kunci utama, variasi/sinonim, long-tail spesifik, 2-3 topik umum), huruf kecil, tanpa "#", total < 400 karakter.
- "hashtags": 4-6 hashtag yang benar-benar dipakai orang untuk topik ini (2-3 spesifik isi video, 1-2 niche/komunitas, maks 1 umum yang tetap nyambung), huruf kecil tanpa spasi. DILARANG hashtag generik (#viral, #fyp, #foryou, #trending, #explore) dan "#shorts" atau "#satsetmotion" (ditambahkan otomatis).

## Video
### 1. id: ${projectId}
Judul sekarang: ${title}
Naskah:
${numberedScript}

## Format jawaban
Jawab HANYA dengan satu blok kode \`\`\`json berisi:
{
  "videos": [
    {
      "id": "${projectId}",
      "seo": {
        "title": "judul pencarian <= 70 karakter",
        "description": "deskripsi rapi dengan \\n\\n dan poin ber-emoji",
        "short": "caption pendek <= 150 karakter",
        "tags": ["kata kunci", "..."],
        "hashtags": ["#spesifik", "..."]
      }
    }
  ]
}
Jangan menambahkan penjelasan di luar blok JSON.`;

  return ensureAkhirPerintah(prompt);
}

export const SAMPLE_AI_NARASI_JSON = `{
  "title": "Kenapa Pagi Terasa Berat?",
  "seo": {
    "title": "Kenapa Pagi Terasa Berat? Rahasia Bangun Pagi Tanpa Malas",
    "description": "Sering merasa malas dan berat saat bangun pagi? Masalahnya bukan kamu kurang motivasi, tapi cara memulai yang keliru.\\n\\nDi video ini:\\n✅ Alasan kenapa semangat bukan syarat untuk bergerak\\n💡 Metafora dua magnet: kasur vs pekerjaan\\n🚀 Trik 2 menit pertama yang memutus rasa malas\\n\\nSimpan video ini biar besok pagi gak malas lagi!",
    "short": "Ternyata orang sukses gak nunggu semangat buat bangun pagi. Ini trik 2 menitnya!",
    "tags": ["bangun pagi", "cara berhenti malas", "produktivitas", "motivasi pagi", "disiplin diri"],
    "hashtags": ["#bangunpagi", "#produktif", "#motivasiindonesia", "#disiplindiri"]
  },
  "hook": {
    "atas": "KATANYA ORANG SUKSES",
    "besar": "BANGUN PAGI",
    "bawah": "PADAHAL ADA YANG SALAH",
    "scene": 8
  },
  "background": {
    "paper": { "top": "#d9eefb", "bottom": "#fbf1e4", "pattern": "none" },
    "dusk": { "top": "#d9eefb", "bottom": "#fbf1e4", "pattern": "none" },
    "night": { "top": "#c9d6f2", "bottom": "#f7d9cf", "pattern": "none" }
  },
  "scenes": [
    {
      "text": "Katanya orang sukses itu selalu bangun pagi penuh semangat. Padahal kenyataannya gak selalu begitu, banyak dari mereka juga sempat malas.",
      "visual": "[Kamar pagi] Shot kamera: close-up jam weker 3D berdering di meja. Pemeran: aku (pria). Jam weker bergetar keras lalu tangan meraih tombol tunda.",
      "theme": "paper",
      "duration": 7.5,
      "emphasis": "semangat",
      "camera": "push"
    },
    {
      "text": "Banyak orang mengira rasa malas di pagi hari bakal hilang sendiri kalau kita diam sambil menunggu mood dan semangat datang duluan.",
      "visual": "[Meja konsep] Shot kamera: wide sudut atas. Dua magnet 3D muncul di papan: satu menarik ke kasur empuk, satu menarik ke meja kerja.",
      "theme": "paper",
      "duration": 7.5,
      "emphasis": "menunggu",
      "camera": "pan-left"
    },
    {
      "text": "Padahal semangat itu bukan syarat buat mulai bergerak. Justru semakin lama kamu diam rebahan, tarikan kasurnya terasa makin berat banget.",
      "visual": "[Kamar pagi] Shot kamera: medium dari samping kasur. Bidak silinder tertarik mendekati kasur, indikator batang merah naik perlahan.",
      "theme": "paper",
      "duration": 7.5,
      "emphasis": "kasur",
      "camera": "tilt-down"
    },
    {
      "text": "Bayangkan tubuhmu sekarang seperti benda yang terjebak tepat di tengah dua gaya tarik magnet besar yang terus saling berebut kendali.",
      "visual": "[Panggung konsep] Shot kamera: orbit pelan. Garis gaya magnet menyala biru dan oranye memperlihatkan tegangan antara rebahan dan aksi.",
      "theme": "paper",
      "duration": 7.5,
      "emphasis": "magnet",
      "camera": "orbit"
    },
    {
      "text": "Cara memutus tarikannya sederhana banget: cukup duduk tegak, berdiri pelan, lalu langsung kerjakan satu tugas paling kecil selama dua menit.",
      "visual": "[Kamar kerja] Shot kamera: pan-right mengikuti 3 kartu langkah. Checklist 3 langkah muncul bertahap: duduk tegak, berdiri pelan, mulai 2 menit.",
      "theme": "paper",
      "duration": 7.5,
      "emphasis": "berdiri",
      "camera": "pan-right"
    },
    {
      "text": "Jadi jangan tunggu sampai kamu pengen bergerak. Begitu badanmu mulai jalan duluan, rasa semangatnya otomatis bakal buru-buru ikut menyusul.",
      "visual": "[Meja kerja] Shot kamera: low angle menatap grafik. Batang 3D toska tumbuh pesat menunjukkan energi yang melonjak setelah 2 menit bergerak.",
      "theme": "paper",
      "duration": 7.5,
      "emphasis": "menyusul",
      "camera": "push"
    },
    {
      "text": "Kamu gak perlu langsung memenangkan perang melawan rasa malas sepanjang hari. Cukup fokus menang di sepuluh menit pertama setelah melek.",
      "visual": "[Panggung fokus] Shot kamera: tilt-up ke arah stopwatch 10 menit. Indikator target sepuluh menit pertama bersinar terang dengan lencana kemenangan.",
      "theme": "paper",
      "duration": 7.5,
      "emphasis": "menang",
      "camera": "tilt-up"
    },
    {
      "text": "Besok pagi pas alarm bunyi, langsung hitung mundur tiga detik lalu berdiri dari kasur. Simpan dan follow biar gak lupa!",
      "visual": "[Kamar cerah] Shot kamera: pull mundur memperlihatkan seluruh ruang rapi. Kartu data putih terangkat menampilkan tips 3 detik dan tombol simpan.",
      "theme": "paper",
      "duration": 7.5,
      "emphasis": "follow",
      "camera": "pull"
    }
  ]
}`;

/**
 * Validates and parses user/AI JSON input conforming to 5-ideas, scene blueprint, or standalone SEO metadata.
 */
export function parseAndValidateAIBlueprint(rawJson: string): {
  success: boolean;
  project?: Partial<SatsetProject>;
  error?: string;
} {
  try {
    let clean = rawJson.trim();

    // Extract JSON block if surrounded by markdown code fences
    const jsonMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      clean = jsonMatch[1].trim();
    } else {
      if (clean.startsWith('```json')) clean = clean.slice(7);
      if (clean.startsWith('```')) clean = clean.slice(3);
      if (clean.endsWith('```')) clean = clean.slice(0, -3);
      clean = clean.trim();
    }

    // Try finding the first '{' or '[' and last '}' or ']'
    const firstBrace = clean.search(/[{\[]/);
    const lastBrace = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'));
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(clean);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Format JSON tidak valid atau bukan objek.' };
    }

    // Format 0A: { "videos": [ { "id": "...", "seo": { ... } } ] } from `bagian judul animasi prompt.md`
    if (
      !Array.isArray(parsed) &&
      Array.isArray(parsed.videos) &&
      parsed.videos.length > 0 &&
      parsed.videos[0]?.seo
    ) {
      const seoObj = parsed.videos[0].seo;
      return {
        success: true,
        project: {
          project_title: seoObj.title || undefined,
          seo: {
            title: seoObj.title || '',
            description: seoObj.description || '',
            short: seoObj.short || '',
            tags: Array.isArray(seoObj.tags) ? seoObj.tags : [],
            hashtags: Array.isArray(seoObj.hashtags) ? seoObj.hashtags : [],
          },
        },
      };
    }

    // Format 0B: Standalone SEO object (either { seo: { ... } } or flat { title, description, short, tags, hashtags })
    if (
      !Array.isArray(parsed) &&
      !parsed.ideas &&
      !parsed.scenes &&
      (parsed.seo || typeof parsed.description === 'string' || typeof parsed.short === 'string' || Array.isArray(parsed.hashtags))
    ) {
      const seoSource = parsed.seo && typeof parsed.seo === 'object' ? parsed.seo : parsed;
      return {
        success: true,
        project: {
          project_title: seoSource.title || parsed.title || undefined,
          seo: {
            title: seoSource.title || parsed.title || '',
            description: seoSource.description || '',
            short: seoSource.short || '',
            tags: Array.isArray(seoSource.tags) ? seoSource.tags : [],
            hashtags: Array.isArray(seoSource.hashtags) ? seoSource.hashtags : [],
          },
        },
      };
    }

    // Format 1: Response contains ideas array (from Step 1: Ide)
    const rawIdeas = Array.isArray(parsed) ? parsed : Array.isArray(parsed.ideas) ? parsed.ideas : null;
    if (rawIdeas && rawIdeas.length > 0 && !parsed.scenes) {
      const ideas = rawIdeas.map((item: any, idx: number) => {
        const id = `idea-${idx + 1}-${Date.now().toString(36)}`;
        const title = item.title || `Ide 0${idx + 1}`;
        const hook = item.hook || item.hookProposal || '';
        const angle = item.angle || '';
        const visualStyle = item.visualStyle || '';

        const sentences = angle
          .split(/[.!?]/)
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 8);

        return {
          id,
          title,
          hookProposal: hook,
          hook,
          angle,
          visualStyle,
          corePoints: sentences.length > 0 ? sentences.slice(0, 3) : ['Fokus pesan utama', 'Langkah konkret', 'Evaluasi harian'],
          targetAudience: 'Penonton media sosial muda',
        };
      });

      const selected = ideas[0];
      const initialScenes: SatsetScene[] = [
        {
          id: `sc-1-${Date.now().toString(36)}`,
          scene_number: 1,
          role: 'hook',
          target_duration_sec: 7.5,
          durationSeconds: 7.5,
          narration_text: selected.angle || selected.title,
          voiceScript: selected.angle || selected.title,
          on_screen_text: selected.hook || selected.title.toUpperCase(),
          hookText: selected.hook || selected.title.toUpperCase(),
          emphasis_words: selected.hook ? selected.hook.replace(/\//g, '').split(' ').filter((w: string) => w.length > 4).slice(0, 3) : ['STOP', 'MULAI'],
          visual_animation: {
            layout: 'centered_title_with_floating_icons',
            remotion_animation: 'spring_pop_in',
            asset_elements: ['warning_badge'],
          },
          sfx: { file: 'whoosh_impact.mp3', type: 'whoosh', play_at_second: 0.0 },
          ...(parsed.gaya_video || parsed.styleModule
            ? { visualModule: parsed.gaya_video || parsed.styleModule }
            : {}),
          accentColor: '#2563EB',
          secondaryColor: '#facc15',
          sfxCue: 'pop',
        },
        {
          id: `sc-2-${Date.now().toString(36)}`,
          scene_number: 2,
          role: 'body_core_point',
          target_duration_sec: 7.5,
          durationSeconds: 7.5,
          narration_text: selected.corePoints?.[0] || 'Lakukan sekarang tanpa menunggu sempurna.',
          voiceScript: selected.corePoints?.[0] || 'Lakukan sekarang tanpa menunggu sempurna.',
          on_screen_text: 'Tindakan Nyata > Rencana',
          hookText: 'Tindakan Nyata > Rencana',
          emphasis_words: ['Tindakan', 'Nyata'],
          visual_animation: {
            layout: 'split_text_and_graphic',
            remotion_animation: 'slide_from_bottom',
            asset_elements: ['calendar_check'],
          },
          sfx: { file: 'pop_ding.mp3', type: 'pop', play_at_second: 0.2 },
          ...(parsed.gaya_video || parsed.styleModule
            ? { visualModule: parsed.gaya_video || parsed.styleModule }
            : {}),
          accentColor: '#facc15',
          secondaryColor: '#38bdf8',
          sfxCue: 'whoosh',
        },
        {
          id: `sc-3-${Date.now().toString(36)}`,
          scene_number: 3,
          role: 'cta',
          target_duration_sec: 7.5,
          durationSeconds: 7.5,
          narration_text: 'Simpan video ini dan bagikan ke temanmu!',
          voiceScript: 'Simpan video ini dan bagikan ke temanmu!',
          on_screen_text: 'Simpan & Share Video Ini!',
          hookText: 'Simpan & Share Video Ini!',
          emphasis_words: ['Simpan', 'Share'],
          visual_animation: {
            layout: 'call_to_action_banner',
            remotion_animation: 'pulse_heartbeat',
            asset_elements: ['bookmark_icon'],
          },
          sfx: { file: 'notification_chime.mp3', type: 'bell', play_at_second: 0.2 },
          ...(parsed.gaya_video || parsed.styleModule
            ? { visualModule: parsed.gaya_video || parsed.styleModule }
            : {}),
          accentColor: '#2563EB',
          secondaryColor: '#facc15',
          sfxCue: 'ding',
        },
      ];

      return {
        success: true,
        project: {
          project_title: selected.title,
          idea_concepts: ideas,
          selected_idea_id: selected.id,
          scenes: initialScenes,
          target_duration_sec: 60,
          durationSeconds: 60,
          step_ide_done: true,
        },
      };
    }

    // Format 2: Full scenes blueprint (Step 2: Naskah / Narasi)
    if (!Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
      return { success: false, error: 'JSON harus memiliki array "ideas", array "scenes", atau objek "seo".' };
    }

    const hookData = parsed.hook;
    const formattedHook =
      hookData && typeof hookData === 'object' && hookData.atas && hookData.besar && hookData.bawah
        ? `${hookData.atas} / ${hookData.besar} / ${hookData.bawah}`
        : null;

    const scenes: SatsetScene[] = parsed.scenes.map((s: any, idx: number) => {
      const dur = typeof s.duration === 'number' ? s.duration : typeof s.target_duration_sec === 'number' ? s.target_duration_sec : (s.durationSeconds || 7.5);
      const narration = s.text || s.narration_text || s.voiceScript || '';
      
      // Determine on-screen headline
      let onScreen = s.on_screen_text || s.hookText || '';
      if (!onScreen) {
        if (idx === 0 && formattedHook) {
          onScreen = formattedHook;
        } else if (idx === parsed.scenes.length - 1) {
          onScreen = 'Simpan & Share Video Ini!';
        } else if (s.emphasis) {
          const cap = typeof s.emphasis === 'string' ? s.emphasis.toUpperCase() : 'POIN PENTING';
          onScreen = `Fokus: ${cap}`;
        } else {
          onScreen = `Poin 0${idx + 1}`;
        }
      }

      // Emphasis words
      let emphasis: string[] = [];
      if (Array.isArray(s.emphasis_words)) {
        emphasis = s.emphasis_words;
      } else if (Array.isArray(s.emphasisWords)) {
        emphasis = s.emphasisWords;
      } else if (typeof s.emphasis === 'string' && s.emphasis.trim()) {
        emphasis = [s.emphasis.trim()];
      } else if (onScreen) {
        emphasis = onScreen.split(' ').filter((w: string) => w.length > 4).slice(0, 2);
      }

      const role =
        s.role || (idx === 0 ? 'hook' : idx === parsed.scenes.length - 1 ? 'cta' : 'body_core_point');

      const rawAiSfx =
        typeof s.sfxCue === 'string' && s.sfxCue.trim()
          ? s.sfxCue.trim()
          : typeof s.sfx === 'string' && s.sfx.trim()
          ? s.sfx.trim()
          : Array.isArray(s.sfx) && s.sfx.length > 0 && typeof s.sfx[0] === 'string'
          ? s.sfx[0].trim()
          : s.sfx && typeof s.sfx === 'object' && typeof s.sfx.type === 'string' && s.sfx.type.trim()
          ? s.sfx.type.trim()
          : '';

      const sfxCue =
        rawAiSfx ||
        (idx === 0
          ? 'whoosh'
          : idx === parsed.scenes.length - 1
          ? 'ding'
          : idx % 2 === 0
          ? 'ding'
          : 'pop');

      return {
        id: `sc-${idx + 1}-${Date.now().toString(36)}`,
        scene_number: s.scene_number || idx + 1,
        role,
        target_duration_sec: dur,
        narration_text: narration,
        on_screen_text: onScreen,
        emphasis_words: emphasis,
        visual_animation: s.visual_animation || {
          layout: idx === 0 ? 'centered_title_with_floating_icons' : idx === parsed.scenes.length - 1 ? 'call_to_action_banner' : 'split_text_and_graphic',
          remotion_animation: idx === 0 ? 'spring_pop_in' : 'slide_from_bottom',
          asset_elements: s.visual ? [s.visual.slice(0, 30)] : ['star_icon'],
        },
        sfx:
          s.sfx && typeof s.sfx === 'object' && !Array.isArray(s.sfx)
            ? s.sfx
            : {
                file:
                  sfxCue === 'whoosh'
                    ? 'whoosh_impact.mp3'
                    : sfxCue === 'ding'
                    ? 'pop_ding.mp3'
                    : `${sfxCue.replace(/[^a-z0-9_-]/gi, '_').toLowerCase()}.mp3`,
                type: sfxCue as any,
                play_at_second: 0.1,
              },
        // Extended narrative properties
        sceneNumber: s.scene_number || idx + 1,
        headline: onScreen,
        durationSeconds: dur,
        hookText: onScreen,
        voiceScript: narration,
        emphasisWords: emphasis,
        ...(s.visualModule || parsed.gaya_video
          ? { visualModule: s.visualModule || parsed.gaya_video }
          : {}),
        ...(s.media_key || s.asset_key ? { media_key: s.media_key || s.asset_key } : {}),
        ...(s.media_filename || s.asset_name
          ? { media_filename: s.media_filename || s.asset_name }
          : {}),
        ...(s.asset_motion_preset ? { asset_motion_preset: s.asset_motion_preset } : {}),
        ...(s.asset_motion_prompt ? { asset_motion_prompt: s.asset_motion_prompt } : {}),
        accentColor: idx === 0 ? '#2563EB' : idx === parsed.scenes.length - 1 ? '#10b981' : '#2a9d8f',
        secondaryColor: '#facc15',
        sfxCue,
        visualDescription: s.visual || onScreen,
        visual: s.visual,
        camera: s.camera || (idx === 0 ? 'push' : idx % 2 === 0 ? 'orbit' : 'pan-left'),
        theme: s.theme || 'paper',
      };
    });

    const totalDur = scenes.reduce((acc, cur) => acc + (cur.target_duration_sec || cur.durationSeconds || 7.5), 0);

    return {
      success: true,
      project: {
        project_title: parsed.title || parsed.project_title || 'Kenapa Pagi Terasa Berat?',
        ...(parsed.aspect_ratio ? { aspect_ratio: parsed.aspect_ratio } : {}),
        ...(parsed.fps ? { fps: parsed.fps } : {}),
        ...(parsed.bgm_style ? { bgm_style: parsed.bgm_style } : {}),
        target_duration_sec: Math.round(totalDur),
        durationSeconds: Math.round(totalDur),
        scene_count: scenes.length,
        ...(parsed.gaya_video || parsed.styleModule
          ? { gaya_video: parsed.gaya_video || parsed.styleModule }
          : {}),
        seo: parsed.seo,
        hook_structure: parsed.hook,
        background_themes: parsed.background,
        scenes,
        step_ide_done: true,
        step_naskah_done: true,
      },
    };
  } catch (err: any) {
    return { success: false, error: `Gagal mem-parsing JSON: ${err.message}` };
  }
}



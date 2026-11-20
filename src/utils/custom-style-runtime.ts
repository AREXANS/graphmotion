import { type CustomStyleDefinition } from '../types/custom-style.ts';
import './custom-character-renderer.ts';
import {
  SATSET_BUILTIN_STYLES,
  SATSET_FONT_LIST,
  SATSET_BG_PATTERNS,
  getAllSatsetStyles,
  registerCustomSatsetStyles,
  getSatsetStyleDef,
  createSatsetSContext,
  getSatsetScenePalette,
  isSatsetThemeDark,
  withSatsetRatio,
  getSatsetLayout,
  resolveSatsetFonts,
  loadSatsetFontObjects,
  renderSatsetBgDef,
  renderSatsetBgPattern,
} from './satset-cloud-engine.ts';
import {
  SATSET_TRANSITIONS,
  SATSET_CAPTION_MODES,
  SATSET_CAMERA_MODES,
  SATSET_STYLE_TRANSITION_POOLS,
  CAPTION_SIZES,
  CAPTION_POSITIONS,
  CAPTION_WIDTH_OPTIONS,
  PACE_MODES,
  DEFAULT_SATSET_PROJECT_META,
  compileSatsetSceneCode,
  renderSatsetSceneFrame,
  renderSatsetTimelineFrame,
  renderSatsetTransitionFrame,
  renderSatsetSubtitle,
  computeSatsetCameraTransform,
  resolveSatsetTransitionId,
  getSatsetTransitionDuration,
  getSatsetTransitionSfx,
  resolveSatsetCaptionMode,
  resolveSatsetCameraMode,
  chunkSatsetNarration,
  computeSatsetWordTimings,
  preloadSatsetProjectAssets,
  getCachedSatsetBgCanvas,
  collectSatsetSfxTimeline,
  playSatsetRawSfx,
  playPaperSfx,
  registerCustomStyleAudioEngine,
  scheduleSatsetSfxTimeline,
  getSatsetStyleSfxFlavor,
  mapSatsetSfxToFlavor,
  SATSET_SFX_NAMES,
  SATSET_STYLE_SFX_FLAVORS,
} from './satset-renderer-engine.ts';
import {
  SATSET_STYLE_ID_ALIASES,
  resolveSatsetStyleId,
  getSatsetStyleDemoScenes,
  getSatsetStyleExamples,
  SATSET_DEFAULT_DEMO_SCENES,
  type SatsetDemoScene,
} from './satset-style-demos.ts';

export {
  SATSET_BUILTIN_STYLES,
  SATSET_FONT_LIST,
  SATSET_BG_PATTERNS,
  SATSET_TRANSITIONS,
  SATSET_CAPTION_MODES,
  SATSET_CAMERA_MODES,
  SATSET_STYLE_TRANSITION_POOLS,
  CAPTION_SIZES,
  CAPTION_POSITIONS,
  CAPTION_WIDTH_OPTIONS,
  PACE_MODES,
  DEFAULT_SATSET_PROJECT_META,
  SATSET_STYLE_ID_ALIASES,
  SATSET_DEFAULT_DEMO_SCENES,
  getAllSatsetStyles,
  registerCustomSatsetStyles,
  getSatsetStyleDef,
  createSatsetSContext,
  getSatsetScenePalette,
  isSatsetThemeDark,
  withSatsetRatio,
  getSatsetLayout,
  resolveSatsetFonts,
  loadSatsetFontObjects,
  renderSatsetBgDef,
  renderSatsetBgPattern,
  compileSatsetSceneCode,
  renderSatsetSceneFrame,
  renderSatsetTimelineFrame,
  renderSatsetTransitionFrame,
  renderSatsetSubtitle,
  computeSatsetCameraTransform,
  resolveSatsetTransitionId,
  getSatsetTransitionDuration,
  getSatsetTransitionSfx,
  resolveSatsetCaptionMode,
  resolveSatsetCameraMode,
  chunkSatsetNarration,
  computeSatsetWordTimings,
  preloadSatsetProjectAssets,
  getCachedSatsetBgCanvas,
  collectSatsetSfxTimeline,
  playSatsetRawSfx,
  playPaperSfx,
  registerCustomStyleAudioEngine,
  scheduleSatsetSfxTimeline,
  getSatsetStyleSfxFlavor,
  mapSatsetSfxToFlavor,
  SATSET_SFX_NAMES,
  SATSET_STYLE_SFX_FLAVORS,
  resolveSatsetStyleId,
  getSatsetStyleDemoScenes,
  getSatsetStyleExamples,
};
export type { SatsetDemoScene };

/**
 * Maps legacy or UI subtitle style names to satsetmotion.id's 16 caption modes:
 * pop, tangan, ketik, sorot, stiker, karaoke, kotak, gelap, glitch, panduan, elegan, satu, neon, selotip, garis, redup, off
 */
export const CAPTION_STYLE_TO_SATSET_MAP: Record<string, string> = {
  // Native satsetmotion.id caption modes
  auto: 'auto',
  pop: 'pop',
  tangan: 'tangan',
  ketik: 'ketik',
  sorot: 'sorot',
  stiker: 'stiker',
  karaoke: 'karaoke',
  kotak: 'kotak',
  gelap: 'gelap',
  glitch: 'glitch',
  panduan: 'panduan',
  elegan: 'elegan',
  satu: 'satu',
  neon: 'neon',
  selotip: 'selotip',
  garis: 'garis',
  redup: 'redup',
  off: 'off',
  none: 'off',
  // Legacy project subtitle names -> mapped to authentic satsetmotion.id caption modes
  pill_pop: 'stiker',
  bold_stroke: 'pop',
  word_box: 'kotak',
  minimal_fade: 'elegan',
  neon_glow: 'neon',
  comic_badge: 'sorot',
};

export function normalizeSatsetCaptionMode(captionStyle?: string | null, showSubtitles = true): string | undefined {
  if (!showSubtitles || captionStyle === 'none' || captionStyle === 'off') return 'off';
  if (!captionStyle || captionStyle === 'auto') return undefined; // undefined lets style default take over!
  return CAPTION_STYLE_TO_SATSET_MAP[captionStyle] || captionStyle;
}

/**
 * Maps legacy or UI camera motion names to satsetmotion.id's 11 camera modes:
 * push, pull, pan-left, pan-right, tilt-up, tilt-down, roll, orbit, crash, handheld, shake
 */
export const CAMERA_MOTION_TO_SATSET_MAP: Record<string, string> = {
  auto: 'auto',
  Auto: 'auto',
  push: 'push',
  pull: 'pull',
  'pan-left': 'pan-left',
  'pan-right': 'pan-right',
  'tilt-up': 'tilt-up',
  'tilt-down': 'tilt-down',
  roll: 'roll',
  orbit: 'orbit',
  crash: 'crash',
  handheld: 'handheld',
  shake: 'shake',
  // Legacy and website walkthrough camera names
  static: 'push',
  zoom_in: 'push',
  zoom_in_dramatic: 'push',
  slow_push_in: 'push',
  zoom_in_cta: 'crash',
  zoom_out: 'pull',
  zoom_out_reveal: 'pull',
  pan_left: 'pan-left',
  pan_left_smooth: 'pan-left',
  pan_right: 'pan-right',
  pan_right_smooth: 'pan-right',
  pan_up: 'tilt-up',
  tilt_up_hero: 'tilt-up',
  pan_down: 'tilt-down',
  float: 'orbit',
  focus_center: 'orbit',
  punch_in: 'crash',
  whip_pan: 'shake',
  dutch_tilt: 'roll',
};

export function normalizeSatsetCameraMode(cameraMotion?: string | null): string | undefined {
  if (!cameraMotion || cameraMotion === 'auto' || cameraMotion === 'Auto') return undefined;
  return CAMERA_MOTION_TO_SATSET_MAP[cameraMotion] || cameraMotion;
}

/**
 * Maps legacy or UI transition names to satsetmotion.id's 17 transitions:
 * whip-left, whip-right, whip-up, whip-down, zoom, spin, iris, wipe, swipe, glitch, flash, blinds, drop, fade, dip, blur, sambung
 */
export const TRANSITION_TO_SATSET_MAP: Record<string, string> = {
  auto: 'auto',
  otomatis: 'auto',
  'match-morph': 'match-morph',
  match_morph: 'match-morph',
  'cinema-whip': 'cinema-whip',
  cinema_whip: 'cinema-whip',
  'luma-dissolve': 'luma-dissolve',
  luma_dissolve: 'luma-dissolve',
  'depth-focus': 'depth-focus',
  depth_focus: 'depth-focus',
  'editorial-split': 'editorial-split',
  editorial_split: 'editorial-split',
  'whip-left': 'whip-left',
  'whip-right': 'whip-right',
  'whip-up': 'whip-up',
  'whip-down': 'whip-down',
  zoom: 'zoom',
  spin: 'spin',
  iris: 'iris',
  wipe: 'wipe',
  swipe: 'swipe',
  glitch: 'glitch',
  flash: 'flash',
  blinds: 'blinds',
  drop: 'drop',
  fade: 'fade',
  dip: 'dip',
  blur: 'blur',
  sambung: 'sambung',
  // Indonesian UI TransitionOption IDs
  geser_kiri: 'whip-left',
  geser_kanan: 'whip-right',
  geser_atas: 'whip-up',
  geser_bawah: 'whip-down',
  fade_lembut: 'fade',
  zoom_tembus: 'zoom',
  putar: 'spin',
  lingkaran: 'iris',
  sapu_miring: 'wipe',
  sapuan_warna: 'swipe',
  kilas_kamera: 'flash',
  tirai: 'blinds',
  jatuh_membal: 'drop',
  blur_lembut: 'blur',
  menyusut: 'blur',
  celuk_gelap: 'dip',
  menyambung: 'sambung',
  // Legacy names
  cut: 'fade',
  slide_left: 'whip-left',
  slide_up: 'whip-up',
  zoom_punch: 'zoom',
  whip_pan: 'whip-left',
  iris_circle: 'iris',
  glitch_slice: 'glitch',
  diagonal_wipe: 'wipe',
  film_flash: 'flash',
};

export function normalizeSatsetTransitionId(transition?: string | null): string | undefined {
  if (!transition || transition === 'auto' || transition === 'otomatis') return undefined;
  return TRANSITION_TO_SATSET_MAP[transition] || transition;
}

/**
 * Adapts custom style scene code to ANY aspect ratio ('9:16', '1:1', '3:4', '16:9')
 * with automatic safe-frame containment so custom scenes authored in 720x1280 or 1080x1920
 * never get cut off at the top/left/right/bottom edges or collide with bottom subtitles.
 */
export function normalizeCustomSceneCodeTo1080(rawCode: string, safeScale = 0.92): string {
  if (!rawCode) return '';
  if (rawCode.includes('__satsetSafeRatioAdapted')) return rawCode;

  // Detect if an external AI authored the scene in 1080x1920 coordinates instead of Satset's native 720x1280
  const has360 = /\b360\b/.test(rawCode);
  const hasExplicit1080 = /\b(1080|1920)\b/.test(rawCode);
  const has540CenterOnly = !has360 && /\b540\b/.test(rawCode);
  const is1080Authored = hasExplicit1080 || has540CenterOnly;

  // Check if scene has its own virtual camera rig or full-bleed workbench background
  const hasOwnCameraOrWorkbench =
    /VIRTUAL\s+CAMERA|camZoom|camScale|s\.rect\(\s*-\d+\s*,\s*-\d+\s*,\s*1\d{3}/i.test(rawCode);

  // Expand full-bleed backdrop rects (e.g. s.rect(-560, -560, 1120, 1120, ...)) and cutting-mat grid loops
  // so that when scaled down into widescreen 16:9 or 1:1 aspect ratios, the workbench/space backdrop fills 100% edge-to-edge
  const expandedBackdropCode = rawCode
    .replace(
      /s\.rect\(\s*-(?:4\d\d|5\d\d|6\d\d|7\d\d|8\d\d|9\d\d|1\d{3})\s*,\s*-(?:4\d\d|5\d\d|6\d\d|7\d\d|8\d\d|9\d\d|1\d{3})\s*,\s*(?:9\d\d|1\d{3}|2\d{3})\s*,\s*(?:9\d\d|1\d{3}|2\d{3})\s*,/g,
      's.rect(-2400, -2400, 4800, 4800,'
    )
    .replace(/for\s*\(\s*let\s+g\s*=\s*-8\s*;\s*g\s*<=\s*8\s*;\s*g\+\+\s*\)/g, 'for (let g = -22; g <= 22; g++)')
    .replace(/-520,\s*g\s*\*\s*(52|54),\s*520/g, '-1200, g * $1, 1200')
    .replace(/g\s*\*\s*(52|54),\s*-520,\s*g\s*\*\s*(52|54),\s*520/g, 'g * $1, -1200, g * $2, 1200');

  const srcW = is1080Authored ? 1080 : 720;
  const srcH = is1080Authored ? 1920 : 1280;
  const srcCx = is1080Authored ? 540 : 360;
  // Scenes with top/bottom HUD cards (y: 110..650, center ~392) vs general illustration center (418)
  const srcCy = is1080Authored ? 705 : hasOwnCameraOrWorkbench ? 392 : 418;
  // Active visual bounding box of authored content (above subtitle area)
  const srcContentW = is1080Authored ? 980 : 660;
  const srcContentH = is1080Authored ? 1140 : 660;
  const clampedSafe = Math.max(0.7, Math.min(1.15, Number.isFinite(safeScale) ? safeScale : 0.92));

  // Prepend // @advanced so satset-renderer-engine's pn() does NOT apply a redundant
  // automatic camera zoom (St: 1.08..1.26x) + vertical shift (an) that would crop HUD cards!
  return `// @advanced
/* __satsetSafeRatioAdapted */
const __realW = s.W || 720;
const __realH = s.H || 1280;
const __aspect = __realW / Math.max(1, __realH);
const __isLandscape = __aspect > 1.15;
const __isSquareOr43 = __aspect >= 0.72 && __aspect <= 1.15;
const __topPad = __isLandscape ? __realH * 0.04 : __isSquareOr43 ? __realH * 0.045 : __realH * 0.055;
const __botReserve = __isLandscape ? __realH * 0.19 : __isSquareOr43 ? __realH * 0.21 : __realH * 0.27;
const __availW = __realW * (__isLandscape ? 0.93 : 0.96);
const __availH = Math.max(180, __realH - __topPad - __botReserve);
const __realCx = __realW * 0.5;
const __realCy = __topPad + __availH * 0.5;
const __srcW = ${srcW};
const __srcH = ${srcH};
const __srcCx = ${srcCx};
const __srcCy = ${srcCy};
const __fitScale = Math.min(__availW / ${srcContentW}, __availH / ${srcContentH}) * ${clampedSafe.toFixed(3)};
ctx.save();
ctx.translate(__realCx, __realCy);
ctx.scale(__fitScale, __fitScale);
ctx.translate(-__srcCx, -__srcCy);
s.W = __srcW;
s.H = __srcH;
s.cx = __srcCx;
s.cy = __srcCy;
try {
${expandedBackdropCode}
} finally {
  s.W = __realW;
  s.H = __realH;
  s.cx = __realCx;
  s.cy = __realCy;
  ctx.restore();
}`;
}

export function inferSatsetRatioFromDimensions(
  width: number,
  height: number
): '9:16' | '1:1' | '3:4' | '16:9' {
  if (width > height * 1.15) return '16:9';
  if (Math.abs(width - height) < 40) return '1:1';
  const aspect = width / Math.max(1, height);
  if (aspect >= 0.7 && aspect <= 0.82) return '3:4';
  return '9:16';
}

export function syncCustomStylesToSatsetEngine(customStyles: CustomStyleDefinition[]) {
  if (!Array.isArray(customStyles)) return;
  const converted = customStyles.map((cs) => {
    if (cs.customAudioCode) {
      registerCustomStyleAudioEngine(cs.id, cs.customAudioCode);
    }
    if (cs.sfxFlavor) {
      (SATSET_STYLE_SFX_FLAVORS as Record<string, string>)[cs.id] = cs.sfxFlavor;
    } else if (cs.finish === 'craft' || cs.background?.paper?.pattern === 'craft') {
      (SATSET_STYLE_SFX_FLAVORS as Record<string, string>)[cs.id] = 'paper';
    }
    const colors: [string, string, string] = [
      cs.colors?.[0] || '#FF8A3D',
      cs.colors?.[1] || '#4ECDC4',
      cs.colors?.[2] || '#FFE66D',
    ];
    const bgSource = cs.bg || cs.background;
    const makeBgSlot = (slot: { top: string; bottom: string; pattern?: string }, defaultDark: boolean) => {
      const mark = defaultDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';
      return {
        name: slot.pattern || 'custom',
        label: slot.pattern || 'custom',
        top: slot.top,
        bottom: slot.bottom,
        pattern: slot.pattern || 'none',
        mark,
        grid: mark,
        dark: defaultDark,
      };
    };
    const safeScale = cs.safeScale ?? 0.92;
    const demoScenes: SatsetDemoScene[] = [1, 2, 3, 4].map((num, idx) => {
      const defScene = SATSET_DEFAULT_DEMO_SCENES[idx] || SATSET_DEFAULT_DEMO_SCENES[0];
      const customMeta = cs.demoMeta?.[num as 1 | 2 | 3 | 4];
      const dur = cs.sceneDurations?.[num] || 4.2;
      return {
        text: customMeta?.text || defScene.text,
        emphasis: customMeta?.emphasis || defScene.emphasis,
        theme: (customMeta?.theme || defScene.theme || (num === 2 ? 'dusk' : num === 3 ? 'night' : 'paper')) as
          | 'paper'
          | 'dusk'
          | 'night',
        code: normalizeCustomSceneCodeTo1080(cs.scenes?.[num as 1 | 2 | 3 | 4] || '', safeScale),
        duration: dur,
      };
    });
    return {
      id: cs.id,
      label: cs.name,
      hint: cs.hint || cs.prompt?.slice(0, 72) || 'Gaya buatan sendiri',
      look: cs.look === '3d' ? 'scribble3d' : cs.look || '2d',
      finish: cs.finish === 'clean' || cs.finish === 'craft' ? 'flat' : cs.finish || 'flat',
      colors,
      accent: cs.accent || colors[0],
      caption: cs.caption || (cs.finish === 'glow' ? 'neon' : cs.finish === 'craft' ? 'selotip' : 'pop'),
      calmCamera: true,
      continuous: !!cs.continuous,
      plainBg: !!cs.plainBg,
      sfxFlavor: cs.sfxFlavor || (cs.finish === 'craft' ? 'paper' : undefined),
      customAudioCode: cs.customAudioCode,
      sceneDurations: cs.sceneDurations,
      bg: {
        paper: makeBgSlot(bgSource?.paper || { top: '#FFFDF7', bottom: '#F4EFE6', pattern: 'dots' }, false),
        dusk: makeBgSlot(bgSource?.dusk || { top: '#1E293B', bottom: '#0F172A', pattern: 'grid' }, true),
        night: makeBgSlot(bgSource?.night || { top: '#090D16', bottom: '#05070B', pattern: 'stars' }, true),
      },
      direction: cs.direction || cs.prompt || '',
      demo: demoScenes,
    };
  });
  registerCustomSatsetStyles(converted);
}

/**
 * Renders the 4-scene live demo of any style (built-in or custom) at `timeSec` onto `ctx`,
 * automatically scaling from logical layout coordinates (720x1280 / 960x960 / 768x1024 / 1280x720)
 * to `(canvasWidth, canvasHeight)`.
 */
export function renderSatsetStyleLiveDemoFrame(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  styleId: string,
  timeSec: number,
  options?: {
    ratio?: '9:16' | '1:1' | '3:4' | '16:9';
    safeScale?: number;
    customStyle?: CustomStyleDefinition;
    captionOverride?: string;
    transitionOverride?: string;
    pace?: 'tenang' | 'energik';
    brandColors?: string[];
  }
) {
  if (options?.customStyle) {
    syncCustomStylesToSatsetEngine([options.customStyle]);
  }
  const resolvedId = options?.customStyle ? options.customStyle.id : resolveSatsetStyleId(styleId);
  const styleDef = getSatsetStyleDef(resolvedId, 'crayon') || getSatsetStyleDef('scribble3d', 'crayon');
  const ratio =
    options?.ratio ||
    options?.customStyle?.preferredRatio ||
    inferSatsetRatioFromDimensions(canvasWidth, canvasHeight);
  const layout = getSatsetLayout(ratio);
  const safeScale = options?.safeScale ?? options?.customStyle?.safeScale ?? 0.92;

  const customDemo: SatsetDemoScene[] | undefined = options?.customStyle
    ? ([1, 2, 3, 4] as const).map((num, idx) => {
        const defScene = SATSET_DEFAULT_DEMO_SCENES[idx] || SATSET_DEFAULT_DEMO_SCENES[0];
        const meta = options.customStyle?.demoMeta?.[num];
        const dur = options.customStyle?.sceneDurations?.[num] || 4.2;
        return {
          text: meta?.text || defScene.text,
          emphasis: meta?.emphasis || defScene.emphasis,
          theme: (meta?.theme || defScene.theme) as 'paper' | 'dusk' | 'night',
          code: normalizeCustomSceneCodeTo1080(options.customStyle?.scenes?.[num] || '', safeScale),
          duration: dur,
        };
      })
    : styleDef?.demo;

  const scenes = getSatsetStyleDemoScenes(resolvedId, customDemo);
  const totalDur = scenes.reduce((acc, s) => acc + (s.duration || 4.2), 0) || 16.8;
  const loopedT = ((timeSec % totalDur) + totalDur) % totalDur;

  const projectMeta = {
    look: styleDef?.look || 'scribble3d',
    art: resolvedId,
    pace: options?.pace || (styleDef?.calmCamera ? 'tenang' : 'energik'),
    ratio,
    caption: options?.captionOverride ? normalizeSatsetCaptionMode(options.captionOverride, true) : undefined,
    transition: options?.transitionOverride ? normalizeSatsetTransitionId(options.transitionOverride) : undefined,
    brand: options?.brandColors?.length ? { colors: options.brandColors } : undefined,
  };

  ctx.save();
  ctx.scale(canvasWidth / layout.W, canvasHeight / layout.H);
  renderSatsetTimelineFrame(ctx, scenes, loopedT, undefined, projectMeta);
  ctx.restore();
}

export function getSatsetStyleDemoSfxTimeline(
  styleId: string,
  options?: {
    ratio?: '9:16' | '1:1' | '3:4' | '16:9';
    safeScale?: number;
    customStyle?: CustomStyleDefinition;
    captionOverride?: string;
    transitionOverride?: string;
    pace?: 'tenang' | 'energik';
    brandColors?: string[];
  }
) {
  if (options?.customStyle) {
    syncCustomStylesToSatsetEngine([options.customStyle]);
  }
  const resolvedId = options?.customStyle ? options.customStyle.id : resolveSatsetStyleId(styleId);
  const styleDef = getSatsetStyleDef(resolvedId, 'crayon') || getSatsetStyleDef('scribble3d', 'crayon');
  const ratio = options?.ratio || options?.customStyle?.preferredRatio || '9:16';
  const safeScale = options?.safeScale ?? options?.customStyle?.safeScale ?? 0.92;

  const customDemo: SatsetDemoScene[] | undefined = options?.customStyle
    ? ([1, 2, 3, 4] as const).map((num, idx) => {
        const defScene = SATSET_DEFAULT_DEMO_SCENES[idx] || SATSET_DEFAULT_DEMO_SCENES[0];
        const meta = options.customStyle?.demoMeta?.[num];
        const dur = options.customStyle?.sceneDurations?.[num] || 4.2;
        return {
          text: meta?.text || defScene.text,
          emphasis: meta?.emphasis || defScene.emphasis,
          theme: (meta?.theme || defScene.theme) as 'paper' | 'dusk' | 'night',
          code: normalizeCustomSceneCodeTo1080(options.customStyle?.scenes?.[num] || '', safeScale),
          duration: dur,
        };
      })
    : styleDef?.demo;

  const scenes = getSatsetStyleDemoScenes(resolvedId, customDemo);
  const totalDur = scenes.reduce((acc, s) => acc + (s.duration || 4.2), 0) || 16.8;

  const projectMeta = {
    look: styleDef?.look || 'scribble3d',
    art: resolvedId,
    pace: options?.pace || (styleDef?.calmCamera ? 'tenang' : 'energik'),
    ratio,
    caption: options?.captionOverride ? normalizeSatsetCaptionMode(options.captionOverride, true) : undefined,
    transition: options?.transitionOverride ? normalizeSatsetTransitionId(options.transitionOverride) : undefined,
    brand: options?.brandColors?.length ? { colors: options.brandColors } : undefined,
  };

  const events = collectSatsetSfxTimeline(scenes, projectMeta);
  return { events, totalDur, projectMeta, scenes };
}

export interface MotionEngineOptions {
  time: number;
  duration: number;
  width: number;
  height: number;
  theme: 'paper' | 'dusk' | 'night';
  style: CustomStyleDefinition;
  narration?: string;
  emphasis?: string;
  wordTimings?: Array<{ text: string; at: number; end: number; key: boolean }>;
  sfxCallback?: (name: string, atSecond?: number, volume?: number, pitch?: number) => void;
}

export function resolveColor(
  c: string | undefined,
  palette: Record<string, string>,
  theme: 'paper' | 'dusk' | 'night',
  isDark: boolean
): string {
  if (!c) return palette.ink;
  if (c === 'none' || c === 'transparent') return 'rgba(0,0,0,0)';
  if (palette[c]) return palette[c];
  return c;
}

export function renderCustomBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: 'paper' | 'dusk' | 'night',
  bgDef: CustomStyleDefinition['bg'],
  palette: Record<string, string>,
  time: number
) {
  const slot = bgDef?.[theme] || bgDef?.paper || { top: '#FFFDF7', bottom: '#F4EFE6', pattern: 'dots' };
  const isDark = theme !== 'paper';
  const mark = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';
  const ratio = inferSatsetRatioFromDimensions(width, height);
  const layout = getSatsetLayout(ratio);
  ctx.save();
  ctx.scale(width / layout.W, height / layout.H);
  withSatsetRatio(ratio, () => {
    renderSatsetBgPattern(ctx, {
      name: slot.pattern || 'none',
      label: slot.pattern || 'none',
      top: slot.top,
      bottom: slot.bottom,
      pattern: slot.pattern || 'none',
      mark,
      grid: mark,
      dark: isDark,
    });
  });
  ctx.restore();
}

export function createMotionEngineContext(ctx: CanvasRenderingContext2D, opts: MotionEngineOptions) {
  syncCustomStylesToSatsetEngine([opts.style]);
  const isDark = opts.theme !== 'paper';
  const s: any = createSatsetSContext(
    ctx,
    opts.time,
    opts.duration,
    opts.theme,
    opts.style.look || '2d',
    opts.sfxCallback,
    {
      colors: opts.style.colors || ['#FF8A3D', '#4ECDC4', '#FFE66D'],
      finish: opts.style.finish || 'flat',
      art: opts.style.id,
      dark: isDark,
      degrees: false,
    }
  );

  // Add s.canvas(w, h) offscreen pixel helper for 1-bit dither / pixel-art custom scenes
  if (!s.canvas) {
    const offscreenCache = new Map<string, HTMLCanvasElement>();
    s.canvas = (w: number, h: number) => {
      const cw = Math.max(1, Math.round(w));
      const ch = Math.max(1, Math.round(h));
      const key = `${cw}x${ch}`;
      let off = offscreenCache.get(key);
      if (!off && typeof document !== 'undefined') {
        off = document.createElement('canvas');
        off.width = cw;
        off.height = ch;
        offscreenCache.set(key, off);
      }
      const octx = off?.getContext('2d');
      if (octx) {
        octx.setTransform(1, 0, 0, 1, 0, 0);
        octx.clearRect(0, 0, cw, ch);
      }
      return {
        ctx: octx || ctx,
        draw: (x = 0, y = 0, dw = 720, dh = 1280, drawOpts?: { smoothing?: boolean; alpha?: number }) => {
          if (!off) return;
          ctx.save();
          if (drawOpts?.alpha !== undefined) ctx.globalAlpha *= Math.max(0, Math.min(1, drawOpts.alpha));
          ctx.imageSmoothingEnabled = drawOpts?.smoothing ?? false;
          ctx.drawImage(off, x, y, dw, dh);
          ctx.restore();
        },
      };
    };
  }

  const rawText = opts.narration || 'Mulai langkah pertamamu sekarang';
  const rawWords = rawText.split(/\s+/).filter(Boolean);
  const emphasisSet = new Set(
    (opts.emphasis || '')
      .toLowerCase()
      .split(/[\s,]+/)
      .filter(Boolean)
  );
  s.caption = {
    text: rawText,
    words:
      opts.wordTimings ||
      rawWords.map((w, idx) => {
        const clean = w.toLowerCase().replace(/[^a-z0-9]/gi, '');
        const step = (opts.duration * 0.72) / Math.max(1, rawWords.length);
        return {
          text: w,
          at: idx * step,
          end: (idx + 1) * step,
          key: emphasisSet.has(clean) || idx === rawWords.length - 1,
        };
      }),
  };

  return s;
}

export function executeCustomScene(
  ctx: CanvasRenderingContext2D,
  code: string,
  opts: MotionEngineOptions
): { ok: boolean; error?: string } {
  const ratio = opts.style.preferredRatio || inferSatsetRatioFromDimensions(opts.width, opts.height);
  const layout = getSatsetLayout(ratio);
  const safeScale = opts.style.safeScale ?? 0.92;
  ctx.save();
  try {
    renderCustomBackground(ctx, opts.width, opts.height, opts.theme, opts.style.bg, {}, opts.time);
    ctx.scale(opts.width / layout.W, opts.height / layout.H);
    withSatsetRatio(ratio, () => {
      const s = createMotionEngineContext(ctx, opts);
      const adaptedCode = normalizeCustomSceneCodeTo1080(code, safeScale);
      const fn = compileSatsetSceneCode(adaptedCode);
      if (fn instanceof Error) {
        throw fn;
      }
      fn(s, ctx);
    });
    ctx.restore();
    return { ok: true };
  } catch (err: any) {
    ctx.restore();
    return {
      ok: false,
      error: err?.message || 'Runtime error pada kode scene.',
    };
  }
}

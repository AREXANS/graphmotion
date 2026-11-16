import { SatsetProject } from '../types/satset';
import { getStoredCustomStyles } from './custom-style-parser';
import {
  syncCustomStylesToSatsetEngine,
  resolveSatsetStyleId,
  getSatsetStyleDef,
  getSatsetStyleDemoScenes,
  normalizeSatsetCaptionMode,
  normalizeSatsetCameraMode,
  normalizeSatsetTransitionId,
  SatsetDemoScene,
} from './custom-style-runtime';
import { computePreciseSceneWordTimings } from './pipeline-sync';
import { getEngineCharacterConfig } from './character-catalog';
import {
  isExecutableSatsetSceneCode,
  sanitizeSingleSceneCode,
} from './scene-code-parser';
import {
  buildContextualSatsetSceneCode,
  isAutoContextualSceneCode,
  resolveAutoStyleForConceptAndScene,
} from './contextual-scene-builder';
import { detectMentionedPlatforms } from './platform-logos';
import {
  ensureWebsitePromoSnapshotsRegistered,
  registerSceneUploadedMediaAsset,
} from './website-media-engine';

export interface BuiltSatsetTimeline {
  timelineScenes: any[];
  projectMeta: Record<string, any>;
  totalDurationSec: number;
  ratio: '9:16' | '1:1' | '16:9' | '3:4';
}

export function buildSatsetTimelineForProject(
  project: SatsetProject
): BuiltSatsetTimeline {
  const customStyles = getStoredCustomStyles();
  syncCustomStylesToSatsetEngine(customStyles);

  const rawRatio = project.aspect_ratio || '9:16';
  const ratio: '9:16' | '1:1' | '16:9' | '3:4' =
    rawRatio === '16:9'
      ? '16:9'
      : rawRatio === '1:1'
      ? '1:1'
      : rawRatio === '3:4'
      ? '3:4'
      : '9:16';

  const scenes = project.scenes && project.scenes.length > 0 ? project.scenes : [];
  if (project.website_promo && scenes.length > 0) {
    ensureWebsitePromoSnapshotsRegistered(project.website_promo, scenes);
  }
  scenes.forEach((sc) => registerSceneUploadedMediaAsset(sc));
  const activeScene = scenes[0];

  const isAutoStyle = !project.gaya_video || project.gaya_video === 'otomatis';
  const autoResolvedProject = resolveAutoStyleForConceptAndScene(project, activeScene, 0);
  const rawStyleId = isAutoStyle
    ? autoResolvedProject.styleId
    : project.gaya_video ||
      (activeScene?.visualModule && activeScene.visualModule !== 'otomatis'
        ? activeScene.visualModule
        : autoResolvedProject.styleId);
  const customFound = customStyles.find((cs) => cs.id === rawStyleId);
  const resolvedArt = customFound ? customFound.id : resolveSatsetStyleId(rawStyleId);
  const styleDef =
    getSatsetStyleDef(resolvedArt, 'crayon') || getSatsetStyleDef('scribble3d', 'crayon');

  const customDemo: SatsetDemoScene[] | undefined = customFound
    ? ([1, 2, 3, 4] as const).map((num, idx) => ({
        text: customFound.demoMeta?.[num]?.text || `Scene ${num}`,
        emphasis: customFound.demoMeta?.[num]?.emphasis || '',
        theme: (customFound.demoMeta?.[num]?.theme ||
          (idx === 1 ? 'dusk' : idx === 2 ? 'night' : 'paper')) as 'paper' | 'dusk' | 'night',
        code: customFound.scenes?.[num] || '',
        duration: 3,
      }))
    : styleDef?.demo;

  const baseDemoScenes = getSatsetStyleDemoScenes(resolvedArt, customDemo);
  const bgOverride = (project as any).background_override as string | undefined;

  const sourceList = scenes.length > 0 ? scenes : baseDemoScenes;
  const builtScenes = sourceList.map((s: any, idx: number) => {
    const sceneNum = idx + 1;
    const fallbackDemo = baseDemoScenes[idx % baseDemoScenes.length] || baseDemoScenes[0];

    const sceneStyleId = isAutoStyle
      ? resolveSatsetStyleId(resolveAutoStyleForConceptAndScene(project, s, idx).styleId)
      : s.visualModule && s.visualModule !== 'otomatis'
      ? resolveSatsetStyleId(s.visualModule)
      : resolvedArt;
    const sceneDemoPool =
      sceneStyleId !== resolvedArt ? getSatsetStyleDemoScenes(sceneStyleId) : baseDemoScenes;
    const styleDemoForIdx = sceneDemoPool[idx % sceneDemoPool.length] || fallbackDemo;

    const rawUserCode = project.scene_codes?.[sceneNum] || s.customCode || s.code;
    const cleanedUserCode = rawUserCode ? sanitizeSingleSceneCode(rawUserCode) : '';
    const hasManualCustomCode =
      !isAutoContextualSceneCode(rawUserCode) && isExecutableSatsetSceneCode(cleanedUserCode);

    const contextualBuilt =
      scenes.length > 0
        ? buildContextualSatsetSceneCode(s, project, idx, sourceList.length)
        : null;
    const hasScrapedOrUploadedMedia = Boolean(
      s.website_step || project.website_promo || s.media_url || s.media_key
    );
    const userCodeAlreadyDrawsPhoto = /\bs\.photo\s*\(/.test(cleanedUserCode);
    const resolvedMediaKey = String(
      s.media_key || (s.website_step ? `web_step_${sceneNum}` : '')
    ).replace(/"/g, '\\"');

    // When a scene has scraped website images/videos (or uploaded tutorial media) and custom AI code is provided,
    // run the custom AI animation code as the primary visual and add a compact proportional PiP media card if s.photo() wasn't already called.
    const compactPipSnippet =
      hasScrapedOrUploadedMedia && resolvedMediaKey && !userCodeAlreadyDrawsPhoto
        ? `\n// Proportional Scraped/Uploaded Media PiP Reference Card\n(() => {\n  const W = s.W || 720, H = s.H || 1280, sc = Math.min(W / 720, H / 1280);\n  const kPip = s.t < 0.04 ? 1 : Math.max(0.25, s.pop(0.12, 0.38));\n  const pipW = 215 * sc, pipH = 132 * sc;\n  const pipX = ${idx % 2 === 0 ? 'W * 0.72' : 'W * 0.28'}, pipY = H * 0.22 + s.wave(0.9, 4 * sc);\n  s.group({ x: pipX, y: pipY, scale: Math.max(0.1, kPip), rotate: ${idx % 2 === 0 ? '-0.03' : '0.03'} }, () => {\n    s.card(-pipW * 0.5 - 6 * sc, -pipH * 0.5 - 6 * sc, pipW + 12 * sc, pipH + 12 * sc, { r: 14 * sc, fill: "#0f172a", stroke: s.c.brand1, width: 2.5 * sc });\n    s.photo("${resolvedMediaKey}", 0, 0, pipW, pipH, { frame: "none", r: 10 * sc, zoom: 1.04 + s.clamp(s.t / 4, 0, 0.14), fx: 0.5, fy: 0.4, draw: kPip, time: s.t });\n  });\n})();`
        : '';

    const effectiveCode = hasManualCustomCode
      ? `${cleanedUserCode}${compactPipSnippet}`
      : contextualBuilt?.code || styleDemoForIdx.code;

    const rawTheme =
      bgOverride === 'paper' || bgOverride === 'terang'
        ? 'paper'
        : bgOverride === 'dusk' || bgOverride === 'tengah'
        ? 'dusk'
        : bgOverride === 'night' || bgOverride === 'gelap'
        ? 'night'
        : sceneStyleId === 'editorial_motion_grid' && contextualBuilt?.theme
        ? contextualBuilt.theme
        : s.theme ||
          s.background_theme ||
          contextualBuilt?.theme ||
          styleDemoForIdx.theme ||
          (idx % 3 === 1 ? 'dusk' : idx % 3 === 2 ? 'night' : 'paper');

    const narration =
      s.narration_text ||
      s.voiceScript ||
      s.text ||
      s.on_screen_text ||
      s.hookText ||
      styleDemoForIdx.text ||
      '';

    const emphasisArr = s.emphasis_words || s.emphasisWords;
    const emphasis = Array.isArray(emphasisArr)
      ? emphasisArr.join(' ')
      : typeof s.emphasis === 'string'
      ? s.emphasis
      : styleDemoForIdx.emphasis || '';

    const dur = Math.max(
      0.5,
      Number(s.target_duration_sec || s.durationSeconds || s.duration || 3.5)
    );

    const rawWordTimings = s.word_timings || s.wordTimings;
    const narrationWords = narration.trim().split(/\s+/).filter(Boolean);
    const precise = computePreciseSceneWordTimings(
      narration,
      Array.isArray(emphasisArr) ? emphasisArr : emphasis.split(/\s+/),
      project.tempo === 'santai' ? 'santai' : 'energik',
      dur
    );
    const wordAt =
      Array.isArray(rawWordTimings) && rawWordTimings.length === narrationWords.length
        ? rawWordTimings.map((wt: any) => Number(wt.startSec ?? wt.at ?? 0))
        : precise.wordAt;
    const wordTimings =
      Array.isArray(rawWordTimings) && rawWordTimings.length === narrationWords.length
        ? rawWordTimings.map((wt: any, wi: number) => {
            const start = Math.max(0, Number(wt.startSec ?? wt.at ?? 0));
            const rawEnd = wt.endSec ?? wt.end;
            const end = Math.min(
              dur,
              Math.max(start + 0.08, rawEnd !== undefined ? Number(rawEnd) : start + 0.28)
            );
            return {
              text: String(wt.word ?? wt.text ?? narrationWords[wi] ?? ''),
              at: start,
              end,
              key: Boolean(wt.isEmphasis ?? wt.key),
            };
          })
        : precise.wordTimings.map((wt) => ({
            text: wt.word,
            at: wt.startSec,
            end: wt.endSec,
            key: Boolean(wt.isEmphasis),
          }));

    const DEFAULT_CAMERAS = ['push', 'pan-right', 'tilt-up', 'orbit', 'pull', 'pan-left', 'push', 'crash'];
    const normalizedCam =
      normalizeSatsetCameraMode(
        s.camera_movement || s.cameraMotion || s.camera || (project as any).camera_mode
      ) || DEFAULT_CAMERAS[idx % DEFAULT_CAMERAS.length];

    const scenePlatforms = detectMentionedPlatforms(
      `${s.narration_text || s.voiceScript || s.text || ''} ${s.on_screen_text || s.hookText || ''} ${project.topik_video || ''} ${project.project_title || ''}`,
      3
    );

    const resolveStyleDefaultCue = (styleKey: string, sIdx: number, total: number): string => {
      const st = String(styleKey || '').toLowerCase();
      const isFirst = sIdx === 0;
      const isLast = sIdx === total - 1;
      if (/voxel|pixel|8bit|retro|mabar|neongame|dither/.test(st)) {
        return isFirst ? 'laser' : isLast ? 'coin' : sIdx % 2 === 0 ? 'blip' : 'coin';
      }
      if (/paper|kolase|arsip|diorama|edukasi|zine|scrapbook/.test(st)) {
        return isFirst ? 'pageflip' : isLast ? 'stamp' : sIdx % 2 === 0 ? 'paper' : 'pageflip';
      }
      if (/chalk|kapur|sketsa|blueprint|oneline/.test(st)) {
        return isFirst ? 'chalk' : isLast ? 'snap' : sIdx % 2 === 0 ? 'tock' : 'chalk';
      }
      if (/precision|isometrik|belah|garis|mekanik/.test(st)) {
        return isFirst ? 'whip' : isLast ? 'snap' : sIdx % 2 === 0 ? 'tick' : 'tock';
      }
      if (/terminal|kilat|glitch|matrix|code/.test(st)) {
        return isFirst ? 'glitch' : isLast ? 'notify' : sIdx % 2 === 0 ? 'type' : 'beep';
      }
      if (/worldforge|roma|mars|monofilm|hyper_zoom|cinema|noir/.test(st)) {
        return isFirst ? 'boom' : isLast ? 'impact' : sIdx % 2 === 0 ? 'whoosh' : 'riser';
      }
      if (/lempung|clay|bounce|sticker|confetti|popart|heboh/.test(st)) {
        return isFirst ? 'boing' : isLast ? 'tada' : sIdx % 2 === 0 ? 'pop' : 'step';
      }
      if (/cair|liquid|bubble|aurora|glow|cahaya|tenang|kuas|siluet|rasi|cerita/.test(st)) {
        return isFirst ? 'swish' : isLast ? 'magic' : sIdx % 2 === 0 ? 'bubble' : 'drop';
      }
      if (/kaset|tiket|vhs|vinyl/.test(st)) {
        return isFirst ? 'shutter' : isLast ? 'cash' : sIdx % 2 === 0 ? 'scratch' : 'shutter';
      }
      if (/editorial|mograph|infopop|pitch|uiweb|panduan|carakerja|modern|produk|reel|kinetik/.test(st)) {
        return isFirst ? 'swipe' : isLast ? 'correct' : sIdx % 2 === 0 ? 'cursor_click' : 'data_scan';
      }
      return isFirst ? 'whoosh' : isLast ? 'ding' : 'card_slide';
    };

    const rawExplicitCue = s.sfxCue || s.sfx?.type;
    const isGenericDefaultCue =
      !rawExplicitCue ||
      rawExplicitCue === 'whoosh' ||
      rawExplicitCue === 'pop' ||
      rawExplicitCue === 'ding' ||
      rawExplicitCue === 'whoosh_impact';

    return {
      text: narration,
      emphasis,
      theme: (rawTheme === 'dusk' || rawTheme === 'night' ? rawTheme : 'paper') as
        | 'paper'
        | 'dusk'
        | 'night',
      styleId: sceneStyleId,
      visualModule: sceneStyleId,
      platforms: scenePlatforms,
      code: effectiveCode,
      codeDuration: isAutoContextualSceneCode(effectiveCode) ? dur : (s as any).codeDuration,
      duration: dur,
      camera: normalizedCam,
      transition: normalizeSatsetTransitionId(
        s.transition_type || s.transition || project.transition
      ),
      sfxCue: isGenericDefaultCue
        ? resolveStyleDefaultCue(sceneStyleId, idx, sourceList.length)
        : rawExplicitCue,
      website_step: s.website_step,
      media_url: s.media_url,
      media_type: s.media_type,
      media_key: s.media_key,
      captionPos:
        s.captionPos ||
        (sceneStyleId === 'editorial_motion_grid' ? { x: 0.33, y: 0.82 } : 'auto'),
      wordAt,
      wordTimings,
      captionHidden: (project as any).show_subtitles === false,
    };
  });

  const rawCaptionStyle =
    project.subtitle_style || project.subtitleStyle || (project as any).caption_mode;
  const mappedCaption =
    !rawCaptionStyle ||
    rawCaptionStyle === 'satsetYellow' ||
    rawCaptionStyle === 'otomatis' ||
    rawCaptionStyle === 'auto'
      ? undefined
      : rawCaptionStyle === 'hormozi'
      ? 'kotak'
      : rawCaptionStyle === 'neonPop'
      ? 'neon'
      : rawCaptionStyle === 'minimalDark'
      ? 'gelap'
      : normalizeSatsetCaptionMode(rawCaptionStyle, (project as any).show_subtitles !== false);

  const subSize = (project as any).subtitle_size as 'sm' | 'md' | 'lg' | undefined;
  const captionScale = subSize === 'sm' ? 0.62 : subSize === 'lg' ? 1.02 : undefined;

  const subPos = (project as any).subtitle_position as string | undefined;
  const captionPos =
    !subPos || subPos === 'auto' || subPos === 'otomatis'
      ? 'auto'
      : subPos === 'bottom' || subPos === 'bc'
      ? { x: 0.5, y: 0.855 }
      : subPos === 'top' || subPos === 'tc'
      ? { x: 0.5, y: 0.14 }
      : subPos === 'center' || subPos === 'mc'
      ? { x: 0.5, y: 0.5 }
      : subPos === 'tl'
      ? { x: 0.3, y: 0.14 }
      : subPos === 'tr'
      ? { x: 0.7, y: 0.14 }
      : subPos === 'ml'
      ? { x: 0.3, y: 0.5 }
      : subPos === 'mr'
      ? { x: 0.7, y: 0.5 }
      : subPos === 'bl'
      ? { x: 0.3, y: 0.855 }
      : subPos === 'br'
      ? { x: 0.7, y: 0.855 }
      : 'auto';

  const brandColors: string[] = [];
  if (Array.isArray((project as any).custom_palette) && (project as any).custom_palette.length > 0) {
    brandColors.push(...(project as any).custom_palette);
  } else if (project.website_promo?.primaryColor) {
    const hasCustomBrandOverride =
      project.warna_brand &&
      project.warna_brand !== 'auto' &&
      project.warna_brand.toLowerCase() !== '#2563eb';
    brandColors.push(
      hasCustomBrandOverride
        ? project.warna_brand!
        : project.website_promo.primaryColor,
      project.brand_secondary_color || project.website_promo.secondaryColor || '#1e3a8a',
      project.brand_accent_color || project.website_promo.accentColor || project.website_promo.primaryColor
    );
  } else if (project.warna_brand && project.warna_brand !== 'auto') {
    brandColors.push(
      project.warna_brand,
      project.brand_secondary_color || '#1e3a8a',
      project.brand_accent_color || project.warna_brand
    );
  }

  const hookMeta =
    (project as any).hook_enabled && ((project as any).hook_big || (project as any).hook_top)
      ? {
          top: (project as any).hook_top || '',
          big: (project as any).hook_big || project.title || 'SATSET!',
          bottom: (project as any).hook_bottom || '',
          scene: Number((project as any).hook_scene || 1),
        }
      : undefined;

  const baseCharacter = getEngineCharacterConfig(
    project.character,
    project.character_gender,
    project.custom_character,
    project.character_dimension
  );
  const resolvedCharacter =
    baseCharacter && project.character_framing
      ? {
          ...baseCharacter,
          look: {
            ...baseCharacter.look,
            viewMode: project.character_framing,
            __is3DOrbOnly: project.character_framing === 'orb' || baseCharacter.look.__is3DOrbOnly,
          },
        }
      : baseCharacter;

  const builtMeta: Record<string, any> = {
    look: customFound?.look || styleDef?.look || 'scribble3d',
    art: resolvedArt,
    pace:
      (project.tempo as string) === 'santai' || (project.tempo as string) === 'tenang'
        ? 'tenang'
        : 'energik',
    ratio,
    caption: (project as any).show_subtitles === false ? 'off' : mappedCaption,
    captionScale,
    captionPos,
    captionWidth: Number((project as any).caption_width || 1),
    font:
      (project as any).subtitle_font && (project as any).subtitle_font !== 'auto'
        ? (project as any).subtitle_font
        : undefined,
    transition: normalizeSatsetTransitionId(project.transition),
    camera: normalizeSatsetCameraMode((project as any).camera_mode),
    calmCamera: Boolean((project as any).calm_camera),
    plainBg: bgOverride === 'polos' || bgOverride === 'plain' || !!styleDef?.plainBg,
    brand: brandColors.length > 0 ? { colors: brandColors } : undefined,
    hook: hookMeta,
    watermark: project.watermark === '' ? '' : project.watermark || 'Graph Motion',
    character: resolvedCharacter,
  };

  const totalDurationSec =
    builtScenes.reduce((acc, s) => acc + Number(s.duration || 3.5), 0) ||
    project.target_duration_sec ||
    project.durationSeconds ||
    15;

  return {
    timelineScenes: builtScenes,
    projectMeta: builtMeta,
    totalDurationSec,
    ratio,
  };
}

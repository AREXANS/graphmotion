import { type SatsetProject } from '../types/satset.ts';
import { getStoredCustomStyles } from './custom-style-parser.ts';
import {
  syncCustomStylesToSatsetEngine,
  resolveSatsetStyleId,
  getSatsetStyleDef,
  getSatsetStyleDemoScenes,
  normalizeSatsetCaptionMode,
  normalizeSatsetCameraMode,
  normalizeSatsetTransitionId,
  type SatsetDemoScene,
} from './custom-style-runtime.ts';
import { computePreciseSceneWordTimings } from './pipeline-sync.ts';
import { getEngineCharacterConfig } from './character-catalog.ts';
import {
  isExecutableSatsetSceneCode,
  sanitizeSingleSceneCode,
} from './scene-code-parser.ts';
import {
  buildContextualSatsetSceneCode,
  isAutoContextualSceneCode,
  resolveAutoStyleForConceptAndScene,
} from './contextual-scene-builder.ts';
import { detectMentionedPlatforms } from './platform-logos.ts';
import {
  autoMatchUploadedAssetsToScenes,
  buildExecutableAssetMotionSnippet,
  ensureWebsitePromoSnapshotsRegistered,
  registerSceneUploadedMediaAsset,
} from './website-media-engine.ts';

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

  const rawScenes = project.scenes && project.scenes.length > 0 ? project.scenes : [];
  const uploadedList = Array.isArray(project.uploaded_tutorial_media)
    ? project.uploaded_tutorial_media
    : [];

  // Ensure uploaded assets from Step 1 (Ide) are automatically matched by AI to their best-fitting narrative scenes & motion choreography
  const scenes =
    uploadedList.length > 0
      ? autoMatchUploadedAssetsToScenes(
          uploadedList,
          rawScenes,
          project.topik_video || project.project_title,
          project.gaya_video
        )
      : rawScenes;

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
    );

    // When a scene has scraped website images/videos (or uploaded tutorial media) and custom AI code is provided,
    // run the custom AI animation code as the primary visual and add a choreographed Remotion asset layer if s.photo() wasn't already called.
    const compactPipSnippet =
      hasScrapedOrUploadedMedia && resolvedMediaKey && !userCodeAlreadyDrawsPhoto
        ? `\n${buildExecutableAssetMotionSnippet({
            mediaKey: resolvedMediaKey,
            scene: s,
            project,
            sceneIndex: idx,
            dur: Number(s.target_duration_sec || s.durationSeconds || 4.5),
            mode: 'companion_stage',
          })}`
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
      if (/zen_paper|origami/.test(st)) {
        return isFirst ? 'origami_fold' : isLast ? 'zen_bell' : sIdx % 2 === 0 ? 'origami_crease' : 'bamboo_tock';
      }
      if (/confetti/.test(st)) {
        return isFirst ? 'confetti_pop' : isLast ? 'fanfare_chord' : sIdx % 2 === 0 ? 'streamer_whip' : 'party_horn';
      }
      if (/sticker/.test(st)) {
        return isFirst ? 'sticker_peel' : isLast ? 'y2k_synth' : sIdx % 2 === 0 ? 'sticker_slap' : 'sticker_peel';
      }
      if (/bubble_gum|bubble_pop/.test(st)) {
        return isFirst ? 'gum_stretch' : isLast ? 'candy_chime' : sIdx % 2 === 0 ? 'gum_pop' : 'bubble';
      }
      if (/soft_glow|ambient_halo/.test(st)) {
        return isFirst ? 'halo_swell' : isLast ? 'glass_shimmer' : sIdx % 2 === 0 ? 'halo_pulse' : 'glass_shimmer';
      }
      if (/podcast|broadcast/.test(st)) {
        return isFirst ? 'broadcast_thump' : isLast ? 'on_air_chime' : sIdx % 2 === 0 ? 'mic_tap' : 'wave_pulse';
      }
      if (/midnight/.test(st)) {
        return isFirst ? 'midnight_sub' : isLast ? 'telemetry_ping' : sIdx % 2 === 0 ? 'bezier_sweep' : 'telemetry_ping';
      }
      if (/worldforge_mars|mars/.test(st)) {
        return isFirst ? 'mars_thruster' : isLast ? 'rover_sonar' : sIdx % 2 === 0 ? 'airlock_seal' : 'mars_wind';
      }
      if (/voxel|pixel|8bit|retro|mabar|neongame|dither/.test(st)) {
        return isFirst ? 'laser' : isLast ? 'coin' : sIdx % 2 === 0 ? 'blip' : 'coin';
      }
      if (/paper|kolase|arsip|diorama|edukasi|zine|scrapbook|papercut/.test(st)) {
        return isFirst ? 'paper_slide' : isLast ? 'paper_slap' : sIdx % 2 === 0 ? 'paper_fold' : 'paper_pop';
      }
      if (/chalk|kapur|sketsa|blueprint|oneline/.test(st)) {
        return isFirst ? 'chalk' : isLast ? 'snap' : sIdx % 2 === 0 ? 'tock' : 'chalk';
      }
      if (/precision|isometrik|belah|garis|mekanik/.test(st)) {
        return isFirst ? 'whip' : isLast ? 'snap' : sIdx % 2 === 0 ? 'tick' : 'tock';
      }
      if (/terminal|kilat|glitch|matrix|code|kinetik/.test(st)) {
        return isFirst ? 'glitch' : isLast ? 'notify' : sIdx % 2 === 0 ? 'type' : 'data_scan';
      }
      if (/worldforge|roma|monofilm|hyper_zoom|cinema|noir/.test(st)) {
        return isFirst ? 'boom' : isLast ? 'impact' : sIdx % 2 === 0 ? 'whoosh' : 'riser';
      }
      if (/lempung|clay|bounce|popart|heboh|kolab/.test(st)) {
        return isFirst ? 'boing' : isLast ? 'tada' : sIdx % 2 === 0 ? 'pop' : 'step';
      }
      if (/cair|liquid|bubble|aurora|glow|cahaya|tenang|kuas|siluet|rasi|cerita/.test(st)) {
        return isFirst ? 'swish' : isLast ? 'magic' : sIdx % 2 === 0 ? 'bubble' : 'drop';
      }
      if (/kaset|tiket|vhs|vinyl/.test(st)) {
        return isFirst ? 'shutter' : isLast ? 'cash' : sIdx % 2 === 0 ? 'scratch' : 'stamp';
      }
      if (/editorial|mograph|infopop|pitch|uiweb|panduan|carakerja|modern|produk|reel/.test(st)) {
        return isFirst ? 'swipe' : isLast ? 'correct' : sIdx % 2 === 0 ? 'cursor_click' : 'card_slide';
      }
      return isFirst ? 'whoosh' : isLast ? 'ding' : 'card_slide';
    };

    const rawExplicitCue = s.sfxCue || s.sfx?.type;
    const isGenericDefaultCue =
      !rawExplicitCue ||
      rawExplicitCue === 'whoosh' ||
      rawExplicitCue === 'pop' ||
      rawExplicitCue === 'ding' ||
      rawExplicitCue === 'tap' ||
      rawExplicitCue === 'bell' ||
      rawExplicitCue === 'card_slide' ||
      rawExplicitCue === 'whoosh_impact' ||
      rawExplicitCue === 'pop_ding' ||
      rawExplicitCue === 'notification_chime';

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
        ((project as any).subtitle_position === 'auto' || !(project as any).subtitle_position
          ? 'auto'
          : sceneStyleId === 'editorial_motion_grid'
          ? { x: 0.33, y: 0.82 }
          : 'auto'),
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

  const effectiveRenderDimension: '2d' | '2.5d' | '3d' =
    project.render_dimension === '2d' ||
    project.render_dimension === '2.5d' ||
    project.render_dimension === '3d'
      ? project.render_dimension
      : '3d';
  const effectiveCharacterDimension: '2d' | '3d' =
    effectiveRenderDimension === '2d'
      ? '2d'
      : effectiveRenderDimension === '3d'
      ? '3d'
      : project.character_dimension || '2d';

  const baseCharacter = getEngineCharacterConfig(
    project.character,
    project.character_gender,
    project.custom_character,
    effectiveCharacterDimension
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
    renderDimension: effectiveRenderDimension,
    characterDimension: effectiveCharacterDimension,
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

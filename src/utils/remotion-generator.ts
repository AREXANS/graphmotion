import { SatsetProject, SatsetScene, AspectRatio, WebsiteStepVisual } from '../types/satset';
import { SATSET_MODULES } from '../data/satset-modules';
import {
  resolveSatsetStyleId,
  getSatsetStyleDef,
  getSatsetStyleExamples,
  getSatsetStyleDemoScenes,
  getSatsetLayout,
} from './custom-style-runtime';
import { getCharacterMeta, resolveCharacterOption } from './character-catalog';
import { extractWebsiteUrl, buildWebsitePromoProfile } from './website-promo-engine';
import { resolveAutoStyleForConceptAndScene } from './contextual-scene-builder';
import { collectProjectPromptImages, enrichPromptWithMedia } from './ai-platform-router';

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
  renderDimension?: '2d' | '3d';
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
  const renderDimension: '2d' | '3d' =
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
      focus_region: s.focus_region || { fx: 0.5, fy: 0.42, zoom: 1.16 },
      website_step: s.website_step || undefined,
    };
  });
  const projectTitleEscaped = JSON.stringify(project.project_title || project.title || 'Satset Motion');
  const activeCharacterEscaped = JSON.stringify(project.character || 'none');
  const activeSubtitleStyleEscaped = JSON.stringify(project.subtitle_style || project.subtitleStyle || 'auto');

  const commonHeaderTsx = `// Remotion Composition generated by Graph Motion Studio (${renderDimension === '3d' ? '3D WebGL @remotion/three' : '2.5D Studio Motion'})
// Paste this file into your Remotion project at: src/SatsetComposition.tsx

import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  Audio,
  Img,
  Video,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
${renderDimension === '3d' ? `import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';` : ''}

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

const PROJECT_TITLE = ${projectTitleEscaped};
const ACTIVE_CHARACTER = ${activeCharacterEscaped};
const SUBTITLE_STYLE = ${activeSubtitleStyleEscaped};
const scenes: SceneData[] = ${JSON.stringify(scenesNormalized, null, 2)};
`;

  const sharedOverlayTsx = `
// Multi-Phase Editorial Camera Rig (Hook Close-Up Pull-Out -> Beat Zoom-In & Pan -> Settle Payoff)
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
  const b2Frame = Math.round(durationInFrames * 0.24);
  const b3Frame = Math.round(durationInFrames * 0.52);
  const b4Frame = Math.round(durationInFrames * 0.76);

  const hookPull = styleTheme === 'studio_3d_room' && isHook
    ? spring({ frame: Math.max(0, frame - 3), fps, config: { damping: 14, stiffness: 210, mass: 0.9 } })
    : 1;

  const k2 = spring({
    frame: Math.max(0, frame - b2Frame),
    fps,
    config: { damping: isEnergik ? 13 : 17, stiffness: isEnergik ? 220 : 120, mass: 0.9 },
  });
  const k3 = spring({
    frame: Math.max(0, frame - b3Frame),
    fps,
    config: { damping: isEnergik ? 13 : 17, stiffness: isEnergik ? 235 : 130, mass: 0.9 },
  });
  const k4 = spring({
    frame: Math.max(0, frame - b4Frame),
    fps,
    config: { damping: 14, stiffness: 195, mass: 0.95 },
  });

  const baseZoom = (1 - hookPull) * 0.30 + 1;
  const camZoom =
    baseZoom +
    hookPull * (
      (frame >= b2Frame ? k2 * (isEnergik ? 0.045 : 0.032) : 0) +
      (frame >= b3Frame ? k3 * (isEnergik ? 0.055 : 0.04) : 0) -
      (frame >= b4Frame ? k4 * (isEnergik ? 0.075 : 0.05) : 0)
    );

  const dirSign = sceneIndex % 2 === 0 ? 1 : -1;
  const closeShiftX = (1 - hookPull) * 124;
  const closeShiftY = (1 - hookPull) * -28;
  const camPanX =
    closeShiftX +
    hookPull * (
      (frame >= b2Frame ? k2 * 16 * dirSign : 0) +
      (frame >= b3Frame ? k3 * -20 * dirSign : 0) +
      (frame >= b4Frame ? k4 * 5 * dirSign : 0)
    );
  const camPanY =
    closeShiftY +
    hookPull * (
      (frame >= b2Frame ? k2 * -8 : 0) +
      (frame >= b3Frame ? k3 * 12 : 0) -
      (frame >= b4Frame ? k4 * 4 : 0)
    );
  const camTilt =
    hookPull * (
      (frame >= b2Frame ? k2 * 0.48 * dirSign : 0) -
      (frame >= b4Frame ? k4 * 0.48 * dirSign : 0)
    );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        transform: \`scale(\${camZoom.toFixed(4)}) translate3d(\${camPanX.toFixed(1)}px, \${camPanY.toFixed(1)}px, 0) rotate(\${camTilt.toFixed(2)}deg)\`,
        transformOrigin: 'center center',
      }}
    >
      {children}
    </div>
  );
};

// Scene Transition Overlay
const SceneTransitionOverlay: React.FC<{
  styleTheme: string;
  transitionType?: string;
  brandColor: string;
  durationInFrames: number;
}> = ({ styleTheme, transitionType = 'otomatis', brandColor, durationInFrames }) => {
  const frame = useCurrentFrame();
  const transitionFrames = 12;
  const startTransition = Math.max(0, durationInFrames - transitionFrames);

  if (frame < startTransition) return null;
  const progress = (frame - startTransition) / transitionFrames;

  if (transitionType === 'geser_kiri' || (transitionType === 'otomatis' && styleTheme === 'diorama_data')) {
    const wipeX = interpolate(progress, [0, 1], [-100, 100]);
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: \`linear-gradient(90deg, transparent 0%, \${brandColor} 50%, #ffffff 100%)\`,
          transform: \`translateX(\${wipeX}%)\`,
          opacity: 0.9,
          pointerEvents: 'none',
        }}
      />
    );
  }
  if (transitionType === 'geser_kanan') {
    const wipeX = interpolate(progress, [0, 1], [100, -100]);
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: \`linear-gradient(270deg, transparent 0%, \${brandColor} 50%, #ffffff 100%)\`,
          transform: \`translateX(\${wipeX}%)\`,
          opacity: 0.9,
          pointerEvents: 'none',
        }}
      />
    );
  }
  if (transitionType === 'kilas_kamera') {
    const flashOpacity = interpolate(progress, [0, 0.4, 1], [0, 0.95, 0]);
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#ffffff',
          opacity: flashOpacity,
          pointerEvents: 'none',
        }}
      />
    );
  }
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#020b24',
        opacity: progress * 0.45,
        pointerEvents: 'none',
      }}
    />
  );
};

// Calibrated Word-Weighted Karaoke Subtitle Overlay (Non-Overlapping Bottom Safe Zone)
const EditorialSubtitleOverlay: React.FC<{
  text: string;
  emphasisWords: string[];
  styleTheme: string;
  subtitleStyle: string;
  durationInFrames: number;
  sceneIndex?: number;
}> = ({ text, emphasisWords, styleTheme, subtitleStyle, durationInFrames, sceneIndex = 0 }) => {
  const frame = useCurrentFrame();
  if (!text.trim() || subtitleStyle === 'off' || subtitleStyle === 'none') return null;

  const isEditorial = styleTheme === 'editorial_motion_grid';
  const isIceGrid = isEditorial && sceneIndex % 2 === 1;
  const words = text.split(/\\s+/).filter(Boolean);
  const normEmph = emphasisWords.map((w) => w.toLowerCase().replace(/[^a-z0-9]/gi, ''));
  const weights = words.map((w) => {
    const cl = w.toLowerCase().replace(/[^a-z0-9]/gi, '');
    return Math.max(1, cl.length * 0.28 + 0.72) + (/[.!?]$/.test(w) ? 1.1 : /[,;]$/.test(w) ? 0.5 : 0);
  });
  const totalW = weights.reduce((a, b) => a + b, 0) || 1;
  const activeRatio = Math.min(1, frame / Math.max(1, durationInFrames * 0.88));
  let cum = 0;
  let activeIdx = 0;
  for (let i = 0; i < words.length; i++) {
    if (activeRatio >= cum / totalW) activeIdx = i;
    cum += weights[i];
  }

  const chunkStart = Math.floor(activeIdx / 6) * 6;
  const visibleWords = words.slice(chunkStart, chunkStart + 6);

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 92,
        transform: 'translateX(-50%)',
        maxWidth: '84%',
        background: isIceGrid ? 'rgba(15, 23, 42, 0.92)' : 'rgba(2, 10, 28, 0.90)',
        border: '2px solid rgba(56, 189, 248, 0.35)',
        padding: '14px 26px',
        borderRadius: 18,
        textAlign: 'center',
        boxShadow: '0 14px 36px rgba(0,0,0,0.45)',
      }}
    >
      <p style={{ fontSize: 32, lineHeight: 1.32, fontWeight: 900, margin: 0 }}>
        {visibleWords.map((word, localIdx) => {
          const idx = chunkStart + localIdx;
          const clean = word.toLowerCase().replace(/[^a-z0-9]/gi, '');
          const isEmph = normEmph.includes(clean);
          const isCurrent = idx === activeIdx;
          const spoken = idx <= activeIdx;
          return (
            <span
              key={idx}
              style={{
                color: isEmph ? '#ff6b35' : isCurrent ? '#facc15' : spoken ? '#ffffff' : 'rgba(226,232,240,0.45)',
                marginRight: 9,
              }}
            >
              {word}
            </span>
          );
        })}
      </p>
    </div>
  );
};
`;

  const creatorAndScenes2DTsx = `
// Unified Cohesive Chibi Narrator Rig (Oval-Tapered V-Jawline + 2-Segment Pendulum Arms + Layered Bezier Hair Locks)
const Creator3DNarratorRig: React.FC<{
  pose: 'present' | 'point' | 'idea' | 'thumbs' | 'cheer' | 'wave' | 'think' | 'stand';
  facing?: 1 | -1;
  hasHeadphones?: boolean;
  viewMode?: 'full' | 'bust';
  scale?: number;
}> = ({ pose, facing = 1, hasHeadphones = false, viewMode = 'full', scale = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isCyberFox = ACTIVE_CHARACTER.includes('rubah');
  const charPalette = isCyberFox
    ? { skin: '#fde6d8', hair: '#0077ff', hairDark: '#0b3b91', hairHi: '#60a5fa', hoodie: '#0b132b', iris: '#0284c7' }
    : ACTIVE_CHARACTER.includes('kucing')
    ? { skin: '#e9d5ff', hair: '#9333ea', hairDark: '#581c87', hairHi: '#c084fc', hoodie: '#1e1b4b', iris: '#0f172a' }
    : ACTIVE_CHARACTER.includes('panda')
    ? { skin: '#f8fafc', hair: '#10b981', hairDark: '#065f46', hairHi: '#6ee7b7', hoodie: '#064e3b', iris: '#0f172a' }
    : { skin: '#f3bfa0', hair: '#ff5c28', hairDark: '#b91c1c', hairHi: '#fdba74', hoodie: '#18181b', iris: '#0f172a' };

  const breathe = Math.sin(frame / 16) * 2.2;
  const sway = Math.sin(frame / 28) * 1.4;
  const kArm = spring({ frame: Math.max(0, frame - 2), fps, config: { damping: 12, stiffness: 145 } });
  const blinkPhase = (frame % 105) / 105;
  const isBlinking = blinkPhase > 0.94;
  const isHappyEyes = pose === 'cheer' || pose === 'thumbs' || pose === 'wave';
  const talkOpen = 0.22 + 0.78 * Math.abs(Math.sin(frame * 0.42) * Math.cos(frame * 0.19));
  const lookDir = Math.sin(frame / 24) * 2.8;

  // Phase-delayed pendulum kinematics for upper arm, forearm elbow bend, and wrist follow-through
  const pendShoulder = Math.sin(frame / 9);
  const pendElbow = Math.sin(frame / 9 - 0.65);
  const pendWrist = Math.sin(frame / 9 - 1.25);

  const rightShoulderRot =
    pose === 'point' || pose === 'present'
      ? -34 * kArm + pendShoulder * 6
      : pose === 'idea'
      ? -68 * kArm + pendShoulder * 5
      : pose === 'cheer' || pose === 'wave'
      ? -82 * kArm + Math.sin(frame / 5) * 12
      : pose === 'thumbs'
      ? -42 * kArm + pendShoulder * 4
      : 12 + pendShoulder * 4;
  const rightElbowRot =
    pose === 'point' || pose === 'present'
      ? -28 * kArm + pendElbow * 8
      : pose === 'idea'
      ? -54 * kArm + pendElbow * 7
      : pose === 'cheer' || pose === 'wave'
      ? -44 * kArm + Math.sin(frame / 5 - 0.6) * 14
      : pose === 'thumbs'
      ? -36 * kArm + pendElbow * 6
      : -16 + pendElbow * 5;

  const leftShoulderRot =
    pose === 'cheer'
      ? 78 * kArm - Math.sin(frame / 5) * 11
      : pose === 'think'
      ? 52 * kArm + pendShoulder * 4
      : -12 - pendShoulder * 4;
  const leftElbowRot =
    pose === 'cheer'
      ? 42 * kArm - Math.sin(frame / 5 - 0.6) * 12
      : pose === 'think'
      ? 48 * kArm + pendElbow * 6
      : 16 - pendElbow * 5;

  const boxHeight = viewMode === 'bust' ? 275 : 420;
  return (
    <svg
      width={300 * scale}
      height={boxHeight * scale}
      viewBox={viewMode === 'bust' ? '0 0 300 275' : '0 0 300 420'}
      style={{
        transform: \`scaleX(\${facing}) translateY(\${breathe.toFixed(1)}px) rotate(\${(sway * 0.35).toFixed(2)}deg)\`,
        overflow: 'visible',
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
        <g transform={\`translate(0, \${(-breathe * 0.25).toFixed(1)})\`}>
          <rect x="115" y="278" width="28" height="106" rx="14" fill="#0f172a" />
          <rect x="157" y="278" width="28" height="106" rx="14" fill="#0f172a" />
          <rect x="106" y="374" width="44" height="22" rx="10" fill={isCyberFox ? '#0b132b' : '#dc2626'} />
          <rect x="105" y="390" width="46" height="9" rx="4.5" fill="#ffffff" />
          <rect x="152" y="374" width="44" height="22" rx="10" fill={isCyberFox ? '#0b132b' : '#dc2626'} />
          <rect x="151" y="390" width="46" height="9" rx="4.5" fill="#ffffff" />
        </g>
      )}

      {/* Left 2-Segment Articulated Arm (Shoulder + Upper Arm + Elbow + Forearm + Wrist) */}
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

      {/* Torso */}
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

      {/* Right 2-Segment Articulated Arm (Shoulder + Upper Arm + Elbow + Forearm + Wrist) */}
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

      {/* Neck & Sleek Oval-Tapered V-Jawline Head */}
      <g transform={\`translate(150, 96) rotate(\${(sway * 0.9).toFixed(1)})\`}>
        {/* Back Hair Crown Depth */}
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
        {/* Side Ears */}
        <ellipse cx="-47" cy="2" rx="7.5" ry="11" fill="url(#skin3d)" />
        <ellipse cx="47" cy="2" rx="7.5" ry="11" fill="url(#skin3d)" />
        {/* Sculpted Oval-Tapered V-Jawline Face Contour (Not a round balloon!) */}
        <path
          d="M-47 -12 C-48 -50 -27 -62 0 -62 C27 -62 48 -50 47 -12 C46 14 31 38 12 49 C4 53 -4 53 -12 49 C-31 38 -46 14 -47 -12 Z"
          fill="url(#skin3d)"
        />
        <ellipse cx="-26" cy="13" rx="8.5" ry="4.5" fill="#fb7185" opacity="0.28" />
        <ellipse cx="26" cy="13" rx="8.5" ry="4.5" fill="#fb7185" opacity="0.28" />
        {/* Expressive Eyebrows */}
        <path d="M-29 -16 Q-19 -21 -9 -15" fill="none" stroke={isCyberFox ? '#0b3b91' : '#1e293b'} strokeWidth="3.2" strokeLinecap="round" />
        <path d="M9 -15 Q19 -21 29 -16" fill="none" stroke={isCyberFox ? '#0b3b91' : '#1e293b'} strokeWidth="3.2" strokeLinecap="round" />

        {isHappyEyes ? (
          <>
            <path d="M-29 -2 Q-19 -12 -9 -2" fill="none" stroke="#18181b" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M9 -2 Q19 -12 29 -2" fill="none" stroke="#18181b" strokeWidth="4.2" strokeLinecap="round" />
          </>
        ) : isBlinking ? (
          <>
            <line x1="-28" y1="-2" x2="-10" y2="-2" stroke="#18181b" strokeWidth="3.8" strokeLinecap="round" />
            <line x1="10" y1="-2" x2="28" y2="-2" stroke="#18181b" strokeWidth="3.8" strokeLinecap="round" />
          </>
        ) : (
          <g transform={\`translate(\${lookDir.toFixed(1)}, 0)\`}>
            <ellipse cx="-19" cy="-2" rx="8.5" ry="10.5" fill="#ffffff" />
            <ellipse cx="-18" cy="-1.5" rx="6.2" ry="8.2" fill={charPalette.iris} />
            <circle cx="-20" cy="-5" r="2.5" fill="#ffffff" />
            <ellipse cx="19" cy="-2" rx="8.5" ry="10.5" fill="#ffffff" />
            <ellipse cx="20" cy="-1.5" rx="6.2" ry="8.2" fill={charPalette.iris} />
            <circle cx="18" cy="-5" r="2.5" fill="#ffffff" />
          </g>
        )}

        {/* Nose Shadow & Expressive Mouth */}
        <path d="M-2 7 Q0 10 2 7" fill="none" stroke="#b4694e" strokeWidth="2.2" strokeLinecap="round" />
        <ellipse cx="0" cy="24" rx={7.5 + talkOpen * 3.8} ry={2.2 + talkOpen * 5.8} fill="#7f1d1d" />
        <rect x="-5.5" y="19.5" width="11" height="3.2" rx="1.5" fill="#ffffff" opacity={talkOpen > 0.35 ? 1 : 0} />

        {/* Multi-Layered Bezier Ribbon Hair Groom with Specular Highlight Arcs */}
        <path
          d="M-49 -10 C-56 -52 -28 -78 2 -78 C32 -78 56 -50 49 -10 C42 -28 28 -36 12 -28 C-4 -38 -22 -36 -34 -24 C-41 -18 -45 -12 -49 -10 Z"
          fill="url(#hair3d)"
        />
        {/* Swept Layered Crown Locks (Smooth Bezier Ribbons) */}
        <path
          d="M-34 -56 C-26 -84 -4 -92 8 -70 C-2 -68 -18 -62 -34 -56 Z"
          fill="url(#hair3d)"
        />
        <path
          d="M-8 -66 C6 -94 30 -90 34 -60 C20 -64 6 -66 -8 -66 Z"
          fill="url(#hair3d)"
        />
        <path
          d="M18 -56 C36 -78 54 -66 48 -38 C38 -46 28 -52 18 -56 Z"
          fill="url(#hair3d)"
        />
        {/* Side-Parted Forehead Fringe Ribbon Locks */}
        <path
          d="M-26 -46 C-12 -44 -2 -26 -8 -16 C-18 -22 -24 -34 -26 -46 Z"
          fill="url(#hair3d)"
        />
        <path
          d="M-4 -48 C12 -44 22 -26 16 -14 C6 -22 -2 -34 -4 -48 Z"
          fill="url(#hair3d)"
        />
        {/* Specular Ribbon Sheen */}
        <path
          d="M-28 -50 Q0 -66 28 -48"
          fill="none"
          stroke={charPalette.hairHi}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.55"
        />

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
    </svg>
  );
};

// Style 1: 3D Studio Room Scene (Clean Spatial Hierarchy: Top Headline + Upper-Right Showcase Monitor + Lower-Right 3 Pedestals + Left 3D Narrator)
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
  const k1 = spring({ frame, fps, config: { damping: 13, stiffness: 215, mass: 0.9 } });
  const k2 = spring({ frame: Math.max(0, frame - Math.round(durationInFrames * 0.22)), fps, config: { damping: 13, stiffness: 225, mass: 0.9 } });
  const k3 = spring({ frame: Math.max(0, frame - Math.round(durationInFrames * 0.48)), fps, config: { damping: 13, stiffness: 225, mass: 0.9 } });
  const k4 = spring({ frame: Math.max(0, frame - Math.round(durationInFrames * 0.74)), fps, config: { damping: 12, stiffness: 240, mass: 0.85 } });
  const isFollowed = frame >= Math.round(durationInFrames * 0.74);

  const wallHeadline = (scene.on_screen_text || 'STUDIO 3D').split('/')[0].trim().slice(0, 14).toUpperCase();
  const tags = (scene.visual_animation?.asset_elements || ['SCRIPT', 'RIG 3D', 'RENDER']).slice(0, 3);
  const stepBadges = ['01', '02', '03'];
  const mascotBob = Math.sin(frame / 7) * 8;

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #f3f0ea 0%, #dad3c8 56%, #7c5534 56%, #5c3d23 100%)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(118deg, rgba(255,253,247,0.45) 12%, transparent 28%, rgba(255,253,247,0.35) 45%, transparent 62%)', pointerEvents: 'none' }} />

      {/* Hanging Pastel Pink Dome Lamp (Upper-Left Studio Corner) */}
      <div style={{ position: 'absolute', left: isWide ? 140 : 72, top: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 4, height: isWide ? 115 : 165, background: '#475569' }} />
        <div style={{ width: 108, height: 54, borderRadius: '54px 54px 10px 10px', background: 'linear-gradient(135deg, #f5cbc2, #b87b6f)', boxShadow: '0 24px 60px rgba(255,244,214,0.65)' }} />
      </div>

      {/* Top Watermark */}
      <div style={{ position: 'absolute', top: 44, width: '100%', textAlign: 'center', fontWeight: 800, fontSize: 20, color: 'rgba(15,23,42,0.75)' }}>
        {watermark}
      </div>

      {/* 3D Extruded Wall Headline (Top-Right Wall Zone) */}
      <div
        style={{
          position: 'absolute',
          right: isWide ? 130 : 64,
          top: isWide ? 84 : 150,
          transform: \`scale(\${k1})\`,
          fontSize: isWide ? 64 : 56,
          fontWeight: 900,
          color: '#ff471a',
          textShadow: '2px 2px 0 #a8240d, 4px 4px 0 #a8240d, 6px 6px 0 #7c1908, 10px 14px 20px rgba(45,22,12,0.25)',
          letterSpacing: -1,
        }}
      >
        {wallHeadline}
      </div>

      {/* Studio Slate Sofa (Tucked cleanly on Left-Center Wall behind Narrator so Right Pedestals have 100% clear background) */}
      <div
        style={{
          position: 'absolute',
          left: isWide ? 240 : 120,
          top: isWide ? '44%' : '47%',
          width: isWide ? 340 : 290,
          height: 118,
          borderRadius: 24,
          background: 'linear-gradient(180deg, #cbd5e1, #94a3b8)',
          boxShadow: '0 20px 34px rgba(15,23,42,0.22)',
        }}
      />

      {/* Floating Browser Showcase Monitor (Upper-Right Wall Zone — Zero Overlap with Pedestals below) */}
      <div
        style={{
          position: 'absolute',
          right: isWide ? 130 : 58,
          top: isWide ? 175 : 260,
          width: isWide ? 470 : 440,
          borderRadius: 22,
          border: '3px solid #ff471a',
          background: '#0f172a',
          boxShadow: '0 24px 48px rgba(15,23,42,0.32)',
          overflow: 'hidden',
          transform: \`scale(\${k2}) rotate(-1deg) translateY(\${Math.sin(frame / 10) * 4}px)\`,
        }}
      >
        <div style={{ padding: '10px 16px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 99, background: '#ef4444' }} />
            <span style={{ width: 10, height: 10, borderRadius: 99, background: '#f59e0b' }} />
            <span style={{ width: 10, height: 10, borderRadius: 99, background: '#10b981' }} />
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#94a3b8' }}>studio.graphmotion.id · SCENE 0{scene.scene_number}</span>
        </div>
        <div style={{ padding: '18px 20px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 14, color: '#38bdf8' }}>$ npx remotion render Scene0{scene.scene_number}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', marginTop: 6 }}>{scene.on_screen_text}</div>
          <div style={{ display: 'inline-block', marginTop: 10, padding: '5px 14px', borderRadius: 99, background: '#10b981', color: '#052e16', fontWeight: 900, fontSize: 13 }}>
            ✓ 60FPS STUDIO STAGE
          </div>
        </div>
      </div>

      {/* 3 Sequential Rising White Pedestals with Step Badges (01/02/03) & High-Contrast 3D Objects (Lower-Right Gallery Zone) */}
      <div style={{ position: 'absolute', right: isWide ? 115 : 48, bottom: isWide ? 90 : 240, display: 'flex', gap: 26, alignItems: 'flex-end' }}>
        {tags.map((label, i) => {
          const p = i === 0 ? k1 : i === 1 ? k2 : k3;
          const floatY = Math.sin(frame / 8 + i * 1.4) * 5;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: \`scaleY(\${Math.max(0.01, p)})\`, transformOrigin: 'bottom center' }}>
              {/* High-Contrast Dark Halo Backplate + Distinct 3D Object */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: i === 1 ? '3px solid #ff471a' : '2.5px solid #38bdf8',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.32)',
                  marginBottom: 14 + floatY,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: i === 0 ? 8 : i === 1 ? 12 : '50%',
                    background:
                      i === 0
                        ? 'linear-gradient(135deg, #38bdf8, #2563eb)'
                        : i === 1
                        ? 'linear-gradient(135deg, #fbbf24, #ff471a)'
                        : 'linear-gradient(135deg, #34d399, #059669)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: 17,
                  }}
                >
                  {i === 0 ? '▤' : i === 1 ? '◆' : '▶'}
                </div>
              </div>
              <div style={{ width: 104, height: 22, borderRadius: '50%', background: i === 1 ? '#ff471a' : '#f97316', border: '4px solid #fff7ed', marginBottom: -10, zIndex: 2 }} />
              <div
                style={{
                  width: 104,
                  height: 118 + (i === 1 ? 26 : i === 2 ? 10 : 0),
                  borderRadius: '0 0 18px 18px',
                  background: 'linear-gradient(90deg, #e2e8f0, #ffffff, #cbd5e1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 14px 28px rgba(15,23,42,0.3)',
                }}
              >
                <span style={{ background: i === 1 ? '#ff471a' : '#2563eb', color: '#ffffff', fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 99 }}>
                  STEP {stepBadges[i]}
                </span>
                <span style={{ background: '#0f172a', color: '#ffffff', fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 99 }}>
                  {String(label).slice(0, 10).toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Left-Side 3D Narrator Character */}
      {ACTIVE_CHARACTER !== 'none' && (
        <div style={{ position: 'absolute', left: isWide ? 150 : 36, top: isWide ? '31%' : '38%' }}>
          <Creator3DNarratorRig
            pose={isCta ? (isFollowed ? 'cheer' : 'wave') : sceneIndex % 2 === 0 ? 'present' : 'point'}
            facing={1}
            hasHeadphones={ACTIVE_CHARACTER === 'kreator_3d_headphone' || ACTIVE_CHARACTER === 'kreator_3d_studio'}
            scale={isWide ? 1.25 : 1.36}
          />
        </div>
      )}

      {/* Floating Winged 3D Red Mascot Orb (Upper-Right Gallery Corner — Clear of Pedestals) */}
      <div
        style={{
          position: 'absolute',
          right: isWide ? 48 : 34,
          top: isWide ? 90 : 165,
          transform: \`translateY(\${mascotBob}px) scale(\${k1})\`,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <div style={{ width: 22, height: 12, borderRadius: 10, background: '#ffffff', transform: \`rotate(\${Math.sin(frame / 3) * 18}deg)\` }} />
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #ff7a59, #dc2626 65%, #7f1d1d)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 22px rgba(220,38,38,0.45)' }}>
          <div style={{ width: 28, height: 12, borderRadius: 6, background: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 4px' }}>
            <span style={{ width: 5, height: 5, borderRadius: 99, background: '#38bdf8' }} />
            <span style={{ width: 5, height: 5, borderRadius: 99, background: '#38bdf8' }} />
          </div>
        </div>
        <div style={{ width: 22, height: 12, borderRadius: 10, background: '#ffffff', transform: \`rotate(\${-Math.sin(frame / 3) * 18}deg)\` }} />
      </div>

      {/* CTA Follow Card */}
      {isCta && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '44%',
            transform: \`translate(-50%, -50%) scale(\${k3})\`,
            background: 'rgba(15,23,42,0.92)',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: 28,
            padding: '24px 36px',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            boxShadow: '0 24px 54px rgba(0,0,0,0.45)',
          }}
        >
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#ff471a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 24 }}>3D</div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>@kreator.3d</div>
            <div style={{ marginTop: 10, padding: '8px 22px', borderRadius: 99, background: isFollowed ? '#10b981' : '#ef4444', fontWeight: 800, fontSize: 18, textAlign: 'center', transform: \`scale(\${1 + k4 * 0.06})\` }}>
              {isFollowed ? 'Following ✓' : 'Follow +'}
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// Style 2: Editorial Motion Grid (Alternating Electric-Blue Cyber Grid & Crisp Ice-Blue Daylight Grid + 3D Perspective Bento + Interactive 3D Broadcast Host)
const EditorialMotionGridScene: React.FC<{ scene: SceneData; sceneIndex: number; totalScenes: number; watermark: string; durationInFrames: number }> = ({
  scene,
  sceneIndex,
  totalScenes,
  watermark,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const isCyberDark = sceneIndex % 2 === 0;
  const isCta = scene.role === 'cta' || (sceneIndex === totalScenes - 1 && totalScenes > 1);
  const bg = isCyberDark ? '#020b24' : '#f0f8ff';
  const ink = isCyberDark ? '#f8fafc' : '#0f172a';
  const cardBg = isCyberDark ? 'rgba(7, 20, 54, 0.92)' : 'rgba(255, 255, 255, 0.95)';
  const border = isCyberDark ? 'rgba(0, 210, 255, 0.34)' : 'rgba(37, 99, 235, 0.24)';
  const gridLine = isCyberDark ? 'rgba(0, 210, 255, 0.11)' : 'rgba(37, 99, 235, 0.09)';

  const k1 = spring({ frame, fps, config: { damping: 12, stiffness: 210, mass: 0.85 } });
  const k2 = spring({ frame: Math.max(0, frame - Math.round(durationInFrames * 0.22)), fps, config: { damping: 12, stiffness: 220, mass: 0.85 } });
  const k3 = spring({ frame: Math.max(0, frame - Math.round(durationInFrames * 0.46)), fps, config: { damping: 12, stiffness: 220, mass: 0.85 } });
  const isFollowed = frame >= Math.round(durationInFrames * 0.72);
  const steps = (scene.visual_animation?.asset_elements || ['Riset Topik', 'Rig 3D', 'Sync Audio']).slice(0, 3);
  const rollViews = Math.round(interpolate(frame, [0, Math.max(20, durationInFrames * 0.65)], [0, 128400], { extrapolateRight: 'clamp' })).toLocaleString('en-US');
  const variant = isCta ? 5 : sceneIndex === 0 ? 0 : sceneIndex % 5;
  const tiltX1 = interpolate(k1, [0, 1], [32, 0]);
  const tiltY1 = interpolate(k1, [0, 1], [-18, Math.sin(frame / 18) * 2.5]);
  const sweepPct = ((frame * 2.4) % 160) - 30;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bg,
        backgroundImage: \`radial-gradient(circle at 50% 36%, \${isCyberDark ? 'rgba(0,210,255,0.24)' : 'rgba(56,189,248,0.20)'} 0%, transparent 66%), linear-gradient(\${gridLine} 1px, transparent 1px), linear-gradient(90deg, \${gridLine} 1px, transparent 1px)\`,
        backgroundSize: '100% 100%, 60px 60px, 60px 60px',
        backgroundPosition: \`0 0, \${(frame * 0.8) % 60}px \${(frame * 0.5) % 60}px, \${(frame * 0.8) % 60}px \${(frame * 0.5) % 60}px\`,
        color: ink,
        overflow: 'hidden',
      }}
    >
      {/* Top Broadcast Telemetry Pill */}
      <div style={{ position: 'absolute', top: 54, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '8px 22px', borderRadius: 999, background: isCyberDark ? 'rgba(9,22,58,0.88)' : 'rgba(255,255,255,0.92)', border: \`1.5px solid \${border}\`, boxShadow: '0 12px 32px rgba(0,168,255,0.16)' }}>
          <span style={{ width: 10, height: 10, borderRadius: 99, background: '#10b981', boxShadow: '0 0 12px #10b981' }} />
          <span style={{ fontSize: 18, fontWeight: 800, color: isCyberDark ? '#7dd3fc' : '#2563eb' }}>{watermark}</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#00a8ff', fontFamily: 'monospace' }}>
            SCENE 0{scene.scene_number} · {scene.role.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Main 3D Perspective Bento Stage */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 155, perspective: 1100 }}>
        {variant === 5 ? (
          <div style={{ position: 'relative', overflow: 'hidden', transform: \`perspective(950px) rotateX(\${tiltX1}deg) rotateY(\${tiltY1}deg) scale(\${k2})\`, background: 'linear-gradient(135deg, #071436, #0f2557)', border: '2px solid #00d2ff', color: '#ffffff', padding: '34px 46px', borderRadius: 28, display: 'flex', alignItems: 'center', gap: 28, boxShadow: '0 28px 68px rgba(0, 168, 255, 0.32)' }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: \`\${sweepPct}%\`, width: 90, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)', transform: 'skewX(-22deg)' }} />
            <div>
              <div style={{ fontSize: 30, fontWeight: 900 }}>{watermark}</div>
              <div style={{ fontSize: 16, color: '#7dd3fc', marginTop: 4, fontFamily: 'monospace' }}>+98.4% RETENTION · LIVE 60FPS</div>
            </div>
            <div style={{ padding: '12px 28px', borderRadius: 99, background: isFollowed ? '#10b981' : '#0088ff', fontWeight: 900, fontSize: 20, boxShadow: '0 10px 26px rgba(16,185,129,0.35)' }}>
              {isFollowed ? 'Following ✓' : 'Follow +'}
            </div>
          </div>
        ) : variant === 0 ? (
          <div style={{ position: 'relative', overflow: 'hidden', transform: \`perspective(950px) rotateX(\${tiltX1}deg) rotateY(\${tiltY1}deg) scale(\${0.76 + 0.24 * k1})\`, background: cardBg, border: \`2px solid \${border}\`, borderRadius: 30, padding: '36px 46px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, boxShadow: '0 28px 64px rgba(0,168,255,0.22)' }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: \`\${sweepPct}%\`, width: 90, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)', transform: 'skewX(-22deg)' }} />
            <div style={{ padding: '8px 22px', borderRadius: 99, background: '#00a8ff', color: '#020b24', fontWeight: 900, fontSize: 18, letterSpacing: 1 }}>
              ⚡ EDITORIAL MOTION GRID · 60 FPS
            </div>
            <div style={{ fontSize: 64, fontWeight: 900, textAlign: 'center', maxWidth: 680, lineHeight: 1.12, textShadow: isCyberDark ? '0 8px 30px rgba(0,168,255,0.45)' : 'none' }}>
              {scene.on_screen_text}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
              <span style={{ padding: '8px 18px', borderRadius: 12, background: 'rgba(16,185,129,0.16)', border: '1.5px solid #10b981', color: '#10b981', fontFamily: 'monospace', fontWeight: 800, fontSize: 16 }}>
                SYNC: 99.8%
              </span>
              <span style={{ padding: '8px 18px', borderRadius: 12, background: 'rgba(0,168,255,0.16)', border: '1.5px solid #00a8ff', color: '#00a8ff', fontFamily: 'monospace', fontWeight: 800, fontSize: 16 }}>
                VIEWS: {rollViews}
              </span>
            </div>
          </div>
        ) : variant === 1 ? (
          <div style={{ width: width > 1200 ? 660 : 620, display: 'flex', flexDirection: 'column', gap: 16, transform: \`perspective(950px) rotateX(\${tiltX1 * 0.6}deg) rotateY(\${tiltY1}deg)\` }}>
            <div style={{ background: '#091533', color: '#f8fafc', border: '2px solid #00a8ff', borderRadius: 18, padding: '16px 24px', fontFamily: 'monospace', fontSize: 22, fontWeight: 800, transform: \`scale(\${k1})\`, display: 'flex', justifyContent: 'space-between' }}>
              <span>&gt; /kreator-director --3d-bento --60fps</span>
              <span style={{ color: '#10b981' }}>READY</span>
            </div>
            {steps.map((st, i) => {
              const p = i === 0 ? k1 : i === 1 ? k2 : k3;
              const flipCard = interpolate(p, [0, 1], [35, 0]);
              return (
                <div key={i} style={{ background: cardBg, border: \`2px solid \${p > 0.5 ? '#10b981' : border}\`, borderRadius: 20, padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transform: \`perspective(700px) rotateX(\${flipCard}deg) translateX(\${(1 - p) * 56}px)\`, opacity: p, boxShadow: '0 16px 36px rgba(0,0,0,0.18)' }}>
                  <span style={{ fontSize: 25, fontWeight: 800 }}>0{i + 1} · {st}</span>
                  <span style={{ padding: '6px 14px', borderRadius: 99, background: '#10b981', color: '#052e16', fontFamily: 'monospace', fontWeight: 900, fontSize: 15 }}>DONE ✓</span>
                </div>
              );
            })}
          </div>
        ) : variant === 2 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, transform: \`perspective(950px) rotateX(\${tiltX1}deg) rotateY(\${tiltY1}deg)\` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, transform: \`scale(\${k1})\`, background: cardBg, padding: '14px 28px', borderRadius: 99, border: \`2px solid \${border}\` }}>
              <span style={{ padding: '6px 16px', borderRadius: 99, background: '#ef4444', color: '#ffffff', fontFamily: 'monospace', fontWeight: 900, fontSize: 16 }}>LIVE PULSE</span>
              <span style={{ fontFamily: 'monospace', fontSize: 48, fontWeight: 900 }}>{rollViews}</span>
            </div>
            <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0088ff, #2563eb)', color: '#ffffff', padding: '26px 46px', borderRadius: 28, fontSize: 42, fontWeight: 900, transform: \`scale(\${k2}) rotate(-1.2deg)\`, boxShadow: '0 24px 54px rgba(37,99,235,0.38)' }}>
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: \`\${sweepPct}%\`, width: 90, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)', transform: 'skewX(-22deg)' }} />
              {scene.on_screen_text}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 22, height: 290, padding: '32px 44px', background: cardBg, borderRadius: 28, border: \`2px solid \${border}\`, transform: \`perspective(950px) rotateX(\${tiltX1}deg) rotateY(\${tiltY1}deg) scale(\${k1})\`, boxShadow: '0 24px 56px rgba(0,168,255,0.18)' }}>
            {[115, 168, 218, 264].map((h, i) => {
              const kh = i === 0 ? k1 : i === 1 ? k2 : k3;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 800, color: i === 3 ? '#10b981' : '#00a8ff' }}>+{Math.round(h * 0.42 * kh)}%</span>
                  <div style={{ width: 64, height: Math.max(14, h * kh), borderRadius: 14, background: i === 3 ? 'linear-gradient(180deg, #34d399, #059669)' : 'linear-gradient(180deg, #38bdf8, #0284c7)', boxShadow: '0 10px 26px rgba(0,168,255,0.28)' }} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive 3D Broadcast Host Pod with Callout Beam & Voice Equalizer */}
      {ACTIVE_CHARACTER !== 'none' && (
        <div style={{ position: 'absolute', right: 28, bottom: -10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ marginBottom: -12, zIndex: 2, padding: '6px 16px', borderRadius: 99, background: '#071436', border: '1.5px solid #00d2ff', color: '#38bdf8', fontFamily: 'monospace', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 20px rgba(0,210,255,0.28)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: '#10b981' }} />
            <span>3D HOST · ON AIR</span>
          </div>
          <Creator3DNarratorRig
            pose={isCta ? (isFollowed ? 'cheer' : 'wave') : sceneIndex % 2 === 0 ? 'present' : 'idea'}
            facing={-1}
            hasHeadphones={true}
            viewMode="bust"
            scale={1.28}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};

// Main Scene Router (Routes to 3D Studio Room, Editorial Motion Grid, Website Walkthrough, or Kinetic Editorial Scene)
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

  if (scene.visualModule === 'studio_3d_room' && !scene.website_step) {
    return <Studio3DRoomScene scene={scene} sceneIndex={sceneIndex} totalScenes={totalScenes} watermark={watermark} durationInFrames={durationInFrames} />;
  }
  if (scene.visualModule === 'editorial_motion_grid' && !scene.website_step) {
    return <EditorialMotionGridScene scene={scene} sceneIndex={sceneIndex} totalScenes={totalScenes} watermark={watermark} durationInFrames={durationInFrames} />;
  }

  const entrance = spring({
    frame,
    fps,
    config: { damping: ${springDamping}, stiffness: ${springStiffness} },
  });
  const beat2Frame = Math.round(durationInFrames * 0.24);
  const beat2Progress = frame >= beat2Frame ? spring({ frame: frame - beat2Frame, fps, config: { damping: ${springDamping}, stiffness: ${springStiffness} } }) : 0;
  const pulse = Math.sin(frame / 6) * 0.03 + 1;
  const webStep = scene.website_step;

  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '60px 48px', background: 'radial-gradient(circle at 50% 40%, rgba(0,168,255,0.18) 0%, #020b24 85%)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ background: '${brandColor}', color: '#ffffff', padding: '8px 22px', borderRadius: 999, fontSize: 22, fontWeight: 800 }}>
          {watermark}
        </span>
        <span style={{ fontSize: 20, opacity: 0.75, fontFamily: 'monospace', letterSpacing: 1 }}>
          SCENE 0{scene.scene_number} · {webStep ? webStep.stepBadge : scene.role.toUpperCase()}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: \`scale(\${entrance})\`, flex: 1 }}>
        {webStep ? (
          <div style={{ width: width > 1200 ? 780 : 620, borderRadius: 28, border: \`2px solid \${scene.accentColor}\`, background: '#0f172a', boxShadow: \`0 28px 64px \${scene.accentColor}44\`, overflow: 'hidden', color: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#1e293b', borderBottom: '1px solid #334155' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: 99, background: '#ef4444' }} />
                <span style={{ width: 12, height: 12, borderRadius: 99, background: '#f59e0b' }} />
                <span style={{ width: 12, height: 12, borderRadius: 99, background: '#10b981' }} />
              </div>
              <div style={{ padding: '6px 18px', borderRadius: 99, background: '#090d16', border: '1px solid #38bdf8', fontSize: 15, fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                https://{webStep.urlDisplay.replace(/^https?:\\/\\//i, '')}
              </div>
              <span style={{ padding: '4px 12px', borderRadius: 99, background: '#10b981', color: '#052e16', fontSize: 13, fontWeight: 900 }}>
                STEP {webStep.stepNumber}/{webStep.totalSteps}
              </span>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(scene.media_url || webStep.screenshotDataUrl) && (
                <div style={{ position: 'relative', width: '100%', height: width > 1200 ? 320 : 280, borderRadius: 18, overflow: 'hidden', border: \`2px solid \${scene.accentColor}\`, background: '#020617' }}>
                  {scene.media_type === 'video' ? (
                    <Video src={scene.media_url || webStep.screenshotDataUrl || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Img src={scene.media_url || webStep.screenshotDataUrl || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
              )}
              <div style={{ fontSize: 24, fontWeight: 900 }}>{webStep.screenTitle}</div>
              <div style={{ fontSize: 15, color: '#94a3b8' }}>{webStep.screenSubtitle}</div>
              <div style={{ marginTop: 4, padding: '12px 22px', borderRadius: 14, background: scene.accentColor, color: '#ffffff', fontWeight: 900, fontSize: 18, textAlign: 'center', transform: \`scale(\${pulse})\` }}>
                {webStep.actionLabel} →
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <h2 style={{ fontSize: width > 1200 ? 64 : 54, fontWeight: 900, textAlign: 'center', maxWidth: 860, lineHeight: 1.18, color: '#ffffff', margin: 0 }}>
              {scene.on_screen_text}
            </h2>
            {ACTIVE_CHARACTER !== 'none' && (
              <div style={{ opacity: Math.max(0.2, beat2Progress || entrance) }}>
                <Creator3DNarratorRig
                  pose={sceneIndex % 2 === 0 ? 'present' : 'point'}
                  hasHeadphones={ACTIVE_CHARACTER === 'kreator_3d_headphone'}
                  scale={1.15}
                />
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ height: 140 }} />
    </AbsoluteFill>
  );
};
`;

  const true3DScenesTsx = `
// True 3D WebGL Remotion Stage Components (Powered by @remotion/three + Three.js)
const Creator3DNarratorRig: React.FC<{
  pose: string;
  hasHeadphones?: boolean;
}> = ({ pose, hasHeadphones = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = spring({ frame, fps, config: { damping: 13, stiffness: 165 } });
  const sway = Math.sin(frame / 18) * 0.06;
  const pendShoulder = Math.sin(frame / 9) * 0.08;
  const pendElbow = Math.sin(frame / 9 - 0.65) * 0.12;
  const rShoulderZ = (pose === 'cheer' ? -1.45 * k : pose === 'point' ? -0.82 * k : -0.52 * k) + pendShoulder;
  const rElbowZ = (pose === 'cheer' ? -0.68 * k : pose === 'point' ? -0.44 * k : -0.34 * k) + pendElbow;
  const lShoulderZ = (pose === 'cheer' ? 1.45 * k : 0.18) - pendShoulder * 0.7;
  const lElbowZ = (pose === 'cheer' ? 0.65 * k : 0.24) - pendElbow * 0.7;
  const isCyberFox = ACTIVE_CHARACTER.includes('rubah');
  const skinCol = isCyberFox ? '#fde6d8' : '#f3c1a2';
  const hairCol = isCyberFox ? '#0077ff' : '#ff5c28';
  const hoodieCol = isCyberFox ? '#0b132b' : '#1e293b';
  const irisCol = isCyberFox ? '#0284c7' : '#111827';

  return (
    <group position={[-1.55, 0, 0.65]} rotation={[0, 0.16 + sway, 0]}>
      {/* Legs */}
      <mesh position={[-0.14, 0.38, 0]}><capsuleGeometry args={[0.085, 0.42, 8, 12]} /><meshStandardMaterial color="#0f172a" /></mesh>
      <mesh position={[0.14, 0.38, 0]}><capsuleGeometry args={[0.085, 0.42, 8, 12]} /><meshStandardMaterial color="#0f172a" /></mesh>
      {/* Torso */}
      <mesh position={[0, 1.06, 0]}><capsuleGeometry args={[0.24, 0.42, 10, 16]} /><meshStandardMaterial color={hoodieCol} roughness={0.6} /></mesh>
      {isCyberFox && (
        <>
          <mesh position={[0, 1.06, 0.21]}><boxGeometry args={[0.18, 0.42, 0.06]} /><meshStandardMaterial color="#ffffff" /></mesh>
          <mesh position={[0, 0.85, -0.34]} rotation={[-0.65, Math.sin(frame / 6) * 0.25, 0]}><capsuleGeometry args={[0.14, 0.32, 8, 12]} /><meshStandardMaterial color="#0077ff" /></mesh>
          <mesh position={[0, 1.06, -0.52]} rotation={[-0.55, Math.sin(frame / 6) * 0.25, 0]}><coneGeometry args={[0.15, 0.32, 12]} /><meshStandardMaterial color="#fde047" /></mesh>
        </>
      )}
      {/* 2-Segment Articulated Left Arm (Shoulder + Upper Arm + Elbow + Forearm + Hand) */}
      <group position={[-0.29, 1.24, 0]} rotation={[0.12, 0, lShoulderZ]}>
        <mesh position={[0, -0.11, 0]}><cylinderGeometry args={[0.068, 0.056, 0.22, 14]} /><meshStandardMaterial color={hoodieCol} /></mesh>
        <group position={[0, -0.22, 0]} rotation={[-0.28, 0, lElbowZ]}>
          <mesh position={[0, -0.10, 0]}><cylinderGeometry args={[0.055, 0.044, 0.20, 14]} /><meshStandardMaterial color={hoodieCol} /></mesh>
          <mesh position={[0, -0.22, 0]} scale={[0.88, 1.12, 0.72]}><sphereGeometry args={[0.052, 12, 10]} /><meshStandardMaterial color={skinCol} /></mesh>
        </group>
      </group>
      {/* 2-Segment Articulated Right Arm (Shoulder + Upper Arm + Elbow + Forearm + Hand) */}
      <group position={[0.29, 1.24, 0]} rotation={[-0.18, 0, rShoulderZ]}>
        <mesh position={[0, -0.11, 0]}><cylinderGeometry args={[0.068, 0.056, 0.22, 14]} /><meshStandardMaterial color={hoodieCol} /></mesh>
        <group position={[0, -0.22, 0]} rotation={[-0.34, 0, rElbowZ]}>
          <mesh position={[0, -0.10, 0]}><cylinderGeometry args={[0.055, 0.044, 0.20, 14]} /><meshStandardMaterial color={hoodieCol} /></mesh>
          <mesh position={[0, -0.22, 0]} scale={[0.88, 1.12, 0.72]}><sphereGeometry args={[0.052, 12, 10]} /><meshStandardMaterial color={skinCol} /></mesh>
        </group>
      </group>
      {/* Sleek Oval-Tapered V-Jawline Head + Layered Ribbon Hair Locks + Headphones */}
      <group position={[0, 1.66, 0]}>
        <mesh scale={[0.89, 1.05, 0.95]}><sphereGeometry args={[0.34, 24, 20]} /><meshStandardMaterial color={skinCol} roughness={0.48} /></mesh>
        <mesh position={[0, -0.18, 0.03]} rotation={[Math.PI, 0, 0]} scale={[0.82, 0.65, 0.85]}><coneGeometry args={[0.24, 0.26, 20]} /><meshStandardMaterial color={skinCol} roughness={0.48} /></mesh>
        <mesh position={[-0.11, 0.03, 0.30]}><sphereGeometry args={[0.045, 12, 10]} /><meshBasicMaterial color={irisCol} /></mesh>
        <mesh position={[0.11, 0.03, 0.30]}><sphereGeometry args={[0.045, 12, 10]} /><meshBasicMaterial color={irisCol} /></mesh>
        {/* Contoured Hair Skull Cap + Swept Layered Ribbon Locks */}
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
  const grow = Math.max(0.001, spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 13, stiffness: 195 } }));
  const floatY = Math.sin(frame / 10 + idx) * 0.07;
  const propColor = idx === 0 ? '#38bdf8' : idx === 1 ? accent : '#10b981';
  return (
    <group position={[x, 0, z]} scale={[1, grow, 1]}>
      <mesh position={[0, height * 0.5, 0]}><cylinderGeometry args={[0.38, 0.41, height, 28]} /><meshStandardMaterial color="#f8fafc" roughness={0.32} /></mesh>
      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.4, 0.035, 12, 28]} /><meshStandardMaterial color={propColor} emissive={propColor} emissiveIntensity={0.55} /></mesh>
      {/* Front Step Plaque */}
      <mesh position={[0, height * 0.58, 0.39]}><boxGeometry args={[0.48, 0.16, 0.04]} /><meshStandardMaterial color="#0f172a" roughness={0.4} /></mesh>
      {/* Distinct 3D Prop per Pedestal (0: Storyboard Tablet, 1: Hero Crystal, 2: Render Cube) */}
      <mesh position={[0, height + 0.38 + floatY, 0]} rotation={[0.18, frame * 0.03 + idx, 0]}>
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
  const pull = isHook ? spring({ frame: Math.max(0, frame - 3), fps, config: { damping: 14, stiffness: 200 } }) : 1;
  const p2 = spring({ frame: Math.max(0, frame - Math.round(durationInFrames * 0.25)), fps, config: { damping: 14, stiffness: 180 } });
  const dir = sceneIndex % 2 === 0 ? 1 : -1;
  const z = isHook ? interpolate(pull, [0, 1], [6.2, 8.8]) : 8.8 - p2 * 0.85;
  const x = isHook ? interpolate(pull, [0, 1], [-1.0, 0.1]) : dir * p2 * 0.45;
  camera.position.set(x, 2.25, z);
  camera.lookAt(0, 1.55, 0);
  return null;
};

const Studio3DRoomScene: React.FC<{ scene: SceneData; sceneIndex: number; totalScenes: number; watermark: string; durationInFrames: number }> = ({
  scene, sceneIndex, totalScenes, watermark, durationInFrames,
}) => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const accent = '#ff471a';
  const k1 = spring({ frame, fps: 30, config: { damping: 13, stiffness: 195 } });
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
      <div style={{ position: 'absolute', top: 54, left: '50%', transform: \`translateX(-50%) scale(\${k1})\`, background: 'rgba(15,23,42,0.88)', padding: '10px 26px', borderRadius: 99, border: '2px solid #ff471a', fontWeight: 900, fontSize: 22 }}>
        {watermark} · {scene.on_screen_text}
      </div>
    </AbsoluteFill>
  );
};

const EditorialMotionGridScene: React.FC<{ scene: SceneData; sceneIndex: number; totalScenes: number; watermark: string; durationInFrames: number }> = ({
  scene, sceneIndex, watermark, durationInFrames,
}) => {
  const { width, height } = useVideoConfig();
  const isCyberDark = sceneIndex % 2 === 0;
  const bg = isCyberDark ? '#020b24' : '#e8f2ff';
  const accent = isCyberDark ? '#00d2ff' : '#2563eb';
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
      <div style={{ position: 'absolute', top: 54, left: '50%', transform: 'translateX(-50%)', background: 'rgba(2,11,36,0.86)', padding: '10px 26px', borderRadius: 99, border: \`2px solid \${accent}\`, color: '#ffffff', fontWeight: 900, fontSize: 22 }}>
        {watermark} · {scene.on_screen_text}
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
  const frame = useCurrentFrame();

  const isNarrating = scenes.some((_, idx) => {
    const fromF = ${JSON.stringify(items.map((i) => i.fromFrame))}[idx];
    const durF = ${JSON.stringify(items.map((i) => i.durationInFrames))}[idx];
    return frame >= fromF + 6 && frame <= fromF + durF - 6;
  });
  const bgmVolume = isNarrating ? 0.15 : 0.65;

  return (
    <AbsoluteFill style={{ backgroundColor: '#020b24', color: '#ffffff', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', overflow: 'hidden' }}>
      {scenes.map((scene, idx) => {
        const fromFrame = ${JSON.stringify(items.map((i) => i.fromFrame))}[idx];
        const durationInFrames = ${JSON.stringify(items.map((i) => i.durationInFrames))}[idx];

        return (
          <Sequence key={scene.id} from={fromFrame} durationInFrames={durationInFrames}>
            <CameraRig tempo="${tempo}" styleTheme={scene.visualModule} durationInFrames={durationInFrames} sceneIndex={idx} isHook={idx === 0 || scene.role === 'hook'}>
              <SceneRenderer scene={scene} sceneIndex={idx} totalScenes={scenes.length} watermark="${watermark}" tempo="${tempo}" durationInFrames={durationInFrames} />
              <Sequence from={0} durationInFrames={Math.max(15, Math.round(durationInFrames * 0.35))}>
                <Audio src={\`/sfx/\${scene.sfx.file || 'sfx_studio3d_whoosh.mp3'}\`} volume={scene.sfx.volume ?? 0.84} playbackRate={scene.sfx.playbackRate ?? 1.0} />
              </Sequence>
              <Sequence from={Math.max(6, Math.round(durationInFrames * 0.26))} durationInFrames={Math.max(15, Math.round(durationInFrames * 0.35))}>
                <Audio src={\`/sfx/\${scene.sfx.beat2File || 'sfx_bento_card_slide.mp3'}\`} volume={(scene.sfx.volume ?? 0.84) * 0.78} playbackRate={scene.sfx.playbackRate ?? 1.0} />
              </Sequence>
              <Sequence from={Math.max(12, Math.round(durationInFrames * 0.52))} durationInFrames={Math.max(15, Math.round(durationInFrames * 0.35))}>
                <Audio src={\`/sfx/\${scene.sfx.beat3File || 'sfx_hud_data_scan.mp3'}\`} volume={(scene.sfx.volume ?? 0.84) * 0.82} playbackRate={scene.sfx.playbackRate ?? 1.0} />
              </Sequence>
              <Sequence from={Math.max(18, Math.round(durationInFrames * 0.76))} durationInFrames={Math.max(15, Math.round(durationInFrames * 0.24))}>
                <Audio src={\`/sfx/\${scene.sfx.beat4File || 'sfx_editorial_chime.mp3'}\`} volume={(scene.sfx.volume ?? 0.84) * 0.85} playbackRate={scene.sfx.playbackRate ?? 1.0} />
              </Sequence>
              {idx < scenes.length - 1 && (
                <Sequence from={Math.max(0, durationInFrames - 12)} durationInFrames={12}>
                  <Audio src={\`/sfx/\${scene.sfx.transitionFile || 'sfx_editorial_split_swish.mp3'}\`} volume={0.68} playbackRate={scene.sfx.playbackRate ?? 1.0} />
                </Sequence>
              )}
            </CameraRig>
            <EditorialSubtitleOverlay
              text={scene.narration_text}
              emphasisWords={scene.emphasis_words}
              styleTheme={scene.visualModule}
              subtitleStyle={SUBTITLE_STYLE}
              durationInFrames={durationInFrames}
              sceneIndex={idx}
            />
            <SceneTransitionOverlay
              styleTheme={scene.visualModule}
              transitionType="${project.transition || 'otomatis'}"
              brandColor="${brandColor}"
              durationInFrames={durationInFrames}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
`;

  const compositionTsx = `${commonHeaderTsx}
${mainCompositionBody}
${sharedOverlayTsx}
${renderDimension === '3d' ? true3DScenesTsx : creatorAndScenes2DTsx}
`;

  const rootTsx = `// Remotion Root entry generated by Satset Motion (${renderDimension === '3d' ? '3D WebGL' : '2.5D Motion'})
// Paste into src/Root.tsx in your Remotion project

import React from 'react';
import { Composition } from 'remotion';
import { SatsetComposition } from './SatsetComposition';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SatsetMotionVideo"
        component={SatsetComposition}
        durationInFrames={${totalFrames}}
        fps={${fps}}
        width={${res.width}}
        height={${res.height}}
      />
    </>
  );
};
`;

  const extraInstallNote =
    renderDimension === '3d'
      ? `\n2b. Untuk mode 3D WebGL (@remotion/three), instal paket Three.js & @remotion/three:\n   \`\`\`bash\n   npx remotion add @remotion/three && npm install three @react-three/fiber @types/three\n   \`\`\`\n`
      : '';

  const instructions = `# Panduan Menjalankan Video Ini di Remotion Studio

1. Pastikan komputer Anda terpasang Node.js v18+.
2. Buat proyek Remotion baru (jika belum ada):
   \`\`\`bash
   npx create-video@latest my-satset-video
   \`\`\`
   Pilih template "Blank" atau "Recommended".
${extraInstallNote}
3. Masuk ke direktori proyek:
   \`\`\`bash
   cd my-satset-video
   \`\`\`

4. Salin kode komponen:
   - Simpan kode tab "SatsetComposition.tsx" ke dalam file "src/SatsetComposition.tsx".
   - Perbarui file "src/Root.tsx" dengan kode pada tab "Root.tsx".

5. Jalankan Remotion Studio interaktif lokal:
   \`\`\`bash
   npx remotion preview
   \`\`\`

6. Render video akhir ke format MP4 (H.264):
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

/**
 * Builds the exact dynamic prompt blueprint for Claude / Gemini / ChatGPT
 * driven by all current studio settings (style card, tempo, duration, character builder, brand palette).
 */
export function buildPromptBlueprint(project: Partial<SatsetProject>): string {
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

  const rawScript = (project as any).source_script as string | undefined;
  const rawUrl = (project as any).source_url as string | undefined;
  const detectedUrl = extractWebsiteUrl(rawUrl || topic);
  const webProfile = detectedUrl
    ? project.website_promo || buildWebsitePromoProfile(detectedUrl)
    : undefined;
  const sourceExtra =
    project.start_mode === 'script' && rawScript
      ? `\nNaskah sumber kreator (jadikan 5 sudut adaptasi/hook yang tajam):\n"""${rawScript.slice(0, 1200)}"""`
      : webProfile
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

  return enrichPromptWithMedia(basePrompt, collectProjectPromptImages(project));
}

/**
 * Builds the exact narrative prompt blueprint for Claude / Gemini / ChatGPT
 * conforming to satsetmotion.id guidelines and user prompt specification.
 */
export function buildNarasiPrompt(project: Partial<SatsetProject>, creatorNote?: string): string {
  const isAutoDuration = project.duration_mode === 'auto';
  const durasiSec = project.target_duration_sec || project.durationSeconds || 60;
  const tempo = project.tempo || 'energik';
  const targetScenes =
    durasiSec >= 90
      ? Math.min(12, Math.round(durasiSec / 7.5))
      : durasiSec >= 60
      ? 8
      : durasiSec >= 50
      ? 6
      : durasiSec >= 40
      ? 5
      : 4;
  const secPerScene = durasiSec / targetScenes;
  const avgSec = secPerScene.toFixed(1).replace('.0', '');
  const minSceneDurStr = Math.max(3.0, secPerScene - 1.5).toFixed(1).replace('.0', '');
  const maxSceneDurStr = (secPerScene + 1.5).toFixed(1).replace('.0', '');

  // Calibrated to actual Indonesian Voice Over speaking rate (energik ~2.8 words/sec, santai ~2.25 words/sec)
  const wordsPerSec = tempo === 'santai' ? 2.25 : 2.8;
  const speechWindowPerScene = Math.max(2.5, secPerScene - (tempo === 'santai' ? 0.42 : 0.32));
  const wordsPerSceneTarget = Math.max(10, Math.round(speechWindowPerScene * wordsPerSec));
  const minWordsPerScene = Math.max(9, wordsPerSceneTarget - 2);
  const maxWordsPerScene = wordsPerSceneTarget + 3;
  const estimatedWords = Math.round(targetScenes * wordsPerSceneTarget);
  const minTotalWords = Math.round(estimatedWords * 0.9);
  const maxTotalWords = Math.round(estimatedWords * 1.12);
  const durasiLabel = isAutoDuration
    ? 'Otomatis sesuai konsep & alur narasi (tanpa batas waktu kaku)'
    : durasiSec >= 60
    ? `${durasiSec} detik (${(durasiSec / 60).toFixed(1).replace('.0', '')} mnt)`
    : `${durasiSec} detik`;

  const selectedIdea =
    project.idea_concepts?.find((c) => c.id === project.selected_idea_id) ||
    project.idea_concepts?.[0] || {
      id: 'c-1',
      title: project.project_title || project.title || 'Kenapa Pagi Terasa Berat?',
      hook: 'KATANYA ORANG SUKSES / BANGUN PAGI / PADAHAL ADA YANG SALAH',
      hookProposal: 'KATANYA ORANG SUKSES / BANGUN PAGI / PADAHAL ADA YANG SALAH',
      angle:
        'Banyak orang mengira rasa malas pagi hilang kalau kita menunggu semangat datang. Itu keliru. Semangat bukan syarat untuk mulai bergerak. Bayangkan tubuhmu seperti benda yang ditarik dua magnet. Satu magnet menarikmu ke kasur, satu lagi menarikmu ke pekerjaan. Semakin lama kamu diam, semakin kuat tarikan kasur terasa. Cara memutuskannya sederhana: duduk, berdiri, lalu lakukan satu pekerjaan selama dua menit. Jangan tunggu ingin bergerak. Bergerak dulu, baru semangat menyusul. Kamu tidak harus menang melawan rasa malas sepanjang hari. Kamu hanya perlu menang di 10 menit pertama.',
      visualStyle:
        'Diorama Data 3D, cahaya matahari pagi cerah, rumput mint dengan aksen koral dan emas, satu papan miniatur rumah dengan tempat tidur di satu sisi dan meja kerja di sisi lain, dua magnet raksasa menarik sebuah bidak silinder ke arah berlawanan. Koin kecil tertarik ke arah kasur, lalu bidak bergerak menuju meja kerja. Batang 3D menunjukkan perbandingan waktu diam dan waktu mulai bergerak. Kamera dimulai dari seluruh papan, mendekati kamar, lalu berputar ke meja kerja. Semua tokoh faceless.',
    };

  const gayaRaw = project.gaya_video || project.styleModule || 'diorama_data';
  const isAutoStyle = gayaRaw === 'otomatis';
  const autoResolved =
    isAutoStyle ? resolveAutoStyleForConceptAndScene(project) : null;
  const effectiveGaya = autoResolved ? autoResolved.styleId : gayaRaw;
  const resolvedStyleId = resolveSatsetStyleId(effectiveGaya);
  const styleDef = getSatsetStyleDef(resolvedStyleId, 'crayon');
  const modInfo = SATSET_MODULES.find(
    (m) => m.id === effectiveGaya || resolveSatsetStyleId(m.id) === resolvedStyleId
  );
  const isDiorama = !isAutoStyle && resolvedStyleId === 'diorama';
  const aspectRatio = project.aspect_ratio || '9:16';
  const charMode = resolveCharacterOption(project.character || 'none');
  const charMeta = getCharacterMeta(charMode, project.custom_character);
  const characterVisualRule =
    charMode === 'none'
      ? `Video ini dipilih TANPA KARAKTER: JANGAN menampilkan manusia dalam bentuk apa pun (sosok, siluet, stick man, kerumunan, tangan, kaki, bayangan orang). Kalau teks membicarakan orang atau tindakannya, wujudkan lewat BENDA dan METAFORA visual yang langsung terbaca, misalnya melangkah = jejak kaki yang muncul satu per satu atau sepatu yang bergerak maju; malas = alarm yang terus ditunda; kesepian = kursi kosong di bawah lampu; berusaha = tunas yang menembus tanah; membandingkan diri = dua gelas dengan isi berbeda.`
      : charMode === 'stickman_samping' || charMode === 'stickman_kurus' || charMode === 'stickman_berotot' || charMode === 'stickman'
      ? `Tokoh utama video ini adalah karakter ${charMeta.name} (${charMeta.description}, faceless tanpa wajah) yang ikut bereaksi dan berinteraksi dengan objek metafora di setiap scene supaya alurnya terasa hidup.`
      : `Tokoh video ini adalah "${charMeta.name}" (${charMeta.description}) yang berinteraksi dengan benda-benda metafora utama di setiap adegan.`;

  const gayaTitle = isAutoStyle
    ? 'Otomatis (Menyesuaikan Konsep Bahasan)'
    : modInfo?.title ||
      styleDef?.label ||
      (isDiorama ? 'Diorama Data' : 'Motion Graphics');
  const gayaSubtitle = isAutoStyle
    ? 'gaya visual otomatis menyesuaikan dengan konsep dan topik apa yang sedang dibahas di setiap scene'
    : modInfo?.subtitle || styleDef?.hint || 'motion graphics bersih & ekspresif';
  const note =
    (creatorNote || project.creator_note || '').trim() ||
    'Tidak ada catatan khusus; ikuti gaya visual & alur cerita.';
  const activeStyleSpec = isAutoStyle
    ? 'OTOMATIS SESUAI KONSEP: sesuaikan gaya visual di setiap bagian dengan konsep apa yang sedang dibahas pada narasi (tidak dikunci ke satu gaya kaku).'
    : isDiorama
    ? 'DIORAMA DATA: seluruh video terjadi di SATU papan miniatur 3D siang hari (WAJIB 3D SUNGGUHAN, objek berdiri di atas papan berumput mint) yang difilmkan dalam satu shot bersambung.'
    : styleDef?.direction ||
      modInfo?.description ||
      `${gayaTitle}: ${gayaSubtitle}. Visual dinamis dan kontras tinggi.`;

  const visualStyleLine =
    selectedIdea.visualStyle ||
    `${gayaTitle}, ${styleDef?.hint || gayaSubtitle}`;

  const baseNarasi = `Kamu adalah penulis naskah video pendek ${project.content_type || 'motivasi'} berbahasa Indonesia. Gaya visual: ${gayaTitle} (${gayaSubtitle}). Nuansa: ${
    tempo === 'santai' ? 'santai dan berbobot, mengalir alami' : 'energik dan membakar semangat, ritme cepat, potongan scene pendek, banyak gerakan'
  }.
Gaya animasi "${gayaTitle}": ${activeStyleSpec}
Kalau ada arahan gaya dari kreator, tulis setiap "visual" dan pilih "theme" mengikuti arahan itu.

Ubah ide yang dipilih menjadi narasi scene per scene.

## Cara menulis narasi (paling penting)
Tulis seperti orang yang NGOMONG LANGSUNG ke temannya, bukan seperti poster kata-kata mutiara. Bayangkan seluruh narasi dibaca sekali jalan tanpa melihat layar: harus terdengar seperti satu cerita utuh yang mengalir, jelas maksudnya, dan enak didengar.
- Tulis dulu narasinya sebagai satu monolog utuh di kepala, baru dipotong per scene di jeda napas yang wajar. Scene boleh berisi 2-3 kalimat yang mengalir ke scene berikutnya.
- Panjang teks WAJIB per scene: ${minWordsPerScene}-${maxWordsPerScene} kata (sekitar ±${wordsPerSceneTarget} kata atau 2-3 kalimat lisan utuh). JANGAN menulis hanya 4-10 kata per scene karena akan membuat durasi Voice Over menyusut jadi terlalu singkat (~28 detik untuk 8 scene)!
- Bahasa lisan anak muda yang natural: boleh "kamu", "gak", "udah", "aja", "kok", "sih", "tuh", "kan", "ya", "jujur", "padahal". Pakai kata sambung (karena, tapi, padahal, terus, makanya, jadi) supaya antar-scene nyambung.
- Bahasa SEDERHANA, langsung dipahami sekali dengar oleh siapa saja (anak SMP sampai orang tua). Tes: kalau ada kata yang jarang dipakai di obrolan warung kopi, ganti.
- Pakai kata sehari-hari yang biasa diucapkan di obrolan. JANGAN pakai kata tinggi/serapan/akademis: esensi, eksistensi, paradigma, manifestasi, resiliensi, validasi, ekspektasi, transformasi, signifikan, fundamental, kontemplasi, hakikat, entitas, persepsi, narasi, fase, momentum, versi terbaik, potensi, makna hidup. Ganti dengan kata biasa (mis. "ekspektasi" -> "harapan", "konsisten" -> "terus-terusan", "validasi" -> "pengakuan orang").
- JANGAN puitis, filosofis, atau berbunga-bunga ("jiwa yang lelah", "langkah kecil menuju cahaya", "dirimu yang sejati"). Katakan maksudnya langsung.
- Satu kalimat satu maksud, pendek, susunan biasa (subjek-kata kerja-objek). Hindari kalimat bertingkat dan kiasan di dalam kiasan.
- Metafora boleh, tapi bendanya sehari-hari dan artinya langsung dijelaskan dengan kata biasa; penonton tidak boleh harus mikir untuk paham.
- Konkret, bukan abstrak. Ganti kata besar ("kesuksesan", "potensi", "versi terbaik dirimu", "zona nyaman") dengan situasi nyata yang bisa dibayangkan: jam berapa, lagi ngapain, pegang apa, ngerasa apa.
- Jaga satu benang merah: metafora dari ide dipakai dari awal sampai akhir dan dijelaskan dengan jelas, bukan disebut sekilas lalu ditinggal.
- JANGAN: deretan slogan pendek tanpa hubungan, kalimat perintah beruntun ("Bangkit! Lawan! Gas!"), kalimat ala terjemahan, kata baku kaku ("adalah", "merupakan", "oleh karena itu", "sesungguhnya", "dirimu"), atau quote klise.
- Alur: hook yang langsung kena -> situasi nyata yang relatable -> sudut pandang baru (lewat metafora) -> satu langkah konkret yang bisa dilakukan hari ini -> penutup yang membekas dan bikin orang pengen langsung gerak.
- Struktur penahan penonton (berlaku di atas alur tadi, tanpa mengubah jenis videonya):
  - Hook (scene 1): kalimat pembuka langsung sebut topiknya + apa yang dipertaruhkan buat penonton, lalu lanjutkan dengan 1 kalimat penyambung agar panjang scene 1 tetap memenuhi target ${minWordsPerScene}-${maxWordsPerScene} kata (±${avgSec} detik).
  - Lock-in: scene tepat setelah hook menegaskan janji hook dan memberi alasan untuk bertahan sampai akhir: satu bukti atau situasi nyata, atau "ada N hal/cara/langkah..." kalau isinya berupa daftar.
  - Kalau ada beberapa poin, alasan, atau fakta yang urutannya bebas: taruh yang terkuat KEDUA di awal, dan yang TERKUAT jadi klimaks menjelang akhir. Langkah yang harus berurutan dan alur cerita tetap mengikuti urutan logisnya.
  - Rehook: di peralihan ke bagian berikutnya, pakai kalimat penghubung yang bikin penasaran lagi (mis. "tapi justru di sini masalahnya,", "dan yang terakhir ini paling sering dilupain:"). Cukup 1-3 kali per video, di peralihan yang penting saja, harus terdengar alami, bukan template.
  - Penutup: rangkum pesannya + ajakan yang menyatu dengan isi, tetap ${minWordsPerScene}-${maxWordsPerScene} kata agar penutup tidak terasa terpotong.

Contoh gaya bahasa natural yang sesuai durasi (±${wordsPerSceneTarget} kata per scene, bukan frasa pendek terpotong):
- "Tiap pagi kamu mungkin janji sama diri sendiri bakal mulai kerja jam tujuh, tapi ujung-ujungnya malah kebangun kesiangan sambil buka HP duluan."
- "Masalahnya bukan karena kamu pemalas atau kurang niat, tapi karena jarak antara kasur dan langkah pertamamu itu dibikin terlalu berat."
- "visual": deskripsi ilustrasi KONKRET + gerakannya, untuk kanvas ${aspectRatio}. Gerakan dinamis: jatuh lalu membal, terbang masuk dari samping, berputar, menumpuk, pecah jadi burst. Teks 3D/headline boleh untuk angka/kata singkat. Sebut benda NYATA yang dimaksud teks secara spesifik (motor, HP, celengan, laptop, kunci) lengkap dengan ciri khas bentuknya (mis. "motor skuter oranye: dua roda, jok cokelat, stang, lampu depan bulat"), karena objek akan dirakit dari banyak bentuk dasar dan harus langsung dikenali. JANGAN menggantinya dengan bentuk abstrak atau cuma sebagiannya (motor jangan jadi roda saja). Visual harus menggambarkan PERSIS kata kunci kalimatnya sebagai aksi yang terlihat, sampai penonton paham walau suara dimatikan: "satu langkah" = sepasang kaki/jejak yang melangkah satu kali, bukan sepatu diam; "menabung" = koin masuk celengan. ${characterVisualRule} TANPA WAJAH: jangan menggambar mata, hidung, atau mulut pada benda apa pun. Satu objek utama + maksimal 2-3 objek pendukung, dan SETIAP SCENE wajib punya variasi adegan berbeda mengikuti progres kalimat.
- "theme": "paper" = versi latar terang, "dusk" = versi latar menengah, "night" = versi latar gelap. ${isDiorama ? 'Untuk Diorama Data pakai tema "paper" agar latar papan miniatur menyambung.' : 'Selingi agar tidak monoton.'}
- "duration": sekitar ${avgSec} detik (rentang ${minSceneDurStr} - ${maxSceneDurStr} detik, wajib sesuai panjang kalimat narasi scene ini).
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

## Ide terpilih
- Judul: ${selectedIdea.title}
- Hook: ${selectedIdea.hook || selectedIdea.hookProposal}
- Pesan: ${selectedIdea.angle}
- Gaya visual: ${visualStyleLine}

## Tugas
Tulis narasi sebanyak ${targetScenes} scene.
## Panjang Video & Target Kata (WAJIB DIPENUHI AGAR TIDAK TERLALU SINGKAT)
- Target durasi video: ${durasiLabel} -> WAJIB ${targetScenes} scene, rata-rata ±${avgSec} detik per scene.
- Target kata total: ${minTotalWords}–${maxTotalWords} kata (ideal ±${estimatedWords} kata, MINIMAL ${minTotalWords} kata di seluruh ${targetScenes} scene!).
- Tiap scene WAJIB berisi 2-3 kalimat utuh sepanjang ${minWordsPerScene}–${maxWordsPerScene} kata (sekitar ±${wordsPerSceneTarget} kata per scene). JANGAN menulis hanya 1 kalimat pendek per scene!
- Susun seperti video cerita/esai: hook kuat di scene pertama, lalu beberapa bagian yang mengalir (masalah -> contoh nyata -> titik balik -> langkah praktis -> ajakan penutup), dengan kalimat penghubung antar-scene. Jangan mengulang ide yang sama.
- "visual" tiap scene tetap satu adegan yang jelas, tapi berkembang dalam beberapa tahap sepanjang ±${avgSec} detik scene (objek muncul, detail menyusul, ada perubahan/puncak), sesuai kalimat yang sedang diucapkan.
- Isi "duration" tiap scene sekitar ${avgSec} detik agar jumlah total "duration" seluruh ${targetScenes} scene sama dengan ${durasiSec} detik.
- Cek ulang sebelum menjawab: hitung jumlah kata di semua "text", pastikan totalnya minimal ${minTotalWords} kata!

Catatan tambahan dari kreator: ${note}

## Latar
Desain latar khusus untuk video ini (unik, jangan pakai warna generik): 3 versi yang dipakai sebagai tema scene.
- "paper" = versi terang (teks gelap harus terbaca), "dusk" = versi menengah/berwarna, "night" = versi gelap (teks terang harus terbaca).
- Warna "top" dan "bottom" (hex) membentuk gradasi; selaraskan dengan gaya "${gayaTitle}" dan suasana pesan video.
- "pattern" salah satu: none, navy, dots, grid, bigGrid, lines, stars, halftone, grain, chalk, wash, horizon, sunburst, mist, hud, stripes, dotsup, neonwave, slash, hills, peaks, house, dither, washi, plate, sunset, film, room, deepgrid, shore, craft, softgrid, ridge.

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
    "paper": { "top": "#d9eefb", "bottom": "#fbf1e4", "pattern": "dots" },
    "dusk": { "top": "#d9eefb", "bottom": "#fbf1e4", "pattern": "grid" },
    "night": { "top": "#c9d6f2", "bottom": "#f7d9cf", "pattern": "stars" }
  },
  "scenes": [
    {
      "text": "teks narasi di layar",
      "visual": "deskripsi ilustrasi dan gerakannya",
      "theme": "paper",
      "duration": ${avgSec},
      "emphasis": "kata",
      "camera": "push"
    }
  ]
}
Jangan gunakan artifact/canvas dan jangan menambahkan penjelasan di luar format yang diminta.`;

  return enrichPromptWithMedia(baseNarasi, collectProjectPromptImages(project));
}

/**
 * Builds the animation code generation prompt for Claude / Gemini for a specific batch of scenes.
 * Matches exact procedural HTML Canvas motion graphics contract and guidelines.
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

  const gayaTitle = modInfo?.title || styleDef?.label || 'Motion Graphics';
  const gayaHint = styleDef?.hint || modInfo?.description || 'motion graphics bersih & ekspresif';
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

  const tempo = project.tempo || 'energik';
  const finishMode = styleDef?.finish || 'scribble';
  const finishSection =
    finishMode === 'glow'
      ? `## Finishing: MENYALA (glow)\nEngine otomatis membuat garis dan isian memancarkan cahaya sesuai warnanya, tanpa efek coretan. Pakai warna terang/jenuh kontras agar pendar cahayanya tajam.`
      : finishMode === 'glossy'
      ? `## Finishing: GLOSSY (kilap halus)\nObjek 3D tampil dengan permukaan mulus berkilau dan gradasi warna lembut tanpa coretan tinta.`
      : finishMode === 'scribble'
      ? `## Finishing: SCRIBBLE (arsiran tangan)\nObjek 3D dan 2D menampilkan tekstur coretan pensil/tinta serta garis tepi ekspresif.`
      : `## Finishing: FLAT BERSIH (clean / vektor)\nBentuk rapi dengan tepi tajam tanpa coretan tangan dan tanpa pendar neon berlebihan (gunakan \`wobble: 0, hatch: false\` pada primitif 2D bila memakai sudut bersih).`;

  const charMode = resolveCharacterOption(project.character || 'none');
  const charMeta = getCharacterMeta(charMode, project.custom_character);
  const charSection =
    charMode === 'none'
      ? `Karakter: TANPA KARAKTER MANUSIA. Jangan menggambar orang/stickman/siluet wajah; gambarkan seluruh konsep lewat objek nyata, simbol, tipografi 3D, dan metafora visual.`
      : charMode === 'stickman_samping' || charMode === 'stickman_kurus' || charMode === 'stickman_berotot' || charMode === 'stickman'
      ? `Tokoh UTAMA: "${charMeta.name}" (${charMeta.description}). Saat dia muncul, panggil \`s.person(x, y, { pose, size, facing })\` TANPA menimpa opsi pakaian & rambut (shirt, pants, skin, hair, hairColor, hijab, niqab, khimar, peci, dress, jacket, koko, shoes, tie, apron). Setiap tokoh WAJIB faceless (tanpa wajah).`
      : `Tokoh UTAMA: "${charMeta.name}" (${charMeta.description}). Saat narasi melibatkan aksi manusia, panggil \`s.person(x, y, { pose, size, facing })\` agar busana & karakter aktif otomatis mengikuti profil "${charMeta.name}" (semua tokoh WAJIB faceless tanpa wajah).`;

  const selectedIdea =
    project.idea_concepts?.find((c) => c.id === project.selected_idea_id) || project.idea_concepts?.[0];
  const videoTitle = selectedIdea?.title || project.project_title || project.title || project.topik_video || 'Video Motion Graphics';
  const storyAngle = selectedIdea?.angle || '';
  const visualConcept = selectedIdea?.visualStyle || '';
  const paletteColors =
    project.warna_brand && project.warna_brand !== 'auto'
      ? [project.warna_brand, project.brand_secondary_color, project.brand_accent_color].filter(Boolean).join(', ')
      : (styleDef?.colors || ['#2563EB', '#38bdf8', '#facc15']).join(', ');

  const storyOverviewLines = scenes
    .map((s, idx) => {
      const n = s.scene_number || idx + 1;
      const mark = n >= startSceneNumber && n <= endSceneNumber ? '>>>' : '   ';
      const txt = (s.narration_text || s.voiceScript || '').slice(0, 75);
      const vis = (s.visual || s.visualDescription || '').slice(0, 75);
      return `${mark} [Scene ${n}] Teks: "${txt}" | Visual: ${vis || '-'}`;
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
      ([label, code]) => `## Contoh autentik gaya ${gayaTitle} (${label})
\`\`\`js
${code.trim()}
\`\`\``
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
        .map((w, i) => `${w} ${(0.2 + (i * Math.max(1.2, dur - 0.8)) / Math.max(words.length, 1)).toFixed(1)}`)
        .join(' · ');

      const mediaHint =
        s.media_key || s.media_url || s.website_step
          ? `\n- ASET GAMBAR/VIDEO WEB ASLI TERSEDIA (\`media_key: "${s.media_key || `web_step_${num}`}"\`): Gunakan gambar/video web tersebut secara PROPORSIONAL (~25%–35% area kanvas sebagai floating PiP card, split-screen preview, atau zoom-lens callout) dengan \`s.photo("${s.media_key || `web_step_${num}`}", ${Math.round(layout.cx + (num % 2 === 0 ? -110 : 110))}, ${Math.round(layout.cy - 45)}, ${Math.round(layout.W * 0.38)}, ${Math.round(layout.H * 0.14)}, { frame: "browser", zoom: 1 + s.p * 0.16, fx: ${s.focus_region?.fx ?? 0.5}, fy: ${s.focus_region?.fy ?? 0.42}, draw: s.pop(0.08, 0.35), time: s.t })\` DAN jelaskan mekanisme mendalamnya menggunakan animasi motion graphics 2D/3D (\`s.box\`, \`s.cylinder\`, \`s.cube\`, \`s.polyline\`, \`s.arc\`, \`s.card\`, \`s.stagger\`) yang berbeda tiap scene!`
          : '';

      return `### SCENE ${num}
- Peran adegan: ${s.role || (num === 1 ? 'hook' : 'poin')}
- Teks narasi: "${text}"
- Kata penekanan: ${emphasis}
- Visual blueprint: ${visual || `Visual metafora konkrit sesuai gaya ${gayaTitle} yang menggambarkan "${text}".`}${mediaHint}
- Tema latar: ${theme} (pakai warna kontras dengan tema "${theme}")
- Gerakan kamera engine: ${s.camera || s.camera_movement || 'otomatis'}
- Durasi tepat: ${dur} detik (ATUR animasi/keyframe \`s.t\` dari 0.0 sampai ${(dur - 0.4).toFixed(1)}s agar tidak berhenti terlalu cepat atau terpotong!)
- Waktu kata diucapkan (detik): ${timings}`;
    })
    .join('\n\n');

  const firstNum = startSceneNumber;
  const secondNum = startSceneNumber < endSceneNumber ? startSceneNumber + 1 : null;

  const baseAnimPrompt = `Kamu adalah animator motion graphics profesional yang menulis kode JavaScript Canvas 2D untuk engine Satset Motion bergaya "${gayaTitle}" (${gayaHint}).
Tujuan utama: tiap scene harus tergambar rapi, berbeda komposisi/metaforanya antar scene (TIDAK boleh mengulang gerakan/layout yang sama berulang kali), menyambung alur cerita, dan BEBAS error sintaks/runtime.

## Kontrak Teknis (WAJIB DIPATUHI AGAR TIDAK "kode error")
- Tulis HANYA isi body fungsi \`function (s, ctx) { ... }\`.
- DILARANG menulis \`import ...\`, \`export ...\`, JSX/React (\`<RemotionCanvas />\`), TypeScript type annotation, atau membungkus ulang kode dalam \`function (s, ctx) { ... }\`.
- Fungsi dipanggil setiap frame (~30fps). Jangan simpan state global antar frame; hitung semua posisi/skala/alfa deterministik dari \`s.t\` atau \`s.p\`.
- Jangan pakai \`Math.random()\` (gunakan \`s.rand(i)\`), jangan akses \`window\`/\`document\`/\`fetch\`, jangan buat loop tak terbatas.
- Jangan menggambar latar belakang solid penutup penuh jika gaya tidak memintanya, dan JANGAN menggambar subtitle/teks narasi panjang karena engine sudah menanganinya (boleh \`s.text3d\` / \`s.text\` singkat 1–3 kata aksen saja).
- Pastikan semua variabel & tanda kurung lengkap dan terpisah rapi antar scene.

## Kanvas & Tata Letak Aktif (${ratioLabel})
- Ukuran logis kanvas: ${layout.W} x ${layout.H} (${ratioLabel}). Origin (0, 0) di kiri atas.
- Gunakan koordinat proporsional agar aman: pusat ilustrasi (${layout.cx}, ${layout.cy}), area aman x: ${layout.art[0]}..${layout.art[2]}, y: ${layout.art[1]}..${layout.art[3]}, garis tanah y = ${layout.ground}.
${layout.W !== 720 ? `- CATATAN PENTING RASIO NON-VERTIKAL: Contoh di bawah memakai koordinat referensi 720x1280; saat menulis kode di rasio ${ratioLabel}, selalu sesuaikan pusat ke (${layout.cx}, ${layout.cy}) dan rentang X ke ${layout.art[0]}..${layout.art[2]}!` : ''}
- Zona subtitle berada di sekitar y = ${layout.capY} (pita ${layout.capBand[0]}..${layout.capBand[1]}). Jangan taruh label penting atau titik fokus tepat tertumpuk di situ.

## Waktu, Fisika, Staging Bertahap & Pergeseran Kamera (ANTI AI-SLOP — WAJIB)
- \`s.t\` = detik sejak scene mulai (0 .. ${targetScenes[0]?.target_duration_sec || 6.5}+), \`s.dur\` = durasi scene, \`s.p\` = progres 0..1.
- JANGAN menampilkan semua objek dan teks sekaligus di \`t = 0\`! Susun kemunculan elemen mengikuti tempo pembahasan di baris "Waktu kata diucapkan":
  1) Beat 1 (0.04s – 22% durasi): tampilkan panggung dasar / objek pembuka kalimat pertama (\`s.spring(0.04)\`).
  2) Beat 2 (~25% durasi / klausa kedua): munculkan objek pembanding, aksi, atau aliran proses (\`s.spring(beat2)\`) sambil menggeser kamera (\`s.group({ x, y, scale })\` zoom-in + pan halus ke objek yang sedang dibahas).
  3) Beat 3 (~50% durasi / tepat detik kata penekanan diucapkan): munculkan objek puncak, grafik lonjakan, atau teks 3D kata kunci (\`s.pop(beat3)\`) dengan zoom-in fokus.
  4) Beat 4 (~72% durasi / kesimpulan kalimat): munculkan badge/tag hasil akhir (\`s.pop(beat4)\`) sambil kamera zoom-out halus agar komposisi utuh terlihat rapi seperti editan studio profesional (KreatorLab style).
- \`s.spring(start = 0, preset = "snappy")\` -> 0..1 ("smooth", "snappy", "bouncy", "heavy", atau \`{ damping, stiffness, mass }\`).
- \`s.stagger(i, start = 0, gap = 0.06, preset)\` -> spring bertahap untuk daftar/grid objek.
- \`s.keys([[detik, nilai], ...], easing = "inOut")\` -> keyframe bertahap sepanjang durasi scene.
- \`s.at(start, len = 0.6)\` -> 0..1 ease-out; \`s.pop(start, len = 0.5)\` -> membal untuk \`draw\`/\`scale\`.
- \`s.ease.out(x)\`, \`s.ease.inOut(x)\`, \`s.ease.back(x)\`, \`s.ease.elastic(x)\`, \`s.ease.in(x)\`, \`s.ease.outExpo(x)\`.
- \`s.lerp(a, b, k)\`, \`s.clamp(x, a, b)\`, \`s.wave(freq = 1, amp = 1, phase = 0)\`, \`s.rand(i)\` -> 0..1.

## API Gambar 3D & 2D (Engine \`s\` & \`ctx\`)
- 3D: \`s.box(x, y, w, h, d, o3)\`, \`s.cube(x, y, size, o3)\`, \`s.cylinder(x, y, r, h, o3)\`, \`s.cone(x, y, r, h, o3)\`, \`s.sphere(x, y, r, o3)\`, \`s.extrude(x, y, points, depth, o3)\`, \`s.isoBox(i, j, base, w, h, d, o3)\`, \`s.isoCylinder(i, j, base, r, h, o3)\`, \`s.iso(i, j, z)\`.
  Bentuk siap pakai: \`s.shapes.star()\`, \`s.shapes.heart()\`, \`s.shapes.arrow()\`, \`s.shapes.bolt()\`, \`s.shapes.roundRect()\`, \`s.shapes.polygon()\`.
  Opsi \`o3\`: \`{ rx, ry, rz, scale, fill, stroke, alpha, draw, edges ("strong"|"soft"|"none"), round, ortho }\`.
- 2D: \`s.line\`, \`s.polyline\`, \`s.shape\`, \`s.curve\`, \`s.rect(x, y, w, h, { r, fill, stroke, width, wobble, hatch, draw })\`, \`s.circle\`, \`s.ellipse\`, \`s.arc\`, \`s.text\`, \`s.text3d\`, \`s.words\`, \`s.card\`, \`s.tag\`, \`s.shadow\`, \`s.check\`, \`s.cross\`, \`s.dash\`, \`s.sparkle\`, \`s.rays\`, \`s.burst\`, \`s.ground\`, \`s.group({ x, y, rotate, scale, alpha }, () => { ... })\`.
- Palet bawaan \`s.c\`: \`ink, paper, red, pink, orange, yellow, green, teal, blue, navy, purple, brown, sky, white, gray, glow\` (boleh hex).
- SEMUA sudut \`rotate\`, \`rx\`, \`ry\`, \`rz\` wajib dalam RADIAN (contoh \`-0.08\`, bukan derajat).
- Efek suara gerakan: \`s.sfx(name, time, gain = 1, pitch)\` — hanya picu pada gerakan animasi objek, zoom, dan interaksi (contoh nama semantik bebas: \`zoom_in\`, \`card_slide\`, \`data_scan\`, \`graph_grow\`, \`shield_lock\`, \`cursor_click\`, \`key_type\`, \`cinema_boom\`, \`whoosh\`, \`swish\`, \`pop\`, \`ding\`, \`sparkle\`, \`rise\`, \`impact\`). JANGAN menaruh efek suara pada tiap kata subtitle! Panggil 2–4 kali di level atas scene selaras dengan timestamp \`s.spring\`/\`s.pop\`/\`s.at\`.

${finishSection}

## Arahan Gaya "${gayaTitle}" (PRIORITAS UTAMA)
${gayaDirection}
${charSection}

## Konteks Cerita & Konsep Video (WAJIB DISINKRONKAN ANTAR SCENE)
- Judul: ${videoTitle}
- Tempo / Nuansa: ${tempo === 'santai' ? 'Santai & berbobot' : 'Energik & dinamis (objek utama masuk 0.0-0.35s, lanjut berkembang sepanjang durasi)'}
- Palet warna utama / brand: ${paletteColors}
${storyAngle ? `- Pesan / Benang merah cerita: ${storyAngle}` : ''}
${visualConcept ? `- Arahan visual konsep terpilih: ${visualConcept}` : ''}
- Peta alur seluruh video (tanda \`>>>\` adalah batch yang harus kamu tulis sekarang — pastikan komposisi tiap scene BEDA dari scene lain!):
${storyOverviewLines || `>>> [Scene ${startSceneNumber}..${endSceneNumber}]`}

${examplesSection}

## Tugas: Tulis Kode Animasi Scene ${startSceneNumber} sampai ${endSceneNumber}
Setiap scene HARUS punya metafora visual, tata letak, dan staging gerakan yang BERBEDA agar video tidak terasa diulang-ulang. Ikuti visual blueprint masing-masing scene di bawah ini:

${sceneBriefs}

## Format Jawaban (PENTING — AGAR BISA LANGSUNG DITERAPKAN)
Tulis SEMUA kode dalam SATU blok \`\`\`js saja tanpa teks penjelasan di luar blok kode. Pisahkan tiap scene dengan penanda persis seperti berikut:

\`\`\`js
// ===== SCENE ${firstNum} =====
// kode scene ${firstNum} di sini
${secondNum ? `\n// ===== SCENE ${secondNum} =====\n// kode scene ${secondNum} di sini` : ''}
\`\`\`

Jangan menulis kode React/JSX, jangan memecah menjadi banyak blok markdown, dan pastikan setiap nomor scene ${startSceneNumber}..${endSceneNumber} lengkap.`;

  return enrichPromptWithMedia(
    baseAnimPrompt,
    collectProjectPromptImages(project, { start: startSceneNumber, end: endSceneNumber })
  );
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
      "visual": "Jam weker 3D besar berdering di panggung visual editorial dengan kartu hook fokus pagi.",
      "theme": "paper",
      "duration": 7.5,
      "emphasis": "semangat",
      "camera": "push"
    },
    {
      "text": "Banyak orang mengira rasa malas di pagi hari bakal hilang sendiri kalau kita diam sambil menunggu mood dan semangat datang duluan.",
      "visual": "Dua magnet 3D muncul di papan: satu menarik ke kasur empuk, satu menarik ke meja kerja.",
      "theme": "paper",
      "duration": 7.5,
      "emphasis": "menunggu",
      "camera": "pan-left"
    },
    {
      "text": "Padahal semangat itu bukan syarat buat mulai bergerak. Justru semakin lama kamu diam rebahan, tarikan kasurnya terasa makin berat banget.",
      "visual": "Bidak silinder tertarik mendekati kasur, indikator batang merah naik perlahan di layar metrik.",
      "theme": "paper",
      "duration": 7.5,
      "emphasis": "kasur",
      "camera": "tilt-down"
    },
    {
      "text": "Bayangkan tubuhmu sekarang seperti benda yang terjebak tepat di tengah dua gaya tarik magnet besar yang terus saling berebut kendali.",
      "visual": "Garis gaya magnet menyala biru dan oranye memperlihatkan tegangan antara rebahan dan aksi.",
      "theme": "paper",
      "duration": 7.5,
      "emphasis": "magnet",
      "camera": "orbit"
    },
    {
      "text": "Cara memutus tarikannya sederhana banget: cukup duduk tegak, berdiri pelan, lalu langsung kerjakan satu tugas paling kecil selama dua menit.",
      "visual": "Checklist 3 langkah muncul bertahap: duduk tegak, berdiri pelan, mulai 2 menit dengan tanda centang hijau.",
      "theme": "paper",
      "duration": 7.5,
      "emphasis": "berdiri",
      "camera": "pan-right"
    },
    {
      "text": "Jadi jangan tunggu sampai kamu pengen bergerak. Begitu badanmu mulai jalan duluan, rasa semangatnya otomatis bakal buru-buru ikut menyusul.",
      "visual": "Batang 3D toska tumbuh pesat menunjukkan energi yang melonjak setelah 2 menit bergerak.",
      "theme": "paper",
      "duration": 7.5,
      "emphasis": "menyusul",
      "camera": "push"
    },
    {
      "text": "Kamu gak perlu langsung memenangkan perang melawan rasa malas sepanjang hari. Cukup fokus menang di sepuluh menit pertama setelah melek.",
      "visual": "Indikator target sepuluh menit pertama bersinar terang dengan lencana kemenangan berputar.",
      "theme": "paper",
      "duration": 7.5,
      "emphasis": "menang",
      "camera": "tilt-up"
    },
    {
      "text": "Besok pagi pas alarm bunyi, langsung hitung mundur tiga detik lalu berdiri dari kasur. Simpan dan follow biar gak lupa!",
      "visual": "Kartu data putih terangkat menampilkan tips 3 detik dan tombol follow bersinar emas di sudut.",
      "theme": "paper",
      "duration": 7.5,
      "emphasis": "follow",
      "camera": "pull"
    }
  ]
}`;

/**
 * Validates and parses user/AI JSON input conforming to either 5-ideas or scene blueprint.
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
        },
      };
    }

    // Format 2: Full scenes blueprint (Step 2: Naskah / Narasi)
    if (!Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
      return { success: false, error: 'JSON harus memiliki array "ideas" atau array "scenes".' };
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

      const sfxCue =
        idx === 0
          ? 'whoosh'
          : idx === parsed.scenes.length - 1
          ? 'ding'
          : idx % 2 === 0
          ? 'ding'
          : 'pop';

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
        sfx: s.sfx || {
          file: sfxCue === 'whoosh' ? 'whoosh_impact.mp3' : sfxCue === 'ding' ? 'pop_ding.mp3' : 'pop_ding.mp3',
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
        ...(parsed.gaya_video || parsed.styleModule
          ? { gaya_video: parsed.gaya_video || parsed.styleModule }
          : {}),
        seo: parsed.seo,
        hook_structure: parsed.hook,
        background_themes: parsed.background,
        scenes,
      },
    };
  } catch (err: any) {
    return { success: false, error: `Gagal mem-parsing JSON: ${err.message}` };
  }
}


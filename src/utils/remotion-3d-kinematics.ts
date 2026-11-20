// Pure deterministic Remotion-compatible 3D choreography, physics, pose cross-fading,
// and calibrated subtitle timing engine (zero DOM / WebGL side effects).

export type StageThemeKind =
  | 'dark_cyber'
  | 'light_grid'
  | 'studio_room'
  | 'blueprint_cad'
  | 'mechanism_gears'
  | 'cinema_noir'
  | 'chalkboard_class'
  | 'minimal_zen'
  | 'ui_browser_lab'
  | 'diorama_data';

export function resolveStageThemeFromStyle(
  styleId: string,
  sceneTheme?: string,
  sceneIndex = 0
): StageThemeKind {
  const s = String(styleId || '').toLowerCase();
  if (s === 'studio_3d_room') return 'studio_room';
  if (s === 'blueprint') return 'blueprint_cad';
  if (s === 'carakerja' || s === 'cara_kerja') return 'mechanism_gears';
  if (s === 'monofilm' || s === 'vintage_film') return 'cinema_noir';
  if (s === 'kapur' || s === 'papan_kapur') return 'chalkboard_class';
  if (s === 'tenang' || s === 'tenang_minimalis' || s === 'kuas') return 'minimal_zen';
  if (s === 'editorial_motion_grid') {
    if (sceneTheme === 'paper') return 'light_grid';
    if (sceneTheme === 'night' || sceneTheme === 'dusk') return 'dark_cyber';
    return sceneIndex % 2 === 0 ? 'dark_cyber' : 'light_grid';
  }
  if (
    s === 'uiweb' ||
    s === 'aurora' ||
    s === 'bento_grid' ||
    s === 'panduan' ||
    s === 'infopop'
  ) {
    return 'ui_browser_lab';
  }
  if (
    s === 'diorama' ||
    s === 'diorama_data' ||
    s === 'papercut' ||
    s === 'robekan_kertas' ||
    s === 'celengan_pecah'
  ) {
    return 'diorama_data';
  }
  if (sceneTheme === 'paper') return 'light_grid';
  if (sceneTheme === 'night' || sceneTheme === 'dusk') return 'dark_cyber';
  return sceneIndex % 2 === 0 ? 'dark_cyber' : 'light_grid';
}

export type StageAspectRatio = '9:16' | '16:9' | '1:1' | '3:4';
export type StageMotifKind =
  | 'alarm_clock'
  | 'magnet_choice'
  | 'phone_scroll'
  | 'money_flow'
  | 'growth_chart'
  | 'checklist_steps'
  | 'stair_goal'
  | 'brain_idea'
  | 'cta_card'
  | 'website_walkthrough';

export type NarratorPoseId =
  | 'stand'
  | 'present'
  | 'point'
  | 'think'
  | 'cheer'
  | 'thumbs'
  | 'wave'
  | 'idea'
  | 'phone'
  | 'cash'
  | 'headache'
  | 'scared'
  | 'tired'
  | 'shrug'
  | 'sittype'
  | 'walk'
  | 'explain'
  | 'yes';

export interface SpringConfig {
  damping?: number;
  stiffness?: number;
  mass?: number;
}

export interface InterpolateOptions {
  extrapolateLeft?: 'extend' | 'clamp';
  extrapolateRight?: 'extend' | 'clamp';
  easing?: (t: number) => number;
}

export function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function easeOutCubic(t: number): number {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

export function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function easeSnapSettle(t: number): number {
  const x = clamp01(t);
  const c1 = 1.45;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

/**
 * 100% compatible with Remotion's interpolate(frame, inputRange, outputRange, options)
 */
export function remotionInterpolate(
  frame: number,
  inputRange: number[],
  outputRange: number[],
  options: InterpolateOptions = {}
): number {
  if (inputRange.length === 0 || outputRange.length === 0) return 0;
  if (inputRange.length !== outputRange.length) {
    const len = Math.min(inputRange.length, outputRange.length);
    inputRange = inputRange.slice(0, len);
    outputRange = outputRange.slice(0, len);
  }
  const { extrapolateLeft = 'extend', extrapolateRight = 'extend', easing } = options;
  if (frame <= inputRange[0]) {
    if (extrapolateLeft === 'clamp' || inputRange.length === 1) return outputRange[0];
  }
  if (frame >= inputRange[inputRange.length - 1]) {
    if (extrapolateRight === 'clamp' || inputRange.length === 1) {
      return outputRange[outputRange.length - 1];
    }
  }
  let i = 0;
  for (let idx = 0; idx < inputRange.length - 1; idx++) {
    if (frame >= inputRange[idx] && frame <= inputRange[idx + 1]) {
      i = idx;
      break;
    }
    if (frame > inputRange[idx + 1]) i = idx;
  }
  const span = inputRange[i + 1] - inputRange[i];
  let t = span === 0 ? 0 : (frame - inputRange[i]) / span;
  if (easing) t = easing(t);
  const res = outputRange[i] + t * (outputRange[i + 1] - outputRange[i]);
  return Number.isFinite(res) ? res : outputRange[0];
}

/**
 * Remotion-compatible analytical damped spring solver returning ~0..1 (with controlled natural overshoot)
 */
export function remotionSpring({
  frame,
  fps = 60,
  config = {},
}: {
  frame: number;
  fps?: number;
  config?: SpringConfig;
}): number {
  if (!Number.isFinite(frame) || frame < 0) return 0;
  const damping = Math.max(2, config.damping ?? 13);
  const stiffness = Math.max(10, config.stiffness ?? 160);
  const mass = Math.max(0.1, config.mass ?? 0.85);
  const t = frame / Math.max(1, fps);
  const omega0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
    const env = Math.exp(-zeta * omega0 * t);
    const val = 1 - env * (Math.cos(omegaD * t) + ((zeta * omega0) / omegaD) * Math.sin(omegaD * t));
    return Number.isFinite(val) ? val : 1;
  }
  const val = 1 - (1 + omega0 * t) * Math.exp(-omega0 * t);
  return Number.isFinite(val) ? val : 1;
}

export interface CalibratedWordTiming {
  word: string;
  at: number;
  end: number;
  isEmphasis: boolean;
}

/**
 * Computes syllable/punctuation-weighted karaoke word timings so subtitles match spoken rhythm
 * rather than naive uniform linear character spacing.
 */
export function computeCalibratedWordTimings(
  text: string,
  emphasisWords: string[] = [],
  tempo: 'energik' | 'santai' = 'energik',
  durationSec = 4
): CalibratedWordTiming[] {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const safeDur = Math.max(0.6, Number(durationSec) || 4);
  const normEmph = new Set(
    (emphasisWords || []).map((w) => String(w || '').toLowerCase().replace(/[^a-z0-9]/gi, '')).filter(Boolean)
  );

  const weights = words.map((w) => {
    const clean = w.toLowerCase().replace(/[^a-z0-9]/gi, '');
    const lenWeight = Math.max(1, Math.min(4.2, clean.length * 0.28 + 0.72));
    const punctPause = /[.!?]$/.test(w) ? 1.15 : /[,;:]$/.test(w) ? 0.55 : 0;
    const emphBoost = normEmph.has(clean) ? 0.35 : 0;
    return lenWeight + punctPause + emphBoost;
  });

  const totalW = weights.reduce((a, b) => a + b, 0) || words.length;
  const leadPad = Math.min(0.22, safeDur * 0.04);
  const tailPad = tempo === 'santai' ? Math.min(0.42, safeDur * 0.1) : Math.min(0.28, safeDur * 0.07);
  const activeSpan = Math.max(0.35, safeDur - leadPad - tailPad);

  let cursor = leadPad;
  return words.map((word, idx) => {
    const span = (weights[idx] / totalW) * activeSpan;
    const at = cursor;
    const end = Math.min(safeDur, at + Math.max(0.08, span));
    cursor = end;
    const clean = word.toLowerCase().replace(/[^a-z0-9]/gi, '');
    return {
      word,
      at: Number(at.toFixed(3)),
      end: Number(end.toFixed(3)),
      isEmphasis: normEmph.has(clean),
    };
  });
}

export function getActiveWordIndex(timings: CalibratedWordTiming[], localTimeSec: number): number {
  if (!timings || timings.length === 0) return -1;
  if (localTimeSec < timings[0].at) return 0;
  let active = 0;
  for (let i = 0; i < timings.length; i++) {
    if (localTimeSec >= timings[i].at) active = i;
    else break;
  }
  return active;
}

export interface SubtitleSafeZone {
  anchorXRatio: number;
  bottomYRatio: number;
  maxWidthRatio: number;
  fontScale: number;
  align: 'center' | 'left';
}

export function computeSubtitleSafeZone(
  ratio: StageAspectRatio,
  hasCharacter: boolean,
  theme: StageThemeKind
): SubtitleSafeZone {
  const isWide = ratio === '16:9';
  const isLightMode =
    theme === 'light_grid' || theme === 'minimal_zen' || theme === 'diorama_data';
  if (isLightMode || theme === 'dark_cyber' || theme === 'blueprint_cad' || theme === 'ui_browser_lab') {
    if (isWide) {
      return {
        anchorXRatio: hasCharacter ? 0.5 : 0.5,
        bottomYRatio: 0.875,
        maxWidthRatio: 0.72,
        fontScale: 0.92,
        align: 'center',
      };
    }
    return {
      anchorXRatio: 0.5,
      bottomYRatio: 0.84,
      maxWidthRatio: 0.84,
      fontScale: 1.0,
      align: 'center',
    };
  }
  return {
    anchorXRatio: 0.5,
    bottomYRatio: isWide ? 0.88 : 0.84,
    maxWidthRatio: isWide ? 0.72 : 0.84,
    fontScale: isWide ? 0.92 : 1.0,
    align: 'center',
  };
}

export type CharacterEyeMode = 'normal' | 'happy_arc' | 'wide_shock' | 'tired_half';

export interface CharacterJointAngles {
  torsoLeanX: number;
  torsoYaw: number;
  headYaw: number;
  headPitch: number;
  headRoll: number;
  leftShoulderZ: number;
  leftShoulderX: number;
  leftElbowX: number;
  rightShoulderZ: number;
  rightShoulderX: number;
  rightElbowX: number;
  leftHipX: number;
  rightHipX: number;
  leftKneeX: number;
  rightKneeX: number;
  hipBobY: number;
  bodySquash: number;
  hairSwayX: number;
  hairSwayZ: number;
  browLift: number;
  browTilt: number;
  eyeMode: CharacterEyeMode;
  mouthShape: 'rest' | 'A' | 'E' | 'O' | 'M';
  bouncePhase: number;
  blinkAmount: number;
  lookDir: number;
  mouthOpen: number;
}

interface PosePresetDef {
  torsoLeanX: number;
  torsoYaw: number;
  headYaw: number;
  headPitch: number;
  headRoll: number;
  leftShoulderZ: number;
  leftShoulderX: number;
  leftElbowX: number;
  rightShoulderZ: number;
  rightShoulderX: number;
  rightElbowX: number;
  browLift: number;
  browTilt: number;
  eyeMode: CharacterEyeMode;
}

const POSE_PRESETS: Record<NarratorPoseId, PosePresetDef> = {
  stand: {
    torsoLeanX: 0.02,
    torsoYaw: 0.16,
    headYaw: -0.06,
    headPitch: 0,
    headRoll: 0.02,
    leftShoulderZ: 0.22,
    leftShoulderX: 0.08,
    leftElbowX: -0.35,
    rightShoulderZ: -0.22,
    rightShoulderX: 0.08,
    rightElbowX: -0.35,
    browLift: 0.02,
    browTilt: 0,
    eyeMode: 'normal',
  },
  present: {
    torsoLeanX: 0.05,
    torsoYaw: 0.22,
    headYaw: -0.1,
    headPitch: -0.05,
    headRoll: 0.06,
    leftShoulderZ: 0.28,
    leftShoulderX: -0.18,
    leftElbowX: -0.52,
    rightShoulderZ: -0.92,
    rightShoulderX: -0.52,
    rightElbowX: -0.78,
    browLift: 0.14,
    browTilt: 0.06,
    eyeMode: 'normal',
  },
  explain: {
    torsoLeanX: 0.06,
    torsoYaw: 0.18,
    headYaw: -0.08,
    headPitch: -0.04,
    headRoll: 0.05,
    leftShoulderZ: 0.72,
    leftShoulderX: -0.48,
    leftElbowX: -0.86,
    rightShoulderZ: -0.96,
    rightShoulderX: -0.58,
    rightElbowX: -0.82,
    browLift: 0.2,
    browTilt: 0.08,
    eyeMode: 'normal',
  },
  point: {
    torsoLeanX: 0.06,
    torsoYaw: 0.26,
    headYaw: -0.14,
    headPitch: -0.07,
    headRoll: -0.07,
    leftShoulderZ: 0.24,
    leftShoulderX: 0.1,
    leftElbowX: -0.38,
    rightShoulderZ: -1.28,
    rightShoulderX: -0.68,
    rightElbowX: -0.26,
    browLift: 0.22,
    browTilt: 0.12,
    eyeMode: 'normal',
  },
  think: {
    torsoLeanX: -0.03,
    torsoYaw: -0.14,
    headYaw: 0.16,
    headPitch: 0.11,
    headRoll: 0.11,
    leftShoulderZ: 0.22,
    leftShoulderX: 0.15,
    leftElbowX: -0.48,
    rightShoulderZ: -0.52,
    rightShoulderX: -0.98,
    rightElbowX: -1.42,
    browLift: -0.08,
    browTilt: -0.22,
    eyeMode: 'normal',
  },
  headache: {
    torsoLeanX: 0.1,
    torsoYaw: -0.06,
    headYaw: 0.08,
    headPitch: 0.14,
    headRoll: -0.1,
    leftShoulderZ: 0.92,
    leftShoulderX: -1.18,
    leftElbowX: -1.42,
    rightShoulderZ: -0.92,
    rightShoulderX: -1.18,
    rightElbowX: -1.42,
    browLift: -0.05,
    browTilt: -0.28,
    eyeMode: 'tired_half',
  },
  scared: {
    torsoLeanX: -0.08,
    torsoYaw: 0.06,
    headYaw: -0.05,
    headPitch: -0.08,
    headRoll: -0.07,
    leftShoulderZ: 0.86,
    leftShoulderX: -0.92,
    leftElbowX: -1.24,
    rightShoulderZ: -0.86,
    rightShoulderX: -0.92,
    rightElbowX: -1.24,
    browLift: 0.42,
    browTilt: -0.2,
    eyeMode: 'wide_shock',
  },
  tired: {
    torsoLeanX: 0.16,
    torsoYaw: -0.06,
    headYaw: 0.06,
    headPitch: 0.22,
    headRoll: 0.09,
    leftShoulderZ: 0.14,
    leftShoulderX: 0.18,
    leftElbowX: -0.18,
    rightShoulderZ: -0.14,
    rightShoulderX: 0.18,
    rightElbowX: -0.18,
    browLift: -0.06,
    browTilt: -0.24,
    eyeMode: 'tired_half',
  },
  shrug: {
    torsoLeanX: -0.02,
    torsoYaw: 0.12,
    headYaw: -0.06,
    headPitch: 0.04,
    headRoll: 0.14,
    leftShoulderZ: 0.88,
    leftShoulderX: -0.35,
    leftElbowX: -1.08,
    rightShoulderZ: -0.88,
    rightShoulderX: -0.35,
    rightElbowX: -1.08,
    browLift: 0.28,
    browTilt: -0.12,
    eyeMode: 'normal',
  },
  sittype: {
    torsoLeanX: 0.09,
    torsoYaw: 0.15,
    headYaw: -0.06,
    headPitch: 0.14,
    headRoll: 0.03,
    leftShoulderZ: 0.42,
    leftShoulderX: -0.78,
    leftElbowX: -1.18,
    rightShoulderZ: -0.42,
    rightShoulderX: -0.78,
    rightElbowX: -1.18,
    browLift: 0.08,
    browTilt: 0.14,
    eyeMode: 'normal',
  },
  walk: {
    torsoLeanX: 0.07,
    torsoYaw: 0.24,
    headYaw: -0.1,
    headPitch: -0.03,
    headRoll: 0.04,
    leftShoulderZ: 0.26,
    leftShoulderX: -0.42,
    leftElbowX: -0.68,
    rightShoulderZ: -0.26,
    rightShoulderX: 0.36,
    rightElbowX: -0.48,
    browLift: 0.16,
    browTilt: 0.06,
    eyeMode: 'normal',
  },
  yes: {
    torsoLeanX: -0.05,
    torsoYaw: 0.16,
    headYaw: -0.06,
    headPitch: -0.09,
    headRoll: -0.06,
    leftShoulderZ: 0.36,
    leftShoulderX: -0.28,
    leftElbowX: -0.75,
    rightShoulderZ: -1.86,
    rightShoulderX: -0.65,
    rightElbowX: -1.24,
    browLift: 0.34,
    browTilt: 0.12,
    eyeMode: 'happy_arc',
  },
  cheer: {
    torsoLeanX: -0.06,
    torsoYaw: 0.1,
    headYaw: -0.04,
    headPitch: -0.12,
    headRoll: 0.08,
    leftShoulderZ: 2.38,
    leftShoulderX: -0.24,
    leftElbowX: -0.38,
    rightShoulderZ: -2.38,
    rightShoulderX: -0.24,
    rightElbowX: -0.38,
    browLift: 0.35,
    browTilt: 0.14,
    eyeMode: 'happy_arc',
  },
  thumbs: {
    torsoLeanX: 0.04,
    torsoYaw: 0.18,
    headYaw: -0.08,
    headPitch: -0.05,
    headRoll: -0.06,
    leftShoulderZ: 0.22,
    leftShoulderX: 0.08,
    leftElbowX: -0.34,
    rightShoulderZ: -0.76,
    rightShoulderX: -0.92,
    rightElbowX: -1.04,
    browLift: 0.26,
    browTilt: 0.08,
    eyeMode: 'happy_arc',
  },
  wave: {
    torsoLeanX: 0.03,
    torsoYaw: 0.14,
    headYaw: -0.05,
    headPitch: -0.06,
    headRoll: 0.08,
    leftShoulderZ: 0.22,
    leftShoulderX: 0.06,
    leftElbowX: -0.34,
    rightShoulderZ: -2.24,
    rightShoulderX: -0.18,
    rightElbowX: -0.48,
    browLift: 0.28,
    browTilt: 0.1,
    eyeMode: 'happy_arc',
  },
  idea: {
    torsoLeanX: -0.04,
    torsoYaw: 0.2,
    headYaw: -0.08,
    headPitch: -0.14,
    headRoll: -0.09,
    leftShoulderZ: 0.26,
    leftShoulderX: 0.12,
    leftElbowX: -0.46,
    rightShoulderZ: -2.12,
    rightShoulderX: -0.38,
    rightElbowX: -0.28,
    browLift: 0.36,
    browTilt: 0.14,
    eyeMode: 'normal',
  },
  phone: {
    torsoLeanX: 0.1,
    torsoYaw: 0.08,
    headYaw: -0.04,
    headPitch: 0.2,
    headRoll: 0.05,
    leftShoulderZ: 0.38,
    leftShoulderX: -0.68,
    leftElbowX: -1.14,
    rightShoulderZ: -0.38,
    rightShoulderX: -0.68,
    rightElbowX: -1.14,
    browLift: 0.05,
    browTilt: -0.08,
    eyeMode: 'normal',
  },
  cash: {
    torsoLeanX: 0.05,
    torsoYaw: 0.18,
    headYaw: -0.08,
    headPitch: -0.04,
    headRoll: 0.06,
    leftShoulderZ: 0.48,
    leftShoulderX: -0.54,
    leftElbowX: -0.94,
    rightShoulderZ: -0.62,
    rightShoulderX: -0.72,
    rightElbowX: -0.92,
    browLift: 0.24,
    browTilt: 0.08,
    eyeMode: 'normal',
  },
};

export function normalizeNarratorPose(raw?: string): NarratorPoseId {
  const p = String(raw || '').toLowerCase();
  if (p.includes('headache') || p.includes('facepalm')) return 'headache';
  if (p.includes('scared') || p.includes('shock') || p.includes('panic')) return 'scared';
  if (p.includes('tired') || p.includes('sigh') || p.includes('sad') || p.includes('cry')) return 'tired';
  if (p.includes('shrug') || p.includes('no')) return 'shrug';
  if (p.includes('sittype') || p.includes('type') || p.includes('code') || p.includes('laptop')) return 'sittype';
  if (p.includes('walk') || p.includes('run')) return 'walk';
  if (p.includes('explain')) return 'explain';
  if (p.includes('yes') || p.includes('fist')) return 'yes';
  if (p.includes('point') || p.includes('you')) return 'point';
  if (p.includes('think')) return 'think';
  if (p.includes('cheer') || p.includes('happy') || p.includes('hype') || p.includes('jump')) return 'cheer';
  if (p.includes('thumb') || p.includes('ok')) return 'thumbs';
  if (p.includes('wave') || p.includes('invite')) return 'wave';
  if (p.includes('idea')) return 'idea';
  if (p.includes('phone') || p.includes('watch')) return 'phone';
  if (p.includes('cash') || p.includes('money') || p.includes('count')) return 'cash';
  if (p.includes('present')) return 'present';
  return 'present';
}

export function select3DSemanticPoseBeats(
  scene: any,
  motif: StageMotifKind,
  sceneIndex: number,
  isHook: boolean,
  isCta: boolean
): [NarratorPoseId, NarratorPoseId, NarratorPoseId, NarratorPoseId] {
  if (Array.isArray(scene?.beatPoses) && scene.beatPoses.length >= 4) {
    return [
      normalizeNarratorPose(scene.beatPoses[0]),
      normalizeNarratorPose(scene.beatPoses[1]),
      normalizeNarratorPose(scene.beatPoses[2]),
      normalizeNarratorPose(scene.beatPoses[3]),
    ];
  }
  const text = `${scene?.narration_text || scene?.text || ''} ${scene?.on_screen_text || scene?.hookText || ''} ${scene?.emphasis || ''}`.toLowerCase();
  const role = String(scene?.role || '').toLowerCase();

  if (isCta || role === 'cta') {
    return ['wave', 'point', 'yes', 'cheer'];
  }
  if (/pusing|stres|berat|capek|lelah|burnout|gagal|bingung|masalah|problem|sulit|ribet|stuck|habis/.test(text) || role === 'problem') {
    return ['headache', 'tired', 'shrug', 'explain'];
  }
  if (/kaget|bahaya|jangan|stop|awas|ternyata|rahasia|fakta|kesalahan|bohong|mitos/.test(text)) {
    return ['scared', 'point', 'explain', 'idea'];
  }
  if (/kode|coding|react|remotion|typescript|github|script|terminal|prompt|ai|otomasi|deploy|workflow|website|aplikasi/.test(text)) {
    return ['sittype', 'explain', 'point', 'thumbs'];
  }
  if (/uang|rupiah|gaji|omset|cuan|profit|rp|dollar|kaya|hemat|biaya|investasi|saham/.test(text) || motif === 'money_flow') {
    return ['cash', 'explain', 'yes', 'cheer'];
  }
  if (/hp|ponsel|smartphone|scroll|tiktok|reels|shorts|sosmed|notifikasi|layar/.test(text) || motif === 'phone_scroll') {
    return ['phone', 'scared', 'point', 'explain'];
  }
  if (/langkah|step|cara|tahap|proses|mulai|jalan|rutinitas|kebiasaan|checklist/.test(text) || motif === 'checklist_steps' || motif === 'stair_goal') {
    return ['walk', 'explain', 'point', 'yes'];
  }
  if (/grafik|data|statistik|naik|tumbuh|persen|target|hasil|performa/.test(text) || motif === 'growth_chart') {
    return ['present', 'point', 'yes', 'thumbs'];
  }
  if (isHook) {
    return ['scared', 'point', 'explain', 'idea'];
  }

  const cycles: Array<[NarratorPoseId, NarratorPoseId, NarratorPoseId, NarratorPoseId]> = [
    ['present', 'explain', 'point', 'thumbs'],
    ['think', 'idea', 'explain', 'yes'],
    ['walk', 'point', 'explain', 'thumbs'],
    ['shrug', 'explain', 'idea', 'yes'],
  ];
  return cycles[sceneIndex % cycles.length];
}

export function evaluateCharacterJoints(
  poseA: NarratorPoseId,
  poseB: NarratorPoseId,
  blend: number,
  localTimeSec: number,
  globalTimeSec: number,
  isSpeaking: boolean,
  words?: CalibratedWordTiming[],
  anticipationImpulse = 0
): CharacterJointAngles {
  const a = POSE_PRESETS[poseA] || POSE_PRESETS.present;
  const b = POSE_PRESETS[poseB] || POSE_PRESETS.present;
  // Spring-overshoot blend curve (allows natural 8% settle overshoot instead of robotic linear clamp)
  const w = Math.max(-0.15, Math.min(1.15, blend));
  const lerp = (x: number, y: number) => x + (y - x) * w;

  // Multi-harmonic organic breathing & conversational weight transfer (never single monotonous sine)
  const breath = Math.sin(globalTimeSec * 1.85) * 0.65 + Math.sin(globalTimeSec * 3.7 + 0.8) * 0.35;
  const sway = Math.sin(globalTimeSec * 1.45) * 0.7 + Math.cos(globalTimeSec * 2.5) * 0.3;
  const gesturePulse = isSpeaking
    ? Math.sin(globalTimeSec * 3.2) * 0.11 + Math.cos(globalTimeSec * 2.1) * 0.06
    : Math.sin(globalTimeSec * 1.8) * 0.025;

  const waveExtra =
    poseB === 'wave' || poseA === 'wave'
      ? Math.sin(globalTimeSec * 4.6) * 0.26 * (poseB === 'wave' ? clamp01(w) : clamp01(1 - w))
      : 0;
  const cheerBounce =
    poseB === 'cheer' || poseA === 'cheer' || poseB === 'yes' || poseA === 'yes'
      ? Math.abs(Math.sin(globalTimeSec * 4.2)) * 0.05 * (poseB === 'cheer' || poseB === 'yes' ? clamp01(w) : clamp01(1 - w))
      : 0;

  // Natural alternating forearm typing motion when in 'sittype' pose
  const isTypingWeight = poseB === 'sittype' ? clamp01(w) : poseA === 'sittype' ? clamp01(1 - w) : 0;
  const typePulseL = isTypingWeight * Math.sin(globalTimeSec * 8.2) * 0.12;
  const typePulseR = isTypingWeight * Math.cos(globalTimeSec * 8.2) * 0.12;

  // Dynamic stride swing when in 'walk' pose
  const isWalkingWeight = poseB === 'walk' ? clamp01(w) : poseA === 'walk' ? clamp01(1 - w) : 0;
  const walkStride = isWalkingWeight * Math.sin(globalTimeSec * 3.8) * 0.28;

  // Subtle head shake when in 'headache' or 'scared' pose
  const isStressWeight =
    poseB === 'headache' || poseB === 'scared'
      ? clamp01(w)
      : poseA === 'headache' || poseA === 'scared'
      ? clamp01(1 - w)
      : 0;
  const stressShakeYaw = isStressWeight * Math.sin(globalTimeSec * 5.2) * 0.048;

  // Anticipation dip -> stretch impulse on beat transitions
  const dipEnv = Math.sin(clamp01(anticipationImpulse) * Math.PI);
  const bodySquash = dipEnv * -0.065 + cheerBounce * 0.45 + breath * 0.012;

  // Natural double-blink & single-blink cadence
  const blinkPhase = (globalTimeSec + 0.6) % 3.6;
  let blinkAmount = 0;
  if (blinkPhase > 3.44) {
    blinkAmount = Math.sin(((blinkPhase - 3.44) / 0.16) * Math.PI);
  } else if (blinkPhase > 1.72 && blinkPhase < 1.85 && Math.floor(globalTimeSec / 3.6) % 2 === 1) {
    blinkAmount = Math.sin(((blinkPhase - 1.72) / 0.13) * Math.PI);
  }

  // Dynamic gaze tracking toward active showcase card & camera
  const lookDir = Math.sin(localTimeSec * 1.65) * 0.58 + Math.cos(globalTimeSec * 2.9) * 0.24;

  // Syllable-aware vowel lip-sync + word-level emotional expression when calibrated word timings are available
  let mouthOpen = 0.04;
  let mouthShape: 'rest' | 'A' | 'E' | 'O' | 'M' = 'rest';
  let emphasisNod = 0;
  let wordBrowBoost = 0;
  let wordBrowTiltDelta = 0;
  let wordEyeOverride: CharacterJointAngles['eyeMode'] | null = null;
  let syllableArmImpulse = 0;

  if (isSpeaking) {
    if (words && words.length > 0) {
      const activeWord = words.find((wt) => localTimeSec >= wt.at - 0.02 && localTimeSec <= wt.end + 0.03);
      if (activeWord) {
        const dur = Math.max(0.07, activeWord.end - activeWord.at);
        const u = clamp01((localTimeSec - activeWord.at) / dur);
        const lower = activeWord.word.toLowerCase();
        const vowelChunks = lower.match(/[aiueo]+/g) || ['a'];
        const sylCount = Math.max(1, Math.min(4, vowelChunks.length));
        const sylPos = u * sylCount;
        const sylIdx = Math.min(sylCount - 1, Math.floor(sylPos));
        const sylLocal = sylPos - Math.floor(sylPos);
        const sylPulse = Math.pow(Math.sin(sylLocal * Math.PI), 0.78);
        const wordEnv = Math.pow(Math.sin(u * Math.PI), 0.72);
        const vChunk = vowelChunks[sylIdx] || 'a';

        mouthOpen = clamp01((0.18 + 0.82 * sylPulse) * Math.min(1, wordEnv * (activeWord.isEmphasis ? 1.42 : 1.24)));
        if (mouthOpen < 0.14 || (sylCount > 1 && sylPulse < 0.22)) {
          mouthShape = 'M';
          mouthOpen = Math.min(mouthOpen, 0.12);
        } else if (vChunk.includes('o') || vChunk.includes('u')) {
          mouthShape = 'O';
        } else if (vChunk.includes('a')) {
          mouthShape = 'A';
        } else {
          mouthShape = 'E';
        }

        syllableArmImpulse = mouthOpen * (activeWord.isEmphasis ? 0.22 : 0.11);
        if (activeWord.isEmphasis || /\d|[!?]/.test(activeWord.word)) {
          emphasisNod = Math.sin(u * Math.PI) * 0.095;
          wordBrowBoost = Math.sin(u * Math.PI) * 0.18;
        }

        if (/pusing|stres|bingung|masalah|gagal|rugi|bahaya|awas|salah|boncos|turun|macet|capek|lelah/.test(lower)) {
          wordEyeOverride = 'tired_half';
          wordBrowTiltDelta = 0.18;
        } else if (/kaget|ternyata|rahasia|mengejutkan|shock|darurat|90%|99%|fakta|bocor|!/.test(lower)) {
          wordEyeOverride = 'wide_shock';
          wordBrowBoost += 0.16;
        } else if (/sukses|untung|cuan|berhasil|naik|menang|hebat|solusi|mudah|cepat|otomatis/.test(lower)) {
          wordEyeOverride = 'happy_arc';
          wordBrowBoost += 0.12;
        }
      } else {
        mouthOpen = 0.04;
        mouthShape = 'M';
      }
    } else {
      const env = Math.abs(Math.sin(globalTimeSec * 12.8) * Math.cos(globalTimeSec * 5.6));
      mouthOpen = clamp01(0.16 + 0.8 * env);
      mouthShape = mouthOpen > 0.6 ? 'A' : mouthOpen > 0.35 ? 'O' : mouthOpen > 0.15 ? 'E' : 'M';
      syllableArmImpulse = mouthOpen * 0.12;
    }
  }

  // Secondary overlapping follow-through (delayed phase on hair/ears)
  const delayedSway = Math.sin((globalTimeSec - 0.11) * 1.95) * 0.7 + Math.cos((globalTimeSec - 0.11) * 3.4) * 0.3;
  const hairSwayX = -breath * 0.035 - emphasisNod * 0.45 + dipEnv * 0.06;
  const hairSwayZ = -delayedSway * 0.045;

  const kneeFlex = Math.max(0, dipEnv * 0.24 + (breath < 0 ? -breath * 0.04 : 0) + Math.abs(walkStride) * 0.35);
  const activePreset = w >= 0.5 ? b : a;

  return {
    torsoLeanX: lerp(a.torsoLeanX, b.torsoLeanX) + breath * 0.022 + dipEnv * 0.05 + emphasisNod * 0.35,
    torsoYaw: lerp(a.torsoYaw, b.torsoYaw) + sway * 0.055 + walkStride * 0.22,
    headYaw: lerp(a.headYaw, b.headYaw) + lookDir * 0.095 + stressShakeYaw,
    headPitch: lerp(a.headPitch, b.headPitch) + Math.cos(globalTimeSec * 2.3) * 0.032 - emphasisNod + mouthOpen * 0.038,
    headRoll: lerp(a.headRoll, b.headRoll) + sway * 0.038 + (isSpeaking ? Math.sin(globalTimeSec * 3.7) * 0.032 : 0),
    leftShoulderZ: lerp(a.leftShoulderZ, b.leftShoulderZ) + gesturePulse * 0.45,
    leftShoulderX: lerp(a.leftShoulderX, b.leftShoulderX) - Math.abs(gesturePulse) * 0.22 - syllableArmImpulse * 0.45 + walkStride * 0.55,
    leftElbowX: lerp(a.leftElbowX, b.leftElbowX) - Math.abs(gesturePulse) * 0.32 - syllableArmImpulse * 0.55 + typePulseL,
    rightShoulderZ: lerp(a.rightShoulderZ, b.rightShoulderZ) + waveExtra - gesturePulse * 0.65,
    rightShoulderX: lerp(a.rightShoulderX, b.rightShoulderX) - Math.abs(gesturePulse) * 0.35 - syllableArmImpulse * 0.65 - walkStride * 0.55,
    rightElbowX: lerp(a.rightElbowX, b.rightElbowX) - Math.abs(gesturePulse) * 0.42 - syllableArmImpulse * 0.8 + typePulseR,
    leftHipX: -kneeFlex * 0.52 + sway * 0.02 - walkStride,
    rightHipX: -kneeFlex * 0.52 - sway * 0.02 + walkStride,
    leftKneeX: kneeFlex,
    rightKneeX: kneeFlex,
    hipBobY: Math.abs(Math.sin(globalTimeSec * 3.4)) * 0.042 + cheerBounce + Math.abs(walkStride) * 0.12 - dipEnv * 0.055,
    bodySquash,
    hairSwayX,
    hairSwayZ,
    browLift: lerp(a.browLift, b.browLift) + wordBrowBoost + mouthOpen * 0.08,
    browTilt: lerp(a.browTilt, b.browTilt) + wordBrowTiltDelta,
    eyeMode: wordEyeOverride || activePreset.eyeMode,
    mouthShape,
    bouncePhase: sway,
    blinkAmount: clamp01(blinkAmount),
    lookDir,
    mouthOpen: clamp01(mouthOpen),
  };
}

function scoreSingleSceneFor3DMotif(scene: any, idx: number, totalScenes: number): StageMotifKind[] {
  if (scene?.website_step) return ['website_walkthrough'];
  const role = String(scene?.role || '').toLowerCase();
  if (role === 'cta' || (totalScenes > 1 && idx === totalScenes - 1)) return ['cta_card'];

  const assets = Array.isArray(scene?.visual_animation?.asset_elements)
    ? scene.visual_animation.asset_elements.join(' ').toLowerCase()
    : '';
  const text = `${scene?.narration_text || scene?.text || ''} ${scene?.on_screen_text || scene?.hookText || ''} ${scene?.visualDescription || ''} ${assets}`.toLowerCase();

  const ranked: StageMotifKind[] = [];
  if (/jam|waktu|pagi|alarm|menit|detik/.test(text) && !/hp|layar|scroll/.test(text)) ranked.push('alarm_clock');
  if (/magnet|tarik|pilihan|dua|kasur|kebiasaan|vs|banding/.test(text)) ranked.push('magnet_choice');
  if (/hp|ponsel|smartphone|layar|scroll|aplikasi|reels|tiktok|shorts|klip/.test(text)) ranked.push('phone_scroll');
  if (/uang|rupiah|gaji|omset|cuan|profit|rp|\$|dollar|pendapatan/.test(text)) ranked.push('money_flow');
  if (/grafik|naik|tumbuh|persen|%|data|statistik|metrik|views|100/.test(text)) ranked.push('growth_chart');
  if (/langkah|cara|checklist|step|daftar|tips|mulai/.test(text)) ranked.push('checklist_steps');
  if (/tangga|target|tujuan|puncak|sukses|karir|menang/.test(text)) ranked.push('stair_goal');
  if (/otak|pikiran|ide|kreatif|mindset|solusi|fokus/.test(text)) ranked.push('brain_idea');

  const fallbackOrder: StageMotifKind[] = [
    'alarm_clock',
    'magnet_choice',
    'phone_scroll',
    'growth_chart',
    'checklist_steps',
    'money_flow',
    'stair_goal',
    'brain_idea',
    'cta_card',
  ];
  const rot = idx % fallbackOrder.length;
  for (let i = 0; i < fallbackOrder.length; i++) {
    const m = fallbackOrder[(rot + i) % fallbackOrder.length];
    if (!ranked.includes(m)) ranked.push(m);
  }
  return ranked;
}

export function inferMotifFromScene(
  scene: any,
  sceneIndex: number,
  totalScenes: number,
  allScenes?: any[]
): StageMotifKind {
  if (Array.isArray(allScenes) && allScenes.length > 1) {
    const used = new Set<StageMotifKind>();
    for (let i = 0; i <= Math.min(sceneIndex, allScenes.length - 1); i++) {
      const candidates = scoreSingleSceneFor3DMotif(allScenes[i], i, totalScenes);
      const chosen = candidates.find((c) => !used.has(c)) || candidates[0];
      if (i === sceneIndex) return chosen;
      used.add(chosen);
    }
  }
  return scoreSingleSceneFor3DMotif(scene, sceneIndex, totalScenes)[0];
}

export interface CameraRig3DState {
  pos: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
  rollRad: number;
}

export interface Stage3DFrameState {
  sceneIndex: number;
  totalScenes: number;
  scene: any;
  localTimeSec: number;
  sceneDurationSec: number;
  sceneProgress: number;
  theme: StageThemeKind;
  styleId: string;
  platforms: string[];
  motif: StageMotifKind;
  cameraMode: string;
  transitionType: string;
  transitionOutProgress: number;
  camera: CameraRig3DState;
  beats: [number, number, number, number];
  beatPulse: number;
  pedestals: [number, number, number];
  showcaseScale: number;
  showcaseFloatY: number;
  showcaseTiltX: number;
  showcaseTiltY: number;
  showcaseRollZ: number;
  propSpinY: number;
  propTiltX: number;
  propRollZ: number;
  propBobY: number;
  propScale: number;
  isFollowed: boolean;
  followScale: number;
  joints: CharacterJointAngles;
  activePose?: NarratorPoseId;
  mascotPos: [number, number, number];
  mascotWingAngle: number;
  words: CalibratedWordTiming[];
  activeWordIndex: number;
  safeZone: SubtitleSafeZone;
  headline: string;
  badge: string;
  cards: [string, string, string];
  statLabel: string;
  statVal: string;
  isHook: boolean;
  isCta: boolean;
}

export function evaluate3DStageFrame(
  timelineScenes: any[],
  projectMeta: Record<string, any>,
  timeSec: number,
  ratio: StageAspectRatio = '9:16',
  fps = 60
): Stage3DFrameState {
  const safeScenes = timelineScenes && timelineScenes.length > 0 ? timelineScenes : [{ text: 'Graph Motion 3D', duration: 4 }];
  const totalScenes = safeScenes.length;

  let acc = 0;
  let sceneIndex = 0;
  let localTimeSec = 0;
  let sceneDurationSec = Math.max(0.5, Number(safeScenes[0]?.duration || 3.5));

  for (let i = 0; i < totalScenes; i++) {
    const dur = Math.max(0.5, Number(safeScenes[i]?.duration || 3.5));
    if (timeSec < acc + dur || i === totalScenes - 1) {
      sceneIndex = i;
      localTimeSec = Math.max(0, Math.min(dur, timeSec - acc));
      sceneDurationSec = dur;
      break;
    }
    acc += dur;
  }

  const scene = safeScenes[sceneIndex];
  const sceneProgress = clamp01(localTimeSec / Math.max(0.01, sceneDurationSec));
  const localFrame = localTimeSec * fps;
  const durFrames = Math.max(30, sceneDurationSec * fps);

  const isHook = sceneIndex === 0;
  const isCta = scene?.role === 'cta' || (totalScenes > 1 && sceneIndex === totalScenes - 1);

  // Determine concept-adaptive architectural studio theme from per-scene styleId/visualModule -> projectMeta.art
  const styleId = String(scene?.styleId || scene?.visualModule || projectMeta?.art || '');
  const theme = resolveStageThemeFromStyle(styleId, scene?.theme, sceneIndex);
  const platforms: string[] = Array.isArray(scene?.platforms)
    ? scene.platforms.map((p: any) => String(p))
    : [];

  const motif = inferMotifFromScene(scene, sceneIndex, totalScenes, safeScenes);
  const paceEnergik = projectMeta?.pace !== 'tenang';
  const springCfg: SpringConfig = paceEnergik
    ? { damping: 18, stiffness: 120, mass: 0.95 }
    : { damping: 22, stiffness: 95, mass: 1.05 };

  // Beat schedules
  const b1Frame = 0;
  const b2Frame = Math.round(durFrames * 0.24);
  const b3Frame = Math.round(durFrames * 0.50);
  const b4Frame = Math.round(durFrames * 0.74);

  const k1 = remotionSpring({ frame: localFrame - b1Frame, fps, config: springCfg });
  const k2 = localFrame >= b2Frame ? remotionSpring({ frame: localFrame - b2Frame, fps, config: springCfg }) : 0;
  const k3 = localFrame >= b3Frame ? remotionSpring({ frame: localFrame - b3Frame, fps, config: springCfg }) : 0;
  const k4 = localFrame >= b4Frame ? remotionSpring({ frame: localFrame - b4Frame, fps, config: springCfg }) : 0;

  // Pedestals stagger rise with natural damped spring settle
  const p0 = remotionSpring({ frame: localFrame - 2, fps, config: { damping: 18, stiffness: 118, mass: 0.95 } });
  const p1 = remotionSpring({ frame: Math.max(0, localFrame - 10), fps, config: { damping: 18, stiffness: 118, mass: 0.95 } });
  const p2 = remotionSpring({ frame: Math.max(0, localFrame - 18), fps, config: { damping: 18, stiffness: 118, mass: 0.95 } });

  // Word-by-word calibrated karaoke timings (computed BEFORE camera so emphasis zoom moments are synced to speech!)
  const words: CalibratedWordTiming[] =
    Array.isArray(scene?.wordTimings) && scene.wordTimings.length > 0
      ? scene.wordTimings.map((wt: any) => ({
          word: String(wt.text ?? wt.word ?? ''),
          at: Number(wt.at ?? wt.startSec ?? 0),
          end: Number(wt.end ?? wt.endSec ?? 0.3),
          isEmphasis: Boolean(wt.key ?? wt.isEmphasis),
        }))
      : computeCalibratedWordTimings(
          String(scene?.text || ''),
          String(scene?.emphasis || '').split(/\s+/).filter(Boolean),
          paceEnergik ? 'energik' : 'santai',
          sceneDurationSec
        );
  const activeWordIndex = getActiveWordIndex(words, localTimeSec);

  // Compute smooth 0..1 focal zoom envelope around spoken emphasis words
  let emphasisZoomMoment = 0;
  for (const w of words) {
    if (!w.isEmphasis) continue;
    const center = (w.at + w.end) * 0.5;
    const halfSpan = Math.max(0.28, (w.end - w.at) * 0.5 + 0.18);
    const dist = Math.abs(localTimeSec - center);
    if (dist < halfSpan) {
      const bell = Math.cos((dist / halfSpan) * (Math.PI * 0.5));
      emphasisZoomMoment = Math.max(emphasisZoomMoment, bell * bell);
    }
  }

  // 3D Camera Choreography synchronized to Tempo, Narrative Moment (Beats 1-4), and Spoken Emphasis
  const isWide = ratio === '16:9';
  const baseZ = isWide ? 7.5 : ratio === '1:1' || ratio === '3:4' ? 8.2 : 9.15;
  const baseY = isWide ? 2.15 : 2.38;
  const baseLookY = isWide ? 1.58 : 1.82;
  const camPatterns = ['push', 'orbit', 'pan-right', 'tilt', 'pan-left'];
  const rawCam = String(scene?.camera || '');
  const camMode = rawCam && rawCam !== 'push' ? rawCam : camPatterns[sceneIndex % camPatterns.length];
  const dir = sceneIndex % 2 === 0 ? 1 : -1;
  const tempoGain = paceEnergik ? 1.08 : 0.86;

  let camX = Math.sin(timeSec * 0.65) * 0.11;
  let camY = baseY + Math.cos(timeSec * 0.52) * 0.05;
  let camZ = baseZ;
  let lookX = 0;
  let lookY = baseLookY;
  let fov = isWide ? 40 : 43;
  let rollRad = 0;

  if (isHook) {
    // Beat 1: Hook macro close-up -> Zoom-Out reveal to full stage; Beat 2-3: Zoom-In on concept; Beat 4: Settle
    const pull = easeSnapSettle(clamp01((localTimeSec - 0.04) / 0.82));
    const hookZoomInBeat = (k2 * 0.72 + k3 * 0.38 - k4 * 0.62 + emphasisZoomMoment * 0.35) * tempoGain;
    camZ =
      remotionInterpolate(pull, [0, 1], [baseZ - 2.15, baseZ], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }) - hookZoomInBeat;
    camX =
      remotionInterpolate(pull, [0, 1], [-0.88, 0.04], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }) +
      (k2 * 0.28 - k4 * 0.2) * dir;
    camY =
      remotionInterpolate(pull, [0, 1], [baseY - 0.16, baseY], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }) +
      k2 * 0.08 -
      k3 * 0.06;
    lookX =
      remotionInterpolate(pull, [0, 1], [-0.68, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }) +
      (k2 * 0.18 - k4 * 0.14);
    lookY = baseLookY + k2 * 0.1 - k4 * 0.06;
    fov =
      remotionInterpolate(pull, [0, 1], [37.5, isWide ? 40 : 43], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }) -
      emphasisZoomMoment * 1.6;
    rollRad = (1 - pull) * -0.016 + emphasisZoomMoment * 0.012 * dir;
  } else if (isCta) {
    // CTA: progressive Zoom-In toward centerpiece & Follow badge with energetic Beat 4 lock
    const ctaPush = (k2 * 0.82 + k3 * 0.35 + k4 * 0.48 + emphasisZoomMoment * 0.3) * tempoGain;
    camZ = baseZ - ctaPush;
    camX = -0.18 + k2 * 0.24 - k4 * 0.06;
    camY = baseY + 0.1 - k3 * 0.12;
    lookX = 0.04 + k2 * 0.08;
    lookY = baseLookY + k2 * 0.08;
    fov = (isWide ? 40 : 43) - k4 * 1.8;
  } else if (camMode.includes('orbit')) {
    const orbitAngle = remotionInterpolate(sceneProgress, [0, 1], [-0.24 * dir, 0.24 * dir], {
      easing: easeInOutCubic,
    });
    const zoomArc = (k2 * 0.65 + k3 * 0.45 - k4 * 0.72 + emphasisZoomMoment * 0.38) * tempoGain;
    camX = Math.sin(orbitAngle) * (baseZ * 0.34);
    camZ = Math.cos(orbitAngle) * baseZ - zoomArc;
    lookX = dir * (0.14 * k2 - 0.08 * k4);
    lookY = baseLookY + k2 * 0.09 - k4 * 0.05;
    rollRad = Math.sin(orbitAngle) * 0.018;
  } else if (camMode.includes('pan-left') || camMode.includes('pan-right')) {
    const panDir = camMode.includes('pan-left') ? -1 : 1;
    const panShift = remotionInterpolate(sceneProgress, [0, 1], [-0.82 * panDir, 0.82 * panDir], {
      easing: easeInOutCubic,
    });
    const zoomWave = (k2 * 0.78 + k3 * 0.32 - k4 * 0.76 + emphasisZoomMoment * 0.36) * tempoGain;
    camX = panShift;
    lookX = panShift * 0.32 + emphasisZoomMoment * 0.1 * panDir;
    lookY = baseLookY + k2 * 0.1 - k4 * 0.06;
    camZ = baseZ - zoomWave;
    rollRad = panShift * 0.014;
  } else if (camMode.includes('tilt')) {
    const zoomWave = (k2 * 0.7 + k3 * 0.35 - k4 * 0.68 + emphasisZoomMoment * 0.34) * tempoGain;
    camY = remotionInterpolate(sceneProgress, [0, 1], [baseY + 0.56, baseY - 0.22], {
      easing: easeInOutCubic,
    });
    lookY = remotionInterpolate(sceneProgress, [0, 1], [baseLookY + 0.22, baseLookY - 0.08], {
      easing: easeInOutCubic,
    });
    camZ = baseZ - zoomWave;
    lookX = dir * (k2 * 0.15 - k4 * 0.1);
  } else if (camMode.includes('pull')) {
    // Explicit Zoom-Out reveal synced to tempo beats
    const pullProgress = clamp01(k1 * 0.35 + k2 * 0.35 + k4 * 0.3);
    camZ =
      remotionInterpolate(pullProgress, [0, 1], [baseZ - 1.55, baseZ + 0.25], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }) -
      emphasisZoomMoment * 0.32;
    camX = remotionInterpolate(pullProgress, [0, 1], [0.32 * dir, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    lookX = remotionInterpolate(pullProgress, [0, 1], [0.18 * dir, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    lookY = baseLookY + (1 - pullProgress) * 0.12;
  } else {
    // Dynamic Tempo Push-In (Beat 2 & Beat 3 + Emphasis Word) -> Smooth Zoom-Out Settle (Beat 4)
    const zoomInAmount = (k2 * 0.92 + k3 * 0.42 - k4 * 0.88 + emphasisZoomMoment * 0.42) * tempoGain;
    camZ = baseZ - zoomInAmount;
    camX = dir * (k2 * 0.36 + k3 * 0.12 - k4 * 0.34);
    camY = baseY + k2 * 0.08 - k3 * 0.12 + k4 * 0.04;
    lookX = dir * (k2 * 0.18 - k4 * 0.14) + emphasisZoomMoment * 0.08;
    lookY = baseLookY + k2 * 0.12 - k3 * 0.06 - k4 * 0.04;
    fov = (isWide ? 40 : 43) - emphasisZoomMoment * 1.8;
    rollRad = dir * (k2 * 0.016 - k4 * 0.016);
  }

  // 4-Beat Semantic Narrative Pose Choreography matched to spoken concept
  const [pose1, pose2, pose3, pose4] = select3DSemanticPoseBeats(
    scene,
    motif,
    sceneIndex,
    isHook,
    isCta
  );

  const b2Sec = b2Frame / fps;
  const b3Sec = b3Frame / fps;
  const b4Sec = b4Frame / fps;

  let activePrimaryPose: NarratorPoseId = pose1;
  let activeSecondaryPose: NarratorPoseId = pose2;
  let poseBlend = 0;

  if (localTimeSec < b2Sec) {
    activePrimaryPose = pose1;
    activeSecondaryPose = pose2;
    poseBlend = clamp01((localTimeSec / Math.max(0.15, b2Sec)) * 0.25);
  } else if (localTimeSec < b3Sec) {
    activePrimaryPose = pose1;
    activeSecondaryPose = pose2;
    poseBlend = k2;
  } else if (localTimeSec < b4Sec) {
    activePrimaryPose = pose2;
    activeSecondaryPose = pose3;
    poseBlend = k3;
  } else {
    activePrimaryPose = pose3;
    activeSecondaryPose = pose4;
    poseBlend = k4;
  }
  const activePose: NarratorPoseId = poseBlend >= 0.5 ? activeSecondaryPose : activePrimaryPose;

  // Anticipation squash-and-stretch impulse right at each beat transition (dips slightly then stretches up)
  const computeBeatImpulse = (beatSec: number): number => {
    const dt = localTimeSec - beatSec;
    if (dt < -0.06 || dt > 0.28) return 0;
    if (dt < 0.04) {
      // Quick anticipation crouch before spring pop
      return -Math.sin(((dt + 0.06) / 0.10) * Math.PI);
    }
    // Slight upward stretch on pop settle
    return Math.sin(((dt - 0.04) / 0.24) * Math.PI) * 0.65;
  };
  const anticipationImpulse =
    computeBeatImpulse(0.02) * 0.8 +
    computeBeatImpulse(b2Sec) +
    computeBeatImpulse(b3Sec) * 0.9 +
    computeBeatImpulse(b4Sec) * 0.75;

  // Positive 0..1 beat energy pulse for 3D objects, pedestal rings & monitor brackets
  const computePositiveBeatPulse = (beatSec: number): number => {
    const dt = localTimeSec - beatSec;
    if (dt < 0 || dt > 0.36) return 0;
    return Math.sin((dt / 0.36) * Math.PI) * (1 - dt / 0.36);
  };
  const beatPulse = clamp01(
    Math.max(
      computePositiveBeatPulse(0.02),
      computePositiveBeatPulse(b2Sec),
      computePositiveBeatPulse(b3Sec),
      computePositiveBeatPulse(b4Sec),
      emphasisZoomMoment * 0.75
    )
  );

  const hasCharacter = Boolean(projectMeta?.character) && projectMeta?.character !== 'none';
  const isSpeaking = localTimeSec > 0.06 && localTimeSec < sceneDurationSec - 0.1;
  const joints = evaluateCharacterJoints(
    activePrimaryPose,
    activeSecondaryPose,
    poseBlend,
    localTimeSec,
    timeSec,
    isSpeaking,
    words,
    anticipationImpulse
  );

  // Extract concise headline, badge, cards & metrics safely (zero prose dump)
  const rawWords = String(scene?.text || '').replace(/[^\w\s-]/g, ' ').trim().split(/\s+/).filter(Boolean);
  const emphWord = String(scene?.emphasis || '').trim().split(/\s+/)[0] || '';
  const headline = (
    scene?.on_screen_text ||
    scene?.hookText ||
    (emphWord ? emphWord.toUpperCase() : rawWords.slice(0, 3).join(' ').toUpperCase()) ||
    `SCENE 0${sceneIndex + 1}`
  )
    .split('/')[0]
    .trim()
    .slice(0, 24);
  const badge = isHook ? 'HOOK' : isCta ? 'FOLLOW & SAVE' : `POIN 0${sceneIndex + 1}`;
  const cards: [string, string, string] = [
    (rawWords[0] || 'FOKUS').slice(0, 11).toUpperCase(),
    (emphWord || rawWords[Math.min(3, Math.max(0, rawWords.length - 1))] || 'AKSI').slice(0, 11).toUpperCase(),
    (rawWords[Math.max(0, rawWords.length - 1)] || 'HASIL').slice(0, 11).toUpperCase(),
  ];
  const statLabel = isCta ? 'STATUS' : isHook ? 'FOKUS' : 'PROGRESS';
  const statVal = isCta ? 'MULAI' : `+${Math.round(45 + sceneIndex * 12)}%`;

  // Transition envelope across final 0.38s (not on final scene)
  const transWindow = Math.min(0.42, sceneDurationSec * 0.16);
  const transitionOutProgress =
    sceneIndex < totalScenes - 1 && localTimeSec > sceneDurationSec - transWindow
      ? clamp01((localTimeSec - (sceneDurationSec - transWindow)) / transWindow)
      : 0;

  // Classy ¾ editorial presentation turn + spring beat articulations (never stiff constant 360 spin)
  const beatTurn = (k2 * 0.28 - k3 * 0.44 + k4 * 0.22) * dir;
  const propSpinY = -0.22 + Math.sin(timeSec * 1.65 + sceneIndex * 0.5) * 0.32 + beatTurn;
  const propTiltX = 0.08 + Math.cos(timeSec * 1.9 + sceneIndex) * 0.065 - beatPulse * 0.14;
  const propRollZ = Math.sin(timeSec * 1.45 + sceneIndex) * 0.055 + anticipationImpulse * 0.08 * dir;
  const propBobY = Math.sin(timeSec * 2.5 + sceneIndex) * 0.075 + beatPulse * 0.085;
  const propScale = Math.max(0.15, Math.min(1.18, 0.35 + k1 * 0.65 + beatPulse * 0.08));

  // Living architectural pedestal pistons with spring overshoot + harmonic counter-bobbing
  const ped0 = Math.max(
    0.15,
    Math.min(1.14, 0.38 + p0 * 0.62 + Math.sin(timeSec * 2.1) * 0.032 + k2 * 0.04)
  );
  const ped1 = Math.max(
    0.15,
    Math.min(1.16, 0.28 + p1 * 0.72 + Math.sin(timeSec * 2.4 + 1.1) * 0.038 + beatPulse * 0.055)
  );
  const ped2 = Math.max(
    0.15,
    Math.min(1.14, 0.2 + p2 * 0.8 + Math.sin(timeSec * 2.1 + 2.2) * 0.032 + k3 * 0.045)
  );

  // Showcase slab multi-axis spring hover & beat micro-kick
  const showcaseScale = Math.max(0.15, Math.min(1.12, 0.48 + k1 * 0.52 + beatPulse * 0.038));
  const showcaseFloatY = Math.sin(timeSec * 2.15) * 0.085 + beatPulse * 0.045;
  const showcaseTiltX = 0.045 + Math.cos(timeSec * 1.55) * 0.028 - beatPulse * 0.05;
  const showcaseTiltY = -0.18 + Math.sin(timeSec * 0.95) * 0.065 + (k2 * 0.05 - k3 * 0.07 + k4 * 0.03) * dir;
  const showcaseRollZ = Math.sin(timeSec * 1.25) * 0.018 + anticipationImpulse * 0.025 * dir;

  return {
    sceneIndex,
    totalScenes,
    scene,
    localTimeSec,
    sceneDurationSec,
    sceneProgress,
    theme,
    styleId,
    platforms,
    motif,
    cameraMode: camMode,
    transitionType: String(scene?.transition || projectMeta?.transition || 'otomatis'),
    transitionOutProgress,
    camera: {
      pos: [camX, camY, camZ],
      lookAt: [lookX, lookY, 0],
      fov,
      rollRad,
    },
    beats: [k1, k2, k3, k4],
    beatPulse,
    pedestals: [ped0, ped1, ped2],
    showcaseScale,
    showcaseFloatY,
    showcaseTiltX,
    showcaseTiltY,
    showcaseRollZ,
    propSpinY,
    propTiltX,
    propRollZ,
    propBobY,
    propScale,
    isFollowed: isCta && localTimeSec >= sceneDurationSec * 0.7,
    followScale: isCta && localTimeSec >= sceneDurationSec * 0.7 ? 1 + clamp01(k4) * 0.08 : 1,
    joints,
    activePose,
    mascotPos: [
      (isWide ? 2.55 : isHook ? 0.58 : 0.78) + Math.sin(timeSec * 1.35) * 0.09,
      (isWide ? 2.4 : 3.05) + Math.sin(timeSec * 2.45) * 0.13 + beatPulse * 0.06,
      0.38 + Math.cos(timeSec * 1.55) * 0.11,
    ],
    mascotWingAngle: Math.sin(timeSec * 11.5) * 0.36 + beatPulse * 0.18,
    words,
    activeWordIndex,
    safeZone: computeSubtitleSafeZone(ratio, hasCharacter, theme),
    headline,
    badge,
    cards,
    statLabel,
    statVal,
    isHook,
    isCta,
  };
}

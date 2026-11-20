export type CreatorEyeMode = 'normal' | 'happy_arc' | 'focus' | 'wide_shock' | 'tired_half';
export type CreatorHandGesture = 'open' | 'point' | 'fist' | 'wave' | 'thumbs';

export interface ArmJointAngles {
  /** Pitch forward/up (radians, positive = forward/up) */
  pitch: number;
  /** Abduction out to side (radians, positive = away from torso) */
  abduct: number;
  /** Twist around upper-arm axis (radians) */
  twist: number;
  /** Elbow bend (radians, positive = bends forearm forward/up) */
  elbow: number;
  /** Wrist pitch/tilt (radians) */
  wrist: number;
  gesture: CreatorHandGesture;
}

export interface LegJointAngles {
  hipPitch: number;
  hipOut: number;
  knee: number;
}

export interface Creator3DPoseAngles {
  headYaw: number;
  headPitch: number;
  headRoll: number;
  torsoLean: number;
  torsoTwist: number;
  torsoSide: number;
  hipShiftX: number;
  hipDropY: number;
  leftArm: ArmJointAngles;
  rightArm: ArmJointAngles;
  leftLeg: LegJointAngles;
  rightLeg: LegJointAngles;
  eyeMode: CreatorEyeMode;
}

export type VowelMouthShape = 'rest' | 'A' | 'I' | 'U' | 'E' | 'O' | 'M';

export interface LipSyncWordTiming {
  text?: string;
  word?: string;
  at?: number;
  start?: number;
  end: number;
  key?: boolean;
  emphasis?: boolean;
}

export interface EvaluatedLipSync {
  mouthOpen: number;
  mouthWide: number;
  vowelShape: VowelMouthShape;
  stressAccent: number;
  speakingNow: boolean;
  wordTone?: 'neutral' | 'worry' | 'shock' | 'excited' | 'question';
}

export interface EvaluatedCreator3DKinematics extends Creator3DPoseAngles {
  activePose: string;
  prevPose: string;
  blendAlpha: number;
  blinkAmount: number;
  browLift: number;
  gazeX: number;
  gazeY: number;
  mouthOpen: number;
  mouthWide: number;
  vowelShape: VowelMouthShape;
  stressAccent: number;
  mouthSmile: number;
  breathOffset: number;
  hairBounce: number;
  tailWag: number;
  tailLift: number;
  bodySquash: number;
  browTilt: number;
}

export type PoseTimelineEntry = [string, number];
export type PoseInput = string | PoseTimelineEntry[];

const clamp01 = (v: number) => (v <= 0 ? 0 : v >= 1 ? 1 : v);

function extractWordVowels(rawWord: string): VowelMouthShape[] {
  const clean = rawWord.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!clean) return ['rest'];
  const seq: VowelMouthShape[] = [];
  const chunks = clean.match(/[aiueo]+|[^aiueo]+/g) || [clean];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (/^[mbp]/.test(chunk) && (i === 0 || i === chunks.length - 1)) {
      seq.push('M');
    } else if (chunk.includes('a')) {
      seq.push('A');
    } else if (chunk.includes('o')) {
      seq.push('O');
    } else if (chunk.includes('u')) {
      seq.push('U');
    } else if (chunk.includes('e')) {
      seq.push('E');
    } else if (chunk.includes('i')) {
      seq.push('I');
    } else if (/[mbp]/.test(chunk) && seq.length > 0 && seq[seq.length - 1] !== 'M') {
      seq.push('M');
    }
  }
  if (seq.length === 0) seq.push('E');
  return seq;
}

function detectWordTone(rawWord: string, allWords?: any[] | null): 'neutral' | 'worry' | 'shock' | 'excited' | 'question' {
  const w = (rawWord || '').toLowerCase();
  if (/\?$|^(apa|kenapa|mengapa|bagaimana|kok|pernah|tau|tahu|benarkah)/.test(w)) return 'question';
  if (/pusing|stres|bingung|masalah|gagal|rugi|bahaya|awas|salah|boncos|turun|anjlok|macet|capek|lelah|burnout|sulit|susah|ancaman|risiko/.test(w)) {
    return 'worry';
  }
  if (/kaget|ternyata|rahasia|mengejutkan|shock|darurat|90%|99%|10x|juta|miliar|triliun|fakta|bocor|parah|gila|mustahil|!$/.test(w)) {
    return 'shock';
  }
  if (/sukses|untung|cuan|berhasil|naik|menang|hebat|solusi|mudah|cepat|otomatis|pintar|strategi|rahasianya|terbukti|aman|efektif/.test(w)) {
    return 'excited';
  }
  if (Array.isArray(allWords) && allWords.length > 0) {
    const sentence = allWords.map((x) => x?.text || x?.word || '').join(' ').toLowerCase();
    if (/pusing|stres|masalah|gagal|rugi|bahaya|salah|boncos|macet|burnout/.test(sentence)) return 'worry';
    if (/\?/.test(sentence)) return 'question';
    if (/kaget|ternyata|mengejutkan|fakta|rahasia/.test(sentence)) return 'shock';
    if (/sukses|solusi|berhasil|untung|strategi|cara/.test(sentence)) return 'excited';
  }
  return 'neutral';
}

/**
 * Evaluates deterministic script-tempo-synced lip articulation at time `tSec`
 * using word timing windows (plus punctuation pauses and pace cadence).
 */
export function evaluateLipSyncAtTime(
  tSec: number,
  words?: Array<LipSyncWordTiming | { word?: string; start?: number; end?: number; emphasis?: boolean }> | null,
  options?: {
    pace?: string;
    fallbackSpeaking?: boolean;
  }
): EvaluatedLipSync {
  const t = Number.isFinite(tSec) ? Math.max(0, tSec) : 0;
  const isCalm = options?.pace === 'santai' || options?.pace === 'tenang';

  if (Array.isArray(words) && words.length > 0) {
    let activeWord: { text: string; at: number; end: number; key?: boolean } | null = null;
    for (let i = 0; i < words.length; i++) {
      const raw: any = words[i];
      if (!raw) continue;
      const wAt = Number.isFinite(raw.at) ? raw.at : Number(raw.start) || 0;
      const wEnd = Number.isFinite(raw.end) ? raw.end : wAt + 0.35;
      const wText = String(raw.text ?? raw.word ?? '');
      const wKey = Boolean(raw.key ?? raw.emphasis);
      if (t >= wAt - 0.015 && t <= wEnd + 0.01) {
        activeWord = { text: wText, at: wAt, end: wEnd, key: wKey };
        break;
      }
    }

    if (!activeWord) {
      return {
        mouthOpen: 0,
        mouthWide: 1.0,
        vowelShape: 'rest',
        stressAccent: 0,
        speakingNow: false,
        wordTone: detectWordTone('', words),
      };
    }

    const rawText = String(activeWord.text || '');
    const wordTone = detectWordTone(rawText, words);
    const hasMajorPause = /[.!?…]$/.test(rawText.trim());
    const hasMinorPause = /[,;:—–\-]$/.test(rawText.trim());
    const rawSpan = Math.max(0.08, activeWord.end - activeWord.at);
    // Reserve clean mouth-closure gap before punctuation pauses or trailing silence
    const pauseTrim = hasMajorPause
      ? Math.min(rawSpan * 0.34, 0.13)
      : hasMinorPause
      ? Math.min(rawSpan * 0.22, 0.075)
      : Math.min(rawSpan * 0.1, 0.035);
    const activeEnd = Math.max(activeWord.at + 0.06, activeWord.end - pauseTrim);

    if (t < activeWord.at || t > activeEnd) {
      return {
        mouthOpen: 0,
        mouthWide: 1.0,
        vowelShape: 'rest',
        stressAccent: 0,
        speakingNow: false,
        wordTone,
      };
    }

    const localSpan = Math.max(0.06, activeEnd - activeWord.at);
    const u = clamp01((t - activeWord.at) / localSpan);
    // Snappy attack + natural decay across word
    const env = Math.pow(Math.sin(u * Math.PI), 0.75);
    const vowels = extractWordVowels(rawText);
    const syllableCount = Math.max(1, vowels.length);
    const sylPos = u * syllableCount;
    const sylIdx = Math.min(syllableCount - 1, Math.floor(sylPos));
    const sylLocal = sylPos - Math.floor(sylPos);
    // Distinct syllable dip between vowels so multi-syllable words articulate clearly
    const sylPulse = Math.pow(Math.sin(sylLocal * Math.PI), 0.82);
    const vowelShape = sylPulse < 0.16 && syllableCount > 1 ? 'M' : vowels[sylIdx] || 'A';

    const isNumberOrBang = /\d|[!?]/.test(rawText);
    const energyMult = (activeWord.key || isNumberOrBang ? 1.24 : 1.04) * (isCalm ? 0.86 : 1.0);
    let mouthOpen = clamp01(env * (0.22 + 0.78 * sylPulse) * energyMult * 1.18);
    let mouthWide = 1.0;

    if (vowelShape === 'M') {
      mouthOpen = mouthOpen * 0.1;
      mouthWide = 0.9;
    } else if (vowelShape === 'O') {
      mouthWide = 0.64;
      mouthOpen = Math.min(1, mouthOpen * 1.02);
    } else if (vowelShape === 'U') {
      mouthWide = 0.56;
      mouthOpen = Math.min(1, mouthOpen * 0.76);
    } else if (vowelShape === 'E') {
      mouthWide = 1.24;
      mouthOpen = Math.min(1, mouthOpen * 0.82);
    } else if (vowelShape === 'I') {
      mouthWide = 1.3;
      mouthOpen = Math.min(1, mouthOpen * 0.62);
    } else if (vowelShape === 'A') {
      mouthWide = 1.08;
      mouthOpen = Math.min(1, mouthOpen * 1.12);
    }

    const stressAccent = (activeWord.key || isNumberOrBang || wordTone === 'shock' || wordTone === 'excited')
      ? Math.sin(u * Math.PI) * (isNumberOrBang ? 1.2 : 1.0)
      : Math.sin(u * Math.PI) * 0.35;
    const clampedMouthOpen = Math.min(0.74, mouthOpen * 0.86);
    return {
      mouthOpen: clampedMouthOpen,
      mouthWide,
      vowelShape,
      stressAccent,
      speakingNow: clampedMouthOpen > 0.07,
      wordTone,
    };
  }

  // Fallback rhythmic syllable curve only when explicit speaking mode has no word timings
  if (!options?.fallbackSpeaking) {
    return {
      mouthOpen: 0,
      mouthWide: 1.0,
      vowelShape: 'rest',
      stressAccent: 0,
      speakingNow: false,
      wordTone: 'neutral',
    };
  }

  const speed = isCalm ? 0.82 : 1.08;
  const syll = Math.max(
    0,
    Math.sin(t * 11.4 * speed) * 0.6 + Math.sin(t * 5.8 * speed + 0.7) * 0.4
  );
  const phraseGate = Math.sin(t * 2.8 * speed) > -0.55 ? 1 : 0.12;
  const mouthOpen = Math.min(0.74, clamp01(syll * phraseGate * 0.86));
  const vowelCycle = Math.floor((t * 4.6 * speed) % 6);
  const vowelShape: VowelMouthShape =
    mouthOpen <= 0.1
      ? 'M'
      : vowelCycle === 0
      ? 'A'
      : vowelCycle === 1
      ? 'O'
      : vowelCycle === 2
      ? 'E'
      : vowelCycle === 3
      ? 'I'
      : vowelCycle === 4
      ? 'U'
      : 'A';
  const mouthWide =
    vowelShape === 'O' ? 0.64 : vowelShape === 'U' ? 0.56 : vowelShape === 'E' || vowelShape === 'I' ? 1.24 : 1.06;

  return {
    mouthOpen,
    mouthWide,
    vowelShape,
    stressAccent: mouthOpen * 0.45,
    speakingNow: mouthOpen > 0.08,
    wordTone: 'neutral',
  };
}

/** Quintic smootherstep for buttery acceleration & deceleration */
export function quinticEase(t: number): number {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/** Smooth MotionMaxxing spring-settle curve (punchy fast launch + organic damped settle overshoot) */
export function springSettleEase(t: number): number {
  const x = clamp01(t);
  if (x === 0 || x === 1) return x;
  const q = quinticEase(x);
  const overshoot = Math.sin(x * Math.PI * 1.45) * Math.exp(-x * 4.1) * 0.145;
  return q + overshoot;
}

/** Brief Disney-style anticipation dip (0 -> -0.25 -> 0) before launching into a new gesture */
export function anticipationCurve(elapsed: number, blendSec: number): number {
  if (blendSec <= 0) return 0;
  const u = elapsed / blendSec;
  if (u <= 0 || u >= 0.28) return 0;
  return -Math.sin((u / 0.28) * Math.PI);
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

function lerpArm(
  a: ArmJointAngles,
  b: ArmJointAngles,
  kElbow: number,
  kShoulder: number,
  kWrist: number
): ArmJointAngles {
  return {
    pitch: lerp(a.pitch, b.pitch, kShoulder),
    abduct: lerp(a.abduct, b.abduct, kShoulder),
    twist: lerp(a.twist, b.twist, kShoulder),
    elbow: lerp(a.elbow, b.elbow, kElbow),
    wrist: lerp(a.wrist, b.wrist, kWrist),
    gesture: kWrist > 0.45 ? b.gesture : a.gesture,
  };
}

function lerpLeg(a: LegJointAngles, b: LegJointAngles, k: number): LegJointAngles {
  return {
    hipPitch: lerp(a.hipPitch, b.hipPitch, k),
    hipOut: lerp(a.hipOut, b.hipOut, k),
    knee: lerp(a.knee, b.knee, k),
  };
}

export function normalizeCreatorPoseName(raw: string): string {
  const p = String(raw || 'stand').toLowerCase().trim();
  const aliases: Record<string, string> = {
    idle: 'stand',
    talk: 'present',
    explain: 'present',
    speaking: 'present',
    explain_both: 'present',
    point_right: 'point',
    point_up: 'idea',
    think_chin: 'think',
    thinking: 'think',
    wave_cta: 'wave',
    happy: 'cheer',
    celebrate: 'cheer',
    celebrate_headbob: 'cheer',
    nod_listen: 'stand',
    nod: 'stand',
    thumbs_up: 'thumbs',
    clap: 'cheer',
    laugh: 'cheer',
    stretch: 'cheer',
    facepalm: 'headache',
    stressed: 'headache',
    shock: 'scared',
    surprised: 'scared',
    sad: 'sigh',
    frustrated: 'angry',
    type: 'sittype',
    laptop: 'sittype',
    scroll: 'phone',
    time: 'watch',
    money: 'cash',
    count: 'cash',
    fist: 'yes',
    power: 'yes',
  };
  return aliases[p] || p;
}

function getBasePoseAngles(poseRaw: string, t: number): Creator3DPoseAngles {
  const pose = normalizeCreatorPoseName(poseRaw);
  // Multi-harmonic organic weight shift & breathing cadence (never robotic single sine)
  const sway = Math.sin(t * 0.95) * 0.56 + Math.sin(t * 1.65 + 0.9) * 0.32 + Math.sin(t * 0.55) * 0.12;
  const microBreath = Math.sin(t * 1.75);
  const talkPulse = Math.sin(t * 2.2) * 0.65 + Math.sin(t * 1.45 + 0.7) * 0.35;
  const talkPulse2 = Math.sin(t * 1.6 + 1.1) * 0.7 + Math.cos(t * 1.05) * 0.3;
  const weightKneeL = 0.08 + Math.max(0, sway) * 0.09;
  const weightKneeR = 0.08 + Math.max(0, -sway) * 0.09;

  const base: Creator3DPoseAngles = {
    headYaw: 0.04 + sway * 0.04,
    headPitch: 0.01 + microBreath * 0.018 + Math.sin(t * 1.25) * 0.012,
    headRoll: sway * 0.035,
    torsoLean: 0.025 + microBreath * 0.014,
    torsoTwist: 0.1 + sway * 0.048,
    torsoSide: sway * 0.028,
    hipShiftX: sway * 0.028,
    hipDropY: Math.abs(sway) * 0.01,
    leftArm: {
      pitch: 0.14 + sway * 0.045,
      abduct: 0.19 + microBreath * 0.014,
      twist: 0.08,
      elbow: 0.38 + Math.sin(t * 1.35 + 0.4) * 0.05,
      wrist: 0.04 + Math.sin(t * 1.8) * 0.035,
      gesture: 'open',
    },
    rightArm: {
      pitch: 0.16 - sway * 0.045,
      abduct: 0.19 + microBreath * 0.014,
      twist: -0.08,
      elbow: 0.4 + Math.cos(t * 1.35) * 0.05,
      wrist: -0.04 - Math.sin(t * 1.75) * 0.035,
      gesture: 'open',
    },
    leftLeg: { hipPitch: -0.04 - sway * 0.025, hipOut: 0.075, knee: weightKneeL },
    rightLeg: { hipPitch: 0.04 + sway * 0.025, hipOut: 0.085, knee: weightKneeR },
    eyeMode: 'normal',
  };

  switch (pose) {
    case 'present':
      return {
        ...base,
        headYaw: 0.05 + talkPulse2 * 0.048,
        headPitch: -0.02 + Math.sin(t * 2.1) * 0.032,
        headRoll: talkPulse2 * 0.038,
        torsoLean: 0.05 + microBreath * 0.014,
        torsoTwist: 0.12 + talkPulse2 * 0.05,
        leftArm: {
          pitch: 0.34 + talkPulse * 0.08,
          abduct: 0.24 + Math.sin(t * 1.65) * 0.03,
          twist: 0.18,
          elbow: 0.72 + Math.sin(t * 2.2 - 0.35) * 0.08,
          wrist: 0.08 + Math.sin(t * 2.2 - 0.7) * 0.04,
          gesture: 'open',
        },
        rightArm: {
          pitch: 0.44 - talkPulse * 0.07,
          abduct: 0.28 + Math.cos(t * 1.6) * 0.035,
          twist: -0.22,
          elbow: 0.68 - Math.sin(t * 2.2 - 0.35) * 0.08,
          wrist: -0.08 - Math.sin(t * 2.2 - 0.7) * 0.04,
          gesture: 'open',
        },
      };

    case 'point':
      return {
        ...base,
        headYaw: 0.1 + Math.sin(t * 2.1) * 0.04,
        headPitch: -0.035 + Math.sin(t * 2.8) * 0.035,
        headRoll: -0.04,
        torsoLean: 0.06,
        torsoTwist: 0.16,
        leftArm: {
          pitch: 0.2,
          abduct: 0.2,
          twist: 0.1,
          elbow: 0.46 + microBreath * 0.04,
          wrist: 0.04,
          gesture: 'open',
        },
        rightArm: {
          pitch: 0.64 + Math.sin(t * 3.1) * 0.05,
          abduct: 0.36,
          twist: -0.18,
          elbow: 0.56 + Math.sin(t * 3.1 - 0.45) * 0.07,
          wrist: 0.04 + Math.sin(t * 3.1 - 0.8) * 0.04,
          gesture: 'point',
        },
      };

    case 'idea':
      return {
        ...base,
        headYaw: 0.04 + Math.sin(t * 1.9) * 0.045,
        headPitch: -0.07 + Math.sin(t * 2.6) * 0.035,
        headRoll: 0.055,
        torsoLean: 0.04,
        torsoTwist: 0.11,
        leftArm: {
          pitch: 0.2,
          abduct: 0.2,
          twist: 0.08,
          elbow: 0.44,
          wrist: 0,
          gesture: 'open',
        },
        rightArm: {
          pitch: 0.68 + Math.sin(t * 2.7) * 0.05,
          abduct: 0.34,
          twist: -0.18,
          elbow: 0.82 + Math.sin(t * 2.7 - 0.4) * 0.06,
          wrist: 0.06,
          gesture: 'point',
        },
        eyeMode: 'happy_arc',
      };

    case 'think':
      return {
        ...base,
        headYaw: -0.07 + Math.sin(t * 1.25) * 0.045,
        headPitch: 0.075 + Math.sin(t * 1.6) * 0.025,
        headRoll: 0.08,
        torsoLean: 0.05,
        torsoTwist: -0.08,
        leftArm: {
          pitch: 0.28,
          abduct: 0.2,
          twist: 0.26,
          elbow: 0.76,
          wrist: 0.06,
          gesture: 'open',
        },
        rightArm: {
          pitch: 0.58,
          abduct: 0.22,
          twist: -0.34,
          elbow: 0.94 + Math.sin(t * 1.8) * 0.04,
          wrist: 0.1,
          gesture: 'fist',
        },
        eyeMode: 'focus',
      };

    case 'headache':
      // Stressed / overwhelmed problem pose: right hand raised near temple, worried posture
      return {
        ...base,
        headYaw: -0.06 + Math.sin(t * 2.4) * 0.05,
        headPitch: 0.15 + Math.sin(t * 3.2) * 0.04,
        headRoll: -0.11 + Math.sin(t * 4.5) * 0.03,
        torsoLean: 0.12,
        torsoTwist: -0.06,
        hipDropY: 0.025,
        leftArm: {
          pitch: 0.3,
          abduct: 0.22,
          twist: 0.24,
          elbow: 0.74,
          wrist: 0.08,
          gesture: 'open',
        },
        rightArm: {
          pitch: 0.68 + Math.sin(t * 3.2) * 0.04,
          abduct: 0.3,
          twist: -0.36,
          elbow: 0.96,
          wrist: 0.12,
          gesture: 'open',
        },
        eyeMode: 'tired_half',
      };

    case 'scared':
      // Shocked / hook / warning pose: leaning back slightly, both hands raised with bent elbows, wide shock eyes
      return {
        ...base,
        headYaw: Math.sin(t * 5.2) * 0.045,
        headPitch: -0.08,
        headRoll: Math.sin(t * 3.8) * 0.05,
        torsoLean: -0.07,
        torsoTwist: 0.04,
        hipDropY: Math.abs(Math.sin(t * 5.2)) * 0.02,
        leftArm: {
          pitch: 0.62 + Math.sin(t * 6.0) * 0.04,
          abduct: 0.32,
          twist: 0.26,
          elbow: 0.88,
          wrist: -0.08,
          gesture: 'open',
        },
        rightArm: {
          pitch: 0.62 - Math.sin(t * 6.0) * 0.04,
          abduct: 0.32,
          twist: -0.26,
          elbow: 0.88,
          wrist: 0.08,
          gesture: 'open',
        },
        eyeMode: 'wide_shock',
      };

    case 'sigh':
    case 'tired': {
      // Heavy exhale / slumped shoulders / exhausted burnout posture
      const sighCycle = Math.sin(t * 1.9);
      return {
        ...base,
        headYaw: -0.04,
        headPitch: 0.2 + sighCycle * 0.04,
        headRoll: 0.09,
        torsoLean: 0.16 - sighCycle * 0.03,
        torsoTwist: 0.03,
        hipDropY: 0.035 - sighCycle * 0.012,
        leftArm: {
          pitch: 0.08,
          abduct: 0.16,
          twist: 0.04,
          elbow: 0.26,
          wrist: 0.05,
          gesture: 'open',
        },
        rightArm: {
          pitch: 0.1,
          abduct: 0.16,
          twist: -0.04,
          elbow: 0.28,
          wrist: -0.05,
          gesture: 'open',
        },
        eyeMode: 'tired_half',
      };
    }

    case 'angry': {
      // Frustrated / tense forward lean with clenched fists and bent elbows
      const tensePulse = Math.sin(t * 6.5) * 0.04;
      return {
        ...base,
        headYaw: 0.03,
        headPitch: 0.11,
        headRoll: tensePulse,
        torsoLean: 0.12,
        torsoTwist: 0.08,
        leftArm: {
          pitch: 0.42 + tensePulse,
          abduct: 0.28,
          twist: 0.22,
          elbow: 0.84,
          wrist: 0.08,
          gesture: 'fist',
        },
        rightArm: {
          pitch: 0.42 - tensePulse,
          abduct: 0.28,
          twist: -0.22,
          elbow: 0.84,
          wrist: -0.08,
          gesture: 'fist',
        },
        eyeMode: 'focus',
      };
    }

    case 'sittype': {
      // Natural alternating typing hands for tech/AI/coding concepts
      const typeL = Math.sin(t * 6.8) * 0.06;
      const typeR = Math.cos(t * 6.8) * 0.06;
      return {
        ...base,
        headYaw: Math.sin(t * 2.2) * 0.05,
        headPitch: 0.11,
        torsoLean: 0.08,
        leftArm: {
          pitch: 0.44 + typeL * 0.3,
          abduct: 0.2,
          twist: 0.2,
          elbow: 0.82 + typeL,
          wrist: -0.1 + typeL * 0.35,
          gesture: 'open',
        },
        rightArm: {
          pitch: 0.44 + typeR * 0.3,
          abduct: 0.2,
          twist: -0.2,
          elbow: 0.82 + typeR,
          wrist: 0.1 - typeR * 0.35,
          gesture: 'open',
        },
        eyeMode: 'focus',
      };
    }

    case 'phone': {
      // Holding phone in right hand, swiping/presenting with left hand
      return {
        ...base,
        headYaw: -0.08,
        headPitch: 0.14,
        headRoll: -0.04,
        torsoLean: 0.07,
        leftArm: {
          pitch: 0.44 + Math.sin(t * 3.8) * 0.08,
          abduct: 0.24,
          twist: 0.22,
          elbow: 0.78 + Math.sin(t * 3.8 - 0.4) * 0.08,
          wrist: 0.08,
          gesture: 'point',
        },
        rightArm: {
          pitch: 0.56,
          abduct: 0.22,
          twist: -0.28,
          elbow: 0.88 + Math.sin(t * 2.1) * 0.04,
          wrist: 0.08,
          gesture: 'fist',
        },
        eyeMode: 'normal',
      };
    }

    case 'watch': {
      // Checking wrist watch on left arm while pointing with right arm
      return {
        ...base,
        headYaw: 0.14,
        headPitch: 0.12,
        torsoLean: 0.06,
        leftArm: {
          pitch: 0.54,
          abduct: 0.28,
          twist: 0.36,
          elbow: 0.92,
          wrist: 0.12,
          gesture: 'fist',
        },
        rightArm: {
          pitch: 0.52 + talkPulse * 0.08,
          abduct: 0.3,
          twist: -0.22,
          elbow: 0.68,
          wrist: 0.05,
          gesture: 'point',
        },
        eyeMode: 'focus',
      };
    }

    case 'cash': {
      // Enthusiastic finance/money counting gesture
      const countOsc = Math.sin(t * 7.2) * 0.08;
      return {
        ...base,
        headYaw: 0.05 + Math.sin(t * 2.5) * 0.04,
        headPitch: -0.02,
        torsoLean: 0.05,
        leftArm: {
          pitch: 0.46,
          abduct: 0.24,
          twist: 0.26,
          elbow: 0.82,
          wrist: 0.08,
          gesture: 'open',
        },
        rightArm: {
          pitch: 0.54 + countOsc,
          abduct: 0.26,
          twist: -0.26,
          elbow: 0.86 - countOsc,
          wrist: -0.1 + countOsc,
          gesture: 'open',
        },
        eyeMode: 'happy_arc',
      };
    }

    case 'yes': {
      // Confident fist-pump victory gesture with clear elbow hinge
      const pump = Math.abs(Math.sin(t * 4.4));
      return {
        ...base,
        headYaw: 0.06,
        headPitch: -0.05 + pump * 0.04,
        torsoLean: -0.02,
        hipDropY: pump * 0.028,
        leftArm: {
          pitch: 0.28,
          abduct: 0.22,
          twist: 0.18,
          elbow: 0.68,
          wrist: 0.06,
          gesture: 'fist',
        },
        rightArm: {
          pitch: 0.68 + pump * 0.16,
          abduct: 0.34,
          twist: -0.2,
          elbow: 0.88 - pump * 0.12,
          wrist: 0.08,
          gesture: 'fist',
        },
        eyeMode: 'happy_arc',
      };
    }

    case 'thumbs':
      return {
        ...base,
        headYaw: 0.04 + Math.sin(t * 2.2) * 0.045,
        headPitch: -0.045 + Math.sin(t * 3.4) * 0.035,
        headRoll: -0.05,
        torsoLean: 0.04,
        torsoTwist: 0.14,
        hipDropY: (0.5 - 0.5 * Math.cos(t * 3.2)) * 0.03,
        leftArm: {
          pitch: 0.22,
          abduct: 0.2,
          twist: 0.1,
          elbow: 0.46,
          wrist: 0,
          gesture: 'open',
        },
        rightArm: {
          pitch: 0.64 + Math.sin(t * 3.2) * 0.05,
          abduct: 0.3,
          twist: -0.24,
          elbow: 0.78 + Math.sin(t * 3.2 - 0.35) * 0.05,
          wrist: 0.08,
          gesture: 'thumbs',
        },
        eyeMode: 'happy_arc',
      };

    case 'wave':
      return {
        ...base,
        headYaw: 0.03 + Math.sin(t * 2.4) * 0.045,
        headPitch: -0.045,
        headRoll: 0.065 + Math.sin(t * 2.8) * 0.04,
        torsoLean: 0.03,
        torsoTwist: 0.09,
        leftArm: {
          pitch: 0.18,
          abduct: 0.2,
          twist: 0.08,
          elbow: 0.4,
          wrist: 0,
          gesture: 'open',
        },
        rightArm: {
          pitch: 0.68,
          abduct: 0.42 + Math.sin(t * 3.4) * 0.09,
          twist: -0.14,
          elbow: 0.84 + Math.sin(t * 3.4 - 0.55) * 0.14,
          wrist: Math.sin(t * 3.4 - 1.0) * 0.16,
          gesture: 'wave',
        },
        eyeMode: 'happy_arc',
      };

    case 'cheer':
      return {
        ...base,
        headYaw: Math.sin(t * 2.2) * 0.07,
        headPitch: -0.07 + Math.sin(t * 3.4) * 0.04,
        headRoll: Math.sin(t * 2.1) * 0.055,
        torsoLean: -0.03,
        hipDropY: (0.5 - 0.5 * Math.cos(t * 3.4)) * 0.04,
        leftLeg: { hipPitch: -0.08, hipOut: 0.1, knee: 0.16 + Math.sin(t * 3.4) * 0.05 },
        rightLeg: { hipPitch: 0.08, hipOut: 0.1, knee: 0.16 + Math.sin(t * 3.4) * 0.05 },
        leftArm: {
          pitch: 0.78 + Math.sin(t * 3.4) * 0.09,
          abduct: 0.42 + Math.cos(t * 3.4) * 0.06,
          twist: 0.14,
          elbow: 0.78 + Math.sin(t * 3.4 - 0.45) * 0.1,
          wrist: 0.08,
          gesture: 'open',
        },
        rightArm: {
          pitch: 0.78 - Math.sin(t * 3.4) * 0.09,
          abduct: 0.42 - Math.cos(t * 3.4) * 0.06,
          twist: -0.14,
          elbow: 0.78 - Math.sin(t * 3.4 - 0.45) * 0.1,
          wrist: -0.08,
          gesture: 'open',
        },
        eyeMode: 'happy_arc',
      };

    case 'walk':
    case 'run': {
      const freq = pose === 'run' ? 5.8 : 3.6;
      const stride = Math.sin(t * freq);
      const kneeL = Math.max(0.08, -Math.cos(t * freq) * 0.82);
      const kneeR = Math.max(0.08, Math.cos(t * freq) * 0.82);
      const amp = pose === 'run' ? 0.52 : 0.36;
      return {
        ...base,
        headYaw: 0.06 + Math.sin(t * freq * 0.5) * 0.03,
        headPitch: 0.04 + Math.abs(stride) * 0.035,
        torsoLean: pose === 'run' ? 0.16 : 0.075,
        torsoTwist: stride * 0.14,
        hipDropY: Math.abs(stride) * 0.04,
        leftArm: {
          pitch: stride * amp * 1.02,
          abduct: 0.2,
          twist: 0.08,
          elbow: 0.52 + Math.max(0, stride) * 0.28,
          wrist: Math.sin(t * freq - 0.5) * 0.06,
          gesture: 'open',
        },
        rightArm: {
          pitch: -stride * amp * 1.02,
          abduct: 0.2,
          twist: -0.08,
          elbow: 0.52 + Math.max(0, -stride) * 0.28,
          wrist: -Math.sin(t * freq - 0.5) * 0.06,
          gesture: 'open',
        },
        leftLeg: {
          hipPitch: -stride * amp,
          hipOut: 0.06,
          knee: kneeL,
        },
        rightLeg: {
          hipPitch: stride * amp,
          hipOut: 0.06,
          knee: kneeR,
        },
      };
    }

    case 'hips':
      return {
        ...base,
        headYaw: 0.06 + sway * 0.045,
        headRoll: -0.05,
        torsoLean: -0.03,
        leftArm: {
          pitch: 0.16,
          abduct: 0.36,
          twist: 0.32,
          elbow: 0.88,
          wrist: -0.12,
          gesture: 'fist',
        },
        rightArm: {
          pitch: 0.16,
          abduct: 0.36,
          twist: -0.32,
          elbow: 0.88,
          wrist: 0.12,
          gesture: 'fist',
        },
      };

    case 'shrug':
      return {
        ...base,
        headYaw: 0.06 + sway * 0.04,
        headPitch: -0.04,
        headRoll: 0.11,
        leftArm: {
          pitch: 0.38,
          abduct: 0.38,
          twist: 0.28,
          elbow: 0.86,
          wrist: 0.12,
          gesture: 'open',
        },
        rightArm: {
          pitch: 0.38,
          abduct: 0.38,
          twist: -0.28,
          elbow: 0.86,
          wrist: -0.12,
          gesture: 'open',
        },
      };

    default:
      return base;
  }
}

export function parsePoseTimeline(poseInput?: PoseInput): PoseTimelineEntry[] {
  if (!poseInput) return [['stand', 0]];
  if (typeof poseInput === 'string') return [[poseInput || 'stand', 0]];
  if (!Array.isArray(poseInput) || poseInput.length === 0) return [['stand', 0]];
  const cleaned = poseInput
    .filter((entry): entry is PoseTimelineEntry => Array.isArray(entry) && typeof entry[0] === 'string')
    .map(([name, at]): PoseTimelineEntry => [name, Number.isFinite(Number(at)) ? Number(at) : 0])
    .sort((a, b) => a[1] - b[1]);
  return cleaned.length > 0 ? cleaned : [['stand', 0]];
}

export function evaluateCreator3DKinematics(
  poseInput: PoseInput | undefined,
  t: number,
  options?: {
    blendSec?: number;
    speaking?: boolean;
    facing?: 1 | -1;
    previewStatic?: boolean;
    viewMode?: 'full' | 'bust' | 'closeup' | 'orb';
    captionWords?: LipSyncWordTiming[];
    pace?: string;
  }
): EvaluatedCreator3DKinematics {
  const safeT = Number.isFinite(t) ? Math.max(0, t) : 0;
  const blendSec = Math.max(0.28, options?.blendSec ?? 0.68);
  const timeline = parsePoseTimeline(poseInput);

  let activeIdx = 0;
  for (let i = 0; i < timeline.length; i++) {
    if (timeline[i][1] <= safeT) {
      activeIdx = i;
    } else {
      break;
    }
  }

  const activePose = normalizeCreatorPoseName(timeline[activeIdx][0]);
  const prevPose = activeIdx > 0 ? normalizeCreatorPoseName(timeline[activeIdx - 1][0]) : activePose;
  const elapsedInPose = Math.max(0, safeT - timeline[activeIdx][1]);

  const targetAngles = getBasePoseAngles(activePose, safeT);
  const prevAngles = getBasePoseAngles(prevPose, safeT);

  // Overlapping multi-stage follow-through (anticipation dip -> pelvis/torso -> shoulders -> elbows -> wrists & head)
  const isTransitioning = activeIdx > 0 && elapsedInPose < blendSec * 1.32;
  const ant = activeIdx > 0 ? anticipationCurve(elapsedInPose, blendSec) : 0;
  const kBody = activeIdx === 0 || elapsedInPose >= blendSec ? 1 : springSettleEase(elapsedInPose / blendSec) * 0.35 + quinticEase(elapsedInPose / blendSec) * 0.65;
  const kShoulder =
    activeIdx === 0 || elapsedInPose >= blendSec * 1.12
      ? 1
      : springSettleEase((elapsedInPose - blendSec * 0.05) / (blendSec * 0.96));
  const kElbow =
    activeIdx === 0 || elapsedInPose >= blendSec * 1.24
      ? 1
      : springSettleEase((elapsedInPose - blendSec * 0.13) / (blendSec * 0.95));
  const kWrist =
    activeIdx === 0 || elapsedInPose >= blendSec * 1.32
      ? 1
      : springSettleEase((elapsedInPose - blendSec * 0.2) / (blendSec * 0.95));
  const kHead =
    activeIdx === 0 || elapsedInPose >= blendSec * 1.18
      ? 1
      : springSettleEase((elapsedInPose - blendSec * 0.07) / (blendSec * 0.94));

  // In bust/closeup mode, raise forearm gestures gently so hands remain expressive without over-bending the elbow
  const isTightFraming = options?.viewMode === 'bust' || options?.viewMode === 'closeup';
  const raiseBustArm = (arm: ArmJointAngles, armBias = 0): ArmJointAngles =>
    isTightFraming
      ? {
          ...arm,
          pitch: Math.max(arm.pitch, arm.gesture === 'open' && arm.pitch < 0.28 ? 0.28 : arm.pitch) + armBias,
          elbow: Math.min(1.04, arm.elbow + (arm.pitch < 0.5 ? 0.1 : 0.04)),
        }
      : { ...arm, pitch: arm.pitch + armBias };

  const fallbackSpeaking = options?.speaking ?? (!options?.previewStatic && safeT > 0.05);
  const lipSync = evaluateLipSyncAtTime(safeT, options?.previewStatic ? undefined : options?.captionWords, {
    pace: options?.pace,
    fallbackSpeaking: options?.speaking === false ? false : fallbackSpeaking,
  });
  const mouthOpen = lipSync.mouthOpen;
  const wordTone = lipSync.wordTone || 'neutral';

  // Natural periodic blink (~170ms every ~3.2s)
  const blinkCycle = ((safeT + 0.65) * 0.31) % 1;
  const blinkRaw = blinkCycle > 0.945 ? Math.sin(((blinkCycle - 0.945) / 0.055) * Math.PI) : 0;

  const breathOffset = Math.sin(safeT * 2.05) * 0.016 + Math.sin(safeT * 4.1) * 0.003;
  const hairBounce =
    Math.sin(safeT * 3.8 - 0.45) * 0.017 +
    Math.sin(safeT * 1.9) * 0.01 +
    Math.max(0, mouthOpen) * 0.012 +
    lipSync.stressAccent * 0.02 +
    (isTransitioning ? ant * -0.025 : 0);
  const tailWag = Math.sin(safeT * 3.1) * 0.3 + Math.sin(safeT * 1.55 + 0.6) * 0.11;
  const tailLift = Math.cos(safeT * 2.2) * 0.085;
  // Subtle volume-preserving chest pop & stretch on emphasis + anticipation squat on pose transitions
  const settleImpulse = isTransitioning ? Math.sin(Math.min(1, elapsedInPose / blendSec) * Math.PI) * 0.018 : 0;
  const bodySquash = ant * -0.026 + settleImpulse + lipSync.stressAccent * 0.028;

  const isWorriedContext =
    activePose === 'headache' ||
    activePose === 'sigh' ||
    activePose === 'tired' ||
    activePose === 'angry' ||
    activePose === 'shrug' ||
    wordTone === 'worry';
  const isShockContext = activePose === 'scared' || wordTone === 'shock';
  const isHappyContext =
    activePose === 'cheer' ||
    activePose === 'thumbs' ||
    activePose === 'wave' ||
    activePose === 'idea' ||
    activePose === 'yes' ||
    activePose === 'cash' ||
    wordTone === 'excited';

  let baseBrowTilt = 0.03;
  if (activePose === 'think' || wordTone === 'question') baseBrowTilt = 0.16;
  else if (activePose === 'headache' || activePose === 'sigh' || activePose === 'tired' || wordTone === 'worry') baseBrowTilt = 0.24;
  else if (activePose === 'angry') baseBrowTilt = -0.26;
  else if (activePose === 'idea' || activePose === 'point' || isShockContext) baseBrowTilt = -0.12;

  const browTilt =
    baseBrowTilt * (0.78 + 0.22 * Math.sin(safeT * 2.3)) +
    lipSync.stressAccent * 0.065;

  // Dynamic eye mode responsive to both pose and active word tone
  let resolvedEyeMode: CreatorEyeMode = kHead > 0.5 ? targetAngles.eyeMode : prevAngles.eyeMode;
  if (isShockContext && lipSync.stressAccent > 0.35) {
    resolvedEyeMode = 'wide_shock';
  } else if (wordTone === 'worry' && resolvedEyeMode === 'normal') {
    resolvedEyeMode = 'tired_half';
  } else if (wordTone === 'excited' && lipSync.stressAccent > 0.55 && resolvedEyeMode === 'normal') {
    resolvedEyeMode = 'happy_arc';
  }

  // Dynamic mouthSmile (-0.85 = worried frown, 0 = neutral, 0.5..1.0 = warm smile/grin)
  let resolvedMouthSmile = 0.52;
  if (isWorriedContext) {
    resolvedMouthSmile = -0.78;
  } else if (isShockContext) {
    resolvedMouthSmile = -0.35;
  } else if (activePose === 'think' || activePose === 'sittype' || wordTone === 'question') {
    resolvedMouthSmile = 0.08;
  } else if (isHappyContext) {
    resolvedMouthSmile = 1.0;
  }

  // Speech-driven head articulation (jaw/head micro-nod on open vowels + stressed words)
  const speechHeadNod = mouthOpen * 0.042 * Math.sin(safeT * 5.2) + lipSync.stressAccent * 0.05;
  const isAnimated = !options?.previewStatic;
  const speechArmPulse = (mouthOpen * 0.038 + lipSync.stressAccent * 0.06) * (isAnimated ? 1 : 0);

  // Phase-delayed pendulum wave (shoulder -> elbow lag -0.55 rad -> wrist lag -1.15 rad) so arms have fluid siku movement without sharp kinks
  const pendulumShoulderL = isAnimated ? Math.sin(safeT * 2.15) * 0.036 : 0;
  const pendulumElbowL = isAnimated ? Math.sin(safeT * 2.15 - 0.62) * 0.055 + speechArmPulse * 0.42 : 0;
  const pendulumWristL = isAnimated ? Math.sin(safeT * 2.15 - 1.24) * 0.075 + speechArmPulse * 0.35 : 0;

  const pendulumShoulderR = isAnimated ? Math.sin(safeT * 2.15 + 0.85) * 0.042 : 0;
  const pendulumElbowR = isAnimated ? Math.sin(safeT * 2.15 + 0.22) * 0.065 + speechArmPulse * 0.52 : 0;
  const pendulumWristR = isAnimated ? Math.sin(safeT * 2.15 - 0.42) * 0.085 + speechArmPulse * 0.44 : 0;

  const articulateFluidArm = (
    arm: ArmJointAngles,
    dShoulder: number,
    dElbow: number,
    dWrist: number,
    dAbduct: number
  ): ArmJointAngles => {
    const baseArm = raiseBustArm(arm, dShoulder);
    return {
      ...baseArm,
      abduct: Math.max(0.14, Math.min(0.58, baseArm.abduct + dAbduct)),
      twist: baseArm.twist + dWrist * 0.28,
      elbow: Math.max(0.22, Math.min(1.08, baseArm.elbow + dElbow)),
      wrist: baseArm.wrist + dWrist,
    };
  };

  return {
    headYaw: lerp(prevAngles.headYaw, targetAngles.headYaw, kHead),
    headPitch:
      lerp(prevAngles.headPitch, targetAngles.headPitch, kHead) +
      breathOffset * 0.55 +
      speechHeadNod +
      ant * -0.045,
    headRoll:
      lerp(prevAngles.headRoll, targetAngles.headRoll, kHead) +
      lipSync.stressAccent * 0.032 +
      (wordTone === 'question' ? 0.065 : 0) +
      Math.sin(safeT * 1.75) * 0.014,
    torsoLean: lerp(prevAngles.torsoLean, targetAngles.torsoLean, kBody) + ant * -0.04 + lipSync.stressAccent * 0.025,
    torsoTwist: lerp(prevAngles.torsoTwist, targetAngles.torsoTwist, kBody) + lipSync.stressAccent * 0.038,
    torsoSide: lerp(prevAngles.torsoSide, targetAngles.torsoSide, kBody),
    hipShiftX: lerp(prevAngles.hipShiftX, targetAngles.hipShiftX, kBody),
    hipDropY: lerp(prevAngles.hipDropY, targetAngles.hipDropY, kBody) + Math.max(0, -ant * 0.028),
    leftArm: articulateFluidArm(
      lerpArm(prevAngles.leftArm, targetAngles.leftArm, kElbow, kShoulder, kWrist),
      ant * 0.08 + speechArmPulse * 0.55 + pendulumShoulderL,
      pendulumElbowL,
      pendulumWristL,
      isAnimated ? Math.sin(safeT * 1.65) * 0.032 : 0
    ),
    rightArm: articulateFluidArm(
      lerpArm(prevAngles.rightArm, targetAngles.rightArm, kElbow, kShoulder, kWrist),
      ant * 0.1 + speechArmPulse * 0.85 + pendulumShoulderR,
      pendulumElbowR,
      pendulumWristR,
      isAnimated ? Math.cos(safeT * 1.65) * 0.038 : 0
    ),
    leftLeg: lerpLeg(prevAngles.leftLeg, targetAngles.leftLeg, kBody),
    rightLeg: lerpLeg(prevAngles.rightLeg, targetAngles.rightLeg, kBody),
    eyeMode: resolvedEyeMode,
    activePose,
    prevPose,
    blendAlpha: clamp01(kBody),
    blinkAmount: clamp01(blinkRaw),
    browLift:
      Math.sin(safeT * 2.1) * 0.018 +
      mouthOpen * 0.026 +
      lipSync.stressAccent * 0.042 +
      (isShockContext || wordTone === 'question' ? 0.045 : 0),
    gazeX: Math.sin(safeT * 1.2) * 0.062 + Math.sin(safeT * 2.9) * 0.018,
    gazeY: Math.cos(safeT * 0.95) * 0.032 + (isWorriedContext ? -0.04 : 0),
    mouthOpen: isShockContext && mouthOpen < 0.35 && !options?.previewStatic ? 0.42 : mouthOpen,
    mouthWide: isShockContext && mouthOpen < 0.35 ? 0.66 : lipSync.mouthWide,
    vowelShape: isShockContext && mouthOpen < 0.35 ? 'O' : lipSync.vowelShape,
    stressAccent: lipSync.stressAccent,
    mouthSmile: resolvedMouthSmile,
    breathOffset,
    hairBounce,
    tailWag,
    tailLift,
    bodySquash,
    browTilt,
  };
}

export interface MascotOrbKinematics {
  bobY: number;
  tiltZ: number;
  yawY: number;
  leftWingFlap: number;
  rightWingFlap: number;
  glowPulse: number;
}

export function evaluateMascotOrbKinematics(t: number): MascotOrbKinematics {
  const safeT = Number.isFinite(t) ? t : 0;
  return {
    bobY: Math.sin(safeT * 2.6) * 0.12 + Math.sin(safeT * 1.3) * 0.03,
    tiltZ: Math.sin(safeT * 1.8) * 0.09,
    yawY: Math.sin(safeT * 1.35) * 0.24,
    leftWingFlap: Math.sin(safeT * 8.8) * 0.34 + 0.16,
    rightWingFlap: -Math.sin(safeT * 8.8) * 0.34 - 0.16,
    glowPulse: 0.78 + Math.sin(safeT * 3.4) * 0.22,
  };
}


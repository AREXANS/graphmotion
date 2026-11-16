/**
 * Per-profile human vocal-tract mastering & neural voice routing table.
 * Ensures every one of the 27 Satset voice profiles has a distinct, natural human
 * pitch, resonance, cadence, and spectral signature (never robotic/identical).
 */

export interface VoiceMasteringPreset {
  id: string;
  gender: 'male' | 'female';
  pitchRatio: number;
  baseTempo: number;
  chestHz: number;
  chestDb: number;
  presenceHz: number;
  presenceDb: number;
  trebleDb: number;
  lowpassHz: number;
  ottsyEnVoice: string;
  ottsyIdVoice: string;
}

export const VOICE_MASTERING_PRESETS: Record<string, VoiceMasteringPreset> = {
  // Indonesian Male Profiles
  charon: {
    id: 'charon',
    gender: 'male',
    pitchRatio: 0.765,
    baseTempo: 0.99,
    chestHz: 128,
    chestDb: 5.4,
    presenceHz: 2600,
    presenceDb: 1.4,
    trebleDb: 0.4,
    lowpassHz: 7600,
    ottsyEnVoice: 'en_male_narration',
    ottsyIdVoice: 'id_001',
  },
  fenrir: {
    id: 'fenrir',
    gender: 'male',
    pitchRatio: 0.835,
    baseTempo: 1.06,
    chestHz: 145,
    chestDb: 4.5,
    presenceHz: 3100,
    presenceDb: 2.6,
    trebleDb: 1.6,
    lowpassHz: 8100,
    ottsyEnVoice: 'en_male_cody',
    ottsyIdVoice: 'id_001',
  },
  orus: {
    id: 'orus',
    gender: 'male',
    pitchRatio: 0.785,
    baseTempo: 0.96,
    chestHz: 132,
    chestDb: 5.0,
    presenceHz: 2200,
    presenceDb: 0.8,
    trebleDb: -0.5,
    lowpassHz: 7200,
    ottsyEnVoice: 'en_uk_003',
    ottsyIdVoice: 'id_001',
  },
  iapetus: {
    id: 'iapetus',
    gender: 'male',
    pitchRatio: 0.86,
    baseTempo: 1.01,
    chestHz: 150,
    chestDb: 3.4,
    presenceHz: 2700,
    presenceDb: 1.8,
    trebleDb: 1.0,
    lowpassHz: 7900,
    ottsyEnVoice: 'en_us_006',
    ottsyIdVoice: 'id_001',
  },
  algenti: {
    id: 'algenti',
    gender: 'male',
    pitchRatio: 0.88,
    baseTempo: 1.03,
    chestHz: 155,
    chestDb: 2.9,
    presenceHz: 3200,
    presenceDb: 2.4,
    trebleDb: 1.8,
    lowpassHz: 8300,
    ottsyEnVoice: 'en_us_007',
    ottsyIdVoice: 'id_001',
  },
  'zephyr-male': {
    id: 'zephyr-male',
    gender: 'male',
    pitchRatio: 0.845,
    baseTempo: 0.97,
    chestHz: 140,
    chestDb: 3.9,
    presenceHz: 2450,
    presenceDb: 1.2,
    trebleDb: 0.5,
    lowpassHz: 7600,
    ottsyEnVoice: 'en_au_002',
    ottsyIdVoice: 'id_001',
  },

  // Other Male Profiles
  puck: {
    id: 'puck',
    gender: 'male',
    pitchRatio: 0.915,
    baseTempo: 1.06,
    chestHz: 162,
    chestDb: 2.6,
    presenceHz: 3300,
    presenceDb: 2.8,
    trebleDb: 2.0,
    lowpassHz: 8500,
    ottsyEnVoice: 'en_us_009',
    ottsyIdVoice: 'id_001',
  },
  enceladus: {
    id: 'enceladus',
    gender: 'male',
    pitchRatio: 0.81,
    baseTempo: 0.91,
    chestHz: 138,
    chestDb: 4.1,
    presenceHz: 1900,
    presenceDb: -0.6,
    trebleDb: 1.2,
    lowpassHz: 6800,
    ottsyEnVoice: 'en_male_narration',
    ottsyIdVoice: 'id_001',
  },
  algieba: {
    id: 'algieba',
    gender: 'male',
    pitchRatio: 0.805,
    baseTempo: 0.98,
    chestHz: 136,
    chestDb: 4.6,
    presenceHz: 2800,
    presenceDb: 2.1,
    trebleDb: 0.9,
    lowpassHz: 7800,
    ottsyEnVoice: 'en_uk_003',
    ottsyIdVoice: 'id_001',
  },
  rasalgethi: {
    id: 'rasalgethi',
    gender: 'male',
    pitchRatio: 0.89,
    baseTempo: 1.04,
    chestHz: 154,
    chestDb: 3.3,
    presenceHz: 2950,
    presenceDb: 2.5,
    trebleDb: 1.5,
    lowpassHz: 8200,
    ottsyEnVoice: 'en_us_010',
    ottsyIdVoice: 'id_001',
  },
  mintaka: {
    id: 'mintaka',
    gender: 'male',
    pitchRatio: 0.855,
    baseTempo: 1.0,
    chestHz: 146,
    chestDb: 3.6,
    presenceHz: 3150,
    presenceDb: 2.2,
    trebleDb: 1.3,
    lowpassHz: 8200,
    ottsyEnVoice: 'en_us_006',
    ottsyIdVoice: 'id_001',
  },
  scheat: {
    id: 'scheat',
    gender: 'male',
    pitchRatio: 0.752,
    baseTempo: 0.93,
    chestHz: 124,
    chestDb: 5.5,
    presenceHz: 2100,
    presenceDb: 0.6,
    trebleDb: -0.8,
    lowpassHz: 7100,
    ottsyEnVoice: 'en_male_narration',
    ottsyIdVoice: 'id_001',
  },
  zubenelgenubi: {
    id: 'zubenelgenubi',
    gender: 'male',
    pitchRatio: 0.93,
    baseTempo: 1.09,
    chestHz: 165,
    chestDb: 2.8,
    presenceHz: 3450,
    presenceDb: 3.0,
    trebleDb: 2.2,
    lowpassHz: 8600,
    ottsyEnVoice: 'en_male_jomboy',
    ottsyIdVoice: 'id_001',
  },
  sadachbia: {
    id: 'sadachbia',
    gender: 'male',
    pitchRatio: 0.902,
    baseTempo: 1.02,
    chestHz: 158,
    chestDb: 3.0,
    presenceHz: 2850,
    presenceDb: 1.7,
    trebleDb: 1.1,
    lowpassHz: 8000,
    ottsyEnVoice: 'en_au_002',
    ottsyIdVoice: 'id_001',
  },
  sadaltager: {
    id: 'sadaltager',
    gender: 'male',
    pitchRatio: 0.822,
    baseTempo: 0.94,
    chestHz: 142,
    chestDb: 4.0,
    presenceHz: 2300,
    presenceDb: 0.9,
    trebleDb: 0.6,
    lowpassHz: 7300,
    ottsyEnVoice: 'en_uk_003',
    ottsyIdVoice: 'id_001',
  },

  // Indonesian Female Profiles
  kore: {
    id: 'kore',
    gender: 'female',
    pitchRatio: 1.08,
    baseTempo: 1.07,
    chestHz: 225,
    chestDb: 2.4,
    presenceHz: 3400,
    presenceDb: 2.8,
    trebleDb: 2.0,
    lowpassHz: 8800,
    ottsyEnVoice: 'en_female_emotional',
    ottsyIdVoice: 'id_001',
  },
  aoede: {
    id: 'aoede',
    gender: 'female',
    pitchRatio: 0.992,
    baseTempo: 0.97,
    chestHz: 205,
    chestDb: 2.9,
    presenceHz: 2600,
    presenceDb: 1.2,
    trebleDb: 0.8,
    lowpassHz: 8000,
    ottsyEnVoice: 'en_au_001',
    ottsyIdVoice: 'id_001',
  },
  leda: {
    id: 'leda',
    gender: 'female',
    pitchRatio: 1.015,
    baseTempo: 1.01,
    chestHz: 212,
    chestDb: 2.6,
    presenceHz: 2850,
    presenceDb: 1.6,
    trebleDb: 1.2,
    lowpassHz: 8300,
    ottsyEnVoice: 'en_us_001',
    ottsyIdVoice: 'id_001',
  },
  despina: {
    id: 'despina',
    gender: 'female',
    pitchRatio: 1.042,
    baseTempo: 1.03,
    chestHz: 218,
    chestDb: 2.8,
    presenceHz: 3100,
    presenceDb: 2.1,
    trebleDb: 1.5,
    lowpassHz: 8500,
    ottsyEnVoice: 'en_us_002',
    ottsyIdVoice: 'id_001',
  },
  achernar: {
    id: 'achernar',
    gender: 'female',
    pitchRatio: 0.96,
    baseTempo: 0.99,
    chestHz: 198,
    chestDb: 3.2,
    presenceHz: 2500,
    presenceDb: 1.3,
    trebleDb: 0.6,
    lowpassHz: 7900,
    ottsyEnVoice: 'en_uk_001',
    ottsyIdVoice: 'id_001',
  },
  vindemiatrix: {
    id: 'vindemiatrix',
    gender: 'female',
    pitchRatio: 1.055,
    baseTempo: 1.04,
    chestHz: 216,
    chestDb: 2.3,
    presenceHz: 3250,
    presenceDb: 2.2,
    trebleDb: 1.7,
    lowpassHz: 8600,
    ottsyEnVoice: 'en_female_emotional',
    ottsyIdVoice: 'id_001',
  },
  sulafat: {
    id: 'sulafat',
    gender: 'female',
    pitchRatio: 0.975,
    baseTempo: 0.98,
    chestHz: 202,
    chestDb: 3.4,
    presenceHz: 2450,
    presenceDb: 1.1,
    trebleDb: 0.4,
    lowpassHz: 7800,
    ottsyEnVoice: 'en_au_001',
    ottsyIdVoice: 'id_001',
  },

  // Other Female Profiles
  'zephyr-female': {
    id: 'zephyr-female',
    gender: 'female',
    pitchRatio: 1.035,
    baseTempo: 1.0,
    chestHz: 214,
    chestDb: 2.5,
    presenceHz: 3000,
    presenceDb: 1.9,
    trebleDb: 1.4,
    lowpassHz: 8400,
    ottsyEnVoice: 'en_uk_001',
    ottsyIdVoice: 'id_001',
  },
  callirrhoe: {
    id: 'callirrhoe',
    gender: 'female',
    pitchRatio: 0.985,
    baseTempo: 0.96,
    chestHz: 204,
    chestDb: 3.0,
    presenceHz: 2550,
    presenceDb: 1.4,
    trebleDb: 0.9,
    lowpassHz: 8000,
    ottsyEnVoice: 'en_au_001',
    ottsyIdVoice: 'id_001',
  },
  autonoe: {
    id: 'autonoe',
    gender: 'female',
    pitchRatio: 1.028,
    baseTempo: 1.02,
    chestHz: 210,
    chestDb: 2.6,
    presenceHz: 2950,
    presenceDb: 1.7,
    trebleDb: 1.3,
    lowpassHz: 8300,
    ottsyEnVoice: 'en_us_001',
    ottsyIdVoice: 'id_001',
  },
  erinome: {
    id: 'erinome',
    gender: 'female',
    pitchRatio: 0.945,
    baseTempo: 0.94,
    chestHz: 194,
    chestDb: 3.5,
    presenceHz: 2250,
    presenceDb: 0.9,
    trebleDb: 0.2,
    lowpassHz: 7600,
    ottsyEnVoice: 'en_uk_001',
    ottsyIdVoice: 'id_001',
  },
  laomedeia: {
    id: 'laomedeia',
    gender: 'female',
    pitchRatio: 1.105,
    baseTempo: 1.08,
    chestHz: 232,
    chestDb: 2.1,
    presenceHz: 3550,
    presenceDb: 2.9,
    trebleDb: 2.2,
    lowpassHz: 8900,
    ottsyEnVoice: 'en_us_002',
    ottsyIdVoice: 'id_001',
  },
  dia: {
    id: 'dia',
    gender: 'female',
    pitchRatio: 1.062,
    baseTempo: 1.01,
    chestHz: 220,
    chestDb: 2.7,
    presenceHz: 3200,
    presenceDb: 2.3,
    trebleDb: 1.6,
    lowpassHz: 8500,
    ottsyEnVoice: 'en_us_001',
    ottsyIdVoice: 'id_001',
  },
  pulcherrima: {
    id: 'pulcherrima',
    gender: 'female',
    pitchRatio: 1.074,
    baseTempo: 1.05,
    chestHz: 224,
    chestDb: 2.5,
    presenceHz: 3350,
    presenceDb: 2.5,
    trebleDb: 1.8,
    lowpassHz: 8700,
    ottsyEnVoice: 'en_female_emotional',
    ottsyIdVoice: 'id_001',
  },
};

const VOICE_ALIASES: Record<string, string> = {
  budi: 'charon',
  dimas: 'fenrir',
  sarah: 'kore',
  maya: 'aoede',
};

const FEMALE_PROFILE_NAMES = new Set<string>([
  'kore',
  'aoede',
  'leda',
  'sarah',
  'maya',
  'despina',
  'achernar',
  'vindemiatrix',
  'sulafat',
  'zephyr-female',
  'callirrhoe',
  'autonoe',
  'erinome',
  'laomedeia',
  'dia',
  'pulcherrima',
]);

export function resolveVoiceMasteringPreset(
  rawVoice: string,
  isFemaleHint = false
): VoiceMasteringPreset {
  const clean = (rawVoice || '').trim().toLowerCase();
  const mappedKey = VOICE_ALIASES[clean] || clean;
  if (VOICE_MASTERING_PRESETS[mappedKey]) {
    return VOICE_MASTERING_PRESETS[mappedKey];
  }
  const partial = Object.values(VOICE_MASTERING_PRESETS).find(
    (p) => mappedKey.includes(p.id) || p.id.includes(mappedKey)
  );
  if (partial) return partial;
  const inferredFemale = isFemaleHint || Array.from(FEMALE_PROFILE_NAMES).some((f) => clean.includes(f));
  return inferredFemale ? VOICE_MASTERING_PRESETS.kore : VOICE_MASTERING_PRESETS.fenrir;
}

export function isVoiceProfileFemale(rawVoice: string, explicitFlag = false): boolean {
  if (explicitFlag) return true;
  const clean = (rawVoice || '').trim().toLowerCase();
  if (clean === 'zephyr') return false;
  return Array.from(FEMALE_PROFILE_NAMES).some((f) => clean.includes(f));
}

/**
 * Detects whether a clause is predominantly English vs Indonesian so Indonesian narration
 * always uses native Indonesian phonetics (`id_001`) while pure English lines can use
 * varied native English neural speakers.
 */
export function selectNeuralBaseVoiceForClause(
  clause: string,
  rawVoice: string,
  isFemaleHint = false
): { otVoice: string; isEnglishClause: boolean } {
  const preset = resolveVoiceMasteringPreset(rawVoice, isFemaleHint);
  const idMarkers = /\b(yang|dan|atau|dengan|untuk|pada|ini|itu|dari|kamu|kita|tidak|nggak|enggak|bisa|akan|sudah|kalau|saat|dalam|lebih|sangat|adalah|halo|pelan|melangkah|suaraku|ceritamu|penting|terus|membuat|cara|biar|kenapa|karena|bukan|hanya|cuma|sekarang|jadi|sampai|semua|orang|banyak)\b/i;
  const enMarkers = /\b(the|and|with|for|that|this|from|you|your|are|was|were|have|has|how|why|what|when|will|can|could|should|about|into|they|their)\b/i;

  const hasIndonesian = idMarkers.test(clause);
  const enMatches = clause.match(new RegExp(enMarkers.source, 'gi')) || [];
  const isEnglishClause = !hasIndonesian && enMatches.length >= 2;

  return {
    otVoice: isEnglishClause ? preset.ottsyEnVoice : preset.ottsyIdVoice,
    isEnglishClause,
  };
}

/**
 * Builds a unique ffmpeg mastering filter chain per voice profile with formant warmth,
 * vocal presence, breath shelf, pitch ratio, and tempo compensation.
 */
export function buildVoiceMasteringFilter(
  rawVoice: string,
  isFemale = false,
  speed = 1.0
): string {
  const preset = resolveVoiceMasteringPreset(rawVoice, isFemale);
  const clampedSpeed = Math.max(0.84, Math.min(1.22, Number(speed) || 1.0));
  const compensatedTempo = Math.max(
    0.72,
    Math.min(1.68, (preset.baseTempo / preset.pitchRatio) * clampedSpeed)
  );
  const hpHz = preset.gender === 'female' ? 82 : 62;

  return [
    `asetrate=24000*${preset.pitchRatio.toFixed(3)}`,
    `aresample=24000`,
    `atempo=${compensatedTempo.toFixed(3)}`,
    `highpass=f=${hpHz}`,
    `equalizer=f=${preset.chestHz}:width_type=q:width=1.15:g=${preset.chestDb.toFixed(1)}`,
    `equalizer=f=${preset.presenceHz}:width_type=q:width=1.3:g=${preset.presenceDb.toFixed(1)}`,
    `treble=g=${preset.trebleDb.toFixed(1)}:f=4800`,
    `lowpass=f=${preset.lowpassHz}`,
    `acompressor=threshold=-16dB:ratio=2.4:attack=12:release=110:makeup=1.5dB`,
  ].join(',');
}

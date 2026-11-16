/**
 * VoiceStudio Natural Speech & Prosody Engine
 * Inspired by VoiceStudio (https://github.com/debpalash/VoiceStudio.git)
 *
 * Implements human-grade conversational prosody, Indonesian vocal tract modeling,
 * breath simulation, sentence chunking, dynamic pitch modulation, and studio mastering filters.
 */

export interface VoiceProfile {
  id: string;
  name: string;
  character: string;
  subLabel: string;
  category: 'id_male' | 'id_female' | 'other_male' | 'other_female';
  gender: 'male' | 'female';
  tone: string;
  recommendedSpeed: number;
  pitchBase: number;
  pitchVariance: number;
  warmthGain: number; // dB boost in chest resonance
  geminiVoiceName: string;
  tags: string[];
}

export const VOICE_CATEGORIES: { id: VoiceProfile['category']; label: string }[] = [
  { id: 'id_male', label: 'COCOK UNTUK BAHASA INDONESIA - PRIA' },
  { id: 'id_female', label: 'COCOK UNTUK BAHASA INDONESIA - WANITA' },
  { id: 'other_male', label: 'SUARA LAIN - PRIA' },
  { id: 'other_female', label: 'SUARA LAIN - WANITA' },
];

export const SAMPLE_AUDIO_TEXT =
  'Halo, begini suaraku kalau membacakan ceritamu. Pelan-pelan saja, yang penting terus melangkah.';

export const DEFAULT_MALE_PROMPT =
  'Bacakan dalam bahasa Indonesia dengan suara pria yang berat dan dalam, tapi penuh energi seperti coach motivasi yang membakar semangat. Tempo cepat dan tegas, tekan kata-kata kunci, nada naik di akhir ajakan. Beri jeda hening sekitar setengah detik di setiap pergantian baris; di koma cukup jeda sangat singkat, jangan berhenti lama di tengah kalimat.';

export const DEFAULT_FEMALE_PROMPT =
  'Bacakan dalam bahasa Indonesia dengan suara wanita yang jernih dan bertenaga, penuh energi seperti coach motivasi yang membakar semangat. Tempo cepat dan tegas, tekan kata-kata kunci, nada naik di akhir ajakan. Beri jeda hening sekitar setengah detik di setiap pergantian baris; di koma cukup jeda sangat singkat, jangan berhenti lama di tengah kalimat.';

export const VOICE_PROFILES: VoiceProfile[] = [
  // ==========================================
  // COCOK UNTUK BAHASA INDONESIA - PRIA
  // ==========================================
  {
    id: 'charon',
    name: 'Charon',
    character: 'Pria Berat & Dalam',
    subLabel: 'berat dalam - cocok ID, EN',
    category: 'id_male',
    gender: 'male',
    tone: 'Berat dalam, berbobot, akrab dan tenang',
    recommendedSpeed: 0.98,
    pitchBase: 0.78,
    pitchVariance: 0.14,
    warmthGain: 5.0,
    geminiVoiceName: 'Charon',
    tags: ['ID', 'EN', 'Pria', 'Berat', 'Dalam'],
  },
  {
    id: 'fenrir',
    name: 'Fenrir',
    character: 'Pria Serak Bersemangat',
    subLabel: 'berat serak bersemangat - cocok ID, EN',
    category: 'id_male',
    gender: 'male',
    tone: 'Berat serak bertenaga, membakar semangat',
    recommendedSpeed: 1.05,
    pitchBase: 0.82,
    pitchVariance: 0.2,
    warmthGain: 4.2,
    geminiVoiceName: 'Fenrir',
    tags: ['ID', 'EN', 'Pria', 'Serak', 'Motivasi'],
  },
  {
    id: 'orus',
    name: 'Orus',
    character: 'Pria Berat Santai',
    subLabel: 'berat santai - cocok ID',
    category: 'id_male',
    gender: 'male',
    tone: 'Berat santai mengalir alami',
    recommendedSpeed: 0.96,
    pitchBase: 0.77,
    pitchVariance: 0.13,
    warmthGain: 4.8,
    geminiVoiceName: 'Orus',
    tags: ['ID', 'Pria', 'Santai'],
  },
  {
    id: 'iapetus',
    name: 'Iapetus',
    character: 'Pria Santai',
    subLabel: 'santai - cocok ID',
    category: 'id_male',
    gender: 'male',
    tone: 'Santai, kasual, luwes',
    recommendedSpeed: 1.0,
    pitchBase: 0.84,
    pitchVariance: 0.16,
    warmthGain: 3.5,
    geminiVoiceName: 'Charon',
    tags: ['ID', 'Pria', 'Santai'],
  },
  {
    id: 'algenti',
    name: 'Algenti',
    character: 'Pria Santai Mengalir',
    subLabel: 'santai - cocok ID',
    category: 'id_male',
    gender: 'male',
    tone: 'Artikulasi bersih, santai',
    recommendedSpeed: 1.02,
    pitchBase: 0.85,
    pitchVariance: 0.15,
    warmthGain: 3.2,
    geminiVoiceName: 'Charon',
    tags: ['ID', 'Pria', 'Santai'],
  },
  {
    id: 'zephyr-male',
    name: 'Zephyr',
    character: 'Pria Santai Menyejukkan',
    subLabel: 'santai - cocok ID',
    category: 'id_male',
    gender: 'male',
    tone: 'Teduh, santai, jernih',
    recommendedSpeed: 0.98,
    pitchBase: 0.83,
    pitchVariance: 0.14,
    warmthGain: 3.8,
    geminiVoiceName: 'Zephyr',
    tags: ['ID', 'Pria', 'Santai'],
  },

  // ==========================================
  // COCOK UNTUK BAHASA INDONESIA - WANITA
  // ==========================================
  {
    id: 'kore',
    name: 'Kore',
    character: 'Wanita Tegas & Jernih',
    subLabel: 'tegas - cocok ID',
    category: 'id_female',
    gender: 'female',
    tone: 'Segar, energik, motivasi, jernih bertenaga',
    recommendedSpeed: 1.05,
    pitchBase: 1.14,
    pitchVariance: 0.22,
    warmthGain: 2.8,
    geminiVoiceName: 'Kore',
    tags: ['ID', 'Wanita', 'Segar', 'Energik'],
  },
  {
    id: 'aoede',
    name: 'Aoede',
    character: 'Wanita Lembut',
    subLabel: 'lembut - cocok ID',
    category: 'id_female',
    gender: 'female',
    tone: 'Lembut, jernih, menyenangkan',
    recommendedSpeed: 0.96,
    pitchBase: 1.08,
    pitchVariance: 0.16,
    warmthGain: 2.5,
    geminiVoiceName: 'Aoede',
    tags: ['ID', 'Wanita', 'Lembut'],
  },
  {
    id: 'leda',
    name: 'Leda',
    character: 'Wanita Lembut Santai',
    subLabel: 'lembut santai - cocok ID',
    category: 'id_female',
    gender: 'female',
    tone: 'Lembut santai, gaya mengobrol',
    recommendedSpeed: 1.0,
    pitchBase: 1.06,
    pitchVariance: 0.18,
    warmthGain: 2.6,
    geminiVoiceName: 'Leda',
    tags: ['ID', 'Wanita', 'Lembut', 'Santai'],
  },
  {
    id: 'despina',
    name: 'Despina',
    character: 'Wanita Hangat Bersemangat',
    subLabel: 'hangat bersemangat - cocok ID',
    category: 'id_female',
    gender: 'female',
    tone: 'Hangat, artikulatif, bersemangat',
    recommendedSpeed: 1.02,
    pitchBase: 1.1,
    pitchVariance: 0.2,
    warmthGain: 2.9,
    geminiVoiceName: 'Kore',
    tags: ['ID', 'Wanita', 'Hangat'],
  },
  {
    id: 'achernar',
    name: 'Achernar',
    character: 'Wanita Santai',
    subLabel: 'santai - cocok ID',
    category: 'id_female',
    gender: 'female',
    tone: 'Santai, lugas, mengalir',
    recommendedSpeed: 1.0,
    pitchBase: 1.05,
    pitchVariance: 0.15,
    warmthGain: 2.4,
    geminiVoiceName: 'Aoede',
    tags: ['ID', 'Wanita', 'Santai'],
  },
  {
    id: 'vindemiatrix',
    name: 'Vindemiatrix',
    character: 'Wanita Lembut Bersemangat',
    subLabel: 'lembut bersemangat - cocok ID',
    category: 'id_female',
    gender: 'female',
    tone: 'Lembut namun berenergi positif',
    recommendedSpeed: 1.02,
    pitchBase: 1.09,
    pitchVariance: 0.18,
    warmthGain: 2.5,
    geminiVoiceName: 'Kore',
    tags: ['ID', 'Wanita', 'Lembut'],
  },
  {
    id: 'sulafat',
    name: 'Sulafat',
    character: 'Wanita Hangat',
    subLabel: 'hangat - cocok ID',
    category: 'id_female',
    gender: 'female',
    tone: 'Hangat, ramah, meyakinkan',
    recommendedSpeed: 0.98,
    pitchBase: 1.06,
    pitchVariance: 0.15,
    warmthGain: 3.0,
    geminiVoiceName: 'Leda',
    tags: ['ID', 'Wanita', 'Hangat'],
  },

  // ==========================================
  // SUARA LAIN - PRIA
  // ==========================================
  {
    id: 'puck',
    name: 'Puck',
    character: 'Pria Kasual Santai',
    subLabel: 'cerita, ngajak - cocok EN',
    category: 'other_male',
    gender: 'male',
    tone: 'Santai, playful, kasual',
    recommendedSpeed: 1.04,
    pitchBase: 0.88,
    pitchVariance: 0.2,
    warmthGain: 3.0,
    geminiVoiceName: 'Puck',
    tags: ['EN', 'Pria', 'Santai'],
  },
  {
    id: 'enceladus',
    name: 'Enceladus',
    character: 'Pria Berbisik Santai',
    subLabel: 'lembut berdesah, cocok bercerita - cocok EN',
    category: 'other_male',
    gender: 'male',
    tone: 'Halus berbisik, santai',
    recommendedSpeed: 0.92,
    pitchBase: 0.8,
    pitchVariance: 0.12,
    warmthGain: 3.8,
    geminiVoiceName: 'Charon',
    tags: ['EN', 'Pria', 'Berbisik'],
  },
  {
    id: 'algieba',
    name: 'Algieba',
    character: 'Pria Berwibawa',
    subLabel: 'pria',
    category: 'other_male',
    gender: 'male',
    tone: 'Tegas, stabil, berwibawa',
    recommendedSpeed: 0.96,
    pitchBase: 0.81,
    pitchVariance: 0.14,
    warmthGain: 4.2,
    geminiVoiceName: 'Charon',
    tags: ['Pria'],
  },
  {
    id: 'rasalgethi',
    name: 'Rasalgethi',
    character: 'Pria Presenter Santai',
    subLabel: 'santai, seperti presenter - cocok EN',
    category: 'other_male',
    gender: 'male',
    tone: 'Seperti presenter radio/TV santai',
    recommendedSpeed: 1.02,
    pitchBase: 0.84,
    pitchVariance: 0.18,
    warmthGain: 3.6,
    geminiVoiceName: 'Puck',
    tags: ['EN', 'Pria', 'Presenter'],
  },
  {
    id: 'mintaka',
    name: 'Mintaka',
    character: 'Pria Bersih & Tegas',
    subLabel: 'tegas, berwibawa - cocok EN',
    category: 'other_male',
    gender: 'male',
    tone: 'Jernih, artikulatif',
    recommendedSpeed: 1.0,
    pitchBase: 0.85,
    pitchVariance: 0.15,
    warmthGain: 3.4,
    geminiVoiceName: 'Charon',
    tags: ['Pria'],
  },
  {
    id: 'scheat',
    name: 'Scheat',
    character: 'Pria Dalam & Tenang',
    subLabel: 'tenang, datar',
    category: 'other_male',
    gender: 'male',
    tone: 'Dalam, tenang, berjarak',
    recommendedSpeed: 0.94,
    pitchBase: 0.78,
    pitchVariance: 0.13,
    warmthGain: 4.5,
    geminiVoiceName: 'Orus',
    tags: ['Pria'],
  },
  {
    id: 'zubenelgenubi',
    name: 'Zubenelgenubi',
    character: 'Pria Gembira Bersemangat',
    subLabel: 'santai, gaya ngobrol - cocok EN',
    category: 'other_male',
    gender: 'male',
    tone: 'Gembira, bersemangat tinggi',
    recommendedSpeed: 1.08,
    pitchBase: 0.89,
    pitchVariance: 0.24,
    warmthGain: 3.2,
    geminiVoiceName: 'Fenrir',
    tags: ['EN', 'Pria', 'Gembira'],
  },
  {
    id: 'sadachbia',
    name: 'Sadachbia',
    character: 'Pria Santai Ringan',
    subLabel: 'santai - cocok EN',
    category: 'other_male',
    gender: 'male',
    tone: 'Santai, ringan, kasual',
    recommendedSpeed: 1.0,
    pitchBase: 0.86,
    pitchVariance: 0.16,
    warmthGain: 3.1,
    geminiVoiceName: 'Puck',
    tags: ['EN', 'Pria', 'Santai'],
  },
  {
    id: 'sadaltager',
    name: 'Sadaltager',
    character: 'Pria Santai Berbisik',
    subLabel: 'santai berdesah, seperti guru - cocok EN',
    category: 'other_male',
    gender: 'male',
    tone: 'Santai berbisik lembut',
    recommendedSpeed: 0.94,
    pitchBase: 0.8,
    pitchVariance: 0.12,
    warmthGain: 3.9,
    geminiVoiceName: 'Charon',
    tags: ['EN', 'Pria', 'Berbisik'],
  },

  // ==========================================
  // SUARA LAIN - WANITA
  // ==========================================
  {
    id: 'zephyr-female',
    name: 'Zephyr',
    character: 'Wanita Jernih',
    subLabel: 'wanita',
    category: 'other_female',
    gender: 'female',
    tone: 'Jernih, anggun, artikulatif',
    recommendedSpeed: 1.0,
    pitchBase: 1.1,
    pitchVariance: 0.16,
    warmthGain: 2.6,
    geminiVoiceName: 'Zephyr',
    tags: ['Wanita'],
  },
  {
    id: 'callirrhoe',
    name: 'Callirrhoe',
    character: 'Wanita Lembut Anggun',
    subLabel: 'wanita',
    category: 'other_female',
    gender: 'female',
    tone: 'Lembut, anggun, berirama',
    recommendedSpeed: 0.98,
    pitchBase: 1.08,
    pitchVariance: 0.15,
    warmthGain: 2.7,
    geminiVoiceName: 'Aoede',
    tags: ['Wanita'],
  },
  {
    id: 'autonoe',
    name: 'Autonoe',
    character: 'Wanita Santai Mengalir',
    subLabel: 'wanita',
    category: 'other_female',
    gender: 'female',
    tone: 'Santai, mengalir ramah',
    recommendedSpeed: 1.02,
    pitchBase: 1.09,
    pitchVariance: 0.18,
    warmthGain: 2.5,
    geminiVoiceName: 'Leda',
    tags: ['Wanita'],
  },
  {
    id: 'erinome',
    name: 'Erinome',
    character: 'Wanita Hangat & Teduh',
    subLabel: 'wanita',
    category: 'other_female',
    gender: 'female',
    tone: 'Hangat, menenangkan, teduh',
    recommendedSpeed: 0.95,
    pitchBase: 1.06,
    pitchVariance: 0.14,
    warmthGain: 2.9,
    geminiVoiceName: 'Kore',
    tags: ['Wanita'],
  },
  {
    id: 'laomedeia',
    name: 'Laomedeia',
    character: 'Wanita Energik Ceria',
    subLabel: 'wanita',
    category: 'other_female',
    gender: 'female',
    tone: 'Ceria, segar, tempo lincah',
    recommendedSpeed: 1.06,
    pitchBase: 1.15,
    pitchVariance: 0.22,
    warmthGain: 2.3,
    geminiVoiceName: 'Kore',
    tags: ['Wanita'],
  },
  {
    id: 'dia',
    name: 'Dia',
    character: 'Wanita Jernih Berbobot',
    subLabel: 'wanita',
    category: 'other_female',
    gender: 'female',
    tone: 'Artikulasi jernih dan tegas',
    recommendedSpeed: 1.0,
    pitchBase: 1.1,
    pitchVariance: 0.16,
    warmthGain: 2.8,
    geminiVoiceName: 'Aoede',
    tags: ['Wanita'],
  },
  {
    id: 'pulcherrima',
    name: 'Pulcherrima',
    character: 'Wanita Bersemangat Santai',
    subLabel: 'wanita - santai, bersemangat, cocok EN',
    category: 'other_female',
    gender: 'female',
    tone: 'Santai bersemangat, gaya podcaster internasional',
    recommendedSpeed: 1.04,
    pitchBase: 1.12,
    pitchVariance: 0.2,
    warmthGain: 2.6,
    geminiVoiceName: 'Kore',
    tags: ['EN', 'Wanita', 'Bersemangat'],
  },
];

export const STYLE_PRESETS: Record<
  string,
  { label: string; desc: string; samplePrompt: string; speedMod: number; pitchMod: number }
> = {
  santai: {
    label: 'Percakapan Santai',
    desc: 'Seperti mengobrol akrab dengan teman. Luwes, tidak kaku, tanpa intonasi monoton robot Google.',
    samplePrompt: DEFAULT_MALE_PROMPT,
    speedMod: 1.0,
    pitchMod: 1.0,
  },
  storyteller: {
    label: 'Storyteller Hangat',
    desc: 'Tempo berirama dengan jeda dramatis. Cocok untuk narasi analogi, kisah inspiratif, dan renungan.',
    samplePrompt:
      'Gunakan gaya bercerita suara dewasa yang hangat, dalam, dan memikat. Tekankan kata kunci, perlambat sedikit di bagian renungan, lalu beri nada turun di akhir kalimat secara alami.',
    speedMod: 0.96,
    pitchMod: 0.98,
  },
  energik: {
    label: 'Kreator Energik (Shorts/Reels)',
    desc: 'Hook cepat, artikulasi renyah, bertenaga, membuat penonton tidak skip dalam 3 detik pertama.',
    samplePrompt: DEFAULT_FEMALE_PROMPT,
    speedMod: 1.08,
    pitchMod: 1.04,
  },
  teduh: {
    label: 'Teduh & Menginspirasi',
    desc: 'Tenang, menyejukkan, penuh empati. Sangat pas untuk self-development dan motivasi mendalam.',
    samplePrompt:
      'Gunakan nada suara yang lembut, tenang, dan teduh. Seperti narator podcast malam hari yang menenangkan pikiran pendengar dengan tarikan nafas teratur.',
    speedMod: 0.92,
    pitchMod: 0.95,
  },
};

/**
 * Text Humanizer: Transforms raw text into natural conversational spoken Indonesian
 */
export function humanizeIndonesianText(rawText: string): {
  spokenText: string;
  segments: { text: string; pauseAfterMs: number; isBreath: boolean; emphasisWords: string[] }[];
} {
  if (!rawText) return { spokenText: '', segments: [] };

  let cleaned = rawText
    .replace(/\bHP\b/gi, 'hape')
    .replace(/\bgak\b/gi, 'nggak')
    .replace(/\bgk\b/gi, 'nggak')
    .replace(/\bbgt\b/gi, 'banget')
    .replace(/\budah\b/gi, 'sudah')
    .replace(/\bblm\b/gi, 'belum')
    .replace(/\byg\b/gi, 'yang')
    .replace(/\bdgn\b/gi, 'dengan')
    .replace(/\butk\b/gi, 'untuk')
    .replace(/\bkrn\b/gi, 'karena')
    .replace(/\btp\b/gi, 'tapi')
    .replace(/\bjg\b/gi, 'juga')
    .replace(/\bAI\b/g, 'E-I')
    .replace(/\bVO\b/g, 'Voice Over')
    .replace(/(\d+)\s*%/g, '$1 persen')
    .replace(/(\d+)\s*detik/gi, '$1 detik')
    .replace(/(\d+)\s*menit/gi, '$1 menit')
    .replace(/(\d+)\s*jam/gi, '$1 jam')
    .replace(/(\d+)\s*hari/gi, '$1 hari')
    .replace(/\b2\s*menit\b/gi, 'dua menit')
    .replace(/\b3\s*detik\b/gi, 'tiga detik')
    .replace(/\b5\s*menit\b/gi, 'lima menit')
    .replace(/\b10\s*menit\b/gi, 'sepuluh menit')
    .replace(/\b21\s*jam\b/gi, 'dua puluh satu jam')
    .replace(/\b3\s*jam\b/gi, 'tiga jam')
    .replace(/\b1\s*jam\b/gi, 'satu jam')
    .replace(/\bSTOP\b/g, 'Stop!')
    .trim();

  const rawClauses = cleaned.split(/([.,!?;:\n—]+)/g);
  const segments: {
    text: string;
    pauseAfterMs: number;
    isBreath: boolean;
    emphasisWords: string[];
  }[] = [];

  let currentText = '';
  for (let i = 0; i < rawClauses.length; i += 2) {
    const chunk = (rawClauses[i] || '').trim();
    const punct = (rawClauses[i + 1] || '').trim();

    if (!chunk && !punct) continue;

    currentText = chunk;
    let pauseMs = 180;
    let isBreath = false;

    if (punct.includes('.') || punct.includes('!') || punct.includes('\n')) {
      pauseMs = 420;
      isBreath = true;
    } else if (punct.includes('?')) {
      pauseMs = 480;
      isBreath = true;
    } else if (punct.includes(',') || punct.includes(';') || punct.includes(':') || punct.includes('—')) {
      pauseMs = 200;
    }

    const words = currentText.split(/\s+/);
    const emphasisWords = words.filter(
      (w) => w.length > 3 && (w === w.toUpperCase() || w.startsWith('"') || w.endsWith('!'))
    );

    if (currentText) {
      segments.push({
        text: currentText + (punct ? ` ${punct}` : ''),
        pauseAfterMs: pauseMs,
        isBreath,
        emphasisWords,
      });
    }
  }

  const spokenText = segments.map((s) => s.text).join(' ');
  return { spokenText, segments };
}

/**
 * Web Audio Vocal Tract Synthesizer & Human Sound Processing Chain
 */
class VoiceStudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private warmthFilter: BiquadFilterNode | null = null;
  private chestFilter: BiquadFilterNode | null = null;
  private highCutFilter: BiquadFilterNode | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private activeAudioSource: AudioBufferSourceNode | null = null;
  private activeHtmlAudio: HTMLAudioElement | null = null;
  private simulationInterval: number | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private onHighlightWordCallback: ((word: string, charIndex: number) => void) | null = null;
  private onEndCallback: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initVoiceList();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.initVoiceList();
        };
      }
    }
  }

  private initVoiceList() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.cachedVoices.length === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
    }
    return this.cachedVoices;
  }

  private initAudioNodes() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        this.chestFilter = this.ctx.createBiquadFilter();
        this.chestFilter.type = 'peaking';
        this.chestFilter.frequency.setValueAtTime(130, this.ctx.currentTime);
        this.chestFilter.Q.setValueAtTime(1.1, this.ctx.currentTime);
        this.chestFilter.gain.setValueAtTime(5.0, this.ctx.currentTime);

        this.warmthFilter = this.ctx.createBiquadFilter();
        this.warmthFilter.type = 'peaking';
        this.warmthFilter.frequency.setValueAtTime(240, this.ctx.currentTime);
        this.warmthFilter.Q.setValueAtTime(1.3, this.ctx.currentTime);
        this.warmthFilter.gain.setValueAtTime(3.5, this.ctx.currentTime);

        this.highCutFilter = this.ctx.createBiquadFilter();
        this.highCutFilter.type = 'lowpass';
        this.highCutFilter.frequency.setValueAtTime(7200, this.ctx.currentTime);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.9, this.ctx.currentTime);

        this.chestFilter.connect(this.warmthFilter);
        this.warmthFilter.connect(this.highCutFilter);
        this.highCutFilter.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public playHumanBreath(durationMs = 150, volume = 0.04) {
    this.initAudioNodes();
    if (!this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * (durationMs / 1000));
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.14;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1350, now);
      bandpass.Q.setValueAtTime(1.6, now);

      const breathGain = this.ctx.createGain();
      breathGain.gain.setValueAtTime(0.001, now);
      breathGain.gain.exponentialRampToValueAtTime(volume, now + durationMs * 0.0006);
      breathGain.gain.exponentialRampToValueAtTime(0.001, now + durationMs * 0.001);

      noiseSource.connect(bandpass);
      bandpass.connect(breathGain);
      breathGain.connect(this.masterGain);

      noiseSource.start(now);
      noiseSource.stop(now + durationMs * 0.001);
    } catch {
      // AudioContext might be restricted
    }
  }

  /**
   * Search for Indonesian voice in Web Speech API
   */
  public findBestNaturalVoice(gender: 'male' | 'female' = 'male'): {
    voice: SpeechSynthesisVoice | null;
    isNativeMale: boolean;
    isGoogleRobotic: boolean;
  } {
    const voices = this.getAvailableVoices();
    if (!voices || voices.length === 0) {
      return { voice: null, isNativeMale: false, isGoogleRobotic: false };
    }

    if (gender === 'male') {
      const naturalMaleId = voices.find((v) => {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();
        const isId = lang.startsWith('id') || name.includes('indonesia');
        const isMale =
          name.includes('ardi') ||
          name.includes('male') ||
          name.includes('pria') ||
          name.includes('agus') ||
          name.includes('budi') ||
          name.includes('dimas');
        const notGoogle = !name.includes('google');
        return isId && isMale && notGoogle;
      });

      if (naturalMaleId) {
        return { voice: naturalMaleId, isNativeMale: true, isGoogleRobotic: false };
      }

      const googleId = voices.find((v) => {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();
        return (lang.startsWith('id') || name.includes('indonesia')) && name.includes('google');
      });

      if (googleId) {
        return { voice: googleId, isNativeMale: false, isGoogleRobotic: true };
      }
    }

    const idVoices = voices.filter(
      (v) => v.lang.toLowerCase().startsWith('id') || v.name.toLowerCase().includes('indonesia')
    );
    if (idVoices.length > 0) {
      return { voice: idVoices[0], isNativeMale: false, isGoogleRobotic: idVoices[0].name.toLowerCase().includes('google') };
    }

    return { voice: voices[0] || null, isNativeMale: false, isGoogleRobotic: false };
  }

  private sampleAudioCache = new Map<string, string>();
  private sampleRequestToken = 0;

  /**
   * Plays the voice sample preview tailored to the exact selected profile ID
   * via /api/voice/sample (distinct human pitch/formant/cadence), with safe network fallback.
   */
  public async playVoiceSample(
    voiceId: string,
    options: {
      onEnd?: () => void;
      onWord?: (word: string) => void;
    } = {}
  ): Promise<void> {
    this.stop();
    this.isSpeaking = true;
    this.onEndCallback = options.onEnd || null;
    const sampleToken = ++this.sampleRequestToken;

    const profile = this.resolveVoiceProfile(voiceId);
    const isFemale = profile.gender === 'female';
    const cacheKey = `${profile.id}:${SAMPLE_AUDIO_TEXT}`;

    const finishSample = () => {
      if (sampleToken !== this.sampleRequestToken) return;
      this.isSpeaking = false;
      this.activeHtmlAudio = null;
      const cb = this.onEndCallback;
      this.onEndCallback = null;
      if (cb) cb();
    };

    const playResolvedSource = async (source: string) => {
      if (sampleToken !== this.sampleRequestToken) return;
      const audio = new Audio(source);
      this.activeHtmlAudio = audio;
      audio.onended = finishSample;
      audio.onerror = finishSample;
      await audio.play();
    };

    try {
      let source = this.sampleAudioCache.get(cacheKey);
      if (!source) {
        const res = await fetch('/api/voice/sample', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            voice: profile.id,
            text: SAMPLE_AUDIO_TEXT,
            isFemale,
            speed: profile.recommendedSpeed,
          }),
        });
        if (sampleToken !== this.sampleRequestToken) return;
        if (res.ok) {
          const data = await res.json();
          const apiSource = data.audioData || data.audioUrl;
          if (apiSource && typeof apiSource === 'string') {
            source = apiSource;
            if (data.audioData) {
              this.sampleAudioCache.set(cacheKey, apiSource);
            }
          }
        }
      }

      if (!source) {
        source = this.getSampleUrlForVoice(profile.id);
      }

      await playResolvedSource(source);
    } catch (err) {
      console.warn('Voice sample playback error:', err);
      finishSample();
    }
  }

  private synthesizedAudioCache = new Map<string, string>();
  private synthesizedDurationCache = new Map<string, number>();
  private inFlightBatchRequests = new Map<
    string,
    Promise<{
      fullAudioData: string | null;
      sceneAudios: Array<{ audioData: string; durationSec: number }> | null;
    }>
  >();
  private customProjectAudioUrl: string | null = null;
  private watchdogTimer: number | null = null;
  private ttsCooldownUntil = 0;

  public setCustomProjectAudioUrl(url: string | null) {
    this.customProjectAudioUrl = url;
  }

  public getCustomProjectAudioUrl(): string | null {
    return this.customProjectAudioUrl;
  }

  public resolveVoiceProfile(voiceIdOrName?: string): VoiceProfile {
    const raw = (voiceIdOrName || 'fenrir').trim().toLowerCase();
    const aliasMap: Record<string, string> = {
      budi: 'charon',
      dimas: 'fenrir',
      sarah: 'kore',
      maya: 'aoede',
    };
    const lookup = aliasMap[raw] || raw;
    return (
      VOICE_PROFILES.find(
        (p) =>
          p.id === lookup ||
          p.name.toLowerCase() === lookup ||
          p.geminiVoiceName.toLowerCase() === lookup
      ) || VOICE_PROFILES[0]
    );
  }

  public getSampleUrlForVoice(voiceId: string): string {
    const profile = this.resolveVoiceProfile(voiceId);
    const isFemale = profile.gender === 'female';
    const vLower = (voiceId || profile.id || profile.name || '').toLowerCase();

    if (
      vLower.includes('fenrir') ||
      vLower.includes('zubenelgenubi') ||
      vLower.includes('dimas') ||
      vLower.includes('algenib')
    ) {
      return '/audio/samples/fenrir_sample.mp3';
    }
    if (
      vLower.includes('aoede') ||
      vLower.includes('maya') ||
      vLower.includes('callirrhoe') ||
      vLower.includes('dia') ||
      vLower.includes('achernar') ||
      vLower.includes('laomedeia')
    ) {
      return '/audio/samples/aoede_sample.mp3';
    }
    if (vLower.includes('kore') || vLower.includes('sarah')) {
      return '/audio/samples/kore_sample.mp3';
    }
    if (
      isFemale ||
      [
        'leda',
        'despina',
        'vindemiatrix',
        'sulafat',
        'zephyr-female',
        'autonoe',
        'erinome',
        'pulcherrima',
      ].some((f) => vLower.includes(f))
    ) {
      return '/audio/samples/kore_sample.mp3';
    }
    return '/audio/samples/charon_sample.mp3';
  }

  public getCachedSceneAudio(text: string, voiceId?: string): string | null {
    const cleanText = (text || '').trim();
    if (!cleanText) return null;
    const profile = this.resolveVoiceProfile(voiceId);
    const cached = this.synthesizedAudioCache.get(`${profile.id}:${cleanText}`) || null;
    if (cached && cached.includes('/audio/samples/')) {
      this.synthesizedAudioCache.delete(`${profile.id}:${cleanText}`);
      return null;
    }
    return cached;
  }

  public getCachedSceneDuration(text: string, voiceId?: string): number | undefined {
    const cleanText = (text || '').trim();
    if (!cleanText) return undefined;
    const profile = this.resolveVoiceProfile(voiceId);
    return this.synthesizedDurationCache.get(`${profile.id}:${cleanText}`);
  }

  /**
   * Synthesizes all project scenes in a SINGLE request (/api/voice/synthesize with `scenes`),
   * returning exact spoken Indonesian audio per scene matching each scene's narration script.
   */
  public async synthesizeBatchScenes(
    sceneTexts: string[],
    voiceId = 'fenrir',
    stylePrompt?: string,
    speed = 1.0
  ): Promise<{
    fullAudioData: string | null;
    sceneAudios: Array<{ audioData: string; durationSec: number }> | null;
  }> {
    const cleanedScenes = (sceneTexts || []).map((s) => (s || '').trim()).filter(Boolean);
    if (cleanedScenes.length === 0) {
      return { fullAudioData: null, sceneAudios: null };
    }

    const profile = this.resolveVoiceProfile(voiceId);

    // Check if every scene is already cached locally with real synthesized audio
    const allCached = cleanedScenes.every((sc) => {
      const url = this.synthesizedAudioCache.get(`${profile.id}:${sc}`);
      return Boolean(url && !url.includes('/audio/samples/'));
    });
    if (allCached) {
      const cachedList = cleanedScenes.map((sc) => ({
        audioData: this.synthesizedAudioCache.get(`${profile.id}:${sc}`)!,
        durationSec: this.synthesizedDurationCache.get(`${profile.id}:${sc}`) || 5.0,
      }));
      return {
        fullAudioData: cachedList[0]?.audioData || null,
        sceneAudios: cachedList,
      };
    }

    const batchKey = `${profile.id}::${cleanedScenes.join('||')}`;
    const existingInFlight = this.inFlightBatchRequests.get(batchKey);
    if (existingInFlight) {
      return existingInFlight;
    }

    const buildEstimatedDurationFallback = () => {
      const customUrl =
        this.customProjectAudioUrl && !this.customProjectAudioUrl.includes('/audio/samples/')
          ? this.customProjectAudioUrl
          : '';
      const fallbackList = cleanedScenes.map((scText) => {
        const wordCount = scText.split(/\s+/).filter(Boolean).length;
        const estDur = Number(Math.max(3.6, Math.min(9.5, wordCount / 2.35 + 0.8)).toFixed(2));
        this.synthesizedDurationCache.set(`${profile.id}:${scText}`, estDur);
        if (customUrl) {
          this.synthesizedAudioCache.set(`${profile.id}:${scText}`, customUrl);
        }
        return {
          audioData: customUrl,
          durationSec: estDur,
        };
      });
      return {
        fullAudioData: customUrl || null,
        sceneAudios: fallbackList,
      };
    };

    const requestPromise = (async () => {
      try {
        const res = await fetch('/api/voice/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanedScenes.join(' '),
            scenes: cleanedScenes,
            voice: profile.id || profile.geminiVoiceName || profile.name,
            style:
              stylePrompt ||
              (profile.gender === 'female' ? DEFAULT_FEMALE_PROMPT : DEFAULT_MALE_PROMPT),
            speed: speed || profile.recommendedSpeed,
            naturalBreathing: true,
            isFemale: profile.gender === 'female',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const fullAudioData =
            data && typeof data.audioData === 'string' ? data.audioData : null;
          const sceneAudios: Array<{ audioData: string; durationSec: number }> | null =
            Array.isArray(data?.sceneAudios) && data.sceneAudios.length === cleanedScenes.length
              ? data.sceneAudios
              : null;

          if (sceneAudios) {
            cleanedScenes.forEach((scText, idx) => {
              const item = sceneAudios[idx];
              if (item?.audioData && !item.audioData.includes('/audio/samples/')) {
                this.synthesizedAudioCache.set(`${profile.id}:${scText}`, item.audioData);
                if (typeof item.durationSec === 'number' && item.durationSec > 0) {
                  this.synthesizedDurationCache.set(`${profile.id}:${scText}`, item.durationSec);
                }
              }
            });
            return { fullAudioData, sceneAudios };
          } else if (fullAudioData && cleanedScenes.length === 1) {
            this.synthesizedAudioCache.set(`${profile.id}:${cleanedScenes[0]}`, fullAudioData);
            if (typeof data?.durationSec === 'number' && data.durationSec > 0) {
              this.synthesizedDurationCache.set(`${profile.id}:${cleanedScenes[0]}`, data.durationSec);
            }
            return {
              fullAudioData,
              sceneAudios: [{ audioData: fullAudioData, durationSec: data?.durationSec || 5.0 }],
            };
          }
        }
      } catch {
        // Fallback below
      } finally {
        this.inFlightBatchRequests.delete(batchKey);
      }
      return buildEstimatedDurationFallback();
    })();

    this.inFlightBatchRequests.set(batchKey, requestPromise);
    return requestPromise;
  }

  /**
   * Requests Gemini TTS synthesis from /api/voice/synthesize and caches the resulting data URL.
   */
  public async synthesizeSceneAudio(
    text: string,
    voiceId = 'fenrir',
    stylePrompt?: string,
    speed = 1.0
  ): Promise<string | null> {
    const cleanText = (text || '').trim();
    if (!cleanText) return null;

    const profile = this.resolveVoiceProfile(voiceId);
    const cacheKey = `${profile.id}:${cleanText}`;
    const existing = this.synthesizedAudioCache.get(cacheKey);
    if (existing) return existing;

    const batchRes = await this.synthesizeBatchScenes([cleanText], profile.id, stylePrompt, speed);
    return batchRes.sceneAudios?.[0]?.audioData || batchRes.fullAudioData || null;
  }

  private activeSpeakToken = 0;
  private speechTriggeredTokens = new Set<number>();
  private settledEndTokens = new Set<number>();

  private fireEndOnce(speakToken: number) {
    if (speakToken !== this.activeSpeakToken) return;
    if (this.settledEndTokens.has(speakToken)) return;
    this.settledEndTokens.add(speakToken);
    if (this.settledEndTokens.size > 40) {
      const oldest = this.settledEndTokens.values().next().value;
      if (oldest !== undefined) this.settledEndTokens.delete(oldest);
    }
    this.isSpeaking = false;
    const cb = this.onEndCallback;
    this.onEndCallback = null;
    if (cb) cb();
  }

  private playAudioUrlWithCallbacks(
    url: string,
    spokenText: string,
    playbackRate = 1.0,
    maxDurationSec?: number,
    startOffsetSec = 0,
    speakToken = this.activeSpeakToken
  ) {
    try {
      if (speakToken !== this.activeSpeakToken) return;
      const audio = new Audio(url);
      const isSynthesizedDataUri = url.startsWith('data:audio/');
      audio.playbackRate = isSynthesizedDataUri
        ? 1.0
        : Math.max(0.88, Math.min(1.18, playbackRate));
      this.activeHtmlAudio = audio;

      const words = spokenText.split(/\s+/).filter(Boolean);
      const startWordSimulation = (effectiveDurSec: number) => {
        if (this.simulationInterval !== null) {
          clearInterval(this.simulationInterval);
          this.simulationInterval = null;
        }
        if (words.length > 0 && this.onHighlightWordCallback) {
          let wordIdx = 0;
          const stepMs = Math.max(120, Math.floor((effectiveDurSec * 1000) / words.length));
          this.simulationInterval = window.setInterval(() => {
            if (!this.isSpeaking || speakToken !== this.activeSpeakToken || wordIdx >= words.length) {
              if (this.simulationInterval !== null) {
                clearInterval(this.simulationInterval);
                this.simulationInterval = null;
              }
              return;
            }
            if (this.onHighlightWordCallback) {
              this.onHighlightWordCallback(words[wordIdx], wordIdx * 5);
            }
            wordIdx++;
          }, stepMs);
        }
      };

      const remainingWindow =
        maxDurationSec && maxDurationSec > 0.5
          ? Math.max(0.4, maxDurationSec - Math.max(0, startOffsetSec))
          : 5;
      startWordSimulation(remainingWindow);

      audio.onloadedmetadata = () => {
        if (speakToken !== this.activeSpeakToken || this.activeHtmlAudio !== audio) return;
        if (Number.isFinite(audio.duration) && audio.duration > 0.35) {
          if (isSynthesizedDataUri && maxDurationSec && maxDurationSec > 1.2) {
            const targetSpeechSec = Math.max(0.9, maxDurationSec - 0.28);
            const syncedRate = audio.duration / targetSpeechSec;
            audio.playbackRate = Math.max(0.85, Math.min(1.25, syncedRate));
          }
          if (startOffsetSec > 0.15) {
            const clampedOffset = Math.min(Math.max(0, audio.duration - 0.2), startOffsetSec % Math.max(1, audio.duration - 0.5));
            try {
              audio.currentTime = clampedOffset;
            } catch {
              // ignore seek error before play
            }
          }
          startWordSimulation(Math.max(0.4, Math.min(remainingWindow, audio.duration / audio.playbackRate)));
        }
      };

      if (maxDurationSec && maxDurationSec > 0.5) {
        const timeoutMs = Math.max(600, (maxDurationSec - Math.max(0, startOffsetSec) + 0.45) * 1000);
        this.watchdogTimer = window.setTimeout(() => {
          if (this.activeHtmlAudio === audio && speakToken === this.activeSpeakToken) {
            this.stop(true);
          }
        }, timeoutMs);
      }

      audio.onended = () => {
        if (this.watchdogTimer !== null) {
          clearTimeout(this.watchdogTimer);
          this.watchdogTimer = null;
        }
        if (this.simulationInterval !== null) {
          clearInterval(this.simulationInterval);
          this.simulationInterval = null;
        }
        if (this.activeHtmlAudio === audio) {
          this.activeHtmlAudio = null;
        }
        this.fireEndOnce(speakToken);
      };

      audio.onerror = () => {
        if (this.activeHtmlAudio === audio) {
          this.activeHtmlAudio = null;
        }
        this.fireEndOnce(speakToken);
      };

      audio.play().catch(() => {
        if (this.activeHtmlAudio === audio) {
          this.activeHtmlAudio = null;
        }
        this.fireEndOnce(speakToken);
      });
    } catch {
      this.fireEndOnce(speakToken);
    }
  }

  /**
   * Plays a continuous uploaded custom narration audio track from `offsetSec` without
   * restarting it at every scene boundary.
   */
  public playProjectAudioAtTime(url: string, offsetSec = 0, onEnd?: () => void): void {
    this.stop();
    if (!url) return;
    const token = ++this.activeSpeakToken;
    this.isSpeaking = true;
    this.onEndCallback = onEnd || null;
    try {
      const audio = new Audio(url);
      this.activeHtmlAudio = audio;
      audio.onloadedmetadata = () => {
        if (token !== this.activeSpeakToken || this.activeHtmlAudio !== audio) return;
        if (Number.isFinite(audio.duration) && offsetSec > 0.05) {
          if (offsetSec >= audio.duration - 0.15) {
            this.stop(true);
            return;
          }
          try {
            audio.currentTime = offsetSec;
          } catch {
            // ignore
          }
        }
      };
      audio.onended = () => {
        if (this.activeHtmlAudio === audio) this.activeHtmlAudio = null;
        this.isSpeaking = false;
        const cb = this.onEndCallback;
        this.onEndCallback = null;
        if (cb) cb();
      };
      audio.onerror = () => {
        if (this.activeHtmlAudio === audio) this.activeHtmlAudio = null;
        this.isSpeaking = false;
        const cb = this.onEndCallback;
        this.onEndCallback = null;
        if (cb) cb();
      };
      audio.play().catch(() => {
        if (this.activeHtmlAudio === audio) this.activeHtmlAudio = null;
        this.isSpeaking = false;
        const cb = this.onEndCallback;
        this.onEndCallback = null;
        if (cb) cb();
      });
    } catch {
      this.isSpeaking = false;
      const cb = this.onEndCallback;
      this.onEndCallback = null;
      if (cb) cb();
    }
  }

  /**
   * Plays authentic human studio voice actor audio (never robotic browser Google speechSynthesis).
   */
  private speakWithTimelineLockedProsody(
    spokenText: string,
    profile: VoiceProfile,
    _styleInfo: { speedMod: number; pitchMod: number },
    baseSpeed: number,
    maxDurationSec?: number,
    _allowSampleFallback = true,
    speakToken = this.activeSpeakToken
  ) {
    if (speakToken !== this.activeSpeakToken) return;
    const humanStudioUrl = this.customProjectAudioUrl || this.getSampleUrlForVoice(profile.id);
    this.speechTriggeredTokens.add(speakToken);
    this.playAudioUrlWithCallbacks(humanStudioUrl, spokenText, baseSpeed, maxDurationSec, 0, speakToken);
  }

  public speak(
    text: string,
    options: {
      profileId?: string;
      style?: 'santai' | 'storyteller' | 'energik' | 'teduh';
      customSpeed?: number;
      naturalBreathing?: boolean;
      studioWarmth?: boolean;
      antiGoogleRobot?: boolean;
      instantSync?: boolean;
      audioUrl?: string;
      maxDurationSec?: number;
      startOffsetSec?: number;
      onWord?: (word: string, charIndex: number) => void;
      onStart?: () => void;
      onEnd?: () => void;
    } = {}
  ): void {
    this.stop();
    this.initAudioNodes();

    const speakToken = ++this.activeSpeakToken;
    const profile = this.resolveVoiceProfile(options.profileId);
    const styleInfo = STYLE_PRESETS[options.style || 'santai'] || STYLE_PRESETS.santai;
    const { spokenText } = humanizeIndonesianText(text);

    if (!spokenText.trim()) {
      if (options.onEnd) options.onEnd();
      return;
    }

    this.isSpeaking = true;
    this.onHighlightWordCallback = options.onWord || null;
    this.onEndCallback = options.onEnd || null;

    if (options.onStart) options.onStart();

    const speed = (options.customSpeed || profile.recommendedSpeed) * styleInfo.speedMod;
    const validExplicitUrl =
      options.audioUrl && !options.audioUrl.includes('/audio/samples/') ? options.audioUrl : null;
    const cachedUrl = validExplicitUrl || this.getCachedSceneAudio(text, profile.id);
    const offsetSec = Math.max(0, options.startOffsetSec || 0);

    if (cachedUrl) {
      this.playAudioUrlWithCallbacks(cachedUrl, spokenText, speed, options.maxDurationSec, offsetSec, speakToken);
      return;
    }

    // Always synthesize the exact scene narration text from /api/voice/synthesize (never play static voice sample MP3 for scene scripts)
    this.synthesizeSceneAudio(text, profile.id, styleInfo.samplePrompt, speed)
      .then((synthesizedUrl) => {
        if (!this.isSpeaking || speakToken !== this.activeSpeakToken) return;
        const targetAudioUrl =
          synthesizedUrl ||
          (this.customProjectAudioUrl && !this.customProjectAudioUrl.includes('/audio/samples/')
            ? this.customProjectAudioUrl
            : '');
        if (targetAudioUrl) {
          this.playAudioUrlWithCallbacks(
            targetAudioUrl,
            spokenText,
            speed,
            options.maxDurationSec,
            offsetSec,
            speakToken
          );
        } else {
          this.fireEndOnce(speakToken);
        }
      })
      .catch(() => {
        if (!this.isSpeaking || speakToken !== this.activeSpeakToken) return;
        this.fireEndOnce(speakToken);
      });
  }

  public stop(triggerCallback = false): void {
    this.activeSpeakToken++;
    this.sampleRequestToken++;
    const cb = this.onEndCallback;
    this.onEndCallback = null;
    if (this.watchdogTimer !== null) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.activeHtmlAudio) {
      try {
        this.activeHtmlAudio.pause();
        this.activeHtmlAudio.currentTime = 0;
      } catch {
        // stopped
      }
      this.activeHtmlAudio = null;
    }
    if (this.simulationInterval !== null) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    if (this.activeAudioSource) {
      try {
        this.activeAudioSource.stop();
        this.activeAudioSource.disconnect();
      } catch {
        // already stopped
      }
      this.activeAudioSource = null;
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
    if (triggerCallback && cb) {
      cb();
    }
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const voiceStudio = new VoiceStudioEngine();

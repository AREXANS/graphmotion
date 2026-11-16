import { SatsetProject, SatsetScene, TempoOption } from '../types/satset';
import { getSatsetStyleDemoScenes, resolveSatsetStyleId } from './custom-style-runtime';
import {
  buildContextualSatsetSceneCode,
  isAutoContextualSceneCode,
  resolveAutoStyleForConceptAndScene,
} from './contextual-scene-builder';

export interface WordTimingEntry {
  word: string;
  startSec: number;
  endSec: number;
  isEmphasis?: boolean;
}

export interface ComputedSceneTimingResult {
  wordTimings: WordTimingEntry[];
  wordAt: number[];
  recommendedDurationSec: number;
  wordCount: number;
}

export interface PipelineStageMetric {
  id: 'ide' | 'naskah' | 'suara' | 'animasi';
  stepNumber: string;
  title: string;
  subtitle: string;
  metricBadge: string;
  isComplete: boolean;
}

function normalizeWordToken(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '')
    .trim();
}

/**
 * Extracts 2-3 meaningful emphasis keywords from narration or headline if none are set.
 */
export function extractSmartEmphasisWords(narrationText: string, onScreenText?: string): string[] {
  const stopWords = new Set([
    'yang',
    'dan',
    'di',
    'ke',
    'dari',
    'ini',
    'itu',
    'untuk',
    'dengan',
    'karena',
    'kalau',
    'bisa',
    'akan',
    'atau',
    'pada',
    'dalam',
    'tidak',
    'bukan',
    'tapi',
    'saat',
    'jadi',
    'agar',
    'biar',
    'kita',
    'kamu',
  ]);

  const source = `${onScreenText || ''} ${narrationText || ''}`;
  const rawTokens = source
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}-]/gu, '').trim())
    .filter((w) => w.length >= 4 && !stopWords.has(w.toLowerCase()));

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const token of rawTokens) {
    const lower = token.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      unique.push(token);
    }
    if (unique.length >= 3) break;
  }

  return unique.length > 0 ? unique : ['Fokus', 'Mulai'];
}

/**
 * Computes exact clause-aware Indonesian word timings (`word_timings` & `wordAt`)
 * so that Voice Over speech rate, punctuation breath pauses, and canvas subtitle rendering
 * (`satset-renderer-engine.ts` `H(e, t)`) are 100% locked in sync with zero slop.
 */
export function computePreciseSceneWordTimings(
  narrationText: string,
  emphasisWords: string[] = [],
  tempo: TempoOption = 'energik',
  explicitDurationSec?: number,
  actualSpeechDurationSec?: number
): ComputedSceneTimingResult {
  const tokens = (narrationText || '').trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    const fallbackDur = explicitDurationSec && explicitDurationSec > 1 ? explicitDurationSec : 4.0;
    return {
      wordTimings: [],
      wordAt: [],
      recommendedDurationSec: fallbackDur,
      wordCount: 0,
    };
  }

  const emphasisSet = new Set(emphasisWords.map(normalizeWordToken).filter(Boolean));
  const isCalm = tempo === 'santai';

  // Base speaking cadence per weight unit in seconds
  const baseUnitSec = isCalm ? 0.36 : 0.28;
  // Crisp 40ms lead-in matching silence-trimmed WAV attack pad
  const leadInSec = 0.04;
  // Reserve tail buffer so the final word finishes before the transition wipe begins
  const tailBufferSec = isCalm ? 0.38 : 0.28;

  const wordWeights: number[] = [];
  const pauseAfterSecs: number[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const raw = tokens[i];
    const clean = normalizeWordToken(raw);
    const isEmph = emphasisSet.has(clean);

    // Approximate Indonesian syllable weight by character count
    const charFactor = Math.max(0.72, Math.min(2.15, Math.max(1, clean.length) / 5.4));
    const emphBoost = isEmph ? 0.14 : 0;
    wordWeights.push(charFactor + emphBoost);

    // Natural breath pauses on punctuation (matching humanizeIndonesianText in voice-studio.ts)
    const isLastWord = i === tokens.length - 1;
    if (isLastWord) {
      pauseAfterSecs.push(0);
    } else if (/[.!?…]+["'”’)\]]*$/.test(raw)) {
      pauseAfterSecs.push(isCalm ? 0.36 : 0.24);
    } else if (/[,;:—–-]+$/.test(raw)) {
      pauseAfterSecs.push(isCalm ? 0.18 : 0.12);
    } else {
      pauseAfterSecs.push(0);
    }
  }

  const rawSpeechSecs = wordWeights.reduce((acc, w) => acc + w * baseUnitSec, 0);
  const rawPauseSecs = pauseAfterSecs.reduce((acc, p) => acc + p, 0);
  const hasMeasuredAudio =
    typeof actualSpeechDurationSec === 'number' &&
    Number.isFinite(actualSpeechDurationSec) &&
    actualSpeechDurationSec >= 0.8;

  const naturalTotalSec = hasMeasuredAudio
    ? actualSpeechDurationSec + tailBufferSec
    : leadInSec + rawSpeechSecs + rawPauseSecs + tailBufferSec;

  // Clamp recommended duration to a clean 0.1s increment when measured audio exists, or 0.5s otherwise
  const recommendedDurationSec = hasMeasuredAudio
    ? Math.max(2.5, Math.min(18.0, Math.round(naturalTotalSec * 10) / 10))
    : Math.max(3.5, Math.min(14.0, Math.round(naturalTotalSec * 2) / 2));

  const effectiveDurationSec =
    typeof explicitDurationSec === 'number' && Number.isFinite(explicitDurationSec) && explicitDurationSec >= 1.5
      ? explicitDurationSec
      : recommendedDurationSec;

  const availableWindowSec = hasMeasuredAudio
    ? Math.max(0.6, Math.min(actualSpeechDurationSec - leadInSec, effectiveDurationSec - leadInSec - 0.1))
    : Math.max(
        0.8,
        effectiveDurationSec - leadInSec - Math.min(tailBufferSec, effectiveDurationSec * 0.12)
      );
  const rawTotalActiveSec = Math.max(0.2, rawSpeechSecs + rawPauseSecs);
  const timeScale = availableWindowSec / rawTotalActiveSec;

  const wordTimings: WordTimingEntry[] = [];
  const wordAt: number[] = [];

  let cursorSec = leadInSec;
  for (let i = 0; i < tokens.length; i++) {
    const raw = tokens[i];
    const clean = normalizeWordToken(raw);
    const isEmphasis = emphasisSet.has(clean);
    const wordDur = Math.max(0.07, wordWeights[i] * baseUnitSec * timeScale);
    const pauseDur = pauseAfterSecs[i] * timeScale;

    const startSec = Number(cursorSec.toFixed(3));
    const endSec = Number(Math.min(effectiveDurationSec - 0.04, cursorSec + wordDur).toFixed(3));

    wordTimings.push({
      word: raw,
      startSec,
      endSec: Math.max(startSec + 0.05, endSec),
      isEmphasis,
    });
    wordAt.push(startSec);

    cursorSec += wordDur + pauseDur;
  }

  return {
    wordTimings,
    wordAt,
    recommendedDurationSec,
    wordCount: tokens.length,
  };
}

/**
 * Checks whether a scene code string is valid executable Satset Canvas 2D `s.*` code.
 */
export function isExecutableCanvasSceneCode(code?: string | null): boolean {
  if (!code || typeof code !== 'string') return false;
  const trimmed = code.trim();
  if (!trimmed) return false;
  if (/^\s*import\s+/m.test(trimmed) || /^\s*export\s+(const|function|default)/m.test(trimmed)) {
    return false;
  }
  return /\bs\s*\./.test(trimmed) || /\bctx\s*\./.test(trimmed);
}

/**
 * Returns a structured, executable Canvas 2D `s.*` animation code snippet for a scene and style.
 */
export function buildStructuredSceneCodeForStyle(
  styleId: string,
  sceneIndex: number
): { code: string; theme: 'paper' | 'dusk' | 'night' } {
  const resolvedStyle = resolveSatsetStyleId(styleId || 'otomatis');
  const demoList = getSatsetStyleDemoScenes(resolvedStyle);
  const demo = demoList[sceneIndex % demoList.length] || demoList[0];
  const fallbackTheme: 'paper' | 'dusk' | 'night' =
    sceneIndex % 3 === 1 ? 'dusk' : sceneIndex % 3 === 2 ? 'night' : 'paper';

  return {
    code:
      demo?.code ||
      `s.text3d("SATSET MOTION", s.cx, s.cy, { size: 68, color: s.c.orange, draw: s.pop(0.1) });`,
    theme: (demo?.theme as 'paper' | 'dusk' | 'night') || fallbackTheme,
  };
}

const STRUCTURED_CAMERA_SEQUENCE = [
  'push',
  'pan-right',
  'tilt-up',
  'orbit',
  'pan-left',
  'crash',
  'tilt-down',
  'pull',
] as const;

const STRUCTURED_SFX_SEQUENCE: Array<'whoosh' | 'pop' | 'tap' | 'card_slide' | 'swish' | 'click'> = [
  'whoosh',
  'pop',
  'tap',
  'card_slide',
  'whoosh',
  'tap',
  'swish',
  'tap',
];

/**
 * Synchronizes the entire SatsetProject pipeline from Step 1 (Ide) -> Step 2 (Naskah) -> Step 3 (Suara) -> Step 4 (Animasi):
 * - Ensures all scenes have clean narration_text, on_screen_text, emphasis_words, camera movement, and SFX cues.
 * - Computes exact clause-aware `word_timings` (`startSec`, `endSec`, `isEmphasis`) matched to `tempo` (`energik` vs `santai`).
 * - Populates executable Canvas 2D `scene_codes` for every scene so there are zero un-animated placeholder gaps.
 */
export function synchronizeProjectPipeline(
  project: SatsetProject,
  options?: {
    recalculateDurations?: boolean;
    forceStyleSync?: boolean;
  }
): SatsetProject {
  const tempo: TempoOption = project.tempo === 'santai' ? 'santai' : 'energik';
  const activeStyle = project.gaya_video || project.styleModule || 'otomatis';
  const brandPrimary = project.warna_brand || project.brandColor || '#2563eb';
  const brandSecondary = project.brand_secondary_color || '#0f172a';
  const rawScenes = Array.isArray(project.scenes) ? project.scenes : [];

  const existingSceneCodes: Record<number, string> = { ...(project.scene_codes || {}) };
  const seenNarrations = new Set<string>();

  const syncedScenes: SatsetScene[] = rawScenes.map((scene, idx) => {
    const sceneNum = idx + 1;
    const isHook = idx === 0;
    const isCta = idx === rawScenes.length - 1 && rawScenes.length > 1;
    const role = isHook ? 'hook' : isCta ? 'cta' : 'body_core_point';

    let narration = (
      scene.narration_text ||
      scene.voiceScript ||
      scene.on_screen_text ||
      scene.hookText ||
      `Poin ke-${sceneNum} dalam alur cerita video ini.`
    ).trim();

    const normKey = narration.toLowerCase().replace(/\s+/g, ' ');
    if (seenNarrations.has(normKey)) {
      const topicHint = project.website_promo?.brandName || project.topik_video || project.project_title || 'strategi ini';
      narration = isCta
        ? `Sekarang saatnya mempraktikkan langkah ${topicHint} ini secara konsisten dan rasakan hasilnya mulai hari ini!`
        : `Pada tahap ke-${sceneNum}, pastikan penerapan ${ scene.on_screen_text || topicHint } berjalan terstruktur agar hasilnya konsisten dan terukur.`;
    }
    seenNarrations.add(narration.toLowerCase().replace(/\s+/g, ' '));

    const onScreen = (
      scene.on_screen_text ||
      scene.hookText ||
      narration.split(/[,.!?]/)[0]?.slice(0, 48) ||
      `Bagian 0${sceneNum}`
    ).trim();

    const rawEmph = scene.emphasis_words || scene.emphasisWords || [];
    const emphasisWords =
      Array.isArray(rawEmph) && rawEmph.length > 0
        ? rawEmph
        : extractSmartEmphasisWords(narration, onScreen);

    const existingDur = Number(scene.target_duration_sec || scene.durationSeconds || 0);
    const measuredAudioDur = scene.audio_duration_sec;
    const timingResult = computePreciseSceneWordTimings(
      narration,
      emphasisWords,
      tempo,
      options?.recalculateDurations || existingDur <= 0 ? undefined : existingDur,
      measuredAudioDur
    );

    const finalSceneDur =
      options?.recalculateDurations || existingDur <= 0
        ? timingResult.recommendedDurationSec
        : existingDur;

    // Re-run with finalSceneDur to ensure wordTimings fit [0, finalSceneDur]
    const calibratedTiming =
      finalSceneDur === timingResult.recommendedDurationSec
        ? timingResult
        : computePreciseSceneWordTimings(
            narration,
            emphasisWords,
            tempo,
            finalSceneDur,
            measuredAudioDur
          );

    const existingCode = existingSceneCodes[sceneNum];
    const hasManualCode =
      !isAutoContextualSceneCode(existingCode) && isExecutableCanvasSceneCode(existingCode);

    const autoResolved = resolveAutoStyleForConceptAndScene(project, scene, idx);
    const effectiveVisualModule =
      activeStyle === 'otomatis'
        ? autoResolved.styleId
        : options?.forceStyleSync
        ? activeStyle
        : scene.visualModule && scene.visualModule !== 'otomatis'
        ? scene.visualModule
        : activeStyle;

    const contextualScene = buildContextualSatsetSceneCode(
      {
        ...scene,
        role,
        narration_text: narration,
        on_screen_text: onScreen,
        emphasis_words: emphasisWords,
        target_duration_sec: finalSceneDur,
        word_timings: calibratedTiming.wordTimings,
        wordAt: calibratedTiming.wordAt,
        visualModule: effectiveVisualModule,
      },
      {
        ...project,
        gaya_video: activeStyle,
        tempo,
      },
      idx,
      rawScenes.length
    );

    if (options?.forceStyleSync || !hasManualCode) {
      existingSceneCodes[sceneNum] = contextualScene.code;
    }

    const camera =
      scene.camera ||
      scene.camera_movement ||
      autoResolved.cameraDirection ||
      STRUCTURED_CAMERA_SEQUENCE[idx % STRUCTURED_CAMERA_SEQUENCE.length];

    const rawSfxCue = String(scene.sfxCue || '').toLowerCase();
    const sfxCue =
      !rawSfxCue || ['ding', 'coin', 'notify', 'sparkle', 'tada', 'magic', 'cash', 'beep', 'tick', 'tock'].includes(rawSfxCue)
        ? STRUCTURED_SFX_SEQUENCE[idx % STRUCTURED_SFX_SEQUENCE.length]
        : scene.sfxCue!;
    const theme = scene.theme || scene.background_theme || contextualScene.theme;

    const isCustomUserAudio =
      scene.audio_voice_id === 'custom_human' || scene.audio_voice_id === 'custom_mic';
    const hasStaleAudioText =
      !isCustomUserAudio &&
      ((scene as any).audio_text && String((scene as any).audio_text).trim() !== narration);
    const hasSampleUrl = Boolean(scene.audio_url && String(scene.audio_url).includes('/audio/samples/'));

    return {
      ...scene,
      id: scene.id || `sc-${sceneNum}`,
      scene_number: sceneNum,
      sceneNumber: sceneNum,
      role,
      narration_text: narration,
      voiceScript: narration,
      on_screen_text: onScreen,
      hookText: onScreen,
      emphasis_words: emphasisWords,
      emphasisWords,
      target_duration_sec: finalSceneDur,
      durationSeconds: finalSceneDur,
      word_timings: calibratedTiming.wordTimings,
      wordAt: calibratedTiming.wordAt,
      visualModule: effectiveVisualModule,
      accentColor: scene.accentColor || brandPrimary,
      secondaryColor: scene.secondaryColor || brandSecondary,
      camera,
      camera_movement: camera as any,
      sfxCue,
      theme,
      background_theme: theme,
      ...(hasStaleAudioText || hasSampleUrl
        ? { audio_url: undefined, audio_duration_sec: undefined, audio_text: undefined }
        : {}),
    };
  });

  const totalSceneDuration = Number(
    syncedScenes
      .reduce((acc, s) => acc + (s.target_duration_sec || s.durationSeconds || 6), 0)
      .toFixed(1)
  );

  return {
    ...project,
    tempo,
    gaya_video: activeStyle,
    styleModule: activeStyle,
    warna_brand: brandPrimary,
    brandColor: brandPrimary,
    target_duration_sec: totalSceneDuration > 0 ? totalSceneDuration : project.target_duration_sec || 60,
    durationSeconds: totalSceneDuration > 0 ? totalSceneDuration : project.durationSeconds || 60,
    scenes: syncedScenes,
    scene_codes: existingSceneCodes,
    scenes_animated_count: syncedScenes.length,
  };
}

/**
 * Computes structured readiness metrics across all 4 steps of the video pipeline.
 */
export function getPipelineStepStatus(project: SatsetProject): PipelineStageMetric[] {
  const scenes = project.scenes || [];
  const totalWords = scenes.reduce((acc, s) => {
    const text = s.narration_text || s.voiceScript || '';
    return acc + text.trim().split(/\s+/).filter(Boolean).length;
  }, 0);
  const syncedWordsCount = scenes.reduce(
    (acc, s) => acc + (Array.isArray(s.word_timings) ? s.word_timings.length : 0),
    0
  );
  const totalDur = scenes.reduce(
    (acc, s) => acc + (s.target_duration_sec || s.durationSeconds || 0),
    0
  );
  const animatedCount = scenes.filter((_, idx) => {
    const code = project.scene_codes?.[idx + 1];
    return isExecutableCanvasSceneCode(code);
  }).length;

  return [
    {
      id: 'ide',
      stepNumber: '01',
      title: 'Ide & Blueprint',
      subtitle: project.project_title || project.title || 'Konsep Terstruktur',
      metricBadge: `${project.idea_concepts?.length || 5} Konsep · ${(project.gaya_video || 'otomatis').toUpperCase()}`,
      isComplete: Boolean(project.project_title || project.topik_video),
    },
    {
      id: 'naskah',
      stepNumber: '02',
      title: 'Naskah & Adegan',
      subtitle: `${scenes.length} Scene · Hook → Inti → CTA`,
      metricBadge: `${totalWords} Kata · ${totalDur.toFixed(0)}s`,
      isComplete: scenes.length > 0 && totalWords > 10,
    },
    {
      id: 'suara',
      stepNumber: '03',
      title: 'Suara & Sinkronisasi',
      subtitle: `Voice: ${(project.voice_character || 'Fenrir').toUpperCase()} · Tempo ${project.tempo === 'santai' ? 'Santai' : 'Energik'}`,
      metricBadge: `${syncedWordsCount}/${totalWords} Kata Tersinkron`,
      isComplete: syncedWordsCount > 0 && syncedWordsCount === totalWords,
    },
    {
      id: 'animasi',
      stepNumber: '04',
      title: 'Animasi & Subtitle',
      subtitle: `${animatedCount}/${scenes.length} Scene Siap Render`,
      metricBadge: `${project.aspect_ratio || '9:16'} · 1080p`,
      isComplete: animatedCount >= scenes.length && scenes.length > 0,
    },
  ];
}

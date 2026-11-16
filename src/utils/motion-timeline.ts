/**
 * Pure timeline calculations, easing math, and timecode formatting
 * for Kiteva Motion Graphics Agent.
 */

export interface StoryboardChapter {
  id: string;
  title: string;
  titleZh?: string;
  durationMs: number;
  transitionType?: 'crossfade' | 'zoomPunch' | 'whipPan' | 'glitch' | 'lightFlash' | 'iris';
  motionGraphicType: string;
  visualNotes: string;
  script: string;
  accentColor: string;
  secondaryColor: string;
  customCode?: string;
  sfxCue?: 'whoosh' | 'glitch' | 'subdrop' | 'riser' | 'chime';
}

export interface AudioSfxEvent {
  timestampMs: number;
  type: 'whoosh' | 'glitch' | 'subdrop' | 'riser' | 'chime';
  chapterId: string;
  volume: number;
}

export type EasingType = 'linear' | 'easeOutQuad' | 'easeInOutCubic' | 'expoOut' | 'elasticOut' | 'backOut';

/**
 * Standard easing functions used across 2D/3D procedural motion rendering.
 */
export function getEase(type: EasingType, t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  switch (type) {
    case 'linear':
      return clamped;
    case 'easeOutQuad':
      return clamped * (2 - clamped);
    case 'easeInOutCubic':
      return clamped < 0.5
        ? 4 * clamped * clamped * clamped
        : (clamped - 1) * (2 * clamped - 2) * (2 * clamped - 2) + 1;
    case 'expoOut':
      return clamped === 1 ? 1 : 1 - Math.pow(2, -10 * clamped);
    case 'backOut': {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(clamped - 1, 3) + c1 * Math.pow(clamped - 1, 2);
    }
    case 'elasticOut': {
      if (clamped === 0) return 0;
      if (clamped === 1) return 1;
      return Math.pow(2, -10 * clamped) * Math.sin((clamped * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
    }
    default:
      return clamped;
  }
}

/**
 * Finds the active chapter index, local elapsed time within that chapter, and progress (0..1).
 */
export function calculateChapterAtTime(timeMs: number, chapters: { durationMs: number }[]) {
  if (!chapters || chapters.length === 0) {
    return {
      index: -1,
      localTimeMs: 0,
      progress: 0,
      chapterStartTimeMs: 0,
      isLastChapter: false,
    };
  }

  const totalDurationMs = chapters.reduce((sum, ch) => sum + ch.durationMs, 0);
  const clampedTime = Math.max(0, Math.min(timeMs, totalDurationMs));

  let accumulated = 0;
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const nextAccumulated = accumulated + chapter.durationMs;

    // Last chapter or time falls within bounds
    if (clampedTime < nextAccumulated || i === chapters.length - 1) {
      const localTimeMs = clampedTime - accumulated;
      const progress = chapter.durationMs > 0 ? Math.min(1, Math.max(0, localTimeMs / chapter.durationMs)) : 1;
      return {
        index: i,
        localTimeMs,
        progress,
        chapterStartTimeMs: accumulated,
        isLastChapter: i === chapters.length - 1,
      };
    }
    accumulated = nextAccumulated;
  }

  return {
    index: chapters.length - 1,
    localTimeMs: chapters[chapters.length - 1].durationMs,
    progress: 1,
    chapterStartTimeMs: accumulated - chapters[chapters.length - 1].durationMs,
    isLastChapter: true,
  };
}

/**
 * Clamps timeline seek position to valid range [0, totalDurationMs].
 */
export function clampTime(timeMs: number, totalDurationMs: number): number {
  if (totalDurationMs <= 0) return 0;
  return Math.max(0, Math.min(timeMs, totalDurationMs));
}

/**
 * Formats milliseconds into SMPTE-style timecode MM:SS:FF.
 */
export function formatTimecode(timeMs: number, fps = 30): string {
  const totalSeconds = Math.max(0, timeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const frames = Math.floor((totalSeconds - Math.floor(totalSeconds)) * fps);

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const ff = String(frames).padStart(2, '0');

  return `${mm}:${ss}:${ff}`;
}

/**
 * Generates audio sound effects (SFX) cue events based on chapter transitions and cues.
 */
export function generateAudioSfxSchedule(chapters: StoryboardChapter[]): AudioSfxEvent[] {
  const events: AudioSfxEvent[] = [];
  let currentStart = 0;

  chapters.forEach((chapter, index) => {
    // Add transition whoosh or glitch cue at chapter boundary
    if (index > 0) {
      const type = chapter.sfxCue || (chapter.transitionType === 'glitch' ? 'glitch' : 'whoosh');
      events.push({
        timestampMs: currentStart,
        type,
        chapterId: chapter.id,
        volume: 0.8,
      });
    } else {
      // Intro chime or subdrop
      events.push({
        timestampMs: 0,
        type: chapter.sfxCue || 'subdrop',
        chapterId: chapter.id,
        volume: 0.7,
      });
    }

    // Mid-chapter text reveal chime at 35% mark
    if (chapter.durationMs >= 2000) {
      events.push({
        timestampMs: currentStart + Math.round(chapter.durationMs * 0.35),
        type: 'chime',
        chapterId: chapter.id,
        volume: 0.5,
      });
    }

    currentStart += chapter.durationMs;
  });

  return events;
}

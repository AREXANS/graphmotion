import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateChapterAtTime,
  getEase,
  formatTimecode,
  clampTime,
  generateAudioSfxSchedule,
} from './motion-timeline';

test('getEase correctly calculates boundary and interpolation values', () => {
  assert.equal(getEase('linear', 0), 0);
  assert.equal(getEase('linear', 0.5), 0.5);
  assert.equal(getEase('linear', 1), 1);
  assert.equal(getEase('linear', -1), 0);
  assert.equal(getEase('linear', 2), 1);

  // easeOutQuad
  assert.equal(getEase('easeOutQuad', 0), 0);
  assert.equal(getEase('easeOutQuad', 1), 1);
  assert(getEase('easeOutQuad', 0.5) > 0.5); // Concave curve accelerates deceleration

  // expoOut
  assert.equal(getEase('expoOut', 0), 0);
  assert.equal(getEase('expoOut', 1), 1);
});

test('formatTimecode formats minutes, seconds, and frames cleanly', () => {
  assert.equal(formatTimecode(0, 30), '00:00:00');
  assert.equal(formatTimecode(1000, 30), '00:01:00');
  assert.equal(formatTimecode(65500, 30), '01:05:15');
});

test('clampTime preserves range limits', () => {
  assert.equal(clampTime(-10, 5000), 0);
  assert.equal(clampTime(2500, 5000), 2500);
  assert.equal(clampTime(6000, 5000), 5000);
});

test('calculateChapterAtTime returns active index and normalized chapter progress', () => {
  const chapters = [
    { durationMs: 3000 },
    { durationMs: 4000 },
    { durationMs: 3000 },
  ];

  // At start
  const atStart = calculateChapterAtTime(0, chapters);
  assert.equal(atStart.index, 0);
  assert.equal(atStart.localTimeMs, 0);
  assert.equal(atStart.progress, 0);

  // Mid first chapter
  const mid1 = calculateChapterAtTime(1500, chapters);
  assert.equal(mid1.index, 0);
  assert.equal(mid1.localTimeMs, 1500);
  assert.equal(mid1.progress, 0.5);

  // Right at start of chapter 2 (3000ms)
  const atChap2 = calculateChapterAtTime(3000, chapters);
  assert.equal(atChap2.index, 1);
  assert.equal(atChap2.localTimeMs, 0);
  assert.equal(atChap2.progress, 0);

  // Mid chapter 2 (5000ms -> 2000ms into 4000ms)
  const mid2 = calculateChapterAtTime(5000, chapters);
  assert.equal(mid2.index, 1);
  assert.equal(mid2.localTimeMs, 2000);
  assert.equal(mid2.progress, 0.5);

  // At end of all chapters (10000ms)
  const atEnd = calculateChapterAtTime(10000, chapters);
  assert.equal(atEnd.index, 2);
  assert.equal(atEnd.localTimeMs, 3000);
  assert.equal(atEnd.progress, 1);
  assert.equal(atEnd.isLastChapter, true);
});

test('generateAudioSfxSchedule produces transition cues', () => {
  const chapters = [
    {
      id: 'c1',
      title: 'Intro',
      durationMs: 3000,
      motionGraphicType: 'kineticTypography',
      visualNotes: 'Opening',
      script: 'Welcome',
      accentColor: '#38bdf8',
      secondaryColor: '#818cf8',
      sfxCue: 'subdrop' as const,
    },
    {
      id: 'c2',
      title: 'Climax',
      durationMs: 4000,
      motionGraphicType: 'orbitWireframe',
      visualNotes: 'Breakthrough',
      script: 'Accelerate',
      accentColor: '#a855f7',
      secondaryColor: '#ec4899',
      transitionType: 'glitch' as const,
    },
  ];

  const schedule = generateAudioSfxSchedule(chapters);
  assert(schedule.length >= 3);
  // First event at 0ms
  assert.equal(schedule[0].timestampMs, 0);
  assert.equal(schedule[0].type, 'subdrop');

  // Second chapter transition at 3000ms
  const transitionEvent = schedule.find((e) => e.timestampMs === 3000);
  assert(transitionEvent !== undefined);
  assert.equal(transitionEvent?.type, 'glitch');
});

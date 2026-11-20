import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computePreciseSceneWordTimings,
  synchronizeProjectPipeline,
  getPipelineStepStatus,
  extractSmartEmphasisWords,
} from './pipeline-sync.ts';
import {
  resolveAutoStyleForConceptAndScene,
  computeNarrativeBeatSchedule,
  resolveAutoCameraPlanForScene,
  buildContextualSatsetSceneCode,
} from './contextual-scene-builder.ts';
import { computeSatsetWordTimings } from './satset-renderer-engine.ts';
import { type SatsetProject } from '../types/satset.ts';

describe('Pipeline Synchronization & Anti-Slop Word Timing Engine', () => {
  it('computes wordAt array with exact 1-to-1 length match for satset-renderer-engine H(e, t)', () => {
    const narration =
      'Katanya orang sukses selalu bangun pagi, tapi kenapa membuka mata saja kadang terasa berat banget?';
    const words = narration.trim().split(/\s+/).filter(Boolean);
    const result = computePreciseSceneWordTimings(
      narration,
      ['sukses', 'bangun', 'berat'],
      'energik',
      7.5
    );

    assert.equal(result.wordCount, words.length);
    assert.equal(result.wordTimings.length, words.length);
    assert.equal(result.wordAt.length, words.length);

    // Monotonically increasing timestamps within [0, 7.5)
    for (let i = 0; i < result.wordTimings.length; i++) {
      const wt = result.wordTimings[i];
      assert.ok(wt.startSec >= 0, `word ${i} startSec >= 0`);
      assert.ok(wt.endSec > wt.startSec, `word ${i} endSec > startSec`);
      assert.ok(wt.endSec <= 7.5, `word ${i} endSec <= 7.5`);
      if (i > 0) {
        assert.ok(
          wt.startSec > result.wordTimings[i - 1].startSec,
          `word ${i} starts after word ${i - 1}`
        );
      }
    }

    // Verify satset-renderer-engine's computeSatsetWordTimings uses our exact wordAt array
    const engineTimings = computeSatsetWordTimings(
      {
        text: narration,
        duration: 7.5,
        wordAt: result.wordAt,
      },
      { look: 'scribble3d', pace: 'energik' }
    );
    assert.deepEqual(engineTimings, result.wordAt);
  });

  it('adds natural breath pause after commas and periods so clauses do not collide', () => {
    const withComma = 'Bergerak dulu, baru semangat menyusul.';
    const withoutComma = 'Bergerak dulu baru semangat menyusul.';

    const resComma = computePreciseSceneWordTimings(withComma, ['semangat'], 'santai', 5.0);
    const resPlain = computePreciseSceneWordTimings(withoutComma, ['semangat'], 'santai', 5.0);

    // Gap between word[1] ("dulu,") and word[2] ("baru") should be larger when comma is present
    const gapWithComma = resComma.wordTimings[2].startSec - resComma.wordTimings[1].startSec;
    const gapWithoutComma = resPlain.wordTimings[2].startSec - resPlain.wordTimings[1].startSec;
    assert.ok(
      gapWithComma > gapWithoutComma,
      `Expected comma pause gap (${gapWithComma}s) > plain gap (${gapWithoutComma}s)`
    );
  });

  it('synchronizes a project end-to-end with executable scene codes and word timings', () => {
    const rawProject: SatsetProject = {
      id: 'proj-test',
      project_title: 'Kenapa Pagi Terasa Berat?',
      status: 'draft',
      gaya_video: 'diorama',
      tempo: 'energik',
      target_duration_sec: 15,
      scenes: [
        {
          id: 's1',
          scene_number: 1,
          narration_text: 'Jangan tunggu mood datang baru kamu mulai bergerak hari ini.',
          on_screen_text: 'JANGAN TUNGGU MOOD',
          target_duration_sec: 5,
        },
        {
          id: 's2',
          scene_number: 2,
          narration_text: 'Mulai saja selama dua menit pertama, maka fokusmu langsung terkunci.',
          on_screen_text: 'ATURAN 2 MENIT PERTAMA',
          target_duration_sec: 5,
        },
      ],
      createdAt: Date.now(),
    };

    const synced = synchronizeProjectPipeline(rawProject);
    assert.equal(synced.scenes.length, 2);
    assert.equal(synced.scenes_animated_count, 2);
    assert.ok(synced.scene_codes?.[1]?.includes('s.'));
    assert.ok(synced.scene_codes?.[2]?.includes('s.'));

    for (const sc of synced.scenes) {
      const expectedWords = (sc.narration_text || '').split(/\s+/).filter(Boolean).length;
      assert.equal(sc.word_timings?.length, expectedWords);
      assert.ok((sc.emphasis_words?.length || 0) > 0);
    }

    const stages = getPipelineStepStatus(synced);
    assert.equal(stages.length, 4);
    assert.ok(stages.every((st) => st.isComplete));
  });

  it('extracts smart emphasis keywords from Indonesian narration', () => {
    const keywords = extractSmartEmphasisWords(
      'Banyak yang mengira rasa malas pagi bakal hilang kalau kita nunggu semangat.',
      'Rasa Malas Pagi'
    );
    assert.ok(keywords.length >= 2);
  });

  it('resolves Automatic Style (gaya_video: otomatis) accurately based on topic, concept, and scene narration', () => {
    const financeRes = resolveAutoStyleForConceptAndScene({
      topik_video: 'Strategi investasi saham dan menabung gaji bulanan agar tidak bocor',
      content_type: 'edukasi',
      gaya_video: 'otomatis',
    });
    assert.ok(
      financeRes.styleId === 'diorama_data' || financeRes.styleId === 'celengan_pecah',
      `Expected finance style to be diorama_data or celengan_pecah, got ${financeRes.styleId}`
    );

    const webRes = resolveAutoStyleForConceptAndScene({
      topik_video: 'Cara membuat landing page SaaS dengan dashboard UI modern',
      content_type: 'promosi',
      gaya_video: 'otomatis',
    });
    assert.equal(webRes.styleId, 'uiweb');

    const systemRes = resolveAutoStyleForConceptAndScene({
      topik_video: 'Cara kerja algoritma sistem mesin pencari dan proses arsitektur server',
      content_type: 'edukasi',
      gaya_video: 'otomatis',
    });
    assert.equal(systemRes.styleId, 'cara_kerja');

    const historyRes = resolveAutoStyleForConceptAndScene({
      topik_video: 'Sejarah dokumenter krisis masa lalu di tahun 1998 dan arsip kenangan',
      content_type: 'storytelling',
      gaya_video: 'otomatis',
    });
    assert.equal(historyRes.styleId, 'vintage_film');

    const calmRes = resolveAutoStyleForConceptAndScene({
      topik_video: 'Cara hidup tenang mindfulness untuk menyembuhkan cemas dan lelah batin',
      content_type: 'motivasi',
      gaya_video: 'otomatis',
      tempo: 'santai',
    });
    assert.equal(calmRes.styleId, 'tenang_minimalis');
  });

  it('computes monotonically increasing narrative beats aligned to spoken word timings and stages objects progressively', () => {
    const narration =
      'Jangan tunggu mood datang baru kamu mulai bergerak, karena tindakan dua menit pertama langsung memicu fokus.';
    const timing = computePreciseSceneWordTimings(narration, ['tindakan', 'fokus'], 'energik', 7.5);
    const scene = {
      id: 'sc-beat-1',
      scene_number: 1,
      narration_text: narration,
      on_screen_text: 'MULAI 2 MENIT PERTAMA',
      emphasis_words: ['tindakan', 'fokus'],
      target_duration_sec: 7.5,
      word_timings: timing.wordTimings,
      wordAt: timing.wordAt,
    };

    const beats = computeNarrativeBeatSchedule(scene, 7.5, 'energik');
    assert.ok(beats.beat1 >= 0.02 && beats.beat1 < beats.beat2, `beat1 (${beats.beat1}) < beat2 (${beats.beat2})`);
    assert.ok(beats.beat2 < beats.beat3, `beat2 (${beats.beat2}) < beat3 (${beats.beat3})`);
    assert.ok(beats.beat3 < beats.beat4, `beat3 (${beats.beat3}) < beat4 (${beats.beat4})`);
    assert.ok(beats.beat4 < 7.0, `beat4 (${beats.beat4}) < 7.0`);

    const camPlan = resolveAutoCameraPlanForScene(scene, 'alarm_clock', 0, 8);
    assert.ok(camPlan.p2ZoomDelta > 0, 'zoom-in delta on beat 2 should be positive');
    assert.ok(camPlan.p3ZoomDelta > camPlan.p2ZoomDelta, 'zoom-in delta on beat 3 should intensify');

    const built = buildContextualSatsetSceneCode(
      scene as any,
      {
        id: 'proj-beat',
        project_title: 'Test Progressive Reveal',
        status: 'draft',
        gaya_video: 'otomatis',
        tempo: 'energik',
        scenes: [scene as any],
        createdAt: Date.now(),
      },
      0,
      8
    );

    // Code must include the 4-beat progressive timing variables and multi-phase camera group
    assert.ok(built.code.includes('Multi-Phase Camera Choreography'));
    assert.ok(built.code.includes('const beat1 ='));
    assert.ok(built.code.includes('const beat2 ='));
    assert.ok(built.code.includes('const beat3 ='));
    assert.ok(built.code.includes('const beat4 ='));
    assert.ok(built.code.includes('camZoom'));
    assert.ok(built.code.includes('camPanX'));
    assert.equal(built.sfxCues.length, 4);
    assert.equal(built.sfxCues[0][1], beats.beat1);
    assert.equal(built.sfxCues[1][1], beats.beat2);
    assert.equal(built.sfxCues[2][1], beats.beat3);
    assert.equal(built.sfxCues[3][1], beats.beat4);
  });
});


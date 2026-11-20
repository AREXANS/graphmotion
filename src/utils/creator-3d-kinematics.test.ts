import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  anticipationCurve,
  evaluateCreator3DKinematics,
  evaluateLipSyncAtTime,
  evaluateMascotOrbKinematics,
  normalizeCreatorPoseName,
  parsePoseTimeline,
  quinticEase,
  springSettleEase,
  type LipSyncWordTiming,
} from './creator-3d-kinematics.ts';

function assertAllFinite(obj: unknown, path = 'root'): void {
  if (typeof obj === 'number') {
    assert.ok(Number.isFinite(obj), `Expected finite number at ${path}, got ${obj}`);
    return;
  }
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      assertAllFinite(v, `${path}.${k}`);
    }
  }
}

describe('Creator 3D Kinematics & Mascot Orb Math', () => {
  it('evaluates all standard and aliased poses with finite joint angles', () => {
    const poses = [
      'stand',
      'present',
      'point',
      'idea',
      'think',
      'thumbs',
      'wave',
      'cheer',
      'explain',
      'celebrate',
      'nod_listen',
    ];

    for (const pose of poses) {
      const k = evaluateCreator3DKinematics(pose, 1.35, { speaking: true });
      assertAllFinite(k, pose);
      assert.equal(k.activePose, normalizeCreatorPoseName(pose));
      assert.ok(k.mouthOpen >= 0);
    }
  });

  it('activates happy_arc eyes on joyful poses (cheer, thumbs, wave)', () => {
    for (const pose of ['cheer', 'thumbs', 'wave']) {
      const k = evaluateCreator3DKinematics(pose, 0.8);
      assert.equal(k.eyeMode, 'happy_arc', `Expected happy_arc eyeMode for ${pose}`);
    }
    const neutral = evaluateCreator3DKinematics('present', 0.8);
    assert.equal(neutral.eyeMode, 'normal');
  });

  it('produces staggered organic joint follow-through during pose transitions', () => {
    const timeline: [string, number][] = [
      ['stand', 0],
      ['point', 1.0],
    ];
    const before = evaluateCreator3DKinematics(timeline, 0.9);
    const mid = evaluateCreator3DKinematics(timeline, 1.25);
    const settled = evaluateCreator3DKinematics(timeline, 2.0);

    assert.equal(before.activePose, 'stand');
    assert.equal(mid.prevPose, 'stand');
    assert.equal(mid.activePose, 'point');
    assert.ok(mid.blendAlpha > 0 && mid.blendAlpha < 1);

    // Right arm transitions smoothly between stand and point with staggered joint progress
    assert.notEqual(mid.rightArm.pitch, before.rightArm.pitch);
    assert.notEqual(mid.rightArm.pitch, settled.rightArm.pitch);
    assert.equal(settled.blendAlpha, 1);
  });

  it('animates natural blink cycle, breathing, and speaking lip-sync deterministically', () => {
    // At t = 2.487: ((2.487 + 0.65) * 0.31) % 1 = ~0.9725 (peak of blink curve)
    const blinking = evaluateCreator3DKinematics('stand', 2.487, { speaking: false });
    const openEyes = evaluateCreator3DKinematics('stand', 0.5, { speaking: false });
    assert.ok(blinking.blinkAmount > 0.7, `Expected blinkAmount > 0.7 at t=2.487, got ${blinking.blinkAmount}`);
    assert.equal(openEyes.blinkAmount, 0);
    assert.equal(openEyes.mouthOpen, 0);

    const talkingA = evaluateCreator3DKinematics('present', 0.12, { speaking: true });
    const talkingB = evaluateCreator3DKinematics('present', 0.12, { speaking: true });
    assert.deepEqual(talkingA, talkingB, 'Kinematics must be deterministic across identical renders');
    assert.ok(talkingA.mouthOpen > 0.5, `Speaking mouth should open cleanly on syllable, got ${talkingA.mouthOpen}`);
  });

  it('syncs lip shapes to word_timings, closes during punctuation pauses and silence, and modulates by pace', () => {
    const words: LipSyncWordTiming[] = [
      { text: 'Buka', at: 0.2, end: 0.65 },
      { text: 'selesai.', at: 0.7, end: 1.3 },
      { text: 'Oke!', at: 1.75, end: 2.2, key: true },
    ];

    // Before speech starts -> closed
    const before = evaluateLipSyncAtTime(0.05, words);
    assert.equal(before.mouthOpen, 0);
    assert.equal(before.vowelShape, 'rest');
    assert.equal(before.speakingNow, false);

    // Mid-word "Buka" -> open with bilabial/O/A articulation
    const midBuka = evaluateLipSyncAtTime(0.42, words, { pace: 'energik' });
    assert.ok(midBuka.mouthOpen > 0.3, `Expected mouthOpen > 0.3 mid-word, got ${midBuka.mouthOpen}`);
    assert.equal(midBuka.speakingNow, true);

    // Tail pause before period on "selesai." -> cleanly closed (activeEnd trims up to 0.14s)
    const periodPause = evaluateLipSyncAtTime(1.24, words);
    assert.equal(periodPause.mouthOpen, 0);
    assert.equal(periodPause.vowelShape, 'rest');
    assert.equal(periodPause.speakingNow, false);

    // Inter-word silence gap -> closed
    const silentGap = evaluateLipSyncAtTime(1.5, words);
    assert.equal(silentGap.mouthOpen, 0);
    assert.equal(silentGap.speakingNow, false);

    // Rounded vowel 'O' on "Oke!" narrows mouthWide relative to 'E'/'A' and key triggers stressAccent
    const roundedStart = evaluateLipSyncAtTime(1.86, words, { pace: 'energik' });
    assert.equal(roundedStart.vowelShape, 'O');
    assert.ok(roundedStart.mouthWide < 0.9, `Expected narrow O mouthWide < 0.9, got ${roundedStart.mouthWide}`);
    assert.ok(roundedStart.stressAccent > 0, 'Key word should raise stressAccent');

    // Calm pace softens mouth opening compared to energik on the same word
    const energikKin = evaluateCreator3DKinematics('present', 0.45, {
      speaking: true,
      captionWords: words,
      pace: 'energik',
    });
    const calmKin = evaluateCreator3DKinematics('present', 0.45, {
      speaking: true,
      captionWords: words,
      pace: 'santai',
    });
    assert.ok(energikKin.mouthOpen > calmKin.mouthOpen, `Expected energik (${energikKin.mouthOpen}) > santai (${calmKin.mouthOpen})`);

    // Post-narration silence -> mouth closed even if speaking flag stays true
    const postSpeech = evaluateCreator3DKinematics('present', 2.8, {
      speaking: true,
      captionWords: words,
      pace: 'energik',
    });
    assert.equal(postSpeech.mouthOpen, 0);
    assert.equal(postSpeech.vowelShape, 'rest');
  });

  it('parses pose timelines and easing helpers cleanly', () => {
    assert.equal(quinticEase(0), 0);
    assert.equal(quinticEase(1), 1);
    assert.equal(springSettleEase(0), 0);
    assert.equal(springSettleEase(1), 1);

    const parsed = parsePoseTimeline([
      ['point', 1.2],
      ['stand', 0],
    ]);
    assert.equal(parsed[0][0], 'stand');
    assert.equal(parsed[1][0], 'point');
  });

  it('evaluates winged 3D mascot orb kinematics deterministically', () => {
    const a = evaluateMascotOrbKinematics(1.5);
    const b = evaluateMascotOrbKinematics(1.5);
    assertAllFinite(a, 'mascotOrb');
    assert.deepEqual(a, b);
  });

  it('produces anticipation recoil dip, volume-preserving squash/stretch, and asymmetric brow expression', () => {
    const antStart = anticipationCurve(0.08, 0.68);
    const antSettled = anticipationCurve(0.45, 0.68);
    assert.ok(antStart < 0, `Expected negative anticipation recoil at 0.08s, got ${antStart}`);
    assert.equal(antSettled, 0, 'Anticipation should settle back to 0 after initial 28% window');

    const kDip = evaluateCreator3DKinematics([['stand', 0], ['point', 1.0]], 1.07, {
      speaking: true,
      pace: 'energik',
    });
    assertAllFinite(kDip, 'kDip');
    assert.ok(kDip.bodySquash !== 0, 'Expected active bodySquash impulse during transition');
    assert.ok(kDip.browTilt !== 0, 'Expected subtle asymmetric browTilt on point pose');
  });

  it('keeps elbow (siku) joint actively articulated across all poses and viewModes without over-bending', () => {
    const poses = [
      'stand', 'present', 'point', 'idea', 'think', 'headache', 'scared',
      'sigh', 'tired', 'angry', 'sittype', 'phone', 'watch', 'cash',
      'yes', 'thumbs', 'wave', 'cheer', 'walk', 'run', 'hips', 'shrug',
    ];
    for (const viewMode of ['full', 'bust', 'closeup'] as const) {
      for (const pose of poses) {
        const k1 = evaluateCreator3DKinematics(pose, 0.35, { speaking: true, viewMode, pace: 'energik' });
        const k2 = evaluateCreator3DKinematics(pose, 0.85, { speaking: true, viewMode, pace: 'energik' });
        assert.ok(
          k1.leftArm.elbow >= 0.22 && k1.leftArm.elbow <= 1.08,
          `Left elbow for ${pose} (${viewMode}) out of anatomical bounds: ${k1.leftArm.elbow}`
        );
        assert.ok(
          k1.rightArm.elbow >= 0.22 && k1.rightArm.elbow <= 1.08,
          `Right elbow for ${pose} (${viewMode}) out of anatomical bounds: ${k1.rightArm.elbow}`
        );
        assert.ok(
          Math.abs(k2.rightArm.elbow - k1.rightArm.elbow) > 0.001 || Math.abs(k2.leftArm.elbow - k1.leftArm.elbow) > 0.001,
          `Expected active elbow movement over time for pose ${pose}`
        );
      }
    }
  });
});


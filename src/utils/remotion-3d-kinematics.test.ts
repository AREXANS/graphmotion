import test from 'node:test';
import assert from 'node:assert/strict';
import {
  remotionSpring,
  remotionInterpolate,
  computeCalibratedWordTimings,
  getActiveWordIndex,
  computeSubtitleSafeZone,
  evaluateCharacterJoints,
  evaluate3DStageFrame,
  type StageAspectRatio,
} from './remotion-3d-kinematics.ts';

test('remotionSpring converges smoothly from 0 toward 1 without NaN across configurations', () => {
  assert.equal(remotionSpring({ frame: -5, fps: 60 }), 0);
  assert.equal(remotionSpring({ frame: 0, fps: 60 }), 0);

  const mid = remotionSpring({ frame: 18, fps: 60, config: { damping: 13, stiffness: 180 } });
  assert(Number.isFinite(mid) && mid > 0.4 && mid < 1.35, `Expected valid spring mid, got ${mid}`);

  const settled = remotionSpring({ frame: 180, fps: 60, config: { damping: 13, stiffness: 180 } });
  assert(Math.abs(settled - 1) < 0.02, `Expected spring settled near 1, got ${settled}`);
});

test('remotionInterpolate handles clamp and linear interpolation accurately', () => {
  assert.equal(remotionInterpolate(-10, [0, 30], [100, 200], { extrapolateLeft: 'clamp' }), 100);
  assert.equal(remotionInterpolate(60, [0, 30], [100, 200], { extrapolateRight: 'clamp' }), 200);
  assert.equal(remotionInterpolate(15, [0, 30], [100, 200]), 150);
});

test('computeCalibratedWordTimings weights longer & punctuated words naturally within scene duration', () => {
  const timings = computeCalibratedWordTimings(
    'Bangun pagi itu berat, tapi konsistensi kecil selalu menang!',
    ['konsistensi'],
    'energik',
    4.5
  );

  assert.equal(timings.length, 9);
  assert.equal(timings[0].at >= 0, true);
  assert(timings[timings.length - 1].end <= 4.5, 'Word timings must finish inside scene duration');

  const emphToken = timings.find((t) => t.word.includes('konsistensi'));
  assert(emphToken?.isEmphasis === true);

  // Verify strictly non-overlapping monotonically increasing sequence
  for (let i = 1; i < timings.length; i++) {
    assert(timings[i].at >= timings[i - 1].end - 0.001);
  }
  assert.equal(getActiveWordIndex(timings, timings[3].at + 0.01), 3);
});

test('evaluateCharacterJoints yields finite blended angles and blinking', () => {
  const joints = evaluateCharacterJoints('present', 'cheer', 0.65, 1.2, 3.35, true);
  for (const [key, val] of Object.entries(joints)) {
    if (key === 'eyeMode' || key === 'mouthShape') {
      assert.equal(typeof val, 'string');
    } else {
      assert(Number.isFinite(val), `Joint angle ${key} must be finite, got ${val}`);
    }
  }
  assert(joints.mouthOpen >= 0 && joints.mouthOpen <= 1);
  assert(joints.blinkAmount >= 0 && joints.blinkAmount <= 1);
});

test('evaluate3DStageFrame produces alternating themes, valid camera rigs, and non-overlapping safe zones across all aspect ratios', () => {
  const sampleScenes = [
    {
      text: 'Katanya orang sukses bangun pagi penuh semangat.',
      emphasis: 'semangat',
      duration: 4,
      role: 'hook',
      camera: 'push',
    },
    {
      text: 'Padahal otak butuh sistem bertahap agar konsisten.',
      emphasis: 'konsisten',
      duration: 4,
      camera: 'orbit',
    },
    {
      text: 'Follow sekarang untuk tips harian lainnya!',
      emphasis: 'Follow',
      duration: 4,
      role: 'cta',
      camera: 'pull',
    },
  ];

  const ratios: StageAspectRatio[] = ['9:16', '16:9', '1:1', '3:4'];
  for (const ratio of ratios) {
    const f0 = evaluate3DStageFrame(sampleScenes, { art: 'editorial_motion_grid', character: 'kreator_3d_studio' }, 0.1, ratio);
    const f1 = evaluate3DStageFrame(sampleScenes, { art: 'editorial_motion_grid', character: 'kreator_3d_studio' }, 5.5, ratio);
    const f2 = evaluate3DStageFrame(sampleScenes, { art: 'editorial_motion_grid', character: 'kreator_3d_studio' }, 11.2, ratio);

    assert.equal(f0.sceneIndex, 0);
    assert.equal(f0.theme, 'dark_cyber');
    assert.equal(f1.sceneIndex, 1);
    assert.equal(f1.theme, 'light_grid');
    assert.equal(f2.sceneIndex, 2);
    assert.equal(f2.isCta, true);
    assert.equal(f2.isFollowed, true);

    for (const f of [f0, f1, f2]) {
      for (const n of [...f.camera.pos, ...f.camera.lookAt, f.camera.fov, ...f.pedestals]) {
        assert(Number.isFinite(n), `Numeric frame output must be finite for ${ratio}`);
      }
      assert(f.safeZone.bottomYRatio >= 0.8 && f.safeZone.bottomYRatio <= 0.92);
      assert(f.safeZone.maxWidthRatio >= 0.65 && f.safeZone.maxWidthRatio <= 0.9);
    }
  }

  // Verify studio_3d_room theme and safe zone
  const studioFrame = evaluate3DStageFrame(
    sampleScenes,
    { art: 'studio_3d_room', character: 'kreator_3d_studio' },
    1.5,
    '9:16'
  );
  assert.equal(studioFrame.theme, 'studio_room');
  const sz = computeSubtitleSafeZone('9:16', true, 'studio_room');
  assert(sz.bottomYRatio >= 0.82 && sz.bottomYRatio <= 0.9);
});

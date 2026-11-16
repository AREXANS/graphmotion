import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCTION_FIXED_RULES,
  sanitizeSfxCueName,
  sanitizeSceneCodeSfx,
  evaluateProductionStageGate,
  calibrateScenesForStagedProduction,
} from '../production-stage-rules';
import { evaluateCreator3DKinematics } from '../creator-3d-kinematics';
import { buildContextualSatsetSceneCode } from '../contextual-scene-builder';
import { generateRemotionCode } from '../remotion-generator';

describe('4-Stage Production Pipeline & Fixed Remotion Rules', () => {
  it('defines all 4 permanent production rules for character anatomy, foley tempo, style hierarchy, and staged workflow', () => {
    assert.equal(PRODUCTION_FIXED_RULES.length, 4);
    const ids = PRODUCTION_FIXED_RULES.map((r) => r.id);
    assert.deepEqual(ids, [
      'rule_character_anatomy',
      'rule_audio_foley_tempo',
      'rule_clear_style_objects',
      'rule_staged_workflow',
    ]);
  });

  it('sanitizes repetitive high-pitched chime/bell SFX into warm foley cues', () => {
    for (const chime of ['ding', 'coin', 'notify', 'correct', 'sparkle', 'tada', 'magic', 'cash', 'beep']) {
      const sanitized = sanitizeSfxCueName(chime, 1);
      assert.notEqual(sanitized, chime);
      assert.ok(['whoosh', 'card_slide', 'tap', 'pop', 'swish', 'paper'].includes(sanitized));
    }

    const rawCode = `s.sfx("ding", 0.2, 0.7); s.sfx("coin", 0.8, 0.7); s.sfx("whoosh", 0.1, 0.5);`;
    const { code: cleanedCode, replacedCount } = sanitizeSceneCodeSfx(rawCode, 0);
    assert.equal(replacedCount, 2);
    assert.ok(!cleanedCode.includes('"ding"'));
    assert.ok(!cleanedCode.includes('"coin"'));
    assert.ok(cleanedCode.includes('"whoosh"'));
  });

  it('detects uncalibrated scenes and reaches readyForRender=true after calibrateScenesForStagedProduction', () => {
    const rawScenes = [
      {
        id: 1,
        text: 'Pernah nggak kamu merasa animasi karakter kelihatan kaku banget',
        highlight: '',
        sfx: 'ding',
        code: 'const mx = W * 0.87, my = ground - 115 * sc + s.wave(1.35, 8 * sc);\ns.sfx("ding", 0.5, 0.8);',
      },
      {
        id: 2,
        text: 'Masalah utamanya ada pada proporsi wajah bulat dan lengan satu segmen tanpa siku.',
        highlight: 'proporsi wajah',
        sfx: 'coin',
        code: 's.sfx("coin", 0.4, 0.7);',
      },
      {
        id: 3,
        text: 'Dengan proses bertahap empat fase, karakter dan objek 3D tampil jauh lebih rapi.',
        highlight: 'empat fase',
        sfx: 'notify',
        code: 's.sfx("notify", 0.6, 0.7);',
      },
      {
        id: 4,
        text: 'Yuk coba alur produksi bertahap ini sekarang dan follow untuk tips berikutnya!',
        highlight: 'follow',
        sfx: 'tada',
        code: 's.sfx("tada", 0.8, 0.7);',
      },
    ];

    const beforeEval = evaluateProductionStageGate({
      topic: 'Perbaikan Karakter & Animasi 3D',
      styleId: 'studio_3d_room',
      characterId: 'kreator_3d_studio',
      scenes: rawScenes,
    });
    assert.equal(beforeEval.readyForRender, false, 'Should block render when ding/coin cues and overlapping coordinates exist');

    const { scenes: calibratedScenes, fixesApplied } = calibrateScenesForStagedProduction(rawScenes);
    assert.ok(fixesApplied.length >= 2);

    const afterEval = evaluateProductionStageGate({
      topic: 'Perbaikan Karakter & Animasi 3D',
      styleId: 'studio_3d_room',
      characterId: 'kreator_3d_studio',
      scenes: calibratedScenes,
    });
    assert.equal(afterEval.readyForRender, true);
    assert.equal(afterEval.overallScore, 100);
  });
});

describe('3D Creator Arm Kinematics & Phase-Delayed Pendulum Follow-Through', () => {
  it('produces continuous phase-delayed shoulder, elbow, and wrist articulation across frames', () => {
    const poseA = evaluateCreator3DKinematics('present', 0.4, {
      speaking: true,
    });
    const poseB = evaluateCreator3DKinematics('present', 0.95, {
      speaking: true,
    });

    // Ensure both upper arm (pitch/abduct) and forearm (elbow + twist + wrist) articulate dynamically
    assert.ok(poseA.rightArm.elbow >= 0.24, 'Right elbow should have natural anatomical flex');
    assert.ok(poseA.leftArm.elbow >= 0.24, 'Left elbow should have natural anatomical flex');
    assert.notEqual(poseA.rightArm.pitch, poseB.rightArm.pitch);
    assert.notEqual(poseA.rightArm.elbow, poseB.rightArm.elbow);
    assert.notEqual(poseA.rightArm.wrist, poseB.rightArm.wrist);
  });
});

describe('3D Studio Room & Pedestal Scene Builder & Remotion TSX Generator', () => {
  const sampleProject: any = {
    id: 'proj-test',
    judul_video: 'Workflow Animasi 3D Profesional',
    gaya_video: 'studio_3d_room',
    character: 'kreator_3d_studio',
    aspect_ratio: '9:16',
    tempo: 'energik',
    watermark: '@graphmotion.id',
    scenes: [
      {
        id: 's1',
        scene_number: 1,
        role: 'hook',
        narration_text: 'Pernah merasa animasi 3D kamu kelihatan berantakan dan kaku?',
        on_screen_text: 'ANIMASI 3D RAPI / WAJAH V-JAW / LENGAN LENTUR',
        target_duration_sec: 6,
      },
      {
        id: 's2',
        scene_number: 2,
        role: 'cta',
        narration_text: 'Yuk terapkan alur 4 tahap ini dan follow sekarang!',
        on_screen_text: 'KALIBRASI 4 TAHAP / BEBAS TING-TING / FOLLOW SEKARANG',
        target_duration_sec: 6,
      },
    ],
  };

  it('builds 3D Studio Room 2D canvas code with step badges 01/02/03, halo backplates, non-overlapping showcase monitor, and zero ding/coin SFX', () => {
    const built = buildContextualSatsetSceneCode(sampleProject.scenes[0], sampleProject, 0, 2);
    assert.ok(built.code.includes('const pedStepNums = ["01", "02", "03"];'));
    assert.ok(built.code.includes('const scX = W * 0.635, scY = (isWide ? H * 0.31 : H * 0.295)'));
    assert.ok(!/s\.sfx\(\s*["'](ding|coin|notify|tada|sparkle)["']/i.test(built.code));
  });

  it('generates Remotion TSX with oval-tapered V-jawline face path, 2-segment pendulum arms, layered Bezier hair, and STEP badges on pedestals', () => {
    const bundle2D = generateRemotionCode({ ...sampleProject, render_dimension: '2d' });
    assert.ok(
      bundle2D.compositionTsx.includes('M-47 -12 C-48 -50 -27 -62 0 -62'),
      'Should include oval-tapered V-jawline SVG face path',
    );
    assert.ok(
      bundle2D.compositionTsx.includes('rightElbowRot'),
      'Should include 2-segment elbow rotation kinematics',
    );
    assert.ok(
      bundle2D.compositionTsx.includes('STEP {stepBadges[i]}'),
      'Should render STEP 01/02/03 badges on studio pedestals',
    );

    const bundle3D = generateRemotionCode({ ...sampleProject, render_dimension: '3d' });
    assert.ok(
      bundle3D.compositionTsx.includes('rElbowZ'),
      'Should include 2-segment 3D elbow rotation kinematics',
    );
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCTION_FIXED_RULES,
  sanitizeSfxCueName,
  sanitizeSceneCodeSfx,
  evaluateProductionStageGate,
  calibrateScenesForStagedProduction,
} from '../production-stage-rules.ts';
import { evaluateCreator3DKinematics } from '../creator-3d-kinematics.ts';
import { buildContextualSatsetSceneCode } from '../contextual-scene-builder.ts';
import { generateRemotionCode } from '../remotion-generator.ts';

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

describe('AI Automatic Asset Matching, Motion Choreography & Dynamic AI/Style SFX', async () => {
  const { inferAutoMotionForAssetAndScene, autoMatchUploadedAssetsToScenes } = await import(
    '../website-media-engine.ts'
  );
  const { getStyleAndSceneSfxCues } = await import('../audio-synth.ts');
  const { collectSatsetSfxTimeline } = await import('../satset-renderer-engine.ts');

  it('infers tailored Remotion motion choreography and matches edited asset names to relevant script scenes', () => {
    const chartMotion = inferAutoMotionForAssetAndScene(
      'Grafik Profit Naik 300%',
      'Di langkah kedua kita lihat grafik pertumbuhan profit bulanan yang melonjak tajam.',
      'Cara Scale Up Bisnis Online',
      'diorama',
      0
    );
    assert.equal(chartMotion.preset, 'parallax_scan');
    assert.ok(chartMotion.prompt.includes('Grafik Profit Naik 300%'));

    const productMotion = inferAutoMotionForAssetAndScene(
      'Foto Produk Skincare 3D',
      'Tampilkan showcase kemasan produk secara elegan.',
      'Review Skincare',
      'studio_3d_room',
      1
    );
    assert.equal(productMotion.preset, 'orbit_3d');

    const uploadedMedia = [
      {
        id: 'm1',
        key: 'user_asset_1',
        type: 'image' as const,
        url: 'data:image/png;base64,AAA',
        name: 'Dashboard Analitik Penjualan',
        filename: 'dashboard.png',
      },
      {
        id: 'm2',
        key: 'user_asset_2',
        type: 'image' as const,
        url: 'data:image/png;base64,BBB',
        name: 'Bukti Transfer Pelanggan',
        filename: 'bukti.png',
      },
    ];

    const scenes: any[] = [
      {
        id: 's1',
        scene_number: 1,
        narration_text: 'Banyak pebisnis bingung membaca data di dashboard analitik penjualan mereka.',
        on_screen_text: 'DASHBOARD ANALITIK',
      },
      {
        id: 's2',
        scene_number: 2,
        narration_text: 'Padahal kalau sudah paham polanya, bukti transfer pelanggan masuk tiap jam.',
        on_screen_text: 'BUKTI TRANSFER MASUK',
      },
    ];

    const matched = autoMatchUploadedAssetsToScenes(
      uploadedMedia,
      scenes,
      'Strategi Penjualan Digital',
      'diorama'
    );

    assert.equal(matched[0].media_key, 'user_asset_1');
    assert.equal(matched[0].media_filename, 'Dashboard Analitik Penjualan');
    assert.ok(matched[0].asset_motion_preset);
    assert.ok(matched[0].asset_motion_prompt?.includes('Dashboard Analitik Penjualan'));

    assert.equal(matched[1].media_key, 'user_asset_2');
    assert.equal(matched[1].media_filename, 'Bukti Transfer Pelanggan');
  });

  it('extracts and preserves arbitrary AI-referenced SFX cues and style-specific SFX cues', () => {
    const customScene: any = {
      id: 's1',
      scene_number: 1,
      sfxCue: 'ketik_keyboard_cepat',
      sfx: ['riser_cyber_futuristik'],
    };
    const customCode = `
      s.sfx("glitch_matrix_pulse", 0.15, 0.8);
      s.sfx("detak_jantung_tegang", 1.2, 0.7);
    `;

    const cuesResult = getStyleAndSceneSfxCues('isometric', customScene, customCode);
    assert.ok(cuesResult.cues.includes('glitch_matrix_pulse'), 'Should include custom s.sfx cue from scene code');
    assert.ok(cuesResult.cues.includes('detak_jantung_tegang'), 'Should include second custom s.sfx cue from scene code');
    assert.ok(cuesResult.cues.includes('ketik_keyboard_cepat'), 'Should include scene.sfxCue');
    assert.ok(cuesResult.cues.includes('riser_cyber_futuristik'), 'Should include scene.sfx array cue');

    const timeline = collectSatsetSfxTimeline(
      [{ ...customScene, duration: 5, code: customCode }],
      { art: 'isometric', look: 'isometric', transition: 'cut' } as any
    );
    const timelineNames = timeline.map((ev: any) => ev.name);
    assert.ok(timelineNames.includes('glitch_matrix_pulse'));
    assert.ok(timelineNames.includes('detak_jantung_tegang'));
  });
});


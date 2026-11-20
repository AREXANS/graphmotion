import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  collectSatsetSfxTimeline,
} from './satset-renderer-engine.ts';
import {
  buildVoiceMasteringFilter,
  selectNeuralBaseVoiceForClause,
  VOICE_MASTERING_PRESETS,
} from './voice-mastering.ts';
import {
  detectMentionedPlatforms,
} from './platform-logos.ts';
import {
  resolveAutoStyleForConceptAndScene,
  buildContextualSatsetSceneCode,
  detectSceneVisualMotif,
  selectSemanticPosesForScene,
} from './contextual-scene-builder.ts';
import {
  buildSatsetTimelineForProject,
} from './satset-timeline-builder.ts';
import {
  getCharacterMeta,
  getEngineCharacterConfig,
} from './character-catalog.ts';
import {
  resolveSatsetStyleId,
  getSatsetStyleDemoScenes,
} from './satset-style-demos.ts';
import {
  evaluate3DStageFrame,
  select3DSemanticPoseBeats,
} from './remotion-3d-kinematics.ts';
import { SATSET_MODULES } from '../data/satset-modules.ts';
import { ALL_KREATORLAB_MODULES } from '../data/kreatorlab-styles.ts';
import { type SatsetProject } from '../types/satset.ts';

describe('4-Pillar Studio Upgrades Regression Suite', () => {
  it('1. SFX Timeline: produces non-empty audible cues for manual and @auto-contextual-scene projects', () => {
    const project: SatsetProject = {
      id: 'proj-sfx',
      project_title: 'Test SFX Audibility',
      status: 'draft',
      gaya_video: 'otomatis',
      tempo: 'energik',
      topik_video: 'Cara membuat animasi Remotion dan upload ke TikTok dan YouTube',
      scenes: [
        {
          id: 'sc1',
          scene_number: 1,
          narration_text: 'Lihat bagaimana GitHub repo ini langsung berubah menjadi klip TikTok otomatis.',
          on_screen_text: 'GITHUB KE TIKTOK',
          target_duration_sec: 4.5,
          emphasis_words: ['GitHub', 'TikTok'],
        },
        {
          id: 'sc2',
          scene_number: 2,
          narration_text: 'Semua transisi dan motion graphics di YouTube Shorts langsung sinkron.',
          on_screen_text: 'YOUTUBE SHORTS',
          target_duration_sec: 4.5,
          emphasis_words: ['YouTube', 'Shorts'],
        },
      ],
      createdAt: Date.now(),
    };

    const built = buildSatsetTimelineForProject(project);
    const cues = collectSatsetSfxTimeline(built.timelineScenes, built.projectMeta as any);
    assert.ok(cues.length >= 4, `Expected at least 4 SFX cues across 2 scenes, got ${cues.length}`);
    for (const cue of cues) {
      assert.ok(cue.gain >= 0.2, `Expected audible SFX cue gain >= 0.2 for ${cue.name}, got ${cue.gain}`);
      assert.ok(Number.isFinite(cue.t) && cue.t >= 0, `Expected valid cue timestamp, got ${cue.t}`);
    }

    // Manual simple scene without explicit s.sfx() calls should also synthesize fallback/motion SFX cues
    const manualCues = collectSatsetSfxTimeline(
      [
        {
          text: 'Langkah pertama mulai dari ide sederhana.',
          duration: 3.5,
          theme: 'paper',
          code: 's.at(0.2, 0.8); s.pop(1.0, 0.5);',
        },
      ],
      { look: 'scribble3d', pace: 'energik', art: 'cara_kerja' } as any
    );
    assert.ok(manualCues.length >= 2, `Expected manual scene SFX cues >= 2, got ${manualCues.length}`);
  });

  it('2. Voice Mastering: all 27+ presets produce distinct ffmpeg filter chains and smart language routing', () => {
    const profileIds = Object.keys(VOICE_MASTERING_PRESETS);
    assert.ok(profileIds.length >= 27, `Expected >= 27 voice presets, found ${profileIds.length}`);

    const filters = new Set<string>();
    for (const id of profileIds) {
      const f = buildVoiceMasteringFilter(id, VOICE_MASTERING_PRESETS[id].gender === 'female', 1.0);
      assert.ok(f.includes('asetrate=24000*'), `Filter for ${id} should set pitch asetrate`);
      assert.ok(f.includes('equalizer='), `Filter for ${id} should shape vocal formants`);
      filters.add(f);
    }
    assert.equal(
      filters.size,
      profileIds.length,
      `Every voice profile must generate a unique mastering signature (${filters.size}/${profileIds.length})`
    );

    const idRouting = selectNeuralBaseVoiceForClause(
      'Kita bisa membuat video keren dalam hitungan detik sekarang juga.',
      'charon',
      false
    );
    assert.equal(idRouting.isEnglishClause, false);
    assert.equal(idRouting.otVoice, 'id_001');

    const enRoutingMale = selectNeuralBaseVoiceForClause(
      'You can deploy your React and Remotion video workflow automatically.',
      'fenrir',
      false
    );
    const enRoutingFemale = selectNeuralBaseVoiceForClause(
      'You can deploy your React and Remotion video workflow automatically.',
      'kore',
      true
    );
    assert.equal(enRoutingMale.isEnglishClause, true);
    assert.equal(enRoutingFemale.isEnglishClause, true);
    assert.notEqual(enRoutingMale.otVoice, enRoutingFemale.otVoice);
  });

  it('3. Style Otomatis & Authentic Platform Logos: adapts per concept/scene without defaulting to diorama_data or Gemini slop', () => {
    const creatorProject: SatsetProject = {
      id: 'proj-auto',
      project_title: 'Repo GitHub Otomatis Jadi Konten TikTok & YouTube',
      topik_video: 'Cara install skill GitHub agar otomatis render klip TikTok dan YouTube dengan Remotion React',
      content_type: 'edukasi',
      status: 'draft',
      gaya_video: 'otomatis',
      tempo: 'energik',
      scenes: [
        {
          id: 's1',
          scene_number: 1,
          visualModule: 'diorama_data', // stale override should be ignored when gaya_video === 'otomatis'
          narration_text: 'Cukup install skill dari GitHub repo ini untuk automasi workflow.',
          on_screen_text: 'GITHUB SKILL',
          target_duration_sec: 4,
        },
        {
          id: 's2',
          scene_number: 2,
          visualModule: 'diorama_data',
          narration_text: 'Komponen React dan Remotion langsung merakit scene editorial secara otomatis.',
          on_screen_text: 'REACT & REMOTION',
          target_duration_sec: 4,
        },
        {
          id: 's3',
          scene_number: 3,
          visualModule: 'diorama_data',
          narration_text: 'Hasil videonya siap diposting ke TikTok, Instagram Reels, dan YouTube Shorts.',
          on_screen_text: 'TIKTOK & YOUTUBE',
          target_duration_sec: 4,
        },
      ],
      createdAt: Date.now(),
    };

    const built = buildSatsetTimelineForProject(creatorProject);
    const resolvedStyles = built.timelineScenes.map((sc) => sc.styleId);
    assert.ok(
      resolvedStyles.every((st) => st !== 'diorama_data'),
      `Non-finance dev/creator topic under otomatis should NOT fall back to diorama_data, got ${resolvedStyles.join(', ')}`
    );
    assert.ok(
      new Set(resolvedStyles).size >= 2,
      `Multi-scene otomatis timeline should vary styles across scenes, got ${resolvedStyles.join(', ')}`
    );

    // Check contextual builder ignores stale visualModule when project gaya_video is 'otomatis'
    const ctxScene1 = buildContextualSatsetSceneCode(
      creatorProject.scenes[0] as any,
      creatorProject,
      0,
      3
    );
    const autoStyle1 = resolveAutoStyleForConceptAndScene(creatorProject, creatorProject.scenes[0] as any, 0);
    assert.notEqual(autoStyle1.styleId, 'diorama_data');
    assert.ok(!ctxScene1.code.includes('s.sparkle('), 'Contextual scenes should avoid generic s.sparkle() slop');

    // Explicit finance topic under otomatis still resolves cleanly
    const financeAuto = resolveAutoStyleForConceptAndScene({
      topik_video: 'Strategi alokasi gaji dan investasi saham bulanan',
      gaya_video: 'otomatis',
    });
    assert.equal(financeAuto.styleId, 'diorama_data');

    // Authentic platform detection must recognize actual mentioned platforms and NEVER inject gemini unless named
    const devPlatforms = detectMentionedPlatforms(
      'Push kode TypeScript dan React kamu ke GitHub lalu deploy ke Vercel atau upload ke TikTok dan YouTube',
      6
    );
    assert.ok(devPlatforms.includes('github'));
    assert.ok(devPlatforms.includes('react'));
    assert.ok(devPlatforms.includes('tiktok'));
    assert.ok(devPlatforms.includes('youtube'));
    assert.ok(!devPlatforms.includes('gemini'), 'Gemini must never be injected when not mentioned');
  });

  it('4. Cyber-Fox Character (rubah_biru_3d): matches turnaround sheet palette & removes glasses', () => {
    const meta = getCharacterMeta('rubah_biru_3d');
    assert.equal(meta.id, 'rubah_biru_3d');
    assert.equal(meta.look?.skin, '#fde6d8');
    assert.equal(meta.look?.hairColor, '#0077ff');
    assert.equal(meta.look?.furSecondaryColor, '#fde047');
    assert.equal(meta.look?.shirt, '#ffffff');
    assert.equal(meta.look?.jacket, '#0b132b');
    assert.equal(meta.look?.jacketOpen, true);
    assert.equal(meta.look?.accentColor, '#00e5ff');
    assert.equal((meta.look as any)?.glasses, undefined, 'Cyber-Fox must not wear glasses blocking its anime eyes');
    assert.equal((meta.look as any)?.__isCyberFox, true);
    assert.equal(meta.look?.__has3DHeadphone, undefined, 'Cyber-Fox must not wear studio headphones');

    const engineCfg = getEngineCharacterConfig('rubah_biru_3d', 'pria', undefined, '3d');
    assert.ok(engineCfg);
    assert.equal(engineCfg.look.species, 'fox');
    assert.equal((engineCfg.look as any).__isCyberFox, true);
  });

  it('5. Otomatis Style Live Demo & 4-Beat 3D Character Kinematics: never aliases otomatis to diorama and produces organic squash-and-stretch', () => {
    assert.equal(resolveSatsetStyleId('otomatis'), 'otomatis');
    const otomatisDemo = getSatsetStyleDemoScenes('otomatis');
    assert.equal(otomatisDemo.length, 4, 'Otomatis live demo should have 4 multi-concept showcase scenes');
    assert.ok(otomatisDemo[0].code.includes('AUTO CONCEPT ENGINE'), 'Otomatis demo scene 1 should showcase AUTO CONCEPT ENGINE hero badge & slash');
    assert.ok(otomatisDemo[1].code.includes('/openshorts-auto-director'), 'Otomatis demo scene 2 should showcase terminal command & checklist');
    assert.ok(otomatisDemo[2].code.includes('X KLIP OTOMATIS'), 'Otomatis demo scene 3 should showcase live counter & 15-clip grid');
    assert.ok(otomatisDemo[3].code.includes('@aishift.id'), 'Otomatis demo scene 4 should showcase 3D host & interactive Follow CTA');

    const scenes = [
      {
        id: 'sc-kin',
        text: 'Ini tools open source yang bikin klip otomatis dari YouTube dan GitHub.',
        emphasis: 'otomatis GitHub',
        duration: 4.0,
        role: 'cta',
      },
    ];
    const meta = { art: 'otomatis', pace: 'energik', character: 'rubah_biru_3d' };
    const fBeat1 = evaluate3DStageFrame(scenes, meta, 0.25, '9:16', 60);
    const fBeat2 = evaluate3DStageFrame(scenes, meta, 1.35, '9:16', 60);
    const fBeat3 = evaluate3DStageFrame(scenes, meta, 2.45, '9:16', 60);

    assert.ok(Number.isFinite(fBeat1.joints.bodySquash));
    assert.ok(Number.isFinite(fBeat1.joints.hairSwayX));
    assert.ok(Number.isFinite(fBeat1.joints.browLift));
    assert.ok(['A', 'E', 'O', 'M', 'rest'].includes(fBeat1.joints.mouthShape));
    assert.notEqual(
      fBeat1.joints.rightShoulderX.toFixed(3),
      fBeat2.joints.rightShoulderX.toFixed(3),
      'Right arm pose must evolve between Beat 1 and Beat 2'
    );
    assert.notEqual(
      fBeat2.joints.leftShoulderX.toFixed(3),
      fBeat3.joints.leftShoulderX.toFixed(3),
      'Left arm pose must evolve between Beat 2 and Beat 3'
    );
  });

  it('6. 3D Showcase & Prop 4-Beat Spring Kinematics: eliminates linear 360 spinning in favor of editorial 3/4 spring turns, tilts, and living pedestals', () => {
    const scenes = [
      {
        id: 'sc-3d-props',
        text: 'Strategi alokasi investasi saham dengan grafik pertumbuhan yang meningkat pesat.',
        emphasis: 'investasi grafik',
        duration: 4.0,
        role: 'solution',
      },
    ];
    const meta = { art: 'diorama_data', pace: 'energik', character: 'rubah_biru_3d' };
    const f0 = evaluate3DStageFrame(scenes, meta, 0.15, '9:16', 60);
    const f1 = evaluate3DStageFrame(scenes, meta, 1.05, '9:16', 60);
    const f2 = evaluate3DStageFrame(scenes, meta, 2.15, '9:16', 60);
    const f3 = evaluate3DStageFrame(scenes, meta, 3.15, '9:16', 60);

    // Verify 4-beat springs and beatPulse
    assert.equal(f1.beats.length, 4);
    assert.ok(f1.beatPulse >= 0 && f1.beatPulse <= 1, `Expected beatPulse in [0, 1], got ${f1.beatPulse}`);

    // Verify 3D Prop uses editorial 3/4 presentation angle instead of unbounded linear spin
    for (const f of [f0, f1, f2, f3]) {
      assert.ok(Math.abs(f.propSpinY) < 1.2, `Prop spinY should stay within editorial 3/4 range, got ${f.propSpinY}`);
      assert.ok(Number.isFinite(f.propTiltX) && Number.isFinite(f.propRollZ));
      assert.ok(f.propScale > 0.2, `Expected positive propScale, got ${f.propScale}`);
      assert.ok(Number.isFinite(f.showcaseTiltX) && Number.isFinite(f.showcaseTiltY) && Number.isFinite(f.showcaseRollZ));
      assert.ok(f.showcaseScale > 0.3);
    }

    // Verify prop orientation and pedestals dynamically evolve across beats
    assert.notEqual(f0.propSpinY.toFixed(3), f2.propSpinY.toFixed(3), 'Prop presentation angle must shift across beats');
    assert.notEqual(f0.propTiltX.toFixed(3), f2.propTiltX.toFixed(3), 'Prop tiltX must shift across beats');
    assert.notEqual(f0.pedestals[1].toFixed(3), f2.pedestals[1].toFixed(3), 'Center pedestal piston must breathe across beats');
  });

  it('7. Anti-Repetition Engine: never repeats scene visual motifs or editorial_motion_grid layouts across an 8-scene project even when project_title contains "Pagi"', () => {
    const project: SatsetProject = {
      id: 'proj-nonrepeat',
      project_title: 'Kenapa Pagi Terasa Berat?',
      topik_video: 'Alasan psikologis kenapa pagi terasa berat dan cara mengatasinya',
      status: 'draft',
      gaya_video: 'editorial_motion_grid',
      tempo: 'energik',
      scenes: [
        { id: 's1', scene_number: 1, narration_text: 'Bangun tidur langsung terasa pusing dan berat?', on_screen_text: 'PAGI BERAT', target_duration_sec: 4 },
        { id: 's2', scene_number: 2, narration_text: 'Ada dua tarikan magnet kuat antara kasur dan fokus.', on_screen_text: 'TARIKAN MAGNET', target_duration_sec: 4 },
        { id: 's3', scene_number: 3, narration_text: 'Kebiasaan cek layar HP bikin dopamin langsung terkuras.', on_screen_text: 'CEK HP', target_duration_sec: 4 },
        { id: 's4', scene_number: 4, narration_text: 'Otak butuh jeda tenang sebelum mengambil keputusan besar.', on_screen_text: 'JEDA OTAK', target_duration_sec: 4 },
        { id: 's5', scene_number: 5, narration_text: 'Mulai dengan tiga langkah sederhana setiap hari.', on_screen_text: '3 LANGKAH', target_duration_sec: 4 },
        { id: 's6', scene_number: 6, narration_text: 'Grafik energi dan produktivitas akan naik drastis.', on_screen_text: 'ENERGI NAIK', target_duration_sec: 4 },
        { id: 's7', scene_number: 7, narration_text: 'Dampaknya juga terasa pada penghasilan dan karir.', on_screen_text: 'HASIL KARIR', target_duration_sec: 4 },
        { id: 's8', scene_number: 8, role: 'cta', narration_text: 'Follow dan simpan video ini supaya tidak lupa!', on_screen_text: 'FOLLOW SEKARANG', target_duration_sec: 4 },
      ],
      createdAt: Date.now(),
    };

    const motifs = project.scenes.map((sc, idx) =>
      detectSceneVisualMotif(sc, project, idx, project.scenes.length)
    );
    const uniqueMotifs = new Set(motifs);
    assert.equal(
      uniqueMotifs.size,
      project.scenes.length,
      `Expected 8 unique motifs across 8 scenes, got ${motifs.join(', ')}`
    );

    const codes = project.scenes.map((sc, idx) =>
      buildContextualSatsetSceneCode(sc, project, idx, project.scenes.length).code
    );
    const uniqueCodes = new Set(codes);
    assert.equal(
      uniqueCodes.size,
      project.scenes.length,
      'Every scene in editorial_motion_grid must generate a distinct choreography'
    );
  });

  it('8. Semantic Character Expressions & Poses: matches spoken narration emotion in both 2D/2.5D and 3D WebGL rigs', () => {
    const stressScene = {
      id: 'sc-stress',
      narration_text: 'Banyak orang pusing, stres, dan burnout karena pekerjaan menumpuk.',
      on_screen_text: 'STRES & BURNOUT',
    };
    const codeScene = {
      id: 'sc-code',
      narration_text: 'Tulis kode React dan TypeScript di terminal untuk deploy otomatis.',
      on_screen_text: 'REACT DEPLOY',
    };
    const ctaScene = {
      id: 'sc-cta',
      role: 'cta',
      narration_text: 'Follow akun ini dan bagikan ke temanmu sekarang!',
      on_screen_text: 'FOLLOW & SHARE',
    };

    const stress2D = selectSemanticPosesForScene(stressScene as any, 'alarm_clock', 'problem', 0);
    assert.equal(stress2D.tone, 'stressed_problem');
    assert.equal(stress2D.beatPoses[0], 'headache');

    const code2D = selectSemanticPosesForScene(codeScene as any, 'checklist_steps', 'body_core_point', 1);
    assert.equal(code2D.tone, 'coding_focus');
    assert.equal(code2D.beatPoses[0], 'sittype');

    const cta2D = selectSemanticPosesForScene(ctaScene as any, 'cta_card', 'cta', 2);
    assert.equal(cta2D.tone, 'victory_cta');
    assert.equal(cta2D.beatPoses[3], 'cheer');

    // Verify 3D semantic pose beats & facial eyeMode
    const stress3DBeats = select3DSemanticPoseBeats(stressScene, 'alarm_clock', 0, false, false);
    assert.equal(stress3DBeats[0], 'headache');
    assert.equal(stress3DBeats[1], 'tired');

    const fStress = evaluate3DStageFrame(
      [{ text: stressScene.narration_text, duration: 4.0 }],
      { art: 'studio_3d_room', character: 'rubah_biru_3d' },
      0.2,
      '9:16',
      60
    );
    assert.equal(fStress.joints.eyeMode, 'tired_half');
    assert.ok(fStress.joints.browTilt < -0.1, `Expected worried negative browTilt, got ${fStress.joints.browTilt}`);
  });

  it('9. Kreatorlab.id Full Style Catalog: registers all 53+ new Kreatorlab styles and serves authentic 4-scene live demos', () => {
    assert.ok(ALL_KREATORLAB_MODULES.length >= 53, `Expected >= 53 Kreatorlab modules, got ${ALL_KREATORLAB_MODULES.length}`);
    assert.ok(SATSET_MODULES.length >= 70, `Expected >= 70 total studio style modules, got ${SATSET_MODULES.length}`);

    const flagshipIds = [
      'editorial_motion_grid',
      'voxelverse',
      'paperworld',
      'worldforge_roma',
      'worldforge_mars',
      'precision',
      'midnight',
      'podcast',
      'mograph_mix',
      'motion3d_mix',
      'editor_mix',
    ];
    for (const id of flagshipIds) {
      const resolved = resolveSatsetStyleId(id);
      const demo = getSatsetStyleDemoScenes(id);
      assert.ok(resolved, `Style ${id} must resolve to a valid engine style ID`);
      assert.equal(demo.length, 4, `Style ${id} must provide a 4-scene live demo`);
      assert.ok(demo[0].code.length > 80, `Style ${id} demo scene 1 must contain rich procedural canvas code`);
    }
  });
});



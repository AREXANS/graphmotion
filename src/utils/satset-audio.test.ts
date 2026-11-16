import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SATSET_TRANSITIONS,
  SATSET_SFX_NAMES,
  getSatsetStyleSfxFlavor,
  mapSatsetSfxToFlavor,
  getSatsetTransitionSfx,
  normalizeSatsetTransitionId,
  resolveSatsetStyleId,
  collectSatsetSfxTimeline,
  getSatsetStyleDemoSfxTimeline,
} from './custom-style-runtime';
import { humanizeIndonesianText, voiceStudio } from './voice-studio';

describe('Satset Theme-Aware SFX, Transition Audio & Voice Over Engine', () => {
  it('resolves all 12 style-specific sonic flavors for canonical and Kreatorlab style IDs', () => {
    // 8bit flavor
    assert.equal(getSatsetStyleSfxFlavor(resolveSatsetStyleId('retro')), '8bit');
    assert.equal(getSatsetStyleSfxFlavor(resolveSatsetStyleId('retro_pixel_rpg')), '8bit');
    assert.equal(getSatsetStyleSfxFlavor(resolveSatsetStyleId('dither')), '8bit');
    assert.equal(getSatsetStyleSfxFlavor(resolveSatsetStyleId('pixelbook')), '8bit');
    assert.equal(getSatsetStyleSfxFlavor('voxelverse'), '8bit');

    // digital flavor
    assert.equal(getSatsetStyleSfxFlavor(resolveSatsetStyleId('futuristik')), 'digital');
    assert.equal(getSatsetStyleSfxFlavor(resolveSatsetStyleId('lumen')), 'digital');

    // editorial & terminal flavors
    assert.equal(getSatsetStyleSfxFlavor(resolveSatsetStyleId('editorial_motion_grid')), 'editorial');
    assert.equal(getSatsetStyleSfxFlavor(resolveSatsetStyleId('uiweb')), 'editorial');
    assert.equal(getSatsetStyleSfxFlavor(resolveSatsetStyleId('kinetik')), 'terminal');

    // studio3d, mechanical, cinema, clay, liquid, retro_tape flavors
    assert.equal(getSatsetStyleSfxFlavor('studio_3d_room'), 'studio3d');
    assert.equal(getSatsetStyleSfxFlavor('precision'), 'mechanical');
    assert.equal(getSatsetStyleSfxFlavor('worldforge_roma'), 'cinema');
    assert.equal(getSatsetStyleSfxFlavor('stopmotion_clay'), 'clay');
    assert.equal(getSatsetStyleSfxFlavor('aurora'), 'liquid');
    assert.equal(getSatsetStyleSfxFlavor('kaset'), 'retro_tape');

    // paper flavor
    assert.equal(getSatsetStyleSfxFlavor(resolveSatsetStyleId('kolase')), 'paper');
    assert.equal(getSatsetStyleSfxFlavor(resolveSatsetStyleId('papercut')), 'paper');
    assert.equal(getSatsetStyleSfxFlavor('paperworld'), 'paper');

    // chalk flavor
    assert.equal(getSatsetStyleSfxFlavor(resolveSatsetStyleId('kapur')), 'chalk');
    assert.equal(getSatsetStyleSfxFlavor(resolveSatsetStyleId('papan_kapur')), 'chalk');
    assert.equal(getSatsetStyleSfxFlavor(resolveSatsetStyleId('sketsa')), 'chalk');

    // liquid / ambient flavor
    assert.equal(getSatsetStyleSfxFlavor(resolveSatsetStyleId('kuas')), 'liquid');
    assert.equal(getSatsetStyleSfxFlavor(resolveSatsetStyleId('tenang')), 'liquid');
  });

  it('remaps SFX cues distinctly across style flavors so styles do not sound identical', () => {
    const [retroPopName] = mapSatsetSfxToFlavor('pop', '8bit', 1, 1);
    assert.equal(retroPopName, 'blip');

    const [retroDingName] = mapSatsetSfxToFlavor('ding', '8bit', 1, 1);
    assert.equal(retroDingName, 'coin');

    const [digitalTickName] = mapSatsetSfxToFlavor('tick', 'digital', 1, 1);
    assert.equal(digitalTickName, 'beep');

    const [editorialPopName] = mapSatsetSfxToFlavor('pop', 'editorial', 1, 1);
    assert.equal(editorialPopName, 'cursor_click');

    const [studioPopName] = mapSatsetSfxToFlavor('pop', 'studio3d', 1, 1);
    assert.equal(studioPopName, 'card_slide');

    const [mechPopName] = mapSatsetSfxToFlavor('pop', 'mechanical', 1, 1);
    assert.equal(mechPopName, 'snap');

    const [termPopName] = mapSatsetSfxToFlavor('pop', 'terminal', 1, 1);
    assert.equal(termPopName, 'type');

    const [paperPopName] = mapSatsetSfxToFlavor('pop', 'paper', 1, 1);
    assert.equal(paperPopName, 'paper');

    const [chalkTickName] = mapSatsetSfxToFlavor('tick', 'chalk', 1, 1);
    assert.equal(chalkTickName, 'chalk');

    const [softBoomName] = mapSatsetSfxToFlavor('boom', 'soft', 1, 1);
    assert.equal(softBoomName, 'thud');
  });

  it('normalizes all Indonesian UI transition IDs to canonical satsetmotion.id transitions with valid SFX pairs', () => {
    const pairs: Array<[string, string]> = [
      ['match_morph', 'match-morph'],
      ['cinema_whip', 'cinema-whip'],
      ['luma_dissolve', 'luma-dissolve'],
      ['depth_focus', 'depth-focus'],
      ['editorial_split', 'editorial-split'],
      ['geser_kiri', 'whip-left'],
      ['geser_kanan', 'whip-right'],
      ['geser_atas', 'whip-up'],
      ['geser_bawah', 'whip-down'],
      ['zoom_tembus', 'zoom'],
      ['putar', 'spin'],
      ['lingkaran', 'iris'],
      ['sapu_miring', 'wipe'],
      ['sapuan_warna', 'swipe'],
      ['glitch', 'glitch'],
      ['kilas_kamera', 'flash'],
      ['tirai', 'blinds'],
      ['jatuh_membal', 'drop'],
      ['fade_lembut', 'fade'],
      ['celuk_gelap', 'dip'],
      ['menyusut', 'blur'],
      ['menyambung', 'sambung'],
    ];

    for (const [idUi, expectedCanonical] of pairs) {
      const normalized = normalizeSatsetTransitionId(idUi);
      assert.equal(normalized, expectedCanonical);
      const sfxList = getSatsetTransitionSfx(normalized);
      assert.ok(Array.isArray(sfxList), `Expected sfx array for ${normalized}`);
      if (normalized !== 'sambung') {
        assert.ok(sfxList.length >= 1, `Expected non-empty transition sfx for ${normalized}`);
      }
    }
    assert.equal(SATSET_TRANSITIONS.length, 22);
    assert.ok(SATSET_SFX_NAMES.length >= 43);
  });

  it('collects complete timeline SFX events including transitions, word ticks, and in-scene s.sfx with theme flavor', () => {
    const retroDemo = getSatsetStyleDemoSfxTimeline('retro_pixel_rpg', {
      transitionOverride: 'geser_kiri',
    });
    assert.ok(Math.abs(retroDemo.totalDur - 16.8) < 0.01, `Expected 16.8s total duration for 4x4.2s demo, got ${retroDemo.totalDur}`);
    assert.ok(retroDemo.events.length > 10, 'Expected rich SFX events for 4-scene retro demo');
    assert.ok(
      retroDemo.events.every((e: any) => e.flavor === '8bit'),
      'Expected all events in retro_pixel_rpg to carry 8bit flavor'
    );
    // Transition whip-left has whoosh + boom around scene boundaries t=4.2, t=8.4, t=12.6
    const hasTransitionWhoosh = retroDemo.events.some(
      (e: any) => e.name === 'whoosh' && Math.abs(e.t - 4.0) < 0.05
    );
    assert.ok(hasTransitionWhoosh, 'Expected pre-cut whoosh at t=4.0s before 4.2s cut');

    // Test custom scenes with explicit s.sfx() calls and paper flavor
    const paperEvents = collectSatsetSfxTimeline(
      [
        {
          text: 'Langkah pertama mulai sekarang',
          emphasis: 'pertama',
          theme: 'paper',
          duration: 3,
          code: `s.sfx('sparkle', 0.5, 0.8); s.sfx('pop', 1.2, 0.9);`,
        },
        {
          text: 'Terus konsisten setiap hari',
          emphasis: 'konsisten',
          theme: 'dusk',
          duration: 3,
          code: `s.sfx('ding', 0.6, 0.7);`,
        },
      ],
      { look: '2d', art: 'kolase', pace: 'energik', caption: 'pop', transition: 'iris' } as any
    );
    assert.ok(paperEvents.length > 5);
    assert.ok(paperEvents.every((e: any) => e.flavor === 'paper'));
    // In 'paper' flavor, 'pop' is remapped to 'paper' rustle!
    assert.ok(paperEvents.some((e: any) => e.name === 'paper'));
    assert.ok(paperEvents.some((e: any) => e.name === 'sparkle'));
    // Iris transition at t=3.0s has swipe at t=2.8s
    assert.ok(paperEvents.some((e: any) => e.name === 'swipe' && Math.abs(e.t - 2.8) < 0.05));
  });

  it('resolves Voice Over sample fallbacks and humanizes Indonesian narration text', () => {
    assert.equal(voiceStudio.getSampleUrlForVoice('fenrir'), '/audio/samples/fenrir_sample.mp3');
    assert.equal(voiceStudio.getSampleUrlForVoice('charon'), '/audio/samples/charon_sample.mp3');
    assert.equal(voiceStudio.getSampleUrlForVoice('kore'), '/audio/samples/kore_sample.mp3');
    assert.equal(voiceStudio.getSampleUrlForVoice('aoede'), '/audio/samples/aoede_sample.mp3');

    const humanized = humanizeIndonesianText('Gak usah nunggu mood 100%, mulai dalam 2 menit!');
    assert.ok(humanized.spokenText.includes('nggak'));
    assert.ok(humanized.spokenText.includes('seratus persen') || humanized.spokenText.includes('100 persen'));
    assert.ok(humanized.spokenText.includes('dua menit'));

    // Scene audio cache must never return static voice sample preview MP3s for scene scripts
    assert.equal(voiceStudio.getCachedSceneAudio('Naskah scene pertama tentang produk digital', 'fenrir'), null);
  });

  it('keeps automatic style transition pools smooth by excluding glitch, flash, blinds, and drop', async () => {
    const { SATSET_STYLE_TRANSITION_POOLS } = await import('./satset-renderer-engine');
    const harsh = new Set(['glitch', 'flash', 'blinds', 'drop']);
    for (const [styleId, pool] of Object.entries(SATSET_STYLE_TRANSITION_POOLS)) {
      const list = pool as string[];
      assert.ok(Array.isArray(list) && list.length > 0, `Pool for ${styleId} must be non-empty`);
      for (const tid of list) {
        assert.equal(
          harsh.has(tid),
          false,
          `Auto transition pool for "${styleId}" should not contain jarring transition "${tid}"`
        );
      }
    }
  });

  it('captures conditional mid-scene s.sfx() cues via multi-timestamp probing without dropping cues', () => {
    const events = collectSatsetSfxTimeline(
      [
        {
          text: 'Test audio probe multi timestamp',
          emphasis: 'probe',
          theme: 'paper',
          duration: 3.5,
          code: `
            if (s.t >= 0.8) { s.sfx('cash', 0.85, 0.9); }
            if (s.t >= 2.0) { s.sfx('sparkle', 2.05, 0.05); }
          `,
        },
      ],
      { look: '2d', art: 'scribble3d', pace: 'energik', caption: 'pop' } as any
    );

    const hasCash = events.some((e: any) => e.name === 'cash');
    const sparkleEvt = events.find((e: any) => e.name === 'sparkle');
    assert.ok(hasCash, 'Expected conditional mid-scene s.sfx("cash") to be captured across timeline probes');
    assert.ok(sparkleEvt, 'Expected conditional late-scene s.sfx("sparkle") to be captured across timeline probes');
    assert.ok(sparkleEvt.gain >= 0.14, `Expected audible minimum SFX gain >= 0.14, got ${sparkleEvt.gain}`);
  });

  it('adapts 3D character pose, facial expression, and syllable lip-sync to spoken narration and generates style-specific Remotion SFX', async () => {
    const { evaluateCreator3DKinematics } = await import('./creator-3d-kinematics');
    const { generateRemotionCode } = await import('./remotion-generator');

    // 1. Stressed / headache narration ("pusing") -> worried frown (mouthSmile < 0) & furrowed brows
    const worriedState = evaluateCreator3DKinematics('headache', 0.25, {
      captionWords: [{ word: 'pusing', start: 0.05, end: 0.55, emphasis: true }],
      speaking: true,
    });
    assert.ok(worriedState.mouthSmile < -0.1, `Expected worried frown (mouthSmile < -0.1) for "pusing", got ${worriedState.mouthSmile}`);
    assert.ok(worriedState.mouthOpen > 0.15, 'Expected open mouth articulation while speaking "pusing"');

    // 2. Shocked narration ("kaget") -> wide_shock eyes
    const shockedState = evaluateCreator3DKinematics('scared', 0.25, {
      captionWords: [{ word: 'kaget', start: 0.05, end: 0.55, emphasis: true }],
      speaking: true,
    });
    assert.equal(shockedState.eyeMode, 'wide_shock');

    // 3. Excited / victory narration ("berhasil") -> warm smile & happy_arc
    const happyState = evaluateCreator3DKinematics('cheer', 0.25, {
      captionWords: [{ word: 'berhasil', start: 0.05, end: 0.55, emphasis: true }],
      speaking: true,
    });
    assert.ok(happyState.mouthSmile > 0.4, `Expected warm smile for "berhasil", got ${happyState.mouthSmile}`);

    // 4. Remotion code generator emits distinct SFX for different styles
    const baseScene = {
      scene_id: 1,
      duration_seconds: 3.5,
      narration_text: 'Langkah pertama membangun sistem otomatis.',
      on_screen_text: 'SISTEM OTOMATIS',
      emphasis_words: ['otomatis'],
    };
    const filesEditorial = generateRemotionCode({
      topik_video: 'Demo',
      gaya_video: 'editorial_motion_grid',
      scenes: [{ ...baseScene, visualModule: 'editorial_motion_grid' }],
    } as any);
    const filesPaper = generateRemotionCode({
      topik_video: 'Demo',
      gaya_video: 'paperworld',
      scenes: [{ ...baseScene, visualModule: 'paperworld' }],
    } as any);
    const compEditorial = filesEditorial.compositionTsx || '';
    const compPaper = filesPaper.compositionTsx || '';
    assert.notEqual(compEditorial, compPaper, 'Expected different Remotion SFX/composition output for editorial_motion_grid vs paperworld');
    assert.ok(compEditorial.includes('cursor_click.mp3'), 'Expected editorial_motion_grid Remotion code to include cursor_click.mp3');
    assert.ok(compPaper.includes('paper_rip.mp3'), 'Expected paperworld Remotion code to include paper_rip.mp3');
  });
});


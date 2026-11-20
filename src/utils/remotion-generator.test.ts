import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRemotionTimeline,
  generateSubtitleTokens,
  generateRemotionCode,
  getResolutionForAspectRatio,
  buildPromptBlueprint,
  parseAndValidateAIBlueprint,
  buildNarasiPrompt,
  buildAnimasiPrompt,
  SAMPLE_AI_NARASI_JSON,
} from './remotion-generator.ts';
import { type SatsetProject } from '../types/satset.ts';

test('calculateRemotionTimeline accurately produces frame offsets at 30 FPS', () => {
  const scenes = [
    { target_duration_sec: 3 }, // 90 frames
    { target_duration_sec: 5 }, // 150 frames
    { target_duration_sec: 2 }, // 60 frames
  ];

  const { items, totalFrames } = calculateRemotionTimeline(scenes, 30);
  assert.equal(totalFrames, 300); // 10 seconds total
  assert.equal(items.length, 3);

  // Scene 1
  assert.equal(items[0].fromFrame, 0);
  assert.equal(items[0].durationInFrames, 90);
  assert.equal(items[0].toFrame, 90);

  // Scene 2
  assert.equal(items[1].fromFrame, 90);
  assert.equal(items[1].durationInFrames, 150);
  assert.equal(items[1].toFrame, 240);

  // Scene 3
  assert.equal(items[2].fromFrame, 240);
  assert.equal(items[2].durationInFrames, 60);
  assert.equal(items[2].toFrame, 300);
});

test('generateSubtitleTokens marks emphasized words correctly', () => {
  const script = 'Kunci sukses adalah konsisten setiap hari!';
  const emphasis = ['sukses', 'konsisten'];

  const tokens = generateSubtitleTokens(script, emphasis);
  assert.equal(tokens.length, 6);

  const suksesToken = tokens.find((t) => t.word === 'sukses');
  assert(suksesToken !== undefined);
  assert.equal(suksesToken?.isEmphasis, true);

  const konsistenToken = tokens.find((t) => t.word === 'konsisten');
  assert(konsistenToken !== undefined);
  assert.equal(konsistenToken?.isEmphasis, true);

  const hariToken = tokens.find((t) => t.word === 'hari!');
  assert(hariToken !== undefined);
  assert.equal(hariToken?.isEmphasis, false);
});

test('getResolutionForAspectRatio returns correct dimensions for standard formats', () => {
  assert.deepEqual(getResolutionForAspectRatio('9:16'), { width: 1080, height: 1920 });
  assert.deepEqual(getResolutionForAspectRatio('16:9'), { width: 1920, height: 1080 });
  assert.deepEqual(getResolutionForAspectRatio('1:1'), { width: 1080, height: 1080 });
});

test('buildPromptBlueprint contains required Remotion guidelines and parameters', () => {
  const prompt = buildPromptBlueprint({
    topik_video: 'Kebiasaan Pagi',
    content_type: 'motivasi',
    language: 'id',
    target_duration_sec: 60,
    gaya_video: 'scribble3d',
    aspect_ratio: '9:16',
    tempo: 'energik',
  });

  assert(prompt.includes('Kebiasaan Pagi'));
  assert(/scribble 3d/i.test(prompt));
  assert(prompt.includes('Buat 5 ide video pendek'));
  assert(prompt.includes('visualStyle'));
  assert(prompt.includes('ATAS / BESAR / BAWAH'));
});

test('buildPromptBlueprint dynamically renders KARTU GAYA, Brand Palette, who/poses, and non-repetitive Bahan wajib per ide', () => {
  const prompt = buildPromptBlueprint({
    topik_video: 'psikologi',
    content_type: 'motivasi',
    language: 'id',
    target_duration_sec: 45,
    gaya_video: 'papercut',
    character: 'auto',
    warna_brand: '#ff6a13',
    brand_secondary_color: '#1e3a8a',
    brand_accent_color: '#ffc93c',
    tempo: 'energik',
  });

  assert(prompt.includes('Gaya video: Paper Cutout'));
  assert(prompt.includes('Gaya animasi "Paper Cutout": KARTU GAYA'));
  assert(prompt.includes('Belum ada tokoh tetap: semua orang dirakit engine dari Character Builder'));
  assert(prompt.includes('meditate - duduk bersila'));
  assert(prompt.includes('utama #ff6a13, kedua #1e3a8a, aksen #ffc93c'));
  assert(prompt.includes('Topik / kata kunci: psikologi. Dekati topik ini dari sudut yang berbeda di setiap ide.'));
  assert(prompt.includes('Durasi 30-45 detik.'));
  assert(!prompt.includes('lensa metafora "kunci & pintu"'));
  assert(!prompt.includes('Jangan Paksa Pintu Terbuka'));
});

test('parseAndValidateAIBlueprint successfully parses user JSON blueprint with 5 ideas', () => {
  const rawJson = JSON.stringify({
    ideas: [
      {
        title: 'Kenapa Pagi Terasa Berat?',
        hook: 'KATANYA ORANG SUKSES / BANGUN PAGI / PADAHAL ADA YANG SALAH',
        angle: 'Banyak orang mengira rasa malas pagi hilang kalau kita menunggu semangat datang. Itu keliru.',
        visualStyle: 'scribble 3D + kontras hangat + orange kuning + kamera depan + magnet ganda',
      },
      {
        title: 'Jangan Paksa Pintu Terbuka',
        hook: 'TUNGGU DULU / JANGAN PAKSA / ADA ALASANNYA',
        angle: 'Pernah merasa sudah berusaha, tapi hasilnya belum juga datang? Kuncinya ada di konsistensi.',
        visualStyle: 'scribble 3D + kunci pintu',
      },
    ],
  });

  const res = parseAndValidateAIBlueprint(rawJson);
  assert.equal(res.success, true);
  assert.equal(res.project?.project_title, 'Kenapa Pagi Terasa Berat?');
  assert.equal(res.project?.idea_concepts?.length, 2);
  assert.equal(res.project?.scenes?.length, 3);
  assert.equal(res.project?.scenes?.[0].hookText, 'KATANYA ORANG SUKSES / BANGUN PAGI / PADAHAL ADA YANG SALAH');
});

test('parseAndValidateAIBlueprint also supports scenes fallback array', () => {
  const rawJson = JSON.stringify({
    project_title: 'Disiplin Harian',
    scenes: [
      {
        scene_number: 1,
        role: 'hook',
        target_duration_sec: 4,
        narration_text: 'Jangan tunggu besok untuk mulai konsisten.',
        on_screen_text: 'MULAI HARI INI!',
        emphasis_words: ['Mulai', 'hari ini'],
      },
    ],
  });

  const res = parseAndValidateAIBlueprint(rawJson);
  assert.equal(res.success, true);
  assert.equal(res.project?.project_title, 'Disiplin Harian');
  assert.equal(res.project?.scenes?.length, 1);
  assert.equal(res.project?.gaya_video, undefined);
  assert.equal(res.project?.aspect_ratio, undefined);
});

test('generateRemotionCode produces valid tsx structure and instructions', () => {
  const dummyProject: SatsetProject = {
    id: 'test-proj',
    project_title: 'Disiplin Itu Kekuatan',
    status: 'draft',
    start_mode: 'topic',
    language: 'id',
    content_type: 'motivasi',
    topik_video: 'Disiplin',
    target_duration_sec: 10,
    fps: 30,
    gaya_video: 'scribble3d',
    character: 'none',
    warna_brand: '#2563EB',
    tempo: 'energik',
    aspect_ratio: '9:16',
    bgm_style: 'energetic_lofi',
    bgm_volume: 0.5,
    auto_ducking: true,
    ducking_level: 0.15,
    voice_option: 'budi',
    subtitle_style: 'satsetYellow',
    watermark: '@satset.id',
    scenes: [
      {
        id: 's1',
        scene_number: 1,
        role: 'hook',
        target_duration_sec: 5,
        narration_text: 'Motivasi itu cuma pemantik, disiplin yang bawa kamu sampai garis akhir.',
        on_screen_text: 'Kenapa motivasi selalu hilang?',
        emphasis_words: ['motivasi', 'disiplin'],
        visual_animation: {
          layout: 'centered_title_with_floating_icons',
          remotion_animation: 'spring_pop_in',
          asset_elements: ['cube_3d'],
        },
        sfx: {
          file: 'pop_ding.mp3',
          type: 'pop',
          play_at_second: 0.0,
        },
      },
    ],
    createdAt: Date.now(),
  };

  const { compositionTsx, rootTsx, instructions, blueprintJson } = generateRemotionCode(dummyProject, 30);
  assert(compositionTsx.includes('SatsetComposition'));
  assert(compositionTsx.includes('Sequence'));
  assert(rootTsx.includes('Composition'));
  assert(rootTsx.includes('SatsetMotionVideo'));
  assert(instructions.includes('npx remotion preview'));
  assert(blueprintJson.includes('project_title'));
});

test('buildNarasiPrompt generates complete Diorama Data prompt with 8 scenes specification', () => {
  const prompt = buildNarasiPrompt(
    {
      project_title: 'Kenapa Pagi Terasa Berat?',
      gaya_video: 'diorama_data',
      target_duration_sec: 60,
    },
    'jangan lupa follow'
  );

  assert(prompt.includes('penulis naskah video pendek motivasi'));
  assert(prompt.includes('Diorama Data'));
  assert(prompt.includes('8 scene'));
  assert(prompt.includes('jangan lupa follow'));
  assert(prompt.includes('DIORAMA DATA: seluruh video terjadi di SATU papan'));
  assert(prompt.includes('WAJIB 3D SUNGGUHAN'));
});

test('buildNarasiPrompt adapts to non-diorama styles without forcing Diorama spec', () => {
  const prompt = buildNarasiPrompt(
    {
      project_title: 'Peta Bintang Malam',
      gaya_video: 'rasi',
      character: 'none',
      aspect_ratio: '16:9',
      target_duration_sec: 45,
    },
    'subscribe untuk part 2'
  );

  assert(!prompt.includes('DIORAMA DATA: seluruh video terjadi di SATU papan'));
  assert(prompt.includes('16:9'));
  assert(prompt.includes('TANPA KARAKTER'));
  assert(prompt.includes('subscribe untuk part 2'));
});

test('buildAnimasiPrompt resolves style, finishing, landscape layout, and anti-JSX rules', () => {
  const project: Partial<SatsetProject> = {
    project_title: 'Jaringan AI Masa Depan',
    gaya_video: 'futuristik',
    aspect_ratio: '16:9',
    character: 'none',
    tempo: 'energik',
    scenes: [
      {
        id: 's1',
        scene_number: 1,
        role: 'hook',
        target_duration_sec: 6,
        narration_text: 'Dunia teknologi bergerak lebih cepat dari yang kamu kira.',
        on_screen_text: 'TEKNOLOGI CEPAT',
        emphasis_words: ['cepat'],
        visual: 'Jaring hologram berdenyut di tengah layar dengan node data bercahaya.',
      },
      {
        id: 's2',
        scene_number: 2,
        role: 'body_core_point',
        target_duration_sec: 6,
        narration_text: 'Satu algoritma bisa menghubungkan jutaan titik data dalam sekejap.',
        on_screen_text: 'JUTAAN DATA',
        emphasis_words: ['jutaan'],
        visual: 'Aliran partikel data menghubungkan dua server 3D di papan hologram.',
      },
    ],
  };

  const prompt = buildAnimasiPrompt(project, 1, 2);
  assert(prompt.includes('1280 x 720'));
  assert(prompt.includes('MENYALA (glow)'));
  assert(prompt.includes('TANPA KARAKTER MANUSIA'));
  assert(!prompt.includes('DIORAMA DATA'));
  assert(prompt.includes('// ===== SCENE 1 ====='));
  assert(prompt.includes('DILARANG menulis `import ...`, `export ...`, JSX/React'));
  assert(prompt.includes('>>> [Scene 1]'));
  assert(prompt.includes('>>> [Scene 2]'));
});

test('parseAndValidateAIBlueprint correctly parses SAMPLE_AI_NARASI_JSON with full ~60s narration word count', () => {
  const res = parseAndValidateAIBlueprint(SAMPLE_AI_NARASI_JSON);
  assert.equal(res.success, true);
  assert.equal(res.project?.scenes?.length, 8);
  assert.equal(res.project?.seo?.hashtags?.length, 4);
  assert.equal(res.project?.scenes?.[0].camera, 'push');
  assert.equal(res.project?.scenes?.[0].theme, 'paper');
  assert.equal(res.project?.scenes?.[0].headline, 'KATANYA ORANG SUKSES / BANGUN PAGI / PADAHAL ADA YANG SALAH');

  const totalWords = (res.project?.scenes || []).reduce((sum, s) => {
    const words = String(s.narration_text || '').trim().split(/\s+/).filter(Boolean).length;
    return sum + words;
  }, 0);
  assert(totalWords >= 145, `Expected >= 145 words for 60s sample, got ${totalWords}`);
});

import { synchronizeProjectPipeline } from './pipeline-sync.ts';
import {
  CHARACTER_CATALOG,
  CHARACTER_DEMO_POSES,
  TRANSITION_CATALOG,
  resolveCharacterOption,
  getEngineCharacterConfig,
} from './character-catalog.ts';

test('buildNarasiPrompt at 60s targets 8 scenes and 18-23 kata/scene without 4-12 kata contradiction', () => {
  const prompt = buildNarasiPrompt(
    {
      project_title: 'Kenapa Fokus Mudah Buyar?',
      gaya_video: 'scribble3d',
      character: 'cewek-cadar',
      tempo: 'energik',
      target_duration_sec: 60,
    },
    'subscribe sekarang'
  );

  assert(prompt.includes('8 scene'));
  assert(prompt.includes('18-23 kata'));
  assert(prompt.includes('MINIMAL 144 kata'));
  assert(!prompt.includes('4-12 kata'));
  assert(prompt.toLowerCase().includes('cewek bercadar'));
});

test('synchronizeProjectPipeline yields ~50-65s duration for SAMPLE_AI_NARASI_JSON at 60s target', () => {
  const res = parseAndValidateAIBlueprint(SAMPLE_AI_NARASI_JSON);
  assert(res.success && res.project);
  const synced = synchronizeProjectPipeline({
    ...res.project,
    id: res.project.id || 'test-sync-60s',
    target_duration_sec: 60,
  } as SatsetProject);
  const totalSec = synced.scenes.reduce((acc, s) => acc + (s.target_duration_sec || 0), 0);
  assert(totalSec >= 50 && totalSec <= 68, `Expected ~50-68s synced duration, got ${totalSec}s`);
});

test('character catalog provides rich non-emoji archetypes, 22 poses, and 23 transitions', () => {
  assert(CHARACTER_CATALOG.length >= 18);
  assert.equal(CHARACTER_DEMO_POSES.length, 22);
  assert.equal(TRANSITION_CATALOG.length, 23);

  assert.equal(resolveCharacterOption('cewek-cadar'), 'cewek_bercadar');
  assert.equal(resolveCharacterOption('cowok-muslim'), 'cowok_muslim');
  assert.equal(resolveCharacterOption('stick-samping'), 'stickman_samping');

  const niqabCfg = getEngineCharacterConfig('cewek-cadar');
  assert.equal(niqabCfg?.gender, 'female');
  assert.equal(niqabCfg?.look.niqab, true);
  assert.equal(niqabCfg?.look.khimar, true);

  const muslimCfg = getEngineCharacterConfig('cowok-muslim');
  assert.equal(muslimCfg?.gender, 'male');
  assert.equal(muslimCfg?.look.koko, true);
  assert(Boolean(muslimCfg?.look.peci));
});

test('generateRemotionCode outputs genuine Studio3DRoomScene, EditorialMotionGridScene, Creator3DNarratorRig, and avoids generic AI-slop fallback cards', () => {
  const baseProject: SatsetProject = {
    id: 'test-studio-3d',
    project_title: 'Kenapa Pagi Terasa Berat?',
    status: 'draft',
    start_mode: 'topic',
    language: 'id',
    content_type: 'motivasi',
    topik_video: 'Kebiasaan Pagi',
    target_duration_sec: 16,
    fps: 30,
    gaya_video: 'studio_3d_room',
    character: 'kreator_3d_studio',
    warna_brand: '#ff471a',
    tempo: 'energik',
    aspect_ratio: '9:16',
    bgm_style: 'upbeat_synth',
    bgm_volume: 0.5,
    auto_ducking: true,
    ducking_level: 0.15,
    voice_option: 'charon',
    subtitle_style: 'auto',
    watermark: 'Graph Motion',
    scenes: [
      {
        id: 'sc-1',
        scene_number: 1,
        role: 'hook',
        target_duration_sec: 4,
        narration_text: 'Katanya orang sukses selalu bangun pagi penuh semangat.',
        on_screen_text: 'KATANYA ORANG SUKSES / BANGUN PAGI',
        emphasis_words: ['semangat'],
        visualModule: 'studio_3d_room',
      },
      {
        id: 'sc-2',
        scene_number: 2,
        role: 'point',
        target_duration_sec: 4,
        narration_text: 'Padahal otak butuh transisi sebelum langsung kerja keras.',
        on_screen_text: 'TRANSISI / FOKUS PAGI',
        emphasis_words: ['transisi'],
        visualModule: 'editorial_motion_grid',
      },
    ],
    createdAt: Date.now(),
  };

  const { compositionTsx } = generateRemotionCode(baseProject, 30);
  assert(compositionTsx.includes('Studio3DRoomScene'));
  assert(compositionTsx.includes('EditorialMotionGridScene'));
  assert(compositionTsx.includes('Creator3DNarratorRig'));
  assert(compositionTsx.includes('EditorialSubtitleOverlay'));
  assert(compositionTsx.includes('CameraRig'));
  assert(!compositionTsx.includes('Karakter:'), 'Must not emit raw Karakters/prose fallback card');
  assert(!compositionTsx.includes('scene.visualDescription'), 'Must not dump raw scene.visualDescription strings onto canvas');
});

test('generateRemotionCode supports True 3D WebGL (@remotion/three) output mode', () => {
  const project3d: SatsetProject = {
    id: 'p-3d-test',
    project_title: 'GraphMotion 3D Showcase',
    title: 'GraphMotion 3D Showcase',
    aspect_ratio: '9:16',
    gaya_video: 'studio_3d_room',
    render_dimension: '3d',
    character: 'creator_hoodie',
    target_duration_sec: 12,
    durationSeconds: 12,
    scenes: [
      {
        id: 'sc-1',
        scene_number: 1,
        role: 'hook',
        target_duration_sec: 4,
        narration_text: 'Stop pakai template generik! Saatnya bikin animasi 3D studio.',
        on_screen_text: 'STOP TEMPLATE GENERIK / STUDIO 3D',
        emphasis_words: ['3D', 'studio'],
        visualModule: 'studio_3d_room',
      },
      {
        id: 'sc-2',
        scene_number: 2,
        role: 'point',
        target_duration_sec: 4,
        narration_text: 'Setiap scene punya depth, pencahayaan PBR, dan karakter chibi terhubung.',
        on_screen_text: 'PBR LIGHTING / RIG ANATOMIS',
        emphasis_words: ['PBR', 'chibi'],
        visualModule: 'editorial_motion_grid',
      },
      {
        id: 'sc-3',
        scene_number: 3,
        role: 'cta',
        target_duration_sec: 4,
        narration_text: 'Follow sekarang untuk tutorial Remotion 3D berikutnya.',
        on_screen_text: 'FOLLOW SEKARANG / KREATORLAB',
        emphasis_words: ['Follow'],
        visualModule: 'studio_3d_room',
      },
    ],
    createdAt: Date.now(),
  };

  const { compositionTsx, blueprintJson } = generateRemotionCode(project3d, 30, {
    renderDimension: '3d',
  });
  assert(compositionTsx.includes("from '@remotion/three'"), '3D mode must import @remotion/three');
  assert(compositionTsx.includes('<ThreeCanvas'), '3D mode must mount <ThreeCanvas>');
  assert(compositionTsx.includes('ThreeCameraRig'), '3D mode must include ThreeCameraRig');
  assert(compositionTsx.includes('PedestalWithProp3D'), '3D mode must include PedestalWithProp3D');
  assert(compositionTsx.includes('Creator3DNarratorRig'), '3D mode must include Creator3DNarratorRig');
  assert(compositionTsx.includes('EditorialSubtitleOverlay'), '3D mode must include calibrated EditorialSubtitleOverlay');
  assert(blueprintJson.includes('"render_dimension": "3d"'), 'Blueprint JSON must record render_dimension 3d');
});

test('generateRemotionCode strictly enforces Remotion 4 motion standards across both 2.5D and 3D TSX outputs', () => {
  const sampleProj: SatsetProject = {
    id: 'p-remotion4-strict',
    project_title: 'Audit Remotion 4',
    title: 'Audit Remotion 4',
    aspect_ratio: '9:16',
    gaya_video: 'studio_3d_room',
    character: 'kreator_3d_studio',
    target_duration_sec: 12,
    durationSeconds: 12,
    scenes: [
      {
        id: 'sc-1',
        scene_number: 1,
        role: 'hook',
        target_duration_sec: 4,
        narration_text: 'Animasi Remotion 4 harus selalu terasa hidup dan berpegas.',
        on_screen_text: 'ANIMASI HIDUP / REMOTION 4',
        emphasis_words: ['hidup', 'berpegas'],
        visualModule: 'studio_3d_room',
      },
      {
        id: 'sc-2',
        scene_number: 2,
        role: 'cta',
        target_duration_sec: 4,
        narration_text: 'Simpan dan render sekarang dengan 30 FPS halus.',
        on_screen_text: 'RENDER 30 FPS / SEKARANG',
        emphasis_words: ['render'],
        visualModule: 'editorial_motion_grid',
      },
    ],
    createdAt: Date.now(),
  };

  for (const dim of ['2d', '3d'] as const) {
    const { compositionTsx, rootTsx } = generateRemotionCode(sampleProj, 30, {
      renderDimension: dim,
    });

    assert.ok(!compositionTsx.includes('Math.random'), `${dim} TSX must never use Math.random`);
    assert.ok(!compositionTsx.includes('animate-'), `${dim} TSX must never use Tailwind animate-*`);
    assert.ok(!compositionTsx.includes('setTimeout'), `${dim} TSX must never use setTimeout`);
    assert.ok(!compositionTsx.includes('setInterval'), `${dim} TSX must never use setInterval`);
    assert.ok(compositionTsx.includes('@remotion/transitions'), `${dim} TSX must use @remotion/transitions`);
    assert.ok(compositionTsx.includes('TransitionSeries'), `${dim} TSX must render TransitionSeries`);
    assert.ok(compositionTsx.includes('@remotion/google-fonts/Baloo2'), `${dim} TSX must load Baloo2`);
    assert.ok(compositionTsx.includes('@remotion/google-fonts/PlusJakartaSans'), `${dim} TSX must load PlusJakartaSans`);
    assert.ok(compositionTsx.includes("extrapolateLeft: 'clamp'"), `${dim} TSX interpolate must clamp`);
    assert.ok(compositionTsx.includes("extrapolateRight: 'clamp'"), `${dim} TSX interpolate must clamp`);
    assert.ok(compositionTsx.includes('PoseKey'), `${dim} TSX must include typed PoseKey`);
    assert.ok(rootTsx.includes('calculateMetadata'), `${dim} Root.tsx must include calculateMetadata`);
    assert.ok(rootTsx.includes('calcTotalFrames'), `${dim} Root.tsx must compute overlap-adjusted duration`);

    // Verify EditorialSubtitleOverlay sits OUTSIDE </CameraRig>
    const closeCameraIdx = compositionTsx.indexOf('</CameraRig>');
    const captionCallIdx = compositionTsx.indexOf('<EditorialSubtitleOverlay', closeCameraIdx);
    assert.ok(closeCameraIdx > 0 && captionCallIdx > closeCameraIdx, `${dim} Captions must sit outside </CameraRig>`);
  }
});

import {
  buildSingleSceneRevisionPrompt,
  buildThumbnailAiPrompt,
  buildSeoMetadataPrompt,
} from './remotion-generator.ts';

test('all 6 reference prompt templates match user markdown specs and end with === AKHIR PERINTAH ===', () => {
  // 1. Promo mode in buildPromptBlueprint
  const promoIdeaPrompt = buildPromptBlueprint({
    start_mode: 'promo',
    promo_product_name: 'Kopi Dingin Satset',
    promo_benefits: 'Bikin melek tanpa asam lambung, praktis tinggal minum',
    promo_price: 'Rp 18.000 promo beli 2 gratis 1',
    promo_cta: 'Klik keranjang kuning sekarang',
    gaya_video: 'scribble3d',
    target_duration_sec: 45,
  });
  assert.ok(promoIdeaPrompt.includes('Kopi Dingin Satset'));
  assert.ok(promoIdeaPrompt.includes('Klik keranjang kuning sekarang'));
  assert.ok(promoIdeaPrompt.trim().endsWith('=== AKHIR PERINTAH ==='));

  // 2. Script mode in buildNarasiPrompt with scene_count
  const scriptNarasiPrompt = buildNarasiPrompt(
    {
      start_mode: 'script',
      custom_narration: 'Banyak orang mengira disiplin itu menyiksa. Padahal disiplin justru membebaskan waktumu.',
      script_polish_mode: 'polished',
      script_allow_add_words: true,
      scene_count: 6,
      target_duration_sec: 45,
      gaya_video: 'scribble3d',
    },
    'simpan dan bagikan'
  );
  assert.ok(scriptNarasiPrompt.includes('6 scene'));
  assert.ok(scriptNarasiPrompt.includes('Banyak orang mengira disiplin itu menyiksa'));
  assert.ok(scriptNarasiPrompt.trim().endsWith('=== AKHIR PERINTAH ==='));

  // 3. buildAnimasiPrompt with subtitle_custom_box
  const animPrompt = buildAnimasiPrompt(
    {
      project_title: 'Kenapa Pagi Terasa Berat?',
      gaya_video: 'scribble3d',
      aspect_ratio: '9:16',
      subtitle_custom_box: { x: 110, y: 1240, w: 860, h: 240 },
      scenes: [
        {
          id: 's1',
          scene_number: 1,
          role: 'hook',
          target_duration_sec: 7.5,
          narration_text: 'Katanya orang sukses itu selalu bangun pagi penuh semangat.',
          on_screen_text: 'KATANYA ORANG SUKSES',
          emphasis_words: ['semangat'],
          visual: 'Jam weker 3D berdering di meja kamar pagi.',
        },
      ],
    },
    1,
    1
  );
  assert.ok(animPrompt.includes('PENTING - kreator memindahkan subtitle ke kotak x: 110, y: 1240'));
  assert.ok(animPrompt.trim().endsWith('=== AKHIR PERINTAH ==='));

  // 4. buildSingleSceneRevisionPrompt (`prompt revisi per-scene udah jadi.md`)
  const revPrompt = buildSingleSceneRevisionPrompt(
    {
      project_title: 'Kenapa Pagi Terasa Berat?',
      gaya_video: 'scribble3d',
      aspect_ratio: '9:16',
      scenes: [
        {
          id: 's1',
          scene_number: 1,
          role: 'hook',
          target_duration_sec: 7.5,
          narration_text: 'Katanya orang sukses itu selalu bangun pagi penuh semangat.',
          on_screen_text: 'KATANYA ORANG SUKSES',
          emphasis_words: ['semangat'],
          visual: 'Jam weker 3D berdering di meja kamar pagi.',
        },
      ],
      scene_codes: {
        1: 's.text3d("BANGUN PAGI", s.cx, s.cy, { size: 48 });',
      },
    },
    0,
    'Ganti latar jadi malam dan tambahkan efek partikel'
  );
  assert.ok(revPrompt.includes('REVISI KODE SAAT INI'));
  assert.ok(revPrompt.includes('Ganti latar jadi malam dan tambahkan efek partikel'));
  assert.ok(revPrompt.includes('// ===== SCENE 1 ====='));
  assert.ok(revPrompt.trim().endsWith('=== AKHIR PERINTAH ==='));

  // 5. buildThumbnailAiPrompt (`bagian thumbnail animasi prompt ChatGPT.md`)
  const thumbPrompt = buildThumbnailAiPrompt({
    project_title: 'Kenapa Pagi Terasa Berat?',
    aspect_ratio: '9:16',
    thumbnail_art_style: 'pixar_3d',
    thumbnail_text_mode: 'with_text',
    thumbnail_color_mode: 'rich',
    thumbnail_dark_bg: true,
    hook_structure: {
      atas: 'KATANYA ORANG SUKSES',
      besar: 'BANGUN PAGI',
      bawah: 'PADAHAL ADA YANG SALAH',
      scene: 1,
    },
  });
  assert.ok(thumbPrompt.includes('Buatkan 1 gambar THUMBNAIL video pendek'));
  assert.ok(thumbPrompt.includes('WAJIB TANPA WAJAH (faceless mannequin)'));
  assert.ok(thumbPrompt.includes('BANGUN PAGI'));
  assert.ok(thumbPrompt.trim().endsWith('=== AKHIR PERINTAH ==='));

  // 6. buildSeoMetadataPrompt (`bagian judul animasi prompt.md`) & parseAndValidateAIBlueprint standalone SEO
  const seoPrompt = buildSeoMetadataPrompt({
    project_title: 'Kenapa Pagi Terasa Berat?',
    content_type: 'motivasi',
    gaya_video: 'scribble3d',
  });
  assert.ok(seoPrompt.includes('## SEO YouTube ("seo")'));
  assert.ok(seoPrompt.trim().endsWith('=== AKHIR PERINTAH ==='));

  const standaloneSeoParsed = parseAndValidateAIBlueprint(
    JSON.stringify({
      title: 'Cara Bangun Pagi Tanpa Malas Dalam 2 Menit',
      description: 'Tips bangun pagi segar.\n\nDi video ini:\n✅ Trik 2 menit',
      short: 'Ternyata ini rahasia bangun pagi tanpa malas!',
      tags: ['bangun pagi', 'disiplin'],
      hashtags: ['#bangunpagi', '#produktif'],
    })
  );
  assert.equal(standaloneSeoParsed.success, true);
  assert.equal(standaloneSeoParsed.project?.seo?.title, 'Cara Bangun Pagi Tanpa Malas Dalam 2 Menit');
  assert.equal(standaloneSeoParsed.project?.seo?.hashtags?.length, 2);

  // Verify EVERY prompt starts with the mandatory truncation guard sentence and ends with === AKHIR PERINTAH ===
  const requiredGuardSentence =
    '(Perintah ini panjang dan diakhiri baris "=== AKHIR PERINTAH ===". Kalau baris itu TIDAK ada di bagian paling akhir, berarti perintahnya terpotong saat ditempel: jangan kerjakan apa pun, jawab hanya dengan kalimat "PERINTAH TERPOTONG".)';
  for (const p of [promoIdeaPrompt, scriptNarasiPrompt, animPrompt, revPrompt, thumbPrompt, seoPrompt]) {
    assert.ok(
      p.includes(requiredGuardSentence),
      'Every prompt must include the exact PERINTAH TERPOTONG guard sentence'
    );
    assert.ok(
      p.trim().endsWith('=== AKHIR PERINTAH ==='),
      'Every prompt must end with === AKHIR PERINTAH ==='
    );
  }
});

import { buildSatsetTimelineForProject } from './satset-timeline-builder.ts';

test('buildSatsetTimelineForProject and generateRemotionCode preserve identical pasted scene code across 2d (Anime), 2.5d (Campur), and 3d (Full Tiga Dimensi) while differentiating dimension quality', () => {
  const customCode = `s.sphere(360, 520, 110, { fill: '#38bdf8' });\ns.card(160, 700, 400, 120, { r: 24, fill: '#0f172a', stroke: '#38bdf8', width: 3 });\ns.text3d('KODE SAMA 3 DIMENSI', 360, 760, { size: 32, fill: '#ffffff' });`;

  const baseProj: SatsetProject = {
    id: 'p-dim-test',
    project_title: 'Uji Kualitas 2D 2.5D 3D',
    status: 'draft',
    start_mode: 'topic',
    language: 'id',
    content_type: 'edukasi',
    topik_video: 'Dimensi Render',
    target_duration_sec: 5,
    fps: 30,
    gaya_video: 'scribble3d',
    character: 'kreator_3d_studio',
    warna_brand: '#38bdf8',
    tempo: 'energik',
    aspect_ratio: '9:16',
    bgm_style: 'energetic_lofi',
    bgm_volume: 0.4,
    auto_ducking: true,
    ducking_level: 0.2,
    voice_option: 'kore',
    subtitle_style: 'auto',
    watermark: '@satset',
    scene_codes: {
      1: customCode,
    },
    scenes: [
      {
        id: 'sc-1',
        scene_number: 1,
        role: 'hook',
        target_duration_sec: 5,
        narration_text: 'Animasi tetap memakai kode scene yang ditempelkan di semua mode dimensi.',
        on_screen_text: 'KODE SAMA / BEDA DIMENSI',
        emphasis_words: ['kode', 'dimensi'],
      },
    ],
    createdAt: Date.now(),
  };

  const built2d = buildSatsetTimelineForProject({ ...baseProj, render_dimension: '2d' });
  const built25d = buildSatsetTimelineForProject({ ...baseProj, render_dimension: '2.5d' });
  const built3d = buildSatsetTimelineForProject({ ...baseProj, render_dimension: '3d' });

  // All 3 modes must keep the exact same pasted scene code
  assert.equal(built2d.timelineScenes[0].code, customCode);
  assert.equal(built25d.timelineScenes[0].code, customCode);
  assert.equal(built3d.timelineScenes[0].code, customCode);

  // While passing distinct renderDimension & characterDimension metadata
  assert.equal(built2d.projectMeta.renderDimension, '2d');
  assert.equal(built25d.projectMeta.renderDimension, '2.5d');
  assert.equal(built3d.projectMeta.renderDimension, '3d');
  assert.equal(built2d.projectMeta.characterDimension, '2d');
  assert.equal(built3d.projectMeta.characterDimension, '3d');

  // Also verify generateRemotionCode supports all 3 modes ('2d', '2.5d', '3d')
  const tsx2d = generateRemotionCode(baseProj, 30, { renderDimension: '2d' });
  const tsx25d = generateRemotionCode(baseProj, 30, { renderDimension: '2.5d' });
  const tsx3d = generateRemotionCode(baseProj, 30, { renderDimension: '3d' });
  assert.ok(tsx2d.blueprintJson.includes('"render_dimension": "2d"'));
  assert.ok(tsx25d.blueprintJson.includes('"render_dimension": "2.5d"'));
  assert.ok(tsx3d.blueprintJson.includes('"render_dimension": "3d"'));
});



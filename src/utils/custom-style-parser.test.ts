import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeCanvasFramesForStyle,
  buildCustomStylePrompt,
  buildCustomStyleRepairPrompt,
  generateCustomStyleCodeFromAnalysis,
  parseCustomStyleCode,
  SAMPLE_CYBER_HUD_CODE,
  SAMPLE_TACTILE_PAPERCRAFT_CODE,
} from './custom-style-parser.ts';
import { enrichPromptWithMedia } from './ai-platform-router.ts';
import { SATSET_MODULES } from '../data/satset-modules.ts';
import {
  resolveSatsetStyleId,
  normalizeSatsetCaptionMode,
  normalizeSatsetCameraMode,
  normalizeSatsetTransitionId,
  normalizeCustomSceneCodeTo1080,
  compileSatsetSceneCode,
  getSatsetStyleDemoScenes,
  syncCustomStylesToSatsetEngine,
  getAllSatsetStyles,
  SATSET_BUILTIN_STYLES,
  SATSET_TRANSITIONS,
  SATSET_CAMERA_MODES,
  SATSET_CAPTION_MODES,
} from './custom-style-runtime.ts';
import {
  resolveAssetMotionPlan,
  buildExecutableAssetMotionSnippet,
} from './website-media-engine.ts';

test('buildCustomStylePrompt generates exact contract prompt with truncation guard header and footer', () => {
  const prompt = buildCustomStylePrompt('Cyber HUD', 'Interface sci-fi neon HUD tactical');
  assert.ok(
    prompt.startsWith(
      '(Perintah ini panjang dan diakhiri baris "=== AKHIR PERINTAH ===". Kalau baris itu TIDAK ada di bagian paling akhir, berarti perintahnya terpotong saat ditempel: jangan kerjakan apa pun, jawab hanya dengan kalimat "PERINTAH TERPOTONG".)'
    )
  );
  assert.ok(prompt.endsWith('=== AKHIR PERINTAH ==='));
  assert.ok(prompt.includes('Nama yang diinginkan: Cyber HUD'));
  assert.ok(prompt.includes('Interface sci-fi neon HUD tactical'));
  assert.ok(prompt.includes('## Yang bisa digambar mesin animasinya'));
  assert.ok(prompt.includes('## WAJIB FACELESS'));
  assert.ok(prompt.includes('## Demo gaya (4 scene)'));
  assert.ok(prompt.includes('## Efek suara'));
  assert.ok(prompt.includes('// ===== GAYA ====='));
  assert.ok(prompt.includes('// ===== SCENE 1 ====='));
});

test('buildCustomStyleRepairPrompt produces repair message with problem details and single js block instruction', () => {
  const repair = buildCustomStyleRepairPrompt('g', [
    'Tidak menemukan JSON yang valid. Pastikan kamu menyalin seluruh jawaban Claude, termasuk blok ```json.',
  ]);
  assert.ok(repair.startsWith('Jawabanmu sebelumnya tidak bisa diproses aplikasi.'));
  assert.ok(repair.includes('Masalah: Tidak menemukan JSON yang valid.'));
  assert.ok(repair.includes('// ===== GAYA ====='));
  assert.ok(repair.includes('// ===== SCENE 4 ====='));
});

test('parseCustomStyleCode rejects invalid text, prompt text, and PERINTAH TERPOTONG', () => {
  const invalidShort = parseCustomStyleCode('g');
  assert.equal(invalidShort.isValid, false);
  assert.ok(invalidShort.errors[0].includes('Tidak menemukan JSON yang valid'));

  const truncatedReply = parseCustomStyleCode('PERINTAH TERPOTONG');
  assert.equal(truncatedReply.isValid, false);

  const pastedPromptItself = parseCustomStyleCode(
    buildCustomStylePrompt('Tanah Liat', 'Stop-motion tanah liat')
  );
  assert.equal(pastedPromptItself.isValid, false);
});

test('parseCustomStyleCode parses SAMPLE_CYBER_HUD_CODE successfully with 4 scenes', () => {
  const result = parseCustomStyleCode(SAMPLE_CYBER_HUD_CODE);
  assert.equal(result.isValid, true);
  assert.ok(result.style);
  assert.equal(result.style.name, 'Cyber HUD');
  assert.equal(result.style.look, '2d');
  assert.equal(result.style.finish, 'glow');
  assert.deepEqual(result.style.colors, ['#00FF66', '#00E5FF', '#FF3366']);
  assert.ok(result.style.scenes[1].includes('VIEWS'));
  assert.ok(result.style.scenes[2].includes('HARI KE-'));
  assert.ok(result.style.scenes[3].includes('REBUILT'));
  assert.ok(result.style.scenes[4].includes('Trophy'));
});

test('parseCustomStyleCode handles markdown backticks around js code block', () => {
  const wrapped = '```js\n' + SAMPLE_CYBER_HUD_CODE + '\n```';
  const result = parseCustomStyleCode(wrapped);
  assert.equal(result.isValid, true);
  assert.ok(result.style);
  assert.equal(result.style.name, 'Cyber HUD');
  assert.equal(Object.keys(result.style.scenes).length, 4);
});

test('SATSET_MODULES contains zero duplicate IDs or duplicate titles', () => {
  const ids = new Set<string>();
  const titles = new Set<string>();
  for (const mod of SATSET_MODULES) {
    const idKey = mod.id.toLowerCase();
    const titleKey = mod.title.toLowerCase();
    assert.equal(ids.has(idKey), false, `Duplicate style ID found: ${mod.id}`);
    assert.equal(titles.has(titleKey), false, `Duplicate style title found: ${mod.title}`);
    ids.add(idKey);
    titles.add(titleKey);
  }
});

test('resolveSatsetStyleId maps legacy module IDs and canonical IDs to built-in 42 styles', () => {
  assert.equal(resolveSatsetStyleId('diorama_data'), 'diorama');
  assert.equal(resolveSatsetStyleId('cara_kerja'), 'carakerja');
  assert.equal(resolveSatsetStyleId('neon_game'), 'neongame');
  assert.equal(resolveSatsetStyleId('stickman_shorts'), 'garis');
  assert.equal(resolveSatsetStyleId('kinetic_type'), 'reel');
  assert.equal(SATSET_BUILTIN_STYLES.length, 42);
});

test('getSatsetStyleDemoScenes returns 4 rich scenes for every built-in style', () => {
  for (const style of SATSET_BUILTIN_STYLES) {
    const scenes = getSatsetStyleDemoScenes(style.id);
    assert.equal(scenes.length, 4, `Style ${style.id} should have 4 demo scenes`);
    assert.ok(scenes[0].code && scenes[0].code.length > 20);
    assert.ok(scenes[0].text && scenes[0].text.length > 5);
  }
});

test('normalizers map caption, camera, and transition aliases accurately', () => {
  assert.ok(Array.isArray(SATSET_CAPTION_MODES) || typeof SATSET_CAPTION_MODES === 'object');
  assert.equal(SATSET_CAMERA_MODES.length, 11);
  assert.equal(SATSET_TRANSITIONS.length, 22);
  assert.equal(normalizeSatsetCaptionMode('auto', true), undefined);
  assert.equal(normalizeSatsetCaptionMode('none', true), 'off');
  assert.equal(normalizeSatsetCaptionMode('karaoke', true), 'karaoke');
  assert.equal(normalizeSatsetCaptionMode('pill_pop', true), 'stiker');
  assert.equal(normalizeSatsetCameraMode('zoom_in'), 'push');
  assert.equal(normalizeSatsetCameraMode('punch_in'), 'crash');
  assert.equal(normalizeSatsetTransitionId('whip_pan'), 'whip-left');
  assert.equal(normalizeSatsetTransitionId('iris_circle'), 'iris');
  assert.equal(normalizeSatsetTransitionId('match_morph'), 'match-morph');
  assert.equal(normalizeSatsetTransitionId('cinema_whip'), 'cinema-whip');
});

test('syncCustomStylesToSatsetEngine registers parsed custom style and its 4 demo scenes', () => {
  const parsed = parseCustomStyleCode(SAMPLE_CYBER_HUD_CODE);
  assert.ok(parsed.style);
  syncCustomStylesToSatsetEngine([parsed.style]);
  const allStyles = getAllSatsetStyles();
  const registered = allStyles.find((s: any) => s.id === parsed.style?.id);
  assert.ok(registered, 'Custom style should be registered in Satset engine');
  assert.equal(registered.demo.length, 4);
  assert.ok(registered.demo[0].code.includes('VIEWS'));
});

test('resolveAssetMotionPlan and buildExecutableAssetMotionSnippet compile living Remotion choreography from presets and custom prompts', () => {
  const customPlan = resolveAssetMotionPlan(
    {
      id: 'sc-1',
      narration_text: 'Lihat fitur unggulan ini secara mendalam',
      asset_motion_preset: 'custom',
      asset_motion_prompt:
        'Masuk melayang 3D dari bawah + sorot laser biru & partikel meledak saat poin utama',
    },
    { topik_video: 'Aplikasi Produktivitas' },
    0
  );
  assert.equal(customPlan.entryDirection, 'bottom');
  assert.equal(customPlan.hasScanline, true);
  assert.equal(customPlan.hasParticles, true);
  assert.equal(customPlan.has3dSatellites, true);

  const snippet = buildExecutableAssetMotionSnippet({
    mediaKey: 'uploaded_media_1',
    scene: {
      id: 'sc-1',
      narration_text: 'Lihat fitur unggulan ini secara mendalam',
      asset_motion_preset: 'custom',
      asset_motion_prompt:
        'Masuk melayang 3D dari bawah + sorot laser biru & partikel meledak saat poin utama',
    },
    project: { topik_video: 'Aplikasi Produktivitas' },
    sceneIndex: 0,
    dur: 5,
  });
  assert.ok(snippet.includes('s.photo("uploaded_media_1"'));
  assert.ok(snippet.includes('s.card(-cardW * 0.5'));
  assert.ok(snippet.includes('s.burst(posX, posY'));
  assert.ok(snippet.includes('s.cube(sat1X, sat1Y'));
});

test('analyzeCanvasFramesForStyle and generateCustomStyleCodeFromAnalysis detect reference photo/video styles and synthesize valid 4-scene code', () => {
  // 1. Dark Neon HUD reference frame (dark border + bright cyan/magenta center)
  const w = 16;
  const h = 16;
  const darkNeonData = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const isCenter = x >= 4 && x <= 11 && y >= 4 && y <= 11;
      if (isCenter) {
        darkNeonData[idx] = x % 2 === 0 ? 0 : 255;
        darkNeonData[idx + 1] = x % 2 === 0 ? 229 : 42;
        darkNeonData[idx + 2] = 255;
      } else {
        darkNeonData[idx] = 8;
        darkNeonData[idx + 1] = 12;
        darkNeonData[idx + 2] = 20;
      }
      darkNeonData[idx + 3] = 255;
    }
  }

  const neonAnalysis = analyzeCanvasFramesForStyle([{ width: w, height: h, data: darkNeonData }], {
    sourceType: 'foto',
    filename: 'neon_dashboard_ref.png',
  });
  assert.equal(neonAnalysis.archetype, 'neon_hud');
  assert.equal(neonAnalysis.finish, 'glow');
  assert.equal(neonAnalysis.colors.length, 3);
  assert.ok(neonAnalysis.detailedPrompt.includes('faceless'));

  const neonCode = generateCustomStyleCodeFromAnalysis(neonAnalysis);
  const parsedNeon = parseCustomStyleCode(neonCode);
  assert.equal(parsedNeon.isValid, true);
  assert.equal(parsedNeon.style?.finish, 'glow');
  assert.deepEqual(parsedNeon.style?.colors, neonAnalysis.colors);

  // 2. Warm 3D Clay reference video (2 keyframes with motion energy)
  const warmFrame1 = new Uint8ClampedArray(w * h * 4);
  const warmFrame2 = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const smoothGrad = Math.round((x / w) * 60 + (y / h) * 50);
      warmFrame1[idx] = Math.min(255, 180 + smoothGrad * 0.5);
      warmFrame1[idx + 1] = Math.min(255, 110 + smoothGrad * 0.4);
      warmFrame1[idx + 2] = Math.min(255, 70 + smoothGrad * 0.3);
      warmFrame1[idx + 3] = 255;

      warmFrame2[idx] = Math.min(255, 90 + smoothGrad * 0.8);
      warmFrame2[idx + 1] = Math.min(255, 165 + smoothGrad * 0.4);
      warmFrame2[idx + 2] = Math.min(255, 130 + smoothGrad * 0.3);
      warmFrame2[idx + 3] = 255;
    }
  }

  const videoAnalysis = analyzeCanvasFramesForStyle(
    [
      { width: w, height: h, data: warmFrame1 },
      { width: w, height: h, data: warmFrame2 },
    ],
    {
      sourceType: 'video',
      filename: 'clay_studio_demo.mp4',
      userNote: 'Gaya 3D clay hangat mengilap',
    }
  );
  assert.equal(videoAnalysis.look, '3d');
  assert.equal(videoAnalysis.finish, 'glossy');
  assert.ok((videoAnalysis.motionEnergy ?? 0) > 20);

  const clayCode = generateCustomStyleCodeFromAnalysis(videoAnalysis);
  const parsedClay = parseCustomStyleCode(clayCode);
  assert.equal(parsedClay.isValid, true);
  assert.equal(parsedClay.style?.look, '3d');
  assert.ok(parsedClay.style?.scenes[1].includes('s.box'));
  assert.ok(
    parsedClay.style?.scenes[4].includes('s.cylinder') ||
      parsedClay.style?.scenes[4].includes('s.extrude')
  );

  // 3. Verify buildCustomStylePrompt + enrichPromptWithMedia always ends with === AKHIR PERINTAH ===
  const baseWithRef = buildCustomStylePrompt(
    videoAnalysis.suggestedName,
    videoAnalysis.detailedPrompt,
    videoAnalysis
  );
  assert.ok(baseWithRef.includes('### Hasil Deteksi Detail Referensi Visual (Video Referensi)'));
  assert.ok(baseWithRef.endsWith('=== AKHIR PERINTAH ==='));

  const enriched = enrichPromptWithMedia(baseWithRef, [
    {
      id: 'ref-1',
      key: 'ref_gaya_1',
      filename: 'clay_studio_demo.png',
      type: 'image',
      url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    },
  ]);
  assert.ok(enriched.includes('## Gambar / Media yang Diatur'));
  assert.ok(
    enriched.endsWith('=== AKHIR PERINTAH ==='),
    'Enriched prompt must still end with === AKHIR PERINTAH === on the final line'
  );
});

test('parseCustomStyleCode extracts -- Engine Web Audio Khusus, 4.2s scene durations, and compiles all 4 scenes of Tactile Papercraft Lab across 9:16, 1:1, 3:4, and 16:9 without cropping or syntax errors', () => {
  const result = parseCustomStyleCode(SAMPLE_TACTILE_PAPERCRAFT_CODE);
  assert.equal(result.isValid, true, `Expected valid parse, got errors: ${result.errors.join(', ')}`);
  assert.ok(result.style);
  assert.equal(result.style.name, 'Tactile Papercraft Lab');
  assert.equal(result.style.look, '2d');
  assert.equal(result.style.finish, 'craft');
  assert.equal(result.style.sfxFlavor, 'paper');
  assert.equal(result.style.caption, 'selotip');
  assert.deepEqual(result.style.sceneDurations, { 1: 4.2, 2: 4.2, 3: 4.2, 4: 4.2 });
  assert.ok(result.style.customAudioCode, 'Expected customAudioCode to be extracted');
  assert.ok(
    result.style.customAudioCode.includes('playPaperSfx'),
    'Expected customAudioCode to contain playPaperSfx'
  );
  assert.equal(
    result.style.scenes[4].includes('export function playPaperSfx'),
    false,
    'Scene 4 must not retain the trailing export function playPaperSfx'
  );

  // Sync style to engine and verify all 4 scenes compile & execute cleanly across all 4 aspect ratios
  syncCustomStylesToSatsetEngine([result.style]);
  const ratios: Array<{ id: string; w: number; h: number }> = [
    { id: '9:16', w: 480, h: 854 },
    { id: '1:1', w: 540, h: 540 },
    { id: '3:4', w: 480, h: 640 },
    { id: '16:9', w: 640, h: 360 },
  ];

  for (let sceneIdx = 1; sceneIdx <= 4; sceneIdx++) {
    const rawScene = result.style.scenes[sceneIdx as 1 | 2 | 3 | 4];
    const normalized = normalizeCustomSceneCodeTo1080(rawScene, 0.92);
    assert.ok(
      normalized.startsWith('// @advanced'),
      `Normalized scene ${sceneIdx} must start with // @advanced to prevent redundant double camera zoom`
    );
    const fn = compileSatsetSceneCode(normalized);

    for (const ratio of ratios) {
      let topTransformScale = 0;
      const recordedSfx: string[] = [];
      const mockW = 720;
      const mockH = Math.round((720 * ratio.h) / ratio.w);
      const mockCtx: any = {
        save() {},
        restore() {},
        translate() {},
        scale(sx: number) {
          if (topTransformScale === 0 && typeof sx === 'number') {
            topTransformScale = sx;
          }
        },
      };
      const mockS: any = {
        W: mockW,
        H: mockH,
        w: mockW,
        h: mockH,
        t: 2.1,
        p: 0.5,
        dur: 4.2,
        index: sceneIdx - 1,
        count: 4,
        theme: 'paper',
        ink: '#F7F1E3',
        sub: '#D4B483',
        card: '#23342F',
        c1: '#F7F1E3',
        c2: '#E05A47',
        c3: '#E9B44C',
        clamp: (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v)),
        lerp: (a: number, b: number, t: number) => a + (b - a) * t,
        ease: (p: number) => p,
        spring: () => 1,
        wave: (hz = 1, a = 1, ph = 0) => Math.sin((2.1 * hz + ph) * Math.PI * 2) * a,
        at: (st: number, dur = 0.5) => Math.max(0, Math.min(1, (2.1 - st) / Math.max(0.01, dur))),
        step: () => 1,
        rand: () => 0.5,
        group: (_tr: any, cb: () => void) => {
          if (typeof cb === 'function') cb();
        },
        rect: () => {},
        card3d: () => {},
        circle: () => {},
        ellipse: () => {},
        arc: () => {},
        line: () => {},
        dash: () => {},
        polyline: () => {},
        arrow: () => {},
        curve: () => {},
        path: () => {},
        shape: () => {},
        poly: () => {},
        blob: () => {},
        text: () => {},
        num: () => {},
        pill: () => {},
        badge: () => {},
        callout: () => {},
        bar: () => {},
        bars: () => {},
        spark: () => {},
        sparkle: () => {},
        ring: () => {},
        grid: () => {},
        dots: () => {},
        burst: () => {},
        confetti: () => {},
        stickman: () => {},
        icon: () => {},
        photo: () => {},
        box: () => {},
        cube: () => {},
        cyl: () => {},
        cylinder: () => {},
        cone: () => {},
        sphere: () => {},
        orb: () => {},
        torus: () => {},
        extrude: () => {},
        stage3d: () => {},
        sfx: (name: string) => recordedSfx.push(name),
      };
      fn(mockS, mockCtx);
      assert.ok(
        topTransformScale > 0.25 && topTransformScale <= 1.05,
        `Expected safe-fit transform scale in (0.25..1.05] for scene ${sceneIdx} at ${ratio.id}, got ${topTransformScale}`
      );
      assert.ok(
        recordedSfx.some((c) => c.startsWith('paper_')),
        `Expected scene ${sceneIdx} to trigger paper_* foley cues`
      );
    }
  }
});




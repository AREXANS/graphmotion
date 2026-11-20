import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AI_PLATFORMS,
  buildAiTargetUrl,
  collectProjectPromptImages,
  enrichPromptWithMedia,
  formatPromptForDispatchMode,
  type PromptMediaAttachment,
} from './ai-platform-router.ts';
import {
  GRAPH_MOTION_GIF_LOOP_DURATION_MS,
  computeGraphMotionGifLoopState,
} from '../components/GraphMotionBrandLogo.tsx';
import { type SatsetProject } from '../types/satset.ts';

test('AI_PLATFORMS includes Claude, ChatGPT, Gemini, Perplexity, DeepSeek, and Grok', () => {
  const ids = AI_PLATFORMS.map((p) => p.id);
  assert.deepEqual(ids, ['claude', 'chatgpt', 'gemini', 'perplexity', 'deepseek', 'grok']);
});

test('buildAiTargetUrl formats query URLs with prefilled prompt for each AI platform', () => {
  const sample = 'Buat 8 scene animasi Remotion\ndengan tema kopi';

  const claude = buildAiTargetUrl('claude', sample);
  assert.equal(claude.supportsQueryPrefill, true);
  assert.ok(claude.url.startsWith('https://claude.ai/new?q='));
  assert.ok(claude.url.includes(encodeURIComponent('tema kopi')));

  const chatgpt = buildAiTargetUrl('chatgpt', sample);
  assert.ok(chatgpt.url.startsWith('https://chatgpt.com/?q='));
  assert.ok(chatgpt.url.includes('&prompt='));

  const gemini = buildAiTargetUrl('gemini', sample);
  assert.ok(gemini.url.startsWith('https://gemini.google.com/app?q='));
  assert.ok(gemini.url.includes('&text='));

  const perplexity = buildAiTargetUrl('perplexity', sample);
  assert.ok(perplexity.url.startsWith('https://www.perplexity.ai/search?q='));

  const grok = buildAiTargetUrl('grok', sample);
  assert.ok(grok.url.startsWith('https://grok.com/?q='));

  const deepseek = buildAiTargetUrl('deepseek', sample);
  assert.equal(deepseek.supportsQueryPrefill, true);
  assert.ok(deepseek.url.startsWith('https://chat.deepseek.com/?q='));
});

test('formatPromptForDispatchMode formats direct, link, and md modes accurately', () => {
  const base = 'Buat 5 ide video pendek tentang merokok';
  assert.equal(formatPromptForDispatchMode(base, 'direct'), base);

  const linkFormatted = formatPromptForDispatchMode(base, 'link', 'https://studio.example.com');
  assert.ok(linkFormatted.includes('https://studio.example.com/style-guide.md'));
  assert.ok(linkFormatted.includes(base));

  const mdFormatted = formatPromptForDispatchMode(base, 'md');
  assert.equal(mdFormatted, base);
});

test('computeGraphMotionGifLoopState runs a continuous 5000ms (5s) repeating GIF-like loop', () => {
  assert.equal(GRAPH_MOTION_GIF_LOOP_DURATION_MS, 5000);

  const t0 = computeGraphMotionGifLoopState(0);
  const t1250 = computeGraphMotionGifLoopState(1250);
  const t2500 = computeGraphMotionGifLoopState(2500);
  const t3750 = computeGraphMotionGifLoopState(3750);
  const t5000 = computeGraphMotionGifLoopState(5000);

  assert.deepEqual(t0, t5000);

  assert.equal(t0.ringRotationDeg, 0);
  assert.equal(t1250.ringRotationDeg, 90);
  assert.equal(t2500.ringRotationDeg, 180);
  assert.equal(t3750.ringRotationDeg, 270);

  // Columns, sprocket perforations, and play prism animate dynamically across the 5s cycle
  assert.notDeepEqual(t0.barScales, t1250.barScales);
  assert.notEqual(t0.sprocketOffset, t2500.sprocketOffset);
  assert.ok(t2500.prismScale >= 1);
  assert.equal(t2500.wordmarkScrubberProgress, 0.5);
});

test('collectProjectPromptImages aggregates uploaded tutorial media, scene media, and extra images without duplicates', () => {
  const project: Partial<SatsetProject> = {
    uploaded_tutorial_media: [
      {
        id: 'u-1',
        key: 'uploaded_media_1',
        url: 'data:image/png;base64,AAA',
        type: 'image',
        filename: 'produk-kopi.png',
        stepTitle: 'Scene 1',
      },
      {
        id: 'u-2',
        key: 'uploaded_media_2',
        url: 'data:image/png;base64,BBB',
        type: 'image',
        filename: 'dashboard.png',
        stepTitle: 'Scene 3',
      },
    ],
    scenes: [
      {
        id: 's1',
        scene_number: 1,
        media_key: 'uploaded_media_1',
        media_url: 'data:image/png;base64,AAA',
        media_filename: 'produk-kopi.png',
      },
      {
        id: 's2',
        scene_number: 2,
        media_key: 'web_step_2',
        media_url: 'https://example.com/snap2.png',
        media_filename: 'fitur-checkout.png',
      },
    ],
  };

  const extra: PromptMediaAttachment[] = [
    {
      id: 'ref-1',
      key: 'style_ref_1',
      filename: 'referensi-gaya.jpg',
      type: 'image',
      url: 'data:image/jpeg;base64,CCC',
      sceneHint: 'Referensi Gaya',
    },
  ];

  const all = collectProjectPromptImages(project, undefined, extra);
  assert.equal(all.length, 4);
  assert.equal(all[0].filename, 'referensi-gaya.jpg');

  const scoped = collectProjectPromptImages(project, { start: 1, end: 2 });
  assert.equal(scoped.length, 2);
  assert.deepEqual(
    scoped.map((m) => m.filename),
    ['produk-kopi.png', 'fitur-checkout.png']
  );
});

test('enrichPromptWithMedia appends media manifest and does not duplicate when called twice', () => {
  const media: PromptMediaAttachment[] = [
    {
      id: 'm1',
      key: 'uploaded_media_1',
      filename: 'produk.png',
      type: 'image',
      url: 'data:image/png;base64,AAA',
      sceneHint: 'Scene 1',
    },
  ];

  const once = enrichPromptWithMedia('Prompt utama video', media);
  assert.ok(once.includes('## Gambar / Media yang Diatur (1 Aset)'));
  assert.ok(once.includes('produk.png'));
  assert.ok(once.includes('s.photo("uploaded_media_1"'));

  const twice = enrichPromptWithMedia(once, media);
  assert.equal(twice, once);
});


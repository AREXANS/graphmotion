import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AI_PLATFORMS,
  buildAiTargetUrl,
  collectProjectPromptImages,
  enrichPromptWithMedia,
  PromptMediaAttachment,
} from './ai-platform-router';
import { SatsetProject } from '../types/satset';

test('AI_PLATFORMS includes Claude, ChatGPT, Gemini, Perplexity, DeepSeek, and Grok', () => {
  const ids = AI_PLATFORMS.map((p) => p.id);
  assert.deepEqual(ids, ['claude', 'chatgpt', 'gemini', 'perplexity', 'deepseek', 'grok']);
});

test('buildAiTargetUrl formats query URLs for each AI platform cleanly', () => {
  const sample = 'Buat 8 scene animasi Remotion\ndengan tema kopi';

  const claude = buildAiTargetUrl('claude', sample);
  assert.equal(claude.supportsQueryPrefill, true);
  assert.ok(claude.url.startsWith('https://claude.ai/new?q='));
  assert.ok(claude.url.includes(encodeURIComponent('tema kopi')));

  const chatgpt = buildAiTargetUrl('chatgpt', sample);
  assert.ok(chatgpt.url.startsWith('https://chatgpt.com/?q='));

  const gemini = buildAiTargetUrl('gemini', sample);
  assert.ok(gemini.url.startsWith('https://gemini.google.com/app?text='));

  const perplexity = buildAiTargetUrl('perplexity', sample);
  assert.ok(perplexity.url.startsWith('https://www.perplexity.ai/search?q='));

  const grok = buildAiTargetUrl('grok', sample);
  assert.ok(grok.url.startsWith('https://grok.com/?q='));

  const deepseek = buildAiTargetUrl('deepseek', sample);
  assert.equal(deepseek.supportsQueryPrefill, false);
  assert.equal(deepseek.url, 'https://chat.deepseek.com/');
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

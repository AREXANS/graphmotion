import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCustomStylePrompt,
  parseCustomStyleCode,
  SAMPLE_CYBER_HUD_CODE,
} from './custom-style-parser';

test('buildCustomStylePrompt generates exact contract prompt with name and description', () => {
  const prompt = buildCustomStylePrompt('Cyber HUD', 'Interface sci-fi neon HUD tactical');
  assert.ok(prompt.includes('Nama yang diinginkan: Cyber HUD'));
  assert.ok(prompt.includes('Interface sci-fi neon HUD tactical'));
  assert.ok(prompt.includes('## Yang bisa digambar mesin animasinya'));
  assert.ok(prompt.includes('## WAJIB FACELESS'));
  assert.ok(prompt.includes('## Demo gaya (4 scene)'));
  assert.ok(prompt.includes('// ===== GAYA ====='));
  assert.ok(prompt.includes('// ===== SCENE 1 ====='));
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

test('parseCustomStyleCode rejects empty string with appropriate error', () => {
  const result = parseCustomStyleCode('');
  assert.equal(result.isValid, false);
  assert.ok(result.errors.length > 0);
});

import {
  resolveSatsetStyleId,
  normalizeSatsetCaptionMode,
  normalizeSatsetCameraMode,
  normalizeSatsetTransitionId,
  getSatsetStyleDemoScenes,
  syncCustomStylesToSatsetEngine,
  getAllSatsetStyles,
  SATSET_BUILTIN_STYLES,
  SATSET_TRANSITIONS,
  SATSET_CAMERA_MODES,
  SATSET_CAPTION_MODES,
} from './custom-style-runtime';

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



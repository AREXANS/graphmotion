import test from 'node:test';
import assert from 'node:assert/strict';
import { SATSET_MODULES } from './satset-modules';

test('SATSET_MODULES contains all 44+ styles with valid structure', () => {
  assert.ok(SATSET_MODULES.length >= 44, 'Should have at least 44 styles');

  // Verify critical styles exist
  const diorama = SATSET_MODULES.find((m) => m.id === 'diorama_data');
  assert.ok(diorama, 'diorama_data must exist');
  assert.equal(diorama?.title, 'Diorama Data');
  assert.equal(diorama?.demoChapters.length, 4, 'Diorama should have 4 demo chapters');

  const stickman = SATSET_MODULES.find((m) => m.id === 'stickman_shorts');
  assert.ok(stickman, 'stickman_shorts must exist');
  assert.equal(stickman?.renderType, 'stickman');

  const bangMotion = SATSET_MODULES.find((m) => m.id === 'bang_motion');
  assert.ok(bangMotion, 'bang_motion must exist');
  assert.equal(bangMotion?.renderType, 'bang_motion');

  const scribble3d = SATSET_MODULES.find((m) => m.id === 'scribble3d');
  assert.ok(scribble3d, 'scribble3d must exist');

  const scribble2d = SATSET_MODULES.find((m) => m.id === 'scribble2d');
  assert.ok(scribble2d, 'scribble2d must exist');

  const modernFlat = SATSET_MODULES.find((m) => m.id === 'modern_flat');
  assert.ok(modernFlat, 'modern_flat must exist');

  const futuristik = SATSET_MODULES.find((m) => m.id === 'futuristik');
  assert.ok(futuristik, 'futuristik must exist');

  const studio3dRoom = SATSET_MODULES.find((m) => m.id === 'studio_3d_room');
  assert.ok(studio3dRoom, 'studio_3d_room must exist');
  assert.equal(studio3dRoom?.renderType, 'studio_3d_room');

  const editorialGrid = SATSET_MODULES.find((m) => m.id === 'editorial_motion_grid');
  assert.ok(editorialGrid, 'editorial_motion_grid must exist');
  assert.equal(editorialGrid?.renderType, 'editorial_motion_grid');
});

test('Category filtering contains correct styles and demo chapters', () => {
  const cerita = SATSET_MODULES.filter((m) => m.categories.includes('cerita'));
  assert.ok(cerita.length >= 10, 'Cerita category has rich catalog');

  const ceria = SATSET_MODULES.filter((m) => m.categories.includes('ceria'));
  assert.ok(ceria.length >= 8, 'Ceria category has rich catalog');

  const modern = SATSET_MODULES.filter((m) => m.categories.includes('modern'));
  assert.ok(modern.length >= 8, 'Modern category has rich catalog');

  // All styles should have demo chapters
  for (const mod of SATSET_MODULES) {
    assert.ok(mod.demoChapters.length > 0, `Style ${mod.id} has demo chapters`);
    assert.ok(mod.title.length > 0, `Style ${mod.id} has title`);
  }
});

test('Zero duplication: every style has a unique ID and unique renderType', () => {
  const ids = SATSET_MODULES.map((m) => m.id);
  const uniqueIds = new Set(ids);
  assert.equal(
    uniqueIds.size,
    ids.length,
    `Found duplicate IDs: total ${ids.length}, unique ${uniqueIds.size}`
  );

  const renderTypes = SATSET_MODULES.map((m) => m.renderType);
  const uniqueRenderTypes = new Set(renderTypes);
  assert.equal(
    uniqueRenderTypes.size,
    renderTypes.length,
    `Found duplicate renderTypes: total ${renderTypes.length}, unique ${uniqueRenderTypes.size}`
  );
});


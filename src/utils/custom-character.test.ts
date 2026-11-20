import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCharacterDesignPrompt,
  buildCharacterTraitsSummary,
  buildDeterministicCharacterFromPalette,
  createDefaultCustomCharacter,
  customCharacterToEngineLook,
  normalizeAiPhotoCharacterResponse,
} from './custom-character.ts';
import { getCharacterMeta, getEngineCharacterConfig } from './character-catalog.ts';

test('customCharacterToEngineLook maps gender, hijab, jacket & accessories accurately', () => {
  const cfg = createDefaultCustomCharacter({
    id: 'custom_test_1',
    name: 'Alya Presenter',
    gender: 'cewek',
    hairStyle: 'hijab_simpel',
    hairColor: '#1e293b',
    skinColor: '#efc39c',
    topStyle: 'blazer',
    topColor: '#2563eb',
    innerTopColor: '#f8fafc',
    bottomStyle: 'rok_panjang',
    bottomColor: '#0f172a',
    shoeStyle: 'sneakers',
    shoeColor: '#ffffff',
    accessories: ['kacamata_bulat', 'ransel'],
  });

  const mapped = customCharacterToEngineLook(cfg, 'depan');
  assert.equal(mapped.gender, 'female');
  assert.equal(mapped.look.hijab, '#1e293b');
  assert.equal(mapped.look.jacket, '#2563eb');
  assert.equal(mapped.look.jacketOpen, true);
  assert.equal(mapped.look.shirt, '#f8fafc');
  assert.equal(mapped.look.dress, '#0f172a');
  assert.equal(mapped.look.glasses, '#1e293b');
});

test('normalizeAiPhotoCharacterResponse clamps invalid values and preserves valid hex colors', () => {
  const normalized = normalizeAiPhotoCharacterResponse({
    suggestedName: 'Raka Tech',
    gender: 'cowok',
    skinColor: '#dba174',
    hairStyle: 'non_existent_style',
    hairColor: 'not-a-hex',
    oneSetId: 'unknown_set',
    topStyle: 'hoodie',
    topColor: '#10b981',
    bottomStyle: 'celana_panjang',
    bottomColor: '#1e293b',
    shoeStyle: 'sneakers',
    shoeColor: '#f8fafc',
    accessories: ['topi_pet', 'invalid_acc'],
    photoObservation: 'Pria memakai hoodie hijau emerald dan topi',
  });

  assert.equal(normalized.name, 'Raka Tech');
  assert.equal(normalized.gender, 'cowok');
  assert.equal(normalized.skinColor, '#dba174');
  assert.equal(normalized.hairStyle, 'lurus_rapi');
  assert.equal(normalized.hairColor, '#2b2220');
  assert.equal(normalized.oneSetId, 'none');
  assert.equal(normalized.topStyle, 'hoodie');
  assert.equal(normalized.topColor, '#10b981');
  assert.deepEqual(normalized.accessories, ['topi_pet']);
});

test('getCharacterMeta and getEngineCharacterConfig honor customOverride', () => {
  const custom = createDefaultCustomCharacter({
    id: 'custom_creator_99',
    name: 'Kreator Studio',
    gender: 'cowok',
    topStyle: 'kaos',
    topColor: '#ef4444',
  });

  const meta = getCharacterMeta('custom_creator_99', custom);
  assert.equal(meta.id, 'custom_creator_99');
  assert.equal(meta.name, 'Kreator Studio');
  assert.equal(meta.badge, 'CUSTOM');
  assert.ok(buildCharacterTraitsSummary(custom).length > 5);

  const engine = getEngineCharacterConfig('custom_creator_99', 'pria', custom);
  assert.ok(engine);
  assert.equal(engine.label, 'Kreator Studio');
  assert.equal(engine.look.shirt, '#ef4444');
});

test('applyCharacterDesignPrompt and buildDeterministicCharacterFromPalette customize narrator character from prompt and reference palette', () => {
  const fromPrompt = applyCharacterDesignPrompt(
    'Cewek berhijab pakai blazer biru dongker dan kacamata bulat'
  );
  assert.equal(fromPrompt.gender, 'cewek');
  assert.equal(fromPrompt.hairStyle, 'hijab_simpel');
  assert.equal(fromPrompt.topStyle, 'blazer');
  assert.ok(fromPrompt.accessories.includes('kacamata_bulat'));

  const fromRefPalette = buildDeterministicCharacterFromPalette(
    {
      topColor: '#10b981',
      bottomColor: '#0f172a',
      hairColor: '#1c1917',
      skinColor: '#e0ac69',
      accentColor: '#f59e0b',
    },
    'Cowok berkacamata pakai hoodie emerald'
  );
  assert.equal(fromRefPalette.gender, 'cowok');
  assert.equal(fromRefPalette.topStyle, 'hoodie');
  assert.equal(fromRefPalette.topColor, '#10b981');
  assert.ok(fromRefPalette.accessories.includes('kacamata_kotak') || fromRefPalette.accessories.includes('kacamata_bulat'));
});

test('applyCharacterDesignPrompt genuinely builds humanoid fox character ("humanoid rubah biru berpakaian modern dan aksesoris kacamata")', () => {
  const fox = applyCharacterDesignPrompt(
    'humanoid rubah biru berpakaian modern dan aksesoris kacamata'
  );
  assert.equal(fox.species, 'fox');
  assert.equal(fox.skinColor, '#2563eb');
  assert.equal(fox.furPrimaryColor, '#2563eb');
  assert.equal(fox.earStyle, 'fox_pointed');
  assert.equal(fox.muzzleStyle, 'fox_snout');
  assert.equal(fox.tailStyle, 'fox_fluffy');
  assert.equal(fox.topStyle, 'jaket_terbuka');
  assert.ok(fox.accessories.includes('kacamata_kotak'));
  assert.ok(fox.name.includes('Rubah'));

  const engineLook = customCharacterToEngineLook(fox, 'depan');
  assert.ok(engineLook.look.__customChar);
  assert.equal(engineLook.look.__customChar.species, 'fox');
});

test('getEngineCharacterConfig resolves 3D Studio Creator and 3D Headphone Creator presets', () => {
  const studio3d = getEngineCharacterConfig('kreator_3d_studio', 'pria');
  assert.ok(studio3d);
  assert.equal((studio3d.look as any).__is3DStudioCreator, true);
  assert.equal((studio3d.look as any).__has3DHeadphone, false);

  const headphone3d = getEngineCharacterConfig('kreator_3d_headphone', 'pria');
  assert.ok(headphone3d);
  assert.equal((headphone3d.look as any).__is3DStudioCreator, true);
  assert.equal((headphone3d.look as any).__has3DHeadphone, true);
});



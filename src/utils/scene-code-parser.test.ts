import test from 'node:test';
import assert from 'node:assert/strict';
import {
  looksLikeReactOrJsxCode,
  isExecutableSatsetSceneCode,
  sanitizeSingleSceneCode,
  extractSceneSections,
  parseSingleSceneCode,
  parseBatchSceneCodes,
  buildSampleBatchCode,
} from './scene-code-parser.ts';

test('looksLikeReactOrJsxCode identifies JSX and import/export snippets cleanly', () => {
  assert.equal(looksLikeReactOrJsxCode('export const Scene1 = () => <RemotionCanvas />;'), true);
  assert.equal(looksLikeReactOrJsxCode('import React from "react";\ns.box(360, 400, 100, 100, 50);'), true);
  assert.equal(looksLikeReactOrJsxCode('s.box(360, 400, 100, 100, 50, { fill: s.c.blue });'), false);
});

test('sanitizeSingleSceneCode strips markdown fences, prose, and function wrappers', () => {
  const raw = `Berikut kode animasinya kak:

\`\`\`js
function renderScene(s, ctx) {
  const k = s.spring(0.1);
  s.circle(360, 420, 90 * k, { fill: "#29e7ff" });
}
\`\`\`

Semoga membantu!`;

  const cleaned = sanitizeSingleSceneCode(raw);
  assert(!cleaned.includes('Berikut kode'));
  assert(!cleaned.includes('```'));
  assert(!cleaned.includes('function renderScene'));
  assert(cleaned.includes('s.circle(360, 420, 90 * k'));
  assert.equal(isExecutableSatsetSceneCode(cleaned), true);
});

test('extractSceneSections splits multi-scene code even with identical const names across scenes', () => {
  const raw = `\`\`\`js
// ===== SCENE 1 =====
const k = s.spring(0.1);
s.box(360, 420, 120, 120, 80, { fill: s.c.orange, draw: k });

// ===== SCENE 2 =====
const k = s.spring(0.2);
s.sphere(360, 420, 100, { fill: s.c.teal, draw: k });
\`\`\``;

  const sections = extractSceneSections(raw);
  assert.deepEqual(Object.keys(sections).map(Number), [1, 2]);
  assert(sections[1].includes('s.box('));
  assert(sections[2].includes('s.sphere('));
});

test('parseBatchSceneCodes rejects single unseparated block to avoid cloning identical scenes', () => {
  const singleBlock = `const k = s.spring(0.1);\ns.box(360, 420, 100, 100, 60, { draw: k });`;
  const res = parseBatchSceneCodes(singleBlock, 1, 6);
  assert.equal(res.ok, false);
  assert(res.error?.includes('SCENE 1'));
});

test('parseBatchSceneCodes rejects React JSX templates clearly', () => {
  const jsxInput = `export const Scene1 = () => {\n  return <RemotionCanvas layout="diorama_3d" />\n};`;
  const res = parseBatchSceneCodes(jsxInput, 1, 4);
  assert.equal(res.ok, false);
  assert(res.error?.includes('React/JSX'));
});

test('parseBatchSceneCodes catches JS syntax errors per scene number', () => {
  const broken = `\`\`\`js
// ===== SCENE 1 =====
s.circle(360, 420, 80, { fill: s.c.blue });

// ===== SCENE 2 =====
const k = s.spring(0.2;
s.box(360, 420, 90, 90, 60);
\`\`\``;

  const res = parseBatchSceneCodes(broken, 1, 2);
  assert.equal(res.ok, false);
  assert(res.error?.includes('Scene 2'));
});

test('parseBatchSceneCodes handles partial batches cleanly without cloning missing scenes', () => {
  const partial = `\`\`\`js
// ===== SCENE 1 =====
s.circle(360, 420, 80, { fill: s.c.blue });

// ===== SCENE 2 =====
s.rect(200, 300, 140, 140, { fill: s.c.orange });
\`\`\``;

  const res = parseBatchSceneCodes(partial, 1, 4);
  assert.equal(res.ok, true);
  assert.deepEqual(res.parsedSceneNumbers, [1, 2]);
  assert.deepEqual(res.missingSceneNumbers, [3, 4]);
  assert.equal(res.scenesByNumber[3], undefined);
  assert(res.warning?.includes('3, 4'));
});

test('buildSampleBatchCode produces distinct valid code sections for every scene in batch', () => {
  const sample = buildSampleBatchCode('futuristik', 1, 4);
  const parsed = parseBatchSceneCodes(sample, 1, 4);
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.parsedSceneNumbers, [1, 2, 3, 4]);
  assert.notEqual(parsed.scenesByNumber[1], parsed.scenesByNumber[2]);
});

test('parseSingleSceneCode extracts requested scene when user pastes multi-scene output into modal', () => {
  const multi = `// ===== SCENE 1 =====\ns.circle(360, 420, 70);\n// ===== SCENE 2 =====\ns.box(360, 420, 80, 80, 50);`;
  const res = parseSingleSceneCode(multi, 2);
  assert.equal(res.ok, true);
  assert(res.code?.includes('s.box'));
  assert(!res.code?.includes('s.circle'));
});

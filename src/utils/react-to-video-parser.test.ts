import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReactToVideoInput } from './react-to-video-parser.ts';

test('parseReactToVideoInput extracts multi-scene Remotion TSX <Sequence> blocks accurately', () => {
  const sampleTsx = `
    import React from 'react';
    import { Sequence, AbsoluteFill } from 'remotion';

    export const DemoComposition: React.FC = () => (
      <AbsoluteFill style={{ backgroundColor: '#1e3a8a', color: '#ffd23f' }}>
        <Sequence from={0} durationInFrames={120} name="Hook Pembuka">
          <h1>Berhenti Bikin Slide Video Kaku!</h1>
          <p>Sekarang komponen React langsung berubah jadi animasi 3D berpegas.</p>
          <path d="M-40 -10 L40 10 Z" />
        </Sequence>
        <Sequence from={120} durationInFrames={150} name="Grafik Retensi">
          <h2>Retensi Naik 340% Dengan Motion</h2>
          <p>Grafik batang tumbuh bertahap dan kamera push-in pelan.</p>
        </Sequence>
        <Sequence from={270} durationInFrames={120} name="Langkah Praktis">
          <h2>Tiga Langkah Ekspor Remotion</h2>
          <p>Pertama ekstrak TSX, kedua sinkron pose, ketiga render 30 FPS.</p>
        </Sequence>
        <Sequence from={390} durationInFrames={120} name="CTA Akhir">
          <h2>Simpan & Render Video Sekarang!</h2>
          <p>Klik export Remotion untuk mendapatkan komposisi lengkap.</p>
        </Sequence>
      </AbsoluteFill>
    );
  `;

  const result = parseReactToVideoInput(sampleTsx, 'DemoComposition.tsx', 'Demo Motion');
  assert.equal(result.sourceKind, 'remotion-tsx');
  assert.equal(result.detectedFps, 30);
  assert.equal(result.detectedAspectRatio, '9:16');
  assert.ok(result.detectedColors.includes('#1e3a8a'));
  assert.equal(result.scenesPreview.length, 4);

  assert.equal(result.scenesPreview[0].template, 'hook');
  assert.equal(result.scenesPreview[1].template, 'chart');
  assert.equal(result.scenesPreview[2].template, 'steps');
  assert.equal(result.scenesPreview[3].template, 'cta');

  // Verify SVG path noise was stripped
  const combinedText = result.scenesPreview
    .map((s) => `${s.headline} ${s.narration}`)
    .join(' ');
  assert.ok(!combinedText.includes('M-40 -10'), 'Must filter out SVG path noise');

  // Verify project pipeline synchronization
  assert.equal(result.project.scenes.length, 4);
  assert.ok(result.project.scenes.every((sc) => Array.isArray(sc.emphasis_words) && sc.emphasis_words.length > 0));
  assert.ok((result.project.target_duration_sec || 0) >= 14);
});

test('parseReactToVideoInput splits multi-component React JSX and detects 16:9 aspect ratio', () => {
  const reactCode = `
    // 1920 x 1080 landscape
    const CompareScene = () => (
      <section className="flex flex-col items-center">
        <h2>Lama vs Otomatis</h2>
        <p>Bandingkan proses manual lambat dengan sistem pegas otomatis.</p>
      </section>
    );
    const MetaphorScene = () => (
      <section>
        <h3>Ibarat Mesin Presisi</h3>
        <p>Bayangkan setiap keyframe bekerja selaras sebagai jantung video.</p>
      </section>
    );
  `;

  const result = parseReactToVideoInput(reactCode, 'LandscapeScenes.tsx');
  assert.equal(result.sourceKind, 'react-jsx');
  assert.equal(result.detectedAspectRatio, '16:9');
  assert.equal(result.scenesPreview.length, 2);
  assert.equal(result.scenesPreview[0].template, 'hook');
  assert.equal(result.scenesPreview[1].template, 'cta');
});

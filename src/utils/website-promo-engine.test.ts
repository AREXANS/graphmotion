import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractWebsiteUrl,
  extractDomainFromUrl,
  parseWebsiteHtmlMetadata,
  buildWebsitePromoProfile,
  buildWebsitePromoConcepts,
  buildWebsitePromoScenes,
  buildNonRepeatingScenesFromConcept,
} from './website-promo-engine';
import {
  buildContextualSatsetSceneCode,
  applySmartSceneRevision,
} from './contextual-scene-builder';
import { synchronizeProjectPipeline } from './pipeline-sync';
import { buildSatsetTimelineForProject } from './satset-timeline-builder';
import { collectSatsetSfxTimeline, computeSatsetCameraTransform } from './satset-renderer-engine';
import { renderSatsetSceneFrame } from './custom-style-runtime';
import { generateRemotionCode } from './remotion-generator';
import { SatsetProject } from '../types/satset';

test('extractWebsiteUrl detects bare domains and full https URLs inside text', () => {
  assert.equal(extractWebsiteUrl('https://tokokita.id'), 'https://tokokita.id');
  assert.equal(
    extractWebsiteUrl('Promosikan website otomatis https://tokokita.id untuk bisnis'),
    'https://tokokita.id'
  );
  assert.equal(extractWebsiteUrl('tokokita.id'), 'https://tokokita.id');
  assert.equal(extractDomainFromUrl('https://www.tokokita.id/register'), 'tokokita.id');
});

test('buildWebsitePromoProfile builds accurate 8-step walkthrough and auto-extracts brand colors for any website', () => {
  const sampleHtml = `
    <html>
      <head>
        <title>Tokokita — Otomasi Kasir &amp; Pembayaran Instan</title>
        <meta name="theme-color" content="#059669" />
        <style>:root { --brand-secondary: #34D399; --brand-accent: #3B82F6; }</style>
      </head>
      <body>
        <h1>Otomasi Kasir &amp; Pembayaran Instan</h1>
        <h2>Pantau Transaksi Real-Time</h2>
      </body>
    </html>
  `;
  const parsed = parseWebsiteHtmlMetadata(sampleHtml, 'https://tokokita.id');
  const profile = buildWebsitePromoProfile('https://tokokita.id', parsed);
  assert.equal(profile.brandName, 'Tokokita');
  assert.equal(profile.domain, 'tokokita.id');
  assert.equal(profile.primaryColor, '#059669');
  assert.equal(profile.secondaryColor, '#34D399');
  assert.equal(profile.accentColor, '#3B82F6');
  assert.equal(profile.steps.length, 8);

  for (let i = 0; i < profile.steps.length; i++) {
    assert.equal(profile.steps[i].cards.length, 3, `Step ${i + 1} must have 3 UI cards`);
  }
});

test('Website Auto-Promotion pipeline generates 8 non-repeating scenes, preserves scraped media when custom Remotion code is added, and produces responsive camera & SFX', () => {
  const profile = buildWebsitePromoProfile('https://tokokita.id');
  const concepts = buildWebsitePromoConcepts(profile);
  const scenes = buildWebsitePromoScenes(profile, 8, 48, concepts[0]);

  assert.equal(scenes.length, 8);

  const uniqueNarrations = new Set(scenes.map((s) => (s.narration_text || '').trim().toLowerCase()));
  assert.equal(uniqueNarrations.size, 8, 'All 8 scene narrations must be 100% unique (never repeated)');

  const rawProject: SatsetProject = {
    id: 'test-web-promo',
    project_title: `${profile.brandName} — ${profile.tagline}`,
    start_mode: 'url',
    source_url: profile.url,
    website_promo: profile,
    content_type: 'promosi',
    topik_video: profile.url,
    target_duration_sec: 48,
    gaya_video: 'diorama_data',
    transition: 'otomatis',
    tempo: 'energik',
    aspect_ratio: '9:16',
    scenes,
    createdAt: Date.now(),
  };

  const synced = synchronizeProjectPipeline(rawProject, {
    recalculateDurations: false,
    forceStyleSync: true,
  });

  // Simulate user or AI adding custom Remotion/Canvas code to Scene 1:
  // It must run the custom animation and attach a proportional PiP media card!
  synced.scene_codes = {
    ...(synced.scene_codes || {}),
    1: `s.sparkle(140, 220, 36, { draw: s.pop(0.2, 0.4) });\ns.sfx("zoom_in", 0.35, 0.8);`,
  };

  const { timelineScenes, projectMeta } = buildSatsetTimelineForProject(synced);
  assert.ok(
    timelineScenes[0].code.includes('s.photo(') &&
      timelineScenes[0].code.includes('Proportional Scraped/Uploaded Media PiP Reference Card'),
    'Custom Remotion code on a scraped website scene must include proportional PiP s.photo alongside custom animation'
  );
  assert.deepEqual(projectMeta.brand?.colors, [
    profile.primaryColor,
    profile.secondaryColor,
    profile.accentColor,
  ]);

  // Verify all 8 scenes have distinct visual_animation.layout values (never repeating)
  const layouts = new Set(scenes.map((s) => s.visual_animation?.layout));
  assert.equal(layouts.size, 8, 'All 8 website scenes must have distinct Remotion layouts');

  // Verify Remotion TSX code includes website_step and transition audio
  const remotion = generateRemotionCode(synced, 30);
  assert.ok(remotion.compositionTsx.includes('tokokita.id'));
  assert.ok(remotion.compositionTsx.includes('swish_transition.mp3'));

  // Verify camera movement (zoom, pan, tilt) is dynamic and not clamped to 0
  const camStart = computeSatsetCameraTransform(timelineScenes[0] as any, 0.05, projectMeta as any);
  const camMid = computeSatsetCameraTransform(timelineScenes[0] as any, 2.5, projectMeta as any);
  assert.ok(
    Math.abs(camMid.zoom - camStart.zoom) > 0.04 || Math.abs(camMid.x - camStart.x) > 3 || Math.abs(camMid.y - camStart.y) > 3,
    'Camera transform must actively animate zoom/pan/tilt across scene playback'
  );

  // Verify SFX timeline has motion/zoom/transition SFX across the entire video and NO subtitle word ticks
  const sfxEvents = collectSatsetSfxTimeline(timelineScenes, projectMeta as any);
  assert.ok(sfxEvents.length >= 24, `Expected rich motion SFX timeline, got ${sfxEvents.length} events`);
  const subtitleTickEvents = sfxEvents.filter((ev: any) => ev.name === 'tick' && ev.gain === 0.45);
  assert.equal(subtitleTickEvents.length, 0, 'Subtitles must NOT emit per-word tick sound effects');

  // Ensure every scene window [start, end] has at least 2 motion/transition SFX cues
  let tCursor = 0;
  for (let i = 0; i < timelineScenes.length; i++) {
    const dur = timelineScenes[i].duration;
    const inSceneEvents = sfxEvents.filter((ev: any) => ev.t >= tCursor - 0.2 && ev.t <= tCursor + dur + 0.2);
    assert.ok(
      inSceneEvents.length >= 2,
      `Scene ${i + 1} ([${tCursor}s..${tCursor + dur}s]) must have audible motion/transition SFX events`
    );
    tCursor += dur;
  }

  // Verify every scene's generated code compiles and renders cleanly on Canvas without runtime error
  const canvas: any = { width: 720, height: 1280 };
  const noopGrad = { addColorStop: () => {} };
  const mockCtx: any = new Proxy(
    { canvas, fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, globalAlpha: 1 },
    {
      get(target: any, prop) {
        if (prop in target) return target[prop];
        if (prop === 'measureText') return (str: string) => ({ width: String(str ?? '').length * 10 });
        if (prop === 'createLinearGradient' || prop === 'createRadialGradient' || prop === 'createPattern') {
          return () => noopGrad;
        }
        return () => {};
      },
      set(target: any, prop, val) {
        target[prop] = val;
        return true;
      },
    }
  );

  for (let i = 0; i < timelineScenes.length; i++) {
    const renderRes: any = renderSatsetSceneFrame(mockCtx, timelineScenes[i] as any, 1.5, projectMeta as any);
    assert.equal(
      renderRes?.error ?? null,
      null,
      `Scene ${i + 1} threw runtime error during Canvas render: ${renderRes?.error?.message || renderRes?.error}`
    );
  }
});

test('buildNonRepeatingScenesFromConcept generates distinct narrations for any custom topic', () => {
  const concept = {
    id: 'c-custom',
    title: 'Strategi Fokus Kerja Tanpa Burnout',
    hook: 'KERJA 12 JAM / TAPI HASIL / JALAN DI TEMPAT',
    angle:
      'Banyak pekerja mengira produktif artinya sibuk tanpa jeda dari pagi sampai malam. Padahal otak manusia punya batas fokus mendalam sekitar sembilan puluh menit. Gunakan blok kerja terfokus lalu istirahat lima belas menit tanpa layar HP. Dengan cara ini energi harianmu tetap utuh dan pekerjaan selesai dua kali lebih cepat.',
    corePoints: [
      'Otak punya siklus fokus mendalam 90 menit',
      'Jeda 15 menit tanpa layar HP memulihkan fokus',
      'Tutup hari kerja dengan 3 prioritas esok hari',
    ],
  };

  const scenes = buildNonRepeatingScenesFromConcept(
    concept,
    {
      id: 'proj-custom',
      topik_video: 'produktivitas kerja mendalam',
      gaya_video: 'scribble3d',
      warna_brand: '#2563EB',
      scenes: [],
      createdAt: Date.now(),
    },
    8,
    60
  );

  assert.equal(scenes.length, 8);
  const narrations = scenes.map((s) => (s.narration_text || '').trim().toLowerCase());
  assert.equal(new Set(narrations).size, 8, 'Every scene narration must be unique');
});

test('Auto Target Duration, Authentic Website Step Snapshots, and Auto Subtitle / Graph Motion Watermark defaults', async () => {
  const { computeAutoTargetDuration, getStepFocusRegion } = await import('./website-media-engine');
  const profile = buildWebsitePromoProfile('https://tokokita.id');
  const concepts = buildWebsitePromoConcepts(profile);
  const scenes = buildWebsitePromoScenes(profile, 8, 48, concepts[0]);

  // Verify every scene has authentic website snapshot metadata and focus region
  for (let i = 0; i < scenes.length; i++) {
    assert.ok(scenes[i].media_key, `Scene ${i + 1} must have media_key for real website step rendering`);
    assert.ok(
      scenes[i].media_type === 'image' || scenes[i].media_type === 'website_snapshot',
      `Scene ${i + 1} must have image or website_snapshot media_type`
    );
    assert.ok(scenes[i].focus_region, `Scene ${i + 1} must have camera focus_region`);
    const region = getStepFocusRegion(i, profile.steps[i]);
    assert.ok(region.zoom >= 1.1 && region.zoom <= 1.35);
  }

  // Verify automatic target duration adapts to scene count, narration words, and uploaded media
  const autoDurFromScenes = computeAutoTargetDuration({
    scenes,
    tempo: 'energik',
  });
  assert.ok(autoDurFromScenes >= 35 && autoDurFromScenes <= 80, `Expected auto duration in 35..80s, got ${autoDurFromScenes}s`);

  const autoDurFromUploadedMedia = computeAutoTargetDuration({
    uploadedMedia: [
      { id: 'u1', key: 'k1', url: 'data:video/mp4;base64,', filename: 'step1.mp4', name: 'step1.mp4', type: 'video', dataUrl: 'data:video/mp4;base64,', mediaKey: 'k1', durationSec: 9 },
      { id: 'u2', key: 'k2', url: 'data:image/png;base64,', filename: 'step2.png', name: 'step2.png', type: 'image', dataUrl: 'data:image/png;base64,', mediaKey: 'k2', durationSec: 6 },
      { id: 'u3', key: 'k3', url: 'data:video/mp4;base64,', filename: 'step3.mp4', name: 'step3.mp4', type: 'video', dataUrl: 'data:video/mp4;base64,', mediaKey: 'k3', durationSec: 8 },
    ],
  });
  assert.equal(autoDurFromUploadedMedia, 23);

  // Verify timeline builder sets captionPos to 'auto' and watermark to 'Graph Motion' by default
  const { timelineScenes, projectMeta } = buildSatsetTimelineForProject({
    id: 'proj-auto-test',
    project_title: 'Tokokita Auto Promo',
    website_promo: profile,
    duration_mode: 'auto',
    subtitle_position: 'auto',
    scenes,
    createdAt: Date.now(),
  });
  assert.equal(projectMeta.watermark, 'Graph Motion');
  for (const ts of timelineScenes) {
    assert.equal(ts.captionPos, 'auto', 'Every timeline scene must default to auto anti-overlap subtitle placement');
  }
});

test('parseWebsiteHtmlMetadata discovers internal endpoints and real website images/videos', () => {
  const sampleHtml = `
    <html>
      <head>
        <title>StudioMotion — Studio Video &amp; Otomasi Kreator</title>
        <meta name="description" content="Platform otomasi konten video dan animasi untuk kreator digital." />
        <meta property="og:image" content="/assets/hero-dashboard.png" />
      </head>
      <body>
        <nav>
          <a href="/fitur">Fitur Studio</a>
          <a href="/harga">Paket Harga</a>
          <a href="/daftar">Daftar Akun</a>
          <a href="/api/v1/render">Endpoint API Render</a>
        </nav>
        <h1>Otomasi Video Motion 10x Lebih Cepat</h1>
        <h2>Rakit Naskah dan Visual Sekaligus</h2>
        <p>Gunakan template interaktif dan ekspor MP4 resolusi tinggi langsung dari browser.</p>
        <img src="/images/preview-step-1.jpg" alt="Preview Editor Langkah 1" />
        <video src="https://studiomotion.id/media/demo-walkthrough.mp4" title="Demo Walkthrough"></video>
      </body>
    </html>
  `;

  const parsed = parseWebsiteHtmlMetadata(sampleHtml, 'https://studiomotion.id');
  assert.ok(parsed.discoveredEndpoints && parsed.discoveredEndpoints.length >= 4);
  const paths = parsed.discoveredEndpoints.map((ep) => ep.path);
  assert.ok(paths.includes('/fitur'));
  assert.ok(paths.includes('/harga'));
  assert.ok(paths.includes('/daftar'));

  assert.ok(parsed.discoveredMedia && parsed.discoveredMedia.length >= 3);
  const mediaUrls = parsed.discoveredMedia.map((m) => m.url);
  assert.ok(mediaUrls.includes('https://studiomotion.id/assets/hero-dashboard.png'));
  assert.ok(mediaUrls.includes('https://studiomotion.id/images/preview-step-1.jpg'));
  assert.ok(mediaUrls.includes('https://studiomotion.id/media/demo-walkthrough.mp4'));

  const profile = buildWebsitePromoProfile('https://studiomotion.id', parsed);
  assert.ok(profile.discoveredEndpoints && profile.discoveredEndpoints.length >= 4);
  assert.ok(profile.discoveredMedia && profile.discoveredMedia.length >= 3);
  assert.ok(profile.crawlSummary && profile.crawlSummary.endpointsCount >= 4);
  assert.equal(profile.steps[0].screenshotDataUrl, 'https://studiomotion.id/images/preview-step-1.jpg');
});

test('Regular Remotion styles render uploaded photo/video assets via s.photo and support AI Revision', () => {
  const concept = {
    id: 'c-reg',
    title: 'Strategi Konten Kreator',
    hook: 'KONTEN KONSISTEN / TANPA REPOT / SETIAP HARI',
    angle: 'Gunakan sistem produksi terstruktur agar setiap ide langsung berubah menjadi video pendek yang siap tayang.',
    corePoints: ['Riset topik', 'Susun naskah', 'Render otomatis'],
  };

  const baseProject: SatsetProject = {
    id: 'proj-reg-media',
    topik_video: 'strategi konten kreator',
    gaya_video: 'diorama_data',
    scenes: [],
    createdAt: Date.now(),
  };

  const scenes = buildNonRepeatingScenesFromConcept(concept, baseProject, 4, 24, [
    {
      key: 'user-media-1',
      url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      type: 'image',
      filename: 'dashboard-proof.png',
    },
  ]);

  assert.equal(scenes[0].visualModule, 'diorama_data', 'Regular mode must preserve diorama_data style');
  assert.equal(scenes[0].media_key, 'user-media-1');
  assert.equal(scenes[0].media_filename, 'dashboard-proof.png');

  const projectWithScenes: SatsetProject = { ...baseProject, scenes };
  const { code: codeScene1 } = buildContextualSatsetSceneCode(scenes[0], projectWithScenes, 0, scenes.length);
  assert.ok(
    codeScene1.includes('s.photo("user-media-1"') || codeScene1.includes("s.photo('user-media-1'"),
    'Regular Remotion style must render uploaded photo/video asset inside scene canvas via s.photo'
  );

  // Test post-animation AI revision
  const { updatedScene: revisedScene, updatedCode: revisedCode } = applySmartSceneRevision(
    scenes[0],
    projectWithScenes,
    'Perbesar zoom gambar ke kanan atas dan ganti judul jadi "BUKTI HASIL NYATA"',
    0,
    scenes.length
  );
  assert.equal(revisedScene.on_screen_text, 'BUKTI HASIL NYATA');
  assert.ok((revisedScene.focus_region?.zoom || 1) >= 1.24);
  assert.ok(revisedCode.includes('BUKTI HASIL NYATA'));
});

test('parseWebsiteHtmlMetadata excludes website logos/icons and prioritizes real content images and video posters', () => {
  const merchantHtml = `
    <html>
      <head>
        <title>MerchantPay - Payment Gateway Mandiri 0% Komisi</title>
        <meta name="description" content="Otomatisasi verifikasi pembayaran transfer bank dan QRIS langsung ke rekening pribadi." />
      </head>
      <body>
        <header>
          <img src="/logo.png" alt="MerchantPay Brand Logo" class="w-9 h-9 rounded-lg object-contain" />
          <img src="/assets/favicon-32x32.png" alt="Icon" width="32" height="32" />
        </header>
        <main>
          <h1>Payment Gateway Mandiri Tanpa Potongan Komisi</h1>
          <video poster="/uploads/thumbnails/merchant_thumb_default.jpg" controls>
            <source src="/uploads/videos/demo_walkthrough.mp4" type="video/mp4" />
          </video>
          <video poster="/uploads/thumbnails/automate_thumb_hd.jpg" controls></video>
          <img src="/uploads/screenshots/mutasi-dashboard-full.jpg" alt="Dashboard Mutasi Real-time" width="1280" height="720" />
        </main>
      </body>
    </html>
  `;

  const parsed = parseWebsiteHtmlMetadata(merchantHtml, 'https://merchantpay.id');
  assert.ok(parsed.discoveredMedia && parsed.discoveredMedia.length >= 3);
  const urls = parsed.discoveredMedia.map((m) => m.url);

  // Must NOT include /logo.png or /assets/favicon-32x32.png
  assert.equal(
    urls.some((u) => u.includes('logo.png') || u.includes('favicon')),
    false,
    'Website logos and favicons must be excluded from scene visual assets'
  );

  // Must include real video posters and content screenshots
  assert.ok(urls.includes('https://merchantpay.id/uploads/thumbnails/merchant_thumb_default.jpg'));
  assert.ok(urls.includes('https://merchantpay.id/uploads/thumbnails/automate_thumb_hd.jpg'));
  assert.ok(urls.includes('https://merchantpay.id/uploads/screenshots/mutasi-dashboard-full.jpg'));

  const profile = buildWebsitePromoProfile('https://merchantpay.id', parsed);
  const scenes = buildWebsitePromoScenes(profile, 8, 48);
  for (const sc of scenes) {
    assert.ok(sc.media_url, 'Every scene must reference a real content media asset');
    assert.equal(
      sc.media_url.includes('logo.png'),
      false,
      'No scene may reference the website logo as its step visual'
    );
  }
});

test('3D Chibi kinematics preserve eye-contact headYaw and compact mouthOpen bounds across poses', async () => {
  const { evaluateCreator3DKinematics } = await import('./creator-3d-kinematics');
  const poses = ['present', 'point', 'idea', 'think', 'thumbs', 'wave', 'walk'] as const;
  const captionWords = [
    { text: 'Halo', at: 0.05, end: 0.35, key: false },
    { text: 'kreator', at: 0.38, end: 0.82, key: true },
    { text: 'Indonesia!', at: 0.85, end: 1.4, key: true },
  ];
  for (const pose of poses) {
    for (const t of [0.1, 0.55, 1.1]) {
      const k = evaluateCreator3DKinematics([[pose, 0]], t, {
        speaking: true,
        captionWords,
      });
      assert.ok(
        Math.abs(k.headYaw) <= 0.22,
        `Pose "${pose}" at t=${t}s exceeded gentle headYaw bound: ${k.headYaw}`
      );
      assert.ok(
        k.mouthOpen >= 0 && k.mouthOpen <= 0.75,
        `Pose "${pose}" at t=${t}s exceeded compact mouthOpen bound (<=0.75): ${k.mouthOpen}`
      );
    }
  }
});

test('studio_3d_room and editorial_motion_grid adapt visuals to non-tech topics without generic clip/npx boilerplate', () => {
  const habitConcept = {
    id: 'c-morning',
    title: 'Kenapa Pagi Terasa Berat?',
    hook: 'ALARM BUNYI / TAPI MATA / SUSAH MELEK',
    angle: 'Jangan langsung pegang HP saat bangun pagi karena dopamin instan bikin otak lelah seharian. Minum air putih lalu kena cahaya matahari lima menit agar ritme tubuh langsung segar.',
    corePoints: ['Stop snooze alarm', 'Minum air putih', 'Cahaya matahari pagi'],
  };

  for (const style of ['studio_3d_room', 'editorial_motion_grid'] as const) {
    const project: SatsetProject = {
      id: `proj-${style}`,
      project_title: 'Kenapa Pagi Terasa Berat?',
      topik_video: 'kebiasaan bangun pagi sehat',
      gaya_video: style,
      scenes: [],
      createdAt: Date.now(),
    };
    const scenes = buildNonRepeatingScenesFromConcept(habitConcept, project, 5, 25);
    const fullProject: SatsetProject = { ...project, scenes };
    const { timelineScenes, projectMeta } = buildSatsetTimelineForProject(fullProject);

    assert.equal(timelineScenes.length, 5);
    const canvas: any = { width: 720, height: 1280 };
    const noopGrad = { addColorStop: () => {} };
    const mockCtx: any = new Proxy(
      { canvas, fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, globalAlpha: 1 },
      {
        get(target: any, prop) {
          if (prop in target) return target[prop];
          if (prop === 'measureText') return (str: string) => ({ width: String(str ?? '').length * 10 });
          if (prop === 'createLinearGradient' || prop === 'createRadialGradient' || prop === 'createPattern') {
            return () => noopGrad;
          }
          return () => {};
        },
        set(target: any, prop, val) {
          target[prop] = val;
          return true;
        },
      }
    );

    timelineScenes.forEach((ts, idx) => {
      assert.equal(
        ts.code.includes('15X VIRAL CLIPS') || ts.code.includes('$ npx remotion render'),
        false,
        `${style} scene ${idx + 1} must not emit generic viral-clip or npx boilerplate for morning-habit topic`
      );
      if (style === 'studio_3d_room') {
        assert.ok(ts.code.includes('fitScale'), 'studio_3d_room must auto-measure wall headline width');
      }
      const res: any = renderSatsetSceneFrame(mockCtx, ts as any, 1.2, projectMeta as any);
      assert.equal(res?.error ?? null, null, `${style} scene ${idx + 1} failed to render cleanly`);
    });
  }
});

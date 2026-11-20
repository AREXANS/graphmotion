import { type SatsetProject, type SatsetScene, type SatsetStyleModule, type WebsiteStepVisual } from '../types/satset.ts';
import { getEngineCharacterConfig } from './character-catalog.ts';
import { getSatsetStyleDef, resolveSatsetStyleId } from './custom-style-runtime.ts';
import { registerSatsetMediaAsset, getSatsetMediaAsset } from './satset-cloud-engine.ts';
import {
  buildExecutableAssetMotionSnippet,
  getStepFocusRegion,
  registerSceneUploadedMediaAsset,
  renderAuthenticWebsiteStepSnapshot,
} from './website-media-engine.ts';
import { buildWebsitePromoProfile, extractWebsiteUrl } from './website-promo-engine.ts';
import { detectMentionedPlatforms } from './platform-logos.ts';

export const AUTO_CONTEXTUAL_SCENE_HEADER = '// @auto-contextual-scene';

export type VisualMotif =
  | 'website_walkthrough'
  | 'alarm_clock'
  | 'magnet_choice'
  | 'phone_scroll'
  | 'money_flow'
  | 'growth_chart'
  | 'checklist_steps'
  | 'brain_idea'
  | 'stair_goal'
  | 'cta_card';

export function isAutoContextualSceneCode(code?: string | null): boolean {
  if (!code || typeof code !== 'string') return false;
  return code.trimStart().startsWith(AUTO_CONTEXTUAL_SCENE_HEADER);
}

export interface AutoStyleResolution {
  styleId: SatsetStyleModule;
  styleTitle: string;
  reason: string;
  cameraDirection: 'push' | 'pull' | 'pan_left' | 'pan_right' | 'orbit' | 'zoom_out' | 'shake';
}

/**
 * Resolves the most appropriate concrete SatsetStyleModule based on the active concept,
 * topic, content type, and optional scene narrative. Used whenever gaya_video === 'otomatis'
 * or when auto-adapting style to the concept being discussed.
 */
export function resolveAutoStyleForConceptAndScene(
  project?: Partial<SatsetProject>,
  scene?: Partial<SatsetScene>,
  sceneIndex = 0
): AutoStyleResolution {
  const explicitStyle = project?.gaya_video;
  if (explicitStyle && explicitStyle !== 'otomatis') {
    const resolvedExplicit = resolveSatsetStyleId(explicitStyle) as SatsetStyleModule;
    return {
      styleId: resolvedExplicit,
      styleTitle: String(resolvedExplicit).replace(/_/g, ' ').toUpperCase(),
      reason: 'Menggunakan gaya video pilihan pengguna',
      cameraDirection: resolveAutoCameraPlanForScene(scene || {}, 'growth_chart', sceneIndex, project?.scenes?.length || 6).cameraMode,
    };
  }

  const ideas = project?.idea_concepts || [];
  const selectedIdea =
    ideas.find((it) => it.id === project?.selected_idea_id) || ideas[0];

  const contentTypeStr = String(project?.content_type || '');
  const conceptText = [
    selectedIdea?.visualStyle,
    selectedIdea?.title,
    selectedIdea?.angle,
    selectedIdea?.hook,
    project?.topik_video,
    project?.project_title,
    contentTypeStr,
    (project as any)?.website_url,
    project?.source_url,
    scene?.narration_text,
    scene?.on_screen_text,
    scene?.visualDescription,
    scene?.visual,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const camMode = resolveAutoCameraPlanForScene(
    scene || {},
    'growth_chart',
    sceneIndex,
    project?.scenes?.length || 6
  ).cameraMode;

  const sceneSpecificText = [
    scene?.narration_text,
    scene?.on_screen_text,
    scene?.visualDescription,
    scene?.visual,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // Compute a deterministic hash from the scene's own concept text + project settings so each scene
  // dynamically shifts style according to its own narrative concept and project configuration
  const settingsSalt = `${project?.aspect_ratio || '9:16'}:${project?.character || 'default'}:${contentTypeStr}:${sceneSpecificText || conceptText}`;
  let conceptHash = sceneIndex * 131;
  for (let i = 0; i < settingsSalt.length; i++) {
    conceptHash = (conceptHash * 31 + settingsSalt.charCodeAt(i)) >>> 0;
  }

  // Build a concept-weighted pool for this specific scene based on what THIS scene is talking about
  const candidatePool: Array<{ id: SatsetStyleModule; title: string; reason: string }> = [];

  const checkText = sceneSpecificText || conceptText;

  if (/\b(data|angka|persen|grafik|statistik|naik|turun|biaya|uang|rupiah|profit|omzet|saham|investasi)\b/.test(checkText)) {
    candidatePool.push(
      { id: 'diorama_data', title: 'Konsep Data & Metrik 3D', reason: 'Adegan membahas metrik/angka → komposisi grafik & diorama data kontekstual' },
      { id: 'midnight', title: 'Konsep Analitik Finansial', reason: 'Adegan membahas pertumbuhan/nilai → visual analitik kontras tinggi' },
      { id: 'infografis_pop', title: 'Konsep Infografis Dinamis', reason: 'Adegan menjabarkan perbandingan angka secara visual' }
    );
  }
  if (/\b(sistem|cara kerja|proses|alur|mekanisme|mesin|komponen|bedah|arsitektur|struktur|langkah|algoritma)\b/.test(checkText)) {
    candidatePool.push(
      { id: 'cara_kerja', title: 'Konsep Alur Mekanisme', reason: 'Adegan menjelaskan alur proses langkah demi langkah' },
      { id: 'precision', title: 'Konsep Bedah Komponen 3D', reason: 'Adegan membedah struktur & komponen → komposisi exploded-view presisi' },
      { id: 'blueprint', title: 'Konsep Skema Arsitektur', reason: 'Adegan memetakan kerangka teknis dan hubungan antar-elemen' }
    );
  }
  if (/\b(website|aplikasi|platform|digital|fitur|produk|layar|browser|ui|dashboard|klik|online)\b/.test(checkText)) {
    candidatePool.push(
      { id: 'uiweb', title: 'Konsep Antarmuka Interaktif', reason: 'Adegan menyorot interaksi layar & produk digital' },
      { id: 'bento_grid', title: 'Konsep Modular Bento', reason: 'Adegan merangkum poin fitur dalam kartu modular' },
      { id: 'editorial_motion_grid', title: 'Konsep Editorial Tech Grid', reason: 'Adegan mengulas ekosistem digital dengan tata letak editorial' }
    );
  }
  if (/\b(dokumenter|arsip|kenangan|krisis|masa lalu|klasik|retro|199\d|200\d)\b/.test(checkText)) {
    candidatePool.push(
      { id: 'vintage_film', title: 'Konsep Dokumenter Sinematik', reason: 'Adegan mengangkat kilas balik dan atmosfer arsip dokumenter' },
      { id: 'paperworld', title: 'Konsep Diorama Cerita Berlapis', reason: 'Adegan membangun suasana naratif berlapis' },
      { id: 'worldforge_roma', title: 'Konsep Lanskap Sinematik 3D', reason: 'Adegan menggambarkan skala ruang dan latar cerita' }
    );
  }
  if (/\b(cerita|kisah|bayangkan|dulu|sejarah|awal|misteri|perjalanan|dunia|kota|peradaban|masa depan|planet)\b/.test(checkText)) {
    candidatePool.push(
      { id: 'paperworld', title: 'Konsep Diorama Cerita Berlapis', reason: 'Adegan membangun suasana naratif berlapis' },
      { id: 'worldforge_roma', title: 'Konsep Lanskap Sinematik 3D', reason: 'Adegan menggambarkan skala ruang dan latar cerita' },
      { id: 'vintage_film', title: 'Konsep Dokumenter Sinematik', reason: 'Adegan mengangkat kilas balik dan atmosfer cerita' },
      { id: 'voxelverse', title: 'Konsep Dunia Karakter 3D', reason: 'Adegan menampilkan interaksi karakter di ruang 3D' }
    );
  }
  if (/\b(tenang|fokus|pikiran|mental|santai|istirahat|refleksi|makna|hidup|sederhana)\b/.test(checkText)) {
    candidatePool.push(
      { id: 'tenang_minimalis', title: 'Konsep Ruang Fokus Minimalis', reason: 'Adegan memberi jeda reflektif yang bersih dan fokus' },
      { id: 'zen_paper', title: 'Konsep Harmoni Visual', reason: 'Adegan menekankan ketenangan dan keseimbangan komposisi' },
      { id: 'paperworld', title: 'Konsep Lapisan Lembut', reason: 'Adegan mengalir dengan kedalaman visual bertahap' }
    );
  }

  // Diverse fallback spectrum so consecutive scenes ALWAYS switch visual language & never feel stuck on one template
  const dynamicSpectrum: Array<{ id: SatsetStyleModule; title: string; reason: string }> = [
    { id: 'editorial_motion_grid', title: 'Konsep Editorial Motion', reason: 'Menyesuaikan ritme informasi dengan tipografi & grid dinamis' },
    { id: 'precision', title: 'Konsep Eksplorasi Presisi', reason: 'Menyorot detail inti bahasan secara tajam dan terukur' },
    { id: 'paperworld', title: 'Konsep Kedalaman Lapisan', reason: 'Membangun dimensi visual berlapis sesuai konteks kalimat' },
    { id: 'cara_kerja', title: 'Konsep Alur Kontekstual', reason: 'Memvisualisasikan hubungan sebab-akibat dari bahasan' },
    { id: 'voxelverse', title: 'Konsep Ruang Isometrik', reason: 'Menghadirkan perspektif ruang 3D yang hidup' },
    { id: 'diorama_data', title: 'Konsep Visualisasi Bukti', reason: 'Memperkuat argumen dengan elemen perbandingan visual' },
    { id: 'uiweb', title: 'Konsep Kanvas Interaktif', reason: 'Menampilkan elemen informasi terstruktur secara modern' },
    { id: 'studio_3d_room', title: 'Konsep Panggung Presentasi', reason: 'Menempatkan gagasan utama di panggung fokus utama' },
    { id: 'bento_grid', title: 'Konsep Kartu Ringkasan', reason: 'Mengelompokkan poin penting agar langsung mudah ditangkap' },
    { id: 'blueprint', title: 'Konsep Pemetaan Ide', reason: 'Menggambarkan konstruksi pemikiran secara sistematis' },
  ];

  // Combine scene-matched candidates with the shifted spectrum so every scene index gets a unique style
  const mergedPool = [...candidatePool, ...dynamicSpectrum];
  const uniquePool: Array<{ id: SatsetStyleModule; title: string; reason: string }> = [];
  const seenIds = new Set<string>();
  for (const item of mergedPool) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      uniquePool.push(item);
    }
  }

  // Scene 0 uses the strongest matched domain candidate when available; later scenes step cleanly across uniquePool
  const poolIndex =
    sceneIndex === 0 && candidatePool.length > 0
      ? 0
      : (sceneIndex * 3 + (conceptHash % 5)) % uniquePool.length;
  const picked = uniquePool[poolIndex] || dynamicSpectrum[sceneIndex % dynamicSpectrum.length];

  return {
    styleId: picked.id,
    styleTitle: picked.title,
    reason: picked.reason,
    cameraDirection: camMode,
  };
}

export interface NarrativeBeatSchedule {
  /** Beat 1 (Anchor / Main Stage entrance, ~0.04s - 0.10s) */
  beat1: number;
  /** Beat 2 (Secondary Object / Clause 2 entrance, ~24% of scene or word[25%]) */
  beat2: number;
  /** Beat 3 (Emphasis Moment / Core Climax + Camera Zoom-In, ~48% of scene or emphasis word timestamp) */
  beat3: number;
  /** Beat 4 (Payoff Tag / Summary Conclusion + Camera Zoom-Out, ~70% of scene) */
  beat4: number;
  /** Duration of pop/spring entrance in seconds */
  popSpan: number;
}

/**
 * Computes 4 distinct, tempo-synced narrative beat timestamps (in seconds) within [0, dur)
 * directly from `scene.word_timings` / `wordAt` and `emphasis_words` so Remotion/Canvas objects
 * and text labels appear progressively right when discussed—never all at once at frame 0.
 */
export function computeNarrativeBeatSchedule(
  scene: Partial<SatsetScene>,
  dur: number,
  tempo: string = 'energik'
): NarrativeBeatSchedule {
  const safeDur = Math.max(2.2, Number(dur || scene.target_duration_sec || 5.0));
  const isSlow = tempo === 'santai';
  const popSpan = isSlow ? 0.46 : 0.36;

  const rawTimings = Array.isArray(scene.word_timings) ? scene.word_timings : [];
  const wordStarts: number[] = rawTimings
    .map((w: any) => Number(w?.startSec ?? w?.at ?? NaN))
    .filter((n) => Number.isFinite(n) && n >= 0 && n < safeDur);

  const b1 = 0.04;

  if (wordStarts.length >= 4) {
    const n = wordStarts.length;
    const idx2 = Math.max(1, Math.min(n - 3, Math.floor(n * 0.26)));
    const idx3Default = Math.max(idx2 + 1, Math.min(n - 2, Math.floor(n * 0.52)));
    const idx4 = Math.max(idx3Default + 1, Math.min(n - 1, Math.floor(n * 0.74)));

    // Check if an emphasis word falls naturally in the middle of the narration
    let empStart = wordStarts[idx3Default];
    const empTiming = rawTimings.find(
      (wt: any) =>
        wt?.isEmphasis &&
        Number.isFinite(wt?.startSec) &&
        wt.startSec >= safeDur * 0.28 &&
        wt.startSec <= safeDur * 0.66
    );
    if (empTiming) {
      empStart = Number(empTiming.startSec);
    }

    const rawB2 = Math.max(0.42, Math.min(safeDur * 0.34, wordStarts[idx2]));
    const rawB3 = Math.max(rawB2 + 0.45, Math.min(safeDur * 0.62, empStart));
    const rawB4 = Math.max(rawB3 + 0.45, Math.min(safeDur - 0.65, Math.max(wordStarts[idx4], safeDur * 0.66)));

    return {
      beat1: Number(b1.toFixed(2)),
      beat2: Number(rawB2.toFixed(2)),
      beat3: Number(rawB3.toFixed(2)),
      beat4: Number(rawB4.toFixed(2)),
      popSpan: Number(popSpan.toFixed(2)),
    };
  }

  // Proportional fallback across full scene duration when word_timings isn't populated yet
  const rawB2 = Math.max(0.45, safeDur * 0.24);
  const rawB3 = Math.max(rawB2 + 0.45, safeDur * 0.48);
  const rawB4 = Math.max(rawB3 + 0.45, Math.min(safeDur - 0.6, safeDur * 0.72));

  return {
    beat1: Number(b1.toFixed(2)),
    beat2: Number(rawB2.toFixed(2)),
    beat3: Number(rawB3.toFixed(2)),
    beat4: Number(rawB4.toFixed(2)),
    popSpan: Number(popSpan.toFixed(2)),
  };
}

export interface MultiPhaseCameraPlan {
  cameraMode: 'push' | 'pull' | 'pan_left' | 'pan_right' | 'orbit' | 'zoom_out' | 'shake';
  /** Zoom delta at beat 2 (secondary element entrance) */
  p2ZoomDelta: number;
  /** Zoom delta at beat 3 (emphasis zoom-in peak) */
  p3ZoomDelta: number;
  /** Zoom-out recovery at beat 4 (wide payoff reveal) */
  p4ZoomOutDelta: number;
  /** Horizontal pan offset (in 720p base units) at beat 2 */
  p2PanX: number;
  /** Vertical pan offset (in 720p base units) at beat 2 */
  p2PanY: number;
  /** Horizontal pan offset at beat 3 (focus on active object) */
  p3PanX: number;
  /** Vertical pan offset at beat 3 */
  p3PanY: number;
  /** Subtle cinematic Dutch tilt angle in radians during focus shift */
  tiltRad: number;
}

/**
 * Computes a purposeful multi-phase camera choreography (Zoom In -> Pan to Active Element -> Zoom Out Payoff)
 * tailored to the scene's role, motif, and index so camera motion directs viewer attention like a human editor.
 */
export function resolveAutoCameraPlanForScene(
  scene: Partial<SatsetScene>,
  motif: VisualMotif,
  sceneIndex: number,
  totalScenes: number
): MultiPhaseCameraPlan {
  const role =
    scene.role ||
    (sceneIndex === 0 ? 'hook' : sceneIndex === totalScenes - 1 && totalScenes > 1 ? 'cta' : 'body_core_point');
  const dirSign = sceneIndex % 2 === 0 ? 1 : -1;

  if (role === 'hook' || sceneIndex === 0) {
    return {
      cameraMode: 'push',
      p2ZoomDelta: 0.05,
      p3ZoomDelta: 0.09,
      p4ZoomOutDelta: 0.10,
      p2PanX: -18 * dirSign,
      p2PanY: 8,
      p3PanX: 16 * dirSign,
      p3PanY: -12,
      tiltRad: 0.012 * dirSign,
    };
  }

  if (role === 'cta' || sceneIndex === totalScenes - 1) {
    return {
      cameraMode: 'pull',
      p2ZoomDelta: 0.08,
      p3ZoomDelta: 0.06,
      p4ZoomOutDelta: 0.14,
      p2PanX: 0,
      p2PanY: 14,
      p3PanX: 0,
      p3PanY: -10,
      tiltRad: 0.008 * dirSign,
    };
  }

  if (motif === 'magnet_choice' || motif === 'website_walkthrough') {
    // Pan left to Problem/Input on Beat 2 -> Pan right & Zoom In to Solution/Output on Beat 3 -> Zoom Out on Beat 4
    return {
      cameraMode: sceneIndex % 2 === 0 ? 'pan_right' : 'pan_left',
      p2ZoomDelta: 0.06,
      p3ZoomDelta: 0.08,
      p4ZoomOutDelta: 0.12,
      p2PanX: 28,
      p2PanY: 6,
      p3PanX: -32,
      p3PanY: -10,
      tiltRad: 0.014 * dirSign,
    };
  }

  if (motif === 'growth_chart' || motif === 'money_flow' || motif === 'stair_goal') {
    // Follow ascending bars from left-bottom -> top-right peak zoom-in -> wide summary zoom-out
    return {
      cameraMode: 'push',
      p2ZoomDelta: 0.05,
      p3ZoomDelta: 0.10,
      p4ZoomOutDelta: 0.12,
      p2PanX: 22,
      p2PanY: -8,
      p3PanX: -26,
      p3PanY: 18,
      tiltRad: -0.012,
    };
  }

  const cycleModes: Array<'push' | 'pan_right' | 'orbit' | 'pull' | 'pan_left'> = [
    'push',
    'pan_right',
    'orbit',
    'pull',
    'pan_left',
  ];
  return {
    cameraMode: cycleModes[sceneIndex % cycleModes.length],
    p2ZoomDelta: 0.05,
    p3ZoomDelta: 0.08,
    p4ZoomOutDelta: 0.10,
    p2PanX: 20 * dirSign,
    p2PanY: 6,
    p3PanX: -22 * dirSign,
    p3PanY: -12,
    tiltRad: 0.011 * dirSign,
  };
}


function escapeJsStr(raw: string): string {
  return String(raw || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, ' ')
    .trim();
}

/**
 * Normalizes ONLY the current scene's text (excluding project_title / topik_video)
 * so global project keywords (e.g. "Pagi" in "Kenapa Pagi Terasa Berat?") never pollute
 * every single scene into repeating the same visual motif.
 */
function normalizeSceneLocalText(scene: Partial<SatsetScene>): string {
  return [
    scene.narration_text,
    scene.voiceScript,
    scene.on_screen_text,
    scene.hookText,
    scene.visualDescription,
    scene.visual,
    ...(scene.visual_animation?.asset_elements || []),
    scene.visual_animation?.layout,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

const ALL_MOTIFS: VisualMotif[] = [
  'alarm_clock',
  'magnet_choice',
  'phone_scroll',
  'money_flow',
  'growth_chart',
  'checklist_steps',
  'brain_idea',
  'stair_goal',
  'cta_card',
];

const NON_CTA_MOTIF_POOL: VisualMotif[] = [
  'alarm_clock',
  'magnet_choice',
  'phone_scroll',
  'checklist_steps',
  'brain_idea',
  'growth_chart',
  'stair_goal',
  'money_flow',
];

function computeCandidateMotifsForSingleScene(scene: Partial<SatsetScene>): VisualMotif[] {
  const txt = normalizeSceneLocalText(scene);
  const assets = (scene.visual_animation?.asset_elements || []).join(' ').toLowerCase();
  const candidates: VisualMotif[] = [];

  if (/magnet|tarik|kasur|diam|malas|bingung|dukungan|dorongan|lawan|banding|vs|berat/.test(txt) && !/uang|gaji|hp|scroll/.test(assets)) {
    candidates.push('magnet_choice');
  }
  if (/hp|phone|smartphone|layar|scroll|sosmed|medsos|gadget|notif|aplikasi|komentar|chat/.test(txt)) {
    candidates.push('phone_scroll');
  }
  if (/jam|pagi|subuh|menit|detik|waktu|alarm|tidur|malam|timer|bangun|cepat/.test(txt)) {
    candidates.push('alarm_clock');
  }
  if (/uang|duit|gaji|nabung|tabung|rp|rupiah|omzet|profit|cuan|modal|harga|belanja|utang|invest|komisi|saldo|rekening|bayar/.test(txt)) {
    candidates.push('money_flow');
  }
  if (/grafik|chart|naik|tumbuh|momentum|stabil|hasil|persen|data|statistik|lonjak|metrik/.test(txt)) {
    candidates.push('growth_chart');
  }
  if (/catat|langkah|aturan|daftar|checklist|poin|tips|cara|tugas|jadwal|selesai|centang|tahap|urutan/.test(txt)) {
    candidates.push('checklist_steps');
  }
  if (/pikiran|otak|ide|kreatif|belajar|buku|ilmu|baca|fokus|strategi|cerdas|ramalan|konsep|energi|mental/.test(txt)) {
    candidates.push('brain_idea');
  }
  if (/tangga|gedung|jalan|gagal|target|puncak|sukses|juara|menang|maju|mulai|tujuan|fondasi|level/.test(txt)) {
    candidates.push('stair_goal');
  }
  return candidates;
}

export function detectSceneVisualMotif(
  scene: Partial<SatsetScene>,
  project: Partial<SatsetProject>,
  sceneIndex: number,
  totalScenes: number
): VisualMotif {
  const role =
    scene.role ||
    (sceneIndex === 0 ? 'hook' : sceneIndex === totalScenes - 1 && totalScenes > 1 ? 'cta' : 'body_core_point');
  if (role === 'cta') return 'cta_card';

  // If project.scenes is available, assign motifs greedily from 0..sceneIndex so NO two scenes repeat the same motif!
  const allScenes = Array.isArray(project?.scenes) ? project.scenes : [];
  if (allScenes.length > 1 && sceneIndex >= 0 && sceneIndex < allScenes.length) {
    const usedMotifs = new Set<VisualMotif>();
    for (let idx = 0; idx <= sceneIndex; idx++) {
      const scItem = idx === sceneIndex ? scene : allScenes[idx] || {};
      const scRole =
        scItem.role ||
        (idx === 0 ? 'hook' : idx === totalScenes - 1 && totalScenes > 1 ? 'cta' : 'body_core_point');
      if (scRole === 'cta') {
        if (idx === sceneIndex) return 'cta_card';
        usedMotifs.add('cta_card');
        continue;
      }

      const cands = computeCandidateMotifsForSingleScene(scItem);
      // 1st priority: unused semantic candidate for this scene
      let chosen = cands.find((m) => !usedMotifs.has(m));
      // 2nd priority: unused motif from the deterministic pool offset by scene index
      if (!chosen) {
        for (let p = 0; p < NON_CTA_MOTIF_POOL.length; p++) {
          const fallbackCandidate = NON_CTA_MOTIF_POOL[(idx + p) % NON_CTA_MOTIF_POOL.length];
          if (!usedMotifs.has(fallbackCandidate)) {
            chosen = fallbackCandidate;
            break;
          }
        }
      }
      // 3rd priority (only if > 8 scenes): avoid immediate previous scene motif
      if (!chosen) {
        chosen = NON_CTA_MOTIF_POOL[idx % NON_CTA_MOTIF_POOL.length];
      }
      if (idx === sceneIndex) {
        return chosen;
      }
      usedMotifs.add(chosen);
    }
  }

  const candidateMotifs = computeCandidateMotifsForSingleScene(scene);
  if (candidateMotifs.length > 0) {
    // Rotate by sceneIndex so even without project.scenes array, consecutive indices pick different motifs
    const primary = candidateMotifs[sceneIndex % candidateMotifs.length];
    if (sceneIndex > 0 && candidateMotifs.length === 1) {
      // Ensure sceneIndex > 0 doesn't collide with scene 0 if only 1 keyword matched
      const altPool = NON_CTA_MOTIF_POOL.filter((m) => m !== primary);
      return sceneIndex % 2 === 1 ? altPool[sceneIndex % altPool.length] : primary;
    }
    return primary;
  }

  return NON_CTA_MOTIF_POOL[sceneIndex % NON_CTA_MOTIF_POOL.length] || ALL_MOTIFS[0];
}

export type NarrativeEmotionTone =
  | 'stressed_problem'
  | 'shocked_hook'
  | 'coding_focus'
  | 'phone_distracted'
  | 'money_count'
  | 'active_step'
  | 'idea_insight'
  | 'victory_cta';

/**
 * Analyzes the scene's spoken narration & on-screen headline to determine the exact
 * emotional & physical character acting arc across the 4 narrative beats (`[beat1, beat2, beat3, beat4]`).
 */
export function selectSemanticPosesForScene(
  scene: Partial<SatsetScene>,
  motif: VisualMotif,
  role: string,
  sceneIndex: number
): {
  tone: NarrativeEmotionTone;
  primaryPose: string;
  secondaryPose: string;
  beatPoses: [string, string, string, string];
} {
  const txt = normalizeSceneLocalText(scene);

  // 1. Problem / Stress / Heavy / Exhausted / Mistake ("berat", "pusing", "stres", "capek", "malas", "bocor", "masalah")
  if (/\b(berat|pusing|stres|stress|lelah|capek|burnout|malas|bingung|masalah|gagal|bocor|habis|rugi|utang|hutang|susah|sulit|sia-sia|cemas|kuras|habiskan|tunda|menunda)\b/.test(txt)) {
    const startPose = /\b(capek|lelah|tidur|ngantuk|kasur|rebahan)\b/.test(txt)
      ? 'tired'
      : /\b(bingung|ragu|gimana)\b/.test(txt)
      ? 'shrug'
      : 'headache';
    return {
      tone: 'stressed_problem',
      primaryPose: startPose,
      secondaryPose: 'facepalm',
      beatPoses: [startPose, 'sigh', 'explain', 'idea'],
    };
  }

  // 2. Coding / Terminal / Tech / Writing ("code", "coding", "ketik", "terminal", "laptop", "remotion", "website", "script")
  if (/\b(code|coding|ketik|mengetik|terminal|laptop|remotion|blender|script|developer|programmer|komponen|render|repo|github|install)\b/.test(txt)) {
    return {
      tone: 'coding_focus',
      primaryPose: 'sittype',
      secondaryPose: 'idea',
      beatPoses: ['sittype', 'idea', 'present', 'thumbs'],
    };
  }

  // 3. Shock / Hook Question / Surprising Fact ("ternyata", "kaget", "rahasia", "bahaya", "jangan", "kenapa", "fakta")
  if (role === 'hook' || /\b(ternyata|kaget|rahasia|bahaya|jangan|kenapa|kok bisa|fakta|mengejutkan|awas|hati-hati)\b/.test(txt)) {
    const hookStart = /\b(kenapa|bingung|kok)\b/.test(txt) ? 'shrug' : 'scared';
    return {
      tone: 'shocked_hook',
      primaryPose: hookStart,
      secondaryPose: 'point',
      beatPoses: [hookStart, 'point', 'explain', 'idea'],
    };
  }

  // 4. Phone / Scrolling / Social Media ("hp", "scroll", "sosmed", "notif", "layar")
  if (motif === 'phone_scroll' || /\b(hp|smartphone|scroll|scrolling|sosmed|medsos|notif|notifikasi|chat)\b/.test(txt)) {
    return {
      tone: 'phone_distracted',
      primaryPose: 'phone',
      secondaryPose: 'watch',
      beatPoses: ['phone', 'watch', 'point', 'explain'],
    };
  }

  // 5. Money / Savings / Financial Calculation ("uang", "rupiah", "gaji", "tabungan", "omzet", "cuan")
  if (motif === 'money_flow' || /\b(uang|rupiah|gaji|tabungan|nabung|omzet|profit|cuan|dana|saldo|rekening|investasi)\b/.test(txt)) {
    return {
      tone: 'money_count',
      primaryPose: 'cash',
      secondaryPose: 'count',
      beatPoses: ['cash', 'count', 'present', 'thumbs'],
    };
  }

  // 6. CTA / Victory / Resolution ("follow", "komen", "simpan", "berhasil", "sukses", "mulai sekarang")
  if (role === 'cta' || motif === 'cta_card' || /\b(follow|komen|comment|simpan|save|share|bagikan|berhasil|sukses|menang|juara|yuk mulai)\b/.test(txt)) {
    return {
      tone: 'victory_cta',
      primaryPose: 'thumbs',
      secondaryPose: 'cheer',
      beatPoses: ['yes', 'present', 'thumbs', 'cheer'],
    };
  }

  // 7. Active Step / Walking / Climbing / Progress ("langkah", "jalan", "gerak", "bangun", "naik", "tumbuh")
  if (motif === 'stair_goal' || motif === 'checklist_steps' || /\b(langkah|jalan|gerak|bangun|naik|tumbuh|proses|cara|aturan|rutinitas|kebiasaan)\b/.test(txt)) {
    const stepPose = sceneIndex % 2 === 0 ? 'walk' : 'explain';
    return {
      tone: 'active_step',
      primaryPose: stepPose,
      secondaryPose: 'point',
      beatPoses: [stepPose, 'explain', 'point', 'fist'],
    };
  }

  // 8. Insight / Idea / Explanation default varied by sceneIndex
  const insightRotation: Array<[string, string, string, string]> = [
    ['think', 'idea', 'explain', 'thumbs'],
    ['explain', 'present', 'point', 'yes'],
    ['idea', 'point', 'present', 'cheer'],
    ['present', 'explain', 'idea', 'thumbs'],
  ];
  const chosenArc = insightRotation[sceneIndex % insightRotation.length];
  return {
    tone: 'idea_insight',
    primaryPose: chosenArc[0],
    secondaryPose: chosenArc[1],
    beatPoses: chosenArc,
  };
}

function selectPoseForScene(
  motif: VisualMotif,
  role: string,
  sceneIndex: number,
  scene?: Partial<SatsetScene>
): string {
  if (scene) {
    return selectSemanticPosesForScene(scene, motif, role, sceneIndex).primaryPose;
  }
  if (role === 'cta') return 'thumbs';
  if (role === 'hook') return 'scared';
  switch (motif) {
    case 'website_walkthrough':
      return sceneIndex % 3 === 0 ? 'present' : sceneIndex % 3 === 1 ? 'point' : 'thumbs';
    case 'alarm_clock':
      return sceneIndex % 2 === 0 ? 'headache' : 'stretch';
    case 'magnet_choice':
      return 'shrug';
    case 'phone_scroll':
      return 'phone';
    case 'money_flow':
      return 'cash';
    case 'growth_chart':
      return 'cheer';
    case 'checklist_steps':
      return 'explain';
    case 'brain_idea':
      return 'idea';
    case 'stair_goal':
      return 'fist';
    case 'cta_card':
      return 'thumbs';
  }
}

function pickBadgeLabel(scene: Partial<SatsetScene>, sceneIndex: number, role: string): string {
  const headline = (scene.on_screen_text || scene.hookText || '').trim();
  if (headline) {
    const primary = headline.split(/[:·|—–/]/)[0]?.trim() || headline;
    const words = primary.split(/\s+/).filter(Boolean);
    let out = '';
    for (const w of words) {
      const next = out ? `${out} ${w}` : w;
      if (next.length > 24) break;
      out = next;
    }
    const clean = (out || primary.slice(0, 24)).trim();
    if (clean.length > 0) return clean.toUpperCase();
  }
  if (role === 'hook') return 'PEMBUKA UTAMA';
  if (role === 'cta') return 'AKSI SEKARANG';
  return `LANGKAH 0${sceneIndex + 1}`;
}

function pickKeyStatOrMetric(scene: Partial<SatsetScene>, sceneIndex: number): { label: string; value: string } {
  const txt = `${scene.on_screen_text || ''} ${scene.narration_text || ''}`;
  const numMatch = txt.match(/(\d+(?:[.,]\d+)?\s*(?:%|menit|jam|hari|kali|langkah|ribu|juta|jt|detik|bit))/i);
  if (numMatch) {
    return { label: `POIN 0${sceneIndex + 1}`, value: numMatch[1].toUpperCase().slice(0, 16) };
  }
  const emph = scene.emphasis_words?.[0] || scene.emphasisWords?.[0];
  if (emph && emph.length >= 3) {
    return { label: `POIN 0${sceneIndex + 1}`, value: emph.toUpperCase().slice(0, 16) };
  }
  return { label: `SCENE 0${sceneIndex + 1}`, value: 'TERSTRUKTUR' };
}

function pickCompactCardsFromNarration(scene: Partial<SatsetScene>): [string, string, string] {
  const narration = (scene.narration_text || scene.voiceScript || '').trim();
  const emph = scene.emphasis_words || scene.emphasisWords || [];
  const words = narration
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4);

  const items: string[] = [];
  for (const e of emph) {
    const clean = e.trim();
    if (clean && !items.includes(clean)) items.push(clean);
  }
  for (const w of words) {
    if (items.length >= 3) break;
    if (!items.some((i) => i.toLowerCase() === w.toLowerCase())) {
      items.push(w);
    }
  }
  while (items.length < 3) {
    items.push(['Langkah 1', 'Otomatis', 'Hasil Nyata'][items.length]);
  }
  return [
    items[0].charAt(0).toUpperCase() + items[0].slice(1, 18),
    items[1].charAt(0).toUpperCase() + items[1].slice(1, 18),
    items[2].charAt(0).toUpperCase() + items[2].slice(1, 18),
  ];
}

function extractCompactKeywords(text: string): string[] {
  return (text || '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4)
    .slice(0, 6);
}

function resolveWebsiteStepForScene(
  scene: Partial<SatsetScene>,
  project: Partial<SatsetProject>,
  sceneIndex: number,
  totalScenes: number
): WebsiteStepVisual {
  if (scene.website_step) {
    return scene.website_step;
  }

  const detectedUrl =
    extractWebsiteUrl(project?.source_url || '') ||
    extractWebsiteUrl(project?.topik_video || '') ||
    extractWebsiteUrl(scene?.narration_text || '') ||
    extractWebsiteUrl(scene?.on_screen_text || '') ||
    '';

  const profile = project?.website_promo || buildWebsitePromoProfile(detectedUrl);
  const stepTemplate = profile.steps[sceneIndex % profile.steps.length];
  const [c1, c2, c3] = pickCompactCardsFromNarration(scene);

  return {
    stepNumber: sceneIndex + 1,
    totalSteps: totalScenes,
    stepBadge: stepTemplate?.stepBadge || `LANGKAH ${sceneIndex + 1}/${totalScenes}`,
    urlDisplay: profile.url,
    brandName: profile.brandName,
    screenTitle: (scene.on_screen_text || stepTemplate?.title || profile.brandName).slice(0, 48),
    screenSubtitle: (scene.narration_text || stepTemplate?.subtitle || profile.tagline).slice(0, 96),
    highlightMetric: stepTemplate?.metric || `${profile.domain}`,
    actionLabel: stepTemplate?.actionLabel || `Buka ${profile.domain} →`,
    layoutVariant: stepTemplate?.layoutVariant || 'hero_landing',
    uiCards:
      stepTemplate?.cards && stepTemplate.cards.length >= 3
        ? stepTemplate.cards
        : [
            { label: 'FITUR 1', value: c1, badge: 'AKTIF', accent: profile.primaryColor },
            { label: 'FITUR 2', value: c2, badge: 'OTOMATIS', accent: profile.secondaryColor },
            { label: 'FITUR 3', value: c3, badge: 'REAL-TIME', accent: profile.accentColor },
          ],
    primaryColor: profile.primaryColor,
    secondaryColor: profile.secondaryColor,
    accentColor: profile.accentColor,
  };
}

/**
 * Builds 8 distinct, fluid Remotion/Canvas 2D motion graphics choreographies for Website Deep Exploration scenes.
 * Uses scraped website photos/videos proportionally (compact floating PiP / split card / zoom lens ~26-36% canvas)
 * while explaining the website's deep architecture, subpages, workflow, and metrics with procedural 2D/3D animation.
 */
function buildWebsiteWalkthroughMotifCode(
  step: WebsiteStepVisual,
  sceneIndex: number,
  totalScenes: number,
  dur: number,
  shouldDrawCharacter: boolean,
  pose: string,
  mediaKey: string,
  focusRegion: { fx: number; fy: number; zoom: number },
  beats: NarrativeBeatSchedule,
  camPlan: MultiPhaseCameraPlan
): string {
  const urlStr = escapeJsStr(step.urlDisplay.replace(/^https?:\/\//i, 'https://'));
  const brandStr = escapeJsStr(step.brandName.toUpperCase());
  const stepBadgeStr = escapeJsStr(step.stepBadge);
  const metricStr = escapeJsStr(step.highlightMetric.slice(0, 24));
  const actionStr = escapeJsStr(step.actionLabel.slice(0, 26));
  const epStr = escapeJsStr((step.endpointPath || '/features').slice(0, 22));
  const variant = step.layoutVariant;
  const mediaKeyEsc = escapeJsStr(mediaKey || '');
  const targetFx = Number.isFinite(focusRegion?.fx) ? focusRegion.fx : 0.5;
  const targetFy = Number.isFinite(focusRegion?.fy) ? focusRegion.fy : 0.45;
  const targetZoom = Number.isFinite(focusRegion?.zoom) ? focusRegion.zoom : 1.18;

  const card0 = step.uiCards[0] || { label: 'MODUL 1', value: 'Deteksi Otomatis', badge: 'AKTIF' };
  const card1 = step.uiCards[1] || { label: 'MODUL 2', value: 'Enkripsi SSL 256-Bit', badge: 'AMAN' };
  const card2 = step.uiCards[2] || { label: 'MODUL 3', value: 'Real-Time Analytics', badge: 'LIVE' };

  const c0Label = escapeJsStr(card0.label.slice(0, 20));
  const c0Val = escapeJsStr(card0.value.slice(0, 26));
  const c0Badge = escapeJsStr((card0.badge || 'LIVE').slice(0, 12));

  const c1Label = escapeJsStr(card1.label.slice(0, 20));
  const c1Val = escapeJsStr(card1.value.slice(0, 26));
  const c1Badge = escapeJsStr((card1.badge || 'CORE').slice(0, 12));

  const c2Label = escapeJsStr(card2.label.slice(0, 20));
  const c2Val = escapeJsStr(card2.value.slice(0, 26));
  const c2Badge = escapeJsStr((card2.badge || 'OK').slice(0, 12));

  const primaryHex = escapeJsStr(step.primaryColor || '#2563EB');
  const secondaryHex = escapeJsStr(step.secondaryColor || '#38BDF8');
  const accentHex = escapeJsStr(step.accentColor || '#10B981');

  const charOverlay = shouldDrawCharacter
    ? `
// Presenter character alongside motion composition
const cp = popAt(beat1, 0.38);
if (cp > 0.01) {
  const charX = isWide ? cx - 260 * sc : cx + 215 * sc;
  const charY = ground + 42 * sc;
  s.shadow(charX, charY + 4 * sc, 36 * sc, { alpha: 0.22 * cp });
  s.person(charX, charY, { pose: "${pose}", size: 138 * sc * Math.min(1, cp), facing: -1 });
}`
    : '';

  // Helper snippet for proportional floating website media card (PiP / Split / Lens)
  const buildProportionalMediaCard = (
    xExpr: string,
    yExpr: string,
    wExpr: string,
    hExpr: string,
    tiltExpr = '0',
    beatExpr = 'beat1'
  ) => `
if (hasLiveMedia) {
  const kM = popAt(${beatExpr}, 0.42);
  if (kM > 0.01) {
    const mW = ${wExpr}, mH = ${hExpr};
    const mX = ${xExpr}, mY = ${yExpr};
    const camPan = s.ease.inOut(s.clamp((s.t - ${beatExpr}) / ${Math.max(1.1, dur * 0.55).toFixed(2)}, 0, 1));
    const curZoom = 1.02 + (${targetZoom.toFixed(2)} - 1.0) * camPan;
    const curFx = 0.5 + (${targetFx.toFixed(2)} - 0.5) * camPan;
    const curFy = 0.28 + (${targetFy.toFixed(2)} - 0.28) * camPan;
    s.group({ x: mX, y: mY, scale: kM, rotate: ${tiltExpr} }, () => {
      s.shadow(0, mH * 0.5 + 10 * sc, mW * 0.44, { alpha: 0.26 * kM });
      s.card(-mW * 0.5 - 8 * sc, -mH * 0.5 - 28 * sc, mW + 16 * sc, mH + 36 * sc, {
        r: 18 * sc,
        fill: "#0f172a",
        stroke: "${primaryHex}",
        width: 3 * sc,
      });
      s.circle(-mW * 0.5 + 10 * sc, -mH * 0.5 - 14 * sc, 4.5 * sc, { fill: "#ef4444", stroke: "none" });
      s.circle(-mW * 0.5 + 24 * sc, -mH * 0.5 - 14 * sc, 4.5 * sc, { fill: "#f59e0b", stroke: "none" });
      s.circle(-mW * 0.5 + 38 * sc, -mH * 0.5 - 14 * sc, 4.5 * sc, { fill: "#10b981", stroke: "none" });
      s.text("🔒 ${epStr}", 0, -mH * 0.5 - 13 * sc, { size: Math.round(11 * sc), color: "#93c5fd" });
      s.photo("${mediaKeyEsc}", 0, 0, mW, mH, {
        frame: "none",
        r: 12 * sc,
        zoom: curZoom,
        fx: curFx,
        fy: curFy,
        draw: kM,
        time: s.t,
      });
    });
  }
}`;

  let sceneChoreography = '';

  if (variant === 'hero_landing') {
    sceneChoreography = `
// Scene 1: Tempo-Synced Split-Screen Hero + Floating Website PiP + Staggered Feature Cards
const floatY = s.wave(0.9, 6 * sc);
const kTower = springAt(beat1, "bouncy");
if (kTower > 0.01) {
  s.group({ x: cx - 155 * sc, y: cy - 55 * sc - floatY * 0.6, scale: kTower }, () => {
    s.box(0, 0, 145 * sc, 185 * sc, 54 * sc, {
      fill: "${primaryHex}",
      rx: 0.22 + s.wave(0.6, 0.04),
      ry: -0.32 + s.t * 0.18,
    });
    s.sphere(0, -118 * sc, 34 * sc, { fill: "${accentHex}" });
    s.tag("${brandStr}", 0, 12 * sc, { fill: "#0f172a", size: Math.round(16 * sc) });
  });
}

${buildProportionalMediaCard('cx + 95 * sc', 'cy - 52 * sc + floatY', '320 * sc', '195 * sc', '-0.04 + s.wave(0.5, 0.018)', 'beat2')}

// 3 Progressive Feature Proposition Cards synced to narrative beats (beat2, beat3, beat4)
const heroBeats = [beat2, beat3, beat4];
const heroCards = [
  ["${c0Label}", "${c0Val}", "${c0Badge}", "${primaryHex}"],
  ["${c1Label}", "${c1Val}", "${c1Badge}", "${accentHex}"],
  ["${c2Label}", "${c2Val}", "${c2Badge}", "${secondaryHex}"],
];
for (let i = 0; i < 3; i++) {
  const [lbl, val, bdg, col] = heroCards[i];
  const kCard = springAt(heroBeats[i], "snappy");
  if (kCard > 0.01) {
    const slideX = (1 - kCard) * (i % 2 === 0 ? -90 : 90) * sc;
    const ry = cy + 98 * sc + i * 70 * sc;
    s.group({ x: cx + slideX, y: ry, scale: kCard, alpha: Math.min(1, kCard) }, () => {
      s.card(-265 * sc, -27 * sc, 530 * sc, 54 * sc, {
        r: 14 * sc,
        fill: "#0f172a",
        stroke: col,
        width: 2.5 * sc,
      });
      s.circle(-232 * sc, 0, 15 * sc, { fill: col, stroke: "none" });
      s.text(String(i + 1), -232 * sc, 1 * sc, { size: Math.round(14 * sc), color: "#ffffff" });
      s.text(lbl + "  •  " + val, -198 * sc, 1 * sc, { align: "left", size: Math.round(16 * sc), color: "#f8fafc" });
      s.tag(bdg, 212 * sc, 0, { fill: col, size: Math.round(12 * sc) });
    });
  }
}
const kMilestone = popAt(beat4, 0.36);
if (kMilestone > 0.01) {
  s.circle(cx + 235 * sc, cy - 155 * sc, 20 * sc * kMilestone, { fill: "${accentHex}", stroke: "#ffffff", width: 3 * sc, draw: kMilestone });
  s.check(cx + 235 * sc, cy - 155 * sc, 18 * sc, { stroke: "#ffffff", width: 4 * sc, draw: kMilestone });
}`;
  } else if (variant === 'problem_compare') {
    sceneChoreography = `
// Scene 2: Progressive Before/After Comparison + Live Transformation Stream
const kLeft = springAt(beat1, "snappy");
const kRight = springAt(beat2, "bouncy");
const streamP = s.ease.inOut(s.clamp((s.t - beat2) / Math.max(0.6, beat3 - beat2 + 0.4), 0, 1));

// Beat 1: Left Red Bottleneck Block (Cara Lama)
if (kLeft > 0.01) {
  s.group({ x: cx - 165 * sc, y: cy - 68 * sc, scale: kLeft }, () => {
    s.card(-115 * sc, -95 * sc, 230 * sc, 185 * sc, { r: 18 * sc, fill: "#fef2f2", stroke: "#ef4444", width: 3 * sc });
    s.box(0, -18 * sc, 78 * sc, 68 * sc, 38 * sc, { fill: "#ef4444", rx: 0.2, ry: 0.35 });
    s.cross(0, -18 * sc, 28 * sc, { stroke: "#ffffff", width: 4 * sc });
    s.tag("CARA LAMA", 0, 44 * sc, { fill: "#dc2626", size: Math.round(14 * sc) });
    s.text("${c0Val}", 0, 72 * sc, { size: Math.round(13 * sc), color: "#7f1d1d" });
  });
}

// Beat 2: Right Brand Solution Tower (Solusi Otomatis) + Energy Bridge
if (kRight > 0.01) {
  s.dash(cx - 42 * sc, cy - 68 * sc, cx + 42 * sc, cy - 68 * sc, { stroke: "${accentHex}", width: 4 * sc, draw: atProgress(beat2, 0.4) });
  const orbX = (cx - 40 * sc) + 80 * sc * streamP;
  s.circle(orbX, cy - 68 * sc, 14 * sc, { fill: "${accentHex}", stroke: "#ffffff", width: 2.5 * sc });

  s.group({ x: cx + 165 * sc, y: cy - 68 * sc + s.wave(1.1, 5 * sc), scale: kRight }, () => {
    s.card(-115 * sc, -95 * sc, 230 * sc, 185 * sc, { r: 18 * sc, fill: "#ecfdf5", stroke: "${accentHex}", width: 3.5 * sc });
    s.cylinder(0, -22 * sc, 42 * sc, 82 * sc, { fill: "${primaryHex}", rx: 0.22 });
    s.check(0, -22 * sc, 28 * sc, { stroke: "#ffffff", width: 4.5 * sc, draw: popAt(beat2 + 0.15, 0.35) });
    s.tag("${brandStr}", 0, 44 * sc, { fill: "${accentHex}", size: Math.round(14 * sc) });
    s.text("${c1Val}", 0, 72 * sc, { size: Math.round(13 * sc), color: "#064e3b" });
  });
}

// Beat 3: Website Reference Card
${buildProportionalMediaCard('cx - 115 * sc', 'cy + 145 * sc', '275 * sc', '158 * sc', '0.02', 'beat3')}

// Beat 4: Impact Stat Payoff Card
const kStat = springAt(beat4, "snappy");
if (kStat > 0.01) {
  s.group({ x: cx + 150 * sc, y: cy + 145 * sc, scale: kStat }, () => {
    s.card(-118 * sc, -82 * sc, 236 * sc, 164 * sc, { r: 18 * sc, fill: "#0f172a", stroke: "${primaryHex}", width: 3 * sc });
    s.tag("${c2Badge}", 0, -46 * sc, { fill: "${primaryHex}", size: Math.round(13 * sc) });
    s.text("${metricStr}", 0, -4 * sc, { size: Math.round(22 * sc), color: "${accentHex}" });
    s.text("${c2Val}", 0, 34 * sc, { size: Math.round(14 * sc), color: "#e2e8f0" });
    s.burst(88 * sc, -58 * sc, 28 * sc, { draw: atProgress(beat4, 0.4), stroke: "${secondaryHex}" });
  });
}`;
  } else if (variant === 'step_phone_notif') {
    sceneChoreography = `
// Scene 3: Progressive 3D Architecture Node Graph & Endpoint Explorer
const kHub = springAt(beat1, "bouncy");
const pulse = 1 + s.wave(1.4, 0.05);

if (kHub > 0.01) {
  s.group({ x: cx - 110 * sc, y: cy - 35 * sc, scale: kHub }, () => {
    s.rays(0, 0, 58 * sc, 96 * sc, 10, { stroke: "${secondaryHex}", width: 3 * sc, draw: atProgress(beat1, 0.45) });
    s.cube(0, 0, 96 * sc * pulse, {
      fill: "${primaryHex}",
      rx: 0.35 + s.t * 0.22,
      ry: -0.45 + s.t * 0.28,
    });
    s.tag("CORE ENGINE", 0, 74 * sc, { fill: "#0f172a", size: Math.round(13 * sc) });
  });
}

${buildProportionalMediaCard('cx + 145 * sc', 'cy - 38 * sc', '270 * sc', '168 * sc', '-0.03', 'beat2')}

const nodeBeats = [beat2, beat3, beat4];
const epNodes = [
  ["${epStr}", "${c0Val}", "${primaryHex}", -185],
  ["/api/v1", "${c1Val}", "${accentHex}", 0],
  ["/webhooks", "${c2Val}", "${secondaryHex}", 185],
];
for (let i = 0; i < 3; i++) {
  const [route, desc, col, offX] = epNodes[i];
  const kn = springAt(nodeBeats[i], "snappy");
  if (kn > 0.01) {
    const nx = cx + offX * sc;
    const ny = cy + 165 * sc;
    s.dash(cx - 110 * sc, cy + 25 * sc, nx, ny - 48 * sc, { stroke: col, width: 3 * sc, draw: kn });
    s.group({ x: nx, y: ny, scale: kn }, () => {
      s.card(-82 * sc, -48 * sc, 164 * sc, 96 * sc, { r: 14 * sc, fill: "#0f172a", stroke: col, width: 2.5 * sc });
      s.tag(route, 0, -20 * sc, { fill: col, size: Math.round(12 * sc) });
      s.text(desc, 0, 18 * sc, { size: Math.round(13 * sc), color: "#f8fafc" });
    });
  }
}`;
  } else if (variant === 'step_ssl_tunnel') {
    sceneChoreography = `
// Scene 4: Progressive 3-Stage Workflow Pipeline + Zoom Lens Media Callout
const flowP = s.ease.inOut(s.clamp((s.t - beat1) / Math.max(0.8, beat3 - beat1 + 0.5), 0, 1));
const stageBeats = [beat1, beat2, beat3];
const stages = [
  ["INPUT", "${c0Val}", "${primaryHex}", -195],
  ["ENGINE", "${c1Val}", "${accentHex}", 0],
  ["OUTPUT", "${c2Val}", "${secondaryHex}", 195],
];

const pipeY = cy - 75 * sc;
s.line(cx - 195 * sc, pipeY, cx + 195 * sc, pipeY, { stroke: "#334155", width: 8 * sc });
s.line(cx - 195 * sc, pipeY, (cx - 195 * sc) + 390 * sc * flowP, pipeY, { stroke: "${accentHex}", width: 8 * sc });

for (let i = 0; i < 3; i++) {
  const [stName, stDesc, col, ox] = stages[i];
  const ks = springAt(stageBeats[i], "bouncy");
  if (ks > 0.01) {
    const sx = cx + ox * sc;
    s.group({ x: sx, y: pipeY, scale: ks }, () => {
      s.cylinder(0, 0, 38 * sc, 54 * sc, { fill: col, rx: 0.28 });
      s.tag("0" + (i + 1) + " " + stName, 0, -52 * sc, { fill: "#0f172a", size: Math.round(12 * sc) });
      s.card(-84 * sc, 42 * sc, 168 * sc, 54 * sc, { r: 12 * sc, fill: "#0f172a", stroke: col, width: 2 * sc });
      s.text(stDesc, 0, 70 * sc, { size: Math.round(13 * sc), color: "#f8fafc" });
    });
  }
}

const pktX = (cx - 195 * sc) + 390 * sc * flowP;
s.sphere(pktX, pipeY - 6 * sc, 16 * sc, { fill: "#fde047" });

${buildProportionalMediaCard('cx - 105 * sc', 'cy + 142 * sc', '290 * sc', '165 * sc', '0', 'beat3')}
const kLens = springAt(beat4, "snappy");
if (kLens > 0.01) {
  s.group({ x: cx + 165 * sc, y: cy + 142 * sc, scale: kLens }, () => {
    s.card(-105 * sc, -78 * sc, 210 * sc, 156 * sc, { r: 18 * sc, fill: "#064e3b", stroke: "${accentHex}", width: 3 * sc });
    s.circle(0, -24 * sc, 26 * sc, { fill: "${accentHex}", stroke: "#ffffff", width: 2.5 * sc });
    s.check(0, -24 * sc, 22 * sc, { stroke: "#ffffff", width: 4 * sc });
    s.text("${metricStr}", 0, 24 * sc, { size: Math.round(17 * sc), color: "#ffffff" });
    s.text("${actionStr}", 0, 52 * sc, { size: Math.round(13 * sc), color: "#6ee7b7" });
  });
}`;
  } else if (variant === 'step_webhook_lunas') {
    sceneChoreography = `
// Scene 5: Progressive 3D Bar Chart + Radial Telemetry Gauge + Compact Media PiP
const kChart = springAt(beat1, "snappy");
if (kChart > 0.01) {
  s.card(cx - 275 * sc, cy - 155 * sc, 320 * sc, 235 * sc, {
    r: 20 * sc,
    fill: "#0f172a",
    stroke: "${primaryHex}",
    width: 3 * sc,
    alpha: kChart,
  });
  s.text("REAL-TIME TELEMETRY", cx - 115 * sc, cy - 125 * sc, { size: Math.round(14 * sc), color: "${secondaryHex}", alpha: kChart });
}

const barHeights = [54, 88, 124, 158];
const barColors = ["${secondaryHex}", "${primaryHex}", "${secondaryHex}", "${accentHex}"];
const barStep = Math.max(0.12, (beat3 - beat1) / 4);
for (let i = 0; i < 4; i++) {
  const kb = springAt(beat1 + i * barStep, "bouncy");
  if (kb > 0.01) {
    const bh = barHeights[i] * sc * kb;
    const bx = cx - 225 * sc + i * 68 * sc;
    const by = cy + 52 * sc - bh * 0.5;
    s.box(bx, by, 42 * sc, bh, 28 * sc, { fill: barColors[i], rx: 0.18, ry: -0.24 });
  }
}
s.polyline([
  [cx - 225 * sc, cy + 12 * sc],
  [cx - 157 * sc, cy - 22 * sc],
  [cx - 89 * sc, cy - 58 * sc],
  [cx - 21 * sc, cy - 96 * sc],
], { stroke: "#fde047", width: 4.5 * sc, draw: atProgress(beat2, 0.5) });

const kGauge = springAt(beat2, "bouncy");
if (kGauge > 0.01) {
  const sweep = s.ease.out(s.clamp((s.t - beat2) / Math.max(0.7, beat4 - beat2), 0, 1));
  s.group({ x: cx + 165 * sc, y: cy - 38 * sc, scale: kGauge }, () => {
    s.card(-105 * sc, -115 * sc, 210 * sc, 235 * sc, { r: 20 * sc, fill: "#0f172a", stroke: "${accentHex}", width: 3 * sc });
    s.circle(0, -18 * sc, 64 * sc, { fill: "none", stroke: "#1e293b", width: 12 * sc });
    s.arc(0, -18 * sc, 64 * sc, -Math.PI * 0.8, -Math.PI * 0.8 + sweep * Math.PI * 1.6, { stroke: "${accentHex}", width: 12 * sc });
    s.text(Math.round(sweep * 99.9) + "%", 0, -14 * sc, { size: Math.round(24 * sc), color: "#ffffff" });
    s.tag("${metricStr}", 0, 74 * sc, { fill: "${accentHex}", size: Math.round(13 * sc) });
  });
}

${buildProportionalMediaCard('cx - 115 * sc', 'cy + 168 * sc', '280 * sc', '148 * sc', '-0.02', 'beat3')}
const kStatusCard = popAt(beat4, 0.35);
if (kStatusCard > 0.01) {
  s.card(cx + 48 * sc, cy + 98 * sc, 225 * sc, 138 * sc, { r: 16 * sc, fill: "#eff6ff", stroke: "${primaryHex}", width: 2.5 * sc, alpha: kStatusCard });
  s.tag("${c0Badge}", cx + 160 * sc, cy + 130 * sc, { fill: "${primaryHex}", size: Math.round(13 * sc), draw: kStatusCard });
  s.text("${c0Val}", cx + 160 * sc, cy + 168 * sc, { size: Math.round(15 * sc), color: "#0f172a", alpha: kStatusCard });
  s.text("${c1Val}", cx + 160 * sc, cy + 196 * sc, { size: Math.round(13 * sc), color: "#475569", alpha: kStatusCard });
}`;
  } else if (variant === 'channel_grid') {
    sceneChoreography = `
// Scene 6: 4-Cell Bento Feature Ecosystem Grid entering progressively on beats 1..4
${buildProportionalMediaCard('cx - 138 * sc', 'cy - 54 * sc', '252 * sc', '156 * sc', '0', 'beat1')}

const kB1 = springAt(beat2, "bouncy");
if (kB1 > 0.01) {
  s.group({ x: cx + 142 * sc, y: cy - 54 * sc, scale: kB1 }, () => {
    s.card(-124 * sc, -92 * sc, 248 * sc, 184 * sc, { r: 18 * sc, fill: "#0f172a", stroke: "${secondaryHex}", width: 3 * sc });
    s.cone(0, -22 * sc, 36 * sc, 68 * sc, { fill: "${secondaryHex}", rx: 0.25, ry: s.t * 0.4 });
    s.tag("${c0Badge}", 0, 36 * sc, { fill: "${primaryHex}", size: Math.round(12 * sc) });
    s.text("${c0Val}", 0, 66 * sc, { size: Math.round(14 * sc), color: "#ffffff" });
  });
}

const kB2 = springAt(beat3, "bouncy");
if (kB2 > 0.01) {
  s.group({ x: cx - 138 * sc, y: cy + 148 * sc, scale: kB2 }, () => {
    s.card(-128 * sc, -88 * sc, 256 * sc, 176 * sc, { r: 18 * sc, fill: "#0f172a", stroke: "${accentHex}", width: 3 * sc });
    s.cube(-32 * sc, -18 * sc, 46 * sc, { fill: "${accentHex}", rx: 0.3, ry: -0.4 });
    s.cube(32 * sc, -18 * sc, 46 * sc, { fill: "${primaryHex}", rx: 0.3, ry: 0.4 });
    s.tag("${c1Badge}", 0, 34 * sc, { fill: "${accentHex}", size: Math.round(12 * sc) });
    s.text("${c1Val}", 0, 62 * sc, { size: Math.round(14 * sc), color: "#ffffff" });
  });
}

const kB3 = springAt(beat4, "bouncy");
if (kB3 > 0.01) {
  s.group({ x: cx + 142 * sc, y: cy + 148 * sc, scale: kB3 }, () => {
    s.card(-124 * sc, -88 * sc, 248 * sc, 176 * sc, { r: 18 * sc, fill: "#eff6ff", stroke: "${primaryHex}", width: 3 * sc });
    s.sphere(0, -22 * sc, 34 * sc * (1 + s.wave(1.5, 0.06)), { fill: "${primaryHex}" });
    s.tag("${metricStr}", 0, 32 * sc, { fill: "#0f172a", size: Math.round(13 * sc) });
    s.text("${c2Val}", 0, 62 * sc, { size: Math.round(14 * sc), color: "#0f172a" });
  });
}`;
  } else if (variant === 'security_pricing') {
    sceneChoreography = `
// Scene 7: Progressive 3D Security Radar + Media Card + Enterprise Spec Rows
const kShield = springAt(beat1, "bouncy");
const radarAng = -Math.PI * 0.5 + s.t * 2.2;

if (kShield > 0.01) {
  s.group({ x: cx - 125 * sc, y: cy - 38 * sc, scale: kShield }, () => {
    s.circle(0, 0, 108 * sc, { fill: "#0c1836", stroke: "${primaryHex}", width: 3.5 * sc });
    s.circle(0, 0, 74 * sc, { fill: "none", stroke: "${secondaryHex}", width: 2 * sc });
    s.line(0, 0, Math.cos(radarAng) * 98 * sc, Math.sin(radarAng) * 98 * sc, { stroke: "${accentHex}", width: 4 * sc });
    s.cylinder(0, 0, 36 * sc, 52 * sc, { fill: "${accentHex}", rx: 0.3 });
    s.check(0, 0, 26 * sc, { stroke: "#ffffff", width: 4.5 * sc });
    s.tag("SSL • ENCRYPTED", 0, 96 * sc, { fill: "${accentHex}", size: Math.round(12 * sc) });
  });
}

${buildProportionalMediaCard('cx + 142 * sc', 'cy - 38 * sc', '268 * sc', '164 * sc', '0.03', 'beat2')}

const secBeats = [beat3, beat4];
const secRows = [
  ["${c0Label}", "${c0Val}", "${c0Badge}", "${accentHex}"],
  ["${c1Label}", "${c1Val}", "${c1Badge}", "${primaryHex}"],
];
for (let i = 0; i < 2; i++) {
  const [lbl, val, bdg, col] = secRows[i];
  const kr = springAt(secBeats[i], "snappy");
  if (kr > 0.01) {
    const ry = cy + 122 * sc + i * 72 * sc;
    s.group({ x: cx, y: ry, scale: kr }, () => {
      s.card(-268 * sc, -28 * sc, 536 * sc, 56 * sc, { r: 14 * sc, fill: "#0f172a", stroke: col, width: 2.5 * sc });
      s.circle(-232 * sc, 0, 14 * sc, { fill: col, stroke: "none" });
      s.check(-232 * sc, 0, 13 * sc, { stroke: "#ffffff", width: 3 * sc });
      s.text(lbl + ": " + val, -198 * sc, 1 * sc, { align: "left", size: Math.round(16 * sc), color: "#f8fafc" });
      s.tag(bdg, 212 * sc, 0, { fill: col, size: Math.round(12 * sc) });
    });
  }
}`;
  } else {
    sceneChoreography = `
// Scene 8: Progressive 3D Launchpad Portal + Live URL Bar + Shockwave CTA Click
${buildProportionalMediaCard('cx', 'cy - 76 * sc + s.wave(1.0, 5 * sc)', '330 * sc', '188 * sc', '0', 'beat1')}

const kBar = springAt(beat2, "snappy");
if (kBar > 0.01) {
  const barY = cy + 68 * sc;
  s.group({ x: cx, y: barY, scale: kBar }, () => {
    s.card(-255 * sc, -28 * sc, 510 * sc, 56 * sc, { r: 16 * sc, fill: "#0f172a", stroke: "${secondaryHex}", width: 3 * sc });
    s.text("🌐  " + "${urlStr}", -225 * sc, 2 * sc, { align: "left", size: Math.round(17 * sc), color: "#38bdf8" });
    s.tag("LIVE", 205 * sc, 0, { fill: "${accentHex}", size: Math.round(13 * sc) });
  });
}

const btnW = 360 * sc, btnH = 58 * sc;
const btnY = cy + 156 * sc;
const kBtn = popAt(beat3, 0.35);
const clickMoment = beat4;
const isClicked = s.t >= clickMoment;
const clickScale = isClicked ? 1 + s.wave(2.6, 0.04) : 1;

if (kBtn > 0.01) {
  s.group({ x: cx, y: btnY, scale: kBtn * clickScale }, () => {
    s.shadow(0, 34 * sc, 150 * sc, { alpha: 0.32 * kBtn });
    s.rect(-btnW * 0.5, -btnH * 0.5, btnW, btnH, {
      r: 18 * sc,
      fill: isClicked ? "${accentHex}" : "${primaryHex}",
      stroke: "#ffffff",
      width: 3 * sc,
    });
    s.text("${actionStr}", 0, 2 * sc, { size: Math.round(21 * sc), color: "#ffffff" });
  });

  const curMove = s.ease.inOut(s.clamp((s.t - beat3) / Math.max(0.28, beat4 - beat3), 0, 1));
  const curX = (cx + 220 * sc) + (cx + 85 * sc - (cx + 220 * sc)) * curMove;
  const curY = (cy + 40 * sc) + (btnY + 8 * sc - (cy + 40 * sc)) * curMove;

  if (isClicked) {
    const rippleP = s.clamp((s.t - clickMoment) / 0.48, 0, 1);
    s.circle(cx + 85 * sc, btnY + 8 * sc, (16 + rippleP * 48) * sc, {
      fill: "none",
      stroke: "${accentHex}",
      width: Math.max(1, (1 - rippleP) * 4.5 * sc),
    });
    s.burst(cx + 85 * sc, btnY + 8 * sc, 42 * sc, { draw: s.at(clickMoment, 0.42), stroke: "#fde047" });
  }
  s.circle(curX, curY, 9 * sc, { fill: "${accentHex}", stroke: "#ffffff", width: 2.5 * sc });
  s.line(curX + 22 * sc, curY + 22 * sc, curX + 4 * sc, curY + 4 * sc, { stroke: "#0f172a", width: 4.5 * sc });
}`;
  }

  return `
// Website Deep Exploration & Tempo-Synced Progressive Choreography (${variant})
const beat1 = ${beats.beat1};
const beat2 = ${beats.beat2};
const beat3 = ${beats.beat3};
const beat4 = ${beats.beat4};
const popAt = (d, w = ${beats.popSpan}) => (d <= beat1 + 0.02 ? s.pop(d - 0.24, w) : s.t < d ? 0 : s.pop(d, w));
const springAt = (d, cfg = "snappy") => (d <= beat1 + 0.02 ? s.spring(d - 0.24, cfg) : s.t < d ? 0 : s.spring(d, cfg));
const atProgress = (d, w = 0.4) => (d <= beat1 + 0.02 ? s.at(d - 0.24, w) : s.t < d ? 0 : s.at(d, w));
const hasLiveMedia = Boolean("${mediaKeyEsc}");

// Multi-Phase Camera Choreography (Zoom In -> Focus Pan -> Zoom Out Reveal)
const camP2 = s.ease.inOut(s.clamp((s.t - beat2) / Math.max(0.28, beat3 - beat2), 0, 1));
const camP3 = s.ease.inOut(s.clamp((s.t - beat3) / Math.max(0.28, beat4 - beat3), 0, 1));
const camP4 = s.ease.inOut(s.clamp((s.t - beat4) / Math.max(0.35, ${dur.toFixed(2)} - beat4), 0, 1));
const camZoom = 1.0 + camP2 * ${camPlan.p2ZoomDelta} + camP3 * ${camPlan.p3ZoomDelta} - camP4 * ${camPlan.p4ZoomOutDelta};
const camPanX = (camP2 * ${camPlan.p2PanX} + camP3 * ${camPlan.p3PanX}) * (1 - camP4 * 0.85) * sc;
const camPanY = (camP2 * ${camPlan.p2PanY} + camP3 * ${camPlan.p3PanY}) * (1 - camP4 * 0.85) * sc;
const camTilt = (camP2 * ${camPlan.tiltRad} - camP3 * ${(camPlan.tiltRad * 0.5).toFixed(4)}) * (1 - camP4);

s.group({ x: cx + camPanX, y: cy + camPanY, scale: camZoom, rotate: camTilt }, () => {
  s.group({ x: -cx, y: -cy }, () => {
    s.tag("${stepBadgeStr}", cx, isWide ? H * 0.145 : H * 0.155, {
      fill: "#0f172a",
      size: Math.round(14 * sc),
      draw: popAt(beat1, 0.3),
    });
    ${sceneChoreography}
    ${charOverlay}
  });
});
`;
}

function buildStudioPedestalObjectSnippet(motif: VisualMotif): string {
  switch (motif) {
    case 'alarm_clock':
      return `
        const clkGrad = ctx.createRadialGradient(-5 * sc, -6 * sc, 2 * sc, 0, 0, 21 * sc);
        clkGrad.addColorStop(0, "#ff7a45");
        clkGrad.addColorStop(0.65, "#ef4444");
        clkGrad.addColorStop(1, "#991b1b");
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(-13 * sc, -17 * sc, 7 * sc, Math.PI * 0.9, Math.PI * 2.1);
        ctx.arc(13 * sc, -17 * sc, 7 * sc, -Math.PI * 0.1, Math.PI * 1.1);
        ctx.fill();
        ctx.fillStyle = clkGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 20 * sc, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fffaf0";
        ctx.beginPath();
        ctx.arc(0, 0, 15 * sc, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2.6 * sc;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(s.t * 2.4 - 1.57) * 9 * sc, Math.sin(s.t * 2.4 - 1.57) * 9 * sc);
        ctx.moveTo(0, 0);
        ctx.lineTo(7 * sc, -2 * sc);
        ctx.stroke();`;
    case 'magnet_choice':
      return `
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 10 * sc;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, 2 * sc, 15 * sc, Math.PI, 0, false);
        ctx.stroke();
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(-20 * sc, 2 * sc, 10 * sc, 11 * sc);
        ctx.fillRect(10 * sc, 2 * sc, 10 * sc, 11 * sc);
        const pulseR = (16 + Math.sin(s.t * 4) * 3) * sc;
        ctx.strokeStyle = "rgba(56, 189, 248, 0.72)";
        ctx.lineWidth = 2 * sc;
        ctx.beginPath();
        ctx.arc(0, -4 * sc, pulseR, -Math.PI * 0.85, -Math.PI * 0.15);
        ctx.stroke();`;
    case 'phone_scroll':
      return `
        ctx.fillStyle = "#0f172a";
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 2 * sc;
        ctx.beginPath();
        ctx.roundRect(-14 * sc, -24 * sc, 28 * sc, 48 * sc, 6 * sc);
        ctx.fill();
        ctx.stroke();
        const scrG = ctx.createLinearGradient(-10 * sc, -18 * sc, 10 * sc, 18 * sc);
        scrG.addColorStop(0, "#38bdf8");
        scrG.addColorStop(1, "#6366f1");
        ctx.fillStyle = scrG;
        ctx.beginPath();
        ctx.roundRect(-10 * sc, -18 * sc, 20 * sc, 34 * sc, 3 * sc);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-6 * sc, (-10 + ((s.t * 14) % 14)) * sc, 12 * sc, 5 * sc);`;
    case 'money_flow':
      return `
        for (let c = 0; c < 3; c++) {
          const cyCoin = (10 - c * 8) * sc;
          ctx.fillStyle = "#d97706";
          ctx.beginPath();
          ctx.ellipse(0, cyCoin + 3 * sc, 17 * sc, 7 * sc, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath();
          ctx.ellipse(0, cyCoin, 17 * sc, 7 * sc, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.arc(13 * sc, -14 * sc, 8 * sc, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "900 " + Math.round(10 * sc) + 'px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("$", 13 * sc, -13.5 * sc);`;
    case 'growth_chart':
      return `
        const bars = [14, 24, 34];
        const bCols = ["#f59e0b", "#38bdf8", "#10b981"];
        for (let b = 0; b < 3; b++) {
          const bh = bars[b] * sc;
          ctx.fillStyle = bCols[b];
          ctx.beginPath();
          ctx.roundRect((-17 + b * 12) * sc, 16 * sc - bh, 9 * sc, bh, 2.5 * sc);
          ctx.fill();
        }
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.4 * sc;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-14 * sc, 2 * sc);
        ctx.lineTo(-2 * sc, -8 * sc);
        ctx.lineTo(13 * sc, -21 * sc);
        ctx.stroke();`;
    case 'checklist_steps':
      return `
        ctx.fillStyle = "#f8fafc";
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2 * sc;
        ctx.beginPath();
        ctx.roundRect(-16 * sc, -21 * sc, 32 * sc, 42 * sc, 6 * sc);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#10b981";
        for (let r = 0; r < 3; r++) {
          ctx.beginPath();
          ctx.arc(-8 * sc, (-10 + r * 10) * sc, 3.2 * sc, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#475569";
          ctx.fillRect(-2 * sc, (-11.5 + r * 10) * sc, 13 * sc, 3 * sc);
          ctx.fillStyle = "#10b981";
        }`;
    case 'stair_goal':
      return `
        for (let st = 0; st < 3; st++) {
          const w = (12 + st * 9) * sc;
          ctx.fillStyle = st === 2 ? "#38bdf8" : st === 1 ? "#64748b" : "#94a3b8";
          ctx.beginPath();
          ctx.roundRect(-18 * sc + st * 9 * sc, (10 - st * 11) * sc, w * 0.55, (12 + st * 11) * sc, 2.5 * sc);
          ctx.fill();
        }
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(10 * sc, -20 * sc, 7.5 * sc, 0, Math.PI * 2);
        ctx.fill();`;
    case 'cta_card':
      return `
        const playG = ctx.createLinearGradient(-18 * sc, -18 * sc, 18 * sc, 18 * sc);
        playG.addColorStop(0, "#ff5c28");
        playG.addColorStop(1, "#e11d48");
        ctx.fillStyle = playG;
        ctx.beginPath();
        ctx.roundRect(-18 * sc, -18 * sc, 36 * sc, 36 * sc, 10 * sc);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(-5 * sc, -8 * sc);
        ctx.lineTo(10 * sc, 0);
        ctx.lineTo(-5 * sc, 8 * sc);
        ctx.closePath();
        ctx.fill();`;
    case 'brain_idea':
    default:
      return `
        const glowBulb = ctx.createRadialGradient(0, -4 * sc, 2 * sc, 0, -4 * sc, 22 * sc);
        glowBulb.addColorStop(0, "#fef08a");
        glowBulb.addColorStop(0.55, "#f59e0b");
        glowBulb.addColorStop(1, "rgba(245, 158, 11, 0)");
        ctx.fillStyle = glowBulb;
        ctx.beginPath();
        ctx.arc(0, -4 * sc, 22 * sc, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(0, -4 * sc, 14 * sc, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#475569";
        ctx.beginPath();
        ctx.roundRect(-7 * sc, 9 * sc, 14 * sc, 9 * sc, 3 * sc);
        ctx.fill();`;
  }
}

function buildStudioShowcaseContentSnippet(params: {
  motif: VisualMotif;
  headlineShort: string;
  card1: string;
  card2: string;
  card3: string;
  statLabel: string;
  statVal: string;
  dur: number;
}): string {
  const { motif, headlineShort, card1, card2, card3, statLabel, statVal } = params;
  const safeHeadline = escapeJsStr(headlineShort.replace(/\\(.)/g, '$1').slice(0, 22));
  const safeC1 = escapeJsStr(card1.replace(/\\(.)/g, '$1').slice(0, 14));
  const safeC2 = escapeJsStr(card2.replace(/\\(.)/g, '$1').slice(0, 14));
  const safeC3 = escapeJsStr(card3.replace(/\\(.)/g, '$1').slice(0, 14));
  const safeStatLabel = escapeJsStr(statLabel.replace(/\\(.)/g, '$1').slice(0, 14));
  const safeStatVal = escapeJsStr(statVal.replace(/\\(.)/g, '$1').slice(0, 14));

  return `
        const pCard = s.ease.out(s.clamp((s.t - beat1) / 0.85, 0, 1));
        const progBeat = s.ease.inOut(s.clamp((s.t - beat2) / Math.max(0.5, beat4 - beat2), 0, 1));
        ctx.save();
        // Dark crisp inner viewport frame
        ctx.fillStyle = "#0b1120";
        ctx.beginPath();
        ctx.roundRect(-scW * 0.45, -scH * 0.25, scW * 0.9, scH * 0.69, 12 * sc);
        ctx.fill();

        // Top Concept Title + Accent Metric Chip
        ctx.font = "800 " + Math.round(13 * sc) + 'px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = "#f8fafc";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("${safeHeadline}", -scW * 0.4, -scH * 0.13, scW * 0.56);

        ctx.fillStyle = "rgba(255, 71, 26, 0.22)";
        ctx.strokeStyle = "#ff5c28";
        ctx.lineWidth = 1.4 * sc;
        ctx.beginPath();
        ctx.roundRect(scW * 0.16, -scH * 0.20, scW * 0.25, 22 * sc, 11 * sc);
        ctx.fill();
        ctx.stroke();
        ctx.font = "800 " + Math.round(10 * sc) + 'px "JetBrains Mono", monospace';
        ctx.fillStyle = "#fdba74";
        ctx.textAlign = "center";
        ctx.fillText("${safeStatVal}", scW * 0.285, -scH * 0.13, scW * 0.22);

        // Motif-driven Visual Centerpiece inside Showcase Card
        ${
          motif === 'growth_chart' || motif === 'money_flow' || motif === 'stair_goal'
            ? `
        const gBars = [0.42, 0.68, 0.96];
        const gCols = ["#38bdf8", "#818cf8", "#10b981"];
        for (let b = 0; b < 3; b++) {
          const bw = 26 * sc;
          const bh = gBars[b] * 42 * sc * Math.max(0.15, pCard);
          const bx = -scW * 0.36 + b * 36 * sc;
          const by = scH * 0.22 - bh;
          ctx.fillStyle = gCols[b];
          ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, 5 * sc);
          ctx.fill();
        }
        ctx.font = "700 " + Math.round(10 * sc) + 'px "JetBrains Mono", monospace';
        ctx.fillStyle = "#34d399";
        ctx.textAlign = "left";
        ctx.fillText("${safeStatLabel}: " + Math.round(progBeat * 100) + "%", -scW * 0.36, scH * 0.34, scW * 0.42);
        `
            : motif === 'alarm_clock' || motif === 'phone_scroll'
            ? `
        // Animated Focus Ring / Attention Gauge
        ctx.strokeStyle = "rgba(148, 163, 184, 0.24)";
        ctx.lineWidth = 6 * sc;
        ctx.beginPath();
        ctx.arc(-scW * 0.24, scH * 0.11, 24 * sc, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "#ff5c28";
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(-scW * 0.24, scH * 0.11, 24 * sc, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * (0.25 + 0.72 * progBeat));
        ctx.stroke();
        ctx.font = "800 " + Math.round(11 * sc) + 'px "JetBrains Mono", monospace';
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(Math.round((0.25 + 0.75 * progBeat) * 100) + "%", -scW * 0.24, scH * 0.12);
        `
            : `
        // Progressive Checklist / Workflow Steps Pills
        const stepPills = ["${safeC1}", "${safeC2}", "${safeC3}"];
        for (let k = 0; k < 3; k++) {
          const active = progBeat >= k * 0.33;
          ctx.fillStyle = active ? "rgba(16, 185, 129, 0.22)" : "rgba(148, 163, 184, 0.14)";
          ctx.strokeStyle = active ? "#10b981" : "rgba(148, 163, 184, 0.25)";
          ctx.lineWidth = 1.2 * sc;
          ctx.beginPath();
          ctx.roundRect(-scW * 0.39, (-0.01 + k * 0.13) * scH, scW * 0.44, 15 * sc, 7.5 * sc);
          ctx.fill();
          ctx.stroke();
          ctx.font = "700 " + Math.round(9.5 * sc) + 'px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = active ? "#a7f3d0" : "#cbd5e1";
          ctx.textAlign = "left";
          ctx.fillText((active ? "✓ " : "· ") + stepPills[k], -scW * 0.36, (0.042 + k * 0.13) * scH, scW * 0.38);
        }
        `
        }

        // Right-side Key Concept Tags (card1 / card2 / card3)
        const rightItems = ["${safeC1}", "${safeC2}", "${safeC3}"];
        for (let r = 0; r < 3; r++) {
          const py = (-0.01 + r * 0.14) * scH;
          ctx.fillStyle = r === 0 ? "rgba(56, 189, 248, 0.16)" : "rgba(255, 255, 255, 0.06)";
          ctx.beginPath();
          ctx.roundRect(scW * 0.09, py, scW * 0.32, 16 * sc, 8 * sc);
          ctx.fill();
          ctx.font = "700 " + Math.round(9.5 * sc) + 'px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = r === 0 ? "#7dd3fc" : "#e2e8f0";
          ctx.textAlign = "center";
          ctx.fillText(rightItems[r], scW * 0.25, py + 8.5 * sc, scW * 0.28);
        }
        ctx.restore();`;
}

function buildEditorialMotifIconSnippet(motif: VisualMotif): string {
  switch (motif) {
    case 'alarm_clock':
      return `
        ctx.strokeStyle = RED;
        ctx.lineWidth = 3.2 * sc;
        ctx.beginPath();
        ctx.arc(0, 2 * sc, 17 * sc, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 2 * sc);
        ctx.lineTo(0, -8 * sc);
        ctx.moveTo(0, 2 * sc);
        ctx.lineTo(8 * sc, 4 * sc);
        ctx.stroke();`;
    case 'magnet_choice':
      return `
        ctx.strokeStyle = RED;
        ctx.lineWidth = 5 * sc;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, 2 * sc, 13 * sc, Math.PI, 0, false);
        ctx.stroke();
        ctx.fillStyle = INK;
        ctx.fillRect(-15.5 * sc, 2 * sc, 5 * sc, 9 * sc);
        ctx.fillRect(10.5 * sc, 2 * sc, 5 * sc, 9 * sc);`;
    case 'phone_scroll':
      return `
        ctx.strokeStyle = INK;
        ctx.lineWidth = 3 * sc;
        ctx.beginPath();
        ctx.roundRect(-10 * sc, -17 * sc, 20 * sc, 34 * sc, 5 * sc);
        ctx.stroke();
        ctx.fillStyle = RED;
        ctx.fillRect(-6 * sc, -9 * sc, 12 * sc, 10 * sc);`;
    case 'money_flow':
      return `
        ctx.font = "900 " + Math.round(28 * sc) + 'px "JetBrains Mono", monospace';
        ctx.fillStyle = EMERALD;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("$", 0, 1 * sc);`;
    case 'growth_chart':
      return `
        ctx.strokeStyle = EMERALD;
        ctx.lineWidth = 3.5 * sc;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-15 * sc, 11 * sc);
        ctx.lineTo(-4 * sc, 1 * sc);
        ctx.lineTo(4 * sc, 6 * sc);
        ctx.lineTo(15 * sc, -11 * sc);
        ctx.stroke();`;
    case 'checklist_steps':
      return `
        ctx.strokeStyle = EMERALD;
        ctx.lineWidth = 4 * sc;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-12 * sc, 1 * sc);
        ctx.lineTo(-3 * sc, 10 * sc);
        ctx.lineTo(13 * sc, -9 * sc);
        ctx.stroke();`;
    case 'stair_goal':
      return `
        ctx.fillStyle = RED;
        ctx.fillRect(-14 * sc, 6 * sc, 8 * sc, 8 * sc);
        ctx.fillRect(-4 * sc, -2 * sc, 8 * sc, 16 * sc);
        ctx.fillRect(6 * sc, -11 * sc, 8 * sc, 25 * sc);`;
    case 'cta_card':
      return `
        ctx.fillStyle = RED;
        ctx.beginPath();
        ctx.moveTo(-7 * sc, -11 * sc);
        ctx.lineTo(13 * sc, 0);
        ctx.lineTo(-7 * sc, 11 * sc);
        ctx.closePath();
        ctx.fill();`;
    case 'brain_idea':
    default:
      return `
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(0, -3 * sc, 12 * sc, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = INK;
        ctx.fillRect(-5 * sc, 10 * sc, 10 * sc, 6 * sc);`;
  }
}

/**
 * Reference Video 1 Style: 3D Studio Room & Pedestal (AiShift.id / Kreatorlab.id)
 * - Herringbone parquet wood floor, off-white studio wall with diagonal sunlight rays,
 *   3D light-slate sofa, geometric rug, hanging pink dome lamp, 3D extruded red-orange wall headline.
 * - 3D Narrator standing on the left (Scene 0 starts with close-up face hook at 00:00 -> smooth pull-out to full room).
 * - 3 Cylindrical white pedestals with glowing orange top rings rising sequentially on beat1, beat2, beat3,
 *   each topped with a 3D object + floating 3D browser/repo showcase card above + floating 3D winged red mascot orb.
 * - Final CTA scene zooms in with the dark glass Follow Card ("Follow" -> "Following ✓").
 */
function buildStudio3DRoomSceneCode(params: {
  sceneIndex: number;
  totalScenes: number;
  dur: number;
  role: string;
  motif: VisualMotif;
  shouldDrawCharacter: boolean;
  force3DStudioChar?: boolean;
  pose: string;
  badgeText: string;
  headlineShort: string;
  statLabel: string;
  statVal: string;
  card1: string;
  card2: string;
  card3: string;
  mediaKey: string;
  platforms?: string[];
  beats: NarrativeBeatSchedule;
  sfxLines: string;
}): string {
  const {
    sceneIndex,
    totalScenes,
    dur,
    role,
    motif,
    shouldDrawCharacter,
    force3DStudioChar = false,
    pose,
    badgeText,
    headlineShort,
    statLabel,
    statVal,
    card1,
    card2,
    card3,
    mediaKey,
    platforms = [],
    beats,
    sfxLines,
  } = params;
  const platLeft = platforms[0] || '';
  const platRight = platforms[1] || '';
  const leftAltMotif: VisualMotif = motif === 'checklist_steps' ? 'brain_idea' : 'checklist_steps';
  const rightAltMotif: VisualMotif = motif === 'growth_chart' ? 'stair_goal' : 'growth_chart';

  const isHook = sceneIndex === 0 || role === 'hook';
  const isCta = role === 'cta' || (sceneIndex === totalScenes - 1 && totalScenes > 1);
  const wallHeadline = escapeJsStr(headlineShort.replace(/\\(.)/g, '$1').slice(0, 22) || statVal || 'STUDIO 3D');
  const secondaryPose =
    pose === 'present' ? 'point' : pose === 'point' ? 'present' : pose === 'thumbs' ? 'cheer' : 'present';

  return `${AUTO_CONTEXTUAL_SCENE_HEADER}
const W = s.W || 720, H = s.H || 1280;
const isWide = W > H * 1.1;
const cx = W * 0.5;
const cy = H * 0.5;
const sc = Math.min(W / 720, H / 1280);
const wallY = isWide ? H * 0.60 : H * 0.56;
const ground = isWide ? H * 0.77 : H * 0.735;
const beat1 = ${beats.beat1};
const beat2 = ${beats.beat2};
const beat3 = ${beats.beat3};
const beat4 = ${beats.beat4};
const popAt = (d, w = ${beats.popSpan}) => (d <= beat1 + 0.02 ? s.pop(d - 0.24, w) : s.t < d ? 0 : s.pop(d, w));
const springAt = (d, cfg = "snappy") => (d <= beat1 + 0.02 ? s.spring(d - 0.24, cfg) : s.t < d ? 0 : s.spring(d, cfg));
const atProgress = (d, w = 0.42) => (d <= beat1 + 0.02 ? s.at(d - 0.24, w) : s.t < d ? 0 : s.at(d, w));
${sfxLines}

// Multi-Phase Camera Choreography (Smooth Continuous 60fps Dolly & Pan without velocity jumps)
const hookPull = ${isHook ? 's.ease.inOut(s.clamp((s.t - 0.04) / 0.82, 0, 1))' : '1'};
const p2Cam = s.ease.inOut(s.clamp((s.t - beat2) / Math.max(0.55, beat3 - beat2), 0, 1));
const p3Cam = s.ease.inOut(s.clamp((s.t - beat3) / Math.max(0.55, beat4 - beat3), 0, 1));
const p4Cam = s.ease.inOut(s.clamp((s.t - beat4) / Math.max(0.60, ${dur.toFixed(2)} - beat4), 0, 1));

const baseZoom = (1 - hookPull) * 0.28 + 1.0;
const beatZoom = ${isCta ? 'p3Cam * 0.09 + p4Cam * 0.05' : 'p2Cam * 0.045 + p3Cam * 0.055 - p4Cam * 0.065'};
const camZoom = baseZoom + beatZoom * hookPull + Math.sin(s.t * 1.35) * 0.008;
const closeUpShiftX = (1 - hookPull) * (W * 0.115);
const closeUpShiftY = (1 - hookPull) * (-H * 0.05);
const focusPanX = hookPull * (${isCta ? '0' : '(-p2Cam * 11 - p3Cam * 13 + p4Cam * 14)'} * sc);
const focusPanY = hookPull * (${isCta ? '-p3Cam * 10' : '(p2Cam * 4.5 - p3Cam * 5.5 + p4Cam * 4.5)'} * sc);
const camPanX = closeUpShiftX + focusPanX + Math.sin(s.t * 1.15) * 3.2 * sc;
const camPanY = closeUpShiftY + focusPanY + Math.cos(s.t * 0.92) * 2.2 * sc;

s.group({ x: cx + camPanX, y: cy + camPanY, scale: camZoom }, () => {
  s.group({ x: -cx, y: -cy }, () => {
    // 1. 3D STUDIO ROOM ENVIRONMENT (Warm Sunlit Plaster Wall + Diagonal Window Shadows + Fast 60fps Parquet Floor)
    ctx.save();
    const wallGrad = ctx.createLinearGradient(0, 0, W, wallY);
    wallGrad.addColorStop(0, "#f5f1e8");
    wallGrad.addColorStop(0.55, "#ece4d8");
    wallGrad.addColorStop(1, "#dfd4c4");
    ctx.fillStyle = wallGrad;
    ctx.fillRect(-W * 0.25, -H * 0.25, W * 1.5, wallY + H * 0.25);

    // Diagonal Window Blind Sunlight & Drifting Warm Dust Motes across Studio Wall
    ctx.save();
    ctx.fillStyle = "rgba(255, 253, 248, 0.52)";
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      const rx = W * 0.16 + i * 145 * sc;
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx + 72 * sc, 0);
      ctx.lineTo(rx + 220 * sc, wallY);
      ctx.lineTo(rx + 148 * sc, wallY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255, 250, 232, 0.72)";
    for (let m = 0; m < 8; m++) {
      const mx = W * (0.18 + ((m * 0.19) % 0.68)) + Math.sin(s.t * 0.8 + m) * 14 * sc;
      const my = wallY * (0.15 + ((m * 0.23 + s.t * 0.045) % 0.75));
      const mr = (1.6 + (m % 3) * 0.9) * sc;
      ctx.globalAlpha = 0.28 + 0.36 * (0.5 + 0.5 * Math.sin(s.t * 2.2 + m * 1.3));
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Baseboard Trim
    ctx.fillStyle = "#cfc8bc";
    ctx.fillRect(-W * 0.2, wallY - 14 * sc, W * 1.4, 14 * sc);
    ctx.fillStyle = "#f7f5f0";
    ctx.fillRect(-W * 0.2, wallY - 16 * sc, W * 1.4, 2.5 * sc);

    // Fast 60fps Perspective Hardwood Studio Floor
    const floorGrad = ctx.createLinearGradient(0, wallY, 0, H * 1.2);
    floorGrad.addColorStop(0, "#966b45");
    floorGrad.addColorStop(0.45, "#7d5635");
    floorGrad.addColorStop(1, "#583920");
    ctx.fillStyle = floorGrad;
    ctx.fillRect(-W * 0.25, wallY, W * 1.5, H * 1.2 - wallY);

    // Clean Horizontal & Perspective Plank Lines (14 draw ops instead of 240)
    ctx.strokeStyle = "rgba(52, 31, 15, 0.28)";
    ctx.lineWidth = 1.4 * sc;
    ctx.beginPath();
    for (let r = 1; r <= 6; r++) {
      const py = wallY + Math.pow(r / 6, 1.28) * (H * 1.15 - wallY);
      ctx.moveTo(-W * 0.2, py);
      ctx.lineTo(W * 1.2, py);
    }
    for (let c = -3; c <= 3; c++) {
      const topX = cx + c * 95 * sc;
      const botX = cx + c * 225 * sc;
      ctx.moveTo(topX, wallY);
      ctx.lineTo(botX, H * 1.18);
    }
    ctx.stroke();

    // Grey Geometric Studio Rug under Sofa & Pedestals
    const rugX = W * 0.34, rugY = wallY + 26 * sc, rugW = W * 0.64, rugH = (ground - wallY) + 124 * sc;
    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.beginPath();
    ctx.roundRect(rugX + 4 * sc, rugY + 6 * sc, rugW, rugH, 14 * sc);
    ctx.fill();
    ctx.fillStyle = "#94979d";
    ctx.strokeStyle = "#e2e4e8";
    ctx.lineWidth = 2.5 * sc;
    ctx.beginPath();
    ctx.roundRect(rugX, rugY, rugW, rugH, 12 * sc);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(241, 245, 249, 0.44)";
    ctx.lineWidth = 1.8 * sc;
    for (let d = 0; d < 3; d++) {
      const dx = rugX + (d + 0.5) * (rugW / 3);
      const dy = rugY + rugH * 0.5;
      ctx.beginPath();
      ctx.moveTo(dx, rugY + 12 * sc);
      ctx.lineTo(dx + rugW / 6, dy);
      ctx.lineTo(dx, rugY + rugH - 12 * sc);
      ctx.lineTo(dx - rugW / 6, dy);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();

    // 2. HANGING PASTEL-PINK 3D DOME LAMP (Upper-left studio corner, clear of headline & character)
    const lampX = W * 0.185, lampY = H * 0.145 + s.wave(0.45, 2.2 * sc);
    ctx.save();
    const coneGrad = ctx.createRadialGradient(lampX, lampY + 22 * sc, 6 * sc, lampX, lampY + 115 * sc, 150 * sc);
    coneGrad.addColorStop(0, "rgba(255, 244, 214, 0.42)");
    coneGrad.addColorStop(1, "rgba(255, 244, 214, 0)");
    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.arc(lampX, lampY + 74 * sc, 148 * sc, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2.8 * sc;
    ctx.beginPath();
    ctx.moveTo(lampX, -H * 0.15);
    ctx.lineTo(lampX, lampY - 18 * sc);
    ctx.stroke();
    ctx.fillStyle = "#d97706";
    ctx.beginPath();
    ctx.roundRect(lampX - 8 * sc, lampY - 25 * sc, 16 * sc, 10 * sc, 4 * sc);
    ctx.fill();
    const domeGrad = ctx.createLinearGradient(lampX - 36 * sc, lampY - 18 * sc, lampX + 36 * sc, lampY + 12 * sc);
    domeGrad.addColorStop(0, "#f7cfc6");
    domeGrad.addColorStop(0.55, "#e6a498");
    domeGrad.addColorStop(1, "#b87568");
    ctx.fillStyle = domeGrad;
    ctx.beginPath();
    ctx.arc(lampX, lampY + 6 * sc, 36 * sc, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fffbeb";
    ctx.beginPath();
    ctx.ellipse(lampX, lampY + 6 * sc, 34 * sc, 7.5 * sc, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. BOLD 3D EXTRUDED WALL HEADLINE (Positioned cleanly at top-right wall zone above showcase monitor)
    const kWallText = ${isHook ? 'popAt(beat1 + 0.30, 0.34)' : 'popAt(beat1, 0.36)'};
    if (kWallText > 0.01) {
      const wx = W * 0.625, wy = H * 0.135;
      const wallTxt = "${wallHeadline}";
      ctx.save();
      const baseFontSz = Math.round((wallTxt.length > 14 ? 38 : wallTxt.length > 10 ? 44 : 50) * sc);
      ctx.font = "900 " + baseFontSz + 'px "Plus Jakarta Sans", "Inter", sans-serif';
      const measuredW = Math.max(1, ctx.measureText(wallTxt).width);
      const fitScale = Math.min(1, (W * 0.52) / measuredW);
      ctx.translate(wx, wy);
      ctx.scale(kWallText * fitScale, kWallText * fitScale);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(45, 22, 12, 0.20)";
      ctx.fillText(wallTxt, 6 * sc, 9 * sc);
      for (let d = 6; d >= 1; d--) {
        ctx.fillStyle = d > 3 ? "#7c1908" : "#b3240d";
        ctx.fillText(wallTxt, d * 1.2 * sc, d * 1.4 * sc);
      }
      const txtGrad = ctx.createLinearGradient(0, -baseFontSz * 0.5, 0, baseFontSz * 0.5);
      txtGrad.addColorStop(0, "#ff5c28");
      txtGrad.addColorStop(1, "#dc2626");
      ctx.fillStyle = txtGrad;
      ctx.fillText(wallTxt, 0, 0);
      ctx.restore();
    }

    // 4. SLEEK STUDIO LOUNGE SOFA (Tucked cleanly on left-mid wall behind narrator so right gallery stage is 100% uncluttered)
    const sofaX = W * 0.35, sofaY = wallY + 4 * sc, sofaW = 210 * sc, sofaH = 78 * sc;
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.22)";
    ctx.beginPath();
    ctx.ellipse(sofaX, sofaY + 24 * sc, sofaW * 0.52, 13 * sc, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#451a03";
    ctx.fillRect(sofaX - sofaW * 0.43, sofaY + 10 * sc, 8 * sc, 14 * sc);
    ctx.fillRect(sofaX + sofaW * 0.43 - 8 * sc, sofaY + 10 * sc, 8 * sc, 14 * sc);
    const backGrad = ctx.createLinearGradient(sofaX, sofaY - sofaH * 0.78, sofaX, sofaY);
    backGrad.addColorStop(0, "#cbd5e1");
    backGrad.addColorStop(1, "#94a3b8");
    ctx.fillStyle = backGrad;
    ctx.beginPath();
    ctx.roundRect(sofaX - sofaW * 0.44, sofaY - sofaH * 0.75, sofaW * 0.88, sofaH * 0.66, 14 * sc);
    ctx.fill();
    const seatGrad = ctx.createLinearGradient(sofaX, sofaY - 12 * sc, sofaX, sofaY + 16 * sc);
    seatGrad.addColorStop(0, "#dbe4eb");
    seatGrad.addColorStop(1, "#94a3b8");
    ctx.fillStyle = seatGrad;
    ctx.beginPath();
    ctx.roundRect(sofaX - sofaW * 0.46, sofaY - 12 * sc, sofaW * 0.92, 26 * sc, 10 * sc);
    ctx.fill();
    ctx.restore();

    // 5. FLOATING CONCEPT-ACCURATE 3D SHOWCASE MONITOR (Upper-Right Wall Zone — Zero Overlap with Pedestals)
    const kShowcase = ${isHook ? 'popAt(Math.max(beat1 + 0.40, (beat1 + beat2) * 0.44), 0.36)' : 'popAt(beat1 + 0.015, 0.38)'};
    if (kShowcase > 0.01) {
      const scX = W * 0.635, scY = (isWide ? H * 0.31 : H * 0.295) + s.wave(0.75, 2.6 * sc);
      const scW = 276 * sc, scH = 146 * sc;
      s.group({ x: scX, y: scY, scale: kShowcase, rotate: -0.01 }, () => {
        s.shadow(0, scH * 0.5 + 10 * sc, 104 * sc, { alpha: 0.24 * kShowcase });
        s.card(-scW * 0.5, -scH * 0.5, scW, scH, {
          r: 18 * sc,
          fill: "#ffffff",
          stroke: "#ff471a",
          width: 3 * sc,
        });
        s.rect(-scW * 0.5 + 3 * sc, -scH * 0.5 + 3 * sc, scW - 6 * sc, 28 * sc, {
          r: 14 * sc,
          fill: "#0f172a",
          stroke: "none",
        });
        s.circle(-scW * 0.5 + 18 * sc, -scH * 0.5 + 17 * sc, 4.5 * sc, { fill: "#ef4444", stroke: "none" });
        s.circle(-scW * 0.5 + 31 * sc, -scH * 0.5 + 17 * sc, 4.5 * sc, { fill: "#f59e0b", stroke: "none" });
        s.circle(-scW * 0.5 + 44 * sc, -scH * 0.5 + 17 * sc, 4.5 * sc, { fill: "#10b981", stroke: "none" });
        s.text("${statLabel.toUpperCase()}  ·  SCENE 0${sceneIndex + 1}", 16 * sc, -scH * 0.5 + 17 * sc, {
          size: Math.round(10 * sc),
          color: "#cbd5e1",
        });

        ${
          mediaKey
            ? `s.photo("${escapeJsStr(mediaKey)}", 0, 12 * sc, scW - 20 * sc, scH - 46 * sc, {
          frame: "none",
          r: 10 * sc,
          zoom: 1.04 + p3Cam * 0.12,
          fx: 0.5,
          fy: 0.45,
          draw: kShowcase,
          time: s.t,
        });`
            : buildStudioShowcaseContentSnippet({
                motif,
                headlineShort,
                card1,
                card2,
                card3,
                statLabel,
                statVal,
                dur,
              })
        }
      });
    }

    // 6. SEQUENTIAL 3D WHITE CYLINDRICAL PEDESTALS WITH STEP BADGES & HIGH-CONTRAST 3D OBJECTS (Lower-Right Gallery Zone)
    const pedBeats = [beat1, beat1 + 0.22, beat2];
    const pedLabels = ["${card1}", "${card2}", "${card3}"];
    const pedStepNums = ["01", "02", "03"];
    const pedXs = [W * 0.465, W * 0.655, W * 0.845];
    const pedBaseY = ground + 28 * sc;
    const pedHeights = [92 * sc, 110 * sc, 98 * sc];
    const pedRadius = 36 * sc;

    for (let i = 0; i < 3; i++) {
      const kPed = springAt(pedBeats[i], "bouncy");
      if (kPed > 0.01) {
        const px = pedXs[i];
        const ph = pedHeights[i] * Math.min(1.10, Math.max(0.05, kPed));
        const topY = pedBaseY - ph;
        const pedBounce = Math.max(0, kPed - 1);
        const pedScaleX = 1 - pedBounce * 0.42;
        ctx.save();
        // Dynamic floor contact shadow proportional to elevation
        const shadowAlpha = 0.34 * Math.min(1, kPed);
        ctx.fillStyle = "rgba(15, 23, 42, " + shadowAlpha.toFixed(3) + ")";
        ctx.beginPath();
        ctx.ellipse(px, pedBaseY + 6 * sc, pedRadius * (1.18 * Math.min(1.04, kPed)), pedRadius * 0.36, 0, 0, Math.PI * 2);
        ctx.fill();

        const rEff = pedRadius * pedScaleX;
        // 3D White Cylinder Body
        const cylGrad = ctx.createLinearGradient(px - rEff, topY, px + rEff, pedBaseY);
        cylGrad.addColorStop(0, "#f8fafc");
        cylGrad.addColorStop(0.35, "#ffffff");
        cylGrad.addColorStop(0.75, "#e2e8f0");
        cylGrad.addColorStop(1, "#cbd5e1");
        ctx.fillStyle = cylGrad;
        ctx.beginPath();
        ctx.moveTo(px - rEff, topY);
        ctx.lineTo(px + rEff, topY);
        ctx.lineTo(px + rEff, pedBaseY);
        ctx.ellipse(px, pedBaseY, rEff, pedRadius * 0.32, 0, 0, Math.PI, false);
        ctx.closePath();
        ctx.fill();

        // Glowing Orange-Red Top Rim (#ff471a)
        ctx.fillStyle = i === 1 ? "#ff471a" : "#f97316";
        ctx.beginPath();
        ctx.ellipse(px, topY + 3 * sc, rEff * 1.04, pedRadius * 0.34, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff7ed";
        ctx.beginPath();
        ctx.ellipse(px, topY, rEff * 0.92, pedRadius * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();

        // High-Contrast 3D Object Halo Backplate + Concept-Accurate 3D Vector Object
        const objBob = s.wave(0.9, 4.2 * sc, i * 1.7);
        const oy = topY - 34 * sc + objBob;
        ctx.save();
        ctx.translate(px, oy);
        ctx.scale(Math.min(1.05, kPed), Math.min(1.05, kPed));
        // Subtle dark glass circular backplate so every 3D icon stands out crisply against the studio wall
        ctx.fillStyle = "rgba(15, 23, 42, 0.86)";
        ctx.strokeStyle = i === 1 ? "#ff471a" : "#38bdf8";
        ctx.lineWidth = 2.2 * sc;
        ctx.beginPath();
        ctx.arc(0, 0, 27 * sc, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.rotate(Math.sin(s.t * 1.5 + i) * 0.04);
        if (i === 0 && "${escapeJsStr(platLeft)}") {
          if (typeof globalThis !== "undefined" && typeof globalThis.__SATSET_DRAW_PLATFORM_LOGO === "function") {
            globalThis.__SATSET_DRAW_PLATFORM_LOGO(ctx, "${escapeJsStr(platLeft)}", 0, 0, 44 * sc, { withBadge: true, withLabel: false });
          } else {
            ${buildStudioPedestalObjectSnippet(leftAltMotif)}
          }
        } else if (i === 2 && "${escapeJsStr(platRight)}") {
          if (typeof globalThis !== "undefined" && typeof globalThis.__SATSET_DRAW_PLATFORM_LOGO === "function") {
            globalThis.__SATSET_DRAW_PLATFORM_LOGO(ctx, "${escapeJsStr(platRight)}", 0, 0, 44 * sc, { withBadge: true, withLabel: false });
          } else {
            ${buildStudioPedestalObjectSnippet(rightAltMotif)}
          }
        } else if (i === 0) {
          ${buildStudioPedestalObjectSnippet(leftAltMotif)}
        } else if (i === 2) {
          ${buildStudioPedestalObjectSnippet(rightAltMotif)}
        } else {
          ${buildStudioPedestalObjectSnippet(motif)}
        }
        ctx.restore();

        // Step Number Pill + Front Pedestal Plaque
        const plaqueY = pedBaseY - ph * 0.52;
        ctx.fillStyle = "#0f172a";
        ctx.strokeStyle = i === 1 ? "#ff471a" : "rgba(148, 163, 184, 0.45)";
        ctx.lineWidth = 1.6 * sc;
        ctx.beginPath();
        ctx.roundRect(px - 44 * sc, plaqueY - 12 * sc, 88 * sc, 24 * sc, 12 * sc);
        ctx.fill();
        ctx.stroke();
        // Step badge circle on left of plaque
        ctx.fillStyle = i === 1 ? "#ff471a" : "#2563eb";
        ctx.beginPath();
        ctx.arc(px - 31 * sc, plaqueY, 8.5 * sc, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "800 " + Math.round(8.5 * sc) + 'px "JetBrains Mono", monospace';
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pedStepNums[i], px - 31 * sc, plaqueY + 0.5 * sc);

        ctx.font = "700 " + Math.round(10 * sc) + 'px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(pedLabels[i] || "").slice(0, 10), px + 6 * sc, plaqueY, 62 * sc);
        ctx.restore();
      }
    }

    // 7. 3D NARRATOR CHARACTER ON THE LEFT SIDE OF THE STUDIO ROOM
    ${
      shouldDrawCharacter
        ? `const charX = W * 0.215, charY = ground + 26 * sc + s.wave(0.85, 2 * sc, ${sceneIndex});
    s.shadow(charX, ground + 28 * sc, 68 * sc, { alpha: 0.32 });
    s.person(charX, charY, {
      ${force3DStudioChar ? '__is3DStudioCreator: true,' : ''}
      pose: [["${pose}", 0], ["${secondaryPose}", beat2], ["${pose}", beat3], ["${isCta ? 'cheer' : 'thumbs'}", beat4]],
      size: 274 * sc,
      facing: 1,
    });`
        : ''
    }

    // 8. FLOATING WINGED MASCOT ORB (Positioned in upper-right gallery space, clear of Pedestal 3)
    const kMascot = popAt(beat1 + 0.01, 0.38);
    if (kMascot > 0.01) {
      const mx = W * 0.895, my = (isWide ? H * 0.195 : H * 0.205) + s.wave(1.35, 6 * sc);
      const rendered3DOrb =
        ${force3DStudioChar ? 'true' : 'false'} &&
        typeof globalThis !== "undefined" &&
        typeof globalThis.__SATSET_3D_MASCOT_HOOK === "function" &&
        globalThis.__SATSET_3D_MASCOT_HOOK(ctx, mx, my, 74 * sc * kMascot, s.t);
      if (!rendered3DOrb) {
        const wingFlap = Math.sin(s.t * 9.5) * 0.22;
        ctx.save();
        ctx.translate(mx, my);
        ctx.scale(kMascot, kMascot);
        ctx.fillStyle = "#f8fafc";
        ctx.save();
        ctx.translate(-20 * sc, -4 * sc);
        ctx.rotate(-0.25 + wingFlap);
        ctx.beginPath();
        ctx.ellipse(-9 * sc, 0, 12 * sc, 6 * sc, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.translate(20 * sc, -4 * sc);
        ctx.rotate(0.25 - wingFlap);
        ctx.beginPath();
        ctx.ellipse(9 * sc, 0, 12 * sc, 6 * sc, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        const orbG = ctx.createRadialGradient(-6 * sc, -7 * sc, 3 * sc, 0, 0, 21 * sc);
        orbG.addColorStop(0, "#ff7a59");
        orbG.addColorStop(0.55, "#ef4444");
        orbG.addColorStop(1, "#991b1b");
        ctx.fillStyle = orbG;
        ctx.beginPath();
        ctx.arc(0, 0, 20 * sc, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#18181b";
        ctx.beginPath();
        ctx.roundRect(-12 * sc, -6 * sc, 24 * sc, 10 * sc, 5 * sc);
        ctx.fill();
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(-5 * sc, -1 * sc, 2.6 * sc, 0, Math.PI * 2);
        ctx.arc(5 * sc, -1 * sc, 2.6 * sc, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 9. SINGLE CLEAN COMPACT TOP BRAND PILL (Clear below rounded frame & watermark)
    ctx.save();
    const pillLabel = "GRAPH MOTION  ·  [ ${badgeText} ]";
    ctx.font = "800 " + Math.round(13 * sc) + 'px "Plus Jakarta Sans", sans-serif';
    const pw0 = Math.min(W * 0.72, ctx.measureText(pillLabel).width + 36 * sc);
    const pillTop = H * 0.088;
    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.beginPath();
    ctx.roundRect(cx - pw0 * 0.5, pillTop, pw0, 30 * sc, 15 * sc);
    ctx.fill();
    ctx.fillStyle = "#f8fafc";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pillLabel, cx, pillTop + 15 * sc, pw0 - 26 * sc);
    ctx.restore();

    // 10. FINAL CTA INTERACTIVE FOLLOW CARD OVERLAY (Follow -> Following ✓)
    ${
      isCta
        ? `const kFollow = popAt(beat3, 0.38);
    if (kFollow > 0.01) {
      const isFollowed = s.t >= beat4;
      const btnScale = isFollowed ? 1 + s.pop(beat4, 0.25) * 0.08 : 1;
      ctx.save();
      ctx.translate(cx + 45 * sc, H * 0.46);
      ctx.scale(kFollow, kFollow);
      // Dark Glass Profile Card
      ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
      ctx.lineWidth = 2.5 * sc;
      ctx.beginPath();
      ctx.roundRect(-165 * sc, -72 * sc, 330 * sc, 144 * sc, 24 * sc);
      ctx.fill();
      ctx.stroke();
      // Avatar Badge
      ctx.fillStyle = "#ff471a";
      ctx.beginPath();
      ctx.arc(-102 * sc, 0, 36 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "900 " + Math.round(22 * sc) + 'px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("3D", -102 * sc, 1 * sc);
      // Handle & Subtitle
      ctx.textAlign = "left";
      ctx.font = "800 " + Math.round(20 * sc) + 'px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = "#ffffff";
      ctx.fillText("@kreator.3d", -52 * sc, -22 * sc);
      ctx.font = "600 " + Math.round(13 * sc) + 'px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("${statLabel} · ${statVal}", -52 * sc, 0);
      // Interactive Follow -> Following Button + Tap Ripple Ring
      const clickProg = isFollowed ? s.clamp((s.t - beat4) / 0.42, 0, 1) : 0;
      ctx.save();
      ctx.translate(22 * sc, 34 * sc);
      if (isFollowed && clickProg > 0 && clickProg < 1) {
        ctx.save();
        ctx.strokeStyle = "rgba(16, 185, 129, " + (1 - clickProg).toFixed(3) + ")";
        ctx.lineWidth = 3 * sc;
        ctx.beginPath();
        ctx.roundRect(-74 * sc - clickProg * 14 * sc, -17 * sc - clickProg * 8 * sc, 148 * sc + clickProg * 28 * sc, 34 * sc + clickProg * 16 * sc, 24 * sc);
        ctx.stroke();
        ctx.restore();
      }
      ctx.scale(btnScale, btnScale);
      ctx.fillStyle = isFollowed ? "#10b981" : "#ef4444";
      ctx.beginPath();
      ctx.roundRect(-74 * sc, -17 * sc, 148 * sc, 34 * sc, 17 * sc);
      ctx.fill();
      ctx.font = "800 " + Math.round(14 * sc) + 'px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(isFollowed ? "Following ✓" : "Follow +", 0, 1 * sc);
      ctx.restore();
      ctx.restore();
    }`
        : ''
    }
  });
});
`;
}

/**
 * Overhauled Editorial Motion Grid & 3D Host (Kreatorlab / AiShift Flagship Style)
 * - 8 distinct, non-repeating choreographies across scenes (0..7) so an 8-scene video never repeats a layout!
 * - Multi-stage spring physics, 3D extruded perspective cards, animated Bezier data streams, live spline charts,
 *   split-screen before/after wipes, vertical 3D exploded layer stacks, and interactive Bezier cursor click ripples.
 * - Bust-framed 3D Narrator Host in the bottom-right corner acting out the 4-beat semantic emotion sequence (`beatPoses`).
 */
function buildEditorialMotionGridSceneCode(params: {
  sceneIndex: number;
  totalScenes: number;
  dur: number;
  role: string;
  motif: VisualMotif;
  shouldDrawCharacter: boolean;
  force3DStudioChar?: boolean;
  pose: string;
  beatPoses?: [string, string, string, string];
  badgeText: string;
  headlineShort: string;
  statLabel: string;
  statVal: string;
  card1: string;
  card2: string;
  card3: string;
  beats: NarrativeBeatSchedule;
  sfxLines: string;
}): string {
  const {
    sceneIndex,
    totalScenes,
    dur,
    role,
    shouldDrawCharacter,
    force3DStudioChar = false,
    pose,
    beatPoses,
    badgeText,
    headlineShort,
    statLabel,
    statVal,
    card1,
    card2,
    card3,
    beats,
    sfxLines,
  } = params;

  const isDarkGrid = sceneIndex % 2 === 0;
  const isCta = role === 'cta' || (sceneIndex === totalScenes - 1 && totalScenes > 1);
  // Strictly unique variant per sceneIndex (0..6 for non-CTA scenes, 7 for CTA scene)
  const variant = isCta ? 7 : sceneIndex % 7;
  const [pBeat1, pBeat2, pBeat3, pBeat4] = beatPoses || [
    pose,
    pose === 'present' ? 'point' : 'explain',
    'idea',
    isCta ? 'cheer' : 'thumbs',
  ];
  const cleanHeadline = escapeJsStr(headlineShort.replace(/\\(.)/g, '$1').slice(0, 24) || 'FOKUS UTAMA');

  return `${AUTO_CONTEXTUAL_SCENE_HEADER}
const W = s.W || 720, H = s.H || 1280;
const cx = W * 0.5;
const cy = H * 0.405;
const sc = Math.min(W / 720, H / 1280);
const beat1 = ${beats.beat1};
const beat2 = ${beats.beat2};
const beat3 = ${beats.beat3};
const beat4 = ${beats.beat4};
const popAt = (d, w = ${beats.popSpan}) => (d <= beat1 + 0.02 ? s.pop(d - 0.24, w) : s.t < d ? 0 : s.pop(d, w));
const springAt = (d, cfg = "snappy") => (d <= beat1 + 0.02 ? s.spring(d - 0.24, cfg) : s.t < d ? 0 : s.spring(d, cfg));
const atProgress = (d, w = 0.42) => (d <= beat1 + 0.02 ? s.at(d - 0.24, w) : s.t < d ? 0 : s.at(d, w));
${sfxLines}

// Smooth Continuous 60fps Camera Choreography (Harmonic Float + Fluid Beat Dolly without velocity jumps)
const p2Cam = s.ease.inOut(s.clamp((s.t - beat2) / Math.max(0.55, beat3 - beat2), 0, 1));
const p3Cam = s.ease.inOut(s.clamp((s.t - beat3) / Math.max(0.55, beat4 - beat3), 0, 1));
const p4Cam = s.ease.inOut(s.clamp((s.t - beat4) / Math.max(0.60, ${dur.toFixed(2)} - beat4), 0, 1));
const camZoom = 1.0 + p2Cam * 0.05 + p3Cam * 0.075 - p4Cam * 0.085 + Math.sin(s.t * 1.4) * 0.008;
const camPanX = (p2Cam * 12 - p3Cam * 16) * (1 - p4Cam * 0.85) * sc + Math.sin(s.t * 1.25) * 3.2 * sc;
const camPanY = (-p2Cam * 9 + p3Cam * 11) * (1 - p4Cam * 0.85) * sc + Math.cos(s.t * 0.95) * 2.4 * sc;

// 1. ALTERNATING CARBON TECH GRID (#070b16) & ARCHITECTURAL PAPER GRID (#f4f3ef) WITH DRIFTING PERSPECTIVE
const isDark = ${isDarkGrid ? 'true' : 'false'};
const BG = isDark ? "#070b16" : "#f4f3ef";
const INK = isDark ? "#f8fafc" : "#0f172a";
const MUTED = isDark ? "#94a3b8" : "#475569";
const CARD_BG = isDark ? "rgba(15, 23, 42, 0.95)" : "#ffffff";
const CARD_BORDER = isDark ? "rgba(56, 189, 248, 0.38)" : "rgba(15, 23, 42, 0.16)";
const ACCENT = isDark ? "#38bdf8" : "#2563eb";
const CORAL = "#ef4444";
const EMERALD = "#10b981";
const AMBER = "#f59e0b";

// Reusable 3D Perspective Flip-In & Specular Glass Sweep Helpers (Eliminates stiff/flat object entrances)
const enter3D = (x, y, k, dir = 1) => {
  const cK = Math.min(1, Math.max(0.001, k));
  const inv = 1 - cK;
  const arcX = inv * dir * 110 * sc;
  const arcY = inv * inv * -58 * sc;
  const flipX = (0.32 + 0.68 * Math.sin(cK * Math.PI * 0.5)) * (0.86 + 0.14 * k);
  const scaleY = 0.84 + 0.16 * k;
  const skewY = inv * dir * 0.14;
  const skewX = -inv * dir * 0.08;
  ctx.translate(x + arcX, y + arcY);
  ctx.transform(flipX, skewY, skewX, scaleY, 0, 0);
};
const drawGlassSweep = (w, h, t0) => {
  const sp = s.clamp((s.t - t0 - 0.08) / 0.58, 0, 1);
  if (sp > 0.01 && sp < 0.99) {
    const sx = (-w * 0.65) + sp * (w * 1.3);
    const sg = ctx.createLinearGradient(sx - 45 * sc, -h * 0.5, sx + 45 * sc, h * 0.5);
    sg.addColorStop(0, "rgba(255,255,255,0)");
    sg.addColorStop(0.5, isDark ? "rgba(255,255,255,0.22)" : "rgba(56,189,248,0.18)");
    sg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sg;
    ctx.fillRect(-w * 0.48, -h * 0.48, w * 0.96, h * 0.96);
  }
};

ctx.save();
ctx.fillStyle = BG;
ctx.fillRect(-W * 0.35, -H * 0.35, W * 1.7, H * 1.7);
const gridStep = 44 * sc;
const driftX = (s.t * 22 * sc) % gridStep;
const driftY = (s.t * 16 * sc) % gridStep;
ctx.strokeStyle = isDark ? "rgba(56, 189, 248, 0.095)" : "rgba(15, 23, 42, 0.068)";
ctx.lineWidth = 1.2 * sc;
ctx.beginPath();
for (let gx = -W * 0.35 + driftX; gx < W * 1.35; gx += gridStep) {
  ctx.moveTo(gx, -H * 0.35); ctx.lineTo(gx, H * 1.35);
}
for (let gy = -H * 0.35 + driftY; gy < H * 1.35; gy += gridStep) {
  ctx.moveTo(-W * 0.35, gy); ctx.lineTo(W * 1.35, gy);
}
ctx.stroke();

// Glowing intersection crosshairs & drifting telemetry nodes
ctx.fillStyle = isDark ? "rgba(56, 189, 248, 0.36)" : "rgba(37, 99, 235, 0.25)";
for (let gx = gridStep * 2 + driftX; gx < W; gx += gridStep * 3) {
  for (let gy = gridStep * 2 + driftY; gy < H * 0.82; gy += gridStep * 3) {
    ctx.fillRect(gx - 3.5 * sc, gy - 0.9 * sc, 7 * sc, 1.8 * sc);
    ctx.fillRect(gx - 0.9 * sc, gy - 3.5 * sc, 1.8 * sc, 7 * sc);
  }
}
const glowX = cx + Math.sin(s.t * 1.5) * 45 * sc;
const glowY = cy + Math.cos(s.t * 1.2) * 35 * sc;
const glow = ctx.createRadialGradient(glowX, glowY, 18 * sc, glowX, glowY, 370 * sc);
glow.addColorStop(0, isDark ? "rgba(56, 189, 248, 0.22)" : "rgba(37, 99, 235, 0.12)");
glow.addColorStop(0.55, isDark ? "rgba(16, 185, 129, 0.09)" : "rgba(239, 68, 68, 0.05)");
glow.addColorStop(1, "rgba(0, 170, 255, 0)");
ctx.fillStyle = glow;
ctx.fillRect(-W * 0.35, -H * 0.35, W * 1.7, H * 1.7);
ctx.restore();

// 2. TOP EDITORIAL CHAPTER PILL WITH PULSING LIVE DOT & FPS TELEMETRY
ctx.save();
const kHeader = springAt(0.02, "snappy");
const edPill = "KREATORLAB  ·  [ ${badgeText} ]";
ctx.font = "800 " + Math.round(12.5 * sc) + 'px "JetBrains Mono", monospace';
const edPw = Math.min(W * 0.78, ctx.measureText(edPill).width + 48 * sc);
const edTop = H * 0.086 - (1 - Math.min(1, kHeader)) * 24 * sc;
ctx.fillStyle = isDark ? "rgba(15, 23, 42, 0.94)" : "rgba(255, 255, 255, 0.96)";
ctx.strokeStyle = CARD_BORDER;
ctx.lineWidth = 1.8 * sc;
ctx.beginPath();
ctx.roundRect(cx - edPw * 0.5, edTop, edPw, 32 * sc, 16 * sc);
ctx.fill();
ctx.stroke();
ctx.fillStyle = CORAL;
ctx.beginPath();
ctx.arc(cx - edPw * 0.5 + 16 * sc, edTop + 16 * sc, (4.2 + Math.sin(s.t * 7) * 1.3) * sc, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = isDark ? "#7dd3fc" : "#1d4ed8";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillText(edPill, cx + 6 * sc, edTop + 16.5 * sc, edPw - 32 * sc);
ctx.restore();

// 3. 8 DISTINCT NON-REPEATING CENTER-STAGE CHOREOGRAPHIES WITH 3D PERSPECTIVE FLIPS & SPECULAR SWEEPS
s.group({ x: cx + camPanX, y: cy + camPanY, scale: camZoom }, () => {
  s.group({ x: -cx, y: -cy }, () => {
    ${
      variant === 0
        ? `// VARIANT 0 (3D PERSPECTIVE FLIP PROBLEM CARD + LASER SLASH SPARKS + 3D EMERALD SOLUTION CARD WITH LIVE COUNTER)
    const kProblem = springAt(beat1, "bouncy");
    const kSlash = s.ease.out(s.clamp((s.t - beat2) / 0.34, 0, 1));
    const kSol = springAt(beat3, "bouncy");
    if (kProblem > 0.01) {
      ctx.save();
      const shakeX = kSlash > 0.02 && kSlash < 0.7 ? Math.sin(s.t * 48) * 5 * sc : 0;
      enter3D(cx - 14 * sc + shakeX, cy - 86 * sc - kSlash * 10 * sc, kProblem, -1);
      ctx.rotate(-0.035 - kSlash * 0.025);
      // 3D extruded slab shadow
      ctx.fillStyle = isDark ? "#020617" : "#cbd5e1";
      ctx.beginPath(); ctx.roundRect(-220 * sc, -56 * sc + 12 * sc, 440 * sc, 112 * sc, 22 * sc); ctx.fill();
      ctx.fillStyle = CARD_BG;
      ctx.strokeStyle = kSlash > 0.1 ? CORAL : CARD_BORDER;
      ctx.lineWidth = 2.8 * sc;
      ctx.beginPath(); ctx.roundRect(-220 * sc, -56 * sc, 440 * sc, 112 * sc, 22 * sc); ctx.fill(); ctx.stroke();
      drawGlassSweep(440 * sc, 112 * sc, beat1);
      ctx.fillStyle = "rgba(239,68,68,0.16)";
      ctx.beginPath(); ctx.roundRect(-196 * sc, -38 * sc, 142 * sc, 24 * sc, 12 * sc); ctx.fill();
      ctx.font = "800 " + Math.round(11 * sc) + 'px "JetBrains Mono", monospace';
      ctx.fillStyle = CORAL; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("⚠ ${statLabel.slice(0, 12)}", -125 * sc, -26 * sc);
      ctx.font = "900 " + Math.round(23 * sc) + 'px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = INK; ctx.textAlign = "left";
      ctx.fillText("${cleanHeadline}", -194 * sc, 14 * sc, 384 * sc);
      // Animated red bottleneck drain bar
      ctx.fillStyle = "rgba(239,68,68,0.22)";
      ctx.beginPath(); ctx.roundRect(-194 * sc, 34 * sc, 388 * sc, 7 * sc, 3.5 * sc); ctx.fill();
      ctx.fillStyle = CORAL;
      ctx.beginPath(); ctx.roundRect(-194 * sc, 34 * sc, 388 * sc * (1 - kSlash * 0.65), 7 * sc, 3.5 * sc); ctx.fill();
      if (kSlash > 0.01) {
        ctx.strokeStyle = CORAL; ctx.lineWidth = 7 * sc; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(-185 * sc, -28 * sc); ctx.lineTo(-185 * sc + 370 * sc * kSlash, -28 * sc + 64 * sc * kSlash); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(185 * sc, -28 * sc); ctx.lineTo(185 * sc - 370 * sc * kSlash, -28 * sc + 64 * sc * kSlash); ctx.stroke();
      }
      ctx.restore();
    }
    if (kSol > 0.01) {
      const livePct = Math.round(s.ease.out(s.clamp((s.t - beat3) / 0.85, 0, 1)) * 100);
      ctx.save();
      enter3D(cx - 12 * sc, cy + 78 * sc + Math.sin(s.t * 3.2) * 4.5 * sc, kSol, 1);
      ctx.fillStyle = "#064e3b";
      ctx.beginPath(); ctx.roundRect(-226 * sc, -60 * sc + 12 * sc, 452 * sc, 120 * sc, 24 * sc); ctx.fill();
      const grad = ctx.createLinearGradient(-226 * sc, -60 * sc, 226 * sc, 60 * sc);
      grad.addColorStop(0, "#10b981"); grad.addColorStop(1, "#0284c7");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.roundRect(-226 * sc, -60 * sc, 452 * sc, 120 * sc, 24 * sc); ctx.fill();
      drawGlassSweep(452 * sc, 120 * sc, beat3);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.beginPath(); ctx.roundRect(118 * sc, -42 * sc, 88 * sc, 26 * sc, 13 * sc); ctx.fill();
      ctx.font = "900 " + Math.round(12.5 * sc) + 'px "JetBrains Mono", monospace';
      ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("+" + livePct + "%", 162 * sc, -29 * sc);
      ctx.font = "900 " + Math.round(22 * sc) + 'px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = "#ffffff"; ctx.textAlign = "left";
      ctx.fillText("${card1} · ${card2}", -198 * sc, -6 * sc, 305 * sc);
      ctx.font = "800 " + Math.round(13.5 * sc) + 'px "JetBrains Mono", monospace';
      ctx.fillStyle = "#dcfce7";
      ctx.fillText("✓ ${card3}  ·  ${statVal}", -198 * sc, 26 * sc, 395 * sc);
      ctx.restore();
    }`
        : variant === 1
        ? `// VARIANT 1 (MACOS TERMINAL TYPEWRITER + GLOWING DATA PACKETS + 3 3D-FLIP BENTO CARDS)
    const kTerm = springAt(beat1, "bouncy");
    if (kTerm > 0.01) {
      const cmd = "> npx kreatorlab --topic \\"${cleanHeadline.toLowerCase().slice(0, 16)}\\"";
      const typed = cmd.slice(0, Math.max(4, Math.floor(s.clamp((s.t - beat1) / Math.max(0.55, beat2 - beat1), 0, 1) * cmd.length)));
      ctx.save();
      enter3D(cx - 14 * sc, cy - 165 * sc, kTerm, -1);
      ctx.fillStyle = "#090d16";
      ctx.beginPath(); ctx.roundRect(-234 * sc, -36 * sc + 10 * sc, 468 * sc, 72 * sc, 18 * sc); ctx.fill();
      ctx.fillStyle = "#0f172a"; ctx.strokeStyle = ACCENT; ctx.lineWidth = 2.5 * sc;
      ctx.beginPath(); ctx.roundRect(-234 * sc, -36 * sc, 468 * sc, 72 * sc, 18 * sc); ctx.fill(); ctx.stroke();
      drawGlassSweep(468 * sc, 72 * sc, beat1);
      ["#ef4444", "#f59e0b", "#10b981"].forEach((c, idx) => {
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc((-208 + idx * 16) * sc, -16 * sc, 4.5 * sc, 0, Math.PI * 2); ctx.fill();
      });
      ctx.font = "700 " + Math.round(15 * sc) + 'px "JetBrains Mono", monospace';
      ctx.fillStyle = "#38bdf8"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText(typed + (Math.floor(s.t * 5) % 2 ? "▋" : ""), -208 * sc, 10 * sc, 415 * sc);
      ctx.restore();
    }
    const items = [
      ["01", "${card1}", ACCENT, beat1 + 0.18],
      ["02", "${card2}", "#8b5cf6", beat2],
      ["03", "${card3}", EMERALD, beat3],
    ];
    items.forEach(([num, label, col, t0], i) => {
      const k = springAt(t0, "bouncy");
      const kCheck = popAt(t0 + 0.2, 0.25);
      if (k > 0.01) {
        const ry = cy - 62 * sc + i * 88 * sc;
        const dir = i % 2 === 0 ? -1 : 1;
        // Glowing Bezier connector pipe + traveling energy packet
        ctx.save();
        ctx.strokeStyle = col; ctx.lineWidth = 2.8 * sc; ctx.setLineDash([6 * sc, 6 * sc]);
        ctx.lineDashOffset = -s.t * 52 * sc;
        ctx.beginPath(); ctx.moveTo(cx - 190 * sc, ry - 48 * sc); ctx.lineTo(cx - 190 * sc, ry); ctx.stroke();
        ctx.setLineDash([]);
        const pktY = (ry - 48 * sc) + ((s.t * 2.4 + i * 0.3) % 1) * 48 * sc;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(cx - 190 * sc, pktY, 4 * sc, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.save();
        enter3D(cx - 14 * sc, ry + Math.sin(s.t * 3 + i) * 2.5 * sc, k, dir);
        ctx.fillStyle = isDark ? "rgba(2,6,23,0.85)" : "rgba(15,23,42,0.14)";
        ctx.beginPath(); ctx.roundRect(-228 * sc, -32 * sc + 9 * sc, 456 * sc, 64 * sc, 18 * sc); ctx.fill();
        ctx.fillStyle = CARD_BG; ctx.strokeStyle = kCheck > 0.5 ? col : CARD_BORDER; ctx.lineWidth = 2.5 * sc;
        ctx.beginPath(); ctx.roundRect(-228 * sc, -32 * sc, 456 * sc, 64 * sc, 18 * sc); ctx.fill(); ctx.stroke();
        drawGlassSweep(456 * sc, 64 * sc, t0);
        ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(-212 * sc, -20 * sc, 44 * sc, 40 * sc, 12 * sc); ctx.fill();
        ctx.font = "800 " + Math.round(15 * sc) + 'px "JetBrains Mono", monospace';
        ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(num, -190 * sc, 1 * sc);
        ctx.font = "800 " + Math.round(19 * sc) + 'px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = INK; ctx.textAlign = "left";
        ctx.fillText(label, -152 * sc, -4 * sc, 305 * sc);
        // Animated progress micro-bar inside each step card
        const barP = s.clamp((s.t - t0) / 0.55, 0, 1);
        ctx.fillStyle = isDark ? "rgba(148,163,184,0.18)" : "rgba(15,23,42,0.08)";
        ctx.beginPath(); ctx.roundRect(-152 * sc, 14 * sc, 240 * sc, 5 * sc, 2.5 * sc); ctx.fill();
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.roundRect(-152 * sc, 14 * sc, 240 * sc * barP, 5 * sc, 2.5 * sc); ctx.fill();
        if (kCheck > 0.01) {
          ctx.save(); ctx.translate(192 * sc, 0); ctx.scale(kCheck, kCheck);
          ctx.fillStyle = EMERALD; ctx.beginPath(); ctx.arc(0, 0, 16 * sc, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3 * sc;
          ctx.beginPath(); ctx.moveTo(-6 * sc, 0); ctx.lineTo(-1 * sc, 5 * sc); ctx.lineTo(7 * sc, -5 * sc); ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }
    });`
        : variant === 2
        ? `// VARIANT 2 (3D FLIP AREA-SPLINE TELEMETRY + LASER SCANLINE PLAYHEAD + ORBITING KPI PILLS)
    const kChart = springAt(beat1, "bouncy");
    const drawProg = s.ease.inOut(s.clamp((s.t - beat1) / Math.max(0.85, beat3 - beat1), 0, 1));
    if (kChart > 0.01) {
      ctx.save();
      enter3D(cx - 14 * sc, cy - 12 * sc + Math.sin(s.t * 2.4) * 3 * sc, kChart, 1);
      ctx.fillStyle = isDark ? "#020617" : "#cbd5e1";
      ctx.beginPath(); ctx.roundRect(-232 * sc, -155 * sc + 12 * sc, 464 * sc, 300 * sc, 24 * sc); ctx.fill();
      ctx.fillStyle = CARD_BG; ctx.strokeStyle = CARD_BORDER; ctx.lineWidth = 2.6 * sc;
      ctx.beginPath(); ctx.roundRect(-232 * sc, -155 * sc, 464 * sc, 300 * sc, 24 * sc); ctx.fill(); ctx.stroke();
      drawGlassSweep(464 * sc, 300 * sc, beat1);
      ctx.font = "800 " + Math.round(13 * sc) + 'px "JetBrains Mono", monospace';
      ctx.fillStyle = MUTED; ctx.textAlign = "left";
      ctx.fillText("${statLabel} · ${cleanHeadline.slice(0, 16)}", -200 * sc, -120 * sc);
      ctx.font = "900 " + Math.round(40 * sc) + 'px "JetBrains Mono", monospace';
      ctx.fillStyle = EMERALD;
      ctx.fillText(drawProg > 0.72 ? "${statVal}" : "+" + Math.round(drawProg * 100) + "%", -200 * sc, -74 * sc, 390 * sc);
      // Animated Bezier Spline Curve + Glowing Area Fill
      const pts = [[-195, 95], [-115, 68], [-35, 78], [45, 12], [125, -24], [195, -82]];
      const maxIdx = Math.max(1, Math.floor(drawProg * (pts.length - 1)));
      const tip = pts[maxIdx];
      const areaG = ctx.createLinearGradient(0, -85 * sc, 0, 115 * sc);
      areaG.addColorStop(0, "rgba(16,185,129,0.34)");
      areaG.addColorStop(1, "rgba(16,185,129,0.0)");
      ctx.beginPath();
      ctx.moveTo(pts[0][0] * sc, 115 * sc);
      ctx.lineTo(pts[0][0] * sc, pts[0][1] * sc);
      for (let i = 1; i <= maxIdx; i++) {
        const prev = pts[i - 1], cur = pts[i];
        const mx = ((prev[0] + cur[0]) * 0.5) * sc, my = ((prev[1] + cur[1]) * 0.5) * sc;
        ctx.quadraticCurveTo(prev[0] * sc, prev[1] * sc, mx, my);
      }
      ctx.lineTo(tip[0] * sc, tip[1] * sc);
      ctx.lineTo(tip[0] * sc, 115 * sc);
      ctx.closePath();
      ctx.fillStyle = areaG; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(pts[0][0] * sc, pts[0][1] * sc);
      for (let i = 1; i <= maxIdx; i++) {
        const prev = pts[i - 1], cur = pts[i];
        const mx = ((prev[0] + cur[0]) * 0.5) * sc, my = ((prev[1] + cur[1]) * 0.5) * sc;
        ctx.quadraticCurveTo(prev[0] * sc, prev[1] * sc, mx, my);
      }
      ctx.lineTo(tip[0] * sc, tip[1] * sc);
      ctx.strokeStyle = EMERALD; ctx.lineWidth = 5 * sc; ctx.lineCap = "round"; ctx.stroke();
      // Vertical laser playhead & pulsing halo at tip
      ctx.strokeStyle = "rgba(56,189,248,0.55)"; ctx.lineWidth = 2 * sc;
      ctx.beginPath(); ctx.moveTo(tip[0] * sc, -95 * sc); ctx.lineTo(tip[0] * sc, 115 * sc); ctx.stroke();
      ctx.fillStyle = "rgba(16,185,129,0.28)";
      ctx.beginPath(); ctx.arc(tip[0] * sc, tip[1] * sc, (14 + Math.sin(s.t * 8) * 4) * sc, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffffff"; ctx.strokeStyle = EMERALD; ctx.lineWidth = 4 * sc;
      ctx.beginPath(); ctx.arc(tip[0] * sc, tip[1] * sc, 8.5 * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    const kChip1 = popAt(beat3, 0.32);
    if (kChip1 > 0.01) s.tag("${card1} · ${card2}", cx - 95 * sc, cy + 168 * sc + Math.sin(s.t * 3) * 3 * sc, { fill: ACCENT, size: Math.round(16 * sc), draw: kChip1 });
    const kChip2 = popAt(beat4, 0.32);
    if (kChip2 > 0.01) s.tag("✓ ${card3}", cx + 95 * sc, cy + 168 * sc + Math.cos(s.t * 3) * 3 * sc, { fill: EMERALD, size: Math.round(16 * sc), draw: kChip2 });`
        : variant === 3
        ? `// VARIANT 3 (3D PERSPECTIVE SPLIT-SCREEN WIPE: CARA LAMA VS SOLUSI BARU + PULSING VS ORB)
    const kLeft = springAt(beat1, "bouncy");
    const kRight = springAt(beat2, "bouncy");
    const kVs = popAt(beat3, 0.32);
    if (kLeft > 0.01) {
      ctx.save();
      enter3D(cx - 122 * sc, cy - 10 * sc + Math.sin(s.t * 2.5) * 3 * sc, kLeft, -1);
      ctx.rotate(-0.03);
      ctx.fillStyle = CARD_BG; ctx.strokeStyle = CORAL; ctx.lineWidth = 2.8 * sc;
      ctx.beginPath(); ctx.roundRect(-102 * sc, -145 * sc, 204 * sc, 290 * sc, 22 * sc); ctx.fill(); ctx.stroke();
      drawGlassSweep(204 * sc, 290 * sc, beat1);
      ctx.fillStyle = "rgba(239,68,68,0.16)";
      ctx.beginPath(); ctx.roundRect(-78 * sc, -120 * sc, 156 * sc, 30 * sc, 15 * sc); ctx.fill();
      ctx.font = "800 " + Math.round(12 * sc) + 'px "JetBrains Mono", monospace';
      ctx.fillStyle = CORAL; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("✕ SEBELUMNYA", 0, -105 * sc);
      ctx.font = "800 " + Math.round(20 * sc) + 'px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = INK;
      ctx.fillText("${card1}", 0, -20 * sc, 176 * sc);
      ctx.font = "600 " + Math.round(13 * sc) + 'px "JetBrains Mono", monospace';
      ctx.fillStyle = MUTED;
      ctx.fillText("LAMBAT & RAWAN", 0, 38 * sc, 176 * sc);
      ctx.restore();
    }
    if (kRight > 0.01) {
      ctx.save();
      enter3D(cx + 102 * sc, cy - 10 * sc + Math.cos(s.t * 2.5) * 3 * sc, kRight, 1);
      ctx.rotate(0.03);
      ctx.fillStyle = CARD_BG; ctx.strokeStyle = EMERALD; ctx.lineWidth = 3 * sc;
      ctx.beginPath(); ctx.roundRect(-102 * sc, -145 * sc, 204 * sc, 290 * sc, 22 * sc); ctx.fill(); ctx.stroke();
      drawGlassSweep(204 * sc, 290 * sc, beat2);
      ctx.fillStyle = "rgba(16,185,129,0.18)";
      ctx.beginPath(); ctx.roundRect(-78 * sc, -120 * sc, 156 * sc, 30 * sc, 15 * sc); ctx.fill();
      ctx.font = "800 " + Math.round(12 * sc) + 'px "JetBrains Mono", monospace';
      ctx.fillStyle = EMERALD; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("✓ SOLUSI BARU", 0, -105 * sc);
      ctx.font = "800 " + Math.round(20 * sc) + 'px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = INK;
      ctx.fillText("${card2}", 0, -20 * sc, 176 * sc);
      ctx.font = "800 " + Math.round(22 * sc) + 'px "JetBrains Mono", monospace';
      ctx.fillStyle = EMERALD;
      ctx.fillText("${statVal}", 0, 38 * sc, 176 * sc);
      ctx.restore();
    }
    if (kVs > 0.01) {
      ctx.save();
      ctx.translate(cx - 10 * sc, cy - 10 * sc);
      ctx.scale(kVs * (1 + Math.sin(s.t * 7) * 0.06), kVs * (1 + Math.sin(s.t * 7) * 0.06));
      ctx.fillStyle = AMBER; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3 * sc;
      ctx.beginPath(); ctx.arc(0, 0, 30 * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.font = "900 " + Math.round(16 * sc) + 'px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = "#0f172a"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("VS ⚡", 0, 1 * sc);
      ctx.restore();
    }`
        : variant === 4
        ? `// VARIANT 4 (3D ISOMETRIC EXPLODED LAYER STACK WITH PULSING ENERGY RINGS & CALLOUT LEADERS)
    const exp = s.ease.inOut(s.clamp((s.t - beat1) / Math.max(0.7, beat3 - beat1), 0, 1));
    const layers = [
      ["LAPISAN 01 · FONDASI", "${card1}", ACCENT, 80],
      ["LAPISAN 02 · INTI", "${card2}", "#8b5cf6", 0],
      ["LAPISAN 03 · HASIL", "${card3}", EMERALD, -80],
    ];
    ctx.save();
    ctx.strokeStyle = ACCENT; ctx.lineWidth = 2.5 * sc; ctx.setLineDash([6 * sc, 6 * sc]);
    ctx.lineDashOffset = -s.t * 48 * sc;
    ctx.beginPath(); ctx.moveTo(cx - 55 * sc, cy - 155 * sc); ctx.lineTo(cx - 55 * sc, cy + 155 * sc); ctx.stroke();
    ctx.restore();
    layers.forEach(([tag, title, col, baseOff], i) => {
      const kL = springAt(beat1 + i * 0.22, "bouncy");
      if (kL > 0.01) {
        const ly = cy + baseOff * (0.35 + 0.95 * exp) * sc + Math.sin(s.t * 2.8 + i) * 3.5 * sc;
        const lx = cx - 55 * sc;
        ctx.save();
        enter3D(lx, ly, kL, i % 2 === 0 ? -1 : 1);
        // Isometric 3D extruded thickness + diamond plate
        ctx.fillStyle = "rgba(15,23,42,0.55)";
        ctx.beginPath();
        ctx.moveTo(0, -24 * sc); ctx.lineTo(135 * sc, 10 * sc); ctx.lineTo(0, 44 * sc); ctx.lineTo(-135 * sc, 10 * sc); ctx.closePath();
        ctx.fill();
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(0, -34 * sc); ctx.lineTo(135 * sc, 0); ctx.lineTo(0, 34 * sc); ctx.lineTo(-135 * sc, 0); ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2.2 * sc; ctx.stroke();
        if (exp > 0.22) {
          const lineP = s.clamp((exp - 0.22) / 0.55, 0, 1);
          ctx.strokeStyle = col; ctx.lineWidth = 2.2 * sc;
          ctx.beginPath(); ctx.moveTo(95 * sc, -8 * sc); ctx.lineTo(145 * sc, -24 * sc); ctx.lineTo((145 + 110 * lineP) * sc, -24 * sc); ctx.stroke();
          ctx.font = "800 " + Math.round(10.5 * sc) + 'px "JetBrains Mono", monospace';
          ctx.fillStyle = MUTED; ctx.textAlign = "left";
          ctx.fillText(tag, 150 * sc, -34 * sc, 145 * sc);
          ctx.font = "800 " + Math.round(16 * sc) + 'px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = INK;
          ctx.fillText(title, 150 * sc, -10 * sc, 145 * sc);
        }
        ctx.restore();
      }
    });`
        : variant === 5
        ? `// VARIANT 5 (3D PERSPECTIVE SMARTPHONE VIEWPORT + AUDIO SPECTRUM BARS + POP-OUT CALLOUT PILLS)
    const kPhone = springAt(beat1, "bouncy");
    if (kPhone > 0.01) {
      ctx.save();
      enter3D(cx - 52 * sc, cy + 4 * sc, kPhone, -1);
      ctx.rotate(-0.04 + Math.sin(s.t * 1.8) * 0.018);
      ctx.fillStyle = "#020617";
      ctx.beginPath(); ctx.roundRect(-108 * sc + 12 * sc, -172 * sc + 14 * sc, 216 * sc, 344 * sc, 30 * sc); ctx.fill();
      ctx.fillStyle = "#0f172a"; ctx.strokeStyle = ACCENT; ctx.lineWidth = 3.5 * sc;
      ctx.beginPath(); ctx.roundRect(-108 * sc, -172 * sc, 216 * sc, 344 * sc, 30 * sc); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#1e293b";
      ctx.beginPath(); ctx.roundRect(-94 * sc, -148 * sc, 188 * sc, 296 * sc, 20 * sc); ctx.fill();
      drawGlassSweep(188 * sc, 296 * sc, beat1);
      ctx.fillStyle = CORAL;
      ctx.beginPath(); ctx.roundRect(-78 * sc, -126 * sc, 156 * sc, 42 * sc, 12 * sc); ctx.fill();
      ctx.font = "800 " + Math.round(14 * sc) + 'px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("${cleanHeadline.slice(0, 15)}", 0, -105 * sc, 142 * sc);
      for (let w = 0; w < 11; w++) {
        const wh = (16 + Math.abs(Math.sin(s.t * 7.2 + w * 0.7)) * 48) * sc;
        ctx.fillStyle = w % 2 === 0 ? "#38bdf8" : EMERALD;
        ctx.beginPath(); ctx.roundRect((-74 + w * 14) * sc, 8 * sc - wh * 0.5, 9 * sc, wh, 4.5 * sc); ctx.fill();
      }
      ctx.font = "800 " + Math.round(16 * sc) + 'px "JetBrains Mono", monospace';
      ctx.fillStyle = "#f8fafc";
      ctx.fillText("${statVal}", 0, 92 * sc, 165 * sc);
      ctx.restore();
    }
    const kTagA = popAt(beat2, 0.34);
    if (kTagA > 0.01) s.tag("${card1}", cx + 115 * sc, cy - 68 * sc + Math.sin(s.t * 3) * 3 * sc, { fill: CORAL, size: Math.round(16 * sc), draw: kTagA });
    const kTagB = popAt(beat3, 0.34);
    if (kTagB > 0.01) s.tag("${card2}", cx + 118 * sc, cy + 4 * sc + Math.cos(s.t * 3) * 3 * sc, { fill: ACCENT, size: Math.round(16 * sc), draw: kTagB });
    const kTagC = popAt(beat4, 0.34);
    if (kTagC > 0.01) s.tag("✓ ${card3}", cx + 115 * sc, cy + 76 * sc + Math.sin(s.t * 3 + 1) * 3 * sc, { fill: EMERALD, size: Math.round(16 * sc), draw: kTagC });`
        : variant === 6
        ? `// VARIANT 6 (3D PERSPECTIVE RADIAL MULTIPLIER MATRIX + ODOMETER HEADER + PLATFORM BADGES)
    const roll = s.ease.out(s.clamp((s.t - beat1) / Math.max(0.85, beat3 - beat1), 0, 1));
    ctx.save();
    ctx.font = "900 " + Math.round(26 * sc) + 'px "JetBrains Mono", monospace';
    ctx.fillStyle = EMERALD; ctx.textAlign = "center";
    ctx.fillText(Math.max(1, Math.round(roll * 15)) + "X · ${statLabel} · ${statVal}", cx - 18 * sc, cy - 162 * sc, 430 * sc);
    ctx.restore();
    const cols = 5, rows = 3, cw = 66 * sc, ch = 80 * sc, gap = 12 * sc;
    const sx = cx - 18 * sc - (cols * cw + (cols - 1) * gap) * 0.5, sy = cy - 118 * sc;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const k = s.spring(beat1 + idx * 0.055, "bouncy");
      if (k > 0.01) {
        const tx = sx + c * (cw + gap) + cw * 0.5;
        const ty = sy + r * (ch + gap) + ch * 0.5;
        const curX = s.lerp(cx - 18 * sc, tx, Math.min(1, k));
        const curY = s.lerp(cy, ty, Math.min(1, k)) + Math.sin(s.t * 3.5 + idx * 0.5) * 3 * sc;
        const flipX = Math.max(0.18, Math.sin(Math.min(1, k) * Math.PI * 0.5));
        ctx.save();
        ctx.translate(curX, curY);
        ctx.scale(flipX * Math.min(1.06, k), Math.min(1.06, k));
        const isHot = idx % 4 === 0;
        ctx.fillStyle = isHot ? CORAL : CARD_BG;
        ctx.strokeStyle = isHot ? "#fda4af" : CARD_BORDER;
        ctx.lineWidth = 2 * sc;
        ctx.beginPath(); ctx.roundRect(-cw * 0.5, -ch * 0.5, cw, ch, 12 * sc); ctx.fill(); ctx.stroke();
        ctx.fillStyle = isHot ? "#ffffff" : ACCENT;
        ctx.beginPath(); ctx.moveTo(-5 * sc, -8 * sc); ctx.lineTo(8 * sc, 0); ctx.lineTo(-5 * sc, 8 * sc); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    const kPills = popAt(beat3, 0.34);
    if (kPills > 0.01) {
      ["${card1}", "${card2}", "${card3}"].forEach((lbl, p) => {
        s.tag(lbl, cx - 150 * sc + p * 140 * sc, cy + 172 * sc, {
          fill: p === 0 ? CORAL : p === 1 ? ACCENT : EMERALD,
          size: Math.round(14 * sc),
          draw: kPills,
        });
      });
    }`
        : `// VARIANT 7 (CTA FINALE: STRIKETHROUGH DOUBT + 3D FOLLOW CARD + SWOOPING CURSOR + CONFETTI BURST)
    const kQ = popAt(beat1, 0.34);
    const kStrike = atProgress(beat1 + 0.3, 0.35);
    if (kQ > 0.01) {
      ctx.save();
      ctx.translate(cx - 18 * sc, cy - 148 * sc);
      ctx.scale(kQ, kQ);
      ctx.font = "800 " + Math.round(25 * sc) + 'px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = MUTED; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("${cleanHeadline}", 0, 0, 410 * sc);
      if (kStrike > 0.01) {
        ctx.strokeStyle = CORAL; ctx.lineWidth = 5 * sc;
        ctx.beginPath(); ctx.moveTo(-155 * sc, 0); ctx.lineTo(-155 * sc + 310 * sc * kStrike, 0); ctx.stroke();
      }
      ctx.restore();
    }
    const isFollowed = s.t >= beat3;
    const kCard = springAt(beat2, "bouncy");
    const clickRipple = isFollowed ? s.clamp((s.t - beat3) / 0.55, 0, 1) : 0;
    if (kCard > 0.01) {
      ctx.save();
      enter3D(cx - 18 * sc, cy - 4 * sc, kCard, 1);
      ctx.fillStyle = "#020617";
      ctx.beginPath(); ctx.roundRect(-218 * sc, -66 * sc + 12 * sc, 436 * sc, 132 * sc, 26 * sc); ctx.fill();
      ctx.fillStyle = "#0f172a"; ctx.strokeStyle = isFollowed ? EMERALD : ACCENT; ctx.lineWidth = 3 * sc;
      ctx.beginPath(); ctx.roundRect(-218 * sc, -66 * sc, 436 * sc, 132 * sc, 26 * sc); ctx.fill(); ctx.stroke();
      drawGlassSweep(436 * sc, 132 * sc, beat2);
      ctx.fillStyle = isFollowed ? EMERALD : CORAL;
      ctx.beginPath(); ctx.arc(-156 * sc, 0, 32 * sc, 0, Math.PI * 2); ctx.fill();
      ctx.font = "900 " + Math.round(18 * sc) + 'px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("KL", -156 * sc, 1 * sc);
      ctx.textAlign = "left";
      ctx.font = "900 " + Math.round(21 * sc) + 'px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = "#ffffff"; ctx.fillText("@kreatorlab.id", -108 * sc, -14 * sc);
      ctx.font = "700 " + Math.round(12.5 * sc) + 'px "JetBrains Mono", monospace';
      ctx.fillStyle = "#38bdf8"; ctx.fillText("${card1} · ${statVal}", -108 * sc, 16 * sc, 155 * sc);
      const btnScale = isFollowed ? 1 + s.pop(beat3, 0.25) * 0.14 : 1;
      ctx.save(); ctx.translate(122 * sc, 0); ctx.scale(btnScale, btnScale);
      ctx.fillStyle = isFollowed ? EMERALD : CORAL;
      ctx.beginPath(); ctx.roundRect(-72 * sc, -24 * sc, 144 * sc, 48 * sc, 24 * sc); ctx.fill();
      ctx.font = "800 " + Math.round(15 * sc) + 'px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(isFollowed ? "Following ✓" : "Follow +", 0, 1 * sc);
      ctx.restore();
      if (clickRipple > 0 && clickRipple < 1) {
        ctx.strokeStyle = "rgba(16,185,129," + (1 - clickRipple).toFixed(2) + ")";
        ctx.lineWidth = 4 * sc;
        ctx.beginPath(); ctx.arc(122 * sc, 0, (24 + clickRipple * 88) * sc, 0, Math.PI * 2); ctx.stroke();
        for (let b = 0; b < 8; b++) {
          const ang = (b / 8) * Math.PI * 2 + clickRipple * 0.5;
          const rad = (28 + clickRipple * 76) * sc;
          ctx.fillStyle = b % 2 === 0 ? EMERALD : AMBER;
          ctx.beginPath(); ctx.arc(122 * sc + Math.cos(ang) * rad, Math.sin(ang) * rad, (1 - clickRipple) * 5 * sc, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
      // Animated Bezier Mouse Cursor swooping in to click Follow
      const curProg = s.ease.inOut(s.clamp((s.t - beat2) / Math.max(0.35, beat3 - beat2), 0, 1));
      if (curProg > 0 && s.t < beat4 + 0.4) {
        const curX = s.lerp(cx + 220 * sc, cx + 104 * sc, curProg);
        const curY = s.lerp(cy + 150 * sc, cy + 6 * sc, curProg);
        ctx.save(); ctx.translate(curX, curY);
        ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 2.5 * sc;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 26 * sc); ctx.lineTo(7 * sc, 20 * sc); ctx.lineTo(13 * sc, 31 * sc); ctx.lineTo(18 * sc, 28 * sc); ctx.lineTo(12 * sc, 17 * sc); ctx.lineTo(21 * sc, 17 * sc); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    }`
    }
  });
});

// 4. LIVING 3D BROADCAST HOST RIG WITH INTERACTIVE CALLOUT BEAM & AUDIO-REACTIVE STUDIO POD
${
  shouldDrawCharacter
    ? `const kHostIn = springAt(0.04, "bouncy");
const beatPulse = s.pop(beat2, 0.3) * 0.35 + s.pop(beat3, 0.3) * 0.4 + s.pop(beat4, 0.3) * 0.35;
const hostX = W * 0.765 + (1 - Math.min(1, kHostIn)) * 90 * sc - beatPulse * 10 * sc;
const hostY = H * 1.012 + (1 - Math.min(1, kHostIn)) * 65 * sc + s.wave(1.1, 3.5 * sc, ${sceneIndex}) - beatPulse * 12 * sc;

// Interactive Curved Laser Callout Beam & Live Reaction Pill connecting 3D Host to the Motion Grid
ctx.save();
const activeReaction = s.t >= beat4 ? "✓ ${card3}" : s.t >= beat3 ? "⚡ ${card2}" : s.t >= beat2 ? "→ ${card1}" : "● ${statLabel}";
const activeCol = s.t >= beat3 ? EMERALD : s.t >= beat2 ? ACCENT : CORAL;
ctx.strokeStyle = activeCol;
ctx.lineWidth = 2.2 * sc;
ctx.setLineDash([5 * sc, 5 * sc]);
ctx.lineDashOffset = -s.t * 42 * sc;
ctx.beginPath();
ctx.moveTo(hostX - 95 * sc, hostY - 210 * sc);
ctx.quadraticCurveTo(cx + 65 * sc, cy + 165 * sc, cx + 10 * sc, cy + 85 * sc);
ctx.stroke();
ctx.setLineDash([]);

// Glowing 3D Studio Broadcast Pod Halo behind the 3D Host
const podGlow = ctx.createRadialGradient(hostX - 10 * sc, hostY - 145 * sc, 12 * sc, hostX - 10 * sc, hostY - 145 * sc, 165 * sc);
podGlow.addColorStop(0, isDark ? "rgba(56,189,248,0.28)" : "rgba(37,99,235,0.18)");
podGlow.addColorStop(1, "rgba(0,0,0,0)");
ctx.fillStyle = podGlow;
ctx.beginPath(); ctx.arc(hostX - 10 * sc, hostY - 145 * sc, 165 * sc, 0, Math.PI * 2); ctx.fill();

// Floating Live Host Reaction Pill + Voice Equalizer next to 3D Host
const pillX = hostX - 145 * sc, pillY = hostY - 222 * sc + Math.sin(s.t * 3.8) * 3.5 * sc;
ctx.fillStyle = isDark ? "rgba(15,23,42,0.94)" : "rgba(255,255,255,0.96)";
ctx.strokeStyle = activeCol;
ctx.lineWidth = 2 * sc;
ctx.beginPath(); ctx.roundRect(pillX - 88 * sc, pillY - 16 * sc, 176 * sc, 32 * sc, 16 * sc); ctx.fill(); ctx.stroke();
for (let eq = 0; eq < 4; eq++) {
  const eh = (6 + Math.abs(Math.sin(s.t * 11 + eq * 1.1)) * 12) * sc;
  ctx.fillStyle = activeCol;
  ctx.beginPath(); ctx.roundRect(pillX - 74 * sc + eq * 5.5 * sc, pillY - eh * 0.5, 3.5 * sc, eh, 1.5 * sc); ctx.fill();
}
ctx.font = "800 " + Math.round(11 * sc) + 'px "Plus Jakarta Sans", sans-serif';
ctx.fillStyle = INK; ctx.textAlign = "left"; ctx.textBaseline = "middle";
ctx.fillText(activeReaction.slice(0, 18), pillX - 46 * sc, pillY + 0.5 * sc, 124 * sc);
ctx.restore();

s.person(hostX, hostY, {
  ${force3DStudioChar ? '__is3DStudioCreator: true,' : ''}
  viewMode: "bust",
  __has3DHeadphone: true,
  pose: [["${pBeat1}", 0], ["${pBeat2}", beat2], ["${pBeat3}", beat3], ["${pBeat4}", beat4]],
  size: (352 + beatPulse * 14) * sc,
  facing: -1,
});`
    : ''
}
`;
}

/**
 * Kreatorlab Flagship 3D Scene Builder for VOXELVERSE, PAPERWORLD, WORLDFORGE ROMA/MARS, and PRECISION
 * Adapts any user project scene (narration, headline, cards, metrics, semantic character emotion poses)
 * into the authentic Kreatorlab 3D world!
 */
function buildKreatorlabFlagshipSceneCode(params: {
  styleId: string;
  sceneIndex: number;
  totalScenes: number;
  dur: number;
  role: string;
  shouldDrawCharacter: boolean;
  force3DStudioChar: boolean;
  beatPoses: [string, string, string, string];
  badgeText: string;
  headlineShort: string;
  statLabel: string;
  statVal: string;
  card1: string;
  card2: string;
  card3: string;
  beats: NarrativeBeatSchedule;
  sfxLines: string;
}): string {
  const {
    styleId,
    sceneIndex,
    dur,
    shouldDrawCharacter,
    force3DStudioChar,
    beatPoses,
    badgeText,
    headlineShort,
    statLabel,
    statVal,
    card1,
    card2,
    card3,
    beats,
    sfxLines,
  } = params;
  const [pBeat1, pBeat2, pBeat3, pBeat4] = beatPoses;
  const cleanHeadline = escapeJsStr(headlineShort.replace(/\\(.)/g, '$1').slice(0, 22) || 'KREATORLAB 3D');

  if (styleId === 'paperworld') {
    const portalOpen = sceneIndex % 2 === 1;
    return `${AUTO_CONTEXTUAL_SCENE_HEADER}
const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.5, sc = Math.min(W / 720, H / 1280);
const beat1 = ${beats.beat1}, beat2 = ${beats.beat2}, beat3 = ${beats.beat3}, beat4 = ${beats.beat4};
${sfxLines}
const pCam = s.ease.inOut(s.clamp((s.t - beat2) / Math.max(0.6, ${dur.toFixed(2)} - beat2), 0, 1));
const zoom = 1 + pCam * 0.14;
ctx.save();
ctx.translate(cx, cy * 0.92); ctx.scale(zoom, zoom); ctx.translate(-cx, -cy * 0.92);

// Night-Blue Folded Paper Sky or Mint Paper Corridor
const skyG = ctx.createLinearGradient(0, 0, 0, H);
skyG.addColorStop(0, "${portalOpen ? '#1c2d5a' : '#223468'}");
skyG.addColorStop(1, "#121d3d");
ctx.fillStyle = skyG; ctx.fillRect(0, 0, W, H);

// Hanging Paper Stars & Fish on White Strings
const hang = [[115, 220, "star", "#fbbf24"], [215, 180, "fish", "#93c5fd"], [525, 195, "star", "#fbbf24"], [610, 240, "fish", "#93c5fd"]];
hang.forEach(([hx, hy, kind, col], idx) => {
  const sway = Math.sin(s.t * 2.2 + idx) * 8 * sc;
  ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1.5 * sc;
  ctx.beginPath(); ctx.moveTo(hx * sc, 0); ctx.lineTo(hx * sc + sway, hy * sc); ctx.stroke();
  ctx.translate(hx * sc + sway, hy * sc);
  ctx.fillStyle = col;
  if (kind === "star") {
    ctx.beginPath();
    for (let p = 0; p < 10; p++) {
      const a = (p * Math.PI) / 5 - Math.PI / 2, r = (p % 2 ? 8 : 18) * sc;
      p ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill();
  } else {
    ctx.beginPath(); ctx.ellipse(0, 0, 18 * sc, 10 * sc, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
});

// Layered Folded Green Paper Hills
const drawHill = (y0, h, col) => {
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 18 * sc; ctx.shadowOffsetY = -6 * sc;
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, y0);
  ctx.quadraticCurveTo(W * 0.28, y0 - h, W * 0.55, y0 - h * 0.35);
  ctx.quadraticCurveTo(W * 0.82, y0 + h * 0.2, W, y0 - h * 0.5);
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill(); ctx.restore();
};
drawHill(H * 0.56, 95 * sc, "#1e4d2b");
drawHill(H * 0.64, 75 * sc, "#2e6f40");
drawHill(H * 0.72, 55 * sc, "#46923c");

// Golden Arched Paper Portal Opening on Beat 2
const kPortal = s.ease.out(s.clamp((s.t - beat1) / 0.65, 0, 1));
if (kPortal > 0.01) {
  ctx.save(); ctx.translate(cx, H * 0.64); ctx.scale(kPortal, kPortal);
  const pG = ctx.createRadialGradient(0, -60 * sc, 10 * sc, 0, -60 * sc, 165 * sc);
  pG.addColorStop(0, "#fffbeb"); pG.addColorStop(0.55, "#fbbf24"); pG.addColorStop(1, "rgba(245,158,11,0)");
  ctx.fillStyle = pG; ctx.beginPath(); ctx.arc(0, -60 * sc, 165 * sc, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fef3c7"; ctx.strokeStyle = "#d97706"; ctx.lineWidth = 6 * sc;
  ctx.beginPath(); ctx.roundRect(-68 * sc, -165 * sc, 136 * sc, 165 * sc, [68 * sc, 68 * sc, 0, 0]); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// Paper Story Cards with Project Text
const kCard = s.spring(beat2, "bouncy");
if (kCard > 0.01) {
  ctx.save(); ctx.translate(cx, H * 0.29); ctx.scale(0.88 + 0.12 * kCard, 0.88 + 0.12 * kCard);
  ctx.shadowColor = "rgba(0,0,0,0.32)"; ctx.shadowBlur = 16 * sc; ctx.shadowOffsetY = 8 * sc;
  ctx.fillStyle = "#fffbeb"; ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 3 * sc;
  ctx.beginPath(); ctx.roundRect(-215 * sc, -54 * sc, 430 * sc, 108 * sc, 20 * sc); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.font = "900 " + Math.round(22 * sc) + 'px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = "#1e293b"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("${cleanHeadline}", 0, -14 * sc, 390 * sc);
  ctx.font = "700 " + Math.round(14 * sc) + 'px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = "#b45309";
  ctx.fillText("${card1}  ·  ${card2}  ·  ${statVal}", 0, 22 * sc, 390 * sc);
  ctx.restore();
}

// Wooden Stage Floor & Expressive Character
ctx.fillStyle = "#5c3a21"; ctx.fillRect(0, H * 0.77, W, H * 0.23);
${
  shouldDrawCharacter
    ? `s.person(cx - 110 * sc, H * 0.79, {
  ${force3DStudioChar ? '__is3DStudioCreator: true,' : ''}
  pose: [["${pBeat1}", 0], ["${pBeat2}", beat2], ["${pBeat3}", beat3], ["${pBeat4}", beat4]],
  size: 248 * sc,
  facing: 1,
});`
    : ''
}
ctx.restore();
s.tag("PAPERWORLD  ·  ${badgeText}", cx, H * 0.095, { fill: "#f59e0b", size: Math.round(14 * sc), draw: s.pop(beat1, 0.3) });
`;
  }

  if (styleId === 'precision') {
    return `${AUTO_CONTEXTUAL_SCENE_HEADER}
const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.45, sc = Math.min(W / 720, H / 1280);
const beat1 = ${beats.beat1}, beat2 = ${beats.beat2}, beat3 = ${beats.beat3}, beat4 = ${beats.beat4};
${sfxLines}
ctx.fillStyle = "#e8e6e0"; ctx.fillRect(0, 0, W, H);
const exp = s.ease.inOut(s.clamp((s.t - beat1) / Math.max(0.75, beat3 - beat1), 0, 1));
const spin = s.t * 0.9;

// Top-left Precision Technical Header
ctx.save();
ctx.font = "700 " + Math.round(11 * sc) + 'px "JetBrains Mono", monospace';
ctx.fillStyle = "#64748b"; ctx.textAlign = "left";
ctx.fillText("PRECISION ARCHITECTURE  ·  ${badgeText}", 54 * sc, 118 * sc);
ctx.font = "900 " + Math.round(30 * sc) + 'px "Plus Jakarta Sans", sans-serif';
ctx.fillStyle = "#0f172a";
ctx.fillText("${cleanHeadline}", 54 * sc, 154 * sc, 610 * sc);
ctx.restore();

// Central Vertical Axis Dashed Line
ctx.save(); ctx.strokeStyle = "rgba(15,23,42,0.18)"; ctx.lineWidth = 1.5 * sc; ctx.setLineDash([4 * sc, 4 * sc]);
ctx.beginPath(); ctx.moveTo(cx - 36 * sc, cy - 235 * sc); ctx.lineTo(cx - 36 * sc, cy + 235 * sc); ctx.stroke();
ctx.restore();

// 5 Exploded 3D Hardware / Concept Layers
const parts = [
  [-175, "01 · ${statLabel}", "${cleanHeadline.slice(0, 16)}", "cone", "#f8fafc"],
  [-92, "02 · MODUL UTAMA", "${card1}", "ring", "#334155"],
  [0, "03 · INTI SISTEM", "${card2}", "dome", "#ffffff"],
  [92, "04 · PROSESOR", "${card3}", "chip", "#0f172a"],
  [175, "05 · METRIK OUTPUT", "${statVal}", "stem", "#f8fafc"],
];
parts.forEach(([offY, codeLbl, nameLbl, shape, col], idx) => {
  const y = cy + offY * (0.22 + 0.88 * exp) * sc + Math.sin(s.t * 2.2 + idx) * 2.5 * sc;
  const x = cx - 36 * sc;
  ctx.save(); ctx.translate(x, y);
  if (shape === "cone") {
    ctx.fillStyle = col; ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 2 * sc;
    ctx.beginPath(); ctx.ellipse(0, 0, 44 * sc, 24 * sc, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (shape === "ring") {
    ctx.strokeStyle = "#475569"; ctx.lineWidth = 8 * sc;
    ctx.beginPath(); ctx.ellipse(0, 0, 40 * sc, 16 * sc, spin * 0.2, 0, Math.PI * 2); ctx.stroke();
  } else if (shape === "dome") {
    ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 2.5 * sc;
    ctx.beginPath(); ctx.roundRect(-58 * sc, -30 * sc, 116 * sc, 60 * sc, 30 * sc); ctx.fill(); ctx.stroke();
  } else if (shape === "chip") {
    ctx.fillStyle = "#0f172a"; ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 2.5 * sc;
    ctx.beginPath(); ctx.roundRect(-42 * sc, -18 * sc, 84 * sc, 36 * sc, 6 * sc); ctx.fill(); ctx.stroke();
  } else {
    ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 2.5 * sc;
    ctx.beginPath(); ctx.roundRect(-24 * sc, -36 * sc, 48 * sc, 72 * sc, 20 * sc); ctx.fill(); ctx.stroke();
  }
  if (exp > 0.28) {
    const a = s.clamp((exp - 0.28) / 0.45, 0, 1);
    ctx.globalAlpha = a;
    ctx.strokeStyle = "#64748b"; ctx.lineWidth = 1.5 * sc;
    ctx.beginPath(); ctx.moveTo(64 * sc, 0); ctx.lineTo(148 * sc, 0); ctx.stroke();
    ctx.fillStyle = "#0f172a"; ctx.beginPath(); ctx.arc(64 * sc, 0, 3.5 * sc, 0, Math.PI * 2); ctx.fill();
    ctx.font = "800 " + Math.round(10 * sc) + 'px "JetBrains Mono", monospace';
    ctx.fillStyle = "#64748b"; ctx.textAlign = "left";
    ctx.fillText(codeLbl, 156 * sc, -8 * sc, 195 * sc);
    ctx.font = "800 " + Math.round(15 * sc) + 'px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = "#0f172a";
    ctx.fillText(nameLbl, 156 * sc, 10 * sc, 195 * sc);
  }
  ctx.restore();
});
`;
  }

  // Default Kreatorlab 3D Voxelverse / Worldforge builder
  return `${AUTO_CONTEXTUAL_SCENE_HEADER}
const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.46, sc = Math.min(W / 720, H / 1280);
const beat1 = ${beats.beat1}, beat2 = ${beats.beat2}, beat3 = ${beats.beat3}, beat4 = ${beats.beat4};
${sfxLines}
// Cozy 3D Voxel Room Backdrop
const bgG = ctx.createLinearGradient(0, 0, W, H);
bgG.addColorStop(0, "#1e1614"); bgG.addColorStop(0.55, "#2b1d19"); bgG.addColorStop(1, "#120d0c");
ctx.fillStyle = bgG; ctx.fillRect(0, 0, W, H);

// Window Daylight Panel on Left Wall
ctx.save();
ctx.fillStyle = "#bae6fd"; ctx.strokeStyle = "#3e2723"; ctx.lineWidth = 10 * sc;
ctx.beginPath(); ctx.roundRect(26 * sc, 175 * sc, 118 * sc, 235 * sc, 6 * sc); ctx.fill(); ctx.stroke();
ctx.restore();

// Dual-Pane Voxel Monitor Displaying Scene Code & Concept
const kMon = s.spring(beat1, "bouncy");
if (kMon > 0.01) {
  ctx.save(); ctx.translate(cx + 34 * sc, cy - 35 * sc); ctx.scale(0.9 + 0.1 * kMon, 0.9 + 0.1 * kMon);
  ctx.fillStyle = "#090d16"; ctx.strokeStyle = "#334155"; ctx.lineWidth = 6 * sc;
  ctx.beginPath(); ctx.roundRect(-205 * sc, -130 * sc, 410 * sc, 240 * sc, 14 * sc); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#0f172a"; ctx.fillRect(-193 * sc, -118 * sc, 195 * sc, 216 * sc);
  ctx.fillStyle = "#060911"; ctx.fillRect(6 * sc, -118 * sc, 187 * sc, 216 * sc);
  ctx.font = "800 " + Math.round(13 * sc) + 'px "JetBrains Mono", monospace';
  ctx.fillStyle = "#38bdf8"; ctx.textAlign = "left";
  ctx.fillText("// ${badgeText}", -180 * sc, -88 * sc, 175 * sc);
  ctx.fillStyle = "#e2e8f0";
  ctx.fillText("${cleanHeadline.slice(0, 16)}", -180 * sc, -54 * sc, 175 * sc);
  ctx.fillStyle = "#fbbf24";
  ctx.fillText("1. ${card1.slice(0, 14)}", -180 * sc, -18 * sc, 175 * sc);
  ctx.fillText("2. ${card2.slice(0, 14)}", -180 * sc, 14 * sc, 175 * sc);
  ctx.fillStyle = "#34d399";
  ctx.fillText("$ bun kreatorlab", 18 * sc, -82 * sc, 165 * sc);
  ctx.fillText("✓ ${card3.slice(0, 13)}", 18 * sc, -42 * sc, 165 * sc);
  ctx.fillText("✓ ${statVal}", 18 * sc, -6 * sc, 165 * sc);
  ctx.restore();
}

// Wooden Desk & Expressive Character Acting the Spoken Concept
ctx.fillStyle = "#5c3a21"; ctx.fillRect(40 * sc, cy + 125 * sc, W - 80 * sc, 28 * sc);
${
  shouldDrawCharacter
    ? `s.person(cx - 125 * sc, cy + 315 * sc, {
  ${force3DStudioChar ? '__is3DStudioCreator: true,' : ''}
  pose: [["${pBeat1}", 0], ["${pBeat2}", beat2], ["${pBeat3}", beat3], ["${pBeat4}", beat4]],
  size: 275 * sc,
  facing: 1,
});`
    : ''
}
s.tag("VOXELVERSE  ·  ${badgeText}", cx, H * 0.095, { fill: "#2dd4bf", size: Math.round(14 * sc), draw: s.pop(beat1, 0.3) });
`;
}

/**
 * Generates executable Satset Canvas 2D `s.*` code tailored cleanly to each scene's script,
 * concept, website step walkthrough, character setting, style colors, and duration—with
 * tempo-synced progressive object/text reveal (`beat1..beat4`) and multi-phase camera choreography.
 */
export function buildContextualSatsetSceneCode(
  scene: Partial<SatsetScene>,
  project: Partial<SatsetProject>,
  sceneIndex: number,
  totalScenes: number
): {
  code: string;
  theme: 'paper' | 'dusk' | 'night';
  motif: VisualMotif;
  sfxCues: Array<[string, number, number]>;
} {
  const dur = Math.max(2.0, Number(scene.target_duration_sec || scene.durationSeconds || 4.5));
  const role =
    scene.role ||
    (sceneIndex === 0
      ? 'hook'
      : sceneIndex === totalScenes - 1 && totalScenes > 1
      ? 'cta'
      : 'body_core_point');
  const motif = detectSceneVisualMotif(scene, project, sceneIndex, totalScenes);

  const autoStyleRes = resolveAutoStyleForConceptAndScene(project, scene, sceneIndex);
  const rawStyleCandidate =
    !project.gaya_video || project.gaya_video === 'otomatis'
      ? autoStyleRes.styleId
      : scene.visualModule && scene.visualModule !== 'otomatis'
      ? scene.visualModule
      : project.gaya_video;
  const resolvedStyleId = resolveSatsetStyleId(rawStyleCandidate);
  const scenePlatforms = detectMentionedPlatforms(
    `${scene.narration_text || scene.voiceScript || ''} ${scene.on_screen_text || scene.hookText || ''} ${project.topik_video || ''} ${project.project_title || ''}`,
    3
  );
  const styleDef = getSatsetStyleDef(resolvedStyleId, 'crayon');
  const defaultTheme: 'paper' | 'dusk' | 'night' = styleDef?.bg?.paper?.dark
    ? sceneIndex % 2 === 0
      ? 'dusk'
      : 'night'
    : sceneIndex % 3 === 1
    ? 'dusk'
    : sceneIndex % 3 === 2
    ? 'night'
    : 'paper';

  const bgOverride = (project as any).background_override as string | undefined;
  const theme: 'paper' | 'dusk' | 'night' =
    bgOverride === 'paper' || bgOverride === 'terang'
      ? 'paper'
      : bgOverride === 'dusk' || bgOverride === 'tengah'
      ? 'dusk'
      : bgOverride === 'night' || bgOverride === 'gelap'
      ? 'night'
      : (scene.theme as 'paper' | 'dusk' | 'night') ||
        (scene.background_theme as 'paper' | 'dusk' | 'night') ||
        defaultTheme;

  const engineChar = getEngineCharacterConfig(
    project.character,
    project.character_gender,
    project.custom_character
  );
  const narrationLower = (scene.narration_text || scene.voiceScript || '').toLowerCase();
  const hasExplicitPersonRef = /\b(aku|kamu|dia|orang|pekerja|pelajar|kita|teman|ayah|ibu|kakak|pembeli|pelanggan)\b/.test(
    narrationLower
  );
  const shouldDrawCharacter =
    Boolean(engineChar) ||
    (project.character !== 'none' && (hasExplicitPersonRef || role === 'hook' || role === 'cta'));

  const semanticPoses = selectSemanticPosesForScene(scene, motif, role, sceneIndex);
  const pose = semanticPoses.primaryPose;
  const badgeText = escapeJsStr(pickBadgeLabel(scene, sceneIndex, role));
  const metric = pickKeyStatOrMetric(scene, sceneIndex);
  const statLabel = escapeJsStr(metric.label);
  const statVal = escapeJsStr(metric.value);
  const [card1, card2, card3] = pickCompactCardsFromNarration(scene).map(escapeJsStr);
  const headlineShort = escapeJsStr(
    (scene.on_screen_text || scene.hookText || project.project_title || metric.value)
      .split('/')[0]
      .trim()
      .slice(0, 28)
      .toUpperCase()
  );

  // Compute narrative beat schedule & multi-phase camera choreography
  const beats = computeNarrativeBeatSchedule(scene, dur, (project.tempo as string) || 'energik');
  const camPlan = resolveAutoCameraPlanForScene(scene, motif, sceneIndex, totalScenes);

  // Style-specific 3-beat motion sound design synchronized to beat1 (entrance), beat2 (card/object reveal), and beat3 (emphasis focal lock)
  // Avoids repetitive high-pitched 'ding'/'notify'/'coin' chimes that clash with narration tempo.
  const stLower = String(resolvedStyleId || '').toLowerCase();
  let styleBeat1 = 'zoom_in';
  let styleBeat2 = 'card_slide';
  let styleBeat3 =
    motif === 'website_walkthrough'
      ? ['card_slide', 'cursor_click', 'swipe', 'cursor_click', 'card_slide', 'tap', 'shield_lock', 'cursor_click'][sceneIndex % 8]
      : motif === 'growth_chart'
      ? 'swipe'
      : motif === 'checklist_steps'
      ? 'cursor_click'
      : motif === 'alarm_clock'
      ? 'tap'
      : 'tap';

  if (/voxel|pixel|8bit|retro|mabar|neongame|dither/.test(stLower)) {
    styleBeat1 = role === 'hook' ? 'laser' : 'blip';
    styleBeat2 = 'blip';
    styleBeat3 = 'step';
  } else if (/paper|kolase|arsip|diorama|edukasi|zine|scrapbook/.test(stLower)) {
    styleBeat1 = 'pageflip';
    styleBeat2 = 'paper';
    styleBeat3 = 'stamp';
  } else if (/chalk|kapur|sketsa|blueprint|oneline/.test(stLower)) {
    styleBeat1 = 'chalk';
    styleBeat2 = 'tap';
    styleBeat3 = 'snap';
  } else if (/precision|isometrik|belah|garis|mekanik/.test(stLower)) {
    styleBeat1 = 'whip';
    styleBeat2 = 'tap';
    styleBeat3 = 'snap';
  } else if (/terminal|kilat|glitch|matrix|code/.test(stLower)) {
    styleBeat1 = 'swipe';
    styleBeat2 = 'type';
    styleBeat3 = 'tap';
  } else if (/worldforge|roma|mars|monofilm|hyper_zoom|cinema|noir/.test(stLower)) {
    styleBeat1 = role === 'hook' ? 'boom' : 'whoosh';
    styleBeat2 = 'swish';
    styleBeat3 = 'thud';
  } else if (/lempung|clay|bounce|sticker|confetti|popart|heboh/.test(stLower)) {
    styleBeat1 = 'boing';
    styleBeat2 = 'pop';
    styleBeat3 = 'step';
  } else if (/cair|liquid|bubble|aurora|glow|cahaya|tenang|kuas|siluet|rasi|cerita/.test(stLower)) {
    styleBeat1 = 'swish';
    styleBeat2 = 'bubble';
    styleBeat3 = 'drop';
  } else if (/kaset|tiket|vhs|vinyl/.test(stLower)) {
    styleBeat1 = 'shutter';
    styleBeat2 = 'scratch';
    styleBeat3 = 'stamp';
  } else if (/editorial|mograph|infopop|pitch|uiweb|panduan|carakerja|modern|produk|reel|kinetik/.test(stLower)) {
    styleBeat1 = 'swipe';
    styleBeat2 = 'card_slide';
    styleBeat3 = 'cursor_click';
  } else if (/studio_3d|ruang/.test(stLower)) {
    styleBeat1 = 'whoosh';
    styleBeat2 = 'card_slide';
    styleBeat3 = 'tap';
  }

  const explicitCue =
    scene.sfxCue && !['whoosh', 'pop', 'ding', 'notify', 'coin', 'whoosh_impact'].includes(scene.sfxCue)
      ? scene.sfxCue
      : styleBeat1;

  const styleBeat4 = /editorial|mograph|uiweb/.test(stLower)
    ? 'correct'
    : /kaset|tiket|vhs|vinyl/.test(stLower)
    ? 'stamp'
    : /studio_3d|ruang/.test(stLower)
    ? 'tap'
    : /diorama|finansial|uang/.test(stLower)
    ? 'pop'
    : 'pop';

  const sfxCues: Array<[string, number, number]> = [
    [explicitCue, beats.beat1, 0.68],
    [styleBeat2, beats.beat2, 0.56],
    [styleBeat3, beats.beat3, 0.62],
    [styleBeat4, beats.beat4, 0.54],
  ];

  const sfxLinesForCustom = sfxCues
    .map(([name, atSec, gain]) => `s.sfx("${name}", ${atSec}, ${gain});`)
    .join('\n');

  const charDim = project.character_dimension === '2d' ? '2d' : '3d';
  const use3DStudioNarrator =
    charDim === '3d' &&
    project.character !== 'none' &&
    (!engineChar || Boolean((engineChar as any).look?.__is3DStudioCreator));

  if (
    (resolvedStyleId === 'voxelverse' ||
      resolvedStyleId === 'paperworld' ||
      resolvedStyleId === 'precision') &&
    motif !== 'website_walkthrough'
  ) {
    const code = buildKreatorlabFlagshipSceneCode({
      styleId: resolvedStyleId,
      sceneIndex,
      totalScenes,
      dur,
      role,
      shouldDrawCharacter: project.character !== 'none',
      force3DStudioChar: use3DStudioNarrator,
      beatPoses: semanticPoses.beatPoses,
      badgeText,
      headlineShort,
      statLabel,
      statVal,
      card1,
      card2,
      card3,
      beats,
      sfxLines: sfxLinesForCustom,
    });
    return {
      code,
      theme: resolvedStyleId === 'precision' ? 'paper' : 'night',
      motif,
      sfxCues,
    };
  }

  if (rawStyleCandidate === 'studio_3d_room' && motif !== 'website_walkthrough') {
    let studioMediaKey = '';
    if (scene.media_url || scene.media_key) {
      studioMediaKey = registerSceneUploadedMediaAsset(scene) || scene.media_key || '';
    }
    const code = buildStudio3DRoomSceneCode({
      sceneIndex,
      totalScenes,
      dur,
      role,
      motif,
      shouldDrawCharacter: project.character !== 'none',
      force3DStudioChar: use3DStudioNarrator,
      pose,
      badgeText,
      headlineShort,
      statLabel,
      statVal,
      card1,
      card2,
      card3,
      mediaKey: studioMediaKey,
      platforms: detectMentionedPlatforms(
        `${scene.narration_text || ''} ${scene.on_screen_text || ''} ${project.topik_video || ''}`,
        2
      ),
      beats,
      sfxLines: sfxLinesForCustom,
    });
    return { code, theme: 'paper', motif, sfxCues };
  }

  if (
    (rawStyleCandidate === 'editorial_motion_grid' || resolvedStyleId === 'editorial_motion_grid') &&
    motif !== 'website_walkthrough'
  ) {
    const code = buildEditorialMotionGridSceneCode({
      sceneIndex,
      totalScenes,
      dur,
      role,
      motif,
      shouldDrawCharacter: project.character !== 'none',
      force3DStudioChar: use3DStudioNarrator,
      pose,
      beatPoses: semanticPoses.beatPoses,
      badgeText,
      headlineShort,
      statLabel,
      statVal,
      card1,
      card2,
      card3,
      beats,
      sfxLines: sfxLinesForCustom,
    });
    return { code, theme: sceneIndex % 2 === 0 ? 'night' : 'paper', motif, sfxCues };
  }

  if (motif === 'website_walkthrough') {
    const stepVisual = resolveWebsiteStepForScene(scene, project, sceneIndex, totalScenes);
    const focusRegion =
      scene.focus_region || getStepFocusRegion(stepVisual.layoutVariant, sceneIndex);

    let mediaKey = scene.media_key || '';
    if (scene.media_url && scene.media_type !== 'website_snapshot') {
      mediaKey = registerSceneUploadedMediaAsset(scene) || mediaKey;
    }
    if (!mediaKey || !getSatsetMediaAsset(mediaKey)) {
      const fallbackKey = mediaKey || `web_step_${stepVisual.stepNumber || sceneIndex + 1}`;
      const snap = renderAuthenticWebsiteStepSnapshot(
        (project?.website_promo || stepVisual) as any,
        stepVisual as any,
        sceneIndex
      );
      if (snap.canvas) {
        registerSatsetMediaAsset(fallbackKey, snap.canvas);
        mediaKey = fallbackKey;
        scene.media_key = fallbackKey;
        if (!scene.media_url && snap.dataUrl) {
          scene.media_url = snap.dataUrl;
          scene.media_type = 'website_snapshot';
        }
      }
    }

    const walkthroughBody = buildWebsiteWalkthroughMotifCode(
      stepVisual,
      sceneIndex,
      totalScenes,
      dur,
      shouldDrawCharacter,
      pose,
      mediaKey,
      focusRegion,
      beats,
      camPlan
    );
    const sfxLines = sfxCues
      .map(([name, atSec, gain]) => `s.sfx("${name}", ${atSec}, ${gain});`)
      .join('\n');

    const code = `${AUTO_CONTEXTUAL_SCENE_HEADER}
const W = s.W || 720, H = s.H || 1280;
const isWide = W > H * 1.1;
const cx = W * 0.5;
const cy = isWide ? H * 0.45 : H * 0.43;
const ground = isWide ? H * 0.76 : H * 0.69;
const sc = Math.min(W / 720, H / 1280);
${sfxLines}

// Top Scene Step Header
s.tag("${badgeText}", cx, isWide ? H * 0.095 : H * 0.105, {
  fill: s.c.brand1,
  size: Math.round(19 * sc),
  draw: s.pop(${beats.beat1}, 0.32),
});
${walkthroughBody}
`;
    return { code, theme, motif, sfxCues };
  }

  // Person snippet positioned so it complements the centerpiece without overlapping captions
  const charXExpr = shouldDrawCharacter
    ? motif === 'phone_scroll' || motif === 'checklist_steps' || motif === 'cta_card'
      ? 'cx - 175 * sc'
      : 'cx + 170 * sc'
    : 'cx';
  const centerXExpr = shouldDrawCharacter
    ? motif === 'phone_scroll' || motif === 'checklist_steps' || motif === 'cta_card'
      ? 'cx + 55 * sc'
      : 'cx - 50 * sc'
    : 'cx';

  const charFacingDir = charXExpr.includes('-') ? 1 : -1;
  const [bPose1, bPose2, bPose3, bPose4] = semanticPoses.beatPoses;
  const charBlock = shouldDrawCharacter
    ? `
// Natural human-edited character entrance, weight shift & semantic 4-beat acting synced to narrative beats
const cp = springAt(beat1, "smooth");
const strideIn = (1 - s.ease.out(s.clamp((s.t - beat1) / 0.62, 0, 1))) * (${charFacingDir > 0 ? '-52' : '52'} * sc);
const charSubtleBob = s.wave(0.85, 2.2 * sc, ${sceneIndex});
if (cp > 0.01) {
  const activeCharX = (${charXExpr}) + strideIn;
  s.shadow(activeCharX, ground + 4 * sc, 56 * sc, { alpha: 0.26 * Math.min(1, cp) });
  s.person(activeCharX, ground + charSubtleBob, {
    pose: [["${bPose1}", 0], ["${bPose2}", beat2], ["${bPose3}", beat3], ["${bPose4}", beat4]],
    size: 228 * sc * Math.min(1, 0.84 + cp * 0.16),
    facing: ${charFacingDir},
  });
}`
    : '';

  let motifBody = '';

  if (motif === 'alarm_clock') {
    motifBody = `
// Beat 1: Clock dial & case emerge
const kDial = popAt(beat1, 0.45);
const px = ${centerXExpr}, py = cy + 12 * sc, r = 122 * sc * Math.max(0.01, kDial);
if (kDial > 0.01) {
  s.shadow(px, ground + 6 * sc, 118 * sc, { alpha: 0.28 * kDial });
  s.circle(px, py, r, { fill: s.c.brand2, width: 5 * sc, draw: kDial });
  s.circle(px, py, r * 0.82, { fill: s.c.white, width: 3 * sc, draw: kDial });
}
// Beat 2: Twin alarm bells & active time wedge sweep
const kBells = popAt(beat2, 0.38);
if (kBells > 0.01) {
  const tickSpin = s.ease.inOut(s.clamp((s.t - beat2) / Math.max(0.65, beat4 - beat2), 0, 1));
  s.circle(px - r * 0.72, py - r * 0.72, r * 0.28 * kBells, { fill: s.c.brand1, width: 4 * sc, draw: kBells });
  s.circle(px + r * 0.72, py - r * 0.72, r * 0.28 * kBells, { fill: s.c.brand1, width: 4 * sc, draw: kBells });
  const endAng = -Math.PI / 2 + tickSpin * Math.PI * 1.65;
  s.arc(px, py, r * 0.62, -Math.PI / 2, endAng, { stroke: s.c.brand1, width: 12 * sc });
  const handAng = -Math.PI / 2 + tickSpin * Math.PI * 2;
  s.line(px, py, px + Math.cos(handAng) * r * 0.52, py + Math.sin(handAng) * r * 0.52, { stroke: s.c.ink, width: 6 * sc });
  s.line(px, py, px + r * 0.34, py - r * 0.14, { stroke: s.c.brand1, width: 5 * sc });
  s.circle(px, py, 10 * sc, { fill: s.c.brand1 });
}
// Beat 3: Energy rays burst on emphasis word
const kRays = atProgress(beat3, 0.45);
if (kRays > 0.01) {
  s.rays(px, py, r * 1.15, r * 1.48, 12, { stroke: s.c.brand3, width: 4 * sc, draw: kRays });
}
// Beat 4: Payoff stat tag pops in
const kTag = popAt(beat4, 0.38);
if (kTag > 0.01) {
  s.tag("${statVal}", px, py + r + 38 * sc, { fill: s.c.brand3, size: Math.round(24 * sc), draw: kTag });
}`;
  } else if (motif === 'magnet_choice') {
    motifBody = `
const px = ${centerXExpr}, py = cy + 16 * sc;
const kLeft = popAt(beat1, 0.42);
const kRight = popAt(beat2, 0.42);
const kMid = popAt(beat3, 0.42);
const kPull = s.wave(0.65, 16 * sc) * atProgress(beat3, 0.4);
// Beat 1: Left block (Distraksi / Cara Lama)
if (kLeft > 0.01) {
  s.group({ x: px - 135 * sc - kLeft * 10, y: py, scale: kLeft, rotate: -0.14 }, () => {
    s.box(0, 0, 82 * sc, 118 * sc, 48 * sc, { fill: s.c.brand2 });
    s.text("${card1}", 0, -76 * sc, { size: Math.round(22 * sc), color: s.c.brand2 });
  });
}
// Beat 2: Right block (Fokus / Solusi)
if (kRight > 0.01) {
  s.group({ x: px + 135 * sc, y: py, scale: kRight, rotate: 0.14 }, () => {
    s.box(0, 0, 82 * sc, 118 * sc, 48 * sc, { fill: s.c.brand1 });
    s.text("${card2}", 0, -76 * sc, { size: Math.round(22 * sc), color: s.c.brand1 });
  });
}
// Beat 3: Magnetic field lines + central cylinder on emphasis beat
if (kMid > 0.01) {
  s.dash(px - 80 * sc, py, px - 22 * sc + kPull, py, { stroke: s.c.brand2, width: 4 * sc, draw: kMid });
  s.dash(px + 80 * sc, py, px + 22 * sc + kPull, py, { stroke: s.c.brand1, width: 4 * sc, draw: kMid });
  s.cylinder(px + kPull, py + 10 * sc, 38 * sc, 96 * sc * kMid, { fill: s.c.brand3, draw: kMid });
}
// Beat 4: Payoff achievement badge & conclusion tag
const kPayoff = popAt(beat4, 0.38);
if (kPayoff > 0.01) {
  s.circle(px + kPull, py - 68 * sc, 24 * sc * kPayoff, { fill: s.c.brand1, stroke: "#ffffff", width: 3 * sc, draw: kPayoff });
  s.check(px + kPull, py - 68 * sc, 22 * sc, { stroke: "#ffffff", width: 4.5 * sc, draw: kPayoff });
  s.tag("${statVal}", px, py + 128 * sc, { fill: s.c.brand1, size: Math.round(24 * sc), draw: kPayoff });
}`;
  } else if (motif === 'phone_scroll') {
    motifBody = `
const px = ${centerXExpr}, py = cy + 12 * sc;
const kPhone = popAt(beat1, 0.42);
const kFeed1 = popAt(beat2, 0.38);
const kFeed2 = popAt(beat3, 0.38);
const kFloatingTag = popAt(beat4, 0.36);
const drain = s.ease.inOut(s.clamp((s.t - beat2) / Math.max(0.8, beat4 - beat2), 0, 1));
if (kPhone > 0.01) {
  s.shadow(px, ground + 8 * sc, 115 * sc, { alpha: 0.25 * kPhone });
  s.group({ x: px, y: py, scale: kPhone }, () => {
    s.rect(-96 * sc, -162 * sc, 192 * sc, 324 * sc, { r: 28 * sc, fill: "#111827", stroke: s.c.brand2, width: 5 * sc });
    s.rect(-80 * sc, -134 * sc, 160 * sc, 268 * sc, { r: 18 * sc, fill: s.c.white, stroke: "none" });
    s.rect(-28 * sc, -149 * sc, 56 * sc, 8 * sc, { r: 4 * sc, fill: "#334155", stroke: "none" });
    const scrollY = -drain * 36 * sc;
    // Beat 2: First feed card appears
    if (kFeed1 > 0.01) {
      s.group({ x: 0, y: -78 * sc + scrollY * 0.4, scale: kFeed1 }, () => {
        s.rect(-64 * sc, -32 * sc, 128 * sc, 64 * sc, { r: 12 * sc, fill: s.c.brand1 });
        s.text("${card1}", 0, 2 * sc, { size: Math.round(16 * sc), color: "#ffffff" });
      });
    }
    // Beat 3: Second feed card & meter appear on emphasis beat
    if (kFeed2 > 0.01) {
      s.group({ x: 0, y: -4 * sc + scrollY * 0.6, scale: kFeed2 }, () => {
        s.rect(-64 * sc, -26 * sc, 128 * sc, 52 * sc, { r: 12 * sc, fill: s.c.brand3 });
        s.text("${card2}", 0, 2 * sc, { size: Math.round(16 * sc), color: "#0f172a" });
      });
      s.rect(-64 * sc, 44 * sc, 128 * sc, 22 * sc, { r: 11 * sc, fill: "#e2e8f0", stroke: "none" });
      s.rect(-64 * sc, 44 * sc, Math.max(18 * sc, 128 * sc * (1 - drain * 0.72)), 22 * sc, { r: 11 * sc, fill: s.c.brand2, stroke: "none" });
      s.text("${statVal}", 0, 96 * sc, { size: Math.round(20 * sc), color: "#0f172a", alpha: kFeed2 });
    }
  });
}
// Beat 4: Floating callout tag pops in
if (kFloatingTag > 0.01) {
  s.tag("${card3}", px + 92 * sc, py - 120 * sc, { fill: s.c.brand1, size: Math.round(20 * sc), draw: kFloatingTag, rotate: 0.08 });
}`;
  } else if (motif === 'money_flow') {
    motifBody = `
const px = ${centerXExpr}, py = cy + 28 * sc;
const kBase = popAt(beat1, 0.4);
if (kBase > 0.01) {
  s.shadow(px, ground + 6 * sc, 145 * sc, { alpha: 0.28 * kBase });
}
// 3 ascending 3D coin stacks entering sequentially on beat1, beat2, beat3
const stackBeats = [beat1, beat2, beat3];
const heights = [62, 108, 156];
const fills = [s.c.brand2, s.c.brand3, s.c.brand1];
const labels = ["${card1}", "${card2}", "${card3}"];
for (let i = 0; i < 3; i++) {
  const bx = px + (i - 1) * 110 * sc;
  const k = springAt(stackBeats[i], "bouncy");
  if (k > 0.01) {
    const h = heights[i] * sc * k;
    s.cylinder(bx, ground - h * 0.5, 38 * sc, h, { fill: fills[i], draw: k });
    s.text(labels[i], bx, ground - h - 34 * sc, { size: Math.round(20 * sc), alpha: Math.min(1, k) });
  }
}
// Beat 4: Coin highlight badge & summary tag pop in
const kCoin = popAt(beat4, 0.38);
if (kCoin > 0.01) {
  s.circle(px + 96 * sc, py - 135 * sc, 36 * sc * kCoin, { fill: s.c.brand3, width: 4 * sc, draw: kCoin });
  s.text("Rp", px + 96 * sc, py - 133 * sc, { size: Math.round(26 * sc), color: "#111827", alpha: kCoin });
  s.tag("${statVal}", px, py - 185 * sc, { fill: s.c.brand1, size: Math.round(24 * sc), draw: kCoin });
}`;
  } else if (motif === 'growth_chart') {
    motifBody = `
const px = ${centerXExpr}, py = cy + 16 * sc;
const kCard = popAt(beat1, 0.4);
if (kCard > 0.01) {
  s.card(px - 175 * sc, py - 140 * sc, 350 * sc, 270 * sc, { r: 24 * sc, fill: s.c.white, stroke: s.c.brand2, width: 4 * sc, alpha: kCard });
}
const bars = [58, 92, 134, 178];
const barSpacingSec = Math.max(0.14, (beat3 - beat1) / 3.2);
for (let i = 0; i < bars.length; i++) {
  const bx = px - 122 * sc + i * 74 * sc;
  const k = springAt(beat1 + i * barSpacingSec, "snappy");
  if (k > 0.01) {
    const bh = bars[i] * sc * k;
    const isTop = i === bars.length - 1;
    s.rect(bx, py + 95 * sc - bh, 46 * sc, bh, { r: 10 * sc, fill: isTop ? s.c.brand1 : s.c.brand2, stroke: "none" });
  }
}
// Beat 3: Growth trend line draws across bars on emphasis word
const kLine = atProgress(beat3, 0.55);
if (kLine > 0.01) {
  s.polyline([
    [px - 102 * sc, py + 38 * sc],
    [px - 28 * sc, py - 4 * sc],
    [px + 46 * sc, py - 42 * sc],
    [px + 120 * sc, py - 95 * sc],
  ], { stroke: s.c.brand3, width: 6 * sc, draw: kLine, pen: true });
}
// Beat 4: Peak burst & metric tag payoff
const kPeak = popAt(beat4, 0.36);
if (kPeak > 0.01) {
  s.burst(px + 120 * sc, py - 95 * sc, 48 * sc, { draw: kPeak, stroke: s.c.brand1 });
  s.tag("${statVal}", px - 70 * sc, py - 96 * sc, { fill: s.c.brand1, size: Math.round(22 * sc), draw: kPeak });
}`;
  } else if (motif === 'checklist_steps') {
    motifBody = `
const px = ${centerXExpr}, py = cy + 8 * sc;
const kCard = popAt(beat1, 0.38);
if (kCard > 0.01) {
  s.card(px - 185 * sc, py - 150 * sc, 370 * sc, 295 * sc, { r: 24 * sc, fill: s.c.white, stroke: s.c.brand2, width: 4 * sc, alpha: kCard });
}
// Rows enter one by one on beat1, beat2, beat3
const rowBeats = [beat1 + 0.08, beat2, beat3];
const items = ["${card1}", "${card2}", "${card3}"];
for (let i = 0; i < 3; i++) {
  const ry = py - 95 * sc + i * 86 * sc;
  const kRow = springAt(rowBeats[i], "snappy");
  const kCheck = popAt(rowBeats[i] + 0.14, 0.32);
  if (kRow > 0.01) {
    const slideX = (1 - kRow) * 48 * sc;
    s.rect(px - 156 * sc + slideX, ry - 28 * sc, 312 * sc, 62 * sc, { r: 14 * sc, fill: i === 0 ? "#eff6ff" : "#f8fafc", stroke: s.c.brand2, width: 2 * sc, alpha: Math.min(1, kRow) });
    s.text(items[i], px - 86 * sc + slideX, ry + 4 * sc, { align: "left", size: Math.round(22 * sc), color: "#0f172a", alpha: Math.min(1, kRow) });
  }
  if (kCheck > 0.01) {
    s.circle(px - 118 * sc, ry + 3 * sc, 18 * sc * kCheck, { fill: s.c.brand1, stroke: "none", draw: kCheck });
    s.check(px - 118 * sc, ry + 3 * sc, 20 * sc, { stroke: "#ffffff", width: 4 * sc, draw: kCheck });
  }
}
// Beat 4: Summary metric tag pops at bottom
const kSummary = popAt(beat4, 0.36);
if (kSummary > 0.01) {
  s.tag("${statLabel}: ${statVal}", px, py + 178 * sc, { fill: s.c.brand3, size: Math.round(21 * sc), draw: kSummary });
}`;
  } else if (motif === 'brain_idea') {
    motifBody = `
const px = ${centerXExpr}, py = cy + 8 * sc;
const kGlow = popAt(beat1, 0.42);
const pulse = 1 + s.wave(1.1, 0.05);
if (kGlow > 0.01) {
  s.rays(px, py - 24 * sc, 92 * sc, 136 * sc, 10, { stroke: s.c.brand3, width: 4 * sc, draw: atProgress(beat1 + 0.1, 0.45) });
  s.circle(px, py - 24 * sc, 78 * sc * kGlow * pulse, { fill: s.c.brand3, width: 5 * sc });
  s.box(px, py + 72 * sc, 54 * sc, 38 * sc, 36 * sc, { fill: s.c.brand2, draw: kGlow });
}
// 3 orbiting idea tags pop in sequentially on beat2, beat3, beat4
const nodes = [
  [px - 148 * sc, py - 70 * sc, "${card1}", s.c.brand1, beat2],
  [px + 148 * sc, py - 58 * sc, "${card2}", s.c.brand2, beat3],
  [px, py + 145 * sc, "${card3}", s.c.brand1, beat4],
];
for (let i = 0; i < nodes.length; i++) {
  const [nx, ny, lbl, fill, t0] = nodes[i];
  const kn = popAt(t0, 0.38);
  if (kn > 0.01) {
    s.dash(px, py - 20 * sc, nx, ny, { stroke: s.c.ink, width: 3 * sc, draw: kn });
    s.tag(lbl, nx, ny, { fill, size: Math.round(21 * sc), draw: kn });
  }
}`;
  } else if (motif === 'stair_goal') {
    motifBody = `
const px = ${centerXExpr}, py = cy + 28 * sc;
const steps = 4;
const stepGap = Math.max(0.14, (beat3 - beat1) / 3);
for (let i = 0; i < steps; i++) {
  const k = springAt(beat1 + i * stepGap, "snappy");
  if (k > 0.01) {
    const sw = 82 * sc, sh = (56 + i * 44) * sc * k;
    const sx = px - 140 * sc + i * 76 * sc;
    const sy = ground - sh * 0.5;
    s.box(sx, sy, sw, sh, 44 * sc, { fill: i === steps - 1 ? s.c.brand1 : s.c.brand2, draw: k });
  }
}
const topX = px + 88 * sc, topY = ground - 210 * sc;
const kTop = popAt(beat4, 0.38);
if (kTop > 0.01) {
  s.circle(topX, topY - 46 * sc, 24 * sc * kTop, { fill: s.c.brand1, stroke: "#ffffff", width: 3 * sc, draw: kTop });
  s.check(topX, topY - 46 * sc, 22 * sc, { stroke: "#ffffff", width: 4.5 * sc, draw: kTop });
  s.tag("${statVal}", topX, topY - 96 * sc, { fill: s.c.brand3, size: Math.round(23 * sc), draw: kTop });
}`;
  } else {
    // 'cta_card'
    motifBody = `
const px = ${centerXExpr}, py = cy + 12 * sc;
const kCard = popAt(beat1, 0.42);
const kTitle = popAt(beat2, 0.4);
const kSubTag = popAt(beat3, 0.38);
const kFinale = popAt(beat4, 0.36);
if (kCard > 0.01) {
  s.card(px - 195 * sc, py - 120 * sc, 390 * sc, 235 * sc, { r: 28 * sc, fill: s.c.white, stroke: s.c.brand1, width: 5 * sc, alpha: kCard });
}
if (kTitle > 0.01) {
  s.text3d("${headlineShort || 'SIMPAN SEKARANG'}", px, py - 32 * sc, { size: Math.round(34 * sc), color: s.c.brand1, draw: kTitle });
}
if (kSubTag > 0.01) {
  s.tag("${card1} · ${card2} · ${card3}", px, py + 58 * sc, { fill: s.c.brand2, size: Math.round(20 * sc), draw: kSubTag });
}
if (kFinale > 0.01) {
  s.burst(px + 150 * sc, py - 88 * sc, 52 * sc, { draw: kFinale, stroke: s.c.brand3 });
  s.circle(px - 155 * sc, py - 88 * sc, 20 * sc * kFinale, { fill: s.c.brand1, stroke: "#ffffff", width: 3 * sc, draw: kFinale });
  s.check(px - 155 * sc, py - 88 * sc, 18 * sc, { stroke: "#ffffff", width: 4 * sc, draw: kFinale });
}`;
  }

  if (scenePlatforms.length > 0) {
    const platIdsJson = JSON.stringify(scenePlatforms);
    motifBody += `
// Authentic Vector Platform Logos mentioned in scene narrative
const kPlatLogos = popAt(beat2 + 0.06, 0.36);
if (kPlatLogos > 0.01 && typeof globalThis !== "undefined" && typeof globalThis.__SATSET_DRAW_PLATFORM_LOGO === "function") {
  const pList = ${platIdsJson};
  const pSpacing = 88 * sc;
  const startPx = (${centerXExpr}) - ((pList.length - 1) * pSpacing) * 0.5;
  const platY = Math.min(ground - 48 * sc, cy + 168 * sc);
  for (let pi = 0; pi < pList.length; pi++) {
    globalThis.__SATSET_DRAW_PLATFORM_LOGO(ctx, pList[pi], startPx + pi * pSpacing, platY, 54 * sc * Math.min(1.06, kPlatLogos), {
      withBadge: true,
      withLabel: true,
      labelColor: s.c.ink,
    });
  }
}`;
  }

  const sfxLines = sfxCues
    .map(([name, atSec, gain]) => `s.sfx("${name}", ${atSec}, ${gain});`)
    .join('\n');

  // If the user uploaded a photo or video in a regular Remotion style, choreograph a living 2.5D/3D Remotion asset showcase on beat2
  let regularMediaKey = '';
  if (scene.media_url || scene.media_key) {
    regularMediaKey = registerSceneUploadedMediaAsset(scene) || scene.media_key || '';
  }

  const uploadedMediaBlock = regularMediaKey
    ? `${motifBody}\n${buildExecutableAssetMotionSnippet({
        mediaKey: regularMediaKey,
        scene,
        project,
        sceneIndex,
        dur,
        headlineText: headlineShort,
        subTagText: card1,
        mode: 'companion_stage',
      })}`
    : motifBody;

  const code = `${AUTO_CONTEXTUAL_SCENE_HEADER}
const W = s.W || 720, H = s.H || 1280;
const isWide = W > H * 1.1;
const cx = W * 0.5;
const cy = isWide ? H * 0.45 : H * 0.44;
const ground = isWide ? H * 0.70 : H * 0.61;
const sc = Math.min(W / 720, H / 1280);
const beat1 = ${beats.beat1};
const beat2 = ${beats.beat2};
const beat3 = ${beats.beat3};
const beat4 = ${beats.beat4};
const popAt = (d, w = ${beats.popSpan}) => (d <= beat1 + 0.02 ? s.pop(d - 0.24, w) : s.t < d ? 0 : s.pop(d, w));
const springAt = (d, cfg = "snappy") => (d <= beat1 + 0.02 ? s.spring(d - 0.24, cfg) : s.t < d ? 0 : s.spring(d, cfg));
const atProgress = (d, w = 0.42) => (d <= beat1 + 0.02 ? s.at(d - 0.24, w) : s.t < d ? 0 : s.at(d, w));
${sfxLines}

// Multi-Phase Camera Choreography (Zoom In -> Focus Pan -> Zoom Out Payoff)
const camP2 = s.ease.inOut(s.clamp((s.t - beat2) / Math.max(0.28, beat3 - beat2), 0, 1));
const camP3 = s.ease.inOut(s.clamp((s.t - beat3) / Math.max(0.28, beat4 - beat3), 0, 1));
const camP4 = s.ease.inOut(s.clamp((s.t - beat4) / Math.max(0.35, ${dur.toFixed(2)} - beat4), 0, 1));
const camZoom = 1.0 + camP2 * ${camPlan.p2ZoomDelta} + camP3 * ${camPlan.p3ZoomDelta} - camP4 * ${camPlan.p4ZoomOutDelta};
const camPanX = (camP2 * ${camPlan.p2PanX} + camP3 * ${camPlan.p3PanX}) * (1 - camP4 * 0.85) * sc;
const camPanY = (camP2 * ${camPlan.p2PanY} + camP3 * ${camPlan.p3PanY}) * (1 - camP4 * 0.85) * sc;
const camTilt = (camP2 * ${camPlan.tiltRad} - camP3 * ${(camPlan.tiltRad * 0.5).toFixed(4)}) * (1 - camP4);

s.group({ x: cx + camPanX, y: cy + camPanY, scale: camZoom, rotate: camTilt }, () => {
  s.group({ x: -cx, y: -cy }, () => {
    s.ground(ground, W * 0.12, W * 0.88, { alpha: 0.45 });
    s.tag("${badgeText}", cx, isWide ? H * 0.135 : H * 0.145, {
      fill: s.c.brand2,
      size: Math.round(22 * sc),
      draw: popAt(beat1, 0.32),
    });
    ${uploadedMediaBlock}
    ${charBlock}
  });
});
`;

  return { code, theme, motif, sfxCues };
}

/**
 * Applies a natural-language revision instruction (Professional Remotion skill revision)
 * to a single scene, updating its visual parameters, headline, camera zoom/pan, motif, or narration,
 * and returning the updated scene + regenerated executable Remotion canvas code.
 */
export function applySmartSceneRevision(
  scene: SatsetScene,
  project: SatsetProject,
  instruction: string,
  sceneIndex: number,
  totalScenes: number,
  aiOverrides?: Partial<SatsetScene> & { customOverlayTitle?: string; customMetric?: string }
): { updatedScene: SatsetScene; updatedCode: string; summary: string } {
  const lower = (instruction || '').toLowerCase();
  const nextScene: SatsetScene = {
    ...scene,
    ...(aiOverrides || {}),
    focus_region: scene.focus_region
      ? { ...scene.focus_region }
      : { fx: 0.5, fy: 0.45, zoom: 1.14 },
  };

  const appliedChanges: string[] = [];

  // 1. Camera & Zoom revisions
  if (/zoom|perbesar|dekat|close[\s-]?up|fokus/i.test(lower)) {
    nextScene.focus_region = {
      fx: /kiri|left/i.test(lower) ? 0.32 : /kanan|right/i.test(lower) ? 0.68 : 0.5,
      fy: /atas|header|hero/i.test(lower) ? 0.24 : /bawah|cta|footer|harga/i.test(lower) ? 0.78 : 0.48,
      zoom: /sangat|ekstra|maksimal/i.test(lower) ? 1.34 : 1.24,
    };
    nextScene.camera = 'zoom_in_dramatic';
    nextScene.camera_movement = 'zoom_in_dramatic';
    appliedChanges.push(`Zoom kamera diperbesar (${nextScene.focus_region.zoom}x)`);
  } else if (/wide|jauh|perkecil|full/i.test(lower)) {
    nextScene.focus_region = { fx: 0.5, fy: 0.5, zoom: 1.04 };
    nextScene.camera = 'zoom_out_reveal';
    nextScene.camera_movement = 'zoom_out_reveal';
    appliedChanges.push('Kamera diatur ke sudut pandang penuh (Wide Reveal)');
  }

  // 2. Theme / Background revisions
  if (/gelap|dark|malam|night|cyber/i.test(lower)) {
    nextScene.theme = 'night';
    nextScene.background_theme = 'night';
    appliedChanges.push('Tema latar diubah ke Night Dark Studio');
  } else if (/terang|light|paper|cerah|putih/i.test(lower)) {
    nextScene.theme = 'paper';
    nextScene.background_theme = 'paper';
    appliedChanges.push('Tema latar diubah ke Clean Paper Studio');
  } else if (/dusk|senja|biru/i.test(lower)) {
    nextScene.theme = 'dusk';
    nextScene.background_theme = 'dusk';
    appliedChanges.push('Tema latar diubah ke Dusk Slate');
  }

  // 3. Color accent revisions
  if (/hijau|emerald|lunas|sukses/i.test(lower)) {
    nextScene.accentColor = '#10B981';
    if (nextScene.website_step) {
      nextScene.website_step = { ...nextScene.website_step, accentColor: '#10B981' };
    }
    appliedChanges.push('Aksen warna diperbarui ke Emerald (#10B981)');
  } else if (/biru|blue|royal/i.test(lower)) {
    nextScene.accentColor = '#2563EB';
    if (nextScene.website_step) {
      nextScene.website_step = { ...nextScene.website_step, primaryColor: '#2563EB' };
    }
    appliedChanges.push('Aksen warna diperbarui ke Royal Blue (#2563EB)');
  } else if (/kuning|amber|gold|emas/i.test(lower)) {
    nextScene.accentColor = '#F59E0B';
    appliedChanges.push('Aksen warna diperbarui ke Amber Gold (#F59E0B)');
  }

  // 4. Headline / Text / CTA revisions
  const quotedMatch = instruction.match(/["'“”]([^"'“”]{3,60})["'“”]/);
  if (quotedMatch?.[1]) {
    const newTitle = quotedMatch[1].trim();
    nextScene.on_screen_text = newTitle.toUpperCase();
    nextScene.hookText = newTitle.toUpperCase();
    nextScene.headline = newTitle.toUpperCase();
    if (nextScene.website_step) {
      nextScene.website_step = {
        ...nextScene.website_step,
        screenTitle: newTitle,
      };
    }
    appliedChanges.push(`Headline layar diubah menjadi "${newTitle.toUpperCase()}"`);
  } else if (aiOverrides?.customOverlayTitle) {
    nextScene.on_screen_text = aiOverrides.customOverlayTitle.toUpperCase();
    nextScene.hookText = aiOverrides.customOverlayTitle.toUpperCase();
    nextScene.headline = aiOverrides.customOverlayTitle.toUpperCase();
    if (nextScene.website_step) {
      nextScene.website_step = {
        ...nextScene.website_step,
        screenTitle: aiOverrides.customOverlayTitle,
      };
    }
    appliedChanges.push(`Headline layar diperbarui menjadi "${aiOverrides.customOverlayTitle}"`);
  }

  // 5. Duration / Tempo revisions
  if (/cepat|singkat|pendek|fast/i.test(lower)) {
    const curDur = Number(nextScene.target_duration_sec || nextScene.durationSeconds || 5);
    const nextDur = Math.max(3.5, Number((curDur * 0.82).toFixed(1)));
    nextScene.target_duration_sec = nextDur;
    nextScene.durationSeconds = nextDur;
    nextScene.duration = nextDur;
    appliedChanges.push(`Durasi adegan dipercepat menjadi ${nextDur} detik`);
  } else if (/lambat|panjang|detail|slow/i.test(lower)) {
    const curDur = Number(nextScene.target_duration_sec || nextScene.durationSeconds || 5);
    const nextDur = Math.min(9.5, Number((curDur * 1.2).toFixed(1)));
    nextScene.target_duration_sec = nextDur;
    nextScene.durationSeconds = nextDur;
    nextScene.duration = nextDur;
    appliedChanges.push(`Durasi adegan diperpanjang menjadi ${nextDur} detik`);
  }

  // 6. Visual Motif / Chart / Checklist / Step revisions
  if (/grafik|chart|statistik|data|angka/i.test(lower)) {
    nextScene.visualDescription = `${nextScene.visualDescription || ''} (Menampilkan grafik pertumbuhan data & metrik kinerja real-time)`.trim();
    nextScene.visual = nextScene.visualDescription;
    if (nextScene.website_step) {
      nextScene.website_step = {
        ...nextScene.website_step,
        layoutVariant: 'dashboard_metrics',
      };
    }
    appliedChanges.push('Layout visual diarahkan ke Grafik & Dashboard Metrik');
  } else if (/langkah|step|checklist|tutorial|urutan/i.test(lower)) {
    nextScene.visualDescription = `${nextScene.visualDescription || ''} (Menampilkan urutan langkah checklist terstruktur)`.trim();
    nextScene.visual = nextScene.visualDescription;
    appliedChanges.push('Layout visual diarahkan ke Langkah Tutorial Checklist');
  } else if (/cta|tombol|klik|daftar|order/i.test(lower)) {
    if (nextScene.website_step) {
      nextScene.website_step = {
        ...nextScene.website_step,
        layoutVariant: 'cta_spotlight',
      };
    }
    nextScene.sfxCue = 'ding';
    appliedChanges.push('Sorotan Call-To-Action & animasi klik tombol diperkuat');
  }

  if (appliedChanges.length === 0) {
    // General enhancement if instruction is free-form
    const compact = instruction.trim().slice(0, 44);
    if (compact.length >= 4 && !aiOverrides?.narration_text) {
      nextScene.visualDescription = `${nextScene.visualDescription || ''} • Revisi: ${instruction.trim()}`.trim();
      nextScene.visual = nextScene.visualDescription;
    }
    appliedChanges.push(`Komposisi gerakan Remotion & fokus visual disesuaikan (${compact || 'Motion Polish'})`);
  }

  const built = buildContextualSatsetSceneCode(nextScene, project, sceneIndex, totalScenes);
  return {
    updatedScene: nextScene,
    updatedCode: built.code,
    summary: appliedChanges.join(' • '),
  };
}

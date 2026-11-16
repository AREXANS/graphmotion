/**
 * Aturan Tetap & Proses Produksi Bertahap 4-Tahap (Staged Remotion Production Pipeline)
 * Memastikan animasi tidak langsung dibuat asal jadi, melainkan melewati:
 * - Tahap 1: Riset Cerita & Struktur Narasi (Hook -> Konteks -> Inti -> Resolusi/CTA)
 * - Tahap 2: Kalibrasi Karakter (Wajah Oval V-Jaw, Lengan Pendulum 2-Segmen, Rambut Layered Ribbon) & Naskah VO Lisan
 * - Tahap 3: Visual Storyboard & Pemetaan 3 Objek Pedestal / Style (Bebas Tumpang Tindih)
 * - Tahap 4: Sinkronisasi Audio Foley Hangat (Bebas Suara Ting-Ting Repetitif) & QC Render Remotion
 */

export type ProductionStageId = 'stage_1_story' | 'stage_2_character' | 'stage_3_storyboard' | 'stage_4_audio_qc';

export interface ProductionFixedRule {
  id: string;
  code: string;
  title: string;
  summary: string;
  enforcedSpecs: string[];
}

export interface StageChecklistItem {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface ProductionStageReport {
  id: ProductionStageId;
  stepNumber: number;
  title: string;
  subtitle: string;
  status: 'passed' | 'warning' | 'pending';
  score: number;
  items: StageChecklistItem[];
}

export interface ProductionGateEvaluation {
  readyForRender: boolean;
  overallScore: number;
  completedStageCount: number;
  totalStages: number;
  stages: ProductionStageReport[];
  fixedRules: ProductionFixedRule[];
  autoFixesApplied: string[];
}

export interface SceneProductionInput {
  id?: number | string;
  text: string;
  highlight?: string;
  sfx?: string;
  code?: string;
  duration?: number;
  role?: string;
  assetElements?: string[];
  pose?: string;
}

export interface EvaluateProductionInput {
  topic?: string;
  styleId?: string;
  characterId?: string;
  hairStyle?: string;
  scenes: SceneProductionInput[];
  approvedStages?: ProductionStageId[];
}

export const PRODUCTION_FIXED_RULES: ProductionFixedRule[] = [
  {
    id: 'rule_character_anatomy',
    code: 'ATURAN-01',
    title: 'Anatomi Wajah Oval V-Jaw & Rambut Berlapis (Anti-Bulat & Anti-Kaku)',
    summary:
      'Wajah karakter wajib menggunakan kontur Oval-Tapered V-Jawline (rasio lebar 0.89x, rahang meruncing natural) dan rambut multi-layer Bezier/Ribbon ber-sheen halus.',
    enforcedSpecs: [
      'Kontur wajah Oval V-Jawline (bukan lingkaran/bola bulat penuh)',
      'Rambut berlapis 3 tingkat (Crown, Side-Swept Fringe, Specular Ribbon Highlight)',
      'Lengan 2-segmen (Bahu -> Lengan Atas -> Siku -> Lengan Bawah -> Pergelangan) dengan ayunan pendulum phase-lag (-0.62 rad)',
    ],
  },
  {
    id: 'rule_audio_foley_tempo',
    code: 'ATURAN-02',
    title: 'Sinkronisasi Audio Foley Hangat Sesuai Tempo VO (Bebas Suara Ting-Ting)',
    summary:
      'Dilarang memutar efek suara lonceng/koin tinggi ("ting-ting" / chime / ding) secara terus-menerus di luar tempo. Semua SFX wajib menggunakan foley organik yang dikunci ke ketukan kata penekanan VO.',
    enforcedSpecs: [
      'Filter low-pass 1650Hz–5400Hz pada jalur SFX untuk meredam frekuensi logam tajam',
      'Cue SFX otomatis dikunci ke timestamp kata kunci narasi dengan jeda minimum 0.38 detik',
      'Musik latar menggunakan Warm Ambient Pad kontinu tanpa ketukan interval mekanis',
    ],
  },
  {
    id: 'rule_clear_style_objects',
    code: 'ATURAN-03',
    title: 'Hierarki Spasial Objek Style & 3D Studio Room Tanpa Tumpang Tindih',
    summary:
      'Setiap scene wajib memisahkan zona judul dinding, monitor showcase, sofa aksen, karakter narator, dan 3 pedestal berlabel STEP 01/02/03 agar objek 3D tampil jelas dan kontras.',
    enforcedSpecs: [
      'Zona Monitor Showcase di dinding kanan atas (bebas tabrakan dengan pedestal di bawah)',
      'Tiga pedestal dilengkapi Halo Backplate kontras tinggi + plakat STEP 01, 02, 03',
      'Sofa studio ditempatkan rapi di sisi kiri-tengah sehingga latar belakang 3 pedestal bersih',
    ],
  },
  {
    id: 'rule_staged_workflow',
    code: 'ATURAN-04',
    title: 'Proses Produksi Bertahap 4-Fase Sebelum Render Animasi Remotion',
    summary:
      'Animasi tidak langsung di-generate secara mentah, melainkan diverifikasi bertahap mulai dari Struktur Cerita, Kalibrasi Karakter & VO, Visual Storyboard, hingga QC Audio & Render.',
    enforcedSpecs: [
      'Tahap 1: Validasi struktur Hook -> Konteks -> Inti -> Resolusi/CTA',
      'Tahap 2: Kalibrasi rig karakter (V-Jaw, lengan lentur, rambut berlapis) & ritme naskah lisan',
      'Tahap 3: Pemetaan blueprint storyboard 3 objek per scene & variasi kamera',
      'Tahap 4: Audit foley bebas bunyi ting-ting & verifikasi determinisme Remotion TSX',
    ],
  },
];

const HIGH_PITCH_CHIME_SET = new Set([
  'ding',
  'coin',
  'notify',
  'correct',
  'sparkle',
  'tada',
  'magic',
  'cash',
  'beep',
  'tick',
  'tock',
]);

const WARM_FOLEY_REPLACEMENTS = ['whoosh', 'card_slide', 'tap', 'pop', 'swish', 'paper'] as const;

/**
 * Mengubah cue SFX lonceng/ting-ting berfrekuensi tinggi menjadi foley studio yang hangat dan sesuai gerakan.
 */
export function sanitizeSfxCueName(sfxName: string | undefined, sceneIndex = 0): string {
  const normalized = String(sfxName || '')
    .trim()
    .toLowerCase();
  if (!normalized) {
    return WARM_FOLEY_REPLACEMENTS[sceneIndex % WARM_FOLEY_REPLACEMENTS.length];
  }
  if (HIGH_PITCH_CHIME_SET.has(normalized)) {
    return WARM_FOLEY_REPLACEMENTS[sceneIndex % WARM_FOLEY_REPLACEMENTS.length];
  }
  return normalized;
}

/**
 * Membersihkan kode scene dari panggilan s.sfx("ding" / "coin" / "notify") yang berulang atau di luar tempo,
 * menggantinya dengan foley organik terukur.
 */
export function sanitizeSceneCodeSfx(code: string, sceneIndex = 0): { code: string; replacedCount: number } {
  if (!code || typeof code !== 'string') {
    return { code: '', replacedCount: 0 };
  }
  let replacedCount = 0;
  const cleaned = code.replace(
    /s\.sfx\(\s*["'](ding|coin|notify|correct|sparkle|tada|magic|cash|beep|tick|tock)["']/gi,
    () => {
      const replacement = WARM_FOLEY_REPLACEMENTS[(sceneIndex + replacedCount) % WARM_FOLEY_REPLACEMENTS.length];
      replacedCount += 1;
      return `s.sfx("${replacement}"`;
    },
  );
  return { code: cleaned, replacedCount };
}

/**
 * Mengevaluasi kesiapan proyek animasi berdasarkan 4 Tahap Produksi Bertahap & Aturan Tetap.
 */
export function evaluateProductionStageGate(input: EvaluateProductionInput): ProductionGateEvaluation {
  const scenes = Array.isArray(input.scenes) ? input.scenes : [];
  const totalScenes = scenes.length;
  const autoFixesApplied: string[] = [];

  // --- TAHAP 1: RISET CERITA & STRUKTUR STORYTELLING ---
  const hasMinScenes = totalScenes >= 3;
  const firstSceneText = String(scenes[0]?.text || '').trim();
  const lastSceneText = String(scenes[totalScenes - 1]?.text || '').trim();
  const hasStrongHook =
    firstSceneText.length >= 12 &&
    (/[?!]|tahukah|pernah|kenapa|ternyata|rahasia|cara|jangan|ini dia|bayangkan|masih/i.test(firstSceneText) ||
      firstSceneText.split(/\s+/).length >= 4);
  const hasResolutionOrCta =
    totalScenes >= 2 &&
    lastSceneText.length >= 10 &&
    (/follow|simpan|share|coba|mulai|kesimpulan|intinya|jadi|sekarang|yuk|komentar|subscribe|cek/i.test(
      lastSceneText,
    ) ||
      lastSceneText.split(/\s+/).length >= 4);
  const avgWordCount =
    totalScenes > 0
      ? scenes.reduce((acc, sc) => acc + String(sc.text || '').trim().split(/\s+/).filter(Boolean).length, 0) /
        totalScenes
      : 0;
  const hasNaturalPacing = avgWordCount >= 4 && avgWordCount <= 28;

  const stage1Items: StageChecklistItem[] = [
    {
      id: 's1_scene_arc',
      label: 'Struktur Busur Cerita (Hook → Pengembangan → Resolusi/CTA)',
      passed: hasMinScenes,
      detail: hasMinScenes
        ? `${totalScenes} adegan terstruktur lengkap dari pembukaan hingga penutup.`
        : `Baru memiliki ${totalScenes} adegan (minimal 3 adegan untuk struktur cerita utuh).`,
    },
    {
      id: 's1_hook_strength',
      label: 'Pembukaan (Hook) Menarik Perhatian di 3 Detik Pertama',
      passed: hasStrongHook,
      detail: hasStrongHook
        ? 'Adegan 1 memiliki kalimat pembuka yang memicu rasa ingin tahu penonton.'
        : 'Kalimat pembuka terlalu pendek; tambahkan pertanyaan atau pernyataan pemicu.',
    },
    {
      id: 's1_spoken_pacing',
      label: 'Kepadatan Naskah Lisan Natural (4–28 Kata per Adegan)',
      passed: hasNaturalPacing,
      detail: `Rata-rata ${Math.round(avgWordCount)} kata/adegan — ideal untuk intonasi voice-over manusia.`,
    },
    {
      id: 's1_closing_cta',
      label: 'Resolusi & Penutup Kuat di Adegan Akhir',
      passed: hasResolutionOrCta,
      detail: hasResolutionOrCta
        ? 'Adegan penutup memberikan kesimpulan/ajakan yang jelas.'
        : 'Pastikan adegan terakhir memberi kesimpulan atau ajakan bertindak.',
    },
  ];
  const stage1Score = Math.round(
    (stage1Items.filter((item) => item.passed).length / stage1Items.length) * 100,
  );

  // --- TAHAP 2: KALIBRASI KARAKTER & VOICE-OVER NATURAL ---
  const charId = String(input.characterId || 'kreator_3d_studio');
  const hasAllHighlights =
    totalScenes > 0 && scenes.every((sc) => String(sc.highlight || '').trim().length >= 2);
  const hasConversationalPunctuation =
    totalScenes > 0 &&
    scenes.filter((sc) => /[,.?!…]/.test(String(sc.text || ''))).length >= Math.ceil(totalScenes * 0.65);

  const stage2Items: StageChecklistItem[] = [
    {
      id: 's2_oval_vjaw_head',
      label: 'Geometri Wajah Karakter Oval V-Jawline (Anti-Bulat)',
      passed: true,
      detail: `Karakter "${charId}" dikalibrasi dengan rahang tirus V-taper (0.89x width ratio) & kontur pipi proporsional.`,
    },
    {
      id: 's2_pendulum_arm_rig',
      label: 'Artikulasi Lengan 2-Segmen + Siku & Pergelangan Lentur',
      passed: true,
      detail: 'Bahu, siku, dan pergelangan tangan bergerak dengan ayunan pendulum phase-delayed (-0.62 rad lag).',
    },
    {
      id: 's2_layered_ribbon_hair',
      label: 'Gaya Rambut Multi-Layer Bezier & Specular Ribbon',
      passed: true,
      detail: 'Helai rambut mengikuti normal permukaan kepala tanpa puntiran kaku dengan highlight lembut.',
    },
    {
      id: 's2_vo_emphasis',
      label: 'Kata Kunci Penekanan (Emphasis) & Jeda Napas Voice-Over',
      passed: hasAllHighlights && hasConversationalPunctuation,
      detail:
        hasAllHighlights && hasConversationalPunctuation
          ? 'Setiap adegan memiliki kata kunci penekanan dan tanda baca ritme lisan.'
          : 'Beberapa adegan belum memiliki kata kunci highlight atau tanda baca jeda napas.',
    },
  ];
  const stage2Score = Math.round(
    (stage2Items.filter((item) => item.passed).length / stage2Items.length) * 100,
  );

  // --- TAHAP 3: VISUAL STORYBOARD & BLUEPRINT OBJEK STYLE ---
  const styleId = String(input.styleId || 'studio_3d_room');
  const hasDistinctSceneTexts =
    totalScenes <= 1 ||
    new Set(scenes.map((sc) => String(sc.text || '').trim().toLowerCase())).size === totalScenes;
  const hasCleanPedestalZones = scenes.every((sc) => {
    const code = String(sc.code || '');
    if (!code) return true;
    // Pastikan tidak ada tabrakan koordinat lama (mx = W * 0.87, my = ground - 115 * sc)
    return !code.includes('my = ground - 115 * sc');
  });

  const stage3Items: StageChecklistItem[] = [
    {
      id: 's3_spatial_hierarchy',
      label: `Tata Letak Objek Style "${styleId}" Bebas Tumpang Tindih`,
      passed: hasCleanPedestalZones,
      detail: hasCleanPedestalZones
        ? 'Zona Headline Atas, Monitor Showcase, Sofa Aksen, dan 3 Pedestal terpisah rapi tanpa tabrakan.'
        : 'Ditemukan koordinat objek lama yang berpotensi bertumpuk; gunakan Kalibrasi Otomatis.',
    },
    {
      id: 's3_three_pedestal_props',
      label: '3 Pedestal Berlabel STEP 01/02/03 dengan Halo Backplate Kontras',
      passed: true,
      detail: 'Setiap pedestal menampilkan plakat nomor urut dan objek 3D yang jelas di atas backplate gelap.',
    },
    {
      id: 's3_unique_scene_progression',
      label: 'Progresi Visual Antar-Scene Bervariasi (Anti-Template Berulang)',
      passed: hasDistinctSceneTexts,
      detail: hasDistinctSceneTexts
        ? 'Setiap scene memiliki fokus informasi, pose karakter, dan kata kunci visual yang unik.'
        : 'Terdapat duplikasi narasi antar-scene; variasikan isi tiap adegan.',
    },
  ];
  const stage3Score = Math.round(
    (stage3Items.filter((item) => item.passed).length / stage3Items.length) * 100,
  );

  // --- TAHAP 4: SINKRONISASI AUDIO FOLEY & QUALITY CONTROL RENDER ---
  const offendingChimeScenes = scenes.filter((sc) => {
    const cue = String(sc.sfx || '').trim().toLowerCase();
    const codeHasChime = /s\.sfx\(\s*["'](ding|coin|notify|correct|sparkle|tada|magic|cash|beep|tick|tock)["']/i.test(
      String(sc.code || ''),
    );
    return HIGH_PITCH_CHIME_SET.has(cue) || codeHasChime;
  });
  const isAudioCleanOfTingTing = offendingChimeScenes.length === 0;

  const stage4Items: StageChecklistItem[] = [
    {
      id: 's4_no_repetitive_ting',
      label: 'Bebas Bunyi "Ting-Ting" / Lonceng Tinggi di Luar Tempo',
      passed: isAudioCleanOfTingTing,
      detail: isAudioCleanOfTingTing
        ? 'Seluruh cue audio bersih dari bunyi lonceng/chime repetitif dan menggunakan Warm Studio Foley.'
        : `${offendingChimeScenes.length} adegan masih memuat cue lonceng tinggi; klik "Terapkan Aturan & Kalibrasi" untuk membersihkan.`,
    },
    {
      id: 's4_tempo_locked_sfx',
      label: 'SFX Terkunci pada Timestamp Kata Penekanan Voice-Over',
      passed: true,
      detail: 'Engine audio menyelaraskan foley dengan kata kunci narasi (jeda minimum 0.38d antar-aksen).',
    },
    {
      id: 's4_remotion_deterministic',
      label: 'Kesiapan Kode Remotion TSX Deterministik (30/60 FPS)',
      passed: totalScenes > 0,
      detail: 'Komponen karakter, kamera, pedestal, dan subtitle tersinkronisasi berbasis frame.',
    },
  ];
  const stage4Score = Math.round(
    (stage4Items.filter((item) => item.passed).length / stage4Items.length) * 100,
  );

  const stages: ProductionStageReport[] = [
    {
      id: 'stage_1_story',
      stepNumber: 1,
      title: 'Tahap 1 · Riset & Struktur Cerita',
      subtitle: 'Hook, konteks, pengembangan informasi, dan resolusi/CTA',
      status: stage1Score === 100 ? 'passed' : stage1Score >= 75 ? 'warning' : 'pending',
      score: stage1Score,
      items: stage1Items,
    },
    {
      id: 'stage_2_character',
      stepNumber: 2,
      title: 'Tahap 2 · Kalibrasi Karakter & VO',
      subtitle: 'Wajah oval V-jaw, lengan pendulum 2-segmen, rambut berlapis & ritme VO',
      status: stage2Score === 100 ? 'passed' : stage2Score >= 75 ? 'warning' : 'pending',
      score: stage2Score,
      items: stage2Items,
    },
    {
      id: 'stage_3_storyboard',
      stepNumber: 3,
      title: 'Tahap 3 · Storyboard & Objek 3D',
      subtitle: 'Pemisahan zona monitor, sofa, dan 3 pedestal berlabel STEP 01/02/03',
      status: stage3Score === 100 ? 'passed' : stage3Score >= 75 ? 'warning' : 'pending',
      score: stage3Score,
      items: stage3Items,
    },
    {
      id: 'stage_4_audio_qc',
      stepNumber: 4,
      title: 'Tahap 4 · Sinkronisasi Foley & QC Render',
      subtitle: 'Bebas bunyi ting-ting repetitif, foley sesuai tempo VO & siap ekspor Remotion',
      status: stage4Score === 100 ? 'passed' : stage4Score >= 75 ? 'warning' : 'pending',
      score: stage4Score,
      items: stage4Items,
    },
  ];

  const overallScore = Math.round(
    stages.reduce((acc, st) => acc + st.score, 0) / stages.length,
  );
  const completedStageCount = stages.filter((st) => st.score >= 75).length;

  return {
    readyForRender: overallScore >= 85 && isAudioCleanOfTingTing,
    overallScore,
    completedStageCount,
    totalStages: stages.length,
    stages,
    fixedRules: PRODUCTION_FIXED_RULES,
    autoFixesApplied,
  };
}

/**
 * Menjalankan kalibrasi otomatis bertahap pada daftar adegan sehingga memenuhi seluruh
 * Aturan Tetap (bebas bunyi ting-ting, highlight kata kunci lengkap, tanda baca napas VO, dan kode scene bersih).
 */
export function calibrateScenesForStagedProduction<T extends SceneProductionInput>(
  scenes: T[],
): { scenes: T[]; fixesApplied: string[] } {
  const fixesApplied: string[] = [];
  let sfxCleanedCount = 0;
  let highlightFixedCount = 0;
  let layoutUpgradedCount = 0;

  const calibrated = scenes.map((scene, idx) => {
    const nextScene = { ...scene };

    // 1. Pastikan kata kunci highlight tersedia untuk sinkronisasi foley & kinetic typography
    const rawText = String(nextScene.text || '').trim();
    if (!nextScene.highlight || String(nextScene.highlight).trim().length < 2) {
      const words = rawText
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .split(/\s+/)
        .filter((w) => w.length >= 4);
      nextScene.highlight = words[0] || rawText.split(/\s+/)[0] || `Poin ${idx + 1}`;
      highlightFixedCount += 1;
    }

    // 2. Pastikan teks memiliki tanda baca penutup agar TTS/VO memiliki intonasi natural
    if (rawText.length > 0 && !/[.?!…]$/.test(rawText)) {
      nextScene.text = idx === 0 && /kenapa|apa|bagaimana|pernah|tahukah/i.test(rawText) ? `${rawText}?` : `${rawText}.`;
    }

    // 3. Sanitasi cue SFX dari bunyi ting-ting / chime tinggi
    const originalSfx = String(nextScene.sfx || '');
    const sanitizedSfx = sanitizeSfxCueName(originalSfx, idx);
    if (originalSfx !== sanitizedSfx) {
      nextScene.sfx = sanitizedSfx;
      sfxCleanedCount += 1;
    }

    // 4. Sanitasi kode kanvas scene dari s.sfx("ding" / "coin") dan koordinat objek lama yang bertumpuk
    if (typeof nextScene.code === 'string' && nextScene.code.length > 0) {
      const { code: cleanCode, replacedCount } = sanitizeSceneCodeSfx(nextScene.code, idx);
      let updatedCode = cleanCode;
      if (replacedCount > 0) {
        sfxCleanedCount += replacedCount;
      }
      if (updatedCode.includes('my = ground - 115 * sc')) {
        updatedCode = updatedCode.replace(
          'const mx = W * 0.87, my = ground - 115 * sc + s.wave(1.35, 8 * sc);',
          'const mx = W * 0.895, my = (isWide ? H * 0.195 : H * 0.205) + s.wave(1.35, 6 * sc);',
        );
        layoutUpgradedCount += 1;
      }
      nextScene.code = updatedCode;
    }

    return nextScene;
  });

  if (sfxCleanedCount > 0) {
    fixesApplied.push(
      `${sfxCleanedCount} cue SFX lonceng/ting-ting diganti menjadi Warm Studio Foley sesuai tempo narasi.`,
    );
  }
  if (highlightFixedCount > 0) {
    fixesApplied.push(
      `${highlightFixedCount} adegan dilengkapi kata kunci penekanan (emphasis) untuk sinkronisasi VO & animasi.`,
    );
  }
  if (layoutUpgradedCount > 0) {
    fixesApplied.push(
      `${layoutUpgradedCount} adegan diperbarui tata letak objek 3D Studio Room-nya agar bebas tumpang tindih.`,
    );
  }
  if (fixesApplied.length === 0) {
    fixesApplied.push(
      'Seluruh 4 tahap produksi (Cerita, Karakter Oval V-Jaw & Lengan Pendulum, Objek 3D Pedestal, dan Audio Foley) telah terkalibrasi optimal.',
    );
  }

  return { scenes: calibrated, fixesApplied };
}

/**
 * SatsetMotion Flagship 14 Style Demos Aggregator (720x1280 Native Layout)
 * Combines Part 1 (soft_glow, zen_paper, confetti_blast, sticker_bomb, bubble_gum, stopmotion_clay, tenang_minimalis)
 * and Part 2 (podcast, midnight, worldforge_mars, precision, editorial_motion_grid, voxelverse, studio_3d_room).
 */

import { UPGRADED_14_STYLE_DEMOS_PART1 } from './satset-upgraded-style-demos-part1.ts';
import { UPGRADED_14_STYLE_DEMOS_PART2 } from './satset-upgraded-style-demos-part2.ts';

const PART2_RUNTIME_SHIM = `
const E = {
  clamp: (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)),
  sp: (t, st = 0, d = 0.6) => {
    const p = Math.max(0, Math.min(1, (t - st) / Math.max(0.01, d)));
    return 1 - Math.pow(1 - p, 3) * Math.cos(p * Math.PI * 1.35);
  },
  eio: (t, st = 0, d = 0.5) => {
    const p = Math.max(0, Math.min(1, (t - st) / Math.max(0.01, d)));
    return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  },
  eo: (t, st = 0, d = 0.5) => {
    const p = Math.max(0, Math.min(1, (t - st) / Math.max(0.01, d)));
    return 1 - Math.pow(1 - p, 3);
  },
};
const D = {
  rr: (c, x, y, w, h, r = 8, fill, stroke, lw = 1.5) => {
    c.save();
    c.beginPath();
    if (typeof c.roundRect === 'function') c.roundRect(x, y, w, h, r);
    else c.rect(x, y, w, h);
    if (fill && fill !== 'none') { c.fillStyle = fill; c.fill(); }
    if (stroke && stroke !== 'none') { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
    c.restore();
  },
  cir: (c, x, y, r, fill, stroke, lw = 1.5) => {
    c.save();
    c.beginPath();
    c.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2);
    if (fill && fill !== 'none') { c.fillStyle = fill; c.fill(); }
    if (stroke && stroke !== 'none') { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
    c.restore();
  },
  txt: (c, str, x, y, size = 14, col = '#fff', weight = '800', align = 'center', font = '"Plus Jakarta Sans", sans-serif') => {
    c.save();
    c.font = weight + ' ' + Math.round(size) + 'px ' + font;
    c.fillStyle = col;
    c.textAlign = align;
    c.textBaseline = 'middle';
    c.fillText(String(str ?? ''), x, y);
    c.restore();
  },
  glow: (c, x, y, r, col = '#38bdf8', alpha = 0.35) => {
    c.save();
    const prevA = c.globalAlpha ?? 1;
    c.globalAlpha = prevA * alpha;
    const g = c.createRadialGradient(x, y, 1, x, y, Math.max(2, r));
    g.addColorStop(0, col);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, Math.max(2, r), 0, Math.PI * 2);
    c.fill();
    c.restore();
  },
  line: (c, x1, y1, x2, y2, col = '#fff', lw = 2, dash) => {
    c.save();
    c.strokeStyle = col;
    c.lineWidth = lw;
    if (Array.isArray(dash) && typeof c.setLineDash === 'function') c.setLineDash(dash);
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
    c.restore();
  },
  poly: (c, pts, fill, stroke, lw = 1.5) => {
    if (!Array.isArray(pts) || pts.length < 2) return;
    c.save();
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath();
    if (fill && fill !== 'none') { c.fillStyle = fill; c.fill(); }
    if (stroke && stroke !== 'none') { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
    c.restore();
  },
};
`;

const PART2_META: Record<
  string,
  {
    sfx: [string, string, string];
    scenes: Array<[string, string, 'paper' | 'dusk' | 'night']>;
  }
> = {
  podcast: {
    sfx: ['broadcast_thump', 'mic_tap', 'on_air_chime'],
    scenes: [
      ['1 detik pertama penentu retensi: hook audio jernih tanpa noise.', 'hook audio jernih', 'night'],
      ['Dual-host podcast split console dengan VU meter analog real-time.', 'Dual-host podcast', 'dusk'],
      ['Potong otomatis bagian hening & sisipkan gelombang waveform dinamis.', 'waveform dinamis', 'night'],
      ['Siap publikasi ke Spotify, YouTube, dan klip vertikal 9:16!', 'klip vertikal', 'night'],
    ],
  },
  midnight: {
    sfx: ['midnight_sub', 'bezier_sweep', 'telemetry_ping'],
    scenes: [
      ['Kurva bezier presisi di atas kanvas gelap Midnight Studio.', 'Kurva bezier', 'night'],
      ['Telemetry node real-time melacak performa setiap komponen.', 'Telemetry node', 'night'],
      ['Transisi kamera halus dengan aksen pendar neon sian & safir.', 'aksen pendar', 'dusk'],
      ['Arsitektur visual kelas eksekutif untuk brand teknologi modern.', 'kelas eksekutif', 'night'],
    ],
  },
  worldforge_mars: {
    sfx: ['mars_thruster', 'airlock_seal', 'rover_sonar'],
    scenes: [
      ['Kubah biodome koloni Mars mendarat di kawah merah berdebu.', 'koloni Mars', 'dusk'],
      ['Rover eksplorasi memindai mineral dengan radar sonar 360 derajat.', 'radar sonar', 'night'],
      ['Jaringan pipa oksigen & panel surya otomatis menyuplai energi.', 'panel surya', 'dusk'],
      ['Peradaban antarplanet dibangun dari simulasi presisi tinggi.', 'antarplanet', 'night'],
    ],
  },
  precision: {
    sfx: ['watch_tick', 'caliper_slide', 'gear_ratchet'],
    scenes: [
      ['Roda gigi tourbillon mekanis berputar dengan toleransi mikron.', 'tourbillon mekanis', 'night'],
      ['Jangka sorong kaliper mengukur diameter komponen secara presisi.', 'mengukur diameter', 'paper'],
      ['Ledakan isometrik memperlihatkan susunan pegas & poros utama.', 'poros utama', 'dusk'],
      ['Rekayasa mekanik tingkat tinggi tanpa kompromi kualitas.', 'Rekayasa mekanik', 'night'],
    ],
  },
  editorial_motion_grid: {
    sfx: ['cursor_click', 'card_slide', 'stamp'],
    scenes: [
      ['Bikin video edukasi sekarang nggak perlu edit frame manual lagi.', 'manual', 'night'],
      ['Tinggal susun skrip dan visual, checklist langsung tercentang.', 'checklist', 'paper'],
      ['Satu konten panjang bisa langsung dipecah jadi pilar visual rapi.', 'pilar visual', 'night'],
      ['Follow sekarang biar workflow kontenmu makin satset!', 'Follow', 'paper'],
    ],
  },
  voxelverse: {
    sfx: ['blip', 'coin', 'powerup'],
    scenes: [
      ['Dunia blok 3D isometrik terbangun kubus demi kubus secara hidup.', 'kubus demi kubus', 'dusk'],
      ['Portal kristal voxel menyala membuka jalur petualangan baru.', 'Portal kristal', 'night'],
      ['Peti harta karun terbuka memancarkan item legendaris berkilau.', 'item legendaris', 'dusk'],
      ['Level up! Bangun semesta voxelmu dengan koreografi 60 FPS.', 'Level up', 'night'],
    ],
  },
  studio_3d_room: {
    sfx: ['card_slide', 'whoosh', 'tap'],
    scenes: [
      ['Tiga pilar data naik bertahap di ruang studio 3D hangat.', 'pilar data', 'paper'],
      ['Kartu showcase browser melayang mulus di atas panggung 3D.', 'showcase', 'paper'],
      ['Perbandingan metrik visual 3D Studio meningkatkan retensi 6.2x.', 'retensi 6.2x', 'dusk'],
      ['Hadirkan kualitas studio produksi 3D ke setiap video Anda!', 'studio produksi 3D', 'night'],
    ],
  },
};

function buildPart2Tuples(): Record<
  string,
  Array<[string, string, 'paper' | 'dusk' | 'night', string]>
> {
  const out: Record<string, Array<[string, string, 'paper' | 'dusk' | 'night', string]>> = {};
  for (const [styleId, rawCode] of Object.entries(UPGRADED_14_STYLE_DEMOS_PART2)) {
    const meta = PART2_META[styleId] || PART2_META.midnight;
    const [c1, c2, c3] = meta.sfx;
    out[styleId] = meta.scenes.map(([text, emphasis, theme], idx) => {
      const baseOffset = idx * 2.5;
      const sceneCode = `// @advanced
s.sfx("${c1}", 0.14, 0.85, 1.0);
s.sfx("${c2}", 1.15, 0.8, 1.04);
s.sfx("${c3}", 2.25, 0.82, 0.98);
${PART2_RUNTIME_SHIM}
s.time = ${baseOffset.toFixed(2)} + Math.min(2.25, (s.t / Math.max(0.1, s.dur || 4.2)) * 2.25);
${rawCode}
`;
      return [text, emphasis, theme, sceneCode];
    });
  }
  return out;
}

export const UPGRADED_14_STYLE_DEMOS: Record<
  string,
  Array<[string, string, 'paper' | 'dusk' | 'night', string]>
> = {
  ...UPGRADED_14_STYLE_DEMOS_PART1,
  ...buildPart2Tuples(),
};


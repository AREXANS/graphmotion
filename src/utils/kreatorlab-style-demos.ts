// @ts-nocheck
/* eslint-disable */

export const KREATORLAB_STYLE_ID_ALIASES: Record<string, string> = {
  // Motion 3D (16 Styles)
  voxelverse: 'voxelverse',
  paperworld: 'paperworld',
  worldforge_roma: 'worldforge_roma',
  worldforge_mars: 'worldforge_mars',
  precision: 'precision',
  bedah: 'precision',
  pixelstory: 'pixelbook',
  timeforge: 'diorama',
  buildforge: 'isometrik',
  innerworks: 'carakerja',
  characterflow: 'studio_3d_room',
  cinestory: 'cerita',
  panelverse: 'popart',
  storybook: 'ruang',
  chronicle: 'monofilm',
  cerdik: 'scribble3d',

  // Motion Graphics (18 Styles)
  midnight: 'midnight',
  miniatur: 'diorama',
  arsip: 'arsip',
  blueprint: 'blueprint',
  sketsa: 'sketsa',
  hikayat: 'kuas',
  geometrik: 'belah',
  terminal: 'kinetik',
  lantang: 'heboh',
  flatlife: 'kolab',
  cair: 'aurora',
  peta: 'tiket',
  kliping: 'kolase',
  kaset: 'retro',
  lempung: 'stopmotion_clay',
  piksel: 'pixelbook',
  titik: 'rasi',
  mabar: 'neongame',

  // Video Editor (20 Styles)
  mograph_mix: 'editorial_motion_grid',
  graphite: 'pitch',
  interface_ui: 'uiweb',
  marker: 'edukasi',
  press: 'monofilm',
  typeset: 'reel',
  clean: 'tenang',
  spotlight: 'cahaya',
  bold_type: 'heboh',
  calm: 'soft_glow',
  podcast: 'podcast',
  noted: 'panduan',
  poster: 'popart',
  lumen: 'futuristik',
  depth: 'ruang',
  storyteller: 'cerita',
  mograph_mix_flat: 'infopop',
  impact: 'kilat',
  system_hud: 'isometrik',
  creator_pop: 'sticker_bomb',
};

export const KREATORLAB_RAW_STYLE_DEMOS: Record<
  string,
  Array<[string, string, 'paper' | 'dusk' | 'night', string]>
> = {
  // ==========================================================================
  // 1. OVERHAULED EDITORIAL MOTION GRID & 3D HOST (ULTRA-FLUID KREATORLAB PRO)
  // ==========================================================================
  editorial_motion_grid: [
    [
      'Masih pusing ngedit video manual berjam-jam? Sekarang semua bergerak otomatis mengikuti konsep!',
      'otomatis',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.43, sc = Math.min(W / 720, H / 1280);
const enter3D = (x, y, k, dir = 1) => {
  const cK = Math.min(1, Math.max(0.001, k)), inv = 1 - cK;
  const flipX = (0.32 + 0.68 * Math.sin(cK * Math.PI * 0.5)) * (0.86 + 0.14 * k);
  ctx.translate(x + inv * dir * 115 * sc, y + inv * inv * -58 * sc);
  ctx.transform(flipX, inv * dir * 0.14, -inv * dir * 0.08, 0.84 + 0.16 * k, 0, 0);
};
// Deep carbon architectural grid with moving perspective scanline
ctx.fillStyle = "#070b16"; ctx.fillRect(0, 0, W, H);
const gridShiftX = (s.t * 22 * sc) % (44 * sc), gridShiftY = (s.t * 16 * sc) % (44 * sc);
ctx.strokeStyle = "rgba(56,189,248,0.095)"; ctx.lineWidth = 1.2 * sc;
ctx.beginPath();
for (let gx = -44 * sc + gridShiftX; gx < W; gx += 44 * sc) { ctx.moveTo(gx, 0); ctx.lineTo(gx, H); }
for (let gy = -44 * sc + gridShiftY; gy < H; gy += 44 * sc) { ctx.moveTo(0, gy); ctx.lineTo(W, gy); }
ctx.stroke();
// Radial ambient studio glow
const rg = ctx.createRadialGradient(cx - 25 * sc, cy - 40 * sc, 10 * sc, cx - 25 * sc, cy - 40 * sc, 360 * sc);
rg.addColorStop(0, "rgba(56,189,248,0.22)"); rg.addColorStop(0.55, "rgba(16,185,129,0.09)"); rg.addColorStop(1, "rgba(0,0,0,0)");
ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);

// Top live status pill sliding in from top
const kTop = s.spring(0.04, "snappy");
if (kTop > 0.01) {
  ctx.save(); ctx.translate(cx - 18 * sc, H * 0.135 - (1 - Math.min(1, kTop)) * 35 * sc); ctx.scale(Math.min(1.04, kTop), Math.min(1.04, kTop));
  ctx.fillStyle = "rgba(15,23,42,0.94)"; ctx.strokeStyle = "rgba(56,189,248,0.55)"; ctx.lineWidth = 2 * sc;
  ctx.beginPath(); ctx.roundRect(-156 * sc, -20 * sc, 312 * sc, 40 * sc, 20 * sc); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(-126 * sc, 0, 6 * sc * (0.8 + 0.2 * Math.sin(s.t * 8)), 0, Math.PI * 2); ctx.fill();
  ctx.font = "800 " + Math.round(13 * sc) + 'px "JetBrains Mono", monospace'; ctx.fillStyle = "#7dd3fc"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText("MOGRAPH ENGINE · 60 FPS", -108 * sc, 1 * sc);
  ctx.restore();
}

// Card 1: 3D Perspective Problem Card ("EDIT MANUAL 5 JAM") flips in, then gets crossed out
const kProb = s.spring(0.14, "bouncy");
const kSolve = s.spring(0.92, "bouncy");
if (kProb > 0.01) {
  const dimFactor = s.clamp((s.t - 0.92) / 0.35, 0, 1);
  ctx.save();
  enter3D(cx - 88 * sc, cy - 118 * sc - dimFactor * 12 * sc, kProb, -1);
  ctx.rotate(-0.04 - dimFactor * 0.025);
  ctx.globalAlpha = 1 - dimFactor * 0.32;
  ctx.fillStyle = "#020617"; ctx.beginPath(); ctx.roundRect(-152 * sc, -46 * sc + 10 * sc, 304 * sc, 92 * sc, 18 * sc); ctx.fill();
  ctx.fillStyle = "#0f172a"; ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2.6 * sc;
  ctx.beginPath(); ctx.roundRect(-152 * sc, -46 * sc, 304 * sc, 92 * sc, 18 * sc); ctx.fill(); ctx.stroke();
  ctx.font = "800 " + Math.round(11.5 * sc) + 'px "JetBrains Mono", monospace'; ctx.fillStyle = "#f87171"; ctx.textAlign = "left";
  ctx.fillText("⚠ CARA LAMA (MANUAL)", -126 * sc, -16 * sc);
  ctx.font = "900 " + Math.round(24 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#ffffff";
  ctx.fillText("5 Jam / Video", -126 * sc, 16 * sc);
  const kSlash = s.at(0.84, 0.28);
  if (kSlash > 0.01) {
    ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 6 * sc; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-128 * sc, -24 * sc); ctx.lineTo(-128 * sc + 256 * sc * kSlash, 28 * sc * kSlash - 24 * sc * (1 - kSlash)); ctx.stroke();
  }
  ctx.restore();
}

// Card 2: 3D Flip Live Area-Spline Performance Card with glowing curve & laser playhead
if (kSolve > 0.01) {
  ctx.save();
  enter3D(cx - 12 * sc, cy + 44 * sc + s.wave(1.2, 4 * sc), kSolve, 1);
  ctx.fillStyle = "#020617"; ctx.beginPath(); ctx.roundRect(-218 * sc, -98 * sc + 12 * sc, 436 * sc, 196 * sc, 22 * sc); ctx.fill();
  ctx.fillStyle = "#0f172a"; ctx.strokeStyle = "#10b981"; ctx.lineWidth = 2.8 * sc;
  ctx.beginPath(); ctx.roundRect(-218 * sc, -98 * sc, 436 * sc, 196 * sc, 22 * sc); ctx.fill(); ctx.stroke();

  const curveProg = s.ease.out(s.clamp((s.t - 1.02) / 1.25, 0, 1));
  const boostVal = Math.round(10 + curveProg * 330);
  ctx.font = "800 " + Math.round(12 * sc) + 'px "JetBrains Mono", monospace'; ctx.fillStyle = "#94a3b8"; ctx.textAlign = "left";
  ctx.fillText("KECEPATAN & RETENSI VISUAL", -185 * sc, -64 * sc);
  ctx.font = "900 " + Math.round(28 * sc) + 'px "JetBrains Mono", monospace'; ctx.fillStyle = "#10b981"; ctx.textAlign = "right";
  ctx.fillText("+" + boostVal + "%", 185 * sc, -60 * sc);

  const pts = [[-180, 56], [-110, 42], [-40, 18], [30, -14], [105, -26], [175, -62]];
  const maxIdx = Math.max(1, Math.floor(curveProg * (pts.length - 1)));
  const tip = pts[maxIdx];
  const areaG = ctx.createLinearGradient(0, -65 * sc, 0, 75 * sc);
  areaG.addColorStop(0, "rgba(16,185,129,0.34)"); areaG.addColorStop(1, "rgba(16,185,129,0)");
  ctx.beginPath(); ctx.moveTo(pts[0][0] * sc, 72 * sc);
  for (let i = 0; i <= maxIdx; i++) ctx.lineTo(pts[i][0] * sc, pts[i][1] * sc);
  ctx.lineTo(tip[0] * sc, 72 * sc); ctx.closePath(); ctx.fillStyle = areaG; ctx.fill();

  ctx.beginPath();
  for (let i = 0; i <= maxIdx; i++) {
    const px = pts[i][0] * sc, py = pts[i][1] * sc;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = "#10b981"; ctx.lineWidth = 5 * sc; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
  ctx.fillStyle = "rgba(16,185,129,0.28)"; ctx.beginPath(); ctx.arc(tip[0] * sc, tip[1] * sc, 15 * sc, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#10b981"; ctx.beginPath(); ctx.arc(tip[0] * sc, tip[1] * sc, 9 * sc, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(tip[0] * sc, tip[1] * sc, 4 * sc, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// Interactive 3D Host Broadcast Pod + Callout Beam + Equalizer Pill
const hostX = W * 0.765, hostY = H * 1.012 + s.wave(1.1, 3.5 * sc);
ctx.save();
ctx.strokeStyle = s.t >= 0.95 ? "#10b981" : "#ef4444"; ctx.lineWidth = 2.2 * sc; ctx.setLineDash([5 * sc, 5 * sc]); ctx.lineDashOffset = -s.t * 42 * sc;
ctx.beginPath(); ctx.moveTo(hostX - 95 * sc, hostY - 210 * sc); ctx.quadraticCurveTo(cx + 60 * sc, cy + 150 * sc, cx + 10 * sc, cy + 65 * sc); ctx.stroke(); ctx.setLineDash([]);
const pillX = hostX - 145 * sc, pillY = hostY - 222 * sc + Math.sin(s.t * 3.8) * 3.5 * sc;
ctx.fillStyle = "rgba(15,23,42,0.94)"; ctx.strokeStyle = s.t >= 0.95 ? "#10b981" : "#ef4444"; ctx.lineWidth = 2 * sc;
ctx.beginPath(); ctx.roundRect(pillX - 88 * sc, pillY - 16 * sc, 176 * sc, 32 * sc, 16 * sc); ctx.fill(); ctx.stroke();
ctx.font = "800 " + Math.round(11 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
ctx.fillText(s.t >= 0.95 ? "⚡ AUTO +340% CEPAT" : "⚠ MANUAL 5 JAM", pillX, pillY + 0.5 * sc);
ctx.restore();
s.person(hostX, hostY, { __is3DStudioCreator: true, __has3DHeadphone: true, viewMode: "bust", pose: [["headache", 0], ["idea", 0.92], ["point", 1.65]], size: 352 * sc, facing: -1 });
s.sfx("swipe", 0.14, 0.55); s.sfx("impact", 0.84, 0.7); s.sfx("data_scan", 0.96, 0.65); s.sfx("correct", 1.75, 0.7);`,
    ],
    [
      'Ketik satu perintah di terminal, pipa animasi langsung merakit tiga komponen secara bertahap!',
      'bertahap!',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.43, sc = Math.min(W / 720, H / 1280);
const enter3D = (x, y, k, dir = 1) => {
  const cK = Math.min(1, Math.max(0.001, k)), inv = 1 - cK;
  const flipX = (0.32 + 0.68 * Math.sin(cK * Math.PI * 0.5)) * (0.86 + 0.14 * k);
  ctx.translate(x + inv * dir * 110 * sc, y + inv * inv * -52 * sc);
  ctx.transform(flipX, inv * dir * 0.13, -inv * dir * 0.07, 0.84 + 0.16 * k, 0, 0);
};
ctx.fillStyle = "#f4f3ef"; ctx.fillRect(0, 0, W, H);
const gs = (s.t * 18 * sc) % (44 * sc);
ctx.strokeStyle = "rgba(15,23,42,0.068)"; ctx.lineWidth = 1.2 * sc;
ctx.beginPath();
for (let gx = -44 * sc + gs; gx < W; gx += 44 * sc) { ctx.moveTo(gx, 0); ctx.lineTo(gx, H); }
for (let gy = -44 * sc + gs; gy < H; gy += 44 * sc) { ctx.moveTo(0, gy); ctx.lineTo(W, gy); }
ctx.stroke();

// macOS / CLI Terminal Window 3D flip-in from top with live syntax typing
const kTerm = s.spring(0.05, "snappy");
if (kTerm > 0.01) {
  const cmd = "$ kreatorlab build --motion3d";
  const typed = cmd.slice(0, Math.max(2, Math.floor(s.clamp((s.t - 0.1) / 0.75, 0, 1) * cmd.length)));
  ctx.save();
  enter3D(cx - 18 * sc, cy - 188 * sc, kTerm, -1);
  ctx.fillStyle = "#0f172a"; ctx.strokeStyle = "#2563eb"; ctx.lineWidth = 2.5 * sc;
  ctx.shadowColor = "rgba(15,23,42,0.22)"; ctx.shadowBlur = 24 * sc; ctx.shadowOffsetY = 10 * sc;
  ctx.beginPath(); ctx.roundRect(-228 * sc, -42 * sc, 456 * sc, 84 * sc, 16 * sc); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
  const dotCols = ["#ef4444", "#f59e0b", "#10b981"];
  for (let d = 0; d < 3; d++) {
    ctx.fillStyle = dotCols[d]; ctx.beginPath(); ctx.arc((-202 + d * 16) * sc, -22 * sc, 4.5 * sc, 0, Math.PI * 2); ctx.fill();
  }
  ctx.font = "700 " + Math.round(17 * sc) + 'px "JetBrains Mono", monospace'; ctx.fillStyle = "#38bdf8"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText(typed + (Math.floor(s.t * 5) % 2 ? "▋" : ""), -202 * sc, 12 * sc, 404 * sc);
  ctx.restore();
}

// Animated vertical pipeline spine + traveling glowing data pulses
const pipeProg = s.ease.inOut(s.clamp((s.t - 0.32) / 1.35, 0, 1));
if (pipeProg > 0.01) {
  ctx.strokeStyle = "#10b981"; ctx.lineWidth = 4 * sc; ctx.setLineDash([8 * sc, 6 * sc]); ctx.lineDashOffset = -s.t * 48 * sc;
  ctx.beginPath(); ctx.moveTo(cx - 185 * sc, cy - 144 * sc); ctx.lineTo(cx - 185 * sc, cy - 144 * sc + 265 * sc * pipeProg); ctx.stroke();
  ctx.setLineDash([]);
}

// 3 Staggered Isometric Feature Cards with 3D perspective flip-in & micro progress bar
const steps = [
  ["01", "Analisis Emosi & Konsep", "SCRIPT → POSE KARAKTER", "#2563eb"],
  ["02", "Koreografi Objek Berlapis", "SPRING · PARALLAX · 3D", "#f59e0b"],
  ["03", "Audio Ducking & Auto SFX", "VOICE OVER + SOUND DESIGN", "#10b981"]
];
for (let i = 0; i < 3; i++) {
  const t0 = 0.40 + i * 0.42;
  const k = s.spring(t0, "bouncy");
  const kTick = s.pop(t0 + 0.22, 0.26);
  if (k > 0.02) {
    const ry = cy - 72 * sc + i * 88 * sc;
    ctx.save();
    enter3D(cx - 16 * sc, ry + Math.sin(s.t * 3 + i) * 2.5 * sc, k, i % 2 === 0 ? -1 : 1);
    ctx.fillStyle = "#cbd5e1"; ctx.beginPath(); ctx.roundRect(-224 * sc, -26 * sc, 448 * sc, 68 * sc, 16 * sc); ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.strokeStyle = kTick > 0.4 ? steps[i][3] : "#0f172a"; ctx.lineWidth = 2.5 * sc;
    ctx.beginPath(); ctx.roundRect(-224 * sc, -34 * sc, 448 * sc, 68 * sc, 16 * sc); ctx.fill(); ctx.stroke();
    ctx.fillStyle = steps[i][3]; ctx.beginPath(); ctx.roundRect(-208 * sc, -20 * sc, 42 * sc, 40 * sc, 10 * sc); ctx.fill();
    ctx.font = "900 " + Math.round(16 * sc) + 'px "JetBrains Mono", monospace'; ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(steps[i][0], -187 * sc, 0);
    ctx.textAlign = "left";
    ctx.font = "800 " + Math.round(18 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#0f172a";
    ctx.fillText(steps[i][1], -152 * sc, -8 * sc, 295 * sc);
    ctx.font = "700 " + Math.round(11 * sc) + 'px "JetBrains Mono", monospace'; ctx.fillStyle = "#64748b";
    ctx.fillText(steps[i][2], -152 * sc, 14 * sc, 295 * sc);
    if (kTick > 0.01) {
      ctx.save(); ctx.translate(188 * sc, 0); ctx.scale(kTick, kTick);
      ctx.fillStyle = "#10b981"; ctx.beginPath(); ctx.arc(0, 0, 16 * sc, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3 * sc; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-6 * sc, 0); ctx.lineTo(-1 * sc, 5 * sc); ctx.lineTo(7 * sc, -5 * sc); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
}
const hostX = W * 0.765, hostY = H * 1.012 + s.wave(1.1, 3.5 * sc, 1);
s.person(hostX, hostY, { __is3DStudioCreator: true, __has3DHeadphone: true, viewMode: "bust", pose: [["sittype", 0], ["explain", 0.55], ["point", 1.15], ["thumbs", 1.85]], size: 352 * sc, facing: -1 });
s.sfx("type", 0.12, 0.6); s.sfx("swipe", 0.42, 0.65); s.sfx("cursor_click", 0.88, 0.65); s.sfx("correct", 1.52, 0.75);`,
    ],
    [
      'Dari satu rekaman suara, belasan klip visual meledak keluar dengan sudut kamera berbeda!',
      'meledak keluar',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.43, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#070b16"; ctx.fillRect(0, 0, W, H);
const gs = (s.t * 20 * sc) % (44 * sc);
ctx.strokeStyle = "rgba(56,189,248,0.085)"; ctx.lineWidth = 1.2 * sc;
ctx.beginPath();
for (let gx = -44 * sc + gs; gx < W; gx += 44 * sc) { ctx.moveTo(gx, 0); ctx.lineTo(gx, H); }
for (let gy = -44 * sc + gs; gy < H; gy += 44 * sc) { ctx.moveTo(0, gy); ctx.lineTo(W, gy); }
ctx.stroke();

// Odometer counter header
const roll = s.ease.out(s.clamp((s.t - 0.08) / 1.35, 0, 1));
const countVal = Math.max(1, Math.round(roll * 15));
ctx.save(); ctx.translate(cx - 18 * sc, cy - 182 * sc);
ctx.fillStyle = "rgba(16,185,129,0.16)"; ctx.strokeStyle = "#10b981"; ctx.lineWidth = 2.2 * sc;
ctx.beginPath(); ctx.roundRect(-210 * sc, -26 * sc, 420 * sc, 52 * sc, 14 * sc); ctx.fill(); ctx.stroke();
ctx.font = "900 " + Math.round(24 * sc) + 'px "JetBrains Mono", monospace'; ctx.fillStyle = "#10b981"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
ctx.fillText(countVal + "X SCENE VARIATIONS · ZERO REPEAT", 0, 1 * sc, 396 * sc);
ctx.restore();

// 15 Cards launching out from center origin with 3D Y-axis perspective flip & wave float
const cols = 5, rows = 3, cw = 66 * sc, ch = 82 * sc, gap = 12 * sc;
const sx = cx - 20 * sc - (cols * cw + (cols - 1) * gap) * 0.5, sy = cy - 118 * sc;
const palette = ["#ef4444", "#38bdf8", "#10b981", "#f59e0b", "#8b5cf6"];
for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
  const idx = r * cols + c;
  const t0 = 0.08 + idx * 0.06;
  const k = s.spring(t0, "bouncy");
  if (k > 0.01) {
    const targetX = sx + c * (cw + gap) + cw * 0.5;
    const targetY = sy + r * (ch + gap) + ch * 0.5;
    const curX = s.lerp(cx - 20 * sc, targetX, Math.min(1, k));
    const curY = s.lerp(cy, targetY, Math.min(1, k)) + Math.sin(s.t * 3.4 + idx * 0.6) * 3.5 * sc;
    const flipX = Math.max(0.18, Math.sin(Math.min(1, k) * Math.PI * 0.5));
    const accent = palette[idx % palette.length];
    ctx.save();
    ctx.translate(curX, curY);
    ctx.scale(flipX * (0.85 + 0.15 * k), 0.85 + 0.15 * k);
    ctx.fillStyle = idx % 4 === 0 ? accent : "#0f172a";
    ctx.strokeStyle = accent; ctx.lineWidth = 2.2 * sc;
    ctx.beginPath(); ctx.roundRect(-cw * 0.5, -ch * 0.5, cw, ch, 12 * sc); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ffffff";
    if (idx % 3 === 0) {
      ctx.beginPath(); ctx.moveTo(-5 * sc, -8 * sc); ctx.lineTo(8 * sc, 0); ctx.lineTo(-5 * sc, 8 * sc); ctx.closePath(); ctx.fill();
    } else if (idx % 3 === 1) {
      ctx.fillRect(-16 * sc, 6 * sc, 8 * sc, 16 * sc);
      ctx.fillRect(-4 * sc, -4 * sc, 8 * sc, 26 * sc);
      ctx.fillRect(8 * sc, -14 * sc, 8 * sc, 36 * sc);
    } else {
      ctx.beginPath(); ctx.arc(0, 0, 12 * sc, 0, Math.PI * 1.6); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3 * sc; ctx.stroke();
    }
    ctx.restore();
  }
}
s.person(W * 0.765, H * 1.012 + s.wave(1.1, 3.5 * sc, 2), { __is3DStudioCreator: true, __has3DHeadphone: true, viewMode: "bust", pose: [["scared", 0], ["present", 0.55], ["cheer", 1.45]], size: 352 * sc, facing: -1 });
s.sfx("swipe", 0.12, 0.65); s.sfx("data_scan", 0.58, 0.7); s.sfx("correct", 1.32, 0.75);`,
    ],
    [
      'Langsung pilih gaya favoritmu dan buat video sekelas studio profesional sekarang!',
      'profesional',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.43, sc = Math.min(W / 720, H / 1280);
const enter3D = (x, y, k, dir = 1) => {
  const cK = Math.min(1, Math.max(0.001, k)), inv = 1 - cK;
  const flipX = (0.32 + 0.68 * Math.sin(cK * Math.PI * 0.5)) * (0.86 + 0.14 * k);
  ctx.translate(x + inv * dir * 110 * sc, y + inv * inv * -52 * sc);
  ctx.transform(flipX, inv * dir * 0.13, -inv * dir * 0.07, 0.84 + 0.16 * k, 0, 0);
};
ctx.fillStyle = "#f4f3ef"; ctx.fillRect(0, 0, W, H);
const gs = (s.t * 18 * sc) % (44 * sc);
ctx.strokeStyle = "rgba(15,23,42,0.068)"; ctx.lineWidth = 1.2 * sc;
ctx.beginPath();
for (let gx = -44 * sc + gs; gx < W; gx += 44 * sc) { ctx.moveTo(gx, 0); ctx.lineTo(gx, H); }
for (let gy = -44 * sc + gs; gy < H; gy += 44 * sc) { ctx.moveTo(0, gy); ctx.lineTo(W, gy); }
ctx.stroke();

const isClicked = s.t >= 1.25;
const kCard = s.spring(0.08, "bouncy");
if (kCard > 0.02) {
  ctx.save();
  enter3D(cx - 20 * sc, cy - 10 * sc, kCard, 1);
  ctx.fillStyle = isClicked ? "#10b981" : "#ef4444"; ctx.beginPath(); ctx.roundRect(-210 * sc, -54 * sc, 420 * sc, 128 * sc, 26 * sc); ctx.fill();
  ctx.fillStyle = "#0f172a"; ctx.beginPath(); ctx.roundRect(-210 * sc, -66 * sc, 420 * sc, 128 * sc, 26 * sc); ctx.fill();
  ctx.font = "900 " + Math.round(22 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#ffffff"; ctx.textAlign = "left";
  ctx.fillText("@kreatorlab.studio", -175 * sc, -14 * sc);
  ctx.font = "700 " + Math.round(12 * sc) + 'px "JetBrains Mono", monospace'; ctx.fillStyle = "#38bdf8";
  ctx.fillText("MOTION 3D · MOGRAPH · EDITOR", -175 * sc, 14 * sc);

  const btnScale = isClicked ? 1 + Math.sin(s.clamp((s.t - 1.25) / 0.25, 0, 1) * Math.PI) * 0.18 : 1;
  ctx.save(); ctx.translate(112 * sc, -2 * sc); ctx.scale(btnScale, btnScale);
  ctx.fillStyle = isClicked ? "#10b981" : "#ef4444";
  ctx.beginPath(); ctx.roundRect(-72 * sc, -24 * sc, 144 * sc, 48 * sc, 24 * sc); ctx.fill();
  ctx.font = "800 " + Math.round(15 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(isClicked ? "Following ✓" : "Follow +", 0, 1 * sc);
  ctx.restore();

  if (isClicked) {
    const rp = s.clamp((s.t - 1.25) / 0.55, 0, 1);
    ctx.strokeStyle = "#10b981"; ctx.lineWidth = (1 - rp) * 5 * sc; ctx.globalAlpha = 1 - rp;
    ctx.beginPath(); ctx.arc(112 * sc, -2 * sc, (28 + rp * 75) * sc, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

const pills = [
  [-135, -132, "✓ 54 Gaya Kreatorlab", "#2563eb", 0.32],
  [105, -128, "★ 60 FPS Render", "#f59e0b", 0.52],
  [-85, 105, "⚡ Auto Voice & SFX", "#10b981", 0.72]
];
for (let i = 0; i < pills.length; i++) {
  const [px, py, txt, col, t0] = pills[i];
  const kp = s.spring(t0, "bouncy");
  if (kp > 0.01) {
    ctx.save();
    ctx.translate(cx - 20 * sc + px * sc, cy + py * sc + s.wave(1.2, 4 * sc, i));
    ctx.scale(kp, kp);
    ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(-92 * sc, -18 * sc, 184 * sc, 36 * sc, 18 * sc); ctx.fill();
    ctx.font = "800 " + Math.round(13 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(txt, 0, 1 * sc);
    ctx.restore();
  }
}

s.person(W * 0.765, H * 1.012 + s.wave(1.1, 3.5 * sc, 3), { __is3DStudioCreator: true, __has3DHeadphone: true, viewMode: "bust", pose: [["wave", 0], ["yes", 0.72], ["cheer", 1.25]], size: 352 * sc, facing: -1 });
s.sfx("swipe", 0.14, 0.65); s.sfx("cursor_click", 1.25, 0.75); s.sfx("correct", 1.3, 0.8);`,
    ],
  ],

  // ==========================================================================
  // 2. VOXELVERSE (EXACT MATCH TO LEFT PANEL OF kartu-motion.mp4)
  // ==========================================================================
  voxelverse: [
    [
      'Ketik satu baris kode untuk membangun dunia voxel 3D utuh dari meja kerjamu.',
      'dunia voxel',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.46, sc = Math.min(W / 720, H / 1280);
// Cozy dark-warm voxel room background
const bg = ctx.createLinearGradient(0, 0, 0, H);
bg.addColorStop(0, "#141820"); bg.addColorStop(0.55, "#1e222b"); bg.addColorStop(1, "#2a1e17");
ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
// Left window with daylight sky & voxel trees outside
ctx.fillStyle = "#5ba4cf"; ctx.fillRect(28 * sc, 110 * sc, 165 * sc, 290 * sc);
ctx.fillStyle = "#3b7a57"; ctx.fillRect(28 * sc, 295 * sc, 165 * sc, 105 * sc);
ctx.strokeStyle = "#111318"; ctx.lineWidth = 14 * sc; ctx.strokeRect(28 * sc, 110 * sc, 165 * sc, 290 * sc);
// Warm desk surface
ctx.fillStyle = "#6b442a"; ctx.fillRect(0, cy + 120 * sc, W, H - (cy + 120 * sc));
// Warm glowing voxel desk lamp on right
const lampGlow = ctx.createRadialGradient(cx + 155 * sc, cy + 35 * sc, 10 * sc, cx + 155 * sc, cy + 35 * sc, 220 * sc);
lampGlow.addColorStop(0, "rgba(255,180,70,0.65)"); lampGlow.addColorStop(1, "rgba(255,140,40,0)");
ctx.fillStyle = lampGlow; ctx.fillRect(0, 0, W, H);
s.box(cx + 155 * sc, cy + 25 * sc, 34 * sc, 28 * sc, 34 * sc, { fill: "#fffbeb", edges: "none" });
// Dual-pane Voxel Coding Monitor on Left-Center
const kMon = s.spring(0.05, "snappy");
ctx.save(); ctx.translate(cx - 85 * sc, cy - 25 * sc); ctx.scale(kMon, kMon);
ctx.fillStyle = "#0b0e14"; ctx.strokeStyle = "#262b36"; ctx.lineWidth = 8 * sc;
ctx.beginPath(); ctx.roundRect(-175 * sc, -125 * sc, 350 * sc, 230 * sc, 8 * sc); ctx.fill(); ctx.stroke();
ctx.fillStyle = "#1f242d"; ctx.fillRect(-35 * sc, 105 * sc, 70 * sc, 45 * sc);
ctx.font = "700 " + Math.round(13 * sc) + 'px "JetBrains Mono", monospace';
ctx.fillStyle = "#64748b"; ctx.fillText("scene / small_world.ts", -152 * sc, -92 * sc);
ctx.fillStyle = "#f97316"; ctx.fillText("import { World } from './kl'", -152 * sc, -58 * sc);
ctx.fillStyle = "#e2e8f0"; ctx.fillText("const city = new", -152 * sc, -28 * sc);
ctx.fillStyle = "#38bdf8"; ctx.fillText("  World('roma')", -152 * sc, -4 * sc);
const typedLen = Math.floor(s.clamp((s.t - 0.2) / 1.2, 0, 1) * 14);
ctx.fillStyle = "#4ade80"; ctx.fillText("city.build()".slice(0, typedLen), -152 * sc, 28 * sc);
ctx.restore();
// Voxel Character seen over-the-shoulder typing at desk
const bob = Math.sin(s.t * 9) * 4 * sc;
s.box(cx + 55 * sc, cy + 165 * sc + bob, 165 * sc, 150 * sc, 110 * sc, { fill: "#2c7a7b", round: 0.05 });
s.box(cx + 55 * sc, cy + 35 * sc + bob * 0.6, 155 * sc, 145 * sc, 145 * sc, { fill: "#3b2314", round: 0.04 });
s.sfx("type", 0.15, 0.65); s.sfx("click", 0.9, 0.6);`,
    ],
    [
      'Saat deadline mepet dan error muncul, karakter voxel bereaksi memegang kepala dengan ekspresi nyata!',
      'memegang kepala',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.48, sc = Math.min(W / 720, H / 1280);
// Warm indoor voxel studio with wooden bookshelf behind character (matching 00:02-00:03 of kartu-motion.mp4!)
const bg = ctx.createLinearGradient(0, 0, 0, H);
bg.addColorStop(0, "#5c4a38"); bg.addColorStop(0.5, "#3d3126"); bg.addColorStop(1, "#1e1915");
ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
// Voxel Bookshelf on upper wall with colorful blocky books
ctx.fillStyle = "#7c5836"; ctx.fillRect(110 * sc, 120 * sc, 480 * sc, 18 * sc);
ctx.fillRect(110 * sc, 230 * sc, 480 * sc, 18 * sc);
const bookCols = ["#c53030", "#2b6cb0", "#d69e2e", "#2f855a", "#e2e8f0", "#b7791f"];
for (let i = 0; i < 8; i++) {
  ctx.fillStyle = bookCols[i % bookCols.length];
  ctx.fillRect((135 + i * 52) * sc, (150 + (i % 2) * 12) * sc, 34 * sc, (80 - (i % 2) * 12) * sc);
}
// Blocky Voxel Coder (Teal Hoodie, Glasses, Spiky Hair) raising BOTH hands to head in shocked disbelief!
const kRaise = s.spring(0.12, "bouncy");
const shake = Math.sin(s.t * 14) * 2.5 * sc * Math.max(0, 1 - s.t * 0.35);
ctx.save(); ctx.translate(cx - 25 * sc + shake, cy + 45 * sc);
// Teal Voxel Hoodie Torso + White Drawstrings
s.box(0, 135 * sc, 195 * sc, 190 * sc, 120 * sc, { fill: "#317873", round: 0.04 });
ctx.fillStyle = "#e2e8f0"; ctx.fillRect(-24 * sc, 65 * sc, 10 * sc, 62 * sc); ctx.fillRect(16 * sc, 65 * sc, 10 * sc, 62 * sc);
// Voxel Head (Peach skin + Dark spiky blocky hair)
s.box(0, -35 * sc, 168 * sc, 155 * sc, 145 * sc, { fill: "#d69e72", round: 0.04 });
ctx.fillStyle = "#1c1613";
ctx.fillRect(-92 * sc, -135 * sc, 184 * sc, 58 * sc);
ctx.fillRect(-102 * sc, -110 * sc, 28 * sc, 85 * sc);
ctx.fillRect(74 * sc, -110 * sc, 28 * sc, 85 * sc);
// Black-framed Voxel Glasses & Wide Shocked Square Eyes
ctx.strokeStyle = "#111318"; ctx.lineWidth = 7 * sc;
ctx.strokeRect(-64 * sc, -58 * sc, 54 * sc, 38 * sc);
ctx.strokeRect(10 * sc, -58 * sc, 54 * sc, 38 * sc);
ctx.fillStyle = "#111318"; ctx.fillRect(-10 * sc, -44 * sc, 20 * sc, 7 * sc);
ctx.fillStyle = "#ffffff"; ctx.fillRect(-54 * sc, -48 * sc, 34 * sc, 22 * sc); ctx.fillRect(20 * sc, -48 * sc, 34 * sc, 22 * sc);
ctx.fillStyle = "#1e293b"; ctx.fillRect(-42 * sc, -44 * sc, 16 * sc, 16 * sc); ctx.fillRect(30 * sc, -44 * sc, 16 * sc, 16 * sc);
// Worried Furrowed Voxel Eyebrows & Small Shocked Mouth
ctx.fillStyle = "#1c1613";
ctx.fillRect(-60 * sc, -72 * sc - kRaise * 6 * sc, 46 * sc, 8 * sc);
ctx.fillRect(14 * sc, -72 * sc - kRaise * 6 * sc, 46 * sc, 8 * sc);
ctx.fillStyle = "#6b2d26"; ctx.fillRect(-16 * sc, 12 * sc, 32 * sc, 12 * sc);
// BOTH VOXEL ARMS RAISED HOLDING HEAD (Headache / Mind-blown pose!)
const armY = s.lerp(80, -48, Math.min(1, kRaise)) * sc;
s.box(-118 * sc, armY, 54 * sc, 145 * sc, 54 * sc, { fill: "#317873", rz: -0.35 * kRaise, round: 0.04 });
s.box(118 * sc, armY, 54 * sc, 145 * sc, 54 * sc, { fill: "#317873", rz: 0.35 * kRaise, round: 0.04 });
s.box(-102 * sc, armY - 68 * sc, 44 * sc, 38 * sc, 44 * sc, { fill: "#d69e72", round: 0.04 });
s.box(102 * sc, armY - 68 * sc, 44 * sc, 38 * sc, 44 * sc, { fill: "#d69e72", round: 0.04 });
ctx.restore();
// Warm lamp glow in foreground right
const fgGlow = ctx.createRadialGradient(W * 0.78, H * 0.72, 10 * sc, W * 0.78, H * 0.72, 180 * sc);
fgGlow.addColorStop(0, "rgba(255,165,50,0.75)"); fgGlow.addColorStop(1, "rgba(255,120,20,0)");
ctx.fillStyle = fgGlow; ctx.fillRect(0, 0, W, H);
s.sfx("whoosh", 0.12, 0.65); s.sfx("pop", 0.35, 0.7);`,
    ],
    [
      'Begitu dijalankan, empat belas adegan langsung selesai di-build pada enam puluh FPS!',
      'enam puluh FPS!',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.45, sc = Math.min(W / 720, H / 1280);
// Close-up perspective on the 3D angled dual-pane monitor (matching 00:04-00:05 of kartu-motion.mp4!)
const bg = ctx.createLinearGradient(0, 0, W, H);
bg.addColorStop(0, "#1b242c"); bg.addColorStop(1, "#2b1d16");
ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
const kZoom = 1 + s.ease.out(s.clamp(s.t / 2.5, 0, 1)) * 0.08;
ctx.save(); ctx.translate(cx, cy); ctx.scale(kZoom, kZoom);
// 3D Perspective Monitor Frame
ctx.fillStyle = "#090c10"; ctx.strokeStyle = "#1e2530"; ctx.lineWidth = 10 * sc;
ctx.beginPath(); ctx.roundRect(-265 * sc, -175 * sc, 530 * sc, 330 * sc, 12 * sc); ctx.fill(); ctx.stroke();
// Vertical divider between Code Pane (Left) and Terminal Output (Right)
ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 2.5 * sc;
ctx.beginPath(); ctx.moveTo(-10 * sc, -165 * sc); ctx.lineTo(-10 * sc, 145 * sc); ctx.stroke();
// Left Pane: Code
ctx.font = "700 " + Math.round(13 * sc) + 'px "JetBrains Mono", monospace';
ctx.fillStyle = "#f97316"; ctx.fillText("import { World } from './kl'", -242 * sc, -110 * sc);
ctx.fillStyle = "#e2e8f0"; ctx.fillText("const city = new World('roma')", -242 * sc, -76 * sc);
ctx.fillStyle = "#38bdf8"; ctx.fillText("city.build({", -242 * sc, -42 * sc);
ctx.fillStyle = "#a7f3d0"; ctx.fillText("  hills: 7, forum: true", -242 * sc, -12 * sc);
ctx.fillStyle = "#38bdf8"; ctx.fillText("})", -242 * sc, 18 * sc);
ctx.fillStyle = "#facc15"; ctx.fillText("city.fly('forum', { dur: 8 })", -242 * sc, 52 * sc);
// Right Pane: Live Build Output
ctx.fillStyle = "#e2e8f0"; ctx.fillText("$ bun small_world", 14 * sc, -110 * sc);
if (s.t >= 0.45) {
  ctx.fillStyle = "#4ade80"; ctx.fillText("✓ built", 14 * sc, -70 * sc);
}
if (s.t >= 0.95) {
  ctx.fillStyle = "#4ade80"; ctx.fillText("✓ 14 scenes · 60 fps", 14 * sc, -34 * sc);
  ctx.fillStyle = "#f97316"; ctx.fillRect(14 * sc, -6 * sc, 10 * sc, 22 * sc);
}
ctx.restore();
s.sfx("click", 0.45, 0.7); s.sfx("correct", 0.95, 0.8);`,
    ],
    [
      'Dunia voxel 3D siap di-export dengan pencahayaan sinematik kelas atas!',
      'sinematik',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.46, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#111621"; ctx.fillRect(0, 0, W, H);
// Isometric Voxel Island Diorama rising in center
const kIsland = s.spring(0.1, "bouncy");
const rotY = 0.65 + s.t * 0.25;
s.box(cx, cy + 40 * sc, 280 * sc * kIsland, 46 * sc * kIsland, 280 * sc * kIsland, { fill: "#48bb78", ry: rotY, round: 0.04 });
s.box(cx, cy + 78 * sc, 260 * sc * kIsland, 52 * sc * kIsland, 260 * sc * kIsland, { fill: "#744210", ry: rotY, round: 0.04 });
// Voxel Towers popping up on the island
const towers = [[-65, -20, 75, 130, "#dd6b20"], [10, -45, 95, 175, "#e2e8f0"], [75, -10, 68, 110, "#319795"]];
for (let i = 0; i < towers.length; i++) {
  const [tx, ty, tw, th, col] = towers[i];
  const kt = s.spring(0.3 + i * 0.22, "bouncy");
  if (kt > 0.01) {
    s.box(cx + tx * sc, cy + ty * sc - (th * 0.5 * kt - 40) * sc, tw * sc * kt, th * sc * kt, tw * sc * kt, { fill: col, ry: rotY, round: 0.04 });
  }
}
s.tag("VOXELVERSE 3D · READY", cx, cy - 210 * sc, { fill: "#38b2ac", size: Math.round(22 * sc), draw: s.pop(0.25, 0.35) });
s.sfx("pop", 0.2, 0.65); s.sfx("sparkle", 0.85, 0.75);`,
    ],
  ],

  // ==========================================================================
  // 3. PAPERWORLD (EXACT MATCH TO hero-paperworld.mp4)
  // ==========================================================================
  paperworld: [
    [
      'Di balik lipatan bukit kertas malam, bintang dan ikan kertas bergoyang lembut.',
      'kertas malam,',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.5, sc = Math.min(W / 720, H / 1280);
// Deep night-blue folded paper sky (#1c3d75) with vertical paper crease lines
ctx.fillStyle = "#1c3d75"; ctx.fillRect(0, 0, W, H);
for (let i = 1; i < 6; i++) {
  const fx = (W / 6) * i;
  ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.07)";
  ctx.fillRect(fx, 0, W / 6, H);
}
// Hanging strings with yellow paper stars & light-blue paper fish (matching 00:00 of hero-paperworld.mp4!)
const stars = [[110, 190, 22], [185, 290, 16], [280, 160, 18], [410, 210, 24], [560, 180, 20], [630, 340, 16]];
for (let i = 0; i < stars.length; i++) {
  const [sx, sy, sr] = stars[i];
  const sway = Math.sin(s.t * 1.8 + i) * 6 * sc;
  ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1.8 * sc;
  ctx.beginPath(); ctx.moveTo(sx * sc, 0); ctx.lineTo(sx * sc + sway, sy * sc); ctx.stroke();
  ctx.fillStyle = "#ecc94b";
  ctx.beginPath(); ctx.arc(sx * sc + sway, sy * sc, sr * sc, 0, Math.PI * 2); ctx.fill();
}
// Hanging blue paper fish on string
const fishX = 485 * sc + Math.sin(s.t * 1.5) * 10 * sc, fishY = 335 * sc;
ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 2.2 * sc;
ctx.beginPath(); ctx.moveTo(485 * sc, 0); ctx.lineTo(fishX, fishY - 22 * sc); ctx.stroke();
ctx.fillStyle = "#7aa2c4";
ctx.beginPath(); ctx.ellipse(fishX, fishY, 64 * sc, 30 * sc, 0, 0, Math.PI * 2); ctx.fill();
ctx.beginPath(); ctx.moveTo(fishX + 55 * sc, fishY); ctx.lineTo(fishX + 92 * sc, fishY - 26 * sc); ctx.lineTo(fishX + 92 * sc, fishY + 26 * sc); ctx.closePath(); ctx.fill();
ctx.fillStyle = "#0f172a"; ctx.beginPath(); ctx.arc(fishX - 36 * sc, fishY - 4 * sc, 4.5 * sc, 0, Math.PI * 2); ctx.fill();

// Layered green & blue paper hills with drop shadows & tiny yellow-window cottage
ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 24 * sc; ctx.shadowOffsetY = -6 * sc;
ctx.fillStyle = "#688db0"; ctx.beginPath(); ctx.arc(W * 0.68, H * 0.72, 260 * sc, Math.PI, 0); ctx.fill();
ctx.fillStyle = "#2b5446"; ctx.beginPath(); ctx.arc(W * 0.25, H * 0.78, 250 * sc, Math.PI, 0); ctx.fill();
ctx.fillStyle = "#487556"; ctx.beginPath(); ctx.arc(W * 0.65, H * 0.82, 290 * sc, Math.PI, 0); ctx.fill();
ctx.restore();
// Tiny cottage on right hill
ctx.fillStyle = "#8c6d46"; ctx.beginPath(); ctx.moveTo(545 * sc, 690 * sc); ctx.lineTo(580 * sc, 650 * sc); ctx.lineTo(615 * sc, 690 * sc); ctx.lineTo(615 * sc, 745 * sc); ctx.lineTo(545 * sc, 745 * sc); ctx.closePath(); ctx.fill();
ctx.fillStyle = "#f6e05e"; ctx.fillRect(568 * sc, 695 * sc, 24 * sc, 28 * sc);

// Wooden plank stage floor
ctx.fillStyle = "#8c6239"; ctx.fillRect(0, H * 0.78, W, H * 0.22);

// Cute Paper-Cut Character (Brown bob hair with curl, red coat, yellow scarf) on left
const charX = 185 * sc, charY = H * 0.64 + Math.sin(s.t * 2.4) * 4 * sc;
ctx.save(); ctx.translate(charX, charY); ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 18 * sc; ctx.shadowOffsetX = 8 * sc;
// Blue pants & brown shoes
ctx.fillStyle = "#1e40af"; ctx.fillRect(-32 * sc, 95 * sc, 24 * sc, 72 * sc); ctx.fillRect(8 * sc, 95 * sc, 24 * sc, 72 * sc);
ctx.fillStyle = "#3b2314"; ctx.beginPath(); ctx.ellipse(-20 * sc, 170 * sc, 18 * sc, 10 * sc, 0, 0, Math.PI * 2); ctx.fill();
ctx.beginPath(); ctx.ellipse(20 * sc, 170 * sc, 18 * sc, 10 * sc, 0, 0, Math.PI * 2); ctx.fill();
// Red paper coat with yellow buttons
ctx.fillStyle = "#b91c1c"; ctx.beginPath(); ctx.moveTo(-68 * sc, 105 * sc); ctx.lineTo(-48 * sc, -15 * sc); ctx.lineTo(48 * sc, -15 * sc); ctx.lineTo(68 * sc, 105 * sc); ctx.closePath(); ctx.fill();
ctx.fillStyle = "#ecc94b"; ctx.beginPath(); ctx.arc(-14 * sc, 35 * sc, 5 * sc, 0, Math.PI * 2); ctx.arc(14 * sc, 35 * sc, 5 * sc, 0, Math.PI * 2); ctx.arc(-14 * sc, 68 * sc, 5 * sc, 0, Math.PI * 2); ctx.arc(14 * sc, 68 * sc, 5 * sc, 0, Math.PI * 2); ctx.fill();
// Yellow knitted paper scarf
ctx.fillStyle = "#d69e2e"; ctx.beginPath(); ctx.roundRect(-52 * sc, -24 * sc, 104 * sc, 28 * sc, 10 * sc); ctx.fill();
ctx.fillRect(14 * sc, -4 * sc, 24 * sc, 52 * sc);
// Paper head & brown bob hair with top curl
ctx.fillStyle = "#3b2314"; ctx.beginPath(); ctx.arc(0, -95 * sc, 86 * sc, Math.PI * 0.85, Math.PI * 2.15); ctx.fill();
ctx.fillStyle = "#d6bcab"; ctx.beginPath(); ctx.arc(0, -82 * sc, 68 * sc, 0, Math.PI * 2); ctx.fill();
ctx.fillStyle = "#3b2314"; ctx.beginPath(); ctx.arc(0, -112 * sc, 72 * sc, Math.PI, Math.PI * 2); ctx.fill();
// Cute eyes, rosy cheeks & smile
ctx.fillStyle = "#111827"; ctx.beginPath(); ctx.arc(-26 * sc, -82 * sc, 7 * sc, 0, Math.PI * 2); ctx.arc(26 * sc, -82 * sc, 7 * sc, 0, Math.PI * 2); ctx.fill();
ctx.fillStyle = "#c56c6c"; ctx.beginPath(); ctx.arc(-44 * sc, -64 * sc, 11 * sc, 0, Math.PI * 2); ctx.arc(44 * sc, -64 * sc, 11 * sc, 0, Math.PI * 2); ctx.fill();
ctx.strokeStyle = "#111827"; ctx.lineWidth = 3 * sc; ctx.beginPath(); ctx.arc(0, -68 * sc, 10 * sc, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
ctx.restore();
s.sfx("sparkle", 0.25, 0.55);`,
    ],
    [
      'Tiba-tiba bulan sabit turun dan pintu portal bercahaya emas terbuka di tengah bukit!',
      'portal bercahaya',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.5, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#1c3d75"; ctx.fillRect(0, 0, W, H);
// Crescent Moon descending from top (matching 00:01 of hero-paperworld.mp4!)
const kMoon = s.spring(0.08, "bouncy");
ctx.save(); ctx.translate(cx - 35 * sc, 165 * sc * Math.min(1, kMoon));
ctx.fillStyle = "#f6e05e"; ctx.beginPath(); ctx.arc(0, 0, 95 * sc, 0, Math.PI * 2); ctx.fill();
ctx.fillStyle = "#1c3d75"; ctx.beginPath(); ctx.arc(38 * sc, -22 * sc, 78 * sc, 0, Math.PI * 2); ctx.fill();
ctx.restore();
// Glowing Golden Arched Portal Doorway opening in the center hill
const kPortal = s.spring(0.22, "snappy");
if (kPortal > 0.01) {
  ctx.save(); ctx.translate(cx - 25 * sc, H * 0.56); ctx.scale(kPortal, kPortal);
  // Outer green/gold arch frame
  ctx.fillStyle = "#5f7a61"; ctx.beginPath(); ctx.arc(0, -70 * sc, 118 * sc, Math.PI, 0); ctx.lineTo(118 * sc, 160 * sc); ctx.lineTo(-118 * sc, 160 * sc); ctx.closePath(); ctx.fill();
  const pg = ctx.createRadialGradient(0, 0, 10 * sc, 0, 0, 180 * sc);
  pg.addColorStop(0, "#fffbeb"); pg.addColorStop(0.55, "#f6e05e"); pg.addColorStop(1, "#d69e2e");
  ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(0, -65 * sc, 98 * sc, Math.PI, 0); ctx.lineTo(98 * sc, 155 * sc); ctx.lineTo(-98 * sc, 155 * sc); ctx.closePath(); ctx.fill();
  // Mysterious antlered silhouette inside portal glow
  ctx.fillStyle = "rgba(120,85,40,0.38)";
  ctx.beginPath(); ctx.arc(-8 * sc, -15 * sc, 24 * sc, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-22 * sc, 10 * sc, 28 * sc, 95 * sc);
  ctx.restore();
}
// Layered front hills & wooden floor
ctx.fillStyle = "#2b5446"; ctx.beginPath(); ctx.arc(W * 0.18, H * 0.78, 220 * sc, Math.PI, 0); ctx.fill();
ctx.fillStyle = "#487556"; ctx.beginPath(); ctx.arc(W * 0.78, H * 0.78, 230 * sc, Math.PI, 0); ctx.fill();
ctx.fillStyle = "#8c6239"; ctx.fillRect(0, H * 0.78, W, H * 0.22);
// Paper character on left with surprised/curious expression (tilted brows + small 'o' mouth)
ctx.save(); ctx.translate(185 * sc, H * 0.65);
ctx.fillStyle = "#b91c1c"; ctx.beginPath(); ctx.moveTo(-64 * sc, 100 * sc); ctx.lineTo(-45 * sc, -15 * sc); ctx.lineTo(45 * sc, -15 * sc); ctx.lineTo(64 * sc, 100 * sc); ctx.closePath(); ctx.fill();
ctx.fillStyle = "#d69e2e"; ctx.beginPath(); ctx.roundRect(-50 * sc, -24 * sc, 100 * sc, 26 * sc, 10 * sc); ctx.fill();
ctx.fillStyle = "#d6bcab"; ctx.beginPath(); ctx.arc(0, -82 * sc, 66 * sc, 0, Math.PI * 2); ctx.fill();
ctx.fillStyle = "#3b2314"; ctx.beginPath(); ctx.arc(0, -110 * sc, 70 * sc, Math.PI, Math.PI * 2); ctx.fill();
ctx.fillStyle = "#111827"; ctx.beginPath(); ctx.arc(-24 * sc, -80 * sc, 7 * sc, 0, Math.PI * 2); ctx.arc(24 * sc, -80 * sc, 7 * sc, 0, Math.PI * 2); ctx.fill();
ctx.fillStyle = "#7f1d1d"; ctx.beginPath(); ctx.arc(0, -60 * sc, 6 * sc, 0, Math.PI * 2); ctx.fill();
ctx.restore();
s.sfx("whoosh", 0.15, 0.6); s.sfx("sparkle", 0.55, 0.7);`,
    ],
    [
      'Ia berbalik melangkah menembus gerbang cahaya emas yang bersinar hangat.',
      'menembus gerbang',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.5, sc = Math.min(W / 720, H / 1280);
// Warm terracotta striped paper room (matching 00:02 of hero-paperworld.mp4!)
ctx.fillStyle = "#d98a5b"; ctx.fillRect(0, 0, W, H);
ctx.fillStyle = "rgba(185,92,50,0.45)";
for (let x = 20 * sc; x < W; x += 68 * sc) ctx.fillRect(x, 0, 32 * sc, H * 0.78);
ctx.fillStyle = "#b87a3d"; ctx.fillRect(0, H * 0.78, W, H * 0.22);

// Giant Golden Paper Sunburst around the Arched Portal
ctx.save(); ctx.translate(cx - 25 * sc, H * 0.54);
const rays = 11;
ctx.fillStyle = "#d69e2e";
for (let i = 0; i < rays; i++) {
  const ang = -Math.PI + (i / (rays - 1)) * Math.PI + Math.sin(s.t * 2 + i) * 0.02;
  ctx.save(); ctx.rotate(ang + Math.PI * 0.5);
  ctx.beginPath(); ctx.moveTo(-26 * sc, -140 * sc); ctx.lineTo(0, -390 * sc); ctx.lineTo(26 * sc, -140 * sc); ctx.closePath(); ctx.fill();
  ctx.restore();
}
// Blue & Gold Arched Portal Frame
ctx.fillStyle = "#2b4c6f"; ctx.beginPath(); ctx.arc(0, -90 * sc, 145 * sc, Math.PI, 0); ctx.lineTo(145 * sc, 240 * sc); ctx.lineTo(-145 * sc, 240 * sc); ctx.closePath(); ctx.fill();
const gPortal = ctx.createRadialGradient(0, 0, 10 * sc, 0, 0, 220 * sc);
gPortal.addColorStop(0, "#ffffff"); gPortal.addColorStop(0.5, "#fef08a"); gPortal.addColorStop(1, "#eab308");
ctx.fillStyle = gPortal; ctx.beginPath(); ctx.arc(0, -85 * sc, 118 * sc, Math.PI, 0); ctx.lineTo(118 * sc, 240 * sc); ctx.lineTo(-118 * sc, 240 * sc); ctx.closePath(); ctx.fill();
ctx.restore();

// Paper Girl seen FROM BEHIND walking into the glowing portal!
const walkP = s.ease.inOut(s.clamp(s.t / 2.2, 0, 1));
const charScale = 1 - walkP * 0.16;
ctx.save(); ctx.translate(cx + 35 * sc - walkP * 38 * sc, H * 0.65 - walkP * 24 * sc); ctx.scale(charScale, charScale);
ctx.fillStyle = "#2563eb"; ctx.fillRect(-26 * sc, 85 * sc, 20 * sc, 68 * sc); ctx.fillRect(6 * sc, 85 * sc, 20 * sc, 68 * sc);
ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.roundRect(-56 * sc, -12 * sc, 112 * sc, 105 * sc, 12 * sc); ctx.fill();
ctx.fillStyle = "#fde047"; ctx.beginPath(); ctx.roundRect(-52 * sc, -22 * sc, 104 * sc, 24 * sc, 8 * sc); ctx.fill();
ctx.fillStyle = "#5c4028"; ctx.beginPath(); ctx.arc(0, -82 * sc, 72 * sc, Math.PI * 0.9, Math.PI * 2.1); ctx.lineTo(72 * sc, -18 * sc); ctx.lineTo(-72 * sc, -18 * sc); ctx.closePath(); ctx.fill();
ctx.restore();
s.sfx("whoosh", 0.2, 0.55); s.sfx("sparkle", 1.1, 0.65);`,
    ],
    [
      'Di balik gerbang, perahu kertas meluncur mulus menyusuri sungai kertas pastel!',
      'perahu kertas',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.5, sc = Math.min(W / 720, H / 1280);
// Mint & cream paper corridor with perspective walls (matching 00:03-00:04 of hero-paperworld.mp4!)
ctx.fillStyle = "#f5f0e6"; ctx.fillRect(0, 0, W, H);
// Mint river channel in center perspective
ctx.fillStyle = "#c6ebd9";
ctx.beginPath(); ctx.moveTo(cx - 115 * sc, H * 0.34); ctx.lineTo(cx + 115 * sc, H * 0.34); ctx.lineTo(cx + 235 * sc, H); ctx.lineTo(cx - 235 * sc, H); ctx.closePath(); ctx.fill();
// Left & Right 3D Paper Corridor Walls with coral/teal top trim
ctx.fillStyle = "#d8d2c5";
ctx.beginPath(); ctx.moveTo(0, H * 0.28); ctx.lineTo(cx - 115 * sc, H * 0.34); ctx.lineTo(cx - 115 * sc, H * 0.58); ctx.lineTo(0, H * 0.95); ctx.closePath(); ctx.fill();
ctx.beginPath(); ctx.moveTo(W, H * 0.28); ctx.lineTo(cx + 115 * sc, H * 0.34); ctx.lineTo(cx + 115 * sc, H * 0.58); ctx.lineTo(W, H * 0.95); ctx.closePath(); ctx.fill();
ctx.strokeStyle = "#e06d53"; ctx.lineWidth = 10 * sc; ctx.beginPath(); ctx.moveTo(0, H * 0.28); ctx.lineTo(cx - 115 * sc, H * 0.34); ctx.stroke();
ctx.strokeStyle = "#4b9e8d"; ctx.lineWidth = 10 * sc; ctx.beginPath(); ctx.moveTo(W, H * 0.28); ctx.lineTo(cx + 115 * sc, H * 0.34); ctx.stroke();

// Paper-cut wooden boat sliding across the mint channel
const boatSlide = s.ease.inOut(s.clamp((s.t - 0.15) / 1.8, 0, 1));
const bx = s.lerp(cx - 60 * sc, cx + 15 * sc, boatSlide);
const by = s.lerp(H * 0.68, H * 0.62, boatSlide);
ctx.save(); ctx.translate(bx, by); ctx.rotate(-0.08 + boatSlide * 0.05);
ctx.shadowColor = "rgba(0,0,0,0.22)"; ctx.shadowBlur = 18 * sc; ctx.shadowOffsetY = 10 * sc;
// White paper boat rim & warm golden wood deck
ctx.fillStyle = "#f8fafc";
ctx.beginPath(); ctx.moveTo(-165 * sc, -35 * sc); ctx.lineTo(85 * sc, -42 * sc); ctx.quadraticCurveTo(165 * sc, 0, 85 * sc, 42 * sc); ctx.lineTo(-165 * sc, 35 * sc); ctx.closePath(); ctx.fill();
ctx.fillStyle = "#d69e2e";
ctx.beginPath(); ctx.moveTo(-145 * sc, -24 * sc); ctx.lineTo(72 * sc, -30 * sc); ctx.quadraticCurveTo(135 * sc, 0, 72 * sc, 30 * sc); ctx.lineTo(-145 * sc, 24 * sc); ctx.closePath(); ctx.fill();
ctx.restore();
s.sfx("whoosh", 0.2, 0.55); s.sfx("ding", 1.4, 0.65);`,
    ],
  ],

  // ==========================================================================
  // 4. WORLDFORGE ROMA (EXACT MATCH TO CENTER PANEL OF kartu-motion.mp4)
  // ==========================================================================
  worldforge_roma: [
    [
      'Kamera drone menukik di atas ribuan atap terakota kota Romawi kuno.',
      'Romawi kuno.',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.5, sc = Math.min(W / 720, H / 1280);
// Warm Mediterranean sandstone ground
ctx.fillStyle = "#d9c2a3"; ctx.fillRect(0, 0, W, H);
const zoom = 1 + s.ease.inOut(s.clamp(s.t / 2.8, 0, 1)) * 0.22;
const panY = s.ease.inOut(s.clamp(s.t / 2.8, 0, 1)) * 65 * sc;
ctx.save(); ctx.translate(cx, cy + panY); ctx.scale(zoom, zoom); ctx.translate(-cx, -cy);
// Grand Roman Forum & Colonnaded Temple in upper center
s.box(cx + 20 * sc, H * 0.30, 260 * sc, 38 * sc, 140 * sc, { fill: "#f4efe6", rx: -0.55, ry: 0.65, round: 0.02 });
s.box(cx + 20 * sc, H * 0.26, 240 * sc, 26 * sc, 120 * sc, { fill: "#c85a32", rx: -0.55, ry: 0.65, round: 0.02 });
// Grid of 3D Isometric Roman Insulae (warm ochre walls + terracotta roofs)
for (let r = 0; r < 6; r++) {
  for (let c = 0; c < 4; c++) {
    if (r === 1 && (c === 1 || c === 2)) continue; // Leave Forum plaza open
    const bx = (125 + c * 155 + (r % 2) * 28) * sc;
    const by = (210 + r * 155) * sc;
    const bw = (88 + ((r + c) % 3) * 18) * sc;
    const bh = (54 + ((r * c) % 3) * 22) * sc;
    const k = s.spring(0.04 * (r + c), "snappy");
    s.box(bx, by, bw * k, bh * k, bw * k, { fill: "#e6ccb2", rx: -0.55, ry: 0.65, round: 0.02 });
    s.box(bx, by - bh * 0.52 * k, (bw + 8 * sc) * k, 18 * sc * k, (bw + 8 * sc) * k, { fill: (r + c) % 2 === 0 ? "#b84a27" : "#d06036", rx: -0.55, ry: 0.65, round: 0.04 });
  }
}
ctx.restore();
s.sfx("whoosh", 0.15, 0.55);`,
    ],
    [
      'Pilar-pilar kuil marmer berdiri megah di jantung forum peradaban.',
      'kuil marmer',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.48, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#dfd1bd"; ctx.fillRect(0, 0, W, H);
// Close-up isometric Roman Temple & Forum Courtyard
const k = s.spring(0.08, "snappy");
s.box(cx, cy + 75 * sc, 420 * sc * k, 32 * sc * k, 320 * sc * k, { fill: "#cfc0aa", rx: -0.48, ry: 0.6, round: 0.02 });
// Marble pillars row
for (let i = -3; i <= 3; i++) {
  s.cylinder(cx + i * 44 * sc, cy - 10 * sc, 12 * sc * k, 96 * sc * k, { fill: "#f8fafc", rx: -0.35 });
}
// Terracotta Temple Roof Pediment
s.box(cx, cy - 72 * sc, 340 * sc * k, 36 * sc * k, 210 * sc * k, { fill: "#c05621", rx: -0.48, ry: 0.6, round: 0.03 });
s.tag("FORUM ROMANUM · 3D", cx, H * 0.16, { fill: "#c05621", size: Math.round(22 * sc), draw: s.pop(0.25, 0.35) });
s.sfx("pop", 0.18, 0.6);`,
    ],
    [
      'Kamera meluncur rendah menyusuri jalanan batu di antara gedung-gedung kota.',
      'jalanan batu',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.5, sc = Math.min(W / 720, H / 1280);
// Street-level drone fly-through toward the distant Roman Temple (matching 00:05 of kartu-motion.mp4!)
const sky = ctx.createLinearGradient(0, 0, 0, H * 0.45);
sky.addColorStop(0, "#d8cfc2"); sky.addColorStop(1, "#efe9df");
ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H * 0.45);
ctx.fillStyle = "#78716c"; ctx.fillRect(0, H * 0.45, W, H * 0.55);
// Distant marble temple at street vanishing point
ctx.fillStyle = "#f8fafc"; ctx.fillRect(cx - 75 * sc, H * 0.28, 150 * sc, 95 * sc);
ctx.fillStyle = "#c05621"; ctx.beginPath(); ctx.moveTo(cx - 85 * sc, H * 0.28); ctx.lineTo(cx, H * 0.21); ctx.lineTo(cx + 85 * sc, H * 0.28); ctx.closePath(); ctx.fill();
// Left & Right 3D Roman Building Canyon moving past camera
const move = (s.t * 85 * sc) % (140 * sc);
for (let i = 0; i < 4; i++) {
  const depth = (i * 140 * sc + move) / (560 * sc);
  const lx = s.lerp(cx - 95 * sc, -40 * sc, depth);
  const rx = s.lerp(cx + 95 * sc, W + 40 * sc, depth);
  const by = s.lerp(H * 0.38, H * 0.72, depth);
  const bw = (95 + depth * 140) * sc, bh = (120 + depth * 220) * sc;
  s.box(lx, by, bw, bh, bw, { fill: "#dd9b68", round: 0.02 });
  s.box(lx, by - bh * 0.52, bw + 12 * sc, 24 * sc, bw + 12 * sc, { fill: "#b84a27", round: 0.03 });
  s.box(rx, by, bw, bh, bw, { fill: "#d48c58", round: 0.02 });
  s.box(rx, by - bh * 0.52, bw + 12 * sc, 24 * sc, bw + 12 * sc, { fill: "#a83f1e", round: 0.03 });
}
s.sfx("whoosh", 0.1, 0.55);`,
    ],
    [
      'Seluruh skala sejarah hidup kembali dalam diorama Worldforge 3D.',
      'Worldforge 3D.',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.48, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#e6dac8"; ctx.fillRect(0, 0, W, H);
const rot = 0.5 + s.t * 0.22;
s.box(cx, cy + 90 * sc, 420 * sc, 45 * sc, 420 * sc, { fill: "#c2a887", ry: rot, round: 0.03 });
s.cylinder(cx, cy + 10 * sc, 135 * sc, 110 * sc, { fill: "#f4efe6", ry: rot });
s.tag("WORLDFORGE ROMA · 60 FPS", cx, H * 0.17, { fill: "#c05621", size: Math.round(22 * sc), draw: s.pop(0.15, 0.35) });
s.sfx("ding", 0.25, 0.65);`,
    ],
  ],

  // ==========================================================================
  // 5. PRECISION (EXACT MATCH TO RIGHT PANEL OF kartu-motion.mp4)
  // ==========================================================================
  precision: [
    [
      'Cangkang unibody putih terbelah presisi memperlihatkan arsitektur akustik di dalamnya.',
      'terbelah presisi',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.48, sc = Math.min(W / 720, H / 1280);
// Clean off-white studio backdrop (#e8e6e0) matching right panel of kartu-motion.mp4
const bg = ctx.createRadialGradient(cx, cy, 40 * sc, cx, cy, H * 0.65);
bg.addColorStop(0, "#f2f0ec"); bg.addColorStop(1, "#dfdcd4");
ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

// Vertical Exploded-View 6-Layer Acoustic Hardware Assembly
const explode = s.ease.inOut(s.clamp((s.t - 0.1) / 1.4, 0, 1));
const tiltX = -0.32, rotY = s.t * 0.35;
const gap = (34 + explode * 58) * sc;

// 1. Top Silicone Ear Tip
s.cylinder(cx - 18 * sc, cy - gap * 2.5, 48 * sc, 36 * sc, { fill: "#f8fafc", rx: tiltX, ry: rotY });
// 2. Acoustic Mesh Ring
s.cylinder(cx - 14 * sc, cy - gap * 1.6, 26 * sc, 14 * sc, { fill: "#64748b", rx: tiltX, ry: rotY });
// 3. Glossy White Upper Housing Cone
s.cone(cx - 10 * sc, cy - gap * 0.55, 118 * sc, 115 * sc, { fill: "#ffffff", rx: tiltX, ry: rotY });
// 4. Neodymium Magnet Driver Ring
s.cylinder(cx - 6 * sc, cy + gap * 0.55, 68 * sc, 38 * sc, { fill: "#334155", rx: tiltX, ry: rotY });
// 5. Custom Circular Dark PCB Microchip
s.cylinder(cx - 2 * sc, cy + gap * 1.4, 62 * sc, 14 * sc, { fill: "#0f172a", rx: tiltX, ry: rotY });
// 6. Lower Stem & Acoustic Cradle
s.sphere(cx + 6 * sc, cy + gap * 2.4, 98 * sc, { fill: "#f1f5f9", edges: "none" });

// Technical callout leader lines (matching "ACOUSTIC ARCHITECTURE" & "01 SEAMLESS DESIGN")
const kLine1 = s.at(0.65, 0.45);
if (kLine1 > 0.01) {
  const ly = cy + gap * 0.55;
  ctx.strokeStyle = "#475569"; ctx.lineWidth = 1.6 * sc;
  ctx.beginPath(); ctx.moveTo(cx - 74 * sc, ly); ctx.lineTo(cx - (74 + 175 * kLine1) * sc, ly); ctx.stroke();
  ctx.fillStyle = "#0f172a"; ctx.beginPath(); ctx.arc(cx - 74 * sc, ly, 3.5 * sc, 0, Math.PI * 2); ctx.fill();
  ctx.font = "700 " + Math.round(13 * sc) + 'px "JetBrains Mono", monospace'; ctx.textAlign = "left";
  ctx.fillText("ACOUSTIC", cx - 248 * sc, ly - 22 * sc);
  ctx.fillText("ARCHITECTURE", cx - 248 * sc, ly - 5 * sc);
}
s.sfx("whoosh", 0.15, 0.5); s.sfx("click", 0.65, 0.6);`,
    ],
    [
      'Setiap komponen mikro dirancang dengan toleransi nol koma nol dua milimeter.',
      'komponen mikro',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.48, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#e8e6e0"; ctx.fillRect(0, 0, W, H);
const tiltX = -0.38, rotY = 0.8 + s.t * 0.4;
const gap = 92 * sc;
s.cylinder(cx - 24 * sc, cy - gap * 2.4, 48 * sc, 36 * sc, { fill: "#f8fafc", rx: tiltX, ry: rotY });
s.cylinder(cx - 18 * sc, cy - gap * 1.5, 26 * sc, 14 * sc, { fill: "#64748b", rx: tiltX, ry: rotY });
s.cone(cx - 12 * sc, cy - gap * 0.5, 118 * sc, 115 * sc, { fill: "#ffffff", rx: tiltX, ry: rotY });
s.cylinder(cx - 6 * sc, cy + gap * 0.5, 68 * sc, 38 * sc, { fill: "#1e293b", rx: tiltX, ry: rotY });
s.cylinder(cx, cy + gap * 1.35, 64 * sc, 16 * sc, { fill: "#0f172a", rx: tiltX, ry: rotY });
s.sphere(cx + 10 * sc, cy + gap * 2.35, 98 * sc, { fill: "#f1f5f9", edges: "none" });

// Right leader callouts: "01 SEAMLESS DESIGN" & "02 PRECISION ENGINEERED"
const drawLeader = (yOff, num, l1, l2, t0) => {
  const k = s.at(t0, 0.4);
  if (k <= 0.01) return;
  const y = cy + yOff;
  ctx.strokeStyle = "#64748b"; ctx.lineWidth = 1.5 * sc;
  ctx.beginPath(); ctx.moveTo(cx + 68 * sc, y); ctx.lineTo(cx + (68 + 185 * k) * sc, y); ctx.stroke();
  ctx.fillStyle = "#0f172a"; ctx.beginPath(); ctx.arc(cx + 68 * sc, y, 3.5 * sc, 0, Math.PI * 2); ctx.fill();
  ctx.font = "700 " + Math.round(12 * sc) + 'px "JetBrains Mono", monospace'; ctx.textAlign = "right";
  ctx.fillStyle = "#64748b"; ctx.fillText(num, cx + 252 * sc, y - 34 * sc);
  ctx.fillStyle = "#0f172a"; ctx.fillText(l1, cx + 252 * sc, y - 18 * sc);
  ctx.fillText(l2, cx + 252 * sc, y - 3 * sc);
};
drawLeader(-gap * 0.5, "01", "SEAMLESS", "DESIGN", 0.2);
drawLeader(gap * 1.1, "02", "PRECISION", "ENGINEERED", 0.75);
s.sfx("click", 0.25, 0.6); s.sfx("click", 0.8, 0.6);`,
    ],
    [
      'Transduser magnet neodymium dan papan sirkuit mikro bekerja selaras tanpa latensi.',
      'tanpa latensi.',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.46, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#e8e6e0"; ctx.fillRect(0, 0, W, H);
// Close-up zoom on the internal Driver + PCB layers with acoustic wave rings
const kZoom = 1.25 + Math.sin(s.t * 2) * 0.04;
ctx.save(); ctx.translate(cx, cy); ctx.scale(kZoom, kZoom);
for (let i = 0; i < 3; i++) {
  const rp = ((s.t * 0.8 + i * 0.33) % 1);
  ctx.strokeStyle = "rgba(15,23,42," + (1 - rp) * 0.28 + ")"; ctx.lineWidth = 2 * sc;
  ctx.beginPath(); ctx.ellipse(0, 0, (70 + rp * 110) * sc, (32 + rp * 52) * sc, 0, 0, Math.PI * 2); ctx.stroke();
}
s.cylinder(0, -48 * sc, 82 * sc, 44 * sc, { fill: "#1e293b", rx: -0.42, ry: s.t * 0.6 });
s.cylinder(0, 42 * sc, 76 * sc, 18 * sc, { fill: "#0f172a", rx: -0.42, ry: -s.t * 0.6 });
ctx.restore();
s.sfx("sparkle", 0.3, 0.55);`,
    ],
    [
      'Seluruh enam lapisan menyatu kembali menjadi produk berkelas dunia.',
      'menyatu kembali',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.48, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#e8e6e0"; ctx.fillRect(0, 0, W, H);
const join = 1 - s.ease.inOut(s.clamp((s.t - 0.15) / 1.2, 0, 1));
const gap = (12 + join * 78) * sc;
s.cylinder(cx, cy - gap * 2.2, 48 * sc, 34 * sc, { fill: "#f8fafc", rx: -0.32, ry: s.t * 0.4 });
s.cone(cx, cy - gap * 0.5, 118 * sc, 115 * sc, { fill: "#ffffff", rx: -0.32, ry: s.t * 0.4 });
s.cylinder(cx, cy + gap * 0.6, 66 * sc, 32 * sc, { fill: "#334155", rx: -0.32, ry: s.t * 0.4 });
s.sphere(cx, cy + gap * 1.8, 98 * sc, { fill: "#f8fafc", edges: "none" });
s.tag("PRECISION ENGINEERED · 3D", cx, H * 0.17, { fill: "#0f172a", size: Math.round(20 * sc), draw: s.pop(1.1, 0.35) });
s.sfx("whoosh", 0.2, 0.55); s.sfx("click", 1.15, 0.75);`,
    ],
  ],

  // ==========================================================================
  // 6. WORLDFORGE MARS (MARS COLONY BIODOME 3D DIORAMA)
  // ==========================================================================
  worldforge_mars: [
    [
      'Pendaratan pertama di lembah merah Mars membuka era koloni baru.',
      'lembah merah',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.5, sc = Math.min(W / 720, H / 1280);
const bg = ctx.createLinearGradient(0, 0, 0, H);
bg.addColorStop(0, "#4a1c17"); bg.addColorStop(0.5, "#8c3322"); bg.addColorStop(1, "#591d12");
ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
// Mars Biodomes & Solar Arrays
s.sphere(cx - 75 * sc, cy - 20 * sc, 95 * sc * s.spring(0.1, "bouncy"), { fill: "#e2e8f0", edges: "soft" });
s.sphere(cx + 85 * sc, cy + 35 * sc, 72 * sc * s.spring(0.3, "bouncy"), { fill: "#cbd5e1", edges: "soft" });
s.box(cx, cy + 135 * sc, 220 * sc, 28 * sc, 110 * sc, { fill: "#dd6b20", rx: -0.45, ry: 0.6 });
s.tag("MARS COLONY · 2045", cx, H * 0.16, { fill: "#e53e3e", size: Math.round(22 * sc), draw: s.pop(0.2, 0.35) });
s.sfx("whoosh", 0.15, 0.55);`,
    ],
    [
      'Kubah oksigen bertekanan menyuplai energi ke seluruh stasiun riset.',
      'Kubah oksigen',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.48, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#6e2619"; ctx.fillRect(0, 0, W, H);
s.sphere(cx, cy, 135 * sc * s.spring(0.1, "snappy"), { fill: "#38bdf8", edges: "soft" });
s.cylinder(cx - 140 * sc, cy + 65 * sc, 36 * sc, 85 * sc, { fill: "#f8fafc", rx: -0.4 });
s.cylinder(cx + 140 * sc, cy + 65 * sc, 36 * sc, 85 * sc, { fill: "#f8fafc", rx: -0.4 });
s.sfx("pop", 0.2, 0.6);`,
    ],
    [
      'Unit rover otonom bergerak melintasi kawah menuju reaktor utama.',
      'rover otonom',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.5, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#7c2d12"; ctx.fillRect(0, 0, W, H);
const rx = s.lerp(cx - 120 * sc, cx + 80 * sc, s.ease.inOut(s.clamp(s.t / 2.2, 0, 1)));
s.box(rx, cy + 20 * sc, 130 * sc, 54 * sc, 95 * sc, { fill: "#f8fafc", rx: -0.35, ry: 0.5 });
s.cylinder(rx - 45 * sc, cy + 58 * sc, 24 * sc, 24 * sc, { fill: "#1e293b" });
s.cylinder(rx + 45 * sc, cy + 58 * sc, 24 * sc, 24 * sc, { fill: "#1e293b" });
s.sfx("whoosh", 0.2, 0.55);`,
    ],
    [
      'Masa depan umat manusia dibangun di atas permukaan planet merah.',
      'planet merah.',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.48, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#431407"; ctx.fillRect(0, 0, W, H);
s.sphere(cx, cy, 165 * sc * s.spring(0.1, "bouncy"), { fill: "#ea580c", edges: "none" });
s.tag("WORLDFORGE MARS · 3D", cx, H * 0.17, { fill: "#ea580c", size: Math.round(22 * sc), draw: s.pop(0.2, 0.35) });
s.sfx("ding", 0.3, 0.65);`,
    ],
  ],

  // ==========================================================================
  // 7. MIDNIGHT (KREATORLAB DARK LUXURY DATA MOGRAPH)
  // ==========================================================================
  midnight: [
    [
      'Di balik layar gelap Midnight, data terpenting menyala dengan presisi tinggi.',
      'presisi tinggi.',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.45, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#05070d"; ctx.fillRect(0, 0, W, H);
const k = s.spring(0.1, "snappy");
ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
ctx.fillStyle = "rgba(15,23,42,0.86)"; ctx.strokeStyle = "rgba(56,189,248,0.45)"; ctx.lineWidth = 2.5 * sc;
ctx.beginPath(); ctx.roundRect(-235 * sc, -135 * sc, 470 * sc, 270 * sc, 24 * sc); ctx.fill(); ctx.stroke();
const prog = s.ease.out(s.clamp((s.t - 0.2) / 1.5, 0, 1));
ctx.font = "900 " + Math.round(46 * sc) + 'px "JetBrains Mono", monospace'; ctx.fillStyle = "#38bdf8"; ctx.textAlign = "center";
ctx.fillText("+" + Math.round(prog * 240) + "%", 0, -35 * sc);
ctx.strokeStyle = "#10b981"; ctx.lineWidth = 5 * sc; ctx.beginPath();
ctx.moveTo(-180 * sc, 65 * sc); ctx.quadraticCurveTo(-40 * sc, 55 * sc, 180 * sc * prog - 180 * sc * (1 - prog), (65 - 110 * prog) * sc); ctx.stroke();
ctx.restore();
s.sfx("whoosh", 0.15, 0.55); s.sfx("sparkle", 1.1, 0.65);`,
    ],
    [
      'Setiap lonjakan metrik divisualisasikan dengan kurva bercahaya yang halus.',
      'kurva bercahaya',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.45, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#05070d"; ctx.fillRect(0, 0, W, H);
for (let i = 0; i < 3; i++) {
  const k = s.spring(0.12 + i * 0.3, "bouncy");
  const y = cy - 95 * sc + i * 95 * sc;
  ctx.save(); ctx.translate(cx, y); ctx.scale(k, k);
  ctx.fillStyle = "#0f172a"; ctx.strokeStyle = i === 0 ? "#38bdf8" : "#10b981"; ctx.lineWidth = 2 * sc;
  ctx.beginPath(); ctx.roundRect(-220 * sc, -34 * sc, 440 * sc, 68 * sc, 16 * sc); ctx.fill(); ctx.stroke();
  ctx.font = "800 " + Math.round(20 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#f8fafc"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText(["01 · Retensi Audiens 94%", "02 · Konversi Organik 3.8x", "03 · Waktu Produksi -80%"][i], -185 * sc, 0);
  ctx.restore();
}
s.sfx("pop", 0.2, 0.6); s.sfx("pop", 0.5, 0.6); s.sfx("pop", 0.8, 0.6);`,
    ],
    [
      'Tiga indikator kunci menyala berurutan mengikuti ketukan suara narator.',
      'indikator kunci',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.45, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#05070d"; ctx.fillRect(0, 0, W, H);
const sweep = s.ease.out(s.clamp((s.t - 0.1) / 1.5, 0, 1)) * Math.PI * 1.65;
ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 22 * sc; ctx.beginPath(); ctx.arc(cx, cy, 125 * sc, 0, Math.PI * 2); ctx.stroke();
ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 22 * sc; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(cx, cy, 125 * sc, -Math.PI * 0.5, -Math.PI * 0.5 + sweep); ctx.stroke();
ctx.font = "900 " + Math.round(44 * sc) + 'px "JetBrains Mono", monospace'; ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
ctx.fillText(Math.round((sweep / (Math.PI * 1.65)) * 98) + "%", cx, cy);
s.sfx("whoosh", 0.15, 0.55);`,
    ],
    [
      'Standar presentasi eksekutif yang bersih, tenang, dan berwibawa.',
      'berwibawa.',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.45, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#05070d"; ctx.fillRect(0, 0, W, H);
s.tag("MIDNIGHT MOGRAPH · PRO", cx, cy, { fill: "#38bdf8", size: Math.round(26 * sc), draw: s.pop(0.15, 0.35) });
s.sfx("ding", 0.25, 0.7);`,
    ],
  ],

  // ==========================================================================
  // 8. PODCAST (DYNAMIC WAVEFORM & QUOTE HIGHLIGHT CARD)
  // ==========================================================================
  podcast: [
    [
      'Ubah rekaman suara dan obrolan podcast menjadi klip visual yang hidup.',
      'klip visual',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.44, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#0c0a14"; ctx.fillRect(0, 0, W, H);
// Live animated audio spectrum waveform bars
const bars = 24;
for (let i = 0; i < bars; i++) {
  const bx = cx - (bars * 16 * sc) * 0.5 + i * 16 * sc;
  const bh = (24 + Math.abs(Math.sin(s.t * 7 + i * 0.45)) * 95) * sc;
  ctx.fillStyle = i % 2 === 0 ? "#f59e0b" : "#8b5cf6";
  ctx.beginPath(); ctx.roundRect(bx, cy - bh * 0.5, 10 * sc, bh, 5 * sc); ctx.fill();
}
s.tag("🎙️ ON AIR · EPISODE HIGHLIGHT", cx, cy - 135 * sc, { fill: "#f59e0b", size: Math.round(18 * sc), draw: s.pop(0.1, 0.35) });
s.sfx("pop", 0.15, 0.6);`,
    ],
    [
      'Kutipan paling tajam langsung diangkat menjadi kartu sorotan utama.',
      'kutipan',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.44, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#0c0a14"; ctx.fillRect(0, 0, W, H);
const k = s.spring(0.1, "bouncy");
ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
ctx.fillStyle = "#181426"; ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 3 * sc;
ctx.beginPath(); ctx.roundRect(-225 * sc, -95 * sc, 450 * sc, 190 * sc, 24 * sc); ctx.fill(); ctx.stroke();
ctx.font = "900 " + Math.round(24 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
ctx.fillText('"Konsistensi mengalahkan bakat', 0, -18 * sc);
ctx.fillText('saat bakat berhenti bergerak."', 0, 22 * sc);
ctx.restore();
s.sfx("swipe", 0.15, 0.6);`,
    ],
    [
      'Spektrum suara bergerak sinkron dengan setiap kata yang diucapkan.',
      'sinkron',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.44, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#0c0a14"; ctx.fillRect(0, 0, W, H);
for (let r = 0; r < 3; r++) {
  const rad = (75 + r * 42 + Math.sin(s.t * 6 + r) * 12) * sc;
  ctx.strokeStyle = r === 0 ? "#f59e0b" : "rgba(139,92,246,0.45)"; ctx.lineWidth = 4 * sc;
  ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.stroke();
}
s.sfx("pop", 0.2, 0.55);`,
    ],
    [
      'Siap diposting ke Reels, Shorts, dan TikTok dengan kualitas studio.',
      'kualitas studio.',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.44, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#0c0a14"; ctx.fillRect(0, 0, W, H);
s.tag("PODCAST CLIPPER · READY", cx, cy, { fill: "#10b981", size: Math.round(24 * sc), draw: s.pop(0.15, 0.35) });
s.sfx("ding", 0.25, 0.7);`,
    ],
  ],
};

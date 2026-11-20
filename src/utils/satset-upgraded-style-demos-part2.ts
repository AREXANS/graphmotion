/**
 * SatsetMotion Flagship 14 Style Demos — Part 2 (720x1280 Native Layout)
 * Covers: podcast, midnight, worldforge_mars, precision, editorial_motion_grid, voxelverse, studio_3d_room
 * Handcrafted multi-part vector & 3D studio illustrations with distinct SFX cues.
 */

export const UPGRADED_14_STYLE_DEMOS_PART2: Record<string, string> = {
  // 8. PODCAST — Broadcast Studio Condenser Mic, Dual VU Mixing Console, Acoustic Foam Booth & Viral Audio Clip Timeline
  podcast: `const W = s.W || 720, H = s.H || 1280;
const cx = W / 2, cy = 415;
const t = s.time;
const P = { bg: '#0c0806', wall: '#17110d', amber: '#f59e0b', gold: '#fbbf24', coral: '#f97316', green: '#22c55e', red: '#ef4444', chrome: '#e2e8f0', steel: '#64748b', ink: '#090706', cream: '#fef3c7' };

// Warm Acoustic Broadcast Studio Background
ctx.fillStyle = P.bg;
ctx.fillRect(0, 0, W, H);
// Acoustic pyramid foam panel grid on studio wall
ctx.save();
ctx.globalAlpha = 0.24;
for (let r = 0; r < 10; r++) {
  for (let c = 0; c < 8; c++) {
    const px = 44 + c * 84, py = 65 + r * 74;
    ctx.fillStyle = (r + c) % 2 === 0 ? '#1c140e' : '#241a12';
    ctx.fillRect(px, py, 76, 66);
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 38, py + 33); ctx.lineTo(px + 76, py); ctx.closePath();
    ctx.fillStyle = '#2c2017'; ctx.fill();
  }
}
ctx.restore();

// Warm Amber Studio Backlight Glow
const gAmb = ctx.createRadialGradient(cx, cy - 30, 20, cx, cy, 430);
gAmb.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
gAmb.addColorStop(0.55, 'rgba(249, 115, 22, 0.08)');
gAmb.addColorStop(1, 'rgba(12, 8, 6, 0)');
ctx.fillStyle = gAmb;
ctx.fillRect(0, 0, W, H);

// Top Studio Header Bar & ON AIR Sign
const hEnt = E.sp(t, 0.05, 1.0);
ctx.save();
ctx.globalAlpha = hEnt;
D.rr(ctx, 48, 52, W - 96, 56, 16, 'rgba(24, 17, 13, 0.92)', 'rgba(245, 158, 11, 0.35)', 1.5);
const onAirPulse = 0.65 + 0.35 * Math.sin(t * 6);
D.rr(ctx, 64, 64, 112, 32, 8, 'rgba(239, 68, 68, 0.18)', P.red, 1.5);
D.cir(ctx, 82, 80, 6, P.red);
D.glow(ctx, 82, 80, 18 * onAirPulse, P.red, 0.45);
D.txt(ctx, 'ON AIR', 132, 81, 13, '#fecaca', '900', 'center', 'JetBrains Mono, monospace');
D.txt(ctx, 'SATSET STUDIO FM · 48kHz / 24-BIT WAV', W - 72, 81, 12, P.gold, '700', 'right', 'JetBrains Mono, monospace');
ctx.restore();

// SCENE 1 (0.0s - 2.5s): Broadcast Condenser Microphone on Articulated Boom Arm + Pop Filter
if (t < 2.65) {
  const f1 = t < 2.3 ? E.sp(t, 0.05, 0.65) : 1 - E.eio(t, 2.3, 0.35);
  ctx.save();
  ctx.globalAlpha = f1;

  // Articulated Studio Boom Arm coming from top-left
  const armEnt = E.sp(t, 0.1, 0.6);
  ctx.save();
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 14; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(30, 190); ctx.lineTo(190, 145 * armEnt + 40); ctx.lineTo(cx, cy - 115); ctx.stroke();
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(36, 180); ctx.lineTo(188, 136 * armEnt + 40); ctx.lineTo(cx - 4, cy - 122); ctx.stroke();
  D.cir(ctx, 190, 145 * armEnt + 40, 14, '#1e293b', P.amber, 3);
  ctx.restore();

  // Studio Condenser Microphone Assembly
  const micY = cy - 15 + Math.sin(t * 3) * 4;
  // Shockmount Outer Rings
  D.rr(ctx, cx - 76, micY - 20, 152, 92, 24, 'rgba(15,23,42,0.55)', P.steel, 3);
  ctx.strokeStyle = P.amber; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(cx - 74, micY + 5); ctx.lineTo(cx - 44, micY + 35); ctx.moveTo(cx + 74, micY + 5); ctx.lineTo(cx + 44, micY + 35); ctx.stroke();

  // Brass & Matte Black Condenser Capsule Body
  D.rr(ctx, cx - 44, micY - 108, 88, 195, 44, '#1e293b', P.chrome, 3);
  // Upper Gold Mesh Grille Headbasket
  ctx.save();
  ctx.beginPath(); ctx.roundRect(cx - 40, micY - 104, 80, 96, [40, 40, 8, 8]); ctx.clip();
  ctx.fillStyle = '#292018'; ctx.fillRect(cx - 44, micY - 108, 88, 102);
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)'; ctx.lineWidth = 1.6;
  for (let gx = -44; gx <= 44; gx += 8) {
    ctx.beginPath(); ctx.moveTo(cx + gx, micY - 108); ctx.lineTo(cx + gx, micY - 6); ctx.stroke();
  }
  for (let gy = -104; gy <= -8; gy += 8) {
    ctx.beginPath(); ctx.moveTo(cx - 44, micY + gy); ctx.lineTo(cx + 44, micY + gy); ctx.stroke();
  }
  ctx.restore();
  // Chrome Center Collar Ring & Cardioid Emblem
  D.rr(ctx, cx - 45, micY - 14, 90, 16, 4, P.gold, '#fff', 1.5);
  D.cir(ctx, cx, micY + 32, 14, '#0f172a', P.amber, 2);
  D.txt(ctx, 'U87 PRO', cx, micY + 62, 11, P.gold, '800', 'center', 'JetBrains Mono, monospace');

  // Double-Nylon Pop Filter Ring slightly offset
  const popEnt = E.sp(t, 0.35, 0.55);
  ctx.save();
  ctx.translate(cx + 48 * (1 - popEnt), micY - 54);
  ctx.scale(popEnt, popEnt);
  D.cir(ctx, 26, 0, 56, 'rgba(15, 23, 42, 0.58)', '#475569', 5);
  D.cir(ctx, 26, 0, 50, 'rgba(245, 158, 11, 0.08)', P.amber, 1.5);
  ctx.restore();

  // Live Concentric Acoustic Soundwaves & Dual Level Meters
  for (let side = -1; side <= 1; side += 2) {
    for (let b = 0; b < 14; b++) {
      const bh = 16 + Math.abs(Math.sin(t * 9 + b * 0.55 + side)) * (78 - b * 4);
      const bx = cx + side * (108 + b * 14);
      const col = b < 4 ? P.amber : b < 9 ? P.gold : P.green;
      D.rr(ctx, bx - 4, micY - bh / 2, 8, bh, 4, col);
    }
  }

  D.rr(ctx, cx - 220, 625, 440, 74, 18, 'rgba(24, 17, 13, 0.94)', P.amber, 2);
  D.txt(ctx, '1 DETIK PERTAMA PENENTU RETENSI', cx, 653, 18, '#fff', '900', 'center');
  D.txt(ctx, 'HOOK AUDIO JERNIH · TANPA NOISE · KOMPRESI BROADCAST', cx, 678, 12, P.gold, '700', 'center', 'JetBrains Mono, monospace');
  ctx.restore();
}

// SCENE 2 (2.5s - 5.0s): Dual-Host Podcast Split Console & Analog VU Meters
if (t >= 2.35 && t < 5.15) {
  const f2 = t < 4.8 ? E.eio(t, 2.35, 0.35) : 1 - E.eio(t, 4.8, 0.35);
  ctx.save();
  ctx.globalAlpha = f2;

  const hosts = [
    { x: 195, name: 'HOST: RAKA', role: 'Storyteller', col: P.amber, db: '-3.2 dB', active: Math.sin(t * 5) > -0.2 },
    { x: 525, name: 'GUEST: NADIA', role: 'Creator Tech', col: P.green, db: '-4.8 dB', active: Math.cos(t * 5) > 0.1 }
  ];

  hosts.forEach((h, i) => {
    const cEnt = E.sp(t, 2.5 + i * 0.18, 0.65);
    ctx.save();
    ctx.translate(h.x, 325);
    ctx.scale(cEnt, cEnt);
    D.rr(ctx, -135, -135, 270, 275, 24, 'rgba(24, 17, 13, 0.95)', h.col, 2.5);

    // Studio Headphone Avatar Illustration
    D.cir(ctx, 0, -42, 52, '#1f1610', h.col, 2.5);
    // Headphone Band & Earcups
    ctx.strokeStyle = P.chrome; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(0, -44, 58, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
    D.rr(ctx, -68, -54, 16, 34, 7, h.col, '#fff', 1.5);
    D.rr(ctx, 52, -54, 16, 34, 7, h.col, '#fff', 1.5);
    // Stylized Host Face & Mini Boom Mic
    D.cir(ctx, 0, -48, 22, '#fcd34d');
    ctx.beginPath(); ctx.arc(0, -5, 34, Math.PI * 1.15, Math.PI * 1.85); ctx.fillStyle = h.col; ctx.fill();
    D.rr(ctx, 10, -34, 34, 10, 5, '#0f172a', P.gold, 1.5);

    D.txt(ctx, h.name, 0, 42, 17, '#fff', '900', 'center');
    D.txt(ctx, h.role, 0, 64, 12, '#cbd5e1', '600', 'center');

    // Live per-host waveform strip
    for (let k = -9; k <= 9; k++) {
      const wh = 8 + Math.abs(Math.sin(t * 10 + k * 0.6 + i * 2)) * (h.active ? 28 : 10);
      D.rr(ctx, k * 11 - 3, 98 - wh / 2, 6, wh, 3, h.col);
    }
    ctx.restore();
  });

  // Bottom Analog VU Meter & Mixing Desk Faders
  const mEnt = E.sp(t, 2.85, 0.65);
  ctx.save();
  ctx.translate(cx, 595);
  ctx.scale(mEnt, mEnt);
  D.rr(ctx, -300, -85, 600, 175, 22, '#140f0b', 'rgba(245, 158, 11, 0.45)', 2);
  // Warm Backlit Analog VU Dial on Left
  D.rr(ctx, -274, -62, 240, 128, 14, '#fef3c7', P.amber, 2.5);
  ctx.strokeStyle = '#78350f'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(-154, 42, 78, Math.PI * 1.18, Math.PI * 1.82); ctx.stroke();
  D.txt(ctx, '-20   -10   -3    0   +3 dB', -154, -28, 11, '#78350f', '800', 'center', 'JetBrains Mono, monospace');
  D.txt(ctx, 'VU', -154, 12, 18, '#b45309', '900', 'center');
  const needleAng = -0.45 + Math.sin(t * 8) * 0.38;
  ctx.save();
  ctx.translate(-154, 42); ctx.rotate(needleAng);
  ctx.strokeStyle = P.red; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -82); ctx.stroke();
  D.cir(ctx, 0, 0, 6, '#1e293b');
  ctx.restore();

  // 4 Motorized Channel Faders on Right
  for (let f = 0; f < 4; f++) {
    const fx = 28 + f * 66;
    D.rr(ctx, fx - 4, -52, 8, 108, 4, '#090706', '#334155', 1);
    const fy = -10 + Math.sin(t * 3.5 + f * 1.3) * 26;
    D.rr(ctx, fx - 18, fy - 10, 36, 20, 5, f === 0 ? P.amber : P.chrome, '#0f172a', 1.5);
    D.txt(ctx, ['CH1', 'CH2', 'SFX', 'MST'][f], fx, 70, 10, P.gold, '800', 'center', 'JetBrains Mono, monospace');
  }
  ctx.restore();
  ctx.restore();
}

// SCENE 3 (5.0s - 7.5s): Viral Short-Clip Highlighter & Auto-Caption Waveform Cutter
if (t >= 4.85 && t < 7.65) {
  const f3 = t < 7.3 ? E.eio(t, 4.85, 0.35) : 1 - E.eio(t, 7.3, 0.35);
  ctx.save();
  ctx.globalAlpha = f3;

  // Multi-Track Podcast Clipper Card
  D.rr(ctx, 52, 155, W - 104, 340, 26, 'rgba(22, 16, 12, 0.96)', P.amber, 2.5);
  D.txt(ctx, 'AUTO-CLIP VIRAL HIGHLIGHTER', 84, 196, 16, P.gold, '900', 'left', 'JetBrains Mono, monospace');
  D.rr(ctx, W - 210, 176, 134, 30, 8, 'rgba(34, 197, 94, 0.18)', P.green, 1.5);
  D.txt(ctx, 'KLIP #04 · 98% HOOK', W - 143, 196, 11, '#86efac', '800', 'center', 'JetBrains Mono, monospace');

  // Waveform Tracks with Golden Selection Region
  const playX = 110 + ((t - 5.0) / 2.4) * 480;
  D.rr(ctx, 84, 225, W - 168, 150, 16, '#0d0907', '#292018', 1.5);
  // Highlighted Golden Viral Region
  D.rr(ctx, 180, 233, 350, 134, 12, 'rgba(245, 158, 11, 0.16)', P.amber, 2);

  for (let b = 0; b < 44; b++) {
    const bx = 98 + b * 12;
    const inClip = bx >= 180 && bx <= 530;
    const bh = 22 + Math.abs(Math.sin(b * 0.48 + t * 5)) * (inClip ? 88 : 34);
    D.rr(ctx, bx, 300 - bh / 2, 7, bh, 3.5, inClip ? (bx <= playX ? P.gold : P.amber) : '#334155');
  }
  // Playhead Cursor
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(playX, 220); ctx.lineTo(playX, 382); ctx.stroke();
  D.cir(ctx, playX, 220, 7, P.red, '#fff', 2);

  // Word-by-Word Synchronized Karaoke Caption Pills inside Clipper
  const words = ['"Rahasia', 'podcast', 'viral', 'adalah', 'visualisasi', 'suara!"'];
  const activeIdx = Math.min(words.length - 1, Math.floor(((t - 5.0) / 2.2) * words.length));
  words.forEach((w, idx) => {
    const wx = 118 + idx * 86;
    const isAct = idx === activeIdx;
    D.rr(ctx, wx - 38, 412, 78, 36, 10, isAct ? P.amber : '#1c140e', isAct ? '#fff' : '#334155', isAct ? 2 : 1);
    D.txt(ctx, w, wx + 1, 435, 12, isAct ? '#090706' : '#e2e8f0', '800', 'center');
  });

  // 3 Acoustic Metric Cards below
  const stats = [
    { lbl: 'DYNAMIC EQ', val: 'WARM TUBE', col: P.amber },
    { lbl: 'LUFS TARGET', val: '-14.0 LUFS', col: P.green },
    { lbl: 'AUTO B-ROLL', val: 'SYNC AKTIF', col: P.gold }
  ];
  stats.forEach((st, i) => {
    const sx = 148 + i * 212;
    const sEnt = E.sp(t, 5.25 + i * 0.15, 0.55);
    ctx.save();
    ctx.translate(sx, 595); ctx.scale(sEnt, sEnt);
    D.rr(ctx, -95, -55, 190, 110, 18, 'rgba(24, 17, 13, 0.94)', st.col, 2);
    D.txt(ctx, st.lbl, 0, -18, 11, '#94a3b8', '700', 'center', 'JetBrains Mono, monospace');
    D.txt(ctx, st.val, 0, 18, 19, st.col, '900', 'center');
    ctx.restore();
  });
  ctx.restore();
}

// SCENE 4 (7.5s - 10.0s): Podcast Distribution Hub (Spotify, Apple Podcasts, YouTube Shorts)
if (t >= 7.35) {
  const f4 = E.sp(t, 7.4, 0.7);
  ctx.save();
  ctx.globalAlpha = f4;

  // Spinning Vinyl & Gold Master Badge
  const vY = 325;
  D.glow(ctx, cx, vY, 170, P.amber, 0.32);
  D.cir(ctx, cx, vY, 118, '#14100c', P.gold, 3.5);
  for (let r = 48; r <= 104; r += 14) {
    D.cir(ctx, cx, vY, r, null, 'rgba(251, 191, 36, 0.22)', 1.2);
  }
  D.cir(ctx, cx, vY, 38, P.amber, '#fff', 2.5);
  D.cir(ctx, cx, vY, 10, '#0c0806');

  // Platform Distribution Cards
  const plats = [
    { y: 500, title: 'SPOTIFY VIDEO PODCAST', sub: 'Master Audio + Canvas 9:16 Ready', col: P.green },
    { y: 582, title: 'YOUTUBE SHORTS & REELS', sub: 'Auto-Cut 60s Hook + Karaoke Captions', col: P.amber }
  ];
  plats.forEach((pl, i) => {
    const pEnt = E.sp(t, 7.65 + i * 0.18, 0.6);
    ctx.save();
    ctx.translate(cx, pl.y); ctx.scale(pEnt, pEnt);
    D.rr(ctx, -260, -32, 520, 68, 18, 'rgba(24, 17, 13, 0.95)', pl.col, 2);
    D.cir(ctx, -218, 2, 16, pl.col);
    D.txt(ctx, '✓', -218, 8, 16, '#090706', '900', 'center');
    D.txt(ctx, pl.title, -184, -4, 16, '#fff', '900', 'left');
    D.txt(ctx, pl.sub, -184, 18, 12, '#cbd5e1', '600', 'left');
    ctx.restore();
  });

  // CTA Pill
  const pulse = 1 + Math.sin(t * 6) * 0.03;
  ctx.save();
  ctx.translate(cx, 678); ctx.scale(pulse, pulse);
  D.rr(ctx, -210, -28, 420, 56, 28, P.amber, '#fff', 2);
  D.txt(ctx, 'PUBLIKASI EPISODE VIRAL SEKARANG', 0, 7, 16, '#090706', '900', 'center');
  ctx.restore();
  ctx.restore();
}

// SFX Cues
if (t < 0.08) s.sfx('pop', 0.45);
if (t >= 2.48 && t < 2.56) s.sfx('whoosh', 0.42);
if (t >= 4.98 && t < 5.06) s.sfx('chime', 0.45);
if (t >= 7.48 && t < 7.56) s.sfx('ding', 0.5);`,

  // 9. MIDNIGHT — Executive Dark Bento Analytics, Glowing Crescent Telemetry, Live Spline Terminal & Vault Matrix
  midnight: `const W = s.W || 720, H = s.H || 1280;
const cx = W / 2, cy = 415;
const t = s.time;
const P = { bg: '#040711', card: '#0b1120', border: '#1e293b', indigo: '#6366f1', violet: '#8b5cf6', cyan: '#38bdf8', emerald: '#10b981', silver: '#f8fafc', muted: '#94a3b8' };

// Deep Obsidian Midnight Gradient & Subtle Precision Grid
const bgG = ctx.createLinearGradient(0, 0, 0, H);
bgG.addColorStop(0, '#03050c');
bgG.addColorStop(0.5, '#070b18');
bgG.addColorStop(1, '#020409');
ctx.fillStyle = bgG;
ctx.fillRect(0, 0, W, H);
D.grid(ctx, W, H, 48, 'rgba(99, 102, 241, 0.07)');

// Ambient Indigo & Cyan Nebula Halos
D.glow(ctx, cx - 120, 250, 320, P.indigo, 0.22);
D.glow(ctx, cx + 140, 520, 290, P.cyan, 0.16);

// Top Executive Telemetry Bar
D.rr(ctx, 48, 52, W - 96, 52, 14, 'rgba(11, 17, 32, 0.88)', 'rgba(99, 102, 241, 0.35)', 1.5);
D.cir(ctx, 74, 78, 5, P.cyan);
D.txt(ctx, 'MIDNIGHT OS // DEEP FOCUS TELEMETRY', 92, 83, 12, P.silver, '800', 'left', 'JetBrains Mono, monospace');
D.txt(ctx, '02:41:19 UTC', W - 70, 83, 12, P.cyan, '700', 'right', 'JetBrains Mono, monospace');

// SCENE 1 (0.0s - 2.5s): Precision Lunar Chronometer & Deep Work Focus Dial
if (t < 2.65) {
  const f1 = t < 2.3 ? E.sp(t, 0.05, 0.65) : 1 - E.eio(t, 2.3, 0.35);
  ctx.save();
  ctx.globalAlpha = f1;

  // Outer Glass Chronometer Ring
  const dialY = 365;
  D.cir(ctx, cx, dialY, 175, 'rgba(11, 17, 32, 0.92)', 'rgba(99, 102, 241, 0.45)', 2.5);
  // 60 Precision Tick Marks around Chronometer
  for (let i = 0; i < 60; i++) {
    const ang = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const isMaj = i % 5 === 0;
    const r1 = isMaj ? 148 : 155, r2 = 164;
    ctx.strokeStyle = i / 60 <= E.eio(t, 0.2, 1.8) ? P.cyan : 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = isMaj ? 2.5 : 1.2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * r1, dialY + Math.sin(ang) * r1);
    ctx.lineTo(cx + Math.cos(ang) * r2, dialY + Math.sin(ang) * r2);
    ctx.stroke();
  }

  // Animated Progress Arc
  const prog = E.eio(t, 0.15, 1.8) * 0.88;
  ctx.strokeStyle = P.indigo; ctx.lineWidth = 10; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(cx, dialY, 134, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog); ctx.stroke();

  // Handcrafted Crescent Moon & Star Cluster inside Chronometer
  ctx.save();
  ctx.translate(cx, dialY - 18);
  D.glow(ctx, 0, 0, 95, P.cyan, 0.35);
  ctx.fillStyle = P.silver;
  ctx.beginPath(); ctx.arc(0, 0, 46, 0.3, Math.PI * 1.85);
  ctx.arc(18, -14, 38, Math.PI * 1.85, 0.3, true);
  ctx.closePath(); ctx.fill();
  D.star(ctx, 42, -24, 9, 4, 4, P.cyan);
  D.star(ctx, -48, 22, 6, 2.5, 4, P.violet);
  ctx.restore();

  D.txt(ctx, 'FLOW STATE: 98.4%', cx, dialY + 68, 18, '#fff', '900', 'center', 'JetBrains Mono, monospace');
  D.txt(ctx, 'ZERO DISTRACTION PROTOCOL', cx, dialY + 92, 11, P.cyan, '700', 'center', 'JetBrains Mono, monospace');

  // Bottom Executive Summary Card
  D.rr(ctx, 64, 585, W - 128, 104, 20, 'rgba(11, 17, 32, 0.94)', P.indigo, 2);
  D.txt(ctx, 'EKSEKUSI SUNYI · HASIL MAKSIMAL', cx, 628, 20, '#fff', '900', 'center');
  D.txt(ctx, 'Arsitektur visual high-contrast untuk produk SaaS & AI modern', cx, 658, 13, P.muted, '500', 'center');
  ctx.restore();
}

// SCENE 2 (2.5s - 5.0s): Executive Bento Analytics Grid & Real-Time Spline Curve
if (t >= 2.35 && t < 5.15) {
  const f2 = t < 4.8 ? E.eio(t, 2.35, 0.35) : 1 - E.eio(t, 4.8, 0.35);
  ctx.save();
  ctx.globalAlpha = f2;

  // Main Hero Spline Card (Top Bento)
  const b1 = E.sp(t, 2.45, 0.6);
  ctx.save();
  ctx.translate(cx, 285); ctx.scale(b1, b1);
  D.rr(ctx, -304, -145, 608, 290, 24, 'rgba(11, 17, 32, 0.95)', 'rgba(56, 189, 248, 0.45)', 2);
  D.txt(ctx, 'NEURAL THROUGHPUT · REALTIME', -270, -104, 13, P.cyan, '800', 'left', 'JetBrains Mono, monospace');
  D.txt(ctx, '+412.8%', 270, -100, 26, P.emerald, '900', 'right', 'JetBrains Mono, monospace');

  // Glowing Area Spline Chart
  const pts = [
    [-265, 82], [-180, 54], [-95, 68], [-10, -8], [85, 14], [175, -58], [265, -88]
  ];
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0], 105);
  pts.forEach((p, idx) => {
    const py = p[1] + Math.sin(t * 4 + idx) * 6;
    ctx.lineTo(p[0], py);
  });
  ctx.lineTo(pts[pts.length - 1][0], 105);
  ctx.closePath();
  const areaG = ctx.createLinearGradient(0, -90, 0, 105);
  areaG.addColorStop(0, 'rgba(56, 189, 248, 0.38)');
  areaG.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
  ctx.fillStyle = areaG; ctx.fill();

  ctx.strokeStyle = P.cyan; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath();
  pts.forEach((p, idx) => {
    const py = p[1] + Math.sin(t * 4 + idx) * 6;
    if (idx === 0) ctx.moveTo(p[0], py); else ctx.lineTo(p[0], py);
  });
  ctx.stroke();
  pts.forEach((p, idx) => {
    const py = p[1] + Math.sin(t * 4 + idx) * 6;
    D.cir(ctx, p[0], py, 6, '#040711', P.cyan, 3);
  });
  ctx.restore();
  ctx.restore();

  // Bottom 2 Bento Cards
  const cards = [
    { x: 202, title: 'LATENCY P99', val: '4.2 ms', sub: 'Edge Ultra-Low', col: P.indigo },
    { x: 518, title: 'UPTIME SLA', val: '99.99%', sub: 'Zero Packet Loss', col: P.emerald }
  ];
  cards.forEach((c, i) => {
    const cEnt = E.sp(t, 2.75 + i * 0.16, 0.6);
    ctx.save();
    ctx.translate(c.x, 565); ctx.scale(cEnt, cEnt);
    D.rr(ctx, -146, -98, 292, 196, 22, 'rgba(11, 17, 32, 0.95)', c.col, 2);
    D.txt(ctx, c.title, -114, -54, 12, P.muted, '800', 'left', 'JetBrains Mono, monospace');
    D.txt(ctx, c.val, -114, 6, 38, '#fff', '900', 'left', 'JetBrains Mono, monospace');
    D.rr(ctx, -114, 34, 170, 30, 8, 'rgba(255,255,255,0.05)', c.col, 1);
    D.txt(ctx, c.sub, -29, 54, 12, c.col, '700', 'center', 'JetBrains Mono, monospace');
    ctx.restore();
  });
  ctx.restore();
}

// SCENE 3 (5.0s - 7.5s): Isometric Glass Server Rack & Neural Node Constellation
if (t >= 4.85 && t < 7.65) {
  const f3 = t < 7.3 ? E.eio(t, 4.85, 0.35) : 1 - E.eio(t, 7.3, 0.35);
  ctx.save();
  ctx.globalAlpha = f3;

  // 3 Stacked Isometric Midnight Blade Servers
  for (let layer = 2; layer >= 0; layer--) {
    const lEnt = E.sp(t, 5.0 + (2 - layer) * 0.16, 0.65);
    const ly = 265 + layer * 98 + Math.sin(t * 3 + layer) * 4;
    ctx.save();
    ctx.translate(cx, ly); ctx.scale(lEnt, lEnt);
    // Isometric Diamond Top Plate
    ctx.beginPath();
    ctx.moveTo(0, -56); ctx.lineTo(220, 0); ctx.lineTo(0, 56); ctx.lineTo(-220, 0); ctx.closePath();
    ctx.fillStyle = '#0f172a'; ctx.fill();
    ctx.strokeStyle = layer === 0 ? P.cyan : P.indigo; ctx.lineWidth = 2.5; ctx.stroke();
    // Left & Right Chassis Thickness
    ctx.beginPath();
    ctx.moveTo(-220, 0); ctx.lineTo(0, 56); ctx.lineTo(0, 84); ctx.lineTo(-220, 28); ctx.closePath();
    ctx.fillStyle = '#090d1a'; ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(220, 0); ctx.lineTo(0, 56); ctx.lineTo(0, 84); ctx.lineTo(220, 28); ctx.closePath();
    ctx.fillStyle = '#131c33'; ctx.fill(); ctx.stroke();

    // Glowing LED Blade Indicators
    for (let led = 0; led < 6; led++) {
      const lx = -140 + led * 26, ldy = 22 + led * 6.5;
      D.cir(ctx, lx, ldy, 4, led % 2 === 0 ? P.cyan : P.emerald);
    }
    D.txt(ctx, ['CORE-01 // AI ENGINE', 'CORE-02 // VECTOR DB', 'CORE-03 // EDGE CACHE'][layer], 0, 4, 13, '#fff', '800', 'center', 'JetBrains Mono, monospace');
    ctx.restore();
  }

  D.rr(ctx, 74, 590, W - 148, 88, 18, 'rgba(11, 17, 32, 0.94)', P.cyan, 2);
  D.txt(ctx, 'ENKRIPSI QUANTUM · ARSITEKTUR ZERO-TRUST', cx, 628, 16, '#fff', '900', 'center');
  D.txt(ctx, 'Sinkronisasi klaster otomatis dalam 12 milidetik', cx, 654, 13, P.cyan, '700', 'center', 'JetBrains Mono, monospace');
  ctx.restore();
}

// SCENE 4 (7.5s - 10.0s): Midnight Command Vault Lock & Final Status
if (t >= 7.35) {
  const f4 = E.sp(t, 7.4, 0.7);
  ctx.save();
  ctx.globalAlpha = f4;

  const vy = 355;
  D.glow(ctx, cx, vy, 220, P.indigo, 0.38);
  D.cir(ctx, cx, vy, 136, 'rgba(11, 17, 32, 0.96)', P.cyan, 3);
  D.cir(ctx, cx, vy, 108, null, P.indigo, 2);

  // Hexagonal Security Shield Core
  ctx.save();
  ctx.translate(cx, vy);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(a) * 64, py = Math.sin(a) * 64;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(99, 102, 241, 0.22)'; ctx.fill();
  ctx.strokeStyle = P.cyan; ctx.lineWidth = 3; ctx.stroke();
  D.txt(ctx, '✓', 0, 14, 42, P.emerald, '900', 'center');
  ctx.restore();

  D.rr(ctx, 64, 540, W - 128, 152, 24, 'rgba(11, 17, 32, 0.95)', P.indigo, 2.5);
  D.txt(ctx, 'MIDNIGHT PROTOCOL READY', cx, 588, 22, '#fff', '900', 'center', 'JetBrains Mono, monospace');
  D.txt(ctx, 'Estetika Dark-Mode Kelas Enterprise Tanpa Kompromi', cx, 618, 14, P.muted, '600', 'center');
  D.rr(ctx, cx - 170, 636, 340, 38, 19, P.indigo, P.cyan, 1.5);
  D.txt(ctx, 'AKTIFKAN MODE EKSEKUTIF →', cx, 660, 13, '#fff', '900', 'center', 'JetBrains Mono, monospace');
  ctx.restore();
}

// SFX Cues
if (t < 0.08) s.sfx('chime', 0.42);
if (t >= 2.48 && t < 2.56) s.sfx('whoosh', 0.4);
if (t >= 4.98 && t < 5.06) s.sfx('click', 0.45);
if (t >= 7.48 && t < 7.56) s.sfx('ding', 0.48);`,

  // 10. WORLDFORGE MARS — Martian Canyon Terrain, 6-Wheel Perseverance Rover, Biodome Habitat & Orbital Landing HUD
  worldforge_mars: `const W = s.W || 720, H = s.H || 1280;
const cx = W / 2, cy = 415;
const t = s.time;
const P = { skyTop: '#160704', skyBot: '#451609', rust: '#c2410c', terracotta: '#ea580c', amber: '#f59e0b', sand: '#fdba74', cyan: '#38bdf8', green: '#22c55e', hull: '#e2e8f0', slate: '#334155' };

// Martian Atmospheric Sky & Twin Moons (Phobos & Deimos)
const skyG = ctx.createLinearGradient(0, 0, 0, H);
skyG.addColorStop(0, P.skyTop);
skyG.addColorStop(0.55, P.skyBot);
skyG.addColorStop(1, '#1c0905');
ctx.fillStyle = skyG;
ctx.fillRect(0, 0, W, H);

// Distant Sun & Twin Moons
D.glow(ctx, 560, 175, 160, P.amber, 0.35);
D.cir(ctx, 560, 175, 34, '#fef3c7', P.amber, 2);
D.cir(ctx, 145, 145, 16, '#d6d3d1', '#78716c', 1.5);
D.cir(ctx, 215, 110, 8, '#a8a29e');

// Layered Valles Marineris Martian Canyon Ridges
ctx.fillStyle = '#5c1d0c';
ctx.beginPath();
ctx.moveTo(0, 490); ctx.lineTo(130, 425); ctx.lineTo(270, 460); ctx.lineTo(430, 395); ctx.lineTo(590, 445); ctx.lineTo(W, 410); ctx.lineTo(W, 760); ctx.lineTo(0, 760); ctx.closePath();
ctx.fill();

ctx.fillStyle = '#3b1106';
ctx.beginPath();
ctx.moveTo(0, 565); ctx.lineTo(180, 520); ctx.lineTo(390, 555); ctx.lineTo(550, 505); ctx.lineTo(W, 540); ctx.lineTo(W, 790); ctx.lineTo(0, 790); ctx.closePath();
ctx.fill();

// Top Orbital Telemetry HUD Frame
ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)'; ctx.lineWidth = 1.5;
ctx.strokeRect(42, 48, W - 84, 52);
D.txt(ctx, 'ARES-VII // JEZERO CRATER TELEMETRY', 62, 79, 13, P.amber, '800', 'left', 'JetBrains Mono, monospace');
D.txt(ctx, 'SOL 418 · -62°C · CO2 95.3%', W - 62, 79, 12, P.cyan, '700', 'right', 'JetBrains Mono, monospace');

// SCENE 1 (0.0s - 2.5s): Orbital Entry Capsule & Red Planet Topographic Globe Scan
if (t < 2.65) {
  const f1 = t < 2.3 ? E.sp(t, 0.05, 0.65) : 1 - E.eio(t, 2.3, 0.35);
  ctx.save();
  ctx.globalAlpha = f1;

  const gy = 345;
  D.glow(ctx, cx, gy, 210, P.terracotta, 0.4);
  // Handcrafted Red Planet Globe with Crater Contours & Polar Ice Cap
  D.cir(ctx, cx, gy, 135, '#9a3412', P.amber, 3);
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, gy, 133, 0, Math.PI * 2); ctx.clip();
  // Polar Ice Cap
  D.cir(ctx, cx, gy - 125, 58, '#fff7ed');
  // Olympus Mons & Canyon Bands
  ctx.fillStyle = '#7c2d12';
  ctx.fillRect(cx - 140, gy - 35, 280, 28);
  ctx.fillRect(cx - 110, gy + 28, 240, 22);
  D.cir(ctx, cx - 42, gy - 15, 26, '#b45309', P.amber, 1.5);
  D.cir(ctx, cx + 52, gy + 34, 18, '#7c2d12', P.sand, 1.2);
  // Latitude / Longitude Hologram Grid
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)'; ctx.lineWidth = 1.2;
  for (let lat = -80; lat <= 80; lat += 40) {
    ctx.beginPath(); ctx.moveTo(cx - 135, gy + lat); ctx.lineTo(cx + 135, gy + lat); ctx.stroke();
  }
  ctx.restore();

  // Orbiting Reconnaissance Satellite Ring
  ctx.strokeStyle = P.cyan; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
  ctx.beginPath(); ctx.ellipse(cx, gy, 195, 58, -0.25, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  const satAng = t * 2.2;
  const sx = cx + Math.cos(satAng) * 195, sy = gy + Math.sin(satAng) * 58;
  D.rr(ctx, sx - 22, sy - 6, 44, 12, 3, P.cyan, '#fff', 1);
  D.cir(ctx, sx, sy, 8, P.amber, '#fff', 2);

  D.rr(ctx, 64, 575, W - 128, 108, 20, 'rgba(22, 7, 4, 0.92)', P.amber, 2);
  D.txt(ctx, 'KOLONISASI MARS · ERA TERRAFORMING', cx, 618, 19, '#fff', '900', 'center');
  D.txt(ctx, 'Simulasi topografi kawah & pendaratan presisi otonom', cx, 648, 13, P.sand, '600', 'center');
  ctx.restore();
}

// SCENE 2 (2.5s - 5.0s): 6-Wheel Perseverance Mars Rover & Laser Spectrometer Mast
if (t >= 2.35 && t < 5.15) {
  const f2 = t < 4.8 ? E.eio(t, 2.35, 0.35) : 1 - E.eio(t, 4.8, 0.35);
  ctx.save();
  ctx.globalAlpha = f2;

  const rEnt = E.sp(t, 2.45, 0.65);
  const rx = cx - 20 + Math.sin(t * 2) * 12, ry = 435;
  ctx.save();
  ctx.translate(rx, ry); ctx.scale(rEnt, rEnt);

  // Rocker-Bogie Titanium Suspension Struts
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-135, 58); ctx.lineTo(-75, 12); ctx.lineTo(0, 58);
  ctx.moveTo(-75, 12); ctx.lineTo(45, -18); ctx.lineTo(135, 58);
  ctx.stroke();

  // Rover Chassis Body & RTG Power Source
  D.rr(ctx, -115, -58, 210, 68, 14, P.hull, '#475569', 3);
  D.rr(ctx, -95, -44, 170, 40, 8, '#f59e0b', '#78350f', 1.5); // Gold thermal blanket
  // Rear RTG Finned Nuclear Cylinder
  D.rr(ctx, -155, -72, 46, 56, 8, '#334155', P.amber, 2);

  // Camera Mast & ChemCam Laser Head
  D.rr(ctx, 62, -165, 16, 110, 6, P.hull, '#475569', 2);
  D.rr(ctx, 38, -195, 68, 38, 10, P.hull, '#1e293b', 2.5);
  D.cir(ctx, 56, -176, 10, '#0f172a', P.cyan, 2.5);
  D.cir(ctx, 86, -176, 8, '#0f172a', '#ef4444', 2);

  // Active Red Laser Beam scanning Martian Core Sample Rock
  const laserOn = Math.sin(t * 14) > -0.3;
  if (laserOn) {
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(94, -176); ctx.lineTo(225, 42); ctx.stroke();
    D.glow(ctx, 225, 42, 48, '#ef4444', 0.65);
  }
  // Martian Basalt Rock Target
  ctx.fillStyle = '#7c2d12';
  ctx.beginPath(); ctx.moveTo(190, 74); ctx.lineTo(215, 28); ctx.lineTo(258, 38); ctx.lineTo(272, 74); ctx.closePath(); ctx.fill();

  // 3 Heavy Cleated Aluminum Rover Wheels
  [-135, 0, 135].forEach((wx) => {
    D.cir(ctx, wx, 58, 36, '#1e293b', P.hull, 4);
    D.cir(ctx, wx, 58, 14, P.amber, '#0f172a', 2);
  });
  ctx.restore();

  // Mineral Analysis Readout Card
  D.rr(ctx, 64, 575, W - 128, 108, 20, 'rgba(22, 7, 4, 0.94)', P.cyan, 2);
  D.txt(ctx, 'CHEMCAM SPECTROMETER // SAMPLE #19', cx, 614, 15, P.cyan, '900', 'center', 'JetBrains Mono, monospace');
  D.txt(ctx, 'SILIKA 44% · FE2O3 18% · JEJAK HIDRASI TERDETEKSI', cx, 646, 14, '#fff', '800', 'center');
  ctx.restore();
}

// SCENE 3 (5.0s - 7.5s): Pressurized Geodesic Biodome Habitat & Solar Array Farm
if (t >= 4.85 && t < 7.65) {
  const f3 = t < 7.3 ? E.eio(t, 4.85, 0.35) : 1 - E.eio(t, 7.3, 0.35);
  ctx.save();
  ctx.globalAlpha = f3;

  const dy = 445;
  const dEnt = E.sp(t, 4.95, 0.65);
  ctx.save();
  ctx.translate(cx, dy); ctx.scale(dEnt, dEnt);

  // Pressurized Geodesic Glass Biodome Arch
  ctx.beginPath(); ctx.arc(0, 0, 165, Math.PI, 0); ctx.closePath();
  const domeG = ctx.createRadialGradient(0, -60, 20, 0, -40, 175);
  domeG.addColorStop(0, 'rgba(34, 197, 94, 0.28)');
  domeG.addColorStop(0.7, 'rgba(56, 189, 248, 0.22)');
  domeG.addColorStop(1, 'rgba(255, 255, 255, 0.35)');
  ctx.fillStyle = domeG; ctx.fill();
  ctx.strokeStyle = P.cyan; ctx.lineWidth = 3; ctx.stroke();

  // Geodesic Triangle Strut Lattice
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.35)'; ctx.lineWidth = 1.5;
  for (let x = -120; x <= 120; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x * 0.55, -145); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(-148, -65); ctx.lineTo(148, -65); ctx.moveTo(-112, -120); ctx.lineTo(112, -120); ctx.stroke();

  // Hydroponic Green Trees & Oxygen Towers Inside Biodome
  D.rr(ctx, -18, -95, 36, 95, 10, P.hull, P.cyan, 2);
  D.cir(ctx, -78, -36, 28, P.green);
  D.cir(ctx, 78, -36, 28, P.green);
  D.rr(ctx, -83, -18, 10, 18, 3, '#78350f');
  D.rr(ctx, 73, -18, 10, 18, 3, '#78350f');

  // Airlock Base Foundation & Solar Wings
  D.rr(ctx, -195, -12, 390, 36, 10, '#334155', P.amber, 2.5);
  D.rr(ctx, -38, -38, 76, 50, 10, P.hull, '#0f172a', 2);
  ctx.restore();

  // 3 Colony Life-Support Gauges
  const gauges = [
    { lbl: 'O2 LEVEL', val: '21.4%', col: P.cyan },
    { lbl: 'HYDROPONIC', val: '+100% AKTIF', col: P.green },
    { lbl: 'SOLAR GRID', val: '1.8 MW', col: P.amber }
  ];
  gauges.forEach((g, i) => {
    const gx = 148 + i * 212;
    D.rr(ctx, gx - 94, 560, 188, 106, 18, 'rgba(22, 7, 4, 0.94)', g.col, 2);
    D.txt(ctx, g.lbl, gx, 598, 11, P.sand, '700', 'center', 'JetBrains Mono, monospace');
    D.txt(ctx, g.val, gx, 634, 21, g.col, '900', 'center');
  });
  ctx.restore();
}

// SCENE 4 (7.5s - 10.0s): Starship Interplanetary Ascent & Mission Accomplished
if (t >= 7.35) {
  const f4 = E.sp(t, 7.4, 0.7);
  ctx.save();
  ctx.globalAlpha = f4;

  const rY = 335 - ((t - 7.35) * 18);
  // Thrust Plume
  D.glow(ctx, cx, rY + 135, 140, P.amber, 0.65);
  ctx.fillStyle = '#fef08a';
  ctx.beginPath(); ctx.moveTo(cx - 24, rY + 85); ctx.lineTo(cx + 24, rY + 85); ctx.lineTo(cx, rY + 185 + Math.sin(t * 25) * 18); ctx.closePath(); ctx.fill();

  // Stainless Steel Starship Spacecraft
  ctx.save();
  ctx.translate(cx, rY);
  ctx.fillStyle = P.hull; ctx.strokeStyle = '#475569'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -115);
  ctx.quadraticCurveTo(38, -65, 38, 75);
  ctx.lineTo(-38, 75);
  ctx.quadraticCurveTo(-38, -65, 0, -115);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // Forward & Aft Landing Fins
  ctx.fillStyle = '#1e293b';
  ctx.beginPath(); ctx.moveTo(-38, 25); ctx.lineTo(-74, 82); ctx.lineTo(-38, 75); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(38, 25); ctx.lineTo(74, 82); ctx.lineTo(38, 75); ctx.closePath(); ctx.fill();
  // Porthole Windows
  D.cir(ctx, 0, -35, 11, P.cyan, '#0f172a', 2);
  D.cir(ctx, 0, -6, 11, P.cyan, '#0f172a', 2);
  ctx.restore();

  D.rr(ctx, 64, 548, W - 128, 142, 24, 'rgba(22, 7, 4, 0.95)', P.amber, 2.5);
  D.txt(ctx, 'WORLDFORGE MARS // MISI SUKSES', cx, 594, 21, '#fff', '900', 'center');
  D.txt(ctx, 'Visualisasi Sci-Fi & Koloni Planet Kelas Sinematik', cx, 622, 13, P.sand, '600', 'center');
  D.rr(ctx, cx - 180, 638, 360, 38, 19, P.terracotta, '#fff', 1.5);
  D.txt(ctx, 'LUNCURKAN SIMULASI PLANET →', cx, 662, 13, '#fff', '900', 'center', 'JetBrains Mono, monospace');
  ctx.restore();
}

// SFX Cues
if (t < 0.08) s.sfx('whoosh', 0.45);
if (t >= 2.48 && t < 2.56) s.sfx('click', 0.42);
if (t >= 4.98 && t < 5.06) s.sfx('chime', 0.45);
if (t >= 7.48 && t < 7.56) s.sfx('boing', 0.48);`,

  // 11. PRECISION — Swiss Horology Tourbillon Caliper Blueprint, Golden Ratio Spiral & Sub-Pixel CAD Inspector
  precision: `const W = s.W || 720, H = s.H || 1280;
const cx = W / 2, cy = 415;
const t = s.time;
const P = { bg: '#070b12', blueprint: '#0d1726', cyan: '#06b6d4', gold: '#f59e0b', red: '#ef4444', emerald: '#10b981', white: '#f8fafc', slate: '#64748b' };

// Swiss CAD Blueprint Background & Dual Sub-Millimeter Grid
ctx.fillStyle = P.bg;
ctx.fillRect(0, 0, W, H);
D.grid(ctx, W, H, 24, 'rgba(6, 182, 212, 0.05)');
D.grid(ctx, W, H, 96, 'rgba(6, 182, 212, 0.13)');

// Outer Technical Drafting Frame & Corner Reticles
ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)'; ctx.lineWidth = 1.5;
ctx.strokeRect(36, 44, W - 72, 680);
D.txt(ctx, 'ISO-9001 // SWISS CAD PRECISION ENGINE', 56, 72, 12, P.cyan, '800', 'left', 'JetBrains Mono, monospace');
D.txt(ctx, 'TOLERANCE: ±0.001mm', W - 56, 72, 12, P.gold, '800', 'right', 'JetBrains Mono, monospace');

// SCENE 1 (0.0s - 2.5s): Vernier Caliper Micrometer & Laser Target Lock
if (t < 2.65) {
  const f1 = t < 2.3 ? E.sp(t, 0.05, 0.65) : 1 - E.eio(t, 2.3, 0.35);
  ctx.save();
  ctx.globalAlpha = f1;

  const ty = 355;
  // Rotating Dual-Vernier Protractor Rings
  ctx.save();
  ctx.translate(cx, ty);
  ctx.rotate(t * 0.35);
  D.cir(ctx, 0, 0, 165, null, P.cyan, 2);
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const len = i % 6 === 0 ? 18 : 8;
    ctx.strokeStyle = i % 6 === 0 ? P.gold : P.cyan;
    ctx.lineWidth = i % 6 === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (165 - len), Math.sin(a) * (165 - len));
    ctx.lineTo(Math.cos(a) * 165, Math.sin(a) * 165);
    ctx.stroke();
  }
  ctx.restore();

  // Animated Digital Caliper Jaws clamping on a Titanium Gear Core
  const jawGap = 72 + (1 - E.eio(t, 0.2, 1.2)) * 65;
  D.rr(ctx, cx - jawGap - 54, ty - 75, 54, 150, 8, '#1e293b', P.cyan, 2);
  D.rr(ctx, cx + jawGap, ty - 75, 54, 150, 8, '#1e293b', P.cyan, 2);
  // Dimension Arrow Line
  ctx.strokeStyle = P.gold; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - jawGap, ty - 102); ctx.lineTo(cx + jawGap, ty - 102); ctx.stroke();
  D.txt(ctx, (jawGap * 2).toFixed(2) + ' mm', cx, ty - 114, 14, P.gold, '900', 'center', 'JetBrains Mono, monospace');

  // Precision Machined Core
  D.cir(ctx, cx, ty, 68, 'rgba(6, 182, 212, 0.14)', P.gold, 2.5);
  D.cir(ctx, cx, ty, 28, '#070b12', P.cyan, 2);
  ctx.strokeStyle = P.red; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - 95, ty); ctx.lineTo(cx + 95, ty); ctx.moveTo(cx, ty - 95); ctx.lineTo(cx, ty + 95); ctx.stroke();

  D.rr(ctx, 64, 575, W - 128, 108, 16, 'rgba(13, 23, 38, 0.95)', P.cyan, 2);
  D.txt(ctx, 'AKURASI SUB-MILIMETER · TANPA KOMPROMI', cx, 616, 18, '#fff', '900', 'center');
  D.txt(ctx, 'Setiap koordinat vector dikalibrasi hingga 0.01 piksel', cx, 646, 13, P.cyan, '700', 'center', 'JetBrains Mono, monospace');
  ctx.restore();
}

// SCENE 2 (2.5s - 5.0s): Golden Ratio Fibonacci Architecture & Bezier Vector Handles
if (t >= 2.35 && t < 5.15) {
  const f2 = t < 4.8 ? E.eio(t, 2.35, 0.35) : 1 - E.eio(t, 4.8, 0.35);
  ctx.save();
  ctx.globalAlpha = f2;

  // Golden Ratio Grid Box (1.618:1)
  const gx = 90, gy = 160, gw = 540, gh = 334;
  D.rr(ctx, gx, gy, gw, gh, 8, 'rgba(13, 23, 38, 0.92)', P.gold, 2.5);
  // Subdivision lines
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)'; ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(gx + 334, gy); ctx.lineTo(gx + 334, gy + gh);
  ctx.moveTo(gx + 334, gy + 206); ctx.lineTo(gx + gw, gy + 206);
  ctx.moveTo(gx + 412, gy + 206); ctx.lineTo(gx + 412, gy + gh);
  ctx.stroke();

  // Golden Spiral Arc
  ctx.strokeStyle = P.cyan; ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(gx + 334, gy + 334, 334, Math.PI, Math.PI * 1.5);
  ctx.arc(gx + 334, gy + 206, 206, Math.PI * 1.5, Math.PI * 2);
  ctx.arc(gx + 412, gy + 206, 128, 0, Math.PI * 0.5);
  ctx.stroke();

  // Interactive Bezier Anchor Points & Tangent Handles
  const anchors = [
    { x: gx + 334, y: gy, lbl: 'P1 (334, 0)' },
    { x: gx + 540, y: gy + 206, lbl: 'P2 (540, 206)' },
    { x: gx + 412, y: gy + 334, lbl: 'P3 (412, 334)' }
  ];
  anchors.forEach((a, i) => {
    D.rr(ctx, a.x - 7, a.y - 7, 14, 14, 2, P.gold, '#fff', 2);
    D.txt(ctx, a.lbl, a.x - 16, a.y - 14 + i * 6, 11, P.white, '800', 'right', 'JetBrains Mono, monospace');
  });
  D.txt(ctx, 'φ = 1.6180339', gx + 167, gy + 175, 28, P.gold, '900', 'center', 'JetBrains Mono, monospace');

  // 3 Telemetry Metric Pills below
  const metrics = [
    { lbl: 'GOLDEN RATIO', val: '1 : 1.618', col: P.gold },
    { lbl: 'BEZIER CURVE', val: 'C2 SMOOTH', col: P.cyan },
    { lbl: 'GRID SNAP', val: '100% LOCK', col: P.emerald }
  ];
  metrics.forEach((m, i) => {
    const mx = 148 + i * 212;
    D.rr(ctx, mx - 94, 545, 188, 112, 14, 'rgba(13, 23, 38, 0.94)', m.col, 2);
    D.txt(ctx, m.lbl, mx, 584, 11, P.slate, '800', 'center', 'JetBrains Mono, monospace');
    D.txt(ctx, m.val, mx, 622, 20, m.col, '900', 'center', 'JetBrains Mono, monospace');
  });
  ctx.restore();
}

// SCENE 3 (5.0s - 7.5s): Swiss Mechanical Tourbillon Escapement Gear Train
if (t >= 4.85 && t < 7.65) {
  const f3 = t < 7.3 ? E.eio(t, 4.85, 0.35) : 1 - E.eio(t, 7.3, 0.35);
  ctx.save();
  ctx.globalAlpha = f3;

  const drawGear = (gx, gy, r, teeth, rot, col) => {
    ctx.save();
    ctx.translate(gx, gy); ctx.rotate(rot);
    ctx.strokeStyle = col; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const a1 = (i / teeth) * Math.PI * 2;
      const a2 = ((i + 0.45) / teeth) * Math.PI * 2;
      ctx.lineTo(Math.cos(a1) * (r + 10), Math.sin(a1) * (r + 10));
      ctx.lineTo(Math.cos(a2) * (r + 10), Math.sin(a2) * (r + 10));
      ctx.lineTo(Math.cos(a2) * r, Math.sin(a2) * r);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(13, 23, 38, 0.88)'; ctx.fill(); ctx.stroke();
    D.cir(ctx, 0, 0, r * 0.65, null, col, 1.8);
    for (let s = 0; s < 4; s++) {
      const sa = (s / 4) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(sa) * r * 0.65, Math.sin(sa) * r * 0.65); ctx.stroke();
    }
    D.cir(ctx, 0, 0, 12, '#070b12', P.white, 2.5);
    ctx.restore();
  };

  drawGear(cx - 75, 340, 105, 18, t * 1.1, P.gold);
  drawGear(cx + 102, 412, 74, 12, -t * 1.65, P.cyan);
  drawGear(cx + 85, 225, 54, 10, -t * 1.95, P.emerald);

  D.rr(ctx, 64, 575, W - 128, 108, 16, 'rgba(13, 23, 38, 0.95)', P.gold, 2);
  D.txt(ctx, 'SINKRONISASI MEKANIKAL 60 FPS', cx, 616, 18, '#fff', '900', 'center');
  D.txt(ctx, 'Transisi presisi layaknya mesin jam tangan Swiss Tourbillon', cx, 646, 13, P.gold, '700', 'center', 'JetBrains Mono, monospace');
  ctx.restore();
}

// SCENE 4 (7.5s - 10.0s): Calibration Verified Stamp & Blueprint Sign-Off
if (t >= 7.35) {
  const f4 = E.sp(t, 7.4, 0.7);
  ctx.save();
  ctx.globalAlpha = f4;

  const sy = 345;
  D.glow(ctx, cx, sy, 200, P.cyan, 0.35);
  D.cir(ctx, cx, sy, 132, 'rgba(13, 23, 38, 0.96)', P.emerald, 3.5);
  D.cir(ctx, cx, sy, 106, null, P.cyan, 1.5);
  D.txt(ctx, '±0.000', cx, sy - 6, 36, P.emerald, '900', 'center', 'JetBrains Mono, monospace');
  D.txt(ctx, 'CALIBRATION LOCKED', cx, sy + 28, 13, '#fff', '800', 'center', 'JetBrains Mono, monospace');

  D.rr(ctx, 64, 535, W - 128, 152, 20, 'rgba(13, 23, 38, 0.96)', P.cyan, 2.5);
  D.txt(ctx, 'PRECISION BLUEPRINT READY', cx, 582, 22, '#fff', '900', 'center', 'JetBrains Mono, monospace');
  D.txt(ctx, 'Standar tertinggi untuk diagram teknis & presentasi produk', cx, 612, 13, '#94a3b8', '600', 'center');
  D.rr(ctx, cx - 175, 632, 350, 38, 10, P.cyan, '#fff', 1.5);
  D.txt(ctx, 'EKSPOR MASTER BLUEPRINT →', cx, 656, 13, '#070b12', '900', 'center', 'JetBrains Mono, monospace');
  ctx.restore();
}

// SFX Cues
if (t < 0.08) s.sfx('click', 0.45);
if (t >= 2.48 && t < 2.56) s.sfx('chime', 0.42);
if (t >= 4.98 && t < 5.06) s.sfx('click', 0.45);
if (t >= 7.48 && t < 7.56) s.sfx('ding', 0.48);`,

  // 12. EDITORIAL MOTION GRID & 3D HOST — Swiss Bento Motion Grid + 3D Character Presenter
  editorial_motion_grid: `const W = s.W || 720, H = s.H || 1280;
const cx = W / 2, cy = 415;
const t = s.time;
const P = { bg: '#0b0f19', card: '#131c2e', border: '#263554', orange: '#ff6b35', cyan: '#00f5d4', gold: '#fbbf24', violet: '#8b5cf6', white: '#f8fafc', muted: '#94a3b8' };

// Editorial Studio Background & Architectural Grid
ctx.fillStyle = P.bg;
ctx.fillRect(0, 0, W, H);
D.grid(ctx, W, H, 40, 'rgba(255, 255, 255, 0.04)');
D.glow(ctx, cx - 100, 260, 310, P.orange, 0.18);
D.glow(ctx, cx + 130, 480, 290, P.cyan, 0.15);

// Editorial Magazine Masthead
D.rr(ctx, 44, 48, W - 88, 54, 14, 'rgba(19, 28, 46, 0.92)', P.border, 1.5);
D.rr(ctx, 58, 60, 96, 30, 8, P.orange);
D.txt(ctx, 'ISSUE #42', 106, 80, 12, '#fff', '900', 'center', 'JetBrains Mono, monospace');
D.txt(ctx, 'SATSET EDITORIAL // MOTION GRID & 3D HOST', W - 64, 80, 12, P.cyan, '800', 'right', 'JetBrains Mono, monospace');

// Helper: Handcrafted 3D Stylized Studio Host Presenter Bust
const draw3DHost = (hx, hy, sc, mood) => {
  ctx.save();
  ctx.translate(hx, hy); ctx.scale(sc, sc);
  // Soft Rim Glow behind 3D Host
  D.glow(ctx, 0, -20, 110, P.cyan, 0.28);
  // Stylized 3D Jacket & Collar
  ctx.fillStyle = P.orange;
  ctx.beginPath(); ctx.roundRect(-58, 18, 116, 78, [34, 34, 12, 12]); ctx.fill();
  ctx.fillStyle = '#1e293b';
  ctx.beginPath(); ctx.moveTo(-24, 18); ctx.lineTo(0, 62); ctx.lineTo(24, 18); ctx.closePath(); ctx.fill();
  // Neck & Sculpted 3D Head with Specular Shading
  D.rr(ctx, -14, -4, 28, 28, 10, '#e2a77f');
  const headG = ctx.createRadialGradient(-14, -48, 8, 0, -38, 48);
  headG.addColorStop(0, '#ffd7ba');
  headG.addColorStop(1, '#d99166');
  D.cir(ctx, 0, -42, 42, headG, '#fff', 1.5);
  // Modern Sculpted Hair & Smart Glasses
  ctx.fillStyle = '#0f172a';
  ctx.beginPath(); ctx.arc(0, -52, 43, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
  D.rr(ctx, -32, -52, 26, 18, 5, 'rgba(0, 245, 212, 0.22)', P.cyan, 2.5);
  D.rr(ctx, 6, -52, 26, 18, 5, 'rgba(0, 245, 212, 0.22)', P.cyan, 2.5);
  ctx.strokeStyle = P.cyan; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(-6, -43); ctx.lineTo(6, -43); ctx.stroke();
  // Expressive Smile
  ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(0, -28, 11, 0.15, Math.PI - 0.15); ctx.stroke();
  // Floating Lapel Mic Badge
  D.cir(ctx, 26, 42, 8, P.cyan, '#0b0f19', 2);
  ctx.restore();
};

// SCENE 1 (0.0s - 2.5s): 3D Host Presenter & Swiss Bento Headline Opener
if (t < 2.65) {
  const f1 = t < 2.3 ? E.sp(t, 0.05, 0.65) : 1 - E.eio(t, 2.3, 0.35);
  ctx.save();
  ctx.globalAlpha = f1;

  // Left Bento Card: 3D Host Stage
  D.rr(ctx, 48, 132, 280, 360, 24, P.card, P.cyan, 2.5);
  draw3DHost(188, 315 + Math.sin(t * 4) * 5, 1.35, 'talk');
  D.rr(ctx, 74, 432, 228, 38, 10, 'rgba(0, 245, 212, 0.16)', P.cyan, 1.5);
  D.txt(ctx, '3D HOST // AI PRESENTER', 188, 456, 12, P.cyan, '900', 'center', 'JetBrains Mono, monospace');

  // Right Bento Stack: Kinetic Editorial Typography + Live Stat
  D.rr(ctx, 348, 132, 324, 210, 24, P.orange, '#fff', 2);
  D.txt(ctx, 'EDITORIAL', 376, 192, 36, '#fff', '900', 'left');
  D.txt(ctx, 'BENTO GRID', 376, 236, 36, '#0b0f19', '900', 'left');
  D.txt(ctx, 'Layout majalah Swiss + presenter 3D interaktif', 376, 278, 13, '#fff', '700', 'left');

  D.rr(ctx, 348, 362, 324, 130, 24, P.card, P.gold, 2);
  D.txt(ctx, 'RETENSI AUDIENS', 376, 404, 12, P.muted, '800', 'left', 'JetBrains Mono, monospace');
  D.txt(ctx, '3.8x LIPAT', 376, 454, 38, P.gold, '900', 'left');

  // Bottom Full-Width Ticker Bento
  D.rr(ctx, 48, 514, W - 96, 170, 24, P.card, P.border, 2);
  D.txt(ctx, 'STRUKTUR VISUAL KELAS AGENCY KREATIF', cx, 574, 20, '#fff', '900', 'center');
  D.txt(ctx, 'Kombinasi kartu data modular, tipografi tegas, dan karakter 3D', cx, 610, 14, P.muted, '600', 'center');
  D.rr(ctx, cx - 150, 632, 300, 32, 16, 'rgba(255, 107, 53, 0.2)', P.orange, 1.5);
  D.txt(ctx, 'MODULAR · RESPONSIF · 60 FPS', cx, 653, 12, P.orange, '800', 'center', 'JetBrains Mono, monospace');
  ctx.restore();
}

// SCENE 2 (2.5s - 5.0s): 4-Cell Interactive Bento Comparison Matrix
if (t >= 2.35 && t < 5.15) {
  const f2 = t < 4.8 ? E.eio(t, 2.35, 0.35) : 1 - E.eio(t, 4.8, 0.35);
  ctx.save();
  ctx.globalAlpha = f2;

  const cells = [
    { x: 48, y: 132, w: 300, h: 255, tag: '01 // HOOK', title: 'Tipografi Kinetic', val: '94%', col: P.orange },
    { x: 372, y: 132, w: 300, h: 255, tag: '02 // VISUAL', title: '3D Host Avatar', val: '100%', col: P.cyan },
    { x: 48, y: 408, w: 300, h: 255, tag: '03 // DATA', title: 'Grafik Real-Time', val: '+240%', col: P.gold },
    { x: 372, y: 408, w: 300, h: 255, tag: '04 // AUDIO', title: 'SFX Terkalibrasi', val: 'SYNC', col: P.violet }
  ];
  cells.forEach((c, i) => {
    const cEnt = E.sp(t, 2.45 + i * 0.14, 0.6);
    ctx.save();
    ctx.translate(c.x + c.w / 2, c.y + c.h / 2); ctx.scale(cEnt, cEnt);
    D.rr(ctx, -c.w / 2, -c.h / 2, c.w, c.h, 24, P.card, c.col, 2.5);
    D.rr(ctx, -c.w / 2 + 22, -c.h / 2 + 22, 124, 28, 8, 'rgba(255,255,255,0.06)', c.col, 1);
    D.txt(ctx, c.tag, -c.w / 2 + 84, -c.h / 2 + 41, 11, c.col, '800', 'center', 'JetBrains Mono, monospace');
    D.txt(ctx, c.val, 0, 18, 48, '#fff', '900', 'center', 'JetBrains Mono, monospace');
    D.txt(ctx, c.title, 0, 74, 17, c.col, '800', 'center');
    ctx.restore();
  });
  ctx.restore();
}

// SCENE 3 (5.0s - 7.5s): Editorial Deep-Dive Chart + Mini 3D Host Commentary PiP
if (t >= 4.85 && t < 7.65) {
  const f3 = t < 7.3 ? E.eio(t, 4.85, 0.35) : 1 - E.eio(t, 7.3, 0.35);
  ctx.save();
  ctx.globalAlpha = f3;

  D.rr(ctx, 48, 132, W - 96, 370, 26, P.card, P.cyan, 2.5);
  D.txt(ctx, 'BENCHMARK ENGAGEMENT KONTEN 2025', 80, 178, 15, P.cyan, '900', 'left', 'JetBrains Mono, monospace');

  const bars = [
    { lbl: 'SLIDE BIASA', h: 68, col: '#475569', val: '1.2x' },
    { lbl: 'TEMPLATE KAKU', h: 112, col: P.gold, val: '2.1x' },
    { lbl: 'MOTION GRID + 3D', h: 224, col: P.orange, val: '5.4x' }
  ];
  bars.forEach((b, i) => {
    const bx = 135 + i * 155;
    const bEnt = E.eio(t, 5.05 + i * 0.18, 0.7);
    const bh = b.h * bEnt;
    D.rr(ctx, bx - 44, 435 - bh, 88, bh, 14, b.col, '#fff', i === 2 ? 2.5 : 1);
    D.txt(ctx, b.val, bx, 420 - bh, 20, '#fff', '900', 'center', 'JetBrains Mono, monospace');
    D.txt(ctx, b.lbl, bx, 464, 11, P.white, '800', 'center', 'JetBrains Mono, monospace');
  });

  // Floating 3D Host PiP Commentary Strip below
  D.rr(ctx, 48, 524, W - 96, 156, 24, P.card, P.orange, 2);
  draw3DHost(142, 602, 0.85, 'talk');
  D.txt(ctx, '"Visual modular membuat penonton fokus pada', 240, 588, 16, '#fff', '800', 'left');
  D.txt(ctx, 'poin utama tanpa merasa bosan!"', 240, 616, 16, P.cyan, '900', 'left');
  D.txt(ctx, '— 3D Studio Presenter · Live Keyframe Sync', 240, 648, 12, P.muted, '700', 'left', 'JetBrains Mono, monospace');
  ctx.restore();
}

// SCENE 4 (7.5s - 10.0s): Final Editorial Cover & Call to Action
if (t >= 7.35) {
  const f4 = E.sp(t, 7.4, 0.7);
  ctx.save();
  ctx.globalAlpha = f4;

  D.rr(ctx, 56, 138, W - 112, 375, 28, P.card, P.orange, 3);
  draw3DHost(cx, 305, 1.55, 'smile');
  D.rr(ctx, cx - 185, 438, 370, 44, 12, P.orange, '#fff', 1.5);
  D.txt(ctx, 'EDITORIAL MOTION + 3D HOST READY', cx, 466, 15, '#fff', '900', 'center', 'JetBrains Mono, monospace');

  D.rr(ctx, 56, 538, W - 112, 148, 24, P.card, P.cyan, 2);
  D.txt(ctx, 'SIAP RENDER DALAM SEMUA RASIO', cx, 586, 20, '#fff', '900', 'center');
  D.txt(ctx, '9:16 Vertikal · 1:1 Kotak · 3:4 Potret · 16:9 Lanskap', cx, 616, 13, P.cyan, '700', 'center', 'JetBrains Mono, monospace');
  D.rr(ctx, cx - 165, 634, 330, 36, 18, P.cyan);
  D.txt(ctx, 'GUNAKAN STYLE EDITORIAL →', cx, 657, 13, '#0b0f19', '900', 'center', 'JetBrains Mono, monospace');
  ctx.restore();
}

// SFX Cues
if (t < 0.08) s.sfx('pop', 0.45);
if (t >= 2.48 && t < 2.56) s.sfx('whoosh', 0.42);
if (t >= 4.98 && t < 5.06) s.sfx('chime', 0.45);
if (t >= 7.48 && t < 7.56) s.sfx('ding', 0.48);`,

  // 13. VOXELVERSE — Isometric 3D Voxel Island Diorama, Waterfalls, Voxel Mech Avatar & Crystal Portal
  voxelverse: `const W = s.W || 720, H = s.H || 1280;
const cx = W / 2, cy = 415;
const t = s.time;

// Sky & Floating Cloud Voxels
const skyG = ctx.createLinearGradient(0, 0, 0, H);
skyG.addColorStop(0, '#0f172a');
skyG.addColorStop(0.55, '#1e3a8a');
skyG.addColorStop(1, '#172554');
ctx.fillStyle = skyG;
ctx.fillRect(0, 0, W, H);
D.grid(ctx, W, H, 44, 'rgba(56, 189, 248, 0.06)');

// Helper: True Isometric 3D Voxel Block Renderer (Top, Left, Right Faces)
const drawVoxel = (gx, gy, gz, size, topCol, leftCol, rightCol) => {
  const sx = cx + (gx - gy) * size * 0.866;
  const sy = 370 + (gx + gy) * size * 0.5 - gz * size * 0.88;
  const dx = size * 0.866, dy = size * 0.5, dz = size * 0.88;
  // Top Face
  ctx.beginPath();
  ctx.moveTo(sx, sy - dy); ctx.lineTo(sx + dx, sy); ctx.lineTo(sx, sy + dy); ctx.lineTo(sx - dx, sy); ctx.closePath();
  ctx.fillStyle = topCol; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.stroke();
  // Left Face
  ctx.beginPath();
  ctx.moveTo(sx - dx, sy); ctx.lineTo(sx, sy + dy); ctx.lineTo(sx, sy + dy + dz); ctx.lineTo(sx - dx, sy + dz); ctx.closePath();
  ctx.fillStyle = leftCol; ctx.fill(); ctx.stroke();
  // Right Face
  ctx.beginPath();
  ctx.moveTo(sx + dx, sy); ctx.lineTo(sx, sy + dy); ctx.lineTo(sx, sy + dy + dz); ctx.lineTo(sx + dx, sy + dz); ctx.closePath();
  ctx.fillStyle = rightCol; ctx.fill(); ctx.stroke();
};

// Top Voxel HUD Bar
D.rr(ctx, 44, 48, W - 88, 54, 12, 'rgba(15, 23, 42, 0.9)', '#38bdf8', 2);
D.txt(ctx, 'VOXELVERSE ENGINE // ISOMETRIC SANDBOX', 68, 80, 13, '#38bdf8', '900', 'left', 'JetBrains Mono, monospace');
D.txt(ctx, 'SEED #8841 · 60 FPS', W - 68, 80, 12, '#fbbf24', '800', 'right', 'JetBrains Mono, monospace');

// SCENE 1 (0.0s - 2.5s): Floating Isometric Voxel Island Diorama with Waterfall & Tree
if (t < 2.65) {
  const f1 = t < 2.3 ? E.sp(t, 0.05, 0.65) : 1 - E.eio(t, 2.3, 0.35);
  ctx.save();
  ctx.globalAlpha = f1;

  const sz = 36;
  // 5x5 Terrain Base (Dirt + Emerald Grass + River Stream)
  for (let x = -2; x <= 2; x++) {
    for (let y = -2; y <= 2; y++) {
      const idx = (x + 2) * 5 + (y + 2);
      const drop = (1 - E.sp(t, 0.05 + idx * 0.018, 0.55)) * 4;
      const isWater = x === 0 && y >= -1;
      drawVoxel(x, y, -1 - drop, sz, '#92400e', '#78350f', '#451a03');
      if (isWater) {
        drawVoxel(x, y, 0 - drop + Math.sin(t * 6 + y) * 0.08, sz, '#38bdf8', '#0284c7', '#0369a1');
      } else {
        drawVoxel(x, y, 0 - drop, sz, '#4ade80', '#16a34a', '#15803d');
      }
    }
  }
  // Voxel Oak Tree on (-1, -1)
  const tEnt = E.sp(t, 0.45, 0.6);
  if (tEnt > 0.05) {
    drawVoxel(-1, -1, 1, sz, '#a16207', '#713f12', '#422006');
    drawVoxel(-1, -1, 2, sz, '#a16207', '#713f12', '#422006');
    drawVoxel(-1, -1, 3, sz, '#22c55e', '#15803d', '#14532d');
    drawVoxel(-2, -1, 2.5, sz * 0.85, '#4ade80', '#16a34a', '#15803d');
    drawVoxel(-1, -2, 2.5, sz * 0.85, '#4ade80', '#16a34a', '#15803d');
  }
  // Glowing Golden Treasure Chest Voxel on (1, -1)
  drawVoxel(1, -1, 1 + Math.abs(Math.sin(t * 5)) * 0.25, sz * 0.9, '#fde047', '#eab308', '#ca8a04');

  D.rr(ctx, 64, 575, W - 128, 108, 18, 'rgba(15, 23, 42, 0.94)', '#4ade80', 2.5);
  D.txt(ctx, 'DUNIA VOXEL ISOMETRIK 3D NYATA', cx, 616, 19, '#fff', '900', 'center');
  D.txt(ctx, 'Setiap blok memiliki 3 sisi pencahayaan isometrik presisi', cx, 646, 13, '#86efac', '700', 'center');
  ctx.restore();
}

// SCENE 2 (2.5s - 5.0s): Voxel Hero Character Crafting & Level-Up Inventory
if (t >= 2.35 && t < 5.15) {
  const f2 = t < 4.8 ? E.eio(t, 2.35, 0.35) : 1 - E.eio(t, 4.8, 0.35);
  ctx.save();
  ctx.globalAlpha = f2;

  const sz = 42;
  const bounce = Math.abs(Math.sin(t * 6)) * 0.35;
  // Pedestal Platform
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      drawVoxel(x, y, -1.2, sz, '#64748b', '#475569', '#334155');
    }
  }
  // Voxel Mech/Knight Character (Legs, Torso, Arms, Helmet, Glowing Visor)
  drawVoxel(-0.4, 0, 0 + bounce, sz * 0.75, '#3b82f6', '#2563eb', '#1d4ed8');
  drawVoxel(0.4, 0, 0 + bounce, sz * 0.75, '#3b82f6', '#2563eb', '#1d4ed8');
  drawVoxel(0, 0, 1 + bounce, sz * 0.95, '#f97316', '#ea580c', '#c2410c');
  drawVoxel(0, 0, 2.1 + bounce, sz, '#fde047', '#eab308', '#ca8a04');

  // 3 Voxel Inventory Stat Cards below
  const items = [
    { lbl: 'BUILD SPEED', val: '120 BLOK/S', col: '#38bdf8' },
    { lbl: 'SHADER', val: 'ISOMETRIC AO', col: '#fbbf24' },
    { lbl: 'LOOT RARITY', val: 'LEGENDARY', col: '#a855f7' }
  ];
  items.forEach((it, i) => {
    const ix = 148 + i * 212;
    D.rr(ctx, ix - 94, 560, 188, 110, 16, 'rgba(15, 23, 42, 0.94)', it.col, 2.5);
    D.txt(ctx, it.lbl, ix, 598, 11, '#94a3b8', '800', 'center', 'JetBrains Mono, monospace');
    D.txt(ctx, it.val, ix, 634, 19, it.col, '900', 'center');
  });
  ctx.restore();
}

// SCENE 3 (5.0s - 7.5s): Voxel Data Skyline Tower & Redstone Circuit Pulse
if (t >= 4.85 && t < 7.65) {
  const f3 = t < 7.3 ? E.eio(t, 4.85, 0.35) : 1 - E.eio(t, 7.3, 0.35);
  ctx.save();
  ctx.globalAlpha = f3;

  const sz = 38;
  const cols = [
    { x: -1.6, y: 0.8, h: 2, top: '#60a5fa', l: '#3b82f6', r: '#1d4ed8' },
    { x: -0.5, y: 0.2, h: 3, top: '#c084fc', l: '#a855f7', r: '#7e22ce' },
    { x: 0.6, y: -0.4, h: 4, top: '#4ade80', l: '#22c55e', r: '#15803d' },
    { x: 1.7, y: -1.0, h: 5, top: '#fde047', l: '#eab308', r: '#ca8a04' }
  ];
  cols.forEach((c, idx) => {
    const grow = E.sp(t, 5.0 + idx * 0.14, 0.65);
    const maxB = Math.max(1, Math.round(c.h * grow));
    for (let z = 0; z < maxB; z++) {
      drawVoxel(c.x, c.y, z - 0.5, sz, c.top, c.l, c.r);
    }
  });

  D.rr(ctx, 64, 575, W - 128, 108, 18, 'rgba(15, 23, 42, 0.94)', '#fde047', 2.5);
  D.txt(ctx, 'GRAFIK PERTUMBUHAN BLOK DEMI BLOK', cx, 616, 19, '#fff', '900', 'center');
  D.txt(ctx, 'Visualisasi metrik bisnis dalam bentuk menara voxel 3D', cx, 646, 13, '#fde047', '700', 'center');
  ctx.restore();
}

// SCENE 4 (7.5s - 10.0s): Nether/Crystal Voxel Portal & Final CTA
if (t >= 7.35) {
  const f4 = E.sp(t, 7.4, 0.7);
  ctx.save();
  ctx.globalAlpha = f4;

  const sz = 36;
  D.glow(ctx, cx, 330, 210, '#a855f7', 0.45);
  // Voxel Portal Frame Arch
  for (let z = -1; z <= 3; z++) {
    drawVoxel(-1.4, 0.5, z, sz, '#475569', '#334155', '#1e293b');
    drawVoxel(1.4, -0.5, z, sz, '#475569', '#334155', '#1e293b');
  }
  drawVoxel(0, 0, 3, sz, '#475569', '#334155', '#1e293b');
  // Glowing Crystal Portal Core Blocks
  for (let z = 0; z <= 2; z++) {
    drawVoxel(0, 0, z, sz * 0.92, '#e879f9', '#c026d3', '#86198f');
  }

  D.rr(ctx, 64, 540, W - 128, 148, 22, 'rgba(15, 23, 42, 0.95)', '#a855f7', 2.5);
  D.txt(ctx, 'VOXELVERSE READY TO RENDER', cx, 586, 22, '#fff', '900', 'center', 'JetBrains Mono, monospace');
  D.txt(ctx, 'Gaya 3D Blocky Gamifikasi yang Unik & Memikat Penonton', cx, 616, 13, '#e9d5ff', '600', 'center');
  D.rr(ctx, cx - 170, 634, 340, 36, 12, '#a855f7', '#fff', 1.5);
  D.txt(ctx, 'MASUK KE DUNIA VOXEL →', cx, 657, 13, '#fff', '900', 'center', 'JetBrains Mono, monospace');
  ctx.restore();
}

// SFX Cues
if (t < 0.08) s.sfx('pop', 0.45);
if (t >= 2.48 && t < 2.56) s.sfx('boing', 0.42);
if (t >= 4.98 && t < 5.06) s.sfx('click', 0.45);
if (t >= 7.48 && t < 7.56) s.sfx('chime', 0.48);`,

  // 14. 3D STUDIO ROOM & PEDESTAL — Architectural Herringbone Room, Pendant Lamp, 3 Glowing Orange-Ringed Pedestals & 3D Host
  studio_3d_room: `const W = s.W || 720, H = s.H || 1280;
const cx = W / 2, cy = 415;
const t = s.time;
const P = { wallL: '#131b2e', wallR: '#0d1424', floor: '#1c1613', orange: '#ff6b35', cyan: '#00f5d4', gold: '#fbbf24', white: '#f8fafc' };

// Helper: 3D Architectural Studio Room (Corner Perspective, Baseboards, Herringbone Floor & Pendant Lamp)
const drawStudioRoom = (camZoom) => {
  ctx.save();
  const cornerX = cx, horizonY = 470;
  // Left & Right Matte Architectural Walls meeting at cornerX
  ctx.fillStyle = P.wallL;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(cornerX, 0); ctx.lineTo(cornerX, horizonY); ctx.lineTo(0, horizonY + 95); ctx.closePath(); ctx.fill();
  ctx.fillStyle = P.wallR;
  ctx.beginPath(); ctx.moveTo(cornerX, 0); ctx.lineTo(W, 0); ctx.lineTo(W, horizonY + 95); ctx.lineTo(cornerX, horizonY); ctx.closePath(); ctx.fill();

  // Acoustic Wall Fluting Lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'; ctx.lineWidth = 2;
  for (let wx = 40; wx < W; wx += 45) {
    ctx.beginPath(); ctx.moveTo(wx, 0); ctx.lineTo(wx, horizonY + 40); ctx.stroke();
  }
  // Corner Seam & Glowing Baseboard Trim
  ctx.strokeStyle = 'rgba(255, 107, 53, 0.45)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cornerX, 0); ctx.lineTo(cornerX, horizonY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, horizonY + 95); ctx.lineTo(cornerX, horizonY); ctx.lineTo(W, horizonY + 95); ctx.stroke();

  // Warm Walnut Herringbone Floor
  const floorG = ctx.createLinearGradient(0, horizonY, 0, H);
  floorG.addColorStop(0, '#261c16');
  floorG.addColorStop(1, '#0c0907');
  ctx.fillStyle = floorG;
  ctx.beginPath(); ctx.moveTo(0, horizonY + 95); ctx.lineTo(cornerX, horizonY); ctx.lineTo(W, horizonY + 95); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();

  // Perspective Floor Grid Planks
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.08)'; ctx.lineWidth = 1.2;
  for (let i = -5; i <= 5; i++) {
    ctx.beginPath(); ctx.moveTo(cornerX, horizonY); ctx.lineTo(cornerX + i * 140, H); ctx.stroke();
  }

  // Overhead Studio Pendant Lamp & Volumetric Warm Spotlight Cone
  ctx.strokeStyle = '#64748b'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, 88); ctx.stroke();
  // Volumetric Light Cone
  const coneG = ctx.createLinearGradient(cx, 95, cx, 560);
  coneG.addColorStop(0, 'rgba(255, 183, 77, 0.28)');
  coneG.addColorStop(1, 'rgba(255, 107, 53, 0.0)');
  ctx.fillStyle = coneG;
  ctx.beginPath(); ctx.moveTo(cx - 48, 104); ctx.lineTo(cx + 48, 104); ctx.lineTo(cx + 290, 580); ctx.lineTo(cx - 290, 580); ctx.closePath(); ctx.fill();
  // Pendant Dome Shade
  ctx.fillStyle = '#1e293b'; ctx.strokeStyle = P.orange; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(cx, 104, 48, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  D.rr(ctx, cx - 36, 100, 72, 8, 4, '#fef08a');
  ctx.restore();
};

// Helper: 3D Cylindrical Studio Pedestal with Glowing Orange Neon Ring
const drawPedestal = (px, py, radius, height, ringCol, topCol) => {
  ctx.save();
  const ry = radius * 0.34;
  // Floor Drop Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath(); ctx.ellipse(px, py + 8, radius * 1.15, ry * 1.2, 0, 0, Math.PI * 2); ctx.fill();
  // Cylinder Body
  const cylG = ctx.createLinearGradient(px - radius, py - height, px + radius, py);
  cylG.addColorStop(0, '#1e293b');
  cylG.addColorStop(0.5, '#334155');
  cylG.addColorStop(1, '#0f172a');
  ctx.fillStyle = cylG;
  ctx.beginPath();
  ctx.moveTo(px - radius, py - height);
  ctx.lineTo(px - radius, py);
  ctx.ellipse(px, py, radius, ry, 0, Math.PI, 0, true);
  ctx.lineTo(px + radius, py - height);
  ctx.closePath(); ctx.fill();
  // Glowing Neon Base Ring
  ctx.strokeStyle = ringCol; ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.ellipse(px, py - 4, radius * 1.02, ry * 1.02, 0, 0, Math.PI); ctx.stroke();
  // Top Cap Disk
  ctx.fillStyle = topCol; ctx.strokeStyle = ringCol; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.ellipse(px, py - height, radius, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
};

drawStudioRoom(1);

// SCENE 1 (0.0s - 2.5s): 3 Rising Orange-Ringed Pedestals & Floating 3D Trophy Showcase
if (t < 2.65) {
  const f1 = t < 2.3 ? E.sp(t, 0.05, 0.65) : 1 - E.eio(t, 2.3, 0.35);
  ctx.save();
  ctx.globalAlpha = f1;

  const p1 = E.sp(t, 0.1, 0.65) * 115;
  const p2 = E.sp(t, 0.22, 0.65) * 165;
  const p3 = E.sp(t, 0.34, 0.65) * 95;

  drawPedestal(175, 535, 68, p1, P.cyan, '#1e293b');
  drawPedestal(545, 535, 68, p3, P.gold, '#1e293b');
  drawPedestal(cx, 555, 88, p2, P.orange, '#263554');

  // Floating 3D Objects above each Pedestal
  const bob = Math.sin(t * 4) * 7;
  // Left Pedestal: 3D Cube Gem
  D.cir(ctx, 175, 535 - p1 - 48 + bob, 28, 'rgba(0, 245, 212, 0.22)', P.cyan, 2.5);
  D.txt(ctx, '01', 175, 535 - p1 - 41 + bob, 18, P.cyan, '900', 'center', 'JetBrains Mono, monospace');

  // Center Hero Pedestal: Golden 3D Crown / Star Emblem
  D.glow(ctx, cx, 555 - p2 - 64 + bob, 95, P.orange, 0.45);
  D.cir(ctx, cx, 555 - p2 - 64 + bob, 44, P.orange, '#fff', 3);
  D.star(ctx, cx, 555 - p2 - 64 + bob, 24, 11, 5, '#fff');

  // Right Pedestal: 3D Lightning Orb
  D.cir(ctx, 545, 535 - p3 - 48 - bob, 28, 'rgba(251, 191, 36, 0.22)', P.gold, 2.5);
  D.txt(ctx, '03', 545, 535 - p3 - 41 - bob, 18, P.gold, '900', 'center', 'JetBrains Mono, monospace');

  D.rr(ctx, 64, 595, W - 128, 92, 20, 'rgba(13, 20, 36, 0.94)', P.orange, 2);
  D.txt(ctx, '3D STUDIO ROOM & PEDESTAL SHOWCASE', cx, 634, 18, '#fff', '900', 'center');
  D.txt(ctx, 'Panggung 3D sinematik dengan lampu gantung & podium menyala', cx, 662, 13, P.gold, '700', 'center');
  ctx.restore();
}

// SCENE 2 (2.5s - 5.0s): 3D Host Presenter Standing Behind Center Pedestal + Floating Hologram UI Cards
if (t >= 2.35 && t < 5.15) {
  const f2 = t < 4.8 ? E.eio(t, 2.35, 0.35) : 1 - E.eio(t, 4.8, 0.35);
  ctx.save();
  ctx.globalAlpha = f2;

  // 3D Character Presenter Standing in Studio Room
  const hEnt = E.sp(t, 2.45, 0.65);
  ctx.save();
  ctx.translate(cx, 375); ctx.scale(hEnt, hEnt);
  // Stylized 3D Host Torso & Head
  ctx.fillStyle = '#2563eb';
  ctx.beginPath(); ctx.roundRect(-62, -10, 124, 115, [36, 36, 12, 12]); ctx.fill();
  D.cir(ctx, 0, -58, 42, '#fcd34d', '#fff', 2);
  ctx.fillStyle = '#0f172a';
  ctx.beginPath(); ctx.arc(0, -68, 43, Math.PI, Math.PI * 2); ctx.fill();
  D.rr(ctx, -28, -66, 22, 14, 4, 'rgba(0,245,212,0.25)', P.cyan, 2);
  D.rr(ctx, 6, -66, 22, 14, 4, 'rgba(0,245,212,0.25)', P.cyan, 2);
  ctx.restore();

  // Foreground Center Pedestal Desk
  drawPedestal(cx, 555, 115, 118, P.orange, '#1e293b');

  // Left & Right Floating Glass UI Cards in 3D Room Space
  const cards = [
    { x: 155, y: 275, title: 'VISUAL DEPTH', val: '3D ROOM', col: P.cyan },
    { x: 565, y: 275, title: 'LIGHTING', val: 'VOLUMETRIC', col: P.gold }
  ];
  cards.forEach((c, i) => {
    const cEnt = E.sp(t, 2.65 + i * 0.18, 0.6);
    ctx.save();
    ctx.translate(c.x, c.y + Math.sin(t * 3.5 + i) * 6); ctx.scale(cEnt, cEnt);
    D.rr(ctx, -102, -62, 204, 124, 18, 'rgba(19, 27, 46, 0.92)', c.col, 2.5);
    D.txt(ctx, c.title, 0, -18, 11, '#94a3b8', '800', 'center', 'JetBrains Mono, monospace');
    D.txt(ctx, c.val, 0, 22, 22, c.col, '900', 'center');
    ctx.restore();
  });

  D.rr(ctx, 64, 595, W - 128, 92, 20, 'rgba(13, 20, 36, 0.94)', P.cyan, 2);
  D.txt(ctx, 'PRESENTASI PRODUK SEPERTI STUDIO TV', cx, 634, 18, '#fff', '900', 'center');
  D.txt(ctx, 'Karakter 3D & kartu hologram melayang di ruang tiga dimensi', cx, 662, 13, P.cyan, '700', 'center');
  ctx.restore();
}

// SCENE 3 (5.0s - 7.5s): 3 Pedestal Metric Comparison Bars Rising in 3D Room
if (t >= 4.85 && t < 7.65) {
  const f3 = t < 7.3 ? E.eio(t, 4.85, 0.35) : 1 - E.eio(t, 7.3, 0.35);
  ctx.save();
  ctx.globalAlpha = f3;

  const peds = [
    { x: 165, h: 105, lbl: '2D FLAT', val: '1.4x', col: '#64748b' },
    { x: cx, h: 175, lbl: '2.5D LAYER', val: '2.8x', col: P.cyan },
    { x: 555, h: 255, lbl: '3D STUDIO', val: '6.2x', col: P.orange }
  ];
  peds.forEach((pd, i) => {
    const pEnt = E.sp(t, 5.0 + i * 0.16, 0.65);
    const ph = pd.h * pEnt;
    drawPedestal(pd.x, 545, 72, ph, pd.col, '#1e293b');
    D.rr(ctx, pd.x - 58, 545 - ph - 74, 116, 52, 12, 'rgba(13, 20, 36, 0.94)', pd.col, 2);
    D.txt(ctx, pd.val, pd.x, 545 - ph - 41, 22, '#fff', '900', 'center', 'JetBrains Mono, monospace');
    D.txt(ctx, pd.lbl, pd.x, 578, 12, pd.col, '900', 'center', 'JetBrains Mono, monospace');
  });

  D.rr(ctx, 64, 608, W - 128, 82, 18, 'rgba(13, 20, 36, 0.94)', P.orange, 2);
  D.txt(ctx, 'KONVERSI & DAYA TARIK VISUAL NAIK 6.2X LIPAT', cx, 655, 17, '#fff', '900', 'center');
  ctx.restore();
}

// SCENE 4 (7.5s - 10.0s): Grand Master Pedestal & Winged Studio Emblem Finale
if (t >= 7.35) {
  const f4 = E.sp(t, 7.4, 0.7);
  ctx.save();
  ctx.globalAlpha = f4;

  drawPedestal(cx, 525, 125, 145, P.orange, '#263554');
  const bob = Math.sin(t * 5) * 8;
  D.glow(ctx, cx, 265 + bob, 165, P.orange, 0.5);
  D.cir(ctx, cx, 265 + bob, 72, P.orange, '#fff', 3.5);
  D.txt(ctx, '3D PRO', cx, 274 + bob, 26, '#fff', '900', 'center', 'JetBrains Mono, monospace');

  D.rr(ctx, 64, 558, W - 128, 134, 22, 'rgba(13, 20, 36, 0.96)', P.orange, 2.5);
  D.txt(ctx, '3D STUDIO ROOM READY', cx, 600, 21, '#fff', '900', 'center');
  D.txt(ctx, 'Hadirkan kualitas studio produksi 3D ke setiap video Anda', cx, 628, 13, '#cbd5e1', '600', 'center');
  D.rr(ctx, cx - 175, 642, 350, 36, 18, P.orange, '#fff', 1.5);
  D.txt(ctx, 'MASUK KE 3D STUDIO ROOM →', cx, 665, 13, '#fff', '900', 'center', 'JetBrains Mono, monospace');
  ctx.restore();
}

// SFX Cues
if (t < 0.08) s.sfx('whoosh', 0.45);
if (t >= 2.48 && t < 2.56) s.sfx('pop', 0.42);
if (t >= 4.98 && t < 5.06) s.sfx('chime', 0.45);
if (t >= 7.48 && t < 7.56) s.sfx('ding', 0.5);`
};

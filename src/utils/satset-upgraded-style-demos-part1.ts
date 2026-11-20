// @ts-nocheck
/* eslint-disable */

/**
 * Handcrafted, non-AI-slop, real object & illustration demos for Part 1 (Styles 1-7):
 * 1. soft_glow (Soft Glow Ambient — bioluminescent glass terrarium, lotus blossom, dewdrop leaf, aurora lantern)
 * 2. zen_paper (Zen Origami — step-by-step folding origami Tsuru crane, Koi fish & lotus, Torii gate & paper boat, bamboo scroll)
 * 3. confetti_blast (Confetti Blast — brass party cannon & metallic streamers, 3-tier birthday cake with lit candles, golden trophy & medal, VIP celebration ticket)
 * 4. sticker_bomb (Sticker Bomb Y2K — die-cut sneaker/controller/cassette/lightning stickers peeling & slapping onto notebook, flip phone, skate deck, holographic pack)
 * 5. bubble_gum (Bubble Gum 3D — glossy gumball vending machine with crank & glass dome, soda bottle with fizzy straw, custom inflatable balloon letters, candy jar)
 * 6. stopmotion_clay (Claymation Stopmotion 12fps — sculpted clay desk with espresso cup & steam, clay alarm clock & notebook, clay character sculpting, clay clapboard)
 * 7. tenang_minimalis (Tenang Minimalis — Muji/Kinfolk ceramic pour-over coffee dripper & steam, architectural window sunlight & monstera leaf, brass pendulum clock, linen journal)
 */
export const UPGRADED_14_STYLE_DEMOS_PART1: Record<
  string,
  Array<[string, string, 'paper' | 'dusk' | 'night', string]>
> = {
  // ============================================================================
  // 1. SOFT GLOW AMBIENT (soft_glow) — Bioluminescent Botanical Glass Terrarium
  // ============================================================================
  soft_glow: [
    [
      'Tarik napas perlahan, biarkan pendar lentera kaca menenangkan ruang pikiranmu.',
      'napas perlahan, lentera kaca',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.44, sc = Math.min(W / 720, H / 1280);
const bg = ctx.createLinearGradient(0, 0, 0, H);
bg.addColorStop(0, "#050816"); bg.addColorStop(0.55, "#0b132b"); bg.addColorStop(1, "#070b19");
ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

const breath = 0.5 + 0.5 * Math.sin(s.t * 1.7);
const aura = ctx.createRadialGradient(cx, cy, 10 * sc, cx, cy, (260 + breath * 55) * sc);
aura.addColorStop(0, "rgba(56,189,248,0.34)");
aura.addColorStop(0.45, "rgba(168,85,247,0.18)");
aura.addColorStop(1, "rgba(5,8,22,0)");
ctx.fillStyle = aura; ctx.fillRect(0, 0, W, H);

// Wooden table & soft reflection
ctx.fillStyle = "#0f172a"; ctx.fillRect(0, cy + 165 * sc, W, H - (cy + 165 * sc));
const tableGlow = ctx.createRadialGradient(cx, cy + 170 * sc, 5 * sc, cx, cy + 170 * sc, 190 * sc);
tableGlow.addColorStop(0, "rgba(45,212,191,0.32)"); tableGlow.addColorStop(1, "rgba(15,23,42,0)");
ctx.fillStyle = tableGlow; ctx.fillRect(0, cy + 150 * sc, W, 120 * sc);

// Handcrafted Glass Terrarium Bell Jar with glowing Lotus Blossom inside
const kJar = s.spring(0.08, "smooth");
ctx.save(); ctx.translate(cx, cy + 20 * sc); ctx.scale(kJar, kJar);
// Wooden base pedestal with brass rim
ctx.fillStyle = "#3e2723";
ctx.beginPath(); ctx.roundRect(-125 * sc, 118 * sc, 250 * sc, 34 * sc, 14 * sc); ctx.fill();
ctx.fillStyle = "#d97706";
ctx.beginPath(); ctx.roundRect(-114 * sc, 112 * sc, 228 * sc, 10 * sc, 5 * sc); ctx.fill();

// Bioluminescent moss bed inside jar
const mossG = ctx.createLinearGradient(0, 85 * sc, 0, 118 * sc);
mossG.addColorStop(0, "#14b8a6"); mossG.addColorStop(1, "#064e3b");
ctx.fillStyle = mossG;
ctx.beginPath(); ctx.arc(0, 114 * sc, 104 * sc, Math.PI, 0); ctx.fill();

// Blooming 7-petal glowing lotus inside terrarium
const kLotus = s.spring(0.32, "bouncy");
ctx.save(); ctx.translate(0, 74 * sc); ctx.scale(kLotus, kLotus);
const petalAngles = [-0.85, -0.52, -0.25, 0.25, 0.52, 0.85, 0];
const petalCols = ["#c084fc", "#e879f9", "#f472b6", "#f472b6", "#e879f9", "#c084fc", "#fdf4ff"];
for (let i = 0; i < petalAngles.length; i++) {
  const ang = petalAngles[i] + Math.sin(s.t * 1.8 + i) * 0.03 * (i === 6 ? 0 : 1);
  ctx.save(); ctx.rotate(ang);
  const pg = ctx.createLinearGradient(0, 0, 0, -78 * sc);
  pg.addColorStop(0, "#7e22ce"); pg.addColorStop(0.6, petalCols[i]); pg.addColorStop(1, "#ffffff");
  ctx.fillStyle = pg;
  ctx.shadowColor = "#e879f9"; ctx.shadowBlur = 18 * sc;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-28 * sc, -26 * sc, -22 * sc, -66 * sc, 0, -82 * sc);
  ctx.bezierCurveTo(22 * sc, -66 * sc, 28 * sc, -26 * sc, 0, 0);
  ctx.fill();
  ctx.restore();
}
// Golden stamen core
ctx.fillStyle = "#fde047"; ctx.shadowColor = "#facc15"; ctx.shadowBlur = 16 * sc;
ctx.beginPath(); ctx.arc(0, -18 * sc, 11 * sc, 0, Math.PI * 2); ctx.fill();
ctx.restore();

// Rising fireflies inside glass bell jar
for (let f = 0; f < 9; f++) {
  const fy = 85 * sc - ((s.t * 28 + f * 24) % 185) * sc;
  const fx = Math.sin(s.t * 2.1 + f * 1.4) * 68 * sc;
  const fa = 0.4 + 0.6 * Math.sin(s.t * 4 + f);
  ctx.save();
  ctx.fillStyle = f % 2 === 0 ? "#5eead4" : "#fde047";
  ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 12 * sc; ctx.globalAlpha = fa;
  ctx.beginPath(); ctx.arc(fx, fy, 3.8 * sc, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// Glass Bell Dome contour & curved specular highlight
ctx.shadowBlur = 0;
ctx.strokeStyle = "rgba(186,230,253,0.65)"; ctx.lineWidth = 3.2 * sc;
ctx.fillStyle = "rgba(56,189,248,0.06)";
ctx.beginPath();
ctx.arc(0, -20 * sc, 106 * sc, Math.PI, 0);
ctx.lineTo(106 * sc, 114 * sc); ctx.lineTo(-106 * sc, 114 * sc); ctx.closePath();
ctx.fill(); ctx.stroke();
// Top glass handle knob
ctx.beginPath(); ctx.arc(0, -138 * sc, 14 * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
// Glass highlight crescent
ctx.strokeStyle = "rgba(255,255,255,0.48)"; ctx.lineWidth = 5 * sc; ctx.lineCap = "round";
ctx.beginPath(); ctx.arc(0, -18 * sc, 92 * sc, Math.PI * 1.12, Math.PI * 1.42); ctx.stroke();
ctx.beginPath(); ctx.moveTo(-88 * sc, 5 * sc); ctx.lineTo(-88 * sc, 86 * sc); ctx.stroke();
ctx.restore();

// Breathing cadence ring & status pill
const kPill = s.spring(0.55, "smooth");
if (kPill > 0.01) {
  ctx.save(); ctx.translate(cx, cy - 195 * sc); ctx.scale(kPill, kPill);
  ctx.fillStyle = "rgba(15,23,42,0.78)"; ctx.strokeStyle = "rgba(94,234,212,0.55)"; ctx.lineWidth = 1.8 * sc;
  ctx.beginPath(); ctx.roundRect(-155 * sc, -20 * sc, 310 * sc, 40 * sc, 20 * sc); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#5eead4"; ctx.beginPath(); ctx.arc(-125 * sc, 0, (5 + breath * 3) * sc, 0, Math.PI * 2); ctx.fill();
  ctx.font = "700 " + Math.round(13 * sc) + 'px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = "#f1f5f9"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("BIOLUMINESCENT CALM · 4-7-8 BREATH", 12 * sc, 1 * sc);
  ctx.restore();
}
s.sfx("swish", 0.1, 0.48); s.sfx("sparkle", 0.45, 0.55); s.sfx("bubble", 1.15, 0.42);`,
    ],
    [
      'Setiap tetes embun cahaya jatuh menyentuh permukaan air dengan riak yang meneduhkan.',
      'embun cahaya, riak',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.45, sc = Math.min(W / 720, H / 1280);
const bg = ctx.createLinearGradient(0, 0, 0, H);
bg.addColorStop(0, "#040d1a"); bg.addColorStop(0.6, "#081c2e"); bg.addColorStop(1, "#030914");
ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

// Giant arched botanical fern/monstera leaf in upper-left dripping a glowing dewdrop
const kLeaf = s.spring(0.06, "smooth");
ctx.save(); ctx.translate(80 * sc, cy - 165 * sc); ctx.scale(kLeaf, kLeaf);
const leafSway = Math.sin(s.t * 1.8) * 0.04;
ctx.rotate(0.18 + leafSway);
const lg = ctx.createLinearGradient(0, 0, 260 * sc, 90 * sc);
lg.addColorStop(0, "#065f46"); lg.addColorStop(0.7, "#10b981"); lg.addColorStop(1, "#6ee7b7");
ctx.fillStyle = lg; ctx.shadowColor = "rgba(16,185,129,0.35)"; ctx.shadowBlur = 22 * sc;
ctx.beginPath();
ctx.moveTo(-40 * sc, 0);
ctx.bezierCurveTo(60 * sc, -65 * sc, 195 * sc, -35 * sc, 275 * sc, 45 * sc);
ctx.bezierCurveTo(175 * sc, 75 * sc, 65 * sc, 55 * sc, -40 * sc, 0);
ctx.fill();
// Leaf center vein & side ribs
ctx.strokeStyle = "#a7f3d0"; ctx.lineWidth = 2.5 * sc;
ctx.beginPath(); ctx.moveTo(-30 * sc, 0); ctx.quadraticCurveTo(120 * sc, -8 * sc, 272 * sc, 44 * sc); ctx.stroke();
ctx.restore();

// Falling luminous teardrop from leaf tip (x = cx - 4 * sc) to pond surface (y = cy + 65 * sc)
const dropCycle = s.clamp((s.t - 0.18) / 0.72, 0, 1);
const pondY = cy + 75 * sc;
if (dropCycle < 1) {
  const dy = s.lerp(cy - 102 * sc, pondY, dropCycle * dropCycle);
  ctx.save(); ctx.translate(cx - 4 * sc, dy);
  ctx.fillStyle = "#67e8f9"; ctx.shadowColor = "#22d3ee"; ctx.shadowBlur = 20 * sc;
  ctx.beginPath();
  ctx.moveTo(0, -18 * sc);
  ctx.bezierCurveTo(14 * sc, 0, 12 * sc, 16 * sc, 0, 16 * sc);
  ctx.bezierCurveTo(-12 * sc, 16 * sc, -14 * sc, 0, 0, -18 * sc);
  ctx.fill();
  ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(-3 * sc, 4 * sc, 3.5 * sc, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// Expanding concentric bioluminescent water ripples on pond after impact (t >= 0.90)
for (let r = 0; r < 4; r++) {
  const rt = s.clamp((s.t - 0.88 - r * 0.24) / 1.45, 0, 1);
  if (rt > 0 && rt < 1) {
    ctx.save();
    ctx.strokeStyle = r % 2 === 0 ? "#22d3ee" : "#a855f7";
    ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 16 * sc;
    ctx.globalAlpha = (1 - rt) * 0.85;
    ctx.lineWidth = (4.2 - rt * 2.8) * sc;
    ctx.beginPath();
    ctx.ellipse(cx - 4 * sc, pondY, (24 + rt * 225) * sc, (8 + rt * 68) * sc, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// Floating glowing water lily pad on right side of pond
const kPad = s.spring(0.35, "smooth");
ctx.save(); ctx.translate(cx + 125 * sc, pondY + 18 * sc + Math.sin(s.t * 2.2) * 3 * sc); ctx.scale(kPad, kPad);
ctx.fillStyle = "#0d9488"; ctx.strokeStyle = "#5eead4"; ctx.lineWidth = 2 * sc;
ctx.beginPath(); ctx.ellipse(0, 0, 64 * sc, 22 * sc, 0, 0.2, Math.PI * 1.92); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
ctx.restore();

// 3 Translucent Floating Glass Reflection Cards rising gently above the water
const notes = [
  ["01 · Jernihkan Fokus", "Heningkan distraksi luar", -125, -45, "#38bdf8", 0.95],
  ["02 · Ritme Alami", "Mengalir tanpa terburu-buru", 115, -10, "#c084fc", 1.25],
];
for (let i = 0; i < notes.length; i++) {
  const [title, sub, ox, oy, col, t0] = notes[i];
  const kn = s.spring(t0, "smooth");
  if (kn > 0.01) {
    ctx.save();
    ctx.translate(cx + ox * sc, cy + oy * sc + Math.sin(s.t * 2 + i) * 4 * sc);
    ctx.scale(kn, kn);
    ctx.fillStyle = "rgba(15,23,42,0.74)"; ctx.strokeStyle = col; ctx.lineWidth = 2 * sc;
    ctx.shadowColor = col; ctx.shadowBlur = 18 * sc;
    ctx.beginPath(); ctx.roundRect(-118 * sc, -34 * sc, 236 * sc, 68 * sc, 16 * sc); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
    ctx.font = "800 " + Math.round(15 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#ffffff"; ctx.textAlign = "left";
    ctx.fillText(title, -98 * sc, -6 * sc);
    ctx.font = "500 " + Math.round(12 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#cbd5e1";
    ctx.fillText(sub, -98 * sc, 16 * sc);
    ctx.restore();
  }
}
s.sfx("drop", 0.88, 0.62); s.sfx("bubble", 1.05, 0.48); s.sfx("sparkle", 1.35, 0.52);`,
    ],
    [
      'Saat kabut malam mereda, gelombang aurora membuka jalan pikiran yang jernih.',
      'gelombang aurora, jernih',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.44, sc = Math.min(W / 720, H / 1280);
const bg = ctx.createLinearGradient(0, 0, 0, H);
bg.addColorStop(0, "#030712"); bg.addColorStop(0.55, "#0f172a"); bg.addColorStop(1, "#090d16");
ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

// Multi-ribbon flowing Aurora Borealis curtains across night sky
const auroraColors = [
  ["rgba(45,212,191,0.38)", "rgba(45,212,191,0)"],
  ["rgba(168,85,247,0.34)", "rgba(168,85,247,0)"],
  ["rgba(56,189,248,0.32)", "rgba(56,189,248,0)"]
];
for (let a = 0; a < 3; a++) {
  const baseY = (210 + a * 68) * sc;
  const ag = ctx.createLinearGradient(0, baseY - 95 * sc, 0, baseY + 85 * sc);
  ag.addColorStop(0, auroraColors[a][1]);
  ag.addColorStop(0.5, auroraColors[a][0]);
  ag.addColorStop(1, auroraColors[a][1]);
  ctx.fillStyle = ag;
  ctx.beginPath();
  ctx.moveTo(0, baseY + 80 * sc);
  for (let x = 0; x <= W; x += 36 * sc) {
    const waveY = baseY + Math.sin(x * 0.009 + s.t * (1.2 + a * 0.3) + a) * 42 * sc;
    ctx.lineTo(x, waveY - 75 * sc);
  }
  ctx.lineTo(W, baseY + 80 * sc);
  ctx.closePath();
  ctx.fill();
}

// Mountain ridge silhouette & mirror lake reflection
ctx.fillStyle = "#080f1e";
ctx.beginPath();
ctx.moveTo(0, cy + 75 * sc);
ctx.lineTo(130 * sc, cy - 20 * sc);
ctx.lineTo(255 * sc, cy + 32 * sc);
ctx.lineTo(420 * sc, cy - 58 * sc);
ctx.lineTo(565 * sc, cy + 18 * sc);
ctx.lineTo(W, cy - 28 * sc);
ctx.lineTo(W, cy + 75 * sc);
ctx.closePath(); ctx.fill();

// Wooden lake pier & glowing paper-glass lantern floating at pier end
const kPier = s.spring(0.15, "smooth");
ctx.save(); ctx.translate(cx, cy + 135 * sc); ctx.scale(kPier, kPier);
ctx.fillStyle = "#1e293b";
ctx.beginPath();
ctx.moveTo(-190 * sc, 80 * sc); ctx.lineTo(-45 * sc, -15 * sc);
ctx.lineTo(45 * sc, -15 * sc); ctx.lineTo(190 * sc, 80 * sc);
ctx.closePath(); ctx.fill();
for (let p = 0; p < 5; p++) {
  const py = -8 * sc + p * 18 * sc;
  const pw = (52 + p * 30) * sc;
  ctx.strokeStyle = "#475569"; ctx.lineWidth = 3 * sc;
  ctx.beginPath(); ctx.moveTo(-pw, py); ctx.lineTo(pw, py); ctx.stroke();
}
// Standing wooden lantern post & warm glowing lantern
ctx.fillStyle = "#334155"; ctx.fillRect(42 * sc, -125 * sc, 8 * sc, 115 * sc);
ctx.fillRect(14 * sc, -125 * sc, 34 * sc, 7 * sc);
const lanY = -98 * sc + Math.sin(s.t * 2.4) * 3 * sc;
ctx.fillStyle = "#fef08a"; ctx.shadowColor = "#facc15"; ctx.shadowBlur = 28 * sc;
ctx.beginPath(); ctx.roundRect(4 * sc, lanY, 28 * sc, 36 * sc, 8 * sc); ctx.fill();
ctx.restore();

// Soft glassmorphism insight card floating in sky
const kCard = s.spring(0.45, "smooth");
if (kCard > 0.01) {
  ctx.save(); ctx.translate(cx - 25 * sc, cy - 115 * sc); ctx.scale(kCard, kCard);
  ctx.fillStyle = "rgba(15,23,42,0.72)"; ctx.strokeStyle = "rgba(56,189,248,0.55)"; ctx.lineWidth = 2 * sc;
  ctx.beginPath(); ctx.roundRect(-195 * sc, -48 * sc, 390 * sc, 96 * sc, 22 * sc); ctx.fill(); ctx.stroke();
  ctx.font = "800 " + Math.round(12 * sc) + 'px "JetBrains Mono", monospace'; ctx.fillStyle = "#5eead4"; ctx.textAlign = "left";
  ctx.fillText("✦ CLARITY INDEX · 98.4%", -165 * sc, -16 * sc);
  ctx.font = "800 " + Math.round(21 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#ffffff";
  ctx.fillText("Pikiran Tenang, Keputusan Tajam", -165 * sc, 18 * sc);
  ctx.restore();
}
s.sfx("swish", 0.14, 0.45); s.sfx("sparkle", 0.55, 0.55);`,
    ],
    [
      'Simpan ketenangan ini dan bawa energi positif ke langkahmu berikutnya.',
      'energi positif',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.44, sc = Math.min(W / 720, H / 1280);
const bg = ctx.createRadialGradient(cx, cy, 20 * sc, cx, cy, 520 * sc);
bg.addColorStop(0, "#132a4a"); bg.addColorStop(0.55, "#091326"); bg.addColorStop(1, "#030712");
ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

// Ornate Brass & Glass Celestial Astrolabe / Lantern centerpiece with rotating rings
const kLan = s.spring(0.08, "bouncy");
ctx.save(); ctx.translate(cx, cy - 20 * sc); ctx.scale(kLan, kLan);
for (let r = 0; r < 3; r++) {
  ctx.save();
  ctx.rotate(s.t * (0.35 - r * 0.18) + r * 0.7);
  ctx.strokeStyle = r === 0 ? "rgba(94,234,212,0.65)" : r === 1 ? "rgba(192,132,252,0.55)" : "rgba(253,224,71,0.55)";
  ctx.lineWidth = (3.2 - r * 0.6) * sc;
  ctx.beginPath(); ctx.ellipse(0, 0, (145 - r * 24) * sc, (58 + r * 28) * sc, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
// Glowing crystal lotus heart
const cg = ctx.createRadialGradient(0, 0, 4 * sc, 0, 0, 64 * sc);
cg.addColorStop(0, "#ffffff"); cg.addColorStop(0.45, "#5eead4"); cg.addColorStop(1, "rgba(14,165,233,0)");
ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, 64 * sc, 0, Math.PI * 2); ctx.fill();
ctx.restore();

// Interactive Ambient Music / Calmness Player Card at bottom-center
const kPlayer = s.spring(0.38, "bouncy");
if (kPlayer > 0.01) {
  ctx.save(); ctx.translate(cx, cy + 175 * sc); ctx.scale(kPlayer, kPlayer);
  ctx.fillStyle = "rgba(15,23,42,0.86)"; ctx.strokeStyle = "rgba(94,234,212,0.6)"; ctx.lineWidth = 2.2 * sc;
  ctx.beginPath(); ctx.roundRect(-215 * sc, -54 * sc, 430 * sc, 108 * sc, 24 * sc); ctx.fill(); ctx.stroke();
  // Play button circle
  ctx.fillStyle = "#14b8a6"; ctx.beginPath(); ctx.arc(-152 * sc, 0, 28 * sc, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.moveTo(-158 * sc, -10 * sc); ctx.lineTo(-140 * sc, 0); ctx.lineTo(-158 * sc, 10 * sc); ctx.closePath(); ctx.fill();
  ctx.font = "800 " + Math.round(18 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#ffffff"; ctx.textAlign = "left";
  ctx.fillText("Soft Glow Ambient · 432Hz", -108 * sc, -10 * sc);
  // Animated progress wave bar
  const prog = s.clamp(s.t / 3.2, 0.25, 0.94);
  ctx.fillStyle = "#1e293b"; ctx.beginPath(); ctx.roundRect(-108 * sc, 12 * sc, 285 * sc, 10 * sc, 5 * sc); ctx.fill();
  ctx.fillStyle = "#5eead4"; ctx.beginPath(); ctx.roundRect(-108 * sc, 12 * sc, 285 * sc * prog, 10 * sc, 5 * sc); ctx.fill();
  ctx.restore();
}
s.sfx("sparkle", 0.15, 0.6); s.sfx("ding", 0.55, 0.55);`,
    ],
  ],

  // ============================================================================
  // 2. ZEN ORIGAMI (zen_paper) — Step-by-Step Japanese Origami & Washi Craft
  // ============================================================================
  zen_paper: [
    [
      'Dari selembar kertas washi hangat, setiap garis lipatan membentuk bangau origami yang anggun.',
      'lipatan, bangau origami',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.44, sc = Math.min(W / 720, H / 1280);
// Warm Japanese Washi Paper texture backdrop with subtle fibers & red Hanko stamp
ctx.fillStyle = "#fbf6ec"; ctx.fillRect(0, 0, W, H);
ctx.strokeStyle = "rgba(180,145,100,0.12)"; ctx.lineWidth = 1 * sc;
for (let i = 0; i < 28; i++) {
  const x = (i * 37) % W, y = (i * 73) % H;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 18 * sc, y + 6 * sc); ctx.stroke();
}
// Enso Zen Brush Circle behind the crane
const ensoProg = s.ease.out(s.clamp(s.t / 1.1, 0, 1));
ctx.save(); ctx.translate(cx, cy - 10 * sc);
ctx.strokeStyle = "rgba(120,53,15,0.14)"; ctx.lineWidth = 26 * sc; ctx.lineCap = "round";
ctx.beginPath(); ctx.arc(0, 0, 195 * sc, -Math.PI * 0.4, -Math.PI * 0.4 + ensoProg * Math.PI * 1.75); ctx.stroke();
ctx.restore();

// Traditional red Hanko seal stamp in top-right corner
const kStamp = s.pop(0.25, 0.28);
if (kStamp > 0.01) {
  ctx.save(); ctx.translate(W - 88 * sc, 138 * sc); ctx.scale(kStamp, kStamp);
  ctx.strokeStyle = "#dc2626"; ctx.lineWidth = 3 * sc;
  ctx.strokeRect(-24 * sc, -24 * sc, 48 * sc, 48 * sc);
  ctx.font = "900 " + Math.round(22 * sc) + 'px serif'; ctx.fillStyle = "#dc2626"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("禅", 0, 2 * sc);
  ctx.restore();
}

// Multi-facet Geometric Origami Tsuru (Crane) with animated wing fold & valley/mountain crease lines
const kBody = s.spring(0.08, "snappy");
const kWings = s.spring(0.35, "bouncy");
const kHeadTail = s.spring(0.62, "snappy");
const wingFlap = Math.sin(s.t * 3.2) * 14 * sc * Math.min(1, kWings);

ctx.save();
ctx.translate(cx, cy - 8 * sc + Math.sin(s.t * 2.2) * 6 * sc);
ctx.shadowColor = "rgba(120,53,15,0.18)"; ctx.shadowBlur = 22 * sc; ctx.shadowOffsetY = 14 * sc;

const poly = (pts, fill, stroke = "#7c2d12") => {
  ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = 2.2 * sc; ctx.lineJoin = "round";
  ctx.beginPath();
  pts.forEach(([px, py], idx) => idx === 0 ? ctx.moveTo(px * sc, py * sc) : ctx.lineTo(px * sc, py * sc));
  ctx.closePath(); ctx.fill(); ctx.stroke();
};

// Back Left Wing facet
if (kWings > 0.01) {
  ctx.save(); ctx.scale(kWings, kWings);
  poly([[-25, -10], [-185, -135 + wingFlap / sc], [-95, 22]], "#fb7185");
  ctx.restore();
}
// Tail & Neck/Head facets
if (kHeadTail > 0.01) {
  ctx.save(); ctx.scale(kHeadTail, kHeadTail);
  // Tail spire (left)
  poly([[-52, 18], [-158, -112], [-96, 36]], "#f43f5e");
  // Neck spire (right)
  poly([[54, 12], [148, -118], [96, 32]], "#fda4af");
  // Folded Crane Head & Beak
  poly([[148, -118], [192, -96], [134, -88]], "#e11d48");
  ctx.restore();
}
// Central Diamond Origami Body facets
if (kBody > 0.01) {
  ctx.save(); ctx.scale(kBody, kBody);
  poly([[0, -58], [96, 32], [0, 54]], "#f43f5e");
  poly([[0, -58], [-96, 36], [0, 54]], "#e11d48");
  // Dashed valley-fold guide line down the center
  ctx.strokeStyle = "rgba(255,255,255,0.65)"; ctx.setLineDash([5 * sc, 4 * sc]); ctx.lineWidth = 1.8 * sc;
  ctx.beginPath(); ctx.moveTo(0, -54 * sc); ctx.lineTo(0, 50 * sc); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
}
// Front Right Wing facet
if (kWings > 0.01) {
  ctx.save(); ctx.scale(kWings, kWings);
  poly([[0, -14], [195, -125 - wingFlap / sc], [88, 34], [-18, 28]], "#ffe4e6");
  ctx.restore();
}
ctx.restore();

// 3 Origami Step Folding Diagram Cards below the crane
const foldSteps = [
  ["STEP 01", "Valley Fold", "Lipat diagonal presisi", 0.3],
  ["STEP 02", "Petal Crease", "Tarik sayap simetris", 0.55],
  ["STEP 03", "Tsuru Form", "Kunci paruh & ekor", 0.8]
];
for (let i = 0; i < 3; i++) {
  const [st, title, sub, t0] = foldSteps[i];
  const ks = s.spring(t0, "snappy");
  if (ks > 0.01) {
    const sx = cx + (i - 1) * 195 * sc, sy = cy + 195 * sc;
    ctx.save(); ctx.translate(sx, sy); ctx.scale(ks, ks);
    ctx.fillStyle = "#fffbeb"; ctx.strokeStyle = "#d97706"; ctx.lineWidth = 2 * sc;
    ctx.beginPath(); ctx.roundRect(-86 * sc, -44 * sc, 172 * sc, 88 * sc, 12 * sc); ctx.fill(); ctx.stroke();
    ctx.font = "800 " + Math.round(11 * sc) + 'px "JetBrains Mono", monospace'; ctx.fillStyle = "#e11d48"; ctx.textAlign = "center";
    ctx.fillText(st, 0, -20 * sc);
    ctx.font = "800 " + Math.round(15 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#451a03";
    ctx.fillText(title, 0, 4 * sc);
    ctx.font = "600 " + Math.round(11 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#78350f";
    ctx.fillText(sub, 0, 24 * sc);
    ctx.restore();
  }
}
s.sfx("pageflip", 0.1, 0.65); s.sfx("paper", 0.4, 0.6); s.sfx("stamp", 0.82, 0.55);`,
    ],
    [
      'Di taman air kertas, ikan koi origami berenang mengelilingi bunga teratai lipat.',
      'ikan koi origami, teratai',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.45, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#f4efe4"; ctx.fillRect(0, 0, W, H);

// Circular Washi Pond Mat with layered paper cutout water rings
const kPond = s.spring(0.06, "smooth");
ctx.save(); ctx.translate(cx, cy); ctx.scale(kPond, kPond);
const pondRings = [[245, "#bae6fd"], [205, "#7dd3fc"], [160, "#38bdf8"]];
pondRings.forEach(([rad, col]) => {
  ctx.save();
  ctx.shadowColor = "rgba(15,23,42,0.14)"; ctx.shadowBlur = 14 * sc; ctx.shadowOffsetY = 6 * sc;
  ctx.fillStyle = col; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2.5 * sc;
  ctx.beginPath(); ctx.arc(0, 0, rad * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
});

// Central Multi-Petal Folded Origami Lotus Flower
const kLotus = s.spring(0.28, "bouncy");
ctx.save(); ctx.scale(kLotus, kLotus);
for (let layer = 0; layer < 2; layer++) {
  const count = 8;
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2 + layer * 0.39 + s.t * 0.15;
    const len = (layer === 0 ? 74 : 52) * sc;
    ctx.save(); ctx.rotate(ang);
    ctx.fillStyle = layer === 0 ? "#fda4af" : "#fff1f2";
    ctx.strokeStyle = "#e11d48"; ctx.lineWidth = 1.8 * sc;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-18 * sc, -len * 0.55); ctx.lineTo(0, -len); ctx.lineTo(18 * sc, -len * 0.55);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}
ctx.fillStyle = "#facc15"; ctx.beginPath(); ctx.arc(0, 0, 16 * sc, 0, Math.PI * 2); ctx.fill();
ctx.restore();

// 2 Geometric Origami Koi Fish swimming in orbit around the lotus
const drawOrigamiKoi = (orbitAng, bodyCol, accentCol) => {
  const r = 148 * sc;
  const kx = Math.cos(orbitAng) * r, ky = Math.sin(orbitAng) * r;
  ctx.save();
  ctx.translate(kx, ky);
  ctx.rotate(orbitAng + Math.PI * 0.5);
  const tailWag = Math.sin(s.t * 8 + orbitAng) * 0.22;
  ctx.shadowColor = "rgba(12,74,110,0.25)"; ctx.shadowBlur = 12 * sc; ctx.shadowOffsetY = 6 * sc;
  // Head triangle
  ctx.fillStyle = bodyCol; ctx.strokeStyle = "#7c2d12"; ctx.lineWidth = 1.8 * sc;
  ctx.beginPath(); ctx.moveTo(0, -42 * sc); ctx.lineTo(22 * sc, -10 * sc); ctx.lineTo(-22 * sc, -10 * sc); ctx.closePath(); ctx.fill(); ctx.stroke();
  // Mid diamond body with calico patch
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.moveTo(-22 * sc, -10 * sc); ctx.lineTo(22 * sc, -10 * sc); ctx.lineTo(14 * sc, 28 * sc); ctx.lineTo(-14 * sc, 28 * sc); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = accentCol;
  ctx.beginPath(); ctx.moveTo(0, -8 * sc); ctx.lineTo(15 * sc, 6 * sc); ctx.lineTo(0, 20 * sc); ctx.lineTo(-12 * sc, 6 * sc); ctx.closePath(); ctx.fill();
  // Side pectoral fins
  ctx.fillStyle = bodyCol;
  ctx.beginPath(); ctx.moveTo(-22 * sc, -6 * sc); ctx.lineTo(-42 * sc, 12 * sc); ctx.lineTo(-16 * sc, 14 * sc); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(22 * sc, -6 * sc); ctx.lineTo(42 * sc, 12 * sc); ctx.lineTo(16 * sc, 14 * sc); ctx.closePath(); ctx.fill(); ctx.stroke();
  // Wagging forked origami tail
  ctx.save(); ctx.translate(0, 28 * sc); ctx.rotate(tailWag);
  ctx.fillStyle = accentCol;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-22 * sc, 32 * sc); ctx.lineTo(0, 20 * sc); ctx.lineTo(22 * sc, 32 * sc); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.restore();
};

drawOrigamiKoi(s.t * 0.95, "#f97316", "#ef4444");
drawOrigamiKoi(s.t * 0.95 + Math.PI, "#1e293b", "#f59e0b");
ctx.restore();

s.sfx("paper", 0.14, 0.6); s.sfx("swish", 0.55, 0.5); s.sfx("tap", 1.1, 0.55);`,
    ],
    [
      'Gunung Fuji kertas, gerbang Torii merah, dan perahu origami membuka cakrawala cerita.',
      'Gunung Fuji, gerbang Torii',
      'dusk',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.46, sc = Math.min(W / 720, H / 1280);
// Warm Washi sunset backdrop
const sky = ctx.createLinearGradient(0, 0, 0, H);
sky.addColorStop(0, "#fef3c7"); sky.addColorStop(0.55, "#fde68a"); sky.addColorStop(1, "#fcd34d");
ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

// Giant Red Washi Rising Sun Circle with pleated paper rays
const kSun = s.spring(0.06, "smooth");
ctx.save(); ctx.translate(cx, cy - 95 * sc); ctx.scale(kSun, kSun);
ctx.fillStyle = "#e11d48"; ctx.shadowColor = "rgba(225,29,72,0.25)"; ctx.shadowBlur = 24 * sc;
ctx.beginPath(); ctx.arc(0, 0, 145 * sc, 0, Math.PI * 2); ctx.fill();
ctx.restore();

// Layered Origami Mount Fuji with faceted snow cap
const kFuji = s.spring(0.18, "snappy");
if (kFuji > 0.01) {
  ctx.save(); ctx.translate(cx, cy + 45 * sc); ctx.scale(kFuji, kFuji);
  // Left dark blue slope facet
  ctx.fillStyle = "#1e3a8a"; ctx.strokeStyle = "#172554"; ctx.lineWidth = 2.2 * sc;
  ctx.beginPath(); ctx.moveTo(-290 * sc, 60 * sc); ctx.lineTo(-42 * sc, -145 * sc); ctx.lineTo(0, -145 * sc); ctx.lineTo(0, 60 * sc); ctx.closePath(); ctx.fill(); ctx.stroke();
  // Right lighter indigo slope facet
  ctx.fillStyle = "#2563eb";
  ctx.beginPath(); ctx.moveTo(0, -145 * sc); ctx.lineTo(42 * sc, -145 * sc); ctx.lineTo(290 * sc, 60 * sc); ctx.lineTo(0, 60 * sc); ctx.closePath(); ctx.fill(); ctx.stroke();
  // Jagged Origami Snow Cap
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(-42 * sc, -145 * sc); ctx.lineTo(42 * sc, -145 * sc);
  ctx.lineTo(96 * sc, -72 * sc); ctx.lineTo(45 * sc, -88 * sc);
  ctx.lineTo(0, -58 * sc); ctx.lineTo(-45 * sc, -88 * sc);
  ctx.lineTo(-96 * sc, -72 * sc); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// Handcrafted Paper Torii Gate on left shore
const kTorii = s.spring(0.38, "bouncy");
if (kTorii > 0.01) {
  ctx.save(); ctx.translate(cx - 155 * sc, cy + 48 * sc); ctx.scale(kTorii, kTorii);
  ctx.fillStyle = "#dc2626"; ctx.strokeStyle = "#7f1d1d"; ctx.lineWidth = 2 * sc;
  // Two vertical pillars
  ctx.fillRect(-52 * sc, -95 * sc, 16 * sc, 115 * sc);
  ctx.fillRect(36 * sc, -95 * sc, 16 * sc, 115 * sc);
  // Lower tie beam (Nuki)
  ctx.fillRect(-66 * sc, -72 * sc, 132 * sc, 12 * sc);
  // Curved top lintel (Kasagi)
  ctx.beginPath();
  ctx.moveTo(-82 * sc, -104 * sc);
  ctx.quadraticCurveTo(0, -92 * sc, 82 * sc, -104 * sc);
  ctx.lineTo(74 * sc, -88 * sc);
  ctx.quadraticCurveTo(0, -78 * sc, -74 * sc, -88 * sc);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// Accordion-folded paper waves & gliding Origami Paper Boat (Kabuto/Sampan)
for (let w = 0; w < 3; w++) {
  const wy = cy + (95 + w * 42) * sc;
  const shift = Math.sin(s.t * 2 + w) * 18 * sc;
  ctx.fillStyle = w === 0 ? "#0284c7" : w === 1 ? "#0369a1" : "#075985";
  ctx.fillRect(0, wy, W, 55 * sc);
  ctx.strokeStyle = "rgba(255,255,255,0.45)"; ctx.lineWidth = 2 * sc;
  ctx.beginPath();
  for (let x = -40 * sc; x < W + 40 * sc; x += 48 * sc) {
    ctx.lineTo(x + shift, wy); ctx.lineTo(x + 24 * sc + shift, wy - 10 * sc);
  }
  ctx.stroke();
}

// Origami Paper Boat gliding across foreground water
const boatX = s.lerp(cx - 90 * sc, cx + 110 * sc, s.ease.inOut(s.clamp(s.t / 2.6, 0, 1)));
const boatY = cy + 108 * sc + Math.sin(s.t * 3.5) * 5 * sc;
ctx.save(); ctx.translate(boatX, boatY); ctx.rotate(Math.sin(s.t * 3) * 0.05);
ctx.fillStyle = "#fffbeb"; ctx.strokeStyle = "#92400e"; ctx.lineWidth = 2.2 * sc;
// Center sail peak
ctx.beginPath(); ctx.moveTo(-36 * sc, 0); ctx.lineTo(0, -54 * sc); ctx.lineTo(36 * sc, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
// Left & right folded hull triangles
ctx.fillStyle = "#fef3c7";
ctx.beginPath(); ctx.moveTo(-92 * sc, -16 * sc); ctx.lineTo(0, -16 * sc); ctx.lineTo(-56 * sc, 22 * sc); ctx.closePath(); ctx.fill(); ctx.stroke();
ctx.fillStyle = "#fde68a";
ctx.beginPath(); ctx.moveTo(0, -16 * sc); ctx.lineTo(92 * sc, -16 * sc); ctx.lineTo(56 * sc, 22 * sc); ctx.closePath(); ctx.fill(); ctx.stroke();
ctx.fillStyle = "#fffbeb";
ctx.beginPath(); ctx.moveTo(-56 * sc, 22 * sc); ctx.lineTo(0, -16 * sc); ctx.lineTo(56 * sc, 22 * sc); ctx.closePath(); ctx.fill(); ctx.stroke();
ctx.restore();

s.sfx("pageflip", 0.12, 0.6); s.sfx("paper", 0.45, 0.58); s.sfx("stamp", 0.9, 0.55);`,
    ],
    [
      'Gulungan perkamen bambu terbuka sempurna membawa pesan kebijaksanaan hari ini.',
      'perkamen bambu, kebijaksanaan',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.44, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#f7f1e3"; ctx.fillRect(0, 0, W, H);

// Falling Origami Sakura Cherry Blossom Petals
for (let p = 0; p < 12; p++) {
  const px = ((p * 67 + s.t * 32) % (W - 60)) + 30;
  const py = ((p * 95 + s.t * 55) % (H * 0.78)) + 60;
  ctx.save(); ctx.translate(px, py); ctx.rotate(s.t * 1.5 + p);
  ctx.fillStyle = p % 2 === 0 ? "#fda4af" : "#fecdd3";
  ctx.beginPath(); ctx.moveTo(0, -10 * sc); ctx.lineTo(9 * sc, 0); ctx.lineTo(0, 10 * sc); ctx.lineTo(-9 * sc, 0); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// Unrolling Japanese Hanging Scroll (Kakemono) with wooden rollers & silk brocade border
const unroll = s.ease.out(s.clamp((s.t - 0.08) / 0.95, 0, 1));
const halfW = (32 + unroll * 195) * sc;
ctx.save(); ctx.translate(cx, cy);
ctx.shadowColor = "rgba(120,53,15,0.22)"; ctx.shadowBlur = 24 * sc; ctx.shadowOffsetY = 12 * sc;
// Silk brocade frame
ctx.fillStyle = "#b45309"; ctx.strokeStyle = "#78350f"; ctx.lineWidth = 3 * sc;
ctx.beginPath(); ctx.roundRect(-halfW, -135 * sc, halfW * 2, 270 * sc, 8 * sc); ctx.fill(); ctx.stroke();
// Inner Washi calligraphy sheet
if (unroll > 0.15) {
  ctx.fillStyle = "#fffbeb";
  ctx.fillRect(-halfW + 18 * sc, -115 * sc, (halfW - 18 * sc) * 2, 230 * sc);
}
// Left & Right Cylindrical Rosewood Scroll Rollers with Gold Caps
[-halfW, halfW].forEach((rx) => {
  ctx.fillStyle = "#451a03";
  ctx.beginPath(); ctx.roundRect(rx - 14 * sc, -152 * sc, 28 * sc, 304 * sc, 12 * sc); ctx.fill();
  ctx.fillStyle = "#f59e0b";
  ctx.fillRect(rx - 14 * sc, -152 * sc, 28 * sc, 18 * sc);
  ctx.fillRect(rx - 14 * sc, 134 * sc, 28 * sc, 18 * sc);
});

if (unroll > 0.55) {
  const txtAlpha = s.clamp((unroll - 0.55) / 0.4, 0, 1);
  ctx.globalAlpha = txtAlpha;
  ctx.font = "900 " + Math.round(13 * sc) + 'px "JetBrains Mono", monospace'; ctx.fillStyle = "#e11d48"; ctx.textAlign = "center";
  ctx.fillText("ZEN ORIGAMI · KREATORLAB", 0, -68 * sc);
  ctx.font = "900 " + Math.round(28 * sc) + 'px "Playfair Display", Georgia, serif'; ctx.fillStyle = "#1c1917";
  ctx.fillText("Lipat Keraguan,", 0, -18 * sc);
  ctx.fillText("Terbangkan Karya.", 0, 24 * sc);
  // Red Wax/Hanko Seal Stamp on Scroll
  ctx.fillStyle = "#dc2626";
  ctx.beginPath(); ctx.roundRect(-58 * sc, 56 * sc, 116 * sc, 36 * sc, 18 * sc); ctx.fill();
  ctx.font = "800 " + Math.round(14 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#ffffff";
  ctx.fillText("SIMPAN KARYA", 0, 75 * sc);
}
ctx.restore();
s.sfx("pageflip", 0.1, 0.65); s.sfx("stamp", 0.95, 0.72);`,
    ],
  ],

  // ============================================================================
  // 3. CONFETTI BLAST (confetti_blast) — Real Party Cannon, Cake, Trophy & Ticket
  // ============================================================================
  confetti_blast: [
    [
      'Tarik pelatuk meriam pesta emas! Ribuan pita warna-warni langsung meledak meriah di udara!',
      'meriam pesta, meledak meriah',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.45, sc = Math.min(W / 720, H / 1280);
// Vibrant festive cream backdrop with subtle radial sunburst
ctx.fillStyle = "#fffbeb"; ctx.fillRect(0, 0, W, H);
ctx.save(); ctx.translate(cx, cy + 50 * sc);
for (let r = 0; r < 16; r++) {
  if (r % 2 === 0) continue;
  ctx.save(); ctx.rotate((r / 16) * Math.PI * 2 + s.t * 0.15);
  ctx.fillStyle = "rgba(251,191,36,0.14)";
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-45 * sc, -650 * sc); ctx.lineTo(45 * sc, -650 * sc); ctx.closePath(); ctx.fill();
  ctx.restore();
}
ctx.restore();

// Handcrafted Angled Brass & Striped Party Confetti Cannon in bottom-left
const kCannon = s.spring(0.05, "bouncy");
const recoil = s.t >= 0.25 && s.t <= 0.55 ? Math.sin(((s.t - 0.25) / 0.3) * Math.PI) * -18 * sc : 0;
ctx.save();
ctx.translate(cx - 135 * sc + recoil * 0.7, cy + 125 * sc - recoil * 0.7);
ctx.rotate(-0.68);
ctx.scale(kCannon, kCannon);
ctx.shadowColor = "rgba(15,23,42,0.22)"; ctx.shadowBlur = 18 * sc; ctx.shadowOffsetY = 10 * sc;
// Cannon barrel cone
const cg = ctx.createLinearGradient(-48 * sc, 0, 48 * sc, 0);
cg.addColorStop(0, "#d97706"); cg.addColorStop(0.5, "#fde047"); cg.addColorStop(1, "#b45309");
ctx.fillStyle = cg; ctx.strokeStyle = "#1e1b4b"; ctx.lineWidth = 4 * sc;
ctx.beginPath();
ctx.moveTo(-32 * sc, 95 * sc); ctx.lineTo(-56 * sc, -85 * sc);
ctx.lineTo(56 * sc, -85 * sc); ctx.lineTo(32 * sc, 95 * sc);
ctx.closePath(); ctx.fill(); ctx.stroke();
// Festive magenta diagonal stripes on cannon
ctx.fillStyle = "#ec4899";
ctx.beginPath(); ctx.moveTo(-42 * sc, 25 * sc); ctx.lineTo(46 * sc, -10 * sc); ctx.lineTo(49 * sc, -36 * sc); ctx.lineTo(-47 * sc, 0); ctx.closePath(); ctx.fill();
ctx.beginPath(); ctx.moveTo(-36 * sc, 72 * sc); ctx.lineTo(39 * sc, 38 * sc); ctx.lineTo(42 * sc, 14 * sc); ctx.lineTo(-40 * sc, 48 * sc); ctx.closePath(); ctx.fill();
// Cannon muzzle opening ellipse
ctx.fillStyle = "#1e1b4b";
ctx.beginPath(); ctx.ellipse(0, -85 * sc, 56 * sc, 16 * sc, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
ctx.restore();

// Curled Spiraling Ribbons, Stars & Foil Confetti blasting out of the cannon muzzle
const blastT = s.clamp((s.t - 0.22) / 1.4, 0, 1);
if (blastT > 0.01) {
  const cols = ["#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];
  // 6 Curly Serpentine Streamer Ribbons
  for (let sr = 0; sr < 6; sr++) {
    const ang = -0.95 + sr * 0.22;
    const dist = s.ease.out(blastT) * (240 + (sr % 3) * 55) * sc;
    ctx.save();
    ctx.translate(cx - 75 * sc, cy + 55 * sc);
    ctx.rotate(ang);
    ctx.strokeStyle = cols[sr % cols.length]; ctx.lineWidth = 6 * sc; ctx.lineCap = "round";
    ctx.beginPath();
    for (let d = 0; d <= dist; d += 12 * sc) {
      const wave = Math.sin(d * 0.08 - s.t * 8 + sr) * 14 * sc;
      if (d === 0) ctx.moveTo(0, 0); else ctx.lineTo(wave, -d);
    }
    ctx.stroke();
    ctx.restore();
  }
  // 28 Tumbling Foil Confetti (Stars, Diamonds, Tickets)
  for (let i = 0; i < 28; i++) {
    const ang = -1.35 + (i / 28) * 1.55;
    const speed = 135 + (i % 5) * 58;
    const px = cx - 75 * sc + Math.sin(ang + 0.6) * speed * blastT * sc;
    const py = cy + 55 * sc - Math.cos(ang * 0.5) * speed * blastT * sc + blastT * blastT * 95 * sc;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(s.t * (4 + (i % 4)) + i);
    ctx.fillStyle = cols[i % cols.length];
    if (i % 3 === 0) {
      ctx.fillRect(-9 * sc, -5 * sc, 18 * sc, 10 * sc);
    } else if (i % 3 === 1) {
      ctx.beginPath(); ctx.arc(0, 0, 7 * sc, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(0, -9 * sc); ctx.lineTo(8 * sc, 0); ctx.lineTo(0, 9 * sc); ctx.lineTo(-8 * sc, 0); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
}

// Neo-Brutalist Celebration Headline Banner
const kBanner = s.spring(0.38, "bouncy");
if (kBanner > 0.01) {
  ctx.save(); ctx.translate(cx + 25 * sc, cy - 125 * sc); ctx.rotate(-0.04); ctx.scale(kBanner, kBanner);
  ctx.fillStyle = "#1e1b4b"; ctx.beginPath(); ctx.roundRect(-185 * sc, -42 * sc, 370 * sc, 94 * sc, 22 * sc); ctx.fill();
  ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#1e1b4b"; ctx.lineWidth = 4 * sc;
  ctx.beginPath(); ctx.roundRect(-192 * sc, -50 * sc, 370 * sc, 94 * sc, 22 * sc); ctx.fill(); ctx.stroke();
  ctx.font = "900 " + Math.round(34 * sc) + 'px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = "#ec4899"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("100K MILESTONE!", -6 * sc, -2 * sc);
  ctx.restore();
}
s.sfx("pop", 0.22, 0.72); s.sfx("coin", 0.48, 0.65); s.sfx("sparkle", 0.85, 0.6);`,
    ],
    [
      'Kue perayaan tiga tingkat lengkap dengan lilin menyala siap memeriahkan pencapaianmu!',
      'Kue perayaan, lilin menyala',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.48, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#fdf2f8"; ctx.fillRect(0, 0, W, H);

// Festive Bunting Flags across top
const flagCols = ["#ec4899", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"];
ctx.strokeStyle = "#1e1b4b"; ctx.lineWidth = 3 * sc;
ctx.beginPath(); ctx.moveTo(0, 120 * sc); ctx.quadraticCurveTo(cx, 175 * sc, W, 120 * sc); ctx.stroke();
for (let f = 0; f < 9; f++) {
  const fx = (45 + f * 78) * sc;
  const fy = (124 + Math.sin((f / 8) * Math.PI) * 26) * sc;
  ctx.fillStyle = flagCols[f % flagCols.length];
  ctx.beginPath(); ctx.moveTo(fx - 22 * sc, fy); ctx.lineTo(fx + 22 * sc, fy); ctx.lineTo(fx, fy + 44 * sc); ctx.closePath(); ctx.fill(); ctx.stroke();
}

// Handcrafted 3-Tier Celebration Cake with scalloped icing drips, strawberries & flickering candles
const drawCakeTier = (y, w, h, spongeCol, icingCol, t0) => {
  const kt = s.spring(t0, "bouncy");
  if (kt <= 0.01) return;
  ctx.save(); ctx.translate(cx, y); ctx.scale(kt, kt);
  ctx.strokeStyle = "#1e1b4b"; ctx.lineWidth = 4 * sc;
  // Sponge cake body
  ctx.fillStyle = spongeCol;
  ctx.beginPath(); ctx.roundRect(-w * 0.5, -h, w, h, 16 * sc); ctx.fill(); ctx.stroke();
  // Scalloped dripping icing top
  ctx.fillStyle = icingCol;
  ctx.beginPath();
  ctx.moveTo(-w * 0.5, -h + 16 * sc);
  ctx.lineTo(-w * 0.5, -h + 24 * sc);
  const drips = 6;
  const dw = w / drips;
  for (let d = 0; d < drips; d++) {
    const dx = -w * 0.5 + d * dw;
    const dripDepth = (24 + (d % 2) * 14) * sc;
    ctx.quadraticCurveTo(dx + dw * 0.5, -h + dripDepth + 18 * sc, dx + dw, -h + 22 * sc);
  }
  ctx.lineTo(w * 0.5, -h + 12 * sc);
  ctx.quadraticCurveTo(w * 0.5, -h, w * 0.5 - 14 * sc, -h);
  ctx.lineTo(-w * 0.5 + 14 * sc, -h);
  ctx.quadraticCurveTo(-w * 0.5, -h, -w * 0.5, -h + 16 * sc);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
};

// Cake Stand Pedestal
const kStand = s.spring(0.05, "snappy");
ctx.save(); ctx.translate(cx, cy + 165 * sc); ctx.scale(kStand, kStand);
ctx.fillStyle = "#cbd5e1"; ctx.strokeStyle = "#1e1b4b"; ctx.lineWidth = 4 * sc;
ctx.beginPath(); ctx.moveTo(-55 * sc, 0); ctx.lineTo(-85 * sc, 52 * sc); ctx.lineTo(85 * sc, 52 * sc); ctx.lineTo(55 * sc, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
ctx.fillStyle = "#f8fafc";
ctx.beginPath(); ctx.roundRect(-215 * sc, -16 * sc, 430 * sc, 20 * sc, 10 * sc); ctx.fill(); ctx.stroke();
ctx.restore();

// Tier 1 (Bottom), Tier 2 (Middle), Tier 3 (Top)
drawCakeTier(cy + 149 * sc, 340 * sc, 96 * sc, "#fde68a", "#f472b6", 0.12);
drawCakeTier(cy + 53 * sc, 250 * sc, 84 * sc, "#fbcfe8", "#38bdf8", 0.28);
drawCakeTier(cy - 31 * sc, 168 * sc, 72 * sc, "#fef08a", "#a855f7", 0.44);

// 3 Striped Birthday Candles with dancing golden flames on top tier
const kCandles = s.spring(0.62, "bouncy");
if (kCandles > 0.01) {
  [-44, 0, 44].forEach((ox, idx) => {
    ctx.save();
    ctx.translate(cx + ox * sc, cy - 103 * sc);
    ctx.scale(kCandles, kCandles);
    ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#1e1b4b"; ctx.lineWidth = 3 * sc;
    ctx.beginPath(); ctx.roundRect(-8 * sc, -48 * sc, 16 * sc, 48 * sc, 4 * sc); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(-6 * sc, -36 * sc, 12 * sc, 8 * sc);
    ctx.fillRect(-6 * sc, -18 * sc, 12 * sc, 8 * sc);
    // Flickering teardrop flame
    const sway = Math.sin(s.t * 10 + idx * 2) * 3.5 * sc;
    ctx.fillStyle = "#facc15"; ctx.shadowColor = "#f59e0b"; ctx.shadowBlur = 18 * sc;
    ctx.beginPath();
    ctx.moveTo(0, -52 * sc);
    ctx.quadraticCurveTo(12 * sc, -66 * sc, sway, -82 * sc);
    ctx.quadraticCurveTo(-12 * sc, -66 * sc, 0, -52 * sc);
    ctx.fill();
    ctx.restore();
  });
}
s.sfx("pop", 0.14, 0.65); s.sfx("pop", 0.3, 0.65); s.sfx("pop", 0.46, 0.65); s.sfx("sparkle", 0.7, 0.7);`,
    ],
    [
      'Piala emas juara utama terangkat tinggi diiringi kilau bintang kemenangan!',
      'Piala emas, juara utama',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.45, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#0f1026"; ctx.fillRect(0, 0, W, H);

// Spotlight beams behind trophy
ctx.save(); ctx.translate(cx, cy + 160 * sc);
for (let b = -1; b <= 1; b++) {
  ctx.save(); ctx.rotate(b * 0.35 + Math.sin(s.t * 1.5 + b) * 0.08);
  const bg = ctx.createLinearGradient(0, 0, 0, -520 * sc);
  bg.addColorStop(0, "rgba(250,204,21,0.28)"); bg.addColorStop(1, "rgba(250,204,21,0)");
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.moveTo(-18 * sc, 0); ctx.lineTo(-115 * sc, -520 * sc); ctx.lineTo(115 * sc, -520 * sc); ctx.lineTo(18 * sc, 0); ctx.closePath(); ctx.fill();
  ctx.restore();
}
ctx.restore();

// Handcrafted Championship Gold Trophy Cup with twin handles, pedestal & engraved #1 Star
const kTrophy = s.spring(0.08, "bouncy");
ctx.save();
ctx.translate(cx, cy + 15 * sc + Math.sin(s.t * 2.5) * 5 * sc);
ctx.scale(kTrophy, kTrophy);

// Left & Right Curved Gold Ear Handles
ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 14 * sc; ctx.lineCap = "round";
ctx.beginPath();
ctx.moveTo(-78 * sc, -105 * sc);
ctx.bezierCurveTo(-155 * sc, -115 * sc, -145 * sc, -10 * sc, -58 * sc, -8 * sc);
ctx.stroke();
ctx.beginPath();
ctx.moveTo(78 * sc, -105 * sc);
ctx.bezierCurveTo(155 * sc, -115 * sc, 145 * sc, -10 * sc, 58 * sc, -8 * sc);
ctx.stroke();

// Trophy Cup Chalice Bowl with metallic gold gradient
const tg = ctx.createLinearGradient(-95 * sc, 0, 95 * sc, 0);
tg.addColorStop(0, "#b45309"); tg.addColorStop(0.35, "#fde047"); tg.addColorStop(0.65, "#f59e0b"); tg.addColorStop(1, "#78350f");
ctx.fillStyle = tg; ctx.strokeStyle = "#fef08a"; ctx.lineWidth = 3 * sc;
ctx.beginPath();
ctx.moveTo(-95 * sc, -135 * sc);
ctx.lineTo(95 * sc, -135 * sc);
ctx.bezierCurveTo(95 * sc, -15 * sc, 45 * sc, 25 * sc, 24 * sc, 38 * sc);
ctx.lineTo(-24 * sc, 38 * sc);
ctx.bezierCurveTo(-45 * sc, 25 * sc, -95 * sc, -15 * sc, -95 * sc, -135 * sc);
ctx.closePath(); ctx.fill(); ctx.stroke();

// Stem & Mahogany Base Pedestal with gold plaque
ctx.fillRect(-18 * sc, 38 * sc, 36 * sc, 56 * sc);
ctx.beginPath(); ctx.ellipse(0, 96 * sc, 58 * sc, 14 * sc, 0, 0, Math.PI * 2); ctx.fill();
ctx.fillStyle = "#1e1b4b"; ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 3.5 * sc;
ctx.beginPath(); ctx.roundRect(-84 * sc, 98 * sc, 168 * sc, 64 * sc, 10 * sc); ctx.fill(); ctx.stroke();
ctx.fillStyle = "#fde047"; ctx.fillRect(-58 * sc, 114 * sc, 116 * sc, 32 * sc);
ctx.font = "900 " + Math.round(16 * sc) + 'px "JetBrains Mono", monospace'; ctx.fillStyle = "#1e1b4b"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
ctx.fillText("CHAMPION #1", 0, 131 * sc);

// 5-Pointed Star Emblem on Cup Front
ctx.fillStyle = "#ffffff";
ctx.beginPath();
for (let sIdx = 0; sIdx < 10; sIdx++) {
  const r = (sIdx % 2 === 0 ? 34 : 15) * sc;
  const a = -Math.PI * 0.5 + (sIdx * Math.PI) / 5;
  const sx = Math.cos(a) * r, sy = -62 * sc + Math.sin(a) * r;
  if (sIdx === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
}
ctx.closePath(); ctx.fill();
ctx.restore();

// Orbiting Victory Medals & Confetti bursts
const kRibbon = s.spring(0.45, "bouncy");
if (kRibbon > 0.01) {
  ctx.save(); ctx.translate(cx, cy - 175 * sc); ctx.scale(kRibbon, kRibbon);
  ctx.fillStyle = "#10b981"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3 * sc;
  ctx.beginPath(); ctx.roundRect(-165 * sc, -24 * sc, 330 * sc, 48 * sc, 24 * sc); ctx.fill(); ctx.stroke();
  ctx.font = "900 " + Math.round(18 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("★ GRAND WINNER · TOP 1% ★", 0, 1 * sc);
  ctx.restore();
}
s.sfx("coin", 0.12, 0.72); s.sfx("fanfare", 0.45, 0.68); s.sfx("sparkle", 0.9, 0.65);`,
    ],
    [
      'Ambil tiket emas VIP-mu sekarang dan rayakan kesuksesan bersama kami!',
      'tiket emas VIP, rayakan',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.44, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#fef9c3"; ctx.fillRect(0, 0, W, H);

// Falling multicolored confetti shower
const cols = ["#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
for (let i = 0; i < 24; i++) {
  const px = ((i * 53) % (W - 40)) + 20;
  const py = ((i * 89 + s.t * 140) % (H * 0.85));
  ctx.save(); ctx.translate(px, py); ctx.rotate(s.t * 3 + i);
  ctx.fillStyle = cols[i % cols.length];
  ctx.fillRect(-8 * sc, -4 * sc, 16 * sc, 8 * sc);
  ctx.restore();
}

// Handcrafted Perforated Golden VIP Celebration Admit-One Ticket with barcode & foil shimmer
const kTicket = s.spring(0.08, "bouncy");
ctx.save();
ctx.translate(cx, cy);
ctx.rotate(-0.05 + Math.sin(s.t * 2.5) * 0.02);
ctx.scale(kTicket, kTicket);
ctx.shadowColor = "rgba(15,23,42,0.25)"; ctx.shadowBlur = 24 * sc; ctx.shadowOffsetY = 14 * sc;

const tg = ctx.createLinearGradient(-235 * sc, -110 * sc, 235 * sc, 110 * sc);
tg.addColorStop(0, "#f59e0b"); tg.addColorStop(0.5, "#fef08a"); tg.addColorStop(1, "#d97706");
ctx.fillStyle = tg; ctx.strokeStyle = "#1e1b4b"; ctx.lineWidth = 4.5 * sc;
ctx.beginPath(); ctx.roundRect(-235 * sc, -108 * sc, 470 * sc, 216 * sc, 22 * sc); ctx.fill(); ctx.stroke();

// Ticket side punch-out notches
ctx.fillStyle = "#fef9c3";
ctx.beginPath(); ctx.arc(-235 * sc, 0, 24 * sc, -Math.PI * 0.5, Math.PI * 0.5); ctx.fill(); ctx.stroke();
ctx.beginPath(); ctx.arc(235 * sc, 0, 24 * sc, Math.PI * 0.5, Math.PI * 1.5); ctx.fill(); ctx.stroke();

// Perforated stub divider line
ctx.strokeStyle = "#1e1b4b"; ctx.lineWidth = 3 * sc; ctx.setLineDash([8 * sc, 6 * sc]);
ctx.beginPath(); ctx.moveTo(115 * sc, -102 * sc); ctx.lineTo(115 * sc, 102 * sc); ctx.stroke(); ctx.setLineDash([]);

// Ticket Typography & Star Crest
ctx.font = "800 " + Math.round(13 * sc) + 'px "JetBrains Mono", monospace'; ctx.fillStyle = "#78350f"; ctx.textAlign = "left";
ctx.fillText("★ VIP CELEBRATION PASS · NO. 0088", -195 * sc, -62 * sc);
ctx.font = "900 " + Math.round(38 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#1e1b4b";
ctx.fillText("GOLDEN ACCESS", -195 * sc, -12 * sc);
ctx.fillStyle = "#ec4899"; ctx.beginPath(); ctx.roundRect(-195 * sc, 22 * sc, 215 * sc, 46 * sc, 12 * sc); ctx.fill();
ctx.font = "900 " + Math.round(18 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#ffffff"; ctx.textAlign = "center";
ctx.fillText("KLAIM SEKARANG →", -87 * sc, 46 * sc);

// Barcode on right stub
ctx.fillStyle = "#1e1b4b";
for (let b = 0; b < 11; b++) {
  const bh = (b % 3 === 0 ? 6 : 3) * sc;
  ctx.fillRect(142 * sc, (-68 + b * 13) * sc, 54 * sc, bh);
}
ctx.restore();
s.sfx("pop", 0.12, 0.7); s.sfx("coin", 0.5, 0.72); s.sfx("ding", 0.95, 0.68);`,
    ],
  ],

  // ============================================================================
  // 4. STICKER BOMB Y2K (sticker_bomb) — Die-Cut Vinyl Stickers Peeling & Slapping
  // ============================================================================
  sticker_bomb: [
    [
      'Tempel stiker die-cut vinyl favoritmu! Dari sneaker tebal sampai kaset retro langsung nempel!',
      'stiker die-cut, langsung nempel',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.45, sc = Math.min(W / 720, H / 1280);
// Y2K Checkered & Halftone Dot Zine Mat Backdrop
ctx.fillStyle = "#ffde59"; ctx.fillRect(0, 0, W, H);
ctx.fillStyle = "rgba(0,0,0,0.07)";
for (let y = 20 * sc; y < H; y += 36 * sc) {
  for (let x = 20 * sc; x < W; x += 36 * sc) {
    ctx.beginPath(); ctx.arc(x, y, 4 * sc, 0, Math.PI * 2); ctx.fill();
  }
}

// Helper for Die-Cut Vinyl Sticker with thick white border, hard black offset shadow & peel-slap animation
const slapSticker = (x, y, rot, t0, drawFn) => {
  const k = s.spring(t0, "bouncy");
  if (k <= 0.01) return;
  const slapScale = k < 0.7 ? 1.35 - k * 0.3 : k;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot + (1 - Math.min(1, k)) * 0.25);
  ctx.scale(slapScale, slapScale);
  ctx.shadowColor = "rgba(15,23,42,0.32)"; ctx.shadowBlur = 0; ctx.shadowOffsetX = 8 * sc; ctx.shadowOffsetY = 10 * sc;
  drawFn();
  ctx.restore();
};

// Sticker 1: Chunky Y2K Streetwear High-Top Sneaker Sticker (Top-Left)
slapSticker(cx - 95 * sc, cy - 115 * sc, -0.12, 0.08, () => {
  // White die-cut vinyl contour
  ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 4.5 * sc;
  ctx.beginPath(); ctx.roundRect(-135 * sc, -78 * sc, 270 * sc, 156 * sc, 36 * sc); ctx.fill(); ctx.stroke();
  ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
  // Chunky rubber sole
  ctx.fillStyle = "#f8fafc"; ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 4 * sc;
  ctx.beginPath(); ctx.roundRect(-108 * sc, 22 * sc, 216 * sc, 32 * sc, 12 * sc); ctx.fill(); ctx.stroke();
  // Red & black leather upper
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.moveTo(-98 * sc, 22 * sc); ctx.lineTo(-92 * sc, -52 * sc);
  ctx.lineTo(-18 * sc, -52 * sc); ctx.lineTo(35 * sc, -8 * sc);
  ctx.lineTo(96 * sc, -4 * sc); ctx.lineTo(102 * sc, 22 * sc);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // White lightning swoosh & laces
  ctx.fillStyle = "#fde047";
  ctx.beginPath(); ctx.moveTo(-55 * sc, -10 * sc); ctx.lineTo(15 * sc, -4 * sc); ctx.lineTo(-10 * sc, 14 * sc); ctx.closePath(); ctx.fill(); ctx.stroke();
});

// Sticker 2: Retro Transparent Cassette Tape Sticker (Right-Center)
slapSticker(cx + 95 * sc, cy + 15 * sc, 0.1, 0.34, () => {
  ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 4.5 * sc;
  ctx.beginPath(); ctx.roundRect(-132 * sc, -84 * sc, 264 * sc, 168 * sc, 26 * sc); ctx.fill(); ctx.stroke();
  ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
  ctx.fillStyle = "#ec4899";
  ctx.beginPath(); ctx.roundRect(-116 * sc, -68 * sc, 232 * sc, 136 * sc, 16 * sc); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#fef08a"; ctx.fillRect(-96 * sc, -48 * sc, 192 * sc, 72 * sc); ctx.strokeRect(-96 * sc, -48 * sc, 192 * sc, 72 * sc);
  // Dual spinning tape reels
  [-48, 48].forEach((rx) => {
    ctx.save(); ctx.translate(rx * sc, -12 * sc); ctx.rotate(s.t * 4);
    ctx.fillStyle = "#0f172a"; ctx.beginPath(); ctx.arc(0, 0, 18 * sc, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.fillRect(-4 * sc, -14 * sc, 8 * sc, 28 * sc); ctx.fillRect(-14 * sc, -4 * sc, 28 * sc, 8 * sc);
    ctx.restore();
  });
  ctx.font = "900 " + Math.round(13 * sc) + 'px "JetBrains Mono", monospace'; ctx.fillStyle = "#0f172a"; ctx.textAlign = "center";
  ctx.fillText("Y2K MIXTAPE · VOL.1", 0, -34 * sc);
});

// Sticker 3: Arcade Gamepad Controller Sticker (Bottom-Left)
slapSticker(cx - 75 * sc, cy + 148 * sc, -0.07, 0.62, () => {
  ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 4.5 * sc;
  ctx.beginPath(); ctx.roundRect(-135 * sc, -74 * sc, 270 * sc, 148 * sc, 48 * sc); ctx.fill(); ctx.stroke();
  ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
  ctx.fillStyle = "#3b82f6";
  ctx.beginPath(); ctx.roundRect(-118 * sc, -58 * sc, 236 * sc, 116 * sc, 38 * sc); ctx.fill(); ctx.stroke();
  // D-Pad on left
  ctx.fillStyle = "#fde047";
  ctx.fillRect(-78 * sc, -10 * sc, 44 * sc, 16 * sc);
  ctx.fillRect(-64 * sc, -24 * sc, 16 * sc, 44 * sc);
  // A/B Buttons on right
  ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(48 * sc, 8 * sc, 13 * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#10b981"; ctx.beginPath(); ctx.arc(78 * sc, -12 * sc, 13 * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
});

// Sticker 4: Acid Smiley Starburst Badge (Top-Right)
slapSticker(cx + 145 * sc, cy - 155 * sc, 0.18, 0.86, () => {
  ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 4 * sc;
  ctx.beginPath(); ctx.arc(0, 0, 58 * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
  ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(0, 0, 46 * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#0f172a";
  ctx.beginPath(); ctx.ellipse(-14 * sc, -10 * sc, 5 * sc, 11 * sc, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(14 * sc, -10 * sc, 5 * sc, 11 * sc, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, 4 * sc, 24 * sc, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
});

s.sfx("pageflip", 0.08, 0.65); s.sfx("stamp", 0.34, 0.7); s.sfx("stamp", 0.62, 0.72); s.sfx("pop", 0.86, 0.68);`,
    ],
    [
      'Ponsel lipat Y2K dan pemutar musik retro tampil mencolok dengan garis kontur putih tebal!',
      'Ponsel lipat Y2K, kontur putih',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.45, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#1e1b4b"; ctx.fillRect(0, 0, W, H);
// Neon cyber grid
ctx.strokeStyle = "rgba(236,72,153,0.16)"; ctx.lineWidth = 1.5 * sc;
for (let x = 0; x < W; x += 48 * sc) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
for (let y = 0; y < H; y += 48 * sc) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

// Centerpiece Die-Cut Y2K Metallic Pink Flip Phone (Clamshell Phone) snapping open
const kPhone = s.spring(0.1, "bouncy");
ctx.save(); ctx.translate(cx - 25 * sc, cy + 10 * sc); ctx.rotate(-0.08); ctx.scale(kPhone, kPhone);
// Thick white die-cut sticker outline
ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 5 * sc;
ctx.beginPath(); ctx.roundRect(-102 * sc, -210 * sc, 204 * sc, 415 * sc, 48 * sc); ctx.fill(); ctx.stroke();
// Upper Flip Screen Shell
ctx.fillStyle = "#ec4899";
ctx.beginPath(); ctx.roundRect(-84 * sc, -192 * sc, 168 * sc, 182 * sc, 32 * sc); ctx.fill(); ctx.stroke();
// Glowing Cyan Y2K Pixel LCD Screen
ctx.fillStyle = "#38bdf8";
ctx.beginPath(); ctx.roundRect(-64 * sc, -168 * sc, 128 * sc, 132 * sc, 14 * sc); ctx.fill(); ctx.stroke();
ctx.font = "900 " + Math.round(14 * sc) + 'px "JetBrains Mono", monospace'; ctx.fillStyle = "#0f172a"; ctx.textAlign = "center";
ctx.fillText("✉ 1 NEW MSG!", 0, -112 * sc);
ctx.fillText("KREATOR Y2K", 0, -86 * sc);
// Clamshell hinge cylinder
ctx.fillStyle = "#cbd5e1";
ctx.beginPath(); ctx.roundRect(-72 * sc, -16 * sc, 144 * sc, 24 * sc, 12 * sc); ctx.fill(); ctx.stroke();
// Lower Keypad Shell with 3x4 tactile buttons
ctx.fillStyle = "#f472b6";
ctx.beginPath(); ctx.roundRect(-84 * sc, 4 * sc, 168 * sc, 182 * sc, 32 * sc); ctx.fill(); ctx.stroke();
ctx.fillStyle = "#e2e8f0"; ctx.beginPath(); ctx.arc(0, 44 * sc, 22 * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
for (let r = 0; r < 3; r++) {
  for (let c = -1; c <= 1; c++) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.roundRect((c * 46 - 18) * sc, (82 + r * 28) * sc, 36 * sc, 20 * sc, 8 * sc); ctx.fill(); ctx.stroke();
  }
}
ctx.restore();

// Surrounding slapped stickers: Lightning Bolt, Flame & Y2K Star Tag
const extras = [
  [cx + 155 * sc, cy - 115 * sc, "⚡ HYPE 2000", "#fde047", "#0f172a", 0.38, 0.16],
  [cx - 165 * sc, cy + 125 * sc, "★ STREET POP", "#a3e635", "#0f172a", 0.62, -0.14],
  [cx + 145 * sc, cy + 135 * sc, "🔥 NO CAP!", "#ef4444", "#ffffff", 0.84, 0.12]
];
extras.forEach(([ex, ey, lbl, bgCol, fgCol, t0, rot]) => {
  const ke = s.spring(t0, "bouncy");
  if (ke > 0.01) {
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(rot); ctx.scale(ke, ke);
    ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 4 * sc;
    ctx.beginPath(); ctx.roundRect(-102 * sc, -34 * sc, 204 * sc, 68 * sc, 22 * sc); ctx.fill(); ctx.stroke();
    ctx.fillStyle = bgCol;
    ctx.beginPath(); ctx.roundRect(-92 * sc, -24 * sc, 184 * sc, 48 * sc, 16 * sc); ctx.fill(); ctx.stroke();
    ctx.font = "900 " + Math.round(16 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = fgCol; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(lbl, 0, 1 * sc);
    ctx.restore();
  }
});
s.sfx("stamp", 0.12, 0.72); s.sfx("pageflip", 0.4, 0.62); s.sfx("stamp", 0.64, 0.68);`,
    ],
    [
      'Papan skateboard penuh tambalan stiker grafiti meluncur cepat menembus layar!',
      'papan skateboard, stiker grafiti',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.45, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#38bdf8"; ctx.fillRect(0, 0, W, H);

// Diagonal Halftone Street Stripes
ctx.fillStyle = "#0284c7";
for (let i = -2; i < 6; i++) {
  ctx.beginPath();
  ctx.moveTo(i * 180 * sc, 0); ctx.lineTo((i * 180 + 90) * sc, 0);
  ctx.lineTo((i * 180 - 220) * sc, H); ctx.lineTo((i * 180 - 310) * sc, H);
  ctx.closePath(); ctx.fill();
}

// Handcrafted Skateboard Deck Underside with metallic trucks, urethane wheels & sticker-bombed graphics
const kSkate = s.spring(0.08, "bouncy");
ctx.save();
ctx.translate(cx, cy);
ctx.rotate(-0.22 + Math.sin(s.t * 3) * 0.03);
ctx.scale(kSkate, kSkate);

// White die-cut sticker outline around entire skateboard
ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 5 * sc;
ctx.beginPath(); ctx.roundRect(-118 * sc, -255 * sc, 236 * sc, 510 * sc, 118 * sc); ctx.fill(); ctx.stroke();

// Maple Wood Skateboard Deck
ctx.fillStyle = "#f97316";
ctx.beginPath(); ctx.roundRect(-100 * sc, -238 * sc, 200 * sc, 476 * sc, 100 * sc); ctx.fill(); ctx.stroke();

// Stickers slapped across the deck
const deckStickers = [
  [-24, -75, "SKATE OR DIE", "#fde047", "#0f172a", 0.14, 0.3],
  [18, 5, "BOOM!", "#ec4899", "#ffffff", -0.18, 0.5],
  [-12, 82, "100% ORIGINAL", "#a3e635", "#0f172a", 0.08, 0.7]
];
deckStickers.forEach(([sx, sy, txt, col, fg, rot, t0]) => {
  const ks = s.spring(t0, "bouncy");
  if (ks > 0.01) {
    ctx.save(); ctx.translate(sx * sc, sy * sc); ctx.rotate(rot); ctx.scale(ks, ks);
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.roundRect(-78 * sc, -26 * sc, 156 * sc, 52 * sc, 14 * sc); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(-70 * sc, -18 * sc, 140 * sc, 36 * sc, 10 * sc); ctx.fill(); ctx.stroke();
    ctx.font = "900 " + Math.round(14 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = fg; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(txt, 0, 1 * sc);
    ctx.restore();
  }
});

// Upper & Lower Aluminum Skateboard Trucks + Neon Green Urethane Wheels
[-145, 145].forEach((ty) => {
  ctx.fillStyle = "#cbd5e1";
  ctx.beginPath(); ctx.roundRect(-76 * sc, (ty - 12) * sc, 152 * sc, 24 * sc, 8 * sc); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#a3e635";
  ctx.beginPath(); ctx.roundRect(-106 * sc, (ty - 24) * sc, 32 * sc, 48 * sc, 10 * sc); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(74 * sc, (ty - 24) * sc, 32 * sc, 48 * sc, 10 * sc); ctx.fill(); ctx.stroke();
});
ctx.restore();
s.sfx("whoosh", 0.1, 0.65); s.sfx("stamp", 0.35, 0.7); s.sfx("stamp", 0.55, 0.7); s.sfx("stamp", 0.75, 0.7);`,
    ],
    [
      'Koleksi pak stiker holografik siap diunduh dan membuat kontenmu makin standout!',
      'stiker holografik, standout',
      'night',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.44, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#090d16"; ctx.fillRect(0, 0, W, H);

// Holographic Foil Sticker Pack Pouch with iridescent rainbow gradient & tear-notch
const kPack = s.spring(0.08, "bouncy");
ctx.save(); ctx.translate(cx, cy); ctx.scale(kPack, kPack);
ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 5 * sc;
ctx.beginPath(); ctx.roundRect(-185 * sc, -165 * sc, 370 * sc, 330 * sc, 34 * sc); ctx.fill(); ctx.stroke();

const holo = ctx.createLinearGradient(-170 * sc, -150 * sc, 170 * sc, 150 * sc);
const shift = (Math.sin(s.t * 3) + 1) * 0.25;
holo.addColorStop(0, "#ec4899");
holo.addColorStop(0.25 + shift, "#38bdf8");
holo.addColorStop(0.55 + shift * 0.5, "#fde047");
holo.addColorStop(1, "#a855f7");
ctx.fillStyle = holo;
ctx.beginPath(); ctx.roundRect(-170 * sc, -150 * sc, 340 * sc, 300 * sc, 26 * sc); ctx.fill(); ctx.stroke();

// Crimped foil top & bottom seals
ctx.fillStyle = "rgba(15,23,42,0.18)";
ctx.fillRect(-166 * sc, -146 * sc, 332 * sc, 24 * sc);
ctx.fillRect(-166 * sc, 122 * sc, 332 * sc, 24 * sc);

// Center Slapped Brand Sticker on the Holographic Pack
ctx.save(); ctx.rotate(-0.05);
ctx.fillStyle = "#0f172a"; ctx.beginPath(); ctx.roundRect(-142 * sc, -68 * sc, 284 * sc, 136 * sc, 22 * sc); ctx.fill();
ctx.font = "800 " + Math.round(13 * sc) + 'px "JetBrains Mono", monospace'; ctx.fillStyle = "#a3e635"; ctx.textAlign = "center";
ctx.fillText("★ LIMITED EDITION PACK ★", 0, -34 * sc);
ctx.font = "900 " + Math.round(30 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#ffffff";
ctx.fillText("STICKER BOMB", 0, 4 * sc);
ctx.fillStyle = "#ec4899"; ctx.beginPath(); ctx.roundRect(-105 * sc, 24 * sc, 210 * sc, 34 * sc, 17 * sc); ctx.fill();
ctx.font = "800 " + Math.round(14 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#ffffff";
ctx.fillText("UNDUH PAKET →", 0, 42 * sc);
ctx.restore();
ctx.restore();
s.sfx("pageflip", 0.12, 0.65); s.sfx("stamp", 0.45, 0.75);`,
    ],
  ],

  // ============================================================================
  // 5. BUBBLE GUM 3D (bubble_gum) — Glossy Gumball Machine, Soda & Balloon Letters
  // ============================================================================
  bubble_gum: [
    [
      'Putar tuas mesin permen karet kaca ini, bola-bola manis mengilap langsung berputar keluar!',
      'mesin permen karet, mengilap',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.46, sc = Math.min(W / 720, H / 1280);
// Pastel Candy Pink & Mint Studio Gradient
const bg = ctx.createLinearGradient(0, 0, 0, H);
bg.addColorStop(0, "#fdf2f8"); bg.addColorStop(0.55, "#fce7f3"); bg.addColorStop(1, "#fbcfe8");
ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

// Handcrafted Vintage Glossy Gumball Vending Machine (Red Cast-Iron Base, Chrome Coin Mechanism & Glass Globe full of Colorful Gumballs)
const kMachine = s.spring(0.06, "bouncy");
ctx.save(); ctx.translate(cx, cy + 15 * sc); ctx.scale(kMachine, kMachine);

// Shadow on candy table
ctx.fillStyle = "rgba(190,24,93,0.18)";
ctx.beginPath(); ctx.ellipse(0, 212 * sc, 145 * sc, 24 * sc, 0, 0, Math.PI * 2); ctx.fill();

// Glossy Red Hopper Base
const baseG = ctx.createLinearGradient(-115 * sc, 0, 115 * sc, 0);
baseG.addColorStop(0, "#be123c"); baseG.addColorStop(0.35, "#fb7185"); baseG.addColorStop(0.7, "#e11d48"); baseG.addColorStop(1, "#881337");
ctx.fillStyle = baseG; ctx.strokeStyle = "#881337"; ctx.lineWidth = 3.5 * sc;
ctx.beginPath();
ctx.moveTo(-78 * sc, 24 * sc); ctx.lineTo(78 * sc, 24 * sc);
ctx.lineTo(112 * sc, 198 * sc); ctx.lineTo(-112 * sc, 198 * sc);
ctx.closePath(); ctx.fill(); ctx.stroke();
// Base chrome trim foot
ctx.fillStyle = "#f8fafc"; ctx.strokeStyle = "#64748b";
ctx.beginPath(); ctx.roundRect(-124 * sc, 188 * sc, 248 * sc, 24 * sc, 12 * sc); ctx.fill(); ctx.stroke();

// Chrome Coin Mechanism Plate & Rotating Crank Handle
ctx.fillStyle = "#e2e8f0";
ctx.beginPath(); ctx.roundRect(-52 * sc, 54 * sc, 104 * sc, 82 * sc, 16 * sc); ctx.fill(); ctx.stroke();
ctx.save(); ctx.translate(0, 95 * sc); ctx.rotate(s.clamp((s.t - 0.25) / 0.8, 0, 1) * Math.PI);
ctx.fillStyle = "#94a3b8"; ctx.beginPath(); ctx.arc(0, 0, 22 * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.roundRect(-34 * sc, -8 * sc, 68 * sc, 16 * sc, 8 * sc); ctx.fill(); ctx.stroke();
ctx.restore();

// Dispense Chute Flap at bottom & popping gumball rolling out at t >= 0.95
ctx.fillStyle = "#334155";
ctx.beginPath(); ctx.roundRect(-32 * sc, 148 * sc, 64 * sc, 36 * sc, 8 * sc); ctx.fill();
const kOut = s.spring(0.95, "bouncy");
if (kOut > 0.01) {
  const gx = s.lerp(0, 145 * sc, Math.min(1, kOut));
  const gy = 175 * sc - Math.abs(Math.sin(kOut * Math.PI * 2)) * 38 * sc;
  ctx.fillStyle = "#38bdf8";
  ctx.beginPath(); ctx.arc(gx, gy, 24 * sc, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(gx - 8 * sc, gy - 8 * sc, 7 * sc, 0, Math.PI * 2); ctx.fill();
}

// Clear Glass Globe Dome & 18 Glossy 3D Gumballs inside
ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 4 * sc;
ctx.beginPath(); ctx.arc(0, -82 * sc, 128 * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

const gumBalls = [
  [-65, -25, "#ec4899"], [-18, -18, "#38bdf8"], [32, -22, "#facc15"], [76, -30, "#a855f7"],
  [-85, -68, "#4ade80"], [-38, -64, "#fb7185"], [12, -62, "#c084fc"], [62, -66, "#38bdf8"],
  [-62, -112, "#facc15"], [-12, -108, "#ec4899"], [42, -110, "#4ade80"], [0, -148, "#fb7185"]
];
gumBalls.forEach(([bx, by, col], idx) => {
  const jiggle = Math.sin(s.t * 6 + idx) * 3.5 * sc;
  const x = bx * sc, y = by * sc + jiggle;
  const gg = ctx.createRadialGradient(x - 8 * sc, y - 8 * sc, 2 * sc, x, y, 26 * sc);
  gg.addColorStop(0, "#ffffff"); gg.addColorStop(0.28, col); gg.addColorStop(1, "#1e1b4b");
  ctx.fillStyle = gg;
  ctx.beginPath(); ctx.arc(x, y, 25 * sc, 0, Math.PI * 2); ctx.fill();
});

// Glass Globe Specular Reflection Arc & Red Top Lid Cap
ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = 7 * sc; ctx.lineCap = "round";
ctx.beginPath(); ctx.arc(0, -82 * sc, 110 * sc, Math.PI * 1.1, Math.PI * 1.42); ctx.stroke();
ctx.fillStyle = "#e11d48"; ctx.strokeStyle = "#881337"; ctx.lineWidth = 3.5 * sc;
ctx.beginPath(); ctx.roundRect(-48 * sc, -222 * sc, 96 * sc, 24 * sc, 12 * sc); ctx.fill(); ctx.stroke();
ctx.beginPath(); ctx.arc(0, -230 * sc, 12 * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
ctx.restore();

s.sfx("boing", 0.12, 0.65); s.sfx("bubble", 0.52, 0.62); s.sfx("pop", 0.96, 0.72);`,
    ],
    [
      'Huruf balon 3D mengilap memantul kenyal dengan pantulan cahaya studio yang lembut!',
      'Huruf balon 3D, memantul kenyal',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.45, sc = Math.min(W / 720, H / 1280);
const bg = ctx.createLinearGradient(0, 0, W, H);
bg.addColorStop(0, "#e0f2fe"); bg.addColorStop(0.5, "#fae8ff"); bg.addColorStop(1, "#fce7f3");
ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

// Custom 3D Inflatable Glossy Balloon Pill Letters spelling "POP!" + glossy Candy Ring
const drawBalloonCapsule = (x1, y1, x2, y2, thick, baseCol, darkCol) => {
  ctx.save();
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  // Outer dark rim shadow
  ctx.strokeStyle = darkCol; ctx.lineWidth = (thick + 6) * sc;
  ctx.beginPath(); ctx.moveTo(x1 * sc, (y1 + 5) * sc); ctx.lineTo(x2 * sc, (y2 + 5) * sc); ctx.stroke();
  // Main glossy candy body
  ctx.strokeStyle = baseCol; ctx.lineWidth = thick * sc;
  ctx.beginPath(); ctx.moveTo(x1 * sc, y1 * sc); ctx.lineTo(x2 * sc, y2 * sc); ctx.stroke();
  // Specular white highlight stripe offset toward top-left
  ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.lineWidth = (thick * 0.26) * sc;
  ctx.beginPath(); ctx.moveTo((x1 - 4) * sc, (y1 - 5) * sc); ctx.lineTo((x2 - 4) * sc, (y2 - 5) * sc); ctx.stroke();
  ctx.restore();
};

// Letter 1: Inflatable "P" (Left)
const kP1 = s.spring(0.08, "bouncy");
if (kP1 > 0.01) {
  const sq = 1 + Math.sin(s.t * 5) * 0.04;
  ctx.save(); ctx.translate(cx - 165 * sc, cy - 25 * sc); ctx.scale(kP1 * sq, kP1 / sq);
  drawBalloonCapsule(-35, -75, -35, 75, 38, "#ec4899", "#9d174d");
  ctx.strokeStyle = "#9d174d"; ctx.lineWidth = 42 * sc;
  ctx.beginPath(); ctx.arc(-10 * sc, -25 * sc, 46 * sc, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
  ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 36 * sc;
  ctx.beginPath(); ctx.arc(-10 * sc, -28 * sc, 46 * sc, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.78)"; ctx.lineWidth = 9 * sc; ctx.lineCap = "round";
  ctx.beginPath(); ctx.arc(-10 * sc, -32 * sc, 46 * sc, -Math.PI * 0.35, Math.PI * 0.2); ctx.stroke();
  ctx.restore();
}

// Letter 2: Inflatable Glossy Donut "O" (Center)
const kO = s.spring(0.24, "bouncy");
if (kO > 0.01) {
  const sq = 1 + Math.sin(s.t * 5 + 1.5) * 0.05;
  ctx.save(); ctx.translate(cx, cy - 25 * sc); ctx.scale(kO / sq, kO * sq);
  ctx.strokeStyle = "#0369a1"; ctx.lineWidth = 46 * sc;
  ctx.beginPath(); ctx.arc(0, 5 * sc, 54 * sc, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 40 * sc;
  ctx.beginPath(); ctx.arc(0, 0, 54 * sc, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.82)"; ctx.lineWidth = 10 * sc; ctx.lineCap = "round";
  ctx.beginPath(); ctx.arc(0, 0, 56 * sc, Math.PI * 1.1, Math.PI * 1.48); ctx.stroke();
  ctx.restore();
}

// Letter 3: Inflatable "P!" (Right)
const kP2 = s.spring(0.4, "bouncy");
if (kP2 > 0.01) {
  const sq = 1 + Math.sin(s.t * 5 + 3) * 0.04;
  ctx.save(); ctx.translate(cx + 165 * sc, cy - 25 * sc); ctx.scale(kP2 * sq, kP2 / sq);
  drawBalloonCapsule(-35, -75, -35, 75, 38, "#a855f7", "#581c87");
  ctx.strokeStyle = "#581c87"; ctx.lineWidth = 42 * sc;
  ctx.beginPath(); ctx.arc(-10 * sc, -25 * sc, 46 * sc, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
  ctx.strokeStyle = "#c084fc"; ctx.lineWidth = 36 * sc;
  ctx.beginPath(); ctx.arc(-10 * sc, -28 * sc, 46 * sc, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.78)"; ctx.lineWidth = 9 * sc; ctx.lineCap = "round";
  ctx.beginPath(); ctx.arc(-10 * sc, -32 * sc, 46 * sc, -Math.PI * 0.35, Math.PI * 0.2); ctx.stroke();
  ctx.restore();
}

// Wrapped Fruit Candy Twist at bottom-center
const kCandy = s.spring(0.62, "bouncy");
if (kCandy > 0.01) {
  ctx.save(); ctx.translate(cx, cy + 155 * sc); ctx.scale(kCandy, kCandy);
  ctx.fillStyle = "#facc15"; ctx.strokeStyle = "#b45309"; ctx.lineWidth = 3 * sc;
  // Left & right wrapper tails
  ctx.beginPath(); ctx.moveTo(-65 * sc, 0); ctx.lineTo(-118 * sc, -34 * sc); ctx.lineTo(-108 * sc, 0); ctx.lineTo(-118 * sc, 34 * sc); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(65 * sc, 0); ctx.lineTo(118 * sc, -34 * sc); ctx.lineTo(108 * sc, 0); ctx.lineTo(118 * sc, 34 * sc); ctx.closePath(); ctx.fill(); ctx.stroke();
  // Glossy candy body
  const cg = ctx.createRadialGradient(-18 * sc, -14 * sc, 4 * sc, 0, 0, 72 * sc);
  cg.addColorStop(0, "#ffffff"); cg.addColorStop(0.3, "#fb7185"); cg.addColorStop(1, "#be123c");
  ctx.fillStyle = cg;
  ctx.beginPath(); ctx.ellipse(0, 0, 68 * sc, 44 * sc, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
s.sfx("boing", 0.1, 0.65); s.sfx("bubble", 0.28, 0.65); s.sfx("pop", 0.45, 0.7);`,
    ],
    [
      'Botol soda pastel terbuka segar dengan sedotan ulir dan gelembung karbonasi berkilau!',
      'Botol soda, gelembung karbonasi',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.48, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#ecfeff"; ctx.fillRect(0, 0, W, H);

// Handcrafted Glass Cream-Soda Bottle with bendy striped straw & fizzing pink soda bubbles
const kBottle = s.spring(0.08, "bouncy");
ctx.save(); ctx.translate(cx, cy + 35 * sc); ctx.scale(kBottle, kBottle);

// Bendy Striped Straw emerging from bottle neck
const kStraw = s.spring(0.32, "bouncy");
if (kStraw > 0.01) {
  ctx.save(); ctx.scale(1, kStraw);
  ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 18 * sc; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(0, -135 * sc); ctx.lineTo(18 * sc, -235 * sc); ctx.lineTo(95 * sc, -255 * sc); ctx.stroke();
  ctx.strokeStyle = "#ec4899"; ctx.lineWidth = 18 * sc; ctx.setLineDash([14 * sc, 14 * sc]);
  ctx.beginPath(); ctx.moveTo(0, -135 * sc); ctx.lineTo(18 * sc, -235 * sc); ctx.lineTo(95 * sc, -255 * sc); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// Glass Soda Bottle Contour
ctx.fillStyle = "rgba(186,230,253,0.45)"; ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 4 * sc;
ctx.beginPath();
ctx.moveTo(-26 * sc, -165 * sc); ctx.lineTo(26 * sc, -165 * sc);
ctx.lineTo(32 * sc, -95 * sc);
ctx.bezierCurveTo(78 * sc, -55 * sc, 82 * sc, -15 * sc, 78 * sc, 155 * sc);
ctx.quadraticCurveTo(78 * sc, 180 * sc, 52 * sc, 180 * sc);
ctx.lineTo(-52 * sc, 180 * sc);
ctx.quadraticCurveTo(-78 * sc, 180 * sc, -78 * sc, 155 * sc);
ctx.bezierCurveTo(-82 * sc, -15 * sc, -78 * sc, -55 * sc, -32 * sc, -95 * sc);
ctx.closePath(); ctx.fill(); ctx.stroke();

// Strawberry Bubblegum Soda Liquid inside bottle with wave surface
const sg = ctx.createLinearGradient(-70 * sc, -40 * sc, 70 * sc, 175 * sc);
sg.addColorStop(0, "#f472b6"); sg.addColorStop(0.5, "#ec4899"); sg.addColorStop(1, "#be185d");
ctx.fillStyle = sg;
ctx.beginPath();
ctx.moveTo(-68 * sc, -32 * sc);
ctx.quadraticCurveTo(0, (-32 + Math.sin(s.t * 5) * 10) * sc, 68 * sc, -32 * sc);
ctx.lineTo(68 * sc, 165 * sc); ctx.lineTo(-68 * sc, 165 * sc); ctx.closePath(); ctx.fill();

// Bottle Label Badge
ctx.fillStyle = "#fef08a"; ctx.strokeStyle = "#be185d"; ctx.lineWidth = 3 * sc;
ctx.beginPath(); ctx.roundRect(-64 * sc, 22 * sc, 128 * sc, 76 * sc, 16 * sc); ctx.fill(); ctx.stroke();
ctx.font = "900 " + Math.round(20 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#be185d"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
ctx.fillText("FIZZ POP!", 0, 52 * sc);
ctx.font = "700 " + Math.round(11 * sc) + 'px "JetBrains Mono", monospace';
ctx.fillText("100% SWEET", 0, 76 * sc);

// Glossy glass vertical reflection highlight
ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 8 * sc; ctx.lineCap = "round";
ctx.beginPath(); ctx.moveTo(-54 * sc, -25 * sc); ctx.lineTo(-54 * sc, 145 * sc); ctx.stroke();
ctx.restore();

// Effervescent glossy soda bubbles rising above the bottle neck
for (let b = 0; b < 11; b++) {
  const prog = ((s.t * 0.55 + b * 0.14) % 1);
  const bx = cx + Math.sin(prog * 6 + b) * (35 + prog * 95) * sc;
  const by = (cy - 115 * sc) - prog * 235 * sc;
  const br = (10 + (b % 3) * 8) * (1 - prog * 0.35) * sc;
  ctx.save();
  ctx.globalAlpha = 1 - prog * 0.85;
  const bg = ctx.createRadialGradient(bx - br * 0.3, by - br * 0.3, 1 * sc, bx, by, br);
  bg.addColorStop(0, "#ffffff"); bg.addColorStop(0.4, "#f472b6"); bg.addColorStop(1, "#38bdf8");
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
s.sfx("bubble", 0.15, 0.68); s.sfx("pop", 0.55, 0.65); s.sfx("sparkle", 0.95, 0.6);`,
    ],
    [
      'Stoples kaca permen penuh warna siap menutup videomu dengan kesan manis dan ceria!',
      'Stoples kaca permen, manis dan ceria',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.45, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#fdf4ff"; ctx.fillRect(0, 0, W, H);

// Handcrafted Glass Candy Apothecary Jar with swirled lollipop, gumdrops & pastel ribbon tag
const kJar = s.spring(0.08, "bouncy");
ctx.save(); ctx.translate(cx, cy + 15 * sc); ctx.scale(kJar, kJar);

// Glass Jar Body
ctx.fillStyle = "rgba(255,255,255,0.68)"; ctx.strokeStyle = "#d946ef"; ctx.lineWidth = 4 * sc;
ctx.beginPath(); ctx.roundRect(-135 * sc, -115 * sc, 270 * sc, 265 * sc, 48 * sc); ctx.fill(); ctx.stroke();
// Glass Jar Neck & Ribbed Pink Lid
ctx.fillStyle = "#f0abfc";
ctx.beginPath(); ctx.roundRect(-92 * sc, -142 * sc, 184 * sc, 28 * sc, 10 * sc); ctx.fill(); ctx.stroke();
ctx.fillStyle = "#ec4899";
ctx.beginPath(); ctx.roundRect(-104 * sc, -172 * sc, 208 * sc, 34 * sc, 16 * sc); ctx.fill(); ctx.stroke();
ctx.beginPath(); ctx.arc(0, -184 * sc, 18 * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

// Swirled Rainbow Lollipop & Pastel Candies inside Jar
const candies = [
  [-65, 95, 32, "#38bdf8"], [0, 102, 34, "#facc15"], [68, 92, 32, "#4ade80"],
  [-72, 34, 30, "#a855f7"], [65, 32, 30, "#fb7185"]
];
candies.forEach(([x, y, r, col]) => {
  const cg = ctx.createRadialGradient((x - 10) * sc, (y - 10) * sc, 2 * sc, x * sc, y * sc, r * sc);
  cg.addColorStop(0, "#ffffff"); cg.addColorStop(0.35, col); cg.addColorStop(1, "#701a75");
  ctx.fillStyle = cg;
  ctx.beginPath(); ctx.arc(x * sc, y * sc, r * sc, 0, Math.PI * 2); ctx.fill();
});

// Giant Swirl Lollipop in center of jar
ctx.save(); ctx.translate(0, -15 * sc); ctx.rotate(s.t * 1.2);
ctx.fillStyle = "#f472b6"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 7 * sc;
ctx.beginPath(); ctx.arc(0, 0, 58 * sc, 0, Math.PI * 2); ctx.fill();
ctx.beginPath();
for (let a = 0; a < Math.PI * 4; a += 0.2) {
  const r = (a / (Math.PI * 4)) * 52 * sc;
  const lx = Math.cos(a) * r, ly = Math.sin(a) * r;
  if (a === 0) ctx.moveTo(lx, ly); else ctx.lineTo(lx, ly);
}
ctx.stroke();
ctx.restore();

// Hanging Gift Tag Ribbon on Jar Front
ctx.fillStyle = "#1e1b4b"; ctx.strokeStyle = "#fde047"; ctx.lineWidth = 3 * sc;
ctx.beginPath(); ctx.roundRect(-145 * sc, 12 * sc, 290 * sc, 74 * sc, 22 * sc); ctx.fill(); ctx.stroke();
ctx.font = "900 " + Math.round(22 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
ctx.fillText("SWEET CONTENT ★", 0, 49 * sc);
ctx.restore();
s.sfx("boing", 0.12, 0.65); s.sfx("pop", 0.45, 0.7); s.sfx("ding", 0.85, 0.65);`,
    ],
  ],

  // ============================================================================
  // 6. CLAYMATION STOPMOTION (stopmotion_clay) — 12fps Hand-Sculpted Plasticine
  // ============================================================================
  stopmotion_clay: [
    [
      'Setiap objek dibentuk tangan dari tanah liat plastisin dengan gerakan stop-motion dua belas frame per detik!',
      'tanah liat plastisin, stop-motion',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.46, sc = Math.min(W / 720, H / 1280);
// Authentic 12fps Stop-Motion Quantized Clock!
const ct = Math.floor(s.t * 12) / 12;
const wig = (seed) => Math.sin(ct * 19 + seed * 7) * 2.4 * sc;

// Warm Cardboard & Felt Stop-Motion Miniature Studio Set
ctx.fillStyle = "#f3e5d0"; ctx.fillRect(0, 0, W, H);
// Wooden miniature table surface with stitched felt edge
ctx.fillStyle = "#c89d7c"; ctx.fillRect(0, cy + 115 * sc, W, H - (cy + 115 * sc));
ctx.strokeStyle = "#8c5a3c"; ctx.lineWidth = 5 * sc; ctx.setLineDash([14 * sc, 10 * sc]);
ctx.beginPath(); ctx.moveTo(0, cy + 128 * sc); ctx.lineTo(W, cy + 128 * sc); ctx.stroke(); ctx.setLineDash([]);

// Helper to draw a chunky hand-sculpted plasticine clay shape with organic wobble & fingerprint ridges
const clayBlob = (x, y, rx, ry, col, darkCol, seed = 1) => {
  ctx.save(); ctx.translate(x + wig(seed) * 0.4, y + wig(seed + 2) * 0.4);
  // Bottom clay rim thickness
  ctx.fillStyle = darkCol;
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const wob = 1 + Math.sin(a * 3 + seed + ct * 8) * 0.045;
    const px = Math.cos(a) * rx * wob, py = 7 * sc + Math.sin(a) * ry * wob;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill();
  // Main plasticine body
  const g = ctx.createRadialGradient(-rx * 0.3, -ry * 0.35, 4 * sc, 0, 0, Math.max(rx, ry) * 1.1);
  g.addColorStop(0, "#ffffff"); g.addColorStop(0.22, col); g.addColorStop(1, darkCol);
  ctx.fillStyle = g;
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const wob = 1 + Math.sin(a * 3 + seed + ct * 8) * 0.045;
    const px = Math.cos(a) * rx * wob, py = Math.sin(a) * ry * wob;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill();
  // Subtle thumbprint ridges
  ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.lineWidth = 2 * sc;
  ctx.beginPath(); ctx.arc(-rx * 0.15, -ry * 0.15, Math.min(rx, ry) * 0.55, 0.4, 1.9); ctx.stroke();
  ctx.restore();
};

// Hand-sculpted Terracotta Clay Coffee Mug with Saucer & Rolled Clay Steam Puffs!
const kMug = Math.min(1, ct / 0.35);
ctx.save(); ctx.translate(cx - 20 * sc, cy + 45 * sc); ctx.scale(kMug, kMug);
// Clay saucer
clayBlob(0, 68 * sc, 138 * sc, 28 * sc, "#e07a5f", "#9e4731", 1);
// Clay handle loop on right
ctx.strokeStyle = "#d96b4e"; ctx.lineWidth = 22 * sc; ctx.lineCap = "round";
ctx.beginPath(); ctx.arc(82 * sc, 0, 38 * sc, -Math.PI * 0.45, Math.PI * 0.45); ctx.stroke();
// Clay mug cylinder body
clayBlob(0, 8 * sc, 88 * sc, 64 * sc, "#f28482", "#b54846", 2);
// Dark espresso clay surface inside rim
clayBlob(0, -44 * sc, 72 * sc, 20 * sc, "#4a2c2a", "#2b1817", 3);
// Cute sculpted clay eyes & smile on front of mug!
ctx.fillStyle = "#1d1e2c";
ctx.beginPath(); ctx.arc(-28 * sc + wig(4) * 0.2, 6 * sc, 9 * sc, 0, Math.PI * 2); ctx.arc(28 * sc + wig(5) * 0.2, 6 * sc, 9 * sc, 0, Math.PI * 2); ctx.fill();
ctx.fillStyle = "#ffffff";
ctx.beginPath(); ctx.arc(-31 * sc, 3 * sc, 3 * sc, 0, Math.PI * 2); ctx.arc(25 * sc, 3 * sc, 3 * sc, 0, Math.PI * 2); ctx.fill();
ctx.strokeStyle = "#1d1e2c"; ctx.lineWidth = 4.5 * sc; ctx.lineCap = "round";
ctx.beginPath(); ctx.arc(0, 14 * sc, 16 * sc, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
ctx.restore();

// 3 Stop-Motion Rolled White Clay Steam Balls popping upward at 12fps steps
for (let st = 0; st < 3; st++) {
  const prog = ((ct * 0.65 + st * 0.33) % 1);
  const sx = cx - 20 * sc + Math.sin(prog * 5 + st) * 28 * sc;
  const sy = (cy - 32 * sc) - prog * 135 * sc;
  const sr = (14 + st * 6) * (1 - prog * 0.3) * sc;
  clayBlob(sx, sy, sr, sr * 0.85, "#fffdf9", "#d4c5b9", 10 + st);
}

// Sculpted Clay Plaque Label at top
if (ct >= 0.25) {
  clayBlob(cx, cy - 195 * sc, 185 * sc, 38 * sc, "#81b29a", "#4d7c65", 9);
  ctx.font = "900 " + Math.round(18 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("12 FPS · HANDMADE CLAY", cx + wig(7) * 0.3, cy - 194 * sc);
}
s.sfx("boing", 0.1, 0.68); s.sfx("pop", 0.45, 0.62); s.sfx("step", 0.85, 0.58);`,
    ],
    [
      'Jam weker plastisin bergetar lucu membangunkan ide-ide kreatif dari buku catatan tanah liat!',
      'Jam weker plastisin, buku catatan',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.46, sc = Math.min(W / 720, H / 1280);
const ct = Math.floor(s.t * 12) / 12;
const wig = (seed) => Math.sin(ct * 22 + seed * 5) * 2.5 * sc;

ctx.fillStyle = "#ede0d4"; ctx.fillRect(0, 0, W, H);
ctx.fillStyle = "#b08968"; ctx.fillRect(0, cy + 125 * sc, W, H - (cy + 125 * sc));

// Hand-Sculpted Twin-Bell Plasticine Alarm Clock jiggling at 12fps!
const ringJiggle = Math.sin(ct * 28) * 0.08;
ctx.save();
ctx.translate(cx - 85 * sc + wig(1), cy + 15 * sc + wig(2));
ctx.rotate(ringJiggle);

// Two chunky yellow clay feet
ctx.fillStyle = "#d97706";
ctx.beginPath(); ctx.ellipse(-52 * sc, 92 * sc, 24 * sc, 16 * sc, -0.3, 0, Math.PI * 2); ctx.fill();
ctx.beginPath(); ctx.ellipse(52 * sc, 92 * sc, 24 * sc, 16 * sc, 0.3, 0, Math.PI * 2); ctx.fill();

// Twin golden clay bells on top
ctx.fillStyle = "#f59e0b";
ctx.beginPath(); ctx.arc(-68 * sc, -78 * sc, 34 * sc, Math.PI * 0.8, Math.PI * 1.95); ctx.fill();
ctx.beginPath(); ctx.arc(68 * sc, -78 * sc, 34 * sc, Math.PI * 1.05, Math.PI * 2.2); ctx.fill();
// Little clay hammer oscillating between bells
ctx.strokeStyle = "#78350f"; ctx.lineWidth = 7 * sc;
ctx.beginPath(); ctx.moveTo(0, -88 * sc); ctx.lineTo(Math.sin(ct * 35) * 24 * sc, -122 * sc); ctx.stroke();

// Teal Plasticine Clock Body & Cream Clock Face
const cg = ctx.createRadialGradient(-28 * sc, -28 * sc, 8 * sc, 0, 0, 108 * sc);
cg.addColorStop(0, "#5eead4"); cg.addColorStop(0.5, "#0d9488"); cg.addColorStop(1, "#115e59");
ctx.fillStyle = cg;
ctx.beginPath(); ctx.arc(0, 0, 98 * sc, 0, Math.PI * 2); ctx.fill();
ctx.fillStyle = "#fffbeb";
ctx.beginPath(); ctx.arc(0, 0, 74 * sc, 0, Math.PI * 2); ctx.fill();

// Clay clock hands ticking in discrete 12fps steps
ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 8 * sc; ctx.lineCap = "round";
ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -44 * sc); ctx.stroke();
const minAng = ct * 2.4;
ctx.strokeStyle = "#e11d48"; ctx.lineWidth = 7 * sc;
ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(minAng) * 52 * sc, Math.sin(minAng) * 52 * sc); ctx.stroke();
ctx.fillStyle = "#f59e0b"; ctx.beginPath(); ctx.arc(0, 0, 11 * sc, 0, Math.PI * 2); ctx.fill();
ctx.restore();

// Hand-Sculpted Clay Spiral Notebook & Chunky Clay Pencil on Right
if (ct >= 0.25) {
  ctx.save(); ctx.translate(cx + 125 * sc + wig(3), cy + 35 * sc + wig(4)); ctx.rotate(0.08);
  ctx.fillStyle = "#e76f51";
  ctx.beginPath(); ctx.roundRect(-78 * sc, -95 * sc, 156 * sc, 190 * sc, 22 * sc); ctx.fill();
  ctx.fillStyle = "#fffbeb";
  ctx.beginPath(); ctx.roundRect(-64 * sc, -80 * sc, 128 * sc, 160 * sc, 14 * sc); ctx.fill();
  // Rolled clay lines on page
  ctx.fillStyle = "#2a9d8f";
  ctx.beginPath(); ctx.roundRect(-46 * sc, -52 * sc, 92 * sc, 14 * sc, 7 * sc); ctx.fill();
  ctx.fillStyle = "#e9c46a";
  ctx.beginPath(); ctx.roundRect(-46 * sc, -22 * sc, 74 * sc, 14 * sc, 7 * sc); ctx.fill();
  ctx.fillStyle = "#f4a261";
  ctx.beginPath(); ctx.roundRect(-46 * sc, 8 * sc, 84 * sc, 14 * sc, 7 * sc); ctx.fill();
  ctx.restore();
}
s.sfx("boing", 0.12, 0.65); s.sfx("step", 0.42, 0.6); s.sfx("pop", 0.78, 0.68);`,
    ],
    [
      'Karakter plastisin melompat gembira di panggung miniatur lengkap dengan lampu sorot!',
      'Karakter plastisin, panggung miniatur',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.46, sc = Math.min(W / 720, H / 1280);
const ct = Math.floor(s.t * 12) / 12;
const wig = (seed) => Math.sin(ct * 18 + seed * 9) * 2.2 * sc;

// Miniature Stop-Motion Theater Backdrop with Felt Curtains
ctx.fillStyle = "#264653"; ctx.fillRect(0, 0, W, H);
ctx.fillStyle = "#e76f51";
ctx.beginPath(); ctx.arc(0, 120 * sc, 135 * sc, 0, Math.PI); ctx.fill();
ctx.beginPath(); ctx.arc(W, 120 * sc, 135 * sc, 0, Math.PI); ctx.fill();
ctx.fillStyle = "#d4a373"; ctx.fillRect(0, cy + 135 * sc, W, H - (cy + 135 * sc));

// Cute Chibi Plasticine Clay Character (Coral Sweater, Yellow Beanie, Round Clay Hands & Feet) jumping at 12fps!
const jumpPhase = (ct * 1.8) % 1;
const jumpY = -Math.abs(Math.sin(jumpPhase * Math.PI)) * 55 * sc;
const squashX = jumpY > -8 * sc ? 1.12 : 0.94;
const squashY = jumpY > -8 * sc ? 0.88 : 1.06;

ctx.save();
ctx.translate(cx + wig(1), cy + 125 * sc);
// Shadow on wood stage shrinks when jumping
ctx.fillStyle = "rgba(0,0,0,0.28)";
ctx.beginPath(); ctx.ellipse(0, 10 * sc, (82 + jumpY * 0.35) * sc, 18 * sc, 0, 0, Math.PI * 2); ctx.fill();

ctx.translate(0, jumpY);
ctx.scale(squashX, squashY);

// Clay Shoes & Blue Clay Pants
ctx.fillStyle = "#78350f";
ctx.beginPath(); ctx.ellipse(-36 * sc, -12 * sc, 26 * sc, 15 * sc, 0, 0, Math.PI * 2); ctx.fill();
ctx.beginPath(); ctx.ellipse(36 * sc, -12 * sc, 26 * sc, 15 * sc, 0, 0, Math.PI * 2); ctx.fill();
ctx.fillStyle = "#1d4ed8";
ctx.beginPath(); ctx.roundRect(-48 * sc, -68 * sc, 36 * sc, 54 * sc, 14 * sc); ctx.fill();
ctx.beginPath(); ctx.roundRect(12 * sc, -68 * sc, 36 * sc, 54 * sc, 14 * sc); ctx.fill();

// Chunky Coral Clay Sweater Torso
const tg = ctx.createRadialGradient(-20 * sc, -135 * sc, 10 * sc, 0, -115 * sc, 95 * sc);
tg.addColorStop(0, "#fca5a5"); tg.addColorStop(0.45, "#ef4444"); tg.addColorStop(1, "#991b1b");
ctx.fillStyle = tg;
ctx.beginPath(); ctx.roundRect(-72 * sc, -172 * sc, 144 * sc, 114 * sc, 46 * sc); ctx.fill();

// Waving Clay Arms & Round Mitt Hands
const waveAng = Math.sin(ct * 14) * 0.35;
[-1, 1].forEach((dir) => {
  ctx.save(); ctx.translate(dir * 68 * sc, -148 * sc); ctx.rotate(dir * (-0.65 + waveAng));
  ctx.fillStyle = "#ef4444";
  ctx.beginPath(); ctx.roundRect(-16 * sc, -58 * sc, 32 * sc, 64 * sc, 16 * sc); ctx.fill();
  ctx.fillStyle = "#fcd34d";
  ctx.beginPath(); ctx.arc(0, -64 * sc, 20 * sc, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
});

// Round Sculpted Clay Head, Rosy Cheeks, Bead Eyes & Yellow Clay Beanie Hat
const hg = ctx.createRadialGradient(-18 * sc, -245 * sc, 8 * sc, 0, -230 * sc, 78 * sc);
hg.addColorStop(0, "#fef3c7"); hg.addColorStop(0.5, "#fde68a"); hg.addColorStop(1, "#d97706");
ctx.fillStyle = hg;
ctx.beginPath(); ctx.arc(0, -232 * sc, 68 * sc, 0, Math.PI * 2); ctx.fill();
// Glossy black glass bead eyes
ctx.fillStyle = "#0f172a";
ctx.beginPath(); ctx.arc(-24 * sc, -234 * sc, 8.5 * sc, 0, Math.PI * 2); ctx.arc(24 * sc, -234 * sc, 8.5 * sc, 0, Math.PI * 2); ctx.fill();
ctx.fillStyle = "#ffffff";
ctx.beginPath(); ctx.arc(-27 * sc, -237 * sc, 3 * sc, 0, Math.PI * 2); ctx.arc(21 * sc, -237 * sc, 3 * sc, 0, Math.PI * 2); ctx.fill();
// Pink clay cheeks & happy open mouth
ctx.fillStyle = "#fb7185";
ctx.beginPath(); ctx.ellipse(-42 * sc, -220 * sc, 12 * sc, 7 * sc, 0, 0, Math.PI * 2); ctx.fill();
ctx.beginPath(); ctx.ellipse(42 * sc, -220 * sc, 12 * sc, 7 * sc, 0, 0, Math.PI * 2); ctx.fill();
ctx.fillStyle = "#7f1d1d";
ctx.beginPath(); ctx.arc(0, -218 * sc, 14 * sc, 0, Math.PI); ctx.fill();
// Yellow Ribbed Clay Beanie & Pom-pom
ctx.fillStyle = "#f59e0b";
ctx.beginPath(); ctx.arc(0, -252 * sc, 66 * sc, Math.PI, 0); ctx.fill();
ctx.fillStyle = "#d97706";
ctx.beginPath(); ctx.roundRect(-72 * sc, -264 * sc, 144 * sc, 24 * sc, 12 * sc); ctx.fill();
ctx.fillStyle = "#fef08a";
ctx.beginPath(); ctx.arc(0, -322 * sc, 18 * sc, 0, Math.PI * 2); ctx.fill();
ctx.restore();

s.sfx("boing", 0.12, 0.7); s.sfx("step", 0.55, 0.62); s.sfx("pop", 0.95, 0.68);`,
    ],
    [
      'Papan klaper film plastisin menutup adegan dengan tekstur handmade yang hangat dan autentik!',
      'Papan klaper film, handmade',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.45, sc = Math.min(W / 720, H / 1280);
const ct = Math.floor(s.t * 12) / 12;
const wig = (seed) => Math.sin(ct * 20 + seed * 6) * 2.2 * sc;

ctx.fillStyle = "#f4ebd9"; ctx.fillRect(0, 0, W, H);

// Hand-Sculpted Clay Director's Clapboard snapping shut at t = 0.55!
const kClap = Math.min(1, ct / 0.3);
const clapperAngle = ct < 0.55 ? -0.42 : 0;
ctx.save();
ctx.translate(cx + wig(1), cy + 20 * sc + wig(2));
ctx.scale(kClap, kClap);

// Dark Slate Clay Board Body
ctx.fillStyle = "#1e293b"; ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 4 * sc;
ctx.beginPath(); ctx.roundRect(-195 * sc, -95 * sc, 390 * sc, 235 * sc, 26 * sc); ctx.fill(); ctx.stroke();

// Lower Striped Bar
ctx.fillStyle = "#f8fafc";
ctx.beginPath(); ctx.roundRect(-195 * sc, -95 * sc, 390 * sc, 36 * sc, 12 * sc); ctx.fill(); ctx.stroke();
ctx.fillStyle = "#e11d48";
for (let i = -3; i <= 3; i++) {
  ctx.beginPath();
  ctx.moveTo((i * 52 - 18) * sc, -95 * sc); ctx.lineTo((i * 52 + 12) * sc, -95 * sc);
  ctx.lineTo((i * 52 - 6) * sc, -59 * sc); ctx.lineTo((i * 52 - 36) * sc, -59 * sc);
  ctx.closePath(); ctx.fill();
}

// Hinged Top Clapper Stick snapping down at t = 0.55
ctx.save();
ctx.translate(-185 * sc, -95 * sc);
ctx.rotate(clapperAngle);
ctx.fillStyle = "#f8fafc";
ctx.beginPath(); ctx.roundRect(-10 * sc, -36 * sc, 390 * sc, 36 * sc, 12 * sc); ctx.fill(); ctx.stroke();
ctx.fillStyle = "#f59e0b";
for (let i = 0; i < 7; i++) {
  ctx.beginPath();
  ctx.moveTo((25 + i * 52) * sc, -36 * sc); ctx.lineTo((55 + i * 52) * sc, -36 * sc);
  ctx.lineTo((37 + i * 52) * sc, 0); ctx.lineTo((7 + i * 52) * sc, 0);
  ctx.closePath(); ctx.fill();
}
ctx.restore();

// Rolled White Clay Lettering on Slate
ctx.font = "800 " + Math.round(14 * sc) + 'px "JetBrains Mono", monospace'; ctx.fillStyle = "#94a3b8"; ctx.textAlign = "left";
ctx.fillText("SCENE 04  ·  TAKE 01  ·  12 FPS", -155 * sc, -22 * sc);
ctx.font = "900 " + Math.round(32 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#fde047"; ctx.textAlign = "center";
ctx.fillText("CLAYMATION STUDIO", 0, 32 * sc);
ctx.fillStyle = "#10b981";
ctx.beginPath(); ctx.roundRect(-125 * sc, 68 * sc, 250 * sc, 44 * sc, 22 * sc); ctx.fill();
ctx.font = "800 " + Math.round(16 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#ffffff";
ctx.fillText("✓ SIAP RENDER VIDEO", 0, 91 * sc);
ctx.restore();

s.sfx("boing", 0.1, 0.65); s.sfx("stamp", 0.55, 0.78); s.sfx("ding", 0.95, 0.65);`,
    ],
  ],

  // ============================================================================
  // 7. TENANG MINIMALIS (tenang_minimalis) — Kinfolk / Muji Ceramic & Sunlight
  // ============================================================================
  tenang_minimalis: [
    [
      'Dalam ruang yang bersih tanpa kebisingan visual, satu cangkir kopi hangat menemani fokus pagimu.',
      'ruang yang bersih, fokus pagimu',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.45, sc = Math.min(W / 720, H / 1280);
// Warm Kinfolk / Muji Linen & Oatmeal Palette
ctx.fillStyle = "#f6f3ec"; ctx.fillRect(0, 0, W, H);

// Diagonal Morning Window Sunlight Cast across the wall
ctx.fillStyle = "rgba(255,252,245,0.75)";
ctx.beginPath();
ctx.moveTo(85 * sc, 0); ctx.lineTo(395 * sc, 0);
ctx.lineTo(665 * sc, cy + 165 * sc); ctx.lineTo(245 * sc, cy + 165 * sc);
ctx.closePath(); ctx.fill();

// Minimalist Oak Wood Table Line
ctx.fillStyle = "#e6dec8"; ctx.fillRect(0, cy + 145 * sc, W, H - (cy + 145 * sc));
ctx.strokeStyle = "#c8bda3"; ctx.lineWidth = 2 * sc;
ctx.beginPath(); ctx.moveTo(0, cy + 145 * sc); ctx.lineTo(W, cy + 145 * sc); ctx.stroke();

// Editorial Serif Chapter Header (Top-Left, Generous Whitespace)
const kHead = s.ease.out(s.clamp(s.t / 0.7, 0, 1));
ctx.save(); ctx.globalAlpha = kHead; ctx.translate(64 * sc, (135 + (1 - kHead) * 14) * sc);
ctx.font = "500 " + Math.round(12 * sc) + 'px "JetBrains Mono", monospace'; ctx.fillStyle = "#78716c"; ctx.textAlign = "left";
ctx.fillText("01  /  ESSENTIAL MORNING RITUAL", 0, 0);
ctx.font = "600 " + Math.round(32 * sc) + 'px "Playfair Display", Georgia, serif'; ctx.fillStyle = "#1c1917";
ctx.fillText("Less Noise, Deeper Focus.", 0, 42 * sc);
ctx.restore();

// Handcrafted Ceramic V60 Pour-Over Coffee Carafe & Stoneware Cup on Linen Coaster
const kCup = s.spring(0.14, "smooth");
ctx.save(); ctx.translate(cx, cy + 145 * sc); ctx.scale(kCup, kCup);
// Soft long morning shadow on table
ctx.fillStyle = "rgba(120,113,108,0.16)";
ctx.beginPath(); ctx.ellipse(48 * sc, 6 * sc, 155 * sc, 16 * sc, 0, 0, Math.PI * 2); ctx.fill();

// Glass Carafe Server on Left
ctx.fillStyle = "rgba(255,255,255,0.65)"; ctx.strokeStyle = "#a8a29e"; ctx.lineWidth = 2.2 * sc;
ctx.beginPath();
ctx.moveTo(-115 * sc, -110 * sc); ctx.lineTo(-45 * sc, -110 * sc);
ctx.lineTo(-22 * sc, -12 * sc);
ctx.quadraticCurveTo(-22 * sc, 0, -38 * sc, 0);
ctx.lineTo(-122 * sc, 0);
ctx.quadraticCurveTo(-138 * sc, 0, -138 * sc, -12 * sc);
ctx.closePath(); ctx.fill(); ctx.stroke();
// Warm Amber Coffee inside Carafe
ctx.fillStyle = "#451a03";
ctx.beginPath();
ctx.moveTo(-126 * sc, -58 * sc); ctx.lineTo(-34 * sc, -58 * sc);
ctx.lineTo(-26 * sc, -6 * sc); ctx.lineTo(-134 * sc, -6 * sc);
ctx.closePath(); ctx.fill();

// Ribbed Matte Sage-Stoneware V60 Dripper sitting on top of Carafe
ctx.fillStyle = "#78866b"; ctx.strokeStyle = "#5c6b50"; ctx.lineWidth = 2.2 * sc;
ctx.beginPath();
ctx.moveTo(-132 * sc, -192 * sc); ctx.lineTo(-28 * sc, -192 * sc);
ctx.lineTo(-52 * sc, -110 * sc); ctx.lineTo(-108 * sc, -110 * sc);
ctx.closePath(); ctx.fill(); ctx.stroke();
ctx.fillRect(-98 * sc, -114 * sc, 36 * sc, 8 * sc);

// Minimalist Cream Ceramic Mug on Right
ctx.fillStyle = "#e7e5e4"; ctx.strokeStyle = "#a8a29e"; ctx.lineWidth = 2.2 * sc;
ctx.beginPath(); ctx.roundRect(42 * sc, -82 * sc, 86 * sc, 82 * sc, [4 * sc, 4 * sc, 22 * sc, 22 * sc]); ctx.fill(); ctx.stroke();
ctx.beginPath(); ctx.arc(128 * sc, -42 * sc, 20 * sc, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();

// Delicate single-line steam wisps rising from cup & dripper
ctx.strokeStyle = "rgba(120,113,108,0.42)"; ctx.lineWidth = 2 * sc; ctx.lineCap = "round";
[-80, 85].forEach((sx, idx) => {
  const wave = Math.sin(s.t * 2 + idx) * 8 * sc;
  ctx.beginPath();
  ctx.moveTo(sx * sc, -198 * sc + idx * 108 * sc);
  ctx.bezierCurveTo((sx - 16) * sc + wave, (-235 + idx * 108) * sc, (sx + 16) * sc - wave, (-265 + idx * 108) * sc, sx * sc, (-295 + idx * 108) * sc);
  ctx.stroke();
});
ctx.restore();

s.sfx("swish", 0.12, 0.38); s.sfx("drop", 0.65, 0.42);`,
    ],
    [
      'Bayangan daun monstera bergerak pelan mengikuti sinar matahari di dinding studio yang hening.',
      'Bayangan daun, dinding studio',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.45, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#f4f1ea"; ctx.fillRect(0, 0, W, H);

// Architectural Sunlight Window Frame Shadow projected on Plaster Wall
const sway = Math.sin(s.t * 1.1) * 10 * sc;
ctx.save();
ctx.fillStyle = "rgba(28,25,23,0.065)";
ctx.beginPath();
ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(0, H);
// Cut out two warm sunlit window panes
ctx.moveTo(95 * sc + sway * 0.3, 195 * sc);
ctx.lineTo(335 * sc + sway * 0.3, 235 * sc);
ctx.lineTo(335 * sc + sway * 0.3, 685 * sc);
ctx.lineTo(95 * sc + sway * 0.3, 645 * sc);
ctx.closePath();
ctx.moveTo(368 * sc + sway * 0.3, 240 * sc);
ctx.lineTo(615 * sc + sway * 0.3, 282 * sc);
ctx.lineTo(615 * sc + sway * 0.3, 732 * sc);
ctx.lineTo(368 * sc + sway * 0.3, 690 * sc);
ctx.closePath();
ctx.fill("evenodd");
ctx.restore();

// Handcrafted Ceramic Vase with Organic Monstera Leaf Branch in Foreground
const kVase = s.spring(0.12, "smooth");
ctx.save(); ctx.translate(cx - 45 * sc, cy + 175 * sc); ctx.scale(kVase, kVase);

// Monstera stem & fenestrated leaf swaying gently
ctx.save(); ctx.translate(12 * sc, -135 * sc); ctx.rotate(0.15 + Math.sin(s.t * 1.4) * 0.035);
ctx.strokeStyle = "#3f6212"; ctx.lineWidth = 4.5 * sc; ctx.lineCap = "round";
ctx.beginPath(); ctx.moveTo(-12 * sc, 25 * sc); ctx.quadraticCurveTo(35 * sc, -85 * sc, 95 * sc, -185 * sc); ctx.stroke();
// Monstera leaf silhouette with signature splits
ctx.fillStyle = "#4d7c0f";
ctx.beginPath();
ctx.moveTo(35 * sc, -75 * sc);
ctx.bezierCurveTo(-45 * sc, -135 * sc, -15 * sc, -245 * sc, 115 * sc, -225 * sc);
ctx.bezierCurveTo(165 * sc, -165 * sc, 125 * sc, -55 * sc, 35 * sc, -75 * sc);
ctx.fill();
// Leaf fenestration cuts (warm wall color showing through slits)
ctx.fillStyle = "#f4f1ea";
[-155, -125].forEach((ly) => {
  ctx.beginPath(); ctx.ellipse(38 * sc, ly * sc, 24 * sc, 5 * sc, -0.35, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(96 * sc, (ly + 12) * sc, 24 * sc, 5 * sc, 0.35, 0, Math.PI * 2); ctx.fill();
});
ctx.restore();

// Sculptural Matte Terracotta Ribbed Vase
ctx.fillStyle = "#c27d5c"; ctx.strokeStyle = "#9a5b3e"; ctx.lineWidth = 2 * sc;
ctx.beginPath();
ctx.moveTo(-24 * sc, -135 * sc); ctx.lineTo(24 * sc, -135 * sc);
ctx.bezierCurveTo(68 * sc, -85 * sc, 72 * sc, -15 * sc, 42 * sc, 25 * sc);
ctx.lineTo(-42 * sc, 25 * sc);
ctx.bezierCurveTo(-72 * sc, -15 * sc, -68 * sc, -85 * sc, -24 * sc, -135 * sc);
ctx.closePath(); ctx.fill(); ctx.stroke();
ctx.restore();

// Minimalist Editorial Quote Card
const kQuote = s.ease.out(s.clamp((s.t - 0.35) / 0.7, 0, 1));
if (kQuote > 0.01) {
  ctx.save(); ctx.globalAlpha = kQuote; ctx.translate(72 * sc, (165 + (1 - kQuote) * 14) * sc);
  ctx.font = "500 " + Math.round(12 * sc) + 'px "JetBrains Mono", monospace'; ctx.fillStyle = "#78716c"; ctx.textAlign = "left";
  ctx.fillText("02  /  MINDFUL SPACE", 0, 0);
  ctx.font = "italic 600 " + Math.round(28 * sc) + 'px "Playfair Display", Georgia, serif'; ctx.fillStyle = "#1c1917";
  ctx.fillText("“Ketenangan adalah kemewahan tertinggi.”", 0, 38 * sc);
  ctx.restore();
}
s.sfx("swish", 0.15, 0.35); s.sfx("tap", 0.7, 0.38);`,
    ],
    [
      'Bandul kuningan berayun teratur menjaga ritme kerja tetap tenang tanpa terburu-buru.',
      'Bandul kuningan, tanpa terburu-buru',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.45, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#f5f2eb"; ctx.fillRect(0, 0, W, H);

// Minimalist Brass & Walnut Pendulum Metronome / Arch Table Clock
const kClock = s.spring(0.1, "smooth");
ctx.save(); ctx.translate(cx, cy + 45 * sc); ctx.scale(kClock, kClock);

// Walnut Arch Frame
ctx.strokeStyle = "#57412d"; ctx.lineWidth = 10 * sc; ctx.lineCap = "round";
ctx.beginPath();
ctx.arc(0, -85 * sc, 135 * sc, Math.PI, 0);
ctx.lineTo(135 * sc, 125 * sc);
ctx.moveTo(-135 * sc, -85 * sc); ctx.lineTo(-135 * sc, 125 * sc);
ctx.stroke();
// Travertine Stone Base Slab
ctx.fillStyle = "#d6cfc2"; ctx.strokeStyle = "#a8a090"; ctx.lineWidth = 2 * sc;
ctx.beginPath(); ctx.roundRect(-165 * sc, 120 * sc, 330 * sc, 32 * sc, 8 * sc); ctx.fill(); ctx.stroke();

// Swinging Brass Pendulum Bob
const pendAng = Math.sin(s.t * Math.PI * 1.5) * 0.28;
ctx.save(); ctx.translate(0, -85 * sc); ctx.rotate(pendAng);
ctx.strokeStyle = "#b45309"; ctx.lineWidth = 3 * sc;
ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 155 * sc); ctx.stroke();
const pg = ctx.createRadialGradient(-10 * sc, 145 * sc, 3 * sc, 0, 155 * sc, 34 * sc);
pg.addColorStop(0, "#fef08a"); pg.addColorStop(0.5, "#d97706"); pg.addColorStop(1, "#78350f");
ctx.fillStyle = pg;
ctx.beginPath(); ctx.arc(0, 155 * sc, 30 * sc, 0, Math.PI * 2); ctx.fill();
ctx.restore();

// Minimalist Cream Clock Dial
ctx.fillStyle = "#fdfbf7"; ctx.strokeStyle = "#c8bda3"; ctx.lineWidth = 3 * sc;
ctx.beginPath(); ctx.arc(0, -85 * sc, 78 * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
for (let m = 0; m < 12; m++) {
  const a = (m / 12) * Math.PI * 2;
  ctx.strokeStyle = "#78716c"; ctx.lineWidth = (m % 3 === 0 ? 3 : 1.5) * sc;
  ctx.beginPath();
  ctx.moveTo(Math.cos(a) * 60 * sc, -85 * sc + Math.sin(a) * 60 * sc);
  ctx.lineTo(Math.cos(a) * 70 * sc, -85 * sc + Math.sin(a) * 70 * sc);
  ctx.stroke();
}
// Thin brass hands
ctx.strokeStyle = "#1c1917"; ctx.lineWidth = 3.5 * sc;
ctx.beginPath(); ctx.moveTo(0, -85 * sc); ctx.lineTo(28 * sc, -108 * sc); ctx.stroke();
ctx.strokeStyle = "#b45309"; ctx.lineWidth = 2.5 * sc;
ctx.beginPath(); ctx.moveTo(0, -85 * sc); ctx.lineTo(0, -138 * sc); ctx.stroke();
ctx.restore();

// Editorial 3-Step Calmness Index below
const kMeta = s.ease.out(s.clamp((s.t - 0.3) / 0.7, 0, 1));
ctx.save(); ctx.globalAlpha = kMeta;
ctx.font = "500 " + Math.round(12 * sc) + 'px "JetBrains Mono", monospace'; ctx.fillStyle = "#78716c"; ctx.textAlign = "center";
ctx.fillText("03  /  UNHURRIED CADENCE  ·  60 BPM", cx, 145 * sc);
ctx.restore();
s.sfx("tick", 0.25, 0.38); s.sfx("tick", 0.92, 0.38); s.sfx("tick", 1.58, 0.38);`,
    ],
    [
      'Tutup hari dengan jurnal bersih dan pikiran yang tertata rapi untuk esok hari.',
      'jurnal bersih, tertata rapi',
      'paper',
      `const W = s.W || 720, H = s.H || 1280, cx = W * 0.5, cy = H * 0.45, sc = Math.min(W / 720, H / 1280);
ctx.fillStyle = "#f4f1ea"; ctx.fillRect(0, 0, W, H);

// Open Linen-Bound Hardcover Journal with silk ribbon bookmark & brass fountain pen
const kBook = s.spring(0.08, "smooth");
ctx.save(); ctx.translate(cx, cy + 10 * sc); ctx.scale(kBook, kBook);
ctx.shadowColor = "rgba(28,25,23,0.12)"; ctx.shadowBlur = 28 * sc; ctx.shadowOffsetY = 14 * sc;

// Linen outer cover
ctx.fillStyle = "#78716c";
ctx.beginPath(); ctx.roundRect(-225 * sc, -148 * sc, 450 * sc, 296 * sc, 12 * sc); ctx.fill();
ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

// Left & Right Cream Cotton Paper Pages with curved spine shadow
ctx.fillStyle = "#fdfbf7";
ctx.beginPath(); ctx.roundRect(-215 * sc, -138 * sc, 212 * sc, 276 * sc, 6 * sc); ctx.fill();
ctx.beginPath(); ctx.roundRect(3 * sc, -138 * sc, 212 * sc, 276 * sc, 6 * sc); ctx.fill();
const spineG = ctx.createLinearGradient(-16 * sc, 0, 16 * sc, 0);
spineG.addColorStop(0, "rgba(28,25,23,0)"); spineG.addColorStop(0.5, "rgba(28,25,23,0.16)"); spineG.addColorStop(1, "rgba(28,25,23,0)");
ctx.fillStyle = spineG; ctx.fillRect(-16 * sc, -138 * sc, 32 * sc, 276 * sc);

// Terracotta Silk Bookmark Ribbon hanging from bottom of spine
ctx.fillStyle = "#b45309";
ctx.beginPath();
ctx.moveTo(-5 * sc, 138 * sc); ctx.lineTo(5 * sc, 138 * sc);
ctx.lineTo(14 * sc, 195 * sc); ctx.lineTo(3 * sc, 184 * sc); ctx.lineTo(-8 * sc, 195 * sc);
ctx.closePath(); ctx.fill();

// Left Page Editorial Typography
ctx.font = "500 " + Math.round(10 * sc) + 'px "JetBrains Mono", monospace'; ctx.fillStyle = "#a8a29e"; ctx.textAlign = "left";
ctx.fillText("CHAPTER IV · REFLECTION", -185 * sc, -98 * sc);
ctx.font = "600 " + Math.round(22 * sc) + 'px "Playfair Display", Georgia, serif'; ctx.fillStyle = "#1c1917";
ctx.fillText("Ruang Hening,", -185 * sc, -58 * sc);
ctx.fillText("Karya Jernih.", -185 * sc, -26 * sc);
for (let l = 0; l < 4; l++) {
  ctx.strokeStyle = "#e7e5e4"; ctx.lineWidth = 2 * sc;
  ctx.beginPath(); ctx.moveTo(-185 * sc, (16 + l * 24) * sc); ctx.lineTo(-32 * sc, (16 + l * 24) * sc); ctx.stroke();
}

// Right Page Checklist with Minimalist Brass Fountain Pen resting diagonally
const items = ["1. Kurangi distraksi", "2. Jaga ritme napas", "3. Selesaikan satu hal"];
items.forEach((txt, i) => {
  const ki = s.ease.out(s.clamp((s.t - 0.35 - i * 0.25) / 0.45, 0, 1));
  if (ki > 0.01) {
    ctx.save(); ctx.globalAlpha = ki;
    ctx.font = "500 " + Math.round(14 * sc) + 'px "Plus Jakarta Sans", sans-serif'; ctx.fillStyle = "#292524";
    ctx.fillText(txt, 32 * sc, (-65 + i * 44) * sc);
    ctx.restore();
  }
});

// Brass Fountain Pen resting diagonally on right page
ctx.save(); ctx.translate(115 * sc, 65 * sc); ctx.rotate(-0.55);
ctx.fillStyle = "#292524"; ctx.beginPath(); ctx.roundRect(-85 * sc, -6 * sc, 145 * sc, 12 * sc, 6 * sc); ctx.fill();
ctx.fillStyle = "#d97706"; ctx.fillRect(35 * sc, -6 * sc, 25 * sc, 12 * sc);
ctx.beginPath(); ctx.moveTo(60 * sc, -5 * sc); ctx.lineTo(82 * sc, 0); ctx.lineTo(60 * sc, 5 * sc); ctx.closePath(); ctx.fill();
ctx.restore();
ctx.restore();
s.sfx("pageflip", 0.12, 0.45); s.sfx("tap", 0.75, 0.42);`,
    ],
  ],
};

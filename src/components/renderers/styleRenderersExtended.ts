import { type StyleChapter, type StyleModuleInfo } from '../../data/satset-modules.ts';

// Easing helpers
const easeOutBack = (x: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

const easeOutBounce = (x: number): number => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
  if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
  return n1 * (x -= 2.625 / d1) * x + 0.984375;
};

// =======================================================================
// 1. BENTO GRID (Apple Keynote Style Modular Grid)
// =======================================================================
export function renderBentoGrid(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Rich dark graphite background with ambient glow
  const bg = c.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#090d16');
  bg.addColorStop(0.5, '#0f172a');
  bg.addColorStop(1, '#020617');
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);

  // Subtle ambient cyan / violet gradient orb behind
  const glow = c.createRadialGradient(w * 0.7, h * 0.4, 10, w * 0.7, h * 0.4, 160);
  glow.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
  glow.addColorStop(1, 'transparent');
  c.fillStyle = glow;
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 10;

  // 4 Bento Cards layout
  // Card 1: Top-Left Hero Card (Active progress dial & pulse)
  const c1x = cx - 120;
  const c1y = cy - 85;
  const c1w = 135;
  const c1h = 100;

  c.save();
  c.fillStyle = 'rgba(30, 41, 59, 0.75)';
  c.strokeStyle = 'rgba(148, 163, 184, 0.2)';
  c.lineWidth = 1.5;
  c.beginPath();
  c.roundRect(c1x, c1y, c1w, c1h, 14);
  c.fill();
  c.stroke();

  // Progress dial inside Hero
  const dialX = c1x + 40;
  const dialY = c1y + 52;
  const radius = 26;
  const dialProgress = Math.min(1, 0.2 + prog * 0.75);

  // Dial Track
  c.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  c.lineWidth = 5;
  c.lineCap = 'round';
  c.beginPath();
  c.arc(dialX, dialY, radius, -Math.PI / 2, Math.PI * 1.5);
  c.stroke();

  // Dial Fill (Cyan glowing gradient)
  c.strokeStyle = '#38bdf8';
  c.shadowColor = '#38bdf8';
  c.shadowBlur = 8;
  c.beginPath();
  c.arc(dialX, dialY, radius, -Math.PI / 2, -Math.PI / 2 + dialProgress * Math.PI * 2);
  c.stroke();
  c.shadowBlur = 0;

  // Dial percent text
  c.fillStyle = '#ffffff';
  c.font = 'bold 12px sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(`${Math.floor(dialProgress * 100)}%`, dialX, dialY);

  // Label inside card 1
  c.fillStyle = '#94a3b8';
  c.font = 'bold 9px sans-serif';
  c.textAlign = 'left';
  c.fillText('CORE ENGINE', c1x + 14, c1y + 18);
  c.fillStyle = '#38bdf8';
  c.font = 'bold 10px sans-serif';
  c.fillText('OPTIMAL', c1x + 80, c1y + 46);
  c.fillStyle = '#cbd5e1';
  c.font = '8px sans-serif';
  c.fillText('Ultra 60fps', c1x + 80, c1y + 60);

  // Card 2: Top-Right Stats Card (Rising animated bars)
  const c2x = cx + 25;
  const c2y = cy - 85;
  const c2w = 95;
  const c2h = 100;

  c.fillStyle = 'rgba(30, 41, 59, 0.75)';
  c.strokeStyle = 'rgba(148, 163, 184, 0.2)';
  c.beginPath();
  c.roundRect(c2x, c2y, c2w, c2h, 14);
  c.fill();
  c.stroke();

  c.fillStyle = '#94a3b8';
  c.font = 'bold 9px sans-serif';
  c.textAlign = 'left';
  c.fillText('TRAKSI', c2x + 12, c2y + 18);

  // 3 Bar indicators rising
  const barHeights = [28, 48, 38];
  barHeights.forEach((maxH, idx) => {
    const bx = c2x + 16 + idx * 24;
    const curH = maxH * Math.min(1, 0.3 + Math.sin(t * 3 + idx) * 0.2 + prog * 0.5);
    const by = c2y + 82 - curH;

    c.fillStyle = idx === 1 ? '#6366f1' : '#3b82f6';
    c.beginPath();
    c.roundRect(bx, by, 14, curH, 4);
    c.fill();
  });

  // Card 3: Bottom-Left Toggle Switch Card
  const c3x = cx - 120;
  const c3y = cy + 25;
  const c3w = 105;
  const c3h = 75;

  c.fillStyle = 'rgba(30, 41, 59, 0.75)';
  c.strokeStyle = 'rgba(148, 163, 184, 0.2)';
  c.beginPath();
  c.roundRect(c3x, c3y, c3w, c3h, 14);
  c.fill();
  c.stroke();

  c.fillStyle = '#94a3b8';
  c.font = 'bold 9px sans-serif';
  c.fillText('AUTO SYNC', c3x + 12, c3y + 18);

  // Animated Pill Switch
  const switchX = c3x + 14;
  const switchY = c3y + 36;
  const switchW = 44;
  const switchH = 24;
  const toggleOn = Math.sin(t * 2) > 0;
  const knobX = toggleOn ? switchX + 22 : switchX + 2;

  c.fillStyle = toggleOn ? '#10b981' : '#475569';
  c.beginPath();
  c.roundRect(switchX, switchY, switchW, switchH, 12);
  c.fill();

  c.fillStyle = '#ffffff';
  c.beginPath();
  c.arc(knobX + 10, switchY + 12, 8, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = toggleOn ? '#34d399' : '#94a3b8';
  c.font = 'bold 9px sans-serif';
  c.fillText(toggleOn ? 'ON' : 'OFF', switchX + 54, switchY + 16);

  // Card 4: Bottom-Right Wave Card
  const c4x = cx - 5;
  const c4y = cy + 25;
  const c4w = 125;
  const c4h = 75;

  c.fillStyle = 'rgba(30, 41, 59, 0.75)';
  c.strokeStyle = 'rgba(148, 163, 184, 0.2)';
  c.beginPath();
  c.roundRect(c4x, c4y, c4w, c4h, 14);
  c.fill();
  c.stroke();

  c.fillStyle = '#94a3b8';
  c.font = 'bold 9px sans-serif';
  c.fillText('LIVE RHYTHM', c4x + 12, c4y + 18);

  // Live Sine wave inside card 4
  c.strokeStyle = '#ec4899';
  c.lineWidth = 2.5;
  c.beginPath();
  for (let x = 0; x < c4w - 24; x += 3) {
    const wy = c4y + 48 + Math.sin(x * 0.15 + t * 6) * 12;
    if (x === 0) c.moveTo(c4x + 12 + x, wy);
    else c.lineTo(c4x + 12 + x, wy);
  }
  c.stroke();

  // Diagonal Specular Glare beam moving across cards
  const glarePos = ((t * 90) % (w + 200)) - 100;
  c.save();
  c.beginPath();
  c.rect(cx - 125, cy - 90, 250, 195);
  c.clip();

  const glare = c.createLinearGradient(glarePos, cy - 80, glarePos + 60, cy + 90);
  glare.addColorStop(0, 'rgba(255, 255, 255, 0)');
  glare.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)');
  glare.addColorStop(1, 'rgba(255, 255, 255, 0)');
  c.fillStyle = glare;
  c.fillRect(cx - 130, cy - 90, 260, 200);
  c.restore();
}

// =======================================================================
// EVERYDAY UI MONTAGE (Directly matching user's reference video)
// =======================================================================
export function renderEverydayUiMontage(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  const cx = w / 2;
  const cy = h / 2 - 20;

  // Background matching video: soft warm neutral with subtle dots
  const bgGrad = c.createLinearGradient(0, 0, 0, h);
  if (chapterIdx === 2) {
    bgGrad.addColorStop(0, '#111827');
    bgGrad.addColorStop(1, '#030712');
  } else {
    bgGrad.addColorStop(0, '#FAF8F5');
    bgGrad.addColorStop(1, '#F3EFE8');
  }
  c.fillStyle = bgGrad;
  c.fillRect(0, 0, w, h);

  // Subtle dot pattern
  c.fillStyle = chapterIdx === 2 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  for (let x = 12; x < w; x += 24) {
    for (let y = 12; y < h; y += 24) {
      c.fillRect(x, y, 1.5, 1.5);
    }
  }

  const k = Math.min(1, easeOutBack(Math.min(1, prog * 1.4)));

  if (chapterIdx === 0) {
    // -------------------------------------------------------------
    // SCENE 1: "Mulai dari yang kecil."
    // -------------------------------------------------------------
    // Floating Arrow box sliding in first
    const arrowK = Math.min(1, easeOutBack(Math.min(1, prog * 2.2)));
    c.save();
    c.translate(cx, cy - 80);
    c.scale(arrowK, arrowK);
    c.fillStyle = '#18181b';
    c.beginPath();
    c.roundRect(-24, -24, 48, 48, 12);
    c.fill();
    c.fillStyle = '#ff6a13';
    c.beginPath();
    c.roundRect(8, -4, 8, 8, 2);
    c.fill();
    // Arrow
    c.strokeStyle = '#ffffff';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-10, 0);
    c.lineTo(6, 0);
    c.lineTo(0, -6);
    c.moveTo(6, 0);
    c.lineTo(0, 6);
    c.stroke();
    c.restore();

    // 3D Browser / UI window popup
    c.save();
    c.translate(cx, cy + 20);
    c.scale(k, k);

    // Drop shadow
    c.shadowColor = 'rgba(0,0,0,0.12)';
    c.shadowBlur = 24;
    c.shadowOffsetY = 14;

    // Card background
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.roundRect(-135, -85, 270, 170, 20);
    c.fill();
    c.shadowColor = 'transparent';

    // Top window bar
    c.fillStyle = '#f4f4f5';
    c.beginPath();
    c.roundRect(-125, -75, 250, 36, 12);
    c.fill();

    // Badge 01
    c.fillStyle = '#ff6a13';
    c.beginPath();
    c.arc(75, -57, 14, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#ffffff';
    c.font = '800 12px "Plus Jakarta Sans", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('01', 75, -57);

    // Search bar / pill
    c.fillStyle = '#e4e4e7';
    c.beginPath();
    c.roundRect(-110, -63, 150, 12, 6);
    c.fill();

    // Screen area
    c.fillStyle = '#1e293b';
    c.beginPath();
    c.roundRect(-125, -25, 250, 95, 12);
    c.fill();

    // Progress bar inside window
    const fillW = Math.min(220, 220 * Math.min(1, prog * 1.5));
    c.fillStyle = '#ff6a13';
    c.beginPath();
    c.roundRect(-115, 45, fillW, 8, 4);
    c.fill();

    c.restore();

    // Subtitle bottom
    c.save();
    c.font = '800 18px "Plus Jakarta Sans", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#18181b';
    c.fillText('Mulai dari yang', cx - 35, h - 85);

    // Highlight box for "kecil."
    c.strokeStyle = '#ff6a13';
    c.lineWidth = 2.5;
    c.strokeRect(cx + 42, h - 100, 60, 30);
    c.fillStyle = '#ff6a13';
    c.fillText('kecil.', cx + 72, h - 85);
    c.restore();

  } else if (chapterIdx === 1) {
    // -------------------------------------------------------------
    // SCENE 2: "konsisten tiap hari."
    // -------------------------------------------------------------
    c.save();
    c.translate(cx, cy);
    c.scale(k, k);

    // Card with 3D drop shadow
    c.shadowColor = 'rgba(0,0,0,0.15)';
    c.shadowBlur = 24;
    c.shadowOffsetY = 16;
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.roundRect(-125, -120, 250, 240, 22);
    c.fill();
    c.shadowColor = 'transparent';

    // Blue header strip
    c.fillStyle = '#3b82f6';
    c.beginPath();
    c.roundRect(-110, -105, 220, 36, 10);
    c.fill();

    // Orange accent tag
    c.fillStyle = '#ff6a13';
    c.beginPath();
    c.roundRect(-110, -60, 80, 16, 6);
    c.fill();

    // 4 Checkmark items
    for (let i = 0; i < 4; i++) {
      const yPos = -25 + i * 44;
      const itemProgress = Math.max(0, Math.min(1, (prog - 0.15 - i * 0.12) * 3));
      const checkScale = easeOutBack(itemProgress);

      c.fillStyle = '#f1f5f9';
      c.beginPath();
      c.roundRect(-110, yPos - 14, 220, 28, 8);
      c.fill();

      if (checkScale > 0) {
        c.save();
        c.translate(-90, yPos);
        c.scale(checkScale, checkScale);
        c.fillStyle = '#22c55e';
        c.beginPath();
        c.arc(0, 0, 10, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#ffffff';
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(-4, 0);
        c.lineTo(-1, 3);
        c.lineTo(4, -3);
        c.stroke();
        c.restore();
      }

      c.fillStyle = '#cbd5e1';
      c.fillRect(-70, yPos - 3, 140, 6);
    }

    // Star burst explosion at top right
    const burstK = Math.min(1, easeOutBack(Math.max(0, (prog - 0.4) * 2)));
    if (burstK > 0) {
      c.save();
      c.translate(115, -115);
      c.scale(burstK, burstK);
      c.fillStyle = '#22c55e';
      c.beginPath();
      for (let i = 0; i < 16; i++) {
        const angle = (i * Math.PI) / 8;
        const rad = i % 2 === 0 ? 28 : 16;
        const bx = Math.cos(angle) * rad;
        const by = Math.sin(angle) * rad;
        if (i === 0) c.moveTo(bx, by);
        else c.lineTo(bx, by);
      }
      c.closePath();
      c.fill();
      c.restore();
    }

    c.restore();

    // Subtitle bottom
    c.save();
    c.font = '800 18px "Plus Jakarta Sans", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';

    // Box around "konsisten"
    c.strokeStyle = '#ff6a13';
    c.lineWidth = 2.5;
    c.strokeRect(cx - 105, h - 100, 95, 30);
    c.fillStyle = '#ff6a13';
    c.fillText('konsisten', cx - 58, h - 85);

    c.fillStyle = '#18181b';
    c.fillText('tiap hari.', cx + 55, h - 85);
    c.restore();

  } else if (chapterIdx === 2) {
    // -------------------------------------------------------------
    // SCENE 3: "Gagal itu bagian dari proses."
    // -------------------------------------------------------------
    c.save();
    c.translate(cx, cy);

    // 4 dark tiles falling & tumbling with 3D tilt
    const tileDrop = Math.min(1, prog * 1.6);
    const tileYOff = (1 - tileDrop) * -80;

    const tiles = [
      { x: -55, y: -55 + tileYOff, rot: -0.15 },
      { x: 55, y: -55 + tileYOff, rot: 0.12 },
      { x: -55, y: 55 + tileYOff, rot: 0.18 },
      { x: 55, y: 55 + tileYOff, rot: -0.1 },
    ];

    tiles.forEach((t) => {
      c.save();
      c.translate(t.x, t.y);
      c.rotate(t.rot);
      c.fillStyle = '#ff6a13';
      c.beginPath();
      c.roundRect(-30, -30, 60, 60, 10);
      c.fill();
      c.restore();
    });

    // Big central 3D Shield badge "2.0" popping up
    const shieldK = Math.min(1, easeOutBack(Math.max(0, (prog - 0.3) * 1.8)));
    if (shieldK > 0) {
      c.save();
      c.scale(shieldK, shieldK);
      c.fillStyle = '#22c55e';
      c.beginPath();
      c.roundRect(-36, -70, 72, 34, 10);
      c.fill();
      c.fillStyle = '#ffffff';
      c.font = '900 22px "Plus Jakarta Sans", sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('2.0', 0, -53);

      // Card plate behind
      c.fillStyle = '#f8fafc';
      c.beginPath();
      c.roundRect(-80, -25, 160, 110, 16);
      c.fill();

      c.fillStyle = '#3b82f6';
      c.fillRect(-65, -10, 130, 12);
      c.fillStyle = '#e2e8f0';
      c.fillRect(-65, 12, 130, 8);
      c.fillRect(-65, 28, 100, 8);
      c.restore();
    }

    c.restore();

    // Subtitle bottom
    c.save();
    c.font = '800 17px "Plus Jakarta Sans", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#ffffff';
    c.fillText('Gagal itu bagian dari', cx - 35, h - 85);

    // Box around "proses."
    c.strokeStyle = '#ff6a13';
    c.lineWidth = 2.5;
    c.strokeRect(cx + 52, h - 100, 68, 30);
    c.fillStyle = '#ff6a13';
    c.fillText('proses.', cx + 86, h - 85);
    c.restore();

  } else {
    // -------------------------------------------------------------
    // SCENE 4: "Kamu pasti bisa!"
    // -------------------------------------------------------------
    c.save();
    c.translate(cx, cy);
    c.scale(k, k);

    // Circular glowing 3D Pedestal
    c.fillStyle = 'rgba(0,0,0,0.1)';
    c.beginPath();
    c.ellipse(0, 110, 130, 35, 0, 0, Math.PI * 2);
    c.fill();

    // Blue background card frame
    c.fillStyle = '#3b82f6';
    c.beginPath();
    c.roundRect(-120, -110, 240, 210, 20);
    c.fill();

    // Big orange star behind trophy
    c.save();
    c.fillStyle = '#ff6a13';
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? 80 : 38;
      const sx = Math.cos(a) * r;
      const sy = Math.sin(a) * r - 15;
      if (i === 0) c.moveTo(sx, sy);
      else c.lineTo(sx, sy);
    }
    c.closePath();
    c.fill();
    c.restore();

    // Golden 3D trophy / figure popping in
    c.fillStyle = '#fbbf24';
    c.beginPath();
    c.roundRect(-24, -60, 48, 65, 8);
    c.fill();
    // Head / top
    c.beginPath();
    c.arc(0, -75, 18, 0, Math.PI * 2);
    c.fill();

    // Green circular base with 100% ribbon
    c.fillStyle = '#22c55e';
    c.beginPath();
    c.ellipse(0, 55, 60, 22, 0, 0, Math.PI * 2);
    c.fill();

    // 100% Ribbon banner
    c.fillStyle = '#10b981';
    c.beginPath();
    c.roundRect(-55, 68, 110, 28, 8);
    c.fill();
    c.fillStyle = '#ffffff';
    c.font = '900 15px "Plus Jakarta Sans", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('100%', 0, 82);

    c.restore();

    // Subtitle bottom
    c.save();
    c.font = '800 18px "Plus Jakarta Sans", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#18181b';
    c.fillText('Kamu', cx - 72, h - 85);

    // Box around "pasti"
    c.strokeStyle = '#ff6a13';
    c.lineWidth = 2.5;
    c.strokeRect(cx - 40, h - 100, 56, 30);
    c.fillStyle = '#ff6a13';
    c.fillText('pasti', cx - 12, h - 85);

    c.fillStyle = '#18181b';
    c.fillText('bisa!', cx + 48, h - 85);
    c.restore();
  }
}


// =======================================================================
// 2. PAPAN KAPUR / CHALKBOARD
// =======================================================================
export function renderPapanKapur(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Rich dark blackboard slate
  c.fillStyle = '#1c2826';
  c.fillRect(0, 0, w, h);

  // Subtle chalk smudges texture
  c.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let i = 0; i < 5; i++) {
    c.beginPath();
    c.ellipse(
      (w * 0.2 + i * 45) % w,
      (h * 0.3 + i * 50) % h,
      40 + i * 10,
      20 + i * 6,
      (i * 0.4),
      0,
      Math.PI * 2
    );
    c.fill();
  }

  // Wooden frame bottom shelf with chalk sticks
  c.fillStyle = '#854d0e';
  c.fillRect(0, h - 22, w, 22);
  c.fillStyle = '#a16207';
  c.fillRect(0, h - 22, w, 3);

  // White and yellow chalk sticks on the shelf
  c.fillStyle = '#fef08a';
  c.fillRect(w / 2 - 30, h - 14, 24, 7);
  c.fillStyle = '#ffffff';
  c.fillRect(w / 2 + 5, h - 14, 28, 7);

  // Chalk eraser with felt bottom
  c.fillStyle = '#451a03';
  c.fillRect(w / 2 + 50, h - 18, 42, 11);
  c.fillStyle = '#713f12';
  c.fillRect(w / 2 + 50, h - 7, 42, 4);

  const cx = w / 2;
  const cy = h / 2 - 25;

  // Drawing hand-drawn chalk geometric circle and triangle
  c.save();
  c.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  c.lineWidth = 2.5;
  c.setLineDash([12, 3]);

  // Compass circle being drawn
  const circleProg = Math.min(1, prog * 1.5);
  c.beginPath();
  c.arc(cx - 35, cy - 25, 38, 0, circleProg * Math.PI * 2);
  c.stroke();

  // Triangle inside or beside
  c.strokeStyle = '#fde047';
  c.lineWidth = 2.5;
  c.setLineDash([8, 2]);
  c.beginPath();
  c.moveTo(cx + 35, cy + 25);
  c.lineTo(cx + 85, cy + 25);
  c.lineTo(cx + 60, cy - 35);
  c.closePath();
  c.stroke();
  c.restore();

  // Mathematical formula drawn with chalk
  c.fillStyle = '#ffffff';
  c.font = 'italic 16px serif';
  c.textAlign = 'center';
  c.fillText('Δy / Δx = Pertumbuhan', cx, cy + 55);

  c.fillStyle = '#a7f3d0';
  c.font = 'bold 12px sans-serif';
  c.fillText('E = mc² + Fokus²', cx, cy + 80);

  // Chalk dust particles floating down
  for (let i = 0; i < 15; i++) {
    const px = (Math.sin(i * 3.7 + t * 0.4) * 0.5 + 0.5) * w;
    const py = (t * (20 + i * 5) + i * 40) % (h - 30);
    c.fillStyle = 'rgba(255, 255, 255, 0.45)';
    c.beginPath();
    c.arc(px, py, 1.2, 0, Math.PI * 2);
    c.fill();
  }
}

// =======================================================================
// 3. ISOMETRIK CERAH (3D Pastel Blocks Stacking)
// =======================================================================
export function renderIsometrikCerah(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Fresh bright pastel backdrop
  c.fillStyle = '#f8fafc';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 + 30;

  // Isometric Grid Lines
  c.strokeStyle = 'rgba(203, 213, 225, 0.45)';
  c.lineWidth = 1;
  const isoStep = 24;
  for (let i = -6; i <= 6; i++) {
    c.beginPath();
    c.moveTo(cx + i * isoStep * 2, cy - 100);
    c.lineTo(cx + (i - 6) * isoStep * 2, cy + 120);
    c.stroke();

    c.beginPath();
    c.moveTo(cx + i * isoStep * 2, cy - 100);
    c.lineTo(cx + (i + 6) * isoStep * 2, cy + 120);
    c.stroke();
  }

  // Draw 3D Isometric Cube helper
  const drawIsoCube = (
    ix: number,
    iy: number,
    size: number,
    height: number,
    colorTop: string,
    colorLeft: string,
    colorRight: string
  ) => {
    // Top face
    c.fillStyle = colorTop;
    c.beginPath();
    c.moveTo(ix, iy - height);
    c.lineTo(ix + size, iy - height + size * 0.5);
    c.lineTo(ix, iy - height + size);
    c.lineTo(ix - size, iy - height + size * 0.5);
    c.closePath();
    c.fill();

    // Left face
    c.fillStyle = colorLeft;
    c.beginPath();
    c.moveTo(ix - size, iy - height + size * 0.5);
    c.lineTo(ix, iy - height + size);
    c.lineTo(ix, iy + size);
    c.lineTo(ix - size, iy + size * 0.5);
    c.closePath();
    c.fill();

    // Right face
    c.fillStyle = colorRight;
    c.beginPath();
    c.moveTo(ix, iy - height + size);
    c.lineTo(ix + size, iy - height + size * 0.5);
    c.lineTo(ix + size, iy + size * 0.5);
    c.lineTo(ix, iy + size);
    c.closePath();
    c.fill();
  };

  // Stack of 3 isometric blocks with bouncy spring entrance
  const bounce1 = easeOutBounce(Math.min(1, prog * 1.8));
  const bounce2 = easeOutBounce(Math.max(0, Math.min(1, (prog - 0.2) * 1.8)));
  const bounce3 = easeOutBounce(Math.max(0, Math.min(1, (prog - 0.4) * 1.8)));

  const size = 32;

  // Base Cube 1 (Mint)
  const drop1 = (1 - bounce1) * -80;
  drawIsoCube(cx - 36, cy + drop1, size, 24, '#6ee7b7', '#10b981', '#059669');

  // Base Cube 2 (Sky Blue)
  const drop2 = (1 - bounce2) * -80;
  drawIsoCube(cx + 36, cy + drop2, size, 24, '#7dd3fc', '#0284c7', '#0369a1');

  // Top Peak Cube (Coral Pink with gentle hover)
  const hover = Math.sin(t * 4) * 6;
  const drop3 = (1 - bounce3) * -100 + hover;
  drawIsoCube(cx, cy - 36 + drop3, size, 28, '#f472b6', '#db2777', '#be185d');

  // Floating star / coin over peak
  c.save();
  c.translate(cx, cy - 90 + hover);
  c.rotate(t * 2);
  c.fillStyle = '#facc15';
  c.beginPath();
  c.arc(0, 0, 10, 0, Math.PI * 2);
  c.fill();
  c.restore();

  // Floating Label Badge
  c.fillStyle = '#1e293b';
  c.beginPath();
  c.roundRect(cx - 65, cy + 70, 130, 26, 13);
  c.fill();
  c.fillStyle = '#f8fafc';
  c.font = 'bold 11px sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('FONDASI KOKOH', cx, cy + 83);
}

// =======================================================================
// 4. INFOGRAFIS POP (Calendar Flip & Ticking Checklist)
// =======================================================================
export function renderInfografisPop(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  c.fillStyle = '#f0fdf4';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 30;

  // 1. Calendar flip card at top
  const calW = 100;
  const calH = 80;
  const calX = cx - calW / 2;
  const calY = cy - 70;

  c.save();
  c.fillStyle = '#ffffff';
  c.shadowColor = 'rgba(0,0,0,0.08)';
  c.shadowBlur = 12;
  c.beginPath();
  c.roundRect(calX, calY, calW, calH, 12);
  c.fill();
  c.shadowBlur = 0;

  // Calendar red top bar with binder rings
  c.fillStyle = '#ef4444';
  c.beginPath();
  c.roundRect(calX, calY, calW, 24, [12, 12, 0, 0]);
  c.fill();

  c.fillStyle = '#ffffff';
  c.font = 'bold 10px sans-serif';
  c.textAlign = 'center';
  c.fillText('HARI INI', cx, calY + 16);

  // Big animated Date Number with flutter
  const day = 1 + Math.floor(t * 1.5) % 31;
  const flutter = Math.sin(t * 8) * 2;
  c.fillStyle = '#0f172a';
  c.font = 'bold 34px sans-serif';
  c.fillText(`${day < 10 ? '0' + day : day}`, cx, calY + 62 + flutter);
  c.restore();

  // 2. Checklist card underneath
  const listW = 200;
  const listH = 100;
  const listX = cx - listW / 2;
  const listY = cy + 24;

  c.fillStyle = '#ffffff';
  c.beginPath();
  c.roundRect(listX, listY, listW, listH, 12);
  c.fill();
  c.strokeStyle = '#dcfce7';
  c.lineWidth = 1.5;
  c.stroke();

  const tasks = ['Bangun Pagi', 'Fokus 2 Jam', 'Evaluasi'];
  tasks.forEach((task, idx) => {
    const ty = listY + 22 + idx * 28;
    const isChecked = prog > (idx + 1) * 0.25;

    // Checkbox circle
    c.fillStyle = isChecked ? '#10b981' : '#f1f5f9';
    c.beginPath();
    c.arc(listX + 24, ty, 8, 0, Math.PI * 2);
    c.fill();

    if (isChecked) {
      c.strokeStyle = '#ffffff';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(listX + 20, ty);
      c.lineTo(listX + 23, ty + 3);
      c.lineTo(listX + 28, ty - 3);
      c.stroke();
    }

    // Task text
    c.fillStyle = isChecked ? '#065f46' : '#64748b';
    c.font = 'bold 11px sans-serif';
    c.textAlign = 'left';
    c.fillText(task, listX + 42, ty + 4);
  });

  // Confetti burst particles
  if (prog > 0.6) {
    const confettiColors = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899'];
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2 + t;
      const dist = 30 + (prog - 0.6) * 120 + (i % 3) * 15;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + 50 + Math.sin(angle) * dist * 0.7;

      c.fillStyle = confettiColors[i % confettiColors.length];
      c.fillRect(px, py, 5, 5);
    }
  }
}

// =======================================================================
// 5. KINETIK HUD (Sleep Clock & EKG Pulse Wave)
// =======================================================================
export function renderKinetikHud(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Deep Sci-Fi Midnight Backdrop
  c.fillStyle = '#030712';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 25;

  // Outer HUD dial ring with tick marks
  c.save();
  c.translate(cx, cy);

  c.strokeStyle = 'rgba(56, 189, 248, 0.2)';
  c.lineWidth = 1.5;
  c.beginPath();
  c.arc(0, 0, 75, 0, Math.PI * 2);
  c.stroke();

  // Tick marks
  for (let i = 0; i < 36; i++) {
    const angle = (i / 36) * Math.PI * 2;
    const r1 = i % 3 === 0 ? 66 : 70;
    const r2 = 75;
    c.strokeStyle = i % 3 === 0 ? '#38bdf8' : 'rgba(56, 189, 248, 0.4)';
    c.lineWidth = i % 3 === 0 ? 2 : 1;
    c.beginPath();
    c.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
    c.lineTo(Math.cos(angle) * r2, Math.sin(angle) * r2);
    c.stroke();
  }

  // Orbiting scanner dot
  const scannerAngle = t * 3;
  c.fillStyle = '#38bdf8';
  c.shadowColor = '#38bdf8';
  c.shadowBlur = 10;
  c.beginPath();
  c.arc(Math.cos(scannerAngle) * 75, Math.sin(scannerAngle) * 75, 4, 0, Math.PI * 2);
  c.fill();
  c.shadowBlur = 0;

  c.restore();

  // Big digital clock readout
  c.fillStyle = '#ffffff';
  c.font = 'bold 32px monospace';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const colon = Math.floor(t * 2) % 2 === 0 ? ':' : ' ';
  c.fillText(`07${colon}30`, cx - 12, cy - 6);

  c.fillStyle = '#38bdf8';
  c.font = 'bold 12px monospace';
  c.fillText('AM', cx + 46, cy - 6);

  c.fillStyle = '#94a3b8';
  c.font = 'bold 9px monospace';
  c.fillText('DEEP SLEEP 8.2h', cx, cy + 22);

  // EKG Heartbeat Line sweeping below
  const ekgY = cy + 85;
  c.strokeStyle = 'rgba(56, 189, 248, 0.2)';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(cx - 100, ekgY);
  c.lineTo(cx + 100, ekgY);
  c.stroke();

  c.strokeStyle = '#34d399';
  c.shadowColor = '#34d399';
  c.shadowBlur = 8;
  c.lineWidth = 2.5;
  c.beginPath();

  const sweep = ((t * 80) % 200) - 100;
  for (let x = -90; x <= 90; x += 3) {
    let dy = 0;
    const distToSweep = Math.abs(x - sweep);
    if (distToSweep < 15) {
      dy = Math.sin((x - sweep) * 0.4) * 18;
    }
    if (x === -90) c.moveTo(cx + x, ekgY + dy);
    else c.lineTo(cx + x, ekgY + dy);
  }
  c.stroke();
  c.shadowBlur = 0;

  // Pulse rate badge
  c.fillStyle = '#10b981';
  c.font = 'bold 10px monospace';
  c.fillText('❤ 72 BPM • RECOVERY 94%', cx, ekgY + 24);
}

// =======================================================================
// 6. PITCH MINIMAL (Swiss Vector Circle & Angle Sweep)
// =======================================================================
export function renderPitchMinimal(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Pure minimalist deep graphite
  c.fillStyle = '#09090b';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 20;

  // Swiss fine hairline geometric circle
  c.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  c.lineWidth = 1;
  c.beginPath();
  c.arc(cx, cy, 65, 0, Math.PI * 2);
  c.stroke();

  // Angle Protractor Sweep
  const sweepAngle = (prog * Math.PI * 1.5) % (Math.PI * 2);
  c.strokeStyle = '#3b82f6';
  c.lineWidth = 3;
  c.beginPath();
  c.arc(cx, cy, 65, -Math.PI / 2, -Math.PI / 2 + sweepAngle);
  c.stroke();

  // Radius Line
  c.strokeStyle = '#60a5fa';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(cx, cy);
  c.lineTo(
    cx + Math.cos(-Math.PI / 2 + sweepAngle) * 65,
    cy + Math.sin(-Math.PI / 2 + sweepAngle) * 65
  );
  c.stroke();

  // Center node
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.arc(cx, cy, 4, 0, Math.PI * 2);
  c.fill();

  // Angle text readout
  const deg = Math.floor((sweepAngle / (Math.PI * 2)) * 360);
  c.fillStyle = '#ffffff';
  c.font = '900 22px monospace';
  c.textAlign = 'center';
  c.fillText(`${deg}°`, cx, cy + 30);

  // Minimal Swiss Badges
  c.fillStyle = '#94a3b8';
  c.font = 'bold 9px sans-serif';
  c.fillText('PIVOT ANGLE', cx, cy - 25);

  c.fillStyle = '#22c55e';
  c.font = 'bold 11px monospace';
  c.fillText('+420% TAM EXPANSION', cx, cy + 90);
}

// =======================================================================
// 7. CERITA SINEMATIK (Atmospheric 35mm Parallax Landscape)
// =======================================================================
export function renderCeritaSinematik(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Golden hour cinematic gradient
  const sky = c.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#1e1b18');
  sky.addColorStop(0.4, '#7c2d12');
  sky.addColorStop(0.8, '#d97706');
  sky.addColorStop(1, '#fde68a');
  c.fillStyle = sky;
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;

  // Warm setting sun
  const sunY = cy - 20 + Math.sin(t * 0.5) * 6;
  const sunGlow = c.createRadialGradient(cx, sunY, 10, cx, sunY, 80);
  sunGlow.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
  sunGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.4)');
  sunGlow.addColorStop(1, 'transparent');
  c.fillStyle = sunGlow;
  c.beginPath();
  c.arc(cx, sunY, 80, 0, Math.PI * 2);
  c.fill();

  // Distant Mountain Silhouettes (Layer 1)
  c.fillStyle = '#78350f';
  c.beginPath();
  c.moveTo(0, cy + 40);
  c.lineTo(cx - 50, cy);
  c.lineTo(cx + 40, cy + 25);
  c.lineTo(w, cy - 10);
  c.lineTo(w, h);
  c.lineTo(0, h);
  c.closePath();
  c.fill();

  // Foreground Hill Silhouette (Layer 2)
  c.fillStyle = '#1c1917';
  c.beginPath();
  c.moveTo(0, cy + 60);
  c.bezierCurveTo(cx * 0.6, cy + 40, cx * 1.4, cy + 80, w, cy + 50);
  c.lineTo(w, h);
  c.lineTo(0, h);
  c.closePath();
  c.fill();

  // Silhouetted traveler walking
  const walkCycle = Math.sin(t * 6) * 8;
  const manX = cx + Math.sin(t * 0.8) * 30;
  const manY = cy + 45;

  c.fillStyle = '#09090b';
  // Head
  c.beginPath();
  c.arc(manX, manY - 26, 5, 0, Math.PI * 2);
  c.fill();
  // Body & Coat
  c.beginPath();
  c.moveTo(manX - 4, manY - 21);
  c.lineTo(manX + 4, manY - 21);
  c.lineTo(manX + 8 + walkCycle * 0.3, manY - 5);
  c.lineTo(manX - 6, manY - 5);
  c.closePath();
  c.fill();
  // Legs
  c.strokeStyle = '#09090b';
  c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(manX - 2, manY - 5);
  c.lineTo(manX - 2 + walkCycle, manY + 12);
  c.moveTo(manX + 2, manY - 5);
  c.lineTo(manX + 2 - walkCycle, manY + 12);
  c.stroke();

  // Warm floating embers / dust motes
  for (let i = 0; i < 16; i++) {
    const ex = (Math.sin(i * 4.3 + t * 0.6) * 0.5 + 0.5) * w;
    const ey = (h - (t * 30 + i * 25) % (h * 0.7));
    c.fillStyle = 'rgba(254, 215, 170, 0.7)';
    c.beginPath();
    c.arc(ex, ey, 1.5, 0, Math.PI * 2);
    c.fill();
  }

  // 2.39:1 Cinematic Letterbox Bars
  c.fillStyle = '#000000';
  c.fillRect(0, 0, w, 28);
  c.fillRect(0, h - 28, w, 28);
}

// =======================================================================
// 8. KOMIK STRIP (Manga Action Speed Lines & POW Burst)
// =======================================================================
export function renderKomikStrip(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Vibrant comic yellow
  c.fillStyle = '#fef08a';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 15;

  // Manga radial speed rays rushing from center
  c.save();
  c.translate(cx, cy);
  const numRays = 36;
  const angleStep = (Math.PI * 2) / numRays;
  const rayOffset = (t * 2) % angleStep;

  c.fillStyle = '#fde047';
  for (let i = 0; i < numRays; i += 2) {
    const a1 = i * angleStep + rayOffset;
    const a2 = (i + 1) * angleStep + rayOffset;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(Math.cos(a1) * w, Math.sin(a1) * w);
    c.lineTo(Math.cos(a2) * w, Math.sin(a2) * w);
    c.closePath();
    c.fill();
  }
  c.restore();

  // Halftone Dot Pattern on left border
  c.fillStyle = 'rgba(234, 88, 12, 0.35)';
  for (let x = 10; x < 60; x += 10) {
    for (let y = 10; y < h; y += 10) {
      c.beginPath();
      c.arc(x, y, 2.5, 0, Math.PI * 2);
      c.fill();
    }
  }

  // Sound Effect Starburst ("BAM!" / "SATSET!")
  const burstScale = 1 + Math.sin(t * 12) * 0.08;
  c.save();
  c.translate(cx, cy);
  c.scale(burstScale, burstScale);

  // Jagged starburst
  c.fillStyle = '#ef4444';
  c.strokeStyle = '#000000';
  c.lineWidth = 4;
  c.beginPath();
  const points = 16;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? 65 : 42;
    const a = (i / (points * 2)) * Math.PI * 2 + t * 0.5;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
  c.fill();
  c.stroke();

  // Inner yellow starburst
  c.fillStyle = '#facc15';
  c.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? 52 : 32;
    const a = (i / (points * 2)) * Math.PI * 2 + t * 0.5;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
  c.fill();

  // Comic text inside
  c.fillStyle = '#000000';
  c.font = '900 24px Impact, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('SATSET!', 0, 0);

  c.restore();

  // Action impact lines
  c.strokeStyle = '#000000';
  c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(cx - 80, cy - 70);
  c.lineTo(cx - 45, cy - 40);
  c.moveTo(cx + 80, cy - 70);
  c.lineTo(cx + 45, cy - 40);
  c.stroke();
}

// =======================================================================
// 9. CLAYMATION (Stop-Motion Clay Physics & Tactile Texture)
// =======================================================================
export function renderClaymation(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Craft Paper warm background
  c.fillStyle = '#f5eedc';
  c.fillRect(0, 0, w, h);

  // Stepped time for 12fps stop-motion authentic feel
  const steppedT = Math.floor(t * 12) / 12;

  const cx = w / 2;
  const cy = h / 2 - 10;

  // Squishy clay blob body with thumbprint wobble
  const wobble = Math.sin(steppedT * 10) * 4;
  const squashX = 48 + wobble;
  const squashY = 42 - wobble;

  // Clay drop shadow
  c.fillStyle = 'rgba(74, 52, 42, 0.18)';
  c.beginPath();
  c.ellipse(cx, cy + 45, squashX + 8, 12, 0, 0, Math.PI * 2);
  c.fill();

  // Clay character body (Coral Plasticine)
  c.fillStyle = '#fb7185';
  c.beginPath();
  c.ellipse(cx, cy + wobble, squashX, squashY, 0, 0, Math.PI * 2);
  c.fill();

  // Clay thumbprint texture ring
  c.strokeStyle = 'rgba(190, 24, 93, 0.25)';
  c.lineWidth = 2.5;
  c.beginPath();
  c.ellipse(cx - 10, cy + wobble - 5, squashX * 0.6, squashY * 0.6, 0.2, 0, Math.PI * 2);
  c.stroke();

  // Clay Eyes with stop-motion blink
  const isBlink = Math.sin(steppedT * 3) > 0.85;
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.arc(cx - 15, cy + wobble - 10, 8, 0, Math.PI * 2);
  c.arc(cx + 15, cy + wobble - 10, 8, 0, Math.PI * 2);
  c.fill();

  if (!isBlink) {
    c.fillStyle = '#0f172a';
    c.beginPath();
    c.arc(cx - 13, cy + wobble - 10, 4, 0, Math.PI * 2);
    c.arc(cx + 17, cy + wobble - 10, 4, 0, Math.PI * 2);
    c.fill();
  } else {
    c.strokeStyle = '#0f172a';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cx - 20, cy + wobble - 10);
    c.lineTo(cx - 10, cy + wobble - 10);
    c.moveTo(cx + 10, cy + wobble - 10);
    c.lineTo(cx + 20, cy + wobble - 10);
    c.stroke();
  }

  // Smile
  c.strokeStyle = '#0f172a';
  c.lineWidth = 2.5;
  c.beginPath();
  c.arc(cx, cy + wobble + 6, 12, 0.2, Math.PI - 0.2);
  c.stroke();

  // Little clay speech banner
  c.fillStyle = '#38bdf8';
  c.beginPath();
  c.roundRect(cx - 60, cy - 65, 120, 24, 8);
  c.fill();
  c.fillStyle = '#ffffff';
  c.font = 'bold 10px sans-serif';
  c.textAlign = 'center';
  c.fillText('CLAY STOPMOTION', cx, cy - 49);
}

// =======================================================================
// 10. RETRO PIXEL RPG (16-Bit Hero Jump & Coin Blocks)
// =======================================================================
export function renderRetroPixel(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // 8-bit / 16-bit blue sky
  c.fillStyle = '#38bdf8';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const groundY = h / 2 + 55;

  // Pixel clouds drifting
  const cloudX = ((t * 25) % (w + 100)) - 50;
  c.fillStyle = '#ffffff';
  c.fillRect(cloudX, 35, 60, 16);
  c.fillRect(cloudX + 12, 25, 36, 12);

  // Brick & Grass Ground
  c.fillStyle = '#22c55e';
  c.fillRect(0, groundY, w, 12);
  c.fillStyle = '#78350f';
  c.fillRect(0, groundY + 12, w, h - groundY);

  // Pixel Brick patterns
  c.fillStyle = '#92400e';
  for (let x = 0; x < w; x += 24) {
    c.fillRect(x, groundY + 16, 20, 8);
    c.fillRect(x + 12, groundY + 28, 20, 8);
  }

  // Mystery '?' Coin Box
  const boxX = cx - 18;
  const boxY = groundY - 75;
  const boxHit = Math.sin(t * 8) > 0.7;
  const curBoxY = boxHit ? boxY - 6 : boxY;

  c.fillStyle = '#eab308';
  c.fillRect(boxX, curBoxY, 36, 36);
  c.strokeStyle = '#713f12';
  c.lineWidth = 3;
  c.strokeRect(boxX, curBoxY, 36, 36);

  c.fillStyle = '#ffffff';
  c.font = 'bold 20px monospace';
  c.textAlign = 'center';
  c.fillText('?', cx, curBoxY + 26);

  // Pixel Hero Jumping
  const jump = Math.abs(Math.sin(t * 6)) * 40;
  const heroX = cx;
  const heroY = groundY - 26 - jump;

  // Pixel character (Cap + Face + Blue tunic)
  c.fillStyle = '#ef4444'; // Red cap
  c.fillRect(heroX - 10, heroY - 18, 20, 8);
  c.fillStyle = '#fde047'; // Skin
  c.fillRect(heroX - 8, heroY - 10, 16, 10);
  c.fillStyle = '#0284c7'; // Blue shirt
  c.fillRect(heroX - 10, heroY, 20, 14);

  // Pixel sword
  c.fillStyle = '#cbd5e1';
  c.fillRect(heroX + 12, heroY - 6, 14, 4);
  c.fillStyle = '#eab308';
  c.fillRect(heroX + 10, heroY - 8, 4, 8);

  // Floating "+100 EXP!" popup
  if (boxHit) {
    c.fillStyle = '#facc15';
    c.font = 'bold 12px monospace';
    c.fillText('+100 EXP!', cx, curBoxY - 12);
  }

  // Pixel HP Hearts at top
  c.fillStyle = '#ef4444';
  c.font = '14px monospace';
  c.fillText('❤❤❤  LVL 99', cx, 24);
}

// =======================================================================
// 11. GLITCH POP (RGB Split Chromatic Aberration & CRT Scanlines)
// =======================================================================
export function renderGlitchPop(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Dark cyber background
  c.fillStyle = '#050505';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 10;

  // Glitch jitter displacement
  const isGlitching = Math.sin(t * 15) > 0.6;
  const jitterX = isGlitching ? (Math.random() - 0.5) * 16 : 0;
  const jitterY = isGlitching ? (Math.random() - 0.5) * 6 : 0;

  // Cyan Channel
  c.fillStyle = 'rgba(6, 182, 212, 0.85)';
  c.font = '900 32px Impact, sans-serif';
  c.textAlign = 'center';
  c.fillText('GLITCH POP', cx - 4 + jitterX, cy);

  // Magenta / Pink Channel
  c.fillStyle = 'rgba(236, 72, 153, 0.85)';
  c.fillText('GLITCH POP', cx + 4 - jitterX, cy + jitterY);

  // Center White Main Channel
  c.fillStyle = '#ffffff';
  c.fillText('GLITCH POP', cx, cy);

  // Horizontal glitch displacement bars
  if (isGlitching) {
    for (let i = 0; i < 4; i++) {
      const sliceY = (cy - 50 + Math.random() * 100);
      const sliceH = 4 + Math.random() * 8;
      const sliceOffset = (Math.random() - 0.5) * 35;
      c.fillStyle = i % 2 === 0 ? '#06b6d4' : '#ec4899';
      c.fillRect(cx - 80 + sliceOffset, sliceY, 160, sliceH);
    }
  }

  // Digital noise particles
  for (let i = 0; i < 20; i++) {
    const nx = Math.random() * w;
    const ny = Math.random() * h;
    c.fillStyle = Math.random() > 0.5 ? '#22c55e' : '#facc15';
    c.fillRect(nx, ny, 3, 2);
  }

  // CRT Scanlines
  c.fillStyle = 'rgba(0, 0, 0, 0.3)';
  for (let y = 0; y < h; y += 4) {
    c.fillRect(0, y, w, 1.5);
  }

  c.fillStyle = '#38bdf8';
  c.font = 'bold 10px monospace';
  c.fillText('[ CYBER AUDIO SYNC ]', cx, cy + 45);
}

// =======================================================================
// 12. BUBBLE GUM (Squishy 3D Jelly Bouncing Spheres)
// =======================================================================
export function renderBubbleGum(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Soft pastel pink/lilac gradient
  const bg = c.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#fdf2f8');
  bg.addColorStop(1, '#fce7f3');
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const floorY = h / 2 + 50;

  // Floor shadow that expands on squash
  const bouncePhase = (t * 5) % Math.PI;
  const bounceHeight = Math.abs(Math.sin(bouncePhase));
  const isFloor = bounceHeight < 0.15;

  const shadowScale = isFloor ? 1.4 : 0.8;
  c.fillStyle = 'rgba(236, 72, 153, 0.2)';
  c.beginPath();
  c.ellipse(cx, floorY + 12, 45 * shadowScale, 10 * shadowScale, 0, 0, Math.PI * 2);
  c.fill();

  // Squash & Stretch Jelly Sphere
  const ballY = floorY - bounceHeight * 90;
  const scaleX = isFloor ? 1.3 : 0.85;
  const scaleY = isFloor ? 0.7 : 1.15;
  const radius = 38;

  c.save();
  c.translate(cx, ballY);
  c.scale(scaleX, scaleY);

  // 3D Jelly Gradient with highlight
  const jelly = c.createRadialGradient(-10, -12, 4, 0, 0, radius);
  jelly.addColorStop(0, '#ffffff');
  jelly.addColorStop(0.2, '#f472b6');
  jelly.addColorStop(0.8, '#ec4899');
  jelly.addColorStop(1, '#be185d');

  c.fillStyle = jelly;
  c.beginPath();
  c.arc(0, 0, radius, 0, Math.PI * 2);
  c.fill();

  // Specular Reflection Gleam
  c.fillStyle = 'rgba(255, 255, 255, 0.75)';
  c.beginPath();
  c.ellipse(-14, -14, 10, 5, -0.6, 0, Math.PI * 2);
  c.fill();

  c.restore();

  // Floating pastel orbital dots
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + t * 2;
    const dist = 55 + Math.sin(t * 4 + i) * 12;
    c.fillStyle = i % 2 === 0 ? '#38bdf8' : '#facc15';
    c.beginPath();
    c.arc(cx + Math.cos(angle) * dist, ballY + Math.sin(angle) * dist * 0.5, 3, 0, Math.PI * 2);
    c.fill();
  }
}

// =======================================================================
// 13. ADVANCED STICKMAN (From claude-stickman-shorts)
// =======================================================================
export function renderStickmanAdvanced(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  prog: number
) {
  // Rich midnight stage background
  c.fillStyle = '#0f172a';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const groundY = h / 2 + 50;

  // Grid / Stage Floor Line
  c.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(20, groundY);
  c.lineTo(w - 20, groundY);
  c.stroke();

  // Running speed: kinematic leg phases
  const runSpeed = t * 9;
  const hipAngle = Math.sin(runSpeed) * 0.6;
  const torsoLean = 0.22; // forward energetic lean
  const headBob = Math.abs(Math.sin(runSpeed * 2)) * 6;

  const hipX = cx;
  const hipY = groundY - 55 + headBob;

  // Ground Shadow
  c.fillStyle = 'rgba(0, 0, 0, 0.4)';
  c.beginPath();
  c.ellipse(cx, groundY + 4, 32, 7, 0, 0, Math.PI * 2);
  c.fill();

  // Dust puffs under running feet
  for (let i = 0; i < 3; i++) {
    const dustX = cx - 25 - i * 16 - ((t * 40) % 20);
    const dustY = groundY - 2 - i * 4;
    c.fillStyle = `rgba(255, 255, 255, ${0.4 - i * 0.12})`;
    c.beginPath();
    c.arc(dustX, dustY, 4 + i * 2, 0, Math.PI * 2);
    c.fill();
  }

  c.save();
  c.strokeStyle = '#fbbf24';
  c.lineWidth = 4.5;
  c.lineCap = 'round';
  c.lineJoin = 'round';

  // Torso
  const shoulderX = hipX + Math.sin(torsoLean) * 45;
  const shoulderY = hipY - Math.cos(torsoLean) * 45;

  c.beginPath();
  c.moveTo(hipX, hipY);
  c.lineTo(shoulderX, shoulderY);
  c.stroke();

  // Head
  const headX = shoulderX + 4;
  const headY = shoulderY - 22;
  c.beginPath();
  c.arc(headX, headY, 15, 0, Math.PI * 2);
  c.stroke();
  c.fillStyle = '#fef08a';
  c.fill();

  // Expressive Eyes (Blinking & Determined)
  const blink = Math.sin(t * 4) > 0.9;
  if (!blink) {
    c.fillStyle = '#0f172a';
    c.beginPath();
    c.arc(headX + 4, headY - 2, 2.5, 0, Math.PI * 2);
    c.arc(headX + 11, headY - 2, 2.5, 0, Math.PI * 2);
    c.fill();
  }

  // Smile / determined mouth
  c.strokeStyle = '#0f172a';
  c.lineWidth = 2;
  c.beginPath();
  c.arc(headX + 8, headY + 5, 5, 0.1, Math.PI - 0.1);
  c.stroke();

  // Sweat Drop (energetic effort)
  c.fillStyle = '#38bdf8';
  c.beginPath();
  c.arc(headX - 14, headY - 4, 3, 0, Math.PI * 2);
  c.fill();

  // Front & Back Arms (Secondary swing)
  c.strokeStyle = '#fbbf24';
  c.lineWidth = 4.5;

  // Front Arm
  const armAngleF = -Math.sin(runSpeed) * 0.7;
  const elbowX = shoulderX + Math.sin(armAngleF) * 22;
  const elbowY = shoulderY + Math.cos(armAngleF) * 22;
  const handX = elbowX + Math.sin(armAngleF + 0.6) * 20;
  const handY = elbowY + Math.cos(armAngleF + 0.6) * 20;

  c.beginPath();
  c.moveTo(shoulderX, shoulderY);
  c.lineTo(elbowX, elbowY);
  c.lineTo(handX, handY);
  c.stroke();

  // Red Arm Band (Hero Marker from claude-stickman-shorts)
  c.strokeStyle = '#ef4444';
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(elbowX, elbowY);
  c.lineTo(elbowX + Math.sin(armAngleF + 0.6) * 6, elbowY + Math.cos(armAngleF + 0.6) * 6);
  c.stroke();

  // Legs with knee bend
  c.strokeStyle = '#fbbf24';
  c.lineWidth = 4.5;

  // Leg 1
  const knee1X = hipX + Math.sin(hipAngle) * 26;
  const knee1Y = hipY + Math.cos(hipAngle) * 26;
  const foot1X = knee1X + Math.sin(hipAngle - 0.5) * 26;
  const foot1Y = Math.min(groundY, knee1Y + Math.cos(hipAngle - 0.5) * 26);

  c.beginPath();
  c.moveTo(hipX, hipY);
  c.lineTo(knee1X, knee1Y);
  c.lineTo(foot1X, foot1Y);
  c.stroke();

  // Leg 2
  const knee2X = hipX - Math.sin(hipAngle) * 26;
  const knee2Y = hipY + Math.cos(-hipAngle) * 26;
  const foot2X = knee2X - Math.sin(hipAngle + 0.5) * 26;
  const foot2Y = Math.min(groundY, knee2Y + Math.cos(-hipAngle + 0.5) * 26);

  c.beginPath();
  c.moveTo(hipX, hipY);
  c.lineTo(knee2X, knee2Y);
  c.lineTo(foot2X, foot2Y);
  c.stroke();

  c.restore();

  // Animated Comic Speech Bubble with spring scale
  const bubbleScale = 1 + Math.sin(t * 8) * 0.05;
  c.save();
  c.translate(cx + 45, cy - 75);
  c.scale(bubbleScale, bubbleScale);

  c.fillStyle = '#ffffff';
  c.strokeStyle = '#0f172a';
  c.lineWidth = 2.5;
  c.beginPath();
  c.roundRect(-45, -18, 90, 36, 12);
  c.fill();
  c.stroke();

  // Bubble tail pointing to stickman
  c.beginPath();
  c.moveTo(-25, 18);
  c.lineTo(-35, 28);
  c.lineTo(-15, 18);
  c.closePath();
  c.fill();
  c.stroke();

  c.fillStyle = '#0f172a';
  c.font = '900 12px sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('GASPOL! 🔥', 0, 0);

  c.restore();

  // "DAY 1" Floating HUD badge at top
  c.fillStyle = '#ef4444';
  c.beginPath();
  c.roundRect(cx - 50, 20, 100, 22, 11);
  c.fill();
  c.fillStyle = '#ffffff';
  c.font = 'bold 10px monospace';
  c.textAlign = 'center';
  c.fillText('DAY 1 • STREAK', cx, 35);
}

// =======================================================================
// 14. ADVANCED UI WEBSITE (macOS Window & Gliding Cursor Click)
// =======================================================================
export function renderUiWebAdvanced(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  prog: number
) {
  c.fillStyle = '#f1f5f9';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 20;

  const winW = 230;
  const winH = 155;
  const winX = cx - winW / 2;
  const winY = cy - winH / 2;

  // Window Shadow
  c.fillStyle = 'rgba(0, 0, 0, 0.12)';
  c.beginPath();
  c.roundRect(winX, winY + 6, winW, winH, 12);
  c.fill();

  // Window Main Card
  c.fillStyle = '#ffffff';
  c.strokeStyle = '#cbd5e1';
  c.lineWidth = 1.5;
  c.beginPath();
  c.roundRect(winX, winY, winW, winH, 12);
  c.fill();
  c.stroke();

  // macOS Window Titlebar
  c.fillStyle = '#f8fafc';
  c.beginPath();
  c.roundRect(winX, winY, winW, 28, [12, 12, 0, 0]);
  c.fill();
  c.strokeStyle = '#e2e8f0';
  c.beginPath();
  c.moveTo(winX, winY + 28);
  c.lineTo(winX + winW, winY + 28);
  c.stroke();

  // Traffic lights
  c.fillStyle = '#ef4444';
  c.beginPath();
  c.arc(winX + 14, winY + 14, 4, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#f59e0b';
  c.beginPath();
  c.arc(winX + 26, winY + 14, 4, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#10b981';
  c.beginPath();
  c.arc(winX + 38, winY + 14, 4, 0, Math.PI * 2);
  c.fill();

  // URL search pill
  c.fillStyle = '#ffffff';
  c.strokeStyle = '#cbd5e1';
  c.lineWidth = 1;
  c.beginPath();
  c.roundRect(winX + 54, winY + 6, 155, 16, 8);
  c.fill();
  c.stroke();

  c.fillStyle = '#64748b';
  c.font = '8px monospace';
  c.textAlign = 'left';
  c.fillText('🔒 satsetmotion.id/create', winX + 62, winY + 17);

  // Body inside browser
  c.fillStyle = '#0f172a';
  c.font = 'bold 12px sans-serif';
  c.textAlign = 'center';
  c.fillText('Bikin Video Satset ⚡', cx, winY + 54);

  c.fillStyle = '#64748b';
  c.font = '9px sans-serif';
  c.fillText('Automasi Konten Viral Sekali Klik', cx, winY + 70);

  // Gradient CTA Button
  const btnX = cx - 55;
  const btnY = winY + 85;
  const btnW = 110;
  const btnH = 28;

  // Cursor glide path (smooth Bezier)
  const cursorCycle = (t * 0.8) % 3;
  let curX = cx - 70;
  let curY = winY + 130;
  let isClick = false;

  if (cursorCycle < 1.4) {
    // gliding towards CTA button
    const p = cursorCycle / 1.4;
    curX = cx - 70 + (btnX + 55 - (cx - 70)) * easeOutBack(p);
    curY = winY + 130 + (btnY + 14 - (winY + 130)) * p;
  } else if (cursorCycle < 2.0) {
    // clicking
    curX = btnX + 55;
    curY = btnY + 14;
    isClick = true;
  } else {
    // hovering
    curX = btnX + 55;
    curY = btnY + 14;
  }

  // Button rendering with click press
  c.save();
  if (isClick) {
    c.translate(cx, btnY + 14);
    c.scale(0.95, 0.95);
    c.translate(-cx, -(btnY + 14));
  }

  const btnGrad = c.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
  btnGrad.addColorStop(0, '#ea580c');
  btnGrad.addColorStop(1, '#f97316');
  c.fillStyle = btnGrad;
  c.beginPath();
  c.roundRect(btnX, btnY, btnW, btnH, 8);
  c.fill();

  c.fillStyle = '#ffffff';
  c.font = 'bold 10px sans-serif';
  c.textAlign = 'center';
  c.fillText('Buat Video ➔', cx, btnY + 18);
  c.restore();

  // Click shockwave ripple
  if (isClick) {
    const rippleR = ((cursorCycle - 1.4) / 0.6) * 35;
    c.strokeStyle = 'rgba(234, 88, 12, 0.6)';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(btnX + 55, btnY + 14, rippleR, 0, Math.PI * 2);
    c.stroke();
  }

  // Smooth mouse cursor arrow
  c.save();
  c.translate(curX, curY);
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, 16);
  c.lineTo(4, 12);
  c.lineTo(8, 20);
  c.lineTo(11, 18);
  c.lineTo(7, 10);
  c.lineTo(14, 9);
  c.closePath();
  c.fillStyle = '#0f172a';
  c.fill();
  c.strokeStyle = '#ffffff';
  c.lineWidth = 1.5;
  c.stroke();
  c.restore();

  // Toast Notification Slide-in
  if (cursorCycle >= 1.6) {
    c.fillStyle = '#10b981';
    c.beginPath();
    c.roundRect(cx - 75, winY + winH - 22, 150, 24, 12);
    c.fill();
    c.fillStyle = '#ffffff';
    c.font = 'bold 9px sans-serif';
    c.textAlign = 'center';
    c.fillText('✓ Video Berhasil Dibuat!', cx, winY + winH - 7);
  }
}

// =======================================================================
// 15. ADVANCED KINETIC TYPE (From kinetograph)
// =======================================================================
export function renderKineticTypeAdvanced(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapter: { headline: string; highlightWord?: string }
) {
  // Bold high-contrast black backdrop
  c.fillStyle = '#09090b';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;

  // Moving dynamic diagonal warning stripes in background
  c.save();
  c.rotate(-0.08);
  c.fillStyle = 'rgba(255, 255, 255, 0.03)';
  for (let x = -w; x < w * 2; x += 36) {
    c.fillRect(x + (t * 30) % 36, -h, 18, h * 3);
  }
  c.restore();

  // Punchy Camera Zoom Shake
  const zoom = 1 + Math.sin(t * 10) * 0.04;
  c.save();
  c.translate(cx, cy);
  c.scale(zoom, zoom);

  // Big Electric Yellow Highlighting Box
  c.fillStyle = '#facc15';
  c.fillRect(-115, -34, 230, 68);

  // Focal Highlight Word (Massive Impact)
  c.fillStyle = '#09090b';
  c.font = '900 26px Impact, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(chapter.highlightWord || 'SEKARANG!', 0, 0);

  // Punchy White Sub-Headlines
  c.fillStyle = '#ffffff';
  c.font = 'bold 13px monospace';
  c.fillText(chapter.headline.toUpperCase(), 0, -56);

  // Rotating Badge Banner
  c.fillStyle = '#ef4444';
  c.beginPath();
  c.roundRect(-75, 45, 150, 22, 11);
  c.fill();

  c.fillStyle = '#ffffff';
  c.font = 'bold 10px monospace';
  c.fillText('★ 100% EKSEKUSI ★', 0, 60);

  c.restore();

  // Kinetic accent spark particles
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + t * 4;
    const dist = 95 + Math.sin(t * 8 + i) * 15;
    c.fillStyle = '#facc15';
    c.beginPath();
    c.arc(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist * 0.6, 2.5, 0, Math.PI * 2);
    c.fill();
  }
}

// =======================================================================
// 16. ADVANCED PROCEDURAL ENGINE (Luminous Constellation & Sine Vortices)
// =======================================================================
export function renderProceduralMotionAdvanced(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  index: number
) {
  const cx = w / 2;
  const cy = h / 2 - 10;

  // Deep space indigo gradient
  const bg = c.createRadialGradient(cx, cy, 10, cx, cy, 180);
  bg.addColorStop(0, '#1e1b4b');
  bg.addColorStop(0.7, '#0f172a');
  bg.addColorStop(1, '#020617');
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);

  // 3 Luminous Orbital Rings with 3D tilt
  c.save();
  c.translate(cx, cy);

  for (let i = 0; i < 3; i++) {
    c.save();
    c.rotate(t * 0.6 * (i % 2 === 0 ? 1 : -1) + (i * Math.PI) / 3);
    c.scale(1, 0.45);

    c.strokeStyle = `hsl(${(i * 60 + t * 40) % 360}, 85%, 65%)`;
    c.lineWidth = 2.5;
    c.beginPath();
    c.arc(0, 0, 50 + i * 22, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }

  // Central glowing core
  const core = c.createRadialGradient(0, 0, 2, 0, 0, 22);
  core.addColorStop(0, '#ffffff');
  core.addColorStop(0.5, '#38bdf8');
  core.addColorStop(1, 'transparent');
  c.fillStyle = core;
  c.beginPath();
  c.arc(0, 0, 22, 0, Math.PI * 2);
  c.fill();

  c.restore();

  // Constellation particles connected with faint lines
  const particles: { x: number; y: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + t * 0.5;
    const r = 60 + Math.sin(t * 2 + i) * 25;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r * 0.7;
    particles.push({ x: px, y: py });

    c.fillStyle = '#facc15';
    c.beginPath();
    c.arc(px, py, 2.5, 0, Math.PI * 2);
    c.fill();
  }

  c.strokeStyle = 'rgba(250, 204, 21, 0.2)';
  c.lineWidth = 1;
  c.beginPath();
  for (let i = 0; i < particles.length; i++) {
    const p1 = particles[i];
    const p2 = particles[(i + 1) % particles.length];
    c.moveTo(p1.x, p1.y);
    c.lineTo(p2.x, p2.y);
  }
  c.stroke();
}

// =======================================================================
// 17. BANG MOTION (from bangtutorial/bang-motion)
// =======================================================================
export function renderBangMotion(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  const cx = w / 2;
  const cy = h / 2 - 10;

  // Rich dark graphite base
  c.fillStyle = '#0f0f11';
  c.fillRect(0, 0, w, h);

  // Dynamic diagonal color block (Bang Tutorial Signature Red-Orange)
  const angle = -0.15;
  c.save();
  c.translate(cx, cy);
  c.rotate(angle);

  // Animated sliding red-orange hero block
  const slideX = -120 + Math.sin(t * 2) * 10;
  c.fillStyle = '#ff3b00';
  c.fillRect(slideX, -60, 240, 120);

  // Yellow accent slash
  c.fillStyle = '#ffe600';
  c.fillRect(slideX + 180, -60, 16, 120);

  // Anti-PPT typography
  c.fillStyle = '#ffffff';
  c.font = '900 24px Impact, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('BANG MOTION', 0, -10);

  c.fillStyle = '#0f0f11';
  c.font = 'bold 11px monospace';
  c.fillText('★ ANTI-PPT CINEMATIC ★', 0, 18);

  c.restore();

  // Cinematic Camera Crosshair [ + ]
  c.strokeStyle = 'rgba(255, 230, 0, 0.7)';
  c.lineWidth = 1.5;
  const boxSize = 75;
  // Top-left corner
  c.beginPath();
  c.moveTo(cx - boxSize, cy - boxSize + 15);
  c.lineTo(cx - boxSize, cy - boxSize);
  c.lineTo(cx - boxSize + 15, cy - boxSize);
  c.stroke();
  // Top-right corner
  c.beginPath();
  c.moveTo(cx + boxSize, cy - boxSize + 15);
  c.lineTo(cx + boxSize, cy - boxSize);
  c.lineTo(cx + boxSize - 15, cy - boxSize);
  c.stroke();
  // Bottom-left corner
  c.beginPath();
  c.moveTo(cx - boxSize, cy + boxSize - 15);
  c.lineTo(cx - boxSize, cy + boxSize);
  c.lineTo(cx - boxSize + 15, cy + boxSize);
  c.stroke();
  // Bottom-right corner
  c.beginPath();
  c.moveTo(cx + boxSize, cy + boxSize - 15);
  c.lineTo(cx + boxSize, cy + boxSize);
  c.lineTo(cx + boxSize - 15, cy + boxSize);
  c.stroke();

  // Floating continuous action particles
  for (let i = 0; i < 10; i++) {
    const px = (Math.sin(i * 3.4 + t * 0.8) * 0.5 + 0.5) * w;
    const py = (t * (40 + i * 8) + i * 30) % h;
    c.fillStyle = i % 2 === 0 ? '#ff3b00' : '#ffe600';
    c.fillRect(px, py, 4, 4);
  }

  // Chapter 60fps pill badge
  c.fillStyle = '#ff3b00';
  c.beginPath();
  c.roundRect(cx - 75, cy + 85, 150, 24, 12);
  c.fill();
  c.fillStyle = '#ffffff';
  c.font = 'bold 9px monospace';
  c.textAlign = 'center';
  c.fillText('GSAP • 60 FPS • REMOTION', cx, cy + 100);
}

// =======================================================================
// 18. MINIMAL SWISS (Modernist Typography & Swiss Grid)
// =======================================================================
export function renderMinimalSwiss(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Clean off-white Swiss paper background
  c.fillStyle = '#f4f4f5';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 10;

  // Swiss International Grid lines
  c.strokeStyle = '#e4e4e7';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(25, 0); c.lineTo(25, h);
  c.moveTo(cx, 0); c.lineTo(cx, h);
  c.moveTo(w - 25, 0); c.lineTo(w - 25, h);
  c.moveTo(0, cy - 70); c.lineTo(w, cy - 70);
  c.moveTo(0, cy + 70); c.lineTo(w, cy + 70);
  c.stroke();

  // Animated Swiss Primary Red Header Block
  const redBlockW = Math.min(w - 50, 60 + prog * (w - 110));
  c.fillStyle = '#e11d48';
  c.fillRect(25, cy - 105, redBlockW, 26);

  c.fillStyle = '#ffffff';
  c.font = '900 11px sans-serif';
  c.textAlign = 'left';
  c.fillText('SWISS INTERNATIONAL STYLE', 34, cy - 88);

  // Big Bold Helvetica Numeral with Slide-in
  const numY = cy - 20 + Math.sin(t * 1.5) * 3;
  c.fillStyle = '#18181b';
  c.font = '900 48px sans-serif';
  c.textAlign = 'left';
  c.fillText(`0${chapterIdx + 1}`, 30, numY);

  // Subtitle & Baseline
  c.fillStyle = '#71717a';
  c.font = 'bold 9px monospace';
  c.fillText('AKZIDENZ • 100% RATIO • BASEL', 32, cy + 5);

  c.strokeStyle = '#18181b';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(30, cy + 18);
  c.lineTo(w - 30, cy + 18);
  c.stroke();

  // Modernist Geometric Crosshair & Diagonal Cut
  c.save();
  c.translate(cx + 60, cy - 35);
  c.rotate(t * 0.4);
  c.strokeStyle = '#e11d48';
  c.lineWidth = 2.5;
  c.strokeRect(-22, -22, 44, 44);
  c.fillStyle = '#18181b';
  c.fillRect(-4, -4, 8, 8);
  c.restore();

  // Bottom Swiss Specs Bar
  c.fillStyle = '#18181b';
  c.fillRect(25, cy + 40, w - 50, 48);
  c.fillStyle = '#ffffff';
  c.font = 'bold 11px sans-serif';
  c.textAlign = 'left';
  c.fillText('GRID PURITY', 38, cy + 62);
  c.fillStyle = '#e11d48';
  c.font = 'bold 10px monospace';
  c.fillText('ZERO CLUTTER • ESSENTIAL ONLY', 38, cy + 76);
}

// =======================================================================
// 19. NOVEL VISUAL (Visual Novel Japanese Dialogue Box & Sakura)
// =======================================================================
export function renderNovelVisual(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Twilight Sky Gradient
  const bg = c.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#1e1b4b');
  bg.addColorStop(0.5, '#4c0519');
  bg.addColorStop(0.85, '#831843');
  bg.addColorStop(1, '#fbcfe8');
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 10;

  // Distant glowing sunset horizon
  const sunGlow = c.createRadialGradient(cx, cy - 20, 10, cx, cy - 20, 120);
  sunGlow.addColorStop(0, 'rgba(253, 164, 175, 0.5)');
  sunGlow.addColorStop(1, 'transparent');
  c.fillStyle = sunGlow;
  c.fillRect(0, 0, w, h);

  // Anime Character Silhouette (Torso & Hair)
  c.fillStyle = '#1e1b4b';
  c.beginPath();
  c.arc(cx, cy - 40, 32, 0, Math.PI * 2);
  c.fill();
  // Anime hair strands silhouette
  c.beginPath();
  c.moveTo(cx - 36, cy - 50);
  c.quadraticCurveTo(cx, cy - 80, cx + 36, cy - 50);
  c.quadraticCurveTo(cx + 25, cy - 15, cx, cy - 15);
  c.quadraticCurveTo(cx - 25, cy - 15, cx - 36, cy - 50);
  c.fill();
  // Body shoulders
  c.beginPath();
  c.ellipse(cx, cy + 20, 50, 30, 0, 0, Math.PI * 2);
  c.fill();

  // Floating Animated Sakura Petals
  for (let i = 0; i < 12; i++) {
    const px = (cx + Math.sin(t * 1.2 + i * 2) * 90 + i * 15) % w;
    const py = (cy - 100 + (t * 40 + i * 28)) % h;
    const rot = t * 2 + i;
    c.save();
    c.translate(px, py);
    c.rotate(rot);
    c.fillStyle = '#fbcfe8';
    c.beginPath();
    c.ellipse(0, 0, 6, 3, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  // Japanese Visual Novel Dialogue Box
  const boxX = 20;
  const boxY = cy + 45;
  const boxW = w - 40;
  const boxH = 95;

  c.fillStyle = 'rgba(15, 23, 42, 0.88)';
  c.strokeStyle = '#f472b6';
  c.lineWidth = 1.5;
  c.beginPath();
  c.roundRect(boxX, boxY, boxW, boxH, 12);
  c.fill();
  c.stroke();

  // Character Nameplate Tag
  c.fillStyle = '#be185d';
  c.beginPath();
  c.roundRect(boxX + 12, boxY - 10, 70, 20, 6);
  c.fill();
  c.fillStyle = '#ffffff';
  c.font = 'bold 10px sans-serif';
  c.textAlign = 'center';
  c.fillText('Akane • 朱音', boxX + 47, boxY + 4);

  // Typewriter Text
  c.fillStyle = '#fdf2f8';
  c.font = 'bold 10.5px sans-serif';
  c.textAlign = 'left';
  c.fillText('“Waktu itu... semuanya berubah saat kamu datang.”', boxX + 16, boxY + 28);
  c.fillStyle = '#f472b6';
  c.font = 'bold 9px monospace';
  c.fillText('[ Klik untuk melanjutkan rute cerita ]', boxX + 16, boxY + 52);

  // Blinking Prompt Triangle
  const blink = Math.sin(t * 8) > 0;
  if (blink) {
    c.fillStyle = '#f472b6';
    c.beginPath();
    c.moveTo(boxX + boxW - 22, boxY + boxH - 18);
    c.lineTo(boxX + boxW - 14, boxY + boxH - 18);
    c.lineTo(boxX + boxW - 18, boxY + boxH - 12);
    c.fill();
  }
}

// =======================================================================
// 20. LINE ART DRAMA (Continuous Expressive Line Art)
// =======================================================================
export function renderLineArtDrama(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Warm off-white paper canvas
  c.fillStyle = '#fbf8f3';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 10;

  // Soft organic color washes
  c.fillStyle = 'rgba(254, 215, 170, 0.45)';
  c.beginPath();
  c.ellipse(cx - 35, cy - 20, 65, 75, 0.2, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = 'rgba(254, 205, 211, 0.4)';
  c.beginPath();
  c.ellipse(cx + 40, cy + 25, 55, 65, -0.3, 0, Math.PI * 2);
  c.fill();

  // Continuous contour line of human profile
  c.strokeStyle = '#18181b';
  c.lineWidth = 2.5;
  c.lineCap = 'round';
  c.lineJoin = 'round';

  const sway = Math.sin(t * 1.5) * 4;
  c.beginPath();
  c.moveTo(cx - 50, cy + 70);
  c.bezierCurveTo(cx - 55, cy + 20, cx - 40, cy - 30, cx - 15, cy - 50);
  c.bezierCurveTo(cx + 10, cy - 65, cx + 45, cy - 45, cx + 40, cy - 20);
  c.bezierCurveTo(cx + 35, cy - 5, cx + 15, cy + 5, cx + 10, cy + 20 + sway);
  c.bezierCurveTo(cx + 5, cy + 40, cx + 25, cy + 50, cx + 35, cy + 70);
  c.stroke();

  // Expressive eye
  c.beginPath();
  c.ellipse(cx - 10, cy - 25, 6, 3, 0.1, 0, Math.PI * 2);
  c.stroke();
  c.fillStyle = '#18181b';
  c.beginPath();
  c.arc(cx - 10, cy - 25, 2.5, 0, Math.PI * 2);
  c.fill();

  // Red String of Fate weaving through
  c.strokeStyle = '#dc2626';
  c.lineWidth = 2;
  c.setLineDash([4, 3]);
  c.beginPath();
  c.moveTo(20, cy + 60);
  c.quadraticCurveTo(cx - 30, cy - 80 + Math.sin(t * 2) * 10, cx - 10, cy - 25);
  c.quadraticCurveTo(cx + 30, cy + 40, w - 20, cy - 30);
  c.stroke();
  c.setLineDash([]);

  // Fate Knot
  c.fillStyle = '#dc2626';
  c.beginPath();
  c.arc(cx - 10, cy - 25, 5, 0, Math.PI * 2);
  c.fill();

  // Bottom Label Badge
  c.fillStyle = '#18181b';
  c.beginPath();
  c.roundRect(cx - 75, cy + 90, 150, 24, 6);
  c.fill();
  c.fillStyle = '#fafaf9';
  c.font = 'bold 9.5px sans-serif';
  c.textAlign = 'center';
  c.fillText('LINE ART DRAMA • RAW EMOTION', cx, cy + 105);
}

// =======================================================================
// 21. SILUET MISTERI (Noir Streetlight & Shadow)
// =======================================================================
export function renderSiluetMisteri(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Midnight Noir Teal-Black Mist
  const bg = c.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#040d1a');
  bg.addColorStop(0.65, '#091e2f');
  bg.addColorStop(1, '#020617');
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 10;

  // Streetlamp Pole on Left
  const lampX = 45;
  const lampY = cy - 80;

  c.strokeStyle = '#334155';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(lampX, cy + 70);
  c.lineTo(lampX, lampY);
  c.stroke();

  // Streetlamp Head
  c.fillStyle = '#1e293b';
  c.fillRect(lampX - 10, lampY - 14, 20, 14);

  // Warm Amber Light Cone shining through fog
  const coneGrad = c.createRadialGradient(lampX, lampY, 5, lampX + 60, cy + 40, 140);
  coneGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
  coneGrad.addColorStop(0.5, 'rgba(254, 240, 138, 0.15)');
  coneGrad.addColorStop(1, 'transparent');
  c.fillStyle = coneGrad;
  c.beginPath();
  c.moveTo(lampX, lampY);
  c.lineTo(10, cy + 70);
  c.lineTo(w - 20, cy + 70);
  c.closePath();
  c.fill();

  // Lamp Bulb Halo
  c.fillStyle = '#fef08a';
  c.beginPath();
  c.arc(lampX, lampY + 4, 7, 0, Math.PI * 2);
  c.fill();

  // Detective Silhouette stepping forward
  const detX = cx + 20 + Math.sin(t * 1.2) * 5;
  const detY = cy + 15;

  // Detective Shadow elongated onto pavement
  c.fillStyle = '#020617';
  c.beginPath();
  c.moveTo(detX - 12, cy + 68);
  c.lineTo(detX + 12, cy + 68);
  c.lineTo(w - 15, cy + 75);
  c.lineTo(detX + 40, cy + 75);
  c.fill();

  // Detective Body & Fedora Hat Silhouette
  // Fedora
  c.fillStyle = '#020617';
  c.beginPath();
  c.ellipse(detX, detY - 32, 14, 4, 0, 0, Math.PI * 2);
  c.fill();
  c.fillRect(detX - 9, detY - 40, 18, 9);
  // Head
  c.beginPath();
  c.arc(detX, detY - 26, 9, 0, Math.PI * 2);
  c.fill();
  // Trenchcoat Torso
  c.beginPath();
  c.moveTo(detX - 14, detY - 16);
  c.lineTo(detX + 14, detY - 16);
  c.lineTo(detX + 22, detY + 48);
  c.lineTo(detX - 22, detY + 48);
  c.closePath();
  c.fill();

  // Mist Particles
  for (let i = 0; i < 14; i++) {
    const px = (i * 24 + t * 15) % w;
    const py = cy + 20 + Math.sin(t * 2 + i) * 15;
    c.fillStyle = 'rgba(255, 255, 255, 0.08)';
    c.beginPath();
    c.arc(px, py, 12, 0, Math.PI * 2);
    c.fill();
  }

  // Top Noir Badge
  c.fillStyle = 'rgba(15, 23, 42, 0.9)';
  c.strokeStyle = '#334155';
  c.lineWidth = 1;
  c.beginPath();
  c.roundRect(cx - 70, cy + 85, 140, 24, 6);
  c.fill();
  c.stroke();
  c.fillStyle = '#facc15';
  c.font = 'bold 9.5px monospace';
  c.textAlign = 'center';
  c.fillText('NOIR SHADOW • CHAPTER 0' + (chapterIdx + 1), cx, cy + 100);
}

// =======================================================================
// 22. CHIBI ADVENTURE (Kawaii Big Head Adventure)
// =======================================================================
export function renderChibiAdventure(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Pastel Lilac Sky
  c.fillStyle = '#fdf4ff';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 10;

  // Rolling Candy Hills
  c.fillStyle = '#86efac';
  c.beginPath();
  c.ellipse(cx - 70, cy + 85, 110, 40, 0, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = '#4ade80';
  c.beginPath();
  c.ellipse(cx + 60, cy + 90, 120, 45, 0, 0, Math.PI * 2);
  c.fill();

  // Chibi Bobbing Animation
  const bobY = Math.abs(Math.sin(t * 5)) * -14;
  const heroX = cx - 15;
  const heroY = cy + 10 + bobY;

  // Cute Chibi Head (Oversized)
  c.fillStyle = '#fef08a';
  c.strokeStyle = '#d97706';
  c.lineWidth = 2.5;
  c.beginPath();
  c.arc(heroX, heroY - 25, 28, 0, Math.PI * 2);
  c.fill();
  c.stroke();

  // Big Shiny Anime Eyes
  const eyeOffset = Math.sin(t * 3) * 1.5;
  // Left eye
  c.fillStyle = '#1e1b4b';
  c.beginPath();
  c.ellipse(heroX - 11 + eyeOffset, heroY - 26, 5, 8, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.arc(heroX - 10 + eyeOffset, heroY - 29, 2.5, 0, Math.PI * 2);
  c.fill();
  // Right eye
  c.fillStyle = '#1e1b4b';
  c.beginPath();
  c.ellipse(heroX + 11 + eyeOffset, heroY - 26, 5, 8, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.arc(heroX + 12 + eyeOffset, heroY - 29, 2.5, 0, Math.PI * 2);
  c.fill();

  // Pink Blush Cheeks
  c.fillStyle = 'rgba(244, 63, 94, 0.55)';
  c.beginPath();
  c.ellipse(heroX - 18, heroY - 17, 5, 3, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(heroX + 18, heroY - 17, 5, 3, 0, 0, Math.PI * 2);
  c.fill();

  // Cute Smile
  c.strokeStyle = '#d97706';
  c.lineWidth = 2;
  c.beginPath();
  c.arc(heroX, heroY - 18, 5, 0.2, Math.PI - 0.2);
  c.stroke();

  // Tiny Hero Body & Wooden Sword
  c.fillStyle = '#3b82f6';
  c.beginPath();
  c.roundRect(heroX - 10, heroY + 2, 20, 22, 6);
  c.fill();

  // Swinging Sword
  c.save();
  c.translate(heroX + 14, heroY + 12);
  c.rotate(Math.sin(t * 6) * 0.4 - 0.3);
  c.fillStyle = '#b45309';
  c.fillRect(0, -3, 22, 6);
  c.restore();

  // Tiny Bouncing Slime Monster on Right
  const slimeBob = Math.abs(Math.sin(t * 6 + 1)) * -18;
  const slimeX = cx + 65;
  const slimeY = cy + 42 + slimeBob;

  c.fillStyle = '#10b981';
  c.beginPath();
  c.ellipse(slimeX, slimeY, 16, 12, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#064e3b';
  c.beginPath();
  c.arc(slimeX - 5, slimeY - 3, 2, 0, Math.PI * 2);
  c.arc(slimeX + 5, slimeY - 3, 2, 0, Math.PI * 2);
  c.fill();

  // Floating Kinetic Dots
  for (let i = 0; i < 6; i++) {
    const sx = (cx - 70 + i * 28 + t * 15) % w;
    const sy = cy - 70 + Math.sin(t * 3 + i) * 12;
    c.fillStyle = i % 2 === 0 ? '#facc15' : '#f472b6';
    c.beginPath();
    c.arc(sx, sy, 3, 0, Math.PI * 2);
    c.fill();
  }

  // Bottom Pill
  c.fillStyle = '#c084fc';
  c.beginPath();
  c.roundRect(cx - 70, cy + 85, 140, 24, 12);
  c.fill();
  c.fillStyle = '#ffffff';
  c.font = 'bold 9.5px sans-serif';
  c.textAlign = 'center';
  c.fillText('★ CHIBI HERO LEVEL UP! ★', cx, cy + 100);
}

// =======================================================================
// 23. SKETCHBOOK STORY (Spiral Notebook & Graphite Pencil)
// =======================================================================
export function renderSketchbookStory(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Rough cream sketchbook paper
  c.fillStyle = '#fdfbf7';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 10;

  // Spiral Binder Rings on Left Margin
  c.fillStyle = '#f5f0e8';
  c.fillRect(0, 0, 36, h);
  c.strokeStyle = '#e7dfd5';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(36, 0); c.lineTo(36, h);
  c.stroke();

  for (let y = 30; y < h - 20; y += 35) {
    c.fillStyle = '#cbd5e1';
    c.strokeStyle = '#94a3b8';
    c.lineWidth = 1.5;
    c.beginPath();
    c.roundRect(8, y - 6, 20, 12, 6);
    c.fill();
    c.stroke();
    c.fillStyle = '#475569';
    c.beginPath();
    c.arc(18, y, 3, 0, Math.PI * 2);
    c.fill();
  }

  // Live Hatching Isometric Cube Drawing
  c.save();
  c.translate(cx + 10, cy - 20);

  // Outline
  c.strokeStyle = '#334155';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(0, -35); c.lineTo(40, -15); c.lineTo(0, 5); c.lineTo(-40, -15); c.closePath();
  c.stroke();

  c.beginPath();
  c.moveTo(-40, -15); c.lineTo(0, 5); c.lineTo(0, 45); c.lineTo(-40, 25); c.closePath();
  c.stroke();

  c.beginPath();
  c.moveTo(0, 5); c.lineTo(40, -15); c.lineTo(40, 25); c.lineTo(0, 45); c.closePath();
  c.stroke();

  // Crosshatching Shading on right face
  c.strokeStyle = '#64748b';
  c.lineWidth = 1.2;
  const hatchLines = Math.floor(prog * 10);
  for (let i = 0; i <= hatchLines; i++) {
    const yOff = -10 + i * 5;
    c.beginPath();
    c.moveTo(5, yOff + 8);
    c.lineTo(35, yOff - 5);
    c.stroke();
  }
  c.restore();

  // Yellow HB Pencil Actively Sketching
  const pencilX = cx + 25 + Math.sin(t * 8) * 8;
  const pencilY = cy - 25 + Math.cos(t * 8) * 6;

  c.save();
  c.translate(pencilX, pencilY);
  c.rotate(0.6);
  // Pencil Body
  c.fillStyle = '#facc15';
  c.fillRect(0, -5, 55, 10);
  // Wood Cone Tip
  c.fillStyle = '#fde68a';
  c.beginPath();
  c.moveTo(0, -5); c.lineTo(-14, 0); c.lineTo(0, 5); c.closePath();
  c.fill();
  // Graphite Lead
  c.fillStyle = '#334155';
  c.beginPath();
  c.moveTo(-6, -2); c.lineTo(-14, 0); c.lineTo(-6, 2); c.closePath();
  c.fill();
  // Pink Eraser Back
  c.fillStyle = '#f43f5e';
  c.fillRect(48, -5, 10, 10);
  c.restore();

  // Bottom Sketch Label
  c.fillStyle = '#475569';
  c.font = 'bold 10px monospace';
  c.textAlign = 'center';
  c.fillText('2B GRAPHITE • LIVE SKETCHING', cx + 10, cy + 95);
}

// =======================================================================
// 24. BOARDGAME QUEST (Isometric Hex Map & Meeple Token)
// =======================================================================
export function renderBoardgameQuest(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Rich Forest Green Tabletop
  c.fillStyle = '#14532d';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 10;

  // Hexagon Drawing Helper
  const drawHex = (hx: number, hy: number, size: number, fill: string, stroke: string) => {
    c.fillStyle = fill;
    c.strokeStyle = stroke;
    c.lineWidth = 2.5;
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = hx + size * Math.cos(angle);
      const y = hy + size * Math.sin(angle);
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.closePath();
    c.fill();
    c.stroke();
  };

  // 3 Isometric Hex Tiles
  drawHex(cx - 38, cy - 25, 34, '#22c55e', '#16a34a'); // Meadow
  drawHex(cx + 38, cy - 25, 34, '#eab308', '#ca8a04'); // Desert Path
  drawHex(cx, cy + 35, 34, '#0284c7', '#0369a1');      // Ocean Castle

  // Red Wooden Meeple Token Hopping
  const meepleHop = Math.abs(Math.sin(t * 4)) * -22;
  const meepleX = cx + Math.sin(t * 2) * 25;
  const meepleY = cy + 10 + meepleHop;

  // Meeple Head
  c.fillStyle = '#ef4444';
  c.strokeStyle = '#b91c1c';
  c.lineWidth = 1.5;
  c.beginPath();
  c.arc(meepleX, meepleY - 14, 7, 0, Math.PI * 2);
  c.fill();
  c.stroke();

  // Meeple Torso & Legs
  c.beginPath();
  c.moveTo(meepleX - 8, meepleY - 8);
  c.lineTo(meepleX + 8, meepleY - 8);
  c.lineTo(meepleX + 14, meepleY + 12);
  c.lineTo(meepleX + 5, meepleY + 12);
  c.lineTo(meepleX, meepleY + 2);
  c.lineTo(meepleX - 5, meepleY + 12);
  c.lineTo(meepleX - 14, meepleY + 12);
  c.closePath();
  c.fill();
  c.stroke();

  // 3D Rolling White Dice on Top Right
  c.save();
  c.translate(cx + 65, cy - 65);
  c.rotate(t * 1.5);
  c.fillStyle = '#ffffff';
  c.strokeStyle = '#cbd5e1';
  c.lineWidth = 2;
  c.beginPath();
  c.roundRect(-14, -14, 28, 28, 6);
  c.fill();
  c.stroke();
  // Red Pips
  c.fillStyle = '#ef4444';
  c.beginPath();
  c.arc(0, 0, 3, 0, Math.PI * 2);
  c.arc(-7, -7, 2.5, 0, Math.PI * 2);
  c.arc(7, 7, 2.5, 0, Math.PI * 2);
  c.fill();
  c.restore();

  // Banner
  c.fillStyle = '#0f172a';
  c.beginPath();
  c.roundRect(cx - 75, cy + 90, 150, 24, 6);
  c.fill();
  c.fillStyle = '#facc15';
  c.font = 'bold 9.5px sans-serif';
  c.textAlign = 'center';
  c.fillText('BOARDGAME QUEST • ROLL 6!', cx, cy + 105);
}

// =======================================================================
// 25. BOUNCE CARTOON (Rubberhose Squash & Stretch Ball)
// =======================================================================
export function renderBounceCartoon(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Bright warm yellow cartoon background
  c.fillStyle = '#fffbeb';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 10;
  const floorY = cy + 55;

  // Ground Baseline
  c.strokeStyle = '#ca8a04';
  c.lineWidth = 2.5;
  c.setLineDash([5, 3]);
  c.beginPath();
  c.moveTo(20, floorY); c.lineTo(w - 20, floorY);
  c.stroke();
  c.setLineDash([]);

  // Physics Squash and Stretch Ball Loop
  const bouncePhase = (t * 3.5) % Math.PI;
  const heightFactor = Math.sin(bouncePhase);
  const ballY = floorY - 24 - heightFactor * 85;

  let rx = 24;
  let ry = 24;
  if (heightFactor < 0.15) {
    // SQUASH on ground impact
    rx = 36;
    ry = 14;
  } else if (heightFactor < 0.6) {
    // STRETCH while flying fast
    rx = 18;
    ry = 32;
  }

  // Dust Puff Clouds on Impact
  if (heightFactor < 0.2) {
    c.fillStyle = '#fef08a';
    c.beginPath();
    c.arc(cx - 35, floorY - 5, 8, 0, Math.PI * 2);
    c.arc(cx + 35, floorY - 5, 8, 0, Math.PI * 2);
    c.fill();
  }

  // Bouncing Cartoon Red Ball
  c.fillStyle = '#ef4444';
  c.strokeStyle = '#991b1b';
  c.lineWidth = 2.5;
  c.beginPath();
  c.ellipse(cx, ballY, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();

  // Cartoon Eyes with Pupil Look
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.ellipse(cx - 6, ballY - 4, 4.5, 7, 0, 0, Math.PI * 2);
  c.ellipse(cx + 6, ballY - 4, 4.5, 7, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#18181b';
  c.beginPath();
  c.arc(cx - 5, ballY - 4, 2.5, 0, Math.PI * 2);
  c.arc(cx + 7, ballY - 4, 2.5, 0, Math.PI * 2);
  c.fill();

  // Big Bold BOING! Impact Sound Text
  c.fillStyle = '#ea580c';
  c.font = '900 18px Impact, sans-serif';
  c.textAlign = 'center';
  c.fillText('BOING!!', cx, cy - 70);

  // Bottom Pill
  c.fillStyle = '#ea580c';
  c.beginPath();
  c.roundRect(cx - 75, cy + 85, 150, 24, 12);
  c.fill();
  c.fillStyle = '#ffffff';
  c.font = 'bold 9.5px sans-serif';
  c.fillText('SQUASH & STRETCH 60 FPS', cx, cy + 100);
}

// =======================================================================
// 26. HYPER ZOOM (Speed Lines Tunnel & Comic Zoom)
// =======================================================================
export function renderHyperZoom(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Midnight Deep Dark
  c.fillStyle = '#050508';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 10;

  // Converging Speedlines Rushing into Center
  c.save();
  c.translate(cx, cy);

  for (let i = 0; i < 28; i++) {
    const angle = (i / 28) * Math.PI * 2 + t * 0.4;
    const len = 60 + Math.sin(t * 10 + i) * 35;
    const outerR = 150;
    c.strokeStyle = i % 2 === 0 ? '#38bdf8' : '#f43f5e';
    c.lineWidth = (i % 3 === 0 ? 2.5 : 1) * Math.max(0.5, Math.sin(t * 4 + i));
    c.beginPath();
    c.moveTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
    c.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
    c.stroke();
  }

  // Expanding Perspective Tunnel Rings
  for (let r = 0; r < 4; r++) {
    const radius = ((t * 80 + r * 45) % 150);
    c.strokeStyle = `rgba(250, 204, 21, ${1 - radius / 150})`;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(0, 0, radius, 0, Math.PI * 2);
    c.stroke();
  }

  // Center Warp Star
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.arc(0, 0, 7 + Math.sin(t * 12) * 3, 0, Math.PI * 2);
  c.fill();
  c.restore();

  // Dramatic Shonen Comic ZOOM Impact Banner
  c.save();
  c.translate(cx, cy);
  c.rotate(-0.1);
  c.fillStyle = '#ef4444';
  c.beginPath();
  c.roundRect(-85, -18, 170, 36, 6);
  c.fill();
  c.fillStyle = '#ffffff';
  c.font = '900 18px Impact, sans-serif';
  c.textAlign = 'center';
  c.fillText('HYPER ZOOM!', 0, 8);
  c.restore();

  // Bottom Badge
  c.fillStyle = '#1e293b';
  c.beginPath();
  c.roundRect(cx - 75, cy + 85, 150, 24, 6);
  c.fill();
  c.fillStyle = '#38bdf8';
  c.font = 'bold 9.5px monospace';
  c.textAlign = 'center';
  c.fillText('RADIAL SPEEDLINES • WARP', cx, cy + 100);
}

// =======================================================================
// 27. STICKER BOMB (Y2K Die-Cut Layered Vinyl Stickers)
// =======================================================================
export function renderStickerBomb(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Y2K Acid Purple Checkerboard
  c.fillStyle = '#a855f7';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 10;

  // Diagonal Shimmer Stripe
  const shimmerX = ((t * 120) % (w * 2)) - w * 0.5;
  c.fillStyle = 'rgba(255, 255, 255, 0.15)';
  c.beginPath();
  c.moveTo(shimmerX, 0);
  c.lineTo(shimmerX + 50, 0);
  c.lineTo(shimmerX - 30, h);
  c.lineTo(shimmerX - 80, h);
  c.fill();

  // Sticker 1: Holographic Star (Bottom-Left)
  c.save();
  c.translate(cx - 50, cy + 25);
  c.rotate(Math.sin(t * 1.5) * 0.1 - 0.2);
  c.fillStyle = '#ffffff';
  c.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const ai = a + Math.PI / 5;
    if (i === 0) c.moveTo(Math.cos(a) * 32, Math.sin(a) * 32);
    else c.lineTo(Math.cos(a) * 32, Math.sin(a) * 32);
    c.lineTo(Math.cos(ai) * 16, Math.sin(ai) * 16);
  }
  c.closePath();
  c.fill();

  c.fillStyle = '#06b6d4';
  c.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const ai = a + Math.PI / 5;
    if (i === 0) c.moveTo(Math.cos(a) * 26, Math.sin(a) * 26);
    else c.lineTo(Math.cos(a) * 26, Math.sin(a) * 26);
    c.lineTo(Math.cos(ai) * 12, Math.sin(ai) * 12);
  }
  c.closePath();
  c.fill();
  c.restore();

  // Sticker 2: Acid Smiley (Top-Right)
  c.save();
  c.translate(cx + 45, cy - 35);
  c.rotate(Math.cos(t * 1.5) * 0.1 + 0.15);
  // White border
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.arc(0, 0, 32, 0, Math.PI * 2);
  c.fill();
  // Yellow face
  c.fillStyle = '#facc15';
  c.beginPath();
  c.arc(0, 0, 28, 0, Math.PI * 2);
  c.fill();
  // Eyes & Smile
  c.fillStyle = '#000000';
  c.beginPath();
  c.ellipse(-10, -5, 3.5, 6, 0, 0, Math.PI * 2);
  c.ellipse(10, -5, 3.5, 6, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#000000';
  c.lineWidth = 3;
  c.lineCap = 'round';
  c.beginPath();
  c.arc(0, 5, 14, 0.2, Math.PI - 0.2);
  c.stroke();
  c.restore();

  // Sticker 3: Lightning Bolt (Center)
  c.save();
  c.translate(cx, cy);
  c.rotate(Math.sin(t * 2) * 0.08);
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.moveTo(5, -45); c.lineTo(-20, 5); c.lineTo(0, 5); c.lineTo(-12, 45); c.lineTo(24, -5); c.lineTo(5, -5); c.closePath();
  c.fill();
  c.fillStyle = '#ef4444';
  c.beginPath();
  c.moveTo(3, -40); c.lineTo(-16, 3); c.lineTo(0, 3); c.lineTo(-8, 38); c.lineTo(19, -3); c.lineTo(3, -3); c.closePath();
  c.fill();
  c.restore();

  // Bottom Banner
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.roundRect(cx - 75, cy + 85, 150, 24, 6);
  c.fill();
  c.fillStyle = '#18181b';
  c.font = '900 10px sans-serif';
  c.textAlign = 'center';
  c.fillText('★ STICKER BOMB Y2K ★', cx, cy + 100);
}

// =======================================================================
// 28. CONFETTI BLAST (Party Popper & Festive Streamers)
// =======================================================================
export function renderConfettiBlast(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Midnight Festive Indigo
  c.fillStyle = '#0f172a';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 10;

  // Party Popper Cannon at bottom-left
  c.save();
  c.translate(35, cy + 65);
  c.rotate(-0.6);
  c.fillStyle = '#facc15';
  c.strokeStyle = '#ca8a04';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-15, 0); c.lineTo(15, 0); c.lineTo(22, -35); c.lineTo(-22, -35); c.closePath();
  c.fill();
  c.stroke();
  c.restore();

  // Blast Halo
  c.fillStyle = 'rgba(253, 224, 71, 0.35)';
  c.beginPath();
  c.arc(55, cy + 40, 28, 0, Math.PI * 2);
  c.fill();

  // Swirling Streamer Ribbons
  c.strokeStyle = '#ec4899';
  c.lineWidth = 3.5;
  c.beginPath();
  c.moveTo(55, cy + 40);
  c.bezierCurveTo(90, cy - 20, 110, cy + 20, cx + 45, cy - 50 + Math.sin(t * 3) * 10);
  c.stroke();

  c.strokeStyle = '#06b6d4';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(55, cy + 40);
  c.bezierCurveTo(80, cy + 10, cx - 10, cy - 40, cx - 30, cy - 70 + Math.cos(t * 3) * 10);
  c.stroke();

  // Floating Confetti Pieces
  const colors = ['#facc15', '#3b82f6', '#ec4899', '#22c55e', '#a855f7', '#f97316'];
  for (let i = 0; i < 24; i++) {
    const px = (cx - 50 + i * 14 + Math.sin(t * 3 + i) * 30) % w;
    const py = (cy - 80 + ((t * 45 + i * 20) % (h * 0.9)));
    const rot = t * 4 + i;
    c.save();
    c.translate(px, py);
    c.rotate(rot);
    c.fillStyle = colors[i % colors.length];
    c.fillRect(-4, -4, 8, 8);
    c.restore();
  }

  // Bottom Pill
  c.fillStyle = '#eab308';
  c.beginPath();
  c.roundRect(cx - 75, cy + 85, 150, 24, 12);
  c.fill();
  c.fillStyle = '#18181b';
  c.font = '900 10px sans-serif';
  c.textAlign = 'center';
  c.fillText('🎉 CONFETTI CELEBRATION 🎉', cx, cy + 100);
}

// =======================================================================
// 29. CORPORATE CLEAN (SaaS Glassmorphic KPI Dashboard)
// =======================================================================
export function renderCorporateClean(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Ultra-clean light graphite slate background
  c.fillStyle = '#f8fafc';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 10;

  // Frosted Glass Dashboard Card
  const cardW = w - 44;
  const cardH = 160;
  const cardX = 22;
  const cardY = cy - 80;

  c.fillStyle = '#ffffff';
  c.strokeStyle = '#e2e8f0';
  c.lineWidth = 1.5;
  c.beginPath();
  c.roundRect(cardX, cardY, cardW, cardH, 16);
  c.fill();
  c.stroke();

  // Top Title & Green KPI Pill
  c.fillStyle = '#64748b';
  c.font = 'bold 9px sans-serif';
  c.textAlign = 'left';
  c.fillText('ANNUAL RECURRING REVENUE', cardX + 16, cardY + 24);

  c.fillStyle = '#dcfce7';
  c.beginPath();
  c.roundRect(cardX + cardW - 68, cardY + 12, 54, 18, 9);
  c.fill();
  c.fillStyle = '#15803d';
  c.font = 'bold 9px sans-serif';
  c.textAlign = 'center';
  c.fillText('+248% ARR', cardX + cardW - 41, cardY + 25);

  // Big Hero Metric
  c.fillStyle = '#0f172a';
  c.font = '900 24px sans-serif';
  c.textAlign = 'left';
  c.fillText('$1,420,800', cardX + 16, cardY + 54);

  // Smooth Area Sparkline Graph
  const chartX = cardX + 16;
  const chartY = cardY + 135;
  const chartW = cardW - 32;

  const points = [
    { x: 0, y: 35 },
    { x: 0.2, y: 28 },
    { x: 0.4, y: 32 },
    { x: 0.6, y: 15 },
    { x: 0.8, y: 20 },
    { x: 1.0, y: 5 },
  ];

  // Gradient area
  const areaGrad = c.createLinearGradient(0, chartY - 45, 0, chartY);
  areaGrad.addColorStop(0, 'rgba(37, 99, 235, 0.28)');
  areaGrad.addColorStop(1, 'transparent');
  c.fillStyle = areaGrad;
  c.beginPath();
  c.moveTo(chartX, chartY);
  points.forEach((p) => {
    c.lineTo(chartX + p.x * chartW, chartY - p.y);
  });
  c.lineTo(chartX + chartW, chartY);
  c.closePath();
  c.fill();

  // Line
  c.strokeStyle = '#2563eb';
  c.lineWidth = 2.5;
  c.lineCap = 'round';
  c.beginPath();
  points.forEach((p, idx) => {
    const px = chartX + p.x * chartW;
    const py = chartY - p.y;
    if (idx === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  });
  c.stroke();

  // Pulsing Live Indicator on Peak
  const peakX = chartX + chartW;
  const peakY = chartY - 5;
  c.fillStyle = '#2563eb';
  c.beginPath();
  c.arc(peakX, peakY, 4, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = 'rgba(37, 99, 235, 0.4)';
  c.lineWidth = 2;
  c.beginPath();
  c.arc(peakX, peakY, 7 + Math.sin(t * 6) * 3, 0, Math.PI * 2);
  c.stroke();

  // Bottom Pipeline Status
  c.fillStyle = '#1e3a8a';
  c.beginPath();
  c.roundRect(cx - 75, cy + 90, 150, 24, 6);
  c.fill();
  c.fillStyle = '#ffffff';
  c.font = 'bold 9.5px sans-serif';
  c.textAlign = 'center';
  c.fillText('ENTERPRISE GRADE METRICS', cx, cy + 105);
}

// =======================================================================
// 30. BOTANICAL PASTEL (Watercolor Monstera & Foliage)
// =======================================================================
export function renderBotanicalPastel(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Soft linen sage canvas
  c.fillStyle = '#f7fee7';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 10;

  // Warm Morning Sun Halo
  c.fillStyle = 'rgba(254, 240, 138, 0.65)';
  c.beginPath();
  c.arc(cx + 45, cy - 45, 36, 0, Math.PI * 2);
  c.fill();

  // Terracotta Ceramic Vase
  const vaseX = cx;
  const vaseY = cy + 45;
  c.fillStyle = '#ea580c';
  c.beginPath();
  c.moveTo(vaseX - 22, vaseY);
  c.lineTo(vaseX + 22, vaseY);
  c.lineTo(vaseX + 16, vaseY + 36);
  c.lineTo(vaseX - 16, vaseY + 36);
  c.closePath();
  c.fill();

  // Large Monstera Leaf swaying in breeze
  const sway = Math.sin(t * 1.5) * 0.08;
  c.save();
  c.translate(vaseX, vaseY);
  c.rotate(sway - 0.2);

  c.fillStyle = '#65a30d';
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(-35, -50, -10, -90);
  c.quadraticCurveTo(25, -60, 0, 0);
  c.fill();

  // Monstera leaf slits
  c.strokeStyle = '#f7fee7';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-12, -40); c.lineTo(-24, -48);
  c.moveTo(-8, -60); c.lineTo(-18, -68);
  c.moveTo(8, -45); c.lineTo(18, -52);
  c.stroke();
  c.restore();

  // Eucalyptus Branch on Right
  c.save();
  c.translate(vaseX + 5, vaseY);
  c.rotate(-sway + 0.35);
  c.strokeStyle = '#365314';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(25, -45, 35, -75);
  c.stroke();

  // Eucalyptus rounded leaves
  c.fillStyle = '#a3e635';
  for (let i = 1; i <= 4; i++) {
    const ly = -i * 18;
    c.beginPath();
    c.ellipse(12, ly, 8, 5, 0.4, 0, Math.PI * 2);
    c.ellipse(-8, ly - 5, 8, 5, -0.4, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();

  // Bottom Label
  c.fillStyle = '#365314';
  c.beginPath();
  c.roundRect(cx - 75, cy + 90, 150, 24, 12);
  c.fill();
  c.fillStyle = '#ffffff';
  c.font = 'bold 9.5px sans-serif';
  c.textAlign = 'center';
  c.fillText('🌿 BOTANICAL PASTEL CALM 🌿', cx, cy + 105);
}

// =======================================================================
// 31. ZEN ORIGAMI (Crisp 3D Origami Crane)
// =======================================================================
export function renderZenPaper(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Washi paper warm off-white
  c.fillStyle = '#fafaf9';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 10;

  // Japanese Ensō Circle of Brush Harmony
  c.strokeStyle = 'rgba(239, 68, 68, 0.25)';
  c.lineWidth = 14;
  c.beginPath();
  c.arc(cx, cy - 20, 48, -Math.PI * 0.8, Math.PI * 0.9);
  c.stroke();

  // Crisp Origami Crane Rotating with Shadows
  c.save();
  c.translate(cx, cy - 20);
  c.rotate(Math.sin(t * 1.2) * 0.1);

  // Cast Shadow
  c.fillStyle = 'rgba(120, 113, 108, 0.2)';
  c.beginPath();
  c.ellipse(0, 55, 35, 12, 0, 0, Math.PI * 2);
  c.fill();

  // Center Body Facet
  c.fillStyle = '#ffffff';
  c.strokeStyle = '#d6d3d1';
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(0, -32); c.lineTo(-18, 12); c.lineTo(18, 12); c.closePath();
  c.fill();
  c.stroke();

  // Left Wing (Shaded Facet)
  c.fillStyle = '#e7e5e4';
  c.beginPath();
  c.moveTo(0, -32); c.lineTo(-58, -15); c.lineTo(-18, 12); c.closePath();
  c.fill();
  c.stroke();

  // Right Wing (Bright Facet)
  c.fillStyle = '#f5f5f4';
  c.beginPath();
  c.moveTo(0, -32); c.lineTo(58, -15); c.lineTo(18, 12); c.closePath();
  c.fill();
  c.stroke();

  // Crane Neck & Red Crown
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.moveTo(0, -32); c.lineTo(-8, -55); c.lineTo(-14, -62); c.lineTo(-10, -50); c.closePath();
  c.fill();
  c.stroke();

  c.fillStyle = '#ef4444';
  c.beginPath();
  c.moveTo(-8, -55); c.lineTo(-14, -62); c.lineTo(-12, -58); c.closePath();
  c.fill();

  // Crane Tail
  c.fillStyle = '#d6d3d1';
  c.beginPath();
  c.moveTo(0, 12); c.lineTo(0, 42); c.lineTo(-6, 22); c.closePath();
  c.fill();
  c.restore();

  // Bottom Label
  c.fillStyle = '#78716c';
  c.beginPath();
  c.roundRect(cx - 75, cy + 90, 150, 24, 6);
  c.fill();
  c.fillStyle = '#ffffff';
  c.font = 'bold 9.5px sans-serif';
  c.textAlign = 'center';
  c.fillText('ZEN ORIGAMI • CRANE HARMONY', cx, cy + 105);
}

// =======================================================================
// 32. LO-FI CHILL (Rainy Window & Steaming Mug)
// =======================================================================
export function renderLofiChill(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Midnight Cozy Indigo-Purple Gradient
  const bg = c.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#1e1b4b');
  bg.addColorStop(0.6, '#312e81');
  bg.addColorStop(1, '#1e1b4b');
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 10;

  // Window Pane Frame on Left
  const winX = 25;
  const winY = cy - 85;
  const winW = 85;
  const winH = 95;

  c.fillStyle = '#0f172a';
  c.fillRect(winX, winY, winW, winH);

  // Rain Drops trickling down
  for (let i = 0; i < 18; i++) {
    const rx = winX + 8 + (i * 12) % (winW - 16);
    const ry = winY + ((t * 50 + i * 22) % (winH - 10));
    c.strokeStyle = '#38bdf8';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(rx, ry);
    c.lineTo(rx - 2, ry + 10);
    c.stroke();
  }

  // Window wooden frame panes
  c.strokeStyle = '#475569';
  c.lineWidth = 3;
  c.strokeRect(winX, winY, winW, winH);
  c.beginPath();
  c.moveTo(winX + winW / 2, winY); c.lineTo(winX + winW / 2, winY + winH);
  c.moveTo(winX, winY + winH / 2); c.lineTo(winX + winW, winY + winH / 2);
  c.stroke();

  // Cozy Desk Surface
  c.fillStyle = '#451a03';
  c.fillRect(0, cy + 20, w, h - (cy + 20));
  c.fillStyle = '#78350f';
  c.fillRect(0, cy + 20, w, 3);

  // Warm Desk Lamp Amber Glow
  const lampGlow = c.createRadialGradient(cx + 45, cy - 30, 5, cx + 45, cy - 30, 85);
  lampGlow.addColorStop(0, 'rgba(253, 224, 71, 0.45)');
  lampGlow.addColorStop(1, 'transparent');
  c.fillStyle = lampGlow;
  c.fillRect(0, 0, w, h);

  // Steaming Ceramic Coffee Mug
  const mugX = cx + 20;
  const mugY = cy + 30;

  c.fillStyle = '#f8fafc';
  c.beginPath();
  c.roundRect(mugX - 12, mugY - 8, 24, 28, 4);
  c.fill();
  // Handle
  c.strokeStyle = '#f8fafc';
  c.lineWidth = 3;
  c.beginPath();
  c.arc(mugX + 13, mugY + 6, 6, -Math.PI / 2, Math.PI / 2);
  c.stroke();

  // Animated Coffee Steam Wisps
  c.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  c.lineWidth = 1.8;
  c.lineCap = 'round';
  for (let i = 0; i < 2; i++) {
    const sx = mugX - 4 + i * 8;
    const sy = mugY - 12;
    c.beginPath();
    c.moveTo(sx, sy);
    c.quadraticCurveTo(sx + Math.sin(t * 3 + i) * 6, sy - 14, sx, sy - 28);
    c.stroke();
  }

  // Bottom Pill
  c.fillStyle = '#4338ca';
  c.beginPath();
  c.roundRect(cx - 75, cy + 85, 150, 24, 12);
  c.fill();
  c.fillStyle = '#ffffff';
  c.font = 'bold 9.5px sans-serif';
  c.textAlign = 'center';
  c.fillText('☕ LO-FI STUDY BEATS ☕', cx, cy + 100);
}

// =======================================================================
// 33. SOFT GLOW (Ambient Aurora Glow Halo)
// =======================================================================
export function renderSoftGlow(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Midnight Space Base
  c.fillStyle = '#090a10';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 10;

  // Breathing Radial Aurora Spheres
  const pulse = Math.sin(t * 1.5) * 15;

  // Violet Orb
  const g1 = c.createRadialGradient(cx - 30, cy - 25, 10, cx - 30, cy - 25, 90 + pulse);
  g1.addColorStop(0, 'rgba(192, 132, 252, 0.7)');
  g1.addColorStop(1, 'transparent');
  c.fillStyle = g1;
  c.fillRect(0, 0, w, h);

  // Cyan Orb
  const g2 = c.createRadialGradient(cx + 35, cy + 20, 10, cx + 35, cy + 20, 85 - pulse);
  g2.addColorStop(0, 'rgba(56, 189, 248, 0.7)');
  g2.addColorStop(1, 'transparent');
  c.fillStyle = g2;
  c.fillRect(0, 0, w, h);

  // Peach Center Orb
  const g3 = c.createRadialGradient(cx, cy, 5, cx, cy, 50);
  g3.addColorStop(0, 'rgba(251, 113, 133, 0.85)');
  g3.addColorStop(1, 'transparent');
  c.fillStyle = g3;
  c.fillRect(0, 0, w, h);

  // Floating Luminous Bokeh Spheres
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + t * 0.4;
    const r = 45 + Math.sin(t * 2 + i) * 15;
    const bx = cx + Math.cos(a) * r;
    const by = cy + Math.sin(a) * r;
    c.fillStyle = 'rgba(255, 255, 255, 0.25)';
    c.beginPath();
    c.arc(bx, by, 7, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255, 255, 255, 0.85)';
    c.beginPath();
    c.arc(bx, by, 2, 0, Math.PI * 2);
    c.fill();
  }

  // Frosted Glass Pill
  c.fillStyle = 'rgba(255, 255, 255, 0.12)';
  c.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  c.lineWidth = 1.2;
  c.beginPath();
  c.roundRect(cx - 75, cy + 85, 150, 24, 12);
  c.fill();
  c.stroke();
  c.fillStyle = '#ffffff';
  c.font = 'bold 9.5px sans-serif';
  c.textAlign = 'center';
  c.fillText('AMBIENT GLOW LUMINESCENCE', cx, cy + 100);
}

// =======================================================================
// 34. CYBER HUD (Tactical Hologram Target Reticle)
// =======================================================================
export function renderCyberHud(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Sci-fi Tactical Midnight Blue
  c.fillStyle = '#020817';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 10;

  // Background Tactical Grid Lines
  c.strokeStyle = 'rgba(14, 165, 233, 0.2)';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(cx, 20); c.lineTo(cx, h - 20);
  c.moveTo(20, cy); c.lineTo(w - 20, cy);
  c.stroke();

  // Rotating Outer Azimuth Ring
  c.save();
  c.translate(cx, cy);
  c.rotate(t * 0.8);
  c.strokeStyle = '#0284c7';
  c.lineWidth = 1.5;
  c.setLineDash([8, 4]);
  c.beginPath();
  c.arc(0, 0, 75, 0, Math.PI * 2);
  c.stroke();
  c.setLineDash([]);
  c.restore();

  // Middle Reticle Ring
  c.strokeStyle = '#38bdf8';
  c.lineWidth = 2;
  c.beginPath();
  c.arc(cx, cy, 50, 0, Math.PI * 2);
  c.stroke();

  // Tactical Corner Brackets (Locking Reticle)
  const bracketSize = 25;
  const bracketDist = 38;
  c.strokeStyle = '#38bdf8';
  c.lineWidth = 3;

  // Top-left
  c.beginPath();
  c.moveTo(cx - bracketDist, cy - bracketDist + bracketSize);
  c.lineTo(cx - bracketDist, cy - bracketDist);
  c.lineTo(cx - bracketDist + bracketSize, cy - bracketDist);
  c.stroke();
  // Top-right
  c.beginPath();
  c.moveTo(cx + bracketDist, cy - bracketDist + bracketSize);
  c.lineTo(cx + bracketDist, cy - bracketDist);
  c.lineTo(cx + bracketDist - bracketSize, cy - bracketDist);
  c.stroke();
  // Bottom-left
  c.beginPath();
  c.moveTo(cx - bracketDist, cy + bracketDist - bracketSize);
  c.lineTo(cx - bracketDist, cy + bracketDist);
  c.lineTo(cx - bracketDist + bracketSize, cy + bracketDist);
  c.stroke();
  // Bottom-right
  c.beginPath();
  c.moveTo(cx + bracketDist, cy + bracketDist - bracketSize);
  c.lineTo(cx + bracketDist, cy + bracketDist);
  c.lineTo(cx + bracketDist - bracketSize, cy + bracketDist);
  c.stroke();

  // Red Pulsing Target Center
  c.fillStyle = '#ef4444';
  c.beginPath();
  c.arc(cx, cy, 4, 0, Math.PI * 2);
  c.fill();

  // Coordinates Display
  c.fillStyle = '#38bdf8';
  c.font = 'bold 9px monospace';
  c.textAlign = 'center';
  c.fillText('TARGET LOCK // AZIMUTH 042°', cx, cy - 90);

  // Bottom Status
  c.fillStyle = '#082f49';
  c.strokeStyle = '#0284c7';
  c.lineWidth = 1;
  c.beginPath();
  c.roundRect(cx - 75, cy + 85, 150, 24, 6);
  c.fill();
  c.stroke();
  c.fillStyle = '#38bdf8';
  c.fillText('SYSTEM READY • 60 FPS HUD', cx, cy + 100);
}

// =======================================================================
// 35. MATRIX CODE (Cascading Digital Green Rain Terminal)
// =======================================================================
export function renderMatrixCode(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  chapterIdx: number,
  prog: number
) {
  // Pure Pitch-Black Terminal
  c.fillStyle = '#000000';
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 - 10;

  // Cascading Matrix Characters Stream
  const columns = [
    { x: 30, chars: ['0', '1', '7', '9', 'X'], speed: 65 },
    { x: 55, chars: ['日', '本', '語', 'タ', 'ル', 'A'], speed: 85 },
    { x: 80, chars: ['1', '0', '1', '1', '0', 'Z'], speed: 70 },
    { x: 105, chars: ['シ', 'ス', 'テ', 'ム', '8'], speed: 95 },
    { x: 130, chars: ['M', 'A', 'T', 'R', 'I', 'X'], speed: 75 },
    { x: 155, chars: ['0', '1', '1', '0', '1', 'K'], speed: 90 },
    { x: 180, chars: ['デ', 'ー', 'タ', '流', '9'], speed: 80 },
    { x: 205, chars: ['1', '1', '0', '1', 'V'], speed: 68 },
    { x: 230, chars: ['Z', '7', '3', '0', 'X'], speed: 88 },
    { x: 255, chars: ['ネ', 'ッ', 'ト', 'ワ', 'ー', 'ク'], speed: 92 },
    { x: 280, chars: ['1', '0', '0', '1', 'B'], speed: 78 },
    { x: 305, chars: ['C', 'O', 'D', 'E', '7'], speed: 84 },
  ];

  c.font = 'bold 11px monospace';
  c.textAlign = 'center';

  columns.forEach((col, cIdx) => {
    const headY = ((t * col.speed + cIdx * 35) % (h + 80)) - 40;

    col.chars.forEach((char, rIdx) => {
      const charY = headY - rIdx * 18;
      if (charY > 10 && charY < h - 10) {
        if (rIdx === 0) {
          // Bright glowing leading character
          c.fillStyle = '#ffffff';
          c.shadowColor = '#22c55e';
          c.shadowBlur = 10;
          c.fillText(char, col.x, charY);
          c.shadowBlur = 0;
        } else if (rIdx < 3) {
          c.fillStyle = '#4ade80';
          c.fillText(char, col.x, charY);
        } else {
          c.fillStyle = '#15803d';
          c.fillText(char, col.x, charY);
        }
      }
    });
  });

  // CRT Scanline bar sweeping down
  const scanlineY = (t * 120) % h;
  c.fillStyle = 'rgba(34, 197, 94, 0.12)';
  c.fillRect(0, scanlineY, w, 8);

  // Bottom Terminal Badge
  c.fillStyle = '#052e16';
  c.strokeStyle = '#22c55e';
  c.lineWidth = 1;
  c.beginPath();
  c.roundRect(cx - 75, cy + 85, 150, 24, 6);
  c.fill();
  c.stroke();
  c.fillStyle = '#4ade80';
  c.font = 'bold 9.5px monospace';
  c.textAlign = 'center';
  c.fillText('CYBER MATRIX DIGITAL RAIN', cx, cy + 100);
}



import { type CustomStyleDefinition, type CustomStyleMetadata } from '../types/custom-style.ts';
export type { CustomStyleDefinition, CustomStyleMetadata };

export const SAMPLE_TACTILE_PAPERCRAFT_CODE = `// ===== GAYA =====
{
  "name": "Tactile Papercraft Lab",
  "prompt": "Gaya animasi edukasi papercraft & kolase guntingan kertas berlapis (shadow-box diorama) yang hangat, bersih, dan taktil: alas potong meja kerja hijau gelap (#1E2D29), kertas krem gading (#F7F1E3), kertas kraft cokelat (#D4B483), kertas origami koral (#E05A47), kertas toska (#2A8C82), kuning oker (#E9B44C), dan karton biru malam (#152238). Ciri khas wajib: setiap potongan kertas punya bayangan jatuh nyata (+6px, +8px gelap transparan), tepi organik tipis (wobble: 0.4-0.6), tepi sobekan bergerigi, garis lipatan putus-putus, dan selotip kertas (masking tape) miring di sudut kartu. Memainkan kamera virtual dinamis (workbench dolly push-in + rip shake, macro edge zoom-in, lateral shadowbox parallax 3 lapis, dan whip pull-out origami luar angkasa) dengan foley suara kertas autentik (paper_slide, paper_fold, paper_rip, paper_crumple, paper_snip, paper_pop, paper_slap). Seluruh HUD wajib rapi di area aman vertikal 9:16 (x: 175-545, y: 110-650).",
  "look": "2d",
  "finish": "craft",
  "colors": ["#F7F1E3", "#E05A47", "#E9B44C"],
  "mascot": "",
  "background": {
    "paper": { "top": "#23342F", "bottom": "#16211E", "pattern": "craft" },
    "dusk": { "top": "#2B3D47", "bottom": "#19242B", "pattern": "craft" },
    "night": { "top": "#1A2B47", "bottom": "#0E1729", "pattern": "craft" }
  }
}

// ===== SCENE 1 =====
// Durasi ideal: 4.2 detik
// Cerita: Kertas Rata Diberi Beban -> Melengkung & SOBEK TERBELAH!
// Kamera: Workbench Dolly Push-In ke tengah kertas + Rip Shake tajam saat kertas sobek
s.sfx("paper_slide", 0.12, 0.92, 1.0);      // SRUUUT! Selembar kertas krem masuk di atas balok
s.sfx("paper_slap", 1.05, 0.85, 0.92);      // PLAK! Pemberat jatuh ke tengah kertas
s.sfx("paper_crumple", 1.32, 0.78, 1.15);   // KRESEK! Kertas mulai melengkung menahan beban
s.sfx("paper_rip", 1.72, 1.0, 0.95);        // KRAAAK-SREEEKKK! Kertas sobek terbelah dua!
s.sfx("paper_crumple", 1.98, 0.72, 1.25);   // Serpihan robekan kertas berjatuhan
s.sfx("paper_slap", 2.45, 0.8, 1.08);       // Label kesimpulan menempel di kartu

const easeInOut = (p) => {
  const t = s.clamp(p, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const easeOut = (p) => 1 - Math.pow(1 - s.clamp(p, 0, 1), 3);
const hitDecay = (tHit, dur) => Math.max(0, 1 - s.at(tHit, dur)) * (s.t >= tHit ? 1 : 0);

// Fase animasi
const slideIn = easeOut(s.at(0.1, 0.65));
const weightDrop = easeOut(s.at(0.82, 0.28));
const bendP = easeInOut(s.at(1.08, 0.62));
const ripP = easeOut(s.at(1.72, 0.85));
const isRipped = s.t >= 1.72;

// --- VIRTUAL CAMERA RIG (DOLLY PUSH-IN -> RIP SHAKE) ---
const pushIn = easeInOut(s.at(0.65, 1.35));
const ripShake = hitDecay(1.72, 0.38) * 9.5 + hitDecay(1.05, 0.16) * 3.5;
const camZoom = s.lerp(0.96, 1.34, pushIn) - ripP * 0.14;
const camX = Math.sin(s.t * 86) * ripShake;
const camY = s.lerp(-8, 18, pushIn) + Math.cos(s.t * 78) * ripShake * 0.8;
const camRot = s.lerp(-0.025, 0.02, pushIn) + Math.sin(s.t * 60) * hitDecay(1.72, 0.25) * 0.025;

// --- WORLD LAYER (MEJA POTONG & UJI BEBAN KERTAS RATA) ---
s.group({ x: 360 - camX, y: 405 - camY, scale: camZoom, rotate: camRot }, () => {
  // Alas potong hijau gelap (cutting mat) + grid penggaris
  s.rect(-560, -560, 1120, 1120, { fill: "#1E2D29", stroke: "none", wobble: 0, hatch: false });
  for (let g = -8; g <= 8; g++) {
    s.line(g * 54, -520, g * 54, 520, { stroke: "#2D423D", width: 1, alpha: 0.48, wobble: 0 });
    s.line(-520, g * 54, 520, g * 54, { stroke: "#2D423D", width: 1, alpha: 0.48, wobble: 0 });
  }

  // 2 Balok Penyangga Kertas Kraft di Kiri & Kanan
  const drawSupport = (bx) => {
    s.rect(bx - 24, 56, 56, 112, { r: 3, fill: "#0D1513", stroke: "none", alpha: 0.34, wobble: 0.4, hatch: false });
    s.rect(bx - 30, 50, 56, 112, { r: 3, fill: "#C8A474", stroke: "#8F6E46", width: 1.8, wobble: 0.5, hatch: false });
    s.line(bx - 24, 62, bx + 20, 62, { stroke: "#E6CBA3", width: 2, alpha: 0.65, wobble: 0.3 });
  };
  drawSupport(-108);
  drawSupport(108);

  // KERTAS KREM RATA DI ATAS PENYANGGA (UTUH -> MELENGKUNG -> SOBEK DUA BAGIAN!)
  const paperEnterX = s.lerp(-280, 0, slideIn);
  s.group({ x: paperEnterX, y: 0 }, () => {
    if (!isRipped) {
      const sag = bendP * 38;
      // Bayangan kertas melengkung
      s.shape([
        [-126, 48], [0, 48 + sag], [126, 48],
        [126, 56], [0, 56 + sag], [-126, 56]
      ], { fill: "#0B1210", stroke: "none", alpha: 0.28, wobble: 0.4, hatch: false });
      // Lembar kertas rata tipis
      s.shape([
        [-130, 40], [0, 40 + sag], [130, 40],
        [130, 49], [0, 49 + sag], [-130, 49]
      ], { fill: "#F7F1E3", stroke: "#C9B99F", width: 1.8, wobble: 0.5, hatch: false });

      // Garis tegang merah di titik tengah sebelum sobek
      if (bendP > 0.25) {
        s.dash(0, 32 + sag, 0, 58 + sag, { stroke: "#E05A47", width: 2, alpha: bendP, wobble: 0.6 });
      }
    } else {
      // KERTAS SOBEK TERBELAH DUA DENGAN TEPI BERGERIGI!
      const dropAng = ripP * 0.52;
      const splitGap = ripP * 26;

      // Potongan Kertas Kiri (Robek Miring)
      s.group({ x: -78 - splitGap * 0.4, y: 46 + ripP * 24, rotate: dropAng }, () => {
        s.shape([
          [-56, 6], [48, 6], [42, 10], [50, 14], [44, 18], [-56, 16]
        ], { fill: "#0B1210", stroke: "none", alpha: 0.3, wobble: 0.4, hatch: false });
        s.shape([
          [-60, 0], [46, 0], [40, 4], [48, 8], [42, 12], [-60, 10]
        ], { fill: "#F7F1E3", stroke: "#C9B99F", width: 1.8, wobble: 0.5, hatch: false });
        // Serat putih robekan di ujung kanan potongan kiri
        s.polyline([[46, 0], [40, 4], [48, 8], [42, 12]], { stroke: "#FFFFFF", width: 2.2, wobble: 0.6 });
      });

      // Potongan Kertas Kanan (Robek Miring)
      s.group({ x: 78 + splitGap * 0.4, y: 46 + ripP * 24, rotate: -dropAng }, () => {
        s.shape([
          [-44, 6], [60, 6], [60, 16], [-42, 18], [-48, 12], [-40, 8]
        ], { fill: "#0B1210", stroke: "none", alpha: 0.3, wobble: 0.4, hatch: false });
        s.shape([
          [-46, 0], [58, 0], [58, 10], [-44, 12], [-50, 6], [-42, 3]
        ], { fill: "#F7F1E3", stroke: "#C9B99F", width: 1.8, wobble: 0.5, hatch: false });
        // Serat putih robekan di ujung kiri potongan kanan
        s.polyline([[-46, 0], [-42, 3], [-50, 6], [-44, 12]], { stroke: "#FFFFFF", width: 2.2, wobble: 0.6 });
      });

      // Serpihan kertas kecil berterbangan saat sobek
      for (let f = 0; f < 8; f++) {
        const ang = -2.4 + f * 0.28;
        const dist = ripP * (28 + (f % 3) * 18);
        const fx = Math.cos(ang) * dist;
        const fy = 48 + Math.sin(ang) * dist + ripP * ripP * 68;
        s.group({ x: fx, y: fy, rotate: ripP * (f % 2 === 0 ? 2.4 : -2.1) }, () => {
          s.shape([[-5, -3], [6, -2], [4, 4], [-4, 3]], {
            fill: f % 2 === 0 ? "#F7F1E3" : "#E05A47",
            stroke: "none",
            alpha: Math.max(0, 1 - ripP * 0.85),
            wobble: 0.4,
            hatch: false
          });
        });
      }
    }
  });

  // PEMBERAT KERTAS KORAL (JATUH MENEKAN TENGAH KERTAS)
  if (s.t >= 0.82) {
    const wy = !isRipped
      ? s.lerp(-180, 16 + bendP * 36, weightDrop)
      : s.lerp(52, 138, ripP);
    const wRot = isRipped ? ripP * 0.18 : Math.sin(s.t * 28) * bendP * 0.04;
    s.group({ x: 0, y: wy, rotate: wRot }, () => {
      // Bayangan pemberat
      s.rect(-26, -22, 60, 48, { r: 6, fill: "#0B1210", stroke: "none", alpha: 0.3, wobble: 0.4, hatch: false });
      // Potongan pemberat koral berlapis
      s.rect(-30, -26, 60, 48, { r: 6, fill: "#E05A47", stroke: "#9E3525", width: 1.8, wobble: 0.5, hatch: false });
      s.rect(-20, -18, 40, 22, { r: 3, fill: "#F7F1E3", stroke: "none", wobble: 0.4, hatch: false });
      s.text("BEBAN", 0, -3, { size: 10, color: "#9E3525", align: "center" });
    });
  }
});

// --- SCREEN-SPACE HUD (KARTU TEMPEL SELotip KERTAS DI AREA AMAN) ---
// Kartu Atas: Judul Eksperimen dengan Selotip Kertas Miring
s.group({ x: 360, y: 138, scale: s.spring(0.08, "snappy") }, () => {
  // Bayangan kartu
  s.rect(-154, -22, 316, 52, { r: 6, fill: "#0B1210", stroke: "none", alpha: 0.34, wobble: 0.4, hatch: false });
  // Kartu kertas krem
  s.rect(-158, -26, 316, 52, { r: 6, fill: "#F7F1E3", stroke: "#C9B99F", width: 1.8, wobble: 0.5, hatch: false });
  // Selotip kertas (masking tape) miring di kiri & kanan atas
  s.group({ x: -138, y: -24, rotate: -0.22 }, () => {
    s.rect(-22, -7, 44, 14, { fill: "#E9B44C", stroke: "none", alpha: 0.78, wobble: 0.5, hatch: false });
  });
  s.group({ x: 138, y: -24, rotate: 0.22 }, () => {
    s.rect(-22, -7, 44, 14, { fill: "#E9B44C", stroke: "none", alpha: 0.78, wobble: 0.5, hatch: false });
  });
  s.text("UJI 01 · KERTAS RATA TANPA LIPATAN", 0, -4, { size: 11, color: "#6E5A44", align: "center" });
  s.text(isRipped ? "STATUS: MELENGKUNG & SOBEK!" : "STATUS: MENAHAN BEBAN...", 0, 14, {
    size: 13,
    color: isRipped ? "#E05A47" : "#2A8C82",
    align: "center"
  });
});

// Kartu Bawah: Catatan Hasil Uji
if (s.t >= 2.2) {
  s.group({ x: 360, y: 616, scale: s.spring(2.2, "bouncy") }, () => {
    s.rect(-150, -24, 308, 54, { r: 6, fill: "#0B1210", stroke: "none", alpha: 0.35, wobble: 0.4, hatch: false });
    s.rect(-154, -28, 308, 54, { r: 6, fill: "#E05A47", stroke: "#9E3525", width: 1.8, wobble: 0.5, hatch: false });
    s.text("LEMBAR RATA = MUDAH MELENGKUNG", 0, -4, { size: 12, color: "#F7F1E3", align: "center" });
    s.text("TIDAK ADA RUSUK PENOPANG BEBAN", 0, 14, { size: 10, color: "#FFE3DC", align: "center" });
  });
}

// ===== SCENE 2 =====
// Durasi ideal: 4.2 detik
// Cerita: Rahasia Lipatan Akordeon (Zig-Zag) -> Mengubah Kertas Tipis Jadi Rusuk Segitiga Kuat!
// Kamera: Macro Dolly Zoom-In ke profil penampang segitiga + Tilt rotasi meja kerja
s.sfx("paper_slide", 0.12, 0.85, 1.05);     // Lembar kertas baru siap dilipat
s.sfx("paper_fold", 0.55, 0.92, 0.94);      // SRET-KREK! Lipatan ke-1
s.sfx("paper_fold", 0.95, 0.94, 1.02);      // SRET-KREK! Lipatan ke-2
s.sfx("paper_fold", 1.35, 0.96, 1.10);      // SRET-KREK! Lipatan ke-3
s.sfx("paper_fold", 1.75, 1.0, 1.18);       // SRET-KREK! Lipatan ke-4 terkunci!
s.sfx("paper_snip", 2.25, 0.88, 1.05);      // KRES-SNIP! Gunting merapikan tepi kertas
s.sfx("paper_pop", 2.65, 0.9, 1.08);        // Badge rumus segitiga kekuatan muncul

const easeInOut = (p) => {
  const t = s.clamp(p, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const easeOut = (p) => 1 - Math.pow(1 - s.clamp(p, 0, 1), 3);

// Progres lipatan zig-zag (0 = kertas rata, 1 = terlipat menjadi 5 rusuk segitiga)
const fold1 = easeOut(s.at(0.48, 0.36));
const fold2 = easeOut(s.at(0.88, 0.36));
const fold3 = easeOut(s.at(1.28, 0.36));
const fold4 = easeOut(s.at(1.68, 0.38));
const totalFold = (fold1 + fold2 + fold3 + fold4) / 4;
const snipP = easeOut(s.at(2.18, 0.45));

// --- VIRTUAL CAMERA RIG (MACRO ZOOM-IN KE PROFIL SEGITIGA) ---
const macroZoom = easeInOut(s.at(0.4, 1.85));
const camScale = s.lerp(0.95, 1.24, macroZoom);
const camX = s.lerp(0, 8, macroZoom);
const camY = s.lerp(-10, 14, macroZoom);
const camRot = s.lerp(0.03, -0.015, macroZoom);

// --- WORLD LAYER (BLUEPRINT LIPATAN & PENAMPANG AKORDEON) ---
s.group({ x: 360 - camX, y: 400 - camY, scale: camScale, rotate: camRot }, () => {
  // Alas meja blueprint kraft gelap + grid lipatan
  s.rect(-560, -560, 1120, 1120, { fill: "#213038", stroke: "none", wobble: 0, hatch: false });
  for (let g = -8; g <= 8; g++) {
    s.line(g * 52, -520, g * 52, 520, { stroke: "#324752", width: 1, alpha: 0.45, wobble: 0 });
    s.line(-520, g * 52, 520, g * 52, { stroke: "#324752", width: 1, alpha: 0.45, wobble: 0 });
  }

  // KARTU DIAGRAM ATAS: GARIS LIPATAN PUTUS-PUTUS (VALLEY & MOUNTAIN FOLD)
  s.group({ x: 0, y: -74 }, () => {
    const sheetW = s.lerp(236, 172, totalFold);
    // Bayangan kertas
    s.rect(-sheetW / 2 + 6, -42, sheetW, 92, { r: 4, fill: "#0D1518", stroke: "none", alpha: 0.34, wobble: 0.4, hatch: false });

    // 5 Panel Lipatan Kertas (Sisi Terang & Sisi Bayangan Bergantian!)
    const panelCount = 5;
    const pw = sheetW / panelCount;
    for (let i = 0; i < panelCount; i++) {
      const px = -sheetW / 2 + i * pw;
      const isShadowSide = i % 2 === 1;
      const panelCol = isShadowSide ? "#DFD3BE" : "#F7F1E3";
      const yShift = isShadowSide ? -totalFold * 7 : totalFold * 7;

      s.shape([
        [px, -48 + (i % 2 === 0 ? 0 : -totalFold * 8)],
        [px + pw, -48 + (i % 2 === 0 ? -totalFold * 8 : 0)],
        [px + pw, 42 + (i % 2 === 0 ? -totalFold * 8 : 0)],
        [px, 42 + (i % 2 === 0 ? 0 : -totalFold * 8)]
      ], { fill: panelCol, stroke: "#B5A48B", width: 1.5, wobble: 0.4, hatch: false });

      // Garis lipatan putus-putus merah & biru
      if (i > 0) {
        s.dash(px, -44 + yShift * 0.4, px, 38 + yShift * 0.4, {
          stroke: isShadowSide ? "#E05A47" : "#2A8C82",
          width: 1.8,
          alpha: 0.85,
          wobble: 0.4
        });
      }
    }

    // Gunting Kertas Kecil Merapikan Sudut Kanan saat snipP
    if (s.t >= 2.1) {
      const scX = s.lerp(135, 92, snipP);
      const bladeAng = Math.sin(snipP * Math.PI * 3) * 0.28;
      s.group({ x: scX, y: -4, scale: 0.85 }, () => {
        s.line(0, 0, -24, -10 - bladeAng * 18, { stroke: "#D8E2E8", width: 3, wobble: 0.2 });
        s.line(0, 0, -24, 10 + bladeAng * 18, { stroke: "#AAB8C2", width: 3, wobble: 0.2 });
        s.circle(10, -8, 7, { fill: "none", stroke: "#E05A47", width: 2.5, wobble: 0.3 });
        s.circle(10, 8, 7, { fill: "none", stroke: "#E05A47", width: 2.5, wobble: 0.3 });
      });
    }
  });

  // PENAMPANG SAMPING (MACRO CROSS-SECTION): KERTAS RATA -> RUSUK SEGITIGA ZIG-ZAG!
  s.group({ x: 0, y: 68 }, () => {
    // Pita Dasar Pengukur
    s.rect(-136, 42, 272, 22, { r: 4, fill: "#152229", stroke: "#3B525E", width: 1.2, wobble: 0.3, hatch: false });
    s.text("PROFIL PENAMPANG RUSUK SEGITIGA", 0, 56, { size: 10, color: "#9CC5D4", align: "center" });

    // Titik-titik puncak & lembah lipatan zig-zag
    const spanX = s.lerp(124, 96, totalFold);
    const peakH = totalFold * 44;
    const nodes = 7;
    const ptsTop = [];
    const ptsBot = [];
    for (let n = 0; n < nodes; n++) {
      const nx = -spanX + (n / (nodes - 1)) * (spanX * 2);
      const isPeak = n % 2 === 1;
      const ny = isPeak ? 12 - peakH : 12 + peakH * 0.35;
      ptsTop.push([nx, ny]);
      ptsBot.push([nx, ny + 10]);
    }

    // Segitiga-segitiga pengunci berwarna kuning oker & toska di bawah lipatan
    if (totalFold > 0.35) {
      const triAlpha = s.clamp((totalFold - 0.35) * 1.6, 0, 0.85);
      for (let n = 0; n < nodes - 2; n += 2) {
        const p1 = ptsTop[n];
        const p2 = ptsTop[n + 1];
        const p3 = ptsTop[n + 2];
        s.shape([p1, p2, p3], {
          fill: (n / 2) % 2 === 0 ? "#E9B44C" : "#2A8C82",
          stroke: "none",
          alpha: triAlpha * 0.42,
          wobble: 0.3,
          hatch: false
        });
      }
    }

    // Gambar pita kertas berlipat tebal + bayangannya
    const polyShadow = ptsTop.map(([x, y]) => [x + 5, y + 7]).concat(ptsBot.slice().reverse().map(([x, y]) => [x + 5, y + 7]));
    const polyPaper = ptsTop.concat(ptsBot.slice().reverse());
    s.shape(polyShadow, { fill: "#0B1214", stroke: "none", alpha: 0.35, wobble: 0.4, hatch: false });
    s.shape(polyPaper, { fill: "#F7F1E3", stroke: "#D4B483", width: 2, wobble: 0.5, hatch: false });

    // Panah penyebaran beban di tiap puncak segitiga
    if (totalFold > 0.65) {
      for (let n = 1; n < nodes; n += 2) {
        const [px, py] = ptsTop[n];
        s.circle(px, py, 4.5, { fill: "#E05A47", stroke: "#F7F1E3", width: 1.5, wobble: 0.2, hatch: false });
      }
    }
  });
});

// --- SCREEN-SPACE HUD (KARTU DATA LIPATAN DI AREA AMAN) ---
s.group({ x: 360, y: 138, scale: s.spring(0.08, "snappy") }, () => {
  s.rect(-154, -22, 316, 52, { r: 6, fill: "#0B1214", stroke: "none", alpha: 0.35, wobble: 0.4, hatch: false });
  s.rect(-158, -26, 316, 52, { r: 6, fill: "#F7F1E3", stroke: "#C9B99F", width: 1.8, wobble: 0.5, hatch: false });
  // Selotip kertas toska di sudut
  s.group({ x: -138, y: -24, rotate: -0.2 }, () => {
    s.rect(-20, -6, 40, 12, { fill: "#2A8C82", stroke: "none", alpha: 0.82, wobble: 0.4, hatch: false });
  });
  s.group({ x: 138, y: -24, rotate: 0.2 }, () => {
    s.rect(-20, -6, 40, 12, { fill: "#2A8C82", stroke: "none", alpha: 0.82, wobble: 0.4, hatch: false });
  });
  const foldCount = Math.min(4, Math.floor(totalFold * 4.2));
  s.text("TEKNIK · LIPATAN AKORDEON ZIG-ZAG", 0, -4, { size: 11, color: "#5C4D3C", align: "center" });
  s.text("RUSUK TERBENTUK: " + foldCount + " / 4 SEGITIGA", 0, 14, { size: 13, color: "#2A8C82", align: "center" });
});

// Kartu Bawah: Kekuatan Lipatan
if (s.t >= 2.45) {
  s.group({ x: 360, y: 616, scale: s.spring(2.45, "bouncy") }, () => {
    s.rect(-152, -24, 312, 54, { r: 6, fill: "#0B1214", stroke: "none", alpha: 0.35, wobble: 0.4, hatch: false });
    s.rect(-156, -28, 312, 54, { r: 6, fill: "#E9B44C", stroke: "#A67922", width: 1.8, wobble: 0.5, hatch: false });
    s.text("LIPATAN = RUSUK PENOPANG VERTIKAL", 0, -4, { size: 12, color: "#1E2D29", align: "center" });
    s.text("KEKUATAN MENINGKAT HINGGA 12X LIPAT", 0, 14, { size: 10, color: "#3A2B10", align: "center" });
  });
}

// ===== SCENE 3 =====
// Durasi ideal: 4.2 detik
// Cerita: Diorama Shadowbox 3 Lapis: Jembatan Kertas Berlipat Menahan 3 Beban Berat Sekaligus!
// Kamera: Lateral Parallax Pan + Multi-Layer Depth Shift + Micro Impact Bounce
s.sfx("paper_pop", 0.14, 0.92, 0.96);       // PLAK-WUP! Diorama jembatan kertas terbuka
s.sfx("paper_slap", 0.85, 0.88, 1.0);       // PLAK! Beban ke-1 mendarat di atas jembatan
s.sfx("paper_slap", 1.38, 0.94, 0.94);      // PLAK! Beban ke-2 mendarat di atas beban 1
s.sfx("paper_slap", 1.92, 1.0, 0.86);       // PLAK! Beban ke-3 mendarat kokoh!
s.sfx("paper_fold", 2.15, 0.78, 1.15);      // KREK! Rusuk kertas memadat & mengunci beban
s.sfx("paper_pop", 2.58, 0.92, 1.12);       // Stempel LULUS UJI BEBAN muncul

const easeInOut = (p) => {
  const t = s.clamp(p, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const easeOut = (p) => 1 - Math.pow(1 - s.clamp(p, 0, 1), 3);
const hitDecay = (tHit, dur) => Math.max(0, 1 - s.at(tHit, dur)) * (s.t >= tHit ? 1 : 0);

// --- VIRTUAL CAMERA RIG (SHADOWBOX PARALLAX PAN + IMPACT BOUNCE) ---
const panT = easeInOut(s.at(0.2, 2.8));
const camX = s.lerp(-22, 22, panT);
const impactY = (hitDecay(0.85, 0.22) * 5 + hitDecay(1.38, 0.24) * 7 + hitDecay(1.92, 0.28) * 10) * Math.sin(s.t * 55);
const camY = s.lerp(8, -10, panT) + impactY;
const camZoom = s.lerp(0.98, 1.18, easeInOut(s.at(0.5, 1.9)));

// --- LAYER 1: LATAR DIORAMA KERTAS (PARALLAX 0.35x) ---
s.group({ x: 360 - camX * 0.35, y: 390 - camY * 0.35, scale: camZoom }, () => {
  s.rect(-560, -560, 1120, 1120, { fill: "#182825", stroke: "none", wobble: 0, hatch: false });

  // Awan guntingan kertas menggantung dengan benang putih tipis
  const drawPaperCloud = (cx, cy, sc) => {
    s.group({ x: cx, y: cy, scale: sc }, () => {
      s.line(0, -140, 0, -18, { stroke: "#F7F1E3", width: 1, alpha: 0.45, wobble: 0.2 });
      s.rect(-40, -10, 88, 28, { r: 14, fill: "#0B1210", stroke: "none", alpha: 0.3, wobble: 0.4, hatch: false });
      s.rect(-44, -14, 88, 28, { r: 14, fill: "#F7F1E3", stroke: "#C9B99F", width: 1.5, wobble: 0.5, hatch: false });
      s.circle(-14, -16, 16, { fill: "#F7F1E3", stroke: "#C9B99F", width: 1.5, wobble: 0.5, hatch: false });
      s.circle(14, -14, 13, { fill: "#F7F1E3", stroke: "#C9B99F", width: 1.5, wobble: 0.5, hatch: false });
    });
  };
  drawPaperCloud(-115, -135 + Math.sin(s.t * 1.8) * 4, 0.9);
  drawPaperCloud(120, -148 + Math.cos(s.t * 1.5) * 4, 0.82);

  // Bukit kertas berlapis di kejauhan
  s.shape([[-320, 180], [-140, 48], [60, 180]], { fill: "#223833", stroke: "#314F48", width: 1.5, wobble: 0.5, hatch: false });
  s.shape([[-80, 180], [135, 36], [340, 180]], { fill: "#28423C", stroke: "#3B5E56", width: 1.5, wobble: 0.5, hatch: false });
});

// --- LAYER 2: JEMBATAN KERTAS AKORDEON & 3 TUMPUKAN BEBAN (PARALLAX 1.0x) ---
s.group({ x: 360 - camX, y: 405 - camY, scale: camZoom }, () => {
  // Pilar Kertas Kraft Kiri & Kanan
  const drawPillar = (px) => {
    s.rect(px - 26, 48, 60, 135, { r: 4, fill: "#0A100F", stroke: "none", alpha: 0.36, wobble: 0.4, hatch: false });
    s.rect(px - 32, 42, 60, 135, { r: 4, fill: "#C8A474", stroke: "#8A6A42", width: 1.8, wobble: 0.5, hatch: false });
    // Tekstur garis karton gelombang
    for (let l = 0; l < 4; l++) {
      s.line(px - 22, 62 + l * 26, px + 18, 62 + l * 26, { stroke: "#9E7B4F", width: 1.5, alpha: 0.65, wobble: 0.3 });
    }
  };
  drawPillar(-116);
  drawPillar(116);

  // Jembatan Kertas Lipat Zig-Zag (Hanya Melentur 4px Walau Diberi 3 Beban!)
  const flexY = (s.t >= 0.85 ? 1.5 : 0) + (s.t >= 1.38 ? 1.5 : 0) + (s.t >= 1.92 ? 1.5 : 0);
  s.group({ x: 0, y: 34 + flexY }, () => {
    // Deck atas & bawah jembatan kertas
    s.rect(-132, -16, 264, 8, { r: 2, fill: "#F7F1E3", stroke: "#C9B99F", width: 1.5, wobble: 0.4, hatch: false });
    s.rect(-128, 12, 256, 8, { r: 2, fill: "#DFD3BE", stroke: "#B5A48B", width: 1.5, wobble: 0.4, hatch: false });

    // 8 Segitiga Trusses Lipatan Kertas di Tengah Jembatan
    for (let t = -4; t < 4; t++) {
      const tx1 = t * 30;
      const tx2 = tx1 + 15;
      const tx3 = tx1 + 30;
      s.shape([[tx1, 12], [tx2, -10], [tx3, 12]], {
        fill: t % 2 === 0 ? "#F7F1E3" : "#E9B44C",
        stroke: "#9E7B4F",
        width: 1.5,
        wobble: 0.4,
        hatch: false
      });
    }
  });

  // 3 BALOK BEBAN MENDARAT BERTUMPUK DI ATAS JEMBATAN KERTAS!
  const weights = [
    { t0: 0.72, yTarget: -6, w: 112, h: 32, col: "#2A8C82", stroke: "#185952", label: "BEBAN 1 · 100g" },
    { t0: 1.25, yTarget: -40, w: 94, h: 32, col: "#E9B44C", stroke: "#9E721E", label: "BEBAN 2 · 250g" },
    { t0: 1.78, yTarget: -74, w: 76, h: 32, col: "#E05A47", stroke: "#993222", label: "BEBAN 3 · 500g" }
  ];

  weights.forEach((bw) => {
    if (s.t >= bw.t0) {
      const dropP = easeOut(s.at(bw.t0, 0.16));
      const wy = s.lerp(-210, bw.yTarget + flexY, dropP);
      s.group({ x: 0, y: wy }, () => {
        s.rect(-bw.w / 2 + 5, -12, bw.w, bw.h, { r: 5, fill: "#0A100F", stroke: "none", alpha: 0.32, wobble: 0.4, hatch: false });
        s.rect(-bw.w / 2, -16, bw.w, bw.h, { r: 5, fill: bw.col, stroke: bw.stroke, width: 1.8, wobble: 0.5, hatch: false });
        s.text(bw.label, 0, 4, { size: 10, color: "#F7F1E3", align: "center" });
      });
    }
  });

  // Panah Hijau Penyaluran Gaya ke Tiang Penyangga
  if (s.t >= 1.95) {
    const forceAlpha = easeOut(s.at(1.95, 0.4));
    s.dash(-25, 25, -108, 65, { stroke: "#2A8C82", width: 2.5, alpha: forceAlpha, wobble: 0.4 });
    s.dash(25, 25, 108, 65, { stroke: "#2A8C82", width: 2.5, alpha: forceAlpha, wobble: 0.4 });
  }
});

// --- LAYER 3: BINGKAI DEPAN SHADOWBOX (PARALLAX 1.35x) ---
s.group({ x: 360 - camX * 1.35, y: 420 - camY * 1.35, scale: camZoom }, () => {
  // Daun kolase kertas di sudut kiri & kanan bawah
  s.shape([[-240, 240], [-195, 165], [-160, 240]], { fill: "#13211E", stroke: "#2A8C82", width: 1.5, wobble: 0.5, hatch: false });
  s.shape([[160, 240], [202, 158], [245, 240]], { fill: "#13211E", stroke: "#2A8C82", width: 1.5, wobble: 0.5, hatch: false });
});

// --- SCREEN-SPACE HUD (KARTU HASIL UJI BEBAN 3X) ---
s.group({ x: 360, y: 138, scale: s.spring(0.08, "snappy") }, () => {
  s.rect(-154, -22, 316, 52, { r: 6, fill: "#0A100F", stroke: "none", alpha: 0.35, wobble: 0.4, hatch: false });
  s.rect(-158, -26, 316, 52, { r: 6, fill: "#F7F1E3", stroke: "#C9B99F", width: 1.8, wobble: 0.5, hatch: false });
  const loadKg = s.t >= 1.92 ? "850 GRAM (3 BEBAN)" : s.t >= 1.38 ? "350 GRAM (2 BEBAN)" : s.t >= 0.85 ? "100 GRAM (1 BEBAN)" : "0 GRAM";
  s.text("UJI 02 · JEMBATAN KERTAS AKORDEON", 0, -4, { size: 11, color: "#6E5A44", align: "center" });
  s.text("TOTAL BEBAN: " + loadKg, 0, 14, { size: 13, color: "#2A8C82", align: "center" });
});

if (s.t >= 2.48) {
  s.group({ x: 360, y: 616, scale: s.spring(2.48, "bouncy") }, () => {
    s.rect(-152, -24, 312, 54, { r: 6, fill: "#0A100F", stroke: "none", alpha: 0.36, wobble: 0.4, hatch: false });
    s.rect(-156, -28, 312, 54, { r: 6, fill: "#2A8C82", stroke: "#185952", width: 1.8, wobble: 0.5, hatch: false });
    s.text("LULUS UJI! TIDAK MELENGKUNG / SOBEK", 0, -4, { size: 12, color: "#F7F1E3", align: "center" });
    s.text("BEBAN DISEBARKAN MERATA KE TIANG", 0, 14, { size: 10, color: "#D5F5F0", align: "center" });
  });
}

// ===== SCENE 4 =====
// Durasi ideal: 4.2 detik
// Cerita: Dari Meja Kerajinan ke Teknologi Dirgantara (Miura-Ori Solar Array & Honeycomb Sayap Pesawat!)
// Kamera: Dramatic Whip Pull-Out dari lipatan kertas meja -> Diorama Satelit Origami Luar Angkasa
s.sfx("paper_fold", 0.12, 0.88, 1.0);       // SRET-KREK! Kertas origami mulai mekar
s.sfx("paper_pop", 0.65, 0.96, 0.92);       // PLAK-WUP! Transisi whip pull-out ke luar angkasa kertas
s.sfx("paper_slide", 1.15, 0.9, 1.08);      // SRUUUT! Sayap panel surya Miura-Ori membentang kiri-kanan
s.sfx("paper_fold", 1.65, 0.85, 1.18);      // KREK! Segmen sayap mengunci penuh
s.sfx("paper_pop", 2.25, 0.95, 1.05);       // Kartu kesimpulan akhir menempel
s.sfx("paper_slap", 2.75, 0.85, 1.12);      // Stempel penutup menempel mantap

const easeInOut = (p) => {
  const t = s.clamp(p, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const easeOut = (p) => 1 - Math.pow(1 - s.clamp(p, 0, 1), 3);

// Fase ekspansi panel surya origami (Miura-Ori)
const spaceReveal = easeInOut(s.at(0.35, 0.95));
const wingDeploy = easeOut(s.at(0.85, 1.35));

// --- VIRTUAL CAMERA RIG (WHIP PULL-OUT + ORBITAL FLOAT) ---
const camScale = s.lerp(1.36, 0.98, spaceReveal);
const camX = Math.sin(s.t * 1.6) * 8;
const camY = s.lerp(24, -6, spaceReveal) + Math.cos(s.t * 1.4) * 5;
const camRot = s.lerp(-0.08, 0.02, spaceReveal) + Math.sin(s.t * 1.2) * 0.015;

// --- WORLD LAYER (DIORAMA LUAR ANGKASA KERTAS & SATELIT ORIGAMI) ---
s.group({ x: 360 - camX, y: 400 - camY, scale: camScale, rotate: camRot }, () => {
  // Latar Karton Biru Malam Berlapis + Bintang Potongan Kertas Kuning
  s.rect(-560, -560, 1120, 1120, { fill: "#131F33", stroke: "none", wobble: 0, hatch: false });

  // Lingkaran orbit putus-putus
  s.circle(0, 260, 290, { fill: "none", stroke: "#294066", width: 1.5, wobble: 0.4, hatch: false });
  s.circle(0, 260, 235, { fill: "#1B2E4B", stroke: "#355382", width: 1.8, wobble: 0.5, hatch: false });

  // Bintang-bintang potongan kertas dengan benang gantung diorama
  const stars = [[-135, -135], [142, -120], [-148, 75], [152, 88], [0, -162]];
  stars.forEach(([sx, sy], idx) => {
    const twinkle = 0.85 + Math.sin(s.t * 3.5 + idx) * 0.15;
    s.group({ x: sx, y: sy, scale: twinkle }, () => {
      s.sparkle(0, 0, 11, { stroke: "#E9B44C", width: 2.2, wobble: 0.3 });
    });
  });

  // SATELIT ORIGAMI MIURA-ORI (MEMBENTANGKAN SAYAP PANEL SURYA BERLIPAT!)
  s.group({ x: 0, y: -12 + Math.sin(s.t * 2.2) * 5 }, () => {
    const wingSpan = s.lerp(24, 146, wingDeploy);
    const segCount = 4;
    const segW = wingSpan / segCount;

    // Fungsi menggambar sayap lipatan origami Miura-Ori (Kiri & Kanan)
    const drawOrigamiWing = (dir) => {
      for (let i = 0; i < segCount; i++) {
        const x0 = dir * (34 + i * segW);
        const x1 = dir * (34 + (i + 1) * segW);
        const zigOffset = (i % 2 === 0 ? -1 : 1) * (1 - wingDeploy * 0.55) * 16;

        // Panel Atas Sayap
        s.shape([
          [x0, -28 + zigOffset],
          [x1, -28 - zigOffset],
          [x1, 0 - zigOffset],
          [x0, 0 + zigOffset]
        ], {
          fill: i % 2 === 0 ? "#E9B44C" : "#D49B35",
          stroke: "#7A5411",
          width: 1.5,
          wobble: 0.4,
          hatch: false
        });

        // Panel Bawah Sayap
        s.shape([
          [x0, 0 + zigOffset],
          [x1, 0 - zigOffset],
          [x1, 28 - zigOffset],
          [x0, 28 + zigOffset]
        ], {
          fill: i % 2 === 0 ? "#D49B35" : "#F7F1E3",
          stroke: "#7A5411",
          width: 1.5,
          wobble: 0.4,
          hatch: false
        });
      }
    };

    drawOrigamiWing(-1);
    drawOrigamiWing(1);

    // Modul Inti Satelit Kertas (Hexagonal Paper Core)
    s.rect(-30, -34, 68, 76, { r: 6, fill: "#09101C", stroke: "none", alpha: 0.4, wobble: 0.4, hatch: false });
    s.rect(-34, -38, 68, 76, { r: 6, fill: "#F7F1E3", stroke: "#B5A48B", width: 2, wobble: 0.5, hatch: false });
    s.rect(-22, -24, 44, 32, { r: 4, fill: "#2A8C82", stroke: "#185952", width: 1.5, wobble: 0.4, hatch: false });
    // Dish antena kertas koral di atas
    s.arc(0, -46, 22, 0.25, Math.PI - 0.25, { stroke: "#E05A47", width: 3, wobble: 0.4 });
    s.line(0, -46, 0, -62, { stroke: "#E9B44C", width: 2, wobble: 0.3 });
    s.circle(0, -64, 4.5, { fill: "#E05A47", stroke: "#F7F1E3", width: 1.5, wobble: 0.3, hatch: false });
    s.text("MIURA-ORI", 0, 24, { size: 9, color: "#5C4D3C", align: "center" });
  });

  // LENCANA CABANG TEKNOLOGI DI BAWAH SATELIT (SAYAP PESAWAT & KARDUS HONEYCOMB)
  if (s.t >= 1.5) {
    const tagL = s.spring(1.5, "bouncy");
    const tagR = s.spring(1.7, "bouncy");
    s.group({ x: -88, y: 102, scale: tagL, rotate: -0.04 }, () => {
      s.rect(-68, -18, 136, 36, { r: 5, fill: "#F7F1E3", stroke: "#C9B99F", width: 1.5, wobble: 0.4, hatch: false });
      s.text("PANEL SURYA", 0, -2, { size: 10, color: "#152238", align: "center" });
      s.text("SATELIT NASA", 0, 11, { size: 9, color: "#E05A47", align: "center" });
    });
    s.group({ x: 88, y: 102, scale: tagR, rotate: 0.04 }, () => {
      s.rect(-68, -18, 136, 36, { r: 5, fill: "#F7F1E3", stroke: "#C9B99F", width: 1.5, wobble: 0.4, hatch: false });
      s.text("STRUKTUR INTI", 0, -2, { size: 10, color: "#152238", align: "center" });
      s.text("SAYAP PESAWAT", 0, 11, { size: 9, color: "#2A8C82", align: "center" });
    });
  }
});

// --- SCREEN-SPACE HUD (KARTU KESIMPULAN AKHIR DI AREA AMAN) ---
s.group({ x: 360, y: 138, scale: s.spring(0.08, "snappy") }, () => {
  s.rect(-154, -22, 316, 52, { r: 6, fill: "#09101C", stroke: "none", alpha: 0.4, wobble: 0.4, hatch: false });
  s.rect(-158, -26, 316, 52, { r: 6, fill: "#F7F1E3", stroke: "#C9B99F", width: 1.8, wobble: 0.5, hatch: false });
  s.text("APLIKASI NYATA · GEOMETRI ORIGAMI", 0, -4, { size: 11, color: "#6E5A44", align: "center" });
  s.text("RINGKAS DILIPAT · SUPER KOKOH DIBENTANG", 0, 14, { size: 12, color: "#E05A47", align: "center" });
});

if (s.t >= 2.2) {
  s.group({ x: 360, y: 616, scale: s.spring(2.2, "bouncy") }, () => {
    s.rect(-154, -24, 316, 54, { r: 6, fill: "#09101C", stroke: "none", alpha: 0.4, wobble: 0.4, hatch: false });
    s.rect(-158, -28, 316, 54, { r: 6, fill: "#E05A47", stroke: "#9E3525", width: 1.8, wobble: 0.5, hatch: false });
    s.text("BUKAN BAHANNYA YANG BERUBAH —", 0, -4, { size: 11, color: "#FFE3DC", align: "center" });
    s.text("TAPI GEOMETRI LIPATANNYA!", 0, 14, { size: 13, color: "#F7F1E3", align: "center" });
  });
}

-- Engine Web Audio Khusus
// ===== TACTILE PAPER FOLEY SYNTHESIZER (7 PRESET KHAS KERTAS) =====
// Cara pakai: tempel fungsi ini ke audio engine kamu dan hubungkan ke s.sfx(name, time, gain, pitch)
export function playPaperSfx(ctx, dest, type, startTime, volume = 1, pitch = 1) {
  const t0 = Math.max(ctx.currentTime, startTime);

  // Generator buffer noise serat kertas (filtered pink/white noise)
  const createPaperNoise = (dur, pink = false) => {
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      if (pink) {
        b0 = 0.997 * b0 + white * 0.029;
        b1 = 0.985 * b1 + white * 0.032;
        b2 = 0.950 * b2 + white * 0.048;
        data[i] = (b0 + b1 + b2 + white * 0.18) * 1.4;
      } else {
        data[i] = white;
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
  };

  // 1. PAPER_SLIDE: Geser kertas di atas alas meja potong ("SRUUUT")
  if (type === "paper_slide") {
    const dur = 0.34 / Math.max(0.7, pitch);
    const src = createPaperNoise(dur, true);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(1150 * pitch, t0);
    bp.frequency.exponentialRampToValueAtTime(1950 * pitch, t0 + dur);
    bp.Q.value = 2.4;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t0);
    g.gain.linearRampToValueAtTime(0.28 * volume, t0 + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

    src.connect(bp);
    bp.connect(g);
    g.connect(dest);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  // 2. PAPER_FOLD: Lipat lalu tekan garis lipatan kertas ("SRET-KREK!")
  else if (type === "paper_fold") {
    const dur = 0.24;
    const src = createPaperNoise(dur, false);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(1600 * pitch, t0);
    bp.frequency.exponentialRampToValueAtTime(3200 * pitch, t0 + dur);
    bp.Q.value = 3.2;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t0);
    g.gain.linearRampToValueAtTime(0.32 * volume, t0 + 0.025);
    g.gain.exponentialRampToValueAtTime(0.04 * volume, t0 + 0.11);
    g.gain.linearRampToValueAtTime(0.38 * volume, t0 + 0.14);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

    src.connect(bp);
    bp.connect(g);
    g.connect(dest);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  // 3. PAPER_RIP: Robekan serat kertas panjang ("KRAAAK-SREEEKKK!")
  else if (type === "paper_rip") {
    const dur = 0.48 / Math.max(0.75, pitch);
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    // Modulasi amplitudo bergerigi untuk meniru serat kertas putus satu per satu
    for (let i = 0; i < len; i++) {
      const p = i / len;
      const fiberGrain = 0.55 + 0.45 * Math.sin(i * 0.11) * Math.cos(i * 0.037);
      data[i] = (Math.random() * 2 - 1) * fiberGrain * Math.pow(1 - p * 0.35, 0.6);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(1400 * pitch, t0);
    bp.frequency.exponentialRampToValueAtTime(3600 * pitch, t0 + dur);
    bp.Q.value = 1.8;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t0);
    g.gain.linearRampToValueAtTime(0.46 * volume, t0 + 0.03);
    g.gain.setValueAtTime(0.42 * volume, t0 + dur * 0.72);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

    src.connect(bp);
    bp.connect(g);
    g.connect(dest);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  // 4. PAPER_CRUMPLE: Kresek kertas diremas / tertekuk menahan beban
  else if (type === "paper_crumple") {
    for (let k = 0; k < 5; k++) {
      const kt = t0 + k * 0.045;
      const src = createPaperNoise(0.055, false);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = (1800 + (k % 3) * 650) * pitch;

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.26 * volume, kt);
      g.gain.exponentialRampToValueAtTime(0.001, kt + 0.05);

      src.connect(hp);
      hp.connect(g);
      g.connect(dest);
      src.start(kt);
      src.stop(kt + 0.06);
    }
  }

  // 5. PAPER_SNIP: Gunting memotong kertas ("KRES-SNIP!")
  else if (type === "paper_snip") {
    const src = createPaperNoise(0.09, false);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 2800 * pitch;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.36 * volume, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.085);

    src.connect(hp);
    hp.connect(g);
    g.connect(dest);
    src.start(t0);
    src.stop(t0 + 0.095);

    // Denting logam pisau gunting bertemu
    const osc = ctx.createOscillator();
    const og = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(3400 * pitch, t0 + 0.015);
    osc.frequency.exponentialRampToValueAtTime(1900 * pitch, t0 + 0.075);
    og.gain.setValueAtTime(0.18 * volume, t0 + 0.015);
    og.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);
    osc.connect(og);
    og.connect(dest);
    osc.start(t0 + 0.015);
    osc.stop(t0 + 0.085);
  }

  // 6. PAPER_POP: Diorama pop-up mekar ("PLAK-WUP!")
  else if (type === "paper_pop") {
    const osc = ctx.createOscillator();
    const og = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(135 * pitch, t0);
    osc.frequency.exponentialRampToValueAtTime(310 * pitch, t0 + 0.09);
    og.gain.setValueAtTime(0.38 * volume, t0);
    og.gain.exponentialRampToValueAtTime(0.001, t0 + 0.13);
    osc.connect(og);
    og.connect(dest);
    osc.start(t0);
    osc.stop(t0 + 0.14);

    // Desir kertas terbuka
    const src = createPaperNoise(0.11, true);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1650 * pitch;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.22 * volume, t0 + 0.015);
    ng.gain.exponentialRampToValueAtTime(0.001, t0 + 0.11);
    src.connect(bp);
    bp.connect(ng);
    ng.connect(dest);
    src.start(t0 + 0.015);
    src.stop(t0 + 0.12);
  }

  // 7. PAPER_SLAP: Kartu / beban kertas menepuk meja ("PLAK!")
  else if (type === "paper_slap") {
    const osc = ctx.createOscillator();
    const og = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(165 * pitch, t0);
    osc.frequency.exponentialRampToValueAtTime(58 * pitch, t0 + 0.095);
    og.gain.setValueAtTime(0.45 * volume, t0);
    og.gain.exponentialRampToValueAtTime(0.001, t0 + 0.11);
    osc.connect(og);
    og.connect(dest);
    osc.start(t0);
    osc.stop(t0 + 0.12);

    const src = createPaperNoise(0.075, false);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2100 * pitch;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.32 * volume, t0);
    ng.gain.exponentialRampToValueAtTime(0.001, t0 + 0.07);
    src.connect(bp);
    bp.connect(ng);
    ng.connect(dest);
    src.start(t0);
    src.stop(t0 + 0.08);
  }
}
`;

export const SAMPLE_CYBER_HUD_CODE = `// ===== GAYA =====
{
  "name": "Cyber HUD",
  "prompt": "Gaya tampilan HUD taktis sci-fi dengan wireframe neon presisi berwarna hijau neon #00FF66, cyan elektrik #00E5FF, dan aksen pink tajam #FF3366 di atas latar grid komputasi gelap. Komposisi terpusat dengan garis panduan sudut, counter digital berputar, dan efek glow bercahaya. Hindari tekstur coretan tangan atau warna kusam.",
  "look": "2d",
  "finish": "glow",
  "colors": ["#00FF66", "#00E5FF", "#FF3366"],
  "background": {
    "paper": { "top": "#0D1117", "bottom": "#161B22", "pattern": "hud" },
    "dusk": { "top": "#080C14", "bottom": "#0E1726", "pattern": "deepgrid" },
    "night": { "top": "#04060A", "bottom": "#070B12", "pattern": "grid" }
  }
}

// ===== SCENE 1 =====
s.sfx("blip", 0.1, 0.6);
s.sfx("laser", 0.8, 0.4);
const C_GREEN = s.c[0] || "#00FF66";
const C_CYAN = s.c[1] || "#00E5FF";

// Tactical HUD Box at Top
const k1 = s.spring(0.1, "snappy");
s.group({ x: 360, y: 340, scale: k1 }, () => {
  // Grid background
  s.rect(-280, -180, 560, 360, { stroke: "rgba(0, 229, 255, 0.25)", width: 1.5, fill: "rgba(4, 6, 10, 0.8)" });
  for (let x = -280; x <= 280; x += 56) {
    s.line(x, -180, x, 180, { stroke: "rgba(0, 229, 255, 0.08)", width: 1 });
  }
  for (let y = -180; y <= 180; y += 45) {
    s.line(-280, y, 280, y, { stroke: "rgba(0, 229, 255, 0.08)", width: 1 });
  }

  // Bracket Corners
  const bSize = 24;
  s.line(-280, -180, -280 + bSize, -180, { stroke: C_CYAN, width: 3 });
  s.line(-280, -180, -280, -180 + bSize, { stroke: C_CYAN, width: 3 });
  s.line(280, -180, 280 - bSize, -180, { stroke: C_CYAN, width: 3 });
  s.line(280, -180, 280, -180 + bSize, { stroke: C_CYAN, width: 3 });

  // VIEWS Header & Digital Counter
  s.rect(-260, -160, 110, 36, { fill: "rgba(0, 255, 102, 0.15)", stroke: C_GREEN, width: 1.5 });
  s.text("VIEWS", -205, -137, { size: 16, color: C_GREEN, align: "center" });

  const viewsCount = Math.floor(s.lerp(0, 1154, s.ease.out(s.clamp((s.t - 0.3) / 1.8, 0, 1))));
  s.text(viewsCount.toString(), 220, -135, { size: 36, color: C_GREEN, align: "right" });

  // Upward Growth Curve Graph
  const graphProgress = s.clamp((s.t - 0.4) / 1.6, 0, 1);
  const pts = [];
  const maxIdx = Math.floor(graphProgress * 30);
  for (let i = 0; i <= maxIdx; i++) {
    const ratio = i / 30;
    const gx = -240 + ratio * 460;
    const gy = 120 - Math.pow(ratio, 2.2) * 220;
    pts.push([gx, gy]);
  }
  if (pts.length > 1) {
    s.polyline(pts, { stroke: C_GREEN, width: 4, pen: true });
    const last = pts[pts.length - 1];
    s.circle(last[0], last[1], 8, { fill: C_GREEN, stroke: "#ffffff", width: 2 });
    s.rays(last[0], last[1], 12, 22, 6, { stroke: C_GREEN, width: 1.5, draw: s.at(1.2, 0.5) });
  }
});

// ===== SCENE 2 =====
s.sfx("type", 0.2, 0.4);
s.sfx("correct", 1.8, 0.6);
const C_GREEN2 = s.c[0] || "#00FF66";
const C_CYAN2 = s.c[1] || "#00E5FF";

// HARI KE-N Digital Counter
const dayNum = Math.min(6, Math.floor(s.lerp(0, 6, s.ease.out(s.clamp(s.t / 2.0, 0, 1)))));
s.text("HARI KE-" + dayNum, 360, 240, { size: 48, color: "#ffffff", align: "center" });

// 7 Consecutive Habit Checkboxes
const startX = 140;
const gap = 68;
for (let i = 0; i < 7; i++) {
  const cx = startX + i * gap;
  const cy = 360;
  const checked = i <= dayNum;
  const boxScale = s.stagger(i, 0.1, 0.08, "bouncy");

  s.group({ x: cx, y: cy, scale: boxScale }, () => {
    s.rect(-26, -26, 52, 52, {
      stroke: checked ? C_GREEN2 : "rgba(255,255,255,0.3)",
      width: 2,
      fill: checked ? "rgba(0, 255, 102, 0.15)" : "rgba(10, 15, 25, 0.6)",
      r: 8
    });
    if (checked) {
      s.check(0, 0, 26, { stroke: C_GREEN2, width: 3.5, draw: s.at(0.2 + i * 0.22, 0.3) });
    } else {
      s.text((i + 1).toString(), 0, 8, { size: 20, color: "rgba(255,255,255,0.5)", align: "center" });
    }
  });
}

// Progress Percentage Bar
const pct = Math.floor(s.lerp(0, 86, s.ease.out(s.clamp(s.t / 2.2, 0, 1))));
s.text(pct + "%", 360, 460, { size: 36, color: C_GREEN2, align: "center" });
s.rect(120, 500, 480, 16, { stroke: "rgba(0, 229, 255, 0.3)", width: 1.5, fill: "rgba(0,0,0,0.5)", r: 8 });
const fillW = Math.max(12, 480 * (pct / 100));
s.rect(120, 500, fillW, 16, { fill: C_GREEN2, r: 8 });

// ===== SCENE 3 =====
s.sfx("glitch", 0.2, 0.5);
s.sfx("magic", 1.8, 0.6);
const C_RED = s.c[2] || "#FF3366";
const C_GREEN3 = s.c[0] || "#00FF66";

const phase = s.t < 1.4 ? "broken" : "rebuilding";

if (phase === "broken") {
  // ERROR State
  const pulse = s.wave(8, 0.2, 0);
  s.rect(260, 180, 200, 42, { fill: "rgba(255, 51, 102, 0.2)", stroke: C_RED, width: 2, r: 8 });
  s.text("ERROR", 360, 210, { size: 26, color: C_RED, align: "center" });

  // Shattered Fragments Falling
  const fallT = s.clamp((s.t - 0.2) / 1.0, 0, 1);
  const pieces = [
    [-80, -60, -30 * fallT, -0.4 * fallT],
    [80, -60, 30 * fallT, 0.4 * fallT],
    [-70, 70, -25 * fallT, -0.2 * fallT],
    [70, 70, 25 * fallT, 0.3 * fallT],
  ];
  pieces.forEach(([x, y, dx, rot]) => {
    s.group({ x: 360 + x + dx, y: 380 + y + fallT * 120, rotate: rot }, () => {
      s.rect(-35, -35, 70, 70, { stroke: C_RED, width: 3, fill: "rgba(255, 51, 102, 0.15)", r: 6 });
    });
  });
} else {
  // REBUILT State
  const k3 = s.spring(1.4, "bouncy");
  s.group({ x: 360, y: 380, scale: k3 }, () => {
    s.circle(0, 0, 120, { stroke: C_GREEN3, width: 3, fill: "rgba(0, 255, 102, 0.12)" });
    s.rays(0, 0, 130, 170, 12, { stroke: C_GREEN3, width: 2, draw: s.at(1.6, 0.6) });
    // Reassembled Core
    s.rect(-45, -45, 90, 90, { stroke: C_GREEN3, width: 3, fill: "rgba(0, 255, 102, 0.25)", r: 10 });
    s.line(-45, 0, 45, 0, { stroke: C_GREEN3, width: 2 });
    s.line(0, -45, 0, 45, { stroke: C_GREEN3, width: 2 });
  });
  s.text("REBUILT", 360, 560, { size: 36, color: C_GREEN3, align: "center" });
}

// ===== SCENE 4 =====
s.sfx("tada", 0.3, 0.8);
s.sfx("sparkle", 1.2, 0.6);
const C_GREEN4 = s.c[0] || "#00FF66";
const C_CYAN4 = s.c[1] || "#00E5FF";

// Glowing Victory Trophy & Hexagon Ring
const k4 = s.spring(0.1, "snappy");
s.group({ x: 360, y: 340, scale: k4 }, () => {
  // Concentric Rings
  s.circle(0, 0, 150, { stroke: "rgba(0, 229, 255, 0.4)", width: 2 });
  s.circle(0, 0, 130, { stroke: C_GREEN4, width: 3, fill: "rgba(0, 255, 102, 0.1)" });
  s.rays(0, 0, 140, 190, 16, { stroke: C_GREEN4, width: 2 });

  // Trophy Cup
  s.rect(-40, -40, 80, 60, { stroke: "#ffffff", fill: C_GREEN4, width: 2.5, r: 8 });
  s.arc(0, -40, 40, 0, Math.PI, { stroke: "#ffffff", width: 2 });
  s.rect(-15, 20, 30, 40, { fill: "#ffffff" });
  s.rect(-35, 60, 70, 18, { fill: C_CYAN4, r: 4 });
  s.text("#1", 0, 2, { size: 32, color: "#000000", align: "center" });

  // Kinetic Light Burst
  s.burst(0, -40, 60, { count: 8, stroke: "#ffffff", draw: s.at(0.5, 0.6) });
});

// Cheering Faceless Figures at Sides
s.person(180, 560, { size: 220, pose: "cheer", facing: "right" });
s.person(540, 560, { size: 220, pose: "cheer", facing: "left" });
`;

export interface ReferenceFrameBuffer {
  width: number;
  height: number;
  data: Uint8ClampedArray | number[];
  dataUrl?: string;
  timestampSec?: number;
}

export type StyleArchetype =
  | 'clay_3d'
  | 'neon_hud'
  | 'sketch_paper'
  | 'isometric_3d'
  | 'flat_editorial'
  | 'kinetic_pop';

export interface VisualReferenceAnalysis {
  sourceType: 'foto' | 'video';
  suggestedName: string;
  detailedPrompt: string;
  look: '3d' | '2d';
  finish: 'scribble' | 'clean' | 'glossy' | 'glow';
  archetype: StyleArchetype;
  colors: [string, string, string];
  background: {
    paper: { top: string; bottom: string; pattern: string };
    dusk: { top: string; bottom: string; pattern: string };
    night: { top: string; bottom: string; pattern: string };
  };
  lightingMood: string;
  compositionNotes: string;
  motionNotes: string;
  avoidNotes: string;
  brightness: number;
  saturation: number;
  edgeDensity: number;
  motionEnergy?: number;
  frameThumbnails?: string[];
  detectedBy?: 'ai_vision' | 'deep_canvas';
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [clampByte(r), clampByte(g), clampByte(b)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = (hex || '').replace('#', '').trim();
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16) || 0,
      parseInt(clean[1] + clean[1], 16) || 0,
      parseInt(clean[2] + clean[2], 16) || 0,
    ];
  }
  return [
    parseInt(clean.slice(0, 2), 16) || 0,
    parseInt(clean.slice(2, 4), 16) || 0,
    parseInt(clean.slice(4, 6), 16) || 0,
  ];
}

function shiftHexBrightness(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  if (factor >= 0) {
    return rgbToHex(
      r + (255 - r) * factor,
      g + (255 - g) * factor,
      b + (255 - b) * factor
    );
  }
  const scale = 1 + factor;
  return rgbToHex(r * scale, g * scale, b * scale);
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

function colorDistance(a: [number, number, number], b: [number, number, number]): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11);
}

/**
 * Deeply analyzes one or more canvas pixel buffers (from reference photos or video keyframes)
 * to extract authentic hex palettes, background gradients, edge/texture density, 2D vs 3D look,
 * surface finish, and inter-frame motion dynamics.
 */
export function analyzeCanvasFramesForStyle(
  frames: ReferenceFrameBuffer[],
  options?: {
    sourceType?: 'foto' | 'video';
    filename?: string;
    userNote?: string;
    durationSec?: number;
  }
): VisualReferenceAnalysis {
  const sourceType = options?.sourceType || 'foto';
  const rawUserNote = (options?.userNote || '').trim();
  // Ignore auto-generated prompt paragraphs when extracting creator note keywords,
  // and strip any "Hindari ..." clause so avoided terms (e.g. "Hindari garis wireframe neon") never trigger positive matches.
  const isAutoGeneratedPrompt =
    rawUserNote.includes('Palet warna utama diambil langsung dari referensi:') ||
    rawUserNote.includes('WAJIB digambar faceless');
  const userNote = isAutoGeneratedPrompt ? '' : rawUserNote;
  const positiveNoteOnly = userNote.split(/hindari|jangan|dilarang/i)[0] || '';
  const noteLower = `${positiveNoteOnly} ${options?.filename || ''}`.toLowerCase();

  let totalLum = 0;
  let totalSat = 0;
  let totalPixels = 0;
  let warmPixels = 0;
  let coolPixels = 0;
  let edgeSum = 0;
  let smoothMidtoneCount = 0;

  const borderSamples: Array<[number, number, number]> = [];
  const accentCandidates: Array<{ rgb: [number, number, number]; score: number }> = [];

  for (const frame of frames) {
    const w = Math.max(1, frame.width || 32);
    const h = Math.max(1, frame.height || 32);
    const data = frame.data;
    if (!data || data.length < 4) continue;

    const lums = new Float32Array(w * h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const r = data[idx] ?? 0;
        const g = data[idx + 1] ?? 0;
        const b = data[idx + 2] ?? 0;
        const a = data[idx + 3] ?? 255;
        if (a < 32) continue;

        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        lums[y * w + x] = lum;
        const [hue, sat, light] = rgbToHsl(r, g, b);

        totalLum += (lum / 255) * 100;
        totalSat += sat;
        totalPixels++;

        if ((hue >= 0 && hue <= 70) || hue >= 320) warmPixels++;
        if (hue >= 160 && hue <= 290) coolPixels++;

        const isBorder = x < w * 0.15 || x > w * 0.85 || y < h * 0.15 || y > h * 0.85;
        if (isBorder) {
          borderSamples.push([r, g, b]);
        } else {
          // Foreground / subject weight
          const centerBonus = 1.25;
          const satWeight = sat * 1.4 + (light > 15 && light < 88 ? 25 : 0);
          accentCandidates.push({
            rgb: [r, g, b],
            score: satWeight * centerBonus,
          });
        }
      }
    }

    // Compute gradient / Sobel edge density & midtone smoothness
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const c = lums[y * w + x];
        const gx = Math.abs(lums[y * w + (x + 1)] - lums[y * w + (x - 1)]);
        const gy = Math.abs(lums[(y + 1) * w + x] - lums[(y - 1) * w + x]);
        const mag = Math.sqrt(gx * gx + gy * gy);
        edgeSum += mag;
        if (mag > 3 && mag < 26 && c > 35 && c < 225) {
          smoothMidtoneCount++;
        }
      }
    }
  }

  const safePixels = Math.max(1, totalPixels);
  const brightness = Math.round(totalLum / safePixels);
  const saturation = Math.round(totalSat / safePixels);
  const edgeDensity = Math.min(100, Math.round((edgeSum / safePixels) * 1.6));
  const smoothShadingRatio = smoothMidtoneCount / safePixels;

  // Measure inter-frame motion energy when multiple frames exist (e.g. video keyframes)
  let motionEnergy = sourceType === 'video' ? 52 : 38;
  if (frames.length >= 2) {
    let diffAccum = 0;
    let diffCount = 0;
    for (let f = 0; f < frames.length - 1; f++) {
      const fA = frames[f];
      const fB = frames[f + 1];
      const len = Math.min(fA.data.length, fB.data.length);
      for (let i = 0; i < len; i += 4) {
        const dR = Math.abs((fA.data[i] || 0) - (fB.data[i] || 0));
        const dG = Math.abs((fA.data[i + 1] || 0) - (fB.data[i + 1] || 0));
        const dB = Math.abs((fA.data[i + 2] || 0) - (fB.data[i + 2] || 0));
        diffAccum += (dR + dG + dB) / 3;
        diffCount++;
      }
    }
    if (diffCount > 0) {
      motionEnergy = Math.max(12, Math.min(98, Math.round((diffAccum / diffCount) * 1.85)));
    }
  }

  // Cluster top 3 distinct foreground/accent colors
  accentCandidates.sort((a, b) => b.score - a.score);
  const chosenRgbs: Array<[number, number, number]> = [];
  for (const cand of accentCandidates) {
    if (chosenRgbs.length >= 3) break;
    const tooClose = chosenRgbs.some((existing) => colorDistance(existing, cand.rgb) < 42);
    if (!tooClose) {
      chosenRgbs.push(cand.rgb);
    }
  }
  // If image is nearly monochrome, synthesize harmonious distinct colors from dominant tone
  if (chosenRgbs.length === 0 && borderSamples.length > 0) {
    chosenRgbs.push(borderSamples[0]);
  }
  while (chosenRgbs.length < 3) {
    const base = chosenRgbs[0] || [37, 99, 235];
    if (chosenRgbs.length === 1) {
      chosenRgbs.push([
        clampByte(base[2] * 0.8 + 40),
        clampByte(base[0] * 0.7 + 55),
        clampByte(base[1] * 0.9 + 30),
      ]);
    } else {
      chosenRgbs.push([
        clampByte(255 - base[0] * 0.5),
        clampByte(base[1] * 0.6 + 80),
        clampByte(base[2] * 0.5 + 90),
      ]);
    }
  }

  const colors: [string, string, string] = [
    rgbToHex(chosenRgbs[0][0], chosenRgbs[0][1], chosenRgbs[0][2]),
    rgbToHex(chosenRgbs[1][0], chosenRgbs[1][1], chosenRgbs[1][2]),
    rgbToHex(chosenRgbs[2][0], chosenRgbs[2][1], chosenRgbs[2][2]),
  ];

  // Compute average border background RGB
  let bgR = 248;
  let bgG = 246;
  let bgB = 240;
  if (borderSamples.length > 0) {
    let sr = 0;
    let sg = 0;
    let sb = 0;
    for (const [r, g, b] of borderSamples) {
      sr += r;
      sg += g;
      sb += b;
    }
    bgR = Math.round(sr / borderSamples.length);
    bgG = Math.round(sg / borderSamples.length);
    bgB = Math.round(sb / borderSamples.length);
  }
  const baseBgHex = rgbToHex(bgR, bgG, bgB);

  // Determine Archetype, Look ('3d' | '2d'), and Finish ('scribble' | 'clean' | 'glossy' | 'glow')
  let archetype: StyleArchetype = 'clay_3d';
  let look: '3d' | '2d' = '3d';
  let finish: 'scribble' | 'clean' | 'glossy' | 'glow' = 'glossy';

  if (
    noteLower.includes('hud') ||
    noteLower.includes('neon') ||
    noteLower.includes('cyber') ||
    noteLower.includes('glow') ||
    (brightness < 34 && saturation >= 28)
  ) {
    archetype = 'neon_hud';
    look = noteLower.includes('3d') ? '3d' : '2d';
    finish = 'glow';
  } else if (
    noteLower.includes('sketsa') ||
    noteLower.includes('scribble') ||
    noteLower.includes('coret') ||
    noteLower.includes('tangan') ||
    noteLower.includes('kertas') ||
    (edgeDensity >= 30 && brightness >= 60)
  ) {
    archetype = 'sketch_paper';
    look = noteLower.includes('2d') ? '2d' : '3d';
    finish = 'scribble';
  } else if (
    noteLower.includes('iso') ||
    noteLower.includes('diorama') ||
    noteLower.includes('balok') ||
    (edgeDensity >= 22 && brightness >= 34 && brightness < 62)
  ) {
    archetype = 'isometric_3d';
    look = '3d';
    finish = 'clean';
  } else if (
    noteLower.includes('flat') ||
    noteLower.includes('2d') ||
    noteLower.includes('editorial') ||
    noteLower.includes('minimal') ||
    (smoothShadingRatio < 0.16 && edgeDensity < 22 && !noteLower.includes('3d'))
  ) {
    archetype = 'flat_editorial';
    look = '2d';
    finish = 'clean';
  } else if (
    noteLower.includes('pop') ||
    noteLower.includes('energi') ||
    (saturation >= 58 && motionEnergy >= 55)
  ) {
    archetype = 'kinetic_pop';
    look = '3d';
    finish = 'glossy';
  } else {
    archetype = 'clay_3d';
    look = '3d';
    finish = 'glossy';
  }

  // Build background presets tailored to archetype and sampled border color
  const paperTop = brightness >= 65 ? baseBgHex : shiftHexBrightness(colors[0], 0.88);
  const paperBottom = shiftHexBrightness(paperTop, -0.06);
  const duskTop =
    brightness >= 32 && brightness < 65 ? baseBgHex : shiftHexBrightness(colors[1], -0.58);
  const duskBottom = shiftHexBrightness(duskTop, -0.28);
  const nightTop = brightness < 32 ? baseBgHex : shiftHexBrightness(colors[0], -0.82);
  const nightBottom = shiftHexBrightness(nightTop, -0.35);

  const patternMap: Record<StyleArchetype, { paper: string; dusk: string; night: string }> = {
    clay_3d: { paper: 'softgrid', dusk: 'dots', night: 'stars' },
    neon_hud: { paper: 'hud', dusk: 'deepgrid', night: 'grid' },
    sketch_paper: { paper: 'grain', dusk: 'chalk', night: 'dots' },
    isometric_3d: { paper: 'grid', dusk: 'horizon', night: 'deepgrid' },
    flat_editorial: { paper: 'dots', dusk: 'lines', night: 'navy' },
    kinetic_pop: { paper: 'sunburst', dusk: 'dotsup', night: 'stars' },
  };

  const background = {
    paper: { top: paperTop, bottom: paperBottom, pattern: patternMap[archetype].paper },
    dusk: { top: duskTop, bottom: duskBottom, pattern: patternMap[archetype].dusk },
    night: { top: nightTop, bottom: nightBottom, pattern: patternMap[archetype].night },
  };

  const isWarm = warmPixels >= coolPixels;
  const nameByArchetype: Record<StyleArchetype, string> = {
    clay_3d: isWarm ? 'Clay Warm 3D' : 'Tactile Studio 3D',
    neon_hud: 'Neon Pulse HUD',
    sketch_paper: 'Ink Scribble Craft',
    isometric_3d: 'Iso Diorama 3D',
    flat_editorial: 'Clean Editorial 2D',
    kinetic_pop: 'Kinetic Pop 3D',
  };

  const cleanFilename = (options?.filename || '')
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b(screen recording|screenshot|whatsapp|image|video|img|vid|[a-f0-9]{6,}|\d{4,})\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const suggestedName =
    cleanFilename && cleanFilename.length >= 3 && cleanFilename.length <= 24
      ? cleanFilename
          .split(/\s+/)
          .slice(0, 3)
          .map((w) =>
            /^(2d|3d|hud)$/i.test(w)
              ? w.toUpperCase()
              : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
          )
          .join(' ')
      : nameByArchetype[archetype];

  const lightingMood =
    brightness < 35
      ? `Pencahayaan malam dramatis berkontras tinggi (${brightness}% kecerahan) dengan pendaran cahaya aksen ${isWarm ? 'hangat' : 'dingin elektrik'} di atas latar gelap ${nightTop}`
      : brightness > 70
      ? `Cahaya studio terang bersih (${brightness}% kecerahan) bernuansa ${isWarm ? 'krem hangat alami' : 'sejuk modern'} di atas permukaan latar ${paperTop}`
      : `Pencahayaan sinematik seimbang (${brightness}% kecerahan, saturasi ${saturation}%) dengan bayangan lembut berlapis`;

  const shapeDescByArchetype: Record<StyleArchetype, string> = {
    clay_3d:
      'Gaya visual 3D taktil bervolume empuk (clay/soft-3D) dengan sudut membulat lembut (round 0.65) dan permukaan mengilap glossy',
    neon_hud:
      'Gaya visual HUD taktis berpresisi tinggi dengan garis pendar neon glow, bingkai sudut geometris, dan indikator data bercahaya',
    sketch_paper:
      'Gaya ilustrasi coretan tinta tangan (scribble) dengan siluet bergoyang organik, arsiran bayangan hidup, dan tekstur kertas kerajinan',
    isometric_3d:
      'Gaya diorama isometrik 3D terstruktur dengan balok dan silinder presisi di atas grid arsitektural yang rapi',
    flat_editorial:
      'Gaya ilustrasi 2D flat editorial modern dengan kartu berlapis bersih, bentuk geometris tegas, dan tipografi kinetik tajam',
    kinetic_pop:
      'Gaya visual 3D pop kinetik penuh energi dengan objek bervolume tebal, warna jenuh mencolok, dan aksen burst dinamis',
  };

  const compositionNotes =
    look === '3d'
      ? 'Komposisi terpusat di kanvas vertikal 9:16 (pusat fokus 360, 400) dengan kamera sudut 3/4 (rx -0.32), bayangan tanah lembut di y=760, dan kedalaman objek berlapis.'
      : 'Komposisi poster vertikal 9:16 yang rapi dan terpusat di (360, 390) dengan hierarki kartu visual, ikonografi tegas, dan ruang napas proporsional.';

  const motionNotes =
    sourceType === 'video'
      ? motionEnergy >= 60
        ? `Gerakan diadaptasi dari ritme video referensi (energi gerak ${motionEnergy}%): transisi masuk cepat memakai fisika pegas s.spring("bouncy") dan s.stagger rapat, disertai efek pantulan s.pop serta burst energi di titik klimaks.`
        : `Gerakan mengikuti tempo video referensi yang terukur (energi gerak ${motionEnergy}%): objek masuk mengalir dengan s.spring("snappy"), rotasi s.wave halus, dan progres angka/elemen yang stabil sepanjang durasi scene.`
      : finish === 'glow'
      ? 'Gerakan presisi cepat dengan s.spring("snappy"), garis kurva yang digambar pena cahaya (pen: true), dan pulsa cahaya konstan.'
      : finish === 'scribble'
      ? 'Gerakan organik ekspresif dengan pegas s.spring("bouncy"), goresan outline progresif (draw), dan goyangan tangan halus.'
      : 'Gerakan bertenaga namun mulus menggunakan fisika pegas s.spring("snappy") untuk objek utama, s.stagger berurutan, dan ayunan mengambang s.wave.';

  const avoidNotes =
    look === '2d'
      ? 'Hindari objek 3D bervolume berat, tekstur foto bitmap realistis, warna kusam yang bertabrakan dengan latar, dan DILARANG menggambar wajah.'
      : finish === 'glow'
      ? 'Hindari tekstur kertas kusam, coretan pensil kasar, warna pastel pucat di latar terang, dan DILARANG menggambar wajah.'
      : 'Hindari garis wireframe neon sci-fi yang kaku, kerumitan detail kecil yang memenuhi layar, foto bitmap, dan DILARANG menggambar wajah.';

  const userExtraNote = userNote ? ` Catatan tambahan kreator: ${userNote}.` : '';

  const detailedPrompt = `${shapeDescByArchetype[archetype]}.${userExtraNote} ${lightingMood}. Palet warna utama diambil langsung dari referensi: ${colors[0]} (utama), ${colors[1]} (sekunder), dan ${colors[2]} (aksen kontras) dengan latar terang ${paperTop} dan latar malam ${nightTop}. ${compositionNotes} ${motionNotes} Semua karakter atau tokoh manusia WAJIB digambar faceless (kepala polos tanpa mata, alis, hidung, mulut, atau ekspresi wajah; emosi disampaikan lewat postur tubuh). ${avoidNotes}`;

  return {
    sourceType,
    suggestedName,
    detailedPrompt,
    look,
    finish,
    archetype,
    colors,
    background,
    lightingMood,
    compositionNotes,
    motionNotes,
    avoidNotes,
    brightness,
    saturation,
    edgeDensity,
    motionEnergy,
    frameThumbnails: frames.map((f) => f.dataUrl).filter((u): u is string => Boolean(u)),
    detectedBy: 'deep_canvas',
  };
}

/**
 * Synthesizes a complete, executable `// ===== GAYA =====` + `// ===== SCENE 1..4 =====` code block
 * directly from a `VisualReferenceAnalysis` so the preview & saved style genuinely match the uploaded photo/video reference.
 */
export function generateCustomStyleCodeFromAnalysis(
  analysis: VisualReferenceAnalysis,
  customName?: string,
  customPrompt?: string
): string {
  const finalName = (customName || analysis.suggestedName || 'Gaya Referensi').trim();
  const finalPrompt = (customPrompt || analysis.detailedPrompt).trim();
  const [c0, c1, c2] = analysis.colors;
  const springPreset =
    (analysis.motionEnergy ?? 50) >= 62
      ? 'bouncy'
      : (analysis.motionEnergy ?? 50) <= 30
      ? 'smooth'
      : 'snappy';

  const metadataObj = {
    name: finalName,
    prompt: finalPrompt,
    look: analysis.look,
    finish: analysis.finish,
    colors: [c0, c1, c2],
    mascot: '',
    background: analysis.background,
  };

  const gayaJson = JSON.stringify(metadataObj, null, 2);

  if (analysis.archetype === 'neon_hud') {
    return `// ===== GAYA =====
${gayaJson}

// ===== SCENE 1 =====
s.sfx("blip", 0.1, 0.6);
s.sfx("laser", 0.8, 0.4);
const C0 = s.c[0] || "${c0}";
const C1 = s.c[1] || "${c1}";
const C2 = s.c[2] || "${c2}";

const k1 = s.spring(0.1, "${springPreset}");
s.group({ x: 360, y: 360, scale: k1 }, () => {
  s.rect(-270, -190, 540, 380, { stroke: C1, width: 2, fill: "rgba(6, 10, 18, 0.82)", r: 16 });
  for (let gx = -220; gx <= 220; gx += 55) {
    s.line(gx, -190, gx, 190, { stroke: "rgba(255,255,255,0.07)", width: 1 });
  }
  for (let gy = -150; gy <= 150; gy += 50) {
    s.line(-270, gy, 270, gy, { stroke: "rgba(255,255,255,0.07)", width: 1 });
  }
  s.rect(-240, -160, 130, 34, { fill: C0, r: 8 });
  s.text("STEP 01", -175, -137, { size: 16, color: "#05070F", align: "center" });

  const pct = Math.floor(s.lerp(1, 100, s.ease.out(s.clamp((s.t - 0.2) / 2.1, 0, 1))));
  s.text(pct + "%", 220, -132, { size: 36, color: C0, align: "right" });

  const prog = s.clamp((s.t - 0.25) / 1.9, 0, 1);
  const pts = [];
  const steps = Math.max(2, Math.floor(prog * 28));
  for (let i = 0; i <= steps; i++) {
    const r = i / 28;
    pts.push([-220 + r * 440, 120 - Math.pow(r, 1.8) * 210]);
  }
  s.polyline(pts, { stroke: C0, width: 4, pen: true });
  const tip = pts[pts.length - 1];
  s.circle(tip[0], tip[1], 9, { fill: C2, stroke: "#ffffff", width: 2 });
  s.rays(tip[0], tip[1], 14, 28, 8, { stroke: C1, width: 2, draw: s.at(1.0, 0.5) });
});

// ===== SCENE 2 =====
s.sfx("type", 0.15, 0.5);
s.sfx("correct", 1.7, 0.6);
const C0_2 = s.c[0] || "${c0}";
const C1_2 = s.c[1] || "${c1}";

const activeDay = Math.min(6, Math.floor(s.lerp(0, 7, s.ease.out(s.clamp(s.t / 2.2, 0, 1)))));
s.text("KONSISTEN HARI KE-" + (activeDay + 1), 360, 230, { size: 36, color: "#ffffff", align: "center" });

for (let i = 0; i < 7; i++) {
  const cx = 132 + i * 76;
  const done = i <= activeDay;
  const sc = s.stagger(i, 0.08, 0.08, "${springPreset}");
  s.group({ x: cx, y: 360, scale: sc }, () => {
    s.rect(-28, -28, 56, 56, {
      stroke: done ? C0_2 : C1_2,
      width: 2.5,
      fill: done ? C0_2 : "rgba(15, 23, 42, 0.7)",
      r: 12
    });
    if (done) {
      s.check(0, 0, 24, { stroke: "#05070F", width: 3.5, draw: s.at(0.15 + i * 0.2, 0.3) });
    } else {
      s.text((i + 1).toString(), 0, 7, { size: 18, color: "#ffffff", align: "center" });
    }
  });
}

const barK = s.clamp(s.t / 2.4, 0, 1);
s.rect(120, 470, 480, 18, { stroke: C1_2, width: 1.5, fill: "rgba(0,0,0,0.45)", r: 9 });
s.rect(120, 470, Math.max(18, 480 * barK), 18, { fill: C0_2, r: 9 });

// ===== SCENE 3 =====
s.sfx("glitch", 0.2, 0.5);
s.sfx("magic", 1.5, 0.7);
const C0_3 = s.c[0] || "${c0}";
const C2_3 = s.c[2] || "${c2}";

if (s.t < 1.35) {
  const drop = s.clamp((s.t - 0.15) / 1.0, 0, 1);
  s.rect(240, 190, 240, 44, { fill: C2_3, r: 10 });
  s.text("PROSES ULANG", 360, 220, { size: 22, color: "#ffffff", align: "center" });
  for (let i = 0; i < 4; i++) {
    const ox = (i % 2 === 0 ? -1 : 1) * (55 + i * 12);
    const oy = (i < 2 ? -55 : 55) + drop * 95;
    s.group({ x: 360 + ox, y: 390 + oy, rotate: (i - 1.5) * 0.25 * drop }, () => {
      s.rect(-36, -36, 72, 72, { stroke: C2_3, width: 3, fill: "rgba(255,255,255,0.08)", r: 10 });
    });
  }
} else {
  const reb = s.spring(1.35, "bouncy");
  s.group({ x: 360, y: 390, scale: reb }, () => {
    s.circle(0, 0, 125, { stroke: C0_3, width: 3, fill: "rgba(255,255,255,0.06)" });
    s.rays(0, 0, 136, 178, 12, { stroke: C0_3, width: 2.5, draw: s.at(1.45, 0.5) });
    s.rect(-52, -52, 104, 104, { fill: C0_3, stroke: "#ffffff", width: 2.5, r: 16 });
    s.check(0, 0, 48, { stroke: "#05070F", width: 5, draw: s.at(1.5, 0.4) });
  });
  s.text("BANGKIT LEBIH KUAT", 360, 575, { size: 30, color: C0_3, align: "center" });
}

// ===== SCENE 4 =====
s.sfx("tada", 0.25, 0.8);
s.sfx("sparkle", 1.1, 0.6);
const C0_4 = s.c[0] || "${c0}";
const C1_4 = s.c[1] || "${c1}";
const C2_4 = s.c[2] || "${c2}";

const k4 = s.spring(0.1, "${springPreset}");
s.group({ x: 360, y: 340, scale: k4 }, () => {
  s.circle(0, 0, 148, { stroke: C1_4, width: 2 });
  s.circle(0, 0, 122, { stroke: C0_4, width: 3, fill: "rgba(255,255,255,0.08)" });
  s.rays(0, 0, 132, 185, 16, { stroke: C0_4, width: 2.5, draw: s.at(0.3, 0.6) });
  s.rect(-44, -48, 88, 66, { fill: C0_4, stroke: "#ffffff", width: 2.5, r: 10 });
  s.rect(-16, 18, 32, 42, { fill: "#ffffff" });
  s.rect(-38, 60, 76, 18, { fill: C2_4, r: 6 });
  s.text("#1", 0, -6, { size: 32, color: "#05070F", align: "center" });
  s.burst(0, -40, 72, { count: 10, stroke: C2_4, draw: s.at(0.45, 0.5) });
});
s.person(175, 565, { size: 215, pose: "cheer", facing: "right" });
s.person(545, 565, { size: 215, pose: "cheer", facing: "left" });
`;
  }

  if (analysis.look === '2d') {
    // 2D Clean Editorial or 2D Sketch Paper (strictly 2D primitives only)
    return `// ===== GAYA =====
${gayaJson}

// ===== SCENE 1 =====
s.sfx("pop", 0.15, 0.7);
s.sfx("sparkle", 0.9, 0.5);
const C0 = s.c[0] || "${c0}";
const C1 = s.c[1] || "${c1}";
const C2 = s.c[2] || "${c2}";

s.ground(760, 70, 650, { stroke: C1, width: 3 });
const k1 = s.spring(0.1, "${springPreset}");
const grow = s.ease.out(s.clamp((s.t - 0.3) / 1.8, 0, 1));

s.group({ x: 360, y: 420, scale: k1, rotate: s.wave(1.5, 0.03) }, () => {
  s.card(-250, -210, 500, 380, { fill: "#ffffff", r: 28, stroke: C1, width: 3 });
  s.rect(-210, -170, 130, 36, { fill: C0, r: 18 });
  s.text("LANGKAH 1", -145, -146, { size: 16, color: "#ffffff", align: "center" });

  // Growing seedling / bar illustration in 2D
  const stemH = s.lerp(40, 165, grow);
  s.line(0, 110, 0, 110 - stemH, { stroke: C1, width: 8, draw: s.at(0.2, 0.9) });
  s.ellipse(-34, 110 - stemH * 0.6, 32 * grow, 16 * grow, { fill: C0, stroke: C1, width: 2.5 });
  s.ellipse(34, 110 - stemH * 0.8, 36 * grow, 18 * grow, { fill: C0, stroke: C1, width: 2.5 });
  s.circle(0, 110 - stemH, 26 * grow, { fill: C2, stroke: "#ffffff", width: 3 });
  s.rays(0, 110 - stemH, 34, 62, 8, { stroke: C2, width: 2.5, draw: s.at(0.8, 0.5) });
});

// ===== SCENE 2 =====
s.sfx("click", 0.2, 0.6);
s.sfx("ding", 1.6, 0.7);
const C0_2 = s.c[0] || "${c0}";
const C1_2 = s.c[1] || "${c1}";
const C2_2 = s.c[2] || "${c2}";

const k2 = s.spring(0.08, "${springPreset}");
s.group({ x: 360, y: 390, scale: k2 }, () => {
  s.card(-265, -200, 530, 400, { fill: "#ffffff", r: 28, stroke: C0_2, width: 3 });
  s.rect(-265, -200, 530, 68, { fill: C0_2, r: 24 });
  s.text("JADWAL KONSISTEN", 0, -155, { size: 26, color: "#ffffff", align: "center" });

  for (let i = 0; i < 6; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const bx = -150 + col * 150;
    const by = -55 + row * 125;
    const itemK = s.stagger(i, 0.18, 0.12, "${springPreset}");
    const checked = s.t >= 0.35 + i * 0.28;
    s.group({ x: bx, y: by, scale: itemK }, () => {
      s.rect(-52, -42, 104, 84, {
        fill: checked ? C2_2 : "#F8FAFC",
        stroke: checked ? C0_2 : C1_2,
        width: 2.5,
        r: 16
      });
      if (checked) {
        s.check(0, 0, 32, { stroke: "#ffffff", width: 4, draw: s.at(0.35 + i * 0.28, 0.3) });
      } else {
        s.text("H-" + (i + 1), 0, 8, { size: 20, color: C1_2, align: "center" });
      }
    });
  }
});

// ===== SCENE 3 =====
s.sfx("thud", 0.2, 0.6);
s.sfx("magic", 1.45, 0.7);
const C0_3 = s.c[0] || "${c0}";
const C1_3 = s.c[1] || "${c1}";
const C2_3 = s.c[2] || "${c2}";

if (s.t < 1.35) {
  const slip = s.ease.in(s.clamp(s.t / 1.1, 0, 1));
  s.group({ x: 360, y: 340 + slip * 90, rotate: -0.18 * slip }, () => {
    s.card(-160, -110, 320, 220, { fill: "#ffffff", r: 24, stroke: C2_3, width: 3 });
    s.cross(0, -10, 54, { stroke: C2_3, width: 5, draw: s.at(0.15, 0.4) });
    s.text("COBA LAGI", 0, 72, { size: 24, color: C2_3, align: "center" });
  });
} else {
  const rise = s.spring(1.35, "bouncy");
  s.group({ x: 360, y: 370, scale: rise }, () => {
    s.card(-210, -150, 420, 300, { fill: "#ffffff", r: 28, stroke: C0_3, width: 3.5 });
    s.circle(0, -25, 64, { fill: C0_3 });
    s.check(0, -25, 44, { stroke: "#ffffff", width: 5, draw: s.at(1.45, 0.4) });
    s.rays(0, -25, 76, 112, 12, { stroke: C2_3, width: 3, draw: s.at(1.5, 0.5) });
    s.text("BANGKIT LEBIH KUAT", 0, 95, { size: 28, color: C1_3, align: "center" });
  });
}

// ===== SCENE 4 =====
s.sfx("tada", 0.2, 0.8);
s.sfx("clap", 1.0, 0.5);
const C0_4 = s.c[0] || "${c0}";
const C1_4 = s.c[1] || "${c1}";
const C2_4 = s.c[2] || "${c2}";

const k4 = s.spring(0.1, "${springPreset}");
s.group({ x: 360, y: 350, scale: k4 }, () => {
  s.rays(0, 0, 120, 195, 16, { stroke: C2_4, width: 3, draw: s.at(0.25, 0.6) });
  s.circle(0, 0, 115, { fill: C0_4, stroke: "#ffffff", width: 4 });
  s.shape(s.shapes.star(5, 68, 30), { fill: C2_4, stroke: "#ffffff", width: 3 });
  s.burst(0, 0, 130, { count: 12, stroke: C1_4, draw: s.at(0.4, 0.5) });
});
s.person(180, 575, { size: 210, pose: "cheer", facing: "right" });
s.person(540, 575, { size: 210, pose: "cheer", facing: "left" });
`;
  }

  // Default & 3D Archetypes ('clay_3d', 'isometric_3d', 'kinetic_pop', or 3D 'sketch_paper')
  // Handcrafted multi-part 3D objects matching satsetmotion.id/app studio quality (NO bare box+sphere AI slop)
  const roundVal = analysis.archetype === 'isometric_3d' ? 0.25 : 0.68;
  const edgeVal = analysis.finish === 'scribble' ? 'strong' : 'soft';

  return `// ===== GAYA =====
${gayaJson}

// ===== SCENE 1 =====
s.sfx("pop", 0.12, 0.7);
s.sfx("drop", 0.55, 0.5);
s.sfx("sparkle", 1.15, 0.65);
const C0 = s.c[0] || "${c0}";
const C1 = s.c[1] || "${c1}";
const C2 = s.c[2] || "${c2}";

const k1 = s.spring(0.08, "${springPreset}");
const grow = s.ease.out(s.clamp((s.t - 0.22) / 1.85, 0, 1));
const sway = s.wave(1.4, 0.06);
const rx = -0.32;
const ry = -0.38 + s.wave(0.9, 0.08);

// Editorial chapter header badge
s.group({ x: 360, y: 155, scale: s.spring(0.05, "snappy") }, () => {
  s.rect(-115, -22, 230, 44, { fill: C0, r: 22, stroke: "#ffffff", width: 2.5 });
  s.text("BAB 01 · MULAI KECIL", 0, 6, { size: 17, color: "#ffffff", align: "center" });
});

s.shadow(360, 685, s.lerp(95, 155, grow));
s.group({ x: 360, y: 475 + s.wave(1.5, 5), scale: k1 }, () => {
  // Handcrafted multi-part 3D Terracotta Planter Pot + Saucer + Rim + Soil
  s.cylinder(0, 172, 118, 22, { fill: C1, rx, ry, edges: "${edgeVal}" });
  s.cylinder(0, 118, 92, 96, { fill: C0, rx, ry, edges: "${edgeVal}" });
  s.cylinder(0, 68, 104, 24, { fill: C0, rx, ry, edges: "${edgeVal}" });
  s.cylinder(0, 58, 86, 12, { fill: "#3E2723", rx, ry, edges: "none" });

  // Multi-segment growing stem + articulated 3D leaves + blooming flower crown
  const stemH = s.lerp(24, 175, grow);
  s.group({ x: 0, y: 55, rotate: sway }, () => {
    s.cylinder(0, -stemH * 0.5, 11, stemH, { fill: "#2E7D32", rx, ry, edges: "${edgeVal}" });

    if (grow > 0.2) {
      const leafK = s.clamp((grow - 0.2) / 0.6, 0, 1);
      // Left & right sculpted leaves
      s.box(-38 * leafK, -stemH * 0.45, 52 * leafK, 16, 28 * leafK, {
        fill: "#43A047",
        rx: rx + 0.15,
        ry: ry - 0.3,
        round: 0.8,
        edges: "${edgeVal}"
      });
      s.box(40 * leafK, -stemH * 0.68, 56 * leafK, 16, 30 * leafK, {
        fill: "#66BB6A",
        rx: rx - 0.12,
        ry: ry + 0.35,
        round: 0.8,
        edges: "${edgeVal}"
      });
    }

    // Blooming multi-petal flower crown at tip
    const bloomK = s.pop(0.55, 0.55);
    const tipY = -stemH - 18;
    for (let p = 0; p < 5; p++) {
      const ang = (p / 5) * Math.PI * 2 + s.t * 0.4;
      const px = Math.cos(ang) * 28 * bloomK;
      const py = tipY + Math.sin(ang) * 16 * bloomK;
      s.sphere(px, py, 18 * bloomK, { fill: C2, edges: "${edgeVal}" });
    }
    s.sphere(0, tipY, 22 * bloomK, { fill: C0, edges: "${edgeVal}" });
    s.rays(0, tipY, 44, 78, 10, { stroke: C2, width: 2.5, draw: s.at(0.75, 0.55) });
  });
});

// ===== SCENE 2 =====
s.sfx("click", 0.2, 0.6);
s.sfx("tick", 0.7, 0.5);
s.sfx("ding", 1.75, 0.75);
const C0_2 = s.c[0] || "${c0}";
const C1_2 = s.c[1] || "${c1}";
const C2_2 = s.c[2] || "${c2}";
const rx2 = -0.26;
const ry2 = -0.24 + s.wave(0.8, 0.06);

const boardK = s.spring(0.06, "${springPreset}");
s.shadow(360, 695, 165 * boardK);
s.group({ x: 360, y: 420, scale: boardK }, () => {
  // 3D Tactile Habit Tracker Board with Metal Clip & Binding Rings
  s.box(0, 10, 420, 430, 34, {
    fill: "#F8FAFC",
    rx: rx2,
    ry: ry2,
    round: ${roundVal},
    edges: "${edgeVal}"
  });
  // Top header bar on board
  s.box(0, -165, 390, 64, 40, {
    fill: C0_2,
    rx: rx2,
    ry: ry2,
    round: 0.45,
    edges: "${edgeVal}"
  });
  // Metallic binder rings at top edge
  for (let r = -1; r <= 1; r++) {
    s.cylinder(r * 115, -205, 14, 28, { fill: C2_2, rx: rx2, ry: ry2, edges: "${edgeVal}" });
  }
  s.text("STREAK 7 HARI", 0, -158, { size: 24, color: "#ffffff", align: "center" });

  // 6 Tactile 3D Day Tiles (2 rows x 3 columns) with checkmarks
  for (let i = 0; i < 6; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const tx = (col - 1) * 118;
    const ty = -52 + row * 118;
    const tileK = s.stagger(i, 0.14, 0.1, "${springPreset}");
    const done = s.t >= 0.32 + i * 0.25;
    s.group({ x: tx, y: ty, scale: tileK }, () => {
      s.box(0, 0, 92, 88, 26, {
        fill: done ? C1_2 : "#E2E8F0",
        rx: rx2,
        ry: ry2,
        round: 0.5,
        edges: "${edgeVal}"
      });
      if (done) {
        s.check(0, -4, 30, {
          stroke: "#ffffff",
          width: 4.5,
          draw: s.at(0.32 + i * 0.25, 0.3)
        });
      } else {
        s.text("H" + (i + 1), 0, 6, { size: 20, color: "#475569", align: "center" });
      }
    });
  }

  // Bottom progress meter pill
  const prog2 = s.ease.out(s.clamp((s.t - 0.2) / 2.1, 0, 1));
  s.rect(-160, 152, 320, 20, { fill: "#E2E8F0", r: 10 });
  s.rect(-160, 152, Math.max(24, 320 * prog2), 20, { fill: C0_2, r: 10 });
});

// ===== SCENE 3 =====
s.sfx("thud", 0.18, 0.7);
s.sfx("magic", 1.4, 0.8);
const C0_3 = s.c[0] || "${c0}";
const C1_3 = s.c[1] || "${c1}";
const C2_3 = s.c[2] || "${c2}";
const rx3 = -0.3;
const ry3 = -0.35 + s.wave(1.0, 0.08);

// Kintsugi / Rebuilt Monument: splits apart in phase 1, mends with glowing golden seams in phase 2
const splitT = s.t < 1.3 ? s.ease.out(s.clamp(s.t / 1.1, 0, 1)) : 1 - s.ease.out(s.clamp((s.t - 1.3) / 0.55, 0, 1));
const mendK = s.clamp((s.t - 1.35) / 0.8, 0, 1);

s.shadow(360, 690, 155);
s.group({ x: 360, y: 430 }, () => {
  // Base pedestal with stepped rings
  s.cylinder(0, 165, 138, 28, { fill: C1_3, rx: rx3, ry: ry3, edges: "${edgeVal}" });
  s.cylinder(0, 138, 108, 24, { fill: C1_3, rx: rx3, ry: ry3, edges: "${edgeVal}" });

  // Left half of sculpted core
  s.group({ x: -46 - splitT * 42, y: 15 + splitT * 18, rotate: -splitT * 0.22 }, () => {
    s.box(0, 0, 88, 165, 96, { fill: C0_3, rx: rx3, ry: ry3, round: ${roundVal}, edges: "${edgeVal}" });
    s.cylinder(0, -92, 34, 24, { fill: C2_3, rx: rx3, ry: ry3, edges: "${edgeVal}" });
  });

  // Right half of sculpted core
  s.group({ x: 46 + splitT * 42, y: 15 + splitT * 22, rotate: splitT * 0.24 }, () => {
    s.box(0, 0, 88, 165, 96, { fill: C0_3, rx: rx3, ry: ry3, round: ${roundVal}, edges: "${edgeVal}" });
    s.cylinder(0, -92, 34, 24, { fill: C2_3, rx: rx3, ry: ry3, edges: "${edgeVal}" });
  });

  // Golden Kintsugi mend seam + crowning star when reassembled
  if (mendK > 0.05) {
    s.polyline([[0, -75], [-12, -20], [10, 35], [-4, 95]], {
      stroke: "#FACC15",
      width: 5,
      pen: true,
      draw: mendK
    });
    const crownPop = s.pop(1.45, 0.5);
    s.extrude(0, -135, s.shapes.star(5, 52, 24), 22, {
      fill: "#FACC15",
      rx: -0.2,
      ry: s.t * 1.1,
      round: 0.4,
      edges: "${edgeVal}",
      draw: crownPop
    });
    s.burst(0, 0, 145, { count: 12, stroke: "#FACC15", draw: s.at(1.42, 0.45) });
  }
});

// ===== SCENE 4 =====
s.sfx("tada", 0.2, 0.85);
s.sfx("sparkle", 1.0, 0.65);
const C0_4 = s.c[0] || "${c0}";
const C1_4 = s.c[1] || "${c1}";
const C2_4 = s.c[2] || "${c2}";
const rx4 = -0.3;
const ry4 = -0.35 + s.wave(1.1, 0.1);

const k4 = s.spring(0.08, "${springPreset}");
s.shadow(360, 700, 160 * k4);
s.group({ x: 360, y: 410 + s.wave(1.4, 6), scale: k4 }, () => {
  s.rays(0, -35, 125, 195, 14, { stroke: C2_4, width: 3, draw: s.at(0.25, 0.6) });

  // Multi-part Championship Trophy Cup: stepped mahogany base, gold plaque, stem, collar, cup bowl, side handles, star
  s.box(0, 155, 150, 34, 110, { fill: "#1E293B", rx: rx4, ry: ry4, round: 0.35, edges: "${edgeVal}" });
  s.box(0, 122, 118, 28, 88, { fill: C1_4, rx: rx4, ry: ry4, round: 0.4, edges: "${edgeVal}" });
  s.cylinder(0, 72, 24, 72, { fill: C2_4, rx: rx4, ry: ry4, edges: "${edgeVal}" });
  s.cylinder(0, 32, 46, 18, { fill: C0_4, rx: rx4, ry: ry4, edges: "${edgeVal}" });
  // Cup bowl & rim
  s.cylinder(0, -28, 76, 102, { fill: C2_4, rx: rx4, ry: ry4, edges: "${edgeVal}" });
  s.cylinder(0, -80, 84, 18, { fill: C0_4, rx: rx4, ry: ry4, edges: "${edgeVal}" });
  // Left & Right sculpted handles
  s.arc(-72, -28, 34, Math.PI * 0.55, Math.PI * 1.45, { stroke: C0_4, width: 8 });
  s.arc(72, -28, 34, -Math.PI * 0.45, Math.PI * 0.45, { stroke: C0_4, width: 8 });

  // Crowning emblem star
  s.extrude(0, -132, s.shapes.star(5, 48, 22), 20, {
    fill: C0_4,
    rx: -0.2,
    ry: s.t * 1.2,
    round: 0.45,
    edges: "${edgeVal}"
  });
  s.burst(0, -55, 135, { count: 12, stroke: C0_4, draw: s.at(0.4, 0.5) });
});
s.text3d("PASTI BISA!", 360, 165, {
  size: 50,
  color: C0_4,
  depth: 12,
  frame: "pill",
  draw: s.pop(0.18, 0.5)
});
s.person(185, 595, { size: 190, pose: "cheer", facing: "right" });
s.person(535, 595, { size: 190, pose: "cheer", facing: "left" });
`;
}

/**
 * Builds the exact prompt that is sent to AI (Claude, ChatGPT, or Gemini)
 * Matches prompt_buat_style_baru.md 100% including truncation guard header and === AKHIR PERINTAH === footer.
 * When refAnalysis is present (from uploaded reference photo/video), embeds the detailed visual analysis
 * so the AI replicates the reference's exact colors, lighting, shapes, and motion.
 */
export function buildCustomStylePrompt(
  name: string,
  description: string,
  refAnalysis?: VisualReferenceAnalysis | null
): string {
  const cleanName = (name || refAnalysis?.suggestedName || '').trim();
  const stylePrompt =
    description.trim() ||
    refAnalysis?.detailedPrompt ||
    'Stop-motion tanah liat (claymation): objek 3D gemuk dan membulat dengan permukaan sedikit mengilap, cahaya studio hangat, warna terakota, krem, dan hijau zaitun. Satu objek besar di tengah, sudut 3/4. Gerakan patah-patah seperti 12fps dan memantul saat mendarat.';

  const refBlock = refAnalysis
    ? `\n\n### Hasil Deteksi Detail Referensi Visual (${refAnalysis.sourceType === 'video' ? 'Video Referensi' : 'Foto Referensi'})
- Archetype & Dimensi: ${refAnalysis.archetype} | look: "${refAnalysis.look}" | finish: "${refAnalysis.finish}"
- Palet Warna Asli Referensi (WAJIB gunakan di "colors" & objek scene): ${refAnalysis.colors.join(', ')}
- Gradasi Latar Referensi:
  - paper: top "${refAnalysis.background.paper.top}", bottom "${refAnalysis.background.paper.bottom}", pattern "${refAnalysis.background.paper.pattern}"
  - dusk: top "${refAnalysis.background.dusk.top}", bottom "${refAnalysis.background.dusk.bottom}", pattern "${refAnalysis.background.dusk.pattern}"
  - night: top "${refAnalysis.background.night.top}", bottom "${refAnalysis.background.night.bottom}", pattern "${refAnalysis.background.night.pattern}"
- Pencahayaan & Suasana: ${refAnalysis.lightingMood}
- Komposisi & Kamera: ${refAnalysis.compositionNotes}
- Karakteristik Gerakan & Tempo: ${refAnalysis.motionNotes}
- Pantangan Gaya: ${refAnalysis.avoidNotes}`
    : '';

  const creatorIdeaBlock = cleanName
    ? `Nama yang diinginkan: ${cleanName}\n${stylePrompt}${refBlock}`
    : `${stylePrompt}${refBlock}`;

  return `(Perintah ini panjang dan diakhiri baris "=== AKHIR PERINTAH ===". Kalau baris itu TIDAK ada di bagian paling akhir, berarti perintahnya terpotong saat ditempel: jangan kerjakan apa pun, jawab hanya dengan kalimat "PERINTAH TERPOTONG".)

Kamu art director untuk aplikasi pembuat video motivasi pendek (9:16) yang animasinya digambar dengan kode di HTML Canvas.
Kreator ingin membuat GAYA ANIMASI sendiri. Ubah ide kasarnya menjadi gaya yang lengkap dan bisa langsung dipakai.

## Ide dari kreator
${creatorIdeaBlock}

## Yang bisa digambar mesin animasinya
- "3d": objek 3D sederhana (balok, silinder, kerucut, bola, bentuk 2D yang diberi ketebalan, teks 3D) plus bentuk 2D.
- "2d": gambar 2D (garis, kurva, kotak, lingkaran, poligon, teks tulisan tangan).
- Finishing yang tersedia: "scribble" (coretan tangan, garis bergoyang, arsiran), "clean" (flat rapi tanpa tekstur), "glossy" (gradasi mengilap + bayangan lembut), "glow" (garis dan isian bercahaya, cocok untuk latar gelap).
- Tidak bisa: foto realistis, tekstur gambar/bitmap, karakter manusia yang detail.

## STANDAR KUALITAS SATSETMOTION (DILARANG AI SLOP, KAMERA DINAMIS, & WEB AUDIO KHUSUS)
1. **DILARANG AI SLOP / TEMPLATE KAKU**: Jangan pernah menggambar benda hanya berupa 1 balok polos + 1 bola polos yang ditumpuk tanpa bentuk nyata! Setiap objek utama WAJIB dirakit dari minimal 6-10 bagian anatomis yang bisa dikenali, punya bayangan jatuh nyata (+6px, +8px gelap transparan), tekstur material autentik (lipatan kertas, serat, selotip kertas miring, rusuk struktural, atau komponen mekanis), dan koreografi cerita sebab-akibat yang hidup.
2. **VIRTUAL CAMERA RIG DINAMIS**: Setiap scene wajib memainkan kamera virtual dinamis (mis. workbench dolly push-in + impact/rip shake, macro cross-section zoom-in, lateral shadowbox parallax 3 lapis 0.35x / 1.0x / 1.35x, atau whip pull-out).
3. **ZONA AMAN ANTI-TERPOTONG (SEMUA RASIO 9:16, 1:1, 3:4, 16:9)**: Seluruh kartu HUD dan elemen penting WAJIB berada di dalam zona aman vertikal \`x: 175..545\` dan \`y: 110..650\` (pusat objek di \`x = 360, y = 400\`) supaya tidak pernah terpotong di tepi kiri/kanan/atas pada rasio apa pun maupun bertabrakan dengan subtitle di bagian bawah.
4. **ENGINE WEB AUDIO KHUSUS TIAP GAYA**: Setiap gaya WAJIB memiliki ciri khas efek suara foley sendiri yang dipanggil lewat \`s.sfx(name, time, gain, pitch)\` (misal untuk gaya papercraft: \`paper_slide\`, \`paper_fold\`, \`paper_rip\`, \`paper_crumple\`, \`paper_snip\`, \`paper_pop\`, \`paper_slap\`), dan kamu BOLEH menyertakan blok \`-- Engine Web Audio Khusus\` berisi fungsi \`export function play...Sfx(ctx, dest, type, startTime, volume = 1, pitch = 1) { ... }\` di bagian paling akhir setelah Scene 4 untuk mensintesis suara foley khas gaya tersebut menggunakan Web Audio API murni.

## WAJIB FACELESS
Video ini konten faceless: setiap orang/tokoh/karakter yang muncul SELALU tanpa wajah (kepala polos, tanpa mata, alis, hidung, mulut, atau ekspresi wajah). Emosi ditunjukkan lewat pose, gerak tubuh, dan warna, bukan wajah. Ini berlaku walaupun ide atau foto referensinya menampilkan wajah: ambil gaya gambarnya saja, wajahnya tetap dibuat polos.

## Tugas
- "name": nama gaya singkat (1-3 kata, bahasa Indonesia atau istilah umum).
- "prompt": arahan gaya untuk animator, 4-7 kalimat, bahasa Indonesia, konkret. Ikuti formula: [gaya gambar & bentuk objek] + [pencahayaan/suasana] + [palet warna dengan kode hex] + [komposisi/kamera] + [cara gerak]. Sebutkan juga apa yang HARUS dihindari agar gayanya tidak tercampur gaya lain. WAJIB ada kalimat bahwa semua orang/tokoh digambar faceless (tanpa mata, hidung, mulut), dan "menggambar wajah" masuk daftar yang dihindari.
- "look": "3d" atau "2d". "finish": salah satu finishing di atas.
- "colors": 3 warna hex khas gaya ini.
- "mascot": kalau gaya ini punya TOKOH/MASKOT TETAP (diminta kreator atau jadi ciri gayanya), satu kalimat ciri fisiknya (bentuk, warna, pakaian, tulisan, aksesori; tanpa wajah). Di demo, gambar maskot itu dengan SATU fungsi tokoh yang sama persis di setiap scene. Kalau tidak ada maskot, isi "".
- "background": 3 latar gradasi yang cocok. "paper" = terang (teks gelap harus terbaca), "dusk" = menengah/berwarna, "night" = gelap (teks terang harus terbaca). "pattern" salah satu: none, navy, dots, grid, bigGrid, lines, stars, halftone, grain, chalk, wash, horizon, sunburst, mist, hud, stripes, dotsup, neonwave, slash, hills, peaks, house, dither, washi, plate, sunset, film, room, deepgrid, shore, craft, softgrid, ridge.

## Demo gaya (4 scene)
Setelah merancang gaya, tunjukkan gaya itu bekerja: tulis kode animasi untuk 4 scene demo di bawah, PERSIS mengikuti gaya yang baru kamu rancang (bentuk, palet hex, suasana, cara gerak). Engine otomatis menerapkan "finish" yang kamu pilih; kalau "look" kamu "2d", jangan pakai objek 3D. Latar tiap scene digambar engine dari "background" rancanganmu sesuai tema scene-nya, jadi pilih warna objek yang kontras dengan latar itu. Kalau ada orang/tokoh di scene, WAJIB faceless: jangan menggambar mata, alis, hidung, mulut, atau ekspresi wajah apa pun.

## Kontrak
Tulis HANYA isi body fungsi \`function (s, ctx) { ... }\`. Fungsi ini dipanggil setiap frame (30fps). Jangan menyimpan state antar frame; semua posisi dihitung dari waktu \`s.t\`. Jangan pakai \`Math.random()\` (gunakan \`s.rand(i)\`), jangan akses DOM/window/fetch, jangan pakai loop tak terbatas. Latar, teks narasi, transisi, dan gerakan kamera sudah diurus engine - jangan digambar.

## Kanvas
- Ukuran 720 x 1280 (vertikal). Origin kiri atas.
- Area ilustrasi aman: y 100 - 750, x 80 - 640. Pusat ilustrasi kira-kira (360, 420).
- Garis tanah standar di y = 760.
- Teks narasi (subtitle) tampil DI ATAS gambar, sekitar y 810 - 900. Objek, lantai, dan badan benda BOLEH lewat di belakangnya sampai bawah layar; jangan menyisakan pita kosong untuk subtitle. Yang tidak boleh ada di situ hanya tulisan lain dan titik fokus.

## Waktu & easing
- \`s.t\` detik sejak scene mulai, \`s.dur\` durasi scene, \`s.p\` = progres 0..1.
- \`s.spring(start = 0, preset = "snappy")\` -> 0..1 dengan fisika pegas sungguhan, CARA UTAMA memasukkan dan memindahkan objek. Preset: "smooth" (halus tanpa memantul; UI, teks, suasana tenang), "snappy" (sigap, sedikit melewati target; default), "bouncy" (membal beberapa kali; benda ringan, momen ceria), "heavy" (lambat bertenaga; benda besar/berat). Bisa juga \`{ damping, stiffness, mass }\`. Pakai dengan \`s.lerp\`: \`const k = s.spring(0.2); s.group({ x: s.lerp(-120, 360, k), scale: s.lerp(0.8, 1, k) }, ...)\`.
- \`s.stagger(i, start = 0, gap = 0.06, preset)\` -> spring untuk elemen ke-\`i\` sebuah kelompok, masing-masing \`gap\` detik setelah yang sebelumnya.
- \`s.keys([[detik, nilai], ...], easing = "inOut")\` -> nilai pada saat ini dari beberapa keyframe, ditahan di luar rentang. Untuk masuk-tahan-keluar: \`alpha: s.keys([[0.2, 0], [0.5, 1], [2, 1], [2.3, 0]])\`.
- \`s.at(start, len = 0.6)\` -> 0..1 dengan ease-out, mulai di detik \`start\` selama \`len\` detik.
- \`s.pop(start, len = 0.5)\` -> 0..~1.1..1 (membal pendek untuk \`draw\`).
- \`s.ease.out(x)\`, \`s.ease.inOut(x)\`, \`s.ease.back(x)\`, \`s.ease.elastic(x)\`, \`s.ease.in(x)\` (untuk keluar), \`s.ease.outExpo(x)\`, \`s.ease.inOutExpo(x)\`.
- \`s.lerp(a, b, k)\`, \`s.clamp(x, a, b)\`, \`s.wave(freq = 1, amp = 1, phase = 0)\` = sin berbasis waktu, \`s.rand(i)\` -> 0..1 deterministik.

## Objek 3D scribble (gaya utama)
Semua objek 3D digambar dengan perspektif, sisi gelap diberi arsiran coretan, dan siluetnya bertinta. Sudut balok dan bentuk extrude otomatis sedikit membulat (tidak tajam kaku), bola mulus. Titik (x, y) = pusat objek di layar.
Opsi \`o3\`: \`{ rx, ry, rz, scale, fill, stroke, alpha, draw, edges, round }\`
- \`rx/ry/rz\` rotasi radian (\`rx: -0.35\` agar sisi atas terlihat; \`ry: -0.5 + s.wave(1, 0.15)\` untuk menoleh pelan). Putaran terus-menerus (\`ry: s.t * 1.2\`) hanya untuk benda yang memang berputar (koin, roda, bintang hadiah), maksimal satu benda kecil per scene, bukan objek utama,
- \`fill\` warna dasar (bayangan dihitung otomatis), \`draw\` 0..1(+) skala tumbuh (pakai \`s.pop(...)\` untuk efek membal),
- \`edges\`: "strong" (siluet tebal + tepi utama, default) | "soft" (siluet tipis) | "none",
- \`round\` kelengkungan sudut balok/extrude 0..1 (default 0.35; 0 = sudut tajam untuk benda yang memang tajam seperti buku/kartu tipis, 0.6-0.9 = empuk seperti bantal, tombol, permen).

- \`s.box(x, y, w, h, d, o3)\` balok, \`s.cube(x, y, size, o3)\`
- \`s.cylinder(x, y, r, h, o3)\` (sumbu vertikal), \`s.cone(x, y, r, h, o3)\` (puncak di atas)
- \`s.sphere(x, y, r, o3)\` bola mulus
- \`s.extrude(x, y, points, depth, o3)\` - bentuk 2D (titik relatif ke 0,0) diberi ketebalan. Bentuk siap pakai:
  \`s.shapes.star(n=5, r1=100, r2=45)\`, \`s.shapes.heart(size=100)\`, \`s.shapes.arrow(length=200, width=60)\` (menunjuk ke kanan),
  \`s.shapes.bolt(size=120)\`, \`s.shapes.roundRect(w, h, r)\`, \`s.shapes.polygon(sides, r)\`
- \`s.text3d(str, x, y, { size=72, color, side, depth, rotate, alpha, draw, frame, frameColor })\` - teks tebal bervolume (untuk angka/kata singkat seperti "1%", "GAS!", "STOP"). Outline-nya otomatis kontras dengan warna huruf (huruf gelap = outline terang).
  - \`frame\`: bingkai stiker di belakang kata: "pill" (kapsul), "box" (kotak membulat), "ribbon" (pita dengan ekor), "burst" (ledakan bergerigi, cocok untuk angka/promo/kejutan), "bubble" (balon ucapan), "circle". \`frameColor\` opsional (default otomatis kontras dengan huruf). Bingkai ikut membal saat \`draw\` naik. Pakai sesekali, kira-kira 1 dari 3 scene, untuk kata yang paling penting, bukan di setiap teks.
- WARNA TEKS HARUS KONTRAS dengan latar: di tema gelap ("night", latar gelap) pakai huruf terang (\`s.c.yellow\`, \`s.c.white\`, \`s.c.orange\`, \`s.c.pink\`), jangan navy/hitam/ungu tua; di tema terang huruf gelap atau berwarna jenuh boleh. Teks gelap di latar gelap (atau putih di latar putih) dilarang.
- \`s.shadow(x, y, rx)\` - bayangan lonjong di tanah; taruh di bawah objek yang berdiri/membal.
- Grid isometrik (untuk diorama): \`s.isoBox(i, j, base, w, h, d, o3)\`, \`s.isoCylinder(i, j, base, r, h, o3)\` (objek berdiri di grid, sudut isometrik otomatis, saling pas), \`s.iso(i, j, z)\` -> titik layar [x, y]. \`i\` ke kanan-bawah, \`j\` ke kiri-bawah, pusat (360, 600). Opsi 3D lain: \`ortho: true\` = tanpa perspektif.

Fungsi 2D tetap tersedia untuk detail (garis gerak, burst, sparkle, centang).

## Menggambar 2D
Opsi \`o\` (opsional): \`{ fill, stroke, width, alpha, draw, wobble, hatch }\`
- \`fill\` warna isian, \`stroke\` warna outline (default tinta; \`"none"\` tanpa outline), \`width\` tebal (default 3), \`alpha\` 0..1,
- \`draw\` 0..1 menggambar outline progresif (isian ikut muncul), \`wobble\` goyangan garis (default 1), \`hatch\` tekstur isian (default true).
- \`pen: true\` (atau warna) = titik cahaya di ujung garis selama \`draw\` < 1, seolah garisnya sedang digambar pena cahaya.

- \`s.line(x1, y1, x2, y2, o)\`, \`s.polyline([[x, y], ...], o)\`, \`s.shape([[x, y], ...], o)\` (poligon tertutup)
- \`s.curve([[x, y], ...], o)\` kurva halus (\`o.closed = true\` untuk tertutup)
- \`s.rect(x, y, w, h, o)\` (\`o.r\` radius), \`s.circle(cx, cy, r, o)\`, \`s.ellipse(cx, cy, rx, ry, o)\`, \`s.arc(cx, cy, r, a0, a1, o)\`
- \`s.text(str, x, y, o)\` tulisan tangan (\`o.size\`, \`o.color\`, \`o.align\`)
- \`s.check(x, y, size, o)\`, \`s.cross(x, y, size, o)\`, \`s.dash(x1, y1, x2, y2, o)\`
- \`s.sparkle(x, y, size, o)\`, \`s.rays(cx, cy, r1, r2, count, o)\`, \`s.burst(x, y, r, { draw, count, stroke })\`
- \`s.burst\` = ledakan garis energi sekilas: tidak terlihat sebelum \`draw\` naik dari 0, memancar, lalu hilang sendiri saat \`draw\` = 1. Pasang tepat di momen objeknya mendarat/muncul/meledak, mis. \`draw: s.at(0.9, 0.4)\` kalau objek mendarat di detik 0.9.
- \`s.rays\` (sinar diam) tampil penuh sejak awal scene kalau tidak diberi \`draw\`/\`alpha\`. Munculkan bersamaan dengan objek yang bersinar: \`draw: s.at(t0, 0.4)\` atau \`alpha\` yang ikut objeknya. Efek tidak boleh muncul lebih dulu dari objeknya.
- \`s.ground(y = 760, x1 = 60, x2 = 660, o)\`
- \`s.group({ x, y, rotate, scale, alpha }, () => { ... })\` transformasi relatif (koordinat lokal, 0,0 = x,y).
- \`s.words(str, x, y, o)\` tipografi kinetik: kata bersih yang masuk satu per satu, otomatis turun baris; (x, y) = pusat blok. Opsi: \`{ size=44, color, accent (kata/daftar kata yang disorot), accentColor, mode, start=0, gap=0.07, spring, width, align ("center"|"left"), lineHeight, alpha }\`. \`mode\`: "rise" (naik dari balik garis, default, paling elegan), "pop" (membal), "slide" (geser dari kiri), "fade" (pudar sambil naik sedikit).
- \`s.card(x, y, w, h, o)\` panel bersih dengan bayangan lembut berlapis; (x, y) = kiri atas. Opsi: \`{ fill (warna, atau [atas, bawah] untuk gradasi), r=28, stroke, width, alpha, shadow=true }\`. Bungkus dengan \`s.group\` untuk menggerakkannya.
- SEMUA sudut dalam RADIAN, bukan derajat: \`rotate\` (group, text3d, photo, tag) dan \`rx/ry/rz\`. 0.1 ≈ 6°, 0.3 ≈ 17°, Math.PI = 180°. Miring kecil: \`rotate: -0.08\`; goyang halus: \`rotate: s.wave(2, 0.06)\`; putar masuk sekali: \`rotate: (1 - e) * Math.PI * 2\`. Jangan menulis \`rotate: -8\` atau \`* 360\`.

Palet (\`s.c\`): ink, paper, red, pink, orange, yellow, green, teal, blue, navy, purple, brown, sky, white, gray, glow. Boleh hex.
\`s.theme\` = "paper" | "night" | "dusk". Di tema gelap \`s.c.ink\` otomatis terang. \`ctx\` = CanvasRenderingContext2D mentah (jarang perlu).

## Efek suara
\`s.sfx(name, time, gain = 1, pitch)\` = efek suara di detik \`time\`. Panggil di level atas kode (tanpa if/kondisi waktu): dikumpulkan sekali, bukan per frame. \`pitch\` = pengali nada (0.5 benda besar/berat, 1.5-2 benda kecil/ringan). Pilih yang sesuai bendanya, bukan selalu "pop":
- Gerak: pop (muncul/membal), tick (detail kecil), click (centang/tombol), tap, thud (benda berat mendarat), boing (memantul), swish, whoosh, boom, rise (ketegangan ~0.8 dtk sebelum klimaks), ding (pencapaian), sparkle.
- Benda: coin, cash (transaksi/harga), type (ketikan, panggil berurutan), shutter (foto), heart (detak jantung), tock (jam), rocket (~1.2 dtk), notify (pesan HP), drop (tetes air), paper, chalk, beep (layar digital), blip (game 8-bit), laser, step (langkah), pageflip, bubble, snap (jentik jari/ide), clap.
- Hentakan: impact (momen besar), kick (bass pendek untuk angka/teks), braam (dentuman berat ala trailer film untuk pengungkapan besar), swipe (kartu masuk), whip, glitch, stamp, slide (peluit lucu), scratch (plot twist), buzzer (salah/larangan), correct (benar), tada (pengumuman), magic (transformasi).
- Rekaman suara ASLI, untuk adegan yang punya tempat atau kejadian nyata. Suasana latar: hujan, hujan_deras, angin, keramaian, pasar, jalan, burung, jangkrik, ombak, sungai, api, kereta, anak, kafe, kantor; panggil di detik 0 dengan gain 0.3-0.6 (berbunyi ±6 dtk, ulangi tiap 6 dtk kalau scene lebih panjang), paling banyak 1 per scene dan hanya kalau tempatnya jelas. Kejadian: petir, pintu, pintu_buka, ketuk, langkah, lari, jantung, tepuk, sorak, tawa, bayi, ayam, kucing, anjing, motor, mobil, klakson, rem, jam, alarm, telepon, notif, ketik, koin, kasir, tuang, tetes, kaca_pecah, goreng, bel, kamera, kertas, resleting, korek, ledakan, pukul, napas, batuk, helaan; pasang tepat saat terjadi di gambar. Contoh scene hujan malam: \`s.sfx("hujan", 0, 0.5); s.sfx("petir", 1.4);\`.
Suara sama yang diulang cepat otomatis naik nada seperti tangga nada. Whoosh transisi, boom awal scene, dan tick saat kata muncul SUDAH otomatis: jangan ditambah di detik 0. Pakai 1-4 efek per scene, selaras dengan gerakan.

### SCENE 1
- Teks narasi: "Mulai dari langkah kecil."
- Visual: Satu benda kecil (mis. bibit, kotak, atau langkah pertama) muncul lalu tumbuh membesar.
- Tema latar: paper
- Durasi: 3 detik (gerakan harus mengisi seluruh durasi ini)

### SCENE 2
- Teks narasi: "Konsisten tiap hari."
- Visual: Deretan hari atau kotak kalender yang dicentang satu per satu dengan ritme stabil.
- Tema latar: dusk
- Durasi: 3 detik (gerakan harus mengisi seluruh durasi ini)

### SCENE 3
- Teks narasi: "Gagal itu bagian dari proses."
- Visual: Sebuah benda jatuh atau retak, lalu bangkit dan tersusun kembali lebih kuat.
- Tema latar: night
- Durasi: 3 detik (gerakan harus mengisi seluruh durasi ini)

### SCENE 4
- Teks narasi: "Kamu pasti bisa!"
- Visual: Simbol kemenangan besar (piala, bintang, atau bendera) muncul dengan perayaan.
- Tema latar: paper
- Durasi: 3 detik (gerakan harus mengisi seluruh durasi ini)

## Format jawaban
Jawab dengan SATU blok kode \`\`\`js saja (bukan dua), tanpa penjelasan lain, supaya kreator cukup sekali menyalin. Di dalam blok itu, mulai dengan penanda \`// ===== GAYA =====\` lalu rancangan gayanya sebagai JSON, kemudian keempat scene demo dengan penandanya, persis seperti ini:

\`\`\`js
// ===== GAYA =====
{
  "name": "...",
  "prompt": "...",
  "look": "3d",
  "finish": "clean",
  "colors": ["#hex", "#hex", "#hex"],
  "mascot": "",
  "background": {
    "paper": { "top": "#hex", "bottom": "#hex", "pattern": "dots" },
    "dusk": { "top": "#hex", "bottom": "#hex", "pattern": "none" },
    "night": { "top": "#hex", "bottom": "#hex", "pattern": "stars" }
  }
}

// ===== SCENE 1 =====
// ...kode scene ini...

// ===== SCENE 2 =====
// ...kode scene ini...

// ===== SCENE 3 =====
// ...kode scene ini...

// ===== SCENE 4 =====
// ...kode scene ini...
\`\`\`
Jangan gunakan artifact/canvas dan jangan menambahkan penjelasan di luar format yang diminta.

=== AKHIR PERINTAH ===`;
}

/**
 * Builds the exact repair prompt to send back to AI when its previous response could not be parsed.
 */
export function buildCustomStyleRepairPrompt(rawText: string, errors?: string[]): string {
  const primaryError =
    errors && errors.length > 0
      ? errors[0]
      : 'Tidak menemukan JSON yang valid. Pastikan kamu menyalin seluruh jawaban Claude, termasuk blok ```json.';

  const snippet = (rawText || '').trim().slice(0, 600);

  return `Jawabanmu sebelumnya tidak bisa diproses aplikasi.
Masalah: ${primaryError}

${snippet ? `Cuplikan teks yang ditempel sebelumnya:\n"""\n${snippet}\n"""\n\n` : ''}Tolong tulis ulang jawaban lengkapnya dalam SATU blok kode \`\`\`js saja (tanpa penjelasan di luar blok kode). Pastikan:
1. Dimulai dengan penanda \`// ===== GAYA =====\` lalu objek JSON yang valid (\`name\`, \`prompt\`, \`look\`, \`finish\`, \`colors\`, \`mascot\`, \`background\`).
2. Diikuti 4 scene demo lengkap dengan penanda \`// ===== SCENE 1 =====\`, \`// ===== SCENE 2 =====\`, \`// ===== SCENE 3 =====\`, dan \`// ===== SCENE 4 =====\`.
3. Jangan gunakan artifact/canvas dan pastikan seluruh kode tidak terpotong.`;
}

/**
 * Result returned from parseCustomStyleCode
 */
export interface ParseResult {
  isValid: boolean;
  errors: string[];
  style?: CustomStyleDefinition;
}

/**
 * Parses user or AI-generated JS response containing // ===== GAYA ===== and // ===== SCENE 1..4 =====
 */
export function parseCustomStyleCode(rawText: string): ParseResult {
  if (!rawText || !rawText.trim()) {
    return {
      isValid: false,
      errors: ['Tidak menemukan JSON yang valid. Pastikan kamu menyalin seluruh jawaban Claude, termasuk blok ```json.'],
    };
  }

  const trimmedInput = rawText.trim();

  // Reject if user accidentally pasted the prompt instructions or truncation message
  if (
    trimmedInput === 'PERINTAH TERPOTONG' ||
    trimmedInput.includes('Kamu art director untuk aplikasi pembuat video motivasi pendek') ||
    trimmedInput.includes('Perintah ini panjang dan diakhiri baris "=== AKHIR PERINTAH ==="') ||
    trimmedInput.startsWith('Jawabanmu sebelumnya tidak bisa diproses aplikasi.')
  ) {
    return {
      isValid: false,
      errors: ['Tidak menemukan JSON yang valid. Pastikan kamu menyalin seluruh jawaban Claude, termasuk blok ```json.'],
    };
  }

  // Strip code block markers if present
  const cleanText = rawText.replace(/```(?:js|javascript|json)?/gi, '').replace(/```/g, '').trim();

  // Find GAYA marker (handles // or /// or multiple slashes)
  const gayaMarkerRegex = /\/{2,}\s*={3,}\s*GAYA\s*={3,}/i;
  const scene1Marker = /\/{2,}\s*={3,}\s*SCENE\s*1\s*={3,}/i;
  const scene2Marker = /\/{2,}\s*={3,}\s*SCENE\s*2\s*={3,}/i;
  const scene3Marker = /\/{2,}\s*={3,}\s*SCENE\s*3\s*={3,}/i;
  const scene4Marker = /\/{2,}\s*={3,}\s*SCENE\s*4\s*={3,}/i;

  const gayaMatch = cleanText.search(gayaMarkerRegex);

  // If no // ===== GAYA ===== marker, check if it's React Remotion code or JSON
  if (gayaMatch === -1) {
    // 1. Check if React / Remotion component code
    const isReactRemotion =
      cleanText.includes('remotion') ||
      cleanText.includes('AbsoluteFill') ||
      cleanText.includes('export const') ||
      cleanText.includes('useCurrentFrame') ||
      cleanText.includes('Composition');

    if (isReactRemotion) {
      const nameMatch =
        cleanText.match(/name["']?\s*:\s*["']([^"']+)["']/i) ||
        cleanText.match(/export\s+const\s+([A-Za-z0-9_]+)/i) ||
        cleanText.match(/title["']?\s*:\s*["']([^"']+)["']/i);

      const rawName = nameMatch ? nameMatch[1] : 'Remotion Custom Style';
      const cleanName = rawName
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();

      const hexMatches = cleanText.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/g) || [];
      const uniqueColors = Array.from(new Set(hexMatches));
      const colors =
        uniqueColors.length >= 3
          ? uniqueColors.slice(0, 3)
          : ['#2563EB', '#1e3a8a', '#38bdf8'];

      const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      const id = `custom_${slug || 'react_remotion'}`;

      const synthesized = generateCustomStyleCodeFromAnalysis(
        {
          sourceType: 'video',
          suggestedName: cleanName,
          detailedPrompt: `Gaya animasi Remotion ${cleanName} dengan warna ${colors.join(', ')}.`,
          look: '3d',
          finish: 'glossy',
          archetype: 'clay_3d',
          colors: [colors[0], colors[1], colors[2]],
          background: {
            paper: { top: '#FAF8F5', bottom: '#F3EFEA', pattern: 'dots' },
            dusk: { top: '#1E293B', bottom: '#0F172A', pattern: 'grid' },
            night: { top: '#0B0F19', bottom: '#030712', pattern: 'stars' },
          },
          lightingMood: 'Pencahayaan studio bersih',
          compositionNotes: 'Komposisi terpusat 9:16',
          motionNotes: 'Gerakan pegas presisi',
          avoidNotes: 'Hindari wajah',
          brightness: 72,
          saturation: 65,
          edgeDensity: 24,
        },
        cleanName
      );
      const reparsed = parseCustomStyleCode(synthesized);
      if (reparsed.isValid && reparsed.style) {
        return {
          isValid: true,
          errors: [],
          style: {
            ...reparsed.style,
            id,
            rawCode: rawText,
          },
        };
      }
    }

    // 2. Check if whole text is JSON directly
    try {
      const parsed = JSON.parse(cleanText);
      if (parsed.name && parsed.name !== '...' && (parsed.colors || parsed.prompt)) {
        return {
          isValid: true,
          errors: [],
          style: {
            id: 'custom_' + Date.now().toString(36),
            name: parsed.name || 'Gaya Kustom',
            prompt: parsed.prompt || '',
            look: parsed.look === '3d' ? '3d' : '2d',
            finish: parsed.finish || 'clean',
            colors: Array.isArray(parsed.colors) ? parsed.colors : ['#2563EB', '#1e3a8a', '#38bdf8'],
            preferredRatio: parsed.preferredRatio || '9:16',
            safeScale: parsed.safeScale ?? 0.92,
            background: parsed.background || {
              paper: { top: '#FAF8F5', bottom: '#F3EFEA', pattern: 'dots' },
              dusk: { top: '#1E293B', bottom: '#0F172A', pattern: 'none' },
              night: { top: '#0B0F19', bottom: '#030712', pattern: 'grid' },
            },
            scenes: parsed.scenes || {
              1: 's.text("Mulai dari kecil", 360, 380, { size: 36, align: "center" });',
              2: 's.text("Konsisten tiap hari", 360, 380, { size: 36, align: "center" });',
              3: 's.text("Terus belajar", 360, 380, { size: 36, align: "center" });',
              4: 's.text("Kamu pasti bisa!", 360, 380, { size: 36, align: "center" });',
            },
            rawCode: rawText,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        };
      }
    } catch {
      // ignore
    }

    return {
      isValid: false,
      errors: ['Tidak menemukan JSON yang valid. Pastikan kamu menyalin seluruh jawaban Claude, termasuk blok ```json.'],
    };
  }

  // Split into sections by marker
  const idxGaya = cleanText.search(gayaMarkerRegex);
  const idxS1 = cleanText.search(scene1Marker);
  const idxS2 = cleanText.search(scene2Marker);
  const idxS3 = cleanText.search(scene3Marker);
  const idxS4 = cleanText.search(scene4Marker);

  if (idxS1 === -1) {
    return {
      isValid: false,
      errors: ['Penanda "// ===== SCENE 1 =====" tidak ditemukan. Pastikan kamu menyalin seluruh kode dari AI.'],
    };
  }

  // Extract JSON string
  const gayaHeaderStr = cleanText.slice(idxGaya, idxS1).replace(gayaMarkerRegex, '').trim();

  let metadata: CustomStyleMetadata;
  try {
    metadata = JSON.parse(gayaHeaderStr);
  } catch (err: any) {
    const firstBrace = gayaHeaderStr.indexOf('{');
    const lastBrace = gayaHeaderStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        metadata = JSON.parse(gayaHeaderStr.slice(firstBrace, lastBrace + 1));
      } catch (err2: any) {
        return {
          isValid: false,
          errors: ['Format JSON di bagian // ===== GAYA ===== tidak valid: ' + (err2.message || 'SyntaxError')],
        };
      }
    } else {
      return {
        isValid: false,
        errors: ['Tidak menemukan JSON yang valid. Pastikan kamu menyalin seluruh jawaban Claude, termasuk blok ```json.'],
      };
    }
  }

  if (!metadata.name || typeof metadata.name !== 'string' || metadata.name.trim() === '...') {
    return {
      isValid: false,
      errors: ['Tidak menemukan JSON yang valid. Pastikan kamu menyalin seluruh jawaban Claude, termasuk blok ```json.'],
    };
  }

  // Extract Scene Codes
  const scenes: Record<number, string> = {};
  const sceneDurations: Record<number, number> = {};

  if (idxS1 !== -1) {
    const endS1 = idxS2 !== -1 ? idxS2 : cleanText.length;
    scenes[1] = cleanText.slice(idxS1, endS1).replace(scene1Marker, '').trim();
  }
  if (idxS2 !== -1) {
    const endS2 = idxS3 !== -1 ? idxS3 : cleanText.length;
    scenes[2] = cleanText.slice(idxS2, endS2).replace(scene2Marker, '').trim();
  }
  if (idxS3 !== -1) {
    const endS3 = idxS4 !== -1 ? idxS4 : cleanText.length;
    scenes[3] = cleanText.slice(idxS3, endS3).replace(scene3Marker, '').trim();
  }
  if (idxS4 !== -1) {
    scenes[4] = cleanText
      .slice(idxS4)
      .replace(scene4Marker, '')
      .replace(/===\s*AKHIR\s+PERINTAH\s*===/gi, '')
      .trim();
  }

  // Extract any trailing Custom Web Audio Engine block (-- Engine Web Audio Khusus / SYNTHESIZER / export function play...Sfx)
  let customAudioCode: string | undefined;
  const audioSectionMarkerRegex =
    /(?:^\s*--\s*Engine\s+Web\s+Audio[^\n]*|^\s*\/{2,}\s*={3,}\s*[^=\n]*(?:SYNTHESIZER|WEB\s*AUDIO|AUDIO\s*ENGINE|FOLEY\s*SYNTHESIZER)[^=\n]*={3,}|^\s*(?:export\s+)?function\s+play[A-Za-z0-9_]*Sfx\s*\()/im;

  for (const sceneNum of [4, 3, 2, 1]) {
    const sc = scenes[sceneNum];
    if (!sc) continue;
    const match = audioSectionMarkerRegex.exec(sc);
    if (match && typeof match.index === 'number') {
      const extracted = sc.slice(match.index).trim();
      if (!customAudioCode && extracted) {
        customAudioCode = extracted;
      }
      scenes[sceneNum] = sc.slice(0, match.index).trim();
    }
  }

  // Parse ideal duration per scene (e.g., "// Durasi ideal: 4.2 detik" or max s.at/s.spring/s.sfx timestamp)
  for (const sceneNum of [1, 2, 3, 4]) {
    const sc = scenes[sceneNum];
    if (!sc) continue;
    const durCommentMatch = sc.match(/Durasi(?:\s+ideal)?\s*:\s*(\d+(?:[.,]\d+)?)\s*(?:detik|s\b)/i);
    if (durCommentMatch) {
      const parsedDur = parseFloat(durCommentMatch[1].replace(',', '.'));
      if (Number.isFinite(parsedDur) && parsedDur >= 2.0 && parsedDur <= 15.0) {
        sceneDurations[sceneNum] = parsedDur;
        continue;
      }
    }
    // Check if scene has keyframes or sfx beyond 2.6s -> give it 4.2s room so climax never gets cut off
    let maxTimeRef = 3.0;
    const timeMatches = sc.matchAll(/s\.(?:sfx|at|spring|pop)\s*\(\s*(?:["'][^"']+["']\s*,\s*)?(\d+(?:\.\d+)?)/g);
    for (const tm of timeMatches) {
      const tVal = parseFloat(tm[1]);
      if (Number.isFinite(tVal) && tVal + 1.4 > maxTimeRef) {
        maxTimeRef = Math.min(8.0, Math.max(4.2, Math.round((tVal + 1.45) * 10) / 10));
      }
    }
    sceneDurations[sceneNum] = maxTimeRef;
  }

  const detectedScenesCount = Object.keys(scenes).filter((k) => Boolean(scenes[Number(k)]?.trim())).length;
  if (detectedScenesCount === 0) {
    return { isValid: false, errors: ['Tidak ada kode scene yang terdeteksi.'] };
  }

  const slug = metadata.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const id = `custom_${slug || 'style'}`;
  const resolvedBg = metadata.background || metadata.bg || {
    paper: { top: '#fbf9f5', bottom: '#f3efe6', pattern: 'dots' },
    dusk: { top: '#1e293b', bottom: '#0f172a', pattern: 'none' },
    night: { top: '#0a0f1d', bottom: '#05070f', pattern: 'stars' },
  };
  const resolvedColors =
    Array.isArray(metadata.colors) && metadata.colors.length > 0
      ? metadata.colors
      : ['#2563EB', '#2a9d8f', '#38bdf8'];

  // Infer signature SFX flavor from style metadata, finish, pattern, or s.sfx calls
  const allScenesJoined = `${metadata.name} ${metadata.prompt || ''} ${metadata.finish || ''} ${resolvedBg.paper?.pattern || ''} ${Object.values(scenes).join('\n')}`.toLowerCase();
  let inferredSfxFlavor = metadata.sfxFlavor || '';
  if (!inferredSfxFlavor) {
    if (
      allScenesJoined.includes('paper_') ||
      allScenesJoined.includes('papercraft') ||
      allScenesJoined.includes('origami') ||
      allScenesJoined.includes('kolase') ||
      allScenesJoined.includes('guntingan kertas') ||
      metadata.finish === 'craft' ||
      resolvedBg.paper?.pattern === 'craft' ||
      resolvedBg.paper?.pattern === 'washi'
    ) {
      inferredSfxFlavor = 'paper';
    } else if (allScenesJoined.includes('clay') || allScenesJoined.includes('tanah liat') || allScenesJoined.includes('plastisin')) {
      inferredSfxFlavor = 'clay';
    } else if (allScenesJoined.includes('8-bit') || allScenesJoined.includes('pixel') || allScenesJoined.includes('arcade') || allScenesJoined.includes('voxel')) {
      inferredSfxFlavor = '8bit';
    } else if (allScenesJoined.includes('terminal') || allScenesJoined.includes('cyber') || allScenesJoined.includes('matrix') || allScenesJoined.includes('hud')) {
      inferredSfxFlavor = 'terminal';
    } else if (allScenesJoined.includes('chalk') || allScenesJoined.includes('kapur') || allScenesJoined.includes('sketsa') || allScenesJoined.includes('pensil') || metadata.finish === 'scribble') {
      inferredSfxFlavor = 'chalk';
    } else if (allScenesJoined.includes('jam') || allScenesJoined.includes('watch') || allScenesJoined.includes('gear') || allScenesJoined.includes('mekanis')) {
      inferredSfxFlavor = 'mechanical';
    } else if (allScenesJoined.includes('glass') || allScenesJoined.includes('kaca') || allScenesJoined.includes('cair') || allScenesJoined.includes('liquid')) {
      inferredSfxFlavor = 'liquid';
    } else if (metadata.look === '3d') {
      inferredSfxFlavor = 'studio3d';
    } else {
      inferredSfxFlavor = 'editorial';
    }
  }

  const style: CustomStyleDefinition = {
    id,
    name: metadata.name,
    hint: metadata.hint || metadata.prompt?.slice(0, 72) || 'Gaya buatan sendiri',
    prompt: metadata.prompt || metadata.direction || '',
    direction: metadata.direction || metadata.prompt || '',
    look:
      metadata.look === '3d'
        ? '3d'
        : metadata.look === 'scribble3d'
        ? 'scribble3d'
        : metadata.look === 'crayon'
        ? 'crayon'
        : '2d',
    finish: metadata.finish || 'clean',
    colors: resolvedColors,
    accent: metadata.accent || resolvedColors[0],
    caption: metadata.caption || (metadata.finish === 'glow' ? 'neon' : metadata.finish === 'craft' ? 'selotip' : 'pop'),
    calmCamera: !!metadata.calmCamera,
    continuous: !!metadata.continuous,
    plainBg: !!metadata.plainBg,
    preferredRatio: metadata.preferredRatio || '9:16',
    safeScale: metadata.safeScale ?? 0.92,
    sfxFlavor: inferredSfxFlavor,
    customAudioCode: customAudioCode || metadata.customAudioCode,
    sceneDurations,
    bg: resolvedBg,
    background: resolvedBg,
    scenes,
    rawCode: rawText,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return {
    isValid: true,
    errors: [],
    style,
  };
}

const STORAGE_KEY = 'satset_custom_styles_v2';

function deduplicateCustomStyles(list: CustomStyleDefinition[]): CustomStyleDefinition[] {
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const out: CustomStyleDefinition[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const cleanId = String(item.id || '').trim().toLowerCase();
    const cleanName = String(item.name || '').trim().toLowerCase();
    if (!cleanId || !cleanName || seenIds.has(cleanId) || seenNames.has(cleanName)) continue;
    seenIds.add(cleanId);
    seenNames.add(cleanName);
    out.push(item);
  }
  return out;
}

/**
 * Loads all user-created custom styles from localStorage (deduplicated)
 */
export function getStoredCustomStyles(): CustomStyleDefinition[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return deduplicateCustomStyles(parsed);
      }
    }
  } catch (e) {
    console.warn('Error reading stored custom styles:', e);
  }

  return [];
}

/**
 * Saves or updates a custom style in localStorage
 */
export function saveCustomStyleToStorage(style: CustomStyleDefinition): CustomStyleDefinition[] {
  const current = getStoredCustomStyles();
  const existingIdx = current.findIndex(
    (s) => s.id === style.id || s.name.trim().toLowerCase() === style.name.trim().toLowerCase()
  );

  let updated: CustomStyleDefinition[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = {
      ...style,
      id: current[existingIdx].id,
      updatedAt: Date.now(),
    };
  } else {
    updated = [style, ...current];
  }

  const deduped = deduplicateCustomStyles(updated);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
    } catch (e) {
      console.warn('Error saving custom style:', e);
    }
  }

  return deduped;
}

/**
 * Deletes a custom style from localStorage
 */
export function deleteCustomStyleFromStorage(id: string): CustomStyleDefinition[] {
  const current = getStoredCustomStyles();
  const filtered = current.filter((s) => s.id !== id);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('Error deleting custom style:', e);
    }
  }

  return filtered;
}


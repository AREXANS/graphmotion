import { CustomStyleDefinition, CustomStyleMetadata } from '../types/custom-style';
export type { CustomStyleDefinition, CustomStyleMetadata };

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

/**
 * Builds the exact prompt that is sent to AI (Claude, ChatGPT, or Gemini)
 */
export function buildCustomStylePrompt(name: string, description: string): string {
  const styleName = name.trim() || 'Gaya Animasi Eksklusif';
  const stylePrompt = description.trim() || 'Animasi motion graphics vertikal 9:16 yang bersih, dinamis, dan modern.';

  return `Kamu art director untuk aplikasi pembuat video motivasi pendek (9:16) yang animasinya digambar dengan kode di HTML Canvas.
Kreator ingin membuat GAYA ANIMASI sendiri. Ubah ide kasarnya menjadi gaya yang lengkap dan bisa langsung dipakai.

## Ide dari kreator
Nama yang diinginkan: ${styleName}
${stylePrompt}

## Yang bisa digambar mesin animasinya
- "3d": objek 3D sederhana (balok, silinder, kerucut, bola, bentuk 2D yang diberi ketebalan, teks 3D) plus bentuk 2D.
- "2d": gambar 2D (garis, kurva, kotak, lingkaran, poligon, teks tulisan tangan).
- Finishing yang tersedia: "scribble" (coretan tangan, garis bergoyang, arsiran), "clean" (flat rapi tanpa tekstur), "glossy" (gradasi mengilap + bayangan lembut), "glow" (garis dan isian bercahaya, cocok untuk latar gelap).
- Tidak bisa: foto realistis, tekstur gambar/bitmap, karakter manusia yang detail.

## WAJIB FACELESS
Video ini konten faceless: setiap orang/tokoh/karakter yang muncul SELALU tanpa wajah (kepala polos, tanpa mata, alis, hidung, mulut, atau ekspresi wajah). Emosi ditunjukkan lewat pose, gerak tubuh, dan warna, bukan wajah. Ini berlaku walaupun ide atau foto referensinya menampilkan wajah: ambil gaya gambarnya saja, wajahnya tetap dibuat polos.

## Tugas
- "name": nama gaya singkat (1-3 kata, bahasa Indonesia atau istilah umum).
- "prompt": arahan gaya untuk animator, 4-7 kalimat, bahasa Indonesia, konkret. Ikuti formula: [gaya gambar & bentuk objek] + [pencahayaan/suasana] + [palet warna dengan kode hex] + [komposisi/kamera] + [cara gerak]. Sebutkan juga apa yang HARUS dihindari agar gayanya tidak tercampur gaya lain. WAJIB ada kalimat bahwa semua orang/tokoh digambar faceless (tanpa mata, hidung, mulut), dan "menggambar wajah" masuk daftar yang dihindari.
- "look": "3d" atau "2d". "finish": salah satu finishing di atas.
- "colors": 3 warna hex khas gaya ini.
- "background": 3 latar gradasi yang cocok. "paper" = terang (teks gelap harus terbaca), "dusk" = menengah/berwarna, "night" = gelap (teks terang harus terbaca). "pattern" salah satu: none, navy, dots, grid, bigGrid, lines, stars, halftone, grain, chalk, wash, horizon, sunburst, mist, hud, stripes, dotsup, neonwave, slash, hills, peaks, house, dither, washi, plate, sunset, film, room, deepgrid, shore, craft, softgrid, ridge.

## Demo gaya (4 scene)
Setelah merancang gaya, tunjukkan gaya itu bekerja: tulis kode animasi untuk 4 scene demo di bawah, PERSIS mengikuti gaya yang baru kamu rancang (bentuk, palet hex, suasana, cara gerak). Engine otomatis menerapkan "finish" yang kamu pilih; kalau "look" kamu "2d", jangan pakai objek 3D. Latar tiap scene digambar engine dari "background" rancanganmu sesuai tema scene-nya, jadi pilih warna objek yang kontras dengan latar itu. Kalau ada orang/tokoh di scene, WAJIB faceless: jangan menggambar mata, alis, hidung, mulut, atau ekspresi wajah apa pun.

## Kontrak
Tulis HANYA isi body fungsi function (s, ctx) { ... }. Fungsi ini dipanggil setiap frame (30fps). Jangan menyimpan state antar frame; semua posisi dihitung dari waktu s.t. Jangan pakai Math.random() (gunakan s.rand(i)), jangan akses DOM/window/fetch, jangan pakai loop tak terbatas. Latar, teks narasi, transisi, dan gerakan kamera sudah diurus engine - jangan digambar.

## Kanvas
- Ukuran 720 x 1280 (vertikal). Origin kiri atas.
- Area ilustrasi: y 0 - 800, x 0 - 720. Pusat ilustrasi kira-kira (360, 420).
- Garis tanah standar di y = 760.
- Teks narasi (subtitle) tampil DI ATAS gambar, sekitar y 810 - 900. Objek, lantai, dan badan benda BOLEH lewat di belakangnya sampai bawah layar; jangan menyisakan pita kosong untuk subtitle. Yang tidak boleh ada di situ hanya tulisan lain dan titik fokus.

## Waktu & easing
- s.t detik sejak scene mulai, s.dur durasi scene, s.p = progres 0..1.
- s.spring(start = 0, preset = "snappy") -> 0..1 dengan fisika pegas sungguhan, CARA UTAMA memasukkan dan memindahkan objek. Preset: "smooth" (halus tanpa memantul; UI, teks, suasana tenang), "snappy" (sigap, sedikit melewati target; default), "bouncy" (membal beberapa kali; benda ringan, momen ceria), "heavy" (lambat bertenaga; benda besar/berat). Bisa juga { damping, stiffness, mass }. Pakai dengan s.lerp: const k = s.spring(0.2); s.group({ x: s.lerp(-120, 360, k), scale: s.lerp(0.8, 1, k) }, ...).
- s.stagger(i, start = 0, gap = 0.06, preset) -> spring untuk elemen ke-i sebuah kelompok, masing-masing gap detik setelah yang sebelumnya.
- s.keys([[detik, nilai], ...], easing = "inOut") -> nilai pada saat ini dari beberapa keyframe, ditahan di luar rentang. Untuk masuk-tahan-keluar: alpha: s.keys([[0.2, 0], [0.5, 1], [2, 1], [2.3, 0]]).
- s.at(start, len = 0.6) -> 0..1 dengan ease-out, mulai di detik start selama len detik.
- s.pop(start, len = 0.5) -> 0..~1.1..1 (membal pendek untuk draw).
- s.ease.out(x), s.ease.inOut(x), s.ease.back(x), s.ease.elastic(x), s.ease.in(x) (untuk keluar), s.ease.outExpo(x), s.ease.inOutExpo(x).
- s.lerp(a, b, k), s.clamp(x, a, b), s.wave(freq = 1, amp = 1, phase = 0) = sin berbasis waktu, s.rand(i) -> 0..1 deterministik.

## Objek 3D scribble (gaya utama)
Semua objek 3D digambar dengan perspektif, sisi gelap diberi arsiran coretan, dan siluetnya bertinta. Sudut balok dan bentuk extrude otomatis sedikit membulat (tidak tajam kaku), bola mulus. Titik (x, y) = pusat objek di layar.
Opsi o3: { rx, ry, rz, scale, fill, stroke, alpha, draw, edges, round }
- rx/ry/rz rotasi radian (rx: -0.35 agar sisi atas terlihat; ry: -0.5 + s.wave(1, 0.15) untuk menoleh pelan). Putaran terus-menerus (ry: s.t * 1.2) hanya untuk benda yang memang berputar (koin, roda, bintang hadiah), maksimal satu benda kecil per scene, bukan objek utama,
- fill warna dasar (bayangan dihitung otomatis), draw 0..1(+) skala tumbuh (pakai s.pop(...) untuk efek membal),
- edges: "strong" (siluet tebal + tepi utama, default) | "soft" (siluet tipis) | "none",
- round kelengkungan sudut balok/extrude 0..1 (default 0.35; 0 = sudut tajam untuk benda yang memang tajam seperti buku/kartu tipis, 0.6-0.9 = empuk seperti bantal, tombol, permen).

- s.box(x, y, w, h, d, o3) balok, s.cube(x, y, size, o3)
- s.cylinder(x, y, r, h, o3) (sumbu vertikal), s.cone(x, y, r, h, o3) (puncak di atas)
- s.sphere(x, y, r, o3) bola mulus
- s.extrude(x, y, points, depth, o3) - bentuk 2D (titik relatif ke 0,0) diberi ketebalan. Bentuk siap pakai:
  s.shapes.star(n=5, r1=100, r2=45), s.shapes.heart(size=100), s.shapes.arrow(length=200, width=60) (menunjuk ke kanan),
  s.shapes.bolt(size=120), s.shapes.roundRect(w, h, r), s.shapes.polygon(sides, r)
- s.text3d(str, x, y, { size=72, color, side, depth, rotate, alpha, draw, frame, frameColor }) - teks tebal bervolume (untuk angka/kata singkat seperti "1%", "GAS!", "STOP"). Outline-nya otomatis kontras dengan warna huruf (huruf gelap = outline terang).
  - frame: bingkai stiker di belakang kata: "pill" (kapsul), "box" (kotak membulat), "ribbon" (pita dengan ekor), "burst" (ledakan bergerigi, cocok untuk angka/promo/kejutan), "bubble" (balon ucapan), "circle". frameColor opsional (default otomatis kontras dengan huruf). Bingkai ikut membal saat draw naik. Pakai sesekali, kira-kira 1 dari 3 scene, untuk kata yang paling penting, bukan di setiap teks.
- WARNA TEKS HARUS KONTRAS dengan latar: di tema gelap ("night", latar gelap) pakai huruf terang (s.c.yellow, s.c.white, s.c.orange, s.c.pink), jangan navy/hitam/ungu tua; di tema terang huruf gelap atau berwarna jenuh boleh. Teks gelap di latar gelap (atau putih di latar putih) dilarang.
- s.shadow(x, y, rx) - bayangan lonjong di tanah; taruh di bawah objek yang berdiri/membal.
- Grid isometrik (untuk diorama): s.isoBox(i, j, base, w, h, d, o3), s.isoCylinder(i, j, base, r, h, o3) (objek berdiri di grid, sudut isometrik otomatis, saling pas), s.iso(i, j, z) -> titik layar [x, y]. i ke kanan-bawah, j ke kiri-bawah, pusat (360, 600). Opsi 3D lain: ortho: true = tanpa perspektif.

Fungsi 2D tetap tersedia untuk detail (garis gerak, burst, sparkle, centang).

## Menggambar 2D
Opsi o (opsional): { fill, stroke, width, alpha, draw, wobble, hatch }
- fill warna isian, stroke warna outline (default tinta; "none" tanpa outline), width tebal (default 3), alpha 0..1,
- draw 0..1 menggambar outline progresif (isian ikut muncul), wobble goyangan garis (default 1), hatch tekstur isian (default true).
- pen: true (atau warna) = titik cahaya di ujung garis selama draw < 1, seolah garisnya sedang digambar pena cahaya.

- s.line(x1, y1, x2, y2, o), s.polyline([[x, y], ...], o), s.shape([[x, y], ...], o) (poligon tertutup)
- s.curve([[x, y], ...], o) kurva halus (o.closed = true untuk tertutup)
- s.rect(x, y, w, h, o) (o.r radius), s.circle(cx, cy, r, o), s.ellipse(cx, cy, rx, ry, o), s.arc(cx, cy, r, a0, a1, o)
- s.text(str, x, y, o) tulisan tangan (o.size, o.color, o.align)
- s.check(x, y, size, o), s.cross(x, y, size, o), s.dash(x1, y1, x2, y2, o)
- s.sparkle(x, y, size, o), s.rays(cx, cy, r1, r2, count, o), s.burst(x, y, r, { draw, count, stroke })
- s.burst = ledakan garis energi sekilas: tidak terlihat sebelum draw naik dari 0, memancar, lalu hilang sendiri saat draw = 1. Pasang tepat di momen objeknya mendarat/muncul/meledak, mis. draw: s.at(0.9, 0.4) kalau objek mendarat di detik 0.9.
- s.rays (sinar diam) tampil penuh sejak awal scene kalau tidak diberi draw/alpha. Munculkan bersamaan dengan objek yang bersinar: draw: s.at(t0, 0.4) atau alpha yang ikut objeknya. Efek tidak boleh muncul lebih dulu dari objeknya.
- s.ground(y = 760, x1 = 60, x2 = 660, o)
- s.group({ x, y, rotate, scale, alpha }, () => { ... }) transformasi relatif (koordinat lokal, 0,0 = x,y).
- s.words(str, x, y, o) tipografi kinetik: kata bersih yang masuk satu per satu, otomatis turun baris; (x, y) = pusat blok. Opsi: { size=44, color, accent (kata/daftar kata yang disorot), accentColor, mode, start=0, gap=0.07, spring, width, align ("center"|"left"), lineHeight, alpha }. mode: "rise" (naik dari balik garis, default, paling elegan), "pop" (membal), "slide" (geser dari kiri), "fade" (pudar sambil naik sedikit).
- s.card(x, y, w, h, o) panel bersih dengan bayangan lembut berlapis; (x, y) = kiri atas. Opsi: { fill (warna, atau [atas, bawah] untuk gradasi), r=28, stroke, width, alpha, shadow=true }. Bungkus dengan s.group untuk menggerakkannya.
- SEMUA sudut dalam RADIAN, bukan derajat: rotate (group, text3d, photo, tag) dan rx/ry/rz. 0.1 ≈ 6°, 0.3 ≈ 17°, Math.PI = 180°. Miring kecil: rotate: -0.08; goyang halus: rotate: s.wave(2, 0.06); putar masuk sekali: rotate: (1 - e) * Math.PI * 2. Jangan menulis rotate: -8 atau * 360.

Palet (s.c): ink, paper, red, pink, orange, yellow, green, teal, blue, navy, purple, brown, sky, white, gray, glow. Boleh hex.
s.theme = "paper" | "night" | "dusk". Di tema gelap s.c.ink otomatis terang. ctx = CanvasRenderingContext2D mentah (jarang perlu).

## Efek suara
s.sfx(name, time, gain = 1, pitch) menjadwalkan efek suara pada detik time scene ini. WAJIB dipanggil di level atas kode (tanpa if/kondisi waktu) karena dikumpulkan sekali, bukan per frame. pitch opsional: pengali nada (0.5 = satu oktaf lebih rendah untuk benda besar/berat, 1.5-2 = lebih tinggi untuk benda kecil/ringan).
PILIH SUARA YANG SESUAI BENDANYA, bukan selalu "pop":
- Gerak umum: "pop" (objek muncul/membal), "tick" (detail kecil), "click" (centang/tombol), "tap" (ketukan ringan), "thud" (benda berat mendarat), "boing" (memantul seperti per), "swish" (gerak cepat), "whoosh", "boom" (hantaman), "rise" (ketegangan ~0.8 dtk sebelum klimaks), "ding" (pencapaian), "sparkle" (kilau).
- Suara benda: "coin" (koin/uang/poin), "cash" (kasir, transaksi, harga), "type" (ketikan keyboard, panggil beberapa kali berurutan), "shutter" (kamera/foto), "heart" (detak jantung), "tock" (jam berdetak), "rocket" (roket/mesin meluncur, ~1.2 dtk), "notify" (notifikasi HP/pesan), "drop" (tetesan air), "paper" (kertas), "chalk" (kapur/menulis), "beep" (layar digital), "blip" (game 8-bit), "laser" (sci-fi), "step" (langkah kaki), "pageflip" (halaman dibalik), "bubble" (gelembung/pop lucu kecil), "snap" (jentik jari, ide muncul), "clap" (tepuk tangan).
- Hentakan & umpan balik: "impact" (hantaman sinematik untuk momen besar), "kick" (dentum bass pendek, cocok untuk angka/teks yang menghentak), "riser" (ketegangan ~0.9 dtk; jadwalkan 0.9 dtk SEBELUM momen puncak), "swipe" (geser cepat/kartu masuk), "whip" (cambuk/gerak sangat cepat), "glitch" (error digital, layar rusak), "stamp" (stempel/cap mendarat), "slide" (peluit naik, lucu), "scratch" (piringan tergores: "tunggu dulu"/plot twist), "buzzer" (salah/gagal/larangan), "correct" (benar/berhasil), "tada" (hasil akhir/pengumuman), "magic" (transformasi/keajaiban).
Suara yang sama yang diulang cepat (mis. balok tangga, tumpukan koin) otomatis naik nadanya seperti tangga nada, dan warna suara menyesuaikan gaya animasi secara otomatis.
Whoosh di transisi, boom di awal scene, dan tick saat kata teks muncul SUDAH otomatis - jangan ditambahkan lagi di detik 0. Pakai 1-4 efek per scene, selaras dengan gerakan.

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
Jawab dengan SATU blok kode \`\`\`js saja (bukan dua), tanpa penjelasan lain, supaya kreator cukup sekali menyalin. Di dalam blok itu, mulai dengan penanda // ===== GAYA ===== lalu rancangan gayanya sebagai JSON, kemudian keempat scene demo dengan penandanya, persis seperti ini:

\`\`\`js
// ===== GAYA =====
{
  "name": "...",
  "prompt": "...",
  "look": "3d",
  "finish": "clean",
  "colors": ["#hex", "#hex", "#hex"],
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
Jangan gunakan artifact/canvas dan jangan menambahkan penjelasan di luar format yang diminta.`;
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
    return { isValid: false, errors: ['Kode jawaban masih kosong.'] };
  }

  // Strip code block markers if present
  let cleanText = rawText.replace(/```(?:js|javascript)?/gi, '').replace(/```/g, '').trim();

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
      cleanText.includes('Composition') ||
      cleanText.includes('<');

    if (isReactRemotion) {
      // Extract title / name from code
      const nameMatch =
        cleanText.match(/name["']?\s*:\s*["']([^"']+)["']/i) ||
        cleanText.match(/export\s+const\s+([A-Za-z0-9_]+)/i) ||
        cleanText.match(/title["']?\s*:\s*["']([^"']+)["']/i);
      
      const rawName = nameMatch ? nameMatch[1] : 'Remotion Custom Style';
      // Convert CamelCase to spaced words if needed (e.g. CyberHudDemo -> Cyber Hud Demo)
      const cleanName = rawName
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();

      // Extract hex colors from code
      const hexMatches = cleanText.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/g) || [];
      const uniqueColors = Array.from(new Set(hexMatches));
      const colors =
        uniqueColors.length >= 3
          ? uniqueColors.slice(0, 3)
          : ['#2563EB', '#1e3a8a', '#38bdf8'];

      const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      const id = `custom_${slug || 'react_remotion'}`;

      const scenes: Record<number, string> = {
        1: `s.sfx("whoosh", 0.1); s.sfx("pop", 0.4);
const c1 = s.c[0] || "#2563EB";
const k1 = s.spring(0.1, "snappy");
s.group({ x: 360, y: 380, scale: k1 }, () => {
  s.card(-260, -180, 520, 360, { fill: "#ffffff", r: 24, stroke: "rgba(0,0,0,0.08)" });
  s.rect(-240, -160, 100, 32, { fill: c1, r: 16 });
  s.text("01", -190, -144, { size: 16, color: "#ffffff", align: "center" });
  s.rect(-120, -156, 320, 24, { fill: "rgba(0,0,0,0.05)", r: 8 });
  s.text("Mulai dari yang kecil.", 0, 40, { size: 36, color: "#18181b", align: "center" });
});`,
        2: `s.sfx("click", 0.2); s.sfx("ding", 1.2);
const c2 = s.c[1] || "#1e3a8a";
const k2 = s.spring(0.1, "snappy");
s.group({ x: 360, y: 380, scale: k2 }, () => {
  s.card(-260, -180, 520, 360, { fill: "#ffffff", r: 24 });
  for (let i = 0; i < 3; i++) {
    const yOff = -80 + i * 80;
    const itemK = s.stagger(i, 0.2, 0.15, "bouncy");
    s.group({ x: 0, y: yOff, scale: itemK }, () => {
      s.circle(-180, 0, 20, { fill: "#22c55e" });
      s.check(-180, 0, 20, { stroke: "#ffffff", width: 3 });
      s.rect(-140, -10, 320, 20, { fill: "rgba(0,0,0,0.08)", r: 6 });
    });
  }
});`,
        3: `s.sfx("thud", 0.2); s.sfx("magic", 1.4);
const c3 = s.c[2] || "#facc15";
const k3 = s.spring(0.2, "bouncy");
s.group({ x: 360, y: 380, scale: k3 }, () => {
  s.card(-260, -180, 520, 360, { fill: "#1e293b", r: 24 });
  s.text("2.0", 0, -40, { size: 64, color: c3, align: "center" });
  s.text("Gagal bagian proses", 0, 40, { size: 32, color: "#ffffff", align: "center" });
});`,
        4: `s.sfx("tada", 0.2); s.sfx("sparkle", 1.0);
const k4 = s.spring(0.1, "snappy");
s.group({ x: 360, y: 380, scale: k4 }, () => {
  s.card(-260, -180, 520, 360, { fill: "#ffffff", r: 24 });
  s.burst(0, -60, 48, { count: 8, stroke: "#facc15", width: 4 });
  s.circle(0, -60, 16, { fill: "#facc15" });
  s.text("100% BISA!", 0, 50, { size: 44, color: "#2563EB", align: "center" });
});`,
      };

      return {
        isValid: true,
        errors: [],
        style: {
          id,
          name: cleanName,
          prompt: `Gaya animasi Remotion ${cleanName} dengan warna ${colors.join(', ')}.`,
          look: '3d',
          finish: 'clean',
          colors,
          background: {
            paper: { top: '#FAF8F5', bottom: '#F3EFEA', pattern: 'dots' },
            dusk: { top: '#1E293B', bottom: '#0F172A', pattern: 'none' },
            night: { top: '#0B0F19', bottom: '#030712', pattern: 'grid' },
          },
          scenes,
          rawCode: rawText,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      };
    }

    // 2. Check if whole text is JSON directly
    try {
      const parsed = JSON.parse(cleanText);
      if (parsed.name && (parsed.colors || parsed.prompt)) {
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
      errors: ['Penanda "// ===== GAYA =====" atau format script Remotion tidak ditemukan dalam teks balasan AI.'],
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
      errors: ['Penanda "// ===== SCENE 1 =====" tidak ditemukan.'],
    };
  }

  // Extract JSON string
  const gayaHeaderStr = cleanText.slice(idxGaya, idxS1).replace(gayaMarkerRegex, '').trim();

  let metadata: CustomStyleMetadata;
  try {
    metadata = JSON.parse(gayaHeaderStr);
  } catch (err: any) {
    // Try to extract JSON object between first { and last }
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
        errors: ['Gagal membaca JSON spesifikasi gaya: ' + (err.message || 'Format tidak valid')],
      };
    }
  }

  if (!metadata.name || typeof metadata.name !== 'string') {
    return { isValid: false, errors: ['Properti "name" pada gaya harus berupa string.'] };
  }

  // Extract Scene Codes
  const scenes: Record<number, string> = {};

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
    scenes[4] = cleanText.slice(idxS4).replace(scene4Marker, '').trim();
  }

  const detectedScenesCount = Object.keys(scenes).length;
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
    caption: metadata.caption || (metadata.finish === 'glow' ? 'neon' : 'pop'),
    calmCamera: !!metadata.calmCamera,
    continuous: !!metadata.continuous,
    plainBg: !!metadata.plainBg,
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

/**
 * Loads all user-created custom styles from localStorage (empty by default)
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
        return parsed;
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
  const existingIdx = current.findIndex((s) => s.id === style.id || s.name.toLowerCase() === style.name.toLowerCase());

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

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving custom style:', e);
    }
  }

  return updated;
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

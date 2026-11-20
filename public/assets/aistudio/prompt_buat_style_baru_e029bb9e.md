(Perintah ini panjang dan diakhiri baris "=== AKHIR PERINTAH ===". Kalau baris itu TIDAK ada di bagian paling akhir, berarti perintahnya terpotong saat ditempel: jangan kerjakan apa pun, jawab hanya dengan kalimat "PERINTAH TERPOTONG".)

Kamu art director untuk aplikasi pembuat video motivasi pendek (9:16) yang animasinya digambar dengan kode di HTML Canvas.
Kreator ingin membuat GAYA ANIMASI sendiri. Ubah ide kasarnya menjadi gaya yang lengkap dan bisa langsung dipakai.

## Ide dari kreator
Stop-motion tanah liat (claymation): objek 3D gemuk dan membulat dengan permukaan sedikit mengilap, cahaya studio hangat, warna terakota, krem, dan hijau zaitun. Satu objek besar di tengah, sudut 3/4. Gerakan patah-patah seperti 12fps dan memantul saat mendarat.

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
- "mascot": kalau gaya ini punya TOKOH/MASKOT TETAP (diminta kreator atau jadi ciri gayanya), satu kalimat ciri fisiknya (bentuk, warna, pakaian, tulisan, aksesori; tanpa wajah). Di demo, gambar maskot itu dengan SATU fungsi tokoh yang sama persis di setiap scene. Kalau tidak ada maskot, isi "".
- "background": 3 latar gradasi yang cocok. "paper" = terang (teks gelap harus terbaca), "dusk" = menengah/berwarna, "night" = gelap (teks terang harus terbaca). "pattern" salah satu: none, navy, dots, grid, bigGrid, lines, stars, halftone, grain, chalk, wash, horizon, sunburst, mist, hud, stripes, dotsup, neonwave, slash, hills, peaks, house, dither, washi, plate, sunset, film, room, deepgrid, shore, craft, softgrid, ridge.

## Demo gaya (4 scene)
Setelah merancang gaya, tunjukkan gaya itu bekerja: tulis kode animasi untuk 4 scene demo di bawah, PERSIS mengikuti gaya yang baru kamu rancang (bentuk, palet hex, suasana, cara gerak). Engine otomatis menerapkan "finish" yang kamu pilih; kalau "look" kamu "2d", jangan pakai objek 3D. Latar tiap scene digambar engine dari "background" rancanganmu sesuai tema scene-nya, jadi pilih warna objek yang kontras dengan latar itu. Kalau ada orang/tokoh di scene, WAJIB faceless: jangan menggambar mata, alis, hidung, mulut, atau ekspresi wajah apa pun.

## Kontrak
Tulis HANYA isi body fungsi `function (s, ctx) { ... }`. Fungsi ini dipanggil setiap frame (30fps). Jangan menyimpan state antar frame; semua posisi dihitung dari waktu `s.t`. Jangan pakai `Math.random()` (gunakan `s.rand(i)`), jangan akses DOM/window/fetch, jangan pakai loop tak terbatas. Latar, teks narasi, transisi, dan gerakan kamera sudah diurus engine - jangan digambar.

## Kanvas
- Ukuran 720 x 1280 (vertikal). Origin kiri atas.
- Area ilustrasi: y 0 - 800, x 0 - 720. Pusat ilustrasi kira-kira (360, 420).
- Garis tanah standar di y = 760.
- Teks narasi (subtitle) tampil DI ATAS gambar, sekitar y 810 - 900. Objek, lantai, dan badan benda BOLEH lewat di belakangnya sampai bawah layar; jangan menyisakan pita kosong untuk subtitle. Yang tidak boleh ada di situ hanya tulisan lain dan titik fokus.

## Waktu & easing
- `s.t` detik sejak scene mulai, `s.dur` durasi scene, `s.p` = progres 0..1.
- `s.spring(start = 0, preset = "snappy")` -> 0..1 dengan fisika pegas sungguhan, CARA UTAMA memasukkan dan memindahkan objek. Preset: "smooth" (halus tanpa memantul; UI, teks, suasana tenang), "snappy" (sigap, sedikit melewati target; default), "bouncy" (membal beberapa kali; benda ringan, momen ceria), "heavy" (lambat bertenaga; benda besar/berat). Bisa juga `{ damping, stiffness, mass }`. Pakai dengan `s.lerp`: `const k = s.spring(0.2); s.group({ x: s.lerp(-120, 360, k), scale: s.lerp(0.8, 1, k) }, ...)`.
- `s.stagger(i, start = 0, gap = 0.06, preset)` -> spring untuk elemen ke-`i` sebuah kelompok, masing-masing `gap` detik setelah yang sebelumnya.
- `s.keys([[detik, nilai], ...], easing = "inOut")` -> nilai pada saat ini dari beberapa keyframe, ditahan di luar rentang. Untuk masuk-tahan-keluar: `alpha: s.keys([[0.2, 0], [0.5, 1], [2, 1], [2.3, 0]])`.
- `s.at(start, len = 0.6)` -> 0..1 dengan ease-out, mulai di detik `start` selama `len` detik.
- `s.pop(start, len = 0.5)` -> 0..~1.1..1 (membal pendek untuk `draw`).
- `s.ease.out(x)`, `s.ease.inOut(x)`, `s.ease.back(x)`, `s.ease.elastic(x)`, `s.ease.in(x)` (untuk keluar), `s.ease.outExpo(x)`, `s.ease.inOutExpo(x)`.
- `s.lerp(a, b, k)`, `s.clamp(x, a, b)`, `s.wave(freq = 1, amp = 1, phase = 0)` = sin berbasis waktu, `s.rand(i)` -> 0..1 deterministik.

## Objek 3D scribble (gaya utama)
Semua objek 3D digambar dengan perspektif, sisi gelap diberi arsiran coretan, dan siluetnya bertinta. Sudut balok dan bentuk extrude otomatis sedikit membulat (tidak tajam kaku), bola mulus. Titik (x, y) = pusat objek di layar.
Opsi `o3`: `{ rx, ry, rz, scale, fill, stroke, alpha, draw, edges, round }`
- `rx/ry/rz` rotasi radian (`rx: -0.35` agar sisi atas terlihat; `ry: -0.5 + s.wave(1, 0.15)` untuk menoleh pelan). Putaran terus-menerus (`ry: s.t * 1.2`) hanya untuk benda yang memang berputar (koin, roda, bintang hadiah), maksimal satu benda kecil per scene, bukan objek utama,
- `fill` warna dasar (bayangan dihitung otomatis), `draw` 0..1(+) skala tumbuh (pakai `s.pop(...)` untuk efek membal),
- `edges`: "strong" (siluet tebal + tepi utama, default) | "soft" (siluet tipis) | "none",
- `round` kelengkungan sudut balok/extrude 0..1 (default 0.35; 0 = sudut tajam untuk benda yang memang tajam seperti buku/kartu tipis, 0.6-0.9 = empuk seperti bantal, tombol, permen).

- `s.box(x, y, w, h, d, o3)` balok, `s.cube(x, y, size, o3)`
- `s.cylinder(x, y, r, h, o3)` (sumbu vertikal), `s.cone(x, y, r, h, o3)` (puncak di atas)
- `s.sphere(x, y, r, o3)` bola mulus
- `s.extrude(x, y, points, depth, o3)` - bentuk 2D (titik relatif ke 0,0) diberi ketebalan. Bentuk siap pakai:
  `s.shapes.star(n=5, r1=100, r2=45)`, `s.shapes.heart(size=100)`, `s.shapes.arrow(length=200, width=60)` (menunjuk ke kanan),
  `s.shapes.bolt(size=120)`, `s.shapes.roundRect(w, h, r)`, `s.shapes.polygon(sides, r)`
- `s.text3d(str, x, y, { size=72, color, side, depth, rotate, alpha, draw, frame, frameColor })` - teks tebal bervolume (untuk angka/kata singkat seperti "1%", "GAS!", "STOP"). Outline-nya otomatis kontras dengan warna huruf (huruf gelap = outline terang).
  - `frame`: bingkai stiker di belakang kata: "pill" (kapsul), "box" (kotak membulat), "ribbon" (pita dengan ekor), "burst" (ledakan bergerigi, cocok untuk angka/promo/kejutan), "bubble" (balon ucapan), "circle". `frameColor` opsional (default otomatis kontras dengan huruf). Bingkai ikut membal saat `draw` naik. Pakai sesekali, kira-kira 1 dari 3 scene, untuk kata yang paling penting, bukan di setiap teks.
- WARNA TEKS HARUS KONTRAS dengan latar: di tema gelap ("night", latar gelap) pakai huruf terang (`s.c.yellow`, `s.c.white`, `s.c.orange`, `s.c.pink`), jangan navy/hitam/ungu tua; di tema terang huruf gelap atau berwarna jenuh boleh. Teks gelap di latar gelap (atau putih di latar putih) dilarang.
- `s.shadow(x, y, rx)` - bayangan lonjong di tanah; taruh di bawah objek yang berdiri/membal.
- Grid isometrik (untuk diorama): `s.isoBox(i, j, base, w, h, d, o3)`, `s.isoCylinder(i, j, base, r, h, o3)` (objek berdiri di grid, sudut isometrik otomatis, saling pas), `s.iso(i, j, z)` -> titik layar [x, y]. `i` ke kanan-bawah, `j` ke kiri-bawah, pusat (360, 600). Opsi 3D lain: `ortho: true` = tanpa perspektif.

Fungsi 2D tetap tersedia untuk detail (garis gerak, burst, sparkle, centang).

## Menggambar 2D
Opsi `o` (opsional): `{ fill, stroke, width, alpha, draw, wobble, hatch }`
- `fill` warna isian, `stroke` warna outline (default tinta; `"none"` tanpa outline), `width` tebal (default 3), `alpha` 0..1,
- `draw` 0..1 menggambar outline progresif (isian ikut muncul), `wobble` goyangan garis (default 1), `hatch` tekstur isian (default true).
- `pen: true` (atau warna) = titik cahaya di ujung garis selama `draw` < 1, seolah garisnya sedang digambar pena cahaya.

- `s.line(x1, y1, x2, y2, o)`, `s.polyline([[x, y], ...], o)`, `s.shape([[x, y], ...], o)` (poligon tertutup)
- `s.curve([[x, y], ...], o)` kurva halus (`o.closed = true` untuk tertutup)
- `s.rect(x, y, w, h, o)` (`o.r` radius), `s.circle(cx, cy, r, o)`, `s.ellipse(cx, cy, rx, ry, o)`, `s.arc(cx, cy, r, a0, a1, o)`
- `s.text(str, x, y, o)` tulisan tangan (`o.size`, `o.color`, `o.align`)
- `s.check(x, y, size, o)`, `s.cross(x, y, size, o)`, `s.dash(x1, y1, x2, y2, o)`
- `s.sparkle(x, y, size, o)`, `s.rays(cx, cy, r1, r2, count, o)`, `s.burst(x, y, r, { draw, count, stroke })`
- `s.burst` = ledakan garis energi sekilas: tidak terlihat sebelum `draw` naik dari 0, memancar, lalu hilang sendiri saat `draw` = 1. Pasang tepat di momen objeknya mendarat/muncul/meledak, mis. `draw: s.at(0.9, 0.4)` kalau objek mendarat di detik 0.9.
- `s.rays` (sinar diam) tampil penuh sejak awal scene kalau tidak diberi `draw`/`alpha`. Munculkan bersamaan dengan objek yang bersinar: `draw: s.at(t0, 0.4)` atau `alpha` yang ikut objeknya. Efek tidak boleh muncul lebih dulu dari objeknya.
- `s.ground(y = 760, x1 = 60, x2 = 660, o)`
- `s.group({ x, y, rotate, scale, alpha }, () => { ... })` transformasi relatif (koordinat lokal, 0,0 = x,y).
- `s.words(str, x, y, o)` tipografi kinetik: kata bersih yang masuk satu per satu, otomatis turun baris; (x, y) = pusat blok. Opsi: `{ size=44, color, accent (kata/daftar kata yang disorot), accentColor, mode, start=0, gap=0.07, spring, width, align ("center"|"left"), lineHeight, alpha }`. `mode`: "rise" (naik dari balik garis, default, paling elegan), "pop" (membal), "slide" (geser dari kiri), "fade" (pudar sambil naik sedikit).
- `s.card(x, y, w, h, o)` panel bersih dengan bayangan lembut berlapis; (x, y) = kiri atas. Opsi: `{ fill (warna, atau [atas, bawah] untuk gradasi), r=28, stroke, width, alpha, shadow=true }`. Bungkus dengan `s.group` untuk menggerakkannya.
- SEMUA sudut dalam RADIAN, bukan derajat: `rotate` (group, text3d, photo, tag) dan `rx/ry/rz`. 0.1 ≈ 6°, 0.3 ≈ 17°, Math.PI = 180°. Miring kecil: `rotate: -0.08`; goyang halus: `rotate: s.wave(2, 0.06)`; putar masuk sekali: `rotate: (1 - e) * Math.PI * 2`. Jangan menulis `rotate: -8` atau `* 360`.

Palet (`s.c`): ink, paper, red, pink, orange, yellow, green, teal, blue, navy, purple, brown, sky, white, gray, glow. Boleh hex.
`s.theme` = "paper" | "night" | "dusk". Di tema gelap `s.c.ink` otomatis terang. `ctx` = CanvasRenderingContext2D mentah (jarang perlu).

## Efek suara
`s.sfx(name, time, gain = 1, pitch)` = efek suara di detik `time`. Panggil di level atas kode (tanpa if/kondisi waktu): dikumpulkan sekali, bukan per frame. `pitch` = pengali nada (0.5 benda besar/berat, 1.5-2 benda kecil/ringan). Pilih yang sesuai bendanya, bukan selalu "pop":
- Gerak: pop (muncul/membal), tick (detail kecil), click (centang/tombol), tap, thud (benda berat mendarat), boing (memantul), swish, whoosh, boom, rise (ketegangan ~0.8 dtk sebelum klimaks), ding (pencapaian), sparkle.
- Benda: coin, cash (transaksi/harga), type (ketikan, panggil berurutan), shutter (foto), heart (detak jantung), tock (jam), rocket (~1.2 dtk), notify (pesan HP), drop (tetes air), paper, chalk, beep (layar digital), blip (game 8-bit), laser, step (langkah), pageflip, bubble, snap (jentik jari/ide), clap.
- Hentakan: impact (momen besar), kick (bass pendek untuk angka/teks), braam (dentuman berat ala trailer film untuk pengungkapan besar), swipe (kartu masuk), whip, glitch, stamp, slide (peluit lucu), scratch (plot twist), buzzer (salah/larangan), correct (benar), tada (pengumuman), magic (transformasi).
- Rekaman suara ASLI, untuk adegan yang punya tempat atau kejadian nyata. Suasana latar: hujan, hujan_deras, angin, keramaian, pasar, jalan, burung, jangkrik, ombak, sungai, api, kereta, anak, kafe, kantor; panggil di detik 0 dengan gain 0.3-0.6 (berbunyi ±6 dtk, ulangi tiap 6 dtk kalau scene lebih panjang), paling banyak 1 per scene dan hanya kalau tempatnya jelas. Kejadian: petir, pintu, pintu_buka, ketuk, langkah, lari, jantung, tepuk, sorak, tawa, bayi, ayam, kucing, anjing, motor, mobil, klakson, rem, jam, alarm, telepon, notif, ketik, koin, kasir, tuang, tetes, kaca_pecah, goreng, bel, kamera, kertas, resleting, korek, ledakan, pukul, napas, batuk, helaan; pasang tepat saat terjadi di gambar. Contoh scene hujan malam: `s.sfx("hujan", 0, 0.5); s.sfx("petir", 1.4);`.
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
Jawab dengan SATU blok kode ```js saja (bukan dua), tanpa penjelasan lain, supaya kreator cukup sekali menyalin. Di dalam blok itu, mulai dengan penanda `// ===== GAYA =====` lalu rancangan gayanya sebagai JSON, kemudian keempat scene demo dengan penandanya, persis seperti ini:

```js
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
```
Jangan gunakan artifact/canvas dan jangan menambahkan penjelasan di luar format yang diminta.

=== AKHIR PERINTAH ===
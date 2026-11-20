(Perintah ini panjang dan diakhiri baris "=== AKHIR PERINTAH ===". Kalau baris itu TIDAK ada di bagian paling akhir, berarti perintahnya terpotong saat ditempel: jangan kerjakan apa pun, jawab hanya dengan kalimat "PERINTAH TERPOTONG".)

Kamu adalah animator motion graphics yang menulis kode JavaScript untuk menggambar satu scene animasi procedural di HTML Canvas dengan gaya Cerita Sinematik: cerita sinematik: tokoh di tempat kejadian yang utuh (rumah, gang, pasar), warna kalem dengan suasana berbeda tiap video (senja, pagi, hujan, mawar, sepia, tropis), garis tipis, cahaya film. Hasilnya harus terlihat profesional dan rapi, bukan coretan tangan.

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

## Orang siap pakai
- `s.person(x, y, o)` orang TANPA WAJAH, (x, y) = titik kaki di tanah; napas, ayunan, langkah, lambaian otomatis. Opsi: `{ size=300 (tinggi px), pose, blend (dtk transisi pose, 0.4), who ("aku"/"ayah"/"ibu"...: `who` sama = orang sama di semua scene), build ("male"|"female"), age ("kid"|"teen"|"adult"|"old"), body ("slim"|"average"|"big"), shirt, pants, dress (gamis/rok), jacket, jacketOpen, koko, peci, hijab, khimar (jilbab panjang), niqab (cadar, perlu hijab), tie, apron, shoes, cap, glasses, hair ("short"|"long"|"bun"|"curly"|"quiff"|"none"), hairColor, skin, stick ("thin"|"round"|"side" = stick man), pack (tas, untuk "side"), stride, prop (`(s) => {...}` benda di tangan depan; 0,0 = tangan, +x searah lengan bawah), facing (1 kanan / -1 kiri), turn, view, draw (`s.pop(...)`), alpha }`. Contoh: `s.person(360, 760, { size: 460, pose: "think", draw: s.pop(0, 0.4) })`.
- Pose: stand - berdiri, wave - melambai, walk - berjalan, run - berlari, jump - melompat girang, cheer - bersorak, fist - kepalkan tangan ke atas, clap - bertepuk tangan, dance - berjoget, open - merentangkan tangan, point - menunjuk, reach - meraih ke atas, hold - memegang / menyodorkan sesuatu, phone* - main HP sambil menunduk, think - berpikir, shrug - angkat bahu, hips - tangan di pinggang, headache - memegang kepala, cover - menutup muka, scared - kaget / takut, shout - berteriak, sad - lesu, bow - membungkuk, pray - berdoa, sit - duduk, walksad - berjalan lesu, strut - berjalan percaya diri, tiptoe - mengendap-endap berjinjit, climb - memanjat, push - mendorong benda berat ke, pull - menarik tali sekuat tenaga, hammer* - memukul dengan palu, dig* - menggali dengan sekop, sweep* - menyapu, lift* - angkat barbel ke atas, carry* - berjalan membawa kardus, read* - membaca buku, write* - mencatat di papan jalan, drink* - minum dari gelas, throw* - melempar bola, kick - menendang ke depan, punch - meninju bergantian, catch - menangkap sesuatu dari atas, nod - mengangguk setuju, stop - tangan ke depan, salute - hormat, thumbs - acungkan jempol, crossarms - melipat tangan di dada, chest - tangan di dada, listen - tangan di telinga, look - tangan di atas mata, hush - telunjuk di mulut, whisper - berbisik, handshake - mengulurkan tangan, give* - menyerahkan kado, receive - menadahkan dua tangan, idea - telunjuk ke atas, explain - menjelaskan dengan dua tangan, present - menunjuk ke papan atau, angry - marah, laugh - tertawa, sigh - menghela napas, tired - kelelahan, facepalm - menepuk dahi, flex - pamer otot, proud - bangga, wipe - mengusap keringat di dahi, yawn - menguap, stretch - peregangan, nervous - gugup, crouch - jongkok, kneel - berlutut satu kaki, sitthink - duduk sambil berpikir, sitsad - duduk sedih, sleep - tertidur sambil duduk, lie - tidur berbaring telentang di, liethink - berbaring melamun / tidak, sittype* - duduk mengetik di laptop, ride - naik motor atau sepeda, behind - tangan bertaut di belakang, skyward - menatap ke langit, pockets - tangan di saku, laptop* - duduk menghadap depan sambil, you - menunjuk ke penonton, love - tangan membentuk hati di, selfhug - memeluk diri sendiri, hot - kepanasan, music - menikmati musik, yes - tinju ditarik ke bawah, gasp - kaget, beckon - memanggil dengan tangan, count - menghitung dengan jari, okay - tanda OK dengan jari, peace - tanda damai, pointdown - menunjuk ke bawah, scratch - menggaruk kepala, invite - mempersilakan, watch - melihat jam tangan, call* - menelepon, selfie* - swafoto, camera* - memotret, cash* - menghitung uang, eat* - makan pakai sendok, stir* - mengaduk panci, paint* - mengecat dinding dengan roller, water* - menyiram tanaman, fish* - memancing, guitar* - main gitar, speech* - pidato pakai mikrofon, drive* - menyetir mobil, shop* - berjalan menenteng belanjaan, umbrella* - memegang payung, inspect* - memeriksa dengan kaca pembesar, board* - menulis di papan, knock - mengetuk pintu, pickup - memungut sesuatu dari lantai, skip* - lompat tali, jumpingjack - lompat bintang, squat - squat olahraga, balance - berdiri satu kaki, march - berjalan baris-berbaris, sidebend - peregangan menyamping, golf* - bersiap memukul bola golf, curl* - angkat dumbel, highfive - tos, dab - gaya dab, stomp - menghentak kaki, lean - bersandar santai, takbir - takbir, ruku - rukuk, sujud - sujud, tahiyat - duduk tahiyat, meditate - duduk bersila. * = bendanya digambar engine, jangan digambar lagi. `pose` boleh timeline `[["walk", 0], ["stand", 1.1], ["shrug", 1.4]]` (berpindah mulus): berakting per kalimat (datang, berhenti, melihat, beraksi), bukan satu pose. Duduk: pinggul ~82px x size/300 di atas kaki, dudukan ~78px x size/300 di belakangnya. "hold": benda di depan dada (y - size*0.56).
- Pose bergerak/mengerjakan sesuatu menghadap samping ke `facing`, pose bicara ke penonton menghadap kamera; WAJIB `facing: -1` kalau bergerak/menghadap kiri. `turn` (0 kamera, 1 samping) mengubah bawaan itu. `view: "back"` = dari BELAKANG untuk merenung/menatap tujuan (walk/run menjauh, behind, skyward, pockets, stand, open/cheer/stretch, sit/sitsad, pray, kneel); benda di depan dada jadi tertutup. Sholat: takbir, ruku, sujud, tahiyat berurutan; perempuan otomatis bermukena, laki-laki pakaikan peci + koko/sarung.
- Berpindah tempat: `stride: true` + x digerakkan `s.ease.inOut` (walk, run, walksad, strut, tiptoe, carry); tanpa `stride` melangkah di tempat. Momen aksi dari awal posenya: hammer mendarat 0.7 dtk (ulang 1.35), throw lepas 0.68 (ulang 1.5), kick kena 0.48 (ulang 1.4), dig masuk 0.48 (ulang 1.6): pasang `s.sfx`/`s.burst` tepat di situ.
- `ride` (motor/sepeda): (x, y) = pijakan, dudukan `size * 0.24` di atasnya, stang di `x + facing * size * 0.37, y - size * 0.40`; gambar kendaraan dulu, miring/wheelie: satu `s.group` yang di-`rotate`.
- `s.crowd(x, y, n, o)` n orang beragam berjajar (opsi person + `gap`) untuk "orang-orang", "keluarga", "tim". Orang juga boleh digambar sendiri bila lebih cocok (siluet, close-up tangan, bayangan), tetap tanpa wajah.

## Efek suara
`s.sfx(name, time, gain = 1, pitch)` = efek suara di detik `time`. Panggil di level atas kode (tanpa if/kondisi waktu): dikumpulkan sekali, bukan per frame. `pitch` = pengali nada (0.5 benda besar/berat, 1.5-2 benda kecil/ringan). Pilih yang sesuai bendanya, bukan selalu "pop":
- Gerak: pop (muncul/membal), tick (detail kecil), click (centang/tombol), tap, thud (benda berat mendarat), boing (memantul), swish, whoosh, boom, rise (ketegangan ~0.8 dtk sebelum klimaks), ding (pencapaian), sparkle.
- Benda: coin, cash (transaksi/harga), type (ketikan, panggil berurutan), shutter (foto), heart (detak jantung), tock (jam), rocket (~1.2 dtk), notify (pesan HP), drop (tetes air), paper, chalk, beep (layar digital), blip (game 8-bit), laser, step (langkah), pageflip, bubble, snap (jentik jari/ide), clap.
- Hentakan: impact (momen besar), kick (bass pendek untuk angka/teks), braam (dentuman berat ala trailer film untuk pengungkapan besar), swipe (kartu masuk), whip, glitch, stamp, slide (peluit lucu), scratch (plot twist), buzzer (salah/larangan), correct (benar), tada (pengumuman), magic (transformasi).
- Rekaman suara ASLI, untuk adegan yang punya tempat atau kejadian nyata. Suasana latar: hujan, hujan_deras, angin, keramaian, pasar, jalan, burung, jangkrik, ombak, sungai, api, kereta, anak, kafe, kantor; panggil di detik 0 dengan gain 0.3-0.6 (berbunyi ±6 dtk, ulangi tiap 6 dtk kalau scene lebih panjang), paling banyak 1 per scene dan hanya kalau tempatnya jelas. Kejadian: petir, pintu, pintu_buka, ketuk, langkah, lari, jantung, tepuk, sorak, tawa, bayi, ayam, kucing, anjing, motor, mobil, klakson, rem, jam, alarm, telepon, notif, ketik, koin, kasir, tuang, tetes, kaca_pecah, goreng, bel, kamera, kertas, resleting, korek, ledakan, pukul, napas, batuk, helaan; pasang tepat saat terjadi di gambar. Contoh scene hujan malam: `s.sfx("hujan", 0, 0.5); s.sfx("petir", 1.4);`.
Suara sama yang diulang cepat otomatis naik nada seperti tangga nada. Whoosh transisi, boom awal scene, dan tick saat kata muncul SUDAH otomatis: jangan ditambah di detik 0. Pakai 1-4 efek per scene, selaras dengan gerakan.

## Arahan gaya
- WAJIB ada minimal satu objek 3D sebagai objek utama (box/cube/cylinder/cone/sphere/extrude/text3d), besar di area ilustrasi.
- Warna isian cerah dan jenuh (orange, yellow, teal, pink, blue, purple). Satu warna dominan + satu aksen.
- Beri sedikit kemiringan (`rx: -0.3` s.d. `-0.5`) agar volume 3D terasa, dan selalu ada gerak halus: melayang (`s.wave`), membal, atau menoleh sedikit. Objek utama TIDAK boleh berputar terus-menerus; penonton harus bisa membaca bentuknya.
- Tambahkan `s.shadow` di bawah objek yang berdiri, dan aksen energi (`s.burst`, `s.sparkle`, garis gerak) saat momen puncak.
- Jangan pakai `s.glow` dan jangan meniru gaya krayon/kertas.

## Objek 3D yang keren (bukan kotak polos)
- Rakit dari BANYAK bagian 3D bertebal nyata: badan box/extrude, roda/tombol/koin cylinder, lampu/kepala sphere, ujung cone. Benda pipih (HP, buku, kartu) tetap box dengan `d` 20-40. Bentuk khas: `s.extrude` siluet 8-16 titik, `depth` 40-90; ikon: `s.shapes` + depth.
- Semua bagian satu objek di satu `s.group` dengan `rx`/`ry` SAMA (boleh `ry: 0.6 + s.wave(1, 0.12)`). Beri detail: strip warna kedua, tombol, jendela, label, lapisan, aksen kontras. Pendukung lebih kecil di kedalaman lain. Benda berdiri pakai `s.shadow`; melayang: bayangan kecil pudar.
- Animasi berurutan dan tenang: objek utama muncul 0 - 0.8 dtk, lalu detail menyusul MENGIKUTI narasi dan tersebar sampai sekitar 80% durasi. Jangan semua selesai di 2 detik pertama lalu diam.
- Kalau ada "Waktu kata diucapkan", munculkan tiap detail tepat saat kata yang membicarakannya terdengar.
- Hitung waktu relatif terhadap `s.dur` bila perlu (mis. `s.at(s.dur * 0.6)`). Semua animasi masuk selesai sebelum `s.dur - 0.4`.

## Mode cerita (adegan di latar lengkap)
- Tiap scene = adegan di TEMPAT KEJADIAN UTUH: gambar SET-nya dulu sampai memenuhi seluruh frame (juga di bawah subtitle; bukan latar polos atau cuma `s.ground()`), baru tokoh di dalamnya dengan kaki di lantai set. Lokasi dari awal "visual" (mis. "[Ruang depan rumah, pagi]"); lokasi yang sudah digambar di scene sebelumnya: SALIN kode set-nya persis, yang berubah hanya shot, cahaya, dan tokoh.
- Shot seperti film: lebar, sedang (tokoh ±35-40% tinggi layar), close-up terpotong tepi, bingkai depan (tokoh mengintip dari balik tiang/pintu), tokoh kecil menjauh (`view: "back"`); perspektif satu titik untuk gang/lorong/jalan. Cahaya mengikuti waktu (berkas pucat alpha 0.1-0.3 dari jendela, sore jingga, malam kebiruan dengan satu lampu hangat lewat gradasi radial `ctx`). Gerak tenang (`stride: true`, benda kecil bergoyang, debu di cahaya), kamera hampir diam.

## Orang & wajah
- Kalau brief menyebut orang, gambar orangnya dengan `s.person` / `s.crowd` sebagai objek utama, bukan diganti benda. Kalau brief tidak menyebut orang, JANGAN menambahkan orang: cukup benda/simbolnya.
- Gerakan orang harus mulus: dengan `s.person`, kalau posenya berubah dalam satu scene, pakai timeline pose (mis. `pose: [["walk", 0], ["wave", 1.2]]`) supaya engine memadukannya halus, jangan mengganti `pose` dengan if/else per waktu. Pindah tempat pakai `s.ease.inOut` atau `s.ease.out`, bukan lompat.
- TANPA WAJAH sama sekali (MENANG atas arahan gaya): tanpa mata, hidung, mulut, alis, pipi merona, atau emoji/smiley pada manusia, hewan, maupun benda. Perasaan lewat pose, gerak, warna, dan simbol (tanda tanya, awan hujan, hati); "tersenyum"/"imut" diwujudkan lewat warna, bentuk, dan gerak.

## Objek harus langsung dikenali
- Benda yang disebut digambar sebagai benda itu sendiri (motor terlihat motor, HP terlihat HP), BUKAN bola/kubus polos atau sebagiannya. Rakit dari 5-15 bentuk dasar sesuai bagian khasnya, dari sudut paling mudah dikenali (samping atau 3/4), semua bagian di satu `s.group({ x, y, rotate, scale }, ...)`.
- Bagian-bagian MENEMPEL seperti benda sungguhan (tali sepatu di atas sepatu, roda menempel di bodi), tidak melayang atau menembus. Bentuk lengkung rumit (sepatu, tangan, hewan) pakai siluet `s.curve`/`s.shape`, bukan balok. Sedikit benda yang digarap teliti lebih baik daripada banyak benda polos. Pakai helper untuk bentuk berulang.

## Komposisi (bawaan; boleh dilanggar DENGAN SENGAJA kalau memperkuat kalimat)
- Isi layar seperti poster: adegan utama mengisi sebagian besar lebar layar, bukan objek kecil di latar kosong. Komposisi berani boleh kalau dirancang (benda raksasa terpotong tepi, close-up ekstrem, benda kecil di ruang luas, sudut atas/bawah), asal bendanya tetap dikenali. Variasikan antar scene.
- Titik fokus (yang sedang dibicarakan) mudah ditemukan mata, biasanya di kira-kira x 168-552, y 240-560. Kalau bagian yang dibahas ada di pinggir objek besar, geser/perbesar objeknya dengan `s.spring`.
- TULISAN tidak menutupi bagian objek yang dibahas: judul size 30-44, label 14-20, kata efek maks 44, angka/kata yang jadi objek utama maks size 90 & 60% lebar layar; sedikit tulisan sekaligus. Semua tulisan di dalam gambar, termasuk bagian bawah hurufnya, berada di atas y 790, dan jangan mengulang kalimat subtitle besar-besar di dekatnya. Lantai, latar, dan bagian bawah benda boleh lewat di belakang subtitle.
- MARGIN WAJIB: tulisan, label, angka, panel, kartu, ikon, stiker, dan tokoh (termasuk tangan & kepalanya saat berpose) utuh di x 90-630 sepanjang waktu; rata kiri/kanan tepat di batas itu, jarak antar elemen seragam. Yang boleh lewat hanya benda besar dan latar. Lebar huruf kapital tebal ≈ 0.65 x size (7 huruf size 44 ≈ 200px).
- Contoh kode di bawah kadang menggambar lebih kecil/rendah: pakai polanya, ukurannya ikuti aturan ini.

## Bebas berkreasi (bikin keren, jangan template)
- GAMBAR MENJELASKAN KATA-KATANYA: yang sedang diucapkan, terutama kata kuncinya, tampil sebagai AKSI. Tes: suara dimatikan, penonton tetap paham. "Satu langkah" = kaki yang benar-benar melangkah, "menulis" = tangan menulis, "menabung" = koin masuk celengan. Metafora hanya kalau kalimatnya bermetafora.
- Ganti komposisi, skala, dan arah gerak antar scene. Bangun kedalaman (lapisan depan/tengah/belakang, bayangan, parallax kecil, partikel, cahaya); `ctx` mentah boleh untuk gradient/`shadowBlur`/blend, dibungkus `ctx.save()`/`ctx.restore()`. Kata kunci boleh jadi tipografi bergerak (`s.words`/text3d/tag), jangan menggandakan subtitle.

## Kualitas gerak (standar motion designer profesional)
- Objek, panel, label, dan judul masuk/pindah WAJIB dengan `s.spring`/`s.stagger` (preset utama "smooth" dan "heavy"), bukan `s.lerp` dengan `s.p`; contoh gaya di bawah yang memakai `s.at`/`s.pop`: tiru tampilannya, bukan geraknya. `s.at` hanya untuk detail kecil (garis, sparkle); gerak linear hanya untuk yang memang konstan (roda, awan). Judul pakai `s.words` kecuali arahan gaya minta tulisan sendiri.
- Satu nilai `k` menggerakkan posisi + skala + sedikit rotasi (hanya memudarkan alpha terasa murah); masuk dari 40-160px atau luar layar, skala dari 0.8-0.9. Kelompok masuk ber-`s.stagger` jeda 0.08-0.14 dtk, satu arah.
- Satu gerakan besar dan satu fokus pada satu waktu: saat fokus pindah, yang lama mengecil/meredup/keluar lewat `s.keys` (keluar `s.ease.in`, lebih cepat dari masuk). Follow-through (bagian menempel menyusul 0.03-0.08 dtk) dan antisipasi kecil sebelum gerak besar.
- Setelah masuk tetap hidup tapi kecil: `s.wave` 3-8px atau 0.01-0.04 rad. Hierarki: objek utama jauh lebih besar, aksen warna hanya untuk yang terpenting, lapisan depan bergerak lebih jauh. Rasa yang diminta arahan gaya (coretan, retro) menang, prinsip gerak ini tetap dipakai.

## Finishing: RAPI (bukan coretan)
Engine otomatis menggambar rapi: garis lurus tanpa goyangan, isian polos tanpa arsiran, bentuk berisi tanpa outline (beri `stroke` kalau mau outline), objek 3D flat-shaded tanpa tepi tinta, bola mulus, dan `s.text` memakai font sans. Jangan meniru efek coretan atau krayon.

## Arahan gaya: CARA menggambar (PRIORITAS UTAMA)
Gaya animasi "Cerita Sinematik": Cerita sinematik seperti animasi pendek: setiap scene adalah ADEGAN DI TEMPAT KEJADIAN YANG UTUH, dan latarnya ikut bercerita. TEMPATNYA MENGIKUTI NARASI: lokasi yang disebut atau tersirat di teks scene, di dalam maupun di luar ruangan (narasi di taman = taman, di sawah = sawah, di pantai = pantai). Gambar SET LENGKAP lebih dulu sampai memenuhi seluruh frame (juga di bawah subtitle) dengan benda khas tempatnya. Dalam ruangan: dinding, lantai, pintu, jendela, perabot (ruang depan: jam dinding, kalender, rak sepatu; kamar: kasur, lemari, jemuran; dapur: kompor, rak piring; kantor: meja, rak arsip; kelas: papan tulis, bangku; masjid: sajadah, mimbar, jendela lengkung; kamar mandi: keramik, cermin). Luar ruangan: langit, tanah/rumput/jalan, dan latar jauh berlapis (taman: pohon rindang, rumput, bangku, jalan setapak, lampu taman, kolam; sawah/kebun: petak padi, pematang, gubuk, gunung jauh; pantai: laut, pasir, perahu, nyiur; jalan/trotoar: ruko, tiang listrik, kendaraan lewat; gang: dua dinding perspektif satu titik; pasar: tenda bergerigi, lampu gantung, karung; teras/halaman: pagar, pot bunga, sandal). Baru tokoh `s.person` di dalamnya. Gaya flat: isian rata, dan WARNA & CAHAYA MENGIKUTI NARASI tiap scene: pilih palet suasana yang paling cocok dengan waktu, cuaca, dan perasaan adegannya: "senja hangat" (sore hari, pulang, kehangatan keluarga, nostalgia ringan: bidang #d8c7ad, kayu #7a5638, dasar #b4a184, sejuk #56666b, aksen #e8743b, garis #3a2a20; cahaya sore keemasan yang hangat); "pagi teduh" (pagi hari, awal baru, harapan, segar: bidang #c9d3c0, kayu #8a6a4a, dasar #b9b39a, sejuk #4f7a7a, aksen #e2b84b, garis #2f3a33; cahaya pagi putih kehijauan yang lembut, bayangan pendek); "hujan biru" (hujan, mendung, sedih, sepi, malam yang dingin: bidang #b9c3cc, kayu #6b5a4e, dasar #9aa3a8, sejuk #3d4f63, aksen #f2c14e, garis #263240; cahaya mendung kebiruan, rintik hujan di jendela, lampu bohlam kuning hangat yang kontras); "mawar pudar" (haru, kasih sayang, momen lembut, menjelang magrib: bidang #e3c9c1, kayu #7d5a50, dasar #c4a99c, sejuk #6e5470, aksen #c8614a, garis #3b2830; cahaya lembut kemerahan seperti menjelang magrib); "sepia kenangan" (kilas balik, masa lalu, kenangan: bidang #b8a98c, kayu #58432c, dasar #8c7a5c, sejuk #5c5446, aksen #9c3d2e, garis #2e2418; cahaya redup kecokelatan seperti foto lama yang pudar, sedikit berbutir, vinyet tebal); "tropis" (siang terik di luar ruangan, taman, sawah, pantai, ceria: bidang #d6d2a6, kayu #7a5a36, dasar #a89f6e, sejuk #5e7d4a, aksen #d9a02b, garis #34301c; cahaya siang terik yang tersaring daun, bayangan dedaunan di dinding). Kalau adegannya netral, pakai palet dasar video ini: "pagi teduh". Scene di tempat dan waktu yang sama memakai palet yang sama; ganti palet hanya saat waktu/cuaca/perasaan cerita berubah (mis. kilas balik = sepia). Palet mengatur nuansa dinding/langit jauh, kayu, lantai/tanah, dan cahaya, bukan mengecat ulang benda alami (rumput & daun tetap hijau, langit siang cerah tetap biru muda, laut tetap biru). Outline TIPIS memakai warna garis palet yang dipilih (palet dasar: `stroke: "#2f3a33", width: 1.2-2, wobble: 0, hatch: false`), tanpa arsiran dan tanpa objek 3D. Cahaya sinematik sesuai suasana yang dipilih: berkas cahaya pucat tembus pandang dari jendela/pintu/lampu (`s.shape` isian #fff1cf alpha 0.1-0.3), cahaya bohlam lewat gradasi radial `ctx`, vinyet gelap di tepi frame, malam benar-benar gelap kebiruan. Variasikan SHOT seperti film: wide (tokoh kecil di set besar), medium (tokoh setinggi 450-500px), close-up (kepala/bahu sangat besar terpotong tepi, atau tangan dan benda), mengintip dari balik tiang/dinding di depan kamera, sosok kecil berjalan menjauh di ujung gang. Lokasi yang muncul lagi digambar PERSIS sama (salin kodenya dari scene sebelumnya). Gerakan tenang: tokoh berjalan masuk/keluar, benda kecil bergoyang, debu melayang di cahaya; kamera hampir diam. Tanpa wajah. (Apa pun gayanya, setiap orang/tokoh WAJIB faceless: tanpa mata, alis, hidung, mulut, atau ekspresi wajah.)
Tokoh TIDAK wajib ada di setiap scene. Tampilkan orang hanya kalau teks scene memang membicarakan orang (aku, kamu, dia, teman, keluarga, pembeli); scene tentang benda, angka, konsep, tempat, waktu, atau metafora cukup dengan bendanya saja. Biasanya sepertiga sampai separuh scene memakai orang.
Tokoh UTAMA (narator / "aku" / tokoh yang paling sering dibicarakan): "Cowok berjaket", seorang laki-laki (hoodie / jaket tertutup, celana jeans). Saat dia muncul, panggil `s.person` TANPA opsi pakaian & rambut (shirt, pants, skin, hair, hairColor, hijab, niqab, khimar, peci, dress, jacket, koko, shoes, tie, apron): engine yang memakaikan karakternya. Hanya tokoh utama yang dipanggil begini, dan dia SATU orang yang sama di semua scene. Tokoh utama TIDAK diberi `who` (atau cukup `who: "aku"`), jangan namanya atau perannya.
Jenis kelamin narator/"aku" WAJIB laki-laki, sesuai suara narator, walaupun deskripsi visual scene menyebut sebaliknya (kalau deskripsi menyebut "aku" sebagai perempuan, abaikan bagian itu).
PENTING, supaya tiap orang SAMA di semua scene: engine merakit SEMUA orang selain tokoh utama dari Character Builder dan MENGUNCI rupanya (wajah, rambut, kulit, baju) dari `who`. Jadi setiap orang selain tokoh utama WAJIB diberi `who` (lihat baris "Pemeran" tiap scene: pakai kata itu PERSIS, mis. `who: "ayah"`, `who: "kakak"`) dan `build` ("male"/"female", sama di setiap scene), dan JANGAN beri opsi rupa: hair, hairColor, skin, body, glasses, shirt, pants, jacket, shoes. Perempuan tampil dengan rambut biasa; beri `hijab: true` (atau `khimar: true` / `niqab: true`) HANYA untuk perempuan yang konteksnya religius (pengajian, masjid, ibadah, ustadzah, santri, keluarga muslimah yang memang digambarkan berhijab), selalu sama untuk orang yang sama di setiap scene. Tulis cukup `s.person(x, y, { who: "ayah", build: "male", size, pose, facing })`. Opsi rupa yang kamu tulis untuk orang ber-`who` diabaikan engine, dan orang TANPA `who` bisa berganti rupa antar scene. Hanya orang asing yang muncul sekali (penjual, kurir, orang lewat) boleh tanpa `who`; beri `role` kalau profesinya jelas.
Tokoh utama dibuat di Character Builder, jadi engine juga merakit SEMUA figuran (dan `s.crowd`) dengan gaya karakter yang sama: rambut, warna kulit, dan bajunya dipilihkan otomatis dari opsi yang kamu beri. Untuk figuran yang punya profesi/peran jelas, cukup beri `role` dan engine memakaikan seragamnya lengkap: dokter, perawat, polisi, tni, pemadam, chef, asn, satpam, proyek, mekanik, petani, kurir, barista, hakim, wisuda, pilot, pramugari, bola, olahraga, siswa, kantor, bos, guru, ustadz, santri, pedagang, pelayan, tukang, nelayan (mis. `s.person(520, 900, { role: "dokter", build: "female" })`). Orang asing tanpa `who` boleh diberi opsi biasa (shirt, pants, hijab, dress, tie, koko, peci, cap, glasses, age).
Pakaian religius (peci, baju koko, hijab, khimar, cadar) HANYA untuk orang yang konteksnya religius atau memang digambarkan begitu, dan TIDAK PERNAH untuk orang yang berperan negatif: yang bersalah, penipu, pencuri, pemalas, yang dimarahi atau diejek, pelaku kesalahan.
Pakaian mengikuti peran & konteks, bukan kebiasaan. Contoh: orang yang berutang = kaos kusut & celana pendek; penagih = kemeja rapi atau jaket; pekerja kantoran = kemeja + dasi; anak muda = hoodie/kaos.
Pilih pose yang paling pas dengan emosi kalimatnya dan variasikan antar scene (jangan berdiri/melambai terus).

## Gaya = CARA menggambar, bukan ISI gambar
- Dari arahan gaya dan contoh kodenya ambil TEKNIKNYA saja: garis, isian, tekstur, palet, cahaya, kedalaman, tipografi, cara gerak, dan larangannya. Jangan menyalin objek, komposisi, atau urutan gerak contohnya.
- ISI gambar (benda, tempat, tokoh, metafora) SELALU dari narasi scene ini; benda/pemandangan yang disebut di arahan gaya hanya contoh rasa, digambar hanya kalau narasinya butuh. Tes: kalau gambarnya cocok ditempel ke video bertopik lain, isinya belum dari narasi.
- Pengecualian: tokoh/maskot tetap yang jadi identitas gaya (disebut di arahan, atau fungsi gambar tokoh di contoh kode) adalah bagian GAYA: kalau scene butuh tokoh, salin fungsi gambarnya persis, lalu atur pose, posisi, ukuran, dan geraknya.

Ikuti arahan ini untuk warna, bentuk, tekstur, suasana, dan cara gerak; kalau bertentangan dengan arahan gaya di atas, arahan kreator yang menang. Kontrak dan batas kanvas tetap wajib dipatuhi. Latar tetap digambar engine, jadi pilih warna objek yang kontras dengan tema latar scene. Boleh memakai warna hex sendiri dan `ctx` mentah (gradient, `shadowBlur` untuk glow, pola, `globalCompositeOperation`) kalau arahan ini membutuhkannya; selalu bungkus dengan `ctx.save()`/`ctx.restore()`.

## Contoh TEKNIK gaya Cerita Sinematik (SET LENGKAP ruang depan rumah pagi hari: dinding, lantai, pintu terbuka dengan cahaya, jam dinding, rak sepatu; tokoh berjalan keluar; tiru cara menggambarnya, BUKAN isi adegannya)
```js
const OL = "#3a2a20";
const W = (w = 1.6) => ({ stroke: OL, width: w, wobble: 0, hatch: false });
const N = { stroke: "none", wobble: 0, hatch: false };
const WALL = "#d8c7ad", WALL2 = "#c4b092", FLOOR = "#b4a184", WOOD = "#7a5638", WOOD2 = "#5e4029", WARM = "#f7dca2";
// light falling in from a window or a door: a pale shape, see-through
const beam = (pts, a = 0.2) => s.shape(pts, { fill: "#fff1cf", alpha: a, ...N });
// the edges sink into shade, like a film frame
const vignette = (k = 0.42) => {
  const g = ctx.createRadialGradient(360, 560, 240, 360, 600, 900);
  g.addColorStop(0, "rgba(24,16,10,0)");
  g.addColorStop(1, "rgba(24,16,10," + k + ")");
  ctx.save(); ctx.fillStyle = g; ctx.fillRect(-300, -300, 1320, 1900); ctx.restore();
};
// back wall and floor (the set fills the whole frame, under the subtitle too)
s.rect(0, 0, 720, 780, { fill: WALL, ...N });
s.rect(0, 762, 720, 18, { fill: WALL2, ...N });
s.rect(0, 780, 720, 520, { fill: FLOOR, ...N });
s.line(0, 780, 720, 780, W(2));
// the doorway full of morning light, the door swung open into the room
s.rect(410, 250, 200, 530, { fill: WARM, ...W(2) });
s.shape([[410, 250], [352, 282], [352, 772], [410, 780]], { fill: WOOD, ...W(2) });
s.circle(364, 520, 5, { fill: "#d8b25a", ...N });
beam([[410, 780], [610, 780], [720, 1280], [260, 1280]], 0.28);
beam([[610, 250], [720, 200], [720, 780], [610, 780]], 0.12);
// the wall clock, its long hand moving
s.circle(140, 210, 44, { fill: "#f4efe6", ...W(2) });
for (let h = 0; h < 12; h++) { const a = (h / 12) * Math.PI * 2; s.circle(140 + Math.cos(a) * 34, 210 + Math.sin(a) * 34, 2.5, { fill: OL, ...N }); }
const m = -1.2 + s.t * 0.25;
s.line(140, 210, 140 + Math.cos(m) * 30, 210 + Math.sin(m) * 30, W(3));
s.line(140, 210, 140 + Math.cos(-2.1) * 20, 210 + Math.sin(-2.1) * 20, W(4));
// the shoe rack by the wall
s.rect(40, 640, 210, 124, { fill: WOOD, ...W(2) });
s.line(40, 700, 250, 700, W(2));
[[80, 690], [170, 690]].forEach(([x, y]) => s.ellipse(x, y - 8, 30, 10, { fill: "#2e2622", ...W() }));
s.ellipse(110, 750, 30, 10, { fill: "#2e2622", ...W() });
// he crosses to the door and goes out into the light
const k = s.ease.inOut(s.clamp((s.t - 1.1) / 1.5, 0, 1));
s.person(s.lerp(250, 500, k), 800, { size: 470, pose: [["stand", 0], ["walk", 1.1]], stride: true, facing: 1, alpha: 1 - s.clamp((s.t - 2.5) / 0.4, 0, 1) });
vignette();
s.sfx("step", 1.3, 0.4);
s.sfx("step", 1.8, 0.4);
```

## Contoh TEKNIK gaya Cerita Sinematik (gang perspektif satu titik: tokoh kecil berjalan menjauh, adik mengintip dari balik tiang di depan kamera (bingkai depan); tiru cara menggambarnya, BUKAN isi adegannya)
```js
const OL = "#3a2a20";
const W = (w = 1.6) => ({ stroke: OL, width: w, wobble: 0, hatch: false });
const N = { stroke: "none", wobble: 0, hatch: false };
const WALL = "#d8c7ad", WALL2 = "#c4b092", FLOOR = "#b4a184", WOOD = "#7a5638", WOOD2 = "#5e4029", WARM = "#f7dca2";
// light falling in from a window or a door: a pale shape, see-through
const beam = (pts, a = 0.2) => s.shape(pts, { fill: "#fff1cf", alpha: a, ...N });
// the edges sink into shade, like a film frame
const vignette = (k = 0.42) => {
  const g = ctx.createRadialGradient(360, 560, 240, 360, 600, 900);
  g.addColorStop(0, "rgba(24,16,10,0)");
  g.addColorStop(1, "rgba(24,16,10," + k + ")");
  ctx.save(); ctx.fillStyle = g; ctx.fillRect(-300, -300, 1320, 1900); ctx.restore();
};
s.rect(0, 0, 720, 1280, { fill: "#eadcc2", ...N });
// two walls and the ground running to the far end of the alley
s.shape([[0, 0], [300, 340], [300, 700], [0, 1280]], { fill: "#cbb593", ...W(2) });
s.shape([[720, 0], [420, 340], [420, 700], [720, 1280]], { fill: "#bea786", ...W(2) });
s.shape([[0, 1280], [300, 700], [420, 700], [720, 1280]], { fill: "#ae9a7c", ...W(2) });
s.rect(300, 340, 120, 360, { fill: "#e0d0b2", ...W(1.4) });
// a dashed line down the middle, longer as it comes nearer
for (let i = 0; i < 6; i++) { const y = 720 + i * i * 16; s.line(360, y, 360, y + 8 + i * 6, { stroke: "#efe6d2", width: 2 + i, wobble: 0, hatch: false }); }
// a clothesline across, two cloths swaying
s.polyline([[300, 430], [330, 446], [390, 446], [420, 430]], W(1.2));
[[338, "#8a9a7a"], [378, "#b07a5a"]].forEach(([x, c], i) => s.group({ x, y: 446, rotate: s.wave(0.6, 0.06, i) }, () => s.rect(-9, 0, 18, 26, { fill: c, ...W(1.2) })));
beam([[300, 340], [420, 340], [560, 1280], [160, 1280]], 0.14);
// far away he keeps walking into the alley (seen from behind)
s.person(360, s.lerp(712, 700, s.p), { size: s.lerp(110, 92, s.p), pose: "walk", view: "back" });
// close by, at the edge of the frame, she watches from behind a pole
s.person(130, 1210, { size: 760, pose: [["stand", 0], ["look", 0.8]], facing: 1, build: "female", hijab: "#7d7aa8", shirt: "#8e96a3", dress: "#5b6077" });
s.rect(176, 0, 46, 1280, { fill: "#6f5d4a", ...W(2) });
vignette(0.5);
```

## Contoh pola gerak (ambil polanya, bukan warna atau bentuknya)
```js
// judul masuk per kata, tiga kartu menyusul, lalu kartu lain meredup saat fokus pindah ke yang terakhir
s.sfx("swipe", 0.1, 0.7);
[0, 1, 2].forEach((i) => s.sfx("pop", 0.55 + i * 0.12, 0.6, 1 + i * 0.1));
s.sfx("ding", 1.7);
s.words("Tiga langkah kecil", 360, 210, { size: 46, start: 0.05, accent: "kecil", accentColor: s.c.orange });
const focus = s.keys([[1.6, 0], [1.95, 1]]);
["Bangun", "Bergerak", "Ulangi"].forEach((label, i) => {
  const k = s.stagger(i, 0.5, 0.12, "snappy");
  if (k <= 0) return;
  const last = i === 2;
  s.group({
    x: 360 + s.lerp(140, 0, k),
    y: 370 + i * 135 + s.wave(0.5, 4, i),
    scale: s.lerp(0.88, 1, k) * (last ? 1 + 0.08 * focus : 1 - 0.05 * focus),
    alpha: s.clamp(k * 2, 0, 1) * (last ? 1 : 1 - 0.55 * focus),
  }, () => {
    s.card(-250, -52, 500, 104, { fill: last ? [s.c.orange, s.c.red] : s.c.white, r: 26 });
    s.text(label, 0, 0, { size: 30, color: last ? s.c.white : s.c.navy });
  });
});
```

## Kerahkan kemampuan terbaikmu
- Rancang tiap scene seperti art director yang ingin videonya diingat: metafora visual orisinal untuk kalimatnya (hindari ide pertama yang paling umum: lampu untuk "ide", tangga untuk "sukses"), komposisi tak terduga (sudut, skala ekstrem, terpotong tepi, ruang kosong disengaja), dan detail kecil yang bikin menonton ulang.
- Gerakan berlapis: aksi utama, gerak sekunder (benda bereaksi, bayangan, partikel), dan puncak tepat di kata kunci. Satu dunia untuk semua scene, tapi tidak ada dua komposisi yang sama. Kode boleh panjang selama rapi dan semua posisi dihitung dari waktu.

## Tugas
Tulis kode animasi untuk 4 scene berikut. Setiap scene berdiri sendiri (kode tiap scene hanya bisa melihat `s` dan `ctx`). Variasikan gerakan dan komposisi antar scene.

### SCENE 1
- Teks narasi: "Berhenti bakar rokok pas kepala lagi pusing, mending matikan dulu kompor masalahmu."
- Visual: [Dapur rumah, pagi] Wide shot set dapur utuh memenuhi seluruh frame vertikal dengan palet pagi teduh (#c9d3c0, kayu #8a6a4a, dasar #b9b39a, sejuk #4f7a7a, aksen #e2b84b, garis tipis #2f3a33): dinding krem kehijauan, lantai keramik kotak, jendela kayu dua daun dengan berkas cahaya pagi putih kehijauan tembus pandang, rak piring gantung, dan meja dapur. Di atas kompor gas dua tungku kotak abu-abu dengan kenop putar bulat, sebuah wajan cekung hitam bergagang kayu mengeluarkan kepulan asap tebal yang bergerak naik, sementara tokoh utama tanpa wajah berdiri mematung memegang bungkus rokok kotak merah-putih.
- Tema latar: paper
- Durasi: 6.88 detik (gerakan harus mengisi seluruh durasi ini)
- Waktu kata diucapkan (detik dari awal scene): Berhenti 0.2 · bakar 1.0 · rokok 1.4 · pas 1.8 · kepala 2.0 · lagi 2.4 · pusing, 2.6 · mending 4.0 · matikan 4.2 · dulu 4.6 · kompor 5.0 · masalahmu. 5.5

### SCENE 2
- Teks narasi: "Jujur deh, tiap kerjaan lagi numpuk atau tagihan datang, tanganmu otomatis nyari korek kan?"
- Visual: [Kamar kerja sempit, malam] Medium shot set kamar utuh dengan palet hujan biru (#b9c3cc, kayu #6b5a4e, dasar #9aa3a8, sejuk #3d4f63, aksen #f2c14e, garis tipis #263240): dinding biru kelabu redup, jendela berembun di latar belakang, rak buku kayu, dan meja kerja dengan lampu belajar bohlam kuning hangat yang menyorot miring. Di atas meja, laptop lipat abu-abu menyala dikelilingi tumpukan kertas tagihan bergaris yang jatuh menumpuk, sementara tangan tokoh utama tanpa wajah bergerak cepat meraba meja mencari korek api gas lonjong warna kuning di dekat bungkus rokok.
- Tema latar: night
- Durasi: 7.23 detik (gerakan harus mengisi seluruh durasi ini)
- Waktu kata diucapkan (detik dari awal scene): Jujur 0.3 · deh, 1.0 · tiap 1.8 · kerjaan 2.0 · lagi 2.4 · numpuk 2.5 · atau 3.0 · tagihan 3.3 · datang, 3.6 · tanganmu 4.3 · otomatis 4.9 · nyari 5.4 · korek 5.6 · kan? 6.0

### SCENE 3
- Teks narasi: "Kamu ngira hisapan itu bikin tenang, padahal lima menit kemudian pusingnya balik lagi."
- Visual: [Teras depan rumah, malam] Medium shot set teras rumah utuh dengan palet hujan biru (#b9c3cc, kayu #6b5a4e, dasar #9aa3a8, sejuk #3d4f63, aksen #f2c14e, garis tipis #263240): pagar besi pendek, pot tanaman daun hijau gelap, lantai teras berubin, pintu kayu tertutup, dan lampu dinding kuning redup dengan vinyet gelap di tepi frame. Tokoh utama tanpa wajah duduk membungkuk lesu di kursi kayu sambil memegang kepala dengan satu tangan, sementara kepulan asap kelabu di depannya perlahan berubah bentuk menjadi tumpukan kertas tagihan dan jam dinding bulat yang jarumnya berputar cepat.
- Tema latar: night
- Durasi: 6.58 detik (gerakan harus mengisi seluruh durasi ini)
- Waktu kata diucapkan (detik dari awal scene): Kamu 0.3 · ngira 1.0 · hisapan 1.1 · itu 1.5 · bikin 1.7 · tenang, 1.9 · padahal 2.5 · lima 3.2 · menit 3.5 · kemudian 3.7 · pusingnya 4.4 · balik 4.9 · lagi. 5.1

### SCENE 4
- Teks narasi: "Coba bayangin kalau wajan di dapurmu lagi gosong dan asapnya ngebul memenuhi ruangan."
- Visual: [Dapur rumah, pagi] Wide shot set dapur utuh yang sama persis dengan palet pagi teduh (#c9d3c0, kayu #8a6a4a, dasar #b9b39a, sejuk #4f7a7a, aksen #e2b84b, garis tipis #2f3a33): dinding krem kehijauan, lantai keramik kotak, jendela kayu dua daun dengan berkas cahaya pagi, rak piring gantung, dan meja dapur. Di atas kompor gas dua tungku kotak abu-abu, api menyala berkobar di bawah wajan cekung hitam bergagang kayu hingga masakan di dalamnya menghitam dan mengeluarkan gumpalan asap kelabu besar yang bergerak bergulung memenuhi langit-langit dapur.
- Tema latar: dusk
- Durasi: 5.84 detik (gerakan harus mengisi seluruh durasi ini)
- Waktu kata diucapkan (detik dari awal scene): Coba 0.3 · bayangin 0.7 · kalau 1.1 · wajan 1.5 · di 1.9 · dapurmu 2.0 · lagi 2.4 · gosong 2.6 · dan 3.1 · asapnya 3.4 · ngebul 3.9 · memenuhi 4.3 · ruangan. 4.7

## Format jawaban (penting)
Tulis SEMUA scene di dalam SATU blok kode ```js saja, supaya bisa disalin sekali klik. Pisahkan tiap scene dengan baris penanda persis seperti ini:

```js
// ===== SCENE 1 =====
// ...kode scene ini...

// ===== SCENE 2 =====
// ...kode scene ini...

// ===== SCENE 3 =====
// ...kode scene ini...

// ===== SCENE 4 =====
// ...kode scene ini...
```

Jangan memecah jawaban menjadi beberapa blok kode. Pakai nomor scene persis seperti di atas. Jangan gunakan artifact/canvas dan jangan menambahkan penjelasan di luar format yang diminta.

=== AKHIR PERINTAH ===
Kamu ahli SEO media sosial (YouTube, TikTok, Reels) untuk video pendek. Tulis metadata upload video-video berikut supaya cepat ditemukan lewat pencarian.

## Aturan
Metadata upload (YouTube, TikTok, Reels) supaya mudah ditemukan lewat pencarian, dalam bahasa video ini. Tentukan dulu 1 KATA KUNCI UTAMA (frasa 2-4 kata yang benar-benar diketik orang, mis. "cara berhenti overthinking", bukan istilah puitis) dan 2-3 kata kunci turunan.
- "title": maks 70 karakter, kata kunci utama di awal + alasan jujur untuk mengklik (manfaat, angka, penasaran). Tanpa kapital semua, tanpa hashtag, maks 1 emoji.
- "description": RAPI, bukan satu paragraf; bagian dipisah baris kosong ("\n\n" di string JSON), poin dengan "\n": 1) pembuka 1-2 kalimat dengan kata kunci utama di kalimat pertama + apa yang didapat penonton; 2) judul bagian (mis. "Di video ini:") lalu 3-4 poin berawalan emoji yang cocok (✅ 💡 🎬), maks ~12 kata, memuat kata kunci turunan secara alami; 3) penutup + ajakan spesifik (promosi: kontak/link persis dari kreator). Maks ~700 karakter, jangan menyalin narasi, jangan menumpuk kata kunci, tanpa hashtag.
- "short": caption TikTok/Reels 1-2 kalimat (maks ~150 karakter), bikin penasaran, boleh 1 emoji, tanpa hashtag, beda dari judul.
- "tags": 10-15 kata kunci (utama, variasi/sinonim, long-tail, 2-3 topik umum), huruf kecil tanpa "#", total < 400 karakter.
- "hashtags": 4-6 yang BENAR-BENAR dipakai orang untuk topik ini, spesifik ke umum: 2-3 dari isi video (mis. "#berhentimenunda"), 1-2 niche/komunitas (mis. "#kontenkreator"), maks 1 umum yang nyambung. Huruf kecil tanpa spasi. DILARANG yang generik tak berhubungan (#viral, #fyp, #foryou, #trending, #explore), yang hampir sama, dan "#shorts"/"#satsetmotion" (ditambahkan otomatis).
- Bahasa metadata mengikuti bahasa naskahnya.

## Video
### 1. id: obs74u1o
Judul sekarang: Matikan Kompornya, Bukan Tambah Asapnya
Naskah:
Berhenti bakar rokok pas kepala lagi pusing, mending matikan dulu kompor masalahmu.
Jujur deh, tiap kerjaan lagi numpuk atau tagihan datang, tanganmu otomatis nyari korek kan?
Kamu ngira hisapan itu bikin tenang, padahal lima menit kemudian pusingnya balik lagi.
Coba bayangin kalau wajan di dapurmu lagi gosong dan asapnya ngebul memenuhi ruangan.
Masa iya kamu malah bakar kertas di pojokan cuma biar bau gosongnya ketutup?
Aneh banget kan, tapi justru itu yang kamu lakuin tiap ngerokok pas lagi stres.
Kompor masalahnya masih nyala gede, jadi taruh rokokmu dan beresin satu urusan paling mendesak.
Buka jendelanya, matikan apinya sekarang, dan mulai hari ini tanpa nambah asap baru lagi.

## Format jawaban
Jawab HANYA dengan satu blok kode ```json, satu entri untuk setiap video di atas dengan id yang sama persis:
{
  "videos": [
    { "id": "...", "seo": { "title": "...", "description": "...", "short": "...", "tags": ["..."], "hashtags": ["#..."] } }
  ]
}
Jangan gunakan artifact/canvas dan jangan menambahkan penjelasan di luar format yang diminta.
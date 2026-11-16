import React, { useState, useEffect } from 'react';
import { Copy, Check, Wand2, X, AlertCircle, FileCode, ArrowRight, ExternalLink, Bot } from 'lucide-react';
import { SatsetProject } from '../types/satset';
import {
  buildPromptBlueprint,
  buildNarasiPrompt,
  parseAndValidateAIBlueprint,
  SAMPLE_AI_NARASI_JSON,
} from '../utils/remotion-generator';

interface PromptBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Partial<SatsetProject>;
  onApplyProject: (updated: Partial<SatsetProject>) => void;
  mode?: 'idea' | 'narasi';
  creatorNote?: string;
  pasteOnly?: boolean;
}

const SAMPLE_AI_IDEAS_JSON = `{
  "ideas": [
    {
      "title": "Kenapa Pagi Terasa Berat?",
      "hook": "KATANYA ORANG SUKSES / BANGUN PAGI / PADAHAL ADA YANG SALAH",
      "angle": "Banyak orang mengira rasa malas pagi hilang kalau kita menunggu semangat datang. Itu keliru. Semangat bukan syarat untuk mulai bergerak. Bayangkan tubuhmu seperti benda yang ditarik dua magnet. Satu magnet menarikmu ke kasur, satu lagi menarikmu ke pekerjaan. Semakin lama kamu diam, semakin kuat tarikan kasur terasa. Cara memutuskannya sederhana: duduk, berdiri, lalu lakukan satu pekerjaan selama dua menit. Jangan tunggu ingin bergerak. Bergerak dulu, baru semangat menyusul. Kamu tidak harus menang melawan rasa malas sepanjang hari. Kamu hanya perlu menang di 10 menit pertama.",
      "visualStyle": "scribble 3D low-poly + kontras hangat + orange kuning + kamera depan + metafora magnet kasur"
    },
    {
      "title": "Jangan Paksa Pintu Terbuka",
      "hook": "TUNGGU DULU / JANGAN PAKSA / ADA ALASANNYA",
      "angle": "Pernah merasa sudah berusaha, tapi hasilnya belum juga datang? Bayangkan kamu sedang memegang kunci sebuah pintu. Kamu mencoba membukanya setiap hari, tetapi pintunya belum terbuka. Bukan berarti kuncinya salah. Bisa jadi kamu belum sampai pada waktu yang tepat. Namun, sabar bukan berarti duduk diam. Selama pintu belum terbuka, periksa kuncimu. Perbaiki cara kerjamu. Tambah pengetahuanmu. Coba lagi dengan cara yang lebih baik. Jangan habiskan tenaga untuk menendang pintu. Tetap kerjakan bagianmu. Hasil memang tidak selalu datang saat kamu mau. Tapi jangan sampai kamu berhenti tepat sebelum kesempatan datang.",
      "visualStyle": "scribble 3D + kunci pintu kuno + pencahayaan dramatis + palet cokelat & emas"
    },
    {
      "title": "Pikiranmu Bukan Ramalan",
      "hook": "BERHENTI MENEBAK / MULAI BERTINDAK / SEBELUM TIDUR MALAM INI",
      "angle": "Kamu belum tidur, tapi pikiranmu sudah sibuk memikirkan semua hal buruk yang mungkin terjadi besok. Berhenti menganggap semua pikiran itu sebagai kenyataan. Bayangkan kamu sedang memegang parasut. Parasut dibuat untuk memperlambat jatuh, bukan membuatmu terbang kembali ke atas. Begitu juga pikiranmu. Gunakan untuk menyiapkan diri, bukan untuk mengulang ketakutan yang sama. Kalau ada masalah besok, tulis satu hal yang bisa kamu lakukan. Kalau belum ada yang bisa dikerjakan malam ini, berhenti memikirkannya. Kamu tidak menyelesaikan masalah dengan kehilangan waktu tidur. Besok kamu butuh tenaga, bukan kepala yang penuh dugaan.",
      "visualStyle": "scribble 3D + parasut malam + lampu kamar temaram + biru navy & oranye"
    },
    {
      "title": "Kegagalan Bukan Jalan Buntu",
      "hook": "DIA DIPECAT / LALU NAIK / TAPI BUKAN KARENA BERUNTUNG",
      "angle": "Kamu gagal dalam pekerjaan. Usahamu berhenti. Bahkan orang lain mulai meragukanmu. Tapi ada satu hal yang sering dilupakan. Sebuah gedung punya tangga darurat bukan karena gedung itu pasti terbakar, tetapi karena selalu ada jalan lain saat jalan utama tidak bisa dipakai. Kegagalan juga begitu. Saat satu jalan tertutup, jangan terus memukul pintu yang sama. Cari jalan lain. Mungkin kamu harus belajar keterampilan baru. Mungkin kamu harus mencoba pekerjaan berbeda. Mungkin kamu perlu mengulang dari awal. Jangan habiskan hidup untuk membuktikan bahwa jalan yang gagal sebenarnya bisa berhasil. Karena kadang, yang perlu kamu lakukan bukan kembali ke jalan lama. Tapi berani keluar lewat tangga darurat.",
      "visualStyle": "scribble 3D + gedung bertingkat + tangga darurat neon + abu-abu & emerald"
    },
    {
      "title": "HP-mu Mencuri Waktumu",
      "hook": "MASIH SCROLL / BERAPA JAM / YANG KAMU BUANG HARI INI?",
      "angle": "Coba jujur. Kamu membuka HP untuk lima menit, tapi tiba-tiba satu jam sudah hilang. Masalahnya bukan cuma waktu. Setiap kali kamu terus melihat layar, kamu memberi HP kesempatan mengambil perhatianmu lagi. Bayangkan HP seperti es batu di atas papan miniatur. Semakin lama terkena suhu panas, semakin banyak es mencair. Waktu juga begitu. Tidak bisa dikembalikan setelah habis. Coba hitung berapa jam sehari kamu habiskan untuk scroll. Kalau tiga jam sehari, berarti 21 jam seminggu. Hampir satu hari penuh. Mulai sekarang, pasang batas waktu. Letakkan HP saat bekerja. Gunakan waktu itu untuk belajar, olahraga, atau menyelesaikan pekerjaanmu. Jangan biarkan layar kecil menghabiskan waktu hidupmu yang besar.",
      "visualStyle": "scribble 3D + es batu mencair di atas meja + cyan dingin & amber panas"
    }
  ]
}`;

export const PromptBlueprintModal: React.FC<PromptBlueprintModalProps> = ({
  isOpen,
  onClose,
  project,
  onApplyProject,
  mode = 'idea',
  creatorNote = 'jangan lupa follow',
  pasteOnly = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setPastedJson('');
    setErrorMsg(null);
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const isNarasiMode = mode === 'narasi';
  const promptText = isNarasiMode ? buildNarasiPrompt(project, creatorNote) : buildPromptBlueprint(project);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePasteFromClipboard = async () => {
    setErrorMsg(null);
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setPastedJson(text);
      } else {
        setErrorMsg('Clipboard kosong. Salin jawaban JSON dari AI terlebih dahulu, lalu tempel di sini.');
      }
    } catch {
      setErrorMsg('Browser membatasi akses clipboard otomatis. Tekan Ctrl+V / tempel langsung ke kotak di bawah.');
    }
  };

  const handleValidateAndApply = () => {
    setErrorMsg(null);
    if (!pastedJson.trim()) {
      setErrorMsg('Harap tempel teks JSON hasil jawaban AI terlebih dahulu.');
      return;
    }

    const res = parseAndValidateAIBlueprint(pastedJson);
    if (!res.success || !res.project) {
      setErrorMsg(res.error || 'Format JSON tidak valid.');
      return;
    }

    onApplyProject(res.project);
    onClose();
  };

  const handleFillSample = () => {
    setPastedJson(isNarasiMode ? SAMPLE_AI_NARASI_JSON : SAMPLE_AI_IDEAS_JSON);
    setErrorMsg(null);
  };

  return (
    <div
      data-testid="prompt-blueprint-modal"
      data-paste-only={pasteOnly ? 'true' : 'false'}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-black text-xs shadow-xs">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900">
                {pasteOnly
                  ? isNarasiMode
                    ? 'Tempel Hasil JSON Narasi dari AI'
                    : 'Tempel Hasil JSON Ide dari AI'
                  : isNarasiMode
                  ? 'Prompt Narasi AI & Tempel Hasil'
                  : 'Prompt AI & Tempel Hasil (Semi-Otomatis)'}
              </h3>
              <p className="text-[11px] text-zinc-500">
                {pasteOnly
                  ? isNarasiMode
                    ? 'Tempel 8 adegan naskah JSON yang sudah dihasilkan AI di sini.'
                    : 'Tempel jawaban JSON konsep ide dari AI di bawah ini untuk langsung diterapkan.'
                  : isNarasiMode
                  ? 'Kirim ke AI pilihanmu, lalu tempel 8 adegan naskah di sini.'
                  : 'Kirim ke AI pilihanmu, lalu tempel hasilnya di sini.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal tempel"
            className="p-1.5 rounded-xl hover:bg-zinc-200 text-zinc-400 hover:text-zinc-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {!pasteOnly && (
            <>
              {/* Target AI Selector & Quick Links */}
              <div
                data-testid="duplicate-ai-links"
                className="p-3 bg-blue-50/70 border border-blue-200/90 rounded-2xl space-y-2"
              >
                <span className="text-[11px] font-bold text-blue-900 block">Pilih platform AI yang ingin kamu gunakan:</span>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'claude', name: 'Buka Claude AI', url: `https://claude.ai/new?q=${encodeURIComponent(promptText)}` },
                    { id: 'chatgpt', name: 'ChatGPT', url: `https://chatgpt.com/?q=${encodeURIComponent(promptText)}` },
                    { id: 'gemini', name: 'Gemini Web', url: `https://gemini.google.com/app?text=${encodeURIComponent(promptText)}` },
                  ].map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={handleCopyPrompt}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition border ${
                        item.id === 'claude'
                          ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white border-[#2563EB] shadow-sm'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:border-blue-400'
                      }`}
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>{item.name}</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>
                  ))}
                </div>
                <p className="text-[10px] text-blue-900 font-medium">
                  <em>Klik nama AI di atas otomatis menyalin prompt &amp; membuka tab AI baru dengan prompt sudah terisi.</em>
                </p>
              </div>

              {/* Step 1: Copy Prompt Box */}
              <div data-testid="blueprint-prompt-step" className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-zinc-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">1</span>
                    <span>Salin Prompt Instruksi JSON untuk AI</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs transition shadow-xs active:scale-95 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin ke Clipboard!' : isNarasiMode ? 'Salin Prompt Narasi' : 'Salin Prompt Ide'}</span>
                  </button>
                </div>

                <div className="p-3 bg-zinc-950 rounded-2xl text-zinc-300 font-mono text-[11px] max-h-36 overflow-y-auto leading-relaxed border border-zinc-800 select-all shadow-inner">
                  <pre className="whitespace-pre-wrap">{promptText}</pre>
                </div>
              </div>
            </>
          )}

          {/* Paste Response Section */}
          <div className={`space-y-2.5 ${pasteOnly ? '' : 'pt-1 border-t border-zinc-100'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-extrabold text-zinc-800 flex items-center gap-1.5">
                {!pasteOnly && (
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">2</span>
                )}
                <span>{pasteOnly ? 'Tempel Kode / Jawaban JSON dari AI' : 'Sudah dapat jawaban dari AI? Tempel di sini'}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="text-[11px] text-zinc-700 font-bold hover:bg-zinc-100 bg-zinc-50 px-2.5 py-1 rounded-lg border border-zinc-200 transition cursor-pointer"
                >
                  Tempel dari Clipboard
                </button>
                <button
                  type="button"
                  onClick={handleFillSample}
                  className="text-[11px] text-blue-600 font-bold hover:underline bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 cursor-pointer"
                >
                  {isNarasiMode ? '+ Contoh Jawaban AI (8 Scene)' : '+ Contoh Jawaban AI (5 Ide)'}
                </button>
              </div>
            </div>

            <textarea
              data-testid="blueprint-paste-textarea"
              rows={pasteOnly ? 10 : 7}
              value={pastedJson}
              onChange={(e) => {
                setPastedJson(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder={
                isNarasiMode
                  ? `Tempel jawaban JSON dari AI di sini...\n{\n  "title": "Kenapa Pagi Terasa Berat?",\n  "scenes": [\n    {\n      "text": "Katanya orang sukses itu selalu bangun pagi penuh semangat...",\n      "visual": "Papan miniatur 3D diorama data, jam weker besar...",\n      "theme": "paper",\n      "duration": 7.5,\n      "emphasis": "semangat",\n      "camera": "push"\n    }\n  ]\n}`
                  : `Tempel jawaban JSON dari AI di sini...\n{\n  "ideas": [\n    {\n      "title": "Kenapa Pagi Terasa Berat?",\n      "hook": "KATANYA ORANG SUKSES / BANGUN PAGI / PADAHAL ADA YANG SALAH",\n      "angle": "Banyak orang mengira rasa malas pagi hilang...",\n      "visualStyle": "scribble 3D low-poly..."\n    }\n  ]\n}`
              }
              className="w-full bg-zinc-50 border border-zinc-300 rounded-2xl p-3.5 font-mono text-xs text-zinc-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span className="font-medium text-xs">{errorMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-zinc-600 text-xs font-bold hover:bg-zinc-200 transition cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            data-testid="blueprint-apply-btn"
            onClick={handleValidateAndApply}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/25 transition active:scale-95 cursor-pointer"
          >
            <Wand2 className="w-4 h-4" />
            <span>Terapkan Hasil AI ke Proyek</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};


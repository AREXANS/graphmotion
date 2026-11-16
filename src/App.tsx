import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Code2,
  UploadCloud,
  Layers,
  Sliders,
  LayoutGrid,
  Home,
  Sun,
  Moon,
  ChevronRight,
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { SatsetProject, SatsetStyleModule } from './types/satset';
import { SatsetStudio, StudioNavStep } from './components/SatsetStudio';
import { AutoRemotionUploader } from './components/AutoRemotionUploader';
import { RemotionCodeViewer } from './components/RemotionCodeViewer';
import { SatsetGallery } from './components/SatsetGallery';
import { LandingPage3D, CreatorSessionUser } from './components/LandingPage3D';
import { GraphMotionBrandLockup } from './components/GraphMotionBrandLogo';
import { generateRemotionCode } from './utils/remotion-generator';
import { synchronizeProjectPipeline } from './utils/pipeline-sync';
import {
  extractWebsiteUrl,
  buildWebsitePromoProfile,
  buildWebsitePromoConcepts,
  buildWebsitePromoScenes,
} from './utils/website-promo-engine';

type AppTab = 'studio' | 'uploader' | 'gallery' | 'remotion';

const DEFAULT_PROJECTS: SatsetProject[] = [
  {
    id: 'proj-default-1',
    project_title: '',
    title: '',
    status: 'draft',
    start_mode: 'topic',
    language: 'id',
    content_type: 'motivasi',
    topik_video: '',
    topic: '',
    target_duration_sec: 60,
    durationSeconds: 60,
    fps: 30,
    gaya_video: 'otomatis',
    styleModule: 'otomatis',
    character: 'kreator_3d_studio',
    character_gender: 'pria',
    character_with_objects: true,
    character_full_backstory: false,
    warna_brand: '#2563EB',
    brandColor: '#2563EB',
    brand_secondary_color: '#1e3a8a',
    brand_accent_color: '#38bdf8',
    brand_mode: 'auto',
    transition: 'otomatis',
    tempo: 'energik',
    target_audience: 'pelajar',
    idea_count: 5,
    aspect_ratio: '9:16',
    bgm_style: 'upbeat_synth',
    bgm_volume: 0.6,
    auto_ducking: true,
    voice_character: 'Charon',
    voice_option: 'charon',
    voiceOption: 'charon',
    tts_model: 'Flash TTS',
    speech_style:
      'Bacakan dalam bahasa Indonesia dengan suara pria yang berat dan dalam, tapi penuh energi seperti coach motivasi yang membakar semangat. Tempo cepat dan tegas, tekan kata-kata kunci, nada naik di akhir ajakan. Beri jeda hening sekitar setengah detik di setiap pergantian baris; di koma cukup jeda sangat singkat, jangan berhenti lama di tengah kalimat.',
    subtitle_style: 'auto',
    subtitleStyle: 'auto',
    subtitle_position: 'auto',
    duration_mode: 'auto',
    watermark: 'Graph Motion',
    creator_note: 'jangan lupa follow',
    creatorNote: 'jangan lupa follow',
    scenes_animated_count: 0,
    scene_codes: {},
    idea_concepts: [
      {
        id: 'c-1',
        title: 'Kenapa Pagi Terasa Berat?',
        hook: 'KATANYA ORANG SUKSES / BANGUN PAGI / PADAHAL ADA YANG SALAH',
        hookProposal: 'KATANYA ORANG SUKSES / BANGUN PAGI / PADAHAL ADA YANG SALAH',
        angle: 'Banyak orang mengira rasa malas pagi hilang kalau kita menunggu semangat datang. Itu keliru. Semangat bukan syarat untuk mulai bergerak. Bayangkan tubuhmu seperti benda yang ditarik dua magnet. Satu magnet menarikmu ke kasur, satu lagi menarikmu ke pekerjaan. Semakin lama kamu diam, semakin kuat tarikan kasur terasa. Cara memutuskannya sederhana: duduk, berdiri, lalu lakukan satu pekerjaan selama dua menit. Jangan tunggu ingin bergerak. Bergerak dulu, baru semangat menyusul. Kamu tidak harus menang melawan rasa malas sepanjang hari. Kamu hanya perlu menang di 10 menit pertama.',
        visualStyle: '3D Studio Room & Pedestal (gaya Kreatorlab / AiShift): ruang studio 3D berlantai kayu herringbone, sofa studio abu-abu, lampu gantung pink, teks 3D timbul di dinding, karakter kreator 3D di sisi kiri, 3 pedestal silinder putih dengan cincin oranye yang naik bertahap sesuai narasi, kartu showcase melayang, dan maskot 3D merah bersayap.',
        corePoints: [
          'Semangat bukan syarat untuk mulai bergerak',
          'Tarik-menarik antara kasur dan pekerjaan',
          'Lakukan satu pekerjaan selama 2 menit pertama',
        ],
        targetAudience: 'Anak muda & pekerja yang susah bangun pagi',
      },
      {
        id: 'c-2',
        title: 'Jangan Paksa Pintu Terbuka',
        hook: 'TUNGGU DULU / JANGAN PAKSA / ADA ALASANNYA',
        hookProposal: 'TUNGGU DULU / JANGAN PAKSA / ADA ALASANNYA',
        angle: 'Pernah merasa sudah berusaha, tapi hasilnya belum juga datang? Bayangkan kamu sedang memegang kunci sebuah pintu. Kamu mencoba membukanya setiap hari, tetapi pintunya belum terbuka. Bukan berarti kuncinya salah. Bisa jadi kamu belum sampai pada waktu yang tepat. Namun, sabar bukan berarti duduk diam. Selama pintu belum terbuka, periksa kuncimu. Perbaiki cara kerjamu. Tambah pengetahuanmu. Coba lagi dengan cara yang lebih baik. Jangan habiskan tenaga untuk menendang pintu. Tetap kerjakan bagianmu. Hasil memang tidak selalu datang saat kamu mau. Tapi jangan sampai kamu berhenti tepat sebelum kesempatan datang.',
        visualStyle: 'scribble 3D, cahaya remang pintu misterius, palet biru navy dan emas, kamera isometrik 45 derajat, pintu kayu terkunci dan anak kunci bercahaya',
        corePoints: [
          'Bukan kuncinya salah, mungkin belum waktunya',
          'Sabar bukan berarti berdiam diri',
          'Perbaiki cara kerja dan tambah keterampilan',
        ],
        targetAudience: 'Kreator dan pekerja yang sedang berjuang',
      },
      {
        id: 'c-3',
        title: 'Pikiranmu Bukan Ramalan',
        hook: 'BERHENTI MENEBAK / MULAI BERTINDAK / SEBELUM TIDUR MALAM INI',
        hookProposal: 'BERHENTI MENEBAK / MULAI BERTINDAK / SEBELUM TIDUR MALAM INI',
        angle: 'Kamu belum tidur, tapi pikiranmu sudah sibuk memikirkan semua hal buruk yang mungkin terjadi besok. Berhenti menganggap semua pikiran itu sebagai kenyataan. Bayangkan kamu sedang memegang parasut. Parasut dibuat untuk memperlambat jatuh, bukan membuatmu terbang kembali ke atas. Begitu juga pikiranmu. Gunakan untuk menyiapkan diri, bukan untuk mengulang ketakutan yang sama. Kalau ada masalah besok, tulis satu hal yang bisa kamu lakukan. Kalau belum ada yang bisa dikerjakan malam ini, berhenti memikirkannya. Kamu tidak menyelesaikan masalah dengan kehilangan waktu tidur. Besok kamu butuh tenaga, bukan kepala yang penuh dugaan.',
        visualStyle: 'scribble 3D, suasana malam temaram, palet ungu tua dan cyan elektrik, sudut pandang atas, parasut melayang di atas awan kekhawatiran',
        corePoints: [
          'Pikiran bukan ramalan masa depan',
          'Parasut untuk memperlambat jatuh, bukan terbang lagi',
          'Tulis 1 solusi besok dan tidur nyenyak',
        ],
        targetAudience: 'Kaum overthinker malam hari',
      },
      {
        id: 'c-4',
        title: 'Kegagalan Bukan Jalan Buntu',
        hook: 'DIA DIPECAT / LALU NAIK / TAPI BUKAN KARENA BERUNTUNG',
        hookProposal: 'DIA DIPECAT / LALU NAIK / TAPI BUKAN KARENA BERUNTUNG',
        angle: 'Kamu gagal dalam pekerjaan. Usahamu berhenti. Bahkan orang lain mulai meragukanmu. Tapi ada satu hal yang sering dilupakan. Sebuah gedung punya tangga darurat bukan karena gedung itu pasti terbakar, tetapi karena selalu ada jalan lain saat jalan utama tidak bisa dipakai. Kegagalan juga begitu. Saat satu jalan tertutup, jangan terus memukul pintu yang sama. Cari jalan lain. Mungkin kamu harus belajar keterampilan baru. Mungkin kamu harus mencoba pekerjaan berbeda. Mungkin kamu perlu mengulang dari awal. Jangan habiskan hidup untuk membuktikan bahwa jalan yang gagal sebenarnya bisa berhasil. Karena kadang, yang perlu kamu lakukan bukan kembali ke jalan lama. Tapi berani keluar lewat tangga darurat.',
        visualStyle: 'scribble 3D, lampu darurat neon merah dan hijau, palet charcoal dan neon green, low angle dramatis, tangga darurat di gedung bertingkat',
        corePoints: [
          'Tangga darurat selalu ada saat jalan utama tertutup',
          'Jangan habiskan waktu memukul pintu yang terkunci',
          'Berani mulai dari awal dengan keahlian baru',
        ],
        targetAudience: 'Orang yang baru mengalami kegagalan',
      },
      {
        id: 'c-5',
        title: 'HP-mu Mencuri Waktumu',
        hook: 'MASIH SCROLL / BERAPA JAM / YANG KAMU BUANG HARI INI?',
        hookProposal: 'MASIH SCROLL / BERAPA JAM / YANG KAMU BUANG HARI INI?',
        angle: 'Coba jujur. Kamu membuka HP untuk lima menit, tapi tiba-tiba satu jam sudah hilang. Masalahnya bukan cuma waktu. Setiap kali kamu terus melihat layar, kamu memberi HP kesempatan mengambil perhatianmu lagi. Bayangkan HP seperti es batu di atas papan miniatur. Semakin lama terkena suhu panas, semakin banyak es mencair. Waktu juga begitu. Tidak bisa dikembalikan setelah habis. Coba hitung berapa jam sehari kamu habiskan untuk scroll. Kalau tiga jam sehari, berarti 21 jam seminggu. Hampir satu hari penuh. Mulai sekarang, pasang batas waktu. Letakkan HP saat bekerja. Gunakan waktu itu untuk belajar, olahraga, atau menyelesaikan pekerjaanmu. Jangan biarkan layar kecil menghabiskan waktu hidupmu yang besar.',
        visualStyle: 'scribble 3D, cahaya biru layar gadget dan matahari panas terik, palet hitam kaca dan oranye api, kamera eye-level macro, balok es mencair di atas smartphone',
        corePoints: [
          'Waktu scroll adalah es batu yang mencair di panas terik',
          '3 jam sehari = hampir 1 hari hilang per minggu',
          'Pasang batas waktu layar sekarang juga',
        ],
        targetAudience: 'Siapa saja yang kecanduan doom scrolling',
      },
    ],
    selected_idea_id: 'c-1',
    scenes: [
      {
        id: 'sc-1',
        scene_number: 1,
        role: 'hook',
        target_duration_sec: 7.5,
        durationSeconds: 7.5,
        narration_text: 'Katanya orang sukses itu selalu bangun pagi penuh semangat. Padahal kenyataannya nggak selalu begitu.',
        voiceScript: 'Katanya orang sukses itu selalu bangun pagi penuh semangat. Padahal kenyataannya nggak selalu begitu.',
        on_screen_text: 'KATANYA ORANG SUKSES / BANGUN PAGI / PADAHAL ADA YANG SALAH',
        hookText: 'KATANYA ORANG SUKSES / BANGUN PAGI / PADAHAL ADA YANG SALAH',
        emphasis_words: ['semangat'],
        emphasisWords: ['semangat'],
        visual_animation: {
          layout: 'centered_title_with_floating_icons',
          remotion_animation: 'spring_pop_in',
          asset_elements: ['alarm_clock', 'bed_miniature'],
        },
        sfx: { file: 'whoosh_impact.mp3', type: 'whoosh', play_at_second: 0.0 },
        visualModule: 'otomatis',
        accentColor: '#2563EB',
        secondaryColor: '#facc15',
        sfxCue: 'whoosh',
        camera: 'push',
        theme: 'paper',
        visualDescription: 'Jam weker 3D besar berdering di atas panggung visual kontras dengan kartu hook fokus pagi.',
      },
      {
        id: 'sc-2',
        scene_number: 2,
        role: 'body_core_point',
        target_duration_sec: 7.5,
        durationSeconds: 7.5,
        narration_text: 'Banyak yang mengira rasa malas pagi bakal hilang kalau kita nunggu mood dan semangat datang.',
        voiceScript: 'Banyak yang mengira rasa malas pagi bakal hilang kalau kita nunggu mood dan semangat datang.',
        on_screen_text: 'Fokus: KELIRU',
        hookText: 'Fokus: KELIRU',
        emphasis_words: ['keliru'],
        emphasisWords: ['keliru'],
        visual_animation: {
          layout: 'split_text_and_graphic',
          remotion_animation: 'slide_from_bottom',
          asset_elements: ['magnets_two', 'bed_table'],
        },
        sfx: { file: 'pop_ding.mp3', type: 'pop', play_at_second: 0.5 },
        visualModule: 'otomatis',
        accentColor: '#2a9d8f',
        secondaryColor: '#f06c64',
        sfxCue: 'pop',
        camera: 'pan-left',
        theme: 'paper',
        visualDescription: 'Dua magnet 3D muncul di papan: satu menarik ke kasur empuk, satu ke meja kerja.',
      },
      {
        id: 'sc-3',
        scene_number: 3,
        role: 'body_core_point',
        target_duration_sec: 7.5,
        durationSeconds: 7.5,
        narration_text: 'Semangat itu bukan syarat buat mulai bergerak. Semakin lama kamu diam, tarikan kasur justru makin kuat.',
        voiceScript: 'Semangat itu bukan syarat buat mulai bergerak. Semakin lama kamu diam, tarikan kasur justru makin kuat.',
        on_screen_text: 'Fokus: KASUR',
        hookText: 'Fokus: KASUR',
        emphasis_words: ['kasur'],
        emphasisWords: ['kasur'],
        visual_animation: {
          layout: 'split_text_and_graphic',
          remotion_animation: 'zoom_in_rotate',
          asset_elements: ['cylinder_piece', 'red_bar_growth'],
        },
        sfx: { file: 'pop_ding.mp3', type: 'pop', play_at_second: 0.2 },
        visualModule: 'otomatis',
        accentColor: '#f06c64',
        secondaryColor: '#2a9d8f',
        sfxCue: 'pop',
        camera: 'tilt-down',
        theme: 'paper',
        visualDescription: 'Bidak silinder tertarik mendekati kasur, indikator batang merah naik perlahan di papan miniatur.',
      },
      {
        id: 'sc-4',
        scene_number: 4,
        role: 'body_core_point',
        target_duration_sec: 7.5,
        durationSeconds: 7.5,
        narration_text: 'Bayangkan tubuhmu seperti benda yang terjebak di antara dua gaya tarik yang saling berebut.',
        voiceScript: 'Bayangkan tubuhmu seperti benda yang terjebak di antara dua gaya tarik yang saling berebut.',
        on_screen_text: 'Fokus: MAGNET',
        hookText: 'Fokus: MAGNET',
        emphasis_words: ['magnet'],
        emphasisWords: ['magnet'],
        visual_animation: {
          layout: 'split_text_and_graphic',
          remotion_animation: 'pulse_heartbeat',
          asset_elements: ['magnetic_field_lines'],
        },
        sfx: { file: 'whoosh_impact.mp3', type: 'whoosh', play_at_second: 0.1 },
        visualModule: 'otomatis',
        accentColor: '#2a9d8f',
        secondaryColor: '#facc15',
        sfxCue: 'tap',
        camera: 'orbit',
        theme: 'paper',
        visualDescription: 'Garis gaya magnet menyala biru dan oranye memperlihatkan tegangan pilihan antara kasur dan aksi.',
      },
      {
        id: 'sc-5',
        scene_number: 5,
        role: 'body_core_point',
        target_duration_sec: 7.5,
        durationSeconds: 7.5,
        narration_text: 'Cara memutuskannya sederhana banget: duduk, berdiri, lalu lakukan satu pekerjaan selama dua menit saja.',
        voiceScript: 'Cara memutuskannya sederhana banget: duduk, berdiri, lalu lakukan satu pekerjaan selama dua menit saja.',
        on_screen_text: 'Fokus: BERDIRI',
        hookText: 'Fokus: BERDIRI',
        emphasis_words: ['berdiri'],
        emphasisWords: ['berdiri'],
        visual_animation: {
          layout: 'split_text_and_graphic',
          remotion_animation: 'spring_pop_in',
          asset_elements: ['cylinder_jump', 'gold_coins'],
        },
        sfx: { file: 'pop_ding.mp3', type: 'pop', play_at_second: 0.3 },
        visualModule: 'otomatis',
        accentColor: '#2a9d8f',
        secondaryColor: '#ffc23d',
        sfxCue: 'pop',
        camera: 'pan-right',
        theme: 'paper',
        visualDescription: 'Bidak silinder melompat lepas dari kasur ke jalan kecil, koin emas berjatuhan.',
      },
      {
        id: 'sc-6',
        scene_number: 6,
        role: 'body_core_point',
        target_duration_sec: 7.5,
        durationSeconds: 7.5,
        narration_text: 'Jangan tunggu pengen bergerak. Begitu tubuhmu jalan, baru semangatnya bakal buru-buru menyusul.',
        voiceScript: 'Jangan tunggu pengen bergerak. Begitu tubuhmu jalan, baru semangatnya bakal buru-buru menyusul.',
        on_screen_text: 'Fokus: MENYUSUL',
        hookText: 'Fokus: MENYUSUL',
        emphasis_words: ['menyusul'],
        emphasisWords: ['menyusul'],
        visual_animation: {
          layout: 'split_text_and_graphic',
          remotion_animation: 'slide_from_bottom',
          asset_elements: ['teal_bars_growth'],
        },
        sfx: { file: 'pop_ding.mp3', type: 'pop', play_at_second: 0.2 },
        visualModule: 'otomatis',
        accentColor: '#2a9d8f',
        secondaryColor: '#facc15',
        sfxCue: 'card_slide',
        camera: 'push',
        theme: 'paper',
        visualDescription: 'Batang 3D toska tumbuh pesat dari papan menunjukkan energi yang melonjak setelah 2 menit bergerak.',
      },
      {
        id: 'sc-7',
        scene_number: 7,
        role: 'body_core_point',
        target_duration_sec: 7.5,
        durationSeconds: 7.5,
        narration_text: 'Kamu nggak perlu memenangkan perang melawan rasa malas seharian. Cukup menang di sepuluh menit pertama.',
        voiceScript: 'Kamu nggak perlu memenangkan perang melawan rasa malas seharian. Cukup menang di sepuluh menit pertama.',
        on_screen_text: 'Fokus: MENANG',
        hookText: 'Fokus: MENANG',
        emphasis_words: ['menang'],
        emphasisWords: ['menang'],
        visual_animation: {
          layout: 'split_text_and_graphic',
          remotion_animation: 'spring_pop_in',
          asset_elements: ['building_office', 'victory_flag'],
        },
        sfx: { file: 'whoosh_impact.mp3', type: 'whoosh', play_at_second: 0.1 },
        visualModule: 'otomatis',
        accentColor: '#ffc23d',
        secondaryColor: '#2a9d8f',
        sfxCue: 'pop',
        camera: 'tilt-up',
        theme: 'paper',
        visualDescription: 'Indikator target sepuluh menit pertama bersinar terang dengan lencana kemenangan.',
      },
      {
        id: 'sc-8',
        scene_number: 8,
        role: 'cta',
        target_duration_sec: 7.5,
        durationSeconds: 7.5,
        narration_text: 'Besok pagi saat alarm bunyi, langsung hitung mundur tiga detik dan berdiri. Jangan lupa follow akun ini!',
        voiceScript: 'Besok pagi saat alarm bunyi, langsung hitung mundur tiga detik dan berdiri. Jangan lupa follow akun ini!',
        on_screen_text: 'Simpan & Share Video Ini!',
        hookText: 'Simpan & Share Video Ini!',
        emphasis_words: ['follow'],
        emphasisWords: ['follow'],
        visual_animation: {
          layout: 'call_to_action_banner',
          remotion_animation: 'pulse_heartbeat',
          asset_elements: ['data_card', 'follow_button_gold'],
        },
        sfx: { file: 'notification_chime.mp3', type: 'bell', play_at_second: 0.2 },
        visualModule: 'otomatis',
        accentColor: '#10b981',
        secondaryColor: '#38bdf8',
        sfxCue: 'tap',
        camera: 'pull',
        theme: 'paper',
        visualDescription: 'Kartu data putih terangkat menampilkan tips 3 detik dan tombol follow bersinar emas di sudut.',
      },
    ],
    createdAt: Date.now(),
  },
];

DEFAULT_PROJECTS[0] = synchronizeProjectPipeline(DEFAULT_PROJECTS[0]);
DEFAULT_PROJECTS[0].remotionCode = generateRemotionCode(DEFAULT_PROJECTS[0], 30);

export default function App() {
  const [viewMode, setViewMode] = useState<'landing' | 'studio'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1' || params.get('view') === 'studio') {
        return 'studio';
      }
    }
    return 'landing';
  });

  const [currentUser, setCurrentUser] = useState<CreatorSessionUser | null>(() => {
    try {
      const saved = localStorage.getItem('satset_creator_session');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const syncedUser: CreatorSessionUser = {
          name:
            fbUser.displayName ||
            fbUser.email?.split('@')[0] ||
            'Kreator Google',
          email: fbUser.email || 'creator@graphmotion.id',
          roleBadge: 'Google Account',
        };
        setCurrentUser(syncedUser);
        try {
          localStorage.setItem(
            'satset_creator_session',
            JSON.stringify(syncedUser)
          );
        } catch {
          // ignore
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('graph_motion_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'dark';
  });

  const handleSetThemeMode = (nextMode: 'dark' | 'light') => {
    setThemeMode(nextMode);
    try {
      localStorage.setItem('graph_motion_theme', nextMode);
    } catch {
      // ignore
    }
  };

  const [studioInitialStep, setStudioInitialStep] = useState<StudioNavStep>('ide');

  const [projectList, setProjectList] = useState<SatsetProject[]>(() => {
    try {
      const saved = localStorage.getItem('graph_motion_user_projects_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((p: SatsetProject) => {
            if (p.id === 'proj-default-1' || p.gaya_video === 'otomatis' || p.styleModule === 'otomatis') {
              p = {
                ...p,
                gaya_video: p.id === 'proj-default-1' ? 'otomatis' : p.gaya_video,
                styleModule: p.id === 'proj-default-1' ? 'otomatis' : p.styleModule,
                scenes: (p.scenes || []).map((sc) => ({
                  ...sc,
                  visualModule: sc.visualModule === 'diorama_data' && p.id === 'proj-default-1' ? 'otomatis' : sc.visualModule,
                  visualDescription: (sc.visualDescription || '').replace(/\bdiorama(\s+data)?\b/gi, 'studio 3D'),
                })),
              };
            }
            return synchronizeProjectPipeline(p);
          });
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_PROJECTS;
  });

  const [currentProjectId, setCurrentProjectId] = useState<string>(() => {
    return projectList[0]?.id || DEFAULT_PROJECTS[0].id;
  });

  const [activeTab, setActiveTab] = useState<AppTab>('studio');
  const [isSecondaryMenuOpen, setIsSecondaryMenuOpen] = useState(false);
  const secondaryMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isSecondaryMenuOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (secondaryMenuRef.current && !secondaryMenuRef.current.contains(event.target as Node)) {
        setIsSecondaryMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSecondaryMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSecondaryMenuOpen]);

  const currentProject = projectList.find((p) => p.id === currentProjectId) || projectList[0] || DEFAULT_PROJECTS[0];

  const persistProjects = (projects: SatsetProject[]) => {
    setProjectList(projects);
    try {
      localStorage.setItem('graph_motion_user_projects_v2', JSON.stringify(projects));
    } catch {
      // ignore
    }
  };

  const handleUpdateCurrentProject = (updated: SatsetProject) => {
    const list = projectList.map((p) => (p.id === updated.id ? updated : p));
    persistProjects(list);
  };

  const handleCreateNewProject = (name: string) => {
    const trimmedName = (name || '').trim() || 'Proyek Baru';
    const detectedUrl = extractWebsiteUrl(trimmedName);

    if (detectedUrl) {
      const targetUrl = detectedUrl;
      const profile = buildWebsitePromoProfile(targetUrl);
      const concepts = buildWebsitePromoConcepts(profile);
      const scenes = buildWebsitePromoScenes(profile, 8, 48, concepts[0]);
      const webProj: SatsetProject = {
        id: `proj-${Date.now().toString(36)}`,
        project_title: trimmedName,
        title: trimmedName,
        status: 'ready_to_render',
        start_mode: 'url',
        source_url: profile.url,
        website_promo: profile,
        language: 'id',
        content_type: 'promosi',
        topik_video: `${profile.url} — ${profile.brandName}: ${profile.tagline}`,
        topic: `${profile.url} — ${profile.brandName}: ${profile.tagline}`,
        target_duration_sec: 48,
        durationSeconds: 48,
        fps: 30,
        gaya_video: 'otomatis',
        styleModule: 'otomatis',
        character: 'cowok_modis',
        character_gender: 'pria',
        character_with_objects: true,
        character_full_backstory: false,
        warna_brand: profile.primaryColor,
        brandColor: profile.primaryColor,
        brand_secondary_color: profile.secondaryColor,
        brand_accent_color: profile.accentColor,
        brand_mode: 'custom',
        brand_preset_name: profile.brandName,
        transition: 'otomatis',
        tempo: 'energik',
        target_audience: 'pebisnis',
        idea_count: concepts.length,
        idea_concepts: concepts,
        selected_idea_id: concepts[0].id,
        aspect_ratio: '9:16',
        bgm_style: 'upbeat_synth',
        bgm_volume: 0.6,
        auto_ducking: true,
        ducking_level: 0.15,
        voice_character: 'Fenrir',
        voice_option: 'fenrir',
        voiceOption: 'fenrir',
        subtitle_style: 'auto',
        subtitleStyle: 'auto',
        subtitle_position: 'auto',
        duration_mode: 'auto',
        watermark: 'Graph Motion',
        scenes,
        createdAt: Date.now(),
      };
      const syncedWebProj = synchronizeProjectPipeline(webProj, {
        recalculateDurations: false,
        forceStyleSync: true,
      });
      syncedWebProj.remotionCode = generateRemotionCode(syncedWebProj, 30);
      const updatedList = [syncedWebProj, ...projectList];
      persistProjects(updatedList);
      setCurrentProjectId(syncedWebProj.id);
      setActiveTab('studio');
      return;
    }

    const templateScenes = DEFAULT_PROJECTS[0].scenes.map((sc, idx) => ({
      ...sc,
      id: `sc-${idx + 1}`,
      scene_number: idx + 1,
    }));

    const newProj: SatsetProject = {
      id: `proj-${Date.now().toString(36)}`,
      project_title: trimmedName,
      title: trimmedName,
      status: 'draft',
      start_mode: 'topic',
      language: 'id',
      content_type: 'motivasi',
      topik_video: trimmedName,
      topic: trimmedName,
      target_duration_sec: 60,
      durationSeconds: 60,
      fps: 30,
      gaya_video: 'otomatis',
      styleModule: 'otomatis',
      character: 'cowok_modis',
      character_gender: 'pria',
      character_with_objects: true,
      character_full_backstory: false,
      warna_brand: '#2563EB',
      brandColor: '#2563EB',
      brand_secondary_color: '#1e3a8a',
      brand_accent_color: '#38bdf8',
      brand_mode: 'auto',
      transition: 'otomatis',
      tempo: 'energik',
      target_audience: 'pelajar',
      idea_count: 5,
      idea_concepts: DEFAULT_PROJECTS[0].idea_concepts,
      selected_idea_id: 'c-1',
      aspect_ratio: '9:16',
      bgm_style: 'upbeat_synth',
      bgm_volume: 0.6,
      auto_ducking: true,
      ducking_level: 0.15,
      voice_option: 'charon',
      voiceOption: 'charon',
      subtitle_style: 'auto',
      subtitleStyle: 'auto',
      subtitle_position: 'auto',
      duration_mode: 'auto',
      watermark: 'Graph Motion',
      scenes: templateScenes,
      createdAt: Date.now(),
    };

    const syncedNewProj = synchronizeProjectPipeline(newProj);
    syncedNewProj.remotionCode = generateRemotionCode(syncedNewProj, 30);
    const updatedList = [syncedNewProj, ...projectList];
    persistProjects(updatedList);
    setCurrentProjectId(syncedNewProj.id);
    setActiveTab('studio');
  };

  const handleDeleteProject = (id: string) => {
    const remaining = projectList.filter((p) => p.id !== id);
    if (remaining.length === 0) {
      persistProjects([]);
      setCurrentProjectId('');
    } else {
      persistProjects(remaining);
      if (currentProjectId === id) {
        setCurrentProjectId(remaining[0].id);
      }
    }
  };

  const handleSelectModuleFromGallery = (modId: SatsetStyleModule) => {
    const updated = { ...currentProject, gaya_video: modId, styleModule: modId };
    updated.remotionCode = generateRemotionCode(updated, 30);
    handleUpdateCurrentProject(updated);
    setActiveTab('studio');
  };

  if (viewMode === 'landing') {
    return (
      <LandingPage3D
        currentUser={currentUser}
        onUserAuthenticated={(user) => setCurrentUser(user)}
        themeMode={themeMode}
        onChangeThemeMode={handleSetThemeMode}
        onEnterStudio={(user, step) => {
          setCurrentUser(user);
          if (step) setStudioInitialStep(step);
          setActiveTab('studio');
          setViewMode('studio');
        }}
      />
    );
  }

  const isLight = themeMode === 'light';

  return (
    <div
      className={`flex flex-col h-screen w-screen overflow-hidden font-sans transition-colors duration-300 ${
        isLight
          ? 'studio-theme-light bg-[#eef6ff] text-slate-950'
          : 'studio-theme-dark bg-[#020817] text-[#f8fafc]'
      }`}
    >
      {/* If inside secondary views (Uploader, Gallery, Remotion), show unified Graph Motion top bar */}
      {activeTab !== 'studio' && (
        <header
          className={`h-14 border-b px-3 sm:px-8 flex items-center justify-between gap-2 shrink-0 z-30 backdrop-blur-xl transition-colors ${
            isLight
              ? 'bg-white/90 border-blue-200/80 text-slate-900'
              : 'bg-[#041029]/90 border-sky-400/20 text-slate-100'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              type="button"
              data-testid="back-to-studio-btn"
              onClick={() => setActiveTab('studio')}
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer shrink-0 ${
                isLight
                  ? 'bg-blue-50/80 border-blue-200 text-blue-800 hover:bg-blue-100'
                  : 'bg-[#071636] border-sky-400/30 text-sky-200 hover:border-sky-300 hover:text-white'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Studio</span>
            </button>

            <span
              aria-hidden="true"
              className={`hidden sm:inline-block h-4 w-[1px] shrink-0 ${
                isLight ? 'bg-blue-200' : 'bg-sky-400/25'
              }`}
            />

            <div className="hidden sm:flex items-center gap-2.5 min-w-0">
              <GraphMotionBrandLockup isLight={isLight} size="sm" />
              <span
                className={`text-xs font-bold truncate ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {activeTab === 'remotion'
                  ? '· Kode TSX & Blueprint Export'
                  : activeTab === 'uploader'
                  ? '· Import Komposisi TSX'
                  : '· Galeri Modul Visual'}
              </span>
            </div>
          </div>

          <div ref={secondaryMenuRef} className="relative flex items-center shrink-0">
            <button
              type="button"
              data-testid="secondary-header-menu-btn"
              aria-label="Menu & Pengaturan Tab Remotion Tools"
              aria-expanded={isSecondaryMenuOpen}
              title="Tab Remotion, Beranda 3D & Tema Gelap/Terang"
              onClick={() => setIsSecondaryMenuOpen((prev) => !prev)}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition cursor-pointer relative ${
                isSecondaryMenuOpen
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/25'
                  : isLight
                  ? 'bg-blue-50/90 border-blue-200 text-blue-800 hover:bg-blue-100'
                  : 'bg-[#091b42] border-sky-400/30 text-sky-200 hover:border-sky-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span
                aria-hidden="true"
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${
                  isLight
                    ? 'bg-amber-400 border-white'
                    : 'bg-sky-400 border-[#041029]'
                }`}
              />
            </button>

            {isSecondaryMenuOpen && (
              <div
                data-testid="secondary-header-menu-dropdown"
                role="menu"
                aria-label="Tab Remotion & Pengaturan"
                className={`absolute right-0 top-full mt-2 w-64 rounded-2xl border p-2.5 shadow-2xl z-50 space-y-2 backdrop-blur-xl ${
                  isLight
                    ? 'bg-white/95 border-blue-200 text-slate-900 shadow-blue-950/15'
                    : 'bg-[#061433]/98 border-sky-400/30 text-slate-100 shadow-black/60'
                }`}
              >
                <div className="space-y-1">
                  <span
                    className={`block px-2 pt-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${
                      isLight ? 'text-slate-500' : 'text-sky-400/80'
                    }`}
                  >
                    Navigasi &amp; Tab
                  </span>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsSecondaryMenuOpen(false);
                      setViewMode('landing');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isLight
                        ? 'text-slate-800 hover:bg-blue-50 hover:text-blue-700'
                        : 'text-slate-200 hover:bg-blue-950/80 hover:text-sky-300'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Home className="w-3.5 h-3.5 text-sky-400" />
                      <span>Beranda 3D</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsSecondaryMenuOpen(false);
                      setActiveTab('studio');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isLight
                        ? 'text-slate-800 hover:bg-blue-50 hover:text-blue-700'
                        : 'text-slate-200 hover:bg-blue-950/80 hover:text-sky-300'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Sliders className="w-3.5 h-3.5 text-sky-400" />
                      <span>Studio Utama</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsSecondaryMenuOpen(false);
                      setActiveTab('remotion');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeTab === 'remotion'
                        ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-sm'
                        : isLight
                        ? 'text-slate-800 hover:bg-blue-50 hover:text-blue-700'
                        : 'text-slate-200 hover:bg-blue-950/80 hover:text-sky-300'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Kode &amp; Export TSX</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsSecondaryMenuOpen(false);
                      setActiveTab('uploader');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeTab === 'uploader'
                        ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-sm'
                        : isLight
                        ? 'text-slate-800 hover:bg-blue-50 hover:text-blue-700'
                        : 'text-slate-200 hover:bg-blue-950/80 hover:text-sky-300'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload Modul TSX</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsSecondaryMenuOpen(false);
                      setActiveTab('gallery');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeTab === 'gallery'
                        ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-sm'
                        : isLight
                        ? 'text-slate-800 hover:bg-blue-50 hover:text-blue-700'
                        : 'text-slate-200 hover:bg-blue-950/80 hover:text-sky-300'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Galeri Modul</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                  </button>
                </div>

                <div className={`pt-2 border-t ${isLight ? 'border-blue-100' : 'border-sky-400/15'} space-y-1.5`}>
                  <span
                    className={`block px-2 text-[10px] font-mono font-bold uppercase tracking-wider ${
                      isLight ? 'text-slate-500' : 'text-sky-400/80'
                    }`}
                  >
                    Tema Tampilan
                  </span>
                  <div
                    role="group"
                    aria-label="Tema Studio"
                    className={`grid grid-cols-2 gap-1 p-1 rounded-xl border text-[11px] font-semibold ${
                      isLight
                        ? 'bg-blue-50 border-blue-200 text-slate-700'
                        : 'bg-[#030b20] border-sky-400/25 text-blue-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSetThemeMode('dark')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition cursor-pointer ${
                        !isLight
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Moon className="w-3 h-3" />
                      <span>Deep Blue</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetThemeMode('light')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition cursor-pointer ${
                        isLight
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'text-sky-300/75 hover:text-white'
                      }`}
                    >
                      <Sun className="w-3 h-3" />
                      <span>Ice Blue</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Main Container */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'studio' && (
          <SatsetStudio
            initialProject={currentProject}
            projects={projectList}
            initialStep={studioInitialStep}
            currentUser={currentUser}
            themeMode={themeMode}
            onChangeThemeMode={handleSetThemeMode}
            onBackToLanding={() => setViewMode('landing')}
            onUpdateProject={handleUpdateCurrentProject}
            onOpenRemotionCode={(p) => {
              handleUpdateCurrentProject(p);
              setActiveTab('remotion');
            }}
            onOpenAutoRemotion={() => setActiveTab('uploader')}
            onSelectProject={(id) => setCurrentProjectId(id)}
            onCreateNewProject={(name) => handleCreateNewProject(name)}
            onDeleteProject={(id) => handleDeleteProject(id)}
          />
        )}

        {activeTab === 'uploader' && (
          <div
            className={`h-full overflow-y-auto p-4 sm:p-8 transition-colors ${
              isLight ? 'bg-[#eef6ff]' : 'bg-[#020817]'
            }`}
          >
            <AutoRemotionUploader
              themeMode={themeMode}
              onProjectReady={(p) => {
                handleUpdateCurrentProject(synchronizeProjectPipeline(p));
                setActiveTab('studio');
              }}
              onOpenRemotionCode={() => setActiveTab('remotion')}
            />
          </div>
        )}

        {activeTab === 'gallery' && (
          <div
            className={`h-full overflow-y-auto p-4 sm:p-8 transition-colors ${
              isLight ? 'bg-[#eef6ff]' : 'bg-[#020817]'
            }`}
          >
            <SatsetGallery onSelectModuleForVideo={handleSelectModuleFromGallery} />
          </div>
        )}

        {activeTab === 'remotion' && (
          <div
            className={`h-full overflow-y-auto p-4 sm:p-8 transition-colors ${
              isLight ? 'bg-[#eef6ff]' : 'bg-[#020817]'
            }`}
          >
            <RemotionCodeViewer
              project={currentProject}
              themeMode={themeMode}
              onOpenUploader={() => setActiveTab('uploader')}
            />
          </div>
        )}
      </main>
    </div>
  );
}

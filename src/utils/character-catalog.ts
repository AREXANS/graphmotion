import { type CharacterDimension, type CharacterFraming, type CharacterOption, type TransitionOption } from '../types/satset.ts';
import {
  type CustomCharacterConfig,
  buildCharacterTraitsSummary,
  customCharacterToEngineLook,
  getCustomCharacterById,
} from './custom-character.ts';
import './custom-character-renderer.ts';

export interface CharacterEngineLook {
  stick?: 'thin' | 'round' | 'side';
  hair?: string;
  hairColor?: string;
  skin?: string;
  shirt?: string;
  jacket?: string;
  jacketOpen?: boolean;
  pants?: string;
  dress?: string | boolean;
  shoes?: string;
  hijab?: string;
  khimar?: boolean;
  niqab?: boolean;
  peci?: string;
  koko?: boolean;
  tie?: string;
  cap?: string;
  pack?: string;
  age?: 'kid' | 'teen' | 'adult' | 'old';
  body?: 'slim' | 'big' | 'normal';
  species?: string;
  furSecondaryColor?: string;
  accentColor?: string;
  viewMode?: CharacterFraming;
  __is3DStudioCreator?: boolean;
  __has3DHeadphone?: boolean;
  __is3DOrbOnly?: boolean;
}

export interface CharacterFramingOption {
  id: CharacterFraming;
  name: string;
  description: string;
  badge?: string;
}

export const CHARACTER_FRAMING_OPTIONS: CharacterFramingOption[] = [
  {
    id: 'full',
    name: 'Full Body 3D',
    description: 'Karakter penuh dari kepala sampai sepatu berdiri di adegan',
    badge: 'FULL',
  },
  {
    id: 'bust',
    name: 'Setengah Badan',
    description: 'Framing pinggang ke atas ala host Reels & pojok layar',
    badge: 'HOST',
  },
  {
    id: 'closeup',
    name: 'Close-Up Kepala',
    description: 'Fokus wajah & ekspresi 3D besar seperti intro studio sinematik',
    badge: 'CLOSE',
  },
  {
    id: 'orb',
    name: 'Tanpa Badan (Orb)',
    description: 'Mascot AI bersayap 3D melayang ringan tanpa badan penuh',
    badge: 'ORB 3D',
  },
];

export interface CharacterCatalogItem {
  id: CharacterOption;
  name: string;
  description: string;
  badge?: string;
  category: 'mode' | 'humanoid' | 'cowok' | 'cewek' | 'stickman';
  gender: 'male' | 'female';
  neutral?: boolean;
  canDemo: boolean;
  look?: CharacterEngineLook;
}

export interface CharacterPoseDemo {
  id: string;
  label: string;
}

export interface CharacterStoryStep {
  pose: string;
  caption: string;
  facing?: 1 | -1;
}

export const CHARACTER_CATALOG: CharacterCatalogItem[] = [
  {
    id: 'none',
    name: 'Tanpa karakter',
    description: 'Video hanya teks & ilustrasi visual, tanpa tokoh orang',
    category: 'mode',
    gender: 'male',
    neutral: true,
    canDemo: false,
  },
  {
    id: 'auto',
    name: 'Otomatis',
    description: 'AI merancang tokoh 3D sesuai peran & konteks tiap scene, terikat semua suara',
    badge: 'SMART AI',
    category: 'mode',
    gender: 'male',
    neutral: true,
    canDemo: false,
    look: {
      hair: 'short',
      shirt: '#38bdf8',
      pants: '#1e3a8a',
      jacket: '#0f172a',
      jacketOpen: true,
      accentColor: '#38bdf8',
      __is3DStudioCreator: true,
    },
  },
  {
    id: 'kreator_3d_studio',
    name: 'Kreator 3D Studio',
    description: 'Karakter 3D Chibi (gaya Kreatorlab) berambut merah 3D bervolume, hoodie hitam berlogo & sneakers',
    badge: '3D PRO',
    category: 'cowok',
    gender: 'male',
    canDemo: true,
    look: {
      hair: 'quiff',
      hairColor: '#e63911',
      skin: '#f6d5ba',
      shirt: '#141417',
      jacket: '#141417',
      jacketOpen: false,
      pants: '#18181b',
      shoes: '#ef4444',
      accentColor: '#ff4520',
      __is3DStudioCreator: true,
      __has3DHeadphone: false,
    },
  },
  {
    id: 'kreator_3d_headphone',
    name: 'Kreator 3D Headphone',
    description: 'Host 3D Chibi dengan headphone gaming merah-hitam, rambut 3D merah menyala & hoodie hitam',
    badge: '3D HOST',
    category: 'cowok',
    gender: 'male',
    canDemo: true,
    look: {
      hair: 'quiff',
      hairColor: '#e63911',
      skin: '#f6d5ba',
      shirt: '#141417',
      jacket: '#141417',
      jacketOpen: false,
      pants: '#18181b',
      shoes: '#ef4444',
      accentColor: '#ff4520',
      __is3DStudioCreator: true,
      __has3DHeadphone: true,
    },
  },
  // Colorful Unique 3D Humanoids & Non-Full-Body Mascot
  {
    id: 'rubah_biru_3d',
    name: 'Rubah Biru Siber 3D',
    description: 'Chibi anime Cyber-Fox 3D bertelinga 3-lapis, rambut biru-petir kuning, hoodie X cyan & ekor berujung emas',
    badge: 'BIRU 3D',
    category: 'humanoid',
    gender: 'male',
    neutral: true,
    canDemo: true,
    look: {
      species: 'fox',
      hair: 'spiky',
      hairColor: '#0077ff',
      skin: '#fde6d8',
      furSecondaryColor: '#fde047',
      shirt: '#ffffff',
      jacket: '#0b132b',
      jacketOpen: true,
      pants: '#0f172a',
      shoes: '#00e5ff',
      accentColor: '#00e5ff',
      __is3DStudioCreator: true,
      __isCyberFox: true,
    } as any,
  },
  {
    id: 'robot_cyan_3d',
    name: 'Robot AI Cyan 3D',
    description: 'Android biru elektrik berkilau 3D dengan antena bercahaya, core dada & ekspresi luwes',
    badge: 'ROBOT 3D',
    category: 'humanoid',
    gender: 'male',
    neutral: true,
    canDemo: true,
    look: {
      species: 'robot',
      hair: 'bald',
      hairColor: '#0284c7',
      skin: '#0ea5e9',
      furSecondaryColor: '#cffafe',
      shirt: '#0f172a',
      jacket: '#0f172a',
      pants: '#1e293b',
      shoes: '#22d3ee',
      accentColor: '#22d3ee',
      __is3DStudioCreator: true,
    } as any,
  },
  {
    id: 'kucing_ungu_3d',
    name: 'Kucing Neko Ungu 3D',
    description: 'Humanoid kucing lavender-ungu 3D dengan telinga neko, ekor lentur & headphone studio',
    badge: 'NEKO 3D',
    category: 'humanoid',
    gender: 'female',
    neutral: true,
    canDemo: true,
    look: {
      species: 'cat',
      hair: 'spiky',
      hairColor: '#7c3aed',
      skin: '#8b5cf6',
      furSecondaryColor: '#f3e8ff',
      shirt: '#1e1b4b',
      jacket: '#312e81',
      pants: '#0f172a',
      shoes: '#c084fc',
      accentColor: '#c084fc',
      __is3DStudioCreator: true,
      __has3DHeadphone: true,
    } as any,
  },
  {
    id: 'panda_emerald_3d',
    name: 'Panda Emerald 3D',
    description: 'Humanoid panda 3D unik dengan patch mata khas & jaket hijau emerald modern',
    badge: 'PANDA 3D',
    category: 'humanoid',
    gender: 'male',
    neutral: true,
    canDemo: true,
    look: {
      species: 'panda',
      hair: 'short',
      hairColor: '#1e293b',
      skin: '#f8fafc',
      furSecondaryColor: '#1e293b',
      shirt: '#f8fafc',
      jacket: '#059669',
      jacketOpen: true,
      pants: '#0f172a',
      shoes: '#10b981',
      accentColor: '#10b981',
      __is3DStudioCreator: true,
    } as any,
  },
  {
    id: 'serigala_biru_3d',
    name: 'Serigala Navy 3D',
    description: 'Humanoid serigala biru gelap 3D karismatik dengan jaket slate & aksen emas hangat',
    badge: 'WOLF 3D',
    category: 'humanoid',
    gender: 'male',
    neutral: true,
    canDemo: true,
    look: {
      species: 'wolf',
      hair: 'spiky',
      hairColor: '#1e3a8a',
      skin: '#3b82f6',
      furSecondaryColor: '#dbeafe',
      shirt: '#0f172a',
      jacket: '#1e293b',
      jacketOpen: true,
      pants: '#09090b',
      shoes: '#f59e0b',
      accentColor: '#f59e0b',
      __is3DStudioCreator: true,
    } as any,
  },
  {
    id: 'alien_mint_3d',
    name: 'Alien Mint Kosmik 3D',
    description: 'Humanoid alien hijau mint bertelinga lancip dengan visor gaya futuristik & jaket putih',
    badge: 'ALIEN 3D',
    category: 'humanoid',
    gender: 'male',
    neutral: true,
    canDemo: true,
    look: {
      species: 'alien',
      hair: 'short',
      hairColor: '#059669',
      skin: '#34d399',
      furSecondaryColor: '#d1fae5',
      shirt: '#0f172a',
      jacket: '#f8fafc',
      jacketOpen: true,
      pants: '#1e293b',
      shoes: '#10b981',
      accentColor: '#34d399',
      __is3DStudioCreator: true,
    } as any,
  },
  {
    id: 'maskot_orb_3d',
    name: 'Orb Bersayap 3D',
    description: 'Mascot AI 3D tanpa badan — bola mengambang bersayap dengan mata digital ekspresif',
    badge: 'TANPA BADAN',
    category: 'humanoid',
    gender: 'male',
    neutral: true,
    canDemo: true,
    look: {
      species: 'robot',
      shirt: '#2563eb',
      accentColor: '#38bdf8',
      viewMode: 'orb',
      __is3DStudioCreator: true,
      __is3DOrbOnly: true,
    },
  },
  {
    id: 'cowok_biasa',
    name: 'Cowok Santai 3D',
    description: 'Karakter 3D pria muda kasual berkaos teal hangat & celana santai',
    category: 'cowok',
    gender: 'male',
    canDemo: true,
    look: {
      hair: 'short',
      hairColor: '#231f20',
      skin: '#efc0a3',
      shirt: '#2c8c84',
      pants: '#334155',
      shoes: '#f8fafc',
      accentColor: '#38bdf8',
      __is3DStudioCreator: true,
    },
  },
  {
    id: 'cowok_modis',
    name: 'Cowok Modis 3D',
    description: 'Karakter 3D jambul modern, kaos putih, jaket cokelat terbuka & sneakers putih',
    category: 'cowok',
    gender: 'male',
    canDemo: true,
    look: {
      hair: 'quiff',
      hairColor: '#2b2220',
      skin: '#f6d5ba',
      shirt: '#f7f4ec',
      jacket: '#8a5a3c',
      jacketOpen: true,
      pants: '#2b2a28',
      shoes: '#f7f4ec',
      accentColor: '#f59e0b',
      __is3DStudioCreator: true,
    },
  },
  {
    id: 'cowok_berjaket',
    name: 'Cowok Hoodie 3D',
    description: 'Karakter 3D berhoodie biru gelap & celana jeans kasual',
    category: 'cowok',
    gender: 'male',
    canDemo: true,
    look: {
      hair: 'short',
      hairColor: '#2b2220',
      skin: '#efc0a3',
      shirt: '#2d3142',
      jacket: '#2d3142',
      pants: '#3b5b92',
      shoes: '#f7f4ec',
      accentColor: '#60a5fa',
      __is3DStudioCreator: true,
    },
  },
  {
    id: 'cowok_muslim',
    name: 'Cowok Muslim 3D',
    description: 'Karakter 3D berbaju koko putih & peci hitam rapi untuk cerita keseharian',
    category: 'cowok',
    gender: 'male',
    canDemo: true,
    look: {
      hair: 'short',
      hairColor: '#2b2220',
      skin: '#efc0a3',
      shirt: '#f7f4ec',
      koko: true,
      peci: '#1e293b',
      pants: '#3d3a36',
      shoes: '#1e293b',
      accentColor: '#10b981',
      __is3DStudioCreator: true,
    },
  },
  {
    id: 'cowok_santai',
    name: 'Cowok Hangat 3D',
    description: 'Karakter 3D berkaos oranye hangat, tampil ramah untuk edukasi harian',
    category: 'cowok',
    gender: 'male',
    canDemo: true,
    look: {
      hair: 'curly',
      hairColor: '#3b2a20',
      skin: '#e4ae88',
      shirt: '#f97316',
      pants: '#334155',
      shoes: '#e2e8f0',
      accentColor: '#f97316',
      __is3DStudioCreator: true,
    },
  },
  {
    id: 'cowok_kantoran',
    name: 'Cowok Eksekutif 3D',
    description: 'Karakter 3D berblazer gelap, kemeja putih & dasi biru untuk bisnis',
    category: 'cowok',
    gender: 'male',
    canDemo: true,
    look: {
      hair: 'quiff',
      hairColor: '#1e293b',
      skin: '#f6d5ba',
      shirt: '#f8fafc',
      jacket: '#0f172a',
      jacketOpen: true,
      tie: '#2563eb',
      pants: '#1e293b',
      shoes: '#111827',
      accentColor: '#2563eb',
      __is3DStudioCreator: true,
    },
  },
  {
    id: 'cewek_biasa',
    name: 'Cewek Rambut Panjang 3D',
    description: 'Karakter 3D wanita berambut panjang terurai, atasan pink & bawahan ungu',
    category: 'cewek',
    gender: 'female',
    canDemo: true,
    look: {
      hair: 'long',
      hairColor: '#4a2e22',
      skin: '#f7d5be',
      shirt: '#ee93a6',
      dress: '#8f6bd6',
      pants: '#6d28d9',
      shoes: '#f8fafc',
      accentColor: '#ec4899',
      __is3DStudioCreator: true,
    },
  },
  {
    id: 'cewek_modis',
    name: 'Cewek Modis 3D',
    description: 'Karakter 3D rambut cepol modern, jaket denim terbuka & sneakers putih',
    category: 'cewek',
    gender: 'female',
    canDemo: true,
    look: {
      hair: 'bun',
      hairColor: '#4a2e22',
      skin: '#f7d5be',
      shirt: '#f7f4ec',
      jacket: '#4a78cf',
      jacketOpen: true,
      pants: '#2b2a28',
      shoes: '#f7f4ec',
      accentColor: '#3b82f6',
      __is3DStudioCreator: true,
    },
  },
  {
    id: 'cewek_berhijab',
    name: 'Cewek Berhijab 3D',
    description: 'Karakter 3D berhijab pastel rapi & gamis ungu santun komunikatif',
    category: 'cewek',
    gender: 'female',
    canDemo: true,
    look: {
      hijab: '#ee93a6',
      skin: '#f6d5ba',
      shirt: '#a58bd9',
      dress: '#8f6bd6',
      pants: '#6d28d9',
      shoes: '#f8fafc',
      accentColor: '#a855f7',
      __is3DStudioCreator: true,
    },
  },
  {
    id: 'cewek_bercadar',
    name: 'Cewek Bercadar 3D',
    description: 'Karakter 3D berkhimar panjang, cadar & busana serba hitam elegan',
    category: 'cewek',
    gender: 'female',
    canDemo: true,
    look: {
      hijab: '#1f1d22',
      khimar: true,
      niqab: true,
      skin: '#f6d5ba',
      shirt: '#26232a',
      dress: '#1f1d22',
      pants: '#18181b',
      shoes: '#1f1d22',
      accentColor: '#94a3b8',
      __is3DStudioCreator: true,
    },
  },
  {
    id: 'cewek_mandiri',
    name: 'Cewek Blazer 3D',
    description: 'Karakter 3D berblazer biru navy di atas kemeja putih, tegas & profesional',
    category: 'cewek',
    gender: 'female',
    canDemo: true,
    look: {
      hair: 'long',
      hairColor: '#2b2220',
      skin: '#f7d5be',
      shirt: '#f8fafc',
      jacket: '#1e3a8a',
      jacketOpen: true,
      pants: '#1e293b',
      shoes: '#1e293b',
      accentColor: '#2563eb',
      __is3DStudioCreator: true,
    },
  },
  {
    id: 'kakek_bijak',
    name: 'Kakek Bijak 3D',
    description: 'Karakter 3D senior berambut perak, tenang dan sarat pengalaman hidup',
    category: 'cowok',
    gender: 'male',
    canDemo: true,
    look: {
      age: 'old',
      hair: 'short',
      hairColor: '#cbd5e1',
      skin: '#ecc5a8',
      shirt: '#94a3b8',
      jacket: '#78350f',
      jacketOpen: true,
      pants: '#334155',
      shoes: '#475569',
      accentColor: '#f59e0b',
      __is3DStudioCreator: true,
    },
  },
  {
    id: 'nenek_ramah',
    name: 'Nenek Ramah 3D',
    description: 'Karakter 3D nenek bersanggul perak dengan busana hangat & menenangkan',
    category: 'cewek',
    gender: 'female',
    canDemo: true,
    look: {
      age: 'old',
      hair: 'bun',
      hairColor: '#cbd5e1',
      skin: '#ecc5a8',
      shirt: '#f59e0b',
      dress: '#7c2d12',
      pants: '#7c2d12',
      shoes: '#475569',
      accentColor: '#f59e0b',
      __is3DStudioCreator: true,
    },
  },
  {
    id: 'stickman_kurus',
    name: 'Manekin Putih 3D',
    description: 'Figur 3D netral minimalis serba putih-slate ala animasi explainer modern',
    category: 'stickman',
    gender: 'male',
    neutral: true,
    canDemo: true,
    look: {
      species: 'robot',
      hair: 'bald',
      skin: '#f1f5f9',
      shirt: '#cbd5e1',
      pants: '#64748b',
      shoes: '#334155',
      accentColor: '#38bdf8',
      __is3DStudioCreator: true,
    },
  },
  {
    id: 'stickman_berotot',
    name: 'Bot Oranye 3D',
    description: 'Karakter 3D berwarna oranye ekspresif dengan pose energik',
    category: 'stickman',
    gender: 'male',
    neutral: true,
    canDemo: true,
    look: {
      species: 'robot',
      hair: 'bald',
      skin: '#fb923c',
      shirt: '#ea580c',
      pants: '#1e293b',
      shoes: '#f8fafc',
      accentColor: '#facc15',
      __is3DStudioCreator: true,
    },
  },
  {
    id: 'stickman_samping',
    name: 'Kreator Biru 3D',
    description: 'Karakter 3D bertema biru kobalt dengan hoodie gelap & sepatu putih',
    badge: 'FAVORIT',
    category: 'stickman',
    gender: 'male',
    neutral: true,
    canDemo: true,
    look: {
      hair: 'short',
      hairColor: '#1e40af',
      skin: '#f6d5ba',
      shirt: '#2563eb',
      pants: '#1e293b',
      shoes: '#f8fafc',
      accentColor: '#38bdf8',
      __is3DStudioCreator: true,
    },
  },
  {
    id: 'custom',
    name: '+ Buat karakter sendiri',
    description: 'Kustom avatar 3D (humanoid rubah biru, robot, hijab, kostum) sesuai brand Anda',
    badge: 'PRO',
    category: 'mode',
    gender: 'male',
    neutral: true,
    canDemo: false,
  },
];

const CHARACTER_ALIAS_MAP: Record<string, CharacterOption> = {
  cowok: 'cowok_biasa',
  'cowok-modis': 'cowok_modis',
  'cowok-jaket': 'cowok_berjaket',
  'cowok-muslim': 'cowok_muslim',
  cewek: 'cewek_biasa',
  'cewek-modis': 'cewek_modis',
  'cewek-hijab': 'cewek_berhijab',
  'cewek-cadar': 'cewek_bercadar',
  stick: 'stickman_kurus',
  'stick-bulat': 'stickman_berotot',
  'stick-samping': 'stickman_samping',
  stickman: 'stickman_samping',
};

export function resolveCharacterOption(id?: string | null): CharacterOption {
  if (!id) return 'kreator_3d_studio';
  const clean = String(id).trim();
  return CHARACTER_ALIAS_MAP[clean] || (clean as CharacterOption);
}

export function getCharacterMeta(
  id?: string | null,
  customOverride?: CustomCharacterConfig
): CharacterCatalogItem {
  const resolved = resolveCharacterOption(id);
  const customCfg =
    customOverride && (resolved === customOverride.id || resolved === 'custom' || String(resolved).startsWith('custom_'))
      ? customOverride
      : getCustomCharacterById(resolved);
  if (customCfg) {
    const mapped = customCharacterToEngineLook(customCfg, 'depan');
    return {
      id: customCfg.id,
      name: customCfg.name || 'Karakter Kustom',
      description: buildCharacterTraitsSummary(customCfg),
      badge: 'CUSTOM',
      category: customCfg.species && customCfg.species !== 'human' ? 'humanoid' : customCfg.gender === 'cewek' ? 'cewek' : 'cowok',
      gender: mapped.gender,
      canDemo: true,
      look: mapped.look,
    };
  }
  return (
    CHARACTER_CATALOG.find((c) => c.id === resolved) ||
    CHARACTER_CATALOG.find((c) => c.id === 'kreator_3d_studio')!
  );
}

export function getEngineCharacterConfig(
  id?: string | null,
  preferredGender?: 'pria' | 'wanita',
  customOverride?: CustomCharacterConfig,
  dimension?: CharacterDimension
): { id: string; label: string; gender: 'male' | 'female'; look: CharacterEngineLook & Record<string, any> } | undefined {
  const resolved = resolveCharacterOption(id);
  const dim: CharacterDimension = dimension === '2d' ? '2d' : '3d';
  const customCfg =
    customOverride && (resolved === customOverride.id || resolved === 'custom' || String(resolved).startsWith('custom_'))
      ? customOverride
      : getCustomCharacterById(resolved);
  if (customCfg) {
    const mapped = customCharacterToEngineLook(customCfg, 'depan');
    return {
      id: customCfg.id,
      label: customCfg.name || 'Karakter Kustom',
      gender: mapped.gender,
      look: {
        ...mapped.look,
        __is3DStudioCreator: dim === '3d',
        __characterDimension: dim,
      },
    };
  }
  const meta = getCharacterMeta(id);
  if (meta.id === 'none' || !meta.look) return undefined;
  const resolvedGender: 'male' | 'female' =
    meta.neutral && preferredGender
      ? preferredGender === 'wanita'
        ? 'female'
        : 'male'
      : meta.gender;
  return {
    id: meta.id,
    label: meta.name,
    gender: resolvedGender,
    look: {
      ...meta.look,
      __is3DStudioCreator: dim === '3d',
      __characterDimension: dim,
    },
  };
}

export const CHARACTER_DEMO_POSES: CharacterPoseDemo[] = [
  { id: 'stand', label: 'Berdiri' },
  { id: 'walk', label: 'Berjalan' },
  { id: 'run', label: 'Berlari' },
  { id: 'jump', label: 'Melompat' },
  { id: 'sit', label: 'Duduk' },
  { id: 'point', label: 'Menunjuk' },
  { id: 'kneel', label: 'Berlutut' },
  { id: 'handshake', label: 'Jabat tangan' },
  { id: 'shrug', label: 'Bertanya' },
  { id: 'cheer', label: 'Bersorak' },
  { id: 'pray', label: 'Berdoa' },
  { id: 'wave', label: 'Melambai' },
  { id: 'hips', label: 'Tangan di pinggang' },
  { id: 'nod', label: 'Mengangguk' },
  { id: 'wipe', label: 'Menyeka dahi' },
  { id: 'sad', label: 'Menunduk kecewa' },
  { id: 'flex', label: 'Mengangkat beban' },
  { id: 'read', label: 'Membaca' },
  { id: 'laptop', label: 'Mengetik' },
  { id: 'phone', label: 'Menelepon' },
  { id: 'scared', label: 'Terkejut' },
  { id: 'think', label: 'Berpikir' },
];

export const CHARACTER_STORY_STEPS: CharacterStoryStep[] = [
  { pose: 'walk', caption: 'Mulai dari langkah kecil', facing: 1 },
  { pose: 'wave', caption: 'Sapa audiens dengan hangat', facing: 1 },
  { pose: 'think', caption: 'Pikirkan akar masalahnya', facing: 1 },
  { pose: 'point', caption: 'Tunjukkan satu solusi nyata', facing: 1 },
  { pose: 'cheer', caption: 'Rayakan progres tiap hari!', facing: 1 },
];

export interface TransitionCatalogItem {
  id: TransitionOption;
  engineId: string;
  name: string;
  description: string;
}

export const TRANSITION_CATALOG: TransitionCatalogItem[] = [
  {
    id: 'otomatis',
    engineId: 'auto',
    name: 'Otomatis',
    description: 'Biarkan sistem pilih transisi terbaik sesuai gaya adegan',
  },
  {
    id: 'geser_kiri',
    engineId: 'whip-left',
    name: 'Geser kiri',
    description: 'Whip-pan cepat menggeser adegan masuk dari kanan',
  },
  {
    id: 'geser_kanan',
    engineId: 'whip-right',
    name: 'Geser kanan',
    description: 'Whip-pan cepat menggeser adegan masuk dari kiri',
  },
  {
    id: 'geser_atas',
    engineId: 'whip-up',
    name: 'Geser atas',
    description: 'Adegan baru naik cepat dari bawah ke atas',
  },
  {
    id: 'geser_bawah',
    engineId: 'whip-down',
    name: 'Geser bawah',
    description: 'Adegan baru turun cepat dari atas ke bawah',
  },
  {
    id: 'zoom_tembus',
    engineId: 'zoom',
    name: 'Zoom tembus',
    description: 'Dolly zoom menerobos masuk ke adegan berikutnya',
  },
  {
    id: 'putar',
    engineId: 'spin',
    name: 'Putar',
    description: 'Berputar sambil zoom masuk ke adegan baru',
  },
  {
    id: 'lingkaran',
    engineId: 'iris',
    name: 'Lingkaran',
    description: 'Mask lingkaran membuka perlahan dari titik tengah',
  },
  {
    id: 'sapu_miring',
    engineId: 'wipe',
    name: 'Sapu miring',
    description: 'Garis miring diagonal menyapu ke adegan baru',
  },
  {
    id: 'sapuan_warna',
    engineId: 'swipe',
    name: 'Sapuan warna',
    description: 'Pita warna brand menyapu layar sebelum adegan muncul',
  },
  {
    id: 'glitch',
    engineId: 'glitch',
    name: 'Glitch',
    description: 'Efek distorsi digital RGB sesaat antar adegan',
  },
  {
    id: 'kilas_kamera',
    engineId: 'flash',
    name: 'Kilat kamera',
    description: 'Kilatan cahaya putih memisah antar adegan',
  },
  {
    id: 'tirai',
    engineId: 'blinds',
    name: 'Tirai',
    description: 'Garis-garis tirai membuka bergantian dari tengah',
  },
  {
    id: 'jatuh_membal',
    engineId: 'drop',
    name: 'Jatuh membal',
    description: 'Adegan baru turun cepat dari atas dengan pantulan membal',
  },
  {
    id: 'fade_lembut',
    engineId: 'fade',
    name: 'Memudar',
    description: 'Cross-dissolve halus memudar perlahan antar adegan',
  },
  {
    id: 'celuk_gelap',
    engineId: 'dip',
    name: 'Celup gelap',
    description: 'Redup ke gelap sebentar lalu terang ke babak berikutnya',
  },
  {
    id: 'blur_lembut',
    engineId: 'blur',
    name: 'Blur lembut',
    description: 'Kabur halus sesaat lalu tajam kembali ke adegan baru',
  },
  {
    id: 'menyambung',
    engineId: 'sambung',
    name: 'Menyambung',
    description: 'Garis / objek bersambung mengalir terus antar adegan',
  },
  {
    id: 'match_morph',
    engineId: 'match-morph',
    name: 'Match-Cut Morph',
    description: 'Transisi khas editor manusia: skala halus + cross-dissolve organik menyambung fokus objek',
  },
  {
    id: 'cinema_whip',
    engineId: 'cinema-whip',
    name: 'Cinema Whip Blur',
    description: 'Ayunan kamera sinematik dengan ekor motion-blur lembut tanpa patah',
  },
  {
    id: 'luma_dissolve',
    engineId: 'luma-dissolve',
    name: 'Luma Glow Dissolve',
    description: 'Peleburan cahaya hangat ala dokumenter editorial sebelum fokus terkunci',
  },
  {
    id: 'depth_focus',
    engineId: 'depth-focus',
    name: 'Depth Rack Focus',
    description: 'Perpindahan kedalaman lensa (rack-focus + dolly lembut) yang halus dan berkelas',
  },
  {
    id: 'editorial_split',
    engineId: 'editorial-split',
    name: 'Editorial Split',
    description: 'Bukaan bidang asimetris bersih ala studio motion graphics modern',
  },
];

export function getTransitionMeta(id?: string | null): TransitionCatalogItem {
  const clean = String(id || 'otomatis').trim();
  const alias = clean === 'menyusut' ? 'blur_lembut' : clean;
  return TRANSITION_CATALOG.find((t) => t.id === alias) || TRANSITION_CATALOG[0];
}

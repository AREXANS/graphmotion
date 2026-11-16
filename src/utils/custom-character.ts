import { CharacterEngineLook } from './character-catalog';

export type BuilderGender = 'cowok' | 'cewek';
export type BuilderViewMode = 'depan' | 'samping' | 'belakang' | 'gerak';
export type BuilderTabId =
  | 'foto_ai'
  | 'dasar'
  | 'rambut'
  | 'oneset'
  | 'baju'
  | 'bawahan'
  | 'sepatu'
  | 'aksesoris'
  | 'nama';

export type CharacterSpecies =
  | 'human'
  | 'fox'
  | 'cat'
  | 'wolf'
  | 'bunny'
  | 'bear'
  | 'panda'
  | 'owl'
  | 'robot'
  | 'alien'
  | 'elf';

export interface CustomCharacterConfig {
  id: string;
  name: string;
  gender: BuilderGender;
  species?: CharacterSpecies;
  furPrimaryColor?: string;
  furSecondaryColor?: string;
  earStyle?: string;
  muzzleStyle?: string;
  tailStyle?: string;
  skinColor: string;
  hairStyle: string;
  hairColor: string;
  oneSetId: string;
  oneSetColors: Record<string, string>;
  topStyle: string;
  topColor: string;
  innerTopColor: string;
  bottomStyle: string;
  bottomColor: string;
  shoeStyle: string;
  shoeColor: string;
  accessories: string[];
  accessoryColors: Record<string, string>;
  extraNote?: string;
  photoObservation?: string;
  referenceMediaUrl?: string;
  referenceMediaType?: 'image' | 'video';
  voicePresetId?: string;
  updatedAt: number;
}

export interface PresetOption {
  id: string;
  label: string;
  gender?: BuilderGender | 'all';
  isOpen?: boolean;
  isLong?: boolean;
  isSkirt?: boolean;
  hasInner?: boolean;
  colorSlots?: Array<{ key: string; label: string; defaultColor: string }>;
  defaultColors?: Record<string, string>;
}

export interface SkinTonePreset {
  id: string;
  label: string;
  hex: string;
}

export interface SpeciesPreset {
  id: CharacterSpecies;
  label: string;
  defaultPrimaryColor: string;
  defaultSecondaryColor: string;
  earStyle: string;
  muzzleStyle: string;
  tailStyle: string;
}

export const SPECIES_PRESETS: SpeciesPreset[] = [
  { id: 'human', label: 'Manusia', defaultPrimaryColor: '#efc39c', defaultSecondaryColor: '#f7d9c4', earStyle: 'none', muzzleStyle: 'none', tailStyle: 'none' },
  { id: 'fox', label: 'Humanoid Rubah', defaultPrimaryColor: '#0077ff', defaultSecondaryColor: '#fde047', earStyle: 'fox_pointed', muzzleStyle: 'none', tailStyle: 'fox_fluffy' },
  { id: 'cat', label: 'Humanoid Kucing', defaultPrimaryColor: '#f59e0b', defaultSecondaryColor: '#fef3c7', earStyle: 'cat_pointed', muzzleStyle: 'cat_muzzle', tailStyle: 'cat_sleek' },
  { id: 'wolf', label: 'Humanoid Serigala', defaultPrimaryColor: '#475569', defaultSecondaryColor: '#e2e8f0', earStyle: 'wolf_pointed', muzzleStyle: 'fox_snout', tailStyle: 'wolf_bushy' },
  { id: 'bunny', label: 'Humanoid Kelinci', defaultPrimaryColor: '#f8fafc', defaultSecondaryColor: '#fbcfe8', earStyle: 'bunny_long', muzzleStyle: 'cat_muzzle', tailStyle: 'bunny_puff' },
  { id: 'bear', label: 'Humanoid Beruang', defaultPrimaryColor: '#8a5a3c', defaultSecondaryColor: '#fde68a', earStyle: 'bear_round', muzzleStyle: 'bear_snout', tailStyle: 'bunny_puff' },
  { id: 'panda', label: 'Humanoid Panda', defaultPrimaryColor: '#f8fafc', defaultSecondaryColor: '#1e293b', earStyle: 'bear_round', muzzleStyle: 'bear_snout', tailStyle: 'bunny_puff' },
  { id: 'owl', label: 'Humanoid Burung Hantu', defaultPrimaryColor: '#7c2d12', defaultSecondaryColor: '#fed7aa', earStyle: 'fox_pointed', muzzleStyle: 'beak', tailStyle: 'none' },
  { id: 'robot', label: 'Humanoid Robot AI', defaultPrimaryColor: '#0284c7', defaultSecondaryColor: '#38bdf8', earStyle: 'robot_antenna', muzzleStyle: 'robot_visor', tailStyle: 'none' },
  { id: 'alien', label: 'Humanoid Alien', defaultPrimaryColor: '#10b981', defaultSecondaryColor: '#a7f3d0', earStyle: 'elf_pointed', muzzleStyle: 'none', tailStyle: 'none' },
  { id: 'elf', label: 'Humanoid Elf', defaultPrimaryColor: '#f7d9c4', defaultSecondaryColor: '#fde68a', earStyle: 'elf_pointed', muzzleStyle: 'none', tailStyle: 'none' },
];

export const SKIN_TONE_PRESETS: SkinTonePreset[] = [
  { id: 'putih', label: 'Putih porselen', hex: '#f7d9c4' },
  { id: 'kuning_langsat', label: 'Kuning langsat', hex: '#efc39c' },
  { id: 'sawo_terang', label: 'Sawo matang terang', hex: '#dba174' },
  { id: 'sawo_matang', label: 'Sawo matang', hex: '#b6784e' },
  { id: 'gelap', label: 'Cokelat gelap', hex: '#7a4b31' },
];

export const COLOR_PICKER_GRID: Array<{ hex: string; name: string }> = [
  { hex: '#ef4444', name: 'Merah' },
  { hex: '#06b6d4', name: 'Cyan' },
  { hex: '#2563eb', name: 'Biru' },
  { hex: '#16a34a', name: 'Hijau' },
  { hex: '#eab308', name: 'Kuning' },
  { hex: '#d946ef', name: 'Magenta' },
  { hex: '#1e293b', name: 'Hitam' },
  { hex: '#f8fafc', name: 'Putih' },
  { hex: '#fda4af', name: 'Merah muda' },
  { hex: '#a5b4fc', name: 'Periwinkle' },
  { hex: '#86efac', name: 'Mint lembut' },
  { hex: '#fde047', name: 'Kuning pastel' },
  { hex: '#f0abfc', name: 'Lavender' },
  { hex: '#94a3b8', name: 'Abu-abu' },
  { hex: '#8a5a3c', name: 'Cokelat kopi' },
  { hex: '#ff6a13', name: 'Oranye' },
];

export const HAIR_PRESETS: PresetOption[] = [
  { id: 'botak', label: 'Tanpa rambut' },
  { id: 'lurus_rapi', label: 'Lurus rapi' },
  { id: 'belah_tengah', label: 'Belah tengah' },
  { id: 'belah_samping', label: 'Belah samping' },
  { id: 'undercut', label: 'Undercut' },
  { id: 'buzz_cut', label: 'Buzz cut' },
  { id: 'mohawk', label: 'Mohawk' },
  { id: 'spiky', label: 'Spiky' },
  { id: 'jambul', label: 'Quiff / jambul' },
  { id: 'pompadour', label: 'Pompadour' },
  { id: 'keriting', label: 'Keriting' },
  { id: 'kribo', label: 'Afro / kribo' },
  { id: 'bob_pendek', label: 'Bob pendek' },
  { id: 'cepol', label: 'Cepol / bun' },
  { id: 'kuncir', label: 'Kuncir kuda' },
  { id: 'gondrong', label: 'Gondrong terurai' },
  { id: 'hijab_simpel', label: 'Hijab rapi' },
  { id: 'khimar', label: 'Khimar panjang' },
];

export const ONESET_PRESETS: PresetOption[] = [
  { id: 'none', label: 'Tanpa' },
  {
    id: 'seragam_sd',
    label: 'Seragam SD',
    colorSlots: [
      { key: 'primary', label: 'Kemeja', defaultColor: '#f8fafc' },
      { key: 'secondary', label: 'Celana/Rok', defaultColor: '#b91c1c' },
    ],
  },
  {
    id: 'seragam_smp',
    label: 'Seragam SMP',
    colorSlots: [
      { key: 'primary', label: 'Kemeja', defaultColor: '#f8fafc' },
      { key: 'secondary', label: 'Celana/Rok', defaultColor: '#1e3a8a' },
    ],
  },
  {
    id: 'seragam_sma',
    label: 'Seragam SMA',
    colorSlots: [
      { key: 'primary', label: 'Kemeja', defaultColor: '#f8fafc' },
      { key: 'secondary', label: 'Celana/Rok', defaultColor: '#64748b' },
    ],
  },
  {
    id: 'seragam_kerja',
    label: 'Seragam kerja',
    colorSlots: [
      { key: 'primary', label: 'Seragam', defaultColor: '#0f172a' },
      { key: 'secondary', label: 'Celana', defaultColor: '#334155' },
    ],
  },
  {
    id: 'baju_rumah',
    label: 'Baju santai rumah',
    colorSlots: [
      { key: 'primary', label: 'Kaos', defaultColor: '#60a5fa' },
      { key: 'secondary', label: 'Celana', defaultColor: '#1e293b' },
    ],
  },
  {
    id: 'piyama',
    label: 'Piyama tidur',
    colorSlots: [
      { key: 'primary', label: 'Atasan piyama', defaultColor: '#a5b4fc' },
      { key: 'secondary', label: 'Celana piyama', defaultColor: '#818cf8' },
    ],
  },
  {
    id: 'seragam_pabrik',
    label: 'Seragam pabrik',
    colorSlots: [
      { key: 'primary', label: 'Wearpack', defaultColor: '#1d4ed8' },
      { key: 'secondary', label: 'Strip aksen', defaultColor: '#facc15' },
    ],
  },
  {
    id: 'muslim_koko',
    label: 'Baju koko muslim',
    colorSlots: [
      { key: 'primary', label: 'Baju koko', defaultColor: '#f8fafc' },
      { key: 'secondary', label: 'Celana/Sarung', defaultColor: '#1f2937' },
    ],
  },
  {
    id: 'gamis_syari',
    label: 'Gamis syar\'i',
    colorSlots: [
      { key: 'primary', label: 'Gamis', defaultColor: '#6d28d9' },
      { key: 'secondary', label: 'Khimar', defaultColor: '#c4b5fd' },
    ],
  },
  {
    id: 'batik',
    label: 'Batik resmi',
    colorSlots: [
      { key: 'primary', label: 'Kain batik', defaultColor: '#78350f' },
      { key: 'secondary', label: 'Celana/Rok', defaultColor: '#1e293b' },
    ],
  },
  {
    id: 'pramuka',
    label: 'Seragam pramuka',
    colorSlots: [
      { key: 'primary', label: 'Atasan', defaultColor: '#c29b61' },
      { key: 'secondary', label: 'Celana', defaultColor: '#5c3d1e' },
    ],
  },
  {
    id: 'perawat_scrub',
    label: 'Perawat (scrub)',
    colorSlots: [
      { key: 'primary', label: 'Scrub', defaultColor: '#0d9488' },
      { key: 'secondary', label: 'Celana scrub', defaultColor: '#115e59' },
    ],
  },
  {
    id: 'jas_dokter',
    label: 'Jas dokter',
    colorSlots: [
      { key: 'primary', label: 'Jas lab', defaultColor: '#f8fafc' },
      { key: 'secondary', label: 'Kemeja dalam', defaultColor: '#0284c7' },
    ],
  },
  {
    id: 'toga_hakim',
    label: 'Toga hakim / advokat',
    colorSlots: [
      { key: 'primary', label: 'Toga', defaultColor: '#111827' },
      { key: 'secondary', label: 'Bef putih/merah', defaultColor: '#f8fafc' },
    ],
  },
  {
    id: 'pemain_bola',
    label: 'Pemain bola',
    colorSlots: [
      { key: 'primary', label: 'Jersey atas & kaki', defaultColor: '#dc2626' },
      { key: 'secondary', label: 'Celana pendek', defaultColor: '#f8fafc' },
    ],
  },
  {
    id: 'chef',
    label: 'Chef dapur',
    colorSlots: [
      { key: 'primary', label: 'Baju chef', defaultColor: '#f8fafc' },
      { key: 'secondary', label: 'Celana', defaultColor: '#1e293b' },
    ],
  },
  {
    id: 'jas_formal',
    label: 'Jas formal kantor',
    colorSlots: [
      { key: 'primary', label: 'Jas', defaultColor: '#1e3a8a' },
      { key: 'secondary', label: 'Kemeja', defaultColor: '#f8fafc' },
    ],
  },
  {
    id: 'wisuda',
    label: 'Toga wisuda',
    colorSlots: [
      { key: 'primary', label: 'Jubah toga', defaultColor: '#0f172a' },
      { key: 'secondary', label: 'Selempang kerah', defaultColor: '#eab308' },
    ],
  },
];

export const TOP_PRESETS: PresetOption[] = [
  { id: 'kaos', label: 'Kaos polos', hasInner: false },
  { id: 'kaos_garis', label: 'Kaos garis', hasInner: false },
  { id: 'polo', label: 'Kaos polo', hasInner: false },
  { id: 'kemeja', label: 'Kemeja rapi', hasInner: false },
  { id: 'koko', label: 'Baju koko', hasInner: false },
  { id: 'sweater', label: 'Sweater hangat', hasInner: false },
  { id: 'hoodie', label: 'Hoodie tertutup', hasInner: false },
  { id: 'jaket_tertutup', label: 'Jaket tertutup', hasInner: false },
  { id: 'jaket_terbuka', label: 'Jaket terbuka', isOpen: true, hasInner: true },
  { id: 'jaket_denim', label: 'Jaket denim buka', isOpen: true, hasInner: true },
  { id: 'blazer', label: 'Blazer terbuka', isOpen: true, hasInner: true },
  { id: 'rompi', label: 'Rompi luar', isOpen: true, hasInner: true },
  { id: 'jas_panjang', label: 'Mantel panjang', isOpen: true, isLong: true, hasInner: true },
];

export const BOTTOM_PRESETS: PresetOption[] = [
  { id: 'celana_panjang', label: 'Celana panjang' },
  { id: 'jeans', label: 'Celana jeans' },
  { id: 'chino', label: 'Celana chino' },
  { id: 'celana_pendek', label: 'Celana pendek' },
  { id: 'training', label: 'Celana training' },
  { id: 'rok_panjang', label: 'Rok panjang', isSkirt: true },
  { id: 'rok_pendek', label: 'Rok pendek', isSkirt: true },
  { id: 'sarung', label: 'Sarung rapi', isSkirt: true },
];

export const SHOE_PRESETS: PresetOption[] = [
  { id: 'sneakers', label: 'Sneakers' },
  { id: 'pantofel', label: 'Pantofel' },
  { id: 'boots', label: 'Boots' },
  { id: 'sandal', label: 'Sandal' },
  { id: 'flat', label: 'Flat shoes' },
  { id: 'sport', label: 'Sepatu olahraga' },
  { id: 'tanpa', label: 'Tanpa sepatu' },
];

export interface AccessoryPreset {
  id: string;
  label: string;
  defaultColor: string;
  colorLabel: string;
  category: 'eyewear' | 'headwear' | 'bag' | 'face' | 'prop' | 'neck';
}

export const ACCESSORY_PRESETS: AccessoryPreset[] = [
  { id: 'kacamata_bulat', label: 'Kacamata bulat', defaultColor: '#1e293b', colorLabel: 'Bingkai', category: 'eyewear' },
  { id: 'kacamata_kotak', label: 'Kacamata kotak', defaultColor: '#0f172a', colorLabel: 'Bingkai', category: 'eyewear' },
  { id: 'kacamata_hitam', label: 'Kacamata hitam', defaultColor: '#111827', colorLabel: 'Lensa hitam', category: 'eyewear' },
  { id: 'ransel', label: 'Ransel', defaultColor: '#8a5a3c', colorLabel: 'Tas', category: 'bag' },
  { id: 'tas_kerja', label: 'Tas kerja', defaultColor: '#78350f', colorLabel: 'Tas', category: 'bag' },
  { id: 'tas_selempang', label: 'Tas selempang', defaultColor: '#334155', colorLabel: 'Tas', category: 'bag' },
  { id: 'peci', label: 'Peci', defaultColor: '#1e293b', colorLabel: 'Peci', category: 'headwear' },
  { id: 'topi_pet', label: 'Topi pet / baseball', defaultColor: '#1d4ed8', colorLabel: 'Topi', category: 'headwear' },
  { id: 'topi_rimba', label: 'Topi rimba / bucket', defaultColor: '#3f6212', colorLabel: 'Topi', category: 'headwear' },
  { id: 'kupluk', label: 'Topi kupluk', defaultColor: '#dc2626', colorLabel: 'Kupluk', category: 'headwear' },
  { id: 'caping', label: 'Caping petani', defaultColor: '#d4a373', colorLabel: 'Caping', category: 'headwear' },
  { id: 'helm_proyek', label: 'Helm proyek', defaultColor: '#facc15', colorLabel: 'Helm', category: 'headwear' },
  { id: 'topi_chef', label: 'Topi chef', defaultColor: '#f8fafc', colorLabel: 'Topi chef', category: 'headwear' },
  { id: 'toga_cap', label: 'Topi wisuda', defaultColor: '#0f172a', colorLabel: 'Toga', category: 'headwear' },
  { id: 'mahkota', label: 'Mahkota', defaultColor: '#facc15', colorLabel: 'Mahkota', category: 'headwear' },
  { id: 'tongkat', label: 'Tongkat berdiri', defaultColor: '#8a5a3c', colorLabel: 'Tongkat', category: 'prop' },
  { id: 'kumis', label: 'Kumis', defaultColor: '#231f20', colorLabel: 'Kumis', category: 'face' },
  { id: 'jenggot', label: 'Jenggot rapi', defaultColor: '#231f20', colorLabel: 'Jenggot', category: 'face' },
  { id: 'headphone', label: 'Headphone', defaultColor: '#2563eb', colorLabel: 'Headphone', category: 'headwear' },
  { id: 'dasi', label: 'Dasi kantor', defaultColor: '#dc2626', colorLabel: 'Dasi', category: 'neck' },
  { id: 'dasi_kupu', label: 'Dasi kupu-kupu', defaultColor: '#7c3aed', colorLabel: 'Dasi kupu', category: 'neck' },
  { id: 'syal', label: 'Syal leher', defaultColor: '#ef4444', colorLabel: 'Syal', category: 'neck' },
  { id: 'celemek', label: 'Celemek', defaultColor: '#f8fafc', colorLabel: 'Celemek', category: 'prop' },
  { id: 'stetoskop', label: 'Stetoskop', defaultColor: '#334155', colorLabel: 'Stetoskop', category: 'neck' },
];

export const BUILDER_VIEW_POSES: Array<{ pose: string; label: string }> = [
  { pose: 'stand', label: 'Di video: berdiri' },
  { pose: 'wave', label: 'Di video: melambai' },
  { pose: 'walk', label: 'Di video: berjalan' },
  { pose: 'point', label: 'Di video: menunjuk' },
  { pose: 'think', label: 'Di video: berpikir' },
  { pose: 'cheer', label: 'Di video: bersorak' },
  { pose: 'dance', label: 'Di video: menari' },
];

export const CUSTOM_CHARACTERS_STORAGE_KEY = 'satset_custom_characters_v1';

export function createDefaultCustomCharacter(overrides?: Partial<CustomCharacterConfig>): CustomCharacterConfig {
  return {
    id: `custom_${Date.now().toString(36)}`,
    name: 'Karakter Kustomku',
    gender: 'cowok',
    species: 'human',
    furPrimaryColor: undefined,
    furSecondaryColor: undefined,
    earStyle: 'none',
    muzzleStyle: 'none',
    tailStyle: 'none',
    skinColor: '#efc39c',
    hairStyle: 'lurus_rapi',
    hairColor: '#2b2220',
    oneSetId: 'none',
    oneSetColors: { primary: '#f8fafc', secondary: '#1e3a8a' },
    topStyle: 'kaos',
    topColor: '#2c8c84',
    innerTopColor: '#f8fafc',
    bottomStyle: 'celana_panjang',
    bottomColor: '#1e3a8a',
    shoeStyle: 'sneakers',
    shoeColor: '#1e293b',
    accessories: [],
    accessoryColors: {},
    ...overrides,
    updatedAt: Date.now(),
  };
}

export function getSkinToneLabel(hex: string): string {
  const found = SKIN_TONE_PRESETS.find((s) => s.hex.toLowerCase() === (hex || '').toLowerCase());
  if (found) return found.label;
  const colorMatch = COLOR_PICKER_GRID.find((c) => c.hex.toLowerCase() === (hex || '').toLowerCase());
  return colorMatch ? colorMatch.name : hex || 'Kuning langsat';
}

export function buildCharacterTraitsSummary(cfg: CustomCharacterConfig): string {
  const parts: string[] = [];
  const sp = SPECIES_PRESETS.find((s) => s.id === (cfg.species || 'human'));
  if (sp && sp.id !== 'human') {
    parts.push(sp.label);
    parts.push(`warna ${getSkinToneLabel(cfg.furPrimaryColor || cfg.skinColor).toLowerCase()}`);
  } else {
    parts.push(cfg.gender === 'cewek' ? 'Cewek' : 'Cowok');
    parts.push(`kulit ${getSkinToneLabel(cfg.skinColor).toLowerCase()}`);
  }

  const hair = HAIR_PRESETS.find((h) => h.id === cfg.hairStyle);
  if (hair && (!sp || sp.id === 'human' || cfg.hairStyle !== 'botak')) {
    parts.push(`rambut ${hair.label.toLowerCase()}`);
  }

  const oneSet = ONESET_PRESETS.find((o) => o.id === cfg.oneSetId);
  if (oneSet && oneSet.id !== 'none') {
    parts.push(oneSet.label.toLowerCase());
  } else {
    const top = TOP_PRESETS.find((t) => t.id === cfg.topStyle);
    const bot = BOTTOM_PRESETS.find((b) => b.id === cfg.bottomStyle);
    if (top) parts.push(top.label.toLowerCase());
    if (bot) parts.push(bot.label.toLowerCase());
  }

  const shoe = SHOE_PRESETS.find((s) => s.id === cfg.shoeStyle);
  if (shoe && shoe.id !== 'tanpa') {
    parts.push(`sepatu ${shoe.label.toLowerCase()}`);
  }

  if (cfg.accessories.length > 0) {
    const accLabels = cfg.accessories
      .map((id) => ACCESSORY_PRESETS.find((a) => a.id === id)?.label.toLowerCase())
      .filter(Boolean);
    if (accLabels.length > 0) {
      parts.push(accLabels.join(', '));
    }
  }

  if (cfg.extraNote && cfg.extraNote.trim()) {
    parts.push(cfg.extraNote.trim());
  }

  return parts.join(', ');
}

/**
 * Maps any CustomCharacterConfig to Satset cloud engine `look` + extended overlay metadata
 * so it renders natively inside Ot() across Front, Side, Back, and Motion animations.
 */
export function customCharacterToEngineLook(
  cfg: CustomCharacterConfig,
  viewMode: BuilderViewMode = 'depan'
): {
  gender: 'male' | 'female';
  look: CharacterEngineLook & Record<string, any>;
} {
  const isFemale = cfg.gender === 'cewek';

  // Map hair style to base Ot hair primitive
  let baseHair: string = 'short';
  let hijabColor: string | undefined;
  let khimar = false;

  if (cfg.hairStyle === 'botak') baseHair = 'none';
  else if (cfg.hairStyle === 'jambul' || cfg.hairStyle === 'pompadour' || cfg.hairStyle === 'spiky') baseHair = 'quiff';
  else if (cfg.hairStyle === 'keriting' || cfg.hairStyle === 'kribo') baseHair = 'curly';
  else if (cfg.hairStyle === 'cepol') baseHair = 'bun';
  else if (cfg.hairStyle === 'gondrong' || cfg.hairStyle === 'kuncir' || cfg.hairStyle === 'bob_pendek') baseHair = 'long';
  else if (cfg.hairStyle === 'hijab_simpel') {
    hijabColor = cfg.hairColor || '#ee93a6';
  } else if (cfg.hairStyle === 'khimar') {
    hijabColor = cfg.hairColor || '#1f1d22';
    khimar = true;
  }

  // Outfit resolution: One-set overrides separate Top + Bottom when active
  const primaryOne = cfg.oneSetColors?.primary;
  const secondaryOne = cfg.oneSetColors?.secondary;

  let shirt: string | undefined = cfg.topColor || '#2c8c84';
  let jacket: string | undefined;
  let jacketOpen = false;
  let jacketLong = false;
  let koko = cfg.topStyle === 'koko';
  let pants: string | undefined = cfg.bottomColor || '#1e3a8a';
  let dress: string | boolean | undefined;

  if (cfg.oneSetId && cfg.oneSetId !== 'none') {
    switch (cfg.oneSetId) {
      case 'seragam_sd':
      case 'seragam_smp':
      case 'seragam_sma':
      case 'pramuka':
      case 'batik':
      case 'piyama':
      case 'baju_rumah':
      case 'pemain_bola':
      case 'perawat_scrub':
      case 'seragam_kerja':
        shirt = primaryOne || shirt;
        pants = secondaryOne || pants;
        break;
      case 'seragam_pabrik':
        jacket = primaryOne || '#1d4ed8';
        shirt = secondaryOne || '#facc15';
        pants = primaryOne || '#1d4ed8';
        break;
      case 'muslim_koko':
        koko = true;
        shirt = primaryOne || '#f8fafc';
        pants = secondaryOne || '#1f2937';
        break;
      case 'gamis_syari':
        shirt = primaryOne || '#6d28d9';
        dress = primaryOne || '#6d28d9';
        hijabColor = secondaryOne || hijabColor || '#c4b5fd';
        khimar = true;
        break;
      case 'jas_dokter':
        jacket = primaryOne || '#f8fafc';
        jacketOpen = true;
        shirt = secondaryOne || '#0284c7';
        pants = '#1e293b';
        break;
      case 'jas_formal':
        jacket = primaryOne || '#1e3a8a';
        jacketOpen = true;
        shirt = secondaryOne || '#f8fafc';
        pants = primaryOne || '#1e3a8a';
        break;
      case 'toga_hakim':
      case 'wisuda':
        jacket = primaryOne || '#111827';
        jacketLong = true;
        dress = primaryOne || '#111827';
        shirt = secondaryOne || '#f8fafc';
        break;
      case 'chef':
        shirt = primaryOne || '#f8fafc';
        pants = secondaryOne || '#1e293b';
        break;
      default:
        shirt = primaryOne || shirt;
        pants = secondaryOne || pants;
    }
  } else {
    const topPreset = TOP_PRESETS.find((t) => t.id === cfg.topStyle);
    if (topPreset?.isOpen) {
      jacket = cfg.topColor || '#1e293b';
      jacketOpen = true;
      shirt = cfg.innerTopColor || '#f8fafc';
      jacketLong = Boolean(topPreset.isLong);
    } else if (cfg.topStyle === 'jaket_tertutup' || cfg.topStyle === 'hoodie') {
      jacket = cfg.topColor || '#1e293b';
      jacketOpen = false;
    }

    const botPreset = BOTTOM_PRESETS.find((b) => b.id === cfg.bottomStyle);
    if (botPreset?.isSkirt) {
      dress = cfg.bottomColor || '#8f6bd6';
    }
  }

  // Footwear
  const shoes =
    cfg.shoeStyle === 'tanpa'
      ? cfg.skinColor || '#efc39c'
      : cfg.shoeColor || '#1e293b';

  // Core accessories supported natively inside Ot()
  const hasAcc = (id: string) => cfg.accessories.includes(id);
  const accColor = (id: string, fallback: string) => cfg.accessoryColors?.[id] || fallback;

  const peci = hasAcc('peci') ? accColor('peci', '#1e293b') : undefined;
  const cap = hasAcc('topi_pet') ? accColor('topi_pet', '#1d4ed8') : undefined;
  const glasses =
    hasAcc('kacamata_bulat')
      ? accColor('kacamata_bulat', '#1e293b')
      : hasAcc('kacamata_kotak')
      ? accColor('kacamata_kotak', '#0f172a')
      : undefined;
  const tie = hasAcc('dasi') ? accColor('dasi', '#dc2626') : undefined;
  const apron =
    hasAcc('celemek')
      ? accColor('celemek', '#f8fafc')
      : cfg.oneSetId === 'chef'
      ? '#f8fafc'
      : undefined;

  const look: CharacterEngineLook & Record<string, any> = {
    build: isFemale ? 'female' : 'male',
    skin: cfg.skinColor || '#efc39c',
    hair: hijabColor ? undefined : baseHair,
    hairColor: cfg.hairColor || '#2b2220',
    hijab: hijabColor,
    khimar: khimar || undefined,
    shirt,
    jacket,
    jacketOpen,
    jacketLong,
    koko: koko || undefined,
    pants,
    dress,
    shoes,
    peci,
    cap,
    glasses,
    tie,
    apron,
    species: cfg.species || 'human',
    furSecondaryColor: cfg.furSecondaryColor,
    accentColor: cfg.topColor || '#38bdf8',
    __is3DStudioCreator: true,
    __has3DHeadphone: hasAcc('headphone'),
    turn: viewMode === 'samping' ? 1 : undefined,
    view: viewMode === 'belakang' ? 'back' : undefined,
    // Keep rich config attached for custom overlay vector renderer
    __customChar: cfg,
  };

  return {
    gender: isFemale ? 'female' : 'male',
    look,
  };
}

/**
 * Validates and clamps any Gemini photo analysis JSON into valid CustomCharacterConfig presets.
 */
export function normalizeAiPhotoCharacterResponse(
  raw: Record<string, any>,
  base?: CustomCharacterConfig
): CustomCharacterConfig {
  const validHex = (val: unknown, fallback: string): string => {
    if (typeof val === 'string' && /^#[0-9a-fA-F]{6}$/.test(val.trim())) {
      return val.trim();
    }
    return fallback;
  };

  const pickValidId = (val: unknown, list: Array<{ id: string }>, fallback: string): string => {
    if (typeof val === 'string') {
      const clean = val.trim();
      if (list.some((x) => x.id === clean)) return clean;
    }
    return fallback;
  };

  const gender: BuilderGender =
    raw.gender === 'cewek' || raw.gender === 'female' ? 'cewek' : 'cowok';

  const hairStyle = pickValidId(
    raw.hairStyle,
    HAIR_PRESETS,
    gender === 'cewek' ? 'gondrong' : 'lurus_rapi'
  );
  const oneSetId = pickValidId(raw.oneSetId, ONESET_PRESETS, 'none');
  const topStyle = pickValidId(raw.topStyle, TOP_PRESETS, 'kaos');
  const bottomStyle = pickValidId(
    raw.bottomStyle,
    BOTTOM_PRESETS,
    gender === 'cewek' ? 'celana_panjang' : 'celana_panjang'
  );
  const shoeStyle = pickValidId(raw.shoeStyle, SHOE_PRESETS, 'sneakers');

  const rawAccessories = Array.isArray(raw.accessories) ? raw.accessories : [];
  const validAccessories: string[] = [];
  for (const a of rawAccessories) {
    if (
      typeof a === 'string' &&
      ACCESSORY_PRESETS.some((p) => p.id === a) &&
      !validAccessories.includes(a)
    ) {
      validAccessories.push(a);
    }
  }

  const accColors: Record<string, string> = {};
  if (raw.accessoryColors && typeof raw.accessoryColors === 'object') {
    for (const accId of validAccessories) {
      const preset = ACCESSORY_PRESETS.find((p) => p.id === accId);
      accColors[accId] = validHex(raw.accessoryColors[accId], preset?.defaultColor || '#1e293b');
    }
  }

  const onePreset = ONESET_PRESETS.find((o) => o.id === oneSetId);
  const oneSetColors: Record<string, string> = {};
  if (onePreset?.colorSlots) {
    for (const slot of onePreset.colorSlots) {
      oneSetColors[slot.key] = validHex(
        raw.oneSetColors?.[slot.key],
        slot.defaultColor
      );
    }
  } else {
    oneSetColors.primary = validHex(raw.topColor, '#f8fafc');
    oneSetColors.secondary = validHex(raw.bottomColor, '#1e3a8a');
  }

  const next = createDefaultCustomCharacter({
    ...(base || {}),
    id: base?.id || `custom_${Date.now().toString(36)}`,
    name:
      typeof raw.suggestedName === 'string' && raw.suggestedName.trim()
        ? raw.suggestedName.trim().slice(0, 32)
        : base?.name || 'Karakter Foto AI',
    gender,
    skinColor: validHex(raw.skinColor, '#efc39c'),
    hairStyle,
    hairColor: validHex(raw.hairColor, '#2b2220'),
    oneSetId,
    oneSetColors,
    topStyle,
    topColor: validHex(raw.topColor, '#2c8c84'),
    innerTopColor: validHex(raw.innerTopColor, '#f8fafc'),
    bottomStyle,
    bottomColor: validHex(raw.bottomColor, '#1e3a8a'),
    shoeStyle,
    shoeColor: validHex(raw.shoeColor, '#1e293b'),
    accessories: validAccessories,
    accessoryColors: accColors,
    photoObservation:
      typeof raw.photoObservation === 'string' ? raw.photoObservation.trim() : undefined,
  });

  return next;
}

export function getStoredCustomCharacters(): CustomCharacterConfig[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_CHARACTERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomCharacter(cfg: CustomCharacterConfig): CustomCharacterConfig[] {
  const existing = getStoredCustomCharacters();
  const nextItem: CustomCharacterConfig = { ...cfg, updatedAt: Date.now() };
  const idx = existing.findIndex((c) => c.id === nextItem.id);
  const updated =
    idx >= 0
      ? existing.map((c, i) => (i === idx ? nextItem : c))
      : [nextItem, ...existing];
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CUSTOM_CHARACTERS_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {
    // ignore quota error
  }
  return updated;
}

export function deleteCustomCharacter(id: string): CustomCharacterConfig[] {
  const updated = getStoredCustomCharacters().filter((c) => c.id !== id);
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CUSTOM_CHARACTERS_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {
    // ignore quota error
  }
  return updated;
}

export function getCustomCharacterById(id?: string | null): CustomCharacterConfig | undefined {
  if (!id) return undefined;
  const clean = String(id).trim();
  if (!clean.startsWith('custom_')) return undefined;
  return getStoredCustomCharacters().find((c) => c.id === clean);
}

export interface ExtractedReferenceMedia {
  base64: string;
  mimeType: string;
  previewUrl: string;
  mediaType: 'image' | 'video';
  dominantPalette: {
    topRegionHex: string;
    faceRegionHex: string;
    torsoRegionHex: string;
    lowerRegionHex: string;
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

function sampleRegionAverageHex(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fallback: string
): string {
  try {
    const sx = Math.max(0, Math.floor(x));
    const sy = Math.max(0, Math.floor(y));
    const sw = Math.max(1, Math.floor(w));
    const sh = Math.max(1, Math.floor(h));
    const data = ctx.getImageData(sx, sy, sw, sh).data;
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 16) {
      const alpha = data[i + 3];
      if (alpha < 120) continue;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
    if (!count) return fallback;
    return rgbToHex(r / count, g / count, b / count);
  } catch {
    return fallback;
  }
}

/**
 * Extracts a representative JPEG frame and dominant color palette from either an Image or Video file.
 */
export async function extractFrameAndPaletteFromMediaFile(
  file: File,
  maxDim = 768
): Promise<ExtractedReferenceMedia> {
  const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name);

  if (isVideo && typeof document !== 'undefined') {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';

      let settled = false;
      const finishFrame = () => {
        if (settled) return;
        settled = true;
        try {
          const vw = video.videoWidth || 480;
          const vh = video.videoHeight || 640;
          const scale = Math.min(1, maxDim / Math.max(vw, vh));
          const w = Math.max(64, Math.round(vw * scale));
          const h = Math.max(64, Math.round(vh * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Canvas context tidak tersedia'));
            return;
          }
          ctx.drawImage(video, 0, 0, w, h);
          const dominantPalette = {
            topRegionHex: sampleRegionAverageHex(ctx, w * 0.35, h * 0.08, w * 0.3, h * 0.14, '#2b2220'),
            faceRegionHex: sampleRegionAverageHex(ctx, w * 0.36, h * 0.2, w * 0.28, h * 0.16, '#efc39c'),
            torsoRegionHex: sampleRegionAverageHex(ctx, w * 0.28, h * 0.42, w * 0.44, h * 0.26, '#2c8c84'),
            lowerRegionHex: sampleRegionAverageHex(ctx, w * 0.3, h * 0.72, w * 0.4, h * 0.2, '#1e3a8a'),
          };
          const outUrl = canvas.toDataURL('image/jpeg', 0.86);
          const base64 = outUrl.split(',')[1] || '';
          URL.revokeObjectURL(objectUrl);
          resolve({
            base64,
            mimeType: 'image/jpeg',
            previewUrl: outUrl,
            mediaType: 'video',
            dominantPalette,
          });
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          reject(err);
        }
      };

      video.onloadeddata = () => {
        const targetTime = Math.min(0.5, Math.max(0.05, (video.duration || 1) * 0.2));
        try {
          video.currentTime = targetTime;
        } catch {
          finishFrame();
        }
      };
      video.onseeked = finishFrame;
      video.onerror = () => {
        if (!settled) {
          settled = true;
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Gagal membaca file video referensi'));
        }
      };
      setTimeout(() => {
        if (!settled && video.readyState >= 2) {
          finishFrame();
        }
      }, 1400);
      video.src = objectUrl;
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
        const w = Math.max(64, Math.round((img.width || 320) * scale));
        const h = Math.max(64, Math.round((img.height || 320) * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context tidak tersedia'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const dominantPalette = {
          topRegionHex: sampleRegionAverageHex(ctx, w * 0.35, h * 0.08, w * 0.3, h * 0.14, '#2b2220'),
          faceRegionHex: sampleRegionAverageHex(ctx, w * 0.36, h * 0.2, w * 0.28, h * 0.16, '#efc39c'),
          torsoRegionHex: sampleRegionAverageHex(ctx, w * 0.28, h * 0.42, w * 0.44, h * 0.26, '#2c8c84'),
          lowerRegionHex: sampleRegionAverageHex(ctx, w * 0.3, h * 0.72, w * 0.4, h * 0.2, '#1e3a8a'),
        };
        const outUrl = canvas.toDataURL('image/jpeg', 0.86);
        const base64 = outUrl.split(',')[1] || '';
        resolve({
          base64,
          mimeType: 'image/jpeg',
          previewUrl: outUrl,
          mediaType: 'image',
          dominantPalette,
        });
      };
      img.onerror = () => reject(new Error('Gagal memuat gambar referensi'));
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.readAsDataURL(file);
  });
}

/**
 * Parses natural-language Indonesian/English design prompts into CustomCharacterConfig updates.
 */
export function applyCharacterDesignPrompt(
  promptText: string,
  base?: CustomCharacterConfig
): CustomCharacterConfig {
  const next = createDefaultCustomCharacter(base);
  const rawPrompt = String(promptText || '').trim();
  const q = rawPrompt.toLowerCase();
  if (!q) return next;

  if (/(cewek|wanita|perempuan|ibu|mbak|gadis|hijab|jilbab|kerudung|gamis|kebaya)/.test(q)) {
    next.gender = 'cewek';
  } else if (/(cowok|pria|laki|bapak|mas|koko|peci|jenggot|kumis)/.test(q)) {
    next.gender = 'cowok';
  }

  const colorRules: Array<[RegExp, string, string, string]> = [
    [/\bbiru muda|cyan|langit|sky\b/, '#06b6d4', '#cffafe', 'Biru Muda'],
    [/\bbiru|blue|navy|dongker|indigo\b/, '#2563eb', '#e0f2fe', 'Biru'],
    [/\bmerah|red|crimson\b/, '#ef4444', '#fee2e2', 'Merah'],
    [/\boranye|jingga|orange|amber|emas\b/, '#ea580c', '#ffedd5', 'Oranye'],
    [/\bhijau|emerald|mint|green\b/, '#10b981', '#d1fae5', 'Hijau'],
    [/\bkuning|yellow|gold\b/, '#eab308', '#fef9c3', 'Kuning'],
    [/\bungu|purple|violet|magenta|lavender\b/, '#7c3aed', '#ede9fe', 'Ungu'],
    [/\bpink|merah muda|rose\b/, '#ec4899', '#fce7f3', 'Pink'],
    [/\bputih|white|salju|perak|silver\b/, '#f8fafc', '#e2e8f0', 'Putih'],
    [/\babu|grey|gray\b/, '#64748b', '#f1f5f9', 'Abu'],
    [/\bcokelat|kopi|brown\b/, '#8a5a3c', '#fde68a', 'Cokelat'],
    [/\bhitam|gelap|black|dark\b/, '#1e293b', '#cbd5e1', 'Hitam'],
  ];

  // 1. Detect Humanoid / Animal / Fantasy Species
  const speciesRules: Array<{
    regex: RegExp;
    species: CharacterSpecies;
    label: string;
    defaultPrimary: string;
    defaultSecondary: string;
    earStyle: string;
    muzzleStyle: string;
    tailStyle: string;
  }> = [
    {
      regex: /\b(rubah|fox|kitsune|serigala merah)\b/,
      species: 'fox',
      label: 'Humanoid Rubah',
      defaultPrimary: '#ea580c',
      defaultSecondary: '#ffedd5',
      earStyle: 'fox_pointed',
      muzzleStyle: 'fox_snout',
      tailStyle: 'fox_fluffy',
    },
    {
      regex: /\b(kucing|cat|neko|meong|harimau|macan)\b/,
      species: 'cat',
      label: 'Humanoid Kucing',
      defaultPrimary: '#f59e0b',
      defaultSecondary: '#fef3c7',
      earStyle: 'cat_pointed',
      muzzleStyle: 'cat_muzzle',
      tailStyle: 'cat_sleek',
    },
    {
      regex: /\b(serigala|wolf|anjing|husky|dog)\b/,
      species: 'wolf',
      label: 'Humanoid Serigala',
      defaultPrimary: '#475569',
      defaultSecondary: '#e2e8f0',
      earStyle: 'wolf_pointed',
      muzzleStyle: 'fox_snout',
      tailStyle: 'wolf_bushy',
    },
    {
      regex: /\b(kelinci|bunny|rabbit|hare)\b/,
      species: 'bunny',
      label: 'Humanoid Kelinci',
      defaultPrimary: '#f8fafc',
      defaultSecondary: '#fbcfe8',
      earStyle: 'bunny_long',
      muzzleStyle: 'cat_muzzle',
      tailStyle: 'bunny_puff',
    },
    {
      regex: /\b(panda)\b/,
      species: 'panda',
      label: 'Humanoid Panda',
      defaultPrimary: '#f8fafc',
      defaultSecondary: '#1e293b',
      earStyle: 'bear_round',
      muzzleStyle: 'bear_snout',
      tailStyle: 'bunny_puff',
    },
    {
      regex: /\b(beruang|bear|teddy)\b/,
      species: 'bear',
      label: 'Humanoid Beruang',
      defaultPrimary: '#8a5a3c',
      defaultSecondary: '#fde68a',
      earStyle: 'bear_round',
      muzzleStyle: 'bear_snout',
      tailStyle: 'bunny_puff',
    },
    {
      regex: /\b(burung hantu|owl|elang|burung|bird)\b/,
      species: 'owl',
      label: 'Humanoid Burung Hantu',
      defaultPrimary: '#7c2d12',
      defaultSecondary: '#fed7aa',
      earStyle: 'fox_pointed',
      muzzleStyle: 'beak',
      tailStyle: 'none',
    },
    {
      regex: /\b(robot|cyborg|android|mecha|bot)\b/,
      species: 'robot',
      label: 'Humanoid Robot',
      defaultPrimary: '#0284c7',
      defaultSecondary: '#e0f2fe',
      earStyle: 'robot_antenna',
      muzzleStyle: 'robot_visor',
      tailStyle: 'none',
    },
    {
      regex: /\b(alien|martian|et)\b/,
      species: 'alien',
      label: 'Humanoid Alien',
      defaultPrimary: '#10b981',
      defaultSecondary: '#d1fae5',
      earStyle: 'elf_pointed',
      muzzleStyle: 'none',
      tailStyle: 'none',
    },
    {
      regex: /\b(elf|peri|fairy)\b/,
      species: 'elf',
      label: 'Humanoid Elf',
      defaultPrimary: '#f7d9c4',
      defaultSecondary: '#fef3c7',
      earStyle: 'elf_pointed',
      muzzleStyle: 'none',
      tailStyle: 'none',
    },
  ];

  let matchedSpecies = speciesRules.find((r) => r.regex.test(q));
  if (!matchedSpecies && /\bhumanoid\b/.test(q)) {
    // Generic humanoid defaults to sleek fox/hybrid if animal cue not named, or sleek stylized humanoid
    matchedSpecies = {
      regex: /\bhumanoid\b/,
      species: 'fox',
      label: 'Humanoid Kustom',
      defaultPrimary: '#2563eb',
      defaultSecondary: '#e0f2fe',
      earStyle: 'fox_pointed',
      muzzleStyle: 'fox_snout',
      tailStyle: 'fox_fluffy',
    };
  }

  let bodyColorLabel = '';
  if (matchedSpecies) {
    next.species = matchedSpecies.species;
    next.earStyle = matchedSpecies.earStyle;
    next.muzzleStyle = matchedSpecies.muzzleStyle;
    next.tailStyle = matchedSpecies.tailStyle;

    // Check if a color is specified for the species/body (e.g. "humanoid rubah biru", "kucing putih", "robot merah")
    let primaryFur = matchedSpecies.defaultPrimary;
    let secondaryFur = matchedSpecies.defaultSecondary;

    for (const [cRegex, hex, lightHex, cName] of colorRules) {
      if (cRegex.test(q)) {
        primaryFur = hex;
        secondaryFur = lightHex;
        bodyColorLabel = cName;
        break;
      }
    }

    next.furPrimaryColor = primaryFur;
    next.furSecondaryColor = secondaryFur;
    next.skinColor = primaryFur;
    next.hairColor = primaryFur;
    if (matchedSpecies.species === 'robot') {
      next.hairStyle = 'botak';
    } else if (!/rambut|hijab|jilbab|kerudung/.test(q)) {
      next.hairStyle = 'spiky';
    }
  } else {
    next.species = 'human';
    next.earStyle = 'none';
    next.muzzleStyle = 'none';
    next.tailStyle = 'none';
    // Human skin tone
    if (/\b(putih|cerah|terang)\b/.test(q) && /kulit|wajah/.test(q)) next.skinColor = '#f7d9c4';
    else if (/\b(gelap|hitam manis)\b/.test(q) && /kulit/.test(q)) next.skinColor = '#7a4b31';
    else if (/sawo matang/.test(q)) next.skinColor = '#b6784e';
    else {
      // Allow fantasy skin tone if explicitly requested ("berkulit biru")
      for (const [cRegex, hex] of colorRules) {
        if (new RegExp(`(kulit|badan|tubuh)\\s+${cRegex.source}`, 'i').test(q)) {
          next.skinColor = hex;
          break;
        }
      }
    }
  }

  // 2. Hair / Hijab (supports berhijab, berjilbab, berkerudung, bercadar)
  if (/khimar|cadar|syari/.test(q)) next.hairStyle = 'khimar';
  else if (/hijab|jilbab|kerudung/.test(q)) next.hairStyle = 'hijab_simpel';
  else if (/\bbotak|gundul\b/.test(q)) next.hairStyle = 'botak';
  else if (/undercut/.test(q)) next.hairStyle = 'undercut';
  else if (/jambul|quiff/.test(q)) next.hairStyle = 'jambul';
  else if (/pompadour/.test(q)) next.hairStyle = 'pompadour';
  else if (/keriting|curly/.test(q)) next.hairStyle = 'keriting';
  else if (/kribo|afro/.test(q)) next.hairStyle = 'kribo';
  else if (/cepol|bun|sanggul/.test(q)) next.hairStyle = 'cepol';
  else if (/kuncir|ponytail/.test(q)) next.hairStyle = 'kuncir';
  else if (/gondrong|panjang/.test(q) && /rambut/.test(q)) next.hairStyle = 'gondrong';
  else if (/\bbob\b/.test(q)) next.hairStyle = 'bob_pendek';

  // 3. Top / OneSet / Modern Outfit
  const isModernOutfit =
    /pakaian modern|berpakaian modern|baju modern|gaya modern|kasual modern|stylish|modis|streetwear|kekinian|urban/.test(
      q
    );

  if (/\bdokter\b/.test(q)) next.oneSetId = 'jas_dokter';
  else if (/\bjas\b.*\b(formal|kantor|bisnis)\b/.test(q)) next.oneSetId = 'jas_formal';
  else if (/gamis/.test(q)) next.oneSetId = 'gamis_syari';
  else if (/hoodie/.test(q)) {
    next.oneSetId = 'none';
    next.topStyle = 'hoodie';
  } else if (/jaket/.test(q)) {
    next.oneSetId = 'none';
    next.topStyle = /tutup|tertutup/.test(q) ? 'jaket_tertutup' : 'jaket_terbuka';
  } else if (/blazer/.test(q)) {
    next.oneSetId = 'none';
    next.topStyle = 'blazer';
  } else if (/kardigan|cardigan/.test(q)) {
    next.oneSetId = 'none';
    next.topStyle = 'kardigan';
  } else if (/koko/.test(q)) {
    next.oneSetId = 'none';
    next.topStyle = 'koko';
  } else if (/batik/.test(q)) {
    next.oneSetId = 'batik';
  } else if (/kemeja/.test(q)) {
    next.oneSetId = 'none';
    next.topStyle = 'kemeja';
  } else if (/sweater|rajut/.test(q)) {
    next.oneSetId = 'none';
    next.topStyle = 'sweater';
  } else if (isModernOutfit) {
    next.oneSetId = 'none';
    next.topStyle = 'jaket_terbuka';
    next.topColor = '#0f172a';
    next.innerTopColor = '#f8fafc';
    next.bottomStyle = 'celana_panjang';
    next.bottomColor = '#1e293b';
    next.shoeStyle = 'sneakers';
    next.shoeColor = '#f8fafc';
  }

  // 4. Colors for clothing (Look for explicit clothing color first; if humanoid species consumed the color, keep modern contrasting outfit unless clothing color is explicitly named)
  let explicitOutfitColor: string | null = null;
  for (const [cRegex, hex] of colorRules) {
    const outfitColorPattern = new RegExp(
      `(baju|pakaian|jaket|hoodie|kaos|kemeja|blazer|jas|sweater|rompi|gamis|hijab|kerudung)\\s+(?:modern\\s+)?(?:warna\\s+)?${cRegex.source}`,
      'i'
    );
    if (outfitColorPattern.test(q)) {
      explicitOutfitColor = hex;
      break;
    }
  }

  if (explicitOutfitColor) {
    next.topColor = explicitOutfitColor;
    if (next.hairStyle === 'hijab_simpel' || next.hairStyle === 'khimar') {
      next.hairColor = explicitOutfitColor;
    }
  } else if (!matchedSpecies) {
    for (const [regex, hex] of colorRules) {
      if (regex.test(q)) {
        next.topColor = hex;
        if (next.hairStyle === 'hijab_simpel' || next.hairStyle === 'khimar') {
          next.hairColor = hex;
        }
        break;
      }
    }
  } else if (!isModernOutfit) {
    // Give humanoid characters a sleek contrasting outfit if no explicit outfit color was given
    next.oneSetId = 'none';
    next.topStyle = 'jaket_terbuka';
    next.topColor = '#0f172a';
    next.innerTopColor = '#f8fafc';
    next.bottomStyle = 'celana_panjang';
    next.bottomColor = '#1e293b';
    next.shoeStyle = 'sneakers';
    next.shoeColor = '#f8fafc';
  }

  // 5. Accessories (supports berkacamata, aksesoris kacamata, berpeci, berdasi, headphone, dll)
  const accSet = new Set(next.accessories || []);
  const accColors: Record<string, string> = { ...(next.accessoryColors || {}) };
  if (/kacamata.*hitam|sunglasses/.test(q)) {
    accSet.delete('kacamata_bulat');
    accSet.add('kacamata_hitam');
    accColors.kacamata_hitam = '#0f172a';
  } else if (/kacamata.*bulat/.test(q)) {
    accSet.delete('kacamata_kotak');
    accSet.add('kacamata_bulat');
    accColors.kacamata_bulat = '#0f172a';
  } else if (/kacamata|glasses|eyewear/.test(q)) {
    accSet.delete('kacamata_bulat');
    accSet.add('kacamata_kotak');
    accColors.kacamata_kotak = '#0f172a';
  }
  if (/peci|songkok/.test(q)) accSet.add('peci');
  if (/topi/.test(q)) accSet.add('topi_pet');
  if (/dasi/.test(q)) accSet.add('dasi');
  if (/syal|scarf/.test(q)) accSet.add('syal');
  if (/headphone|headset/.test(q)) accSet.add('headphone');
  if (/tas|ransel/.test(q)) accSet.add('ransel');
  if (/jenggot|brewok/.test(q)) accSet.add('jenggot');
  if (/kumis/.test(q)) accSet.add('kumis');
  next.accessories = Array.from(accSet);
  next.accessoryColors = accColors;

  // 6. Descriptive Name & Observation
  if (matchedSpecies) {
    const cleanSpeciesName = `${matchedSpecies.label}${bodyColorLabel ? ` ${bodyColorLabel}` : ''}`;
    next.name = cleanSpeciesName.slice(0, 32);
  } else if (!base?.name || base.name === 'Karakter Kustomku') {
    const shortWords = rawPrompt
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    if (shortWords) {
      next.name = shortWords.slice(0, 32);
    }
  }

  next.extraNote = rawPrompt;
  next.photoObservation = `Desain karakter AI aktif: "${rawPrompt}" (${buildCharacterTraitsSummary(next)})`;
  return next;
}

export function buildDeterministicCharacterFromPalette(
  palette: (Partial<ExtractedReferenceMedia['dominantPalette']> & Record<string, string | undefined>) | undefined,
  promptText: string,
  base?: CustomCharacterConfig
): CustomCharacterConfig {
  const fromPrompt = applyCharacterDesignPrompt(promptText || '', base);
  if (!palette) return fromPrompt;

  const pTop = palette.torsoRegionHex || palette.topColor;
  const pHair = palette.topRegionHex || palette.hairColor;
  const pBot = palette.lowerRegionHex || palette.bottomColor;

  return createDefaultCustomCharacter({
    ...fromPrompt,
    hairColor:
      promptText && /rambut|hijab|kerudung/i.test(promptText)
        ? fromPrompt.hairColor
        : pHair || fromPrompt.hairColor,
    topColor:
      pTop ||
      (promptText && /merah|biru|hijau|emerald|kuning|hitam|putih|ungu|oranye|pink|cokelat/i.test(promptText)
        ? fromPrompt.topColor
        : fromPrompt.topColor),
    bottomColor: pBot || fromPrompt.bottomColor,
    photoObservation: promptText?.trim()
      ? `Karakter konsisten dari referensi media + desain: "${promptText.trim()}"`
      : 'Karakter konsisten diekstrak dari warna & proporsi referensi foto/video.',
  });
}


export type SatsetStyleModule =
  | 'otomatis'
  | 'studio_3d_room'
  | 'editorial_motion_grid'
  // Kreatorlab Motion 3D (16 Styles)
  | 'voxelverse'
  | 'pixelstory'
  | 'paperworld'
  | 'worldforge_roma'
  | 'worldforge_mars'
  | 'timeforge'
  | 'buildforge'
  | 'precision'
  | 'innerworks'
  | 'characterflow'
  | 'cinestory'
  | 'panelverse'
  | 'storybook'
  | 'chronicle'
  | 'bedah'
  | 'cerdik'
  // Kreatorlab Motion Graphics (18 Styles)
  | 'midnight'
  | 'miniatur'
  | 'arsip'
  | 'blueprint'
  | 'sketsa'
  | 'hikayat'
  | 'geometrik'
  | 'terminal'
  | 'lantang'
  | 'flatlife'
  | 'cair'
  | 'peta'
  | 'kliping'
  | 'kaset'
  | 'lempung'
  | 'piksel'
  | 'titik'
  | 'mabar'
  // Kreatorlab Video Editor (20 Styles)
  | 'graphite'
  | 'interface_ui'
  | 'marker'
  | 'press'
  | 'typeset'
  | 'clean'
  | 'spotlight'
  | 'bold_type'
  | 'calm'
  | 'podcast'
  | 'noted'
  | 'poster'
  | 'lumen'
  | 'depth'
  | 'storyteller'
  | 'mograph_mix'
  | 'mograph_mix_flat'
  | 'impact'
  | 'system_hud'
  | 'creator_pop'
  // Existing & Legacy Satset Styles
  | 'diorama_data'
  | 'scribble3d'
  | 'uiweb'
  | 'futuristik'
  | 'retro'
  | 'oneline'
  | 'papercut'
  | 'custom'
  | 'stickman_shorts'
  | 'cerita_sinematik'
  | 'scribble2d'
  | 'modern_flat'
  | 'celengan_pecah'
  | 'bunga_tumbuh'
  | 'pop_circle'
  | 'kinetic_type'
  | 'claymation'
  | 'botanical_pastel'
  | 'minimal_swiss'
  | 'vintage_film'
  | 'komik_strip'
  | 'matrix_code'
  | 'cyber_hud'
  | (string & {});

export type StartMode = 'topic' | 'script' | 'promo' | 'url';
export type PromptSendMode = 'direct' | 'style_link' | 'md_file';
export type ThumbnailArtStyle =
  | 'sesuai_video'
  | 'ilustrasi_3d'
  | 'sinematik'
  | 'komik_tebal'
  | 'anime'
  | 'cat_air'
  | 'retro_poster'
  | 'neon_cyber'
  | 'kertas_potong'
  | 'lempung_3d'
  | 'isometrik'
  | 'sketsa_tinta'
  | 'flat_modern'
  | 'piksel_retro'
  | 'pixar_3d'
  | 'anime_ghibli'
  | 'watercolor_storybook'
  | 'comic_popart'
  | 'claymation'
  | 'isometric_diorama'
  | 'cyberpunk_neon'
  | 'papercut_layered'
  | 'chalk_blackboard'
  | 'flat_editorial'
  | 'retro_vintage'
  | 'lowpoly_geometric'
  | 'ink_sketch'
  | (string & {});
export type LanguageOption = 'id' | 'en' | 'jv';
export type ContentType = 'motivasi' | 'edukasi' | 'promosi' | 'storytelling' | 'tips';
export type AspectRatio = '9:16' | '16:9' | '1:1' | '3:4';
export type TempoOption = 'energik' | 'santai';
export type CharacterFraming = 'full' | 'bust' | 'closeup' | 'orb';
export type CharacterDimension = '3d' | '2d';
export type CharacterOption =
  | 'none'
  | 'auto'
  | 'kreator_3d_studio'
  | 'kreator_3d_headphone'
  | 'rubah_biru_3d'
  | 'robot_cyan_3d'
  | 'kucing_ungu_3d'
  | 'panda_emerald_3d'
  | 'serigala_biru_3d'
  | 'alien_mint_3d'
  | 'maskot_orb_3d'
  | 'cowok_biasa'
  | 'cowok_modis'
  | 'cowok_berjaket'
  | 'cowok_muslim'
  | 'cowok_santai'
  | 'cowok_kantoran'
  | 'cewek_biasa'
  | 'cewek_modis'
  | 'cewek_berhijab'
  | 'cewek_bercadar'
  | 'cewek_mandiri'
  | 'kakek_bijak'
  | 'nenek_ramah'
  | 'stickman_kurus'
  | 'stickman_berotot'
  | 'stickman_samping'
  | 'avatar3d'
  | 'mascot'
  | 'custom'
  | (string & {});

export type TransitionOption =
  | 'otomatis'
  | 'geser_kiri'
  | 'geser_kanan'
  | 'geser_atas'
  | 'geser_bawah'
  | 'fade_lembut'
  | 'zoom_tembus'
  | 'putar'
  | 'lingkaran'
  | 'sapu_miring'
  | 'sapuan_warna'
  | 'glitch'
  | 'kilas_kamera'
  | 'tirai'
  | 'jatuh_membal'
  | 'blur_lembut'
  | 'menyusut'
  | 'celuk_gelap'
  | 'menyambung'
  | 'match_morph'
  | 'cinema_whip'
  | 'luma_dissolve'
  | 'depth_focus'
  | 'editorial_split'
  | (string & {});
export type BgmStyle = 'energetic_lofi' | 'corporate_beat' | 'upbeat_synth' | 'none';
export type SubtitleStyle =
  | 'satsetYellow'
  | 'boxedHighlight'
  | 'whitePunch'
  | 'minimalClean'
  | 'auto'
  | 'pop'
  | 'tangan'
  | 'ketik'
  | 'sorot'
  | 'stiker'
  | 'karaoke'
  | 'kotak'
  | 'gelap'
  | 'glitch'
  | 'panduan'
  | 'elegan'
  | 'satu'
  | 'neon'
  | 'selotip'
  | 'garis'
  | 'redup'
  | 'off'
  | (string & {});
export type VoiceOption =
  | 'charon'
  | 'kore'
  | 'fenrir'
  | 'orus'
  | 'dimas'
  | 'budi'
  | 'sarah'
  | 'maya'
  | 'custom'
  | (string & {});

export interface SceneVisualAnimation {
  layout?: 'centered_title_with_floating_icons' | 'split_text_and_graphic' | 'call_to_action_banner' | 'window_mockup' | 'full_spotlight' | string;
  remotion_animation?: 'spring_pop_in' | 'slide_from_bottom' | 'pulse_heartbeat' | 'zoom_in_rotate' | string;
  asset_elements?: string[];
}

export interface SceneSfx {
  file?: string;
  type?: 'whoosh' | 'pop' | 'click' | 'bell' | 'ding' | string;
  play_at_second?: number;
}

export interface WebsiteStepUiCard {
  label: string;
  value: string;
  badge?: string;
  accent?: string;
}

export type WebsiteStepLayoutVariant =
  | 'hero_landing'
  | 'hero_overview'
  | 'dashboard_metrics'
  | 'problem_compare'
  | 'step_phone_notif'
  | 'step_ssl_tunnel'
  | 'step_webhook_lunas'
  | 'channel_grid'
  | 'security_pricing'
  | 'cta_spotlight';

export interface WebsiteDiscoveredEndpoint {
  path: string;
  url: string;
  title: string;
  type: 'page' | 'section' | 'api' | 'action';
}

export interface WebsiteDiscoveredMedia {
  url: string;
  dataUrl?: string;
  type: 'image' | 'video';
  label: string;
  endpointPath?: string;
}

export interface WebsiteStepVisual {
  stepNumber: number;
  stepIndex?: number;
  totalSteps: number;
  stepBadge: string;
  urlDisplay: string;
  endpointPath?: string;
  brandName: string;
  screenTitle: string;
  screenSubtitle: string;
  highlightMetric: string;
  actionLabel: string;
  layoutVariant: WebsiteStepLayoutVariant;
  uiCards: WebsiteStepUiCard[];
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  screenshotDataUrl?: string;
}

export interface WebsitePromoStep {
  stepBadge: string;
  title: string;
  subtitle: string;
  metric: string;
  actionLabel: string;
  layoutVariant: WebsiteStepLayoutVariant;
  cards: WebsiteStepUiCard[];
  endpointPath?: string;
  description?: string;
  highlightText?: string;
  uiElement?: string;
  screenshotDataUrl?: string;
  mediaKey?: string;
}

export interface WebsitePromoProfile {
  url: string;
  domain: string;
  brandName: string;
  tagline: string;
  description: string;
  heroHeadline?: string;
  valueProposition?: string;
  features?: string[];
  category: 'payment_gateway' | 'saas' | 'ecommerce' | 'agency' | 'edtech' | 'general';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  metrics: Array<{ label: string; value: string }>;
  steps: WebsitePromoStep[];
  channels: string[];
  pricing: string;
  ctaText: string;
  discoveredEndpoints?: WebsiteDiscoveredEndpoint[];
  discoveredMedia?: WebsiteDiscoveredMedia[];
  crawlSummary?: {
    crawlEngine: string;
    endpointsCount: number;
    mediaCount: number;
    conceptSummary: string;
  };
}

export interface SatsetScene {
  id: string;
  scene_number?: number;
  nomor?: number;
  role?: 'hook' | 'body_core_point' | 'cta' | string;
  target_duration_sec?: number;
  duration?: number;
  narration_text?: string;
  narasi?: string;
  on_screen_text?: string;
  emphasis?: string;
  emphasis_words?: string[];
  visual_animation?: SceneVisualAnimation;
  sfx?: SceneSfx;
  website_step?: WebsiteStepVisual;

  // Compatibility & Narrative fields
  sceneNumber?: number;
  durationSeconds?: number;
  hookText?: string;
  voiceScript?: string;
  emphasisWords?: string[];
  visualModule?: SatsetStyleModule;
  accentColor?: string;
  secondaryColor?: string;
  sfxCue?:
    | 'pop'
    | 'click'
    | 'whoosh'
    | 'ding'
    | 'thud'
    | 'sparkle'
    | 'rise'
    | 'tap'
    | 'card_slide'
    | 'swish'
    | 'swipe'
    | 'cursor_click'
    | 'pageflip'
    | 'shutter'
    | 'step'
    | 'paper'
    | (string & {});
  visualDescription?: string;
  visual_description?: string;
  visual?: string;
  camera?: string;
  camera_movement?: string;
  transition?: string;
  transition_type?: string;
  theme?: 'paper' | 'dusk' | 'night' | string;
  background_theme?: 'paper' | 'dusk' | 'night' | string;
  headline?: string;
  word_timings?: Array<{
    word: string;
    cleanWord?: string;
    startSec: number;
    endSec: number;
    isEmphasis?: boolean;
  }>;
  wordAt?: number[];
  audio_url?: string;
  audio_voice_id?: string;
  audio_duration_sec?: number;
  media_url?: string;
  media_type?: 'image' | 'video' | 'website_snapshot';
  media_key?: string;
  media_filename?: string;
  asset_motion_preset?: AssetMotionPreset;
  asset_motion_prompt?: string;
  focus_region?: {
    fx: number;
    fy: number;
    zoom: number;
  };
  captionPos?: { x: number; y: number; rotate?: number } | string;
}

export type AssetMotionPreset =
  | 'auto_concept'
  | 'orbit_3d'
  | 'spring_pop'
  | 'parallax_scan'
  | 'float_wave'
  | 'zoom_impact'
  | 'custom';

export interface IdeaConcept {
  id: string;
  title: string;
  angle: string;
  hookProposal?: string;
  hook?: string;
  visualStyle?: string;
  corePoints?: string[];
  targetAudience?: string;
}

export interface UploadedTutorialMediaItem {
  id: string;
  key: string;
  url: string;
  type: 'image' | 'video';
  filename: string;
  name?: string;
  dataUrl?: string;
  mediaKey?: string;
  durationSec?: number;
  stepTitle?: string;
  width?: number;
  height?: number;
  motionPreset?: AssetMotionPreset;
  motionPrompt?: string;
  targetSceneNumber?: number | 'auto';
}

export interface SatsetProject {
  id: string;
  project_title?: string;
  judul_video?: string;
  speech_speed?: number;
  status?: 'draft' | 'ready_to_render' | 'rendered';
  start_mode?: StartMode;
  source_url?: string;
  source_script?: string;
  website_promo?: WebsitePromoProfile;
  uploaded_tutorial_media?: UploadedTutorialMediaItem[];
  language?: LanguageOption;
  content_type?: ContentType;
  topik_video?: string;
  target_duration_sec?: number;
  duration_mode?: 'auto' | '30' | '50' | '60' | 'custom';
  fps?: number;
  gaya_video?: SatsetStyleModule;
  custom_style_prompt?: string;
  customStylePrompt?: string;
  character?: CharacterOption;
  character_framing?: CharacterFraming;
  character_dimension?: CharacterDimension;
  render_dimension?: '2d' | '2.5d' | '3d';
  character_gender?: 'pria' | 'wanita';
  character_with_objects?: boolean;
  character_full_backstory?: boolean;
  warna_brand?: string;
  brand_secondary_color?: string;
  brand_accent_color?: string;
  brand_preset_name?: string;
  brand_mode?: 'auto' | 'custom';
  transition?: TransitionOption;
  tempo?: TempoOption;
  target_audience?: string;
  idea_count?: number;
  aspect_ratio?: AspectRatio;
  bgm_style?: BgmStyle;
  bgm_volume?: number;
  auto_ducking?: boolean;
  ducking_level?: number;
  voice_option?: VoiceOption;
  subtitle_style?: SubtitleStyle;
  subtitle_position?: string;
  watermark?: string;
  idea_concepts?: IdeaConcept[];
  selected_idea_id?: string;
  creator_note?: string;
  creatorNote?: string;
  seo?: {
    title?: string;
    description?: string;
    short?: string;
    tags?: string[];
    hashtags?: string[];
  };
  hook_structure?: {
    atas?: string;
    besar?: string;
    bawah?: string;
    scene?: number;
  };
  background_themes?: {
    paper?: { top: string; bottom: string; pattern?: string };
    dusk?: { top: string; bottom: string; pattern?: string };
    night?: { top: string; bottom: string; pattern?: string };
  };
  scenes: SatsetScene[];
  remotionCode?: {
    compositionTsx: string;
    rootTsx: string;
    instructions: string;
    blueprintJson?: string;
  };
  createdAt: number;

  // Compatibility fields
  title?: string;
  topic?: string;
  styleModule?: SatsetStyleModule;
  voiceOption?: VoiceOption;
  subtitleStyle?: SubtitleStyle;
  brandColor?: string;
  durationSeconds?: number;

  // Step 3 Suara & Step 4 Animasi states
  voice_audio_ready?: boolean;
  voice_audio_url?: string;
  voice_skipped?: boolean;
  voice_character?: string;
  tts_model?: string;
  speech_style?: string;
  scenes_animated_count?: number;
  scene_codes?: Record<number, string>;
  scene_codes_configured?: Record<number, boolean>;
  export_credits?: number;
  export_resolution?: '1080p' | '2K' | '4K' | string;
  export_fps?: 30 | 60 | number;
  custom_character?: import('../utils/custom-character.ts').CustomCharacterConfig;
  sfx_enabled?: boolean;
  sfx_volume?: number;
  revision_history?: Array<{
    id: string;
    timestamp: number;
    instruction: string;
    scope: 'scene' | 'all';
    sceneNumber?: number;
    summary: string;
  }>;

  // Step 1 Promo & Script Polish fields
  custom_narration?: string;
  promo_product_name?: string;
  promo_benefits?: string;
  promo_price?: string;
  promo_cta?: string;
  script_polish_mode?: 'rapikan' | 'persis' | 'polished' | 'exact';
  script_allow_add_words?: boolean;
  scene_count?: number;
  scenes_per_batch?: number;
  prompt_send_mode?: PromptSendMode;

  // Step 4 Subtitle Custom Drag Box & Thumbnail AI Studio fields
  subtitle_custom_box?: {
    x: number;
    y: number;
    w: number;
    h: number;
  } | null;
  thumbnail_art_style?: ThumbnailArtStyle;
  thumbnail_text_mode?: 'with_text' | 'no_text';
  thumbnail_color_mode?: 'colorful' | 'brand' | 'rich';
  thumbnail_dark_bg?: boolean;
  thumbnail_custom_image_url?: string | null;
  thumbnail_insert_duration?: 0 | 0.2 | 0.5 | 1 | 1.5;
  seo_package?: {
    title?: string;
    description?: string;
    short?: string;
    tags?: string[];
    hashtags?: string[];
  };

  // Staged Workflow Completion Gates
  step_ide_done?: boolean;
  step_naskah_done?: boolean;
  step_suara_done?: boolean;
}


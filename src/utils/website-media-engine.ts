import {
  type SatsetProject,
  type SatsetScene,
  type UploadedTutorialMediaItem,
  type WebsitePromoProfile,
  type WebsitePromoStep,
} from '../types/satset.ts';
import {
  getSatsetMediaAsset,
  registerSatsetMediaAsset,
} from './satset-cloud-engine.ts';

export interface StepFocusRegion {
  fx: number;
  fy: number;
  zoom: number;
  calloutTitle: string;
  calloutSub: string;
}

const STEP_FOCUS_PRESETS: StepFocusRegion[] = [
  { fx: 0.5, fy: 0.22, zoom: 1.12, calloutTitle: 'Tampilan Hero & Navigasi Utama', calloutSub: 'Header Resmi & Value Proposition' },
  { fx: 0.5, fy: 0.38, zoom: 1.18, calloutTitle: 'Formulir & Konfigurasi Akun', calloutSub: 'Input Data & Integrasi Instan' },
  { fx: 0.48, fy: 0.52, zoom: 1.22, calloutTitle: 'Panel Fitur & Otomasi Real-Time', calloutSub: 'Sinkronisasi & Verifikasi Otomatis' },
  { fx: 0.52, fy: 0.64, zoom: 1.2, calloutTitle: ' Tabel Mutasi & Webhook 200 OK', calloutSub: 'Monitoring Transaksi 24/7' },
  { fx: 0.5, fy: 0.76, zoom: 1.16, calloutTitle: 'Dukungan Multi-Bank & QRIS', calloutSub: 'BCA · Mandiri · BRI · BNI · SeaBank' },
  { fx: 0.5, fy: 0.86, zoom: 1.15, calloutTitle: 'Paket Berlangganan & Aktivasi', calloutSub: 'Klik Daftar Sekarang untuk Mulai' },
];

export function getStepFocusRegion(
  stepIndexOrVariant?: number | string,
  stepOrIndex?: Partial<WebsitePromoStep> | number
): StepFocusRegion {
  const stepIndex =
    typeof stepIndexOrVariant === 'number'
      ? stepIndexOrVariant
      : typeof stepOrIndex === 'number'
      ? stepOrIndex
      : 0;
  const step =
    stepOrIndex && typeof stepOrIndex === 'object' ? stepOrIndex : undefined;
  const preset = STEP_FOCUS_PRESETS[Math.abs(stepIndex) % STEP_FOCUS_PRESETS.length];
  return {
    fx: preset.fx,
    fy: preset.fy,
    zoom: preset.zoom,
    calloutTitle: step?.title || preset.calloutTitle,
    calloutSub: step?.highlightText || step?.uiElement || preset.calloutSub,
  };
}

/**
 * Computes automatic target duration (`Otomatis`) based on narration word count,
 * number of steps/scenes, and any uploaded video/image durations.
 */
export function computeAutoTargetDuration(
  scenesOrOpts:
    | SatsetScene[]
    | {
        scenes?: SatsetScene[];
        speechSpeed?: number;
        tempo?: string;
        uploadedMedia?: UploadedTutorialMediaItem[];
      },
  speechSpeedOrUploadedMedia: number | UploadedTutorialMediaItem[] = 1,
  uploadedMediaOrTempo?: UploadedTutorialMediaItem[] | string
): number {
  const isOpts = scenesOrOpts && !Array.isArray(scenesOrOpts) && typeof scenesOrOpts === 'object';
  const scenes = isOpts ? scenesOrOpts.scenes || [] : (scenesOrOpts as SatsetScene[]) || [];
  const resolvedMedia = isOpts
    ? scenesOrOpts.uploadedMedia
    : Array.isArray(speechSpeedOrUploadedMedia)
    ? speechSpeedOrUploadedMedia
    : Array.isArray(uploadedMediaOrTempo)
    ? uploadedMediaOrTempo
    : undefined;
  const resolvedSpeed = isOpts
    ? scenesOrOpts.speechSpeed || (scenesOrOpts.tempo === 'santai' ? 0.88 : 1.0)
    : typeof speechSpeedOrUploadedMedia === 'number'
    ? speechSpeedOrUploadedMedia
    : uploadedMediaOrTempo === 'santai'
    ? 0.88
    : 1.0;

  const safeSpeed = Math.max(0.75, Math.min(1.5, resolvedSpeed));
  if (!Array.isArray(scenes) || scenes.length === 0) {
    if (resolvedMedia && resolvedMedia.length > 0) {
      const mediaSum = resolvedMedia.reduce(
        (acc, item) => acc + Math.max(4, Math.min(10, item.durationSec || 5.5)),
        0
      );
      return Math.max(15, Math.min(90, Math.round(mediaSum)));
    }
    return 45;
  }

  let totalSec = 0;
  scenes.forEach((sc, idx) => {
    const text = String(sc.narration_text || sc.narasi || sc.voiceScript || sc.hookText || '').trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const readingSec = words > 0 ? words / (2.55 * safeSpeed) + 1.1 : 4.8;
    const mediaDur = sc.audio_duration_sec && sc.audio_duration_sec > 1 ? sc.audio_duration_sec + 0.35 : readingSec;
    const uploadedItem = resolvedMedia?.[idx];
    const clipFloor = uploadedItem?.type === 'video' && uploadedItem.durationSec
      ? Math.min(9.5, Math.max(4.2, uploadedItem.durationSec))
      : 3.8;
    totalSec += Math.max(clipFloor, Math.min(9.5, Number(mediaDur.toFixed(1))));
  });

  return Math.max(12, Math.min(120, Math.round(totalSec)));
}

export function toCorsSafeBrowserMediaUrl(rawUrl?: string): string | undefined {
  if (!rawUrl || typeof rawUrl !== 'string') return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/api/satset/proxy-media') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return `/api/satset/proxy-media?url=${encodeURIComponent(trimmed)}`;
  }
  return trimmed;
}

/**
 * Renders an authentic high-resolution website appearance snapshot onto an HTMLCanvasElement
 * and registers it in satset-cloud-engine's media registry so `s.photo(mediaKey, ...)`
 * displays the real website UI appearance with smooth camera zoom/pan onto each step.
 */
export function renderAuthenticWebsiteStepSnapshot(
  profileOrStepVisual: WebsitePromoProfile | import('../types/satset.ts').WebsiteStepVisual,
  stepOrProfile?: Partial<WebsitePromoStep> | WebsitePromoProfile,
  stepIndex: number = 0,
  _totalSteps?: number
): { mediaKey: string; dataUrl: string; focus: StepFocusRegion; canvas?: HTMLCanvasElement } {
  const isFirstProfile = 'domain' in profileOrStepVisual && Array.isArray((profileOrStepVisual as WebsitePromoProfile).steps);
  const profile: WebsitePromoProfile = isFirstProfile
    ? (profileOrStepVisual as WebsitePromoProfile)
    : (stepOrProfile && 'domain' in stepOrProfile
        ? (stepOrProfile as WebsitePromoProfile)
        : {
            url: (profileOrStepVisual as import('../types/satset.ts').WebsiteStepVisual).urlDisplay || 'https://website.id',
            domain: ((profileOrStepVisual as import('../types/satset.ts').WebsiteStepVisual).urlDisplay || 'website.id').replace(/^https?:\/\//i, '').split('/')[0],
            brandName: (profileOrStepVisual as import('../types/satset.ts').WebsiteStepVisual).brandName || 'Website',
            tagline: (profileOrStepVisual as import('../types/satset.ts').WebsiteStepVisual).screenSubtitle || '',
            description: (profileOrStepVisual as import('../types/satset.ts').WebsiteStepVisual).screenSubtitle || '',
            category: 'saas',
            primaryColor: (profileOrStepVisual as import('../types/satset.ts').WebsiteStepVisual).primaryColor || '#2563EB',
            secondaryColor: (profileOrStepVisual as import('../types/satset.ts').WebsiteStepVisual).secondaryColor || '#38BDF8',
            accentColor: (profileOrStepVisual as import('../types/satset.ts').WebsiteStepVisual).accentColor || '#10B981',
            metrics: [],
            steps: [],
            channels: [],
            pricing: '',
            ctaText: (profileOrStepVisual as import('../types/satset.ts').WebsiteStepVisual).actionLabel || 'Mulai Sekarang',
          });

  const step: Partial<WebsitePromoStep> = isFirstProfile
    ? (stepOrProfile as Partial<WebsitePromoStep>) || {}
    : {
        stepBadge: (profileOrStepVisual as import('../types/satset.ts').WebsiteStepVisual).stepBadge,
        title: (profileOrStepVisual as import('../types/satset.ts').WebsiteStepVisual).screenTitle,
        subtitle: (profileOrStepVisual as import('../types/satset.ts').WebsiteStepVisual).screenSubtitle,
        description: (profileOrStepVisual as import('../types/satset.ts').WebsiteStepVisual).screenSubtitle,
        highlightText: (profileOrStepVisual as import('../types/satset.ts').WebsiteStepVisual).highlightMetric,
        metric: (profileOrStepVisual as import('../types/satset.ts').WebsiteStepVisual).highlightMetric,
        actionLabel: (profileOrStepVisual as import('../types/satset.ts').WebsiteStepVisual).actionLabel,
        layoutVariant: (profileOrStepVisual as import('../types/satset.ts').WebsiteStepVisual).layoutVariant,
        cards: (profileOrStepVisual as import('../types/satset.ts').WebsiteStepVisual).uiCards || [],
        screenshotDataUrl: (profileOrStepVisual as import('../types/satset.ts').WebsiteStepVisual).screenshotDataUrl,
      };

  const cleanDomain = (profile.domain || 'website.id')
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '');
  const mediaKey = `web_snap_${cleanDomain.replace(/[^a-z0-9]/gi, '_')}_s${stepIndex + 1}`;
  const focus = getStepFocusRegion(stepIndex, step);

  if (typeof document === 'undefined') {
    return { mediaKey, dataUrl: step.screenshotDataUrl || '', focus };
  }

  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 1040;
  const ctx = canvas.getContext('2d');
  if (!ctx || typeof ctx.fillRect !== 'function') {
    return { mediaKey, dataUrl: step.screenshotDataUrl || '', focus, canvas };
  }

  const primary = profile.primaryColor || '#2563EB';
  const secondary = profile.secondaryColor || '#38BDF8';
  const emerald = profile.accentColor || '#10B981';

  // Clean Website Preview Surface using the website's own extracted brand colors and headings
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#070e1d');
  bgGrad.addColorStop(0.5, '#0b162c');
  bgGrad.addColorStop(1, '#060c18');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Brand-tinted radial glow at top hero
  const heroGlow = ctx.createRadialGradient(360, 220, 20, 360, 220, 380);
  heroGlow.addColorStop(0, `${primary}33`);
  heroGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = heroGlow;
  ctx.fillRect(0, 0, 720, 520);

  // Top Website Header Bar
  ctx.fillStyle = 'rgba(11, 21, 40, 0.94)';
  ctx.fillRect(0, 0, 720, 68);
  ctx.strokeStyle = `${primary}44`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 68);
  ctx.lineTo(720, 68);
  ctx.stroke();

  ctx.fillStyle = primary;
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(28, 18, 32, 32, 8);
    ctx.fill();
  } else {
    ctx.fillRect(28, 18, 32, 32);
  }
  ctx.font = '800 18px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(profile.brandName || cleanDomain, 72, 34);

  ctx.fillStyle = primary;
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(556, 18, 136, 32, 16);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 12px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText((step.actionLabel || profile.ctaText || 'Buka Website').slice(0, 18), 624, 34);

  // Hero Headline & Subtitle from scraped website
  ctx.fillStyle = `${primary}24`;
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(190, 96, 340, 30, 15);
    ctx.fill();
  }
  ctx.font = '700 12px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = secondary;
  ctx.textAlign = 'center';
  ctx.fillText((step.stepBadge || cleanDomain.toUpperCase()).slice(0, 34), 360, 111);

  ctx.font = '800 28px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText((step.title || profile.brandName || cleanDomain).slice(0, 38), 360, 164);

  ctx.font = '600 16px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = '#cbd5e1';
  const subText = step.subtitle || step.description || profile.tagline || '';
  ctx.fillText(subText.slice(0, 56), 360, 204);
  if (subText.length > 56) {
    ctx.fillText(subText.slice(56, 112), 360, 228);
  }

  // Feature / Step Cards from website metadata
  const cards = (step.cards && step.cards.length > 0 ? step.cards : profile.steps?.[0]?.cards || []).slice(0, 3);
  cards.forEach((c, idx) => {
    const cy = 280 + idx * 176;
    const acc = c.accent || (idx === 0 ? primary : idx === 1 ? secondary : emerald);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = acc;
    ctx.lineWidth = 2;
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(44, cy, 632, 148, 18);
      ctx.fill();
      ctx.stroke();
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = acc;
    ctx.font = '800 13px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText((c.label || `FITUR 0${idx + 1}`).toUpperCase(), 72, cy + 38);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 22px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText((c.value || step.title || cleanDomain).slice(0, 38), 72, cy + 78);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 14px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(`${cleanDomain}${step.endpointPath || '/'} • ${c.badge || 'AKTIF'}`, 72, cy + 114);
  });

  // Register fallback canvas initially
  registerSatsetMediaAsset(mediaKey, canvas);

  // If the website crawl extracted a real image/screenshot (dataUrl or external URL), load it via CORS-safe proxy and register the real image!
  const rawCandidateMedia =
    step.screenshotDataUrl ||
    profile.discoveredMedia?.[stepIndex % Math.max(1, profile.discoveredMedia?.length || 1)]?.dataUrl ||
    profile.discoveredMedia?.[stepIndex % Math.max(1, profile.discoveredMedia?.length || 1)]?.url;

  const browserMediaSrc = toCorsSafeBrowserMediaUrl(rawCandidateMedia);

  if (
    browserMediaSrc &&
    typeof Image !== 'undefined' &&
    !browserMediaSrc.startsWith('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAE')
  ) {
    const realImg = new Image();
    realImg.crossOrigin = 'anonymous';
    realImg.onload = () => {
      try {
        // Draw the real scraped website image full-bleed onto the canvas AND register the image directly
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#070f20';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const imgW = realImg.naturalWidth || canvas.width;
        const imgH = realImg.naturalHeight || canvas.height;
        const scale = Math.max(canvas.width / imgW, canvas.height / imgH);
        const drawW = imgW * scale;
        const drawH = imgH * scale;
        const drawX = (canvas.width - drawW) / 2;
        const drawY = (canvas.height - drawH) / 2;
        ctx.drawImage(realImg, drawX, drawY, drawW, drawH);
        ctx.restore();

        registerSatsetMediaAsset(mediaKey, realImg);
      } catch {
        // Ignore cross-origin draw errors if external host blocks CORS
      }
    };
    realImg.src = browserMediaSrc;
  }

  let dataUrl = browserMediaSrc || '';
  if (!dataUrl) {
    try {
      if (typeof canvas.toDataURL === 'function') {
        const encoded = canvas.toDataURL('image/png');
        if (encoded && encoded.startsWith('data:image')) {
          dataUrl = encoded;
        }
      }
    } catch {
      // Ignore toDataURL errors in headless mock contexts
    }
  }

  return { mediaKey, dataUrl: dataUrl || step.screenshotDataUrl || '', focus, canvas };
}

/**
 * Ensures all steps in a WebsitePromoProfile have their scraped website media or snapshots
 * registered in satset-cloud-engine and attached to their corresponding scenes.
 */
export function ensureWebsitePromoSnapshotsRegistered(
  profile?: WebsitePromoProfile,
  scenes?: SatsetScene[]
): WebsitePromoProfile | undefined {
  if (!profile) return profile;

  const nonLogoMedia = (profile.discoveredMedia || []).filter((m) => Boolean(m.dataUrl || m.url));

  const updatedSteps = (profile.steps || []).map((step, idx) => {
    const discoveredForStep = nonLogoMedia.length > 0 ? nonLogoMedia[idx % nonLogoMedia.length] : undefined;
    const realStepMedia =
      step.screenshotDataUrl ||
      discoveredForStep?.dataUrl ||
      discoveredForStep?.url;
    const { mediaKey, dataUrl } = renderAuthenticWebsiteStepSnapshot(
      profile,
      { ...step, screenshotDataUrl: realStepMedia },
      idx
    );
    return {
      ...step,
      screenshotDataUrl: toCorsSafeBrowserMediaUrl(realStepMedia) || dataUrl || step.screenshotDataUrl,
      mediaKey,
    };
  });

  if (Array.isArray(scenes)) {
    scenes.forEach((sc, idx) => {
      const discoveredForScene = nonLogoMedia.length > 0 ? nonLogoMedia[idx % nonLogoMedia.length] : undefined;
      if (!sc.media_url && discoveredForScene) {
        sc.media_url = discoveredForScene.dataUrl || discoveredForScene.url;
        sc.media_type = discoveredForScene.type || 'image';
      }
      // If scene has real scraped or uploaded image/video URL, register it directly without overwriting!
      if (sc.media_url && (sc.media_type === 'image' || sc.media_type === 'video')) {
        sc.media_url = toCorsSafeBrowserMediaUrl(sc.media_url) || sc.media_url;
        registerSceneUploadedMediaAsset(sc);
        const focus = getStepFocusRegion(idx, updatedSteps[idx % Math.max(1, updatedSteps.length)]);
        sc.focus_region = sc.focus_region || {
          fx: focus.fx,
          fy: focus.fy,
          zoom: focus.zoom,
        };
        return;
      }
      const stepIdx = Math.min(updatedSteps.length - 1, Math.max(0, idx === 0 ? 0 : idx - 1));
      const matchedStep = updatedSteps[stepIdx] || updatedSteps[0];
      if (matchedStep) {
        const { mediaKey, dataUrl, focus } = renderAuthenticWebsiteStepSnapshot(profile, matchedStep, idx);
        sc.media_key = mediaKey;
        sc.media_type = matchedStep.screenshotDataUrl ? 'image' : 'website_snapshot';
        if (matchedStep.screenshotDataUrl || dataUrl) {
          sc.media_url = matchedStep.screenshotDataUrl || dataUrl;
        }
        if (sc.website_step && sc.media_url) {
          sc.website_step.screenshotDataUrl = sc.media_url;
        }
        sc.focus_region = sc.focus_region || {
          fx: focus.fx,
          fy: focus.fy,
          zoom: focus.zoom,
        };
      }
    });
  }

  return {
    ...profile,
    steps: updatedSteps,
  };
}

/**
 * Registers a scene's scraped or uploaded image or video URL into satset-cloud-engine's media registry
 * so `s.photo(scene.media_key, ...)` renders the real image or video on the canvas.
 */
export function registerSceneUploadedMediaAsset(scene: Partial<SatsetScene>): string | undefined {
  if (!scene.media_url) return scene.media_key;
  const key = scene.media_key || `user_media_s${scene.nomor || scene.scene_number || scene.id || 1}`;
  scene.media_key = key;
  const safeSrc = toCorsSafeBrowserMediaUrl(scene.media_url) || scene.media_url;

  if (typeof document === 'undefined' || typeof Image === 'undefined') return key;
  const existing = getSatsetMediaAsset(key);
  if (existing && (existing.src === safeSrc || existing.src === scene.media_url)) {
    return key;
  }

  if (scene.media_type === 'video') {
    const video = document.createElement('video');
    video.src = safeSrc;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.onloadeddata = () => {
      registerSatsetMediaAsset(key, video);
      video.play().catch(() => {});
    };
    video.onerror = () => {
      if (safeSrc !== scene.media_url && scene.media_url) {
        video.src = scene.media_url;
      }
    };
    if (!existing) {
      registerSatsetMediaAsset(key, video);
    }
    return key;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    if (img.naturalWidth > 0) {
      registerSatsetMediaAsset(key, img);
    }
  };
  img.onerror = () => {
    if (safeSrc !== scene.media_url && scene.media_url) {
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        if (fallbackImg.naturalWidth > 0) {
          registerSatsetMediaAsset(key, fallbackImg);
        }
      };
      fallbackImg.src = scene.media_url;
    }
  };
  img.src = safeSrc;
  if (!existing || (img.complete && img.naturalWidth > 0)) {
    registerSatsetMediaAsset(key, img);
  }
  return key;
}

export interface ResolvedAssetMotionPlan {
  preset: import('../types/satset.ts').AssetMotionPreset;
  promptText: string;
  label: string;
  entryDirection: 'bottom' | 'top' | 'left' | 'right' | 'scale';
  springType: 'bouncy' | 'snappy' | 'smooth' | 'heavy';
  orbit3dAmp: number;
  tiltAngleRad: number;
  floatAmpPx: number;
  floatFreq: number;
  zoomStart: number;
  zoomPeak: number;
  hasScanline: boolean;
  hasGlowAura: boolean;
  hasParticles: boolean;
  has3dSatellites: boolean;
  hasShakeImpact: boolean;
  hasCalloutPointer: boolean;
  layoutMode: 'hero_stage' | 'split_showcase' | 'floating_holo';
}

export const ASSET_MOTION_PRESET_OPTIONS: Array<{
  id: import('../types/satset.ts').AssetMotionPreset;
  label: string;
  shortDesc: string;
  samplePrompt: string;
}> = [
  {
    id: 'auto_concept',
    label: 'Otomatis Sesuai Konsep Bahasan',
    shortDesc: 'Gerakan Remotion 3D menyesuaikan isi kalimat, emosi, dan ketukan kata kunci di setiap scene.',
    samplePrompt: 'Bergerak otomatis mengikuti konsep bahasan, masuk dengan pegas 3D lalu menyorot bagian penting saat dibahas.',
  },
  {
    id: 'orbit_3d',
    label: '3D Perspective Orbit & Tilt',
    shortDesc: 'Aset tampil sebagai panel 3D tebal yang berputar miring perspektif dengan objek 3D mengorbit.',
    samplePrompt: 'Masuk sebagai kartu 3D bervolume yang berputar miring perspektif dengan cincin dan kubus 3D mengorbit di sekitarnya.',
  },
  {
    id: 'spring_pop',
    label: 'Spring Bounce & Pop-Out Hidup',
    shortDesc: 'Muncul membal elastis dengan ledakan partikel dan ikut memantul saat kata penekanan diucapkan.',
    samplePrompt: 'Muncul membal elastis dari bawah dengan ledakan partikel dan memantul mengikuti ketukan suara narator.',
  },
  {
    id: 'parallax_scan',
    label: 'Parallax Pan & Sorot Fokus',
    shortDesc: 'Kamera menyapu parallax di atas aset sambil memindai fokus dengan garis cahaya biru & panah callout.',
    samplePrompt: 'Bergeser parallax halus sambil disorot garis pemindai biru dan kamera zoom ke titik fokus utama.',
  },
  {
    id: 'float_wave',
    label: 'Melayang Halus & Gelombang Aura',
    shortDesc: 'Aset melayang lembut di ruang 3D dengan cincin aura bercahaya yang bernapas mengikuti tempo.',
    samplePrompt: 'Melayang halus naik-turun di udara dengan pendaran cahaya biru yang bernapas lembut.',
  },
  {
    id: 'zoom_impact',
    label: 'Zoom Fokus & Hentakan Beat',
    shortDesc: 'Zoom dramatis mendekat ke detail aset disertai hentakan kamera saat klimaks kalimat.',
    samplePrompt: 'Zoom cepat mendekat ke detail penting aset disertai hentakan energi dan tanda sorotan.',
  },
  {
    id: 'custom',
    label: 'Prompt Gerakan Sendiri',
    shortDesc: 'Tulis bebas bagaimana asetmu bergerak, berputar, membal, atau berinteraksi di video Remotion.',
    samplePrompt: 'Masuk melayang 3D dari bawah lalu berputar miring sambil disorot cahaya biru dan zoom saat poin utama disebut.',
  },
];

/**
 * Automatically infers the most fitting Remotion motion preset, choreography description,
 * and camera focus region for an uploaded asset based on its edited name, scene narration,
 * video topic, and selected Remotion style.
 */
export function inferAutoMotionForAssetAndScene(
  assetName?: string,
  sceneText?: string,
  topic?: string,
  styleId?: string,
  assetIndex = 0
): {
  preset: import('../types/satset.ts').AssetMotionPreset;
  prompt: string;
  focusRegion: { fx: number; fy: number; x: number; y: number; zoom: number; label?: string };
} {
  const cleanName = String(assetName || `Aset Visual #${assetIndex + 1}`)
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim() || `Aset Visual #${assetIndex + 1}`;

  const combined = `${cleanName} ${sceneText || ''} ${topic || ''} ${styleId || ''}`.toLowerCase();

  let preset: import('../types/satset.ts').AssetMotionPreset = 'orbit_3d';
  let prompt = `Orbit 3D & tilt perspektif menampilkan "${cleanName}" selaras dengan alur narasi`;
  let zoom = 1.18;

  if (/\b(dashboard|tabel|grafik|chart|statistik|data|laporan|mutasi|website|halaman|kode|sistem|ui|analitik|angka|rupiah|omzet|profit)\b/.test(combined)) {
    preset = 'parallax_scan';
    prompt = `Scan kamera parallax & sorot area penting pada "${cleanName}" mengikuti penjelasan narator`;
    zoom = 1.22;
  } else if (/\b(produk|3d|kemasan|botol|box|mockup|gadget|hp|laptop|perangkat|showcase|studio_3d|voxel)\b/.test(combined)) {
    preset = 'orbit_3d';
    prompt = `Masuk melayang 3D lalu berputar miring (orbit 3D) memamerkan "${cleanName}" di panggung utama`;
    zoom = 1.2;
  } else if (/\b(bukti|hasil|harga|promo|diskon|rekor|penting|rahasia|kaget|fokus|awas|jangan|stop|testimoni|viral)\b/.test(combined)) {
    preset = 'zoom_impact';
    prompt = `Zoom punch-in dramatis ke titik fokus "${cleanName}" dengan aksen partikel saat kata kunci diucapkan`;
    zoom = 1.28;
  } else if (/\b(langkah|step|cara|tutorial|proses|daftar|fitur|menu|tombol|klik|panduan|tips)\b/.test(combined)) {
    preset = 'spring_pop';
    prompt = `Pop-in berpegas (spring bounce) memunculkan "${cleanName}" secara dinamis mengikuti ketukan kalimat`;
    zoom = 1.16;
  } else if (/\b(cerita|kisah|suasana|latar|ilustrasi|santai|tenang|foto|momen|kenangan)\b/.test(combined)) {
    preset = 'float_wave';
    prompt = `Melayang halus (floating wave) dengan ayunan organik dan aura lembut pada "${cleanName}"`;
    zoom = 1.14;
  } else {
    const cycle: Array<import('../types/satset.ts').AssetMotionPreset> = [
      'orbit_3d',
      'parallax_scan',
      'spring_pop',
      'zoom_impact',
      'float_wave',
    ];
    preset = cycle[assetIndex % cycle.length];
    if (preset === 'parallax_scan') {
      prompt = `Scan kamera parallax menyorot detail "${cleanName}" selaras dengan topik video`;
    } else if (preset === 'spring_pop') {
      prompt = `Pop-in berpegas (spring bounce) menampilkan "${cleanName}" tepat pada ketukan narasi`;
    } else if (preset === 'zoom_impact') {
      prompt = `Zoom fokus bertahap menonjolkan "${cleanName}" sebagai bukti visual utama`;
    } else if (preset === 'float_wave') {
      prompt = `Gerakan melayang halus (floating wave) menjaga "${cleanName}" tetap hidup di layar`;
    }
  }

  const focusX = assetIndex % 3 === 0 ? 0.5 : assetIndex % 3 === 1 ? 0.46 : 0.54;
  const focusY = assetIndex % 2 === 0 ? 0.44 : 0.48;

  return {
    preset,
    prompt,
    focusRegion: {
      fx: focusX,
      fy: focusY,
      x: focusX,
      y: focusY,
      zoom,
      label: cleanName.slice(0, 36),
    },
  };
}

/**
 * Automatically matches user-uploaded assets (using their edited asset names) to the most
 * contextually relevant scenes in the script, and assigns AI-tailored motion choreography.
 */
export function autoMatchUploadedAssetsToScenes(
  uploadedMedia: import('../types/satset.ts').UploadedTutorialMediaItem[] | undefined,
  scenes: SatsetScene[],
  topic?: string,
  styleId?: string
): SatsetScene[] {
  if (!Array.isArray(scenes) || scenes.length === 0) return scenes;
  if (!Array.isArray(uploadedMedia) || uploadedMedia.length === 0) return scenes;

  const stopWords = new Set([
    'png', 'jpg', 'jpeg', 'webp', 'gif', 'mp4', 'webm', 'mov',
    'image', 'video', 'img', 'foto', 'gambar', 'aset', 'asset',
    'screenshot', 'screen', 'shot', 'file', 'upload', 'dan', 'yang',
    'di', 'ke', 'dari', 'untuk', 'pada', 'dengan', 'ini', 'itu',
  ]);

  const extractTokens = (str: string): string[] =>
    String(str || '')
      .toLowerCase()
      .replace(/\.[a-z0-9]{2,5}$/i, '')
      .split(/[^a-z0-9]+/i)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2 && !stopWords.has(t));

  // Register all uploaded media into the cloud/canvas asset registry
  for (const item of uploadedMedia) {
    if (item.key && (item.url || item.dataUrl)) {
      registerSatsetMediaAsset(item.key, {
        type: item.type,
        url: item.url || item.dataUrl || '',
        filename: item.name || item.stepTitle || item.filename,
        durationSec: item.durationSec,
      });
    }
  }

  // Clear stale auto-assigned user-media-* keys on scenes before re-matching
  const nextScenes: SatsetScene[] = scenes.map((sc) => {
    const isUploadedKey = sc.media_key && uploadedMedia.some((u) => u.key === sc.media_key);
    if (!isUploadedKey && sc.media_key?.startsWith('user-media-')) {
      return {
        ...sc,
        media_key: undefined,
        media_url: undefined,
        media_type: undefined,
        media_filename: undefined,
        asset_motion_preset: undefined,
        asset_motion_prompt: undefined,
      };
    }
    return { ...sc };
  });

  const usedSceneIndices = new Set<number>();

  uploadedMedia.forEach((item, uIdx) => {
    const assetLabel = (item.name || item.stepTitle || item.filename || `Aset ${uIdx + 1}`).trim();
    const assetTokens = extractTokens(assetLabel);

    // 1. Check if a scene already explicitly references this item's key or filename from AI JSON
    let bestSceneIdx = nextScenes.findIndex(
      (sc, sIdx) =>
        !usedSceneIndices.has(sIdx) &&
        ((sc.media_key && sc.media_key === item.key) ||
          (sc.media_filename &&
            sc.media_filename.toLowerCase().trim() === assetLabel.toLowerCase().trim()))
    );

    // 2. Check explicit numeric targetSceneNumber if present and valid
    if (
      bestSceneIdx < 0 &&
      typeof item.targetSceneNumber === 'number' &&
      item.targetSceneNumber >= 1 &&
      item.targetSceneNumber <= nextScenes.length
    ) {
      const explicitIdx = item.targetSceneNumber - 1;
      if (!usedSceneIndices.has(explicitIdx)) {
        bestSceneIdx = explicitIdx;
      }
    }

    // 3. Semantic token matching between asset name and scene script/visual/headline
    if (bestSceneIdx < 0 && assetTokens.length > 0) {
      let bestScore = 0;
      for (let sIdx = 0; sIdx < nextScenes.length; sIdx++) {
        if (usedSceneIndices.has(sIdx)) continue;
        const sc = nextScenes[sIdx];
        const sceneCorpus = [
          sc.narration_text,
          sc.voiceScript,
          sc.on_screen_text,
          sc.headline,
          sc.visual,
          sc.visualDescription,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        let score = 0;
        for (const tok of assetTokens) {
          if (sceneCorpus.includes(tok)) {
            score += tok.length >= 5 ? 3 : 2;
          }
          // Check scene number mention in asset name (e.g., "scene 2", "langkah 3")
          if (tok === String(sIdx + 1)) {
            score += 4;
          }
        }
        if (/hook|pembuka|awal|cover/.test(assetLabel.toLowerCase()) && sIdx === 0) {
          score += 5;
        }
        if (/cta|penutup|akhir|promo|checkout/.test(assetLabel.toLowerCase()) && sIdx === nextScenes.length - 1) {
          score += 5;
        }

        if (score > bestScore) {
          bestScore = score;
          bestSceneIdx = sIdx;
        }
      }
    }

    // 4. Fallback: balanced distribution across available scenes
    if (bestSceneIdx < 0) {
      if (uploadedMedia.length === 1) {
        bestSceneIdx = 0;
      } else {
        const proportionalIdx = Math.min(
          nextScenes.length - 1,
          Math.floor((uIdx * nextScenes.length) / uploadedMedia.length)
        );
        if (!usedSceneIndices.has(proportionalIdx)) {
          bestSceneIdx = proportionalIdx;
        } else {
          const firstFree = nextScenes.findIndex((_, idx) => !usedSceneIndices.has(idx));
          bestSceneIdx = firstFree >= 0 ? firstFree : uIdx % nextScenes.length;
        }
      }
    }

    usedSceneIndices.add(bestSceneIdx);
    const targetScene = nextScenes[bestSceneIdx];
    const sceneText = [
      targetScene.narration_text,
      targetScene.on_screen_text,
      targetScene.visual,
    ]
      .filter(Boolean)
      .join(' ');

    const inferred = inferAutoMotionForAssetAndScene(
      assetLabel,
      sceneText,
      topic,
      styleId || targetScene.visualModule,
      uIdx
    );

    const updatedScene: SatsetScene = {
      ...targetScene,
      media_key: item.key,
      media_url: item.url || item.dataUrl,
      media_type: item.type,
      media_filename: assetLabel,
      asset_motion_preset:
        item.motionPreset && item.motionPreset !== 'auto_concept'
          ? item.motionPreset
          : inferred.preset,
      asset_motion_prompt:
        (item.motionPrompt && item.motionPrompt.trim()) || inferred.prompt,
      focus_region: targetScene.focus_region || inferred.focusRegion,
    };

    registerSceneUploadedMediaAsset(updatedScene);
    nextScenes[bestSceneIdx] = updatedScene;
  });

  return nextScenes;
}

/**
 * Resolves a concrete Remotion choreography plan for an uploaded asset based on
 * the scene's narrative concept AND the asset's name / AI-inferred motion plan.
 */
export function resolveAssetMotionPlan(
  scene: Partial<SatsetScene>,
  project?: Partial<SatsetProject>,
  sceneIndex = 0
): ResolvedAssetMotionPlan {
  const uploadedList = project?.uploaded_tutorial_media || [];
  const matchedUpload =
    uploadedList.find(
      (item) =>
        (scene.media_key && item.key === scene.media_key) ||
        (scene.media_url && item.url === scene.media_url) ||
        item.targetSceneNumber === (scene.scene_number || sceneIndex + 1)
    ) || uploadedList[sceneIndex % Math.max(1, uploadedList.length)];

  const assetName =
    scene.media_filename ||
    matchedUpload?.name ||
    matchedUpload?.stepTitle ||
    matchedUpload?.filename ||
    '';

  const sceneText = [
    scene.narration_text,
    scene.narasi,
    scene.voiceScript,
    scene.on_screen_text,
    scene.visual,
    scene.visualDescription,
  ]
    .filter(Boolean)
    .join(' ');

  const autoInferred = inferAutoMotionForAssetAndScene(
    assetName,
    sceneText,
    project?.topik_video || project?.project_title,
    scene.visualModule || project?.gaya_video,
    sceneIndex
  );

  const rawPreset =
    scene.asset_motion_preset ||
    matchedUpload?.motionPreset ||
    'auto_concept';
  const rawPrompt = (
    scene.asset_motion_prompt ||
    matchedUpload?.motionPrompt ||
    autoInferred.prompt ||
    ''
  ).trim();

  const effectivePreset =
    rawPreset === 'auto_concept' ? autoInferred.preset : rawPreset;

  const plan: ResolvedAssetMotionPlan = {
    preset: effectivePreset,
    promptText: rawPrompt,
    label:
      ASSET_MOTION_PRESET_OPTIONS.find((o) => o.id === effectivePreset)?.label ||
      'Otomatis Sesuai Konsep & Aset',
    entryDirection: sceneIndex % 2 === 0 ? 'bottom' : 'right',
    springType: 'bouncy',
    orbit3dAmp: effectivePreset === 'orbit_3d' ? 0.16 : 0.07,
    tiltAngleRad: effectivePreset === 'orbit_3d' ? (sceneIndex % 2 === 0 ? -0.055 : 0.055) : (sceneIndex % 2 === 0 ? -0.028 : 0.028),
    floatAmpPx: effectivePreset === 'float_wave' ? 11 : 6,
    floatFreq: effectivePreset === 'float_wave' ? 1.15 : 0.9,
    zoomStart: 1.02,
    zoomPeak: effectivePreset === 'zoom_impact' ? 1.28 : effectivePreset === 'parallax_scan' ? 1.2 : 1.14,
    hasScanline: effectivePreset === 'parallax_scan' || effectivePreset === 'orbit_3d',
    hasGlowAura: effectivePreset === 'float_wave' || effectivePreset === 'orbit_3d' || effectivePreset === 'zoom_impact',
    hasParticles: effectivePreset === 'spring_pop' || effectivePreset === 'zoom_impact',
    has3dSatellites: effectivePreset === 'orbit_3d' || effectivePreset === 'spring_pop',
    hasShakeImpact: effectivePreset === 'zoom_impact',
    hasCalloutPointer: true,
    layoutMode:
      effectivePreset === 'orbit_3d' || effectivePreset === 'zoom_impact'
        ? 'hero_stage'
        : effectivePreset === 'parallax_scan'
        ? 'floating_holo'
        : 'split_showcase',
  };

  // Parse natural-language custom motion prompt overrides if provided!
  if (rawPrompt) {
    const p = rawPrompt.toLowerCase();
    if (/kiri|left/.test(p)) plan.entryDirection = 'left';
    else if (/kanan|right/.test(p)) plan.entryDirection = 'right';
    else if (/atas|top|jatuh|turun/.test(p)) plan.entryDirection = 'top';
    else if (/bawah|bottom|naik|muncul/.test(p)) plan.entryDirection = 'bottom';
    else if (/tengah|pop|besar|scale/.test(p)) plan.entryDirection = 'scale';

    if (/putar|rotasi|orbit|3d|miring|flip|spin|tilt/.test(p)) {
      plan.orbit3dAmp = /cepat|kuat|ekstra|360/.test(p) ? 0.26 : 0.18;
      plan.tiltAngleRad = /kiri/.test(p) ? -0.08 : 0.08;
      plan.has3dSatellites = true;
      plan.layoutMode = 'hero_stage';
    }
    if (/membal|pantul|bounce|bouncy|pegas|elastis|loncat|lompat/.test(p)) {
      plan.springType = 'bouncy';
      plan.floatAmpPx = 12;
      plan.floatFreq = 1.65;
      plan.hasParticles = true;
    } else if (/halus|lembut|smooth|tenang|pelan|slow/.test(p)) {
      plan.springType = 'smooth';
      plan.floatAmpPx = 8;
      plan.floatFreq = 0.72;
    } else if (/berat|heavy|jatuh|hantam|thud/.test(p)) {
      plan.springType = 'heavy';
      plan.hasShakeImpact = true;
    }

    if (/zoom|perbesar|dekat|fokus|close[\s-]?up|sorot/.test(p)) {
      plan.zoomPeak = /sangat|ekstra|maksimal|kuat/.test(p) ? 1.35 : 1.26;
      plan.hasCalloutPointer = true;
    }
    if (/scan|pindai|radar|laser|garis|hud|hologram/.test(p)) {
      plan.hasScanline = true;
      plan.layoutMode = 'floating_holo';
    }
    if (/cahaya|glow|neon|sinar|aura|menyala/.test(p)) {
      plan.hasGlowAura = true;
    }
    if (/partikel|meledak|burst|kembang api|spark|kilau/.test(p)) {
      plan.hasParticles = true;
    }
    if (/getar|shake|goyang|gempa|hentak|impact/.test(p)) {
      plan.hasShakeImpact = true;
    }
    if (/melayang|float|terbang|ambang|gelombang|wave/.test(p)) {
      plan.floatAmpPx = Math.max(plan.floatAmpPx, 13);
      plan.floatFreq = 1.25;
    }
    if (/penuh|utama|besar|tengah|hero/.test(p)) {
      plan.layoutMode = 'hero_stage';
    }
  }

  return plan;
}

/**
 * Generates executable Satset/Remotion Canvas 2.5D/3D choreography code for an uploaded asset
 * so the asset is animated as a living part of the scene (3D perspective slab, spring physics,
 * scanline, orbiting 3D props, callout tags, and beat-synced reactions) instead of a static sticker.
 */
export function buildExecutableAssetMotionSnippet(params: {
  mediaKey: string;
  scene: Partial<SatsetScene>;
  project?: Partial<SatsetProject>;
  sceneIndex: number;
  dur: number;
  headlineText?: string;
  subTagText?: string;
  mode?: 'primary_stage' | 'companion_stage';
}): string {
  const {
    mediaKey,
    scene,
    project,
    sceneIndex,
    dur,
    headlineText,
    subTagText,
    mode = 'companion_stage',
  } = params;

  const safeKey = String(mediaKey || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  if (!safeKey) return '';

  const plan = resolveAssetMotionPlan(scene, project, sceneIndex);
  const cleanTitle = String(
    headlineText ||
      scene.on_screen_text ||
      scene.hookText ||
      scene.media_filename ||
      `POIN ${sceneIndex + 1}`
  )
    .replace(/\.[^.]+$/, '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .slice(0, 26)
    .toUpperCase();

  const cleanSub = String(
    plan.promptText
      ? plan.promptText.slice(0, 32)
      : subTagText || plan.label
  )
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .slice(0, 32);

  const fx = Number((scene.focus_region?.fx ?? 0.5).toFixed(2));
  const fy = Number((scene.focus_region?.fy ?? 0.45).toFixed(2));

  const isHeroStage = mode === 'primary_stage' || plan.layoutMode === 'hero_stage';
  const offsetXExpr =
    plan.entryDirection === 'left'
      ? '-(1 - kAssetEnter) * 220 * sc'
      : plan.entryDirection === 'right'
      ? '(1 - kAssetEnter) * 220 * sc'
      : '0';
  const offsetYExpr =
    plan.entryDirection === 'top'
      ? '-(1 - kAssetEnter) * 210 * sc'
      : plan.entryDirection === 'bottom'
      ? '(1 - kAssetEnter) * 185 * sc'
      : '0';

  return `
// === Living Remotion Asset Choreography (${plan.preset}${plan.promptText ? `: ${cleanSub}` : ''}) ===
(() => {
  const W = s.W || 720, H = s.H || 1280, sc = Math.min(W / 720, H / 1280);
  const bEnter = typeof beat1 !== "undefined" ? beat1 + 0.06 : 0.08;
  const bFocus = typeof beat2 !== "undefined" ? beat2 : ${Math.max(0.45, dur * 0.25).toFixed(2)};
  const bClimax = typeof beat3 !== "undefined" ? beat3 : ${Math.max(0.95, dur * 0.52).toFixed(2)};
  const bPayoff = typeof beat4 !== "undefined" ? beat4 : ${Math.max(1.45, dur * 0.74).toFixed(2)};

  const kAssetEnter = Math.max(0.01, s.spring(bEnter, "${plan.springType}"));
  const kFocus = s.t < bFocus ? 0 : s.spring(bFocus, "snappy");
  const kClimax = s.t < bClimax ? 0 : s.spring(bClimax, "bouncy");
  const kPayoff = s.t < bPayoff ? 0 : s.spring(bPayoff, "snappy");

  const cardW = ${isHeroStage ? '310' : '256'} * sc;
  const cardH = ${isHeroStage ? '210' : '168'} * sc;
  const baseX = ${isHeroStage ? 'W * 0.5' : sceneIndex % 2 === 0 ? 'W * 0.64' : 'W * 0.36'};
  const baseY = ${isHeroStage ? 'H * 0.37' : 'H * 0.28'};

  const floatY = s.wave(${plan.floatFreq.toFixed(2)}, ${plan.floatAmpPx.toFixed(1)} * sc);
  const floatX = s.wave(${(plan.floatFreq * 0.65).toFixed(2)}, ${(plan.floatAmpPx * 0.45).toFixed(1)} * sc, 1.2);
  const shakeX = ${plan.hasShakeImpact ? 'kClimax > 0.05 && s.t < bClimax + 0.45 ? s.wave(24, 6 * sc) : 0' : '0'};
  const shakeY = ${plan.hasShakeImpact ? 'kClimax > 0.05 && s.t < bClimax + 0.45 ? s.wave(28, 4 * sc, 0.8) : 0' : '0'};

  const posX = baseX + (${offsetXExpr}) + floatX + shakeX;
  const posY = baseY + (${offsetYExpr}) + floatY + shakeY;

  // 3D Perspective Orbit & Beat Scale
  const orbitWave = s.wave(0.85, ${plan.orbit3dAmp.toFixed(3)});
  const perspScaleX = Math.max(0.76, Math.cos(orbitWave) * (0.88 + 0.12 * Math.min(1.15, kAssetEnter)));
  const beatBoost = 1 + (kClimax > 0 && s.t < bClimax + 0.55 ? Math.sin(s.clamp((s.t - bClimax) / 0.55, 0, 1) * Math.PI) * 0.085 : 0);
  const totalScale = Math.max(0.08, Math.min(1.18, kAssetEnter)) * beatBoost;
  const rotAngle = ${plan.tiltAngleRad.toFixed(4)} + s.wave(0.7, ${(plan.orbit3dAmp * 0.35).toFixed(4)});
  const depthShiftX = Math.sin(orbitWave) * 14 * sc;
  const depthShiftY = 8 * sc;

  // Dynamic Floor Shadow reactive to levitation height
  s.shadow(posX, posY + cardH * 0.58 + 18 * sc, cardW * 0.46 * Math.min(1, kAssetEnter), cardW * 0.11 * Math.min(1, kAssetEnter), 0.24 * Math.min(1, kAssetEnter));

  ${
    plan.hasGlowAura
      ? `// Breathing 3D Aura Rings behind Asset
  const auraR = (cardW * 0.58) * (0.94 + s.wave(1.4, 0.06));
  s.circle(posX, posY, auraR * Math.min(1, kAssetEnter), { fill: "none", stroke: s.c.brand2, width: 2.2 * sc, dash: [8 * sc, 6 * sc], alpha: 0.42 * Math.min(1, kAssetEnter) });
  s.rays(posX, posY, cardW * 0.48, cardW * 0.64, 10, { stroke: s.c.brand3, width: 2.2 * sc, alpha: 0.38 * Math.min(1, kClimax) });`
      : ''
  }

  s.group({ x: posX, y: posY, scaleX: totalScale * perspScaleX, scaleY: totalScale, rotate: rotAngle }, () => {
    // 3D Extruded Backing Plate for true volumetric depth
    s.rect(-cardW * 0.5 + depthShiftX - 8 * sc, -cardH * 0.5 + depthShiftY - 8 * sc, cardW + 16 * sc, cardH + 42 * sc, {
      r: 20 * sc,
      fill: "#09152e",
      stroke: s.c.brand2,
      width: 2 * sc,
      alpha: 0.92,
    });

    // Main Showcase Card Surface
    s.card(-cardW * 0.5 - 8 * sc, -cardH * 0.5 - 8 * sc, cardW + 16 * sc, cardH + 42 * sc, {
      r: 18 * sc,
      fill: "#0f172a",
      stroke: kClimax > 0.2 ? s.c.brand3 : s.c.brand1,
      width: 3.2 * sc,
      shadow: 10 * sc,
    });

    // Top Studio Header Dots inside Card
    s.circle(-cardW * 0.5 + 10 * sc, -cardH * 0.5 + 4 * sc, 3.5 * sc, { fill: "#ef4444" });
    s.circle(-cardW * 0.5 + 21 * sc, -cardH * 0.5 + 4 * sc, 3.5 * sc, { fill: "#f59e0b" });
    s.circle(-cardW * 0.5 + 32 * sc, -cardH * 0.5 + 4 * sc, 3.5 * sc, { fill: "#10b981" });

    // Living Ken Burns Zoom & Focus Pan inside Uploaded Media
    const zoomProg = s.ease.inOut(s.clamp((s.t - bEnter) / ${Math.max(1.2, dur * 0.72).toFixed(2)}, 0, 1));
    const liveZoom = ${plan.zoomStart.toFixed(2)} + zoomProg * ${(plan.zoomPeak - plan.zoomStart).toFixed(2)} + (kClimax > 0.1 ? 0.05 : 0);
    s.photo("${safeKey}", 0, 6 * sc, cardW - 4 * sc, cardH - 12 * sc, {
      frame: "none",
      r: 12 * sc,
      zoom: liveZoom,
      fx: ${fx},
      fy: ${fy},
      draw: Math.min(1, kAssetEnter),
      time: s.t,
    });

    ${
      plan.hasScanline
        ? `// Animated Laser Scanline Sweep across Uploaded Asset
    const scanY = -cardH * 0.42 + ((s.t * 0.68) % 1) * (cardH * 0.84);
    s.line(-cardW * 0.46, scanY, cardW * 0.46, scanY, { stroke: "#38bdf8", width: 2.4 * sc, alpha: 0.78 });`
        : ''
    }

    // Bottom Caption Strip inside 3D Card
    s.text("${cleanTitle}", 0, cardH * 0.5 + 16 * sc, {
      size: Math.round(13.5 * sc),
      color: "#f8fafc",
      weight: 800,
    });
  });

  ${
    plan.has3dSatellites
      ? `// Orbiting 3D Geometric Satellites around Uploaded Asset
  if (kFocus > 0.02) {
    const sat1X = posX - cardW * 0.56 + s.wave(1.1, 8 * sc);
    const sat1Y = posY - cardH * 0.36 + s.wave(1.4, 10 * sc, 0.7);
    s.cube(sat1X, sat1Y, 26 * sc * Math.min(1, kFocus), {
      fill: s.c.brand1,
      rx: 0.4 + s.t * 0.8,
      ry: 0.6 + s.t * 1.1,
      draw: Math.min(1, kFocus),
    });
    const sat2X = posX + cardW * 0.56 + s.wave(1.2, 8 * sc, 1.5);
    const sat2Y = posY + cardH * 0.28 + s.wave(1.3, 9 * sc, 2.1);
    s.extrude(sat2X, sat2Y, s.shapes.star(18 * sc, 8 * sc, 5), 10 * sc, {
      fill: s.c.brand3,
      rx: 0.3,
      ry: s.t * 1.3,
      scale: Math.min(1, kClimax > 0.05 ? kClimax : kFocus),
    });
  }`
      : ''
  }

  ${
    plan.hasCalloutPointer
      ? `// Beat-Synced Callout Badge & Animated Pointer Arrow
  if (kFocus > 0.05) {
    const badgeX = posX + (${sceneIndex % 2 === 0 ? '-cardW * 0.34' : 'cardW * 0.34'});
    const badgeY = posY - cardH * 0.58 - 18 * sc;
    s.tag("${cleanSub}", badgeX, badgeY, {
      fill: s.c.brand1,
      color: "#ffffff",
      size: Math.round(15 * sc),
      scale: Math.min(1.06, kFocus),
    });
    s.arrow(badgeX, badgeY + 16 * sc, posX + (${(fx - 0.5) * 40} * sc), posY - cardH * 0.18, {
      stroke: s.c.brand3,
      width: 3 * sc,
      curve: ${sceneIndex % 2 === 0 ? '0.22' : '-0.22'},
      draw: Math.min(1, kFocus),
    });
  }`
      : ''
  }

  ${
    plan.hasParticles
      ? `// Climax Particle Burst & Check Badge on Emphasis Beat
  if (kClimax > 0.05) {
    s.burst(posX, posY, bClimax, { count: 12, r1: cardW * 0.25, r2: cardW * 0.68, size: 5.5 * sc, color: s.c.brand3 });
  }`
      : ''
  }
  if (kPayoff > 0.05) {
    const chkX = posX + cardW * 0.46, chkY = posY - cardH * 0.44;
    s.circle(chkX, chkY, 17 * sc * Math.min(1, kPayoff), { fill: "#10b981", stroke: "#ffffff", width: 2.5 * sc, draw: Math.min(1, kPayoff) });
    s.check(chkX, chkY, 14 * sc, { stroke: "#ffffff", width: 3.5 * sc, draw: Math.min(1, kPayoff) });
  }
})();`;
}

/**
 * Processes user-uploaded image/video files for Remotion asset choreography & tutorial video auto-editing:
 * - Loads each file into an HTMLImageElement or HTMLVideoElement
 * - Registers it in satset-cloud-engine via `registerSatsetMediaAsset`
 * - Returns the uploaded media items ready to attach to scenes with Remotion motion presets
 */
export async function processUploadedTutorialMediaFiles(
  files: FileList | File[],
  _project?: SatsetProject
): Promise<UploadedTutorialMediaItem[]> {
  const fileArray = Array.from(files || []);
  const newItems: UploadedTutorialMediaItem[] = [];

  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name);
    const url = URL.createObjectURL(file);
    const key = `tutorial_upload_${Date.now()}_${i + 1}`;
    const cleanStepTitle = file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .slice(0, 36);

    let durationSec = 5.5;
    let width = 1080;
    let height = 1920;
    let dataUrl: string | undefined;

    if (typeof document !== 'undefined') {
      if (isVideo) {
        const video = document.createElement('video');
        video.src = url;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'metadata';
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, 1200);
          video.onloadedmetadata = () => {
            clearTimeout(timer);
            durationSec = Math.max(4, Math.min(10, Number((video.duration || 5.5).toFixed(1))));
            width = video.videoWidth || 1080;
            height = video.videoHeight || 1920;
            video.play().catch(() => {});
            resolve();
          };
          video.onerror = () => {
            clearTimeout(timer);
            resolve();
          };
        });
        registerSatsetMediaAsset(key, video);
      } else {
        if (typeof FileReader !== 'undefined' && file.size <= 4 * 1024 * 1024) {
          dataUrl = await new Promise<string | undefined>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : undefined);
            reader.onerror = () => resolve(undefined);
            reader.readAsDataURL(file);
          });
        }
        const img = new Image();
        img.src = dataUrl || url;
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, 1000);
          img.onload = () => {
            clearTimeout(timer);
            width = img.naturalWidth || 1080;
            height = img.naturalHeight || 1920;
            resolve();
          };
          img.onerror = () => {
            clearTimeout(timer);
            resolve();
          };
        });
        registerSatsetMediaAsset(key, img);
      }
    }

    newItems.push({
      id: `upload-${Date.now()}-${i + 1}`,
      key,
      mediaKey: key,
      url: dataUrl || url,
      dataUrl,
      type: isVideo ? 'video' : 'image',
      filename: file.name,
      name: file.name,
      durationSec,
      stepTitle: cleanStepTitle || `Aset Visual ${i + 1}`,
      width,
      height,
      motionPreset: 'auto_concept',
      motionPrompt: '',
      targetSceneNumber: 'auto',
    });
  }

  return newItems;
}



import {
  SatsetProject,
  SatsetScene,
  UploadedTutorialMediaItem,
  WebsitePromoProfile,
  WebsitePromoStep,
} from '../types/satset';
import {
  getSatsetMediaAsset,
  registerSatsetMediaAsset,
} from './satset-cloud-engine';

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
  profileOrStepVisual: WebsitePromoProfile | import('../types/satset').WebsiteStepVisual,
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
            url: (profileOrStepVisual as import('../types/satset').WebsiteStepVisual).urlDisplay || 'https://website.id',
            domain: ((profileOrStepVisual as import('../types/satset').WebsiteStepVisual).urlDisplay || 'website.id').replace(/^https?:\/\//i, '').split('/')[0],
            brandName: (profileOrStepVisual as import('../types/satset').WebsiteStepVisual).brandName || 'Website',
            tagline: (profileOrStepVisual as import('../types/satset').WebsiteStepVisual).screenSubtitle || '',
            description: (profileOrStepVisual as import('../types/satset').WebsiteStepVisual).screenSubtitle || '',
            category: 'saas',
            primaryColor: (profileOrStepVisual as import('../types/satset').WebsiteStepVisual).primaryColor || '#2563EB',
            secondaryColor: (profileOrStepVisual as import('../types/satset').WebsiteStepVisual).secondaryColor || '#38BDF8',
            accentColor: (profileOrStepVisual as import('../types/satset').WebsiteStepVisual).accentColor || '#10B981',
            metrics: [],
            steps: [],
            channels: [],
            pricing: '',
            ctaText: (profileOrStepVisual as import('../types/satset').WebsiteStepVisual).actionLabel || 'Mulai Sekarang',
          });

  const step: Partial<WebsitePromoStep> = isFirstProfile
    ? (stepOrProfile as Partial<WebsitePromoStep>) || {}
    : {
        stepBadge: (profileOrStepVisual as import('../types/satset').WebsiteStepVisual).stepBadge,
        title: (profileOrStepVisual as import('../types/satset').WebsiteStepVisual).screenTitle,
        subtitle: (profileOrStepVisual as import('../types/satset').WebsiteStepVisual).screenSubtitle,
        description: (profileOrStepVisual as import('../types/satset').WebsiteStepVisual).screenSubtitle,
        highlightText: (profileOrStepVisual as import('../types/satset').WebsiteStepVisual).highlightMetric,
        metric: (profileOrStepVisual as import('../types/satset').WebsiteStepVisual).highlightMetric,
        actionLabel: (profileOrStepVisual as import('../types/satset').WebsiteStepVisual).actionLabel,
        layoutVariant: (profileOrStepVisual as import('../types/satset').WebsiteStepVisual).layoutVariant,
        cards: (profileOrStepVisual as import('../types/satset').WebsiteStepVisual).uiCards || [],
        screenshotDataUrl: (profileOrStepVisual as import('../types/satset').WebsiteStepVisual).screenshotDataUrl,
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

/**
 * Processes user-uploaded image/video files for tutorial video auto-editing:
 * - Loads each file into an HTMLImageElement or HTMLVideoElement
 * - Registers it in satset-cloud-engine via `registerSatsetMediaAsset`
 * - Returns the uploaded media items ready to attach to scenes
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
        const img = new Image();
        img.src = url;
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
      url,
      type: isVideo ? 'video' : 'image',
      filename: file.name,
      durationSec,
      stepTitle: cleanStepTitle || `Langkah Tutorial ${i + 1}`,
      width,
      height,
    });
  }

  return newItems;
}


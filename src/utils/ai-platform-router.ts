import { SatsetProject } from '../types/satset';

export type AiPlatformId =
  | 'claude'
  | 'chatgpt'
  | 'gemini'
  | 'perplexity'
  | 'deepseek'
  | 'grok';

export interface AiPlatformOption {
  id: AiPlatformId;
  name: string;
  tagline: string;
  badge: string;
  accentHex: string;
  supportsQueryPrefill: boolean;
}

export interface PromptMediaAttachment {
  id: string;
  key: string;
  filename: string;
  type: 'image' | 'video';
  url: string;
  sceneHint?: string;
}

export const AI_PLATFORMS: AiPlatformOption[] = [
  {
    id: 'claude',
    name: 'Claude AI',
    tagline: 'Unggul untuk penulisan kode Remotion & JSON terstruktur',
    badge: 'Coding & JSON',
    accentHex: '#D97757',
    supportsQueryPrefill: true,
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    tagline: 'Cepat, responsif, dan mendukung tempel gambar langsung',
    badge: 'Populer',
    accentHex: '#10A37F',
    supportsQueryPrefill: true,
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    tagline: 'Multimodal gambar/video & pemahaman bahasa Indonesia alami',
    badge: 'Multimodal',
    accentHex: '#4285F4',
    supportsQueryPrefill: true,
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    tagline: 'Cocok untuk riset topik berbasis data & sumber web nyata',
    badge: 'Riset Web',
    accentHex: '#20B2AA',
    supportsQueryPrefill: true,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    tagline: 'Logika kuat untuk generasi kode — prompt disalin otomatis',
    badge: 'Logika & Kode',
    accentHex: '#4D6BFE',
    supportsQueryPrefill: false,
  },
  {
    id: 'grok',
    name: 'Grok',
    tagline: 'Gaya penyampaian santai, cepat, dan eksploratif',
    badge: 'Eksploratif',
    accentHex: '#1D9BF0',
    supportsQueryPrefill: true,
  },
];

const MAX_URL_PROMPT_CHARS = 12000;

/**
 * Collects all configured images/media from project uploads, per-scene media,
 * website promo snapshots, and any extra modal reference images without duplicates.
 */
export function collectProjectPromptImages(
  project?: Partial<SatsetProject> | null,
  sceneRange?: { start: number; end: number },
  extraImages?: PromptMediaAttachment[]
): PromptMediaAttachment[] {
  const results: PromptMediaAttachment[] = [];
  const seenKeys = new Set<string>();

  const pushUnique = (item: PromptMediaAttachment) => {
    const dedupeKey = `${item.key || ''}::${item.filename}::${(item.url || '').slice(0, 64)}`;
    if (!item.url || seenKeys.has(dedupeKey)) return;
    seenKeys.add(dedupeKey);
    results.push(item);
  };

  if (Array.isArray(extraImages)) {
    for (const img of extraImages) {
      pushUnique(img);
    }
  }

  if (project) {
    const uploads = Array.isArray(project.uploaded_tutorial_media)
      ? project.uploaded_tutorial_media
      : [];
    uploads.forEach((u, idx) => {
      const explicitSceneMatch =
        typeof u.stepTitle === 'string' ? u.stepTitle.match(/\bScene\s*(\d+)/i) : null;
      const targetScene = explicitSceneMatch ? Number(explicitSceneMatch[1]) : idx + 1;
      if (sceneRange && (targetScene < sceneRange.start || targetScene > sceneRange.end)) {
        return;
      }
      const srcUrl = u.dataUrl || u.url || '';
      if (!srcUrl) return;
      pushUnique({
        id: u.id || `upload-${idx + 1}`,
        key: u.key || u.mediaKey || `uploaded_media_${idx + 1}`,
        filename: u.filename || u.name || `media_${idx + 1}`,
        type: u.type === 'video' ? 'video' : 'image',
        url: srcUrl,
        sceneHint: u.stepTitle || `Scene ${targetScene}`,
      });
    });

    const scenes = Array.isArray(project.scenes) ? project.scenes : [];
    scenes.forEach((sc, idx) => {
      const num = sc.scene_number || idx + 1;
      if (sceneRange && (num < sceneRange.start || num > sceneRange.end)) {
        return;
      }
      const srcUrl = sc.media_url || sc.website_step?.screenshotDataUrl || '';
      if (!srcUrl) return;
      pushUnique({
        id: `scene-media-${num}`,
        key: sc.media_key || `scene_media_${num}`,
        filename: sc.media_filename || sc.website_step?.screenTitle || `scene_${num}.png`,
        type: sc.media_type === 'video' ? 'video' : 'image',
        url: srcUrl,
        sceneHint: `Scene ${num}`,
      });
    });

    const discovered = Array.isArray(project.website_promo?.discoveredMedia)
      ? project.website_promo!.discoveredMedia!
      : [];
    discovered.slice(0, 6).forEach((m, idx) => {
      const srcUrl = m.dataUrl || m.url || '';
      if (!srcUrl) return;
      pushUnique({
        id: `web-media-${idx + 1}`,
        key: `web_media_${idx + 1}`,
        filename: m.label || `web_asset_${idx + 1}`,
        type: m.type === 'video' ? 'video' : 'image',
        url: srcUrl,
        sceneHint: m.endpointPath || 'Referensi Website',
      });
    });
  }

  return results;
}

/**
 * Appends structured image/media instructions to any AI prompt when the user
 * has configured images or media assets, so the chosen AI incorporates them.
 */
export function enrichPromptWithMedia(
  basePrompt: string,
  mediaItems: PromptMediaAttachment[]
): string {
  const trimmed = (basePrompt || '').trim();
  if (!mediaItems || mediaItems.length === 0) return trimmed;
  if (trimmed.includes('## Gambar / Media yang Diatur')) return trimmed;

  const lines = mediaItems.map((m, i) => {
    const kind = m.type === 'video' ? 'Video' : 'Gambar';
    const hint = m.sceneHint ? ` (${m.sceneHint})` : '';
    return `${i + 1}. [${kind}] "${m.filename}"${hint} — media_key: "${m.key}" (pakai di kode dengan s.photo("${m.key}", x, y, w, h, { frame: "browser", draw: s.pop(0.1, 0.35), time: s.t }))`;
  });

  return `${trimmed}

## Gambar / Media yang Diatur (${mediaItems.length} Aset)
Gunakan aset gambar/media di bawah ini sebagai referensi visual utama dan integrasikan secara proporsional ke dalam adegan/kode:
${lines.join('\n')}`;
}

/**
 * Builds the destination URL for the selected AI platform with URL-encoded prompt
 * capped safely for browser query limits (full prompt is always copied to clipboard).
 */
export function buildAiTargetUrl(
  platformId: AiPlatformId,
  promptText: string
): { url: string; supportsQueryPrefill: boolean; truncatedForUrl: boolean } {
  const clean = (promptText || '').trim();
  const truncatedForUrl = clean.length > MAX_URL_PROMPT_CHARS;
  const querySlice = truncatedForUrl ? clean.slice(0, MAX_URL_PROMPT_CHARS) : clean;
  const encoded = encodeURIComponent(querySlice);

  switch (platformId) {
    case 'claude':
      return {
        url: `https://claude.ai/new?q=${encoded}`,
        supportsQueryPrefill: true,
        truncatedForUrl,
      };
    case 'chatgpt':
      return {
        url: `https://chatgpt.com/?q=${encoded}`,
        supportsQueryPrefill: true,
        truncatedForUrl,
      };
    case 'gemini':
      return {
        url: `https://gemini.google.com/app?text=${encoded}`,
        supportsQueryPrefill: true,
        truncatedForUrl,
      };
    case 'perplexity':
      return {
        url: `https://www.perplexity.ai/search?q=${encoded}`,
        supportsQueryPrefill: true,
        truncatedForUrl,
      };
    case 'grok':
      return {
        url: `https://grok.com/?q=${encoded}`,
        supportsQueryPrefill: true,
        truncatedForUrl,
      };
    case 'deepseek':
    default:
      return {
        url: 'https://chat.deepseek.com/',
        supportsQueryPrefill: false,
        truncatedForUrl: false,
      };
  }
}

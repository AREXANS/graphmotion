import { type SatsetProject } from '../types/satset.ts';

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
  motionPreset?: string;
  motionPrompt?: string;
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
    const scenes = Array.isArray(project.scenes) ? project.scenes : [];

    uploads.forEach((u, idx) => {
      const matchedSceneIdx = scenes.findIndex(
        (sc) => (u.key && sc.media_key === u.key) || (u.url && sc.media_url === u.url)
      );
      const explicitSceneMatch =
        typeof u.stepTitle === 'string' ? u.stepTitle.match(/\bScene\s*(\d+)/i) : null;
      const targetScene =
        matchedSceneIdx >= 0
          ? scenes[matchedSceneIdx].scene_number || matchedSceneIdx + 1
          : typeof u.targetSceneNumber === 'number' && u.targetSceneNumber > 0
          ? u.targetSceneNumber
          : explicitSceneMatch
          ? Number(explicitSceneMatch[1])
          : idx + 1;
      if (sceneRange && (targetScene < sceneRange.start || targetScene > sceneRange.end)) {
        return;
      }
      const srcUrl = u.dataUrl || u.url || '';
      if (!srcUrl) return;
      const assetDisplayName = (u.name || u.stepTitle || u.filename || `Aset ${idx + 1}`).trim();
      const matchedSceneObj = matchedSceneIdx >= 0 ? scenes[matchedSceneIdx] : undefined;
      pushUnique({
        id: u.id || `upload-${idx + 1}`,
        key: u.key || u.mediaKey || `uploaded_media_${idx + 1}`,
        filename: assetDisplayName,
        type: u.type === 'video' ? 'video' : 'image',
        url: srcUrl,
        sceneHint:
          matchedSceneIdx >= 0
            ? `Otomatis disesuaikan AI ke Scene ${targetScene}`
            : `Otomatis disesuaikan AI sesuai naskah & topik`,
        motionPreset:
          matchedSceneObj?.asset_motion_preset || u.motionPreset || 'auto_concept',
        motionPrompt:
          matchedSceneObj?.asset_motion_prompt || u.motionPrompt || '',
      });
    });

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
        motionPreset: sc.asset_motion_preset || 'auto_concept',
        motionPrompt: sc.asset_motion_prompt || '',
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
        motionPreset: 'parallax_scan',
      });
    });
  }

  return results;
}

/**
 * Appends structured image/media instructions to any AI prompt when the user
 * has uploaded assets, instructing the AI to automatically match the asset to the
 * topic, script scenes, and fitting Remotion animation choreography.
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
    const presetNote =
      m.motionPreset && m.motionPreset !== 'auto_concept'
        ? ` | Koreografi Otomatis AI: ${m.motionPreset}`
        : ' | Koreografi Otomatis AI: Sesuaikan dengan Topik & Naskah';
    const autoMotionDetail = m.motionPrompt?.trim()
      ? `\n   - Pergerakan Otomatis Sesuai Aset & Topik: "${m.motionPrompt.trim()}" (Wujudkan gerakan ini dengan s.group + s.spring + s.wave + objek 3D pendukung agar menyatu hidup dengan narasi!)`
      : `\n   - Pergerakan Otomatis Sesuai Aset & Topik: Tentukan secara otomatis pergerakan yang paling cocok dengan aset "${m.filename}" dan kalimat narasi (misal orbit 3D, parallax scan, spring bounce, zoom punch-in, atau floating wave) menggunakan s.spring/s.pop, kedalaman 3D s.box, dan elemen interaktif.`;
    return `${i + 1}. [${kind}] Nama Aset: "${m.filename}"${hint} — media_key: "${m.key}"${presetNote} (render di kanvas dengan \`s.photo("${m.key}", x, y, w, h, { frame: "browser", zoom: 1.0 + s.at(0.2, 2.5) * 0.18, draw: s.pop(0.1, 0.35), time: s.t })\`)${autoMotionDetail}`;
  });

  const mediaSection = `## Gambar / Media yang Diatur (${mediaItems.length} Aset Hidup Remotion — Penempatan Scene & Gerakan Otomatis oleh AI)
PENTING: Kreator telah mengunggah aset di bawah ini hanya dengan memberikan nama asetnya. Tugas kamu (AI):
1. Saat menyusun IDE dan NASKAH: sesuaikan konsep ide dan alur naskah dengan topik serta daftar nama aset ini, lalu tempatkan masing-masing aset secara otomatis pada scene yang isi narasinya paling nyambung dengan nama aset tersebut.
2. Saat menyusun ANIMASI REMOTION: tentukan secara otomatis pergerakan (motion choreography) yang paling cocok untuk setiap aset sesuai topik dan kalimat naskahnya — jangan dijadikan tempelan diam! Animasikan aset dengan pegas \`s.spring\`, kedalaman 3D \`s.box\`, sorotan pan/zoom, dan efek suara \`s.sfx(...)\` yang selaras:
${lines.join('\n')}`;

  const akhirMarker = '=== AKHIR PERINTAH ===';
  if (trimmed.endsWith(akhirMarker)) {
    const withoutMarker = trimmed.slice(0, trimmed.length - akhirMarker.length).trimEnd();
    return `${withoutMarker}\n\n${mediaSection}\n\n${akhirMarker}`;
  }

  return `${trimmed}\n\n${mediaSection}`;
}

/**
 * Formats a base prompt according to the selected dispatch mode ('direct', 'link'/'style_link', or 'md'/'md_file').
 */
export function formatPromptForDispatchMode(
  basePrompt: string,
  mode: 'direct' | 'link' | 'md' | 'style_link' | 'md_file' = 'direct',
  originUrl?: string
): string {
  const clean = (basePrompt || '').trim();
  const origin =
    originUrl ||
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://graphmotion.studio');

  if (mode === 'link' || mode === 'style_link') {
    return `Gunakan referensi panduan gaya Graph Motion Studio (${origin}/style-guide.md) untuk menjaga konsistensi kanvas dan karakter faceless.\n\n${clean}`;
  }
  return clean;
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
        url: `https://chatgpt.com/?q=${encoded}&prompt=${encoded}`,
        supportsQueryPrefill: true,
        truncatedForUrl,
      };
    case 'gemini':
      return {
        url: `https://gemini.google.com/app?q=${encoded}&text=${encoded}`,
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
        url: `https://chat.deepseek.com/?q=${encoded}`,
        supportsQueryPrefill: true,
        truncatedForUrl,
      };
  }
}

export interface AiDispatchRecord {
  platformId: AiPlatformId;
  url: string;
  finalPrompt: string;
  mode: string;
  timestamp: number;
}

/**
 * Copies the prompt to clipboard, optionally triggers .md download when mode is 'md'/'md_file',
 * and immediately navigates/opens the target AI platform page with the pre-populated prompt in the URL query!
 */
export function dispatchPromptToAiPlatform(
  platformId: AiPlatformId,
  rawPrompt: string,
  mode: 'direct' | 'link' | 'md' | 'style_link' | 'md_file' = 'direct',
  options?: { skipBrowserOpen?: boolean; mdFilename?: string }
): AiDispatchRecord {
  const finalPrompt = formatPromptForDispatchMode(rawPrompt, mode);
  const target = buildAiTargetUrl(platformId, finalPrompt);

  if (typeof window !== 'undefined') {
    try {
      (window as any).__GRAPH_MOTION_LAST_PROMPT__ = finalPrompt;
      localStorage.setItem('satset_last_dispatched_prompt', finalPrompt);
    } catch {
      // ignore storage errors
    }

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(finalPrompt).catch(() => {});
    }

    // If mode is 'md' or 'md_file', also download the .md prompt file before opening AI
    if ((mode === 'md' || mode === 'md_file') && typeof document !== 'undefined') {
      try {
        const blob = new Blob([finalPrompt], { type: 'text/markdown;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        const dlAnchor = document.createElement('a');
        dlAnchor.href = blobUrl;
        dlAnchor.download = options?.mdFilename || `graph-motion-prompt-${platformId}.md`;
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        document.body.removeChild(dlAnchor);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
      } catch {
        // ignore blob errors
      }
    }

    const record: AiDispatchRecord = {
      platformId,
      url: target.url,
      finalPrompt,
      mode,
      timestamp: Date.now(),
    };
    (window as any).__LAST_AI_DISPATCH__ = record;

    // Immediately navigate/open the AI platform page with the prefilled prompt query parameter
    if (!options?.skipBrowserOpen && typeof document !== 'undefined') {
      try {
        const a = document.createElement('a');
        a.href = target.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch {
        // ignore navigation errors in headless environments
      }
    }

    return record;
  }

  return {
    platformId,
    url: target.url,
    finalPrompt,
    mode,
    timestamp: Date.now(),
  };
}

/**
 * Reads text from the browser clipboard, falling back to any cached clipboard/test text
 * so clicking "Tempel" always succeeds even if browser clipboard permissions are restricted.
 */
export async function readClipboardOrFallbackText(): Promise<string> {
  if (typeof window === 'undefined') return '';
  try {
    if (navigator?.clipboard?.readText) {
      const clipText = await navigator.clipboard.readText();
      if (clipText && clipText.trim()) {
        return clipText;
      }
    }
  } catch {
    // Fallback below if permission denied in iframe/mobile browser
  }
  const winAny = window as any;
  if (typeof winAny.__GRAPH_MOTION_CLIPBOARD_FALLBACK__ === 'string' && winAny.__GRAPH_MOTION_CLIPBOARD_FALLBACK__.trim()) {
    return winAny.__GRAPH_MOTION_CLIPBOARD_FALLBACK__;
  }
  try {
    const savedClip = localStorage.getItem('satset_clipboard_fallback');
    if (savedClip && savedClip.trim()) return savedClip;
  } catch {
    // ignore
  }
  return '';
}

const PREFERRED_AI_STORAGE_KEY = 'satset_preferred_ai_platform';

export function getPreferredAiPlatform(fallback: AiPlatformId = 'claude'): AiPlatformId {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(PREFERRED_AI_STORAGE_KEY) as AiPlatformId | null;
    if (saved && AI_PLATFORMS.some((p) => p.id === saved)) {
      return saved;
    }
  } catch {
    // ignore
  }
  return fallback;
}

export function savePreferredAiPlatform(platformId: AiPlatformId): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFERRED_AI_STORAGE_KEY, platformId);
  } catch {
    // ignore
  }
}



import {
  IdeaConcept,
  SatsetProject,
  SatsetScene,
  WebsiteDiscoveredEndpoint,
  WebsiteDiscoveredMedia,
  WebsitePromoProfile,
  WebsiteStepLayoutVariant,
  WebsiteStepUiCard,
  WebsiteStepVisual,
} from '../types/satset';
import {
  ensureWebsitePromoSnapshotsRegistered,
  registerSceneUploadedMediaAsset,
} from './website-media-engine';

/**
 * Extracts and normalizes a website URL from user input (either a raw URL or a sentence containing a link/domain).
 */
export function extractWebsiteUrl(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // Match full http(s):// URLs first
  const fullUrlMatch = trimmed.match(/https?:\/\/[^\s"'<>]+/i);
  if (fullUrlMatch) {
    return fullUrlMatch[0].replace(/[.,;!?)]+$/, '');
  }

  // Match bare domain like contohwebsite.com, namabrand.id, aplikasi.io/app, etc.
  const bareDomainMatch = trimmed.match(
    /\b((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:id|my\.id|co\.id|or\.id|web\.id|com|io|app|ai|dev|net|org|xyz|co|me|store|shop|tech)(?:\/[^\s"'<>]*)?)\b/i
  );
  if (bareDomainMatch) {
    const raw = bareDomainMatch[1].replace(/[.,;!?)]+$/, '');
    return `https://${raw}`;
  }

  return null;
}

export function extractDomainFromUrl(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return url
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
      .trim();
  }
}

function stripHtmlTags(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&mdash;|&#8212;/gi, '-')
    .replace(/&ndash;|&#8211;/gi, '-')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveRelativeUrl(rawHref: string, baseUrl?: string): string | null {
  if (!rawHref) return null;
  const trimmed = rawHref
    .trim()
    .replace(/&amp;/gi, '&')
    .replace(/&#38;/g, '&')
    .replace(/&#x26;/gi, '&');
  if (!trimmed || trimmed.startsWith('javascript:') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
    return null;
  }
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('data:video/')) {
    return trimmed;
  }
  try {
    const base = baseUrl ? (baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`) : 'https://example.com';
    return new URL(trimmed, base).toString();
  } catch {
    return trimmed.startsWith('http') ? trimmed : null;
  }
}

function normalizeHexColor(raw?: string): string | undefined {
  if (!raw) return undefined;
  const clean = raw.trim();
  const hex6 = clean.match(/^#([0-9a-f]{6})$/i);
  if (hex6) return `#${hex6[1].toUpperCase()}`;
  const hex3 = clean.match(/^#([0-9a-f]{3})$/i);
  if (hex3) {
    const [r, g, b] = hex3[1].toUpperCase().split('');
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  const rgbMatch = clean.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i);
  if (rgbMatch) {
    const r = Math.min(255, Math.max(0, Number(rgbMatch[1]))).toString(16).padStart(2, '0');
    const g = Math.min(255, Math.max(0, Number(rgbMatch[2]))).toString(16).padStart(2, '0');
    const b = Math.min(255, Math.max(0, Number(rgbMatch[3]))).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  }
  return undefined;
}

function isVibrantBrandHex(hex?: string): boolean {
  if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  // Exclude near-black, near-white, and desaturated grays
  if (lum < 0.12 || lum > 0.92) return false;
  if (delta < 28) return false;
  return true;
}

const TAILWIND_COLOR_HEX_MAP: Record<string, [string, string, string]> = {
  blue: ['#2563EB', '#38BDF8', '#10B981'],
  sky: ['#0284C7', '#38BDF8', '#6366F1'],
  cyan: ['#0891B2', '#22D3EE', '#3B82F6'],
  teal: ['#0D9488', '#2DD4BF', '#F59E0B'],
  emerald: ['#059669', '#34D399', '#3B82F6'],
  green: ['#16A34A', '#4ADE80', '#0EA5E9'],
  indigo: ['#4F46E5', '#818CF8', '#EC4899'],
  violet: ['#7C3AED', '#A78BFA', '#06B6D4'],
  purple: ['#9333EA', '#C084FC', '#F43F5E'],
  fuchsia: ['#C026D3', '#E879F9', '#38BDF8'],
  pink: ['#DB2777', '#F472B6', '#6366F1'],
  rose: ['#E11D48', '#FB7185', '#F59E0B'],
  red: ['#DC2626', '#F87171', '#FBBF24'],
  orange: ['#EA580C', '#FB923C', '#2563EB'],
  amber: ['#D97706', '#FBBF24', '#10B981'],
};

export function extractWebsiteBrandPaletteFromHtml(
  html: string,
  domainFallback = ''
): { primaryColor: string; secondaryColor: string; accentColor: string } {
  const candidates: string[] = [];

  if (html && typeof html === 'string') {
    // 1. Check <meta name="theme-color"> or msapplication-TileColor
    const metaTheme =
      html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']theme-color["']/i) ||
      html.match(/<meta[^>]+name=["']msapplication-TileColor["'][^>]+content=["']([^"']+)["']/i);
    if (metaTheme?.[1]) {
      const norm = normalizeHexColor(metaTheme[1]);
      if (norm && isVibrantBrandHex(norm)) {
        candidates.push(norm);
      }
    }

    // 2. Check CSS custom properties (--primary, --brand, --accent, --secondary)
    const cssVarRegex = /--(?:color-)?(?:primary|brand|main|accent|secondary|theme)[a-z0-9-_]*\s*:\s*(#[0-9a-fA-F]{3,6}|rgba?\([^)]+\))/gi;
    let match: RegExpExecArray | null;
    while ((match = cssVarRegex.exec(html)) !== null && candidates.length < 8) {
      const norm = normalizeHexColor(match[1]);
      if (norm && isVibrantBrandHex(norm) && !candidates.includes(norm)) {
        candidates.push(norm);
      }
    }

    // 3. Check arbitrary hex colors in styles or classes
    const hexRegex = /#([0-9a-fA-F]{6})\b/g;
    while ((match = hexRegex.exec(html)) !== null && candidates.length < 10) {
      const norm = `#${match[1].toUpperCase()}`;
      if (isVibrantBrandHex(norm) && !candidates.includes(norm)) {
        candidates.push(norm);
      }
    }

    // 4. Check Tailwind utility classes (e.g. bg-emerald-600, from-indigo-500, text-rose-600)
    if (candidates.length === 0) {
      const twMatch = html.match(
        /\b(?:bg|from|to|text|border)-(blue|sky|cyan|teal|emerald|green|indigo|violet|purple|fuchsia|pink|rose|red|orange|amber)-(?:400|500|600|700)\b/i
      );
      if (twMatch?.[1]) {
        const key = twMatch[1].toLowerCase();
        const preset = TAILWIND_COLOR_HEX_MAP[key];
        if (preset) {
          return {
            primaryColor: preset[0],
            secondaryColor: preset[1],
            accentColor: preset[2],
          };
        }
      }
    }
  }

  if (candidates.length >= 3) {
    return {
      primaryColor: candidates[0],
      secondaryColor: candidates[1],
      accentColor: candidates[2],
    };
  }
  if (candidates.length === 2) {
    return {
      primaryColor: candidates[0],
      secondaryColor: candidates[1],
      accentColor: '#10B981',
    };
  }
  if (candidates.length === 1) {
    return {
      primaryColor: candidates[0],
      secondaryColor: '#38BDF8',
      accentColor: '#10B981',
    };
  }

  // Deterministic domain-based palette when no HTML or hex color was present
  const palettes: Array<[string, string, string]> = [
    ['#2563EB', '#38BDF8', '#10B981'],
    ['#4F46E5', '#818CF8', '#06B6D4'],
    ['#059669', '#34D399', '#3B82F6'],
    ['#7C3AED', '#A78BFA', '#F59E0B'],
    ['#0284C7', '#22D3EE', '#10B981'],
    ['#E11D48', '#FB7185', '#F59E0B'],
    ['#EA580C', '#FB923C', '#2563EB'],
  ];
  let hash = 0;
  const seed = (domainFallback || 'website').toLowerCase();
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const chosen = palettes[Math.abs(hash) % palettes.length];
  return {
    primaryColor: chosen[0],
    secondaryColor: chosen[1],
    accentColor: chosen[2],
  };
}

export interface ParsedWebsiteHtmlMetadata {
  title?: string;
  description?: string;
  themeColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  headings: string[];
  bulletPoints: string[];
  ctaLabels: string[];
  rawTextSnippet: string;
  discoveredEndpoints?: WebsiteDiscoveredEndpoint[];
  discoveredMedia?: WebsiteDiscoveredMedia[];
}

/**
 * Parses raw HTML from a fetched website to extract real headings, copy, steps, metrics, brand colors,
 * internal endpoints/routes (Firecrawl-style link discovery), and real image/video media URLs.
 */
export function parseWebsiteHtmlMetadata(html: string, baseUrl?: string): ParsedWebsiteHtmlMetadata {
  if (!html || typeof html !== 'string') {
    return {
      headings: [],
      bulletPoints: [],
      ctaLabels: [],
      rawTextSnippet: '',
      discoveredEndpoints: [],
      discoveredMedia: [],
    };
  }

  const titleMatch =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descMatch =
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  const colorMatch = html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i);
  const extractedPalette = extractWebsiteBrandPaletteFromHtml(html, baseUrl ? extractDomainFromUrl(baseUrl) : '');

  const headings: string[] = [];
  const headingRegex = /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi;
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(html)) !== null && headings.length < 28) {
    const clean = stripHtmlTags(match[1]);
    if (clean.length >= 4 && clean.length <= 120 && !headings.includes(clean)) {
      headings.push(clean);
    }
  }

  const bulletPoints: string[] = [];
  const liRegex = /<(?:li|p|dd|blockquote)[^>]*>([\s\S]*?)<\/(?:li|p|dd|blockquote)>/gi;
  while ((match = liRegex.exec(html)) !== null && bulletPoints.length < 36) {
    const clean = stripHtmlTags(match[1]);
    if (clean.length >= 18 && clean.length <= 180 && !bulletPoints.includes(clean)) {
      bulletPoints.push(clean);
    }
  }

  const ctaLabels: string[] = [];
  const ctaRegex = /<(?:a|button)[^>]*>([\s\S]*?)<\/(?:a|button)>/gi;
  while ((match = ctaRegex.exec(html)) !== null && ctaLabels.length < 14) {
    const clean = stripHtmlTags(match[1]);
    if (clean.length >= 4 && clean.length <= 36 && !ctaLabels.includes(clean)) {
      ctaLabels.push(clean);
    }
  }

  // Extract internal endpoints / routes / anchors — prioritizing deep product, feature, docs, pricing, and workflow subpages
  const rawEndpoints: Array<WebsiteDiscoveredEndpoint & { priority: number }> = [];
  const seenPaths = new Set<string>();
  const baseDomain = baseUrl ? extractDomainFromUrl(baseUrl).toLowerCase() : '';
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  while ((match = linkRegex.exec(html)) !== null && rawEndpoints.length < 36) {
    const rawHref = match[1].trim();
    const label = stripHtmlTags(match[2]) || rawHref;
    const resolved = resolveRelativeUrl(rawHref, baseUrl);
    if (!resolved) continue;

    try {
      const parsed = new URL(resolved);
      const linkDomain = parsed.hostname.replace(/^www\./i, '').toLowerCase();
      if (baseDomain && linkDomain !== baseDomain && !rawHref.startsWith('/') && !rawHref.startsWith('#')) {
        continue;
      }
      const pathKey = parsed.hash ? `${parsed.pathname}${parsed.hash}` : parsed.pathname || '/';
      if (seenPaths.has(pathKey)) continue;
      if (/\.(pdf|zip|png|jpg|jpeg|svg|css|js|xml|ico)$/i.test(pathKey)) continue;
      seenPaths.add(pathKey);

      const lowerPath = `${pathKey} ${label}`.toLowerCase();
      const endpointType: WebsiteDiscoveredEndpoint['type'] =
        pathKey.includes('/api') || pathKey.includes('webhook') || pathKey.includes('docs') || pathKey.includes('developer')
          ? 'api'
          : parsed.hash
            ? 'section'
            : /login|register|daftar|mulai|checkout|order|signup|start/i.test(pathKey)
              ? 'action'
              : 'page';

      let priority = endpointType === 'page' && pathKey !== '/' ? 65 : 40;
      if (/feature|fitur|product|produk|solution|solusi|how-it-works|cara-kerja|workflow|platform|payments|billing|connect|radar|terminal/i.test(lowerPath)) {
        priority += 35;
      } else if (/docs|documentation|panduan|api|developer|integration|integrasi|webhook/i.test(lowerPath)) {
        priority += 30;
      } else if (/pricing|harga|paket|enterprise|security|keamanan|trust|about|tentang|customers/i.test(lowerPath)) {
        priority += 25;
      }

      rawEndpoints.push({
        path: pathKey,
        url: resolved,
        title: label.slice(0, 48) || pathKey,
        type: endpointType,
        priority,
      });
    } catch {
      // Ignore malformed href
    }
  }

  const discoveredEndpoints: WebsiteDiscoveredEndpoint[] = rawEndpoints
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 16)
    .map(({ priority: _p, ...ep }) => ep);

  // Extract real website content images and videos for promo/tutorial steps (strictly excluding website logos & icons)
  const rawCandidates: Array<WebsiteDiscoveredMedia & { priority: number }> = [];
  const seenMediaUrls = new Set<string>();

  const addMediaCandidate = (
    rawSrc: string | undefined,
    type: 'image' | 'video',
    label: string,
    tagHtml = '',
    basePriority = 50
  ) => {
    if (!rawSrc || rawCandidates.length >= 28) return;
    const trimmed = rawSrc.trim();
    // Skip inline JS template strings (${...}) or streaming API endpoints
    if (
      trimmed.includes('$') ||
      trimmed.includes('{') ||
      trimmed.includes('}') ||
      trimmed.includes('%7B') ||
      trimmed.includes('%7D') ||
      trimmed.includes(' ')
    ) {
      return;
    }
    const resolved = resolveRelativeUrl(trimmed, baseUrl);
    if (!resolved || seenMediaUrls.has(resolved)) return;
    if (isWebsiteLogoOrIconAsset(resolved, tagHtml, label)) {
      return;
    }

    const lower = `${resolved} ${label}`.toLowerCase();
    let priority = basePriority;
    if (/thumb|screenshot|tutorial|step|langkah|automate|dashboard|demo|preview|feature|fitur|galeri|hero|mockup|produk|transaksi|webhook|qris|ui|chart|analytics/i.test(lower)) {
      priority += 30;
    }
    if (/\/uploads\/|\/videos\/|\/assets\/|\/media\/|\/images\/|\/screenshots\//i.test(lower)) {
      priority += 15;
    }

    seenMediaUrls.add(resolved);
    rawCandidates.push({
      url: resolved,
      dataUrl: resolved.startsWith('data:') ? resolved : undefined,
      type,
      label: label.slice(0, 60) || (type === 'video' ? 'Cuplikan Video Website' : 'Visual Langkah Website'),
      priority,
    });
  };

  // 1. Extract <video poster="..."> and <video src="..."> first — high-value tutorial/demo assets
  const videoTagRegex = /<video\b[^>]*>/gi;
  while ((match = videoTagRegex.exec(html)) !== null) {
    const fullVideoTag = match[0];
    const posterMatch = fullVideoTag.match(/\bposter=["']([^"']+)["']/i);
    if (posterMatch?.[1]) {
      addMediaCandidate(posterMatch[1], 'image', 'Thumbnail Video Tutorial Website', fullVideoTag, 95);
    }
    const videoSrcMatch =
      fullVideoTag.match(/\bdata-lazy-src=["']([^"']+)["']/i) ||
      fullVideoTag.match(/\bdata-src=["']([^"']+)["']/i) ||
      fullVideoTag.match(/\bsrc=["']([^"']+)["']/i);
    if (videoSrcMatch?.[1]) {
      addMediaCandidate(videoSrcMatch[1], 'video', 'Video Demo Tampilan Website', fullVideoTag, 85);
    }
  }

  // 2. Extract <source src / data-src / data-lazy-src> inside video blocks
  const sourceRegex = /<source\b[^>]*>/gi;
  while ((match = sourceRegex.exec(html)) !== null) {
    const fullSourceTag = match[0];
    const srcMatch =
      fullSourceTag.match(/\bdata-lazy-src=["']([^"']+)["']/i) ||
      fullSourceTag.match(/\bdata-src=["']([^"']+)["']/i) ||
      fullSourceTag.match(/\bsrc=["']([^"']+)["']/i);
    if (srcMatch?.[1] && /\.(mp4|webm|mov)(\?|$)/i.test(srcMatch[1])) {
      addMediaCandidate(srcMatch[1], 'video', 'Video Langkah Website', fullSourceTag, 80);
    }
  }

  // 3. Extract <img src / data-src / data-lazy-src / srcset> (excluding logos, icons, avatars, badges)
  const imgTagRegex = /<img\b[^>]*>/gi;
  while ((match = imgTagRegex.exec(html)) !== null) {
    const fullTag = match[0];
    let candidateSrc: string | undefined;
    const srcMatch =
      fullTag.match(/\bdata-lazy-src=["']([^"']+)["']/i) ||
      fullTag.match(/\bdata-src=["']([^"']+)["']/i) ||
      fullTag.match(/\bsrc=["']([^"']+)["']/i);
    if (srcMatch?.[1]) {
      candidateSrc = srcMatch[1];
    } else {
      const srcsetMatch = fullTag.match(/\bsrcset=["']([^"']+)["']/i);
      if (srcsetMatch?.[1]) {
        const entries = srcsetMatch[1]
          .split(',')
          .map((s) => s.trim().split(/\s+/)[0])
          .filter(Boolean);
        candidateSrc = entries[entries.length - 1];
      }
    }
    if (!candidateSrc) continue;
    const altMatch = fullTag.match(/\balt=["']([^"']+)["']/i);
    const altLabel = altMatch?.[1] ? stripHtmlTags(altMatch[1]) : 'Visual Konten Website';
    addMediaCandidate(candidateSrc, 'image', altLabel, fullTag, 75);
  }

  // 4. Extract CSS background-image: url(...) on hero/feature sections
  const bgUrlRegex = /background(?:-image)?\s*:\s*[^;]*url\(\s*["']?([^"')]+)["']?\s*\)/gi;
  while ((match = bgUrlRegex.exec(html)) !== null) {
    if (match[1]) {
      addMediaCandidate(match[1], 'image', 'Banner Visual Website', '', 68);
    }
  }

  // 5. Extract og:image / twitter:image only if it is not a logo and as supplementary banner visual
  const ogImgMatch =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogImgMatch?.[1]) {
    addMediaCandidate(ogImgMatch[1], 'image', 'Preview Utama Website', '', 60);
  }

  const discoveredMedia: WebsiteDiscoveredMedia[] = rawCandidates
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 14)
    .map(({ priority: _p, ...item }) => item);

  const rawTextSnippet = stripHtmlTags(html).slice(0, 3200);

  return {
    title: titleMatch ? stripHtmlTags(titleMatch[1]) : undefined,
    description: descMatch ? stripHtmlTags(descMatch[1]) : undefined,
    themeColor: colorMatch ? colorMatch[1].trim() : extractedPalette.primaryColor,
    secondaryColor: extractedPalette.secondaryColor,
    accentColor: extractedPalette.accentColor,
    headings,
    bulletPoints,
    ctaLabels,
    rawTextSnippet,
    discoveredEndpoints,
    discoveredMedia,
  };
}

/**
 * Checks whether a discovered image/media URL or tag is a website logo, favicon, icon, or tiny badge
 * rather than a real promotional/tutorial content visual.
 */
export function isWebsiteLogoOrIconAsset(rawUrl: string, tagHtml = '', label = ''): boolean {
  if (!rawUrl) return true;
  const lowerUrl = rawUrl.toLowerCase();
  const lowerTag = (tagHtml || '').toLowerCase();
  const lowerLabel = (label || '').toLowerCase();

  // Tiny tracking pixels, favicons, blank gifs, SSE streams
  if (
    lowerUrl.includes('1x1') ||
    lowerUrl.includes('pixel') ||
    lowerUrl.includes('favicon') ||
    lowerUrl.includes('apple-touch-icon') ||
    lowerUrl.endsWith('.ico') ||
    lowerUrl.includes('spacer.gif') ||
    lowerUrl.includes('/api/stream') ||
    lowerUrl.includes('%7b')
  ) {
    return true;
  }

  // Filename or path explicitly indicates a logo, brand mark, icon, or avatar
  const fileName = lowerUrl.split('?')[0].split('/').pop() || '';
  if (
    /^(logo|brand|favicon|icon|avatar|badge|loader|spinner)([-_.]|[0-9]|\b)/i.test(fileName) ||
    /([-_/](logo|brand[-_]?logo|site[-_]?logo|navbar[-_]?logo|header[-_]?logo|footer[-_]?logo|favicon|avatar|icon[-_]?sm))(\.[a-z0-9]+)?(\?|$)/i.test(lowerUrl)
  ) {
    return true;
  }

  // SVGs are almost always vector logos or small icons unless explicitly named as a dashboard/mockup/diagram
  if (lowerUrl.endsWith('.svg') && !/dashboard|mockup|screenshot|diagram|preview|hero|tutorial|chart/i.test(lowerUrl)) {
    return true;
  }

  // Alt text or class in HTML tag explicitly marks it as a logo/icon/avatar (and not a screenshot/thumbnail/tutorial)
  const isContentVisualKeyword = /screenshot|thumb|tutorial|langkah|step|dashboard|preview|demo|hero|automate|galeri|video|banner/i.test(
    `${lowerUrl} ${lowerLabel}`
  );
  if (
    !isContentVisualKeyword &&
    (/\b(logo|favicon|brand\s*logo|cyber\s*logo|site\s*logo|company\s*logo|avatar|user\s*icon)\b/i.test(lowerLabel) ||
      /\b(navbar-brand|site-logo|brand-logo|header-logo|footer-logo|logo-img)\b/i.test(lowerTag))
  ) {
    return true;
  }

  // Explicit small width/height attributes (< 140px) indicate an icon or navbar logo
  const widthAttr = lowerTag.match(/\bwidth=["']?(\d+)["']?/i);
  const heightAttr = lowerTag.match(/\bheight=["']?(\d+)["']?/i);
  if (widthAttr?.[1] && Number(widthAttr[1]) > 0 && Number(widthAttr[1]) < 140) {
    return true;
  }
  if (heightAttr?.[1] && Number(heightAttr[1]) > 0 && Number(heightAttr[1]) < 140) {
    return true;
  }

  // Small Tailwind utility classes on the <img> tag (e.g. w-6, h-8, w-10, h-10, w-12, h-12)
  if (/\b(w-[3-9]|w-1[0-2]|h-[3-9]|h-1[0-2])\b/.test(lowerTag) && !/\b(w-full|w-screen|max-w-)\b/.test(lowerTag)) {
    return true;
  }

  return false;
}

function pickStepMediaSource(discoveredMedia: WebsiteDiscoveredMedia[], stepIndex: number): string | undefined {
  const nonLogoMedia = discoveredMedia.filter((m) => !isWebsiteLogoOrIconAsset(m.url, '', m.label));
  if (nonLogoMedia.length === 0) return undefined;
  const imagePool = nonLogoMedia.filter((m) => m.type === 'image' || Boolean(m.dataUrl));
  const pool = imagePool.length > 0 ? imagePool : nonLogoMedia;
  const chosen = pool[stepIndex % pool.length];
  return chosen?.dataUrl || chosen?.url;
}

function extractScrapedMetrics(parsedHtml?: ParsedWebsiteHtmlMetadata, domain = 'website.id'): Array<{ label: string; value: string }> {
  const textPool = [
    ...(parsedHtml?.headings || []),
    ...(parsedHtml?.bulletPoints || []),
    parsedHtml?.description || '',
  ].join(' | ');
  const found: Array<{ label: string; value: string }> = [];
  const statRegex = /\b(\d+(?:[.,]\d+)?(?:\+|%|x|ms|s|\s*(?:detik|menit|jam|negara|bahasa|juta|ribu|miliar|billion|million|currencies|countries|uptime|api)))\b/gi;
  let m: RegExpExecArray | null;
  while ((m = statRegex.exec(textPool)) !== null && found.length < 4) {
    const val = m[1].trim();
    if (!found.some((f) => f.value.toLowerCase() === val.toLowerCase())) {
      found.push({
        label: `METRIK ${found.length + 1}`,
        value: val.toUpperCase().slice(0, 22),
      });
    }
  }
  const defaults = [
    { label: 'Kecepatan Setup', value: '< 2 Menit Aktif' },
    { label: 'Akses Platform', value: '24/7 Cloud Online' },
    { label: 'Keamanan', value: 'SSL HTTPS Terenkripsi' },
    { label: 'Website Resmi', value: domain },
  ];
  while (found.length < 4) {
    found.push(defaults[found.length]);
  }
  return found;
}

/**
 * Universal adaptive profile generator for ANY website URL + parsed HTML & discovered endpoints/media.
 * Automatically extracts brand colors, real scraped images/videos, deep subpage endpoints, and step-by-step walkthrough structure.
 */
export function buildWebsitePromoProfile(
  rawUrl: string,
  parsedHtml?: ParsedWebsiteHtmlMetadata
): WebsitePromoProfile {
  const cleanInput = (rawUrl || '').trim();
  const normalizedUrl =
    extractWebsiteUrl(cleanInput) ||
    (cleanInput ? `https://${cleanInput.replace(/^https?:\/\//i, '')}` : 'https://website.id');
  const domain = extractDomainFromUrl(normalizedUrl);

  const rawBrand =
    parsedHtml?.title?.split(/[—–|-]/)[0]?.trim() ||
    domain
      .split('.')[0]
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  const brandName = rawBrand.slice(0, 32) || domain;
  const tagline =
    parsedHtml?.title ||
    parsedHtml?.headings[0] ||
    `Solusi Digital Modern & Otomatis di ${domain}`;
  const description =
    parsedHtml?.description ||
    parsedHtml?.bulletPoints[0] ||
    `Platform ${brandName} (${domain}) membantu mempercepat alur kerja, meningkatkan konversi, dan melayani pengguna secara otomatis 24 jam.`;

  const h1 = parsedHtml?.headings[0] || `${brandName} - Solusi Cepat & Praktis`;
  const h2 = parsedHtml?.headings[1] || 'Mengapa Banyak Pengguna Beralih ke Platform Ini?';
  const h3 = parsedHtml?.headings[2] || 'Arsitektur & Halaman Fitur Utama';
  const h4 = parsedHtml?.headings[3] || 'Alur Kerja & Konfigurasi Sistem';
  const h5 = parsedHtml?.headings[4] || 'Analitik & Pemantauan Real-Time';
  const h6 = parsedHtml?.headings[5] || 'Ekosistem Modul & Integrasi Lengkap';
  const h7 = parsedHtml?.headings[6] || 'Keamanan, Reliabilitas & Skala Global';
  const h8 = parsedHtml?.headings[7] || `Mulai Gunakan ${brandName} di ${domain}`;
  const ctaLabel = parsedHtml?.ctaLabels[0] || `Coba ${brandName} Sekarang`;

  const bp0 = parsedHtml?.bulletPoints[0] || description;
  const bp1 = parsedHtml?.bulletPoints[1] || `Mengotomatiskan alur operasional utama di ${domain} tanpa proses manual yang berulang.`;
  const bp2 = parsedHtml?.bulletPoints[2] || `Akses langsung berbagai modul inti seperti ${h3} dan ${h4} dalam satu antarmuka terpadu.`;
  const bp3 = parsedHtml?.bulletPoints[3] || `Konfigurasi parameter kerja dan integrasi API/sistem langsung dari dashboard ${brandName}.`;
  const bp4 = parsedHtml?.bulletPoints[4] || `Pantau metrik performa, transaksi, dan laporan analitik secara real-time setiap detik.`;
  const bp5 = parsedHtml?.bulletPoints[5] || `Ekosistem ${brandName} menghubungkan berbagai layanan dan kanal operasional secara mulus.`;
  const bp6 = parsedHtml?.bulletPoints[6] || `Dilindungi enkripsi tingkat tinggi dan infrastruktur cloud berkecepatan tinggi 24/7.`;

  const fallbackPalette = extractWebsiteBrandPaletteFromHtml('', domain);
  const primaryColor =
    parsedHtml?.themeColor && /^#[0-9a-f]{6}$/i.test(parsedHtml.themeColor)
      ? parsedHtml.themeColor.toUpperCase()
      : fallbackPalette.primaryColor;
  const secondaryColor =
    parsedHtml?.secondaryColor && /^#[0-9a-f]{6}$/i.test(parsedHtml.secondaryColor)
      ? parsedHtml.secondaryColor.toUpperCase()
      : fallbackPalette.secondaryColor;
  const accentColor =
    parsedHtml?.accentColor && /^#[0-9a-f]{6}$/i.test(parsedHtml.accentColor)
      ? parsedHtml.accentColor.toUpperCase()
      : fallbackPalette.accentColor;

  const discoveredEndpoints: WebsiteDiscoveredEndpoint[] =
    parsedHtml?.discoveredEndpoints && parsedHtml.discoveredEndpoints.length > 0
      ? parsedHtml.discoveredEndpoints
      : [
          { path: '/', url: normalizedUrl, title: h1.slice(0, 44), type: 'page' },
          { path: '/features', url: `${normalizedUrl}/features`, title: h2.slice(0, 44), type: 'page' },
          { path: '/products', url: `${normalizedUrl}/products`, title: h3.slice(0, 44), type: 'page' },
          { path: '/workflow', url: `${normalizedUrl}/workflow`, title: h4.slice(0, 44), type: 'section' },
          { path: '/analytics', url: `${normalizedUrl}/analytics`, title: h5.slice(0, 44), type: 'section' },
          { path: '/integrations', url: `${normalizedUrl}/integrations`, title: h6.slice(0, 44), type: 'page' },
          { path: '/security', url: `${normalizedUrl}/security`, title: h7.slice(0, 44), type: 'page' },
          { path: '/register', url: `${normalizedUrl}/register`, title: ctaLabel.slice(0, 44), type: 'action' },
        ];
  const discoveredMedia = (parsedHtml?.discoveredMedia || []).filter(
    (m) => !isWebsiteLogoOrIconAsset(m.url, '', m.label)
  );
  const scrapedMetrics = extractScrapedMetrics(parsedHtml, domain);

  return {
    url: normalizedUrl,
    domain,
    brandName,
    tagline,
    description,
    category: 'saas',
    primaryColor,
    secondaryColor,
    accentColor,
    discoveredEndpoints,
    discoveredMedia,
    crawlSummary: {
      crawlEngine: 'Firecrawl + Deep Subpage DOM Scanner',
      endpointsCount: discoveredEndpoints.length,
      mediaCount: discoveredMedia.length,
      conceptSummary: `${h1} — ${bp0}`.slice(0, 200),
    },
    metrics: scrapedMetrics,
    channels: [
      parsedHtml?.headings[1] || 'Dashboard Real-Time',
      parsedHtml?.headings[2] || 'Automasi Alur Kerja',
      parsedHtml?.headings[3] || 'Integrasi Cepat',
      parsedHtml?.headings[4] || 'Laporan & Analitik',
    ],
    pricing: `Akses Langsung di ${domain}`,
    ctaText: `Kunjungi ${domain} Sekarang`,
    steps: [
      {
        stepBadge: '01 • IDENTITAS & PROPOSISI UTAMA',
        endpointPath: discoveredEndpoints[0]?.path || '/',
        title: h1.slice(0, 56),
        subtitle: bp0.slice(0, 115),
        metric: scrapedMetrics[0]?.value || `${domain} • Live`,
        actionLabel: ctaLabel,
        layoutVariant: 'hero_landing',
        screenshotDataUrl: pickStepMediaSource(discoveredMedia, 0),
        cards: [
          { label: 'PLATFORM RESMI', value: domain, badge: 'LIVE 24/7', accent: primaryColor },
          { label: 'FOKUS SOLUSI', value: h2.slice(0, 34), badge: 'INTI', accent: accentColor },
          { label: 'ENDPOINT AKTIF', value: `${discoveredEndpoints.length} Rute Terindeks`, badge: 'DEEP CRAWL', accent: secondaryColor },
        ],
      },
      {
        stepBadge: '02 • KONTRAS MASALAH VS SOLUSI',
        endpointPath: discoveredEndpoints[1]?.path || '/features',
        title: h2.slice(0, 56),
        subtitle: bp1.slice(0, 115),
        metric: scrapedMetrics[1]?.value || '10x Lebih Efisien',
        actionLabel: 'Bedah Arsitektur',
        layoutVariant: 'problem_compare',
        screenshotDataUrl: pickStepMediaSource(discoveredMedia, 1),
        cards: [
          { label: 'KENDALA LAMA', value: 'Proses Manual & Terpisah', badge: 'LAMBAT', accent: '#EF4444' },
          { label: `SOLUSI ${brandName.toUpperCase()}`, value: h3.slice(0, 34), badge: 'OTOMATIS', accent: accentColor },
          { label: 'DAMPAK NYATA', value: bp1.slice(0, 34), badge: 'TERUKUR', accent: primaryColor },
        ],
      },
      {
        stepBadge: `03 • BEDAH RUTE ${(discoveredEndpoints[2]?.path || '/products').toUpperCase().slice(0, 18)}`,
        endpointPath: discoveredEndpoints[2]?.path || '/products',
        title: h3.slice(0, 56),
        subtitle: bp2.slice(0, 115),
        metric: discoveredEndpoints[2]?.title?.slice(0, 22) || 'Arsitektur Inti',
        actionLabel: 'Lihat Alur Sistem',
        layoutVariant: 'step_phone_notif',
        screenshotDataUrl: pickStepMediaSource(discoveredMedia, 2),
        cards: [
          { label: 'MODUL UTAMA', value: h3.slice(0, 32), badge: 'ENDPOINT 1', accent: primaryColor },
          { label: 'SUB-FITUR', value: h4.slice(0, 32), badge: 'ENDPOINT 2', accent: accentColor },
          { label: 'KAPABILITAS', value: bp2.slice(0, 32), badge: 'AKTIF', accent: secondaryColor },
        ],
      },
      {
        stepBadge: `04 • MEKANISME & ALUR KERJA`,
        endpointPath: discoveredEndpoints[3]?.path || '/workflow',
        title: h4.slice(0, 56),
        subtitle: bp3.slice(0, 115),
        metric: scrapedMetrics[2]?.value || 'Sinkronisasi Instan',
        actionLabel: 'Jalankan Pipeline',
        layoutVariant: 'step_ssl_tunnel',
        screenshotDataUrl: pickStepMediaSource(discoveredMedia, 3),
        cards: [
          { label: 'TAHAP INPUT', value: (discoveredEndpoints[1]?.title || h2).slice(0, 30), badge: 'STEP 1', accent: primaryColor },
          { label: 'PROSES ENGINE', value: h4.slice(0, 30), badge: 'STEP 2', accent: accentColor },
          { label: 'OUTPUT REAL-TIME', value: h5.slice(0, 30), badge: 'STEP 3', accent: secondaryColor },
        ],
      },
      {
        stepBadge: '05 • ANALITIK & PERFORMA DATA',
        endpointPath: discoveredEndpoints[4]?.path || '/analytics',
        title: h5.slice(0, 56),
        subtitle: bp4.slice(0, 115),
        metric: scrapedMetrics[0]?.value || 'Real-Time Telemetry',
        actionLabel: 'Status: OPTIMAL',
        layoutVariant: 'step_webhook_lunas',
        screenshotDataUrl: pickStepMediaSource(discoveredMedia, 4),
        cards: [
          { label: 'METRIK UTAMA', value: h5.slice(0, 32), badge: 'LIVE DATA', accent: accentColor },
          { label: 'AKURASI SISTEM', value: bp4.slice(0, 32), badge: 'VERIFIED', accent: primaryColor },
          { label: 'UPTIME CLOUD', value: scrapedMetrics[1]?.value || '99.9% Stabil', badge: 'NONSTOP', accent: secondaryColor },
        ],
      },
      {
        stepBadge: '06 • EKOSISTEM FITUR MENDALAM',
        endpointPath: discoveredEndpoints[5]?.path || '/integrations',
        title: h6.slice(0, 56),
        subtitle: bp5.slice(0, 115),
        metric: `${discoveredEndpoints.length}+ Modul & Rute`,
        actionLabel: 'Jelajahi Ekosistem',
        layoutVariant: 'channel_grid',
        screenshotDataUrl: pickStepMediaSource(discoveredMedia, 5),
        cards: [
          { label: 'PILAR 1', value: h2.slice(0, 30), badge: 'CORE', accent: primaryColor },
          { label: 'PILAR 2', value: h3.slice(0, 30), badge: 'API/WEB', accent: secondaryColor },
          { label: 'PILAR 3', value: h6.slice(0, 30), badge: 'INTEGRASI', accent: accentColor },
        ],
      },
      {
        stepBadge: '07 • KEAMANAN & SKALA INFRASTRUKTUR',
        endpointPath: discoveredEndpoints[6]?.path || '/security',
        title: h7.slice(0, 56),
        subtitle: bp6.slice(0, 115),
        metric: 'Enkripsi & Proteksi Aktif',
        actionLabel: 'Terverifikasi Aman',
        layoutVariant: 'security_pricing',
        screenshotDataUrl: pickStepMediaSource(discoveredMedia, 6),
        cards: [
          { label: 'KEAMANAN DATA', value: h7.slice(0, 32), badge: 'SHIELD', accent: accentColor },
          { label: 'INFRASTRUKTUR', value: bp6.slice(0, 32), badge: 'ENTERPRISE', accent: primaryColor },
          { label: 'AKSESIBILITAS', value: `Siap Skala Besar di ${domain}`, badge: 'GLOBAL', accent: secondaryColor },
        ],
      },
      {
        stepBadge: `08 • AKSES LANGSUNG ${domain.toUpperCase()}`,
        endpointPath: discoveredEndpoints[7]?.path || '/register',
        title: h8.slice(0, 56),
        subtitle: `Buka ${domain} sekarang dan terapkan seluruh kapabilitas ${brandName} untuk akselerasi proyekmu.`,
        metric: domain,
        actionLabel: `Buka ${domain}`,
        layoutVariant: 'cta_spotlight',
        screenshotDataUrl: pickStepMediaSource(discoveredMedia, 7),
        cards: [
          { label: 'PORTAL UTAMA', value: domain, badge: 'BUKA WEB', accent: primaryColor },
          { label: 'FITUR UNGGULAN', value: h1.slice(0, 30), badge: 'AKTIF', accent: secondaryColor },
          { label: 'MULAI SEKARANG', value: ctaLabel.slice(0, 30), badge: 'INSTAN', accent: accentColor },
        ],
      },
    ],
  };
}

/**
 * Generates 5 strategic promotional concepts specifically tailored to the analyzed website.
 */
export function buildWebsitePromoConcepts(profile: WebsitePromoProfile): IdeaConcept[] {
  return [
    {
      id: 'web-concept-1',
      title: `Bedah Mendalam ${profile.brandName} (${profile.domain}): Arsitektur, Fitur Inti & Cara Kerja`,
      angle: 'Eksplorasi mendalam hingga ke sub-halaman, cara kerja sistem, dan fitur utama dengan motion graphics Remotion.',
      hookProposal: `Jangan cuma lihat halaman depannya! Yuk kita bedah cara kerja dan fitur terdalam di ${profile.domain} yang jarang diketahui orang.`,
      visualStyle: 'Deep Website Architecture + Proportional Media PiP + Remotion Motion Graphics',
      corePoints: profile.steps.slice(0, 4).map((s) => `${s.stepBadge}: ${s.title}`),
      targetAudience: 'Pengguna Digital, Pebisnis Online, Developer & Pengambil Keputusan',
    },
    {
      id: 'web-concept-2',
      title: `Kenapa ${profile.brandName} Jauh Lebih Unggul Dibanding Cara Konvensional?`,
      angle: 'Perbandingan metrik, efisiensi alur kerja, dan kapabilitas teknologi di dalam ekosistem website.',
      hookProposal: `Masih pakai cara manual yang lambat? Lihat bagaimana arsitektur ${profile.brandName} di ${profile.domain} memangkas proses rumit secara otomatis!`,
      visualStyle: '3D Isometric Comparison + Kinetic Telemetry Charts',
      corePoints: profile.steps.slice(1, 5).map((s) => `${s.title} - ${s.subtitle}`),
      targetAudience: 'Pebisnis UMKM, Tim Produk, Profesional Muda',
    },
    {
      id: 'web-concept-3',
      title: `Alur Kerja End-to-End Menggunakan ${profile.domain} dari Input hingga Analitik Real-Time`,
      angle: 'Simulasi pipeline 3 tahap, koneksi endpoint, dan visualisasi data langsung dari halaman fitur.',
      hookProposal: `Bagaimana ${profile.domain} memproses semuanya secara instan di balik layar? Ini bedah alur kerja lengkapnya!`,
      visualStyle: 'Interactive Pipeline Diagram + Zoom Lens Media Callout',
      corePoints: profile.steps.slice(2, 6).map((s) => `${s.stepBadge}: ${s.title}`),
      targetAudience: 'Pemula maupun Pengguna Teknis',
    },
    {
      id: 'web-concept-4',
      title: `Eksplorasi Ekosistem Modul & Integrasi di Dalam ${profile.brandName}`,
      angle: 'Showcase Bento grid interaktif untuk setiap sub-fitur, dokumentasi, dan performa sistem.',
      hookProposal: `Di balik tampilan ${profile.domain}, ada ekosistem fitur terintegrasi yang saling terhubung secara otomatis!`,
      visualStyle: 'Bento Feature Grid + Procedural 3D Motion Accents',
      corePoints: profile.steps.slice(3, 7).map((s) => `${s.title}: ${s.metric}`),
      targetAudience: 'Calon Pelanggan & Tim Operasional',
    },
    {
      id: 'web-concept-5',
      title: `Keamanan, Skala Infrastruktur & Cara Memulai di ${profile.brandName}`,
      angle: 'Fokus pada reliabilitas sistem, proteksi data, dan langkah cepat mengakses platform.',
      hookProposal: `Siap meningkatkan skala bisnismu dengan infrastruktur sekelas ${profile.brandName}? Kunjungi ${profile.domain} sekarang!`,
      visualStyle: '3D Security Radar + High-Conversion Launchpad CTA',
      corePoints: profile.steps.slice(4, 8).map((s) => `${s.stepBadge}: ${s.title}`),
      targetAudience: 'Seluruh Calon Pengguna Website',
    },
  ];
}

const SCENE_CAMERAS = [
  'push',
  'pan-left',
  'orbit',
  'pan-right',
  'pull',
  'push',
  'tilt-up',
  'crash',
];

const SCENE_SFX_CUES: Array<'whoosh' | 'pop' | 'ding' | 'click' | 'sparkle' | 'rise'> = [
  'whoosh',
  'pop',
  'click',
  'sparkle',
  'ding',
  'whoosh',
  'pop',
  'ding',
];

const SCENE_THEMES: Array<'paper' | 'dusk' | 'night'> = [
  'paper',
  'dusk',
  'night',
  'paper',
  'dusk',
  'night',
  'paper',
  'night',
];

/**
 * Builds a complete, non-repeating deep explanatory scene list for a website.
 * Every scene explains a specific deep aspect/subpage of the website using actual scraped headings,
 * bullet points, and discovered endpoints, paired with distinct Remotion layouts and proportional media.
 */
export function buildWebsitePromoScenes(
  profile: WebsitePromoProfile,
  targetScenesCount = 8,
  targetDurationSec = 45,
  selectedConcept?: IdeaConcept
): SatsetScene[] {
  const count = Math.max(4, Math.min(12, targetScenesCount || 8));
  const perSceneDuration = Math.max(4, Math.round(targetDurationSec / count));

  const s0 = profile.steps[0];
  const s1 = profile.steps[1] || s0;
  const s2 = profile.steps[2] || s0;
  const s3 = profile.steps[3] || s0;
  const s4 = profile.steps[4] || s0;
  const s5 = profile.steps[5] || s0;
  const s6 = profile.steps[6] || s0;
  const s7 = profile.steps[7] || s0;

  const ep1 = profile.discoveredEndpoints?.[1]?.path || '/features';
  const ep2 = profile.discoveredEndpoints?.[2]?.path || '/products';
  const ep3 = profile.discoveredEndpoints?.[3]?.path || '/docs';

  const baseNarratives = [
    {
      role: 'hook',
      onScreen: `${profile.brandName.toUpperCase()}: ${s0.title.toUpperCase().slice(0, 26)}`,
      narration:
        selectedConcept?.hookProposal ||
        `Pernah penasaran apa yang membuat ${profile.brandName} di ${profile.domain} begitu unggul? Bukan cuma tampilan depannya, mari kita bedah langsung teknologi "${s0.title}" beserta fitur terdalamnya!`,
      emphasis: [profile.brandName, profile.domain, s0.title.split(/\s+/)[0] || 'unggul'],
      visualDesc: `Komposisi Split-Screen Kinetic Typography & Floating Glass PiP beranda ${profile.url} yang menyoroti proposisi "${s0.title}".`,
      layout: 'split_hero_pip',
      anim: 'spring_split_reveal',
    },
    {
      role: 'body_core_point',
      onScreen: s1.title.toUpperCase().slice(0, 34),
      narration: `Banyak tim masih terjebak proses manual yang lambat. Melalui "${s1.title}", ${profile.brandName} menghadirkan solusi terukur: ${s1.subtitle}`,
      emphasis: [s1.title.split(/\s+/)[0] || 'solusi', profile.brandName, 'terukur'],
      visualDesc: `3D Isometric Problem vs Solution Comparison & Particle Pipeline yang membandingkan cara lama dengan "${s1.title}".`,
      layout: 'isometric_compare_pipeline',
      anim: 'isometric_blocks_pop',
    },
    {
      role: 'body_core_point',
      onScreen: `ARSITEKTUR ${s2.title.toUpperCase().slice(0, 24)}`,
      narration: `Saat kita menelusuri halaman dalam ${ep1} dan ${ep2}, terlihat fondasi utamanya yaitu "${s2.title}". ${s2.subtitle}`,
      emphasis: [ep1, s2.title.split(/\s+/)[0] || 'fondasi', 'halaman dalam'],
      visualDesc: `3D Isometric Architecture Node Graph & Endpoint Explorer (${ep1}, ${ep2}, ${ep3}) dengan kartu referensi media proporsional.`,
      layout: 'architecture_node_graph',
      anim: 'node_network_trace',
    },
    {
      role: 'body_core_point',
      onScreen: `CARA KERJA: ${s3.title.toUpperCase().slice(0, 24)}`,
      narration: `Bagaimana mekanisme kerjanya di balik layar? Pada bagian "${s3.title}", setiap permintaan diproses berurutan secara otomatis: ${s3.subtitle}`,
      emphasis: ['mekanisme kerja', s3.title.split(/\s+/)[0] || 'otomatis', 'berurutan'],
      visualDesc: `Interactive 3-Stage Workflow Pipeline & Zoom Lens Callout untuk menjelaskan mekanisme "${s3.title}".`,
      layout: 'workflow_tunnel_zoom',
      anim: 'staggered_pipeline_flow',
    },
    {
      role: 'body_core_point',
      onScreen: `DATA & PERFORMA: ${s4.title.toUpperCase().slice(0, 20)}`,
      narration: `Hasilnya bisa langsung diukur secara akurat. Lewat kapabilitas "${s4.title}", ${s4.subtitle}`,
      emphasis: ['diukur akurat', s4.title.split(/\s+/)[0] || 'performa', s4.metric],
      visualDesc: `Kinetic Data Growth Chart & Radial Telemetry Gauge untuk memvisualisasikan metrik "${s4.metric}" pada ${profile.domain}.`,
      layout: 'kinetic_chart_telemetry',
      anim: 'bar_grow_and_gauge_sweep',
    },
    {
      role: 'body_core_point',
      onScreen: `EKOSISTEM ${s5.title.toUpperCase().slice(0, 24)}`,
      narration: `Tidak berhenti di satu fungsi saja, ekosistem ${profile.brandName} menggabungkan "${s1.title}", "${s2.title}", hingga "${s5.title}" dalam satu platform terpadu.`,
      emphasis: ['ekosistem', profile.brandName, 'terpadu'],
      visualDesc: `Floating 4-Cell Bento Feature Grid yang membedah modul-modul mendalam di ${profile.domain} dengan ikon vektor teranimasi.`,
      layout: 'bento_feature_ecosystem',
      anim: 'bento_stagger_grid',
    },
    {
      role: 'body_core_point',
      onScreen: `PROTEKSI & SKALA: ${s6.title.toUpperCase().slice(0, 20)}`,
      narration: `Untuk menjamin keandalan skala penuh, halaman "${s6.title}" memastikan: ${s6.subtitle}`,
      emphasis: ['keandalan', s6.title.split(/\s+/)[0] || 'keamanan', 'skala penuh'],
      visualDesc: `3D Security Shield Radar & Encrypted Tunnel yang memvisualisasikan lapisan keamanan "${s6.title}".`,
      layout: 'security_radar_shield',
      anim: 'orbital_radar_scan',
    },
    {
      role: 'cta',
      onScreen: `EKSPLORASI ${profile.domain.toUpperCase()} SEKARANG`,
      narration: `Sekarang kamu sudah melihat detail cara kerja dan fitur di dalam ${profile.brandName}. Langsung buka ${profile.domain} dan coba sendiri kemudahannya hari ini!`,
      emphasis: [profile.brandName, profile.domain, 'buka sekarang'],
      visualDesc: `3D Launchpad Portal & Live URL Search Bar dengan efek klik shockwave menuju ${profile.url}.`,
      layout: 'launchpad_cta_portal',
      anim: 'portal_zoom_click',
    },
  ];

  const nonLogoMedia = (profile.discoveredMedia || []).filter(
    (m) => !isWebsiteLogoOrIconAsset(m.url, '', m.label)
  );
  const imageMediaPool = nonLogoMedia.filter((m) => m.type === 'image' || Boolean(m.dataUrl));
  const effectiveMediaPool = imageMediaPool.length > 0 ? imageMediaPool : nonLogoMedia;

  const focusRegions = [
    { fx: 0.5, fy: 0.28, zoom: 1.18 },
    { fx: 0.44, fy: 0.46, zoom: 1.22 },
    { fx: 0.56, fy: 0.38, zoom: 1.24 },
    { fx: 0.46, fy: 0.54, zoom: 1.2 },
    { fx: 0.54, fy: 0.44, zoom: 1.23 },
    { fx: 0.5, fy: 0.62, zoom: 1.19 },
    { fx: 0.45, fy: 0.36, zoom: 1.21 },
    { fx: 0.5, fy: 0.5, zoom: 1.16 },
  ];

  const scenes: SatsetScene[] = [];
  for (let i = 0; i < count; i++) {
    const stepTemplate = profile.steps[i % profile.steps.length];
    const narrativeTemplate = baseNarratives[i % baseNarratives.length];
    const sceneNumber = i + 1;
    const isFirst = i === 0;
    const isLast = i === count - 1;
    const role = isFirst ? 'hook' : isLast ? 'cta' : narrativeTemplate.role;

    const narrationText =
      i < baseNarratives.length
        ? narrativeTemplate.narration
        : `Eksplorasi mendalam tahap ke-${sceneNumber} di ${profile.domain}: modul "${stepTemplate.title}" memastikan ${stepTemplate.subtitle}`;

    const onScreenText =
      i < baseNarratives.length
        ? narrativeTemplate.onScreen
        : `MODUL ${sceneNumber}: ${stepTemplate.title.toUpperCase().slice(0, 28)}`;

    const discoveredMediaItem =
      effectiveMediaPool.length > 0
        ? effectiveMediaPool[i % effectiveMediaPool.length]
        : undefined;
    const rawStepSource =
      stepTemplate.screenshotDataUrl && !isWebsiteLogoOrIconAsset(stepTemplate.screenshotDataUrl)
        ? stepTemplate.screenshotDataUrl
        : undefined;
    const stepScreenshotSource =
      discoveredMediaItem?.dataUrl ||
      rawStepSource ||
      discoveredMediaItem?.url;

    const websiteStep: WebsiteStepVisual = {
      stepNumber: sceneNumber,
      totalSteps: count,
      stepBadge: stepTemplate.stepBadge,
      urlDisplay: stepTemplate.endpointPath
        ? `${profile.url.replace(/\/$/, '')}${stepTemplate.endpointPath.startsWith('/') ? stepTemplate.endpointPath : `/${stepTemplate.endpointPath}`}`
        : profile.url,
      endpointPath: stepTemplate.endpointPath || profile.discoveredEndpoints?.[i % (profile.discoveredEndpoints.length || 1)]?.path || '/',
      brandName: profile.brandName,
      screenTitle: stepTemplate.title,
      screenSubtitle: stepTemplate.subtitle,
      highlightMetric: stepTemplate.metric,
      actionLabel: stepTemplate.actionLabel,
      layoutVariant: stepTemplate.layoutVariant,
      uiCards: stepTemplate.cards,
      primaryColor: profile.primaryColor,
      secondaryColor: profile.secondaryColor,
      accentColor: profile.accentColor,
      screenshotDataUrl: stepScreenshotSource,
    };

    const sfxCue = SCENE_SFX_CUES[i % SCENE_SFX_CUES.length];

    scenes.push({
      id: `scene-${sceneNumber}`,
      scene_number: sceneNumber,
      sceneNumber,
      role,
      target_duration_sec: perSceneDuration,
      durationSeconds: perSceneDuration,
      narration_text: narrationText,
      voiceScript: narrationText,
      on_screen_text: onScreenText,
      hookText: onScreenText,
      headline: onScreenText,
      emphasis_words: narrativeTemplate.emphasis,
      emphasisWords: narrativeTemplate.emphasis,
      visual_animation: {
        layout: narrativeTemplate.layout,
        remotion_animation: narrativeTemplate.anim,
        asset_elements: [
          profile.domain,
          stepTemplate.stepBadge,
          stepTemplate.title,
          stepTemplate.metric,
        ],
      },
      sfx: {
        file: `${sfxCue}.mp3`,
        type: sfxCue,
        play_at_second: 0.05,
      },
      sfxCue,
      visualDescription: narrativeTemplate.visualDesc,
      visual: narrativeTemplate.visualDesc,
      camera: SCENE_CAMERAS[i % SCENE_CAMERAS.length],
      camera_movement: SCENE_CAMERAS[i % SCENE_CAMERAS.length],
      transition_type: i === 0 ? 'fade_in' : i % 2 === 0 ? 'slide_up' : 'zoom_through',
      theme: SCENE_THEMES[i % SCENE_THEMES.length],
      background_theme: SCENE_THEMES[i % SCENE_THEMES.length],
      visualModule: 'uiweb',
      accentColor: profile.primaryColor,
      secondaryColor: profile.secondaryColor,
      website_step: websiteStep,
      media_url: stepScreenshotSource,
      media_type: discoveredMediaItem?.type || (stepScreenshotSource ? 'image' : 'website_snapshot'),
      media_key: `web_step_${sceneNumber}`,
      media_filename: discoveredMediaItem?.label || stepTemplate.title,
      focus_region: focusRegions[i % focusRegions.length],
    });
  }

  ensureWebsitePromoSnapshotsRegistered(profile, scenes);
  return scenes;
}

/**
 * Universal non-repeating scene generator when user picks ANY IdeaConcept in Step 1.
 * Supports both Website URL Promo mode and Regular Remotion Animation mode (with optional uploaded photos/videos).
 */
export function buildNonRepeatingScenesFromConcept(
  concept: IdeaConcept,
  project: SatsetProject,
  targetScenesCount = 8,
  targetDurationSec = 45,
  uploadedMediaOverride?: Array<{
    key?: string;
    mediaKey?: string;
    url?: string;
    dataUrl?: string;
    type: 'image' | 'video';
    filename?: string;
    name?: string;
  }>
): SatsetScene[] {
  const rawTopic = `${project.source_url || ''} ${project.topik_video || ''} ${concept.title || ''} ${concept.hookProposal || ''}`.trim();
  const detectedUrl = extractWebsiteUrl(rawTopic);
  const uploadedMedia =
    Array.isArray(uploadedMediaOverride) && uploadedMediaOverride.length > 0
      ? uploadedMediaOverride
      : Array.isArray(project.uploaded_tutorial_media)
      ? project.uploaded_tutorial_media
      : [];

  if (detectedUrl || (project.start_mode === 'url' && project.source_url) || project.website_promo) {
    const profile =
      project.website_promo ||
      buildWebsitePromoProfile(detectedUrl || project.source_url || project.topik_video || 'https://website.id');
    const webScenes = buildWebsitePromoScenes(profile, targetScenesCount, targetDurationSec, concept);
    if (uploadedMedia.length > 0) {
      return webScenes.map((scene, idx) => {
        const mediaItem = uploadedMedia[idx % uploadedMedia.length];
        if (!mediaItem) return scene;
        const enriched: SatsetScene = {
          ...scene,
          media_url: mediaItem.dataUrl || mediaItem.url,
          media_type: mediaItem.type,
          media_key: mediaItem.mediaKey || mediaItem.key || `uploaded_media_${idx + 1}`,
          media_filename: mediaItem.filename || mediaItem.name,
          focus_region: scene.focus_region || {
            fx: 0.5,
            fy: idx % 2 === 0 ? 0.42 : 0.56,
            zoom: 1.16,
          },
        };
        registerSceneUploadedMediaAsset(enriched);
        return enriched;
      });
    }
    return webScenes;
  }

  const count = Math.max(4, Math.min(12, targetScenesCount || 8));
  const perSceneDuration = Math.max(4, Math.round(targetDurationSec / count));
  const cleanTopic = (project.topik_video || concept.title || 'Strategi Produktivitas & Sistem Kerja')
    .replace(/^(Ide\s*\d+\s*:\s*)/i, '')
    .trim();
  const corePoints =
    Array.isArray(concept.corePoints) && concept.corePoints.length > 0
      ? concept.corePoints
      : [
          `Akar masalah utama dalam ${cleanTopic} yang sering tidak disadari banyak orang`,
          `Kerangka langkah pertama untuk membangun fondasi ${cleanTopic} secara terukur`,
          `Strategi eksekusi harian agar sistem ${cleanTopic} berjalan konsisten tanpa hambatan`,
          `Evaluasi hasil nyata dan metrik keberhasilan setelah menerapkan ${cleanTopic}`,
        ];

  const hookText =
    concept.hookProposal ||
    concept.hook ||
    `Pernahkah kamu bertanya kenapa banyak orang gagal menguasai ${cleanTopic} padahal solusinya ada di depan mata?`;

  const narrativeStages: Array<{
    role: 'hook' | 'body_core_point' | 'cta';
    badge: string;
    onScreen: string;
    narration: string;
    visual: string;
    emphasis: string[];
  }> = [
    {
      role: 'hook',
      badge: 'PEMBUKA UTAMA',
      onScreen: concept.title.toUpperCase().slice(0, 34),
      narration: hookText,
      visual: `Visual pembuka sinematik yang menyoroti inti topik "${cleanTopic}" dengan fokus sudut pandang "${concept.angle}".`,
      emphasis: cleanTopic.split(/\s+/).slice(0, 3),
    },
    {
      role: 'body_core_point',
      badge: 'IDENTIFIKASI MASALAH',
      onScreen: 'KENAPA CARA LAMA SERING GAGAL?',
      narration: `Kebanyakan orang terjebak pada cara manual yang menguras waktu saat menghadapi ${cleanTopic}, sehingga hasilnya jalan di tempat.`,
      visual: `Ilustrasi kontras antara cara lama yang rumit vs pendekatan terstruktur untuk "${cleanTopic}".`,
      emphasis: ['cara manual', 'jalan di tempat', cleanTopic.split(/\s+/)[0] || 'sistem'],
    },
    {
      role: 'body_core_point',
      badge: 'POIN INTI 1',
      onScreen: (corePoints[0] || 'FONDASI UTAMA').toUpperCase().slice(0, 34),
      narration: `Langkah kunci pertama: ${corePoints[0]}. Dengan memulai dari fondasi ini, kamu langsung memangkas separuh hambatan awal.`,
      visual: `Diagram langkah pertama yang memvisualisasikan "${corePoints[0]}" secara bersih dan terstruktur.`,
      emphasis: ['Langkah kunci', 'fondasi', 'hambatan awal'],
    },
    {
      role: 'body_core_point',
      badge: 'POIN INTI 2',
      onScreen: (corePoints[1] || corePoints[0] || 'SISTEM TERSTRUKTUR').toUpperCase().slice(0, 34),
      narration: `Langkah kedua adalah menerapkan ${corePoints[1] || `sistem otomatis pada ${cleanTopic}`} agar setiap proses berjalan rapi tanpa mengandalkan tebakan.`,
      visual: `Visualisasi alur kerja tahap kedua: "${corePoints[1] || cleanTopic}" dengan indikator progres aktif.`,
      emphasis: ['Langkah kedua', 'berjalan rapi', 'progres'],
    },
    {
      role: 'body_core_point',
      badge: 'POIN INTI 3',
      onScreen: (corePoints[2] || 'EKSEKUSI KONSISTEN').toUpperCase().slice(0, 34),
      narration: `Langkah ketiga, fokuskan eksekusi pada ${corePoints[2] || `indikator terpenting dari ${cleanTopic}`} sehingga dampaknya langsung terasa sejak minggu pertama.`,
      visual: `Dashboard metrik dan kartu langkah ketiga untuk "${corePoints[2] || cleanTopic}".`,
      emphasis: ['Langkah ketiga', 'eksekusi', 'minggu pertama'],
    },
    {
      role: 'body_core_point',
      badge: 'STUDI KASUS & METRIK',
      onScreen: 'DAMPAK NYATA & EFISIENSI',
      narration: `Saat ketiga langkah dalam ${concept.title} ini digabungkan, kecepatan kerja dan akurasi hasil meningkat drastis secara konsisten.`,
      visual: `Grafik pertumbuhan hasil dan perbandingan efisiensi sebelum vs sesudah menerapkan "${concept.title}".`,
      emphasis: ['kecepatan kerja', 'akurasi hasil', 'meningkat drastis'],
    },
    {
      role: 'body_core_point',
      badge: 'TIPS OPTIMASI',
      onScreen: 'HINDARI KESALAHAN UMUM INI',
      narration: `Pastikan kamu mengevaluasi setiap tahap secara berkala agar sistem ${cleanTopic} yang sudah dibangun tetap relevan dan mudah ditingkatkan.`,
      visual: `Checklist verifikasi tiga poin penting untuk menjaga kualitas implementasi "${cleanTopic}".`,
      emphasis: ['mengevaluasi', 'tetap relevan', 'checklist'],
    },
    {
      role: 'cta',
      badge: 'KESIMPULAN & AKSI',
      onScreen: 'MULAI TERAPKAN HARI INI!',
      narration: `Sekarang giliranmu mempraktikkan ${cleanTopic} dari langkah pertama hari ini. Simpan video ini dan bagikan ke rekan timmu sekarang juga!`,
      visual: `Tampilan Call-To-Action akhir untuk "${cleanTopic}".`,
      emphasis: ['giliranmu', 'langkah pertama', 'sekarang juga'],
    },
  ];

  const scenes: SatsetScene[] = [];
  for (let i = 0; i < count; i++) {
    const sceneNumber = i + 1;
    const isLast = i === count - 1;
    const stage = isLast
      ? narrativeStages[narrativeStages.length - 1]
      : narrativeStages[i % (narrativeStages.length - 1)];

    const narrationText =
      i < narrativeStages.length || isLast
        ? stage.narration
        : `Tahap pengembangan ke-${sceneNumber}: perluas penerapan ${cleanTopic} dengan mengintegrasikan otomatisasi lanjutan untuk hasil jangka panjang.`;

    const onScreenText =
      i < narrativeStages.length || isLast
        ? stage.onScreen
        : `TAHAP LANJUTAN ${sceneNumber}: ${cleanTopic.toUpperCase().slice(0, 22)}`;

    const sfxCue = SCENE_SFX_CUES[i % SCENE_SFX_CUES.length];
    const uploadedItem = uploadedMedia.length > 0 ? uploadedMedia[i % uploadedMedia.length] : undefined;

    const sceneObj: SatsetScene = {
      id: `scene-${sceneNumber}`,
      scene_number: sceneNumber,
      sceneNumber,
      role: stage.role,
      target_duration_sec: perSceneDuration,
      durationSeconds: perSceneDuration,
      narration_text: narrationText,
      voiceScript: narrationText,
      on_screen_text: onScreenText,
      hookText: onScreenText,
      headline: onScreenText,
      emphasis_words: stage.emphasis,
      emphasisWords: stage.emphasis,
      visual_animation: {
        layout: i === 0 ? 'centered_title_with_floating_icons' : isLast ? 'call_to_action_banner' : 'split_text_and_graphic',
        remotion_animation: i % 2 === 0 ? 'spring_pop_in' : 'slide_from_bottom',
        asset_elements: [stage.badge, onScreenText, ...stage.emphasis.slice(0, 2)],
      },
      sfx: {
        file: `${sfxCue}.mp3`,
        type: sfxCue,
        play_at_second: 0.05,
      },
      sfxCue,
      visualDescription: stage.visual || `Visual adegan ${sceneNumber} untuk "${cleanTopic}".`,
      visual: stage.visual || `Visual adegan ${sceneNumber} untuk "${cleanTopic}".`,
      camera: SCENE_CAMERAS[i % SCENE_CAMERAS.length],
      camera_movement: SCENE_CAMERAS[i % SCENE_CAMERAS.length],
      transition_type: i === 0 ? 'fade_in' : i % 2 === 0 ? 'slide_up' : 'zoom_through',
      theme: SCENE_THEMES[i % SCENE_THEMES.length],
      background_theme: SCENE_THEMES[i % SCENE_THEMES.length],
      visualModule: project.gaya_video || 'diorama_data',
      accentColor: project.warna_brand || '#2563EB',
      secondaryColor: project.brand_secondary_color || '#38BDF8',
      media_url: uploadedItem ? (uploadedItem.dataUrl || uploadedItem.url) : undefined,
      media_type: uploadedItem ? uploadedItem.type : undefined,
      media_key: uploadedItem ? (uploadedItem.mediaKey || uploadedItem.key || `uploaded_media_${sceneNumber}`) : undefined,
      media_filename: uploadedItem ? (uploadedItem.filename || uploadedItem.name) : undefined,
      focus_region: uploadedItem
        ? {
            fx: 0.5,
            fy: i % 2 === 0 ? 0.42 : 0.56,
            zoom: 1.12,
          }
        : undefined,
    };

    if (uploadedItem) {
      registerSceneUploadedMediaAsset(sceneObj);
    }

    scenes.push(sceneObj);
  }

  return scenes;
}

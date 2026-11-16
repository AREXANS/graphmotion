import * as THREE from 'three';

export type PlatformLogoId =
  | 'github'
  | 'youtube'
  | 'tiktok'
  | 'instagram'
  | 'telegram'
  | 'whatsapp'
  | 'google'
  | 'chrome'
  | 'react'
  | 'remotion'
  | 'openai'
  | 'claude'
  | 'vscode'
  | 'figma'
  | 'vercel'
  | 'nextjs'
  | 'python'
  | 'typescript'
  | 'x'
  | 'notion'
  | 'stripe'
  | 'shopify'
  | 'gemini';

export interface PlatformBrandMeta {
  id: PlatformLogoId;
  label: string;
  brandColor: string;
  accentColor: string;
  bgDark: string;
  keywords: RegExp;
}

export const PLATFORM_BRANDS: Record<PlatformLogoId, PlatformBrandMeta> = {
  github: {
    id: 'github',
    label: 'GitHub',
    brandColor: '#181717',
    accentColor: '#ffffff',
    bgDark: '#0d1117',
    keywords: /\b(github|octocat|repo|repository|pull request|commit)\b/i,
  },
  youtube: {
    id: 'youtube',
    label: 'YouTube',
    brandColor: '#FF0000',
    accentColor: '#FFFFFF',
    bgDark: '#1a0606',
    keywords: /\b(youtube|yt|shorts|youtuber|subscribe)\b/i,
  },
  tiktok: {
    id: 'tiktok',
    label: 'TikTok',
    brandColor: '#010101',
    accentColor: '#25F4EE',
    bgDark: '#09090b',
    keywords: /\b(tiktok|fyp|fyppage)\b/i,
  },
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    brandColor: '#E1306C',
    accentColor: '#FCAF45',
    bgDark: '#1c0916',
    keywords: /\b(instagram|reels|ig)\b/i,
  },
  telegram: {
    id: 'telegram',
    label: 'Telegram',
    brandColor: '#26A5E4',
    accentColor: '#FFFFFF',
    bgDark: '#071b29',
    keywords: /\b(telegram|bot telegram)\b/i,
  },
  whatsapp: {
    id: 'whatsapp',
    label: 'WhatsApp',
    brandColor: '#25D366',
    accentColor: '#FFFFFF',
    bgDark: '#062011',
    keywords: /\b(whatsapp|wa)\b/i,
  },
  google: {
    id: 'google',
    label: 'Google',
    brandColor: '#4285F4',
    accentColor: '#FBBC05',
    bgDark: '#0d1526',
    keywords: /\b(google|search engine|seo)\b/i,
  },
  chrome: {
    id: 'chrome',
    label: 'Chrome',
    brandColor: '#4285F4',
    accentColor: '#34A853',
    bgDark: '#0d1824',
    keywords: /\b(chrome|browser|ekstensi)\b/i,
  },
  react: {
    id: 'react',
    label: 'React',
    brandColor: '#61DAFB',
    accentColor: '#087EA4',
    bgDark: '#091a24',
    keywords: /\b(react|reactjs|jsx|tsx)\b/i,
  },
  remotion: {
    id: 'remotion',
    label: 'Remotion',
    brandColor: '#0B84F3',
    accentColor: '#FFFFFF',
    bgDark: '#071426',
    keywords: /\b(remotion|motion video|programmatic video|render mp4)\b/i,
  },
  openai: {
    id: 'openai',
    label: 'ChatGPT',
    brandColor: '#10A37F',
    accentColor: '#FFFFFF',
    bgDark: '#062019',
    keywords: /\b(openai|chatgpt|gpt-4|gpt4|gpt)\b/i,
  },
  claude: {
    id: 'claude',
    label: 'Claude',
    brandColor: '#D97757',
    accentColor: '#FAF9F5',
    bgDark: '#23140e',
    keywords: /\b(claude|anthropic|sonnet|opus)\b/i,
  },
  vscode: {
    id: 'vscode',
    label: 'VS Code',
    brandColor: '#007ACC',
    accentColor: '#2499F3',
    bgDark: '#071929',
    keywords: /\b(vscode|vs code|visual studio code|editor kode)\b/i,
  },
  figma: {
    id: 'figma',
    label: 'Figma',
    brandColor: '#A259FF',
    accentColor: '#0ACF83',
    bgDark: '#170c26',
    keywords: /\b(figma|wireframe|prototype|ui design)\b/i,
  },
  vercel: {
    id: 'vercel',
    label: 'Vercel',
    brandColor: '#000000',
    accentColor: '#FFFFFF',
    bgDark: '#0a0a0c',
    keywords: /\b(vercel|deploy|deployment)\b/i,
  },
  nextjs: {
    id: 'nextjs',
    label: 'Next.js',
    brandColor: '#000000',
    accentColor: '#FFFFFF',
    bgDark: '#09090b',
    keywords: /\b(nextjs|next\.js)\b/i,
  },
  python: {
    id: 'python',
    label: 'Python',
    brandColor: '#3776AB',
    accentColor: '#FFD43B',
    bgDark: '#0c1b29',
    keywords: /\b(python|django|fastapi|flask|pandas)\b/i,
  },
  typescript: {
    id: 'typescript',
    label: 'TypeScript',
    brandColor: '#3178C6',
    accentColor: '#FFFFFF',
    bgDark: '#09182b',
    keywords: /\b(typescript|tsconfig)\b/i,
  },
  x: {
    id: 'x',
    label: 'X / Twitter',
    brandColor: '#000000',
    accentColor: '#FFFFFF',
    bgDark: '#09090b',
    keywords: /\b(twitter|tweet|x\.com|utasan)\b/i,
  },
  notion: {
    id: 'notion',
    label: 'Notion',
    brandColor: '#191919',
    accentColor: '#FFFFFF',
    bgDark: '#141414',
    keywords: /\b(notion|workspace notes)\b/i,
  },
  stripe: {
    id: 'stripe',
    label: 'Stripe',
    brandColor: '#635BFF',
    accentColor: '#FFFFFF',
    bgDark: '#110f30',
    keywords: /\b(stripe|payment gateway|checkout)\b/i,
  },
  shopify: {
    id: 'shopify',
    label: 'Shopify',
    brandColor: '#95BF47',
    accentColor: '#FFFFFF',
    bgDark: '#131f0a',
    keywords: /\b(shopify|toko online|ecommerce)\b/i,
  },
  gemini: {
    id: 'gemini',
    label: 'Gemini',
    brandColor: '#4E86F6',
    accentColor: '#8AB4F8',
    bgDark: '#0c162d',
    keywords: /\b(gemini ai|google gemini)\b/i,
  },
};

const PRIORITY_PLATFORMS: PlatformLogoId[] = [
  'github',
  'youtube',
  'tiktok',
  'instagram',
  'telegram',
  'whatsapp',
  'remotion',
  'react',
  'nextjs',
  'typescript',
  'python',
  'vscode',
  'figma',
  'vercel',
  'openai',
  'claude',
  'google',
  'chrome',
  'notion',
  'stripe',
  'shopify',
  'x',
  'gemini',
];

/**
 * Detects real platforms/tools explicitly mentioned in narration or topic text.
 * Never defaults to Gemini unless explicitly named as "Gemini AI" / "Google Gemini".
 */
export function detectMentionedPlatforms(text: string, maxCount = 4): PlatformLogoId[] {
  const src = String(text || '').trim();
  if (!src) return [];
  const matches: Array<{ id: PlatformLogoId; pos: number }> = [];
  for (const id of PRIORITY_PLATFORMS) {
    const meta = PLATFORM_BRANDS[id];
    const m = meta.keywords.exec(src);
    if (m) {
      matches.push({ id, pos: m.index });
    }
  }
  matches.sort((a, b) => a.pos - b.pos);
  return matches.slice(0, maxCount).map((m) => m.id);
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const cr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + cr, y);
  ctx.lineTo(x + w - cr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + cr);
  ctx.lineTo(x + w, y + h - cr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - cr, y + h);
  ctx.lineTo(x + cr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - cr);
  ctx.lineTo(x, y + cr);
  ctx.quadraticCurveTo(x, y, x + cr, y);
  ctx.closePath();
}

export interface DrawPlatformLogoOptions {
  withBadge?: boolean;
  badgeStyle?: 'circle' | 'rounded';
  withLabel?: boolean;
  labelColor?: string;
}

/**
 * Draws an authentic, recognizable vector brand logo onto Canvas 2D centered at (cx, cy).
 */
export function drawPlatformLogoCanvas(
  ctx: CanvasRenderingContext2D,
  platformId: PlatformLogoId | string,
  cx: number,
  cy: number,
  size = 64,
  options: DrawPlatformLogoOptions = {}
): void {
  const id = (platformId in PLATFORM_BRANDS ? platformId : 'github') as PlatformLogoId;
  const meta = PLATFORM_BRANDS[id];
  const {
    withBadge = true,
    badgeStyle = 'rounded',
    withLabel = false,
    labelColor = '#f8fafc',
  } = options;

  ctx.save();
  ctx.translate(cx, cy);

  if (withBadge) {
    const r = size * 0.5;
    if (badgeStyle === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
    } else {
      drawRoundedRectPath(ctx, -r, -r, size, size, size * 0.24);
    }
    ctx.fillStyle = id === 'instagram' ? '#1c0916' : meta.bgDark;
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, size * 0.032);
    ctx.strokeStyle = meta.brandColor === '#000000' ? '#3f3f46' : meta.brandColor;
    ctx.stroke();
  }

  const s = size * 0.56;
  const half = s * 0.5;

  switch (id) {
    case 'youtube': {
      const rw = s * 1.15;
      const rh = s * 0.8;
      drawRoundedRectPath(ctx, -rw * 0.5, -rh * 0.5, rw, rh, rh * 0.28);
      ctx.fillStyle = '#FF0000';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-s * 0.14, -s * 0.2);
      ctx.lineTo(s * 0.24, 0);
      ctx.lineTo(-s * 0.14, s * 0.2);
      ctx.closePath();
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      break;
    }

    case 'github': {
      // Crisp Octocat silhouette mark inside white/dark circle
      ctx.beginPath();
      ctx.arc(0, 0, half * 1.02, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.fillStyle = '#181717';
      // Ears
      ctx.beginPath();
      ctx.moveTo(-half * 0.58, -half * 0.15);
      ctx.lineTo(-half * 0.56, -half * 0.7);
      ctx.lineTo(-half * 0.14, -half * 0.44);
      ctx.lineTo(half * 0.14, -half * 0.44);
      ctx.lineTo(half * 0.56, -half * 0.7);
      ctx.lineTo(half * 0.58, -half * 0.15);
      // Head/Cheeks
      ctx.bezierCurveTo(half * 0.72, half * 0.18, half * 0.52, half * 0.48, half * 0.24, half * 0.54);
      // Body & shoulders down to circle edge
      ctx.quadraticCurveTo(half * 0.34, half * 0.72, half * 0.32, half * 0.96);
      ctx.lineTo(-half * 0.32, half * 0.96);
      ctx.quadraticCurveTo(-half * 0.34, half * 0.72, -half * 0.24, half * 0.54);
      ctx.bezierCurveTo(-half * 0.52, half * 0.48, -half * 0.72, half * 0.18, -half * 0.58, -half * 0.15);
      ctx.closePath();
      ctx.fill();
      // Tail curl on left
      ctx.strokeStyle = '#181717';
      ctx.lineWidth = Math.max(1.8, s * 0.09);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-half * 0.24, half * 0.72);
      ctx.bezierCurveTo(-half * 0.62, half * 0.78, -half * 0.68, half * 0.48, -half * 0.82, half * 0.46);
      ctx.stroke();
      break;
    }

    case 'tiktok': {
      // Layered RGB offset musical note
      const drawNote = (ox: number, oy: number, col: string) => {
        ctx.save();
        ctx.translate(ox, oy);
        ctx.strokeStyle = col;
        ctx.fillStyle = col;
        ctx.lineWidth = Math.max(2.2, s * 0.14);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(-s * 0.14, s * 0.22, s * 0.22, Math.PI * 0.1, Math.PI * 1.75);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 0.08, s * 0.22);
        ctx.lineTo(s * 0.08, -s * 0.38);
        ctx.quadraticCurveTo(s * 0.16, -s * 0.16, s * 0.38, -s * 0.14);
        ctx.stroke();
        ctx.restore();
      };
      drawNote(-s * 0.045, -s * 0.03, '#25F4EE');
      drawNote(s * 0.045, s * 0.03, '#FE2C55');
      drawNote(0, 0, '#FFFFFF');
      break;
    }

    case 'instagram': {
      const g = ctx.createLinearGradient(-half, half, half, -half);
      g.addColorStop(0, '#FCAF45');
      g.addColorStop(0.5, '#E1306C');
      g.addColorStop(1, '#833AB4');
      drawRoundedRectPath(ctx, -half, -half, s, s, s * 0.28);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = Math.max(1.8, s * 0.09);
      drawRoundedRectPath(ctx, -half * 0.72, -half * 0.72, s * 0.72, s * 0.72, s * 0.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.19, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s * 0.23, -s * 0.23, s * 0.055, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      break;
    }

    case 'telegram': {
      ctx.beginPath();
      ctx.arc(0, 0, half * 1.04, 0, Math.PI * 2);
      ctx.fillStyle = '#26A5E4';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(s * 0.3, -s * 0.25);
      ctx.lineTo(-s * 0.34, 0);
      ctx.lineTo(-s * 0.12, s * 0.1);
      ctx.lineTo(s * 0.2, -s * 0.16);
      ctx.lineTo(-s * 0.04, s * 0.16);
      ctx.lineTo(s * 0.16, s * 0.3);
      ctx.closePath();
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      break;
    }

    case 'whatsapp': {
      ctx.beginPath();
      ctx.arc(0, -s * 0.03, half * 0.96, 0, Math.PI * 2);
      ctx.fillStyle = '#25D366';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-half * 0.75, half * 0.45);
      ctx.lineTo(-half * 0.96, half * 0.96);
      ctx.lineTo(-half * 0.32, half * 0.76);
      ctx.closePath();
      ctx.fill();
      // White phone handset curve
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = Math.max(2.2, s * 0.14);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(s * 0.06, -s * 0.05, s * 0.24, Math.PI * 0.65, Math.PI * 1.45);
      ctx.stroke();
      break;
    }

    case 'google': {
      const r = half * 0.76;
      const lw = Math.max(3, s * 0.22);
      ctx.lineWidth = lw;
      ctx.lineCap = 'butt';
      // Red top
      ctx.strokeStyle = '#EA4335';
      ctx.beginPath();
      ctx.arc(0, 0, r, -Math.PI * 0.8, -Math.PI * 0.2);
      ctx.stroke();
      // Yellow left
      ctx.strokeStyle = '#FBBC05';
      ctx.beginPath();
      ctx.arc(0, 0, r, Math.PI * 0.78, Math.PI * 1.22);
      ctx.stroke();
      // Green bottom
      ctx.strokeStyle = '#34A853';
      ctx.beginPath();
      ctx.arc(0, 0, r, Math.PI * 0.22, Math.PI * 0.8);
      ctx.stroke();
      // Blue right + bar
      ctx.strokeStyle = '#4285F4';
      ctx.beginPath();
      ctx.arc(0, 0, r, -Math.PI * 0.04, Math.PI * 0.26);
      ctx.stroke();
      ctx.fillStyle = '#4285F4';
      ctx.fillRect(0, -lw * 0.44, r + lw * 0.48, lw * 0.88);
      break;
    }

    case 'chrome': {
      const r = half * 0.96;
      ctx.beginPath();
      ctx.arc(0, 0, r, -Math.PI * 0.85, -Math.PI * 0.15);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fillStyle = '#EA4335';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, r, -Math.PI * 0.15, Math.PI * 0.55);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fillStyle = '#FBBC05';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, r, Math.PI * 0.55, Math.PI * 1.15);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fillStyle = '#34A853';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.46, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = '#4285F4';
      ctx.fill();
      break;
    }

    case 'react': {
      ctx.strokeStyle = '#61DAFB';
      ctx.lineWidth = Math.max(1.8, s * 0.068);
      for (const deg of [0, 60, -60]) {
        ctx.save();
        ctx.rotate((deg * Math.PI) / 180);
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.48, s * 0.19, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.095, 0, Math.PI * 2);
      ctx.fillStyle = '#61DAFB';
      ctx.fill();
      break;
    }

    case 'remotion': {
      // Remotion iconic 3-triangle forward wave mark
      const layers: Array<{ scale: number; alpha: number; color: string }> = [
        { scale: 1.0, alpha: 0.42, color: '#38BDF8' },
        { scale: 0.74, alpha: 0.72, color: '#0B84F3' },
        { scale: 0.48, alpha: 1.0, color: '#FFFFFF' },
      ];
      for (const layer of layers) {
        ctx.save();
        ctx.globalAlpha *= layer.alpha;
        const ts = s * 0.52 * layer.scale;
        ctx.beginPath();
        ctx.moveTo(-ts * 0.55, -ts * 0.72);
        ctx.quadraticCurveTo(ts * 0.75, -ts * 0.15, ts * 0.82, 0);
        ctx.quadraticCurveTo(ts * 0.75, ts * 0.15, -ts * 0.55, ts * 0.72);
        ctx.quadraticCurveTo(-ts * 0.32, 0, -ts * 0.55, -ts * 0.72);
        ctx.closePath();
        ctx.fillStyle = layer.color;
        ctx.fill();
        ctx.restore();
      }
      break;
    }

    case 'openai': {
      ctx.strokeStyle = '#10A37F';
      ctx.lineWidth = Math.max(1.9, s * 0.082);
      for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 3);
        ctx.beginPath();
        ctx.roundRect(-s * 0.16, -s * 0.42, s * 0.32, s * 0.46, s * 0.14);
        ctx.stroke();
        ctx.restore();
      }
      break;
    }

    case 'claude': {
      // Sunburst radial geometric rays (Anthropic / Claude warm coral mark)
      ctx.strokeStyle = '#D97757';
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(2, s * 0.095);
      for (let i = 0; i < 10; i++) {
        const ang = (i * Math.PI * 2) / 10;
        const inner = i % 2 === 0 ? s * 0.08 : s * 0.14;
        const outer = i % 2 === 0 ? s * 0.46 : s * 0.36;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * inner, Math.sin(ang) * inner);
        ctx.lineTo(Math.cos(ang) * outer, Math.sin(ang) * outer);
        ctx.stroke();
      }
      break;
    }

    case 'vscode': {
      // Ribbon infinity fold
      ctx.strokeStyle = '#2499F3';
      ctx.lineWidth = Math.max(2.6, s * 0.15);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-s * 0.36, -s * 0.18);
      ctx.lineTo(s * 0.24, s * 0.34);
      ctx.lineTo(s * 0.38, s * 0.22);
      ctx.lineTo(s * 0.38, -s * 0.22);
      ctx.lineTo(s * 0.24, -s * 0.34);
      ctx.lineTo(-s * 0.36, s * 0.18);
      ctx.stroke();
      break;
    }

    case 'figma': {
      const r = s * 0.155;
      const dots: Array<[number, number, string, boolean]> = [
        [-r, -r * 2, '#F24E1E', true],
        [r, -r * 2, '#FF7262', true],
        [-r, 0, '#A259FF', true],
        [r, 0, '#1ABCFE', true],
        [-r, r * 2, '#0ACF83', true],
      ];
      for (const [dx, dy, col] of dots) {
        ctx.beginPath();
        ctx.arc(dx, dy, r * 0.92, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
      }
      break;
    }

    case 'vercel': {
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.42);
      ctx.lineTo(s * 0.46, s * 0.36);
      ctx.lineTo(-s * 0.46, s * 0.36);
      ctx.closePath();
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      break;
    }

    case 'nextjs': {
      ctx.beginPath();
      ctx.arc(0, 0, half * 0.98, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = Math.max(1.5, s * 0.05);
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `900 ${Math.round(s * 0.56)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', 0, s * 0.03);
      break;
    }

    case 'python': {
      // Interlocking blue & yellow snake blocks
      drawRoundedRectPath(ctx, -s * 0.38, -s * 0.42, s * 0.56, s * 0.38, s * 0.12);
      ctx.fillStyle = '#3776AB';
      ctx.fill();
      drawRoundedRectPath(ctx, -s * 0.18, s * 0.04, s * 0.56, s * 0.38, s * 0.12);
      ctx.fillStyle = '#FFD43B';
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-s * 0.2, -s * 0.26, s * 0.055, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(s * 0.2, s * 0.26, s * 0.055, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'typescript': {
      drawRoundedRectPath(ctx, -half, -half, s, s, s * 0.14);
      ctx.fillStyle = '#3178C6';
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `900 ${Math.round(s * 0.52)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TS', s * 0.04, s * 0.08);
      break;
    }

    case 'x': {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = Math.max(2.4, s * 0.12);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-s * 0.34, -s * 0.34);
      ctx.lineTo(s * 0.34, s * 0.34);
      ctx.moveTo(s * 0.34, -s * 0.34);
      ctx.lineTo(-s * 0.34, s * 0.34);
      ctx.stroke();
      break;
    }

    case 'notion': {
      drawRoundedRectPath(ctx, -half * 0.9, -half * 0.9, s * 0.9, s * 0.9, s * 0.14);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#191919';
      ctx.lineWidth = Math.max(1.8, s * 0.07);
      ctx.stroke();
      ctx.fillStyle = '#191919';
      ctx.font = `900 ${Math.round(s * 0.56)}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', 0, s * 0.04);
      break;
    }

    case 'stripe': {
      drawRoundedRectPath(ctx, -half, -half, s, s, s * 0.18);
      ctx.fillStyle = '#635BFF';
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `900 ${Math.round(s * 0.62)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('S', 0, s * 0.04);
      break;
    }

    case 'shopify': {
      ctx.beginPath();
      ctx.moveTo(-s * 0.32, -s * 0.24);
      ctx.lineTo(s * 0.32, -s * 0.24);
      ctx.lineTo(s * 0.4, s * 0.42);
      ctx.lineTo(-s * 0.4, s * 0.42);
      ctx.closePath();
      ctx.fillStyle = '#95BF47';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = Math.max(1.8, s * 0.08);
      ctx.beginPath();
      ctx.arc(0, -s * 0.24, s * 0.16, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `900 ${Math.round(s * 0.42)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('S', 0, s * 0.12);
      break;
    }

    case 'gemini': {
      const r = half * 0.92;
      const g = ctx.createLinearGradient(-r, -r, r, r);
      g.addColorStop(0, '#4E86F6');
      g.addColorStop(1, '#A78BFA');
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.quadraticCurveTo(0, 0, 0, r);
      ctx.quadraticCurveTo(0, 0, -r, 0);
      ctx.quadraticCurveTo(0, 0, 0, -r);
      ctx.closePath();
      ctx.fillStyle = g;
      ctx.fill();
      break;
    }
  }

  if (withLabel) {
    ctx.fillStyle = labelColor;
    ctx.font = `700 ${Math.max(11, Math.round(size * 0.22))}px "Plus Jakarta Sans", Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(meta.label, 0, size * 0.56);
  }

  ctx.restore();
}

const threeLogoTextureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Generates or returns a cached Three.js CanvasTexture containing a crisp authentic brand logo badge.
 */
export function getPlatformLogoThreeTexture(
  platformId: PlatformLogoId,
  pixelSize = 256
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const cacheKey = `${platformId}:${pixelSize}`;
  const existing = threeLogoTextureCache.get(cacheKey);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = pixelSize;
  canvas.height = pixelSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const meta = PLATFORM_BRANDS[platformId] || PLATFORM_BRANDS.github;
  ctx.clearRect(0, 0, pixelSize, pixelSize);

  // Studio card backing with subtle rim glow
  drawRoundedRectPath(ctx, 8, 8, pixelSize - 16, pixelSize - 16, pixelSize * 0.18);
  ctx.fillStyle = meta.bgDark;
  ctx.fill();
  ctx.lineWidth = Math.max(4, pixelSize * 0.025);
  ctx.strokeStyle = meta.brandColor === '#000000' ? '#52525b' : meta.brandColor;
  ctx.stroke();

  drawPlatformLogoCanvas(ctx, platformId, pixelSize * 0.5, pixelSize * 0.42, pixelSize * 0.54, {
    withBadge: false,
    withLabel: false,
  });

  ctx.fillStyle = '#f8fafc';
  ctx.font = `800 ${Math.round(pixelSize * 0.11)}px "Plus Jakarta Sans", Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(meta.label.toUpperCase(), pixelSize * 0.5, pixelSize * 0.82);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  threeLogoTextureCache.set(cacheKey, texture);
  return texture;
}

export function disposePlatformLogoTextures(): void {
  threeLogoTextureCache.forEach((tex) => tex.dispose());
  threeLogoTextureCache.clear();
}

// Register global helpers for compiled Satset scene scripts
if (typeof globalThis !== 'undefined') {
  (globalThis as unknown as Record<string, unknown>).__SATSET_DRAW_PLATFORM_LOGO =
    drawPlatformLogoCanvas;
  (globalThis as unknown as Record<string, unknown>).__SATSET_DETECT_PLATFORMS =
    detectMentionedPlatforms;
}

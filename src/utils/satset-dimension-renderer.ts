// @ts-nocheck
/* eslint-disable */

export type SatsetRenderDimension = '2d' | '2.5d' | '3d';

function parseHexRgb(color: any): [number, number, number] | null {
  if (typeof color !== 'string') return null;
  const clean = color.trim();
  const m6 = /^#([0-9a-f]{6})$/i.exec(clean);
  if (m6) {
    const n = parseInt(m6[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m3 = /^#([0-9a-f]{3})$/i.exec(clean);
  if (m3) {
    const r = parseInt(m3[1][0] + m3[1][0], 16);
    const g = parseInt(m3[1][1] + m3[1][1], 16);
    const b = parseInt(m3[1][2] + m3[1][2], 16);
    return [r, g, b];
  }
  const mRgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(clean);
  if (mRgb) {
    return [Number(mRgb[1]), Number(mRgb[2]), Number(mRgb[3])];
  }
  return null;
}

function shadeColor(color: any, amount: number, fallback = '#38bdf8'): string {
  const rgb = parseHexRgb(color) || parseHexRgb(fallback) || [56, 189, 248];
  const adj = (c: number) => {
    const v = amount >= 0 ? c + (255 - c) * amount : c * (1 + amount);
    return Math.max(0, Math.min(255, Math.round(v)));
  };
  const r = adj(rgb[0]).toString(16).padStart(2, '0');
  const g = adj(rgb[1]).toString(16).padStart(2, '0');
  const b = adj(rgb[2]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

function colorWithAlpha(color: any, alpha: number, fallback = '#38bdf8'): string {
  const rgb = parseHexRgb(color) || parseHexRgb(fallback) || [56, 189, 248];
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${Math.max(0, Math.min(1, alpha))})`;
}

/**
 * Renders the dimension-specific stage environment backdrop BEFORE the user's pasted scene code executes.
 */
export function renderDimensionStagePrePass(
  ctx: CanvasRenderingContext2D,
  dimRaw: any,
  isDark: boolean,
  W: number,
  H: number,
  t: number
): void {
  const dim: SatsetRenderDimension =
    dimRaw === '2d' || dimRaw === '2.5d' || dimRaw === '3d' ? dimRaw : '3d';

  ctx.save();
  if (dim === '2d') {
    // 2D Anime Cel Stage: Makoto Shinkai corner sky-bloom + subtle diagonal anime speed-lines
    const bloom = ctx.createRadialGradient(W * 0.16, H * 0.12, 10, W * 0.16, H * 0.12, W * 0.65);
    bloom.addColorStop(0, isDark ? 'rgba(244, 114, 182, 0.16)' : 'rgba(56, 189, 248, 0.18)');
    bloom.addColorStop(0.55, isDark ? 'rgba(56, 189, 248, 0.07)' : 'rgba(244, 114, 182, 0.08)');
    bloom.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, W, H);

    // Subtle anime cel action speed-lines at top-right & bottom-left corners
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(20, 18, 40, 0.07)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) {
      const len = 70 + ((i * 37) % 90);
      const offset = i * 28;
      ctx.beginPath();
      ctx.moveTo(W - offset, 0);
      ctx.lineTo(W - offset - len, len * 0.65);
      ctx.stroke();
    }
  } else if (dim === '2.5d') {
    // 2.5D Campur Stage: Hybrid isometric/oblique parallax depth grid + soft ambient floating glow
    const floorY = H * 0.72;
    const paraX = Math.sin(t * 0.9) * 10;
    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.11)' : 'rgba(15, 23, 42, 0.08)';
    ctx.lineWidth = 1.2;
    const step = 64;
    for (let x = -W * 0.4; x <= W * 1.4; x += step) {
      ctx.beginPath();
      ctx.moveTo(x + paraX * 0.5, floorY);
      ctx.lineTo(x + (x - W / 2) * 0.45 + paraX, H);
      ctx.stroke();
    }
    for (let r = 0; r < 6; r++) {
      const y = floorY + Math.pow(r / 5, 1.35) * (H - floorY);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  } else {
    // 3D Full Tiga Dimensi Stage: Volumetric overhead studio key-light cone + 3D perspective floor plane & horizon depth
    const horizonY = H * 0.68;
    const keyLight = ctx.createRadialGradient(W * 0.5, H * 0.08, 20, W * 0.5, H * 0.38, W * 0.95);
    keyLight.addColorStop(0, isDark ? 'rgba(56, 189, 248, 0.20)' : 'rgba(255, 255, 255, 0.52)');
    keyLight.addColorStop(0.5, isDark ? 'rgba(99, 102, 241, 0.09)' : 'rgba(224, 242, 254, 0.22)');
    keyLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = keyLight;
    ctx.fillRect(0, 0, W, H);

    // 3D Floor depth plane
    const floorGrad = ctx.createLinearGradient(0, horizonY, 0, H);
    floorGrad.addColorStop(0, isDark ? 'rgba(15, 23, 42, 0.0)' : 'rgba(148, 163, 184, 0.0)');
    floorGrad.addColorStop(0.25, isDark ? 'rgba(15, 23, 42, 0.28)' : 'rgba(148, 163, 184, 0.16)');
    floorGrad.addColorStop(1, isDark ? 'rgba(2, 6, 23, 0.52)' : 'rgba(100, 116, 139, 0.28)');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, horizonY, W, H - horizonY);

    // 3D Perspective studio floor grid with camera orbit shift
    const orbitX = Math.sin(t * 1.1) * 18;
    const vpX = W * 0.5 + orbitX;
    const vpY = horizonY - 24;
    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.14)' : 'rgba(15, 23, 42, 0.10)';
    ctx.lineWidth = 1.2;
    for (let i = -8; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(vpX + i * 24, horizonY);
      ctx.lineTo(vpX + i * 145, H);
      ctx.stroke();
    }
    for (let j = 1; j <= 8; j++) {
      const f = Math.pow(j / 8, 1.85);
      const y = horizonY + f * (H - horizonY);
      ctx.globalAlpha = 0.25 + f * 0.75;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

/**
 * Renders subtle post-processing polish AFTER the user's pasted scene code executes.
 */
export function renderDimensionStagePostPass(
  ctx: CanvasRenderingContext2D,
  dimRaw: any,
  isDark: boolean,
  W: number,
  H: number,
  t: number
): void {
  const dim: SatsetRenderDimension =
    dimRaw === '2d' || dimRaw === '2.5d' || dimRaw === '3d' ? dimRaw : '3d';

  ctx.save();
  if (dim === '2d') {
    // 2D Anime Cel Border & Crisp Cel Bokeh Accents
    ctx.strokeStyle = isDark ? '#e2e8f0' : '#141228';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, W - 20, H - 20);
  } else if (dim === '3d') {
    // 3D Volumetric Rim Vignette & Studio Lens Specular Flare
    const vig = ctx.createRadialGradient(W * 0.5, H * 0.45, W * 0.35, W * 0.5, H * 0.5, H * 0.85);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, isDark ? 'rgba(2, 6, 23, 0.34)' : 'rgba(15, 23, 42, 0.14)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

/**
 * Enhances the Satset `s` context so the exact same pasted scene code renders with:
 * - '2d': 2D Anime Cel-Shaded quality (hard 2-tone cel shadows, bold anime ink outlines, diagonal cel specular slashes, 2D anime characters)
 * - '2.5d': 2.5D Campur Hybrid quality (layered 2.5D extruded backing plates, oblique/isometric 2.5D depth + vector lines, soft parallax shadows)
 * - '3d': 3D Full Tiga Dimensi quality (volumetric 3D extruded slabs with beveled side walls, 4-stop PBR spheres/meshes, perspective 3D micro-orbit, ground AO shadows, 3D WebGL character rig)
 */
export function enhanceSatsetContextForDimension(
  s: any,
  ctx: CanvasRenderingContext2D,
  dimRaw: any,
  isDark: boolean
): any {
  const dim: SatsetRenderDimension =
    dimRaw === '2d' || dimRaw === '2.5d' || dimRaw === '3d' ? dimRaw : '3d';

  s.renderDimension = dim;

  const origCard = s.card;
  const origRect = s.rect;
  const origCircle = s.circle;
  const origEllipse = s.ellipse;
  const origShape = s.shape;
  const origTag = s.tag;
  const origText3d = s.text3d;
  const origBox = s.box;
  const origCube = s.cube;
  const origCylinder = s.cylinder;
  const origCone = s.cone;
  const origSphere = s.sphere;
  const origExtrude = s.extrude;
  const origIsoBox = s.isoBox;
  const origIsoCylinder = s.isoCylinder;
  const origPerson = s.person;

  const animeInk = isDark ? '#0f172a' : '#141228';
  const animeOutline = isDark ? '#f8fafc' : '#141228';

  if (dim === '2d') {
    // ========================================================================
    // 2D ANIME (CEL-SHADED ANIME QUALITY)
    // ========================================================================
    s.card = (x: number, y: number, w: number, h: number, opts: any = {}) => {
      const alpha = Math.max(0, Math.min(1, opts.alpha ?? 1));
      if (alpha <= 0 || w <= 0 || h <= 0) return;
      const r = Math.min(opts.r ?? 24, w / 2, h / 2);
      const baseFill = Array.isArray(opts.fill) ? opts.fill[0] : opts.fill ?? '#ffffff';

      ctx.save();
      ctx.globalAlpha *= alpha;

      // Hard-edged anime cel block shadow (zero blur)
      if (opts.shadow !== false) {
        ctx.fillStyle = isDark ? 'rgba(2, 6, 23, 0.92)' : 'rgba(20, 18, 40, 0.88)';
        ctx.beginPath();
        ctx.roundRect(x + 7, y + 8, w, h, r);
        ctx.fill();
      }

      // Main flat cel fill
      ctx.fillStyle = baseFill;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();

      // Hard 2-tone cel bottom shadow band + diagonal anime window specular slash
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.clip();

      ctx.fillStyle = shadeColor(baseFill, -0.12);
      ctx.fillRect(x, y + h * 0.72, w, h * 0.28);

      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.42)';
      ctx.beginPath();
      ctx.moveTo(x + w * 0.12, y);
      ctx.lineTo(x + w * 0.34, y);
      ctx.lineTo(x + w * 0.08, y + h);
      ctx.lineTo(x - w * 0.14, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Bold anime sumi-ink outline
      ctx.strokeStyle = opts.stroke && opts.stroke !== 'none' ? opts.stroke : animeOutline;
      ctx.lineWidth = Math.max(3.2, opts.width ?? 3.4);
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.stroke();

      ctx.restore();
    };

    s.rect = (x: number, y: number, w: number, h: number, opts: any = {}) => {
      const hasFill = opts.fill && opts.fill !== 'none' && opts.fill !== 'transparent';
      if (hasFill && (opts.draw ?? 1) > 0.1 && w > 12 && h > 12) {
        origRect(x + 4, y + 5, w, h, {
          ...opts,
          fill: isDark ? 'rgba(2, 6, 23, 0.78)' : 'rgba(20, 18, 40, 0.72)',
          stroke: 'none',
          wobble: 0,
          hatch: false,
        });
      }
      origRect(x, y, w, h, {
        ...opts,
        wobble: 0,
        hatch: false,
        stroke:
          opts.stroke === 'none'
            ? hasFill
              ? animeOutline
              : 'none'
            : opts.stroke ?? animeOutline,
        width: Math.max(2.6, opts.width ?? 3),
      });
    };

    s.circle = (x: number, y: number, r: number, opts: any = {}) => {
      const hasFill = opts.fill && opts.fill !== 'none' && opts.fill !== 'transparent';
      if (hasFill && r > 8) {
        origCircle(x + 4, y + 5, r, {
          ...opts,
          fill: isDark ? 'rgba(2, 6, 23, 0.75)' : 'rgba(20, 18, 40, 0.7)',
          stroke: 'none',
          wobble: 0,
          hatch: false,
        });
      }
      origCircle(x, y, r, {
        ...opts,
        wobble: 0,
        hatch: false,
        stroke:
          opts.stroke === 'none'
            ? hasFill
              ? animeOutline
              : 'none'
            : opts.stroke ?? animeOutline,
        width: Math.max(2.6, opts.width ?? 3),
      });
    };

    s.ellipse = (x: number, y: number, rx: number, ry: number, opts: any = {}) => {
      origEllipse(x, y, rx, ry, {
        ...opts,
        wobble: 0,
        hatch: false,
        stroke: opts.stroke ?? animeOutline,
        width: Math.max(2.4, opts.width ?? 2.8),
      });
    };

    s.shape = (pts: any[], opts: any = {}) => {
      origShape(pts, {
        ...opts,
        wobble: 0,
        hatch: false,
        stroke:
          opts.stroke === 'none'
            ? opts.fill && opts.fill !== 'none'
              ? animeOutline
              : 'none'
            : opts.stroke ?? animeOutline,
        width: Math.max(2.5, opts.width ?? 2.8),
      });
    };

    s.tag = (text: string, x: number, y: number, opts: any = {}) => {
      origTag(text, x, y, {
        ...opts,
        stroke: animeOutline,
        width: 3.4,
      });
    };

    s.text3d = (text: string, x: number, y: number, opts: any = {}) => {
      origText3d(text, x, y, {
        ...opts,
        depth: Math.min(4, opts.depth ?? 4),
        stroke: opts.stroke && opts.stroke !== 'none' ? opts.stroke : animeInk,
        side: animeInk,
        width: Math.max(4.5, opts.width ?? 5),
      });
    };

    // 3D Primitives flattened into 2D Anime Cel-Shaded Illustrations
    const animeMeshOpts = (opts: any = {}) => ({
      ...opts,
      ortho: true,
      edges: 'strong',
      stroke: opts.stroke ?? animeOutline,
    });

    const drawAnimeCelSlash = (x: number, y: number, span: number, opts: any = {}) => {
      const alpha = Math.max(0, Math.min(1, (opts.alpha ?? 1) * (opts.draw ?? 1)));
      if (alpha <= 0.1 || span < 12) return;
      ctx.save();
      ctx.globalAlpha *= alpha * 0.85;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(2.5, span * 0.08);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - span * 0.24, y - span * 0.12);
      ctx.lineTo(x + span * 0.08, y - span * 0.34);
      ctx.stroke();
      ctx.restore();
    };

    s.box = (x: number, y: number, w: number, h: number, d: number, opts: any = {}) => {
      origBox(x, y, w, h, d * 0.36, animeMeshOpts(opts));
      drawAnimeCelSlash(x, y, Math.min(w, h), opts);
    };

    s.cube = (x: number, y: number, size: number, opts: any = {}) => {
      origBox(x, y, size, size, size * 0.36, animeMeshOpts(opts));
      drawAnimeCelSlash(x, y, size, opts);
    };

    s.cylinder = (x: number, y: number, r: number, h: number, opts: any = {}) => {
      origCylinder(x, y, r, h, animeMeshOpts({ ...opts, rx: -0.12 }));
      drawAnimeCelSlash(x, y, r * 1.4, opts);
    };

    s.cone = (x: number, y: number, r: number, h: number, opts: any = {}) => {
      origCone(x, y, r, h, animeMeshOpts({ ...opts, rx: -0.1 }));
      drawAnimeCelSlash(x, y, r * 1.3, opts);
    };

    s.extrude = (x: number, y: number, pts: any[], depth: number, opts: any = {}) => {
      origExtrude(x, y, pts, depth * 0.35, animeMeshOpts(opts));
    };

    s.isoBox = (ix: number, iy: number, iz: number, w: number, h: number, d: number, opts: any = {}) => {
      origIsoBox(ix, iy, iz, w, h, d * 0.55, animeMeshOpts(opts));
    };

    s.isoCylinder = (ix: number, iy: number, iz: number, r: number, h: number, opts: any = {}) => {
      origIsoCylinder(ix, iy, iz, r, h * 0.65, animeMeshOpts(opts));
    };

    s.sphere = (x: number, y: number, r: number, opts: any = {}) => {
      const alpha = Math.max(0, Math.min(1, opts.alpha ?? 1));
      const rad = r * (opts.scale ?? 1) * Math.max(0, opts.draw ?? 1);
      if (alpha <= 0 || rad <= 0.5) return;
      const fill = opts.fill ?? '#38bdf8';

      ctx.save();
      ctx.globalAlpha *= alpha;

      // Hard anime cel offset shadow
      ctx.fillStyle = isDark ? 'rgba(2, 6, 23, 0.85)' : 'rgba(20, 18, 40, 0.8)';
      ctx.beginPath();
      ctx.arc(x + Math.max(3, rad * 0.1), y + Math.max(4, rad * 0.12), rad, 0, Math.PI * 2);
      ctx.fill();

      // Base flat anime cel circle
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();

      // Hard quantized 2-tone cel crescent shadow + top rim light
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = shadeColor(fill, -0.32);
      ctx.beginPath();
      ctx.arc(x, y, rad * 1.05, 0, Math.PI * 2);
      ctx.arc(x - rad * 0.28, y - rad * 0.28, rad * 0.92, 0, Math.PI * 2, true);
      ctx.fill('evenodd');

      // Sharp anime key-catchlight oval + secondary dot
      ctx.fillStyle = '#ffffff';
      ctx.save();
      ctx.translate(x - rad * 0.36, y - rad * 0.36);
      ctx.rotate(-0.65);
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(2, rad * 0.22), Math.max(1.2, rad * 0.11), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(x - rad * 0.14, y - rad * 0.52, Math.max(1.2, rad * 0.065), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Bold anime sumi-ink outline
      ctx.strokeStyle = opts.stroke ?? animeOutline;
      ctx.lineWidth = Math.max(3, rad * 0.08);
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    };

    s.person = (x: number, y: number, opts: any = {}) => {
      return origPerson(x, y, {
        ...(opts || {}),
        __characterDimension: '2d',
        __is3DStudioCreator: false,
      });
    };
  } else if (dim === '2.5d') {
    // ========================================================================
    // 2.5D CAMPUR (HYBRID 2D VECTOR + 3D OBLIQUE EXTRUSION & PARALLAX)
    // ========================================================================
    s.card = (x: number, y: number, w: number, h: number, opts: any = {}) => {
      const alpha = Math.max(0, Math.min(1, opts.alpha ?? 1));
      if (alpha <= 0 || w <= 0 || h <= 0) return;
      const r = Math.min(opts.r ?? 28, w / 2, h / 2);
      const baseFill = Array.isArray(opts.fill) ? opts.fill[0] : opts.fill ?? '#ffffff';

      // 2.5D Extruded Backing Plate (Parallax Layer)
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.fillStyle = shadeColor(baseFill, -0.28);
      ctx.beginPath();
      ctx.roundRect(x + 6, y + 7, w, h, r);
      ctx.fill();
      ctx.strokeStyle = opts.stroke || (isDark ? 'rgba(255,255,255,0.32)' : 'rgba(15,23,42,0.35)');
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();

      // Main 2D Vector Card on top
      origCard(x, y, w, h, {
        ...opts,
        stroke: opts.stroke || (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.45)'),
        width: opts.width ?? 2.2,
      });
    };

    s.rect = (x: number, y: number, w: number, h: number, opts: any = {}) => {
      const hasFill = opts.fill && opts.fill !== 'none' && opts.fill !== 'transparent';
      if (hasFill && (opts.draw ?? 1) > 0.1 && w > 14 && h > 14) {
        origRect(x + 4, y + 5, w, h, {
          ...opts,
          fill: shadeColor(opts.fill, -0.32),
          stroke: 'none',
          wobble: 0,
          hatch: false,
        });
      }
      origRect(x, y, w, h, opts);
    };

    s.circle = (x: number, y: number, r: number, opts: any = {}) => {
      const hasFill = opts.fill && opts.fill !== 'none' && opts.fill !== 'transparent';
      if (hasFill && r > 10) {
        origCircle(x + 3.5, y + 4.5, r, {
          ...opts,
          fill: shadeColor(opts.fill, -0.32),
          stroke: 'none',
          wobble: 0,
          hatch: false,
        });
      }
      origCircle(x, y, r, opts);
    };

    // 3D Primitives in 2.5D Oblique Hybrid (Shaded 3D facets + 2D vector edge lines)
    const hybridMeshOpts = (opts: any = {}) => ({
      ...opts,
      ortho: true,
      edges: opts.edges ?? 'strong',
    });

    s.box = (x: number, y: number, w: number, h: number, d: number, opts: any = {}) => {
      origBox(x, y, w, h, d * 0.85, hybridMeshOpts(opts));
    };

    s.cube = (x: number, y: number, size: number, opts: any = {}) => {
      origCube(x, y, size, hybridMeshOpts(opts));
    };

    s.cylinder = (x: number, y: number, r: number, h: number, opts: any = {}) => {
      origCylinder(x, y, r, h, hybridMeshOpts(opts));
    };

    s.cone = (x: number, y: number, r: number, h: number, opts: any = {}) => {
      origCone(x, y, r, h, hybridMeshOpts(opts));
    };

    s.sphere = (x: number, y: number, r: number, opts: any = {}) => {
      origSphere(x, y, r, { ...opts, edges: 'strong' });
    };
  } else {
    // ========================================================================
    // 3D FULL TIGA DIMENSI (VOLUMETRIC 3D EXTRUSION, PBR SHADING & 3D PERSPECTIVE)
    // ========================================================================
    s.card = (x: number, y: number, w: number, h: number, opts: any = {}) => {
      const alpha = Math.max(0, Math.min(1, opts.alpha ?? 1));
      if (alpha <= 0 || w <= 0 || h <= 0) return;
      const r = Math.min(opts.r ?? 28, w / 2, h / 2);
      const baseFill = Array.isArray(opts.fill) ? opts.fill[0] : opts.fill ?? '#ffffff';
      const endFill = Array.isArray(opts.fill) ? opts.fill[1] : shadeColor(baseFill, -0.14);
      const depthSteps = 9;

      ctx.save();
      ctx.globalAlpha *= alpha;

      // Deep 3D ambient occlusion drop shadow
      if (opts.shadow !== false) {
        ctx.save();
        ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.72)' : 'rgba(15, 23, 42, 0.36)';
        ctx.shadowBlur = 46;
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = 26;
        ctx.fillStyle = shadeColor(baseFill, -0.42);
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 6, w, h, r);
        ctx.fill();
        ctx.restore();
      }

      // 3D Volumetric Extruded Bevel Side Wall
      const sideGrad = ctx.createLinearGradient(x, y, x + w, y + h);
      sideGrad.addColorStop(0, shadeColor(baseFill, -0.26));
      sideGrad.addColorStop(0.5, shadeColor(baseFill, -0.38));
      sideGrad.addColorStop(1, shadeColor(baseFill, -0.52));
      ctx.fillStyle = sideGrad;
      for (let d = depthSteps; d >= 1; d--) {
        ctx.beginPath();
        ctx.roundRect(x + d * 0.75, y + d * 1.05, w, h, r);
        ctx.fill();
      }

      // Front 3D PBR Surface Face
      const faceGrad = ctx.createLinearGradient(x, y, x, y + h);
      faceGrad.addColorStop(0, shadeColor(baseFill, 0.14));
      faceGrad.addColorStop(0.45, baseFill);
      faceGrad.addColorStop(1, endFill);
      ctx.fillStyle = faceGrad;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();

      // Glossy 3D Curved Specular Sheen on Upper Surface
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.clip();
      const sheen = ctx.createLinearGradient(x, y, x, y + h * 0.55);
      sheen.addColorStop(0, isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.55)');
      sheen.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
      ctx.fillStyle = sheen;
      ctx.fillRect(x, y, w, h * 0.52);
      ctx.restore();

      // 3D Chamfered Top Rim Highlight & Border
      ctx.strokeStyle =
        opts.stroke && opts.stroke !== 'none'
          ? opts.stroke
          : isDark
          ? 'rgba(255, 255, 255, 0.35)'
          : 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = Math.max(2, opts.width ?? 2.2);
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.stroke();

      ctx.restore();
    };

    s.rect = (x: number, y: number, w: number, h: number, opts: any = {}) => {
      const hasFill = opts.fill && opts.fill !== 'none' && opts.fill !== 'transparent';
      const drawP = Math.max(0, Math.min(1, opts.draw ?? 1));
      if (hasFill && drawP > 0.05 && w > 8 && h > 8) {
        const depth = Math.min(7, Math.max(3, Math.round(Math.min(w, h) * 0.08)));
        const sideColor = shadeColor(opts.fill, -0.38);
        for (let d = depth; d >= 2; d -= 2) {
          origRect(x + d * 0.7, y + d, w, h, {
            ...opts,
            fill: sideColor,
            stroke: 'none',
            wobble: 0,
            hatch: false,
          });
        }
      }
      origRect(x, y, w, h, {
        ...opts,
        wobble: 0,
        hatch: false,
      });
    };

    s.circle = (x: number, y: number, r: number, opts: any = {}) => {
      const hasFill = opts.fill && opts.fill !== 'none' && opts.fill !== 'transparent';
      if (hasFill && r > 6) {
        // Render filled circles in 3D mode as 3D volumetric cushioned domes/spheres
        s.sphere(x, y, r, {
          fill: opts.fill,
          alpha: opts.alpha,
          scale: opts.scale,
          draw: opts.draw,
          stroke: opts.stroke,
          edges: 'none',
        });
        return;
      }
      origCircle(x, y, r, { ...opts, wobble: 0, hatch: false });
    };

    s.ellipse = (x: number, y: number, rx: number, ry: number, opts: any = {}) => {
      const hasFill = opts.fill && opts.fill !== 'none' && opts.fill !== 'transparent';
      if (hasFill && rx > 8 && ry > 6) {
        origEllipse(x + 2.5, y + 4, rx, ry, {
          ...opts,
          fill: shadeColor(opts.fill, -0.38),
          stroke: 'none',
          wobble: 0,
          hatch: false,
        });
      }
      origEllipse(x, y, rx, ry, { ...opts, wobble: 0, hatch: false });
    };

    s.shape = (pts: any[], opts: any = {}) => {
      const hasFill = opts.fill && opts.fill !== 'none' && opts.fill !== 'transparent';
      if (hasFill && Array.isArray(pts) && pts.length >= 3) {
        origShape(
          pts.map((p: number[]) => [p[0] + 3.5, p[1] + 5]),
          {
            ...opts,
            fill: shadeColor(opts.fill, -0.38),
            stroke: 'none',
            wobble: 0,
            hatch: false,
          }
        );
      }
      origShape(pts, { ...opts, wobble: 0, hatch: false });
    };

    s.tag = (text: string, x: number, y: number, opts: any = {}) => {
      const fill = opts.fill ?? '#fbbf24';
      origTag(text, x + 3, y + 5, {
        ...opts,
        fill: shadeColor(fill, -0.4),
        color: 'transparent',
      });
      origTag(text, x, y, opts);
    };

    s.text3d = (text: string, x: number, y: number, opts: any = {}) => {
      const size = opts.size ?? 72;
      const baseDepth = opts.depth ?? Math.round(size / 8);
      origText3d(text, x, y, {
        ...opts,
        depth: Math.max(10, Math.round(baseDepth * 1.45)),
      });
    };

    // 3D Primitives with Full Perspective, Ground AO Shadow, and Dynamic 3D Orbit Parallax
    const draw3DContactShadow = (x: number, y: number, rx: number, ry: number, opts: any = {}) => {
      const alpha = Math.max(0, Math.min(1, (opts.alpha ?? 1) * Math.max(0, opts.draw ?? 1)));
      if (alpha <= 0.05 || rx <= 2) return;
      ctx.save();
      ctx.globalAlpha *= alpha * (isDark ? 0.52 : 0.32);
      const g = ctx.createRadialGradient(x, y, rx * 0.1, x, y, rx);
      g.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
      g.addColorStop(0.6, 'rgba(0, 0, 0, 0.35)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, Math.max(0.2, ry / Math.max(1, rx)));
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.restore();
    };

    const draw3DSpecularHotspot = (x: number, y: number, r: number, opts: any = {}) => {
      const alpha = Math.max(0, Math.min(1, (opts.alpha ?? 1) * Math.max(0, opts.draw ?? 1)));
      if (alpha <= 0.05 || r <= 6) return;
      ctx.save();
      ctx.globalAlpha *= alpha * 0.55;
      const g = ctx.createRadialGradient(x - r * 0.25, y - r * 0.28, 1, x - r * 0.2, y - r * 0.2, r * 0.65);
      g.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      g.addColorStop(0.45, 'rgba(255, 255, 255, 0.22)');
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x - r * 0.2, y - r * 0.2, r * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const full3DMeshOpts = (opts: any = {}, defRx = -0.42, defRy = 0.64) => ({
      ...opts,
      ortho: false,
      edges: 'none',
      rx: (opts.rx ?? defRx) + Math.cos((s.t || 0) * 1.1) * 0.07,
      ry: (opts.ry ?? defRy) + Math.sin((s.t || 0) * 1.35) * 0.13,
    });

    s.box = (x: number, y: number, w: number, h: number, d: number, opts: any = {}) => {
      const sc = (opts.scale ?? 1) * Math.max(0, opts.draw ?? 1);
      draw3DContactShadow(x, y + (h * 0.55 + 14) * sc, Math.max(w, d) * 0.72 * sc, Math.max(w, d) * 0.22 * sc, opts);
      origBox(x, y, w, h, Math.max(d * 1.32, Math.min(w, h) * 0.45), full3DMeshOpts(opts, -0.42, 0.64));
      draw3DSpecularHotspot(x, y, Math.min(w, h) * 0.55 * sc, opts);
    };

    s.cube = (x: number, y: number, size: number, opts: any = {}) => {
      const sc = (opts.scale ?? 1) * Math.max(0, opts.draw ?? 1);
      draw3DContactShadow(x, y + (size * 0.62 + 12) * sc, size * 0.75 * sc, size * 0.24 * sc, opts);
      origBox(x, y, size, size, size * 1.25, full3DMeshOpts(opts, -0.42, 0.64));
      draw3DSpecularHotspot(x, y, size * 0.55 * sc, opts);
    };

    s.cylinder = (x: number, y: number, r: number, h: number, opts: any = {}) => {
      const sc = (opts.scale ?? 1) * Math.max(0, opts.draw ?? 1);
      draw3DContactShadow(x, y + (h * 0.55 + 12) * sc, r * 1.25 * sc, r * 0.36 * sc, opts);
      origCylinder(x, y, r, h, full3DMeshOpts(opts, -0.38, 0.25));
      draw3DSpecularHotspot(x, y, r * 0.85 * sc, opts);
    };

    s.cone = (x: number, y: number, r: number, h: number, opts: any = {}) => {
      const sc = (opts.scale ?? 1) * Math.max(0, opts.draw ?? 1);
      draw3DContactShadow(x, y + (h * 0.55 + 12) * sc, r * 1.25 * sc, r * 0.35 * sc, opts);
      origCone(x, y, r, h, full3DMeshOpts(opts, -0.34, 0.25));
      draw3DSpecularHotspot(x, y, r * 0.75 * sc, opts);
    };

    s.extrude = (x: number, y: number, pts: any[], depth: number, opts: any = {}) => {
      origExtrude(x, y, pts, Math.max(depth * 1.38, 22), full3DMeshOpts(opts, -0.36, 0.62));
    };

    s.isoBox = (ix: number, iy: number, iz: number, w: number, h: number, d: number, opts: any = {}) => {
      origIsoBox(ix, iy, iz, w, h, d * 1.22, {
        ...opts,
        edges: 'none',
      });
    };

    s.isoCylinder = (ix: number, iy: number, iz: number, r: number, h: number, opts: any = {}) => {
      origIsoCylinder(ix, iy, iz, r, h * 1.2, {
        ...opts,
        edges: 'none',
      });
    };

    s.sphere = (x: number, y: number, r: number, opts: any = {}) => {
      const alpha = Math.max(0, Math.min(1, opts.alpha ?? 1));
      const rad = r * (opts.scale ?? 1) * Math.max(0, opts.draw ?? 1);
      if (alpha <= 0 || rad <= 0.5) return;
      const fill = opts.fill ?? '#38bdf8';

      ctx.save();
      ctx.globalAlpha *= alpha;

      // 3D Ground Contact Ambient-Occlusion Shadow
      draw3DContactShadow(x + rad * 0.12, y + rad * 0.92, rad * 0.95, rad * 0.28, { alpha: 1, draw: 1 });

      // 4-Stop Raycast PBR Volumetric Sphere Gradient
      const pbr = ctx.createRadialGradient(
        x - rad * 0.36,
        y - rad * 0.38,
        rad * 0.04,
        x,
        y,
        rad
      );
      pbr.addColorStop(0, shadeColor(fill, 0.68));
      pbr.addColorStop(0.28, shadeColor(fill, 0.18));
      pbr.addColorStop(0.74, shadeColor(fill, -0.32));
      pbr.addColorStop(1, shadeColor(fill, -0.14)); // bottom-right bounce light
      ctx.fillStyle = pbr;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();

      // Intense Specular Lens Hotspot
      const spec = ctx.createRadialGradient(
        x - rad * 0.38,
        y - rad * 0.4,
        0,
        x - rad * 0.38,
        y - rad * 0.4,
        rad * 0.38
      );
      spec.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
      spec.addColorStop(0.45, 'rgba(255, 255, 255, 0.28)');
      spec.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = spec;
      ctx.beginPath();
      ctx.arc(x - rad * 0.38, y - rad * 0.4, rad * 0.38, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric Fresnel Rim Highlight
      ctx.strokeStyle = colorWithAlpha(shadeColor(fill, 0.55), 0.55);
      ctx.lineWidth = Math.max(1.5, rad * 0.045);
      ctx.beginPath();
      ctx.arc(x, y, rad * 0.96, Math.PI * 0.95, Math.PI * 1.65);
      ctx.stroke();

      ctx.restore();
    };

    s.person = (x: number, y: number, opts: any = {}) => {
      return origPerson(x, y, {
        ...(opts || {}),
        __characterDimension: '3d',
        __is3DStudioCreator: true,
      });
    };
  }

  return s;
}

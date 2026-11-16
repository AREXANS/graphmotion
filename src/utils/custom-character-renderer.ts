import {
  CustomCharacterConfig,
  customCharacterToEngineLook,
  BuilderViewMode,
} from './custom-character';
import {
  renderCreator3DToCanvas2D,
  renderMascotOrb3DToCanvas2D,
} from './creator-3d-rig';
import {
  evaluateLipSyncAtTime,
  EvaluatedLipSync,
} from './creator-3d-kinematics';

export interface OtHeadHookContext {
  facing: 1 | -1;
  l: (x: number) => number;
  isSide: boolean;
  isBack: boolean;
  skin: string;
  hairColor: string;
  isFemale: boolean;
  stroke: string;
  lineWidth: number;
}

export interface OtTorsoHookContext {
  torsoTop: number;
  torsoHeight: number;
  facing: 1 | -1;
  l: (x: number) => number;
  P: (x: number) => number;
  isSide: boolean;
  isBack: boolean;
  stroke: string;
  lineWidth: number;
  hands: Record<number, { at: [number, number]; along: number } | undefined>;
  stage?: 'body' | 'props' | 'all';
}

function getCustomCfg(look: any): CustomCharacterConfig | undefined {
  return look?.__customChar as CustomCharacterConfig | undefined;
}

function strokeAndFillPoly(
  ctx: CanvasRenderingContext2D,
  pts: Array<[number, number]>,
  fill: string,
  stroke: string,
  lineWidth = 2.4,
  closed = true
) {
  if (pts.length < 2) return;
  ctx.save();
  ctx.beginPath();
  if (pts.length >= 3 && closed) {
    const firstMidX = (pts[0][0] + pts[1][0]) * 0.5;
    const firstMidY = (pts[0][1] + pts[1][1]) * 0.5;
    ctx.moveTo(firstMidX, firstMidY);
    for (let i = 1; i < pts.length; i++) {
      const curr = pts[i];
      const next = pts[(i + 1) % pts.length];
      const midX = (curr[0] + next[0]) * 0.5;
      const midY = (curr[1] + next[1]) * 0.5;
      ctx.quadraticCurveTo(curr[0], curr[1], midX, midY);
    }
    ctx.closePath();
  } else if (pts.length >= 3 && !closed) {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      const midX = (curr[0] + next[0]) * 0.5;
      const midY = (curr[1] + next[1]) * 0.5;
      ctx.quadraticCurveTo(curr[0], curr[1], midX, midY);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last[0], last[1]);
  } else {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i][0], pts[i][1]);
    }
    if (closed) ctx.closePath();
  }
  if (fill && fill !== 'none') {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke && stroke !== 'none') {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ctx.restore();
}

function eval2DLipSync(e: any, previewStatic: boolean): EvaluatedLipSync {
  const t = Number(e?.t || 0);
  const words = Array.isArray(e?.caption?.words) ? e.caption.words : undefined;
  return evaluateLipSyncAtTime(t, words, {
    pace: e?.pace,
    fallbackSpeaking: !previewStatic && t > 0.06,
  });
}

/**
 * Renders expressive 2D editorial/vector facial features (sculpted brows, radial-gradient iris
 * with catchlights, soft blush, optional gaming headphones, and vowel-synced mouth).
 */
export function renderHumanExpressiveFace(
  e: any,
  look: any,
  hc: OtHeadHookContext
) {
  const ctx: CanvasRenderingContext2D | undefined = e?.ctx;
  if (!ctx || hc.isBack) return;

  const cfg = getCustomCfg(look);
  const { l, isSide, hairColor, stroke, lineWidth } = hc;
  const t = Number(e?.t || 0);
  const lw = Math.max(1.5, (lineWidth || 2.2) * 0.72);
  const browColor = hairColor || look?.hairColor || '#231f20';
  const previewStatic = Math.abs(t - 0.35) < 0.001 && Number(e?.dur || 3) === 3;
  const lip = eval2DLipSync(e, previewStatic);

  // Natural periodic blink (~every 3.2 seconds, ~160ms blink duration)
  const blinkPhase = ((t + 0.7) * 0.31) % 1;
  const isBlinking = blinkPhase > 0.945;
  const browLift = Math.sin(t * 2.7) * 1.1 + lip.stressAccent * -1.4;
  const gazeX = Math.sin(t * 1.4) * 1.05;
  const mouthOpen = lip.mouthOpen;
  const mouthWide = lip.mouthWide;
  const vowel = lip.vowelShape;
  const irisBase = look?.accentColor || (look?.hairColor === '#e63911' ? '#9a4318' : '#3b2416');

  const isCyberFox2D = Boolean(
    look?.__isCyberFox || (look?.species === 'fox' && String(look?.skin || '').toLowerCase() === '#fde6d8')
  );
  const hasMaskOrNiqab =
    Boolean(look?.niqab) || Boolean(cfg?.accessories?.includes('masker'));
  const hasHeadphones =
    !isCyberFox2D && (Boolean(look?.__has3DHeadphone) || Boolean(cfg?.accessories?.includes('headphone')));

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Soft studio blush on cheeks for warm editorial 2D look
  if (!isSide) {
    ctx.fillStyle = 'rgba(244, 114, 100, 0.20)';
    ctx.beginPath();
    ctx.ellipse(-15, 7, 5.5, 2.8, 0, 0, Math.PI * 2);
    ctx.ellipse(15, 7, 5.5, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const drawExpressiveMouth2D = (mx: number, my: number, scaleX = 1) => {
    if (mouthOpen > 0.14) {
      let mw = (4.6 + mouthWide * 2.6) * scaleX;
      let mh = 1.6 + mouthOpen * 3.8;
      if (vowel === 'O') {
        mw = (3.4 + mouthWide * 1.5) * scaleX;
        mh = 2.6 + mouthOpen * 3.9;
      } else if (vowel === 'E') {
        mw = (5.6 + mouthWide * 2.9) * scaleX;
        mh = 1.4 + mouthOpen * 2.6;
      }
      ctx.fillStyle = '#5c1418';
      ctx.strokeStyle = stroke || '#1e293b';
      ctx.lineWidth = lw * 0.85;
      ctx.beginPath();
      ctx.ellipse(mx, my, mw, mh, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Pink tongue
      if (mh > 2.4) {
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.ellipse(mx, my + mh * 0.36, mw * 0.62, mh * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Upper teeth arc
      if (vowel !== 'O') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(mx, my - mh * 0.46, mw * 0.72, Math.max(0.8, mh * 0.25), 0, 0, Math.PI);
        ctx.fill();
      }
    } else {
      ctx.strokeStyle = stroke || '#1e293b';
      ctx.lineWidth = lw * 1.02;
      ctx.beginPath();
      ctx.moveTo(mx - 5.8 * scaleX, my - 0.5);
      ctx.quadraticCurveTo(mx, my + 3.2, mx + 5.8 * scaleX, my - 0.5);
      ctx.stroke();
    }
  };

  if (isSide) {
    // Side-profile sculpted eyebrow
    ctx.strokeStyle = browColor;
    ctx.lineWidth = lw * 1.4;
    ctx.beginPath();
    ctx.moveTo(l(5), -11 + browLift);
    ctx.quadraticCurveTo(l(12), -14.5 + browLift, l(19), -10.5 + browLift);
    ctx.stroke();

    // Side-profile expressive eye
    const ex = l(12);
    const ey = -2.5;
    if (isBlinking) {
      ctx.strokeStyle = stroke || '#1e293b';
      ctx.lineWidth = lw * 1.1;
      ctx.beginPath();
      ctx.moveTo(ex - 4.5, ey);
      ctx.quadraticCurveTo(ex, ey + 2.4, ex + 4.5, ey);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = stroke || '#1e293b';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(ex, ey, 4.8, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const ig = ctx.createRadialGradient(ex + l(1), ey - 0.8, 0.5, ex + l(1), ey, 3.6);
      ig.addColorStop(0, '#c25e1a');
      ig.addColorStop(0.65, irisBase);
      ig.addColorStop(1, '#18181b');
      ctx.fillStyle = ig;
      ctx.beginPath();
      ctx.arc(ex + l(1) + gazeX * 0.45, ey, 3.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(ex + l(1.1) + gazeX * 0.45, ey, 1.65, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex + l(1.8), ey - 1.2, 1.05, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!hasMaskOrNiqab) {
      drawExpressiveMouth2D(l(14.5), 13, 0.78);
    }
  } else {
    // Front / 3-quarter tapered brows
    ctx.strokeStyle = browColor;
    ctx.lineWidth = lw * 1.45;
    ctx.beginPath();
    ctx.moveTo(-16.5, -11.5 + browLift);
    ctx.quadraticCurveTo(-10.5, -15.5 + browLift, -4.8, -11.5 + browLift);
    ctx.moveTo(4.8, -11.5 + browLift);
    ctx.quadraticCurveTo(10.5, -15.5 + browLift, 16.5, -11.5 + browLift);
    ctx.stroke();

    // Front expressive eyes with radial iris + lash ridge + dual catchlights
    for (const side of [-1, 1]) {
      const ex = side * 11.2;
      const ey = -2.2;
      if (isBlinking) {
        ctx.strokeStyle = stroke || '#1e293b';
        ctx.lineWidth = lw * 1.15;
        ctx.beginPath();
        ctx.moveTo(ex - 5.2, ey);
        ctx.quadraticCurveTo(ex, ey + 2.8, ex + 5.2, ey);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = stroke || '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(ex, ey, 5.6, 5.0, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Crisp upper lash line
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.3;
        ctx.beginPath();
        ctx.arc(ex, ey + 0.3, 5.5, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();

        const ix = ex + gazeX * 0.65;
        const iy = ey + 0.25;
        const ig = ctx.createRadialGradient(ix, iy - 1.1, 0.7, ix, iy, 4.2);
        ig.addColorStop(0, '#c25e1a');
        ig.addColorStop(0.62, irisBase);
        ig.addColorStop(1, '#18181b');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(ix, iy, 3.85, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(ix, iy + 0.1, 2.05, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ix - 1.25, iy - 1.45, 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ix + 1.35, iy + 1.3, 0.65, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (!hasMaskOrNiqab) {
      // Subtle nose contour + soft highlight
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.34)';
      ctx.lineWidth = lw * 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -1);
      ctx.lineTo(-1.3, 4.8);
      ctx.lineTo(1.2, 5.5);
      ctx.stroke();

      drawExpressiveMouth2D(0, 14.0, 1);
    }

    // Layered editorial bangs & temple hair locks framing upper forehead so hair wraps naturally
    const hasHairCover = Boolean(look?.hijab || look?.cap || look?.peci || look?.hair === 'none');
    if (!hasHairCover) {
      const hCol = hairColor || look?.hairColor || '#231f20';
      ctx.fillStyle = hCol;
      ctx.strokeStyle = stroke || '#1e293b';
      ctx.lineWidth = lw * 0.85;
      // Left & right temple framing sweeps
      ctx.beginPath();
      ctx.moveTo(-31, -8);
      ctx.quadraticCurveTo(-30, -28, -10, -30);
      ctx.quadraticCurveTo(-18, -20, -24, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(31, -8);
      ctx.quadraticCurveTo(30, -28, 10, -30);
      ctx.quadraticCurveTo(18, -20, 24, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Center sweeping bangs tuft
      ctx.beginPath();
      ctx.moveTo(-14, -28);
      ctx.quadraticCurveTo(0, -33, 15, -27);
      ctx.quadraticCurveTo(6, -18, 2, -14);
      ctx.quadraticCurveTo(-3, -20, -9, -15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  // Optional 2D Vector Gaming Headphones (matches 2D Vektor mode for kreator_3d_headphone & editorial_motion_grid)
  if (hasHeadphones) {
    const accentHex = look?.accentColor || '#ff4520';
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 5.4;
    ctx.beginPath();
    ctx.arc(0, -5, 33, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();

    const cupSides = isSide ? [l(-2)] : [-31, 31];
    for (const sx of cupSides) {
      ctx.fillStyle = '#18181b';
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(sx, 1, 7.2, 12.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = accentHex;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.ellipse(sx, 1, 4.3, 8.4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Renders non-human / humanoid species facial anatomy (fox snout with two-tone cheek ruffs,
 * cat muzzle, bear snout, owl beak, robot LED visor, pointed animal ears, whiskers, and talking mouth).
 */
function renderHumanoidSpeciesHead(
  e: any,
  cfg: CustomCharacterConfig,
  hc: OtHeadHookContext
) {
  const ctx: CanvasRenderingContext2D | undefined = e?.ctx;
  if (!ctx) return;

  const { l, isSide, isBack, stroke, lineWidth } = hc;
  const t = Number(e?.t || 0);
  const lw = Math.max(1.8, lineWidth || 2.2);
  const primaryFur = cfg.furPrimaryColor || cfg.skinColor || '#2563eb';
  const secondaryFur = cfg.furSecondaryColor || '#e0f2fe';
  const earTwitch = Math.sin(t * 2.4) * 1.6;

  // 1. Render Species Ears (visible in front, side, and back views)
  const earStyle = cfg.earStyle || 'fox_pointed';
  if (earStyle === 'fox_pointed' || earStyle === 'wolf_pointed' || earStyle === 'cat_pointed') {
    const earH = earStyle === 'cat_pointed' ? 54 : 64;
    const earSpread = earStyle === 'fox_pointed' ? 38 : 34;
    if (isSide) {
      // Back ear
      strokeAndFillPoly(
        ctx,
        [
          [l(-12), -24],
          [l(-20), -earH + 4 + earTwitch],
          [l(2), -30],
        ],
        primaryFur,
        stroke,
        lw
      );
      // Front ear
      strokeAndFillPoly(
        ctx,
        [
          [l(-4), -22],
          [l(-10), -earH - earTwitch],
          [l(14), -26],
        ],
        primaryFur,
        stroke,
        lw
      );
      strokeAndFillPoly(
        ctx,
        [
          [l(-2), -24],
          [l(-7), -earH + 10 - earTwitch],
          [l(9), -27],
        ],
        secondaryFur,
        'none',
        1
      );
    } else {
      for (const side of [-1, 1]) {
        const twitch = side === 1 ? earTwitch : -earTwitch * 0.6;
        // Outer pointed ear
        strokeAndFillPoly(
          ctx,
          [
            [side * 10, -28],
            [side * earSpread, -earH + twitch],
            [side * 28, -14],
          ],
          primaryFur,
          stroke,
          lw
        );
        if (!isBack) {
          // Inner ear fur
          strokeAndFillPoly(
            ctx,
            [
              [side * 14, -26],
              [side * (earSpread - 5), -earH + 10 + twitch],
              [side * 24, -17],
            ],
            secondaryFur,
            'none',
            1
          );
        }
      }
    }
  } else if (earStyle === 'bunny_long') {
    for (const side of isSide ? [1] : [-1, 1]) {
      const bx = isSide ? l(-4) : side * 15;
      ctx.save();
      ctx.fillStyle = primaryFur;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.ellipse(bx, -56, 8.5, 28, side * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (!isBack) {
        ctx.fillStyle = secondaryFur;
        ctx.beginPath();
        ctx.ellipse(bx, -55, 4.5, 20, side * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  } else if (earStyle === 'bear_round') {
    const earFill = cfg.species === 'panda' ? '#1e293b' : primaryFur;
    for (const side of isSide ? [1] : [-1, 1]) {
      const bx = isSide ? l(-6) : side * 25;
      ctx.save();
      ctx.fillStyle = earFill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.arc(bx, -34, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (!isBack) {
        ctx.fillStyle = secondaryFur;
        ctx.beginPath();
        ctx.arc(bx, -34, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  } else if (earStyle === 'elf_pointed') {
    if (!isSide) {
      for (const side of [-1, 1]) {
        strokeAndFillPoly(
          ctx,
          [
            [side * 27, -6],
            [side * 48, -16],
            [side * 28, 8],
          ],
          primaryFur,
          stroke,
          lw
        );
      }
    }
  } else if (earStyle === 'robot_antenna') {
    ctx.save();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.fillStyle = secondaryFur;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(0, -52);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -55, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  if (isBack) return;

  // 2. Render Muzzle / Cheek Ruffs / Visor
  const muzzle = cfg.muzzleStyle || 'fox_snout';
  const blinkPhase = ((t + 0.7) * 0.31) % 1;
  const isBlinking = blinkPhase > 0.945;
  const previewStatic = Math.abs(t - 0.35) < 0.001 && Number(e?.dur || 3) === 3;
  const lip = eval2DLipSync(e, previewStatic);
  const mouthOpen = lip.mouthOpen;

  if (muzzle === 'robot_visor') {
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = secondaryFur;
    ctx.lineWidth = 2.2;
    if (isSide) {
      ctx.beginPath();
      ctx.roundRect(l(2), -11, 24, 16, 5);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.roundRect(-22, -11, 44, 16, 6);
      ctx.fill();
      ctx.stroke();
      // Glowing cyan LED eyes inside visor
      ctx.fillStyle = '#38bdf8';
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.roundRect(side * 10 - 5, -6, 10, isBlinking ? 2 : 6, 2);
        ctx.fill();
      }
    }
    // Equalizer mouth
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 12);
    ctx.lineTo(8, 12);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (muzzle === 'fox_snout' || muzzle === 'cat_muzzle' || muzzle === 'bear_snout') {
    if (isSide) {
      // Side profile protruding fox/wolf/cat snout
      strokeAndFillPoly(
        ctx,
        [
          [l(8), -4],
          [l(38), 3],
          [l(35), 14],
          [l(10), 21],
        ],
        primaryFur,
        stroke,
        lw
      );
      // Lower white/cream jaw & cheek fur
      strokeAndFillPoly(
        ctx,
        [
          [l(6), 7],
          [l(36), 8],
          [l(34), 16],
          [l(8), 22],
          [l(-8), 16],
        ],
        secondaryFur,
        stroke,
        lw * 0.85
      );
      // Dark nose tip at snout end
      ctx.save();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(l(37), 4.5, 4.2, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Front view two-tone cheek fluff + sculpted snout
      if (muzzle === 'fox_snout') {
        // Iconic fox cheek tufts (left & right cream/white lower cheeks meeting at chin)
        strokeAndFillPoly(
          ctx,
          [
            [-28, 1],
            [-36, 7],
            [-29, 13],
            [-33, 18],
            [-18, 25],
            [0, 27],
            [18, 25],
            [33, 18],
            [29, 13],
            [36, 7],
            [28, 1],
            [14, 4],
            [0, 10],
            [-14, 4],
          ],
          secondaryFur,
          stroke,
          lw * 0.9
        );
        // Forehead-to-nose primary fur bridge
        strokeAndFillPoly(
          ctx,
          [
            [-9, -12],
            [9, -12],
            [6, 6],
            [0, 9],
            [-6, 6],
          ],
          primaryFur,
          'none',
          1
        );
      } else {
        // Cat / Bear / Panda rounded muzzle pad
        ctx.save();
        ctx.fillStyle = cfg.species === 'panda' ? '#f8fafc' : secondaryFur;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lw * 0.85;
        ctx.beginPath();
        ctx.ellipse(0, 10, 15, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Expressive humanoid animal eyes (with panda eye patches if panda)
      for (const side of [-1, 1]) {
        const ex = side * 11.5;
        const ey = -3;
        if (cfg.species === 'panda') {
          ctx.save();
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.ellipse(ex, ey, 7.5, 6, side * 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        if (isBlinking) {
          ctx.save();
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = lw;
          ctx.beginPath();
          ctx.moveTo(ex - 4.5, ey);
          ctx.quadraticCurveTo(ex, ey + 2.4, ex + 4.5, ey);
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.ellipse(ex, ey, 4.8, 3.8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Warm amber/gold iris for blue/orange fox, or contrasting iris
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(ex, ey, 2.9, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(ex, ey, 1.7, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ex + 1.1, ey - 1.1, 0.95, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Triangular animal nose tip
      strokeAndFillPoly(
        ctx,
        [
          [-4.8, 5.2],
          [4.8, 5.2],
          [0, 10.2],
        ],
        '#0f172a',
        '#0f172a',
        1.4
      );

      // Mouth & Whiskers
      ctx.save();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = lw * 0.85;
      ctx.lineCap = 'round';
      if (mouthOpen > 0.22) {
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.ellipse(0, 15.5, 4.5 + mouthOpen * 2, 2 + mouthOpen * 3.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        // Classic animal 'w' philtrum smile
        ctx.beginPath();
        ctx.moveTo(0, 10.2);
        ctx.lineTo(0, 13.5);
        ctx.moveTo(-6.5, 13.5);
        ctx.quadraticCurveTo(-3.2, 16.5, 0, 13.5);
        ctx.quadraticCurveTo(3.2, 16.5, 6.5, 13.5);
        ctx.stroke();
      }

      // Subtle cheek whiskers
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.lineWidth = 1.3;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * 16, 9);
        ctx.lineTo(side * 27, 7.5);
        ctx.moveTo(side * 16, 12.5);
        ctx.lineTo(side * 26, 13);
        ctx.stroke();
      }
      ctx.restore();
    }
    return;
  }

  // Fallback for elf/alien/owl
  renderHumanExpressiveFace(e, { __customChar: cfg }, hc);
  if (muzzle === 'beak' && !isSide) {
    strokeAndFillPoly(
      ctx,
      [
        [-5, 2],
        [5, 2],
        [0, 13],
      ],
      '#f59e0b',
      stroke,
      lw * 0.85
    );
  }
}

/**
 * Renders the 3D Chibi / Vinyl Studio Creator head (AiShift / Kreatorlab style):
 * - Volumetric 3D skin shading
 * - Big expressive 3D brown anime/chibi eyes with thick dark brows & dual specular highlights
 * - Lip-synced 3D mouth with teeth/tongue
 * - Sculpted 3D layered red-orange hair locks with radial 3D highlights & shadow depth
 * - Optional 3D Red-Orange & Matte-Black Gaming Headphones
 */
function render3DStudioCreatorHead(
  e: any,
  look: any,
  hc: OtHeadHookContext
) {
  const ctx: CanvasRenderingContext2D | undefined = e?.ctx;
  if (!ctx) return;

  const { l, isSide, isBack, stroke, lineWidth } = hc;
  const t = Number(e?.t || 0);
  const lw = Math.max(1.8, (lineWidth || 2.2) * 0.85);
  const isCyberFox = Boolean(
    look?.__isCyberFox || (look?.species === 'fox' && String(look?.skin || '').toLowerCase() === '#fde6d8')
  );
  const blinkPhase = ((t + 0.7) * 0.31) % 1;
  const isBlinking = blinkPhase > 0.942;
  const previewStatic = Math.abs(t - 0.35) < 0.001 && Number(e?.dur || 3) === 3;
  const lip = eval2DLipSync(e, previewStatic);
  const browLift = Math.sin(t * 2.8) * 1.1 + lip.stressAccent * -1.4;
  const gazeX = Math.sin(t * 1.5) * 1.2;
  const mouthOpen = lip.mouthOpen;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (isCyberFox) {
    // 3-Layer Pointed Fox Ears behind crown (navy outer, electric blue mid, white inner tuft + yellow gold flash)
    const earSides = isSide ? [l(-4)] : [-25, 25];
    for (const ex of earSides) {
      const tilt = ex < 0 ? -0.26 : 0.26;
      ctx.save();
      ctx.translate(ex, -30);
      ctx.rotate(tilt);
      strokeAndFillPoly(ctx, [[-12, 6], [0, -28], [12, 6]], '#0b1d51', '#09090b', 1.8);
      strokeAndFillPoly(ctx, [[-9, 5], [0, -23], [9, 5]], '#0077ff', '#0b1d51', 1.1);
      strokeAndFillPoly(ctx, [[-5, 4], [0, -14], [5, 4]], '#ffffff', 'rgba(255,255,255,0.2)', 0.6);
      strokeAndFillPoly(ctx, [[-7, 1], [-2, -13], [-1, 3]], '#fde047', '#ca8a04', 0.8);
      ctx.restore();
    }
  }

  // 1. Volumetric 3D oval-tapered V-jawline face shading overlay (replaces round circle)
  if (!isBack) {
    const faceGrad = ctx.createRadialGradient(isSide ? l(5) : -5, -8, 4, 0, 2, 32);
    faceGrad.addColorStop(0, 'rgba(255, 247, 237, 0.56)');
    faceGrad.addColorStop(0.65, 'rgba(246, 213, 186, 0.16)');
    faceGrad.addColorStop(1, 'rgba(194, 132, 95, 0.36)');
    ctx.fillStyle = faceGrad;
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.bezierCurveTo(17, -28, 25.5, -18, 25, -3);
    ctx.bezierCurveTo(24.5, 11, 16, 23.5, 0, 29);
    ctx.bezierCurveTo(-16, 23.5, -24.5, 11, -25, -3);
    ctx.bezierCurveTo(-25.5, -18, -17, -28, 0, -28);
    ctx.closePath();
    ctx.fill();
  }

  // 2. Big Expressive 3D Chibi Eyes, Thick Sculpted Brows & Lip-Synced Mouth
  if (!isBack) {
    if (isSide) {
      const ex = l(11);
      const ey = -1.5;
      // Thick 3D eyebrow
      ctx.fillStyle = isCyberFox ? '#0b3b91' : '#3b1d11';
      ctx.beginPath();
      ctx.moveTo(l(2), -11 + browLift);
      ctx.quadraticCurveTo(l(11), -15.5 + browLift, l(20), -10.5 + browLift);
      ctx.quadraticCurveTo(l(11), -12 + browLift, l(2), -8.5 + browLift);
      ctx.closePath();
      ctx.fill();

      if (isBlinking) {
        ctx.strokeStyle = '#27150e';
        ctx.lineWidth = lw * 1.3;
        ctx.beginPath();
        ctx.moveTo(ex - 6, ey);
        ctx.quadraticCurveTo(ex, ey + 3, ex + 6, ey);
        ctx.stroke();
      } else {
        // Sclera
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#27150e';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.ellipse(ex, ey, 6.2, 6.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Warm 3D Brown Iris (or Sapphire-Cyan Anime Iris for Cyber-Fox)
        const irisGrad = ctx.createRadialGradient(ex + l(1), ey - 1, 1, ex + l(1), ey, 5.2);
        if (isCyberFox) {
          irisGrad.addColorStop(0, '#38bdf8');
          irisGrad.addColorStop(0.65, '#0284c7');
          irisGrad.addColorStop(1, '#0c4a6e');
        } else {
          irisGrad.addColorStop(0, '#b45309');
          irisGrad.addColorStop(0.65, '#78350f');
          irisGrad.addColorStop(1, '#3b1d11');
        }
        ctx.fillStyle = irisGrad;
        ctx.beginPath();
        ctx.ellipse(ex + l(1) + gazeX * 0.4, ey + 0.3, 4.4, 5.0, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dark Pupil
        ctx.fillStyle = '#1c0d06';
        ctx.beginPath();
        ctx.arc(ex + l(1.2) + gazeX * 0.4, ey + 0.4, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Dual Glossy Catchlights
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(ex + l(2.2), ey - 2.1, 1.7, 1.3, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex - l(1.1), ey + 2.1, 0.85, 0, Math.PI * 2);
        ctx.fill();
      }

      // Side Mouth
      const mx = l(14);
      const my = 12.5;
      if (mouthOpen > 0.2) {
        ctx.fillStyle = '#7f1d1d';
        ctx.strokeStyle = '#27150e';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(mx, my, 3.6 + mouthOpen * 1.8, 2.0 + mouthOpen * 3.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#432314';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(l(9), my);
        ctx.quadraticCurveTo(l(14), my + 2.5, l(19), my - 0.5);
        ctx.stroke();
      }
    } else {
      // Front 3D Chibi Eyes (Large & Expressive like Video 1 & Video 2)
      for (const side of [-1, 1]) {
        const ex = side * 11.2;
        const ey = -1.2;

        // Thick sculpted dark-brown eyebrow
        ctx.fillStyle = '#3b1d11';
        ctx.beginPath();
        ctx.moveTo(side * 4.2, -10.2 + browLift);
        ctx.quadraticCurveTo(side * 11.5, -15.5 + browLift, side * 19.5, -10.5 + browLift);
        ctx.quadraticCurveTo(side * 11.5, -11.8 + browLift, side * 4.2, -7.6 + browLift);
        ctx.closePath();
        ctx.fill();

        if (isBlinking) {
          ctx.strokeStyle = '#27150e';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(ex - 6.5, ey + 0.5);
          ctx.quadraticCurveTo(ex, ey + 3.8, ex + 6.5, ey + 0.5);
          ctx.stroke();
        } else {
          // Large rounded-almond white sclera
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#27150e';
          ctx.lineWidth = 2.1;
          ctx.beginPath();
          ctx.ellipse(ex, ey, 6.8, 6.6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Thick upper eyelash ridge
          ctx.strokeStyle = '#1c0d06';
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.arc(ex, ey + 0.5, 6.7, Math.PI * 1.12, Math.PI * 1.88);
          ctx.stroke();

          // Large 3D Iris (Sapphire-Cyan for Cyber-Fox, Warm Brown otherwise)
          const irisX = ex + gazeX * 0.6;
          const irisY = ey + 0.4;
          const irisGrad = ctx.createRadialGradient(irisX, irisY - 1.5, 1, irisX, irisY, 5.4);
          if (isCyberFox) {
            irisGrad.addColorStop(0, '#38bdf8');
            irisGrad.addColorStop(0.55, '#0284c7');
            irisGrad.addColorStop(1, '#0c4a6e');
          } else {
            irisGrad.addColorStop(0, '#c25e1a');
            irisGrad.addColorStop(0.55, '#7c3412');
            irisGrad.addColorStop(1, '#3b1808');
          }
          ctx.fillStyle = irisGrad;
          ctx.beginPath();
          ctx.ellipse(irisX, irisY, 4.9, 5.1, 0, 0, Math.PI * 2);
          ctx.fill();

          // Deep Dark Pupil
          ctx.fillStyle = '#180b04';
          ctx.beginPath();
          ctx.arc(irisX, irisY + 0.2, 2.7, 0, Math.PI * 2);
          ctx.fill();

          // Primary Upper-Left Specular Catchlight
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(irisX - 1.6, irisY - 2.1, 1.8, 1.35, -0.35, 0, Math.PI * 2);
          ctx.fill();

          // Secondary Lower-Right Catchlight
          ctx.beginPath();
          ctx.arc(irisX + 1.8, irisY + 2.0, 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Subtle 3D button nose highlight + shadow
      ctx.fillStyle = 'rgba(154, 88, 52, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 5.2, 2.1, 1.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Expressive 3D Talking Mouth
      const my = 12.8;
      if (mouthOpen > 0.18) {
        const mw = 4.8 + mouthOpen * 2.8;
        const mh = 2.2 + mouthOpen * 3.8;
        ctx.fillStyle = '#6b1d1d';
        ctx.strokeStyle = '#27150e';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(0, my, mw, mh, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Pink tongue inside open mouth
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.ellipse(0, my + mh * 0.35, mw * 0.65, mh * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        // Upper white teeth bar
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, my - mh * 0.48, mw * 0.72, mh * 0.26, 0, 0, Math.PI);
        ctx.fill();
      } else {
        ctx.strokeStyle = '#432314';
        ctx.lineWidth = 2.1;
        ctx.beginPath();
        ctx.moveTo(-5.5, my - 0.4);
        ctx.quadraticCurveTo(0, my + 3.0, 5.5, my - 0.4);
        ctx.stroke();
      }
    }
  }

  // 3. Sculpted 3D Hair Ribbon Locks (smooth quadratic Bezier curves + specular sheen, zero jagged polygons)
  const hairBase = isCyberFox ? '#0077ff' : look?.hairColor || '#e63911';
  const draw3DHairLock = (pts: Array<[number, number]>, isHighlight = false, forceGold = false) => {
    if (pts.length < 3) return;
    ctx.save();
    ctx.beginPath();
    const mid0X = (pts[0][0] + pts[1][0]) * 0.5;
    const mid0Y = (pts[0][1] + pts[1][1]) * 0.5;
    ctx.moveTo(mid0X, mid0Y);
    for (let i = 1; i < pts.length; i++) {
      const curr = pts[i];
      const next = pts[(i + 1) % pts.length];
      const midX = (curr[0] + next[0]) * 0.5;
      const midY = (curr[1] + next[1]) * 0.5;
      ctx.quadraticCurveTo(curr[0], curr[1], midX, midY);
    }
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, -56, 0, 12);
    if (forceGold) {
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.55, '#fde047');
      grad.addColorStop(1, '#eab308');
    } else if (isCyberFox) {
      grad.addColorStop(0, isHighlight ? '#38bdf8' : '#0ea5e9');
      grad.addColorStop(0.55, '#0077ff');
      grad.addColorStop(1, '#0b3b91');
    } else if (isHighlight) {
      grad.addColorStop(0, '#ff9a52');
      grad.addColorStop(0.52, '#f04318');
      grad.addColorStop(1, '#991b1b');
    } else {
      grad.addColorStop(0, '#ff7338');
      grad.addColorStop(0.58, hairBase);
      grad.addColorStop(1, '#7f1d1d');
    }
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = isCyberFox ? '#082f6e' : '#5c1108';
    ctx.lineWidth = 1.45;
    ctx.stroke();

    if (isHighlight && pts.length >= 4) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.26)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(pts[0][0] * 0.85, pts[0][1] + 2);
      ctx.quadraticCurveTo(pts[1][0] * 0.88, pts[1][1] + 3, pts[2][0] * 0.85, pts[2][1] + 2);
      ctx.stroke();
    }
    ctx.restore();
  };

  if (isSide) {
    draw3DHairLock([
      [l(-27), 5],
      [l(-33), -16],
      [l(-24), -43],
      [l(-3), -52],
      [l(22), -45],
      [l(33), -24],
      [l(19), -13],
      [l(4), -19],
      [l(-11), -6],
    ], true);
  } else {
    // Contoured crown & temple base volume (sleek silhouette, never wide mushroom)
    draw3DHairLock([
      [-28, -6],
      [-34, -26],
      [-23, -46],
      [-5, -53],
      [13, -52],
      [28, -43],
      [34, -22],
      [28, -5],
      [16, -20],
      [0, -24],
      [-16, -20],
    ], false);

    if (!isBack) {
      // Left side-parted swept lock framing temple & cheekbone
      draw3DHairLock([
        [-7, -35],
        [-22, -41],
        [-32, -22],
        [-32, 3],
        [-24, 9],
        [-22, -10],
        [-12, -20],
      ], true);

      // Right side-parted swept fringe lock
      draw3DHairLock([
        [-3, -36],
        [18, -42],
        [31, -23],
        [32, 3],
        [24, 9],
        [21, -10],
        [10, -20],
      ], true);

      // Layered diagonal front fringe ribbon lock
      draw3DHairLock([
        [-9, -34],
        [2, -39],
        [16, -27],
        [12, -13],
        [-1, -18],
      ], true);

      // Crown swept feather wave
      draw3DHairLock([
        [-10, -32],
        [-8, -50],
        [6, -55],
        [18, -44],
        [9, -28],
      ], true);
      if (isCyberFox) {
        draw3DHairLock([[-16, -24], [-22, -38], [-8, -26]], true, true);
        draw3DHairLock([[16, -24], [22, -38], [8, -26]], true, true);
        draw3DHairLock([[-2, -32], [4, -50], [10, -32]], true, true);
      }
    }
  }

  // 4. Optional 3D Red-Orange & Matte-Black Gaming Headphones (skip on Cyber-Fox ears)
  if (look?.__has3DHeadphone && !isCyberFox) {
    ctx.save();
    // Dark headband arch over crown
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.arc(0, -6, 35, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();

    const sides = isSide ? [l(-2)] : [-34, 34];
    for (const sx of sides) {
      // Outer black earcup cushion
      ctx.fillStyle = '#18181b';
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx, 1, 8.5, 14.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glowing Red-Orange 3D Ring on Earcup
      ctx.strokeStyle = '#ff4520';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.ellipse(sx, 1, 5.2, 9.8, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Renders the 3D Matte-Black Hoodie details (hood collar, kangaroo pocket, and Red Winged Mascot Chest Emblem)
 * for the 3D Studio Creator character.
 */
function render3DStudioCreatorTorso(
  e: any,
  look: any,
  tc: OtTorsoHookContext
) {
  const ctx: CanvasRenderingContext2D | undefined = e?.ctx;
  if (!ctx) return;
  const { torsoTop, torsoHeight, P, isBack, stroke } = tc;
  const stage = tc.stage || 'all';
  if (stage !== 'all' && stage !== 'body') return;

  const isCyberFox = Boolean(
    look?.__isCyberFox || (look?.species === 'fox' && String(look?.skin || '').toLowerCase() === '#fde6d8')
  );

  ctx.save();
  if (isCyberFox) {
    // 2-Tone Blue & Yellow-Gold Fluffy Fox Tail
    const t = Number(e?.t || 0);
    const wag = Math.sin(t * 3.4) * 5;
    const baseY = torsoTop + torsoHeight - 8;
    ctx.save();
    ctx.fillStyle = '#0077ff';
    ctx.strokeStyle = '#0b1d51';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(P(16), baseY);
    ctx.bezierCurveTo(P(44), baseY - 6, P(70), baseY - 24 + wag, P(64), baseY - 50 + wag);
    ctx.bezierCurveTo(P(46), baseY - 56 + wag, P(24), baseY - 30, P(16), baseY - 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(P(50), baseY - 32 + wag);
    ctx.quadraticCurveTo(P(68), baseY - 38 + wag, P(64), baseY - 50 + wag);
    ctx.quadraticCurveTo(P(48), baseY - 54 + wag, P(42), baseY - 40 + wag);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    if (!isBack) {
      // Open White Inner Tee + Cyan Hoodie Piping + Chest X
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(P(-9), torsoTop + 6, Math.abs(P(9) - P(-9)), torsoHeight - 16, 4);
      ctx.fill();
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(P(-10), torsoTop + 5); ctx.lineTo(P(-10), torsoTop + torsoHeight - 8);
      ctx.moveTo(P(10), torsoTop + 5); ctx.lineTo(P(10), torsoTop + torsoHeight - 8);
      ctx.stroke();
      // Left Chest X Emblem
      const lx = P(16), ly = torsoTop + 26;
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(lx - 4, ly - 4); ctx.lineTo(lx + 4, ly + 4);
      ctx.moveTo(lx + 4, ly - 4); ctx.lineTo(lx - 4, ly + 4);
      ctx.stroke();
      // Belt + Silver Buckle
      ctx.fillStyle = '#09090b';
      ctx.fillRect(P(-24), torsoTop + torsoHeight - 10, Math.abs(P(24) - P(-24)), 6);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(P(-5), torsoTop + torsoHeight - 11, Math.abs(P(5) - P(-5)), 8);
    } else {
      // Big Cyan X on Back of Hoodie
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-12, torsoTop + 24); ctx.lineTo(12, torsoTop + 52);
      ctx.moveTo(12, torsoTop + 24); ctx.lineTo(-12, torsoTop + 52);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // Soft 3D volumetric highlight down center of black hoodie
  const chestGrad = ctx.createLinearGradient(P(-30), torsoTop, P(30), torsoTop + torsoHeight);
  chestGrad.addColorStop(0, 'rgba(255,255,255,0.10)');
  chestGrad.addColorStop(0.5, 'rgba(255,255,255,0.03)');
  chestGrad.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = chestGrad;
  ctx.beginPath();
  ctx.roundRect(P(-28), torsoTop + 2, Math.abs(P(28) - P(-28)), torsoHeight - 6, 12);
  ctx.fill();

  // Sculpted hoodie neck collar
  strokeAndFillPoly(
    ctx,
    [
      [P(-22), torsoTop - 3],
      [P(22), torsoTop - 3],
      [P(16), torsoTop + 10],
      [P(0), torsoTop + 14],
      [P(-16), torsoTop + 10],
    ],
    '#1f1f24',
    stroke || '#09090b',
    1.8
  );

  if (!isBack) {
    // Red Winged Mascot Emblem on left chest (matching AiShift / Kreatorlab hoodie)
    const lx = P(13);
    const ly = torsoTop + 26;
    ctx.fillStyle = '#ff3b30';
    ctx.beginPath();
    ctx.arc(lx, ly, 5.5, 0, Math.PI * 2);
    ctx.fill();
    // Little wing tip on emblem
    ctx.beginPath();
    ctx.moveTo(lx + 4, ly - 1);
    ctx.lineTo(lx + 9, ly - 5);
    ctx.lineTo(lx + 6, ly + 3);
    ctx.closePath();
    ctx.fill();

    // Front hoodie kangaroo pocket seam
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(P(-18), torsoTop + torsoHeight - 28);
    ctx.lineTo(P(-12), torsoTop + torsoHeight - 44);
    ctx.lineTo(P(12), torsoTop + torsoHeight - 44);
    ctx.lineTo(P(18), torsoTop + torsoHeight - 28);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Renders extended hairstyles, headwear, eyewear, facial hair, and headphones
 * inside Ot()'s transformed head coordinate frame (origin 0,0 = center of head).
 */
export function renderCustomCharacterHeadExtras(
  e: any,
  look: any,
  hc: OtHeadHookContext
) {
  if (look?.__is3DStudioCreator) {
    render3DStudioCreatorHead(e, look, hc);
    return;
  }

  const cfg = getCustomCfg(look);
  const isHumanoidNonHuman = Boolean(cfg?.species && cfg.species !== 'human');

  if (isHumanoidNonHuman && cfg) {
    renderHumanoidSpeciesHead(e, cfg, hc);
  } else {
    renderHumanExpressiveFace(e, look, hc);
  }

  if (!cfg) return;
  const ctx: CanvasRenderingContext2D | undefined = e?.ctx;
  if (!ctx) return;

  const { l, isSide, isBack, hairColor, stroke, lineWidth } = hc;
  const accSet = new Set(cfg.accessories || []);
  const accColor = (id: string, fallback: string) => cfg.accessoryColors?.[id] || fallback;
  const lw = Math.max(1.8, lineWidth || 2.4);

  // 1. Extended hair styles (only when not wearing hijab/khimar)
  const hs = cfg.hairStyle;
  const hasHijab = hs === 'hijab_simpel' || hs === 'khimar' || cfg.oneSetId === 'gamis_syari';
  if (!hasHijab && hs !== 'botak') {
    if (isBack) {
      if (hs === 'kuncir') {
        ctx.save();
        ctx.fillStyle = hairColor;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.ellipse(0, 12, 13, 28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -14, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (hs === 'mohawk') {
        strokeAndFillPoly(
          ctx,
          [[-9, -56], [9, -56], [11, -18], [-11, -18]],
          hairColor,
          stroke,
          lw
        );
      }
    } else {
      switch (hs) {
        case 'mohawk':
          strokeAndFillPoly(
            ctx,
            isSide
              ? [[l(-22), -24], [l(-16), -58], [l(8), -62], [l(26), -48], [l(20), -26]]
              : [[-10, -24], [-13, -58], [0, -64], [13, -58], [10, -24]],
            hairColor,
            stroke,
            lw
          );
          break;
        case 'spiky':
        case 'quiff':
        case 'messy_layer':
        case 'koma_hair': {
          const lockPts: Array<[number, number]> = isSide
            ? [
                [l(-26), -16],
                [l(-24), -42],
                [l(-6), -48],
                [l(10), -52],
                [l(28), -42],
                [l(24), -20],
                [l(6), -24],
              ]
            : [
                [-26, -12],
                [-29, -34],
                [-16, -48],
                [2, -52],
                [20, -46],
                [29, -30],
                [25, -12],
                [14, -24],
                [-2, -20],
                [-15, -24],
              ];
          ctx.save();
          ctx.beginPath();
          const m0x = (lockPts[0][0] + lockPts[1][0]) * 0.5;
          const m0y = (lockPts[0][1] + lockPts[1][1]) * 0.5;
          ctx.moveTo(m0x, m0y);
          for (let i = 1; i < lockPts.length; i++) {
            const c = lockPts[i];
            const n = lockPts[(i + 1) % lockPts.length];
            ctx.quadraticCurveTo(c[0], c[1], (c[0] + n[0]) * 0.5, (c[1] + n[1]) * 0.5);
          }
          ctx.closePath();
          ctx.fillStyle = hairColor;
          ctx.fill();
          ctx.strokeStyle = stroke;
          ctx.lineWidth = lw;
          ctx.stroke();
          ctx.restore();
          break;
        }
        case 'pompadour':
          strokeAndFillPoly(
            ctx,
            isSide
              ? [[l(-26), -18], [l(-22), -40], [l(2), -52], [l(30), -44], [l(28), -26], [l(8), -22]]
              : [[-27, -16], [-25, -39], [-4, -52], [22, -46], [28, -24], [10, -20]],
            hairColor,
            stroke,
            lw
          );
          break;
        case 'belah_tengah':
          if (!isSide) {
            ctx.save();
            ctx.fillStyle = hairColor;
            ctx.strokeStyle = stroke;
            ctx.lineWidth = lw * 0.9;
            ctx.beginPath();
            ctx.moveTo(0, -38);
            ctx.quadraticCurveTo(-18, -36, -27, -10);
            ctx.quadraticCurveTo(-16, -18, 0, -24);
            ctx.quadraticCurveTo(16, -18, 27, -10);
            ctx.quadraticCurveTo(18, -36, 0, -38);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
          break;
        case 'undercut':
          if (isSide) {
            strokeAndFillPoly(
              ctx,
              [[l(-26), -18], [l(-22), -42], [l(10), -46], [l(28), -32], [l(10), -22]],
              hairColor,
              stroke,
              lw
            );
          }
          break;
        case 'buzz_cut':
          ctx.save();
          ctx.fillStyle = hairColor;
          ctx.beginPath();
          ctx.arc(0, -18, 28, Math.PI * 1.05, Math.PI * 1.95);
          ctx.fill();
          ctx.restore();
          break;
        case 'kuncir':
          if (isSide) {
            ctx.save();
            ctx.fillStyle = hairColor;
            ctx.strokeStyle = stroke;
            ctx.lineWidth = lw;
            ctx.beginPath();
            ctx.ellipse(l(-34), -6, 11, 24, l(0.35), 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
          break;
        case 'bob_pendek':
          if (!isSide) {
            strokeAndFillPoly(
              ctx,
              [[-34, 8], [-32, -26], [0, -42], [32, -26], [34, 8], [24, 10], [22, -18], [0, -24], [-22, -18], [-24, 10]],
              hairColor,
              stroke,
              lw
            );
          }
          break;
        case 'kribo':
          ctx.save();
          ctx.fillStyle = hairColor;
          ctx.strokeStyle = stroke;
          ctx.lineWidth = lw;
          for (let a = 0; a < 9; a++) {
            const ang = Math.PI * (0.95 + (a / 8) * 1.1);
            ctx.beginPath();
            ctx.arc(Math.cos(ang) * 30, Math.sin(ang) * 28 - 10, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
          ctx.restore();
          break;
      }
    }
  }

  // 2. Eyewear (front & side only — drawn AFTER face/muzzle so glasses sit cleanly on top)
  if (!isBack) {
    if (accSet.has('kacamata_hitam')) {
      const col = accColor('kacamata_hitam', '#111827');
      ctx.save();
      ctx.fillStyle = col;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.4;
      if (isSide) {
        ctx.beginPath();
        ctx.roundRect(l(8) - 10, -10, 20, 14, 4);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(l(0), -3);
        ctx.lineTo(l(-16), -2);
        ctx.stroke();
      } else {
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.roundRect(side * 12.5 - 10, -10, 20, 14, 4);
          ctx.fill();
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(-2.5, -5);
        ctx.lineTo(2.5, -5);
        ctx.stroke();
        // Subtle lens highlight
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-18, -7);
        ctx.lineTo(-12, -2);
        ctx.moveTo(8, -7);
        ctx.lineTo(14, -2);
        ctx.stroke();
      }
      ctx.restore();
    } else if (accSet.has('kacamata_kotak')) {
      const col = accColor('kacamata_kotak', '#0f172a');
      ctx.save();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.6;
      if (isSide) {
        ctx.beginPath();
        ctx.roundRect(l(8) - 9, -10, 18, 14, 3);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(l(0), -3);
        ctx.lineTo(l(-15), -2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.roundRect(-22, -10, 19, 14, 3);
        ctx.roundRect(3, -10, 19, 14, 3);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-3, -4);
        ctx.lineTo(3, -4);
        ctx.moveTo(-22, -5);
        ctx.lineTo(-27, -3);
        ctx.moveTo(22, -5);
        ctx.lineTo(27, -3);
        ctx.stroke();
        // Crisp glass reflection
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-18, -7);
        ctx.lineTo(-13, -1);
        ctx.moveTo(7, -7);
        ctx.lineTo(12, -1);
        ctx.stroke();
      }
      ctx.restore();
    } else if (accSet.has('kacamata_bulat')) {
      const col = accColor('kacamata_bulat', '#1e293b');
      ctx.save();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.5;
      if (isSide) {
        ctx.beginPath();
        ctx.arc(l(9), -3, 8.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(l(0.5), -3);
        ctx.lineTo(l(-15), -2);
        ctx.stroke();
      } else {
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(side * 12, -3, 8.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(-3.2, -3.5);
        ctx.lineTo(3.2, -3.5);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Facial hair (kumis & jenggot) — subtle clean silhouettes
    if (accSet.has('kumis')) {
      const col = accColor('kumis', hairColor || '#231f20');
      strokeAndFillPoly(
        ctx,
        isSide
          ? [[l(12), 11], [l(26), 13], [l(24), 18], [l(10), 16]]
          : [[-13, 15], [-5, 10], [0, 13], [5, 10], [13, 15], [7, 18], [0, 16], [-7, 18]],
        col,
        stroke,
        1.5
      );
    }
    if (accSet.has('jenggot')) {
      const col = accColor('jenggot', hairColor || '#231f20');
      strokeAndFillPoly(
        ctx,
        isSide
          ? [[l(4), 14], [l(20), 22], [l(14), 38], [l(-4), 32]]
          : [[-18, 16], [18, 16], [14, 34], [0, 41], [-14, 34]],
        col,
        stroke,
        1.8
      );
    }
  }

  // 4. Headphone
  if (accSet.has('headphone')) {
    const col = accColor('headphone', '#2563eb');
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, -6, 33, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    if (isSide) {
      ctx.beginPath();
      ctx.ellipse(l(-2), 2, 9, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(side * 33, 2, 7, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // 5. Extended Headwear
  if (accSet.has('topi_rimba')) {
    const col = accColor('topi_rimba', '#3f6212');
    strokeAndFillPoly(ctx, [[-44, -14], [44, -14], [34, -22], [-34, -22]], col, stroke, lw);
    strokeAndFillPoly(ctx, [[-28, -22], [-24, -44], [24, -44], [28, -22]], col, stroke, lw);
  } else if (accSet.has('kupluk')) {
    const col = accColor('kupluk', '#dc2626');
    strokeAndFillPoly(
      ctx,
      [[-33, -16], [-30, -40], [-14, -52], [14, -52], [30, -40], [33, -16]],
      col,
      stroke,
      lw
    );
    ctx.save();
    ctx.fillStyle = col;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(0, -56, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (accSet.has('caping')) {
    const col = accColor('caping', '#d4a373');
    strokeAndFillPoly(ctx, [[-56, -12], [0, -58], [56, -12]], col, stroke, lw);
  } else if (accSet.has('helm_proyek')) {
    const col = accColor('helm_proyek', '#facc15');
    strokeAndFillPoly(
      ctx,
      [[-36, -16], [-32, -40], [-14, -52], [14, -52], [32, -40], [36, -16], [42, -12], [-42, -12]],
      col,
      stroke,
      lw
    );
    strokeAndFillPoly(ctx, [[-6, -54], [6, -54], [8, -24], [-8, -24]], col, stroke, lw * 0.8);
  } else if (accSet.has('topi_chef') || cfg.oneSetId === 'chef') {
    const col = accColor('topi_chef', '#f8fafc');
    strokeAndFillPoly(ctx, [[-26, -18], [-28, -36], [28, -36], [26, -18]], col, stroke, lw);
    ctx.save();
    ctx.fillStyle = col;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    for (const [cx, cy, r] of [[-16, -42, 16], [0, -48, 18], [16, -42, 16]]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  } else if (accSet.has('toga_cap') || cfg.oneSetId === 'wisuda') {
    const col = accColor('toga_cap', '#0f172a');
    strokeAndFillPoly(ctx, [[-28, -22], [28, -22], [24, -38], [-24, -38]], col, stroke, lw);
    strokeAndFillPoly(ctx, [[-48, -38], [0, -50], [48, -38], [0, -28]], col, stroke, lw);
    ctx.save();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(28, -38);
    ctx.lineTo(36, -12);
    ctx.stroke();
    ctx.restore();
  } else if (accSet.has('mahkota')) {
    const col = accColor('mahkota', '#facc15');
    strokeAndFillPoly(
      ctx,
      [[-24, -26], [-26, -52], [-12, -39], [0, -58], [12, -39], [26, -52], [24, -26]],
      col,
      stroke,
      lw
    );
  }
}

/**
 * Renders extended bags, neckwear, one-set uniform stripes/motifs, standing cane, and humanoid tails
 * inside Ot()'s transformed torso coordinate frame (so lean & shift match body pose).
 */
export function renderCustomCharacterTorsoExtras(
  e: any,
  look: any,
  tc: OtTorsoHookContext
) {
  if (look?.__is3DStudioCreator) {
    render3DStudioCreatorTorso(e, look, tc);
  }
  const cfg = getCustomCfg(look);
  if (!cfg) return;
  const ctx: CanvasRenderingContext2D | undefined = e?.ctx;
  if (!ctx) return;

  const { torsoTop, torsoHeight, P, isSide, isBack, stroke, lineWidth, hands } = tc;
  const accSet = new Set(cfg.accessories || []);
  const accColor = (id: string, fallback: string) => cfg.accessoryColors?.[id] || fallback;
  const lw = Math.max(1.8, lineWidth || 2.2);

  const stage = tc.stage || 'all';
  const drawBody = stage === 'all' || stage === 'body';
  const drawProps = stage === 'all' || stage === 'props';

  // 0. Humanoid Tail & Chest Fur Tuft (Fox / Cat / Wolf / Bunny / Bear)
  if (drawBody && cfg.tailStyle && cfg.tailStyle !== 'none') {
    const t = Number(e?.t || 0);
    const wag = Math.sin(t * 3.4) * 6;
    const primaryFur = cfg.furPrimaryColor || cfg.skinColor || '#2563eb';
    const secondaryFur = cfg.furSecondaryColor || '#e0f2fe';
    const baseY = torsoTop + torsoHeight - 10;

    if (cfg.tailStyle === 'fox_fluffy' || cfg.tailStyle === 'wolf_bushy') {
      const dir = isSide ? -1 : 1;
      const rootX = P(dir * 20);
      const midX = P(dir * 60);
      const tipX = P(dir * 78);
      const tipY = baseY - 58 + wag;

      // Main fluffy tail body
      ctx.save();
      ctx.fillStyle = primaryFur;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(rootX, baseY);
      ctx.bezierCurveTo(
        P(dir * 48),
        baseY - 4,
        P(dir * 82),
        baseY - 26 + wag * 0.6,
        tipX,
        tipY
      );
      ctx.bezierCurveTo(
        midX,
        baseY - 64 + wag * 0.8,
        P(dir * 28),
        baseY - 34,
        rootX,
        baseY - 12
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Contrasting white/cream fluffy fox tail tip
      ctx.fillStyle = secondaryFur;
      ctx.beginPath();
      ctx.moveTo(P(dir * 62), baseY - 36 + wag * 0.7);
      ctx.quadraticCurveTo(P(dir * 76), baseY - 44 + wag * 0.85, tipX, tipY);
      ctx.quadraticCurveTo(P(dir * 60), baseY - 56 + wag * 0.85, P(dir * 52), baseY - 44 + wag * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (cfg.tailStyle === 'cat_sleek') {
      const dir = isSide ? -1 : 1;
      ctx.save();
      ctx.strokeStyle = primaryFur;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(P(dir * 18), baseY - 6);
      ctx.bezierCurveTo(
        P(dir * 54),
        baseY - 10,
        P(dir * 48),
        baseY - 56 + wag,
        P(dir * 68),
        baseY - 64 + wag
      );
      ctx.stroke();
      ctx.restore();
    } else if (cfg.tailStyle === 'bunny_puff') {
      const puffX = isSide ? P(-26) : isBack ? 0 : P(26);
      ctx.save();
      ctx.fillStyle = secondaryFur;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.arc(puffX, baseY - 8 + wag * 0.3, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  // Modern jacket lapel details when wearing jaket_terbuka or blazer
  if (drawBody && !isBack && (cfg.topStyle === 'jaket_terbuka' || cfg.topStyle === 'blazer')) {
    const lapelCol = cfg.topColor || '#0f172a';
    strokeAndFillPoly(
      ctx,
      [
        [P(-18), torsoTop + 2],
        [P(-8), torsoTop + 2],
        [P(-10), torsoTop + 42],
        [P(-22), torsoTop + 26],
      ],
      lapelCol,
      stroke,
      1.6
    );
    strokeAndFillPoly(
      ctx,
      [
        [P(18), torsoTop + 2],
        [P(8), torsoTop + 2],
        [P(10), torsoTop + 42],
        [P(22), torsoTop + 26],
      ],
      lapelCol,
      stroke,
      1.6
    );
  }

  // 1. Extended One-Set Details (school uniform pocket, factory stripes, batik motif, doctor badge, bola stripe)
  if (drawBody && !isBack && cfg.oneSetId && cfg.oneSetId !== 'none') {
    if (cfg.oneSetId === 'seragam_sd' || cfg.oneSetId === 'seragam_smp' || cfg.oneSetId === 'seragam_sma') {
      const tieCol =
        cfg.oneSetId === 'seragam_sd'
          ? '#b91c1c'
          : cfg.oneSetId === 'seragam_smp'
          ? '#1e3a8a'
          : '#64748b';
      strokeAndFillPoly(
        ctx,
        [[P(-5), torsoTop + 6], [P(5), torsoTop + 6], [P(8), torsoTop + 56], [P(0), torsoTop + 68], [P(-8), torsoTop + 56]],
        tieCol,
        stroke,
        1.8
      );
      strokeAndFillPoly(
        ctx,
        [[P(14), torsoTop + 26], [P(28), torsoTop + 26], [P(28), torsoTop + 44], [P(14), torsoTop + 44]],
        tieCol,
        stroke,
        1.5
      );
    } else if (cfg.oneSetId === 'seragam_pabrik') {
      const stripeCol = cfg.oneSetColors?.secondary || '#facc15';
      ctx.save();
      ctx.fillStyle = stripeCol;
      ctx.fillRect(P(-34), torsoTop + torsoHeight * 0.48, Math.abs(P(34) - P(-34)), 10);
      ctx.restore();
    } else if (cfg.oneSetId === 'batik') {
      ctx.save();
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.55)';
      ctx.lineWidth = 2;
      for (let row = 0; row < 3; row++) {
        for (let col = -1; col <= 1; col++) {
          const cx = P(col * 18);
          const cy = torsoTop + 26 + row * 28;
          ctx.beginPath();
          ctx.moveTo(cx, cy - 8);
          ctx.lineTo(cx + 8, cy);
          ctx.lineTo(cx, cy + 8);
          ctx.lineTo(cx - 8, cy);
          ctx.closePath();
          ctx.stroke();
        }
      }
      ctx.restore();
    } else if (cfg.oneSetId === 'pemain_bola') {
      const stripe = cfg.oneSetColors?.secondary || '#f8fafc';
      ctx.save();
      ctx.fillStyle = stripe;
      ctx.fillRect(P(-6), torsoTop + 12, Math.abs(P(6) - P(-6)), torsoHeight - 24);
      ctx.restore();
    } else if (cfg.oneSetId === 'toga_hakim' || cfg.oneSetId === 'wisuda') {
      const befCol = cfg.oneSetColors?.secondary || '#f8fafc';
      strokeAndFillPoly(
        ctx,
        [[P(-10), torsoTop + 4], [P(10), torsoTop + 4], [P(14), torsoTop + 48], [P(0), torsoTop + 56], [P(-14), torsoTop + 48]],
        befCol,
        stroke,
        1.8
      );
    }
  }

  // 2. Neckwear accessories
  if (drawBody && !isBack) {
    if (accSet.has('dasi_kupu')) {
      const col = accColor('dasi_kupu', '#7c3aed');
      strokeAndFillPoly(
        ctx,
        [[P(-15), torsoTop - 4], [P(0), torsoTop + 4], [P(15), torsoTop - 4], [P(15), torsoTop + 12], [P(0), torsoTop + 4], [P(-15), torsoTop + 12]],
        col,
        stroke,
        1.8
      );
    }
    if (accSet.has('syal')) {
      const col = accColor('syal', '#ef4444');
      strokeAndFillPoly(
        ctx,
        [[P(-26), torsoTop - 6], [P(26), torsoTop - 6], [P(24), torsoTop + 12], [P(-24), torsoTop + 12]],
        col,
        stroke,
        lw
      );
      strokeAndFillPoly(
        ctx,
        [[P(6), torsoTop + 8], [P(20), torsoTop + 8], [P(22), torsoTop + 48], [P(8), torsoTop + 44]],
        col,
        stroke,
        lw
      );
    }
    if (accSet.has('stetoskop') || cfg.oneSetId === 'jas_dokter') {
      const col = accColor('stetoskop', '#334155');
      ctx.save();
      ctx.strokeStyle = col;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(P(-16), torsoTop + 2);
      ctx.quadraticCurveTo(P(-20), torsoTop + 42, P(0), torsoTop + 44);
      ctx.quadraticCurveTo(P(20), torsoTop + 42, P(16), torsoTop + 2);
      ctx.stroke();
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(P(0), torsoTop + 46, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  // 3. Bags (Ransel on back/side, Tas kerja briefcase, Tas selempang)
  if (drawBody && accSet.has('ransel')) {
    const col = accColor('ransel', '#8a5a3c');
    if (isBack) {
      strokeAndFillPoly(
        ctx,
        [[-32, torsoTop + 12], [32, torsoTop + 12], [35, torsoTop + 86], [-35, torsoTop + 86]],
        col,
        stroke,
        lw
      );
      strokeAndFillPoly(
        ctx,
        [[-26, torsoTop + 16], [26, torsoTop + 16], [26, torsoTop + 46], [-26, torsoTop + 46]],
        col,
        stroke,
        1.8
      );
    } else if (isSide) {
      strokeAndFillPoly(
        ctx,
        [[P(-34), torsoTop + 14], [P(-12), torsoTop + 14], [P(-12), torsoTop + 82], [P(-36), torsoTop + 82]],
        col,
        stroke,
        lw
      );
    } else {
      // Shoulder straps visible in front
      ctx.save();
      ctx.strokeStyle = col;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(P(-24), torsoTop + 4);
      ctx.lineTo(P(-28), torsoTop + 62);
      ctx.moveTo(P(24), torsoTop + 4);
      ctx.lineTo(P(28), torsoTop + 62);
      ctx.stroke();
      ctx.restore();
    }
  }

  if (drawBody && accSet.has('tas_selempang')) {
    const col = accColor('tas_selempang', '#334155');
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(P(-26), torsoTop + 6);
    ctx.lineTo(P(24), torsoTop + 82);
    ctx.stroke();
    ctx.restore();
    strokeAndFillPoly(
      ctx,
      [[P(14), torsoTop + 72], [P(42), torsoTop + 72], [P(44), torsoTop + 102], [P(12), torsoTop + 102]],
      col,
      stroke,
      lw
    );
  }

  if (drawProps && accSet.has('tas_kerja')) {
    const col = accColor('tas_kerja', '#78350f');
    const handR = hands?.[1]?.at || [P(44), torsoTop + 92];
    strokeAndFillPoly(
      ctx,
      [
        [handR[0] - 24, handR[1] + 6],
        [handR[0] + 24, handR[1] + 6],
        [handR[0] + 26, handR[1] + 40],
        [handR[0] - 26, handR[1] + 40],
      ],
      col,
      stroke,
      lw
    );
    ctx.save();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.strokeRect(handR[0] - 5, handR[1] + 18, 10, 6);
    ctx.restore();
  }

  // 4. Walking Cane ("Tongkat berdiri")
  if (drawProps && accSet.has('tongkat')) {
    const col = accColor('tongkat', '#8a5a3c');
    const handR = hands?.[1]?.at || [P(44), torsoTop + 90];
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(handR[0] - 10, handR[1] - 4);
    ctx.quadraticCurveTo(handR[0], handR[1] - 16, handR[0] + 10, handR[1] - 4);
    ctx.lineTo(handR[0] + 10, 0);
    ctx.stroke();
    ctx.restore();
  }
}

let hooksInstalled = false;

function resolve3DRigHairStyle(look: any): 'spiky' | 'short' | 'long' | 'bun' | 'bald' | 'hijab' | 'khimar' {
  if (look?.khimar) return 'khimar';
  if (look?.hijab) return 'hijab';
  const customHs = look?.__customChar?.hairStyle;
  const raw = String(customHs || look?.hair || '').toLowerCase();
  if (raw === 'botak' || raw === 'bald' || look?.__customChar?.species === 'robot') return 'bald';
  if (raw === 'hijab_simpel' || raw === 'hijab') return 'hijab';
  if (raw === 'khimar') return 'khimar';
  if (raw === 'long' || raw === 'gondrong' || raw === 'bob_pendek') return 'long';
  if (raw === 'bun' || raw === 'cepol' || raw === 'kuncir') return 'bun';
  if (raw === 'spiky' || raw === 'quiff' || raw === 'jambul' || raw === 'mohawk' || raw === 'pompadour') return 'spiky';
  return 'short';
}

function resolve3DRigGlasses(look: any): { style: 'none' | 'round' | 'square' | 'sunglasses'; color?: string } {
  const isCyberFox = Boolean(
    look?.__isCyberFox || (look?.species === 'fox' && String(look?.skin || '').toLowerCase() === '#fde6d8')
  );
  if (isCyberFox) {
    return { style: 'none' };
  }
  const customAcc: string[] = Array.isArray(look?.__customChar?.accessories)
    ? look.__customChar.accessories
    : [];
  if (customAcc.includes('kacamata_hitam')) {
    return { style: 'sunglasses', color: look.__customChar?.accessoryColors?.kacamata_hitam || '#0f172a' };
  }
  if (customAcc.includes('kacamata_bulat')) {
    return { style: 'round', color: look.__customChar?.accessoryColors?.kacamata_bulat || '#1e293b' };
  }
  if (customAcc.includes('kacamata_kotak')) {
    return { style: 'square', color: look.__customChar?.accessoryColors?.kacamata_kotak || '#0f172a' };
  }
  if (look?.glasses && look.glasses !== 'none' && look.glasses !== 'false') {
    return { style: 'square', color: typeof look.glasses === 'string' ? look.glasses : '#0f172a' };
  }
  return { style: 'none' };
}

export function render3DCreatorViaHook(
  e: any,
  x: number,
  y: number,
  look: any
): boolean {
  const ctx: CanvasRenderingContext2D | undefined = e?.ctx;
  if (!ctx || !look?.__is3DStudioCreator) return false;
  const drawAlpha = look.draw ?? 1;
  if (drawAlpha <= 0) return true;

  const t = Number(e?.t || 0);
  const size = Number(look.size || 240);
  const facing: 1 | -1 = look.facing === -1 ? -1 : 1;
  const rawView = look.viewMode;
  const viewMode: 'full' | 'bust' | 'closeup' | 'orb' =
    rawView === 'orb' || look.__is3DOrbOnly
      ? 'orb'
      : rawView === 'closeup'
      ? 'closeup'
      : rawView === 'bust'
      ? 'bust'
      : 'full';

  const customAcc: string[] = Array.isArray(look?.__customChar?.accessories)
    ? look.__customChar.accessories
    : [];
  const previewStatic = Math.abs(t - 0.35) < 0.001 && Number(e?.dur || 3) === 3;
  const species = look.species || look.__customChar?.species || 'human';
  const isCyberFox = Boolean(
    look?.__isCyberFox || (species === 'fox' && String(look?.skin || '').toLowerCase() === '#fde6d8')
  );
  const hasHeadphones = !isCyberFox && Boolean(look.__has3DHeadphone || customAcc.includes('headphone'));
  const glasses = resolve3DRigGlasses(look);

  let rendered = false;
  ctx.save();
  if (drawAlpha < 1) {
    ctx.globalAlpha *= Math.max(0, Math.min(1, drawAlpha));
  }
  rendered = renderCreator3DToCanvas2D(ctx, x, y, size, {
    hasHeadphones,
    facing,
    pose: look.pose || 'stand',
    t,
    species,
    hairStyle: resolve3DRigHairStyle(look),
    hairColor: look.hairColor,
    hoodieColor: look.jacketOpen ? look.shirt : look.jacket || look.shirt,
    jacketColor: look.jacket,
    jacketOpen: Boolean(look.jacketOpen),
    pantsColor: look.pants || (typeof look.dress === 'string' ? look.dress : undefined),
    shoeColor: look.shoes,
    skinColor: look.skin || look.__customChar?.furPrimaryColor,
    furSecondaryColor: look.furSecondaryColor || look.__customChar?.furSecondaryColor,
    accentColor: look.accentColor || look.shoes || '#ff4520',
    hijabColor: typeof look.hijab === 'string' ? look.hijab : undefined,
    niqab: Boolean(look.niqab),
    peciColor: typeof look.peci === 'string' ? look.peci : undefined,
    tieColor: typeof look.tie === 'string' ? look.tie : undefined,
    glassesStyle: glasses.style,
    glassesColor: glasses.color,
    eyeModeOverride: look.eyeMode,
    viewMode,
    previewStatic,
    captionWords: e?.caption?.words,
    pace: e?.pace,
    isCyberFox,
  });
  ctx.restore();
  return rendered;
}

export function render3DMascotViaHook(
  ctx: CanvasRenderingContext2D | undefined,
  cx: number,
  cy: number,
  sizePx: number,
  t: number,
  bodyHex?: string
): boolean {
  if (!ctx) return false;
  return renderMascotOrb3DToCanvas2D(ctx, cx, cy, sizePx, t, bodyHex);
}

/**
 * Crisp 2D Flat-Vector Winged Mascot Orb renderer when user chooses `2D Vektor` dimension
 * with `'orb'` framing (`maskot_orb_3d` or Orb framing mode).
 */
export function render2DMascotOrbViaHook(
  e: any,
  x: number,
  y: number,
  look: any
): boolean {
  const ctx: CanvasRenderingContext2D | undefined = e?.ctx;
  if (!ctx || look?.__characterDimension !== '2d') return false;
  const drawAlpha = look?.draw ?? 1;
  if (drawAlpha <= 0) return true;

  const t = Number(e?.t || 0);
  const size = Number(look?.size || 200);
  const r = size * 0.25;
  const bob = Math.sin(t * 3.1) * (size * 0.035);
  const wingFlap = Math.sin(t * 9.5) * 0.24;
  const cy = y - size * 0.5 + bob;
  const bodyHex = look?.accentColor || look?.shirt || '#ff4520';

  ctx.save();
  ctx.globalAlpha *= Math.max(0, Math.min(1, drawAlpha));
  ctx.translate(x, cy);

  // Drop shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
  ctx.beginPath();
  ctx.ellipse(0, size * 0.34 - bob, r * 1.15, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  // Crisp flat vector wings
  for (const dir of [-1, 1] as const) {
    ctx.save();
    ctx.translate(dir * r * 0.92, -r * 0.14);
    ctx.rotate(dir * (0.24 - wingFlap));
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = Math.max(1.8, r * 0.08);
    ctx.beginPath();
    ctx.ellipse(dir * r * 0.45, 0, r * 0.58, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Body sphere with bold editorial shading
  const orbG = ctx.createRadialGradient(-r * 0.32, -r * 0.35, r * 0.15, 0, 0, r * 1.1);
  orbG.addColorStop(0, '#ff8566');
  orbG.addColorStop(0.55, bodyHex);
  orbG.addColorStop(1, '#991b1b');
  ctx.fillStyle = orbG;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = Math.max(2, r * 0.09);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Dark visor + animated cyan LED eyes
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(-r * 0.62, -r * 0.28, r * 1.24, r * 0.5, r * 0.25);
  ctx.fill();

  const isBlink = ((t + 0.5) * 0.32) % 1 > 0.94;
  ctx.fillStyle = '#38bdf8';
  for (const sx of [-r * 0.26, r * 0.26]) {
    ctx.beginPath();
    ctx.ellipse(sx, -r * 0.03, r * 0.13, isBlink ? r * 0.03 : r * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  return true;
}

export function installCustomCharacterHooks() {
  if (hooksInstalled) return;
  hooksInstalled = true;
  (globalThis as any).__SATSET_CUSTOM_CHAR_HEAD_HOOK = renderCustomCharacterHeadExtras;
  (globalThis as any).__SATSET_CUSTOM_CHAR_TORSO_HOOK = renderCustomCharacterTorsoExtras;
  (globalThis as any).__SATSET_3D_CREATOR_HOOK = render3DCreatorViaHook;
  (globalThis as any).__SATSET_3D_MASCOT_HOOK = render3DMascotViaHook;
  (globalThis as any).__SATSET_2D_ORB_HOOK = render2DMascotOrbViaHook;
}

installCustomCharacterHooks();

export function resolveCharacterLookForView(
  cfg: CustomCharacterConfig,
  viewMode: BuilderViewMode = 'depan'
) {
  installCustomCharacterHooks();
  return customCharacterToEngineLook(cfg, viewMode);
}

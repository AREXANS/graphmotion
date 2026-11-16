import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SATSET_MODULES } from '../data/satset-modules';
import {
  SATSET_STYLE_ID_ALIASES,
  getAllSatsetStyles,
  compileSatsetSceneCode,
  renderSatsetSceneFrame,
  getSatsetStyleDemoScenes,
  getSatsetStyleExamples,
} from './custom-style-runtime';
import { isSatsetCodeDegrees as checkCodeDegrees, resolveSatsetFonts } from './satset-cloud-engine';

const TARGET_STYLES = [
  'stopmotion_clay',
  'hyper_zoom',
  'bounce_cartoon',
  'bubble_gum',
  'confetti_blast',
] as const;

function createSpyCanvasContext() {
  let drawCalls = 0;
  let textCalls = 0;
  const nanArgs: string[] = [];

  const drawMethods = new Set([
    'fill',
    'stroke',
    'fillRect',
    'strokeRect',
    'fillText',
    'strokeText',
    'drawImage',
    'arc',
    'ellipse',
    'roundRect',
    'rect',
    'lineTo',
    'moveTo',
  ]);

  const canvas: any = { width: 720, height: 1280 };
  const noopGrad = { addColorStop: () => {} };

  const proxy: any = new Proxy(
    {
      canvas,
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      font: '700 24px sans-serif',
      textAlign: 'left',
      textBaseline: 'alphabetic',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      shadowColor: 'transparent',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      letterSpacing: '0px',
    },
    {
      get(target: Record<string | symbol, any>, prop) {
        if (prop in target) return target[prop];
        if (prop === 'measureText') {
          return (str: string) => ({
            width: Math.max(8, String(str ?? '').length * 14),
            actualBoundingBoxAscent: 18,
            actualBoundingBoxDescent: 4,
          });
        }
        if (
          prop === 'createLinearGradient' ||
          prop === 'createRadialGradient' ||
          prop === 'createPattern'
        ) {
          return (...args: any[]) => {
            for (const a of args) {
              if (typeof a === 'number' && !Number.isFinite(a)) {
                nanArgs.push(`${String(prop)}(${args.join(',')})`);
              }
            }
            return noopGrad;
          };
        }
        if (prop === 'getTransform') {
          return () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
        }
        if (prop === 'getImageData') {
          return (_x: number, _y: number, w: number, h: number) => ({
            data: new Uint8ClampedArray(Math.max(4, (w || 1) * (h || 1) * 4)),
          });
        }
        return (...args: any[]) => {
          const p = String(prop);
          if (drawMethods.has(p)) {
            drawCalls++;
            if (p === 'fillText' || p === 'strokeText') textCalls++;
          }
          for (const a of args) {
            if (typeof a === 'number' && !Number.isFinite(a)) {
              nanArgs.push(`${p}(${args.join(',')})`);
            }
          }
        };
      },
      set(target: Record<string | symbol, any>, prop, value) {
        target[prop] = value;
        return true;
      },
    }
  );

  return {
    ctx: proxy,
    getStats: () => ({ drawCalls, textCalls, nanArgs }),
  };
}

describe('Repaired Remotion Video Styles & Everyday UI Removal', () => {
  it('completely removes everyday_ui from modules, aliases, builtin styles, and examples', () => {
    const hasEverydayModule = SATSET_MODULES.some((m) => (m.id as string) === 'everyday_ui');
    assert.equal(hasEverydayModule, false, 'everyday_ui should be removed from SATSET_MODULES');
    assert.equal(
      Object.prototype.hasOwnProperty.call(SATSET_STYLE_ID_ALIASES, 'everyday_ui'),
      false,
      'everyday_ui should be removed from SATSET_STYLE_ID_ALIASES'
    );
    const allStyles = getAllSatsetStyles();
    const hasEverydayBuiltin = allStyles.some((s: any) => s.id === 'everyday_ui');
    assert.equal(hasEverydayBuiltin, false, 'everyday_ui should be removed from registered styles');

    for (const styleId of TARGET_STYLES) {
      assert.ok(
        SATSET_MODULES.some((m) => m.id === styleId),
        `SATSET_MODULES must include ${styleId}`
      );
      assert.ok(
        allStyles.some((s: any) => s.id === styleId),
        `getAllSatsetStyles() must include ${styleId}`
      );
      const examples = getSatsetStyleExamples(styleId) ?? [];
      assert.ok(examples.length > 0, `Expected non-empty SATSET_STYLE_EXAMPLES for ${styleId}`);
    }
  });

  it('compiles and renders all 4 scenes of each repaired style cleanly without NaN or errors', () => {
    for (const styleId of TARGET_STYLES) {
      const scenes = getSatsetStyleDemoScenes(styleId);
      assert.equal(scenes.length, 4, `Expected 4 scenes for ${styleId}`);

      const meta: any = {
        art: styleId,
        look: 'scribble3d',
        pace: 'energik',
        caption: 'pop',
        aspect: '9:16',
        brand: { colors: ['#2563EB', '#38BDF8', '#FACC15'] },
      };

      scenes.forEach((scene, sceneIndex) => {
        const compiled = compileSatsetSceneCode(scene.code);
        assert.equal(
          compiled instanceof Error,
          false,
          `${styleId} scene ${sceneIndex + 1} failed to compile: ${
            compiled instanceof Error ? compiled.message : ''
          }`
        );

        for (const t of [0.1, 1.2, 2.5]) {
          const spy = createSpyCanvasContext();
          renderSatsetSceneFrame(spy.ctx, scene, t, meta);
          const stats = spy.getStats();
          assert.equal(
            stats.nanArgs.length,
            0,
            `${styleId} scene ${sceneIndex + 1} at t=${t} produced NaN args: ${stats.nanArgs[0]}`
          );
          if (t >= 1.2) {
            assert.ok(
              stats.drawCalls >= 20,
              `${styleId} scene ${sceneIndex + 1} at t=${t} drew only ${stats.drawCalls} calls (looks empty/incomplete)`
            );
          }
        }
      });
    }
  });

  it('does not treat Math.sin / Math.cos radian rotation expressions as degrees', () => {
    assert.equal(checkCodeDegrees('s.group(0, 0, { rotate: Math.sin(s.t * 4) * 0.2 }, () => {})'), false);
    assert.equal(checkCodeDegrees('s.group(0, 0, { rotate: 45 }, () => {})'), true);
  });
});

describe('3D Studio Room & Editorial Motion Grid Styles (Kreatorlab / Video 1 & 2)', () => {
  const CREATOR_STYLES = ['studio_3d_room', 'editorial_motion_grid'] as const;

  it('registers studio_3d_room and editorial_motion_grid as distinct first-class styles without fallback aliases', () => {
    const allStyles = getAllSatsetStyles();
    for (const styleId of CREATOR_STYLES) {
      assert.equal(
        Object.prototype.hasOwnProperty.call(SATSET_STYLE_ID_ALIASES, styleId),
        false,
        `${styleId} must NOT be aliased away in SATSET_STYLE_ID_ALIASES`
      );
      assert.ok(
        SATSET_MODULES.some((m) => m.id === styleId),
        `SATSET_MODULES must include ${styleId}`
      );
      assert.ok(
        allStyles.some((s: any) => s.id === styleId),
        `getAllSatsetStyles() must include ${styleId}`
      );
      const examples = getSatsetStyleExamples(styleId) ?? [];
      assert.ok(examples.length >= 2, `Expected examples for ${styleId}`);
    }

    for (const styleDef of allStyles) {
      const fonts = resolveSatsetFonts({ art: (styleDef as any).id });
      assert.ok(fonts.pop?.id, `Style ${(styleDef as any).id} missing valid pop font`);
      assert.ok(fonts.hand?.id, `Style ${(styleDef as any).id} missing valid hand font`);
    }
  });

  it('compiles and renders all 4 bespoke scenes of studio_3d_room and editorial_motion_grid without NaN', () => {
    for (const styleId of CREATOR_STYLES) {
      const scenes = getSatsetStyleDemoScenes(styleId);
      assert.equal(scenes.length, 4, `Expected 4 bespoke scenes for ${styleId}`);

      const meta: any = {
        art: styleId,
        look: 'studio_3d',
        pace: 'energik',
        caption: styleId === 'studio_3d_room' ? 'gelap' : 'redup',
        aspect: '9:16',
        brand: { colors: ['#ff471a', '#ef4444', '#ffffff'] },
      };

      scenes.forEach((scene, sceneIndex) => {
        const compiled = compileSatsetSceneCode(scene.code);
        assert.equal(
          compiled instanceof Error,
          false,
          `${styleId} scene ${sceneIndex + 1} failed to compile: ${
            compiled instanceof Error ? compiled.message : ''
          }`
        );

        for (const t of [0.15, 1.35, 2.5]) {
          const spy = createSpyCanvasContext();
          renderSatsetSceneFrame(spy.ctx, scene, t, meta);
          const stats = spy.getStats();
          assert.equal(
            stats.nanArgs.length,
            0,
            `${styleId} scene ${sceneIndex + 1} at t=${t} produced NaN args: ${stats.nanArgs[0]}`
          );
          if (t >= 1.2) {
            assert.ok(
              stats.drawCalls >= 20,
              `${styleId} scene ${sceneIndex + 1} at t=${t} drew only ${stats.drawCalls} calls`
            );
          }
        }
      });
    }
  });

  it('exposes MotionMaxxing curves (snapSettle, popOver, accelExit, anticipation, s.snap, s.cruise) and asymmetric camera transforms', async () => {
    const { createSatsetSContext, computeSatsetCameraTransform } = await import('./custom-style-runtime');
    const spy = createSpyCanvasContext();
    const s: any = createSatsetSContext(spy.ctx, 0.5, 4.0, 'paper', '2d', undefined);

    assert.equal(s.ease.snapSettle(0), 0);
    assert.equal(s.ease.snapSettle(1), 1);
    assert.ok(s.ease.snapSettle(0.22) >= 0.55, 'snapSettle should front-load velocity quickly by t=0.22');
    assert.ok(s.ease.popOver(0.45) > 1.0, 'popOver should deliver controlled elastic overshoot > 1.0');
    assert.ok(s.ease.anticipation(0.08) < 0, 'anticipation should briefly recoil negative before launch');
    assert.equal(typeof s.snap, 'function');
    assert.equal(typeof s.cruise, 'function');
    assert.ok(Number.isFinite(s.cruise(1.2, 10, 0)));

    const camPush = computeSatsetCameraTransform(
      { camera: 'push', duration: 3.0, text: 'motion push' } as any,
      0.35,
      { pace: 'energik', art: 'scribble3d', look: 'scribble3d' } as any
    );
    assert.ok(Number.isFinite(camPush.zoom) && camPush.zoom > 1.0);
    assert.ok(Number.isFinite(camPush.x) && Number.isFinite(camPush.y));
  });
});


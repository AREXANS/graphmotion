import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  evaluateCreator3DKinematics,
  evaluateMascotOrbKinematics,
  type PoseInput,
  type EvaluatedCreator3DKinematics,
  type ArmJointAngles,
  type LipSyncWordTiming,
} from './creator-3d-kinematics.ts';

export type RigSpecies =
  | 'human'
  | 'fox'
  | 'cat'
  | 'wolf'
  | 'bunny'
  | 'panda'
  | 'bear'
  | 'owl'
  | 'robot'
  | 'alien'
  | 'elf';

export type RigHairStyle =
  | 'spiky'
  | 'short'
  | 'long'
  | 'bun'
  | 'bald'
  | 'hijab'
  | 'khimar';

export interface Creator3DRenderOptions {
  hasHeadphones?: boolean;
  facing?: 1 | -1;
  pose?: PoseInput;
  t?: number;
  species?: RigSpecies;
  hairStyle?: RigHairStyle;
  hairColor?: string;
  hoodieColor?: string;
  jacketColor?: string;
  jacketOpen?: boolean;
  pantsColor?: string;
  shoeColor?: string;
  skinColor?: string;
  furSecondaryColor?: string;
  accentColor?: string;
  hijabColor?: string;
  niqab?: boolean;
  peciColor?: string;
  tieColor?: string;
  glassesStyle?: 'none' | 'round' | 'square' | 'sunglasses';
  glassesColor?: string;
  eyeModeOverride?: 'normal' | 'happy_arc' | 'focus';
  viewMode?: 'full' | 'bust' | 'closeup' | 'orb';
  speaking?: boolean;
  previewStatic?: boolean;
  captionWords?: LipSyncWordTiming[];
  pace?: string;
  isCyberFox?: boolean;
}

interface ArmRigNodes {
  shoulder: THREE.Group;
  elbow: THREE.Group;
  wrist: THREE.Group;
  handOpen: THREE.Group;
  handPoint: THREE.Group;
  handFist: THREE.Group;
  handThumbs: THREE.Group;
}

interface LegRigNodes {
  hip: THREE.Group;
  knee: THREE.Group;
}

interface EyeNodes {
  openGroup: THREE.Group;
  iris: THREE.Mesh;
  upperLid: THREE.Mesh;
  happyArc: THREE.Mesh;
}

interface SharedCreator3DStudio {
  renderer: THREE.WebGLRenderer;
  canvas: HTMLCanvasElement;
  isSoftwareGl: boolean;
  pmremTarget: THREE.WebGLRenderTarget;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  rootGroup: THREE.Group;
  pelvisGroup: THREE.Group;
  torsoGroup: THREE.Group;
  neckGroup: THREE.Group;
  headGroup: THREE.Group;
  hairGroup: THREE.Group;
  hairStyleGroups: {
    spiky: THREE.Group;
    short: THREE.Group;
    long: THREE.Group;
    bun: THREE.Group;
    hijab: THREE.Group;
    khimar: THREE.Group;
  };
  niqabVeil: THREE.Mesh;
  peciGroup: THREE.Group;
  headphoneGroup: THREE.Group;
  glassesRoundGroup: THREE.Group;
  glassesSquareGroup: THREE.Group;
  humanEarsGroup: THREE.Group;
  foxEarsGroup: THREE.Group;
  bunnyEarsGroup: THREE.Group;
  bearEarsGroup: THREE.Group;
  elfEarsGroup: THREE.Group;
  pandaPatchesGroup: THREE.Group;
  snoutGroup: THREE.Group;
  beakGroup: THREE.Group;
  robotHeadExtras: THREE.Group;
  robotChestCore: THREE.Mesh;
  blazerLapelsGroup: THREE.Group;
  tieGroup: THREE.Group;
  hoodieCollarGroup: THREE.Group;
  tailGroup: THREE.Group;
  foxTailGroup: THREE.Group;
  catTailGroup: THREE.Group;
  bunnyTailGroup: THREE.Group;
  leftBrow: THREE.Mesh;
  rightBrow: THREE.Mesh;
  leftEye: EyeNodes;
  rightEye: EyeNodes;
  mouthSmile: THREE.Mesh;
  mouthOpenGroup: THREE.Group;
  leftArm: ArmRigNodes;
  rightArm: ArmRigNodes;
  leftLeg: LegRigNodes;
  rightLeg: LegRigNodes;
  emblemGroup: THREE.Group;
  cyberFoxHeadGroup: THREE.Group;
  cyberFoxTorsoGroup: THREE.Group;
  cyberFoxHipGroup: THREE.Group;
  cyberFoxTailMesh: THREE.Mesh;
  materials: {
    hair: THREE.MeshStandardMaterial;
    hairHighlight: THREE.MeshStandardMaterial;
    skin: THREE.MeshStandardMaterial;
    furSecondary: THREE.MeshStandardMaterial;
    hoodie: THREE.MeshStandardMaterial;
    hoodieInside: THREE.MeshStandardMaterial;
    jacket: THREE.MeshStandardMaterial;
    pants: THREE.MeshStandardMaterial;
    shoes: THREE.MeshStandardMaterial;
    accent: THREE.MeshStandardMaterial;
    hijab: THREE.MeshStandardMaterial;
    peci: THREE.MeshStandardMaterial;
    glassesFrame: THREE.MeshStandardMaterial;
    glassesLens: THREE.MeshStandardMaterial;
    tie: THREE.MeshStandardMaterial;
    iris: THREE.MeshStandardMaterial;
    orbBody: THREE.MeshStandardMaterial;
  };
  orbScene: THREE.Scene;
  orbCamera: THREE.PerspectiveCamera;
  orbRoot: THREE.Group;
  orbLeftWing: THREE.Group;
  orbRightWing: THREE.Group;
  orbVisorGlowMat: THREE.MeshBasicMaterial;
}

let sharedStudio: SharedCreator3DStudio | null = null;
let webglUnavailable = false;

function detectSoftwareWebGL(gl: WebGLRenderingContext | WebGL2RenderingContext): boolean {
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = ext
      ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '')
      : String(gl.getParameter(gl.RENDERER) || '');
    return /SwiftShader|llvmpipe|Software|WARP|Basic Render/i.test(rendererStr);
  } catch {
    return false;
  }
}

/**
 * Creates a sleek, flat-sculpted anime/studio hair ribbon lock along a Catmull-Rom spline.
 * Uses surface-outward normal framing (preventing Frenet twist flips) and an elliptical flat-ribbon
 * cross-section with a subtle central strand ridge so hair looks layered and groomed, never sausage-like.
 */
function createSculptedRibbonLockGeometry(
  baseRadius: number,
  points: [number, number, number][],
  radialSegs = 12,
  lengthSegs = 14
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])));

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const headCenter = new THREE.Vector3(0, 0.06, -0.04);

  for (let i = 0; i <= lengthSegs; i++) {
    const u = i / lengthSegs;
    const pt = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u).normalize();

    const outward = pt.clone().sub(headCenter);
    if (outward.lengthSq() < 1e-4) outward.set(0, 1, 0.4);
    outward.normalize();

    const side = new THREE.Vector3().crossVectors(tangent, outward);
    if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
    side.normalize();
    const normalOut = new THREE.Vector3().crossVectors(side, tangent).normalize();

    const profile =
      u < 0.18
        ? 0.78 + Math.sin((u / 0.18) * (Math.PI * 0.5)) * 0.24
        : Math.pow(Math.max(0.018, 1 - (u - 0.18) / 0.82), 0.88) * 1.02;

    const ribbonWidth = baseRadius * 1.42 * profile;
    const ribbonThick = baseRadius * 0.58 * profile;

    for (let j = 0; j <= radialSegs; j++) {
      const theta = (j / radialSegs) * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);

      const ridgeBoost = sin > 0 ? Math.pow(Math.max(0, 1 - Math.abs(cos)), 1.6) * ribbonThick * 0.28 : 0;
      const wOffset = cos * ribbonWidth;
      const tOffset = sin * ribbonThick + ridgeBoost;

      const vx = pt.x + side.x * wOffset + normalOut.x * tOffset;
      const vy = pt.y + side.y * wOffset + normalOut.y * tOffset;
      const vz = pt.z + side.z * wOffset + normalOut.z * tOffset;

      positions.push(vx, vy, vz);
      uvs.push(j / radialSegs, u);
    }
  }

  const stride = radialSegs + 1;
  for (let i = 0; i < lengthSegs; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Generates a bright, high-contrast procedural radial iris texture (neutral warm-white center
 * to dark limbal outer ring with fine iris fibers) so `irisMat.color` tints cleanly.
 */
function createProceduralIrisTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  if (!g) return null;

  const grad = g.createRadialGradient(64, 64, 6, 64, 64, 62);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.32, '#f1f5f9');
  grad.addColorStop(0.74, '#b8c4d0');
  grad.addColorStop(0.92, '#556270');
  grad.addColorStop(1, '#262d36');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);

  g.save();
  g.translate(64, 64);
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    g.strokeStyle = i % 2 === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.16)';
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(Math.cos(a) * 14, Math.sin(a) * 14);
    g.lineTo(Math.cos(a) * 56, Math.sin(a) * 56);
    g.stroke();
  }
  g.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Sculpts a sleek, well-proportioned oval-tapered 3D studio head silhouette
 * with defined cheekbones, tapered V-jawline, and sculpted chin.
 */
function createChibiHeadGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.405, 40, 32);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    const ny = y / 0.405;
    const nx = x / 0.405;
    const nz = z / 0.405;

    x *= 0.935;
    y *= 1.02;
    z *= 0.96;

    if (ny > 0.15) {
      const t = Math.min(1, (ny - 0.15) / 0.85);
      const s = t * t * (3 - 2 * t);
      x *= 1 - s * 0.032;
    }

    if (nz > 0.05) {
      const cheekY = Math.exp(-Math.pow((ny + 0.12) / 0.26, 2));
      const cheekX = Math.exp(-Math.pow((Math.abs(nx) - 0.48) / 0.36, 2));
      x *= 1 + cheekY * 0.022;
      z += cheekY * cheekX * 0.008;
    }

    if (ny < 0.08) {
      const rawT = Math.min(1, (0.08 - ny) / 1.08);
      const jawT = rawT * rawT * (3 - 2 * rawT);
      x *= 1 - jawT * 0.21;
      if (nz > 0) {
        const chinCenter = Math.max(0, 1 - Math.abs(nx) * 1.4);
        z *= 1 - jawT * 0.05;
        z += Math.sin(jawT * Math.PI) * 0.012 * chinCenter;
      } else {
        z *= 1 - jawT * 0.10;
      }
    }

    pos.setXYZ(i, x, y, z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function buildHandVariants(
  skinMat: THREE.MeshStandardMaterial,
  sideSign: 1 | -1
): {
  handOpen: THREE.Group;
  handPoint: THREE.Group;
  handFist: THREE.Group;
  handThumbs: THREE.Group;
} {
  const wristJointGeo = new THREE.SphereGeometry(0.042, 16, 14);
  const palmGeo = new THREE.SphereGeometry(0.046, 18, 16);
  palmGeo.scale(0.96, 1.06, 0.56);
  const fingerGeo = new THREE.CapsuleGeometry(0.0125, 0.032, 8, 12);
  const thumbGeo = new THREE.CapsuleGeometry(0.014, 0.028, 8, 12);

  const handOpen = new THREE.Group();
  const wristO = new THREE.Mesh(wristJointGeo, skinMat);
  wristO.position.set(0, 0.004, 0);
  const palmO = new THREE.Mesh(palmGeo, skinMat);
  palmO.position.set(0, -0.032, 0.003);
  handOpen.add(wristO, palmO);
  for (let f = 0; f < 4; f++) {
    const fm = new THREE.Mesh(fingerGeo, skinMat);
    const fx = (f - 1.5) * 0.0185 * sideSign;
    const archLen = f === 1 || f === 2 ? -0.005 : f === 3 ? 0.003 : 0;
    fm.position.set(fx, -0.070 + archLen, 0.007 + (1.5 - Math.abs(f - 1.5)) * 0.0025);
    fm.rotation.z = (f - 1.5) * 0.04 * sideSign;
    fm.rotation.x = 0.12 + f * 0.02;
    handOpen.add(fm);
  }
  const thumbO = new THREE.Mesh(thumbGeo, skinMat);
  thumbO.position.set(-0.040 * sideSign, -0.030, 0.016);
  thumbO.rotation.z = -0.45 * sideSign;
  thumbO.rotation.x = 0.16;
  handOpen.add(thumbO);

  const handPoint = new THREE.Group();
  const wristP = new THREE.Mesh(wristJointGeo, skinMat);
  wristP.position.set(0, 0.004, 0);
  const palmP = new THREE.Mesh(palmGeo, skinMat);
  palmP.position.set(0, -0.032, 0.003);
  handPoint.add(wristP, palmP);
  const indexP = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.048, 8, 12), skinMat);
  indexP.position.set(-0.017 * sideSign, -0.078, 0.009);
  indexP.rotation.x = 0.06;
  handPoint.add(indexP);
  for (let f = 1; f < 4; f++) {
    const curled = new THREE.Mesh(new THREE.SphereGeometry(0.0175, 12, 10), skinMat);
    curled.position.set((f - 1.5) * 0.018 * sideSign, -0.058, 0.020);
    handPoint.add(curled);
  }
  const thumbP = new THREE.Mesh(thumbGeo, skinMat);
  thumbP.position.set(-0.036 * sideSign, -0.036, 0.020);
  thumbP.rotation.z = -0.26 * sideSign;
  handPoint.add(thumbP);

  const handFist = new THREE.Group();
  const wristF = new THREE.Mesh(wristJointGeo, skinMat);
  wristF.position.set(0, 0.004, 0);
  const palmF = new THREE.Mesh(new THREE.SphereGeometry(0.054, 18, 14), skinMat);
  palmF.scale.set(1.0, 0.94, 0.82);
  palmF.position.set(0, -0.036, 0.004);
  handFist.add(wristF, palmF);

  const handThumbs = new THREE.Group();
  const wristT = new THREE.Mesh(wristJointGeo, skinMat);
  wristT.position.set(0, 0.004, 0);
  const palmT = new THREE.Mesh(new THREE.SphereGeometry(0.054, 18, 14), skinMat);
  palmT.scale.set(1.0, 0.94, 0.82);
  palmT.position.set(0, -0.036, 0.004);
  handThumbs.add(wristT, palmT);
  const thumbUp = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, 0.048, 8, 12), skinMat);
  thumbUp.position.set(-0.038 * sideSign, 0.002, 0.016);
  thumbUp.rotation.z = 0.18 * sideSign;
  handThumbs.add(thumbUp);

  return { handOpen, handPoint, handFist, handThumbs };
}

function buildArm(
  sideSign: 1 | -1,
  sleeveMat: THREE.MeshStandardMaterial,
  skinMat: THREE.MeshStandardMaterial
): ArmRigNodes {
  const shoulder = new THREE.Group();
  shoulder.rotation.order = 'ZXY';

  // Contoured capsule upper-arm sleeve extending from shoulder pivot (0,0,0) to elbow center (0,-0.21,0)
  const upperGeo = new THREE.CapsuleGeometry(0.072, 0.21, 12, 20);
  const upperMesh = new THREE.Mesh(upperGeo, sleeveMat);
  upperMesh.scale.set(0.98, 1.0, 0.98);
  upperMesh.position.set(0, -0.105, 0);
  shoulder.add(upperMesh);

  // Articulated Elbow Hinge Joint (Siku) at y = -0.21
  const elbow = new THREE.Group();
  elbow.rotation.order = 'XYZ';
  elbow.position.set(0, -0.21, 0);
  shoulder.add(elbow);

  // Concentric spherical elbow joint enclosing both upper-arm bottom and forearm top smoothly at any bend angle
  const elbowSphere = new THREE.Mesh(new THREE.SphereGeometry(0.068, 18, 16), sleeveMat);
  elbow.add(elbowSphere);

  // Contoured forearm sleeve starting from elbow center (y = 0) down to wrist cuff (y = -0.20)
  const foreGeo = new THREE.CapsuleGeometry(0.062, 0.19, 12, 20);
  const foreMesh = new THREE.Mesh(foreGeo, sleeveMat);
  foreMesh.scale.set(0.96, 1.0, 0.96);
  foreMesh.position.set(0, -0.098, 0);
  elbow.add(foreMesh);

  const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.051, 0.0125, 10, 20), sleeveMat);
  cuff.rotation.x = Math.PI * 0.5;
  cuff.position.set(0, -0.196, 0);
  elbow.add(cuff);

  const wrist = new THREE.Group();
  wrist.position.set(0, -0.208, 0);
  elbow.add(wrist);

  const variants = buildHandVariants(skinMat, sideSign);
  wrist.add(variants.handOpen, variants.handPoint, variants.handFist, variants.handThumbs);

  return {
    shoulder,
    elbow,
    wrist,
    ...variants,
  };
}

function buildLeg(
  pantsMat: THREE.MeshStandardMaterial,
  shoeMainMat: THREE.MeshStandardMaterial,
  shoeWhiteMat: THREE.MeshStandardMaterial,
  shoeDarkMat: THREE.MeshStandardMaterial
): LegRigNodes {
  const hip = new THREE.Group();

  const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.098, 0.145, 8, 16), pantsMat);
  thigh.position.set(0, -0.105, 0);
  hip.add(thigh);

  const knee = new THREE.Group();
  knee.position.set(0, -0.21, 0);
  hip.add(knee);

  const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.084, 0.14, 8, 16), pantsMat);
  shin.position.set(0, -0.105, 0);
  knee.add(shin);

  const footGroup = new THREE.Group();
  footGroup.position.set(0, -0.225, 0.045);
  knee.add(footGroup);

  const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.078, 0.11, 8, 16), shoeMainMat);
  upper.rotation.x = Math.PI * 0.5;
  upper.scale.set(1.06, 1.0, 0.85);
  upper.position.set(0, 0.026, 0.025);
  footGroup.add(upper);

  const ankleCollar = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.024, 10, 18), shoeMainMat);
  ankleCollar.rotation.x = Math.PI * 0.5;
  ankleCollar.position.set(0, 0.068, -0.02);
  footGroup.add(ankleCollar);

  const midsole = new THREE.Mesh(new THREE.CapsuleGeometry(0.082, 0.125, 8, 16), shoeWhiteMat);
  midsole.rotation.x = Math.PI * 0.5;
  midsole.scale.set(1.1, 1.02, 0.45);
  midsole.position.set(0, -0.012, 0.03);
  footGroup.add(midsole);

  const toeCap = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 12), shoeWhiteMat);
  toeCap.scale.set(1.06, 0.72, 0.92);
  toeCap.position.set(0, 0.008, 0.105);
  footGroup.add(toeCap);

  const outsole = new THREE.Mesh(new THREE.CapsuleGeometry(0.083, 0.128, 6, 14), shoeDarkMat);
  outsole.rotation.x = Math.PI * 0.5;
  outsole.scale.set(1.12, 1.02, 0.22);
  outsole.position.set(0, -0.032, 0.03);
  footGroup.add(outsole);

  return { hip, knee };
}

function buildEye(
  scleraMat: THREE.MeshStandardMaterial,
  irisMat: THREE.MeshStandardMaterial,
  pupilMat: THREE.MeshBasicMaterial,
  catchlightMat: THREE.MeshBasicMaterial,
  lashMat: THREE.MeshStandardMaterial,
  skinMat: THREE.MeshStandardMaterial
): EyeNodes {
  const eyeRoot = new THREE.Group();

  const openGroup = new THREE.Group();
  eyeRoot.add(openGroup);

  // Clean almond-rounded sclera seated smoothly on the facial curve
  const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.08, 24, 20), scleraMat);
  sclera.scale.set(1.12, 1.0, 0.42);
  openGroup.add(sclera);

  // Warm expressive iris seated flush on the sclera contour
  const iris = new THREE.Mesh(new THREE.SphereGeometry(0.058, 22, 18), irisMat);
  iris.scale.set(0.96, 1.02, 0.42);
  iris.position.set(0, -0.001, 0.016);
  openGroup.add(iris);

  // Pupil & catchlights are children of iris (radius 0.058 in iris-local space, already Z-scaled by iris.scale.z=0.42)
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.033, 16, 14), pupilMat);
  pupil.scale.set(0.96, 1.02, 0.65);
  pupil.position.set(0, 0, 0.044);
  iris.add(pupil);

  // Dual studio catchlights seated on the front surface of the iris/pupil
  const spec1 = new THREE.Mesh(new THREE.SphereGeometry(0.0175, 10, 10), catchlightMat);
  spec1.scale.set(1, 1, 0.65);
  spec1.position.set(-0.019, 0.02, 0.055);
  iris.add(spec1);

  const spec2 = new THREE.Mesh(new THREE.SphereGeometry(0.0085, 8, 8), catchlightMat);
  spec2.scale.set(1, 1, 0.65);
  spec2.position.set(0.018, -0.016, 0.056);
  iris.add(spec2);

  // Symmetric upper lash arch (arc = 0.82*PI, centered at 0.5*PI via rotation.z = 0.09*PI)
  const lash = new THREE.Mesh(
    new THREE.TorusGeometry(0.082, 0.0125, 10, 24, Math.PI * 0.82),
    lashMat
  );
  lash.scale.set(1.12, 0.98, 0.45);
  lash.position.set(0, 0.006, 0.028);
  lash.rotation.z = Math.PI * 0.09;
  openGroup.add(lash);

  const upperLid = new THREE.Mesh(
    new THREE.SphereGeometry(0.082, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
    skinMat
  );
  upperLid.scale.set(1.14, 1.0, 0.44);
  upperLid.position.set(0, 0.024, 0.010);
  upperLid.visible = false;
  openGroup.add(upperLid);

  // Symmetric happy eye arc (^ ^)
  const happyArc = new THREE.Mesh(
    new THREE.TorusGeometry(0.062, 0.0135, 10, 22, Math.PI * 0.80),
    lashMat
  );
  happyArc.position.set(0, -0.006, 0.032);
  happyArc.rotation.z = Math.PI * 0.10;
  happyArc.visible = false;
  eyeRoot.add(happyArc);

  return {
    openGroup,
    iris,
    upperLid,
    happyArc,
  };
}

function getOrCreateSharedStudio(): SharedCreator3DStudio | null {
  if (sharedStudio) return sharedStudio;
  if (webglUnavailable || typeof document === 'undefined') return null;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;

    const gl =
      canvas.getContext('webgl2', { alpha: true, antialias: true, preserveDrawingBuffer: true }) ||
      canvas.getContext('webgl', { alpha: true, antialias: true, preserveDrawingBuffer: true });
    if (!gl) {
      webglUnavailable = true;
      return null;
    }

    const isSoftwareGl = detectSoftwareWebGL(gl);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      context: gl,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = new RoomEnvironment();
    const pmremTarget = pmrem.fromScene(env, 0.04);
    env.dispose();
    pmrem.dispose();

    const scene = new THREE.Scene();
    scene.environment = pmremTarget.texture;
    scene.environmentIntensity = 0.42;

    const hemi = new THREE.HemisphereLight(0xfff7ed, 0x7c5a46, 0.96);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff4e6, 1.38);
    keyLight.position.set(2.4, 3.6, 3.4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffe6d4, 0.72);
    fillLight.position.set(-2.6, 1.6, 2.4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xff9466, 0.88);
    rimLight.position.set(-1.6, 2.8, -2.6);
    scene.add(rimLight);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 30);
    camera.position.set(0, 1.18, 4.4);
    camera.lookAt(0, 1.05, 0);

    const hairMat = new THREE.MeshStandardMaterial({ color: 0xe53b16, roughness: 0.5, metalness: 0.01 });
    const hairHighlightMat = new THREE.MeshStandardMaterial({ color: 0xf25222, roughness: 0.46, metalness: 0.02 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf7ceb5, roughness: 0.68, metalness: 0.0 });
    const furSecondaryMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.56, metalness: 0.02 });
    const blushMat = new THREE.MeshStandardMaterial({
      color: 0xf08c7e,
      roughness: 0.75,
      transparent: true,
      opacity: 0.34,
    });
    const hoodieMat = new THREE.MeshStandardMaterial({ color: 0x16171c, roughness: 0.68, metalness: 0.04 });
    const hoodieInsideMat = new THREE.MeshStandardMaterial({ color: 0x22252e, roughness: 0.72 });
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.54, metalness: 0.08 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x121318, roughness: 0.66, metalness: 0.04 });
    const shoesMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.34, metalness: 0.1 });
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xff471a,
      emissive: 0x431407,
      emissiveIntensity: 0.42,
      roughness: 0.25,
      metalness: 0.18,
    });
    const hijabMat = new THREE.MeshStandardMaterial({ color: 0xee93a6, roughness: 0.64, metalness: 0.02 });
    const peciMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.82, metalness: 0.02 });
    const glassesFrameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.28, metalness: 0.55 });
    const glassesLensMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.08,
      metalness: 0.2,
      transparent: true,
      opacity: 0.34,
    });
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.42, metalness: 0.06 });
    const shoeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.36 });
    const shoeDarkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.75 });
    const scleraMat = new THREE.MeshStandardMaterial({ color: 0xfdfcfb, roughness: 0.18 });
    const irisTex = createProceduralIrisTexture();
    const irisMat = new THREE.MeshStandardMaterial({
      color: 0x4e220d,
      map: irisTex || undefined,
      roughness: 0.16,
      metalness: 0.05,
    });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x110603 });
    const catchlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const lashMat = new THREE.MeshStandardMaterial({ color: 0x1a0b05, roughness: 0.4 });
    const browMat = new THREE.MeshStandardMaterial({ color: 0x451a08, roughness: 0.38 });
    const pandaDarkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const pelvisGroup = new THREE.Group();
    pelvisGroup.position.set(0, 0.49, 0);
    rootGroup.add(pelvisGroup);

    const leftLeg = buildLeg(pantsMat, shoesMat, shoeWhiteMat, shoeDarkMat);
    leftLeg.hip.position.set(-0.145, 0, 0);
    pelvisGroup.add(leftLeg.hip);

    const rightLeg = buildLeg(pantsMat, shoesMat, shoeWhiteMat, shoeDarkMat);
    rightLeg.hip.position.set(0.145, 0, 0);
    pelvisGroup.add(rightLeg.hip);

    const pelvisMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 14), pantsMat);
    pelvisMesh.scale.set(1.06, 0.68, 0.88);
    pelvisGroup.add(pelvisMesh);

    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, -0.02, -0.2);
    pelvisGroup.add(tailGroup);

    const foxTailGroup = new THREE.Group();
    const foxTailGeo = createSculptedRibbonLockGeometry(
      0.15,
      [
        [0.02, 0.0, 0],
        [0.14, 0.08, -0.16],
        [0.29, 0.22, -0.22],
        [0.39, 0.42, -0.14],
      ],
      14,
      14
    );
    const foxTailMesh = new THREE.Mesh(foxTailGeo, skinMat);
    foxTailGroup.add(foxTailMesh);
    const foxTailTip = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), furSecondaryMat);
    foxTailTip.scale.set(0.95, 1.4, 0.95);
    foxTailTip.position.set(0.39, 0.4, -0.14);
    foxTailTip.rotation.set(0.2, 0, -0.45);
    foxTailGroup.add(foxTailTip);
    foxTailGroup.visible = false;
    tailGroup.add(foxTailGroup);

    const catTailGroup = new THREE.Group();
    const catTailGeo = createSculptedRibbonLockGeometry(
      0.042,
      [
        [0, 0, 0],
        [0.04, 0.16, -0.2],
        [0.14, 0.4, -0.26],
        [0.18, 0.62, -0.14],
      ],
      10,
      14
    );
    catTailGroup.add(new THREE.Mesh(catTailGeo, skinMat));
    catTailGroup.visible = false;
    tailGroup.add(catTailGroup);

    const bunnyTailGroup = new THREE.Group();
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), furSecondaryMat);
    puff.position.set(0, 0.04, -0.05);
    bunnyTailGroup.add(puff);
    bunnyTailGroup.visible = false;
    tailGroup.add(bunnyTailGroup);

    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 0.04, 0);
    pelvisGroup.add(torsoGroup);

    const torsoMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.258, 0.31, 16, 28), hoodieMat);
    torsoMesh.scale.set(1.08, 1.0, 0.9);
    torsoMesh.position.set(0, 0.25, 0);
    torsoGroup.add(torsoMesh);

    const shoulderYoke = new THREE.Mesh(new THREE.CapsuleGeometry(0.145, 0.31, 12, 20), hoodieMat);
    shoulderYoke.rotation.z = Math.PI * 0.5;
    shoulderYoke.scale.set(0.95, 1.0, 1.12);
    shoulderYoke.position.set(0, 0.43, -0.005);
    torsoGroup.add(shoulderYoke);

    const hemRib = new THREE.Mesh(new THREE.TorusGeometry(0.242, 0.044, 12, 28), hoodieInsideMat);
    hemRib.rotation.x = Math.PI * 0.5;
    hemRib.scale.set(1.08, 0.9, 1);
    hemRib.position.set(0, 0.04, 0);
    torsoGroup.add(hemRib);

    const pocket = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.16, 10, 18), hoodieInsideMat);
    pocket.rotation.z = Math.PI * 0.5;
    pocket.scale.set(1.0, 1.0, 0.46);
    pocket.position.set(0, 0.145, 0.205);
    torsoGroup.add(pocket);

    const hoodieCollarGroup = new THREE.Group();
    const hoodCollar = new THREE.Mesh(new THREE.TorusGeometry(0.195, 0.066, 14, 28), hoodieInsideMat);
    hoodCollar.rotation.x = Math.PI * 0.48;
    hoodCollar.position.set(0, 0.51, -0.015);
    hoodieCollarGroup.add(hoodCollar);

    const backHood = new THREE.Mesh(new THREE.SphereGeometry(0.215, 18, 16), hoodieMat);
    backHood.scale.set(1.14, 0.74, 0.86);
    backHood.position.set(0, 0.5, -0.135);
    hoodieCollarGroup.add(backHood);

    for (const sx of [-0.065, 0.065]) {
      const cord = new THREE.Mesh(new THREE.CapsuleGeometry(0.0085, 0.125, 6, 10), shoeWhiteMat);
      cord.position.set(sx, 0.39, 0.215);
      cord.rotation.z = sx * 0.55;
      hoodieCollarGroup.add(cord);
    }
    torsoGroup.add(hoodieCollarGroup);

    const blazerLapelsGroup = new THREE.Group();
    for (const sx of [-1, 1]) {
      const sidePanel = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.28, 10, 16), jacketMat);
      sidePanel.scale.set(1.05, 1.0, 0.62);
      sidePanel.position.set(sx * 0.155, 0.27, 0.162);
      sidePanel.rotation.y = sx * 0.26;
      blazerLapelsGroup.add(sidePanel);

      const lapel = new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 0.18, 8, 14), jacketMat);
      lapel.scale.set(1.0, 1.0, 0.48);
      lapel.position.set(sx * 0.105, 0.385, 0.212);
      lapel.rotation.z = sx * -0.22;
      blazerLapelsGroup.add(lapel);
    }
    blazerLapelsGroup.visible = false;
    torsoGroup.add(blazerLapelsGroup);

    const tieGroup = new THREE.Group();
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), tieMat);
    knot.position.set(0, 0.45, 0.215);
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.24, 10), tieMat);
    blade.rotation.z = Math.PI;
    blade.scale.set(1, 1, 0.32);
    blade.position.set(0, 0.32, 0.22);
    tieGroup.add(knot, blade);
    tieGroup.visible = false;
    torsoGroup.add(tieGroup);

    const emblemGroup = new THREE.Group();
    emblemGroup.position.set(0.115, 0.34, 0.218);
    const emblemOrb = new THREE.Mesh(new THREE.SphereGeometry(0.044, 16, 14), accentMat);
    emblemOrb.scale.set(1, 1, 0.45);
    emblemGroup.add(emblemOrb);
    const emblemWing = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.056, 10), shoeWhiteMat);
    emblemWing.rotation.z = -Math.PI * 0.35;
    emblemWing.position.set(0.046, 0.015, 0);
    emblemGroup.add(emblemWing);
    torsoGroup.add(emblemGroup);

    const cyberNavyMat = new THREE.MeshStandardMaterial({ color: 0x0b1d51, roughness: 0.45 });
    const cyberGoldMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xca8a04,
      emissiveIntensity: 0.14,
      roughness: 0.38,
    });
    const cyberCyanMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
      roughness: 0.22,
    });
    const cyberTorsoGroup = new THREE.Group();
    const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.016, 10, 28), cyberCyanMat);
    collarRing.rotation.x = Math.PI * 0.48;
    collarRing.position.set(0, 0.54, -0.01);
    const teeFront = new THREE.Mesh(new THREE.CapsuleGeometry(0.088, 0.28, 10, 16), shoeWhiteMat);
    teeFront.scale.set(1.0, 1.0, 0.38);
    teeFront.position.set(0, 0.26, 0.198);
    cyberTorsoGroup.add(collarRing, teeFront);
    for (const sx of [-1, 1]) {
      const sideJacket = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.3, 10, 16), cyberNavyMat);
      sideJacket.scale.set(1.0, 1.0, 0.56);
      sideJacket.position.set(sx * 0.138, 0.26, 0.182);
      sideJacket.rotation.y = sx * 0.22;
      const strip = new THREE.Mesh(new THREE.CapsuleGeometry(0.015, 0.34, 8, 12), cyberCyanMat);
      strip.position.set(sx * 0.092, 0.26, 0.222);
      const shoulderStripe = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, 0.08, 8, 12), cyberCyanMat);
      shoulderStripe.rotation.x = Math.PI * 0.5;
      shoulderStripe.position.set(sx * 0.235, 0.44, 0);
      cyberTorsoGroup.add(sideJacket, strip, shoulderStripe);
    }
    for (const ang of [Math.PI / 4, -Math.PI / 4]) {
      const chestX = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.066, 6, 10), cyberCyanMat);
      chestX.position.set(0.155, 0.36, 0.236);
      chestX.rotation.z = ang;
      const backX = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.16, 6, 10), cyberCyanMat);
      backX.position.set(0, 0.27, -0.232);
      backX.rotation.z = ang;
      cyberTorsoGroup.add(chestX, backX);
    }
    cyberTorsoGroup.visible = false;
    torsoGroup.add(cyberTorsoGroup);

    const cyberHipGroup = new THREE.Group();
    const beltMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.245, 0.055, 20), shoeDarkMat);
    beltMesh.position.set(0, 0.02, 0);
    const buckleMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.06, 0.045),
      new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.72, roughness: 0.24 })
    );
    buckleMesh.position.set(0, 0.02, 0.235);
    cyberHipGroup.add(beltMesh, buckleMesh);
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.42 });
    for (const sx of [-1, 1]) {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.34, 0.03), strapMat);
      strap.position.set(sx * 0.23, -0.14, 0.07);
      strap.rotation.z = sx * -0.16;
      cyberHipGroup.add(strap);
    }
    cyberHipGroup.visible = false;
    pelvisGroup.add(cyberHipGroup);

    const robotChestCore = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.018, 10, 24), accentMat);
    robotChestCore.position.set(0, 0.33, 0.22);
    robotChestCore.visible = false;
    torsoGroup.add(robotChestCore);

    const leftArm = buildArm(-1, hoodieMat, skinMat);
    leftArm.shoulder.position.set(-0.265, 0.44, 0);
    torsoGroup.add(leftArm.shoulder);

    const rightArm = buildArm(1, hoodieMat, skinMat);
    rightArm.shoulder.position.set(0.265, 0.44, 0);
    torsoGroup.add(rightArm.shoulder);

    const neckGroup = new THREE.Group();
    neckGroup.position.set(0, 0.53, 0);
    torsoGroup.add(neckGroup);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.115, 0.15, 20), skinMat);
    neck.position.set(0, 0.035, 0);
    const neckBaseFlare = new THREE.Mesh(new THREE.SphereGeometry(0.122, 16, 12), skinMat);
    neckBaseFlare.scale.set(1.12, 0.48, 0.95);
    neckBaseFlare.position.set(0, -0.02, 0.01);
    neckGroup.add(neck, neckBaseFlare);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.385, 0.02);
    headGroup.scale.setScalar(1.07);
    neckGroup.add(headGroup);

    const headMesh = new THREE.Mesh(createChibiHeadGeometry(), skinMat);
    headGroup.add(headMesh);

    const humanEarsGroup = new THREE.Group();
    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.076, 14, 12), skinMat);
      ear.scale.set(0.52, 0.96, 0.68);
      ear.position.set(sx * 0.365, -0.015, -0.02);
      ear.rotation.z = sx * -0.08;
      humanEarsGroup.add(ear);
    }
    headGroup.add(humanEarsGroup);

    const foxEarsGroup = new THREE.Group();
    for (const sx of [-1, 1]) {
      const earWrap = new THREE.Group();
      earWrap.position.set(sx * 0.27, 0.33, 0.02);
      earWrap.rotation.set(0.12, sx * -0.18, sx * -0.34);
      const outer = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.36, 14), skinMat);
      outer.scale.set(1.0, 1.0, 0.58);
      outer.position.set(0, 0.12, 0);
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.088, 0.24, 12), furSecondaryMat);
      inner.scale.set(1.0, 1.0, 0.45);
      inner.position.set(0, 0.09, 0.036);
      earWrap.add(outer, inner);
      foxEarsGroup.add(earWrap);
    }
    foxEarsGroup.visible = false;
    headGroup.add(foxEarsGroup);

    const cyberFoxHeadGroup = new THREE.Group();
    for (const sx of [-1, 1]) {
      const ew = new THREE.Group();
      ew.position.set(sx * 0.27, 0.35, 0.0);
      ew.rotation.set(0.1, sx * -0.15, sx * -0.32);
      const earOuter = new THREE.Mesh(new THREE.ConeGeometry(0.165, 0.42, 14), cyberNavyMat);
      earOuter.scale.set(1.0, 1.0, 0.54);
      earOuter.position.set(0, 0.14, 0);
      const earMid = new THREE.Mesh(new THREE.ConeGeometry(0.135, 0.34, 12), hairMat);
      earMid.scale.set(1.0, 1.0, 0.48);
      earMid.position.set(0, 0.12, 0.014);
      const earInner = new THREE.Mesh(new THREE.ConeGeometry(0.088, 0.23, 12), shoeWhiteMat);
      earInner.scale.set(1.0, 1.0, 0.38);
      earInner.position.set(0, 0.09, 0.036);
      const earGold = new THREE.Mesh(
        createSculptedRibbonLockGeometry(0.048, [
          [sx * -0.05, -0.02, 0.04],
          [sx * -0.09, 0.11, 0.05],
          [sx * -0.04, 0.22, 0.03],
        ]),
        cyberGoldMat
      );
      ew.add(earOuter, earMid, earInner, earGold);
      cyberFoxHeadGroup.add(ew);
    }
    const foxBoltPaths: [number, number, number][][] = [
      [[-0.02, 0.42, 0.25], [-0.14, 0.31, 0.40], [-0.25, 0.20, 0.39]],
      [[0.02, 0.42, 0.25], [0.14, 0.31, 0.40], [0.25, 0.20, 0.39]],
      [[-0.05, 0.44, 0.14], [0.08, 0.56, 0.12], [0.24, 0.54, 0.02]],
      [[-0.22, 0.32, 0.12], [-0.38, 0.22, 0.24], [-0.46, 0.07, 0.18]],
      [[0.22, 0.32, 0.12], [0.38, 0.22, 0.24], [0.46, 0.07, 0.18]],
      [[-0.14, 0.34, -0.14], [-0.28, 0.28, -0.32], [-0.36, 0.14, -0.38]],
      [[0.14, 0.34, -0.14], [0.28, 0.28, -0.32], [0.36, 0.14, -0.38]],
    ];
    for (const pts of foxBoltPaths) {
      cyberFoxHeadGroup.add(new THREE.Mesh(createSculptedRibbonLockGeometry(0.054, pts), cyberGoldMat));
    }
    cyberFoxHeadGroup.visible = false;
    headGroup.add(cyberFoxHeadGroup);

    const bunnyEarsGroup = new THREE.Group();
    for (const sx of [-1, 1]) {
      const earWrap = new THREE.Group();
      earWrap.position.set(sx * 0.18, 0.38, 0.02);
      earWrap.rotation.set(0.16, 0, sx * -0.16);
      const outer = new THREE.Mesh(new THREE.CapsuleGeometry(0.082, 0.42, 8, 14), skinMat);
      outer.scale.set(0.95, 1, 0.48);
      outer.position.set(0, 0.24, 0);
      const inner = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.3, 6, 12), furSecondaryMat);
      inner.scale.set(0.95, 1, 0.3);
      inner.position.set(0, 0.24, 0.032);
      earWrap.add(outer, inner);
      bunnyEarsGroup.add(earWrap);
    }
    bunnyEarsGroup.visible = false;
    headGroup.add(bunnyEarsGroup);

    const bearEarsGroup = new THREE.Group();
    for (const sx of [-1, 1]) {
      const earWrap = new THREE.Group();
      earWrap.position.set(sx * 0.32, 0.33, 0.0);
      const outer = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 14), skinMat);
      outer.scale.set(1, 1, 0.56);
      const inner = new THREE.Mesh(new THREE.SphereGeometry(0.086, 14, 12), furSecondaryMat);
      inner.scale.set(1, 1, 0.38);
      inner.position.set(0, 0, 0.044);
      earWrap.add(outer, inner);
      bearEarsGroup.add(earWrap);
    }
    bearEarsGroup.visible = false;
    headGroup.add(bearEarsGroup);

    const elfEarsGroup = new THREE.Group();
    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.32, 12), skinMat);
      ear.position.set(sx * 0.46, 0.02, -0.02);
      ear.rotation.z = sx * -1.25;
      ear.rotation.y = sx * -0.2;
      ear.scale.set(0.6, 1, 0.42);
      elfEarsGroup.add(ear);
    }
    elfEarsGroup.visible = false;
    headGroup.add(elfEarsGroup);

    const pandaPatchesGroup = new THREE.Group();
    for (const sx of [-1, 1]) {
      const patch = new THREE.Mesh(new THREE.SphereGeometry(0.135, 16, 14), pandaDarkMat);
      patch.scale.set(1.06, 1.24, 0.35);
      patch.position.set(sx * 0.16, 0.01, 0.345);
      patch.rotation.z = sx * -0.22;
      patch.rotation.y = sx * 0.18;
      pandaPatchesGroup.add(patch);
    }
    pandaPatchesGroup.visible = false;
    headGroup.add(pandaPatchesGroup);

    // Cheek Blush seated cleanly on the cheek contour
    for (const sx of [-1, 1]) {
      const blush = new THREE.Mesh(new THREE.SphereGeometry(0.056, 12, 10), blushMat);
      blush.scale.set(1.22, 0.64, 0.32);
      blush.position.set(sx * 0.192, -0.072, 0.352);
      blush.rotation.y = sx * 0.24;
      headGroup.add(blush);
    }

    // Button Nose seated on the mid-face curve
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.023, 12, 10), skinMat);
    nose.scale.set(1.06, 0.86, 0.92);
    nose.position.set(0, -0.052, 0.394);
    headGroup.add(nose);

    const snoutGroup = new THREE.Group();
    snoutGroup.position.set(0, -0.115, 0.36);
    const muzzlePad = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 14), furSecondaryMat);
    muzzlePad.scale.set(1.25, 0.88, 0.95);
    const cuteNose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), lashMat);
    cuteNose.scale.set(1.25, 0.85, 0.8);
    cuteNose.position.set(0, 0.036, 0.105);
    snoutGroup.add(muzzlePad, cuteNose);
    snoutGroup.visible = false;
    headGroup.add(snoutGroup);

    const beakGroup = new THREE.Group();
    beakGroup.position.set(0, -0.08, 0.4);
    const beak = new THREE.Mesh(
      new THREE.ConeGeometry(0.065, 0.13, 12),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35 })
    );
    beak.rotation.x = Math.PI * 0.56;
    beakGroup.add(beak);
    beakGroup.visible = false;
    headGroup.add(beakGroup);

    const robotHeadExtras = new THREE.Group();
    const antStem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.22, 10), glassesFrameMat);
    antStem.position.set(0, 0.47, 0);
    const antOrb = new THREE.Mesh(new THREE.SphereGeometry(0.056, 14, 12), accentMat);
    antOrb.position.set(0, 0.58, 0);
    robotHeadExtras.add(antStem, antOrb);
    for (const sx of [-1, 1]) {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.08, 16), glassesFrameMat);
      bolt.rotation.z = Math.PI * 0.5;
      bolt.position.set(sx * 0.42, 0.0, 0);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 8, 16), accentMat);
      ring.rotation.y = Math.PI * 0.5;
      ring.position.set(sx * 0.46, 0.0, 0);
      robotHeadExtras.add(bolt, ring);
    }
    robotHeadExtras.visible = false;
    headGroup.add(robotHeadExtras);

    // Eyebrows seated cleanly along the brow ridge curvature
    const browGeo = new THREE.CapsuleGeometry(0.013, 0.064, 8, 12);
    const leftBrow = new THREE.Mesh(browGeo, browMat);
    leftBrow.rotation.set(0, -0.22, Math.PI * 0.49);
    leftBrow.position.set(-0.128, 0.124, 0.376);
    headGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeo, browMat);
    rightBrow.rotation.set(0, 0.22, -Math.PI * 0.49);
    rightBrow.position.set(0.128, 0.124, 0.376);
    headGroup.add(rightBrow);

    // Eyes aligned to facial normal ±0.22 rad at z=0.384 so inner corner, center, and outer corner all clear the skin surface cleanly
    const leftEye = buildEye(scleraMat, irisMat, pupilMat, catchlightMat, lashMat, skinMat);
    leftEye.openGroup.parent!.position.set(-0.128, 0.014, 0.384);
    leftEye.openGroup.parent!.rotation.y = -0.22;
    headGroup.add(leftEye.openGroup.parent!);

    const rightEye = buildEye(scleraMat, irisMat, pupilMat, catchlightMat, lashMat, skinMat);
    rightEye.openGroup.parent!.position.set(0.128, 0.014, 0.384);
    rightEye.openGroup.parent!.rotation.y = 0.22;
    headGroup.add(rightEye.openGroup.parent!);

    // Mouth Smile & Compact Lip-Sync Open Group seated cleanly on lower face contour
    const mouthSmile = new THREE.Mesh(
      new THREE.TorusGeometry(0.038, 0.0082, 10, 20, Math.PI * 0.56),
      browMat
    );
    mouthSmile.position.set(0, -0.126, 0.381);
    mouthSmile.rotation.set(0.14, 0, Math.PI * 1.22);
    headGroup.add(mouthSmile);

    const mouthOpenGroup = new THREE.Group();
    mouthOpenGroup.position.set(0, -0.130, 0.379);
    mouthOpenGroup.rotation.x = 0.14;
    const cavity = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 18, 16),
      new THREE.MeshBasicMaterial({ color: 0x5c191b })
    );
    cavity.scale.set(1.02, 0.74, 0.42);
    mouthOpenGroup.add(cavity);
    const teeth = new THREE.Mesh(
      new THREE.BoxGeometry(0.034, 0.009, 0.012),
      shoeWhiteMat
    );
    teeth.position.set(0, 0.011, 0.012);
    mouthOpenGroup.add(teeth);
    const tongue = new THREE.Mesh(
      new THREE.SphereGeometry(0.021, 14, 12),
      new THREE.MeshStandardMaterial({ color: 0xe67680, roughness: 0.48 })
    );
    tongue.scale.set(0.95, 0.45, 0.5);
    tongue.position.set(0, -0.012, 0.012);
    mouthOpenGroup.visible = false;
    mouthOpenGroup.add(tongue);
    headGroup.add(mouthOpenGroup);

    const hairGroup = new THREE.Group();
    headGroup.add(hairGroup);

    const buildBaseHairCap = (target: THREE.Group, mat: THREE.MeshStandardMaterial) => {
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.422, 36, 26, 0, Math.PI * 2, 0, Math.PI * 0.54),
        mat
      );
      cap.scale.set(0.95, 1.06, 1.01);
      cap.rotation.x = -0.14;
      cap.position.set(0, 0.075, -0.018);
      target.add(cap);

      const back = new THREE.Mesh(new THREE.SphereGeometry(0.414, 28, 22), mat);
      back.scale.set(0.94, 1.03, 0.97);
      back.position.set(0, 0.038, -0.068);
      target.add(back);

      for (const sx of [-1, 1]) {
        const templeLock = createSculptedRibbonLockGeometry(0.062, [
          [sx * 0.32, 0.24, 0.13],
          [sx * 0.37, 0.10, 0.10],
          [sx * 0.36, -0.04, 0.06],
        ]);
        target.add(new THREE.Mesh(templeLock, mat));
      }
    };

    const spikyGroup = new THREE.Group();
    buildBaseHairCap(spikyGroup, hairMat);
    const spikyLocks: Array<{ r: number; pts: [number, number, number][]; hi?: boolean }> = [
      { r: 0.094, pts: [[-0.14, 0.40, 0.16], [0.02, 0.51, 0.15], [0.20, 0.50, 0.06], [0.34, 0.39, -0.05]], hi: true },
      { r: 0.090, pts: [[-0.08, 0.42, 0.04], [0.10, 0.53, 0.02], [0.27, 0.49, -0.08], [0.37, 0.35, -0.16]], hi: true },
      { r: 0.084, pts: [[-0.12, 0.40, 0.10], [-0.24, 0.46, 0.04], [-0.34, 0.36, -0.06], [-0.37, 0.22, -0.12]] },
      { r: 0.072, pts: [[-0.10, 0.41, 0.22], [0.05, 0.38, 0.34], [0.22, 0.31, 0.32], [0.34, 0.20, 0.22]], hi: true },
      { r: 0.068, pts: [[-0.12, 0.40, 0.22], [-0.23, 0.35, 0.31], [-0.33, 0.25, 0.26], [-0.36, 0.13, 0.16]], hi: true },
      { r: 0.052, pts: [[-0.04, 0.40, 0.25], [0.04, 0.34, 0.35], [0.11, 0.26, 0.34]] },
      { r: 0.050, pts: [[-0.11, 0.39, 0.24], [-0.16, 0.32, 0.33], [-0.21, 0.25, 0.31]] },
      { r: 0.064, pts: [[-0.30, 0.28, 0.13], [-0.375, 0.13, 0.14], [-0.36, -0.04, 0.09]] },
      { r: 0.064, pts: [[0.30, 0.28, 0.13], [0.375, 0.13, 0.14], [0.36, -0.04, 0.09]] },
      { r: 0.088, pts: [[-0.14, 0.38, -0.06], [-0.26, 0.39, -0.16], [-0.32, 0.25, -0.26]], hi: true },
      { r: 0.088, pts: [[0.14, 0.38, -0.06], [0.26, 0.39, -0.16], [0.32, 0.25, -0.26]], hi: true },
      { r: 0.094, pts: [[0, 0.38, -0.16], [0, 0.36, -0.34], [0, 0.20, -0.42]] },
      { r: 0.082, pts: [[-0.18, 0.25, -0.20], [-0.31, 0.20, -0.30], [-0.33, 0.06, -0.33]] },
      { r: 0.082, pts: [[0.18, 0.25, -0.20], [0.31, 0.20, -0.30], [0.33, 0.06, -0.33]] },
    ];
    for (const lock of spikyLocks) {
      const geo = createSculptedRibbonLockGeometry(lock.r, lock.pts);
      spikyGroup.add(new THREE.Mesh(geo, lock.hi ? hairHighlightMat : hairMat));
    }
    hairGroup.add(spikyGroup);

    const shortGroup = new THREE.Group();
    buildBaseHairCap(shortGroup, hairMat);
    const shortLocks: Array<{ r: number; pts: [number, number, number][]; hi?: boolean }> = [
      { r: 0.086, pts: [[-0.12, 0.41, 0.20], [0.04, 0.49, 0.25], [0.20, 0.43, 0.20]], hi: true },
      { r: 0.080, pts: [[-0.06, 0.43, 0.08], [0.10, 0.50, 0.12], [0.25, 0.42, 0.06]], hi: true },
      { r: 0.058, pts: [[-0.04, 0.40, 0.25], [-0.09, 0.33, 0.34], [-0.07, 0.26, 0.33]], hi: true },
      { r: 0.058, pts: [[0.06, 0.40, 0.24], [0.14, 0.32, 0.34], [0.18, 0.25, 0.32]] },
      { r: 0.068, pts: [[-0.23, 0.36, 0.17], [-0.33, 0.23, 0.24], [-0.35, 0.11, 0.19]] },
      { r: 0.068, pts: [[0.23, 0.35, 0.16], [0.34, 0.22, 0.23], [0.36, 0.10, 0.18]] },
    ];
    for (const lock of shortLocks) {
      shortGroup.add(
        new THREE.Mesh(
          createSculptedRibbonLockGeometry(lock.r, lock.pts),
          lock.hi ? hairHighlightMat : hairMat
        )
      );
    }
    shortGroup.visible = false;
    hairGroup.add(shortGroup);

    const longGroup = new THREE.Group();
    buildBaseHairCap(longGroup, hairMat);
    const backCascade = new THREE.Mesh(new THREE.CapsuleGeometry(0.33, 0.44, 10, 18), hairMat);
    backCascade.scale.set(1.06, 1.0, 0.54);
    backCascade.position.set(0, -0.18, -0.21);
    longGroup.add(backCascade);
    for (const sx of [-1, 1]) {
      const sideLock = createSculptedRibbonLockGeometry(0.082, [
        [sx * 0.25, 0.33, 0.18],
        [sx * 0.37, 0.08, 0.16],
        [sx * 0.36, -0.22, 0.12],
        [sx * 0.30, -0.44, 0.06],
      ]);
      longGroup.add(new THREE.Mesh(sideLock, hairMat));
      const bangLock = createSculptedRibbonLockGeometry(0.062, [
        [sx * 0.02, 0.39, 0.24],
        [sx * 0.15, 0.32, 0.33],
        [sx * 0.28, 0.23, 0.28],
      ]);
      longGroup.add(new THREE.Mesh(bangLock, hairHighlightMat));
    }
    longGroup.visible = false;
    hairGroup.add(longGroup);

    const bunGroup = new THREE.Group();
    buildBaseHairCap(bunGroup, hairMat);
    for (const sx of [-1, 1]) {
      const bunBang = createSculptedRibbonLockGeometry(0.062, [
        [sx * 0.02, 0.39, 0.24],
        [sx * 0.16, 0.32, 0.32],
        [sx * 0.29, 0.23, 0.27],
      ]);
      bunGroup.add(new THREE.Mesh(bunBang, hairMat));
    }
    const bunBall = new THREE.Mesh(new THREE.SphereGeometry(0.165, 18, 16), hairHighlightMat);
    bunBall.position.set(0, 0.39, -0.31);
    bunGroup.add(bunBall);
    bunGroup.visible = false;
    hairGroup.add(bunGroup);

    const hijabGroup = new THREE.Group();
    const hijabDome = new THREE.Mesh(new THREE.SphereGeometry(0.425, 24, 18), hijabMat);
    hijabDome.scale.set(0.96, 1.04, 1.0);
    hijabDome.position.set(0, 0.03, -0.045);
    hijabGroup.add(hijabDome);
    const hijabChin = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.078, 12, 24), hijabMat);
    hijabChin.scale.set(0.98, 1.06, 0.72);
    hijabChin.position.set(0, -0.02, 0.085);
    hijabGroup.add(hijabChin);
    const hijabDrape = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.42, 18), hijabMat);
    hijabDrape.scale.set(1.02, 1, 0.65);
    hijabDrape.position.set(0, -0.42, 0.04);
    hijabGroup.add(hijabDrape);
    hijabGroup.visible = false;
    hairGroup.add(hijabGroup);

    const khimarGroup = new THREE.Group();
    const khimarDome = hijabDome.clone();
    khimarGroup.add(khimarDome);
    const khimarCloak = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.78, 20), hijabMat);
    khimarCloak.scale.set(1.0, 1, 0.78);
    khimarCloak.position.set(0, -0.54, -0.02);
    khimarGroup.add(khimarCloak);
    khimarGroup.visible = false;
    hairGroup.add(khimarGroup);

    const niqabVeil = new THREE.Mesh(
      new THREE.SphereGeometry(0.39, 18, 14, 0, Math.PI, Math.PI * 0.48, Math.PI * 0.44),
      hijabMat
    );
    niqabVeil.rotation.y = -Math.PI * 0.5;
    niqabVeil.scale.set(0.92, 1.05, 1.04);
    niqabVeil.position.set(0, -0.03, 0.065);
    niqabVeil.visible = false;
    headGroup.add(niqabVeil);

    const peciGroup = new THREE.Group();
    const peciMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.375, 0.23, 24), peciMat);
    peciMesh.scale.set(0.96, 1, 1.04);
    peciMesh.position.set(0, 0.35, -0.02);
    peciGroup.add(peciMesh);
    peciGroup.visible = false;
    headGroup.add(peciGroup);

    const glassesRoundGroup = new THREE.Group();
    for (const sx of [-1, 1]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.014, 10, 22), glassesFrameMat);
      rim.position.set(sx * 0.145, 0.018, 0.415);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.105, 20), glassesLensMat);
      lens.position.set(sx * 0.145, 0.018, 0.412);
      glassesRoundGroup.add(rim, lens);
    }
    const bridgeR = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.085, 8), glassesFrameMat);
    bridgeR.rotation.z = Math.PI * 0.5;
    bridgeR.position.set(0, 0.03, 0.42);
    glassesRoundGroup.add(bridgeR);
    glassesRoundGroup.visible = false;
    headGroup.add(glassesRoundGroup);

    const glassesSquareGroup = new THREE.Group();
    for (const sx of [-1, 1]) {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.205, 0.15, 0.022), glassesFrameMat);
      frame.position.set(sx * 0.145, 0.018, 0.415);
      const lens = new THREE.Mesh(new THREE.BoxGeometry(0.175, 0.12, 0.026), glassesLensMat);
      lens.position.set(sx * 0.145, 0.018, 0.416);
      glassesSquareGroup.add(frame, lens);
    }
    const bridgeS = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.02, 0.02), glassesFrameMat);
    bridgeS.position.set(0, 0.04, 0.418);
    glassesSquareGroup.add(bridgeS);
    glassesSquareGroup.visible = false;
    headGroup.add(glassesSquareGroup);

    const headphoneGroup = new THREE.Group();
    const headband = new THREE.Mesh(
      new THREE.TorusGeometry(0.465, 0.034, 12, 30, Math.PI * 1.06),
      hoodieMat
    );
    headband.scale.set(0.94, 1.15, 1.0);
    headband.position.set(0, 0.035, -0.055);
    headband.rotation.x = -0.28;
    headband.rotation.z = -Math.PI * 0.03;
    headphoneGroup.add(headband);
    for (const sx of [-1, 1]) {
      const cushion = new THREE.Mesh(new THREE.TorusGeometry(0.112, 0.03, 10, 22), hoodieInsideMat);
      cushion.rotation.y = Math.PI * 0.5;
      cushion.scale.set(0.92, 1.18, 1);
      cushion.position.set(sx * 0.445, -0.015, -0.015);
      headphoneGroup.add(cushion);

      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.132, 0.132, 0.085, 22), hoodieMat);
      cup.rotation.z = Math.PI * 0.5;
      cup.scale.set(1.18, 1, 0.92);
      cup.position.set(sx * 0.476, -0.015, -0.015);
      headphoneGroup.add(cup);

      const glowRing = new THREE.Mesh(new THREE.TorusGeometry(0.094, 0.016, 10, 24), accentMat);
      glowRing.rotation.y = Math.PI * 0.5;
      glowRing.scale.set(0.92, 1.18, 1);
      glowRing.position.set(sx * 0.52, -0.015, -0.015);
      headphoneGroup.add(glowRing);
    }
    headphoneGroup.visible = false;
    headGroup.add(headphoneGroup);

    const orbScene = new THREE.Scene();
    orbScene.environment = pmremTarget.texture;
    orbScene.environmentIntensity = 0.85;
    orbScene.add(new THREE.HemisphereLight(0xfff8ed, 0x1e293b, 1.1));
    const orbKey = new THREE.DirectionalLight(0xffffff, 1.8);
    orbKey.position.set(2, 3, 3);
    orbScene.add(orbKey);
    const orbCamera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
    orbCamera.position.set(0, 0.1, 3.2);
    orbCamera.lookAt(0, 0, 0);

    const orbRoot = new THREE.Group();
    orbScene.add(orbRoot);
    const orbBodyMat = new THREE.MeshStandardMaterial({
      color: 0xff4520,
      roughness: 0.25,
      metalness: 0.1,
      emissive: 0x3b1206,
      emissiveIntensity: 0.24,
    });
    const orbBody = new THREE.Mesh(new THREE.SphereGeometry(0.46, 26, 22), orbBodyMat);
    orbRoot.add(orbBody);

    const visor = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.14, 0.28, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.18 })
    );
    visor.rotation.z = Math.PI * 0.5;
    visor.scale.set(0.82, 1, 0.6);
    visor.position.set(0, 0.02, 0.36);
    orbRoot.add(visor);

    const orbVisorGlowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    for (const sx of [-0.11, 0.11]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 12), orbVisorGlowMat);
      eye.scale.set(0.9, 1.15, 0.45);
      eye.position.set(sx, 0.02, 0.46);
      orbRoot.add(eye);
    }

    const wingMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.28, metalness: 0.05 });
    const makeWing = (dir: -1 | 1) => {
      const g = new THREE.Group();
      g.position.set(dir * 0.44, 0.05, -0.02);
      const wMain = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), wingMat);
      wMain.scale.set(1.45, 0.65, 0.32);
      wMain.position.set(dir * 0.22, 0.06, 0);
      wMain.rotation.z = dir * 0.25;
      const wTip = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), wingMat);
      wTip.scale.set(1.3, 0.55, 0.28);
      wTip.position.set(dir * 0.36, -0.05, 0);
      wTip.rotation.z = dir * -0.15;
      g.add(wMain, wTip);
      return g;
    };
    const orbLeftWing = makeWing(-1);
    const orbRightWing = makeWing(1);
    orbRoot.add(orbLeftWing, orbRightWing);

    sharedStudio = {
      renderer,
      canvas,
      isSoftwareGl,
      pmremTarget,
      scene,
      camera,
      rootGroup,
      pelvisGroup,
      torsoGroup,
      neckGroup,
      headGroup,
      hairGroup,
      hairStyleGroups: {
        spiky: spikyGroup,
        short: shortGroup,
        long: longGroup,
        bun: bunGroup,
        hijab: hijabGroup,
        khimar: khimarGroup,
      },
      niqabVeil,
      peciGroup,
      headphoneGroup,
      glassesRoundGroup,
      glassesSquareGroup,
      humanEarsGroup,
      foxEarsGroup,
      bunnyEarsGroup,
      bearEarsGroup,
      elfEarsGroup,
      pandaPatchesGroup,
      snoutGroup,
      beakGroup,
      robotHeadExtras,
      robotChestCore,
      blazerLapelsGroup,
      tieGroup,
      hoodieCollarGroup,
      tailGroup,
      foxTailGroup,
      catTailGroup,
      bunnyTailGroup,
      leftBrow,
      rightBrow,
      leftEye,
      rightEye,
      mouthSmile,
      mouthOpenGroup,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      emblemGroup,
      cyberFoxHeadGroup,
      cyberFoxTorsoGroup: cyberTorsoGroup,
      cyberFoxHipGroup: cyberHipGroup,
      cyberFoxTailMesh: foxTailMesh,
      materials: {
        hair: hairMat,
        hairHighlight: hairHighlightMat,
        skin: skinMat,
        furSecondary: furSecondaryMat,
        hoodie: hoodieMat,
        hoodieInside: hoodieInsideMat,
        jacket: jacketMat,
        pants: pantsMat,
        shoes: shoesMat,
        accent: accentMat,
        hijab: hijabMat,
        peci: peciMat,
        glassesFrame: glassesFrameMat,
        glassesLens: glassesLensMat,
        tie: tieMat,
        iris: irisMat,
        orbBody: orbBodyMat,
      },
      orbScene,
      orbCamera,
      orbRoot,
      orbLeftWing,
      orbRightWing,
      orbVisorGlowMat,
    };

    return sharedStudio;
  } catch {
    webglUnavailable = true;
    return null;
  }
}

function applyArmPose(arm: ArmRigNodes, angles: ArmJointAngles, sideSign: -1 | 1) {
  const safePitch = Math.max(-0.55, Math.min(0.95, angles.pitch));
  const safeAbduct = Math.max(0.18, Math.min(0.62, angles.abduct));
  const safeElbow = Math.max(0.2, Math.min(1.08, angles.elbow));
  // Clean 'ZXY' shoulder articulation: outward abduction (+sideSign * abduct), forward elevation (-pitch), outward-opening axial rotation (-twist) so forearms never cross over the chest
  arm.shoulder.rotation.set(
    -safePitch,
    -angles.twist * 0.28 + sideSign * safeElbow * 0.08,
    sideSign * safeAbduct
  );
  // True anatomical elbow hinge (siku): clean hinge flexion along the arm plane
  arm.elbow.rotation.set(-safeElbow, 0, 0);

  // Smooth wrist follow-through aligned with forearm
  arm.wrist.rotation.set(angles.wrist * 0.45, 0, sideSign * angles.wrist * 0.12);

  arm.handOpen.visible = angles.gesture === 'open' || angles.gesture === 'wave';
  arm.handPoint.visible = angles.gesture === 'point';
  arm.handFist.visible = angles.gesture === 'fist';
  arm.handThumbs.visible = angles.gesture === 'thumbs';
}

let lastAppearanceSig = '';

function applyAppearanceAndKinematics(
  studio: SharedCreator3DStudio,
  k: EvaluatedCreator3DKinematics,
  opts: Creator3DRenderOptions
) {
  const facing = opts.facing ?? 1;
  const species: RigSpecies = opts.species || 'human';
  const hairStyle: RigHairStyle = opts.hairStyle || 'spiky';
  const isCyberFox = Boolean(
    opts.isCyberFox || (species === 'fox' && String(opts.skinColor || '').toLowerCase() === '#fde6d8')
  );

  const appearanceSig = `${species}|${hairStyle}|${isCyberFox}|${opts.hairColor || ''}|${opts.hoodieColor || ''}|${opts.skinColor || ''}|${opts.furSecondaryColor || ''}|${opts.jacketColor || ''}|${opts.pantsColor || ''}|${opts.shoeColor || ''}|${opts.accentColor || ''}|${opts.hijabColor || ''}|${opts.peciColor || ''}|${opts.tieColor || ''}|${Boolean(opts.niqab)}|${Boolean(opts.jacketOpen)}|${opts.glassesStyle || ''}|${opts.glassesColor || ''}|${Boolean(opts.hasHeadphones)}`;

  if (appearanceSig !== lastAppearanceSig) {
    lastAppearanceSig = appearanceSig;

    const hairHex = opts.hairColor || '#ef441a';
    studio.materials.hair.color.set(hairHex);
    studio.materials.hairHighlight.color.set(hairHex).offsetHSL(0.015, 0.03, 0.07);
    studio.materials.hoodie.color.set(opts.hoodieColor || '#16171c');
    studio.materials.hoodieInside.color.set(opts.hoodieColor || '#16171c').offsetHSL(0, 0, 0.07);
    studio.materials.skin.color.set(opts.skinColor || '#f5ccb2');
    studio.materials.furSecondary.color.set(opts.furSecondaryColor || '#e0f2fe');
    studio.materials.jacket.color.set(opts.jacketColor || opts.hoodieColor || '#0f172a');
    studio.materials.pants.color.set(opts.pantsColor || '#18181b');
    studio.materials.shoes.color.set(opts.shoeColor || opts.accentColor || '#ef4444');
    studio.materials.accent.color.set(opts.accentColor || '#ff471a');
    studio.materials.hijab.color.set(opts.hijabColor || opts.hairColor || '#ee93a6');
    studio.materials.peci.color.set(opts.peciColor || '#18181b');
    studio.materials.tie.color.set(opts.tieColor || '#2563eb');
    studio.materials.iris.color.set(
      isCyberFox
        ? '#0284c7'
        : species === 'robot' || species === 'alien'
        ? opts.accentColor || '#38bdf8'
        : '#3f1d0d'
    );

    const isCovered = hairStyle === 'hijab' || hairStyle === 'khimar';
    studio.hairStyleGroups.spiky.visible = hairStyle === 'spiky';
    studio.hairStyleGroups.short.visible = hairStyle === 'short';
    studio.hairStyleGroups.long.visible = hairStyle === 'long';
    studio.hairStyleGroups.bun.visible = hairStyle === 'bun';
    studio.hairStyleGroups.hijab.visible = hairStyle === 'hijab';
    studio.hairStyleGroups.khimar.visible = hairStyle === 'khimar';
    studio.niqabVeil.visible = Boolean(opts.niqab);
    studio.peciGroup.visible = Boolean(opts.peciColor) && !isCovered;

    const hasFoxEars = !isCyberFox && (species === 'fox' || species === 'cat' || species === 'wolf' || species === 'owl');
    const hasBunnyEars = species === 'bunny';
    const hasBearEars = species === 'bear' || species === 'panda';
    const hasElfEars = species === 'elf' || species === 'alien';

    studio.humanEarsGroup.visible = !isCovered && (species === 'human' || isCyberFox);
    studio.foxEarsGroup.visible = !isCovered && hasFoxEars;
    studio.cyberFoxHeadGroup.visible = !isCovered && isCyberFox;
    studio.cyberFoxTorsoGroup.visible = isCyberFox;
    studio.cyberFoxHipGroup.visible = isCyberFox;
    studio.emblemGroup.visible = !isCyberFox;
    studio.cyberFoxTailMesh.material = isCyberFox ? studio.materials.hair : studio.materials.skin;
    studio.bunnyEarsGroup.visible = !isCovered && hasBunnyEars;
    studio.bearEarsGroup.visible = !isCovered && hasBearEars;
    studio.elfEarsGroup.visible = !isCovered && hasElfEars;
    studio.pandaPatchesGroup.visible = species === 'panda';

    studio.snoutGroup.visible =
      !opts.niqab &&
      !isCyberFox &&
      (species === 'fox' ||
        species === 'cat' ||
        species === 'wolf' ||
        species === 'bunny' ||
        species === 'bear' ||
        species === 'panda');
    studio.beakGroup.visible = !opts.niqab && species === 'owl';
    studio.robotHeadExtras.visible = species === 'robot';
    studio.robotChestCore.visible = species === 'robot';
    studio.blazerLapelsGroup.visible = Boolean(opts.jacketOpen);
    studio.hoodieCollarGroup.visible = !opts.jacketOpen && species !== 'robot';
    studio.tieGroup.visible = Boolean(opts.tieColor);

    const showFoxTail = species === 'fox' || species === 'wolf';
    const showCatTail = species === 'cat';
    const showBunnyTail = species === 'bunny' || species === 'bear' || species === 'panda';
    studio.tailGroup.visible = showFoxTail || showCatTail || showBunnyTail;
    studio.foxTailGroup.visible = showFoxTail;
    studio.catTailGroup.visible = showCatTail;
    studio.bunnyTailGroup.visible = showBunnyTail;

    const gs = opts.glassesStyle || 'none';
    if (gs !== 'none') {
      studio.materials.glassesFrame.color.set(opts.glassesColor || '#0f172a');
      if (gs === 'sunglasses') {
        studio.materials.glassesLens.color.set('#020617');
        studio.materials.glassesLens.opacity = 0.88;
      } else {
        studio.materials.glassesLens.color.set('#38bdf8');
        studio.materials.glassesLens.opacity = 0.3;
      }
    }
    studio.glassesRoundGroup.visible = gs === 'round';
    studio.glassesSquareGroup.visible = gs === 'square' || gs === 'sunglasses';
    studio.headphoneGroup.visible = !isCyberFox && Boolean(opts.hasHeadphones);
  }

  if (studio.tailGroup.visible) {
    studio.tailGroup.rotation.set(k.tailLift, k.tailWag, k.tailWag * 0.45);
  }

  const stretch = Math.max(-0.08, Math.min(0.08, k.bodySquash ?? 0));
  studio.rootGroup.scale.set(1 - stretch * 0.38, 1 + stretch, 1 - stretch * 0.38);
  studio.rootGroup.rotation.set(0, facing * 0.09, 0);
  studio.pelvisGroup.position.set(facing * k.hipShiftX, 0.49 - k.hipDropY, 0);

  studio.torsoGroup.rotation.set(k.torsoLean, facing * k.torsoTwist, facing * k.torsoSide);
  studio.torsoGroup.position.set(0, 0.04 + k.breathOffset, 0);

  studio.headGroup.rotation.set(k.headPitch, facing * k.headYaw, facing * k.headRoll);
  studio.hairGroup.rotation.set(k.hairBounce, 0, -k.headRoll * 0.24);

  studio.leftLeg.hip.rotation.set(k.leftLeg.hipPitch, 0, -k.leftLeg.hipOut);
  studio.leftLeg.knee.rotation.set(k.leftLeg.knee, 0, 0);
  studio.rightLeg.hip.rotation.set(k.rightLeg.hipPitch, 0, k.rightLeg.hipOut);
  studio.rightLeg.knee.rotation.set(k.rightLeg.knee, 0, 0);

  applyArmPose(studio.leftArm, k.leftArm, -1);
  applyArmPose(studio.rightArm, k.rightArm, 1);

  const browY = 0.124 + k.browLift * 0.32;
  const tilt = k.browTilt ?? 0;
  studio.leftBrow.position.y = browY + tilt * 0.012;
  studio.rightBrow.position.y = browY - tilt * 0.01;
  studio.leftBrow.rotation.z = Math.PI * 0.49 + tilt * 0.28;
  studio.rightBrow.rotation.z = -Math.PI * 0.49 - tilt * 0.24;
  const eyeMode = opts.eyeModeOverride || k.eyeMode;
  const isHappyArc = eyeMode === 'happy_arc';
  const isWideShock = eyeMode === 'wide_shock';
  const isTiredHalf = eyeMode === 'tired_half';
  const isFocus = eyeMode === 'focus';

  for (const eye of [studio.leftEye, studio.rightEye]) {
    eye.openGroup.visible = true;
    eye.happyArc.visible = false;
    const eyeScaleX = isWideShock ? 1.1 : isHappyArc ? 1.04 : 1.0;
    const eyeScaleY = isWideShock ? 1.14 : isHappyArc ? 0.94 : 1.0;
    eye.openGroup.scale.set(eyeScaleX, eyeScaleY, 1);
    const irisScale = isWideShock ? 0.86 : isHappyArc ? 1.04 : 1.0;
    // Preserve flattened Z scale (0.42) so iris & child pupil/catchlights sit flush on the sclera
    eye.iris.scale.set(0.96 * irisScale, 1.02 * irisScale, 0.42);
    eye.iris.position.set(k.gazeX * 0.24, -0.001 + k.gazeY * 0.24, 0.016);
    const isBlinking = k.blinkAmount > 0.35;
    eye.upperLid.visible = isBlinking || isTiredHalf;
    if (isBlinking) {
      eye.upperLid.position.set(0, 0.042 * (1 - k.blinkAmount), 0.012);
      eye.upperLid.scale.set(1.14, 0.75 + k.blinkAmount * 0.65, 0.44);
    } else if (isTiredHalf) {
      eye.upperLid.position.set(0, 0.032, 0.010);
      eye.upperLid.scale.set(1.14, 0.85, 0.44);
    }
    void isFocus;
  }

  const hideMouth = Boolean(opts.niqab);
  const speakingMouth = !hideMouth && k.mouthOpen > 0.07;
  studio.mouthSmile.visible = !hideMouth && !speakingMouth && !studio.snoutGroup.visible;
  studio.mouthOpenGroup.visible = speakingMouth;
  if (speakingMouth) {
    let widthScale = Math.min(1.02, 0.72 + k.mouthWide * 0.22);
    let openScale = Math.min(0.92, 0.26 + k.mouthOpen * 0.68);
    if (k.vowelShape === 'O') {
      widthScale = Math.min(0.74, 0.46 + k.mouthWide * 0.16);
      openScale = Math.min(0.9, 0.46 + k.mouthOpen * 0.48);
    } else if (k.vowelShape === 'U') {
      widthScale = Math.min(0.62, 0.4 + k.mouthWide * 0.15);
      openScale = Math.min(0.74, 0.34 + k.mouthOpen * 0.42);
    } else if (k.vowelShape === 'E' || k.vowelShape === 'I') {
      widthScale = Math.min(1.02, 0.8 + k.mouthWide * 0.16);
      openScale = Math.min(0.68, 0.26 + k.mouthOpen * 0.44);
    } else if (k.vowelShape === 'A') {
      widthScale = Math.min(0.98, 0.74 + k.mouthWide * 0.18);
      openScale = Math.min(0.94, 0.44 + k.mouthOpen * 0.52);
    } else if (k.vowelShape === 'M') {
      widthScale = 0.82;
      openScale = 0.18;
    }
    studio.mouthOpenGroup.scale.set(widthScale, openScale, 1);
    studio.mouthOpenGroup.position.z = studio.snoutGroup.visible ? 0.435 : 0.379;
    studio.mouthOpenGroup.position.y = (studio.snoutGroup.visible ? -0.136 : -0.130) - k.mouthOpen * 0.01;
  } else {
    if (k.mouthSmile < -0.15) {
      studio.mouthSmile.rotation.z = Math.PI * 0.22;
      studio.mouthSmile.position.y = -0.138;
      studio.mouthSmile.scale.set(0.86, 0.72, 1);
    } else if (k.mouthSmile < 0.2) {
      studio.mouthSmile.rotation.z = Math.PI * 1.22;
      studio.mouthSmile.position.y = -0.128;
      studio.mouthSmile.scale.set(0.78, 0.45, 1);
    } else {
      studio.mouthSmile.rotation.z = Math.PI * 1.22;
      studio.mouthSmile.position.y = -0.124;
      studio.mouthSmile.scale.set(0.98 + k.mouthSmile * 0.1, 0.9 + k.mouthSmile * 0.1, 1);
    }
  }
}

let lastCreatorRenderSignature = '';
let lastCreatorDrawW = 0;
let lastCreatorDrawH = 0;
let lastCreatorFixedH = 0;

/**
 * Renders the genuine Three.js 3D Narrator character onto a Canvas 2D context
 * anchored at bottom-center `(anchorX, anchorY)` with logical height `characterHeight`.
 * Supports `'full' | 'bust' | 'closeup' | 'orb'` framing modes.
 */
export function renderCreator3DToCanvas2D(
  targetCtx: CanvasRenderingContext2D,
  anchorX: number,
  anchorY: number,
  characterHeight: number,
  options: Creator3DRenderOptions = {}
): boolean {
  const studio = getOrCreateSharedStudio();
  if (!studio) return false;

  const t = Number(options.t ?? 0);
  const viewMode = options.viewMode ?? 'full';

  if (viewMode === 'orb') {
    const orbHex = options.accentColor || options.hoodieColor || options.skinColor || '#ff4520';
    return renderMascotOrb3DToCanvas2D(
      targetCtx,
      anchorX,
      anchorY - characterHeight * 0.5,
      characterHeight * 0.84,
      t,
      orbHex
    );
  }

  const facing = options.facing ?? 1;
  const maxTex = studio.isSoftwareGl ? 360 : 520;
  const drawH = Math.max(96, Math.min(maxTex, Math.round(characterHeight * 1.18)));
  const drawW = Math.round(drawH * (viewMode === 'closeup' ? 0.96 : 0.88));
  const fixedW = maxTex;
  const fixedH = maxTex;

  const tBucket = Math.round(t * 60);
  const poseSig = typeof options.pose === 'string' ? options.pose : JSON.stringify(options.pose || '');
  const renderSig = `${tBucket}|${viewMode}|${facing}|${drawW}x${drawH}|${options.species || ''}|${options.hoodieColor || ''}|${options.hairStyle || ''}|${poseSig}|${Boolean(options.speaking)}`;

  if (
    renderSig !== lastCreatorRenderSignature ||
    studio.canvas.width !== fixedW ||
    studio.canvas.height !== fixedH
  ) {
    const k = evaluateCreator3DKinematics(options.pose, t, {
      facing,
      speaking: options.speaking,
      previewStatic: options.previewStatic,
      viewMode,
      captionWords: options.captionWords,
      pace: options.pace,
    });

    applyAppearanceAndKinematics(studio, k, options);

    if (studio.canvas.width !== fixedW || studio.canvas.height !== fixedH) {
      studio.renderer.setSize(fixedW, fixedH, false);
    }

    studio.camera.aspect = drawW / drawH;
    const camSwayX = options.previewStatic ? 0 : Math.sin(t * 1.15) * 0.045;
    const camBreathY = options.previewStatic ? 0 : Math.sin(t * 1.8) * 0.015;
    const emphasisPushZ = options.previewStatic ? 0 : k.stressAccent * 0.16;
    if (viewMode === 'closeup') {
      studio.camera.position.set(camSwayX * 0.7, 1.54 + camBreathY, 2.75 - emphasisPushZ * 0.7);
      studio.camera.lookAt(k.hipShiftX * 0.35, 1.50 + k.breathOffset * 0.4, 0);
    } else if (viewMode === 'bust') {
      studio.camera.position.set(camSwayX * 0.85, 1.36 + camBreathY, 3.35 - emphasisPushZ);
      studio.camera.lookAt(k.hipShiftX * 0.45, 1.28 + k.breathOffset * 0.4, 0);
    } else {
      studio.camera.position.set(camSwayX, 0.98 + camBreathY, 4.45 - emphasisPushZ);
      studio.camera.lookAt(k.hipShiftX * 0.5, 0.94 + k.breathOffset * 0.35, 0);
    }
    studio.camera.updateProjectionMatrix();

    studio.renderer.setScissorTest(false);
    studio.renderer.clear();
    studio.renderer.setScissorTest(true);
    studio.renderer.setViewport(0, 0, drawW, drawH);
    studio.renderer.setScissor(0, 0, drawW, drawH);
    studio.renderer.render(studio.scene, studio.camera);
    studio.renderer.setScissorTest(false);

    lastCreatorRenderSignature = renderSig;
    lastCreatorDrawW = drawW;
    lastCreatorDrawH = drawH;
    lastCreatorFixedH = fixedH;
  }

  const destH = characterHeight * 1.18;
  const destW = destH * (lastCreatorDrawW / Math.max(1, lastCreatorDrawH));
  targetCtx.save();
  targetCtx.imageSmoothingEnabled = true;
  targetCtx.imageSmoothingQuality = 'high';
  targetCtx.drawImage(
    studio.canvas,
    1,
    lastCreatorFixedH - lastCreatorDrawH + 1,
    Math.max(1, lastCreatorDrawW - 2),
    Math.max(1, lastCreatorDrawH - 2),
    anchorX - destW * 0.5,
    anchorY - destH * 0.96,
    destW,
    destH
  );
  targetCtx.restore();
  return true;
}

/**
 * Renders the floating 3D Winged Mascot Orb onto a Canvas 2D context centered at `(cx, cy)`.
 */
export function renderMascotOrb3DToCanvas2D(
  targetCtx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  sizePx: number,
  t: number,
  bodyHex = '#ff4520'
): boolean {
  const studio = getOrCreateSharedStudio();
  if (!studio) return false;

  const k = evaluateMascotOrbKinematics(t);
  studio.materials.orbBody.color.set(bodyHex);
  studio.materials.orbBody.emissive.set(bodyHex).multiplyScalar(0.22);
  studio.orbRoot.position.set(0, k.bobY, 0);
  studio.orbRoot.rotation.set(0.08, k.yawY, k.tiltZ);
  studio.orbLeftWing.rotation.y = k.leftWingFlap;
  studio.orbRightWing.rotation.y = k.rightWingFlap;

  const maxTex = studio.isSoftwareGl ? 480 : 560;
  const res = studio.isSoftwareGl ? 192 : 240;
  if (studio.canvas.width !== maxTex || studio.canvas.height !== maxTex) {
    studio.renderer.setSize(maxTex, maxTex, false);
  }
  studio.orbCamera.aspect = 1;
  studio.orbCamera.updateProjectionMatrix();

  studio.renderer.setScissorTest(false);
  studio.renderer.clear();
  studio.renderer.setScissorTest(true);
  studio.renderer.setViewport(0, 0, res, res);
  studio.renderer.setScissor(0, 0, res, res);
  studio.renderer.render(studio.orbScene, studio.orbCamera);
  studio.renderer.setScissorTest(false);

  targetCtx.save();
  targetCtx.imageSmoothingEnabled = true;
  targetCtx.imageSmoothingQuality = 'high';
  targetCtx.drawImage(
    studio.canvas,
    1,
    maxTex - res + 1,
    Math.max(1, res - 2),
    Math.max(1, res - 2),
    cx - sizePx * 0.5,
    cy - sizePx * 0.5,
    sizePx,
    sizePx
  );
  targetCtx.restore();
  return true;
}
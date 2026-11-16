import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  evaluateCreator3DKinematics,
  evaluateMascotOrbKinematics,
  PoseInput,
  EvaluatedCreator3DKinematics,
  ArmJointAngles,
  LipSyncWordTiming,
} from './creator-3d-kinematics';

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
  // Mascot Orb Scene
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

    // Outward vector from head center keeps the ribbon flat against the skull surface without twisting
    const outward = pt.clone().sub(headCenter);
    if (outward.lengthSq() < 1e-4) outward.set(0, 1, 0.4);
    outward.normalize();

    const side = new THREE.Vector3().crossVectors(tangent, outward);
    if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
    side.normalize();
    const normalOut = new THREE.Vector3().crossVectors(side, tangent).normalize();

    // Smooth root blend -> sleek mid-body -> fine feathered anime tip at u=1
    const profile =
      u < 0.18
        ? 0.78 + Math.sin((u / 0.18) * (Math.PI * 0.5)) * 0.24
        : Math.pow(Math.max(0.018, 1 - (u - 0.18) / 0.82), 0.88) * 1.02;

    // Flat ribbon cross-section: wide tangentially, plush radially for lush overlapping hair locks
    const ribbonWidth = baseRadius * 1.42 * profile;
    const ribbonThick = baseRadius * 0.58 * profile;

    for (let j = 0; j <= radialSegs; j++) {
      const theta = (j / radialSegs) * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);

      // Subtle central strand ridge on the outer face (sin > 0) for crisp specular hair highlights
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

  // Subtle radial iris fibers for depth
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
 * with defined cheekbones, tapered V-jawline, and sculpted chin (never overly round/balloon-like).
 */
function createChibiHeadGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.41, 36, 28);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Sleek oval-vertical cranium proportion (not a wide ball)
    x *= 0.905;
    y *= 1.045;
    z *= 0.965;

    // Subtle temple narrowing above the brow ridge
    if (y > 0.08) {
      const templeT = Math.min(1, (y - 0.08) / 0.34);
      x *= 1 - templeT * 0.045;
    }

    // Defined cheekbone contour around y in [-0.08, 0.05]
    if (y > -0.10 && y < 0.06 && z > 0.02) {
      const cheekWeight = Math.sin(((y + 0.10) / 0.16) * Math.PI);
      x *= 1 + cheekWeight * 0.024;
      z *= 1 + cheekWeight * 0.028;
    }

    // Clean V-tapered jawline & sculpted chin below y = 0.02
    if (y < 0.02) {
      const jawT = Math.min(1, (0.02 - y) / 0.43);
      const jawCurve = jawT * 0.22 + jawT * jawT * 0.14;
      x *= 1 - jawCurve;
      // Slight forward chin projection on the front lower face for a crisp profile
      if (z > 0) {
        z *= 1 - jawT * 0.06 + Math.sin(jawT * Math.PI) * 0.035;
      } else {
        z *= 1 - jawT * 0.12;
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
  const palmGeo = new THREE.SphereGeometry(0.066, 18, 16);
  palmGeo.scale(0.94, 1.15, 0.68);
  const knuckleBridgeGeo = new THREE.CapsuleGeometry(0.021, 0.062, 8, 12);
  const fingerGeo = new THREE.CapsuleGeometry(0.015, 0.048, 8, 12);
  const thumbGeo = new THREE.CapsuleGeometry(0.018, 0.04, 8, 12);

  const handOpen = new THREE.Group();
  const palmO = new THREE.Mesh(palmGeo, skinMat);
  palmO.position.set(0, -0.042, 0);
  const bridgeO = new THREE.Mesh(knuckleBridgeGeo, skinMat);
  bridgeO.rotation.z = Math.PI * 0.5;
  bridgeO.position.set(0, -0.068, 0.004);
  handOpen.add(palmO, bridgeO);
  for (let f = 0; f < 4; f++) {
    const fm = new THREE.Mesh(fingerGeo, skinMat);
    const fx = (f - 1.5) * 0.023 * sideSign;
    const lenOffset = f === 1 || f === 2 ? -0.006 : 0;
    fm.position.set(fx, -0.088 + lenOffset, 0.01 + (1.5 - Math.abs(f - 1.5)) * 0.004);
    fm.rotation.z = (f - 1.5) * 0.055 * sideSign;
    fm.rotation.x = 0.22 + f * 0.04;
    handOpen.add(fm);
  }
  const thumbO = new THREE.Mesh(thumbGeo, skinMat);
  thumbO.position.set(-0.046 * sideSign, -0.044, 0.022);
  thumbO.rotation.z = -0.48 * sideSign;
  thumbO.rotation.x = 0.24;
  handOpen.add(thumbO);

  const handPoint = new THREE.Group();
  const palmP = new THREE.Mesh(palmGeo, skinMat);
  palmP.position.set(0, -0.042, 0);
  const bridgeP = new THREE.Mesh(knuckleBridgeGeo, skinMat);
  bridgeP.rotation.z = Math.PI * 0.5;
  bridgeP.position.set(0, -0.068, 0.006);
  handPoint.add(palmP, bridgeP);
  const indexP = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.066, 8, 12), skinMat);
  indexP.position.set(-0.021 * sideSign, -0.098, 0.012);
  indexP.rotation.x = 0.12;
  handPoint.add(indexP);
  for (let f = 1; f < 4; f++) {
    const curled = new THREE.Mesh(new THREE.SphereGeometry(0.021, 12, 10), skinMat);
    curled.position.set((f - 1.5) * 0.022 * sideSign, -0.07, 0.026);
    handPoint.add(curled);
  }
  const thumbP = new THREE.Mesh(thumbGeo, skinMat);
  thumbP.position.set(-0.042 * sideSign, -0.048, 0.026);
  thumbP.rotation.z = -0.32 * sideSign;
  handPoint.add(thumbP);

  const handFist = new THREE.Group();
  const palmF = new THREE.Mesh(new THREE.SphereGeometry(0.068, 18, 14), skinMat);
  palmF.scale.set(1.0, 0.96, 0.88);
  palmF.position.set(0, -0.046, 0);
  handFist.add(palmF);

  const handThumbs = new THREE.Group();
  const palmT = new THREE.Mesh(new THREE.SphereGeometry(0.068, 18, 14), skinMat);
  palmT.position.set(0, -0.044, 0);
  handThumbs.add(palmT);
  const thumbUp = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.062, 8, 12), skinMat);
  thumbUp.position.set(-0.044 * sideSign, 0.004, 0.022);
  thumbUp.rotation.z = 0.22 * sideSign;
  handThumbs.add(thumbUp);

  return { handOpen, handPoint, handFist, handThumbs };
}

function buildArm(
  sideSign: 1 | -1,
  sleeveMat: THREE.MeshStandardMaterial,
  skinMat: THREE.MeshStandardMaterial
): ArmRigNodes {
  const shoulder = new THREE.Group();
  // Sleek deltoid shoulder cap (tapered, never bulky/boxy)
  const shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.092, 16, 14), sleeveMat);
  shoulderCap.scale.set(0.94, 1.04, 0.94);
  shoulder.add(shoulderCap);

  // Tapered upper arm sleeve
  const upperGeo = new THREE.CylinderGeometry(0.082, 0.072, 0.25, 16);
  const upperMesh = new THREE.Mesh(upperGeo, sleeveMat);
  upperMesh.position.set(0, -0.135, 0);
  shoulder.add(upperMesh);

  const elbow = new THREE.Group();
  elbow.position.set(0, -0.265, 0);
  shoulder.add(elbow);

  // Seamless spherical elbow articulation joint so deep bends never crease or gap
  const elbowSphere = new THREE.Mesh(new THREE.SphereGeometry(0.072, 14, 12), sleeveMat);
  elbow.add(elbowSphere);

  // Anatomically tapered forearm
  const foreGeo = new THREE.CylinderGeometry(0.071, 0.058, 0.22, 16);
  const foreMesh = new THREE.Mesh(foreGeo, sleeveMat);
  foreMesh.position.set(0, -0.115, 0);
  elbow.add(foreMesh);

  const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.018, 10, 18), sleeveMat);
  cuff.rotation.x = Math.PI * 0.5;
  cuff.position.set(0, -0.222, 0);
  elbow.add(cuff);

  const wrist = new THREE.Group();
  wrist.position.set(0, -0.242, 0);
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

  // Almond-contoured warm sclera (wider horizontally with expressive vertical depth)
  const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.086, 22, 18), scleraMat);
  sclera.scale.set(1.16, 0.98, 0.44);
  openGroup.add(sclera);

  // Soulful enlarged espresso iris filling eye vertically for expressive Pixar/anime warmth
  const iris = new THREE.Mesh(new THREE.SphereGeometry(0.068, 20, 18), irisMat);
  iris.scale.set(0.96, 1.02, 0.42);
  iris.position.set(0, -0.002, 0.026);
  openGroup.add(iris);

  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.037, 16, 14), pupilMat);
  pupil.scale.set(0.96, 1.02, 0.36);
  pupil.position.set(0, 0, 0.044);
  iris.add(pupil);

  // Primary soft anime studio catchlight + tiny lower-right rim reflection
  const spec1 = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 10), catchlightMat);
  spec1.position.set(-0.022, 0.022, 0.056);
  iris.add(spec1);

  const spec2 = new THREE.Mesh(new THREE.SphereGeometry(0.0085, 8, 8), catchlightMat);
  spec2.position.set(0.02, -0.019, 0.055);
  iris.add(spec2);

  // Sculpted upper eyelid & lash liner hugging the almond eye contour cleanly
  const lash = new THREE.Mesh(
    new THREE.TorusGeometry(0.091, 0.017, 10, 24, Math.PI * 0.88),
    lashMat
  );
  lash.scale.set(1.16, 0.98, 0.46);
  lash.position.set(0, 0.008, 0.034);
  lash.rotation.z = Math.PI * 0.06;
  openGroup.add(lash);

  // Subtle soft lower eye contour crease
  const lowerCrease = new THREE.Mesh(
    new THREE.TorusGeometry(0.084, 0.0048, 8, 18, Math.PI * 0.54),
    lashMat
  );
  lowerCrease.scale.set(1.12, 0.86, 0.38);
  lowerCrease.position.set(0, -0.006, 0.029);
  lowerCrease.rotation.z = -Math.PI * 0.77;
  openGroup.add(lowerCrease);

  const upperLid = new THREE.Mesh(
    new THREE.SphereGeometry(0.087, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
    skinMat
  );
  upperLid.scale.set(1.16, 0.96, 0.46);
  upperLid.rotation.x = -Math.PI * 0.68;
  upperLid.visible = false;
  openGroup.add(upperLid);

  const happyArc = new THREE.Mesh(
    new THREE.TorusGeometry(0.068, 0.017, 10, 22, Math.PI * 0.85),
    lashMat
  );
  happyArc.position.set(0, -0.012, 0.048);
  happyArc.rotation.z = Math.PI * 0.075;
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

    // Modular Soft Matte-Satin Materials (warm collectible toy finish without plastic glare)
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

    // Character Root Hierarchy (feet sit at y = 0)
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

    // Animated Tail Rig (for Fox / Wolf / Cat / Bunny / Panda / Bear)
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

    // Torso
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 0.04, 0);
    pelvisGroup.add(torsoGroup);

    const torsoMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.258, 0.31, 16, 28), hoodieMat);
    torsoMesh.scale.set(1.08, 1.0, 0.9);
    torsoMesh.position.set(0, 0.25, 0);
    torsoGroup.add(torsoMesh);

    // Sculpted anatomical shoulder yoke so arms & collar blend seamlessly into the chest
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

    // Contoured rounded kangaroo pouch (replaces flat rectangular box brick)
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

    // Sculpted Open Jacket / Blazer Lapels (curved capsules hugging the chest instead of flat boxes)
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

    // Optional Tie
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

    // Chest Winged Flame-Orb Mascot Emblem
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

    // Cyber-Fox Outfit Accents (Sculpted curved panels instead of blocky boxes)
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

    // Robot Glowing Chest Core
    const robotChestCore = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.018, 10, 24), accentMat);
    robotChestCore.position.set(0, 0.33, 0.22);
    robotChestCore.visible = false;
    torsoGroup.add(robotChestCore);

    // Arms
    const leftArm = buildArm(-1, hoodieMat, skinMat);
    leftArm.shoulder.position.set(-0.265, 0.44, 0);
    torsoGroup.add(leftArm.shoulder);

    const rightArm = buildArm(1, hoodieMat, skinMat);
    rightArm.shoulder.position.set(0.265, 0.44, 0);
    torsoGroup.add(rightArm.shoulder);

    // Neck + Head with seamless anatomical trapezius/collarbone base
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

    // Ears Variants (seated flush against the sculpted oval head contour)
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

    // Dedicated Cyber-Fox 3-Layer Pointed Ears + Yellow Lightning Hair Ribbons
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

    // Panda Eye Patches
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

    // Cheek Blush
    for (const sx of [-1, 1]) {
      const blush = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 10), blushMat);
      blush.scale.set(1.25, 0.65, 0.35);
      blush.position.set(sx * 0.21, -0.105, 0.345);
      headGroup.add(blush);
    }

    // Button Nose (human/elf/alien)
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 10), skinMat);
    nose.scale.set(1.15, 0.85, 0.95);
    nose.position.set(0, -0.068, 0.405);
    headGroup.add(nose);

    // Animal Snout/Muzzle Group (Fox / Wolf / Cat / Bear / Panda)
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

    // Owl Beak Group
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

    // Robot Head Extras (Antenna + Ear Bolts)
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

    // Eyebrows (expressive contoured brows seated flush against the brow ridge)
    const browGeo = new THREE.CapsuleGeometry(0.016, 0.076, 8, 12);
    const leftBrow = new THREE.Mesh(browGeo, browMat);
    leftBrow.rotation.set(0, -0.14, Math.PI * 0.47);
    leftBrow.position.set(-0.144, 0.136, 0.388);
    headGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeo, browMat);
    rightBrow.rotation.set(0, 0.14, -Math.PI * 0.47);
    rightBrow.position.set(0.144, 0.136, 0.388);
    headGroup.add(rightBrow);

    // Eyes (cleanly seated flush on front facial plane so sclera & lashes never clip cheek skin)
    const leftEye = buildEye(scleraMat, irisMat, pupilMat, catchlightMat, lashMat, skinMat);
    leftEye.openGroup.parent!.position.set(-0.144, 0.004, 0.376);
    leftEye.openGroup.parent!.rotation.y = -0.08;
    headGroup.add(leftEye.openGroup.parent!);

    const rightEye = buildEye(scleraMat, irisMat, pupilMat, catchlightMat, lashMat, skinMat);
    rightEye.openGroup.parent!.position.set(0.144, 0.004, 0.376);
    rightEye.openGroup.parent!.rotation.y = 0.08;
    headGroup.add(rightEye.openGroup.parent!);

    // Mouth Smile & Compact Lip-Sync Open Group
    const mouthSmile = new THREE.Mesh(
      new THREE.TorusGeometry(0.035, 0.0078, 10, 18, Math.PI * 0.56),
      browMat
    );
    mouthSmile.position.set(0, -0.155, 0.386);
    mouthSmile.rotation.z = Math.PI * 1.22;
    headGroup.add(mouthSmile);

    const mouthOpenGroup = new THREE.Group();
    mouthOpenGroup.position.set(0, -0.16, 0.381);
    const cavity = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 18, 16),
      new THREE.MeshBasicMaterial({ color: 0x5c191b })
    );
    cavity.scale.set(1.02, 0.74, 0.36);
    mouthOpenGroup.add(cavity);
    const teeth = new THREE.Mesh(
      new THREE.BoxGeometry(0.034, 0.009, 0.01),
      shoeWhiteMat
    );
    teeth.position.set(0, 0.012, 0.011);
    mouthOpenGroup.add(teeth);
    const tongue = new THREE.Mesh(
      new THREE.SphereGeometry(0.021, 14, 12),
      new THREE.MeshStandardMaterial({ color: 0xe67680, roughness: 0.48 })
    );
    tongue.scale.set(0.95, 0.45, 0.48);
    tongue.position.set(0, -0.013, 0.011);
    mouthOpenGroup.add(tongue);
    mouthOpenGroup.visible = false;
    headGroup.add(mouthOpenGroup);

    // Hair Style Variants (All Smooth Spline Sculpted & Full Dome Coverage!)
    const hairGroup = new THREE.Group();
    headGroup.add(hairGroup);

    const buildBaseHairCap = (target: THREE.Group, mat: THREE.MeshStandardMaterial) => {
      // Sleek contoured cranial hair cap tailored to the oval-tapered skull (never a bulbous helmet)
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.422, 36, 26, 0, Math.PI * 2, 0, Math.PI * 0.54),
        mat
      );
      cap.scale.set(0.95, 1.06, 1.01);
      cap.rotation.x = -0.10;
      cap.position.set(0, 0.06, -0.012);
      target.add(cap);

      const back = new THREE.Mesh(new THREE.SphereGeometry(0.414, 28, 22), mat);
      back.scale.set(0.94, 1.03, 0.97);
      back.position.set(0, 0.032, -0.068);
      target.add(back);

      // Tapered sideburn locks framing the upper temples in front of the ears
      for (const sx of [-1, 1]) {
        const templeLock = createSculptedRibbonLockGeometry(0.066, [
          [sx * 0.31, 0.22, 0.14],
          [sx * 0.365, 0.08, 0.11],
          [sx * 0.355, -0.06, 0.07],
        ]);
        target.add(new THREE.Mesh(templeLock, mat));
      }
    };

    // 1) Modern Side-Part Swept Creator Hair ('spiky') — layered flat-ribbon locks with dynamic crown flow
    const spikyGroup = new THREE.Group();
    buildBaseHairCap(spikyGroup, hairMat);
    const spikyLocks: Array<{ r: number; pts: [number, number, number][]; hi?: boolean }> = [
      // Swept asymmetric crown volume locks (parted on left, sweeping up and right)
      { r: 0.096, pts: [[-0.14, 0.39, 0.16], [0.02, 0.50, 0.15], [0.20, 0.49, 0.06], [0.34, 0.38, -0.05]], hi: true },
      { r: 0.092, pts: [[-0.08, 0.41, 0.04], [0.10, 0.52, 0.02], [0.27, 0.48, -0.08], [0.37, 0.34, -0.16]], hi: true },
      { r: 0.086, pts: [[-0.12, 0.39, 0.10], [-0.24, 0.45, 0.04], [-0.34, 0.35, -0.06], [-0.37, 0.20, -0.12]] },
      // Layered side-parted curtain fringe framing the forehead & brow ridge cleanly
      { r: 0.078, pts: [[-0.10, 0.40, 0.22], [0.05, 0.36, 0.36], [0.21, 0.27, 0.35], [0.33, 0.14, 0.24]], hi: true },
      { r: 0.072, pts: [[-0.12, 0.39, 0.22], [-0.23, 0.32, 0.33], [-0.33, 0.20, 0.28], [-0.36, 0.07, 0.18]], hi: true },
      { r: 0.058, pts: [[-0.04, 0.39, 0.26], [0.03, 0.31, 0.38], [0.09, 0.21, 0.37]] },
      { r: 0.054, pts: [[-0.11, 0.38, 0.25], [-0.16, 0.29, 0.36], [-0.20, 0.20, 0.34]] },
      // Feathered temple & cheek-framing locks
      { r: 0.068, pts: [[-0.29, 0.27, 0.14], [-0.37, 0.12, 0.16], [-0.35, -0.05, 0.11]] },
      { r: 0.068, pts: [[0.29, 0.27, 0.14], [0.37, 0.12, 0.16], [0.35, -0.05, 0.11]] },
      // Back & nape layered taper locks
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

    // 2) Short Layered Quiff ('short') — clean executive/editorial textured crop
    const shortGroup = new THREE.Group();
    buildBaseHairCap(shortGroup, hairMat);
    const shortLocks: Array<{ r: number; pts: [number, number, number][]; hi?: boolean }> = [
      { r: 0.088, pts: [[-0.12, 0.40, 0.20], [0.04, 0.48, 0.26], [0.20, 0.42, 0.21]], hi: true },
      { r: 0.082, pts: [[-0.06, 0.42, 0.08], [0.10, 0.49, 0.12], [0.25, 0.41, 0.06]], hi: true },
      { r: 0.064, pts: [[-0.04, 0.39, 0.26], [-0.09, 0.30, 0.37], [-0.06, 0.22, 0.36]], hi: true },
      { r: 0.064, pts: [[0.06, 0.39, 0.25], [0.14, 0.29, 0.36], [0.18, 0.21, 0.35]] },
      { r: 0.072, pts: [[-0.22, 0.35, 0.18], [-0.32, 0.21, 0.27], [-0.34, 0.08, 0.22]] },
      { r: 0.072, pts: [[0.22, 0.34, 0.17], [0.33, 0.20, 0.26], [0.35, 0.07, 0.21]] },
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

    // 3) Long Flowing Layered Hair ('long')
    const longGroup = new THREE.Group();
    buildBaseHairCap(longGroup, hairMat);
    const backCascade = new THREE.Mesh(new THREE.CapsuleGeometry(0.33, 0.44, 10, 18), hairMat);
    backCascade.scale.set(1.06, 1.0, 0.54);
    backCascade.position.set(0, -0.18, -0.21);
    longGroup.add(backCascade);
    for (const sx of [-1, 1]) {
      const sideLock = createSculptedRibbonLockGeometry(0.086, [
        [sx * 0.23, 0.32, 0.19],
        [sx * 0.36, 0.06, 0.18],
        [sx * 0.36, -0.22, 0.12],
        [sx * 0.30, -0.44, 0.06],
      ]);
      longGroup.add(new THREE.Mesh(sideLock, hairMat));
      const bangLock = createSculptedRibbonLockGeometry(0.068, [
        [sx * 0.02, 0.38, 0.24],
        [sx * 0.14, 0.29, 0.35],
        [sx * 0.27, 0.19, 0.31],
      ]);
      longGroup.add(new THREE.Mesh(bangLock, hairHighlightMat));
    }
    longGroup.visible = false;
    hairGroup.add(longGroup);

    // 4) Bun Hair ('bun')
    const bunGroup = new THREE.Group();
    buildBaseHairCap(bunGroup, hairMat);
    for (const sx of [-1, 1]) {
      const bunBang = createSculptedRibbonLockGeometry(0.068, [
        [sx * 0.02, 0.38, 0.24],
        [sx * 0.15, 0.29, 0.34],
        [sx * 0.28, 0.19, 0.30],
      ]);
      bunGroup.add(new THREE.Mesh(bunBang, hairMat));
    }
    const bunBall = new THREE.Mesh(new THREE.SphereGeometry(0.165, 18, 16), hairHighlightMat);
    bunBall.position.set(0, 0.39, -0.31);
    bunGroup.add(bunBall);
    bunGroup.visible = false;
    hairGroup.add(bunGroup);

    // 5) Hijab Group
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

    // 6) Khimar Group
    const khimarGroup = new THREE.Group();
    const khimarDome = hijabDome.clone();
    khimarGroup.add(khimarDome);
    const khimarCloak = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.78, 20), hijabMat);
    khimarCloak.scale.set(1.0, 1, 0.78);
    khimarCloak.position.set(0, -0.54, -0.02);
    khimarGroup.add(khimarCloak);
    khimarGroup.visible = false;
    hairGroup.add(khimarGroup);

    // Optional Niqab Veil
    const niqabVeil = new THREE.Mesh(
      new THREE.SphereGeometry(0.39, 18, 14, 0, Math.PI, Math.PI * 0.48, Math.PI * 0.44),
      hijabMat
    );
    niqabVeil.rotation.y = -Math.PI * 0.5;
    niqabVeil.scale.set(0.92, 1.05, 1.04);
    niqabVeil.position.set(0, -0.03, 0.065);
    niqabVeil.visible = false;
    headGroup.add(niqabVeil);

    // Optional Peci Cap
    const peciGroup = new THREE.Group();
    const peciMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.375, 0.23, 24), peciMat);
    peciMesh.scale.set(0.96, 1, 1.04);
    peciMesh.position.set(0, 0.35, -0.02);
    peciGroup.add(peciMesh);
    peciGroup.visible = false;
    headGroup.add(peciGroup);

    // Optional 3D Glasses (Round & Square)
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

    // Optional 3D Gaming Headphones (cushioned earpads + sleek band arched cleanly above crown hair)
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

    // Floating Winged 3D Mascot Orb Scene
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
  // Natural 3-axis shoulder articulation with clavicular roll
  arm.shoulder.rotation.set(
    -angles.pitch,
    sideSign * angles.twist,
    sideSign * -angles.abduct
  );
  // Multi-axis elbow: primary flexion (-angles.elbow) + natural anatomical inward carrying angle & forearm pronation
  const inwardCarry = sideSign * (0.14 + Math.min(0.65, angles.elbow * 0.24));
  const forearmPronation = sideSign * (angles.twist * 0.42);
  arm.elbow.rotation.set(-angles.elbow, forearmPronation, inwardCarry);

  // Multi-axis wrist: flexion/extension + supination + ulnar/radial follow-through
  const wristSupination = sideSign * (angles.twist * 0.28);
  const wristDeviation = sideSign * (angles.wrist * 0.36 - angles.abduct * 0.14);
  arm.wrist.rotation.set(angles.wrist, wristSupination, wristDeviation);

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

    // Hair styles
    const isCovered = hairStyle === 'hijab' || hairStyle === 'khimar';
    studio.hairStyleGroups.spiky.visible = hairStyle === 'spiky';
    studio.hairStyleGroups.short.visible = hairStyle === 'short';
    studio.hairStyleGroups.long.visible = hairStyle === 'long';
    studio.hairStyleGroups.bun.visible = hairStyle === 'bun';
    studio.hairStyleGroups.hijab.visible = hairStyle === 'hijab';
    studio.hairStyleGroups.khimar.visible = hairStyle === 'khimar';
    studio.niqabVeil.visible = Boolean(opts.niqab);
    studio.peciGroup.visible = Boolean(opts.peciColor) && !isCovered;

    // Species Ears / Facial Props / Tails
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

    // Tails
    const showFoxTail = species === 'fox' || species === 'wolf';
    const showCatTail = species === 'cat';
    const showBunnyTail = species === 'bunny' || species === 'bear' || species === 'panda';
    studio.tailGroup.visible = showFoxTail || showCatTail || showBunnyTail;
    studio.foxTailGroup.visible = showFoxTail;
    studio.catTailGroup.visible = showCatTail;
    studio.bunnyTailGroup.visible = showBunnyTail;

    // Glasses & Headphones
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

  // Root facing + organic weight shift & volume-preserving squash/stretch
  const stretch = Math.max(-0.08, Math.min(0.08, k.bodySquash ?? 0));
  studio.rootGroup.scale.set(1 - stretch * 0.38, 1 + stretch, 1 - stretch * 0.38);
  studio.rootGroup.rotation.set(0, facing * 0.09, 0);
  studio.pelvisGroup.position.set(facing * k.hipShiftX, 0.49 - k.hipDropY, 0);

  // Torso breathing, twist, lean
  studio.torsoGroup.rotation.set(k.torsoLean, facing * k.torsoTwist, facing * k.torsoSide);
  studio.torsoGroup.position.set(0, 0.04 + k.breathOffset, 0);

  // Neck & Head orientation + hair secondary bounce
  studio.headGroup.rotation.set(k.headPitch, facing * k.headYaw, facing * k.headRoll);
  studio.hairGroup.rotation.set(k.hairBounce, 0, -k.headRoll * 0.24);

  // Legs
  studio.leftLeg.hip.rotation.set(k.leftLeg.hipPitch, 0, -k.leftLeg.hipOut);
  studio.leftLeg.knee.rotation.set(k.leftLeg.knee, 0, 0);
  studio.rightLeg.hip.rotation.set(k.rightLeg.hipPitch, 0, k.rightLeg.hipOut);
  studio.rightLeg.knee.rotation.set(k.rightLeg.knee, 0, 0);

  // Arms
  applyArmPose(studio.leftArm, k.leftArm, -1);
  applyArmPose(studio.rightArm, k.rightArm, 1);

  // Facial Expressions + dynamic asymmetric brows
  const browY = 0.136 + k.browLift * 0.48;
  const tilt = k.browTilt ?? 0;
  studio.leftBrow.position.y = browY + tilt * 0.016;
  studio.rightBrow.position.y = browY - tilt * 0.012;
  studio.leftBrow.rotation.z = tilt * 0.48;
  studio.rightBrow.rotation.z = -tilt * 0.38;
  const eyeMode = opts.eyeModeOverride || k.eyeMode;
  const showHappy = eyeMode === 'happy_arc' && k.blinkAmount < 0.55;
  const isWideShock = eyeMode === 'wide_shock';
  const isTiredHalf = eyeMode === 'tired_half';
  const isFocus = eyeMode === 'focus';

  for (const eye of [studio.leftEye, studio.rightEye]) {
    eye.openGroup.visible = !showHappy;
    eye.happyArc.visible = showHappy;
    if (!showHappy) {
      const eyeScaleX = isWideShock ? 1.15 : 1.0;
      const eyeScaleY = isWideShock ? 1.24 : 1.0;
      eye.openGroup.scale.set(eyeScaleX, eyeScaleY, 1);
      const irisScale = isWideShock ? 0.78 : 1.0;
      eye.iris.scale.set(irisScale, irisScale, 1);
      eye.iris.position.set(k.gazeX * 0.32, -0.002 + k.gazeY * 0.32, 0.026);
      const lidBase = isTiredHalf ? 0.54 : isFocus ? 0.28 : 0;
      const effectiveBlink = Math.max(lidBase, k.blinkAmount);
      eye.upperLid.visible = effectiveBlink > 0.05;
      eye.upperLid.rotation.x = -Math.PI * 0.68 + effectiveBlink * Math.PI * 0.64;
    }
  }

  const hideMouth = Boolean(opts.niqab);
  const speakingMouth = !hideMouth && k.mouthOpen > 0.07;
  studio.mouthSmile.visible = !hideMouth && !speakingMouth && !studio.snoutGroup.visible;
  studio.mouthOpenGroup.visible = speakingMouth;
  if (speakingMouth) {
    let widthScale = Math.min(1.05, 0.72 + k.mouthWide * 0.24);
    let openScale = Math.min(0.96, 0.28 + k.mouthOpen * 0.72);
    if (k.vowelShape === 'O') {
      widthScale = Math.min(0.76, 0.48 + k.mouthWide * 0.18);
      openScale = Math.min(0.95, 0.48 + k.mouthOpen * 0.52);
    } else if (k.vowelShape === 'U') {
      widthScale = Math.min(0.64, 0.42 + k.mouthWide * 0.16);
      openScale = Math.min(0.78, 0.36 + k.mouthOpen * 0.44);
    } else if (k.vowelShape === 'E' || k.vowelShape === 'I') {
      widthScale = Math.min(1.06, 0.82 + k.mouthWide * 0.18);
      openScale = Math.min(0.72, 0.28 + k.mouthOpen * 0.46);
    } else if (k.vowelShape === 'A') {
      widthScale = Math.min(1.02, 0.76 + k.mouthWide * 0.2);
      openScale = Math.min(0.98, 0.46 + k.mouthOpen * 0.56);
    } else if (k.vowelShape === 'M') {
      widthScale = 0.84;
      openScale = 0.18;
    }
    studio.mouthOpenGroup.scale.set(widthScale, openScale, 1);
    studio.mouthOpenGroup.position.z = studio.snoutGroup.visible ? 0.435 : 0.381;
    studio.mouthOpenGroup.position.y = (studio.snoutGroup.visible ? -0.152 : -0.158) - k.mouthOpen * 0.014;
  } else {
    // Support worried/sad frown (negative mouthSmile), neutral mouth, or warm smile
    if (k.mouthSmile < -0.15) {
      studio.mouthSmile.rotation.z = Math.PI;
      studio.mouthSmile.position.y = -0.178;
      studio.mouthSmile.scale.set(0.88, 0.78, 1);
    } else if (k.mouthSmile < 0.2) {
      studio.mouthSmile.rotation.z = 0;
      studio.mouthSmile.position.y = -0.158;
      studio.mouthSmile.scale.set(0.76, 0.35, 1);
    } else {
      studio.mouthSmile.rotation.z = 0;
      studio.mouthSmile.position.y = -0.15;
      studio.mouthSmile.scale.set(1 + k.mouthSmile * 0.12, 1 + k.mouthSmile * 0.08, 1);
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

  // Quantize time to 60fps buckets so redundant multi-pass draws in the same frame reuse the WebGL buffer
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

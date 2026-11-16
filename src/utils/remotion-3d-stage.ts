import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SatsetProject } from '../types/satset';
import { getSatsetMediaAsset } from './satset-cloud-engine';
import {
  detectMentionedPlatforms,
  disposePlatformLogoTextures,
  drawPlatformLogoCanvas,
  getPlatformLogoThreeTexture,
  PlatformLogoId,
} from './platform-logos';
import {
  evaluate3DStageFrame,
  StageAspectRatio,
  StageMotifKind,
  StageThemeKind,
  Stage3DFrameState,
} from './remotion-3d-kinematics';

function detectSoftwareWebGL(): boolean {
  if (typeof document === 'undefined') return true;
  try {
    const c = document.createElement('canvas');
    const gl =
      (c.getContext('webgl2') as WebGL2RenderingContext | null) ||
      (c.getContext('webgl') as WebGLRenderingContext | null);
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) {
      const rendererStr = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '');
      if (/SwiftShader|llvmpipe|Software|Mesa|Microsoft Basic/i.test(rendererStr)) {
        return true;
      }
    }
    return false;
  } catch {
    return true;
  }
}

function createFloorTexture(kind: StageThemeKind): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;

  if (kind === 'studio_room') {
    // Warm herringbone parquet wood floor texture
    ctx.fillStyle = '#8b623f';
    ctx.fillRect(0, 0, 512, 512);
    const cols = 8;
    const rows = 8;
    const pw = 512 / cols;
    const ph = 512 / rows;
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        ctx.fillStyle = (r + col) % 2 === 0 ? 'rgba(176,128,82,0.45)' : 'rgba(68,42,22,0.34)';
        ctx.fillRect(col * pw + 1, r * ph + 1, pw - 2, ph - 2);
      }
    }
  } else if (kind === 'blueprint_cad') {
    ctx.fillStyle = '#0b2447';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.14)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 512; x += 32) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(512, x); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.34)';
    ctx.lineWidth = 2;
    for (let x = 0; x <= 512; x += 128) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(512, x); ctx.stroke();
    }
  } else if (kind === 'mechanism_gears') {
    ctx.fillStyle = '#182234';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.lineWidth = 2;
    for (let x = 0; x <= 512; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(512, x); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.26)';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(256, 256, 170, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(256, 256, 110, 0, Math.PI * 2); ctx.stroke();
  } else if (kind === 'cinema_noir') {
    ctx.fillStyle = '#141417';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.16)';
    ctx.lineWidth = 2;
    for (let x = 0; x <= 512; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(512, x); ctx.stroke();
    }
  } else if (kind === 'chalkboard_class') {
    ctx.fillStyle = '#143326';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = 'rgba(236, 253, 245, 0.16)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x <= 512; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(512, x); ctx.stroke();
    }
  } else if (kind === 'minimal_zen') {
    ctx.fillStyle = '#f4f1ea';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(256, 256, 180, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(256, 256, 95, 0, Math.PI * 2); ctx.stroke();
  } else if (kind === 'ui_browser_lab') {
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = 'rgba(99, 102, 241, 0.36)';
    for (let x = 32; x < 512; x += 48) {
      for (let y = 32; y < 512; y += 48) {
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else if (kind === 'diorama_data') {
    ctx.fillStyle = '#f5f0e6';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.16)';
    ctx.lineWidth = 2;
    for (let x = 0; x <= 512; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(512, x); ctx.stroke();
    }
  } else if (kind === 'light_grid') {
    ctx.fillStyle = '#edf5ff';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = 'rgba(37, 99, 235, 0.22)';
    ctx.lineWidth = 2;
    const step = 64;
    for (let x = 0; x <= 512; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
    }
    for (let y = 0; y <= 512; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(37, 99, 235, 0.35)';
    for (let x = 0; x <= 512; x += step) {
      for (let y = 0; y <= 512; y += step) {
        ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else {
    // Dark cyber electric-blue architectural grid
    ctx.fillStyle = '#030e27';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.24)';
    ctx.lineWidth = 2;
    const step = 64;
    for (let x = 0; x <= 512; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
    }
    for (let y = 0; y <= 512; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(56, 189, 248, 0.55)';
    for (let x = 0; x <= 512; x += step) {
      for (let y = 0; y <= 512; y += step) {
        ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(7, 7);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function drawShowcaseScreenCanvas(
  c: HTMLCanvasElement,
  state: Stage3DFrameState,
  brandHex: string
): void {
  const ctx = c.getContext('2d');
  if (!ctx) return;
  const W = c.width;
  const H = c.height;
  ctx.clearRect(0, 0, W, H);

  const isDarkTheme =
    state.theme !== 'light_grid' &&
    state.theme !== 'minimal_zen' &&
    state.theme !== 'diorama_data';
  const bg = isDarkTheme ? '#07132e' : '#ffffff';
  const fg = isDarkTheme ? '#f8fafc' : '#0f172a';
  const sub = isDarkTheme ? '#94a3b8' : '#475569';
  const borderCol = state.theme === 'studio_room' ? '#ff471a' : brandHex || '#00a8ff';

  // Background card
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 26);
  ctx.fill();

  // Top browser chrome bar
  ctx.fillStyle = isDarkTheme ? '#0f1d3e' : '#e2e8f0';
  ctx.fillRect(0, 0, W, 52);
  const dotColors = ['#ef4444', '#f59e0b', '#10b981'];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = dotColors[i];
    ctx.beginPath();
    ctx.arc(28 + i * 22, 26, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.font = '700 18px "JetBrains Mono", monospace';
  ctx.fillStyle = isDarkTheme ? '#7dd3fc' : '#1d4ed8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const domainLabel = state.scene?.website_step?.urlDisplay || 'studio.graphmotion.id';
  ctx.fillText(String(domainLabel).slice(0, 32), W * 0.54, 27);

  // Check if scene has real website screenshot / uploaded image
  const mediaKey = state.scene?.media_key || (state.scene?.website_step ? `web_step_${state.sceneIndex + 1}` : '');
  const asset = mediaKey ? getSatsetMediaAsset(mediaKey) : null;
  if (asset && (asset instanceof HTMLCanvasElement || asset instanceof HTMLImageElement)) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(22, 68, W - 44, H - 140, 14);
    ctx.clip();
    ctx.drawImage(asset as any, 22, 68, W - 44, H - 140);
    ctx.restore();

    ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = fg;
    ctx.textAlign = 'left';
    ctx.fillText(state.headline, 24, H - 36, W - 160);

    ctx.fillStyle = borderCol;
    ctx.beginPath();
    ctx.roundRect(W - 140, H - 54, 116, 36, 18);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 16px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.statVal, W - 82, H - 36);
    return;
  }

  // Stylized Vector Editorial Content inside the 3D Slab
  const [k1, k2, k3, k4] = state.beats || [1, 1, 1, 1];
  const badgeScale = Math.max(0.1, Math.min(1.06, k1));
  ctx.save();
  ctx.translate(95, 89);
  ctx.scale(badgeScale, badgeScale);
  ctx.fillStyle = borderCol;
  ctx.beginPath();
  ctx.roundRect(-67, -17, 134, 34, 17);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 15px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(state.badge, 0, 1);
  ctx.restore();

  // Animated Live Metric Pill on Top-Right
  const numMatch = state.statVal.match(/([+-]?)(\d+)(%?)/);
  const animatedStatVal =
    numMatch && !state.isCta
      ? `${numMatch[1]}${Math.round(Number(numMatch[2]) * Math.min(1, 0.25 + state.sceneProgress * 0.85))}${numMatch[3]}`
      : state.statVal;

  ctx.fillStyle = isDarkTheme ? 'rgba(16,185,129,0.22)' : 'rgba(16,185,129,0.14)';
  ctx.beginPath();
  ctx.roundRect(W - 160, 72, 132, 34, 17);
  ctx.fill();
  ctx.fillStyle = '#10b981';
  ctx.font = '800 15px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(state.isCta ? (state.isFollowed ? 'FOLLOWING ✓' : 'FOLLOW +') : animatedStatVal, W - 94, 90);

  // Main Headline with subtle entrance slide
  const headSlideX = (1 - Math.min(1, k1)) * -24;
  ctx.fillStyle = fg;
  ctx.font = '900 32px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(state.headline, 28 + headSlideX, 146, W - 56);

  // Inner motif graphic block
  if (state.isCta) {
    ctx.fillStyle = isDarkTheme ? '#0f1f44' : '#f1f5f9';
    ctx.beginPath();
    ctx.roundRect(28, 176, W - 56, 150, 18);
    ctx.fill();
    ctx.fillStyle = '#ff471a';
    ctx.beginPath();
    ctx.arc(92, 251, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 26px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('3D', 92, 253);

    ctx.textAlign = 'left';
    ctx.fillStyle = fg;
    ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('@kreator.studio', 150, 232);
    ctx.fillStyle = sub;
    ctx.font = '600 17px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Motion 3D & Remotion Automation', 150, 268);

    const btnScale = state.followScale || 1;
    ctx.save();
    ctx.translate(W - 118, 250);
    ctx.scale(btnScale, btnScale);
    ctx.fillStyle = state.isFollowed ? '#10b981' : '#ef4444';
    ctx.beginPath();
    ctx.roundRect(-70, -26, 140, 52, 26);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.isFollowed ? 'Following ✓' : 'Follow +', 0, 1);
    ctx.restore();
  } else {
    // 3 spring-choreographed interactive cards inside the 3D slab
    const cardSprings = [k1, Math.max(0.18, k2), Math.max(0.12, k3)];
    const activeBeatIdx = k3 > 0.45 ? 2 : k2 > 0.45 ? 1 : 0;
    for (let i = 0; i < 3; i++) {
      const y = 176 + i * 54;
      const ck = cardSprings[i];
      const active = state.sceneProgress >= i * 0.24;
      const isFocused = i === activeBeatIdx;
      const slideX = (1 - Math.min(1, ck)) * 42;
      const alpha = Math.max(0.28, Math.min(1, ck));

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(slideX, 0);

      ctx.fillStyle = isFocused
        ? isDarkTheme
          ? 'rgba(0, 168, 255, 0.26)'
          : 'rgba(37, 99, 235, 0.14)'
        : active
        ? isDarkTheme
          ? 'rgba(0, 168, 255, 0.14)'
          : 'rgba(37, 99, 235, 0.07)'
        : isDarkTheme
        ? 'rgba(255,255,255,0.05)'
        : '#f8fafc';
      ctx.strokeStyle = isFocused
        ? '#38bdf8'
        : active
        ? borderCol
        : isDarkTheme
        ? 'rgba(255,255,255,0.12)'
        : '#cbd5e1';
      ctx.lineWidth = isFocused ? 2.8 : 2;
      ctx.beginPath();
      ctx.roundRect(28, y, W - 56, 44, 12);
      ctx.fill();
      ctx.stroke();

      // Active left accent bar
      if (active) {
        ctx.fillStyle = isFocused ? '#38bdf8' : '#10b981';
        ctx.beginPath();
        ctx.roundRect(28, y + 6, 5, 32, 3);
        ctx.fill();
      }

      ctx.fillStyle = active ? '#10b981' : sub;
      ctx.beginPath();
      ctx.arc(54, y + 22, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(active ? '✓' : String(i + 1), 54, y + 23);

      ctx.fillStyle = fg;
      ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`0${i + 1} · ${state.cards[i]}`, 78, y + 23, W - 140);
      ctx.restore();
    }
  }

  // Smooth live progress rail along bottom of 3D monitor
  const barY = H - 22;
  ctx.fillStyle = isDarkTheme ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.08)';
  ctx.beginPath();
  ctx.roundRect(28, barY, W - 56, 8, 4);
  ctx.fill();

  const fillW = Math.max(16, (W - 56) * Math.min(1, Math.max(0.05, state.sceneProgress)));
  ctx.fillStyle = borderCol;
  ctx.beginPath();
  ctx.roundRect(28, barY, fillW, 8, 4);
  ctx.fill();

  if (state.platforms && state.platforms.length > 0) {
    const platCount = Math.min(3, state.platforms.length);
    for (let p = 0; p < platCount; p++) {
      const pid = state.platforms[p] as PlatformLogoId;
      drawPlatformLogoCanvas(ctx, pid, W - 52 - (platCount - 1 - p) * 44, 138, 34, {
        withBadge: true,
        withLabel: false,
      });
    }
  }
}

interface PedestalUnit {
  group: THREE.Group;
  shaft: THREE.Mesh;
  ring: THREE.Mesh;
  cap: THREE.Mesh;
  propAnchor: THREE.Group;
}

interface CharacterRigRefs {
  root: THREE.Group;
  pelvis: THREE.Group;
  torso: THREE.Group;
  headGroup: THREE.Group;
  hairGroup: THREE.Group;
  leftEye: THREE.Object3D;
  rightEye: THREE.Object3D;
  leftPupil: THREE.Object3D;
  rightPupil: THREE.Object3D;
  happyArcL: THREE.Mesh;
  happyArcR: THREE.Mesh;
  mouth: THREE.Mesh;
  mouthSmile: THREE.Mesh;
  headphones: THREE.Group;
  leftShoulder: THREE.Group;
  leftForearm: THREE.Group;
  rightShoulder: THREE.Group;
  rightForearm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  torsoEmblem: THREE.Object3D;
  foxEarsGroup: THREE.Group;
  foxHairGoldGroup: THREE.Group;
  foxFaceGroup: THREE.Group;
  foxChestGroup: THREE.Group;
  foxHipGroup: THREE.Group;
  foxTailGroup: THREE.Group;
  browL: THREE.Mesh;
  browR: THREE.Mesh;
  hoodieMat: THREE.MeshStandardMaterial;
  skinMat: THREE.MeshStandardMaterial;
  hairMat: THREE.MeshStandardMaterial;
  irisMat: THREE.MeshBasicMaterial;
  shoeMat: THREE.MeshStandardMaterial;
  mouthMat: THREE.MeshBasicMaterial;
}

export class Remotion3DStageEngine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private pmremGenerator: THREE.PMREMGenerator;
  private envRT: THREE.WebGLRenderTarget;
  private roomEnv: RoomEnvironment;
  private isSoftwareGl: boolean;

  private floorMesh!: THREE.Mesh;
  private floorSpotMesh!: THREE.Mesh;
  private backWallMesh!: THREE.Mesh;
  private backSofaGroup!: THREE.Group;
  private lampGroup!: THREE.Group;
  private floorTextures: Partial<Record<StageThemeKind, THREE.CanvasTexture>> = {};

  private pedestals: PedestalUnit[] = [];
  private propGroups: Map<StageMotifKind, THREE.Group> = new Map();
  private sideFallbackGroups: THREE.Group[] = [];
  private sideLogoGroups: THREE.Group[] = [];
  private sideLogoMaterials: THREE.MeshBasicMaterial[] = [];
  private lastPlatformSig = '';
  private activeMotif: StageMotifKind = 'alarm_clock';

  private showcaseGroup!: THREE.Group;
  private showcaseScreenCanvas: HTMLCanvasElement;
  private showcaseScreenTexture: THREE.CanvasTexture;
  private lastScreenKey = '';

  private mascotGroup!: THREE.Group;
  private mascotLeftWing!: THREE.Mesh;
  private mascotRightWing!: THREE.Mesh;

  private charRig!: CharacterRigRefs;
  private lastCharSig = '';

  private keyLight!: THREE.DirectionalLight;
  private fillLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;

  // Scratch vectors (zero per-frame allocations)
  private readonly _vLook = new THREE.Vector3();
  private readonly _colA = new THREE.Color();
  private disposed = false;

  constructor() {
    this.isSoftwareGl = detectSoftwareWebGL();
    const webglCanvas = document.createElement('canvas');
    this.renderer = new THREE.WebGLRenderer({
      canvas: webglCanvas,
      antialias: !this.isSoftwareGl,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    if (!this.isSoftwareGl) {
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#020b24');
    this.scene.fog = new THREE.Fog('#020b24', 12, 28);

    this.camera = new THREE.PerspectiveCamera(42, 9 / 16, 0.1, 60);
    this.camera.position.set(0, 2.3, 9.2);

    this.roomEnv = new RoomEnvironment();
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.envRT = this.pmremGenerator.fromScene(this.roomEnv, 0.04);
    this.scene.environment = this.envRT.texture;
    this.scene.environmentIntensity = 0.68;

    this.showcaseScreenCanvas = document.createElement('canvas');
    this.showcaseScreenCanvas.width = 640;
    this.showcaseScreenCanvas.height = 380;
    this.showcaseScreenTexture = new THREE.CanvasTexture(this.showcaseScreenCanvas);
    this.showcaseScreenTexture.colorSpace = THREE.SRGBColorSpace;

    this.buildLights();
    this.buildStageEnvironment();
    this.buildShowcaseSlab();
    this.buildPedestalsAndProps();
    this.buildMascotOrb();
    this.buildCharacterRig();
  }

  private buildLights(): void {
    this.hemiLight = new THREE.HemisphereLight('#dbeafe', '#1e293b', 0.65);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight('#fff8ed', 2.05);
    this.keyLight.position.set(4.5, 8.2, 6.2);
    if (!this.isSoftwareGl) {
      this.keyLight.castShadow = true;
      this.keyLight.shadow.mapSize.set(1024, 1024);
      this.keyLight.shadow.camera.near = 1;
      this.keyLight.shadow.camera.far = 24;
      const d = 5.5;
      this.keyLight.shadow.camera.left = -d;
      this.keyLight.shadow.camera.right = d;
      this.keyLight.shadow.camera.top = d;
      this.keyLight.shadow.camera.bottom = -d;
      this.keyLight.shadow.bias = -0.0005;
    }
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.DirectionalLight('#7dd3fc', 0.72);
    this.fillLight.position.set(-5.0, 4.2, 3.0);
    this.scene.add(this.fillLight);
  }

  private buildStageEnvironment(): void {
    const allThemes: StageThemeKind[] = [
      'dark_cyber',
      'light_grid',
      'studio_room',
      'blueprint_cad',
      'mechanism_gears',
      'cinema_noir',
      'chalkboard_class',
      'minimal_zen',
      'ui_browser_lab',
      'diorama_data',
    ];
    for (const th of allThemes) {
      this.floorTextures[th] = createFloorTexture(th);
    }

    const floorGeo = new THREE.PlaneGeometry(36, 36);
    const floorMat = new THREE.MeshStandardMaterial({
      map: this.floorTextures.dark_cyber,
      roughness: 0.72,
      metalness: 0.08,
    });
    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.receiveShadow = !this.isSoftwareGl;
    this.scene.add(this.floorMesh);

    // Glowing architectural floor ring spotlight
    const spotGeo = new THREE.RingGeometry(1.75, 2.25, 48);
    const spotMat = new THREE.MeshBasicMaterial({
      color: '#00d2ff',
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
    });
    this.floorSpotMesh = new THREE.Mesh(spotGeo, spotMat);
    this.floorSpotMesh.rotation.x = -Math.PI / 2;
    this.floorSpotMesh.position.set(0.35, 0.015, 0.15);
    this.scene.add(this.floorSpotMesh);

    // Back Studio Wall (visible prominently in studio_room theme)
    const wallGeo = new THREE.PlaneGeometry(24, 12);
    const wallMat = new THREE.MeshStandardMaterial({
      color: '#ece4d8',
      roughness: 0.9,
      metalness: 0.0,
    });
    this.backWallMesh = new THREE.Mesh(wallGeo, wallMat);
    this.backWallMesh.position.set(0, 5.8, -4.4);
    this.backWallMesh.visible = false;
    this.scene.add(this.backWallMesh);

    // Studio Sofa Backdrop (composite 5-part prop visible in studio_room)
    this.backSofaGroup = new THREE.Group();
    const sofaSlate = new THREE.MeshStandardMaterial({ color: '#9ab0bc', roughness: 0.85 });
    const sofaDark = new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.7 });
    const pillowMat = new THREE.MeshStandardMaterial({ color: '#e06d44', roughness: 0.82 });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.36, 0.95), sofaSlate);
    deck.position.set(0, 0.42, 0);
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.86, 0.28), sofaSlate);
    back.position.set(0, 0.86, -0.35);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.62, 0.95), sofaSlate);
    armL.position.set(-1.32, 0.56, 0);
    const armR = armL.clone();
    armR.position.set(1.32, 0.56, 0);
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.42, 0.16), pillowMat);
    pillow.position.set(-0.78, 0.72, -0.1);
    pillow.rotation.z = 0.18;
    const legGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.25, 10);
    const legL = new THREE.Mesh(legGeo, sofaDark);
    legL.position.set(-1.1, 0.125, 0.3);
    const legR = legL.clone();
    legR.position.set(1.1, 0.125, 0.3);
    this.backSofaGroup.add(deck, back, armL, armR, pillow, legL, legR);
    this.backSofaGroup.position.set(-0.15, 0, -3.45);
    this.backSofaGroup.visible = false;
    this.scene.add(this.backSofaGroup);

    // Hanging Studio Lamp (visible in studio_room, elevated cleanly out of pedestal/monitor sightlines)
    this.lampGroup = new THREE.Group();
    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 2.2, 8),
      new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.5, roughness: 0.4 })
    );
    cord.position.set(0, 1.2, 0);
    const shade = new THREE.Mesh(
      new THREE.SphereGeometry(0.46, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
      new THREE.MeshStandardMaterial({ color: '#eaa89d', roughness: 0.35, side: THREE.DoubleSide })
    );
    shade.position.set(0, 0.05, 0);
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 14, 12),
      new THREE.MeshBasicMaterial({ color: '#fffbeb' })
    );
    bulb.position.set(0, 0.02, 0);
    this.lampGroup.add(cord, shade, bulb);
    this.lampGroup.position.set(-1.45, 4.85, -2.2);
    this.lampGroup.visible = false;
    this.scene.add(this.lampGroup);
  }

  private buildShowcaseSlab(): void {
    this.showcaseGroup = new THREE.Group();
    const chassisMat = new THREE.MeshStandardMaterial({
      color: '#0f172a',
      roughness: 0.26,
      metalness: 0.72,
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      emissive: '#0284c7',
      emissiveIntensity: 0.52,
      roughness: 0.24,
      metalness: 0.4,
    });
    const bracketMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      emissive: '#38bdf8',
      emissiveIntensity: 0.65,
      roughness: 0.2,
      metalness: 0.6,
    });
    const screenMat = new THREE.MeshBasicMaterial({
      map: this.showcaseScreenTexture,
    });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.65, 1.58, 0.11), chassisMat);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(2.74, 1.67, 0.07), rimMat);
    rim.position.z = -0.025;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.54, 1.48), screenMat);
    screen.position.z = 0.06;

    // Floating 3D holographic corner brackets + top status rail that pulse on beats
    const bracketsGroup = new THREE.Group();
    const cornerCoords: Array<[number, number]> = [
      [-1.38, 0.84],
      [1.38, 0.84],
      [-1.38, -0.84],
      [1.38, -0.84],
    ];
    for (const [cx, cy] of cornerCoords) {
      const corner = new THREE.Group();
      corner.position.set(cx, cy, 0.075);
      const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.036, 0.04), bracketMat);
      hBar.position.x = cx < 0 ? 0.08 : -0.08;
      const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.22, 0.04), bracketMat);
      vBar.position.y = cy < 0 ? 0.08 : -0.08;
      corner.add(hBar, vBar);
      bracketsGroup.add(corner);
    }

    const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.055, 0.055), rimMat);
    topRail.position.set(0, 0.92, 0.04);

    this.showcaseGroup.add(rim, chassis, screen, bracketsGroup, topRail);
    this.showcaseGroup.userData = { bracketsGroup, topRail, rimMat };
    this.showcaseGroup.position.set(0.62, 2.55, -0.55);
    this.scene.add(this.showcaseGroup);
  }

  private createPropAssembly(motif: StageMotifKind): THREE.Group {
    const g = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', metalness: 0.68, roughness: 0.22 });
    const darkMat = new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.52, roughness: 0.28 });
    const cyanGlow = new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      emissive: '#00a8ff',
      emissiveIntensity: 0.58,
      roughness: 0.2,
      metalness: 0.35,
    });
    const orangeGlow = new THREE.MeshStandardMaterial({
      color: '#ff5c28',
      emissive: '#ea580c',
      emissiveIntensity: 0.52,
      roughness: 0.22,
      metalness: 0.28,
    });
    const emeraldGlow = new THREE.MeshStandardMaterial({
      color: '#10b981',
      emissive: '#059669',
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.3,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: '#fbbf24',
      emissive: '#d97706',
      emissiveIntensity: 0.35,
      metalness: 0.78,
      roughness: 0.18,
    });

    if (motif === 'alarm_clock') {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.15, 28), cyanGlow);
      drum.rotation.x = Math.PI / 2;
      const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.165, 28), metalMat);
      dial.rotation.x = Math.PI / 2;
      const bellL = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 12), orangeGlow);
      bellL.position.set(-0.24, 0.28, 0);
      const bellR = bellL.clone();
      bellR.position.set(0.24, 0.28, 0);

      // Pivoted clock hands so they rotate cleanly around center (0, 0, 0.095)
      const handHPivot = new THREE.Group();
      handHPivot.position.set(0, 0, 0.092);
      const handH = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.14, 0.025), darkMat);
      handH.position.y = 0.055;
      handHPivot.add(handH);

      const handMPivot = new THREE.Group();
      handMPivot.position.set(0, 0, 0.098);
      const handM = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.19, 0.025), orangeGlow);
      handM.position.y = 0.075;
      handMPivot.add(handM);

      const centerCap = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 10), goldMat);
      centerCap.position.set(0, 0, 0.105);

      const shockRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.018, 10, 32), goldMat);
      g.add(drum, dial, bellL, bellR, handHPivot, handMPivot, centerCap, shockRing);
      g.userData.parts = { bellL, bellR, handHPivot, handMPivot, shockRing };
    } else if (motif === 'magnet_choice') {
      const magnetCore = new THREE.Group();
      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.072, 16, 30, Math.PI), orangeGlow);
      arch.position.y = 0.04;
      const tipL = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.15, 0.135), metalMat);
      tipL.position.set(-0.24, -0.02, 0);
      const tipR = tipL.clone();
      tipR.position.set(0.24, -0.02, 0);
      magnetCore.add(arch, tipL, tipR);

      const sparkL = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 1), cyanGlow);
      sparkL.position.set(-0.24, -0.24, 0.08);
      const sparkR = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 1), emeraldGlow);
      sparkR.position.set(0.24, -0.24, -0.08);
      const fieldRing = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.016, 10, 32), cyanGlow);
      fieldRing.rotation.x = Math.PI * 0.42;
      g.add(magnetCore, sparkL, sparkR, fieldRing);
      g.userData.parts = { magnetCore, sparkL, sparkR, fieldRing };
    } else if (motif === 'phone_scroll' || motif === 'website_walkthrough') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.68, 0.06), darkMat);
      const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.7, 0.045), metalMat);
      bezel.position.z = -0.01;
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.58, 0.065), cyanGlow);
      const card1 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.11, 0.04), metalMat);
      card1.position.set(0, 0.14, 0.065);
      const card2 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.11, 0.04), orangeGlow);
      card2.position.set(0, 0.0, 0.095);
      const card3 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.11, 0.04), emeraldGlow);
      card3.position.set(0, -0.14, 0.125);
      const notifOrb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 12), goldMat);
      notifOrb.position.set(0.22, 0.28, 0.11);
      g.add(bezel, body, screen, card1, card2, card3, notifOrb);
      g.userData.parts = { card1, card2, card3, notifOrb };
    } else if (motif === 'money_flow') {
      const coins: THREE.Mesh[] = [];
      for (let i = 0; i < 3; i++) {
        const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.062, 26), goldMat);
        coin.position.set((i - 1) * 0.085, -0.12 + i * 0.095, (i - 1) * 0.03);
        coins.push(coin);
        g.add(coin);
      }
      const badge = new THREE.Mesh(new THREE.OctahedronGeometry(0.145, 0), emeraldGlow);
      badge.position.set(0.18, 0.25, 0.09);
      const haloRing = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.016, 10, 32), cyanGlow);
      haloRing.rotation.x = Math.PI * 0.36;
      g.add(badge, haloRing);
      g.userData.parts = { coins, badge, haloRing };
    } else if (motif === 'growth_chart') {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.055, 0.3), darkMat);
      base.position.y = -0.22;
      g.add(base);
      const heights = [0.18, 0.31, 0.45, 0.6];
      const mats = [cyanGlow, cyanGlow, emeraldGlow, orangeGlow];
      const bars: THREE.Mesh[] = [];
      for (let i = 0; i < 4; i++) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.115, heights[i], 0.145), mats[i]);
        bar.position.set(-0.21 + i * 0.14, -0.2 + heights[i] * 0.5, 0);
        bar.userData.baseHeight = heights[i];
        bars.push(bar);
        g.add(bar);
      }
      const trendNode = new THREE.Mesh(new THREE.OctahedronGeometry(0.085, 0), goldMat);
      trendNode.position.set(0.21, 0.48, 0.06);
      g.add(trendNode);
      g.userData.parts = { bars, trendNode };
    } else if (motif === 'checklist_steps') {
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.6, 0.06), darkMat);
      const rim = new THREE.Mesh(new THREE.BoxGeometry(0.51, 0.63, 0.045), cyanGlow);
      rim.position.z = -0.012;
      g.add(rim, board);
      const dots: THREE.Mesh[] = [];
      const rows: THREE.Mesh[] = [];
      for (let i = 0; i < 3; i++) {
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.052, 14, 12), emeraldGlow);
        dot.position.set(-0.14, 0.14 - i * 0.14, 0.05);
        const row = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.06, 0.05), i === 0 ? goldMat : metalMat);
        row.position.set(0.04, 0.14 - i * 0.14, 0.045);
        dots.push(dot);
        rows.push(row);
        g.add(dot, row);
      }
      g.userData.parts = { dots, rows };
    } else if (motif === 'stair_goal') {
      const steps: THREE.Mesh[] = [];
      for (let i = 0; i < 4; i++) {
        const h = 0.12 + i * 0.12;
        const step = new THREE.Mesh(
          new THREE.BoxGeometry(0.145, h, 0.23),
          i === 3 ? cyanGlow : i === 2 ? emeraldGlow : metalMat
        );
        step.position.set(-0.21 + i * 0.14, -0.22 + h * 0.5, 0);
        step.userData.baseHeight = h;
        steps.push(step);
        g.add(step);
      }
      const trophy = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 1), goldMat);
      trophy.position.set(0.21, 0.36, 0);
      const crownRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.016, 10, 28), orangeGlow);
      crownRing.position.set(0.21, 0.36, 0);
      g.add(trophy, crownRing);
      g.userData.parts = { steps, trophy, crownRing };
    } else if (motif === 'cta_card') {
      const playBox = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.36, 0.12), orangeGlow);
      const tri = new THREE.Mesh(new THREE.ConeGeometry(0.115, 0.19, 3), metalMat);
      tri.rotation.z = -Math.PI / 2;
      tri.position.z = 0.085;
      const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.024, 12, 32), cyanGlow);
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.016, 10, 32), goldMat);
      ring2.rotation.x = Math.PI * 0.35;
      g.add(playBox, tri, ring1, ring2);
      g.userData.parts = { playBox, tri, ring1, ring2 };
    } else {
      // brain_idea
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 18), goldMat);
      bulb.position.y = 0.08;
      const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.14, 16), darkMat);
      socket.position.y = -0.14;
      const orbit1 = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.022, 12, 32), cyanGlow);
      orbit1.rotation.x = 1.1;
      const orbit2 = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.022, 12, 32), orangeGlow);
      orbit2.rotation.y = 1.1;
      const sat = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), emeraldGlow);
      sat.position.set(0.34, 0.08, 0);
      g.add(bulb, socket, orbit1, orbit2, sat);
      g.userData.parts = { bulb, orbit1, orbit2, sat };
    }
    return g;
  }

  private animateActiveMotifParts(motif: StageMotifKind, grp: THREE.Group, state: Stage3DFrameState, timeSec: number): void {
    const parts = grp.userData?.parts;
    if (!parts) return;
    const [k1, k2, k3, k4] = state.beats || [1, 1, 1, 1];
    const pulse = state.beatPulse || 0;

    if (motif === 'alarm_clock') {
      const ringVib = Math.sin(timeSec * 34) * (0.06 + pulse * 0.14);
      if (parts.bellL) parts.bellL.rotation.z = 0.25 + ringVib;
      if (parts.bellR) parts.bellR.rotation.z = -0.25 - ringVib;
      if (parts.handMPivot) parts.handMPivot.rotation.z = -timeSec * 2.6;
      if (parts.handHPivot) parts.handHPivot.rotation.z = -timeSec * 0.45;
      if (parts.shockRing) {
        const s = 0.88 + Math.sin(timeSec * 3.8) * 0.08 + pulse * 0.22;
        parts.shockRing.scale.setScalar(s);
        parts.shockRing.rotation.x = Math.sin(timeSec * 2.1) * 0.25;
      }
    } else if (motif === 'magnet_choice') {
      if (parts.magnetCore) {
        parts.magnetCore.rotation.z = Math.sin(timeSec * 2.8) * 0.16;
      }
      if (parts.sparkL && parts.sparkR) {
        parts.sparkL.position.y = -0.22 + Math.sin(timeSec * 5.2) * 0.07;
        parts.sparkL.position.z = Math.cos(timeSec * 5.2) * 0.09;
        parts.sparkL.rotation.y = timeSec * 4;
        parts.sparkR.position.y = -0.22 - Math.sin(timeSec * 5.2) * 0.07;
        parts.sparkR.position.z = -Math.cos(timeSec * 5.2) * 0.09;
        parts.sparkR.rotation.y = -timeSec * 4;
      }
      if (parts.fieldRing) {
        parts.fieldRing.rotation.z = timeSec * 1.8;
        parts.fieldRing.scale.setScalar(0.95 + pulse * 0.14);
      }
    } else if (motif === 'phone_scroll' || motif === 'website_walkthrough') {
      const scrollWave = Math.sin(timeSec * 2.4) * 0.035;
      if (parts.card1) {
        const c1 = Math.max(0.2, Math.min(1.12, k1));
        parts.card1.scale.setScalar(c1);
        parts.card1.position.y = 0.14 + scrollWave;
        parts.card1.position.z = 0.055 + Math.sin(timeSec * 3.1) * 0.015;
      }
      if (parts.card2) {
        const c2 = Math.max(0.2, Math.min(1.14, 0.25 + k2 * 0.75));
        parts.card2.scale.setScalar(c2);
        parts.card2.position.y = scrollWave * 0.8;
        parts.card2.position.z = 0.088 + pulse * 0.035;
      }
      if (parts.card3) {
        const c3 = Math.max(0.2, Math.min(1.14, 0.2 + k3 * 0.8));
        parts.card3.scale.setScalar(c3);
        parts.card3.position.y = -0.14 + scrollWave;
        parts.card3.position.z = 0.115 + Math.cos(timeSec * 3.1) * 0.015;
      }
      if (parts.notifOrb) {
        parts.notifOrb.position.y = 0.28 + Math.abs(Math.sin(timeSec * 4.2)) * 0.06;
        parts.notifOrb.scale.setScalar(0.9 + pulse * 0.25);
      }
    } else if (motif === 'money_flow') {
      if (Array.isArray(parts.coins)) {
        const coinSprings = [k1, Math.max(0.3, k2), Math.max(0.25, k3)];
        parts.coins.forEach((coin: THREE.Mesh, idx: number) => {
          const ck = Math.max(0.2, Math.min(1.15, coinSprings[idx] || 1));
          coin.scale.setScalar(ck);
          coin.position.y = -0.12 + idx * 0.095 + Math.sin(timeSec * 3.2 + idx * 1.1) * 0.04;
          coin.rotation.x = Math.sin(timeSec * 2.4 + idx) * 0.22;
          coin.rotation.z = Math.cos(timeSec * 2.1 + idx) * 0.18;
        });
      }
      if (parts.badge) {
        parts.badge.rotation.y = timeSec * 2.6;
        parts.badge.position.y = 0.25 + Math.sin(timeSec * 3.6) * 0.045 + pulse * 0.04;
      }
      if (parts.haloRing) {
        parts.haloRing.rotation.z = -timeSec * 1.9;
      }
    } else if (motif === 'growth_chart') {
      if (Array.isArray(parts.bars)) {
        const barSprings = [
          Math.max(0.25, k1),
          Math.max(0.22, 0.2 + k2 * 0.8),
          Math.max(0.2, 0.18 + k3 * 0.82),
          Math.max(0.2, 0.15 + k4 * 0.85),
        ];
        parts.bars.forEach((bar: THREE.Mesh, idx: number) => {
          const baseH = bar.userData.baseHeight || 0.3;
          const grow = Math.max(0.2, Math.min(1.18, barSprings[idx] + Math.sin(timeSec * 2.8 + idx * 0.7) * 0.045));
          bar.scale.y = grow;
          bar.position.y = -0.2 + baseH * grow * 0.5;
        });
      }
      if (parts.trendNode) {
        parts.trendNode.rotation.y = timeSec * 2.8;
        parts.trendNode.position.y = 0.44 + Math.sin(timeSec * 3.4) * 0.05 + pulse * 0.05;
      }
    } else if (motif === 'checklist_steps') {
      const rowSprings = [k1, Math.max(0.25, k2), Math.max(0.2, k3)];
      if (Array.isArray(parts.rows) && Array.isArray(parts.dots)) {
        for (let i = 0; i < 3; i++) {
          const rk = Math.max(0.2, Math.min(1.15, rowSprings[i]));
          const row = parts.rows[i] as THREE.Mesh;
          const dot = parts.dots[i] as THREE.Mesh;
          if (row) {
            row.scale.x = rk;
            row.position.z = 0.045 + Math.sin(timeSec * 2.6 + i) * 0.015;
          }
          if (dot) {
            dot.scale.setScalar(rk * (1 + (i === 2 ? pulse * 0.22 : 0)));
            dot.position.z = 0.055 + Math.sin(timeSec * 2.6 + i) * 0.018;
          }
        }
      }
    } else if (motif === 'stair_goal') {
      if (Array.isArray(parts.steps)) {
        const stepSprings = [
          Math.max(0.25, k1),
          Math.max(0.22, 0.2 + k2 * 0.8),
          Math.max(0.2, 0.18 + k3 * 0.82),
          Math.max(0.2, 0.15 + k4 * 0.85),
        ];
        parts.steps.forEach((step: THREE.Mesh, idx: number) => {
          const baseH = step.userData.baseHeight || 0.24;
          const grow = Math.max(0.2, Math.min(1.16, stepSprings[idx]));
          step.scale.y = grow;
          step.position.y = -0.22 + baseH * grow * 0.5;
        });
      }
      if (parts.trophy) {
        parts.trophy.rotation.y = timeSec * 2.5;
        parts.trophy.position.y = 0.36 + Math.sin(timeSec * 3.2) * 0.045 + pulse * 0.05;
      }
      if (parts.crownRing) {
        parts.crownRing.rotation.x = Math.PI * 0.4 + Math.sin(timeSec * 2.4) * 0.35;
        parts.crownRing.rotation.y = timeSec * 2.2;
        parts.crownRing.position.y = 0.36 + Math.sin(timeSec * 3.2) * 0.045;
      }
    } else if (motif === 'cta_card') {
      const beatScale = 1 + pulse * 0.16 + Math.sin(timeSec * 3.4) * 0.04;
      if (parts.playBox) parts.playBox.scale.setScalar(beatScale);
      if (parts.tri) parts.tri.position.z = 0.085 + pulse * 0.04;
      if (parts.ring1) {
        parts.ring1.rotation.z = timeSec * 1.8;
        parts.ring1.scale.setScalar(1 + pulse * 0.12);
      }
      if (parts.ring2) {
        parts.ring2.rotation.x = Math.PI * 0.35 + timeSec * 1.4;
        parts.ring2.rotation.y = -timeSec * 1.6;
      }
    } else {
      // brain_idea
      if (parts.bulb) {
        parts.bulb.scale.setScalar(1 + Math.sin(timeSec * 3.6) * 0.06 + pulse * 0.12);
      }
      if (parts.orbit1) {
        parts.orbit1.rotation.x = 1.1 + timeSec * 1.8;
        parts.orbit1.rotation.z = timeSec * 1.2;
      }
      if (parts.orbit2) {
        parts.orbit2.rotation.y = 1.1 - timeSec * 2.1;
        parts.orbit2.rotation.x = Math.sin(timeSec * 1.5) * 0.6;
      }
      if (parts.sat) {
        parts.sat.position.set(
          Math.cos(timeSec * 3.1) * 0.34,
          0.08 + Math.sin(timeSec * 2.4) * 0.14,
          Math.sin(timeSec * 3.1) * 0.34
        );
      }
    }
  }

  private buildPedestalsAndProps(): void {
    const motifs: StageMotifKind[] = [
      'alarm_clock',
      'magnet_choice',
      'phone_scroll',
      'money_flow',
      'growth_chart',
      'checklist_steps',
      'stair_goal',
      'brain_idea',
      'cta_card',
      'website_walkthrough',
    ];
    const xs = [-0.28, 0.72, 1.72];
    const zs = [0.38, 0.14, 0.42];
    const pedBaseHeights = [0.72, 0.92, 0.78];
    const shaftMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.26,
      metalness: 0.12,
    });
    const baseMat = new THREE.MeshStandardMaterial({
      color: '#cbd5e1',
      roughness: 0.34,
      metalness: 0.32,
    });
    const frontPillMat = new THREE.MeshStandardMaterial({
      color: '#0f172a',
      roughness: 0.28,
      metalness: 0.48,
    });
    const frontPillRimMat = new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      emissive: '#0284c7',
      emissiveIntensity: 0.45,
      roughness: 0.24,
    });

    for (let i = 0; i < 3; i++) {
      const unit = new THREE.Group();
      unit.position.set(xs[i], 0, zs[i]);

      const h = pedBaseHeights[i];
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.39, h, 28), shaftMat);
      shaft.position.y = h * 0.5;
      shaft.castShadow = !this.isSoftwareGl;
      shaft.receiveShadow = !this.isSoftwareGl;

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.46, 0.08, 28), baseMat);
      base.position.y = 0.04;

      const aoDisc = new THREE.Mesh(
        new THREE.CircleGeometry(0.56, 28),
        new THREE.MeshBasicMaterial({ color: '#020617', transparent: true, opacity: 0.28 })
      );
      aoDisc.rotation.x = -Math.PI / 2;
      aoDisc.position.y = 0.008;

      const ringMat = new THREE.MeshStandardMaterial({
        color: i === 1 ? '#38bdf8' : '#00a8ff',
        emissive: '#0284c7',
        emissiveIntensity: i === 1 ? 0.68 : 0.48,
        roughness: 0.22,
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.032, 12, 28), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = h;

      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.048, 28), shaftMat);
      cap.position.y = h + 0.01;

      // Clear front step indicator plaque on each pedestal shaft
      const stepPlaque = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.03), frontPillMat);
      stepPlaque.position.set(0, h * 0.56, 0.375);
      const stepRim = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.14, 0.018), frontPillRimMat);
      stepRim.position.set(0, h * 0.56, 0.368);

      const propAnchor = new THREE.Group();
      propAnchor.position.set(0, h + 0.42, 0);

      unit.add(aoDisc, base, shaft, stepRim, stepPlaque, ring, cap, propAnchor);
      this.scene.add(unit);
      this.pedestals.push({ group: unit, shaft, ring, cap, propAnchor });
    }

    // Center pedestal (index 1) holds dynamic active motif prop; outer pedestals hold distinct sculpted 3D studio props
    for (const m of motifs) {
      const assembly = this.createPropAssembly(m);
      assembly.visible = m === this.activeMotif;
      this.pedestals[1].propAnchor.add(assembly);
      this.propGroups.set(m, assembly);
    }

    // Sculpted 3D Studio Objects on Pedestals 0 & 2 (replaces cluttered wire rings with recognizable 3D icons)
    const sideAccentMat = new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      emissive: '#00a8ff',
      emissiveIntensity: 0.52,
      metalness: 0.55,
      roughness: 0.22,
    });
    const sideGoldMat = new THREE.MeshStandardMaterial({
      color: '#fbbf24',
      emissive: '#d97706',
      emissiveIntensity: 0.38,
      metalness: 0.72,
      roughness: 0.2,
    });
    const sideEmeraldMat = new THREE.MeshStandardMaterial({
      color: '#34d399',
      emissive: '#059669',
      emissiveIntensity: 0.42,
      metalness: 0.45,
      roughness: 0.24,
    });
    const badgeBackMat = new THREE.MeshStandardMaterial({
      color: '#0f172a',
      metalness: 0.48,
      roughness: 0.24,
    });
    const slateCardMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      metalness: 0.35,
      roughness: 0.3,
    });

    const buildSideMarker = (pedIdx: number) => {
      const fbGroup = new THREE.Group();
      if (pedIdx === 0) {
        // Pedestal 0: Sculpted 3D Storyboard Tablet & Checklist Slab
        const boardSlab = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.06), badgeBackMat);
        const boardRim = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.04), sideAccentMat);
        boardRim.position.z = -0.012;
        const clipTop = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.065, 0.075), sideGoldMat);
        clipTop.position.set(0, 0.25, 0.01);
        const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.055, 0.025), sideEmeraldMat);
        bar1.position.set(0, 0.1, 0.038);
        const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.055, 0.025), sideAccentMat);
        bar2.position.set(0, -0.01, 0.038);
        const bar3 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.055, 0.025), sideGoldMat);
        bar3.position.set(-0.03, -0.12, 0.038);
        const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.014, 10, 28), sideAccentMat);
        innerRing.position.z = -0.03;
        const hub = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), sideGoldMat);
        hub.position.set(0.16, 0.22, 0.06);
        fbGroup.add(boardRim, boardSlab, clipTop, bar1, bar2, bar3, innerRing, hub);
        fbGroup.userData = { hub, innerRing, outerRing: boardRim };
      } else {
        // Pedestal 2: Sculpted 3D Render Play Block & Trophy Badge
        const cubeBody = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.36, 0.1), slateCardMat);
        const cubeRim = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.39, 0.07), sideGoldMat);
        cubeRim.position.z = -0.015;
        const playPrism = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.18, 3), sideEmeraldMat);
        playPrism.rotation.z = -Math.PI / 2;
        playPrism.position.set(0.01, 0, 0.065);
        const hub = new THREE.Mesh(new THREE.OctahedronGeometry(0.095, 0), sideGoldMat);
        hub.position.set(0, 0.28, 0.02);
        const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.015, 10, 28), sideAccentMat);
        innerRing.position.z = -0.03;
        fbGroup.add(cubeRim, cubeBody, playPrism, hub, innerRing);
        fbGroup.userData = { hub, innerRing, outerRing: cubeRim };
      }
      fbGroup.scale.setScalar(0.86);
      this.pedestals[pedIdx].propAnchor.add(fbGroup);
      this.sideFallbackGroups.push(fbGroup);

      const logoGrp = new THREE.Group();
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.055, 28), badgeBackMat);
      rim.rotation.x = Math.PI * 0.5;
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.016, 10, 32), sideAccentMat);
      const logoMat = new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.54), logoMat);
      plane.position.z = 0.032;
      const planeBack = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.54), logoMat);
      planeBack.position.z = -0.032;
      planeBack.rotation.y = Math.PI;
      logoGrp.add(rim, halo, plane, planeBack);
      logoGrp.userData = { halo };
      logoGrp.visible = false;
      this.pedestals[pedIdx].propAnchor.add(logoGrp);
      this.sideLogoGroups.push(logoGrp);
      this.sideLogoMaterials.push(logoMat);
    };
    buildSideMarker(0);
    buildSideMarker(2);
  }

  private buildMascotOrb(): void {
    this.mascotGroup = new THREE.Group();
    const orbMat = new THREE.MeshStandardMaterial({
      color: '#ef4444',
      emissive: '#b91c1c',
      emissiveIntensity: 0.25,
      roughness: 0.28,
      metalness: 0.25,
    });
    const wingMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.35 });
    const visorMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.2 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 22, 18), orbMat);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.13, 0.14), visorMat);
    visor.position.set(0, 0.02, 0.22);
    const eL = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 8), eyeMat);
    eL.position.set(-0.08, 0.02, 0.295);
    const eR = eL.clone();
    eR.position.set(0.08, 0.02, 0.295);

    this.mascotLeftWing = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.11, 0.04), wingMat);
    this.mascotLeftWing.position.set(-0.34, 0.06, -0.02);
    this.mascotRightWing = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.11, 0.04), wingMat);
    this.mascotRightWing.position.set(0.34, 0.06, -0.02);

    this.mascotGroup.add(body, visor, eL, eR, this.mascotLeftWing, this.mascotRightWing);
    this.mascotGroup.position.set(2.1, 2.45, 0.7);
    this.scene.add(this.mascotGroup);
  }

  private buildCharacterRig(): void {
    const skinMat = new THREE.MeshStandardMaterial({ color: '#f6c8ad', roughness: 0.46 });
    const hoodieMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.52 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.65 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.38 });
    const soleMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 });
    const hairMat = new THREE.MeshStandardMaterial({ color: '#ff5c28', roughness: 0.36 });
    const darkEyeMat = new THREE.MeshBasicMaterial({ color: '#0f172a' });
    const pupilMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    const mouthMat = new THREE.MeshBasicMaterial({ color: '#991b1b' });

    const root = new THREE.Group();
    root.position.set(-1.55, 0, 0.65);

    const charShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.46, 24),
      new THREE.MeshBasicMaterial({ color: '#020617', transparent: true, opacity: 0.34 })
    );
    charShadow.rotation.x = -Math.PI / 2;
    charShadow.position.y = 0.01;
    root.add(charShadow);

    const pelvis = new THREE.Group();
    pelvis.position.y = 0.72;
    root.add(pelvis);

    // Legs with sneaker tongue & sole detail
    const buildLeg = (xSign: number) => {
      const leg = new THREE.Group();
      leg.position.set(xSign * 0.14, 0, 0);
      const cyl = new THREE.Mesh(new THREE.CapsuleGeometry(0.088, 0.4, 8, 12), pantsMat);
      cyl.position.y = -0.31;
      cyl.castShadow = !this.isSoftwareGl;
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.092, 0.07, 16), pantsMat);
      cuff.position.y = -0.52;
      const shoe = new THREE.Mesh(new THREE.CapsuleGeometry(0.088, 0.14, 10, 16), shoeMat);
      shoe.rotation.x = Math.PI * 0.5;
      shoe.scale.set(1.08, 1.0, 0.82);
      shoe.position.set(0, -0.63, 0.055);
      const sole = new THREE.Mesh(new THREE.CapsuleGeometry(0.094, 0.155, 8, 14), soleMat);
      sole.rotation.x = Math.PI * 0.5;
      sole.scale.set(1.12, 1.02, 0.36);
      sole.position.set(0, -0.695, 0.058);
      const toeCap = new THREE.Mesh(new THREE.SphereGeometry(0.092, 14, 12), soleMat);
      toeCap.scale.set(1.04, 0.62, 0.92);
      toeCap.position.set(0, -0.65, 0.165);
      leg.add(cyl, cuff, shoe, sole, toeCap);
      return leg;
    };
    const leftLeg = buildLeg(-1);
    const rightLeg = buildLeg(1);
    pelvis.add(leftLeg, rightLeg);

    // Torso connected to pelvis with sculpted shoulder yoke, contoured hoodie collar, kangaroo pouch & clean chest accent
    const torso = new THREE.Group();
    torso.position.y = 0.06;
    pelvis.add(torso);

    const bodyMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.258, 0.42, 18, 28), hoodieMat);
    bodyMesh.scale.set(1.06, 1.0, 0.92);
    bodyMesh.position.y = 0.34;
    bodyMesh.castShadow = !this.isSoftwareGl;

    const shoulderYoke = new THREE.Mesh(new THREE.CapsuleGeometry(0.148, 0.35, 14, 20), hoodieMat);
    shoulderYoke.rotation.z = Math.PI * 0.5;
    shoulderYoke.scale.set(0.95, 1.0, 1.08);
    shoulderYoke.position.set(0, 0.54, -0.005);

    const studioTeeMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.48 });
    const studioAccentMat = new THREE.MeshStandardMaterial({
      color: '#ff5c28',
      emissive: '#ea580c',
      emissiveIntensity: 0.32,
      roughness: 0.32,
    });
    const emblemGroup = new THREE.Group();
    // Subtle inner collar V-insert at neckline (instead of a vertical white pill down the stomach)
    const innerCollarTee = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 12), studioTeeMat);
    innerCollarTee.scale.set(0.95, 0.62, 0.42);
    innerCollarTee.position.set(0, 0.585, 0.165);
    const studioHoodCollar = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.056, 16, 32), hoodieMat);
    studioHoodCollar.rotation.x = Math.PI * 0.46;
    studioHoodCollar.position.set(0, 0.625, -0.015);
    const kangarooPouch = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.19, 10, 16), hoodieMat);
    kangarooPouch.rotation.z = Math.PI * 0.5;
    kangarooPouch.scale.set(0.92, 1.0, 0.45);
    kangarooPouch.position.set(0, 0.21, 0.208);
    const chestBadge = new THREE.Mesh(new THREE.SphereGeometry(0.036, 14, 12), studioAccentMat);
    chestBadge.scale.set(1.15, 0.82, 0.38);
    chestBadge.position.set(0.125, 0.45, 0.228);
    emblemGroup.add(innerCollarTee, studioHoodCollar, kangarooPouch, chestBadge);
    for (const sx of [-1, 1]) {
      const drawstring = new THREE.Mesh(new THREE.CapsuleGeometry(0.009, 0.13, 6, 10), studioTeeMat);
      drawstring.position.set(sx * 0.064, 0.49, 0.226);
      drawstring.rotation.z = sx * -0.05;
      emblemGroup.add(drawstring);
    }
    torso.add(bodyMesh, shoulderYoke, emblemGroup);

    // Arms with tapered upper arm, spherical elbow joint, tapered forearm, ribbed cuff & sculpted hand
    const buildArm = (xSign: number) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(xSign * 0.305, 0.56, 0);
      const deltoid = new THREE.Mesh(new THREE.SphereGeometry(0.094, 16, 14), hoodieMat);
      deltoid.scale.set(0.96, 1.06, 0.96);
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.074, 0.27, 16), hoodieMat);
      upper.position.y = -0.145;
      const elbowSphere = new THREE.Mesh(new THREE.SphereGeometry(0.073, 14, 12), hoodieMat);
      elbowSphere.position.y = -0.285;
      shoulder.add(deltoid, upper, elbowSphere);

      const forearm = new THREE.Group();
      forearm.position.y = -0.285;
      const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.058, 0.23, 16), hoodieMat);
      lower.position.y = -0.12;
      const sleeveCuff = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.018, 10, 18), studioAccentMat);
      sleeveCuff.rotation.x = Math.PI * 0.5;
      sleeveCuff.position.y = -0.228;
      const handGroup = new THREE.Group();
      handGroup.position.y = -0.28;
      const wristBridge = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.05, 0.045, 12), skinMat);
      wristBridge.position.set(0, 0.036, 0);
      const palm = new THREE.Mesh(new THREE.SphereGeometry(0.072, 16, 14), skinMat);
      palm.scale.set(0.92, 1.08, 0.72);
      const fingers = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.044, 8, 12), skinMat);
      fingers.scale.set(1.04, 0.92, 0.62);
      fingers.position.set(0, -0.048, 0.01);
      fingers.rotation.x = 0.14;
      const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.021, 0.042, 8, 10), skinMat);
      thumb.position.set(xSign * -0.05, -0.005, 0.026);
      thumb.rotation.set(0.18, 0, xSign * 0.46);
      handGroup.add(wristBridge, palm, fingers, thumb);
      forearm.add(lower, sleeveCuff, handGroup);
      shoulder.add(forearm);
      return { shoulder, forearm };
    };
    const leftArm = buildArm(-1);
    const rightArm = buildArm(1);
    torso.add(leftArm.shoulder, rightArm.shoulder);

    // Neck + Sculpted Oval-Tapered V-Jawline Creator Head (fixes round balloon face)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.72, 0);
    torso.add(headGroup);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.112, 0.17, 16), skinMat);
    neck.position.y = 0.04;
    const neckBaseFlare = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), skinMat);
    neckBaseFlare.scale.set(1.04, 0.44, 0.94);
    neckBaseFlare.position.set(0, -0.03, 0.005);

    const createStageHeadGeometry = (): THREE.BufferGeometry => {
      const geo = new THREE.SphereGeometry(0.365, 36, 32);
      const pos = geo.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const ny = v.y / 0.365;
        const nx = v.x / 0.365;
        const nz = v.z / 0.365;
        // Sleek oval-tapered silhouette instead of wide round sphere
        v.x *= 0.905;
        v.y *= 1.045;
        v.z *= 0.965;
        if (ny > 0.18) {
          const crownFactor = (ny - 0.18) / 0.82;
          v.x *= 1 - 0.045 * Math.sin(crownFactor * Math.PI);
        }
        if (ny < 0.12 && ny > -0.45 && nz > 0.15) {
          const cheekCurve = Math.exp(-Math.pow((ny + 0.12) / 0.22, 2));
          v.z += 0.011 * cheekCurve * (1 - Math.abs(nx) * 0.3);
          v.x *= 1 + 0.022 * cheekCurve;
        }
        if (ny < 0.02) {
          const jawT = Math.min(1, (-ny + 0.02) / 1.02);
          const jawNarrow = Math.pow(jawT, 1.32);
          v.x *= 1 - 0.24 * jawNarrow;
          v.z *= 1 - 0.10 * jawNarrow;
          if (nz > 0.2) {
            const chinFocus = Math.max(0, 1 - Math.abs(nx) * 1.85);
            v.z += 0.018 * Math.pow(jawT, 1.1) * chinFocus;
            v.y -= 0.015 * Math.pow(jawT, 1.4) * chinFocus;
          }
        }
        if (nz > 0.65 && ny > -0.15 && ny < 0.45) {
          v.z -= (nz - 0.65) * 0.012;
        }
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      return geo;
    };

    const headMesh = new THREE.Mesh(createStageHeadGeometry(), skinMat);
    headMesh.position.y = 0.365;
    headMesh.castShadow = !this.isSoftwareGl;
    // Sculpted Ears hugging the tapered oval temples
    for (const sx of [-1, 1]) {
      const humanEar = new THREE.Mesh(new THREE.SphereGeometry(0.064, 12, 10), skinMat);
      humanEar.scale.set(0.52, 1.04, 0.72);
      humanEar.position.set(sx * 0.332, 0.34, -0.01);
      humanEar.rotation.set(0, sx * -0.18, sx * -0.08);
      headGroup.add(humanEar);
    }
    headGroup.add(neck, neckBaseFlare, headMesh);

    // Expressive Studio Eyes (Sclera + Curved Upper Eyelash + Two-Tone Iris + Dual Catchlights)
    const scleraWhiteMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    const lashDarkMat = new THREE.MeshBasicMaterial({ color: '#0f172a' });
    const irisWarmGlowMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const buildStudioEye = (sx: number) => {
      const ew = new THREE.Group();
      ew.position.set(sx * 0.126, 0.358, 0.318);
      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 14), scleraWhiteMat);
      sclera.scale.set(1.02, 1.18, 0.45);
      const upperLash = new THREE.Mesh(
        new THREE.TorusGeometry(0.084, 0.015, 8, 18, Math.PI * 0.92),
        lashDarkMat
      );
      upperLash.position.set(0, 0.016, 0.022);
      upperLash.rotation.z = 0.08;
      const irisOuter = new THREE.Mesh(new THREE.SphereGeometry(0.061, 14, 12), darkEyeMat);
      irisOuter.scale.set(1.0, 1.14, 0.45);
      irisOuter.position.set(sx * -0.006, -0.003, 0.014);
      const irisLowerGlow = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 10), irisWarmGlowMat);
      irisLowerGlow.scale.set(0.92, 0.68, 0.45);
      irisLowerGlow.position.set(sx * -0.006, -0.022, 0.022);
      const pupilGroup = new THREE.Group();
      pupilGroup.position.set(sx * -0.006, 0, 0.028);
      const pupilCore = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 10), lashDarkMat);
      pupilCore.scale.set(1.0, 1.12, 0.45);
      const catchMain = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), pupilMat);
      catchMain.position.set(-0.021, 0.026, 0.012);
      const catchSub = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 8), pupilMat);
      catchSub.position.set(0.019, -0.022, 0.012);
      pupilGroup.add(pupilCore, catchMain, catchSub);
      ew.add(sclera, upperLash, irisOuter, irisLowerGlow, pupilGroup);
      return { eyeGroup: ew, pupilGroup };
    };
    const studioEyeL = buildStudioEye(-1);
    const studioEyeR = buildStudioEye(1);
    const leftEye = studioEyeL.eyeGroup;
    const rightEye = studioEyeR.eyeGroup;
    const leftPupil = studioEyeL.pupilGroup;
    const rightPupil = studioEyeR.pupilGroup;

    // Happy Closed-Eye Arcs (^ ^) for joyful poses (cheer, thumbs, wave)
    const happyArcGeo = new THREE.TorusGeometry(0.068, 0.015, 8, 18, Math.PI * 0.85);
    const happyArcL = new THREE.Mesh(happyArcGeo, lashDarkMat);
    happyArcL.position.set(-0.126, 0.345, 0.344);
    happyArcL.rotation.z = Math.PI * 0.075;
    happyArcL.visible = false;
    const happyArcR = new THREE.Mesh(happyArcGeo, lashDarkMat);
    happyArcR.position.set(0.126, 0.345, 0.344);
    happyArcR.rotation.z = Math.PI * 0.075;
    happyArcR.visible = false;

    // Nose button + Expressive Smile Arc + Vowel Open Mouth
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), skinMat);
    nose.scale.set(0.88, 0.75, 0.85);
    nose.position.set(0, 0.295, 0.362);

    const mouthSmile = new THREE.Mesh(
      new THREE.TorusGeometry(0.048, 0.01, 8, 16, Math.PI * 0.82),
      new THREE.MeshBasicMaterial({ color: '#7c2d12' })
    );
    mouthSmile.position.set(0, 0.242, 0.344);
    mouthSmile.rotation.z = Math.PI * 1.09;

    const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.052, 14, 12), mouthMat);
    mouth.position.set(0, 0.215, 0.338);
    mouth.scale.set(0.92, 0.32, 0.38);
    const teethBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.064, 0.017, 0.02),
      new THREE.MeshBasicMaterial({ color: '#ffffff' })
    );
    teethBar.position.set(0, 0.026, 0.028);
    const tongue = new THREE.Mesh(
      new THREE.SphereGeometry(0.034, 10, 8),
      new THREE.MeshBasicMaterial({ color: '#fb7185' })
    );
    tongue.scale.set(1.0, 0.55, 0.6);
    tongue.position.set(0, -0.02, 0.022);
    mouth.add(teethBar, tongue);

    const cheekMat = new THREE.MeshBasicMaterial({ color: '#fda4af', transparent: true, opacity: 0.62 });
    const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), cheekMat);
    cheekL.position.set(-0.195, 0.275, 0.298);
    cheekL.scale.set(1.12, 0.64, 0.38);
    const cheekR = cheekL.clone();
    cheekR.position.x = 0.195;

    const browMat = new THREE.MeshBasicMaterial({ color: '#451a03' });
    const browL = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.058, 6, 8), browMat);
    browL.position.set(-0.124, 0.446, 0.324);
    browL.rotation.z = Math.PI * 0.5 + 0.08;
    const browR = browL.clone();
    browR.position.x = 0.124;
    browR.rotation.z = Math.PI * 0.5 - 0.08;

    headGroup.add(
      leftEye,
      rightEye,
      happyArcL,
      happyArcR,
      nose,
      mouthSmile,
      mouth,
      cheekL,
      cheekR,
      browL,
      browR
    );

    // Sculpted Multi-Layered Flat-Ribbon Studio Hair Groom (surface-outward normal frame, zero sausage tubes)
    const createStageHairLockGeometry = (
      baseRadius: number,
      pts: Array<[number, number, number]>,
      tubularSegments = 16,
      radialSegments = 12
    ): THREE.BufferGeometry => {
      const curve = new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
      const headCenter = new THREE.Vector3(0, 0.02, -0.02);
      const positions: number[] = [];
      const normals: number[] = [];
      const indices: number[] = [];
      for (let i = 0; i <= tubularSegments; i++) {
        const u = i / tubularSegments;
        const p = curve.getPointAt(u);
        const T = curve.getTangentAt(u).normalize();
        const radialOut = new THREE.Vector3().subVectors(p, headCenter);
        if (radialOut.lengthSq() < 1e-5) radialOut.set(0, 1, 0.5);
        radialOut.normalize();
        const B = new THREE.Vector3().crossVectors(T, radialOut);
        if (B.lengthSq() < 1e-5) B.set(1, 0, 0);
        B.normalize();
        const N = new THREE.Vector3().crossVectors(B, T).normalize();

        const rootEase = 0.66 + 0.34 * Math.sin(Math.min(1, u * 4.2) * (Math.PI * 0.5));
        const tipTaper = Math.pow(1 - u * 0.88, 0.72);
        const taper = rootEase * tipTaper;
        const width = baseRadius * taper * 1.46;
        const thickness = baseRadius * taper * 0.62;
        for (let j = 0; j <= radialSegments; j++) {
          const v = (j / radialSegments) * Math.PI * 2;
          const cos = Math.cos(v);
          const sin = Math.sin(v);
          const ridge = sin > 0 ? Math.pow(Math.max(0, 1 - Math.abs(cos)), 1.8) * thickness * 0.36 : 0;
          const offB = width * cos;
          const offN = thickness * sin + ridge;
          const vx = p.x + offB * B.x + offN * N.x;
          const vy = p.y + offB * B.y + offN * N.y;
          const vz = p.z + offB * B.z + offN * N.z;
          positions.push(vx, vy, vz);
          const nx = (cos / Math.max(0.001, width)) * B.x + (sin / Math.max(0.001, thickness)) * N.x;
          const ny = (cos / Math.max(0.001, width)) * B.y + (sin / Math.max(0.001, thickness)) * N.y;
          const nz = (cos / Math.max(0.001, width)) * B.z + (sin / Math.max(0.001, thickness)) * N.z;
          const len = Math.hypot(nx, ny, nz) || 1;
          normals.push(nx / len, ny / len, nz / len);
        }
      }
      const stride = radialSegments + 1;
      for (let i = 0; i < tubularSegments; i++) {
        for (let j = 0; j < radialSegments; j++) {
          const a = i * stride + j;
          const b = (i + 1) * stride + j;
          const c = (i + 1) * stride + (j + 1);
          const d = i * stride + (j + 1);
          indices.push(a, b, d, b, c, d);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setIndex(indices);
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      return geo;
    };

    const hairGroup = new THREE.Group();
    hairGroup.position.set(0, 0.365, 0);
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.378, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hairMat
    );
    cap.scale.set(0.95, 1.07, 1.01);
    cap.position.set(0, 0.02, -0.01);
    cap.rotation.x = -0.20;
    const backHairVolume = new THREE.Mesh(
      new THREE.SphereGeometry(0.368, 28, 22),
      hairMat
    );
    backHairVolume.scale.set(0.94, 1.04, 0.98);
    backHairVolume.position.set(0, -0.01, -0.05);
    const crownVolume = new THREE.Mesh(
      new THREE.SphereGeometry(0.335, 24, 18),
      hairMat
    );
    crownVolume.scale.set(0.96, 0.72, 0.96);
    crownVolume.position.set(0.01, 0.21, 0.02);
    hairGroup.add(cap, backHairVolume, crownVolume);

    const studioLockSplines: Array<{ radius: number; pts: Array<[number, number, number]> }> = [
      // Layered side-parted swept front fringe locks (framing forehead cleanly above eyebrows)
      { radius: 0.104, pts: [[-0.12, 0.35, 0.15], [-0.03, 0.31, 0.29], [0.06, 0.24, 0.345], [0.13, 0.17, 0.335]] },
      { radius: 0.108, pts: [[-0.04, 0.36, 0.14], [0.07, 0.31, 0.29], [0.16, 0.23, 0.338], [0.23, 0.15, 0.315]] },
      { radius: 0.098, pts: [[0.04, 0.35, 0.13], [0.16, 0.29, 0.27], [0.25, 0.21, 0.305], [0.31, 0.12, 0.275]] },
      { radius: 0.096, pts: [[-0.12, 0.34, 0.14], [-0.20, 0.28, 0.27], [-0.26, 0.20, 0.305], [-0.30, 0.11, 0.272]] },
      { radius: 0.088, pts: [[-0.08, 0.35, 0.16], [-0.08, 0.29, 0.31], [-0.04, 0.22, 0.348], [0.00, 0.16, 0.338]] },
      // Contoured sideburns framing the oval jawline & cheekbones
      { radius: 0.090, pts: [[-0.22, 0.27, 0.09], [-0.31, 0.16, 0.19], [-0.335, 0.03, 0.185], [-0.315, -0.09, 0.15]] },
      { radius: 0.090, pts: [[0.22, 0.27, 0.09], [0.31, 0.16, 0.19], [0.335, 0.03, 0.185], [0.315, -0.09, 0.15]] },
      { radius: 0.082, pts: [[-0.27, 0.22, -0.01], [-0.345, 0.10, 0.06], [-0.355, -0.03, 0.065], [-0.33, -0.14, 0.05]] },
      { radius: 0.082, pts: [[0.27, 0.22, -0.01], [0.345, 0.10, 0.06], [0.355, -0.03, 0.065], [0.33, -0.14, 0.05]] },
      // Layered crown feather waves (swept volume, never spiky horns)
      { radius: 0.112, pts: [[-0.10, 0.34, 0.02], [0.00, 0.40, 0.10], [0.13, 0.38, 0.13], [0.23, 0.30, 0.11]] },
      { radius: 0.108, pts: [[-0.04, 0.35, -0.05], [0.08, 0.41, 0.01], [0.21, 0.36, 0.03], [0.30, 0.26, 0.02]] },
      { radius: 0.102, pts: [[0.04, 0.35, -0.03], [-0.09, 0.40, 0.01], [-0.21, 0.35, 0.04], [-0.29, 0.26, 0.04]] },
      { radius: 0.096, pts: [[-0.12, 0.32, -0.08], [-0.24, 0.35, -0.04], [-0.32, 0.25, -0.03], [-0.35, 0.14, -0.02]] },
      { radius: 0.096, pts: [[0.12, 0.32, -0.08], [0.24, 0.35, -0.04], [0.32, 0.25, -0.03], [0.35, 0.14, -0.02]] },
      // Nape locks at back of neck
      { radius: 0.098, pts: [[-0.10, 0.22, -0.26], [-0.14, 0.08, -0.35], [-0.13, -0.07, -0.35], [-0.10, -0.18, -0.31]] },
      { radius: 0.098, pts: [[0.10, 0.22, -0.26], [0.14, 0.08, -0.35], [0.13, -0.07, -0.35], [0.10, -0.18, -0.31]] },
    ];
    for (const s of studioLockSplines) {
      const lockMesh = new THREE.Mesh(createStageHairLockGeometry(s.radius, s.pts), hairMat);
      hairGroup.add(lockMesh);
    }
    headGroup.add(hairGroup);

    // Optional Studio Gaming Headphones nested cleanly inside headGroup (arched above hair crown so it never clips bangs)
    const headphones = new THREE.Group();
    headphones.position.set(0, 0.36, 0);
    const hpBandMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.35, metalness: 0.5 });
    const hpRingMat = new THREE.MeshStandardMaterial({
      color: '#ff471a',
      emissive: '#ea580c',
      emissiveIntensity: 0.4,
    });
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.395, 0.032, 12, 32, Math.PI), hpBandMat);
    band.scale.set(0.95, 1.16, 1.0);
    band.position.set(0, 0.01, -0.045);
    band.rotation.x = -0.28;
    const cupL = new THREE.Mesh(new THREE.CylinderGeometry(0.118, 0.118, 0.078, 16), hpBandMat);
    cupL.rotation.z = Math.PI / 2;
    cupL.position.set(-0.368, -0.01, -0.01);
    const ringL = new THREE.Mesh(new THREE.TorusGeometry(0.092, 0.018, 8, 20), hpRingMat);
    ringL.rotation.y = Math.PI / 2;
    ringL.position.set(-0.412, -0.01, -0.01);
    const cupR = cupL.clone();
    cupR.position.set(0.368, -0.01, -0.01);
    const ringR = ringL.clone();
    ringR.position.set(0.412, -0.01, -0.01);
    headphones.add(band, cupL, ringL, cupR, ringR);
    headGroup.add(headphones);

    const foxBlueMat = new THREE.MeshStandardMaterial({ color: '#0077ff', roughness: 0.42 });
    const foxNavyMat = new THREE.MeshStandardMaterial({ color: '#0b1d51', roughness: 0.45 });
    const foxGoldMat = new THREE.MeshStandardMaterial({ color: '#fde047', emissive: '#ca8a04', emissiveIntensity: 0.16, roughness: 0.36 });
    const foxWhiteMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.45 });
    const foxCyanMat = new THREE.MeshStandardMaterial({ color: '#00e5ff', emissive: '#0284c7', emissiveIntensity: 0.42, roughness: 0.25 });

    // Dedicated Anime Chibi Eyes & Lashes for Cyber-Fox
    const foxFaceGroup = new THREE.Group();
    const foxScleraMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    const foxLashMat = new THREE.MeshBasicMaterial({ color: '#09090b' });
    const foxIrisDeepMat = new THREE.MeshBasicMaterial({ color: '#0284c7' });
    const foxIrisGlowMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const foxPupilDarkMat = new THREE.MeshBasicMaterial({ color: '#051329' });
    const foxBrowMat = new THREE.MeshBasicMaterial({ color: '#0369a1' });
    for (const sx of [-1, 1]) {
      const eyeWrap = new THREE.Group();
      eyeWrap.position.set(sx * 0.138, 0.355, 0.312);
      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.088, 16, 14), foxScleraMat);
      sclera.scale.set(1.06, 1.24, 0.46);
      const lash = new THREE.Mesh(new THREE.TorusGeometry(0.092, 0.017, 8, 18, Math.PI * 0.94), foxLashMat);
      lash.position.set(0, 0.018, 0.022);
      lash.rotation.z = 0.09;
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.068, 14, 12), foxIrisDeepMat);
      iris.scale.set(1.0, 1.18, 0.45);
      iris.position.set(sx * -0.008, -0.004, 0.014);
      const irisGlow = new THREE.Mesh(new THREE.SphereGeometry(0.056, 12, 10), foxIrisGlowMat);
      irisGlow.scale.set(0.95, 0.72, 0.45);
      irisGlow.position.set(sx * -0.008, -0.024, 0.022);
      const pupilCore = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 10), foxPupilDarkMat);
      pupilCore.scale.set(1.0, 1.15, 0.45);
      pupilCore.position.set(sx * -0.008, 0.0, 0.029);
      const specTop = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), foxScleraMat);
      specTop.position.set(sx * -0.008 - 0.026, 0.032, 0.04);
      const specBot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), foxScleraMat);
      specBot.position.set(sx * -0.008 + 0.022, -0.028, 0.04);
      const fBrow = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.015, 0.02), foxBrowMat);
      fBrow.position.set(0, 0.135, 0.015);
      fBrow.rotation.z = sx * -0.14;
      eyeWrap.add(sclera, lash, iris, irisGlow, pupilCore, specTop, specBot, fBrow);
      foxFaceGroup.add(eyeWrap);
    }
    foxFaceGroup.visible = false;
    headGroup.add(foxFaceGroup);

    // Cyber-Fox hip belt + hanging straps + diagonal front-visible 2-tone electric-blue/gold fluffy tail
    const foxHipGroup = new THREE.Group();
    const foxBelt = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.255, 0.055, 20), new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.4 }));
    foxBelt.position.y = 0.02;
    const foxBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.065, 0.04), new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.65, roughness: 0.25 }));
    foxBuckle.position.set(0, 0.02, 0.235);
    foxHipGroup.add(foxBelt, foxBuckle);
    for (const sx of [-1, 1]) {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.34, 0.03), new THREE.MeshStandardMaterial({ color: '#2563eb', roughness: 0.42 }));
      strap.position.set(sx * 0.22, -0.15, 0.08);
      strap.rotation.z = sx * -0.16;
      foxHipGroup.add(strap);
    }
    const foxTailGroup = new THREE.Group();
    foxTailGroup.position.set(0.14, 0.02, -0.2);
    foxTailGroup.rotation.set(-0.36, 0.18, -0.78);
    const tailBase = new THREE.Mesh(new THREE.CapsuleGeometry(0.155, 0.36, 10, 16), foxBlueMat);
    tailBase.position.set(0.06, 0.14, -0.1);
    tailBase.rotation.x = -0.35;
    const tailFluff = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 12), foxBlueMat);
    tailFluff.scale.set(1.0, 1.25, 0.95);
    tailFluff.position.set(0.1, 0.28, -0.14);
    const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.175, 0.36, 14), foxGoldMat);
    tailTip.position.set(0.14, 0.48, -0.18);
    tailTip.rotation.set(-0.22, 0, -0.18);
    const tailTipCap = new THREE.Mesh(new THREE.SphereGeometry(0.145, 12, 10), foxGoldMat);
    tailTipCap.position.set(0.12, 0.37, -0.16);
    foxTailGroup.add(tailBase, tailFluff, tailTipCap, tailTip);
    foxHipGroup.add(foxTailGroup);
    foxHipGroup.visible = false;
    pelvis.add(foxHipGroup);

    // Cyber-Fox hood collar + open hoodie white tee + neon cyan trim + X chest/back emblems
    const foxChestGroup = new THREE.Group();
    const hoodCollarDark = new THREE.Mesh(new THREE.TorusGeometry(0.215, 0.062, 12, 24), new THREE.MeshStandardMaterial({ color: '#0f1d3d', roughness: 0.48 }));
    hoodCollarDark.rotation.x = Math.PI * 0.46;
    hoodCollarDark.position.set(0, 0.635, -0.02);
    const hoodCollarRim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.015, 8, 24), foxCyanMat);
    hoodCollarRim.rotation.x = Math.PI * 0.46;
    hoodCollarRim.position.set(0, 0.655, -0.01);
    const teePanel = new THREE.Mesh(new THREE.BoxGeometry(0.175, 0.45, 0.06), foxWhiteMat);
    teePanel.position.set(0, 0.34, 0.214);
    foxChestGroup.add(hoodCollarDark, hoodCollarRim, teePanel);
    for (const sx of [-1, 1]) {
      const jacketLapel = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.47, 0.08), new THREE.MeshStandardMaterial({ color: '#112248', roughness: 0.46 }));
      jacketLapel.position.set(sx * 0.14, 0.34, 0.195);
      jacketLapel.rotation.y = sx * 0.24;
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.47, 0.052), foxCyanMat);
      trim.position.set(sx * 0.092, 0.34, 0.228);
      const sleeveStripe = new THREE.Mesh(new THREE.CylinderGeometry(0.084, 0.084, 0.036, 14), foxCyanMat);
      sleeveStripe.position.set(sx * 0.30, 0.43, 0);
      foxChestGroup.add(jacketLapel, trim, sleeveStripe);
    }
    for (const barRot of [Math.PI / 4, -Math.PI / 4]) {
      const frontX = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.018, 0.02), foxCyanMat);
      frontX.position.set(0.155, 0.44, 0.245);
      frontX.rotation.z = barRot;
      const backX = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.036, 0.022), foxCyanMat);
      backX.position.set(0, 0.35, -0.248);
      backX.rotation.z = barRot;
      foxChestGroup.add(frontX, backX);
    }
    foxChestGroup.visible = false;
    torso.add(foxChestGroup);

    // Cyber-Fox wider 3-layer pointed ears + lush anime spiky blue bangs & yellow lightning streaks
    const foxEarsGroup = new THREE.Group();
    for (const sx of [-1, 1]) {
      const ew = new THREE.Group();
      ew.position.set(sx * 0.285, 0.67, -0.02);
      ew.rotation.set(0.06, sx * -0.16, sx * -0.44);
      const earOuter = new THREE.Mesh(new THREE.ConeGeometry(0.185, 0.44, 14), foxNavyMat);
      earOuter.scale.set(1.0, 1.0, 0.52);
      earOuter.position.y = 0.15;
      const earMid = new THREE.Mesh(new THREE.ConeGeometry(0.154, 0.36, 12), foxBlueMat);
      earMid.scale.set(1.0, 1.0, 0.46);
      earMid.position.set(0, 0.125, 0.016);
      const earInner = new THREE.Mesh(new THREE.ConeGeometry(0.104, 0.24, 12), foxWhiteMat);
      earInner.scale.set(1.0, 1.0, 0.36);
      earInner.position.set(0, 0.095, 0.04);
      const earTuft = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.17, 8), foxGoldMat);
      earTuft.position.set(sx * -0.06, 0.075, 0.046);
      earTuft.rotation.z = sx * 0.38;
      ew.add(earOuter, earMid, earInner, earTuft);
      foxEarsGroup.add(ew);
    }
    foxEarsGroup.visible = false;
    headGroup.add(foxEarsGroup);

    const foxHairGoldGroup = new THREE.Group();
    const blueBangDefs: Array<[number, number, number, number, number, number, number]> = [
      [-0.20, 0.05, 0.32, 0.38, 0, 0.34, 0.15],
      [-0.08, 0.07, 0.35, 0.44, 0, 0.12, 0.16],
      [0.08, 0.06, 0.35, 0.44, 0, -0.12, 0.16],
      [0.20, 0.05, 0.32, 0.38, 0, -0.34, 0.15],
      [-0.34, -0.04, 0.15, 0.2, 0, 0.58, 0.16],
      [0.34, -0.04, 0.15, 0.2, 0, -0.58, 0.16],
      [-0.22, 0.14, -0.30, -0.38, 0, 0.42, 0.18],
      [0.22, 0.14, -0.30, -0.38, 0, -0.42, 0.18],
    ];
    for (const [bx, by, bz, rx, ry, rz, len] of blueBangDefs) {
      const bs = new THREE.Mesh(new THREE.CapsuleGeometry(0.078, len, 8, 12), foxBlueMat);
      bs.scale.set(1.05, 1.0, 0.68);
      bs.position.set(bx, by, bz);
      bs.rotation.set(rx, ry, rz);
      foxHairGoldGroup.add(bs);
    }
    const goldSpikeDefs: Array<[number, number, number, number, number, number]> = [
      [-0.12, 0.12, 0.34, 0.42, 0, 0.28],
      [0.12, 0.12, 0.34, 0.42, 0, -0.28],
      [-0.01, 0.22, 0.30, 0.36, 0, 0.08],
      [-0.26, 0.08, 0.21, 0.24, 0, 0.55],
      [0.26, 0.08, 0.21, 0.24, 0, -0.55],
      [0.05, 0.34, 0.12, 0.2, 0, -0.18],
    ];
    for (const [gx, gy, gz, rx, ry, rz] of goldSpikeDefs) {
      const gs = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.14, 8, 12), foxGoldMat);
      gs.scale.set(1.0, 1.0, 0.65);
      gs.position.set(gx, gy, gz);
      gs.rotation.set(rx, ry, rz);
      foxHairGoldGroup.add(gs);
    }
    foxHairGoldGroup.visible = false;
    hairGroup.add(foxHairGoldGroup);

    this.scene.add(root);
    this.charRig = {
      root,
      pelvis,
      torso,
      headGroup,
      hairGroup,
      leftEye,
      rightEye,
      leftPupil,
      rightPupil,
      happyArcL,
      happyArcR,
      mouth,
      mouthSmile,
      headphones,
      leftShoulder: leftArm.shoulder,
      leftForearm: leftArm.forearm,
      rightShoulder: rightArm.shoulder,
      rightForearm: rightArm.forearm,
      leftLeg,
      rightLeg,
      torsoEmblem: emblemGroup,
      foxEarsGroup,
      foxHairGoldGroup,
      foxFaceGroup,
      foxChestGroup,
      foxHipGroup,
      foxTailGroup,
      browL,
      browR,
      hoodieMat,
      skinMat,
      hairMat,
      irisMat: darkEyeMat,
      shoeMat,
      mouthMat,
    };
  }

  private applyCharacterAppearance(project: SatsetProject, projectMeta: Record<string, any>): void {
    const charId = String(project.character || projectMeta?.character?.id || 'kreator_3d_studio');
    const custom = project.custom_character;
    const sig = `${charId}|${custom?.skinColor || ''}|${custom?.hairColor || ''}|${custom?.topColor || ''}|${project.warna_brand || ''}`;
    if (sig === this.lastCharSig) return;
    this.lastCharSig = sig;

    const showChar = charId !== 'none';
    this.charRig.root.visible = showChar;
    if (!showChar) return;

    const isCyberFox = charId.includes('rubah');
    this.charRig.headphones.visible =
      !isCyberFox && (charId.includes('headphone') || charId === 'kreator_3d_studio');
    this.charRig.foxEarsGroup.visible = isCyberFox;
    this.charRig.foxHairGoldGroup.visible = isCyberFox;
    this.charRig.foxFaceGroup.visible = isCyberFox;
    this.charRig.leftEye.visible = !isCyberFox;
    this.charRig.rightEye.visible = !isCyberFox;
    this.charRig.browL.visible = !isCyberFox;
    this.charRig.browR.visible = !isCyberFox;
    this.charRig.foxChestGroup.visible = isCyberFox;
    this.charRig.foxHipGroup.visible = isCyberFox;
    this.charRig.torsoEmblem.visible = !isCyberFox;

    let skinHex = custom?.furPrimaryColor || custom?.skinColor || '#f3c1a2';
    let hairHex = custom?.hairColor || '#ff5c28';
    let hoodieHex = custom?.topColor || '#1e293b';

    if (isCyberFox) {
      skinHex = '#fde6d8';
      hairHex = '#0077ff';
      hoodieHex = '#0f1c3a';
      this.charRig.irisMat.color.set('#0284c7');
      this.charRig.shoeMat.color.set('#0b132b');
      this.charRig.mouthMat.color.set('#6b3026');
    } else {
      this.charRig.irisMat.color.set('#111827');
      this.charRig.shoeMat.color.set('#ef4444');
      this.charRig.mouthMat.color.set('#991b1b');
      if (charId.includes('kucing')) {
        skinHex = '#e9d5ff';
        hairHex = '#9333ea';
        hoodieHex = '#1e1b4b';
      } else if (charId.includes('panda')) {
        skinHex = '#f8fafc';
        hairHex = '#10b981';
        hoodieHex = '#064e3b';
      } else if (charId.includes('robot')) {
        skinHex = '#cbd5e1';
        hairHex = '#00d2ff';
        hoodieHex = '#0f172a';
      } else if (charId.includes('alien')) {
        skinHex = '#a7f3d0';
        hairHex = '#10b981';
        hoodieHex = '#1e293b';
      } else if (charId.includes('muslim') || charId.includes('hijab') || charId.includes('cadar')) {
        hoodieHex = project.warna_brand && project.warna_brand !== 'auto' ? project.warna_brand : '#1d4ed8';
        hairHex = '#0f172a';
      }
    }

    this.charRig.skinMat.color.set(skinHex);
    this.charRig.hairMat.color.set(hairHex);
    this.charRig.hoodieMat.color.set(hoodieHex);
  }

  private applyThemeToScene(theme: StageThemeKind, brandHex: string): void {
    const floorMat = this.floorMesh.material as THREE.MeshStandardMaterial;
    const spotMat = this.floorSpotMesh.material as THREE.MeshBasicMaterial;
    const ringColor =
      theme === 'studio_room'
        ? '#ff471a'
        : theme === 'blueprint_cad'
        ? '#38bdf8'
        : theme === 'mechanism_gears'
        ? '#f97316'
        : theme === 'cinema_noir'
        ? '#f59e0b'
        : theme === 'chalkboard_class'
        ? '#34d399'
        : theme === 'minimal_zen'
        ? '#0f766e'
        : theme === 'diorama_data'
        ? '#d97706'
        : brandHex || '#00a8ff';

    floorMat.map = this.floorTextures[theme] || this.floorTextures.dark_cyber!;
    floorMat.needsUpdate = true;

    const showStudioProps = theme === 'studio_room';
    this.backWallMesh.visible = showStudioProps;
    this.backSofaGroup.visible = showStudioProps;
    this.lampGroup.visible = showStudioProps;

    const themeBackdropMap: Record<StageThemeKind, { bg: string; spot: string; hemiSky: string; hemiGround: string; key: number }> = {
      studio_room: { bg: '#dfd4c4', spot: '#ff471a', hemiSky: '#fffbeb', hemiGround: '#78553a', key: 2.15 },
      light_grid: { bg: '#e8f2ff', spot: '#2563eb', hemiSky: '#ffffff', hemiGround: '#93c5fd', key: 1.95 },
      blueprint_cad: { bg: '#071936', spot: '#38bdf8', hemiSky: '#bae6fd', hemiGround: '#0b2447', key: 1.9 },
      mechanism_gears: { bg: '#111827', spot: '#f97316', hemiSky: '#cbd5e1', hemiGround: '#1e293b', key: 2.0 },
      cinema_noir: { bg: '#0d0d10', spot: '#f59e0b', hemiSky: '#fef3c7', hemiGround: '#1c1917', key: 1.85 },
      chalkboard_class: { bg: '#0d231a', spot: '#34d399', hemiSky: '#ecfdf5', hemiGround: '#143326', key: 1.9 },
      minimal_zen: { bg: '#ede9e0', spot: '#0f766e', hemiSky: '#ffffff', hemiGround: '#cbd5e1', key: 1.95 },
      ui_browser_lab: { bg: '#060a14', spot: '#6366f1', hemiSky: '#c7d2fe', hemiGround: '#0f172a', key: 2.05 },
      diorama_data: { bg: '#efe8da', spot: '#d97706', hemiSky: '#fffbeb', hemiGround: '#d6d3d1', key: 2.0 },
      dark_cyber: { bg: '#020b24', spot: '#00d2ff', hemiSky: '#93c5fd', hemiGround: '#081330', key: 2.05 },
    };
    const cfg = themeBackdropMap[theme] || themeBackdropMap.dark_cyber;
    this._colA.set(cfg.bg);
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.copy(this._colA);
    } else {
      this.scene.background = this._colA.clone();
    }
    (this.scene.fog as THREE.Fog).color.set(cfg.bg);
    spotMat.color.set(cfg.spot);
    spotMat.opacity = theme === 'light_grid' || theme === 'minimal_zen' || theme === 'diorama_data' ? 0.22 : 0.34;
    this.hemiLight.color.set(cfg.hemiSky);
    this.hemiLight.groundColor.set(cfg.hemiGround);
    this.keyLight.intensity = cfg.key;

    for (const ped of this.pedestals) {
      const rMat = ped.ring.material as THREE.MeshStandardMaterial;
      rMat.color.set(ringColor);
      rMat.emissive.set(ringColor);
    }
  }

  public renderCompositeFrame(
    targetCtx: CanvasRenderingContext2D,
    project: SatsetProject,
    timelineScenes: any[],
    projectMeta: Record<string, any>,
    timeSec: number,
    width: number,
    height: number
  ): boolean {
    if (this.disposed) return false;

    const rawRatio = project.aspect_ratio || '9:16';
    const ratio: StageAspectRatio =
      rawRatio === '16:9' ? '16:9' : rawRatio === '1:1' ? '1:1' : rawRatio === '3:4' ? '3:4' : '9:16';

    const state = evaluate3DStageFrame(timelineScenes, projectMeta, timeSec, ratio, 60);
    const brandHex =
      (Array.isArray(projectMeta?.brand?.colors) && projectMeta.brand.colors[0]) ||
      (project.warna_brand && project.warna_brand !== 'auto' ? project.warna_brand : '#00a8ff');

    // Sync renderer canvas dimensions (cap on software WebGL for silky-smooth 60fps frame cadence)
    const maxDim = this.isSoftwareGl ? 720 : 1280;
    const scaleDown = Math.min(1, maxDim / Math.max(width, height));
    const rw = Math.max(240, Math.round(width * scaleDown));
    const rh = Math.max(240, Math.round(height * scaleDown));
    if (Math.abs(this.renderer.domElement.width - rw) > 2 || Math.abs(this.renderer.domElement.height - rh) > 2) {
      this.renderer.setSize(rw, rh, false);
    }

    this.applyThemeToScene(state.theme, brandHex);
    this.applyCharacterAppearance(project, projectMeta);

    // Update Camera Rig
    this.camera.aspect = width / Math.max(1, height);
    this.camera.fov = state.camera.fov;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(state.camera.pos[0], state.camera.pos[1], state.camera.pos[2]);
    this._vLook.set(state.camera.lookAt[0], state.camera.lookAt[1], state.camera.lookAt[2]);
    this.camera.lookAt(this._vLook);
    this.camera.rotation.z += state.camera.rollRad;

    // Update Showcase Slab texture at 60Hz so card slides, active focus & live counters animate at 60fps without stutter
    const followKey = state.isFollowed ? '1' : '0';
    const progressBucket = Math.floor(state.localTimeSec * 60);
    const screenKey = `${state.sceneIndex}|${state.theme}|${followKey}|${progressBucket}|${state.headline}`;
    if (screenKey !== this.lastScreenKey) {
      this.lastScreenKey = screenKey;
      drawShowcaseScreenCanvas(this.showcaseScreenCanvas, state, brandHex);
      this.showcaseScreenTexture.needsUpdate = true;
    }

    const sScale = Math.max(0.001, state.showcaseScale);
    const slabRatioScale = ratio === '9:16' ? 0.68 : ratio === '16:9' ? 0.94 : 0.80;
    const finalSlabScale = sScale * slabRatioScale;
    const sceneLayoutShiftX = ((state.sceneIndex % 3) - 1) * (ratio === '16:9' ? 0.12 : 0.06);
    const sceneLayoutShiftY = ((state.sceneIndex % 2) * 2 - 1) * 0.04;
    this.showcaseGroup.scale.set(finalSlabScale, finalSlabScale, finalSlabScale);
    this.showcaseGroup.position.set(
      (ratio === '16:9' ? 0.82 : ratio === '9:16' ? 0.16 : 0.38) + sceneLayoutShiftX,
      (ratio === '16:9' ? 2.92 : ratio === '9:16' ? 3.12 : 3.02) + state.showcaseFloatY + sceneLayoutShiftY,
      -0.92
    );
    this.showcaseGroup.rotation.set(
      state.showcaseTiltX ?? 0.04,
      state.showcaseTiltY + sceneLayoutShiftX * 0.22,
      state.showcaseRollZ ?? 0
    );
    if (this.showcaseGroup.userData?.bracketsGroup) {
      const bScale = 1 + (state.beatPulse || 0) * 0.045 + Math.sin(timeSec * 2.8) * 0.012;
      this.showcaseGroup.userData.bracketsGroup.scale.setScalar(bScale);
    }
    if (this.showcaseGroup.userData?.topRail) {
      this.showcaseGroup.userData.topRail.position.y = 0.92 + Math.sin(timeSec * 3.1 - 0.4) * 0.025;
    }
    if (this.lampGroup?.visible) {
      this.lampGroup.rotation.z = Math.sin(timeSec * 1.35) * 0.032;
    }
    if (this.floorSpotMesh) {
      this.floorSpotMesh.scale.setScalar(1 + Math.sin(timeSec * 2.2) * 0.04 + (state.beatPulse || 0) * 0.05);
    }

    // Update Pedestals + Articulated Motif Sub-Parts + Authentic 3D Platform Logo Medallions
    if (this.activeMotif !== state.motif) {
      this.propGroups.forEach((grp, key) => {
        grp.visible = key === state.motif;
      });
      this.activeMotif = state.motif;
    }
    const activeMotifGroup = this.propGroups.get(state.motif);
    if (activeMotifGroup) {
      this.animateActiveMotifParts(state.motif, activeMotifGroup, state, timeSec);
    }

    const effectivePlatforms =
      state.platforms.length > 0
        ? state.platforms
        : detectMentionedPlatforms(
            `${state.scene?.text || ''} ${project.topik_video || ''} ${project.project_title || ''}`,
            2
          );
    const platSig = effectivePlatforms.join('|');
    if (platSig !== this.lastPlatformSig) {
      this.lastPlatformSig = platSig;
      for (let slot = 0; slot < 2; slot++) {
        const pid = effectivePlatforms[slot] as PlatformLogoId | undefined;
        const hasLogo = Boolean(pid);
        if (this.sideFallbackGroups[slot]) this.sideFallbackGroups[slot].visible = !hasLogo;
        if (this.sideLogoGroups[slot]) this.sideLogoGroups[slot].visible = hasLogo;
        if (hasLogo && pid && this.sideLogoMaterials[slot]) {
          const tex = getPlatformLogoThreeTexture(pid, 256);
          if (tex) {
            this.sideLogoMaterials[slot].map = tex;
            this.sideLogoMaterials[slot].needsUpdate = true;
          }
        }
      }
    }

    // Animate sculpted 3D side objects & front-facing 3D platform medallions
    for (let slot = 0; slot < 2; slot++) {
      const fb = this.sideFallbackGroups[slot];
      if (fb && fb.visible && fb.userData) {
        const { hub, innerRing } = fb.userData;
        if (hub) {
          hub.rotation.y = timeSec * (slot === 0 ? 1.8 : -1.8);
          hub.position.y = (slot === 0 ? 0.22 : 0.28) + Math.sin(timeSec * 2.4 + slot) * 0.025;
        }
        if (innerRing) {
          innerRing.rotation.z = timeSec * (slot === 0 ? 1.1 : -1.1);
        }
      }
      const lg = this.sideLogoGroups[slot];
      if (lg && lg.visible) {
        lg.rotation.y = (slot === 0 ? 0.18 : -0.18) + Math.sin(timeSec * 1.85 + slot * 1.3) * 0.26;
        lg.rotation.x = Math.cos(timeSec * 1.45 + slot) * 0.1;
        if (lg.userData?.halo) {
          lg.userData.halo.rotation.z = timeSec * 2.1;
          lg.userData.halo.scale.setScalar(1 + (state.beatPulse || 0) * 0.08);
        }
      }
    }

    const useTallDiorama = state.theme === 'diorama_data' || state.theme === 'studio_room';
    const pedXPortrait = [-0.14, 0.62, 1.36];
    const pedXWide = [-0.28, 0.72, 1.72];
    const pedBaseHeights = [0.72, 0.92, 0.78];
    for (let i = 0; i < 3; i++) {
      const pVal = Math.max(0.001, state.pedestals[i]);
      const pXZ = ratio === '9:16' ? 0.88 : 1.0;
      const plinthYScale = useTallDiorama ? 1.0 : i === 1 ? 0.68 : 0.42;
      const baseH = pedBaseHeights[i];
      const ped = this.pedestals[i];
      ped.group.position.x = (ratio === '9:16' ? pedXPortrait : pedXWide)[i];
      ped.group.scale.set(pXZ, pVal * pXZ, pXZ);
      ped.shaft.scale.y = plinthYScale;
      ped.shaft.position.y = baseH * 0.5 * plinthYScale;
      const ringBreath = Math.sin(timeSec * 2.8 + i * 1.2) * 0.02;
      ped.ring.position.y = baseH * plinthYScale + ringBreath;
      ped.ring.scale.setScalar(1 + (state.beatPulse || 0) * (i === 1 ? 0.08 : 0.04));
      ped.cap.position.y = baseH * plinthYScale + 0.01;
      if (i === 1) {
        ped.propAnchor.rotation.set(
          state.propTiltX ?? 0.08,
          state.propSpinY,
          state.propRollZ ?? 0
        );
        ped.propAnchor.scale.setScalar((state.propScale ?? 1) * 0.92);
      } else {
        ped.propAnchor.rotation.set(
          Math.sin(timeSec * 1.4 + i) * 0.05,
          (i === 0 ? 0.16 : -0.16) + Math.cos(timeSec * 1.2 + i) * 0.18,
          0
        );
        ped.propAnchor.scale.setScalar(0.92);
      }
      ped.propAnchor.position.y =
        baseH * plinthYScale + 0.42 + state.propBobY * (i === 1 ? 0.85 : 0.65);
    }

    // Update Winged Mascot Orb
    const mascotScale = (ratio === '9:16' ? 0.72 : 1.0) * (1 + (state.beatPulse || 0) * 0.06);
    this.mascotGroup.scale.setScalar(mascotScale);
    this.mascotGroup.position.set(state.mascotPos[0], state.mascotPos[1], state.mascotPos[2]);
    this.mascotGroup.rotation.set(
      Math.cos(timeSec * 1.8) * 0.08,
      -0.35 + Math.sin(timeSec * 1.4) * 0.18,
      Math.sin(timeSec * 1.6) * 0.06
    );
    this.mascotLeftWing.rotation.z = state.mascotWingAngle;
    this.mascotRightWing.rotation.z = -state.mascotWingAngle;

    // Update Unified Articulated 3D Character Rig with 3-Axis Pendulum Arm Follow-Through & Expressive Face
    if (this.charRig.root.visible) {
      const j = state.joints;
      const squash = j.bodySquash || 0;
      const armLagWave = Math.sin(timeSec * 2.85 - 0.62);
      const wristLagWave = Math.sin(timeSec * 2.85 - 1.18);
      this.charRig.root.scale.set(1 - squash * 0.42, 1 + squash, 1 - squash * 0.42);
      this.charRig.pelvis.position.y = 0.72 + j.hipBobY;
      this.charRig.torso.rotation.set(j.torsoLeanX, j.torsoYaw, (j.headRoll || 0) * 0.25);
      this.charRig.headGroup.rotation.set(j.headPitch, j.headYaw, j.headRoll || 0);
      this.charRig.hairGroup.rotation.set(j.hairSwayX || 0, 0, j.hairSwayZ || 0);
      this.charRig.leftShoulder.rotation.set(
        j.leftShoulderX,
        0.10 + Math.max(0, -j.leftShoulderX) * 0.18 + armLagWave * 0.05,
        -Math.max(0.14, j.leftShoulderZ)
      );
      this.charRig.leftForearm.rotation.set(
        j.leftElbowX - 0.08 + armLagWave * 0.08,
        0.16 + Math.max(0, -j.leftElbowX) * 0.22 + wristLagWave * 0.06,
        0.12 + Math.max(0, -j.leftElbowX) * 0.10
      );
      this.charRig.rightShoulder.rotation.set(
        j.rightShoulderX,
        -0.10 - Math.max(0, -j.rightShoulderX) * 0.18 - armLagWave * 0.05,
        -Math.min(-0.14, j.rightShoulderZ)
      );
      this.charRig.rightForearm.rotation.set(
        j.rightElbowX - 0.08 - armLagWave * 0.08,
        -0.16 - Math.max(0, -j.rightElbowX) * 0.22 - wristLagWave * 0.06,
        -0.12 - Math.max(0, -j.rightElbowX) * 0.10
      );
      this.charRig.leftLeg.rotation.x = j.leftHipX || 0;
      this.charRig.rightLeg.rotation.x = j.rightHipX || 0;

      if (this.charRig.foxHipGroup.visible) {
        this.charRig.foxTailGroup.rotation.y = 0.18 + Math.sin(timeSec * 3.8) * 0.26;
        this.charRig.foxTailGroup.rotation.z = -0.78 + Math.cos(timeSec * 2.9) * 0.12;
      }

      const isCyberFox = this.charRig.foxFaceGroup.visible || this.charRig.foxEarsGroup.visible;
      const isHappyArc = j.eyeMode === 'happy_arc' && j.mouthOpen < 0.42;
      const eyeOpenFactor =
        j.eyeMode === 'wide_shock' ? 1.24 : j.eyeMode === 'tired_half' ? 0.56 : 1.0;
      this.charRig.happyArcL.visible = isHappyArc;
      this.charRig.happyArcR.visible = isHappyArc;

      if (isCyberFox) {
        this.charRig.foxFaceGroup.visible = !isHappyArc;
        this.charRig.leftEye.visible = false;
        this.charRig.rightEye.visible = false;
        const foxEyeY = Math.max(0.1, eyeOpenFactor * (1 - j.blinkAmount * 0.92));
        this.charRig.foxFaceGroup.children.forEach((ew, idx) => {
          ew.scale.y = foxEyeY;
          ew.position.x = (idx === 0 ? -0.138 : 0.138) + j.lookDir * 0.016;
          const fBrow = ew.children[ew.children.length - 1];
          if (fBrow) {
            fBrow.position.y = 0.135 + (j.browLift || 0) * 0.14;
            fBrow.rotation.z = (idx === 0 ? 0.14 : -0.14) + (idx === 0 ? 1 : -1) * (j.browTilt || 0);
          }
        });
      } else {
        this.charRig.foxFaceGroup.visible = false;
        this.charRig.leftEye.visible = !isHappyArc;
        this.charRig.rightEye.visible = !isHappyArc;
        const eyeScaleY = Math.max(0.1, eyeOpenFactor * (1 - j.blinkAmount * 0.92));
        const eyeScaleX = j.eyeMode === 'wide_shock' ? 1.14 : 1.0;
        this.charRig.leftEye.scale.set(eyeScaleX, eyeScaleY, 1);
        this.charRig.rightEye.scale.set(eyeScaleX, eyeScaleY, 1);
        this.charRig.leftPupil.position.x = -0.006 + j.lookDir * 0.022;
        this.charRig.rightPupil.position.x = 0.006 + j.lookDir * 0.022;
        this.charRig.browL.position.y = 0.448 + (j.browLift || 0) * 0.055;
        this.charRig.browR.position.y = 0.448 + (j.browLift || 0) * 0.055;
        this.charRig.browL.rotation.z = Math.PI * 0.5 + 0.08 + (j.browTilt || 0);
        this.charRig.browR.rotation.z = Math.PI * 0.5 - 0.08 - (j.browTilt || 0);
      }

      // Expressive Vowel-Synced Mouth Rig (Smile/Worried Arc when closed, Open Vowel A/E/O when speaking)
      const openAmt = j.mouthOpen;
      const shape = j.mouthShape || 'rest';
      const isWorriedOrShocked = j.eyeMode === 'tired_half' || j.eyeMode === 'wide_shock';
      if (openAmt > 0.1 && shape !== 'M' && shape !== 'rest') {
        this.charRig.mouthSmile.visible = false;
        this.charRig.mouth.visible = true;
        this.charRig.mouthMat.color.set('#8c1d2c');
        const widthFactor = j.eyeMode === 'wide_shock' || shape === 'O' ? 0.58 : shape === 'E' ? 1.24 : 0.96;
        const heightFactor = j.eyeMode === 'wide_shock' || shape === 'O' ? 1.16 : shape === 'E' ? 0.68 : 1.12;
        this.charRig.mouth.scale.set(
          (0.68 + openAmt * 0.38) * widthFactor,
          (0.24 + openAmt * 0.78) * heightFactor,
          0.36
        );
      } else {
        this.charRig.mouthSmile.visible = true;
        this.charRig.mouth.visible = false;
        this.charRig.mouthSmile.position.y = isWorriedOrShocked ? 0.212 : 0.242;
        this.charRig.mouthSmile.rotation.z = isWorriedOrShocked ? Math.PI * 0.09 : Math.PI * 1.09;
        const smileWidth = isHappyArc ? 1.18 : isWorriedOrShocked ? 0.85 : shape === 'M' ? 0.78 : 1.0 + openAmt * 0.25;
        const smileHeight = shape === 'M' ? 0.35 : 1.0;
        this.charRig.mouthSmile.scale.set(smileWidth, smileHeight, 1.0);
      }
    }

    // 1. Render True Three.js 3D World
    this.renderer.render(this.scene, this.camera);

    // 2. Blit onto Target 2D Composite Canvas
    targetCtx.save();
    targetCtx.setTransform(1, 0, 0, 1, 0, 0);
    targetCtx.imageSmoothingEnabled = true;
    targetCtx.imageSmoothingQuality = 'high';
    targetCtx.drawImage(this.renderer.domElement, 0, 0, width, height);

    // 3. Overlay Crisp Editorial HUD (Top Brand Badge + Word-by-Word Karaoke Subtitles)
    const sc = Math.min(width / 720, height / 1280);
    const watermark = project.watermark === '' ? '' : project.watermark || 'Graph Motion';
    if (watermark) {
      const pillLabel = `${watermark.toUpperCase()}  ·  ${state.badge}`;
      targetCtx.font = `800 ${Math.round(13.5 * sc)}px "Plus Jakarta Sans", sans-serif`;
      const pw = Math.min(width * 0.72, targetCtx.measureText(pillLabel).width + 38 * sc);
      const pillY = ratio === '16:9' ? height * 0.055 : height * 0.088;
      targetCtx.fillStyle =
        state.theme === 'light_grid' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(2, 11, 36, 0.86)';
      targetCtx.strokeStyle =
        state.theme === 'studio_room' ? 'rgba(255, 71, 26, 0.75)' : 'rgba(56, 189, 248, 0.55)';
      targetCtx.lineWidth = Math.max(1.5, 2 * sc);
      targetCtx.beginPath();
      targetCtx.roundRect(width * 0.5 - pw * 0.5, pillY, pw, 30 * sc, 15 * sc);
      targetCtx.fill();
      targetCtx.stroke();

      targetCtx.fillStyle = '#f8fafc';
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';
      targetCtx.fillText(pillLabel, width * 0.5, pillY + 15 * sc, pw - 24 * sc);
    }

    // Subtitles (Safe-Zone Word-by-Word Karaoke Pill)
    const subDisabled = (project as any).show_subtitles === false || project.subtitle_style === 'off';
    if (!subDisabled && state.words.length > 0) {
      this.drawKaraokeSubtitles(targetCtx, state, width, height, sc, brandHex);
    }

    // Scene Transition Wipe / Flash Overlay at tail of scene
    if (state.transitionOutProgress > 0.005) {
      this.drawTransitionOverlay(targetCtx, state, width, height, brandHex);
    }
    targetCtx.restore();
    return true;
  }

  private drawKaraokeSubtitles(
    ctx: CanvasRenderingContext2D,
    state: Stage3DFrameState,
    width: number,
    height: number,
    sc: number,
    brandHex: string
  ): void {
    const { safeZone, words, activeWordIndex } = state;
    const windowSize = 6;
    const chunkIdx = Math.floor(Math.max(0, activeWordIndex) / windowSize);
    const chunkStart = chunkIdx * windowSize;
    const chunkWords = words.slice(chunkStart, chunkStart + windowSize);
    if (chunkWords.length === 0) return;

    const fontSize = Math.round(25 * sc * safeZone.fontScale);
    ctx.font = `900 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
    const spaceW = ctx.measureText(' ').width;
    const wordWidths = chunkWords.map((w) => ctx.measureText(w.word).width);
    const totalTextW = wordWidths.reduce((a, b) => a + b, 0) + spaceW * Math.max(0, chunkWords.length - 1);
    const maxW = width * safeZone.maxWidthRatio;
    const boxScale = totalTextW > maxW ? maxW / totalTextW : 1;

    const pillW = Math.min(maxW + 34 * sc, totalTextW * boxScale + 36 * sc);
    const pillH = Math.round(48 * sc * safeZone.fontScale);
    const anchorX = width * safeZone.anchorXRatio;
    const anchorY = height * safeZone.bottomYRatio;

    ctx.save();
    ctx.translate(anchorX, anchorY);
    ctx.fillStyle = state.theme === 'light_grid' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(2, 10, 28, 0.88)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = Math.max(1.2, 1.8 * sc);
    ctx.beginPath();
    ctx.roundRect(-pillW * 0.5, -pillH * 0.5, pillW, pillH, 16 * sc);
    ctx.fill();
    ctx.stroke();

    ctx.scale(boxScale, boxScale);
    let cursorX = -totalTextW * 0.5;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const emphHex = state.theme === 'studio_room' ? '#ff6b35' : brandHex === '#2563EB' ? '#facc15' : '#38bdf8';

    for (let i = 0; i < chunkWords.length; i++) {
      const globalIdx = chunkStart + i;
      const tok = chunkWords[i];
      const isActive = globalIdx === activeWordIndex;
      const isSpoken = globalIdx <= activeWordIndex;
      ctx.fillStyle = tok.isEmphasis
        ? emphHex
        : isActive
        ? '#facc15'
        : isSpoken
        ? '#ffffff'
        : 'rgba(226, 232, 240, 0.5)';
      ctx.fillText(tok.word, cursorX, 1 * sc);
      cursorX += wordWidths[i] + spaceW;
    }
    ctx.restore();
  }

  private drawTransitionOverlay(
    ctx: CanvasRenderingContext2D,
    state: Stage3DFrameState,
    width: number,
    height: number,
    brandHex: string
  ): void {
    const p = state.transitionOutProgress;
    const kind = state.transitionType;
    ctx.save();
    if (kind === 'kilas_kamera') {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = Math.sin(p * Math.PI) * 0.72;
      ctx.fillRect(0, 0, width, height);
    } else if (kind === 'geser_kiri' || kind === 'geser_kanan') {
      const dir = kind === 'geser_kanan' ? 1 : -1;
      const sweep = (p * 2 - 1) * width * dir;
      const g = ctx.createLinearGradient(sweep - width * 0.35, 0, sweep + width * 0.35, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.5, brandHex || '#00a8ff');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.75 * Math.sin(p * Math.PI);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = state.theme === 'light_grid' ? '#eef6ff' : '#020b24';
      ctx.globalAlpha = Math.sin(p * Math.PI) * 0.52;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material;
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose());
      } else if (mat) {
        mat.dispose();
      }
    });
    Object.values(this.floorTextures).forEach((t) => t?.dispose());
    disposePlatformLogoTextures();
    this.showcaseScreenTexture.dispose();
    this.envRT.dispose();
    this.pmremGenerator.dispose();
    this.roomEnv.dispose();
    this.renderer.dispose();
  }
}

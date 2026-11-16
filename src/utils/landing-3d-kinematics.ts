export type SpatialFormationMode =
  | 'helix-vortex'
  | 'dna-tunnel'
  | 'amphitheater-matrix'
  | 'portal-crown';

export type ChapterZoomMode = 'zoom-out' | 'zoom-in';

export interface CameraKeyframeShot {
  posX: number;
  posY: number;
  posZ: number;
  lookX: number;
  lookY: number;
  lookZ: number;
  rollZ: number;
  fov: number;
  zoomMode: ChapterZoomMode;
  focalFrameIndex: number;
}

export interface SlowMoFrameLockState {
  /** Time dilation factor: ~0.14 in slow-mo when stopped at a chapter, >1.0 when actively scrolling */
  timeScale: number;
  /** Whether the scene is currently settled in slow-motion dwell at a chapter */
  isSlowMoDwell: boolean;
  /** Current chapter's camera zoom behavior ('zoom-in' on single frame vs 'zoom-out' wide vista) */
  zoomMode: ChapterZoomMode;
  /** Index [0..5] of the contextual frame on the 3D film strip highlighted in the open space */
  focalFrameIndex: number;
  /** Target UV X offset so the contextual frame locks into the open viewport zone */
  targetUvOffsetX: number;
  /** Subtle breathing camera Z offset while dwelling in slow-motion */
  slowMoDollyOffsetZ: number;
  /** SubtleFOV breathing offset in degrees during slow-mo */
  slowMoFovOffset: number;
}

export interface ScrollChoreographyState {
  /** Normalized overall page scroll progress [0..1] */
  scrollProgress: number;
  /** Active chapter index [0..4] */
  activeChapterIndex: number;
  /** View phase: 0 = Hero Wide Reel, 1 = Dynamic Multi-Curve Chapters, 2 = Studio Login Portal */
  viewPhase: 0 | 1 | 2;
  /** Dominant 3D formation mode */
  formationMode: SpatialFormationMode;
  /** Blend weights [0..1] across camera chapters */
  helixWeight: number;
  tunnelWeight: number;
  matrixWeight: number;
  portalWeight: number;
  /** Interpolated 3D Camera Position & LookAt target */
  camPosX: number;
  camPosY: number;
  camPosZ: number;
  lookAtX: number;
  lookAtY: number;
  lookAtZ: number;
  camRollZ: number;
  camFov: number;
  /** Current chapter's zoom mode ('zoom-out' | 'zoom-in') */
  zoomMode: ChapterZoomMode;
  /** Contextual film frame index [0..5] for this chapter */
  focalFrameIndex: number;
  /** Dynamic curvature morph factor [0..1] */
  macroCouplerSeparation: number;
  /** Index of the primary focal frame */
  focalRungIndex: number;
  /** Legacy compatibility fields */
  targetPositionX: number;
  targetPositionY: number;
  targetCameraZ: number;
  scrollScale: number;
  scrollRotationY: number;
  scrollRotationX: number;
  ringRadiusMultiplier: number;
  depthSpread: number;
  flankingVisibility: number;
  bladeExpansion: number;
}

export interface HelixRungTransform {
  rungIndex: number;
  spineX: number;
  spineY: number;
  spineZ: number;
  ax: number;
  ay: number;
  az: number;
  bx: number;
  by: number;
  bz: number;
  twistAngle: number;
  couplerGap: number;
  opticalGlow: number;
}

export interface PointerParallaxOffset {
  rotX: number;
  rotY: number;
  posX: number;
  posY: number;
  cursorWorldX: number;
  cursorWorldY: number;
}

export interface CursorCardMagnetism {
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  tiltX: number;
  tiltY: number;
  scaleBoost: number;
  glowIntensity: number;
}

export interface ClickSpinBounceState {
  spinProgressRad: number;
  bounceScaleOffset: number;
  bounceYOffset: number;
  isActive: boolean;
}

export interface CardOrbitTransform {
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scale: number;
}

export interface EqualizerBarTransform {
  x: number;
  y: number;
  z: number;
  rotZ: number;
  scaleY: number;
  energy: number;
}

export interface WaterBubbleTransform {
  x: number;
  y: number;
  z: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  wobblePhase: number;
  shimmer: number;
  /** Whether the bubble is behind the 3D film reel ('behind') or in front ('front') */
  depthLayer: 'behind' | 'front';
  /** Signed Z offset relative to the nearest point on the 3D film ribbon */
  zOffsetFromRibbon: number;
}

export function clamp01(val: number): number {
  if (!Number.isFinite(val)) return 0;
  return Math.max(0, Math.min(1, val));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / Math.max(1e-6, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * 5-Shot Cinematic Camera Keyframes that alternate between Wide Zoom-Out and
 * Contextual Per-Frame Macro Zoom-In inside the open negative space opposite the text!
 * - Shot 0 (Ch 01, p=0.00): Wide Zoom-Out (`posZ: 5.65, fov: 39`) — Text on Mid-Left, Reel Frame 0 (3D Data Chart) in open Right/Center-Right space.
 * - Shot 1 (Ch 02, p=0.25): Per-Frame Zoom-In (`posZ: 3.18, fov: 31`) — Text on Bottom-Right, Camera zooms into Reel Frame 1 (Storyboard & Character Hook) in open Upper-Left/Center-Left space.
 * - Shot 2 (Ch 03, p=0.50): Sweeping Canopy Zoom-Out (`posZ: 5.15, fov: 38`) — Text on Top-Left, Reel arches across open Right/Bottom-Right space showing Frame 2 (24kHz Voice Waveform).
 * - Shot 3 (Ch 04, p=0.75): Per-Frame Macro Zoom-In (`posZ: 2.95, fov: 30`) — Text on Top-Right, Camera zooms up close into Reel Frame 3 (3D Vector Mesh & Spring 60fps Curve) in open Center-Left/Bottom-Left space.
 * - Shot 4 (Ch 05, p=1.00): Panoramic Portal Zoom-Out (`posZ: 5.45, fov: 38`) — Portal on Left, Reel sweeping across Right.
 */
const CAMERA_SHOTS_DESKTOP: CameraKeyframeShot[] = [
  // Shot 0 (Ch 01, p=0.00): Wide Zoom-Out
  {
    posX: 0.12,
    posY: 0.04,
    posZ: 5.65,
    lookX: -0.05,
    lookY: -0.02,
    lookZ: 0.0,
    rollZ: -0.05,
    fov: 39,
    zoomMode: 'zoom-out',
    focalFrameIndex: 0,
  },
  // Shot 1 (Ch 02, p=0.25): Per-Frame Diagonal Arch Zoom-In — frames the arching 3D film reel across the viewport
  {
    posX: 0.05,
    posY: 1.35,
    posZ: 3.32,
    lookX: 0.05,
    lookY: 1.25,
    lookZ: -0.25,
    rollZ: 0.14,
    fov: 35,
    zoomMode: 'zoom-in',
    focalFrameIndex: 1,
  },
  // Shot 2 (Ch 03, p=0.50): Sweeping Diagonal Canopy Zoom-Out
  {
    posX: 0.18,
    posY: -0.15,
    posZ: 5.15,
    lookX: -0.25,
    lookY: -0.1,
    lookZ: 0.2,
    rollZ: -0.18,
    fov: 38,
    zoomMode: 'zoom-out',
    focalFrameIndex: 2,
  },
  // Shot 3 (Ch 04, p=0.75): Per-Frame Macro Diagonal Arch Zoom-In across Open Top-Left Sky
  {
    posX: -0.05,
    posY: -0.68,
    posZ: 3.12,
    lookX: 0.42,
    lookY: -0.88,
    lookZ: -0.65,
    rollZ: 0.68,
    fov: 34,
    zoomMode: 'zoom-in',
    focalFrameIndex: 3,
  },
  // Shot 4 (Ch 05, p=1.00): Panoramic Portal Zoom-Out
  {
    posX: 0.18,
    posY: 0.06,
    posZ: 5.45,
    lookX: -0.1,
    lookY: -0.05,
    lookZ: 0.0,
    rollZ: -0.08,
    fov: 38,
    zoomMode: 'zoom-out',
    focalFrameIndex: 4,
  },
];

function interpolateCameraShots(
  progress: number,
  isMobile: boolean
): CameraKeyframeShot {
  const p = clamp01(progress);
  const maxIdx = CAMERA_SHOTS_DESKTOP.length - 1;
  const scaled = p * maxIdx;
  const idx0 = Math.min(maxIdx - 1, Math.floor(scaled));
  const idx1 = idx0 + 1;
  const localT = smoothstep(0, 1, scaled - idx0);

  const s0 = CAMERA_SHOTS_DESKTOP[idx0];
  const s1 = CAMERA_SHOTS_DESKTOP[idx1];

  const mobileZBoost = isMobile ? 1.35 : 0;
  const nearestShot = localT < 0.5 ? s0 : s1;

  return {
    posX: lerp(s0.posX, s1.posX, localT) * (isMobile ? 0.65 : 1),
    posY: lerp(s0.posY, s1.posY, localT),
    posZ: lerp(s0.posZ, s1.posZ, localT) + mobileZBoost,
    lookX: lerp(s0.lookX, s1.lookX, localT) * (isMobile ? 0.65 : 1),
    lookY: lerp(s0.lookY, s1.lookY, localT),
    lookZ: lerp(s0.lookZ, s1.lookZ, localT),
    rollZ: lerp(s0.rollZ, s1.rollZ, localT),
    fov: lerp(s0.fov, s1.fov, localT),
    zoomMode: nearestShot.zoomMode,
    focalFrameIndex: nearestShot.focalFrameIndex,
  };
}

/**
 * Computes Slow-Motion Time Dilation & Contextual Per-Frame UV Lock when the user
 * stops at a chapter (`saat berhenti di tiap tulisan dibuat slowmo dan zoom out atau zoom in per frame reelsnya`).
 */
export function computeSlowMoAndFrameLock(
  scrollProgress: number,
  scrollVelocity: number,
  dwellElapsedSec: number
): SlowMoFrameLockState {
  const p = clamp01(scrollProgress);
  const absVel = Math.min(10, Math.abs(scrollVelocity));

  // When scrollVelocity is near 0, enter smooth cinematic Slow-Motion (timeScale = 0.14).
  // When actively scrolling, accelerate up to 1.65x so transitions feel kinetic and responsive.
  const activeMotionBoost = smoothstep(0.02, 0.45, absVel);
  const timeScale = lerp(0.14, 1.65, activeMotionBoost);
  const isSlowMoDwell = absVel < 0.08;

  const shot = interpolateCameraShots(p, false);

  // Each of the 6 frames on the 3072px texture spans 1/6 of a repeat cycle.
  // Align the contextual focalFrameIndex [0..5] into the open viewport curve:
  const targetUvOffsetX =
    -(shot.focalFrameIndex / 6) * 1.85 - p * 0.65 - dwellElapsedSec * 0.008;

  // Gentle slow-mo breathing dolly & FOV micro-pulse while settled on a chapter
  const breathWave = Math.sin(dwellElapsedSec * 1.45);
  const slowMoFactor = 1 - activeMotionBoost;
  const slowMoDollyOffsetZ =
    (shot.zoomMode === 'zoom-in' ? -0.12 : 0.14) * slowMoFactor +
    breathWave * 0.06 * slowMoFactor;
  const slowMoFovOffset =
    (shot.zoomMode === 'zoom-in' ? -1.2 : 1.0) * slowMoFactor +
    breathWave * 0.4 * slowMoFactor;

  return {
    timeScale,
    isSlowMoDwell,
    zoomMode: shot.zoomMode,
    focalFrameIndex: shot.focalFrameIndex,
    targetUvOffsetX,
    slowMoDollyOffsetZ,
    slowMoFovOffset,
  };
}

export function computeScrollChoreography(
  scrollY: number,
  maxScrollY: number,
  isMobileViewport: boolean
): ScrollChoreographyState {
  const safeMax = Math.max(1, maxScrollY);
  const scrollProgress = clamp01(scrollY / safeMax);

  let activeChapterIndex = 0;
  if (scrollProgress >= 0.8) {
    activeChapterIndex = 4;
  } else if (scrollProgress >= 0.6) {
    activeChapterIndex = 3;
  } else if (scrollProgress >= 0.38) {
    activeChapterIndex = 2;
  } else if (scrollProgress >= 0.16) {
    activeChapterIndex = 1;
  } else {
    activeChapterIndex = 0;
  }

  let viewPhase: 0 | 1 | 2 = 0;
  if (scrollProgress >= 0.78) {
    viewPhase = 2;
  } else if (scrollProgress >= 0.16) {
    viewPhase = 1;
  } else {
    viewPhase = 0;
  }

  const toTunnel = smoothstep(0.08, 0.24, scrollProgress);
  const toMatrix = smoothstep(0.36, 0.52, scrollProgress);
  const toPortal = smoothstep(0.68, 0.84, scrollProgress);

  const helixWeight = 1 - toTunnel;
  const tunnelWeight = toTunnel * (1 - toMatrix);
  const matrixWeight = toMatrix * (1 - toPortal);
  const portalWeight = toPortal;

  let formationMode: SpatialFormationMode = 'helix-vortex';
  if (portalWeight >= 0.5) {
    formationMode = 'portal-crown';
  } else if (matrixWeight >= 0.45) {
    formationMode = 'amphitheater-matrix';
  } else if (tunnelWeight >= 0.45) {
    formationMode = 'dna-tunnel';
  }

  const shot = interpolateCameraShots(scrollProgress, isMobileViewport);

  const openIn = smoothstep(0.12, 0.38, scrollProgress);
  const closeOut = 1 - smoothstep(0.58, 0.82, scrollProgress);
  const macroCouplerSeparation = clamp01(openIn * closeOut);

  const focalRungIndex = 7;

  return {
    scrollProgress,
    activeChapterIndex,
    viewPhase,
    formationMode,
    helixWeight,
    tunnelWeight,
    matrixWeight,
    portalWeight,
    camPosX: shot.posX,
    camPosY: shot.posY,
    camPosZ: shot.posZ,
    lookAtX: shot.lookX,
    lookAtY: shot.lookY,
    lookAtZ: shot.lookZ,
    camRollZ: shot.rollZ,
    camFov: shot.fov,
    zoomMode: shot.zoomMode,
    focalFrameIndex: shot.focalFrameIndex,
    macroCouplerSeparation,
    focalRungIndex,
    targetPositionX: -shot.lookX,
    targetPositionY: -shot.lookY,
    targetCameraZ: shot.posZ,
    scrollScale: 1.0,
    scrollRotationY: scrollProgress * Math.PI * 1.4,
    scrollRotationX: Math.sin(scrollProgress * Math.PI * 2) * 0.22,
    ringRadiusMultiplier: 1.0 + toTunnel * 0.35,
    depthSpread: 1.0 + toTunnel * 1.2,
    flankingVisibility: clamp01(1 - smoothstep(0.05, 0.22, scrollProgress)),
    bladeExpansion: macroCouplerSeparation,
  };
}

export function computeHelixRungTransform(
  rungIndex: number,
  totalRungs: number,
  elapsedSec: number,
  scrollProgress: number,
  macroCouplerSeparation: number
): HelixRungTransform {
  const safeTotal = Math.max(2, totalRungs);
  const norm = rungIndex / (safeTotal - 1);
  const spineX = (norm - 0.5) * 16.4;

  const wavePhase =
    norm * Math.PI * 2.2 - elapsedSec * 0.22 + scrollProgress * 1.8;
  const spineY = Math.sin(wavePhase) * 0.42;
  const spineZ = Math.cos(wavePhase * 0.8) * 0.28;

  const twistAngle =
    norm * Math.PI * 3.6 - elapsedSec * 0.32 - scrollProgress * Math.PI * 1.35;
  const radius = 0.96;

  const dy = Math.sin(twistAngle) * radius;
  const dz = Math.cos(twistAngle) * radius;

  const distFromFocal = Math.abs(rungIndex - 7);
  const focalFactor = Math.exp(-(distFromFocal * distFromFocal) / 1.8);
  const pulse = 0.5 + 0.5 * Math.sin(elapsedSec * 2.6 - rungIndex * 0.7);

  const couplerGap =
    0.045 +
    focalFactor * macroCouplerSeparation * 0.28 +
    (1 - focalFactor) * macroCouplerSeparation * 0.08 +
    pulse * 0.015;

  const opticalGlow =
    0.55 + focalFactor * macroCouplerSeparation * 1.45 + pulse * 0.35;

  return {
    rungIndex,
    spineX,
    spineY,
    spineZ,
    ax: spineX,
    ay: spineY + dy,
    az: spineZ + dz,
    bx: spineX,
    by: spineY - dy,
    bz: spineZ - dz,
    twistAngle,
    couplerGap,
    opticalGlow,
  };
}

export function computeOrbitalCardTransform(
  cardIndex: number,
  totalCards: number,
  elapsedSec: number,
  choreo: ScrollChoreographyState,
  isMobileViewport: boolean
): CardOrbitTransform {
  const safeTotal = Math.max(1, totalCards);
  const normIdx = cardIndex / safeTotal;
  const baseAngle = normIdx * Math.PI * 2;
  const orbitAngle =
    baseAngle + elapsedSec * 0.14 + choreo.scrollRotationY * 0.48;

  const strand = cardIndex % 2 === 0 ? 1 : -1;
  const helixRx =
    (isMobileViewport ? 2.55 : 3.95) * choreo.ringRadiusMultiplier;
  const helixRy =
    (isMobileViewport ? 1.95 : 2.28) * choreo.ringRadiusMultiplier;
  const x = Math.cos(orbitAngle) * helixRx;
  const y = Math.sin(orbitAngle) * helixRy;
  const z = -0.85 + strand * Math.sin(orbitAngle + elapsedSec * 0.5) * 0.45;

  return {
    x,
    y,
    z,
    rotX: Math.sin(orbitAngle) * 0.14,
    rotY: -Math.cos(orbitAngle) * 0.22,
    rotZ: Math.sin(orbitAngle) * 0.12 * strand,
    scale: 0.88 + (cardIndex % 3) * 0.06,
  };
}

export function computeEqualizerCrownBarTransform(
  barIndex: number,
  totalBars: number,
  elapsedSec: number,
  cursorWorldX: number,
  cursorWorldY: number,
  scrollProgress: number
): EqualizerBarTransform {
  const safeTotal = Math.max(1, totalBars);
  const angle = (barIndex / safeTotal) * Math.PI * 2 + elapsedSec * 0.25;
  const radius = 1.95 + Math.sin(scrollProgress * Math.PI) * 0.35;

  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const z = Math.sin(angle * 3 + elapsedSec * 1.6) * 0.22;

  const dx = cursorWorldX - x;
  const dy = cursorWorldY - y;
  const cursorDistSq = dx * dx + dy * dy;
  const cursorBoost = Math.exp(-cursorDistSq / (2 * 1.8 * 1.8));

  const harmonic1 = Math.sin(angle * 6 - elapsedSec * 4.2) * 0.5 + 0.5;
  const harmonic2 = Math.cos(angle * 4 + elapsedSec * 2.8) * 0.5 + 0.5;
  const energy = clamp01(
    0.2 + harmonic1 * 0.45 + harmonic2 * 0.25 + cursorBoost * 0.65
  );
  const scaleY = 0.45 + energy * 1.85;

  return {
    x,
    y,
    z,
    rotZ: angle - Math.PI * 0.5,
    scaleY,
    energy,
  };
}

export function computeCursorCardMagnetism(
  cardX: number,
  cardY: number,
  cursorWorldX: number,
  cursorWorldY: number,
  cursorSpeed = 0
): CursorCardMagnetism {
  const dx = cursorWorldX - cardX;
  const dy = cursorWorldY - cardY;
  const distSq = dx * dx + dy * dy;

  const influence = Math.exp(-distSq / (2 * 1.55 * 1.55));
  const speedBoost = 1 + Math.min(1.25, cursorSpeed * 0.85);

  const offsetX = dx * 0.2 * influence;
  const offsetY = dy * 0.2 * influence;
  const offsetZ = influence * 0.82 * speedBoost;

  const tiltY = clampRange(dx * 0.26 * influence, -0.48, 0.48);
  const tiltX = clampRange(-dy * 0.26 * influence, -0.48, 0.48);

  const scaleBoost = 1 + influence * 0.2 * speedBoost;
  const glowIntensity = 0.14 + influence * 0.96;

  return {
    offsetX: offsetX || 0,
    offsetY: offsetY || 0,
    offsetZ: offsetZ || 0,
    tiltX: tiltX || 0,
    tiltY: tiltY || 0,
    scaleBoost,
    glowIntensity,
  };
}

function clampRange(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(min, Math.min(max, v));
}

export function computePointerParallax(
  normX: number,
  normY: number,
  intensity = 1.0
): PointerParallaxOffset {
  const cx = Math.max(-1, Math.min(1, Number.isFinite(normX) ? normX : 0));
  const cy = Math.max(-1, Math.min(1, Number.isFinite(normY) ? normY : 0));

  return {
    rotY: cx * 0.45 * intensity || 0,
    rotX: -cy * 0.35 * intensity || 0,
    posX: cx * 0.38 * intensity || 0,
    posY: cy * 0.28 * intensity || 0,
    cursorWorldX: cx * 4.4 || 0,
    cursorWorldY: cy * 3.0 || 0,
  };
}

export function computeHoverVisualTargets(
  isHovered: boolean,
  isDragging: boolean
) {
  const active = isHovered || isDragging;
  return {
    targetHoverScale: active ? 1.12 : 1.0,
    targetEmissiveIntensity: active ? 1.45 : 0.48,
    targetGlowLightIntensity: active ? 5.2 : 2.4,
    targetRingHighlight: active ? 0.95 : 0.28,
  };
}

export function evaluateClickSpinBounce(
  elapsedSec: number,
  durationSec = 0.95
): ClickSpinBounceState {
  if (elapsedSec < 0 || elapsedSec >= durationSec) {
    return {
      spinProgressRad: elapsedSec >= durationSec ? Math.PI * 2 : 0,
      bounceScaleOffset: 0,
      bounceYOffset: 0,
      isActive: false,
    };
  }

  const t = clamp01(elapsedSec / durationSec);
  const easeOutCubic = 1 - Math.pow(1 - t, 3);
  const spinProgressRad = easeOutCubic * Math.PI * 2;

  const decay = Math.exp(-4.2 * t);
  const wave = Math.sin(t * Math.PI * 3.5);
  const bounceScaleOffset = wave * decay * 0.16;
  const bounceYOffset = Math.sin(t * Math.PI * 2) * decay * 0.2;

  return {
    spinProgressRad,
    bounceScaleOffset,
    bounceYOffset,
    isActive: true,
  };
}

export interface FilmRibbonPointState {
  u: number;
  x: number;
  y: number;
  z: number;
  /** Banking twist angle (radians) of the film strip surface */
  bankAngle: number;
  /** Expansion gap metric at this point */
  spliceGap: number;
  /** Emissive intensity of the film frame highlights */
  spliceGlow: number;
}

/**
 * Computes a 3D point along the ultra-long, full-bleed Cinema Film Reels Ribbon (`span = 24`).
 * - Ends (`u=0` and `u=1`) always extend far beyond the left/right/top/bottom camera frustum.
 * - Its curvature (`lengkungannya`), wave phase, S-fold overhang, and diagonal tilt dynamically
 *   morph across `scrollProgress` [0..1] so every chapter places the focal reel curve inside
 *   the open negative space opposite the chapter's text!
 */
export function computeFilmRibbonPoint(
  uNorm: number,
  elapsedSec: number,
  scrollProgress: number,
  macroCouplerSeparation: number
): FilmRibbonPointState {
  const u = clamp01(uNorm);
  const p = clamp01(scrollProgress);
  const t = u - 0.5; // [-0.5 .. +0.5]

  const waveCycles = 4.6 + Math.sin(p * Math.PI * 2.0) * 1.1;
  // Deterministic phase per scrollProgress so each chapter has a distinct, fixed 3D curve pose
  // (`lengkungan reelsnya jangan bergerak bebas ... posisi reels tetap`)
  const phase = p * Math.PI * 3.2 + 0.34;
  const theta = t * Math.PI * waveCycles + phase;

  const foldOverhang = Math.sin(theta * 2.0) * 0.68;
  const d = t * 24.0 + foldOverhang;

  const nPrimary = -Math.cos(theta) * (1.28 + 0.25 * Math.sin(p * Math.PI));
  const nHarmonic =
    Math.sin(t * Math.PI * 2.0 + p * Math.PI * 2.5) * 0.72 +
    Math.sin(u * Math.PI * 3.0 + p * Math.PI) * 0.1;
  const n = nPrimary + nHarmonic;

  const slopeAngle = -0.44 + Math.sin(p * Math.PI * 2.3) * 0.58;
  const cosA = Math.cos(slopeAngle);
  const sinA = Math.sin(slopeAngle);

  const offsetX = Math.sin(p * Math.PI * 2.0) * 0.35;
  const offsetY = Math.cos(p * Math.PI * 2.0) * 0.22;

  const x = d * cosA - n * sinA + offsetX;
  const y = d * sinA + n * cosA + offsetY;
  const z =
    Math.sin(theta + p * Math.PI * 1.5) * 0.78 +
    Math.cos(t * Math.PI * 3.0 + p * Math.PI * 1.2) * 0.24;

  const bankAngle =
    -0.22 +
    Math.sin(p * Math.PI * 2.0 + u * Math.PI * 2.0) * 0.28 +
    Math.cos(theta * 0.5) * 0.14;

  const distFromSplice = Math.abs(u - 0.46);
  const focalFactor = Math.exp(-(distFromSplice * distFromSplice) / 0.018);
  const pulse = 0.5 + 0.5 * Math.sin(elapsedSec * 2.8 - u * 8.0);

  const spliceGap =
    0.04 +
    focalFactor * macroCouplerSeparation * 0.26 +
    (1 - focalFactor) * macroCouplerSeparation * 0.05 +
    pulse * 0.012;

  const spliceGlow =
    0.65 + focalFactor * macroCouplerSeparation * 1.55 + pulse * 0.35;

  return {
    u,
    x,
    y,
    z,
    bankAngle,
    spliceGap,
    spliceGlow,
  };
}

export function computeWaterBubbleTransform(
  bubbleIndex: number,
  totalBubbles: number,
  elapsedSec: number,
  scrollProgress: number
): WaterBubbleTransform {
  const safeTotal = Math.max(1, totalBubbles);
  const norm = bubbleIndex / safeTotal;

  const uAnchor = (norm * 0.86 + 0.07 + elapsedSec * 0.018) % 1.0;
  const ribbonPt = computeFilmRibbonPoint(
    uAnchor,
    elapsedSec,
    scrollProgress,
    0
  );

  // Only every 4th bubble (25%) is in front of the reels; 75% are BEHIND the reels
  // so the front of the film strip is never cluttered or blocked!
  const isFront = bubbleIndex % 4 === 1;
  const depthLayer: 'behind' | 'front' = isFront ? 'front' : 'behind';

  const goldenAngle = bubbleIndex * 2.399963229728653;
  // Front bubbles are pushed further outward radially so they don't cover the center of the reel frames
  const radialDist = isFront
    ? 1.15 + (bubbleIndex % 3) * 0.32
    : 0.45 + (bubbleIndex % 5) * 0.24;

  const floatCycle =
    (elapsedSec * (0.28 + (bubbleIndex % 5) * 0.06) + norm * 6.0) % 3.6;
  const riseOffset = (floatCycle - 1.8) * 0.72;

  const wobblePhase =
    elapsedSec * (2.2 + (bubbleIndex % 4) * 0.45) + bubbleIndex * 1.3 + 0.65;
  const lateralSwirl = Math.sin(wobblePhase * 0.7) * 0.32;

  // Behind bubbles sit clearly behind the ribbon (-0.78 to -1.53 in Z);
  // Front bubbles sit gently in front (+0.38 to +0.66 in Z) at the periphery.
  const zOffsetFromRibbon = isFront
    ? 0.38 + (bubbleIndex % 3) * 0.14
    : -0.78 - (bubbleIndex % 4) * 0.25;

  const x = ribbonPt.x + Math.cos(goldenAngle) * radialDist + lateralSwirl;
  const y = ribbonPt.y + Math.sin(goldenAngle) * radialDist * 0.65 + riseOffset;
  const z = ribbonPt.z + zOffsetFromRibbon;

  // Front bubbles are smaller & subtler; larger atmospheric bubbles stay behind the reels
  const baseRadius = isFront
    ? 0.065 + (bubbleIndex % 2) * 0.025
    : bubbleIndex % 4 === 0
    ? 0.165
    : 0.105 + (bubbleIndex % 3) * 0.025;
  const squash = 1.0 + Math.sin(wobblePhase) * 0.18;
  const stretch = 1.0 - Math.sin(wobblePhase) * 0.14;

  const shimmer = 0.55 + 0.45 * Math.sin(wobblePhase * 1.3);

  return {
    x,
    y,
    z,
    scaleX: baseRadius * squash,
    scaleY: baseRadius * stretch,
    scaleZ: baseRadius * (1.0 + Math.cos(wobblePhase) * 0.15),
    wobblePhase,
    shimmer,
    depthLayer,
    zOffsetFromRibbon,
  };
}

export interface MorphoCursorWakeState {
  /** Normalized wake intensity [0..1] driven by cursor/finger swipe velocity */
  wakeEnergy: number;
  /** Blinding white-core bloom intensity [0..1] */
  whiteCoreIntensity: number;
  /** Direction angle (radians) of the cursor/finger swipe */
  swipeAngleRad: number;
  /** Crescent arc radius in normalized viewport/world units */
  crescentRadius: number;
  /** Instantaneous speed in normalized screen units per second */
  cursorSpeed: number;
  /** Whether an active touch/swipe wave is currently erupting */
  isErupting: boolean;
}

export interface SwarmParticleState {
  x: number;
  y: number;
  z: number;
  /** Particle size multiplier boosted by cursor proximity */
  sizeMultiplier: number;
  /** Color blend factor [0..1]: 0 = deep cobalt/violet, 0.5 = electric cyan, 1.0 = blinding white core */
  heatCoreBlend: number;
  /** Radial/vortex displacement magnitude caused by cursor/touch swipe */
  dispersionMagnitude: number;
}

/**
 * Computes the interactive Morpho Crescent Light-Wake state (`seperti di video`)
 * when the user touches, drags, or swipes their cursor/finger across the viewport.
 */
export function computeMorphoCursorWakeState(
  cursorNormX: number,
  cursorNormY: number,
  prevNormX: number,
  prevNormY: number,
  dtSec: number,
  prevWakeEnergy: number,
  isPointerDown = false
): MorphoCursorWakeState {
  const safeDt = Math.max(0.001, Math.min(0.25, dtSec));
  const dx = cursorNormX - prevNormX;
  const dy = cursorNormY - prevNormY;
  const dist = Math.hypot(dx, dy);
  const cursorSpeed = dist / safeDt;

  // Surge wakeEnergy rapidly on movement or touch-hold, decay smoothly like bioluminescent phosphor
  const velocityImpulse = clamp01(cursorSpeed * 0.65 + (isPointerDown ? 0.55 : 0));
  const decayFactor = Math.exp(-safeDt * 2.6);
  const wakeEnergy = clamp01(Math.max(velocityImpulse, prevWakeEnergy * decayFactor));

  const swipeAngleRad = dist > 1e-4 ? Math.atan2(dy, dx) : 0;
  const whiteCoreIntensity = clamp01(Math.pow(wakeEnergy, 0.72) * 1.15);
  const crescentRadius = 0.14 + wakeEnergy * 0.42;

  return {
    wakeEnergy,
    whiteCoreIntensity,
    swipeAngleRad,
    crescentRadius,
    cursorSpeed,
    isErupting: wakeEnergy > 0.12,
  };
}

/**
 * Computes the 3D position and bioluminescent heat-core blend for each particle in the
 * Morpho Iridescent Particle Swarm around the 3D reels + cursor/touch wake.
 */
export function computeSwarmParticleDispersion(
  particleIndex: number,
  totalParticles: number,
  elapsedSec: number,
  scrollProgress: number,
  cursorWorldX: number,
  cursorWorldY: number,
  wakeEnergy: number,
  swipeAngleRad = 0
): SwarmParticleState {
  const safeTotal = Math.max(1, totalParticles);
  const norm = particleIndex / safeTotal;

  // Anchor along the 3D film reel spine with butterfly-wing / crescent harmonic lobes
  const uRibbon = (norm * 0.92 + 0.04) % 1.0;
  const ribbonPt = computeFilmRibbonPoint(uRibbon, elapsedSec, scrollProgress, 0);

  const golden = particleIndex * 2.399963229728653;
  const wingLobe = Math.sin(norm * Math.PI * 4.0 + elapsedSec * 0.7) * 1.45;
  const baseRadius = 0.25 + (particleIndex % 11) * 0.16 + Math.abs(wingLobe) * 0.55;

  const baseX = ribbonPt.x + Math.cos(golden) * baseRadius * 0.85;
  const baseY = ribbonPt.y + Math.sin(golden) * baseRadius + wingLobe * 0.35;
  const baseZ = ribbonPt.z - 0.35 + Math.sin(golden * 1.5 + elapsedSec) * 0.45;

  // Distance from the cursor/touch world position
  const dx = baseX - cursorWorldX;
  const dy = baseY - cursorWorldY;
  const distSq = dx * dx + dy * dy;
  const influenceRadius = 1.65 + wakeEnergy * 1.25;
  const proximity = Math.exp(-distSq / (2 * influenceRadius * influenceRadius));

  // Vortex swirl + crescent wave dispersion when cursor/finger swipes nearby
  const activeEffect = proximity * (0.25 + wakeEnergy * 0.95);
  const angleToCursor = Math.atan2(dy, dx);
  const vortexAngle = angleToCursor + Math.PI * 0.42 + swipeAngleRad * 0.35;

  const dispDist = activeEffect * (0.65 + (particleIndex % 5) * 0.18);
  const dispX = Math.cos(vortexAngle) * dispDist;
  const dispY = Math.sin(vortexAngle) * dispDist;
  const dispZ = activeEffect * 0.75;

  const heatCoreBlend = clamp01(
    0.12 + proximity * (0.45 + wakeEnergy * 0.75) + Math.sin(elapsedSec * 3 + particleIndex) * 0.08
  );
  const sizeMultiplier = 1.0 + activeEffect * 2.4;

  return {
    x: baseX + dispX,
    y: baseY + dispY,
    z: baseZ + dispZ,
    sizeMultiplier,
    heatCoreBlend,
    dispersionMagnitude: Math.hypot(dispX, dispY, dispZ),
  };
}

export type ParticleObjectKind =
  | 'camera'
  | 'clapper'
  | 'graphic'
  | 'prism'
  | 'waveform'
  | 'none';

export interface ChapterParticleObjectZone {
  /** True ONLY when the object is within an open, reel-free negative space window */
  visible: boolean;
  /** Distinct contextual 3D particle object per chapter window */
  kind: ParticleObjectKind;
  /** Normalized horizontal center [0..1] in the empty viewport region untouched by the 3D reel & cards */
  anchorXNorm: number;
  /** Normalized vertical center [0..1] in the empty viewport region untouched by the 3D reel & cards */
  anchorYNorm: number;
  /** Normalized safe radius [0..1] guaranteed not to intersect the 3D film reel */
  boundingRadiusNorm: number;
  /** True when the placement is verified to have zero overlap with the 3D film strip & cards */
  reelClearanceVerified: boolean;
  /** Dynamic scale factor [0.48..1.0] driven by camera scroll depth */
  scaleMultiplier?: number;
  /** Dynamic opacity [0..1] driven by camera scroll entry/exit */
  opacity?: number;
  /** Subtle banking tilt (radians) driven by camera scroll parallax */
  perspectiveTiltRad?: number;
}

/**
 * Shared canonical scroll windows for all 5 Landing Page Chapters (01..05).
 * Both `computeScrollCameraObjectState` (the 5 chapter 3D/particle shapes) and
 * `computeChapterExplanationCameraMotion` (the chapter headline & explanation pod)
 * are driven by this exact same table so the chapter shape and explanation never
 * separate in timing, opacity, or camera-shift direction during scroll transitions.
 */
const CHAPTER_SCROLL_WINDOWS: ReadonlyArray<{
  center: number;
  start: number;
  enterPeak: number;
  exitStart: number;
  end: number;
  kind: Exclude<ParticleObjectKind, 'none'>;
  baseAnchorX: number;
  baseAnchorY: number;
  code: string;
  spatialSector: string;
  labelDown: string;
  labelUp: string;
  /** Unified camera pan axis signature (x, y, z, rollDeg, rotX, rotY) when scrolling down (+1) */
  camSignature: {
    enterX: number;
    enterY: number;
    enterZ: number;
    enterRotX: number;
    enterRotY: number;
    enterRotZ: number;
    exitX: number;
    exitY: number;
    exitZ: number;
    exitRotX: number;
    exitRotY: number;
    exitRotZ: number;
  };
}> = [
  {
    center: 0.0,
    start: 0.0,
    enterPeak: 0.0,
    exitStart: 0.025,
    end: 0.16,
    kind: 'camera',
    baseAnchorX: 0.52,
    baseAnchorY: 0.32,
    code: 'CAM-01 // SEKTOR KANAN-BAWAH [X:+1.85 Y:-1.10]',
    spatialSector: 'POSISI 01 · KANAN-BAWAH',
    labelDown: 'GESER KAMERA ↖ KE KIRI-ATAS (BAB 02)',
    labelUp: 'KUNCI POSISI AWAL · WIDE HORIZON',
    camSignature: {
      enterX: -145,
      enterY: -95,
      enterZ: -175,
      enterRotX: 12,
      enterRotY: -16,
      enterRotZ: -2.8,
      exitX: -165,
      exitY: -125,
      exitZ: -210,
      exitRotX: 14,
      exitRotY: -20,
      exitRotZ: -3.4,
    },
  },
  {
    center: 0.25,
    start: 0.16,
    enterPeak: 0.222,
    exitStart: 0.29,
    end: 0.38,
    kind: 'clapper',
    baseAnchorX: 0.38,
    baseAnchorY: 0.74,
    code: 'CAM-02 // SEKTOR KIRI-ATAS [X:-1.92 Y:+1.35]',
    spatialSector: 'POSISI 02 · KIRI-ATAS',
    labelDown: 'GESER KAMERA ↘ KE DEK KANAN (BAB 03)',
    labelUp: 'BALIK KAMERA ↘ KE KANAN-BAWAH (BAB 01)',
    camSignature: {
      enterX: 165,
      enterY: 125,
      enterZ: -215,
      enterRotX: -14,
      enterRotY: 20,
      enterRotZ: -3.4,
      exitX: -175,
      exitY: -120,
      exitZ: -205,
      exitRotX: 14,
      exitRotY: -20,
      exitRotZ: 3.2,
    },
  },
  {
    center: 0.5,
    start: 0.38,
    enterPeak: 0.448,
    exitStart: 0.532,
    end: 0.6,
    kind: 'graphic',
    baseAnchorX: 0.68,
    baseAnchorY: 0.34,
    code: 'CAM-03 // SEKTOR TENGAH-KANAN [X:+2.14 Y:+0.28]',
    spatialSector: 'POSISI 03 · TENGAH-KANAN',
    labelDown: 'GESER KAMERA ↙ KE KIRI-BAWAH (BAB 04)',
    labelUp: 'BALIK KAMERA ↖ KE KIRI-ATAS (BAB 02)',
    camSignature: {
      enterX: 175,
      enterY: 105,
      enterZ: -220,
      enterRotX: 14,
      enterRotY: -22,
      enterRotZ: 3.6,
      exitX: -175,
      exitY: -125,
      exitZ: -210,
      exitRotX: -14,
      exitRotY: 20,
      exitRotZ: -3.4,
    },
  },
  {
    center: 0.75,
    start: 0.6,
    enterPeak: 0.668,
    exitStart: 0.752,
    end: 0.8,
    kind: 'prism',
    baseAnchorX: 0.62,
    baseAnchorY: 0.76,
    code: 'CAM-04 // SEKTOR KIRI-BAWAH [X:-1.78 Y:-1.24]',
    spatialSector: 'POSISI 04 · KIRI-BAWAH',
    labelDown: 'GESER KAMERA ↑ KE PORTAL STUDIO (BAB 05)',
    labelUp: 'BALIK KAMERA ↗ KE TENGAH-KANAN (BAB 03)',
    camSignature: {
      enterX: 175,
      enterY: 120,
      enterZ: -225,
      enterRotX: 14,
      enterRotY: 22,
      enterRotZ: 3.4,
      exitX: -170,
      exitY: -120,
      exitZ: -195,
      exitRotX: -13,
      exitRotY: -18,
      exitRotZ: 3.0,
    },
  },
  {
    center: 0.96,
    start: 0.8,
    enterPeak: 0.885,
    exitStart: 1.0,
    end: 1.0,
    kind: 'waveform',
    baseAnchorX: 0.57,
    baseAnchorY: 0.48,
    code: 'CAM-05 // PORTAL ZENITH LOCK [X:0.00 Y:0.00]',
    spatialSector: 'POSISI 05 · PORTAL TENGAH',
    labelDown: 'PORTAL CONVERGENCE + AXIAL LOCK',
    labelUp: 'BALIK KAMERA ↙ KE KIRI-BAWAH (BAB 04)',
    camSignature: {
      enterX: -140,
      enterY: 115,
      enterZ: -185,
      enterRotX: 12,
      enterRotY: -16,
      enterRotZ: -2.6,
      exitX: 135,
      exitY: -95,
      exitZ: -165,
      exitRotX: -10,
      exitRotY: 14,
      exitRotZ: 2.4,
    },
  },
];

/**
 * Computes the continuous scroll-camera-driven trajectory for ALL 5 Chapter Gesture Objects,
 * locked 1:1 in timing, presence envelope, and camera-shift direction with `computeChapterExplanationCameraMotion`
 * so the chapter shape never separates from its explanation during scroll transitions.
 */
export function computeScrollCameraObjectState(
  scrollProgress: number,
  introSweepProgress = 1.0
): ChapterParticleObjectZone {
  const p = clamp01(scrollProgress);
  const introT = clamp01(introSweepProgress);

  // During the initial Brand Intro (before the 3D camera swoops into Bab 01), keep gesture objects hidden
  if (introT < 0.45) {
    return {
      visible: false,
      kind: 'none',
      anchorXNorm: 0.52,
      anchorYNorm: 0.32,
      boundingRadiusNorm: 0,
      reelClearanceVerified: true,
      scaleMultiplier: 0.5,
      opacity: 0,
      perspectiveTiltRad: 0,
    };
  }

  let activeIdx = 0;
  if (p >= 0.8) {
    activeIdx = 4;
  } else if (p >= 0.6) {
    activeIdx = 3;
  } else if (p >= 0.38) {
    activeIdx = 2;
  } else if (p >= 0.16) {
    activeIdx = 1;
  } else {
    activeIdx = 0;
  }

  const win = CHAPTER_SCROLL_WINDOWS[activeIdx];
  const sig = win.camSignature;

  const enterPresence =
    win.enterPeak > win.start
      ? smoothstep(win.start, win.enterPeak, p)
      : 1.0;
  const exitPresence =
    win.end > win.exitStart
      ? 1.0 - smoothstep(win.exitStart, win.end, p)
      : 1.0;

  const enterDisplace = 1.0 - enterPresence;
  const exitDisplace = 1.0 - exitPresence;
  const presence = Math.min(enterPresence, exitPresence);

  // Sample real 3D camera delta from chapter center so intra-chapter parallax matches the explanation pod
  const camCurrent = interpolateCameraShots(p, false);
  const camCenter = interpolateCameraShots(win.center, false);
  const camOffsetFromCenterX = camCurrent.posX - camCenter.posX;
  const camOffsetFromCenterY = camCurrent.posY - camCenter.posY;

  // Convert shared pixel camera-shift signature to normalized viewport coordinates (1440x900 reference)
  const shiftXNorm =
    (sig.enterX * enterDisplace +
      sig.exitX * exitDisplace -
      camOffsetFromCenterX * 18 * presence) /
    1440;
  const shiftYNorm =
    (sig.enterY * enterDisplace +
      sig.exitY * exitDisplace +
      camOffsetFromCenterY * 14 * presence) /
    900;

  const introArriveT = activeIdx === 0 ? smoothstep(0.45, 1.0, introT) : 1.0;
  const introShiftX = activeIdx === 0 ? (1.0 - introArriveT) * -0.08 : 0;
  const introShiftY = activeIdx === 0 ? (1.0 - introArriveT) * -0.18 : 0;

  const anchorXNorm = clampRange(
    win.baseAnchorX + shiftXNorm + introShiftX,
    0.16,
    0.84
  );
  const anchorYNorm = clampRange(
    win.baseAnchorY + shiftYNorm + introShiftY,
    0.12,
    0.88
  );

  const scaleMultiplier =
    lerp(0.55, 1.0, introArriveT) * lerp(0.74, 1.0, presence);
  const opacity = clamp01(introArriveT * presence);
  const perspectiveTiltRad =
    (1.0 - introArriveT) * 0.16 +
    ((sig.enterRotZ * enterDisplace + sig.exitRotZ * exitDisplace) * Math.PI) /
      180;

  return {
    visible: opacity > 0.02,
    kind: opacity > 0.02 ? win.kind : 'none',
    anchorXNorm,
    anchorYNorm,
    boundingRadiusNorm: 0.15,
    reelClearanceVerified: true,
    scaleMultiplier,
    opacity,
    perspectiveTiltRad,
  };
}

export function getChapterParticleObjectZone(
  chapterIdx: number
): ChapterParticleObjectZone {
  const chapterProgressMap: Record<number, number> = {
    0: 0.0,
    1: 0.25,
    2: 0.5,
    3: 0.75,
    4: 0.96,
  };
  const targetP = chapterProgressMap[chapterIdx];
  if (targetP !== undefined) {
    return computeScrollCameraObjectState(targetP, 1.0);
  }
  return {
    visible: false,
    kind: 'none',
    anchorXNorm: 0,
    anchorYNorm: 0,
    boundingRadiusNorm: 0,
    reelClearanceVerified: true,
    scaleMultiplier: 0.5,
    opacity: 0,
    perspectiveTiltRad: 0,
  };
}

export type BrandIntroMorphStage =
  | 'graph-genesis'
  | 'emblem-convergence'
  | 'camera-dock-topleft'
  | 'complete';

export interface BrandIntroState {
  /** True while the initial Graph Motion Brand Intro is active */
  isActive: boolean;
  /** Continuous Graph Motion brand stage */
  morphStage: BrandIntroMorphStage;
  /** Opacity [0..1] of the dark sapphire intro stage backdrop */
  overlayOpacity: number;
  /** Progress [0..1] of the 3D camera redirection sweep from deep zenith into Bab 01 */
  cameraSweepProgress: number;
  /** Progress [0..1] of the Graph Motion brand emblem & wordmark docking from center to the Top-Left header */
  dockToHeaderProgress: number;
  /** Normalized X position [0..1] of the Brand Lockup as it glides from center (0.50) to Top-Left corner */
  brandAnchorXNorm: number;
  /** Normalized Y position [0..1] of the Brand Lockup as it glides from center (0.46) to Top-Left corner */
  brandAnchorYNorm: number;
  /** Scale factor [1.0 -> 0.44] of the Brand Lockup as it docks into the Top-Left navbar */
  brandScale: number;
  /** Opacity [0..1] of the 3D film reel stage */
  reelsStageReveal: number;
  /** Opacity/visibility [0..1] of the Bab 01 UI, bubbles, and gesture objects */
  bab01UiReveal: number;
  /** 3D camera offset added to Shot 0 during the smooth camera redirection into Bab 01 */
  introCamOffset: {
    dPosX: number;
    dPosY: number;
    dPosZ: number;
    dLookX: number;
    dLookY: number;
    dRollZ: number;
    dFov: number;
  };
}

/**
 * Orchestrates the unified "Graph Motion" Brand Intro & Smooth Camera-Shift Docking to the Top-Left Corner:
 * - 0.00s - 1.05s: `graph-genesis` (3D Isometric Graph Bars + Bezier Motion Splines & Keyframe Diamonds ignite)
 * - 1.05s - 2.15s: `emblem-convergence` (Splines & Perforated Film Ribbon weave into the bespoke Graph Motion Emblem & Wordmark)
 * - 2.15s - 3.85s: `camera-dock-topleft` (3D Camera sweeps smoothly into Bab 01 while the Graph Motion Logo & Wordmark
 *   glide directly from center screen into the Top-Left header slot `pojok kiri atas`!)
 * - >= 3.85s: `complete` (Seamless 0px handoff to the Top-Left header brand & full Bab 01 experience)
 */
export function computeBrandIntroState(
  elapsedIntroSec: number,
  isSkipped = false
): BrandIntroState {
  if (isSkipped || elapsedIntroSec >= 3.85) {
    return {
      isActive: false,
      morphStage: 'complete',
      overlayOpacity: 0,
      cameraSweepProgress: 1.0,
      dockToHeaderProgress: 1.0,
      brandAnchorXNorm: 0.095,
      brandAnchorYNorm: 0.046,
      brandScale: 0.44,
      reelsStageReveal: 1.0,
      bab01UiReveal: 1.0,
      introCamOffset: {
        dPosX: 0,
        dPosY: 0,
        dPosZ: 0,
        dLookX: 0,
        dLookY: 0,
        dRollZ: 0,
        dFov: 0,
      },
    };
  }

  const t = Math.max(0, elapsedIntroSec);
  let morphStage: BrandIntroMorphStage = 'graph-genesis';
  if (t >= 2.15) {
    morphStage = 'camera-dock-topleft';
  } else if (t >= 1.05) {
    morphStage = 'emblem-convergence';
  }

  // Smooth 3D camera redirection sweep begins at t = 1.95s and lands in Bab 01 at t = 3.85s
  const cameraSweepProgress = smoothstep(1.95, 3.85, t);
  const rem = 1.0 - cameraSweepProgress;

  // Final transition: camera shift smoothly carries the Graph Motion logo + wordmark
  // from center screen (0.50, 0.46) directly to the Top-Left header corner (0.095, 0.046)!
  const dockToHeaderProgress = smoothstep(2.15, 3.78, t);
  const brandAnchorXNorm = lerp(0.5, 0.095, dockToHeaderProgress);
  const brandAnchorYNorm = lerp(0.46, 0.046, dockToHeaderProgress);
  const brandScale = lerp(1.0, 0.44, dockToHeaderProgress);

  // Dark stage backdrop opens radially as the camera shifts and the logo travels to top-left
  const overlayOpacity = 1.0 - smoothstep(2.05, 3.45, t);

  // 3D reels unveil smoothly through the expanding radial iris as the camera sweeps in
  const reelsStageReveal = smoothstep(1.85, 3.15, t);

  // Bab 01 UI, bubbles, and gesture objects unveil smoothly as the logo docks at top-left
  const bab01UiReveal = smoothstep(2.55, 3.75, t);

  return {
    isActive: true,
    morphStage,
    overlayOpacity,
    cameraSweepProgress,
    dockToHeaderProgress,
    brandAnchorXNorm,
    brandAnchorYNorm,
    brandScale,
    reelsStageReveal,
    bab01UiReveal,
    introCamOffset: {
      dPosX: -2.25 * rem,
      dPosY: 1.95 * rem,
      dPosZ: 4.85 * rem,
      dLookX: 0.68 * rem,
      dLookY: -0.48 * rem,
      dRollZ: 0.42 * rem,
      dFov: 14.0 * rem,
    },
  };
}

export interface ParticleObjectPoint {
  localX: number;
  localY: number;
  partRole: 'outline' | 'accent' | 'core' | 'spoke';
}

export function computeCameraOrGraphicParticlePoint(
  particleIndex: number,
  totalParticles: number,
  kind: Exclude<ParticleObjectKind, 'none'>,
  elapsedSec = 0
): ParticleObjectPoint {
  const safeTotal = Math.max(1, totalParticles);
  const u = particleIndex / safeTotal;

  // 1. BAB 01: 3D CINEMA CAMERA & DUAL 35MM REELS ('camera')
  if (kind === 'camera') {
    if (u < 0.28) {
      const sub = u / 0.28;
      const isFrontReel = sub < 0.54;
      const reelU = isFrontReel ? sub / 0.54 : (sub - 0.54) / 0.46;
      const cx = isFrontReel ? -6 : -52;
      const cy = isFrontReel ? -62 : -58;
      const outerR = isFrontReel ? 26 : 22;
      const rot = elapsedSec * 0.9 * (isFrontReel ? 1 : -1);

      if (reelU < 0.58) {
        const ang = (reelU / 0.58) * Math.PI * 2 + rot;
        return {
          localX: cx + Math.cos(ang) * outerR,
          localY: cy + Math.sin(ang) * outerR,
          partRole: 'outline',
        };
      } else if (reelU < 0.78) {
        const ang = ((reelU - 0.58) / 0.2) * Math.PI * 2 - rot;
        return {
          localX: cx + Math.cos(ang) * (outerR * 0.34),
          localY: cy + Math.sin(ang) * (outerR * 0.34),
          partRole: 'core',
        };
      } else {
        const spokeNorm = (reelU - 0.78) / 0.22;
        const spokeIdx = particleIndex % 3;
        const spokeAng = spokeIdx * ((Math.PI * 2) / 3) + rot;
        const r = outerR * (0.34 + spokeNorm * 0.64);
        return {
          localX: cx + Math.cos(spokeAng) * r,
          localY: cy + Math.sin(spokeAng) * r,
          partRole: 'spoke',
        };
      }
    } else if (u < 0.62) {
      const sub = (u - 0.28) / 0.34;
      const left = -72;
      const right = 42;
      const top = -34;
      const bottom = 36;
      const width = right - left;
      const height = bottom - top;

      if (sub < 0.52) {
        const p = (sub / 0.52) * 4;
        if (p < 1) {
          return { localX: left + p * width, localY: top, partRole: 'outline' };
        } else if (p < 2) {
          return {
            localX: right,
            localY: top + (p - 1) * height,
            partRole: 'outline',
          };
        } else if (p < 3) {
          return {
            localX: right - (p - 2) * width,
            localY: bottom,
            partRole: 'outline',
          };
        } else {
          return {
            localX: left,
            localY: bottom - (p - 3) * height,
            partRole: 'outline',
          };
        }
      } else if (sub < 0.78) {
        const gridU = (sub - 0.52) / 0.26;
        const cols = 10;
        const rows = 5;
        const idx = Math.floor(gridU * cols * rows);
        const c = idx % cols;
        const r = Math.floor(idx / cols) % rows;
        return {
          localX: left + 12 + (c / (cols - 1)) * (width - 24),
          localY: top + 10 + (r / (rows - 1)) * (height - 20),
          partRole: 'accent',
        };
      } else {
        const ang = ((sub - 0.78) / 0.22) * Math.PI * 2 + elapsedSec * 1.4;
        const r = 13 + (particleIndex % 2) * 4;
        return {
          localX: -12 + Math.cos(ang) * r,
          localY: 1 + Math.sin(ang) * r,
          partRole: 'core',
        };
      }
    } else if (u < 0.86) {
      const sub = (u - 0.62) / 0.24;
      if (sub < 0.45) {
        const barrelU = sub / 0.45;
        const ringIdx = particleIndex % 4;
        const ringX = 46 + ringIdx * 11;
        const yPos = -20 + barrelU * 40;
        return {
          localX:
            ringX +
            (ringIdx === 0 || ringIdx === 3 ? (barrelU - 0.5) * 6 : 0),
          localY: yPos,
          partRole: 'outline',
        };
      } else if (sub < 0.82) {
        const hoodU = (sub - 0.45) / 0.37;
        const edge = particleIndex % 4;
        if (edge === 0) {
          return {
            localX: 86 + hoodU * 34,
            localY: -22 - hoodU * 16,
            partRole: 'core',
          };
        } else if (edge === 1) {
          return {
            localX: 86 + hoodU * 34,
            localY: 22 + hoodU * 16,
            partRole: 'core',
          };
        } else if (edge === 2) {
          return {
            localX: 120,
            localY: -38 + hoodU * 76,
            partRole: 'core',
          };
        } else {
          return {
            localX: 102,
            localY: -28 + hoodU * 56,
            partRole: 'accent',
          };
        }
      } else {
        const ang = ((sub - 0.82) / 0.18) * Math.PI * 2;
        return {
          localX: 108 + Math.cos(ang) * 6,
          localY: Math.sin(ang) * 24,
          partRole: 'core',
        };
      }
    } else {
      const sub = (u - 0.86) / 0.14;
      if (sub < 0.55) {
        const vfU = sub / 0.55;
        const isTop = particleIndex % 2 === 0;
        return {
          localX: -72 - vfU * 34,
          localY: (isTop ? -24 : -12) - vfU * 6,
          partRole: 'outline',
        };
      } else {
        const baseU = (sub - 0.55) / 0.45;
        const row = particleIndex % 2;
        return {
          localX: -36 + baseU * 52,
          localY: 42 + row * 12,
          partRole: 'accent',
        };
      }
    }
  }

  // 2. BAB 02: 3D CINEMA CLAPPERBOARD & STORYBOARD TIMELINE ('clapper')
  if (kind === 'clapper') {
    const clapAngle = -0.32 * (0.5 + 0.5 * Math.sin(elapsedSec * 2.6));
    if (u < 0.28) {
      // Top Hinged Clapper Arm (rotates around hinge at (-74, -18))
      const sub = u / 0.28;
      const lx = sub * 148;
      const ly = (particleIndex % 2 === 0 ? -16 : 0) + (particleIndex % 3) * 2;
      const cosC = Math.cos(clapAngle);
      const sinC = Math.sin(clapAngle);
      return {
        localX: -74 + lx * cosC - ly * sinC,
        localY: -18 + lx * sinC + ly * cosC,
        partRole: particleIndex % 4 === 0 ? 'core' : 'outline',
      };
    } else if (u < 0.72) {
      // Main Clapperboard Slate Body (-74..74, -14..56)
      const sub = (u - 0.28) / 0.44;
      const left = -74;
      const right = 74;
      const top = -14;
      const bottom = 56;
      const w = right - left;
      const h = bottom - top;
      if (sub < 0.58) {
        const p = (sub / 0.58) * 4;
        if (p < 1) return { localX: left + p * w, localY: top, partRole: 'outline' };
        if (p < 2) return { localX: right, localY: top + (p - 1) * h, partRole: 'outline' };
        if (p < 3) return { localX: right - (p - 2) * w, localY: bottom, partRole: 'outline' };
        return { localX: left, localY: bottom - (p - 3) * h, partRole: 'outline' };
      } else {
        // Internal Storyboard Scene Grid & Timecode Dots
        const gU = (sub - 0.58) / 0.42;
        const col = particleIndex % 8;
        const row = Math.floor(gU * 4) % 4;
        return {
          localX: left + 16 + (col / 7) * (w - 32),
          localY: top + 14 + (row / 3) * (h - 26),
          partRole: row === 0 ? 'core' : 'accent',
        };
      }
    } else {
      // Storyboard Play Ring (aligned 1:1 with wireframe center (0, 28) and radius 18)
      const sub = (u - 0.72) / 0.28;
      const ang = sub * Math.PI * 2 + elapsedSec * 1.2;
      const r = sub < 0.55 ? 18 : 10;
      return {
        localX: Math.cos(ang) * r,
        localY: 28 + Math.sin(ang) * r,
        partRole: 'core',
      };
    }
  }

  // 4. BAB 04: 3D GEOMETRIC POLYHEDRON & 60FPS GYRO PRISM ('prism')
  if (kind === 'prism') {
    const rot = elapsedSec * 0.85;
    if (u < 0.42) {
      // Outer & Inner Rotating Hexagonal Prism Edges
      const sub = u / 0.42;
      const edgeIdx = Math.floor(sub * 6) % 6;
      const edgeT = (sub * 6) % 1;
      const a0 = (edgeIdx * Math.PI) / 3 + rot;
      const a1 = ((edgeIdx + 1) * Math.PI) / 3 + rot;
      const r = 56;
      return {
        localX: lerp(Math.cos(a0) * r, Math.cos(a1) * r, edgeT),
        localY: lerp(Math.sin(a0) * r, Math.sin(a1) * r, edgeT),
        partRole: 'core',
      };
    } else if (u < 0.72) {
      // Internal 3D Facet Spokes to Apex
      const sub = (u - 0.42) / 0.3;
      const spokeIdx = particleIndex % 6;
      const ang = (spokeIdx * Math.PI) / 3 + rot;
      const r = sub * 56;
      return {
        localX: Math.cos(ang) * r,
        localY: Math.sin(ang) * r,
        partRole: sub < 0.25 ? 'core' : 'spoke',
      };
    } else {
      // Tilted Elliptical 60 FPS Gyroscope Gimbal Orbit
      const sub = (u - 0.72) / 0.28;
      const ang = sub * Math.PI * 2 - elapsedSec * 1.4;
      const rx = 86;
      const ry = 32;
      const tilt = 0.42;
      const ex = Math.cos(ang) * rx;
      const ey = Math.sin(ang) * ry;
      return {
        localX: ex * Math.cos(tilt) - ey * Math.sin(tilt),
        localY: ex * Math.sin(tilt) + ey * Math.cos(tilt),
        partRole: 'outline',
      };
    }
  }

  // 5. BAB 05: 24KHZ ACOUSTIC SYNTHESIZER & PORTAL CONSTELLATION ('waveform')
  if (kind === 'waveform') {
    if (u < 0.48) {
      // Dual Harmonic Sinusoidal Voice Waveforms
      const sub = u / 0.48;
      const x = -88 + sub * 176;
      const env = Math.sin(sub * Math.PI);
      const isUpper = particleIndex % 2 === 0;
      const waveY =
        Math.sin(sub * Math.PI * 5 - elapsedSec * 3.2) *
        44 *
        env *
        (isUpper ? 1 : -0.75);
      return {
        localX: x,
        localY: waveY,
        partRole: Math.abs(waveY) > 24 ? 'core' : 'outline',
      };
    } else if (u < 0.78) {
      // Equalizer Frequency Columns
      const sub = (u - 0.48) / 0.3;
      const colIdx = particleIndex % 9;
      const cx = -72 + colIdx * 18;
      const maxH = 18 + Math.sin(colIdx * 0.9 + elapsedSec * 2.8) * 14 + 18;
      const y = (sub - 0.5) * 2 * maxH;
      return {
        localX: cx,
        localY: y,
        partRole: 'accent',
      };
    } else {
      // Outer Studio Portal Ring
      const sub = (u - 0.78) / 0.22;
      const ang = sub * Math.PI * 2 + elapsedSec * 0.7;
      return {
        localX: Math.cos(ang) * 76,
        localY: Math.sin(ang) * 62,
        partRole: 'outline',
      };
    }
  }

  // 3. BAB 03: 3D ISOMETRIC GRAPHIC & SPLINE OBJECT ('graphic')
  if (u < 0.18) {
    const sub = u / 0.18;
    if (sub < 0.62) {
      const t = sub / 0.62;
      return {
        localX: -96 + t * 204,
        localY: 48,
        partRole: 'outline',
      };
    } else {
      const t = (sub - 0.62) / 0.38;
      return {
        localX: -96,
        localY: 48 - t * 112,
        partRole: 'outline',
      };
    }
  } else if (u < 0.62) {
    const sub = (u - 0.18) / 0.44;
    const barIdx = Math.min(3, Math.floor(sub * 4));
    const barLocalU = sub * 4 - barIdx;
    const barCentersX = [-70, -36, -2, 32];
    const baseHeights = [44, 72, 58, 96];
    const pulse = Math.sin(elapsedSec * 2.2 + barIdx * 1.1) * 6;
    const barH = baseHeights[barIdx] + pulse;
    const barW = 20;
    const leftX = barCentersX[barIdx] - barW * 0.5;
    const rightX = barCentersX[barIdx] + barW * 0.5;
    const topY = 48 - barH;
    const bottomY = 48;

    if (barLocalU < 0.68) {
      const p = (barLocalU / 0.68) * 3;
      if (p < 1) {
        return {
          localX: leftX,
          localY: bottomY - p * barH,
          partRole: 'outline',
        };
      } else if (p < 2) {
        return {
          localX: leftX + (p - 1) * barW,
          localY: topY,
          partRole: 'core',
        };
      } else {
        return {
          localX: rightX,
          localY: topY + (p - 2) * barH,
          partRole: 'outline',
        };
      }
    } else {
      const fillU = (barLocalU - 0.68) / 0.32;
      const row = Math.floor(fillU * 7);
      const col = particleIndex % 3;
      return {
        localX: leftX + 4 + col * 6,
        localY: topY + 6 + (row / 6) * Math.max(10, barH - 12),
        partRole: 'accent',
      };
    }
  } else if (u < 0.82) {
    const sub = (u - 0.62) / 0.2;
    if (sub < 0.72) {
      const t = sub / 0.72;
      const pt = computeGraphicSplinePoint(t, elapsedSec);
      return {
        localX: pt.x,
        localY: pt.y,
        partRole: 'core',
      };
    } else {
      const nodeIdx = particleIndex % 4;
      const t = nodeIdx / 3;
      const nodePt = computeGraphicSplinePoint(t, elapsedSec);
      const ang = ((sub - 0.72) / 0.28) * Math.PI * 2;
      return {
        localX: nodePt.x + Math.cos(ang) * 5,
        localY: nodePt.y + Math.sin(ang) * 5,
        partRole: 'core',
      };
    }
  } else {
    const sub = (u - 0.82) / 0.18;
    const cx = 82;
    const cy = -6;
    const rot = elapsedSec * 1.1;
    if (sub < 0.65) {
      const ang = (sub / 0.65) * Math.PI * 2 + rot;
      return {
        localX: cx + Math.cos(ang) * 26,
        localY: cy + Math.sin(ang) * 26,
        partRole: 'outline',
      };
    } else {
      const ang = ((sub - 0.65) / 0.35) * Math.PI * 1.4 - rot;
      return {
        localX: cx + Math.cos(ang) * 11,
        localY: cy + Math.sin(ang) * 11,
        partRole: 'core',
      };
    }
  }
}

/**
 * Canonical spline curve for Bab 03 ('graphic') shared 1:1 between the wireframe
 * and stippled particles so the spline never splits into two divergent curves.
 */
export function computeGraphicSplinePoint(
  uNorm: number,
  elapsedSec: number
): { x: number; y: number } {
  const u = clamp01(uNorm);
  return {
    x: -84 + u * 184,
    y: 32 - u * 78 - Math.sin(u * Math.PI * 2.2 - elapsedSec * 2.4) * 18,
  };
}

/**
 * Rigidly transforms a local shape point into viewport coordinates using the active
 * camera-shift anchor, tilt, and scale, then adds only local interactive cursor dispersion.
 * Guarantees 0px separation between wireframe and particles during camera scroll transitions.
 */
export function computeLockedParticleWorldPosition(
  localX: number,
  localY: number,
  anchorX: number,
  anchorY: number,
  tiltRad: number,
  objScale: number,
  dispX = 0,
  dispY = 0
): { x: number; y: number } {
  const cosTilt = Math.cos(tiltRad);
  const sinTilt = Math.sin(tiltRad);
  const rx = localX * cosTilt - localY * sinTilt;
  const ry = localX * sinTilt + localY * cosTilt;
  return {
    x: anchorX + rx * objScale + dispX,
    y: anchorY + ry * objScale + dispY,
  };
}

export interface ChapterCameraShiftPose {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  opacity: number;
  blurPx: number;
}

export interface ChapterContinuousTransform {
  translateX: number;
  translateY: number;
  translateZ: number;
  scale: number;
  rotateXDeg: number;
  rotateYDeg: number;
  rotateZDeg: number;
  opacity: number;
  blurPx: number;
}

export interface ChapterExplanationCameraMotion {
  chapterIndex: number;
  scrollDirection: 1 | -1;
  /** Signed normalized distance from chapter center [-1..+1]: < 0 approaching from top, 0 at center, > 0 departing downward */
  signedDeltaFromCenter: number;
  /** Normalized progress [0..1] within the active chapter's scroll window */
  windowProgress: number;
  /** Real 3D camera pan/dolly/roll deltas across the chapter transition */
  cameraShiftVector: {
    panX: number;
    panY: number;
    dollyZ: number;
    rollDeg: number;
    azimuthDeg: number;
    trajectoryCode: string;
    trajectoryLabel: string;
  };
  /** Continuous intra-chapter 3D parallax transform for the Chapter Explanation Pod */
  podTransform: ChapterContinuousTransform;
  /** Continuous intra-chapter 3D parallax transform for the Chapter Headline Lockup */
  headlineTransform: ChapterContinuousTransform;
  /** Scroll-direction-aware Framer Motion poses for Explanation Pod appear/disappear */
  podTransition: {
    enter: ChapterCameraShiftPose;
    center: ChapterCameraShiftPose;
    exit: ChapterCameraShiftPose;
  };
  /** Scroll-direction-aware Framer Motion poses for Headline Lockup appear/disappear */
  headlineTransition: {
    enter: ChapterCameraShiftPose;
    center: ChapterCameraShiftPose;
    exit: ChapterCameraShiftPose;
  };
}

/**
 * Computes both the continuous intra-chapter 3D camera-shift parallax AND the continuous
 * `smoothstep` appear/disappear transition kinematics for the Home Landing Page Chapter Explanations & Headlines.
 * Shares the exact `CHAPTER_SCROLL_WINDOWS` and `enterPresence`/`exitPresence` physics with `computeScrollCameraObjectState`
 * so the chapter shape, explanation pod, and headline lockup always move together as one unified composition.
 */
export function computeChapterExplanationCameraMotion(
  scrollProgress: number,
  activeChapterIndex: number,
  scrollDirection: 1 | -1 = 1,
  scrollVelocity = 0
): ChapterExplanationCameraMotion {
  const p = clamp01(scrollProgress);
  const safeIdx = Math.max(
    0,
    Math.min(CHAPTER_SCROLL_WINDOWS.length - 1, Math.floor(activeChapterIndex))
  );
  const win = CHAPTER_SCROLL_WINDOWS[safeIdx];
  const dir: 1 | -1 = scrollDirection >= 0 ? 1 : -1;

  const span = Math.max(0.05, win.end - win.start);
  const windowProgress = clamp01((p - win.start) / span);

  // Compute signed delta [-1..+1] relative to chapter center
  let signedDeltaFromCenter = 0;
  if (p < win.center) {
    const preSpan = Math.max(0.02, win.center - win.start);
    signedDeltaFromCenter = -clamp01((win.center - p) / preSpan);
  } else if (p > win.center) {
    const postSpan = Math.max(0.02, win.end - win.center);
    signedDeltaFromCenter = clamp01((p - win.center) / postSpan);
  }

  // Sample real 3D camera kinematics across the chapter window to derive live camera shift telemetry
  const camCurrent = interpolateCameraShots(p, false);
  const camCenter = interpolateCameraShots(win.center, false);
  const camAhead = interpolateCameraShots(clamp01(p + 0.06 * dir), false);

  const panX = Number((camAhead.posX - camCurrent.posX).toFixed(3));
  const panY = Number((camAhead.posY - camCurrent.posY).toFixed(3));
  const dollyZ = Number((camAhead.posZ - camCurrent.posZ).toFixed(3));
  const rollDeg = Number(
    (((camAhead.rollZ - camCurrent.rollZ) * 180) / Math.PI).toFixed(2)
  );
  const azimuthDeg = Number(
    (
      (Math.atan2(
        camCurrent.posX - camCurrent.lookX,
        camCurrent.posZ - camCurrent.lookZ
      ) *
        180) /
      Math.PI
    ).toFixed(1)
  );

  // Camera delta from current scroll p to the chapter's canonical center
  const camOffsetFromCenterX = camCurrent.posX - camCenter.posX;
  const camOffsetFromCenterY = camCurrent.posY - camCenter.posY;
  const camRollDiff = camCurrent.rollZ - camCenter.rollZ;

  const velFactor = Math.min(
    1.35,
    1 + Math.min(0.35, Math.abs(scrollVelocity) * 0.22)
  );
  const sig = win.camSignature;

  // Smoothstep entry/exit envelope (identical to 3D Camera & Graphic objects in computeScrollCameraObjectState):
  // - Entry phase: p in [win.start .. win.enterPeak] -> enterDisplacement goes from 1.0 (off-axis) down to 0.0 (locked in slot)
  // - Plateau phase: p in [win.enterPeak .. win.exitStart] -> displacement = 0.0, opacity = 1.0, blur = 0px
  // - Exit phase: p in [win.exitStart .. win.end] -> exitDisplacement goes from 0.0 (locked in slot) up to 1.0 (swept out by camera)
  const enterPresence =
    win.enterPeak > win.start
      ? smoothstep(win.start, win.enterPeak, p)
      : 1.0;
  const exitPresence =
    win.end > win.exitStart
      ? 1.0 - smoothstep(win.exitStart, win.end, p)
      : 1.0;

  const enterDisplace = 1.0 - enterPresence;
  const exitDisplace = 1.0 - exitPresence;
  const presence = Math.min(enterPresence, exitPresence);

  // Smoothly interpolate position, 3D rotation, scale, opacity, and depth-of-field blur along the unified 3D camera shift vector
  const podTranslateX =
    sig.enterX * enterDisplace +
    sig.exitX * exitDisplace -
    camOffsetFromCenterX * 18 * presence;
  const podTranslateY =
    sig.enterY * enterDisplace +
    sig.exitY * exitDisplace +
    camOffsetFromCenterY * 14 * presence;
  const podTranslateZ =
    sig.enterZ * enterDisplace + sig.exitZ * exitDisplace;
  const podRotateXDeg =
    sig.enterRotX * enterDisplace + sig.exitRotX * exitDisplace;
  const podRotateYDeg =
    sig.enterRotY * enterDisplace + sig.exitRotY * exitDisplace;
  const podRotateZDeg =
    sig.enterRotZ * enterDisplace +
    sig.exitRotZ * exitDisplace +
    ((camRollDiff * 180) / Math.PI) * 0.25 * presence;
  const podScale = lerp(0.74, 1.0, presence);
  const podOpacity = clamp01(presence);
  const podBlurPx = Number(((1.0 - presence) * 8.5).toFixed(2));

  // Headline glides along the SAME unified 3D camera shift trajectory (never opposite signs) so it never separates
  const headlineTranslateX =
    sig.enterX * 0.88 * enterDisplace +
    sig.exitX * 0.88 * exitDisplace -
    camOffsetFromCenterX * 16 * presence;
  const headlineTranslateY =
    sig.enterY * 0.88 * enterDisplace +
    sig.exitY * 0.88 * exitDisplace +
    camOffsetFromCenterY * 12 * presence;
  const headlineTranslateZ =
    sig.enterZ * 0.85 * enterDisplace + sig.exitZ * 0.85 * exitDisplace;
  const headlineRotateXDeg = podRotateXDeg * 0.85;
  const headlineRotateYDeg = podRotateYDeg * 0.85;
  const headlineRotateZDeg = podRotateZDeg * 0.85;
  const headlineScale = lerp(0.78, 1.0, presence);
  const headlineOpacity = clamp01(presence);
  const headlineBlurPx = Number(((1.0 - presence) * 7.0).toFixed(2));

  // Scroll-direction-aware appear (enter) & disappear (exit) poses for telemetry & unit tests
  const podEnter: ChapterCameraShiftPose =
    dir === 1
      ? {
          x: sig.enterX * velFactor,
          y: sig.enterY * velFactor,
          z: sig.enterZ,
          scale: 0.78,
          rotateX: sig.enterRotX,
          rotateY: sig.enterRotY,
          rotateZ: sig.enterRotZ,
          opacity: 0,
          blurPx: 12,
        }
      : {
          x: sig.exitX * velFactor,
          y: sig.exitY * velFactor,
          z: sig.exitZ,
          scale: 0.78,
          rotateX: sig.exitRotX,
          rotateY: sig.exitRotY,
          rotateZ: sig.exitRotZ,
          opacity: 0,
          blurPx: 12,
        };

  const podExit: ChapterCameraShiftPose =
    dir === 1
      ? {
          x: sig.exitX * velFactor,
          y: sig.exitY * velFactor,
          z: sig.exitZ,
          scale: 0.8,
          rotateX: sig.exitRotX,
          rotateY: sig.exitRotY,
          rotateZ: sig.exitRotZ,
          opacity: 0,
          blurPx: 10,
        }
      : {
          x: sig.enterX * velFactor,
          y: sig.enterY * velFactor,
          z: sig.enterZ,
          scale: 0.8,
          rotateX: sig.enterRotX,
          rotateY: sig.enterRotY,
          rotateZ: sig.enterRotZ,
          opacity: 0,
          blurPx: 10,
        };

  const headlineEnter: ChapterCameraShiftPose = {
    x: podEnter.x * 0.88,
    y: podEnter.y * 0.88,
    z: podEnter.z * 0.85,
    scale: 0.82,
    rotateX: podEnter.rotateX * 0.85,
    rotateY: podEnter.rotateY * 0.85,
    rotateZ: podEnter.rotateZ * 0.85,
    opacity: 0,
    blurPx: 10,
  };

  const headlineExit: ChapterCameraShiftPose = {
    x: podExit.x * 0.88,
    y: podExit.y * 0.88,
    z: podExit.z * 0.85,
    scale: 0.84,
    rotateX: podExit.rotateX * 0.85,
    rotateY: podExit.rotateY * 0.85,
    rotateZ: podExit.rotateZ * 0.85,
    opacity: 0,
    blurPx: 8,
  };

  const neutralCenter: ChapterCameraShiftPose = {
    x: 0,
    y: 0,
    z: 0,
    scale: 1,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    opacity: 1,
    blurPx: 0,
  };

  return {
    chapterIndex: safeIdx,
    scrollDirection: dir,
    signedDeltaFromCenter,
    windowProgress,
    cameraShiftVector: {
      panX,
      panY,
      dollyZ,
      rollDeg,
      azimuthDeg,
      trajectoryCode: win.code,
      trajectoryLabel: `${win.spatialSector} · ${
        dir === 1 ? win.labelDown : win.labelUp
      }`,
    },
    podTransform: {
      translateX: podTranslateX,
      translateY: podTranslateY,
      translateZ: podTranslateZ,
      scale: podScale,
      rotateXDeg: podRotateXDeg,
      rotateYDeg: podRotateYDeg,
      rotateZDeg: podRotateZDeg,
      opacity: podOpacity,
      blurPx: podBlurPx,
    },
    headlineTransform: {
      translateX: headlineTranslateX,
      translateY: headlineTranslateY,
      translateZ: headlineTranslateZ,
      scale: headlineScale,
      rotateXDeg: headlineRotateXDeg,
      rotateYDeg: headlineRotateYDeg,
      rotateZDeg: headlineRotateZDeg,
      opacity: headlineOpacity,
      blurPx: headlineBlurPx,
    },
    podTransition: {
      enter: podEnter,
      center: neutralCenter,
      exit: podExit,
    },
    headlineTransition: {
      enter: headlineEnter,
      center: neutralCenter,
      exit: headlineExit,
    },
  };
}



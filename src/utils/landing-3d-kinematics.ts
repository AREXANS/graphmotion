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
  /** Creative Opening Choreography channels (Act I Genesis -> Act II Convergence -> Act III Camera Dock) */
  barStagger: [number, number, number];
  ribbonDrawProgress: number;
  playPrismScale: number;
  shimmerSweepProgress: number;
  irisRotationDeg: number;
  shutterOpenProgress: number;
  wordRevealProgress: number;
  dockArcLiftPx: number;
  /** Pro Editing Motion-Kit & NLE Graph-Editor Opener channels */
  kitPanelWipe: number;
  shockwaveProgress: number;
  emblemElasticScale: number;
  emblemTiltDeg: number;
  wordGraphSlide: number;
  wordMotionWipe: number;
  trackTrimBar: number;
  scrubNeedleProgress: number;
  /** Bespoke NLE Speed-Graph, Bezier Tangent Handles & Match-Cut Camera channels */
  bezierCurveDraw: number;
  tangentHandleSpread: number;
  speedGraphPeak: number;
  cameraCutZoom: number;
  cameraDutchDeg: number;
  letterStagger: [number, number, number, number, number];
  portalShutterExpand: number;
  chromaticSplitPx: number;
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

function springOvershoot(progress01: number, overshootAmt = 0.14): number {
  const u = clamp01(progress01);
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  // Crisp anticipation dip then damped elastic overshoot & settle
  const damped = 1 - Math.pow(1 - u, 2.8) * Math.cos(u * Math.PI * 1.85);
  return Math.max(0, Math.min(1 + overshootAmt, damped));
}

function easeOutExpo(u: number): number {
  const x = clamp01(u);
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

/**
 * Orchestrates the Bespoke NLE Graph-Editor & Speed-Ramp "Graph Motion" Brand Intro:
 * - 0.00s - 1.05s: `graph-genesis` (NLE Speed-Graph S-curve draws across stage, Bezier tangent handles extend & rotate, and 3D graph columns extrude from the live keyframe nodes)
 * - 1.05s - 2.15s: `emblem-convergence` (Whip-zoom match-cut snap, Play-Delta prism impact with RGB chromatic flash & velocity spike, per-letter kinetic "G-r-a-p-h" stagger + "Motion" razor-blade split)
 * - 2.15s - 3.85s: `camera-dock-topleft` (6-blade cinema aperture iris opens into the 3D reel stage while the lockup flies along a cubic Bezier motion-path with frame ticks to the Top-Left header)
 * - >= 3.85s: `complete` (Seamless 0px handoff to the clean header brand & full Bab 01 experience)
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
      barStagger: [1, 1, 1],
      ribbonDrawProgress: 1,
      playPrismScale: 1,
      shimmerSweepProgress: 1,
      irisRotationDeg: 45,
      shutterOpenProgress: 1,
      wordRevealProgress: 1,
      dockArcLiftPx: 0,
      kitPanelWipe: 1,
      shockwaveProgress: 1,
      emblemElasticScale: 1,
      emblemTiltDeg: 0,
      wordGraphSlide: 1,
      wordMotionWipe: 1,
      trackTrimBar: 1,
      scrubNeedleProgress: 1,
      bezierCurveDraw: 1,
      tangentHandleSpread: 1,
      speedGraphPeak: 0,
      cameraCutZoom: 1,
      cameraDutchDeg: 0,
      letterStagger: [1, 1, 1, 1, 1],
      portalShutterExpand: 1,
      chromaticSplitPx: 0,
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

  // Act I: NLE Bezier Speed-Graph S-Curve + Tangent Handle Extension + Extruding 3D Graph Columns
  const kitPanelWipe = easeOutExpo(t / 0.72);
  const shutterOpenProgress = easeOutExpo((t - 0.02) / 0.75);
  const bezierCurveDraw = easeOutExpo(t / 0.68);
  const tangentHandleSpread = springOvershoot((t - 0.14) / 0.58, 0.18);
  const bar1 = springOvershoot((t - 0.06) / 0.56, 0.14);
  const bar2 = springOvershoot((t - 0.22) / 0.58, 0.15);
  const bar3 = springOvershoot((t - 0.38) / 0.60, 0.16);
  const ribbonDrawProgress = easeOutExpo((t - 0.35) / 0.88);
  const emblemElasticScale = springOvershoot((t - 0.12) / 0.76, 0.14);
  const emblemTiltDeg =
    (1 - easeOutExpo((t - 0.12) / 0.78)) * -18 +
    Math.sin(clamp01((t - 0.45) / 0.75) * Math.PI) * 4.5;

  // Act II: Match-Cut Camera Whip-Zoom, Play Prism Impact, Velocity Spike & Kinetic Typography
  const playPrismScale = springOvershoot((t - 0.85) / 0.52, 0.22);
  const shockwaveProgress = easeOutExpo((t - 0.82) / 0.78);
  const shimmerSweepProgress = clamp01((t - 1.15) / 0.7);
  const wordGraphSlide = springOvershoot((t - 0.78) / 0.62, 0.08);
  const wordMotionWipe = easeOutExpo((t - 0.96) / 0.62);
  const wordRevealProgress = easeOutExpo((t - 0.88) / 0.66);
  const trackTrimBar = easeOutExpo((t - 1.08) / 0.56);
  const scrubNeedleProgress = clamp01((t - 1.1) / 1.05);
  const irisRotationDeg = t * 34 + smoothstep(2.1, 3.85, t) * 58;

  // Per-character kinetic spring cascade for "G-r-a-p-h"
  const letterStagger: [number, number, number, number, number] = [
    springOvershoot((t - 0.74) / 0.46, 0.16),
    springOvershoot((t - 0.80) / 0.46, 0.16),
    springOvershoot((t - 0.86) / 0.46, 0.16),
    springOvershoot((t - 0.92) / 0.46, 0.16),
    springOvershoot((t - 0.98) / 0.46, 0.16),
  ];

  // Speed-Graph velocity spike peaking during the Act I -> Act II match-cut whip
  const speedGraphPeak =
    Math.sin(clamp01((t - 0.58) / 0.88) * Math.PI) *
    (1 - smoothstep(1.65, 2.35, t));

  // Whip-zoom match-cut camera pulse & subtle Dutch roll settle
  const cutPulse = Math.sin(clamp01((t - 0.76) / 0.46) * Math.PI);
  const cameraCutZoom =
    1 +
    Math.pow(1 - clamp01(t / 0.72), 2.2) * 0.22 +
    cutPulse * 0.085;
  const cameraDutchDeg =
    (1 - easeOutExpo(t / 0.75)) * -5.2 +
    Math.sin(clamp01((t - 0.78) / 0.52) * Math.PI) * 2.4;

  // Crisp RGB chromatic split pulse on the match-cut beat (t ~ 0.82s - 1.32s)
  const chromaticSplitPx =
    Math.sin(clamp01((t - 0.80) / 0.48) * Math.PI) * 5.5;

  // Smooth 3D camera redirection sweep begins at t = 1.95s and lands in Bab 01 at t = 3.85s
  const cameraSweepProgress = smoothstep(1.95, 3.85, t);
  const rem = 1.0 - cameraSweepProgress;

  // Act III: Parabolic dock trajectory + 6-blade hexagonal cinema portal expansion
  const dockToHeaderProgress = smoothstep(2.15, 3.78, t);
  const portalShutterExpand = smoothstep(1.92, 3.35, t);
  const dockArcLiftPx = Math.sin(dockToHeaderProgress * Math.PI) * -42;
  const brandAnchorXNorm = lerp(0.5, 0.095, dockToHeaderProgress);
  const brandAnchorYNorm = lerp(0.46, 0.046, dockToHeaderProgress);
  const brandScale = lerp(1.0, 0.44, dockToHeaderProgress);

  const overlayOpacity = 1.0 - smoothstep(2.05, 3.45, t);
  const reelsStageReveal = smoothstep(1.85, 3.15, t);
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
    barStagger: [bar1, bar2, bar3],
    ribbonDrawProgress,
    playPrismScale,
    shimmerSweepProgress,
    irisRotationDeg,
    shutterOpenProgress,
    wordRevealProgress,
    dockArcLiftPx,
    kitPanelWipe,
    shockwaveProgress,
    emblemElasticScale,
    emblemTiltDeg,
    wordGraphSlide,
    wordMotionWipe,
    trackTrimBar,
    scrubNeedleProgress,
    bezierCurveDraw,
    tangentHandleSpread,
    speedGraphPeak,
    cameraCutZoom,
    cameraDutchDeg,
    letterStagger,
    portalShutterExpand,
    chromaticSplitPx,
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

// ============================================================================
// CELESTIAL STAR CONSTELLATION (`RASI BINTANG`) BLUEPRINTS FOR OBJECTS
// Transforms Camera, Graphic, Clapperboard, Prism, and Waveform into luminous
// star constellations with major navigation stars, astronomical designations,
// diffraction spikes, and connected constellation edges.
// ============================================================================

export interface ConstellationStarNode {
  id: string;
  /** Normalized offset relative to object radius R (-1.4 .. +1.4) */
  nx: number;
  ny: number;
  /** Star brightness magnitude (1.0 = Alpha super-bright star, 0.45 = minor vertex star) */
  magnitude: number;
  /** Optional astronomical star label (e.g. "α LENS", "β REEL", "α PEAK +240%") */
  designation?: string;
  /** Color tint for the star core */
  tint: 'cyan' | 'amber' | 'white' | 'indigo';
  /** Number of diffraction spikes (4 or 6 for major stars, 0 for minor stars) */
  spikes: 0 | 4 | 6;
}

export interface ConstellationEdge {
  fromIdx: number;
  toIdx: number;
  /** Primary structural line vs secondary celestial guide line */
  tier: 'primary' | 'guide';
}

export interface ConstellationBlueprint {
  kind: ParticleObjectKind;
  constellationName: string;
  latinCode: string;
  stars: ConstellationStarNode[];
  edges: ConstellationEdge[];
}

/**
 * Generates the exact Celestial Constellation (`Rasi Bintang`) vertex stars and
 * connecting constellation lines for each chapter's signature object (`camera`,
 * `clapper`, `graphic`, `prism`, `waveform`).
 */
export function getConstellationBlueprintForObject(
  kind: ParticleObjectKind,
  elapsedSec = 0
): ConstellationBlueprint {
  const pulse = Math.sin(elapsedSec * 2.2) * 0.03;

  if (kind === 'camera') {
    const stars: ConstellationStarNode[] = [
      // 0..3: Camera chassis corners
      { id: 'cam-tl', nx: -0.78, ny: -0.28, magnitude: 0.85, designation: 'δ CHASSIS', tint: 'cyan', spikes: 4 },
      { id: 'cam-tr', nx: 0.34, ny: -0.28, magnitude: 0.82, tint: 'cyan', spikes: 4 },
      { id: 'cam-br', nx: 0.34, ny: 0.48, magnitude: 0.8, tint: 'indigo', spikes: 4 },
      { id: 'cam-bl', nx: -0.78, ny: 0.48, magnitude: 0.78, tint: 'indigo', spikes: 0 },
      // 4..5: Dual 35mm film reels zenith stars
      { id: 'reel-alpha', nx: -0.52, ny: -0.56 + pulse, magnitude: 1.0, designation: 'α REEL-35MM', tint: 'amber', spikes: 6 },
      { id: 'reel-beta', nx: 0.06, ny: -0.52 - pulse, magnitude: 0.94, designation: 'β SPOOL', tint: 'cyan', spikes: 6 },
      // 6..9: Matte-box telephoto lens cone
      { id: 'lens-mount-t', nx: 0.34, ny: -0.1, magnitude: 0.72, tint: 'white', spikes: 0 },
      { id: 'lens-tip-t', nx: 0.96, ny: -0.34, magnitude: 0.98, designation: 'γ OPTIC-85MM', tint: 'amber', spikes: 6 },
      { id: 'lens-tip-b', nx: 0.96, ny: 0.52, magnitude: 0.9, designation: 'ε APERTURE', tint: 'cyan', spikes: 4 },
      { id: 'lens-mount-b', nx: 0.34, ny: 0.28, magnitude: 0.72, tint: 'white', spikes: 0 },
      // 10..11: Optical core & tripod nadir star
      { id: 'sensor-core', nx: -0.22, ny: 0.1, magnitude: 0.96, designation: 'ζ CMOS-CORE', tint: 'white', spikes: 4 },
      { id: 'tripod-nadir', nx: -0.22, ny: 0.82, magnitude: 0.76, designation: 'η NADIR', tint: 'indigo', spikes: 4 },
    ];
    const edges: ConstellationEdge[] = [
      { fromIdx: 0, toIdx: 1, tier: 'primary' },
      { fromIdx: 1, toIdx: 2, tier: 'primary' },
      { fromIdx: 2, toIdx: 3, tier: 'primary' },
      { fromIdx: 3, toIdx: 0, tier: 'primary' },
      { fromIdx: 0, toIdx: 4, tier: 'primary' },
      { fromIdx: 4, toIdx: 5, tier: 'primary' },
      { fromIdx: 5, toIdx: 1, tier: 'primary' },
      { fromIdx: 6, toIdx: 7, tier: 'primary' },
      { fromIdx: 7, toIdx: 8, tier: 'primary' },
      { fromIdx: 8, toIdx: 9, tier: 'primary' },
      { fromIdx: 10, toIdx: 0, tier: 'guide' },
      { fromIdx: 10, toIdx: 1, tier: 'guide' },
      { fromIdx: 10, toIdx: 7, tier: 'guide' },
      { fromIdx: 10, toIdx: 8, tier: 'guide' },
      { fromIdx: 10, toIdx: 11, tier: 'primary' },
      { fromIdx: 3, toIdx: 11, tier: 'guide' },
      { fromIdx: 2, toIdx: 11, tier: 'guide' },
    ];
    return {
      kind,
      constellationName: 'RASI BINTANG KAMERA SINEMA',
      latinCode: 'URSA CINEMA · α-OPTIC',
      stars,
      edges,
    };
  }

  if (kind === 'graphic') {
    const stars: ConstellationStarNode[] = [
      // 0..2: Coordinate axis stars
      { id: 'axis-zenith', nx: -0.84, ny: -0.68, magnitude: 0.92, designation: 'α Y-ZENITH', tint: 'cyan', spikes: 4 },
      { id: 'axis-origin', nx: -0.84, ny: 0.62, magnitude: 0.88, designation: 'β ORIGIN (0,0)', tint: 'white', spikes: 4 },
      { id: 'axis-horizon', nx: 0.92, ny: 0.62, magnitude: 0.9, designation: 'γ X-TIMELINE', tint: 'cyan', spikes: 4 },
      // 3..6: Rising spline constellation stars
      { id: 'spline-1', nx: -0.58, ny: 0.24 - pulse, magnitude: 0.84, designation: 'δ NODE-01', tint: 'cyan', spikes: 4 },
      { id: 'spline-2', nx: -0.14, ny: -0.12 + pulse, magnitude: 0.88, designation: 'ε KEYFRAME', tint: 'indigo', spikes: 4 },
      { id: 'spline-3', nx: 0.34, ny: 0.04 - pulse, magnitude: 0.92, designation: 'ζ INFLECTION', tint: 'cyan', spikes: 4 },
      { id: 'spline-peak', nx: 0.82, ny: -0.64 + pulse, magnitude: 1.0, designation: 'α PEAK +240%', tint: 'amber', spikes: 6 },
      // 7..9: Histogram bar base anchors
      { id: 'bar-base-1', nx: -0.58, ny: 0.62, magnitude: 0.65, tint: 'indigo', spikes: 0 },
      { id: 'bar-base-2', nx: -0.14, ny: 0.62, magnitude: 0.65, tint: 'indigo', spikes: 0 },
      { id: 'bar-base-3', nx: 0.34, ny: 0.62, magnitude: 0.65, tint: 'indigo', spikes: 0 },
      { id: 'bar-base-4', nx: 0.82, ny: 0.62, magnitude: 0.72, tint: 'amber', spikes: 0 },
    ];
    const edges: ConstellationEdge[] = [
      { fromIdx: 0, toIdx: 1, tier: 'primary' },
      { fromIdx: 1, toIdx: 2, tier: 'primary' },
      { fromIdx: 1, toIdx: 3, tier: 'primary' },
      { fromIdx: 3, toIdx: 4, tier: 'primary' },
      { fromIdx: 4, toIdx: 5, tier: 'primary' },
      { fromIdx: 5, toIdx: 6, tier: 'primary' },
      // Vertical constellation pillars dropping to X-axis
      { fromIdx: 3, toIdx: 7, tier: 'guide' },
      { fromIdx: 4, toIdx: 8, tier: 'guide' },
      { fromIdx: 5, toIdx: 9, tier: 'guide' },
      { fromIdx: 6, toIdx: 10, tier: 'guide' },
      { fromIdx: 0, toIdx: 6, tier: 'guide' },
    ];
    return {
      kind,
      constellationName: 'RASI BINTANG GRAFIK & SPLINE',
      latinCode: 'CYGNUS GRAPHICA · α-SPLINE',
      stars,
      edges,
    };
  }

  if (kind === 'clapper') {
    const stars: ConstellationStarNode[] = [
      { id: 'hinge-alpha', nx: -0.82, ny: -0.26, magnitude: 1.0, designation: 'α HINGE-SYNC', tint: 'amber', spikes: 6 },
      { id: 'clap-tip-top', nx: 0.78, ny: -0.68 + pulse, magnitude: 0.95, designation: 'β CLAP-BAR', tint: 'amber', spikes: 6 },
      { id: 'slate-tr', nx: 0.82, ny: -0.22, magnitude: 0.86, designation: 'γ TIMECODE', tint: 'cyan', spikes: 4 },
      { id: 'slate-br', nx: 0.82, ny: 0.62, magnitude: 0.84, tint: 'cyan', spikes: 4 },
      { id: 'slate-bl', nx: -0.82, ny: 0.62, magnitude: 0.82, designation: 'δ SCENE-01', tint: 'indigo', spikes: 4 },
      { id: 'slate-center', nx: 0.0, ny: 0.2, magnitude: 0.9, designation: 'ε STORYBOARD', tint: 'white', spikes: 4 },
      { id: 'stripe-mid-1', nx: -0.28, ny: -0.44, magnitude: 0.72, tint: 'cyan', spikes: 0 },
      { id: 'stripe-mid-2', nx: 0.26, ny: -0.54, magnitude: 0.74, tint: 'amber', spikes: 0 },
    ];
    const edges: ConstellationEdge[] = [
      { fromIdx: 0, toIdx: 6, tier: 'primary' },
      { fromIdx: 6, toIdx: 7, tier: 'primary' },
      { fromIdx: 7, toIdx: 1, tier: 'primary' },
      { fromIdx: 0, toIdx: 2, tier: 'primary' },
      { fromIdx: 2, toIdx: 3, tier: 'primary' },
      { fromIdx: 3, toIdx: 4, tier: 'primary' },
      { fromIdx: 4, toIdx: 0, tier: 'primary' },
      { fromIdx: 1, toIdx: 2, tier: 'guide' },
      { fromIdx: 5, toIdx: 0, tier: 'guide' },
      { fromIdx: 5, toIdx: 2, tier: 'guide' },
      { fromIdx: 5, toIdx: 3, tier: 'guide' },
      { fromIdx: 5, toIdx: 4, tier: 'guide' },
    ];
    return {
      kind,
      constellationName: 'RASI BINTANG CLAPPERBOARD',
      latinCode: 'ORION SCRIPTUM · α-SLATE',
      stars,
      edges,
    };
  }

  if (kind === 'prism') {
    const rot = elapsedSec * 0.38;
    const stars: ConstellationStarNode[] = [];
    const designations = [
      'α APEX-60FPS',
      'β VERTEX-TSX',
      'γ SHADER-GL',
      'δ NADIR-CORE',
      'ε MATRIX-3D',
      'ζ RAY-OPTIC',
    ];
    for (let k = 0; k < 6; k++) {
      const a = rot + (k * Math.PI) / 3 - Math.PI / 2;
      stars.push({
        id: `prism-v-${k}`,
        nx: Math.cos(a) * 0.82,
        ny: Math.sin(a) * 0.82,
        magnitude: k === 0 ? 1.0 : k % 2 === 0 ? 0.9 : 0.8,
        designation: k % 2 === 0 ? designations[k] : undefined,
        tint: k === 0 ? 'amber' : k % 2 === 0 ? 'cyan' : 'indigo',
        spikes: k % 2 === 0 ? 6 : 4,
      });
    }
    stars.push({
      id: 'prism-core',
      nx: 0,
      ny: 0,
      magnitude: 0.98,
      designation: 'ω SINGULARITY',
      tint: 'white',
      spikes: 6,
    });
    const edges: ConstellationEdge[] = [
      { fromIdx: 0, toIdx: 1, tier: 'primary' },
      { fromIdx: 1, toIdx: 2, tier: 'primary' },
      { fromIdx: 2, toIdx: 3, tier: 'primary' },
      { fromIdx: 3, toIdx: 4, tier: 'primary' },
      { fromIdx: 4, toIdx: 5, tier: 'primary' },
      { fromIdx: 5, toIdx: 0, tier: 'primary' },
      // Inner Star of David / Hexagram constellation lines
      { fromIdx: 0, toIdx: 2, tier: 'guide' },
      { fromIdx: 2, toIdx: 4, tier: 'guide' },
      { fromIdx: 4, toIdx: 0, tier: 'guide' },
      { fromIdx: 1, toIdx: 3, tier: 'guide' },
      { fromIdx: 3, toIdx: 5, tier: 'guide' },
      { fromIdx: 5, toIdx: 1, tier: 'guide' },
      { fromIdx: 6, toIdx: 0, tier: 'primary' },
      { fromIdx: 6, toIdx: 3, tier: 'primary' },
    ];
    return {
      kind,
      constellationName: 'RASI BINTANG PRISMA POLIGON',
      latinCode: 'LYRA PRISMA · α-60FPS',
      stars,
      edges,
    };
  }

  // Default / 'waveform'
  const stars: ConstellationStarNode[] = [
    { id: 'wf-0', nx: -0.9, ny: 0.0, magnitude: 0.8, designation: 'α 24KHZ-IN', tint: 'cyan', spikes: 4 },
    { id: 'wf-1', nx: -0.54, ny: -0.58 + pulse, magnitude: 0.95, designation: 'β PEAK-VO', tint: 'amber', spikes: 6 },
    { id: 'wf-2', nx: -0.18, ny: 0.48 - pulse, magnitude: 0.86, tint: 'indigo', spikes: 4 },
    { id: 'wf-3', nx: 0.18, ny: -0.72 - pulse, magnitude: 1.0, designation: 'γ RESONANCE', tint: 'amber', spikes: 6 },
    { id: 'wf-4', nx: 0.54, ny: 0.44 + pulse, magnitude: 0.85, tint: 'cyan', spikes: 4 },
    { id: 'wf-5', nx: 0.9, ny: 0.0, magnitude: 0.88, designation: 'δ SYNC-LOCK', tint: 'cyan', spikes: 4 },
  ];
  const edges: ConstellationEdge[] = [
    { fromIdx: 0, toIdx: 1, tier: 'primary' },
    { fromIdx: 1, toIdx: 2, tier: 'primary' },
    { fromIdx: 2, toIdx: 3, tier: 'primary' },
    { fromIdx: 3, toIdx: 4, tier: 'primary' },
    { fromIdx: 4, toIdx: 5, tier: 'primary' },
    { fromIdx: 0, toIdx: 5, tier: 'guide' },
    { fromIdx: 1, toIdx: 3, tier: 'guide' },
  ];
  return {
    kind,
    constellationName: 'RASI BINTANG SONIC WAVEFORM',
    latinCode: 'AQUILA SONICA · 24KHZ',
    stars,
    edges,
  };
}

// ============================================================================
// 360° GALAXY REMOTION STYLE PLANETS (`PLANET VIDEO STYLE REMOTION`)
// Photorealistic galaxy-themed celestial planets anchored at fixed orbital coordinates
// across a full 360° panoramic galaxy sky. Planets cannot be dragged out of their
// orbital slots individually; panning the galaxy view 360° rotates through all 12 planets,
// and clicking any planet opens its Remotion Style Video Popup Modal.
// ============================================================================

export type RemotionPlanetStyleId =
  | 'studio_3d_room'
  | 'diorama_data'
  | 'editorial_motion_grid'
  | 'isometric'
  | 'stickman_hud'
  | 'neon_waveform'
  | 'claymorphism'
  | 'paper_cutout'
  | 'mars_colony'
  | 'precision_cad'
  | 'midnight_cyber'
  | 'aurora_glass';

export type GalaxyPlanetArchetype =
  | 'gas-giant-rings'
  | 'terran-ocean'
  | 'ice-aurora'
  | 'crystalline-exoplanet'
  | 'emerald-super-earth'
  | 'pulsar-magnetosphere'
  | 'origami-strata'
  | 'red-canyon-rings'
  | 'titanium-core'
  | 'obsidian-nebula'
  | 'polar-aurora'
  | 'terracotta-moon';

export interface RemotionPlanetSpec {
  id: string;
  styleId: RemotionPlanetStyleId;
  /** Style ID for StyleLivePreviewPlayer in the Remotion video popup modal */
  previewStyleId: string;
  planetName: string;
  styleTitle: string;
  remotionTag: string;
  description: string;
  tsxSnippet: string;
  /** 360° panoramic galaxy azimuth angle in degrees (0..360) */
  azimuthDeg: number;
  /** Baseline viewport anchor percentage when centered in frustum (0..100) */
  anchorLeftPct: number;
  anchorTopPct: number;
  /** Planet diameter in pixels on desktop */
  sizePx: number;
  depthLayer: 'behind' | 'front';
  orbitRadiusPx: number;
  orbitSpeedRad: number;
  orbitPhaseRad: number;
  ringTiltDeg: number;
  hasRings: boolean;
  planetArchetype: GalaxyPlanetArchetype;
  /** [highlightHex, midtoneHex, deepShadowHex] for photorealistic planetary sphere shader */
  surfacePalette: [string, string, string];
  atmosphereColor: string;
  accentHex: string;
}

export const REMOTION_STYLE_PLANETS: RemotionPlanetSpec[] = [
  {
    id: 'planet-diorama-data',
    styleId: 'diorama_data',
    previewStyleId: 'diorama_data',
    planetName: 'Kepler Diorama',
    styleTitle: 'Extruded 3D Bars',
    remotionTag: 'SPRING · KEYFRAME',
    description: 'Planet samudra data ekstrusi 3D dengan pencahayaan atmosfer Rayleigh dan animasi grafik finansial presisi 60fps.',
    tsxSnippet: `<ThreeCanvas camera={{ fov: 42 }}>\n  <ExtrudedBarGroup spring={spring({ frame, fps, config: { damping: 14 } })} />\n  <AtmosphericRim color="#38bdf8" intensity={1.4} />\n</ThreeCanvas>`,
    azimuthDeg: 300,
    anchorLeftPct: 16,
    anchorTopPct: 72,
    sizePx: 118,
    depthLayer: 'behind',
    orbitRadiusPx: 7,
    orbitSpeedRad: 0.22,
    orbitPhaseRad: 1.4,
    ringTiltDeg: 22,
    hasRings: true,
    planetArchetype: 'terran-ocean',
    surfacePalette: ['#7dd3fc', '#0284c7', '#041226'],
    atmosphereColor: 'rgba(56, 189, 248, 0.68)',
    accentHex: '#38bdf8',
  },
  {
    id: 'planet-stickman-kinetic',
    styleId: 'stickman_hud',
    previewStyleId: 'garis',
    planetName: 'Veridian Kinetic',
    styleTitle: 'Character Sequence',
    remotionTag: 'SEQUENCE · HOOK',
    description: 'Super-Earth zamrud dengan badai magnetik hijau neon yang memutar sekuens karakter narasi secara sinkron.',
    tsxSnippet: `<Sequence from={0} durationInFrames={180}>\n  <KineticActorRig pose={interpolate(frame, [0, 45], [0, 1])} />\n  <CameraFocusHUD target="actor-head" />\n</Sequence>`,
    azimuthDeg: 330,
    anchorLeftPct: 24,
    anchorTopPct: 21,
    sizePx: 114,
    depthLayer: 'behind',
    orbitRadiusPx: 6,
    orbitSpeedRad: 0.25,
    orbitPhaseRad: 4.9,
    ringTiltDeg: -24,
    hasRings: false,
    planetArchetype: 'emerald-super-earth',
    surfacePalette: ['#86efac', '#16a34a', '#031c12'],
    atmosphereColor: 'rgba(74, 222, 128, 0.65)',
    accentHex: '#4ade80',
  },
  {
    id: 'planet-editorial-grid',
    styleId: 'editorial_motion_grid',
    previewStyleId: 'editorial_motion_grid',
    planetName: 'Helios Editorial',
    styleTitle: 'Kinetic Swiss Matte',
    remotionTag: 'INTERPOLATE · GRID',
    description: 'Planet gas bercincin ganda dengan struktur Swiss Editorial Grid dan tipografi kinetik berbasis kurva bezier.',
    tsxSnippet: `<AbsoluteFill className="grid-swiss-12">\n  <KineticHeadline scale={spring({ frame, fps })} />\n  <EditorialMatteFrame progress={frame / durationInFrames} />\n</AbsoluteFill>`,
    azimuthDeg: 0,
    anchorLeftPct: 50,
    anchorTopPct: 73,
    sizePx: 122,
    depthLayer: 'behind',
    orbitRadiusPx: 8,
    orbitSpeedRad: 0.24,
    orbitPhaseRad: 2.6,
    ringTiltDeg: -15,
    hasRings: true,
    planetArchetype: 'gas-giant-rings',
    surfacePalette: ['#d9f99d', '#65a30d', '#0b1908'],
    atmosphereColor: 'rgba(163, 230, 53, 0.66)',
    accentHex: '#a3e635',
  },
  {
    id: 'planet-isometric-voxel',
    styleId: 'isometric',
    previewStyleId: 'isometrik',
    planetName: 'Cygnus Voxel',
    styleTitle: 'Isometric Matrix',
    remotionTag: 'ISOMETRIC · TSX',
    description: 'Exoplanet kristal isometrik dengan jaringan blok arsitektur data yang menyala mengikuti detak narasi.',
    tsxSnippet: `<IsometricProjection angle={30}>\n  {nodes.map((n, i) => (\n    <VoxelPillar key={i} height={spring({ frame: frame - i * 4, fps })} />\n  ))}\n</IsometricProjection>`,
    azimuthDeg: 30,
    anchorLeftPct: 78,
    anchorTopPct: 22,
    sizePx: 112,
    depthLayer: 'behind',
    orbitRadiusPx: 7,
    orbitSpeedRad: 0.2,
    orbitPhaseRad: 3.8,
    ringTiltDeg: 17,
    hasRings: false,
    planetArchetype: 'crystalline-exoplanet',
    surfacePalette: ['#a5f3fc', '#0891b2', '#041424'],
    atmosphereColor: 'rgba(34, 211, 238, 0.64)',
    accentHex: '#22d3ee',
  },
  {
    id: 'planet-sonic-waveform',
    styleId: 'neon_waveform',
    previewStyleId: 'cahaya',
    planetName: 'Aquila Sonic 24kHz',
    styleTitle: 'Audio Spectrum Sync',
    remotionTag: 'AUDIODATA · 24KHZ',
    description: 'Planet pulsar bermagnetosfer biru elektrik yang berdenyut sinkron terhadap spektrum frekuensi audio 24kHz.',
    tsxSnippet: `const spectrum = useAudioData(audioSrc);\nreturn (\n  <WaveformRingVisualizer\n    amplitudes={visualizeAudio({ fps, frame, audioData: spectrum, numberOfSamples: 64 })}\n  />\n);`,
    azimuthDeg: 60,
    anchorLeftPct: 72,
    anchorTopPct: 71,
    sizePx: 112,
    depthLayer: 'behind',
    orbitRadiusPx: 6,
    orbitSpeedRad: 0.23,
    orbitPhaseRad: 5.5,
    ringTiltDeg: 20,
    hasRings: true,
    planetArchetype: 'pulsar-magnetosphere',
    surfacePalette: ['#bae6fd', '#0284c7', '#050d24'],
    atmosphereColor: 'rgba(125, 211, 252, 0.66)',
    accentHex: '#7dd3fc',
  },
  {
    id: 'planet-studio-3d',
    styleId: 'studio_3d_room',
    previewStyleId: 'studio_3d_room',
    planetName: 'Nova 3D Studio',
    styleTitle: 'Camera Orbit 60fps',
    remotionTag: 'THREECANVAS · 60FPS',
    description: 'Raksasa gas bercincin Saturnus dengan ruang produksi 3D sinematik dan orbit kamera otomatis 60fps.',
    tsxSnippet: `<ThreeCanvas shadows dpr={[1, 2]}>\n  <PerspectiveCamera makeDefault position={[0, 1.8, 5.2]} />\n  <StudioRoomScene cameraYaw={interpolate(frame, [0, 150], [-0.45, 0.45])} />\n</ThreeCanvas>`,
    azimuthDeg: 90,
    anchorLeftPct: 84,
    anchorTopPct: 24,
    sizePx: 124,
    depthLayer: 'behind',
    orbitRadiusPx: 8,
    orbitSpeedRad: 0.26,
    orbitPhaseRad: 0.2,
    ringTiltDeg: -19,
    hasRings: true,
    planetArchetype: 'gas-giant-rings',
    surfacePalette: ['#6ee7b7', '#059669', '#021712'],
    atmosphereColor: 'rgba(74, 222, 128, 0.72)',
    accentHex: '#4ade80',
  },
  {
    id: 'planet-paperworld-craft',
    styleId: 'paper_cutout',
    previewStyleId: 'paperworld',
    planetName: 'Lyra Paperworld',
    styleTitle: 'Layered Cutout Parallax',
    remotionTag: 'PARALLAX · DIORAMA',
    description: 'Planet berlapis topografi lipatan kertas dengan bayangan kedalaman berlapis dan paralaks kamera lembut.',
    tsxSnippet: `<PaperStage depthLayers={6}>\n  <FoldedMountainLayer zOffset={-120} shadowBlur={24} />\n  <OrigamiHeroCharacter popIn={spring({ frame, fps })} />\n</PaperStage>`,
    azimuthDeg: 120,
    anchorLeftPct: 92,
    anchorTopPct: 70,
    sizePx: 114,
    depthLayer: 'behind',
    orbitRadiusPx: 7,
    orbitSpeedRad: 0.21,
    orbitPhaseRad: 1.9,
    ringTiltDeg: 14,
    hasRings: false,
    planetArchetype: 'origami-strata',
    surfacePalette: ['#fde68a', '#d97706', '#1e1005'],
    atmosphereColor: 'rgba(251, 191, 36, 0.62)',
    accentHex: '#fbbf24',
  },
  {
    id: 'planet-mars-worldforge',
    styleId: 'mars_colony',
    previewStyleId: 'worldforge_mars',
    planetName: 'Ares Worldforge',
    styleTitle: 'Planetary Terrain Sim',
    remotionTag: 'TERRAIN · SHADER',
    description: 'Planet ngarai merah bercincin debu kosmik dengan simulasi koloni masa depan dan telemetri orbital.',
    tsxSnippet: `<PlanetaryTerrainBiome seed="ares-9" atmosphere="#f97316">\n  <ColonyDomeCluster scanProgress={frame / 120} />\n  <OrbitalTelemetryOverlay />\n</PlanetaryTerrainBiome>`,
    azimuthDeg: 150,
    anchorLeftPct: 86,
    anchorTopPct: 22,
    sizePx: 120,
    depthLayer: 'behind',
    orbitRadiusPx: 8,
    orbitSpeedRad: 0.19,
    orbitPhaseRad: 2.9,
    ringTiltDeg: -22,
    hasRings: true,
    planetArchetype: 'red-canyon-rings',
    surfacePalette: ['#fdba74', '#ea580c', '#210904'],
    atmosphereColor: 'rgba(251, 146, 60, 0.66)',
    accentHex: '#fb923c',
  },
  {
    id: 'planet-precision-cad',
    styleId: 'precision_cad',
    previewStyleId: 'precision',
    planetName: 'Vega Precision',
    styleTitle: 'Blueprint Vector HUD',
    remotionTag: 'BLUEPRINT · CAD',
    description: 'Planet inti titanium dengan garis bujur vektor presisi tinggi dan animasi skematik rekayasa.',
    tsxSnippet: `<BlueprintCanvas gridStep={24}>\n  <TechnicalCalloutLine length={interpolate(frame, [0, 30], [0, 240])} />\n  <DimensionReadout value="1080×1920 · 60FPS" />\n</BlueprintCanvas>`,
    azimuthDeg: 180,
    anchorLeftPct: 74,
    anchorTopPct: 73,
    sizePx: 112,
    depthLayer: 'behind',
    orbitRadiusPx: 6,
    orbitSpeedRad: 0.24,
    orbitPhaseRad: 3.4,
    ringTiltDeg: 16,
    hasRings: false,
    planetArchetype: 'titanium-core',
    surfacePalette: ['#e0f2fe', '#0284c7', '#081426'],
    atmosphereColor: 'rgba(56, 189, 248, 0.64)',
    accentHex: '#38bdf8',
  },
  {
    id: 'planet-midnight-cyber',
    styleId: 'midnight_cyber',
    previewStyleId: 'midnight',
    planetName: 'Nyx Midnight',
    styleTitle: 'Dark Glass Telemetry',
    remotionTag: 'DARKGLASS · HUD',
    description: 'Planet obsidian bercincin nebula ungu-sian dengan antarmuka kaca gelap dan pencahayaan bioluminesensi.',
    tsxSnippet: `<MidnightGlassStage blur={28}>\n  <NeonMetricCard glow="#818cf8" value={spring({ frame, fps })} />\n  <CyberGridHorizon speed={1.5} />\n</MidnightGlassStage>`,
    azimuthDeg: 210,
    anchorLeftPct: 50,
    anchorTopPct: 21,
    sizePx: 118,
    depthLayer: 'behind',
    orbitRadiusPx: 7,
    orbitSpeedRad: 0.22,
    orbitPhaseRad: 4.2,
    ringTiltDeg: -17,
    hasRings: true,
    planetArchetype: 'obsidian-nebula',
    surfacePalette: ['#c7d2fe', '#4f46e5', '#090721'],
    atmosphereColor: 'rgba(129, 140, 248, 0.68)',
    accentHex: '#818cf8',
  },
  {
    id: 'planet-aurora-polar',
    styleId: 'aurora_glass',
    previewStyleId: 'aurora',
    planetName: 'Borealis Aurora',
    styleTitle: 'Iridescent Shader Flow',
    remotionTag: 'SHADER · AURORA',
    description: 'Planet es kutub dengan tirai aurora zamrud-sian yang menari lembut mengelilingi atmosfer stratosfer.',
    tsxSnippet: `<AuroraShaderBackdrop time={frame / fps}>\n  <GlassmorphicTitleCard opacity={interpolate(frame, [0, 25], [0, 1])} />\n  <HarmonicParticleStream count={120} />\n</AuroraShaderBackdrop>`,
    azimuthDeg: 240,
    anchorLeftPct: 28,
    anchorTopPct: 71,
    sizePx: 116,
    depthLayer: 'behind',
    orbitRadiusPx: 7,
    orbitSpeedRad: 0.2,
    orbitPhaseRad: 5.1,
    ringTiltDeg: 21,
    hasRings: false,
    planetArchetype: 'polar-aurora',
    surfacePalette: ['#99f6e4', '#0d9488', '#021a19'],
    atmosphereColor: 'rgba(45, 212, 191, 0.68)',
    accentHex: '#2dd4bf',
  },
  {
    id: 'planet-clay-terracotta',
    styleId: 'claymorphism',
    previewStyleId: 'stopmotion_clay',
    planetName: 'Solaria Clay',
    styleTitle: 'Tactile Stop-Motion 3D',
    remotionTag: 'STOPMOTION · CLAY',
    description: 'Bulan terakota bertekstur pahatan tangan dengan pencahayaan studio hangat dan gerak karakter taktil.',
    tsxSnippet: `<ClayStudioLighting warmth={0.85}>\n  <SculptedCharacterMesh stepFrame={Math.floor(frame / 2) * 2} />\n  <SoftContactShadow opacity={0.45} />\n</ClayStudioLighting>`,
    azimuthDeg: 270,
    anchorLeftPct: 12,
    anchorTopPct: 23,
    sizePx: 114,
    depthLayer: 'behind',
    orbitRadiusPx: 6,
    orbitSpeedRad: 0.23,
    orbitPhaseRad: 0.9,
    ringTiltDeg: -13,
    hasRings: true,
    planetArchetype: 'terracotta-moon',
    surfacePalette: ['#fed7aa', '#ea580c', '#1f0b04'],
    atmosphereColor: 'rgba(251, 146, 60, 0.62)',
    accentHex: '#fb923c',
  },
];

export interface InteractivePlanetTransform {
  translateX: number;
  translateY: number;
  scale: number;
  rotationDeg: number;
  /** Glow intensity when orb is hovered or centered in galaxy frustum (0..1) */
  haloIntensity: number;
  /** Shortest angular distance from current 360° galaxy camera yaw (-180..+180) */
  wrappedAzimuthDeltaDeg: number;
  /** Smooth visibility opacity based on 360° spherical frustum (0..1) */
  frustumOpacity: number;
  /** True when the planet is within the active forward viewing hemisphere */
  isVisibleInFrustum: boolean;
  /** Planets are strictly anchored in their orbital coordinates and cannot be dragged away */
  isLockedInPlace: true;
}

/**
 * Normalizes any angle difference into the shortest signed arc [-180, +180].
 */
export function wrapAngleSigned180(angleDeg: number): number {
  return ((((angleDeg + 180) % 360) + 360) % 360) - 180;
}

/**
 * Pure helper computing the real-time 360° spherical-galaxy projection of a Remotion Style Planet.
 *
 * Key guarantees:
 * 1. Planets remain anchored at their fixed orbital coordinates (`isLockedInPlace: true`) —
 *    they cannot be dragged/repositioned individually out of their orbit.
 * 2. Planets are spaced 30° apart across the 360° galaxy with a focused space-observatory FOV (`±54°`),
 *    so only 3 to 4 widely separated planets (never crowded or overlapping!) appear in the viewport
 *    at any given camera angle (`agar planet nya tidak terlalu berdekatan dan rapat terlalu banyak`).
 * 3. Horizontal galaxy camera rotation (`galaxyPanX`, unclamped for full 360° rotation) sweeps the
 *    space-observatory camera yaw across all 360° (`bisa di putar kamera 360° seperti bisa memantau luar angkasa`).
 */
export function computeInteractivePlanetTransform(
  planet: RemotionPlanetSpec,
  elapsedSec: number,
  scrollProgress: number,
  pointerNormX: number,
  pointerNormY: number,
  galaxyPanX = 0,
  galaxyPanY = 0,
  isHoveredOrSelected = false,
  viewportHalfSpanPx = 520
): InteractivePlanetTransform {
  // Subtle in-place orbital breathing around the planet's locked celestial anchor
  const angle = elapsedSec * planet.orbitSpeedRad + planet.orbitPhaseRad;
  const orbitX = Math.cos(angle) * planet.orbitRadiusPx;
  const orbitY = Math.sin(angle * 0.85) * (planet.orbitRadiusPx * 0.75);

  const parallaxDepth = 0.82 + ((planet.orbitPhaseRad % 2.5) * 0.16);

  // Full 360° camera yaw: 1440px of horizontal pan completes a full 360° galaxy rotation (0.25 deg/px)
  // Scrolling also gently sweeps the galaxy azimuth so planets glide naturally across chapters
  const cameraYawDeg = -galaxyPanX * 0.25 + scrollProgress * 54;
  const wrappedAzimuthDeltaDeg = wrapAngleSigned180(planet.azimuthDeg - cameraYawDeg);
  const absDeltaDeg = Math.abs(wrappedAzimuthDeltaDeg);

  // Space-observatory angular projection: 30° between planets maps to ~79% of viewportHalfSpanPx
  // (~420px horizontal gap on desktop), giving generous deep-space separation between visible planets!
  const panoramicShiftX = (wrappedAzimuthDeltaDeg / 38) * viewportHalfSpanPx;

  // Spherical curvature: planets near the limb of the 360° view dip gently along a celestial arc
  const sphericalArcY = Math.sin((wrappedAzimuthDeltaDeg * Math.PI) / 180) * 24 * parallaxDepth;

  // Vertical galaxy pan & scroll parallax (bounded so planets stay in the celestial sky)
  const scrollPanY = (0.32 - scrollProgress) * 145 * parallaxDepth;
  const clampedVerticalPanY = Math.max(-105, Math.min(105, galaxyPanY * 0.26));

  const pointerShiftX = pointerNormX * 14 * parallaxDepth;
  const pointerShiftY = -pointerNormY * 12 * parallaxDepth;

  const translateX = orbitX + panoramicShiftX + pointerShiftX;
  const translateY = orbitY + scrollPanY + sphericalArcY + clampedVerticalPanY + pointerShiftY;

  // Focused Space-Observatory FOV (+/-54°):
  // With 12 planets spaced every 30°, only 3 to 4 widely spaced planets are visible at any yaw angle
  // (`agar planet nya tidak terlalu berdekatan dan rapat terlalu banyak`)!
  const frustumOpacity =
    absDeltaDeg >= 54
      ? 0
      : absDeltaDeg <= 36
        ? 1
        : clamp01(1 - (absDeltaDeg - 36) / (54 - 36));
  const isVisibleInFrustum = frustumOpacity > 0.04;

  // Perspective scale: planets closer to the center of the current 360° observatory view appear larger
  const perspectiveScale = 0.85 + 0.22 * Math.cos((Math.min(54, absDeltaDeg) * Math.PI) / 108);
  const scale = isHoveredOrSelected
    ? perspectiveScale * 1.1
    : perspectiveScale * (1.0 + Math.sin(elapsedSec * 1.1 + planet.orbitPhaseRad) * 0.022);

  const rotationDeg = Math.sin(elapsedSec * 0.4 + planet.orbitPhaseRad) * 2.8;
  const haloIntensity = isHoveredOrSelected
    ? 1.0
    : (0.45 + 0.45 * (0.5 + 0.5 * Math.sin(elapsedSec * 1.5 + planet.orbitPhaseRad))) * frustumOpacity;

  return {
    translateX,
    translateY,
    scale,
    rotationDeg,
    haloIntensity,
    wrappedAzimuthDeltaDeg,
    frustumOpacity,
    isVisibleInFrustum,
    isLockedInPlace: true,
  };
}

export interface LabStudioHorizonState {
  /** Vertical lift of the giant bottom planet horizon in pixels (positive = rises higher into view) */
  horizonLiftPx: number;
  /** Horizontal pan offset of the giant planet curvature */
  horizonPanX: number;
  /** Subtle banking tilt of the planetary horizon in degrees */
  horizonTiltDeg: number;
  /** Solar limb flare intensity (0.35 .. 1.0), peaking as you scroll/pan toward the horizon */
  solarFlareIntensity: number;
  /** Continuous 360° rotation shift of the planet's sparkling surface lights & galaxy nebula */
  surfaceRotationShiftPx: number;
  /** Normalized 360° galaxy yaw angle in degrees (0..360) */
  galaxyYawDeg: number;
}

/**
 * Computes the photorealistic Giant Planet Horizon, 360° Galaxy Nebula & Solar Limb Flare choreography
 * at the bottom of the background (`seperti di video labstudio.ai`), responding smoothly
 * to scroll (`gulir`) and full 360° horizontal drag pan (`geser 360°`).
 */
export function computeLabStudioHorizonState(
  scrollProgress: number,
  panX: number,
  panY: number,
  elapsedSec: number
): LabStudioHorizonState {
  // As the user scrolls down or drags upward, the giant glowing planet horizon rises up majestically
  const scrollWave = Math.sin(scrollProgress * Math.PI * 1.5);
  const horizonLiftPx =
    scrollWave * 115 +
    Math.max(-140, Math.min(180, -panY * 0.48)) +
    Math.sin(elapsedSec * 0.45) * 8;

  // Periodic curvature pan that breathes smoothly even across infinite 360° horizontal rotation
  const galaxyYawDeg = (((-panX * 0.25 + scrollProgress * 54) % 360) + 360) % 360;
  const horizonPanX = Math.sin((galaxyYawDeg * Math.PI) / 180) * 140;
  const horizonTiltDeg = Math.max(
    -7,
    Math.min(7, Math.sin((galaxyYawDeg * Math.PI) / 180) * 4.2 + Math.sin(scrollProgress * Math.PI * 2) * 2.4)
  );

  const normalizedLift = Math.max(0, Math.min(1, (horizonLiftPx + 80) / 220));
  const solarFlareIntensity =
    0.48 +
    0.52 * normalizedLift * (0.88 + 0.12 * Math.sin(elapsedSec * 1.8));

  const surfaceRotationShiftPx =
    elapsedSec * 14 + panX * 0.85 + scrollProgress * 220;

  return {
    horizonLiftPx,
    horizonPanX,
    horizonTiltDeg,
    solarFlareIntensity,
    surfaceRotationShiftPx,
    galaxyYawDeg,
  };
}

export interface ConstellationParticleScatterInput {
  particleLocalX: number;
  particleLocalY: number;
  dispX: number;
  dispY: number;
  velX: number;
  velY: number;
  /** Local-space touch points (head + active crescent wake trail nodes) */
  touchPointsLocal: ReadonlyArray<{ x: number; y: number; weight?: number }>;
  /** Velocity of the active touch/pointer in local space */
  wakeVx: number;
  wakeVy: number;
  /** Interaction radius in local coordinates (default 135px) */
  scatterRadiusPx?: number;
  /** Maximum radial scatter displacement in local coordinates (default 145px) */
  maxScatterDispPx?: number;
}

export interface ConstellationParticleScatterOutput {
  nextDispX: number;
  nextDispY: number;
  nextVelX: number;
  nextVelY: number;
  /** Scatter excitation factor (0..1) indicating how strongly the particle was hit by the touch wake */
  scatterExcitation: number;
}

/**
 * Pure physics step that makes Rasi Bintang (Star Constellation) particles scatter dynamically
 * (`particel nya menyebar jika terkena visual sentuhannya`) whenever touched by the user's
 * visual crescent light-wake head or trail, then smoothly glide back into constellation formation.
 */
export function computeConstellationParticleTouchScatter(
  input: ConstellationParticleScatterInput
): ConstellationParticleScatterOutput {
  const scatterRadius = input.scatterRadiusPx ?? 135;
  const maxScatterDisp = input.maxScatterDispPx ?? 145;

  const currX = input.particleLocalX + input.dispX;
  const currY = input.particleLocalY + input.dispY;

  let totalImpulseX = 0;
  let totalImpulseY = 0;
  let peakExcitation = 0;

  for (let i = 0; i < input.touchPointsLocal.length; i++) {
    const pt = input.touchPointsLocal[i];
    const weight = pt.weight ?? Math.max(0.25, 1 - i * 0.14);
    const dx = currX - pt.x;
    const dy = currY - pt.y;
    const dist = Math.hypot(dx, dy);
    const effectiveRadius = scatterRadius * (0.72 + 0.28 * weight);

    if (dist < effectiveRadius) {
      const falloff = Math.pow(1 - dist / effectiveRadius, 1.55) * weight;
      const nx = dist > 0.001 ? dx / dist : Math.cos(i * 1.7 + input.particleLocalX * 0.1);
      const ny = dist > 0.001 ? dy / dist : Math.sin(i * 1.7 + input.particleLocalY * 0.1);
      // Tangential swirl + radial burst + wake momentum carry so particles visibly scatter outward
      const tx = -ny;
      const ty = nx;

      const radialBurst = 9.8 * falloff;
      const swirlBurst = 3.2 * falloff;
      const wakeCarry = 0.26 * falloff;

      totalImpulseX += nx * radialBurst + tx * swirlBurst + input.wakeVx * wakeCarry;
      totalImpulseY += ny * radialBurst + ty * swirlBurst + input.wakeVy * wakeCarry;
      if (falloff > peakExcitation) {
        peakExcitation = falloff;
      }
    }
  }

  // Soft harmonic spring back toward home constellation point + smooth space damping
  const springK = peakExcitation > 0.05 ? 0.035 : 0.075;
  const damping = peakExcitation > 0.05 ? 0.88 : 0.82;

  let nextVelX = (input.velX + totalImpulseX - input.dispX * springK) * damping;
  let nextVelY = (input.velY + totalImpulseY - input.dispY * springK) * damping;

  let nextDispX = input.dispX + nextVelX;
  let nextDispY = input.dispY + nextVelY;

  const dispMag = Math.hypot(nextDispX, nextDispY);
  if (dispMag > maxScatterDisp) {
    const clampScale = maxScatterDisp / dispMag;
    nextDispX *= clampScale;
    nextDispY *= clampScale;
    nextVelX *= 0.7;
    nextVelY *= 0.7;
  }

  return {
    nextDispX,
    nextDispY,
    nextVelX,
    nextVelY,
    scatterExcitation: clamp01(peakExcitation),
  };
}

export interface ConstellationReelSafePose {
  visible: boolean;
  kind: ParticleObjectKind;
  chapterIndex: number;
  anchorXNorm: number;
  anchorYNorm: number;
  /** Screen-space X in px including scroll-slide offset (`menggeser saat di gulir`) */
  screenX: number;
  /** Screen-space Y in px including scroll-slide offset (`menggeser saat di gulir`) */
  screenY: number;
  /** Horizontal slide offset in px caused by scrolling */
  slideOffsetX: number;
  /** Vertical slide offset in px caused by scrolling */
  slideOffsetY: number;
  /** Opacity (0..1) that rapidly fades to 0 when scrolling (`menghilang saat di gulir`) */
  opacity: number;
  /** Compact scale multiplier so the constellation never touches the 3D film reels */
  scale: number;
  /** Subtle banking rotation in radians during scroll slide */
  tiltRad: number;
}

/**
 * Computes a 100% reel-free screen pose for the active chapter's Rasi Bintang (Star Constellation)
 * that slides smoothly (`menggeser`) and disappears (`menghilang`) when the page is scrolled,
 * guaranteeing zero contact or overlap with the 3D Film Reels in any chapter or transition.
 */
export function computeConstellationReelSafeScreenPose(
  scrollProgress: number,
  introSweepProgress = 1,
  scrollVelocity = 0,
  viewportW = 1440,
  viewportH = 900
): ConstellationReelSafePose {
  const p = clamp01(scrollProgress);
  const sweep = clamp01(introSweepProgress);

  interface SafeChapterPocket {
    chapterIndex: number;
    kind: ParticleObjectKind;
    center: number;
    halfWindow: number;
    /** Guaranteed reel-free normalized coordinates */
    safeXNorm: number;
    safeYNorm: number;
    /** Safe slide vector (in px per 0.06 scroll progress) pointing away from the 3D reels */
    slideVecX: number;
    slideVecY: number;
  }

  const SAFE_POCKETS: SafeChapterPocket[] = [
    {
      chapterIndex: 0,
      kind: 'camera',
      center: 0.0,
      halfWindow: 0.068,
      // Upper-center open sky pocket (between top-left reel arch, right reel loop, and Cyber Voxel planet)
      safeXNorm: 0.46,
      safeYNorm: 0.23,
      slideVecX: 115,
      slideVecY: -95,
    },
    {
      chapterIndex: 1,
      kind: 'clapper',
      center: 0.25,
      halfWindow: 0.068,
      // Lower-left open sky pocket (below top-left pod, left of center-right reel sweep)
      safeXNorm: 0.27,
      safeYNorm: 0.75,
      slideVecX: -120,
      slideVecY: 85,
    },
    {
      chapterIndex: 2,
      kind: 'graphic',
      center: 0.5,
      halfWindow: 0.068,
      // Wide-open center sky pocket (strictly below and left of the diagonal upper-right 3D film reel arch!)
      safeXNorm: 0.44,
      safeYNorm: 0.44,
      slideVecX: -115,
      slideVecY: -78,
    },
    {
      chapterIndex: 3,
      kind: 'prism',
      center: 0.75,
      halfWindow: 0.068,
      // Lower-right open sky pocket
      safeXNorm: 0.67,
      safeYNorm: 0.73,
      slideVecX: 118,
      slideVecY: 82,
    },
    {
      chapterIndex: 4,
      kind: 'waveform',
      center: 0.96,
      halfWindow: 0.068,
      // Center-right open sky pocket
      safeXNorm: 0.65,
      safeYNorm: 0.46,
      slideVecX: 115,
      slideVecY: -80,
    },
  ];

  let activePocket = SAFE_POCKETS[0];
  let minAbsDelta = Infinity;
  for (const pocket of SAFE_POCKETS) {
    const d = Math.abs(p - pocket.center);
    if (d < minAbsDelta) {
      minAbsDelta = d;
      activePocket = pocket;
    }
  }

  const signedDelta = p - activePocket.center;
  const absDelta = Math.abs(signedDelta);

  if (absDelta >= activePocket.halfWindow || sweep < 0.35) {
    const clampedNorm = Math.max(-1, Math.min(1, signedDelta / activePocket.halfWindow));
    const slideOffsetX = clampedNorm * activePocket.slideVecX;
    const slideOffsetY = clampedNorm * activePocket.slideVecY;
    return {
      visible: false,
      kind: 'none',
      chapterIndex: activePocket.chapterIndex,
      anchorXNorm: activePocket.safeXNorm,
      anchorYNorm: activePocket.safeYNorm,
      screenX: viewportW * activePocket.safeXNorm + slideOffsetX,
      screenY: viewportH * activePocket.safeYNorm + slideOffsetY,
      slideOffsetX,
      slideOffsetY,
      opacity: 0,
      scale: 0.58,
      tiltRad: clampedNorm * 0.22,
    };
  }

  // Normalized scroll distance from chapter lock [-1 .. +1]
  const u = signedDelta / activePocket.halfWindow;
  // Cosine bell curve so the constellation peaks at rest and smoothly fades to 0 as it slides away
  const windowFade = Math.pow(0.5 * (1 + Math.cos(u * Math.PI)), 1.65);
  // Active scroll velocity attenuation so scrolling immediately triggers fade-out
  const velocityFade = Math.exp(-Math.abs(scrollVelocity) * 5.2);
  const introGate = smoothstep(0.35, 0.85, sweep);
  const opacity = clamp01(windowFade * velocityFade * introGate);

  // Smooth scroll-induced sliding offset (`menggeser lalu menghilang saat di gulir`)
  const velocitySlideBoost = Math.max(-0.45, Math.min(0.45, scrollVelocity * 0.32));
  const effectiveSlideU = Math.max(-1.15, Math.min(1.15, u + velocitySlideBoost));
  const slideOffsetX = effectiveSlideU * activePocket.slideVecX;
  const slideOffsetY = effectiveSlideU * activePocket.slideVecY;

  const baseScale = Math.min(1.02, Math.max(0.76, Math.min(viewportW, viewportH) / 860));
  const scale = baseScale * (0.68 + 0.32 * windowFade);
  const tiltRad = effectiveSlideU * 0.18;

  return {
    visible: opacity > 0.02,
    kind: opacity > 0.02 ? activePocket.kind : 'none',
    chapterIndex: activePocket.chapterIndex,
    anchorXNorm: activePocket.safeXNorm,
    anchorYNorm: activePocket.safeYNorm,
    screenX: viewportW * activePocket.safeXNorm + slideOffsetX,
    screenY: viewportH * activePocket.safeYNorm + slideOffsetY,
    slideOffsetX,
    slideOffsetY,
    opacity,
    scale,
    tiltRad,
  };
}



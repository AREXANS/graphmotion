import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeScrollChoreography,
  computeSlowMoAndFrameLock,
  computeHelixRungTransform,
  computeFilmRibbonPoint,
  computeWaterBubbleTransform,
  computeOrbitalCardTransform,
  computeEqualizerCrownBarTransform,
  computeCursorCardMagnetism,
  computePointerParallax,
  computeHoverVisualTargets,
  evaluateClickSpinBounce,
  computeMorphoCursorWakeState,
  computeSwarmParticleDispersion,
  getChapterParticleObjectZone,
  computeScrollCameraObjectState,
  computeBrandIntroState,
  computeCameraOrGraphicParticlePoint,
  computeGraphicSplinePoint,
  computeLockedParticleWorldPosition,
  computeChapterExplanationCameraMotion,
} from './landing-3d-kinematics';

test('Chapter Explanation Camera-Shift Motion: scroll-direction-aware entry/exit vectors and continuous intra-chapter 3D camera parallax', () => {
  // 1. At exact chapter centers (0.00, 0.25, 0.50, 0.75), signedDeltaFromCenter is 0 and opacity is 1
  const ch1CenterDown = computeChapterExplanationCameraMotion(0.25, 1, 1, 0.2);
  const ch1CenterUp = computeChapterExplanationCameraMotion(0.25, 1, -1, 0.2);

  assert.equal(ch1CenterDown.chapterIndex, 1);
  assert.equal(ch1CenterDown.signedDeltaFromCenter, 0);
  assert.equal(ch1CenterDown.podTransform.opacity, 1);
  assert.equal(ch1CenterDown.headlineTransform.opacity, 1);

  // 2. Scrolling DOWN (+1) vs UP (-1) reverses the camera-shift entry and exit vectors!
  assert.notEqual(
    ch1CenterDown.podTransition.enter.x,
    ch1CenterUp.podTransition.enter.x,
    'Scrolling down vs up reverses the incoming 3D camera shift X vector'
  );
  assert.equal(
    ch1CenterDown.podTransition.enter.x,
    ch1CenterUp.podTransition.exit.x,
    'Downward entry vector equals upward exit vector (reversible 3D camera path)'
  );
  assert.equal(
    ch1CenterDown.podTransition.exit.y,
    ch1CenterUp.podTransition.enter.y,
    'Downward exit Y vector equals upward entry Y vector'
  );
  assert.notEqual(
    ch1CenterDown.cameraShiftVector.trajectoryLabel,
    ch1CenterUp.cameraShiftVector.trajectoryLabel,
    'Camera trajectory HUD label reflects scroll direction'
  );

  // 3. Continuous intra-chapter scroll movement shifts the explanation pod & headline along the camera trajectory
  const ch2Approaching = computeChapterExplanationCameraMotion(0.41, 2, 1, 0.4);
  const ch2Center = computeChapterExplanationCameraMotion(0.5, 2, 1, 0.0);
  const ch2Departing = computeChapterExplanationCameraMotion(0.59, 2, 1, 0.4);

  assert.ok(ch2Approaching.signedDeltaFromCenter < -0.5, 'Approaching chapter has negative delta');
  assert.equal(ch2Center.signedDeltaFromCenter, 0, 'Center of chapter has zero delta');
  assert.ok(ch2Departing.signedDeltaFromCenter > 0.5, 'Departing chapter has positive delta');

  // Verify the pod physically glides across X and Y and tilts in 3D as the camera scrolls through the chapter
  assert.ok(
    Math.abs(ch2Approaching.podTransform.translateX - ch2Departing.podTransform.translateX) > 25,
    'Explanation pod glides significantly across X as camera pans through chapter'
  );
  assert.ok(
    Math.abs(ch2Approaching.podTransform.rotateYDeg - ch2Departing.podTransform.rotateYDeg) > 4,
    'Explanation pod banks in 3D perspective (rotateY) with camera shift'
  );
  assert.ok(
    ch2Approaching.podTransform.scale < ch2Center.podTransform.scale &&
      ch2Departing.podTransform.scale < ch2Center.podTransform.scale,
    'Explanation pod scales up to 1.0 at focal lock and recedes at chapter edges'
  );

  // 4. Slow-scroll boundary continuity: at exact chapter boundary (e.g. 0.38 between Ch1 and Ch2), opacity is 0 and blurPx > 7
  const ch2AtEntryBoundary = computeChapterExplanationCameraMotion(0.38, 2, 1, 0.02);
  const ch2AtExitBoundary = computeChapterExplanationCameraMotion(0.60, 2, 1, 0.02);
  assert.equal(ch2AtEntryBoundary.podTransform.opacity, 0, 'Pod opacity smoothly reaches 0 at entry boundary');
  assert.equal(ch2AtExitBoundary.podTransform.opacity, 0, 'Pod opacity smoothly reaches 0 at exit boundary');
  assert.equal(ch2Center.podTransform.blurPx, 0, 'Pod blur is 0px at chapter plateau');
  assert.ok(ch2AtEntryBoundary.podTransform.blurPx > 7, 'Pod has optical depth-of-field blur at boundary');
});

test('5 Chapter Gesture Objects & Graph Motion Top-Left Camera-Shift Docking: unobstructed placement, scroll-camera glide, and smooth top-left docking', () => {
  const z0 = getChapterParticleObjectZone(0);
  const z1 = getChapterParticleObjectZone(1);
  const z2 = getChapterParticleObjectZone(2);
  const z3 = getChapterParticleObjectZone(3);
  const z4 = getChapterParticleObjectZone(4);

  // Every chapter stop has its own contextual 3D gesture object in an unobstructed negative-space pocket
  assert.equal(z0.visible, true);
  assert.equal(z0.kind, 'camera');
  assert.ok(Math.abs(z0.anchorXNorm - 0.52) < 1e-4 && Math.abs(z0.anchorYNorm - 0.32) < 1e-4);

  assert.equal(z1.visible, true);
  assert.equal(z1.kind, 'clapper');
  assert.ok(Math.abs(z1.anchorXNorm - 0.38) < 1e-4 && Math.abs(z1.anchorYNorm - 0.74) < 1e-4);

  assert.equal(z2.visible, true);
  assert.equal(z2.kind, 'graphic');
  assert.ok(Math.abs(z2.anchorXNorm - 0.68) < 1e-4 && Math.abs(z2.anchorYNorm - 0.34) < 1e-4);

  assert.equal(z3.visible, true);
  assert.equal(z3.kind, 'prism');
  assert.ok(Math.abs(z3.anchorXNorm - 0.62) < 1e-4 && Math.abs(z3.anchorYNorm - 0.76) < 1e-4);

  assert.equal(z4.visible, true);
  assert.equal(z4.kind, 'waveform');
  assert.ok(Math.abs(z4.anchorXNorm - 0.57) < 1e-2 && Math.abs(z4.anchorYNorm - 0.48) < 1e-2);

  // Verify scroll-camera-driven movement (`posisinya berubah otomatis objek itu bergerak juga sesuai gulirannya`)
  const camStart = computeScrollCameraObjectState(0.0, 1.0);
  const camMidScroll = computeScrollCameraObjectState(0.07, 1.0);
  const camTransitionGap = computeScrollCameraObjectState(0.155, 1.0);
  assert.ok(camMidScroll.anchorXNorm < camStart.anchorXNorm, 'Camera object glides upward-left away from rising right reel');
  assert.ok(camMidScroll.anchorYNorm < camStart.anchorYNorm, 'Camera object glides up with camera pan');
  assert.ok((camMidScroll.opacity ?? 1) < (camStart.opacity ?? 1), 'Camera object fades as camera scrolls away');
  assert.equal(camTransitionGap.visible, false, 'Object cleanly disappears between chapter windows');

  // Verify Brand Intro & Smooth Camera-Shift Docking to Top-Left Corner (`pojok kiri atas`)
  const introStart = computeBrandIntroState(0.2, false);
  const introEmblem = computeBrandIntroState(1.5, false);
  const introDocking = computeBrandIntroState(2.95, false);
  const introDone = computeBrandIntroState(4.0, false);

  assert.equal(introStart.isActive, true);
  assert.equal(introStart.morphStage, 'graph-genesis');
  assert.equal(introStart.brandAnchorXNorm, 0.5);
  assert.equal(introStart.brandAnchorYNorm, 0.46);
  assert.equal(introEmblem.morphStage, 'emblem-convergence');
  assert.equal(introDocking.morphStage, 'camera-dock-topleft');
  assert.ok(
    introDocking.brandAnchorXNorm < 0.5 && introDocking.brandAnchorYNorm < 0.46,
    'Graph Motion brand glides toward the top-left corner during camera-dock-topleft'
  );
  assert.equal(introDone.isActive, false);
  assert.equal(introDone.dockToHeaderProgress, 1.0);
  assert.ok(Math.abs(introDone.brandAnchorXNorm - 0.095) < 1e-4);
  assert.ok(Math.abs(introDone.brandAnchorYNorm - 0.046) < 1e-4);

  // Verify all particles of all 5 object types stay inside compact safe bounds
  const kinds = ['camera', 'clapper', 'graphic', 'prism', 'waveform'] as const;
  for (const k of kinds) {
    for (let i = 0; i < 300; i++) {
      const pt = computeCameraOrGraphicParticlePoint(i, 300, k, 1.2);
      assert.ok(
        Math.abs(pt.localX) <= 125 && Math.abs(pt.localY) <= 95,
        `${k} particle ${i} out of safe bounds: (${pt.localX}, ${pt.localY})`
      );
    }
  }

  // Verify rigid wireframe-to-particle lock across rapid camera shift transitions (0px separation)
  const sampleP0 = computeScrollCameraObjectState(0.62, 1.0);
  const sampleP1 = computeScrollCameraObjectState(0.74, 1.0);
  const localPt = computeCameraOrGraphicParticlePoint(50, 300, 'prism', 1.2);
  const world0 = computeLockedParticleWorldPosition(
    localPt.localX,
    localPt.localY,
    1440 * sampleP0.anchorXNorm,
    900 * sampleP0.anchorYNorm,
    sampleP0.perspectiveTiltRad ?? 0,
    sampleP0.scaleMultiplier ?? 1,
    0,
    0
  );
  const world1 = computeLockedParticleWorldPosition(
    localPt.localX,
    localPt.localY,
    1440 * sampleP1.anchorXNorm,
    900 * sampleP1.anchorYNorm,
    sampleP1.perspectiveTiltRad ?? 0,
    sampleP1.scaleMultiplier ?? 1,
    0,
    0
  );
  // Rigid world position equals exact canvas transform(anchor, tilt, scale) with 0px lag
  const tilt1 = sampleP1.perspectiveTiltRad ?? 0;
  const scale1 = sampleP1.scaleMultiplier ?? 1;
  const expectedX1 =
    1440 * sampleP1.anchorXNorm +
    (localPt.localX * Math.cos(tilt1) - localPt.localY * Math.sin(tilt1)) * scale1;
  const expectedY1 =
    900 * sampleP1.anchorYNorm +
    (localPt.localX * Math.sin(tilt1) + localPt.localY * Math.cos(tilt1)) * scale1;
  assert.ok(Math.abs(world1.x - expectedX1) < 1e-6);
  assert.ok(Math.abs(world1.y - expectedY1) < 1e-6);
  assert.ok(Math.hypot(world1.x - world0.x, world1.y - world0.y) > 50);

  // Verify Bab 03 graphic spline particles sit directly on the shared wireframe spline
  const splineMidPt = computeCameraOrGraphicParticlePoint(680, 1000, 'graphic', 0.8);
  const tSpline = ((0.68 - 0.62) / 0.2) / 0.72;
  const expectedSpline = computeGraphicSplinePoint(tSpline, 0.8);
  assert.ok(Math.abs(splineMidPt.localX - expectedSpline.x) < 1e-6);
  assert.ok(Math.abs(splineMidPt.localY - expectedSpline.y) < 1e-6);
});

test('Morpho Cursor/Touch Crescent Wake & Particle Swarm Dispersion: swiping ignites blinding white-cyan wake and disperses nearby particles', () => {
  const idleWake = computeMorphoCursorWakeState(0.0, 0.0, 0.0, 0.0, 0.016, 0.0, false);
  const swipeWake = computeMorphoCursorWakeState(0.35, 0.25, 0.05, 0.02, 0.016, 0.1, true);

  assert.equal(idleWake.isErupting, false);
  assert.equal(swipeWake.isErupting, true);
  assert.ok(swipeWake.wakeEnergy > 0.7, `Expected swipe wakeEnergy > 0.7, got ${swipeWake.wakeEnergy}`);
  assert.ok(swipeWake.whiteCoreIntensity > 0.8, `Expected blinding white core > 0.8, got ${swipeWake.whiteCoreIntensity}`);

  // Compare particle state when cursor is far vs right on top of the particle during a swipe
  const baseParticle = computeSwarmParticleDispersion(10, 200, 0.5, 0.0, 99.0, 99.0, 0.0, 0);
  const activeParticle = computeSwarmParticleDispersion(
    10,
    200,
    0.5,
    0.0,
    baseParticle.x,
    baseParticle.y,
    swipeWake.wakeEnergy,
    swipeWake.swipeAngleRad
  );

  assert.ok(
    activeParticle.dispersionMagnitude > 0.5,
    `Expected strong vortex dispersion when swiping over particle, got ${activeParticle.dispersionMagnitude}`
  );
  assert.ok(
    activeParticle.heatCoreBlend > baseParticle.heatCoreBlend + 0.5,
    'Particle near swipe should shift toward blinding white-cyan heat core'
  );
});

test('Scroll Choreography: at hero top (scrollY = 0), camera is in Shot 0 wide zoom-out view', () => {
  const heroState = computeScrollChoreography(0, 3000, false);
  assert.equal(heroState.scrollProgress, 0);
  assert.equal(heroState.activeChapterIndex, 0);
  assert.equal(heroState.viewPhase, 0);
  assert.equal(heroState.zoomMode, 'zoom-out');
  assert.equal(heroState.focalFrameIndex, 0);
  assert.ok(heroState.camPosZ > 5.4);
});

test('Per-Frame Zoom-In & Zoom-Out Alternation: chapters alternate between wide zoom-out and per-frame macro zoom-in', () => {
  const ch0 = computeScrollChoreography(0, 3000, false); // p = 0.00
  const ch1 = computeScrollChoreography(750, 3000, false); // p = 0.25
  const ch2 = computeScrollChoreography(1500, 3000, false); // p = 0.50
  const ch3 = computeScrollChoreography(2250, 3000, false); // p = 0.75

  assert.equal(ch0.zoomMode, 'zoom-out');
  assert.equal(ch1.zoomMode, 'zoom-in');
  assert.equal(ch2.zoomMode, 'zoom-out');
  assert.equal(ch3.zoomMode, 'zoom-in');

  assert.ok(ch1.camPosZ < 3.4, 'Chapter 02 zooms in close to the Storyboard frame');
  assert.ok(ch2.camPosZ > 4.9, 'Chapter 03 zooms out to show the sweeping Voice canopy');
  assert.ok(ch3.camPosZ < 3.2, 'Chapter 04 zooms in close to the 60 FPS Spring frame');
});

test('Slow-Mo Dwell & Contextual Frame Lock: stopping scroll enters slow-motion (timeScale ~0.14) and locks contextual frame', () => {
  const stoppedAtCh1 = computeSlowMoAndFrameLock(0.25, 0.0, 1.0);
  const fastScrolling = computeSlowMoAndFrameLock(0.25, 0.85, 1.0);

  assert.equal(stoppedAtCh1.isSlowMoDwell, true);
  assert.equal(fastScrolling.isSlowMoDwell, false);
  assert.ok(
    stoppedAtCh1.timeScale < 0.2,
    `Expected slow-mo timeScale < 0.2 when stopped, got ${stoppedAtCh1.timeScale}`
  );
  assert.ok(
    fastScrolling.timeScale > 1.4,
    `Expected fast timeScale > 1.4 when scrolling, got ${fastScrolling.timeScale}`
  );
  assert.equal(stoppedAtCh1.focalFrameIndex, 1);
  assert.equal(stoppedAtCh1.zoomMode, 'zoom-in');
});

test('Full-Bleed Long Film Ribbon & Dynamic Curvature: spans far past viewport edges in every chapter and morphs shape', () => {
  for (const p of [0.0, 0.25, 0.5, 0.75, 1.0]) {
    const startPt = computeFilmRibbonPoint(0.0, 0, p, 0);
    const endPt = computeFilmRibbonPoint(1.0, 0, p, 0);
    assert.ok(startPt.x < -6.5, `At p=${p}, left end of reel extends far off-screen (${startPt.x})`);
    assert.ok(endPt.x > 6.5, `At p=${p}, right end of reel extends far off-screen (${endPt.x})`);
  }

  const ch0Mid = computeFilmRibbonPoint(0.35, 0, 0.0, 0);
  const ch1Mid = computeFilmRibbonPoint(0.35, 0, 0.25, 0.5);
  const ch2Mid = computeFilmRibbonPoint(0.35, 0, 0.5, 1.0);
  const ch3Mid = computeFilmRibbonPoint(0.35, 0, 0.75, 0.3);

  const dist01 = Math.hypot(ch1Mid.x - ch0Mid.x, ch1Mid.y - ch0Mid.y, ch1Mid.z - ch0Mid.z);
  const dist12 = Math.hypot(ch2Mid.x - ch1Mid.x, ch2Mid.y - ch1Mid.y, ch2Mid.z - ch1Mid.z);
  const dist23 = Math.hypot(ch3Mid.x - ch2Mid.x, ch3Mid.y - ch2Mid.y, ch3Mid.z - ch2Mid.z);

  assert.ok(dist01 > 0.8);
  assert.ok(dist12 > 0.8);
  assert.ok(dist23 > 0.8);

  // Verify that while sitting at a chapter (same scrollProgress), the 3D curve does NOT drift over time
  const ch2AtT0 = computeFilmRibbonPoint(0.42, 0.0, 0.5, 0);
  const ch2AtT25 = computeFilmRibbonPoint(0.42, 25.0, 0.5, 0);
  assert.equal(ch2AtT0.x, ch2AtT25.x, 'Reel curve X must stay fixed at each chapter');
  assert.equal(ch2AtT0.y, ch2AtT25.y, 'Reel curve Y must stay fixed at each chapter');
  assert.equal(ch2AtT0.z, ch2AtT25.z, 'Reel curve Z must stay fixed at each chapter');
});

test('Water Bubble Depth Layering (75% Behind Reels, 25% Front) & Pointer Parallax', () => {
  const b0 = computeWaterBubbleTransform(0, 16, 0.0, 0.0);
  const b1 = computeWaterBubbleTransform(0, 16, 0.8, 0.0);
  assert.notEqual(b0.y, b1.y);
  assert.notEqual(b0.scaleX, b0.scaleY);

  let behindCount = 0;
  let frontCount = 0;
  for (let i = 0; i < 16; i++) {
    const b = computeWaterBubbleTransform(i, 16, 0.5, 0.25);
    if (b.depthLayer === 'behind') {
      behindCount++;
      assert.ok(
        b.zOffsetFromRibbon < -0.5,
        `Behind bubble ${i} must have negative zOffsetFromRibbon, got ${b.zOffsetFromRibbon}`
      );
    } else {
      frontCount++;
      assert.ok(
        b.zOffsetFromRibbon > 0.2,
        `Front bubble ${i} must have positive zOffsetFromRibbon, got ${b.zOffsetFromRibbon}`
      );
    }
  }
  assert.equal(behindCount, 12, '75% of bubbles must be behind the 3D reels');
  assert.equal(frontCount, 4, 'Only 25% of bubbles are in front so reels are not obstructed');

  const closedRung = computeHelixRungTransform(7, 16, 0, 0.0, 0.0);
  const openMacroRung = computeHelixRungTransform(7, 16, 0, 0.5, 1.0);
  assert.ok(openMacroRung.couplerGap > closedRung.couplerGap * 3.5);

  const center = computePointerParallax(0, 0);
  assert.equal(center.rotX, 0);
  const near = computeCursorCardMagnetism(2.0, 1.0, 2.2, 1.1, 0.5);
  assert.ok(near.offsetZ > 0.5);
  const choreo = computeScrollChoreography(0, 3000, false);
  const pod0 = computeOrbitalCardTransform(0, 12, 0, choreo, false);
  assert.ok(pod0.x > 2.5);
  const barNear = computeEqualizerCrownBarTransform(0, 48, 0.5, 1.95, 0.0, 0);
  assert.ok(barNear.scaleY > 0.4);
  const hovered = computeHoverVisualTargets(true, false);
  assert.ok(hovered.targetHoverScale > 1.0);
  const midBounce = evaluateClickSpinBounce(0.2, 0.95);
  assert.equal(midBounce.isActive, true);
});

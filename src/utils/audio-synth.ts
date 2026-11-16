/**
 * Web Audio API Generative Music Synthesizer & Authentic SatsetMotion SFX Engine.
 * Integrates satsetmotion.id's 43 procedural SFX cues, 17 scene transition sound pairs,
 * per-word subtitle ticks, and 6 theme-style sonic flavors ('default' | '8bit' | 'digital' | 'paper' | 'chalk' | 'soft').
 */

import { AudioMood } from '../types';
import {
  SATSET_TRANSITIONS,
  SATSET_SFX_NAMES,
  collectSatsetSfxTimeline,
  playSatsetRawSfx,
  scheduleSatsetSfxTimeline,
  getSatsetStyleSfxFlavor,
  mapSatsetSfxToFlavor,
  normalizeSatsetTransitionId,
  resolveSatsetStyleId,
} from './custom-style-runtime';

export interface SfxTriggerOptions {
  styleId?: string;
  gain?: number;
  pitch?: number;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isMuted = false;
  private sfxEnabled = true;
  private volume = 0.72;
  private sfxVolume = 0.96;
  private activeStyleId = 'scribble3d';
  private isPlaying = false;
  private activeOscillators: OscillatorNode[] = [];
  private pulseInterval: number | null = null;
  private timelineSfxStopFn: (() => void) | null = null;
  private timelineScheduleSeq = 0;
  private timelineEvents: any[] = [];
  private timelineScheduledKeys = new Set<string>();
  private timelineLastPlayheadSec = -1;
  private timelineFlavor = 'default';
  private timelineSfxFiredCount = 0;
  private timelineLastCues: string[] = [];
  private timelineSchedulerInterval: number | null = null;
  private lastClockSyncWallMs = 0;

  private publishAudioDebugState() {
    if (typeof window === 'undefined') return;
    try {
      (window as unknown as { __SATSET_AUDIO_DEBUG__?: Record<string, unknown> }).__SATSET_AUDIO_DEBUG__ = {
        ctxState: this.getContextState(),
        eventCount: this.timelineEvents.length,
        firedCount: this.timelineSfxFiredCount,
        lastCues: this.timelineLastCues.slice(-16),
        sfxEnabled: this.sfxEnabled,
        isMuted: this.isMuted,
        playheadSec: this.timelineLastPlayheadSec,
      };
    } catch {
      // Ignore debug publication errors
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        const analyser = this.ctx.createAnalyser();
        analyser.fftSize = 64;
        this.analyser = analyser;

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);

        // Smooth DynamicsCompressor soft-limiter prevents harsh oscillator clicks/clipping
        const compressor = this.ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-10, this.ctx.currentTime);
        compressor.knee.setValueAtTime(14, this.ctx.currentTime);
        compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
        compressor.attack.setValueAtTime(0.004, this.ctx.currentTime);
        compressor.release.setValueAtTime(0.14, this.ctx.currentTime);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(
          this.sfxEnabled && !this.isMuted ? Math.min(2.2, this.sfxVolume * 1.45) : 0,
          this.ctx.currentTime
        );

        // Warm lowpass rolls off piercing metallic highs while preserving crisp foley/whoosh transients
        const sfxWarmFilter = this.ctx.createBiquadFilter();
        sfxWarmFilter.type = 'lowpass';
        sfxWarmFilter.frequency.setValueAtTime(5400, this.ctx.currentTime);
        sfxWarmFilter.Q.setValueAtTime(0.48, this.ctx.currentTime);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);

        this.sfxGain.connect(sfxWarmFilter);
        sfxWarmFilter.connect(this.masterGain);
        this.musicGain.connect(this.masterGain);
        this.masterGain.connect(compressor);
        compressor.connect(analyser);
        analyser.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx
        .resume()
        .then(() => {
          this.publishAudioDebugState();
        })
        .catch(() => {});
    }
  }

  /**
   * Synchronously initializes and unlocks the AudioContext inside a direct user click gesture.
   */
  public unlock(): Promise<void> {
    this.initContext();
    this.publishAudioDebugState();
    if (!this.ctx) return Promise.resolve();
    if (this.ctx.state === 'suspended') {
      return this.ctx
        .resume()
        .then(() => {
          this.publishAudioDebugState();
        })
        .catch(() => {});
    }
    return Promise.resolve();
  }

  public getContextState(): AudioContextState | 'uninitialized' {
    return this.ctx ? this.ctx.state : 'uninitialized';
  }

  public setActiveStyle(styleId: string) {
    if (styleId) {
      this.activeStyleId = resolveSatsetStyleId(styleId);
    }
  }

  public getActiveStyle(): string {
    return this.activeStyleId;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx && !this.isMuted) {
      this.musicGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.04);
    }
  }

  public setSfxVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1.5, val));
    if (this.sfxGain && this.ctx) {
      const target = this.sfxEnabled && !this.isMuted ? Math.min(2.2, this.sfxVolume * 1.45) : 0;
      this.sfxGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.03);
    }
    this.publishAudioDebugState();
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
    if (this.sfxGain && this.ctx) {
      const target = enabled && !this.isMuted ? Math.min(2.2, this.sfxVolume * 1.45) : 0;
      this.sfxGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.03);
    }
    if (!enabled) {
      this.stopTimelineSfx();
    }
    this.publishAudioDebugState();
  }

  public hasActiveTimelineSfx(): boolean {
    return this.timelineEvents.length > 0 && this.sfxEnabled && !this.isMuted;
  }

  public getSfxEnabled(): boolean {
    return this.sfxEnabled;
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.04);
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(
        !muted && this.sfxEnabled ? Math.min(2.2, this.sfxVolume * 1.45) : 0,
        this.ctx.currentTime,
        0.04
      );
    }
    this.publishAudioDebugState();
  }

  public getVolume() {
    return this.volume;
  }

  public getIsMuted() {
    return this.isMuted;
  }

  /**
   * Resolves any legacy/alias SFX name or passes semantic motion SFX names (`zoom_in`, `card_slide`,
   * `data_scan`, `shield_lock`, `graph_grow`, `cursor_click`, `key_type`, `cinema_boom`, etc.) directly
   * to the procedural Web Audio synthesizer.
   */
  public normalizeSfxName(rawName: string): string {
    const clean = (rawName || '').toLowerCase().trim();
    if (!clean) return 'pop';
    if (SATSET_SFX_NAMES.includes(clean)) return clean;
    const aliasMap: Record<string, string> = {
      chime: 'ding',
      bell: 'ding',
      swoosh: 'whoosh',
      subdrop: 'boom',
      bass: 'boom',
      hit: 'impact',
      punch: 'impact',
      burst: 'pop',
      keyboard: 'type',
      typing: 'type',
      camera: 'shutter',
      flip: 'pageflip',
      success: 'correct',
      win: 'tada',
      error: 'buzzer',
      wrong: 'buzzer',
      shine: 'sparkle',
      twinkle: 'sparkle',
    };
    return aliasMap[clean] || clean;
  }

  private duckMusicBriefly(durationSec = 0.28) {
    if (!this.ctx || !this.musicGain || this.isMuted || !this.isPlaying) return;
    try {
      const now = this.ctx.currentTime;
      const baseVol = Math.max(0.05, this.volume);
      const duckedVol = baseVol * 0.48;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setTargetAtTime(duckedVol, now, 0.025);
      this.musicGain.gain.setTargetAtTime(baseVol, now + Math.max(0.12, durationSec), 0.14);
    } catch {
      // ignore
    }
  }

  /**
   * Plays a single SFX cue using satsetmotion.id's authentic procedural Web Audio synthesizer
   * and maps it to the sonic flavor of the active or specified style ('default' | '8bit' | 'digital' | 'paper' | 'chalk' | 'soft').
   */
  public playSfx(cue: string, options?: SfxTriggerOptions) {
    if (!cue) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted || !this.sfxEnabled) return;

    const triggerNow = () => {
      if (!this.ctx || !this.sfxGain || this.isMuted || !this.sfxEnabled) return;
      try {
        const styleId = resolveSatsetStyleId(options?.styleId || this.activeStyleId || 'scribble3d');
        const flavor = getSatsetStyleSfxFlavor(styleId);
        const baseName = this.normalizeSfxName(cue);
        const [mappedName, mappedPitch, mappedGain] = mapSatsetSfxToFlavor(
          baseName,
          flavor,
          options?.pitch ?? 1,
          options?.gain ?? 0.85
        );
        this.duckMusicBriefly(0.22);
        playSatsetRawSfx(
          this.ctx,
          this.sfxGain,
          mappedName,
          this.ctx.currentTime + 0.005,
          mappedGain,
          mappedPitch,
          flavor
        );
        this.timelineSfxFiredCount++;
        this.timelineLastCues.push(mappedName);
        this.publishAudioDebugState();
      } catch {
        // Ignore audio context restriction errors before user gesture
      }
    };

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(triggerNow).catch(() => {});
    } else {
      triggerNow();
    }
  }

  public triggerSfx(cue: string, options?: SfxTriggerOptions) {
    this.playSfx(cue, options);
  }

  /**
   * Plays the authentic multi-stage transition sound pair (e.g., whoosh + boom, swipe + pop, shutter + impact)
   * defined in SATSET_TRANSITIONS for a given transition ID, flavored by the current video style.
   */
  public playTransitionSfx(transitionId: string, styleId?: string) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted || !this.sfxEnabled) return;

    const triggerPair = () => {
      if (!this.ctx || !this.sfxGain || this.isMuted || !this.sfxEnabled) return;
      try {
        const normId = normalizeSatsetTransitionId(transitionId) || 'match-morph';
        const transitionsList = SATSET_TRANSITIONS as unknown as Array<{
          id: string;
          sfx: Array<[string, number, number]>;
        }>;
        const transDef = transitionsList.find((t) => t.id === normId) || transitionsList[0];

        if (!transDef || !Array.isArray(transDef.sfx) || transDef.sfx.length === 0) return;

        const resolvedStyle = resolveSatsetStyleId(styleId || this.activeStyleId || 'scribble3d');
        const flavor = getSatsetStyleSfxFlavor(resolvedStyle);
        const minOffset = Math.min(...transDef.sfx.map((s) => Number(s[1])), 0);
        const now = this.ctx.currentTime + 0.01;
        this.duckMusicBriefly(0.3);

        for (const [sfxName, offsetSec, gain] of transDef.sfx) {
          const when = now + Math.max(0, Number(offsetSec) - minOffset);
          const [mappedName, mappedPitch, mappedGain] = mapSatsetSfxToFlavor(
            String(sfxName),
            flavor,
            1,
            Number(gain)
          );
          playSatsetRawSfx(this.ctx, this.sfxGain, mappedName, when, mappedGain, mappedPitch, flavor);
          this.timelineSfxFiredCount++;
          this.timelineLastCues.push(`trans:${mappedName}`);
        }
        this.publishAudioDebugState();
      } catch {
        // Ignore audio errors
      }
    };

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(triggerPair).catch(() => {});
    } else {
      triggerPair();
    }
  }

  /**
   * Lookahead SFX clock synchronized to the 60fps RAF playback loop.
   * Fires transition, word tick, and in-scene SFX cues within a tight 0.45s lookahead window,
   * handles backward seeks / loop wraps cleanly, and gracefully catches opening t=0 cues after resume.
   */
  public syncTimelineSfxClock(playheadSec: number, isExplicitSeek = false) {
    if (this.timelineEvents.length === 0 || !this.ctx || !this.sfxGain || this.isMuted || !this.sfxEnabled) {
      return;
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
      return;
    }

    this.lastClockSyncWallMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const clampedPlayhead = Math.max(0, playheadSec);
    // Detect loop wrap-around or backward seek -> reset fired cues from new playhead onward
    if (isExplicitSeek || (this.timelineLastPlayheadSec >= 0 && clampedPlayhead < this.timelineLastPlayheadSec - 0.18)) {
      this.timelineScheduledKeys.clear();
      if (clampedPlayhead > 0.08) {
        for (let i = 0; i < this.timelineEvents.length; i++) {
          const ev = this.timelineEvents[i];
          if (ev.t < clampedPlayhead - 0.04) {
            this.timelineScheduledKeys.add(`${i}:${Number(ev.t).toFixed(3)}:${ev.name}`);
          }
        }
      }
    }

    const lookaheadSec = 0.48;
    const graceWindow = this.timelineSfxFiredCount === 0 || clampedPlayhead <= 0.35 ? 0.42 : 0.18;
    const windowStart = Math.max(0, clampedPlayhead - graceWindow);
    const windowEnd = clampedPlayhead + lookaheadSec;
    const nowCtx = this.ctx.currentTime;
    let newlyFired = false;

    for (let i = 0; i < this.timelineEvents.length; i++) {
      const ev = this.timelineEvents[i];
      const evTime = Number(ev.t) || 0;
      if (evTime > windowEnd) continue;
      if (evTime < windowStart) continue;

      const key = `${i}:${evTime.toFixed(3)}:${ev.name}`;
      if (this.timelineScheduledKeys.has(key)) continue;
      this.timelineScheduledKeys.add(key);

      const delay = Math.max(0.004, evTime - clampedPlayhead);
      const rawFlavor = ev.flavor || this.timelineFlavor || 'default';
      const [mappedName, mappedPitch, mappedGain] = mapSatsetSfxToFlavor(
        String(ev.name || 'pop'),
        rawFlavor,
        ev.pitch ?? 1,
        ev.gain ?? 0.85
      );
      try {
        playSatsetRawSfx(this.ctx, this.sfxGain, mappedName, nowCtx + delay, mappedGain, mappedPitch, rawFlavor);
        if (mappedGain >= 0.42 || /boom|impact|whoosh|thud/.test(mappedName)) {
          this.duckMusicBriefly(0.24);
        }
        this.timelineSfxFiredCount++;
        this.timelineLastCues.push(`${mappedName}@${evTime.toFixed(2)}`);
        newlyFired = true;
      } catch {
        // Ignore individual voice errors
      }
    }

    this.timelineLastPlayheadSec = clampedPlayhead;
    if (newlyFired) {
      this.publishAudioDebugState();
    }
  }

  /**
   * Initializes lookahead SFX scheduling for the active Satset timeline (opening boom,
   * per-word subtitle ticks, in-scene s.sfx() animations, camera booms, and pre-cut transitions).
   */
  public startTimelineSfx(
    scenes: any[],
    projectMeta: any,
    fromTimeSec = 0
  ): { stop: () => void; events: any[] } {
    this.stopTimelineSfx();
    this.initContext();
    const events = collectSatsetSfxTimeline(scenes, projectMeta);
    this.timelineEvents = events;
    this.timelineScheduledKeys.clear();
    this.timelineLastPlayheadSec = Math.max(0, fromTimeSec);
    this.timelineSfxFiredCount = 0;
    this.timelineLastCues = [];

    const resolvedStyle = resolveSatsetStyleId(projectMeta?.art || this.activeStyleId || 'scribble3d');
    this.timelineFlavor = getSatsetStyleSfxFlavor(resolvedStyle);

    if (fromTimeSec > 0.25) {
      for (let i = 0; i < events.length; i++) {
        if (events[i].t < fromTimeSec - 0.16) {
          this.timelineScheduledKeys.add(`${i}:${Number(events[i].t).toFixed(3)}:${events[i].name}`);
        }
      }
    }

    if (!this.ctx || !this.sfxGain || this.isMuted || !this.sfxEnabled || events.length === 0) {
      this.publishAudioDebugState();
      return { stop: () => {}, events };
    }

    const seq = ++this.timelineScheduleSeq;
    const requestedWall = typeof performance !== 'undefined' ? performance.now() : Date.now();
    let lastFallbackTickWall = requestedWall;
    let cancelled = false;

    const kickoff = (startSec: number) => {
      if (cancelled || seq !== this.timelineScheduleSeq) return;
      this.syncTimelineSfxClock(startSec);
    };

    if (this.ctx.state === 'suspended') {
      this.ctx
        .resume()
        .then(() => {
          const nowWall = typeof performance !== 'undefined' ? performance.now() : Date.now();
          const elapsedWall = Math.max(0, (nowWall - requestedWall) / 1000);
          lastFallbackTickWall = nowWall;
          kickoff(fromTimeSec + elapsedWall);
        })
        .catch(() => {});
    } else {
      kickoff(fromTimeSec);
    }

    // Fallback interval keeps lookahead responsive ONLY when RAF pauses/throttles (>280ms silent)
    if (typeof window !== 'undefined') {
      this.timelineSchedulerInterval = window.setInterval(() => {
        if (cancelled || seq !== this.timelineScheduleSeq) return;
        const nowWall = typeof performance !== 'undefined' ? performance.now() : Date.now();
        if (nowWall - this.lastClockSyncWallMs < 280) {
          lastFallbackTickWall = nowWall;
          return;
        }
        const dt = (nowWall - lastFallbackTickWall) / 1000;
        if (dt >= 0.22 && this.timelineLastPlayheadSec >= 0) {
          lastFallbackTickWall = nowWall;
          this.syncTimelineSfxClock(this.timelineLastPlayheadSec + dt);
        }
      }, 140);
    }

    const cleanup = () => {
      cancelled = true;
      if (seq === this.timelineScheduleSeq) {
        this.timelineScheduleSeq++;
      }
      if (this.timelineSchedulerInterval !== null) {
        clearInterval(this.timelineSchedulerInterval);
        this.timelineSchedulerInterval = null;
      }
      this.timelineEvents = [];
      this.timelineScheduledKeys.clear();
      this.timelineLastPlayheadSec = -1;
      this.timelineSfxStopFn = null;
      this.publishAudioDebugState();
    };

    this.timelineSfxStopFn = cleanup;
    this.publishAudioDebugState();

    return {
      stop: cleanup,
      events,
    };
  }

  /**
   * Schedules an already-collected SFX event array from `fromTimeSec` (used by style preview cards)
   * without cancelling the main studio player's active `timelineSfxStopFn`.
   */
  public scheduleCollectedSfxEvents(events: any[], fromTimeSec = 0): () => void {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted || !this.sfxEnabled || !events?.length) {
      return () => {};
    }
    const requestedWall = typeof performance !== 'undefined' ? performance.now() : Date.now();
    let activeStopFn: (() => void) | null = null;
    let cancelled = false;

    const scheduleNow = (adjustedFromSec: number) => {
      if (cancelled || !this.ctx || !this.sfxGain || this.isMuted || !this.sfxEnabled) {
        return;
      }
      try {
        activeStopFn = scheduleSatsetSfxTimeline(
          this.ctx,
          this.sfxGain,
          events,
          adjustedFromSec,
          this.ctx.currentTime + 0.012
        );
      } catch {
        // ignore
      }
    };

    if (this.ctx.state === 'suspended') {
      this.ctx
        .resume()
        .then(() => {
          const nowWall = typeof performance !== 'undefined' ? performance.now() : Date.now();
          const elapsedWall = Math.max(0, (nowWall - requestedWall) / 1000);
          scheduleNow(fromTimeSec + elapsedWall);
        })
        .catch(() => {});
    } else {
      scheduleNow(fromTimeSec);
    }

    return () => {
      cancelled = true;
      if (activeStopFn) {
        try {
          activeStopFn();
        } catch {
          // ignore
        }
        activeStopFn = null;
      }
    };
  }

  public stopTimelineSfx() {
    this.timelineScheduleSeq++;
    if (this.timelineSchedulerInterval !== null) {
      clearInterval(this.timelineSchedulerInterval);
      this.timelineSchedulerInterval = null;
    }
    if (this.timelineSfxStopFn) {
      try {
        this.timelineSfxStopFn();
      } catch {
        // Already stopped
      }
      this.timelineSfxStopFn = null;
    } else {
      this.timelineEvents = [];
      this.timelineScheduledKeys.clear();
      this.timelineLastPlayheadSec = -1;
      this.publishAudioDebugState();
    }
  }

  public startSoundtrack(mood: any = 'cyberSynth', volume?: number) {
    this.initContext();
    if (!this.ctx || !this.musicGain) return;
    if (typeof volume === 'number') {
      this.setVolume(volume);
    }
    this.stopSoundtrack();
    this.isPlaying = true;

    // Warm studio chord voicings (fifths & warm ninths in comfortable low-mid editorial register)
    const chordVoicings: Record<AudioMood, number[]> = {
      cyberSynth: [130.81, 196.0, 246.94, 293.66], // Cmaj9 warm pad
      ambientSpace: [110.0, 164.81, 220.0, 261.63], // Am9 deep pad
      minimalTech: [146.83, 220.0, 261.63, 329.63], // Dm9 editorial
      lofiBeat: [164.81, 246.94, 293.66, 392.0], // Em9 chill felt
      cinematicTension: [98.0, 146.83, 196.0, 233.08], // Gm warm underscore
    };

    const chords: number[] =
      (chordVoicings as Record<string, number[]>)[mood] || chordVoicings.minimalTech;
    const now = this.ctx.currentTime;

    // Gentle warm lowpass pad floor + subtle LFO breathing (zero repetitive out-of-tempo plucking)
    const padFilter = this.ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(340, now);
    padFilter.Q.setValueAtTime(0.52, now);

    const padLfo = this.ctx.createOscillator();
    const padLfoGain = this.ctx.createGain();
    padLfo.frequency.setValueAtTime(0.11, now);
    padLfoGain.gain.setValueAtTime(85, now);
    padLfo.connect(padLfoGain);
    padLfoGain.connect(padFilter.frequency);
    padLfo.start(now);
    this.activeOscillators.push(padLfo);

    const padMaster = this.ctx.createGain();
    padMaster.gain.setValueAtTime(0.0001, now);
    padMaster.gain.linearRampToValueAtTime(0.032, now + 0.85);
    padFilter.connect(padMaster);
    padMaster.connect(this.musicGain);

    chords.slice(0, 3).forEach((freq: number, idx: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const voiceGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * (idx === 0 ? 0.5 : 0.5), now);
      osc.detune.setValueAtTime(idx === 1 ? -3 : idx === 2 ? 3 : 0, now);
      voiceGain.gain.setValueAtTime(idx === 0 ? 0.44 : 0.22, now);
      osc.connect(voiceGain);
      voiceGain.connect(padFilter);
      osc.start(now);
      this.activeOscillators.push(osc);
    });
  }

  public stopSoundtrack() {
    this.isPlaying = false;
    if (this.pulseInterval !== null) {
      clearInterval(this.pulseInterval);
      this.pulseInterval = null;
    }
    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Oscillator might have stopped already
      }
    });
    this.activeOscillators = [];
  }

  public getWaveformData(): number[] {
    if (!this.analyser) {
      const count = 32;
      const now = Date.now() / 300;
      return Array.from({ length: count }, (_, i) => {
        return Math.floor((Math.sin(now + i * 0.4) * 0.5 + 0.5) * 160 + Math.random() * 40);
      });
    }

    const buffer = new Uint8Array(32);
    this.analyser.getByteFrequencyData(buffer);
    return Array.from(buffer);
  }
}

export const soundEngine = new SoundEngine();

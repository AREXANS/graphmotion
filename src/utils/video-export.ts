import { type AspectRatio, type SatsetProject } from '../types/satset.ts';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import {
  collectSatsetSfxTimeline,
  getSatsetLayout,
  preloadSatsetProjectAssets,
  renderSatsetTimelineFrame,
  scheduleSatsetSfxTimeline,
} from './custom-style-runtime.ts';
import { buildSatsetTimelineForProject } from './satset-timeline-builder.ts';
import { voiceStudio } from './voice-studio.ts';
import { Remotion3DStageEngine } from './remotion-3d-stage.ts';

export type ExportResolutionPreset = '1080p' | '2K' | '4K';

export interface ResolutionSpec {
  id: ExportResolutionPreset;
  label: string;
  badge: string;
  shortSidePx: number;
  videoBitsPerSecond: number;
  bitrateLabel: string;
  description: string;
}

export const EXPORT_RESOLUTION_SPECS: Record<ExportResolutionPreset, ResolutionSpec> = {
  '1080p': {
    id: '1080p',
    label: '1080p Full HD',
    badge: 'FHD',
    shortSidePx: 1080,
    videoBitsPerSecond: 14_000_000,
    bitrateLabel: '14 Mbps',
    description: 'Tajam & cepat dirender untuk TikTok, Reels & Shorts',
  },
  '2K': {
    id: '2K',
    label: '2K QHD',
    badge: '2K',
    shortSidePx: 1440,
    videoBitsPerSecond: 28_000_000,
    bitrateLabel: '28 Mbps',
    description: 'Ketajaman ekstra untuk detail teks, karakter & tekstur 3D',
  },
  '4K': {
    id: '4K',
    label: '4K Ultra HD',
    badge: '4K',
    shortSidePx: 2160,
    videoBitsPerSecond: 52_000_000,
    bitrateLabel: '52 Mbps',
    description: 'Resolusi maksimal kristal jernih tanpa pecah di layar besar',
  },
};

export function normalizeExportResolution(raw?: string | null): ExportResolutionPreset {
  const s = String(raw || '').trim().toUpperCase();
  if (s === '4K' || s === '2160P' || s === 'UHD') return '4K';
  if (s === '2K' || s === '1440P' || s === 'QHD') return '2K';
  return '1080p';
}

export function getExportPixelDimensions(
  aspectRatio: AspectRatio | '4:5' | string = '9:16',
  resolution: ExportResolutionPreset | string = '1080p'
): { width: number; height: number } {
  const norm = normalizeExportResolution(resolution);
  const shortSide = EXPORT_RESOLUTION_SPECS[norm].shortSidePx;

  // Ensure even dimensions for hardware H.264 / VP9 video encoders
  const roundEven = (n: number) => Math.max(2, Math.round(n / 2) * 2);

  switch (aspectRatio) {
    case '16:9':
      return {
        width: roundEven((shortSide * 16) / 9),
        height: roundEven(shortSide),
      };
    case '1:1':
      return {
        width: roundEven(shortSide),
        height: roundEven(shortSide),
      };
    case '3:4':
      return {
        width: roundEven(shortSide),
        height: roundEven((shortSide * 4) / 3),
      };
    case '4:5':
      return {
        width: roundEven(shortSide),
        height: roundEven((shortSide * 5) / 4),
      };
    case '9:16':
    default:
      return {
        width: roundEven(shortSide),
        height: roundEven((shortSide * 16) / 9),
      };
  }
}

export function pickBestVideoMimeType(): { mimeType: string; extension: 'mp4' | 'webm' } {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return { mimeType: 'video/mp4', extension: 'mp4' };
  }

  const candidates: Array<{ mimeType: string; extension: 'mp4' | 'webm' }> = [
    { mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', extension: 'mp4' },
    { mimeType: 'video/mp4;codecs=avc1', extension: 'mp4' },
    { mimeType: 'video/mp4;codecs=vp9,opus', extension: 'mp4' },
    { mimeType: 'video/mp4;codecs=avc1.640028', extension: 'mp4' },
    { mimeType: 'video/mp4', extension: 'mp4' },
    { mimeType: 'video/webm;codecs=vp9,opus', extension: 'webm' },
    { mimeType: 'video/webm;codecs=vp9', extension: 'webm' },
    { mimeType: 'video/webm;codecs=vp8', extension: 'webm' },
    { mimeType: 'video/webm', extension: 'webm' },
  ];

  for (const cand of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(cand.mimeType)) {
        return cand;
      }
    } catch {
      // ignore unsupported check errors
    }
  }
  return { mimeType: 'video/webm', extension: 'webm' };
}

export function buildExportFilename(
  title: string | undefined,
  resolution: ExportResolutionPreset,
  extension: 'mp4' | 'webm'
): string {
  const slug =
    (title || 'satset-motion')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'satset-motion';
  return `${slug}-${resolution.toLowerCase()}.${extension}`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface HighResExportParams {
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  videoBitsPerSecond: number;
  audioStream?: MediaStream | null;
  mixedAudioBuffer?: AudioBuffer | null;
  preferMp4WebCodecs?: boolean;
  renderFrame: (ctx: CanvasRenderingContext2D, timeSec: number, width: number, height: number) => void;
  onProgress?: (percent: number, timeSec: number) => void;
  signal?: AbortSignal;
}

export interface HighResExportResult {
  blob: Blob;
  url: string;
  mimeType: string;
  extension: 'mp4' | 'webm';
  width: number;
  height: number;
  bytes: number;
  encoderMode: 'mp4-webcodecs' | 'mediarecorder';
}

type Mp4VideoMuxCodec = 'avc' | 'vp9' | 'av1';
type Mp4AudioMuxCodec = 'aac' | 'opus';

interface SelectedMp4VideoConfig {
  muxCodec: Mp4VideoMuxCodec;
  config: VideoEncoderConfig;
}

interface SelectedMp4AudioConfig {
  muxCodec: Mp4AudioMuxCodec;
  config: AudioEncoderConfig;
}

/**
 * Probes a single VideoEncoder config by actually encoding & flushing 1 test frame.
 * Prevents browsers (such as Chromium OpenH264) from hanging at 98% on codecs where
 * VideoEncoder.isConfigSupported() returns true yet flush() never resolves.
 */
async function probeVideoEncoderFlush(
  cfg: VideoEncoderConfig,
  timeoutMs: number
): Promise<boolean> {
  if (typeof VideoFrame === 'undefined' || typeof document === 'undefined') return true;
  let enc: VideoEncoder | null = null;
  try {
    let chunks = 0;
    let err: any = null;
    enc = new VideoEncoder({
      output: () => {
        chunks++;
      },
      error: (e) => {
        err = e;
      },
    });
    enc.configure(cfg);

    const canvas = document.createElement('canvas');
    canvas.width = cfg.width;
    canvas.height = cfg.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#020817';
      ctx.fillRect(0, 0, cfg.width, cfg.height);
    }

    const vf = new VideoFrame(canvas, { timestamp: 0, duration: 33333 });
    try {
      enc.encode(vf, { keyFrame: true });
    } finally {
      vf.close();
    }

    const ok = await Promise.race([
      enc.flush().then(() => !err && chunks > 0),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs)),
    ]);
    return ok;
  } catch {
    return false;
  } finally {
    try {
      if (enc && enc.state !== 'closed') enc.close();
    } catch {
      // ignore
    }
  }
}

async function pickSupportedMp4VideoConfig(
  width: number,
  height: number,
  fps: number,
  bitrate: number
): Promise<SelectedMp4VideoConfig | null> {
  if (typeof VideoEncoder === 'undefined' || typeof VideoEncoder.isConfigSupported !== 'function') {
    return null;
  }

  const pixels = width * height;
  const is4kOrAbove = pixels > 2560 * 1440;

  const candidates: Array<{
    muxCodec: Mp4VideoMuxCodec;
    codec: string;
    hw: HardwareAcceleration;
    timeoutMs: number;
  }> = is4kOrAbove
    ? [
        // Prefer hardware H.264 if a real GPU is available on the user's machine
        { muxCodec: 'avc', codec: 'avc1.640034', hw: 'prefer-hardware', timeoutMs: 2500 },
        { muxCodec: 'avc', codec: 'avc1.4d0034', hw: 'prefer-hardware', timeoutMs: 2500 },
        { muxCodec: 'avc', codec: 'avc1.42E034', hw: 'prefer-hardware', timeoutMs: 2500 },
        // VP9 Level 5.0/5.1 encodes 4K reliably into MP4 even in software Chromium
        { muxCodec: 'vp9', codec: 'vp09.00.50.08', hw: 'no-preference', timeoutMs: 7000 },
        { muxCodec: 'vp9', codec: 'vp09.00.51.08', hw: 'no-preference', timeoutMs: 7000 },
        { muxCodec: 'av1', codec: 'av01.0.13M.08', hw: 'no-preference', timeoutMs: 7000 },
        { muxCodec: 'avc', codec: 'avc1.42E033', hw: 'no-preference', timeoutMs: 2500 },
      ]
    : [
        // 1080p & 2K: prefer hardware H.264, then fast Main/Baseline L5.0 H.264, then VP9 MP4
        { muxCodec: 'avc', codec: 'avc1.64002a', hw: 'prefer-hardware', timeoutMs: 1800 },
        { muxCodec: 'avc', codec: 'avc1.42E032', hw: 'no-preference', timeoutMs: 2500 },
        { muxCodec: 'avc', codec: 'avc1.4d002a', hw: 'no-preference', timeoutMs: 2500 },
        { muxCodec: 'avc', codec: 'avc1.42E02A', hw: 'no-preference', timeoutMs: 2500 },
        { muxCodec: 'avc', codec: 'avc1.4d0032', hw: 'no-preference', timeoutMs: 2500 },
        { muxCodec: 'vp9', codec: 'vp09.00.50.08', hw: 'no-preference', timeoutMs: 3500 },
        { muxCodec: 'vp9', codec: 'vp09.00.41.08', hw: 'no-preference', timeoutMs: 3500 },
        { muxCodec: 'av1', codec: 'av01.0.12M.08', hw: 'no-preference', timeoutMs: 3500 },
      ];

  for (const cand of candidates) {
    const cfg: VideoEncoderConfig = {
      codec: cand.codec,
      width,
      height,
      bitrate: Math.min(bitrate, 65_000_000),
      framerate: fps,
      hardwareAcceleration: cand.hw,
      latencyMode: 'realtime',
    };
    try {
      const res = await VideoEncoder.isConfigSupported(cfg);
      if (!res.supported) continue;
      const finalCfg = res.config || cfg;
      const verified = await probeVideoEncoderFlush(finalCfg, cand.timeoutMs);
      if (verified) {
        return { muxCodec: cand.muxCodec, config: finalCfg };
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

async function pickSupportedMp4AudioConfig(
  sampleRate: number,
  numberOfChannels: number
): Promise<SelectedMp4AudioConfig | null> {
  if (typeof AudioEncoder === 'undefined' || typeof AudioEncoder.isConfigSupported !== 'function') {
    return null;
  }
  const candidates: Array<{ muxCodec: Mp4AudioMuxCodec; cfg: AudioEncoderConfig }> = [
    {
      muxCodec: 'aac',
      cfg: { codec: 'mp4a.40.2', sampleRate, numberOfChannels, bitrate: 128_000 },
    },
    {
      muxCodec: 'aac',
      cfg: { codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels, bitrate: 128_000 },
    },
    {
      muxCodec: 'opus',
      cfg: { codec: 'opus', sampleRate: 48000, numberOfChannels, bitrate: 128_000 },
    },
  ];
  for (const cand of candidates) {
    try {
      const res = await AudioEncoder.isConfigSupported(cand.cfg);
      if (res.supported) {
        return { muxCodec: cand.muxCodec, config: res.config || cand.cfg };
      }
    } catch {
      // ignore
    }
  }
  return null;
}

/**
 * Deterministic faster-than-realtime MP4 muxer via WebCodecs + mp4-muxer (AVC/VP9/AV1 + AAC/Opus).
 */
async function encodeMp4WithWebCodecs(
  params: HighResExportParams,
  selectedVideo: SelectedMp4VideoConfig
): Promise<HighResExportResult> {
  const { width, height, fps, durationSec, mixedAudioBuffer, renderFrame, onProgress, signal } =
    params;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    throw new Error('Canvas 2D context tidak tersedia untuk export MP4.');
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const selectedAudio = mixedAudioBuffer
    ? await pickSupportedMp4AudioConfig(
        mixedAudioBuffer.sampleRate,
        mixedAudioBuffer.numberOfChannels
      )
    : null;

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: {
      codec: selectedVideo.muxCodec,
      width,
      height,
      frameRate: fps,
    },
    ...(selectedAudio
      ? {
          audio: {
            codec: selectedAudio.muxCodec,
            numberOfChannels: selectedAudio.config.numberOfChannels,
            sampleRate: selectedAudio.config.sampleRate,
          },
        }
      : {}),
    fastStart: 'in-memory',
  });

  let encodeError: Error | null = null;

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => {
      muxer.addVideoChunk(chunk, meta);
    },
    error: (err) => {
      encodeError = err instanceof Error ? err : new Error(String(err));
    },
  });
  videoEncoder.configure(selectedVideo.config);

  let audioEncoder: AudioEncoder | null = null;
  if (selectedAudio && mixedAudioBuffer) {
    audioEncoder = new AudioEncoder({
      output: (chunk, meta) => {
        muxer.addAudioChunk(chunk, meta);
      },
      error: (err) => {
        console.warn('MP4 audio encode warning:', err);
      },
    });
    audioEncoder.configure(selectedAudio.config);
  }

  const totalFrames = Math.max(1, Math.round(durationSec * fps));
  const frameDurationUs = Math.round(1_000_000 / fps);
  const keyFrameInterval = Math.max(15, fps * 2);

  try {
    for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
      if (signal?.aborted) {
        throw new Error('Export video dibatalkan.');
      }
      if (encodeError) {
        throw encodeError;
      }

      const tSec = Math.min(durationSec, frameIdx / fps);
      try {
        renderFrame(ctx, tSec, width, height);
      } catch {
        // continue frame encoding even if custom user script throws on one frame
      }

      const timestampUs = Math.round(frameIdx * frameDurationUs);
      const videoFrame = new VideoFrame(canvas, {
        timestamp: timestampUs,
        duration: frameDurationUs,
      });

      try {
        videoEncoder.encode(videoFrame, {
          keyFrame: frameIdx % keyFrameInterval === 0,
        });
      } finally {
        videoFrame.close();
      }

      // Backpressure control & UI responsiveness yield so encoder queue never piles up
      while (videoEncoder.encodeQueueSize > 4 && !signal?.aborted) {
        if (encodeError) throw encodeError;
        await new Promise((r) => setTimeout(r, 15));
      }
      if (frameIdx % 2 === 0 || frameIdx === totalFrames - 1) {
        const pct = Math.min(92, Math.round(((frameIdx + 1) / totalFrames) * 92));
        onProgress?.(pct, tSec);
        await new Promise((r) => setTimeout(r, 4));
      }
    }

    // Encode mixed audio track into AAC or Opus if AudioEncoder is active
    if (audioEncoder && mixedAudioBuffer && selectedAudio) {
      const sampleRate = mixedAudioBuffer.sampleRate;
      const numChannels = Math.min(
        selectedAudio.config.numberOfChannels,
        mixedAudioBuffer.numberOfChannels
      );
      const totalSamples = mixedAudioBuffer.length;
      const chunkSamples = selectedAudio.muxCodec === 'opus' ? 960 : 4096;

      for (let offset = 0; offset < totalSamples; offset += chunkSamples) {
        if (signal?.aborted) throw new Error('Export video dibatalkan.');
        const count = Math.min(chunkSamples, totalSamples - offset);
        const planar = new Float32Array(count * numChannels);
        for (let ch = 0; ch < numChannels; ch++) {
          const chData = mixedAudioBuffer.getChannelData(ch);
          planar.set(chData.subarray(offset, offset + count), ch * count);
        }
        const timestampUs = Math.round((offset / sampleRate) * 1_000_000);
        const audioData = new AudioData({
          format: 'f32-planar',
          sampleRate,
          numberOfFrames: count,
          numberOfChannels: numChannels,
          timestamp: timestampUs,
          data: planar,
        });
        try {
          audioEncoder.encode(audioData);
        } finally {
          audioData.close();
        }
      }
      onProgress?.(96, durationSec);
      await Promise.race([
        audioEncoder.flush(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AudioEncoder flush timeout')), 10_000)
        ),
      ]).catch((err) => console.warn('AudioEncoder flush skipped:', err));
      if (audioEncoder.state !== 'closed') audioEncoder.close();
      audioEncoder = null;
    }

    onProgress?.(98, durationSec);
    await Promise.race([
      videoEncoder.flush(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('VideoEncoder flush timeout')), 90_000)
      ),
    ]);
    videoEncoder.close();

    if (encodeError) throw encodeError;

    muxer.finalize();
    const blob = new Blob([target.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    onProgress?.(100, durationSec);

    return {
      blob,
      url,
      mimeType: 'video/mp4',
      extension: 'mp4',
      width,
      height,
      bytes: blob.size,
      encoderMode: 'mp4-webcodecs',
    };
  } catch (err) {
    try {
      if (videoEncoder.state !== 'closed') videoEncoder.close();
    } catch {
      // ignore
    }
    try {
      if (audioEncoder && audioEncoder.state !== 'closed') audioEncoder.close();
    } catch {
      // ignore
    }
    throw err;
  }
}

/**
 * Renders resolution-independent procedural motion scenes directly onto an offscreen
 * high-resolution canvas (1080p / 2K / 4K) and captures a genuine MP4 (WebCodecs + mp4-muxer
 * with automatic MediaRecorder fallback when hardware/WebCodecs is unavailable).
 */
export async function recordHighResCanvasVideo(
  params: HighResExportParams
): Promise<HighResExportResult> {
  const {
    width,
    height,
    fps,
    durationSec,
    videoBitsPerSecond,
    audioStream,
    preferMp4WebCodecs = true,
    renderFrame,
    onProgress,
    signal,
  } = params;

  if (preferMp4WebCodecs && typeof VideoFrame !== 'undefined') {
    const selectedVideo = await pickSupportedMp4VideoConfig(
      width,
      height,
      fps,
      videoBitsPerSecond
    );
    if (selectedVideo) {
      try {
        return await encodeMp4WithWebCodecs(params, selectedVideo);
      } catch (err: any) {
        if (signal?.aborted || String(err?.message || '').includes('dibatalkan')) {
          throw err;
        }
        console.warn('WebCodecs MP4 encoding fallback ke MediaRecorder:', err);
      }
    }
  }

  // Fallback: MediaRecorder real-time stream capture (prefers video/mp4 where browser supports it)
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    throw new Error('Canvas 2D context tidak tersedia untuk export video.');
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const { mimeType, extension } = pickBestVideoMimeType();

  renderFrame(ctx, 0, width, height);

  const canvasStream = canvas.captureStream(fps);
  const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
  if (audioStream) {
    audioStream.getAudioTracks().forEach((tr) => tracks.push(tr));
  }
  const combinedStream = new MediaStream(tracks);

  const recorderOptions: MediaRecorderOptions = {
    videoBitsPerSecond,
  };
  if (mimeType && typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mimeType)) {
    recorderOptions.mimeType = mimeType;
  }

  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(combinedStream, recorderOptions);
  } catch {
    recorder = new MediaRecorder(combinedStream);
  }

  const chunks: Blob[] = [];
  recorder.ondataavailable = (ev) => {
    if (ev.data && ev.data.size > 0) {
      chunks.push(ev.data);
    }
  };

  return new Promise<HighResExportResult>((resolve, reject) => {
    let rafId = 0;
    let finished = false;
    const totalMs = Math.max(500, durationSec * 1000);
    const frameIntervalMs = 1000 / Math.max(24, fps);
    const startWall = performance.now();
    let lastDrawWall = -Infinity;

    const cleanup = () => {
      if (rafId) cancelAnimationFrame(rafId);
      canvasStream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          // ignore
        }
      });
    };

    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          if (finished) return;
          finished = true;
          cleanup();
          try {
            if (recorder.state !== 'inactive') recorder.stop();
          } catch {
            // ignore
          }
          reject(new Error('Export video dibatalkan.'));
        },
        { once: true }
      );
    }

    recorder.onerror = (ev: any) => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(new Error(ev?.error?.message || 'Gagal merekam stream video resolusi tinggi.'));
    };

    recorder.onstop = () => {
      if (finished) return;
      finished = true;
      cleanup();
      const actualMime = recorder.mimeType || mimeType || 'video/webm';
      const actualExt: 'mp4' | 'webm' = actualMime.includes('mp4') ? 'mp4' : extension;
      const blob = new Blob(chunks, { type: actualMime });
      const url = URL.createObjectURL(blob);
      onProgress?.(100, durationSec);
      resolve({
        blob,
        url,
        mimeType: actualMime,
        extension: actualExt,
        width,
        height,
        bytes: blob.size,
        encoderMode: 'mediarecorder',
      });
    };

    recorder.start(250);

    const step = (now: number) => {
      if (finished) return;
      const elapsedMs = now - startWall;
      const tSec = Math.min(durationSec, elapsedMs / 1000);

      if (now - lastDrawWall >= frameIntervalMs * 0.88 || elapsedMs >= totalMs) {
        lastDrawWall = now;
        try {
          renderFrame(ctx, tSec, width, height);
        } catch {
          // keep recording cleanly
        }
        const pct = Math.min(99, Math.round((elapsedMs / totalMs) * 100));
        onProgress?.(pct, tSec);
      }

      if (elapsedMs >= totalMs) {
        renderFrame(ctx, durationSec, width, height);
        try {
          if (recorder.state === 'recording') {
            recorder.requestData();
            recorder.stop();
          }
        } catch {
          // ignore
        }
        return;
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
  });
}

/**
 * Renders Voice Over + Background Music + Satset procedural SFX into a single OfflineAudioContext
 * stereo AudioBuffer ready to be muxed into an MP4 file.
 */
export async function mixProjectAudioOffline(params: {
  project: SatsetProject;
  timelineScenes: any[];
  projectMeta: Record<string, any>;
  durationSec: number;
  voEnabled?: boolean;
  sfxEnabled?: boolean;
  sfxVolume?: number;
  bgmUrl?: string | null;
  bgmVolume?: number;
}): Promise<AudioBuffer | null> {
  if (typeof OfflineAudioContext === 'undefined') return null;
  const sampleRate = 48000;
  const length = Math.max(sampleRate, Math.ceil(params.durationSec * sampleRate));
  const offlineCtx = new OfflineAudioContext(2, length, sampleRate);

  const masterCompressor = offlineCtx.createDynamicsCompressor();
  masterCompressor.threshold.setValueAtTime(-10, 0);
  masterCompressor.knee.setValueAtTime(14, 0);
  masterCompressor.ratio.setValueAtTime(6, 0);
  masterCompressor.attack.setValueAtTime(0.004, 0);
  masterCompressor.release.setValueAtTime(0.14, 0);

  const master = offlineCtx.createGain();
  master.gain.setValueAtTime(0.95, 0);
  master.connect(masterCompressor);
  masterCompressor.connect(offlineCtx.destination);

  let hasAnyAudioSource = false;

  const decodeAudioFromUrl = async (url: string): Promise<AudioBuffer | null> => {
    try {
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const arr = await resp.arrayBuffer();
      return await offlineCtx.decodeAudioData(arr);
    } catch {
      return null;
    }
  };

  // 1. Voice Over track (either uploaded continuous project audio or synthesized per-scene audio)
  if (params.voEnabled !== false && !params.project.voice_skipped) {
    const projectAudioUrl =
      (params.project as any).voice_audio_url &&
      String((params.project as any).voice_audio_url).startsWith('blob:')
        ? String((params.project as any).voice_audio_url)
        : null;

    if (projectAudioUrl) {
      const buf = await decodeAudioFromUrl(projectAudioUrl);
      if (buf) {
        const src = offlineCtx.createBufferSource();
        src.buffer = buf;
        const g = offlineCtx.createGain();
        g.gain.setValueAtTime(1.0, 0);
        src.connect(g);
        g.connect(master);
        src.start(0);
        hasAnyAudioSource = true;
      }
    } else {
      const voiceId = params.project.voice_character || params.project.voice_option || 'fenrir';
      const activeVoiceId = voiceStudio.resolveVoiceProfile(voiceId).id;
      const isSceneUrlValidForVoice = (rawScene: any, text: string): boolean => {
        if (!rawScene?.audio_url || String(rawScene.audio_url).includes('/audio/samples/')) {
          return false;
        }
        const savedVoiceId = rawScene.audio_voice_id
          ? voiceStudio.resolveVoiceProfile(String(rawScene.audio_voice_id)).id
          : null;
        if (savedVoiceId && savedVoiceId !== activeVoiceId) return false;
        if (rawScene.audio_text && String(rawScene.audio_text).trim() !== text) return false;
        return true;
      };
      const scenes = params.project.scenes || [];
      const allSceneTexts = params.timelineScenes
        .map((ts, idx) =>
          (ts.text || scenes[idx]?.narration_text || scenes[idx]?.voiceScript || '').trim()
        )
        .filter(Boolean);
      const anyUncached = params.timelineScenes.some((ts, idx) => {
        const rawScene = scenes[idx];
        const text = (ts.text || rawScene?.narration_text || rawScene?.voiceScript || '').trim();
        if (!text) return false;
        const hasValidSceneUrl = isSceneUrlValidForVoice(rawScene, text);
        return !hasValidSceneUrl && !voiceStudio.getCachedSceneAudio(text, voiceId);
      });
      if (anyUncached && allSceneTexts.length > 0) {
        await voiceStudio
          .synthesizeBatchScenes(allSceneTexts, voiceId, params.project.speech_style)
          .catch(() => {});
      }

      let cursorSec = 0;
      for (let i = 0; i < params.timelineScenes.length; i++) {
        const ts = params.timelineScenes[i];
        const rawScene = scenes[i];
        const sceneDur = Number(ts.duration || 3.5);
        const text = (ts.text || rawScene?.narration_text || rawScene?.voiceScript || '').trim();
        const validSceneUrl = isSceneUrlValidForVoice(rawScene, text) ? rawScene.audio_url : null;
        const url = validSceneUrl || (text ? voiceStudio.getCachedSceneAudio(text, voiceId) : null);
        if (url) {
          const buf = await decodeAudioFromUrl(url);
          if (buf) {
            const src = offlineCtx.createBufferSource();
            src.buffer = buf;
            if (sceneDur > 1.2 && buf.duration > 0.35) {
              const targetSpeechSec = Math.max(0.9, sceneDur - 0.28);
              src.playbackRate.value = Math.max(0.82, Math.min(1.35, buf.duration / targetSpeechSec));
            }
            const g = offlineCtx.createGain();
            g.gain.setValueAtTime(1.0, cursorSec);
            src.connect(g);
            g.connect(master);
            src.start(cursorSec);
            hasAnyAudioSource = true;
          }
        }
        cursorSec += sceneDur;
      }
    }
  }

  // 2. Background Music (optional uploaded file, looped across full duration with subtle ducking)
  if (params.bgmUrl) {
    const bgmBuf = await decodeAudioFromUrl(params.bgmUrl);
    if (bgmBuf) {
      const src = offlineCtx.createBufferSource();
      src.buffer = bgmBuf;
      src.loop = true;
      const bgmGain = offlineCtx.createGain();
      const targetVol = Math.max(0.02, Math.min(1, params.bgmVolume ?? 0.25));
      bgmGain.gain.setValueAtTime(params.voEnabled !== false ? targetVol * 0.65 : targetVol, 0);
      src.connect(bgmGain);
      bgmGain.connect(master);
      src.start(0);
      hasAnyAudioSource = true;
    }
  }

  // 3. Procedural Satset SFX Timeline (transitions, word ticks, in-scene cues)
  if (params.sfxEnabled !== false) {
    const events = collectSatsetSfxTimeline(params.timelineScenes, params.projectMeta as any);
    if (events.length > 0) {
      const sfxGain = offlineCtx.createGain();
      sfxGain.gain.setValueAtTime(Math.max(0.05, Math.min(1.4, params.sfxVolume ?? 0.9)), 0);
      const sfxWarmFilter = offlineCtx.createBiquadFilter();
      sfxWarmFilter.type = 'lowpass';
      sfxWarmFilter.frequency.setValueAtTime(12200, 0);
      sfxWarmFilter.Q.setValueAtTime(0.5, 0);
      sfxGain.connect(sfxWarmFilter);
      sfxWarmFilter.connect(master);
      scheduleSatsetSfxTimeline(offlineCtx as any, sfxGain as any, events, 0, 0);
      hasAnyAudioSource = true;
    }
  }

  if (!hasAnyAudioSource) {
    return null;
  }

  try {
    return await offlineCtx.startRendering();
  } catch {
    return null;
  }
}

export async function exportSatsetProjectToMp4(params: {
  project: SatsetProject;
  resolution?: ExportResolutionPreset | string;
  fps?: 30 | 60;
  voEnabled?: boolean;
  sfxEnabled?: boolean;
  sfxVolume?: number;
  bgmUrl?: string | null;
  bgmVolume?: number;
  onProgress?: (percent: number, timeSec: number) => void;
  signal?: AbortSignal;
}): Promise<HighResExportResult & { filename: string; resolution: ExportResolutionPreset }> {
  const resolution = normalizeExportResolution(
    params.resolution || params.project.export_resolution || '1080p'
  );
  const fps = params.fps || params.project.export_fps || 60;
  const spec = EXPORT_RESOLUTION_SPECS[resolution];

  const { timelineScenes, projectMeta, totalDurationSec, ratio } =
    buildSatsetTimelineForProject(params.project);
  const layout = getSatsetLayout(ratio);
  const { width, height } = getExportPixelDimensions(ratio, resolution);

  await preloadSatsetProjectAssets({
    art: projectMeta.art,
    look: projectMeta.look,
    font: projectMeta.font,
  }).catch(() => {});

  const mixedAudioBuffer = await mixProjectAudioOffline({
    project: params.project,
    timelineScenes,
    projectMeta,
    durationSec: totalDurationSec,
    voEnabled: params.voEnabled,
    sfxEnabled: params.sfxEnabled,
    sfxVolume: params.sfxVolume,
    bgmUrl: params.bgmUrl,
    bgmVolume: params.bgmVolume,
  });

  const hasSceneCode = timelineScenes.some((sc) => Boolean(sc?.code && String(sc.code).trim()));
  const use3DStage = !hasSceneCode && (params.project.render_dimension ?? '3d') === '3d';
  let stage3D: Remotion3DStageEngine | null = null;
  if (use3DStage) {
    try {
      stage3D = new Remotion3DStageEngine();
    } catch {
      stage3D = null;
    }
  }

  let result: HighResExportResult;
  try {
    result = await recordHighResCanvasVideo({
      width,
      height,
      fps,
      durationSec: totalDurationSec,
      videoBitsPerSecond: spec.videoBitsPerSecond,
      mixedAudioBuffer,
      preferMp4WebCodecs: true,
      renderFrame: (ctx, timeSec, canvasW, canvasH) => {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = '#020817';
        ctx.fillRect(0, 0, canvasW, canvasH);

        let rendered3D = false;
        if (stage3D && timelineScenes.length > 0) {
          try {
            rendered3D = Boolean(
              stage3D.renderCompositeFrame(
                ctx,
                params.project,
                timelineScenes,
                projectMeta as any,
                timeSec,
                canvasW,
                canvasH
              )
            );
          } catch {
            rendered3D = false;
          }
        }

        if (!rendered3D) {
          ctx.save();
          ctx.scale(canvasW / layout.W, canvasH / layout.H);
          renderSatsetTimelineFrame(ctx, timelineScenes, timeSec, undefined, projectMeta as any);
          ctx.restore();
        }
      },
      onProgress: params.onProgress,
      signal: params.signal,
    });
  } finally {
    stage3D?.dispose();
  }

  const filename = buildExportFilename(
    params.project.project_title || params.project.title || 'satset-motion',
    resolution,
    result.extension
  );

  return {
    ...result,
    filename,
    resolution,
  };
}

export function triggerBlobDownload(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

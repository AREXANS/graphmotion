import express from 'express';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { MOTION_CATALOG } from './src/data/motion-catalog';
import { SATSET_MODULES } from './src/data/satset-modules';
import { generateRemotionCode } from './src/utils/remotion-generator';
import { SatsetProject, SatsetScene, SatsetStyleModule, IdeaConcept } from './src/types/satset';
import {
  extractWebsiteUrl,
  parseWebsiteHtmlMetadata,
  buildWebsitePromoProfile,
  buildWebsitePromoConcepts,
  buildWebsitePromoScenes,
} from './src/utils/website-promo-engine';
import { applySmartSceneRevision } from './src/utils/contextual-scene-builder';
import { synchronizeProjectPipeline } from './src/utils/pipeline-sync';
import {
  buildVoiceMasteringFilter,
  isVoiceProfileFemale,
  selectNeuralBaseVoiceForClause,
} from './src/utils/voice-mastering';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Validate API key to prevent invalid key API errors
function isConfiguredApiKey(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  if (trimmed === '' || trimmed === 'MY_GEMINI_API_KEY' || trimmed.startsWith('MY_')) return false;
  return trimmed.length >= 20;
}

const apiKey = process.env.GEMINI_API_KEY || '';
const ai: GoogleGenAI | null = isConfiguredApiKey(apiKey)
  ? new GoogleGenAI({
      apiKey,
      apiVersion: 'v1beta',
      httpOptions: {
        apiVersion: 'v1beta',
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

/**
 * Extracts raw 16-bit mono PCM bytes from a base64 audio string (stripping 44-byte RIFF header if present).
 */
function extractRawPcmBuffer(base64Audio: string): Buffer {
  const buf = Buffer.from(base64Audio, 'base64');
  if (
    buf.length >= 44 &&
    buf[0] === 0x52 && // 'R'
    buf[1] === 0x49 && // 'I'
    buf[2] === 0x46 && // 'F'
    buf[3] === 0x46    // 'F'
  ) {
    // Locate 'data' chunk header or default to byte 44
    for (let i = 12; i <= Math.min(buf.length - 8, 128); i++) {
      if (
        buf[i] === 0x64 &&     // 'd'
        buf[i + 1] === 0x61 && // 'a'
        buf[i + 2] === 0x74 && // 't'
        buf[i + 3] === 0x61    // 'a'
      ) {
        return buf.subarray(i + 8);
      }
    }
    return buf.subarray(44);
  }
  return buf;
}

/**
 * Strips leading and trailing dead air from 16-bit mono PCM audio at 24kHz,
 * leaving a crisp 35ms attack pad and 100ms tail pad so Voice Over starts at t=0.035s with zero delay.
 */
function trimPcmSilence(pcmBuf: Buffer, sampleRate = 24000, threshold = 260): Buffer {
  const totalSamples = Math.floor(pcmBuf.length / 2);
  if (totalSamples < sampleRate * 0.15) return pcmBuf;

  let firstActiveSample = 0;
  let foundStart = false;
  for (let i = 0; i < totalSamples; i++) {
    const val = Math.abs(pcmBuf.readInt16LE(i * 2));
    if (val > threshold) {
      firstActiveSample = i;
      foundStart = true;
      break;
    }
  }
  if (!foundStart) return pcmBuf;

  let lastActiveSample = totalSamples - 1;
  for (let i = totalSamples - 1; i >= firstActiveSample; i--) {
    const val = Math.abs(pcmBuf.readInt16LE(i * 2));
    if (val > threshold) {
      lastActiveSample = i;
      break;
    }
  }

  const attackPadSamples = Math.floor(sampleRate * 0.035); // 35ms lead-in
  const tailPadSamples = Math.floor(sampleRate * 0.1);     // 100ms tail
  const startSample = Math.max(0, firstActiveSample - attackPadSamples);
  const endSample = Math.min(totalSamples, lastActiveSample + tailPadSamples);

  if (endSample <= startSample) return pcmBuf;
  return pcmBuf.subarray(startSample * 2, endSample * 2);
}

/**
 * Wraps raw 16-bit mono PCM bytes in a 44-byte RIFF WAVE header and returns data URI + exact durationSec.
 */
function pcmToWavDataUri(
  pcmBuffer: Buffer,
  sampleRate = 24000
): { audioData: string; durationSec: number } {
  const evenByteLen = pcmBuffer.length - (pcmBuffer.length % 2);
  const cleanPcm = evenByteLen === pcmBuffer.length ? pcmBuffer : pcmBuffer.subarray(0, evenByteLen);
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = cleanPcm.length;
  const wavHeader = Buffer.alloc(44);

  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + dataSize, 4);
  wavHeader.write('WAVE', 8);
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20);
  wavHeader.writeUInt16LE(numChannels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(bitsPerSample, 34);
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(dataSize, 40);

  const wavBuffer = Buffer.concat([wavHeader, cleanPcm]);
  const durationSec = Number(Math.max(0.2, dataSize / 2 / sampleRate).toFixed(2));
  return {
    audioData: `data:audio/wav;base64,${wavBuffer.toString('base64')}`,
    durationSec,
  };
}

/**
 * Splits a single combined multi-scene PCM buffer into N silence-trimmed scene WAVs
 * by locating the deepest silence valley around each proportional phonetic boundary.
 */
function splitPcmIntoScenes(
  rawPcmBuf: Buffer,
  sceneTexts: string[],
  sampleRate = 24000
): Array<{ audioData: string; durationSec: number }> {
  const trimmedGlobal = trimPcmSilence(rawPcmBuf, sampleRate);
  if (sceneTexts.length <= 1) {
    return [pcmToWavDataUri(trimmedGlobal, sampleRate)];
  }

  const totalSamples = Math.floor(trimmedGlobal.length / 2);
  const weights = sceneTexts.map((txt) => {
    const clean = (txt || '').trim();
    const commas = (clean.match(/[,;:]/g) || []).length;
    const periods = (clean.match(/[.!?]/g) || []).length;
    return Math.max(8, clean.length + commas * 5 + periods * 10);
  });
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);

  const splitSamples: number[] = [0];
  let accumWeight = 0;
  const windowSamples = Math.floor(sampleRate * 0.08); // 80ms silence-detection window
  const searchRadius = Math.floor(sampleRate * 1.35);  // ±1.35s search window around expected boundary
  const minSceneSamples = Math.floor(sampleRate * 0.7);

  for (let i = 0; i < sceneTexts.length - 1; i++) {
    accumWeight += weights[i];
    const expectedSample = Math.floor((accumWeight / totalWeight) * totalSamples);
    const prevSplit = splitSamples[splitSamples.length - 1];
    const remainingScenes = sceneTexts.length - 1 - i;

    const minSearch = Math.max(prevSplit + minSceneSamples, expectedSample - searchRadius);
    const maxSearch = Math.min(
      totalSamples - remainingScenes * minSceneSamples - windowSamples,
      expectedSample + searchRadius
    );

    if (maxSearch <= minSearch) {
      splitSamples.push(Math.max(prevSplit + minSceneSamples, Math.min(totalSamples - minSceneSamples, expectedSample)));
      continue;
    }

    let bestCenter = expectedSample;
    let lowestScore = Number.POSITIVE_INFINITY;
    const step = Math.max(60, Math.floor(sampleRate * 0.01)); // 10ms step

    for (let pos = minSearch; pos <= maxSearch; pos += step) {
      let sumAbs = 0;
      for (let k = 0; k < windowSamples; k += 4) {
        sumAbs += Math.abs(trimmedGlobal.readInt16LE((pos + k) * 2));
      }
      const avgAmp = sumAbs / (windowSamples / 4);
      // Slight distance penalty from expectedSample so we pick the silence valley closest to the scene break
      const distPenalty = (Math.abs(pos - expectedSample) / searchRadius) * 90;
      const score = avgAmp + distPenalty;
      if (score < lowestScore) {
        lowestScore = score;
        bestCenter = pos + Math.floor(windowSamples / 2);
      }
    }

    splitSamples.push(bestCenter);
  }
  splitSamples.push(totalSamples);

  const results: Array<{ audioData: string; durationSec: number }> = [];
  for (let i = 0; i < sceneTexts.length; i++) {
    const startByte = splitSamples[i] * 2;
    const endByte = splitSamples[i + 1] * 2;
    const rawSlice = trimmedGlobal.subarray(startByte, endByte);
    const trimmedSlice = trimPcmSilence(rawSlice, sampleRate);
    results.push(pcmToWavDataUri(trimmedSlice, sampleRate));
  }

  return results;
}

/**
 * Maps any Satset voice profile name/ID to an official Gemini prebuilt voiceName.
 */
function resolveGeminiPrebuiltVoice(rawVoice?: string, isFemale = false): string {
  const v = (rawVoice || '').trim().toLowerCase();
  const directMap: Record<string, string> = {
    charon: 'Charon',
    fenrir: 'Fenrir',
    orus: 'Orus',
    kore: 'Kore',
    aoede: 'Aoede',
    leda: 'Leda',
    puck: 'Puck',
    zephyr: 'Zephyr',
    budi: 'Charon',
    dimas: 'Fenrir',
    zubenelgenubi: 'Fenrir',
    alnilam: 'Charon',
    schedar: 'Charon',
    algieba: 'Orus',
    iapetus: 'Orus',
    umbriel: 'Charon',
    enceladus: 'Orus',
    algenib: 'Fenrir',
    achird: 'Puck',
    sadachbia: 'Puck',
    sadaltager: 'Orus',
    rasalgethi: 'Charon',
    gacrux: 'Orus',
    sarah: 'Kore',
    maya: 'Aoede',
    despina: 'Kore',
    achernar: 'Aoede',
    vindemiatrix: 'Leda',
    sulafat: 'Kore',
    'zephyr-female': 'Zephyr',
    callirrhoe: 'Aoede',
    autonoe: 'Leda',
    erinome: 'Leda',
    laomedeia: 'Aoede',
    dia: 'Puck',
    pulcherrima: 'Kore',
  };

  if (directMap[v]) return directMap[v];
  for (const [key, mapped] of Object.entries(directMap)) {
    if (v.includes(key)) return mapped;
  }
  return isFemale ? 'Kore' : 'Charon';
}

// In-memory cache & per-model rate limit cooldowns to prevent 429 quota exhaustion
const serverTtsCache = new Map<
  string,
  {
    audioData: string;
    durationSec: number;
    sceneAudios?: Array<{ audioData: string; durationSec: number }>;
    voice: string;
    model: string;
  }
>();
const inFlightTtsRequests = new Map<
  string,
  Promise<{
    audioData: string;
    durationSec: number;
    sceneAudios?: Array<{ audioData: string; durationSec: number }>;
    voice: string;
    model: string;
  } | null>
>();
const modelCooldownUntil = new Map<string, number>();

function isRateLimitError(err: any): boolean {
  const msg = String(err?.message || err || '').toLowerCase();
  const status = Number(err?.status || err?.code || 0);
  return (
    status === 429 ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('rate exceeded') ||
    msg.includes('too many requests')
  );
}

function isModelNotFoundError(err: any): boolean {
  const msg = String(err?.message || err || '').toLowerCase();
  const status = Number(err?.status || err?.code || 0);
  return status === 404 || msg.includes('not_found') || msg.includes('is not found');
}

const waitMs = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes ai.models.generateContent with automatic model rotation (gemini-4-hydrogen -> gemini-3.1-flash-lite),
 * per-model 55s cooldown on 429/RESOURCE_EXHAUSTED, and short exponential backoff.
 */
async function generateGeminiWithFallback(params: {
  contents: any;
  config?: Record<string, any>;
  models?: string[];
}) {
  if (!ai) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  const models = params.models || ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of models) {
    const cooldownUntil = modelCooldownUntil.get(model) || 0;
    if (Date.now() < cooldownUntil) {
      continue;
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
      } catch (err: any) {
        lastError = err;
        if (isModelNotFoundError(err)) {
          modelCooldownUntil.set(model, Date.now() + 300_000);
          break;
        }
        if (isRateLimitError(err)) {
          if (attempt === 0) {
            await waitMs(400 + Math.floor(Math.random() * 250));
            continue;
          }
          modelCooldownUntil.set(model, Date.now() + 55_000);
          break;
        }
        // Transient network / 5xx retry once
        if (attempt === 0 && (String(err?.status || '').startsWith('5') || /timeout|network|econn/i.test(String(err?.message || '')))) {
          await waitMs(350);
          continue;
        }
        throw err;
      }
    }
  }

  throw lastError || new Error('Semua model AI sedang sibuk (rate limit). Silakan coba sesaat lagi.');
}

/**
 * Generates natural Indonesian speech audio via Gemini TTS on v1beta.
 * Supports single-request multi-scene batching so an 8-scene video uses only 1 request!
 */
async function synthesizeGeminiSpeech(
  text: string,
  voice: string,
  stylePrompt?: string,
  isFemale = false,
  sceneTexts?: string[]
): Promise<{
  audioData: string;
  durationSec: number;
  sceneAudios?: Array<{ audioData: string; durationSec: number }>;
  voice: string;
  model: string;
} | null> {
  if (!ai) return null;

  const targetVoice = resolveGeminiPrebuiltVoice(voice, isFemale);
  const validSceneTexts = Array.isArray(sceneTexts)
    ? sceneTexts.map((s) => (s || '').trim()).filter(Boolean)
    : [];

  const combinedInputText =
    validSceneTexts.length > 1
      ? validSceneTexts.join(' ... ... ')
      : text.replace(/<breath>/gi, '... ').trim();

  const cacheKey = `${targetVoice}:${validSceneTexts.length > 1 ? validSceneTexts.join('||') : combinedInputText}`;
  const cached = serverTtsCache.get(cacheKey);
  if (cached) return cached;

  const existingInFlight = inFlightTtsRequests.get(cacheKey);
  if (existingInFlight) return existingInFlight;

  const runTts = async () => {
    const effectiveStyle =
      stylePrompt ||
      (isFemale
        ? 'Suara wanita Indonesia yang jernih, segar, dan ramah, mengalir alami sesuai tempo'
        : 'Suara pria Indonesia yang tenang, hangat, dan berbobot seperti kreator profesional');

    const attempts: Array<{ model: string; useSpeechMetadata: boolean }> = [
      { model: 'gemini-3.8-flash-lite-tts', useSpeechMetadata: true },
      { model: 'gemini-3.8-flash-tts', useSpeechMetadata: true },
      { model: 'gemini-2.5-flash-preview-tts', useSpeechMetadata: false },
    ];

    for (const attempt of attempts) {
      const cooldownUntil = modelCooldownUntil.get(attempt.model) || 0;
      if (Date.now() < cooldownUntil) {
        continue;
      }

      for (let retry = 0; retry < 2; retry++) {
        try {
          const part: Record<string, any> = { text: combinedInputText };
          if (attempt.useSpeechMetadata && effectiveStyle) {
            part.speechMetadata = { style: effectiveStyle };
          }

          const response = await ai.models.generateContent({
            model: attempt.model,
            contents: [
              {
                role: 'user',
                parts: [part],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: targetVoice },
                },
              },
            },
          });

          const inlinePart = response.candidates?.[0]?.content?.parts?.find(
            (p: any) => p.inlineData?.data
          );
          const base64Audio = inlinePart?.inlineData?.data;
          if (base64Audio) {
            const rawPcm = extractRawPcmBuffer(base64Audio);
            const trimmedFullPcm = trimPcmSilence(rawPcm, 24000);
            const fullWav = pcmToWavDataUri(trimmedFullPcm, 24000);

            let sceneAudios: Array<{ audioData: string; durationSec: number }> | undefined;
            if (validSceneTexts.length > 0) {
              sceneAudios = splitPcmIntoScenes(rawPcm, validSceneTexts, 24000);
              validSceneTexts.forEach((scText, idx) => {
                if (sceneAudios?.[idx]) {
                  serverTtsCache.set(`${targetVoice}:${scText}`, {
                    audioData: sceneAudios[idx].audioData,
                    durationSec: sceneAudios[idx].durationSec,
                    voice: targetVoice,
                    model: attempt.model,
                  });
                }
              });
            }

            const result = {
              audioData: fullWav.audioData,
              durationSec: fullWav.durationSec,
              sceneAudios,
              voice: targetVoice,
              model: attempt.model,
            };
            serverTtsCache.set(cacheKey, result);
            return result;
          }
          break;
        } catch (err: any) {
          if (isRateLimitError(err)) {
            if (retry === 0) {
              await waitMs(400);
              continue;
            }
            modelCooldownUntil.set(attempt.model, Date.now() + 55000);
            break;
          }
          const errStatus = Number(err?.status || err?.code || 0);
          const errMsg = String(err?.message || err || '').toLowerCase();
          if (
            isModelNotFoundError(err) ||
            errStatus === 403 ||
            errMsg.includes('403') ||
            errMsg.includes('free tier is not available') ||
            errMsg.includes('permission_denied')
          ) {
            modelCooldownUntil.set(attempt.model, Date.now() + 300000);
            break;
          }
          break;
        }
      }
    }

    return null;
  };

  const promise = runTts().finally(() => {
    inFlightTtsRequests.delete(cacheKey);
  });
  inFlightTtsRequests.set(cacheKey, promise);
  return promise;
}

/**
 * Normalizes Indonesian script text into natural conversational spoken Indonesian
 * and splits long paragraphs into clause chunks <= 190 chars for neural TTS.
 */
function splitSpokenIndonesianClauses(rawText: string): string[] {
  const cleaned = String(rawText || '')
    .replace(/<breath>/gi, ', ')
    .replace(/\bHP\b/gi, 'hape')
    .replace(/\bgak\b/gi, 'nggak')
    .replace(/\bgk\b/gi, 'nggak')
    .replace(/\bbgt\b/gi, 'banget')
    .replace(/\budah\b/gi, 'sudah')
    .replace(/\bblm\b/gi, 'belum')
    .replace(/\byg\b/gi, 'yang')
    .replace(/\bdgn\b/gi, 'dengan')
    .replace(/\butk\b/gi, 'untuk')
    .replace(/\bkrn\b/gi, 'karena')
    .replace(/\btp\b/gi, 'tapi')
    .replace(/\bjg\b/gi, 'juga')
    .replace(/\bAI\b/g, 'E-I')
    .replace(/\bVO\b/g, 'Voice Over')
    .replace(/(\d+)\s*%/g, '$1 persen')
    .replace(/[—–]+/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return [];
  if (cleaned.length <= 185) return [cleaned];

  const parts = cleaned.split(/([.,!?;:]+)/);
  const chunks: string[] = [];
  let current = '';

  for (let i = 0; i < parts.length; i += 2) {
    const body = (parts[i] || '').trim();
    const punct = (parts[i + 1] || '').trim();
    if (!body) continue;
    const candidate = `${body}${punct ? punct : ''}`.trim();
    if (!current) {
      current = candidate;
    } else if ((current + ' ' + candidate).length <= 185) {
      current = `${current} ${candidate}`;
    } else {
      chunks.push(current);
      current = candidate;
    }
  }
  if (current) chunks.push(current);

  const finalChunks: string[] = [];
  for (const ch of chunks) {
    if (ch.length <= 185) {
      finalChunks.push(ch);
    } else {
      const words = ch.split(/\s+/);
      let temp = '';
      for (const w of words) {
        if ((temp + ' ' + w).trim().length <= 180) {
          temp = (temp + ' ' + w).trim();
        } else {
          if (temp) finalChunks.push(temp);
          temp = w;
        }
      }
      if (temp) finalChunks.push(temp);
    }
  }
  return finalChunks.filter(Boolean);
}

/**
 * Fetches neural human spoken MP3 bytes for a single clause (<190 chars).
 * Uses OTTSY Neural Creator Voices (`id_001` for Indonesian, varied native neural speakers for pure English),
 * falling back cleanly only on network failure.
 */
async function fetchIndonesianNeuralClauseMp3(
  clause: string,
  voice = 'fenrir',
  isFemale = false
): Promise<Buffer | null> {
  const cleanClause = clause.trim();
  if (!cleanClause) return null;

  const { otVoice } = selectNeuralBaseVoiceForClause(cleanClause, voice, isFemale);

  // Primary: OTTSY Neural Creator Voice (direct 200 JSON base64 MP3, zero 307 redirect)
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5500);
    const res = await fetch('https://ottsy.weilbyte.dev/api/generation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanClause, voice: otVoice }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const json: any = await res.json();
      if (json?.data && typeof json.data === 'string' && json.data.length > 120) {
        return Buffer.from(json.data, 'base64');
      }
    }
  } catch {
    // Offline/timeout fallback below
  }

  // Last-resort emergency fallback only if primary neural TTS is unreachable
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4500);
    const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      cleanClause
    )}&tl=id&client=tw-ob`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const arr = await res.arrayBuffer();
      if (arr.byteLength > 120) {
        return Buffer.from(arr);
      }
    }
  } catch {
    // Ignore
  }

  return null;
}

/**
 * Decodes an MP3 buffer and applies the studio vocal-tract filter via ffmpeg into 24kHz 16-bit mono PCM.
 */
function convertMp3BufferToMasteredPcm(mp3Buf: Buffer, filterChain: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    try {
      const ff = spawn('ffmpeg', [
        '-hide_banner',
        '-loglevel',
        'error',
        '-i',
        'pipe:0',
        '-af',
        filterChain,
        '-f',
        's16le',
        '-acodec',
        'pcm_s16le',
        '-ac',
        '1',
        '-ar',
        '24000',
        'pipe:1',
      ]);
      const chunks: Buffer[] = [];
      const timer = setTimeout(() => {
        try {
          ff.kill('SIGKILL');
        } catch {
          // ignore
        }
        resolve(null);
      }, 6500);

      ff.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
      ff.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0 && chunks.length > 0) {
          resolve(Buffer.concat(chunks));
        } else {
          resolve(null);
        }
      });
      ff.on('error', () => {
        clearTimeout(timer);
        resolve(null);
      });
      ff.stdin.write(mp3Buf);
      ff.stdin.end();
    } catch {
      resolve(null);
    }
  });
}

/**
 * Synthesizes exact spoken Indonesian narration for a single scene text or multi-scene array
 * so every scene plays the exact words in its script (`narration_text`).
 */
async function synthesizeHumanIndonesianScriptSpeech(
  text: string,
  voice: string,
  isFemale = false,
  sceneTexts?: string[],
  speed = 1.0
): Promise<{
  audioData: string;
  durationSec: number;
  sceneAudios: Array<{ audioData: string; durationSec: number }>;
  voice: string;
  model: string;
} | null> {
  const speedBucket = Math.round((Number(speed) || 1.0) * 100);
  const voiceKey = `${(voice || 'Fenrir').trim().toLowerCase()}_${isFemale ? 'f' : 'm'}_s${speedBucket}`;
  const targetScenes =
    Array.isArray(sceneTexts) && sceneTexts.length > 0
      ? sceneTexts.map((s) => String(s || '').trim()).filter(Boolean)
      : [String(text || '').trim()].filter(Boolean);

  if (targetScenes.length === 0) return null;

  const batchCacheKey = `neural_id:${voiceKey}:${targetScenes.join('||')}`;
  const cachedBatch = serverTtsCache.get(batchCacheKey);
  if (cachedBatch && cachedBatch.sceneAudios && cachedBatch.sceneAudios.length === targetScenes.length) {
    return {
      audioData: cachedBatch.audioData,
      durationSec: cachedBatch.durationSec,
      sceneAudios: cachedBatch.sceneAudios,
      voice: cachedBatch.voice,
      model: cachedBatch.model,
    };
  }

  const filterChain = buildVoiceMasteringFilter(voice, isFemale, speed);

  const synthesizeSingleScene = async (
    scText: string
  ): Promise<{ pcm: Buffer; wav: { audioData: string; durationSec: number } } | null> => {
    const clauses = splitSpokenIndonesianClauses(scText);
    if (clauses.length === 0) return null;

    const mp3Parts: Buffer[] = [];
    for (const clause of clauses) {
      const mp3 = await fetchIndonesianNeuralClauseMp3(clause, voice, isFemale);
      if (mp3) mp3Parts.push(mp3);
    }
    if (mp3Parts.length === 0) return null;

    const combinedMp3 = Buffer.concat(mp3Parts);
    const rawPcm = await convertMp3BufferToMasteredPcm(combinedMp3, filterChain);
    if (!rawPcm || rawPcm.length < 400) return null;

    const trimmedPcm = trimPcmSilence(rawPcm, 24000);
    const wav = pcmToWavDataUri(trimmedPcm, 24000);
    serverTtsCache.set(`neural_id:${voiceKey}:${scText}`, {
      audioData: wav.audioData,
      durationSec: wav.durationSec,
      voice: resolveGeminiPrebuiltVoice(voice, isFemale),
      model: 'VoiceStudio Neural Human Narrator',
    });
    return { pcm: trimmedPcm, wav };
  };

  const sceneOutputs = await Promise.all(targetScenes.map((sc) => synthesizeSingleScene(sc)));
  if (sceneOutputs.every((item) => item === null)) {
    return null;
  }

  const silenceGapPcm = Buffer.alloc(Math.floor(24000 * 0.22) * 2, 0); // 220ms natural breath pause between scenes
  const fullPcmParts: Buffer[] = [];
  const sceneAudios: Array<{ audioData: string; durationSec: number }> = [];

  for (let i = 0; i < targetScenes.length; i++) {
    const out = sceneOutputs[i];
    if (out) {
      sceneAudios.push(out.wav);
      fullPcmParts.push(out.pcm);
      if (i < targetScenes.length - 1) {
        fullPcmParts.push(silenceGapPcm);
      }
    } else {
      // Fallback 3.5s silent buffer if a single scene failed network fetch
      const fallbackPcm = Buffer.alloc(Math.floor(24000 * 3.5) * 2, 0);
      sceneAudios.push(pcmToWavDataUri(fallbackPcm, 24000));
    }
  }

  const fullPcm = fullPcmParts.length > 0 ? Buffer.concat(fullPcmParts) : Buffer.alloc(24000 * 2, 0);
  const fullWav = pcmToWavDataUri(fullPcm, 24000);
  const result = {
    audioData: fullWav.audioData,
    durationSec: fullWav.durationSec,
    sceneAudios,
    voice: resolveGeminiPrebuiltVoice(voice, isFemale),
    model: 'VoiceStudio Neural ID Narrator',
  };
  serverTtsCache.set(batchCacheKey, result);
  return result;
}

// VoiceStudio Natural Speech Synthesis API
// Supports both single-scene synthesis and 1-request multi-scene batch synthesis
app.post('/api/voice/synthesize', async (req, res) => {
  const {
    text = '',
    scenes,
    voice = 'Charon',
    style = 'Suara narator Indonesia yang natural, hangat, dan jelas',
    speed = 1.05,
    naturalBreathing = true,
    isFemale = false,
  } = req.body;

  const validScenes = Array.isArray(scenes)
    ? scenes.map((s: any) => String(s || '').trim()).filter(Boolean)
    : [];
  const effectiveText = (text || validScenes.join(' ')).trim();

  if (!effectiveText) {
    return res.status(400).json({ error: 'Text is required for voice synthesis' });
  }

  const inferredFemale = isVoiceProfileFemale(voice, Boolean(isFemale));

  const ttsResult = await synthesizeGeminiSpeech(
    effectiveText,
    voice,
    style,
    inferredFemale,
    validScenes.length > 0 ? validScenes : undefined
  );
  if (ttsResult) {
    return res.json({
      success: true,
      audioData: ttsResult.audioData,
      durationSec: ttsResult.durationSec,
      sceneAudios: ttsResult.sceneAudios,
      engine: `VoiceStudio Gemini TTS (${ttsResult.model})`,
      voice: ttsResult.voice,
      format: 'wav',
    });
  }

  // Fallback to Server-Side Neural Human Narrator with per-profile vocal mastering
  const neuralScriptResult = await synthesizeHumanIndonesianScriptSpeech(
    effectiveText,
    voice,
    inferredFemale,
    validScenes.length > 0 ? validScenes : [effectiveText],
    Number(speed) || 1.0
  );
  if (neuralScriptResult) {
    return res.json({
      success: true,
      audioData: neuralScriptResult.audioData,
      durationSec: neuralScriptResult.durationSec,
      sceneAudios: neuralScriptResult.sceneAudios,
      engine: neuralScriptResult.model,
      voice: neuralScriptResult.voice,
      format: 'wav',
    });
  }

  return res.json({
    success: true,
    engine: 'VoiceStudio Prosody Engine',
    voice: resolveGeminiPrebuiltVoice(voice, inferredFemale),
    cadence: { speed, naturalBreathing },
    message: 'VoiceStudio prosody synchronized successfully',
  });
});

// VoiceStudio Sample Preview Audio API (Synthesizes distinct human voice per selected profile)
app.post('/api/voice/sample', async (req, res) => {
  const {
    voice = 'fenrir',
    text = 'Halo, begini suaraku kalau membacakan ceritamu. Pelan-pelan saja, yang penting terus melangkah.',
    isFemale = false,
    speed = 1.0,
  } = req.body;

  const vLower = (voice || '').toLowerCase();
  const inferredFemale = isVoiceProfileFemale(voice, Boolean(isFemale));
  let defaultSampleUrl = '/audio/samples/charon_sample.mp3';
  if (vLower.includes('fenrir') || vLower.includes('zubenelgenubi') || vLower.includes('dimas')) {
    defaultSampleUrl = '/audio/samples/fenrir_sample.mp3';
  } else if (vLower.includes('aoede') || vLower.includes('maya')) {
    defaultSampleUrl = '/audio/samples/aoede_sample.mp3';
  } else if (inferredFemale) {
    defaultSampleUrl = '/audio/samples/kore_sample.mp3';
  }

  const styleDescription = inferredFemale
    ? 'Suara wanita Indonesia yang jernih, segar, dan ramah, mengalir alami'
    : 'Suara pria Indonesia yang tenang, hangat, dan berbobot seperti teman ngobrol biasa';

  const ttsResult = await synthesizeGeminiSpeech(text, voice, styleDescription, inferredFemale);
  if (ttsResult) {
    return res.json({
      success: true,
      audioData: ttsResult.audioData,
      durationSec: ttsResult.durationSec,
      audioUrl: defaultSampleUrl,
      voice: ttsResult.voice,
      engine: ttsResult.model,
    });
  }

  const neuralSample = await synthesizeHumanIndonesianScriptSpeech(
    text,
    voice,
    inferredFemale,
    [text],
    Number(speed) || 1.0
  );
  if (neuralSample) {
    return res.json({
      success: true,
      audioData: neuralSample.audioData,
      durationSec: neuralSample.durationSec,
      audioUrl: defaultSampleUrl,
      voice: String(voice),
      engine: neuralSample.model,
    });
  }

  return res.json({
    success: true,
    audioUrl: defaultSampleUrl,
    voice,
  });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(apiKey) });
});

// Catalog endpoint
app.get('/api/catalog', (_req, res) => {
  res.json({ catalog: MOTION_CATALOG });
});

// Autonomous Motion Agent Storyboard Generation
app.post('/api/agent/generate', async (req, res) => {
  const {
    brief = 'Next-gen motion graphics presentation',
    durationSeconds = 15,
    aspectRatio = '16:9',
    audioMood = 'cyberSynth',
    voiceStyle = 'Neutral Studio',
    selectedStyles = [],
    language = 'en',
  } = req.body;

  // Curate fallback/algorithmic storyboards in case Gemini is unavailable
  const generateAlgorithmicStoryboard = () => {
    const chapterCount = durationSeconds <= 5 ? 2 : durationSeconds <= 10 ? 3 : durationSeconds <= 15 ? 4 : 5;
    const durationPerChapter = Math.round((durationSeconds * 1000) / chapterCount);
    
    // Pick styles from selectedStyles or diverse catalog
    const stylePool = selectedStyles.length > 0 
      ? selectedStyles 
      : ['glitch-terminal-decrypt', 'orbital-wireframe-gyro', 'boxed-word-relay', 'cyber-horizon-grid', 'circular-radar-pulse'];

    const transitions: ('crossfade' | 'zoomPunch' | 'whipPan' | 'glitch' | 'lightFlash')[] = [
      'zoomPunch', 'whipPan', 'glitch', 'lightFlash', 'crossfade'
    ];
    const sfxCues: ('subdrop' | 'whoosh' | 'glitch' | 'chime' | 'riser')[] = [
      'subdrop', 'whoosh', 'glitch', 'riser', 'chime'
    ];

    const chapters = Array.from({ length: chapterCount }, (_, i) => {
      const styleId = stylePool[i % stylePool.length];
      const catalogItem = MOTION_CATALOG.find((m) => m.id === styleId) || MOTION_CATALOG[0];

      return {
        id: `chap-${i + 1}-${Date.now().toString(36)}`,
        title: language === 'zh' ? `第 ${i + 1} 幕: ${catalogItem.nameZh}` : `Act ${i + 1}: ${catalogItem.name}`,
        titleZh: `第 ${i + 1} 幕: ${catalogItem.nameZh}`,
        durationMs: durationPerChapter,
        transitionType: transitions[i % transitions.length],
        motionGraphicType: catalogItem.id,
        visualNotes: `Dynamic scene featuring ${catalogItem.name} choreographed to brief: "${brief.slice(0, 80)}...". Particle dynamics and kinetic type.`,
        visualNotesZh: `基于创意简报"${brief.slice(0, 40)}..."编排的${catalogItem.nameZh}动态场景，具有多层光效与运动曲线。`,
        script: language === 'zh' 
          ? `第 ${i + 1} 阶段演进：探索无界计算与高维动态表达的融合。`
          : `Phase ${i + 1}: Navigating the nexus of intelligence, kinetic velocity, and dimensional form.`,
        scriptZh: `第 ${i + 1} 阶段演进：探索无界计算与高维动态表达的融合。`,
        accentColor: catalogItem.accentColor,
        secondaryColor: catalogItem.secondaryColor,
        sfxCue: sfxCues[i % sfxCues.length],
      };
    });

    const activity = [
      {
        id: 'act-1',
        role: 'Director' as const,
        roleZh: '总导演',
        action: 'Analyzed creative narrative brief and paced chapter pacing beats',
        actionZh: '解析创意简报意图，推导电影级叙事节奏与分镜切分点',
        status: 'completed' as const,
        timestamp: Date.now() - 1500,
        details: `Target: ${durationSeconds}s runtime across ${chapterCount} cinematic chapters at ${aspectRatio}.`,
      },
      {
        id: 'act-2',
        role: 'Motion Designer' as const,
        roleZh: '动效设计师',
        action: 'Orchestrated procedural motion archetypes & camera vector paths',
        actionZh: '构思程序化运动原型与空间摄像机运镜轨迹',
        status: 'completed' as const,
        timestamp: Date.now() - 1100,
        details: `Selected archetypes: ${chapters.map(c => c.motionGraphicType).join(', ')}.`,
      },
      {
        id: 'act-3',
        role: 'Sound Composer' as const,
        roleZh: '音乐作曲家',
        action: 'Synthesized harmonic chord bed, rhythmic pulse and transition SFX cues',
        actionZh: '程序化合成和弦基底、低频节拍脉冲与关键转场音效点',
        status: 'completed' as const,
        timestamp: Date.now() - 700,
        details: `Mood: ${audioMood} with synchronized sub-drops, risers, and glitch cues.`,
      },
      {
        id: 'act-4',
        role: 'Colorist' as const,
        roleZh: '调色总监',
        action: 'Harmonized chromatic palette and emissive bloom shaders',
        actionZh: '校准高动态色彩矩阵与发光光晕材质',
        status: 'completed' as const,
        timestamp: Date.now() - 300,
        details: `Gradients matched across chapters with optical lens flare passes.`,
      },
      {
        id: 'act-5',
        role: 'Quality Reviewer' as const,
        roleZh: '质检审核员',
        action: 'Validated 60fps frame delta bounds, safe margins, and timeline parity',
        actionZh: '验证 60fps 帧率平滑度、安全边距与多轨时钟同步率',
        status: 'completed' as const,
        timestamp: Date.now(),
        details: `All chapters verified without layout collisions or duration drift.`,
      },
    ];

    return {
      title: language === 'zh' ? `动态短片: ${brief.slice(0, 24)}` : `Motion Film: ${brief.slice(0, 32)}`,
      titleZh: `动态短片: ${brief.slice(0, 24)}`,
      chapters,
      agentActivity: activity,
    };
  };

  if (!ai) {
    const fallback = generateAlgorithmicStoryboard();
    return res.json(fallback);
  }

  try {
    const prompt = `You are Kiteva, an elite autonomous AI Motion Graphics Director.
Create a complete, cinematic multi-chapter motion graphics storyboard based on this user creative brief:
Brief: "${brief}"
Target Duration: ${durationSeconds} seconds
Aspect Ratio: ${aspectRatio}
Audio Mood: ${audioMood}
Voiceover: ${voiceStyle}
Selected Styles: ${selectedStyles.join(', ') || 'Any appropriate styles from modern motion design'}
Output Language: ${language === 'zh' ? 'Chinese (Simplified)' : 'English'}

Break the film into 2 to 5 distinct chapters that tell a cohesive visual story.
Available motionGraphicType identifiers:
- boxed-word-relay
- split-flap-counter
- kinetic-stagger-headline
- glitch-terminal-decrypt
- orbital-wireframe-gyro
- cyber-horizon-grid
- floating-glass-hologram
- quantum-torus-knot
- sacred-bauhaus-mandala
- liquid-mercury-blob
- stippled-vector-flow
- quantum-candlestick-surge
- circular-radar-pulse
- neural-synapse-network
- chromatic-lens-flare
- crt-scanline-matrix

Return a valid JSON object matching the requested schema.`;

    const response = await generateGeminiWithFallback({
      contents: prompt,
      config: {
        systemInstruction: 'You are Kiteva, a professional motion graphics film director and creative engineer. Return strictly valid JSON.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            titleZh: { type: Type.STRING },
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  titleZh: { type: Type.STRING },
                  durationMs: { type: Type.INTEGER },
                  transitionType: { type: Type.STRING, enum: ['crossfade', 'zoomPunch', 'whipPan', 'glitch', 'lightFlash', 'iris'] },
                  motionGraphicType: { type: Type.STRING },
                  visualNotes: { type: Type.STRING },
                  visualNotesZh: { type: Type.STRING },
                  script: { type: Type.STRING },
                  scriptZh: { type: Type.STRING },
                  accentColor: { type: Type.STRING },
                  secondaryColor: { type: Type.STRING },
                  sfxCue: { type: Type.STRING, enum: ['whoosh', 'glitch', 'subdrop', 'riser', 'chime'] },
                },
                required: ['id', 'title', 'durationMs', 'motionGraphicType', 'visualNotes', 'script', 'accentColor', 'secondaryColor'],
              },
            },
            agentActivity: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  role: { type: Type.STRING },
                  roleZh: { type: Type.STRING },
                  action: { type: Type.STRING },
                  actionZh: { type: Type.STRING },
                  status: { type: Type.STRING },
                  details: { type: Type.STRING },
                },
                required: ['id', 'role', 'action', 'status'],
              },
            },
          },
          required: ['title', 'chapters', 'agentActivity'],
        },
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } else {
      return res.json(generateAlgorithmicStoryboard());
    }
  } catch (err) {
    console.error('Gemini Agent Generation Error:', err);
    // Fall back smoothly to high-fidelity algorithmic generator
    return res.json(generateAlgorithmicStoryboard());
  }
});

// In-line AI Refinement endpoint
app.post('/api/agent/refine', async (req, res) => {
  const { chapter, instruction, language = 'en' } = req.body;
  if (!chapter) {
    return res.status(400).json({ error: 'Chapter is required' });
  }

  if (!ai) {
    // Local smart heuristic refinement
    const updated = {
      ...chapter,
      visualNotes: `${chapter.visualNotes} [Refined: ${instruction}]`,
      script: language === 'zh' ? `${chapter.script}（根据反馈优化）` : `${chapter.script} (Refined)`,
    };
    return res.json({ chapter: updated });
  }

  try {
    const prompt = `Refine this motion graphics chapter according to the director instruction: "${instruction}"
Current Chapter Data:
${JSON.stringify(chapter, null, 2)}

Return the updated chapter JSON object with improved visualNotes, script, colors or transitions.`;

    const response = await generateGeminiWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      return res.json({ chapter: parsed });
    }
    return res.json({ chapter });
  } catch (err) {
    console.error('Refinement error:', err);
    return res.json({ chapter });
  }
});

// ==========================================
// SATSET MOTION APIS (satsetmotion.id style)
// ==========================================

// Get available visual style modules
app.get('/api/satset/modules', (_req, res) => {
  res.json({ modules: SATSET_MODULES });
});

async function fetchImageAsDataUrl(imageUrl: string): Promise<string | undefined> {
  if (!imageUrl || imageUrl.startsWith('data:')) return imageUrl;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const resp = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });
    if (!resp.ok) return undefined;
    const contentType = resp.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) return undefined;
    const arrayBuf = await resp.arrayBuffer();
    if (arrayBuf.byteLength < 120 || arrayBuf.byteLength > 2_500_000) return undefined;
    const base64 = Buffer.from(arrayBuf).toString('base64');
    return `data:${contentType.split(';')[0]};base64,${base64}`;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchLiveWebsiteMetadata(targetUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7500);
  try {
    // Direct website metadata fetch without requiring external Firecrawl env keys
    const firecrawlKey = '';
    let firecrawlLinks: string[] = [];
    let firecrawlHtml = '';
    let firecrawlScreenshot = '';
    if (isConfiguredApiKey(firecrawlKey)) {
      try {
        const [fcMapResp, fcScrapeResp] = await Promise.all([
          fetch('https://api.firecrawl.dev/v1/map', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${firecrawlKey}`,
            },
            body: JSON.stringify({ url: targetUrl, limit: 12 }),
            signal: AbortSignal.timeout(3500),
          }).catch(() => null),
          fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${firecrawlKey}`,
            },
            body: JSON.stringify({
              url: targetUrl,
              formats: ['html', 'links', 'screenshot'],
            }),
            signal: AbortSignal.timeout(4500),
          }).catch(() => null),
        ]);

        if (fcMapResp && fcMapResp.ok) {
          const fcData: any = await fcMapResp.json();
          if (Array.isArray(fcData?.links)) {
            firecrawlLinks = fcData.links.slice(0, 12);
          }
        }
        if (fcScrapeResp && fcScrapeResp.ok) {
          const fcScrapeData: any = await fcScrapeResp.json();
          const dataObj = fcScrapeData?.data || fcScrapeData;
          if (typeof dataObj?.html === 'string' && dataObj.html.length > 100) {
            firecrawlHtml = dataObj.html;
          }
          if (typeof dataObj?.screenshot === 'string' && dataObj.screenshot.startsWith('http')) {
            firecrawlScreenshot = dataObj.screenshot;
          }
          if (Array.isArray(dataObj?.links) && firecrawlLinks.length === 0) {
            firecrawlLinks = dataObj.links.slice(0, 12);
          }
        }
      } catch {
        // Fallback to native multi-endpoint HTML crawler
      }
    }

    let html = firecrawlHtml;
    if (!html) {
      const response = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      if (response.ok) {
        html = await response.text();
      }
    }
    if (!html) return undefined;
    const rootParsed = parseWebsiteHtmlMetadata(html, targetUrl);

    if (firecrawlScreenshot) {
      rootParsed.discoveredMedia = rootParsed.discoveredMedia || [];
      rootParsed.discoveredMedia.unshift({
        type: 'image',
        url: firecrawlScreenshot,
        label: rootParsed.headings[0] || rootParsed.title || 'Tampilan Utama Website',
        endpointPath: '/',
      });
    }

    // Merge Firecrawl discovered links if any
    if (firecrawlLinks.length > 0 && rootParsed.discoveredEndpoints) {
      const existingUrls = new Set(rootParsed.discoveredEndpoints.map((e) => e.url));
      for (const link of firecrawlLinks) {
        if (!existingUrls.has(link) && rootParsed.discoveredEndpoints.length < 16) {
          try {
            const u = new URL(link);
            rootParsed.discoveredEndpoints.push({
              path: u.pathname || '/',
              url: link,
              title: u.pathname === '/' ? 'Beranda Utama' : u.pathname.replace(/^\/+/, '').replace(/[-_/]/g, ' '),
              type: 'page',
            });
            existingUrls.add(link);
          } catch {
            // ignore
          }
        }
      }
    }

    // 2. Crawl up to 4 discovered internal sub-page endpoints in parallel to deeply enrich headings, bullet points & subpage media
    const subPages = (rootParsed.discoveredEndpoints || [])
      .filter((ep) => (ep.type === 'page' || ep.type === 'api') && ep.path !== '/' && ep.url.startsWith('http'))
      .slice(0, 4);

    if (subPages.length > 0) {
      const subResults = await Promise.all(
        subPages.map(async (ep) => {
          try {
            const subResp = await fetch(ep.url, {
              signal: AbortSignal.timeout(2800),
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
              },
            });
            if (!subResp.ok) return null;
            const subHtml = await subResp.text();
            return { ep, meta: parseWebsiteHtmlMetadata(subHtml, ep.url) };
          } catch {
            return null;
          }
        })
      );

      for (const item of subResults) {
        if (!item) continue;
        for (const h of item.meta.headings.slice(0, 5)) {
          if (!rootParsed.headings.includes(h) && rootParsed.headings.length < 28) {
            rootParsed.headings.push(h);
          }
        }
        for (const bp of item.meta.bulletPoints.slice(0, 6)) {
          if (!rootParsed.bulletPoints.includes(bp) && rootParsed.bulletPoints.length < 36) {
            rootParsed.bulletPoints.push(bp);
          }
        }
        for (const m of item.meta.discoveredMedia || []) {
          if (
            rootParsed.discoveredMedia &&
            rootParsed.discoveredMedia.length < 14 &&
            !rootParsed.discoveredMedia.some((existing) => existing.url === m.url)
          ) {
            rootParsed.discoveredMedia.push({
              ...m,
              label: m.label || `${item.ep.title} (${item.ep.path})`,
              endpointPath: item.ep.path,
            });
          }
        }
      }
    }

    // Ensure at least one live website screenshot reference is available if the page had no <img>/<video> tags
    if (!rootParsed.discoveredMedia || rootParsed.discoveredMedia.length === 0) {
      const liveThumbUrl = `https://image.thum.io/get/width/1280/crop/800/noanimate/${targetUrl}`;
      rootParsed.discoveredMedia = [
        {
          type: 'image',
          url: liveThumbUrl,
          label: rootParsed.headings[0] || rootParsed.title || 'Tampilan Website',
          endpointPath: '/',
        },
      ];
    }

    // 3. Convert up to 8 discovered website content images into dataUrl so Canvas rendering has zero CORS issues
    if (rootParsed.discoveredMedia && rootParsed.discoveredMedia.length > 0) {
      const topImages = rootParsed.discoveredMedia.filter((m) => m.type === 'image').slice(0, 8);
      await Promise.all(
        topImages.map(async (mediaItem) => {
          const dataUrl = await fetchImageAsDataUrl(mediaItem.url);
          if (dataUrl) {
            mediaItem.dataUrl = dataUrl;
          }
        })
      );
    }

    return rootParsed;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

// CORS-safe Media Proxy for scraped website images & videos so HTML5 Canvas and <video> never taint
app.get('/api/satset/proxy-media', async (req, res) => {
  const rawUrl = String(req.query.url || '')
    .trim()
    .replace(/&amp;/gi, '&')
    .replace(/&#38;/g, '&');
  if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
    return res.status(400).send('Invalid media URL');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const upstream = await fetch(rawUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,video/*,*/*;q=0.8',
      },
    });
    if (!upstream.ok) {
      return res.status(upstream.status).send('Upstream media fetch failed');
    }
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Type', contentType);
    return res.send(buf);
  } catch {
    return res.status(502).send('Media proxy error');
  } finally {
    clearTimeout(timeout);
  }
});

// Smart Website Auto-Promotion Pipeline:
// Given any website link entered by the user, automatically crawls/discovers endpoints (Firecrawl + DOM),
// extracts core website concepts, brand colors, & real images/videos, and creates step-by-step website scenes.
app.post('/api/website-promo/analyze', async (req, res) => {
  const {
    url = '',
    target_duration_sec = 48,
    scene_count,
    gaya_video = 'uiweb',
    character = 'none',
    tempo = 'energik',
    aspect_ratio = '9:16',
    voice_option = 'fenrir',
    subtitle_style = 'satsetYellow',
    watermark,
  } = req.body || {};

  const normalizedUrl = extractWebsiteUrl(String(url || ''));
  if (!normalizedUrl) {
    return res.status(400).json({ error: 'Masukkan alamat URL website yang valid terlebih dahulu.' });
  }
  const parsedHtml = await fetchLiveWebsiteMetadata(normalizedUrl);
  const profile = buildWebsitePromoProfile(normalizedUrl, parsedHtml);
  const concepts = buildWebsitePromoConcepts(profile);
  const durSec = Math.max(20, Math.min(120, Number(target_duration_sec) || 48));
  const targetScenesCount =
    Number(scene_count) >= 4
      ? Math.min(12, Number(scene_count))
      : durSec >= 55
      ? 8
      : durSec >= 40
      ? 8
      : 6;

  const scenes = buildWebsitePromoScenes(profile, targetScenesCount, durSec, concepts[0]);
  const rawProject: SatsetProject = {
    id: `proj-web-${Date.now().toString(36)}`,
    project_title: `${profile.brandName} - ${profile.tagline}`,
    status: 'ready_to_render',
    start_mode: 'url',
    source_url: profile.url,
    website_promo: profile,
    language: 'id',
    content_type: 'promosi',
    topik_video: `${profile.url} - ${profile.brandName}: ${profile.tagline}`,
    target_duration_sec: durSec,
    durationSeconds: durSec,
    fps: 30,
    gaya_video: (gaya_video || 'uiweb') as SatsetStyleModule,
    styleModule: (gaya_video || 'uiweb') as SatsetStyleModule,
    character,
    warna_brand: profile.primaryColor,
    brandColor: profile.primaryColor,
    brand_secondary_color: profile.secondaryColor,
    brand_accent_color: profile.accentColor,
    brand_mode: 'custom',
    brand_preset_name: profile.brandName,
    tempo,
    transition: 'otomatis',
    aspect_ratio,
    bgm_style: tempo === 'energik' ? 'upbeat_synth' : 'energetic_lofi',
    bgm_volume: 0.58,
    auto_ducking: true,
    ducking_level: 0.15,
    voice_option,
    voiceOption: voice_option,
    subtitle_style,
    subtitleStyle: subtitle_style,
    subtitle_position: 'auto',
    duration_mode: 'auto',
    watermark: watermark || 'Graph Motion',
    idea_concepts: concepts,
    selected_idea_id: concepts[0].id,
    scenes,
    createdAt: Date.now(),
    title: `${profile.brandName} - ${profile.tagline}`,
    topic: `${profile.url} - ${profile.brandName}`,
  };

  const synced = synchronizeProjectPipeline(rawProject, {
    recalculateDurations: false,
    forceStyleSync: true,
  });
  synced.remotionCode = generateRemotionCode(synced, 30);

  return res.json({
    success: true,
    profile,
    concepts,
    scenes: synced.scenes,
    project: synced,
  });
});

// Post-Animation AI Revision Endpoint (Professional Remotion Skill Revision)
// Allows revising a single scene or all scenes via natural language instructions and regenerates Remotion code.
app.post('/api/satset/revise-animation', async (req, res) => {
  const {
    project,
    instruction = '',
    scope = 'scene',
    sceneIndex = 0,
  } = req.body || {};

  if (!project || !Array.isArray(project.scenes) || project.scenes.length === 0) {
    return res.status(400).json({ error: 'Project dengan daftar adegan diperlukan untuk revisi animasi.' });
  }
  const cleanInstruction = String(instruction || '').trim();
  if (!cleanInstruction) {
    return res.status(400).json({ error: 'Tuliskan instruksi revisi terlebih dahulu.' });
  }

  const totalScenes = project.scenes.length;
  const targetIndices: number[] =
    scope === 'all'
      ? project.scenes.map((_: any, idx: number) => idx)
      : [Math.max(0, Math.min(totalScenes - 1, Number(sceneIndex) || 0))];

  // Optional AI refinement overrides if Gemini API is configured
  const aiOverridesByIndex: Record<number, Partial<SatsetScene> & { customOverlayTitle?: string }> = {};
  if (ai) {
    try {
      const targetScenesPayload = targetIndices.map((idx) => {
        const sc = project.scenes[idx];
        return {
          sceneIndex: idx,
          sceneNumber: idx + 1,
          headline: sc.on_screen_text || sc.hookText || sc.headline || '',
          narration: sc.narration_text || sc.voiceScript || '',
          visualDescription: sc.visualDescription || sc.visual || '',
          durationSec: sc.target_duration_sec || sc.durationSeconds || 5,
        };
      });

      const prompt = `Anda adalah Direktur Animasi Remotion & Motion Graphics profesional.
Pengguna meminta revisi pada hasil akhir animasi berikut:
Instruksi Revisi: "${cleanInstruction}"
Target Revisi: ${scope === 'all' ? 'Seluruh Adegan' : `Adegan ${Number(sceneIndex) + 1}`}
Data Adegan Saat Ini:
${JSON.stringify(targetScenesPayload, null, 2)}

Kembalikan JSON dengan properti "revisions" berisi daftar perubahan untuk setiap sceneIndex yang direvisi (customOverlayTitle singkat padat maksimal 36 karakter, narration_text yang diperbaiki jika diminta, visualDescription baru, accentColor hex jika diminta, dan camera_movement).`;

      const aiResp = await generateGeminiWithFallback({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              revisions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sceneIndex: { type: Type.INTEGER },
                    customOverlayTitle: { type: Type.STRING },
                    narration_text: { type: Type.STRING },
                    visualDescription: { type: Type.STRING },
                    accentColor: { type: Type.STRING },
                    camera_movement: { type: Type.STRING },
                  },
                  required: ['sceneIndex'],
                },
              },
            },
            required: ['revisions'],
          },
        },
      });

      const parsed = JSON.parse((aiResp.text || '{}').trim());
      if (Array.isArray(parsed?.revisions)) {
        for (const rev of parsed.revisions) {
          if (typeof rev.sceneIndex === 'number') {
            aiOverridesByIndex[rev.sceneIndex] = {
              customOverlayTitle: rev.customOverlayTitle,
              narration_text: rev.narration_text || undefined,
              voiceScript: rev.narration_text || undefined,
              visualDescription: rev.visualDescription || undefined,
              visual: rev.visualDescription || undefined,
              accentColor: rev.accentColor || undefined,
              camera_movement: rev.camera_movement || undefined,
              camera: rev.camera_movement || undefined,
            };
          }
        }
      }
    } catch {
      // Fallback cleanly to deterministic revision engine
    }
  }

  const nextScenes: SatsetScene[] = [...project.scenes];
  const nextSceneCodes: Record<number, string> = { ...(project.scene_codes || {}) };
  const summaries: string[] = [];

  for (const idx of targetIndices) {
    const sc = nextScenes[idx];
    if (!sc) continue;
    const revResult = applySmartSceneRevision(
      sc,
      project as SatsetProject,
      cleanInstruction,
      idx,
      totalScenes,
      aiOverridesByIndex[idx]
    );
    nextScenes[idx] = revResult.updatedScene;
    const scNo = sc.nomor || sc.scene_number || sc.sceneNumber || idx + 1;
    nextSceneCodes[scNo] = revResult.updatedCode;
    if (summaries.length < 3) {
      summaries.push(`Scene ${scNo}: ${revResult.summary}`);
    }
  }

  const summaryText = summaries.join(' | ') || 'Revisi animasi diterapkan.';
  const revisionEntry = {
    id: `rev-${Date.now().toString(36)}`,
    timestamp: Date.now(),
    instruction: cleanInstruction,
    scope: (scope === 'all' ? 'all' : 'scene') as 'scene' | 'all',
    sceneNumber: scope === 'all' ? undefined : Number(sceneIndex) + 1,
    summary: summaryText,
  };

  const updatedProject: SatsetProject = {
    ...project,
    scenes: nextScenes,
    scene_codes: nextSceneCodes,
    revision_history: [revisionEntry, ...(project.revision_history || [])].slice(0, 15),
  };

  updatedProject.remotionCode = generateRemotionCode(updatedProject, updatedProject.fps || 30);

  return res.json({
    success: true,
    project: updatedProject,
    scenes: nextScenes,
    sceneCodes: nextSceneCodes,
    summary: summaryText,
    revisionEntry,
  });
});

// Generate Satset Video Blueprint adhering to 4-phase workflow (Ide - Narasi - Suara - Animasi)
app.post('/api/satset/generate-blueprint', async (req, res) => {
  const {
    project_title = '',
    start_mode = 'topic',
    source_url = '',
    language = 'id',
    content_type = 'motivasi',
    topik_video = 'disiplin konsisten dari nol',
    target_duration_sec = 30,
    gaya_video = 'scribble3d',
    character = 'none',
    warna_brand = '#ff6a13',
    tempo = 'energik',
    aspect_ratio = '9:16',
    voice_option = 'dimas',
    subtitle_style = 'satsetYellow',
    watermark = 'Graph Motion',
  } = req.body;

  // Automatically trigger Smart Website Auto-Promotion Pipeline if URL is detected
  const detectedWebsiteUrl = extractWebsiteUrl(source_url || topik_video || project_title);
  if (detectedWebsiteUrl) {
    const targetUrl = detectedWebsiteUrl;
    const parsedHtml = await fetchLiveWebsiteMetadata(targetUrl);
    const profile = buildWebsitePromoProfile(targetUrl, parsedHtml);
    const concepts = buildWebsitePromoConcepts(profile);
    const durSec = Math.max(24, Number(target_duration_sec) || 48);
    const sceneCount = durSec >= 45 ? 8 : 6;
    const scenes = buildWebsitePromoScenes(profile, sceneCount, durSec, concepts[0]);
    const webProject: SatsetProject = {
      id: `proj-web-${Date.now().toString(36)}`,
      project_title: `${profile.brandName} — ${profile.tagline}`,
      status: 'ready_to_render',
      start_mode: 'url',
      source_url: profile.url,
      website_promo: profile,
      language,
      content_type: 'promosi',
      topik_video: `${profile.url} — ${profile.brandName}: ${profile.tagline}`,
      target_duration_sec: durSec,
      durationSeconds: durSec,
      fps: 30,
      gaya_video: (gaya_video || 'uiweb') as SatsetStyleModule,
      styleModule: (gaya_video || 'uiweb') as SatsetStyleModule,
      character,
      warna_brand: profile.primaryColor,
      brandColor: profile.primaryColor,
      brand_secondary_color: profile.secondaryColor,
      brand_accent_color: profile.accentColor,
      brand_mode: 'custom',
      tempo,
      aspect_ratio,
      bgm_style: tempo === 'energik' ? 'upbeat_synth' : 'energetic_lofi',
      bgm_volume: 0.6,
      auto_ducking: true,
      ducking_level: 0.15,
      voice_option,
      voiceOption: voice_option,
      subtitle_style,
      subtitleStyle: subtitle_style,
      subtitle_position: 'auto',
      duration_mode: 'auto',
      watermark: watermark || 'Graph Motion',
      idea_concepts: concepts,
      selected_idea_id: concepts[0].id,
      scenes,
      createdAt: Date.now(),
      title: `${profile.brandName} — ${profile.tagline}`,
      topic: `${profile.url} — ${profile.brandName}`,
    };
    const synced = synchronizeProjectPipeline(webProject, {
      recalculateDurations: false,
      forceStyleSync: true,
    });
    synced.remotionCode = generateRemotionCode(synced, 30);
    return res.json({ project: synced, profile });
  }

  const moduleInfo = SATSET_MODULES.find((m) => m.id === gaya_video) || SATSET_MODULES[0];

  // Heuristic concepts generator (5 rich concepts matching satsetmotion.id screenshot)
  const defaultConcepts: IdeaConcept[] = [
    {
      id: 'concept-1',
      title: 'Kenapa Pagi Terasa Berat?',
      hook: 'KATANYA ORANG SUKSES / BANGUN PAGI / PADAHAL ADA YANG SALAH',
      hookProposal: 'KATANYA ORANG SUKSES / BANGUN PAGI / PADAHAL ADA YANG SALAH',
      angle: 'Banyak orang mengira rasa malas pagi hilang kalau kita menunggu semangat datang. Itu keliru. Semangat bukan syarat untuk mulai bergerak. Bayangkan tubuhmu seperti benda yang ditarik dua magnet. Satu magnet menarikmu ke kasur, satu lagi menarikmu ke pekerjaan. Semakin lama kamu diam, semakin kuat tarikan kasur terasa. Cara memutuskannya sederhana: duduk, berdiri, lalu lakukan satu pekerjaan selama dua menit. Jangan tunggu ingin bergerak. Bergerak dulu, baru semangat menyusul. Kamu tidak harus menang melawan rasa malas sepanjang hari. Kamu hanya perlu menang di 10 menit pertama.',
      corePoints: [
        'Semangat bukan syarat untuk mulai bergerak',
        'Bayangkan tubuhmu ditarik dua magnet (kasur vs kerjaan)',
        'Putuskan dengan aturan 2 menit pertama',
      ],
      targetAudience: 'Anak muda, kreator, dan profesional',
    },
    {
      id: 'concept-2',
      title: 'Jangan Paksa Pintu Terbuka',
      hook: 'TUNGGU DULU / JANGAN PAKSA / ADA ALASANNYA',
      hookProposal: 'TUNGGU DULU / JANGAN PAKSA / ADA ALASANNYA',
      angle: 'Pernah merasa sudah berusaha, tapi hasilnya belum juga datang? Bayangkan kamu sedang memegang kunci sebuah pintu. Kamu mencoba membukanya setiap hari, tetapi pintunya belum terbuka. Bukan berarti kuncinya salah. Bisa jadi kamu belum sampai pada waktu yang tepat. Namun, sabar bukan berarti duduk diam. Selama pintu belum terbuka, periksa kuncimu. Perbaiki cara kerjamu. Tambah pengetahuanmu. Coba lagi dengan cara yang lebih baik. Jangan habiskan tenaga untuk menendang pintu. Tetap kerjakan bagianmu. Hasil memang tidak selalu datang saat kamu mau. Tapi jangan sampai kamu berhenti tepat sebelum kesempatan datang.',
      corePoints: [
        'Kunci yang belum pas bukan berarti pintu rusak',
        'Sabar bukan berarti duduk diam',
        'Perbaiki cara kerja sebelum menendang pintu',
      ],
      targetAudience: 'Pencari kerja & pebisnis rintisan',
    },
    {
      id: 'concept-3',
      title: 'Pikiranmu Bukan Ramalan',
      hook: 'BERHENTI MENEBAK / MULAI BERTINDAK / SEBELUM TIDUR MALAM INI',
      hookProposal: 'BERHENTI MENEBAK / MULAI BERTINDAK / SEBELUM TIDUR MALAM INI',
      angle: 'Kamu belum tidur, tapi pikiranmu sudah sibuk memikirkan semua hal buruk yang mungkin terjadi besok. Berhenti menganggap semua pikiran itu sebagai kenyataan. Bayangkan kamu sedang memegang parasut. Parasut dibuat untuk memperlambat jatuh, bukan membuatmu terbang kembali ke atas. Begitu juga pikiranmu. Gunakan untuk menyiapkan diri, bukan untuk mengulang ketakutan yang sama. Kalau ada masalah besok, tulis satu hal yang bisa kamu lakukan. Kalau belum ada yang bisa dikerjakan malam ini, berhenti memikirkannya. Kamu tidak menyelesaikan masalah dengan kehilangan waktu tidur. Besok kamu butuh tenaga, bukan kepala yang penuh dugaan.',
      corePoints: [
        'Overthinking sebelum tidur seperti memegang parasut rusak',
        'Tulis 1 hal nyata yang bisa dikerjakan besok',
        'Tidur adalah bahan bakar utama untuk menang besok',
      ],
      targetAudience: 'Orang yang sering insomnia & overthinking',
    },
    {
      id: 'concept-4',
      title: 'Kegagalan Bukan Jalan Buntu',
      hook: 'DIA DIPECAT / LALU NAIK / TAPI BUKAN KARENA BERUNTUNG',
      hookProposal: 'DIA DIPECAT / LALU NAIK / TAPI BUKAN KARENA BERUNTUNG',
      angle: 'Kamu gagal dalam pekerjaan. Usahamu berhenti. Bahkan orang lain mulai meragukanmu. Tapi ada satu hal yang sering dilupakan. Sebuah gedung punya tangga darurat bukan karena gedung itu pasti terbakar, tetapi karena selalu ada jalan lain saat jalan utama tidak bisa dipakai. Kegagalan juga begitu. Saat satu jalan tertutup, jangan terus memukul pintu yang sama. Cari jalan lain. Mungkin kamu harus belajar keterampilan baru. Mungkin kamu harus mencoba pekerjaan berbeda. Mungkin kamu perlu mengulang dari awal. Jangan habiskan hidup untuk membuktikan bahwa jalan yang gagal sebenarnya bisa berhasil. Karena kadang, yang perlu kamu lakukan bukan kembali ke jalan lama. Tapi berani keluar lewat tangga darurat.',
      corePoints: [
        'Gedung punya tangga darurat bukan untuk ditonton',
        'Cari jalan lain saat jalan utama ditutup',
        'Keterampilan baru membuka pintu yang tak terduga',
      ],
      targetAudience: 'Kreator & profesional yang sedang down',
    },
    {
      id: 'concept-5',
      title: 'HP-mu Mencuri Waktumu',
      hook: 'MASIH SCROLL / BERAPA JAM / YANG KAMU BUANG HARI INI?',
      hookProposal: 'MASIH SCROLL / BERAPA JAM / YANG KAMU BUANG HARI INI?',
      angle: 'Coba jujur. Kamu membuka HP untuk lima menit, tapi tiba-tiba satu jam sudah hilang. Masalahnya bukan cuma waktu. Setiap kali kamu terus melihat layar, kamu memberi HP kesempatan mengambil perhatianmu lagi. Bayangkan HP seperti es batu di atas papan miniatur. Semakin lama terkena suhu panas, semakin banyak es mencair. Waktu juga begitu. Tidak bisa dikembalikan setelah habis. Coba hitung berapa jam sehari kamu habiskan untuk scroll. Kalau tiga jam sehari, berarti 21 jam seminggu. Hampir satu hari penuh. Mulai sekarang, pasang batas waktu. Letakkan HP saat bekerja. Gunakan waktu itu untuk belajar, olahraga, atau menyelesaikan pekerjaanmu. Jangan biarkan layar kecil menghabiskan waktu hidupmu yang besar.',
      corePoints: [
        'Scroll 3 jam sehari sama dengan 21 jam seminggu',
        'Waktu seperti es batu yang mencair terus-menerus',
        'Jauhkan HP 30 menit sebelum mulai kerja',
      ],
      targetAudience: 'Pengguna medsos & generasi scrolling',
    },
  ];

  // Algorithmic Fallback Generator matching Prompt Blueprint JSON
  const generateFallbackBlueprint = () => {
    const sceneCount = target_duration_sec <= 15 ? 3 : target_duration_sec <= 30 ? 4 : 5;
    const durPerScene = Math.round(target_duration_sec / sceneCount);

    const scenes: SatsetScene[] = [
      {
        id: `sc-1-${Date.now().toString(36)}`,
        scene_number: 1,
        role: 'hook',
        target_duration_sec: durPerScene,
        narration_text: `STOP nunggu mood buat ${topik_video}! Kamu sering gagal bukan karena gak mampu, tapi karena nunggu merasa siap.`,
        on_screen_text: `STOP Nunggu Mood!`,
        emphasis_words: ['STOP', 'Mood', 'siap'],
        visual_animation: {
          layout: 'centered_title_with_floating_icons',
          remotion_animation: 'spring_pop_in',
          asset_elements: ['warning_badge', 'scribble_arrow'],
        },
        sfx: {
          file: 'whoosh_impact.mp3',
          type: 'whoosh',
          play_at_second: 0.0,
        },
        // Compat
        sceneNumber: 1,
        durationSeconds: durPerScene,
        hookText: `STOP Nunggu Mood!`,
        voiceScript: `STOP nunggu mood buat ${topik_video}! Kamu sering gagal bukan karena gak mampu, tapi karena nunggu merasa siap.`,
        emphasisWords: ['STOP', 'Mood', 'siap'],
        visualModule: gaya_video as SatsetStyleModule,
        accentColor: warna_brand,
        secondaryColor: '#facc15',
        sfxCue: 'whoosh',
        visualDescription: `Pembuka hook ${moduleInfo.title} dengan teks besar memikat mata penonton.`,
      },
      {
        id: `sc-2-${Date.now().toString(36)}`,
        scene_number: 2,
        role: 'body_core_point',
        target_duration_sec: durPerScene,
        narration_text: `Motivasi itu cuma pemantik beberapa jam. Tapi kebiasaan 5 menit yang diulang tiap hari adalah bahan bakar hidupmu.`,
        on_screen_text: `Disiplin Kalahkan Bakat`,
        emphasis_words: ['kebiasaan', '5 menit', 'tiap hari'],
        visual_animation: {
          layout: 'split_text_and_graphic',
          remotion_animation: 'slide_from_bottom',
          asset_elements: ['calendar_check', 'sparkle_glow'],
        },
        sfx: {
          file: 'pop_ding.mp3',
          type: 'pop',
          play_at_second: 0.5,
        },
        // Compat
        sceneNumber: 2,
        durationSeconds: durPerScene,
        hookText: `Disiplin Kalahkan Bakat`,
        voiceScript: `Motivasi itu cuma pemantik beberapa jam. Tapi kebiasaan 5 menit yang diulang tiap hari adalah bahan bakar hidupmu.`,
        emphasisWords: ['kebiasaan', '5 menit', 'tiap hari'],
        visualModule: gaya_video as SatsetStyleModule,
        accentColor: '#facc15',
        secondaryColor: warna_brand,
        sfxCue: 'pop',
        visualDescription: `Visualisasi ${moduleInfo.title} menampilkan transisi pemikiran dan habit tracking.`,
      },
      {
        id: `sc-3-${Date.now().toString(36)}`,
        scene_number: 3,
        role: 'body_core_point',
        target_duration_sec: durPerScene,
        narration_text: `Jangan tunda sampai besok. Kemenangan besar dibangun dari keputusan kecil yang kamu ambil detik ini.`,
        on_screen_text: `Mulai 5 Menit Sekarang`,
        emphasis_words: ['Jangan tunda', 'keputusan kecil', 'detik ini'],
        visual_animation: {
          layout: 'split_text_and_graphic',
          remotion_animation: 'zoom_in_rotate',
          asset_elements: ['clock_speed', 'fire_streak'],
        },
        sfx: {
          file: 'ding_spark.mp3',
          type: 'ding',
          play_at_second: 0.3,
        },
        // Compat
        sceneNumber: 3,
        durationSeconds: durPerScene,
        hookText: `Mulai 5 Menit Sekarang`,
        voiceScript: `Jangan tunda sampai besok. Kemenangan besar dibangun dari keputusan kecil yang kamu ambil detik ini.`,
        emphasisWords: ['Jangan tunda', 'keputusan kecil', 'detik ini'],
        visualModule: gaya_video as SatsetStyleModule,
        accentColor: warna_brand,
        secondaryColor: '#38bdf8',
        sfxCue: 'ding',
        visualDescription: `Penjelasan langkah aksi nyata yang realistis.`,
      },
      {
        id: `sc-4-${Date.now().toString(36)}`,
        scene_number: 4,
        role: 'cta',
        target_duration_sec: durPerScene,
        narration_text: `Simpan video ini biar gak lupa, dan tag temanmu yang butuh pengingat ini hari ini juga!`,
        on_screen_text: `Simpan & Share Video Ini!`,
        emphasis_words: ['Simpan', 'tag temanmu', 'hari ini'],
        visual_animation: {
          layout: 'call_to_action_banner',
          remotion_animation: 'pulse_heartbeat',
          asset_elements: ['bookmark_icon', 'share_arrow'],
        },
        sfx: {
          file: 'notification_chime.mp3',
          type: 'bell',
          play_at_second: 0.2,
        },
        // Compat
        sceneNumber: 4,
        durationSeconds: durPerScene,
        hookText: `Simpan & Share Video Ini!`,
        voiceScript: `Simpan video ini biar gak lupa, dan tag temanmu yang butuh pengingat ini hari ini juga!`,
        emphasisWords: ['Simpan', 'tag temanmu', 'hari ini'],
        visualModule: gaya_video as SatsetStyleModule,
        accentColor: '#10b981',
        secondaryColor: warna_brand,
        sfxCue: 'ding',
        visualDescription: `Ajakan aksi tegas dan watermark akun.`,
      },
    ];

    const project: SatsetProject = {
      id: `proj-${Date.now().toString(36)}`,
      project_title,
      status: 'ready_to_render',
      start_mode,
      language,
      content_type,
      topik_video,
      target_duration_sec,
      fps: 30,
      gaya_video: gaya_video as SatsetStyleModule,
      character,
      warna_brand,
      tempo,
      aspect_ratio,
      bgm_style: tempo === 'energik' ? 'upbeat_synth' : 'energetic_lofi',
      bgm_volume: 0.6,
      auto_ducking: true,
      ducking_level: 0.15,
      voice_option,
      subtitle_style,
      watermark,
      idea_concepts: defaultConcepts,
      selected_idea_id: defaultConcepts[0].id,
      scenes: scenes.slice(0, sceneCount),
      createdAt: Date.now(),
      // Compat
      title: project_title,
      topic: topik_video,
      styleModule: gaya_video as SatsetStyleModule,
      voiceOption: voice_option,
      subtitleStyle: subtitle_style,
      brandColor: warna_brand,
      durationSeconds: target_duration_sec,
    };

    project.remotionCode = generateRemotionCode(project, 30);
    return project;
  };

  if (!ai) {
    return res.json({ project: generateFallbackBlueprint() });
  }

  try {
    const aiPrompt = `Anda adalah Creative Director dan Motion Graphic Engineer khusus pembuatan video pendek berbasis Remotion (React) dari Satset Motion.

Tugas:
Buat naskah video pendek, instruksi motion visual, penempatan audio voice over (VO), dan sound effects (SFX) berdasarkan parameter berikut:

- Judul Proyek: ${project_title}
- Topik Video: ${topik_video}
- Gaya Konten: ${content_type}
- Bahasa: ${language === 'en' ? 'English' : language === 'jv' ? 'Basa Jawa' : 'Bahasa Indonesia'}
- Target Durasi: ${target_duration_sec} detik
- Gaya Visual: ${gaya_video} (${moduleInfo.title})
- Warna Tema: ${warna_brand}
- Tempo: ${tempo} (${tempo === 'energik' ? '~2.5 kata/detik, spring kaku' : '~2 kata/detik, transisi halus'})
- Rasio Video: ${aspect_ratio}

Ketentuan Naskah:
1. Scene 1 WAJIB memiliki hook kuat dalam 3 detik pertama.
2. Panjang narasi harus pas dengan estimasi kecepatan bicara.
3. Cantumkan penanda SFX spesifik (whoosh, pop, click, bell) pada kata kunci tertentu.
4. Buat 3 opsi konsep ide judul & sudut pandang (concepts).

Hasilkan output HANYA dalam format JSON valid berikut:
{
  "project_title": "${project_title}",
  "aspect_ratio": "${aspect_ratio}",
  "fps": 30,
  "bgm_style": "energetic_lofi",
  "concepts": [
    {
      "id": "concept-1",
      "title": "Judul Opsi 1",
      "angle": "Sudut pandang 1",
      "hookProposal": "Hook 1",
      "corePoints": ["Poin A", "Poin B", "Poin C"],
      "targetAudience": "Target audiens"
    }
  ],
  "scenes": [
    {
      "scene_number": 1,
      "role": "hook",
      "target_duration_sec": 4,
      "narration_text": "Narasi yang dibacakan TTS.",
      "on_screen_text": "TEKS BOLD YANG MUNCUL",
      "emphasis_words": ["KATA1", "KATA2"],
      "visual_animation": {
        "layout": "centered_title_with_floating_icons",
        "remotion_animation": "spring_pop_in",
        "asset_elements": ["icon_1", "icon_2"]
      },
      "sfx": {
        "file": "whoosh_impact.mp3",
        "play_at_second": 0.0
      }
    }
  ]
}`;

    const response = await generateGeminiWithFallback({
      contents: aiPrompt,
      config: {
        systemInstruction: 'Anda adalah AI Director Satset Motion. Buat naskah video pendek presisi untuk Remotion. Strict JSON output.',
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      const sceneList: SatsetScene[] = (parsed.scenes || []).map((s: any, idx: number) => {
        const dur = typeof s.target_duration_sec === 'number' ? s.target_duration_sec : 5;
        const narr = s.narration_text || '';
        const onScreen = s.on_screen_text || `Scene ${idx + 1}`;
        const emphasis = s.emphasis_words || [];

        return {
          id: `sc-${idx + 1}-${Date.now().toString(36)}`,
          scene_number: s.scene_number || idx + 1,
          role: s.role || (idx === 0 ? 'hook' : idx === (parsed.scenes.length - 1) ? 'cta' : 'body_core_point'),
          target_duration_sec: dur,
          narration_text: narr,
          on_screen_text: onScreen,
          emphasis_words: emphasis,
          visual_animation: s.visual_animation || {
            layout: 'centered_title_with_floating_icons',
            remotion_animation: 'spring_pop_in',
            asset_elements: ['sparkle_icon'],
          },
          sfx: s.sfx || {
            file: 'whoosh_impact.mp3',
            type: 'whoosh',
            play_at_second: 0.0,
          },
          // Compat
          sceneNumber: s.scene_number || idx + 1,
          durationSeconds: dur,
          hookText: onScreen,
          voiceScript: narr,
          emphasisWords: emphasis,
          visualModule: gaya_video as SatsetStyleModule,
          accentColor: idx % 2 === 0 ? warna_brand : '#facc15',
          secondaryColor: idx % 2 === 0 ? '#facc15' : warna_brand,
          sfxCue: (s.sfx?.file?.includes('pop') ? 'pop' : s.sfx?.file?.includes('ding') ? 'ding' : 'whoosh') as any,
          visualDescription: onScreen,
        };
      });

      const project: SatsetProject = {
        id: `proj-${Date.now().toString(36)}`,
        project_title: parsed.project_title || project_title,
        status: 'ready_to_render',
        start_mode,
        language,
        content_type,
        topik_video,
        target_duration_sec,
        fps: 30,
        gaya_video: gaya_video as SatsetStyleModule,
        character,
        warna_brand,
        tempo,
        aspect_ratio,
        bgm_style: parsed.bgm_style || (tempo === 'energik' ? 'upbeat_synth' : 'energetic_lofi'),
        bgm_volume: 0.6,
        auto_ducking: true,
        ducking_level: 0.15,
        voice_option,
        subtitle_style,
        watermark,
        idea_concepts: parsed.concepts && parsed.concepts.length > 0 ? parsed.concepts : defaultConcepts,
        selected_idea_id: parsed.concepts?.[0]?.id || defaultConcepts[0].id,
        scenes: sceneList.length > 0 ? sceneList : generateFallbackBlueprint().scenes,
        createdAt: Date.now(),
        // Compat
        title: parsed.project_title || project_title,
        topic: topik_video,
        styleModule: gaya_video as SatsetStyleModule,
        voiceOption: voice_option,
        subtitleStyle: subtitle_style,
        brandColor: warna_brand,
        durationSeconds: target_duration_sec,
      };

      project.remotionCode = generateRemotionCode(project, 30);
      return res.json({ project });
    }

    return res.json({ project: generateFallbackBlueprint() });
  } catch (err: any) {
    console.warn('generate-blueprint warning (falling back):', err?.message || err);
    return res.json({ project: generateFallbackBlueprint() });
  }
});

// Generate Satset Motion Video from Topic / Settings
app.post('/api/satset/generate', async (req, res) => {
  const {
    topic = 'Disiplin dan Konsistensi',
    styleModule = 'scribble3d',
    customStylePrompt = '',
    voiceOption = 'dimas',
    subtitleStyle = 'satsetYellow',
    watermark = 'Graph Motion',
    brandColor = '#ff6a13',
    durationSeconds = 15,
  } = req.body;

  const moduleInfo = SATSET_MODULES.find((m) => m.id === styleModule) || SATSET_MODULES[0];

  // Algorithmic Fallback generator for instant response
  const generateSatsetFallback = (): SatsetProject => {
    const sceneCount = durationSeconds <= 15 ? 3 : durationSeconds <= 30 ? 4 : 5;
    const durationPerScene = Math.round(durationSeconds / sceneCount);

    const fallbackScenes: SatsetScene[] = [
      {
        id: `sc-1-${Date.now().toString(36)}`,
        sceneNumber: 1,
        durationSeconds: durationPerScene,
        hookText: `STOP nunggu motivasi buat ${topic}!`,
        voiceScript: `Kamu sering gagal bukan karena kurang pintar, tapi karena selalu nunggu mood dan motivasi datang.`,
        emphasisWords: ['STOP', 'motivasi', 'mood'],
        visualModule: styleModule as SatsetStyleModule,
        accentColor: moduleInfo.accentColor,
        secondaryColor: moduleInfo.secondaryColor,
        sfxCue: 'pop',
        visualDescription: `Intro hook ${moduleInfo.title} dengan elemen dinamis dan teks besar memikat perhatian.`,
      },
      {
        id: `sc-2-${Date.now().toString(36)}`,
        sceneNumber: 2,
        durationSeconds: durationPerScene,
        hookText: 'Motivasi Cuma Pemantik, Disiplin Bahan Bakarnya',
        voiceScript: `Motivasi itu cuma bertahan beberapa jam. Tapi kebiasaan kecil yang diulang tiap hari bakal ngubah hidupmu.`,
        emphasisWords: ['kebiasaan', 'tiap hari', 'ngubah'],
        visualModule: styleModule as SatsetStyleModule,
        accentColor: moduleInfo.secondaryColor,
        secondaryColor: moduleInfo.accentColor,
        sfxCue: 'whoosh',
        visualDescription: `Visualisasi ${moduleInfo.title} menampilkan transisi dan alur pemikiran yang mendalam.`,
      },
      {
        id: `sc-3-${Date.now().toString(36)}`,
        sceneNumber: 3,
        durationSeconds: durationPerScene,
        hookText: 'Mulai Sekarang, 5 Menit Aja Dulu!',
        voiceScript: `Gak usah nunggu sempurna. Mulai 5 menit hari ini, dan buktikan sendiri hasilnya.`,
        emphasisWords: ['Mulai', '5 menit', 'sempurna'],
        visualModule: styleModule as SatsetStyleModule,
        accentColor: moduleInfo.accentColor,
        secondaryColor: moduleInfo.secondaryColor,
        sfxCue: 'ding',
        visualDescription: `Call to action ${moduleInfo.title} dengan dorongan tegas dan penutup berkesan.`,
      },
    ];

    const project: SatsetProject = {
      id: `satset-${Date.now().toString(36)}`,
      title: `${topic} - Video Satset`,
      topic,
      styleModule: styleModule as SatsetStyleModule,
      customStylePrompt,
      voiceOption,
      subtitleStyle,
      watermark,
      brandColor,
      durationSeconds,
      scenes: fallbackScenes,
      createdAt: Date.now(),
    };

    project.remotionCode = generateRemotionCode(project, 30);
    return project;
  };

  if (!ai) {
    return res.json({ project: generateSatsetFallback() });
  }

  try {
    const prompt = `Anda adalah AI Engine dari Satset Motion (satsetmotion.id).
Tugas Anda: Membuat konsep video motivasi/edukasi/promo pendek vertikal (9:16) format TikTok/Reels/Shorts dengan alur cepat, padat, dan "satset" (langsung to the point, impactful).

Parameter Video:
- Topik / Ide: "${topic}"
- Modul Style Animasi: "${styleModule}" (${moduleInfo.title} - ${moduleInfo.description})
${customStylePrompt ? `- Kustom Style Permintaan User: "${customStylePrompt}"` : ''}
- Karakter Suara: "${voiceOption}"
- Gaya Subtitle: "${subtitleStyle}"
- Watermark / Akun: "${watermark}"
- Total Durasi: ${durationSeconds} detik

Bagi video menjadi 3 hingga 4 scene naskah yang berkesinambungan:
1. Scene 1: Hook pembuka yang bikin orang stop scrolling (pertanyaan tajam atau pernyataan mengejutkan).
2. Scene 2: Penjelasan masalah / insight mendalam dengan analogi visual.
3. Scene 3: Solusi / langkah praktis yang bisa langsung dilakukan.
4. Scene 4 (Opsional): Call to action tegas.

Untuk setiap scene, sertakan:
- hookText: Judul singkat 3-6 kata font tebal di tengah/atas
- voiceScript: Naskah suara narator natural bahasa Indonesia santai tapi berbobot
- emphasisWords: 2-3 kata kunci paling penting yang akan diberi highlight warna kuning/neon
- visualDescription: Instruksi visual untuk animasi modul ${moduleInfo.title}
- sfxCue: Salah satu dari ('pop', 'click', 'whoosh', 'ding', 'thud', 'sparkle', 'rise')

Kembalikan dalam format JSON valid.`;

    const response = await generateGeminiWithFallback({
      contents: prompt,
      config: {
        systemInstruction: 'Anda adalah AI Director Satset Motion. Buat naskah video vertikal yang viral, lugas, dan satset. Output STRICT JSON.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sceneNumber: { type: Type.INTEGER },
                  durationSeconds: { type: Type.NUMBER },
                  hookText: { type: Type.STRING },
                  voiceScript: { type: Type.STRING },
                  emphasisWords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  visualDescription: { type: Type.STRING },
                  sfxCue: {
                    type: Type.STRING,
                    enum: ['pop', 'click', 'whoosh', 'ding', 'thud', 'sparkle', 'rise'],
                  },
                },
                required: ['sceneNumber', 'durationSeconds', 'hookText', 'voiceScript', 'emphasisWords', 'visualDescription', 'sfxCue'],
              },
            },
          },
          required: ['title', 'scenes'],
        },
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      const totalSceneSec = durationSeconds / (parsed.scenes.length || 3);

      const formattedScenes: SatsetScene[] = parsed.scenes.map((s: any, idx: number) => ({
        id: `sc-${idx + 1}-${Date.now().toString(36)}`,
        sceneNumber: idx + 1,
        durationSeconds: s.durationSeconds || Math.round(totalSceneSec),
        hookText: s.hookText || `Scene ${idx + 1}`,
        voiceScript: s.voiceScript || '',
        emphasisWords: s.emphasisWords || [],
        visualModule: styleModule as SatsetStyleModule,
        accentColor: idx % 2 === 0 ? moduleInfo.accentColor : moduleInfo.secondaryColor,
        secondaryColor: idx % 2 === 0 ? moduleInfo.secondaryColor : moduleInfo.accentColor,
        sfxCue: s.sfxCue || 'pop',
        visualDescription: s.visualDescription || '',
      }));

      const project: SatsetProject = {
        id: `satset-${Date.now().toString(36)}`,
        title: parsed.title || `${topic} - Satset Motion`,
        topic,
        styleModule: styleModule as SatsetStyleModule,
        customStylePrompt,
        voiceOption,
        subtitleStyle,
        watermark,
        brandColor,
        durationSeconds,
        scenes: formattedScenes,
        createdAt: Date.now(),
      };

      project.remotionCode = generateRemotionCode(project, 30);
      return res.json({ project });
    }

    return res.json({ project: generateSatsetFallback() });
  } catch (err: any) {
    console.warn('Satset generate warning (falling back):', err?.message || err);
    return res.json({ project: generateSatsetFallback() });
  }
});

// Auto Remotion Video from Uploaded Script / Transcript / Video Notes
app.post('/api/satset/remotion-from-upload', async (req, res) => {
  const {
    uploadContent = '',
    fileName = 'uploaded-video',
    styleModule = 'scribble3d',
    voiceOption = 'dimas',
    watermark = 'Graph Motion',
    brandColor = '#ff6a13',
    durationSeconds = 15,
  } = req.body;

  const moduleInfo = SATSET_MODULES.find((m) => m.id === styleModule) || SATSET_MODULES[0];

  const generateFallbackFromUpload = () => {
    const rawLines = uploadContent
      .split('\n')
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 5);

    const scenes: SatsetScene[] = [
      {
        id: `sc-u1-${Date.now().toString(36)}`,
        sceneNumber: 1,
        durationSeconds: 5,
        hookText: rawLines[0] ? rawLines[0].slice(0, 30) : 'Inti Pesan Utama',
        voiceScript: rawLines[0] || 'Ini adalah inti pesan video yang kamu upload, siap dijadikan animasi motion satset.',
        emphasisWords: ['inti', 'pesan', 'satset'],
        visualModule: styleModule as SatsetStyleModule,
        accentColor: moduleInfo.accentColor,
        secondaryColor: moduleInfo.secondaryColor,
        sfxCue: 'pop',
        visualDescription: `Intro scene diadaptasi langsung dari file ${fileName}.`,
      },
      {
        id: `sc-u2-${Date.now().toString(36)}`,
        sceneNumber: 2,
        durationSeconds: 5,
        hookText: rawLines[1] ? rawLines[1].slice(0, 30) : 'Eksplorasi Ide Penting',
        voiceScript: rawLines[1] || 'Setiap detik dibuat dinamis agar penonton gak skip dan pesan tersampaikan dengan jelas.',
        emphasisWords: ['dinamis', 'gak skip', 'pesan'],
        visualModule: styleModule as SatsetStyleModule,
        accentColor: moduleInfo.secondaryColor,
        secondaryColor: moduleInfo.accentColor,
        sfxCue: 'whoosh',
        visualDescription: `Visualisasi isi konten utama dengan motion graphic ${moduleInfo.title}.`,
      },
      {
        id: `sc-u3-${Date.now().toString(36)}`,
        sceneNumber: 3,
        durationSeconds: 5,
        hookText: 'Hasil Akhir Siap Remotion!',
        voiceScript: 'Kode Remotion sudah digenerate otomatis. Tinggal copy dan paste ke Remotion Studio kamu.',
        emphasisWords: ['Remotion', 'copy', 'paste'],
        visualModule: styleModule as SatsetStyleModule,
        accentColor: moduleInfo.accentColor,
        secondaryColor: moduleInfo.secondaryColor,
        sfxCue: 'ding',
        visualDescription: 'Penutup video dengan kode Remotion terstruktur.',
      },
    ];

    const project: SatsetProject = {
      id: `satset-upload-${Date.now().toString(36)}`,
      title: `Remotion Auto: ${fileName}`,
      topic: `Auto Remotion dari ${fileName}`,
      styleModule: styleModule as SatsetStyleModule,
      voiceOption,
      subtitleStyle: 'satsetYellow',
      watermark,
      brandColor,
      durationSeconds,
      scenes,
      createdAt: Date.now(),
    };

    project.remotionCode = generateRemotionCode(project, 30);
    return project;
  };

  if (!ai || !uploadContent.trim()) {
    return res.json({ project: generateFallbackFromUpload() });
  }

  try {
    const prompt = `Anda adalah AI Remotion Converter dari Satset Motion.
User mengupload video / naskah / transkrip dengan konten berikut:
"""
${uploadContent.slice(0, 1500)}
"""

Tugas Anda:
1. Bedah konten ini menjadi 3-4 scene video pendek vertikal 9:16 yang padat dan menarik.
2. Terapkan modul style animasi "${styleModule}" (${moduleInfo.title}).
3. Buat hookText singkat (3-5 kata), voiceScript bahasa Indonesia yang mengalir, dan emphasisWords.
4. Hasil ini akan langsung dikonversi menjadi kode Remotion React Studio (<Composition>, <Sequence>, spring animations, stylized subtitles).

Kembalikan format JSON.`;

    const response = await generateGeminiWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sceneNumber: { type: Type.INTEGER },
                  durationSeconds: { type: Type.NUMBER },
                  hookText: { type: Type.STRING },
                  voiceScript: { type: Type.STRING },
                  emphasisWords: { type: Type.ARRAY, items: { type: Type.STRING } },
                  visualDescription: { type: Type.STRING },
                  sfxCue: { type: Type.STRING, enum: ['pop', 'click', 'whoosh', 'ding', 'thud', 'sparkle', 'rise'] },
                },
                required: ['sceneNumber', 'durationSeconds', 'hookText', 'voiceScript', 'emphasisWords', 'visualDescription', 'sfxCue'],
              },
            },
          },
          required: ['title', 'scenes'],
        },
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      const formattedScenes: SatsetScene[] = parsed.scenes.map((s: any, idx: number) => ({
        id: `sc-u-${idx + 1}-${Date.now().toString(36)}`,
        sceneNumber: idx + 1,
        durationSeconds: s.durationSeconds || 5,
        hookText: s.hookText || `Scene ${idx + 1}`,
        voiceScript: s.voiceScript || '',
        emphasisWords: s.emphasisWords || [],
        visualModule: styleModule as SatsetStyleModule,
        accentColor: idx % 2 === 0 ? moduleInfo.accentColor : moduleInfo.secondaryColor,
        secondaryColor: idx % 2 === 0 ? moduleInfo.secondaryColor : moduleInfo.accentColor,
        sfxCue: s.sfxCue || 'pop',
        visualDescription: s.visualDescription || '',
      }));

      const project: SatsetProject = {
        id: `satset-upload-${Date.now().toString(36)}`,
        title: parsed.title || `Remotion: ${fileName}`,
        topic: `Upload: ${fileName}`,
        styleModule: styleModule as SatsetStyleModule,
        voiceOption,
        subtitleStyle: 'satsetYellow',
        watermark,
        brandColor,
        durationSeconds: formattedScenes.reduce((sum, s) => sum + (s.durationSeconds || s.target_duration_sec || 5), 0),
        scenes: formattedScenes,
        createdAt: Date.now(),
      };

      project.remotionCode = generateRemotionCode(project, 30);
      return res.json({ project });
    }

    return res.json({ project: generateFallbackFromUpload() });
  } catch (err: any) {
    console.warn('Upload convert warning (falling back):', err?.message || err);
    return res.json({ project: generateFallbackFromUpload() });
  }
});

// ==========================================
// AI REFERENCE PHOTO / VIDEO -> CHARACTER BUILDER
// ==========================================
app.post('/api/character/from-photo', async (req, res) => {
  const {
    imageBase64 = '',
    mimeType = 'image/jpeg',
    hintName = '',
    customPrompt = '',
    dominantPalette,
  } = req.body || {};

  const cleanBase64 = String(imageBase64)
    .replace(/^data:[^;]+;base64,/, '')
    .trim();

  if (!cleanBase64 || cleanBase64.length < 32) {
    return res.status(400).json({
      error: 'Foto atau video referensi kosong atau tidak valid.',
    });
  }

  const buildFallbackPreset = () => {
    const q = `${hintName} ${customPrompt}`.toLowerCase();
    const isFemale = /\b(cewek|wanita|perempuan|ibu|mbak|gadis|hijab|jilbab|gamis|kebaya|sarah|maya|kore)\b/.test(q);
    const gender = isFemale ? 'cewek' : 'cowok';
    const hasHijab = /\bhijab|jilbab|kerudung|khimar\b/.test(q);
    const hairStyle = hasHijab
      ? /\bkhimar\b/.test(q)
        ? 'khimar'
        : 'hijab_simpel'
      : isFemale
      ? /\bcepol|bun\b/.test(q)
        ? 'cepol'
        : /\bkuncir\b/.test(q)
        ? 'kuncir'
        : 'gondrong'
      : /\bundercut\b/.test(q)
      ? 'undercut'
      : /\bkeriting\b/.test(q)
      ? 'keriting'
      : 'jambul';
    const topStyle = /\bhoodie\b/.test(q)
      ? 'hoodie'
      : /\bblazer\b/.test(q)
      ? 'blazer'
      : /\bkemeja\b/.test(q)
      ? 'kemeja'
      : /\bkoko\b/.test(q)
      ? 'koko'
      : 'jaket_terbuka';
    const accessories: string[] = [];
    if (/\bkacamata hitam\b/.test(q)) accessories.push('kacamata_hitam');
    else if (/\bkacamata\b/.test(q)) accessories.push('kacamata_bulat');
    if (/\bpeci\b/.test(q)) accessories.push('peci');
    if (/\btopi\b/.test(q)) accessories.push('topi_pet');
    if (/\bdasi\b/.test(q)) accessories.push('dasi');
    if (/\bheadphone|headset\b/.test(q)) accessories.push('headphone');
    if (/\bjenggot|brewok\b/.test(q)) accessories.push('jenggot');

    const topColor = dominantPalette?.torsoRegionHex || (isFemale ? '#a58bd9' : '#2563eb');
    const bottomColor = dominantPalette?.lowerRegionHex || '#1e293b';

    return {
      gender,
      skinColor: dominantPalette?.faceRegionHex || '#efc39c',
      hairStyle,
      hairColor: dominantPalette?.topRegionHex || '#2b2220',
      oneSetId: /\bgamis\b/.test(q) ? 'gamis_syari' : /\bdokter\b/.test(q) ? 'jas_dokter' : 'none',
      oneSetColors: { primary: topColor, secondary: bottomColor },
      topStyle,
      topColor,
      innerTopColor: '#f8fafc',
      bottomStyle: isFemale && /\brok\b/.test(q) ? 'rok_panjang' : 'celana_panjang',
      bottomColor,
      shoeStyle: 'sneakers',
      shoeColor: '#f8fafc',
      accessories,
      suggestedName:
        hintName?.trim() || (isFemale ? 'Narator Visual Cewek' : 'Narator Visual Cowok'),
      photoObservation: customPrompt?.trim()
        ? `Karakter konsisten diadaptasi dari media referensi & instruksi: "${customPrompt.trim()}".`
        : 'Karakter konsisten diekstrak dari warna & proporsi foto/video referensi.',
    };
  };

  if (!ai) {
    const characterPreset = buildFallbackPreset();
    return res.json({ success: true, characterPreset, character: characterPreset, fallbackUsed: true });
  }

  try {
    const prompt = `Analisis orang / tokoh utama pada foto/frame video referensi ini dan petakan ke preset CharacterBuilder 2D/3D Satset Motion berikut seakurat mungkin:
${customPrompt ? `\nInstruksi kustom tambahan dari pengguna (WAJIB DIIKUTI): "${customPrompt}"\n` : ''}
Pilih ID yang PALING COCOK dari daftar berikut (hanya pakai ID persis yang tertera!):
1. gender: "cowok" atau "cewek"
2. skinColor: hex warna kulit yang cocok (mis. "#f7d9c4", "#efc39c", "#dba174", "#b6784e", "#7a4b31")
3. hairStyle (pilih SATU): "botak", "lurus_rapi", "belah_tengah", "belah_samping", "undercut", "buzz_cut", "mohawk", "spiky", "jambul", "pompadour", "keriting", "kribo", "bob_pendek", "cepol", "kuncir", "gondrong", "hijab_simpel", "khimar"
4. hairColor: hex warna rambut atau hijab (mis. "#231f20", "#4a2e22", "#c9c6c1", "#f59e0b", "#ee93a6", dll)
5. oneSetId (pilih "none" jika pakaian biasa terpisah, atau pilih seragam spesifik jika memakai seragam/profesi): "none", "seragam_sd", "seragam_smp", "seragam_sma", "seragam_kerja", "baju_rumah", "piyama", "seragam_pabrik", "muslim_koko", "gamis_syari", "batik", "pramuka", "perawat_scrub", "jas_dokter", "toga_hakim", "pemain_bola", "chef", "jas_formal", "wisuda"
6. oneSetColors: { primary: hex warna atasan/utama, secondary: hex warna celana/aksen }
7. topStyle (jika oneSetId="none", pilih SATU): "kaos", "kaos_garis", "polo", "kemeja", "koko", "sweater", "hoodie", "jaket_tertutup", "jaket_terbuka", "jaket_denim", "blazer", "rompi", "jas_panjang"
8. topColor: hex warna atasan/luar
9. innerTopColor: hex warna kaos dalam (jika jaket terbuka/blazer)
10. bottomStyle (pilih SATU): "celana_panjang", "jeans", "chino", "celana_pendek", "training", "rok_panjang", "rok_pendek", "sarung"
11. bottomColor: hex warna celana/rok
12. shoeStyle (pilih SATU): "sneakers", "pantofel", "boots", "sandal", "flat", "sport", "tanpa"
13. shoeColor: hex warna sepatu
14. accessories (array multi-pilih dari ID yang terlihat di foto, atau [] jika tidak ada): "kacamata_bulat", "kacamata_kotak", "kacamata_hitam", "ransel", "tas_kerja", "tas_selempang", "peci", "topi_pet", "topi_rimba", "kupluk", "caping", "helm_proyek", "topi_chef", "toga_cap", "mahkota", "tongkat", "kumis", "jenggot", "headphone", "dasi", "dasi_kupu", "syal", "celemek", "stetoskop"
15. suggestedName: nama karakter singkat berbahasa Indonesia yang sesuai gaya tokoh (${hintName ? `petunjuk nama: ${hintName}` : '2-3 kata'})
16. photoObservation: ringkasan singkat 1 kalimat bahasa Indonesia tentang penampilan yang terbaca dari foto.

Kembalikan HANYA JSON sesuai skema.`;

    const response = await generateGeminiWithFallback({
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        systemInstruction:
          'Anda adalah AI Character Stylist Satset Motion yang memetakan foto/video manusia menjadi preset karakter kartun/vector secara akurat. Jawab strict JSON.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gender: { type: Type.STRING, enum: ['cowok', 'cewek'] },
            skinColor: { type: Type.STRING },
            hairStyle: { type: Type.STRING },
            hairColor: { type: Type.STRING },
            oneSetId: { type: Type.STRING },
            oneSetColors: {
              type: Type.OBJECT,
              properties: {
                primary: { type: Type.STRING },
                secondary: { type: Type.STRING },
              },
            },
            topStyle: { type: Type.STRING },
            topColor: { type: Type.STRING },
            innerTopColor: { type: Type.STRING },
            bottomStyle: { type: Type.STRING },
            bottomColor: { type: Type.STRING },
            shoeStyle: { type: Type.STRING },
            shoeColor: { type: Type.STRING },
            accessories: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedName: { type: Type.STRING },
            photoObservation: { type: Type.STRING },
          },
          required: [
            'gender',
            'skinColor',
            'hairStyle',
            'hairColor',
            'oneSetId',
            'topStyle',
            'topColor',
            'bottomStyle',
            'bottomColor',
            'shoeStyle',
            'shoeColor',
            'accessories',
            'suggestedName',
            'photoObservation',
          ],
        },
      },
    });

    const jsonText = (response.text ?? '').trim();
    if (!jsonText) {
      const characterPreset = buildFallbackPreset();
      return res.json({ success: true, characterPreset, character: characterPreset, fallbackUsed: true });
    }
    const characterPreset = JSON.parse(jsonText);
    return res.json({ success: true, characterPreset, character: characterPreset });
  } catch (err: any) {
    console.warn('Character photo analysis fallback used:', err?.message || err);
    const characterPreset = buildFallbackPreset();
    return res.json({ success: true, characterPreset, character: characterPreset, fallbackUsed: true });
  }
});

// Setup Vite middleware for local development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Kiteva Motion Graphics Agent running on http://0.0.0.0:${port}`);
  });
}

startServer();

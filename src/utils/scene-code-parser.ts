import { compileSatsetSceneCode, getSatsetStyleDemoScenes } from './custom-style-runtime';

export interface SingleSceneParseResult {
  ok: boolean;
  code?: string;
  error?: string;
}

export interface BatchSceneParseResult {
  ok: boolean;
  scenesByNumber: Record<number, string>;
  parsedSceneNumbers: number[];
  missingSceneNumbers: number[];
  error?: string;
  warning?: string;
}

/**
 * Checks whether a snippet is a React/JSX template rather than Canvas 2D `s.*` / `ctx.*` code.
 */
export function looksLikeReactOrJsxCode(raw: string): boolean {
  if (!raw || typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (/^\s*import\s+/m.test(trimmed)) return true;
  if (/^\s*export\s+(?:default|const|function|type|interface)\b/m.test(trimmed)) return true;
  if (/<RemotionCanvas\b/i.test(trimmed)) return true;
  if (/React\.createElement\b/.test(trimmed)) return true;
  if (/from\s+['"]remotion['"]/i.test(trimmed)) return true;
  return false;
}

/**
 * Checks whether a scene code string is executable Canvas 2D `s.*` / `ctx.*` body code.
 */
export function isExecutableSatsetSceneCode(code?: string | null): boolean {
  if (!code || typeof code !== 'string') return false;
  const trimmed = code.trim();
  if (!trimmed) return false;
  if (looksLikeReactOrJsxCode(trimmed)) return false;
  return /\bs\s*\./.test(trimmed) || /\bctx\s*\./.test(trimmed);
}

/**
 * Strips markdown code fences, prose outside fences, and accidental function(s, ctx) wrappers
 * from a single scene's JavaScript body code.
 */
export function sanitizeSingleSceneCode(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let text = raw.replace(/\r\n/g, '\n').trim();
  if (!text) return '';

  // 1. If fenced code blocks exist, extract fenced content (prefer longest valid block)
  const fenceRegex = /```(?:js|javascript|ts|typescript)?[ \t]*\n([\s\S]*?)```/gi;
  const fenceMatches = Array.from(text.matchAll(fenceRegex));
  if (fenceMatches.length > 0) {
    if (fenceMatches.length === 1) {
      text = fenceMatches[0][1].trim();
    } else {
      text = fenceMatches.map((m) => m[1].trim()).join('\n\n').trim();
    }
  } else {
    // Handle half-open fences (leading ```js without closing ``` or trailing ```)
    text = text
      .replace(/^\s*```(?:js|javascript|ts|typescript)?[ \t]*\n?/i, '')
      .replace(/\n?[ \t]*```\s*$/i, '')
      .trim();
  }

  if (!text) return '';

  // 2. Unwrap accidental `function (s, ctx) { ... }` or `const Scene1 = (s, ctx) => { ... }` wrappers
  const fnPatterns = [
    /^(?:export\s+(?:default\s+)?)?(?:async\s+)?function(?:\s+[A-Za-z0-9_$]+)?\s*\(\s*s\s*(?:,\s*ctx\s*)?\)\s*\{([\s\S]*)\}\s*;?\s*$/,
    /^(?:const|let|var)\s+[A-Za-z0-9_$]+\s*=\s*(?:async\s+)?(?:\(\s*s\s*(?:,\s*ctx\s*)?\)\s*=>|function(?:\s+[A-Za-z0-9_$]+)?\s*\(\s*s\s*(?:,\s*ctx\s*)?\))\s*\{([\s\S]*)\}\s*;?\s*$/,
    /^\(?\s*(?:async\s+)?(?:\(\s*s\s*(?:,\s*ctx\s*)?\)\s*=>|function(?:\s+[A-Za-z0-9_$]+)?\s*\(\s*s\s*(?:,\s*ctx\s*)?\))\s*\{([\s\S]*)\}\s*\)?\s*;?\s*$/,
  ];

  for (const pattern of fnPatterns) {
    const match = text.match(pattern);
    if (match && typeof match[1] === 'string') {
      const candidateBody = match[1].trim();
      const compiled = compileSatsetSceneCode(candidateBody);
      if (!(compiled instanceof Error)) {
        text = candidateBody;
        break;
      }
    }
  }

  return text.trim();
}

const SCENE_HEADER_LINE_REGEX =
  /^[ \t]*(?:\/\/[ \t]*(?:[=\-*#]*[ \t]*)?SCENE[ \t]+(\d+)\b[^\n]*|\/\*[ \t]*(?:[=\-*]*[ \t]*)?SCENE[ \t]+(\d+)\b[^*]*\*\/|#{1,4}[ \t]*SCENE[ \t]+(\d+)\b[^\n]*)$/gim;

/**
 * Splits a multi-scene AI response by `// ===== SCENE N =====` (or similar) headers
 * into clean per-scene sanitized code strings.
 */
export function extractSceneSections(raw: string): Record<number, string> {
  const normalized = (raw || '').replace(/\r\n/g, '\n');
  const headers: Array<{ sceneNum: number; headerEnd: number; headerStart: number }> = [];

  for (const m of normalized.matchAll(SCENE_HEADER_LINE_REGEX)) {
    const numStr = m[1] || m[2] || m[3];
    const sceneNum = parseInt(numStr, 10);
    if (!Number.isFinite(sceneNum) || sceneNum <= 0) continue;
    const headerStart = m.index ?? 0;
    const headerEnd = headerStart + m[0].length;
    headers.push({ sceneNum, headerStart, headerEnd });
  }

  if (headers.length === 0) return {};

  const result: Record<number, string> = {};
  for (let i = 0; i < headers.length; i++) {
    const cur = headers[i];
    const nextStart = i + 1 < headers.length ? headers[i + 1].headerStart : normalized.length;
    const rawSlice = normalized.slice(cur.headerEnd, nextStart);
    const cleaned = sanitizeSingleSceneCode(rawSlice);
    if (cleaned) {
      result[cur.sceneNum] = cleaned;
    }
  }
  return result;
}

/**
 * Parses and validates code meant for a single scene.
 */
export function parseSingleSceneCode(rawInput: string, targetSceneNumber?: number): SingleSceneParseResult {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) {
    return { ok: false, error: 'Kotak kode masih kosong. Tempel kode animasi JavaScript dari AI terlebih dahulu.' };
  }

  if (looksLikeReactOrJsxCode(trimmed)) {
    return {
      ok: false,
      error:
        'Kode yang ditempel terlihat seperti template React/JSX (import/export/<RemotionCanvas />), bukan kode body Canvas 2D (`s.*`). Salin ulang prompt terbaru dari tab Atur lalu minta AI menulis isi `function (s, ctx)` saja.',
    };
  }

  // If user pasted a multi-scene output into the single-scene modal and targetSceneNumber is given, extract just that scene!
  const sections = extractSceneSections(trimmed);
  const sectionKeys = Object.keys(sections).map(Number);
  let candidate = '';
  if (sectionKeys.length > 0) {
    if (targetSceneNumber && sections[targetSceneNumber]) {
      candidate = sections[targetSceneNumber];
    } else if (sectionKeys.length === 1) {
      candidate = sections[sectionKeys[0]];
    } else {
      return {
        ok: false,
        error: `Kamu menempel beberapa scene sekaligus (${sectionKeys.join(', ')}), tetapi Scene ${
          targetSceneNumber ?? '?'
        } tidak ditemukan. Gunakan tombol tempel batch di tab "Atur & Prompt AI" atau tempel hanya kode Scene ${
          targetSceneNumber ?? 'terkait'
        }.`,
      };
    }
  } else {
    candidate = sanitizeSingleSceneCode(trimmed);
  }

  if (!candidate) {
    return { ok: false, error: 'Kode tidak berisi instruksi JavaScript yang valid setelah dibersihkan.' };
  }

  if (looksLikeReactOrJsxCode(candidate)) {
    return {
      ok: false,
      error: 'Kode masih mengandung sintaks React/JSX (import/export). Hanya isi body `function (s, ctx)` yang didukung.',
    };
  }

  if (!/\bs\s*\./.test(candidate) && !/\bctx\s*\./.test(candidate)) {
    return {
      ok: false,
      error: 'Kode tidak memanggil API gambar `s.*` atau `ctx.*`. Pastikan kode menggunakan engine Satset Motion.',
    };
  }

  const compiled = compileSatsetSceneCode(candidate);
  if (compiled instanceof Error) {
    return {
      ok: false,
      error: `Error sintaks JavaScript: ${compiled.message}`,
    };
  }

  return { ok: true, code: candidate };
}

/**
 * Parses and validates a batch paste (e.g. Scene 1-6) without ever duplicating one scene's code across others.
 */
export function parseBatchSceneCodes(
  rawInput: string,
  startScene: number,
  endScene: number
): BatchSceneParseResult {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) {
    return {
      ok: false,
      scenesByNumber: {},
      parsedSceneNumbers: [],
      missingSceneNumbers: [],
      error: 'Kotak kode masih kosong. Tempel jawaban kode dari AI terlebih dahulu.',
    };
  }

  if (looksLikeReactOrJsxCode(trimmed)) {
    return {
      ok: false,
      scenesByNumber: {},
      parsedSceneNumbers: [],
      missingSceneNumbers: [],
      error:
        'Kode yang ditempel adalah komponen React/JSX (`import`/`export`/`<RemotionCanvas />`), bukan body Canvas 2D (`s.*`). Gunakan prompt terbaru agar AI menghasilkan JavaScript `s.*` dengan pemisah `// ===== SCENE N =====`.',
    };
  }

  const isMultiSceneBatch = endScene > startScene;
  const sections = extractSceneSections(trimmed);
  const foundKeys = Object.keys(sections)
    .map(Number)
    .sort((a, b) => a - b);

  // Never blindly clone single block across Scene start..end!
  if (isMultiSceneBatch && foundKeys.length === 0) {
    return {
      ok: false,
      scenesByNumber: {},
      parsedSceneNumbers: [],
      missingSceneNumbers: [],
      error: `Tidak ditemukan pemisah \`// ===== SCENE ${startScene} =====\` dst. Jika semua scene memakai 1 kode yang sama, animasi akan kembar berulang. Pastikan jawaban AI memisahkan setiap scene dengan \`// ===== SCENE N =====\`.`,
    };
  }

  const scenesByNumber: Record<number, string> = {};
  const parsedSceneNumbers: number[] = [];
  const missingSceneNumbers: number[] = [];

  if (!isMultiSceneBatch) {
    const single = parseSingleSceneCode(trimmed, startScene);
    if (!single.ok || !single.code) {
      return {
        ok: false,
        scenesByNumber: {},
        parsedSceneNumbers: [],
        missingSceneNumbers: [startScene],
        error: single.error,
      };
    }
    return {
      ok: true,
      scenesByNumber: { [startScene]: single.code },
      parsedSceneNumbers: [startScene],
      missingSceneNumbers: [],
    };
  }

  // Extract requested range; if user pasted scene numbers matching other scenes too, preserve requested range first
  for (let sNum = startScene; sNum <= endScene; sNum++) {
    const body = sections[sNum];
    if (!body) {
      missingSceneNumbers.push(sNum);
      continue;
    }
    if (looksLikeReactOrJsxCode(body)) {
      return {
        ok: false,
        scenesByNumber: {},
        parsedSceneNumbers: [],
        missingSceneNumbers,
        error: `Scene ${sNum} berisi kode React/JSX (import/export), bukan body Canvas 2D (\`s.*\`).`,
      };
    }
    if (!/\bs\s*\./.test(body) && !/\bctx\s*\./.test(body)) {
      return {
        ok: false,
        scenesByNumber: {},
        parsedSceneNumbers: [],
        missingSceneNumbers,
        error: `Scene ${sNum} tidak memanggil \`s.*\` atau \`ctx.*\`. Periksa apakah AI menuliskan kode lengkap untuk Scene ${sNum}.`,
      };
    }
    const compiled = compileSatsetSceneCode(body);
    if (compiled instanceof Error) {
      return {
        ok: false,
        scenesByNumber: {},
        parsedSceneNumbers: [],
        missingSceneNumbers,
        error: `Scene ${sNum} memiliki error sintaks JS: ${compiled.message}`,
      };
    }
    scenesByNumber[sNum] = body;
    parsedSceneNumbers.push(sNum);
  }

  if (parsedSceneNumbers.length === 0) {
    return {
      ok: false,
      scenesByNumber: {},
      parsedSceneNumbers: [],
      missingSceneNumbers,
      error: `Ditemukan penanda SCENE (${foundKeys.join(', ')}), tetapi tidak ada yang cocok dengan rentang Scene ${startScene}–${endScene}.`,
    };
  }

  const warning =
    missingSceneNumbers.length > 0
      ? `Berhasil menyimpan Scene ${parsedSceneNumbers.join(', ')}. Scene ${missingSceneNumbers.join(', ')} belum ditemukan di teks AI dan tetap memakai visual sebelumnya.`
      : undefined;

  return {
    ok: true,
    scenesByNumber,
    parsedSceneNumbers,
    missingSceneNumbers,
    warning,
  };
}

/**
 * Generates an authentic multi-scene batch sample with distinct demo scenes per scene number.
 */
export function buildSampleBatchCode(
  styleId: string | undefined,
  startScene: number,
  endScene: number
): string {
  const demos = getSatsetStyleDemoScenes(styleId || 'diorama');
  const blocks: string[] = [];
  for (let n = startScene; n <= endScene; n++) {
    const demo = demos[(Math.max(1, n) - 1) % demos.length] || demos[0];
    blocks.push(`// ===== SCENE ${n} =====\n${demo?.code || 's.text3d("SATSET", 360, 420, { size: 72, color: s.c.orange, draw: s.pop(0.1) });'}`);
  }
  return `\`\`\`js\n${blocks.join('\n\n')}\n\`\`\``;
}

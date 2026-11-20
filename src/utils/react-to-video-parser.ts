import {
  type AspectRatio,
  type SatsetProject,
  type SatsetScene,
  type SatsetStyleModule,
} from '../types/satset.ts';
import { parseAndValidateAIBlueprint } from './remotion-generator.ts';
import {
  extractSmartEmphasisWords,
  synchronizeProjectPipeline,
} from './pipeline-sync.ts';
import { resolveAutoStyleForConceptAndScene } from './contextual-scene-builder.ts';

export type SceneTemplateKind =
  | 'hook'
  | 'concept'
  | 'compare'
  | 'chart'
  | 'steps'
  | 'metaphor'
  | 'cta';

export interface ParsedReactScenePreview {
  sceneNumber: number;
  template: SceneTemplateKind;
  headline: string;
  narration: string;
  durationSec: number;
  styleModule: SatsetStyleModule;
  visualTags: string[];
}

export interface ReactToVideoParseResult {
  sourceKind: 'blueprint-json' | 'remotion-tsx' | 'react-jsx' | 'script-text';
  detectedFps: number;
  detectedAspectRatio: AspectRatio;
  detectedColors: string[];
  scenesPreview: ParsedReactScenePreview[];
  project: SatsetProject;
}

const DEFAULT_FALLBACK_NARRATIONS = [
  'Stop scrolling! Ini cara bikin animasi video yang benar-benar hidup.',
  'Setiap elemen masuk berurutan pakai pegas, bukan muncul mendadak.',
  'Karakter berakting mengikuti kalimat dan kamera terus bergerak halus.',
  'Simpan sekarang dan langsung export ke Remotion siap render!',
];

const DEFAULT_FALLBACK_HEADLINES = [
  'STOP SCROLLING / ANIMASI HIDUP',
  'GERAK BERPEGAS / BUKAN SLIDE',
  'KARAKTER AKTIF / KAMERA HALUS',
  'SIMPAN & RENDER / SEKARANG',
];

function inferTemplateKind(
  text: string,
  index: number,
  total: number
): SceneTemplateKind {
  if (index === 0) return 'hook';
  if (index === total - 1 && total > 1) return 'cta';
  const low = text.toLowerCase();
  if (/(\b(?:grafik|chart|statistik|tumbuh|naik|turun|data|angka|rekor)\b|%)/.test(low)) {
    return 'chart';
  }
  if (/\b(?:vs|banding|bandingkan|perbandingan|beda|sebelum|sesudah|lama|baru|konvensional|otomatis)\b/.test(low)) {
    return 'compare';
  }
  if (/\b(?:langkah|step|tahap|cara|pertama|kedua|ketiga|urut|stagger)\b/.test(low)) {
    return 'steps';
  }
  if (/\b(?:ibarat|seperti|bayangkan|metafora|jantung|mesin|inti|pusat)\b/.test(low)) {
    return 'metaphor';
  }
  return 'concept';
}

function mapTemplateToRole(template: SceneTemplateKind): SatsetScene['role'] {
  switch (template) {
    case 'hook':
      return 'hook';
    case 'cta':
      return 'cta';
    case 'compare':
    case 'chart':
      return 'contrast_example';
    case 'steps':
      return 'solution';
    case 'metaphor':
      return 'insight';
    case 'concept':
    default:
      return 'body_core_point';
  }
}

function isTechnicalCodeNoise(raw: string): boolean {
  const s = raw.trim();
  if (s.length < 3) return true;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s)) return true;
  if (/^M[-0-9.\s,CcLlQqZzHhVv]+$/.test(s)) return true;
  if (/^(https?:|\/|src\/|\.\/|\.\.\/)/.test(s)) return true;
  if (/^(linear-gradient|radial-gradient|rgba?|hsla?|translate|scale|rotate|cubic-bezier|perspective)\(/i.test(s)) return true;
  if (/^(flex|grid|absolute|relative|fixed|inset|w-|h-|px-|py-|text-|bg-|border-|rounded-)/.test(s)) return true;
  if (/[{};=><]/.test(s) && !/[?!.,]$/.test(s)) return true;
  if (/^\d+(px|rem|em|vw|vh|%|deg|ms|s)?$/i.test(s)) return true;
  if (/^(div|span|svg|path|rect|circle|group|mesh|useFrame|useCurrentFrame|spring|interpolate)$/i.test(s)) return true;
  return false;
}

function extractReadableStringsFromChunk(chunk: string): string[] {
  const collected: string[] = [];
  const seen = new Set<string>();

  const pushClean = (val: string) => {
    const cleaned = val
      .replace(/\\n/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[{}`]/g, '')
      .trim();
    if (cleaned.length < 4 || cleaned.length > 180) return;
    if (isTechnicalCodeNoise(cleaned)) return;
    const key = cleaned.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      collected.push(cleaned);
    }
  };

  // 1. Priority explicit Remotion/Satset string fields
  const namedFieldRegex =
    /(?:narration_text|voiceScript|on_screen_text|headline|title|screenTitle|label|subtitle|caption|text)\s*[:=]\s*(['"`])((?:\\.|(?!\1).)+)\1/g;
  let m: RegExpExecArray | null;
  while ((m = namedFieldRegex.exec(chunk)) !== null) {
    pushClean(m[2]);
  }

  // 2. JSX Inner text between tags: >Visible Text<
  const jsxTextRegex = />([^<>{\n][^<>{}]{2,140})</g;
  while ((m = jsxTextRegex.exec(chunk)) !== null) {
    pushClean(m[1]);
  }

  // 3. Quoted string literals containing multiple human words
  const quotedRegex = /(['"])([^'"\n]{6,130})\1/g;
  while ((m = quotedRegex.exec(chunk)) !== null) {
    const candidate = m[2];
    if (/\s+/.test(candidate.trim())) {
      pushClean(candidate);
    }
  }

  return collected;
}

function extractSequenceBlocks(content: string): {
  fromFrame: number;
  durationInFrames: number;
  name?: string;
  body: string;
}[] {
  const blocks: {
    fromFrame: number;
    durationInFrames: number;
    name?: string;
    body: string;
  }[] = [];

  const openRegex = /<Sequence\b([^>]*)>/g;
  let match: RegExpExecArray | null;
  while ((match = openRegex.exec(content)) !== null) {
    const attrs = match[1] || '';
    const startIdx = match.index + match[0].length;
    const closeIdx = content.indexOf('</Sequence>', startIdx);
    const nextOpenIdx = content.indexOf('<Sequence', startIdx);

    // Handle self-closing or unclosed gracefully by scoping to next Sequence or closing tag
    const endIdx =
      closeIdx !== -1 && (nextOpenIdx === -1 || closeIdx < nextOpenIdx)
        ? closeIdx
        : nextOpenIdx !== -1
        ? nextOpenIdx
        : Math.min(content.length, startIdx + 1800);

    const fromMatch = attrs.match(/from=\{\s*(\d+)\s*\}/);
    const durMatch = attrs.match(/durationInFrames=\{\s*(\d+)\s*\}/);
    const nameMatch = attrs.match(/name=(['"])([^'"]+)\1/);

    const fromFrame = fromMatch ? Number(fromMatch[1]) : blocks.length * 120;
    const durationInFrames = durMatch ? Math.max(30, Number(durMatch[1])) : 120;

    blocks.push({
      fromFrame,
      durationInFrames,
      name: nameMatch?.[2],
      body: content.slice(startIdx, endIdx),
    });
  }

  return blocks;
}

function extractHexPalette(content: string): string[] {
  const matches = content.match(/#[0-9a-fA-F]{6}\b/g) || [];
  const skip = new Set(['#000000', '#111111', '#ffffff', '#020617', '#020817']);
  const unique: string[] = [];
  for (const hex of matches) {
    const lower = hex.toLowerCase();
    if (!skip.has(lower) && !unique.includes(lower)) {
      unique.push(lower);
    }
    if (unique.length >= 4) break;
  }
  return unique;
}

function buildCompactHeadline(sourceText: string, index: number): string {
  const cleaned = sourceText
    .replace(/[^\p{L}\p{N}\s/%+-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) {
    return DEFAULT_FALLBACK_HEADLINES[index % DEFAULT_FALLBACK_HEADLINES.length];
  }
  const words = cleaned.split(/\s+/).filter(Boolean).slice(0, 5);
  return words.join(' ').toUpperCase();
}

export function parseReactToVideoInput(
  content: string,
  fileName = 'UploadedComposition.tsx',
  fallbackTopic = 'Animasi Penjelasan Visual'
): ReactToVideoParseResult {
  const trimmed = String(content || '').trim();
  const detectedColors = extractHexPalette(trimmed);
  const brandColor = detectedColors[0] || '#243A8F';
  const secondaryColor = detectedColors[1] || '#4CC9F0';

  const fpsMatch = trimmed.match(/\bfps\s*[:=]\s*(\d{2})/i);
  const detectedFps = fpsMatch ? Math.max(24, Math.min(60, Number(fpsMatch[1]))) : 30;

  let detectedAspectRatio: AspectRatio = '9:16';
  if (/1920\s*[,x*]\s*1080|aspect_ratio\s*[:=]\s*['"]16:9['"]/i.test(trimmed)) {
    detectedAspectRatio = '16:9';
  } else if (/1080\s*[,x*]\s*1080|aspect_ratio\s*[:=]\s*['"]1:1['"]/i.test(trimmed)) {
    detectedAspectRatio = '1:1';
  }

  // 1. Blueprint JSON path
  const parsedJson = parseAndValidateAIBlueprint(trimmed);
  if (parsedJson.success && parsedJson.project && parsedJson.project.scenes?.length) {
    const rawStyle = (parsedJson.project.gaya_video as SatsetStyleModule) || 'studio_3d_room';
    const rawProj: SatsetProject = {
      id: `proj-import-${Date.now()}`,
      project_title:
        parsedJson.project.project_title ||
        fileName.replace(/\.[^.]+$/, '') ||
        'Imported Blueprint',
      title:
        parsedJson.project.project_title ||
        fileName.replace(/\.[^.]+$/, '') ||
        'Imported Blueprint',
      topic: fallbackTopic,
      topik_video: fallbackTopic,
      target_duration_sec:
        parsedJson.project.target_duration_sec ||
        parsedJson.project.durationSeconds ||
        30,
      durationSeconds:
        parsedJson.project.durationSeconds ||
        parsedJson.project.target_duration_sec ||
        30,
      aspect_ratio: parsedJson.project.aspect_ratio || detectedAspectRatio,
      fps: detectedFps,
      render_dimension: '3d',
      tempo: 'energik',
      character: parsedJson.project.character || 'kreator_3d_studio',
      warna_brand: brandColor,
      brandColor,
      brand_secondary_color: secondaryColor,
      gaya_video: rawStyle,
      styleModule: rawStyle,
      scenes: parsedJson.project.scenes,
      createdAt: Date.now(),
    };
    const synced = synchronizeProjectPipeline(rawProj);
    return {
      sourceKind: 'blueprint-json',
      detectedFps,
      detectedAspectRatio: synced.aspect_ratio || detectedAspectRatio,
      detectedColors,
      scenesPreview: synced.scenes.map((sc, i) => ({
        sceneNumber: i + 1,
        template: inferTemplateKind(
          `${sc.on_screen_text || ''} ${sc.narration_text || ''}`,
          i,
          synced.scenes.length
        ),
        headline: sc.on_screen_text || sc.hookText || `Scene ${i + 1}`,
        narration: sc.narration_text || sc.voiceScript || '',
        durationSec: sc.target_duration_sec || sc.durationSeconds || 4,
        styleModule: (sc.visualModule as SatsetStyleModule) || rawStyle,
        visualTags: sc.visual_animation?.asset_elements || [],
      })),
      project: synced,
    };
  }

  // 2. React / Remotion TSX path
  const isRemotionTsx =
    /(from\s+['"]remotion|useCurrentFrame|<Sequence|Composition)/.test(trimmed);
  const isReactJsx = !isRemotionTsx && /(<[A-Z][A-Za-z0-9]*|<div|<section|export\s+(default|const|function))/.test(trimmed);
  const sourceKind: ReactToVideoParseResult['sourceKind'] = isRemotionTsx
    ? 'remotion-tsx'
    : isReactJsx
    ? 'react-jsx'
    : 'script-text';

  const compIdMatch =
    trimmed.match(/PROJECT_TITLE\s*=\s*['"]([^'"]+)['"]/) ||
    trimmed.match(/<Composition[^>]*\bid=(['"])([^'"]+)\1/) ||
    trimmed.match(/export\s+(?:const|function)\s+([A-Z][A-Za-z0-9_]+)/);
  const projectTitle =
    (compIdMatch?.[2] || compIdMatch?.[1]) ||
    fileName.replace(/\.[^.]+$/, '') ||
    'React To Video Composition';

  const sequenceBlocks = extractSequenceBlocks(trimmed);
  const candidateEntries: {
    durationSec: number;
    strings: string[];
    rawContext: string;
  }[] = [];

  if (sequenceBlocks.length > 0) {
    for (const block of sequenceBlocks) {
      const strs = extractReadableStringsFromChunk(block.body);
      if (block.name && !strs.includes(block.name)) {
        strs.unshift(block.name);
      }
      candidateEntries.push({
        durationSec: Math.max(2.5, Math.min(12, Number((block.durationInFrames / detectedFps).toFixed(1)))),
        strings: strs,
        rawContext: block.body,
      });
    }
  } else {
    // Try splitting by React scene components or top-level readable sentences
    const componentSections = trimmed.split(/(?=(?:const|function)\s+[A-Z][A-Za-z0-9]*(?:Scene|Slide|Step|Section))/g);
    if (componentSections.length >= 2) {
      for (const sec of componentSections) {
        const strs = extractReadableStringsFromChunk(sec);
        if (strs.length > 0) {
          candidateEntries.push({
            durationSec: 4.5,
            strings: strs,
            rawContext: sec,
          });
        }
      }
    }
    if (candidateEntries.length === 0) {
      const allStrings = extractReadableStringsFromChunk(trimmed);
      if (allStrings.length > 0) {
        // Group strings in chunks of 2 per scene (headline + narration)
        for (let i = 0; i < allStrings.length; i += 2) {
          candidateEntries.push({
            durationSec: 4.5,
            strings: allStrings.slice(i, i + 2),
            rawContext: allStrings.slice(i, i + 2).join(' '),
          });
        }
      }
    }
  }

  // Ensure at least 3 well-structured scenes
  if (candidateEntries.length === 0) {
    [0, 1, 2].forEach((idx) => {
      candidateEntries.push({
        durationSec: 4.5,
        strings: [
          idx === 0 ? fallbackTopic : DEFAULT_FALLBACK_NARRATIONS[idx],
          DEFAULT_FALLBACK_HEADLINES[idx],
        ],
        rawContext: fallbackTopic,
      });
    });
  }

  const totalCount = candidateEntries.length;
  const scenes: SatsetScene[] = candidateEntries.map((entry, idx) => {
    const primaryStr =
      entry.strings[0] ||
      (idx === 0 ? fallbackTopic : DEFAULT_FALLBACK_NARRATIONS[idx % DEFAULT_FALLBACK_NARRATIONS.length]);
    const secondaryStr = entry.strings[1] || '';
    const narration =
      secondaryStr.length > primaryStr.length ? secondaryStr : primaryStr;
    const headlineSource =
      secondaryStr && secondaryStr.length <= primaryStr.length
        ? secondaryStr
        : primaryStr;
    const headline = buildCompactHeadline(headlineSource, idx);
    const template = inferTemplateKind(`${headline} ${narration} ${entry.rawContext.slice(0, 160)}`, idx, totalCount);
    const role = mapTemplateToRole(template);
    const emphasisWords = extractSmartEmphasisWords(narration, headline);
    const tags = [
      template.toUpperCase(),
      ...emphasisWords.slice(0, 2).map((w) => w.toUpperCase()),
    ].slice(0, 3);

    const draftScene: SatsetScene = {
      id: `sc-r2v-${idx + 1}`,
      scene_number: idx + 1,
      role,
      target_duration_sec: entry.durationSec,
      durationSeconds: entry.durationSec,
      narration_text: narration.slice(0, 180),
      voiceScript: narration.slice(0, 180),
      on_screen_text: headline,
      hookText: headline,
      emphasis_words: emphasisWords,
      visual_animation: {
        layout:
          template === 'compare'
            ? 'split_compare_cards'
            : template === 'chart'
            ? 'animated_bar_metrics'
            : template === 'steps'
            ? 'staggered_steps_stack'
            : 'hero_kinetic_stage',
        remotion_animation:
          template === 'hook' ? 'spring_overshoot_pop' : 'kinetic_stagger_slide',
        asset_elements: tags,
      },
      sfx: {
        file: idx === 0 ? 'sfx_studio3d_whoosh.mp3' : 'sfx_editorial_swipe.mp3',
        type: 'whoosh',
        play_at_second: 0,
      },
      accentColor: idx % 2 === 0 ? brandColor : secondaryColor,
      secondaryColor: '#FFD23F',
    };

    const resolved = resolveAutoStyleForConceptAndScene(
      { topic: fallbackTopic, project_title: projectTitle } as SatsetProject,
      draftScene,
      idx
    );

    return {
      ...draftScene,
      visualModule:
        idx % 2 === 0 ? 'studio_3d_room' : resolved.styleId || 'editorial_motion_grid',
    };
  });

  const baseProject: SatsetProject = {
    id: `proj-r2v-${Date.now()}`,
    project_title: projectTitle,
    title: projectTitle,
    topic: fallbackTopic,
    topik_video: fallbackTopic,
    target_duration_sec: scenes.reduce((sum, s) => sum + (s.target_duration_sec || 4), 0),
    durationSeconds: scenes.reduce((sum, s) => sum + (s.target_duration_sec || 4), 0),
    aspect_ratio: detectedAspectRatio,
    fps: detectedFps,
    render_dimension: '3d',
    tempo: 'energik',
    character: 'kreator_3d_studio',
    warna_brand: brandColor,
    brandColor,
    brand_secondary_color: secondaryColor,
    gaya_video: 'studio_3d_room',
    styleModule: 'studio_3d_room',
    subtitle_style: 'auto',
    scenes,
    createdAt: Date.now(),
  };

  const synced = synchronizeProjectPipeline(baseProject);

  return {
    sourceKind,
    detectedFps,
    detectedAspectRatio: synced.aspect_ratio || detectedAspectRatio,
    detectedColors,
    scenesPreview: synced.scenes.map((sc, i) => ({
      sceneNumber: i + 1,
      template: inferTemplateKind(
        `${sc.on_screen_text || ''} ${sc.narration_text || ''}`,
        i,
        synced.scenes.length
      ),
      headline: sc.on_screen_text || sc.hookText || `Scene ${i + 1}`,
      narration: sc.narration_text || sc.voiceScript || '',
      durationSec: sc.target_duration_sec || sc.durationSeconds || 4,
      styleModule: (sc.visualModule as SatsetStyleModule) || 'studio_3d_room',
      visualTags: sc.visual_animation?.asset_elements || [],
    })),
    project: synced,
  };
}

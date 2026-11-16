export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5';

export type Resolution = '1080p' | '720p' | '4K';

export type AudioMood = 'cyberSynth' | 'ambientSpace' | 'minimalTech' | 'lofiBeat' | 'cinematicTension';

export type UiLanguage = 'en' | 'zh';

export type MotionCategory =
  | 'kineticTypography'
  | 'threeDimensional'
  | 'geometricMorph'
  | 'dataInfographics'
  | 'brandAtmosphere';

export interface MotionStyleItem {
  id: string;
  name: string;
  nameZh: string;
  category: MotionCategory;
  categoryName: string;
  categoryNameZh: string;
  description: string;
  descriptionZh: string;
  accentColor: string;
  secondaryColor: string;
  technologies: string[];
  renderEngine: 'canvas2d' | 'threejs' | 'svgMorph';
  promptKeywords: string[];
  tags: string[];
}

export interface StoryboardChapter {
  id: string;
  title: string;
  titleZh?: string;
  durationMs: number;
  transitionType?: 'crossfade' | 'zoomPunch' | 'whipPan' | 'glitch' | 'lightFlash' | 'iris';
  motionGraphicType: string;
  visualNotes: string;
  visualNotesZh?: string;
  script: string;
  scriptZh?: string;
  accentColor: string;
  secondaryColor: string;
  customCode?: string;
  sfxCue?: 'whoosh' | 'glitch' | 'subdrop' | 'riser' | 'chime';
}

export interface StoryboardProject {
  id: string;
  title: string;
  titleZh?: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  durationSeconds: number;
  audioMood: AudioMood;
  voiceStyle: string;
  language: UiLanguage;
  chapters: StoryboardChapter[];
  creativeBrief: string;
  createdAt: number;
}

export interface AgentActivityStep {
  id: string;
  role: 'Director' | 'Motion Designer' | 'Sound Composer' | 'Colorist' | 'Quality Reviewer';
  roleZh: string;
  action: string;
  actionZh: string;
  status: 'pending' | 'running' | 'completed';
  timestamp: number;
  details?: string;
  detailsZh?: string;
}

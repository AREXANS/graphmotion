export interface CustomStyleBgTheme {
  top: string;
  bottom: string;
  pattern?: string;
}

export interface CustomStyleDemoSceneMeta {
  text?: string;
  emphasis?: string;
  theme?: 'paper' | 'dusk' | 'night';
}

export type SatsetCaptionModeId =
  | 'pop'
  | 'tangan'
  | 'ketik'
  | 'sorot'
  | 'stiker'
  | 'karaoke'
  | 'kotak'
  | 'gelap'
  | 'glitch'
  | 'panduan'
  | 'elegan'
  | 'satu'
  | 'neon'
  | 'selotip'
  | 'garis'
  | 'redup'
  | 'off';

export interface CustomStyleMetadata {
  name: string;
  prompt?: string;
  hint?: string;
  direction?: string;
  look?: 'scribble3d' | 'crayon' | '2d' | '3d';
  finish?: 'flat' | 'glossy' | '3d' | 'glow' | 'clean' | string;
  colors?: string[];
  accent?: string;
  caption?: SatsetCaptionModeId;
  calmCamera?: boolean;
  continuous?: boolean;
  plainBg?: boolean;
  bg?: {
    paper: CustomStyleBgTheme;
    dusk: CustomStyleBgTheme;
    night: CustomStyleBgTheme;
  };
  background?: {
    paper: CustomStyleBgTheme;
    dusk: CustomStyleBgTheme;
    night: CustomStyleBgTheme;
  };
}

export interface CustomStyleDefinition {
  id: string;
  name: string;
  hint?: string;
  prompt?: string;
  direction?: string;
  look: 'scribble3d' | 'crayon' | '2d' | '3d';
  finish: 'flat' | 'glossy' | '3d' | 'glow' | 'clean' | string;
  colors: string[];
  accent?: string;
  caption?: SatsetCaptionModeId;
  calmCamera?: boolean;
  continuous?: boolean;
  plainBg?: boolean;
  bg?: {
    paper: CustomStyleBgTheme;
    dusk: CustomStyleBgTheme;
    night: CustomStyleBgTheme;
  };
  background: {
    paper: CustomStyleBgTheme;
    dusk: CustomStyleBgTheme;
    night: CustomStyleBgTheme;
  };
  scenes: Record<number, string>;
  demoMeta?: {
    1?: CustomStyleDemoSceneMeta;
    2?: CustomStyleDemoSceneMeta;
    3?: CustomStyleDemoSceneMeta;
    4?: CustomStyleDemoSceneMeta;
  };
  rawCode: string;
  createdAt: number;
  updatedAt?: number;
}

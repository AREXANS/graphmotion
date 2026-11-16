import { UiLanguage } from '../types';

export const translations = {
  en: {
    appTitle: 'Kiteva',
    appSubtitle: 'AI Motion Graphics Agent',
    tagline: 'Turn ideas into short motion-graphics films, kinetic typography & 3D scenes',
    navCreativeRoom: 'Creative Room',
    navProductionDesk: 'Production Desk',
    navMotionCatalog: 'Motion Explorer',
    navTechnologyPool: 'Tech Pool',
    
    // Creative Room
    briefPlaceholder: 'Describe your vision, concept or script... (e.g., A sleek cinematic teaser announcing a quantum AI computing platform with neon orbital wireframes and kinetic typography)',
    briefLabel: 'Creative Brief & Narrative Direction',
    generateButton: 'Generate Motion Film with AI',
    generating: 'Agent Crew is Directing & Generating...',
    quickPrompts: 'Quick Inspiration Briefs',
    aspectRatio: 'Aspect Ratio',
    duration: 'Target Duration',
    audioSoundtrack: 'Audio Mood & Bed',
    voiceNarration: 'Voiceover Style',
    styleCombinations: 'Selected Motion Graphics Styles',
    noStylesSelected: 'Select 1 to 3 styles below or let AI decide',
    seconds: 'sec',
    
    // Audio Moods
    moodCyberSynth: 'Cyber Synthwave (128 BPM)',
    moodAmbientSpace: 'Deep Space Ambient (80 BPM)',
    moodMinimalTech: 'Minimal Tech Beat (118 BPM)',
    moodLofiBeat: 'Lo-Fi Chill Groove (85 BPM)',
    moodCinematicTension: 'Cinematic Tension Drone (92 BPM)',

    // Presets
    presetAiLaunch: 'Neural OS: Next-Gen AI Platform Reveal',
    presetQuantum: 'Quantum Matrix: Subatomic Computing Breakthrough',
    presetCyberpunk: 'Cybernetic Horizon: Autonomous City Grid',
    presetFintech: 'Apex Protocol: High-Frequency DeFi Liquidity',
    presetMinimalist: 'Bauhaus Movement: Kinetic Architectural Form',

    // Production Desk
    deskTitle: 'Production Desk & Playback Stage',
    deskSubtitle: 'Multi-track timeline, synced generative audio, code inspector and real-time capture',
    play: 'Play',
    pause: 'Pause',
    replay: 'Replay',
    prevFrame: 'Prev Frame',
    nextFrame: 'Next Frame',
    loop: 'Loop',
    speed: 'Speed',
    volume: 'Volume',
    mute: 'Mute',
    unmute: 'Unmute',
    exportVideo: 'Record Video (WebM/MP4)',
    recording: 'Recording Canvas Stream...',
    exportJson: 'Export Storyboard JSON',
    snapshotFrame: 'Snapshot PNG Frame',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit Fullscreen',
    
    // Tracks
    trackVisual: 'Visual Chapters & Transitions',
    trackMotion: 'Motion Graphics Layers',
    trackScript: 'Narration & Subtitles',
    trackAudio: 'Audio Soundtrack & SFX Cues',
    
    // Inspector
    inspectorTitle: 'Chapter Code & Properties Inspector',
    inspectorSubtitle: 'Live procedural render code and artistic parameters',
    chapterName: 'Chapter Title',
    chapterDuration: 'Duration (ms)',
    transitionType: 'Transition Effect',
    accentColor: 'Primary Accent Color',
    secondaryColor: 'Secondary Color',
    visualNotes: 'Director Visual Instructions',
    voiceScript: 'Voiceover Script',
    proceduralCode: 'Procedural Render Code (Canvas2D / WebGL)',
    updateChapter: 'Apply Live Changes to Canvas',
    
    // Transitions
    transCrossfade: 'Crossfade',
    transZoomPunch: 'Zoom Punch',
    transWhipPan: 'Whip Pan',
    transGlitch: 'Glitch Distortion',
    transLightFlash: 'Light Flash',
    transIris: 'Iris Wipe',

    // Catalog
    catalogTitle: 'Motion Graphics & Style Catalog',
    catalogSubtitle: 'Curated library of motion graphics archetypes with live procedural previews',
    searchPlaceholder: 'Search 142+ styles by name, archetype, or keyword...',
    allCategories: 'All Categories',
    catKineticTypography: 'Kinetic Typography',
    cat3D: '3D & Spatial Mechanics',
    catGeometricMorph: 'Geometric Morphing',
    catDataInfographics: 'Data & Infographics',
    catBrandAtmosphere: 'Atmosphere & Textures',
    addToBrief: 'Add to Creative Brief',
    generateScene: 'Direct Scene in Room',
    viewDetails: 'Inspect Architecture',
    
    // Agent Crew
    crewTitle: 'Storyboard Agent Crew',
    crewSubtitle: 'Multi-agent creative collaboration pipeline',
    roleDirector: 'Film Director',
    roleMotionDesigner: 'Motion Designer',
    roleSoundComposer: 'Sound Composer',
    roleColorist: 'Colorist',
    roleQualityReviewer: 'Quality Reviewer',
    
    // Dialog & Feedback
    close: 'Close',
    successRecorded: 'Video successfully recorded and downloaded!',
    successCopied: 'Code copied to clipboard!',
    errorGenerate: 'Generation encountered an issue. Using fallback studio engine.',
  },
  zh: {
    appTitle: 'Kiteva',
    appSubtitle: 'AI 动态图形智能体',
    tagline: '将创意构想转化为动态图形短片、动力学排版与三维动态视觉',
    navCreativeRoom: '创意室 (Creative Room)',
    navProductionDesk: '制作台 (Production Desk)',
    navMotionCatalog: '风格探索库 (Motion Explorer)',
    navTechnologyPool: '技术池 (Tech Pool)',
    
    // Creative Room
    briefPlaceholder: '描述您的创意愿景、脚本或核心概念... (例如：一部极具未来科技感的光学全息神经网络发布片，伴随轨道线框几何与动力学字体)',
    briefLabel: '创意简报与叙事导演指令',
    generateButton: '由 AI 智能体生成动态短片',
    generating: '智能体导演组正在构思并生成...',
    quickPrompts: '灵感简报预设',
    aspectRatio: '画面画幅',
    duration: '影片总时长',
    audioSoundtrack: '音乐基底与调性',
    voiceNarration: '旁白声音风格',
    styleCombinations: '选中的动态图形风格',
    noStylesSelected: '在下方选择 1-3 种风格，或交由 AI 自主编排',
    seconds: '秒',
    
    // Audio Moods
    moodCyberSynth: '赛博合成波 (128 BPM)',
    moodAmbientSpace: '深空氛围音景 (80 BPM)',
    moodMinimalTech: '极简科技节拍 (118 BPM)',
    moodLofiBeat: 'Lo-Fi 放松律动 (85 BPM)',
    moodCinematicTension: '电影张力低音 (92 BPM)',

    // Presets
    presetAiLaunch: 'Neural OS: 新一代智能中枢系统首发',
    presetQuantum: 'Quantum Matrix: 亚原子量子计算突破',
    presetCyberpunk: 'Cybernetic Horizon: 自治城市霓虹网络',
    presetFintech: 'Apex Protocol: 高频去中心化流动性协议',
    presetMinimalist: 'Bauhaus Movement: 包豪斯动力学建筑形态',

    // Production Desk
    deskTitle: '制作台与放映厅',
    deskSubtitle: '多轨道时间轴、实时音频合成、代码检查器与高清媒体录制',
    play: '播放',
    pause: '暂停',
    replay: '重头播放',
    prevFrame: '上一帧',
    nextFrame: '下一帧',
    loop: '循环',
    speed: '倍速',
    volume: '音量',
    mute: '静音',
    unmute: '取消静音',
    exportVideo: '录制视频 (WebM/MP4)',
    recording: '正在录制画面流...',
    exportJson: '导出分镜脚本 (JSON)',
    snapshotFrame: '抓取当前帧 (PNG)',
    fullscreen: '全屏模式',
    exitFullscreen: '退出全屏',
    
    // Tracks
    trackVisual: '视觉分镜与转场',
    trackMotion: '动态图形图层',
    trackScript: '旁白解说与字幕',
    trackAudio: '背景配乐与音效点',
    
    // Inspector
    inspectorTitle: '分镜代码与属性检查器',
    inspectorSubtitle: '程序化渲染源码与实时艺术参数',
    chapterName: '分镜标题',
    chapterDuration: '分镜时长 (毫秒)',
    transitionType: '分镜转场效果',
    accentColor: '主强调色',
    secondaryColor: '辅助高光色',
    visualNotes: '导演视觉提示词',
    voiceScript: '旁白台词',
    proceduralCode: '程序化渲染代码 (Canvas2D / WebGL)',
    updateChapter: '应用并热更新画布',
    
    // Transitions
    transCrossfade: '平滑叠化 (Crossfade)',
    transZoomPunch: '冲击推进 (Zoom Punch)',
    transWhipPan: '快速摇移 (Whip Pan)',
    transGlitch: '数码故障 (Glitch)',
    transLightFlash: '过曝高光 (Light Flash)',
    transIris: '圆形缩放 (Iris Wipe)',

    // Catalog
    catalogTitle: '动态图形与风格宝库',
    catalogSubtitle: '收录精选动态图形原型，配备实时程序化预览',
    searchPlaceholder: '搜索 142+ 种风格名称、类型或关键词...',
    allCategories: '全部类别',
    catKineticTypography: '动力学排版 (Kinetic Typography)',
    cat3D: '3D 空间力学 (3D & Spatial)',
    catGeometricMorph: '几何形变 (Geometric Morphing)',
    catDataInfographics: '数据信息图表 (Data & Infographics)',
    catBrandAtmosphere: '质感与氛围 (Atmosphere & FX)',
    addToBrief: '加入创意简报',
    generateScene: '进入创意室编排',
    viewDetails: '查看技术规格',
    
    // Agent Crew
    crewTitle: '分镜智能体工作组',
    crewSubtitle: '多智能体协同创意与渲染流水线',
    roleDirector: '总导演 (Film Director)',
    roleMotionDesigner: '动效设计师 (Motion Designer)',
    roleSoundComposer: '音乐作曲家 (Sound Composer)',
    roleColorist: '调色总监 (Colorist)',
    roleQualityReviewer: '质检审核员 (Quality Reviewer)',
    
    // Dialog & Feedback
    close: '关闭',
    successRecorded: '视频录制完成并已自动下载！',
    successCopied: '渲染代码已复制到剪贴板！',
    errorGenerate: '生成过程遇到轻微异常，已启用内置高精渲染引擎。',
  },
};

export function getTranslation(lang: UiLanguage, key: keyof typeof translations['en']): string {
  return translations[lang]?.[key] ?? translations['en'][key] ?? key;
}

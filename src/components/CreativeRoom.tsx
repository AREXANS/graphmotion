import React, { useState } from 'react';
import {
  Wand2,
  Film,
  Music,
  Maximize,
  Clock,
  Mic,
  CheckCircle2,
  ArrowRight,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  type AspectRatio,
  type AudioMood,
  type MotionStyleItem,
  type StoryboardProject,
  type UiLanguage,
  type AgentActivityStep,
} from '../types/index.ts';
import { MOTION_CATALOG } from '../data/motion-catalog.ts';
import { getTranslation } from '../i18n/translations.ts';

interface CreativeRoomProps {
  currentProject: StoryboardProject;
  language: UiLanguage;
  onProjectGenerated: (project: StoryboardProject) => void;
  onOpenDesk: () => void;
}

export const CreativeRoom: React.FC<CreativeRoomProps> = ({
  currentProject,
  language,
  onProjectGenerated,
  onOpenDesk,
}) => {
  const [brief, setBrief] = useState(currentProject.creativeBrief || '');
  const [duration, setDuration] = useState<number>(currentProject.durationSeconds || 15);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(currentProject.aspectRatio || '16:9');
  const [audioMood, setAudioMood] = useState<AudioMood>(currentProject.audioMood || 'cyberSynth');
  const [voiceStyle, setVoiceStyle] = useState<string>(currentProject.voiceStyle || 'Neutral Studio');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activitySteps, setActivitySteps] = useState<AgentActivityStep[]>([]);
  const [generatedSuccess, setGeneratedSuccess] = useState(false);

  const toggleStyle = (id: string) => {
    setSelectedStyles((prev) => {
      if (prev.includes(id)) {
        return prev.filter((s) => s !== id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const setPresetBrief = (presetText: string) => {
    setBrief(presetText);
  };

  const handleGenerate = async () => {
    if (!brief.trim()) return;
    setIsGenerating(true);
    setGeneratedSuccess(false);

    // Initial pending steps for real-time visual progress
    const initialSteps: AgentActivityStep[] = [
      {
        id: 'step-1',
        role: 'Director',
        roleZh: '总导演',
        action: 'Analyzing creative brief & structuring dramatic pacing',
        actionZh: '解析创意简报意图，推导电影级叙事节奏与分镜切分点',
        status: 'running',
        timestamp: Date.now(),
      },
      {
        id: 'step-2',
        role: 'Motion Designer',
        roleZh: '动效设计师',
        action: 'Composing procedural motion archetypes & camera choreographies',
        actionZh: '构思程序化运动原型与空间摄像机运镜轨迹',
        status: 'pending',
        timestamp: Date.now(),
      },
      {
        id: 'step-3',
        role: 'Sound Composer',
        roleZh: '音乐作曲家',
        action: 'Arranging synchronized audio bed, harmonic chords & transition SFX',
        actionZh: '程序化合成和弦基底、低频节拍脉冲与关键转场音效点',
        status: 'pending',
        timestamp: Date.now(),
      },
      {
        id: 'step-4',
        role: 'Colorist',
        roleZh: '调色总监',
        action: 'Color grading lighting palettes and atmospheric shaders',
        actionZh: '校准高动态色彩矩阵与发光光晕材质',
        status: 'pending',
        timestamp: Date.now(),
      },
      {
        id: 'step-5',
        role: 'Quality Reviewer',
        roleZh: '质检审核员',
        action: 'Checking 60fps frame rate bounds and audio synchronization',
        actionZh: '验证 60fps 帧率平滑度、安全边距与多轨时钟同步率',
        status: 'pending',
        timestamp: Date.now(),
      },
    ];
    setActivitySteps(initialSteps);

    try {
      const response = await fetch('/api/agent/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief,
          durationSeconds: duration,
          aspectRatio,
          audioMood,
          voiceStyle,
          selectedStyles,
          language,
        }),
      });

      const data = await response.json();

      if (data && data.chapters && data.chapters.length > 0) {
        const newProject: StoryboardProject = {
          id: `proj-${Date.now().toString(36)}`,
          title: data.title || (language === 'zh' ? `动态短片: ${brief.slice(0, 20)}` : `Film: ${brief.slice(0, 24)}`),
          titleZh: data.titleZh,
          aspectRatio,
          resolution: '1080p',
          durationSeconds: duration,
          audioMood,
          voiceStyle,
          language,
          chapters: data.chapters,
          creativeBrief: brief,
          createdAt: Date.now(),
        };

        if (data.agentActivity && data.agentActivity.length > 0) {
          setActivitySteps(data.agentActivity);
        } else {
          setActivitySteps((prev) => prev.map((s) => ({ ...s, status: 'completed' })));
        }

        onProjectGenerated(newProject);
        setGeneratedSuccess(true);
      }
    } catch (err) {
      console.error('Failed to generate film:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Hero */}
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium">
            <Wand2 className="w-3.5 h-3.5" />
            <span>Kiteva Creative Room · AI Motion Agent</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {getTranslation(language, 'navCreativeRoom')}
          </h1>
          <p className="text-zinc-400 text-sm max-w-2xl">
            {getTranslation(language, 'tagline')}
          </p>
        </div>

        {/* Quick Inspiration Presets */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            {getTranslation(language, 'quickPrompts')}
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              {
                id: 'p1',
                label: getTranslation(language, 'presetAiLaunch'),
                brief:
                  language === 'zh'
                    ? '一部充满未来感的 Neural OS 自治智能发布短片，融合动力学文字接力、3D 空间陀螺仪与赛博视界网格'
                    : 'A futuristic teaser announcing Neural OS with kinetic typography, 3D orbital gyroscopes, and a glowing brand reveal.',
              },
              {
                id: 'p2',
                label: getTranslation(language, 'presetQuantum'),
                brief:
                  language === 'zh'
                    ? '亚原子量子计算突破短片，展示高维环面纽结、同心遥测雷达与相干态粒子流'
                    : 'Quantum computing milestone film featuring parametric torus knots, circular telemetry HUD radar, and particle coherence.',
              },
              {
                id: 'p3',
                label: getTranslation(language, 'presetCyberpunk'),
                brief:
                  language === 'zh'
                    ? '赛博朋克自主城市网络，霓虹公路透视、显像管荧光扫描线与乱码终端解码'
                    : 'Cybernetic horizon city grid with synthwave undulating highway, retro burning sun, and CRT scanlines.',
              },
              {
                id: 'p4',
                label: getTranslation(language, 'presetFintech'),
                brief:
                  language === 'zh'
                    ? '高频去中心化金融流动性协议发布，量子 K 线动能涌现与机械翻牌计数器'
                    : 'Next-generation algorithmic liquidity protocol featuring candlestick volatility surges and mechanical split-flap numbers.',
              },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPresetBrief(p.brief)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 transition"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Narrative Brief Input Area */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
            <span>{getTranslation(language, 'briefLabel')}</span>
            <span className="text-zinc-500 font-normal lowercase">{brief.length} chars</span>
          </label>
          <div className="relative">
            <textarea
              rows={4}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder={getTranslation(language, 'briefPlaceholder')}
              className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-sky-500 rounded-xl p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-inner"
            />
          </div>
        </div>

        {/* Film Production Settings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Aspect Ratio */}
          <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80 space-y-2">
            <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              <Maximize className="w-3.5 h-3.5 text-sky-400" />
              <span>{getTranslation(language, 'aspectRatio')}</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {(['16:9', '9:16', '1:1', '4:5'] as AspectRatio[]).map((ar) => (
                <button
                  key={ar}
                  onClick={() => setAspectRatio(ar)}
                  className={`py-1.5 px-2 rounded-md font-medium transition ${
                    aspectRatio === ar
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80 space-y-2">
            <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{getTranslation(language, 'duration')}</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5 text-xs">
              {[5, 10, 15, 30].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setDuration(sec)}
                  className={`py-1.5 rounded-md font-medium transition ${
                    duration === sec
                      ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                      : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Audio Soundtrack Mood */}
          <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80 space-y-2">
            <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-emerald-400" />
              <span>{getTranslation(language, 'audioSoundtrack')}</span>
            </label>
            <select
              value={audioMood}
              onChange={(e) => setAudioMood(e.target.value as AudioMood)}
              className="w-full bg-zinc-800 border border-zinc-700/80 rounded-md py-1.5 px-2 text-xs text-zinc-200"
            >
              <option value="cyberSynth">{getTranslation(language, 'moodCyberSynth')}</option>
              <option value="ambientSpace">{getTranslation(language, 'moodAmbientSpace')}</option>
              <option value="minimalTech">{getTranslation(language, 'moodMinimalTech')}</option>
              <option value="lofiBeat">{getTranslation(language, 'moodLofiBeat')}</option>
              <option value="cinematicTension">{getTranslation(language, 'moodCinematicTension')}</option>
            </select>
          </div>

          {/* Voiceover Style */}
          <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80 space-y-2">
            <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-pink-400" />
              <span>{getTranslation(language, 'voiceNarration')}</span>
            </label>
            <select
              value={voiceStyle}
              onChange={(e) => setVoiceStyle(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700/80 rounded-md py-1.5 px-2 text-xs text-zinc-200"
            >
              <option value="Neutral Studio">Neutral Studio (Clear / Balanced)</option>
              <option value="Warm Narrator">Warm Narrator (Documentary)</option>
              <option value="Energetic Tech">Energetic Tech (Punchy Keynote)</option>
              <option value="Cinematic Deep">Cinematic Deep (Trailer)</option>
            </select>
          </div>
        </div>

        {/* Motion Style Combination Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>{getTranslation(language, 'styleCombinations')}</span>
              <span className="text-zinc-500 font-normal">({selectedStyles.length}/3)</span>
            </label>
            <span className="text-xs text-zinc-400">
              {selectedStyles.length === 0
                ? getTranslation(language, 'noStylesSelected')
                : `${selectedStyles.length} styles pinned for director`}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {MOTION_CATALOG.slice(0, 12).map((item) => {
              const isSelected = selectedStyles.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleStyle(item.id)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-sky-500/15 border-sky-500 shadow-md shadow-sky-500/10'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      style={{ backgroundColor: item.accentColor }}
                      className="w-2.5 h-2.5 rounded-full"
                    />
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200 truncate">
                      {language === 'zh' ? item.nameZh : item.name}
                    </h4>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                      {item.categoryName}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Generate Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !brief.trim()}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-400 hover:via-indigo-400 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-sky-500/20 transition transform active:scale-98"
          >
            {isGenerating ? (
              <>
                <Wand2 className="w-4 h-4 animate-spin" />
                <span>{getTranslation(language, 'generating')}</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>{getTranslation(language, 'generateButton')}</span>
              </>
            )}
          </button>

          {generatedSuccess && (
            <button
              onClick={onOpenDesk}
              className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition animate-bounce"
            >
              <span>{getTranslation(language, 'navProductionDesk')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Agent Activity Pipeline View */}
        {activitySteps.length > 0 && (
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-sky-400" />
                <h3 className="font-semibold text-sm text-zinc-100">
                  {getTranslation(language, 'crewTitle')}
                </h3>
              </div>
              <span className="text-xs text-zinc-400">
                {getTranslation(language, 'crewSubtitle')}
              </span>
            </div>

            <div className="space-y-2.5">
              {activitySteps.map((step) => {
                const isStepRunning = step.status === 'running';
                const isStepCompleted = step.status === 'completed';

                return (
                  <div
                    key={step.id}
                    className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60 text-xs"
                  >
                    <div className="mt-0.5">
                      {isStepCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : isStepRunning ? (
                        <div className="w-4 h-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-zinc-700" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sky-300">
                          {language === 'zh' && step.roleZh ? step.roleZh : step.role}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {isStepCompleted ? 'VERIFIED' : isStepRunning ? 'ACTIVE' : 'QUEUED'}
                        </span>
                      </div>
                      <p className="text-zinc-300 mt-0.5">
                        {language === 'zh' && step.actionZh ? step.actionZh : step.action}
                      </p>
                      {step.details && (
                        <p className="text-zinc-500 text-[11px] font-mono mt-1">
                          {step.details}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

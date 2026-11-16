import React from 'react';
import { Cpu, Film, Music, ShieldCheck, Zap, Layers, Video, Wand2 } from 'lucide-react';
import { UiLanguage } from '../types';

interface TechnologyPoolProps {
  language: UiLanguage;
}

export const TechnologyPool: React.FC<TechnologyPoolProps> = ({ language }) => {
  const stacks = [
    {
      title: language === 'zh' ? 'Canvas 2D 动力学渲染引擎' : 'Canvas 2D Kinetic Engine',
      description:
        language === 'zh'
          ? '高频 60fps 像素级绘制管线，包含弹簧物理模拟、贝塞尔曲线形变、字块接力追踪与矩阵文字解码。'
          : 'High-frequency 60fps procedural pipeline with spring physics, Bezier morphing, bounding box tracking, and cipher unscrambling.',
      icon: Cpu,
      badge: 'Native 60 FPS',
      accent: 'from-sky-500 to-blue-600',
    },
    {
      title: language === 'zh' ? 'WebGL & Three.js 空间几何' : 'WebGL & Three.js Spatial 3D',
      description:
        language === 'zh'
          ? '正交万向三维轴陀螺仪、参数化 (3,5) 环面纽结曲线、合成波透视视界与等轴测全息 HUD 投影。'
          : 'Gimbal 3D rings, parametric (3,5) torus knot loops, synthwave horizon planes, and isometric glassmorphic slabs.',
      icon: Layers,
      badge: '3D Geometry',
      accent: 'from-purple-500 to-indigo-600',
    },
    {
      title: language === 'zh' ? 'Web Audio API 生成式配乐与音效' : 'Web Audio API Synth & SFX',
      description:
        language === 'zh'
          ? '零外链原生音频合成器：五度圈和弦垫音、低通滤波器扫频、808 次重低音落地冲击与转场故障杂音。'
          : 'Zero-asset synthetic audio engine: algorithmic chord progressions, resonant filter sweeps, 808 sub-drops, and synchronized whooshes.',
      icon: Music,
      badge: 'Real-time Audio',
      accent: 'from-emerald-500 to-teal-600',
    },
    {
      title: language === 'zh' ? '浏览器原生录屏与导出' : 'Browser Canvas Stream Capture',
      description:
        language === 'zh'
          ? '通过 canvas.captureStream() 与 MediaRecorder 硬件编码，直接在用户端无损录制生成高码率 WebM/MP4 视频文件。'
          : 'Direct client-side video encoding using canvas.captureStream() and MediaRecorder with zero server rendering lag or bandwidth cost.',
      icon: Video,
      badge: 'Hardware Encoded',
      accent: 'from-rose-500 to-pink-600',
    },
    {
      title: language === 'zh' ? 'Gemini 智能体导演流水线' : 'Gemini AI Agent Pipeline',
      description:
        language === 'zh'
          ? '集成总导演、动效设计师、音频作曲家、调色总监与质检员的协同结构，全自动拆解镜头与运动代码。'
          : 'Autonomous multi-role pipeline (Director, Motion Designer, Sound Composer, Colorist, Quality Reviewer) crafting complete productions.',
      icon: Wand2,
      badge: 'Gemini 3.8 Flash',
      accent: 'from-cyan-500 to-blue-600',
    },
    {
      title: language === 'zh' ? '跨语言双轨与时间码同步' : 'SMPTE Timecode & Subtitles',
      description:
        language === 'zh'
          ? '严苛的 MM:SS:FF 时间码标定，精准到帧的下三分之一字幕同步与中英双语台词支持。'
          : 'SMPTE MM:SS:FF frame-accurate timecode synchronization with lower-third subtitle banners in English and Chinese.',
      icon: Film,
      badge: 'SMPTE Standard',
      accent: 'from-cyan-500 to-blue-500',
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            {language === 'zh' ? 'Kiteva 技术池与架构体系' : 'Kiteva Technology Pool & Architecture'}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {language === 'zh'
              ? '深入探究驱动动态图形智能体的高性能图形渲染、音频合成与生成流水线'
              : 'Architectural specifications of the procedural graphics, synthetic audio, and agent pipelines'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {stacks.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3 shadow-lg hover:border-zinc-700 transition"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.accent} flex items-center justify-center text-white shadow-md`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                    {s.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-zinc-100">{s.title}</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">{s.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

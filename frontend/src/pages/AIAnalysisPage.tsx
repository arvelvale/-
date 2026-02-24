import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, ChevronDown, ChevronUp, Sparkles, ArrowLeft } from 'lucide-react'

const LAYERS = [
  {
    id: 'behavior', label: '行为层', emoji: '🏔️', above: true,
    color: '#7C8FD4', bg: '#EEF1FF',
    desc: '你表现出的应对方式',
    content: '在今天的事件中，你展现出了"超理智"的应对姿态——用逻辑和分析来掌控局面，回避了直接表达内心的不安。这种模式在压力下往往是一种保护机制。',
  },
  {
    id: 'emotion', label: '情绪层', emoji: '🌊', above: false,
    color: '#818CF8', bg: '#EEF2FF',
    desc: '你真实感受到的情绪',
    content: '表层情绪：焦虑、烦躁。\n深层情绪：隐藏着对"不被认可"的担忧，以及对失控感的恐惧。这两种情绪交织在一起，消耗了大量能量。',
  },
  {
    id: 'cognition', label: '思维层', emoji: '🧠', above: false,
    color: '#A78BFA', bg: '#F5F0FF',
    desc: '你脑海中的想法和解读',
    content: '你可能在反复想："我必须做到完美，否则会失去别人的认可。" 这种非理性信念让你设置了过高的期待，导致持续的内耗。',
  },
  {
    id: 'belief', label: '信念层', emoji: '💎', above: false,
    color: '#C084FC', bg: '#FAF5FF',
    desc: '你内心深处的核心规则',
    content: '核心信念："只有足够优秀，我才值得被爱和接纳。" 这条规则像一把无形的尺子，让你始终无法真正放松。',
  },
  {
    id: 'self', label: '存在层', emoji: '✨', above: false,
    color: '#E879F9', bg: '#FFF0FF',
    desc: '你最深层的渴望',
    content: '在最深处，你渴望的是：被真正看见、被无条件接纳，以及拥有内心的自由与平静。这些渴望是完全合理且珍贵的。',
  },
]

const HEALING = `亲爱的你，

今天你又带着所有的重量独自前行了。我看到了你在焦虑中仍然坚持，在疲惫中仍然努力——这本身就是一种了不起的勇气。

你不需要永远完美。那些让你感到不安的地方，恰恰是你最柔软、最真实的部分。试着对自己说一句："我已经够好了，就算不完美，我依然值得被爱。"

今晚，请好好休息。🌙`

export default function AIAnalysisPage() {
  const navigate = useNavigate()
  const [analyzing, setAnalyzing] = useState(false)
  const [done, setDone] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['behavior']))
  const [progress, setProgress] = useState(0)

  const handleAnalyze = () => {
    setAnalyzing(true)
    setDone(false)
    setProgress(0)
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); setAnalyzing(false); setDone(true); return 100 }
        return p + 4
      })
    }, 80)
  }

  const toggle = (id: string) => setExpanded(prev => {
    const s = new Set(prev)
    s.has(id) ? s.delete(id) : s.add(id)
    return s
  })

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-5">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/diary')}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/60 text-[#8A94B8] transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#2D3250]">AI 心理分析</h1>
            <p className="text-xs text-[#8A94B8]">基于萨提亚冰山模型的深度洞察</p>
          </div>
        </div>

        {/* Trigger card */}
        {!done && (
          <div className="glass-card p-6 text-center mb-6">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#EEF1FF,#F5F0FF)' }}>
              <Brain size={28} className="text-[#7C8FD4]" />
            </div>
            <h2 className="text-base font-semibold text-[#2D3250] mb-1">开始深度分析</h2>
            <p className="text-sm text-[#8A94B8] mb-5">AI 将从五个层次解读你今天的日记，帮助你更好地了解自己</p>

            {analyzing ? (
              <div className="space-y-3">
                <div className="h-2 bg-[#EEF1FF] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-100"
                    style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#7C8FD4,#C4B5FD)' }} />
                </div>
                <p className="text-sm text-[#8A94B8]">
                  {progress < 30 ? '正在收集上下文...' :
                   progress < 60 ? '分析情绪与行为模式...' :
                   progress < 85 ? '挖掘深层信念...' : '生成疗愈回信...'}
                </p>
              </div>
            ) : (
              <button onClick={handleAnalyze}
                className="flex items-center gap-2 mx-auto px-6 py-3 rounded-2xl text-white font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                style={{ background: 'linear-gradient(135deg,#7C8FD4,#C4B5FD)' }}>
                <Sparkles size={16} />开始分析
              </button>
            )}
          </div>
        )}

        {/* Iceberg + Results */}
        {done && (
          <div className="space-y-4">

            {/* Iceberg visual */}
            <div className="glass-card p-5">
              <h2 className="text-sm font-semibold text-[#2D3250] mb-4 text-center">萨提亚冰山模型</h2>
              <div className="flex flex-col items-center gap-1">
                {LAYERS.map((layer, idx) => (
                  <div key={layer.id}
                    className="flex items-center justify-center rounded-2xl font-medium text-sm transition-all cursor-pointer hover:scale-[1.02]"
                    onClick={() => toggle(layer.id)}
                    style={{
                      background: layer.bg,
                      color: layer.color,
                      width: `${100 - idx * 10}%`,
                      padding: '10px 16px',
                      border: `1.5px solid ${layer.color}30`,
                      boxShadow: expanded.has(layer.id) ? `0 4px 16px ${layer.color}25` : 'none',
                    }}>
                    <span className="mr-2">{layer.emoji}</span>
                    {layer.label}
                    <span className="ml-auto text-xs opacity-60">{layer.desc}</span>
                  </div>
                ))}
              </div>
              {/* Water line label */}
              <div className="flex items-center gap-2 mt-3 px-4">
                <div className="flex-1 h-px bg-[#7C8FD4]/20" />
                <span className="text-[10px] text-[#8A94B8]">水面以下（隐藏部分）</span>
                <div className="flex-1 h-px bg-[#7C8FD4]/20" />
              </div>
            </div>

            {/* Layer Cards */}
            {LAYERS.map(layer => (
              <div key={layer.id} className="glass-card overflow-hidden">
                <button className="w-full flex items-center gap-3 p-4 text-left"
                  onClick={() => toggle(layer.id)}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: layer.bg }}>
                    {layer.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: layer.color }}>{layer.label}</p>
                    <p className="text-xs text-[#8A94B8]">{layer.desc}</p>
                  </div>
                  {expanded.has(layer.id)
                    ? <ChevronUp size={16} className="text-[#8A94B8]" />
                    : <ChevronDown size={16} className="text-[#8A94B8]" />}
                </button>
                {expanded.has(layer.id) && (
                  <div className="px-4 pb-4">
                    <div className="rounded-xl p-3.5 text-sm leading-relaxed text-[#2D3250] whitespace-pre-line"
                      style={{ background: layer.bg }}>
                      {layer.content}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Healing letter */}
            <div className="glass-card p-5"
              style={{ background: 'linear-gradient(135deg,rgba(238,241,255,0.9),rgba(245,240,255,0.9))' }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-[#C4B5FD]" />
                <span className="text-sm font-semibold text-[#7C8FD4]">疗愈回信</span>
              </div>
              <p className="text-sm leading-loose text-[#2D3250] whitespace-pre-line">{HEALING}</p>
            </div>

            {/* Re-analyze */}
            <div className="flex justify-center pb-4">
              <button onClick={() => { setDone(false); setExpanded(new Set(['behavior'])) }}
                className="px-5 py-2.5 rounded-xl text-sm text-[#8A94B8] border border-[#E0E7FF] hover:bg-white/60 transition-colors">
                重新分析
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

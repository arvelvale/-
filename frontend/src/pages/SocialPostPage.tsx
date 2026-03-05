import { useState } from 'react'
import { Sparkles, Copy, Check, RefreshCw, Edit3 } from 'lucide-react'
import { socialApi } from '../lib/api'

const STYLES = [
  { key: 'minimal',    label: '文艺极简', emoji: '🍃', desc: '留白美学，意境深远',     color: '#4CAF50', bg: '#E8F5E9' },
  { key: 'career',     label: '职场干货', emoji: '💼', desc: '专业感，传递价值',       color: '#7C8FD4', bg: '#EEF1FF' },
  { key: 'humor',      label: '幽默自嘲', emoji: '😂', desc: '轻松有趣，引发共鸣',     color: '#F9A825', bg: '#FFF8E1' },
  { key: 'emotional',  label: '深情小作文', emoji: '💌', desc: '细腻温柔，打动人心', color: '#E91E8C', bg: '#FFF0F5' },
  { key: 'life',       label: '生活记录', emoji: '📷', desc: '真实日常，自然流露',     color: '#9C6FD4', bg: '#F3ECFF' },
]

function Toast({ msg }: { msg: string }) {
  if (!msg) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl text-sm font-medium text-white shadow-lg"
      style={{ background: 'linear-gradient(135deg,#7C8FD4,#C4B5FD)' }}>
      {msg}
    </div>
  )
}

export default function SocialPostPage() {
  const [selStyle, setSelStyle] = useState('minimal')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [posts, setPosts] = useState<string[]>([])
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [catchphrase, setCatchphrase] = useState('')
  const [toast, setToast] = useState('')

  const tip = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  const handleGenerate = async () => {
    const diaryId = localStorage.getItem('currentDiaryId')
    const diaryContent = localStorage.getItem('currentDiaryContent') || ''

    if (!diaryId && !diaryContent) {
      tip('请先选择或输入要生成文案的内容')
      return
    }

    setGenerating(true)
    setGenerated(false)

    try {
      const res = await socialApi.generate({
        diaryId: diaryId ? Number(diaryId) : undefined,
        content: diaryContent,
        style: selStyle,
        catchphrases: catchphrase ? [catchphrase] : [],
      })

      const data = res.data?.data
      if (data?.posts && data.posts.length > 0) {
        setPosts(data.posts)
        setGenerated(true)
      } else {
        // API返回空数据，使用模拟数据
        setTimeout(() => {
          setPosts(['文案生成功能开发中，请稍后重试'])
          setGenerating(false)
          setGenerated(true)
        }, 1600)
      }
    } catch (err) {
      console.error('Generate failed:', err)
      tip('生成失败，请稍后重试')
      setGenerating(false)
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx)
      tip('已复制到剪贴板 ✅')
      setTimeout(() => setCopiedIdx(null), 2000)
    })
  }

  const handleEdit = (idx: number, text: string) => {
    setEditIdx(idx)
    setEditText(text)
  }

  const handleSaveEdit = () => {
    if (editIdx === null) return
    const next = [...posts]
    next[editIdx] = editText
    setPosts(next)
    setEditIdx(null)
    tip('已保存修改 ✅')
  }

  const style = STYLES.find(s => s.key === selStyle)!

  return (
    <>
      <Toast msg={toast} />
      <div className="absolute inset-0 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-5 space-y-5">

          {/* Header */}
          <div>
            <h1 className="text-xl font-bold text-[#2D3250]">朋友圈文案工坊</h1>
            <p className="text-sm text-[#8A94B8] mt-0.5">将今天的日记变成一条有温度的朋友圈</p>
          </div>

          {/* Style Selector */}
          <div className="glass-card p-4">
            <p className="text-sm font-semibold text-[#2D3250] mb-3">选择文案风格</p>
            <div className="flex gap-2 flex-wrap">
              {STYLES.map(s => (
                <button key={s.key} onClick={() => { setSelStyle(s.key); setGenerated(false) }}
                  className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border-2 transition-all duration-200"
                  style={{
                    background: selStyle === s.key ? s.bg : 'white',
                    borderColor: selStyle === s.key ? s.color : '#E0E7FF',
                    color: selStyle === s.key ? s.color : '#8A94B8',
                    transform: selStyle === s.key ? 'scale(1.04)' : 'scale(1)',
                    boxShadow: selStyle === s.key ? `0 4px 16px ${s.color}25` : 'none',
                  }}>
                  <span className="text-xl">{s.emoji}</span>
                  <span className="text-xs font-semibold whitespace-nowrap">{s.label}</span>
                  <span className="text-[10px] opacity-70 whitespace-nowrap">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Catchphrase */}
          <div className="glass-card px-4 py-3">
            <p className="text-sm font-medium text-[#2D3250] mb-2">口头禅（可选）</p>
            <input value={catchphrase} onChange={e => setCatchphrase(e.target.value)}
              placeholder="例：人间值得、yyds、笑死我了..."
              className="w-full text-sm text-[#2D3250] placeholder-[#C4C9E8] bg-[#F8F9FF] rounded-xl px-3 py-2.5 border border-[#E0E7FF] focus:outline-none focus:border-[#7C8FD4] transition-colors" />
          </div>

          {/* Generate Button */}
          <button onClick={handleGenerate} disabled={generating}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#7C8FD4,#C4B5FD)' }}>
            {generating
              ? <><RefreshCw size={16} className="animate-spin" />生成中...</>
              : <><Sparkles size={16} />一键生成文案</>}
          </button>

          {/* Generated Posts */}
          {generated && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                  style={{ background: style.bg, color: style.color }}>{style.emoji}</div>
                <p className="text-sm font-semibold text-[#2D3250]">{style.label}风格 · {posts.length} 个版本</p>
              </div>

              {posts.map((post, idx) => (
                <div key={idx} className="glass-card overflow-hidden">
                  {editIdx === idx ? (
                    <div className="p-4">
                      <textarea value={editText} onChange={e => setEditText(e.target.value)}
                        className="w-full text-sm text-[#2D3250] leading-relaxed bg-[#F8F9FF] rounded-xl p-3 border border-[#E0E7FF] focus:outline-none focus:border-[#7C8FD4] resize-none min-h-[100px]" />
                      <div className="flex gap-2 mt-2 justify-end">
                        <button onClick={() => setEditIdx(null)}
                          className="px-3 py-1.5 rounded-lg text-xs text-[#8A94B8] hover:bg-[#F0F4FF] transition-colors">取消</button>
                        <button onClick={handleSaveEdit}
                          className="px-3 py-1.5 rounded-lg text-xs text-white transition-colors"
                          style={{ background: '#7C8FD4' }}>保存</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-4">
                        <p className="text-sm text-[#2D3250] leading-loose whitespace-pre-line">{post}</p>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#F0F4FF]">
                        <span className="text-[10px] text-[#C4C9E8]">版本 {idx + 1}</span>
                        <div className="flex gap-1.5">
                          <button onClick={() => handleEdit(idx, post)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-[#8A94B8] hover:bg-[#F0F4FF] transition-colors">
                            <Edit3 size={12} />编辑
                          </button>
                          <button onClick={() => handleCopy(post, idx)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-white transition-colors"
                            style={{ background: copiedIdx === idx ? '#4CAF50' : '#7C8FD4' }}>
                            {copiedIdx === idx ? <><Check size={12} />已复制</> : <><Copy size={12} />复制</>}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Hashtags */}
              <div className="glass-card px-4 py-3">
                <p className="text-xs font-medium text-[#8A94B8] mb-2">推荐话题标签</p>
                <div className="flex flex-wrap gap-1.5">
                  {['#生活记录', '#日常碎片', '#今日份心情', '#成长日记', '#内心独白'].map(tag => (
                    <button key={tag} onClick={() => handleCopy(tag, -1)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                      style={{ background: style.bg, color: style.color }}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

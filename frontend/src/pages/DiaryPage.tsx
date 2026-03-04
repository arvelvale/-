import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import ReactMarkdown from 'react-markdown'
import {
  Bold, Italic, Heading1, Heading2, List, ListOrdered,
  Quote, Code2, Link, Image, Plus, Brain, Save, Eye, Edit3,
} from 'lucide-react'
import { diaryApi } from '../lib/api'

const EMOTIONS = [
  { key: 'anxious',  label: '焦虑', emoji: '🌧️', bg: '#E8EEFF', color: '#7C8FD4' },
  { key: 'happy',    label: '开心', emoji: '😊',  bg: '#FFF8E1', color: '#F9A825' },
  { key: 'sad',      label: '委屈', emoji: '💧',  bg: '#F3ECFF', color: '#9C6FD4' },
  { key: 'calm',     label: '平静', emoji: '🌿',  bg: '#E8F5E9', color: '#4CAF50' },
  { key: 'angry',    label: '愤怒', emoji: '🔥',  bg: '#FFF0EE', color: '#EF5350' },
  { key: 'grateful', label: '感恩', emoji: '🌸',  bg: '#FFF0F5', color: '#E91E8C' },
]

interface Diary {
  id: number; date: string; title: string
  content?: string; emotion: string; importanceScore?: number
}


/* ── Mini Calendar ─────────────────────────────────────── */
function MiniCalendar({ selected, onSelect }: { selected: dayjs.Dayjs; onSelect: (d: dayjs.Dayjs) => void }) {
  const [cur, setCur] = useState(dayjs())
  const startDow = cur.startOf('month').day()
  const dim = cur.daysInMonth()
  const cells: (number | null)[] = [...Array(startDow).fill(null)]
  for (let i = 1; i <= dim; i++) cells.push(i)
  while (cells.length % 7 !== 0) cells.push(null)
  const dot = (d: number) => [1, 6, 7, 14, 22, 26, 28].includes(d)

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <button onClick={() => setCur(c => c.subtract(1, 'month'))}
          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-[#7C8FD4]/10 text-[#8A94B8] text-base">‹</button>
        <span className="text-sm font-semibold text-[#2D3250]">{cur.format('YYYY年M月')}</span>
        <button onClick={() => setCur(c => c.add(1, 'month'))}
          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-[#7C8FD4]/10 text-[#8A94B8] text-base">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['日','一','二','三','四','五','六'].map(d => (
          <div key={d} className="text-center text-[10px] text-[#8A94B8] py-0.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="h-7" />
          const isToday = day === dayjs().date() && cur.month() === dayjs().month() && cur.year() === dayjs().year()
          const isSel = day === selected.date() && cur.month() === selected.month() && cur.year() === selected.year()
          return (
            <div key={i} className="flex flex-col items-center mb-0.5">
              <button onClick={() => onSelect(cur.date(day))}
                className={`w-7 h-7 rounded-full text-[11px] font-medium transition-all ${
                  isSel   ? 'bg-[#7C8FD4] text-white shadow-sm' :
                  isToday ? 'bg-[#7C8FD4]/15 text-[#7C8FD4] font-bold' :
                            'text-[#2D3250] hover:bg-[#7C8FD4]/10'}`}>
                {day}
              </button>
              {dot(day) && !isSel && <div className="w-1 h-1 rounded-full bg-[#7C8FD4] mt-0.5" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Toast ─────────────────────────────────────────────── */
function Toast({ msg }: { msg: string }) {
  if (!msg) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl text-sm font-medium text-white shadow-lg"
      style={{ background: 'linear-gradient(135deg,#7C8FD4,#C4B5FD)' }}>
      {msg}
    </div>
  )
}

/* ── Main Page ──────────────────────────────────────────── */
export default function DiaryPage() {
  const navigate = useNavigate()
  const [diaries, setDiaries] = useState<Diary[]>([])
  const [selDate, setSelDate] = useState(dayjs())
  const [selId, setSelId] = useState<number>(-1)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [emotion, setEmotion] = useState('calm')
  const [importance, setImportance] = useState(7)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isLoggedIn = !!localStorage.getItem('token')

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string
        setImages(prev => [...prev, dataUrl])
        tip('图片已添加 📷')
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  /* load diaries from API */
  const loadDiaries = async () => {
    if (!isLoggedIn) return
    try {
      const res = await diaryApi.list({ pageSize: 50 })
      const items: any[] = res.data?.data?.diaries ?? res.data?.diaries ?? []
      const mapped: Diary[] = items.map(d => ({
        id: d.diaryId ?? d.id,
        date: dayjs(d.diaryDate).format('MM-DD'),
        title: d.title || d.contentPreview?.slice(0, 12) + '…',
        content: d.contentPreview ?? '',
        emotion: d.emotionTags?.[0] ?? 'calm',
        importanceScore: d.importanceScore,
      }))
      setDiaries(mapped)
      if (mapped.length > 0 && selId === -1) {
        setSelId(mapped[0].id)
      }
    } catch (e) {
      console.error('Failed to load diaries:', e)
    }
  }

  useEffect(() => {
    loadDiaries()
  }, [isLoggedIn])

  /* populate editor when switching diary */
  const selDiary = diaries.find(d => d.id === selId) ?? diaries[0]
  useEffect(() => {
    if (!selDiary) return
    setTitle(selDiary.title.replace(/…$/, ''))
    setContent(selDiary.content ?? '')
    setEmotion(selDiary.emotion)
    setImportance(selDiary.importanceScore ?? 7)
  }, [selId])

  const tip = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const handleSave = async () => {
    if (!content.trim()) { tip('请先写点内容 📝'); return }
    if (!isLoggedIn) { tip('请先登录后再保存'); return }
    setSaving(true)
    try {
      const isNewDiary = selId <= 0
      if (isNewDiary) {
        const res = await diaryApi.create({
          title: title || selDate.format('M月D日的日记'),
          content,
          diaryDate: selDate.format('YYYY-MM-DD'),
          emotionTags: [emotion],
          importanceScore: importance,
        })
        const newId = res.data?.data?.diaryId ?? res.data?.diaryId
        tip('保存成功 ✅')
        await loadDiaries()
        if (newId) setSelId(newId)
      } else {
        await diaryApi.update(selId, {
          title: title || undefined,
          content,
          emotionTags: [emotion],
          importanceScore: importance,
        })
        tip('更新成功 ✅')
        await loadDiaries()
      }
    } catch (e) {
      console.error('Save failed:', e)
      tip('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleNew = () => {
    setSelId(-1); setTitle(''); setContent(''); setEmotion('calm'); setImportance(7); setSelDate(dayjs())
  }

  const toolbar = [
    { Icon: Bold, t: '粗体' }, { Icon: Italic, t: '斜体' },
    { Icon: Heading1, t: 'H1' }, { Icon: Heading2, t: 'H2' },
    { Icon: List, t: '列表' }, { Icon: ListOrdered, t: '有序列表' },
    { Icon: Quote, t: '引用' }, { Icon: Code2, t: '代码' },
    { Icon: Link, t: '链接' }, { Icon: Image, t: '图片' },
  ]
  const sepAfter = new Set([3, 5, 7])

  return (
    <>
      <Toast msg={toast} />
      {/* root: fills parent <main> via absolute inset */}
      <div className="absolute inset-0 flex overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className="w-52 flex-shrink-0 flex flex-col overflow-y-auto border-r border-white/60 py-3 px-2.5"
          style={{ background: 'rgba(240,244,255,0.75)' }}>

          <div className="glass-card p-3 mb-3 flex-shrink-0">
            <MiniCalendar selected={selDate} onSelect={setSelDate} />
          </div>

          <p className="text-[10px] font-semibold text-[#8A94B8] mb-1.5 px-1 uppercase tracking-wide">日记列表</p>
          <div className="flex-1 space-y-0.5 min-h-0">
            {diaries.map(d => (
              <button key={d.id} onClick={() => setSelId(d.id)}
                className={`w-full text-left px-2.5 py-2 rounded-xl transition-all ${
                  selId === d.id ? 'bg-[#7C8FD4]/20 border border-[#7C8FD4]/30' : 'hover:bg-white/60'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#8A94B8] flex-shrink-0">{d.date}</span>
                  <span className="text-xs text-[#2D3250] truncate">{d.title}</span>
                </div>
              </button>
            ))}
          </div>

          <button onClick={handleNew}
            className="mt-2 flex-shrink-0 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[#7C8FD4] text-xs font-medium border border-dashed border-[#7C8FD4]/40 hover:bg-[#7C8FD4]/10 transition-colors">
            <Plus size={13} />新建日记
          </button>
        </aside>

        {/* ── Editor ── */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

          {/* Date + title row */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#8A94B8] flex-shrink-0">{selDate.format('YYYY年M月D日')}</span>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="给今天取个标题..."
              className="flex-1 text-base font-semibold text-[#2D3250] placeholder-[#C4C9E8] bg-transparent border-none focus:outline-none" />
          </div>

          {/* Rich-text card */}
          <div className="glass-card overflow-hidden flex-1 flex flex-col min-h-0">
            {/* Toolbar */}
            <div className="flex items-center flex-wrap gap-0.5 px-3 py-2 border-b border-[#E8EEFF]">
              {toolbar.map(({ Icon, t }, idx) => (
                <span key={t} className="inline-flex items-center">
                  <button title={t}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#5B6FBE] hover:bg-[#7C8FD4]/10 transition-colors">
                    <Icon size={15} />
                  </button>
                  {sepAfter.has(idx) && <span className="w-px h-5 bg-[#E0E7FF] mx-1" />}
                </span>
              ))}
              <span className="flex-1" />
              <button onClick={() => setPreviewMode(!previewMode)} title={previewMode ? '编辑' : '预览'}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  previewMode ? 'bg-[#7C8FD4] text-white' : 'text-[#5B6FBE] hover:bg-[#7C8FD4]/10'}`}>
                {previewMode ? <><Edit3 size={13} />编辑</> : <><Eye size={13} />预览</>}
              </button>
            </div>
            {/* Editor / Preview */}
            {previewMode ? (
              <div className="flex-1 w-full p-4 overflow-y-auto prose prose-sm prose-slate max-w-none min-h-[200px]">
                <ReactMarkdown>{content || '*暂无内容*'}</ReactMarkdown>
              </div>
            ) : (
              <textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder="支持 Markdown 语法：## 标题、- 列表、**粗体** 等..."
                className="flex-1 w-full p-4 resize-none focus:outline-none text-[#2D3250] placeholder-[#C4C9E8] text-sm leading-relaxed bg-transparent min-h-[200px] font-mono" />
            )}
          </div>

          {/* Emotion Tags */}
          <div className="flex flex-wrap gap-2">
            {EMOTIONS.map(em => (
              <button key={em.key} onClick={() => setEmotion(em.key)}
                className="emotion-pill"
                style={{
                  background: em.bg, color: em.color,
                  borderColor: emotion === em.key ? em.color : 'transparent',
                  fontWeight: emotion === em.key ? 600 : 500,
                  transform: emotion === em.key ? 'scale(1.04)' : 'scale(1)',
                  boxShadow: emotion === em.key ? `0 4px 12px ${em.color}30` : 'none',
                }}>
                <span>{em.emoji}</span>{em.label}
              </button>
            ))}
          </div>

          {/* Importance Slider */}
          <div className="glass-card px-5 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#2D3250]">重要性 (1-10)</span>
              <span className="text-sm font-bold text-[#7C8FD4]">{importance}</span>
            </div>
            <input type="range" min={1} max={10} value={importance}
              onChange={e => setImportance(Number(e.target.value))} className="w-full" />
            <div className="flex justify-between text-[11px] text-[#C4C9E8] mt-1">
              <span>普通</span><span>重要</span>
            </div>
          </div>

          {/* Image Upload */}
          <div className="glass-card px-5 py-3">
            <p className="text-sm font-medium text-[#2D3250] mb-2">图片上传</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#C4C9E8] rounded-xl py-4 flex flex-col items-center gap-1.5 cursor-pointer hover:border-[#7C8FD4] hover:bg-[#7C8FD4]/5 transition-all">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                  stroke="#8A94B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-sm text-[#8A94B8]">点击或拖拽上传图片</span>
            </div>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {images.map((img, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#E8EEFF]">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex justify-between items-center pb-2">
            <button className="px-4 py-2 rounded-xl text-sm text-[#8A94B8] hover:bg-white/60 transition-colors">
              保存草稿
            </button>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-[#7C8FD4] border border-[#7C8FD4]/40 hover:bg-[#7C8FD4]/10 transition-colors disabled:opacity-60">
                <Save size={14} />{saving ? '保存中...' : '保存'}
              </button>
              <button onClick={() => navigate('/ai')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                style={{ background: 'linear-gradient(135deg,#7C8FD4,#C4B5FD)' }}>
                <Brain size={14} />AI心理分析
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

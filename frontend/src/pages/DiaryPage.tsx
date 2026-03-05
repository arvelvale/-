import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import ReactMarkdown from 'react-markdown'
import {
  Bold, Italic, Heading1, Heading2, List, ListOrdered,
  Quote, Code2, Link, Image, Plus, Save, Eye, Edit3,
  Upload, Sparkles,
} from 'lucide-react'
import { diaryApi } from '../lib/api'
// TODO: 图片上传API待后端实现后接入 // TODO-MOCK

const EMOTIONS = [
  { key: 'anxious',  label: '焦虑', emoji: '🌧️', bg: '#EEF0FF', color: '#7C8FD4' },
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
          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-[#7C8FD4]/10 text-gray-400 text-base">‹</button>
        <span className="text-xs font-semibold text-gray-700">{cur.format('YYYY年M月')}</span>
        <button onClick={() => setCur(c => c.add(1, 'month'))}
          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-[#7C8FD4]/10 text-gray-400 text-base">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['日','一','二','三','四','五','六'].map(d => (
          <div key={d} className="text-center text-[10px] text-gray-400 py-0.5">{d}</div>
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
                            'text-gray-600 hover:bg-gray-100'}`}>
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
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] px-5 py-2.5 rounded-2xl text-sm font-medium text-white shadow-lg"
      style={{ background: 'linear-gradient(135deg,#7C8FD4,#C4B5FD)' }}>
      {msg}
    </div>
  )
}

/* ── Main Page ──────────────────────────────────────────── */
export default function DiaryPage() {
  const navigate = useNavigate()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
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
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isLoggedIn = !!localStorage.getItem('token')

  // 自动加载草稿
  useEffect(() => {
    const draft = localStorage.getItem('diaryDraft')
    if (draft && selId === -1) {
      try {
        const data = JSON.parse(draft)
        if (!content) {
          setTitle(data.title || '')
          setContent(data.content || '')
          setEmotion(data.emotion || 'calm')
          setImportance(data.importance || 7)
          setImages(data.images || [])
        }
      } catch {
        // 忽略解析错误
      }
    }
  }, [])

  // 自动保存草稿
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selId === -1 && (title || content)) {
        localStorage.setItem('diaryDraft', JSON.stringify({
          title, content, emotion, importance, images
        }))
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [title, content, emotion, importance, images, selId])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const reader = new FileReader()
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string
          setImages(prev => [...prev, dataUrl])
        }
        reader.readAsDataURL(file)
      }
      tip('图片已添加 📷')
    } catch (err) {
      console.error('Upload failed:', err)
      tip('图片上传失败，请重试')
    } finally {
      setUploading(false)
    }
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

  /* Filter diaries by selected date */
  const filteredDiaries = diaries.filter(d => d.date === selDate.format('MM-DD'))

  /* Auto-select first diary of selected date or enter new mode */
  useEffect(() => {
    if (filteredDiaries.length > 0) {
      setSelId(filteredDiaries[0].id)
    } else {
      setSelId(-1)
    }
  }, [selDate.format('YYYY-MM-DD'), diaries.length])

  /* populate editor when switching diary */
  const selDiary = diaries.find(d => d.id === selId)
  useEffect(() => {
    if (!selDiary) {
      setTitle('')
      setContent('')
      setEmotion('calm')
      setImportance(7)
      setImages([])
      return
    }
    setTitle(selDiary.title.replace(/…$/, ''))
    setContent(selDiary.content ?? '')
    setEmotion(selDiary.emotion)
    setImportance(selDiary.importanceScore ?? 7)
    setImages([])
    localStorage.setItem('currentDiaryId', String(selDiary.id))
    localStorage.setItem('currentDiaryContent', selDiary.content ?? '')
  }, [selId, selDiary])

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
        localStorage.removeItem('diaryDraft')
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

  const handleSaveDraft = () => {
    localStorage.setItem('diaryDraft', JSON.stringify({
      title, content, emotion, importance, images
    }))
    tip('草稿已保存 💾')
  }

  const handleNew = () => {
    setSelId(-1); setTitle(''); setContent(''); setEmotion('calm'); setImportance(7); setSelDate(dayjs()); setImages([])
    localStorage.removeItem('currentDiaryId')
    localStorage.removeItem('currentDiaryContent')
  }

  // 富文本工具栏
  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = content
    const selected = text.substring(start, end)
    const newText = text.substring(0, start) + before + selected + after + text.substring(end)
    setContent(newText)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length)
    }, 0)
  }

  const toolbar = [
    { Icon: Bold, t: '粗体', action: () => insertText('**', '**') },
    { Icon: Italic, t: '斜体', action: () => insertText('*', '*') },
    { Icon: Heading1, t: 'H1', action: () => insertText('\n# ', '') },
    { Icon: Heading2, t: 'H2', action: () => insertText('\n## ', '') },
    { Icon: List, t: '列表', action: () => insertText('\n- ', '') },
    { Icon: ListOrdered, t: '有序列表', action: () => insertText('\n1. ', '') },
    { Icon: Quote, t: '引用', action: () => insertText('\n> ', '') },
    { Icon: Code2, t: '代码', action: () => insertText('`', '`') },
    { Icon: Link, t: '链接', action: () => insertText('[', '](url)') },
    { Icon: Image, t: '图片', action: () => fileInputRef.current?.click() },
  ]
  const sepAfter = new Set([1, 3, 5, 7])

  return (
    <>
      <Toast msg={toast} />
      <div className="absolute inset-0 flex overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className="w-56 flex-shrink-0 flex flex-col overflow-hidden bg-slate-50/80 border-r border-gray-100">

          {/* New Diary — top of sidebar */}
          <div className="px-3 pt-3 pb-2 flex-shrink-0">
            <button onClick={handleNew}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
              style={{ background: 'linear-gradient(135deg, #7C8FD4, #A78BFA)' }}>
              <Plus size={16} />新建日记
            </button>
          </div>

          {/* Calendar */}
          <div className="mx-3 mb-2 p-3 bg-white rounded-2xl shadow-sm flex-shrink-0">
            <MiniCalendar selected={selDate} onSelect={setSelDate} />
          </div>

          {/* Diary List */}
          <div className="px-3 flex-1 min-h-0 flex flex-col">
            <p className="text-[10px] font-semibold text-gray-400 mb-1.5 px-1 uppercase tracking-wider">
              {selDate.format('M月D日')} 的日记
            </p>
            <div className="flex-1 space-y-1 overflow-y-auto pb-3">
              {filteredDiaries.length === 0 && (
                <p className="text-xs text-gray-300 text-center py-6">当天暂无日记</p>
              )}
              {filteredDiaries.map(d => (
                <button key={d.id} onClick={() => setSelId(d.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${
                    selId === d.id
                      ? 'bg-white shadow-sm border border-[#7C8FD4]/20'
                      : 'hover:bg-white/70'
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-400 flex-shrink-0">{d.date}</span>
                    <span className={`text-xs truncate ${selId === d.id ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
                      {d.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Editor Area ── */}
        <div className="flex-1 overflow-y-auto bg-white relative pb-24">
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple disabled={uploading} className="hidden" />

          {/* Centered Canvas */}
          <div className="max-w-3xl mx-auto w-full px-8 py-10">

            {/* Date */}
            <p className="text-sm text-gray-400 mb-4">{selDate.format('YYYY年M月D日')}</p>

            {/* Title */}
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="给今天取个标题..."
              className="w-full text-3xl font-bold text-gray-800 placeholder-gray-300 bg-transparent border-none focus:outline-none mb-6 leading-snug"
            />

            {/* Toolbar — subtle, attached */}
            <div className="flex items-center flex-wrap gap-0.5 pb-3 mb-4 border-b border-gray-100">
              {toolbar.map(({ Icon, t, action }, idx) => (
                <span key={t} className="inline-flex items-center">
                  <button title={t} onClick={action}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#7C8FD4] hover:bg-gray-50 transition-colors">
                    <Icon size={15} />
                  </button>
                  {sepAfter.has(idx) && <span className="w-px h-4 bg-gray-100 mx-0.5" />}
                </span>
              ))}
              <span className="flex-1" />
              <button onClick={() => setPreviewMode(!previewMode)} title={previewMode ? '编辑' : '预览'}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  previewMode
                    ? 'bg-[#7C8FD4] text-white shadow-sm'
                    : 'text-gray-400 hover:text-[#7C8FD4] hover:bg-gray-50'
                }`}>
                {previewMode ? <><Edit3 size={13} />编辑</> : <><Eye size={13} />预览</>}
              </button>
            </div>

            {/* Editor / Preview */}
            {previewMode ? (
              <div className="prose prose-sm prose-slate max-w-none min-h-[300px] focus:outline-none">
                <ReactMarkdown>{content || '*在这里记录你的想法...*'}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="在这里记录你的想法...&#10;&#10;支持 Markdown 语法：## 标题、- 列表、**粗体** 等"
                className="w-full min-h-[300px] resize-none focus:outline-none text-gray-700 placeholder-gray-300 text-base leading-relaxed bg-transparent"
              />
            )}

            {/* ── Metadata Section ── */}
            <div className="mt-10 space-y-4">

              {/* Emotion Tags — capsule pills, no background box */}
              <div>
                <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">今天的心情</p>
                <div className="flex flex-wrap gap-2">
                  {EMOTIONS.map(em => (
                    <button key={em.key} onClick={() => setEmotion(em.key)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                        emotion === em.key
                          ? 'shadow-md scale-105'
                          : 'border-transparent hover:scale-102'
                      }`}
                      style={{
                        background: em.bg,
                        color: em.color,
                        borderColor: emotion === em.key ? em.color : 'transparent',
                        boxShadow: emotion === em.key ? `0 4px 14px ${em.color}25` : 'none',
                      }}>
                      <span className="text-base">{em.emoji}</span>{em.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Importance + Image in two compact cards side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Importance */}
                <div className="bg-gray-50 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">重要程度</span>
                    <span className="text-lg font-bold text-[#7C8FD4]">{importance}</span>
                  </div>
                  <input type="range" min={1} max={10} value={importance}
                    onChange={e => setImportance(Number(e.target.value))}
                    className="w-full accent-[#7C8FD4]" />
                  <div className="flex justify-between text-[11px] text-gray-400 mt-1.5">
                    <span>随意记录</span><span>非常重要</span>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="bg-gray-50 rounded-2xl p-5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">附件图片</p>
                  <div
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl py-3 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      uploading ? 'opacity-50 cursor-not-allowed border-gray-200' : 'border-gray-200 hover:border-[#7C8FD4] hover:bg-[#7C8FD4]/5'
                    }`}>
                    <Upload size={18} className="text-gray-400" />
                    <span className="text-xs text-gray-400">{uploading ? '上传中...' : '点击上传图片'}</span>
                  </div>
                  {images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {images.map((img, i) => (
                        <div key={i} className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-200 group">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute inset-0 bg-black/40 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            删除
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Floating Action Bar ── */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-2 py-2 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100">
            <button onClick={handleSaveDraft}
              className="px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
              保存草稿
            </button>
            <div className="w-px h-6 bg-gray-100" />
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium text-[#7C8FD4] hover:bg-[#7C8FD4]/10 transition-colors disabled:opacity-60">
              <Save size={15} />{saving ? '保存中...' : '保存'}
            </button>
            <button onClick={() => navigate('/ai')}
              className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden group"
              style={{ background: 'linear-gradient(135deg, #7C8FD4, #A78BFA, #C4B5FD)' }}>
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <Sparkles size={15} className="relative z-10" />
              <span className="relative z-10">AI心理分析</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

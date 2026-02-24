import { useState } from 'react'
import dayjs from 'dayjs'
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Quote, Code2, Link, Image, Plus, Brain } from 'lucide-react'

const EMOTIONS = [
  { key: 'anxious', label: '焦虑', emoji: '🌧️', bg: '#E8EEFF', color: '#7C8FD4' },
  { key: 'happy', label: '开心', emoji: '😊', bg: '#FFF8E1', color: '#F9A825' },
  { key: 'sad', label: '委屈', emoji: '💧', bg: '#F3ECFF', color: '#9C6FD4' },
  { key: 'calm', label: '平静', emoji: '🌿', bg: '#E8F5E9', color: '#4CAF50' },
  { key: 'angry', label: '愤怒', emoji: '🔥', bg: '#FFF0EE', color: '#EF5350' },
  { key: 'grateful', label: '感恩', emoji: '🌸', bg: '#FFF0F5', color: '#E91E8C' },
]

const MOCK_DIARIES = [
  { id: 1, date: '05-15', title: '今天的天气真好...', preview: '阳光明媚，心情很不错', emotion: 'happy' },
  { id: 2, date: '05-14', title: '关于工作的一些思考...', preview: '今天开了一个很长的会议', emotion: 'anxious' },
  { id: 3, date: '05-13', title: '关于工作的一些思考...', preview: '和同事讨论了项目进展', emotion: 'calm' },
  { id: 4, date: '05-12', title: '今天的天气真好，有...', preview: '傍晚去公园散步', emotion: 'happy' },
  { id: 5, date: '05-11', title: '今天的天气真好，在...', preview: '在家休息了一天', emotion: 'calm' },
  { id: 6, date: '05-10', title: '关于工作的一些思考', preview: '项目遇到了一些困难', emotion: 'sad' },
]

function MiniCalendar({ selectedDate, onSelect }: { selectedDate: dayjs.Dayjs; onSelect: (d: dayjs.Dayjs) => void }) {
  const [current, setCurrent] = useState(dayjs())
  const startOfMonth = current.startOf('month')
  const daysInMonth = current.daysInMonth()
  const startDow = startOfMonth.day()

  const cells: (number | null)[] = [...Array(startDow).fill(null)]
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)
  while (cells.length % 7 !== 0) cells.push(null)

  const hasDiary = (day: number) => [1, 6, 7, 14, 22, 26, 28].includes(day)

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <button onClick={() => setCurrent(c => c.subtract(1, 'month'))}
          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-[#7C8FD4]/10 text-[#8A94B8] transition-colors">
          ‹
        </button>
        <span className="text-sm font-semibold text-[#2D3250]">
          {current.format('YYYY年M月')}
        </span>
        <button onClick={() => setCurrent(c => c.add(1, 'month'))}
          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-[#7C8FD4]/10 text-[#8A94B8] transition-colors">
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {['日', '一', '二', '三', '四', '五', '六'].map(d => (
          <div key={d} className="text-center text-xs text-[#8A94B8] py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />
          const isToday = day === dayjs().date() && current.month() === dayjs().month()
          const isSelected = day === selectedDate.date() && current.month() === selectedDate.month()
          return (
            <div key={idx} className="flex flex-col items-center py-0.5">
              <button
                onClick={() => onSelect(current.date(day))}
                className={`w-7 h-7 rounded-full text-xs font-medium transition-all duration-150 relative
                  ${isSelected ? 'bg-[#7C8FD4] text-white shadow-sm' :
                    isToday ? 'bg-[#7C8FD4]/15 text-[#7C8FD4] font-bold' :
                    'text-[#2D3250] hover:bg-[#7C8FD4]/10'}`}>
                {day}
              </button>
              {hasDiary(day) && !isSelected && (
                <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: '#7C8FD4' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function DiaryPage() {
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [selectedDiary, setSelectedDiary] = useState(MOCK_DIARIES[0])
  const [content, setContent] = useState('')
  const [selectedEmotion, setSelectedEmotion] = useState('calm')
  const [importance, setImportance] = useState(7)

  const toolbarButtons = [
    { icon: Bold, title: '粗体' },
    { icon: Italic, title: '斜体' },
    { icon: Heading1, title: 'H1' },
    { icon: Heading2, title: 'H2' },
    { icon: List, title: '无序列表' },
    { icon: ListOrdered, title: '有序列表' },
    { icon: Quote, title: '引用' },
    { icon: Code2, title: '代码' },
    { icon: Link, title: '链接' },
    { icon: Image, title: '图片' },
  ]

  return (
    <div className="flex h-full">
      {/* Left Sidebar */}
      <div className="w-56 flex-shrink-0 flex flex-col h-full overflow-y-auto py-4 px-3"
        style={{ background: 'rgba(240, 244, 255, 0.7)' }}>

        {/* Mini Calendar */}
        <div className="glass-card p-3 mb-4">
          <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />
        </div>

        {/* Diary List */}
        <div>
          <h3 className="text-xs font-semibold text-[#8A94B8] mb-2 px-1">日记列表</h3>
          <div className="space-y-1">
            {MOCK_DIARIES.map(diary => (
              <button key={diary.id} onClick={() => setSelectedDiary(diary)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 ${
                  selectedDiary.id === diary.id
                    ? 'bg-[#7C8FD4]/20 border border-[#7C8FD4]/30'
                    : 'hover:bg-white/60'
                }`}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#8A94B8] flex-shrink-0">{diary.date}</span>
                  <span className="text-xs text-[#2D3250] truncate">{diary.title}</span>
                </div>
              </button>
            ))}
          </div>

          {/* New Diary Button */}
          <button className="w-full mt-3 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[#7C8FD4] text-sm font-medium hover:bg-[#7C8FD4]/10 transition-colors border border-dashed border-[#7C8FD4]/40">
            <Plus size={14} />
            新建日记
          </button>
        </div>
      </div>

      {/* Right Editor Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Editor Card */}
          <div className="glass-card overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-0.5 px-3 py-2.5 border-b border-[#E8EEFF]">
              {toolbarButtons.map(({ icon: Icon, title }, idx) => (
                <>
                  {idx === 4 && <div key={`sep-${idx}`} className="w-px h-5 bg-[#E0E7FF] mx-1" />}
                  {idx === 6 && <div key={`sep2-${idx}`} className="w-px h-5 bg-[#E0E7FF] mx-1" />}
                  {idx === 8 && <div key={`sep3-${idx}`} className="w-px h-5 bg-[#E0E7FF] mx-1" />}
                  <button key={title} title={title}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#5B6FBE] hover:bg-[#7C8FD4]/10 transition-colors">
                    <Icon size={15} />
                  </button>
                </>
              ))}
            </div>

            {/* Text Area */}
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="在这里记录你的想法..."
              className="w-full p-4 min-h-[220px] resize-none focus:outline-none text-[#2D3250] placeholder-[#C4C9E8] text-sm leading-relaxed bg-transparent"
            />
          </div>

          {/* Emotion Tags */}
          <div className="flex flex-wrap gap-2">
            {EMOTIONS.map(em => (
              <button key={em.key} onClick={() => setSelectedEmotion(em.key)}
                className="emotion-pill transition-all duration-200"
                style={{
                  background: em.bg,
                  color: em.color,
                  borderColor: selectedEmotion === em.key ? em.color : 'transparent',
                  fontWeight: selectedEmotion === em.key ? 600 : 500,
                  transform: selectedEmotion === em.key ? 'scale(1.04)' : 'scale(1)',
                  boxShadow: selectedEmotion === em.key ? `0 4px 12px ${em.color}30` : 'none',
                }}>
                <span>{em.emoji}</span>
                {em.label}
              </button>
            ))}
          </div>

          {/* Importance Slider */}
          <div className="glass-card px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#2D3250]">重要性 (1-10)</span>
              <span className="text-sm font-bold text-[#7C8FD4] w-6 text-center">{importance}</span>
            </div>
            <input
              type="range" min={1} max={10} value={importance}
              onChange={e => setImportance(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[#C4C9E8] mt-1">
              <span>普通</span>
              <span>重要</span>
            </div>
          </div>

          {/* Image Upload */}
          <div className="glass-card px-5 py-4">
            <h4 className="text-sm font-medium text-[#2D3250] mb-3">图片上传</h4>
            <div className="border-2 border-dashed border-[#C4C9E8] rounded-xl py-5 flex flex-col items-center gap-2 cursor-pointer hover:border-[#7C8FD4] hover:bg-[#7C8FD4]/05 transition-all">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                  stroke="#8A94B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm text-[#8A94B8]">点击或拖拽上传图片</span>
            </div>
          </div>

          {/* Actions row */}
          <div className="flex justify-between items-center pb-4">
            <button className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#8A94B8] hover:bg-white/60 transition-colors">
              保存草稿
            </button>
            <div className="flex gap-2">
              <button className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#7C8FD4] border border-[#7C8FD4]/40 hover:bg-[#7C8FD4]/10 transition-colors">
                保存
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #7C8FD4, #C4B5FD)' }}>
                <Brain size={14} />
                AI心理分析
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'

const moodData = [
  { date: '6月1', score: 2, label: '平静' },
  { date: '6月7', score: 3, label: '开心' },
  { date: '6月10', score: 2.5, label: '平静' },
  { date: '6月15', score: 3.5, label: '开心' },
  { date: '6月21', score: 1.5, label: '低落' },
  { date: '6月25', score: 2.8, label: '平静' },
  { date: '6月30', score: 2, label: '平静' },
]

const calendarData: Record<string, { emoji: string; label: string; color: string }> = {
  '1': { emoji: '😊', label: '满足', color: '#FFF8E1' },
  '2': { emoji: '😊', label: '满足', color: '#FFF8E1' },
  '3': { emoji: '😊', label: '满足', color: '#FFF8E1' },
  '4': { emoji: '😊', label: '满足', color: '#FFF8E1' },
  '5': { emoji: '😊', label: '满足', color: '#FFF8E1' },
  '6': { emoji: '😤', label: '焦虑', color: '#EEF1FF' },
  '7': { emoji: '😤', label: '焦虑', color: '#EEF1FF' },
  '8': { emoji: '⭐', label: '满足', color: '#FFF8E1' },
  '9': { emoji: '😊', label: '满足', color: '#FFF8E1' },
  '10': { emoji: '😊', label: '满足', color: '#FFF8E1' },
  '11': { emoji: '😊', label: '满足', color: '#FFF8E1' },
  '12': { emoji: '😊', label: '满足', color: '#FFF8E1' },
  '13': { emoji: '😤', label: '焦虑', color: '#EEF1FF' },
  '14': { emoji: '😊', label: '满足', color: '#FFF8E1' },
  '15': { emoji: '😊', label: '满足', color: '#FFF8E1' },
  '16': { emoji: '☁️', label: '焦虑', color: '#EEF1FF' },
  '17': { emoji: '☁️', label: '焦虑', color: '#EEF1FF' },
  '18': { emoji: '☁️', label: '焦虑', color: '#EEF1FF' },
  '19': { emoji: '😊', label: '满足', color: '#FFF8E1' },
  '20': { emoji: '☁️', label: '焦虑', color: '#EEF1FF' },
  '21': { emoji: '☁️', label: '焦虑', color: '#EEF1FF' },
  '22': { emoji: '😤', label: '焦虑', color: '#EEF1FF' },
  '23': { emoji: '😤', label: '焦虑', color: '#EEF1FF' },
  '24': { emoji: '😊', label: '满足', color: '#FFF8E1' },
  '25': { emoji: '😤', label: '焦虑', color: '#EEF1FF' },
  '26': { emoji: '😤', label: '焦虑', color: '#EEF1FF' },
  '27': { emoji: '😤', label: '焦虑', color: '#EEF1FF' },
  '28': { emoji: '😤', label: '焦虑', color: '#EEF1FF' },
  '29': { emoji: '😊', label: '满足', color: '#FFF8E1' },
  '30': { emoji: '☁️', label: '焦虑', color: '#EEF1FF' },
}

const stressSources = [
  { label: '工作', value: 60, color: '#7C8FD4' },
  { label: '人际关系', value: 20, color: '#A5B4FC' },
  { label: '睡眠', value: 15, color: '#C4B5FD' },
]

const keyEvents = [
  { date: '6月1日', title: '提交重要报告', dotColor: '#7C8FD4' },
  { date: '6月20日', title: '朋友生日聚会', dotColor: '#7C8FD4' },
  { date: '6月20日', title: '冥想练习', dotColor: '#A5B4FC' },
]

const graphNodes = [
  { id: 'work', label: '工作', x: 100, y: 80, size: 8 },
  { id: 'ddl', label: '截止日期', x: 260, y: 40, size: 6 },
  { id: 'irregular', label: '作息不规律', x: 280, y: 90, size: 6 },
  { id: 'sleep', label: '睡眠', x: 100, y: 160, size: 8 },
  { id: 'health', label: '健康问题', x: 280, y: 150, size: 6 },
]
const graphEdges = [
  { from: 'work', to: 'ddl' },
  { from: 'work', to: 'irregular' },
  { from: 'sleep', to: 'irregular' },
  { from: 'sleep', to: 'health' },
]

function SimpleGraph() {
  const nodeMap = Object.fromEntries(graphNodes.map(n => [n.id, n]))
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full">
      {graphEdges.map((e, i) => {
        const from = nodeMap[e.from]
        const to = nodeMap[e.to]
        return (
          <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
            stroke="#C4C9E8" strokeWidth="1.5" />
        )
      })}
      {graphNodes.map(node => (
        <g key={node.id}>
          <circle cx={node.x} cy={node.y} r={node.size + 10}
            fill={node.size === 8 ? '#EEF1FF' : '#F5F0FF'}
            stroke={node.size === 8 ? '#7C8FD4' : '#C4B5FD'}
            strokeWidth="1.5" />
          <circle cx={node.x} cy={node.y} r={node.size}
            fill={node.size === 8 ? '#7C8FD4' : '#C4B5FD'} />
          <text x={node.x} y={node.y + node.size + 16} textAnchor="middle"
            fontSize="11" fill="#5B6FBE" fontFamily="system-ui">
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3 py-2 text-xs">
        <p className="text-[#2D3250] font-medium">{label}</p>
        <p className="text-[#7C8FD4]">{payload[0].payload.label}</p>
      </div>
    )
  }
  return null
}

export default function InsightsPage() {
  const [timeRange, setTimeRange] = useState('30 天')

  // Build calendar grid for June 2024
  // June 1 is Saturday (dow=6)
  const startDow = 6
  const daysInMonth = 30
  const cells: (number | null)[] = [...Array(startDow).fill(null)]
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-5">
        <h1 className="text-xl font-bold text-[#2D3250] mb-5">数据调析</h1>

        <div className="flex gap-4">
          {/* Left Column */}
          <div className="flex-1 space-y-4">

            {/* Mood Trend Chart */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[#2D3250]">情绪趋势</h2>
                <div className="flex items-center gap-1.5">
                  <select
                    value={timeRange}
                    onChange={e => setTimeRange(e.target.value)}
                    className="text-xs text-[#5B6FBE] bg-[#EEF1FF] border-none rounded-lg px-3 py-1.5 outline-none cursor-pointer appearance-none pr-6"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%237C8FD4' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}>
                    <option>7 天</option>
                    <option>30 天</option>
                    <option>90 天</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between text-xs text-[#8A94B8] mb-1 ml-8">
                <span>开心</span>
              </div>

              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={moodData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="moodGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#7C8FD4" />
                      <stop offset="100%" stopColor="#C4B5FD" />
                    </linearGradient>
                    <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C8FD4" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#C4B5FD" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8A94B8' }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={[0, 4]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone" dataKey="score"
                    stroke="url(#moodGrad)" strokeWidth={2.5}
                    fill="url(#moodFill)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>

              <div className="flex justify-start text-xs text-[#8A94B8] mt-1 ml-8">
                <span>低落</span>
              </div>
            </div>

            {/* Mood Calendar */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[#2D3250]">心情日历</h2>
                <span className="text-sm text-[#8A94B8]">6月</span>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-1">
                {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                  <div key={d} className="text-center text-xs text-[#8A94B8] py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {cells.map((day, idx) => {
                  if (!day) return <div key={idx} className="h-12" />
                  const mood = calendarData[String(day)]
                  return (
                    <div key={idx}
                      className="h-12 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:scale-105 transition-transform"
                      style={{ background: mood?.color || '#F5F7FF' }}>
                      <span className="text-xs font-medium text-[#2D3250]">{day}</span>
                      {mood && (
                        <>
                          <span className="text-sm leading-none">{mood.emoji}</span>
                          <span className="text-[9px] text-[#8A94B8] leading-none">{mood.label}</span>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Stress Analysis */}
            <div className="glass-card p-5">
              <h2 className="text-sm font-semibold text-[#2D3250] mb-4">压力源分析</h2>
              <div className="flex gap-6">
                {/* Bar chart */}
                <div className="flex-1 space-y-3">
                  {stressSources.map(s => (
                    <div key={s.label} className="flex items-center gap-3">
                      <span className="text-xs text-[#8A94B8] w-14 flex-shrink-0">{s.label}</span>
                      <div className="flex-1 h-3 bg-[#EEF1FF] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${s.value}%`, background: `linear-gradient(90deg, ${s.color}, #C4B5FD)` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-[#5B6FBE] w-8 text-right">{s.value}%</span>
                    </div>
                  ))}
                </div>

                {/* Relationship graph */}
                <div className="w-64 h-44">
                  <SimpleGraph />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Key Events */}
          <div className="w-52 flex-shrink-0">
            <div className="glass-card p-4">
              <h2 className="text-sm font-semibold text-[#2D3250] mb-4">关键事件</h2>
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-2 top-3 bottom-3 w-px bg-gradient-to-b from-[#7C8FD4] to-[#C4B5FD]" />

                <div className="space-y-6">
                  {keyEvents.map((ev, idx) => (
                    <div key={idx} className="flex gap-4 items-start">
                      <div className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5 border-2 border-white shadow-sm"
                        style={{ background: ev.dotColor }} />
                      <div className="glass-card px-3 py-2 flex-1">
                        <p className="text-[10px] text-[#8A94B8] mb-0.5">{ev.date}</p>
                        <p className="text-xs font-medium text-[#2D3250]">{ev.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

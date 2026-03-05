import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { statsApi } from '../lib/api'

interface MoodData {
  date: string
  score: number
  label: string
}

interface CalendarData {
  [key: string]: { emoji: string; label: string; color: string }
}

interface StressSource {
  label: string
  value: number
  color: string
}

interface KeyEvent {
  date: string
  title: string
  dotColor: string
}

interface GraphNode {
  id: string
  label: string
  x: number
  y: number
  size: number
}

interface GraphEdge {
  from: string
  to: string
}

function SimpleGraph({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full">
      {edges.map((e, i) => {
        const from = nodeMap[e.from]
        const to = nodeMap[e.to]
        if (!from || !to) return null
        return (
          <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
            stroke="#C4C9E8" strokeWidth="1.5" />
        )
      })}
      {nodes.map(node => (
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
  const [loading, setLoading] = useState(true)
  const [hasData, setHasData] = useState(false)
  const [moodData, setMoodData] = useState<MoodData[]>([])
  const [calendarData, setCalendarData] = useState<CalendarData>({})
  const [stressSources, setStressSources] = useState<StressSource[]>([])
  const [keyEvents, setKeyEvents] = useState<KeyEvent[]>([])
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([])
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([])

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const days = timeRange === '7 天' ? 7 : timeRange === '90 天' ? 90 : 30

        // 并行加载所有数据
        const [trendRes, calendarRes, stressRes, eventsRes, graphRes] = await Promise.allSettled([
          statsApi.moodTrend(days),
          statsApi.moodCalendar(new Date().getFullYear(), new Date().getMonth() + 1),
          statsApi.stressSources(),
          statsApi.keyEvents(10),
          statsApi.relationshipGraph(),
        ])

        // 处理情绪趋势
        if (trendRes.status === 'fulfilled' && trendRes.value.data?.data?.length > 0) {
          setMoodData(trendRes.value.data.data)
          setHasData(true)
        }

        // 处理心情日历
        if (calendarRes.status === 'fulfilled' && Object.keys(calendarRes.value.data?.data || {}).length > 0) {
          setCalendarData(calendarRes.value.data.data)
          setHasData(true)
        }

        // 处理压力源
        if (stressRes.status === 'fulfilled' && stressRes.value.data?.data?.sources?.length > 0) {
          setStressSources(stressRes.value.data.data.sources)
          setHasData(true)
        }

        // 处理关键事件
        if (eventsRes.status === 'fulfilled' && eventsRes.value.data?.data?.events?.length > 0) {
          setKeyEvents(eventsRes.value.data.data.events)
          setHasData(true)
        }

        // 处理关系图谱
        if (graphRes.status === 'fulfilled') {
          const nodes = graphRes.value.data?.data?.nodes || []
          const edges = graphRes.value.data?.data?.edges || []
          if (nodes.length > 0) {
            setGraphNodes(nodes)
            setGraphEdges(edges)
            setHasData(true)
          }
        }
      } catch (err) {
        console.error('Failed to load insights:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [timeRange])

  // Build calendar grid
  const now = new Date()
  const startDow = new Date(now.getFullYear(), now.getMonth(), 1).getDay()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(startDow).fill(null)]
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)
  while (cells.length % 7 !== 0) cells.push(null)

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#7C8FD4] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#8A94B8]">加载数据中...</p>
        </div>
      </div>
    )
  }

  // 没有数据时显示友好提示
  if (!hasData) {
    return (
      <div className="absolute inset-0 overflow-y-auto">
        <div className="p-5">
          <h1 className="text-xl font-bold text-[#2D3250] mb-5">数据调析</h1>
          <div className="glass-card p-12 text-center">
            <p className="text-sm text-[#8A94B8] mb-2">还没有足够的数据</p>
            <p className="text-xs text-[#C4C9E8]">记录更多日记后，这里会展示你的情绪趋势、心情日历和深度分析</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="p-5">
        <h1 className="text-xl font-bold text-[#2D3250] mb-5">数据调析</h1>

        <div className="flex gap-4">
          {/* Left Column */}
          <div className="flex-1 space-y-4">

            {/* Mood Trend Chart */}
            {moodData.length > 0 && (
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
            )}

            {/* Mood Calendar */}
            {Object.keys(calendarData).length > 0 && (
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-[#2D3250]">心情日历</h2>
                  <span className="text-sm text-[#8A94B8]">{now.getMonth() + 1}月</span>
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
            )}

            {/* Stress Analysis */}
            {stressSources.length > 0 && (
              <div className="glass-card p-5">
                <h2 className="text-sm font-semibold text-[#2D3250] mb-4">压力源分析</h2>
                {graphNodes.length > 0 ? (
                  <div className="flex gap-6">
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
                    <div className="w-64 h-44">
                      <SimpleGraph nodes={graphNodes} edges={graphEdges} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
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
                )}
              </div>
            )}
          </div>

          {/* Right Column: Key Events */}
          {keyEvents.length > 0 && (
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
          )}
        </div>
      </div>
    </div>
  )
}

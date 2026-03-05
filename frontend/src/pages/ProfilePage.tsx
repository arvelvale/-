import { useState, useEffect } from 'react'
import { Edit3, Save, LogOut, Crown, User, Smile, Zap, MessageSquare } from 'lucide-react'
import { userApi } from '../lib/api'
import { useNavigate } from 'react-router-dom'

const MBTI_TYPES = ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP']
const IDENTITY_TAGS = ['创业者/搞钱','职场精英','文艺青年','全职宝妈/奶爸','学生党','自由职业']
const STATES = ['迷茫/寻求方向','压力大/想吐槽','记录美好/流水账','自我探索/成长']

function Toast({ msg }: { msg: string }) {
  if (!msg) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl text-sm font-medium text-white shadow-lg"
      style={{ background: 'linear-gradient(135deg,#7C8FD4,#C4B5FD)' }}>
      {msg}
    </div>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const isLoggedIn = !!localStorage.getItem('token')
  const userId = Number(localStorage.getItem('userId') ?? 0)

  const [profile, setProfile] = useState({
    username: 'YinJi用户',
    email: 'user@example.com',
    isPremium: false,
    identityTag: '职场精英',
    mbti: 'INFP',
    currentState: '自我探索/成长',
    catchphrases: ['人间值得', '加油鸭'],
    socialStyle: '文艺极简',
    diaryCount: 0,
    streak: 0,
    analysisCount: 0,
  })
  const [draft, setDraft] = useState({ ...profile })
  const [newPhrase, setNewPhrase] = useState('')

  const tip = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  useEffect(() => {
    const loadData = async () => {
      if (!isLoggedIn || !userId) {
        setLoading(false)
        return
      }

      try {
        // 并行加载用户画像和统计数据
        const [profileRes, statsRes] = await Promise.allSettled([
          userApi.getProfile(userId),
          userApi.getStats(userId),
        ])

        // 处理用户画像
        if (profileRes.status === 'fulfilled') {
          const data = profileRes.value.data?.data
          if (data) {
            setProfile(prev => ({
              ...prev,
              username: data.username || prev.username,
              email: data.email || prev.email,
              isPremium: data.isPremium ?? prev.isPremium,
              identityTag: data.profile?.identityTag ?? prev.identityTag,
              mbti: data.profile?.personalityType ?? prev.mbti,
              currentState: data.profile?.currentState ?? prev.currentState,
              catchphrases: data.profile?.catchphrases ?? prev.catchphrases,
              socialStyle: data.profile?.socialStyle ?? prev.socialStyle,
            }))
            setDraft(prev => ({
              ...prev,
              username: data.username || prev.username,
              email: data.email || prev.email,
              isPremium: data.isPremium ?? prev.isPremium,
              identityTag: data.profile?.identityTag ?? prev.identityTag,
              mbti: data.profile?.personalityType ?? prev.mbti,
              currentState: data.profile?.currentState ?? prev.currentState,
              catchphrases: data.profile?.catchphrases ?? prev.catchphrases,
              socialStyle: data.profile?.socialStyle ?? prev.socialStyle,
            }))
          }
        }

        // 处理统计数据
        if (statsRes.status === 'fulfilled') {
          const data = statsRes.value.data?.data
          if (data) {
            setProfile(prev => ({
              ...prev,
              diaryCount: data.diaryCount ?? 0,
              streak: data.streak ?? 0,
              analysisCount: data.analysisCount ?? 0,
            }))
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isLoggedIn, userId])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (isLoggedIn && userId) {
        await userApi.updateProfile(userId, {
          identityTag: draft.identityTag,
          personalityType: draft.mbti,
          currentState: draft.currentState,
          catchphrases: draft.catchphrases,
        })
      }
      setProfile({ ...draft })
      setEditing(false)
      tip('保存成功 ✅')
    } catch { tip('保存失败，请重试') }
    finally { setSaving(false) }
  }

  const addPhrase = () => {
    if (!newPhrase.trim()) return
    setDraft(d => ({ ...d, catchphrases: [...d.catchphrases, newPhrase.trim()] }))
    setNewPhrase('')
  }

  const removePhrase = (i: number) =>
    setDraft(d => ({ ...d, catchphrases: d.catchphrases.filter((_, idx) => idx !== i) }))

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    navigate('/login')
  }

  const cur = editing ? draft : profile

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#7C8FD4] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <Toast msg={toast} />
      <div className="absolute inset-0 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-5 space-y-4">

          {/* Header Card */}
          <div className="glass-card p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#7C8FD4,#C4B5FD)' }}>
                  {profile.username[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#2D3250]">{profile.username}</h2>
                    {profile.isPremium && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200">
                        <Crown size={10} />高级版
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#8A94B8]">{profile.email}</p>
                  <div className="flex gap-3 mt-2">
                    <span className="text-xs text-[#8A94B8]"><b className="text-[#2D3250]">{profile.diaryCount}</b> 篇日记</span>
                    <span className="text-xs text-[#8A94B8]">连续 <b className="text-[#7C8FD4]">{profile.streak}</b> 天</span>
                  </div>
                </div>
              </div>
              <button onClick={() => editing ? handleSave() : setEditing(true)} disabled={saving}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all"
                style={editing
                  ? { background: 'linear-gradient(135deg,#7C8FD4,#C4B5FD)', color: 'white' }
                  : { background: '#F0F4FF', color: '#7C8FD4' }}>
                {editing ? <><Save size={14} />{saving ? '保存中...' : '保存'}</> : <><Edit3 size={14} />编辑</>}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '总日记数', value: profile.diaryCount, icon: '📝', color: '#7C8FD4', bg: '#EEF1FF' },
              { label: '连续天数', value: `${profile.streak}天`, icon: '🔥', color: '#EF5350', bg: '#FFF0EE' },
              { label: '情绪分析', value: `${profile.analysisCount}次`, icon: '🧠', color: '#9C6FD4', bg: '#F3ECFF' },
            ].map(s => (
              <div key={s.label} className="glass-card p-4 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[11px] text-[#8A94B8]">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Identity Tag */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <User size={15} className="text-[#7C8FD4]" />
              <p className="text-sm font-semibold text-[#2D3250]">身份标签</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {IDENTITY_TAGS.map(tag => (
                <button key={tag} disabled={!editing}
                  onClick={() => editing && setDraft(d => ({ ...d, identityTag: tag }))}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                  style={cur.identityTag === tag
                    ? { background: '#7C8FD4', color: 'white', borderColor: '#7C8FD4' }
                    : { background: 'white', color: '#8A94B8', borderColor: '#E0E7FF' }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* MBTI */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Smile size={15} className="text-[#9C6FD4]" />
              <p className="text-sm font-semibold text-[#2D3250]">MBTI 性格类型</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {MBTI_TYPES.map(t => (
                <button key={t} disabled={!editing}
                  onClick={() => editing && setDraft(d => ({ ...d, mbti: t }))}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium font-mono transition-all border"
                  style={cur.mbti === t
                    ? { background: '#9C6FD4', color: 'white', borderColor: '#9C6FD4' }
                    : { background: 'white', color: '#8A94B8', borderColor: '#E0E7FF' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Current State */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={15} className="text-[#F9A825]" />
              <p className="text-sm font-semibold text-[#2D3250]">当前状态</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {STATES.map(s => (
                <button key={s} disabled={!editing}
                  onClick={() => editing && setDraft(d => ({ ...d, currentState: s }))}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                  style={cur.currentState === s
                    ? { background: '#F9A825', color: 'white', borderColor: '#F9A825' }
                    : { background: 'white', color: '#8A94B8', borderColor: '#E0E7FF' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Catchphrases */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={15} className="text-[#E91E8C]" />
              <p className="text-sm font-semibold text-[#2D3250]">我的口头禅</p>
              <span className="text-xs text-[#8A94B8]">（用于生成朋友圈文案）</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {cur.catchphrases.map((p, i) => (
                <span key={i} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: '#FFF0F5', color: '#E91E8C' }}>
                  {p}
                  {editing && (
                    <button onClick={() => removePhrase(i)} className="ml-1 opacity-60 hover:opacity-100 text-base leading-none">×</button>
                  )}
                </span>
              ))}
            </div>
            {editing && (
              <div className="flex gap-2">
                <input value={newPhrase} onChange={e => setNewPhrase(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addPhrase()}
                  placeholder="添加口头禅..."
                  className="flex-1 text-sm text-[#2D3250] placeholder-[#C4C9E8] bg-[#F8F9FF] rounded-xl px-3 py-2 border border-[#E0E7FF] focus:outline-none focus:border-[#7C8FD4] transition-colors" />
                <button onClick={addPhrase}
                  className="px-3 py-2 rounded-xl text-sm text-white transition-colors"
                  style={{ background: '#E91E8C' }}>添加</button>
              </div>
            )}
          </div>

          {/* Subscription */}
          {!profile.isPremium && (
            <div className="glass-card p-5 text-center"
              style={{ background: 'linear-gradient(135deg,rgba(238,241,255,0.9),rgba(245,240,255,0.9))' }}>
              <Crown size={24} className="mx-auto text-amber-400 mb-2" />
              <h3 className="text-sm font-bold text-[#2D3250] mb-1">升级高级版</h3>
              <p className="text-xs text-[#8A94B8] mb-4">无限AI分析 · 无限文案生成 · 精美月度报告</p>
              <div className="flex gap-2 justify-center">
                <button className="px-4 py-2 rounded-xl text-sm font-medium text-[#8A94B8] border border-[#E0E7FF] hover:bg-white/60 transition-colors">
                  ¥29 / 月
                </button>
                <button className="px-4 py-2 rounded-xl text-sm font-medium text-white shadow-md hover:shadow-lg transition-all"
                  style={{ background: 'linear-gradient(135deg,#F9A825,#FFB74D)' }}>
                  ¥199 / 年 <span className="text-[10px] opacity-80">省¥149</span>
                </button>
              </div>
            </div>
          )}

          {/* Logout */}
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium text-[#EF5350] border border-[#EF5350]/20 hover:bg-[#EF5350]/5 transition-colors">
            <LogOut size={15} />退出登录
          </button>

          <div className="h-4" />
        </div>
      </div>
    </>
  )
}

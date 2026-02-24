import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, ArrowRight, RefreshCw, Sparkles } from 'lucide-react'
import api from '../lib/api'

/* ── 装饰性浮动气泡 ────────────────────────────────────── */
const BUBBLES = [
  { size: 180, top: '8%',  left: '10%',  delay: '0s',   opacity: 0.18 },
  { size: 120, top: '55%', left: '5%',   delay: '1.2s', opacity: 0.12 },
  { size: 240, top: '25%', left: '60%',  delay: '0.6s', opacity: 0.10 },
  { size: 80,  top: '70%', left: '70%',  delay: '1.8s', opacity: 0.15 },
  { size: 150, top: '80%', left: '30%',  delay: '0.9s', opacity: 0.08 },
]

const QUOTES = [
  '写下今天，\n读懂自己。',
  '每一篇日记，\n都是一次与内心的相遇。',
  '记录的力量，\n在于让模糊变清晰。',
  '印记，\n是你给自己最好的礼物。',
]

/* ── Toast ─────────────────────────────────────────────── */
function Toast({ msg, type = 'info' }: { msg: string; type?: 'info' | 'error' | 'success' }) {
  if (!msg) return null
  const bg =
    type === 'error'   ? 'linear-gradient(135deg,#EF5350,#FF7043)' :
    type === 'success' ? 'linear-gradient(135deg,#4CAF50,#66BB6A)'  :
                         'linear-gradient(135deg,#7C8FD4,#C4B5FD)'
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl text-sm font-medium text-white shadow-lg pointer-events-none"
      style={{ background: bg }}>
      {msg}
    </div>
  )
}

/* ── Main ───────────────────────────────────────────────── */
export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail]         = useState('')
  const [code, setCode]           = useState('')
  const [username, setUsername]   = useState('')
  const [step, setStep]           = useState<'email' | 'code'>('email')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading]     = useState(false)
  const [toast, setToast]         = useState({ msg: '', type: 'info' as 'info' | 'error' | 'success' })
  const [quoteIdx]                = useState(() => Math.floor(Math.random() * QUOTES.length))
  const timerRef                  = useRef<ReturnType<typeof setInterval> | null>(null)

  // Already logged in → redirect
  useEffect(() => {
    if (localStorage.getItem('token')) navigate('/diary', { replace: true })
  }, [navigate])

  const tip = (msg: string, type: 'info' | 'error' | 'success' = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'info' }), 3000)
  }

  const startCountdown = () => {
    setCountdown(60)
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0 }
        return c - 1
      })
    }, 1000)
  }

  const handleSendCode = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      tip('请输入有效的邮箱地址', 'error'); return
    }
    setLoading(true)
    try {
      await api.post('/auth/send-code', { email })
      setStep('code')
      startCountdown()
      tip(`验证码已发送至 ${email}`, 'success')
    } catch (err: any) {
      tip(err.response?.data?.detail ?? '发送失败，请稍后重试', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setLoading(true)
    try {
      await api.post('/auth/send-code', { email })
      startCountdown()
      tip('验证码已重新发送', 'success')
    } catch {
      tip('发送失败，请稍后重试', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (code.length !== 6) { tip('请输入6位验证码', 'error'); return }
    setLoading(true)
    try {
      const res = await api.post('/auth/email-login', {
        email,
        code,
        username: username || email.split('@')[0],
      })
      const data = res.data?.data
      localStorage.setItem('token', data.token)
      localStorage.setItem('userId', String(data.userId))
      tip('登录成功 🎉', 'success')
      setTimeout(() => navigate('/diary', { replace: true }), 800)
    } catch (err: any) {
      const detail = err.response?.data?.detail
      tip(detail ?? '验证码错误或已过期', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return
    if (step === 'email') handleSendCode()
    else handleVerify()
  }

  return (
    <>
      <Toast msg={toast.msg} type={toast.type} />

      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg,#EEF1FF 0%,#F5F0FF 60%,#EFF6FF 100%)' }}>

        {/* Card: left bg + right form */}
        <div className="w-full max-w-3xl flex rounded-3xl overflow-hidden shadow-2xl"
          style={{ boxShadow: '0 24px 80px rgba(100,120,200,0.18)' }}>

          {/* ── Left: Background Panel ── */}
          <div className="hidden md:flex w-5/12 flex-col justify-between p-10 relative overflow-hidden flex-shrink-0"
            style={{ background: 'linear-gradient(145deg,#7C8FD4 0%,#A78BFA 60%,#C4B5FD 100%)' }}>

            {/* Decorative bubbles */}
            {BUBBLES.map((b, i) => (
              <div key={i} className="absolute rounded-full"
                style={{
                  width: b.size, height: b.size,
                  top: b.top, left: b.left,
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(2px)',
                  opacity: b.opacity,
                  animation: `float 6s ease-in-out ${b.delay} infinite alternate`,
                }} />
            ))}

            {/* Logo */}
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-bold mb-4">
                印
              </div>
              <h1 className="text-white text-2xl font-bold">印记</h1>
              <p className="text-white/70 text-sm mt-1">记录生活，认识自己</p>
            </div>

            {/* Quote */}
            <div className="relative z-10">
              <p className="text-white text-lg font-medium leading-relaxed whitespace-pre-line">
                {QUOTES[quoteIdx]}
              </p>
              <div className="flex gap-1 mt-4">
                {QUOTES.map((_, i) => (
                  <div key={i} className="h-1 rounded-full transition-all"
                    style={{
                      width: i === quoteIdx ? 20 : 6,
                      background: i === quoteIdx ? 'white' : 'rgba(255,255,255,0.4)',
                    }} />
                ))}
              </div>
            </div>

            {/* Bottom features */}
            <div className="relative z-10 flex flex-col gap-2">
              {['AI 心理分析，深度认识自我', '情绪趋势追踪，感知内心变化', '一键生成朋友圈文案'].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <Sparkles size={12} className="text-white/70 flex-shrink-0" />
                  <span className="text-white/80 text-xs">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Form Panel ── */}
          <div className="flex-1 bg-white flex flex-col justify-center p-8 md:p-12">

            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-8 md:hidden">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ background: 'linear-gradient(135deg,#7C8FD4,#C4B5FD)' }}>印</div>
              <span className="text-lg font-bold text-[#2D3250]">印记</span>
            </div>

            <h2 className="text-2xl font-bold text-[#2D3250] mb-1">
              {step === 'email' ? '欢迎回来 👋' : '验证邮箱 📬'}
            </h2>
            <p className="text-sm text-[#8A94B8] mb-8">
              {step === 'email'
                ? '输入邮箱，发送验证码即可登录或注册'
                : `验证码已发送至 ${email}`}
            </p>

            {step === 'email' ? (
              /* ── Step 1: Email ── */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2D3250] mb-1.5">邮箱地址</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C4C9E8]" />
                    <input
                      type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="请输入你的邮箱"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E0E7FF] bg-[#FAFBFF] text-[#2D3250] placeholder-[#C4C9E8] focus:outline-none focus:border-[#7C8FD4] focus:ring-2 focus:ring-[#7C8FD4]/15 transition-all text-sm"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2D3250] mb-1.5">
                    昵称 <span className="text-[#C4C9E8] font-normal">（可选，注册时使用）</span>
                  </label>
                  <input
                    type="text" value={username}
                    onChange={e => setUsername(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="如不填写将使用邮箱前缀"
                    className="w-full px-4 py-3 rounded-xl border border-[#E0E7FF] bg-[#FAFBFF] text-[#2D3250] placeholder-[#C4C9E8] focus:outline-none focus:border-[#7C8FD4] focus:ring-2 focus:ring-[#7C8FD4]/15 transition-all text-sm"
                  />
                </div>

                <button onClick={handleSendCode} disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                  style={{ background: 'linear-gradient(135deg,#7C8FD4,#C4B5FD)' }}>
                  {loading
                    ? <><RefreshCw size={15} className="animate-spin" />发送中...</>
                    : <><ArrowRight size={15} />获取验证码</>}
                </button>
              </div>
            ) : (
              /* ── Step 2: Verification Code ── */
              <div className="space-y-4">
                {/* 6-digit code input */}
                <div>
                  <label className="block text-sm font-medium text-[#2D3250] mb-1.5">6位验证码</label>
                  <input
                    type="text" inputMode="numeric" pattern="\d*"
                    maxLength={6} value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={handleKeyDown}
                    placeholder="请输入验证码"
                    className="w-full px-4 py-3.5 rounded-xl border border-[#E0E7FF] bg-[#FAFBFF] text-[#2D3250] placeholder-[#C4C9E8] focus:outline-none focus:border-[#7C8FD4] focus:ring-2 focus:ring-[#7C8FD4]/15 transition-all text-xl text-center tracking-[0.5em] font-bold"
                    autoFocus
                  />
                </div>

                {/* Resend */}
                <div className="flex items-center justify-between text-sm">
                  <button onClick={() => { setStep('email'); setCode('') }}
                    className="text-[#8A94B8] hover:text-[#7C8FD4] transition-colors">
                    ← 修改邮箱
                  </button>
                  <button onClick={handleResend} disabled={countdown > 0 || loading}
                    className="text-[#7C8FD4] font-medium disabled:text-[#C4C9E8] disabled:cursor-not-allowed transition-colors">
                    {countdown > 0 ? `${countdown}s 后重新发送` : '重新发送'}
                  </button>
                </div>

                <button onClick={handleVerify} disabled={loading || code.length !== 6}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg,#7C8FD4,#C4B5FD)' }}>
                  {loading
                    ? <><RefreshCw size={15} className="animate-spin" />验证中...</>
                    : <><Sparkles size={15} />登录 / 注册</>}
                </button>
              </div>
            )}

            <p className="text-xs text-[#C4C9E8] mt-6 text-center leading-relaxed">
              登录即代表你同意我们的服务条款和隐私政策<br />
              首次登录将自动创建账号
            </p>
          </div>
        </div>
      </div>

      {/* Float animation */}
      <style>{`
        @keyframes float {
          from { transform: translateY(0px) scale(1); }
          to   { transform: translateY(-20px) scale(1.05); }
        }
      `}</style>
    </>
  )
}

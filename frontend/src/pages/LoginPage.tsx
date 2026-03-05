import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, ArrowRight, RefreshCw, BookOpen, TrendingUp, Feather } from 'lucide-react'
import api from '../lib/api'

/* ── Toast ─────────────────────────────────────────────── */
type ToastType = 'info' | 'error' | 'success'
function Toast({ msg, type = 'info' }: { msg: string; type?: ToastType }) {
  if (!msg) return null
  const colors: Record<ToastType, string> = {
    error:   'bg-rose-500',
    success: 'bg-emerald-500',
    info:    'bg-slate-700',
  }
  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-medium text-white shadow-xl pointer-events-none ${colors[type]}`}>
      {msg}
    </div>
  )
}

/* ── Input 组件 ─────────────────────────────────────────── */
function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-700">
        {label}
        {hint && <span className="ml-1.5 text-slate-400 font-normal text-xs">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full h-14 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 focus:bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-violet-300 ' +
  'text-slate-800 placeholder-slate-300 transition-all duration-200 text-sm'

/* ── Features ───────────────────────────────────────────── */
const FEATURES = [
  { icon: BookOpen,   text: 'AI 心理分析，深度认识自我' },
  { icon: TrendingUp, text: '情绪趋势追踪，感知内心变化' },
  { icon: Feather,    text: '一键生成朋友圈文案' },
]

/* ── Main ───────────────────────────────────────────────── */
export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail]         = useState('')
  const [code, setCode]           = useState('')
  const [username, setUsername]   = useState('')
  const [step, setStep]           = useState<'email' | 'code'>('email')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading]     = useState(false)
  const [toast, setToast]         = useState({ msg: '', type: 'info' as ToastType })
  const timerRef                  = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (localStorage.getItem('token')) navigate('/diary', { replace: true })
  }, [navigate])

  const tip = (msg: string, type: ToastType = 'info') => {
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
        email, code,
        username: username || email.split('@')[0],
      })
      const data = res.data?.data
      localStorage.setItem('token', data.token)
      localStorage.setItem('userId', String(data.userId))
      localStorage.setItem('userEmail', email)
      tip('登录成功 🎉', 'success')
      setTimeout(() => navigate('/diary', { replace: true }), 800)
    } catch (err: any) {
      tip(err.response?.data?.detail ?? '验证码错误或已过期', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return
    step === 'email' ? handleSendCode() : handleVerify()
  }

  return (
    <>
      <Toast msg={toast.msg} type={toast.type} />

      {/* 全屏左右分栏，无卡片、无阴影、无圆角 */}
      <div className="flex h-screen w-full overflow-hidden bg-white">

        {/* ══════════════════════════════════════
            左侧：品牌区，占 40%，深色暗夜
        ══════════════════════════════════════ */}
        <div className="hidden md:flex w-[40%] h-full flex-col justify-between p-12 lg:p-16 relative overflow-hidden flex-shrink-0 bg-slate-900">

          {/* 光晕装饰 */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle,#a78bfa,transparent 70%)' }} />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle,#818cf8,transparent 70%)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-5"
            style={{ background: 'radial-gradient(circle,#c4b5fd,transparent 60%)' }} />

          {/* Logo 左上 */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-semibold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#818cf8,#a78bfa)' }}>
              印
            </div>
            <span className="text-white font-semibold text-lg tracking-wide">印记</span>
          </div>

          {/* 中间大标语 */}
          <div className="relative z-10">
            <p className="text-white text-4xl font-medium leading-loose tracking-wide">
              每一篇日记，<br />
              <span className="text-violet-300">都是一次</span><br />
              与内心的相遇。
            </p>
            <div className="mt-8 w-12 h-px bg-violet-400/40" />
            <p className="mt-5 text-gray-500 text-sm leading-relaxed">
              记录生活，认识自己。<br />让每一天都有迹可循。
            </p>
          </div>

          {/* 底部功能列表 */}
          <div className="relative z-10 flex flex-col gap-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-violet-300" />
                </div>
                <span className="text-slate-400 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════
            右侧：表单区，占 60%，纯白，垂直居中
        ══════════════════════════════════════ */}
        <div className="flex-1 bg-white flex items-center justify-center px-8">

          {/* 限宽表单容器，约 380px */}
          <div className="w-full max-w-sm">

            {/* 移动端 Logo */}
            <div className="flex items-center gap-2.5 mb-10 md:hidden">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg,#818cf8,#a78bfa)' }}>印</div>
              <span className="text-lg font-semibold text-slate-800">印记</span>
            </div>

            {/* 标题 */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-2">
                {step === 'email' ? '欢迎回来 👋' : '验证你的邮箱'}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                {step === 'email'
                  ? '输入邮箱，发送验证码即可登录或注册'
                  : <>验证码已发送至 <span className="text-slate-700 font-medium">{email}</span></>}
              </p>
            </div>

            {step === 'email' ? (
              /* ── Step 1: Email ── */
              <div className="flex flex-col gap-4">
                <Field label="邮箱地址">
                  <div className="relative">
                    <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                    <input
                      type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="your@email.com"
                      className={inputCls + ' pl-12'}
                      autoFocus
                    />
                  </div>
                </Field>

                <Field label="昵称" hint="（可选，注册时使用）">
                  <input
                    type="text" value={username}
                    onChange={e => setUsername(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="如不填写将使用邮箱前缀"
                    className={inputCls}
                  />
                </Field>

                <button onClick={handleSendCode} disabled={loading}
                  className="h-12 mt-2 w-full flex items-center justify-center gap-2 rounded-xl text-white text-sm font-semibold shadow-md shadow-violet-200 hover:shadow-violet-300 hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg,#818cf8 0%,#a78bfa 100%)' }}>
                  {loading
                    ? <><RefreshCw size={14} className="animate-spin" /><span>发送中...</span></>
                    : <><span>获取验证码</span><ArrowRight size={14} /></>}
                </button>
              </div>
            ) : (
              /* ── Step 2: Code ── */
              <div className="flex flex-col gap-4">
                <Field label="6 位验证码">
                  <input
                    type="text" inputMode="numeric" pattern="\d*"
                    maxLength={6} value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={handleKeyDown}
                    placeholder="· · · · · ·"
                    className={inputCls + ' text-center text-2xl font-bold tracking-[0.5em] placeholder:text-base placeholder:tracking-widest'}
                    autoFocus
                  />
                </Field>

                <div className="flex items-center justify-between text-sm">
                  <button onClick={() => { setStep('email'); setCode('') }}
                    className="text-gray-400 hover:text-gray-600 transition-colors">
                    ← 修改邮箱
                  </button>
                  <button onClick={handleResend} disabled={countdown > 0 || loading}
                    className="text-violet-500 font-medium hover:text-violet-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors">
                    {countdown > 0 ? `${countdown}s 后重新发送` : '重新发送'}
                  </button>
                </div>

                <button onClick={handleVerify} disabled={loading || code.length !== 6}
                  className="h-12 w-full flex items-center justify-center gap-2 rounded-xl text-white text-sm font-semibold shadow-md shadow-violet-200 hover:shadow-violet-300 hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg,#818cf8 0%,#a78bfa 100%)' }}>
                  {loading
                    ? <><RefreshCw size={14} className="animate-spin" /><span>验证中...</span></>
                    : <span>登录 / 注册</span>}
                </button>
              </div>
            )}

            {/* 协议文字 */}
            <p className="text-sm text-gray-400 mt-8 text-center leading-6">
              登录即代表你同意我们的
              <span className="text-gray-500 cursor-pointer hover:underline mx-0.5">服务条款</span>
              和
              <span className="text-gray-500 cursor-pointer hover:underline mx-0.5">隐私政策</span>
              <br />首次登录将自动创建账号
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

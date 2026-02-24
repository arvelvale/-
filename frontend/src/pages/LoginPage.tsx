import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        const res = await authApi.login({ email: form.email, password: form.password })
        const data = res.data?.data
        localStorage.setItem('token', data.token)
        localStorage.setItem('userId', String(data.userId))
      } else {
        await authApi.register({ username: form.username, email: form.email, password: form.password })
        const res = await authApi.login({ email: form.email, password: form.password })
        const data = res.data?.data
        localStorage.setItem('token', data.token)
        localStorage.setItem('userId', String(data.userId))
      }
      navigate('/diary')
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? (isLogin ? '邮箱或密码错误' : '注册失败，请检查信息')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #EEF1FF 0%, #F5F0FF 50%, #EFF6FF 100%)' }}>

      {/* Decorative blobs */}
      <div className="absolute top-20 left-20 w-72 h-72 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, #A5B4FC, transparent)' }} />
      <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #C4B5FD, transparent)' }} />

      <div className="relative w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg"
            style={{ background: 'linear-gradient(135deg, #7C8FD4, #C4B5FD)' }}>
            印
          </div>
          <h1 className="text-2xl font-bold text-[#2D3250]">印记</h1>
          <p className="text-[#8A94B8] mt-1 text-sm">记录生活，认识自己</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {/* Tab */}
          <div className="flex bg-[#F0F4FF] rounded-xl p-1 mb-6">
            {['登录', '注册'].map((tab, i) => (
              <button key={tab} onClick={() => setIsLogin(i === 0)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isLogin === (i === 0)
                    ? 'bg-white text-[#7C8FD4] shadow-sm'
                    : 'text-[#8A94B8]'
                }`}>
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-[#2D3250] mb-1.5">用户名</label>
                <input
                  type="text" placeholder="请输入用户名"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#E0E7FF] bg-white/80 text-[#2D3250] placeholder-[#C4C9E8] focus:outline-none focus:border-[#7C8FD4] focus:ring-2 focus:ring-[#7C8FD4]/20 transition-all text-sm"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#2D3250] mb-1.5">邮箱</label>
              <input
                type="email" placeholder="请输入邮箱"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[#E0E7FF] bg-white/80 text-[#2D3250] placeholder-[#C4C9E8] focus:outline-none focus:border-[#7C8FD4] focus:ring-2 focus:ring-[#7C8FD4]/20 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D3250] mb-1.5">密码</label>
              <input
                type="password" placeholder="请输入密码"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[#E0E7FF] bg-white/80 text-[#2D3250] placeholder-[#C4C9E8] focus:outline-none focus:border-[#7C8FD4] focus:ring-2 focus:ring-[#7C8FD4]/20 transition-all text-sm"
              />
            </div>

            {error && (
              <div className="px-4 py-2.5 rounded-xl bg-[#FFF0EE] border border-[#EF5350]/20 text-sm text-[#EF5350]">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white font-medium text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #7C8FD4, #C4B5FD)' }}>
              {loading ? '请稍候...' : (isLogin ? '登录' : '注册')}
            </button>
          </form>

          {isLogin && (
            <p className="text-center text-xs text-[#8A94B8] mt-4">
              还没有账号？
              <button onClick={() => setIsLogin(false)} className="text-[#7C8FD4] font-medium ml-1">立即注册</button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

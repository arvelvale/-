import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { BookOpen, BarChart2, Brain, FileText, User, Settings, LogOut, ChevronDown } from 'lucide-react'

const navItems = [
  { to: '/diary', icon: BookOpen, label: '日记' },
  { to: '/insights', icon: BarChart2, label: '洞察' },
  { to: '/ai', icon: Brain, label: 'AI分析' },
  { to: '/social', icon: FileText, label: '文案' },
  { to: '/profile', icon: User, label: '我的' },
]

export default function MainLayout() {
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const userEmail = localStorage.getItem('userEmail') || ''
  const userName = localStorage.getItem('userName') || userEmail.split('@')[0] || '默认用户'
  const userInitial = userName.charAt(0).toUpperCase()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userName')
    localStorage.removeItem('currentDiaryId')
    localStorage.removeItem('currentDiaryContent')
    localStorage.removeItem('diaryDraft')
    setShowDropdown(false)
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Nav */}
      <header className="flex items-center justify-between px-6 py-2.5 bg-white/70 backdrop-blur-xl border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #7C8FD4, #C4B5FD)' }}>
            印
          </div>
          <span className="text-lg font-bold text-gray-800">印记</span>
        </div>

        <nav className="flex items-center gap-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#7C8FD4]/12 text-[#7C8FD4]'
                    : 'text-gray-400 hover:text-[#7C8FD4] hover:bg-gray-50'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A5B4FC] to-[#C4B5FD] flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {userInitial}
            </div>
            <span className="text-sm text-gray-600 font-medium max-w-[80px] truncate">{userName}</span>
            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-lg shadow-gray-200/60 border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* User Info Header */}
              <div className="px-4 py-4 bg-gradient-to-br from-[#F8F9FF] to-[#F3F0FF]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#A5B4FC] to-[#C4B5FD] flex items-center justify-center text-white text-base font-bold shadow-md">
                    {userInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{userName}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{userEmail || '未绑定邮箱'}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1.5 px-1.5">
                <button
                  onClick={() => { setShowDropdown(false); navigate('/profile') }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <User size={16} className="text-gray-400" />
                  个人主页
                </button>
                <button
                  onClick={() => { setShowDropdown(false); navigate('/profile') }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <Settings size={16} className="text-gray-400" />
                  偏好设置
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-100 py-1.5 px-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut size={16} />
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 overflow-hidden w-full relative">
        <Outlet />
      </main>
    </div>
  )
}

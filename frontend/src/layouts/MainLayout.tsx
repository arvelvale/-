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

  // 获取用户信息
  const userEmail = localStorage.getItem('userEmail') || '用户'
  const userName = userEmail.split('@')[0] || '用户'
  const userInitial = userName.charAt(0).toUpperCase()

  // 点击外部关闭下拉菜单
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
    localStorage.removeItem('currentDiaryId')
    localStorage.removeItem('currentDiaryContent')
    setShowDropdown(false)
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Nav */}
      <header className="flex items-center justify-between px-6 py-3 bg-white/60 backdrop-blur-md border-b border-white/80 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #7C8FD4, #C4B5FD)' }}>
            印
          </div>
          <span className="text-lg font-bold text-[#2D3250]">印记</span>
        </div>

        <nav className="flex items-center gap-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#7C8FD4]/15 text-[#7C8FD4]'
                    : 'text-[#8A94B8] hover:text-[#7C8FD4] hover:bg-[#7C8FD4]/08'
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
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[#7C8FD4]/10 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A5B4FC] to-[#C4B5FD] flex items-center justify-center text-white text-xs font-bold">
              {userInitial}
            </div>
            <ChevronDown size={14} className={`text-[#8A94B8] transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#E8EEFF] py-2 z-50">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-[#E8EEFF]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A5B4FC] to-[#C4B5FD] flex items-center justify-center text-white text-sm font-bold">
                    {userInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2D3250] truncate">{userName}</p>
                    <p className="text-xs text-[#8A94B8] truncate">{userEmail}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={() => { setShowDropdown(false); navigate('/profile') }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#2D3250] hover:bg-[#7C8FD4]/10 transition-colors"
                >
                  <User size={16} className="text-[#8A94B8]" />
                  个人中心
                </button>
                <button
                  onClick={() => { setShowDropdown(false); navigate('/profile') }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#2D3250] hover:bg-[#7C8FD4]/10 transition-colors"
                >
                  <Settings size={16} className="text-[#8A94B8]" />
                  账号设置
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-[#E8EEFF] pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
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

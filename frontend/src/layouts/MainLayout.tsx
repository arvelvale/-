import { Outlet, NavLink } from 'react-router-dom'
import { BookOpen, BarChart2, Brain, FileText, User } from 'lucide-react'

const navItems = [
  { to: '/diary', icon: BookOpen, label: '日记' },
  { to: '/insights', icon: BarChart2, label: '洞察' },
  { to: '/ai', icon: Brain, label: 'AI分析' },
  { to: '/social', icon: FileText, label: '文案' },
  { to: '/profile', icon: User, label: '我的' },
]

export default function MainLayout() {
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

        <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[#7C8FD4]/10 transition-all">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A5B4FC] to-[#C4B5FD] flex items-center justify-center text-white text-xs font-bold">
            U
          </div>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke="#8A94B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </header>

      {/* Page Content */}
      <main className="flex-1 overflow-hidden w-full relative">
        <Outlet />
      </main>
    </div>
  )
}

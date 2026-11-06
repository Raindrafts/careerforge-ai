import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  UserCircle,
  Sparkles,
  BarChart3,
  Map,
  MessageSquare,
  FileDown,
  LogOut,
  BrainCircuit,
  ChevronLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/profile', icon: UserCircle, label: 'My Profile' },
  { to: '/career-profile', icon: Sparkles, label: 'Career Profile' },
  { to: '/skill-gap', icon: BarChart3, label: 'Skill Gap' },
  { to: '/roadmap', icon: Map, label: 'Roadmap' },
  { to: '/interview', icon: MessageSquare, label: 'Interview Prep' },
  { to: '/reports', icon: FileDown, label: 'Reports' },
]

export function Sidebar() {
  const { signOut, user } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-white border-r border-border transition-all duration-300 sticky top-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center flex-shrink-0">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground leading-none">CareerForge</p>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">AI Platform</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center mx-auto">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-auto"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-brand-50 text-brand-700 border border-brand-200'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                collapsed && 'justify-center px-2'
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-border">
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
            <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {user.email?.[0].toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={signOut}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  )
}

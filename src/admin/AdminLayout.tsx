import React, { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Users, ArrowDownLeft, ArrowUpRight, Tag, LogOut, Menu, X, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../../store'
import { Logo } from '../../components/Logo'

const NAV = [
  { path: '/admin/dashboard',   icon: LayoutDashboard, key: 'dashboard' },
  { path: '/admin/deposits',    icon: ArrowDownLeft,   key: 'deposits'  },
  { path: '/admin/withdrawals', icon: ArrowUpRight,    key: 'withdrawals'},
  { path: '/admin/users',       icon: Users,           key: 'users'     },
  { path: '/admin/promos',      icon: Tag,             key: 'promos'    },
]

const AdminLayout: React.FC = () => {
  const { t } = useTranslation()
  const nav = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); nav('/admin', { replace: true }) }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-white/5">
        <Logo size="sm"/>
        <div className="mt-3 text-xs text-db-red font-bold uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-db-red animate-pulse"/>
          Admin Panel
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ path, icon: Icon, key }) => (
          <NavLink key={path} to={path}
            className={({ isActive }) => `admin-sidebar-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}>
            <Icon size={17}/>
            <span>{t(`admin.${key}`)}</span>
            <ChevronRight size={13} className="ml-auto opacity-30"/>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
          <div className="w-7 h-7 rounded-full bg-db-red/20 flex items-center justify-center text-db-red text-xs font-black">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div><div className="text-sm font-semibold">{user?.username}</div>
            <div className="text-xs text-db-text2">Administrator</div></div>
        </div>
        <button onClick={handleLogout}
          className="admin-sidebar-item w-full text-db-red hover:bg-db-red/10">
          <LogOut size={16}/><span>{t('admin.logout')}</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-db-bg overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col bg-db-bg2 border-r border-white/5">
        <SidebarContent/>
      </aside>

      {/* Mobile overlay sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}/>
          <aside className="relative w-64 bg-db-bg2 flex flex-col">
            <button className="absolute top-4 right-4 text-db-text2" onClick={() => setSidebarOpen(false)}>
              <X size={20}/>
            </button>
            <SidebarContent/>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-db-bg2 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-db-text2"><Menu size={20}/></button>
          <Logo size="sm"/>
          <div className="ml-auto text-xs text-db-red font-bold">ADMIN</div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet/>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout

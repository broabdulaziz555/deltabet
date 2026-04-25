import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Users, ArrowDownLeft, ArrowUpRight, Tag, LogOut, Menu, X, Gamepad2 } from 'lucide-react'
import { useAuthStore } from '../store'
import { Logo } from '../components/Logo'
import Dashboard     from './pages/Dashboard'
import AdminDeposits from './pages/Deposits'
import { AdminWithdrawals, AdminUsers, AdminPromos, AdminBets } from './pages/AdminPages'

const NAV = [
  { path: '/admin/dashboard',   icon: LayoutDashboard, label: 'Dashboard'   },
  { path: '/admin/deposits',    icon: ArrowDownLeft,   label: 'Deposits'    },
  { path: '/admin/withdrawals', icon: ArrowUpRight,    label: 'Withdrawals' },
  { path: '/admin/users',       icon: Users,           label: 'Users'       },
  { path: '/admin/promos',      icon: Tag,             label: 'Promos'      },
  { path: '/admin/bets',        icon: Gamepad2,        label: 'All Bets'    },
]

const PAGE_MAP: Record<string, React.FC> = {
  dashboard:   Dashboard,
  deposits:    AdminDeposits,
  withdrawals: AdminWithdrawals,
  users:       AdminUsers,
  promos:      AdminPromos,
  bets:        AdminBets,
}

interface Props { page: string }

const AdminLayout: React.FC<Props> = ({ page }) => {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); nav('/admin', { replace: true }) }
  const PageComponent = PAGE_MAP[page] || Dashboard

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-white/5">
        <Logo size="sm"/>
        <div className="mt-2 text-xs text-db-red font-bold uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-db-red animate-pulse"/>Admin Panel
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ path, icon: Icon, label }) => (
          <button key={path}
            className={`admin-sidebar-item ${pathname === path ? 'active' : ''}`}
            onClick={() => { nav(path); setOpen(false) }}>
            <Icon size={17}/><span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
          <div className="w-7 h-7 rounded-full bg-db-red/20 flex items-center justify-center text-db-red text-xs font-black">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold">{user?.username}</div>
            <div className="text-xs text-db-text2">Administrator</div>
          </div>
        </div>
        <button onClick={handleLogout} className="admin-sidebar-item text-db-red hover:bg-db-red/10 w-full">
          <LogOut size={16}/><span>Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-db-bg overflow-hidden">
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col bg-db-bg2 border-r border-white/5">
        <Sidebar/>
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)}/>
          <aside className="relative w-64 bg-db-bg2 flex flex-col">
            <button className="absolute top-4 right-4 text-db-text2" onClick={() => setOpen(false)}><X size={20}/></button>
            <Sidebar/>
          </aside>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-db-bg2 flex-shrink-0">
          <button onClick={() => setOpen(true)} className="text-db-text2"><Menu size={20}/></button>
          <Logo size="sm"/>
          <div className="ml-auto text-xs text-db-red font-bold">ADMIN</div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <PageComponent/>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout

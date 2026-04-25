import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Gamepad2, History, Wallet, User, TrendingUp } from 'lucide-react'
import { Logo } from '../Logo'
import { useAuthStore } from '../../store'
import { fmtUZS } from '../../api/client'

const NAV_ITEMS = [
  { path: '/game',         icon: Gamepad2, key: 'game'    },
  { path: '/history',      icon: History,  key: 'history' },
  { path: '/deposit',      icon: Wallet,   key: 'deposit' },
  { path: '/transactions', icon: TrendingUp, key: 'wallet' },
  { path: '/profile',      icon: User,     key: 'profile' },
]

const MobileLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const user = useAuthStore((s) => s.user)

  return (
    <div className="flex flex-col h-full bg-db-bg overflow-hidden">
      {/* Header */}
      <header className="safe-top flex-shrink-0 z-30" style={{ background: 'rgba(7,7,15,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-between px-4 py-3">
          <Logo size="sm" />
          <div
            className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
            onClick={() => nav('/deposit')}
          >
            <div className="text-right">
              <div className="text-xs text-db-text2 leading-none mb-0.5">{t('profile.balance')}</div>
              <div className="text-sm font-bold mono text-white leading-none">
                {fmtUZS(parseFloat(user?.balance || '0'), true)}
              </div>
            </div>
            <div className="bg-db-red text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-red-glow">
              + {t('nav.deposit')}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="safe-bottom flex-shrink-0 z-30" style={{ background: 'rgba(10,10,22,0.97)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center px-2 py-1">
          {NAV_ITEMS.map(({ path, icon: Icon, key }) => {
            const active = pathname === path || pathname.startsWith(path + '/')
            return (
              <button
                key={path}
                className={`bottom-nav-item ${active ? 'active' : ''}`}
                onClick={() => nav(path)}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span>{t(`nav.${key}`)}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default MobileLayout

import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { LogOut, TrendingUp, Award, Shield } from 'lucide-react'
import { authAPI, fmtUZS } from '../../api/client'
import { useAuthStore } from '../../store'
import { Spinner } from '../../components/ui'
import MobileLayout from '../../components/Layout/MobileLayout'
import { LANGUAGES } from '../../i18n'
import i18n from '../../i18n'
import { DeltaIcon } from '../../components/Logo'

const Profile: React.FC = () => {
  const { t } = useTranslation()
  const nav = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [stats, setStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [lang, setLang] = useState(i18n.language)

  useEffect(() => {
    authAPI.stats().then((r) => setStats(r.data)).catch(() => {}).finally(() => setLoadingStats(false))
  }, [])

  const wageringPct = user?.wagering_required && parseFloat(user.wagering_required) > 0
    ? Math.min(100, parseFloat(user.wagered_amount || '0') / parseFloat(user.wagering_required) * 100)
    : 100

  const handleLogout = () => { logout(); nav('/login', { replace: true }) }
  const switchLang = (code: string) => { i18n.changeLanguage(code); setLang(code) }

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-full pb-8">
        {/* Hero */}
        <div className="px-4 py-6 text-center"
          style={{ background: 'linear-gradient(180deg,#0d0d20,#07070f)', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
          <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,rgba(230,57,70,.2),rgba(58,134,255,.2))', border: '2px solid rgba(255,255,255,.1)' }}>
            <DeltaIcon size={40}/>
          </div>
          <h2 className="text-xl font-black">{user?.username}</h2>
        </div>

        <div className="px-4 py-4 flex flex-col gap-4">
          {/* Balance */}
          <div className="db-card p-4" style={{ background: 'linear-gradient(135deg,#0d1528,#0d0d22)', border: '1px solid rgba(58,134,255,.15)' }}>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs text-db-text2 mb-1">{t('profile.balance')}</div>
                <div className="font-black mono">{fmtUZS(parseFloat(user?.balance||'0'),true)}</div>
              </div>
              <div>
                <div className="text-xs text-db-text2 mb-1">{t('profile.bonusBalance')}</div>
                <div className="font-black mono text-db-gold">{fmtUZS(parseFloat(user?.bonus_balance||'0'),true)}</div>
              </div>
              <div>
                <div className="text-xs text-db-text2 mb-1">{t('profile.totalBalance')}</div>
                <div className="font-black mono text-db-blue">{fmtUZS(parseFloat(user?.total_balance||'0'),true)}</div>
              </div>
            </div>
          </div>

          {/* Wagering */}
          {parseFloat(user?.wagering_required||'0') > 0 && (
            <div className="db-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-bold flex items-center gap-1.5">
                  <Shield size={14} className="text-db-blue"/>{t('profile.wagering')}
                </div>
                <span className={`text-xs font-bold ${user?.can_withdraw?'text-db-green':'text-db-gold'}`}>
                  {user?.can_withdraw ? t('profile.unlocked') : `${wageringPct.toFixed(0)}%`}
                </span>
              </div>
              <div className="h-2 rounded-full bg-db-elevated overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${wageringPct}%`, background: `linear-gradient(90deg,${user?.can_withdraw?'#06d6a0':'#ffd60a'},${user?.can_withdraw?'#059669':'#f59e0b'})` }}/>
              </div>
              <div className="text-xs text-db-text2 mt-1.5">
                {t('profile.wageringProgress', {
                  wagered: fmtUZS(parseFloat(user?.wagered_amount||'0'),true),
                  required: fmtUZS(parseFloat(user?.wagering_required||'0'),true)
                })}
              </div>
            </div>
          )}

          {/* Stats */}
          {loadingStats ? <Spinner/> : stats && (
            <div className="db-card p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <TrendingUp size={14} className="text-db-red"/>
                <span className="text-sm font-bold">Stats</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t('profile.stats.totalBets'), val: stats.overall?.total_bets || 0 },
                  { label: t('profile.stats.winRate'),   val: `${stats.overall?.win_rate || 0}%`, color: 'text-db-green' },
                  { label: t('profile.stats.totalBet'),  val: fmtUZS(parseFloat(stats.overall?.total_bet||'0'),true), mono: true },
                  { label: t('profile.stats.totalWon'),  val: fmtUZS(parseFloat(stats.overall?.total_payout||'0'),true), color: 'text-db-gold', mono: true },
                ].map((s) => (
                  <div key={s.label} className="bg-db-elevated rounded-xl p-3">
                    <div className="text-xs text-db-text2 mb-1">{s.label}</div>
                    <div className={`font-bold text-sm ${s.color||''} ${s.mono?'mono':''}`}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Language */}
          <div className="db-card p-4">
            <div className="text-sm font-bold mb-3">{t('profile.language')}</div>
            <div className="flex gap-2">
              {LANGUAGES.map((l) => (
                <button key={l.code} onClick={() => switchLang(l.code)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5
                    ${lang===l.code?'bg-db-blue/20 text-db-blue border border-db-blue/30':'bg-db-elevated text-db-text2'}`}>
                  {l.flag} {l.code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="flex gap-2">
            <button className="flex-1 py-3 rounded-2xl text-sm font-bold bg-db-elevated text-db-text2 hover:text-white transition-all flex items-center justify-center gap-2"
              onClick={() => nav('/deposit')}>
              <Award size={16} className="text-db-gold"/> Deposit
            </button>
            <button className="flex-1 py-3 rounded-2xl text-sm font-bold bg-db-elevated text-db-text2 hover:text-white transition-all flex items-center justify-center gap-2"
              onClick={() => nav('/history')}>
              <TrendingUp size={16} className="text-db-blue"/> History
            </button>
          </div>

          {/* Logout */}
          <button onClick={handleLogout}
            className="w-full py-4 rounded-2xl text-sm font-bold text-db-red bg-db-red/10 border border-db-red/20 flex items-center justify-center gap-2 hover:bg-db-red/15 transition-all">
            <LogOut size={16}/>{t('profile.logout')}
          </button>
        </div>
      </div>
    </MobileLayout>
  )
}

export default Profile

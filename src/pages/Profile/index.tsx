import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { LogOut, TrendingUp, ArrowDownLeft, ArrowUpRight, Shield, Gift, Check, Edit2, CreditCard } from 'lucide-react'
import { authAPI, bonusAPI, fmtUZS } from '../../api/client'
import { useAuthStore } from '../../store'
import toast from 'react-hot-toast'
import { SkeletonLoader } from '../../components/ui'
import MobileLayout from '../../components/Layout/MobileLayout'
import { LANGUAGES } from '../../i18n'
import i18n from '../../i18n'
import { DeltaIcon } from '../../components/Logo'
import LevelBadge from '../../components/LevelBadge'

interface WelcomeBonusStatus {
  has_bonus: boolean
  amount?: string
  wagering_requirement?: string
  wagered_so_far?: string
  fully_unlocked?: boolean
  pct?: number
}

const Profile: React.FC = () => {
  const { t } = useTranslation()
  const nav = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [stats, setStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [welcomeBonus, setWelcomeBonus] = useState<WelcomeBonusStatus | null>(null)
  const [lang, setLang] = useState(i18n.language)
  const [editingPromo, setEditingPromo] = useState(false)
  const [promoInput, setPromoInput] = useState('')
  const [savingPromo, setSavingPromo] = useState(false)

  const setUser = useAuthStore((s) => s.setUser)

  const handlePromoSave = async () => {
    if (!promoInput.trim()) { setEditingPromo(false); return }
    setSavingPromo(true)
    try {
      await authAPI.updatePromoCode(promoInput.trim())
      setUser({ ...user!, promo_code: promoInput.trim() })
      setEditingPromo(false)
      toast.success('Promo code updated')
    } catch {
      toast.error('Invalid or already used promo code')
    } finally {
      setSavingPromo(false)
    }
  }

  useEffect(() => {
    authAPI.stats().then((r) => setStats(r.data)).catch(() => toast.error('Failed to load stats')).finally(() => setLoadingStats(false))
    bonusAPI.welcomeStatus().then((r) => setWelcomeBonus(r.data)).catch(() => {})
    authAPI.me().then((r) => setUser(r.data)).catch(() => {})
  }, [])

  const wageringPct = user?.wagering_required && parseFloat(user.wagering_required) > 0
    ? Math.min(100, parseFloat(user.wagered_amount || '0') / parseFloat(user.wagering_required) * 100)
    : 100

  const handleLogout = () => { logout(); nav('/login', { replace: true }) }
  const switchLang = (code: string) => { i18n.changeLanguage(code); setLang(code) }

  const bonusBalance  = parseFloat(user?.bonus_balance  || '0')
  const wageringReq   = parseFloat(user?.wagering_required || '0')

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
          {user?.level && user.level !== 'none' && (
            <div className="mt-2">
              <LevelBadge level={user.level} size="md" />
            </div>
          )}
        </div>

        <div className="px-4 py-4 flex flex-col gap-4">
          {/* Balance — two separate clearly labeled cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="db-card p-4 flex flex-col gap-1.5" style={{ background: 'linear-gradient(135deg,#0d1528,#0d0d22)', border: '1px solid rgba(58,134,255,.2)' }}>
              <div className="flex items-center gap-1.5">
                <CreditCard size={12} className="text-db-blue"/>
                <span className="text-[10px] font-semibold text-db-text2 uppercase tracking-wider">{t('profile.balance')}</span>
              </div>
              <div className="font-black mono text-base">{fmtUZS(parseFloat(user?.balance||'0'))}</div>
            </div>
            <div className="db-card p-4 flex flex-col gap-1.5" style={{ background: 'linear-gradient(135deg,#16120a,#0d0d22)', border: '1px solid rgba(255,215,0,.2)' }}>
              <div className="flex items-center gap-1.5">
                <Gift size={12} className="text-db-gold"/>
                <span className="text-[10px] font-semibold text-db-text2 uppercase tracking-wider">{t('profile.bonusBalance')}</span>
              </div>
              <div className="font-black mono text-base text-db-gold">{fmtUZS(bonusBalance)}</div>
            </div>
          </div>

          {/* Lifetime deposits + Promo code */}
          <div className="db-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-db-text2 uppercase tracking-wide">Lifetime Deposits</span>
              <span className="font-bold mono text-sm text-db-green">{fmtUZS(parseFloat(user?.lifetime_deposits||'0'))}</span>
            </div>
            <div className="border-t border-white/5 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-db-text2 uppercase tracking-wide">Promo Code</span>
                {!editingPromo && (
                  <button
                    onClick={() => { setEditingPromo(true); setPromoInput(user?.promo_code || '') }}
                    className="text-xs text-db-blue flex items-center gap-1 hover:underline transition-all"
                  >
                    <Edit2 size={11}/> Edit
                  </button>
                )}
              </div>
              {editingPromo ? (
                <div className="flex items-center gap-2">
                  <input
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    className="db-input text-sm flex-1 h-9"
                    placeholder="Enter promo code"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handlePromoSave()
                      if (e.key === 'Escape') setEditingPromo(false)
                    }}
                  />
                  <button
                    onClick={handlePromoSave}
                    disabled={savingPromo}
                    className="text-xs font-bold bg-db-blue/20 text-db-blue px-3 py-1.5 rounded-xl hover:bg-db-blue/30 transition-all disabled:opacity-50"
                  >
                    {savingPromo ? '...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingPromo(false)}
                    className="text-xs text-db-text2 px-2 py-1.5 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <span className={`text-sm font-bold mono ${user?.promo_code ? 'text-db-gold' : 'text-db-muted italic'}`}>
                  {user?.promo_code || '— none —'}
                </span>
              )}
            </div>
          </div>

          {/* Welcome Bonus Card — shown when user has a welcome bonus */}
          {welcomeBonus?.has_bonus && (
            <div
              className="db-card p-4 space-y-3"
              style={{ background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.2)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Gift size={15} className="text-db-gold" />
                  <span className="text-db-gold">Welcome Bonus</span>
                </div>
                {welcomeBonus.fully_unlocked ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-db-green">
                    <Check size={12} />Unlocked
                  </span>
                ) : (
                  <span className="text-xs text-db-gold font-bold">{welcomeBonus.pct?.toFixed(0)}%</span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-db-muted">
                <span>Bonus credited: <span className="text-db-gold font-bold">{fmtUZS(parseFloat(welcomeBonus.amount||'0'),true)}</span></span>
                <span>3× wagering required</span>
              </div>

              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${welcomeBonus.pct || 0}%`,
                    background: welcomeBonus.fully_unlocked
                      ? 'linear-gradient(90deg,#06d6a0,#059669)'
                      : 'linear-gradient(90deg,#ffd60a,#f59e0b)',
                  }}
                />
              </div>

              <div className="text-xs text-db-muted">
                Wagered{' '}
                <span className="text-white font-semibold">{fmtUZS(parseFloat(welcomeBonus.wagered_so_far||'0'),true)}</span>
                {' '}of{' '}
                <span className="text-white font-semibold">{fmtUZS(parseFloat(welcomeBonus.wagering_requirement||'0'),true)}</span>
                {!welcomeBonus.fully_unlocked && (
                  <span className="text-db-muted"> · {fmtUZS(Math.max(0, parseFloat(welcomeBonus.wagering_requirement||'0') - parseFloat(welcomeBonus.wagered_so_far||'0')),true)} remaining</span>
                )}
              </div>
            </div>
          )}

          {/* Wagering progress with milestones */}
          {wageringReq > 0 && (
            <div className="db-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold flex items-center gap-1.5">
                  <Shield size={14} className="text-db-blue"/>{t('profile.wagering')}
                </div>
                <span className={`text-xs font-bold ${user?.can_withdraw?'text-db-green':'text-db-gold'}`}>
                  {user?.can_withdraw ? t('profile.unlocked') : `${wageringPct.toFixed(0)}%`}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full bg-db-elevated overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${wageringPct}%`,
                    background: user?.can_withdraw
                      ? 'linear-gradient(90deg,#06d6a0,#059669)'
                      : 'linear-gradient(90deg,#ffd60a,#f59e0b)',
                  }}
                />
              </div>

              {/* Milestone dots */}
              {user?.wagering_progress && (
                <div className="flex justify-between px-0.5">
                  {([
                    { key: 'unlocked_25', label: '25%' },
                    { key: 'unlocked_50', label: '50%' },
                    { key: 'unlocked_75', label: '75%' },
                    { key: 'unlocked_100', label: '100%' },
                  ] as const).map(({ key, label }) => {
                    const unlocked = !!user.wagering_progress?.[key]
                    return (
                      <div key={key} className="flex flex-col items-center gap-1">
                        <div className={`w-3 h-3 rounded-full border-2 transition-all
                          ${unlocked
                            ? 'bg-db-green border-db-green'
                            : 'bg-db-elevated border-white/20'}`}
                        />
                        <span className={`text-[10px] font-bold ${unlocked ? 'text-db-green' : 'text-db-muted'}`}>
                          {label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="text-xs text-db-text2">
                {t('profile.wageringProgress', {
                  wagered:  fmtUZS(parseFloat(user?.wagered_amount||'0'),true),
                  required: fmtUZS(wageringReq,true)
                })}
              </div>

              {user?.wagering_progress && parseFloat(user.wagering_progress.locked_bonus) > 0 && (
                <div className="text-xs text-db-gold">
                  {fmtUZS(parseFloat(user.wagering_progress.locked_bonus), true)} bonus locked — unlocks as you wager
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          {loadingStats ? (
            <div className="db-card p-4 space-y-3">
              <SkeletonLoader className="h-4 w-24" />
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonLoader key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            </div>
          ) : stats && (
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
              <ArrowDownLeft size={16} className="text-db-green"/> Deposit
            </button>
            <button className="flex-1 py-3 rounded-2xl text-sm font-bold bg-db-elevated text-db-text2 hover:text-white transition-all flex items-center justify-center gap-2"
              onClick={() => nav('/withdraw')}>
              <ArrowUpRight size={16} className="text-db-red"/> Withdraw
            </button>
            <button className="flex-1 py-3 rounded-2xl text-sm font-bold bg-db-elevated text-db-text2 hover:text-white transition-all flex items-center justify-center gap-2"
              onClick={() => nav('/transactions')}>
              <TrendingUp size={16} className="text-db-blue"/> Wallet
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

import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Users, ArrowDownLeft, ArrowUpRight, DollarSign, Percent, AlertTriangle } from 'lucide-react'
import { adminAPI, fmtUZS } from '../../api/client'
import { Spinner } from '../../components/ui'

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; sub?: string; color?: string; onClick?: () => void }> =
  ({ icon, label, value, sub, color = 'text-white', onClick }) => (
  <div className="db-card p-4 cursor-pointer hover:border-white/10 transition-all active:scale-98"
    style={{ border: '1px solid rgba(255,255,255,0.06)' }} onClick={onClick}>
    <div className="flex items-start justify-between mb-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5">{icon}</div>
    </div>
    <div className={`text-xl font-black mono ${color}`}>{value}</div>
    <div className="text-xs text-db-text2 mt-0.5">{label}</div>
    {sub && <div className="text-xs text-db-muted mt-1">{sub}</div>}
  </div>
)

const Dashboard: React.FC = () => {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.stats()
      .then((r) => setData(r.data))
      .catch(() => {
        // Fallback mock data if admin endpoints not yet implemented
        setData({
          users: { total: 0, new_today: 0, banned: 0 },
          bets: { total: 0, today: 0, total_wagered: 0, house_profit: 0, real_profit: 0, player_winrate_7d: 0 },
          deposits: { pending: 0, total_approved: 0, today: 0 },
          withdrawals: { pending: 0, total_approved: 0 },
          net_cashflow: 0
        })
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner/></div>

  const s = data
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-black">{t('admin.dashboard')}</h1>
        <p className="text-db-text2 text-sm mt-0.5">DeltaBet platform overview</p>
      </div>

      {/* Alerts */}
      {(s.deposits?.pending > 0 || s.withdrawals?.pending > 0) && (
        <div className="flex flex-col gap-2">
          {s.deposits?.pending > 0 && (
            <div className="flex items-center gap-3 bg-db-gold/10 border border-db-gold/25 rounded-xl p-3 cursor-pointer hover:border-db-gold/40 transition-all"
              onClick={() => nav('/admin/deposits')}>
              <AlertTriangle size={16} className="text-db-gold flex-shrink-0"/>
              <span className="text-sm font-semibold">{s.deposits.pending} pending deposit{s.deposits.pending > 1 ? 's' : ''} need approval</span>
              <span className="ml-auto text-xs text-db-gold">Review →</span>
            </div>
          )}
          {s.withdrawals?.pending > 0 && (
            <div className="flex items-center gap-3 bg-db-red/10 border border-db-red/25 rounded-xl p-3 cursor-pointer hover:border-db-red/40 transition-all"
              onClick={() => nav('/admin/withdrawals')}>
              <AlertTriangle size={16} className="text-db-red flex-shrink-0"/>
              <span className="text-sm font-semibold">{s.withdrawals.pending} pending withdrawal{s.withdrawals.pending > 1 ? 's' : ''} need approval</span>
              <span className="ml-auto text-xs text-db-red">Review →</span>
            </div>
          )}
        </div>
      )}

      {/* Money flow */}
      <div>
        <h2 className="text-xs font-bold text-db-text2 uppercase tracking-widest mb-3">💰 Money Flow</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard icon={<ArrowDownLeft size={18} className="text-db-green"/>} label="Total Deposited"
            value={fmtUZS(s.deposits?.total_approved||0,true)} sub={`Today: ${fmtUZS(s.deposits?.today||0,true)}`} color="text-db-green"
            onClick={() => nav('/admin/deposits')}/>
          <StatCard icon={<ArrowUpRight size={18} className="text-db-red"/>} label="Total Withdrawn"
            value={fmtUZS(s.withdrawals?.total_approved||0,true)} color="text-db-red"
            onClick={() => nav('/admin/withdrawals')}/>
          <StatCard icon={<DollarSign size={18} className="text-db-blue"/>} label="Net Cash Flow"
            value={fmtUZS(s.net_cashflow||0,true)} color={s.net_cashflow >= 0 ? 'text-db-green' : 'text-db-red'}/>
        </div>
      </div>

      {/* Game stats */}
      <div>
        <h2 className="text-xs font-bold text-db-text2 uppercase tracking-widest mb-3">🎮 Game Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard icon={<TrendingUp size={18} className="text-db-blue"/>} label="House Profit"
            value={fmtUZS(s.bets?.house_profit||0,true)} sub={`Real: ${fmtUZS(s.bets?.real_profit||0,true)}`} color="text-db-gold"/>
          <StatCard icon={<TrendingUp size={18} className="text-db-text2"/>} label="Total Wagered"
            value={fmtUZS(s.bets?.total_wagered||0,true)} sub={`Today: ${s.bets?.today||0} bets`}/>
          <StatCard icon={<Percent size={18} className="text-db-gold"/>} label="Player Win Rate (7d)"
            value={`${s.bets?.player_winrate_7d||0}%`} color="text-db-gold"/>
        </div>
      </div>

      {/* Users */}
      <div>
        <h2 className="text-xs font-bold text-db-text2 uppercase tracking-widest mb-3">👥 Users</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard icon={<Users size={18} className="text-db-blue"/>} label="Total Users"
            value={s.users?.total?.toString()||'0'} sub={`New today: ${s.users?.new_today||0}`}
            onClick={() => nav('/admin/users')}/>
          <StatCard icon={<Users size={18} className="text-db-red"/>} label="Banned Users"
            value={s.users?.banned?.toString()||'0'} color="text-db-red"
            onClick={() => nav('/admin/users')}/>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

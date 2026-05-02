import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, Users, ArrowDownLeft, ArrowUpRight, DollarSign,
  Percent, AlertTriangle, Activity, BarChart3, RefreshCw,
} from 'lucide-react'
import { adminAPI, fmtUZS } from '../../api/client'
import { Spinner } from '../../components/ui'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  sub2?: string
  color?: string
  onClick?: () => void
}
const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, sub2, color = 'text-white', onClick }) => (
  <div
    className="db-card p-4 cursor-pointer hover:border-white/10 transition-all active:scale-98 border border-white/[0.06]"
    onClick={onClick}
  >
    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 mb-3">{icon}</div>
    <div className={`text-xl font-black mono ${color}`}>{value}</div>
    <div className="text-xs text-db-text2 mt-0.5">{label}</div>
    {sub  && <div className="text-xs text-db-muted mt-1">{sub}</div>}
    {sub2 && <div className="text-xs text-db-muted">{sub2}</div>}
  </div>
)

const SectionTitle: React.FC<{ emoji: string; label: string }> = ({ emoji, label }) => (
  <h2 className="text-xs font-bold text-db-text2 uppercase tracking-widest mb-3">
    {emoji} {label}
  </h2>
)

const Dashboard: React.FC = () => {
  const nav = useNavigate()

  const { data: s, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      try {
        const r = await adminAPI.stats()
        return r.data
      } catch {
        return {
          users: { total: 0, new_today: 0, active_today: 0, banned: 0 },
          bets: { total: 0, today: 0, total_wagered: 0, house_profit: 0, real_profit: 0, player_winrate_7d: 0 },
          deposits: { pending: 0, total_approved: 0, today: 0, week: 0, month: 0 },
          withdrawals: { pending: 0, total_approved: 0, today: 0, week: 0 },
          net_cashflow: 0,
          algo: { daily_pl: 0 },
        }
      }
    },
    refetchInterval: 30_000,
  })

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner /></div>
  if (!s) return null

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">Analytics Dashboard</h1>
          <p className="text-db-text2 text-sm mt-0.5">DeltaBet platform overview · updates every 30s</p>
        </div>
        <button
          onClick={() => refetch()}
          className={`text-db-text2 hover:text-white p-2 transition-all ${isFetching ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Alerts */}
      {(s.deposits?.pending > 0 || s.withdrawals?.pending > 0) && (
        <div className="flex flex-col gap-2">
          {s.deposits?.pending > 0 && (
            <div
              className="flex items-center gap-3 bg-db-gold/10 border border-db-gold/25 rounded-xl p-3 cursor-pointer hover:border-db-gold/40 transition-all"
              onClick={() => nav('/admin/deposits')}
            >
              <AlertTriangle size={16} className="text-db-gold flex-shrink-0" />
              <span className="text-sm font-semibold">
                {s.deposits.pending} pending deposit{s.deposits.pending !== 1 ? 's' : ''} awaiting approval
              </span>
              <span className="ml-auto text-xs text-db-gold font-bold">Review →</span>
            </div>
          )}
          {s.withdrawals?.pending > 0 && (
            <div
              className="flex items-center gap-3 bg-db-red/10 border border-db-red/25 rounded-xl p-3 cursor-pointer hover:border-db-red/40 transition-all"
              onClick={() => nav('/admin/withdrawals')}
            >
              <AlertTriangle size={16} className="text-db-red flex-shrink-0" />
              <span className="text-sm font-semibold">
                {s.withdrawals.pending} pending withdrawal{s.withdrawals.pending !== 1 ? 's' : ''} in queue
              </span>
              <span className="ml-auto text-xs text-db-red font-bold">Review →</span>
            </div>
          )}
        </div>
      )}

      {/* Deposits — period breakdown */}
      <div>
        <SectionTitle emoji="💰" label="Deposits" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<ArrowDownLeft size={18} className="text-db-green" />}
            label="Total Approved"
            value={fmtUZS(s.deposits?.total_approved || 0, true)}
            sub={`${s.deposits?.pending || 0} pending`}
            color="text-db-green"
            onClick={() => nav('/admin/deposits')}
          />
          <StatCard
            icon={<BarChart3 size={18} className="text-db-green" />}
            label="Today"
            value={fmtUZS(s.deposits?.today || 0, true)}
            color="text-db-green"
          />
          <StatCard
            icon={<BarChart3 size={18} className="text-db-blue" />}
            label="This Week"
            value={fmtUZS(s.deposits?.week || 0, true)}
            color="text-db-blue"
          />
          <StatCard
            icon={<BarChart3 size={18} className="text-db-text2" />}
            label="This Month"
            value={fmtUZS(s.deposits?.month || 0, true)}
          />
        </div>
      </div>

      {/* Withdrawals */}
      <div>
        <SectionTitle emoji="📤" label="Withdrawals" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<ArrowUpRight size={18} className="text-db-red" />}
            label="Total Paid Out"
            value={fmtUZS(s.withdrawals?.total_approved || 0, true)}
            sub={`${s.withdrawals?.pending || 0} queued`}
            color="text-db-red"
            onClick={() => nav('/admin/withdrawals')}
          />
          <StatCard
            icon={<BarChart3 size={18} className="text-db-red" />}
            label="Today"
            value={fmtUZS(s.withdrawals?.today || 0, true)}
            color="text-db-red"
          />
          <StatCard
            icon={<DollarSign size={18} className="text-db-blue" />}
            label="Net Cash Flow"
            value={fmtUZS(s.net_cashflow || 0, true)}
            color={(s.net_cashflow || 0) >= 0 ? 'text-db-green' : 'text-db-red'}
          />
          <StatCard
            icon={<Activity size={18} className="text-db-gold" />}
            label="Algo Daily P&L"
            value={fmtUZS(s.algo?.daily_pl || 0, true)}
            color={(s.algo?.daily_pl || 0) >= 0 ? 'text-db-green' : 'text-db-red'}
          />
        </div>
      </div>

      {/* Game stats */}
      <div>
        <SectionTitle emoji="🎮" label="Game Stats" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard
            icon={<TrendingUp size={18} className="text-db-gold" />}
            label="House Profit (all-time)"
            value={fmtUZS(s.bets?.house_profit || 0, true)}
            sub={`Real money: ${fmtUZS(s.bets?.real_profit || 0, true)}`}
            color="text-db-gold"
          />
          <StatCard
            icon={<TrendingUp size={18} className="text-db-blue" />}
            label="Total Wagered"
            value={fmtUZS(s.bets?.total_wagered || 0, true)}
            sub={`${s.bets?.today || 0} bets today`}
          />
          <StatCard
            icon={<Percent size={18} className="text-db-gold" />}
            label="Player Win Rate (7d)"
            value={`${s.bets?.player_winrate_7d || 0}%`}
            color="text-db-gold"
          />
        </div>
      </div>

      {/* Users */}
      <div>
        <SectionTitle emoji="👥" label="Users" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<Users size={18} className="text-db-blue" />}
            label="Total Users"
            value={(s.users?.total || 0).toString()}
            sub={`+${s.users?.new_today || 0} new today`}
            onClick={() => nav('/admin/users')}
          />
          <StatCard
            icon={<Activity size={18} className="text-db-green" />}
            label="Active Today"
            value={(s.users?.active_today || 0).toString()}
            color="text-db-green"
          />
          <StatCard
            icon={<Users size={18} className="text-db-gold" />}
            label="New Registrations"
            value={(s.users?.new_today || 0).toString()}
            color="text-db-gold"
          />
          <StatCard
            icon={<Users size={18} className="text-db-red" />}
            label="Banned"
            value={(s.users?.banned || 0).toString()}
            color="text-db-red"
            onClick={() => nav('/admin/users')}
          />
        </div>
      </div>
    </div>
  )
}

export default Dashboard

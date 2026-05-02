import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Check, X, Search, RefreshCw, AlertTriangle,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI, fmtUZS } from '../../api/client'
import { Modal, Spinner } from '../../components/ui'
import LevelBadge from '../../components/LevelBadge'
import type { UserLevel } from '../../store'
import dayjs from 'dayjs'

// ─── Shared helpers ───────────────────────────────────────────

type SortDir = 'asc' | 'desc'

function useSortState(defaultField = '') {
  const [sortField, setSortField] = useState(defaultField)
  const [sortDir, setSortDir]     = useState<SortDir>('desc')
  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }
  return { sortField, sortDir, handleSort }
}

const SortIcon: React.FC<{ field: string; sortField: string; sortDir: SortDir }> = ({ field, sortField, sortDir }) =>
  sortField === field
    ? sortDir === 'asc' ? <ChevronUp size={12} className="inline ml-0.5" /> : <ChevronDown size={12} className="inline ml-0.5" />
    : <ChevronDown size={12} className="inline ml-0.5 opacity-20" />

const Th: React.FC<{
  label: string; field?: string; sortField: string; sortDir: SortDir; onSort?: (f: string) => void; className?: string
}> = ({ label, field, sortField, sortDir, onSort, className = '' }) => (
  <th
    className={`pb-3 pr-4 text-left text-xs text-db-text2 uppercase tracking-wider ${field ? 'cursor-pointer select-none hover:text-white transition-colors' : ''} ${className}`}
    onClick={field ? () => onSort?.(field) : undefined}
  >
    {label}{field && <SortIcon field={field} sortField={sortField} sortDir={sortDir} />}
  </th>
)

const PagerRow: React.FC<{ page: number; total: number; hasPrev: boolean; hasNext: boolean; onPrev: () => void; onNext: () => void }> = (
  { page, total, hasPrev, hasNext, onPrev, onNext }
) => (
  <div className="flex items-center justify-between mt-4 text-sm">
    <button onClick={onPrev} disabled={!hasPrev}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-db-elevated text-db-text2 disabled:opacity-30 hover:text-white transition-all text-xs font-semibold">
      <ChevronLeft size={14} /> Prev
    </button>
    <span className="text-xs text-db-text2">Page {page} · {total} total</span>
    <button onClick={onNext} disabled={!hasNext}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-db-elevated text-db-text2 disabled:opacity-30 hover:text-white transition-all text-xs font-semibold">
      Next <ChevronRight size={14} />
    </button>
  </div>
)

function clientSort<T extends Record<string, any>>(arr: T[], field: string, dir: SortDir): T[] {
  return [...arr].sort((a, b) => {
    let va = a[field] ?? ''
    let vb = b[field] ?? ''
    if (!isNaN(parseFloat(va)) && !isNaN(parseFloat(vb))) { va = parseFloat(va); vb = parseFloat(vb) }
    const cmp = typeof va === 'number'
      ? va - vb
      : String(va).localeCompare(String(vb), undefined, { numeric: true })
    return dir === 'asc' ? cmp : -cmp
  })
}

// ─────────────────────────────────────────────
// Admin Withdrawals
// ─────────────────────────────────────────────

const LEVEL_ORDER: Record<string, number> = { vip: 0, platinum: 1, gold: 2, silver: 3, none: 4 }

export const AdminWithdrawals: React.FC = () => {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('pending')
  const [search, setSearch]  = useState('')
  const [page, setPage]      = useState(1)
  const { sortField, sortDir, handleSort } = useSortState('created_at')

  const [approveTarget, setApproveTarget] = useState<any>(null)
  const [rejectTarget, setRejectTarget]   = useState<any>(null)
  const [rejectNote, setRejectNote]       = useState('')

  const { data: resp, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-withdrawals', filter, page],
    queryFn: async () => {
      const r = await adminAPI.withdrawals({ status: filter === 'all' ? undefined : filter, page })
      return r.data
    },
    refetchInterval: 30_000,
  })

  const raw: any[]       = resp?.results || resp || []
  const totalCount: number = resp?.count || raw.length
  const hasNext  = !!resp?.next
  const hasPrev  = page > 1

  const rows = useMemo(() => {
    let arr = raw.filter((d: any) =>
      !search || d.user?.username?.toLowerCase().includes(search.toLowerCase())
    )
    // VIP-first for pending queue, then apply manual sort
    if (filter === 'pending') {
      arr = [...arr].sort((a: any, b: any) => {
        const la = LEVEL_ORDER[a.user?.level || 'none'] ?? 4
        const lb = LEVEL_ORDER[b.user?.level || 'none'] ?? 4
        return la - lb
      })
    }
    if (sortField) arr = clientSort(arr, sortField, sortDir)
    return arr
  }, [raw, search, filter, sortField, sortDir])

  const approveMut = useMutation({
    mutationFn: (id: number) => adminAPI.approveWithdrawal(id),
    onSuccess: () => {
      toast.success('Withdrawal approved')
      setApproveTarget(null)
      qc.invalidateQueries({ queryKey: ['admin-withdrawals'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: () => toast.error('Failed to approve'),
  })

  const rejectMut = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) => adminAPI.rejectWithdrawal(id, note),
    onSuccess: () => {
      toast.success('Withdrawal rejected & refunded')
      setRejectTarget(null)
      qc.invalidateQueries({ queryKey: ['admin-withdrawals'] })
    },
    onError: () => toast.error('Failed to reject'),
  })

  const getWagerRatio = (d: any): number | null => {
    if (d.wager_ratio_at_request != null) return parseFloat(d.wager_ratio_at_request)
    return null
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black">Withdrawals</h1>
        <button onClick={() => refetch()} className={`text-db-text2 hover:text-white p-2 ${isFetching ? 'animate-spin' : ''}`}>
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'pending', 'flagged', 'approved', 'rejected'].map((f) => (
            <button key={f} onClick={() => { setFilter(f); setPage(1) }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                filter === f
                  ? f === 'flagged' ? 'bg-orange-500/15 text-orange-400' : 'bg-db-red/15 text-db-red'
                  : 'bg-db-elevated text-db-text2 hover:text-white'
              }`}>
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-db-muted pointer-events-none" />
          <input className="db-input pl-9 text-sm" placeholder="Search username..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {(filter === 'pending' || filter === 'flagged' || filter === 'all') && (
        <p className="text-xs text-db-text2 mb-3 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
          Queue sorted VIP → Platinum → Gold → Silver
        </p>
      )}

      {isLoading ? <Spinner /> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <Th label="#"      field="id"         sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="User"                      sortField={sortField} sortDir={sortDir} />
                  <Th label="Level"                     sortField={sortField} sortDir={sortDir} />
                  <Th label="Amount" field="amount"     sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Card"                      sortField={sortField} sortDir={sortDir} />
                  <Th label="Wager"                     sortField={sortField} sortDir={sortDir} />
                  <Th label="Status" field="status"     sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Date"   field="created_at" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Actions"                   sortField={sortField} sortDir={sortDir} />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((d: any) => {
                  const ratio = getWagerRatio(d)
                  const isWarning = ratio !== null && ratio < 0.8
                  return (
                    <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 pr-4 text-db-text2 mono text-xs">{d.id}</td>
                      <td className="py-3 pr-4 font-semibold">{d.user?.username || '—'}</td>
                      <td className="py-3 pr-4">
                        <LevelBadge level={(d.user?.level || 'none') as UserLevel} />
                      </td>
                      <td className="py-3 pr-4 mono font-bold text-db-red">{fmtUZS(d.amount, true)}</td>
                      <td className="py-3 pr-4 text-xs text-db-text2">
                        <div>{d.card_type?.toUpperCase()}</div>
                        <div className="mono">{d.card_number}</div>
                      </td>
                      <td className="py-3 pr-4">
                        {ratio !== null ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-16 h-1.5 bg-db-elevated rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${ratio >= 0.8 ? 'bg-db-green' : 'bg-db-red'}`}
                                style={{ width: `${Math.min(100, ratio * 100).toFixed(0)}%` }}
                              />
                            </div>
                            <span className="text-xs text-db-muted">{(ratio * 100).toFixed(0)}%</span>
                            {isWarning && (
                              <AlertTriangle size={12} className="text-db-red flex-shrink-0" />
                            )}
                          </div>
                        ) : <span className="text-db-muted text-xs">—</span>}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {d.status === 'flagged' ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                              ⚑ flagged
                            </span>
                          ) : (
                            <span className={`badge-${d.status}`}>{d.status}</span>
                          )}
                          {isWarning && d.status === 'pending' && (
                            <span className="text-xs text-db-red font-bold">⚠ Review</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-xs text-db-text2 whitespace-nowrap">
                        {dayjs(d.created_at).format('DD.MM.YY HH:mm')}
                      </td>
                      <td className="py-3">
                        {(d.status === 'pending' || d.status === 'flagged') && (
                          <div className="flex gap-1">
                            <button onClick={() => setApproveTarget(d)}
                              className="p-1.5 rounded-lg bg-db-green/10 text-db-green hover:bg-db-green/20 transition-all">
                              <Check size={13} />
                            </button>
                            <button onClick={() => { setRejectTarget(d); setRejectNote('') }}
                              className="p-1.5 rounded-lg bg-db-red/10 text-db-red hover:bg-db-red/20 transition-all">
                              <X size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {rows.length === 0 && <div className="text-center py-12 text-db-text2">No withdrawals found</div>}
          </div>
          <PagerRow page={page} total={totalCount} hasPrev={hasPrev} hasNext={hasNext}
            onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
        </>
      )}

      <Modal open={!!approveTarget} onClose={() => setApproveTarget(null)} title="Approve Withdrawal">
        {approveTarget && (
          <div className="space-y-4">
            <div className="db-card p-3 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-db-text2">User</span><span className="font-bold">{approveTarget.user?.username}</span></div>
              <div className="flex justify-between"><span className="text-db-text2">Amount</span><span className="mono text-db-red font-black">{fmtUZS(approveTarget.amount)}</span></div>
              <div className="flex justify-between"><span className="text-db-text2">Card</span><span className="mono text-xs">{approveTarget.card_type?.toUpperCase()} {approveTarget.card_number}</span></div>
            </div>
            <p className="text-xs text-db-text2">Send money to the card above, then click Approve.</p>
            <div className="flex gap-2">
              <button onClick={() => setApproveTarget(null)} className="flex-1 py-3 rounded-xl bg-db-elevated text-db-text2 font-semibold">Cancel</button>
              <button onClick={() => approveMut.mutate(approveTarget.id)} disabled={approveMut.isPending}
                className="flex-1 py-3 rounded-xl bg-db-green/20 text-db-green font-bold flex items-center justify-center gap-2">
                {approveMut.isPending ? <div className="spinner" /> : <><Check size={15} />Approve</>}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Withdrawal">
        {rejectTarget && (
          <div className="space-y-4">
            <p className="text-db-text2 text-sm">Rejecting {fmtUZS(rejectTarget.amount)} for <b>{rejectTarget.user?.username}</b>. Balance will be refunded.</p>
            <textarea className="db-input resize-none h-20" placeholder="Reason (optional)..." value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => setRejectTarget(null)} className="flex-1 py-3 rounded-xl bg-db-elevated text-db-text2 font-semibold">Cancel</button>
              <button onClick={() => rejectMut.mutate({ id: rejectTarget.id, note: rejectNote })} disabled={rejectMut.isPending}
                className="flex-1 py-3 rounded-xl bg-db-red/20 text-db-red font-bold flex items-center justify-center gap-2">
                {rejectMut.isPending ? <div className="spinner" /> : <><X size={15} />Reject & Refund</>}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ─────────────────────────────────────────────
// Admin Users
// ─────────────────────────────────────────────

export const AdminUsers: React.FC = () => {
  const qc = useQueryClient()
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('all')
  const [page, setPage]         = useState(1)
  const { sortField, sortDir, handleSort } = useSortState('id')
  const [selected, setSelected] = useState<any>(null)
  const [modal, setModal]       = useState<'ban' | 'reset' | 'balance' | 'wagering' | null>(null)
  const [banReason, setBanReason]     = useState('')
  const [balanceAmount, setBalanceAmount] = useState('')

  const { data: resp, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: async () => {
      const r = await adminAPI.users({ page })
      return r.data
    },
    refetchInterval: 30_000,
  })

  const raw: any[]       = resp?.results || resp || []
  const totalCount: number = resp?.count || raw.length
  const hasNext  = !!resp?.next
  const hasPrev  = page > 1

  const rows = useMemo(() => {
    let arr = raw.filter((u: any) => {
      const matchSearch = !search || u.username?.toLowerCase().includes(search.toLowerCase())
      const matchFilter =
        filter === 'all' ? true :
        filter === 'banned' ? u.is_banned :
        filter === 'active' ? !u.is_banned :
        filter === 'vip' ? u.level === 'vip' : true
      return matchSearch && matchFilter
    })
    if (sortField) arr = clientSort(arr, sortField, sortDir)
    return arr
  }, [raw, search, filter, sortField, sortDir])

  const actionMut = useMutation({
    mutationFn: async () => {
      if (!selected) return
      if (modal === 'ban') {
        return selected.is_banned ? adminAPI.unbanUser(selected.id) : adminAPI.banUser(selected.id, banReason)
      }
      if (modal === 'reset')    return adminAPI.resetUser(selected.id)
      if (modal === 'balance')  return adminAPI.adjustBalance(selected.id, parseFloat(balanceAmount))
      if (modal === 'wagering') return adminAPI.resetWagering(selected.id)
    },
    onSuccess: () => {
      const msgs: Record<string, string> = { ban: selected?.is_banned ? 'User unbanned' : 'User banned', reset: 'Stats reset', balance: 'Balance adjusted', wagering: 'Wagering reset' }
      toast.success(msgs[modal || ''] || 'Done')
      setModal(null); setSelected(null)
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => toast.error('Action failed'),
  })

  const WagerBar: React.FC<{ required: string; completed: string }> = ({ required, completed }) => {
    const req  = parseFloat(required || '0')
    const done = parseFloat(completed || '0')
    if (req <= 0) return <span className="text-db-muted text-xs">—</span>
    const pct = Math.min(100, (done / req) * 100)
    return (
      <div className="w-28">
        <div className="flex justify-between text-[10px] text-db-muted mb-1">
          <span>{fmtUZS(done, true)}</span>
          <span>{pct.toFixed(0)}%</span>
        </div>
        <div className="h-1.5 bg-db-elevated rounded-full overflow-hidden">
          <div className="h-full bg-db-blue rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-[10px] text-db-muted mt-0.5">of {fmtUZS(req, true)}</div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black">Users</h1>
        <button onClick={() => refetch()} className={`text-db-text2 hover:text-white p-2 ${isFetching ? 'animate-spin' : ''}`}>
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'active', 'banned', 'vip'].map((f) => (
            <button key={f} onClick={() => { setFilter(f); setPage(1) }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${filter === f ? 'bg-db-red/15 text-db-red' : 'bg-db-elevated text-db-text2 hover:text-white'}`}>
              {f === 'vip' ? 'VIP' : f}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-db-muted pointer-events-none" />
          <input className="db-input pl-9 text-sm" placeholder="Search username..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? <Spinner /> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <Th label="User"       field="username"        sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Level"      field="level"           sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Balance"    field="balance"         sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Bonus"      field="bonus_balance"   sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Wagering"                           sortField={sortField} sortDir={sortDir} />
                  <Th label="Mode"       field="game_mode"       sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Status"     field="is_banned"       sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Actions"                            sortField={sortField} sortDir={sortDir} />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((u: any) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pr-4">
                      <div className="font-semibold">{u.username}</div>
                      <div className="text-xs text-db-muted">#{u.id}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <LevelBadge level={(u.level || 'none') as UserLevel} />
                    </td>
                    <td className="py-3 pr-4 mono text-sm font-bold">{fmtUZS(u.balance, true)}</td>
                    <td className="py-3 pr-4 mono text-sm text-db-gold">
                      {parseFloat(u.bonus_balance || '0') > 0 ? fmtUZS(u.bonus_balance, true) : '—'}
                    </td>
                    <td className="py-3 pr-4">
                      <WagerBar required={u.wagering_required} completed={u.wagered_amount} />
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-bold
                        ${u.game_mode === 'practice' ? 'bg-db-blue/10 text-db-blue' :
                          u.game_mode === 'balanced'  ? 'bg-db-gold/10 text-db-gold' :
                          'bg-db-red/10 text-db-red'}`}>
                        {u.game_mode?.toUpperCase() || '—'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={u.is_banned ? 'badge-rejected' : 'badge-approved'}>
                        {u.is_banned ? 'BANNED' : 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => { setSelected(u); setModal('ban'); setBanReason('') }}
                          className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${u.is_banned ? 'bg-db-green/10 text-db-green' : 'bg-db-red/10 text-db-red'}`}>
                          {u.is_banned ? 'Unban' : 'Ban'}
                        </button>
                        <button
                          onClick={() => { setSelected(u); setModal('reset') }}
                          className="px-2 py-1 rounded-lg text-xs font-bold bg-db-gold/10 text-db-gold transition-all">
                          Reset
                        </button>
                        <button
                          onClick={() => { setSelected(u); setModal('balance'); setBalanceAmount('') }}
                          className="px-2 py-1 rounded-lg text-xs font-bold bg-db-blue/10 text-db-blue transition-all">
                          Balance
                        </button>
                        <button
                          onClick={() => { setSelected(u); setModal('wagering') }}
                          className="px-2 py-1 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-400 transition-all">
                          Wager↺
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <div className="text-center py-12 text-db-text2">No users found</div>}
          </div>
          <PagerRow page={page} total={totalCount} hasPrev={hasPrev} hasNext={hasNext}
            onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
        </>
      )}

      <Modal open={!!modal} onClose={() => { setModal(null); setSelected(null) }}
        title={
          modal === 'ban' ? (selected?.is_banned ? 'Unban User' : 'Ban User') :
          modal === 'reset' ? 'Reset Stats' :
          modal === 'wagering' ? 'Reset Wagering' :
          'Adjust Balance'
        }>
        {selected && (
          <div className="space-y-4">
            <p className="text-db-text2 text-sm">User: <b>{selected.username}</b></p>
            {modal === 'ban' && !selected.is_banned && (
              <textarea className="db-input resize-none h-20" placeholder="Ban reason..." value={banReason} onChange={(e) => setBanReason(e.target.value)} />
            )}
            {modal === 'reset' && (
              <div className="bg-db-red/10 border border-db-red/25 rounded-xl p-3 text-xs text-db-red">
                ⚠️ Wipes balance, bonus, wagering, and all stats. Cannot be undone.
              </div>
            )}
            {modal === 'wagering' && (
              <div className="bg-purple-500/10 border border-purple-500/25 rounded-xl p-3 text-xs text-purple-300">
                Resets wager_required and wager_completed to zero and deletes the WageringAccount record. The user's unlock milestones will be cleared. Cannot be undone.
              </div>
            )}
            {modal === 'balance' && (
              <div>
                <input type="number" className="db-input" placeholder="Amount (UZS)" value={balanceAmount} onChange={(e) => setBalanceAmount(e.target.value)} />
                <p className="text-xs text-db-muted mt-1">Positive = add, negative = deduct</p>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setModal(null); setSelected(null) }} className="flex-1 py-3 rounded-xl bg-db-elevated text-db-text2 font-semibold">Cancel</button>
              <button onClick={() => actionMut.mutate()} disabled={actionMut.isPending}
                className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2
                  ${modal === 'reset' ? 'bg-db-red/20 text-db-red' :
                    modal === 'wagering' ? 'bg-purple-500/20 text-purple-400' :
                    modal === 'ban' && !selected?.is_banned ? 'bg-db-red/20 text-db-red' :
                    'bg-db-green/20 text-db-green'}`}>
                {actionMut.isPending ? <div className="spinner" /> : 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ─────────────────────────────────────────────
// Admin Promos
// ─────────────────────────────────────────────

export const AdminPromos: React.FC = () => {
  const qc = useQueryClient()
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const { sortField, sortDir, handleSort } = useSortState('id')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState({
    code: '', bonus_type: 'percentage', bonus_value: '', min_deposit: '', max_uses: '', one_per_user: true,
  })

  const { data: resp, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-promos', page],
    queryFn: async () => {
      const r = await adminAPI.promos()
      return r.data
    },
    refetchInterval: 30_000,
  })

  const raw: any[]       = resp?.results || resp || []
  const totalCount: number = resp?.count || raw.length
  const hasNext  = !!resp?.next
  const hasPrev  = page > 1

  const rows = useMemo(() => {
    let arr = raw.filter((p: any) => {
      const matchSearch = !search || p.code?.toLowerCase().includes(search.toLowerCase())
      const matchFilter = filter === 'all' ? true : filter === 'active' ? p.is_active : !p.is_active
      return matchSearch && matchFilter
    })
    if (sortField) arr = clientSort(arr, sortField, sortDir)
    return arr
  }, [raw, search, filter, sortField, sortDir])

  const createMut = useMutation({
    mutationFn: () => adminAPI.createPromo({
      ...form,
      bonus_value:  parseFloat(form.bonus_value),
      min_deposit:  form.min_deposit  ? parseFloat(form.min_deposit)  : null,
      max_uses:     form.max_uses     ? parseInt(form.max_uses)        : null,
    }),
    onSuccess: () => {
      toast.success('Promo code created')
      setShowCreate(false)
      setForm({ code: '', bonus_type: 'percentage', bonus_value: '', min_deposit: '', max_uses: '', one_per_user: true })
      qc.invalidateQueries({ queryKey: ['admin-promos'] })
    },
    onError: () => toast.error('Failed to create promo'),
  })

  const toggleMut = useMutation({
    mutationFn: (id: number) => adminAPI.togglePromo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-promos'] }),
    onError: () => toast.error('Failed to toggle'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => adminAPI.deletePromo(id),
    onSuccess: () => {
      toast.success('Promo deleted')
      qc.invalidateQueries({ queryKey: ['admin-promos'] })
    },
    onError: () => toast.error('Failed to delete'),
  })

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black">Promo Codes</h1>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className={`text-db-text2 hover:text-white p-2 ${isFetching ? 'animate-spin' : ''}`}>
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl bg-db-red text-white text-sm font-bold">
            + New Code
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="flex gap-1.5">
          {['all', 'active', 'inactive'].map((f) => (
            <button key={f} onClick={() => { setFilter(f); setPage(1) }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${filter === f ? 'bg-db-red/15 text-db-red' : 'bg-db-elevated text-db-text2 hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-db-muted pointer-events-none" />
          <input className="db-input pl-9 text-sm" placeholder="Search code..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? <Spinner /> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <Th label="Code"         field="code"          sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Bonus"        field="bonus_value"   sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Min Deposit"  field="min_deposit"   sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Uses"         field="usage_count"   sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Players"      field="players_count" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Total Deps"   field="total_deposits" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="House Profit" field="house_profit"  sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Bonuses Sent" field="bonuses_triggered" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Total Given"  field="total_given"   sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Status"       field="is_active"     sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Actions"                            sortField={sortField} sortDir={sortDir} />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((p: any) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pr-4 mono font-black">{p.code}</td>
                    <td className="py-3 pr-4 text-xs font-bold">
                      {p.bonus_type === 'percentage' ? `${p.bonus_value}%` : fmtUZS(p.bonus_value, true)}
                    </td>
                    <td className="py-3 pr-4 text-xs text-db-text2">
                      {p.min_deposit ? fmtUZS(p.min_deposit, true) : '—'}
                    </td>
                    <td className="py-3 pr-4 text-xs">
                      <span className="mono">{p.usage_count ?? 0}</span>
                      <span className="text-db-muted"> / {p.max_uses ?? '∞'}</span>
                    </td>
                    <td className="py-3 pr-4 text-xs mono">{p.players_count ?? '—'}</td>
                    <td className="py-3 pr-4 text-xs mono text-db-green">
                      {p.total_deposits != null ? fmtUZS(p.total_deposits, true) : '—'}
                    </td>
                    <td className="py-3 pr-4 text-xs mono text-db-gold">
                      {p.house_profit != null ? fmtUZS(p.house_profit, true) : '—'}
                    </td>
                    <td className="py-3 pr-4 text-xs mono">{p.bonuses_triggered ?? '—'}</td>
                    <td className="py-3 pr-4 text-xs mono text-db-red">
                      {p.total_given != null ? fmtUZS(p.total_given, true) : '—'}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-bold ${p.is_active ? 'bg-db-green/15 text-db-green' : 'bg-db-muted/20 text-db-muted'}`}>
                        {p.is_active ? 'ACTIVE' : 'OFF'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <button onClick={() => toggleMut.mutate(p.id)}
                          className="px-2 py-1 rounded-lg text-xs font-bold bg-db-elevated text-db-text2 hover:text-white transition-all">
                          {p.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => { if (window.confirm(`Delete promo "${p.code}"?`)) deleteMut.mutate(p.id) }}
                          className="px-2 py-1 rounded-lg text-xs font-bold bg-db-red/10 text-db-red hover:bg-db-red/20 transition-all">
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <div className="text-center py-12 text-db-text2">No promo codes</div>}
          </div>
          <PagerRow page={page} total={totalCount} hasPrev={hasPrev} hasNext={hasNext}
            onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
        </>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Promo Code">
        <div className="space-y-3">
          <input className="db-input" placeholder="Code (e.g. WELCOME50)" value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          <div className="flex gap-2">
            {(['percentage', 'fixed'] as const).map((t) => (
              <button key={t} onClick={() => setForm({ ...form, bonus_type: t })}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${form.bonus_type === t ? 'bg-db-blue/20 text-db-blue' : 'bg-db-elevated text-db-text2'}`}>
                {t}
              </button>
            ))}
          </div>
          <input className="db-input" type="number"
            placeholder={form.bonus_type === 'percentage' ? 'Percentage (e.g. 50)' : 'Fixed amount (UZS)'}
            value={form.bonus_value} onChange={(e) => setForm({ ...form, bonus_value: e.target.value })} />
          <input className="db-input" type="number" placeholder="Min deposit (optional)"
            value={form.min_deposit} onChange={(e) => setForm({ ...form, min_deposit: e.target.value })} />
          <input className="db-input" type="number" placeholder="Max uses (blank = unlimited)"
            value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.one_per_user}
              onChange={(e) => setForm({ ...form, one_per_user: e.target.checked })} className="w-4 h-4 accent-db-red" />
            One use per user
          </label>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl bg-db-elevated text-db-text2 font-semibold">Cancel</button>
            <button onClick={() => createMut.mutate()} disabled={createMut.isPending}
              className="flex-1 py-3 rounded-xl bg-db-red text-white font-bold flex items-center justify-center">
              {createMut.isPending ? <div className="spinner" /> : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─────────────────────────────────────────────
// Admin All Bets
// ─────────────────────────────────────────────

export const AdminBets: React.FC = () => {
  const [page, setPage]         = useState(1)
  const [modeFilter, setModeFilter] = useState('all')
  const [search, setSearch]     = useState('')
  const { sortField, sortDir, handleSort } = useSortState('created_at')

  const { data: resp, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-bets', page, modeFilter],
    queryFn: async () => {
      const r = await adminAPI.betHistory({ page, mode: modeFilter === 'all' ? undefined : modeFilter })
      return r.data
    },
    refetchInterval: 30_000,
  })

  const raw: any[]       = resp?.results || resp || []
  const totalCount: number = resp?.count || raw.length
  const hasNext  = !!resp?.next
  const hasPrev  = page > 1

  const rows = useMemo(() => {
    let arr = raw.filter((b: any) =>
      !search || b.user?.username?.toLowerCase().includes(search.toLowerCase())
    )
    if (sortField) arr = clientSort(arr, sortField, sortDir)
    return arr
  }, [raw, search, sortField, sortDir])

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black">All Bets</h1>
        <button onClick={() => refetch()} className={`text-db-text2 hover:text-white p-2 ${isFetching ? 'animate-spin' : ''}`}>
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'practice', 'standard', 'balanced'].map((m) => (
            <button key={m} onClick={() => { setModeFilter(m); setPage(1) }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${modeFilter === m ? 'bg-db-red/15 text-db-red' : 'bg-db-elevated text-db-text2 hover:text-white'}`}>
              {m}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-db-muted pointer-events-none" />
          <input className="db-input pl-9 text-sm" placeholder="Search username..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? <Spinner /> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <Th label="User"    field="user"              sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Amount"  field="amount"            sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Target"  field="target_multiplier" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Crash"   field="crash_point"       sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Result"  field="status"            sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Mode"    field="mode"              sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Payout"  field="profit"            sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Date"    field="created_at"        sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((b: any) => (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pr-4 font-semibold">{b.user?.username || '—'}</td>
                    <td className="py-3 pr-4 mono">{fmtUZS(b.amount, true)}</td>
                    <td className="py-3 pr-4 mono text-db-blue">{parseFloat(b.target_multiplier).toFixed(2)}x</td>
                    <td className="py-3 pr-4 mono font-bold" style={{ color: b.status === 'won' ? '#06d6a0' : '#e63946' }}>
                      {parseFloat(b.crash_point).toFixed(2)}x
                    </td>
                    <td className="py-3 pr-4"><span className={`badge-${b.status}`}>{b.status?.toUpperCase()}</span></td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-bold
                        ${b.mode === 'practice' ? 'bg-db-blue/10 text-db-blue' :
                          b.mode === 'balanced'  ? 'bg-db-gold/10 text-db-gold' :
                          'bg-db-red/10 text-db-red'}`}>
                        {b.mode?.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 pr-4 mono" style={{ color: '#06d6a0' }}>
                      {b.status === 'won' ? '+' + fmtUZS(b.profit, true) : '—'}
                    </td>
                    <td className="py-3 text-xs text-db-text2 whitespace-nowrap">
                      {dayjs(b.created_at).format('DD.MM.YY HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <div className="text-center py-12 text-db-text2">No bets found</div>}
          </div>
          <PagerRow page={page} total={totalCount} hasPrev={hasPrev} hasNext={hasNext}
            onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
        </>
      )}
    </div>
  )
}

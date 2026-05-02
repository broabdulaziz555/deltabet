import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, X, Eye, Search, RefreshCw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI, fmtUZS } from '../../api/client'
import { Modal, Spinner } from '../../components/ui'
import PDFViewer from '../../components/PDFViewer'
import dayjs from 'dayjs'

type SortDir = 'asc' | 'desc'

// Build an <img> src from raw base64 — never decode, just prepend data-URL header if missing
function toImgSrc(raw: string): string {
  if (!raw) return ''
  if (raw.startsWith('data:')) return raw
  const isPng = raw.startsWith('iVBORw0KGgo')
  const mime  = isPng ? 'image/png' : 'image/jpeg'
  return `data:${mime};base64,${raw}`
}

function isPdfBase64(raw: string): boolean {
  if (!raw) return false
  if (raw.startsWith('data:application/pdf')) return true
  const plain = raw.includes(',') ? raw.split(',')[1] : raw
  return plain.startsWith('JVBERi0x')
}

const ChequePreview: React.FC<{ cheque: string }> = ({ cheque }) => {
  if (!cheque) return <p className="text-db-muted text-center py-8">No cheque uploaded</p>
  if (isPdfBase64(cheque)) {
    return <PDFViewer base64={cheque} />
  }
  return (
    <img
      src={toImgSrc(cheque)}
      alt="Payment cheque"
      className="w-full rounded-xl object-contain max-h-96 bg-white/5"
    />
  )
}

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected'] as const
type StatusFilter = typeof STATUS_FILTERS[number]

const AdminDeposits: React.FC = () => {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<StatusFilter>('pending')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Action modals
  const [approveTarget, setApproveTarget] = useState<any>(null)
  const [rejectTarget, setRejectTarget]   = useState<any>(null)
  const [chequeTarget, setChequeTarget]   = useState<any>(null)
  const [approveAmount, setApproveAmount] = useState('')
  const [rejectNote, setRejectNote]       = useState('')

  const queryKey = ['admin-deposits', filter, page]

  const { data: resp, isLoading, isFetching, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const r = await adminAPI.deposits({ status: filter === 'all' ? undefined : filter, page })
      return r.data
    },
    refetchInterval: 30_000,
  })

  const deposits: any[] = resp?.results || resp || []
  const totalCount: number = resp?.count || deposits.length
  const hasNext   = !!resp?.next
  const hasPrev   = page > 1

  const sorted = useMemo(() => {
    const arr = deposits.filter(
      (d: any) => !search || d.user?.username?.toLowerCase().includes(search.toLowerCase())
    )
    return [...arr].sort((a: any, b: any) => {
      let va = a[sortField] ?? ''
      let vb = b[sortField] ?? ''
      if (sortField === 'amount_entered') { va = parseFloat(va); vb = parseFloat(vb) }
      const cmp = typeof va === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb), undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [deposits, search, sortField, sortDir])

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const SortIcon: React.FC<{ field: string }> = ({ field }) =>
    sortField === field
      ? sortDir === 'asc' ? <ChevronUp size={12} className="inline" /> : <ChevronDown size={12} className="inline" />
      : <ChevronDown size={12} className="inline opacity-20" />

  const approveMut = useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) =>
      adminAPI.approveDeposit(id, amount),
    onSuccess: () => {
      toast.success('Deposit approved')
      setApproveTarget(null)
      qc.invalidateQueries({ queryKey: ['admin-deposits'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Failed to approve'),
  })

  const rejectMut = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) =>
      adminAPI.rejectDeposit(id, note),
    onSuccess: () => {
      toast.success('Deposit rejected')
      setRejectTarget(null)
      qc.invalidateQueries({ queryKey: ['admin-deposits'] })
    },
    onError: () => toast.error('Failed to reject'),
  })

  const handleApprove = () => {
    const amt = parseFloat(approveAmount)
    if (isNaN(amt) || amt <= 0) { toast.error('Enter a valid amount'); return }
    approveMut.mutate({ id: approveTarget.id, amount: amt })
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black">Deposits</h1>
        <button
          onClick={() => refetch()}
          className={`text-db-text2 hover:text-white p-2 transition-all ${isFetching ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1) }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all
                ${filter === f ? 'bg-db-red/15 text-db-red' : 'bg-db-elevated text-db-text2 hover:text-white'}`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-db-muted pointer-events-none" />
          <input
            className="db-input pl-9 text-sm"
            placeholder="Search by username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? <Spinner /> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-db-text2 uppercase tracking-wider border-b border-white/5">
                  <th className="pb-3 pr-4 cursor-pointer" onClick={() => handleSort('id')}>#<SortIcon field="id"/></th>
                  <th className="pb-3 pr-4 cursor-pointer" onClick={() => handleSort('user')}>User</th>
                  <th className="pb-3 pr-4 cursor-pointer" onClick={() => handleSort('amount_entered')}>Entered<SortIcon field="amount_entered"/></th>
                  <th className="pb-3 pr-4">Received</th>
                  <th className="pb-3 pr-4">Bonus</th>
                  <th className="pb-3 pr-4">Card</th>
                  <th className="pb-3 pr-4 cursor-pointer" onClick={() => handleSort('status')}>Status<SortIcon field="status"/></th>
                  <th className="pb-3 pr-4">Cheque</th>
                  <th className="pb-3 pr-4 cursor-pointer" onClick={() => handleSort('created_at')}>Date<SortIcon field="created_at"/></th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sorted.map((d: any) => (
                  <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pr-4 text-db-text2 mono text-xs">{d.id}</td>
                    <td className="py-3 pr-4 font-semibold">{d.user?.username || d.username || '—'}</td>
                    <td className="py-3 pr-4 mono">{fmtUZS(d.amount_entered, true)}</td>
                    <td className="py-3 pr-4 mono text-db-green">{d.amount_received ? fmtUZS(d.amount_received, true) : '—'}</td>
                    <td className="py-3 pr-4 mono text-db-gold text-xs">
                      {parseFloat(d.bonus_given || '0') > 0 ? '+' + fmtUZS(d.bonus_given, true) : '—'}
                    </td>
                    <td className="py-3 pr-4 text-xs text-db-text2">
                      {d.card_address
                        ? `${d.card_address.card_type?.toUpperCase()} ••${d.card_address.card_number?.slice(-4)}`
                        : '—'}
                    </td>
                    <td className="py-3 pr-4"><span className={`badge-${d.status}`}>{d.status}</span></td>
                    <td className="py-3 pr-4">
                      {d.cheque_base64 ? (
                        <button
                          onClick={() => setChequeTarget(d)}
                          className="p-1.5 rounded-lg bg-db-blue/10 text-db-blue hover:bg-db-blue/20 transition-all"
                          title="Preview cheque"
                        >
                          <Eye size={13} />
                        </button>
                      ) : <span className="text-db-muted text-xs">—</span>}
                    </td>
                    <td className="py-3 pr-4 text-xs text-db-text2 whitespace-nowrap">
                      {dayjs(d.created_at).format('DD.MM.YY HH:mm')}
                    </td>
                    <td className="py-3">
                      {(d.status === 'pending' || d.status === 'uploaded') && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setApproveTarget(d); setApproveAmount(d.amount_entered) }}
                            className="p-1.5 rounded-lg bg-db-green/10 text-db-green hover:bg-db-green/20 transition-all"
                            title="Approve"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => { setRejectTarget(d); setRejectNote('') }}
                            className="p-1.5 rounded-lg bg-db-red/10 text-db-red hover:bg-db-red/20 transition-all"
                            title="Reject"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sorted.length === 0 && <div className="text-center py-12 text-db-text2">No deposits found</div>}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-sm">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={!hasPrev}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-db-elevated text-db-text2 disabled:opacity-30 hover:text-white transition-all text-xs font-semibold"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="text-xs text-db-text2">Page {page} · {totalCount} total</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasNext}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-db-elevated text-db-text2 disabled:opacity-30 hover:text-white transition-all text-xs font-semibold"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </>
      )}

      {/* Cheque Preview Modal */}
      <Modal open={!!chequeTarget} onClose={() => setChequeTarget(null)} title={`Cheque — Deposit #${chequeTarget?.id}`}>
        {chequeTarget && (
          <div className="space-y-4">
            <div className="db-card p-3 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-db-text2">User</span>
                <span className="font-bold">{chequeTarget.user?.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-db-text2">Amount</span>
                <span className="mono text-db-green font-bold">{fmtUZS(chequeTarget.amount_entered)}</span>
              </div>
            </div>
            <ChequePreview cheque={chequeTarget.cheque_base64 || ''} />
            {chequeTarget.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => { setChequeTarget(null); setApproveTarget(chequeTarget); setApproveAmount(chequeTarget.amount_entered) }}
                  className="flex-1 py-3 rounded-xl bg-db-green/20 text-db-green font-bold flex items-center justify-center gap-2"
                >
                  <Check size={15} /> Approve
                </button>
                <button
                  onClick={() => { setChequeTarget(null); setRejectTarget(chequeTarget); setRejectNote('') }}
                  className="flex-1 py-3 rounded-xl bg-db-red/20 text-db-red font-bold flex items-center justify-center gap-2"
                >
                  <X size={15} /> Reject
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Approve Modal */}
      <Modal open={!!approveTarget} onClose={() => setApproveTarget(null)} title="Approve Deposit">
        {approveTarget && (
          <div className="space-y-4">
            <div className="db-card p-3 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-db-text2">User</span>
                <span className="font-bold">{approveTarget.user?.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-db-text2">Entered</span>
                <span className="mono">{fmtUZS(approveTarget.amount_entered)}</span>
              </div>
              {approveTarget.promo_code && (
                <div className="flex justify-between">
                  <span className="text-db-text2">Promo</span>
                  <span className="text-db-gold font-bold">{approveTarget.promo_code}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-db-text2 uppercase">Amount Actually Received (UZS)</label>
              <input
                type="number"
                className="db-input"
                value={approveAmount}
                onChange={(e) => setApproveAmount(e.target.value)}
                placeholder="Enter received amount"
              />
              <p className="text-xs text-db-muted">Can differ from entered amount</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setApproveTarget(null)} className="flex-1 py-3 rounded-xl bg-db-elevated text-db-text2 font-semibold">
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={approveMut.isPending}
                className="flex-1 py-3 rounded-xl bg-db-green/20 text-db-green font-bold flex items-center justify-center gap-2"
              >
                {approveMut.isPending ? <div className="spinner" /> : <><Check size={15} />Approve</>}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Deposit">
        {rejectTarget && (
          <div className="space-y-4">
            <p className="text-db-text2 text-sm">
              Rejecting deposit of {fmtUZS(rejectTarget.amount_entered)} from <b>{rejectTarget.user?.username}</b>
            </p>
            <textarea
              className="db-input resize-none h-20"
              placeholder="Reason (optional)..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={() => setRejectTarget(null)} className="flex-1 py-3 rounded-xl bg-db-elevated text-db-text2 font-semibold">
                Cancel
              </button>
              <button
                onClick={() => rejectMut.mutate({ id: rejectTarget.id, note: rejectNote })}
                disabled={rejectMut.isPending}
                className="flex-1 py-3 rounded-xl bg-db-red/20 text-db-red font-bold flex items-center justify-center gap-2"
              >
                {rejectMut.isPending ? <div className="spinner" /> : <><X size={15} />Reject</>}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AdminDeposits

import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, X, Download, Eye, Search, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI, fmtUZS } from '../../api/client'
import { Modal, Spinner } from '../../components/ui'
import dayjs from 'dayjs'

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected']

const AdminDeposits: React.FC = () => {
  const { t } = useTranslation()
  const [deposits, setDeposits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [approveAmount, setApproveAmount] = useState('')
  const [rejectNote, setRejectNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const load = async (f = filter) => {
    setLoading(true)
    try {
      const r = await adminAPI.deposits({ status: f === 'all' ? undefined : f })
      setDeposits(r.data.results || r.data || [])
    } catch { toast.error('Failed to load deposits') }
    finally { setLoading(false) }
  }

  useEffect(() => { load(filter) }, [filter])

  const approve = async () => {
    if (!selected) return
    const amt = parseFloat(approveAmount)
    if (isNaN(amt) || amt <= 0) { toast.error('Enter valid amount'); return }
    setActionLoading(true)
    try {
      await adminAPI.approveDeposit(selected.id, amt)
      toast.success(`✅ Approved ${fmtUZS(amt)}`)
      setSelected(null)
      load(filter)
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || 'Failed to approve')
    } finally { setActionLoading(false) }
  }

  const reject = async () => {
    if (!selected) return
    setActionLoading(true)
    try {
      await adminAPI.rejectDeposit(selected.id, rejectNote)
      toast.success('❌ Rejected')
      setSelected(null)
      load(filter)
    } catch { toast.error('Failed to reject') }
    finally { setActionLoading(false) }
  }

  // Download cheque - handle URL or base64
  const downloadCheque = (item: any) => {
    const url = item.cheque_url || item.cheque
    if (!url) { toast.error('No cheque file'); return }

    if (url.startsWith('data:') || url.startsWith('base64')) {
      // Base64 decode and download
      const [header, data] = url.split(',')
      const mime = header.match(/:(.*?);/)?.[1] || 'application/octet-stream'
      const ext = mime.includes('pdf') ? '.pdf' : mime.includes('png') ? '.png' : '.jpg'
      const blob = new Blob([Uint8Array.from(atob(data), (c) => c.charCodeAt(0))], { type: mime })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `cheque_${item.id}${ext}`
      a.click()
    } else {
      // Direct URL
      window.open(url, '_blank')
    }
  }

  const filtered = deposits.filter((d: any) =>
    !search || d.user?.username?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black">{t('admin.deposits')}</h1>
        <button onClick={() => load(filter)} className="text-db-text2 hover:text-white p-2"><RefreshCw size={16}/></button>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize
                ${filter === f ? 'bg-db-red/15 text-db-red' : 'bg-db-elevated text-db-text2 hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-db-muted pointer-events-none"/>
          <input className="db-input pl-9 text-sm" placeholder="Search by username..." value={search}
            onChange={(e) => setSearch(e.target.value)}/>
        </div>
      </div>

      {loading ? <Spinner/> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-db-text2 uppercase tracking-wider border-b border-white/5">
                <th className="pb-3 pr-4">#</th>
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4">Entered</th>
                <th className="pb-3 pr-4">Received</th>
                <th className="pb-3 pr-4">Bonus</th>
                <th className="pb-3 pr-4">Card</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Cheque</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((d: any) => (
                <tr key={d.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3 pr-4 text-db-text2 mono text-xs">{d.id}</td>
                  <td className="py-3 pr-4 font-semibold">{d.user?.username || d.username || '—'}</td>
                  <td className="py-3 pr-4 mono">{fmtUZS(d.amount_entered, true)}</td>
                  <td className="py-3 pr-4 mono text-db-green">{d.amount_received ? fmtUZS(d.amount_received,true) : '—'}</td>
                  <td className="py-3 pr-4 mono text-db-gold text-xs">{parseFloat(d.bonus_given||'0')>0 ? '+'+fmtUZS(d.bonus_given,true) : '—'}</td>
                  <td className="py-3 pr-4 text-xs text-db-text2">
                    {d.card_address ? `${d.card_address.card_type?.toUpperCase()} ••${d.card_address.card_number?.slice(-4)}` : '—'}
                  </td>
                  <td className="py-3 pr-4"><span className={`badge-${d.status}`}>{d.status}</span></td>
                  <td className="py-3 pr-4">
                    {d.cheque_url || d.cheque ? (
                      <div className="flex gap-1">
                        <button onClick={() => window.open(d.cheque_url || d.cheque, '_blank')}
                          className="p-1.5 rounded-lg bg-db-blue/10 text-db-blue hover:bg-db-blue/20 transition-all" title="View">
                          <Eye size={13}/>
                        </button>
                        <button onClick={() => downloadCheque(d)}
                          className="p-1.5 rounded-lg bg-db-green/10 text-db-green hover:bg-db-green/20 transition-all" title="Download">
                          <Download size={13}/>
                        </button>
                      </div>
                    ) : <span className="text-db-muted text-xs">—</span>}
                  </td>
                  <td className="py-3 pr-4 text-xs text-db-text2 whitespace-nowrap">{dayjs(d.created_at).format('DD.MM.YY HH:mm')}</td>
                  <td className="py-3">
                    {d.status === 'pending' && (
                      <div className="flex gap-1">
                        <button onClick={() => { setSelected(d); setApproveAmount(d.amount_entered) }}
                          className="p-1.5 rounded-lg bg-db-green/10 text-db-green hover:bg-db-green/20 transition-all" title="Approve">
                          <Check size={13}/>
                        </button>
                        <button onClick={() => { setSelected({ ...d, action: 'reject' }) }}
                          className="p-1.5 rounded-lg bg-db-red/10 text-db-red hover:bg-db-red/20 transition-all" title="Reject">
                          <X size={13}/>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-12 text-db-text2">No deposits found</div>}
        </div>
      )}

      {/* Approve Modal */}
      <Modal open={!!selected && !selected?.action} onClose={() => setSelected(null)} title="Approve Deposit">
        {selected && (
          <div className="space-y-4">
            <div className="db-card p-3 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-db-text2">User</span><span className="font-bold">{selected.user?.username}</span></div>
              <div className="flex justify-between"><span className="text-db-text2">Entered</span><span className="mono">{fmtUZS(selected.amount_entered)}</span></div>
              {selected.promo_code && <div className="flex justify-between"><span className="text-db-text2">Promo</span><span className="text-db-gold font-bold">{selected.promo_code}</span></div>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-db-text2 uppercase">Amount Actually Received (UZS)</label>
              <input type="number" className="db-input" value={approveAmount} onChange={(e) => setApproveAmount(e.target.value)} placeholder="Enter actual received amount"/>
              <p className="text-xs text-db-text2">Enter what was actually deposited (can differ from entered amount)</p>
            </div>
            {selected.cheque_url && (
              <button onClick={() => downloadCheque(selected)} className="w-full py-2 rounded-xl bg-db-blue/10 text-db-blue text-sm font-semibold flex items-center justify-center gap-2">
                <Download size={15}/> Download Cheque
              </button>
            )}
            <div className="flex gap-2">
              <button onClick={() => setSelected(null)} className="flex-1 py-3 rounded-xl bg-db-elevated text-db-text2 font-semibold">Cancel</button>
              <button onClick={approve} disabled={actionLoading}
                className="flex-1 py-3 rounded-xl bg-db-green/20 text-db-green font-bold flex items-center justify-center gap-2">
                {actionLoading ? <div className="spinner"/> : <><Check size={15}/>Approve</>}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal open={!!selected?.action} onClose={() => setSelected(null)} title="Reject Deposit">
        {selected && (
          <div className="space-y-4">
            <p className="text-db-text2 text-sm">Rejecting deposit of {fmtUZS(selected.amount_entered)} from <b>{selected.user?.username}</b></p>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-db-text2 uppercase">Reason (optional)</label>
              <textarea className="db-input resize-none h-20" placeholder="Reason for rejection..." value={rejectNote} onChange={(e) => setRejectNote(e.target.value)}/>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelected(null)} className="flex-1 py-3 rounded-xl bg-db-elevated text-db-text2 font-semibold">Cancel</button>
              <button onClick={reject} disabled={actionLoading}
                className="flex-1 py-3 rounded-xl bg-db-red/20 text-db-red font-bold flex items-center justify-center gap-2">
                {actionLoading ? <div className="spinner"/> : <><X size={15}/>Reject</>}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AdminDeposits

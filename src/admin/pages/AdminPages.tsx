// ─────────────────────────────────────────────
// Admin Withdrawals
// ─────────────────────────────────────────────
import React, { useEffect, useState } from 'react'
import { Check, X, RefreshCw, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI, fmtUZS } from '../../api/client'
import { Modal, Spinner } from '../../components/ui'
import dayjs from 'dayjs'

export const AdminWithdrawals: React.FC = () => {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [note, setNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await adminAPI.withdrawals({ status: filter === 'all' ? undefined : filter })
      setItems(r.data.results || r.data || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [filter])

  const approve = async () => {
    if (!selected) return
    setActionLoading(true)
    try {
      await adminAPI.approveWithdrawal(selected.id)
      toast.success('✅ Withdrawal approved')
      setSelected(null); load()
    } catch { toast.error('Failed') } finally { setActionLoading(false) }
  }

  const reject = async () => {
    if (!selected) return
    setActionLoading(true)
    try {
      await adminAPI.rejectWithdrawal(selected.id, note)
      toast.success('❌ Rejected & refunded')
      setSelected(null); load()
    } catch { toast.error('Failed') } finally { setActionLoading(false) }
  }

  const filtered = items.filter((d: any) => !search || d.user?.username?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black">Withdrawals</h1>
        <button onClick={load} className="text-db-text2 hover:text-white p-2"><RefreshCw size={16}/></button>
      </div>
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="flex gap-1.5">
          {['all','pending','approved','rejected'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${filter===f?'bg-db-red/15 text-db-red':'bg-db-elevated text-db-text2'}`}>{f}</button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-db-muted pointer-events-none"/>
          <input className="db-input pl-9 text-sm" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}/>
        </div>
      </div>
      {loading ? <Spinner/> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-db-text2 uppercase tracking-wider border-b border-white/5">
              <th className="pb-3 pr-4">#</th><th className="pb-3 pr-4">User</th><th className="pb-3 pr-4">Amount</th>
              <th className="pb-3 pr-4">Card</th><th className="pb-3 pr-4">Status</th><th className="pb-3 pr-4">Date</th><th className="pb-3">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((d: any) => (
                <tr key={d.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3 pr-4 text-db-text2 mono text-xs">{d.id}</td>
                  <td className="py-3 pr-4 font-semibold">{d.user?.username || '—'}</td>
                  <td className="py-3 pr-4 mono font-bold text-db-red">{fmtUZS(d.amount,true)}</td>
                  <td className="py-3 pr-4 text-xs text-db-text2">
                    <div>{d.card_type?.toUpperCase()}</div>
                    <div className="mono">{d.card_number}</div>
                  </td>
                  <td className="py-3 pr-4"><span className={`badge-${d.status}`}>{d.status}</span></td>
                  <td className="py-3 pr-4 text-xs text-db-text2 whitespace-nowrap">{dayjs(d.created_at).format('DD.MM.YY HH:mm')}</td>
                  <td className="py-3">
                    {d.status === 'pending' && (
                      <div className="flex gap-1">
                        <button onClick={() => setSelected(d)} className="p-1.5 rounded-lg bg-db-green/10 text-db-green hover:bg-db-green/20 transition-all"><Check size={13}/></button>
                        <button onClick={() => setSelected({ ...d, action: 'reject' })} className="p-1.5 rounded-lg bg-db-red/10 text-db-red hover:bg-db-red/20 transition-all"><X size={13}/></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-12 text-db-text2">No withdrawals found</div>}
        </div>
      )}
      <Modal open={!!selected && !selected?.action} onClose={() => setSelected(null)} title="Approve Withdrawal">
        {selected && (
          <div className="space-y-4">
            <div className="db-card p-3 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-db-text2">User</span><span className="font-bold">{selected.user?.username}</span></div>
              <div className="flex justify-between"><span className="text-db-text2">Amount</span><span className="mono text-db-red font-black">{fmtUZS(selected.amount)}</span></div>
              <div className="flex justify-between"><span className="text-db-text2">Card</span><span className="mono text-xs">{selected.card_type?.toUpperCase()} {selected.card_number}</span></div>
            </div>
            <p className="text-xs text-db-text2">Send money to the card above, then click Approve.</p>
            <div className="flex gap-2">
              <button onClick={() => setSelected(null)} className="flex-1 py-3 rounded-xl bg-db-elevated text-db-text2 font-semibold">Cancel</button>
              <button onClick={approve} disabled={actionLoading} className="flex-1 py-3 rounded-xl bg-db-green/20 text-db-green font-bold flex items-center justify-center gap-2">
                {actionLoading ? <div className="spinner"/> : <><Check size={15}/>Approve</>}
              </button>
            </div>
          </div>
        )}
      </Modal>
      <Modal open={!!selected?.action} onClose={() => setSelected(null)} title="Reject Withdrawal">
        {selected && (
          <div className="space-y-4">
            <p className="text-db-text2 text-sm">Rejecting {fmtUZS(selected.amount)} withdrawal. Balance will be refunded.</p>
            <textarea className="db-input resize-none h-20" placeholder="Reason (optional)..." value={note} onChange={(e) => setNote(e.target.value)}/>
            <div className="flex gap-2">
              <button onClick={() => setSelected(null)} className="flex-1 py-3 rounded-xl bg-db-elevated text-db-text2 font-semibold">Cancel</button>
              <button onClick={reject} disabled={actionLoading} className="flex-1 py-3 rounded-xl bg-db-red/20 text-db-red font-bold flex items-center justify-center gap-2">
                {actionLoading ? <div className="spinner"/> : <><X size={15}/>Reject & Refund</>}
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
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [modal, setModal] = useState<'ban'|'reset'|'balance'|null>(null)
  const [banReason, setBanReason] = useState('')
  const [balanceAmount, setBalanceAmount] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try { const r = await adminAPI.users({ search }); setUsers(r.data.results || r.data || []) }
    catch { } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [search])

  const doAction = async () => {
    if (!selected) return
    setActionLoading(true)
    try {
      if (modal === 'ban') {
        if (selected.is_banned) await adminAPI.unbanUser(selected.id)
        else await adminAPI.banUser(selected.id, banReason)
        toast.success(selected.is_banned ? 'User unbanned' : 'User banned')
      } else if (modal === 'reset') {
        await adminAPI.resetUser(selected.id)
        toast.success('Stats reset')
      } else if (modal === 'balance') {
        await adminAPI.adjustBalance(selected.id, parseFloat(balanceAmount))
        toast.success('Balance adjusted')
      }
      setModal(null); setSelected(null); load()
    } catch { toast.error('Action failed') } finally { setActionLoading(false) }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black">Users</h1>
        <button onClick={load} className="text-db-text2 hover:text-white p-2"><RefreshCw size={16}/></button>
      </div>
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-db-muted pointer-events-none"/>
        <input className="db-input pl-9 text-sm" placeholder="Search username..." value={search} onChange={(e) => setSearch(e.target.value)}/>
      </div>
      {loading ? <Spinner/> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-db-text2 uppercase tracking-wider border-b border-white/5">
              <th className="pb-3 pr-4">User</th><th className="pb-3 pr-4">Balance</th><th className="pb-3 pr-4">Bonus</th>
              <th className="pb-3 pr-4">Wagering</th><th className="pb-3 pr-4">Mode</th><th className="pb-3 pr-4">Status</th><th className="pb-3">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-white/2 transition-colors">
                  <td className="py-3 pr-4"><div className="font-semibold">{u.username}</div><div className="text-xs text-db-muted">#{u.id}</div></td>
                  <td className="py-3 pr-4 mono text-sm font-bold">{fmtUZS(u.balance,true)}</td>
                  <td className="py-3 pr-4 mono text-sm text-db-gold">{parseFloat(u.bonus_balance||'0')>0?fmtUZS(u.bonus_balance,true):'—'}</td>
                  <td className="py-3 pr-4 text-xs text-db-text2">
                    {parseFloat(u.wagering_required||'0')>0
                      ? `${fmtUZS(u.wagered_amount,true)} / ${fmtUZS(u.wagering_required,true)}`
                      : '—'}
                  </td>
                  <td className="py-3 pr-4"><span className={`text-xs px-2 py-0.5 rounded-lg font-bold ${u.game_mode==='demo'?'bg-db-green/10 text-db-green':'bg-db-red/10 text-db-red'}`}>{u.game_mode?.toUpperCase()}</span></td>
                  <td className="py-3 pr-4"><span className={u.is_banned?'badge-rejected':'badge-approved'}>{u.is_banned?'BANNED':'ACTIVE'}</span></td>
                  <td className="py-3">
                    <div className="flex gap-1 flex-wrap">
                      <button onClick={() => { setSelected(u); setModal('ban') }}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${u.is_banned?'bg-db-green/10 text-db-green':'bg-db-red/10 text-db-red'}`}>
                        {u.is_banned?'Unban':'Ban'}
                      </button>
                      <button onClick={() => { setSelected(u); setModal('reset') }}
                        className="px-2 py-1 rounded-lg text-xs font-bold bg-db-gold/10 text-db-gold transition-all">Reset</button>
                      <button onClick={() => { setSelected(u); setModal('balance') }}
                        className="px-2 py-1 rounded-lg text-xs font-bold bg-db-blue/10 text-db-blue transition-all">Balance</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={!!modal} onClose={() => { setModal(null); setSelected(null) }}
        title={modal==='ban'?(selected?.is_banned?'Unban User':'Ban User'):modal==='reset'?'Reset Stats':'Adjust Balance'}>
        {selected && (
          <div className="space-y-4">
            <p className="text-db-text2 text-sm">User: <b>{selected.username}</b></p>
            {modal==='ban' && !selected.is_banned && (
              <textarea className="db-input resize-none h-20" placeholder="Ban reason..." value={banReason} onChange={(e) => setBanReason(e.target.value)}/>
            )}
            {modal==='reset' && <div className="bg-db-red/10 border border-db-red/25 rounded-xl p-3 text-xs text-db-red">⚠️ This will wipe balance, bonus, wagering, and all stats. Cannot be undone.</div>}
            {modal==='balance' && (
              <div>
                <input type="number" className="db-input" placeholder="Amount to add (UZS)" value={balanceAmount} onChange={(e) => setBalanceAmount(e.target.value)}/>
                <p className="text-xs text-db-text2 mt-1">Positive = add, negative = deduct</p>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setModal(null); setSelected(null) }} className="flex-1 py-3 rounded-xl bg-db-elevated text-db-text2 font-semibold">Cancel</button>
              <button onClick={doAction} disabled={actionLoading}
                className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2
                  ${modal==='reset'?'bg-db-red/20 text-db-red':modal==='ban'&&!selected?.is_banned?'bg-db-red/20 text-db-red':'bg-db-green/20 text-db-green'}`}>
                {actionLoading ? <div className="spinner"/> : 'Confirm'}
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
  const [promos, setPromos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ code:'', bonus_type:'percentage', bonus_value:'', min_deposit:'', max_uses:'', one_per_user: true })
  const [creating, setCreating] = useState(false)

  const load = async () => {
    setLoading(true)
    try { const r = await adminAPI.promos(); setPromos(r.data.results || r.data || []) }
    catch { } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const create = async () => {
    setCreating(true)
    try {
      await adminAPI.createPromo({ ...form, bonus_value: parseFloat(form.bonus_value), min_deposit: form.min_deposit ? parseFloat(form.min_deposit) : null, max_uses: form.max_uses ? parseInt(form.max_uses) : null })
      toast.success('Promo created!'); setShowCreate(false); load()
    } catch { toast.error('Failed') } finally { setCreating(false) }
  }

  const toggle = async (id: number) => {
    try { await adminAPI.togglePromo(id); load() }
    catch { toast.error('Failed') }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black">Promo Codes</h1>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl bg-db-red text-white text-sm font-bold">+ New Code</button>
      </div>
      {loading ? <Spinner/> : (
        <div className="flex flex-col gap-3">
          {promos.map((p: any) => (
            <div key={p.id} className="db-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="mono font-black text-lg">{p.code}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-lg font-bold ${p.is_active?'bg-db-green/15 text-db-green':'bg-db-muted/20 text-db-muted'}`}>{p.is_active?'ACTIVE':'OFF'}</span>
                </div>
                <button onClick={() => toggle(p.id)} className="text-xs px-3 py-1.5 rounded-xl bg-db-elevated text-db-text2 hover:text-white transition-all">
                  {p.is_active?'Disable':'Enable'}
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {[
                  { label:'Bonus',       val: p.bonus_type==='percentage'?`${p.bonus_value}%`:`${fmtUZS(p.bonus_value,true)} fixed` },
                  { label:'Min Deposit', val: p.min_deposit ? fmtUZS(p.min_deposit,true) : 'None' },
                  { label:'Uses',        val: `${p.usage_count} / ${p.max_uses||'∞'}` },
                  { label:'Total Given', val: fmtUZS(p.total_given,true), color:'text-db-red' },
                ].map((s) => (
                  <div key={s.label} className="bg-db-elevated rounded-xl p-2">
                    <div className="text-db-muted mb-0.5">{s.label}</div>
                    <div className={`font-bold mono ${s.color||''}`}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {promos.length===0 && <div className="text-center py-12 text-db-text2">No promo codes yet</div>}
        </div>
      )}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Promo Code">
        <div className="space-y-3">
          <input className="db-input" placeholder="Code (e.g. WELCOME50)" value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})}/>
          <div className="flex gap-2">
            {(['percentage','fixed'] as const).map((t) => (
              <button key={t} onClick={() => setForm({...form, bonus_type:t})}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${form.bonus_type===t?'bg-db-blue/20 text-db-blue':'bg-db-elevated text-db-text2'}`}>{t}</button>
            ))}
          </div>
          <input className="db-input" type="number" placeholder={form.bonus_type==='percentage'?'Percentage (e.g. 50)':'Fixed amount (UZS)'} value={form.bonus_value} onChange={(e) => setForm({...form, bonus_value:e.target.value})}/>
          <input className="db-input" type="number" placeholder="Min deposit (optional)" value={form.min_deposit} onChange={(e) => setForm({...form, min_deposit:e.target.value})}/>
          <input className="db-input" type="number" placeholder="Max uses (optional, blank=unlimited)" value={form.max_uses} onChange={(e) => setForm({...form, max_uses:e.target.value})}/>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.one_per_user} onChange={(e) => setForm({...form, one_per_user:e.target.checked})} className="w-4 h-4 accent-db-red"/>
            One use per user
          </label>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl bg-db-elevated text-db-text2 font-semibold">Cancel</button>
            <button onClick={create} disabled={creating} className="flex-1 py-3 rounded-xl bg-db-red text-white font-bold flex items-center justify-center">
              {creating ? <div className="spinner"/> : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

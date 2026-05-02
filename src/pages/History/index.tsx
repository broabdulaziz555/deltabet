import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Filter } from 'lucide-react'
import { gameAPI, fmtUZS } from '../../api/client'
import { useAuthStore } from '../../store'
import toast from 'react-hot-toast'
import { Empty, Spinner, SkeletonCard } from '../../components/ui'
import MobileLayout from '../../components/Layout/MobileLayout'
import LevelBadge from '../../components/LevelBadge'
import dayjs from 'dayjs'

interface Bet {
  id: number
  amount: string
  target_multiplier: string
  crash_point: string
  status: 'won' | 'lost'
  payout: string
  profit: string
  mode: 'demo' | 'real' | 'balanced'
  server_seed_hash: string
  created_at: string
}

const FILTERS = ['all', 'won', 'lost'] as const

const History: React.FC = () => {
  const { t } = useTranslation()
  const nav = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<typeof FILTERS[number]>('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const fetchBets = async (f = filter, p = 1) => {
    setLoading(true)
    try {
      const params: any = { page: p }
      if (f === 'won') params.status = 'won'
      else if (f === 'lost') params.status = 'lost'
      const res = await gameAPI.history(params)
      if (p === 1) setBets(res.data.results)
      else setBets((prev) => [...prev, ...res.data.results])
      setHasMore(!!res.data.next)
    } catch { toast.error('Failed to load history') }
    finally { setLoading(false) }
  }

  useEffect(() => { setPage(1); fetchBets(filter, 1) }, [filter])

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-full">
        {/* Header */}
        <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3"
          style={{ background: 'rgba(7,7,15,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => nav(-1)} className="text-db-text2 hover:text-white p-1">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-lg flex-1">{t('history.title')}</h1>
          <Filter size={18} className="text-db-text2" />
        </div>

        {/* Filters */}
        <div className="px-4 py-3">
          <div className="scroll-x gap-2">
            {FILTERS.map((f) => (
              <button key={f}
                className={`db-tab flex-shrink-0 ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {t(`history.filter.${f}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Bets */}
        <div className="flex-1 px-4 pb-4">
          {loading && page === 1 ? (
            <div className="flex flex-col gap-2 pt-2">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : bets.length === 0 ? (
            <Empty icon="🎲" message={t('history.empty')} />
          ) : (
            <div className="flex flex-col gap-2">
              {bets.map((b) => (
                <div key={b.id} className="db-card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`badge-${b.status}`}>
                        {b.status === 'won' ? t('history.won') : t('history.lost')}
                      </span>
                      <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">REAL</span>
                      {user?.level && user.level !== 'none' && (
                        <LevelBadge level={user.level} size="sm" />
                      )}
                    </div>
                    <span className="text-xs text-db-text2">{dayjs(b.created_at).format('DD.MM HH:mm')}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-db-muted mb-0.5">{t('history.table.amount')}</div>
                      <div className="font-bold mono">{fmtUZS(parseFloat(b.amount), true)}</div>
                    </div>
                    <div>
                      <div className="text-db-muted mb-0.5">{t('history.table.target')}</div>
                      <div className="font-bold mono text-db-blue">{parseFloat(b.target_multiplier).toFixed(2)}x</div>
                    </div>
                    <div>
                      <div className="text-db-muted mb-0.5">{t('history.table.crash')}</div>
                      <div className={`font-bold mono ${b.status === 'won' ? 'text-db-green' : 'text-db-red'}`}>
                        {parseFloat(b.crash_point).toFixed(2)}x
                      </div>
                    </div>
                  </div>

                  {b.status === 'won' && (
                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-xs text-db-text2">{t('history.table.payout')}</span>
                      <span className="text-sm font-black mono text-db-green">+{fmtUZS(parseFloat(b.profit), true)}</span>
                    </div>
                  )}

                  {/* Provably fair */}
                  <div className="mt-2 text-xs text-db-muted font-mono truncate opacity-50">
                    🔒 {b.server_seed_hash?.slice(0, 24)}...
                  </div>
                </div>
              ))}

              {hasMore && (
                <button className="w-full py-3 text-db-blue text-sm font-semibold"
                  onClick={() => { const np = page + 1; setPage(np); fetchBets(filter, np) }}
                  disabled={loading}
                >
                  {loading ? <Spinner size={16} /> : 'Load more'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  )
}

export default History

import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { txAPI, fmtUZS } from '../../api/client'
import { Empty, Spinner } from '../../components/ui'
import MobileLayout from '../../components/Layout/MobileLayout'
import dayjs from 'dayjs'

const Transactions: React.FC = () => {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [tab, setTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [deposits, setDeposits] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([txAPI.depositHistory(), txAPI.withdrawHistory()])
      .then(([d, w]) => { setDeposits(d.data.results || []); setWithdrawals(w.data.results || []) })
      .finally(() => setLoading(false))
  }, [])

  const items = tab === 'deposit' ? deposits : withdrawals

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-full">
        <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3"
          style={{ background:'rgba(7,7,15,.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
          <button onClick={() => nav(-1)} className="text-db-text2 hover:text-white p-1"><ArrowLeft size={20}/></button>
          <h1 className="font-bold text-lg flex-1">{t('transactions.title')}</h1>
        </div>

        {/* Tabs */}
        <div className="px-4 pt-3 pb-1">
          <div className="flex bg-db-elevated rounded-2xl p-1 gap-1">
            {(['deposit','withdraw'] as const).map((k) => (
              <button key={k} onClick={() => setTab(k)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab===k?'bg-db-card text-white shadow-card':'text-db-text2'}`}>
                {k === 'deposit' ? (
                  <><ArrowDownLeft size={14} className="inline mr-1 text-db-green"/>{t('transactions.deposit')}</>
                ) : (
                  <><ArrowUpRight size={14} className="inline mr-1 text-db-red"/>{t('transactions.withdraw')}</>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 px-4 py-3 pb-6">
          {loading ? <Spinner /> : items.length === 0 ? <Empty message={t('transactions.empty')} /> : (
            <div className="flex flex-col gap-2">
              {items.map((item: any) => (
                <div key={item.id} className="db-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {tab === 'deposit'
                        ? <ArrowDownLeft size={16} className="text-db-green"/>
                        : <ArrowUpRight size={16} className="text-db-red"/>}
                      <span className="font-bold text-sm">
                        {tab === 'deposit' ? t('transactions.deposit') : t('transactions.withdraw')}
                      </span>
                      {item.bonus_given && parseFloat(item.bonus_given) > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-lg bg-db-gold/15 text-db-gold">
                          +{fmtUZS(parseFloat(item.bonus_given),true)} bonus
                        </span>
                      )}
                    </div>
                    <span className={`badge-${item.status}`}>
                      {t(`transactions.status.${item.status}`)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-db-muted mb-0.5">{t('transactions.amount')}</div>
                      <div className="font-bold mono">
                        {tab === 'deposit'
                          ? fmtUZS(parseFloat(item.amount_received || item.amount_entered))
                          : fmtUZS(parseFloat(item.amount))}
                      </div>
                      {tab === 'deposit' && item.amount_entered !== item.amount_received && item.amount_received && (
                        <div className="text-xs text-db-text2">Entered: {fmtUZS(parseFloat(item.amount_entered))}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-db-muted mb-0.5">{t('transactions.date')}</div>
                      <div className="text-sm">{dayjs(item.created_at).format('DD.MM.YY HH:mm')}</div>
                    </div>
                  </div>

                  {tab === 'deposit' && item.card_address && (
                    <div className="mt-2 pt-2 border-t border-white/5 text-xs text-db-text2 flex items-center gap-2">
                      <span>{item.card_address.card_type.toUpperCase()}</span>
                      <span className="mono">{item.card_address.card_number}</span>
                    </div>
                  )}
                  {tab === 'withdraw' && item.card_number && (
                    <div className="mt-2 pt-2 border-t border-white/5 text-xs text-db-text2 flex items-center gap-2">
                      <span>{item.card_type?.toUpperCase()}</span>
                      <span className="mono">{item.card_number}</span>
                    </div>
                  )}
                  {item.admin_note && (
                    <div className="mt-2 text-xs text-db-text2 italic">Note: {item.admin_note}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  )
}

export default Transactions

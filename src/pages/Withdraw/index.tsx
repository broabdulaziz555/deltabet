// ─── Withdraw Page ───
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { txAPI, fmtUZS } from '../../api/client'
import { useAuthStore } from '../../store'
import MobileLayout from '../../components/Layout/MobileLayout'

const Withdraw: React.FC = () => {
  const { t } = useTranslation()
  const nav = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [amount, setAmount] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardType, setCardType] = useState<'humo' | 'uzcard'>('uzcard')
  const [amountErr, setAmountErr] = useState('')
  const [cardErr, setCardErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const canWithdraw = user?.can_withdraw
  const remaining = parseFloat(user?.wagering_remaining || '0')

  const handleSubmit = async () => {
    setAmountErr(''); setCardErr('')
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt < 50000) { setAmountErr(t('withdraw.errors.minAmount')); return }
    if (amt > parseFloat(user?.balance || '0')) { setAmountErr(t('withdraw.errors.insufficient')); return }
    if (!cardNumber.trim() || cardNumber.replace(/\s/g,'').length < 16) { setCardErr('Enter valid 16-digit card number'); return }

    setLoading(true)
    try {
      await txAPI.withdraw({ amount, card_number: cardNumber.replace(/\s/g,''), card_type: cardType })
      setDone(true)
      toast.success(t('withdraw.success'))
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || t('withdraw.errors.insufficient'))
    } finally { setLoading(false) }
  }

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-full">
        <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3"
          style={{ background:'rgba(7,7,15,.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
          <button onClick={() => nav(-1)} className="text-db-text2 hover:text-white p-1"><ArrowLeft size={20}/></button>
          <h1 className="font-bold text-lg flex-1">{t('withdraw.title')}</h1>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center flex-1 px-6 text-center gap-6">
            <div className="text-6xl animate-float">✅</div>
            <div><h2 className="text-xl font-black text-db-green mb-2">{t('withdraw.success')}</h2>
              <p className="text-db-text2 text-sm">Admin will process your request. Balance has been held.</p></div>
            <button className="btn-bet px-8 py-3 text-white" style={{ background:'linear-gradient(135deg,#3a86ff,#1565c0)' }} onClick={() => nav('/transactions')}>View Transactions</button>
          </div>
        ) : (
          <div className="flex-1 px-4 py-4 flex flex-col gap-4 pb-8">
            {/* Balance info */}
            <div className="db-card p-4 flex items-center justify-between">
              <div><div className="text-xs text-db-text2 mb-1">{t('profile.balance')}</div>
                <div className="text-xl font-black mono">{fmtUZS(parseFloat(user?.balance||'0'))}</div></div>
              <div className="text-right"><div className="text-xs text-db-text2 mb-1">{t('withdraw.minWithdraw')}</div>
                <div className="text-sm font-bold text-db-gold">50,000 UZS</div></div>
            </div>

            {/* Wagering lock */}
            {!canWithdraw && remaining > 0 && (
              <div className="bg-db-gold/10 border border-db-gold/25 rounded-xl p-4">
                <div className="text-db-gold font-bold text-sm mb-1">⚠️ Wagering Required</div>
                <p className="text-xs text-db-text2">
                  {t('withdraw.wageringWarning', { amount: fmtUZS(remaining) })}
                </p>
                <div className="mt-3 h-2 rounded-full bg-db-elevated overflow-hidden">
                  <div className="h-full rounded-full bg-db-gold transition-all"
                    style={{ width: `${Math.min(100, (parseFloat(user?.wagered_amount||'0')/parseFloat(user?.wagering_required||'1'))*100)}%` }}/>
                </div>
                <div className="text-xs text-db-text2 mt-1 text-right">
                  {fmtUZS(parseFloat(user?.wagered_amount||'0'),true)} / {fmtUZS(parseFloat(user?.wagering_required||'0'),true)}
                </div>
              </div>
            )}

            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-db-text2 uppercase tracking-wider">{t('withdraw.amount')}</label>
              <div className="relative">
                <input type="number" className={`db-input text-right pr-14 ${amountErr?'error':''}`}
                  placeholder="50000" value={amount} onChange={(e)=>{setAmount(e.target.value);setAmountErr('')}}
                  min="50000" step="10000" disabled={!canWithdraw}/>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-db-text2">UZS</span>
              </div>
              {amountErr && <p className="text-xs text-db-red">{amountErr}</p>}
            </div>

            {/* Card type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-db-text2 uppercase tracking-wider">{t('withdraw.cardType')}</label>
              <div className="flex gap-2">
                {(['uzcard','humo'] as const).map((t_) => (
                  <button key={t_} onClick={()=>setCardType(t_)}
                    className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${cardType===t_?'bg-db-blue/20 text-db-blue border border-db-blue/30':'bg-db-elevated text-db-text2'}`}>
                    {t_==='humo'?'🟢 HUMO':'🔵 UZCARD'}
                  </button>
                ))}
              </div>
            </div>

            {/* Card number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-db-text2 uppercase tracking-wider">{t('withdraw.cardNumber')}</label>
              <input className={`db-input mono tracking-widest ${cardErr?'error':''}`}
                placeholder="8600 0000 0000 0000" value={cardNumber}
                onChange={(e)=>{setCardNumber(e.target.value);setCardErr('')}}
                maxLength={19} inputMode="numeric" disabled={!canWithdraw}/>
              {cardErr && <p className="text-xs text-db-red">{cardErr}</p>}
            </div>

            <button className="btn-bet w-full py-4 text-white text-base mt-2"
              onClick={handleSubmit} disabled={loading||!canWithdraw}
              style={{ background:'linear-gradient(135deg,#e63946,#c1121f)' }}>
              {loading ? <div className="spinner mx-auto"/> : t('withdraw.submitBtn')}
            </button>
          </div>
        )}
      </div>
    </MobileLayout>
  )
}

export { Withdraw }
export default Withdraw

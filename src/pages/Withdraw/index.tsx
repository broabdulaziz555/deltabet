import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'
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
  const [cardType, setCardType] = useState<'humo' | 'uzcard' | 'bank'>('uzcard')
  const [amountErr, setAmountErr] = useState('')
  const [cardErr, setCardErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const canWithdraw = user?.can_withdraw
  const remaining = parseFloat(user?.wagering_remaining || '0')
  const balance = parseFloat(user?.balance || '0')

  const handleSubmit = async () => {
    setAmountErr(''); setCardErr('')
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt < 50000) { setAmountErr(t('withdraw.errors.minAmount')); return }
    if (amt > balance) { setAmountErr(t('withdraw.errors.insufficient')); return }
    const clean = cardNumber.replace(/\s/g, '')
    if (clean.length < 16) { setCardErr('Enter valid 16-digit card number'); return }
    if (cardType === 'uzcard' && !clean.startsWith('8600')) { setCardErr('Uzcard numbers must start with 8600'); return }
    if (cardType === 'humo'   && !clean.startsWith('9860')) { setCardErr('Humo numbers must start with 9860');   return }
    setLoading(true)
    try {
      await txAPI.withdraw({ amount, card_number: clean, card_type: cardType })
      setDone(true)
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || t('withdraw.errors.insufficient'))
    } finally { setLoading(false) }
  }

  if (done) return (
    <MobileLayout>
      <div className="flex flex-col items-center justify-center flex-1 px-6 text-center gap-6 min-h-full">
        <div className="text-6xl animate-float">✅</div>
        <div>
          <h2 className="text-xl font-black text-db-green mb-2">{t('withdraw.success')}</h2>
          <p className="text-db-text2 text-sm">Admin will process your request shortly.</p>
        </div>
        <button onClick={() => nav('/transactions')}
          className="btn-bet px-8 py-3" style={{ background: 'linear-gradient(135deg,#3a86ff,#1565c0)' }}>
          View Transactions
        </button>
      </div>
    </MobileLayout>
  )

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-full">
        {/* Header */}
        <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3"
          style={{ background: 'rgba(7,7,15,.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
          <button onClick={() => nav(-1)} className="text-db-text2 hover:text-white p-1"><ArrowLeft size={20}/></button>
          <h1 className="font-bold text-lg flex-1">{t('withdraw.title')}</h1>
        </div>

        <div className="flex-1 px-4 py-4 flex flex-col gap-4 pb-8">
          {/* Balance card */}
          <div className="db-card p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-db-text2 mb-1">{t('profile.balance')}</div>
              <div className="text-2xl font-black mono">{fmtUZS(balance)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-db-text2 mb-1">Minimum</div>
              <div className="text-sm font-bold text-db-gold">50,000 UZS</div>
            </div>
          </div>

          {/* Wagering lock */}
          {!canWithdraw && remaining > 0 && (
            <div className="bg-db-gold/10 border border-db-gold/25 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-db-gold"/>
                <span className="text-db-gold font-bold text-sm">Wagering Required</span>
              </div>
              <p className="text-xs text-db-text2 mb-3">
                Bet <b className="text-white">{fmtUZS(remaining)}</b> more before you can withdraw.
              </p>
              <div className="h-2 rounded-full bg-db-elevated overflow-hidden">
                <div className="h-full rounded-full bg-db-gold transition-all"
                  style={{ width: `${Math.min(100, (parseFloat(user?.wagered_amount||'0') / parseFloat(user?.wagering_required||'1')) * 100)}%` }}/>
              </div>
              <div className="flex justify-between text-xs text-db-text2 mt-1">
                <span>{fmtUZS(parseFloat(user?.wagered_amount||'0'), true)} bet</span>
                <span>{fmtUZS(parseFloat(user?.wagering_required||'0'), true)} required</span>
              </div>
            </div>
          )}

          {canWithdraw && (
            <div className="bg-db-green/10 border border-db-green/25 rounded-2xl p-3 flex items-center gap-2">
              <span className="text-db-green text-lg">✓</span>
              <span className="text-db-green text-sm font-semibold">Withdrawal unlocked</span>
            </div>
          )}

          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-db-text2 uppercase tracking-wider">{t('withdraw.amount')}</label>
            <div className="input-wrap">
              <input type="number"
                className={`db-input with-suffix ${amountErr ? 'error' : ''}`}
                style={{ textAlign: 'right' }}
                placeholder="50000" value={amount}
                onChange={(e) => { setAmount(e.target.value); setAmountErr('') }}
                min="50000" step="10000" disabled={!canWithdraw}/>
              <span className="input-suffix">UZS</span>
            </div>
            {amountErr && <p className="text-xs text-db-red">{amountErr}</p>}
            {/* Quick amounts */}
            <div className="flex gap-2">
              {['50000','100000','200000','500000'].map((v) => (
                <button key={v} onClick={() => setAmount(v)} disabled={!canWithdraw}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-db-elevated text-db-text2 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40">
                  {fmtUZS(parseInt(v), true)}
                </button>
              ))}
            </div>
          </div>

          {/* Card type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-db-text2 uppercase tracking-wider">{t('withdraw.cardType')}</label>
            <div className="flex gap-2">
              {(['uzcard', 'humo', 'bank'] as const).map((ct) => (
                <button key={ct} onClick={() => { setCardType(ct); setCardNumber(''); setCardErr('') }} disabled={!canWithdraw}
                  className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-40
                    ${cardType === ct ? 'bg-db-blue/20 text-db-blue border border-db-blue/30' : 'bg-db-elevated text-db-text2'}`}>
                  {ct === 'humo' ? '🟢 HUMO' : ct === 'uzcard' ? '🔵 UZCARD' : '🏦 BANK'}
                </button>
              ))}
            </div>
          </div>

          {/* Card number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-db-text2 uppercase tracking-wider">{t('withdraw.cardNumber')}</label>
            <input
              className={`db-input mono-input ${cardErr ? 'error' : ''}`}
              placeholder={cardType === 'uzcard' ? '8600 XXXX XXXX XXXX' : cardType === 'humo' ? '9860 XXXX XXXX XXXX' : '0000 0000 0000 0000'}
              value={cardNumber}
              onChange={(e) => { setCardNumber(e.target.value); setCardErr('') }}
              maxLength={19} inputMode="numeric" disabled={!canWithdraw}/>
            {cardErr && <p className="text-xs text-db-red">{cardErr}</p>}
          </div>

          <button onClick={handleSubmit} disabled={loading || !canWithdraw}
            className="btn-bet w-full py-4 text-base mt-2"
            style={{ background: (!canWithdraw || loading) ? undefined : 'linear-gradient(135deg,#e63946,#c1121f)' }}>
            {loading ? <div className="spinner"/> : t('withdraw.submitBtn')}
          </button>
        </div>
      </div>
    </MobileLayout>
  )
}

export default Withdraw

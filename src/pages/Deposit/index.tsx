import React, { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Check, Upload, X, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import { txAPI, bonusAPI, fmtUZS } from '../../api/client'
import { Spinner } from '../../components/ui'
import MobileLayout from '../../components/Layout/MobileLayout'

interface Card { id: number; card_number: string; card_holder: string; card_type: string }

const Deposit: React.FC = () => {
  const { t } = useTranslation()
  const nav = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [cards, setCards] = useState<Card[]>([])
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [amount, setAmount] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [promoInfo, setPromoInfo] = useState<any>(null)
  const [promoError, setPromoError] = useState('')
  const [amountError, setAmountError] = useState('')
  const [fileError, setFileError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loadingCards, setLoadingCards] = useState(true)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    txAPI.getCards()
      .then((r) => { setCards(r.data); if (r.data.length > 0) setSelectedCard(r.data[0]) })
      .catch(() => {})
      .finally(() => setLoadingCards(false))
  }, [])

  const copyCard = () => {
    if (!selectedCard) return
    navigator.clipboard.writeText(selectedCard.card_number)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const checkPromo = async () => {
    if (!promoCode.trim()) return
    setPromoError('')
    try {
      const r = await bonusAPI.checkPromo(promoCode.trim())
      setPromoInfo(r.data); toast.success('Promo code valid! ✓')
    } catch (err) {
      setPromoError((err as any)?.response?.data?.error || 'Invalid promo code')
      setPromoInfo(null)
    }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowed.includes(f.type)) { setFileError(t('deposit.errors.fileType')); return }
    if (f.size > 10 * 1024 * 1024) { setFileError(t('deposit.errors.fileSize')); return }
    setFileError(''); setFile(f)
  }

  const handleSubmit = async () => {
    setAmountError(''); setFileError('')
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt < 10000) { setAmountError(t('deposit.errors.minAmount')); return }
    if (!file) { setFileError(t('deposit.errors.noFile')); return }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('amount', amount); fd.append('cheque', file)
      if (promoCode.trim()) fd.append('promo_code', promoCode.trim())
      await txAPI.deposit(fd)
      setSubmitted(true); toast.success(t('deposit.success'))
    } catch (err) {
      toast.error((err as any)?.response?.data?.error || 'Error submitting deposit')
    } finally { setLoading(false) }
  }

  if (submitted) return (
    <MobileLayout>
      <div className="flex flex-col items-center justify-center min-h-full px-6 text-center gap-6">
        <div className="text-6xl animate-float">✅</div>
        <div>
          <h2 className="text-2xl font-black text-db-green mb-2">{t('deposit.success')}</h2>
          <p className="text-db-text2 text-sm">Awaiting admin approval. Balance updates once approved.</p>
        </div>
        <button className="btn-bet px-8 py-3" style={{ background:'linear-gradient(135deg,#3a86ff,#1565c0)' }}
          onClick={() => nav('/transactions')}>View Transactions</button>
      </div>
    </MobileLayout>
  )

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-full">
        <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3"
          style={{ background:'rgba(7,7,15,.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
          <button onClick={() => nav(-1)} className="text-db-text2 hover:text-white p-1"><ArrowLeft size={20}/></button>
          <h1 className="font-bold text-lg flex-1">{t('deposit.title')}</h1>
          {/* Withdraw shortcut */}
          <button onClick={() => nav('/withdraw')}
            className="text-xs font-bold px-3 py-1.5 rounded-xl text-db-red bg-db-red/10 border border-db-red/20">
            Withdraw →
          </button>
        </div>

        <div className="flex-1 px-4 py-4 flex flex-col gap-4 pb-8">
          {/* Card */}
          {loadingCards ? <Spinner/> : selectedCard ? (
            <div className="db-card p-4"
              style={{ background:'linear-gradient(135deg,#101025,#0d0d22)', border:'1px solid rgba(58,134,255,0.2)' }}>
              <div className="text-xs text-db-text2 mb-3 font-semibold uppercase tracking-wider">{t('deposit.sendTo')}</div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-xs text-db-text2 mb-1">{t('deposit.cardType')}</div>
                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${selectedCard.card_type==='humo'?'bg-green-500/20 text-green-400':'bg-blue-500/20 text-blue-400'}`}>
                    {selectedCard.card_type==='humo'?'🟢 HUMO':'🔵 UZCARD'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-db-text2 mb-1">{t('deposit.cardHolder')}</div>
                  <div className="font-semibold text-sm">{selectedCard.card_holder}</div>
                </div>
              </div>
              <div className="flex items-center justify-between bg-db-bg2 rounded-xl p-3">
                <span className="mono font-bold text-base tracking-widest">
                  {selectedCard.card_number.replace(/(\d{4})/g,'$1 ').trim()}
                </span>
                <button onClick={copyCard} className="flex items-center gap-1.5 text-xs font-bold"
                  style={{ color: copied?'#06d6a0':'#3a86ff' }}>
                  {copied?<Check size={14}/>:<Copy size={14}/>}{copied?t('deposit.copied'):t('deposit.copyCard')}
                </button>
              </div>
              {cards.length > 1 && (
                <div className="flex gap-2 mt-3">
                  {cards.map((c) => (
                    <button key={c.id} onClick={() => setSelectedCard(c)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${selectedCard.id===c.id?'bg-db-blue/20 text-db-blue':'bg-db-elevated text-db-text2'}`}>
                      {c.card_type.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="db-card p-5 text-center">
              <div className="text-3xl mb-3">💳</div>
              <p className="text-db-text2 text-sm font-semibold">Payment cards not set up yet.</p>
              <p className="text-db-muted text-xs mt-1">Contact support to make a deposit.</p>
            </div>
          )}

          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-db-text2 uppercase tracking-wider">{t('deposit.amount')}</label>
            <div className="input-wrap">
              <input type="number" className={`db-input with-suffix ${amountError?'error':''}`}
                placeholder="10000" value={amount}
                onChange={(e) => { setAmount(e.target.value); setAmountError('') }}
                min="10000" step="1000" style={{ textAlign:'right' }}/>
              <span className="input-suffix">UZS</span>
            </div>
            {amountError && <p className="text-xs text-db-red">{amountError}</p>}
            <p className="text-xs text-db-text2">{t('deposit.minDeposit')}</p>
            <div className="flex gap-2">
              {['10000','50000','100000','500000'].map((v) => (
                <button key={v} onClick={() => setAmount(v)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-db-elevated text-db-text2 hover:text-white hover:bg-white/10 transition-all">
                  {fmtUZS(parseInt(v),true)}
                </button>
              ))}
            </div>
            {promoInfo && amount && parseFloat(amount) >= (promoInfo.min_deposit || 0) && (
              <div className="bg-db-gold/10 border border-db-gold/25 rounded-xl p-3 flex items-center gap-2">
                <span className="text-db-gold text-xl">🎁</span>
                <div>
                  <div className="text-xs font-bold text-db-gold">
                    Bonus: {promoInfo.bonus_type==='percentage'
                      ? `+${(parseFloat(amount)*parseFloat(promoInfo.bonus_value)/100).toLocaleString('ru-RU')} UZS (${promoInfo.bonus_value}%)`
                      : `+${parseFloat(promoInfo.bonus_value).toLocaleString('ru-RU')} UZS`}
                  </div>
                  <div className="text-xs text-db-text2">Will be credited as bonus balance</div>
                </div>
              </div>
            )}
          </div>

          {/* Promo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-db-text2 uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={12}/>{t('deposit.promoCode')}
            </label>
            <div className="flex gap-2">
              <input className={`db-input flex-1 ${promoError?'error':promoInfo?'border-db-green/50':''}`}
                placeholder="PROMO123" value={promoCode}
                onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); setPromoInfo(null) }}/>
              <button onClick={checkPromo}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-db-elevated text-db-text2 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap">
                Apply
              </button>
            </div>
            {promoError && <p className="text-xs text-db-red">{promoError}</p>}
          </div>

          {/* Cheque */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-db-text2 uppercase tracking-wider">{t('deposit.cheque')}</label>
            <div className={`rounded-2xl border-2 border-dashed p-5 flex flex-col items-center gap-2 cursor-pointer transition-all
              ${fileError?'border-db-red/50':file?'border-db-green/40 bg-db-green/5':'border-white/10 hover:border-white/20'}`}
              onClick={() => fileRef.current?.click()}>
              {file ? (
                <>
                  <div className="text-3xl">{file.type==='application/pdf'?'📄':'🖼️'}</div>
                  <div className="text-sm font-semibold text-db-green truncate max-w-full px-2">{file.name}</div>
                  <div className="text-xs text-db-text2">{(file.size/1024).toFixed(0)} KB</div>
                  <button className="text-xs text-db-red mt-1 flex items-center gap-1"
                    onClick={(e) => { e.stopPropagation(); setFile(null) }}>
                    <X size={12}/> Remove
                  </button>
                </>
              ) : (
                <>
                  <Upload size={28} className="text-db-text2"/>
                  <div className="text-sm font-semibold">{t('deposit.cheque')}</div>
                  <div className="text-xs text-db-text2 text-center">{t('deposit.chequeHelp')}</div>
                  <div className="text-xs text-db-muted">JPG • PNG • PDF • max 10MB</div>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFile}/>
            {fileError && <p className="text-xs text-db-red">{fileError}</p>}
          </div>

          <div className="bg-db-blue/10 border border-db-blue/20 rounded-xl p-4 text-xs text-db-text2 space-y-1">
            <div className="text-db-blue font-bold mb-2">📋 {t('deposit.instructions')}</div>
            <div>1. Copy the card number above</div>
            <div>2. Transfer your amount via Humo/Uzcard P2P</div>
            <div>3. Take a screenshot of the transfer confirmation</div>
            <div>4. Upload it and submit — admin approves manually</div>
          </div>

          <button className="btn-bet w-full py-4 text-base"
            onClick={handleSubmit} disabled={loading || !selectedCard}
            style={{ background:'linear-gradient(135deg,#06d6a0,#059669)' }}>
            {loading ? <div className="spinner"/> : t('deposit.submitBtn')}
          </button>
        </div>
      </div>
    </MobileLayout>
  )
}

export default Deposit

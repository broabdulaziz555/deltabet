import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Copy, Check, Upload, X, Clock, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { txAPI, fmtUZS } from '../../api/client'
import { Spinner } from '../../components/ui'
import MobileLayout from '../../components/Layout/MobileLayout'

// ─── Types ───────────────────────────────────────────────────────────────────

type CardType = 'uzcard' | 'humo' | 'bank'
type Step = 'form' | 'transfer' | 'cheque' | 'success'

interface Step1Form {
  amount: string
}

interface Step3Form {
  cheque: FileList
}

interface DepositInfo {
  deposit_id: number
  amount: string
  destination_card: {
    number: string
    holder: string
    type: string
  }
  expires_at: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function encodeFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── Step indicators ─────────────────────────────────────────────────────────

const STEPS: Step[] = ['form', 'transfer', 'cheque']

const StepBar: React.FC<{ current: Step }> = ({ current }) => {
  const { t } = useTranslation()
  const labels = [t('deposit.step1'), t('deposit.step2'), t('deposit.step3')]
  const idx = STEPS.indexOf(current)
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`flex items-center gap-1.5 ${i <= idx ? 'text-db-blue' : 'text-db-muted'}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black border
              ${i < idx ? 'bg-db-blue border-db-blue text-white' :
                i === idx ? 'border-db-blue text-db-blue' :
                'border-db-muted text-db-muted'}`}>
              {i < idx ? '✓' : i + 1}
            </div>
            <span className="text-xs font-semibold hidden sm:block">{labels[i]}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-px ${i < idx ? 'bg-db-blue' : 'bg-white/10'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// ─── Countdown ───────────────────────────────────────────────────────────────

const Countdown: React.FC<{ expiresAt: string; onExpire: () => void }> = ({ expiresAt, onExpire }) => {
  const { t } = useTranslation()
  const [display, setDisplay] = useState('25:00')
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const tick = () => {
      const diff = dayjs(expiresAt).diff(dayjs())
      if (diff <= 0) {
        setDisplay('00:00')
        setExpired(true)
        onExpire()
        return
      }
      const mins = Math.floor(diff / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setDisplay(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt, onExpire])

  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border
      ${expired
        ? 'bg-db-red/10 border-db-red/30 text-db-red'
        : 'bg-db-blue/10 border-db-blue/20 text-db-blue'}`}>
      <Clock size={14} />
      <span className="text-xs font-semibold">{t('deposit.timeRemaining')}</span>
      <span className="mono font-black text-sm ml-auto">{display}</span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const Deposit: React.FC = () => {
  const { t } = useTranslation()
  const nav = useNavigate()
  const fileRef = useRef<HTMLInputElement | null>(null)

  const [step, setStep] = useState<Step>('form')
  const [cardType, setCardType] = useState<CardType>('uzcard')
  const [depositInfo, setDepositInfo] = useState<DepositInfo | null>(null)
  const [copied, setCopied] = useState(false)
  const [isExpired, setIsExpired] = useState(false)

  // Step 1 form
  const {
    register: reg1,
    handleSubmit: submit1,
    setValue: setVal1,
    formState: { errors: err1, isSubmitting: sub1 },
  } = useForm<Step1Form>({ defaultValues: { amount: '' } })

  // Step 3 form
  const {
    register: reg3,
    handleSubmit: submit3,
    watch: watch3,
    formState: { errors: err3, isSubmitting: sub3 },
  } = useForm<Step3Form>()

  const watchedFile = watch3('cheque')

  // ── Step 1: create deposit ──────────────────────────────────────────────────
  const onStep1Submit = async (data: Step1Form) => {
    try {
      const res = await txAPI.createDeposit({ amount: data.amount, card_type: cardType })
      const d = res.data
      setDepositInfo({
        deposit_id: d.deposit_id,
        amount: d.amount,
        destination_card: d.destination_card,
        expires_at: d.expires_at,
      })
      setStep('transfer')
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error
      toast.error(msg || t('common.error'))
    }
  }

  // ── Step 3: upload cheque ───────────────────────────────────────────────────
  const onStep3Submit = async (data: Step3Form) => {
    if (!depositInfo) return
    const file = data.cheque[0]
    try {
      const dataUrl = await encodeFileToBase64(file)
      await txAPI.uploadCheque(depositInfo.deposit_id, dataUrl)
      setStep('success')
    } catch (err) {
      const raw = err as { response?: { data?: { error?: string } } }
      const msg = raw?.response?.data?.error
      if (msg?.includes('expired')) {
        toast.error(t('deposit.errors.expired'))
        setIsExpired(true)
        setStep('transfer')
      } else {
        toast.error(msg || t('common.error'))
      }
    }
  }

  const copyCard = () => {
    if (!depositInfo) return
    navigator.clipboard.writeText(depositInfo.destination_card.number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExpire = () => setIsExpired(true)

  const resetFlow = () => {
    setStep('form')
    setDepositInfo(null)
    setIsExpired(false)
    setCopied(false)
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-full px-6 text-center gap-6">
          <div className="text-6xl">✅</div>
          <div>
            <h2 className="text-2xl font-black text-db-green mb-2">{t('deposit.success')}</h2>
            <p className="text-db-text2 text-sm">Balance updates once admin approves.</p>
          </div>
          <button
            className="btn-bet px-8 py-3 bg-db-blue text-white rounded-2xl font-bold"
            onClick={() => nav('/transactions')}
          >
            View Transactions
          </button>
        </div>
      </MobileLayout>
    )
  }

  const CARD_OPTIONS: { type: CardType; label: string; example: string; color: string }[] = [
    { type: 'uzcard', label: t('deposit.uzcard'), example: '8600 XXXX XXXX XXXX', color: 'text-blue-400' },
    { type: 'humo',   label: t('deposit.humo'),   example: '9860 XXXX XXXX XXXX', color: 'text-green-400' },
    { type: 'bank',   label: t('deposit.bankCard'), example: '•••• •••• •••• ••••',  color: 'text-db-text2' },
  ]

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-full">
        {/* Header */}
        <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3 bg-db-bg/95 backdrop-blur border-b border-white/5">
          <button onClick={() => nav(-1)} className="text-db-text2 hover:text-white p-1">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-lg flex-1">{t('deposit.title')}</h1>
          <button
            onClick={() => nav('/withdraw')}
            className="text-xs font-bold px-3 py-1.5 rounded-xl text-db-red bg-db-red/10 border border-db-red/20"
          >
            Withdraw →
          </button>
        </div>

        {/* Step bar */}
        <StepBar current={step} />

        <div className="flex-1 px-4 pb-8 flex flex-col gap-4">

          {/* ── STEP 1: Amount & card type ── */}
          {step === 'form' && (
            <form onSubmit={submit1(onStep1Submit)} className="flex flex-col gap-4">
              {/* Amount */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-db-text2 uppercase tracking-wider">
                  {t('deposit.amount')}
                </label>
                <div className="input-wrap">
                  <input
                    type="number"
                    className={`db-input with-suffix text-right ${err1.amount ? 'error' : ''}`}
                    placeholder="10000"
                    min="10000"
                    step="1000"
                    {...reg1('amount', {
                      required: t('deposit.errors.minAmount'),
                      min: { value: 10000, message: t('deposit.errors.minAmount') },
                    })}
                  />
                  <span className="input-suffix">UZS</span>
                </div>
                {err1.amount && <p className="text-xs text-db-red">{err1.amount.message}</p>}
                <p className="text-xs text-db-text2">{t('deposit.minDeposit')}</p>
                <div className="grid grid-cols-4 gap-2">
                  {['10000', '50000', '100000', '500000'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVal1('amount', v)}
                      className="py-2 rounded-xl text-xs font-bold bg-db-elevated text-db-text2 hover:text-white hover:bg-white/10 transition-all"
                    >
                      {fmtUZS(parseInt(v), true)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card type selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-db-text2 uppercase tracking-wider">
                  {t('deposit.selectCardType')}
                </label>
                <div className="flex flex-col gap-2">
                  {CARD_OPTIONS.map((opt) => (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setCardType(opt.type)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all
                        ${cardType === opt.type
                          ? 'border-db-blue bg-db-blue/10'
                          : 'border-white/8 bg-db-elevated hover:border-white/15'}`}
                    >
                      <div className="flex flex-col items-start gap-0.5">
                        <span className={`text-sm font-bold ${cardType === opt.type ? 'text-db-blue' : 'text-db-text2'}`}>
                          {opt.label}
                        </span>
                        <span className={`text-xs mono ${opt.color} opacity-60`}>{opt.example}</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 transition-all
                        ${cardType === opt.type ? 'border-db-blue bg-db-blue' : 'border-white/20'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={sub1}
                className="btn-bet w-full py-4 text-base bg-db-blue text-white rounded-2xl font-bold mt-2"
              >
                {sub1 ? <Spinner size={20} /> : t('deposit.submitBtn')}
              </button>
            </form>
          )}

          {/* ── STEP 2: Transfer info + countdown ── */}
          {step === 'transfer' && depositInfo && (
            <div className="flex flex-col gap-4">
              {isExpired ? (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <AlertCircle size={48} className="text-db-red" />
                  <div>
                    <h3 className="text-lg font-black text-db-red mb-1">{t('deposit.expiredTitle')}</h3>
                    <p className="text-sm text-db-text2">{t('deposit.expiredMsg')}</p>
                  </div>
                  <button
                    onClick={resetFlow}
                    className="btn-bet px-6 py-3 bg-db-blue text-white rounded-2xl font-bold"
                  >
                    {t('deposit.newDeposit')}
                  </button>
                </div>
              ) : (
                <>
                  {/* Countdown */}
                  <Countdown expiresAt={depositInfo.expires_at} onExpire={handleExpire} />

                  {/* Destination card */}
                  <div className="db-card p-4 border border-db-blue/20">
                    <p className="text-xs text-db-text2 uppercase tracking-wider font-semibold mb-3">
                      {t('deposit.sendTo')}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-db-muted mb-1">{t('deposit.cardType')}</p>
                        <span className={`text-xs px-2 py-0.5 rounded font-bold
                          ${depositInfo.destination_card.type === 'humo'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-blue-500/20 text-blue-400'}`}>
                          {depositInfo.destination_card.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-db-muted mb-1">{t('deposit.cardHolder')}</p>
                        <p className="font-semibold text-sm">{depositInfo.destination_card.holder}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-db-elevated rounded-xl p-3">
                      <span className="mono font-black text-base tracking-widest">
                        {depositInfo.destination_card.number.replace(/(\d{4})/g, '$1 ').trim()}
                      </span>
                      <button
                        onClick={copyCard}
                        className={`flex items-center gap-1.5 text-xs font-bold transition-colors
                          ${copied ? 'text-db-green' : 'text-db-blue'}`}
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? t('deposit.copied') : t('deposit.copyCard')}
                      </button>
                    </div>
                  </div>

                  {/* Amount to send */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-db-elevated">
                    <span className="text-sm text-db-text2">{t('deposit.amount')}</span>
                    <span className="font-black mono text-xl text-white">
                      {fmtUZS(parseFloat(depositInfo.amount))}
                    </span>
                  </div>

                  {/* Instructions */}
                  <div className="bg-db-blue/8 border border-db-blue/20 rounded-xl p-4 text-xs text-db-text2 space-y-1.5">
                    <p className="text-db-blue font-bold mb-2">📋 {t('deposit.instructions')}</p>
                    <p>1. Copy the card number above</p>
                    <p>2. Send <span className="text-white font-bold">{fmtUZS(parseFloat(depositInfo.amount))}</span> via P2P transfer</p>
                    <p>3. Take a screenshot of the confirmation</p>
                    <p>4. Click the button below and upload it</p>
                  </div>

                  <button
                    onClick={() => setStep('cheque')}
                    className="btn-bet w-full py-4 text-base bg-db-green/20 border border-db-green/40 text-db-green rounded-2xl font-bold"
                  >
                    {t('deposit.transferred')}
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── STEP 3: Upload cheque ── */}
          {step === 'cheque' && depositInfo && (
            <form onSubmit={submit3(onStep3Submit)} className="flex flex-col gap-4">
              {/* Countdown reminder */}
              <Countdown expiresAt={depositInfo.expires_at} onExpire={handleExpire} />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-db-text2 uppercase tracking-wider">
                  {t('deposit.cheque')}
                </label>
                <div
                  className={`rounded-2xl border-2 border-dashed p-5 flex flex-col items-center gap-2 cursor-pointer transition-all
                    ${err3.cheque
                      ? 'border-db-red/50'
                      : watchedFile?.[0]
                      ? 'border-db-green/40 bg-db-green/5'
                      : 'border-white/10 hover:border-white/20'}`}
                  onClick={() => fileRef.current?.click()}
                >
                  {watchedFile?.[0] ? (
                    <>
                      <div className="text-3xl">
                        {watchedFile[0].type === 'application/pdf' ? '📄' : '🖼️'}
                      </div>
                      <p className="text-sm font-semibold text-db-green truncate max-w-full px-2">
                        {watchedFile[0].name}
                      </p>
                      <p className="text-xs text-db-text2">
                        {(watchedFile[0].size / 1024).toFixed(0)} KB
                      </p>
                      <button
                        type="button"
                        className="text-xs text-db-red mt-1 flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (fileRef.current) fileRef.current.value = ''
                        }}
                      >
                        <X size={12} /> Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload size={28} className="text-db-text2" />
                      <p className="text-sm font-semibold">{t('deposit.cheque')}</p>
                      <p className="text-xs text-db-text2 text-center">{t('deposit.chequeHelp')}</p>
                      <p className="text-xs text-db-muted">JPG • PNG • PDF • max 10MB</p>
                    </>
                  )}
                </div>
                {(() => {
                  const { ref: chequeRef, ...chequeProps } = reg3('cheque', {
                    required: t('deposit.errors.noFile'),
                    validate: {
                      fileType: (files) => {
                        if (!files?.[0]) return true
                        const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
                        return allowed.includes(files[0].type) || t('deposit.errors.fileType')
                      },
                      fileSize: (files) => {
                        if (!files?.[0]) return true
                        return files[0].size <= 10 * 1024 * 1024 || t('deposit.errors.fileSize')
                      },
                    },
                  })
                  return (
                    <input
                      ref={(el) => { chequeRef(el); fileRef.current = el }}
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.pdf"
                      {...chequeProps}
                    />
                  )
                })()}
                {err3.cheque && (
                  <p className="text-xs text-db-red">{err3.cheque.message as string}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={sub3}
                className="btn-bet w-full py-4 text-base bg-db-blue text-white rounded-2xl font-bold"
              >
                {sub3 ? <Spinner size={20} /> : t('deposit.uploadChequeBtn')}
              </button>

              <button
                type="button"
                onClick={() => setStep('transfer')}
                className="text-sm text-db-text2 text-center py-2"
              >
                ← Back to card info
              </button>
            </form>
          )}
        </div>
      </div>
    </MobileLayout>
  )
}

export default Deposit

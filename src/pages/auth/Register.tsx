import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, AlertCircle, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { authAPI, parseError, fmtUZS } from '../../api/client'
import { useAuthStore } from '../../store'
import { Logo } from '../../components/Logo'
import { LANGUAGES } from '../../i18n'
import i18n from '../../i18n'

interface FormData { username: string; password: string; promo_code?: string }
interface WelcomeBonusData { amount: string; wagering_requirement: string }

const WelcomeBonusModal: React.FC<{ bonus: WelcomeBonusData; onContinue: () => void }> = ({ bonus, onContinue }) => {
  const amount    = parseFloat(bonus.amount)
  const wagering  = parseFloat(bonus.wagering_requirement)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative w-full max-w-sm db-card p-7 text-center"
        style={{ border: '1px solid rgba(255,215,0,0.25)', boxShadow: '0 0 60px rgba(255,215,0,0.12)' }}
      >
        {/* Confetti-ish ring */}
        <div className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center text-5xl"
          style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.15), transparent 70%)', border: '2px solid rgba(255,215,0,0.3)' }}>
          🎉
        </div>

        <h2 className="text-2xl font-black mb-1">Welcome Bonus!</h2>
        <p className="text-db-text2 text-sm mb-6">Your account has been credited with a no-deposit bonus.</p>

        {/* Bonus amount */}
        <div className="db-card p-4 mb-5" style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)' }}>
          <div className="text-3xl font-black mono text-db-gold mb-1">
            +{fmtUZS(amount)}
          </div>
          <div className="text-xs text-db-text2">Bonus balance credited</div>
        </div>

        {/* Wagering info */}
        <div className="bg-db-elevated rounded-xl p-4 mb-6 text-left space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Shield size={15} className="text-db-blue" />
            Wagering Requirement
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-0 bg-db-gold rounded-full" />
          </div>
          <div className="text-xs text-db-muted leading-relaxed">
            Wager <span className="text-white font-bold">{fmtUZS(wagering)}</span> to unlock bonus for withdrawal.
            Progress as you play — every {fmtUZS(amount)} wagered unlocks 25%.
          </div>
        </div>

        <button
          onClick={onContinue}
          className="w-full py-4 rounded-2xl font-black text-black text-base transition-all hover:brightness-110 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #ffd60a, #f59e0b)' }}
        >
          Start Playing!
        </button>
      </motion.div>
    </div>
  )
}

const Register: React.FC = () => {
  const { t } = useTranslation()
  const nav = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPw, setShowPw] = useState(false)
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState(i18n.language)
  const [welcomeBonus, setWelcomeBonus] = useState<WelcomeBonusData | null>(null)

  const switchLang = (code: string) => { i18n.changeLanguage(code); setLang(code) }

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setServerError('')
    setLoading(true)
    try {
      const payload: { username: string; password: string; promo_code?: string } = {
        username: data.username,
        password: data.password,
      }
      if (data.promo_code?.trim()) payload.promo_code = data.promo_code.trim()

      const res = await authAPI.register(payload)
      const { tokens, user, welcome_bonus } = res.data
      setAuth(user, tokens.access, tokens.refresh)

      if (welcome_bonus?.amount && parseFloat(welcome_bonus.amount) > 0) {
        setWelcomeBonus(welcome_bonus)
      } else {
        nav('/game', { replace: true })
      }
    } catch (err) {
      const raw = (err as any)?.response?.data
      if (raw?.username) setServerError(t('auth.errors.username_taken'))
      else if (raw?.promo_code) setServerError(t('auth.errors.invalid_promo'))
      else if (parseError(err) === 'network') setServerError(t('auth.errors.network'))
      else setServerError(t('auth.errors.unknown'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-db-bg flex flex-col items-center justify-center px-4 py-8 safe-top safe-bottom">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-8" style={{ background: 'radial-gradient(circle, #3a86ff, transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-8" style={{ background: 'radial-gradient(circle, #e63946, transparent 70%)' }} />
        </div>

        <div className="w-full max-w-sm relative z-10">
          {/* Language switcher */}
          <div className="flex justify-end mb-6 gap-1">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => switchLang(l.code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${lang === l.code ? 'bg-db-red/20 text-db-red' : 'text-db-muted hover:text-db-text2'}`}
              >
                {l.flag} {l.code.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center mb-8">
            <Logo size="lg" />
          </div>

          <div className="db-card p-6">
            <h1 className="text-xl font-black mb-1 text-center">{t('auth.register')}</h1>
            {/* Bonus teaser */}
            <p className="text-center text-xs text-db-gold font-semibold mb-5">
              🎁 Get 10,000 UZS bonus on registration — no deposit needed
            </p>

            {serverError && (
              <div className="flex items-start gap-2 bg-db-red/10 border border-db-red/25 rounded-xl p-3 mb-4 animate-fade-in">
                <AlertCircle size={16} className="text-db-red flex-shrink-0 mt-0.5" />
                <p className="text-db-red text-sm font-medium">{serverError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-db-text2 uppercase tracking-wider">{t('auth.username')}</label>
                <input
                  className={`db-input ${errors.username ? 'error' : ''}`}
                  placeholder={t('auth.usernamePlaceholder')}
                  autoCapitalize="none"
                  autoCorrect="off"
                  {...register('username', {
                    required: t('auth.errors.username_short'),
                    minLength: { value: 8, message: t('auth.errors.username_short') },
                    maxLength: { value: 32, message: t('auth.errors.username_long') },
                  })}
                />
                {errors.username && <p className="text-xs text-db-red">{errors.username.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-db-text2 uppercase tracking-wider">{t('auth.password')}</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className={`db-input ${errors.password ? 'error' : ''}`}
                    style={{ paddingRight: '44px' }}
                    placeholder={t('auth.passwordPlaceholder')}
                    {...register('password', {
                      required: t('auth.errors.password_short'),
                      minLength: { value: 8, message: t('auth.errors.password_short') },
                      maxLength: { value: 32, message: t('auth.errors.username_long') },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-db-muted hover:text-db-text2"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-db-red">{errors.password.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-db-text2 uppercase tracking-wider">{t('auth.promoCode')}</label>
                <input
                  className="db-input"
                  placeholder={t('auth.promoCodePlaceholder')}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  {...register('promo_code')}
                />
              </div>

              <div className="bg-db-elevated rounded-xl p-3 text-xs text-db-text2 space-y-1">
                <div>• 8–32 characters, any symbols allowed</div>
                <div>• No email required</div>
                <div>• Remember your credentials — no recovery</div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-bet w-full py-4 text-white mt-1 flex items-center justify-center gap-2"
                style={{ background: loading ? undefined : 'linear-gradient(135deg,#3a86ff,#1565c0)' }}
              >
                {loading ? <div className="spinner" /> : t('auth.registerBtn')}
              </button>
            </form>

            <p className="text-center text-db-text2 text-sm mt-5">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-db-red font-bold hover:underline">{t('auth.login')}</Link>
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {welcomeBonus && (
          <WelcomeBonusModal
            bonus={welcomeBonus}
            onContinue={() => nav('/game', { replace: true })}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default Register

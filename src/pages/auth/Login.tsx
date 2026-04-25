import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { authAPI, parseError } from '../../api/client'
import { useAuthStore } from '../../store'
import { Logo } from '../../components/Logo'
import { LANGUAGES } from '../../i18n'
import i18n from '../../i18n'

interface FormData { username: string; password: string }

const ERROR_MAP: Record<string, string> = {
  network:             'errors.network',
  invalid_credentials: 'errors.invalid_credentials',
  banned:              'errors.banned',
  unknown:             'errors.unknown',
}

const Login: React.FC = () => {
  const { t } = useTranslation()
  const nav = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPw, setShowPw] = useState(false)
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState(i18n.language)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setServerError('')
    setLoading(true)
    try {
      const res = await authAPI.login(data)
      const { tokens, user } = res.data
      setAuth(user, tokens.access, tokens.refresh)
      nav('/game', { replace: true })
    } catch (err) {
      const code = parseError(err)
      // Map backend error to specific message
      const errMsg = err && typeof err === 'object' && 'response' in err
        ? (err as any).response?.data?.detail ||
          (err as any).response?.data?.non_field_errors?.[0] || code
        : code
      // Check if it contains "banned" keyword
      if (errMsg.toLowerCase().includes('ban')) {
        setServerError(t('auth.errors.banned'))
      } else if (errMsg === 'network' || code === 'network') {
        setServerError(t('auth.errors.network'))
      } else {
        setServerError(t('auth.errors.invalid_credentials'))
      }
    } finally {
      setLoading(false)
    }
  }

  const switchLang = (code: string) => {
    i18n.changeLanguage(code)
    setLang(code)
  }

  return (
    <div className="min-h-screen bg-db-bg flex flex-col items-center justify-center px-4 py-8 safe-top safe-bottom">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #e63946, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-8" style={{ background: 'radial-gradient(circle, #3a86ff, transparent 70%)' }} />
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

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <Logo size="xl" />
          <p className="text-db-text2 text-sm mt-3">The ultimate crash game</p>
        </div>

        {/* Form */}
        <div className="db-card p-6">
          <h1 className="text-xl font-black mb-6 text-center">{t('auth.login')}</h1>

          {/* Server error */}
          {serverError && (
            <div className="flex items-start gap-2 bg-db-red/10 border border-db-red/25 rounded-xl p-3 mb-4 animate-fade-in">
              <AlertCircle size={16} className="text-db-red flex-shrink-0 mt-0.5" />
              <p className="text-db-red text-sm font-medium">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Username */}
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

            {/* Password */}
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
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-db-muted hover:text-db-text2">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-db-red">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-bet w-full py-4 text-white mt-2 flex items-center justify-center gap-2"
              style={{ background: loading ? undefined : 'linear-gradient(135deg,#e63946,#c1121f)' }}
            >
              {loading ? <div className="spinner" /> : t('auth.loginBtn')}
            </button>
          </form>

          <p className="text-center text-db-text2 text-sm mt-5">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-db-blue font-bold hover:underline">{t('auth.register')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login

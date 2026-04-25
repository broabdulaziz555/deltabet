import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, AlertCircle, User, Lock } from 'lucide-react'
import { authAPI, parseError } from '../../api/client'
import { useAuthStore } from '../../store'
import { Logo } from '../../components/Logo'

interface FormData { username: string; password: string }

const Register: React.FC = () => {
  const { t } = useTranslation()
  const nav = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPw, setShowPw] = useState(false)
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setServerError('')
    setLoading(true)
    try {
      const res = await authAPI.register(data)
      const { tokens, user } = res.data
      setAuth(user, tokens.access, tokens.refresh)
      nav('/game', { replace: true })
    } catch (err) {
      const raw = (err as any)?.response?.data
      if (raw?.username) setServerError(t('auth.errors.username_taken'))
      else if (parseError(err) === 'network') setServerError(t('auth.errors.network'))
      else setServerError(t('auth.errors.unknown'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-db-bg flex flex-col items-center justify-center px-4 py-8 safe-top safe-bottom">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-8" style={{ background: 'radial-gradient(circle, #3a86ff, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-8" style={{ background: 'radial-gradient(circle, #e63946, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" />
        </div>

        <div className="db-card p-6">
          <h1 className="text-xl font-black mb-6 text-center">{t('auth.register')}</h1>

          {serverError && (
            <div className="flex items-start gap-2 bg-db-red/10 border border-db-red/25 rounded-xl p-3 mb-4 animate-fade-in">
              <AlertCircle size={16} className="text-db-red flex-shrink-0 mt-0.5" />
              <p className="text-db-red text-sm font-medium">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-db-text2 uppercase tracking-wider">{t('auth.username')}</label>
              <div className="relative flex items-center">
                <User size={16} className="absolute left-3 text-db-muted pointer-events-none" />
                <input
                  className={`db-input pl-9 ${errors.username ? 'error' : ''}`}
                  placeholder={t('auth.usernamePlaceholder')}
                  autoCapitalize="none" autoCorrect="off"
                  {...register('username', {
                    required: t('auth.errors.username_short'),
                    minLength: { value: 8, message: t('auth.errors.username_short') },
                    maxLength: { value: 32, message: t('auth.errors.username_long') },
                  })}
                />
              </div>
              {errors.username && <p className="text-xs text-db-red">{errors.username.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-db-text2 uppercase tracking-wider">{t('auth.password')}</label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3 text-db-muted pointer-events-none" />
                <input
                  type={showPw ? 'text' : 'password'}
                  className={`db-input pl-9 pr-10 ${errors.password ? 'error' : ''}`}
                  placeholder={t('auth.passwordPlaceholder')}
                  {...register('password', {
                    required: t('auth.errors.password_short'),
                    minLength: { value: 8, message: t('auth.errors.password_short') },
                    maxLength: { value: 32, message: t('auth.errors.username_long') },
                  })}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 text-db-muted hover:text-db-text2">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-db-red">{errors.password.message}</p>}
            </div>

            <div className="bg-db-elevated rounded-xl p-3 text-xs text-db-text2 space-y-1">
              <div>• 8–32 characters, any symbols allowed</div>
              <div>• No email required</div>
              <div>• Remember your credentials — no recovery</div>
            </div>

            <button type="submit" disabled={loading}
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
  )
}

export default Register

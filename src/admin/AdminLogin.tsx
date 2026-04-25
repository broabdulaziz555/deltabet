import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, AlertCircle, Shield } from 'lucide-react'
import { authAPI, parseError } from '../api/client'
import { useAuthStore } from '../store'
import { DeltaIcon } from '../components/Logo'

const AdminLogin: React.FC = () => {
  const { t } = useTranslation()
  const nav = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) { setError('Enter username and password'); return }
    setError(''); setLoading(true)
    try {
      const res = await authAPI.login({ username, password })
      const { tokens, user } = res.data
      if (!user.is_staff) { setError(t('admin.errors.not_staff')); setLoading(false); return }
      setAuth(user, tokens.access, tokens.refresh)
      nav('/admin/dashboard', { replace: true })
    } catch (err) {
      const code = parseError(err)
      if (code === 'network') setError(t('admin.errors.network'))
      else setError(t('admin.errors.wrong_password'))
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background:'linear-gradient(135deg,#07070f,#0a0a1a,#070711)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-5"
          style={{ background:'radial-gradient(circle,#e63946,transparent 70%)' }}/>
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage:'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize:'40px 40px' }}/>
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <DeltaIcon size={48}/>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Shield size={16} className="text-db-red"/>
            <h1 className="text-xl font-black">Admin Panel</h1>
          </div>
          <p className="text-db-text2 text-sm mt-1">DeltaBet Administration</p>
        </div>

        <div className="db-card p-6" style={{ border:'1px solid rgba(230,57,70,0.15)' }}>
          <h2 className="text-base font-bold mb-5 text-center">{t('admin.login')}</h2>

          {error && (
            <div className="flex items-start gap-2 bg-db-red/10 border border-db-red/30 rounded-xl p-3 mb-4 animate-fade-in">
              <AlertCircle size={16} className="text-db-red flex-shrink-0 mt-0.5"/>
              <p className="text-db-red text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-db-text2 uppercase tracking-wider">Username</label>
              <input className="db-input" placeholder="admin" value={username}
                onChange={(e) => setUsername(e.target.value)} autoCapitalize="none"/>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-db-text2 uppercase tracking-wider">Password</label>
              <div className="input-wrap">
                <input type={showPw?'text':'password'} className="db-input with-suffix" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}/>
                <button type="button" className="input-prefix-icon" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-bet w-full py-4 flex items-center justify-center gap-2"
              style={{ background:'linear-gradient(135deg,#e63946,#b71c1c)' }}>
              {loading ? <div className="spinner"/> : <><Shield size={16}/>Login to Admin</>}
            </button>
          </form>
          <div className="mt-4 text-center">
            <a href="/" className="text-xs text-db-text2 hover:text-db-blue transition-colors">← Back to site</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin

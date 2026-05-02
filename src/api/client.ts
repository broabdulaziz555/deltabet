import axios from 'axios'
import toast from 'react-hot-toast'

const BASE_URL = (import.meta.env?.VITE_API_URL as string | undefined) || 'http://localhost:8000'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401, generic error toast on 500
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) throw new Error('no refresh')
        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh/`, { refresh })
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('deltabet-auth')
        const path = window.location.pathname
        if (!path.includes('/login') && !path.includes('/register') && !path.startsWith('/admin')) {
          window.location.replace('/login')
        }
      }
    }
    if (err.response?.status >= 500) {
      toast.error('Server error. Please try again.')
    }
    return Promise.reject(err)
  }
)

// ─── Auth ───
export const authAPI = {
  register: (data: { username: string; password: string; promo_code?: string }) =>
    api.post('/api/auth/register/', data),
  login: (data: { username: string; password: string }) =>
    api.post('/api/auth/login/', data),
  me: () => api.get('/api/auth/me/'),
  stats: () => api.get('/api/auth/stats/'),
  switchMode: (mode: 'demo' | 'real' | 'balanced') => api.post('/api/auth/mode/', { mode }),
  updatePromoCode: (promo_code: string) => api.post('/api/auth/promo/', { promo_code }),
}

// ─── Game ───
export const gameAPI = {
  placeBet: (data: { amount: string; target_multiplier: string }) =>
    api.post('/api/game/bet/', data),
  history: (params?: { mode?: string; page?: number }) =>
    api.get('/api/game/history/', { params }),
}

// ─── Transactions ───
export const txAPI = {
  getCards: () => api.get('/api/transactions/cards/'),
  createDeposit: (data: { amount: string; card_type: 'uzcard' | 'humo' | 'bank' }) =>
    api.post('/api/transactions/deposit/', data),
  uploadCheque: (depositId: number, chequeBase64: string) =>
    api.post(`/api/transactions/deposit/${depositId}/upload/`, { cheque_base64: chequeBase64 }),
  depositHistory: (page = 1) =>
    api.get('/api/transactions/deposit/history/', { params: { page } }),
  withdraw: (data: { amount: string; card_number: string; card_type: string }) =>
    api.post('/api/transactions/withdraw/', data),
  withdrawHistory: (page = 1) =>
    api.get('/api/transactions/withdraw/history/', { params: { page } }),
}

// ─── Bonuses ───
export const bonusAPI = {
  checkPromo: (code: string) => api.post('/api/bonuses/check/', { code }),
  myBonuses: () => api.get('/api/bonuses/my/'),
  welcomeStatus: () => api.get('/api/bonuses/welcome/'),
}

// ─── Admin (requires is_staff JWT) ───
export const adminAPI = {
  stats: () => api.get('/api/admin/stats/'),
  users: (params?: { page?: number; search?: string }) =>
    api.get('/api/admin/users/', { params }),
  banUser: (id: number, reason: string) =>
    api.post(`/api/admin/users/${id}/ban/`, { reason }),
  unbanUser: (id: number) => api.post(`/api/admin/users/${id}/unban/`),
  resetUser: (id: number) => api.post(`/api/admin/users/${id}/reset/`),
  adjustBalance: (id: number, amount: number) =>
    api.post(`/api/admin/users/${id}/balance/`, { amount }),
  deposits: (params?: { status?: string; page?: number }) =>
    api.get('/api/admin/deposits/', { params }),
  approveDeposit: (id: number, amount_received: number) =>
    api.post(`/api/admin/deposits/${id}/approve/`, { amount_received }),
  rejectDeposit: (id: number, note: string) =>
    api.post(`/api/admin/deposits/${id}/reject/`, { note }),
  withdrawals: (params?: { status?: string; page?: number }) =>
    api.get('/api/admin/withdrawals/', { params }),
  approveWithdrawal: (id: number) =>
    api.post(`/api/admin/withdrawals/${id}/approve/`),
  rejectWithdrawal: (id: number, note: string) =>
    api.post(`/api/admin/withdrawals/${id}/reject/`, { note }),
  promos: () => api.get('/api/admin/promos/'),
  createPromo: (data: object) => api.post('/api/admin/promos/', data),
  togglePromo: (id: number) => api.post(`/api/admin/promos/${id}/toggle/`),
  betHistory: (params?: { page?: number; mode?: string }) =>
    api.get('/api/admin/bets/', { params }),
  deletePromo: (id: number) => api.delete(`/api/admin/promos/${id}/`),
  algoConfig: () => api.get('/api/admin/algo/'),
  updateAlgoConfig: (data: object) => api.post('/api/admin/algo/', data),
  settings: () => api.get('/api/admin/settings/'),
  updateSetting: (key: string, value: string | number) =>
    api.post('/api/admin/settings/', { key, value: String(value) }),
  resetWagering: (id: number) => api.post(`/api/admin/users/${id}/wagering/reset/`),
}

// ─── Error parser ───
export function parseError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as Record<string, unknown> | string | undefined
    if (typeof data === 'string') return data
    if (data && typeof data === 'object') {
      if (typeof data['detail'] === 'string') return data['detail']
      if (typeof data['error'] === 'string') return data['error']
      const nfe = data['non_field_errors']
      if (Array.isArray(nfe) && typeof nfe[0] === 'string') return nfe[0]
      const first = Object.values(data)[0]
      if (Array.isArray(first) && typeof first[0] === 'string') return first[0]
    }
    if (!err.response) return 'network'
    return 'unknown'
  }
  return 'unknown'
}

// ─── Format UZS ───
export const fmtUZS = (n: number | string, short = false): string => {
  const num = typeof n === 'string' ? parseFloat(n) : n
  if (isNaN(num)) return '0 UZS'
  if (short && num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M UZS`
  if (short && num >= 1_000) return `${(num / 1_000).toFixed(0)}K UZS`
  return `${num.toLocaleString('ru-RU')} UZS`
}

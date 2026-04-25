import axios from 'axios'

const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'

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

// Auto-refresh on 401
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
        // Clear everything without causing a redirect loop
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('deltabet-auth')
        // Only redirect if not already on an auth page
        const path = window.location.pathname
        if (!path.includes('/login') && !path.includes('/register') && !path.startsWith('/admin')) {
          window.location.replace('/login')
        }
      }
    }
    return Promise.reject(err)
  }
)

// ─── Auth ───
export const authAPI = {
  register: (data: { username: string; password: string }) =>
    api.post('/api/auth/register/', data),
  login: (data: { username: string; password: string }) =>
    api.post('/api/auth/login/', data),
  me: () => api.get('/api/auth/me/'),
  stats: () => api.get('/api/auth/stats/'),
  switchMode: (mode: 'demo' | 'real') => api.post('/api/auth/mode/', { mode }),
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
  deposit: (formData: FormData) =>
    api.post('/api/transactions/deposit/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
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
  betHistory: (params?: { page?: number }) =>
    api.get('/api/admin/bets/', { params }),
}

// ─── Error parser ───
export function parseError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data
    if (typeof data === 'string') return data
    if (data?.detail) return data.detail
    if (data?.error) return data.error
    if (data?.non_field_errors) return data.non_field_errors[0]
    const first = Object.values(data || {})[0]
    if (Array.isArray(first)) return first[0] as string
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

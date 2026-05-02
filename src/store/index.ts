import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserLevel = 'none' | 'silver' | 'gold' | 'platinum' | 'vip'

export interface User {
  id: number
  username: string
  balance: string
  bonus_balance: string
  total_balance: string
  game_mode: 'demo' | 'real' | 'balanced'
  promo_code?: string | null
  wagered_amount: string
  wagering_required: string
  wagering_remaining: string
  can_withdraw: boolean
  total_deposited: string
  total_withdrawn: string
  total_bet: string
  total_won: string
  is_banned?: boolean
  is_staff?: boolean
  level: UserLevel
  lifetime_deposits: string
  wagering_progress?: {
    wager_required: string
    wager_completed: string
    locked_bonus: string
    pct: number
    unlocked_25: string | null
    unlocked_50: string | null
    unlocked_75: string | null
    unlocked_100: string | null
  } | null
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  _hasHydrated: boolean
  setHasHydrated: (v: boolean) => void
  setAuth: (user: User, access: string, refresh: string) => void
  setUser: (user: User) => void
  updateBalance: (balance: string, bonus: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isAdmin: false,
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      setAuth: (user, access, refresh) => {
        localStorage.setItem('access_token', access)
        localStorage.setItem('refresh_token', refresh)
        set({ user, accessToken: access, isAuthenticated: true, isAdmin: !!user.is_staff })
      },
      setUser: (user) => set({ user, isAdmin: !!user.is_staff }),
      updateBalance: (balance, bonus_balance) =>
        set((s) => s.user ? { user: { ...s.user, balance, bonus_balance } } : {}),
      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, isAuthenticated: false, isAdmin: false })
      },
    }),
    {
      name: 'deltabet-auth',
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

// ─── Game store ───
export interface BetResult {
  won: boolean
  crash_point: number
  payout: string
  profit: string
}

export interface RecentBet {
  id: number
  crash_point: string
  status: 'won' | 'lost'
  target_multiplier: string
  amount: string
  mode: 'demo' | 'real' | 'balanced'
}

interface GameState {
  phase: 'idle' | 'animating' | 'result'
  displayMultiplier: number
  lastResult: BetResult | null
  recentBets: RecentBet[]
  isPlacing: boolean
  setPhase: (p: GameState['phase']) => void
  setDisplayMultiplier: (v: number) => void
  setLastResult: (r: BetResult | null) => void
  addRecentBet: (b: RecentBet) => void
  setIsPlacing: (v: boolean) => void
  reset: () => void
}

export const useGameStore = create<GameState>((set) => ({
  phase: 'idle',
  displayMultiplier: 1.0,
  lastResult: null,
  recentBets: [],
  isPlacing: false,
  setPhase: (phase) => set({ phase }),
  setDisplayMultiplier: (displayMultiplier) => set({ displayMultiplier }),
  setLastResult: (lastResult) => set({ lastResult }),
  addRecentBet: (b) => set((s) => ({ recentBets: [b, ...s.recentBets].slice(0, 20) })),
  setIsPlacing: (isPlacing) => set({ isPlacing }),
  reset: () => set({ phase: 'idle', displayMultiplier: 1.0, lastResult: null }),
}))

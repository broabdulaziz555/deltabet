import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store'
import { authAPI } from './api/client'

// Pages
import Login        from './pages/auth/Login'
import Register     from './pages/auth/Register'
import Game         from './pages/Game'
import History      from './pages/History'
import Transactions from './pages/Transactions'
import Deposit      from './pages/Deposit'
import Withdraw     from './pages/Withdraw'
import Profile      from './pages/Profile'

// Admin
import AdminLogin   from './admin/AdminLogin'
import AdminLayout  from './admin/AdminLayout'
import Dashboard    from './admin/pages/Dashboard'
import AdminDeposits from './admin/pages/Deposits'
import { AdminWithdrawals, AdminUsers, AdminPromos } from './admin/pages/AdminPages'

// ─── Auth guard ───
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, _hasHydrated } = useAuthStore()
  const location = useLocation()

  // Wait for zustand to rehydrate from localStorage before deciding
  if (!_hasHydrated) return null

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}

// ─── Admin guard ───
const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, _hasHydrated } = useAuthStore()
  const location = useLocation()

  if (!_hasHydrated) return null

  if (!isAuthenticated || !user?.is_staff) {
    return <Navigate to="/admin" state={{ from: location }} replace />
  }
  return <>{children}</>
}

// ─── Auto-refresh user on mount ───
const AuthSync: React.FC = () => {
  const { isAuthenticated, setUser, logout } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) return
    authAPI.me()
      .then((r) => setUser(r.data))
      .catch(() => logout()) // token invalid → clear state, no redirect loop
  }, []) // eslint-disable-line

  return null
}

const App: React.FC = () => (
  <>
    <AuthSync />
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* User routes */}
      <Route path="/"            element={<RequireAuth><Navigate to="/game" replace /></RequireAuth>} />
      <Route path="/game"        element={<RequireAuth><Game /></RequireAuth>} />
      <Route path="/history"     element={<RequireAuth><History /></RequireAuth>} />
      <Route path="/transactions" element={<RequireAuth><Transactions /></RequireAuth>} />
      <Route path="/deposit"     element={<RequireAuth><Deposit /></RequireAuth>} />
      <Route path="/withdraw"    element={<RequireAuth><Withdraw /></RequireAuth>} />
      <Route path="/profile"     element={<RequireAuth><Profile /></RequireAuth>} />

      {/* Admin - login is PUBLIC, no guard */}
      <Route path="/admin" element={<AdminLogin />} />

      {/* Admin - protected pages */}
      <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route path="dashboard"   element={<Dashboard />} />
        <Route path="deposits"    element={<AdminDeposits />} />
        <Route path="withdrawals" element={<AdminWithdrawals />} />
        <Route path="users"       element={<AdminUsers />} />
        <Route path="promos"      element={<AdminPromos />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
)

export default App

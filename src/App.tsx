import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store'
import { authAPI } from './api/client'

import Login        from './pages/auth/Login'
import Register     from './pages/auth/Register'
import Game         from './pages/Game'
import History      from './pages/History'
import Transactions from './pages/Transactions'
import Deposit      from './pages/Deposit'
import Withdraw     from './pages/Withdraw'
import Profile      from './pages/Profile'

import AdminLogin  from './admin/AdminLogin'
import AdminLayout from './admin/AdminLayout'
import Dashboard   from './admin/pages/Dashboard'
import AdminDeposits from './admin/pages/Deposits'
import { AdminWithdrawals, AdminUsers, AdminPromos } from './admin/pages/AdminPages'

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, _hasHydrated } = useAuthStore()
  const location = useLocation()
  if (!_hasHydrated) return null
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace/>
  return <>{children}</>
}

const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, _hasHydrated } = useAuthStore()
  if (!_hasHydrated) return null
  if (!isAuthenticated || !user?.is_staff) return <Navigate to="/admin" replace/>
  return <>{children}</>
}

const AuthSync: React.FC = () => {
  const { isAuthenticated, setUser, logout } = useAuthStore()
  useEffect(() => {
    if (!isAuthenticated) return
    authAPI.me().then((r) => setUser(r.data)).catch(() => logout())
  }, []) // eslint-disable-line
  return null
}

const App: React.FC = () => (
  <>
    <AuthSync/>
    <Routes>
      <Route path="/login"    element={<Login/>}/>
      <Route path="/register" element={<Register/>}/>

      <Route path="/"            element={<RequireAuth><Navigate to="/game" replace/></RequireAuth>}/>
      <Route path="/game"        element={<RequireAuth><Game/></RequireAuth>}/>
      <Route path="/history"     element={<RequireAuth><History/></RequireAuth>}/>
      <Route path="/transactions" element={<RequireAuth><Transactions/></RequireAuth>}/>
      <Route path="/deposit"     element={<RequireAuth><Deposit/></RequireAuth>}/>
      <Route path="/withdraw"    element={<RequireAuth><Withdraw/></RequireAuth>}/>
      <Route path="/profile"     element={<RequireAuth><Profile/></RequireAuth>}/>

      {/* Admin login — fully public */}
      <Route path="/admin" element={<AdminLogin/>}/>

      {/* Admin protected pages — separate from login route */}
      <Route path="/admin/dashboard"   element={<RequireAdmin><AdminLayout page="dashboard"/></RequireAdmin>}/>
      <Route path="/admin/deposits"    element={<RequireAdmin><AdminLayout page="deposits"/></RequireAdmin>}/>
      <Route path="/admin/withdrawals" element={<RequireAdmin><AdminLayout page="withdrawals"/></RequireAdmin>}/>
      <Route path="/admin/users"       element={<RequireAdmin><AdminLayout page="users"/></RequireAdmin>}/>
      <Route path="/admin/promos"      element={<RequireAdmin><AdminLayout page="promos"/></RequireAdmin>}/>
      <Route path="/admin/bets"        element={<RequireAdmin><AdminLayout page="bets"/></RequireAdmin>}/>

      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  </>
)

export default App

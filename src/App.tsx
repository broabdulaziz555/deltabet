import React, { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store'
import { authAPI } from './api/client'
import { ErrorBoundary } from './components/ErrorBoundary'

// ─── Lazy page imports ────────────────────────────────────────────────────────
const Login        = lazy(() => import('./pages/auth/Login'))
const Register     = lazy(() => import('./pages/auth/Register'))
const Game         = lazy(() => import('./pages/Game'))
const History      = lazy(() => import('./pages/History'))
const Transactions = lazy(() => import('./pages/Transactions'))
const Deposit      = lazy(() => import('./pages/Deposit'))
const Withdraw     = lazy(() => import('./pages/Withdraw'))
const Profile      = lazy(() => import('./pages/Profile'))
const NotFound     = lazy(() => import('./pages/NotFound'))

const AdminLogin   = lazy(() => import('./admin/AdminLogin'))
const AdminLayout  = lazy(() => import('./admin/AdminLayout'))

// ─── Suspense fallback ────────────────────────────────────────────────────────
const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-db-bg flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-db-blue border-t-transparent animate-spin" />
  </div>
)

// ─── Route guards ─────────────────────────────────────────────────────────────
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

// ─── App ──────────────────────────────────────────────────────────────────────
const App: React.FC = () => (
  <ErrorBoundary>
    <AuthSync/>
    <Suspense fallback={<PageLoader/>}>
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

        <Route path="/admin" element={<AdminLogin/>}/>

        <Route path="/admin/dashboard"   element={<RequireAdmin><AdminLayout page="dashboard"/></RequireAdmin>}/>
        <Route path="/admin/deposits"    element={<RequireAdmin><AdminLayout page="deposits"/></RequireAdmin>}/>
        <Route path="/admin/withdrawals" element={<RequireAdmin><AdminLayout page="withdrawals"/></RequireAdmin>}/>
        <Route path="/admin/users"       element={<RequireAdmin><AdminLayout page="users"/></RequireAdmin>}/>
        <Route path="/admin/promos"      element={<RequireAdmin><AdminLayout page="promos"/></RequireAdmin>}/>
        <Route path="/admin/bets"        element={<RequireAdmin><AdminLayout page="bets"/></RequireAdmin>}/>
        <Route path="/admin/algo"        element={<RequireAdmin><AdminLayout page="algo"/></RequireAdmin>}/>

        <Route path="*" element={<NotFound/>}/>
      </Routes>
    </Suspense>
  </ErrorBoundary>
)

export default App

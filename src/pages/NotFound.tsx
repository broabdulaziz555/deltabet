import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'

const NotFound: React.FC = () => {
  const nav = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return (
    <div className="min-h-screen bg-db-bg flex flex-col items-center justify-center px-4 text-center gap-4">
      <div className="text-7xl font-black text-db-red/30">404</div>
      <h1 className="text-xl font-black">Page not found</h1>
      <p className="text-db-text2 text-sm">The page you're looking for doesn't exist.</p>
      <button
        onClick={() => nav(isAuthenticated ? '/game' : '/login')}
        className="bg-db-red text-white font-bold px-6 py-3 rounded-2xl hover:brightness-110 active:scale-95 transition-all mt-2"
      >
        Go Home
      </button>
    </div>
  )
}

export default NotFound

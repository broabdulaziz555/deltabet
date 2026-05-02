import React from 'react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Button ───
interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDrag' | 'onDragEnd'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', loading, fullWidth, children, className, disabled, ...rest
}) => {
  const base = 'inline-flex items-center justify-center font-bold rounded-2xl transition-colors select-none disabled:opacity-40 disabled:cursor-not-allowed'
  const variants = {
    primary:   'bg-db-red text-white shadow-red-glow hover:brightness-110',
    secondary: 'bg-db-elevated text-db-text2 hover:text-white border border-db-border',
    danger:    'bg-db-red-d text-white hover:brightness-110',
    ghost:     'bg-transparent text-db-text2 hover:bg-white/5 hover:text-white',
    success:   'bg-db-green text-db-bg shadow-green-glow hover:brightness-110 font-black',
  }
  const sizes = {
    sm: 'px-4 py-2 text-xs gap-1.5',
    md: 'px-5 py-3 text-sm gap-2',
    lg: 'px-6 py-4 text-base gap-2',
  }
  const isDisabled = disabled || loading
  return (
    <motion.button
      className={clsx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.02 } : undefined}
      whileTap={!isDisabled ? { scale: 0.96 } : undefined}
      {...rest}
    >
      {loading ? <div className="spinner" /> : children}
    </motion.button>
  )
}

// ─── Input ───
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  error?: string
  suffix?: React.ReactNode
  prefix?: React.ReactNode
}
export const Input: React.FC<InputProps> = ({ label, error, suffix, prefix, className, ...rest }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-xs font-600 text-db-text2 uppercase tracking-wider">{label}</label>}
    <div className="relative flex items-center">
      {prefix && <span className="absolute left-3 text-db-text2 pointer-events-none">{prefix}</span>}
      <input
        className={clsx('db-input', prefix && 'pl-9', suffix && 'pr-16', error && 'error', className)}
        {...rest}
      />
      {suffix && <span className="absolute right-3 text-xs font-bold text-db-text2 pointer-events-none">{suffix}</span>}
    </div>
    {error && <p className="text-xs text-db-red animate-fade-in">{error}</p>}
  </div>
)

// ─── Card ───
export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className, onClick }) => (
  <div className={clsx('db-card', onClick && 'cursor-pointer active:scale-98 transition-transform', className)} onClick={onClick}>
    {children}
  </div>
)

// ─── Badge ───
export const Badge: React.FC<{ status: string; label?: string }> = ({ status, label }) => (
  <span className={`badge-${status}`}>{label || status.toUpperCase()}</span>
)

// ─── Modal ───
interface ModalProps { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }
export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <motion.div
          className="relative w-full sm:max-w-md db-card rounded-t-3xl sm:rounded-3xl p-6"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">{title}</h2>
              <button onClick={onClose} className="text-db-text2 hover:text-white p-1">✕</button>
            </div>
          )}
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
)

// ─── SkeletonLoader ───
export const SkeletonLoader: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('animate-pulse rounded-xl bg-white/[0.04]', className)} />
)

// ─── SkeletonCard ───
export const SkeletonCard: React.FC = () => (
  <div className="db-card p-4 space-y-3">
    <div className="flex items-center justify-between">
      <SkeletonLoader className="h-4 w-20" />
      <SkeletonLoader className="h-4 w-16" />
    </div>
    <SkeletonLoader className="h-3 w-full" />
    <SkeletonLoader className="h-3 w-3/4" />
  </div>
)

// ─── Spinner ───
export const Spinner: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <div style={{ width: size, height: size }} className="spinner mx-auto" />
)

// ─── Empty State ───
export const Empty: React.FC<{ icon?: string; message: string }> = ({ icon = '📭', message }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <div className="text-5xl opacity-30">{icon}</div>
    <p className="text-db-text2 text-sm text-center">{message}</p>
  </div>
)

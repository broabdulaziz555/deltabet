import React from 'react'
import type { UserLevel } from '../store'

interface Props {
  level: UserLevel
  size?: 'sm' | 'md'
}

const LEVEL_CLASSES: Record<Exclude<UserLevel, 'none'>, string> = {
  silver:   'bg-gray-500/15 text-gray-400 border border-gray-500/30',
  gold:     'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  platinum: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  vip:      'bg-black text-db-red border border-db-red/40',
}

const LEVEL_LABELS: Record<Exclude<UserLevel, 'none'>, string> = {
  silver:   'SILVER',
  gold:     'GOLD',
  platinum: 'PLATINUM',
  vip:      'VIP',
}

const LevelBadge: React.FC<Props> = ({ level, size = 'sm' }) => {
  if (!level || level === 'none') return null
  const classes = LEVEL_CLASSES[level]
  const label = LEVEL_LABELS[level]
  const sizeClass = size === 'sm'
    ? 'text-[9px] px-2 py-0.5'
    : 'text-xs px-2.5 py-1'
  return (
    <span className={`inline-flex items-center font-black tracking-widest rounded-full ${sizeClass} ${classes}`}>
      {label}
    </span>
  )
}

export default LevelBadge

import React from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'full' | 'icon'
  className?: string
}

const sizes = { sm: 28, md: 36, lg: 48, xl: 72 }

export const DeltaIcon: React.FC<{ size?: number; className?: string }> = ({ size = 36, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="dg1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="#e63946" />
        <stop offset="50%"  stopColor="#c1121f" />
        <stop offset="100%" stopColor="#3a86ff" />
      </linearGradient>
      <linearGradient id="dg2" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%"  stopColor="#3a86ff" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#e63946" stopOpacity="0.3" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    {/* Outer triangle */}
    <polygon points="24,4 46,42 2,42" fill="none" stroke="url(#dg1)" strokeWidth="3.5" strokeLinejoin="round" filter="url(#glow)" />
    {/* Inner glow triangle */}
    <polygon points="24,12 39,38 9,38" fill="url(#dg2)" />
    {/* Center line accent */}
    <line x1="24" y1="20" x2="24" y2="34" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
    <circle cx="24" cy="17" r="2" fill="white" opacity="0.9" />
  </svg>
)

export const Logo: React.FC<LogoProps> = ({ size = 'md', variant = 'full', className = '' }) => {
  const iconSize = sizes[size]
  const textSizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl', xl: 'text-4xl' }

  if (variant === 'icon') return <DeltaIcon size={iconSize} className={className} />

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <DeltaIcon size={iconSize} />
      <div className="flex items-baseline">
        <span className={`font-black tracking-tight ${textSizes[size]}`} style={{ color: '#ffffff', letterSpacing: '-0.02em' }}>
          Delta
        </span>
        <span className={`font-black tracking-tight ${textSizes[size]}`}
          style={{
            background: 'linear-gradient(135deg, #e63946, #ff6b6b)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
          }}>
          Bet
        </span>
      </div>
    </div>
  )
}

// Favicon SVG (exported as string for public/favicon.svg)
export const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e63946"/>
      <stop offset="100%" stop-color="#3a86ff"/>
    </linearGradient>
  </defs>
  <polygon points="24,4 46,42 2,42" fill="none" stroke="url(#g)" stroke-width="4" stroke-linejoin="round"/>
  <line x1="24" y1="20" x2="24" y2="34" stroke="white" stroke-width="3" stroke-linecap="round"/>
  <circle cx="24" cy="17" r="2.5" fill="white"/>
</svg>`

export default Logo

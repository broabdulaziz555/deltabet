import React, { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { TrendingUp, Zap, History } from 'lucide-react'
import { gameAPI, parseError, fmtUZS } from '../../api/client'
import { useAuthStore, useGameStore } from '../../store'
import MobileLayout from '../../components/Layout/MobileLayout'

const Particle: React.FC<{ color: string; x: number; delay: number }> = ({ color, x, delay }) => (
  <div className="confetti-particle" style={{ left: x + '%', backgroundColor: color, animationDelay: delay + 's' }} />
)

const getMultiplierClass = (v: number) => {
  if (v < 1.5)  return 'multiplier-white'
  if (v < 2.0)  return 'multiplier-green'
  if (v < 5.0)  return 'multiplier-yellow'
  if (v < 20.0) return 'multiplier-orange'
  if (v < 100)  return 'multiplier-red'
  return 'multiplier-purple'
}

const CONFETTI_COLORS = ['#e63946','#ffd60a','#3a86ff','#06d6a0','#ff6b6b','#b56eff']

const Game: React.FC = () => {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const { phase, displayMultiplier, lastResult, recentBets, isPlacing,
    setPhase, setDisplayMultiplier, setLastResult, addRecentBet, setIsPlacing } = useGameStore()

  const [betAmount, setBetAmount] = useState('1000')
  const [targetX, setTargetX] = useState('2.00')
  const [betError, setBetError] = useState('')
  const [targetError, setTargetError] = useState('')
  const [showConfetti, setShowConfetti] = useState(false)
  const animFrameRef = useRef<number>(0)

  const winChance = (() => {
    const t = parseFloat(targetX)
    if (isNaN(t) || t <= 0) return '—'
    return (1 / t * 99).toFixed(4) + '%'
  })()

  const animateMultiplier = useCallback((crashPoint: number, onDone: () => void) => {
    const duration = 1600
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 2.5)
      const current = 1.0 + (crashPoint - 1.0) * eased
      setDisplayMultiplier(parseFloat(current.toFixed(2)))
      if (progress < 1) animFrameRef.current = requestAnimationFrame(tick)
      else { setDisplayMultiplier(crashPoint); onDone() }
    }
    animFrameRef.current = requestAnimationFrame(tick)
  }, [setDisplayMultiplier])

  const handleBet = async () => {
    setBetError(''); setTargetError('')
    const amount = parseFloat(betAmount)
    const target = parseFloat(targetX)
    if (isNaN(amount) || amount < 1000) { setBetError(t('game.errors.minBet')); return }
    if (isNaN(target) || target < 1.5)  { setTargetError(t('game.errors.minTarget')); return }
    const available = parseFloat(user?.balance || '0') + parseFloat(user?.bonus_balance || '0')
    if (amount > available) { setBetError(t('game.errors.insufficient')); return }

    setIsPlacing(true); setPhase('animating'); setLastResult(null)
    try {
      const res = await gameAPI.placeBet({ amount: betAmount, target_multiplier: parseFloat(targetX).toFixed(2) })
      const { result, bet } = res.data
      if (res.data.balance !== undefined) setUser({ ...user!, balance: res.data.balance, bonus_balance: res.data.bonus_balance })
      addRecentBet({ id: bet.id, crash_point: bet.crash_point, status: bet.status, target_multiplier: bet.target_multiplier, amount: bet.amount, mode: bet.mode })
      animateMultiplier(result.crash_point, () => {
        setLastResult(result); setPhase('result'); setIsPlacing(false)
        if (result.won) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 2000) }
      })
    } catch (err) {
      setPhase('idle'); setIsPlacing(false); setDisplayMultiplier(1.0)
      toast.error((err as any)?.response?.data?.error || t('game.errors.insufficient'))
    }
  }

  const handleReset = () => { setPhase('idle'); setDisplayMultiplier(1.0); setLastResult(null) }
  const canBet = !isPlacing && phase !== 'animating'

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-full pb-2" style={{ background: 'linear-gradient(180deg,#07070f 0%,#0c0c1a 100%)' }}>
        {/* Recent strip */}
        {recentBets.length > 0 && (
          <div className="px-4 py-2">
            <div className="scroll-x gap-1.5">
              {recentBets.slice(0,12).map((b) => (
                <div key={b.id} className={`result-pill ${b.status}`}>{parseFloat(b.crash_point).toFixed(2)}x</div>
              ))}
            </div>
          </div>
        )}

        {/* Multiplier arena */}
        <div className="relative mx-4 my-2 rounded-3xl overflow-hidden flex-1 flex items-center justify-center"
          style={{ background:'linear-gradient(135deg,#0d0d20,#101025,#0a0a18)', border:'1px solid rgba(255,255,255,0.06)', minHeight: 200 }}>
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage:'linear-gradient(rgba(58,134,255,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(58,134,255,0.3) 1px,transparent 1px)', backgroundSize:'32px 32px' }}/>
          {showConfetti && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({length:24}).map((_,i) => (
                <Particle key={i} color={CONFETTI_COLORS[i%6]} x={Math.random()*100} delay={Math.random()*0.4}/>
              ))}
            </div>
          )}
          <div className="relative z-10 flex flex-col items-center py-6 px-4">
            <AnimatePresence mode="wait">
              {phase !== 'result' ? (
                <motion.div key="counter" initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} transition={{duration:0.3}}
                  className={`multiplier-display ${getMultiplierClass(displayMultiplier)} ${phase==='animating'?'animate-glow-pulse':''}`}>
                  {displayMultiplier.toFixed(2)}x
                </motion.div>
              ) : lastResult ? (
                <motion.div key="result" initial={{scale:0.6,opacity:0}} animate={{scale:1,opacity:1}}
                  transition={{type:'spring',stiffness:400,damping:20}} className="flex flex-col items-center gap-2">
                  {lastResult.won ? (
                    <>
                      <div className="text-2xl font-black tracking-wide text-db-green">{t('game.result.won')}</div>
                      <div className="multiplier-display multiplier-green" style={{fontSize:'clamp(2rem,10vw,3.5rem)'}}>
                        +{fmtUZS(parseFloat(lastResult.profit))}
                      </div>
                      <div className="text-sm text-db-text2 mono">{t('game.result.payout')}: {fmtUZS(parseFloat(lastResult.payout))}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-black text-db-red">{t('game.result.lost')}</div>
                      <div className={`multiplier-display ${getMultiplierClass(parseFloat(lastResult.crash_point?.toString()||'1'))}`}>
                        {parseFloat(lastResult.crash_point?.toString()||'1').toFixed(2)}x
                      </div>
                      <div className="text-sm text-db-text2">{t('game.result.crashedAt')}: {parseFloat(lastResult.crash_point?.toString()||'1').toFixed(2)}x</div>
                    </>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
            {phase === 'animating' && (
              <div className="absolute bottom-3 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-db-green animate-pulse"/>
                <span className="text-xs text-db-text2">LIVE</span>
              </div>
            )}
          </div>
        </div>

        {/* Bet controls */}
        <div className="mx-4 mt-2 db-card p-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-1.5 text-xs text-db-text2">
              <Zap size={13} className="text-db-gold"/><span>{t('game.winChance')}</span>
            </div>
            <div className="mono text-sm font-bold text-db-gold">{winChance}</div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Bet Amount */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-db-text2 uppercase tracking-wider">{t('game.betAmount')}</label>
              <div className="input-wrap">
                <input type="number" value={betAmount}
                  onChange={(e) => { setBetAmount(e.target.value); setBetError('') }}
                  disabled={!canBet}
                  className={`db-input mono-input with-suffix ${betError ? 'error' : ''}`}
                  style={{ textAlign: 'right' }}
                  min="1000" step="1000" placeholder="1000"/>
                <span className="input-suffix">UZS</span>
              </div>
              {betError && <p className="text-xs text-db-red">{betError}</p>}
              <div className="flex gap-1">
                {['1000','5000','10000','50000'].map((v) => (
                  <button key={v} className="flex-1 text-xs py-1 rounded-lg bg-db-elevated text-db-text2 hover:text-white hover:bg-white/10 transition-all"
                    onClick={() => setBetAmount(v)} disabled={!canBet}>
                    {parseInt(v)>=1000?(parseInt(v)/1000)+'K':v}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Multiplier */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-db-text2 uppercase tracking-wider">{t('game.targetMultiplier')}</label>
              <div className="input-wrap">
                <input type="number" value={targetX}
                  onChange={(e) => { setTargetX(e.target.value); setTargetError('') }}
                  disabled={!canBet}
                  className={`db-input mono-input with-suffix ${targetError ? 'error' : ''}`}
                  style={{ textAlign: 'right' }}
                  min="1.5" step="0.1" placeholder="2.00"/>
                <span className="input-suffix">×</span>
              </div>
              {targetError && <p className="text-xs text-db-red">{targetError}</p>}
              <div className="flex gap-1">
                {['1.5','2.0','5.0','10.0'].map((v) => (
                  <button key={v} className="flex-1 text-xs py-1 rounded-lg bg-db-elevated text-db-text2 hover:text-white hover:bg-white/10 transition-all"
                    onClick={() => setTargetX(v)} disabled={!canBet}>
                    {v}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main button */}
          {phase === 'result' ? (
            <motion.button className="btn-bet w-full py-4 text-white text-base" onClick={handleReset}
              style={{ background:'linear-gradient(135deg,#3a86ff,#1565c0)' }}
              whileTap={{ scale: 0.97 }}>
              <TrendingUp size={18} className="mr-2"/> New Bet
            </motion.button>
          ) : (
            <motion.button className="btn-bet w-full py-4 text-base" onClick={handleBet} disabled={!canBet}
              whileTap={{ scale: canBet ? 0.97 : 1 }}>
              {isPlacing ? <><div className="spinner mr-2"/>{t('game.betting')}</> : t('game.placeBet')}
            </motion.button>
          )}

          {/* Balance */}
          <div className="flex items-center justify-between mt-3 px-1">
            <span className="text-xs text-db-text2">{t('profile.balance')}</span>
            <span className="text-xs font-bold mono">
              {fmtUZS(parseFloat(user?.balance||'0'))}
              {parseFloat(user?.bonus_balance||'0') > 0 && (
                <span className="text-db-gold ml-2">+{fmtUZS(parseFloat(user?.bonus_balance||'0'),true)} bonus</span>
              )}
            </span>
          </div>
        </div>

        {/* Recent bets list */}
        {recentBets.length > 0 && (
          <div className="mx-4 mt-3 mb-2">
            <div className="text-xs font-semibold text-db-text2 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <History size={12}/>{t('game.recentBets')}
            </div>
            <div className="flex flex-col gap-1.5">
              {recentBets.slice(0,5).map((b) => (
                <div key={b.id} className="flex items-center justify-between px-3 py-2 rounded-xl"
                  style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-2">
                    <span className={`badge-${b.status}`}>{b.status==='won'?t('history.won'):t('history.lost')}</span>
                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">REAL</span>
                    <span className="text-xs text-db-text2 mono">{fmtUZS(parseFloat(b.amount),true)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-db-text2">→ {parseFloat(b.target_multiplier).toFixed(2)}x</span>
                    <span className={`text-xs font-bold mono ${b.status==='won'?'text-db-green':'text-db-red'}`}>
                      {parseFloat(b.crash_point).toFixed(2)}x
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  )
}

export default Game

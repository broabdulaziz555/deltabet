import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, RefreshCw, Activity, TrendingUp, Sliders, Gift } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI, fmtUZS } from '../../api/client'
import { Spinner } from '../../components/ui'

type GameMode = 'practice' | 'standard' | 'balanced'

interface AlgoData {
  house_edge_min: number
  house_edge_max: number
  default_mode: GameMode
  daily_pl: number
  balanced_active_sessions: number
  total_sessions_today: number
  current_edge: number
}

const DEFAULT: AlgoData = {
  house_edge_min: 8,
  house_edge_max: 12,
  default_mode: 'balanced',
  daily_pl: 0,
  balanced_active_sessions: 0,
  total_sessions_today: 0,
  current_edge: 10,
}

const MODE_META: Record<GameMode, { label: string; desc: string; color: string }> = {
  practice: {
    label: 'Practice',
    desc: 'Heavily house-favored. Used for free play.',
    color: 'bg-db-blue/10 text-db-blue border-db-blue/30',
  },
  standard: {
    label: 'Standard',
    desc: 'Fair RNG — no house edge adjustment.',
    color: 'bg-db-green/10 text-db-green border-db-green/30',
  },
  balanced: {
    label: 'Balanced',
    desc: 'Sliding house edge 8–12%, adjusts by session P&L and daily platform P&L.',
    color: 'bg-db-gold/10 text-db-gold border-db-gold/30',
  },
}

const RangeSlider: React.FC<{
  label: string; value: number; min: number; max: number; step?: number
  onChange: (v: number) => void; color?: string
}> = ({ label, value, min, max, step = 0.5, onChange, color = 'db-red' }) => (
  <div>
    <div className="flex justify-between items-center mb-2">
      <label className="text-xs font-semibold text-db-text2 uppercase tracking-wider">{label}</label>
      <span className={`text-lg font-black mono text-${color}`}>{value.toFixed(1)}%</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 rounded-full appearance-none cursor-pointer"
      style={{
        background: `linear-gradient(to right, var(--color-db-red) 0%, var(--color-db-red) ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.08) ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.08) 100%)`,
      }}
    />
    <div className="flex justify-between text-xs text-db-muted mt-1">
      <span>{min}%</span><span>{max}%</span>
    </div>
  </div>
)

const StatTile: React.FC<{ label: string; value: string; color?: string; sub?: string }> = ({ label, value, color = 'text-white', sub }) => (
  <div className="db-card p-4">
    <div className={`text-xl font-black mono ${color}`}>{value}</div>
    <div className="text-xs text-db-text2 mt-0.5">{label}</div>
    {sub && <div className="text-xs text-db-muted mt-0.5">{sub}</div>}
  </div>
)

const AlgoConfig: React.FC = () => {
  const qc = useQueryClient()
  const [edgeMin, setEdgeMin]               = useState(DEFAULT.house_edge_min)
  const [edgeMax, setEdgeMax]               = useState(DEFAULT.house_edge_max)
  const [defMode, setDefMode]               = useState<GameMode>(DEFAULT.default_mode)
  const [dirty, setDirty]                   = useState(false)
  const [welcomeAmount, setWelcomeAmount]   = useState('10000')
  const [welcomeDirty, setWelcomeDirty]     = useState(false)

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-algo'],
    queryFn: async () => {
      try {
        const r = await adminAPI.algoConfig()
        return r.data as AlgoData
      } catch {
        return DEFAULT
      }
    },
    refetchInterval: 30_000,
  })

  const { data: settingsData } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      try { const r = await adminAPI.settings(); return r.data } catch { return {} }
    },
    refetchInterval: 60_000,
  })

  const saveWelcomeMut = useMutation({
    mutationFn: (amount: string) => adminAPI.updateSetting('welcome_bonus_amount', amount),
    onSuccess: () => {
      toast.success('Welcome bonus amount saved')
      setWelcomeDirty(false)
      qc.invalidateQueries({ queryKey: ['admin-settings'] })
    },
    onError: () => toast.error('Failed to save'),
  })

  useEffect(() => {
    if (data) {
      setEdgeMin(data.house_edge_min ?? DEFAULT.house_edge_min)
      setEdgeMax(data.house_edge_max ?? DEFAULT.house_edge_max)
      setDefMode(data.default_mode  ?? DEFAULT.default_mode)
      setDirty(false)
    }
  }, [data])

  useEffect(() => {
    if (settingsData?.welcome_bonus_amount !== undefined) {
      setWelcomeAmount(String(settingsData.welcome_bonus_amount))
      setWelcomeDirty(false)
    }
  }, [settingsData])

  const saveMut = useMutation({
    mutationFn: () => adminAPI.updateAlgoConfig({
      house_edge_min: edgeMin,
      house_edge_max: edgeMax,
      default_mode: defMode,
    }),
    onSuccess: () => {
      toast.success('Algorithm config saved')
      setDirty(false)
      qc.invalidateQueries({ queryKey: ['admin-algo'] })
    },
    onError: () => toast.error('Failed to save config'),
  })

  const handleEdgeMin = (v: number) => {
    setEdgeMin(Math.min(v, edgeMax - 0.5))
    setDirty(true)
  }
  const handleEdgeMax = (v: number) => {
    setEdgeMax(Math.max(v, edgeMin + 0.5))
    setDirty(true)
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner /></div>

  const d = data || DEFAULT
  const dailyPl = d.daily_pl || 0
  const currentEdge = d.current_edge ?? ((edgeMin + edgeMax) / 2)

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">Algorithm Config</h1>
          <p className="text-db-text2 text-sm mt-0.5">Balanced mode house edge & game defaults</p>
        </div>
        <button
          onClick={() => refetch()}
          className={`text-db-text2 hover:text-white p-2 transition-all ${isFetching ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Live stats */}
      <div>
        <h2 className="text-xs font-bold text-db-text2 uppercase tracking-widest mb-3">
          <Activity size={12} className="inline mr-1.5" />Live Stats
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile
            label="Daily P&L (platform)"
            value={fmtUZS(dailyPl, true)}
            color={dailyPl >= 0 ? 'text-db-green' : 'text-db-red'}
            sub={dailyPl >= 0 ? 'House is up' : 'House is down'}
          />
          <StatTile
            label="Current Edge (balanced)"
            value={`${currentEdge.toFixed(1)}%`}
            color="text-db-gold"
            sub="Adjusts dynamically"
          />
          <StatTile
            label="Active Balanced Sessions"
            value={(d.balanced_active_sessions || 0).toString()}
            color="text-db-blue"
          />
          <StatTile
            label="Total Sessions Today"
            value={(d.total_sessions_today || 0).toString()}
          />
        </div>
      </div>

      {/* Balanced edge config */}
      <div className="db-card p-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Sliders size={18} className="text-db-gold" />
          <h2 className="font-bold">Balanced Mode — House Edge Range</h2>
        </div>

        <div className="bg-db-elevated rounded-xl p-3 text-xs text-db-text2 leading-relaxed">
          The balanced algorithm slides the house edge between <b className="text-white">Min</b> and <b className="text-white">Max</b> based on
          the player's session P&L and the platform's daily P&L. A losing platform day pushes the edge toward Max; a winning day pushes it toward Min.
        </div>

        <div className="space-y-5">
          <RangeSlider
            label="Minimum House Edge"
            value={edgeMin}
            min={1}
            max={25}
            onChange={handleEdgeMin}
          />

          {/* Visual range indicator */}
          <div className="flex items-center gap-3 text-xs text-db-muted">
            <span className="mono font-bold text-white">{edgeMin.toFixed(1)}%</span>
            <div className="flex-1 h-3 bg-db-elevated rounded-full overflow-hidden relative">
              <div
                className="absolute h-full bg-gradient-to-r from-db-green to-db-red rounded-full"
                style={{
                  left:  `${((edgeMin - 1) / 24) * 100}%`,
                  right: `${100 - ((edgeMax - 1) / 24) * 100}%`,
                }}
              />
            </div>
            <span className="mono font-bold text-white">{edgeMax.toFixed(1)}%</span>
          </div>

          <RangeSlider
            label="Maximum House Edge"
            value={edgeMax}
            min={1}
            max={25}
            onChange={handleEdgeMax}
          />
        </div>
      </div>

      {/* Default game mode */}
      <div className="db-card p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-db-blue" />
          Default Game Mode (for new real-money play)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(Object.keys(MODE_META) as GameMode[]).map((m) => {
            const meta = MODE_META[m]
            const active = defMode === m
            return (
              <button
                key={m}
                onClick={() => { setDefMode(m); setDirty(true) }}
                className={`p-4 rounded-xl border text-left transition-all ${active ? meta.color : 'bg-db-elevated border-white/5 text-db-text2 hover:border-white/15'}`}
              >
                <div className="font-bold mb-1">{meta.label}</div>
                <div className="text-xs leading-relaxed opacity-80">{meta.desc}</div>
                {active && <div className="text-xs font-black mt-2 uppercase tracking-wider">✓ Selected</div>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Welcome Bonus Config */}
      <div className="db-card p-6 space-y-4">
        <h2 className="font-bold flex items-center gap-2">
          <Gift size={18} className="text-db-gold" />
          Welcome No-Deposit Bonus
        </h2>
        <div className="bg-db-elevated rounded-xl p-3 text-xs text-db-text2 leading-relaxed">
          Credited automatically when a user completes registration. Goes to <b className="text-white">bonus balance</b>, not real balance.
          Wagering requirement = <b className="text-white">3× bonus amount</b>. Set to 0 to disable.
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs font-semibold text-db-text2 uppercase tracking-wider block mb-2">
              Bonus Amount (UZS)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              className="db-input text-lg font-bold mono"
              value={welcomeAmount}
              onChange={(e) => { setWelcomeAmount(e.target.value); setWelcomeDirty(true) }}
            />
          </div>
          <button
            onClick={() => saveWelcomeMut.mutate(welcomeAmount)}
            disabled={saveWelcomeMut.isPending || !welcomeDirty}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-db-gold text-black font-bold text-sm transition-all hover:brightness-110 disabled:opacity-40"
          >
            {saveWelcomeMut.isPending ? <div className="spinner" /> : <><Save size={15} />Save</>}
          </button>
        </div>
        {parseFloat(welcomeAmount) > 0 && (
          <div className="text-xs text-db-muted">
            Wagering requirement per new user:{' '}
            <span className="text-white font-semibold">
              {(parseFloat(welcomeAmount) * 3).toLocaleString('ru-RU')} UZS
            </span>
          </div>
        )}
        {parseFloat(welcomeAmount) === 0 && (
          <div className="text-xs text-db-red font-semibold">Welcome bonus is disabled (amount = 0)</div>
        )}
      </div>

      {/* Save bar */}
      <div className={`sticky bottom-4 transition-all ${dirty ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="db-card p-4 flex items-center justify-between border border-db-gold/25">
          <p className="text-sm text-db-text2">Unsaved changes</p>
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-db-gold text-black font-bold text-sm transition-all hover:brightness-110 disabled:opacity-50"
          >
            {saveMut.isPending ? <div className="spinner" /> : <><Save size={15} />Save Config</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AlgoConfig

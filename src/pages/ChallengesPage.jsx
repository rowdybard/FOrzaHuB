import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, Flag } from 'lucide-react'
import Seo from '../components/Seo'
import PageHero from '../components/common/PageHero'
import ChallengeCard from '../components/common/ChallengeCard'
import EmptyState from '../components/common/EmptyState'
import Loading from '../components/common/Loading'
import Button from '../components/ui/Button'
import { getChallengesWithClubs } from '../data/api'
import { useAsync } from '../hooks/useAsync'
import { TYPE_LIST } from '../lib/challengeTypes'
import { cn, hexToRgba } from '../lib/utils'

const STATUSES = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'reviewing', label: 'Reviewing' },
  { id: 'closed', label: 'Closed' },
]

export default function ChallengesPage() {
  const { data: challenges, loading } = useAsync(() => getChallengesWithClubs(), [])
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const defaultedRef = useRef(false)

  useEffect(() => {
    if (defaultedRef.current || loading || !challenges) return
    defaultedRef.current = true
    if (challenges.some((c) => c.status === 'live')) {
      setStatus('live')
    } else if (challenges.some((c) => c.status === 'upcoming')) {
      setStatus('upcoming')
    }
  }, [challenges, loading])

  const filtered = useMemo(() => {
    return (challenges || []).filter((c) => {
      if (type !== 'all' && c.typeId !== type) return false
      if (status !== 'all' && c.status !== status) return false
      if (q) {
        const hay = `${c.title} ${c.location} ${c.restriction} ${c.region}`.toLowerCase()
        if (!hay.includes(q.toLowerCase())) return false
      }
      return true
    })
  }, [challenges, type, status, q])

  return (
    <div>
      <Seo title="Forza Horizon Tournaments & Challenges" description="Browse live and upcoming Forza Horizon tournaments. Time trials, drift battles, drag races, photo contests, and build battles with verified proof and community prizes." path="/challenges" />
      <PageHero
        eyebrow="Challenges"
        title="Club events"
        description="Open, upcoming, and finished challenges."
      />

      <div className="container-page py-8">
        {/* Toolbar */}
        <div className="rounded-2xl border border-white/[0.07] bg-ink-900/50 p-4 backdrop-blur-sm">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search challenges, tracks or car classes…"
                className="w-full rounded-xl border border-white/[0.08] bg-ink-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-brand-500/50 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                <TypeChip active={type === 'all'} onClick={() => setType('all')} label="All formats" />
                {TYPE_LIST.map((t) => (
                  <TypeChip
                    key={t.id}
                    active={type === t.id}
                    onClick={() => setType(t.id)}
                    label={t.label}
                    icon={t.icon}
                    accent={t.accent}
                  />
                ))}
              </div>

              <div className="no-scrollbar -mx-1 flex shrink-0 gap-1.5 overflow-x-auto px-1 pb-1">
                {STATUSES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStatus(s.id)}
                    className={cn(
                      'shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                      status === s.id
                        ? 'bg-white/[0.08] text-white'
                        : 'text-zinc-400 hover:text-white',
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-zinc-400">
            <span className="font-semibold text-white">{filtered.length}</span>{' '}
            {filtered.length === 1 ? 'challenge' : 'challenges'}
          </p>
        </div>

        {loading ? (
          <Loading label="Loading challenges…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={Flag}
            title={(challenges || []).length === 0 ? 'No challenges yet' : 'No challenges match your filters'}
            description={
              (challenges || []).length === 0
                ? 'No challenges have been created yet.'
                : 'Clear the search or change the filters.'
            }
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setType('all')
                  setStatus('all')
                  setQ('')
                }}
              >
                Reset filters
              </Button>
            }
          />
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <ChallengeCard key={c.id} challenge={c} club={c.club} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TypeChip({ active, onClick, label, icon: Icon, accent }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded border px-3 py-1.5 text-sm font-medium transition-all',
        active
          ? 'text-white'
          : 'border-white/[0.06] bg-white/[0.01] text-zinc-400 hover:border-white/20 hover:text-white',
      )}
      style={
        active
          ? {
              color: accent || '#ff6b2c',
              backgroundColor: hexToRgba(accent || '#ff6b2c', 0.12),
              borderColor: hexToRgba(accent || '#ff6b2c', 0.3),
            }
          : undefined
      }
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  )
}

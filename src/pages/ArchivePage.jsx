import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, Archive, Trophy, Users, CalendarDays, ArrowRight } from 'lucide-react'
import Seo from '../components/Seo'
import PageHero from '../components/common/PageHero'
import PodiumSpotlight from '../components/common/PodiumSpotlight'
import RecordTile from '../components/common/RecordTile'
import EmptyState from '../components/common/EmptyState'
import Button from '../components/ui/Button'
import ClubMark from '../components/ui/ClubMark'
import Loading from '../components/common/Loading'
import { getClosedChallenges, getClubs } from '../data/api'
import { useAsync } from '../hooks/useAsync'
import { TYPE_LIST, getType } from '../lib/challengeTypes'
import { cn, formatNumber, formatDate } from '../lib/utils'

async function loadArchive() {
  const [events, clubs] = await Promise.all([getClosedChallenges(), getClubs()])
  const byId = new Map(clubs.map((c) => [c.id, c]))
  return events.map((e) => ({ ...e, club: byId.get(e.clubId) || null }))
}

/** Best result per format across every challenge (closed + active). */
function computeRecords(events) {
  return TYPE_LIST.map((t) => {
    let best = null
    events.forEach((c) => {
      if (c.typeId !== t.id) return
      const list = t.gallery ? c.gallery : c.entries
      const top = list?.[0]
      if (!top) return
      const metric = t.gallery ? top.votes : top.value
      const isBetter = !best || (t.gallery || t.sort === 'desc' ? metric > best.metric : metric < best.metric)
      if (isBetter) {
        best = { metric, value: top.value, votes: top.votes, user: top.user, challengeTitle: c.title, slug: c.slug }
      }
    })
    return { typeId: t.id, record: best }
  })
}

export default function ArchivePage() {
  const { data, loading } = useAsync(() => loadArchive(), [])
  const events = data || []
  const records = useMemo(() => computeRecords(events), [events])
  const seasons = useMemo(() => Array.from(new Set(events.map((c) => c.season).filter(Boolean))), [events])

  const [season, setSeason] = useState('all')
  const [type, setType] = useState('all')
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    return events.filter((c) => {
      if (season !== 'all' && c.season !== season) return false
      if (type !== 'all' && c.typeId !== type) return false
      if (q) {
        const hay = `${c.title} ${c.location} ${c.restriction} ${c.region}`.toLowerCase()
        if (!hay.includes(q.toLowerCase())) return false
      }
      return true
    })
  }, [events, season, type, q])

  const grouped = useMemo(() => {
    const order = season === 'all' ? seasons : [season]
    return order
      .map((s) => ({ season: s, items: filtered.filter((c) => c.season === s) }))
      .filter((g) => g.items.length)
  }, [filtered, seasons, season])

  return (
    <div>
      <Seo title="Tournament Results Archive" description="Browse completed Forza Horizon tournaments with podium finishes, records, and verified results. See past champions and leaderboard standings." path="/archive" />
      <PageHero
        eyebrow="Archive"
        title="Results archive"
        description="Finished challenges, podiums, and records."
      />

      <div className="container-page py-8">
        {/* Record wall */}
        <section>
          <div className="mb-5 flex items-center gap-2.5">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold">Record wall</h2>
            <span className="text-sm text-zinc-500">All-time bests per format</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {records.map((r) => (
              <RecordTile key={r.typeId} typeId={r.typeId} record={r.record} />
            ))}
          </div>
        </section>

        {/* Filters */}
        <section className="mt-12">
          <div className="card p-4">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search finished events…"
                  className="w-full rounded-xl border border-white/[0.08] bg-ink-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-brand-500/50 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  <Chip active={type === 'all'} onClick={() => setType('all')} label="All formats" />
                  {TYPE_LIST.map((t) => (
                    <Chip
                      key={t.id}
                      active={type === t.id}
                      onClick={() => setType(t.id)}
                      label={t.label}
                      icon={t.icon}
                    />
                  ))}
                </div>

                <div className="flex shrink-0 gap-1.5 rounded-xl border border-white/[0.06] bg-ink-900/60 p-1">
                  <SeasonBtn active={season === 'all'} onClick={() => setSeason('all')} label="All seasons" />
                  {seasons.map((s) => (
                    <SeasonBtn key={s} active={season === s} onClick={() => setSeason(s)} label={s} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        {loading ? (
          <Loading label="Loading archive…" />
        ) : grouped.length === 0 ? (
          events.length === 0 ? (
            <EmptyState
              className="mt-8"
              icon={Archive}
              title="No finished events yet"
              description="Finished challenges will appear here."
            />
          ) : (
          <EmptyState
            className="mt-8"
            icon={Archive}
            title="No archived events match"
            description="Clear the search or change the filters."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSeason('all')
                  setType('all')
                  setQ('')
                }}
              >
                Reset filters
              </Button>
            }
          />
          )
        ) : (
          <div className="mt-10 space-y-12">
            {grouped.map((group) => (
              <section key={group.season}>
                <div className="mb-5 flex items-center gap-3">
                  <h2 className="text-xl font-bold">{group.season}</h2>
                  <span className="rounded border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-xs text-zinc-400">
                    {group.items.length} {group.items.length === 1 ? 'event' : 'events'}
                  </span>
                </div>
                <div className="space-y-5">
                  {group.items.map((c) => (
                    <ArchiveEventCard key={c.id} challenge={c} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ArchiveEventCard({ challenge }) {
  const club = challenge.club
  const t = getType(challenge.typeId)
  const to = `/c/${challenge.slug}`

  return (
    <article className="rounded-xl border border-white/[0.06] bg-ink-850/50 overflow-hidden">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span>{t.label}</span>
            {club && (
              <>
                <span className="text-zinc-600">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <ClubMark club={club} size={16} />
                  {club.name}
                </span>
              </>
            )}
          </div>
          <h3 className="mt-2 text-base font-bold leading-snug">
            <Link to={to} className="transition-colors hover:text-brand-300">
              {challenge.title}
            </Link>
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3" />
              {formatDate(challenge.endDate)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              {formatNumber(challenge.participants)} racers
            </span>
            <span>{challenge.restriction}</span>
          </div>
        </div>
        <Button to={to} variant="secondary" size="sm" className="shrink-0">
          View results
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="border-t border-white/[0.05] p-4 pt-3">
        <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          {t.gallery ? 'Top entries' : 'Podium'}
        </div>
        <PodiumSpotlight challenge={challenge} />
      </div>
    </article>
  )
}

function Chip({ active, onClick, label, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded border px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-brand-500/30 bg-brand-500/10 text-brand-300'
          : 'border-white/[0.1] bg-white/[0.04] text-zinc-400 hover:border-white/15 hover:text-white',
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  )
}

function SeasonBtn({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
        active ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:text-white',
      )}
    >
      {label}
    </button>
  )
}

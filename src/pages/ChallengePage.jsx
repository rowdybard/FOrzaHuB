import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ChevronRight,
  ShieldCheck,
  Trophy,
  Users,
  MapPin,
  Car,
  CalendarDays,
  Gift,
  Upload,
  Link2,
  Check,
  MessagesSquare,
  Flag,
  Hourglass,
  Vote,
  Lock,
  ClipboardCheck,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Cover from '../components/ui/Cover'
import ClubMark from '../components/ui/ClubMark'
import { TypeBadge, StatusBadge, Badge } from '../components/ui/Badge'
import Countdown from '../components/common/Countdown'
import Leaderboard from '../components/common/Leaderboard'
import Gallery from '../components/common/Gallery'
import ChallengeCard from '../components/common/ChallengeCard'
import EmptyState from '../components/common/EmptyState'
import SeriesStandings from '../components/common/SeriesStandings'
import NotFound from './NotFound'
import Loading from '../components/common/Loading'
import { getChallengeBySlug, getPrerequisite, getChallengesByClub, getSeriesStandings } from '../data/api'
import { useAsync } from '../hooks/useAsync'
import { getType } from '../lib/challengeTypes'
import { formatDate, formatNumber, hexToRgba } from '../lib/utils'

async function loadChallenge(slug) {
  const challenge = await getChallengeBySlug(slug)
  if (!challenge) return { challenge: null }
  const [prereq, clubChallenges, seriesStandings] = await Promise.all([
    getPrerequisite(challenge),
    getChallengesByClub(challenge.clubId),
    challenge.sponsored ? getSeriesStandings(challenge.clubId) : Promise.resolve([]),
  ])
  const more = clubChallenges.filter((c) => c.id !== challenge.id)
  return { challenge, prereq, more, seriesStandings }
}

export default function ChallengePage() {
  const { slug } = useParams()
  const { data, loading } = useAsync(() => loadChallenge(slug), [slug])

  if (loading) return <Loading label="Loading challenge…" className="min-h-[60vh]" />
  if (!data?.challenge) return <NotFound />

  const challenge = data.challenge
  const club = challenge.club
  const t = getType(challenge.typeId)
  const isLive = challenge.status === 'live'
  const prereq = data.prereq
  const more = data.more || []
  const seriesStandings = data.seriesStandings || []

  return (
    <>
      <ChallengeHeader challenge={challenge} club={club} t={t} />
      <FactStrip challenge={challenge} t={t} />

      <div className="container-page mt-8 grid items-start gap-8 lg:grid-cols-[1fr_336px]">
        <div className="space-y-6">
          {prereq && <PrereqBanner prereq={prereq} />}
          <Standings challenge={challenge} t={t} />
          <Rules challenge={challenge} t={t} />
          {challenge.sponsored && seriesStandings.length > 0 && (
            <SeriesStandingsSection standings={seriesStandings} />
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20">
          <EventDetails challenge={challenge} club={club} t={t} isLive={isLive} prereq={prereq} />
          {challenge.sponsored && <SponsorMiniCard challenge={challenge} />}
          <OrganizerCard club={club} />
        </aside>
      </div>

      {more.length > 0 && (
        <section className="container-page mt-20">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-xl font-bold">More from {club?.name}</h2>
            <Link
              to={`/club/${club?.slug}`}
              className="text-sm text-brand-300 hover:text-brand-200"
            >
              View club
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {more.slice(0, 3).map((c) => (
              <ChallengeCard key={c.id} challenge={c} club={club} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

/* --------------------------------- Header --------------------------------- */

function ChallengeHeader({ challenge, club, t }) {
  return (
    <section className="relative">
      <Cover typeId={challenge.typeId} className="min-h-[320px] sm:min-h-[380px]" iconSize="h-80 w-80">
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/50 to-transparent" />
        <div className="container-page relative flex min-h-[320px] flex-col justify-end pb-8 pt-24 sm:min-h-[380px]">
          <nav className="mb-4 flex items-center gap-1.5 text-sm text-zinc-400">
            <Link to="/challenges" className="hover:text-white">Challenges</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to={`/club/${club?.slug}`} className="hover:text-white">{club?.name}</Link>
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge typeId={challenge.typeId} />
            <StatusBadge status={challenge.status} />
          </div>

          <h1 className="mt-4 max-w-3xl text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {challenge.title}
          </h1>

          {challenge.description && (
            <p className="mt-3 max-w-2xl text-balance text-base leading-relaxed text-zinc-300 sm:text-lg">
              {challenge.description}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-300">
            <Link to={`/club/${club?.slug}`} className="flex items-center gap-2 hover:text-white">
              <ClubMark club={club} size={24} />
              <span className="font-medium">{club?.name}</span>
              {club?.verified && <ShieldCheck className="h-4 w-4 text-brand-400" />}
            </Link>
            <span className="inline-flex items-center gap-1.5 text-zinc-400">
              <Users className="h-4 w-4 text-zinc-500" />
              {formatNumber(challenge.participants)} racers
            </span>
          </div>
        </div>
      </Cover>
    </section>
  )
}

/* ------------------------------- Fact Strip ------------------------------- */

function FactChip({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
        style={{
          color: accent,
          backgroundColor: hexToRgba(accent, 0.12),
          border: `1px solid ${hexToRgba(accent, 0.2)}`,
        }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</div>
        <div className="truncate text-sm font-medium text-white">{value}</div>
      </div>
    </div>
  )
}

function FactStrip({ challenge, t }) {
  return (
    <div className="border-b border-white/[0.06] bg-ink-900/40">
      <div className="container-page flex flex-wrap items-center gap-x-8 gap-y-4 py-4">
        <FactChip icon={Flag} label="Format" value={t.label} accent={t.accent} />
        <FactChip icon={Car} label="Class" value={challenge.restriction || 'Open'} accent={t.accent} />
        <FactChip icon={MapPin} label="Track" value={challenge.location || '—'} accent={t.accent} />
        <FactChip icon={CalendarDays} label="Window" value={`${formatDate(challenge.startDate, { month: 'short', day: 'numeric' })} – ${formatDate(challenge.endDate, { month: 'short', day: 'numeric' })}`} accent={t.accent} />
        {challenge.prize && (
          <FactChip icon={Gift} label="Prize" value={challenge.prize} accent="#fbbf24" />
        )}
      </div>
    </div>
  )
}

/* -------------------------------- Standings ------------------------------- */

function Standings({ challenge, t }) {
  const count = t.gallery ? challenge.gallery?.length || 0 : challenge.entries?.length || 0
  const hasEntries = count > 0

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-bold">{t.gallery ? 'Entries' : 'Standings'}</h2>
          {count > 0 && <Badge tone="neutral">{formatNumber(count)} {t.gallery ? 'entries' : 'racers'}</Badge>}
        </div>
        {hasEntries && (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Proof verified
          </span>
        )}
      </div>

      {!hasEntries ? (
        <EmptyState
          icon={t.gallery ? Vote : Flag}
          title={challenge.status === 'upcoming' ? 'Event hasn\'t started yet' : 'No entries yet'}
          description={
            challenge.status === 'upcoming'
              ? 'Submissions open when the challenge goes live. Get your car dialled in.'
              : 'Be the first to put a result on the board.'
          }
        />
      ) : t.gallery ? (
        <Gallery items={challenge.gallery} typeId={challenge.typeId} />
      ) : (
        <Leaderboard
          entries={challenge.entries}
          typeId={challenge.typeId}
          caption={`Top ${challenge.entries.length} of ${formatNumber(challenge.submissionCount)} submissions`}
        />
      )}
    </section>
  )
}

/* ---------------------------------- Rules --------------------------------- */

function Rules({ challenge, t }) {
  const Icon = t.icon
  return (
    <section className="card p-6">
      <div className="flex items-center gap-2.5">
        <span
          className="grid h-7 w-7 place-items-center rounded-lg"
          style={{
            color: t.accent,
            backgroundColor: hexToRgba(t.accent, 0.12),
            border: `1px solid ${hexToRgba(t.accent, 0.2)}`,
          }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-lg font-bold">Rules & format</h2>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {challenge.rules.map((r, i) => (
          <div key={i} className="flex items-start gap-2.5 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3.5 py-3">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <span className="text-sm leading-relaxed text-zinc-300">{r}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------ Event details ----------------------------- */

function PrereqBanner({ prereq }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] p-4">
      <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
      <div className="min-w-0">
        <div className="text-sm font-semibold text-amber-200">Qualifier required</div>
        <p className="mt-0.5 text-sm text-amber-200/70">
          Complete the sub-challenge first, then you can submit here.
        </p>
        <Link
          to={`/c/${prereq.slug}`}
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-amber-300 hover:text-amber-200"
        >
          {prereq.title}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}

function EventDetails({ challenge, club, t, isLive, prereq }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-white/[0.06] p-5">
        {challenge.status === 'live' && (
          <>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Closes in
            </div>
            <Countdown to={challenge.endDate} variant="blocks" />
          </>
        )}
        {challenge.status === 'upcoming' && (
          <>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Opens in
            </div>
            <Countdown to={challenge.startDate} variant="blocks" />
          </>
        )}
        {challenge.status === 'reviewing' && (
          <div className="flex items-center gap-3 text-amber-300">
            <Hourglass className="h-5 w-5" />
            <div>
              <div className="font-semibold">Verifying results</div>
              <div className="text-xs text-amber-300/70">Stewards are checking the top runs</div>
            </div>
          </div>
        )}
        {challenge.status === 'closed' && (
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-yellow-500 text-ink-950">
              <Trophy className="h-5 w-5" />
            </span>
            <div>
              <div className="text-xs text-zinc-500">Winner</div>
              <div className="font-semibold text-white">{challenge.winner?.tag}</div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 p-5">
        {isLive ? (
          prereq ? (
            <>
              <Button to={`/submit/${challenge.slug}`} size="lg" className="w-full">
                <Upload className="h-4 w-4" />
                {t.gallery ? 'Submit your entry' : 'Submit your score'}
              </Button>
              <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-500">
                <Lock className="h-3 w-3" />
                Qualifier submission required first
              </div>
            </>
          ) : (
            <Button to={`/submit/${challenge.slug}`} size="lg" className="w-full">
              <Upload className="h-4 w-4" />
              {t.gallery ? 'Submit your entry' : 'Submit your score'}
            </Button>
          )
        ) : challenge.status === 'upcoming' ? (
          <Button size="lg" variant="secondary" className="w-full" disabled>
            Submissions open soon
          </Button>
        ) : (
          <Button size="lg" variant="secondary" className="w-full" disabled>
            Submissions closed
          </Button>
        )}
        <ShareRow />
      </div>
    </div>
  )
}

function ShareRow() {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    try {
      navigator.clipboard?.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }
  return (
    <div className="grid grid-cols-3 gap-2">
      <button
        onClick={copy}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-2 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Link2 className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
      <a
        href="https://discord.gg/GJw3XRuCXr"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-2 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
      >
        <MessagesSquare className="h-3.5 w-3.5" />
        Discord
      </a>
    </div>
  )
}

function SponsorMiniCard({ challenge }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">Sponsored</div>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Presented by</span>
          <span className="font-medium text-white">{challenge.sponsor || 'a community partner'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Prize</span>
          <span className="font-medium text-white">{challenge.prize || 'Community prize'}</span>
        </div>
      </div>
      <p className="mt-3 text-xs text-zinc-500">Free to enter. Winner selected by challenge rules.</p>
    </div>
  )
}

function OrganizerCard({ club }) {
  if (!club) return null
  return (
    <div className="card p-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Organised by</div>
      <Link to={`/club/${club.slug}`} className="mt-3 flex items-center gap-3 group">
        <ClubMark club={club} size={44} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-semibold text-white group-hover:text-brand-300">
              {club.name}
            </span>
            {club.verified && <ShieldCheck className="h-4 w-4 shrink-0 text-brand-400" />}
          </div>
          <div className="text-xs text-zinc-500">{formatNumber(club.members)} members · {club.region}</div>
        </div>
      </Link>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{club.tagline}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button to={`/club/${club.slug}`} variant="secondary" size="sm">
          View club
        </Button>
        <Button href="https://discord.gg/GJw3XRuCXr" variant="ghost" size="sm">
          <MessagesSquare className="h-4 w-4" />
          Discord
        </Button>
      </div>
    </div>
  )
}

function SeriesStandingsSection({ standings }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2.5">
        <Trophy className="h-5 w-5 text-amber-400" />
        <h2 className="text-xl font-bold">Series Standings</h2>
      </div>
      <p className="mb-4 text-sm text-zinc-400">
        Points awarded per event: 1st = 50, 2nd = 49, down to 1 point for 50th place.
      </p>
      <SeriesStandings standings={standings} />
    </section>
  )
}

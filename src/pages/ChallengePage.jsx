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
  ListChecks,
  Flag,
  Hourglass,
  Vote,
  Lock,
  ClipboardCheck,
  Sparkles,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Cover from '../components/ui/Cover'
import ClubMark from '../components/ui/ClubMark'
import Avatar from '../components/ui/Avatar'
import { TypeBadge, StatusBadge, Badge } from '../components/ui/Badge'
import Countdown from '../components/common/Countdown'
import Leaderboard from '../components/common/Leaderboard'
import Gallery from '../components/common/Gallery'
import ChallengeCard from '../components/common/ChallengeCard'
import EmptyState from '../components/common/EmptyState'
import NotFound from './NotFound'
import Loading from '../components/common/Loading'
import { getChallengeBySlug, getPrerequisite, getChallengesByClub } from '../data/api'
import { useAsync } from '../hooks/useAsync'
import { getType } from '../lib/challengeTypes'
import { formatDate, formatNumber } from '../lib/utils'

async function loadChallenge(slug) {
  const challenge = await getChallengeBySlug(slug)
  if (!challenge) return { challenge: null }
  const [prereq, clubChallenges] = await Promise.all([
    getPrerequisite(challenge),
    getChallengesByClub(challenge.clubId),
  ])
  const more = clubChallenges.filter((c) => c.id !== challenge.id)
  return { challenge, prereq, more }
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

  return (
    <>
      <ChallengeHeader challenge={challenge} club={club} t={t} />

      <div className="container-page mt-8 grid items-start gap-8 lg:grid-cols-[1fr_336px]">
        <div className="space-y-8">
          {prereq && <PrereqBanner prereq={prereq} />}
          <Standings challenge={challenge} t={t} />
          <Rules challenge={challenge} />
          <About challenge={challenge} />
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20">
          <EventDetails challenge={challenge} club={club} t={t} isLive={isLive} prereq={prereq} />
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
      <Cover typeId={challenge.typeId} className="min-h-[300px] sm:min-h-[340px]" iconSize="h-72 w-72">
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
        <div className="container-page relative flex min-h-[300px] flex-col justify-end pb-8 pt-24 sm:min-h-[340px]">
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

          {challenge.sponsored && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm font-semibold text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              Sponsored by {challenge.sponsor || 'a community partner'}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-300">
            <Link to={`/club/${club?.slug}`} className="flex items-center gap-2 hover:text-white">
              <ClubMark club={club} size={26} />
              <span className="font-medium">{club?.name}</span>
              {club?.verified && <ShieldCheck className="h-4 w-4 text-brand-400" />}
            </Link>
            <span className="text-zinc-600">·</span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-zinc-500" />
              {challenge.location}
            </span>
            <span className="text-zinc-600">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4 text-zinc-500" />
              {formatNumber(challenge.participants)} racers
            </span>
          </div>
        </div>
      </Cover>
    </section>
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
          <Badge tone="neutral">{formatNumber(count)} {t.gallery ? 'entries' : 'racers'}</Badge>
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
          title={challenge.status === 'upcoming' ? 'This event hasn’t started yet' : 'No entries yet'}
          description={
            challenge.status === 'upcoming'
              ? 'Submissions open when the challenge goes live. Set a reminder and get your car dialled in.'
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

function Rules({ challenge }) {
  return (
    <section className="card p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <ListChecks className="h-5 w-5 text-brand-400" />
        Rules & format
      </h2>
      <ul className="mt-4 space-y-3">
        {challenge.rules.map((r, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/[0.06] font-num text-[11px] font-semibold text-zinc-400">
              {i + 1}
            </span>
            <span className="leading-relaxed">{r}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function About({ challenge }) {
  return (
    <section className="card p-6">
      <h2 className="text-lg font-bold">About this challenge</h2>
      <p className="mt-3 leading-relaxed text-zinc-400">{challenge.description}</p>
    </section>
  )
}

/* ------------------------------ Event details ----------------------------- */

function FactRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <span className="inline-flex items-center gap-2 text-sm text-zinc-400">
        <Icon className="h-4 w-4 text-zinc-500" />
        {label}
      </span>
      <span className="text-right text-sm font-medium text-white">{children}</span>
    </div>
  )
}

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

      <div className="divide-y divide-white/[0.05] px-5">
        <FactRow icon={Flag} label="Format">{t.label}</FactRow>
        <FactRow icon={Car} label="Restriction">{challenge.restriction}</FactRow>
        <FactRow icon={MapPin} label="Location">{challenge.location}</FactRow>
        <FactRow icon={CalendarDays} label="Window">
          {formatDate(challenge.startDate, { month: 'short', day: 'numeric' })} –{' '}
          {formatDate(challenge.endDate, { month: 'short', day: 'numeric' })}
        </FactRow>
        <FactRow icon={Gift} label="Prize">{challenge.prize}</FactRow>
      </div>

      <div className="space-y-3 border-t border-white/[0.06] p-5">
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

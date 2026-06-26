import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Trophy,
  Users,
  Flag,
  ShieldCheck,
  Clock,
  CheckCircle2,
  PlusCircle,
  Gift,
  Calendar,
  Flame,
  Medal,
  BookOpen,
} from 'lucide-react'
import Button from '../components/ui/Button'
import { TypeBadge, StatusBadge } from '../components/ui/Badge'
import SectionHeading from '../components/ui/SectionHeading'
import Countdown from '../components/common/Countdown'
import {
  getClubs,
  getChallengesWithClubs,
  getSiteStats,
} from '../data/api'
import { useAsync } from '../hooks/useAsync'
import { getType } from '../lib/challengeTypes'
import { formatNumber, hexToRgba, formatDate } from '../lib/utils'
import Seo from '../components/Seo'

export default function BetaSeriesPage() {
  const { data } = useAsync(
    () => Promise.all([getClubs(), getChallengesWithClubs(), getSiteStats()]),
    [],
  )
  const clubs = data?.[0] || []
  const allChallenges = data?.[1] || []
  const stats = data?.[2] || { clubs: 0, challenges: 0, submissions: 0, racers: 0, isLaunch: true }

  const betaEvents = allChallenges
    .filter((c) => c.season === 'beta-1')
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))

  const featuredEvent = betaEvents[0] || null
  const eventSchedule = betaEvents
  const eventClub = featuredEvent?.club || clubs[0] || null
  const sponsors = eventClub
    ? [
        { id: eventClub.id, name: eventClub.name, tier: 'organizer', blurb: eventClub.tagline || 'Community-run event platform' },
      ]
    : []

  return (
    <>
      <Seo
        title="Beta Race Series"
        description="7 events. 1 week. Most points wins the $50 Series Champion Reward. Free to enter — join a club and compete in the GripCafe Beta Race Series."
        path="/beta-series"
      />
      {featuredEvent ? (
        <>
          <EventHero event={featuredEvent} stats={stats} />
          {sponsors.length > 0 && <SponsorBar sponsors={sponsors} />}
          <BetaSeasonInfo event={featuredEvent} />
          <ScheduleSection schedule={eventSchedule} event={featuredEvent} />
          <LeaderboardPreview />
          <EventCTA event={featuredEvent} />
        </>
      ) : (
        <div className="container-page py-24 text-center">
          <Trophy className="mx-auto h-12 w-12 text-zinc-600" />
          <h1 className="mt-4 text-2xl font-bold text-white">Beta Race Series</h1>
          <p className="mt-2 text-zinc-400">No beta series events are scheduled yet. Check back soon.</p>
          <Button to="/" className="mt-6" variant="outline">
            Back home
          </Button>
        </div>
      )}
    </>
  )
}

/* ------------------------------- Event Hero ------------------------------- */

function EventHero({ event, stats }) {
  const statusLabel = event.status === 'live' ? 'Live Now' : event.status === 'upcoming' ? 'Upcoming' : event.status === 'closed' ? 'Completed' : 'Reviewing'
  const statusCls = event.status === 'live'
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    : event.status === 'upcoming'
    ? 'border-sky-500/30 bg-sky-500/10 text-sky-300'
    : 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300'
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30 mask-fade-b" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink-950/40 to-ink-950" />

      <div className="container-page relative py-16 lg:py-24">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/[0.08] bg-ink-900/60 p-6 text-center backdrop-blur-md sm:p-10 lg:p-12">
          <h1 className="animate-fade-up text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl [animation-delay:60ms]">
            <span className="block text-white">GripCafe</span>
            <span className="block text-brand-300 text-2xl font-bold sm:text-3xl lg:text-4xl">Beta Race Series</span>
          </h1>

          <p className="mt-3 animate-fade-up text-balance text-lg text-zinc-400 [animation-delay:90ms]">
            7 events. 1 week. Most points wins the $50 Series Champion Reward.
          </p>

          {event.title && (
            <p className="mt-2 animate-fade-up text-balance text-base text-zinc-500 [animation-delay:120ms]">
              Next event: <span className="font-semibold text-zinc-300">{event.title}</span>
            </p>
          )}

          <div className="mt-6 flex animate-fade-up flex-wrap items-center justify-center gap-2 text-sm text-zinc-400 sm:gap-3 [animation-delay:180ms]">
            <Calendar className="h-4 w-4 text-brand-400" />
            <span className="font-medium text-white">
              {formatDate(event.startDate, { month: 'short', day: 'numeric' })}
            </span>
            <span className="text-zinc-600">—</span>
            <span className="font-medium text-white">
              {formatDate(event.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className={`ml-2 inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${statusCls}`}>
              {event.status === 'live' && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
              )}
              {statusLabel}
            </span>
          </div>

          {event.status === 'upcoming' && (
            <div className="mt-8 animate-fade-up [animation-delay:240ms]">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Event starts in
              </p>
              <Countdown to={event.startDate} variant="blocks" className="justify-center" />
            </div>
          )}

          <div className="mt-8 flex animate-fade-up flex-wrap justify-center gap-3 [animation-delay:300ms]">
            <Button to="/challenges" size="lg">
              <Flag className="h-4 w-4" />
              View Events
            </Button>
            <Button to="/clubs" size="lg" variant="outline">
              <Users className="h-4 w-4" />
              Join a Club
            </Button>
            <a
              href="#series-rules"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <BookOpen className="h-4 w-4" />
              Series Rules
            </a>
          </div>

          <div className="mt-10 flex animate-fade-up flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-zinc-400 sm:gap-x-6 [animation-delay:360ms]">
            <span className="inline-flex items-center gap-2">
              <Trophy className="h-4 w-4 text-sky-400" />
              <span className="font-semibold text-white">$50</span> Series Champion Reward
            </span>
            <span className="text-zinc-600">|</span>
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-400" />
              <span className="font-semibold text-white">{formatNumber(stats.challenges)}</span> events
            </span>
            <span className="text-zinc-600">|</span>
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold text-white">{formatNumber(stats.racers)}</span> racers
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------ Sponsor Bar -------------------------------- */

function SponsorBar({ sponsors }) {
  return (
    <section className="border-y border-white/[0.06] bg-ink-900/60 py-5">
      <div className="container-page">
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
          {sponsors.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] card-readable">
                {s.tier === 'prize' ? (
                  <Gift className="h-4 w-4 text-sky-400" />
                ) : s.tier === 'organizer' ? (
                  <Flag className="h-4 w-4 text-brand-400" />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-sky-400" />
                )}
              </span>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {s.tier === 'organizer' ? 'Hosted by' : s.tier === 'prize' ? 'Prizes by' : 'Supported by'}
                </div>
                <div className="text-sm font-bold text-white">{s.name}</div>
                {s.blurb && (
                  <div className="text-xs text-zinc-400">{s.blurb}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* --------------------------- Beta Race Series Info ------------------------- */

function BetaSeasonInfo({ event }) {
  return (
    <section id="series-rules" className="container-page scroll-mt-20 mt-16">
      <div className="relative overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-br from-sky-500/[0.08] via-ink-900/80 to-ink-950 p-5 sm:p-8 lg:p-12">
        <div className="absolute inset-0 bg-shimmer opacity-60" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="inline-flex items-center gap-2 rounded border border-sky-500/25 bg-sky-500/[0.1] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-sky-300">
              <Trophy className="h-3.5 w-3.5" />
              Beta Race Series
            </div>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
              <span className="block text-white">GripCafe</span>
              <span className="block text-brand-300 text-xl font-bold sm:text-2xl">Beta Race Series</span>
            </h2>
            <p className="mt-2 text-lg text-zinc-300">
              7 events. 1 week. Most points wins the $50 Series Champion Reward.
            </p>

            <div className="mt-6 card-readable rounded-2xl p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Series Rules</h3>
              <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] shrink-0 text-sky-400" />
                  Free to enter.
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] shrink-0 text-sky-400" />
                  One approved submission per event.
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] shrink-0 text-sky-400" />
                  Every scoring event gives season points.
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] shrink-0 text-sky-400" />
                  Most total points after all beta events wins.
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] shrink-0 text-sky-400" />
                  Reward: $50 Series Champion Reward for the overall champion.
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] shrink-0 text-sky-400" />
                  Tiebreakers: most event wins, most podiums, best finish in final event.
                </li>
              </ul>
              <p className="mt-4 border-t border-white/[0.06] pt-3 text-sm text-zinc-400">
                Photo and build events are showcase entries — participation gives season points but they are not ranked by score.
              </p>
            </div>
          </div>

          <div className="relative shrink-0 justify-self-center lg:justify-self-end">
            <div className="glow-pulse grid min-h-[9rem] min-w-[9rem] place-items-center rounded-3xl border border-sky-500/30 bg-gradient-to-br from-sky-500/15 to-sky-600/5 p-5 sm:min-h-[11rem] sm:min-w-[11rem] sm:p-6">
              <div className="text-center">
                <Gift className="mx-auto h-10 w-10 text-sky-400 sm:h-12 sm:w-12" />
                <div className="mt-2 text-2xl font-extrabold leading-tight text-white sm:mt-3 sm:text-3xl">$50</div>
                <div className="text-xs text-sky-300/70">Champion Reward</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ----------------------------- Schedule Section ---------------------------- */

function ScheduleSection({ schedule, event }) {
  if (schedule.length === 0) return null
  return (
    <section className="container-page mt-20">
      <SectionHeading
        eyebrow="Event Schedule"
        title="Beta Race Series Events"
        description="7 events over 1 week. One approved submission per event."
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {schedule.map((c, i) => {
          const t = getType(c.typeId)
          const Icon = t.icon
          return (
            <Link
              key={c.id}
              to={`/c/${c.slug}`}
              className="card card-hover group relative overflow-hidden p-5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-15 blur-2xl transition-opacity group-hover:opacity-30"
                style={{ background: t.accent }}
              />
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] card-readable font-num text-lg font-bold text-white">
                  {i + 1}
                </span>
                <span
                  className="grid h-9 w-9 place-items-center rounded-lg"
                  style={{
                    color: t.accent,
                    backgroundColor: hexToRgba(t.accent, 0.12),
                    border: `1px solid ${hexToRgba(t.accent, 0.25)}`,
                  }}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>

              <div className="mt-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {formatDate(c.startDate, { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <h3 className="mt-1 font-semibold text-white group-hover:text-brand-300">{c.title}</h3>
                {c.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                    {c.description}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <TypeBadge typeId={c.typeId} size="sm" />
                <StatusBadge status={c.status} />
              </div>
            </Link>
          )
        })}

        {event.season && (
          <div className="card relative flex flex-col items-center justify-center p-5 text-center border-brand-500/25 bg-brand-500/[0.1]">
            <Medal className="h-10 w-10 text-sky-400" />
            <h3 className="mt-3 font-bold text-white">Overall Champion</h3>
            <p className="mt-1.5 text-sm text-zinc-400">
              Most points across all beta events wins the $50 Series Champion Reward.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

/* --------------------------- Leaderboard Preview --------------------------- */

function LeaderboardPreview() {
  return (
    <section className="container-page mt-20">
      <SectionHeading
        eyebrow="Standings"
        title="Beta Race Series Leaderboard"
        description="Points accumulate across all beta events. Most points wins the $50 Series Champion Reward."
        action={
          <Button to="/challenges" variant="outline" size="sm">
            View all events
            <ArrowRight className="h-4 w-4" />
          </Button>
        }
      />

      <div className="mt-8 card-readable overflow-hidden rounded-2xl">
        <div className="grid grid-cols-[auto_1fr_auto] gap-2 border-b border-white/[0.06] px-3 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:grid-cols-[auto_1fr_auto_auto] sm:gap-4 sm:px-5">
          <span className="w-8 text-center">#</span>
          <span>Racer</span>
          <span className="hidden text-right sm:inline">Events</span>
          <span className="text-right">Points</span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          <div className="px-3 py-12 text-center sm:px-5">
            <Trophy className="mx-auto h-10 w-10 text-zinc-600" />
            <h3 className="mt-4 font-semibold text-white">No standings yet</h3>
            <p className="mt-1.5 text-sm text-zinc-400">
              Leaderboard populates as events go live and submissions are approved.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------- Event CTA -------------------------------- */

function EventCTA({ event }) {
  return (
    <section className="container-page mt-24">
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-ink-900/60 px-6 py-14 text-center sm:px-10">
        <div className="absolute inset-0 bg-grid opacity-40 mask-fade-b" />
        <div className="relative mx-auto max-w-2xl">
          <Flame className="mx-auto h-8 w-8 text-brand-400" />
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl text-balance break-words">
            Ready for the {event.title}?
          </h2>
          <p className="mt-3 text-zinc-300">
            Join a club, sharpen your lines, and compete for the $50 Beta Race Series Champion Reward.
            Events kick off Sunday — check each event for opening times.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button to="/clubs" size="lg">
              <Users className="h-4 w-4" />
              Join a Club
            </Button>
            <Button to="/create" size="lg" variant="secondary">
              <PlusCircle className="h-4 w-4" />
              Create a Challenge
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

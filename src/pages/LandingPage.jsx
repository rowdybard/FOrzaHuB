import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Trophy,
  Users,
  Flag,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Upload,
  PlusCircle,
  Rocket,
  Gift,
  Calendar,
  Flame,
  Medal,
  BookOpen,
} from 'lucide-react'
import Button from '../components/ui/Button'
import { TypeBadge, StatusBadge } from '../components/ui/Badge'
import SectionHeading from '../components/ui/SectionHeading'
import StatTile from '../components/ui/StatTile'
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

export default function LandingPage() {
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
  const live = allChallenges.filter((c) => c.status === 'live')

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
      <Seo />
      {featuredEvent ? (
        <>
          <EventHero event={featuredEvent} stats={stats} />
          {sponsors.length > 0 && <SponsorBar sponsors={sponsors} />}
          <BetaSeasonInfo event={featuredEvent} />
          <ScheduleSection schedule={eventSchedule} event={featuredEvent} />
          <LeaderboardPreview />
        </>
      ) : (
        <FallbackHero stats={stats} allChallenges={allChallenges} />
      )}
      <StatsBar stats={stats} />
      {live.length > 0 && <LiveChallenges challenges={live} />}
      <HowItWorks event={featuredEvent} />
      <FAQSection />
      {featuredEvent && <EventCTA event={featuredEvent} />}
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
    <section className="relative overflow-hidden bg-heatwave">
      <div className="absolute inset-0 bg-grid opacity-30 mask-fade-b" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink-950/40 to-ink-950" />

      <div className="container-page relative py-16 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded border border-brand-500/25 bg-brand-500/[0.1] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-300">
              <Flame className="h-3.5 w-3.5" />
              Beta Race Series
            </span>
          </div>

          <h1 className="mt-6 animate-fade-up text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl [animation-delay:60ms]">
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

          <div className="mt-6 flex animate-fade-up items-center justify-center gap-3 text-sm text-zinc-400 [animation-delay:180ms]">
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
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <BookOpen className="h-4 w-4" />
              How It Works
            </a>
          </div>

          <div className="mt-10 flex animate-fade-up flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-400 [animation-delay:360ms]">
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

function FallbackHero({ stats, allChallenges }) {
  const upcoming = (allChallenges || [])
    .filter((c) => c.status === 'upcoming')
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
  const nextEvent = upcoming[0] || null
  return (
    <section className="relative overflow-hidden bg-heatwave">
      <div className="absolute inset-0 bg-grid opacity-30 mask-fade-b" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink-950/40 to-ink-950" />
      <div className="container-page relative py-16 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-white">GripCafe</span>
          </h1>
          <p className="mt-4 text-xl text-zinc-300">
            Community-run competitive events for sim racing clubs.
          </p>
          {nextEvent && (
            <Link
              to={`/c/${nextEvent.slug}`}
              className="mt-8 inline-flex flex-col items-center gap-1 card-readable rounded-2xl px-6 py-4 transition-colors hover:border-white/[0.15]"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
                Next event
              </span>
              <span className="text-lg font-bold text-white">{nextEvent.title}</span>
              <span className="text-sm text-zinc-400">
                Opens {formatDate(nextEvent.startDate, { month: 'short', day: 'numeric' })}
              </span>
            </Link>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button to="/challenges" size="lg">
              <Flag className="h-4 w-4" />
              Browse Events
            </Button>
            <Button to="/clubs" size="lg" variant="outline">
              <Users className="h-4 w-4" />
              Join a Club
            </Button>
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
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {s.tier === 'organizer' ? 'Hosted by' : s.tier === 'prize' ? 'Prizes by' : 'Supported by'}
                </div>
                <div className="text-sm font-bold text-white">{s.name}</div>
                {s.blurb && (
                  <div className="text-xs text-zinc-500">{s.blurb}</div>
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
    <section className="container-page mt-16">
      <div className="relative overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-br from-sky-500/[0.06] via-ink-900/40 to-ink-950 p-5 sm:p-8 lg:p-12">
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
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Series Rules</h3>
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
              <p className="mt-4 border-t border-white/[0.06] pt-3 text-xs text-zinc-500">
                Photo and build events are showcase entries — participation gives season points but they are not ranked by score.
              </p>
            </div>
          </div>

          <div className="relative shrink-0 justify-self-center lg:justify-self-end">
            <div className="glow-pulse grid min-h-[10rem] min-w-[10rem] place-items-center rounded-3xl border border-sky-500/30 bg-gradient-to-br from-sky-500/15 to-sky-600/5 p-6 sm:min-h-[11rem] sm:min-w-[11rem]">
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
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
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
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-2 border-b border-white/[0.06] px-3 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:gap-4 sm:px-5">
          <span className="w-8 text-center">#</span>
          <span>Racer</span>
          <span className="hidden text-right sm:inline">Events</span>
          <span className="text-right">Points</span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          <div className="px-3 py-12 text-center sm:px-5">
            <Trophy className="mx-auto h-10 w-10 text-zinc-600" />
            <h3 className="mt-4 font-semibold text-white">No standings yet</h3>
            <p className="mt-1.5 text-sm text-zinc-500">
              Leaderboard populates as events go live and submissions are approved.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------- Stats bar -------------------------------- */

function StatsBar({ stats: s }) {
  const isLaunch = s.isLaunch
  const stats = [
    { icon: Users, value: formatNumber(s.clubs), label: 'Founding clubs' },
    { icon: Flag, value: formatNumber(s.challenges), label: s.challenges === 1 ? 'Challenge' : 'Challenges', empty: s.challenges === 0 },
    { icon: Upload, value: s.submissions === 0 ? '—' : formatNumber(s.submissions), label: 'Submissions verified', empty: s.submissions === 0 },
    { icon: Trophy, value: s.racers === 0 ? '—' : formatNumber(s.racers), label: 'Racers on boards', empty: s.racers === 0 },
  ]
  return (
    <section className="container-page mt-16 space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <StatTile key={s.label} icon={s.icon} value={s.value} label={s.label} dim={s.empty} />
        ))}
      </div>
      {isLaunch && (
        <p className="flex items-center gap-1.5 text-xs text-zinc-600">
          <Rocket className="h-3 w-3" />
          Week 1: leaderboards fill as submissions come in
        </p>
      )}
    </section>
  )
}

/* ------------------------------ Live challenges ----------------------------- */

function LiveChallenges({ challenges }) {
  return (
    <section className="container-page mt-20">
      <SectionHeading
        eyebrow="Happening now"
        title="Live challenges"
        description="Open events accepting submissions now."
        action={
          <Button to="/challenges" variant="outline" size="sm">
            View all
            <ArrowRight className="h-4 w-4" />
          </Button>
        }
      />
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {challenges.slice(0, 6).map((c) => (
          <ChallengeCardLite key={c.id} challenge={c} />
        ))}
      </div>
    </section>
  )
}

function ChallengeCardLite({ challenge }) {
  const t = getType(challenge.typeId)
  const Icon = t.icon
  return (
    <Link
      to={`/c/${challenge.slug}`}
      className="card card-hover group block overflow-hidden p-5"
    >
      <div className="flex items-start justify-between">
        <span
          className="grid h-10 w-10 place-items-center rounded-xl"
          style={{ color: t.accent, backgroundColor: hexToRgba(t.accent, 0.12), border: `1px solid ${hexToRgba(t.accent, 0.25)}` }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <StatusBadge status={challenge.status} />
      </div>
      <h3 className="mt-4 font-semibold text-white group-hover:text-brand-300">{challenge.title}</h3>
      <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {formatNumber(challenge.participants)} racers
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-brand-400" />
          <Countdown to={challenge.endDate} /> left
        </span>
      </div>
    </Link>
  )
}

/* ------------------------------- How it works ------------------------------- */

function HowItWorks({ event }) {
  const steps = [
    { icon: Users, title: 'Join a club', text: 'Find a racing group or bring your Discord server. Your Discord stays the home base — GripCafe adds event pages, proof review, and leaderboards.' },
    { icon: Flag, title: 'Enter daily events', text: 'Each day features a new challenge format — hot laps, drift, drag, builds, photos.' },
    { icon: Upload, title: 'Submit your proof', text: 'Post your time or score with a clip or screenshot. Every entry is verified.' },
    { icon: Trophy, title: 'Climb the board', text: `Points accumulate all week. Top racer on Saturday wins the ${event?.prize || 'grand'} Champion Reward.` },
  ]
  return (
    <section id="how-it-works" className="container-page scroll-mt-20 mt-24">
      <SectionHeading eyebrow="How it works" title="From sign-up to championship in four steps" />
      <div className="relative mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent lg:block" />
        {steps.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={s.title} className="relative">
              <div className="flex items-center gap-3">
                <span className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/[0.08] bg-ink-850 text-brand-400">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="font-num text-4xl font-extrabold text-white/25">0{i + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold text-white">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{s.text}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ---------------------------------- FAQ ----------------------------------- */

function FAQSection() {
  const faqs = [
    {
      q: 'How do I run a sim racing tournament?',
      a: 'Create a free GripCafe account, start or join a club, then use the Create Challenge page to set up a tournament. Choose a format like time trial, drift, drag, or photo contest, set the rules and schedule, and share the invite link with your community.',
    },
    {
      q: 'What is a verified gaming competition?',
      a: 'Every submission on GripCafe requires proof — a screenshot or video clip showing your result. Staff reviewers verify each entry before it appears on the public leaderboard, so standings are always legitimate.',
    },
    {
      q: 'How do proof-backed leaderboards work?',
      a: 'Players submit their time or score with a screenshot or video. Each submission is reviewed by club staff before it\'s approved. Only verified entries appear on the leaderboard, and every result links back to its proof.',
    },
    {
      q: 'Can I win community prizes in sim racing?',
      a: 'Yes. Sponsored events on GripCafe offer community prizes like Steam gift cards. Join a club, enter sponsored challenges, and climb the championship leaderboard to qualify.',
    },
    {
      q: 'Is GripCafe free to use?',
      a: 'Yes. Creating an account, joining clubs, and entering challenges is completely free. Clubs can run free-to-enter events at no cost.',
    },
  ]
  return (
    <section className="container-page mt-24">
      <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {faqs.map((f) => (
          <div key={f.q} className="card p-5">
            <h3 className="text-sm font-semibold text-white">{f.q}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* -------------------------------- Event CTA -------------------------------- */

function EventCTA({ event }) {
  return (
    <section className="container-page mt-24">
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-heatwave px-6 py-14 text-center sm:px-10">
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


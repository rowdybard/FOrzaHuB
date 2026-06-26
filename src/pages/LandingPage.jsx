import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Trophy,
  Users,
  Flag,
  Clock,
  Upload,
  Rocket,
  Hourglass,
} from 'lucide-react'
import Button from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import SectionHeading from '../components/ui/SectionHeading'
import StatTile from '../components/ui/StatTile'
import Countdown from '../components/common/Countdown'
import {
  getChallengesWithClubs,
  getSiteStats,
} from '../data/api'
import { useAsync } from '../hooks/useAsync'
import { getType } from '../lib/challengeTypes'
import { formatNumber, hexToRgba, getCountdown } from '../lib/utils'
import Seo from '../components/Seo'

function LiveCountdown({ endDate }) {
  const [c, setC] = useState(() => getCountdown(endDate))
  useEffect(() => {
    setC(getCountdown(endDate))
    const id = setInterval(() => setC(getCountdown(endDate)), 1000)
    return () => clearInterval(id)
  }, [endDate])
  if (c.ended) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-amber-300/80">
        <Hourglass className="h-3.5 w-3.5" />
        Closing
      </span>
    )
  }
  const parts =
    c.days > 0
      ? `${c.days}d ${c.hours}h ${String(c.minutes).padStart(2, '0')}m`
      : c.hours > 0
        ? `${c.hours}h ${String(c.minutes).padStart(2, '0')}m ${String(c.seconds).padStart(2, '0')}s`
        : `${c.minutes}m ${String(c.seconds).padStart(2, '0')}s`
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
      <Clock className="h-3.5 w-3.5 text-brand-400" />
      <span className="font-num tabular-nums">{parts}</span> left
    </span>
  )
}

export default function LandingPage() {
  const { data } = useAsync(
    () => Promise.all([getChallengesWithClubs(), getSiteStats()]),
    [],
  )
  const allChallenges = data?.[0] || []
  const stats = data?.[1] || { clubs: 0, challenges: 0, submissions: 0, racers: 0, isLaunch: true }

  const betaEvents = allChallenges
    .filter((c) => c.season === 'beta-1')
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
  const live = allChallenges.filter((c) => c.status === 'live')

  const featuredEvent = betaEvents[0] || null

  return (
    <>
      <Seo />
      <Hero stats={stats} allChallenges={allChallenges} />
      {featuredEvent && <BetaPromo event={featuredEvent} stats={stats} />}
      <StatsBar stats={stats} />
      {live.length > 0 && <LiveChallenges challenges={live} />}
      <HowItWorks />
      <FAQSection />
    </>
  )
}

/* --------------------------------- Hero ----------------------------------- */

function Hero({ stats, allChallenges }) {
  const upcoming = (allChallenges || [])
    .filter((c) => c.status === 'upcoming')
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
  const nextEvent = upcoming[0] || null
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30 mask-fade-b" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink-950/40 to-ink-950" />
      <div className="container-page relative py-16 lg:py-24">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/[0.08] bg-ink-900/60 p-6 text-center backdrop-blur-md sm:p-10 lg:p-12">
          <h1 className="animate-fade-up text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl [animation-delay:60ms]">
            <span className="block text-white">GripCafe</span>
          </h1>
          <p className="mt-4 animate-fade-up text-balance text-xl text-zinc-300 [animation-delay:90ms]">
            Community-run competitive events for sim racing clubs.
          </p>
          <p className="mt-2 animate-fade-up text-balance text-base text-zinc-500 [animation-delay:120ms]">
            Verified proof, public leaderboards, and championship scoring.
          </p>

          {nextEvent && (
            <Link
              to={`/c/${nextEvent.slug}`}
              className="mt-8 inline-flex animate-fade-up flex-col items-center gap-1 card-readable rounded-2xl px-6 py-4 transition-colors hover:border-white/[0.15] [animation-delay:150ms]"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
                Next event
              </span>
              <span className="text-lg font-bold text-white">{nextEvent.title}</span>
              <span className="text-sm text-zinc-400">
                Opens {new Date(nextEvent.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </Link>
          )}

          <div className="mt-8 flex animate-fade-up flex-wrap justify-center gap-3 [animation-delay:180ms]">
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

/* ----------------------------- Beta Promo Card ----------------------------- */

function BetaPromo({ event, stats }) {
  const now = Date.now()
  const ended = new Date(event.endDate).getTime() <= now
  const started = new Date(event.startDate).getTime() <= now
  const effectiveStatus = ended ? 'closed' : !started ? 'upcoming' : event.status
  const statusLabel = effectiveStatus === 'live' ? 'Live Now' : effectiveStatus === 'upcoming' ? 'Upcoming' : effectiveStatus === 'closed' ? 'Completed' : 'Reviewing'
  return (
    <section className="container-page mt-16">
      <Link
        to="/beta-series"
        className="group relative block overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-br from-sky-500/[0.08] via-ink-900/80 to-ink-950 p-5 transition-all duration-200 hover:border-sky-500/35 hover:-translate-y-0.5 sm:p-8 lg:p-10"
      >
        <div className="absolute inset-0 bg-shimmer opacity-40" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded border border-sky-500/25 bg-sky-500/[0.1] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-sky-300">
              <Trophy className="h-3.5 w-3.5" />
              Beta Race Series
            </div>
            <h2 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">
              7 events. 1 week. $50 Champion Reward.
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              {event.title && <>Next event: <span className="font-semibold text-zinc-300">{event.title}</span></>}
              {event.title && ' · '}
              <span className={`inline-flex items-center gap-1.5 font-medium ${effectiveStatus === 'live' ? 'text-emerald-300' : 'text-sky-300'}`}>
                {statusLabel}
              </span>
            </p>
            {effectiveStatus === 'upcoming' && (
              <p className="mt-1 text-sm text-zinc-500">
                Starts {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-center gap-3">
            {effectiveStatus === 'upcoming' && (
              <Countdown to={event.startDate} variant="blocks" />
            )}
            <span className="inline-flex items-center gap-2 rounded-xl border border-sky-500/25 bg-sky-500/[0.1] px-4 py-2 text-sm font-semibold text-sky-300 transition-colors group-hover:bg-sky-500/20">
              View Series Details
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Link>
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
  const now = Date.now()
  const ended = new Date(challenge.endDate).getTime() <= now
  const started = new Date(challenge.startDate).getTime() <= now
  const effectiveStatus = ended ? 'closed' : !started ? 'upcoming' : challenge.status
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
        <StatusBadge status={effectiveStatus} />
      </div>
      <h3 className="mt-4 font-semibold text-white group-hover:text-brand-300">{challenge.title}</h3>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {formatNumber(challenge.participants)} racers
        </span>
        {effectiveStatus === 'live' ? (
          <LiveCountdown endDate={challenge.endDate} />
        ) : effectiveStatus === 'upcoming' ? (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-sky-400" />
            in <Countdown to={challenge.startDate} />
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-zinc-500">
            <Trophy className="h-3.5 w-3.5" />
            Final
          </span>
        )}
      </div>
    </Link>
  )
}

/* ------------------------------- How it works ------------------------------- */

function HowItWorks() {
  const steps = [
    { icon: Users, title: 'Join a club', text: 'Find a racing group or bring your Discord server. Your Discord stays the home base — GripCafe adds event pages, proof review, and leaderboards.' },
    { icon: Flag, title: 'Enter daily events', text: 'Each day features a new challenge format — hot laps, drift, drag, builds, photos.' },
    { icon: Upload, title: 'Submit your proof', text: 'Post your time or score with a clip or screenshot. Every entry is verified.' },
    { icon: Trophy, title: 'Climb the board', text: 'Points accumulate all week. Top racer wins the Champion Reward.' },
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


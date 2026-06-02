import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Trophy,
  Users,
  Flag,
  ListChecks,
  ShieldCheck,
  Clock,
  Hash,
  CheckCircle2,
  Sparkles,
  Upload,
  BarChart3,
  PlusCircle,
  MessagesSquare,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import Cover from '../components/ui/Cover'
import { TypeBadge, StatusBadge } from '../components/ui/Badge'
import SectionHeading from '../components/ui/SectionHeading'
import StatTile from '../components/ui/StatTile'
import ChallengeCard from '../components/common/ChallengeCard'
import ClubCard from '../components/common/ClubCard'
import Countdown from '../components/common/Countdown'
import { clubs, liveChallenges, featuredChallenge, siteStats } from '../data/mock'
import { getClubById } from '../data/mock'
import { TYPE_LIST, getType, formatMetric } from '../lib/challengeTypes'
import { formatNumber, formatCompact, hexToRgba } from '../lib/utils'

const TRUST_NAMES = ['Maya Reyes', 'Jin Lee', 'Carolina M.', 'Leon Kraus', 'Yuki Tanaka']

export default function LandingPage() {
  const live = liveChallenges()
  const featured = featuredChallenge()

  return (
    <>
      <Hero featured={featured} />
      <StatsBar />
      <LiveChallenges challenges={live} />
      <TypesShowcase />
      <HowItWorks />
      <Communities />
      <DiscordTrust featured={featured} />
      <CtaBand />
    </>
  )
}

/* ----------------------------------- Hero ---------------------------------- */

function Hero({ featured }) {
  return (
    <section className="relative overflow-hidden bg-festival">
      <div className="absolute inset-0 bg-grid opacity-60 mask-fade-b" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink-950/30 to-ink-950" />
      <div className="container-page relative grid items-center gap-14 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-sm">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-brand-500/20 text-brand-300">
              <Flag className="h-2.5 w-2.5" />
            </span>
            Unofficial community hub · Forza Horizon 6
          </span>

          <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Run weekly challenges your <span className="text-gradient">community trusts</span>.
          </h1>

          <p className="mt-5 max-w-xl text-balance text-lg leading-relaxed text-zinc-400">
            Pitwall gives Forza clubs and Discord communities a home for time trials,
            drift battles and photo contests — with verified proof and clean public
            leaderboards. No spreadsheets. No plastic.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button to="/challenges" size="lg">
              Browse challenges
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button to="/create" size="lg" variant="outline">
              Create a challenge
            </Button>
          </div>

          <div className="mt-9 flex items-center gap-4">
            <div className="flex -space-x-2.5">
              {TRUST_NAMES.map((n) => (
                <Avatar key={n} name={n} size={34} className="ring-2 ring-ink-950" />
              ))}
            </div>
            <p className="text-sm text-zinc-400">
              Trusted by <span className="font-semibold text-white">240+ clubs</span> running{' '}
              <span className="font-semibold text-white">1,800+</span> events.
            </p>
          </div>
        </div>

        <HeroPreview featured={featured} />
      </div>
    </section>
  )
}

function HeroPreview({ featured }) {
  const club = getClubById(featured.clubId)
  const top = featured.entries.slice(0, 4)

  return (
    <div className="relative animate-fade-up [animation-delay:120ms]">
      <div className="absolute -inset-8 rounded-full bg-brand-500/10 blur-3xl" />

      {/* Floating accents (desktop) */}
      <div className="absolute -left-4 top-10 z-20 hidden animate-fade-up rounded-xl border border-white/10 bg-ink-850/90 px-3 py-2 text-xs shadow-pop backdrop-blur-md lg:block [animation-delay:300ms]">
        <div className="flex items-center gap-2 text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-medium">Proof verified</span>
        </div>
      </div>
      <div className="absolute -right-3 bottom-16 z-20 hidden animate-fade-up rounded-xl border border-white/10 bg-ink-850/90 px-3 py-2 text-xs shadow-pop backdrop-blur-md lg:block [animation-delay:420ms]">
        <div className="text-zinc-400">Top gap</div>
        <div className="font-num font-bold text-white">+0.407s</div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-850 shadow-pop">
        <Cover typeId={featured.typeId} className="h-32">
          <div className="flex h-full flex-col justify-between p-4">
            <div className="flex items-start justify-between">
              <TypeBadge typeId={featured.typeId} size="sm" />
              <StatusBadge status={featured.status} />
            </div>
            <div>
              <div className="text-xs text-zinc-300">{club?.name}</div>
              <h3 className="text-lg font-bold leading-tight text-white">{featured.title}</h3>
            </div>
          </div>
        </Cover>

        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5 text-xs">
          <span className="inline-flex items-center gap-1.5 text-zinc-400">
            <Users className="h-3.5 w-3.5" />
            {formatNumber(featured.participants)} racers
          </span>
          <span className="inline-flex items-center gap-1.5 text-zinc-300">
            <Clock className="h-3.5 w-3.5 text-brand-400" />
            <Countdown to={featured.endDate} /> left
          </span>
        </div>

        <div className="divide-y divide-white/[0.05]">
          {top.map((e) => (
            <div key={e.rank} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-5 text-center font-num text-sm font-semibold text-zinc-500">
                {e.rank}
              </span>
              <Avatar name={e.user.name} size={28} />
              <span className="flex-1 truncate text-sm text-white">{e.user.tag}</span>
              {e.verified && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
              <span className="font-num text-sm font-bold tabular-nums text-white">
                {formatMetric(featured.typeId, e.value)}
              </span>
            </div>
          ))}
        </div>

        <Link
          to={`/c/${featured.slug}`}
          className="flex items-center justify-center gap-1.5 border-t border-white/[0.06] py-3 text-sm font-medium text-brand-300 transition-colors hover:bg-white/[0.03]"
        >
          View full leaderboard
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}

/* --------------------------------- Stats bar -------------------------------- */

function StatsBar() {
  const stats = [
    { icon: Users, value: formatNumber(siteStats.clubs), label: 'Active clubs' },
    { icon: Flag, value: formatNumber(siteStats.challenges), label: 'Challenges run' },
    { icon: Upload, value: formatCompact(siteStats.submissions), label: 'Submissions verified' },
    { icon: Trophy, value: formatCompact(siteStats.racers), label: 'Racers competing' },
  ]
  return (
    <section className="container-page -mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {stats.map((s) => (
        <StatTile key={s.label} icon={s.icon} value={s.value} label={s.label} />
      ))}
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
        description="Jump into an open event. Set a time, submit your proof, and climb the board."
        action={
          <Button to="/challenges" variant="outline" size="sm">
            View all
            <ArrowRight className="h-4 w-4" />
          </Button>
        }
      />
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {challenges.slice(0, 6).map((c) => (
          <ChallengeCard key={c.id} challenge={c} />
        ))}
      </div>
    </section>
  )
}

/* ------------------------------ Types showcase ------------------------------ */

function TypesShowcase() {
  return (
    <section className="container-page mt-24">
      <SectionHeading
        eyebrow="Five formats"
        title="Built for every kind of event"
        description="From hot laps to photo mode — Pitwall handles scoring, proof and leaderboards for each format out of the box."
      />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {TYPE_LIST.map((t) => {
          const Icon = t.icon
          return (
            <Link
              key={t.id}
              to="/challenges"
              className="card card-hover group relative overflow-hidden p-5"
            >
              <div
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
                style={{ background: t.accent }}
              />
              <span
                className="relative grid h-11 w-11 place-items-center rounded-xl"
                style={{
                  color: t.accent,
                  backgroundColor: hexToRgba(t.accent, 0.12),
                  border: `1px solid ${hexToRgba(t.accent, 0.25)}`,
                }}
              >
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="relative mt-4 font-semibold text-white">{t.label}</h3>
              <p className="relative mt-1.5 text-sm leading-relaxed text-zinc-400">{t.summary}</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

/* ------------------------------- How it works ------------------------------- */

function HowItWorks() {
  const steps = [
    {
      icon: PlusCircle,
      title: 'Create a challenge',
      text: 'Pick a format, set the rules, car class and deadline. Publish in minutes.',
    },
    {
      icon: Upload,
      title: 'Members submit proof',
      text: 'Racers post their time or score with a clip or screenshot as evidence.',
    },
    {
      icon: ShieldCheck,
      title: 'You verify entries',
      text: 'Approve, flag or reject submissions from one clean review queue.',
    },
    {
      icon: BarChart3,
      title: 'Leaderboard goes live',
      text: 'A public, readable board updates instantly — share the link anywhere.',
    },
  ]
  return (
    <section className="container-page mt-24">
      <SectionHeading eyebrow="How it works" title="From idea to leaderboard in four steps" />
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
                <span className="font-num text-4xl font-extrabold text-white/10">
                  0{i + 1}
                </span>
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

/* ------------------------------- Communities -------------------------------- */

function Communities() {
  return (
    <section className="container-page mt-24">
      <SectionHeading
        eyebrow="Communities"
        title="Clubs already on the grid"
        description="Browse active communities or bring your own Discord and start running events."
        action={
          <Button to="/clubs" variant="outline" size="sm">
            All communities
            <ArrowRight className="h-4 w-4" />
          </Button>
        }
      />
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {clubs.slice(0, 4).map((club) => (
          <ClubCard key={club.id} club={club} />
        ))}
      </div>
    </section>
  )
}

/* ------------------------------ Discord trust ------------------------------- */

function DiscordTrust({ featured }) {
  const club = getClubById(featured.clubId)
  const features = [
    'Verified proof on every podium — clips and screenshots attached',
    'A review queue that flags assists, cuts and missing evidence',
    'Public leaderboards with shareable links for any channel',
    'Roles for admins, stewards and racers — no spreadsheet chaos',
  ]
  return (
    <section className="container-page mt-24">
      <div className="grid items-center gap-10 rounded-3xl border border-white/[0.07] bg-ink-900/60 p-6 sm:p-10 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
            <MessagesSquare className="h-3.5 w-3.5" />
            Made to live in your server
          </span>
          <h2 className="mt-4 text-3xl font-bold text-balance">
            Something a Discord admin can actually trust
          </h2>
          <p className="mt-3 text-zinc-400">
            Pitwall is built around proof and clarity, so your results hold up and your
            members keep coming back. Announce events, collect entries and post results
            without ever leaving the vibe of your community.
          </p>
          <ul className="mt-6 space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-zinc-300">
                <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] shrink-0 text-emerald-400" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button to="/create">Create a challenge</Button>
            <Button href="#" variant="secondary">
              <MessagesSquare className="h-4 w-4" />
              Connect Discord
            </Button>
          </div>
        </div>

        <DiscordEmbed featured={featured} club={club} />
      </div>
    </section>
  )
}

function DiscordEmbed({ featured, club }) {
  const t = getType(featured.typeId)
  const top = featured.entries[0]
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#313338] p-4 shadow-pop">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-ink-950">
          <Flag className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">Pitwall</span>
            <span className="rounded bg-indigo-500 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
              App
            </span>
            <span className="text-xs text-zinc-400">Today at 9:41</span>
          </div>
          <p className="mt-1 text-sm text-zinc-200">
            New event just dropped — get your laps in! <span className="align-middle">🏁</span>
          </p>

          {/* Embed */}
          <div className="mt-2 overflow-hidden rounded-md border-l-4" style={{ borderColor: t.accent }}>
            <div className="bg-[#2b2d31] p-3">
              <div className="text-xs font-medium" style={{ color: t.accent }}>
                {club?.name} · {t.label}
              </div>
              <div className="mt-0.5 font-semibold text-white">{featured.title}</div>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                {featured.restriction} · {featured.location}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="font-semibold text-zinc-300">Current leader</div>
                  <div className="mt-0.5 text-zinc-400">
                    {top.user.tag} — {formatMetric(featured.typeId, top.value)}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-zinc-300">Ends in</div>
                  <div className="mt-0.5 text-zinc-400">
                    <Countdown to={featured.endDate} />
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-500">
                <Hash className="h-3 w-3" />
                pitwall.gg/c/{featured.slug}
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-[#2b2d31] px-2 py-1 text-xs text-zinc-300">
              🏁 <span className="font-num">128</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-[#2b2d31] px-2 py-1 text-xs text-zinc-300">
              🔥 <span className="font-num">86</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* --------------------------------- CTA band --------------------------------- */

function CtaBand() {
  return (
    <section className="container-page mt-24">
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-festival px-6 py-14 text-center sm:px-10">
        <div className="absolute inset-0 bg-grid opacity-50 mask-fade-b" />
        <div className="relative mx-auto max-w-2xl">
          <Sparkles className="mx-auto h-7 w-7 text-brand-300" />
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl text-balance">
            Ready to run your next event?
          </h2>
          <p className="mt-3 text-zinc-300">
            Spin up a challenge, share the link, and let the leaderboard do the talking.
            Free to start — built for communities.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button to="/create" size="lg">
              <PlusCircle className="h-4 w-4" />
              Create a challenge
            </Button>
            <Button to="/clubs" size="lg" variant="secondary">
              Explore communities
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

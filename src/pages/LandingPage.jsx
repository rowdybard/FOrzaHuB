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
  Rocket,
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
import {
  getClubs,
  getChallengesWithClubs,
  getFeaturedChallenge,
  getChallengeBySlug,
  getSiteStats,
} from '../data/api'
import { useAsync } from '../hooks/useAsync'
import { TYPE_LIST, getType, formatMetric } from '../lib/challengeTypes'
import { formatNumber, formatCompact, hexToRgba } from '../lib/utils'

const TRUST_NAMES = ['Rowdybard', 'PurpleCone']
const HERO_VIDEO = {
  webm: '/media/landing-drift-loop.webm',
  mp4: '/media/landing-drift-loop.mp4',
  poster: '/media/landing-drift-poster.jpg',
}

async function loadLanding() {
  const [clubs, challenges, featured, stats] = await Promise.all([
    getClubs(),
    getChallengesWithClubs(),
    getFeaturedChallenge(),
    getSiteStats(),
  ])
  const live = challenges.filter((c) => c.status === 'live')
  const fullFeatured = featured ? await getChallengeBySlug(featured.slug) : null
  return { clubs, live, featured: fullFeatured, stats }
}

export default function LandingPage() {
  const { data } = useAsync(() => loadLanding(), [])
  const clubs = data?.clubs || []
  const live = data?.live || []
  const featured = data?.featured || null
  const stats = data?.stats || { clubs: 0, challenges: 0, submissions: 0, racers: 0, isLaunch: true }

  return (
    <>
      <Hero featured={featured} stats={stats} />
      <StatsBar stats={stats} />
      {live.length > 0 && <LiveChallenges challenges={live} />}
      <TypesShowcase />
      <HowItWorks />
      <Communities clubs={clubs} />
      {featured && <DiscordTrust featured={featured} />}
      <CtaBand />
    </>
  )
}

/* ----------------------------------- Hero ---------------------------------- */

function Hero({ featured, stats }) {
  return (
    <section className="relative overflow-hidden bg-festival">
      <HeroVideoBackground />
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
            Pitwall gives Forza clubs and Discord communities a place for time trials,
            drift battles, photo contests, proof, and public leaderboards.
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
              <span className="font-semibold text-white">{formatNumber(stats.clubs)}</span>{' '}
              {stats.clubs === 1 ? 'club' : 'clubs'} on the grid.
            </p>
          </div>
        </div>

        {featured ? <HeroPreview featured={featured} /> : <HeroPlaceholder />}
      </div>
    </section>
  )
}

function HeroVideoBackground() {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-60 saturate-110 contrast-105 motion-reduce:hidden"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={HERO_VIDEO.poster}
      >
        <source src={HERO_VIDEO.webm} type="video/webm" />
        <source src={HERO_VIDEO.mp4} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-festival opacity-65 mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/80 to-ink-950/25" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/20 via-ink-950/35 to-ink-950" />
      <div className="absolute inset-0 bg-grid opacity-35 mask-fade-b" />
    </div>
  )
}

function HeroPlaceholder() {
  return (
    <div className="relative animate-fade-up [animation-delay:120ms]">
      <div className="absolute -inset-8 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-850 p-8 text-center shadow-pop">
        <Flag className="mx-auto h-8 w-8 text-brand-400" />
        <h3 className="mt-4 text-lg font-bold text-white">No active challenges</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Create a challenge to start the first leaderboard.
        </p>
        <Button to="/create" size="sm" className="mt-5">
          <PlusCircle className="h-4 w-4" />
          Create a challenge
        </Button>
      </div>
    </div>
  )
}

function HeroPreview({ featured }) {
  const club = featured.club
  const top = (featured.entries || []).slice(0, 4)

  return (
    <div className="relative animate-fade-up [animation-delay:120ms]">
      <div className="absolute -inset-8 rounded-full bg-brand-500/10 blur-3xl" />

      {/* Floating accents (desktop) — solid bg, no backdrop-blur to avoid scroll smear */}
      <div className="absolute -left-4 top-10 z-10 hidden animate-fade-up rounded-xl border border-white/10 bg-ink-850 px-3 py-2 text-xs shadow-pop lg:block [animation-delay:300ms]">
        <div className="flex items-center gap-2 text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-medium">Proof verified</span>
        </div>
      </div>
      <div className="absolute -right-3 bottom-16 z-10 hidden animate-fade-up rounded-xl border border-white/10 bg-ink-850 px-3 py-2 text-xs shadow-pop lg:block [animation-delay:420ms]">
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

function StatsBar({ stats: s }) {
  const isLaunch = s.isLaunch
  const stats = [
    {
      icon: Users,
      value: formatNumber(s.clubs),
      label: 'Founding clubs',
    },
    {
      icon: Flag,
      value: formatNumber(s.challenges),
      label: s.challenges === 1 ? 'Challenge' : 'Challenges',
      empty: s.challenges === 0,
    },
    {
      icon: Upload,
      value: s.submissions === 0 ? '—' : formatCompact(s.submissions),
      label: 'Submissions verified',
      empty: s.submissions === 0,
    },
    {
      icon: Trophy,
      value: s.racers === 0 ? '—' : formatCompact(s.racers),
      label: 'Racers on boards',
      empty: s.racers === 0,
    },
  ]
  return (
    <section className="container-page -mt-6 space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <StatTile
            key={s.label}
            icon={s.icon}
            value={s.value}
            label={s.label}
            dim={s.empty}
          />
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
        title="Event formats"
        description="Hot laps, drift scores, speed traps, build battles, and photo contests."
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
      text: 'A public board updates after entries are approved.',
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

function Communities({ clubs }) {
  return (
    <section className="container-page mt-24">
      <SectionHeading
        eyebrow="Communities"
        title="Founding clubs"
        description="Clubs running events on Pitwall."
        action={
          <Button to="/clubs" variant="outline" size="sm">
            All clubs
            <ArrowRight className="h-4 w-4" />
          </Button>
        }
      />
      {clubs.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {clubs.slice(0, 4).map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      )}

      {/* Club pitch */}
      <div className="mt-6 flex items-start gap-5 rounded-2xl border border-white/[0.06] bg-ink-900/40 p-5 sm:items-center">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-ink-850 text-brand-400">
          <PlusCircle className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white">Running a Forza club or Discord?</p>
          <p className="mt-0.5 text-sm text-zinc-400">
            Create challenges, review submissions, and keep leaderboards in one place.
          </p>
        </div>
        <Button to="/clubs/new" variant="outline" size="sm" className="shrink-0">
          Start a community
        </Button>
      </div>
    </section>
  )
}

/* ------------------------------ Discord trust ------------------------------- */

function DiscordTrust({ featured }) {
  const club = featured.club
  const features = [
    'Verified proof on every podium: clips and screenshots attached',
    'A review queue that flags assists, cuts and missing evidence',
    'Public leaderboards with shareable links for any channel',
    'Roles for admins, stewards and racers',
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
            Discord-ready event management
          </h2>
          <p className="mt-3 text-zinc-400">
            Pitwall is built around proof and review. Announce events, collect entries,
            and post results from the same place.
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
  const leaderLine = top
    ? `${top.user.tag} - ${formatMetric(featured.typeId, top.value)}`
    : 'No approved entries yet'
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
                  <div className="mt-0.5 text-zinc-400">{leaderLine}</div>
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

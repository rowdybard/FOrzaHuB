import { useParams, Link } from 'react-router-dom'
import {
  ShieldCheck,
  Users,
  Trophy,
  Flag,
  Upload,
  MessagesSquare,
  CalendarDays,
  ChevronRight,
  Plus,
  Medal,
} from 'lucide-react'
import Button from '../components/ui/Button'
import ClubMark from '../components/ui/ClubMark'
import StatTile from '../components/ui/StatTile'
import { Badge } from '../components/ui/Badge'
import ChallengeCard from '../components/common/ChallengeCard'
import EmptyState from '../components/common/EmptyState'
import MembersCard from '../components/common/MembersCard'
import Nameplate from '../components/ui/Nameplate'
import NotFound from './NotFound'
import Loading from '../components/common/Loading'
import { getClubBySlug, getChallengesByClub, getClubMembers } from '../data/api'
import { useAsync } from '../hooks/useAsync'
import { formatNumber, hexToRgba } from '../lib/utils'

async function loadCommunity(slug) {
  const club = await getClubBySlug(slug)
  if (!club) return { club: null }
  const [all, members] = await Promise.all([
    getChallengesByClub(club.id),
    getClubMembers(club.id),
  ])
  return { club, all, members }
}

const POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]

function clubStandings(cs) {
  const map = new Map()
  const add = (entry) => {
    const key = entry.user.tag
    const prev = map.get(key) || { user: entry.user, points: 0, podiums: 0, entries: 0 }
    prev.points += POINTS[entry.rank - 1] || 1
    if (entry.rank <= 3) prev.podiums += 1
    prev.entries += 1
    map.set(key, prev)
  }
  cs.forEach((c) => {
    ;(c.entries || []).forEach(add)
    ;(c.gallery || []).forEach(add)
  })
  return Array.from(map.values())
    .sort((a, b) => b.points - a.points)
    .slice(0, 8)
}

export default function CommunityPage() {
  const { slug } = useParams()
  const { data, loading, reload } = useAsync(() => loadCommunity(slug), [slug])

  if (loading) return <Loading label="Loading club…" className="min-h-[60vh]" />
  if (!data?.club) return <NotFound />

  const club = data.club
  const all = data.all || []
  const members = data.members || []
  const active = all.filter((c) => c.status !== 'closed')
  const past = all.filter((c) => c.status === 'closed')
  const standings = clubStandings(all)

  return (
    <>
      <ClubHeader club={club} />

      <div className="container-page py-8">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatTile icon={Users} value={formatNumber(club.members)} label="Members" />
          <StatTile icon={Flag} value={all.length} label="Events run" />
          <StatTile icon={Trophy} value={past.length} label="Finished events" />
          <StatTile icon={Upload} value={active.length} label="Live now" />
        </div>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-10">
            <Section title="Active challenges" count={active.length}>
              {active.length ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {active.map((c) => (
                    <ChallengeCard key={c.id} challenge={c} club={club} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Flag}
                  title="No active challenges"
                  description="This club has no open events."
                />
              )}
            </Section>

            {past.length > 0 && (
              <Section title="Past challenges" count={past.length}>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {past.map((c) => (
                    <ChallengeCard key={c.id} challenge={c} club={club} />
                  ))}
                </div>
              </Section>
            )}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-20">
            <MembersCard club={club} members={members} loading={loading} onChanged={reload} />
            <AboutCard club={club} />
            <StandingsCard standings={standings} />
          </aside>
        </div>
      </div>
    </>
  )
}

function ClubHeader({ club }) {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.06]">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(70% 120% at 8% 0%, ${hexToRgba(club.accent, 0.5)}, transparent 60%), radial-gradient(60% 110% at 92% 0%, ${hexToRgba(club.accent, 0.22)}, transparent 60%)`,
        }}
      />
      <div className="absolute inset-0 bg-grid opacity-50 mask-fade-b" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-ink-950/70" />

      <div className="container-page relative pb-8 pt-16">
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-zinc-400">
          <Link to="/clubs" className="hover:text-white">Communities</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-zinc-500">{club.name}</span>
        </nav>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <ClubMark club={club} size={76} className="shadow-pop" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{club.name}</h1>
                {club.verified && <ShieldCheck className="h-6 w-6 text-brand-400" />}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                <span className="chip">[{club.tag}]</span>
                <span>{club.region}</span>
                <span className="text-zinc-600">·</span>
                <span>Since {club.founded}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button href="#">
              <MessagesSquare className="h-4 w-4" />
              Join on Discord
            </Button>
            <Button to="/create" variant="secondary">
              <Plus className="h-4 w-4" />
              New challenge
            </Button>
          </div>
        </div>

        <p className="mt-5 max-w-2xl text-balance text-zinc-300">{club.tagline}</p>
      </div>
    </section>
  )
}

function Section({ title, count, children }) {
  return (
    <section>
      <div className="mb-5 flex items-center gap-2.5">
        <h2 className="text-xl font-bold">{title}</h2>
        {typeof count === 'number' && <Badge tone="neutral">{count}</Badge>}
      </div>
      {children}
    </section>
  )
}

function AboutCard({ club }) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">About</h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{club.about}</p>
      <div className="mt-4 space-y-2.5 border-t border-white/[0.06] pt-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-zinc-400">
            <CalendarDays className="h-4 w-4 text-zinc-500" />
            Founded
          </span>
          <span className="font-medium text-white">{club.founded}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-zinc-400">
            <Users className="h-4 w-4 text-zinc-500" />
            Members
          </span>
          <span className="font-medium text-white">{formatNumber(club.members)}</span>
        </div>
      </div>
      <Button href="#" variant="secondary" size="sm" className="mt-4 w-full">
        <MessagesSquare className="h-4 w-4" />
        {club.discord}
      </Button>
    </div>
  )
}

function StandingsCard({ standings }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/[0.06] p-5">
        <Medal className="h-5 w-5 text-brand-400" />
        <h3 className="font-bold">Season standings</h3>
      </div>
      <div className="divide-y divide-white/[0.05]">
        {standings.map((s, i) => (
          <div key={s.user.tag} className="flex items-center gap-3 px-5 py-3">
            <span className="w-5 text-center font-num text-sm font-semibold text-zinc-500">
              {i + 1}
            </span>
            <Nameplate
              user={s.user}
              size={32}
              showSub={false}
              className="flex-1"
            />
            <span className="font-num text-sm font-bold tabular-nums text-white">{s.points}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-white/[0.06] px-5 py-2.5 text-center text-xs text-zinc-500">
        Points from verified results this season
      </div>
    </div>
  )
}

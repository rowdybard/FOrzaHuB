import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ShieldCheck,
  Users,
  Trophy,
  Flag,
  Upload,
  MessagesSquare,
  CalendarDays,
  Check,
  ChevronRight,
  Copy,
  Plus,
  Medal,
  Edit3,
  Trash2,
  CircleAlert,
  LogIn,
  UserPlus,
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
import {
  deleteChallenge,
  getClubBySlug,
  getChallengesByClub,
  getClubMembers,
  getMyClubMemberships,
  joinClub,
} from '../data/api'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../hooks/useAuth'
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
  const { enabled, user, profile, signIn } = useAuth()
  const { data, loading, reload } = useAsync(() => loadCommunity(slug), [slug])

  if (loading) return <Loading label="Loading club…" className="min-h-[60vh]" />
  if (!data?.club) return <NotFound />

  const club = data.club
  const all = data.all || []
  const members = data.members || []
  const live = all.filter((c) => c.status === 'live')
  const active = all.filter((c) => c.status !== 'closed')
  const past = all.filter((c) => c.status === 'closed')
  const standings = clubStandings(all)
  const isStaff = profile?.role === 'admin' || profile?.role === 'steward'
  const canManage = isStaff || (!!user && user.id === club.ownerId)
  const isMember = !!user && members.some((member) => member.id === user.id)

  return (
    <>
      <ClubHeader club={club} canManage={canManage} onChanged={reload} />

      <div className="container-page py-8">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatTile icon={Users} value={formatNumber(club.members)} label="Members" />
          <StatTile icon={Flag} value={all.length} label="Events run" />
          <StatTile icon={Trophy} value={past.length} label="Finished events" />
          <StatTile icon={Upload} value={live.length} label="Live now" />
        </div>

        <ClubStartPanel
          club={club}
          enabled={enabled}
          user={user}
          signIn={signIn}
          isMember={isMember}
          liveChallenge={live[0] || null}
          nextChallenge={active[0] || null}
          onChanged={reload}
        />

        {canManage && (
          <AdminTools
            club={club}
            challenges={all}
            isStaff={isStaff}
            onChanged={reload}
          />
        )}

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
                  action={
                    canManage ? (
                      <Button to="/create">
                        <Plus className="h-4 w-4" />
                        Create first event
                      </Button>
                    ) : (
                      <Button to="/challenges" variant="secondary">
                        Browse events
                      </Button>
                    )
                  }
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
            <MembersCard
              club={club}
              members={members}
              loading={loading}
              onChanged={reload}
              canManage={canManage}
            />
            <AboutCard club={club} />
            <StandingsCard standings={standings} />
          </aside>
        </div>
      </div>
    </>
  )
}

function ClubHeader({ club, canManage, onChanged }) {
  const hasDiscord = !!club.discord
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
                {club.founded && (
                  <>
                    <span className="text-zinc-600">·</span>
                    <span>Since {club.founded}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <ClubInviteActions club={club} onChanged={onChanged} />
            {hasDiscord && (
              <Button href={club.discord} target="_blank" rel="noreferrer">
                <MessagesSquare className="h-4 w-4" />
                Join on Discord
              </Button>
            )}
            {canManage && (
              <Button to="/create" variant="secondary">
                <Plus className="h-4 w-4" />
                New challenge
              </Button>
            )}
          </div>
        </div>

        <p className="mt-5 max-w-2xl text-balance text-zinc-300">{club.tagline || club.about}</p>
      </div>
    </section>
  )
}

function ClubInviteActions({ club, onChanged }) {
  const { enabled, user, signIn } = useAuth()
  const [memberships, setMemberships] = useState([])
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const refreshMemberships = async () => {
    if (!enabled || !user) {
      setMemberships([])
      return
    }
    try {
      setMemberships(await getMyClubMemberships(user.id))
    } catch (err) {
      console.error('[club] invite membership lookup failed', err)
    }
  }

  useEffect(() => {
    refreshMemberships()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, user?.id, club.id])

  const currentMembership = memberships.find((membership) => membership.id === club.id)
  const isMember = !!currentMembership
  const atClubLimit = memberships.length >= 5 && !isMember
  const inviteUrl = `${window.location.origin}/club/${club.slug}`

  const copyInvite = async () => {
    setError('')
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteUrl)
      } else {
        const input = document.createElement('textarea')
        input.value = inviteUrl
        input.setAttribute('readonly', '')
        input.style.position = 'fixed'
        input.style.opacity = '0'
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
      setError('Copy was blocked. Use the invite link below.')
    }
  }

  const join = async () => {
    if (!user) {
      signIn()
      return
    }
    setBusy(true)
    setError('')
    try {
      await joinClub(club.id, user.id)
      await refreshMemberships()
      onChanged?.()
    } catch (err) {
      console.error('[club] join from invite failed', err)
      setError(err?.message || 'Could not join this club.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2 sm:justify-end">
        <Button type="button" variant="secondary" onClick={copyInvite}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy invite'}
        </Button>
        {enabled && !user ? (
          <Button type="button" onClick={signIn}>
            <LogIn className="h-4 w-4" />
            Sign in to join
          </Button>
        ) : enabled && isMember ? (
          <Button type="button" variant="success" disabled>
            <Check className="h-4 w-4" />
            Joined
          </Button>
        ) : enabled && atClubLimit ? (
          <Button type="button" disabled>
            <UserPlus className="h-4 w-4" />
            Club limit reached
          </Button>
        ) : enabled ? (
          <Button type="button" onClick={join} disabled={busy}>
            <UserPlus className="h-4 w-4" />
            {busy ? 'Joining...' : `Join ${club.tag}`}
          </Button>
        ) : null}
      </div>
      <p className="max-w-sm truncate text-right font-mono text-[11px] text-zinc-400">
        {inviteUrl}
      </p>
      {error && <p className="max-w-sm text-right text-xs text-rose-300">{error}</p>}
    </div>
  )
}

function ClubStartPanel({ club, enabled, user, signIn, isMember, liveChallenge, nextChallenge, onChanged }) {
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const inviteUrl = `${window.location.origin}/club/${club.slug}`

  const copyInvite = async () => {
    setError('')
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteUrl)
      } else {
        const input = document.createElement('textarea')
        input.value = inviteUrl
        input.setAttribute('readonly', '')
        input.style.position = 'fixed'
        input.style.opacity = '0'
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
      setError('Copy was blocked. Use the invite link in the header.')
    }
  }

  const join = async () => {
    if (!user) {
      signIn()
      return
    }
    setBusy(true)
    setError('')
    try {
      await joinClub(club.id, user.id)
      onChanged?.()
    } catch (err) {
      console.error('[club] start panel join failed', err)
      setError(err?.message || 'Could not join this club.')
    } finally {
      setBusy(false)
    }
  }

  const primaryAction = (() => {
    if (enabled && !user) {
      return (
        <Button type="button" onClick={signIn}>
          <LogIn className="h-4 w-4" />
          Sign in
        </Button>
      )
    }
    if (enabled && !isMember) {
      return (
        <Button type="button" onClick={join} disabled={busy}>
          <UserPlus className="h-4 w-4" />
          {busy ? 'Joining...' : 'Join club'}
        </Button>
      )
    }
    if (liveChallenge) {
      return (
        <Button to={`/submit/${liveChallenge.slug}`}>
          <Upload className="h-4 w-4" />
          Submit run
        </Button>
      )
    }
    if (nextChallenge) {
      return (
        <Button to={`/c/${nextChallenge.slug}`} variant="secondary">
          <Flag className="h-4 w-4" />
          View event
        </Button>
      )
    }
    return (
      <Button to="/challenges" variant="secondary">
        <Flag className="h-4 w-4" />
        Watch events
      </Button>
    )
  })()

  const steps = [
    { label: copied ? 'Invite copied' : 'Invite link', done: copied, icon: Copy },
    { label: isMember ? 'Member access' : 'Membership', done: isMember, icon: UserPlus },
    { label: liveChallenge ? 'Submissions open' : 'No live event', done: false, icon: Upload },
  ]

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-brand-500/20 bg-brand-500/[0.045] p-4 sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">
            <Trophy className="h-3.5 w-3.5" />
            Club board
          </div>
          <h2 className="mt-1.5 text-lg font-bold text-white">
            {liveChallenge ? liveChallenge.title : 'Proof-backed runs. Clean standings.'}
          </h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.label}
                  className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-ink-950/35 px-3 py-2 text-sm text-zinc-300"
                >
                  {step.done ? <Check className="h-4 w-4 text-emerald-300" /> : <Icon className="h-4 w-4 text-brand-300" />}
                  {step.label}
                </div>
              )
            })}
          </div>
          {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button type="button" variant="secondary" onClick={copyInvite}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy invite'}
          </Button>
          {primaryAction}
        </div>
      </div>
    </section>
  )
}

function AdminTools({ club, challenges, isStaff, onChanged }) {
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const remove = async (challenge) => {
    const label = challenge.title || 'this event'
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return
    setBusyId(challenge.id)
    setError('')
    try {
      await deleteChallenge(challenge.id)
      onChanged?.()
    } catch (err) {
      console.error('[community] delete challenge failed', err)
      setError(err?.message || 'Could not delete this event.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-brand-500/15 bg-brand-500/[0.04] p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Club admin
          </div>
          <h2 className="mt-1 text-lg font-bold text-white">{club.name} tools</h2>
        </div>
        <Button to="/create" size="sm" variant="secondary">
          <Plus className="h-4 w-4" />
          New challenge
        </Button>
      </div>

      {error && (
        <div className="mt-4 flex gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/[0.07] p-3 text-sm text-rose-200">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-4 divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.07] bg-ink-950/35">
        {challenges.length === 0 ? (
          <div className="p-4 text-sm text-zinc-500">No events to manage yet.</div>
        ) : (
          challenges.map((challenge) => (
            <div key={challenge.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-white">{challenge.title}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span className="capitalize text-zinc-400">{challenge.status}</span>
                  <span>{formatNumber(challenge.submissionCount || 0)} submissions</span>
                </div>
              </div>
              <Button
                to={`/create/${challenge.slug}`}
                size="icon"
                variant="ghost"
                title={isStaff ? 'Edit event' : 'Correct title'}
                aria-label={isStaff ? 'Edit event' : 'Correct title'}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <button
                type="button"
                title="Delete event"
                aria-label="Delete event"
                onClick={() => remove(challenge)}
                disabled={busyId === challenge.id}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-300 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
              >
                {busyId === challenge.id ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ))
        )}
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
  const hasDiscord = !!club.discord
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">About</h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        {club.about || 'No community profile has been added yet.'}
      </p>
      <div className="mt-4 space-y-2.5 border-t border-white/[0.06] pt-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-zinc-400">
            <CalendarDays className="h-4 w-4 text-zinc-500" />
            Founded
          </span>
          <span className="font-medium text-white">{club.founded || 'Not set'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-zinc-400">
            <Users className="h-4 w-4 text-zinc-500" />
            Members
          </span>
          <span className="font-medium text-white">{formatNumber(club.members)}</span>
        </div>
      </div>
      {hasDiscord ? (
        <Button
          href={club.discord}
          target="_blank"
          rel="noreferrer"
          variant="secondary"
          size="sm"
          className="mt-4 w-full"
        >
          <MessagesSquare className="h-4 w-4" />
          Discord
        </Button>
      ) : (
        <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-center text-xs text-zinc-500">
          Discord link not set
        </div>
      )}
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
        {standings.length === 0 ? (
          <div className="px-5 py-4 text-sm text-zinc-500">No verified results yet.</div>
        ) : standings.map((s, i) => (
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

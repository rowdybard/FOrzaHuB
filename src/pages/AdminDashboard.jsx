import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  X,
  Flag,
  Clock,
  ShieldCheck,
  Play,
  ExternalLink,
  Download,
  Inbox,
  CircleAlert,
  Trophy,
  ChevronDown,
  CheckCircle2,
  UserCog,
  Trash2,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import Cover from '../components/ui/Cover'
import StatTile from '../components/ui/StatTile'
import { TypeBadge } from '../components/ui/Badge'
import EmptyState from '../components/common/EmptyState'
import Loading from '../components/common/Loading'
import { getProfiles, getReviewQueue, reviewSubmission, updateProfileRole, getChallengesWithClubs, deleteChallenge } from '../data/api'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../hooks/useAuth'
import { getType, formatMetric } from '../lib/challengeTypes'
import { cn, timeAgo, formatNumber } from '../lib/utils'

const FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'flagged', label: 'Flagged' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
]

const STATUS_META = {
  pending: { label: 'Pending', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-300', icon: Clock },
  flagged: { label: 'Flagged', cls: 'border-rose-500/30 bg-rose-500/10 text-rose-300', icon: Flag },
  approved: { label: 'Approved', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300', icon: Check },
  rejected: { label: 'Rejected', cls: 'border-white/[0.1] bg-white/[0.06] text-zinc-300', icon: X },
}

function StatusPill({ status }) {
  const m = STATUS_META[status]
  const Icon = m.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-semibold', m.cls)}>
      <Icon className="h-3 w-3" />
      {m.label}
    </span>
  )
}

export default function AdminDashboard() {
  const { enabled, user, profile, loading: authLoading, signIn } = useAuth()
  const isStaff = !enabled || ['admin', 'steward'].includes(profile?.role)
  const isAdmin = !enabled || profile?.role === 'admin'
  const { data, loading, error: queueError } = useAsync(
    () => (isStaff ? getReviewQueue() : Promise.resolve([])),
    [isStaff],
  )
  const [overrides, setOverrides] = useState({})
  const [filter, setFilter] = useState('pending')
  const [selectedId, setSelectedId] = useState(null)
  const [actionError, setActionError] = useState('')
  const [decidingId, setDecidingId] = useState(null)

  const items = useMemo(
    () => (data || []).map((i) => (overrides[i.id] ? { ...i, status: overrides[i.id] } : i)),
    [data, overrides],
  )

  const counts = useMemo(() => {
    const c = { pending: 0, flagged: 0, approved: 0, rejected: 0, all: items.length }
    items.forEach((i) => (c[i.status] = (c[i.status] || 0) + 1))
    return c
  }, [items])

  const filtered = useMemo(() => {
    if (filter === 'all') return items
    return items.filter((i) => i.status === filter)
  }, [items, filter])

  useEffect(() => {
    if (!filtered.some((i) => i.id === selectedId)) {
      setSelectedId(filtered[0]?.id || null)
    }
  }, [filtered, selectedId])

  const selected = items.find((i) => i.id === selectedId)

  const decide = async (id, status) => {
    setActionError('')
    setDecidingId(id)
    const previous = items.find((i) => i.id === id)?.status
    setOverrides((prev) => ({ ...prev, [id]: status }))
    try {
      await reviewSubmission(id, status)
    } catch (err) {
      console.error('[admin] reviewSubmission failed', err)
      setOverrides((prev) => {
        const next = { ...prev }
        if (previous) next[id] = previous
        else delete next[id]
        return next
      })
      setActionError(err?.message || 'Review action failed. Check staff access and try again.')
    } finally {
      setDecidingId(null)
    }
  }

  if (enabled && authLoading) return <Loading label="Checking access..." className="min-h-[60vh]" />

  if (enabled && !user) {
    return (
      <div className="container-page grid min-h-[60vh] place-items-center py-16 text-center">
        <div className="max-w-md">
          <ShieldCheck className="mx-auto h-8 w-8 text-brand-400" />
          <h1 className="mt-4 text-2xl font-extrabold">Staff sign in required</h1>
          <p className="mt-2 text-zinc-400">Sign in with Discord to access the review queue.</p>
          <Button onClick={signIn} className="mt-6">Sign in</Button>
        </div>
      </div>
    )
  }

  if (enabled && user && !isStaff) {
    return (
      <div className="container-page grid min-h-[60vh] place-items-center py-16 text-center">
        <div className="max-w-md">
          <ShieldCheck className="mx-auto h-8 w-8 text-zinc-500" />
          <h1 className="mt-4 text-2xl font-extrabold">Staff access only</h1>
          <p className="mt-2 text-zinc-400">Your account is signed in, but it is not a steward or admin.</p>
        </div>
      </div>
    )
  }

  if (loading) return <Loading label="Loading queue..." className="min-h-[60vh]" />

  if (queueError) {
    return (
      <div className="container-page grid min-h-[60vh] place-items-center py-16 text-center">
        <div className="max-w-md">
          <CircleAlert className="mx-auto h-8 w-8 text-rose-400" />
          <h1 className="mt-4 text-2xl font-extrabold">Could not load review queue</h1>
          <p className="mt-2 text-zinc-400">
            Check staff access and RLS policies, then try again.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin
          </div>
          <h1 className="mt-1.5 text-2xl font-extrabold sm:text-3xl">Admin tools</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Verify submissions before they hit the public leaderboard.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/challenges"
            className="inline-flex items-center gap-2 card-readable rounded-xl px-3.5 py-2.5 text-sm text-zinc-300 transition-colors hover:text-white"
          >
            All events
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          </Link>
          <Button
            variant="secondary"
            onClick={() => {
              try {
                const rows = ['challenge,user,result,status,proof_url,submitted_at']
                filtered.forEach((i) => {
                  const challenge = i.challengeTitle || ''
                  const user = i.user?.tag || ''
                  const result = i.value ?? i.title ?? ''
                  const status = i.status || ''
                  const proof = i.proof?.url || ''
                  const date = i.submittedAt || ''
                  rows.push([challenge, user, result, status, proof, date]
                    .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                    .join(','))
                })
                const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `submissions-export-${new Date().toISOString().slice(0, 10)}.csv`
                a.click()
                URL.revokeObjectURL(url)
              } catch (err) {
                console.error('[admin] export failed', err)
                setActionError('Export failed. Try again.')
              }
            }}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile icon={Inbox} value={counts.pending ?? 0} label="Awaiting review" />
        <StatTile icon={Flag} value={counts.flagged ?? 0} label="Flagged" />
        <StatTile icon={CheckCircle2} value={counts.approved ?? 0} label="Approved" />
        <StatTile icon={Trophy} value={counts.all ?? 0} label="Total" />
      </div>

      {isAdmin && <AccessPanel currentUserId={user?.id} />}
      {isStaff && <EventManagementPanel />}

      {/* Filters */}
      <div className="no-scrollbar mt-8 flex gap-1.5 overflow-x-auto card-readable rounded-xl p-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
              filter === f.id ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:text-white',
            )}
          >
            {f.label}
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-[11px] font-num',
                filter === f.id ? 'bg-brand-500/20 text-brand-300' : 'bg-white/[0.06] text-zinc-500',
              )}
            >
              {counts[f.id] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Master / detail */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <div className="space-y-2.5">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Queue clear"
              description="Nothing to review in this view. Nice work."
            />
          ) : (
            filtered.map((s) => (
              <QueueRow
                key={s.id}
                submission={s}
                active={s.id === selectedId}
                onClick={() => setSelectedId(s.id)}
              />
            ))
          )}
        </div>

        <div>
          {selected ? (
            <DetailPanel
              submission={selected}
              onDecide={decide}
              actionError={actionError}
              deciding={decidingId === selected.id}
            />
          ) : (
            <div className="card grid min-h-[400px] place-items-center p-10 text-center text-sm text-zinc-400">
              Select a submission to review
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AccessPanel({ currentUserId }) {
  const { data, loading, error, reload } = useAsync(() => getProfiles(), [])
  const [updatingId, setUpdatingId] = useState(null)
  const [message, setMessage] = useState('')
  const profiles = data || []

  const changeRole = async (target, role) => {
    if (!target || target.id === currentUserId) return
    setUpdatingId(target.id)
    setMessage('')
    try {
      await updateProfileRole(target.id, role)
      setMessage(`${target.tag || target.name} access updated.`)
      reload()
    } catch (err) {
      console.error('[admin] updateProfileRole failed', err)
      setMessage(err?.message || 'Could not update access.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <section className="mt-6 card-readable rounded-2xl p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-400">
            <UserCog className="h-3.5 w-3.5" />
            Access
          </div>
          <h2 className="mt-1 text-lg font-bold text-white">Staff access settings</h2>
        </div>
        {message && <p className="text-sm text-zinc-400">{message}</p>}
      </div>

      {loading ? (
        <div className="mt-4 text-sm text-zinc-500">Loading profiles...</div>
      ) : error ? (
        <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2 text-sm text-rose-200">
          Could not load profiles.
        </div>
      ) : profiles.length === 0 ? (
        <div className="mt-4 text-sm text-zinc-500">No profiles yet.</div>
      ) : (
        <div className="mt-4 card-readable divide-y divide-white/[0.06] overflow-hidden rounded-xl">
          {profiles.map((p) => (
            <div key={p.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={p.name} size={34} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{p.name}</div>
                  <div className="truncate text-xs text-zinc-500">{p.tag}</div>
                </div>
              </div>
              <select
                value={p.role}
                disabled={p.id === currentUserId || updatingId === p.id}
                onChange={(event) => changeRole(p, event.target.value)}
                className="h-10 rounded-lg border border-white/[0.08] bg-ink-900 px-3 text-sm text-white focus:border-brand-500/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="racer" className="bg-ink-900">Racer</option>
                <option value="steward" className="bg-ink-900">Steward</option>
                <option value="admin" className="bg-ink-900">Admin</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function EventManagementPanel() {
  const { data, loading, error, reload } = useAsync(() => getChallengesWithClubs(), [])
  const [busyId, setBusyId] = useState(null)
  const [message, setMessage] = useState('')
  const challenges = data || []

  const remove = async (challenge) => {
    const label = challenge.title || 'this event'
    if (!window.confirm(`Delete "${label}"? This will also remove all submissions for it. This cannot be undone.`)) return
    setBusyId(challenge.id)
    setMessage('')
    try {
      await deleteChallenge(challenge.id)
      setMessage(`Deleted "${label}".`)
      reload()
    } catch (err) {
      console.error('[admin] deleteChallenge failed', err)
      setMessage(err?.message || 'Could not delete this event.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="mt-6 card-readable rounded-2xl p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-400">
            <Trash2 className="h-3.5 w-3.5" />
            Event Management
          </div>
          <h2 className="mt-1 text-lg font-bold text-white">All events across all clubs</h2>
        </div>
        {message && <p className="text-sm text-zinc-400">{message}</p>}
      </div>

      {loading ? (
        <div className="mt-4 text-sm text-zinc-500">Loading events...</div>
      ) : error ? (
        <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2 text-sm text-rose-200">
          Could not load events.
        </div>
      ) : challenges.length === 0 ? (
        <div className="mt-4 text-sm text-zinc-500">No events exist yet.</div>
      ) : (
        <div className="mt-4 card-readable divide-y divide-white/[0.06] overflow-hidden rounded-xl">
          {challenges.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">{c.title}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                  <span className="capitalize">{c.status}</span>
                  <span className="text-zinc-600">·</span>
                  <span className="truncate">{c.club?.name || 'No club'}</span>
                  {c.season && (
                    <>
                      <span className="text-zinc-600">·</span>
                      <span>{c.season}</span>
                    </>
                  )}
                </div>
              </div>
              <Link
                to={`/c/${c.slug}`}
                className="shrink-0 text-xs font-medium text-zinc-400 hover:text-white"
              >
                View
              </Link>
              <button
                type="button"
                title="Delete event"
                aria-label="Delete event"
                onClick={() => remove(c)}
                disabled={busyId === c.id}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-rose-500/15 bg-rose-500/[0.05] text-rose-300/80 transition-colors hover:bg-rose-500/15 disabled:opacity-50"
              >
                {busyId === c.id ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function QueueRow({ submission, active, onClick }) {
  const t = getType(submission.typeId)
  const displayStatus = submission.status
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border p-3.5 text-left transition-all',
        active
          ? 'border-brand-500/40 bg-brand-500/[0.06]'
          : 'border-white/[0.06] card-readable hover:border-white/[0.12] hover:bg-ink-800',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <TypeBadge typeId={submission.typeId} size="sm" />
        <StatusPill status={displayStatus} />
      </div>
      <div className="mt-3 flex items-center gap-2.5">
        <Avatar name={submission.user.name} size={32} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-white">{submission.user.tag}</div>
          <div className="truncate text-xs text-zinc-400">{submission.challengeTitle}</div>
        </div>
        <div className="text-right">
          <div className="font-num text-sm font-bold tabular-nums text-white">
            {t.gallery ? submission.title?.split(' ').slice(0, 2).join(' ') : formatMetric(submission.typeId, submission.value)}
          </div>
          <div className="text-[11px] text-zinc-500">{timeAgo(submission.submittedAt)}</div>
        </div>
      </div>
    </button>
  )
}

function isImageUrl(url) {
  if (!url) return false
  const u = url.toLowerCase().split('?')[0]
  return u.endsWith('.png') || u.endsWith('.jpg') || u.endsWith('.jpeg') || u.endsWith('.webp')
}

function ProofPreview({ submission }) {
  const t = getType(submission.typeId)
  const Icon = t.icon
  const isMedia = submission.proof?.type === 'video'
  const proofUrl = submission.proof?.url
  const isImage = !isMedia && isImageUrl(proofUrl)

  if (t.gallery) {
    if (isImageUrl(proofUrl)) {
      return (
        <div className="relative aspect-video overflow-hidden rounded-xl">
          <img src={proofUrl} alt={submission.title || 'Proof'} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/80 to-transparent p-4">
            <div className="text-sm font-semibold text-white">{submission.title}</div>
          </div>
          <a
            href={proofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-ink-950/50 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-md hover:bg-ink-950/70"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open
          </a>
        </div>
      )
    }
    const bg = `linear-gradient(140deg, hsl(${submission.hue || 24} 62% 24%), hsl(${((submission.hue || 24) + 45) % 360} 58% 11%))`
    return (
      <div className="relative aspect-video overflow-hidden rounded-xl" style={{ background: bg }}>
        <div className="absolute inset-0 bg-grid-sm opacity-30" />
        <Icon className="absolute -bottom-4 -right-2 h-28 w-28 text-white opacity-[0.12]" strokeWidth={1.1} />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/80 to-transparent p-4">
          <div className="text-sm font-semibold text-white">{submission.title}</div>
        </div>
        <a
          href={proofUrl || '#'}
          className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-ink-950/50 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-md hover:bg-ink-950/70"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open
        </a>
      </div>
    )
  }

  if (isImage) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-xl">
        <img src={proofUrl} alt="Proof" className="absolute inset-0 h-full w-full object-cover" />
        <a
          href={proofUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-ink-950/50 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-md hover:bg-ink-950/70"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open original
        </a>
      </div>
    )
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl">
      <Cover typeId={submission.typeId} className="absolute inset-0" iconSize="h-44 w-44" />
      <div className="absolute inset-0 grid place-items-center">
        {isMedia ? (
          <span className="grid h-14 w-14 place-items-center rounded-xl bg-ink-950/60 text-white ring-1 ring-white/20 backdrop-blur-md transition-transform hover:scale-105">
            <Play className="h-6 w-6 translate-x-0.5" fill="currentColor" />
          </span>
        ) : (
          <span className="rounded-lg border border-white/15 bg-ink-950/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
            Screenshot proof
          </span>
        )}
      </div>
      <div className="absolute left-3 top-3 rounded-md bg-ink-950/60 px-2 py-1 text-[11px] font-medium text-zinc-200 backdrop-blur-md">
        {isMedia ? 'Clip · 0:42' : 'Image · 1080p'}
      </div>
      <a
        href={proofUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-ink-950/50 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-md hover:bg-ink-950/70"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Open original
      </a>
    </div>
  )
}

function DetailPanel({ submission, onDecide, actionError, deciding }) {
  const t = getType(submission.typeId)
  const decided = submission.status === 'approved' || submission.status === 'rejected'

  return (
    <div className="card overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <TypeBadge typeId={submission.typeId} size="sm" />
            <StatusPill status={submission.status} />
          </div>
          <p className="mt-2 truncate font-bold text-white">
            {submission.challengeTitle}
          </p>
        </div>
        <div className="shrink-0 text-right text-xs text-zinc-500">
          {timeAgo(submission.submittedAt)}
        </div>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[1.4fr_1fr]">
        <ProofPreview submission={submission} />

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar name={submission.user.name} size={44} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-semibold text-white">{submission.user.tag}</span>
                <span className="text-sm">{submission.user.country}</span>
              </div>
              <div className="text-xs text-zinc-400">{submission.user.name} · {submission.user.platform}</div>
            </div>
          </div>

          <div className="card-readable rounded-xl p-4">
            <div className="text-xs uppercase tracking-wider text-zinc-400">
              {t.gallery ? 'Entry' : 'Submitted result'}
            </div>
            <div className="mt-1 font-num text-2xl font-extrabold text-white">
              {t.gallery ? submission.title : formatMetric(submission.typeId, submission.value)}
            </div>
              {submission.shareCode && (
              <div className="mt-2 text-xs text-zinc-400">Share code: <span className="font-num text-zinc-300">{submission.shareCode}</span></div>
            )}
          </div>

          {submission.flag && (
            <div className="flex gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-3 text-sm text-rose-200/90">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              {submission.flag}
            </div>
          )}

          {submission.note && (
            <div className="rounded-xl border border-white/[0.06] p-3 text-sm text-zinc-400">
              <span className="text-zinc-500">Racer note: </span>
              {submission.note}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/[0.06] p-5">
        {actionError && (
          <div className="mb-4 flex gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-3 text-sm text-rose-200/90">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            {actionError}
          </div>
        )}
        {decided ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-400">
              Decision recorded:{' '}
              <span className={submission.status === 'approved' ? 'text-emerald-300' : 'text-rose-300'}>
                {submission.status}
              </span>
            </p>
            <Button
              variant="ghost"
              size="sm"
              disabled={deciding}
              onClick={() => onDecide(submission.id, 'pending')}
            >
              {deciding ? 'Saving...' : 'Reopen'}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Button variant="success" disabled={deciding} onClick={() => onDecide(submission.id, 'approved')}>
              <Check className="h-4 w-4" />
              {deciding ? 'Saving...' : 'Approve'}
            </Button>
            <Button variant="secondary" disabled={deciding} onClick={() => onDecide(submission.id, 'flagged')}>
              <Flag className="h-4 w-4" />
              Flag
            </Button>
            <Button variant="danger" disabled={deciding} onClick={() => onDecide(submission.id, 'rejected')}>
              <X className="h-4 w-4" />
              Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

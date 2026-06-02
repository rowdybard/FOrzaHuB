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
  Hourglass,
  CheckCircle2,
  ClipboardCheck,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import Cover from '../components/ui/Cover'
import StatTile from '../components/ui/StatTile'
import { TypeBadge } from '../components/ui/Badge'
import EmptyState from '../components/common/EmptyState'
import { submissions as seed, challenges, allChallenges, getPrerequisite } from '../data/mock'
import { getType, formatMetric } from '../lib/challengeTypes'
import { cn, timeAgo, formatNumber } from '../lib/utils'

const FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'held', label: 'Held' },
  { id: 'flagged', label: 'Flagged' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
]

const STATUS_META = {
  pending: { label: 'Pending', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-300', icon: Clock },
  held: { label: 'Held', cls: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300', icon: ClipboardCheck },
  flagged: { label: 'Flagged', cls: 'border-rose-500/30 bg-rose-500/10 text-rose-300', icon: Flag },
  approved: { label: 'Approved', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300', icon: Check },
  rejected: { label: 'Rejected', cls: 'border-white/10 bg-white/[0.04] text-zinc-400', icon: X },
}

function StatusPill({ status }) {
  const m = STATUS_META[status]
  const Icon = m.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold', m.cls)}>
      <Icon className="h-3 w-3" />
      {m.label}
    </span>
  )
}

function provisionalRank(challenge, value, typeId) {
  const t = getType(typeId)
  if (t.gallery || !challenge || value == null) return null
  const vals = (challenge.entries || []).map((e) => e.value).filter((v) => v != null)
  const all = [...vals, value].sort((a, b) => (t.sort === 'asc' ? a - b : b - a))
  return all.indexOf(value) + 1
}

// Determine if a submission is held (main entry waiting on prereq approval)
function isHeld(submission, allItems) {
  const challenge = allChallenges.find((c) => c.id === submission.challengeId)
  if (!challenge) return false
  const prereq = getPrerequisite(challenge)
  if (!prereq) return false
  const prereqSub = allItems.find(
    (s) => s.challengeId === prereq.id && s.user.tag === submission.user.tag,
  )
  return prereqSub ? prereqSub.status !== 'approved' : true
}

export default function AdminDashboard() {
  const [items, setItems] = useState(seed)
  const [filter, setFilter] = useState('pending')

  // Annotate items with held flag
  const annotated = useMemo(
    () => items.map((i) => ({ ...i, _held: i.status === 'pending' && isHeld(i, items) })),
    [items],
  )

  const [selectedId, setSelectedId] = useState(
    annotated.find((s) => s.status === 'pending' && !s._held)?.id,
  )

  const counts = useMemo(() => {
    const c = { pending: 0, held: 0, flagged: 0, approved: 0, rejected: 0, all: annotated.length }
    annotated.forEach((i) => {
      if (i._held) { c.held += 1 } else { c[i.status] = (c[i.status] || 0) + 1 }
    })
    return c
  }, [annotated])

  const filtered = useMemo(() => {
    if (filter === 'all') return annotated
    if (filter === 'held') return annotated.filter((i) => i._held)
    return annotated.filter((i) => i.status === filter && !i._held)
  }, [annotated, filter])

  useEffect(() => {
    if (!filtered.some((i) => i.id === selectedId)) {
      setSelectedId(filtered[0]?.id)
    }
  }, [filtered, selectedId])

  const selected = items.find((i) => i.id === selectedId)

  const decide = (id, status) => {
    setItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, status } : i))
      // Auto-release held submissions when a prereq sub-challenge is approved
      if (status === 'approved') {
        const approvedSub = next.find((i) => i.id === id)
        const parentChallenge = approvedSub
          ? allChallenges.find((c) => c.id === approvedSub.challengeId && c.isSubChallenge)
          : null
        if (parentChallenge) {
          return next.map((i) =>
            i.challengeId === parentChallenge.parentId && i.user.tag === approvedSub.user.tag
              ? { ...i, status: 'pending' }
              : i,
          )
        }
      }
      return next
    })
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
          <h1 className="mt-1.5 text-2xl font-extrabold sm:text-3xl">Review queue</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Verify submissions before they hit the public leaderboard.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-ink-900/60 px-3.5 py-2.5 text-sm text-zinc-300 transition-colors hover:text-white">
            All events
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          </button>
          <Button variant="secondary">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile icon={Inbox} value={counts.pending} label="Awaiting review" />
        <StatTile icon={ClipboardCheck} value={counts.held} label="Held (prereq)" />
        <StatTile icon={Flag} value={counts.flagged} label="Flagged" />
        <StatTile icon={CheckCircle2} value={counts.approved} label="Approved" />
      </div>

      {/* Filters */}
      <div className="no-scrollbar mt-8 flex gap-1.5 overflow-x-auto rounded-xl border border-white/[0.06] bg-ink-900/60 p-1">
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
                'rounded-full px-1.5 py-0.5 text-[11px] font-num',
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
        {filter === 'held' && filtered.length > 0 && (
          <p className="px-1 text-xs text-zinc-500">
            These entries are waiting on a qualifier approval. They'll move to Pending automatically once the sub-challenge is approved.
          </p>
        )}
        </div>

        <div>
          {selected ? (
            <DetailPanel submission={selected} onDecide={decide} />
          ) : (
            <div className="card grid min-h-[400px] place-items-center p-10 text-center text-sm text-zinc-500">
              Select a submission to review
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function QueueRow({ submission, active, onClick }) {
  const t = getType(submission.typeId)
  const displayStatus = submission._held ? 'held' : submission.status
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border p-3.5 text-left transition-all',
        active
          ? 'border-brand-500/40 bg-brand-500/[0.06]'
          : 'border-white/[0.06] bg-ink-850/60 hover:border-white/[0.12] hover:bg-ink-800',
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
          <div className="truncate text-xs text-zinc-500">{submission.challengeTitle}</div>
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

function ProofPreview({ submission }) {
  const t = getType(submission.typeId)
  const Icon = t.icon
  const isMedia = submission.proof?.type === 'video'

  if (t.gallery) {
    const bg = `linear-gradient(140deg, hsl(${submission.hue || 24} 62% 24%), hsl(${((submission.hue || 24) + 45) % 360} 58% 11%))`
    return (
      <div className="relative aspect-video overflow-hidden rounded-xl" style={{ background: bg }}>
        <div className="absolute inset-0 bg-grid-sm opacity-30" />
        <Icon className="absolute -bottom-4 -right-2 h-28 w-28 text-white opacity-[0.12]" strokeWidth={1.1} />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/80 to-transparent p-4">
          <div className="text-sm font-semibold text-white">{submission.title}</div>
        </div>
        <a
          href={submission.proof?.url || '#'}
          className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-ink-950/50 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-md hover:bg-ink-950/70"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open
        </a>
      </div>
    )
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl">
      <Cover typeId={submission.typeId} className="absolute inset-0" iconSize="h-44 w-44" />
      <div className="absolute inset-0 grid place-items-center">
        {isMedia ? (
          <span className="grid h-14 w-14 place-items-center rounded-full bg-ink-950/60 text-white ring-1 ring-white/20 backdrop-blur-md transition-transform hover:scale-105">
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
        href={submission.proof?.url || '#'}
        className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-ink-950/50 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-md hover:bg-ink-950/70"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Open original
      </a>
    </div>
  )
}

function DetailPanel({ submission, onDecide }) {
  const t = getType(submission.typeId)
  const challenge = allChallenges.find((c) => c.id === submission.challengeId)
  const rank = provisionalRank(challenge, submission.value, submission.typeId)
  const decided = submission.status === 'approved' || submission.status === 'rejected'
  const held = submission._held

  return (
    <div className="card overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <TypeBadge typeId={submission.typeId} size="sm" />
            <StatusPill status={held ? 'held' : submission.status} />
          </div>
          <Link
            to={`/c/${challenge?.slug || ''}`}
            className="mt-2 block truncate font-bold text-white hover:text-brand-300"
          >
            {submission.challengeTitle}
          </Link>
          {held && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-300">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Held — qualifier not yet approved for this racer
            </div>
          )}
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
              <div className="text-xs text-zinc-500">{submission.user.name} · {submission.user.platform}</div>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="text-xs uppercase tracking-wider text-zinc-500">
              {t.gallery ? 'Entry' : 'Submitted result'}
            </div>
            <div className="mt-1 font-num text-2xl font-extrabold text-white">
              {t.gallery ? submission.title : formatMetric(submission.typeId, submission.value)}
            </div>
            {rank && (
              <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-zinc-400">
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                Would rank <span className="font-semibold text-white">#{rank}</span> on the board
              </div>
            )}
            {submission.shareCode && (
              <div className="mt-2 text-xs text-zinc-500">Share code: <span className="font-num text-zinc-300">{submission.shareCode}</span></div>
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
        {held ? (
          <div className="flex items-center gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.06] p-3.5">
            <ClipboardCheck className="h-5 w-5 shrink-0 text-indigo-400" />
            <p className="text-sm text-indigo-200/80">
              Review the qualifier sub-challenge for this racer first. Once approved, this entry will move to the Pending queue automatically.
            </p>
          </div>
        ) : decided ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-400">
              Decision recorded:{' '}
              <span className={submission.status === 'approved' ? 'text-emerald-300' : 'text-rose-300'}>
                {submission.status}
              </span>
            </p>
            <Button variant="ghost" size="sm" onClick={() => onDecide(submission.id, 'pending')}>
              Reopen
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Button variant="success" onClick={() => onDecide(submission.id, 'approved')}>
              <Check className="h-4 w-4" />
              Approve
            </Button>
            <Button variant="secondary" onClick={() => onDecide(submission.id, 'flagged')}>
              <Flag className="h-4 w-4" />
              Flag
            </Button>
            <Button variant="danger" onClick={() => onDecide(submission.id, 'rejected')}>
              <X className="h-4 w-4" />
              Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

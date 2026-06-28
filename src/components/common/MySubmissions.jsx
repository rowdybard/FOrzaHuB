import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Edit3,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import Button from '../ui/Button'
import { timeAgo } from '../../lib/utils'

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Pending' },
  approved: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', label: 'Rejected' },
  flagged: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'Flagged' },
}

export default function MySubmissions({ submissions, onWithdraw }) {
  const [busyId, setBusyId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  if (!submissions || submissions.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-ink-900/40 p-8 text-center">
        <Clock className="mx-auto h-10 w-10 text-zinc-600" />
        <h3 className="mt-4 font-semibold text-white">No submissions yet</h3>
        <p className="mt-1.5 text-sm text-zinc-500">
          When you submit results to events, they'll show up here.
        </p>
        <Button to="/challenges" variant="secondary" size="sm" className="mt-4">
          Browse events
        </Button>
      </div>
    )
  }

  const handleWithdraw = async (submission) => {
    setBusyId(submission.id)
    try {
      await onWithdraw?.(submission.id)
    } finally {
      setBusyId(null)
      setConfirmId(null)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-850/80">
      <div className="divide-y divide-white/[0.04]">
        {submissions.map((sub) => {
          const cfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.pending
          const StatusIcon = cfg.icon
          const isPending = sub.status === 'pending'

          return (
            <div key={sub.id} className="flex items-center gap-4 px-5 py-4">
              <div className={`flex shrink-0 items-center gap-1.5 rounded-lg border ${cfg.border} ${cfg.bg} px-2.5 py-1.5 text-xs font-medium ${cfg.color}`}>
                <StatusIcon className="h-3.5 w-3.5" />
                {cfg.label}
              </div>

              <div className="min-w-0 flex-1">
                <Link
                  to={`/c/${sub.challengeSlug || ''}`}
                  className="font-semibold text-white hover:text-brand-300"
                >
                  {sub.challengeTitle || 'Unknown event'}
                </Link>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span>Result: <span className="font-num text-zinc-300">{sub.value ?? sub.title ?? '—'}</span></span>
                  <span>·</span>
                  <span>{timeAgo(sub.submittedAt)}</span>
                  {sub.proof?.url && sub.proof.url !== '#' && (
                    <>
                      <span>·</span>
                      <a
                        href={sub.proof.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300"
                      >
                        Proof <ExternalLink className="h-3 w-3" />
                      </a>
                    </>
                  )}
                </div>
              </div>

              {isPending && (
                <div className="flex shrink-0 items-center gap-2">
                  {confirmId === sub.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleWithdraw(sub)}
                        disabled={busyId === sub.id}
                        className="rounded-lg bg-rose-500/20 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/30 disabled:opacity-50"
                      >
                        {busyId === sub.id ? 'Withdrawing…' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(sub.id)}
                      title="Withdraw submission"
                      className="grid h-9 w-9 place-items-center rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-300 transition-colors hover:bg-rose-500/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

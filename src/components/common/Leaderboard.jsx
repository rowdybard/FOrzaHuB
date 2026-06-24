import { CheckCircle2 } from 'lucide-react'
import Avatar from '../ui/Avatar'
import ProofTag from './ProofTag'
import { cn } from '../../lib/utils'
import { getType, formatMetric, formatGap, unitSuffix } from '../../lib/challengeTypes'

function Rank({ rank }) {
  const medal = {
    1: 'bg-gradient-to-br from-amber-300 to-yellow-500 text-ink-950 shadow-[0_4px_12px_-4px_rgba(251,191,36,0.7)]',
    2: 'bg-gradient-to-br from-zinc-200 to-zinc-400 text-ink-950',
    3: 'bg-gradient-to-br from-orange-400 to-amber-700 text-ink-950',
  }
  if (rank <= 3) {
    return (
      <span className={cn('grid h-7 w-7 place-items-center rounded-full text-sm font-bold', medal[rank])}>
        {rank}
      </span>
    )
  }
  return (
    <span className="grid h-7 w-7 place-items-center font-num text-sm font-semibold text-zinc-500">
      {rank}
    </span>
  )
}

export default function Leaderboard({ entries = [], typeId, caption, className }) {
  const t = getType(typeId)
  const leader = entries[0]?.value
  const suffix = unitSuffix(typeId)

  return (
    <div className={cn('card overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        <span className="w-7 text-center">#</span>
        <span className="flex-1">Racer</span>
        <span className="hidden w-24 text-right md:block">Submitted</span>
        <span className="hidden w-20 text-right sm:block">Gap</span>
        <span className="w-20 text-right sm:w-28">{t.metricLabel}</span>
        <span className="w-8 sm:w-9" />
      </div>

      <div className="divide-y divide-white/[0.05]">
        {entries.map((e) => {
          const gap = formatGap(typeId, leader, e.value)
          return (
            <div
              key={e.rank}
              className={cn(
                'flex items-center gap-2 px-3 py-3 transition-colors hover:bg-white/[0.025] sm:gap-3 sm:px-4',
                e.rank === 1 && 'bg-brand-500/[0.04]',
              )}
            >
              <span className="flex w-7 justify-center">
                <Rank rank={e.rank} />
              </span>

              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={e.user.name} size={36} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 truncate font-medium text-white">
                    <span className="truncate">{e.user.tag}</span>
                    <span className="text-xs leading-none">{e.user.country}</span>
                  </div>
                  <div className="truncate text-xs text-zinc-500">{e.user.platform}</div>
                </div>
              </div>

              <span className="hidden w-24 text-right text-xs text-zinc-500 md:block">
                {timeShort(e.submittedAt)}
              </span>

              <span className="hidden w-20 text-right font-num text-sm tabular-nums text-zinc-500 sm:block">
                {gap || '—'}
              </span>

              <span className="flex w-20 items-center justify-end gap-1 sm:w-28 sm:gap-1.5">
                {e.verified && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
                <span className="font-num text-[15px] font-bold tabular-nums text-white">
                  {formatMetric(typeId, e.value)}
                </span>
              </span>

              <span className="flex w-8 justify-end sm:w-9">
                <ProofTag proof={e.proof} compact />
              </span>
            </div>
          )
        })}
      </div>

      {caption && (
        <div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-xs text-zinc-500">
          {caption}
          {suffix && <span className="hidden sm:inline">Values in {suffix}</span>}
        </div>
      )}
    </div>
  )
}

function timeShort(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const hr = Math.round(diff / 3600000)
  if (hr < 1) return 'just now'
  if (hr < 24) return `${hr}h ago`
  return `${Math.round(hr / 24)}d ago`
}

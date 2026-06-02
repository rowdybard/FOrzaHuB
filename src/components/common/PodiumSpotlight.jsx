import Avatar from '../ui/Avatar'
import { cn, formatNumber } from '../../lib/utils'
import { getType, formatMetric } from '../../lib/challengeTypes'

const MEDAL = {
  1: 'from-amber-300 to-yellow-500',
  2: 'from-zinc-200 to-zinc-400',
  3: 'from-orange-400 to-amber-700',
}

export default function PodiumSpotlight({ challenge, className }) {
  const t = getType(challenge.typeId)
  const top = ((t.gallery ? challenge.gallery : challenge.entries) || []).slice(0, 3)
  if (!top.length) return null

  return (
    <div className={cn('grid gap-2.5 sm:grid-cols-3', className)}>
      {top.map((e) => (
        <div
          key={e.rank}
          className={cn(
            'flex items-center gap-3 rounded-xl border p-3 transition-colors',
            e.rank === 1
              ? 'border-amber-500/20 bg-amber-500/[0.05]'
              : 'border-white/[0.06] bg-white/[0.02]',
          )}
        >
          <span
            className={cn(
              'grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br text-xs font-bold text-ink-950',
              MEDAL[e.rank],
            )}
          >
            {e.rank}
          </span>
          <Avatar name={e.user.name} size={32} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white">{e.user.tag}</div>
            <div className="truncate font-num text-xs text-zinc-400">
              {t.gallery ? `${formatNumber(e.votes)} votes` : formatMetric(challenge.typeId, e.value)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
